#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { CONFIG_FILE, DEFAULT_BASE_URL, DEFAULT_GRAPH_VERSION } from './config.js';

let saved = {};
try { saved = JSON.parse(readFileSync(CONFIG_FILE, 'utf8')); } catch {}

const ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN || saved.access_token;
const BASE_URL = (process.env.FB_BASE_URL || saved.base_url || DEFAULT_BASE_URL).replace(/\/+$/, '');
const GRAPH_VERSION = process.env.FB_GRAPH_VERSION || saved.graph_version || DEFAULT_GRAPH_VERSION;

if (!ACCESS_TOKEN) {
  console.error('Facebook / Meta MCP — not configured yet.');
  process.exit(1);
}

async function graphApi(method, path, options = {}) {
  const { params = {}, body = null, customToken = null } = options;
  const token = customToken || ACCESS_TOKEN;
  const cleanPath = path.replace(/^\/+/, '');
  const fullPath = cleanPath.startsWith('v') ? cleanPath : `${GRAPH_VERSION}/${cleanPath}`;
  const queryParams = new URLSearchParams();
  queryParams.set('access_token', token);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) queryParams.set(k, String(v));
  }
  const url = `${BASE_URL}/${fullPath}?${queryParams.toString()}`;
  const init = { method, headers: { 'Accept': 'application/json' } };
  if (body && (method === 'POST' || method === 'PUT')) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  const res = await fetch(url, init);
  const text = await res.text();
  let parsed;
  try { parsed = text ? JSON.parse(text) : null; } catch { parsed = { raw: text }; }
  if (!res.ok || parsed?.error) {
    const err = new Error(parsed?.error?.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.body = parsed;
    throw err;
  }
  return parsed;
}

function asTextResult(data) {
  const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  const MAX = 60000;
  if (text.length > MAX) {
    return { content: [{ type: 'text', text: text.slice(0, MAX) + `\n\n... [truncated ${text.length - MAX} chars; narrow your query]` }] };
  }
  return { content: [{ type: 'text', text }] };
}

function asError(err) {
  const vendorError = err?.body?.error || null;
  return {
    isError: true,
    content: [{
      type: 'text',
      text: 'Facebook / Meta Graph API error:\n' + JSON.stringify({
        message: vendorError?.message || err?.message || String(err),
        status: err?.status ?? null,
        code: vendorError?.code ?? null,
        error_subcode: vendorError?.error_subcode ?? null,
        type: vendorError?.type ?? null,
        fbtrace_id: vendorError?.fbtrace_id ?? null,
        raw: err?.body ?? null,
      }, null, 2),
    }],
  };
}

const tools = [
  { name: 'fb_get_me', description: 'Get details of the currently authenticated Facebook User, Page, or Token owner.', inputSchema: { type: 'object', properties: { fields: { type: 'string', description: 'Comma-separated fields to request' } } } },
  { name: 'fb_list_pages', description: 'List Facebook Pages managed by the authenticated user.', inputSchema: { type: 'object', properties: { fields: { type: 'string', description: 'Comma-separated fields' } } } },
  { name: 'fb_create_post', description: 'Create a new post on a Facebook Page feed.', inputSchema: { type: 'object', properties: { pageId: { type: 'string' }, message: { type: 'string' }, link: { type: 'string' }, pageToken: { type: 'string' } }, required: ['pageId', 'message'] } },
  { name: 'fb_get_page_feed', description: 'Fetch recent posts published on a Facebook Page.', inputSchema: { type: 'object', properties: { pageId: { type: 'string' }, limit: { type: 'integer', default: 25 }, pageToken: { type: 'string' } }, required: ['pageId'] } },
  { name: 'fb_get_post_comments', description: 'Get comments on a Facebook post or photo.', inputSchema: { type: 'object', properties: { postId: { type: 'string' }, limit: { type: 'integer', default: 25 } }, required: ['postId'] } },
  { name: 'fb_reply_comment', description: 'Publish a reply or comment to a Facebook post or parent comment.', inputSchema: { type: 'object', properties: { targetId: { type: 'string' }, message: { type: 'string' }, accessToken: { type: 'string' } }, required: ['targetId', 'message'] } },
  { name: 'fb_list_ad_accounts', description: 'List Meta Ad Accounts accessible by the token.', inputSchema: { type: 'object', properties: { fields: { type: 'string' } } } },
  { name: 'fb_list_campaigns', description: 'List ad campaigns inside a Meta Ad Account.', inputSchema: { type: 'object', properties: { adAccountId: { type: 'string' }, limit: { type: 'integer', default: 25 } }, required: ['adAccountId'] } },
  { name: 'fb_get_insights', description: 'Get metrics and insights for a Facebook Page, Post, or Ad Account.', inputSchema: { type: 'object', properties: { objectId: { type: 'string' }, metric: { type: 'string' }, period: { type: 'string' } }, required: ['objectId', 'metric'] } },
  { name: 'fb_api', description: 'Universal Graph API tool. Execute any GET, POST, or DELETE request.', inputSchema: { type: 'object', properties: { path: { type: 'string' }, method: { type: 'string', default: 'GET' }, params: { type: 'object' }, body: { type: 'object' }, token: { type: 'string' } }, required: ['path'] } },
  { name: 'fb_list_pixels', description: 'List Meta Pixels and Datasets for an Ad Account.', inputSchema: { type: 'object', properties: { adAccountId: { type: 'string' }, fields: { type: 'string' } }, required: ['adAccountId'] } },
  { name: 'fb_create_pixel', description: 'Create a new Meta Pixel or Dataset under an Ad Account.', inputSchema: { type: 'object', properties: { adAccountId: { type: 'string' }, name: { type: 'string' } }, required: ['adAccountId', 'name'] } },
  { name: 'fb_update_pixel', description: 'Update / Edit an existing Meta Pixel or Dataset.', inputSchema: { type: 'object', properties: { pixelId: { type: 'string' }, name: { type: 'string' } }, required: ['pixelId'] } },
  { name: 'fb_delete_pixel', description: 'Delete or remove a Meta Pixel or Dataset.', inputSchema: { type: 'object', properties: { pixelId: { type: 'string' } }, required: ['pixelId'] } },
  { name: 'fb_generate_long_lived_token', description: 'Exchange a short-lived Meta user access token for a 60-day long-lived access token.', inputSchema: { type: 'object', properties: { appId: { type: 'string' }, appSecret: { type: 'string' }, shortLivedToken: { type: 'string' } }, required: ['appId', 'appSecret'] } },
  { name: 'fb_get_page_access_token', description: 'Generate / Retrieve a Page Access Token for a specific Facebook Page.', inputSchema: { type: 'object', properties: { pageId: { type: 'string' } }, required: ['pageId'] } },
  { name: 'fb_debug_token', description: 'Inspect and debug a Meta Access Token.', inputSchema: { type: 'object', properties: { inputToken: { type: 'string' } } } }
];

async function handleCall(name, args) {
  switch (name) {
    case 'fb_get_me': {
      const params = {};
      if (args.fields) params.fields = args.fields;
      return asTextResult(await graphApi('GET', 'me', { params }));
    }
    case 'fb_list_pages': {
      const params = { fields: args.fields || 'id,name,access_token,category,tasks' };
      return asTextResult(await graphApi('GET', 'me/accounts', { params }));
    }
    case 'fb_create_post': {
      const body = { message: args.message };
      if (args.link) body.link = args.link;
      return asTextResult(await graphApi('POST', `${args.pageId}/feed`, { body, customToken: args.pageToken }));
    }
    case 'fb_get_page_feed': {
      const params = { limit: args.limit || 25 };
      return asTextResult(await graphApi('GET', `${args.pageId}/feed`, { params, customToken: args.pageToken }));
    }
    case 'fb_get_post_comments': {
      const params = { limit: args.limit || 25 };
      return asTextResult(await graphApi('GET', `${args.postId}/comments`, { params }));
    }
    case 'fb_reply_comment': {
      const body = { message: args.message };
      return asTextResult(await graphApi('POST', `${args.targetId}/comments`, { body, customToken: args.accessToken }));
    }
    case 'fb_list_ad_accounts': {
      const params = { fields: args.fields || 'id,name,account_status,currency,balance' };
      return asTextResult(await graphApi('GET', 'me/adaccounts', { params }));
    }
    case 'fb_list_campaigns': {
      const cleanAccId = args.adAccountId.startsWith('act_') ? args.adAccountId : `act_${args.adAccountId}`;
      const params = { fields: 'id,name,status,objective,start_time,stop_time', limit: args.limit || 25 };
      return asTextResult(await graphApi('GET', `${cleanAccId}/campaigns`, { params }));
    }
    case 'fb_get_insights': {
      const params = { metric: args.metric };
      if (args.period) params.period = args.period;
      return asTextResult(await graphApi('GET', `${args.objectId}/insights`, { params }));
    }
    case 'fb_api': {
      const method = (args.method || 'GET').toUpperCase();
      return asTextResult(await graphApi(method, args.path, { params: args.params || {}, body: args.body || null, customToken: args.token || null }));
    }
    case 'fb_list_pixels': {
      const cleanAccId = args.adAccountId.startsWith('act_') ? args.adAccountId : `act_${args.adAccountId}`;
      const params = { fields: args.fields || 'id,name,code,creation_time,last_fired_time,is_created_by_business' };
      return asTextResult(await graphApi('GET', `${cleanAccId}/adspixels`, { params }));
    }
    case 'fb_create_pixel': {
      const cleanAccId = args.adAccountId.startsWith('act_') ? args.adAccountId : `act_${args.adAccountId}`;
      const params = { name: args.name };
      return asTextResult(await graphApi('POST', `${cleanAccId}/adspixels`, { params }));
    }
    case 'fb_update_pixel': {
      const params = {};
      if (args.name) params.name = args.name;
      return asTextResult(await graphApi('POST', args.pixelId, { params }));
    }
    case 'fb_delete_pixel': {
      return asTextResult(await graphApi('DELETE', args.pixelId));
    }
    case 'fb_generate_long_lived_token': {
      const params = { grant_type: 'fb_exchange_token', client_id: args.appId, client_secret: args.appSecret, fb_exchange_token: args.shortLivedToken || ACCESS_TOKEN };
      return asTextResult(await graphApi('GET', 'oauth/access_token', { params }));
    }
    case 'fb_get_page_access_token': {
      const params = { fields: 'id,name,access_token' };
      return asTextResult(await graphApi('GET', args.pageId, { params }));
    }
    case 'fb_debug_token': {
      const params = { input_token: args.inputToken || ACCESS_TOKEN };
      return asTextResult(await graphApi('GET', 'debug_token', { params }));
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

const server = new Server(
  { name: 'was-fb-mcp', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  try {
    return await handleCall(req.params.name, req.params.arguments || {});
  } catch (err) {
    return asError(err);
  }
});

await server.connect(new StdioServerTransport());
console.error(`was-fb-mcp v1.0.0 ready — ${tools.length} tools loaded`);
