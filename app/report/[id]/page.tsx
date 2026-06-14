'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TrendReport, Confidence } from '@/lib/types'
import { cn } from '@/lib/utils'

const RECOMMENDATION_STYLES: Record<TrendReport['recommendation'], { bg: string; text: string; border: string; label: string }> = {
  'Deep Buy': { bg: 'bg-green-500', text: 'text-white', border: 'border-green-500', label: 'DEEP BUY' },
  'Small Trial Buy': { bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-500', label: 'SMALL TRIAL BUY' },
  'Monitor': { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-500', label: 'MONITOR' },
  'Avoid': { bg: 'bg-red-500', text: 'text-white', border: 'border-red-500', label: 'AVOID' },
}

const CONFIDENCE_STYLES: Record<Confidence, { dot: string; label: string }> = {
  'High': { dot: 'bg-green-500', label: 'High' },
  'Medium': { dot: 'bg-amber-400', label: 'Medium' },
  'Low': { dot: 'bg-red-400', label: 'Low' },
  'Insufficient Data': { dot: 'bg-gray-300', label: 'No Data' },
}

const SIGNAL_LABELS = {
  creator: 'Creator Pulse',
  marketplace: 'Marketplace Velocity',
  search_interest: 'Search Interest',
  competitor: 'Competitor Buy Map',
  historical: 'Historical Analog',
}

// Typed raw_data shapes matching what each fetcher returns
interface ShoppingResult {
  title: string
  price?: string
  source: string
  rating?: number
  reviews?: number
  link: string
}

interface YouTubeVideo {
  title: string
  channelTitle: string
  publishedAt: string
  viewCount: number
  likeCount: number
  videoId: string
}

interface InstagramMention {
  title: string
  link: string
  snippet: string
  date?: string
}

interface CompetitorListing {
  retailer: string
  title: string
  price?: string
  isNewArrival: boolean
  isOnSale: boolean
  url: string
}

interface GoogleTrendsResult {
  keyword: string
  timeline: { date: string; value: number }[]
  peakValue: number
  currentValue: number
  relatedQueries: string[]
  topRegions: string[]
}

interface HistoricalAnalog {
  id: string
  trend: string
  fabric: string
  silhouette: string
  print: string
  price_band: string
  season: string
  year: string
  outcome: string
  what_worked: string
  what_didnt: string
  india_fit_score: string
  notes: string
}

// Source panels — rendered inside expandable drawer per signal card
function MarketplaceSources({ data }: { data: ShoppingResult[] }) {
  if (!data || data.length === 0) return <p className="text-xs text-gray-400">No listing data available.</p>
  return (
    <div className="space-y-2">
      {data.map((item, i) => {
        const href = item.link || `https://www.google.com/search?q=${encodeURIComponent(item.title + ' ' + item.source)}&tbm=shop`
        return (
          <a
            key={i}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start justify-between gap-2 rounded border p-2 hover:bg-gray-50 transition-colors group cursor-pointer"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="min-w-0">
              <div className="text-xs font-medium truncate group-hover:underline">{item.title}</div>
              <div className="text-xs mt-0.5 flex gap-2" style={{ color: 'var(--muted)' }}>
                <span>{item.source}</span>
                {item.price && <><span>·</span><span className="font-medium">{item.price}</span></>}
                {item.reviews != null && item.reviews > 0 && <><span>·</span><span>{item.reviews.toLocaleString()} reviews</span></>}
                {item.rating != null && item.rating > 0 && <><span>·</span><span>★ {item.rating.toFixed(1)}</span></>}
              </div>
            </div>
            <span className="text-xs flex-shrink-0 mt-0.5" style={{ color: 'var(--muted)' }}>↗</span>
          </a>
        )
      })}
    </div>
  )
}

function CreatorSources({ data }: { data: { youtube: YouTubeVideo[]; instagram: InstagramMention[] } }) {
  if (!data) return <p className="text-xs text-gray-400">No creator data available.</p>
  const { youtube, instagram } = data
  if (instagram.length === 0) return <p className="text-xs text-gray-400">No Instagram mentions found.</p>

  return (
    <div className="space-y-3">
      {instagram.length > 0 && (
        <div>
          <div className="text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>Instagram mentions (via Google)</div>
          <div className="space-y-1.5">
            {instagram.map((m, i) => (
              <a
                key={i}
                href={m.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start justify-between gap-2 rounded border p-2 hover:bg-gray-50 transition-colors group"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate group-hover:underline">{m.title}</div>
                  {m.snippet && <div className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--muted)' }}>{m.snippet}</div>}
                </div>
                <span className="text-xs flex-shrink-0 mt-0.5" style={{ color: 'var(--muted)' }}>↗</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SearchTrendsSources({ data }: { data: GoogleTrendsResult | null }) {
  if (!data) return <p className="text-xs text-gray-400">No trends data available. Configure SERPAPI_KEY.</p>
  const trendsUrl = `https://trends.google.com/trends/explore?q=${encodeURIComponent(data.keyword)}&geo=IN`
  return (
    <div className="space-y-3">
      <a
        href={trendsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between rounded border p-2 hover:bg-gray-50 transition-colors group"
        style={{ borderColor: 'var(--border)' }}
      >
        <div>
          <div className="text-xs font-medium group-hover:underline">
            Google Trends India — &quot;{data.keyword}&quot;
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            Peak: {data.peakValue}/100 · Current: {data.currentValue}/100 · Last 12 months
          </div>
        </div>
        <span className="text-xs flex-shrink-0" style={{ color: 'var(--muted)' }}>↗</span>
      </a>
      {data.relatedQueries.length > 0 && (
        <div>
          <div className="text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>Related queries (rising + top)</div>
          <div className="flex flex-wrap gap-1.5">
            {data.relatedQueries.map((q, i) => (
              <a
                key={i}
                href={`https://trends.google.com/trends/explore?q=${encodeURIComponent(q)}&geo=IN`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-0.5 rounded-full border text-xs hover:bg-gray-50 transition-colors"
                style={{ borderColor: 'var(--border)' }}
              >
                {q} ↗
              </a>
            ))}
          </div>
        </div>
      )}
      {data.timeline.length > 0 && (
        <div>
          <div className="text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>Interest over time (last 8 data points)</div>
          <div className="flex items-end gap-0.5 h-10">
            {data.timeline.slice(-16).map((pt, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-amber-300"
                style={{ height: `${Math.max(4, (pt.value / 100) * 40)}px`, opacity: 0.7 + (i / 16) * 0.3 }}
                title={`${pt.date}: ${pt.value}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CompetitorSources({ data }: { data: CompetitorListing[] }) {
  if (!data || data.length === 0) return <p className="text-xs text-gray-400">No competitor listing data available.</p>
  const byRetailer = data.reduce<Record<string, CompetitorListing[]>>((acc, item) => {
    acc[item.retailer] = [...(acc[item.retailer] || []), item]
    return acc
  }, {})

  return (
    <div className="space-y-3">
      {Object.entries(byRetailer).map(([retailer, items]) => (
        <div key={retailer}>
          <div className="text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>{retailer}</div>
          <div className="space-y-1.5">
            {items.map((item, i) => {
              const href = item.url || `https://www.google.com/search?q=${encodeURIComponent(item.retailer + ' ' + item.title)}&tbm=shop`
              return (
              <a
                key={i}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start justify-between gap-2 rounded border p-2 hover:bg-gray-50 transition-colors group cursor-pointer"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate group-hover:underline">{item.title}</div>
                  <div className="text-xs mt-0.5 flex gap-1.5 flex-wrap" style={{ color: 'var(--muted)' }}>
                    {item.price && <span>{item.price}</span>}
                    {item.isNewArrival && <span className="px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">New Arrival</span>}
                    {item.isOnSale && <span className="px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 font-medium">On Sale</span>}
                  </div>
                </div>
                <span className="text-xs flex-shrink-0 mt-0.5" style={{ color: 'var(--muted)' }}>↗</span>
              </a>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function HistoricalSources({ data }: { data: HistoricalAnalog[] }) {
  if (!data || data.length === 0) return <p className="text-xs text-gray-400">No matching historical analogs found.</p>
  return (
    <div className="space-y-3">
      <div className="text-xs px-2 py-1 rounded" style={{ background: '#f8f8f4', color: 'var(--muted)' }}>
        Source: hand-curated dataset — /data/historical-analogs.json. Disclosed.
      </div>
      {data.map((analog, i) => (
        <div key={i} className="rounded border p-3 space-y-1.5" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold">{analog.trend}</div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{analog.year}</span>
          </div>
          <div className="text-xs flex gap-2 flex-wrap" style={{ color: 'var(--muted)' }}>
            <span>{analog.fabric}</span>
            {analog.season && <><span>·</span><span>{analog.season}</span></>}
            {analog.price_band && <><span>·</span><span>₹{analog.price_band}</span></>}
            <span>·</span>
            <span>India fit: {analog.india_fit_score}</span>
          </div>
          <div className="text-xs leading-relaxed font-medium">{analog.outcome.split('.')[0]}.</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-green-700 font-medium">Worked: </span>
              <span style={{ color: 'var(--muted)' }}>{analog.what_worked}</span>
            </div>
            <div>
              <span className="text-red-600 font-medium">Didn&apos;t: </span>
              <span style={{ color: 'var(--muted)' }}>{analog.what_didnt}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function SignalSourceDrawer({ signalKey, rawData }: { signalKey: string; rawData: unknown }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="text-xs font-medium flex items-center gap-1 hover:opacity-70 transition-opacity"
        style={{ color: 'var(--accent)' }}
      >
        {open ? '▲ Hide sources' : '▼ View sources'}
      </button>
      {open && (
        <div className="mt-2">
          {signalKey === 'marketplace' && <MarketplaceSources data={rawData as ShoppingResult[]} />}
          {signalKey === 'creator' && <CreatorSources data={rawData as { youtube: YouTubeVideo[]; instagram: InstagramMention[] }} />}
          {signalKey === 'search_interest' && <SearchTrendsSources data={rawData as GoogleTrendsResult | null} />}
          {signalKey === 'competitor' && <CompetitorSources data={rawData as CompetitorListing[]} />}
          {signalKey === 'historical' && <HistoricalSources data={rawData as HistoricalAnalog[]} />}
        </div>
      )}
    </div>
  )
}

export default function ReportPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [report, setReport] = useState<TrendReport | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem(`report-${id}`)
    if (stored) {
      setReport(JSON.parse(stored))
    } else {
      fetch('/sample-output.json')
        .then(r => r.json())
        .then(data => {
          if (data.id === id) setReport(data)
          else setNotFound(true)
        })
        .catch(() => setNotFound(true))
    }
  }, [id])

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center">
          <div className="text-2xl font-bold mb-2">Report not found</div>
          <button onClick={() => router.push('/')} className="text-sm underline" style={{ color: 'var(--accent)' }}>
            Start a new analysis
          </button>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-sm" style={{ color: 'var(--muted)' }}>Loading report…</div>
      </div>
    )
  }

  const rec = RECOMMENDATION_STYLES[report.recommendation]
  const signals = report.signals

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header className="border-b px-6 py-4 flex items-center justify-between" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/')} className="text-sm" style={{ color: 'var(--muted)' }}>
            ← New Analysis
          </button>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span className="font-bold text-lg tracking-tight">TrendBet</span>
        </div>
        <div className="text-xs" style={{ color: 'var(--muted)' }}>
          Data collected {new Date(report.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main report — left 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title + recommendation */}
          <div>
            <div className="text-xs mb-1" style={{ color: 'var(--muted)' }}>
              Trend Decision Report · {report.input.category} / {report.input.subCategory}
            </div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold leading-tight">{(report.input.keywords ?? report.input.subCategory).slice(0, 80)}{(report.input.keywords ?? '').length > 80 ? '…' : ''}</h1>
              <span className={cn('px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap flex-shrink-0', rec.bg, rec.text)}>
                {rec.label}
              </span>
            </div>
            <div className="flex gap-3 mt-2 text-xs" style={{ color: 'var(--muted)' }}>
              <span>₹{report.input.priceBand}</span>
              <span>·</span>
              <span>{report.input.fabric}</span>
              {report.input.buyingHorizon && (
                <>
                  <span>·</span>
                  <span>
                    {report.input.buyingHorizon === 'immediate' ? 'Immediate (0–30d)' : report.input.buyingHorizon === 'next-cycle' ? 'Next Cycle (31–90d)' : 'Future Bet (90+d)'}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* 5 Signal Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.keys(signals) as (keyof typeof signals)[]).map(key => {
              const sig = signals[key]
              const conf = CONFIDENCE_STYLES[sig.confidence]
              return (
                <div key={key} className="rounded-lg border p-4" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                      {SIGNAL_LABELS[key]}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={cn('w-2 h-2 rounded-full', conf.dot)} />
                      <span className="text-xs font-medium">{conf.label}</span>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed mb-2">{sig.evidence_summary}</p>
                  <div className="border-t pt-2 mt-2 space-y-1" style={{ borderColor: 'var(--border)' }}>
                    <div className="text-xs"><span className="font-medium">Proves:</span> <span style={{ color: 'var(--muted)' }}>{sig.what_it_proves}</span></div>
                    <div className="text-xs"><span className="font-medium text-amber-600">Watch:</span> <span style={{ color: 'var(--muted)' }}>{sig.what_could_mislead}</span></div>
                  </div>
                  <SignalSourceDrawer signalKey={key} rawData={sig.raw_data} />
                </div>
              )
            })}
          </div>

          {/* Disagreement View — always rendered, amber callout */}
          <div className="rounded-lg border-l-4 p-4" style={{ background: '#fffbeb', borderLeftColor: '#f59e0b', borderColor: '#fde68a' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-amber-600 font-bold text-sm">Signal Disagreement · Where to probe further</span>
            </div>
            <p className="text-sm leading-relaxed">{report.disagreement_view}</p>
          </div>

          {/* India Value-Fashion Translation */}
          <div className="rounded-lg border p-5" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>
              India Value-Fashion Translation
            </div>
            <div className="grid grid-cols-2 gap-3">
              {([
                ['Climate Fit', report.india_fit.climate],
                ['Modesty Norms', report.india_fit.modesty_norms],
                ['Price Sensitivity', report.india_fit.price_sensitivity],
                ['Occasion Relevance', report.india_fit.occasion_relevance],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label}>
                  <div className="text-xs font-medium mb-0.5">{label}</div>
                  <div className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{value}</div>
                </div>
              ))}
            </div>
            {report.india_fit.overall && (
              <div className="mt-3 pt-3 border-t text-xs leading-relaxed font-medium" style={{ borderColor: 'var(--border)' }}>
                Overall: {report.india_fit.overall}
              </div>
            )}
          </div>

          {/* Caveats */}
          {report.caveats.length > 0 && (
            <div className="rounded-lg border p-4" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>
                Skepticism Points
              </div>
              <ul className="space-y-1.5">
                {report.caveats.map((c, i) => (
                  <li key={i} className="text-xs flex gap-2">
                    <span className="text-gray-400 flex-shrink-0">–</span>
                    <span style={{ color: 'var(--muted)' }}>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          {/* Recommendation card */}
          <div className="rounded-lg border p-5" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className={cn('inline-flex px-3 py-1 rounded-full text-xs font-bold mb-3', rec.bg, rec.text)}>
              {rec.label}
            </div>
            {report.suggested_units && (
              <div className="mb-3">
                <div className="text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>Suggested Bet Size</div>
                <div className="text-2xl font-bold">{report.suggested_units}</div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>units (initial order)</div>
              </div>
            )}
          </div>

          {/* Evidence Gaps */}
          {report.evidence_gaps.length > 0 && (
            <div className="rounded-lg border p-4" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>
                Evidence Gaps
              </div>
              <ul className="space-y-1.5">
                {report.evidence_gaps.map((gap, i) => (
                  <li key={i} className="text-xs flex gap-2">
                    <span className="text-amber-500 flex-shrink-0">·</span>
                    <span>{gap}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommended Actions */}
          {report.recommended_actions.length > 0 && (
            <div className="rounded-lg border p-4" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>
                Recommended Actions
              </div>
              <ul className="space-y-2">
                {report.recommended_actions.map((action, i) => (
                  <li key={i} className="text-xs flex gap-2 items-start">
                    <span className="w-4 h-4 rounded flex items-center justify-center text-white text-xs flex-shrink-0 mt-0.5" style={{ background: 'var(--accent)' }}>{i + 1}</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Export note */}
          <div className="rounded-lg border border-dashed p-4 text-center" style={{ borderColor: 'var(--border)' }}>
            <div className="text-xs font-medium mb-1">Export this report</div>
            <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>
              Print or save as PDF for buying cycle documentation.
            </p>
            <button
              onClick={() => window.print()}
              className="text-xs px-3 py-1.5 rounded border font-medium"
              style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
            >
              Print / Save PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
