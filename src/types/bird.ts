export type IdProvider = 'openai' | 'anthropic' | 'mock'

export interface BirdIdentification {
  commonName: string
  scientificName: string
  confidence: number
  provider: IdProvider
  notes?: string
}

export interface SpeciesInfo {
  commonName: string
  scientificName: string
  description: string
  habitat?: string
  range?: string
  wikipediaUrl?: string
  thumbnailUrl?: string
}

export interface ScrapbookEntry {
  id: string
  photoDataUrl: string
  createdAt: string
  updatedAt: string
  identification: BirdIdentification
  species: SpeciesInfo
  personalNotes: string
  locationLabel: string
}

export type AppView =
  | { name: 'home' }
  | { name: 'identify'; previewUrl: string; file: File }
  | { name: 'gallery' }
  | { name: 'detail'; entryId: string }
  | { name: 'edit'; entryId: string }
