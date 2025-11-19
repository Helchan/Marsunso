/**
 * 路径导航测试文件
 * 用于验证路径导航模式的修复
 */

// 模拟书签数据
const mockBookmarks = [
  {
    id: '1',
    title: '学习天地',
    path: ['书签栏', '学习天地'],
    pathPinyinData: [
      { fullPinyin: 'shuqianlan', initialPinyin: 'sql' },
      { fullPinyin: 'xuexitiandi', initialPinyin: 'xxtd' }
    ],
    pinyin: { fullPinyin: 'xuexitiandi', initialPinyin: 'xxtd' },
    isFolder: true,
    depth: 2
  },
  {
    id: '2',
    title: '背诵课文',
    path: ['书签栏', '学习天地', '背诵课文'],
    pathPinyinData: [
      { fullPinyin: 'shuqianlan', initialPinyin: 'sql' },
      { fullPinyin: 'xuexitiandi', initialPinyin: 'xxtd' },
      { fullPinyin: 'beisongkewen', initialPinyin: 'bskw' }
    ],
    pinyin: { fullPinyin: 'beisongkewen', initialPinyin: 'bskw' },
    isFolder: true,
    depth: 3
  },
  {
    id: '3',
    title: '古诗',
    path: ['书签栏', '学习天地', '背诵课文', '古诗'],
    pathPinyinData: [
      { fullPinyin: 'shuqianlan', initialPinyin: 'sql' },
      { fullPinyin: 'xuexitiandi', initialPinyin: 'xxtd' },
      { fullPinyin: 'beisongkewen', initialPinyin: 'bskw' },
      { fullPinyin: 'gushi', initialPinyin: 'gs' }
    ],
    pinyin: { fullPinyin: 'gushi', initialPinyin: 'gs' },
    isFolder: false,
    depth: 4,
    url: 'https://example.com/gushi'
  },
  {
    id: '4',
    title: '现代文',
    path: ['书签栏', '学习天地', '背诵课文', '现代文'],
    pathPinyinData: [
      { fullPinyin: 'shuqianlan', initialPinyin: 'sql' },
      { fullPinyin: 'xuexitiandi', initialPinyin: 'xxtd' },
      { fullPinyin: 'beisongkewen', initialPinyin: 'bskw' },
      { fullPinyin: 'xiandaiwen', initialPinyin: 'xdw' }
    ],
    pinyin: { fullPinyin: 'xiandaiwen', initialPinyin: 'xdw' },
    isFolder: false,
    depth: 4,
    url: 'https://example.com/xiandaiwen'
  }
];

// 测试用例
const testCases = [
  {
    name: '路径导航：/学习天地',
    input: '/学习天地',
    expectedLength: 1,
    expectedTitles: ['背诵课文'],
    description: '路径导航到学习天地目录'
  },
  {
    name: '路径导航：/学习天地 ',
    input: '/学习天地 ',
    expectedLength: 1,
    expectedTitles: ['背诵课文'],
    description: '路径导航到学习天地目录（末尾有空格）'
  },
  {
    name: '路径导航：/学习天地 课文',
    input: '/学习天地 课文',
    expectedLength: 1,
    expectedTitles: ['背诵课文'],
    description: '在学习天地下搜索包含"课文"的项目'
  },
  {
    name: '路径导航：/学习天地 课文 ',
    input: '/学习天地 课文 ',
    expectedLength: 2,
    expectedTitles: ['古诗', '现代文'],
    description: '获取"背诵课文"目录下的子项'
  }
];

// 模拟 BookmarkManager
const BookmarkManager = {
  async getBookmarkByPath(pathString) {
    if (pathString === '/学习天地') {
      return mockBookmarks[0];
    }
    return null;
  },
  
  async getChildren(bookmarkId) {
    if (bookmarkId === '1') {
      return [mockBookmarks[1]];
    }
    if (bookmarkId === '2') {
      return [mockBookmarks[2], mockBookmarks[3]];
    }
    return [];
  },
  
  async getAllBookmarks() {
    return mockBookmarks;
  }
};

// 模拟 matchAndScore 函数
function matchAndScore(bookmarks, keyword) {
  return bookmarks.filter(b => b.title.includes(keyword));
}

// 运行测试
async function runTests() {
  console.log('='.repeat(80));
  console.log('开始测试路径导航修复');
  console.log('='.repeat(80));
  
  let passedCount = 0;
  let failedCount = 0;
  
  for (const testCase of testCases) {
    console.log(`\n测试: ${testCase.name}`);
    console.log(`输入: "${testCase.input}"`);
    console.log(`描述: ${testCase.description}`);
    
    try {
      // 执行路径导航搜索
      const results = await searchByPath(testCase.input);
      
      // 验证结果
      if (results.length === testCase.expectedLength) {
        const titles = results.map(r => r.title);
        const hasAllExpected = testCase.expectedTitles.every(title => titles.includes(title));
        
        if (hasAllExpected) {
          console.log(`✅ 通过 - 返回 ${results.length} 个结果: ${titles.join(', ')}`);
          passedCount++;
        } else {
          console.log(`❌ 失败 - 期望包含: ${testCase.expectedTitles.join(', ')}`);
          console.log(`   实际结果: ${titles.join(', ')}`);
          failedCount++;
        }
      } else {
        console.log(`❌ 失败 - 期望 ${testCase.expectedLength} 个结果，实际 ${results.length} 个`);
        console.log(`   实际结果: ${results.map(r => r.title).join(', ')}`);
        failedCount++;
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
  window.runPathNavigationTests = runTests;
}

console.log('路径导航测试已加载，请在浏览器扩展中调用 runPathNavigationTests() 运行测试');