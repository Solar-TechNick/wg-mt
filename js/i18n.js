const i18n = {
    currentLang: 'en',
    translations: {},
    enabled: false,

    async init() {
        const savedLang = localStorage.getItem('wg-language') || 'en';
        await this.loadLanguage(savedLang);
        if (this.enabled) {
            this.applyTranslations();
        }
    },

    async loadLanguage(lang) {
        try {
            const response = await fetch(`lang/${lang}.json`);
            if (!response.ok) throw new Error('Language file not found');
            this.translations = await response.json();
            this.currentLang = lang;
            this.enabled = true;
            localStorage.setItem('wg-language', lang);
        } catch (error) {
            console.error('Failed to load language file:', error);
            this.enabled = false;
            if (lang !== 'en') {
                await this.loadLanguage('en');
            }
        }
    },

    async switchLanguage(lang) {
        await this.loadLanguage(lang);
        if (this.enabled) {
            this.applyTranslations();
        }

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
        if (!this.enabled) return;

        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);

            if (element.tagName === 'INPUT' && element.type !== 'checkbox' && element.type !== 'radio') {
                if (element.hasAttribute('placeholder')) {
                    element.placeholder = translation;
                }
            } else {
                if (!element.hasAttribute('data-i18n-original')) {
                    element.setAttribute('data-i18n-original', element.textContent);
                }
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
