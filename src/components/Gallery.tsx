import type { ScrapbookEntry } from '../types/bird'

interface GalleryProps {
  entries: ScrapbookEntry[]
  loading: boolean
  onOpen: (id: string) => void
  onAdd: () => void
  onHome: () => void
}

export function Gallery({ entries, loading, onOpen, onAdd, onHome }: GalleryProps) {
  return (
    <section className="panel gallery-panel">
      <header className="panel-head row">
        <div>
          <button type="button" className="text-link" onClick={onHome}>
            ← Home
          </button>
          <h2>Scrapbook</h2>
          <p className="muted">
            {loading
              ? 'Opening pages…'
              : entries.length === 0
                ? 'No sightings yet — start with a photo.'
                : `${entries.length} pressed specimen${entries.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <button type="button" className="btn primary" onClick={onAdd}>
          Add sighting
        </button>
      </header>

      {entries.length > 0 && (
        <ul className="gallery-grid">
          {entries.map((entry, index) => (
            <li key={entry.id} style={{ animationDelay: `${index * 60}ms` }}>
              <button type="button" className="specimen-card" onClick={() => onOpen(entry.id)}>
                <img src={entry.photoDataUrl} alt={entry.species.commonName} />
                <div className="specimen-meta">
                  <strong>{entry.species.commonName}</strong>
                  <em>{entry.species.scientificName}</em>
                  <span>
                    {new Date(entry.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!loading && entries.length === 0 && (
        <div className="empty-state">
          <p>Your journal is blank parchment.</p>
          <button type="button" className="btn primary" onClick={onAdd}>
            Upload a bird photo
          </button>
        </div>
      )}
    </section>
  )
}
