# Troubleshooting

Common issues and their solutions.

## Installation Issues

### `command not found: seek-vision`

**Cause:** Vision Context is not installed or not in PATH.

**Solution:**
```bash
# Install globally
npm install -g @anthropic-ai/seek-vision

# Or run directly with npx
npx @anthropic-ai/seek-vision -i image.png
```

### `Error: Cannot find module 'google-genai'`

**Cause:** Python dependency not installed.

**Solution:**
```bash
pip install google-genai
```

## Provider Issues

### Gemini API

#### `No API key found`

**Cause:** Gemini API key not configured.

**Solution:**
```bash
# Get free key from https://aistudio.google.com/apikey
seek-vision config set gemini-api.apiKey <your-api-key>

# Or set environment variable
export GEMINI_API_KEY="your-api-key"
```

#### `429 Too Many Requests`

**Cause:** Rate limited by Gemini API.

**Solution:** Wait 1-2 minutes and retry. Free tier allows ~15 requests/minute.

#### `Quota exceeded`

**Cause:** Daily limit reached.

**Solution:** Wait 24 hours or upgrade to paid tier.

### Antigravity CLI

#### `agy: command not found`

**Cause:** Antigravity CLI not installed.

**Solution:**
```bash
curl -fsSL https://antigravity.google/cli/install.sh | bash
```

#### `Not logged in`

**Cause:** Not authenticated with Google.

**Solution:**
```bash
agy
# Complete Google sign-in in browser
# Exit when done
```

#### `Permission denied (publickey)`

**Cause:** SSH key not added to GitHub.

**Solution:**
```bash
# Generate new key
ssh-keygen -t ed25519 -C "your@email.com"

# Add to GitHub
cat ~/.ssh/id_ed25519.pub
# Copy to GitHub → Settings → SSH keys
```

## Image Issues

### `Image file not found`

**Cause:** Path to image is incorrect.

**Solution:**
```bash
# Check if file exists
ls -la /path/to/image.png

# Use absolute path
seek-vision -i /full/path/to/image.png
```

### `Unsupported image format`

**Cause:** Image format not supported.

**Solution:** Use JPEG, PNG, GIF, WebP, or BMP.

### `Timeout`

**Cause:** Image processing took too long.

**Solution:**
```bash
# Increase timeout to 5 minutes
seek-vision -i image.png --timeout 300000
```

## Output Issues

### `Response was not valid JSON`

**Cause:** Vision engine returned non-JSON response.

**Solution:** This is handled automatically. The response is wrapped in a standard format.

### `uncertainty` array is not empty

**Cause:** Vision engine was unsure about some parts.

**Solution:** Report the uncertainty to the user instead of guessing. Check `result.uncertainty` for details.

## Getting Help

If you're still having issues:

1. Check the [GitHub Issues](https://github.com/affrianr/seek-vision/issues)
2. Run `seek-vision --check` to verify provider status
3. Run `seek-vision config show` to see configuration
