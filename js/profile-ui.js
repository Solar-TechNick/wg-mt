const ProfileUI = {
    init() {
        document.getElementById('new-profile').addEventListener('click', () => {
            const name = prompt('Enter profile name:', 'New Profile');
            if (name) {
                const profile = ProfileManager.createProfile(name, {
                    server: App.state.server,
                    clients: App.state.clients,
                    ipPool: App.state.ipPool,
                    dyndns: App.state.dyndns,
                    settings: App.state.settings
                });
                ProfileManager.setCurrentProfile(profile.id);
                this.render();
            }
        });

        document.getElementById('import-profile').addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const profile = ProfileManager.importProfile(event.target.result);
                        if (profile) {
                            alert('Profile "' + profile.name + '" imported successfully');
                            this.render();
                        } else {
                            alert('Failed to import profile. Invalid format.');
                        }
                    };
                    reader.readAsText(file);
                }
            };
            input.click();
        });

        this.render();
    },

    render() {
        const container = document.getElementById('profiles-list');
        const profiles = ProfileManager.getAllProfiles();
        const currentId = ProfileManager.getCurrentProfileId();

        if (profiles.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No saved profiles. Your current configuration will be auto-saved.</p></div>';
            return;
        }

        container.innerHTML = profiles.map(profile => {
            const created = new Date(profile.created).toLocaleDateString();
            const isActive = profile.id === currentId;
            return `
                <div class="profile-card ${isActive ? 'profile-active' : ''}" onclick="ProfileUI.loadProfile('${profile.id}')">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div>
                            <h3 style="margin: 0 0 0.5rem 0;">${profile.name}</h3>
                            <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">
                                ${profile.clients.length} clients | Created: ${created}
                            </p>
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); ProfileUI.exportProfile('${profile.id}')">Export</button>
                            <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); ProfileUI.duplicateProfile('${profile.id}')">Duplicate</button>
                            <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); ProfileUI.deleteProfile('${profile.id}')">Delete</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    loadProfile(id) {
        const profile = ProfileManager.getProfile(id);
        if (profile) {
            App.state.server = profile.server;
            App.state.clients = profile.clients;
            App.state.ipPool = profile.ipPool;
            App.state.dyndns = profile.dyndns || App.state.dyndns;
            App.state.settings = profile.settings || App.state.settings;

            ProfileManager.setCurrentProfile(id);
            App.populateForm();
            App.renderClients();
            this.render();
            App.switchView('server');
        }
    },

    exportProfile(id) {
        ProfileManager.exportProfile(id);
    },

    duplicateProfile(id) {
        const profile = ProfileManager.duplicateProfile(id);
        if (profile) {
            alert('Profile duplicated as "' + profile.name + '"');
            this.render();
        }
    },

    deleteProfile(id) {
        if (confirm('Are you sure you want to delete this profile?')) {
            ProfileManager.deleteProfile(id);
            this.render();

            if (ProfileManager.getCurrentProfileId() === id) {
                location.reload();
            }
        }
    }
};
