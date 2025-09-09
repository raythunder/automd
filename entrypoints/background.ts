export default defineBackground(() => {
  // 设置侧边栏行为 - 点击扩展图标时打开侧边栏
  browser.runtime.onInstalled.addListener(() => {
    // @ts-ignore - sidePanel API may not be available in all browsers
    if (browser.sidePanel) {
      // @ts-ignore
      browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
    }
  });

  // background.js
  browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    let content;
    const tabId = (await browser.tabs.query({ active: true, currentWindow: true }))[0]?.id || 0;
    if (tabId == 0) return false;
    try {
      // 处理选择功能消息
      if (message.action === "start_selecting") {
        // 注入选择功能的content script
        try {
          await browser.scripting.executeScript({
            target: { tabId },
            files: ['content-scripts/choose.js']
          });
          // 发送消息启动选择
          const response = await browser.tabs.sendMessage(tabId, { action: "start_selecting" });
          return response;
        } catch (error: any) {
          console.error('启动选择功能失败:', error);
          return { success: false, error: error.message };
        }
      }

      // 处理取消选择消息
      if (message.action === "cancel_selecting") {
        try {
          // 可以发送消息给content script取消选择
          const response = await browser.tabs.sendMessage(tabId, { action: "cancel_selecting" });
          return { success: true };
        } catch (error: any) {
          console.error('取消选择失败:', error);
          return { success: false };
        }
      }

      // 处理选择结果消息
      if (message.action === "element_selected") {
        // 转发消息到popup
        try {
          browser.runtime.sendMessage({
            action: "element_selected",
            content: message.content
          });
          return { success: true };
        } catch (error: any) {
          console.error('转发选择结果失败:', error);
          return { success: false };
        }
      }

      switch (message) {
        case 'csdn':
          content = await browser.scripting.executeScript({
            target: { tabId },
            files: ['content-scripts/csdn.js']
          });
          break;
        case 'zhihu-article':
          content = await browser.scripting.executeScript({
            target: { tabId },
            files: ['content-scripts/zhihu_article.js']
          });
          break;
        case 'zhihu-answer':
          content = await browser.scripting.executeScript({
            target: { tabId },
            files: ['content-scripts/zhihu_answer.js']
          });
          break;
        case 'cnblogs':
          content = await browser.scripting.executeScript({
            target: { tabId },
            files: ['content-scripts/cnblogs.js']
          });
          break;
        case 'chatgpt':
            content = await browser.scripting.executeScript({
                target: { tabId },
                files: ['content-scripts/chat_gpt.js']
            });
            break;
        case 'wechat':
          content = await browser.scripting.executeScript({
            target: {tabId},
            files: ['content-scripts/wechat_article.js']
          });
          break;
        case 'scys':
          content = await browser.scripting.executeScript({
            target: {tabId},
            files: ['content-scripts/scys.js']
          });
          break;
        case 'other':
        default:
          content = await browser.scripting.executeScript({
            target: { tabId },
            files: ['content-scripts/other.js']
          });
          break;
      }

      const result = content[0].result;
      console.log(result);
      // sendResponse(result);
      return result;
    } catch (error: any) {
      console.error(error);
      return false;
    }
  });
});
