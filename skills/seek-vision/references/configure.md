# Configuration

Vision Context supports two vision providers. Here's how to configure each:

## Gemini API (Recommended)

### Get API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the key (it's free, no credit card needed!)

### Configure

```bash
# Option 1: Environment variable
export GEMINI_API_KEY="your-api-key-here"

# Option 2: Config file (recommended)
npx @anthropic-ai/seek-vision config set gemini-api.apiKey <your-api-key>
```

### Verify

```bash
npx @anthropic-ai/seek-vision config show
```

Should show `gemini-api: { available: true, has_key: true }`

## Antigravity CLI (No Key Needed)

### Install

```bash
curl -fsSL https://antigravity.google/cli/install.sh | bash
```

### Login

```bash
agy
# Complete Google sign-in in browser
# Exit when done
```

### Verify

```bash
npx @anthropic-ai/seek-vision config show
```

Should show `antigravity-cli: { available: true, authenticated: true }`

## Switching Providers

```bash
# Use Gemini API
npx @anthropic-ai/seek-vision -i image.png -p gemini-api

# Use Antigravity CLI
npx @anthropic-ai/seek-vision -i image.png -p antigravity-cli

# Auto-detect (tries Gemini first, falls back to Antigravity)
npx @anthropic-ai/seek-vision -i image.png
```

## Troubleshooting

### Gemini API

| Problem | Solution |
|---------|----------|
| `No API key found` | Run `config set gemini-api.apiKey <key>` |
| `429 Too Many Requests` | Rate limited - wait and retry |
| `Quota exceeded` | Daily limit reached - wait 24h |

### Antigravity CLI

| Problem | Solution |
|---------|----------|
| `agy: command not found` | Run install command above |
| `Not logged in` | Run `agy` and complete sign-in |
| `Rate limited` | Wait and retry |
