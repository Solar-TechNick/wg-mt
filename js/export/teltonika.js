const TeltonikaExporter = {
    name: 'Teltonika RUT',
    fileExtension: 'txt',

    exportServer(server, clients) {
        let guide = '# Teltonika RUT WireGuard Configuration Guide\n';
        guide += '# Note: Teltonika does NOT support config file import\n';
        guide += '# Manual configuration required via WebUI\n\n';

        guide += '## Step 1: Enable WireGuard\n';
        guide += '1. Navigate to Services > VPN > WireGuard\n';
        guide += '2. Enable WireGuard service\n\n';

        guide += '## Step 2: Configure WireGuard Instance\n';
        guide += 'Click "Add" to create new instance:\n\n';

        guide += 'General Settings:\n';
        guide += `- Name: ${server.name}\n`;
        guide += `- Private Key: ${server.privateKey}\n`;
        guide += `- Listen Port: ${server.listenPort}\n`;
        guide += `- IP Address: ${server.addresses[0]}\n`;
        guide += `- Subnet Mask: 255.255.255.0 (or appropriate for your subnet)\n\n`;

        if (server.mtu) {
            guide += `- MTU: ${server.mtu}\n\n`;
        }

        guide += '## Step 3: Add Peers\n';
        guide += 'For each client, click "Add Peer":\n\n';

        clients.forEach((client, index) => {
            guide += `### Peer ${index + 1}: ${client.name}\n`;
            guide += `- Public Key: ${client.publicKey}\n`;
            if (client.preSharedKey) {
                guide += `- Pre-Shared Key: ${client.preSharedKey}\n`;
            }
            guide += `- Allowed IPs: ${client.address}/32\n`;
            if (client.persistentKeepalive) {
                guide += `- Persistent Keepalive: ${client.persistentKeepalive}\n`;
            }
            guide += `- Endpoint: (leave empty for incoming connections)\n\n`;
        });

        guide += '## Step 4: Firewall Configuration\n';
        guide += 'Navigate to Network > Firewall > General Settings\n\n';
        guide += 'Add custom rule:\n';
        guide += '- Name: WireGuard\n';
        guide += '- Protocol: UDP\n';
        guide += `- Port: ${server.listenPort}\n`;
        guide += '- Action: Accept\n\n';

        guide += '## Step 5: Apply Configuration\n';
        guide += 'Click "Save & Apply" to activate WireGuard\n\n';

        guide += '## Client Configuration Files\n';
        guide += 'Standard .conf files for clients:\n\n';

        return guide;
    },

    exportClient(client, server) {
        return StandardExporter.exportClient(client, server);
    },

    exportComplete(server, clients, dyndns) {
        let output = this.exportServer(server, clients);

        clients.forEach((client, index) => {
            output += `\n# ${client.name} Configuration\n`;
            output += this.exportClient(client, server);
            output += '\n';
        });

        return output;
    }
};
