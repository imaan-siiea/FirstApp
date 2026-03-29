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
  const profiles: CandidateProfile[] = []

  for (const contest of ballot.contests) {
    if (!contest.candidates) continue
    for (const c of contest.candidates) {
      const id = `civic:${c.name.toLowerCase().replace(/\s+/g, '-')}`
      const bio = await getBallotpediaCandidate(c.name)
      profiles.push({
        id,
        name: c.name,
        office: contest.office,
        state: contest.district?.id?.split('/')[2] ?? '',
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
      })
    }
  }

  return profiles
}
