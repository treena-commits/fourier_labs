# TrendBet — Fashion Buyer Decision Copilot

## Initial Prompt

**You are TrendBet**, a Decision Copilot for Women's Co-ord Set Buyers at value-fashion retailers in India (e.g., Reliance Trends, Vishal Mega Mart, Max, Zudio).

### Core Mission

Help category buyers decide whether a specific trend in Women's Co-ord Sets deserves inventory commitment in the next buying cycle — **before** demand is obvious in sales reports.

Your output must help buyers reason through uncertainty with honesty. Never give false confidence. Always surface what is real, what could mislead, disagreements between signals, and what evidence is still missing.

### Category & Buyer Context

**Category**: Women's Co-ord Sets (matching top + bottom sets)

**Target Segments**:

- Fashion Followers (urban, creator-influenced)
- Value Trend Seekers (price-sensitive but trend-aware)
- Occasion Buyers (festivals, vacations, brunches)
- Comfort Buyers (lower priority for new trends)

**Buyer Decision**: "Does this trend deserve inventory in the next cycle?"

Not "Is this trend interesting?"

### Selected Signals (Always evaluate these 4)

1. **Creator → Commerce**
   - What it proves: Awareness, attention, early adoption
   - Limitations: Views ≠ purchases; buzz may not convert to mass value-fashion
2. **Marketplace Demand Shift** (Myntra, Amazon.in, Flipkart)
   - Signals: Review velocity, bestseller rank movement, stockouts, new listings, discounting patterns
   - Limitations: Sponsored placement, heavy discounts, and stockouts distort reality
3. **Competitor Buy Map** (Reliance Trends, Max, Ajio, etc.)
   - What it proves: Retailer conviction and market backing
   - Limitations: Competitors may copy each other or target different segments
4. **Historical Similar Patterns**
   - Compare to past similar co-ord trends (fabric, silhouette, print, price band)
   - What it proves: Commercial precedent
   - Limitations: Market conditions change; past ≠ future

### Tech Stack & Live Data Sources

**Preferred Live Data Sources** (ranked by value for demo & real buyer utility):

**Highest Value Sources (Prioritize these):**

- **Marketplace Signals** (Myntra, Amazon.in, Flipkart) — Highest overall value. Real commercial intent indicators (bestsellers, reviews, stockouts).
- **Creator/Influencer Content** (Instagram Reels, YouTube hauls, Pinterest) — Very high early-signal value.
- **Competitor Sites** (Zudio.com, MaxFashion.in, Reliance Trends, Ajio) — High value for buy-map visibility.

**Supporting Sources:**

- Google Trends (India-specific, 12-month window)
- Public fashion blogs / style guides
- Visual platforms (Pinterest boards, Instagram hashtags like #CoOrdSets2026)

### Response Format

1. **Trend Summary** — specific trend, price band, season, target segment
2. **Signal Analysis** — for each of the 4 signals: evidence summary, confidence (High/Medium/Low), what it proves, what could mislead
3. **Disagreement View** — conflicts between signals and what would resolve them
4. **India Value-Fashion Translation** — climate, occasions, modesty norms, price sensitivity
5. **Recommendation** — Deep Buy / Small Trial Buy / Monitor / Avoid + rationale + suggested bet size
6. **Missing Evidence & Next Actions** — what the buyer should validate manually
7. **Overall Caveats & Skepticism Points** — explicit risks and limitations

### Reasoning Rules

- Use extended step-by-step thinking before final output.
- Always prioritize India-specific signals over global.
- Be skeptical by default — value-fashion trends move fast but many fail to convert.
- If evidence is weak overall → default to "Monitor" and explain why.
- Confidence is verbal: High, Medium, Low, or Insufficient Data. Never a number.

**Example query:** "Breathable cotton co-ord sets with placement prints for Summer 2026, ₹699–1299"

---

Category buyers commit inventory 6–8 weeks before demand shows up in sales reports. Get it wrong and you're marking down half the buy. Get too cautious and a competitor clears the shelf. TrendBet pulls five independent signals — creator buzz, marketplace supply, search momentum, competitor buys, and historical analog performance — and shows you where they agree, where they contradict, and what that means for your price band. The output is an inventory recommendation, not a confidence score.

---

## Run it

```bash
cp .env.local.example .env.local
# fill in your API keys (see below)

npm install
npm run dev
# open http://localhost:3000
```

**API keys** (`.env.local`):

| Key | Purpose |
|---|---|
| `GROQ_API_KEY` | LLM synthesis layer (llama-3.3-70b-versatile) |
| `SERPAPI_KEY` | All five signals — marketplace, creator, competitor, search trends |

**No keys?** Go to `http://localhost:3000/report/sample-earthy-utility-2026` — loads `public/sample-output.json` with no API calls.


---

## The core design decision

TrendBet doesn't produce a score. Scores hide the tension between signals and give buyers false confidence. Instead, every signal card shows what the evidence proves *and* where it can mislead. When signals disagree — creator surge with thin marketplace supply, or competitor stock with declining search interest — TrendBet names the disagreement and identifies what would resolve it. That's the differentiating feature. The buyer still makes the call; TrendBet shows them what they're deciding through.

Confidence is verbal: **High**, **Medium**, **Low**, or **Insufficient Data**. Never a number. This is intentional — a number implies precision that the data doesn't support.

Two screens: an intake form (trend description, price band, fabric, season) and a Trend Decision Report with 5 signal cards, a disagreement view, India-fit analysis, and a recommendation: **Monitor**, **Small Trial Buy**, **Deep Buy**, or **Avoid**.

---

## Source strategy

Each signal covers a different stage of the trend lifecycle. Creator mentions fire 3–6 months before peak demand — it's the earliest signal available without insider data. Search interest fires 1–3 months out — consumer intent, not just awareness. Marketplace listings and competitor buys are concurrent signals — they tell you what's already committed. Historical analogs are the only outcome-validated signal: what actually sold through in a similar configuration. Together they triangulate across early, mid, and current stages. A single-source or single-stage view is what causes the bad buys.

Sources that were considered and excluded: direct scraping of Myntra/Amazon (anti-bot walls, too fragile for a reliable demo), Instagram's official Graph API (requires per-creator OAuth consent), proprietary retailer sell-through data (unavailable), and runway/fashion week trend reports (too aspirational, wrong price band for value fashion, wrong geography).

| Signal | Source | Why this source | What it proves | Where it misleads |
|---|---|---|---|---|
| **Creator Pulse** | SerpAPI Google Search (`site:instagram.com`) | Instagram's official API requires per-creator OAuth. SerpAPI's Google index gives real public post mentions without that dependency. | Whether creators are actively amplifying this trend right now. | No follower count or audience data. A 500K travel creator and a 10K budget-fashion creator look identical. The signal can't distinguish aspirational buzz from value-fashion intent. |
| **Marketplace Demand** | SerpAPI Google Shopping (`site:myntra.com`, `site:amazon.in`) | Direct scraping of Myntra and Amazon breaks on anti-bot walls. Google Shopping results carry the same signal — titles, prices, reviews, new arrival tags — with a 24–48 hour indexing lag. Acceptable tradeoff. | Real purchase activity: review velocity, price range vs. buyer's band, new arrival listings. | Sponsored placement inflates rank. Stockouts look like demand. Heavy discounting signals oversupply, not affordability. |
| **Search Interest** | SerpAPI Google Trends engine, geo=IN, 12-month window | pytrends blocks server-side without a browser session. SerpAPI's Trends engine gives the same underlying data without that constraint. | Consumer search momentum in India — regional spikes, rising related queries. | Lagging indicator. Peak search typically follows the optimal buying window by 4–8 weeks. |
| **Competitor Buy Map** | SerpAPI Google Shopping, filtered to `site:maxfashion.in` + `site:zudio.com` | Ajio and Reliance Trends have too-fragmented search index coverage for reliable signal. Max and Zudio are the clearest value-fashion comparables. | Whether the market has committed inventory to this trend — retailer conviction. | Competitors may be copying each other. Sale items signal possible overstock, not demand. |
| **Historical Analog** | 10 curated co-ord trend outcomes in `/data/historical-analogs.json` | No proprietary sell-through database exists. The analog dataset is hand-curated from Myntra trend reports, Apparel Resources, and industry press — disclosed as such on every report. | Commercial precedent: what happened the last time a similar fabric/silhouette/price-band combination ran. | Small dataset. Past market conditions may not hold. Outcomes are directional, not verified sell-through rates. |

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
    creators.ts             SerpAPI Google Search (Instagram mentions)
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

## Evaluation

**Tested:**
- Full live API run on "Kaftan Co-ord Set, ₹600–999, Cotton-linen" — result is in `public/sample-output.json`
- Disagreement view renders even when 4 of 5 signals agree — the remaining tension is always named
- `confidence: "Insufficient Data"` path confirmed when SerpAPI returns zero results
- `npx tsc --noEmit` — clean
- `npm run build` — passes

**Not tested:**
- All five signals returning empty simultaneously — the fully data-starved fallback path
- Two buyers running different trends at the same time — no request queue or retry backoff on concurrent SerpAPI calls
- Whether the disagreement framing reads the same to a Tier-1 buyer vs. a Tier-3 buyer — the language isn't segment-aware yet

**Known constraint:** Google Trends full interest-over-time curve is blocked server-side without a browser session — the search interest signal returns related queries and regional data but not the time-series chart.

---



---

## Business measurement

TrendBet produces two concrete outputs: a recommendation (`Monitor / Small Trial Buy / Deep Buy / Avoid`) and a unit range (e.g., 80–120 units). Those are the only things you can realistically measure against from day one.

**Recommendation accuracy** — after sell-through results come in, did the call match the outcome? Log the recommendation, log the actual sell-through, and you have accuracy over time. No baseline or control group needed.

**Unit range accuracy** — did the actual optimal quantity fall within the suggested range? Sold out in week 3 = undersized. 40 units left at markdown = oversized.

**Override rate** — how often did buyers override the recommendation, and when they did, who was right? This is the leading indicator of whether buyers trust the disagreement view.

Metrics like "5–10pp sell-through improvement vs. baseline" or "markdown reduction" are real outcomes if TrendBet works — but they require a control group that doesn't exist yet. Recommendation accuracy is what gets you there.

---

## What to build next

1. **Google Trends time-series** — Python sidecar (pytrends with browser session) to get the full 12-month weekly curve and regional breakdown
2. **Buyer feedback loop** — sell-through rating UI that writes back into `historical-analogs.json`
3. **Instagram creator enrichment** — current signal has no visibility into follower count or audience. Needs a third-party influencer API (Phyllo, Modash) to add niche tags, engagement rate, and value-fashion audience data
4. **Visual trend clustering** — group competitor product images by silhouette and color family using Claude's vision API
5. **Active Bets tracker** — once a buyer places an order, track sell-through signals weekly against the original TrendBet call
6. **India-fit prompt module** — explicit pre-analysis step: does this trend fit Indian climate, modesty norms, and price band before it hits the recommendation layer
