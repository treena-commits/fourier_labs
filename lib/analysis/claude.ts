import Groq from 'groq-sdk'
import { TrendInput, TrendReport, SignalResult } from '@/lib/types'

const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

interface AllSignals {
  creator: SignalResult
  marketplace: SignalResult
  search_interest: SignalResult
  competitor: SignalResult
  historical: SignalResult
}

export async function analyzeWithClaude(input: TrendInput, signals: AllSignals): Promise<Omit<TrendReport, 'id' | 'input' | 'created_at' | 'signals'>> {
  const prompt = `You are TrendBet, a decision copilot for value-fashion category buyers in India.

A buyer is evaluating this trend for ${input.category} — ${input.subCategory}:
- Trend Keywords: ${input.keywords?.trim() || 'Not specified'}
- Buying Horizon: ${input.buyingHorizon === 'immediate' ? 'Immediate (0–30 days) — trend must already be established; no time to wait for more signal' : input.buyingHorizon === 'next-cycle' ? 'Next Buying Cycle (31–90 days) — rising trends are viable; factor in lead time' : 'Future Bet (90+ days) — early-signal stage; emerging trends worth tracking are acceptable'}
- Target Price Band: ₹${input.priceBand}
- Fabric: ${input.fabric}

Here are the 5 signal results collected from real sources:

## Creator Pulse (YouTube + Instagram mentions)
Confidence: ${signals.creator.confidence}
Evidence: ${signals.creator.evidence_summary}
What it proves: ${signals.creator.what_it_proves}
What could mislead: ${signals.creator.what_could_mislead}
Data limitation: Instagram mentions are collected via generic Google Search only — no follower count, creator niche, engagement rate, or audience demographics are available. Any surfaced creator could be aspirational/premium with an audience that does not buy at ₹${input.priceBand}. If creator signal materially influences your recommendation, flag this in evidence_gaps.

## Marketplace Demand Shift (Myntra + Amazon.in via Google Shopping)
Confidence: ${signals.marketplace.confidence}
Evidence: ${signals.marketplace.evidence_summary}
What it proves: ${signals.marketplace.what_it_proves}
What could mislead: ${signals.marketplace.what_could_mislead}

## Search Interest (Google Trends India)
Confidence: ${signals.search_interest.confidence}
Evidence: ${signals.search_interest.evidence_summary}
What it proves: ${signals.search_interest.what_it_proves}
What could mislead: ${signals.search_interest.what_could_mislead}

## Competitor Buy Map (Max Fashion + Ajio)
Confidence: ${signals.competitor.confidence}
Evidence: ${signals.competitor.evidence_summary}
What it proves: ${signals.competitor.what_it_proves}
What could mislead: ${signals.competitor.what_could_mislead}

## Historical Analog
Confidence: ${signals.historical.confidence}
Evidence: ${signals.historical.evidence_summary}
What it proves: ${signals.historical.what_it_proves}
What could mislead: ${signals.historical.what_could_mislead}

## Buyer Judgment (ground-truth context from the buyer)
${input.buyerNote?.trim() ? input.buyerNote.trim() : 'Not provided.'}
This is first-hand knowledge from the buyer — past sell-through rates, store-level performance, vendor constraints, markdown history. It is not a market signal but a judgment filter. Where it conflicts with or validates external signals, call it out explicitly in disagreement_view and caveats.

---

Analyze these signals and produce a structured buyer recommendation.

CRITICAL RULES:
1. Never give false confidence. If evidence is weak, say so and recommend Monitor.
2. disagreement_view MUST always be populated — even if signals broadly agree, note the nuance or what would flip the call.
3. recommendation must be one of: "Monitor", "Small Trial Buy", "Deep Buy", or "Avoid"
4. suggested_units only for Small Trial Buy (e.g. "50-150 units") or Deep Buy (e.g. "200-400 units"). Set to null for Monitor/Avoid.
5. Be honest about India value-fashion fit — consider climate, modesty norms, price sensitivity, and occasion relevance.

Respond ONLY with a valid JSON object. No markdown fences, no explanation outside the JSON.

{
  "disagreement_view": "string",
  "india_fit": {
    "climate": "string",
    "modesty_norms": "string",
    "price_sensitivity": "string",
    "occasion_relevance": "string",
    "overall": "string"
  },
  "recommendation": "Monitor" | "Small Trial Buy" | "Deep Buy" | "Avoid",
  "suggested_units": "string or null",
  "evidence_gaps": ["string"],
  "recommended_actions": ["string"],
  "caveats": ["string"]
}`

  const response = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: 'You are a fashion buying analyst. Always respond with valid JSON only — no markdown, no extra text.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 4096,
    response_format: { type: 'json_object' },
  })

  const text = response.choices[0]?.message?.content
  if (!text) throw new Error('No response from Groq')

  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`Failed to parse Groq response as JSON: ${text.slice(0, 200)}`)
  }
}
