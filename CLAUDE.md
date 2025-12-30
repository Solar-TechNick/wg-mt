# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WireGuard Router Configuration Tool (wg-mt_v2) - A client-side web application for generating WireGuard VPN configurations for multiple router/OS platforms with IPv64.net DynDNS integration.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript (no framework), TweetNaCl.js (X25519 crypto), qrcode.js, JSZip, FileSaver.js

**Architecture:** Single-page app running entirely in browser with localStorage persistence. No server required.

## Project Structure (Planned)

```
wireguard-config-tool/
├── index.html
├── css/
│   ├── style.css
│   └── themes/
├── js/
│   ├── app.js              # Main application
│   ├── crypto.js           # Key generation (TweetNaCl)
│   ├── config-generator.js # WireGuard config builder
│   ├── qr-generator.js     # QR code generation
│   ├── ip-manager.js       # CIDR/subnet management
│   ├── profile-manager.js  # localStorage CRUD
│   ├── export/             # Platform-specific exporters
│   │   ├── wireguard-standard.js
│   │   ├── mikrotik.js
│   │   ├── vyos.js
│   │   ├── opnsense.js
│   │   ├── fritzbox.js
│   │   ├── teltonika.js
│   │   ├── edgerouter.js
│   │   └── glinet.js
│   └── dyndns/
│       └── ipv64.js
└── lib/                    # External libraries (vendored)
```

## Key Technical Details

- **Default network:** 10.50.0.0/24, MTU 1420, port 51820, keepalive 25s
- **Automatic subnet sizing:** User inputs connection count → tool calculates optimal CIDR
- **Export formats:** Standard .conf, MikroTik .rsc, VyOS commands, OPNsense guide, Fritz!Box .conf, Teltonika guide, EdgeRouter commands, GL.iNet .conf
- **Multi-language:** German (primary), English

## Development

No build system - open index.html directly in browser. All processing is client-side.

---

## Tone and Style

- Be concise, direct, to the point
- Answer in fewer than 4 lines unless detail requested
- Minimize preamble/postamble
- One word answers when appropriate
- No emojis unless requested

## Code Style

- DO NOT ADD COMMENTS unless asked
- Mimic existing code conventions
- Check for existing libraries before adding new ones
- Never expose/log secrets

## Task Management

Use TodoWrite tool frequently to track progress and break down complex tasks. Mark todos completed immediately when done.

## Doing Tasks

- Read files before modifying them
- Use search tools extensively
- Run lint/typecheck after completing tasks (ask for commands if unknown)
- Never commit unless explicitly asked
