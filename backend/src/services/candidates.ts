import { getBallotForAddress } from './civicApi'
import { getBallotpediaCandidate } from './ballotpedia'
import { getEnrichedPhotoUrl, getAiExtractedPositions } from './candidateEnrichment'

export interface CandidatePosition {
  issue: string
  position: string
  source: string
  year: string
  confidence: 'high' | 'medium' | 'low'
}

export interface CandidateProfile {
  id: string
  name: string
  office: string
  state: string
  district?: string
  party?: string
  bio?: string
  photoUrl?: string
  websiteUrl?: string
  positions: CandidatePosition[]
  sources: { name: string; url: string; fetchedAt: string }[]
  dataConfidence: 'high' | 'medium' | 'low'
  lastVerified: string
}

export async function getCandidatesForBallot(address: string): Promise<CandidateProfile[]> {
  const ballot = await getBallotForAddress(address)
  const allCandidates: {
    name: string; party?: string; candidateUrl?: string; photoUrl?: string; office: string; district: any
  }[] = []

  for (const contest of ballot.contests) {
    if (!contest.candidates) continue
    for (const c of contest.candidates) {
      allCandidates.push({ ...c, office: contest.office, district: contest.district })
    }
  }

  const enriched = await Promise.all(
    allCandidates.map(async (c) => {
      const [bio, photoUrl] = await Promise.all([
        getBallotpediaCandidate(c.name).catch(() => null),
        getEnrichedPhotoUrl(c.name, c.photoUrl).catch(() => c.photoUrl),
      ])

      const aiPositions = bio?.extract
        ? await getAiExtractedPositions(c.name, c.office, bio.extract).catch(() => [])
        : []

      const id = `civic:${c.name.toLowerCase().replace(/\s+/g, '-')}`
      return {
        id,
        name: c.name,
        office: c.office,
        state: c.district?.id?.split('/')[2] ?? '',
        party: c.party,
        bio: bio?.extract,
        photoUrl,
        websiteUrl: c.candidateUrl ?? bio?.fullurl,
        positions: aiPositions,
        sources: bio
          ? [{ name: 'Ballotpedia', url: bio.fullurl, fetchedAt: new Date().toISOString() }]
          : [],
        dataConfidence: bio ? ('medium' as const) : ('low' as const),
        lastVerified: new Date().toISOString(),
      } satisfies CandidateProfile
    })
  )

  return enriched
}

export async function getCandidateById(id: string, address: string): Promise<CandidateProfile | null> {
  const candidates = await getCandidatesForBallot(address)
  return candidates.find(c => c.id === id) ?? null
}
