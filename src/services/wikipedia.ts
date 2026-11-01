import type { SpeciesInfo } from '../types/bird'

interface WikiSummary {
  title: string
  extract: string
  description?: string
  content_urls?: { desktop?: { page?: string } }
  thumbnail?: { source?: string }
  originalimage?: { source?: string }
}

const FALLBACK: Record<string, SpeciesInfo> = {
  'american robin': {
    commonName: 'American Robin',
    scientificName: 'Turdus migratorius',
    description:
      'A migratory songbird of the thrush family, familiar across North America for its brick-red breast and dawn chorus.',
    habitat: 'Lawns, gardens, woodland edges, and parks.',
    range: 'Breeds across Canada and the U.S.; winters into Mexico and the southern U.S.',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/American_robin',
  },
  'northern cardinal': {
    commonName: 'Northern Cardinal',
    scientificName: 'Cardinalis cardinalis',
    description:
      'A medium-sized songbird; males are vivid red with a black face mask, females warm tan with red accents.',
    habitat: 'Thickets, woodland edges, gardens, and shrubby yards.',
    range: 'Eastern and central North America into Mexico and Central America.',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Northern_cardinal',
  },
  'blue jay': {
    commonName: 'Blue Jay',
    scientificName: 'Cyanocitta cristata',
    description:
      'A bold, crested corvid with blue, white, and black plumage and a noisy, varied call repertoire.',
    habitat: 'Mixed forests, oak woods, parks, and suburban neighborhoods.',
    range: 'Eastern and central North America.',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Blue_jay',
  },
}

function normalizeKey(name: string): string {
  return name.trim().toLowerCase()
}

function extractHabitat(extract: string): string | undefined {
  const match = extract.match(/(?:habitat|lives? in|found in|inhabits)\s+([^.]+)/i)
  return match ? match[1].trim() : undefined
}

function extractRange(extract: string): string | undefined {
  const match = extract.match(/(?:range|native to|distributed across|occurs? (?:from|in))\s+([^.]+)/i)
  return match ? match[1].trim() : undefined
}

export async function fetchSpeciesInfo(
  commonName: string,
  scientificName: string,
): Promise<SpeciesInfo> {
  const queries = [commonName, scientificName, `${commonName} bird`].filter(Boolean)

  for (const q of queries) {
    try {
      const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
        q.replace(/\s+/g, '_'),
      )}`
      const res = await fetch(summaryUrl, {
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) continue
      const data = (await res.json()) as WikiSummary
      if (!data.extract) continue

      return {
        commonName,
        scientificName,
        description: data.extract.slice(0, 520),
        habitat: extractHabitat(data.extract),
        range: extractRange(data.extract),
        wikipediaUrl: data.content_urls?.desktop?.page,
        thumbnailUrl: data.thumbnail?.source ?? data.originalimage?.source,
      }
    } catch (err) {
      console.warn('Wikipedia lookup failed for', q, err)
    }
  }

  // Search API fallback
  try {
    const searchUrl = `https://en.wikipedia.org/w/rest.php/v1/search/title?q=${encodeURIComponent(
      `${commonName} bird`,
    )}&limit=1`
    const searchRes = await fetch(searchUrl)
    if (searchRes.ok) {
      const searchJson = await searchRes.json()
      const title = searchJson.pages?.[0]?.title as string | undefined
      if (title) {
        const summaryRes = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
        )
        if (summaryRes.ok) {
          const data = (await summaryRes.json()) as WikiSummary
          return {
            commonName,
            scientificName,
            description: data.extract?.slice(0, 520) || 'No Wikipedia extract available.',
            habitat: data.extract ? extractHabitat(data.extract) : undefined,
            range: data.extract ? extractRange(data.extract) : undefined,
            wikipediaUrl: data.content_urls?.desktop?.page,
            thumbnailUrl: data.thumbnail?.source,
          }
        }
      }
    }
  } catch (err) {
    console.warn('Wikipedia search failed', err)
  }

  const fallback = FALLBACK[normalizeKey(commonName)]
  if (fallback) {
    return { ...fallback, scientificName: scientificName || fallback.scientificName }
  }

  return {
    commonName,
    scientificName,
    description: 'Species details could not be fetched. You can edit this entry manually.',
  }
}
