#!/usr/bin/env node

/**
 * Facebook / Meta MCP — CLI router
 *
 *   was-fb-mcp          Start the MCP server (used by AI client via stdio)
 *   was-fb-mcp auth     Connect / re-connect Facebook credentials
 *   was-fb-mcp logout   Delete saved credentials
 *   was-fb-mcp status   Show credential status
 *   was-fb-mcp help     Show usage help
 */

import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { CONFIG_FILE } from './config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cmd = (process.argv[2] || '').toLowerCase();

// EVERY dynamic import() MUST be wrapped in pathToFileURL(...).href
// Otherwise Windows Node 24+ throws ERR_UNSUPPORTED_ESM_URL_SCHEME

if (cmd === 'auth') {
  const { runAuthFlow } = await import(pathToFileURL(join(__dirname, 'auth.js')).href);
  try {
    await runAuthFlow();
    process.exit(0);
  } catch (err) {
    console.error('\nAuth failed:', err?.message || err);
    process.exit(1);
  }
} else if (cmd === 'logout') {
  const { deleteConfigFile } = await import(pathToFileURL(join(__dirname, 'auth.js')).href);
  const deleted = await deleteConfigFile();
  console.log(deleted ? `Removed ${CONFIG_FILE}` : 'No saved credentials to remove.');
  process.exit(0);
} else if (cmd === 'status') {
  const { readConfigFile } = await import(pathToFileURL(join(__dirname, 'auth.js')).href);
  const cfg = await teadConfigFile();
  if (!cfg) {
    console.log('Not configured. Run `npx -y github:was-member-keramat/was-fb-mcp auth` to connect.');
  } else {
    console.log(`Config File: ${CONFIG_FILE}`);
    console.log(`User Name:   ${cfg.user_name || '(unknown)'}`);
    console.log(`User ID:     ${cfg.user_id || '(unknown)'}`);
    console.log(`Saved At:    ${cfg.saved_at || '(unknown)'}`);
  }
  process.exit(0);
} else if (cmd === 'help' || cmd === '--help' || cmd === '-h') {
  console.log(`
Facebook / Meta MCP — CLI

Usage:
  npx -y github:was-member-keramat/was-fb-mcp          Start MCP server (stdio)
  npx -y github:was-member-keramat/was-fb-mcp auth     Connect / re-connect credentials
  npx -y github:was-member-keramat/was-fb-mcp status   Show config status
  npx -y github:was-member-keramat/was-fb-mcp logout   Delete credentials
  npx -y github:was-member-keramat/was-fb-mcp help     Show this help message

Environment Variable Overrides (take precedence over saved config):
  FB_ACCESS_TOKEN                Facebook / Meta User/Page Access Token
  FB_GRAPH_VERSION               API Version (default: v19.0)
  FB_BASE_URL                    API Base URL (default: https://graph.facebook.com)

Requires Node 18+.
`);
  process.exit(0);
} else {
  // Default action: start the MCP stdio server
  await import(pathToFileURL(join(__dirname, 'server.js')).href);
}
