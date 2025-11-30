/**
 * Background Service Worker
 * 监听快捷键事件和管理扩展状态
 */

// 监听快捷键命令
chrome.commands.onCommand.addListener((command) => {
  if (command === '_execute_action') {
    // 打开或聚焦 popup
    openPopup();
  }
});

// 监听扩展图标点击
chrome.action.onClicked.addListener(() => {
  openPopup();
});

/**
 * 打开 popup 窗口
 */
function openPopup() {
  // Manifest V3 中，popup 会自动打开
  // 这里主要用于记录状态或执行其他逻辑
  console.log('Opening bookmark search popup');
}

// 监听扩展安装或更新
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Quicker 书签搜索插件已安装');
    // 可以在这里显示欢迎页面
  } else if (details.reason === 'update') {
    console.log('Quicker 书签搜索插件已更新到版本:', chrome.runtime.getManifest().version);
  }
});

// 监听 popup 关闭事件，确保状态保存
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'keepAlive') {
    sendResponse({ status: 'alive' });
    return false; // 同步响应，不需要保持通道开放
  } else if (request.action === 'saveSearchState') {
    // 保存搜索状态
    const data = {
      searchQuery: request.searchQuery,
      timestamp: Date.now()
    };
    chrome.storage.local.set({ 'quickerSearchState': data })
      .then(() => sendResponse({ success: true }))
      .catch(error => {
        console.error('Background save failed:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // 保持消息通道开放
  } else if (request.action === 'getSearchState') {
    // 获取搜索状态
    chrome.storage.local.get('quickerSearchState')
      .then(result => {
        const data = result.quickerSearchState;
        if (data && data.searchQuery) {
          // 检查是否超时（2秒内）
          const now = Date.now();
          const timeDiff = now - data.timestamp;
          if (timeDiff <= 2000) {
            sendResponse({ success: true, data: data });
          } else {
            // 超时了，清除缓存
            chrome.storage.local.remove('quickerSearchState');
            sendResponse({ success: true, data: null });
          }
        } else {
          sendResponse({ success: true, data: null });
        }
      })
      .catch(error => {
        console.error('Background get failed:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // 保持消息通道开放
  }
  return false; // 未知消息类型，不保持通道
});
