const FritzBoxExporter = {
    name: 'AVM Fritz!Box',
    fileExtension: 'conf',

    exportServer(server, clients) {
        let output = '# Fritz!Box WireGuard Server Configuration\n';
        output += '# Import via: Internet > Freigaben > WireGuard\n\n';
        output += StandardExporter.exportServer(server, clients);
        output += '\n\n# Note: Fritz!Box may require manual peer configuration via WebUI\n';
        return output;
    },

    exportClient(client, server) {
        return StandardExporter.exportClient(client, server);
    },

    exportDynDNS(dyndns) {
        if (!dyndns.apiKey || !dyndns.domain) return '';

        let guide = '\n# Fritz!Box DynDNS Configuration for IPv64.net\n';
        guide += '# Configure via: Internet > Freigaben > DynDNS\n\n';
        guide += '1. DynDNS-Anbieter: Benutzerdefiniert\n';
        guide += `2. Update-URL: https://ipv64.net/nic/update?key=${dyndns.apiKey}&ip=<ipaddr>&ip6=<ip6addr>\n`;
        guide += `3. Domainname: ${dyndns.domain}\n`;
        guide += '4. Benutzername: none (must not be empty - type "none")\n';
        guide += '5. Kennwort: none (must not be empty - type "none")\n\n';
        guide += '# Note: Fritz!Box requires non-empty username/password fields\n';
        guide += '# The actual authentication is done via the API key in the URL\n';

        return guide;
    },

    exportComplete(server, clients, dyndns) {
        let output = this.exportServer(server, clients);

        if (dyndns && dyndns.apiKey) {
            output += this.exportDynDNS(dyndns);
        }

        return output;
    }
};
