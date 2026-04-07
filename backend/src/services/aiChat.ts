import Groq from 'groq-sdk'
import type { CandidateProfile } from './candidates'
import { getNewsContextForPolling } from './newsRss'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? 'placeholder' })

const BALLOT_PROMPT = `You are a nonpartisan civic information guide for the VoterIQ app.
Your role is to help voters understand candidates and elections using the provided candidate data.

Rules:
- NEVER express a personal opinion on which candidate is better
- NEVER recommend or endorse any candidate
- Prefer information from the provided candidate data, but you may supplement with general knowledge
- ALWAYS cite your sources when possible
- Keep answers concise and factual
- Use plain language accessible to all voters`

const GENERAL_CIVIC_PROMPT = `You are a nonpartisan civic information guide for the VoterIQ app.
Help voters understand elections, candidates, voting procedures, voter registration, and civic issues.

Rules:
- NEVER express a personal opinion on which candidate is better or endorse anyone
- Be factual, balanced, and accessible to all voters
- Draw on your training knowledge to answer civic and election questions
- Cite sources and note when information may be time-sensitive
- Keep answers concise and helpful`

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

export interface RepProfileData {
  background: string
  policies: string[]
  highlights: string[]
  funFacts: string[]
}

export async function getRepProfile(
  name: string, state: string, chamber: string, party: string,
): Promise<RepProfileData> {
  const chamberName =
    chamber === 'us_senate' ? 'U.S. Senator' :
    chamber === 'governor'  ? 'Governor' :
    chamber === 'upper'     ? 'State Senator' : 'State Representative'
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 700,
    messages: [
      {
        role: 'system',
        content: 'You are a nonpartisan political encyclopedia. Provide accurate, balanced, factual information. Never express partisan bias. If unsure of specific details, give general information about the role rather than fabricating facts. Respond ONLY with valid JSON — no markdown, no explanation.',
      },
      {
        role: 'user',
        content: `Non-partisan profile for ${name}, ${party} ${chamberName} from ${state}. Return ONLY this JSON:\n{"background":"2-3 sentences on career/education before politics","policies":["Key legislative focus area 1","Key legislative focus area 2","Key legislative focus area 3"],"highlights":["Notable bill, vote, or achievement","Another accomplishment"],"funFacts":["Interesting personal or professional fact","Another interesting fact"]}`,
      },
    ],
  })
  const text = response.choices[0]?.message?.content?.trim() ?? ''
  try {
    return JSON.parse(text)
  } catch {
    return {
      background: `${name} serves as a ${party} ${chamberName} representing ${state}.`,
      policies: ['State legislation', 'Constituent services', 'Committee work'],
      highlights: [`Elected to serve in the ${chamberName}`],
      funFacts: [`Represents constituents in ${state}`],
    }
  }
}

export interface PollingCandidate {
  name: string
  party: string
  polling: number
  trend: 'up' | 'down' | 'stable'
}

export interface PollingRace {
  office: string
  cycle: string
  candidates: PollingCandidate[]
  rating: string
  rationale: string
}

export interface PollingOutlook {
  races: PollingRace[]
  outlook: string
  dataNote: string
}

export async function getPollingOutlook(stateCode: string, stateName: string): Promise<PollingOutlook> {
  // Fetch recent news in parallel with the AI call setup
  const newsContext = await getNewsContextForPolling(stateCode)

  const newsBlock = newsContext
    ? `\n\n${newsContext}\n\nIMPORTANT: If the news above mentions specific polling numbers, candidate names, or race developments, use those real figures in your response. They are more current than your training data.`
    : ''

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 900,
    messages: [
      {
        role: 'system',
        content: 'You are a nonpartisan political analyst. Provide accurate, factual race data based on actual incumbent names, real polling averages, and official Cook Political Report / Sabato\'s Crystal Ball ratings. When recent news with polling numbers is provided, prioritize that data over your training knowledge. Never fabricate candidates. Respond ONLY with valid JSON — no markdown, no explanation.',
      },
      {
        role: 'user',
        content: `Generate an accurate 2026 election outlook for ${stateName} (${stateCode}).${newsBlock}

IMPORTANT CONTEXT FOR 2026:
- The 2026 midterms are a Class 2 Senate cycle. Only states with Class 2 senators have Senate races.
- Class 2 senators (up in 2026) include: AK (Sullivan), AL (Shelby seat - now Tommy Tuberville is Class 3; Shelby retired 2022 - skip), AR (Boozman), CO (Bennet), GA (Ossoff), IA (Grassley), ID (Risch), IL (Durbin - retiring), KS (Moran), KY (Paul), LA (Cassidy), ME (Collins), NC (Tillis), NH (Shaheen), NJ (Booker), NM (Heinrich), NV (Cortez Masto), NY (Schumer), OK (Lankford), OR (Wyden - retiring), SC (Scott), SD (Rounds), TN (Blackburn), TX (Cornyn), UT (Lee), VA (Warner), WI (Baldwin).
- Only include a Senate race if ${stateCode} is in that list above.
- For Governor races, check if ${stateCode} has a governor election in 2026 (36 states do).
- Use real incumbent names. Use actual Cook Political Report ratings where known.
- Base polling numbers on recent news above if available, otherwise use 2022/2024 election results as baseline.

Return ONLY this JSON (include 1-3 races max; omit empty arrays):
{
  "races": [
    {
      "office": "U.S. Senate",
      "cycle": "2026",
      "candidates": [
        {"name": "Actual Incumbent Name", "party": "Republican", "polling": 52, "trend": "stable"},
        {"name": "Challenger Name or TBD (Democratic nominee)", "party": "Democratic", "polling": 44, "trend": "up"}
      ],
      "rating": "Likely Republican",
      "rationale": "2-3 sentence explanation citing incumbency, state lean, and recent polling."
    }
  ],
  "outlook": "1-2 sentence overall summary of ${stateName}'s 2026 electoral outlook.",
  "dataNote": "Based on polling data and race ratings through mid-2025. Candidates subject to change."
}

Rating must be exactly one of: "Safe Republican", "Likely Republican", "Lean Republican", "Toss-Up", "Lean Democratic", "Likely Democratic", "Safe Democratic".`,
      },
    ],
  })

  const text = response.choices[0]?.message?.content?.trim() ?? ''
  try {
    return JSON.parse(text)
  } catch {
    return {
      races: [],
      outlook: `Polling data for ${stateName} is not currently available.`,
      dataNote: 'AI-generated estimate based on historical patterns.',
    }
  }
}

export async function generateStateBriefing(
  stateCode: string,
  stateName: string,
  count: number,
): Promise<import('./newsRss').NewsArticle[]> {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 600,
    messages: [
      {
        role: 'system',
        content: 'You are a nonpartisan political analyst. Provide factual, accurate information about U.S. elections. Respond ONLY with valid JSON — no markdown, no explanation.',
      },
      {
        role: 'user',
        content: `Generate ${count} concise political briefing items about ${stateName} (${stateCode}) for the 2026 election cycle.
Focus on: actual races happening, real incumbents, upcoming primaries, key issues in the state.
Be factual and specific — use real names, real races, real political context.

Return ONLY a JSON array:
[
  {
    "title": "Specific headline about a real race or political development",
    "description": "2-3 sentence factual summary with real names, polling context, and race dynamics.",
    "topic": "e.g. U.S. Senate Race / Governor Race / House District / Ballot Initiative"
  }
]`,
      },
    ],
  })

  const text = response.choices[0]?.message?.content?.trim() ?? ''
  try {
    const items = JSON.parse(text) as { title: string; description: string; topic: string }[]
    return items.map(item => ({
      title: item.title,
      url: '',
      source: 'VoterIQ Analysis',
      description: item.description,
      publishedAt: new Date().toUTCString(),
      isAnalysis: true,
    }))
  } catch {
    return []
  }
}

export async function getStateTrends(stateCode: string, stateName: string): Promise<string> {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 400,
    messages: [
      {
        role: 'system',
        content: 'You are a nonpartisan political analyst. Provide factual, balanced analysis of political trends. No partisan bias.',
      },
      {
        role: 'user',
        content: `In 2-3 short paragraphs, describe the recent political landscape in ${stateName} (${stateCode}): which parties have been competitive, any notable shifts in recent years, key regional or demographic patterns. Be strictly factual.`,
      },
    ],
  })
  const text = response.choices[0]?.message?.content
  if (!text) throw new Error('Empty response')
  return text
}

export interface RepContext {
  name: string
  party: string
  chamber: string
  district: string
  state: string
  background?: string
  policies?: string[]
  highlights?: string[]
  funFacts?: string[]
}

export async function getChatResponse(
  messages: ChatMessage[],
  candidates: CandidateProfile[],
  repContext?: RepContext | null,
): Promise<string> {
  let systemContent: string

  if (repContext) {
    const chamberName = repContext.chamber === 'upper' ? 'State Senator' : 'State Representative'
    const lines = [
      `REPRESENTATIVE CONTEXT:`,
      `Name: ${repContext.name}`,
      `Role: ${repContext.party} ${chamberName} from ${repContext.state}, District ${repContext.district}`,
    ]
    if (repContext.background) lines.push(`Background: ${repContext.background}`)
    if (repContext.policies?.length) lines.push(`Policy Areas: ${repContext.policies.join(', ')}`)
    if (repContext.highlights?.length) lines.push(`Legislative Highlights: ${repContext.highlights.join('; ')}`)
    if (repContext.funFacts?.length) lines.push(`Fun Facts: ${repContext.funFacts.join('; ')}`)
    systemContent = `${GENERAL_CIVIC_PROMPT}\n\n${lines.join('\n')}\n\nUse this context to answer questions about this representative. If asked about topics not covered here, draw on general knowledge about their role, party, and state.`
  } else if (candidates.length > 0) {
    const candidateContext = candidates.map(c => ({
      name: c.name,
      office: c.office,
      party: c.party ?? 'Not listed',
      bio: c.bio ?? 'No biography available',
      positions: c.positions,
      sources: c.sources,
      lastVerified: c.lastVerified,
    }))
    const contextBlock = `CANDIDATE DATA:\n${JSON.stringify(candidateContext, null, 2)}`
    systemContent = `${BALLOT_PROMPT}\n\n${contextBlock}`
  } else {
    // No address / no ballot — use general civic knowledge
    systemContent = GENERAL_CIVIC_PROMPT
  }

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 1024,
    messages: [
      { role: 'system', content: systemContent },
      ...messages.map(m => ({ role: m.role, content: m.content })),
    ],
  })

  const text = response.choices[0]?.message?.content
  if (!text) throw new Error('Empty response from AI')
  return text
}
