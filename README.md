# RAJYA: Rise of Kings

A satirical alternate-history political drama for **Android and iOS**. The Republic of
Bharatam is 75 — run the democracy, weaponize its fault lines, or bring back the kings.
An AI Game Master narrates and twists events live; every AI decision is rendered as
animated map changes, never just text. Fully playable offline without any API key.

> Fiction. Satire. All characters (Moni, Amir Sahab, Raul Baba, the Maharaja…) and places
> are invented parodies. See the in-game disclaimer.

## Languages

The game **opens in Hindi**. The interface ships in 13 languages — हिन्दी, English, বাংলা,
मराठी, తెలుగు, தமிழ், ગુજરાતી, اردو, ಕನ್ನಡ, മലയാളം, ਪੰਜਾਬੀ, ଓଡ଼ିଆ, অসমীয়া — switchable
from the title screen or AI SETUP.

- **Hindi is fully localized**: region and city names, royal titles, factions, the whole
  cast with their personas, action outcomes, weekly events and all six endings.
- **Other languages** get the full interface; proper names stay in their original form and
  the offline story text falls back to English.
- **With an API key the AI narrates in your chosen language** automatically. The
  *AI narration language* box overrides it with anything you type — Bhojpuri, Awadhi,
  Hinglish, Marathi — and personas can be written in any language too; the Game Master
  keeps that voice and still narrates in the game language.

## Quick start

```bash
npm install
npx expo start          # scan the QR with Expo Go (Android/iOS) or press a/i for emulators
```

Release builds (needs an Expo account, free tier works):

```bash
npm i -g eas-cli
eas build -p android    # → installable .apk / .aab
eas build -p ios        # → TestFlight / simulator build
```

## Playing with AI

The game ships three narrator modes (Settings → AI SETUP, keys are stored on-device only):

| Mode | What to enter |
|---|---|
| **Claude** | Anthropic API key (`sk-ant-…`), model e.g. `claude-sonnet-5` |
| **Gemini** | Google AI Studio key (`AIza…`), model e.g. `gemini-2.5-flash` |
| **Compatible** | Any OpenAI-compatible endpoint: opencode Zen, OpenRouter, OpenAI, Groq, DeepSeek, Mistral, Together, xAI Grok, Perplexity, Fireworks, Cerebras, Sarvam, GitHub Models, Ollama, LM Studio… base URL + key + model |
| **Offline** | Nothing — the procedural engine runs beats, dilemmas and endings locally |

- **TEST CONNECTION** in AI SETUP checks the key and model before you start a campaign.
- Two model slots: **main** (beats & dilemmas) and **flash** (ambient ticker noise) — use a
  cheap model for ambience, a strong one for drama.
- **Character AI**: every leader has an editable persona (Settings → Personas). Rewrite
  anyone's voice; the GM obeys when that character speaks.
- **GM Directive**: free-text extra instructions for the Game Master (flavor only — the
  engine clamps every numeric change the AI proposes).
- **Refusal Rescue**: if a model refuses or returns garbage, the ladder escalates —
  fiction-editor reframe → neutral-term rewrite → historian question-transform → offline
  engine — so a beat is never lost to political correctness. Visible in the Rescue Log.

## How a beat works

```
you act → deterministic resolver (odds, costs, effects)
        → AI Game Master narrates + proposes ≤5 twist ops
        → engine validates/clamps ops
        → map reacts: protests spread, riots pulse, curfews hatch,
          armies march, crowns drop on restored rajyas
```

Core loop: 1 week per 6 seconds · 28 regions · 4 player roles · 6 endings. Chaos **η**
(0.1–0.9) decides how ideal vs. how political the republic behaves.

## Inviting testers

```bash
npm run invite -- friend@example.com another@example.com
```

Adds people to the **newest** build already on Firebase App Distribution — no
rebuild, no upload. They get an email from Firebase that walks them through
installing Google's *App Tester* app and the APK. The script prints a direct
release link too.

Lower-friction options, in order of how little the tester has to do:

| Channel | What they do | Good for |
|---|---|---|
| **Web** | Open [rajya-sigma.vercel.app](https://rajya-sigma.vercel.app) | Anyone, instantly, no install or account |
| **App Distribution** | Accept the email, install App Tester | Real Android testing, crash reports, versioned builds |
| **GitHub release** | Download the APK, allow unknown sources | Technical friends who dislike accounts |
| **Play internal testing** | Join via an opt-in link | Up to 100 testers once the app is on Play |

## Development

```bash
npm run typecheck   # strict TS
npm run sim         # headless simulation: 12 full campaigns + engine/LLM/i18n tests
```

Docs: [Game Design](docs/GDD.md) · [Architecture](docs/ARCHITECTURE.md) · [Prompt System](docs/PROMPTS.md)
