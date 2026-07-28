# Facebook / Meta MCP Server (`was-fb-mcp`)

Shareable Facebook & Meta Graph API Model Context Protocol (MCP) server. Exposes 10 powerful tools to manage Facebook Pages, Posts, Comments, Ad Accounts, Campaigns, Insights, and execute any raw Graph API request from your favorite AI coding assistant (Claude Desktop, Cursor, Google Antigravity, VS Code, Zed).

## Prerequisites

- **Node.js 18+**
- A **Facebook / Meta Account** & Meta Developer App
- A Facebook **User Access Token** or **Page Access Token** (generated via [Meta for Developers Graph API Explorer](https://developers.facebook.com/tools/explorer/))

---

## Quick Start — 3 Steps

### Step 1 — Get credentials

1. Go to [Meta for Developers — Graph API Explorer](https://developers.facebook.com/tools/explorer/).
2. Select your App and click **Generate Access Token**.
3. Grant permissions such as `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `ads_read`, `read_insights`.

### Step 2 — Connect

Run the interactive setup command in your terminal:

```bash
npx -y github:was-member-keramat/was-fb-mcp auth
```

Paste your Access Token when prompted. Credentials will be securely saved locally to `~/.was-fb-mcp/config.json` with restricted file permissions (`0600`).

### Step 3 — Add to your AI Client

Add the following 4 lines to your AI tool's MCP configuration (`claude_desktop_config.json`, `mcp_config.json`, etc.):

```json
{
  "mcpServers": {
    "Facebook MCP": {
      "command": "npx",
      "args": ["-y", "github:was-member-keramat/was-fb-mcp"]
    }
  }
}
```

---

## What you can ask the AI

Here are example prompts you can use with your AI assistant:

- **Discovery:** *"List all Facebook Pages I manage."*
- **Content Creation:** *"Publish a new post to my Page with ID `100123456` saying 'Hello World!'."*
- **Feed & Comments:** *"Show the latest 10 posts on my Page feed and list the comments on the top post."*
- **Interaction:** *"Reply to comment ID `987654321` with 'Thank you for your feedback!'."*
- **Ads Management:** *"List my Meta Ad Accounts and show active campaigns in `act_123456789`."*
- **Analytics:** *"Get post engagement insights for Page `100123456`."*
- **Universal Access:** *"Use `fb_api` to GET `v19.0/me/photos`."*

---

## All Tools (10 Total)

| Category | Tool | Description |
|---|---|---|
| **Account** | `fb_get_me` | Get details of authenticated user / token owner |
| **Pages** | `fb_list_pages` | List Facebook Pages managed by user |
| **Feed & Posts** | `fb_create_post` | Publish a post on a Facebook Page feed |
| **Feed & Posts** | `fb_get_page_feed` | Fetch recent posts from a Page feed |
| **Comments** | `fb_get_post_comments` | Get comments on a Facebook post |
| **Comments** | `fb_reply_comment` | Post a comment or reply to a post/comment |
| **Meta Ads** | `fb_list_ad_accounts` | List accessible Meta Ad accounts |
| **Meta Ads** | `fb_list_campaigns` | List ad campaigns in an Ad Account |
| **Analytics** | `fb_get_insights` | Fetch metrics/insights for Page or Ad Account |
| **Universal** | `fb_api` | Execute raw GET/POST/DELETE Graph API calls |

---

## CLI Commands

```bash
# Connect / re-connect credentials
npx -y github:was-member-keramat/was-fb-mcp auth

# Check saved configuration status
npx -y github:was-member-keramat/was-fb-mcp status

# Delete saved credentials
npx -y github:was-member-keramat/was-fb-mcp logout

# View CLI usage help
npx -y github:was-member-keramat/was-fb-mcp help
```

---

## Multi-Account Setup

You can bypass the local config file by passing environment variables in your AI client config:

```json
{
  "mcpServers": {
    "Facebook Account A": {
      "command": "npx",
      "args": ["-y", "github:was-member-keramat/was-fb-mcp"],
      "env": {
        "FB_ACCESS_TOKEN": "EAAX..."
      }
    },
    "Facebook Account B": {
      "command": "npx",
      "args": ["-y", "github:was-member-keramat/was-fb-mcp"],
      "env": {
        "FB_ACCESS_TOKEN": "EAAY..."
      }
    }
  }
}
```

---

## Troubleshooting

### Windows PowerShell Script Execution Error
If you see:
`File C:\...\npx.ps1 cannot be loaded because running scripts is disabled`

Run in PowerShell:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### Force Update / Clear npx Cache on Windows
If `npx` is serving cached old versions:
```powershell
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\npm-cache" -ErrorAction SilentlyContinue
npm cache clean --force
```

### Graph API Error Response
If a tool call returns an error, the MCP decodes Meta Graph API's exact error structure (`code`, `error_subcode`, `fbtrace_id`) so the AI assistant can fix permissions or parameters immediately.

---

## License

[MIT](LICENSE) © 2026 WAS.
