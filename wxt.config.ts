import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  manifest: {
    "name": "Auto Md",
    "permissions": ["tabs", "scripting", "sidePanel"], // API 权限
    "host_permissions": ["*://*/*"], // 允许访问所有网站
    "action": {}, // 支持侧边栏需要action对象
  }
});
