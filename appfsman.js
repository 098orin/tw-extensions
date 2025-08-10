class UserStorage {
    constructor() {
        this.dirHandle = null;
    }

    async selectFolderForStorage() {
        this.dirHandle = await window.showDirectoryPicker();
    }

    async ensureFolder() {
        if (!this.dirHandle) {
            await this.selectFolderForStorage();
        }
    }

    async saveFile(filename, data) {
        await this.ensureFolder();
        const fileHandle = await this.dirHandle.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(data);
        await writable.close();
    }

    async loadFile(filename) {
        await this.ensureFolder();
        const fileHandle = await this.dirHandle.getFileHandle(filename);
        const file = await fileHandle.getFile();
        const arrayBuffer = await file.arrayBuffer();
        return new Uint8Array(arrayBuffer);
    }
}

function hexToUint8Array(hex) {
    if (hex.length % 2 !== 0) throw new Error('Invalid hex string');
    const arr = new Uint8Array(hex.length / 2);
    for (let i = 0; i < arr.length; i++) {
        arr[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return arr;
}

function uint8ArrayToHex(arr) {
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

class AppFsMan {
    constructor() {
        this.storage = new UserStorage();
    }

    getInfo() {
        return {
            id: 'AppFsMan',
            name: 'User App Storage',
            blocks: [
                {
                    opcode: 'selectStorageFolder',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'Select folder for storage'
                },
                {
                    opcode: 'saveSoundFont',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'Save SoundFont as hex to [FILENAME] with data [DATA]',
                    arguments: {
                        FILENAME: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: 'soundfont.sf2'
                        },
                        DATA: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: ''
                        }
                    }
                },
                {
                    opcode: 'loadSoundFont',
                    blockType: Scratch.BlockType.REPORTER,
                    text: 'Load SoundFont from [FILENAME] as hex',
                    arguments: {
                        FILENAME: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: 'soundfont.sf2'
                        }
                    }
                }
            ]
        };
    }

    async selectStorageFolder() {
        try {
            await this.storage.selectFolderForStorage();
        } catch (e) {
            console.error('Folder selection cancelled or failed', e);
        }
    }

    async saveSoundFont(args) {
        try {
            const bytes = hexToUint8Array(args.DATA);
            await this.storage.saveFile(args.FILENAME, bytes);
        } catch (e) {
            console.error('Failed to save SoundFont:', e);
        }
    }

    async loadSoundFont(args) {
        try {
            const bytes = await this.storage.loadFile(args.FILENAME);
            return uint8ArrayToHex(bytes);
        } catch (e) {
            console.error('Failed to load SoundFont:', e);
            return '';
        }
    }
}

Scratch.extensions.register(new AppFsMan());
