import type { BirdIdentification, IdProvider } from '../types/bird'

const MOCK_CATALOG: Array<Omit<BirdIdentification, 'provider'>> = [
  {
    commonName: 'American Robin',
    scientificName: 'Turdus migratorius',
    confidence: 0.91,
    notes: 'Demo mode matched by filename / image cues.',
  },
  {
    commonName: 'Northern Cardinal',
    scientificName: 'Cardinalis cardinalis',
    confidence: 0.94,
    notes: 'Demo mode matched by filename / image cues.',
  },
  {
    commonName: 'Blue Jay',
    scientificName: 'Cyanocitta cristata',
    confidence: 0.89,
    notes: 'Demo mode matched by filename / image cues.',
  },
  {
    commonName: 'Black-capped Chickadee',
    scientificName: 'Poecile atricapillus',
    confidence: 0.86,
    notes: 'Demo fallback species.',
  },
  {
    commonName: 'Mallard',
    scientificName: 'Anas platyrhynchos',
    confidence: 0.88,
    notes: 'Demo fallback species.',
  },
]

function fileToBase64(file: File): Promise<{ mime: string; data: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result ?? '')
      const match = /^data:([^;]+);base64,(.+)$/.exec(result)
      if (!match) {
        reject(new Error('Could not read image as base64'))
        return
      }
      resolve({ mime: match[1], data: match[2] })
    }
    reader.onerror = () => reject(reader.error ?? new Error('File read failed'))
    reader.readAsDataURL(file)
  })
}

function pickMock(file: File): BirdIdentification {
  const name = file.name.toLowerCase()
  const hit =
    MOCK_CATALOG.find((b) => name.includes(b.commonName.split(' ').pop()!.toLowerCase())) ??
    MOCK_CATALOG.find((b) =>
      name.includes(b.commonName.toLowerCase().replace(/\s+/g, '')),
    ) ??
    MOCK_CATALOG[
      Math.abs(
        [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0),
      ) % MOCK_CATALOG.length
    ]

  return { ...hit, provider: 'mock' }
}

async function identifyWithOpenAI(file: File, apiKey: string): Promise<BirdIdentification> {
  const { mime, data } = await fileToBase64(file)
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: import.meta.env.VITE_OPENAI_VISION_MODEL || 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You identify birds from photos. Reply JSON only: {"commonName":string,"scientificName":string,"confidence":number,"notes":string}. If unsure, still give best guess with low confidence.',
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Identify the bird in this photo.' },
            {
              type: 'image_url',
              image_url: { url: `data:${mime};base64,${data}` },
            },
          ],
        },
      ],
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OpenAI vision failed (${res.status}): ${text.slice(0, 200)}`)
  }

  const json = await res.json()
  const content = json.choices?.[0]?.message?.content
  const parsed = JSON.parse(content)
  return {
    commonName: parsed.commonName,
    scientificName: parsed.scientificName,
    confidence: Number(parsed.confidence) || 0.5,
    notes: parsed.notes,
    provider: 'openai',
  }
}

async function identifyWithAnthropic(file: File, apiKey: string): Promise<BirdIdentification> {
  const { mime, data } = await fileToBase64(file)
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: import.meta.env.VITE_ANTHROPIC_VISION_MODEL || 'claude-sonnet-4-5',
      max_tokens: 400,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mime, data },
            },
            {
              type: 'text',
              text: 'Identify the bird. Reply with JSON only: {"commonName":string,"scientificName":string,"confidence":number,"notes":string}',
            },
          ],
        },
      ],
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Anthropic vision failed (${res.status}): ${text.slice(0, 200)}`)
  }

  const json = await res.json()
  const textBlock = json.content?.find((c: { type: string }) => c.type === 'text')
  const raw = String(textBlock?.text ?? '').replace(/```json|```/g, '').trim()
  const parsed = JSON.parse(raw)
  return {
    commonName: parsed.commonName,
    scientificName: parsed.scientificName,
    confidence: Number(parsed.confidence) || 0.5,
    notes: parsed.notes,
    provider: 'anthropic',
  }
}

export function resolveIdProvider(): IdProvider {
  if (import.meta.env.VITE_OPENAI_API_KEY) return 'openai'
  if (import.meta.env.VITE_ANTHROPIC_API_KEY) return 'anthropic'
  return 'mock'
}

export async function identifyBird(file: File): Promise<BirdIdentification> {
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined
  const anthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined

  if (openaiKey) {
    try {
      return await identifyWithOpenAI(file, openaiKey)
    } catch (err) {
      console.warn('OpenAI identify failed, falling back to mock', err)
    }
  }

  if (anthropicKey) {
    try {
      return await identifyWithAnthropic(file, anthropicKey)
    } catch (err) {
      console.warn('Anthropic identify failed, falling back to mock', err)
    }
  }

  // Simulate a short “looking” pause in demo mode
  await new Promise((r) => setTimeout(r, 900))
  return pickMock(file)
}
