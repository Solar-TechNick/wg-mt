// Simple inline i18n without file loading - fallback if files don't load
const i18nSimple = {
    translations: {
        en: {
            nav: { server: "Server", clients: "Clients", siteToSite: "Site-to-Site", export: "Export", profiles: "Profiles", settings: "Settings" },
            server: { title: "Server Configuration", name: "Server Name" },
            clients: { title: "Client Management", add: "Add Client", bulkGenerate: "Bulk Generate" },
            s2s: { title: "Site-to-Site Configuration" },
            export: { title: "Export Configurations" },
            profiles: { title: "Profiles", new: "New Profile", import: "Import" },
            settings: { title: "Settings", theme: "Theme", language: "Language", validate: "Validate Configuration" }
        },
        de: {
            nav: { server: "Server", clients: "Clients", siteToSite: "Site-to-Site", export: "Export", profiles: "Profile", settings: "Einstellungen" },
            server: { title: "Server-Konfiguration", name: "Server-Name" },
            clients: { title: "Client-Verwaltung", add: "Client hinzufügen", bulkGenerate: "Mehrere generieren" },
            s2s: { title: "Site-to-Site-Konfiguration" },
            export: { title: "Konfigurationen exportieren" },
            profiles: { title: "Profile", new: "Neues Profil", import: "Importieren" },
            settings: { title: "Einstellungen", theme: "Design", language: "Sprache", validate: "Konfiguration validieren" }
        }
    },

    currentLang: 'en',

    init() {
        const savedLang = localStorage.getItem('wg-language') || 'en';
        this.currentLang = savedLang;
        this.apply();
    },

    switch(lang) {
        this.currentLang = lang;
        localStorage.setItem('wg-language', lang);
        this.apply();
    },

    t(path) {
        const keys = path.split('.');
        let value = this.translations[this.currentLang];
        for (const key of keys) {
            if (value && typeof value === 'object') {
                value = value[key];
            } else {
                return path;
            }
        }
        return value || path;
    },

    apply() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = this.t(key);
        });
    }
};
