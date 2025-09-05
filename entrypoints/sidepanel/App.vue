<script lang="ts" setup>
import {Tabs} from 'wxt/browser';

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
})

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
    <!-- 需要根据网站的不同来显示 -->
    <span class="current-title">当前为<b>{{ title }}</b></span>
    <div class="target" v-show="isCSDN">
      <button @click="sendMessageAndDownload('csdn')" :disabled="isLoading">下载CSDN文章Markdown</button>
      <div class="or">or</div>
    </div>

    <div class="target" v-show="isZhihuArticle">
      <button @click="sendMessageAndDownload('zhihu-article')" :disabled="isLoading">下载知乎专栏Markdown</button>
      <div class="or">or</div>
    </div>

    <div class="target" v-show="isZhihuAnswer">
      <button @click="sendMessageAndDownload('zhihu-answer')" :disabled="isLoading">下载知乎回答Markdown</button>
      <div class="or">or</div>
    </div>

    <div class="target" v-show="isCnBlogs">
      <button @click="sendMessageAndDownload('cnblogs')" :disabled="isLoading">下载博客园文章Markdown</button>
      <div class="or">or</div>
    </div>

    <div class="target" v-show="isChatGPT">
      <button @click="sendMessageAndDownload('chatgpt')" :disabled="isLoading">下载ChatGPT对话Markdown</button>
      <div class="or">or</div>
    </div>

    <div class="target" v-show="isWeChat">
      <button @click="sendMessageAndDownload('wechat')" :disabled="isLoading">下载微信公众号文章Markdown</button>
      <div class="or">or</div>
    </div>

    <div class="target" v-show="isScys">
      <button @click="sendMessageAndDownload('scys')" :disabled="isLoading">下载SCYS课程Markdown</button>
      <div class="or">or</div>
    </div>

    <button @click="sendMessageAndDownload('other');" :disabled="isLoading">下载整个网页</button>
    <span class="error-message" v-show="isError">出现错误，请重试或刷新后重试。</span>
    <div class="build">本扩展基于<a href="https://wxt.dev/"><span>wxt</span><img src="@/assets/wxt.svg"></a>构建</div>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 20px;
  min-width: 320px;
  max-width: 400px;
  font-family: system-ui, -apple-system, sans-serif;
}

.title {
  font-size: 24px;
  display: flex;
  align-items: center;
  color: #4b92d9;
  font-weight: bold;
  gap: 8px;
}

.current-title {
  font-size: 14px;
  color: #666;
  b {
    margin-left: 5px;
    color: #333;
  }
}

.error-message {
  color: rgb(225, 67, 67);
  font-size: 14px;
  text-align: center;
  padding: 8px;
  background-color: #ffeaea;
  border-radius: 4px;
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
  gap: 8px;
}

.target button {
  padding: 12px 16px;
  border: none;
  border-radius: 6px;
  background-color: #4b92d9;
  color: white;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.target button:hover:not(:disabled) {
  background-color: #3a7bc8;
}

.target button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

button {
  padding: 12px 16px;
  border: none;
  border-radius: 6px;
  background-color: #28a745;
  color: white;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

button:hover:not(:disabled) {
  background-color: #218838;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.or {
  color: #999;
  font-size: 12px;
}

.build {
  font-size: 12px;
  text-align: center;
  color: #666;
  
  a {
    margin: 0 3px;
    border-bottom: 1px solid rgb(103, 213, 94);
    text-decoration: none;
  }

  span {
    color: rgb(103, 213, 94);
    font-size: 14px;
    font-weight: 500;
  }

  img {
    margin-left: 3px;
    width: 14px;
    height: 14px;
    vertical-align: middle;
  }
}
</style>