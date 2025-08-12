class hexstr {
    getInfo() {
        return {
            id: "hexStr",
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
                },
                {
                    opcode: "hexToStr",
                    blockType: Scratch.BlockType.REPORTER,
                    text: "Decode hex [HEX] to string with encoding [ENCODING]",
                    arguments: {
                        HEX: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "5b6f626a656374204f626a6563745d"
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
    strToHex(args) {
        const text = args.TEXT.toString();
        const encoding = args.ENCODING.toString();
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
    hexToStr(args) {
        let hex = args.HEX.toString();
        const encoding = args.ENCODING.toString();
        // まず文字列化して、空白や"0x"を削除
        hex = String(hex).replace(/[^0-9a-fA-F]/g, '');

        // 2桁ずつ区切ってUint8Arrayに
        const bytes = new Uint8Array(
            hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
        );

        if (encoding.toLowerCase() === 'utf-8') {
            return new TextDecoder().decode(bytes);
        } else if (encoding.toLowerCase() === 'utf-16le' || encoding.toLowerCase() === 'unicode') {
            let result = '';
            for (let i = 0; i < bytes.length; i += 2) {
                result += String.fromCharCode(bytes[i] | (bytes[i + 1] << 8));
            }
            return result;
        } else if (encoding.toLowerCase() === 'utf-16be') {
            let result = '';
            for (let i = 0; i < bytes.length; i += 2) {
                result += String.fromCharCode((bytes[i] << 8) | bytes[i + 1]);
            }
            return result;
        } else {
            console.error(`Encoding "${encoding}" はブラウザ標準では対応していません`);
        }
    }
}

Scratch.extensions.register(new hexstr());