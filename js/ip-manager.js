const IPManager = {
    parseCIDR(cidr) {
        const parts = cidr.split('/');
        if (parts.length !== 2) return null;

        const ip = parts[0];
        const prefix = parseInt(parts[1]);

        if (!this.validateIPv4(ip) || prefix < 0 || prefix > 32) return null;

        return { ip, prefix };
    },

    validateIPv4(ip) {
        const octets = ip.split('.');
        if (octets.length !== 4) return false;

        return octets.every(octet => {
            const num = parseInt(octet);
            return num >= 0 && num <= 255 && octet === num.toString();
        });
    },

    ipToInt(ip) {
        return ip.split('.').reduce((int, octet) => (int << 8) + parseInt(octet), 0) >>> 0;
    },

    intToIP(int) {
        return [
            (int >>> 24) & 255,
            (int >>> 16) & 255,
            (int >>> 8) & 255,
            int & 255
        ].join('.');
    },

    calculateSubnet(baseIP, maxConnections) {
        const subnetMap = [
            { max: 6, prefix: 29 },
            { max: 14, prefix: 28 },
            { max: 30, prefix: 27 },
            { max: 62, prefix: 26 },
            { max: 126, prefix: 25 },
            { max: 254, prefix: 24 },
            { max: 510, prefix: 23 },
            { max: 1022, prefix: 22 }
        ];

        const subnet = subnetMap.find(s => maxConnections <= s.max) || subnetMap[subnetMap.length - 1];
        return {
            cidr: `${baseIP}/${subnet.prefix}`,
            prefix: subnet.prefix,
            usableIPs: subnet.max
        };
    },

    getNetworkInfo(cidr) {
        const parsed = this.parseCIDR(cidr);
        if (!parsed) return null;

        const { ip, prefix } = parsed;
        const ipInt = this.ipToInt(ip);
        const hostBits = 32 - prefix;
        const totalIPs = Math.pow(2, hostBits);
        const usableIPs = totalIPs - 2;

        const mask = (-1 << hostBits) >>> 0;
        const networkInt = (ipInt & mask) >>> 0;
        const broadcastInt = (networkInt | ~mask) >>> 0;
        const firstUsableInt = networkInt + 1;
        const lastUsableInt = broadcastInt - 1;

        return {
            network: this.intToIP(networkInt),
            broadcast: this.intToIP(broadcastInt),
            firstUsable: this.intToIP(firstUsableInt),
            lastUsable: this.intToIP(lastUsableInt),
            totalIPs,
            usableIPs,
            prefix
        };
    },

    createIPPool(cidr) {
        const info = this.getNetworkInfo(cidr);
        if (!info) return null;

        const networkInt = this.ipToInt(info.network);
        const pool = [];

        for (let i = 1; i <= info.usableIPs; i++) {
            pool.push(this.intToIP(networkInt + i));
        }

        return {
            cidr,
            info,
            pool,
            assigned: [],
            reserved: [pool[0]]
        };
    },

    assignIP(ipPool) {
        const available = ipPool.pool.filter(ip =>
            !ipPool.assigned.includes(ip) && !ipPool.reserved.includes(ip)
        );

        if (available.length === 0) return null;

        const ip = available[0];
        ipPool.assigned.push(ip);
        return ip;
    },

    releaseIP(ipPool, ip) {
        const index = ipPool.assigned.indexOf(ip);
        if (index > -1) {
            ipPool.assigned.splice(index, 1);
            return true;
        }
        return false;
    },

    isIPAvailable(ipPool, ip) {
        return ipPool.pool.includes(ip) &&
               !ipPool.assigned.includes(ip) &&
               !ipPool.reserved.includes(ip);
    },

    getPoolUtilization(ipPool) {
        const total = ipPool.pool.length - ipPool.reserved.length;
        const used = ipPool.assigned.length;
        return {
            total,
            used,
            available: total - used,
            percentage: Math.round((used / total) * 100)
        };
    }
};
