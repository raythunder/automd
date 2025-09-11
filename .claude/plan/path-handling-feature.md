# AutoMd 相对路径处理功能规划文档

## 项目概述

**功能名称**: 网页资源路径智能处理功能
**项目版本**: AutoMd 浏览器扩展 v1.x
**规划日期**: 2025年9月11日
**规划类型**: 功能增强

## 问题描述

当前AutoMd在转换网页为Markdown时，直接复制了网页中的相对路径（如 `../images/pic.jpg` 或 `/assets/style.css`），导致生成的Markdown文件在本地查看时这些资源无法正确访问。

## 技术背景

- **项目框架**: WXT (Web Extension Framework)
- **前端技术**: Vue 3 + TypeScript + Vite  
- **转换引擎**: Turndown + turndown-plugin-gfm
- **路径处理**: 浏览器原生URL API
- **包管理**: pnpm

## 现有代码分析

在 `utils/turndown-enhanced.ts` 文件中：
1. **图片处理**（第96行）：直接使用 `src` 属性 `![${alt}](${src})`
2. **iframe处理**（第62、64、66行）：直接使用 `src` 属性
3. **缺少相对路径到绝对路径的转换逻辑**

## 项目目标

为AutoMd浏览器扩展增加智能资源路径处理功能，将网页中的相对路径（图片、视频、音频、iframe等）自动转换为绝对路径，确保生成的Markdown文件中的资源链接在本地环境下可正常访问。

## 技术方案设计

### 核心算法

使用浏览器原生URL API进行路径解析：

```typescript
function resolveUrl(relativeUrl: string, baseUrl: string): string {
  try {
    // 如果已经是完整URL，直接返回
    if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
      return relativeUrl;
    }
    
    // 处理data:和blob:协议
    if (relativeUrl.startsWith('data:') || relativeUrl.startsWith('blob:')) {
      return relativeUrl; // 保留原样
    }
    
    // 使用URL构造函数解析相对路径
    const absoluteUrl = new URL(relativeUrl, baseUrl);
    return absoluteUrl.href;
  } catch (error) {
    console.warn('路径解析失败:', relativeUrl, error);
    return relativeUrl; // 失败时返回原路径
  }
}
```

### 实施策略

1. **保守路径处理策略**: 只处理明确的相对路径，保留完整URL不变
2. **向后兼容**: 添加可选的baseUrl参数，不破坏现有调用
3. **健壮的错误处理**: 路径解析失败时回退到原路径
4. **性能优化**: 避免重复解析和不必要的转换

## 详细实施计划

### 阶段 1：核心路径处理功能开发（预计6小时）

#### 任务 1.1：创建路径处理工具函数
- **目标**: 实现相对路径到绝对路径的智能转换
- **文件**: `utils/turndown-enhanced.ts`（新增函数）
- **工作量**: 2小时

```typescript
// 新增函数示例
function resolveResourceUrl(relativeUrl: string, baseUrl?: string): string {
  if (!baseUrl || !relativeUrl) return relativeUrl;
  // 实现逻辑...
}
```

#### 任务 1.2：增强图片处理规则
- **目标**: 在enhancedImage规则中集成路径转换
- **位置**: `utils/turndown-enhanced.ts` 第96行附近
- **工作量**: 1.5小时

#### 任务 1.3：增强iframe处理规则  
- **目标**: 在iframe规则中集成路径转换
- **位置**: `utils/turndown-enhanced.ts` 第51-73行
- **工作量**: 1小时

#### 任务 1.4：增强视频音频路径处理
- **目标**: 处理video和audio标签内的相对路径
- **位置**: `utils/turndown-enhanced.ts` 第22-27行和第107-112行
- **工作量**: 1小时

#### 任务 1.5：添加链接处理规则
- **目标**: 新增a标签href属性相对路径转换
- **文件**: `utils/turndown-enhanced.ts`（新增规则）
- **工作量**: 1小时

### 阶段 2：Content Script集成优化（预计4小时）

#### 任务 2.1：更新函数签名
- **目标**: 为createEnhancedTurndownService添加baseUrl参数
- **位置**: `utils/turndown-enhanced.ts` 第8行
- **工作量**: 0.5小时

```typescript
export function createEnhancedTurndownService(
  useGfm: boolean = false, 
  baseUrl?: string
): TurndownService
```

#### 任务 2.2：更新Content Script调用
- **目标**: 在各content script中传递当前页面URL
- **涉及文件**:
  - `entrypoints/other.content.ts`（第54行）
  - `entrypoints/csdn.content.ts`（第46行）
  - `entrypoints/wechat_article.content.ts`
  - `entrypoints/scys.content.ts`
  - 其他5个content script文件
- **工作量**: 2小时

#### 任务 2.3：优化特殊网站处理
- **目标**: 针对CDN和特殊路径结构的网站优化
- **工作量**: 1.5小时

### 阶段 3：测试验证和优化（预计6.5小时）

#### 任务 3.1：创建测试用例
- **目标**: 验证各种路径转换场景
- **工作量**: 2小时

#### 任务 3.2：网站兼容性测试
- **目标**: 在9个支持的网站类型中测试
- **工作量**: 3小时

#### 任务 3.3：性能优化和错误处理
- **目标**: 确保性能和健壮性
- **工作量**: 1.5小时

## 测试用例设计

### 基本路径转换测试

```typescript
// 测试用例示例
const testCases = [
  {
    baseUrl: 'https://example.com/articles/tech/',
    input: '../images/logo.png',
    expected: 'https://example.com/articles/images/logo.png'
  },
  {
    baseUrl: 'https://example.com/blog/',
    input: '/assets/style.css',
    expected: 'https://example.com/assets/style.css'
  },
  {
    baseUrl: 'https://example.com/',
    input: 'https://cdn.example.com/img.jpg',
    expected: 'https://cdn.example.com/img.jpg' // 完整URL保持不变
  }
];
```

### 网站兼容性测试

| 网站类型 | 测试重点 | 预期结果 |
|---------|---------|---------|
| CSDN | 图片路径转换 | 相对路径转为绝对路径 |
| 知乎 | iframe视频链接 | 嵌入视频链接可访问 |
| 微信公众号 | 图片和链接 | CDN资源路径正确 |
| 通用网页 | 各类资源 | 全面的路径处理覆盖 |

## 验收标准

### 功能验收

1. ✅ **相对路径转换**: 所有相对路径（`./`、`../`、`/`开头）能正确转换为绝对路径
2. ✅ **完整URL保持**: 已经是完整URL的资源保持不变
3. ✅ **特殊协议处理**: data:和blob:协议的URL正确处理
4. ✅ **错误处理**: 路径解析失败时能优雅回退
5. ✅ **向后兼容**: 现有功能不受影响

### 性能验收

1. ✅ **转换性能**: 路径处理不显著影响转换速度
2. ✅ **内存使用**: 不增加明显的内存开销
3. ✅ **错误处理**: 异常情况下程序稳定运行

### 用户体验验收

1. ✅ **资源可访问**: 生成的Markdown中的图片、链接在本地可正常查看
2. ✅ **链接有效性**: 转换后的链接能正确跳转到目标资源
3. ✅ **兼容性**: 在Chrome和Firefox浏览器中表现一致

## 风险评估与应对

### 技术风险

| 风险项 | 影响程度 | 应对策略 |
|--------|----------|----------|
| URL解析失败 | 中等 | 添加try-catch和回退机制 |
| 性能下降 | 低 | 优化算法，避免重复计算 |
| 兼容性问题 | 中等 | 充分测试，渐进式部署 |

### 业务风险

| 风险项 | 影响程度 | 应对策略 |
|--------|----------|----------|
| 用户习惯改变 | 低 | 保持原有行为，只修复问题 |
| 某些网站失效 | 中等 | 针对性优化，建立白名单 |

## 后续优化方向

1. **智能链接检测**: 自动检测和标记可能失效的链接
2. **资源本地化**: 可选的资源下载和本地化功能
3. **路径策略配置**: 允许用户选择不同的路径处理策略
4. **批量处理优化**: 对包含大量资源的页面进行性能优化

## 总结

本规划文档详细定义了AutoMd相对路径处理功能的实施方案，预计总开发时间16.5小时，分3个阶段完成。通过此功能，用户在使用AutoMd转换网页时，生成的Markdown文件中的所有资源链接都将可在本地环境下正常访问，显著提升用户体验。

**下一步行动**: 等待用户确认规划方案，然后开始执行阶段1的开发任务。