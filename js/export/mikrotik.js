const MikroTikExporter = {
    name: 'MikroTik RouterOS',
    fileExtension: 'rsc',

    exportServer(server, clients) {
        let script = '# MikroTik RouterOS WireGuard Configuration\n';
        script += '# Paste into Terminal or save as .rsc and import\n\n';

        script += '/interface wireguard\n';
        script += `add name=wg0 listen-port=${server.listenPort} private-key="${server.privateKey}"\n\n`;

        script += '/ip address\n';
        server.addresses.forEach(addr => {
            script += `add address=${addr}/24 interface=wg0\n`;
        });

        script += '\n/interface wireguard peers\n';
        clients.forEach(client => {
            script += `add interface=wg0 public-key="${client.publicKey}"`;
            if (client.preSharedKey) {
                script += ` preshared-key="${client.preSharedKey}"`;
            }
            script += ` allowed-address=${client.address}/32`;
            script += ` comment="${client.name}"\n`;
        });

        script += '\n/ip firewall filter\n';
        script += `add chain=input protocol=udp dst-port=${server.listenPort} action=accept place-before=0 comment="WireGuard"\n`;

        if (server.enableNAT) {
            script += '\n/ip firewall nat\n';
            script += 'add chain=srcnat out-interface=wg0 action=masquerade comment="WireGuard NAT"\n';
        }

        return script;
    },

    exportClient(client, server) {
        return StandardExporter.exportClient(client, server);
    },

    exportDynDNS(dyndns) {
        if (!dyndns.apiKey || !dyndns.domain) return '';

        let script = '\n# IPv64.net DynDNS Configuration\n';
        script += '/system scheduler\n';
        script += 'add name="ipv64-dyndns" interval=1h on-event={\n';
        script += `  /tool fetch url="https://ipv64.net/nic/update?key=${dyndns.apiKey}&domain=${dyndns.domain}" keep-result=no\n`;
        script += '} comment="IPv64.net DynDNS Update"\n';

        return script;
    },

    exportComplete(server, clients, dyndns) {
        let output = this.exportServer(server, clients);

        if (dyndns && dyndns.apiKey) {
            output += this.exportDynDNS(dyndns);
        }

        output += '\n# Configuration complete!\n';
        output += '# Server is now ready to accept WireGuard connections\n';

        return output;
    }
};
