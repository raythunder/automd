import { createEnhancedTurndownService } from "../utils/turndown-enhanced";

export default defineContentScript({
  matches: ["https://scys.com/course/*"],
  async main() {
    if (document.readyState != "complete") return;
    const scrollToBottomAndReturnContent = () => {
      // 获取文档的高度和滚动条的位置
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop;

      // 如果已经滚动到了底部
      if (scrollTop + window.innerHeight >= scrollHeight) {
        return Promise.resolve(); // 已经在底部，直接返回一个已解决的 Promise
      }

      // 滚动到最底部
      window.scrollTo({
        top: scrollHeight,
        behavior: "smooth",
      });

      return new Promise<void>((resolve) => {
        const checkScrollPosition = () => {
          const newScrollTop = document.documentElement.scrollTop || document.body.scrollTop;
          if (newScrollTop + window.innerHeight + 20 >= scrollHeight) {
            window.scrollTo({ top: scrollTop, behavior: "instant" });
            window.removeEventListener("scroll", checkScrollPosition); // 移除监听器
            resolve(); // 解决 Promise 表示滚动到底部
          }
        };

        // 开始检查滚动位置
        window.addEventListener("scroll", checkScrollPosition);
      });
    };
    // 使用 await 等待滚动到底部
    await scrollToBottomAndReturnContent();

    let title = document.querySelector("h1")?.outerHTML;
    let titleText = document.title;
    let content = document.querySelector(".vc-course-content")?.outerHTML;

    // 使用增强的Turndown服务，包含视频处理功能
    const turndownService = createEnhancedTurndownService();
    const markdown = turndownService.turndown(`${content}`);

    return { title: titleText, content: markdown };
  },
});
