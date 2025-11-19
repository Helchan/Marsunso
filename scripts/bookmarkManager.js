/**
 * 书签数据管理模块
 * 负责获取、缓存和预处理书签数据
 */

const BookmarkManager = (function() {
  let bookmarkCache = null;
  let flatBookmarks = [];
  let bookmarkMap = new Map();

  /**
   * 获取所有书签数据
   * @returns {Promise<Array>} 处理后的书签数组
   */
  async function getAllBookmarks() {
    if (bookmarkCache) {
      return bookmarkCache;
    }

    try {
      const tree = await chrome.bookmarks.getTree();
      const processedBookmarks = processBookmarkTree(tree[0]);
      bookmarkCache = processedBookmarks;
      return processedBookmarks;
    } catch (error) {
      console.error('获取书签失败:', error);
      return [];
    }
  }

  /**
   * 处理书签树，转换为扁平数组并添加元数据
   * @param {Object} node - 书签树节点
   * @param {number} depth - 当前深度
   * @param {Array} path - 路径数组
   * @returns {Array} 处理后的书签数组
   */
  function processBookmarkTree(node, depth = 0, path = []) {
    const bookmarks = [];

    if (!node) return bookmarks;

    const currentPath = node.title ? [...path, node.title] : path;
    const isFolder = !node.url;

    // 创建书签对象
    const bookmark = {
      id: node.id,
      title: node.title || '未命名',
      url: node.url || '',
      isFolder: isFolder,
      depth: depth,
      path: currentPath,
      pathString: generatePathString(currentPath),
      dateAdded: node.dateAdded,
      parentId: node.parentId,
      children: []
    };

    // 生成拼音数据
    if (bookmark.title) {
      bookmark.pinyin = PinyinUtil.convertToPinyin(bookmark.title);
    }

    // 为路径每一层预生成拼音数据（性能优化：避免匹配时重复计算）
    if (currentPath && currentPath.length > 0) {
      bookmark.pathPinyinData = currentPath.map(pathLayer => {
        if (pathLayer && typeof pathLayer === 'string') {
          return PinyinUtil.convertToPinyin(pathLayer);
        }
        return { fullPinyin: '', initialPinyin: '' };
      });
    } else {
      bookmark.pathPinyinData = [];
    }

    // 提取域名（用于 URL 匹配）
    if (bookmark.url) {
      bookmark.domain = extractDomain(bookmark.url);
    }

    // 存入 map 以便快速查找
    bookmarkMap.set(bookmark.id, bookmark);

    // 如果有子节点，递归处理
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        const childBookmarks = processBookmarkTree(child, depth + 1, currentPath);
        bookmarks.push(...childBookmarks);
        
        // 记录子节点ID
        bookmark.children.push(child.id);
      }
    }

    // 添加当前节点（排除根节点）
    if (depth > 0) {
      bookmarks.unshift(bookmark);
      flatBookmarks.push(bookmark);
    } else {
      // 根节点，只处理子节点
    }

    return bookmarks;
  }

  /**
   * 生成路径字符串（父路径，不包含当前项）
   * @param {Array} pathArray - 路径数组（包含当前项）
   * @returns {string} 父路径字符串，如 "书签栏/学习/前端"
   */
  function generatePathString(pathArray) {
    if (!pathArray || pathArray.length === 0) return '';
    
    // 移除路径数组中的最后一个元素（当前项自身的名称）
    const parentPath = pathArray.slice(0, -1);
    
    // 过滤掉空值，保留所有有效的路径节点（包括一级目录）
    const filtered = parentPath.filter(p => p && p.trim() !== '');
    
    // 如果父路径为空，返回空字符串
    if (filtered.length === 0) return '';
    
    return filtered.join('/');
  }

  /**
   * 从 URL 中提取域名
   * @param {string} url - 完整 URL
   * @returns {string} 域名
   */
  function extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (error) {
      return '';
    }
  }

  /**
   * 获取二级书签（深度为2的项目）
   * @returns {Promise<Array>} 二级书签数组
   */
  async function getSecondLevelBookmarks() {
    const allBookmarks = await getAllBookmarks();
    return allBookmarks.filter(b => b.depth === 2);
  }

  /**
   * 根据路径获取书签
   * @param {string} pathString - 路径字符串，如 "/书签栏/学习/课程" 或 "/学习/课程"
   * @returns {Promise<Object|null>} 书签对象
   */
  async function getBookmarkByPath(pathString) {
    if (!pathString || !pathString.startsWith('/')) return null;
    
    const allBookmarks = await getAllBookmarks();
    const pathParts = pathString.split('/').filter(p => p);
    
    if (pathParts.length === 0) return null;
    
    // 从一级目录开始查找（depth === 1），以支持完整路径
    let currentNodes = allBookmarks.filter(b => b.depth === 1);
    
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      const found = currentNodes.find(node => 
        node.title.toLowerCase() === part.toLowerCase()
      );
      
      if (!found) return null;
      
      // 如果是最后一部分，返回找到的节点
      if (i === pathParts.length - 1) {
        return found;
      }
      
      // 获取下一层的节点
      currentNodes = allBookmarks.filter(b => b.parentId === found.id);
    }
    
    return null;
  }

  /**
   * 获取指定书签的子项
   * @param {string} bookmarkId - 书签ID
   * @returns {Promise<Array>} 子项数组
   */
  async function getChildren(bookmarkId) {
    const allBookmarks = await getAllBookmarks();
    return allBookmarks.filter(b => b.parentId === bookmarkId);
  }

  /**
   * 清除缓存
   */
  function clearCache() {
    bookmarkCache = null;
    flatBookmarks = [];
    bookmarkMap.clear();
  }

  /**
   * 监听书签变化
   */
  function setupBookmarkListeners() {
    if (typeof chrome !== 'undefined' && chrome.bookmarks) {
      chrome.bookmarks.onCreated.addListener(() => {
        clearCache();
      });
      
      chrome.bookmarks.onRemoved.addListener(() => {
        clearCache();
      });
      
      chrome.bookmarks.onChanged.addListener(() => {
        clearCache();
      });
      
      chrome.bookmarks.onMoved.addListener(() => {
        clearCache();
      });
    }
  }

  // 初始化监听器
  setupBookmarkListeners();

  return {
    getAllBookmarks,
    getSecondLevelBookmarks,
    getBookmarkByPath,
    getChildren,
    clearCache
  };
})();

// 导出到全局
if (typeof window !== 'undefined') {
  window.BookmarkManager = BookmarkManager;
}
