#!/usr/bin/env node

/**
 * Seek Vision - CLI Entry Point
 * Vision bridge for text-only models
 */

import { Command } from 'commander';
import { VERSION, extract, checkProviders, getAvailableProvider } from './index.js';
import { saveApiKey } from './providers/gemini.js';

// Create CLI program
const program = new Command();

program
  .name('seek-vision')
  .description('Vision bridge for text-only models')
  .version(VERSION);

// Main command - extract image context
program
  .command('extract')
  .description('Extract context from an image')
  .argument('<image>', 'Path to image file or URL')
  .option('-p, --provider <provider>', 'Vision provider (gemini-api, antigravity-cli)')
  .option('-m, --model <model>', 'Model to use (for gemini-api)', 'gemini-2.0-flash')
  .option('--prompt <prompt>', 'Extra prompt/focus for the analysis')
  .option('-o, --output <file>', 'Output file path')
  .action(async (image, options) => {
    try {
      const result = await extract(
        image,
        options.provider as any,
        options.prompt,
        options.model
      );

      if (options.output) {
        const fs = require('fs');
        fs.writeFileSync(options.output, JSON.stringify(result, null, 2));
        console.log(JSON.stringify({ success: true, output: options.output }, null, 2));
      } else {
        console.log(JSON.stringify(result, null, 2));
      }
    } catch (error) {
      console.error(JSON.stringify({
        error: error instanceof Error ? error.message : String(error)
      }, null, 2));
      process.exit(1);
    }
  });

// Config command
program
  .command('config')
  .description('Manage configuration')
  .argument('[subcommand]', 'Config subcommand (show, set, init)')
  .argument('[args...]', 'Config arguments')
  .action((subcommand, args) => {
    if (!subcommand) {
      console.log(JSON.stringify({
        error: 'Usage: seek-vision config show|set|init'
      }, null, 2));
      process.exit(1);
    }

    if (subcommand === 'show') {
      const status = checkProviders();
      console.log(JSON.stringify(status, null, 2));
    } else if (subcommand === 'set') {
      if (args.length < 2) {
        console.log(JSON.stringify({
          error: 'Usage: seek-vision config set <provider>.<key> <value>'
        }, null, 2));
        process.exit(1);
      }

      const target = args[0];
      const value = args[1];

      if (target === 'gemini-api.apiKey') {
        saveApiKey(value);
        console.log(JSON.stringify({ success: true, message: 'API key saved' }, null, 2));
      } else {
        console.log(JSON.stringify({
          error: `Unknown config target: ${target}`
        }, null, 2));
      }
    } else if (subcommand === 'init') {
      const fs = require('fs');
      const path = require('path');
      const os = require('os');
      
      const configDir = path.join(os.homedir(), '.seek-vision');
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      console.log(JSON.stringify({
        success: true,
        message: `Config directory created at ${configDir}`
      }, null, 2));
    } else {
      console.log(JSON.stringify({
        error: `Unknown config subcommand: ${subcommand}`
      }, null, 2));
    }
  });

// Check command
program
  .command('check')
  .description('Check available providers')
  .action(() => {
    const status = checkProviders();
    console.log(JSON.stringify(status, null, 2));
  });

// Parse arguments
program.parse();
