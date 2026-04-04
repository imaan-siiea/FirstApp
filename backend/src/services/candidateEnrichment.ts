import got from 'got'
import { cacheGet, cacheSet } from '../cache'

const PHOTO_CACHE_TTL = 60 * 60 * 24 * 7 // 7 days

function bioguidPhotoUrl(bioguidId: string): string {
  return `https://bioguide.congress.gov/photo/${bioguidId}.jpg`
}

async function lookupBioguidId(name: string): Promise<string | null> {
  const cacheKey = `bioguide:lookup:${name.toLowerCase().replace(/\s+/g, '-')}`
  const cached = await cacheGet<string>(cacheKey)
  if (cached) return cached

  try {
    const parts = name.trim().split(' ')
    const last = parts[parts.length - 1]
    const first = parts[0]
    const response = await got('https://api.congress.gov/v3/member', {
      searchParams: { format: 'json', limit: 20 },
    }).json<any>()
    const members: any[] = response.members ?? []
    const match = members.find((m: any) => {
      const fullName = `${m.name ?? ''}`.toLowerCase()
      return fullName.includes(last.toLowerCase()) && fullName.includes(first.toLowerCase())
    })
    if (!match?.bioguideId) return null
    await cacheSet(cacheKey, match.bioguideId, PHOTO_CACHE_TTL)
    return match.bioguideId
  } catch {
    return null
  }
}

export async function getEnrichedPhotoUrl(
  name: string,
  currentPhotoUrl?: string,
): Promise<string | undefined> {
  if (currentPhotoUrl) return currentPhotoUrl

  const cacheKey = `enrich:photo:${name.toLowerCase().replace(/\s+/g, '-')}`
  const cached = await cacheGet<string>(cacheKey)
  if (cached) return cached === 'none' ? undefined : cached

  const bioguidId = await lookupBioguidId(name)
  if (bioguidId) {
    const url = bioguidPhotoUrl(bioguidId)
    try {
      await got.head(url)
      await cacheSet(cacheKey, url, PHOTO_CACHE_TTL)
      return url
    } catch {
      // photo not found
    }
  }

  await cacheSet(cacheKey, 'none', 60 * 60 * 6)
  return undefined
}

export async function getAiExtractedPositions(
  name: string,
  office: string,
  bio: string,
): Promise<import('./candidates').CandidatePosition[]> {
  if (!bio || bio.length < 50) return []

  const cacheKey = `enrich:positions:${name.toLowerCase().replace(/\s+/g, '-')}`
  const cached = await cacheGet<import('./candidates').CandidatePosition[]>(cacheKey)
  if (cached) return cached

  try {
    const { default: Groq } = await import('groq-sdk')
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? 'placeholder' })

    const prompt = `Extract policy positions for ${name} (${office}) from this biography.
Return a JSON array only (max 6 items). Each item must have: {"issue": string, "position": string, "year": string}.
Use only information explicitly stated in the bio. If nothing policy-related is mentioned, return [].
Issues to look for: Healthcare, Economy, Education, Immigration, Environment, Veterans, Gun Policy, Foreign Policy.

Biography:
${bio.slice(0, 1000)}`

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.choices[0]?.message?.content ?? '[]'
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return []

    const raw: { issue: string; position: string; year?: string }[] = JSON.parse(jsonMatch[0])
    const positions: import('./candidates').CandidatePosition[] = raw.slice(0, 6).map(p => ({
      issue: p.issue,
      position: p.position,
      source: 'Ballotpedia (AI-extracted)',
      year: p.year ?? new Date().getFullYear().toString(),
      confidence: 'low' as const,
    }))

    await cacheSet(cacheKey, positions, 60 * 60 * 6)
    return positions
  } catch {
    return []
  }
}
