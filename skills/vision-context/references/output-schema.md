# Output Schema

Vision Context returns a structured JSON output. Here's the complete schema:

## Top Level

```json
{
  "image": "string (path to image)",
  "provider": "gemini-api | antigravity-cli",
  "result": { ... },
  "meta": { ... }
}
```

## Result Object

```json
{
  "result": {
    "summary": "string (one-paragraph description)",
    "ocr": {
      "full_text": "string (all visible text)",
      "lines": ["string (individual lines)"]
    },
    "layout": {
      "regions": [
        {
          "reading_order": "number",
          "type": "title | paragraph | table | chart | code | list | image | other",
          "text": "string"
        }
      ]
    },
    "semantics": {
      "scene": "string (what is happening)",
      "intent": "string (purpose of image)",
      "entities": ["string (people, objects, places)"],
      "relations": ["string (relationships between entities)"]
    },
    "visual": {
      "colors": ["string (dominant colors)"],
      "style": "string (visual style description)"
    },
    "uncertainty": ["string (what was ambiguous)"]
  }
}
```

## Meta Object

```json
{
  "meta": {
    "generatedAt": "ISO 8601 timestamp",
    "model": "string (model used)",
    "durationSeconds": "number (processing time)"
  }
}
```

## Example

```json
{
  "image": "/tmp/screenshot.png",
  "provider": "gemini-api",
  "result": {
    "summary": "A Python function that calculates factorial using recursion.",
    "ocr": {
      "full_text": "def factorial(n):\n    if n == 0:\n        return 1\n    return n * factorial(n-1)",
      "lines": [
        "def factorial(n):",
        "    if n == 0:",
        "        return 1",
        "    return n * factorial(n-1)"
      ]
    },
    "layout": {
      "regions": [
        {
          "reading_order": 1,
          "type": "code",
          "text": "def factorial(n):\n    if n == 0:\n        return 1\n    return n * factorial(n-1)"
        }
      ]
    },
    "semantics": {
      "scene": "Code editor showing a Python function",
      "intent": "Demonstrate recursive factorial implementation",
      "entities": ["factorial function", "recursion", "base case"],
      "relations": ["factorial calls itself with n-1", "base case returns 1"]
    },
    "visual": {
      "colors": ["black", "white", "blue", "green"],
      "style": "Dark theme code editor with syntax highlighting"
    },
    "uncertainty": []
  },
  "meta": {
    "generatedAt": "2026-08-06T12:00:00.000Z",
    "model": "gemini-2.0-flash",
    "durationSeconds": 5.2
  }
}
```

## Region Types

| Type | Description |
|------|-------------|
| `title` | Heading or title text |
| `paragraph` | Body text paragraph |
| `table` | Tabular data |
| `chart` | Graph or chart |
| `code` | Code block |
| `list` | List items |
| `image` | Image within image |
| `other` | Anything else |

## Uncertainty

The `uncertainty` array contains strings describing what the vision engine was unsure about. Examples:

- "Text in bottom-right corner is partially occluded"
- "Cannot determine if this is a bar chart or histogram"
- "Handwriting is difficult to read"

Always report uncertainty to the user instead of guessing.
