# WireGuard Router Configuration Tool

A powerful, client-side web application for generating WireGuard VPN configurations for multiple router/OS platforms. No server required - runs entirely in your browser with localStorage persistence.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![JavaScript](https://img.shields.io/badge/javascript-vanilla-yellow.svg)
![No Build](https://img.shields.io/badge/build-none-green.svg)

## Features

### 🔐 Security First
- X25519 key generation using TweetNaCl.js
- Pre-Shared Key (PSK) support
- Client-side only - no data leaves your browser
- No external dependencies at runtime

### 🌐 Multi-Platform Support
Generate configurations for:
- **WireGuard Standard** (.conf) - Linux, Windows, macOS, Android, iOS
- **MikroTik RouterOS** (.rsc) - Complete CLI scripts with firewall
- **VyOS** - Configuration commands with NAT
- **Fritz!Box** (.conf) - AVM router support
- **OPNsense** - Step-by-step guide
- **Ubiquiti EdgeRouter** - EdgeOS commands
- **GL.iNet** - Travel router configs
- **Teltonika RUT** - Industrial router guide

### 🚀 Core Capabilities
- **Auto-Subnet Calculation** - Enter connection count, get optimal CIDR
- **IP Pool Management** - Automatic IP assignment with conflict detection
- **Bulk Client Generation** - Create multiple clients with naming patterns
- **QR Code Generation** - For easy mobile client setup
- **Site-to-Site VPN** - Configure tunnels between networks
- **Profile Management** - Save, load, import, export configurations
- **Config Validation** - Check for errors before export
- **ZIP Export** - Download all configs organized in folders

### 🎨 User Experience
- Dark/Light theme support
- Responsive mobile design
- Auto-save to localStorage
- Multi-language ready (EN/DE)
- Keyboard shortcuts

## Quick Start

### 1. Download Libraries
```bash
cd lib/
bash DOWNLOAD.sh
```

Or manually download:
- [TweetNaCl.js](https://cdn.jsdelivr.net/npm/tweetnacl@1.0.3/nacl-fast.min.js) → `lib/tweetnacl.min.js`
- [QRCode.js](https://cdn.jsdelivr.net/npm/davidshimjs-qrcodejs@0.0.2/qrcode.min.js) → `lib/qrcode.min.js`
- [JSZip](https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js) → `lib/jszip.min.js`
- [FileSaver.js](https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js) → `lib/FileSaver.min.js`

### 2. Open in Browser
```bash
open index.html
# or
firefox index.html
# or
chromium index.html
```

### 3. Generate Configuration
1. **Server Tab**: Generate server keys, configure network
2. **Clients Tab**: Add clients (or bulk generate)
3. **Export Tab**: Select platform and download

## Usage Guide

### Road Warrior (Client-to-Server)

**Server Configuration:**
1. Navigate to **Server** tab
2. Click **Generate Keys**
3. Configure:
   - Base Network: `10.50.0.0`
   - Connections: `30` (tool calculates `/27` subnet)
   - Endpoint: Your public IP or domain
   - Enable DynDNS: Optional (IPv64.net support)

**Add Clients:**
1. Navigate to **Clients** tab
2. Click **Add Client** or **Bulk Generate**
3. For bulk: Enter count and pattern like `User-{n}`

**Export:**
1. Navigate to **Export** tab
2. Select platform (e.g., MikroTik RouterOS)
3. Choose export type:
   - Server Only
   - All Clients
   - Complete Setup
4. Download or Download as ZIP

### Site-to-Site VPN

1. Navigate to **Site-to-Site** tab
2. Configure **Site A**:
   - Name: Main Office
   - LAN Network: `192.168.1.0/24`
   - Tunnel IP: `10.99.0.1`
   - Endpoint: `office-a.example.com`
   - Generate Keys
3. Configure **Site B**:
   - Name: Branch Office
   - LAN Network: `192.168.2.0/24`
   - Tunnel IP: `10.99.0.2`
   - Endpoint: `office-b.example.com`
   - Generate Keys
4. Click **Generate Configurations**
5. Download both configs

## Configuration Defaults

| Parameter | Default | Notes |
|-----------|---------|-------|
| Network | 10.50.0.0/24 | Auto-calculated based on client count |
| MTU | 1420 | Optimal for most networks |
| Listen Port | 51820 | Standard WireGuard port |
| Keepalive | 25 seconds | Good for NAT traversal |
| DNS | 1.1.1.1, 1.0.0.1 | Cloudflare DNS |
| PSK | Enabled | Enhanced security |
| NAT | Enabled | For internet access through VPN |

## Auto-Subnet Sizing

The tool automatically calculates optimal subnet based on connection count:

| Connections | Subnet | Usable IPs |
|-------------|--------|------------|
| 1-6 | /29 | 6 |
| 7-14 | /28 | 14 |
| 15-30 | /27 | 30 |
| 31-62 | /26 | 62 |
| 63-126 | /25 | 126 |
| 127-254 | /24 | 254 |

Server always gets `.1` address.

## Platform-Specific Notes

### MikroTik RouterOS
- Includes firewall rules
- DynDNS scheduler script
- NAT masquerade configuration
- Import via: Terminal → paste script

### VyOS
- Full configuration commands
- Firewall zone setup
- DynDNS service configuration
- Apply with: `configure` → paste → `commit` → `save`

### Fritz!Box
- Standard .conf format
- DynDNS setup guide for WebUI
- Import via: Internet → Freigaben → WireGuard

### OPNsense
- Step-by-step WebUI guide
- Firewall rule examples
- DynDNS ddclient configuration

### Teltonika RUT
- Manual configuration required (no import)
- WebUI navigation steps
- Industrial LTE router support

## IPv64.net DynDNS Integration

1. Sign up at [IPv64.net](https://ipv64.net)
2. Create domain (e.g., `myvpn.ipv64.net`)
3. Get update key
4. In tool:
   - Server tab → Enable DynDNS
   - Enter domain and API key
5. Export includes platform-specific update scripts

## Profile Management

**Save Profile:**
- Current config auto-saves to localStorage
- Create named profiles: Profiles → New Profile

**Import Profile:**
- Profiles → Import → Select `.json` file

**Export Profile:**
- Profiles → Click profile → Export button

**Switch Profile:**
- Profiles → Click profile card

## Validation

Before exporting, validate your configuration:
1. Navigate to **Settings** tab
2. Click **Validate Configuration**
3. Fix any reported errors

Checks for:
- Valid IP addresses and CIDR notation
- Port ranges (1-65535)
- WireGuard key formats
- Duplicate IPs or keys
- MTU range (1280-1500)
- DynDNS configuration

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` | Save profile (browser save dialog) |
| `Ctrl+N` | Add new client |
| `Ctrl+E` | Switch to Export view |
| `Escape` | Close modals |

## Tech Stack

- **Frontend**: Vanilla JavaScript (no framework)
- **Crypto**: TweetNaCl.js (X25519, PSK generation)
- **QR Codes**: qrcode.js
- **ZIP**: JSZip
- **Storage**: localStorage
- **Styling**: Custom CSS with CSS Variables

No build step required!

## Browser Compatibility

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers (iOS Safari, Chrome Android)

## Architecture

```
├── index.html              # Main UI
├── css/
│   ├── style.css          # Core styles
│   └── modal.css          # Modal dialogs
├── js/
│   ├── app.js             # Main application
│   ├── crypto.js          # Key generation
│   ├── ip-manager.js      # IP pool & CIDR
│   ├── config-generator.js # WireGuard configs
│   ├── profile-manager.js  # localStorage CRUD
│   ├── profile-ui.js      # Profile UI
│   ├── qr-generator.js    # QR code display
│   ├── site-to-site.js    # S2S configuration
│   ├── validation.js      # Config validation
│   ├── dyndns/
│   │   └── ipv64.js       # DynDNS support
│   └── export/
│       ├── standard.js    # Standard WireGuard
│       ├── mikrotik.js    # MikroTik RouterOS
│       ├── vyos.js        # VyOS
│       ├── fritzbox.js    # Fritz!Box
│       ├── opnsense.js    # OPNsense
│       ├── edgerouter.js  # EdgeRouter
│       ├── glinet.js      # GL.iNet
│       └── teltonika.js   # Teltonika RUT
└── lib/                   # External libraries
```

## Data Models

**Server:**
```javascript
{
  name: string,
  privateKey: string,
  publicKey: string,
  listenPort: number,
  addresses: string[],
  dns: string[],
  mtu: number,
  endpoint: string,
  enablePSK: boolean,
  enableNAT: boolean
}
```

**Client:**
```javascript
{
  id: string,
  name: string,
  privateKey: string,
  publicKey: string,
  preSharedKey: string,
  address: string,
  allowedIPs: string[],
  dns: string[],
  persistentKeepalive: number
}
```

**Profile (localStorage):**
```javascript
{
  id: string,
  name: string,
  created: ISO timestamp,
  modified: ISO timestamp,
  version: string,
  server: {},
  clients: [],
  ipPool: {},
  dyndns: {},
  settings: {}
}
```

## Security Considerations

- All crypto operations client-side
- Private keys stored in localStorage (browser-encrypted)
- API keys stored in localStorage (warn user)
- No external network calls except library CDN
- Consider exporting profiles to encrypted storage

## Troubleshooting

**QR Codes not generating:**
- Ensure `lib/qrcode.min.js` is downloaded
- Check browser console for errors

**ZIP export fails:**
- Ensure `lib/jszip.min.js` and `lib/FileSaver.min.js` are downloaded

**Keys not generating:**
- Ensure `lib/tweetnacl.min.js` is downloaded
- Check for JavaScript errors in console

**localStorage full:**
- Browser limit typically 5-10MB
- Export and delete old profiles
- Clear browser cache

## Contributing

This is a standalone tool designed to run without a build process. To contribute:

1. Fork repository
2. Make changes to HTML/CSS/JS directly
3. Test in browser (no build needed)
4. Submit pull request

## License

MIT License - See LICENSE file

## Credits

- WireGuard® is a registered trademark of Jason A. Donenfeld
- Built with TweetNaCl.js, QRCode.js, JSZip, FileSaver.js
- IPv64.net integration for DynDNS support

## Support

- Documentation: See TODO.md for detailed features
- Issues: Report bugs via GitHub Issues
- No official support - community maintained

---

**Made with Claude Code** 🤖
