#!/usr/bin/env python3
"""
Vision Context - Vision Bridge for Text-Only Models
Extracts structured image context using Gemini API or Antigravity CLI.
"""

import os
import sys
import json
import argparse
import subprocess
import time
from pathlib import Path
from datetime import datetime

__version__ = "1.0.0"

PROVIDERS = {
    "gemini-api": {
        "name": "Gemini API",
        "requires_key": True,
        "key_env": "GEMINI_API_KEY",
        "key_file": "~/.seek-vision/gemini_api_key.txt",
        "description": "Free tier from Google AI Studio"
    },
    "antigravity-cli": {
        "name": "Antigravity CLI",
        "requires_key": False,
        "command": "agy",
        "description": "Google's CLI, uses Google account login"
    }
}


def load_api_key():
    """Load Gemini API key from environment or config file."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key:
        return api_key
    
    config_path = Path.home() / ".seek-vision" / "gemini_api_key.txt"
    if config_path.exists():
        return config_path.read_text().strip()
    
    return None


def check_provider(provider: str) -> dict:
    """Check if a provider is available and configured."""
    if provider not in PROVIDERS:
        return {"available": False, "error": f"Unknown provider: {provider}"}
    
    config = PROVIDERS[provider]
    
    if provider == "gemini-api":
        api_key = load_api_key()
        if not api_key:
            return {
                "available": False,
                "error": "No API key found. Set GEMINI_API_KEY env var or run: seek-vision config set gemini-api.apiKey <key>"
            }
        return {"available": True, "provider": provider, "has_key": True}
    
    elif provider == "antigravity-cli":
        try:
            result = subprocess.run(
                [config["command"], "--version"],
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode == 0:
                auth_result = subprocess.run(
                    [config["command"], "auth", "status"],
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                authenticated = auth_result.returncode == 0 and "logged in" in auth_result.stdout.lower()
                return {
                    "available": True,
                    "provider": provider,
                    "authenticated": authenticated
                }
            else:
                return {"available": False, "error": "Antigravity CLI not working properly"}
        except (FileNotFoundError, subprocess.TimeoutExpired):
            return {"available": False, "error": "Antigravity CLI not installed"}
    
    return {"available": False, "error": "Provider check not implemented"}


def get_available_provider() -> str:
    """Get the first available provider."""
    for provider in ["gemini-api", "antigravity-cli"]:
        status = check_provider(provider)
        if status.get("available"):
            if provider == "antigravity-cli" and not status.get("authenticated"):
                continue
            return provider
    return None


def extract_with_gemini(image_path: str, prompt: str = None, model: str = "gemini-2.0-flash") -> dict:
    """Extract image context using Gemini API."""
    api_key = load_api_key()
    if not api_key:
        return {"error": "No API key found"}
    
    if not os.path.exists(image_path):
        return {"error": f"Image file not found: {image_path}"}
    
    default_prompt = """Analyze this image and provide structured JSON output with:
1. summary: one-paragraph description
2. ocr: {full_text: "all visible text", lines: ["line1", "line2"]}
3. layout: {regions: [{reading_order: 1, type: "title|paragraph|table|chart|code", text: "..."}]}
4. semantics: {scene: "...", intent: "...", entities: ["..."], relations: ["..."]}
5. visual: {colors: ["..."], style: "..."}
6. uncertainty: ["what was ambiguous"]

Return ONLY valid JSON, no markdown."""
    
    if prompt:
        default_prompt = prompt
    
    try:
        from google import genai
        from google.genai import types
        
        with open(image_path, "rb") as f:
            image_data = f.read()
        
        ext = Path(image_path).suffix.lower()
        mime_types = {
            ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
            ".png": "image/png", ".gif": "image/gif",
            ".webp": "image/webp", ".bmp": "image/bmp"
        }
        mime_type = mime_types.get(ext, "image/jpeg")
        
        client = genai.Client(api_key=api_key)
        
        start_time = time.time()
        response = client.models.generate_content(
            model=model,
            contents=[
                types.Part.from_bytes(data=image_data, mime_type=mime_type),
                default_prompt
            ]
        )
        duration = time.time() - start_time
        
        try:
            result = json.loads(response.text)
        except json.JSONDecodeError:
            result = {
                "summary": response.text,
                "ocr": {"full_text": "", "lines": []},
                "layout": {"regions": []},
                "semantics": {"scene": "", "intent": "", "entities": [], "relations": []},
                "visual": {"colors": [], "style": ""},
                "uncertainty": ["Response was not valid JSON"]
            }
        
        return {
            "image": image_path,
            "provider": "gemini-api",
            "result": result,
            "meta": {
                "generatedAt": datetime.now().isoformat(),
                "model": model,
                "durationSeconds": round(duration, 2)
            }
        }
        
    except Exception as e:
        return {"error": str(e), "image": image_path}


def extract_with_antigravity(image_path: str, prompt: str = None) -> dict:
    """Extract image context using Antigravity CLI."""
    if not os.path.exists(image_path):
        return {"error": f"Image file not found: {image_path}"}
    
    default_prompt = "Analyze this image and provide structured JSON output with summary, ocr, layout, semantics, visual, and uncertainty fields."
    
    if prompt:
        default_prompt = prompt
    
    try:
        cmd = ["agy", "ask", "--image", image_path, "--prompt", default_prompt]
        
        start_time = time.time()
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=60
        )
        duration = time.time() - start_time
        
        if result.returncode == 0:
            try:
                parsed = json.loads(result.stdout)
            except json.JSONDecodeError:
                parsed = {
                    "summary": result.stdout,
                    "ocr": {"full_text": "", "lines": []},
                    "layout": {"regions": []},
                    "semantics": {"scene": "", "intent": "", "entities": [], "relations": []},
                    "visual": {"colors": [], "style": ""},
                    "uncertainty": ["Response was not valid JSON"]
                }
            
            return {
                "image": image_path,
                "provider": "antigravity-cli",
                "result": parsed,
                "meta": {
                    "generatedAt": datetime.now().isoformat(),
                    "model": "antigravity",
                    "durationSeconds": round(duration, 2)
                }
            }
        else:
            return {"error": f"Antigravity CLI error: {result.stderr}", "image": image_path}
            
    except subprocess.TimeoutExpired:
        return {"error": "Antigravity CLI timed out", "image": image_path}
    except Exception as e:
        return {"error": str(e), "image": image_path}


def extract(image_path: str, provider: str = None, prompt: str = None, model: str = None) -> dict:
    """Extract image context using specified or auto-detected provider."""
    if provider is None:
        provider = get_available_provider()
        if provider is None:
            return {"error": "No vision provider available. Install gemini-api or antigravity-cli."}
    
    if provider == "gemini-api":
        return extract_with_gemini(image_path, prompt, model or "gemini-2.0-flash")
    elif provider == "antigravity-cli":
        return extract_with_antigravity(image_path, prompt)
    else:
        return {"error": f"Unknown provider: {provider}"}


def main():
    parser = argparse.ArgumentParser(
        description="Vision Context - Vision Bridge for Text-Only Models",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  seek-vision -i screenshot.png
  seek-vision -i chart.jpg --prompt "focus on axes"
  seek-vision -i receipt.png -p gemini-api
  seek-vision --check
  seek-vision config show
        """
    )
    
    parser.add_argument("-i", "--image", help="Path to image file or URL")
    parser.add_argument("-p", "--provider", choices=["gemini-api", "antigravity-cli"],
                       help="Vision provider to use")
    parser.add_argument("-m", "--model", default="gemini-2.0-flash",
                       help="Model to use (for gemini-api)")
    parser.add_argument("--prompt", help="Extra prompt/focus for the analysis")
    parser.add_argument("-o", "--output", help="Output file path")
    parser.add_argument("--timeout", type=int, default=60000,
                       help="Timeout in milliseconds")
    parser.add_argument("--check", action="store_true",
                       help="Check available providers")
    parser.add_argument("--version", action="version", version=f"%(prog)s {__version__}")
    
    parser.add_argument("config", nargs="?", help="Config subcommand (show, set, init)")
    parser.add_argument("config_args", nargs="*", help="Config arguments")
    
    args = parser.parse_args()
    
    if args.config == "config":
        if len(args.config_args) == 0:
            print(json.dumps({"error": "Usage: seek-vision config show|set|init"}, indent=2))
            sys.exit(1)
        
        subcmd = args.config_args[0]
        
        if subcmd == "show":
            status = {}
            for provider in PROVIDERS:
                status[provider] = check_provider(provider)
            print(json.dumps(status, indent=2))
        
        elif subcmd == "set":
            if len(args.config_args) < 3:
                print(json.dumps({"error": "Usage: seek-vision config set <provider>.<key> <value>"}, indent=2))
                sys.exit(1)
            
            target = args.config_args[1]
            value = args.config_args[2]
            
            if target == "gemini-api.apiKey":
                config_dir = Path.home() / ".seek-vision"
                config_dir.mkdir(exist_ok=True)
                key_file = config_dir / "gemini_api_key.txt"
                key_file.write_text(value)
                key_file.chmod(0o600)
                print(json.dumps({"success": True, "message": "API key saved"}, indent=2))
            else:
                print(json.dumps({"error": f"Unknown config target: {target}"}, indent=2))
        
        elif subcmd == "init":
            config_dir = Path.home() / ".seek-vision"
            config_dir.mkdir(exist_ok=True)
            print(json.dumps({"success": True, "message": f"Config directory created at {config_dir}"}, indent=2))
        
        else:
            print(json.dumps({"error": f"Unknown config subcommand: {subcmd}"}, indent=2))
        
        return
    
    if args.check:
        status = {}
        for provider in PROVIDERS:
            status[provider] = check_provider(provider)
        print(json.dumps(status, indent=2))
        return
    
    if not args.image:
        parser.print_help()
        sys.exit(1)
    
    result = extract(args.image, args.provider, args.prompt, args.model)
    
    if args.output:
        with open(args.output, "w") as f:
            json.dump(result, f, indent=2)
        print(json.dumps({"success": True, "output": args.output}, indent=2))
    else:
        print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
