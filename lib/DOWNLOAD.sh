#!/bin/bash
# Download required JavaScript libraries

echo "Downloading required libraries..."

# TweetNaCl.js
curl -L "https://cdn.jsdelivr.net/npm/tweetnacl@1.0.3/nacl-fast.min.js" -o tweetnacl.min.js
echo "✓ TweetNaCl.js downloaded"

# qrcode.js
curl -L "https://cdn.jsdelivr.net/npm/davidshimjs-qrcodejs@0.0.2/qrcode.min.js" -o qrcode.min.js
echo "✓ QRCode.js downloaded"

# JSZip
curl -L "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js" -o jszip.min.js
echo "✓ JSZip downloaded"

# FileSaver.js
curl -L "https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js" -o FileSaver.min.js
echo "✓ FileSaver.js downloaded"

echo ""
echo "All libraries downloaded successfully!"
echo "You can now open index.html in your browser."
