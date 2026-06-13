# SkyPulse — Product Presentation

> Smart Local Operations Intelligence Platform

---

## Slide 1: The Problem

### Local businesses operate blind

- **Small retailers** (pharmacies, cafes, convenience stores) make daily operational decisions — inventory, staffing, promotions, store layout — based on gut feeling
- **Weather shifts**, local events, and competitor moves directly impact foot traffic and demand, but owners lack the tools to anticipate them
- By the time they react, the opportunity (or damage) has already passed
- Enterprise chains have dedicated analytics teams; **local businesses have nothing**

> "A sudden heatwave means 3× sunscreen demand for a pharmacy — but the owner only realizes this after they've stocked out."

---

## Slide 2: The Solution

### SkyPulse — An operations advisor that watches the sky so you don't have to

SkyPulse is a **real-time intelligence agent** that continuously monitors environmental signals around a local business and generates **specific, time-bound, actionable recommendations**.

**One sentence:** "What should I do differently tomorrow because of what's happening around my store?"

**Key insight:** We don't just show data — we tell the owner **exactly what to do, when, and why.**

---

## Slide 3: Product Demo Overview

### 9 Core Screens

| Screen | Purpose |
|---|---|
| **Dashboard** | At-a-glance opportunity/risk scores, top recommendations, weekly outlook |
| **Weekly Plan** | 7-day strategic plan with per-day scores, events, and recommendations |
| **Tomorrow** | Hour-by-hour operational plan with time-blocked recommendations |
| **Watchtower** | Real-time signal monitoring with simulation capabilities |
| **Map Context** | Discovered nearby competitors and demand anchors on a live map |
| **Competitors** | Competitive intelligence feed with counter-suggestions |
| **Recommendations** | Full list of all recommendations with accept/ignore workflow |
| **Manager Brief** | Auto-generated natural-language briefing for the business owner |
| **Settings** | Business profile management, custom profile creation |

---

## Slide 4: Agentic Architecture — Overview

### Multi-Agent Orchestration System

SkyPulse uses a **three-tier autonomous agent system** where each agent operates at a different planning horizon. Agents are not simple API wrappers — they are orchestrated pipelines that autonomously gather context, reason over signals, apply domain rules, and produce structured operational plans.

```
                              ┌──────────────────────────┐
                              │      USER TRIGGER         │
                              │  (manual or scheduled)    │
                              └────────────┬─────────────┘
                                           │
                    ┌──────────────────────┬┴┬──────────────────────┐
                    │                      │ │                      │
                    ▼                      ▼ ▼                      ▼
          ┌─────────────────┐   ┌─────────────────┐   ┌──────────────────┐
          │  WEEKLY AGENT   │   │ DAY-AHEAD AGENT  │   │  INTRADAY AGENT  │
          │                 │   │                  │   │                  │
          │ Horizon: 7 days │   │ Horizon: 1 day   │   │ Horizon: now     │
          │ Trigger: manual │   │ Trigger: manual   │   │ Trigger: signal  │
          │ Cadence: weekly │   │ Cadence: daily    │   │   change or sim  │
          └────────┬────────┘   └────────┬─────────┘   └────────┬─────────┘
                   │                     │                      │
                   ▼                     ▼                      ▼
          ┌─────────────────────────────────────────────────────────────┐
          │                    SUPABASE (Postgres)                      │
          │  agent_runs · recommendations · plan_cache · alerts · ...   │
          └─────────────────────────────────────────────────────────────┘
```

**Key principle:** Each tier **refines** the previous tier's output — weekly strategy becomes daily tactics becomes real-time adjustments.

---

## Slide 5: Agentic Architecture — Agent Internals

### What happens inside each agent (detailed execution flow)

Every agent follows a **5-phase autonomous pipeline**:

```
  Phase 1               Phase 2                Phase 3              Phase 4              Phase 5
  GATHER                NORMALIZE              ENRICH               REASON               PERSIST
  ──────────────        ──────────────         ──────────────       ──────────────       ──────────────
  │ Fetch weather │     │ Score each   │       │ Discover    │     │ Build prompt │     │ Save run     │
  │ Fetch AQI     │──▸  │ signal into  │──▸    │ events via  │──▸  │ Inject rules │──▸  │ Save recs    │
  │ (parallel)    │     │ 0–1 range    │       │ search      │     │ + context    │     │ Save cache   │
  │               │     │              │       │ grounding   │     │              │     │ Save alerts  │
  │               │     │ heat_score   │       │             │     │ Call Gemini  │     │ Notify user  │
  │               │     │ rain_risk    │       │ Load cached │     │ structured   │     │              │
  │               │     │ wind_score   │       │ competitor  │     │ JSON output  │     │              │
  │               │     │ uv_score     │       │ updates     │     │              │     │              │
  │               │     │ dust_score   │       │             │     │ Parse & map  │     │              │
  │               │     │ air_quality  │       │             │     │ to typed     │     │              │
  │               │     │              │       │             │     │ objects      │     │              │
  └───────────────┘     └──────────────┘       └─────────────┘     └──────────────┘     └──────────────┘
```

---

## Slide 6: Agentic Architecture — Weekly Agent

### 7-Day Strategic Planning Agent

**Trigger:** User clicks "Generate Weekly Plan"
**Horizon:** 7 days ahead

```
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │                            WEEKLY AGENT                                     │
  │                                                                             │
  │  1. PARALLEL DATA GATHERING                                                 │
  │     ┌──────────────────────────────────────────────────────────────────┐    │
  │     │  Promise.all([                                                   │    │
  │     │    getWeatherForecast(lat, lng, 7),    ← Open-Meteo 7-day       │    │
  │     │    getAirQuality(lat, lng),            ← Open-Meteo AQI         │    │
  │     │    discoverEvents(biz, start, end),    ← Gemini Search Ground.  │    │
  │     │    getCompetitorUpdates(id, 15),       ← Supabase (cached)      │    │
  │     │  ])                                                              │    │
  │     └──────────────────────────────────────────────────────────────────┘    │
  │                                                                             │
  │  2. SIGNAL NORMALIZATION                                                    │
  │     For each of 7 days → normalizeDailyWeather() → scored signals          │
  │     Cache each day's signals in signalCache (for Watchtower baseline)       │
  │                                                                             │
  │  3. CONTEXT ASSEMBLY                                                        │
  │     signalContext + eventsContext + competitorContext + verticalPlaybook     │
  │                                                                             │
  │  4. LLM STRUCTURED GENERATION                                              │
  │     ┌──────────────────────────────────────────────────────────────────┐    │
  │     │  Prompt:                                                         │    │
  │     │    Business profile + Playbook rules + 7-day signal summary     │    │
  │     │    + Events + Competitor intel + Business context                │    │
  │     │                                                                  │    │
  │     │  → generateStructured<WeeklyResponse>()                         │    │
  │     │  → Returns: { days[], weekly_summary, watchlist }                │    │
  │     │  → JSON schema enforced via responseMimeType: application/json  │    │
  │     └──────────────────────────────────────────────────────────────────┘    │
  │                                                                             │
  │  5. PERSISTENCE                                                             │
  │     saveAgentRun() + saveRecommendations() + savePlanCache()               │
  │                                                                             │
  │  OUTPUT:                                                                    │
  │    • 7-day plan with opportunity/risk scores per day                        │
  │    • 2-5 recommendations per day (typed, prioritized, time-windowed)        │
  │    • Weekly summary + watchlist items                                       │
  └─────────────────────────────────────────────────────────────────────────────┘
```

---

## Slide 7: Agentic Architecture — Day-Ahead Agent

### Hour-by-Hour Tactical Planning Agent

**Trigger:** User clicks "Generate Tomorrow's Plan"
**Horizon:** 1 day (next day), broken into 3-hour time blocks

```
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │                          DAY-AHEAD AGENT                                    │
  │                                                                             │
  │  1. PARALLEL DATA GATHERING                                                 │
  │     Same as Weekly but focused on target date:                              │
  │     weather(7-day) + AQI + events(1-day) + competitor updates              │
  │                                                                             │
  │  2. HOURLY SIGNAL CONSTRUCTION                                              │
  │     buildHourlyBlocks(weather, targetDate, 3)                              │
  │     → 3-hour time blocks with temp, rain prob, wind, UV, cloud cover       │
  │                                                                             │
  │  3. WEEKLY CONTEXT RETRIEVAL                                                │
  │     getRecommendationsByDate(biz, date)                                    │
  │     → Loads existing weekly-tier recs for the target date                   │
  │     → Agent sees what was already planned and can refine/override           │
  │                                                                             │
  │  4. LLM STRUCTURED GENERATION                                              │
  │     Prompt includes: hourly weather blocks + events + competitors           │
  │       + existing weekly recs + playbook + business context                  │
  │     → generateStructured<DayAheadResponse>()                               │
  │     → Returns: { time_blocks[], campaign_suggestion, daily_summary }       │
  │                                                                             │
  │  5. POST-PROCESSING                                                         │
  │     • Map time blocks to UI format with weather icons                       │
  │     • Overlay events onto matching time windows                             │
  │     • Identify campaign send windows                                        │
  │                                                                             │
  │  OUTPUT:                                                                    │
  │    • Hour-by-hour plan with weather + recommendations per block            │
  │    • Campaign timing suggestion + message draft                             │
  │    • Event-aware time windows                                               │
  └─────────────────────────────────────────────────────────────────────────────┘
```

---

## Slide 8: Agentic Architecture — Intraday Agent (Watchtower)

### Real-Time Signal Change Detection Agent

**Trigger:** Signal delta exceeds threshold OR user runs simulation
**Horizon:** Right now

```
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │                          INTRADAY AGENT                                     │
  │                                                                             │
  │  1. FETCH CURRENT SIGNALS                                                   │
  │     getWeatherForecast(2-day) + getAirQuality() → normalize today          │
  │                                                                             │
  │  2. APPLY SIMULATION (optional)                                             │
  │     If simulate parameter → applySimulation(signals, scenario)             │
  │     Scenarios: "rain_spike", "heat_wave", "event_postponed"                │
  │                                                                             │
  │  3. LOAD BASELINE                                                           │
  │     loadPreviousSignals():                                                  │
  │       1st: check in-memory signalCache                                     │
  │       2nd: check Supabase plan_cache (survives restarts)                   │
  │       fallback: use current signals as baseline (no diff)                  │
  │                                                                             │
  │  4. DETECT CHANGES (Watchtower Diffing Engine)                              │
  │     ┌──────────────────────────────────────────────────────────────────┐    │
  │     │  detectChanges(previousSignals, currentSignals)                  │    │
  │     │                                                                  │    │
  │     │  For each signal field:                                          │    │
  │     │    delta = |current - previous|                                   │    │
  │     │    if delta > 0.30 → severity: "critical", requires_action: true │    │
  │     │    if delta > 0.15 → severity: "high", requires_action: true     │    │
  │     │    if delta > 0.05 → severity: "medium"                          │    │
  │     │    else            → severity: "low"                             │    │
  │     │                                                                  │    │
  │     │  shouldUpdateRecommendations(changes)                            │    │
  │     │    → true if ANY change has requires_action === true             │    │
  │     └──────────────────────────────────────────────────────────────────┘    │
  │                                                                             │
  │  5. CONDITIONAL LLM GENERATION (only if actionable changes detected)       │
  │     Prompt: business + playbook + detected changes + current signals       │
  │     → generateStructured<IntradayResponse>()                               │
  │     → 1-3 urgent recommendations                                           │
  │                                                                             │
  │  6. ALERT & NOTIFICATION PIPELINE                                           │
  │     For each HIGH/CRITICAL change:                                          │
  │       createAlertFromChange() → saveAlerts()                               │
  │       createNotification() → saveNotification()                             │
  │                                                                             │
  │  OUTPUT:                                                                    │
  │    • List of detected signal changes with severity                          │
  │    • 1-3 urgent recommendations (if actionable)                             │
  │    • Alerts + push notifications                                            │
  └─────────────────────────────────────────────────────────────────────────────┘
```

---

## Slide 9: Agentic Architecture — Inter-Agent Data Flow

### How the three agents collaborate

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │                                                                        │
  │   WEEKLY AGENT                                                         │
  │   ┌─────────────────┐                                                  │
  │   │ Generates:       │                                                  │
  │   │ • 7-day plan     │──────────────────────────────────────────┐      │
  │   │ • 2-5 recs/day   │         saves to Supabase                │      │
  │   │ • Signal baseline│──────────────┐                           │      │
  │   └─────────────────┘              │                           │      │
  │                                     ▼                           ▼      │
  │                            ┌──────────────┐           ┌─────────────┐  │
  │                            │ signalCache   │           │ plan_cache  │  │
  │                            │ (in-memory)   │           │ (Supabase)  │  │
  │                            └──────┬───────┘           └──────┬──────┘  │
  │                                   │                          │         │
  │   DAY-AHEAD AGENT                │                          │         │
  │   ┌──────────────────┐           │                          │         │
  │   │ Reads:            │◀──────────────── getRecommendationsByDate()   │
  │   │ • Weekly recs for │           │                                    │
  │   │   target date     │           │                                    │
  │   │                   │           │                                    │
  │   │ Generates:        │           │                                    │
  │   │ • Hourly plan     │           │                                    │
  │   │ • Refined recs    │           │                                    │
  │   └──────────────────┘           │                                    │
  │                                   │                                    │
  │   INTRADAY AGENT                  │                                    │
  │   ┌──────────────────┐           │                                    │
  │   │ Reads:            │◀──────────┘                                    │
  │   │ • Cached baseline │◀───────── loadPreviousSignals()               │
  │   │   signals         │           (memory → Supabase fallback)        │
  │   │                   │                                                │
  │   │ Detects:          │                                                │
  │   │ • Signal deltas   │                                                │
  │   │ • Threshold       │                                                │
  │   │   breaches        │                                                │
  │   │                   │                                                │
  │   │ Generates:        │                                                │
  │   │ • Urgent recs     │                                                │
  │   │ • Alerts          │                                                │
  │   │ • Notifications   │                                                │
  │   └──────────────────┘                                                │
  │                                                                        │
  └────────────────────────────────────────────────────────────────────────┘
```

---

## Slide 10: Signal Pipeline

### What SkyPulse monitors

```
  External APIs                    Signal Normalizer              LLM Agent
┌──────────────┐                ┌──────────────────┐         ┌──────────────┐
│ Open-Meteo   │──── Weather ──▸│  heat_score      │         │              │
│ (free, no    │──── Hourly  ──▸│  rain_risk       │──────▸  │  Gemini 3.5  │
│  API key)    │──── UV/Wind ──▸│  wind_score      │         │  Flash       │
├──────────────┤                │  uv_score        │         │              │
│ Open-Meteo   │──── AQI    ──▸│  air_quality_score│──────▸  │  + Vertical  │
│ Air Quality  │──── PM10   ──▸│  dust_score       │         │    Playbooks │
├──────────────┤                ├──────────────────┤         │              │
│ Gemini       │──── Events ──▸│  event context    │──────▸  │  + Business  │
│ Search       │──── Compet.──▸│  competitor intel  │──────▸  │    Profile   │
│ Grounding    │──── Places ──▸│  nearby places    │         │              │
└──────────────┘                └──────────────────┘         └──────┬───────┘
                                                                    │
                                                      ┌─────────────▼──────────┐
                                                      │  Structured JSON Output │
                                                      │  • Recommendations      │
                                                      │  • Scores & Alerts      │
                                                      │  • Campaign Messages    │
                                                      └────────────────────────┘
```

**All signals are free/no-API-key** except Gemini (one API key for all tasks).

---

## Slide 11: Vertical Playbooks

### Domain expertise encoded as rule systems

Each business type has a **vertical playbook** — a set of domain-specific rules that guide the agent:

| Vertical | Key Rules |
|---|---|
| **Pharmacy** | Sunscreen demand ↔ UV index, allergy meds ↔ dust/pollen, cold medicine ↔ temperature drops, elderly customer safety ↔ heat alerts |
| **Cafe** | Outdoor seating ↔ wind/rain, ice drinks ↔ heat, hot drinks ↔ cold, beach proximity ↔ foot traffic |
| **Convenience Store** | Umbrella/poncho stock ↔ rain forecast, cold beverages ↔ heat, transit proximity ↔ commuter patterns |

Playbooks are injected into every agent prompt, ensuring recommendations are **industry-relevant**, not generic.

---

## Slide 12: Competitive Intelligence

### Automated competitor monitoring

```
  Nearby Places Discovery          Competitor Scanner           Intelligence Feed
┌─────────────────────┐        ┌───────────────────────┐      ┌──────────────────┐
│ Gemini Search        │        │ For each competitor:  │      │ Grouped by       │
│ Grounding discovers  │───▸    │ • Search for promos   │──▸   │ competitor name   │
│ competitors within   │        │ • Review trends       │      │ • Update type     │
│ 1km radius           │        │ • Price changes       │      │ • Suggestion      │
│                      │        │ • News/social media   │      │ • Source link     │
│ Categorizes:         │        │                       │      │ • Relevance score │
│ • Competitors        │        │ Parallel scanning     │      │                  │
│ • Demand anchors     │        │ 60s timeout per scan  │      │ Fed into agent   │
└─────────────────────┘        └───────────────────────┘      │ prompts for      │
                                                               │ competitor-aware  │
                                                               │ recommendations  │
                                                               └──────────────────┘
```

**Result:** "Competitor is running a 20% sunscreen sale → Consider stocking complementary after-sun products at the entrance."

---

## Slide 13: High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js 15)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │Dashboard │ │ Weekly   │ │ Tomorrow │ │Watchtower│ │   Map    │ │
│  │          │ │ Plan     │ │          │ │          │ │ Context  │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │Competitors│ │  Recs   │ │ Manager  │ │ Settings │              │
│  │ Intel    │ │  List    │ │  Brief   │ │          │              │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │
│                                                                     │
│  UI: shadcn/ui + Radix · Dark theme                                │
│  Maps: react-leaflet + OpenStreetMap                                │
│  Charts: Recharts                                                   │
│  State: React Context (BusinessProvider)                            │
├─────────────────────────────────────────────────────────────────────┤
│                      API LAYER (Next.js Route Handlers)             │
│                                                                     │
│  /api/agent/weekly     POST → 7-day plan generation                │
│  /api/agent/day-ahead  POST → hourly plan generation               │
│  /api/agent/intraday   POST → real-time signal diff + urgent recs  │
│  /api/recommendations  GET/PATCH → recommendation CRUD             │
│  /api/competitors      GET/POST → competitor intelligence          │
│  /api/places           GET → nearby places discovery               │
│  /api/events           GET/POST → event discovery                  │
│  /api/brief            POST → auto-generated manager briefing      │
│  /api/businesses       GET/POST → business profile CRUD            │
│  /api/notifications    GET/PATCH → notification management         │
├─────────────────────────────────────────────────────────────────────┤
│                       SERVICE LAYER (TypeScript)                     │
│                                                                     │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐          │
│  │  Gemini   │ │  Weather  │ │   Signal  │ │ Watchtower│          │
│  │  Service  │ │  + AQI    │ │Normalizer │ │  Diffing  │          │
│  │           │ │  Services │ │           │ │           │          │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘          │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐          │
│  │Competitor │ │   Event   │ │  Places   │ │Notification│          │
│  │  Intel    │ │ Discovery │ │ Discovery │ │  Service  │          │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘          │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐                        │
│  │ Pharmacy  │ │   Cafe    │ │Convenience│  ← Vertical Playbooks  │
│  │ Playbook  │ │ Playbook  │ │ Playbook  │                        │
│  └───────────┘ └───────────┘ └───────────┘                        │
├─────────────────────────────────────────────────────────────────────┤
│                        DATA LAYER                                   │
│                                                                     │
│  ┌────────────────────────┐    ┌──────────────────────────────┐    │
│  │   Supabase (Postgres)  │    │   External APIs (Free)       │    │
│  │                        │    │                              │    │
│  │  • businesses          │    │  • Open-Meteo Weather        │    │
│  │  • agent_runs          │    │  • Open-Meteo Air Quality    │    │
│  │  • recommendations     │    │  • Gemini 3.5 Flash          │    │
│  │  • events              │    │    - Structured generation   │    │
│  │  • competitor_updates  │    │    - Search grounding        │    │
│  │  • signal_snapshots    │    │    - Maps grounding          │    │
│  │  • alerts              │    │                              │    │
│  │  • notifications       │    │  No API keys needed except:  │    │
│  │  • plan_cache          │    │  • GEMINI_API_KEY            │    │
│  │  • campaigns           │    │  • SUPABASE_URL + keys       │    │
│  └────────────────────────┘    └──────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Slide 14: Tech Stack Summary

| Layer | Technology | Why |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | Full-stack React with API routes, SSR, Turbopack |
| **Language** | TypeScript | End-to-end type safety |
| **UI Library** | shadcn/ui + Radix | Accessible, composable, dark theme |
| **Styling** | Tailwind CSS 4 | Utility-first, rapid iteration |
| **Charts** | Recharts | React-native charting for dashboard visualizations |
| **Maps** | react-leaflet + OpenStreetMap | Free, no API key, full map customization |
| **Database** | Supabase (Postgres) | Managed Postgres, real-time capabilities, auth-ready |
| **LLM** | Gemini 3.5 Flash | Fast, structured JSON output, search/maps grounding built-in |
| **Weather** | Open-Meteo | Free, no API key, 7-day forecast + hourly + air quality |
| **Icons** | Lucide React | Consistent, lightweight icon set |

**Total external API keys required: 2** (Gemini + Supabase)

---

## Slide 15: Data Flow — Weekly Agent Example

```
1. User clicks "Generate Weekly Plan"
                │
2. Fetch 7-day weather forecast ──────────── Open-Meteo API
   Fetch air quality data ────────────────── Open-Meteo AQI API
   Discover nearby events ────────────────── Gemini Search Grounding
   Fetch competitor updates ──────────────── Supabase (cached)
                │
3. Normalize all signals into scored values
   (heat_score, rain_risk, wind_score, uv_score, air_quality_score, dust_score)
                │
4. Build prompt:
   Business profile + Vertical playbook + 7-day signals
   + Events context + Competitor activity
                │
5. Gemini 3.5 Flash → Structured JSON response
   {days: [{date, scores, recommendations}], weekly_summary, watchlist}
                │
6. Persist to Supabase:
   agent_runs + recommendations + plan_cache
                │
7. Return to frontend → Render interactive weekly plan
```

---

## Slide 16: Watchtower — Real-Time Intelligence

### How intraday monitoring works

```
  Previous Signals (cached)          Current Signals (live)
  ┌────────────────────┐            ┌────────────────────┐
  │ rain_risk: 0.25    │            │ rain_risk: 0.75    │  ← +0.50 (CRITICAL)
  │ heat_score: 0.30   │    DIFF    │ heat_score: 0.35   │  ← +0.05 (low)
  │ wind_score: 0.15   │───────▸    │ wind_score: 0.55   │  ← +0.40 (HIGH)
  │ uv_score: 0.40     │            │ uv_score: 0.42     │  ← +0.02 (no change)
  └────────────────────┘            └────────────────────┘
                                              │
                              Only HIGH/CRITICAL changes
                              trigger new recommendations
                                              │
                                    ┌─────────▼────────┐
                                    │ Gemini generates  │
                                    │ 1-3 urgent recs   │
                                    │ + alerts           │
                                    │ + notifications    │
                                    └──────────────────┘
```

**Simulation mode:** Owners can test "what-if" scenarios (rain spike, heat wave, event postponed) without waiting for real signal changes.

---

## Slide 17: Database Schema (13 Tables)

```
businesses ◄──────────┐
    │                  │
    ├── agent_runs     │
    │      │           │
    │      ├── recommendations ──▸ alerts
    │      ├── signal_snapshots
    │      ├── signal_changes
    │      └── campaigns
    │
    ├── events
    ├── places
    ├── business_categories
    ├── competitor_updates
    ├── plan_cache
    └── notifications
```

All tables use UUID primary keys, timestamptz for all dates, and JSONB for flexible nested data.

---

## Slide 18: What Makes SkyPulse Different

| Traditional Tools | SkyPulse |
|---|---|
| Show raw weather data | Translates weather into **business actions** |
| Generic dashboards | **Vertical-specific** playbooks per industry |
| Manual competitor research | **Automated** competitive intelligence |
| Static reports | **Three-tier agent** system (weekly → daily → real-time) |
| Require many API keys | **2 API keys** total, mostly free services |
| Separate weather + events + maps | **Unified signal pipeline** combining all sources |
| Show what happened | Tell you **what to do next** |

---

## Slide 19: Supported Business Verticals

### MVP: 3 verticals, extensible to any local business

| | Pharmacy | Cafe | Convenience Store |
|---|---|---|---|
| **Weather triggers** | Sunscreen, allergy meds, cold medicine | Outdoor seating, hot/cold drinks | Umbrellas, beverages, seasonal items |
| **Event impact** | Foot traffic shifts, first aid demand | Nearby concert = rush, beach events | Commuter pattern changes |
| **Competitor response** | Match promotions, stock alternatives | Differentiate menu, adjust hours | Price matching, display changes |
| **Key metric** | Stockout risk reduction | Customer experience score | Revenue per basket |

Adding a new vertical = one new playbook file (~50 lines of rules).

---

## Slide 20: Roadmap

### What's next

| Priority | Feature | Impact |
|---|---|---|
| **P0** | Revenue impact estimator | Dollar values on every recommendation — proves ROI |
| **P0** | WhatsApp/Telegram push | Morning brief + urgent alerts to owner's phone |
| **P1** | Historical performance tracking | Charts showing recommendation outcomes over time |
| **P1** | Multi-location dashboard | Side-by-side view for chain owners |
| **P2** | Automated scheduling | Agent runs automatically on cron, no manual trigger |
| **P2** | Inventory integration | Connect to POS/inventory systems for real stock data |
| **P3** | Customer flow prediction | ML model trained on historical foot traffic patterns |

---

## Slide 21: Summary

### SkyPulse in 30 seconds

**SkyPulse** is a smart operations advisor for local businesses that:

1. **Monitors** weather, air quality, events, and competitor activity — automatically
2. **Analyzes** signals through industry-specific playbooks
3. **Recommends** specific actions with time windows, effort levels, and expected impact
4. **Adapts** in real-time when conditions change (Watchtower)
5. **Discovers** competitive intelligence and feeds it into recommendations

**Built with:** Next.js 15 · Gemini 3.5 Flash · Supabase · Open-Meteo · shadcn/ui

**API keys needed:** 2 (Gemini + Supabase)

**Verticals:** Pharmacy · Cafe · Convenience Store (extensible)

> "SkyPulse watches the sky, the streets, and the competition — so local business owners can focus on their customers."
