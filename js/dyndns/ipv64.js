const IPv64DynDNS = {
    name: 'IPv64.net',
    baseURL: 'https://ipv64.net/nic/update',

    buildUpdateURL(apiKey, domain) {
        return `${this.baseURL}?key=${apiKey}&domain=${domain}`;
    },

    buildUpdateURLWithIP(apiKey, domain, ipv4, ipv6) {
        let url = `${this.baseURL}?key=${apiKey}&domain=${domain}`;
        if (ipv4) url += `&ip=${ipv4}`;
        if (ipv6) url += `&ip6=${ipv6}`;
        return url;
    },

    validateDomain(domain) {
        if (!domain) return false;
        const pattern = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.ipv64\.net$/;
        return pattern.test(domain);
    },

    validateAPIKey(key) {
        return key && key.length > 0;
    },

    generateMikroTikScript(apiKey, domain) {
        return `/system scheduler add name="ipv64-dyndns" interval=1h on-event={\n  /tool fetch url="${this.buildUpdateURL(apiKey, domain)}" keep-result=no\n} comment="IPv64.net DynDNS Update"`;
    },

    generateVyOSConfig(apiKey, domain) {
        let config = '';
        config += `set service dns dynamic interface eth0 service ipv64 host-name '${domain}'\n`;
        config += `set service dns dynamic interface eth0 service ipv64 login 'nobody'\n`;
        config += `set service dns dynamic interface eth0 service ipv64 password '${apiKey}'\n`;
        config += `set service dns dynamic interface eth0 service ipv64 protocol 'dyndns2'\n`;
        config += `set service dns dynamic interface eth0 service ipv64 server 'ipv64.net'\n`;
        return config;
    },

    generateFritzBoxGuide(apiKey, domain) {
        let guide = 'Fritz!Box DynDNS Configuration:\n\n';
        guide += '1. Navigate to: Internet > Freigaben > DynDNS\n';
        guide += '2. DynDNS-Anbieter: Benutzerdefiniert\n';
        guide += `3. Update-URL: ${this.buildUpdateURLWithIP(apiKey, domain, '<ipaddr>', '<ip6addr>')}\n`;
        guide += `4. Domainname: ${domain}\n`;
        guide += '5. Benutzername: none (must not be empty)\n';
        guide += '6. Kennwort: none (must not be empty)\n';
        return guide;
    },

    generateOPNsenseConfig(apiKey, domain) {
        let guide = 'OPNsense DynDNS Configuration:\n\n';
        guide += 'Navigate to: Services > Dynamic DNS\n\n';
        guide += 'Service Type: Custom\n';
        guide += 'Protocol: DynDns2\n';
        guide += 'Server: ipv64.net\n';
        guide += 'Username: none\n';
        guide += `Password: ${apiKey}\n`;
        guide += `Hostname: ${domain}\n`;
        guide += 'Check IP Method: ipify-ipv4 or ipify-ipv6\n';
        guide += 'Force SSL: Yes\n';
        return guide;
    },

    generateLinuxCron(apiKey, domain) {
        return `# Add to crontab -e:\n0 */2 * * * curl -sSL "${this.buildUpdateURL(apiKey, domain)}"`;
    }
};
