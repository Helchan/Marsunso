/**
 * 搜索引擎模块
 * 实现书签搜索、匹配和排序逻辑
 */

const SearchEngine = (function() {
  const MAX_RESULTS = 15;

  /**
   * 执行搜索
   * @param {string} query - 搜索查询
   * @returns {Promise<Array>} 搜索结果
   */
  async function search(query) {
    // 清理输入
    query = cleanInput(query);
    
    // 判断搜索模式
    const mode = detectSearchMode(query);
    
    let results = [];
    
    switch (mode) {
      case 'default':
        results = await searchDefault();
        break;
      case 'path':
        results = await searchByPath(query);
        break;
      case 'fuzzy':
        results = await searchFuzzy(query);
        break;
    }
    
    // 限制结果数量并附加搜索关键词信息
    return results.slice(0, MAX_RESULTS).map(r => ({
      ...r,
      searchQuery: query,
      searchMode: mode
    }));
  }

  /**
   * 清理输入内容
   * @param {string} input - 原始输入
   * @returns {string} 清理后的输入
   */
  function cleanInput(input) {
    if (!input) return '';
    
    // 移除危险字符（过滤引号、尖括号、反斜杠、分号、冒号等）
    // 保留：中文、英文、数字、空格、斜杠、连字符、下划线、点号、括号、常见中文标点
    input = input.replace(/['"`<>\\;:]/g, '');
    
    // 替换连续空格为单个空格
    input = input.replace(/\s+/g, ' ');
    
    // 替换连续斜杠为单个斜杠
    input = input.replace(/\/+/g, '/');
    
    return input;
  }

  /**
   * 检测搜索模式
   * @param {string} query - 搜索查询
   * @returns {string} 搜索模式: 'default' | 'path' | 'fuzzy'
   */
  function detectSearchMode(query) {
    const trimmed = query.trim();
    
    // 模式一：默认模式（空）
    if (!trimmed) {
      return 'default';
    }
    
    // 模式三：路径导航模式（以 / 开头）
    if (trimmed.startsWith('/')) {
      // 检查是否有空格后的斜杠（不合法）
      if (/ \//.test(query)) {
        return 'default'; // 返回空结果
      }
      return 'path';
    }
    
    // 模式二：模糊搜索模式
    return 'fuzzy';
  }

  /**
   * 默认模式搜索：返回所有二级书签
   * @returns {Promise<Array>} 二级书签
   */
  async function searchDefault() {
    return await BookmarkManager.getSecondLevelBookmarks();
  }

  /**
   * 路径导航模式搜索
   * @param {string} query - 路径查询，如 "/学习/课程"
   * @returns {Promise<Array>} 搜索结果
   */
  async function searchByPath(query) {
    // 检查是否以空格结尾（表示要获取子项）
    const endsWithSpace = query.endsWith(' ');
    
    // 分离路径和搜索词
    const parts = query.split(' ');
    const pathPart = parts[0];
    const searchPart = parts.slice(1).join(' ').trim();
    
    // 获取路径对应的书签
    const pathBookmark = await BookmarkManager.getBookmarkByPath(pathPart);
    
    if (!pathBookmark) {
      return [];
    }
    
    // 如果没有搜索词
    if (!searchPart) {
      // 如果以空格结尾，返回该路径的直接子项
      if (endsWithSpace) {
        return await BookmarkManager.getChildren(pathBookmark.id);
      } else {
        // 否则返回该路径的直接子项
        return await BookmarkManager.getChildren(pathBookmark.id);
      }
    }
    
    // 如果有搜索词，在子孙层级中搜索
    const allBookmarks = await BookmarkManager.getAllBookmarks();
    const descendants = allBookmarks.filter(b => {
      return b.path.includes(pathBookmark.title);
    });
    
    // 对后代进行模糊匹配
    // 检查搜索词是否包含空格（需要层级匹配）
    const keywords = searchPart.split(' ').filter(k => k);
    let matchedResults;
    
    if (keywords.length > 1) {
      // 多个关键词：使用层级匹配
      matchedResults = matchHierarchy(descendants, keywords);
    } else {
      // 单个关键词：使用简单匹配
      matchedResults = matchAndScore(descendants, searchPart);
    }
    
    // 如果以空格结尾，返回匹配项的子项
    if (endsWithSpace && matchedResults.length > 0) {
      const childrenResults = [];
      for (const matched of matchedResults) {
        const children = await BookmarkManager.getChildren(matched.id);
        childrenResults.push(...children);
      }
      return childrenResults;
    }
    
    return matchedResults;
  }

  /**
   * 模糊搜索模式
   * @param {string} query - 搜索查询
   * @returns {Promise<Array>} 搜索结果
   */
  async function searchFuzzy(query) {
    const keywords = query.split(' ').filter(k => k);
    const allBookmarks = await BookmarkManager.getAllBookmarks();
    
    // 如果末尾有空格，表示获取匹配项的子项
    const endsWithSpace = query.endsWith(' ');
    
    if (endsWithSpace && keywords.length > 0) {
      // 先匹配到父级
      const parentMatches = matchHierarchy(allBookmarks, keywords);
      
      // 获取这些父级的子项，并为子项添加路径高亮信息
      const childrenResults = [];
      for (const parent of parentMatches) {
        const children = await BookmarkManager.getChildren(parent.id);
        
        // 为每个子项添加路径高亮信息
        const childrenWithHighlight = children.map(child => {
          // 计算子项路径中的高亮范围
          const pathMatchResult = matchPathHierarchy(keywords, child.path, child.pathPinyinData || []);
          
          return {
            ...child,
            pathMatchRanges: pathMatchResult.pathRanges || []
          };
        });
        
        childrenResults.push(...childrenWithHighlight);
      }
      
      return childrenResults;
    }
    
    // 正常的层级匹配
    return matchHierarchy(allBookmarks, keywords);
  }

  /**
   * 路径层级匹配：对路径关键词进行分层匹配
   * @param {Array} pathKeywords - 路径关键词数组（不含最后一个关键词）
   * @param {Array} bookmarkPath - 书签完整路径数组（包含书签名称）
   * @param {Array} pathPinyinData - 路径每一层的拼音数据
   * @returns {Object} { allMatched: boolean, totalScore: number, layerMatches: Array, pathRanges: Array }
   */
  function matchPathHierarchy(pathKeywords, bookmarkPath, pathPinyinData) {
    if (!pathKeywords || pathKeywords.length === 0) {
      return { allMatched: true, totalScore: 0, layerMatches: [], pathRanges: [] };
    }
    
    if (!bookmarkPath || bookmarkPath.length === 0) {
      return { allMatched: false, totalScore: 0, layerMatches: [], pathRanges: [] };
    }
    
    // 从路径数组中排除最后一项（书签名称本身）
    const parentPath = bookmarkPath.slice(0, -1);
    const parentPinyinData = pathPinyinData ? pathPinyinData.slice(0, -1) : [];
    
    // 如果关键词数量 > 路径层级数，匹配失败
    if (pathKeywords.length > parentPath.length) {
      return { allMatched: false, totalScore: 0, layerMatches: [], pathRanges: [] };
    }
    
    const layerMatches = [];
    let totalScore = 0;
    let currentPathIndex = 0; // 当前查找的路径起始索引
    
    // 遍历每个路径关键词，顺序查找匹配层
    for (let i = 0; i < pathKeywords.length; i++) {
      const keyword = pathKeywords[i];
      let matched = false;
      let bestMatch = null;
      let bestMatchIndex = -1;
      
      // 在剩余路径层中查找匹配项
      for (let j = currentPathIndex; j < parentPath.length; j++) {
        const pathLayer = parentPath[j];
        const pathLayerPinyin = parentPinyinData[j] || null;
        
        // 调用 matchText 计算层级得分（复用现有的拼音匹配算法）
        const layerMatch = matchText(pathLayer.toLowerCase(), keyword.toLowerCase(), pathLayerPinyin);
        
        if (layerMatch.matched) {
          // 找到匹配层，记录最佳匹配
          if (!bestMatch || layerMatch.score > bestMatch.score) {
            bestMatch = layerMatch;
            bestMatchIndex = j;
          }
          // 找到第一个匹配就停止（顺序匹配策略）
          matched = true;
          break;
        }
      }
      
      // 如果某个关键词没找到匹配层，匹配失败
      if (!matched) {
        return { allMatched: false, totalScore: 0, layerMatches: [], pathRanges: [] };
      }
      
      // 计算该层权重：距离书签名称越近的层级权重越高
      const distanceFromEnd = parentPath.length - bestMatchIndex - 1;
      const weightFactor = 1.0 - (distanceFromEnd / parentPath.length) * 0.3;
      const baseScore = 20;
      const layerScore = bestMatch.score * weightFactor + baseScore;
      
      layerMatches.push({
        pathIndex: bestMatchIndex,
        pathLayer: parentPath[bestMatchIndex],
        score: bestMatch.score,
        weightedScore: layerScore,
        matchType: bestMatch.type || 'text',
        ranges: bestMatch.ranges || []
      });
      
      totalScore += layerScore;
      
      // 更新下一次查找的起始位置（从当前匹配层后一层开始）
      currentPathIndex = bestMatchIndex + 1;
    }
    
    // 计算路径字符串中的匹配范围
    const pathRanges = calculatePathRanges(parentPath, layerMatches);
    
    return {
      allMatched: true,
      totalScore: totalScore,
      layerMatches: layerMatches,
      pathRanges: pathRanges
    };
  }

  /**
   * 计算路径字符串中的匹配范围
   * @param {Array} parentPath - 父路径数组
   * @param {Array} layerMatches - 层级匹配结果
   * @returns {Array} 匹配范围数组 [[start, end], ...]
   */
  function calculatePathRanges(parentPath, layerMatches) {
    if (!parentPath || parentPath.length === 0 || !layerMatches || layerMatches.length === 0) {
      return [];
    }
    
    const pathRanges = [];
    let currentOffset = 0;
    
    // 遍历路径的每一层
    for (let i = 0; i < parentPath.length; i++) {
      const layer = parentPath[i];
      const layerLength = layer.length;
      
      // 查找该层是否有匹配
      const matchedLayer = layerMatches.find(m => m.pathIndex === i);
      
      if (matchedLayer && matchedLayer.ranges && matchedLayer.ranges.length > 0) {
        // 将该层的匹配范围转换为整个路径字符串的范围
        for (const [start, end] of matchedLayer.ranges) {
          pathRanges.push([currentOffset + start, currentOffset + end]);
        }
      }
      
      // 更新偏移量：当前层的长度 + 分隔符 '/' 的长度
      currentOffset += layerLength + 1; // +1 是分隔符 '/'
    }
    
    return pathRanges;
  }

  /**
   * 层级匹配：空格分隔的关键词需要在不同层级匹配
   * @param {Array} bookmarks - 书签数组
   * @param {Array} keywords - 关键词数组
   * @returns {Array} 匹配结果
   */
  function matchHierarchy(bookmarks, keywords) {
    if (keywords.length === 0) return [];
    
    const results = [];
    
    for (const bookmark of bookmarks) {
      let matchScore = 0;
      let allMatched = true;
      let pathMatchRanges = [];
      
      // 最后一个关键词必须匹配当前项
      const lastKeyword = keywords[keywords.length - 1];
      const currentMatch = matchBookmark(bookmark, lastKeyword);
      
      if (!currentMatch.matched) {
        continue;
      }
      
      const titleScore = currentMatch.score;
      matchScore += titleScore * 0.5; // 当前项匹配权重 50%
      
      // 其他关键词需要在路径中匹配（使用分层匹配算法）
      if (keywords.length > 1) {
        const pathKeywords = keywords.slice(0, -1);
        const bookmarkPath = bookmark.path;
        const pathPinyinData = bookmark.pathPinyinData || [];
        
        // 调用新的分层匹配函数
        const pathMatchResult = matchPathHierarchy(pathKeywords, bookmarkPath, pathPinyinData);
        
        if (!pathMatchResult.allMatched) {
          allMatched = false;
        } else {
          // 路径匹配成功，累加路径得分
          matchScore += pathMatchResult.totalScore;
          pathMatchRanges = pathMatchResult.pathRanges || [];
        }
      }
      
      if (allMatched) {
        results.push({
          ...bookmark,
          matchScore: matchScore + calculateDepthScore(bookmark.depth),
          titleMatchRanges: currentMatch.matchedField === 'title' ? currentMatch.ranges : [],
          urlMatchRanges: currentMatch.matchedField === 'url' ? currentMatch.ranges : [],
          pathMatchRanges: pathMatchRanges
        });
      }
    }
    
    // 按分数排序
    results.sort((a, b) => b.matchScore - a.matchScore);
    return results;
  }

  /**
   * 匹配单个书签并评分
   * @param {Object} bookmark - 书签对象
   * @param {string} keyword - 搜索关键词
   * @returns {Object} { matched: boolean, score: number, matchedField: string, ranges: Array }
   */
  function matchBookmark(bookmark, keyword) {
    keyword = keyword.toLowerCase();
    const title = (bookmark.title || '').toLowerCase();
    const url = bookmark.url || '';
    const domain = bookmark.domain || '';
    
    // 书签名称匹配
    const titleMatch = matchText(title, keyword, bookmark.pinyin);
    
    // URL 匹配
    const urlMatch = matchUrl(url, domain, keyword);
    
    // 取最高分
    if (titleMatch.score >= urlMatch.score) {
      return { ...titleMatch, matchedField: 'title' };
    } else {
      return { ...urlMatch, matchedField: 'url' };
    }
  }

 /**
   * 文本匹配（支持拼音、混合输入、非连续汉字）
   * @param {string} text - 目标文本
   * @param {string} keyword - 关键词
   * @param {Object} pinyin - 拼音数据
   * @returns {Object} { matched: boolean, score: number, ranges: Array }
   */
  function matchText(text, keyword, pinyin) {
    // 完全匹配
    if (text === keyword) {
      return { matched: true, score: 10, ranges: [[0, text.length]] };
    }
    
    // 前缀匹配
    if (text.startsWith(keyword)) {
      return { matched: true, score: 8, ranges: [[0, keyword.length]] };
    }
    
    // 包含匹配（连续字符串）
    if (text.includes(keyword)) {
      const index = text.indexOf(keyword);
      const coverage = keyword.length / text.length;
      return { matched: true, score: 5 + coverage * 2, ranges: [[index, index + keyword.length]] };
    }
    
    // 非连续字符匹配（支持中英文及数字）
    const nonContinuousMatch = matchNonContinuousText(keyword, text);
    if (nonContinuousMatch.matched) {
      return nonContinuousMatch;
    }
    
    // 拼音匹配（包括纯拼音、混合输入、非连续汉字）
    if (pinyin) {
      const pinyinMatch = PinyinUtil.matchPinyin(keyword, text, pinyin);
      if (pinyinMatch && pinyinMatch.matched) {
        // 根据匹配类型调整分数权重
        let scoreMultiplier = 1;
        
        switch (pinyinMatch.type) {
          case 'fullPinyin':
            scoreMultiplier = 1.2; // 全拼匹配权重较高
            break;
          case 'mixed':
          case 'mixedJump':
            scoreMultiplier = 1.1; // 混合匹配权重中等
            break;
          case 'nonContinuous':
            scoreMultiplier = 0.9; // 非连续匹配权重较低
            break;
          case 'initialPinyin':
            scoreMultiplier = 0.8; // 首字母匹配权重最低
            break;
          default:
            scoreMultiplier = 1;
        }
        
        return { 
          matched: true, 
          score: 3 + (pinyinMatch.score / 100) * scoreMultiplier,
          ranges: pinyinMatch.ranges || []
        };
      }
    }
    
    return { matched: false, score: 0, ranges: [] };
  }

  /**
   * 非连续文本匹配（支持跳跃式匹配）
   * 支持中文、英文、数字等所有字符的非连续匹配
   * 例如："读笔记" 可以匹配 "读书笔记"
   * 例如："bkm" 可以匹配 "bookmark"
   * @param {string} keyword - 关键词
   * @param {string} text - 目标文本
   * @returns {Object} { matched: boolean, score: number, ranges: Array }
   */
  function matchNonContinuousText(keyword, text) {
    if (!keyword || !text) {
      return { matched: false, score: 0, ranges: [] };
    }
    
    const positions = [];
    let textIndex = 0;
    let continuousCount = 0;
    let lastPos = -1;
    
    // 按顺序查找每个字符（大小写不敏感）
    const lowerKeyword = keyword.toLowerCase();
    const lowerText = text.toLowerCase();
    
    for (let i = 0; i < lowerKeyword.length; i++) {
      const char = lowerKeyword[i];
      let found = false;
      
      // 从当前位置开始查找
      for (let j = textIndex; j < lowerText.length; j++) {
        if (lowerText[j] === char) {
          positions.push(j);
          textIndex = j + 1;
          found = true;
          
          // 检查是否连续
          if (j === lastPos + 1) {
            continuousCount++;
          } else {
            continuousCount = 1;
          }
          lastPos = j;
          break;
        }
      }
      
      // 如果某个字符没找到，匹配失败
      if (!found) {
        return { matched: false, score: 0, ranges: [] };
      }
    }
    
    // 计算匹配得分
    const baseScore = 4; // 非连续匹配基础分
    const coverageScore = (keyword.length / text.length) * 2; // 覆盖率分数
    const continuityScore = (continuousCount / keyword.length) * 1; // 连续性分数
    const totalScore = baseScore + coverageScore + continuityScore;
    
    // 将 positions 转换为 ranges
    const ranges = positions.map(pos => [pos, pos + 1]);
    
    return {
      matched: true,
      score: totalScore,
      ranges: ranges
    };
  }

  /**
   * URL 匹配
   * @param {string} url - 完整 URL
   * @param {string} domain - 域名
   * @param {string} keyword - 关键词
   * @returns {Object} { matched: boolean, score: number, ranges: Array }
   */
  function matchUrl(url, domain, keyword) {
    // 域名完全匹配
    if (domain && domain === keyword) {
      return { matched: true, score: 6, ranges: [[0, domain.length]] };
    }
    
    // 域名包含匹配
    if (domain && domain.includes(keyword)) {
      const index = domain.indexOf(keyword);
      return { matched: true, score: 4, ranges: [[index, index + keyword.length]] };
    }
    
    // URL 路径匹配
    if (url && url.toLowerCase().includes(keyword)) {
      const index = url.toLowerCase().indexOf(keyword);
      return { matched: true, score: 2, ranges: [[index, index + keyword.length]] };
    }
    
    return { matched: false, score: 0, ranges: [] };
  }

  /**
   * 匹配并评分
   * @param {Array} bookmarks - 书签数组
   * @param {string} keyword - 关键词
   * @returns {Array} 匹配结果
   */
  function matchAndScore(bookmarks, keyword) {
    const results = [];
    
    for (const bookmark of bookmarks) {
      const match = matchBookmark(bookmark, keyword);
      
      if (match.matched) {
        results.push({
          ...bookmark,
          matchScore: match.score * 0.5 + calculateDepthScore(bookmark.depth),
          titleMatchRanges: match.matchedField === 'title' ? match.ranges : [],
          urlMatchRanges: match.matchedField === 'url' ? match.ranges : []
        });
      }
    }
    
    // 按分数排序
    results.sort((a, b) => b.matchScore - a.matchScore);
    return results;
  }

  /**
   * 计算深度分数（越浅越高）
   * @param {number} depth - 深度
   * @returns {number} 分数
   */
  function calculateDepthScore(depth) {
    return Math.max(0, 10 - depth);
  }

  return {
    search,
    cleanInput,
    detectSearchMode
  };
})();

// 导出到全局
if (typeof window !== 'undefined') {
  window.SearchEngine = SearchEngine;
}
