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
                FORMAT_MENU: {
                    acceptReporters: true,
                    items: ['198 yamaha sy1 piano',]
                }
            }
        };
    }

    getSfAsHex(args) {
        const urlTable = {
            "198 yamaha sy1 piano": "https://www.zanderjaz.com/soundfonts/pianos/198_Yamaha_SY1_piano.sf2",
        }

        const url = urlTable[args.SFNAME]
        const https = require('https');

        return new Promise((resolve, reject) => {
                if (!url.startsWith('https://')) {
                    reject(new Error('URL must start with "https://"'));
                    return;
                }

            https.get(url, (res) => {
                if (res.statusCode !== 200) {
                    reject(new Error(`HTTP ${res.statusCode}`));
                    return;
                }
                const chunks = [];
                res.on('data', chunk => chunks.push(chunk));
                res.on('end', () => {
                    const buffer = Buffer.concat(chunks);
                    resolve(buffer.toString('hex')); // 小文字のhex
                });
            }).on('error', reject);
        });

    }
}

Scratch.extensions.register(new sfdatas());