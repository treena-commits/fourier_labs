export interface TrendInput {
  category: string
  subCategory: string
  keywords?: string
  buyingHorizon: 'immediate' | 'next-cycle' | 'future-bet'
  priceBand: '299-599' | '600-999' | '1000-1499'
  fabric: string
}

export type Confidence = 'High' | 'Medium' | 'Low' | 'Insufficient Data'

export interface SignalResult {
  confidence: Confidence
  evidence_summary: string
  what_it_proves: string
  what_could_mislead: string
  raw_data?: unknown
}

export interface TrendReport {
  id: string
  input: TrendInput
  created_at: string
  signals: {
    creator: SignalResult
    marketplace: SignalResult
    search_interest: SignalResult
    competitor: SignalResult
    historical: SignalResult
  }
  disagreement_view: string
  india_fit: {
    climate: string
    modesty_norms: string
    price_sensitivity: string
    occasion_relevance: string
    overall: string
  }
  recommendation: 'Monitor' | 'Small Trial Buy' | 'Deep Buy' | 'Avoid'
  suggested_units?: string
  evidence_gaps: string[]
  recommended_actions: string[]
  caveats: string[]
}
