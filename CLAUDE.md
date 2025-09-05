# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AutoMd是一个浏览器扩展，用于将网页内容转换为Markdown格式并下载。基于WXT框架构建，支持Chrome和Firefox浏览器。

## 核心技术栈

- **框架**: WXT (Web Extension Framework)  
- **前端**: Vue 3 + TypeScript
- **构建工具**: Vite
- **转换库**: Turndown + turndown-plugin-gfm
- **包管理器**: pnpm

## 开发命令

```bash
# 开发环境 (Chrome)
pnpm dev

# Firefox开发环境  
pnpm dev:firefox

# 构建生产版本
pnpm build
pnpm build:firefox

# 打包为zip文件
pnpm zip
pnpm zip:firefox

# 类型检查
pnpm compile

# 安装后准备
pnpm postinstall
```

## 项目架构

### 入口点结构 (entrypoints/)

- **background.ts**: 后台脚本，处理消息传递和content script注入，支持侧边栏自动打开
- **popup/**: 扩展弹窗界面
  - `App.vue`: 主界面组件，包含网站检测逻辑和下载功能
  - `main.ts`: Vue应用入口点
- **sidepanel/**: 侧边栏界面（与弹窗内容相同）
  - `App.vue`: 侧边栏组件，与popup功能完全一致
  - `main.ts`: Vue应用入口点
  - `index.html`: 侧边栏HTML模板
- **Content Scripts**: 针对不同网站的内容解析脚本
  - `csdn.content.ts`: CSDN博客文章解析
  - `zhihu_article.content.ts`: 知乎专栏解析  
  - `zhihu_answer.content.ts`: 知乎问答解析
  - `cnblogs.content.ts`: 博客园文章解析
  - `chat_gpt.content.ts`: ChatGPT对话解析
  - `wechat_article.content.ts`: 微信公众号文章解析
  - `scys.content.ts`: SCYS课程内容解析
  - `other.content.ts`: 通用网页解析 (fallback)

### 核心工作流程

1. **弹窗检测**: `App.vue`根据当前URL判断网站类型
2. **消息传递**: 通过`browser.runtime.sendMessage`与background通信
3. **脚本注入**: background根据消息类型注入相应的content script
4. **内容解析**: content script解析页面内容，转换为Markdown
5. **文件下载**: 弹窗接收转换结果并触发下载

### 添加新网站支持

1. 创建新的content script: `entrypoints/{site}.content.ts`
2. 在`background.ts`中添加对应的case分支
3. 在`App.vue`中添加网站检测逻辑和对应按钮
4. 使用TurndownService进行HTML到Markdown转换

### 转换库配置

所有content script使用增强的Turndown库进行HTML到Markdown转换:
- 基础转换: `createEnhancedTurndownService()`
- GitHub Flavored Markdown支持: `createEnhancedTurndownService(true)` (用于CSDN等需要表格支持的网站)
- **视频增强处理**: 自动识别和处理视频元素，包括：
  - **`<video>` 标签**: 完整保留HTML标签结构，确保视频不丢失
  - **视频容器** (如`.player`类): 从容器中提取并仅保留`<video>`元素，过滤掉播放按钮、控件等其他元素
  - **iframe视频** (YouTube、Bilibili、Vimeo等): 转换为平台标识链接
  - **播放按钮图片**: 转换为播放控制标记
  - **`<audio>` 标签**: 完整保留HTML标签结构
- 特定网站需针对DOM结构进行选择器优化

### 工具函数

- `utils/turndown-enhanced.ts`: 提供增强的Turndown服务
  - **保留策略**: `<video>`和`<audio>`标签直接保留为HTML，不进行转换
  - **智能过滤**: 包含视频的容器仅提取核心`<video>`元素，过滤掉无关的UI控件
  - 可选的GFM (GitHub Flavored Markdown) 支持
  - 统一的图片和链接处理逻辑

### 扩展权限配置

在`wxt.config.ts`中配置:
- `permissions: ["tabs", "scripting", "sidePanel"]`: API权限
- `host_permissions: ["*://*/*"]`: 访问所有网站权限  
- `action: {}`: 支持弹窗和侧边栏的action对象

### 用户界面

扩展提供两种访问方式：
1. **弹窗模式**: 点击扩展图标弹出小窗口
2. **侧边栏模式**: 扩展会自动设置点击图标打开侧边栏，提供更宽敞的操作界面

## 调试和测试

- 使用浏览器开发者工具调试content scripts
- background脚本日志在扩展管理页面的"检查视图"中查看
- popup界面可直接在弹窗中使用开发者工具

## 代码规范

- 使用TypeScript进行类型检查
- Vue 3 Composition API + `<script setup>` 语法
- Content script必须检查`document.readyState`确保页面加载完成
- 统一的错误处理和用户反馈机制