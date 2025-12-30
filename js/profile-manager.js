const ProfileManager = {
    STORAGE_KEY: 'wg-profiles',
    CURRENT_KEY: 'wg-current-profile',
    VERSION: '1.0',

    createProfile(name, data) {
        const profile = {
            id: this.generateId(),
            name: name || 'New Profile',
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            version: this.VERSION,
            server: data.server || {},
            clients: data.clients || [],
            ipPool: data.ipPool || {},
            dyndns: data.dyndns || {},
            settings: data.settings || this.getDefaultSettings()
        };

        this.saveProfile(profile);
        return profile;
    },

    saveProfile(profile) {
        profile.modified = new Date().toISOString();
        const profiles = this.getAllProfiles();
        const index = profiles.findIndex(p => p.id === profile.id);

        if (index > -1) {
            profiles[index] = profile;
        } else {
            profiles.push(profile);
        }

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(profiles));
        return profile;
    },

    getProfile(id) {
        const profiles = this.getAllProfiles();
        return profiles.find(p => p.id === id) || null;
    },

    getAllProfiles() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Failed to load profiles:', e);
            return [];
        }
    },

    deleteProfile(id) {
        const profiles = this.getAllProfiles();
        const filtered = profiles.filter(p => p.id !== id);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));

        if (this.getCurrentProfileId() === id) {
            localStorage.removeItem(this.CURRENT_KEY);
        }
    },

    getCurrentProfile() {
        const id = this.getCurrentProfileId();
        return id ? this.getProfile(id) : null;
    },

    getCurrentProfileId() {
        return localStorage.getItem(this.CURRENT_KEY);
    },

    setCurrentProfile(id) {
        localStorage.setItem(this.CURRENT_KEY, id);
    },

    exportProfile(id) {
        const profile = this.getProfile(id);
        if (!profile) return null;

        const json = JSON.stringify(profile, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${profile.name.replace(/[^a-z0-9]/gi, '_')}_${profile.id}.json`;
        a.click();
        URL.revokeObjectURL(url);

        return profile;
    },

    importProfile(jsonString) {
        try {
            const profile = JSON.parse(jsonString);

            if (!profile.id || !profile.version) {
                throw new Error('Invalid profile format');
            }

            profile.id = this.generateId();
            profile.created = new Date().toISOString();
            profile.modified = new Date().toISOString();

            this.saveProfile(profile);
            return profile;
        } catch (e) {
            console.error('Failed to import profile:', e);
            return null;
        }
    },

    duplicateProfile(id) {
        const original = this.getProfile(id);
        if (!original) return null;

        const duplicate = JSON.parse(JSON.stringify(original));
        duplicate.id = this.generateId();
        duplicate.name = `${original.name} (Copy)`;
        duplicate.created = new Date().toISOString();
        duplicate.modified = new Date().toISOString();

        this.saveProfile(duplicate);
        return duplicate;
    },

    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },

    getDefaultSettings() {
        return {
            defaultKeepalive: 25,
            defaultDNS: ['1.1.1.1', '1.0.0.1'],
            defaultMTU: 1420,
            enablePSK: true,
            enableNAT: true,
            theme: 'system',
            language: 'en'
        };
    },

    autoSave(data) {
        let currentId = this.getCurrentProfileId();

        if (!currentId) {
            const profile = this.createProfile('Auto-saved Profile', data);
            this.setCurrentProfile(profile.id);
            return profile;
        } else {
            const profile = this.getProfile(currentId);
            if (profile) {
                profile.server = data.server;
                profile.clients = data.clients;
                profile.ipPool = data.ipPool;
                profile.dyndns = data.dyndns;
                profile.settings = data.settings;
                this.saveProfile(profile);
                return profile;
            }
        }
    }
};
