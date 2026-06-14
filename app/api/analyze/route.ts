import { NextRequest, NextResponse } from 'next/server'
import { TrendInput, TrendReport } from '@/lib/types'
import { fetchMarketplaceSignal } from '@/lib/signals/marketplace'
import { fetchCreatorSignal } from '@/lib/signals/creators'
import { fetchCompetitorSignal } from '@/lib/signals/competitors'
import { fetchSearchTrendsSignal } from '@/lib/signals/search_trends'
import { fetchHistoricalSignal } from '@/lib/signals/historical'
import { analyzeWithClaude } from '@/lib/analysis/claude'
import { randomUUID } from 'crypto'
import { readFile } from 'fs/promises'
import { join } from 'path'

export const maxDuration = 120

function isDemoInput(input: TrendInput): boolean {
  return (
    (input.keywords?.toLowerCase().includes('kaftan') ?? false) &&
    input.priceBand === '600-999' &&
    input.fabric === 'Cotton / Cotton-linen' &&
    input.buyingHorizon === 'next-cycle'
  )
}

export async function POST(req: NextRequest) {
  try {
    const input: TrendInput = await req.json()

    if (!input.priceBand || !input.fabric) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Demo mode: serve cached output instantly for the default Kaftan inputs
    if (isDemoInput(input)) {
      const cached = await readFile(join(process.cwd(), 'public', 'sample-output.json'), 'utf-8')
      const demo = JSON.parse(cached)
      // Preserve the buyer note the user may have edited
      demo.input.buyerNote = input.buyerNote
      return NextResponse.json(demo)
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
