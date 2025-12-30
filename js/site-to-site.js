const SiteToSite = {
    siteA: {
        name: 'Site A',
        privateKey: '',
        publicKey: '',
        tunnelIP: '10.99.0.1',
        lanNetwork: '192.168.1.0/24',
        endpoint: '',
        port: 51820
    },

    siteB: {
        name: 'Site B',
        privateKey: '',
        publicKey: '',
        tunnelIP: '10.99.0.2',
        lanNetwork: '192.168.2.0/24',
        endpoint: '',
        port: 51820
    },

    init() {
        this.loadState();
        this.initEventListeners();
    },

    loadState() {
        const saved = localStorage.getItem('wg-s2s-config');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.siteA = data.siteA || this.siteA;
                this.siteB = data.siteB || this.siteB;
                this.populateForm();
            } catch (e) {
                console.error('Failed to load S2S state:', e);
            }
        }
    },

    saveState() {
        localStorage.setItem('wg-s2s-config', JSON.stringify({
            siteA: this.siteA,
            siteB: this.siteB
        }));
    },

    populateForm() {
        document.getElementById('s2s-site-a-name').value = this.siteA.name;
        document.getElementById('s2s-site-a-lan').value = this.siteA.lanNetwork;
        document.getElementById('s2s-site-a-tunnel-ip').value = this.siteA.tunnelIP;
        document.getElementById('s2s-site-a-endpoint').value = this.siteA.endpoint;
        document.getElementById('s2s-site-a-port').value = this.siteA.port;

        document.getElementById('s2s-site-b-name').value = this.siteB.name;
        document.getElementById('s2s-site-b-lan').value = this.siteB.lanNetwork;
        document.getElementById('s2s-site-b-tunnel-ip').value = this.siteB.tunnelIP;
        document.getElementById('s2s-site-b-endpoint').value = this.siteB.endpoint;
        document.getElementById('s2s-site-b-port').value = this.siteB.port;

        if (this.siteA.privateKey) {
            document.getElementById('s2s-site-a-private').value = this.siteA.privateKey;
            document.getElementById('s2s-site-a-public').value = this.siteA.publicKey;
            document.getElementById('s2s-keys-a').style.display = 'block';
        }

        if (this.siteB.privateKey) {
            document.getElementById('s2s-site-b-private').value = this.siteB.privateKey;
            document.getElementById('s2s-site-b-public').value = this.siteB.publicKey;
            document.getElementById('s2s-keys-b').style.display = 'block';
        }
    },

    initEventListeners() {
        document.getElementById('s2s-generate-keys-a').addEventListener('click', () => {
            const keys = WGCrypto.generateKeyPair();
            this.siteA.privateKey = keys.privateKey;
            this.siteA.publicKey = keys.publicKey;
            document.getElementById('s2s-site-a-private').value = keys.privateKey;
            document.getElementById('s2s-site-a-public').value = keys.publicKey;
            document.getElementById('s2s-keys-a').style.display = 'block';
            this.saveState();
        });

        document.getElementById('s2s-generate-keys-b').addEventListener('click', () => {
            const keys = WGCrypto.generateKeyPair();
            this.siteB.privateKey = keys.privateKey;
            this.siteB.publicKey = keys.publicKey;
            document.getElementById('s2s-site-b-private').value = keys.privateKey;
            document.getElementById('s2s-site-b-public').value = keys.publicKey;
            document.getElementById('s2s-keys-b').style.display = 'block';
            this.saveState();
        });

        document.getElementById('s2s-swap-sites').addEventListener('click', () => {
            this.swapSites();
        });

        document.getElementById('s2s-generate-configs').addEventListener('click', () => {
            this.generateConfigs();
        });

        document.getElementById('s2s-download-a').addEventListener('click', () => {
            this.downloadConfig('a');
        });

        document.getElementById('s2s-download-b').addEventListener('click', () => {
            this.downloadConfig('b');
        });

        const inputs = [
            's2s-site-a-name', 's2s-site-a-lan', 's2s-site-a-tunnel-ip', 's2s-site-a-endpoint', 's2s-site-a-port',
            's2s-site-b-name', 's2s-site-b-lan', 's2s-site-b-tunnel-ip', 's2s-site-b-endpoint', 's2s-site-b-port'
        ];

        inputs.forEach(id => {
            document.getElementById(id).addEventListener('change', () => {
                this.updateState();
            });
        });
    },

    updateState() {
        this.siteA.name = document.getElementById('s2s-site-a-name').value;
        this.siteA.lanNetwork = document.getElementById('s2s-site-a-lan').value;
        this.siteA.tunnelIP = document.getElementById('s2s-site-a-tunnel-ip').value;
        this.siteA.endpoint = document.getElementById('s2s-site-a-endpoint').value;
        this.siteA.port = parseInt(document.getElementById('s2s-site-a-port').value);

        this.siteB.name = document.getElementById('s2s-site-b-name').value;
        this.siteB.lanNetwork = document.getElementById('s2s-site-b-lan').value;
        this.siteB.tunnelIP = document.getElementById('s2s-site-b-tunnel-ip').value;
        this.siteB.endpoint = document.getElementById('s2s-site-b-endpoint').value;
        this.siteB.port = parseInt(document.getElementById('s2s-site-b-port').value);

        this.saveState();
    },

    swapSites() {
        const temp = { ...this.siteA };
        this.siteA = { ...this.siteB };
        this.siteB = temp;
        this.populateForm();
        this.saveState();
    },

    generateConfigs() {
        if (!this.siteA.privateKey || !this.siteB.privateKey) {
            alert('Please generate keys for both sites first');
            return;
        }

        if (!this.siteB.endpoint) {
            alert('Site B must have an endpoint configured for Site A to connect to');
            return;
        }

        const configA = this.generateSiteConfig(this.siteA, this.siteB);
        const configB = this.generateSiteConfig(this.siteB, this.siteA);

        document.getElementById('s2s-config-a-title').textContent = `${this.siteA.name} Configuration`;
        document.getElementById('s2s-config-b-title').textContent = `${this.siteB.name} Configuration`;
        document.getElementById('s2s-config-a').textContent = configA;
        document.getElementById('s2s-config-b').textContent = configB;
        document.getElementById('s2s-output').style.display = 'block';
    },

    generateSiteConfig(localSite, remoteSite) {
        let config = '# Site-to-Site WireGuard Configuration\n';
        config += `# Local Site: ${localSite.name}\n`;
        config += `# Remote Site: ${remoteSite.name}\n\n`;

        config += '[Interface]\n';
        config += `PrivateKey = ${localSite.privateKey}\n`;
        config += `Address = ${localSite.tunnelIP}/30\n`;
        config += `ListenPort = ${localSite.port}\n\n`;

        config += '# Routing for local LAN\n';
        config += `PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE\n`;
        config += `PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE\n\n`;

        config += `[Peer]\n`;
        config += `# Remote Site: ${remoteSite.name}\n`;
        config += `PublicKey = ${remoteSite.publicKey}\n`;

        if (remoteSite.endpoint) {
            config += `Endpoint = ${remoteSite.endpoint}:${remoteSite.port}\n`;
        }

        config += `AllowedIPs = ${remoteSite.tunnelIP}/32, ${remoteSite.lanNetwork}\n`;
        config += `PersistentKeepalive = 25\n`;

        return config;
    },

    downloadConfig(site) {
        const config = site === 'a'
            ? document.getElementById('s2s-config-a').textContent
            : document.getElementById('s2s-config-b').textContent;

        const siteName = site === 'a' ? this.siteA.name : this.siteB.name;

        const blob = new Blob([config], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${siteName.replace(/[^a-z0-9]/gi, '_')}_s2s.conf`;
        a.click();
        URL.revokeObjectURL(url);
    }
};
