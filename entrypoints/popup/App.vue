<script lang="ts" setup>
import {Tabs} from 'wxt/browser';
import TabSwitcher from './TabSwitcher.vue';

// 获取网站地址
let currentUrl: string;
let currentTab: Tabs.Tab;
let tabId: number;
const title = ref("loading");
onMounted(async () => {
  let tabs = await browser.tabs.query({active: true, currentWindow: true});

  if (tabs.length > 0) {
    currentTab = tabs[0];
    currentUrl = currentTab.url || "loading";
    tabId = currentTab.id || 0;
    title.value = currentTab.title || "loading";
  }

  isCSDN.value = currentUrl.includes("https://blog.csdn.net") ||
      currentUrl.includes("https://csdnnews.blog.csdn.net");
  isZhihuArticle.value = currentUrl.includes("https://zhuanlan.zhihu.com");
  isZhihuAnswer.value = currentUrl.includes("https://www.zhihu.com/question");
  isCnBlogs.value = currentUrl.includes("https://www.cnblogs.com");
  isChatGPT.value = currentUrl.includes("https://chatgpt.com") ||
      currentUrl.includes("https://chat.openai.com");
  isWeChat.value = currentUrl.includes("https://mp.weixin.qq.com/s");
  isScys.value = currentUrl.includes("https://scys.com/course/");
  
  // 恢复之前的选择状态
  const savedState = await storage.getMeta('local:select_mode');
  if (savedState?.mode !== undefined && typeof savedState.mode === 'number') {
    activeTab.value = savedState.mode === 1 ? 'manual' : 'auto';
  }
})

// 选择功能
const tabs = ref([
  { id: 'auto', label: '页面全选', icon: '🌐' },
  { id: 'manual', label: '手动选择', icon: '🎯' }
]);
const activeTab = ref('auto');
const selectedContent = ref<{title: string, content: string} | null>(null);
const copySuccess = ref(false);
const copyMessage = ref('');
const isSelectingMode = ref(false);

const onTabChange = async (tabId: string) => {
  activeTab.value = tabId;
  
  // 保存选择状态
  await storage.setMeta('local:select_mode', { mode: tabId === 'manual' ? 1 : 0 });
  
  // 清空之前选择的内容
  selectedContent.value = null;
  isSelectingMode.value = false;
};

// 监听选择结果
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "element_selected") {
    selectedContent.value = message.content;
    isSelectingMode.value = false;
    sendResponse();
  } else if (message.action === "selection_cancelled") {
    isSelectingMode.value = false;
    selectedContent.value = null;
    sendResponse();
  }
  return true;
});

// 启动元素选择模式
const startElementSelection = async () => {
  isSelectingMode.value = true;
  try {
    await browser.runtime.sendMessage({ action: "start_selecting" });
  } catch (error) {
    console.error('启动选择模式失败:', error);
    isError.value = true;
    isSelectingMode.value = false;
  }
};

// 取消选择模式
const cancelSelection = async () => {
  isSelectingMode.value = false;
  selectedContent.value = null;
  try {
    await browser.runtime.sendMessage({ action: "cancel_selecting" });
  } catch (error) {
    console.error('取消选择模式失败:', error);
  }
};

// 下载选中的内容
const downloadSelected = () => {
  if (selectedContent.value) {
    download(selectedContent.value.title, selectedContent.value.content);
    selectedContent.value = null;
  }
};

// 复制选中的内容
const copySelected = async () => {
  if (selectedContent.value) {
    await copyToClipboard(selectedContent.value.content);
  }
};

// 通用复制功能
const copyToClipboard = async (content: string) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      // 现代浏览器的异步API
      await navigator.clipboard.writeText(content);
    } else {
      // 降级到同步API
      const textArea = document.createElement('textarea');
      textArea.value = content;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
    }
    showCopySuccess('内容已复制到剪贴板');
  } catch (err) {
    console.error('复制失败:', err);
    showCopySuccess('复制失败，请重试', false);
  }
};

// 显示复制结果提示
const showCopySuccess = (message: string, success: boolean = true) => {
  copyMessage.value = message;
  copySuccess.value = success;
  setTimeout(() => {
    copySuccess.value = false;
    copyMessage.value = '';
  }, 2000);
};

// 复制并下载功能
const sendMessageAndCopy = async (site: string) => {
  isLoading.value = true;
  const response = await browser.runtime.sendMessage(site);
  if (response) {
    await copyToClipboard(response.content);
    isError.value = false;
  } else {
    isError.value = true;
  }
  isLoading.value = false;
};

// 发消息
const isError = ref(false);
const sendMessageAndDownload = async (site: string) => {
  isLoading.value = true;
  const response = await browser.runtime.sendMessage(site);
  if (response) {
    download(response.title, response.content);
    isError.value = false;
  } else isError.value = true;
  isLoading.value = false;
};
// 控制显示
const isCSDN = ref(false);
const isZhihuArticle = ref(false);
const isZhihuAnswer = ref(false);
const isCnBlogs = ref(false);
const isChatGPT = ref(false);
const isWeChat = ref(false);
const isScys = ref(false);

// 下载
const isLoading = ref(false);
const download = (title: string, content: string) => {
  // 创建一个 Blob 对象，并使用 URL.createObjectURL 创建一个临时链接
  const blob = new Blob([content], {type: 'text/markdown'});
  const url = URL.createObjectURL(blob);

  // 创建一个隐藏的 <a> 元素，并设置 href 和 download 属性
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title}.md`;
  link.style.display = 'none';
  document.body.appendChild(link);

  // 触发下载
  link.click();

  // 清理临时链接
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
</script>

<template>
  <div class="app">
    <div class="title"><img src="@/assets/32.png">AutoMd</div>
    <div class="briefly">
      <span>目前适配：CSDN、知乎专栏、知乎问答、博客园、SCYS课程、微信公众号</span>
    </div>
    
    <!-- Tab选项卡 -->
    <TabSwitcher 
      :tabs="tabs" 
      :active-tab="activeTab"
      @tab-change="onTabChange"
    />
    
    <!-- 复制成功提示 -->
    <div v-if="copySuccess" class="copy-notice" :class="{ 'error': !copySuccess }">
      <span>{{ copyMessage }}</span>
    </div>
    
    <!-- 选中内容提示 -->
    <div v-if="selectedContent" class="selected-notice">
      <span>✅ 已选择元素</span>
      <div class="button-group">
        <button @click="copySelected" class="copy-selected">复制内容</button>
        <button @click="downloadSelected" class="download-selected">下载内容</button>
      </div>
    </div>
    
    <!-- 需要根据网站的不同来显示 -->
    <span class="current-title">当前为<b>{{ title }}</b></span>
    
    <!-- Tab内容区域 -->
    <div class="tab-content">
      <!-- 页面全选Tab -->
      <div v-if="activeTab === 'auto'" class="tab-panel">
        <div class="target" v-show="isCSDN">
          <div class="button-group">
            <button @click="sendMessageAndCopy('csdn')" :disabled="isLoading" class="copy-btn">复制</button>
            <button @click="sendMessageAndDownload('csdn')" :disabled="isLoading">下载</button>
          </div>
          <span class="target-label">CSDN文章Markdown</span>
          <div class="or">or</div>
        </div>

        <div class="target" v-show="isZhihuArticle">
          <div class="button-group">
            <button @click="sendMessageAndCopy('zhihu-article')" :disabled="isLoading" class="copy-btn">复制</button>
            <button @click="sendMessageAndDownload('zhihu-article')" :disabled="isLoading">下载</button>
          </div>
          <span class="target-label">知乎专栏Markdown</span>
          <div class="or">or</div>
        </div>

        <div class="target" v-show="isZhihuAnswer">
          <div class="button-group">
            <button @click="sendMessageAndCopy('zhihu-answer')" :disabled="isLoading" class="copy-btn">复制</button>
            <button @click="sendMessageAndDownload('zhihu-answer')" :disabled="isLoading">下载</button>
          </div>
          <span class="target-label">知乎回答Markdown</span>
          <div class="or">or</div>
        </div>

        <div class="target" v-show="isCnBlogs">
          <div class="button-group">
            <button @click="sendMessageAndCopy('cnblogs')" :disabled="isLoading" class="copy-btn">复制</button>
            <button @click="sendMessageAndDownload('cnblogs')" :disabled="isLoading">下载</button>
          </div>
          <span class="target-label">博客园文章Markdown</span>
          <div class="or">or</div>
        </div>

        <div class="target" v-show="isChatGPT">
          <div class="button-group">
            <button @click="sendMessageAndCopy('chatgpt')" :disabled="isLoading" class="copy-btn">复制</button>
            <button @click="sendMessageAndDownload('chatgpt')" :disabled="isLoading">下载</button>
          </div>
          <span class="target-label">ChatGPT对话Markdown</span>
          <div class="or">or</div>
        </div>

        <div class="target" v-show="isWeChat">
          <div class="button-group">
            <button @click="sendMessageAndCopy('wechat')" :disabled="isLoading" class="copy-btn">复制</button>
            <button @click="sendMessageAndDownload('wechat')" :disabled="isLoading">下载</button>
          </div>
          <span class="target-label">微信公众号文章Markdown</span>
          <div class="or">or</div>
        </div>

        <div class="target" v-show="isScys">
          <div class="button-group">
            <button @click="sendMessageAndCopy('scys')" :disabled="isLoading" class="copy-btn">复制</button>
            <button @click="sendMessageAndDownload('scys')" :disabled="isLoading">下载</button>
          </div>
          <span class="target-label">SCYS课程Markdown</span>
          <div class="or">or</div>
        </div>

        <div class="target">
          <div class="button-group">
            <button @click="sendMessageAndCopy('other')" :disabled="isLoading" class="copy-btn">复制</button>
            <button @click="sendMessageAndDownload('other')" :disabled="isLoading">下载</button>
          </div>
          <span class="target-label">整个网页</span>
        </div>
      </div>

      <!-- 手动选择Tab -->
      <div v-else-if="activeTab === 'manual'" class="tab-panel">
        <!-- 选择控制区域 -->
        <div class="manual-controls">
          <div v-if="!isSelectingMode && !selectedContent" class="selection-prompt">
            <div class="prompt-icon">🎯</div>
            <h3>手动选择模式</h3>
            <p>点击下方按钮开始选择页面中的任意元素</p>
            <button @click="startElementSelection" class="start-selection-btn">
              <span class="btn-icon">✨</span>
              开始选择元素
            </button>
          </div>
          
          <div v-else-if="isSelectingMode" class="selecting-status">
            <div class="status-icon animate-pulse">👆</div>
            <h3>正在选择中...</h3>
            <p>在页面中点击任意元素来选择要转换的内容</p>
            <div class="selection-tips">
              <div class="tip">💡 移动鼠标预览选择区域</div>
              <div class="tip">⌨️ 按 Esc 键取消选择</div>
            </div>
            <button @click="cancelSelection" class="cancel-selection-btn">
              取消选择
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <span class="error-message" v-show="isError">出现错误，请重试或刷新后重试。</span>
    <div class="build">本扩展基于<a href="https://wxt.dev/"><span>wxt</span><img src="@/assets/wxt.svg"></a>构建</div>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.title {
  font-size: 20px;
  display: flex;
  align-items: center;
  color: #4b92d9;
  font-weight: bold;
}

.current-title {
  b {
    margin-left: 5px;
  }
}

.error-message {
  color: rgb(225, 67, 67);
}

.briefly {
  color: rgb(176, 176, 176);
  font-size: 12px;
  margin-bottom: 10px;
}

.target {
  display: flex;
  flex-direction: column;
  text-align: center;
  gap: 5px;
}

.build {
  a {
    margin: 0 3px;
    border-bottom: 1px solid rgb(103, 213, 94);
  }

  span {
    color: rgb(103, 213, 94);
    font-size: 20px;
  }

  img {
    margin-left: 3px;
    width: 16px;
    height: 16px;
  }
}

.copy-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #d1edff;
  border: 1px solid #4b92d9;
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 15px;
  font-size: 14px;
  color: #2c5282;
  font-weight: 500;
}

.copy-notice.error {
  background-color: #ffeaea;
  border-color: #dc3545;
  color: #721c24;
}

.selected-notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #e8f5e8;
  border: 1px solid #4caf50;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 15px;
  font-size: 14px;
  color: #2e7d2e;
}

.button-group {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
}

.copy-selected, .download-selected {
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.copy-selected {
  background-color: #6c757d;
}

.copy-selected:hover {
  background-color: #5a6268;
}

.download-selected:hover {
  background-color: #45a049;
}

.copy-btn {
  background-color: #6c757d !important;
  min-width: 60px;
}

.copy-btn:hover:not(:disabled) {
  background-color: #5a6268 !important;
}

.target-label {
  font-size: 12px;
  color: #666;
  text-align: center;
  margin-top: 4px;
}

.tab-content {
  min-height: 200px;
}

.tab-panel {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.manual-controls {
  padding: 20px 0;
}

.selection-prompt {
  text-align: center;
  padding: 30px 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  border: 2px dashed #dee2e6;
}

.prompt-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.selection-prompt h3 {
  color: #495057;
  margin: 12px 0 8px 0;
  font-size: 18px;
  font-weight: 600;
}

.selection-prompt p {
  color: #6c757d;
  margin: 8px 0 24px 0;
  font-size: 14px;
  line-height: 1.5;
}

.start-selection-btn {
  background: linear-gradient(135deg, #4b92d9 0%, #3a7bc8 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 auto;
  box-shadow: 0 4px 12px rgba(75, 146, 217, 0.3);
}

.start-selection-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(75, 146, 217, 0.4);
}

.start-selection-btn:active {
  transform: translateY(0);
}

.btn-icon {
  font-size: 16px;
}

.selecting-status {
  text-align: center;
  padding: 30px 20px;
  background: linear-gradient(135deg, #d1edff 0%, #b8e6ff 100%);
  border-radius: 12px;
  border: 2px solid #4b92d9;
}

.status-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.animate-pulse {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.05); }
}

.selecting-status h3 {
  color: #2c5282;
  margin: 12px 0 8px 0;
  font-size: 18px;
  font-weight: 600;
}

.selecting-status p {
  color: #2c5282;
  margin: 8px 0 20px 0;
  font-size: 14px;
  line-height: 1.5;
}

.selection-tips {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  padding: 16px;
  margin: 20px 0;
  backdrop-filter: blur(10px);
}

.selection-tips .tip {
  font-size: 13px;
  color: #495057;
  margin: 6px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.cancel-selection-btn {
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 12px;
}

.cancel-selection-btn:hover {
  background-color: #5a6268;
}
</style>
