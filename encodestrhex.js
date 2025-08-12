class encodestrhex {
    getInfo() {
        return {
            id: "encodeStrHex",
            name: "Encode string to hex",
            blocks: [
                {
                    opcode: "strToHex",
                    blockType: Scratch.BlockType.REPORTER,
                    text: "Encode [TEXT] to hex with encoding [ENCODING]",
                    arguments: {
                        TEXT: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "Hello, world!"
                        },
                        ENCODING: {
                            type: Scratch.ArgumentType.STRING,
                            menu: "ENCODING_MENU"
                        }
                    }
                }
            ],
            menus: {
                ENCODING_MENU: {
                    acceptReporters: true,
                    items: [
                        { text: "UTF-8", value: "utf-8" },
                        { text: "UTF-16LE (Unicode)", value: "utf-16le" },
                        { text: "UTF-16BE", value: "utf-16be" }
                    ]
                }
            }
        }
    }
    strToHex(text, encoding = 'utf-8') {
        let bytes;
        
        if (encoding.toLowerCase() === 'utf-8') {
            bytes = new TextEncoder().encode(text);
        } else if (encoding.toLowerCase() === 'utf-16le' || encoding.toLowerCase() === 'unicode') {
            // UTF-16 Little Endian (Windowsでいう"Unicode")
            const buf = new ArrayBuffer(text.length * 2);
            const view = new DataView(buf);
            for (let i = 0; i < text.length; i++) {
                view.setUint16(i * 2, text.charCodeAt(i), true); // little endian
            }
            bytes = new Uint8Array(buf);
        } else if (encoding.toLowerCase() === 'utf-16be') {
            // UTF-16 Big Endian
            const buf = new ArrayBuffer(text.length * 2);
            const view = new DataView(buf);
            for (let i = 0; i < text.length; i++) {
                view.setUint16(i * 2, text.charCodeAt(i), false); // big endian
            }
            bytes = new Uint8Array(buf);
        } else {
            console.error(`Encoding "${encoding}" はブラウザ標準では対応していません`);
        }

        return Array.from(bytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
}

Scratch.extensions.register(new encodestrhex());