const KeyboardShortcuts = {
    init() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 's':
                        e.preventDefault();
                        this.saveProfile();
                        break;
                    case 'n':
                        e.preventDefault();
                        this.addNewClient();
                        break;
                    case 'e':
                        e.preventDefault();
                        this.switchToExport();
                        break;
                    case 'g':
                        e.preventDefault();
                        this.generateServerKeys();
                        break;
                }
            } else if (e.key === 'Escape') {
                this.closeModals();
            } else if (e.key === '?') {
                e.preventDefault();
                this.showHelp();
            }
        });
    },

    saveProfile() {
        const name = prompt('Enter profile name:', 'New Profile');
        if (name && typeof ProfileManager !== 'undefined' && typeof App !== 'undefined') {
            const profile = ProfileManager.createProfile(name, {
                server: App.state.server,
                clients: App.state.clients,
                ipPool: App.state.ipPool,
                dyndns: App.state.dyndns,
                settings: App.state.settings
            });
            ProfileManager.setCurrentProfile(profile.id);
            if (typeof ProfileUI !== 'undefined') {
                ProfileUI.render();
            }
        }
    },

    addNewClient() {
        const currentView = document.querySelector('.view.active');
        if (currentView && currentView.id !== 'view-clients') {
            if (typeof App !== 'undefined') {
                App.switchView('clients');
            }
        }
        setTimeout(() => {
            if (typeof App !== 'undefined') {
                App.addClient();
            }
        }, 100);
    },

    switchToExport() {
        if (typeof App !== 'undefined') {
            App.switchView('export');
        }
    },

    generateServerKeys() {
        const currentView = document.querySelector('.view.active');
        if (currentView && currentView.id === 'view-server') {
            const btn = document.getElementById('generate-server-keys');
            if (btn) {
                btn.click();
            }
        }
    },

    closeModals() {
        const modals = document.querySelectorAll('.qr-modal, .bulk-modal');
        modals.forEach(modal => modal.remove());
    },

    showHelp() {
        const modal = document.createElement('div');
        modal.className = 'qr-modal';
        modal.innerHTML = `
            <div class="qr-modal-content">
                <div class="qr-modal-header">
                    <h3>Keyboard Shortcuts</h3>
                    <button class="qr-modal-close" onclick="this.closest('.qr-modal').remove()">&times;</button>
                </div>
                <div class="qr-modal-body" style="text-align: left;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="border-bottom: 1px solid var(--border-color);">
                            <th style="padding: 0.75rem; text-align: left;">Shortcut</th>
                            <th style="padding: 0.75rem; text-align: left;">Action</th>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border-color);">
                            <td style="padding: 0.75rem;"><code>Ctrl+S</code></td>
                            <td style="padding: 0.75rem;">Save Profile</td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border-color);">
                            <td style="padding: 0.75rem;"><code>Ctrl+N</code></td>
                            <td style="padding: 0.75rem;">Add New Client</td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border-color);">
                            <td style="padding: 0.75rem;"><code>Ctrl+E</code></td>
                            <td style="padding: 0.75rem;">Switch to Export View</td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border-color);">
                            <td style="padding: 0.75rem;"><code>Ctrl+G</code></td>
                            <td style="padding: 0.75rem;">Generate Server Keys</td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border-color);">
                            <td style="padding: 0.75rem;"><code>Escape</code></td>
                            <td style="padding: 0.75rem;">Close Modals</td>
                        </tr>
                        <tr>
                            <td style="padding: 0.75rem;"><code>?</code></td>
                            <td style="padding: 0.75rem;">Show This Help</td>
                        </tr>
                    </table>
                    <p style="margin-top: 1rem; color: var(--text-secondary); font-size: 0.9rem;">
                        On Mac, use <code>Cmd</code> instead of <code>Ctrl</code>
                    </p>
                </div>
                <div class="qr-modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.qr-modal').remove()">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
};
