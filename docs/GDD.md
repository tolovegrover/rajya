# RAJYA: Rise of Kings — Game Design Document

A satirical alternate-history political drama set in **Bharatam**, a fictional federal republic that
resembles India. All characters are parody figures with twisted names. Nothing in this game refers
to real persons or parties; it is interactive political fiction in the spirit of *Suzerain* and
*Democracy 4*, with a live AI Game Master narrating and twisting events.

> DISCLAIMER: Fiction. Satire. All characters, parties and events are invented.

## 1. Premise

The Republic of Bharatam is a 75-year-old democracy. Cracks are showing: quota politics, land wars,
communal tension, federal friction, and a nostalgic royalist undercurrent. The player enters as a
power broker. Depending on the chosen role, the campaign can:

- **Preserve the Republic** (democratic win), or
- **Burn it down** — unrest fragments the union and regional *Rajyas* (kingdoms) restore their
  thrones, crowned Maharajas return, or
- **Crown yourself** the power behind — or on — the throne.

## 2. Campaign Flow

1. **Title → Disclaimer → New Campaign**
2. **Campaign Setup**
   - Choose a role (see §4)
   - Set **Chaos η** (0–100): the noise parameter that decides how "ideal vs. political" the world
     behaves. Low η = mostly clean governance simulations. High η = betrayals, riots, defections,
     conspiracies, defections again.
   - Configure AI (Claude API key / opencode-compatible endpoint / offline). Character AI personas
     are editable — every leader runs on its own instruction block.
3. **The Game World** (real-time)
   - A stylized map of Bharatam with 28 regions. Time flows (1 tick = 1 week, ~6 real seconds).
   - Protests ignite and spread, riots burn, armies march, curfews clamp, crowns appear on
     restored kingdoms. Everything the AI decides is rendered as animated map effects, not just text.
   - Player acts through role actions; a deterministic simulation core computes outcomes; the AI
     Game Master narrates the outcome and may inject 1–5 extra "twist" operations (clamped).

## 3. The World

- **Regions**: each has population, wealth, urbanization, community mix (Majority/Minority/Other
  shares — fictionalized), Swarna (elite-caste) share, `unrest`, `reservationHeat`, `landHeat`,
  `royalist`, `separatist`, `loyaltyRepublic`, `curfew`.
- **Factions** (multi-sided; none is "the right one" — the sim models everyone's genuine motives):
  - **Swaraj Sarkar** — ruling party of PM Moni (majority-leaning, development + muscular nationalism)
  - **Jantantra Kangress** — opposition under dynast Raul Baba
  - **Swarna Aandolan** — elite-caste movement claiming merit is dying by quota; organizes
    anti-reservation protests (Devraj Chauhan)
  - **Bahujan Mukti Morcha** — pro-quota justice movement (Ramrao Ambedkari)
  - **Kisan Mazdoor Sabha** — farmers' land war (Thikait Singh): land acquisition, MSP, sieges
  - **Rajwada Sabha** — royalists lobbying to restore the thrones (Maharaja Vikramaditya IV)
  - **Dravida Ekta Kazhagam** — southern federalists (Kalai Selvan)
  - **Dharma Rakshak Sena / Milli Ittehad** — majority/minority religious organizations
  - **The Studio** — TV media (Swammy Aarab: "The Nation Wants To Know")
  - **The Crown's Court** — the army (Gen. Rudra Pratap: loyal to the Constitution… while it lasts)
- **National stats**: Treasury, Legitimacy, Stability.

## 4. Player Roles

| Role | You are | Win condition |
|---|---|---|
| **Chief Strategist** | Moni's backroom brain | Republic survives 120 weeks with Stability ≥ 60 |
| **Swarna Agitator** | Organizer of the anti-quota movement | Reservation policy repealed, or you seize power |
| **Royalist Emissary** | Agent of Maharaja Vikramaditya IV | ≥ 30% population under restored crowns |
| **Shadow Oligarch** | Money behind all thrones | Be kingmaker when any ending triggers with Influence ≥ 70 |

Role actions (each costs resources, resolved by the deterministic core, narrated by AI):

- Strategist: Speech, SIT Crackdown, Negotiate, Welfare Scheme, Army Deployment
- Swarna Agitator: Rally, Fast-unto-Death, Media Blitz, Fund Litigation, March to the Capital
- Royalist: Court Nobles, Heritage Restoration, Buy MLAs, Rumor Campaign
- Oligarch: Fund Faction, Buy Media, Broker Coalition, Crisis Bet

## 5. Systems

### 5.1 Deterministic core ("the game is completely defined")
- Every action has a **cost, odds, and effect table** computed from region stats with noise η.
- Unrest drift: reservationHeat + landHeat + curfew + poverty → unrest; unrest > 85 → riot risk;
  unrest > 92 + royalist > 60 → throne restoration risk; separatist > 80 → secession crisis.
- Riot spread to neighbors; army deployment suppresses unrest but breeds separatism.
- Economy: treasury income/turn scales with wealth × stability; unrest drains it.
- Elections: every 16 turns in a random cluster of regions → faction power shifts.
- The game is **fully playable offline** via procedural beat templates.

### 5.2 Chaos η (noise)
- η ∈ [0,1] biases: outcome variance, chance of betrayal events, severity of AI twists, and is sent
  to the AI Game Master as an explicit instruction ("at η>0.7, betrayals, scams and riots
  proliferate; at η<0.3, governance mostly works").
- "Sometimes ideal, sometimes political — *how much* is defined by η."

### 5.3 Endings
- **The Republic Endures** (democratic win)
- **Age of Rajyas** (fragmentation, kings return)
- **The Iron Crown** (a single Maharaja re-unites the realm — royalist win)
- **Chaos** (legitimacy 0, military takes over) 
- **The Kingmaker** (oligarch special)
- Role-specific losses (imprisoned, assassinated — η-dependent)

## 6. Content rules (kept in-engine, non-negotiable)

- No real names, parties, or places; parody only.
- All factions get genuine motives and equal narrative dignity; the player may exploit them all.
- Violence is depicted as politics with consequences (curfews, casualties counted), never glorified.
- The AI narrates fiction; the engine clamps every AI-proposed numeric change.
