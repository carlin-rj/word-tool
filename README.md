# 单词默写练习系统

一个基于浏览器的单词默写练习工具，支持多种存储方式和离线使用。

## 功能特性

### 核心功能
- **词库管理**: 支持添加、编辑和管理多个词库标签
- **两种练习模式**: 
  - 默写模式
  - 翻译模式
- **错题本系统**: 自动记录错误单词，支持查看和复习
- **考试记录**: 保存每次考试的详细记录和统计数据
- **语音朗读**: 支持单词发音朗读功能

### 存储支持
- **LocalStorage**: 默认存储方式，适合小量数据
- **IndexedDB**: 默认启用，支持大量数据存储
- **后端API**: 可配置连接后端服务

### 界面特性
- 响应式设计，支持移动端使用
- 标签化词库管理
- 实时练习进度显示
- 错题本查看和清理
- 考试历史记录查看

## 技术架构

### 前端技术
- 纯JavaScript实现（无框架依赖）
- HTML5 + CSS3
- 模块化设计
- 支持ES6特性

### 存储架构
```
存储管理层 (storageManager.js)
├── 适配器层 (storageAdapter.js)
├── 配置管理 (config.js)
└── 多种存储引擎支持
    ├── LocalStorage
    ├── IndexedDB
    └── 后端API
```

## 快速开始

### 运行项目
1. 克隆项目到本地
2. 在项目根目录启动HTTP服务器：
   # 或使用Node.js (需要安装http-server)
   npx http-server -p 8000
   
   # 或使用其他HTTP服务器
   ```
3. 在浏览器中访问 `http://localhost:8080`

### 词库格式
默认从`https://word.iciba.com`复制的单词格式
词库采用特定格式，示例如下：
```
aunt [ɑ:nt]  
n. 阿姨; 姑妈等
card [kɑ:d]  
n. 卡片; 名片; 纸牌
fold [fəuld]  
v. 折叠; 折起来; 合拢 n. 褶;...
grandfather [ˈɡrændˌfɑ:ðə]  
n. 祖父; 外祖父
```

### 使用流程
1. **词库管理**: 在词库管理界面添加和编辑词库
2. **标签分类**: 为不同词库创建标签便于管理
3. **开始练习**: 选择标签开始默写练习
4. **模式切换**: 可在两种练习模式间切换
5. **查看统计**: 实时查看练习统计数据

## 配置说明

### 存储配置
在 `config.js` 中配置存储方式：
```javascript
storage: {
    // 存储类型: 'indexeddb', 'api'
    type: 'indexeddb',
    
    // 后端API配置（仅在type为'api'时使用）
    api: {
        endpoint: '', // 后端接口地址
        timeout: 5000 // 请求超时时间（毫秒）
    }
}
```

## 文件结构
```
word/
├── index.html          # 主页面
├── style.css           # 样式文件
├── script.js           # 主要逻辑
├── storageManager.js   # 存储管理器
├── storageAdapter.js   # 存储适配器
├── config.js           # 配置文件
└── README.md           # 说明文档
```

## 开发说明

### 添加新存储方式
1. 在 `storageManager.js` 中添加新的存储方法
2. 在 `save`/`load`/`remove` 方法中添加对应分支
3. 更新 `config.js` 配置选项

### 扩展功能
- 词库导入/导出功能
- 更多练习模式
- 数据统计图表
- 用户个性化设置

## 浏览器兼容性
- Chrome 50+
- Firefox 50+
- Safari 10+
- Edge 15+

## 注意事项
1. IndexedDB在隐私模式下可能不可用
2. 语音功能依赖浏览器支持
3. 大量数据建议使用IndexedDB存储
4. 后端API需要HTTPS支持（生产环境）

## 许可证
MIT License