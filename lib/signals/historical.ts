import { TrendInput, SignalResult } from '@/lib/types'
import analogsData from '@/data/historical-analogs.json'

interface Analog {
  id: string
  trend: string
  fabric: string
  silhouette: string
  print: string
  price_band: string
  season: string
  year: string
  outcome: string
  what_worked: string
  what_didnt: string
  india_fit_score: string
  notes: string
}

function scoreSimilarity(input: TrendInput, analog: Analog): number {
  let score = 0
  const desc = input.description.toLowerCase()
  const fabricQuery = input.fabric.toLowerCase()

  // Fabric match
  if (analog.fabric.toLowerCase().includes(fabricQuery) || fabricQuery.includes(analog.fabric.toLowerCase().split('/')[0])) {
    score += 3
  }

  // Season match
  if (analog.season.toLowerCase().includes(input.season.toLowerCase().split('/')[0].toLowerCase())) {
    score += 2
  }

  // Price band overlap
  const [inputLow, inputHigh] = input.priceBand.split('-').map(Number)
  const [analogLow, analogHigh] = analog.price_band.split('-').map(Number)
  if (inputLow <= analogHigh && inputHigh >= analogLow) score += 2

  // Keyword overlap in trend name and description
  const descWords = desc.split(/\s+/).filter(w => w.length > 4)
  for (const word of descWords) {
    if (analog.trend.toLowerCase().includes(word)) score += 1
    if (analog.print.toLowerCase().includes(word)) score += 1
  }

  return score
}

export async function fetchHistoricalSignal(input: TrendInput): Promise<SignalResult & { raw_data: Analog[] }> {
  const analogs = analogsData.analogs as Analog[]

  const scored = analogs
    .map(a => ({ analog: a, score: scoreSimilarity(input, a) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  const topAnalogs = scored.filter(s => s.score > 0).map(s => s.analog)

  if (topAnalogs.length === 0) {
    return {
      confidence: 'Insufficient Data',
      evidence_summary: 'No closely matching historical analogs found in curated dataset.',
      what_it_proves: 'Commercial precedent by fabric, silhouette, and price band.',
      what_could_mislead: 'Past market conditions may not hold. Dataset is small and hand-curated.',
      raw_data: [],
    }
  }

  const best = topAnalogs[0]
  const confidence: SignalResult['confidence'] =
    scored[0].score >= 6 ? 'High'
    : scored[0].score >= 3 ? 'Medium'
    : 'Low'

  const summary = topAnalogs.map(a =>
    `[${a.year}] ${a.trend}: ${a.outcome.split('.')[0]}.`
  ).join(' | ')

  return {
    confidence,
    evidence_summary: `Closest analog: "${best.trend}" (${best.year}) — ${best.outcome.split('.')[0]}. ${topAnalogs.length > 1 ? `Also relevant: ${topAnalogs.slice(1).map(a => a.trend).join(', ')}.` : ''} Data source: hand-curated dataset (see /data/historical-analogs.json).`,
    what_it_proves: `Historical precedent suggests ${best.india_fit_score} India-fit. Key lesson: ${best.notes}`,
    what_could_mislead: `Dataset is small (${analogs.length} entries) and hand-curated — disclosed. Market conditions in ${new Date().getFullYear()} may differ from ${best.year}. Past sell-through does not guarantee future demand.`,
    raw_data: topAnalogs,
  }
}
