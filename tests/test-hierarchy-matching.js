/**
 * 层级匹配算法测试文件
 * 用于验证Bug修复后的多关键词层级匹配功能
 */

// 模拟书签数据
const mockBookmarks = [
  {
    id: '1',
    title: '读书乐园',
    path: ['书签栏', '我爱学习', '读书乐园'],
    pathPinyinData: [
      { fullPinyin: 'shuqianlan', initialPinyin: 'sql' },
      { fullPinyin: 'woaixuexi', initialPinyin: 'waxx' },
      { fullPinyin: 'dushueleyuan', initialPinyin: 'dsly' }
    ],
    pinyin: { fullPinyin: 'dushueleyuan', initialPinyin: 'dsly' },
    isFolder: false,
    depth: 3,
    url: 'https://example.com/reading',
    domain: 'example.com'
  },
  {
    id: '2',
    title: 'study',
    path: ['书签栏', 'space', 'study'],
    pathPinyinData: [
      { fullPinyin: 'shuqianlan', initialPinyin: 'sql' },
      { fullPinyin: 'space', initialPinyin: 's' },
      { fullPinyin: 'study', initialPinyin: 's' }
    ],
    pinyin: { fullPinyin: 'study', initialPinyin: 's' },
    isFolder: false,
    depth: 3,
    url: 'https://example.com/study',
    domain: 'example.com'
  },
  {
    id: '3',
    title: 'React文档',
    path: ['书签栏', '学习', '前端', 'React文档'],
    pathPinyinData: [
      { fullPinyin: 'shuqianlan', initialPinyin: 'sql' },
      { fullPinyin: 'xuexi', initialPinyin: 'xx' },
      { fullPinyin: 'qianduan', initialPinyin: 'qd' },
      { fullPinyin: 'reactwendang', initialPinyin: 'rwd' }
    ],
    pinyin: { fullPinyin: 'reactwendang', initialPinyin: 'rwd' },
    isFolder: false,
    depth: 4,
    url: 'https://react.dev',
    domain: 'react.dev'
  }
];

// 测试用例
const testCases = [
  // 用例1：中文非连续匹配
  {
    name: '中文非连续匹配：我学习 读书',
    input: '我学习 读书',
    expectedBookmarkId: '1',
    shouldMatch: true,
    description: '第一层非连续汉字匹配'
  },
  {
    name: '中文非连续匹配：我学 读',
    input: '我学 读',
    expectedBookmarkId: '1',
    shouldMatch: true,
    description: '两层都是非连续匹配'
  },
  {
    name: '中文包含匹配：学习 乐园',
    input: '学习 乐园',
    expectedBookmarkId: '1',
    shouldMatch: true,
    description: '包含匹配'
  },
  
  // 用例2：拼音匹配
  {
    name: '拼音匹配：woaixuexi 读书',
    input: 'woaixuexi 读书',
    expectedBookmarkId: '1',
    shouldMatch: true,
    description: '全拼 + 汉字'
  },
  {
    name: '拼音匹配：waxx dsly',
    input: 'waxx dsly',
    expectedBookmarkId: '1',
    shouldMatch: true,
    description: '首字母匹配'
  },
  
  // 用例3：英文匹配
  {
    name: '英文非连续匹配：spce stud',
    input: 'spce stud',
    expectedBookmarkId: '2',
    shouldMatch: true,
    description: '非连续字母匹配'
  },
  {
    name: '英文前缀匹配：spa stu',
    input: 'spa stu',
    expectedBookmarkId: '2',
    shouldMatch: true,
    description: '前缀匹配'
  },
  
  // 用例4：多层路径匹配
  {
    name: '多层路径匹配：学习 前端 react',
    input: '学习 前端 react',
    expectedBookmarkId: '3',
    shouldMatch: true,
    description: '三层路径匹配'
  },
  {
    name: '跳跃式匹配：学 端 react',
    input: '学 端 react',
    expectedBookmarkId: '3',
    shouldMatch: true,
    description: '跳跃式匹配'
  },
  
  // 用例5：边界情况
  {
    name: '单关键词匹配：读书乐园',
    input: '读书乐园',
    expectedBookmarkId: '1',
    shouldMatch: true,
    description: '单关键词匹配'
  },
  {
    name: '不匹配：不存在 读书',
    input: '不存在 读书',
    expectedBookmarkId: '1',
    shouldMatch: false,
    description: '第一层不匹配'
  }
];

// 运行测试
async function runTests() {
  console.log('='.repeat(80));
  console.log('开始测试层级匹配算法');
  console.log('='.repeat(80));
  
  let passedCount = 0;
  let failedCount = 0;
  
  for (const testCase of testCases) {
    console.log(`\n测试: ${testCase.name}`);
    console.log(`输入: "${testCase.input}"`);
    console.log(`描述: ${testCase.description}`);
    
    try {
      // 清理并分割关键词
      const query = SearchEngine.cleanInput(testCase.input);
      const keywords = query.split(' ').filter(k => k);
      
      console.log(`关键词数组: [${keywords.join(', ')}]`);
      
      // 执行匹配
      const results = matchHierarchy(mockBookmarks, keywords);
      
      // 验证结果
      const matchedBookmark = results.find(r => r.id === testCase.expectedBookmarkId);
      const hasMatch = results.length > 0 && matchedBookmark !== undefined;
      
      if (testCase.shouldMatch) {
        if (hasMatch) {
          console.log(`✅ 通过 - 成功匹配到书签: ${matchedBookmark.title}`);
          console.log(`   匹配得分: ${matchedBookmark.matchScore.toFixed(2)}`);
          passedCount++;
        } else {
          console.log(`❌ 失败 - 期望匹配但未找到`);
          console.log(`   实际结果: ${results.length > 0 ? results.map(r => r.title).join(', ') : '无匹配'}`);
          failedCount++;
        }
      } else {
        if (!hasMatch) {
          console.log(`✅ 通过 - 正确地未匹配`);
          passedCount++;
        } else {
          console.log(`❌ 失败 - 期望不匹配但找到了: ${matchedBookmark.title}`);
          failedCount++;
        }
      }
    } catch (error) {
      console.log(`❌ 错误 - ${error.message}`);
      failedCount++;
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log(`测试完成: ${passedCount} 通过, ${failedCount} 失败`);
  console.log('='.repeat(80));
}

// 导出测试函数（用于在控制台运行）
if (typeof window !== 'undefined') {
  window.runHierarchyMatchingTests = runTests;
}

console.log('层级匹配测试已加载，请在浏览器扩展中调用 runHierarchyMatchingTests() 运行测试');
