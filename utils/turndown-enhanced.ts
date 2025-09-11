import TurndownService, { Node, Options } from "turndown";
import { gfm } from "turndown-plugin-gfm";

/**
 * 将相对路径解析为绝对路径
 * @param relativeUrl 相对路径或URL字符串
 * @param baseUrl 基准URL，通常是当前页面的URL
 * @returns 解析后的绝对路径
 */
function resolveResourceUrl(relativeUrl: string, baseUrl?: string): string {
  if (!baseUrl || !relativeUrl) {
    return relativeUrl;
  }

  try {
    // 如果已经是完整URL（包含协议），直接返回
    if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
      return relativeUrl;
    }
    
    // 处理特殊协议URL，保持原样
    if (relativeUrl.startsWith('data:') || 
        relativeUrl.startsWith('blob:') || 
        relativeUrl.startsWith('javascript:') ||
        relativeUrl.startsWith('mailto:') ||
        relativeUrl.startsWith('tel:')) {
      return relativeUrl;
    }
    
    // 使用URL构造函数解析相对路径为绝对路径
    const absoluteUrl = new URL(relativeUrl, baseUrl);
    return absoluteUrl.href;
  } catch (error) {
    // 路径解析失败时，返回原路径并记录警告
    console.warn('[AutoMd] 路径解析失败:', relativeUrl, 'baseUrl:', baseUrl, error);
    return relativeUrl;
  }
}

/**
 * 创建增强的Turndown服务，包含视频和多媒体元素的优化处理
 * @param useGfm 是否使用GitHub Flavored Markdown插件
 * @param baseUrl 可选的基准URL，用于解析相对路径
 */
export function createEnhancedTurndownService(useGfm: boolean = false, baseUrl?: string): TurndownService {
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '*'
  });

  // 如果需要，添加GFM支持
  if (useGfm) {
    turndownService.use(gfm);
  }

  // 保留video标签不转换，直接输出HTML，但处理其中的相对路径
  turndownService.addRule('preserveVideo', {
    filter: 'video',
    replacement: function (content, node, options) {
      const element = node as HTMLElement;
      const clonedElement = element.cloneNode(true) as HTMLElement;
      
      // 处理video标签的src属性
      const src = clonedElement.getAttribute('src');
      if (src) {
        const resolvedSrc = resolveResourceUrl(src, baseUrl);
        clonedElement.setAttribute('src', resolvedSrc);
      }
      
      // 处理source子元素的src属性
      const sources = clonedElement.querySelectorAll('source');
      sources.forEach(source => {
        const srcAttr = source.getAttribute('src');
        if (srcAttr) {
          const resolvedSrc = resolveResourceUrl(srcAttr, baseUrl);
          source.setAttribute('src', resolvedSrc);
        }
      });
      
      // 处理poster属性（视频封面图）
      const poster = clonedElement.getAttribute('poster');
      if (poster) {
        const resolvedPoster = resolveResourceUrl(poster, baseUrl);
        clonedElement.setAttribute('poster', resolvedPoster);
      }
      
      return '\n\n' + clonedElement.outerHTML + '\n\n';
    }
  });

  // 添加视频容器的自定义规则 (适用于SCYS等网站的player容器)
  turndownService.addRule('videoContainer', {
    filter: function (node: Node, options: Options): boolean {
      const element = node as HTMLElement;
      return element.nodeName === 'DIV' && 
             (element.classList.contains('player') ||
              element.classList.contains('video-player') ||
              element.classList.contains('video-container')) &&
             element.querySelector('video') !== null;
    },
    replacement: function (content, node, options) {
      // 只保留视频元素，过滤掉容器内的其他元素，并处理其中的路径
      const element = node as HTMLElement;
      const video = element.querySelector('video');
      if (video) {
        const clonedVideo = video.cloneNode(true) as HTMLElement;
        
        // 处理video的src属性
        const src = clonedVideo.getAttribute('src');
        if (src) {
          const resolvedSrc = resolveResourceUrl(src, baseUrl);
          clonedVideo.setAttribute('src', resolvedSrc);
        }
        
        // 处理source子元素
        const sources = clonedVideo.querySelectorAll('source');
        sources.forEach(source => {
          const srcAttr = source.getAttribute('src');
          if (srcAttr) {
            const resolvedSrc = resolveResourceUrl(srcAttr, baseUrl);
            source.setAttribute('src', resolvedSrc);
          }
        });
        
        // 处理poster属性
        const poster = clonedVideo.getAttribute('poster');
        if (poster) {
          const resolvedPoster = resolveResourceUrl(poster, baseUrl);
          clonedVideo.setAttribute('poster', resolvedPoster);
        }
        
        return '\n\n' + clonedVideo.outerHTML + '\n\n';
      }
      return '';
    }
  });

  // 添加iframe视频的处理 (如YouTube, Bilibili等)
  turndownService.addRule('iframe', {
    filter: 'iframe',
    replacement: function (content, node, options) {
      const element = node as HTMLElement;
      const src = element.getAttribute('src');
      const title = element.getAttribute('title') || '';
      
      if (!src) return '';
      
      // 解析iframe的src路径
      const resolvedSrc = resolveResourceUrl(src, baseUrl);
      
      // 检测常见的视频平台
      if (resolvedSrc.includes('youtube.com') || resolvedSrc.includes('youtu.be')) {
        return `\n\n**📺 YouTube视频**\n[🎥 ${title || '观看视频'}](${resolvedSrc})\n\n`;
      } else if (resolvedSrc.includes('bilibili.com')) {
        return `\n\n**📺 哔哩哔哩视频**\n[🎥 ${title || '观看视频'}](${resolvedSrc})\n\n`;
      } else if (resolvedSrc.includes('vimeo.com')) {
        return `\n\n**📺 Vimeo视频**\n[🎥 ${title || '观看视频'}](${resolvedSrc})\n\n`;
      } else if (resolvedSrc.match(/\.(mp4|webm|ogg|avi|mov)$/i)) {
        return `\n\n**📹 视频文件**\n[🎥 ${title || '下载视频'}](${resolvedSrc})\n\n`;
      }
      
      return `\n\n**🔗 嵌入内容**\n[📄 ${title || '查看内容'}](${resolvedSrc})\n\n`;
    }
  });

  // 增强图片处理
  turndownService.addRule('enhancedImage', {
    filter: 'img',
    replacement: function (content, node, options) {
      const element = node as HTMLElement;
      const src = element.getAttribute('src');
      const alt = element.getAttribute('alt') || '';
      const title = element.getAttribute('title');
      
      if (!src) return '';
      
      // 特殊处理播放按钮图片
      if ((src.startsWith('data:image') || src.includes('play')) && 
          (element.classList.contains('btn') || 
           element.classList.contains('play-btn') ||
           alt.includes('播放') ||
           alt.includes('play'))) {
        return '\n[▶️ 播放按钮]\n';
      }
      
      // 正常图片处理 - 解析相对路径
      const resolvedSrc = resolveResourceUrl(src, baseUrl);
      let imageMarkdown = `![${alt}](${resolvedSrc}`;
      if (title) {
        imageMarkdown += ` "${title}"`;
      }
      imageMarkdown += ')';
      
      return imageMarkdown;
    }
  });

  // 添加音频元素处理 - 保留HTML标签并处理相对路径
  turndownService.addRule('preserveAudio', {
    filter: 'audio',
    replacement: function (content, node, options) {
      const element = node as HTMLElement;
      const clonedElement = element.cloneNode(true) as HTMLElement;
      
      // 处理audio标签的src属性
      const src = clonedElement.getAttribute('src');
      if (src) {
        const resolvedSrc = resolveResourceUrl(src, baseUrl);
        clonedElement.setAttribute('src', resolvedSrc);
      }
      
      // 处理source子元素的src属性
      const sources = clonedElement.querySelectorAll('source');
      sources.forEach(source => {
        const srcAttr = source.getAttribute('src');
        if (srcAttr) {
          const resolvedSrc = resolveResourceUrl(srcAttr, baseUrl);
          source.setAttribute('src', resolvedSrc);
        }
      });
      
      return '\n\n' + clonedElement.outerHTML + '\n\n';
    }
  });

  // 添加链接处理规则 - 处理a标签的href属性相对路径
  turndownService.addRule('enhancedLink', {
    filter: 'a',
    replacement: function (content, node, options) {
      const element = node as HTMLElement;
      const href = element.getAttribute('href');
      const title = element.getAttribute('title');
      
      if (!href) {
        return content; // 无href属性则返回原内容
      }
      
      // 解析href相对路径
      const resolvedHref = resolveResourceUrl(href, baseUrl);
      
      // 构建Markdown链接
      let linkMarkdown = `[${content}](${resolvedHref}`;
      if (title) {
        linkMarkdown += ` "${title}"`;
      }
      linkMarkdown += ')';
      
      return linkMarkdown;
    }
  });

  return turndownService;
}