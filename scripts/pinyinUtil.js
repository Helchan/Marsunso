/**
 * 拼音工具模块
 * 提供汉字转拼音和拼音匹配功能
 * 使用 pinyin-pro 库实现完整的汉字拼音转换
 */

const PinyinUtil = (function() {
  // 检查 pinyin-pro 是否已加载
  const hasPinyinPro = typeof pinyinPro !== 'undefined';
  
  if (!hasPinyinPro) {
    console.warn('pinyin-pro 库未加载，拼音功能将受限');
  }

  /**
   * 获取汉字的拼音
   * @param {string} char - 单个汉字
   * @returns {string} 拼音（小写）
   */
  function getCharPinyin(char) {
    if (hasPinyinPro) {
      try {
        return pinyinPro.pinyin(char, { toneType: 'none', type: 'array' })[0] || char.toLowerCase();
      } catch (e) {
        return char.toLowerCase();
      }
    }
    return char.toLowerCase();
  }

  /**
   * 获取汉字的拼音首字母
   * @param {string} char - 单个汉字
   * @returns {string} 拼音首字母
   */
  function getCharInitial(char) {
    const pinyin = getCharPinyin(char);
    return pinyin.charAt(0);
  }

  /**
   * 将文本转换为拼音数据
   * @param {string} text - 输入文本
   * @returns {Object} { fullPinyin: string, initialPinyin: string }
   */
  function convertToPinyin(text) {
    if (!text) return { fullPinyin: '', initialPinyin: '' };
    
    let fullPinyin = '';
    let initialPinyin = '';
    
    if (hasPinyinPro) {
      try {
        // 使用 pinyin-pro 转换全拼
        fullPinyin = pinyinPro.pinyin(text, { toneType: 'none', separator: '' }).toLowerCase();
        // 使用 pinyin-pro 转换首字母
        initialPinyin = pinyinPro.pinyin(text, { pattern: 'first', toneType: 'none', separator: '' }).toLowerCase();
      } catch (e) {
        console.error('拼音转换失败:', e);
        // 降级处理：逐字符处理
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          if (/[\u4e00-\u9fa5]/.test(char)) {
            const pinyin = getCharPinyin(char);
            fullPinyin += pinyin;
            initialPinyin += pinyin.charAt(0);
          } else {
            fullPinyin += char.toLowerCase();
            initialPinyin += char.toLowerCase();
          }
        }
      }
    } else {
      // 降级处理：逐字符处理
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (/[\u4e00-\u9fa5]/.test(char)) {
          const pinyin = getCharPinyin(char);
          fullPinyin += pinyin;
          initialPinyin += pinyin.charAt(0);
        } else {
          fullPinyin += char.toLowerCase();
          initialPinyin += char.toLowerCase();
        }
      }
    }
    
    return { fullPinyin, initialPinyin };
  }

  /**
   * 拼音匹配算法
   * 支持全拼、首字母、混合匹配、非连续汉字匹配
   * @param {string} input - 用户输入
   * @param {string} target - 目标文本
   * @param {Object} targetPinyin - 目标文本的拼音数据
   * @returns {Object|null} 匹配结果 { score: number, type: string, matched: boolean, ranges: Array }
   */
  function matchPinyin(input, target, targetPinyin) {
    if (!input || !target) return null;
    
    input = input.toLowerCase();
    const { fullPinyin, initialPinyin } = targetPinyin || convertToPinyin(target);
    
    // 尝试多种匹配方式
    const matches = [];
    
    // 检查是否为混合输入（同时包含拼音和汉字）
    const hasPinyin = /[a-z]/i.test(input);
    const hasHanzi = /[\u4e00-\u9fa5]/.test(input);
    const isMixed = hasPinyin && hasHanzi;
    
    // 如果是混合输入，使用分段匹配
    if (isMixed) {
      const segments = segmentInput(input);
      const mixedMatch = matchSegments(segments, target, { fullPinyin, initialPinyin });
      if (mixedMatch.matched) {
        // 从 details 中提取 ranges
        const ranges = extractRangesFromMatchDetails(mixedMatch.details);
        matches.push({
          ...mixedMatch,
          ranges
        });
      }
    }
    
    // 1. 全拼匹配
    if (fullPinyin.includes(input)) {
      const index = fullPinyin.indexOf(input);
      // 将拼音位置映射到字符位置
      const startChar = findCharPositionFromPinyin(index, target);
      const endChar = findCharPositionFromPinyin(index + input.length, target);
      matches.push({
        type: 'fullPinyin',
        score: 100 - index,
        matched: true,
        ranges: [[startChar, endChar]]
      });
    }
    
    // 2. 首字母匹配
    if (initialPinyin.includes(input)) {
      const index = initialPinyin.indexOf(input);
      matches.push({
        type: 'initialPinyin',
        score: 80 - index,
        matched: true,
        ranges: [[index, index + input.length]]
      });
    }
    
    // 3. 顺序匹配（可以跳过字符）
    const sequenceMatch = matchSequence(input, fullPinyin, target);
    if (sequenceMatch.matched) {
      matches.push({
        type: 'sequence',
        score: sequenceMatch.score,
        matched: true,
        ranges: sequenceMatch.ranges || []
      });
    }
    
    // 4. 非连续汉字匹配（当输入包含汉字且非混合输入时）
    if (hasHanzi && !isMixed) {
      const nonContinuousMatch = matchNonContinuousHanzi(input, target);
      if (nonContinuousMatch.matched) {
        // 将 positions 转换为 ranges
        const ranges = nonContinuousMatch.positions.map(pos => [pos, pos + 1]);
        matches.push({
          ...nonContinuousMatch,
          ranges
        });
      }
    }
    
    if (matches.length === 0) {
      return { matched: false, score: 0, type: 'none', ranges: [] };
    }
    
    // 返回得分最高的匹配
    matches.sort((a, b) => b.score - a.score);
    return matches[0];
  }

  /**
   * 顺序匹配算法（允许跳过字符）
   * @param {string} input - 输入串
   * @param {string} targetPinyin - 目标拼音串
   * @param {string} targetText - 目标文本（用于映射位置）
   * @returns {Object} { matched: boolean, score: number, ranges: Array }
   */
  function matchSequence(input, targetPinyin, targetText = null) {
    let targetIndex = 0;
    let inputIndex = 0;
    let matchCount = 0;
    let lastMatchIndex = -1;
    let continuousMatches = 0;
    const matchedPinyinPositions = []; // 记录匹配到的拼音位置
    
    while (inputIndex < input.length && targetIndex < targetPinyin.length) {
      if (input[inputIndex] === targetPinyin[targetIndex]) {
        matchCount++;
        if (targetIndex === lastMatchIndex + 1) {
          continuousMatches++;
        } else {
          continuousMatches = 1;
        }
        matchedPinyinPositions.push(targetIndex);
        lastMatchIndex = targetIndex;
        inputIndex++;
      }
      targetIndex++;
    }
    
    if (matchCount !== input.length) {
      return { matched: false, score: 0, ranges: [] };
    }
    
    // 计算得分：连续匹配度越高，得分越高
    const coverageScore = (matchCount / targetPinyin.length) * 50;
    const continuityScore = (continuousMatches / input.length) * 50;
    const score = coverageScore + continuityScore;
    
    // 将拼音位置映射到汉字位置
    let ranges = [];
    if (targetText && matchedPinyinPositions.length > 0) {
      // 将每个拼音位置映射为字符位置
      // 注意：findCharPositionFromPinyin 对于内部位置返回 i+1，我们需要转换为实际字符索引
      const charIndexes = [];
      for (let pinyinPos of matchedPinyinPositions) {
        const pos = findCharPositionFromPinyin(pinyinPos, targetText);
        // 如果 pos 是某个汉字的结束位置，我们需要找到实际包含这个拼音位置的汉字
        const actualCharIndex = findActualCharIndex(pinyinPos, targetText);
        charIndexes.push(actualCharIndex);
      }
      
      // 基于字符索引分组连续区域
      const groups = [];
      let currentStart = charIndexes[0];
      let currentEnd = charIndexes[0];
      
      for (let i = 1; i < charIndexes.length; i++) {
        const charIdx = charIndexes[i];
        
        // 如果当前字符索引与上一个索引相同或相邻
        if (charIdx <= currentEnd + 1) {
          currentEnd = Math.max(currentEnd, charIdx);
        } else {
          // 开始新的组
          groups.push([currentStart, currentEnd + 1]);
          currentStart = charIdx;
          currentEnd = charIdx;
        }
      }
      
      // 添加最后一组
      groups.push([currentStart, currentEnd + 1]);
      
      ranges = groups;
    }
    
    return { matched: true, score, ranges };
  }

  /**
   * 非连续汉字匹配
   * 支持输入的汉字在目标文本中跳跃式匹配
   * 例如："我学" 可以匹配 "我爱学习"
   * @param {string} input - 输入文本（纯汉字或包含汉字）
   * @param {string} target - 目标文本
   * @returns {Object} { matched: boolean, score: number, type: string, positions: Array }
   */
  function matchNonContinuousHanzi(input, target) {
    if (!input || !target) {
      return { matched: false, score: 0, type: 'nonContinuous' };
    }

    // 提取输入中的所有汉字
    const inputChars = [];
    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      if (/[\u4e00-\u9fa5]/.test(char)) {
        inputChars.push(char);
      }
    }

    // 如果没有汉字，返回不匹配
    if (inputChars.length === 0) {
      return { matched: false, score: 0, type: 'nonContinuous' };
    }

    // 在目标文本中按顺序查找每个汉字
    const positions = [];
    let targetIndex = 0;
    let continuousCount = 0;
    let lastPos = -1;

    for (const char of inputChars) {
      let found = false;
      
      // 从当前位置开始查找
      for (let i = targetIndex; i < target.length; i++) {
        if (target[i] === char) {
          positions.push(i);
          targetIndex = i + 1;
          found = true;
          
          // 检查是否连续
          if (i === lastPos + 1) {
            continuousCount++;
          } else {
            continuousCount = 1;
          }
          lastPos = i;
          break;
        }
      }

      // 如果某个字符没找到，匹配失败
      if (!found) {
        return { matched: false, score: 0, type: 'nonContinuous' };
      }
    }

    // 计算匹配得分
    const baseScore = 60; // 非连续匹配基础分
    const coverageScore = (inputChars.length / target.length) * 20; // 覆盖率分数
    const continuityScore = (continuousCount / inputChars.length) * 15; // 连续性分数
    const positionScore = (1 - positions[0] / target.length) * 5; // 位置分数（越靠前越高）
    
    const totalScore = baseScore + coverageScore + continuityScore + positionScore;

    return {
      matched: true,
      score: totalScore,
      type: 'nonContinuous',
      positions
    };
  }

  /**
   * 拆分混合输入
   * 将用户输入智能拆分为拼音段、汉字段和其他字符段
   * 例如："w学xi" -> [{type:"pinyin", value:"w"}, {type:"hanzi", value:"学"}, {type:"pinyin", value:"xi"}]
   * @param {string} input - 用户输入
   * @returns {Array} 输入段数组
   */
  function segmentInput(input) {
    if (!input) return [];

    const segments = [];
    let currentSegment = null;

    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      let charType = 'other';

      // 判断字符类型
      if (/[\u4e00-\u9fa5]/.test(char)) {
        charType = 'hanzi';
      } else if (/[a-z]/i.test(char)) {
        charType = 'pinyin';
      }

      // 如果当前段为空或类型不同，创建新段
      if (!currentSegment || currentSegment.type !== charType) {
        if (currentSegment) {
          segments.push(currentSegment);
        }
        currentSegment = {
          type: charType,
          value: char,
          startIndex: i,
          endIndex: i
        };
      } else {
        // 同类型，追加到当前段
        currentSegment.value += char;
        currentSegment.endIndex = i;
      }
    }

    // 添加最后一个段
    if (currentSegment) {
      segments.push(currentSegment);
    }

    return segments;
  }

  /**
   * 定位汉字段
   * 在目标文本中按顺序查找汉字段，支持非连续匹配
   * @param {string} hanziSegment - 汉字段
   * @param {string} target - 目标文本
   * @param {number} startPos - 开始查找的位置
   * @returns {Object|null} { positions: Array, endPos: number, continuous: boolean } 或 null
   */
  function locateHanziSegment(hanziSegment, target, startPos = 0) {
    if (!hanziSegment || !target) return null;

    const positions = [];
    let targetIndex = startPos;
    let continuous = true;
    let lastPos = startPos - 1;

    // 按顺序查找每个汉字
    for (let i = 0; i < hanziSegment.length; i++) {
      const char = hanziSegment[i];
      let found = false;

      for (let j = targetIndex; j < target.length; j++) {
        if (target[j] === char) {
          positions.push(j);
          targetIndex = j + 1;
          found = true;

          // 检查是否连续
          if (j !== lastPos + 1 && lastPos >= startPos) {
            continuous = false;
          }
          lastPos = j;
          break;
        }
      }

      if (!found) {
        return null; // 匹配失败
      }
    }

    return {
      positions,
      endPos: targetIndex,
      continuous
    };
  }

  /**
   * 定位拼音段
   * 在目标拼音串中查找拼音段，支持全拼、首字母和顺序匹配
   * @param {string} pinyinSegment - 拼音段
   * @param {string} fullPinyin - 完整拼音串
   * @param {string} initialPinyin - 首字母拼音串
   * @param {number} startCharIndex - 目标文本的开始字符位置
   * @param {string} target - 目标文本（用于计算位置映射）
   * @returns {Object|null} { type: 'full'|'initial'|'sequence', startPos: number, endPos: number, pinyinStartPos: number, matchedPinyinPositions?: Array } 或 null
   */
  function locatePinyinSegment(pinyinSegment, fullPinyin, initialPinyin, startCharIndex, target) {
    if (!pinyinSegment || !fullPinyin || !target) return null;

    pinyinSegment = pinyinSegment.toLowerCase();

    // 计算当前字符位置对应的拼音位置
    let pinyinStartPos = 0;
    for (let i = 0; i < startCharIndex && i < target.length; i++) {
      const char = target[i];
      if (/[\u4e00-\u9fa5]/.test(char)) {
        // 汉字，计算其拼音长度
        const charPinyin = getCharPinyin(char);
        pinyinStartPos += charPinyin.length;
      } else {
        pinyinStartPos += 1;
      }
    }

    // 尝试全拼匹配（完全包含）
    const fullIndex = fullPinyin.indexOf(pinyinSegment, pinyinStartPos);
    if (fullIndex !== -1) {
      // 找到全拼匹配，计算对应的字符位置
      const charEndPos = findCharPositionFromPinyin(fullIndex + pinyinSegment.length, target);
      return {
        type: 'full',
        startPos: startCharIndex,
        endPos: charEndPos,
        pinyinStartPos: fullIndex
      };
    }

    // 尝试顺序匹配（允许跳过字符）
    const sequenceResult = matchPinyinSequence(pinyinSegment, fullPinyin, pinyinStartPos, target, startCharIndex);
    if (sequenceResult) {
      return sequenceResult;
    }

    // 尝试首字母匹配
    if (initialPinyin) {
      const initialStartPos = Math.min(pinyinStartPos, initialPinyin.length - 1);
      const initialIndex = initialPinyin.indexOf(pinyinSegment, initialStartPos);
      if (initialIndex !== -1) {
        // 首字母匹配，计算对应的字符位置
        const charEndPos = Math.min(startCharIndex + pinyinSegment.length, target.length);
        return {
          type: 'initial',
          startPos: startCharIndex,
          endPos: charEndPos,
          pinyinStartPos: initialIndex
        };
      }
    }

    return null;
  }

  /**
   * 拼音顺序匹配（允许跳过字符）
   * 在拼音串中按顺序查找每个字符，支持跳跃式匹配
   * @param {string} pinyinSegment - 拼音段
   * @param {string} fullPinyin - 完整拼音串
   * @param {number} pinyinStartPos - 开始查找的拼音位置
   * @param {string} target - 目标文本
   * @param {number} startCharIndex - 目标文本的开始字符位置
   * @returns {Object|null} 匹配结果或 null
   */
  function matchPinyinSequence(pinyinSegment, fullPinyin, pinyinStartPos, target, startCharIndex) {
    const matchedPinyinPositions = [];
    let pinyinIndex = pinyinStartPos;
    let segmentIndex = 0;

    // 按顺序查找拼音段中的每个字符
    while (segmentIndex < pinyinSegment.length && pinyinIndex < fullPinyin.length) {
      if (pinyinSegment[segmentIndex] === fullPinyin[pinyinIndex]) {
        matchedPinyinPositions.push(pinyinIndex);
        segmentIndex++;
      }
      pinyinIndex++;
    }

    // 如果没有匹配完整个拼音段，匹配失败
    if (segmentIndex !== pinyinSegment.length) {
      return null;
    }

    // 计算匹配到的字符范围
    const firstMatchPos = matchedPinyinPositions[0];
    const lastMatchPos = matchedPinyinPositions[matchedPinyinPositions.length - 1];
    
    const charStartPos = findCharPositionFromPinyin(firstMatchPos, target);
    const charEndPos = findCharPositionFromPinyin(lastMatchPos + 1, target);

    return {
      type: 'sequence',
      startPos: charStartPos,
      endPos: charEndPos,
      pinyinStartPos: firstMatchPos,
      matchedPinyinPositions
    };
  }

  /**
   * 从拼音位置查找对应的字符位置
   * 对于部分匹配，如果 pinyinPos 在某个汉字的拼音内部，返回该汉字的结束位置
   * @param {number} pinyinPos - 拼音位置（从 0 开始）
   * @param {string} target - 目标文本
   * @returns {number} 字符位置（从 0 开始）
   */
  function findCharPositionFromPinyin(pinyinPos, target) {
    if (pinyinPos === 0) return 0;
    
    let currentPinyinPos = 0;
    for (let i = 0; i < target.length; i++) {
      const char = target[i];
      let charPinyinLength = 1;
      
      if (/[\u4e00-\u9fa5]/.test(char)) {
        const charPinyin = getCharPinyin(char);
        charPinyinLength = charPinyin.length;
      }
      
      const nextPinyinPos = currentPinyinPos + charPinyinLength;
      
      // 如果目标位置在当前字符的拼音范围内（包括起始，不包括结束）
      if (pinyinPos >= currentPinyinPos && pinyinPos < nextPinyinPos) {
        // 对于起始位置，返回当前字符索引
        if (pinyinPos === currentPinyinPos) {
          return i;
        }
        // 对于内部位置（部分匹配），返回下一个字符的位置，以便高亮整个字符
        return i + 1;
      }
      
      // 如果目标位置恰好等于当前字符的结束位置
      if (pinyinPos === nextPinyinPos) {
        return i + 1;
      }
      
      currentPinyinPos = nextPinyinPos;
    }
    
    return target.length;
  }

  /**
   * 从拼音位置查找实际包含该位置的字符索引
   * 与 findCharPositionFromPinyin 不同，这个函数始终返回实际字符的索引，而不是结束位置
   * @param {number} pinyinPos - 拼音位置（从 0 开始）
   * @param {string} target - 目标文本
   * @returns {number} 字符索引（从 0 开始）
   */
  function findActualCharIndex(pinyinPos, target) {
    let currentPinyinPos = 0;
    for (let i = 0; i < target.length; i++) {
      const char = target[i];
      let charPinyinLength = 1;
      
      if (/[\u4e00-\u9fa5]/.test(char)) {
        const charPinyin = getCharPinyin(char);
        charPinyinLength = charPinyin.length;
      }
      
      const nextPinyinPos = currentPinyinPos + charPinyinLength;
      
      // 如果目标位置在当前字符的拼音范围内（包括起始，不包括结束）
      if (pinyinPos >= currentPinyinPos && pinyinPos < nextPinyinPos) {
        return i;
      }
      
      // 如果目标位置恰好等于当前字符的结束位置，返回下一个字符
      if (pinyinPos === nextPinyinPos) {
        return Math.min(i + 1, target.length - 1);
      }
      
      currentPinyinPos = nextPinyinPos;
    }
    
    return target.length - 1;
  }

  /**
   * 从匹配详情中提取 ranges
   * @param {Array} details - matchSegments 返回的 details
   * @returns {Array} ranges 数组
   */
  function extractRangesFromMatchDetails(details) {
    if (!details || details.length === 0) return [];
    
    const ranges = [];
    for (const detail of details) {
      const { matchType, result } = detail;
      
      if (matchType === 'hanzi') {
        // 汉字段：positions 是字符位置数组
        if (result.positions) {
          for (const pos of result.positions) {
            ranges.push([pos, pos + 1]);
          }
        }
      } else if (matchType === 'pinyin') {
        // 拼音段：startPos 和 endPos 是字符范围
        if (result.startPos !== undefined && result.endPos !== undefined) {
          ranges.push([result.startPos, result.endPos]);
        }
      }
    }
    
    return ranges;
  }

  /**
   * 分段匹配
   * 将输入段序列与目标文本进行顺序匹配
   * @param {Array} segments - 输入段数组
   * @param {string} target - 目标文本
   * @param {Object} targetPinyin - 目标拼音数据
   * @returns {Object} { matched: boolean, score: number, type: string, details: Object }
   */
  function matchSegments(segments, target, targetPinyin) {
    if (!segments || segments.length === 0 || !target) {
      return { matched: false, score: 0, type: 'mixed' };
    }

    const { fullPinyin, initialPinyin } = targetPinyin || convertToPinyin(target);
    let currentCharPos = 0;
    const matchDetails = [];
    let totalContinuous = true;

    // 逐个处理每个段
    for (const segment of segments) {
      if (segment.type === 'hanzi') {
        // 汉字段匹配
        const result = locateHanziSegment(segment.value, target, currentCharPos);
        if (!result) {
          return { matched: false, score: 0, type: 'mixed' };
        }
        matchDetails.push({
          segment,
          result,
          matchType: 'hanzi'
        });
        currentCharPos = result.endPos;
        if (!result.continuous) {
          totalContinuous = false;
        }
      } else if (segment.type === 'pinyin') {
        // 拼音段匹配
        const result = locatePinyinSegment(segment.value, fullPinyin, initialPinyin, currentCharPos, target);
        if (!result) {
          return { matched: false, score: 0, type: 'mixed' };
        }
        matchDetails.push({
          segment,
          result,
          matchType: 'pinyin'
        });
        currentCharPos = result.endPos;
        if (result.type === 'initial') {
          totalContinuous = false;
        }
      }
      // 'other' 类型暂时忽略
    }

    // 计算匹配得分
    const baseScore = totalContinuous ? 70 : 40; // 混合匹配基础分
    const inputLength = segments.reduce((sum, seg) => sum + seg.value.length, 0);
    const coverageScore = (inputLength / target.length) * 20;
    const positionScore = matchDetails.length > 0 ? 
      (1 - (matchDetails[0].result.positions?.[0] || matchDetails[0].result.startPos || 0) / target.length) * 10 : 0;

    const totalScore = baseScore + coverageScore + positionScore;

    return {
      matched: true,
      score: totalScore,
      type: totalContinuous ? 'mixed' : 'mixedJump',
      details: matchDetails
    };
  }

  return {
    convertToPinyin,
    matchPinyin,
    getCharPinyin,
    getCharInitial,
    matchNonContinuousHanzi,
    segmentInput,
    matchSegments,
    locateHanziSegment,
    locatePinyinSegment,
    findCharPositionFromPinyin,
    findActualCharIndex,
    extractRangesFromMatchDetails
  };
})();

// 导出到全局
if (typeof window !== 'undefined') {
  window.PinyinUtil = PinyinUtil;
}
