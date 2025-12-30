const QRGenerator = {
    generate(text, containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('QR container not found');
            return;
        }

        container.innerHTML = '';

        if (typeof QRCode !== 'undefined') {
            new QRCode(container, {
                text: text,
                width: 256,
                height: 256,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.M
            });
        } else {
            container.innerHTML = '<p style="padding: 2rem; text-align: center;">QR Code library not loaded</p>';
        }
    },

    showClientQR(client, server) {
        const config = ConfigGenerator.generateClientConfig(client, server);

        const modal = document.createElement('div');
        modal.className = 'qr-modal';
        modal.innerHTML = `
            <div class="qr-modal-content">
                <div class="qr-modal-header">
                    <h3>${client.name} - QR Code</h3>
                    <button class="qr-modal-close" onclick="this.closest('.qr-modal').remove()">&times;</button>
                </div>
                <div class="qr-modal-body">
                    <div id="qr-code-display"></div>
                    <p style="margin-top: 1rem; text-align: center; color: #6c757d;">
                        Scan with WireGuard mobile app
                    </p>
                </div>
                <div class="qr-modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.qr-modal').remove()">Close</button>
                    <button class="btn btn-primary" onclick="QRGenerator.downloadQR('${client.name}')">Download PNG</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        setTimeout(() => {
            this.generate(config, 'qr-code-display');
        }, 100);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    },

    downloadQR(clientName) {
        const canvas = document.querySelector('#qr-code-display canvas');
        if (!canvas) {
            alert('QR code not found');
            return;
        }

        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${clientName.replace(/[^a-z0-9]/gi, '_')}_qr.png`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }
};
