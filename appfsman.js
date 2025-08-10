(function (Scratch) {
    'use strict';

    // --- ユーザーフォルダハンドルの永続化用キー ---
    const STORAGE_KEY = 'appFsMan-dirHandle';

    // --- IndexedDBでFileSystemHandleを永続化する ---
    async function saveHandleToStorage(handle) {
        const db = await navigator.storage.getDirectory();
        await db.setItem?.(STORAGE_KEY, handle); // 一部環境では非対応
        if (window.localStorage) {
            const serialized = await handle.queryPermission({ mode: 'readwrite' });
            localStorage.setItem(STORAGE_KEY, serialized);
        }
    }

    async function loadHandleFromStorage() {
        // 本来はIndexedDB経由で復元するが、簡易例として localStorage 判定のみ
        return null; // ここは実装環境に合わせて
    }

    class UserStorage {
        constructor() {
            this.dirHandle = null;
        }

        async init() {
            this.dirHandle = await loadHandleFromStorage();
        }

        async selectFolderForStorage() {
            this.dirHandle = await window.showDirectoryPicker();
            await saveHandleToStorage(this.dirHandle);
        }

        async ensureFolder() {
            if (!this.dirHandle) {
                throw new Error('Storage folder not set');
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

        async listFiles() {
            await this.ensureFolder();
            const files = [];
            for await (const [name, handle] of this.dirHandle.entries()) {
                if (handle.kind === 'file') {
                    files.push(name);
                }
            }
            return files.join(', ');
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
            this.storage.init().catch(e => console.error('Failed to init storage', e));
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
                        opcode: 'isStorageFolderSet',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: 'Is storage folder set?'
                    },
                    {
                        opcode: 'getStorageFolderName',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'Get storage folder name'
                    },
                    {
                        opcode: 'saveFile',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'Save File as hex to [FILENAME] with data [DATA]',
                        arguments: {
                            FILENAME: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'File.sf2'
                            },
                            DATA: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: ''
                            }
                        }
                    },
                    {
                        opcode: 'loadFile',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'Load File from [FILENAME] as hex',
                        arguments: {
                            FILENAME: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'File.sf2'
                            }
                        }
                    },
                    {
                        opcode: 'listFiles',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'List files in storage folder'
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

        async isStorageFolderSet() {
            return !!this.storage.dirHandle;
        }

        async getStorageFolderName() {
            try {
                await this.storage.ensureFolder();
                return this.storage.dirHandle.name || '';
            } catch (e) {
                return '';
            }
        }

        async saveFile(args) {
            try {
                const bytes = hexToUint8Array(args.DATA);
                await this.storage.saveFile(args.FILENAME, bytes);
            } catch (e) {
                console.error('Failed to save File:', e);
            }
        }

        async loadFile(args) {
            try {
                const bytes = await this.storage.loadFile(args.FILENAME);
                return uint8ArrayToHex(bytes);
            } catch (e) {
                console.error('Failed to load File:', e);
                return '';
            }
        }

        async listFiles() {
            try {
                return await this.storage.listFiles();
            } catch (e) {
                console.error('Failed to list files:', e);
                return '';
            }
        }
    }

    Scratch.extensions.register(new AppFsMan());

})(Scratch);
