const EdgeRouterExporter = {
    name: 'Ubiquiti EdgeRouter',
    fileExtension: 'txt',

    exportServer(server, clients) {
        let config = '# Ubiquiti EdgeRouter WireGuard Configuration\n';
        config += '# SSH into EdgeRouter and enter configuration mode\n\n';

        config += 'configure\n\n';

        config += `set interfaces wireguard wg0 private-key ${server.privateKey}\n`;
        config += `set interfaces wireguard wg0 listen-port ${server.listenPort}\n`;

        server.addresses.forEach(addr => {
            config += `set interfaces wireguard wg0 address ${addr}/24\n`;
        });

        if (server.mtu) {
            config += `set interfaces wireguard wg0 mtu ${server.mtu}\n`;
        }

        config += 'set interfaces wireguard wg0 route-allowed-ips true\n\n';

        clients.forEach(client => {
            config += `set interfaces wireguard wg0 peer ${client.publicKey} allowed-ips ${client.address}/32\n`;
            if (client.preSharedKey) {
                config += `set interfaces wireguard wg0 peer ${client.publicKey} preshared-key ${client.preSharedKey}\n`;
            }
            if (client.persistentKeepalive) {
                config += `set interfaces wireguard wg0 peer ${client.publicKey} persistent-keepalive ${client.persistentKeepalive}\n`;
            }
        });

        config += '\n# Firewall rule to allow WireGuard\n';
        config += `set firewall name WAN_LOCAL rule 20 action accept\n`;
        config += `set firewall name WAN_LOCAL rule 20 protocol udp\n`;
        config += `set firewall name WAN_LOCAL rule 20 destination port ${server.listenPort}\n`;
        config += `set firewall name WAN_LOCAL rule 20 description "WireGuard"\n\n`;

        if (server.enableNAT) {
            config += '# NAT masquerade for VPN clients\n';
            config += `set service nat rule 5000 outbound-interface wg0\n`;
            config += `set service nat rule 5000 type masquerade\n`;
            config += `set service nat rule 5000 description "WireGuard NAT"\n\n`;
        }

        config += 'commit\n';
        config += 'save\n';
        config += 'exit\n';

        return config;
    },

    exportClient(client, server) {
        return StandardExporter.exportClient(client, server);
    },

    exportComplete(server, clients, dyndns) {
        return this.exportServer(server, clients);
    }
};
