import { createEnhancedTurndownService } from "../utils/turndown-enhanced";

export default defineContentScript({
    matches: ["*://*/*"],
    async main() {
        let isSelecting = false; // 是否正在选择元素
        let hoveredElement: HTMLElement | null = null; // 当前悬停的元素
        let overlay: HTMLElement | null = null; // 遮罩层

        // 开始选择元素
        function start() {
            isSelecting = true;

            // 创建遮罩层
            overlay = document.createElement("div");
            overlay.style.position = "fixed";
            overlay.style.top = "0";
            overlay.style.left = "0";
            overlay.style.width = "100%";
            overlay.style.height = "100%";
            overlay.style.backgroundColor = "rgba(0, 0, 0, 0.3)";
            overlay.style.pointerEvents = "none"; // 允许点击穿透
            overlay.style.zIndex = "9998";
            document.body.appendChild(overlay);

            // 监听鼠标移动
            document.addEventListener("mousemove", onMouseMove);
            // 监听点击事件
            document.addEventListener("click", onClick, { once: true });
            // 监听Escape键取消选择
            document.addEventListener("keydown", onKeyDown);
        }

        // 鼠标移动时高亮元素
        function onMouseMove(event: MouseEvent) {
            if (!isSelecting) return;

            // 获取当前悬停的元素
            const target = event.target as HTMLElement;
            if (hoveredElement && hoveredElement !== target) {
                // 移除之前的高亮样式
                hoveredElement.style.background = "";
                hoveredElement.style.zIndex = "";
                hoveredElement.style.border = "";
                hoveredElement.style.outline = "";
            }

            // 高亮当前元素
            target.style.background = "rgba(93, 163, 255, 0.7)";
            target.style.border = "2px solid rgb(93, 163, 255)";
            target.style.outline = "2px solid rgba(93, 163, 255, 0.8)";
            target.style.zIndex = "10000";
            hoveredElement = target;
        }

        // 监听键盘事件
        function onKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape" && isSelecting) {
                // 取消选择
                cleanup();
            }
        }

        // 清理选择状态
        function cleanup() {
            isSelecting = false;
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("keydown", onKeyDown);
            
            if (overlay) {
                document.body.removeChild(overlay);
                overlay = null;
            }

            if (hoveredElement) {
                hoveredElement.style.background = ""; // 移除高亮
                hoveredElement.style.zIndex = ""; 
                hoveredElement.style.border = "";
                hoveredElement.style.outline = "";
                hoveredElement = null;
            }
        }

        // 点击元素后停止监听
        async function onClick(event: MouseEvent) {
            if (!isSelecting) return;

            // 阻止默认行为
            event.preventDefault();
            event.stopPropagation();

            // 获取点击的元素
            const target = event.target as HTMLElement;
            
            // 清理选择状态
            cleanup();

            // 使用增强的Turndown服务转换元素
            const turndownService = createEnhancedTurndownService();
            const markdown = turndownService.turndown(target.outerHTML);
            
            let titleText = document.title;
            
            // 将元素内容发送给扩展
            return browser.runtime.sendMessage({
                action: "element_selected",
                content: { title: titleText, content: markdown }
            });
        }

        // 监听消息
        browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === "start_selecting") {
                start();
                sendResponse({ success: true });
            }
            return false;
        });
    }
});