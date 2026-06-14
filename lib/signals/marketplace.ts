import { TrendInput, SignalResult } from '@/lib/types'

interface ShoppingResult {
  title: string
  price?: string
  source: string
  rating?: number
  reviews?: number
  link: string
}

function buildMarketplaceKeyword(input: TrendInput): string {
  const fabric = input.fabric.toLowerCase()
  if (fabric.includes('linen')) return 'linen co-ord set women'
  if (fabric.includes('cotton')) return 'cotton co-ord set women'
  if (fabric.includes('rayon') || fabric.includes('viscose')) return 'rayon co-ord set women'
  if (fabric.includes('georgette') || fabric.includes('crepe')) return 'georgette co-ord set women'
  if (fabric.includes('denim')) return 'denim co-ord set women'
  return 'co-ord set women'
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

  // Query both Myntra and Amazon.in via Google Shopping
  const queries = [
    `${keyword} site:myntra.com`,
    `${keyword} site:amazon.in`,
  ]

  for (const q of queries) {
    try {
      const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(q)}&gl=in&hl=en&api_key=${apiKey}`
      const res = await fetch(url, { next: { revalidate: 3600 } })
      if (!res.ok) continue
      const data = await res.json()
      const items = (data.shopping_results || []).slice(0, 5)
      for (const item of items) {
        results.push({
          title: item.title,
          price: item.price,
          source: item.source,
          rating: item.rating,
          reviews: item.reviews,
          link: item.link,
        })
      }
    } catch {
      // continue with partial results
    }
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
  const priceRange = results
    .filter(r => r.price)
    .map(r => r.price)
    .slice(0, 3)
    .join(', ')

  const confidence: SignalResult['confidence'] =
    results.length >= 8 && totalReviews > 100 ? 'High'
    : results.length >= 4 ? 'Medium'
    : 'Low'

  return {
    confidence,
    evidence_summary: `Found ${results.length} listings across ${sources}. Price range: ${priceRange || 'N/A'}. Total reviews: ${totalReviews}. Avg rating: ${avgRating.toFixed(1)}.`,
    what_it_proves: 'Products exist at the target price band and are commercially available; review volume indicates real purchase activity.',
    what_could_mislead: 'Sponsored placement inflates visibility. Heavy discounting can signal overstocked inventory, not demand. Stockouts can look like high demand.',
    raw_data: results,
  }
}
