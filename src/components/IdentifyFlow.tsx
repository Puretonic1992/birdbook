import { useEffect, useState } from 'react'
import type { BirdIdentification, SpeciesInfo } from '../types/bird'
import { identifyBird, resolveIdProvider } from '../services/identify'
import { fetchSpeciesInfo } from '../services/wikipedia'
import { createId, fileToDataUrl } from '../services/storage'

interface IdentifyFlowProps {
  file: File
  previewUrl: string
  onCancel: () => void
  onSaved: (entryId: string) => void
  onSave: (entry: {
    id: string
    photoDataUrl: string
    createdAt: string
    updatedAt: string
    identification: BirdIdentification
    species: SpeciesInfo
    personalNotes: string
    locationLabel: string
  }) => Promise<void>
}

type Stage = 'reading' | 'looking-up' | 'ready' | 'error'

export function IdentifyFlow({
  file,
  previewUrl,
  onCancel,
  onSaved,
  onSave,
}: IdentifyFlowProps) {
  const [stage, setStage] = useState<Stage>('reading')
  const [error, setError] = useState<string | null>(null)
  const [identification, setIdentification] = useState<BirdIdentification | null>(null)
  const [species, setSpecies] = useState<SpeciesInfo | null>(null)
  const [personalNotes, setPersonalNotes] = useState('')
  const [locationLabel, setLocationLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const provider = resolveIdProvider()

  useEffect(() => {
    let cancelled = false

    async function run() {
      setStage('reading')
      setError(null)
      try {
        const id = await identifyBird(file)
        if (cancelled) return
        setIdentification(id)
        setStage('looking-up')
        const info = await fetchSpeciesInfo(id.commonName, id.scientificName)
        if (cancelled) return
        setSpecies(info)
        setStage('ready')
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Identification failed')
        setStage('error')
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [file])

  async function handleSave() {
    if (!identification || !species) return
    setSaving(true)
    try {
      const photoDataUrl = await fileToDataUrl(file)
      const now = new Date().toISOString()
      const id = createId()
      await onSave({
        id,
        photoDataUrl,
        createdAt: now,
        updatedAt: now,
        identification,
        species: {
          ...species,
          commonName: identification.commonName,
          scientificName: identification.scientificName,
        },
        personalNotes,
        locationLabel,
      })
      onSaved(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save entry')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="panel identify-panel">
      <header className="panel-head">
        <button type="button" className="text-link" onClick={onCancel}>
          ← Back
        </button>
        <h2>New sighting</h2>
        <p className="provider-chip">
          ID via <strong>{provider}</strong>
          {provider === 'mock' ? ' (demo)' : ''}
        </p>
      </header>

      <div className="identify-grid">
        <figure className="photo-frame">
          <img src={previewUrl} alt="Uploaded bird" />
        </figure>

        <div className="identify-body">
          {stage === 'reading' && (
            <div className="status-block" aria-live="polite">
              <div className="spinner" />
              <p>Reading plumage, posture, and light…</p>
            </div>
          )}
          {stage === 'looking-up' && identification && (
            <div className="status-block" aria-live="polite">
              <div className="spinner" />
              <p>
                Matched <em>{identification.commonName}</em>. Pulling field notes from Wikipedia…
              </p>
            </div>
          )}
          {stage === 'error' && (
            <div className="status-block error">
              <p>{error}</p>
              <button type="button" className="btn ghost" onClick={onCancel}>
                Try another photo
              </button>
            </div>
          )}
          {stage === 'ready' && identification && species && (
            <div className="result-sheet animate-in">
              <p className="eyebrow">Likely species</p>
              <h3>{identification.commonName}</h3>
              <p className="latin">{identification.scientificName}</p>
              <p className="confidence">
                Confidence {(identification.confidence * 100).toFixed(0)}%
                {identification.notes ? ` · ${identification.notes}` : ''}
              </p>
              <p className="description">{species.description}</p>
              {(species.habitat || species.range) && (
                <dl className="meta-list">
                  {species.habitat && (
                    <>
                      <dt>Habitat</dt>
                      <dd>{species.habitat}</dd>
                    </>
                  )}
                  {species.range && (
                    <>
                      <dt>Range</dt>
                      <dd>{species.range}</dd>
                    </>
                  )}
                </dl>
              )}

              <label className="field">
                <span>Where did you see it?</span>
                <input
                  value={locationLabel}
                  onChange={(e) => setLocationLabel(e.target.value)}
                  placeholder="Trail, park, backyard…"
                />
              </label>
              <label className="field">
                <span>Personal note</span>
                <textarea
                  value={personalNotes}
                  onChange={(e) => setPersonalNotes(e.target.value)}
                  rows={3}
                  placeholder="Behavior, weather, who you were with…"
                />
              </label>

              <div className="hero-actions">
                <button
                  type="button"
                  className="btn primary"
                  disabled={saving}
                  onClick={() => void handleSave()}
                >
                  {saving ? 'Saving…' : 'Pin to scrapbook'}
                </button>
                <button type="button" className="btn ghost" onClick={onCancel}>
                  Discard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
