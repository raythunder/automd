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

- **background.ts**: 后台脚本，处理消息传递和content script注入
- **popup/**: 扩展弹窗界面
  - `App.vue`: 主界面组件，包含网站检测逻辑和下载功能
  - `main.ts`: Vue应用入口点
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

所有content script使用Turndown库进行HTML到Markdown转换:
- 基础转换: `new TurndownService()`
- GitHub Flavored Markdown支持: `turndownService.use(gfm)`
- 特定网站需针对DOM结构进行选择器优化

### 扩展权限配置

在`wxt.config.ts`中配置:
- `permissions: ["tabs", "scripting"]`: API权限
- `host_permissions: ["*://*/*"]`: 访问所有网站权限

## 调试和测试

- 使用浏览器开发者工具调试content scripts
- background脚本日志在扩展管理页面的"检查视图"中查看
- popup界面可直接在弹窗中使用开发者工具

## 代码规范

- 使用TypeScript进行类型检查
- Vue 3 Composition API + `<script setup>` 语法
- Content script必须检查`document.readyState`确保页面加载完成
- 统一的错误处理和用户反馈机制