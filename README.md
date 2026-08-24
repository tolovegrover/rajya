# RAJYA: Rise of Kings

A satirical alternate-history political drama for **Android and iOS**. The Republic of
Bharatam is 75 — run the democracy, weaponize its fault lines, or bring back the kings.
An AI Game Master narrates and twists events live; every AI decision is rendered as
animated map changes, never just text. Fully playable offline without any API key.

> Fiction. Satire. All characters (Moni, Amir Sahab, Raul Baba, the Maharaja…) and places
> are invented parodies. See the in-game disclaimer.

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
| **Claude** | Anthropic API key (`sk-ant-…`), model e.g. `claude-sonnet-4-5` |
| **Compatible** | Any OpenAI-compatible endpoint: opencode Zen, OpenRouter, LM Studio… base URL + key + model |
| **Offline** | Nothing — the procedural engine runs beats, dilemmas and endings locally |

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

## Development

```bash
npm run typecheck   # strict TS
npm run sim         # headless simulation: 12 full campaigns + 25 engine/LLM-parsing tests
```

Docs: [Game Design](docs/GDD.md) · [Architecture](docs/ARCHITECTURE.md) · [Prompt System](docs/PROMPTS.md)
