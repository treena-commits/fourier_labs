import { TrendInput, SignalResult } from '@/lib/types'
import { extractSearchTokens } from '@/lib/utils'

interface CompetitorListing {
  retailer: string
  title: string
  price?: string
  isNewArrival: boolean
  isOnSale: boolean
  url: string
}

async function fetchRetailer(retailerName: string, retailerQuery: string, sourceMatch: string[], keyword: string, apiKey: string): Promise<CompetitorListing[]> {
  try {
    const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(keyword + ' ' + retailerQuery)}&gl=in&hl=en&api_key=${apiKey}&num=10`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = await res.json()
    return (data.shopping_results || [])
      .filter((r: { source?: string }) => {
        const src = (r.source || '').toLowerCase()
        return sourceMatch.some(m => src.includes(m))
      })
      .slice(0, 5)
      .map((r: { title: string; link: string; price?: string }) => ({
        retailer: retailerName,
        title: r.title,
        price: r.price,
        isNewArrival: /new arrival|new in|just in/i.test(r.title),
        isOnSale: /sale|% off|discount/i.test(r.title),
        url: r.link,
      }))
  } catch {
    return []
  }
}

function buildCompetitorKeyword(input: TrendInput): string {
  const fabric = input.fabric.toLowerCase()
  let base = 'co-ord set women'
  if (fabric.includes('linen')) base = 'linen co-ord set'
  else if (fabric.includes('cotton')) base = 'cotton co-ord set'
  else if (fabric.includes('rayon') || fabric.includes('viscose')) base = 'rayon co-ord set'
  else if (fabric.includes('georgette') || fabric.includes('crepe')) base = 'georgette co-ord set'
  else if (fabric.includes('denim')) base = 'denim co-ord set'

  if (!input.keywords?.trim()) return base
  const tokens = extractSearchTokens(input.keywords)
  return tokens ? `${tokens} ${base}` : base
}

export async function fetchCompetitorSignal(input: TrendInput): Promise<SignalResult & { raw_data: CompetitorListing[] }> {
  const serpApiKey = process.env.SERPAPI_KEY
  if (!serpApiKey) {
    return {
      confidence: 'Insufficient Data',
      evidence_summary: 'SerpAPI key not configured. Cannot fetch competitor data.',
      what_it_proves: 'Whether value-fashion retailers are committing inventory to this trend.',
      what_could_mislead: 'Competitors may be copying each other or targeting different customer segments.',
      raw_data: [],
    }
  }

  const keyword = buildCompetitorKeyword(input)

  const [maxResults, ajioResults] = await Promise.all([
    fetchRetailer('Max Fashion', 'max fashion', ['max fashion', 'maxfashion'], keyword, serpApiKey),
    fetchRetailer('Ajio', 'ajio', ['ajio'], keyword, serpApiKey),
  ])

  const allResults = [...maxResults, ...ajioResults]

  if (allResults.length === 0) {
    return {
      confidence: 'Insufficient Data',
      evidence_summary: 'No listings found on Max Fashion or Ajio for this trend keyword. Weak signal — recommend monitoring.',
      what_it_proves: 'Whether value-fashion competitors are committing inventory to this trend.',
      what_could_mislead: 'Absence of listings may mean the trend is too early, or these retailers target a different segment.',
      raw_data: [],
    }
  }

  const newArrivals = allResults.filter(r => r.isNewArrival).length
  const onSale = allResults.filter(r => r.isOnSale).length
  const retailers = [...new Set(allResults.map(r => r.retailer))].join(' + ')

  const confidence: SignalResult['confidence'] =
    allResults.length >= 6 && newArrivals >= 1 ? 'High'
    : allResults.length >= 3 ? 'Medium'
    : 'Low'

  return {
    confidence,
    evidence_summary: `${allResults.length} listings found across ${retailers}. ${newArrivals > 0 ? `${newArrivals} new arrivals.` : ''} ${onSale > 0 ? `${onSale} items on sale (possible overstock signal).` : 'No heavy discounting detected.'}`,
    what_it_proves: 'Value-fashion retailers are actively stocking this trend, indicating retailer conviction and reducing first-mover risk.',
    what_could_mislead: `Retailers may be responding to a trend that has already peaked elsewhere. ${onSale > 0 ? 'Discounted listings suggest the trend may be late-stage.' : ''} Max and Ajio serve slightly different customer geographies.`,
    raw_data: allResults,
  }
}
