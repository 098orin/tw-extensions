class LocalStorageDB {
    constructor() {
        this.dbName = 'LocalStorageDB';
        this.storeName = 'keyvaluepairs';
        this.db = null;
        this._initDB();
    }

    _initDB() {
        const request = indexedDB.open(this.dbName, 1);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(this.storeName)) {
                db.createObjectStore(this.storeName, { keyPath: 'key' });
            }
        };
        request.onsuccess = (event) => {
            this.db = event.target.result;
        };
        request.onerror = (event) => {
            console.error('IndexedDB error:', event.target.error);
        };
    }

    _withStore(type, callback) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                // DBがまだ開いてなければ少し待ってリトライ
                setTimeout(() => {
                    this._withStore(type, callback).then(resolve).catch(reject);
                }, 100);
                return;
            }
            const tx = this.db.transaction(this.storeName, type);
            const store = tx.objectStore(this.storeName);
            const result = callback(store);
            tx.oncomplete = () => resolve(result);
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(tx.error);
        });
    }

    async saveData(key, value) {
        await this._withStore('readwrite', (store) => {
            store.put({ key, value });
        });
    }

    async loadData(key) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                setTimeout(() => {
                    this.loadData(key).then(resolve).catch(reject);
                }, 100);
                return;
            }
            const tx = this.db.transaction(this.storeName, 'readonly');
            const store = tx.objectStore(this.storeName);
            const request = store.get(key);
            request.onsuccess = () => {
                if (request.result) resolve(request.result.value);
                else resolve('');
            };
            request.onerror = () => reject(request.error);
        });
    }

    async deleteData(key) {
        await this._withStore('readwrite', (store) => {
            store.delete(key);
        });
    }

    async clearAll() {
        await this._withStore('readwrite', (store) => {
            store.clear();
        });
    }

    async listKeys() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                setTimeout(() => {
                    this.listKeys().then(resolve).catch(reject);
                }, 100);
                return;
            }
            const tx = this.db.transaction(this.storeName, 'readonly');
            const store = tx.objectStore(this.storeName);
            const keys = [];
            const request = store.openKeyCursor();
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    keys.push(cursor.key);
                    cursor.continue();
                } else {
                    resolve(keys);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }
}

class localStorageExtension {
    constructor() {
        this.db = new LocalStorageDB();
    }

    getInfo() {
        return {
            id: 'localStorageDB',
            name: 'Local Storage DB',
            blocks: [
                {
                    opcode: 'saveData',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'save data [KEY] value [VALUE]',
                    arguments: {
                        KEY: { type: Scratch.ArgumentType.STRING, defaultValue: 'key1' },
                        VALUE: { type: Scratch.ArgumentType.STRING, defaultValue: 'value' }
                    }
                },
                {
                    opcode: 'loadData',
                    blockType: Scratch.BlockType.REPORTER,
                    text: 'load data [KEY]',
                    arguments: {
                        KEY: { type: Scratch.ArgumentType.STRING, defaultValue: 'key1' }
                    }
                },
                {
                    opcode: 'deleteData',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'delete data [KEY]',
                    arguments: {
                        KEY: { type: Scratch.ArgumentType.STRING, defaultValue: 'key1' }
                    }
                },
                {
                    opcode: 'clearAll',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'clear all data'
                },
                {
                    opcode: 'listKeys',
                    blockType: Scratch.BlockType.REPORTER,
                    text: 'list all keys'
                }
            ]
        };
    }

    async saveData(args) {
        await this.db.saveData(args.KEY, args.VALUE);
    }

    async loadData(args) {
        const value = await this.db.loadData(args.KEY);
        return value || '';
    }

    async deleteData(args) {
        await this.db.deleteData(args.KEY);
    }

    async clearAll() {
        await this.db.clearAll();
    }

    async listKeys() {
        const keys = await this.db.listKeys();
        return JSON.stringify(keys);
    }
}

Scratch.extensions.register(new localStorageExtension());
