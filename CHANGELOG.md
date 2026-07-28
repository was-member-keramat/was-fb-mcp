# Changelog

All notable changes to `was-fb-mcp` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.5] - 2026-07-28

### Fixed

- Re-published clean, verified `server.js` build without duplicate string tokens.

## [1.0.4] - 2026-07-28

### Fixed

- Fixed broken JSON formatting (`"type: "git"`) in `package.json`.

## [1.0.3] - 2026-07-28

### Fixed

- Fixed `const GRAPH_VERSION` syntax typo in `server.js`.

## [1.0.2] - 2026-07-28

### Fixed

- Fixed Windows libuv assertion error (`Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)`) on CLI commands by replacing `process.exit(0)` with `process.exitCode = 0`.

## [1.0.1] - 2026-07-28

### Fixed

- Fixed Node 24+ ESM loader import error by switching `pathToURL` to `pathToFileURL`.

## [1.0.0] - 2026-07-28

### Added

- Initial release of `was-fb-mcp` — Shareable Facebook & Meta Graph API MCP Server.
- Interactive authentication CLI command (`npx -y github:was-member-keramat/was-fb-mcp auth`).
- 10 Facebook Graph API tools (`fb_get_me`, `fb_list_pages`, `fb_create_post`, `fb_get_page_feed`, `fb_get_post_comments`, `fb_reply_comment`, `fb_list_ad_accounts`, `fb_list_campaigns`, `fb_get_insights`, `fb_api`).
- Standard stdio MCP transport for Claude, Codex, Antigravity, Cursor, VS Code, Zed.
