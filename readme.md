# 🌟 词妆精灵 - 智能高亮分类标记扩展 🌟

> 📚 让网页阅读体验焕然一新，提升知识获取与理解的效率

![GitHub stars](https://img.shields.io/github/stars/comoysha/WordFairy2?style=social)
![GitHub forks](https://img.shields.io/github/forks/comoysha/WordFairy2?style=social)
![GitHub license](https://img.shields.io/github/license/comoysha/WordFairy2)

## ✨ 功能亮点

SmartHighlighter 是一款革命性的 Chrome 扩展，它能够：

- 🧠 智能识别文章中的关键实体（人名、地名、组织、时间等）
- 🎨 自动为不同类别的词汇应用独特的高亮颜色
- 📋 生成词汇列表并显示出现频次
- 🔍 一键定位并在文章中循环跳转到高亮词汇
- ⚙️ 支持自定义提取分类和高亮颜色
- 🔒 安全存储您的 API 密钥，完全本地化处理

## 🚀 快速开始

### 安装方法

1. 下载此仓库并手动安装:
   - 克隆仓库: `git clone https://github.com/comoysha/WordFairy2.git`
   - 打开Chrome浏览器，进入 `chrome://extensions/`
   - 启用"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择克隆的仓库文件夹

### 配置指南

首次使用时，请点击扩展图标，然后：

1. 设置您的 OpenRouter API 密钥 (可从 [OpenRouter](https://openrouter.ai/) 获取)
2. 选择您想使用的模型（默认: google/gemini-2.0-flash-lite-001）
3. 开始在任何网页上体验智能高亮！

## 🧩 使用方法

1. 访问任意网页文章
2. 点击浏览器工具栏中的 SmartHighlighter 图标
3. 在出现的侧边栏中选择以下操作：
   - 🔍 **提取分类词汇**：分析当前页面内容
   - 🖌️ **应用高亮**：为识别的词汇标记不同颜色
   - 🚫 **关闭高亮**：移除所有高亮效果
   - ⚙️ **自定义分类**：设置您需要的特定词汇类别（还没开发）


## 🎯 自定义提取分类

SmartHighlighter 支持根据不同文章类型自定义提取分类：

| 默认分类 | 可自定义为 |
|---------|------------|
| 👤 人名 | 演员、导演、作家... |
| 🌍 地名 | 国家、城市、景点... |
| ⏰ 时间 | 日期、年代、时期... |
| 🏢 组织名 | 公司、学校、机构... |

只需点击"自定义提取分类"按钮，即可根据您当前阅读内容的需求调整分类。

## 💡 技术亮点

- 利用先进的 AI 模型识别和分类文本实体
- 非侵入式界面设计，提供流畅的用户体验
- 高效的文本处理算法，即使在大型文档上也能保持良好性能
- 完全本地化的数据处理，保护用户隐私

## 🛠️ 开发者笔记

词妆精灵的开发过程充满了实验和改进：

- 最初使用 readability.js 创建阅读视图，后来改为直接在原页面上实现高亮
- 从 mark.js 迁移到自定义高亮实现，以提供更好的性能和灵活性
- 重新设计了从弹出窗口到侧边栏的界面，提供更持久和便捷的访问
- 采用 Tailwind CSS 进行样式设计，实现现代化和响应式的用户界面

## 🔮 未来计划

我们正在积极开发以下功能：

- 📱 自定义提取分类

## 💖 贡献指南

我们欢迎所有形式的贡献！如果您有兴趣参与：

1. Fork 此仓库
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

## 📝 使用技巧

- 🔍 对于学术文章，建议自定义提取"术语"、"概念"和"引用"分类
- 📊 对于新闻文章，默认的人名、地名、时间和组织分类效果最佳

## 📄 许可证

本项目采用 MIT 许可证 - 详情请参阅 [LICENSE](LICENSE) 文件

---

<p align="center">
  使用 ❤️ 开发 | <a href="https://github.com/comoysha">@comoysha</a>
</p>
