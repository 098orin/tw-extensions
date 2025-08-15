(function (Scratch) {
    'use strict';

    let DB_NAME = null;
    const STORAGE_KEY = 'AppFsMan_DirHandle';
    const ORIGINAL_KEY = 'AppFsMan_OriginalDirHandle';

    function openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 1);
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains('handles')) {
                    db.createObjectStore('handles');
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = e => reject(e);
        });
    }

    async function saveToIndexedDB(key, value) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('handles', 'readwrite');
            tx.objectStore('handles').put(value, key);
            tx.oncomplete = () => resolve();
            tx.onerror = e => reject(e);
        });
    }

    async function loadFromIndexedDB(key) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('handles', 'readonly');
            const getReq = tx.objectStore('handles').get(key);
            getReq.onsuccess = () => resolve(getReq.result || null);
            getReq.onerror = e => reject(e);
        });
    }

    class UserStorage {
        constructor() {
            this.dirHandle = null;
            this.originalDirHandle = null;
        }

        async init() {
            const savedHandle = await loadFromIndexedDB(STORAGE_KEY);
            const originalHandle = await loadFromIndexedDB(ORIGINAL_KEY);
            if (savedHandle) {
                this.dirHandle = savedHandle;
            }
            if (originalHandle) {
                this.originalDirHandle = originalHandle;
            }
        }

        async selectFolderForStorage() {
            this.dirHandle = await window.showDirectoryPicker();
            if (!this.originalDirHandle) {
                this.originalDirHandle = this.dirHandle;
                await saveToIndexedDB(ORIGINAL_KEY, this.originalDirHandle);
            }
            await saveToIndexedDB(STORAGE_KEY, this.dirHandle);
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

        async resetFolder() {
            if (this.originalDirHandle) {
                this.dirHandle = this.originalDirHandle;
                await saveToIndexedDB(STORAGE_KEY, this.dirHandle);
            }
        }

        async changeToSubFolder(subFolderName) {
            await this.ensureFolder();
            const newDirHandle = await this.dirHandle.getDirectoryHandle(subFolderName, { create: true });
            this.dirHandle = newDirHandle;
            await saveToIndexedDB(STORAGE_KEY, this.dirHandle);
        }

        getCurrentFolderName() {
            return this.dirHandle ? this.dirHandle.name : '';
        }

        async renameFile(oldName, newName) {
            await this.ensureFolder();
            const oldFileHandle = await this.dirHandle.getFileHandle(oldName);
            const file = await oldFileHandle.getFile();
            const newFileHandle = await this.dirHandle.getFileHandle(newName, { create: true });
            const writable = await newFileHandle.createWritable();
            await writable.write(await file.arrayBuffer());
            await writable.close();
            await this.dirHandle.removeEntry(oldName);
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
                        opcode: 'setDBid',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'DBのidを [DBID] にする',
                        arguments: {
                            DBID: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'Default'
                            }
                        }
                    },
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
                    },
                    {
                        opcode: 'isStorageFolderSet',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: 'Is storage folder set?'
                    },
                    {
                        opcode: 'resetStorageFolder',
                        blockType: Scratch.BlockType.COMMAND,
                        text: '作業フォルダーをリセットする'
                    },
                    {
                        opcode: 'changeStorageFolder',
                        blockType: Scratch.BlockType.COMMAND,
                        text: '作業フォルダーを [FOLDERNAME] にする',
                        arguments: {
                            FOLDERNAME: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'subfolder'
                            }
                        }
                    },
                    {
                        opcode: 'getCurrentFolder',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '現在の作業フォルダー'
                    },
                    {
                        opcode: 'renameFile',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'file [OLDNAME] を [NEWNAME] に rename する',
                        arguments: {
                            OLDNAME: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'old.txt'
                            },
                            NEWNAME: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'new.txt'
                            }
                        }
                    }
                ]
            };
        }

        setDBid(args) {
            const dbName = args.DBID
            DB_NAME = "AppFsManDB_" + dbName;
            console.log('DB_NAME set to:', DB_NAME);
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

        async isStorageFolderSet() {
            try {
                return !!this.storage.dirHandle;
            } catch (e) {
                console.error('Failed to check folder state:', e);
                return false;
            }
        }

        async resetStorageFolder() {
            try {
                await this.storage.resetFolder();
            } catch (e) {
                console.error('Failed to reset folder:', e);
            }
        }

        async changeStorageFolder(args) {
            try {
                await this.storage.changeToSubFolder(args.FOLDERNAME);
            } catch (e) {
                console.error('Failed to change storage folder:', e);
            }
        }

        getCurrentFolder() {
            try {
                return this.storage.getCurrentFolderName();
            } catch (e) {
                console.error('Failed to get current folder:', e);
                return '';
            }
        }

        async renameFile(args) {
            try {
                await this.storage.renameFile(args.OLDNAME, args.NEWNAME);
            } catch (e) {
                console.error('Failed to rename file:', e);
            }
        }
    }

    Scratch.extensions.register(new AppFsMan());

})(Scratch);
