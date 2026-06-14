# TrendBet — Fashion Buyer Decision Copilot

A decision tool for value-fashion category buyers to evaluate whether a Women's Co-ord Set trend deserves inventory commitment — before demand is visible in sales reports.

Built for Fourier FDE Assessment · Problem 01 · Trend Buying.

---

## Run it

```bash
cp .env.local.example .env.local
# fill in your API keys (see below)

npm install
npm run dev
# open http://localhost:3000
```

**Required API keys** (`.env.local`):

| Key | Purpose | Get it |
|---|---|---|
| `GROQ_API_KEY` | LLM reasoning layer (llama-3.3-70b-versatile) | console.groq.com |
| `SERPAPI_KEY` | Marketplace + competitor + creator signals | serpapi.com |
| `YOUTUBE_API_KEY` | YouTube Data API v3 for creator signal (optional) | console.cloud.google.com |

**No keys?** Load the cached demo at `http://localhost:3000/report/sample-earthy-utility-2026` — it reads from `public/sample-output.json` and requires no API calls.

---

## What it does

Two screens:

1. **Intake Form** — buyer describes a trend (silhouette, price band, season, fabric) and submits
2. **Trend Decision Report** — TrendBet returns a structured analysis across 5 signals with a final recommendation

The output is not a confidence score. It is an actionable inventory decision: **Monitor**, **Small Trial Buy**, **Deep Buy**, or **Avoid** — with explicit disagreements between signals surfaced so buyers can see where judgment is still required.

---

## Source strategy

| Signal | Source | What it proves | Where it misleads |
|---|---|---|---|
| Creator Pulse | YouTube Data API v3 + Google Search for Instagram mentions | Awareness, early adoption, creator amplification | Views ≠ purchases. Aspirational creators may not map to value-fashion buyers. |
| Marketplace Demand | SerpAPI Google Shopping (`site:myntra.com`, `site:amazon.in`) | Real purchase activity: review counts, price range, new arrival velocity | Sponsored placement inflates rank. Stockouts look like demand. Discounting signals oversupply. |
| Search Interest | Google Trends India (pytrends / suggest API) | Consumer search momentum in India | Lagging indicator — peak search often follows the optimal buying window. |
| Competitor Buy Map | Google Search `site:zudio.com` + `site:maxfashion.in` via SerpAPI | Retailer conviction; is the market backing this? | Competitors may be copying each other. Different customer segments. Sale items signal possible overstock. |
| Historical Analog | Curated dataset of 10 real India co-ord trends (`/data/historical-analogs.json`) | Commercial precedent by fabric, silhouette, price band | Small dataset, hand-curated (disclosed). Past outcomes don't guarantee future demand. |

**Why no direct scraping of Myntra/Amazon/Ajio?** Anti-bot walls will break a demo. SerpAPI's Google Shopping results provide the same product signal (titles, prices, reviews) without brittle scraping. The trade-off is that SerpAPI results have a slight indexing lag (~24–48 hours).

---

## Technical design

```
app/
  page.tsx                  Intake form (Screen 1)
  report/[id]/page.tsx      Decision report (Screen 2)
  api/analyze/route.ts      POST endpoint: orchestrates signals + Claude

lib/
  types.ts                  Shared TypeScript types
  utils.ts                  cn() utility
  signals/
    marketplace.ts          SerpAPI Google Shopping
    creators.ts             YouTube API v3 + Google Search
    competitors.ts          SerpAPI site:zudio.com, site:maxfashion.in
    search_trends.ts        Google Trends suggest API
    historical.ts           Cosine-style scoring against analog dataset
  analysis/
    claude.ts               Groq llama-3.3-70b-versatile, json_object mode

data/
  historical-analogs.json   10 curated real co-ord trend outcomes

public/
  sample-output.json        Cached demo run (2026-06-11, Earthy Utility Co-ords)
```

**AI layer:** All 5 signal payloads are passed to `llama-3.3-70b-versatile` via the Groq API (`lib/analysis/claude.ts`). The model is prompted with `response_format: json_object` to produce structured JSON — not a confidence score — with an explicit disagreement view that must always be populated. The disagreement callout is the product's differentiating feature.

**Signal collection:** All 5 fetchers run in `Promise.all()` in parallel. Total API time is typically 15–25 seconds.

**Failure handling:** If a signal fetcher returns no data, it sets `confidence: "Insufficient Data"` and explains why. Claude is instructed to treat weak-evidence situations as "Monitor" by default. The system never fills gaps with synthetic data.

---

## Evaluation approach

**What I tested:**

- Ran the Earthy Utility Co-ords trend (full live API run) — result is cached in `public/sample-output.json`
- Verified that the Disagreement View renders even when 4/5 signals agree (the remaining tension is always surfaced)
- Confirmed `confidence: "Insufficient Data"` path works correctly when SerpAPI returns no results
- Verified TypeScript compiles clean (`npx tsc --noEmit`)
- Verified `npm run build` passes with no errors

**Known failure modes:**

- Google Trends full interest-over-time curve is blocked server-side without a browser session — search interest signal returns directional data (related queries) but not the time-series chart
- YouTube API quota is 10,000 units/day — each analysis uses ~3 units; not a concern for demo but worth noting for production
- SerpAPI free tier: 100 searches/month. Run the cached sample if budget is limited.

---

## Business measurement

A successful TrendBet adoption would be measured by:

- **Sell-through rate improvement** — target: 5–10 percentage point increase in first-cycle sell-through vs. buyer's baseline
- **Markdown reduction** — fewer end-of-season markdowns on trend buys that used TrendBet vs. intuition-only buys
- **Stockout avoidance** — for "Deep Buy" recommendations, confirm restocking was available within lead time
- **Decision speed** — time from trend identification to purchase order; target 30–50% reduction
- **Buyer adoption** — subjective: do buyers trust the disagreement view, or override it? The feedback loop is where the product compounds.

---

## What to build next

1. **Google Trends time-series** — route through a Python sidecar (pytrends) to get the full 12-month interest curve and regional breakdown
2. **Buyer feedback loop** — after sell-through, buyers rate the recommendation; feed back into historical analog dataset
3. **Visual trend clustering** — group competitor product images by silhouette and color family using Claude's vision API
4. **Global → India translation layer** — explicit prompt module that asks: does this trend fit Indian climate, modesty norms, and price band before passing to the recommendation layer
5. **Active Bets tracker** — once the buyer places an order, track sell-through signals weekly against the original recommendation
