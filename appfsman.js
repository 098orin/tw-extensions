(function (Scratch) {
    'use strict';

    if (!Scratch.extensions.unsandboxed) {
        console.warn('この拡張は unsandboxed モードで実行する必要があります。');
        return;
    }

    let DB_NAME = null;  // DBのID未設定ならnull

    async function saveHandleToIndexedDB(handle) {
        if (!DB_NAME) console.error('DBのidが設定されていません');
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 1);
            request.onupgradeneeded = () => {
                request.result.createObjectStore('handles');
            };
            request.onsuccess = () => {
                const db = request.result;
                const tx = db.transaction('handles', 'readwrite');
                tx.objectStore('handles').put(handle, 'AppFsMan_DirHandle');
                tx.oncomplete = () => resolve();
                tx.onerror = e => reject(e);
            };
            request.onerror = e => reject(e);
        });
    }

    async function loadHandleFromIndexedDB() {
        if (!DB_NAME) console.error('DBのidが設定されていません');
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 1);
            request.onupgradeneeded = () => {
                request.result.createObjectStore('handles');
            };
            request.onsuccess = () => {
                const db = request.result;
                const tx = db.transaction('handles', 'readonly');
                const getReq = tx.objectStore('handles').get('AppFsMan_DirHandle');
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

        async renameFile(oldName, newName) {
            await this.ensureFolder();
            const oldFileHandle = await this.dirHandle.getFileHandle(oldName);
            const file = await oldFileHandle.getFile();
            const arrayBuffer = await file.arrayBuffer();
            const newFileHandle = await this.dirHandle.getFileHandle(newName, { create: true });
            const writable = await newFileHandle.createWritable();
            await writable.write(arrayBuffer);
            await writable.close();
            await this.dirHandle.removeEntry(oldName);
        }
    }

    function hexToUint8Array(hex) {
        if (hex.length % 2 !== 0) console.error('Invalid hex string');
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
                        opcode: 'setDBId',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'DBのidを [DBID] にする',
                        arguments: {
                            DBID: { type: Scratch.ArgumentType.STRING, defaultValue: 'default' }
                        }
                    },
                    {
                        opcode: 'selectStorageFolder',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'Select folder for storage'
                    },
                    {
                        opcode: 'resetStorageFolder',
                        blockType: Scratch.BlockType.COMMAND,
                        text: '作業フォルダーをリセットする'
                    },
                    {
                        opcode: 'setStorageFolder',
                        blockType: Scratch.BlockType.COMMAND,
                        text: '作業フォルダーを [FOLDER] にする',
                        arguments: { FOLDER: { type: Scratch.ArgumentType.STRING, defaultValue: '' } }
                    },
                    {
                        opcode: 'currentStorageFolder',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '(現在の作業フォルダー)'
                    },
                    {
                        opcode: 'saveFile',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'Save File as hex to [FILENAME] with data [DATA]',
                        arguments: {
                            FILENAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'File.sf2' },
                            DATA: { type: Scratch.ArgumentType.STRING, defaultValue: '' }
                        }
                    },
                    {
                        opcode: 'loadFile',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'Load File from [FILENAME] as hex',
                        arguments: {
                            FILENAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'File.sf2' }
                        }
                    },
                    {
                        opcode: 'listFiles',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'List files in storage folder'
                    },
                    {
                        opcode: 'renameFile',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'file [OLD] を [NEW] に renameする',
                        arguments: {
                            OLD: { type: Scratch.ArgumentType.STRING, defaultValue: 'Old.sf2' },
                            NEW: { type: Scratch.ArgumentType.STRING, defaultValue: 'New.sf2' }
                        }
                    },
                    {
                        opcode: 'isStorageFolderSet',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: 'Is storage folder set?'
                    }
                ]
            };
        }

        setDBId(args) {
            const userId = args.DBID;
            if (!userId) console.error('DBのidを必ず指定してください');
            DB_NAME = 'AppFsManDB_' + userId;
            this.storage = new UserStorage();
            this.storage.init().catch(e => console.error('Failed to init storage after DB change', e));
        }

        async selectStorageFolder() {
            if (!DB_NAME) console.error('DBのidが設定されていません');
            await this.storage.selectFolderForStorage();
        }

        async resetStorageFolder() {
            if (!DB_NAME) console.error('DBのidが設定されていません');
            await this.storage.init();
        }

        async setStorageFolder(args) {
            if (!DB_NAME) console.error('DBのidが設定されていません');
            console.error('作業フォルダーを文字列指定でセットすることはブラウザではサポートされていません');
        }

        async currentStorageFolder() {
            if (!DB_NAME) console.error('DBのidが設定されていません');
            return this.storage.dirHandle ? this.storage.dirHandle.name : '';
        }

        async saveFile(args) {
            if (!DB_NAME) console.error('DBのidが設定されていません');
            const bytes = hexToUint8Array(args.DATA);
            await this.storage.saveFile(args.FILENAME, bytes);
        }

        async loadFile(args) {
            if (!DB_NAME) console.error('DBのidが設定されていません');
            const bytes = await this.storage.loadFile(args.FILENAME);
            return uint8ArrayToHex(bytes);
        }

        async listFiles() {
            if (!DB_NAME) console.error('DBのidが設定されていません');
            const files = await this.storage.listFiles();
            return files.join(',');
        }

        async renameFile(args) {
            if (!DB_NAME) console.error('DBのidが設定されていません');
            await this.storage.renameFile(args.OLD, args.NEW);
        }

        async isStorageFolderSet() {
            if (!DB_NAME) console.error('DBのidが設定されていません');
            return !!this.storage.dirHandle;
        }
    }

    Scratch.extensions.register(new AppFsMan());

})(Scratch);
