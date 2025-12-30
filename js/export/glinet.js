const GLiNetExporter = {
    name: 'GL.iNet Router',
    fileExtension: 'conf',

    exportServer(server, clients) {
        let output = '# GL.iNet WireGuard Server Configuration\n';
        output += '# Import via: VPN > WireGuard Server\n\n';
        output += StandardExporter.exportServer(server, clients);
        return output;
    },

    exportClient(client, server) {
        let config = '# GL.iNet WireGuard Client Configuration\n';
        config += '# Import via: VPN > WireGuard Client > Set Up WireGuard Manually\n';
        config += '# You can paste this config or upload the .conf file\n\n';

        config += StandardExporter.exportClient(client, server);

        config += '\n# GL.iNet Specific Settings:\n';
        config += '# - Enable "Block Non-VPN Traffic" for kill switch\n';
        config += '# - Enable "Auto Reconnect" for reliability\n';
        config += '# - MTU is optimized for travel routers (1420)\n';

        return config;
    },

    exportComplete(server, clients, dyndns) {
        let output = '# GL.iNet Complete WireGuard Setup\n\n';
        output += this.exportServer(server, clients);

        output += '\n\n# ========================================\n';
        output += '# Client Configurations for GL.iNet\n';
        output += '# ========================================\n\n';

        clients.forEach((client, index) => {
            output += `# Client ${index + 1}: ${client.name}\n`;
            output += this.exportClient(client, server);
            output += '\n\n';
        });

        return output;
    }
};
