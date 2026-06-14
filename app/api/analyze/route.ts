import { NextRequest, NextResponse } from 'next/server'
import { TrendInput, TrendReport } from '@/lib/types'
import { fetchMarketplaceSignal } from '@/lib/signals/marketplace'
import { fetchCreatorSignal } from '@/lib/signals/creators'
import { fetchCompetitorSignal } from '@/lib/signals/competitors'
import { fetchSearchTrendsSignal } from '@/lib/signals/search_trends'
import { fetchHistoricalSignal } from '@/lib/signals/historical'
import { analyzeWithClaude } from '@/lib/analysis/claude'
import { randomUUID } from 'crypto'

export const maxDuration = 120

export async function POST(req: NextRequest) {
  try {
    const input: TrendInput = await req.json()

    if (!input.description || !input.priceBand || !input.season || !input.fabric) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Fetch all 5 signals in parallel
    const [creator, marketplace, search_interest, competitor, historical] = await Promise.all([
      fetchCreatorSignal(input),
      fetchMarketplaceSignal(input),
      fetchSearchTrendsSignal(input),
      fetchCompetitorSignal(input),
      fetchHistoricalSignal(input),
    ])

    const signals = { creator, marketplace, search_interest, competitor, historical }

    // Claude analysis layer
    const analysis = await analyzeWithClaude(input, signals)

    const report: TrendReport = {
      id: randomUUID(),
      input,
      created_at: new Date().toISOString(),
      signals,
      ...analysis,
    }

    return NextResponse.json(report)
  } catch (err) {
    console.error('Analysis error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Analysis failed' },
      { status: 500 }
    )
  }
}
