import { TrendInput, SignalResult } from '@/lib/types'
import { extractSearchTokens } from '@/lib/utils'

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

// Narrow keyword-layered candidate tried first; fabric-based candidates are fallbacks.
// Fetcher tries candidates in order and stops at the first with meaningful data (peak > 10).
function buildKeywordCandidates(input: TrendInput): string[] {
  const candidates: string[] = []

  // Keyword layer: narrow candidate tried first when buyer specified keywords
  if (input.keywords?.trim()) {
    const tokens = extractSearchTokens(input.keywords)
    if (tokens) candidates.push(`${tokens} co-ord set`)
  }

  // Fabric-specific keyword (e.g. "linen coord set", "cotton coord set")
  const fabric = input.fabric.toLowerCase()
  if (fabric.includes('linen')) candidates.push('linen coord set')
  if (fabric.includes('cotton')) candidates.push('cotton coord set')
  if (fabric.includes('chiffon')) candidates.push('chiffon coord set')
  if (fabric.includes('rayon')) candidates.push('rayon coord set')
  if (fabric.includes('silk')) candidates.push('silk coord set')
  if (fabric.includes('denim')) candidates.push('denim coord set')

  // Broad reliable fallbacks
  candidates.push('co-ord set women')
  candidates.push('coord set')

  return candidates
}

interface FetchedTrendsData {
  timeline: TrendDataPoint[]
  risingQueries: string[]
  topQueries: string[]
  topRegions: string[]
}

async function fetchTrendsForKeyword(keyword: string, apiKey: string): Promise<FetchedTrendsData | null> {
  try {
    const base = `https://serpapi.com/search.json?engine=google_trends&q=${encodeURIComponent(keyword)}&geo=IN&date=today+12-m&api_key=${apiKey}`

    const [timeRes, relatedRes, geoRes] = await Promise.all([
      fetch(`${base}&data_type=TIMESERIES`, { next: { revalidate: 3600 } }),
      fetch(`${base}&data_type=RELATED_QUERIES`, { next: { revalidate: 3600 } }),
      fetch(`${base}&data_type=GEO_MAP`, { next: { revalidate: 3600 } }),
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

    // Skip this candidate if data is too sparse (peak < 10 means practically no signal)
    const peakCheck = Math.max(...timeline.map(t => t.value))
    if (peakCheck < 10) return null

    let risingQueries: string[] = []
    let topQueries: string[] = []
    if (relatedRes.ok) {
      const relatedData = await relatedRes.json()
      if (!relatedData.error) {
        risingQueries = (relatedData?.related_queries?.rising || [])
          .slice(0, 5)
          .map((r: { query: string; value?: string }) =>
            r.value === 'Breakout' ? `${r.query} ↑↑` : r.query
          )
        topQueries = (relatedData?.related_queries?.top || [])
          .slice(0, 4)
          .map((r: { query: string }) => r.query)
      }
    }

    let topRegions: string[] = []
    if (geoRes.ok) {
      const geoData = await geoRes.json()
      if (!geoData.error) {
        topRegions = (geoData?.interest_by_region || [])
          .sort((a: { value: number[] }, b: { value: number[] }) => (b.value?.[0] ?? 0) - (a.value?.[0] ?? 0))
          .slice(0, 4)
          .map((r: { location: string }) => r.location)
      }
    }

    return { timeline, risingQueries, topQueries, topRegions }
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

      const { timeline, risingQueries, topQueries, topRegions } = result
      const values = timeline.map((t) => t.value)
      const peakValue = Math.max(...values)
      const currentValue = values[values.length - 1] ?? 0

      // Use last 8 weeks vs first 8 weeks for a more stable trend direction
      const windowSize = Math.min(8, Math.floor(values.length / 3))
      const recentAvg = values.slice(-windowSize).reduce((a, b) => a + b, 0) / windowSize
      const earlierAvg = values.slice(0, windowSize).reduce((a, b) => a + b, 0) / windowSize
      const trendDirection =
        recentAvg > earlierAvg * 1.2 ? 'rising'
        : recentAvg < earlierAvg * 0.8 ? 'declining'
        : 'stable'

      const confidence: SignalResult['confidence'] =
        peakValue >= 50 && currentValue >= 25 ? 'High'
        : peakValue >= 20 && values.filter(v => v > 5).length >= values.length * 0.6 ? 'Medium'
        : 'Low'

      const regionStr = topRegions.length ? ` Top states: ${topRegions.join(', ')}.` : ''
      const risingStr = risingQueries.length ? ` Rising searches: ${risingQueries.slice(0, 3).join(', ')}.` : ''
      const topStr = topQueries.length ? ` Top searches: ${topQueries.slice(0, 3).join(', ')}.` : ''

      const relatedQueries = [...risingQueries, ...topQueries]

      return {
        confidence,
        evidence_summary: `Google Trends India — "${keyword}" (last 12 months): peak ${peakValue}/100, current ${currentValue}/100, momentum is ${trendDirection}.${regionStr}${risingStr}${topStr}`,
        what_it_proves: 'That people in India are actively searching for this trend — and whether that search intent is accelerating or cooling. Rising = buy ahead of peak; declining = markdown risk is rising.',
        what_could_mislead: 'Search interest is a lagging signal — peaks follow social buzz, not store sales. High national interest may not reflect your catchment regions or value-fashion buyer profile.',
        raw_data: { keyword, timeline, peakValue, currentValue, relatedQueries, topRegions },
      }
    }
  }

  return {
    confidence: 'Insufficient Data',
    evidence_summary: 'Could not retrieve Google Trends data. Configure SERPAPI_KEY to enable this signal.',
    what_it_proves: 'That people in India are actively searching for this trend — and whether that search intent is accelerating or cooling. Rising = buy ahead of peak; declining = markdown risk is rising.',
    what_could_mislead: 'Search interest is a lagging signal; peaks follow social buzz, not store sales. National interest may not reflect your catchment or value-fashion buyer profile.',
    raw_data: null,
  }
}
