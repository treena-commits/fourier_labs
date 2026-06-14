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
  { value: 'immediate',   label: 'Immediate',          sublabel: '0–30 days',  desc: 'Trend must already be established. Limited time to act.' },
  { value: 'next-cycle',  label: 'Next Buying Cycle',  sublabel: '31–90 days', desc: 'Core planning window. Rising trends are viable bets.' },
  { value: 'future-bet',  label: 'Future Bet',         sublabel: '90+ days',   desc: 'Early signal stage. Emerging trends worth tracking.' },
]

const PRICE_BANDS: { value: TrendInput['priceBand']; label: string; sub: string }[] = [
  { value: '299-599',   label: '₹299–₹599',    sub: 'Entry Segment' },
  { value: '600-999',   label: '₹600–₹999',    sub: 'Sweet-Spot' },
  { value: '1000-1499', label: '₹1,000–₹1,499', sub: 'Premium' },
]

const FABRICS = [
  'Cotton / Cotton-linen',
  'Linen',
  'Rayon / Viscose',
  'Georgette / Crepe',
  'Polyester Knit',
  'Other',
]

const PIPELINE_STEPS = [
  { id: 'creator',     label: 'Creator Signal',      desc: 'Instagram & YouTube mentions' },
  { id: 'marketplace', label: 'Marketplace Demand',  desc: 'Myntra, Amazon.in, Nykaa etc.' },
  { id: 'search',      label: 'Search Interest',     desc: 'Google Trends India' },
  { id: 'competitor',  label: 'Competitor Buy Map',  desc: 'Max Fashion, Ajio etc.' },
  { id: 'historical',  label: 'Historical Analog',   desc: 'Past co-ord trend outcomes' },
  { id: 'analysis',    label: 'Buyer Recommendation',desc: 'AI reasoning layer' },
]


const DEMO_BUYER_NOTE = `Kaftan co-ords trialled last festive season (₹899, rayon, block print) — sold through 61% in 8 weeks across metro stores but moved poorly in Tier 2 and Tier 3 (38%). Category skews strongly occasion-wear: Eid, navratri, and beach/resort gifting drove most units. Reorder velocity was low — customers treat it as a one-off buy, not a wardrobe repeat. Rayon with wide sleeves had fitting complaints post-wash; cotton-modal blend performed better on returns. Our vendor needs 50-day lead on embroidery or block-print work. Max Fashion has started stocking kaftans at ₹699 with solid colours — differentiation needs to come from print story or silhouette detail. Suggest limiting depth to 80–120 units per store for trial; avoid wide size curve below S/M.`

const DEMO_FORM: TrendInput = {
  category: "Women's Apparel",
  subCategory: 'Co-ord Sets',
  keywords: 'Kaftan Coord Set',
  buyingHorizon: 'next-cycle',
  priceBand: '600-999',
  fabric: 'Cotton / Cotton-linen',
  buyerNote: DEMO_BUYER_NOTE,
}

export default function IntakePage() {
  const router = useRouter()
  const [mode, setMode] = useState<'live' | 'demo'>('demo')
  const [form, setForm] = useState<TrendInput>(DEMO_FORM)
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const [error, setError] = useState('')

  function switchMode(next: 'live' | 'demo') {
    setMode(next)
    setForm(next === 'demo' ? DEMO_FORM : {
      category: "Women's Apparel",
      subCategory: 'Co-ord Sets',
      keywords: '',
      buyingHorizon: 'next-cycle',
      priceBand: '600-999',
      fabric: 'Cotton / Cotton-linen',
      buyerNote: '',
    })
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    let pendingReport: ReturnType<typeof JSON.parse> | null = null
    let animationDone = false

    function finish(report: ReturnType<typeof JSON.parse>) {
      sessionStorage.setItem(`report-${report.id}`, JSON.stringify(report))
      router.push(`/report/${report.id}`)
    }

    let step = 0
    const interval = setInterval(() => {
      setCurrentStep(step)
      step++
      if (step >= PIPELINE_STEPS.length) {
        clearInterval(interval)
        animationDone = true
        if (pendingReport) finish(pendingReport)
      }
    }, 1800)

    try {
      if (mode === 'demo') {
        const res = await fetch('/sample-output.json')
        if (!res.ok) throw new Error('Could not load demo data')
        const report = await res.json()
        report.input = { ...report.input, buyerNote: form.buyerNote }
        if (animationDone) finish(report)
        else pendingReport = report
      } else {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Analysis failed')
        }
        const report = await res.json()
        if (animationDone) finish(report)
        else pendingReport = report
      }
    } catch (err) {
      clearInterval(interval)
      setLoading(false)
      setCurrentStep(-1)
      setError(err instanceof Error ? err.message : 'Something went wrong. Check your API keys.')
    }
  }

  const isDemo = mode === 'demo'

  return (
    <div className="min-h-screen" style={{ background: '#f1f5f9' }}>

      {/* ── Header ── */}
      <header className="border-b px-6 py-4 flex items-center justify-between" style={{ background: '#fff', borderColor: '#e2e8f0' }}>
        <div>
          <span className="font-bold text-lg tracking-tight" style={{ color: '#1d4ed8' }}>TrendBet</span>
          <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
            Fashion Buyer Copilot
          </span>
        </div>

        {/* Live / Demo toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl border" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
          <button
            type="button"
            onClick={() => switchMode('live')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
              mode === 'live' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'
            )}
          >
            <span className={cn('w-1.5 h-1.5 rounded-full', mode === 'live' ? 'bg-white animate-pulse' : 'bg-slate-300')} />
            Live Data
          </button>
          <button
            type="button"
            onClick={() => switchMode('demo')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
              mode === 'demo' ? 'text-amber-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            )}
            style={mode === 'demo' ? { background: '#fef08a' } : {}}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1C4.5 1 2 2.6 2 4.5v7C2 13.4 4.5 15 8 15s6-1.6 6-3.5v-7C14 2.6 11.5 1 8 1zm4.5 3.5c0 .8-2 1.5-4.5 1.5S3.5 5.3 3.5 4.5 5.5 3 8 3s4.5.7 4.5 1.5zM8 13.5c-2.5 0-4.5-.7-4.5-1.5v-1.2c1 .5 2.7.7 4.5.7s3.5-.2 4.5-.7v1.2c0 .8-2 1.5-4.5 1.5zm4.5-4c0 .8-2 1.5-4.5 1.5S3.5 10.3 3.5 9.5V8.3c1 .5 2.7.7 4.5.7s3.5-.2 4.5-.7v1.2z"/>
            </svg>
            Pre-loaded Demo
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#1d4ed8' }}>
            New Trend Intake: Women&apos;s Co-ord Sets
          </h1>
          <p className="text-sm" style={{ color: '#64748b' }}>
            {isDemo
              ? 'Pre-loaded with a Kaftan Co-ord Set evaluation. Fields are locked — switch to Live Data to enter your own trend.'
              : 'Describe the trend you\'re evaluating. TrendBet will cross-reference market signals, search momentum, and competitor inventory.'}
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-[1fr_280px] gap-7 items-start">

              {/* ── Form ── */}
              <form onSubmit={handleSubmit} className="space-y-4">

                <fieldset disabled={isDemo} className={cn('space-y-4', isDemo && 'opacity-60 pointer-events-none select-none')}>

                  {/* Section 1: Category + Sub-category */}
                  <div className="rounded-xl border bg-white p-5 shadow-sm" style={{ borderColor: '#e2e8f0' }}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: '#1d4ed8' }}>1</span>
                      <h2 className="font-bold text-base" style={{ color: '#1d4ed8' }}>Trend Description</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#94a3b8' }}>Category</label>
                        <div className="relative">
                          <select
                            className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none appearance-none pr-8 transition-colors"
                            style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}
                            value={form.category}
                            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                            onFocus={e => (e.target.style.borderColor = '#1d4ed8')}
                            onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                          >
                            {CATEGORIES.map(c => (
                              <option key={c.value} value={c.value} disabled={c.disabled}>
                                {c.value}{c.disabled ? ' (coming soon)' : ''}
                              </option>
                            ))}
                          </select>
                          <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#94a3b8' }}>Sub-category</label>
                        <div className="relative">
                          <select
                            className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none appearance-none pr-8 transition-colors"
                            style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}
                            value={form.subCategory}
                            onChange={e => setForm(f => ({ ...f, subCategory: e.target.value }))}
                            onFocus={e => (e.target.style.borderColor = '#1d4ed8')}
                            onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                          >
                            {SUBCATEGORIES.map(c => (
                              <option key={c.value} value={c.value} disabled={c.disabled}>
                                {c.value}{c.disabled ? ' (coming soon)' : ''}
                              </option>
                            ))}
                          </select>
                          <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold" style={{ color: '#0f172a' }}>Trend Keywords</span>
                        <span className="text-xs" style={{ color: '#94a3b8' }}>optional</span>
                      </div>
                      <p className="text-xs mb-2.5" style={{ color: '#94a3b8' }}>
                        Add adjectives or modifiers — e.g. vibe, print, silhouette detail. Sub-category is always the base.
                      </p>
                      <textarea
                        rows={3}
                        className="w-full rounded-lg border px-4 py-3 text-sm resize-none transition-colors focus:outline-none"
                        style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}
                        placeholder='"earthy utility cargo" or "floral print summer casual"'
                        value={form.keywords ?? ''}
                        onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))}
                        onFocus={e => (e.target.style.borderColor = '#1d4ed8')}
                        onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                      />
                    </div>
                  </div>

                  {/* Section 2: Buying Horizon */}
                  <div className="rounded-xl border bg-white p-5 shadow-sm" style={{ borderColor: '#e2e8f0' }}>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: '#1d4ed8' }}>2</span>
                      <h2 className="font-bold text-base" style={{ color: '#1d4ed8' }}>Buying Horizon</h2>
                    </div>
                    <p className="text-xs mb-4 ml-10" style={{ color: '#94a3b8' }}>
                      When do you need to commit inventory? This shapes what signal confidence level is required.
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      {BUYING_HORIZONS.map(h => {
                        const sel = form.buyingHorizon === h.value
                        return (
                          <button
                            key={h.value}
                            type="button"
                            onClick={() => setForm(f => ({ ...f, buyingHorizon: h.value }))}
                            className={cn(
                              'rounded-xl border p-3.5 text-left transition-all card-lift',
                              sel ? 'border-blue-500 ring-1 ring-blue-400' : 'border-slate-200 hover:border-blue-200'
                            )}
                            style={sel ? { background: '#eff6ff' } : { background: '#fff' }}
                          >
                            <div className="font-bold text-sm mb-0.5" style={{ color: sel ? '#1d4ed8' : '#0f172a' }}>{h.label}</div>
                            <div className="text-xs font-semibold mb-1.5" style={{ color: sel ? '#3b82f6' : '#94a3b8' }}>{h.sublabel}</div>
                            <div className="text-xs leading-snug" style={{ color: '#64748b' }}>{h.desc}</div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Section 3: Filters — Price Band + Fabric */}
                  <div className="rounded-xl border bg-white p-5 shadow-sm" style={{ borderColor: '#e2e8f0' }}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: '#1d4ed8' }}>3</span>
                      <h2 className="font-bold text-base" style={{ color: '#1d4ed8' }}>Filters</h2>
                    </div>

                    {/* Target Price Band */}
                    <div className="mb-5">
                      <div className="text-xs font-semibold uppercase tracking-wide mb-2.5" style={{ color: '#94a3b8' }}>Target Price Band</div>
                      <div className="grid grid-cols-3 gap-3">
                        {PRICE_BANDS.map(band => {
                          const sel = form.priceBand === band.value
                          return (
                            <button
                              key={band.value}
                              type="button"
                              onClick={() => setForm(f => ({ ...f, priceBand: band.value }))}
                              className={cn(
                                'rounded-xl border p-3.5 text-left transition-all card-lift',
                                sel ? 'border-blue-500 ring-1 ring-blue-400' : 'border-slate-200 hover:border-blue-200'
                              )}
                              style={sel ? { background: '#eff6ff' } : { background: '#f8fafc' }}
                            >
                              <div className="font-bold text-sm" style={{ color: sel ? '#1d4ed8' : '#0f172a' }}>{band.label}</div>
                              <div className="text-xs mt-0.5 font-medium" style={{ color: sel ? '#3b82f6' : '#94a3b8' }}>{band.sub}</div>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Fabric */}
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide mb-2.5" style={{ color: '#94a3b8' }}>Fabric</div>
                      <div className="flex flex-wrap gap-2">
                        {FABRICS.map(fab => {
                          const sel = form.fabric === fab
                          return (
                            <button
                              key={fab}
                              type="button"
                              onClick={() => setForm(f => ({ ...f, fabric: fab }))}
                              className={cn(
                                'px-3.5 py-2 rounded-lg border text-xs font-semibold transition-all',
                                sel
                                  ? 'border-blue-500 ring-1 ring-blue-400 text-blue-800'
                                  : 'border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-blue-50/30'
                              )}
                              style={sel ? { background: '#eff6ff' } : { background: '#f8fafc' }}
                            >
                              {fab}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                </fieldset>

                {/* Buyer Note — always editable */}
                <div className="rounded-xl border bg-white p-5 shadow-sm" style={{ borderColor: '#e2e8f0' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold" style={{ color: '#0f172a' }}>Buyer Note</span>
                    <span className="text-xs" style={{ color: '#94a3b8' }}>optional · always editable</span>
                  </div>
                  <p className="text-xs mb-3" style={{ color: '#94a3b8' }}>
                    Add past sell-through rates, store-level observations, vendor constraints, or any context that should act as a judgment layer against the market signals.
                  </p>
                  <textarea
                    rows={5}
                    className="w-full rounded-lg border px-4 py-3 text-sm resize-none transition-colors focus:outline-none"
                    style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}
                    placeholder="e.g. Last season's cargo co-ords sold through 78% in 6 weeks at metro stores but underperformed in Tier 2…"
                    value={form.buyerNote ?? ''}
                    onChange={e => setForm(f => ({ ...f, buyerNote: e.target.value }))}
                    onFocus={e => (e.target.style.borderColor = '#1d4ed8')}
                    onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                  />
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl py-4 px-6 font-bold text-white text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.99]"
                  style={{
                    background: isDemo ? '#b45309' : '#1d4ed8',
                    boxShadow: isDemo ? '0 4px 14px rgba(180,83,9,0.25)' : '0 4px 14px rgba(29,78,216,0.25)',
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                      Running Analysis…
                    </span>
                  ) : isDemo ? (
                    '📦  Load Pre-loaded Demo Report'
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                      Run TrendBet Analysis
                    </span>
                  )}
                </button>

                <p className="text-center text-xs pb-2" style={{ color: '#94a3b8' }}>
                  {isDemo
                    ? 'Loads cached Kaftan Co-ord Set report instantly — no API keys required.'
                    : 'Live analysis typically takes 30–90 seconds to process market signals.'}
                </p>
              </form>

              {/* ── Right sidebar ── */}
              <aside className="space-y-4 sticky top-0">

                {/* Analysis Pipeline */}
                <div className="rounded-xl border bg-white p-4 shadow-sm" style={{ borderColor: '#e2e8f0' }}>
                  <div className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: '#94a3b8' }}>Analysis Pipeline</div>
                  <div className="space-y-2.5">
                    {PIPELINE_STEPS.map((step, i) => {
                      const done = loading && currentStep > i
                      const active = loading && currentStep === i
                      return (
                        <div key={step.id} className="flex items-start gap-3">
                          <div
                            className={cn(
                              'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 transition-all duration-500',
                              done ? 'text-emerald-700' : active ? 'text-blue-700 animate-pulse' : 'text-slate-400'
                            )}
                            style={done ? { background: '#dcfce7' } : active ? { background: '#dbeafe' } : { background: '#f1f5f9' }}
                          >
                            {done ? (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                            ) : i + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold leading-tight" style={{ color: done ? '#15803d' : active ? '#1d4ed8' : '#0f172a' }}>
                              {step.label}
                            </div>
                            <div className="text-xs" style={{ color: '#94a3b8' }}>{step.desc}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {isDemo && (
                  <div className="rounded-xl border px-4 py-3 text-xs leading-relaxed" style={{ background: '#fffbeb', borderColor: '#fde68a', color: '#92400e' }}>
                    <span className="font-bold">Demo mode active.</span> Fields are pre-filled with a Kaftan Co-ord Set scenario. Switch to Live Data to enter your own trend.
                  </div>
                )}
              </aside>
        </div>
      </div>
    </div>
  )
}
