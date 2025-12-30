const App = {
    state: {
        server: {
            name: 'VPN Server',
            privateKey: '',
            publicKey: '',
            listenPort: 51820,
            addresses: ['10.50.0.1'],
            dns: ['1.1.1.1', '1.0.0.1'],
            mtu: 1420,
            endpoint: '',
            enablePSK: true,
            enableNAT: true
        },
        clients: [],
        ipPool: null,
        settings: {
            defaultKeepalive: 25,
            theme: 'system',
            language: 'en'
        }
    },

    init() {
        this.loadProfile();
        this.initNavigation();
        this.initServerForm();
        this.initClientManagement();
        this.initExport();
        this.initSettings();
        this.updateSubnetInfo();
    },

    loadProfile() {
        const profile = ProfileManager.getCurrentProfile();
        if (profile) {
            this.state.server = profile.server || this.state.server;
            this.state.clients = profile.clients || [];
            this.state.ipPool = profile.ipPool;
            this.state.settings = profile.settings || this.state.settings;
        }

        if (!this.state.ipPool) {
            const baseNetwork = document.getElementById('base-network').value || '10.50.0.0';
            const connectionCount = parseInt(document.getElementById('connection-count').value) || 30;
            const subnet = IPManager.calculateSubnet(baseNetwork, connectionCount);
            this.state.ipPool = IPManager.createIPPool(subnet.cidr);
        }

        this.populateForm();
    },

    populateForm() {
        document.getElementById('server-name').value = this.state.server.name;
        document.getElementById('listen-port').value = this.state.server.listenPort;
        document.getElementById('server-dns').value = this.state.server.dns.join(', ');
        document.getElementById('mtu').value = this.state.server.mtu;
        document.getElementById('endpoint').value = this.state.server.endpoint;
        document.getElementById('enable-psk').checked = this.state.server.enablePSK;
        document.getElementById('enable-nat').checked = this.state.server.enableNAT;
        document.getElementById('keepalive').value = this.state.settings.defaultKeepalive;

        if (this.state.server.privateKey) {
            document.getElementById('server-private-key').value = this.state.server.privateKey;
            document.getElementById('server-public-key').value = this.state.server.publicKey;
            document.getElementById('server-keys-display').style.display = 'block';
        }
    },

    initNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.switchView(view);
            });
        });
    },

    switchView(viewName) {
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));

        document.querySelector(`[data-view="${viewName}"]`).classList.add('active');
        document.getElementById(`view-${viewName}`).classList.add('active');
    },

    initServerForm() {
        document.getElementById('generate-server-keys').addEventListener('click', () => {
            const keys = WGCrypto.generateKeyPair();
            this.state.server.privateKey = keys.privateKey;
            this.state.server.publicKey = keys.publicKey;

            document.getElementById('server-private-key').value = keys.privateKey;
            document.getElementById('server-public-key').value = keys.publicKey;
            document.getElementById('server-keys-display').style.display = 'block';

            this.autoSave();
        });

        document.getElementById('connection-count').addEventListener('change', () => {
            this.updateSubnetInfo();
            this.autoSave();
        });

        document.getElementById('base-network').addEventListener('input', () => {
            this.updateSubnetInfo();
            this.autoSave();
        });

        const formInputs = ['server-name', 'listen-port', 'server-dns', 'mtu', 'endpoint', 'enable-psk', 'enable-nat', 'keepalive'];
        formInputs.forEach(id => {
            const element = document.getElementById(id);
            element.addEventListener('change', () => {
                this.updateServerState();
                this.autoSave();
            });
        });
    },

    updateServerState() {
        this.state.server.name = document.getElementById('server-name').value;
        this.state.server.listenPort = parseInt(document.getElementById('listen-port').value);
        this.state.server.dns = document.getElementById('server-dns').value.split(',').map(s => s.trim());
        this.state.server.mtu = parseInt(document.getElementById('mtu').value);
        this.state.server.endpoint = document.getElementById('endpoint').value;
        this.state.server.enablePSK = document.getElementById('enable-psk').checked;
        this.state.server.enableNAT = document.getElementById('enable-nat').checked;
        this.state.settings.defaultKeepalive = parseInt(document.getElementById('keepalive').value);

        if (this.state.server.enableNAT) {
            this.state.server.postUp = ConfigGenerator.generatePostUpScript(true);
            this.state.server.postDown = ConfigGenerator.generatePostDownScript(true);
        } else {
            this.state.server.postUp = '';
            this.state.server.postDown = '';
        }
    },

    updateSubnetInfo() {
        const baseNetwork = document.getElementById('base-network').value || '10.50.0.0';
        const connectionCount = parseInt(document.getElementById('connection-count').value) || 30;

        const subnet = IPManager.calculateSubnet(baseNetwork, connectionCount);
        this.state.ipPool = IPManager.createIPPool(subnet.cidr);

        this.state.server.addresses = [this.state.ipPool.reserved[0]];

        document.getElementById('calculated-subnet').textContent = subnet.cidr;
        document.getElementById('usable-ips').textContent = subnet.usableIPs;
    },

    initClientManagement() {
        document.getElementById('add-client').addEventListener('click', () => {
            this.addClient();
        });

        this.renderClients();
    },

    addClient(name) {
        if (!this.state.server.privateKey) {
            alert('Please generate server keys first');
            return;
        }

        const keys = WGCrypto.generateKeyPair();
        const ip = IPManager.assignIP(this.state.ipPool);

        if (!ip) {
            alert('IP pool exhausted. No available IPs.');
            return;
        }

        const clientData = {
            id: Date.now().toString(),
            name: name || `Client-${this.state.clients.length + 1}`,
            privateKey: keys.privateKey,
            publicKey: keys.publicKey,
            preSharedKey: this.state.server.enablePSK ? WGCrypto.generatePSK() : '',
            address: ip,
            allowedIPs: [],
            dns: this.state.server.dns,
            persistentKeepalive: this.state.settings.defaultKeepalive
        };

        const client = ConfigGenerator.buildClientModel(clientData, this.state.server);
        this.state.clients.push(client);

        this.renderClients();
        this.autoSave();
    },

    deleteClient(id) {
        const client = this.state.clients.find(c => c.id === id);
        if (client) {
            IPManager.releaseIP(this.state.ipPool, client.address);
        }

        this.state.clients = this.state.clients.filter(c => c.id !== id);
        this.renderClients();
        this.autoSave();
    },

    renderClients() {
        const container = document.getElementById('clients-list');

        if (this.state.clients.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No clients configured. Click "Add Client" to get started.</p></div>';
            return;
        }

        container.innerHTML = this.state.clients.map(client => `
            <div class="client-card">
                <div class="client-header">
                    <div class="client-name">${client.name}</div>
                    <div class="client-actions">
                        <button class="btn btn-secondary btn-sm" onclick="App.showClientQR('${client.id}')">QR</button>
                        <button class="btn btn-secondary btn-sm" onclick="App.downloadClientConfig('${client.id}')">Download</button>
                        <button class="btn btn-danger btn-sm" onclick="App.deleteClient('${client.id}')">Delete</button>
                    </div>
                </div>
                <div class="client-info">
                    <div class="client-info-item">
                        <div class="client-info-label">IP Address</div>
                        <div class="client-info-value">${client.address}</div>
                    </div>
                    <div class="client-info-item">
                        <div class="client-info-label">Public Key</div>
                        <div class="client-info-value">${client.publicKey.substring(0, 20)}...</div>
                    </div>
                </div>
            </div>
        `).join('');
    },

    showClientQR(id) {
        const client = this.state.clients.find(c => c.id === id);
        if (!client) return;

        const config = ConfigGenerator.generateClientConfig(client, this.state.server);
        alert(`QR Code for ${client.name}\n\n(QR generation requires qrcode.js library)`);
        console.log('Client config:', config);
    },

    downloadClientConfig(id) {
        const client = this.state.clients.find(c => c.id === id);
        if (!client) return;

        const config = ConfigGenerator.generateClientConfig(client, this.state.server);
        const blob = new Blob([config], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${client.name.replace(/[^a-z0-9]/gi, '_')}.conf`;
        a.click();
        URL.revokeObjectURL(url);
    },

    initExport() {
        document.getElementById('export-preview').addEventListener('click', () => {
            this.showExportPreview();
        });

        document.getElementById('export-download').addEventListener('click', () => {
            this.downloadExport();
        });
    },

    showExportPreview() {
        const platform = document.getElementById('export-platform').value;
        const type = document.getElementById('export-type').value;

        let config = '';

        if (type === 'server' || type === 'complete') {
            config += ConfigGenerator.generateServerConfig(this.state.server, this.state.clients);
        }

        if (type === 'all-clients' || type === 'complete') {
            config += '\n\n# Client Configurations\n';
            this.state.clients.forEach(client => {
                config += `\n# ${client.name}\n`;
                config += ConfigGenerator.generateClientConfig(client, this.state.server);
                config += '\n';
            });
        }

        document.getElementById('export-code').textContent = config;
    },

    downloadExport() {
        const platform = document.getElementById('export-platform').value;
        const type = document.getElementById('export-type').value;

        const config = ConfigGenerator.generateServerConfig(this.state.server, this.state.clients);
        const blob = new Blob([config], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wireguard-server.conf`;
        a.click();
        URL.revokeObjectURL(url);
    },

    initSettings() {
        document.getElementById('theme-select').value = this.state.settings.theme;
        document.getElementById('language-select').value = this.state.settings.language;

        document.getElementById('theme-select').addEventListener('change', (e) => {
            this.state.settings.theme = e.target.value;
            this.applyTheme(e.target.value);
            this.autoSave();
        });

        this.applyTheme(this.state.settings.theme);
    },

    applyTheme(theme) {
        if (theme === 'dark') {
            document.body.setAttribute('data-theme', 'dark');
        } else if (theme === 'light') {
            document.body.removeAttribute('data-theme');
        } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
                document.body.setAttribute('data-theme', 'dark');
            } else {
                document.body.removeAttribute('data-theme');
            }
        }
    },

    autoSave() {
        ProfileManager.autoSave({
            server: this.state.server,
            clients: this.state.clients,
            ipPool: this.state.ipPool,
            settings: this.state.settings
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
