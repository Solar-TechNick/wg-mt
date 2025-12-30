const Validator = {
    validateIPv4(ip) {
        const octets = ip.split('.');
        if (octets.length !== 4) return false;

        return octets.every(octet => {
            const num = parseInt(octet);
            return num >= 0 && num <= 255 && octet === num.toString();
        });
    },

    validateCIDR(cidr) {
        const parts = cidr.split('/');
        if (parts.length !== 2) return false;

        const ip = parts[0];
        const prefix = parseInt(parts[1]);

        return this.validateIPv4(ip) && prefix >= 0 && prefix <= 32;
    },

    validatePort(port) {
        const num = parseInt(port);
        return num >= 1 && num <= 65535;
    },

    validateKey(key) {
        if (!key || typeof key !== 'string') return false;
        if (key.length !== 44) return false;

        try {
            const decoded = atob(key);
            return decoded.length === 32;
        } catch (e) {
            return false;
        }
    },

    validateEndpoint(endpoint) {
        if (!endpoint) return true;

        const pattern = /^([a-zA-Z0-9.-]+|\[?[0-9a-fA-F:]+\]?)$/;
        return pattern.test(endpoint);
    },

    validateServerConfig(server) {
        const errors = [];

        if (!server.name || server.name.trim() === '') {
            errors.push('Server name is required');
        }

        if (!this.validatePort(server.listenPort)) {
            errors.push('Invalid listen port (must be 1-65535)');
        }

        if (!server.privateKey) {
            errors.push('Server private key is required');
        } else if (!this.validateKey(server.privateKey)) {
            errors.push('Invalid server private key format');
        }

        if (!server.publicKey) {
            errors.push('Server public key is required');
        } else if (!this.validateKey(server.publicKey)) {
            errors.push('Invalid server public key format');
        }

        if (server.addresses && server.addresses.length > 0) {
            server.addresses.forEach((addr, index) => {
                if (!this.validateIPv4(addr)) {
                    errors.push(`Invalid server address ${index + 1}: ${addr}`);
                }
            });
        } else {
            errors.push('At least one server address is required');
        }

        if (server.mtu && (server.mtu < 1280 || server.mtu > 1500)) {
            errors.push('MTU must be between 1280 and 1500');
        }

        if (server.dns && server.dns.length > 0) {
            server.dns.forEach((dns, index) => {
                if (!this.validateIPv4(dns)) {
                    errors.push(`Invalid DNS server ${index + 1}: ${dns}`);
                }
            });
        }

        return errors;
    },

    validateClientConfig(client, server) {
        const errors = [];

        if (!client.name || client.name.trim() === '') {
            errors.push('Client name is required');
        }

        if (!client.privateKey) {
            errors.push(`Client "${client.name}" private key is required`);
        } else if (!this.validateKey(client.privateKey)) {
            errors.push(`Client "${client.name}" has invalid private key format`);
        }

        if (!client.publicKey) {
            errors.push(`Client "${client.name}" public key is required`);
        } else if (!this.validateKey(client.publicKey)) {
            errors.push(`Client "${client.name}" has invalid public key format`);
        }

        if (client.preSharedKey && !this.validateKey(client.preSharedKey)) {
            errors.push(`Client "${client.name}" has invalid PSK format`);
        }

        if (!client.address) {
            errors.push(`Client "${client.name}" address is required`);
        } else if (!this.validateIPv4(client.address)) {
            errors.push(`Client "${client.name}" has invalid address: ${client.address}`);
        }

        if (client.persistentKeepalive !== undefined) {
            const ka = parseInt(client.persistentKeepalive);
            if (ka < 0 || ka > 300) {
                errors.push(`Client "${client.name}" keepalive must be 0-300 seconds`);
            }
        }

        return errors;
    },

    validateDynDNS(dyndns) {
        const errors = [];

        if (dyndns.enabled) {
            if (!dyndns.domain || dyndns.domain.trim() === '') {
                errors.push('DynDNS domain is required when enabled');
            } else if (!dyndns.domain.endsWith('.ipv64.net')) {
                errors.push('DynDNS domain must end with .ipv64.net');
            }

            if (!dyndns.apiKey || dyndns.apiKey.trim() === '') {
                errors.push('DynDNS API key is required when enabled');
            }
        }

        return errors;
    },

    validateComplete(state) {
        const errors = [];

        errors.push(...this.validateServerConfig(state.server));

        state.clients.forEach(client => {
            errors.push(...this.validateClientConfig(client, state.server));
        });

        const addresses = [state.server.addresses[0], ...state.clients.map(c => c.address)];
        const duplicates = addresses.filter((item, index) => addresses.indexOf(item) !== index);
        if (duplicates.length > 0) {
            errors.push(`Duplicate IP addresses found: ${duplicates.join(', ')}`);
        }

        const publicKeys = [state.server.publicKey, ...state.clients.map(c => c.publicKey)];
        const dupKeys = publicKeys.filter((item, index) => publicKeys.indexOf(item) !== index);
        if (dupKeys.length > 0) {
            errors.push('Duplicate public keys detected');
        }

        if (state.dyndns) {
            errors.push(...this.validateDynDNS(state.dyndns));
        }

        return errors;
    },

    showValidationResults(errors) {
        if (errors.length === 0) {
            alert('✓ Configuration is valid!');
            return true;
        }

        const message = 'Configuration Validation Errors:\n\n' + errors.map((err, i) => `${i + 1}. ${err}`).join('\n');
        alert(message);
        return false;
    }
};
