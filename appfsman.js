(function (Scratch) {
    'use strict';

    const STORAGE_KEY = 'AppFsMan_DirHandle';

    async function saveHandleToIndexedDB(handle) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('AppFsManDB', 1);
            request.onupgradeneeded = () => {
                request.result.createObjectStore('handles');
            };
            request.onsuccess = () => {
                const db = request.result;
                const tx = db.transaction('handles', 'readwrite');
                tx.objectStore('handles').put(handle, STORAGE_KEY);
                tx.oncomplete = () => resolve();
                tx.onerror = e => reject(e);
            };
            request.onerror = e => reject(e);
        });
    }

    async function loadHandleFromIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('AppFsManDB', 1);
            request.onupgradeneeded = () => {
                request.result.createObjectStore('handles');
            };
            request.onsuccess = () => {
                const db = request.result;
                const tx = db.transaction('handles', 'readonly');
                const getReq = tx.objectStore('handles').get(STORAGE_KEY);
                getReq.onsuccess = () => resolve(getReq.result || null);
                getReq.onerror = e => reject(e);
            };
            request.onerror = e => reject(e);
        });
    }

    class UserStorage {
        constructor() {
            this.dirHandle = null;
        }

        async init() {
            const savedHandle = await loadHandleFromIndexedDB();
            if (savedHandle) {
                this.dirHandle = savedHandle;
            }
        }

        async selectFolderForStorage() {
            this.dirHandle = await window.showDirectoryPicker();
            await saveHandleToIndexedDB(this.dirHandle);
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

        async listFiles() {
            await this.ensureFolder();
            const files = [];
            for await (const entry of this.dirHandle.values()) {
                if (entry.kind === 'file') {
                    files.push(entry.name);
                }
            }
            return files;
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
            // 拡張読み込み時に保存済みハンドルを復元
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
                const files = await this.storage.listFiles();
                return files.join(',');
            } catch (e) {
                console.error('Failed to list files:', e);
                return '';
            }
        }
    }

    Scratch.extensions.register(new AppFsMan());

})(Scratch);
