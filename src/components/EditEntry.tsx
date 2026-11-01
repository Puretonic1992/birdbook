import { useState } from 'react'
import type { ScrapbookEntry } from '../types/bird'
import { fetchSpeciesInfo } from '../services/wikipedia'

interface EditEntryProps {
  entry: ScrapbookEntry
  onCancel: () => void
  onSave: (entry: ScrapbookEntry) => Promise<void>
}

export function EditEntry({ entry, onCancel, onSave }: EditEntryProps) {
  const [commonName, setCommonName] = useState(entry.species.commonName)
  const [scientificName, setScientificName] = useState(entry.species.scientificName)
  const [description, setDescription] = useState(entry.species.description)
  const [habitat, setHabitat] = useState(entry.species.habitat ?? '')
  const [range, setRange] = useState(entry.species.range ?? '')
  const [locationLabel, setLocationLabel] = useState(entry.locationLabel)
  const [personalNotes, setPersonalNotes] = useState(entry.personalNotes)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function refetchWiki() {
    setBusy(true)
    setMessage(null)
    try {
      const info = await fetchSpeciesInfo(commonName, scientificName)
      setDescription(info.description)
      setHabitat(info.habitat ?? '')
      setRange(info.range ?? '')
      if (info.scientificName) setScientificName(info.scientificName)
      setMessage('Refreshed from Wikipedia.')
    } catch {
      setMessage('Could not refresh Wikipedia data.')
    } finally {
      setBusy(false)
    }
  }

  async function handleSave() {
    setBusy(true)
    try {
      await onSave({
        ...entry,
        updatedAt: new Date().toISOString(),
        locationLabel,
        personalNotes,
        identification: {
          ...entry.identification,
          commonName,
          scientificName,
          notes: 'Corrected by user',
        },
        species: {
          ...entry.species,
          commonName,
          scientificName,
          description,
          habitat: habitat || undefined,
          range: range || undefined,
        },
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="panel edit-panel">
      <header className="panel-head">
        <button type="button" className="text-link" onClick={onCancel}>
          ← Cancel
        </button>
        <h2>Correct species</h2>
        <p className="muted">Fix a mis-ID or enrich the field notes.</p>
      </header>

      <div className="edit-layout">
        <figure className="photo-frame">
          <img src={entry.photoDataUrl} alt={commonName} />
        </figure>
        <div className="edit-form">
          <label className="field">
            <span>Common name</span>
            <input value={commonName} onChange={(e) => setCommonName(e.target.value)} />
          </label>
          <label className="field">
            <span>Scientific name</span>
            <input value={scientificName} onChange={(e) => setScientificName(e.target.value)} />
          </label>
          <label className="field">
            <span>Description</span>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <label className="field">
            <span>Habitat</span>
            <input value={habitat} onChange={(e) => setHabitat(e.target.value)} />
          </label>
          <label className="field">
            <span>Range</span>
            <input value={range} onChange={(e) => setRange(e.target.value)} />
          </label>
          <label className="field">
            <span>Seen at</span>
            <input value={locationLabel} onChange={(e) => setLocationLabel(e.target.value)} />
          </label>
          <label className="field">
            <span>Personal note</span>
            <textarea
              rows={3}
              value={personalNotes}
              onChange={(e) => setPersonalNotes(e.target.value)}
            />
          </label>

          {message && <p className="muted">{message}</p>}

          <div className="hero-actions">
            <button
              type="button"
              className="btn primary"
              disabled={busy}
              onClick={() => void handleSave()}
            >
              Save corrections
            </button>
            <button
              type="button"
              className="btn ghost"
              disabled={busy}
              onClick={() => void refetchWiki()}
            >
              Re-fetch Wikipedia
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
