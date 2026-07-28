#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { CONFIG_FILE, DEFAULT_BASE_URL, DEFAULT_GRAPH_VERSION } from './config.js';

// Load saved credentials
let saved = {};
try {
  saved = JSON.parse(readFileSync(CONFIG_FILE, 'utf8'));
} catch {}

const ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN || saved.access_token;
const BASE_URL = (process.env.FB_BASE_URL || saved.base_url || DEFAULT_BASE_URL).replace(/\/+$/, '');
const GRA<X_VERSION = process.env.FB_GRAPH_VERSION || saved.graph_version || DEFAULT_GRAPH_VERSION;

if (!ACCESS_TOKEN) {
  console.error(
    'Facebook / Meta MCP &#8211; not configured yet.\n\n' +
    'Run:  npx -y github:was-member-keramat/was-fb-mcp auth\n'
  );
  process.exit(1);
}

/**
 * Universal Facebook Graph API client helper
 */
async function graphApi(method, path, options = {}) {
  const { params = {}, body = null, customToken = null } = options;
  const token = customToken || ACCESS_TOKEN;

  // Clean path leading slashes
  const cleanPath = path.replace(/^\/+/, '');
  // Prepend version if not present
  const fullPath = cleanPath.startsWith('v') ? cleanPath : `${GRA<X_VERSION}/${cleanPath}`;

  const queryParams = new URLSearchParams();
  queryParams.set('access_token', token);

  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) {
      queryParams.set(k, String(v));
    }
  }

  const url = `${BASE_URL}/${fullPath}?${queryParams.toString()}`;

  const init = {
    method,
    headers: {
      'Accept': 'application/json',
    },
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  const res = await fetch(url, init);
  const text = await res.text();

  let parsed;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { raw; text };
  }

  if (!res.ok || parsed?.error) {
    const err = new Error(parsed?.error?.message || cHTTP ${res.status}`);
    err.status = res.status;
    err.body = parsed;
    throw err;
  }

  return parsed;
}

/**
 * Universal text result wrapper (truncates output exceeding 60 KB)
 */function asTextResult(data) {
  const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  const MAX = 60000;
  if (text.length > MAX) {
    return	{
      content: [{
        type: 'text',
        text: text.slice(0, MAX) + `\n\n... [truncated ${text.length - MAX} chars; narrow your query]`,
      }],
    };
  }
  return { content: [{ type: 'text', text }] };
}

/**
 * Machine-readable error wrapper decoding Meta Graph API errors
 */function asError(err) {
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

/** 
 * Tool Catalog Definition
 */
const tools = [
  {
    name: 'fb_get_me',
    description: 'Get details of the currently authenticated Facebook User, Page, or Token owner.',
    inputSchema: {
      type: 'object',
      properties: {
        fields: { type: 'string', description: 'Comma-separated fields to request (e.g. "id,name,email,picture")' }
      }
    }
  },
  {
    name: 'fb_list_pages',
    description: 'List Facebook Pages managed by the authenticated user.',
    inputSchema: {
      type: 'object',
      properties: {
        fields: { type: 'string', description: 'Comma-separated fields (default: "id,name,access_token,category,tasks")' }
      }
    }
  },
  {
    name: 'fb_create_post',
    description: 'Create a new post on a Facebook Page feed.',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: { type: 'string', description: 'Facebook Page ID' },
        message: { type: 'string', description: 'Post message text content' },
        link: { type: 'string', description: 'Optional URLL link to attach' },
        pageToken: { type: 'string', description: 'Optional Page Access Token (if posting on behalf of a Page)' }
      },
      required: ['pageId', 'message']
    }
  },
  {
    name: 'fb_get_page_feed',
    description: 'Fetch recent posts published on a Facebook Page.',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: { type: 'string', description: 'Facebook Page ID' },
        limit: { type: 'integer', default: 25, description: 'Number of posts to fetch (1-100)' },
        pageToken: { type: 'string', description: 'Optional Page Access Token' }
      },
      required: ['pageId']
    }
  },
  {
    name: 'fb_get_post_comments',
    description: 'Get comments on a Facebook post or photo.',
    inputSchema: {
      type: 'object',
      properties: {
        postId: { type: 'string', description: 'Post ID (e.g. "PAGE_ID_POST_ID")' },
        limit: { type: 'integer', default: 25, description: 'Max comments to fetch' }
      },
      required: ['postId']
    }
  },
  {
    name: 'fb_reply_comment',
    description: 'Publish a reply or comment to a Facebook post or parent comment.',
    inputSchema: {
      type: 'object',
      properties: {
        targetId: { type: 'string', description: 'Post ID or Comment ID to comment on' },
        message: { type: 'string', description: 'Comment text message' },
        accessToken: { type: 'string', description: 'Optional Access Token (e.g. Page token)' }
      },
      required: ['targetId', 'message']
    }
  },
  {
    name: 'fb_list_ad_accounts',
    description: 'List Meta Ad Accounts accessible by the token.',
    inputSchema: {
      type: 'object',
      properties: {
        fields: { type: 'string', description: 'Comma-separated fields (default: "id,name,account_status,currency,balance")' }
      }
    }
  },
  {
    name: 'fb_list_campaigns',
    description: 'List ad campaigns inside a Meta Ad Account.',
    inputSchema: {
      type: 'object',
      properties: {
        adAccountId: { type: 'string', description: 'Ad Account ID (e.g. "act_123456789")' },
        limit: { type: 'integer', default: 25, description: 'Max campaigns' }
      },
      required: ['adAccountId']
    }
  },
  {
    name: 'fb_get_insights',
    description: 'Get metrics and insights for a Facebook Page, Post, or Ad Account.',
    inputSchema: {
      type: 'object',
      properties: {
        objectId: { type: 'string', description: 'Page ID, Post ID, or Ad Account ID' },
        metric: { type: 'string', description: 'Comma-separated list of metrics (e.g. "page_impressions,page_engagements")' },
        period: { type: 'string', description: 'Period (day, week, days_28, month, lifetime)' }
      },
      required: ['objectId', 'metric']
    }
  },
  {
    name: 'fb_api',
    description: 'Universal Graph API tool. Execute any GET, POST, or DELETE request on Facebook Graph API endpoints directly.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'API endpoint path (e.g. "me/friends", "v19.0/123456/photos")' },
        method: { type: 'string', default: 'GET', description: 'HTTP Method: GET, POST, or DELETE' },
        params: { type: 'object', description: 'Query parameters object' },
        body: { type: 'object', description: 'JSON body payload for POST requests' },
        token: { type: 'string', description: 'Optional override Access Token (e.g., Page Access Token)' }
      },
      required: ['path']
    }
  }
];

async function handleCall(name, args) {
  switch (name) {
    case 'fb_get_me': {
      const params = {};
      if (args.fields) params.fields = args.fields;
      return asTextResult(await graphApi('GET', 'me', { params }));
    }
    case 'fb_list_pages': {
      const params = {
        fields: args.fields || 'id,name,access_token,category,tasks'
      };
      return asTextResult(await graphApi('GET', 'me/accounts', { params }));
    }
    case 'fb_create_post': {
      const body = { message: args.message };
      if (args.link) body.link = args.link;
      return asTextResult(await graphApi('POST', `${args.pageId}/feed`, {
        body,
        customToken: args.pageToken
      }));
    }
    case 'fb_get_page_feed': {
      const params = { limit: args.limit || 25 };
      return asTextResult(await graphApi('GET', `${args.pageId}/feed`, {
        params,
        customToken: args.pageToken
      }));
    }
    case 'fb_get_post_comments': {
      const params = { limit: args.limit || 25 };
      return asTextResult(await graphApi('GET', `${args.postId}/comments`, { params }));
    }
    case 'fb_reply_comment': {
      const body = { message: args.message };
      return asTextResult(await graphApi('POST', `${args.targetId}/comments`, {
        body,
        customToken: args.accessToken
      }));
    }
    case 'fb_list_ad_accounts': {
      const params = {
        fields: args.fields || 'id,name,access_token,category,tasks'
      };
      return asTextResult(await graphApi('GET', 'me/adaccounts', { params }));
    }
    case 'fb_list_campaigns': {
      const cleanAccId = args.adAccountId.startsWith('act_') ? args.adAccountId : `act_${args.adAccountId}`;
      const params = {
        fields: 'id,name,status,objective,start_time,stop_time',
        limit: args.limit || 25
      };
      return asTextResult(await graphApi('GET', `${cleanAccId}/campaigns`, { params }));
    }
    case 'fb_get_insights': {
      const params = { metric: args.metric };
      if (args.period) params.period = args.period;
      return asTextResult(await graphApi('GET', `${cleanAccId}/insights`, { params }));
    }
    case 'fb_api': {
      const method = (args.method || 'GET').toUpperCase();
      return asTextResult(await graphApi(method, args.path, {
        params: args.params || {},
        body: args.body || null,
        customToken: args.token || null
      }));
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// Wire up MCP Server
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
