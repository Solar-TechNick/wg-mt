const ConfigGenerator = {
    generateServerConfig(server, clients = []) {
        let config = '[Interface]\n';
        config += `PrivateKey = ${server.privateKey}\n`;
        config += `Address = ${server.addresses.join(', ')}\n`;
        config += `ListenPort = ${server.listenPort}\n`;

        if (server.mtu) {
            config += `MTU = ${server.mtu}\n`;
        }

        if (server.dns && server.dns.length > 0) {
            config += `DNS = ${server.dns.join(', ')}\n`;
        }

        if (server.postUp) {
            config += `PostUp = ${server.postUp}\n`;
        }

        if (server.postDown) {
            config += `PostDown = ${server.postDown}\n`;
        }

        clients.forEach(client => {
            config += '\n[Peer]\n';
            config += `PublicKey = ${client.publicKey}\n`;

            if (client.preSharedKey) {
                config += `PresharedKey = ${client.preSharedKey}\n`;
            }

            config += `AllowedIPs = ${client.address}/32\n`;
        });

        return config;
    },

    generateClientConfig(client, server) {
        let config = '[Interface]\n';
        config += `PrivateKey = ${client.privateKey}\n`;
        config += `Address = ${client.address}/32\n`;

        if (client.dns && client.dns.length > 0) {
            config += `DNS = ${client.dns.join(', ')}\n`;
        }

        if (client.mtu || server.mtu) {
            config += `MTU = ${client.mtu || server.mtu}\n`;
        }

        config += '\n[Peer]\n';
        config += `PublicKey = ${server.publicKey}\n`;

        if (client.preSharedKey) {
            config += `PresharedKey = ${client.preSharedKey}\n`;
        }

        if (server.endpoint) {
            config += `Endpoint = ${server.endpoint}:${server.listenPort}\n`;
        }

        const allowedIPs = client.allowedIPs && client.allowedIPs.length > 0
            ? client.allowedIPs.join(', ')
            : '0.0.0.0/0, ::/0';
        config += `AllowedIPs = ${allowedIPs}\n`;

        if (client.persistentKeepalive !== undefined) {
            config += `PersistentKeepalive = ${client.persistentKeepalive}\n`;
        }

        return config;
    },

    generatePostUpScript(enableNAT, interfaceName = 'wg0') {
        if (!enableNAT) return '';

        return `iptables -A FORWARD -i ${interfaceName} -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE`;
    },

    generatePostDownScript(enableNAT, interfaceName = 'wg0') {
        if (!enableNAT) return '';

        return `iptables -D FORWARD -i ${interfaceName} -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE`;
    },

    buildServerModel(formData) {
        return {
            name: formData.name || 'VPN Server',
            privateKey: formData.privateKey,
            publicKey: formData.publicKey,
            listenPort: formData.listenPort || 51820,
            addresses: formData.addresses || [],
            dns: formData.dns || [],
            mtu: formData.mtu || 1420,
            endpoint: formData.endpoint || '',
            postUp: formData.postUp || '',
            postDown: formData.postDown || ''
        };
    },

    buildClientModel(formData, serverData) {
        return {
            id: formData.id || Date.now().toString(),
            name: formData.name || 'Client',
            privateKey: formData.privateKey,
            publicKey: formData.publicKey,
            preSharedKey: formData.preSharedKey || '',
            address: formData.address,
            allowedIPs: formData.allowedIPs || [],
            dns: formData.dns || serverData.dns || [],
            persistentKeepalive: formData.persistentKeepalive !== undefined ? formData.persistentKeepalive : 25,
            mtu: formData.mtu || serverData.mtu || 1420
        };
    },

    calculateAllowedIPs(mode, customNetworks = []) {
        switch (mode) {
            case 'full-tunnel':
                return ['0.0.0.0/0', '::/0'];
            case 'split-tunnel':
                return customNetworks;
            case 'lan-only':
                return customNetworks;
            default:
                return ['0.0.0.0/0', '::/0'];
        }
    }
};
