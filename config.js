// 应用配置文件
const config = {
    // 存储配置
    storage: {
        // 存储类型: 'localstorage', 'indexeddb', 'api'
        type: 'indexeddb',
        
        // 后端API配置（仅在type为'api'时使用）
        api: {
            endpoint: '', // 后端接口地址，例如: 'https://api.example.com/wordmemo'
            timeout: 5000 // 请求超时时间（毫秒）
        }
    }
};

export default config;