import Anthropic from '@anthropic-ai/sdk'
import type { CandidateProfile } from './candidates'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

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

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: `${SYSTEM_PROMPT}\n\n${contextBlock}`,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  })

  const block = response.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type from Claude')
  return block.text
}
