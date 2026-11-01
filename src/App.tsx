import { useMemo, useRef, useState } from 'react'
import type { AppView, ScrapbookEntry } from './types/bird'
import { useScrapbook } from './hooks/useScrapbook'
import { Hero } from './components/Hero'
import { Gallery } from './components/Gallery'
import { IdentifyFlow } from './components/IdentifyFlow'
import { DetailView } from './components/DetailView'
import { EditEntry } from './components/EditEntry'
import { UploadTrigger } from './components/UploadTrigger'
import { resolveIdProvider } from './services/identify'
import './index.css'

export default function App() {
  const { entries, loading, upsert, remove } = useScrapbook()
  const [view, setView] = useState<AppView>({ name: 'home' })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const provider = resolveIdProvider()

  const activeEntry = useMemo(() => {
    if (view.name !== 'detail' && view.name !== 'edit') return undefined
    return entries.find((e) => e.id === view.entryId)
  }, [entries, view])

  function startUpload() {
    fileInputRef.current?.click()
  }

  function onFile(file: File, previewUrl: string) {
    setView({ name: 'identify', file, previewUrl })
  }

  async function handleSave(entry: ScrapbookEntry) {
    await upsert(entry)
  }

  return (
    <div className="app-shell">
      <div className="atmosphere" aria-hidden />
      <header className="topbar">
        <button type="button" className="brand-lockup" onClick={() => setView({ name: 'home' })}>
          <span className="brand-glyph" aria-hidden>
            ⌘
          </span>
          Winged Journal
        </button>
        <nav className="top-nav">
          <button type="button" className="nav-link" onClick={() => setView({ name: 'gallery' })}>
            Scrapbook
          </button>
          <button type="button" className="nav-link accent" onClick={startUpload}>
            New sighting
          </button>
        </nav>
      </header>

      <main>
        {view.name === 'home' && (
          <>
            <Hero
              onStart={startUpload}
              onOpenGallery={() => setView({ name: 'gallery' })}
              entryCount={entries.length}
            />
            <section className="home-aside">
              <div className="aside-copy">
                <h2>How it works</h2>
                <ol>
                  <li>Upload a real bird photograph from your camera roll.</li>
                  <li>
                    Vision ID runs via {provider === 'mock' ? 'built-in demo matching' : provider}
                    {provider === 'mock'
                      ? ' (set VITE_OPENAI_API_KEY or VITE_ANTHROPIC_API_KEY for live vision).'
                      : '.'}
                  </li>
                  <li>Species notes are filled from the Wikipedia REST API.</li>
                  <li>Everything stays in your browser (IndexedDB) until you clear it.</li>
                </ol>
              </div>
              <div className="demo-strip">
                <p className="eyebrow">Try a demo photo</p>
                <div className="demo-thumbs">
                  {[
                    { src: '/demo/demo-robin.jpg', name: 'Robin' },
                    { src: '/demo/demo-cardinal.jpg', name: 'Cardinal' },
                    { src: '/demo/demo-bluejay.jpg', name: 'Blue Jay' },
                  ].map((demo) => (
                    <button
                      key={demo.src}
                      type="button"
                      className="demo-thumb"
                      onClick={async () => {
                        const res = await fetch(demo.src)
                        const blob = await res.blob()
                        const file = new File([blob], `${demo.name.toLowerCase().replace(/\s+/g, '-')}.jpg`, {
                          type: blob.type || 'image/jpeg',
                        })
                        onFile(file, URL.createObjectURL(file))
                      }}
                    >
                      <img src={demo.src} alt={demo.name} />
                      <span>{demo.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        {view.name === 'identify' && (
          <IdentifyFlow
            file={view.file}
            previewUrl={view.previewUrl}
            onCancel={() => {
              URL.revokeObjectURL(view.previewUrl)
              setView({ name: 'home' })
            }}
            onSave={handleSave}
            onSaved={(entryId) => {
              URL.revokeObjectURL(view.previewUrl)
              setView({ name: 'detail', entryId })
            }}
          />
        )}

        {view.name === 'gallery' && (
          <Gallery
            entries={entries}
            loading={loading}
            onOpen={(id) => setView({ name: 'detail', entryId: id })}
            onAdd={startUpload}
            onHome={() => setView({ name: 'home' })}
          />
        )}

        {view.name === 'detail' && activeEntry && (
          <DetailView
            entry={activeEntry}
            onBack={() => setView({ name: 'gallery' })}
            onEdit={() => setView({ name: 'edit', entryId: activeEntry.id })}
            onDelete={() => {
              void remove(activeEntry.id).then(() => setView({ name: 'gallery' }))
            }}
          />
        )}

        {view.name === 'detail' && !activeEntry && !loading && (
          <section className="panel">
            <p>Entry not found.</p>
            <button type="button" className="btn ghost" onClick={() => setView({ name: 'gallery' })}>
              Back to scrapbook
            </button>
          </section>
        )}

        {view.name === 'edit' && activeEntry && (
          <EditEntry
            entry={activeEntry}
            onCancel={() => setView({ name: 'detail', entryId: activeEntry.id })}
            onSave={async (next) => {
              await handleSave(next)
              setView({ name: 'detail', entryId: next.id })
            }}
          />
        )}
      </main>

      <footer className="site-foot">
        <span>Winged Journal · personal bird scrapbook</span>
        <span>Provider: {provider}</span>
      </footer>

      <UploadTrigger hidden triggerRef={fileInputRef} onFile={onFile} />
    </div>
  )
}
