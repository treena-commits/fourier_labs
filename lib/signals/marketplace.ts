import { TrendInput, SignalResult } from '@/lib/types'
import { extractSearchTokens } from '@/lib/utils'

interface ShoppingResult {
  title: string
  price?: string
  source: string
  rating?: number
  reviews?: number
  link: string
}

const SOURCE_MAP: Record<string, string> = {
  'myntra': 'Myntra',
  'amazon.in': 'Amazon.in',
  'amazon': 'Amazon.in',
  'nykaa fashion': 'Nykaa Fashion',
  'nykaa': 'Nykaa Fashion',
  'ajio': 'Ajio',
  'flipkart': 'Flipkart',
  'meesho': 'Meesho',
  'snapdeal': 'Snapdeal',
}

function normalizeSource(raw: string): string {
  const key = raw.toLowerCase().trim()
  for (const [pattern, label] of Object.entries(SOURCE_MAP)) {
    if (key.includes(pattern)) return label
  }
  return 'Other marketplace'
}

function parsePriceINR(priceStr: string | undefined): number | null {
  if (!priceStr) return null
  const cleaned = priceStr.replace(/[₹,\s]/g, '').replace(/[^0-9.]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

function isInPriceBand(price: number, band: string): boolean {
  const [low, high] = band.split('-').map(Number)
  return price >= low && price <= high
}

function buildMarketplaceKeyword(input: TrendInput): string {
  const fabric = input.fabric.toLowerCase()
  let base = 'co-ord set women'
  if (fabric.includes('linen')) base = 'linen co-ord set women'
  else if (fabric.includes('cotton')) base = 'cotton co-ord set women'
  else if (fabric.includes('rayon') || fabric.includes('viscose')) base = 'rayon co-ord set women'
  else if (fabric.includes('georgette') || fabric.includes('crepe')) base = 'georgette co-ord set women'
  else if (fabric.includes('denim')) base = 'denim co-ord set women'

  if (!input.keywords?.trim()) return base
  const tokens = extractSearchTokens(input.keywords)
  return tokens ? `${tokens} ${base}` : base
}

export async function fetchMarketplaceSignal(input: TrendInput): Promise<SignalResult & { raw_data: ShoppingResult[] }> {
  const apiKey = process.env.SERPAPI_KEY
  const keyword = buildMarketplaceKeyword(input)
  const results: ShoppingResult[] = []

  if (!apiKey) {
    return {
      confidence: 'Insufficient Data',
      evidence_summary: 'SerpAPI key not configured. Cannot fetch marketplace data.',
      what_it_proves: 'Early commercial demand: review counts, price range, bestseller tags, new arrivals.',
      what_could_mislead: 'Sponsored placement and heavy discounting distort rankings.',
      raw_data: [],
    }
  }

  // Google Shopping does not support site: filters — query broadly and capture all sources
  // (Myntra, Amazon.in, Nykaa, etc. appear naturally in IN-locale results)
  try {
    const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(keyword)}&gl=in&hl=en&api_key=${apiKey}`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (res.ok) {
      const data = await res.json()
      const items = (data.shopping_results || []).slice(0, 10)
      for (const item of items) {
        results.push({
          title: item.title,
          price: item.price,
          source: normalizeSource(item.source || ''),
          rating: item.rating,
          reviews: item.reviews,
          link: item.link,
        })
      }
    }
  } catch {
    // continue with empty results
  }

  if (results.length === 0) {
    return {
      confidence: 'Insufficient Data',
      evidence_summary: 'No marketplace listings found for this trend keyword. Weak signal — recommend monitoring.',
      what_it_proves: 'Early commercial demand via listing volume, pricing, and review activity.',
      what_could_mislead: 'Sponsored placement and heavy discounting distort rankings.',
      raw_data: [],
    }
  }

  const avgRating = results.filter(r => r.rating).reduce((s, r) => s + (r.rating || 0), 0) / (results.filter(r => r.rating).length || 1)
  const totalReviews = results.reduce((s, r) => s + (r.reviews || 0), 0)
  const sources = [...new Set(results.map(r => r.source))].join(', ')

  const inBandResults = results.filter(r => {
    const price = parsePriceINR(r.price)
    return price !== null && isInPriceBand(price, input.priceBand)
  })
  const inBandCount = inBandResults.length
  const inBandReviews = inBandResults.reduce((s, r) => s + (r.reviews || 0), 0)

  const confidence: SignalResult['confidence'] =
    inBandCount >= 4 && inBandReviews > 50 ? 'High'
    : inBandCount >= 2 || results.length >= 4 ? 'Medium'
    : 'Low'

  const bandLabel = `₹${input.priceBand}`
  const inBandStr = `${inBandCount} of ${results.length} listings fall within your target band (${bandLabel})`
  const reviewStr = inBandReviews > 0 ? ` with ${inBandReviews} reviews in-band` : ''

  return {
    confidence,
    evidence_summary: `Found ${results.length} listings across ${sources}. ${inBandStr}${reviewStr}. Total reviews across all: ${totalReviews}${results.filter(r => r.rating).length > 0 ? `. Avg rating: ${avgRating.toFixed(1)}` : ''}.`,
    what_it_proves: 'Whether the trend has real commercial supply on Indian marketplaces and how much of it lands within your target price band. In-band listing count + review volume indicate actual purchase activity at your price point.',
    what_could_mislead: 'Google Shopping ranks by relevance and sponsored placement, not demand strength. Heavy discounting can signal overstock, not velocity. Items outside your band skew the review total.',
    raw_data: results,
  }
}
