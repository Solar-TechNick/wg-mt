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
        dyndns: {
            enabled: false,
            provider: 'ipv64',
            domain: '',
            apiKey: ''
        },
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

        if (typeof SiteToSite !== 'undefined') {
            SiteToSite.init();
        }

        if (typeof ProfileUI !== 'undefined') {
            ProfileUI.init();
        }
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

        document.getElementById('enable-dyndns').checked = this.state.dyndns.enabled;
        document.getElementById('dyndns-domain').value = this.state.dyndns.domain || '';
        document.getElementById('dyndns-apikey').value = this.state.dyndns.apiKey || '';
        document.getElementById('dyndns-config').style.display = this.state.dyndns.enabled ? 'block' : 'none';

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

        document.getElementById('enable-dyndns').addEventListener('change', (e) => {
            this.state.dyndns.enabled = e.target.checked;
            document.getElementById('dyndns-config').style.display = e.target.checked ? 'block' : 'none';
            this.autoSave();
        });

        document.getElementById('dyndns-domain').addEventListener('input', (e) => {
            this.state.dyndns.domain = e.target.value;
            this.autoSave();
        });

        document.getElementById('dyndns-apikey').addEventListener('input', (e) => {
            this.state.dyndns.apiKey = e.target.value;
            this.autoSave();
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

        document.getElementById('bulk-generate').addEventListener('click', () => {
            this.showBulkGenerateModal();
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

        QRGenerator.showClientQR(client, this.state.server);
    },

    showBulkGenerateModal() {
        if (!this.state.server.privateKey) {
            alert('Please generate server keys first');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'bulk-modal';
        modal.innerHTML = `
            <div class="bulk-modal-content">
                <div class="qr-modal-header">
                    <h3>Bulk Generate Clients</h3>
                    <button class="qr-modal-close" onclick="this.closest('.bulk-modal').remove()">&times;</button>
                </div>
                <div class="qr-modal-body">
                    <div class="bulk-form-group">
                        <label for="bulk-count">Number of clients</label>
                        <input type="number" id="bulk-count" min="1" max="50" value="5">
                    </div>
                    <div class="bulk-form-group">
                        <label for="bulk-pattern">Naming pattern (use {n} for number)</label>
                        <input type="text" id="bulk-pattern" value="Client-{n}" placeholder="Client-{n}">
                    </div>
                    <div class="bulk-form-group">
                        <label>Preview:</label>
                        <div class="bulk-preview" id="bulk-preview">
                            <div class="bulk-preview-item">Client-1</div>
                            <div class="bulk-preview-item">Client-2</div>
                            <div class="bulk-preview-item">Client-3</div>
                            <div class="bulk-preview-item">Client-4</div>
                            <div class="bulk-preview-item">Client-5</div>
                        </div>
                    </div>
                </div>
                <div class="qr-modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.bulk-modal').remove()">Cancel</button>
                    <button class="btn btn-primary" id="bulk-generate-btn">Generate</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const updatePreview = () => {
            const count = parseInt(document.getElementById('bulk-count').value) || 1;
            const pattern = document.getElementById('bulk-pattern').value;
            const preview = document.getElementById('bulk-preview');
            const existingCount = this.state.clients.length;

            preview.innerHTML = '';
            for (let i = 1; i <= Math.min(count, 10); i++) {
                const name = pattern.replace('{n}', existingCount + i);
                const item = document.createElement('div');
                item.className = 'bulk-preview-item';
                item.textContent = name;
                preview.appendChild(item);
            }

            if (count > 10) {
                const more = document.createElement('div');
                more.className = 'bulk-preview-item';
                more.textContent = `... and ${count - 10} more`;
                more.style.fontStyle = 'italic';
                preview.appendChild(more);
            }
        };

        document.getElementById('bulk-count').addEventListener('input', updatePreview);
        document.getElementById('bulk-pattern').addEventListener('input', updatePreview);

        document.getElementById('bulk-generate-btn').addEventListener('click', () => {
            const count = parseInt(document.getElementById('bulk-count').value) || 1;
            const pattern = document.getElementById('bulk-pattern').value;
            const existingCount = this.state.clients.length;

            for (let i = 1; i <= count; i++) {
                const name = pattern.replace('{n}', existingCount + i);
                this.addClient(name);
            }

            modal.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
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

        document.getElementById('export-zip').addEventListener('click', () => {
            this.downloadZip();
        });
    },

    getExporter(platform) {
        const exporters = {
            'standard': StandardExporter,
            'mikrotik': MikroTikExporter,
            'vyos': VyOSExporter,
            'fritzbox': FritzBoxExporter,
            'opnsense': OPNsenseExporter,
            'edgerouter': EdgeRouterExporter,
            'glinet': GLiNetExporter,
            'teltonika': TeltonikaExporter
        };
        return exporters[platform] || StandardExporter;
    },

    showExportPreview() {
        const platform = document.getElementById('export-platform').value;
        const type = document.getElementById('export-type').value;
        const exporter = this.getExporter(platform);

        let config = '';

        if (type === 'server') {
            config = exporter.exportServer(this.state.server, this.state.clients);
        } else if (type === 'all-clients') {
            config = '# Client Configurations\n\n';
            this.state.clients.forEach((client, index) => {
                config += `# Client ${index + 1}: ${client.name}\n`;
                config += exporter.exportClient(client, this.state.server);
                config += '\n\n';
            });
        } else if (type === 'complete') {
            config = exporter.exportComplete(this.state.server, this.state.clients, this.state.dyndns);
        }

        document.getElementById('export-code').textContent = config;
    },

    downloadExport() {
        const platform = document.getElementById('export-platform').value;
        const type = document.getElementById('export-type').value;
        const exporter = this.getExporter(platform);

        let config = '';
        let filename = '';

        if (type === 'server') {
            config = exporter.exportServer(this.state.server, this.state.clients);
            filename = `wireguard-server.${exporter.fileExtension}`;
        } else if (type === 'all-clients') {
            config = '# Client Configurations\n\n';
            this.state.clients.forEach((client, index) => {
                config += `# Client ${index + 1}: ${client.name}\n`;
                config += exporter.exportClient(client, this.state.server);
                config += '\n\n';
            });
            filename = `wireguard-clients.${exporter.fileExtension}`;
        } else if (type === 'complete') {
            config = exporter.exportComplete(this.state.server, this.state.clients, this.state.dyndns);
            filename = `wireguard-complete.${exporter.fileExtension}`;
        }

        const blob = new Blob([config], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    },

    downloadZip() {
        if (typeof JSZip === 'undefined') {
            alert('JSZip library not loaded. Please add jszip.min.js to lib/ folder.');
            return;
        }

        const platform = document.getElementById('export-platform').value;
        const exporter = this.getExporter(platform);
        const zip = new JSZip();

        const serverConfig = exporter.exportServer(this.state.server, this.state.clients);
        zip.file(`server.${exporter.fileExtension}`, serverConfig);

        this.state.clients.forEach((client, index) => {
            const clientConfig = exporter.exportClient(client, this.state.server);
            const filename = `${client.name.replace(/[^a-z0-9]/gi, '_')}.${exporter.fileExtension}`;
            zip.file(`clients/${filename}`, clientConfig);
        });

        if (this.state.dyndns && this.state.dyndns.enabled && this.state.dyndns.domain) {
            const dyndnsInfo = `DynDNS Configuration for ${platform}\n\n`;
            if (exporter.exportDynDNS) {
                zip.file('dyndns.txt', dyndnsInfo + exporter.exportDynDNS(this.state.dyndns));
            }
        }

        zip.file('README.txt', `WireGuard Configuration Export\n\nPlatform: ${exporter.name}\nGenerated: ${new Date().toISOString()}\nServer: ${this.state.server.name}\nClients: ${this.state.clients.length}\n`);

        zip.generateAsync({ type: 'blob' }).then((content) => {
            if (typeof saveAs !== 'undefined') {
                saveAs(content, `wireguard-${platform}-${Date.now()}.zip`);
            } else {
                const url = URL.createObjectURL(content);
                const a = document.createElement('a');
                a.href = url;
                a.download = `wireguard-${platform}-${Date.now()}.zip`;
                a.click();
                URL.revokeObjectURL(url);
            }
        });
    },

    initSettings() {
        document.getElementById('theme-select').value = this.state.settings.theme;
        document.getElementById('language-select').value = this.state.settings.language;

        document.getElementById('theme-select').addEventListener('change', (e) => {
            this.state.settings.theme = e.target.value;
            this.applyTheme(e.target.value);
            this.autoSave();
        });

        document.getElementById('language-select').addEventListener('change', async (e) => {
            this.state.settings.language = e.target.value;
            if (typeof i18n !== 'undefined') {
                await i18n.switchLanguage(e.target.value);
            } else if (typeof i18nSimple !== 'undefined') {
                i18nSimple.switch(e.target.value);
            }
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
    },

    validateConfig() {
        const errors = Validator.validateComplete(this.state);
        return Validator.showValidationResults(errors);
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    if (typeof i18n !== 'undefined') {
        await i18n.init();
    } else if (typeof i18nSimple !== 'undefined') {
        i18nSimple.init();
    }

    App.init();

    const validateBtn = document.getElementById('validate-config');
    if (validateBtn) {
        validateBtn.addEventListener('click', () => {
            App.validateConfig();
        });
    }

    if (typeof KeyboardShortcuts !== 'undefined') {
        KeyboardShortcuts.init();
    }
});
