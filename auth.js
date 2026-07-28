import { mkdir, writeFile, chmod, readFile, unlink } from 'node:fs/promises';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { CONFIG_DIR, CONFIG_FILE, DEFAULT_BASE_URL, DEFAULT_GRAPH_VERSION } from './config.js';

export async function runAuthFlow() {
  console.log('\n=== Facebook / Meta MCP — Setup ===\n');
  console.log('Generate a User or Page Access Token from Meta for Developers (Graph API Explorer) or Meta Business Manager.\n');

  const rl = readline.createInterface({ input, output });

  let accessToken = (process.env.FB_ACCESS_TOKEN || '').trim();
  let appId = (process.env.FB_APP_ID || '').trim();
  let appSecret = (process.env.FB_APP_SECRET || '').trim();

  if (!accessToken) {
    accessToken = (await rl.question('Paste your Facebook / Meta Access Token: ')).trim();
  }

  if (!appId) {
    appId = (await rl.question('Paste App ID (optional, press Enter to skip): ')).trim();
  }

  if (!appSecret && appId) {
    appSecret = (await rl.question('Paste App Secret (optional, press Enter to skip): ')).trim();
  }

  rl.close();

  if (!accessToken) {
    throw new Error('Access Token is required to authenticate with Facebook Graph API.');
  }

  console.log('\nVerifying Access Token with Meta Graph API...');
  const verifyUrl = `${DEFAULT_BASE_URL}/${DEFAULT_GRAPH_VERSION}/me?fields=id,name,email&access_token=${encodeURIComponent(accessToken)}`;
  const res = await fetch(verifyUrl);

  const text = await res.text();
  let parsed;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { raw: text };
  }

  if (!res.ok || parsed?.error) {
    const errorMsg = parsed?.error?.message || `HTTP ${res.status}`;
    throw new Error(`Verification failed: ${errorMsg}. Check your Access Token and permissions.`);
  }

  console.log(`✓ Verified successfully! Connected as: ${parsed?.name || 'ID: ' + parsed?.id}`);

  await mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 });

  const payload = {
    access_token: accessToken,
    app_id: appId || undefined,
    app_secret: appSecret || undefined,
    user_id: parsed?.id || undefined,
    user_name: parsed?.name || undefined,
    saved_at: new Date().toISOString(),
  };

  await writeFile(CONFIG_FILE, JSON.stringify(payload, null, 2), { mode: 0o600 });
  try { await chmod(CONFIG_FILE, 0o600); } catch {}

  console.log(`\n✓ Saved credentials to ${CONFIG_FILE}\n`);
  console.log('Add this to your AI client configuration:\n');
  console.log(JSON.stringify({
    mcpServers: {
      "Facebook MCP": {
        "command": "npx",
        "args": ["-y", "github:was-org/was-fb-mcp"]
      }
    }
  }, null, 2));
  console.log('');
}

export async function readConfigFile() {
  try {
    return JSON.parse(await readFile(CONFIG_FILE, 'utf8'));
  } catch (e) {
    if (e.code === 'ENOENT') return null;
    throw e;
  }
}

export async function deleteConfigFile() {
  try {
    await unlink(CONFIG_FILE);
    return true;
  } catch (e) {
    if (e.code === 'ENOENT') return false;
    throw e;
  }
}
