import Groq from 'groq-sdk'
import type { CandidateProfile } from './candidates'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? 'placeholder' })

const SYSTEM_PROMPT = `You are a nonpartisan civic information guide for the VoterIQ app.
Your role is to help voters understand candidates and elections using only the provided candidate data.

Rules you must always follow:
- NEVER express a personal opinion on which candidate is better
- NEVER recommend or endorse any candidate
- NEVER add information not present in the provided candidate data
- ALWAYS cite your sources (e.g., "According to Ballotpedia...")
- If you don't have information to answer a question, say "I don't have verified information on that"
- Keep answers concise and factual
- Use plain language accessible to all voters`

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function getCountyElectionsSummary(stateCode: string, stateName: string): Promise<string> {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 600,
    messages: [
      {
        role: 'system',
        content: `You are a nonpartisan civic information assistant. Provide factual, concise information about local and county-level elections. Always note that users should verify with their county clerk or official state election website for the most current information.`,
      },
      {
        role: 'user',
        content: `What county, municipal, and local elections typically occur in ${stateName} (${stateCode})? What types of local offices are on the ballot (county commissioners, school boards, judges, sheriffs, etc.)? When do these elections typically happen? Keep the response to 3-4 short paragraphs and end with a reminder to check the official ${stateName} Secretary of State website for current election schedules.`,
      },
    ],
  })

  const text = response.choices[0]?.message?.content
  if (!text) throw new Error('Empty response from AI')
  return text
}

export async function getChatResponse(
  messages: ChatMessage[],
  candidates: CandidateProfile[],
): Promise<string> {
  const candidateContext = candidates.map(c => ({
    name: c.name,
    office: c.office,
    party: c.party ?? 'Not listed',
    bio: c.bio ?? 'No biography available',
    positions: c.positions,
    sources: c.sources,
    lastVerified: c.lastVerified,
  }))

  const contextBlock = `CANDIDATE DATA (use only this information):\n${JSON.stringify(candidateContext, null, 2)}`

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 1024,
    messages: [
      { role: 'system', content: `${SYSTEM_PROMPT}\n\n${contextBlock}` },
      ...messages.map(m => ({ role: m.role, content: m.content })),
    ],
  })

  const text = response.choices[0]?.message?.content
  if (!text) throw new Error('Empty response from AI')
  return text
}
