'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TrendReport, Confidence } from '@/lib/types'
import { cn } from '@/lib/utils'

// ─── Config ──────────────────────────────────────────────────────────────────

const REC_CONFIG: Record<TrendReport['recommendation'], {
  bg: string; text: string; label: string; icon: React.ReactNode; unitColor: string
}> = {
  'Deep Buy':        { bg: 'bg-emerald-600 hover:bg-emerald-700', text: 'text-white', label: 'DEEP BUY',        unitColor: 'text-emerald-700', icon: <UpIcon /> },
  'Small Trial Buy': { bg: 'bg-amber-500 hover:bg-amber-600',     text: 'text-white', label: 'SMALL TRIAL BUY', unitColor: 'text-amber-600',   icon: <RightIcon /> },
  'Monitor':         { bg: 'bg-blue-600 hover:bg-blue-700',       text: 'text-white', label: 'MONITOR',          unitColor: 'text-blue-700',    icon: <PulseIcon /> },
  'Avoid':           { bg: 'bg-red-600 hover:bg-red-700',         text: 'text-white', label: 'AVOID',            unitColor: 'text-red-700',     icon: <DownIcon /> },
}

const CONF_CONFIG: Record<Confidence, { badge: string; bar: string; barWidth: string; label: string; dot: string }> = {
  'High':              { badge: 'bg-blue-100 text-blue-800',   bar: 'bg-blue-500',    barWidth: '90%', label: 'HIGH',  dot: '#3b82f6' },
  'Medium':            { badge: 'bg-amber-100 text-amber-700', bar: 'bg-amber-400',   barWidth: '55%', label: 'MED',   dot: '#f59e0b' },
  'Low':               { badge: 'bg-red-100 text-red-700',     bar: 'bg-red-400',     barWidth: '25%', label: 'LOW',   dot: '#ef4444' },
  'Insufficient Data': { badge: 'bg-slate-100 text-slate-500', bar: 'bg-slate-300',   barWidth: '8%',  label: 'N/A',   dot: '#94a3b8' },
}

const SIGNAL_META: Record<string, { label: string; icon: React.ReactNode; iconBg: string }> = {
  creator:         { label: 'Creator Pulse',      icon: <SendIcon />,  iconBg: 'bg-purple-50 text-purple-600' },
  marketplace:     { label: 'Marketplace Demand', icon: <BagIcon />,   iconBg: 'bg-blue-50 text-blue-600' },
  search_interest: { label: 'Search Interest',    icon: <WaveIcon />,  iconBg: 'bg-teal-50 text-teal-600' },
  competitor:      { label: 'Competitor Buy Map', icon: <HouseIcon />, iconBg: 'bg-indigo-50 text-indigo-600' },
  historical:      { label: 'Historical Analog',  icon: <ClockIcon />, iconBg: 'bg-rose-50 text-rose-600' },
}

const RADAR_KEYS = ['creator', 'marketplace', 'search_interest', 'competitor', 'historical'] as const
const RADAR_LABELS = ['Creator', 'Marketplace', 'Search', 'Competitor', 'Historical']
const CONF_VALUES: Record<Confidence, number> = { 'High': 0.9, 'Medium': 0.55, 'Low': 0.25, 'Insufficient Data': 0.1 }

// ─── Icons ────────────────────────────────────────────────────────────────────

function UpIcon()    { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg> }
function RightIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg> }
function DownIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg> }
function PulseIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> }
function SendIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg> }
function BagIcon()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg> }
function WaveIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> }
function HouseIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> }
function ClockIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> }
function SearchIcon(){ return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> }
function ChevR()     { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg> }
function AlertIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> }
function ShareIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg> }
function DlIcon()    { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> }
function DotsIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg> }
function ArrowIcon() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeOpacity="0.6" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg> }
function BoxIcon()     { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="12" height="12" rx="2" stroke="#d1d5db" strokeWidth="1.5"/></svg> }
function ChevDownIcon(){ return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg> }

// ─── Helpers (early — used by source components below) ───────────────────────

function sanitizeLink(link: string, fallbackQuery: string): string {
  if (!link || /_sample|sample\d|sample_\d/i.test(link)) {
    return `https://www.google.com/search?q=${encodeURIComponent(fallbackQuery)}`
  }
  const ytMatch = link.match(/youtube\.com\/watch\?v=(.+)/)
  if (ytMatch && !/^[A-Za-z0-9_-]{11}$/.test(ytMatch[1])) {
    return `https://www.google.com/search?q=${encodeURIComponent(fallbackQuery)}`
  }
  return link
}

function buildDisplayTitle(keywords: string, subCategory: string): string {
  const kl = keywords.toLowerCase()
  const firstSubWord = subCategory.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
  if (kl.includes(firstSubWord)) return keywords
  return `${keywords} ${subCategory}`
}

// ─── Raw data types ───────────────────────────────────────────────────────────

interface ShoppingResult   { title: string; price?: string; source: string; rating?: number; reviews?: number; link: string }
interface YouTubeVideo     { title: string; channelTitle: string; publishedAt: string; viewCount: number; likeCount: number; videoId: string }
interface InstagramMention { title: string; link: string; snippet: string; date?: string }
interface CompetitorListing{ retailer: string; title: string; price?: string; isNewArrival: boolean; isOnSale: boolean; url: string }
interface GoogleTrendsResult{ keyword: string; timeline: { date: string; value: number }[]; peakValue: number; currentValue: number; relatedQueries: string[]; topRegions: string[] }
interface HistoricalAnalog  { id: string; trend: string; fabric: string; silhouette: string; print: string; price_band: string; season: string; year: string; outcome: string; what_worked: string; what_didnt: string; india_fit_score: string; notes: string }

// ─── Inline visualisations ────────────────────────────────────────────────────

function SearchSparkline({ data }: { data: GoogleTrendsResult }) {
  const pts = data.timeline.slice(-24)
  if (!pts.length) return null
  const max = Math.max(...pts.map(p => p.value), 1)
  const W = 200, H = 52
  const coords = pts.map((p, i) => ({
    x: (i / Math.max(pts.length - 1, 1)) * W,
    y: H - 6 - (p.value / max) * (H - 12),
  }))
  const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ')
  const area = `${line} L ${W} ${H} L 0 ${H} Z`
  const last = coords[coords.length - 1]
  const peakIdx = pts.indexOf(pts.reduce((a, b) => a.value > b.value ? a : b))
  const peak = coords[peakIdx]
  return (
    <div className="mt-3 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400 font-medium">Search trend · India · 12 months</span>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-500">Peak <strong className="text-slate-700">{data.peakValue}</strong></span>
          <span className="text-blue-600 font-semibold">Now {data.currentValue}</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg overflow-hidden" height={H} preserveAspectRatio="none">
        <defs>
          <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#sg)" />
        <path d={line} fill="none" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        {/* Peak marker */}
        <circle cx={peak.x.toFixed(1)} cy={peak.y.toFixed(1)} r="3" fill="#f59e0b" stroke="white" strokeWidth="1.5" />
        {/* Current value marker */}
        <circle cx={last.x.toFixed(1)} cy={last.y.toFixed(1)} r="3.5" fill="#3b82f6" stroke="white" strokeWidth="1.5" />
      </svg>
      {data.topRegions?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {data.topRegions.slice(0, 4).map(r => (
            <span key={r} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">{r}</span>
          ))}
        </div>
      )}
    </div>
  )
}

function MarketplaceBar({ listings, priceBand }: { listings: ShoppingResult[]; priceBand: string }) {
  const m = priceBand.replace(/[₹\s]/g, '').match(/(\d+)[–—\-](\d+)/)
  if (!m) return null
  const [, lo, hi] = m
  const bandMin = parseInt(lo), bandMax = parseInt(hi)
  const inBand = listings.filter(l => {
    const n = parseFloat((l.price ?? '').replace(/[₹,]/g, ''))
    return !isNaN(n) && n >= bandMin && n <= bandMax
  }).length
  const total = listings.length
  const pct = total > 0 ? Math.round((inBand / total) * 100) : 0

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">In-band listings (₹{bandMin}–₹{bandMax})</span>
        <span className="text-sm font-bold text-slate-800">{inBand}<span className="text-xs font-normal text-slate-400">/{total}</span></span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />In-band ({pct}%)</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-200 inline-block" />Premium / out-of-band</span>
      </div>
    </div>
  )
}

function CompetitorBars({ listings }: { listings: CompetitorListing[] }) {
  const byRetailer = listings.reduce<Record<string, { count: number; hasNew: boolean }>>((acc, l) => {
    if (!acc[l.retailer]) acc[l.retailer] = { count: 0, hasNew: false }
    acc[l.retailer].count++
    if (l.isNewArrival) acc[l.retailer].hasNew = true
    return acc
  }, {})
  const rows = Object.entries(byRetailer)
  const max = Math.max(...rows.map(([, v]) => v.count), 1)
  return (
    <div className="mt-3 space-y-2.5">
      <div className="text-xs font-medium text-slate-500">Retailer presence</div>
      {rows.map(([name, { count, hasNew }]) => (
        <div key={name} className="flex items-center gap-2.5">
          <span className="text-xs text-slate-600 font-semibold w-20 shrink-0 truncate">{name}</span>
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${(count / max) * 100}%` }} />
          </div>
          <span className="text-xs text-slate-400 shrink-0 w-12">{count} SKU{count !== 1 ? 's' : ''}</span>
          {hasNew && <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold shrink-0">New ↑</span>}
        </div>
      ))}
    </div>
  )
}

function HistoricalMatch({ analogs }: { analogs: HistoricalAnalog[] }) {
  if (!analogs.length) return null
  const top = analogs[0]
  const scoreMap: Record<string, number> = { high: 88, medium: 62, moderate: 62, low: 32 }
  const score = scoreMap[top.india_fit_score?.toLowerCase() ?? ''] ?? 58
  const circ = 2 * Math.PI * 18
  return (
    <div className="mt-3 flex items-center gap-3 p-3 rounded-xl bg-rose-50 border border-rose-100">
      {/* Score ring */}
      <div className="relative w-12 h-12 shrink-0">
        <svg viewBox="0 0 40 40" width="48" height="48">
          <circle cx="20" cy="20" r="18" fill="none" stroke="#fce7f3" strokeWidth="3.5" />
          <circle cx="20" cy="20" r="18" fill="none" stroke="#f43f5e" strokeWidth="3.5"
            strokeDasharray={`${(score / 100) * circ} ${circ}`}
            strokeDashoffset={circ * 0.25}
            strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-rose-600">{score}</div>
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-slate-700 truncate">{top.trend}</div>
        <div className="text-xs text-slate-400 mt-0.5">{top.year} · {top.fabric} · India fit: {top.india_fit_score}</div>
        <div className="text-xs text-slate-500 mt-1 line-clamp-1">{top.outcome.split('.')[0]}.</div>
      </div>
    </div>
  )
}

function InlineViz({ signalKey, rawData, priceBand }: { signalKey: string; rawData: unknown; priceBand: string }) {
  if (signalKey === 'search_interest') {
    const d = rawData as GoogleTrendsResult | null
    if (d?.timeline?.length) return <SearchSparkline data={d} />
  }
  if (signalKey === 'marketplace') {
    const d = rawData as ShoppingResult[]
    if (d?.length) return <MarketplaceBar listings={d} priceBand={priceBand} />
  }
  if (signalKey === 'competitor') {
    const d = rawData as CompetitorListing[]
    if (d?.length) return <CompetitorBars listings={d} />
  }
  if (signalKey === 'historical') {
    const d = rawData as HistoricalAnalog[]
    if (d?.length) return <HistoricalMatch analogs={d} />
  }
  return null
}

// ─── Radar chart ─────────────────────────────────────────────────────────────

function RadarChart({ signals }: { signals: TrendReport['signals'] }) {
  const cx = 120, cy = 120, maxR = 85
  const n = RADAR_KEYS.length
  const angle = (i: number) => (i * 2 * Math.PI / n) - Math.PI / 2
  const pt = (a: number, r: number) => ({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) })
  const ptsStr = (r: number) => RADAR_KEYS.map((_, i) => { const p = pt(angle(i), r); return `${p.x.toFixed(1)},${p.y.toFixed(1)}` }).join(' ')

  const values = RADAR_KEYS.map(k => CONF_VALUES[signals[k as keyof typeof signals]?.confidence ?? 'Insufficient Data'])
  const confs  = RADAR_KEYS.map(k => signals[k as keyof typeof signals]?.confidence ?? 'Insufficient Data' as Confidence)
  const sigPts = RADAR_KEYS.map((_, i) => pt(angle(i), values[i] * maxR))
  const polygon = sigPts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

  return (
    <svg viewBox="0 0 240 240" width="200" height="200" className="shrink-0 anim-radarIn">
      {/* Grid rings */}
      {[0.25, 0.55, 0.9].map((lvl, i) => (
        <polygon key={i} points={ptsStr(lvl * maxR)} fill="none" stroke="#e2e8f0" strokeWidth="1" />
      ))}
      {/* Level labels */}
      {[{ lvl: 0.25, label: 'Low' }, { lvl: 0.55, label: 'Med' }, { lvl: 0.9, label: 'High' }].map(({ lvl, label }) => {
        const p = pt(angle(0), lvl * maxR)
        return <text key={label} x={(p.x - 2).toFixed(1)} y={(p.y - 4).toFixed(1)} fontSize="7" fill="#cbd5e1" textAnchor="middle">{label}</text>
      })}
      {/* Axis spokes */}
      {RADAR_KEYS.map((_, i) => {
        const outer = pt(angle(i), maxR); return <line key={i} x1={cx} y1={cy} x2={outer.x.toFixed(1)} y2={outer.y.toFixed(1)} stroke="#e2e8f0" strokeWidth="1" />
      })}
      {/* Filled signal polygon */}
      <polygon points={polygon} fill="#3b82f618" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" />
      {/* Confidence dots */}
      {sigPts.map((p, i) => (
        <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="5"
          fill={CONF_CONFIG[confs[i] as Confidence]?.dot ?? '#94a3b8'} stroke="white" strokeWidth="2" />
      ))}
      {/* Labels */}
      {RADAR_KEYS.map((_, i) => {
        const lp = pt(angle(i), maxR + 22)
        return (
          <text key={i} x={lp.x.toFixed(1)} y={lp.y.toFixed(1)}
            textAnchor="middle" dominantBaseline="middle"
            fontSize="9.5" fill="#64748b" fontFamily="system-ui,sans-serif" fontWeight="600">
            {RADAR_LABELS[i]}
          </text>
        )
      })}
    </svg>
  )
}

// ─── Source panels ────────────────────────────────────────────────────────────

function SrcLink({ href, label, sub }: { href: string; label: string; sub?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="flex items-start justify-between gap-2 rounded-xl border border-slate-100 px-3 py-2.5 hover:bg-slate-50 transition-colors group">
      <div className="min-w-0">
        <div className="text-sm font-medium text-slate-700 truncate group-hover:underline">{label}</div>
        {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
      </div>
      <span className="text-slate-300 text-xs shrink-0 mt-0.5">↗</span>
    </a>
  )
}

function MarketplaceSources({ data }: { data: ShoppingResult[] }) {
  if (!data?.length) return <p className="text-sm text-slate-400">No listing data.</p>
  return (
    <div className="space-y-1.5">
      {data.map((item, i) => (
        <SrcLink key={i}
          href={sanitizeLink(item.link, `${item.title} ${item.source} site:${item.source.toLowerCase().replace(/\s/g,'')}.com`)}
          label={item.title}
          sub={[item.source, item.price, item.reviews ? `${item.reviews.toLocaleString()} reviews` : '', item.rating ? `★ ${item.rating.toFixed(1)}` : ''].filter(Boolean).join(' · ')} />
      ))}
    </div>
  )
}

function CreatorSources({ data }: { data: { youtube: YouTubeVideo[]; instagram: InstagramMention[] } }) {
  if (!data?.youtube?.length && !data?.instagram?.length) return <p className="text-sm text-slate-400">No creator data.</p>
  return (
    <div className="space-y-3">
      {data?.youtube?.length > 0 && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">YouTube videos</div>
          <div className="space-y-1.5">
            {data.youtube.map((v, i) => (
              <SrcLink key={i}
                href={sanitizeLink(`https://www.youtube.com/watch?v=${v.videoId}`, `${v.title} ${v.channelTitle}`)}
                label={v.title}
                sub={[v.channelTitle, `${v.viewCount.toLocaleString()} views`, new Date(v.publishedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })].filter(Boolean).join(' · ')} />
            ))}
          </div>
        </div>
      )}
      {data?.instagram?.length > 0 && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Instagram mentions via Google</div>
          <div className="space-y-1.5">
            {data.instagram.map((m, i) => (
              <SrcLink key={i} href={sanitizeLink(m.link, m.title)} label={m.title} sub={m.snippet} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SearchTrendsSources({ data }: { data: GoogleTrendsResult | null }) {
  if (!data) return <p className="text-sm text-slate-400">No trends data. Configure SERPAPI_KEY.</p>
  return (
    <div className="space-y-3">
      <SrcLink
        href={`https://trends.google.com/trends/explore?q=${encodeURIComponent(data.keyword)}&geo=IN`}
        label={`Google Trends India — "${data.keyword}"`}
        sub={`Peak ${data.peakValue}/100 · Now ${data.currentValue}/100 · Last 12 months`} />
      {data.relatedQueries.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {data.relatedQueries.map((q, i) => {
            const isRising = /↑/.test(q)
            const label = q.replace(/↑+/g, '').trim()
            return (
              <a key={i} href={`https://trends.google.com/trends/explore?q=${encodeURIComponent(label)}&geo=IN`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-200 text-xs text-slate-500 hover:bg-slate-50">
                {isRising && <span className="text-emerald-500 font-bold">↑</span>}
                {label} ↗
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CompetitorSources({ data }: { data: CompetitorListing[] }) {
  if (!data?.length) return <p className="text-sm text-slate-400">No competitor data.</p>
  const byRetailer = data.reduce<Record<string, CompetitorListing[]>>((acc, l) => { acc[l.retailer] = [...(acc[l.retailer] || []), l]; return acc }, {})
  return (
    <div className="space-y-3">
      {Object.entries(byRetailer).map(([retailer, items]) => (
        <div key={retailer}>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">{retailer}</div>
          <div className="space-y-1.5">
            {items.map((item, i) => (
              <SrcLink key={i}
                href={sanitizeLink(item.url, `${item.retailer} ${item.title}`)}
                label={item.title}
                sub={[item.price, item.isNewArrival ? 'New Arrival' : '', item.isOnSale ? 'On Sale' : ''].filter(Boolean).join(' · ')} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function HistoricalSources({ data }: { data: HistoricalAnalog[] }) {
  if (!data?.length) return <p className="text-sm text-slate-400">No analog matches.</p>
  return (
    <div className="space-y-2.5">
      <div className="text-xs px-3 py-1.5 rounded-xl bg-slate-50 text-slate-400">Hand-curated dataset · /data/historical-analogs.json · Disclosed</div>
      {data.map((a, i) => (
        <div key={i} className="rounded-xl border border-slate-100 p-3.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-semibold text-slate-700">{a.trend}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{a.year}</span>
          </div>
          <div className="text-xs text-slate-400 mb-2">{[a.fabric, a.season, `₹${a.price_band}`, `Fit: ${a.india_fit_score}`].filter(Boolean).join(' · ')}</div>
          <div className="text-sm font-medium text-slate-700 mb-2">{a.outcome.split('.')[0]}.</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><span className="text-emerald-700 font-semibold">✓ </span><span className="text-slate-500">{a.what_worked}</span></div>
            <div><span className="text-red-600 font-semibold">✗ </span><span className="text-slate-500">{a.what_didnt}</span></div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Collapsible section wrapper ──────────────────────────────────────────────

function CollapseSection({
  title, badge, icon, children, defaultOpen = false, accent, dark = false,
}: {
  title: string; badge?: React.ReactNode; icon?: React.ReactNode
  children: React.ReactNode; defaultOpen?: boolean; accent?: string; dark?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div
      className={cn('rounded-2xl border overflow-hidden', dark ? 'border-transparent' : 'bg-white border-slate-200')}
      style={{ ...(dark ? { background: '#1e3a8a' } : {}), ...(accent ? { borderLeft: `4px solid ${accent}` } : {}) }}
    >
      {/* Header — label only, not a toggle */}
      <div className="flex items-center gap-2 px-5 py-3.5 min-w-0">
        {icon}
        <span className={cn('text-sm font-bold', dark ? 'text-white' : 'text-slate-700')}>{title}</span>
        {badge}
      </div>

      {/* Content with soft fade-preview */}
      <div className="relative px-5">
        <div
          className="overflow-hidden transition-[max-height] duration-500 ease-in-out"
          style={{ maxHeight: open ? '2000px' : '148px' }}
        >
          <div className={open ? 'pb-4' : ''}>{children}</div>
        </div>
        {!open && (
          <div
            className="absolute bottom-0 left-0 right-0 h-14 pointer-events-none"
            style={{
              background: dark
                ? 'linear-gradient(to top, #1e3a8a, transparent)'
                : 'linear-gradient(to top, white, transparent)',
            }}
          />
        )}
      </div>

      {/* View more / Show less */}
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          'w-full px-5 py-2.5 text-xs font-semibold text-left flex items-center gap-1 transition-colors border-t',
          dark
            ? 'text-blue-300 hover:text-white border-white/10'
            : 'text-blue-500 hover:text-blue-700 border-slate-100'
        )}
      >
        {open ? '↑ Show less' : 'View more →'}
      </button>
    </div>
  )
}

function SignalSourceDrawer({ signalKey, rawData, defaultOpen = false }: { signalKey: string; rawData: unknown; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="mt-3 pt-3 border-t border-slate-100">
      <button onClick={() => setOpen(v => !v)}
        className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1">
        <span className="text-[10px]">{open ? '▲' : '▼'}</span>
        {open ? 'Hide sources' : 'View sources'}
      </button>
      {open && (
        <div className="mt-3">
          {signalKey === 'marketplace'     && <MarketplaceSources data={rawData as ShoppingResult[]} />}
          {signalKey === 'creator'         && <CreatorSources data={rawData as { youtube: YouTubeVideo[]; instagram: InstagramMention[] }} />}
          {signalKey === 'search_interest' && <SearchTrendsSources data={rawData as GoogleTrendsResult | null} />}
          {signalKey === 'competitor'      && <CompetitorSources data={rawData as CompetitorListing[]} />}
          {signalKey === 'historical'      && <HistoricalSources data={rawData as HistoricalAnalog[]} />}
        </div>
      )}
    </div>
  )
}

// ─── Animated confidence bar ──────────────────────────────────────────────────

function AnimatedBar({ width, color, height = 'h-[3px]' }: { width: string; color: string; height?: string }) {
  const [w, setW] = useState('0%')
  useEffect(() => {
    const t = requestAnimationFrame(() => setW(width))
    return () => cancelAnimationFrame(t)
  }, [width])
  return (
    <div className={cn(height, 'bg-slate-100 rounded-full overflow-hidden')}>
      <div className={cn('h-full rounded-full transition-all duration-700 ease-out', color)} style={{ width: w }} />
    </div>
  )
}

// ─── Signal card ──────────────────────────────────────────────────────────────

function SignalCard({ signalKey, sig, fullWidth, priceBand, animDelay = 0 }: {
  signalKey: string
  sig: TrendReport['signals'][keyof TrendReport['signals']]
  fullWidth?: boolean
  priceBand: string
  animDelay?: number
}) {
  const [open, setOpen] = useState(true)
  const conf = CONF_CONFIG[sig.confidence]
  const meta = SIGNAL_META[signalKey] ?? { label: signalKey, icon: null, iconBg: 'bg-slate-50 text-slate-500' }
  return (
    <div
      className={cn('bg-white rounded-2xl border border-slate-200 p-5 flex flex-col card-lift anim-fadeInUp', fullWidth && 'sm:col-span-2')}
      style={{ animationDelay: `${animDelay}ms` }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className={cn('p-2 rounded-xl shrink-0 transition-transform duration-200 group-hover:scale-110', meta.iconBg)}>{meta.icon}</span>
          <span className="text-sm font-bold text-slate-700">{meta.label}</span>
        </div>
        <span className={cn('px-2.5 py-1 rounded-full text-xs font-bold tracking-wide', conf.badge)}>
          {conf.label}
        </span>
      </div>
      <p className={cn('text-sm text-slate-600 leading-relaxed flex-1', !open && 'line-clamp-3')}>
        {sig.evidence_summary}
      </p>
      <div className="mt-3">
        <AnimatedBar width={conf.barWidth} color={conf.bar} />
      </div>
      {/* Smooth accordion */}
      <div className={cn('expand-grid', open && 'open')}>
        <div>
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
          <InlineViz signalKey={signalKey} rawData={sig.raw_data} priceBand={priceBand} />
          <p className="text-sm leading-relaxed">
            <span className="font-semibold text-slate-800">Proves — </span>
            <span className="text-slate-500">{sig.what_it_proves}</span>
          </p>
          <p className="text-sm leading-relaxed">
            <span className="font-semibold text-amber-600">Watch — </span>
            <span className="text-slate-500">{sig.what_could_mislead}</span>
          </p>
          <SignalSourceDrawer signalKey={signalKey} rawData={sig.raw_data} />
        </div>
        </div>
      </div>
      <button onClick={() => setOpen(v => !v)}
        className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors self-start flex items-center gap-1">
        <span className={cn('transition-transform duration-200 inline-block', open && 'rotate-180')}>▼</span>
        {open ? 'Collapse' : 'Detail'}
      </button>
    </div>
  )
}

// ─── India Fit ────────────────────────────────────────────────────────────────

function IndiaFitSection({ fit }: { fit: TrendReport['india_fit'] }) {
  const [open, setOpen] = useState(false)
  const cells: [string, string, string][] = [
    ['🌡️', 'Climate',    fit.climate],
    ['👗', 'Modesty',    fit.modesty_norms],
    ['₹',  'Price Band', fit.price_sensitivity],
    ['🎉', 'Occasion',   fit.occasion_relevance],
  ]
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-bold text-slate-700">India Value-Fashion Translation</span>
        <button onClick={() => setOpen(v => !v)}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">
          {open ? '▲ Less' : '▼ Detail'}
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {cells.map(([emoji, label, value]) => (
          <div key={label} className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
            <div className="text-2xl mb-1.5">{emoji}</div>
            <div className="text-xs font-bold text-slate-500 mb-1">{label}</div>
            <div className="text-xs text-slate-600 leading-snug line-clamp-2">{value.split('.')[0]}</div>
          </div>
        ))}
      </div>
      {open && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          {cells.map(([emoji, label, value]) => (
            <div key={label} className="rounded-xl bg-slate-50 border border-slate-100 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{emoji}</span>
                <span className="text-sm font-bold text-slate-700">{label}</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">{value}</p>
            </div>
          ))}
        </div>
      )}
      {fit.overall && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-sm text-slate-600 leading-relaxed">
            <span className="font-semibold text-slate-400">Overall — </span>{fit.overall}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractUnits(text: string): { range: string } {
  const m = text.match(/^([\d,–—-]+\s*units?\s*(?:per\s+store)?(?:\s*\([^)]+\))?)/i)
  return { range: m ? m[1].trim() : text.split('.')[0] }
}

function parseUnitNumbers(range: string): { min: number; max: number } | null {
  const m = range.match(/(\d+)[–—\-](\d+)/)
  if (m) return { min: parseInt(m[1]), max: parseInt(m[2]) }
  const n = parseInt(range)
  return isNaN(n) ? null : { min: n, max: n }
}

interface SellThroughTriggers { reorder: string; hold: string; markdown: string; markdownPrice: string; exit: string }

function parseSellThroughTriggers(actions: string[]): SellThroughTriggers | null {
  const a = actions.find(x => x.toLowerCase().includes('sell-through') && x.includes('%'))
  if (!a) return null
  const reorder  = a.match(/reorder if (?:above|>|≥)\s*(\d+)%/i)?.[1]
  const mdown    = a.match(/markdown (?:to )?(₹[\d,]+) if (?:below|<)\s*(\d+)%/i)
  const exit     = a.match(/exit if (?:below|<)\s*(\d+)%/i)?.[1]
  if (!reorder && !exit) return null
  const ro = reorder ?? '55', ex = exit ?? '25', md = mdown?.[2] ?? '35', price = mdown?.[1] ?? '₹599'
  return { reorder: `≥${ro}%`, hold: `${md}–${ro}%`, markdown: `<${md}%`, markdownPrice: price, exit: `<${ex}%` }
}

function filterActions(actions: string[]): string[] {
  return actions.filter(a => {
    const l = a.toLowerCase()
    if (l.includes('initial depth') || l.startsWith('limit initial')) return false
    if (l.includes('sell-through checkpoint') || l.includes('reorder if above')) return false
    return true
  })
}

function splitDisagreement(text: string): { consensus: string; counter: string } {
  const m = text.match(/\.\s+(But |However |Despite |Yet |The disagreement)/i)
  if (m?.index !== undefined) return { consensus: text.slice(0, m.index + 1), counter: text.slice(m.index + m[0].length - m[1].length) }
  const s = text.split('. '), h = Math.ceil(s.length / 2)
  return { consensus: s.slice(0, h).join('. ') + '.', counter: s.slice(h).join('. ') }
}

// ─── Main page ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'analysis', label: 'Analysis' },
  { id: 'india',    label: 'India Fit' },
  { id: 'sources',  label: 'Sources' },
]

export default function ReportPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [report, setReport]         = useState<TrendReport | null>(null)
  const [notFound, setNotFound]     = useState(false)
  const [tab, setTab]               = useState('analysis')
  const [disAgreeOpen, setDisAgreeOpen]   = useState(false)
  const [buyerNoteOpen, setBuyerNoteOpen] = useState(false)
  const [guidanceOpen, setGuidanceOpen]   = useState(false)
  const [triggersOpen, setTriggersOpen]   = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem(`report-${id}`)
    if (stored) { setReport(JSON.parse(stored)); return }
    fetch('/sample-output.json')
      .then(r => r.json())
      .then(d => d.id === id ? setReport(d) : setNotFound(true))
      .catch(() => setNotFound(true))
  }, [id])

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="text-center bg-white rounded-2xl p-10 shadow-sm border border-slate-200">
        <p className="text-lg font-bold text-slate-800 mb-2">Report not found</p>
        <button onClick={() => router.push('/')} className="text-sm text-blue-600 hover:underline">Start a new analysis</button>
      </div>
    </div>
  )

  if (!report) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="flex items-center gap-2 text-slate-400 text-sm">
        <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        Loading report…
      </div>
    </div>
  )

  const rec = REC_CONFIG[report.recommendation]
  const isDemo = report.id.startsWith('demo-')
  const keywords = report.input.keywords ?? report.input.subCategory
  const displayTitle = buildDisplayTitle(keywords, report.input.subCategory)
  const signalEntries = Object.entries(report.signals) as [string, TrendReport['signals'][keyof TrendReport['signals']]][]
  const { range: unitRange } = report.suggested_units ? extractUnits(report.suggested_units) : { range: '' }
  const unitNumbers  = unitRange ? parseUnitNumbers(unitRange) : null
  const triggers     = parseSellThroughTriggers(report.recommended_actions)
  const filteredActions = filterActions(report.recommended_actions)
  const { consensus, counter } = splitDisagreement(report.disagreement_view)
  const reportId = report.id.replace(/^demo-/, '').slice(0, 10).toUpperCase()
  const dated = new Date(report.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="bg-slate-100 min-h-screen">
      <div className="flex flex-col">

        {/* ── Header ── */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-slate-400 cursor-pointer hover:text-slate-600 transition-colors" onClick={() => router.push('/')}>TrendBet</span>
            <span className="text-slate-300"><ChevR /></span>
            <span className="text-blue-700 font-semibold">Decision Report #{reportId}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl text-sm text-slate-400 w-52">
              <SearchIcon />Search trends, bets…
            </div>
            {isDemo
              ? <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-50 border border-yellow-200 text-yellow-700">Cached Demo</span>
              : <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 border border-green-200 text-green-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />Live
                </span>
            }
            <span className="text-sm text-slate-400 hidden sm:block">{dated}</span>
            <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white text-sm font-bold select-none">B</div>
          </div>
        </header>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1100px] mx-auto px-5 py-5">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_284px] gap-5">

              {/* ═══ Main ═══ */}
              <div className="space-y-4 min-w-0">

                {/* Title */}
                {/* ── Dark gradient title header ── */}
                <div
                  className="rounded-2xl p-6 anim-fadeInUp"
                  style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)' }}
                >
                  <div className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(148,163,184,0.8)' }}>
                    {report.input.category} / {report.input.subCategory}
                  </div>
                  <h1 className="text-2xl font-bold text-white leading-tight tracking-tight">
                    {displayTitle.slice(0, 80)}{displayTitle.length > 80 ? '…' : ''}
                  </h1>
                  {report.india_fit.overall && (
                    <p className="text-sm mt-2 leading-relaxed max-w-lg line-clamp-2" style={{ color: 'rgba(203,213,225,0.85)' }}>
                      {report.india_fit.overall.split('.')[0] + '.'}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {[`₹${report.input.priceBand}`, report.input.fabric,
                      report.input.buyingHorizon === 'immediate'   ? 'Immediate (0–30d)'
                      : report.input.buyingHorizon === 'next-cycle' ? 'Next Cycle (31–90d)'
                      : report.input.buyingHorizon === 'future-bet' ? 'Future Bet (90+d)' : ''
                    ].filter(Boolean).map(tag => (
                      <span key={tag} className="text-xs font-medium px-3 py-1 rounded-full"
                        style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(226,232,240,0.9)' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  {report.input.buyerNote && (
                    <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(148,163,184,0.7)' }}>Your Context</span>
                        <button onClick={() => setBuyerNoteOpen(v => !v)}
                          className="text-xs font-semibold transition-colors"
                          style={{ color: 'rgba(147,197,253,0.9)' }}>
                          {buyerNoteOpen ? '▲ Hide' : '▼ Show buyer note'}
                        </button>
                      </div>
                      {buyerNoteOpen && (
                        <p className="mt-2 text-sm leading-relaxed rounded-xl p-3 whitespace-pre-wrap"
                          style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(203,213,225,0.85)', border: '1px solid rgba(255,255,255,0.1)' }}>
                          {report.input.buyerNote}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-2xl border border-slate-200 p-1 flex gap-1">
                  {TABS.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                      className={cn(
                        'flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all',
                        tab === t.id ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                      )}>
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* ── Tab: Analysis ── */}
                {tab === 'analysis' && (
                  <div className="space-y-4 anim-fadeIn">
                    {/* Radar + signal legend */}
                    <CollapseSection title="Signal Overview" defaultOpen={true}
                      badge={<span className="text-xs text-slate-400 ml-1">· confidence by signal</span>}>
                      <div className="flex items-center gap-6 pt-1">
                        <RadarChart signals={report.signals} />
                        <div className="flex-1 space-y-3">
                          {signalEntries.map(([key, sig]) => {
                            const conf = CONF_CONFIG[sig.confidence]
                            const meta = SIGNAL_META[key]
                            return (
                              <div key={key} className="flex items-center gap-2.5">
                                <span className={cn('p-1.5 rounded-lg shrink-0', meta?.iconBg)}>{meta?.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-semibold text-slate-600 truncate">{meta?.label}</span>
                                    <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full ml-2 shrink-0', conf.badge)}>{conf.label}</span>
                                  </div>
                                  <AnimatedBar width={conf.barWidth} color={conf.bar} height="h-1.5" />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </CollapseSection>

                    {/* Disagreement */}
                    <CollapseSection
                      title="Signal Disagreement"
                      defaultOpen={true}
                      accent="#f97316"
                      icon={<AlertIcon />}
                      badge={<span className="text-xs text-slate-400 ml-1 hidden sm:inline">· where to probe further</span>}
                    >
                      <div className="grid grid-cols-2 gap-5 pt-1">
                        <div>
                          <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">The Consensus</div>
                          <p className={cn('text-sm text-slate-600 leading-relaxed', !disAgreeOpen && 'line-clamp-3')}>{consensus}</p>
                        </div>
                        <div>
                          <div className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-2">The Counter-Signal</div>
                          <p className={cn('text-sm text-slate-600 leading-relaxed', !disAgreeOpen && 'line-clamp-3')}>{counter}</p>
                        </div>
                      </div>
                      {!disAgreeOpen && (
                        <button onClick={() => setDisAgreeOpen(true)}
                          className="mt-3 text-xs text-slate-400 hover:text-blue-600 transition-colors">
                          Read full analysis including unresolved questions →
                        </button>
                      )}
                    </CollapseSection>

                    {/* Signal cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {signalEntries.map(([key, sig], idx) => (
                        <SignalCard key={key} signalKey={key} sig={sig} priceBand={report.input.priceBand}
                          animDelay={idx * 60}
                          fullWidth={signalEntries.length % 2 !== 0 && idx === signalEntries.length - 1} />
                      ))}
                    </div>

                    {/* Skepticism Points */}
                    {report.caveats.length > 0 && (
                      <CollapseSection
                        title="Skepticism Points"
                        defaultOpen={false}
                        badge={<span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">{report.caveats.length}</span>}
                      >
                        <ul className="space-y-3 pt-1">
                          {report.caveats.map((c, i) => (
                            <li key={i} className="flex gap-3 text-sm">
                              <span className="shrink-0 mt-2 w-1.5 h-1.5 rounded-full bg-amber-400" />
                              <span className="text-slate-500 leading-relaxed">{c}</span>
                            </li>
                          ))}
                        </ul>
                      </CollapseSection>
                    )}
                  </div>
                )}

                {/* ── Tab: India Fit ── */}
                {tab === 'india' && (
                  <div className="space-y-4 anim-fadeIn">
                    <IndiaFitSection fit={report.india_fit} />
                  </div>
                )}

                {/* ── Tab: Sources ── */}
                {tab === 'sources' && (
                  <div className="space-y-3 anim-fadeIn">
                    {isDemo && (
                      <div className="px-4 py-3 rounded-xl bg-yellow-50 border border-yellow-200 text-xs text-yellow-800">
                        <strong>Cached demo run · {dated}.</strong> Social and marketplace links are illustrative — clicking ↗ redirects to a live Google search for that item so you can verify in real time.
                      </div>
                    )}
                    {signalEntries.map(([key, sig]) => {
                      const meta = SIGNAL_META[key]
                      const conf = CONF_CONFIG[sig.confidence]
                      return (
                        <CollapseSection
                          key={key}
                          title={meta?.label ?? key}
                          defaultOpen={false}
                          icon={<span className={cn('p-1.5 rounded-lg shrink-0', meta?.iconBg)}>{meta?.icon}</span>}
                          badge={<span className={cn('ml-auto mr-2 px-2 py-0.5 rounded-full text-xs font-bold', conf.badge)}>{conf.label}</span>}
                        >
                          <SignalSourceDrawer signalKey={key} rawData={sig.raw_data} defaultOpen />
                        </CollapseSection>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* ═══ Sidebar ═══ */}
              <div className="space-y-4">
                <div className="sticky top-[57px] space-y-4">

                  {/* Bet Sizing — decision cockpit */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 anim-fadeInUp" style={{ animationDelay: '80ms' }}>
                    <div className={cn(
                      'w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold shadow-sm mb-5',
                      rec.bg, rec.text,
                      report.recommendation === 'Deep Buy' && 'anim-glowGreen',
                      report.recommendation === 'Small Trial Buy' && 'anim-glowAmber',
                    )}>
                      {rec.icon}{rec.label}
                    </div>

                    {unitRange && (
                      <>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Starting Depth</div>
                          <span className="text-xs text-slate-400 italic">AI-estimated · not data-derived</span>
                        </div>
                        <div className="flex items-end gap-2 mb-3">
                          <span className={cn('text-3xl font-bold leading-none tracking-tight', rec.unitColor)}>
                            {unitNumbers ? `${unitNumbers.min}–${unitNumbers.max}` : unitRange}
                          </span>
                          <span className="text-sm text-slate-400 pb-0.5">units / store</span>
                        </div>
                        {report.suggested_units && (() => {
                          const afterFirst = report.suggested_units.indexOf('.')
                          const guidance = afterFirst > -1 ? report.suggested_units.slice(afterFirst + 1).trim() : ''
                          return guidance ? (
                            <>
                              <button onClick={() => setGuidanceOpen(v => !v)}
                                className="flex items-center gap-1 text-xs text-slate-400 hover:text-blue-600 transition-colors mt-1">
                                <span className={cn('transition-transform duration-200', guidanceOpen && 'rotate-180')}><ChevDownIcon /></span>
                                Buying guidance
                              </button>
                              <div className={cn('expand-grid', guidanceOpen && 'open')}>
                                <div>
                                  <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 rounded-xl p-3 border border-slate-100 mt-2">
                                    {guidance}
                                  </p>
                                </div>
                              </div>
                            </>
                          ) : null
                        })()}
                      </>
                    )}

                    {triggers && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <button onClick={() => setTriggersOpen(v => !v)}
                          className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">
                          Week-4 Triggers
                          <span className={cn('transition-transform duration-200', triggersOpen && 'rotate-180')}><ChevDownIcon /></span>
                        </button>
                        <div className={cn('expand-grid', triggersOpen && 'open')}>
                          <div>
                            <div className="space-y-1.5 mt-3">
                              {([
                                { range: triggers.reorder,  label: 'Reorder',            color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
                                { range: triggers.hold,     label: 'Hold — monitor',      color: 'bg-amber-50 border-amber-200 text-amber-700' },
                                { range: triggers.markdown, label: `Markdown ${triggers.markdownPrice}`, color: 'bg-orange-50 border-orange-200 text-orange-700' },
                              ] as { range: string; label: string; color: string }[]).map(({ range, label, color }) => (
                                <div key={range} className={cn('flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-semibold', color)}>
                                  <span>{range}</span>
                                  <span className="font-medium">{label}</span>
                                </div>
                              ))}
                              <p className="text-xs text-slate-400 px-1">Exit &amp; clear if sell-through stays {triggers.exit} after markdown</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Evidence Gaps */}
                  {report.evidence_gaps.length > 0 && (
                    <CollapseSection
                      title="Validate Before Committing"
                      defaultOpen={false}
                      badge={<span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold">{report.evidence_gaps.length}</span>}
                    >
                      <ul className="space-y-2 pt-1">
                        {report.evidence_gaps.map((gap, i) => {
                          const sep = gap.indexOf(' — ')
                          const title = sep > -1 ? gap.slice(0, sep) : gap
                          const detail = sep > -1 ? gap.slice(sep + 3) : null
                          return (
                            <li key={i} className="flex gap-2.5 items-start">
                              <span className="shrink-0 mt-0.5"><BoxIcon /></span>
                              <div>
                                <span className="text-sm text-slate-700 leading-snug">{title}</span>
                                {detail && <p className="text-xs text-slate-400 mt-0.5 leading-snug">{detail}</p>}
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    </CollapseSection>
                  )}

                  {/* Recommended Actions */}
                  {filteredActions.length > 0 && (
                    <CollapseSection
                      title="Next Actions"
                      defaultOpen={true}
                      dark
                      badge={<span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-white/20 text-blue-200 font-bold">{filteredActions.length}</span>}
                    >
                      <ul className="space-y-1.5 pt-1">
                        {filteredActions.map((action, i) => (
                          <li key={i} className="flex items-start gap-2 px-3 py-2.5 bg-white/10 rounded-xl">
                            <span className="text-blue-300 font-bold text-xs shrink-0 mt-0.5">{i + 1}.</span>
                            <span className="text-xs text-white leading-relaxed">{action}</span>
                          </li>
                        ))}
                      </ul>
                    </CollapseSection>
                  )}

                  {/* Export */}
                  <div className="bg-white rounded-2xl border border-slate-200 px-3 py-2.5">
                    <div className="grid grid-cols-3 divide-x divide-slate-100">
                      {[
                        { label: 'Share',  icon: <ShareIcon />, fn: () => {} },
                        { label: 'PDF',    icon: <DlIcon />,    fn: () => window.print() },
                        { label: 'More',   icon: <DotsIcon />,  fn: () => {} },
                      ].map(({ label, icon, fn }) => (
                        <button key={label} onClick={fn}
                          className="flex flex-col items-center gap-1.5 py-2 hover:bg-slate-50 rounded-lg transition-colors">
                          <span className="text-slate-500">{icon}</span>
                          <span className="text-xs text-slate-400 font-medium">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
