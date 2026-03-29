import { getBallotForAddress } from './civicApi'
import { getBallotpediaCandidate } from './ballotpedia'

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
  positions: { issue: string; position: string; source: string }[]
  sources: { name: string; url: string; fetchedAt: string }[]
  dataConfidence: 'high' | 'medium' | 'low'
  lastVerified: string
}

export async function getCandidatesForBallot(address: string): Promise<CandidateProfile[]> {
  const ballot = await getBallotForAddress(address)
  const allCandidates: { name: string; party?: string; candidateUrl?: string; photoUrl?: string; office: string; district: any }[] = []

  for (const contest of ballot.contests) {
    if (!contest.candidates) continue
    for (const c of contest.candidates) {
      allCandidates.push({ ...c, office: contest.office, district: contest.district })
    }
  }

  // Fetch all Ballotpedia bios in parallel instead of sequential await
  const bioResults = await Promise.all(
    allCandidates.map(c => getBallotpediaCandidate(c.name).catch(() => null))
  )

  return allCandidates.map((c, i) => {
    const bio = bioResults[i]
    const id = `civic:${c.name.toLowerCase().replace(/\s+/g, '-')}`
    return {
      id,
      name: c.name,
      office: c.office,
      state: c.district?.id?.split('/')[2] ?? '',
      party: c.party,
      bio: bio?.extract,
      photoUrl: c.photoUrl,
      websiteUrl: c.candidateUrl ?? bio?.fullurl,
      positions: [],
      sources: bio
        ? [{ name: 'Ballotpedia', url: bio.fullurl, fetchedAt: new Date().toISOString() }]
        : [],
      dataConfidence: bio ? 'medium' : 'low',
      lastVerified: new Date().toISOString(),
    }
  })
}

export async function getCandidateById(id: string, address: string): Promise<CandidateProfile | null> {
  const candidates = await getCandidatesForBallot(address)
  return candidates.find(c => c.id === id) ?? null
}
