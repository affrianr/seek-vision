<p align="center">
  <h1 align="center">Seek Vision</h1>
  <p align="center"><b>Give a text-only model sight, and just paste the image.</b></p>
</p>

<p align="center">
  <a href="skills/seek-vision/references/configure.md">Configuration</a> · 
  <a href="skills/seek-vision/references/output-schema.md">Output Schema</a> · 
  <a href="docs/troubleshooting.md">Troubleshooting</a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@affrianr/seek-vision"><img src="https://img.shields.io/npm/v/@affrianr/seek-vision?style=flat-square&label=npm&color=cb3837" alt="npm"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License"></a>
</p>

```bash
npx @affrianr/seek-vision extract screenshot.png
```

Models like DeepSeek-V4-Flash are cheap, fast, capable, and blind. Throw one a screenshot of an error and it sees nothing. Seek Vision hands the image to a real vision engine and brings back evidence your model can quote: every word transcribed, the layout mapped, the doubts declared.

## Highlights

- **Structured output.** Every word transcribed, layout cut into regions in reading order, entities and relations listed. Your model quotes specifics instead of trusting a vibe.
- **Uncertainty reporting.** It says when it cannot read something. Uncertain parts land in `uncertainty`.
- **Keep your model.** You picked it for price and reasoning, not eyesight. That choice stays.
- **Starts with no key.** The default engine (Antigravity CLI) needs none. A free Gemini key cuts a read to 5-10 seconds.
- **Install once, works everywhere.** Verified on real machines in Claude Code, Codex, Pi, and OpenCode.

## Installation

```bash
npx @affrianr/seek-vision
```

Or tell your agent: "Install the skill from https://github.com/affrianr/seek-vision".

Then give it a vision engine. A free **[AI Studio](https://aistudio.google.com) Gemini key** is the fast answer (three minutes, no credit card, 5-10 seconds per image):

```bash
npx @affrianr/seek-vision config set gemini-api.apiKey <key>
```

Skipping the sign-up is fine: **Antigravity CLI** works with no key, it is just slower (15-40 seconds) with a tight free quota:

```bash
curl -fsSL https://antigravity.google/cli/install.sh | bash && agy   # sign in, then exit
```

Requires Node 18+ (22.13+ for paste recovery), macOS or Linux.

## Usage

With the skill installed you do not type commands: paste an image or drop a path, ask anything, and it fires on its own. By hand:

```bash
npx @affrianr/seek-vision extract screenshot.png                       # local image
npx @affrianr/seek-vision extract https://example.com/chart.png        # remote image
npx @affrianr/seek-vision extract chart.png --prompt "focus on axes"   # extra focus
```

Output is a fixed JSON shape:

```json
{
  "image": "/path/to/screenshot.png",
  "provider": "gemini-api",
  "result": {
    "summary": "A workflow diagram with four nodes connected by labeled arrows.",
    "ocr": { "full_text": "/shaping\nBEFORE YOU BUILD\n...", "lines": [] },
    "layout": { "regions": [{ "reading_order": 1, "type": "title", "text": "/shaping" }] },
    "uncertainty": []
  },
  "meta": {
    "generatedAt": "2026-08-06T12:00:00.000Z",
    "model": "gemini-2.0-flash",
    "durationSeconds": 6.4
  }
}
```

## Development

```bash
# Clone the repo
git clone git@github.com:affrianr/seek-vision.git
cd seek-vision

# Install dependencies
npm install

# Build
npm run build

# Run
npm start
```

## License

MIT

## Credits

Built for [Hermes Agent](https://github.com/NousResearch/hermes-agent) by Nous Research
