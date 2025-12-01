
/**
 * Popup 主交互逻辑
 * 处理用户输入、键盘事件、界面更新
 */

(function() {
  const searchInput = document.getElementById('searchInput');
  const resultsList = document.getElementById('resultsList');
  const emptyState = document.getElementById('emptyState');
  
  let currentResults = [];
  let selectedIndex = 0;
  let searchTimer = null;
  // 搜索延迟，避免连续输入时频繁触发搜索（毫秒）
  const SEARCH_DELAY = 50;
  // 1.5秒缓存超时时间（这个时间内重开面板则还原输入框内容）
  const CACHE_TIMEOUT = 1500;
  // 最多可见的下拉列表项数量（用于控制下拉列表容器的高度-最多完整显示如下条数的下拉项）
  const MAX_VISIBLE_ITEMS = 12;
  
  // Favicon 缓存（内存级，优化性能）
  const faviconCache = new Map();
  
  // 默认目录（文件夹）图标
  const folderIcon = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEuNSAyQzAuNjcyIDIgMCAyLjY3MiAwIDMuNVYxMi41QzAgMTMuMzI4IDAuNjcyIDE0IDEuNSAxNEgxNC41QzE1LjMyOCAxNCAxNiAxMy4zMjggMTYgMTIuNVY1LjVDMTYgNC42NzIgMTUuMzI4IDQgMTQuNSA0SDhMNiAySDEuNVoiIGZpbGw9IiNmZmJmMDAiLz48L3N2Zz4=';
  // 默认书签图标
  const defaultFavicon = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/PjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+PHN2ZyB0PSIxNzM4Mjg1OTUxNDU1IiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjUwODMyIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiPjxwYXRoIGQ9Ik01MTIgMTAyMy45OTlBNTEyLjEzOCA1MTIuMTM4IDAgMCAxIDMxMi43MDQgNDAuMjM1YTUxMi4xMzggNTEyLjEzOCAwIDAgMSAzOTguNTkyIDk0My41M0E1MDguOCA1MDguOCAwIDAgMSA1MTIgMTAyMy45OTh6IG0tMjAwLjIyNC01MjMuODZsLTAuNjMgMC41ODZhMzMuMjQ4IDMzLjI0OCAwIDAgMC02LjIyOCA1LjgzNWwtNjEuMjkxIDU3LjM1NGExNDguNTg3IDE0OC41ODcgMCAwIDAgMCAyMDkuNTE1bDIuNDg1IDIuNDg1YTE0OC41OTcgMTQ4LjU5NyAwIDAgMCAyMDkuNDgzIDBsMTMzLjQ2LTEzMy40OTNjNTkuMDg0LTU5LjE2OCA2MS4yMjgtMTQ5LjY3NSA0Ljg3Ni0yMDYuMDdsLTIuNDQzLTIuNDQyYTE0Ni45MTIgMTQ2LjkxMiAwIDAgMC0xNS4xOS0xMy4xMyAzMC4xODcgMzAuMTg3IDAgMSAwLTM2LjU2NSA0Ny41NTFjMy4xMjYgMi41ODIgNS43MTggNC43NDcgOC4yNDYgNy4yNjRsMi40OTYgMi40ODZhNjkuNTI1IDY5LjUyNSAwIDAgMSAxOC43ODQgNTguMTc1IDk5LjIgOTkuMiAwIDAgMS0yOC4xMzkgNTguMTk4TDQwNy41ODQgNzI3LjkxNGE4MC4zNjMgODAuMzYzIDAgMCAxLTExMy40NCAwbC0yLjUwNi0yLjUxN2E4MC4yMjQgODAuMjI0IDAgMCAxIDAtMTEzLjM4N2w1OC45ODYtNTguOTY1YTMyLjc3OSAzMi43NzkgMCAwIDAtMzguNzk0LTUyLjggMC4zNDEgMC4zNDEgMCAwIDAgMC0wLjA3NXogbTE0MS4wODggODMuMDVhMjguNDkgMjguNDkgMCAwIDAgNDIuNjY3LTI0LjcxNSAyOC4xODEgMjguMTgxIDAgMCAwLTIuODM4LTEyLjM5NSA0Ny4yNzUgNDcuMjc1IDAgMCAwLTEyLjMwOS0xNS4yNzQgNjYuMDE3IDY2LjAxNyAwIDAgMS0zLjM5Mi0zLjJsLTIuNDUzLTIuNDFhNjAuNTg3IDYwLjU4NyAwIDAgMS0xNy41MTUtNTQuMDA2IDEwMC4yNjcgMTAwLjI2NyAwIDAgMSAyOS4zNzYtNTQuMDE2bDEzMy41NzktMTMzLjQ0YTgwLjIwMyA4MC4yMDMgMCAwIDEgMTEzLjM3NSAwbDIuNDg2IDIuNDQzYTgwLjI5OSA4MC4yOTkgMCAwIDEgMCAxMTMuNDVsLTU4Ljc4NCA1OC44MTZhMzIuNTIzIDMyLjUyMyAwIDAgMCAzNi4zODQgNTMuODQ2djAuMDY0bDAuMDc0IDAuMTE3IDAuOTE4LTAuODMyYTMyLjQ4IDMyLjQ4IDAgMCAwIDcuNDAyLTYuODM3bDYxLjk2My01Ny4xNjNhMTQ4LjUyMyAxNDguNTIzIDAgMCAwIDAtMjA5LjQ4M2wtMi40ODUtMi40ODVhMTQ4LjU1NSAxNDguNTU1IDAgMCAwLTIwOS40ODMgMEw0MzguNCAzNjkuMTUyYy01OC4zOSA1OC40LTU5LjczMyAxNDEuODY2LTMuMiAxOTguNDc0bDIuNDQzIDIuNDFjMi40NTMgMi40NDMgNS4xMSA0Ljg4NiA4LjExNyA3LjQ2N2EyOC41MDEgMjguNTAxIDAgMCAwIDYuOTg3IDUuNjc1eiIgZmlsbD0iIzI4QzQ0NSIgcC1pZD0iNTA4MzMiPjwvcGF0aD48L3N2Zz4=';
  
  // 预加载图标(仅构建缓存 URL,无需实际 fetch)
  function prefetchFavicon(url) {
    try {
      const hostname = new URL(url).hostname;
      if (!faviconCache.has(hostname)) {
        const faviconUrl = `https://www.google.com/s2/favicons?sz=64&domain=${hostname}`;
        faviconCache.set(hostname, faviconUrl);
      }
      return faviconCache.get(hostname);
    } catch (e) {
      return null;
    }
  }

  /**
   * 提取域名（用于 Favicon 服务）
   * @param {string} url - 完整 URL
   * @returns {string} 域名（hostname）
   */
  function extractHostname(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (error) {
      return '';
    }
  }

  /**
   * 获取 Favicon URL
   * @param {string} url - 书签 URL
   * @returns {string} Favicon 服务 URL
   */
  function getFaviconUrl(url) {
    if (!url) return defaultFavicon;
    const hostname = extractHostname(url);
    return faviconCache.get(hostname) || defaultFavicon;
  }

  /**
   * 获取用于展示的 URL（hostname + pathname，不含协议）
   * @param {string} url - 完整 URL
   * @returns {string} 展示用 URL
   */
  function getDisplayUrl(url) {
    try {
      const u = new URL(url);
      const host = u.hostname;
      let path = u.pathname || '';
      if (path === '/') path = '';
      return host + path;
    } catch (error) {
      // 兜底：如果不是完整URL，按原样返回
      return url || '';
    }
  }

  /**
   * 将长文本做中间省略（保留头尾），用于更可读的单行展示
   * @param {string} text - 原始文本
   * @param {number} maxChars - 最大字符数
   * @returns {string} 省略后的文本
   */
  function toMiddleEllipsis(text, maxChars = 60) {
    if (!text || text.length <= maxChars) return text;
    const half = Math.max(10, Math.floor((maxChars - 1) / 2)); // 1 为中间的省略符
    return text.slice(0, half) + '…' + text.slice(-half);
  }

  /**
   * 基于域名优先的中间省略算法
   * 策略：
   * 1. 如果域名都放不下，保留域名前缀 + …
   * 2. 如果域名能放下但完整URL放不下，显示 域名 + … + URL末尾路径
   * @param {HTMLElement} urlEl - URL元素
   * @param {string} fullText - 完整URL文本（不含协议）
   */
  function applyHostAwareEllipsis(urlEl, fullText) {
    // 拆分为 host 与 path（fullText 为不含协议的展示文本：host + pathname）
    const slashIdx = fullText.indexOf('/');
    const host = slashIdx === -1 ? fullText : fullText.slice(0, slashIdx);
    const path = slashIdx === -1 ? '' : fullText.slice(slashIdx);

    // 测量函数：将文本放入元素，判断是否在单行内放得下
    function fits(text) {
      urlEl.textContent = text;
      return urlEl.scrollWidth <= urlEl.clientWidth;
    }

    // 1) 先看单独的域名是否能放下
    if (!fits(host)) {
      // 域名都放不下：保留域名前缀 + …
      let low = 1, high = host.length, best = 0;
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const candidate = host.slice(0, mid) + '…';
        urlEl.textContent = candidate;
        if (urlEl.scrollWidth <= urlEl.clientWidth) {
          best = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }
      urlEl.textContent = best > 0 ? (host.slice(0, best) + '…') : '…';
      return;
    }

    // 2) 域名能放下：如果没有路径，直接放域名；有路径则采用"域名 + … + 末尾路径"
    if (!path) {
      urlEl.textContent = host;
      return;
    }

    let low = 1, high = path.length, best = 0;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const candidate = host + '/…' + path.slice(-mid);
      urlEl.textContent = candidate;
      if (urlEl.scrollWidth <= urlEl.clientWidth) {
        best = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    // 至少保留 1 个字符作为尾部路径
    const tailLen = Math.max(1, best);
    urlEl.textContent = host + '/…' + path.slice(-tailLen);
  }

  /**
   * 仅用于计算"域名优先 + '/…' + 尾部"所需的段信息（不对尾部做高亮）
   * @param {HTMLElement} urlEl - URL元素
   * @param {string} fullText - 完整URL文本（不含协议）
   * @returns {Object} { truncated, host, path, tailLen, text }
   */
  function computeHostAwareEllipsisSegments(urlEl, fullText) {
    const slashIdx = fullText.indexOf('/');
    const host = slashIdx === -1 ? fullText : fullText.slice(0, slashIdx);
    const path = slashIdx === -1 ? '' : fullText.slice(slashIdx);

    function fits(text) {
      urlEl.textContent = text;
      return urlEl.scrollWidth <= urlEl.clientWidth;
    }

    // 域名都放不下：保留前缀 + …
    if (!fits(host)) {
      let low = 1, high = host.length, best = 0;
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const candidate = host.slice(0, mid) + '…';
        urlEl.textContent = candidate;
        if (urlEl.scrollWidth <= urlEl.clientWidth) {
          best = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }
      return {
        truncated: true,
        host: host.slice(0, Math.max(0, best)),
        path: '',
        tailLen: 0,
        text: (best > 0 ? host.slice(0, best) : '') + '…'
      };
    }

    // 域名能放下，无路径
    if (!path) {
      return { truncated: false, host, path: '', tailLen: 0, text: host };
    }

    // 域名能放下，有路径 -> 计算尾部长度
    let low = 1, high = path.length, best = 0;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const candidate = host + '/…' + path.slice(-mid);
      urlEl.textContent = candidate;
      if (urlEl.scrollWidth <= urlEl.clientWidth) {
        best = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    const tailLen = Math.max(1, best);
    return {
      truncated: true,
      host,
      path,
      tailLen,
      text: host + '/…' + path.slice(-tailLen)
    };
  }

  /**
   * 预加载所有书签的图标(仅构建缓存映射,无需实际请求)
   */
  async function prefetchAllFavicons() {
    try {
      const allBookmarks = await BookmarkManager.getAllBookmarks();
      let count = 0;
      
      // 收集所有书签的 hostname 并构建图标 URL 缓存
      for (const bookmark of allBookmarks) {
        if (!bookmark.isFolder && bookmark.url) {
          prefetchFavicon(bookmark.url);
          count++;
        }
      }
      
      console.log(`已构建 ${count} 个图标 URL 缓存`);
    } catch (error) {
      console.error('预加载图标失败:', error);
    }
  }

  /**
   * 初始化
   */
  async function init() {
    // 【修复】步骤1：先同步构建图标URL缓存（避免初次加载显示默认图标）
    await prefetchAllFavicons();
    
    // 步骤2：尝试恢复上次的搜索内容
    const cachedData = await restoreSearchState();
    
    // 步骤3：聚焦搜索框
    searchInput.focus();
    
    // 步骤4：渲染界面（此时缓存已就绪）
    if (cachedData && cachedData.searchQuery) {
      searchInput.value = cachedData.searchQuery;
      await performSearch(cachedData.searchQuery);
    } else {
      // 执行默认搜索（展示二级书签）
      await performSearch('');
    }
    
    // 步骤5：绑定事件
    bindEvents();
    
    // 步骤6：设置状态跟踪
    setupSearchStateTracking();
  }

  /**
   * 绑定事件
   */
  function bindEvents() {
    // 输入事件（防抖）
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        performSearch(e.target.value);
      }, SEARCH_DELAY);
    });
    
    // 键盘事件
    searchInput.addEventListener('keydown', handleKeyDown);
    
    // 列表项点击事件（事件委托）
    resultsList.addEventListener('click', handleItemClick);
    
    // Ctrl/Cmd + Click 事件
    resultsList.addEventListener('mousedown', handleItemMouseDown);
    
    // 鼠标移动事件（事件委托）
    resultsList.addEventListener('mousemove', handleItemMouseMove);
  }

  /**
   * 执行搜索
   * @param {string} query - 搜索查询
   */
  async function performSearch(query) {
    try {
      const results = await SearchEngine.search(query);
      currentResults = results;
      selectedIndex = 0;
      renderResults(results);
    } catch (error) {
      console.error('搜索失败:', error);
      renderError();
    }
  }

  /**
   * 渲染搜索结果
   * @param {Array} results - 搜索结果
   */
  function renderResults(results) {
    // 清空列表
    resultsList.innerHTML = '';
    
    if (!results || results.length === 0) {
      // 无结果时隐藏列表，显示空状态提示（无匹配项提示）
      resultsList.style.display = 'none';
      emptyState.style.display = 'flex';
      // 复位高度与滚动
      resultsList.style.maxHeight = '';
      resultsList.style.overflowY = 'hidden';
      return;
    }
    
    // 有结果时显示列表，隐藏空状态
    resultsList.style.display = 'block';
    emptyState.style.display = 'none';
    
    // 添加渐入效果
    resultsList.style.opacity = '0';
    
    // 创建文档片段
    const fragment = document.createDocumentFragment();
    
    results.forEach((bookmark, index) => {
      const item = createBookmarkItem(bookmark, index);
      fragment.appendChild(item);
    });
    
    resultsList.appendChild(fragment);
    
    // 触发渐入动画并在下一帧测量高度
    requestAnimationFrame(() => {
      resultsList.style.transition = 'opacity 0.3s ease';
      resultsList.style.opacity = '1';

      // 动态计算并设置下拉列表容器可视高度
      const items = resultsList.querySelectorAll('.bookmark-item');
      if (items.length > 0) {
        const itemHeight = items[0].offsetHeight; // 含自身 padding，不含 margin
        const visibleCount = Math.min(items.length, MAX_VISIBLE_ITEMS);
        // 额外高度 = 相邻项间距(2px * (visibleCount - 1)) + 容器上下内边距(2px + 2px) + 首尾项 margin(2px + 2px)
        const extras = (visibleCount - 1) * 2 + 8;
        const computedMaxHeight = Math.round(visibleCount * itemHeight + extras);

        resultsList.style.maxHeight = computedMaxHeight + 'px';
        resultsList.style.overflowY = items.length > MAX_VISIBLE_ITEMS ? 'auto' : 'hidden';
      } else {
        resultsList.style.maxHeight = '';
        resultsList.style.overflowY = 'hidden';
      }
    });
    
    // 高亮第一项
    updateSelection();
    
    // 【Bug #2 修复】在渲染完成后恢复焦点（兜底保障）
    setTimeout(() => {
      searchInput.focus();
    }, 0);
  }

  /**
   * 创建书签项元素
   * @param {Object} bookmark - 书签对象
   * @param {number} index - 索引
   * @returns {HTMLElement} 书签项元素
   */
  function createBookmarkItem(bookmark, index) {
    const item = document.createElement('div');
    item.className = 'bookmark-item';
    item.dataset.index = index;
    item.dataset.id = bookmark.id;
    item.dataset.isFolder = bookmark.isFolder;
    item.dataset.url = bookmark.url || '';
    
    // 为每个项目添加随机动画延迟（增强科技感）
    item.style.setProperty('--item-index', index);
    
    // 图标
    const icon = document.createElement('div');
    icon.className = 'bookmark-icon';
    
    if (bookmark.isFolder) {
      // 文件夹图标（使用定义的 folderIcon）
      icon.innerHTML = `<img src="${folderIcon}" alt="folder" />`;
    } else {
      // 书签图标（使用缓存或默认图标）
      const faviconUrl = getFaviconUrl(bookmark.url);
      icon.innerHTML = `<img src="${faviconUrl}" alt="bookmark" onerror="this.src='${defaultFavicon}'" />`;
    }
    
    // 内容
    const content = document.createElement('div');
    content.className = 'bookmark-content';
    
    const title = document.createElement('div');
    title.className = 'bookmark-title';
    // 应用高亮
    title.innerHTML = highlightText(bookmark.title || '未命名', bookmark.titleMatchRanges || []);
    
    const meta = document.createElement('div');
    meta.className = 'bookmark-meta';
    
    // 父路径(左对齐)
    if (bookmark.pathString) {
      const path = document.createElement('span');
      path.className = 'bookmark-path';
      // 应用路径专用高亮样式
      path.innerHTML = highlightText(bookmark.pathString, bookmark.pathMatchRanges || [], 'path');
      meta.appendChild(path);
    }
    
    // 书签 URL（右对齐）
    if (!bookmark.isFolder && bookmark.url) {
      const urlSpan = document.createElement('span');
      urlSpan.className = 'bookmark-url';
      const displayUrl = getDisplayUrl(bookmark.url);
      // 先按原样显示
      urlSpan.textContent = displayUrl;
      meta.appendChild(urlSpan);

      // 下一帧测量是否被单行省略；只高亮域名部分
      requestAnimationFrame(() => {
        try {
          const isTruncated = urlSpan.scrollWidth > urlSpan.clientWidth;
          const slashIdx = displayUrl.indexOf('/');
          const hostLen = slashIdx === -1 ? displayUrl.length : slashIdx;
          const hostRanges = (bookmark.urlMatchRanges || []).filter(([s, e]) => e <= hostLen);

          if (!isTruncated) {
            // 未截断：只对域名进行高亮
            urlSpan.innerHTML = highlightText(displayUrl, hostRanges || []);
            return;
          }

          // 截断：计算域名优先的 '/…' + 尾部段信息
          const seg = computeHostAwareEllipsisSegments(urlSpan, displayUrl);

          if (!seg.truncated) {
            // 只有域名，无路径；高亮域名
            urlSpan.innerHTML = highlightText(seg.text, hostRanges || []);
          } else if (!seg.path) {
            // 域名自身也被截断为前缀 + …，避免偏移错误，不做高亮
            urlSpan.textContent = seg.text;
          } else {
            // 域名能放下：仅高亮域名，尾部不高亮
            const hostHtml = highlightText(seg.host, hostRanges || []);
            const tailPlain = seg.path.slice(-seg.tailLen);
            urlSpan.innerHTML = hostHtml + '/…' + tailPlain;
          }

          // 仅在确实省略时，开启悬浮浮层展示完整URL
          let urlOverlay = null;
          
          function showUrlOverlay(targetEl, text) {
            if (!text) return;
            if (!urlOverlay) {
              urlOverlay = document.createElement('div');
              urlOverlay.style.cssText = `
                position: fixed;
                z-index: 9999;
                max-width: 80vw;
                background: rgba(255,255,255,0.95);
                color: #1a202c;
                font-size: 12px;
                padding: 2px 5px;
                border-radius: 5px;
                box-shadow: 0 4px 16px rgba(0,0,0,0.15), 0 0 0 1px rgba(203,213,225,0.3);
                border: 1px solid rgba(203,213,225,0.6);
                white-space: normal;
                word-break: break-all;
                line-height: 1.4;
                display: none;
                pointer-events: none;
              `;
              document.body.appendChild(urlOverlay);
            }
            urlOverlay.textContent = text;
            const rect = targetEl.getBoundingClientRect();
            const top = Math.max(8, rect.top - 4);
            urlOverlay.style.display = 'block';
            const overlayWidth = urlOverlay.offsetWidth;
            const left = Math.min(Math.max(8, rect.left), window.innerWidth - overlayWidth - 8);
            urlOverlay.style.top = `${top}px`;
            urlOverlay.style.left = `${left}px`;
          }
          
          function hideUrlOverlay() {
            if (urlOverlay) urlOverlay.style.display = 'none';
          }
          
          urlSpan.addEventListener('mouseenter', () => showUrlOverlay(urlSpan, displayUrl));
          urlSpan.addEventListener('mouseleave', hideUrlOverlay);
        } catch (e) {
          // 忽略测量错误
        }
      });
    }
    
    content.appendChild(title);
    content.appendChild(meta);
    
    item.appendChild(icon);
    item.appendChild(content);
    
    // 添加鼠标进入/离开时的粒子效果
    item.addEventListener('mouseenter', () => {
      createParticleEffect(item);
    });
    
    return item;
  }

  /**
   * 高亮文本中的匹配区域
   * @param {string} text - 原始文本
   * @param {Array} ranges - 匹配区域数组 [[start, end], ...]
   * @param {string} type - 高亮类型: 'default'(title/url) 或 'path'(路径)
   * @returns {string} 带高亮标记的 HTML
   */
  function highlightText(text, ranges, type = 'default') {
    if (!ranges || ranges.length === 0) {
      return escapeHtml(text);
    }
    
    // 根据类型选择高亮样式类名
    const highlightClass = type === 'path' ? 'highlight-path' : 'highlight';
    
    // 合并重叠区域
    const mergedRanges = mergeRanges(ranges);
    
    let result = '';
    let lastIndex = 0;
    
    for (const [start, end] of mergedRanges) {
      // 添加普通文本
      if (start > lastIndex) {
        result += escapeHtml(text.substring(lastIndex, start));
      }
      // 添加高亮文本
      result += `<span class="${highlightClass}">${escapeHtml(text.substring(start, end))}</span>`;
      lastIndex = end;
    }
    
    // 添加剩余文本
    if (lastIndex < text.length) {
      result += escapeHtml(text.substring(lastIndex));
    }
    
    return result;
  }

  /**
   * 合并重叠的区域
   * @param {Array} ranges - 区域数组 [[start, end], ...]
   * @returns {Array} 合并后的区域
   */
  function mergeRanges(ranges) {
    if (!ranges || ranges.length === 0) return [];
    
    // 按起始位置排序
    const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
    const merged = [sorted[0]];
    
    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const last = merged[merged.length - 1];
      
      // 如果当前区域与上一个区域重叠或相邻，则合并
      if (current[0] <= last[1]) {
        last[1] = Math.max(last[1], current[1]);
      } else {
        merged.push(current);
      }
    }
    
    return merged;
  }

  /**
   * HTML 转义
   * @param {string} text - 原始文本
   * @returns {string} 转义后的文本
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 处理键盘事件
   * @param {KeyboardEvent} e - 键盘事件
   */
  function handleKeyDown(e) {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
    
    // 【Bug #3 修复】优先处理 Cmd/Ctrl + 方向键，避免与普通方向键冲突
    if (cmdOrCtrl) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigateUp();
        return; // 明确退出，不执行后续逻辑
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigateDown();
        return; // 明确退出，不执行后续逻辑
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        // Cmd + Delete: 清空搜索框
        searchInput.value = '';
        performSearch('');
        return;
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        // Alt/Option + ↑: 跳转到第一项
        jumpToFirst();
        return;
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        // Alt/Option + ↓: 跳转到最后一项
        jumpToLast();
        return;
      }
    }
    
    // 普通按键处理
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        moveSelection(-1);
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        moveSelection(1);
        break;
        
      case 'Enter':
        e.preventDefault();
        if (cmdOrCtrl || e.ctrlKey) {
          // Ctrl + Enter: 后台打开
          openSelectedItem(false, false);
        } else {
          // Enter: 打开并切换
          openSelectedItem(true, true);
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        window.close();
        break;
    }
  }

  /**
   * 移动选中项
   * @param {number} direction - 方向（-1 向上，1 向下）
   */
  function moveSelection(direction) {
    if (currentResults.length === 0) return;
    
    const prevIndex = selectedIndex;
    selectedIndex += direction;
    
    // 循环选择
    if (selectedIndex < 0) {
      selectedIndex = currentResults.length - 1;
    } else if (selectedIndex >= currentResults.length) {
      selectedIndex = 0;
    }
    
    updateSelection();
    // 检测是否发生循环跳转
    const isLoopJump = (prevIndex === currentResults.length - 1 && selectedIndex === 0) ||
                       (prevIndex === 0 && selectedIndex === currentResults.length - 1);
    scrollToSelected(isLoopJump);
  }

  /**
   * 跳转到第一项
   */
  function jumpToFirst() {
    if (currentResults.length === 0) return;
    selectedIndex = 0;
    updateSelection();
    scrollToSelected(true);
  }

  /**
   * 跳转到最后一项
   */
  function jumpToLast() {
    if (currentResults.length === 0) return;
    selectedIndex = currentResults.length - 1;
    updateSelection();
    scrollToSelected(true);
  }

  /**
   * 更新选中状态
   */
  function updateSelection() {
    const items = resultsList.querySelectorAll('.bookmark-item');
    items.forEach((item, index) => {
      if (index === selectedIndex) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
  }

  /**
   * 滚动到选中项
   * @param {boolean} forceAlign - 是否强制对齐（循环跳转时使用）
   */
  function scrollToSelected(forceAlign = false) {
    const selectedItem = resultsList.querySelector('.bookmark-item.selected');
    if (selectedItem) {
      if (forceAlign) {
        // 循环跳转时，直接控制 scrollTop 确保精确对齐
        if (selectedIndex === 0) {
          // 跳到第一项：滚动到顶部
          resultsList.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          // 跳到最后一项：滚动到底部
          resultsList.scrollTo({ top: resultsList.scrollHeight, behavior: 'smooth' });
        }
      } else {
        // 正常移动时使用 nearest
        selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }
  
  /**
   * 创建粒子效果（增强科技感）
   * @param {HTMLElement} element - 目标元素
   */
  function createParticleEffect(element) {
    // 限制执行频率
    if (element.dataset.particleCreated === 'true') return;
    element.dataset.particleCreated = 'true';
    setTimeout(() => {
      element.dataset.particleCreated = 'false';
    }, 1000);
    
    const rect = element.getBoundingClientRect();
    const particleCount = 3;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.cssText = `
        position: fixed;
        width: 4px;
        height: 4px;
        background: linear-gradient(135deg, #00d9ff, #b544ff);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        box-shadow: 0 0 10px rgba(0, 217, 255, 0.8);
      `;
      
      const startX = rect.left + Math.random() * rect.width;
      const startY = rect.top + rect.height / 2;
      particle.style.left = startX + 'px';
      particle.style.top = startY + 'px';
      
      document.body.appendChild(particle);
      
      // 动画
      const angle = (Math.random() - 0.5) * Math.PI;
      const distance = 30 + Math.random() * 20;
      const endX = startX + Math.cos(angle) * distance;
      const endY = startY + Math.sin(angle) * distance;
      
      particle.animate([
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        { transform: `translate(${endX - startX}px, ${endY - startY}px) scale(0)`, opacity: 0 }
      ], {
        duration: 800,
        easing: 'cubic-bezier(0, 0.5, 0.5, 1)'
      }).onfinish = () => {
        particle.remove();
      };
    }
  }

  /**
   * 向上导航（返回上层）
   */
  function navigateUp() {
    const currentValue = searchInput.value;
    
    // 【Bug #4 修复】步骤1：去除末尾的连续分隔符
    let trimmedValue = currentValue;
    while (trimmedValue.length > 0 && 
           (trimmedValue.endsWith('/') || trimmedValue.endsWith(' '))) {
      trimmedValue = trimmedValue.slice(0, -1);
    }
    
    // 【Bug #4 修复】步骤2：查找最后一个分隔符
    let lastSeparatorIndex = -1;
    for (let i = trimmedValue.length - 1; i >= 0; i--) {
      const char = trimmedValue[i];
      if (char === '/' || char === ' ') {
        lastSeparatorIndex = i;
        break;
      }
    }
    
    // 【Bug #4 修复】步骤3：生成新路径
    let newValue = '';
    if (lastSeparatorIndex >= 0) {
      newValue = trimmedValue.substring(0, lastSeparatorIndex);
    }
    
    searchInput.value = newValue;
    performSearch(newValue);
  }

  /**
   * 向下导航（进入下层或打开）
   */
  function navigateDown() {
    if (currentResults.length === 0) return;
    
    // 【Bug #3 修复】使用局部变量保存索引，避免全局状态被意外修改
    const targetIndex = selectedIndex;
    const selectedItem = currentResults[targetIndex];
    
    if (selectedItem.isFolder) {
      // 进入目录
      enterFolder(selectedItem);
    } else {
      // 后台打开书签
      openBookmark(selectedItem.url, false, false);
    }
  }

  /**
   * 进入文件夹
   * @param {Object} folder - 文件夹对象
   */
  function enterFolder(folder) {
    // 使用书签对象的完整路径数组构建路径字符串
    // folder.path 包含完整路径（包括当前文件夹），例如：['书签栏', '学习', '读书天地']
    // 保留所有有效层级，包括一级目录（书签栏、其他书签等）
    const validPath = folder.path.filter(p => p && p.trim() !== '');
    
    // 构建完整路径字符串
    const newValue = validPath.length > 0 ? '/' + validPath.join('/') : '/';
    
    searchInput.value = newValue;
    performSearch(newValue);
    
    // 【Bug #2 修复】恢复焦点到搜索框
    // 使用 setTimeout 确保DOM渲染完成后执行
    setTimeout(() => {
      searchInput.focus();
    }, 0);
  }

  /**
   * 打开选中项
   * @param {boolean} switchTab - 是否切换到新标签页
   * @param {boolean} closePanel - 是否关闭面板
   */
  function openSelectedItem(switchTab, closePanel) {
    if (currentResults.length === 0) return;
    
    const selectedItem = currentResults[selectedIndex];
    
    if (selectedItem.isFolder) {
      // 进入目录
      enterFolder(selectedItem);
    } else {
      // 打开书签
      openBookmark(selectedItem.url, switchTab, closePanel);
    }
  }

  /**
   * 打开书签
   * @param {string} url - URL
   * @param {boolean} switchTab - 是否切换到新标签页
   * @param {boolean} closePanel - 是否关闭面板
   */
  function openBookmark(url, switchTab, closePanel) {
    if (!url) return;
    
    chrome.tabs.create({ url: url, active: switchTab });
    
    if (closePanel) {
      window.close();
    } else {
      // 保持焦点在搜索框
      searchInput.focus();
    }
  }

  /**
   * 处理列表项点击
   * @param {MouseEvent} e - 鼠标事件
   */
  function handleItemClick(e) {
    const item = e.target.closest('.bookmark-item');
    if (!item) return;
    
    const index = parseInt(item.dataset.index);
    const isFolder = item.dataset.isFolder === 'true';
    const url = item.dataset.url;
    
    selectedIndex = index;
    updateSelection();
    
    const isCtrlClick = e.ctrlKey || e.metaKey;
    
    if (isFolder) {
      // 进入文件夹
      enterFolder(currentResults[index]);
    } else {
      // 打开书签
      if (isCtrlClick) {
        // Ctrl + 点击：后台打开
        openBookmark(url, false, false);
      } else {
        // 普通点击：打开并切换
        openBookmark(url, true, true);
      }
    }
  }

  /**
   * 处理列表项鼠标按下事件（用于检测 Ctrl+Click）
   * @param {MouseEvent} e - 鼠标事件
   */
  function handleItemMouseDown(e) {
    const item = e.target.closest('.bookmark-item');
    if (!item) return;
    
    const index = parseInt(item.dataset.index);
    selectedIndex = index;
    updateSelection();
  }

  /**
   * 处理列表项鼠标移动事件（用于鼠标悬停选中）
   * @param {MouseEvent} e - 鼠标事件
   */
  function handleItemMouseMove(e) {
    // 过滤零位移的伪 mousemove（DOM 切换时浏览器补发的事件）
    if (e.movementX === 0 && e.movementY === 0) return;
    
    const item = e.target.closest('.bookmark-item');
    if (!item) return;
    
    const index = parseInt(item.dataset.index);
    // 只有当鼠标移动到不同项时才更新选中状态
    if (index !== selectedIndex) {
      selectedIndex = index;
      updateSelection();
    }
  }

  /**
   * 渲染错误状态
   */
  function renderError() {
    resultsList.style.display = 'none';
    emptyState.style.display = 'block';
    emptyState.innerHTML = '<p>加载书签失败，请检查权限</p>';
  }

  /**
   * 保存搜索状态到 Chrome 存储
   * @param {string} searchQuery - 搜索查询
   */
  async function saveSearchState(searchQuery) {
    try {
      const data = {
        searchQuery: searchQuery,
        timestamp: Date.now()
      };
      
      // 首先尝试通过消息发送到 background script 保存
      try {
        const response = await chrome.runtime.sendMessage({
          action: 'saveSearchState',
          searchQuery: searchQuery
        });
        
        if (response && response.success) {
          console.log('搜索状态已通过 background 保存');
          return;
        }
      } catch (bgError) {
        console.warn('Background 保存失败，回退到直接存储:', bgError);
      }
      
      // 如果 background 保存失败，直接本地保存
      await chrome.storage.local.set({ 'quickerSearchState': data });
      console.log('搜索状态已本地保存');
    } catch (error) {
      console.error('保存搜索状态失败:', error);
    }
  }

  /**
   * 从 Chrome 存储恢复搜索状态
   * @returns {Object|null} 搜索状态数据或 null
   */
  async function restoreSearchState() {
    try {
      // 首先尝试通过 background script 获取
      try {
        const response = await chrome.runtime.sendMessage({ action: 'getSearchState' });
        if (response && response.success && response.data) {
          console.log('搜索状态已通过 background 恢复');
          return response.data;
        }
      } catch (bgError) {
        console.warn('Background 获取失败，回退到直接获取:', bgError);
      }
      
      // 如果 background 获取失败，直接本地获取
      const result = await chrome.storage.local.get('quickerSearchState');
      const data = result.quickerSearchState;
      
      if (!data || !data.searchQuery) {
        return null;
      }
      
      // 检查是否超时（2秒内）
      const now = Date.now();
      const timeDiff = now - data.timestamp;
      
      if (timeDiff <= CACHE_TIMEOUT) {
        return data;
      } else {
        // 超时了，清除缓存
        await chrome.storage.local.remove('quickerSearchState');
        return null;
      }
    } catch (error) {
      console.error('恢复搜索状态失败:', error);
      return null;
    }
  }

  /**
   * 监听搜索输入变化并保存状态
   */
  function setupSearchStateTracking() {
    let saveTimer = null;
    let visibilityTimer = null;
    let lastSearchValue = searchInput.value;
    
    // 监听输入变化
    searchInput.addEventListener('input', (e) => {
      // 清除之前的定时器
      clearTimeout(saveTimer);
      lastSearchValue = e.target.value;
      
      // 延迟保存，避免频繁写入
      saveTimer = setTimeout(() => {
        saveSearchState(e.target.value);
      }, 300);
    });
    
    // 监听页面可见性变化（当页面隐藏时保存状态）
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // 页面隐藏时立即保存状态
        if (lastSearchValue) {
          saveSearchState(lastSearchValue);
        }
      }
    });
    
    // 定期保存状态（每200ms检查一次，确保状态不会丢失）
    visibilityTimer = setInterval(() => {
      if (searchInput.value && searchInput.value !== lastSearchValue) {
        lastSearchValue = searchInput.value;
        saveSearchState(searchInput.value);
      }
    }, 200);
    
    // 页面卸载时保存状态（作为兜底保障）
    window.addEventListener('beforeunload', () => {
      if (searchInput.value) {
        saveSearchState(searchInput.value);
      }
      clearInterval(visibilityTimer);
    });
    
    // 监听窗口失焦事件（当用户点击外部时保存状态）
    window.addEventListener('blur', () => {
      if (searchInput.value) {
        saveSearchState(searchInput.value);
      }
    });
    
    // 监听键盘事件，当用户按 Command+K 时保存状态
    document.addEventListener('keydown', (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      
      // 检测 Command+K (Mac) 或 Ctrl+K (其他平台)
      if (cmdOrCtrl && e.key === 'k') {
        if (searchInput.value) {
          saveSearchState(searchInput.value);
        }
      }
      
      // 检测 Escape 键
      if (e.key === 'Escape') {
        if (searchInput.value) {
          saveSearchState(searchInput.value);
        }
      }
    });
    
    // 监听鼠标离开窗口事件
    document.addEventListener('mouseleave', () => {
      if (searchInput.value) {
        saveSearchState(searchInput.value);
      }
    });
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
