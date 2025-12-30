const StandardExporter = {
    name: 'WireGuard Standard',
    fileExtension: 'conf',

    exportServer(server, clients) {
        return ConfigGenerator.generateServerConfig(server, clients);
    },

    exportClient(client, server) {
        return ConfigGenerator.generateClientConfig(client, server);
    },

    exportComplete(server, clients) {
        let output = '';

        output += '# WireGuard Server Configuration\n';
        output += '# Save as /etc/wireguard/wg0.conf\n\n';
        output += this.exportServer(server, clients);

        output += '\n\n# ========================================\n';
        output += '# Client Configurations\n';
        output += '# ========================================\n\n';

        clients.forEach((client, index) => {
            output += `# Client ${index + 1}: ${client.name}\n`;
            output += `# IP: ${client.address}\n`;
            output += this.exportClient(client, server);
            output += '\n\n';
        });

        return output;
    }
};
