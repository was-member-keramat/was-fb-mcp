# Changelog

All notable changes to `was-fb-mcp` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0 — 2026-07-28

### New Features

- **Initial release of `was-fb-mcp`** — Shareable Facebook & Meta Graph API MCP server.
- Interactive authentication CLI (`auth`, `status`, `logout`, `help`).
- Cross-platform stdio transport compatible with Claude Desktop, Cursor, Google Antigravity, VS Code, and Zed.
- Local secure credential storage (`~/.was-fb-mcp/config.json` at mode `0600`) with environment variable overrides (`FB_ACCESS_TOKEN`).
- **Tools Catalog (10 tools):**
  - `fb_get_me`: Fetch profile / token owner info.
  - `fb_list_pages`: List Facebook Pages managed by user.
  - `fb_create_post`: Publish post to a Facebook Page.
  - `fb_get_page_feed`: Fetch recent Page feed posts.
  - `fb_get_post_comments`: Fetch comments on a post.
  - `fb_reply_comment`: Comment/reply to a post or comment.
  - `fb_list_ad_accounts`: List Meta Ad Accounts.
  - `fb_list_campaigns`: List ad campaigns in an Ad Account.
  - `fb_get_insights`: Fetch performance metrics and insights.
  - `fb_api`: Universal escape hatch tool to invoke any Facebook Graph API endpoint.
