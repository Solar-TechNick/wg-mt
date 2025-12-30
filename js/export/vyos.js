const VyOSExporter = {
    name: 'VyOS',
    fileExtension: 'txt',

    exportServer(server, clients) {
        let config = '# VyOS WireGuard Configuration\n';
        config += '# Enter configuration mode: configure\n\n';

        config += `set interfaces wireguard wg0 private-key '${server.privateKey}'\n`;
        config += `set interfaces wireguard wg0 port '${server.listenPort}'\n`;

        server.addresses.forEach(addr => {
            config += `set interfaces wireguard wg0 address '${addr}/24'\n`;
        });

        if (server.mtu) {
            config += `set interfaces wireguard wg0 mtu '${server.mtu}'\n`;
        }

        config += '\n';

        clients.forEach((client, index) => {
            const peerName = client.name.replace(/[^a-zA-Z0-9]/g, '_');
            config += `set interfaces wireguard wg0 peer ${peerName} public-key '${client.publicKey}'\n`;
            if (client.preSharedKey) {
                config += `set interfaces wireguard wg0 peer ${peerName} preshared-key '${client.preSharedKey}'\n`;
            }
            config += `set interfaces wireguard wg0 peer ${peerName} allowed-ips '${client.address}/32'\n`;
            if (client.persistentKeepalive) {
                config += `set interfaces wireguard wg0 peer ${peerName} persistent-keepalive '${client.persistentKeepalive}'\n`;
            }
            config += '\n';
        });

        config += '# Firewall configuration\n';
        config += `set firewall name WAN_LOCAL rule 10 action 'accept'\n`;
        config += `set firewall name WAN_LOCAL rule 10 protocol 'udp'\n`;
        config += `set firewall name WAN_LOCAL rule 10 destination port '${server.listenPort}'\n`;
        config += `set firewall name WAN_LOCAL rule 10 description 'WireGuard'\n\n`;

        if (server.enableNAT) {
            config += '# NAT configuration\n';
            config += `set nat source rule 100 outbound-interface 'wg0'\n`;
            config += `set nat source rule 100 translation address 'masquerade'\n\n`;
        }

        config += '# Apply configuration\n';
        config += 'commit\n';
        config += 'save\n';

        return config;
    },

    exportClient(client, server) {
        return StandardExporter.exportClient(client, server);
    },

    exportDynDNS(dyndns) {
        if (!dyndns.apiKey || !dyndns.domain) return '';

        let config = '\n# IPv64.net DynDNS Configuration\n';
        config += `set service dns dynamic interface eth0 service ipv64 host-name '${dyndns.domain}'\n`;
        config += `set service dns dynamic interface eth0 service ipv64 login 'nobody'\n`;
        config += `set service dns dynamic interface eth0 service ipv64 password '${dyndns.apiKey}'\n`;
        config += `set service dns dynamic interface eth0 service ipv64 protocol 'dyndns2'\n`;
        config += `set service dns dynamic interface eth0 service ipv64 server 'ipv64.net'\n\n`;

        config += 'commit\n';
        config += 'save\n';

        return config;
    },

    exportComplete(server, clients, dyndns) {
        let output = this.exportServer(server, clients);

        if (dyndns && dyndns.apiKey) {
            output += this.exportDynDNS(dyndns);
        }

        return output;
    }
};
