import type { ScrapbookEntry } from '../types/bird'

interface DetailViewProps {
  entry: ScrapbookEntry
  onBack: () => void
  onEdit: () => void
  onDelete: () => void
}

export function DetailView({ entry, onBack, onEdit, onDelete }: DetailViewProps) {
  return (
    <section className="panel detail-panel">
      <header className="panel-head row">
        <div>
          <button type="button" className="text-link" onClick={onBack}>
            ← Scrapbook
          </button>
          <h2>{entry.species.commonName}</h2>
          <p className="latin">{entry.species.scientificName}</p>
        </div>
        <div className="hero-actions">
          <button type="button" className="btn ghost" onClick={onEdit}>
            Edit / correct
          </button>
          <button type="button" className="btn danger" onClick={onDelete}>
            Remove
          </button>
        </div>
      </header>

      <div className="detail-grid">
        <figure className="photo-frame large">
          <img src={entry.photoDataUrl} alt={entry.species.commonName} />
        </figure>
        <article className="detail-copy">
          <p className="description">{entry.species.description}</p>
          <dl className="meta-list">
            {entry.species.habitat && (
              <>
                <dt>Habitat</dt>
                <dd>{entry.species.habitat}</dd>
              </>
            )}
            {entry.species.range && (
              <>
                <dt>Range</dt>
                <dd>{entry.species.range}</dd>
              </>
            )}
            {entry.locationLabel && (
              <>
                <dt>Seen at</dt>
                <dd>{entry.locationLabel}</dd>
              </>
            )}
            <dt>Identified by</dt>
            <dd>
              {entry.identification.provider}
              {' · '}
              {(entry.identification.confidence * 100).toFixed(0)}% confidence
            </dd>
            <dt>Logged</dt>
            <dd>{new Date(entry.createdAt).toLocaleString()}</dd>
          </dl>
          {entry.personalNotes && (
            <blockquote className="note-block">
              <p>{entry.personalNotes}</p>
            </blockquote>
          )}
          {entry.species.wikipediaUrl && (
            <a
              className="text-link external"
              href={entry.species.wikipediaUrl}
              target="_blank"
              rel="noreferrer"
            >
              Read more on Wikipedia →
            </a>
          )}
        </article>
      </div>
    </section>
  )
}
