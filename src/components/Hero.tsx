import heroImage from '../assets/hero-field.jpg'

interface HeroProps {
  onStart: () => void
  onOpenGallery: () => void
  entryCount: number
}

export function Hero({ onStart, onOpenGallery, entryCount }: HeroProps) {
  return (
    <section className="hero" aria-label="Winged Journal home">
      <div className="hero-media" style={{ backgroundImage: `url(${heroImage})` }} />
      <div className="hero-veil" />
      <div className="hero-copy">
        <p className="brand-mark">Winged Journal</p>
        <h1>Press a feather of light into the page.</h1>
        <p className="lede">
          Photograph a bird, let the journal name it, and keep a living field scrapbook of every
          encounter.
        </p>
        <div className="hero-actions">
          <button type="button" className="btn primary" onClick={onStart}>
            Add a sighting
          </button>
          <button type="button" className="btn ghost" onClick={onOpenGallery}>
            Open scrapbook{entryCount > 0 ? ` (${entryCount})` : ''}
          </button>
        </div>
      </div>
    </section>
  )
}
