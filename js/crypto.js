const WGCrypto = {
    generateKeyPair() {
        const keyPair = nacl.box.keyPair();
        return {
            privateKey: this.encodeBase64(keyPair.secretKey),
            publicKey: this.encodeBase64(keyPair.publicKey)
        };
    },

    generatePSK() {
        const psk = nacl.randomBytes(32);
        return this.encodeBase64(psk);
    },

    encodeBase64(bytes) {
        return btoa(String.fromCharCode.apply(null, bytes));
    },

    decodeBase64(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    },

    validateKey(key) {
        if (!key || typeof key !== 'string') return false;
        if (key.length !== 44) return false;
        try {
            const decoded = this.decodeBase64(key);
            return decoded.length === 32;
        } catch (e) {
            return false;
        }
    }
};
