class sfdatas {
    getInfo() {
        return {
            id: "sfdatas",
            name: "Sound Font Importer",
            blocks: [
                {
                    opcode: 'getSfAsHex',
                    blockType: Scratch.BlockType.REPORTER,
                    text: 'Import [SFNAME]',
                    arguments: {
                        SFNAME: {
                            type: Scratch.ArgumentType.STRING,
                            menu: 'SF_MENU'
                        }
                    }
                }
            ],
            menus: {
                acceptReporters: true,
                SF_MENU: ['198 yamaha sy1 piano']
            }
        };
    }

    async getSfAsHex(args) {
        const urlTable = {
            "198 yamaha sy1 piano": "https://098orin.github.io/tw-extentions/sf/198_Prophet_Piano_VS.sf2",
        };

        const url = urlTable[args.SFNAME];
        if (!url || !url.startsWith('https://')) {
            throw new Error('URLが無効です');
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTPエラー: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        let hex = '';
        for (const byte of uint8Array) {
            hex += byte.toString(16).padStart(2, '0');
        }
        return hex;
    }
}

Scratch.extensions.register(new sfdatas());