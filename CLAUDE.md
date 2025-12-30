# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WireGuard Router Configuration Tool (wg-mt_v2) - A client-side web application for generating WireGuard VPN configurations for multiple router/OS platforms with IPv64.net DynDNS integration.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript (no framework), TweetNaCl.js (X25519 crypto), qrcode.js, JSZip, FileSaver.js

**Architecture:** Single-page app running entirely in browser with localStorage persistence. No server required.

## Development

No build system - open index.html directly in browser. All processing is client-side.

## Architecture

### Core Modules
- `crypto.js` - X25519 key generation via TweetNaCl, PSK generation, Base64 encoding
- `ip-manager.js` - CIDR parser, IP pool manager, auto-assign/release IPs, conflict detection
- `config-generator.js` - Builds WireGuard configs from data models, handles AllowedIPs calculation
- `profile-manager.js` - localStorage CRUD, JSON profile schema, auto-save

### Export System
Each platform exporter in `js/export/` implements the same interface but outputs platform-specific format:
- Standard .conf (wg-quick compatible)
- MikroTik .rsc (RouterOS CLI commands)
- VyOS (configuration commands)
- Fritz!Box .conf
- EdgeRouter (EdgeOS CLI)
- GL.iNet .conf
- OPNsense/Teltonika (setup guides, no direct import)

### Data Models
```javascript
// Server/Interface
{ name, privateKey, publicKey, listenPort, addresses[], dns[], mtu, preSharedKey?, postUp?, postDown? }

// Peer/Client
{ name, privateKey, publicKey, preSharedKey?, allowedIPs[], endpoint, persistentKeepalive, dns[] }

// Profile (localStorage)
{ id, name, created, modified, version, server{}, clients[], ipPool{}, dyndns{}, settings{} }
```

### Subnet Auto-Sizing
User inputs connection count → tool calculates optimal CIDR:
- 1-6 → /29 (6 usable), 7-14 → /28 (14), 15-30 → /27 (30), 31-62 → /26 (62), etc.
- .1 always reserved for server

## Key Defaults
- Network: 10.50.0.0/24
- MTU: 1420
- Port: 51820
- Keepalive: 25s
- PSK: enabled by default

## Libraries (vendor in /lib/)
- TweetNaCl.js - https://tweetnacl.js.org/
- qrcode.js - https://davidshimjs.github.io/qrcodejs/
- JSZip - https://stuk.github.io/jszip/
- FileSaver.js - https://github.com/eligrey/FileSaver.js

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
