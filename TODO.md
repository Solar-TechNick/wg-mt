# WireGuard Router Configuration Tool - Detailed TODO List

## Project Overview
A web-based WireGuard configuration generator that runs locally without a web server, supports multiple router/OS platforms, and includes DynDNS integration with IPv64.net.

---

## Phase 1: Project Foundation & Core Architecture

### 1.1 Project Setup
- [ ] Create project folder structure
  ```
  wireguard-config-tool/
  ├── index.html
  ├── css/
  │   ├── style.css
  │   └── themes/
  ├── js/
  │   ├── app.js
  │   ├── crypto.js
  │   ├── config-generator.js
  │   ├── qr-generator.js
  │   ├── ip-manager.js
  │   ├── profile-manager.js
  │   ├── export/
  │   │   ├── wireguard-standard.js
  │   │   ├── mikrotik.js
  │   │   ├── vyos.js
  │   │   ├── opnsense.js
  │   │   ├── fritzbox.js
  │   │   └── teltonika.js
  │   └── dyndns/
  │       └── ipv64.js
  ├── lib/
  │   ├── tweetnacl.min.js (for X25519 key generation)
  │   └── qrcode.min.js
  ├── profiles/
  │   └── (JSON profile storage via localStorage)
  └── assets/
      └── icons/
  ```
- [ ] Initialize with basic HTML5 structure
- [ ] Set up CSS framework (consider TailwindCSS via CDN or custom CSS)
- [ ] Create responsive layout for desktop and mobile

### 1.2 Cryptographic Foundation
- [ ] Integrate TweetNaCl.js for X25519 key pair generation
- [ ] Implement Curve25519 key generation functions
- [ ] Create secure random number generation for Pre-Shared Keys
- [ ] Build key validation functions
- [ ] Implement Base64 encoding/decoding for keys

---

## Phase 2: Core WireGuard Configuration Engine

### 2.1 Data Models
- [ ] Define Server/Interface configuration model:
  ```javascript
  {
    name: string,
    privateKey: string,
    publicKey: string,
    listenPort: number,
    addresses: string[], // IPv4 and IPv6
    dns: string[],
    mtu: number,
    preSharedKey: string (optional),
    postUp: string (optional),
    postDown: string (optional)
  }
  ```
- [ ] Define Peer/Client configuration model:
  ```javascript
  {
    name: string,
    privateKey: string,
    publicKey: string,
    preSharedKey: string (optional),
    allowedIPs: string[],
    endpoint: string,
    persistentKeepalive: number,
    dns: string[]
  }
  ```
- [ ] Define Site-to-Site tunnel model
- [ ] Define IP Pool configuration model

### 2.2 IP Address Management
- [ ] Implement CIDR notation parser
- [ ] Create IP pool manager class
- [ ] **Automatic subnet calculator:**
  - User inputs: Base network (e.g., 10.50.0.0) + Number of connections needed
  - Tool calculates optimal subnet mask:
    ```
    Connections → Subnet Mask → Usable IPs
    1-6        → /29         → 6
    7-14       → /28         → 14
    15-30      → /27         → 30
    31-62      → /26         → 62
    63-126     → /25         → 126
    127-254    → /24         → 254
    255-510    → /23         → 510
    511-1022   → /22         → 1022
    ```
  - Show calculated subnet with visual feedback
  - Warn if requested connections exceed /22 (recommend splitting)
- [ ] Auto-assign IPs from defined pool
- [ ] Track assigned/available IPs
- [ ] Support both IPv4 and IPv6 pools
- [ ] Prevent IP conflicts
- [ ] Reserve gateway IP (.1 for server)
- [ ] Implement IP release on peer deletion
- [ ] Show IP pool utilization (used/available)

### 2.3 Configuration Generation Core
- [ ] Build standard WireGuard config parser/generator
- [ ] Create server config generator
- [ ] Create client config generator
- [ ] Support multiple peers per server
- [ ] Generate matching peer entries for server config
- [ ] Handle AllowedIPs calculation (full tunnel vs split tunnel)
- [ ] Support Pre-Shared Key (PSK) generation and inclusion

---

## Phase 3: VPN Topology Support

### 3.1 Client-to-Server (Road Warrior)
- [ ] Single server with multiple clients
- [ ] Full tunnel mode (0.0.0.0/0, ::/0)
- [ ] Split tunnel mode (specific networks only)
- [ ] DNS configuration for clients
- [ ] Auto-generate server peer list from clients

### 3.2 Site-to-Site (S2S)
- [ ] Define Site A and Site B configurations
- [ ] Local network CIDR for each site
- [ ] Bi-directional AllowedIPs configuration
- [ ] Support for multiple remote networks per site
- [ ] Endpoint configuration for both sides
- [ ] Firewall/routing hints in output

### 3.3 Hub-and-Spoke Topology
- [ ] Central hub server configuration
- [ ] Multiple spoke site configurations
- [ ] Optional spoke-to-spoke routing via hub
- [ ] AllowedIPs aggregation at hub

---

## Phase 4: Router/OS-Specific Export Modules

### 4.1 Standard WireGuard Client (.conf)
- [ ] Generate standard wg-quick compatible config
- [ ] Support for Linux, Windows, macOS, Android, iOS
- [ ] Include DNS settings
- [ ] Include MTU settings
- [ ] Export as downloadable .conf file

### 4.2 MikroTik RouterOS Export
- [ ] Generate RouterOS CLI commands:
  ```routeros
  /interface wireguard add name=wg0 listen-port=51820 private-key="..."
  /interface wireguard peers add interface=wg0 public-key="..." allowed-address=...
  /ip address add address=10.0.0.1/24 interface=wg0
  /ip firewall filter add chain=input protocol=udp dst-port=51820 action=accept
  ```
- [ ] Support both server and client roles
- [ ] Include firewall rules
- [ ] Include NAT/masquerade rules if needed
- [ ] Generate DynDNS scheduler script for IPv64.net:
  ```routeros
  /system scheduler add name=ipv64-update interval=1h on-event={
    /tool fetch url="https://ipv64.net/nic/update?key=XXX&domain=XXX" keep-result=no
  }
  ```
- [ ] Export as .rsc script file

### 4.3 VyOS Export
- [ ] Generate VyOS CLI configuration:
  ```
  set interfaces wireguard wg0 address '10.0.0.1/24'
  set interfaces wireguard wg0 port '51820'
  set interfaces wireguard wg0 private-key 'XXX'
  set interfaces wireguard wg0 peer XXX allowed-ips '10.0.0.2/32'
  set interfaces wireguard wg0 peer XXX public-key 'XXX'
  ```
- [ ] Include firewall zone configuration
- [ ] Include DynDNS configuration for IPv64.net:
  ```
  set service dns dynamic interface eth0 service ipv64 host-name 'XXX.ipv64.net'
  set service dns dynamic interface eth0 service ipv64 login 'nobody'
  set service dns dynamic interface eth0 service ipv64 password 'UPDATE-KEY'
  set service dns dynamic interface eth0 service ipv64 protocol 'dyndns2'
  set service dns dynamic interface eth0 service ipv64 server 'ipv64.net'
  ```
- [ ] Export as VyOS config commands text file

### 4.4 OPNsense Export
- [ ] Generate configuration for OPNsense WireGuard plugin
- [ ] Include interface settings
- [ ] Include peer configuration
- [ ] Generate firewall rules
- [ ] Include DynDNS settings (os-ddclient):
  ```
  Service Type: Custom
  Protocol: DynDns2
  Server: ipv64.net
  User: none
  Password: UPDATE-KEY
  Hostname: XXX.ipv64.net
  Check ip method: ipify-ipv{4,6}
  Force SSL: Yes
  ```
- [ ] Export as configuration guide/script

### 4.5 AVM Fritz!Box Export
- [ ] Generate Fritz!Box compatible .conf file
- [ ] Standard WireGuard format with Fritz!Box specifics:
  ```ini
  [Interface]
  PrivateKey = XXX
  ListenPort = 51820
  Address = 10.0.0.1/24
  
  [Peer]
  PublicKey = XXX
  PresharedKey = XXX
  AllowedIPs = 10.0.0.2/32
  PersistentKeepalive = 25
  ```
- [ ] Include DynDNS configuration instructions:
  ```
  Menu: Internet => Freigaben => DynDNS
  DynDNS-Anbieter: Benutzerdefiniert
  Update URL: https://ipv64.net/nic/update?key=XXX&ip=<ipaddr>&ip6=<ip6addr>
  Domainname: XXX.ipv64.net
  Benutzername: none (not empty)
  Kennwort: none (not empty)
  ```
- [ ] Handle Fritz!Box specific limitations
- [ ] Export as downloadable .conf file

### 4.6 Teltonika RUT Export
- [ ] Generate Teltonika RUTOS configuration
- [ ] WireGuard interface setup guide:
  ```
  Menu: Services → VPN → WireGuard
  - Add new WireGuard instance
  - Set Private Key
  - Set Listen Port
  - Set IP Address
  ```
- [ ] Peer configuration format
- [ ] Include instructions for WebUI setup
- [ ] Note: Teltonika does NOT support config file import - manual setup required
- [ ] Export as step-by-step configuration guide

### 4.7 Ubiquiti EdgeRouter Export
- [ ] Generate EdgeOS CLI commands:
  ```
  configure
  set interfaces wireguard wg0 address 10.50.0.1/24
  set interfaces wireguard wg0 listen-port 51820
  set interfaces wireguard wg0 private-key YOUR_PRIVATE_KEY
  set interfaces wireguard wg0 peer YOUR_PEER_PUBLIC_KEY allowed-ips 10.50.0.2/32
  set interfaces wireguard wg0 peer YOUR_PEER_PUBLIC_KEY endpoint hostname:51820
  set interfaces wireguard wg0 route-allowed-ips true
  commit
  save
  ```
- [ ] Include firewall rules for WireGuard
- [ ] Include NAT masquerade rules
- [ ] DynDNS integration (EdgeOS ddclient)
- [ ] Export as .txt file with CLI commands

### 4.8 GL.iNet Router Export
- [ ] Generate GL.iNet compatible configuration
- [ ] Standard WireGuard .conf format (GL.iNet supports import)
- [ ] Include GL.iNet specific settings:
  - MTU optimization for travel routers
  - Auto-reconnect settings
- [ ] GUI setup instructions for GL.iNet Admin Panel:
  ```
  Menu: VPN → WireGuard Client → Set Up WireGuard Manually
  - Paste configuration or upload .conf file
  ```
- [ ] Support for GL.iNet specific features:
  - Kill Switch option
  - Block Non-VPN Traffic option
- [ ] Export as .conf file + setup guide

---

## Phase 5: User Interface Development

### 5.1 Main Dashboard
- [ ] Clean, modern UI design
- [ ] Dark/Light theme toggle
- [ ] Navigation sidebar or tabs:
  - Server Configuration
  - Client Management
  - Site-to-Site
  - Profiles
  - Settings
  - Export

### 5.2 Server Configuration Panel
- [ ] Server name input
- [ ] Listen port configuration (default: 51820)
- [ ] **Network Configuration Section:**
  - Base network input (default: 10.50.0.0)
  - Number of connections input (dropdown or number field)
  - Auto-calculated subnet display (e.g., "10.50.0.0/26 - 62 usable IPs")
  - Visual subnet utilization bar
  - Manual override option (advanced users can set custom CIDR)
  - Server IP assignment (.1 reserved for server)
- [ ] DNS server settings (multiple, add/remove)
- [ ] MTU configuration (default: 1420)
- [ ] Auto-generate keys button
- [ ] Manual key input option (collapsible/advanced)
- [ ] Pre-Shared Key toggle and generation (default: enabled)
- [ ] DynDNS/Endpoint hostname input
- [ ] Masquerade/NAT toggle (default: enabled)
- [ ] KeepAlive default setting (default: 25s)
- [ ] PostUp/PostDown script preview (auto-generated based on settings)

### 5.3 Client Management Panel
- [ ] Client list view with cards/table
- [ ] Add new client button
- [ ] Client configuration form:
  - Client name/description
  - Auto-assign IP from pool (checkbox)
  - Manual IP override input
  - AllowedIPs selector:
    - Full tunnel (0.0.0.0/0)
    - Split tunnel (custom networks)
  - Persistent Keepalive (seconds)
  - DNS override option
- [ ] Bulk client generation dialog:
  - Number of clients to generate
  - Naming pattern input (e.g., "Client-{n}", "User-{n}")
  - Auto IP assignment confirmation
  - Preview before generation
- [ ] Client actions dropdown/buttons:
  - Edit configuration
  - Delete (with confirmation)
  - Regenerate Keys
  - Show QR Code
  - Export Config
  - Copy Public Key
- [ ] Search/filter clients
- [ ] Sort by name/IP/date

### 5.4 Site-to-Site Configuration Panel
- [ ] Mode selector: Site-to-Site or Hub-and-Spoke
- [ ] Site A configuration section:
  - Site name
  - WireGuard interface IP
  - Local LAN network(s) CIDR
  - Endpoint (IP or hostname)
  - Listen port
- [ ] Site B configuration section:
  - Same fields as Site A
- [ ] Connection summary/preview
- [ ] Visual diagram of connection
- [ ] Generate configs for both sides
- [ ] Swap sites button

### 5.5 QR Code Display
- [ ] Generate QR codes using qrcode.js library
- [ ] Display QR code in modal/popup
- [ ] Client name displayed with QR
- [ ] Print-friendly QR code view
- [ ] Download QR code as PNG button
- [ ] Download QR code as SVG button
- [ ] Batch QR code generation:
  - Generate all clients as separate images
  - Generate all as single PDF
  - Grid layout for printing

### 5.6 Export Panel
- [ ] Target platform selector (tabs or dropdown):
  - WireGuard Standard (.conf)
  - MikroTik RouterOS (.rsc)
  - VyOS (commands)
  - OPNsense (guide)
  - Fritz!Box (.conf)
  - Teltonika RUT (guide)
- [ ] Export type selector:
  - Server configuration only
  - All client configurations
  - Single client configuration
  - Complete setup (server + all clients)
- [ ] Preview pane with syntax highlighting
- [ ] Copy to clipboard button
- [ ] Download single file button
- [ ] Download all as ZIP button
- [ ] Include DynDNS config toggle
- [ ] Include firewall rules toggle
- [ ] Include setup instructions toggle

---

## Phase 6: Profile Management System

### 6.1 Profile Storage (localStorage)
- [ ] Use localStorage for browser-based persistence
- [ ] Define profile JSON schema:
  ```javascript
  {
    id: "uuid-v4",
    name: "Profile Name",
    created: "ISO-timestamp",
    modified: "ISO-timestamp",
    version: "1.0",
    server: {
      name: string,
      privateKey: string,
      publicKey: string,
      listenPort: number,
      address: string,
      dns: string[],
      mtu: number,
      endpoint: string
    },
    clients: [{
      id: string,
      name: string,
      privateKey: string,
      publicKey: string,
      address: string,
      allowedIPs: string[],
      dns: string[],
      persistentKeepalive: number
    }],
    ipPool: {
      network: string,
      assigned: string[],
      reserved: string[]
    },
    dyndns: {
      provider: "ipv64",
      domain: string,
      apiKey: string (optional, warn user)
    },
    settings: {
      defaultKeepalive: number,
      defaultDNS: string[],
      defaultMTU: number
    }
  }
  ```
- [ ] Implement CRUD operations:
  - Create new profile
  - Read/load profile
  - Update existing profile
  - Delete profile
- [ ] Auto-save on changes (debounced)
- [ ] Profile list sidebar/dropdown

### 6.2 Profile Features
- [ ] Save current configuration as new profile
- [ ] Save changes to existing profile
- [ ] Load profile into editor
- [ ] Rename profile dialog
- [ ] Delete profile with confirmation
- [ ] Duplicate profile
- [ ] Export profile as JSON file
- [ ] Import profile from JSON file
- [ ] Profile search/filter in list
- [ ] Profile metadata display (created, modified, client count)

### 6.3 Profile Templates
- [ ] Pre-built starter templates:
  - "Basic Road Warrior" - 1 server, 5 client slots
  - "Site-to-Site" - 2 site configurations
  - "Small Office" - 1 server, 10 clients, split tunnel
  - "Home Lab" - 1 server, custom network
  - "Mobile Workers" - Full tunnel, DNS configured
- [ ] Load template as new profile
- [ ] Save current config as custom template
- [ ] Template management (rename, delete custom templates)

---

## Phase 7: IPv64.net DynDNS Integration

### 7.1 DynDNS Configuration Panel
- [ ] Enable/disable DynDNS toggle
- [ ] Provider selector (IPv64.net default, extensible)
- [ ] IPv64.net specific fields:
  - API/Update Key input (password field with show/hide)
  - Domain name input (with .ipv64.net suffix helper)
  - Update URL preview
- [ ] Test connection button (opens URL in new tab or shows expected response)
- [ ] Warning about storing API keys
- [ ] Option to NOT store API key in profile
- [ ] Link to IPv64.net account/signup

### 7.2 DynDNS Export Integration
- [ ] Include DynDNS config in server export
- [ ] Generate platform-specific update mechanisms:
  
  **MikroTik RouterOS:**
  ```routeros
  /system scheduler add name="IPv64-DynDNS" interval=1h on-event={
    /tool fetch url="https://ipv64.net/nic/update?key=YOUR_KEY&domain=YOUR_DOMAIN.ipv64.net" keep-result=no
  }
  ```
  
  **VyOS:**
  ```
  set service dns dynamic interface eth0 service ipv64 host-name 'YOUR_DOMAIN.ipv64.net'
  set service dns dynamic interface eth0 service ipv64 login 'nobody'
  set service dns dynamic interface eth0 service ipv64 password 'YOUR_KEY'
  set service dns dynamic interface eth0 service ipv64 protocol 'dyndns2'
  set service dns dynamic interface eth0 service ipv64 server 'ipv64.net'
  ```
  
  **OPNsense (ddclient):**
  ```
  Service Type: Custom
  Protocol: DynDns2
  Server: ipv64.net
  User: none
  Password: YOUR_KEY
  Hostname: YOUR_DOMAIN.ipv64.net
  ```
  
  **Fritz!Box:**
  ```
  DynDNS-Anbieter: Benutzerdefiniert
  Update URL: https://ipv64.net/nic/update?key=YOUR_KEY&ip=<ipaddr>&ip6=<ip6addr>
  Domainname: YOUR_DOMAIN.ipv64.net
  Benutzername: none
  Kennwort: none
  ```
  
  **Linux/Raspberry Pi (cron):**
  ```bash
  # Add to crontab -e:
  0 */2 * * * curl -sSL "https://ipv64.net/nic/update?key=YOUR_KEY&domain=YOUR_DOMAIN.ipv64.net"
  ```

### 7.3 DynDNS Helper Documentation
- [ ] Show update URL format and parameters
- [ ] Explain IPv4 vs IPv6 vs IPv6-Prefix updates
- [ ] Link to IPv64.net documentation
- [ ] Troubleshooting tips

---

## Phase 8: Advanced Features

### 8.1 Configuration Validation
- [ ] Real-time validation as user types
- [ ] Validate IP addresses (IPv4 and IPv6)
- [ ] Validate CIDR notation
- [ ] Check for IP conflicts within configuration
- [ ] Validate port numbers (1-65535, warn about privileged ports)
- [ ] Verify WireGuard key format:
  - Base64 encoded
  - Correct length (44 characters with padding)
- [ ] Check for duplicate public keys
- [ ] Validate endpoint format (hostname:port or IP:port)
- [ ] Show validation errors inline (red border, error message)
- [ ] Block export if validation fails
- [ ] Validation summary before export

### 8.2 Import Existing Configurations
- [ ] Import standard WireGuard .conf file
- [ ] Parse [Interface] section
- [ ] Parse [Peer] sections
- [ ] Detect role (server vs client) based on content
- [ ] Import multiple .conf files
- [ ] Merge imported configs into current profile
- [ ] Handle conflicts (duplicate IPs, keys)
- [ ] Import from clipboard (paste config text)

### 8.3 Batch Operations
- [ ] Bulk client generation (already in 5.3)
- [ ] Bulk export:
  - All clients as individual .conf files
  - All clients as single ZIP
  - All QR codes as images
  - All QR codes as PDF
- [ ] Bulk delete clients (with selection)
- [ ] Bulk regenerate keys (with confirmation)
- [ ] Bulk update settings:
  - Change DNS for all clients
  - Change keepalive for all clients
  - Change AllowedIPs mode for all clients

- [ ] **Preview Before Bulk Operations:**
  - Show detailed preview dialog before any bulk action
  - List all affected clients with names and IPs
  - Checkboxes to exclude specific items
  - Summary: "This will affect X clients"
  - Warning for destructive operations (delete, regenerate keys)
  - "Export backup first" option for delete operations
  - Require typing "DELETE" for bulk delete confirmation
  - Progress bar during operation
  - Results summary after completion (success/failed count)

### 8.4 Network Visualization (Nice-to-Have)
- [ ] Simple SVG-based network diagram
- [ ] Show server as central node
- [ ] Show clients as connected nodes
- [ ] Display IP addresses on diagram
- [ ] Interactive: click node to edit
- [ ] Site-to-Site: show both sites with connection line
- [ ] Export diagram as image

### 8.5 Keyboard Shortcuts
- [ ] Ctrl+S: Save profile
- [ ] Ctrl+N: New client
- [ ] Ctrl+E: Export current
- [ ] Ctrl+G: Generate keys
- [ ] Escape: Close modals
- [ ] Tab: Navigate form fields
- [ ] Shortcuts help dialog (?)

### 8.6 Subnet Conflict Checker
- [ ] Detect conflicts with common home networks:
  - 192.168.0.0/24 (common default)
  - 192.168.1.0/24 (common default)
  - 192.168.178.0/24 (Fritz!Box default)
  - 192.168.2.0/24 (Speedport default)
  - 10.0.0.0/24 (common)
- [ ] Show warning before config generation
- [ ] Suggest alternative subnet if conflict detected
- [ ] Allow user to override with confirmation

### 8.7 Client Groups & Tags
- [ ] Create custom groups (e.g., "Mobile", "Office", "IoT", "Guests", "Family")
- [ ] Assign clients to groups
- [ ] Filter client list by group
- [ ] Bulk operations per group (export all, delete all)
- [ ] Group-based AllowedIPs (e.g., IoT group only sees specific subnet)
- [ ] Device type icons: 📱 Phone, 💻 Laptop, 🖥️ Desktop, 🏠 IoT, 🖧 Server, 📷 Camera
- [ ] Color-coded groups in client list

### 8.8 Client Notes & Metadata
- [ ] Description field per client (e.g., "John's iPhone 15", "Kitchen Camera")
- [ ] Creation date tracking
- [ ] Last modified date
- [ ] Disable/Enable toggle (keep config but mark inactive)
- [ ] Optional contact info (email/phone for notifications)

### 8.9 Config Expiry & Lifecycle
- [ ] Set expiry date per client (optional)
- [ ] Visual warning for expired configs (red highlight)
- [ ] Visual warning for soon-to-expire (yellow, <7 days)
- [ ] Filter: Show expired, Show expiring soon
- [ ] Key age tracking (days since generation)
- [ ] Rotation reminder after X days (configurable, default 365)

### 8.10 IP Reservation System
- [ ] Reserve specific IPs for important devices:
  - .1 = Server (always)
  - .10-.19 = Reserved for infrastructure
  - .20-.29 = Reserved for NAS/Servers
  - User-definable reservations
- [ ] IP reservation table/list
- [ ] Prevent auto-assignment of reserved IPs
- [ ] Quick-assign from reservation list

### 8.11 Split Tunnel Presets
- [ ] Full Tunnel (0.0.0.0/0, ::/0) - All traffic through VPN
- [ ] Home Network Only - Only access home LAN
- [ ] Exclude Local - VPN except local network
- [ ] Custom Networks - User-defined list
- [ ] DNS Only - Route only DNS through VPN
- [ ] Preset selector dropdown in client config
- [ ] Edit/create custom presets

### 8.12 Import Existing WireGuard Configs
- [ ] Import standard .conf file
- [ ] Parse and extract:
  - Interface settings
  - Peer configurations
  - Keys (public, optionally private)
- [ ] Convert imported config to different export format:
  - Import .conf → Export as MikroTik
  - Import .conf → Export as VyOS
  - Import .conf → Export as Fritz!Box
  - etc.
- [ ] Bulk import multiple .conf files
- [ ] Import from clipboard (paste config text)
- [ ] Import from QR code image upload

### 8.13 Advanced Networking Options
- [ ] DNS Leak Prevention settings
- [ ] Kill Switch script generation (block non-VPN traffic)
- [ ] IPv6 support (dual-stack configuration)
- [ ] Multiple endpoints (primary + failover)
- [ ] Custom routing rules
- [ ] PostUp/PostDown script editor

### 8.14 One-Click Deploy Scripts
Generate complete, ready-to-paste CLI scripts for each platform:

- [ ] **MikroTik RouterOS One-Click:**
  ```routeros
  # WireGuard Complete Setup - Generated by WG Config Tool
  # Just paste this entire script into Terminal
  
  /interface wireguard add name=wg0 listen-port=51820 private-key="XXX"
  /ip address add address=10.50.0.1/24 interface=wg0
  /interface wireguard peers add interface=wg0 public-key="XXX" allowed-address=10.50.0.2/32
  /ip firewall filter add chain=input protocol=udp dst-port=51820 action=accept place-before=0
  /ip firewall nat add chain=srcnat out-interface=wg0 action=masquerade
  /system scheduler add name=ipv64-dyndns interval=1h on-event="/tool fetch url=\"https://ipv64.net/nic/update?key=XXX\" keep-result=no"
  # Setup complete!
  ```

- [ ] **VyOS One-Click:**
  ```
  # VyOS WireGuard Complete Setup
  configure
  set interfaces wireguard wg0 address '10.50.0.1/24'
  set interfaces wireguard wg0 port '51820'
  set interfaces wireguard wg0 private-key 'XXX'
  set interfaces wireguard wg0 peer XXX allowed-ips '10.50.0.2/32'
  set interfaces wireguard wg0 peer XXX public-key 'XXX'
  set service dns dynamic interface eth0 service ipv64 host-name 'XXX.ipv64.net'
  set service dns dynamic interface eth0 service ipv64 password 'XXX'
  set service dns dynamic interface eth0 service ipv64 protocol 'dyndns2'
  set service dns dynamic interface eth0 service ipv64 server 'ipv64.net'
  commit
  save
  ```

- [ ] **EdgeRouter One-Click:**
  Similar complete script for EdgeOS

- [ ] **Linux Bash One-Click:**
  ```bash
  #!/bin/bash
  # WireGuard Server Setup Script
  apt install wireguard -y
  cat > /etc/wireguard/wg0.conf << 'EOF'
  [Interface]
  ...
  EOF
  systemctl enable wg-quick@wg0
  systemctl start wg-quick@wg0
  ```

- [ ] Include "Copy All" button for entire script
- [ ] Include comments explaining each line
- [ ] Include rollback/removal script

### 8.15 Documentation & Printing
- [ ] **Client Setup Cards:**
  - Print-ready card layout (4 per A4 page)
  - QR code + client name + basic instructions
  - Cut lines for easy separation
  - Export as PDF

- [ ] **Full PDF Documentation:**
  - Network overview diagram
  - Server configuration details
  - All client configurations
  - Setup instructions per platform
  - Troubleshooting section
  - Export as single PDF

- [ ] **Email-Ready Instructions:**
  - HTML formatted email template
  - Step-by-step setup for end users
  - QR code embedded
  - Copy as HTML or plain text

- [ ] **Network Documentation Export:**
  - IP allocation table
  - All public keys (for reference)
  - Endpoint information
  - Export as CSV, Markdown, or PDF

- [ ] **Address Plan Table:**
  - IP | Client Name | Group | Status | Expiry
  - Export as CSV/Excel
  - Print-friendly HTML table

### 8.16 Troubleshooting Tools
- [ ] **Config Linter:**
  - Check for common mistakes before export
  - Validate all IP addresses
  - Check for subnet conflicts
  - Verify key formats
  - Check endpoint format
  - Warn about missing DNS
  - Warn about insecure settings

- [ ] **Duplicate Key Detection:**
  - Scan all clients for duplicate public keys
  - Scan all clients for duplicate private keys
  - Warning icon on affected clients
  - Block export if duplicates found
  - "Fix" button to regenerate duplicate keys
  - Check against server keys too

- [ ] **Debug Mode Config:**
  - Generate config with verbose logging enabled
  - Include diagnostic commands
  - Add troubleshooting comments

- [ ] **Connectivity Checklist:**
  - Step-by-step troubleshooting guide
  - Common issues and solutions:
    - "Handshake not completing"
    - "No internet through VPN"
    - "Can't reach LAN devices"
    - "DNS not working"

- [ ] **MTU Finder:**
  - Suggest optimal MTU based on connection:
    - DSL: 1420
    - Cable: 1420
    - Fiber: 1420
    - LTE/4G: 1280-1380
    - Satellite: 1280
  - Include ping test command for MTU discovery

- [ ] **Port Checker Integration:**
  - Link to online port checker
  - Generate test command for local check
  - Instructions for port forwarding

- [ ] **AllowedIPs Calculator:**
  - Interactive calculator for complex AllowedIPs setups
  - Input: What networks should client access?
    - Home LAN (e.g., 192.168.1.0/24)
    - VPN subnet (e.g., 10.50.0.0/24)
    - Internet (0.0.0.0/0)
    - Specific hosts (e.g., 192.168.1.100/32)
  - Output: Correct AllowedIPs string
  - Visual diagram showing what's routed
  - Presets:
    - Full Tunnel: 0.0.0.0/0, ::/0
    - Split Tunnel (LAN only): 192.168.x.0/24, 10.50.0.0/24
    - Specific hosts only
  - Exclude networks option (calculate inverse)
  - IPv6 support
  - Copy result to clipboard
  - "Apply to client" button

### 8.17 Password-Protected Export
- [ ] Option to encrypt exported profile JSON
- [ ] Use Web Crypto API (AES-256-GCM)
- [ ] Password input with strength indicator
- [ ] Encrypted file extension: .wgprofile.enc
- [ ] Import with password prompt
- [ ] Warning: "Don't forget your password!"

### 8.18 Profile Templates (Presets)
- [ ] **Road Warrior:**
  - 1 server, 5 client slots
  - Full tunnel mode
  - DNS configured
  - Mobile-optimized keepalive

- [ ] **Home Server Access:**
  - Split tunnel (home LAN only)
  - Lower keepalive for battery
  - Local DNS server

- [ ] **Site-to-Site Office:**
  - 2 sites pre-configured
  - Bi-directional routing
  - Business-grade settings

- [ ] **IoT Network:**
  - Isolated subnet
  - Restricted AllowedIPs
  - Device groups pre-defined

- [ ] **Privacy Setup:**
  - Full tunnel
  - DNS leak prevention
  - Kill switch enabled
  - External DNS (Cloudflare/Quad9)

- [ ] **Guest Access:**
  - Temporary configs
  - Expiry date set
  - Limited network access

- [ ] **Home Lab:**
  - Multiple services subnet
  - Reserved IPs for servers
  - Documentation template

- [ ] Load template as new profile
- [ ] Save current config as custom template

---

## Phase 9: Security & Best Practices

### 9.1 Security Measures
- [ ] All cryptographic operations client-side (JavaScript)
- [ ] No data sent to external servers (verify in code)
- [ ] Use Web Crypto API where possible
- [ ] Clear sensitive data from variables after use
- [ ] Warn users about:
  - Storing private keys in browser
  - Sharing profile files
  - API key storage
- [ ] Option to exclude private keys from profile export
- [ ] Secure random number generation (crypto.getRandomValues)

### 9.2 Best Practices Implementation
- [ ] Default to secure settings:
  - PSK enabled by default
  - Strong key generation
  - Reasonable keepalive (25 seconds)
- [ ] Security recommendations in UI:
  - Suggest enabling PSK
  - Warn about full tunnel mode battery impact on mobile
  - Recommend regular key rotation
- [ ] Include security notes in exported configs as comments
- [ ] Firewall rule recommendations per platform
- [ ] Document minimum required open ports

### 9.3 Privacy
- [ ] No analytics or tracking
- [ ] No external resource loading (bundle all libraries)
- [ ] All processing local
- [ ] Clear about data storage (localStorage only)

---

## Phase 10: Testing & Documentation

### 10.1 Functional Testing
- [ ] Test key generation (generate 100 keys, verify format)
- [ ] Test IP pool assignment (fill pool, verify no duplicates)
- [ ] Test config generation for each platform:
  - WireGuard standard
  - MikroTik
  - VyOS
  - OPNsense
  - Fritz!Box
  - Teltonika
- [ ] Test QR code generation (scan with app)
- [ ] Test profile save/load cycle
- [ ] Test import functionality with various .conf files
- [ ] Test bulk operations
- [ ] Test validation rules

### 10.2 Cross-Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)
- [ ] Safari (latest)
- [ ] Mobile Chrome (Android)
- [ ] Mobile Safari (iOS)
- [ ] Test localStorage persistence
- [ ] Test file download functionality
- [ ] Test copy to clipboard

### 10.3 Responsive Testing
- [ ] Desktop (1920x1080, 1440x900)
- [ ] Tablet (768x1024, 1024x768)
- [ ] Mobile (375x667, 414x896)
- [ ] Test all modals and dialogs
- [ ] Test form usability on mobile
- [ ] Test QR code visibility

### 10.4 Documentation
- [ ] README.md with:
  - Project description
  - Features list
  - Quick start guide
  - Screenshots
  - License
- [ ] USAGE.md with detailed user guide
- [ ] Platform-specific setup guides:
  - SETUP-MIKROTIK.md
  - SETUP-VYOS.md
  - SETUP-OPNSENSE.md
  - SETUP-FRITZBOX.md
  - SETUP-TELTONIKA.md
- [ ] FAQ.md
- [ ] TROUBLESHOOTING.md
- [ ] CHANGELOG.md

### 10.5 In-App Help System
- [ ] Tooltips on all form fields (title attribute or custom)
- [ ] Help icon (?) with popup explanations
- [ ] Contextual hints for complex sections
- [ ] Link to external documentation
- [ ] Example configurations

---

## Phase 11: Polish & Release

### 11.1 UI/UX Improvements
- [ ] Loading spinners for async operations
- [ ] Toast notifications for:
  - Success (green): "Profile saved", "Config copied"
  - Error (red): "Validation failed", "Export error"
  - Info (blue): "Keys generated"
- [ ] Confirmation dialogs for:
  - Delete profile
  - Delete client
  - Regenerate keys
  - Clear all data
- [ ] Smooth CSS transitions
- [ ] Form validation animations
- [ ] Progress indicators for bulk operations

### 11.2 Visual Enhancements
- [ ] **Live Config Preview:**
  - Real-time preview panel as you configure
  - Shows generated config updating live
  - Syntax highlighting

- [ ] **Diff View:**
  - Compare two configs side-by-side
  - Highlight differences
  - Useful for troubleshooting

- [ ] **Dark/Light/System Theme:**
  - Auto-detect system preference
  - Manual toggle in settings
  - Persist preference in localStorage

- [ ] **Compact Mode:**
  - Dense UI option for power users
  - More info visible at once
  - Toggle in settings

- [ ] **Guided Wizard Mode:**
  - Step-by-step setup for beginners
  - Progress indicator (Step 1/5, etc.)
  - Helpful explanations at each step:
    1. Choose topology (Client-Server / Site-to-Site)
    2. Configure server/network settings
    3. Add clients
    4. Configure DynDNS (optional)
    5. Export configurations
  - Skip to advanced mode option
  - "What's this?" help tooltips

- [ ] **Network Diagram:**
  - Visual representation of VPN topology
  - Server in center, clients around
  - Click to edit
  - Export as SVG/PNG

### 11.3 Multi-Language Support
- [ ] **German (Deutsch)** - Primary
- [ ] **English** - Secondary
- [ ] Language selector in settings
- [ ] Persist language preference
- [ ] Translate all UI strings:
  - Labels and buttons
  - Error messages
  - Help texts
  - Documentation
- [ ] Use i18n JSON files:
  ```
  /lang/de.json
  /lang/en.json
  ```
- [ ] Fallback to English if string missing

### 11.4 Local Backup & Restore
- [ ] **Export All Data:**
  - Export all profiles as single JSON file
  - Include all settings and preferences
  - Optional: Password-protect backup
  - Filename: wg-config-backup-YYYY-MM-DD.json

- [ ] **Import Backup:**
  - Import backup file
  - Option to merge or replace existing data
  - Validate backup file structure
  - Show preview before import

- [ ] **Auto-Backup Reminder:**
  - Remind user to backup periodically
  - "Last backup: X days ago"
  - Optional: Auto-download backup weekly

### 11.5 Accessibility (a11y)
- [ ] Semantic HTML (proper headings, labels)
- [ ] ARIA labels for icons and buttons
- [ ] Keyboard navigation support
- [ ] Focus indicators
- [ ] Screen reader testing
- [ ] Color contrast compliance (WCAG AA)
- [ ] High contrast mode support

### 11.6 Performance Optimization
- [ ] Minimize JavaScript (terser/uglify)
- [ ] Minimize CSS
- [ ] Inline critical CSS
- [ ] Lazy load non-critical features
- [ ] Optimize images (if any)
- [ ] Test initial load time (<3 seconds)
- [ ] Test on slow connections (throttle in DevTools)

### 11.7 Final Checks
- [ ] Remove console.log statements
- [ ] Remove debug code
- [ ] Verify all features work offline
- [ ] Test fresh install (clear localStorage)
- [ ] Verify no external dependencies fail
- [ ] Check all links work

### 11.8 Release Package
- [ ] Version number (semver: 1.0.0)
- [ ] Update CHANGELOG.md
- [ ] Create release ZIP containing:
  - index.html
  - css/ folder
  - js/ folder
  - lib/ folder
  - assets/ folder
  - README.md
  - LICENSE
- [ ] Test ZIP extraction and run
- [ ] Optional: Deploy to GitHub Pages
- [ ] Create GitHub release (if applicable)

---

## Additional Ideas & Future Enhancements

### Future Features (Post-Release)
- [ ] Multi-language support (DE, EN primary)
- [ ] Export to PDF documentation with diagrams
- [ ] Integration with other DynDNS providers:
  - DuckDNS
  - No-IP
  - DynDNS.org
  - Cloudflare
- [ ] WireGuard config linter/checker
- [ ] PWA (Progressive Web App) for mobile installation
- [ ] Dark mode automatic (system preference)
- [ ] Backup/restore all data
- [ ] Cloud sync (optional, user-hosted)
- [ ] Command-line version (Node.js)
- [ ] Electron desktop app wrapper

### Platform-Specific Enhancements
- [ ] MikroTik: Generate firewall filter rules
- [ ] MikroTik: NAT hairpin rules
- [ ] VyOS: Zone-based firewall integration
- [ ] OPNsense: Full plugin configuration export
- [ ] Fritz!Box: Handle port reassignment warnings
- [ ] Teltonika: OpenWrt-style UCI commands

---

## Project Specifications (CONFIRMED)

### 1. IP Address Management
- **Default IP range:** 10.50.0.0/24
- **User configurable:** Yes
- **Automatic subnet sizing:** User enters number of connections → tool calculates optimal subnet
  - Example: 10 clients → /28 (14 usable IPs)
  - Example: 50 clients → /26 (62 usable IPs)
  - Example: 100 clients → /25 (126 usable IPs)
  - Example: 250 clients → /24 (254 usable IPs)

### 2. Default Settings
- **MTU:** 1420
- **Default Keepalive:** 25 seconds
- **Default Port:** 51820

### 3. Firewall/Scripts
- **Include PostUp/PostDown scripts:** Yes
- **Include iptables NAT rules:** Yes
- **Include platform-specific firewall rules:** Yes

### 4. User Interface
- **Layout:** Sidebar navigation
- **Theme:** Dark/Light toggle (default: system preference)

### 5. Additional Confirmed Features
- Multiple WireGuard interfaces support (wg0, wg1, etc.)
- Warn about common misconfigurations
- Import should offer merge or overwrite option

---

## Suggested Implementation Timeline

### Phase A: MVP (Minimum Viable Product)
| Task | Description | Est. Time |
|------|-------------|----------|
| 1 | Project Foundation & Crypto | 1-2 days |
| 2 | Core Config Engine + Auto Subnet | 2-3 days |
| 5.1-5.3 | Basic UI (Sidebar, Server, Clients) | 2-3 days |
| 4.1 | Standard WireGuard Export | 0.5 day |
| 5.5 | QR Code Generation | 0.5 day |
| 3.1 | Client-to-Server Mode | 1 day |
| 6.1-6.2 | Basic Profile Save/Load | 1 day |
| **MVP Total** | | **8-11 days** |

### Phase B: Core Features
| Task | Description | Est. Time |
|------|-------------|----------|
| 4.2 | MikroTik Export + One-Click | 1 day |
| 4.3 | VyOS Export + One-Click | 0.5 day |
| 4.4 | OPNsense Export | 0.5 day |
| 4.5 | Fritz!Box Export | 0.5 day |
| 4.6 | Teltonika Export | 0.5 day |
| 4.7 | EdgeRouter Export | 0.5 day |
| 4.8 | GL.iNet Export | 0.5 day |
| 7 | IPv64.net DynDNS Integration | 1 day |
| 8.6 | Subnet Conflict Checker | 0.5 day |
| 8.7 | Client Groups & Tags | 1 day |
| 8.16 | Config Linter | 0.5 day |
| 11.3 | Multi-Language (DE/EN) | 1-2 days |
| **Phase B Total** | | **8-10 days** |

### Phase C: Advanced Features
| Task | Description | Est. Time |
|------|-------------|----------|
| 3.2 | Site-to-Site Mode | 1-2 days |
| 8.9 | Config Expiry & Lifecycle | 0.5 day |
| 8.10 | IP Reservation System | 0.5 day |
| 8.11 | Split Tunnel Presets | 0.5 day |
| 8.12 | Import WireGuard Configs | 1 day |
| 8.14 | One-Click Deploy (all platforms) | 1 day |
| 8.15 | Documentation & Printing | 1-2 days |
| 8.17 | Password-Protected Export | 0.5 day |
| 8.18 | Profile Templates | 0.5 day |
| 11.2 | Visual Enhancements (Wizard, Preview) | 1-2 days |
| 11.4 | Local Backup & Restore | 0.5 day |
| **Phase C Total** | | **8-11 days** |

### Phase D: Polish & Release
| Task | Description | Est. Time |
|------|-------------|----------|
| 9 | Security Review | 1 day |
| 10 | Testing & Documentation | 2-3 days |
| 11.1 | UI/UX Polish | 1 day |
| 11.5-11.8 | Accessibility, Performance, Release | 1-2 days |
| **Phase D Total** | | **5-7 days** |

### 📅 Grand Total: **29-39 days** (~6-8 weeks)

---

## Resources & References

### Libraries to Use
- **TweetNaCl.js** - Cryptography (X25519 keys): https://tweetnacl.js.org/
- **qrcode.js** - QR Code generation: https://davidshimjs.github.io/qrcodejs/
- **JSZip** - ZIP file creation: https://stuk.github.io/jszip/
- **FileSaver.js** - File downloads: https://github.com/eligrey/FileSaver.js
- **highlight.js** (optional) - Syntax highlighting: https://highlightjs.org/

### WireGuard References
- Official WireGuard docs: https://www.wireguard.com/
- wg-quick man page: https://man7.org/linux/man-pages/man8/wg-quick.8.html
- Configuration format: https://www.wireguard.com/#cryptokey-routing

### Platform Documentation
- MikroTik WireGuard: https://help.mikrotik.com/docs/display/ROS/WireGuard
- VyOS WireGuard: https://docs.vyos.io/en/latest/configuration/interfaces/wireguard.html
- OPNsense WireGuard: https://docs.opnsense.org/manual/vpnet.html
- Fritz!Box WireGuard: https://en.avm.de/service/knowledge-base/dok/FRITZ-Box-7590/3685_Setting-up-a-WireGuard-VPN-to-the-FRITZ-Box-on-the-computer/
- Teltonika WireGuard: https://wiki.teltonika-networks.com/view/WireGuard_Configuration_Example

### IPv64.net References
- DynDNS Helper: https://ipv64.net/dyndns_helper
- Update API: https://ipv64.net/dyndns_updater_api
- WireGuard Generator (reference): https://ipv64.net/wireguard-config-generator

---

*Created: 2024-12-30*
*Project: WireGuard Router Configuration Tool*
*Author: D. Fett*
