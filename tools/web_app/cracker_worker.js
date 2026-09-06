// Bruce Offloaded High-Speed Hash Cracker Worker
// Offloads PBKDF2-HMAC-SHA1 (WPA2/PMKID) cracking to Smartphone/PC Multi-Core CPUs

self.onmessage = async function(e) {
    const { type, payload } = e.data;

    if (type === "CRACK_PMKID") {
        const { ssid, apMac, clientMac, pmkidHex, wordlist } = payload;
        const targetPmkid = pmkidHex.toLowerCase();
        
        let tested = 0;
        const total = wordlist.length;
        const startTime = Date.now();

        // PMKID = HMAC-SHA1-128(PMK, "PMK Name" | MAC_AP | MAC_STA)
        const enc = new TextEncoder();
        const salt = enc.encode(ssid);
        const prefix = enc.encode("PMK Name");
        
        // Build data buffer: "PMK Name" + AP_MAC + STA_MAC
        const apBytes = hexToBytes(apMac.replace(/[:-]/g, ''));
        const staBytes = hexToBytes(clientMac.replace(/[:-]/g, ''));
        const dataBuffer = new Uint8Array(prefix.length + apBytes.length + staBytes.length);
        dataBuffer.set(prefix, 0);
        dataBuffer.set(apBytes, prefix.length);
        dataBuffer.set(staBytes, prefix.length + apBytes.length);

        for (let i = 0; i < total; i++) {
            const pass = wordlist[i];
            tested++;

            try {
                // 1. Compute PMK = PBKDF2(pass, ssid, 4096, 256, HMAC-SHA1)
                const passKey = await crypto.subtle.importKey(
                    "raw",
                    enc.encode(pass),
                    { name: "PBKDF2" },
                    false,
                    ["deriveBits"]
                );

                const pmkBuffer = await crypto.subtle.deriveBits(
                    {
                        name: "PBKDF2",
                        salt: salt,
                        iterations: 4096,
                        hash: "SHA-1"
                    },
                    passKey,
                    256
                );

                // 2. Compute PMKID = HMAC-SHA1(PMK, dataBuffer)[0..16]
                const hmacKey = await crypto.subtle.importKey(
                    "raw",
                    pmkBuffer,
                    { name: "HMAC", hash: "SHA-1" },
                    false,
                    ["sign"]
                );

                const hmacSig = await crypto.subtle.sign("HMAC", hmacKey, dataBuffer);
                const computedPmkidHex = bytesToHex(new Uint8Array(hmacSig).slice(0, 16));

                if (computedPmkidHex === targetPmkid) {
                    self.postMessage({
                        type: "FOUND",
                        payload: {
                            password: pass,
                            tested: tested,
                            timeMs: Date.now() - startTime
                        }
                    });
                    return;
                }
            } catch (err) {
                // Continue
            }

            if (tested % 10 === 0) {
                self.postMessage({
                    type: "PROGRESS",
                    payload: {
                        tested: tested,
                        total: total,
                        speed: Math.round((tested / ((Date.now() - startTime) / 1000)))
                    }
                });
            }
        }

        self.postMessage({
            type: "NOT_FOUND",
            payload: {
                tested: tested,
                timeMs: Date.now() - startTime
            }
        });
    }
};

function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
}

function bytesToHex(bytes) {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
