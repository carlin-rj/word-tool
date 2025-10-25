// 存储适配器 - 为现有代码提供兼容接口
import storageManager from './storageManager.js';

// 初始化存储管理器
let isInitialized = false;

async function initStorage() {
    if (!isInitialized) {
        try {
            await storageManager.init();
            isInitialized = true;
        } catch (error) {
            console.error('存储初始化失败:', error);
            // 如果初始化失败，回退到localStorage
            storageManager.storageType = 'localstorage';
        }
    }
}

// 适配localStorage.getItem
async function getItem(key) {
    await initStorage();
    try {
        const result = await storageManager.load(key);
        return result === null ? null : 
               typeof result === 'string' ? result : JSON.stringify(result);
    } catch (error) {
        console.error(`读取键 "${key}" 失败:`, error);
        return null;
    }
}

// 适配localStorage.setItem
async function setItem(key, value) {
    await initStorage();
    try {
        // 如果value是字符串且看起来像JSON，尝试解析它
        let dataToSave = value;
        if (typeof value === 'string') {
            try {
                dataToSave = JSON.parse(value);
            } catch {
                // 如果解析失败，保持原样
                dataToSave = value;
            }
        }
        await storageManager.save(key, dataToSave);
    } catch (error) {
        console.error(`保存键 "${key}" 失败:`, error);
    }
}

// 适配localStorage.removeItem
async function removeItem(key) {
    await initStorage();
    try {
        await storageManager.remove(key);
    } catch (error) {
        console.error(`删除键 "${key}" 失败:`, error);
    }
}

// 导出适配函数
export { getItem, setItem, removeItem };