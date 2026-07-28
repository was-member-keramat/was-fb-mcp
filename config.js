import { homedir } from 'node:os';
import { join } from 'node:path';

export const CONFIG_DIR = join(homedir(), '.was-fb-mcp');
export const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

// Facebook Graph API defaults
export const DEFAULT_BASE_URL = 'https://graph.facebook.com';
export const DEFAULT_GRAPH_VERSION = 'v19.0';
