const OPNsenseExporter = {
    name: 'OPNsense',
    fileExtension: 'txt',

    exportServer(server, clients) {
        let guide = '# OPNsense WireGuard Configuration Guide\n';
        guide += '# Configure via: VPN > WireGuard > Instances\n\n';

        guide += '## Step 1: Create WireGuard Instance\n';
        guide += '1. Navigate to VPN > WireGuard > Instances\n';
        guide += '2. Click "+" to add new instance\n\n';

        guide += 'Configuration:\n';
        guide += `- Name: ${server.name}\n`;
        guide += `- Public Key: ${server.publicKey}\n`;
        guide += `- Private Key: ${server.privateKey}\n`;
        guide += `- Listen Port: ${server.listenPort}\n`;
        guide += `- Tunnel Address: ${server.addresses.join(', ')}\n`;
        guide += `- MTU: ${server.mtu}\n\n`;

        guide += '## Step 2: Add Peers\n';
        guide += 'Navigate to VPN > WireGuard > Peers\n\n';

        clients.forEach((client, index) => {
            guide += `### Peer ${index + 1}: ${client.name}\n`;
            guide += `- Name: ${client.name}\n`;
            guide += `- Public Key: ${client.publicKey}\n`;
            if (client.preSharedKey) {
                guide += `- Pre-Shared Key: ${client.preSharedKey}\n`;
            }
            guide += `- Allowed IPs: ${client.address}/32\n`;
            guide += `- Endpoint: (leave empty for road warrior)\n\n`;
        });

        guide += '## Step 3: Configure Firewall\n';
        guide += 'Navigate to Firewall > Rules > WAN\n\n';
        guide += 'Add rule:\n';
        guide += '- Action: Pass\n';
        guide += '- Interface: WAN\n';
        guide += '- Protocol: UDP\n';
        guide += `- Destination Port: ${server.listenPort}\n`;
        guide += '- Description: WireGuard\n\n';

        guide += '## Step 4: Enable Instance\n';
        guide += 'Navigate to VPN > WireGuard > Instances\n';
        guide += 'Enable the instance checkbox and apply\n';

        return guide;
    },

    exportClient(client, server) {
        return StandardExporter.exportClient(client, server);
    },

    exportDynDNS(dyndns) {
        if (!dyndns.apiKey || !dyndns.domain) return '';

        let guide = '\n## DynDNS Configuration (IPv64.net)\n';
        guide += 'Navigate to Services > Dynamic DNS\n\n';
        guide += 'Configuration:\n';
        guide += '- Service Type: Custom\n';
        guide += '- Protocol: DynDns2\n';
        guide += '- Server: ipv64.net\n';
        guide += '- Username: none\n';
        guide += `- Password: ${dyndns.apiKey}\n`;
        guide += `- Hostname: ${dyndns.domain}\n`;
        guide += '- Check IP Method: ipify-ipv4 or ipify-ipv6\n';
        guide += '- Force SSL: Yes\n';

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
