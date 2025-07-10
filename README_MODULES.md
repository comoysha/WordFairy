# WordFairy 模块化结构说明

## 文件拆分概览

原本的 `content.js` 文件已被拆分为以下5个模块化文件，提高了代码的可维护性和可读性：

### 1. `js/categoryManager.js` - 分类管理模块
**功能：**
- 管理默认分类配置
- 处理自定义分类的增删改查
- 分类模式切换（默认/自定义）
- AI提示词生成和预览
- 分类配置的保存和加载

**主要函数：**
- `loadCustomCategories()` - 加载自定义分类
- `renderCategoriesList()` - 渲染分类列表
- `addCategoryRow()` - 添加分类行
- `deleteCategoryRow()` - 删除分类行
- `saveCustomCategories()` - 保存分类配置
- `generatePrompt()` - 生成AI提示词

### 2. `js/highlighter.js` - 高亮功能模块
**功能：**
- 词汇高亮显示和移除
- 递归遍历DOM节点进行高亮
- 高亮状态切换
- 使用固定的4种样式类进行高亮

**主要函数：**
- `highlightWords()` - 高亮显示词汇
- `applyHighlight()` - 应用高亮
- `highlightAllWords()` - 递归高亮所有匹配词汇
- `removeHighlights()` - 移除所有高亮
- `toggleHighlight()` - 切换高亮状态

### 3. `js/wordExtractor.js` - 词汇提取和AI接口模块
**功能：**
- 与OpenRouter API交互
- 根据分类模式生成动态提示词
- 解析AI返回的JSON结果
- 统计词汇出现次数
- 错误处理和状态反馈

**主要函数：**
- `extractWords()` - 提取分类词汇的主函数

### 4. `js/eventListeners.js` - 事件监听器模块
**功能：**
- 处理所有用户交互事件
- API密钥和模型名称的保存
- 分类模式切换事件
- 自定义分类弹框的交互
- 按钮点击事件处理

**主要函数：**
- `initializeEventListeners()` - 初始化所有事件监听器

### 5. `content.js` - 主入口文件
**功能：**
- 侧边栏的创建和管理
- 扩展图标点击事件处理
- 词汇分类结果的显示
- 模块间的协调

**主要函数：**
- `createSidebar()` - 创建侧边栏
- `initializeSidebar()` - 初始化侧边栏
- `displayWordCategories()` - 显示词汇分类结果
- `cleanupSidebar()` - 清理侧边栏

## 加载顺序

在 `manifest.json` 中，文件按以下顺序加载：
1. `js/categoryManager.js` - 提供基础分类配置
2. `js/highlighter.js` - 提供高亮功能
3. `js/wordExtractor.js` - 提供AI接口功能
4. `js/eventListeners.js` - 提供事件处理
5. `content.js` - 主入口，协调所有模块

## 模块间依赖关系

```
content.js (主入口)
├── eventListeners.js (事件处理)
│   ├── categoryManager.js (分类管理)
│   ├── wordExtractor.js (词汇提取)
│   └── highlighter.js (高亮功能)
├── categoryManager.js (分类配置)
└── highlighter.js (显示结果)
```

## 优势

1. **模块化设计** - 每个文件职责单一，便于维护
2. **代码复用** - 功能模块可以独立测试和复用
3. **易于扩展** - 新功能可以独立开发而不影响其他模块
4. **调试友好** - 问题定位更加精确
5. **团队协作** - 不同开发者可以并行开发不同模块

## 注意事项

- 所有模块都依赖全局变量 `sidebar`，确保在使用前已初始化
- 分类配置 `defaultCategories` 现在定义在 `categoryManager.js` 中
- 高亮样式固定为4种：`person`, `location`, `time`, `organization`
- 自定义分类最多支持4个，与高亮样式数量保持一致