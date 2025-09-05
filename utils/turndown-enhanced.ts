import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

/**
 * 创建增强的Turndown服务，包含视频和多媒体元素的优化处理
 * @param useGfm 是否使用GitHub Flavored Markdown插件
 */
export function createEnhancedTurndownService(useGfm: boolean = false): TurndownService {
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

  // 保留video标签不转换，直接输出HTML
  turndownService.addRule('preserveVideo', {
    filter: 'video',
    replacement: function (content, node, options) {
      return '\n\n' + node.outerHTML + '\n\n';
    }
  });

  // 添加视频容器的自定义规则 (适用于SCYS等网站的player容器)
  turndownService.addRule('videoContainer', {
    filter: function (node, options) {
      return node.nodeName === 'DIV' && 
             (node.classList.contains('player') ||
              node.classList.contains('video-player') ||
              node.classList.contains('video-container')) &&
             node.querySelector('video');
    },
    replacement: function (content, node, options) {
      // 只保留视频元素，过滤掉容器内的其他元素
      const video = node.querySelector('video');
      if (video) {
        return '\n\n' + video.outerHTML + '\n\n';
      }
      return '';
    }
  });

  // 添加iframe视频的处理 (如YouTube, Bilibili等)
  turndownService.addRule('iframe', {
    filter: 'iframe',
    replacement: function (content, node, options) {
      const src = node.getAttribute('src');
      const title = node.getAttribute('title') || '';
      
      if (!src) return '';
      
      // 检测常见的视频平台
      if (src.includes('youtube.com') || src.includes('youtu.be')) {
        return `\n\n**📺 YouTube视频**\n[🎥 ${title || '观看视频'}](${src})\n\n`;
      } else if (src.includes('bilibili.com')) {
        return `\n\n**📺 哔哩哔哩视频**\n[🎥 ${title || '观看视频'}](${src})\n\n`;
      } else if (src.includes('vimeo.com')) {
        return `\n\n**📺 Vimeo视频**\n[🎥 ${title || '观看视频'}](${src})\n\n`;
      } else if (src.match(/\.(mp4|webm|ogg|avi|mov)$/i)) {
        return `\n\n**📹 视频文件**\n[🎥 ${title || '下载视频'}](${src})\n\n`;
      }
      
      return `\n\n**🔗 嵌入内容**\n[📄 ${title || '查看内容'}](${src})\n\n`;
    }
  });

  // 增强图片处理
  turndownService.addRule('enhancedImage', {
    filter: 'img',
    replacement: function (content, node, options) {
      const src = node.getAttribute('src');
      const alt = node.getAttribute('alt') || '';
      const title = node.getAttribute('title');
      
      if (!src) return '';
      
      // 特殊处理播放按钮图片
      if ((src.startsWith('data:image') || src.includes('play')) && 
          (node.classList.contains('btn') || 
           node.classList.contains('play-btn') ||
           alt.includes('播放') ||
           alt.includes('play'))) {
        return '\n[▶️ 播放按钮]\n';
      }
      
      // 正常图片处理
      let imageMarkdown = `![${alt}](${src}`;
      if (title) {
        imageMarkdown += ` "${title}"`;
      }
      imageMarkdown += ')';
      
      return imageMarkdown;
    }
  });

  // 添加音频元素处理 - 也保留HTML标签
  turndownService.addRule('preserveAudio', {
    filter: 'audio',
    replacement: function (content, node, options) {
      return '\n\n' + node.outerHTML + '\n\n';
    }
  });

  return turndownService;
}