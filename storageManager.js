// 导入配置
import config from './config.js';

class StorageManager {
    constructor() {
        this.storageType = config.storage.type || 'indexeddb';
        this.dbName = 'WordMemoDB';
        this.dbVersion = 1;
        this.db = null;
        this.apiEndpoint = config.storage.api.endpoint || '';
        this.apiTimeout = config.storage.api.timeout || 5000;
    }

    // 初始化存储
    async init() {
        if (this.storageType === 'indexeddb') {
            return this.initIndexedDB();
        }
        return Promise.resolve();
    }

    // 初始化IndexedDB
    initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = (event) => {
                console.error('IndexedDB初始化失败:', event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                this.db = event.target.result;

                // 创建对象存储
                if (!this.db.objectStoreNames.contains('wordBanks')) {
                    const wordBanksStore = this.db.createObjectStore('wordBanks', { keyPath: 'id' });
                    wordBanksStore.createIndex('name', 'name', { unique: true });
                }

                if (!this.db.objectStoreNames.contains('examRecords')) {
                    const examRecordsStore = this.db.createObjectStore('examRecords', { keyPath: 'id' });
                    examRecordsStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                if (!this.db.objectStoreNames.contains('wrongWords')) {
                    const wrongWordsStore = this.db.createObjectStore('wrongWords', { keyPath: 'id' });
                }

                if (!this.db.objectStoreNames.contains('settings')) {
                    const settingsStore = this.db.createObjectStore('settings', { keyPath: 'key' });
                }
            };
        });
    }

    // 保存数据
    async save(key, data) {
        switch (this.storageType) {
            case 'indexeddb':
                return this.saveToIndexedDB(key, data);
            case 'api':
                return this.saveToAPI(key, data);
            default: // localStorage
                return this.saveToLocalStorage(key, data);
        }
    }

    // 读取数据
    async load(key) {
        switch (this.storageType) {
            case 'indexeddb':
                return this.loadFromIndexedDB(key);
            case 'api':
                return this.loadFromAPI(key);
            default: // localStorage
                return this.loadFromLocalStorage(key);
        }
    }

    // 删除数据
    async remove(key) {
        switch (this.storageType) {
            case 'indexeddb':
                return this.removeFromIndexedDB(key);
            case 'api':
                return this.removeFromAPI(key);
            default: // localStorage
                return this.removeFromLocalStorage(key);
        }
    }

    // 保存到localStorage
    saveToLocalStorage(key, data) {
        try {
            const serializedData = typeof data === 'string' ? data : JSON.stringify(data);
            localStorage.setItem(key, serializedData);
            return Promise.resolve();
        } catch (error) {
            console.error('localStorage保存失败:', error);
            return Promise.reject(error);
        }
    }

    // 从localStorage读取
    loadFromLocalStorage(key) {
        try {
            const data = localStorage.getItem(key);
            if (data === null) {
                return Promise.resolve(null);
            }
            // 尝试解析JSON，如果失败则返回原始字符串
            try {
                return Promise.resolve(JSON.parse(data));
            } catch {
                return Promise.resolve(data);
            }
        } catch (error) {
            console.error('localStorage读取失败:', error);
            return Promise.reject(error);
        }
    }

    // 从localStorage删除
    removeFromLocalStorage(key) {
        try {
            localStorage.removeItem(key);
            return Promise.resolve();
        } catch (error) {
            console.error('localStorage删除失败:', error);
            return Promise.reject(error);
        }
    }

    // 保存到IndexedDB
    saveToIndexedDB(key, data) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                return reject(new Error('IndexedDB未初始化'));
            }

            const transaction = this.db.transaction(['settings'], 'readwrite');
            const store = transaction.objectStore('settings');

            const request = store.put({ key: key, value: data });

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    // 从IndexedDB读取
    loadFromIndexedDB(key) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                return reject(new Error('IndexedDB未初始化'));
            }

            const transaction = this.db.transaction(['settings'], 'readonly');
            const store = transaction.objectStore('settings');

            const request = store.get(key);

            request.onsuccess = (event) => {
                const result = event.target.result;
                resolve(result ? result.value : null);
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    // 从IndexedDB删除
    removeFromIndexedDB(key) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                return reject(new Error('IndexedDB未初始化'));
            }

            const transaction = this.db.transaction(['settings'], 'readwrite');
            const store = transaction.objectStore('settings');

            const request = store.delete(key);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    // 保存到后端API
    async saveToAPI(key, data) {
        if (!this.apiEndpoint) {
            throw new Error('未设置后端API地址');
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.apiTimeout);

            const response = await fetch(`${this.apiEndpoint}/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ key, data }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API保存失败:', error);
            throw error;
        }
    }

    // 从后端API读取
    async loadFromAPI(key) {
        if (!this.apiEndpoint) {
            throw new Error('未设置后端API地址');
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.apiTimeout);

            const response = await fetch(`${this.apiEndpoint}/load/${key}`, {
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                if (response.status === 404) {
                    return null; // 数据不存在
                }
                throw new Error(`API请求失败: ${response.status}`);
            }

            const result = await response.json();
            return result.data;
        } catch (error) {
            console.error('API读取失败:', error);
            throw error;
        }
    }

    // 从后端API删除
    async removeFromAPI(key) {
        if (!this.apiEndpoint) {
            throw new Error('未设置后端API地址');
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.apiTimeout);

            const response = await fetch(`${this.apiEndpoint}/delete/${key}`, {
                method: 'DELETE',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API删除失败:', error);
            throw error;
        }
    }
}

// 创建存储管理器实例
const storageManager = new StorageManager();

// 导出存储管理器
export default storageManager;