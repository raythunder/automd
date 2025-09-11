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

            // 不创建遮罩层，直接开始选择
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
                hoveredElement.style.boxShadow = "";
            }

            // 高亮当前元素
            target.style.background = "rgba(93, 163, 255, 0.1)";
            target.style.boxShadow = "0 0 0 2px rgb(93, 163, 255), 0 0 8px rgba(93, 163, 255, 0.4)";
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

            if (hoveredElement) {
                hoveredElement.style.background = ""; // 移除高亮
                hoveredElement.style.zIndex = ""; 
                hoveredElement.style.boxShadow = "";
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

            // 使用增强的Turndown服务转换元素，包含路径处理
            const turndownService = createEnhancedTurndownService(false, window.location.href);
            const markdown = turndownService.turndown(target.outerHTML);
            
            let titleText = document.title;
            
            // 将元素内容发送给扩展
            return browser.runtime.sendMessage({
                action: "element_selected",
                content: { title: titleText, content: markdown }
            });
        }

        // 监听消息
        browser.runtime.onMessage.addListener((message) => {
            if (message.action === "start_selecting") {
                start();
                return Promise.resolve({ success: true });
            } else if (message.action === "cancel_selecting") {
                cleanup();
                return Promise.resolve({ success: true });
            }
        });
    }
});