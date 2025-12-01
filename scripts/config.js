/**
 * 配置管理模块
 * 管理可扩展的配置选项
 */

const Config = (function() {
  // 默认配置
  const DEFAULT_CONFIG = {
    maxResults: 50,              // 最大显示数量(Filter.js中SearchEngine用于限制过滤的结果数量)
    searchDelay: 150,            // 搜索防抖延迟(ms)
    enablePinyin: true,          // 是否启用拼音搜索
    theme: 'light',              // 主题: 'light' | 'dark'
    enableHistory: false,        // 是否启用历史记录搜索
    enableTabs: false           // 是否启用标签页搜索
  };

  let currentConfig = { ...DEFAULT_CONFIG };
  let configLoaded = false;    // 配置加载状态标记

  /**
   * 加载配置
   * @returns {Promise<Object>} 配置对象
   */
  async function loadConfig() {
    try {
      const result = await chrome.storage.sync.get('config');
      if (result.config) {
        currentConfig = { ...DEFAULT_CONFIG, ...result.config };
      } else {
        // 如果没有保存过配置，使用默认配置
        currentConfig = { ...DEFAULT_CONFIG };
      }
      configLoaded = true;
      return currentConfig;
    } catch (error) {
      console.error('加载配置失败:', error);
      currentConfig = { ...DEFAULT_CONFIG };
      configLoaded = true;
      return currentConfig;
    }
  }

  /**
   * 保存配置
   * @param {Object} config - 配置对象
   * @returns {Promise<boolean>} 是否成功
   */
  async function saveConfig(config) {
    try {
      currentConfig = { ...DEFAULT_CONFIG, ...config };
      await chrome.storage.sync.set({ config: currentConfig });
      return true;
    } catch (error) {
      console.error('保存配置失败:', error);
      return false;
    }
  }

  /**
   * 获取配置项
   * @param {string} key - 配置键
   * @returns {*} 配置值
   */
  function get(key) {
    return currentConfig[key];
  }

  /**
   * 等待配置加载完成
   * @returns {Promise<Object>} 配置对象
   */
  async function waitForConfig() {
    if (configLoaded) {
      return currentConfig;
    }
    return await loadConfig();
  }

  /**
   * 清除存储中的配置（用于调试）
   * @returns {Promise<boolean>} 是否成功
   */
  async function clearStorage() {
    try {
      await chrome.storage.sync.remove('config');
      currentConfig = { ...DEFAULT_CONFIG };
      console.log('配置已清除，重置为默认值');
      return true;
    } catch (error) {
      console.error('清除配置失败:', error);
      return false;
    }
  }

  /**
   * 设置配置项
   * @param {string} key - 配置键
   * @param {*} value - 配置值
   * @returns {Promise<boolean>} 是否成功
   */
  async function set(key, value) {
    currentConfig[key] = value;
    return await saveConfig(currentConfig);
  }

  /**
   * 重置为默认配置
   * @returns {Promise<boolean>} 是否成功
   */
  async function reset() {
    return await saveConfig(DEFAULT_CONFIG);
  }

  /**
   * 获取所有配置
   * @returns {Object} 配置对象
   */
  function getAll() {
    return { ...currentConfig };
  }

  // 自动加载配置
  if (typeof chrome !== 'undefined' && chrome.storage) {
    loadConfig();
  }

  return {
    loadConfig,
    saveConfig,
    get,
    set,
    reset,
    getAll,
    waitForConfig,
    clearStorage
  };
})();

// 导出到全局
if (typeof window !== 'undefined') {
  window.Config = Config;
}
