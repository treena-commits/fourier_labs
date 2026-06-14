import { TrendInput, SignalResult } from '@/lib/types'

interface TrendDataPoint {
  date: string
  value: number
}

interface GoogleTrendsResult {
  keyword: string
  timeline: TrendDataPoint[]
  peakValue: number
  currentValue: number
  relatedQueries: string[]
  topRegions: string[]
}

// Extract short, Google-Trends-friendly keywords from the raw trend input.
// The full description string is too specific and returns no results.
function buildKeywordCandidates(input: TrendInput): string[] {
  const candidates: string[] = []

  // Fabric-specific keyword (e.g. "linen coord set", "cotton coord set")
  const fabric = input.fabric.toLowerCase()
  if (fabric.includes('linen')) candidates.push('linen coord set')
  if (fabric.includes('cotton')) candidates.push('cotton coord set')
  if (fabric.includes('chiffon')) candidates.push('chiffon coord set')
  if (fabric.includes('rayon')) candidates.push('rayon coord set')
  if (fabric.includes('silk')) candidates.push('silk coord set')
  if (fabric.includes('denim')) candidates.push('denim coord set')

  // Season keyword
  const season = input.season.toLowerCase()
  if (season.includes('summer') || season.includes('spring')) candidates.push('summer coord set women')
  if (season.includes('winter')) candidates.push('winter coord set women')

  // Broad reliable fallbacks
  candidates.push('co-ord set women')
  candidates.push('coord set')

  return candidates
}

async function fetchTrendsForKeyword(keyword: string, apiKey: string): Promise<{
  timeline: TrendDataPoint[]
  relatedQueries: string[]
  topRegions: string[]
} | null> {
  try {
    const base = `https://serpapi.com/search.json?engine=google_trends&q=${encodeURIComponent(keyword)}&geo=IN&date=today+12-m&api_key=${apiKey}`

    const [timeRes, relatedRes] = await Promise.all([
      fetch(`${base}&data_type=TIMESERIES`, { next: { revalidate: 3600 } }),
      fetch(`${base}&data_type=RELATED_QUERIES`, { next: { revalidate: 3600 } }),
    ])

    if (!timeRes.ok) return null
    const timeData = await timeRes.json()
    if (timeData.error) return null

    const timelineRaw: Array<{ date: string; values: Array<{ extracted_value: number }> }> =
      timeData?.interest_over_time?.timeline_data || []

    if (timelineRaw.length === 0) return null

    const timeline: TrendDataPoint[] = timelineRaw.map((t) => ({
      date: t.date,
      value: t.values?.[0]?.extracted_value ?? 0,
    }))

    let relatedQueries: string[] = []
    if (relatedRes.ok) {
      const relatedData = await relatedRes.json()
      if (!relatedData.error) {
        const rising = relatedData?.related_queries?.rising || []
        const top = relatedData?.related_queries?.top || []
        relatedQueries = [...rising, ...top]
          .slice(0, 6)
          .map((r: { query: string }) => r.query)
      }
    }

    return { timeline, relatedQueries, topRegions: [] }
  } catch {
    return null
  }
}

export async function fetchSearchTrendsSignal(input: TrendInput): Promise<SignalResult & { raw_data: GoogleTrendsResult | null }> {
  const apiKey = process.env.SERPAPI_KEY

  if (apiKey) {
    const candidates = buildKeywordCandidates(input)

    for (const keyword of candidates) {
      const result = await fetchTrendsForKeyword(keyword, apiKey)
      if (!result) continue

      const { timeline, relatedQueries, topRegions } = result
      const values = timeline.map((t) => t.value)
      const peakValue = Math.max(...values)
      const currentValue = values[values.length - 1] ?? 0

      const recentAvg = values.slice(-4).reduce((a, b) => a + b, 0) / 4
      const earlierAvg = values.slice(0, 4).reduce((a, b) => a + b, 0) / 4
      const trend = recentAvg > earlierAvg + 5 ? 'rising' : recentAvg < earlierAvg - 5 ? 'declining' : 'stable'

      const confidence: SignalResult['confidence'] =
        peakValue >= 50 && currentValue >= 30 ? 'High'
        : peakValue >= 20 || relatedQueries.length >= 3 ? 'Medium'
        : 'Low'

      const regionStr = topRegions.length ? ` Top regions: ${topRegions.slice(0, 3).join(', ')}.` : ''
      const relatedStr = relatedQueries.length ? ` Related: ${relatedQueries.slice(0, 4).join(', ')}.` : ''

      return {
        confidence,
        evidence_summary: `Google Trends India — "${keyword}" (last 12 months): peak interest ${peakValue}/100, current ${currentValue}/100, trend is ${trend}.${regionStr}${relatedStr}`,
        what_it_proves: 'Consumer search momentum for this trend category in India, with regional and temporal breakdown.',
        what_could_mislead: 'Search interest is a lagging indicator — by the time searches peak, the optimal buying window may have passed. Regional spikes may not reflect your store base.',
        raw_data: { keyword, timeline, peakValue, currentValue, relatedQueries, topRegions },
      }
    }
  }

  return {
    confidence: 'Insufficient Data',
    evidence_summary: 'Could not retrieve Google Trends data. Configure SERPAPI_KEY to enable full trends signal.',
    what_it_proves: 'Consumer search momentum for the trend in India.',
    what_could_mislead: 'Search interest is a lagging signal; peaks often follow the optimal buying window.',
    raw_data: null,
  }
}
