const i18n = {
    currentLang: 'en',
    translations: {},

    async init() {
        const savedLang = localStorage.getItem('wg-language') || 'en';
        await this.loadLanguage(savedLang);
        this.applyTranslations();
    },

    async loadLanguage(lang) {
        try {
            const response = await fetch(`lang/${lang}.json`);
            if (!response.ok) throw new Error('Language file not found');
            this.translations = await response.json();
            this.currentLang = lang;
            localStorage.setItem('wg-language', lang);
        } catch (error) {
            console.error('Failed to load language:', error);
            if (lang !== 'en') {
                await this.loadLanguage('en');
            }
        }
    },

    async switchLanguage(lang) {
        await this.loadLanguage(lang);
        this.applyTranslations();

        if (typeof App !== 'undefined') {
            App.state.settings.language = lang;
            App.autoSave();
        }
    },

    t(path) {
        const keys = path.split('.');
        let value = this.translations;

        for (const key of keys) {
            if (value && typeof value === 'object') {
                value = value[key];
            } else {
                return path;
            }
        }

        return value || path;
    },

    applyTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);

            if (element.tagName === 'INPUT' && element.type !== 'checkbox' && element.type !== 'radio') {
                if (element.hasAttribute('placeholder')) {
                    element.placeholder = translation;
                }
            } else {
                element.textContent = translation;
            }
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = this.t(key);
        });

        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            element.title = this.t(key);
        });
    }
};
