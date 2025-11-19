/**
 * 测试路径高亮功能
 * 验证路径层级匹配时能正确计算高亮范围
 */

// 模拟路径层级匹配结果
function testCalculatePathRanges() {
  console.log('===== 测试路径高亮范围计算 =====\n');
  
  // 测试用例 1: "/书签栏/学习天地/编程开发" 搜索 "学习 开发"
  {
    console.log('测试用例 1: 路径 "书签栏/学习天地/编程开发" 搜索 "学习 开发"');
    
    const parentPath = ['书签栏', '学习天地', '编程开发'];
    const layerMatches = [
      {
        pathIndex: 1, // "学习天地"
        pathLayer: '学习天地',
        ranges: [[0, 2]] // "学习"
      },
      {
        pathIndex: 2, // "编程开发"
        pathLayer: '编程开发',
        ranges: [[2, 4]] // "开发"
      }
    ];
    
    const pathRanges = calculatePathRanges(parentPath, layerMatches);
    
    console.log('父路径数组:', parentPath);
    console.log('层级匹配:', layerMatches);
    console.log('计算出的路径高亮范围:', pathRanges);
    
    // 验证结果
    // "书签栏/学习天地/编程开发"
    //  0-3  /  4-8  /  9-13
    // "学习" 在 "书签栏/" 之后的 "学习天地" 中，应该是 [4, 6]
    // "开发" 在 "书签栏/学习天地/" 之后的 "编程开发" 中，应该是 [11, 13]
    
    const expectedRanges = [[4, 6], [11, 13]];
    const isCorrect = JSON.stringify(pathRanges) === JSON.stringify(expectedRanges);
    
    console.log('期望结果:', expectedRanges);
    console.log('测试结果:', isCorrect ? '✅ 通过' : '❌ 失败');
    console.log('\n');
  }
  
  // 测试用例 2: "/书签栏/前端学习/Vue" 搜索 "前端"
  {
    console.log('测试用例 2: 路径 "书签栏/前端学习/Vue" 搜索 "前端"');
    
    const parentPath = ['书签栏', '前端学习', 'Vue'];
    const layerMatches = [
      {
        pathIndex: 1, // "前端学习"
        pathLayer: '前端学习',
        ranges: [[0, 2]] // "前端"
      }
    ];
    
    const pathRanges = calculatePathRanges(parentPath, layerMatches);
    
    console.log('父路径数组:', parentPath);
    console.log('层级匹配:', layerMatches);
    console.log('计算出的路径高亮范围:', pathRanges);
    
    // "书签栏/前端学习/Vue"
    //  0-3  /  4-8  / 9-12
    // "前端" 在 "书签栏/" 之后的 "前端学习" 中，应该是 [4, 6]
    
    const expectedRanges = [[4, 6]];
    const isCorrect = JSON.stringify(pathRanges) === JSON.stringify(expectedRanges);
    
    console.log('期望结果:', expectedRanges);
    console.log('测试结果:', isCorrect ? '✅ 通过' : '❌ 失败');
    console.log('\n');
  }
  
  // 测试用例 3: 拼音匹配 "/书签栏/编程语言/JavaScript" 搜索 "bcyy"
  {
    console.log('测试用例 3: 路径 "书签栏/编程语言/JavaScript" 搜索 "bcyy" (拼音)');
    
    const parentPath = ['书签栏', '编程语言', 'JavaScript'];
    const layerMatches = [
      {
        pathIndex: 1, // "编程语言"
        pathLayer: '编程语言',
        ranges: [[0, 1], [1, 2], [2, 3], [3, 4]] // 每个字符一个范围（拼音非连续匹配）
      }
    ];
    
    const pathRanges = calculatePathRanges(parentPath, layerMatches);
    
    console.log('父路径数组:', parentPath);
    console.log('层级匹配:', layerMatches);
    console.log('计算出的路径高亮范围:', pathRanges);
    
    // "书签栏/编程语言/JavaScript"
    //  0-3  /  4-8  / 9-19
    // "编程语言" 全部高亮，应该是 [4,5], [5,6], [6,7], [7,8]
    
    const expectedRanges = [[4, 5], [5, 6], [6, 7], [7, 8]];
    const isCorrect = JSON.stringify(pathRanges) === JSON.stringify(expectedRanges);
    
    console.log('期望结果:', expectedRanges);
    console.log('测试结果:', isCorrect ? '✅ 通过' : '❌ 失败');
    console.log('\n');
  }
}

/**
 * 计算路径字符串中的匹配范围（从 filter.js 复制）
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

// 运行测试
testCalculatePathRanges();
