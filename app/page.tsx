'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TrendInput } from '@/lib/types'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  { value: "Women's Apparel", disabled: false },
  { value: "Men's Apparel", disabled: true },
  { value: 'Kidswear', disabled: true },
  { value: 'Footwear', disabled: true },
]

const SUBCATEGORIES = [
  { value: 'Co-ord Sets', disabled: false },
  { value: 'Tops', disabled: true },
  { value: 'Kurtis', disabled: true },
  { value: 'Skirts', disabled: true },
  { value: 'Dresses', disabled: true },
  { value: 'Trousers & Palazzos', disabled: true },
  { value: 'Jumpsuits', disabled: true },
]

const BUYING_HORIZONS: { value: TrendInput['buyingHorizon']; label: string; sublabel: string; desc: string }[] = [
  {
    value: 'immediate',
    label: 'Immediate',
    sublabel: '0–30 days',
    desc: 'Trend must already be established. Limited time to act.',
  },
  {
    value: 'next-cycle',
    label: 'Next Buying Cycle',
    sublabel: '31–90 days',
    desc: 'Core planning window. Rising trends are viable bets.',
  },
  {
    value: 'future-bet',
    label: 'Future Bet',
    sublabel: '90+ days',
    desc: 'Early signal stage. Emerging trends worth tracking.',
  },
]

const PRICE_BANDS: { value: TrendInput['priceBand']; label: string }[] = [
  { value: '299-599', label: '₹299–599' },
  { value: '600-999', label: '₹600–999' },
  { value: '1000-1499', label: '₹1,000–1,499' },
]

const FABRICS = ['Cotton / Cotton-linen', 'Linen', 'Rayon / Viscose', 'Georgette / Crepe', 'Polyester Knit', 'Other']

const PIPELINE_STEPS = [
  { id: 'creator', label: 'Creator Signal', desc: 'Instagram mentions' },
  { id: 'marketplace', label: 'Marketplace Demand', desc: 'Myntra, Amazon.in, Nykaa etc.' },
  { id: 'search', label: 'Search Interest', desc: 'Google Trends India' },
  { id: 'competitor', label: 'Competitor Buy Map', desc: 'Max Fashion, Ajio etc.' },
  { id: 'historical', label: 'Historical Analog', desc: 'Past co-ord trend outcomes' },
  { id: 'analysis', label: 'Buyer Recommendation', desc: 'AI reasoning layer' },
]

const DEFAULT_BUYER_NOTE = `Kaftan co-ords trialled last festive season (₹899, rayon, block print) — sold through 61% in 8 weeks across metro stores but moved poorly in Tier 2 and Tier 3 (38%). Category skews strongly occasion-wear: Eid, navratri, and beach/resort gifting drove most units. Reorder velocity was low — customers treat it as a one-off buy, not a wardrobe repeat. Rayon with wide sleeves had fitting complaints post-wash; cotton-modal blend performed better on returns. Our vendor needs 50-day lead on embroidery or block-print work. Max Fashion has started stocking kaftans at ₹699 with solid colours — differentiation needs to come from print story or silhouette detail. Suggest limiting depth to 80–120 units per store for trial; avoid wide size curve below S/M.`

export default function IntakePage() {
  const router = useRouter()
  const [form, setForm] = useState<TrendInput>({
    category: "Women's Apparel",
    subCategory: 'Co-ord Sets',
    keywords: 'Kaftan',
    buyingHorizon: 'next-cycle',
    priceBand: '600-999',
    fabric: 'Cotton / Cotton-linen',
    buyerNote: DEFAULT_BUYER_NOTE,
  })
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    let step = 0
    const interval = setInterval(() => {
      setCurrentStep(step)
      step++
      if (step >= PIPELINE_STEPS.length) clearInterval(interval)
    }, 1800)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      clearInterval(interval)
      setCurrentStep(PIPELINE_STEPS.length - 1)

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Analysis failed')
      }

      const report = await res.json()
      sessionStorage.setItem(`report-${report.id}`, JSON.stringify(report))
      router.push(`/report/${report.id}`)
    } catch (err) {
      clearInterval(interval)
      setLoading(false)
      setCurrentStep(-1)
      setError(err instanceof Error ? err.message : 'Something went wrong. Check your API keys.')
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <header className="border-b px-6 py-4 flex items-center justify-between" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div>
          <span className="font-bold text-lg tracking-tight">TrendBet</span>
          <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
            Fashion Buyer Copilot
          </span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="mb-6">
            <div className="text-xs font-medium mb-1 uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
              New Trend Evaluation
            </div>
            <h1 className="text-2xl font-bold mb-2">New Trend Intake</h1>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              Describe the trend you&apos;re evaluating. TrendBet will cross-reference market signals, search momentum,
              and competitor inventory to give you an inventory recommendation.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-7">

            {/* Category + Sub-category row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--muted)' }}>
                  Category
                </label>
                <select
                  className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value} disabled={c.disabled}>
                      {c.value}{c.disabled ? ' (coming soon)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--muted)' }}>
                  Sub-category
                </label>
                <select
                  className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
                  value={form.subCategory}
                  onChange={e => setForm(f => ({ ...f, subCategory: e.target.value }))}
                >
                  {SUBCATEGORIES.map(c => (
                    <option key={c.value} value={c.value} disabled={c.disabled}>
                      {c.value}{c.disabled ? ' (coming soon)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Trend Keywords */}
            <div>
              <label className="block text-sm font-semibold mb-1">
                Trend Keywords <span className="text-xs font-normal" style={{ color: 'var(--muted)' }}>(optional)</span>
              </label>
              <p className="text-xs mb-2" style={{ color: 'var(--muted)' }}>
                Add adjectives or modifiers to refine the search — e.g. vibe, print, silhouette detail. Sub-category is always the base.
              </p>
              <textarea
                rows={3}
                className="w-full rounded-lg border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
                style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
                placeholder='e.g. "earthy utility cargo" or "floral print summer casual"'
                value={form.keywords ?? ''}
                onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))}
              />
            </div>

            {/* Buying Horizon */}
            <div>
              <label className="block text-sm font-semibold mb-1">Buying Horizon</label>
              <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>
                When do you need to commit inventory? This shapes what signal confidence level is required.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {BUYING_HORIZONS.map(h => (
                  <button
                    key={h.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, buyingHorizon: h.value }))}
                    className={cn(
                      'rounded-lg border p-3 text-left transition-all',
                      form.buyingHorizon === h.value
                        ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-400'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    )}
                  >
                    <div className="font-bold text-sm">{h.label}</div>
                    <div className="text-xs font-medium mb-1" style={{ color: 'var(--accent)' }}>{h.sublabel}</div>
                    <div className="text-xs leading-snug" style={{ color: 'var(--muted)' }}>{h.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Filters row */}
            <div className="rounded-lg border p-4 space-y-4" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                Filters
              </div>

              {/* Price Band */}
              <div>
                <div className="text-xs font-medium mb-2">Target Price Band</div>
                <div className="flex flex-wrap gap-2">
                  {PRICE_BANDS.map(band => (
                    <button
                      key={band.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, priceBand: band.value }))}
                      className={cn(
                        'px-3 py-1.5 rounded-full border text-xs font-medium transition-all',
                        form.priceBand === band.value
                          ? 'border-amber-500 bg-amber-50 text-amber-800 ring-1 ring-amber-400'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      )}
                    >
                      {band.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fabric */}
              <div>
                <div className="text-xs font-medium mb-2">Fabric</div>
                <div className="flex flex-wrap gap-2">
                  {FABRICS.map(fab => (
                    <button
                      key={fab}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, fabric: fab }))}
                      className={cn(
                        'px-3 py-1.5 rounded-full border text-xs font-medium transition-all',
                        form.fabric === fab
                          ? 'border-amber-500 bg-amber-50 text-amber-800 ring-1 ring-amber-400'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      )}
                    >
                      {fab}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Buyer Note */}
            <div>
              <label className="block text-sm font-semibold mb-1">
                Buyer Note <span className="text-xs font-normal" style={{ color: 'var(--muted)' }}>(optional)</span>
              </label>
              <p className="text-xs mb-2" style={{ color: 'var(--muted)' }}>
                Add past sell-through rates, store-level observations, vendor constraints, or any context that should act as a judgment layer against the market signals.
              </p>
              <textarea
                rows={5}
                className="w-full rounded-lg border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
                style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
                placeholder="e.g. Last season's cargo co-ords sold through 78% in 6 weeks at metro stores but underperformed in Tier 2…"
                value={form.buyerNote ?? ''}
                onChange={e => setForm(f => ({ ...f, buyerNote: e.target.value }))}
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg py-3.5 px-6 font-semibold text-white text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'var(--accent)' }}
            >
              {loading ? 'Running Analysis…' : '⚡ Run TrendBet Analysis'}
            </button>

            <p className="text-center text-xs" style={{ color: 'var(--muted)' }}>
              Analysis typically takes 30–90 seconds to process market signals.
            </p>
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="rounded-lg border p-4" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>
              Analysis Pipeline
            </div>
            <div className="space-y-3">
              {PIPELINE_STEPS.map((step, i) => (
                <div key={step.id} className="flex items-start gap-2.5">
                  <div className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 transition-colors',
                    loading && currentStep > i ? 'bg-green-100 text-green-700'
                    : loading && currentStep === i ? 'bg-amber-100 text-amber-700 animate-pulse'
                    : 'bg-gray-100 text-gray-400'
                  )}>
                    {loading && currentStep > i ? '✓' : i + 1}
                  </div>
                  <div>
                    <div className="text-xs font-medium">{step.label}</div>
                    <div className="text-xs" style={{ color: 'var(--muted)' }}>{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
