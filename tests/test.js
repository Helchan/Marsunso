/**
 * 演示和测试辅助脚本
 * 用于在开发控制台中测试各个模块
 */

// 测试书签管理器
async function testBookmarkManager() {
  console.log('=== 测试书签管理器 ===');
  
  try {
    // 获取所有书签
    const allBookmarks = await BookmarkManager.getAllBookmarks();
    console.log(`✓ 获取到 ${allBookmarks.length} 个书签`);
    
    // 获取二级书签
    const secondLevel = await BookmarkManager.getSecondLevelBookmarks();
    console.log(`✓ 获取到 ${secondLevel.length} 个二级书签`);
    
    // 显示前3个书签
    if (allBookmarks.length > 0) {
      console.log('前 3 个书签：');
      allBookmarks.slice(0, 3).forEach((b, i) => {
        console.log(`  ${i + 1}. ${b.title} (${b.isFolder ? '文件夹' : '书签'})`);
        console.log(`     路径: ${b.pathString}`);
        if (b.url) console.log(`     URL: ${b.url}`);
      });
    }
    
    return { success: true, count: allBookmarks.length };
  } catch (error) {
    console.error('✗ 书签管理器测试失败:', error);
    return { success: false, error };
  }
}

// 测试搜索引擎
async function testSearchEngine() {
  console.log('\n=== 测试搜索引擎 ===');
  
  const testCases = [
    { query: '', name: '默认模式（空查询）' },
    { query: 'github', name: '单关键词搜索' },
    { query: '学习 读书', name: '层级搜索' },
    { query: '/学习', name: '路径导航' },
    { query: 'baidu', name: 'URL 匹配' }
  ];
  
  for (const testCase of testCases) {
    try {
      console.log(`\n测试: ${testCase.name}`);
      console.log(`查询: "${testCase.query}"`);
      
      const results = await SearchEngine.search(testCase.query);
      console.log(`✓ 返回 ${results.length} 个结果`);
      
      if (results.length > 0) {
        console.log('  前 3 个结果：');
        results.slice(0, 3).forEach((r, i) => {
          console.log(`    ${i + 1}. ${r.title}`);
        });
      }
    } catch (error) {
      console.error(`✗ 测试失败:`, error);
    }
  }
}

// 测试拼音工具
function testPinyinUtil() {
  console.log('\n=== 测试拼音工具 ===');
  
  const testCases = [
    { text: '我爱学习', input: 'woaxxi' },
    { text: '我爱学习', input: 'wo' },
    { text: '我爱学习', input: 'woai' },
    { text: '百度', input: 'baidu' },
    { text: '谷歌', input: 'gg' }
  ];
  
  testCases.forEach(({ text, input }) => {
    const pinyin = PinyinUtil.convertToPinyin(text);
    const match = PinyinUtil.matchPinyin(input, text, pinyin);
    
    console.log(`\n文本: "${text}"`);
    console.log(`  全拼: ${pinyin.fullPinyin}`);
    console.log(`  首字母: ${pinyin.initialPinyin}`);
    console.log(`  匹配 "${input}": ${match.matched ? '✓' : '✗'} (得分: ${match.score.toFixed(2)})`);
  });
}

// 测试配置管理
async function testConfig() {
  console.log('\n=== 测试配置管理 ===');
  
  try {
    // 加载配置
    await Config.loadConfig();
    console.log('✓ 配置加载成功');
    
    // 获取所有配置
    const allConfig = Config.getAll();
    console.log('当前配置:');
    Object.entries(allConfig).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    
    // 测试获取单个配置
    const maxResults = Config.get('maxResults');
    console.log(`\n✓ 最大结果数: ${maxResults}`);
    
    return { success: true, config: allConfig };
  } catch (error) {
    console.error('✗ 配置管理测试失败:', error);
    return { success: false, error };
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('🧪 开始运行所有测试...\n');
  
  const startTime = Date.now();
  
  // 测试拼音工具（同步）
  testPinyinUtil();
  
  // 测试书签管理器
  await testBookmarkManager();
  
  // 测试搜索引擎
  await testSearchEngine();
  
  // 测试配置管理
  await testConfig();
  
  const duration = Date.now() - startTime;
  console.log(`\n\n✅ 所有测试完成！耗时 ${duration}ms`);
}

// 性能测试
async function performanceTest() {
  console.log('\n=== 性能测试 ===');
  
  const iterations = 10;
  const query = 'test';
  
  console.log(`执行 ${iterations} 次搜索...`);
  
  const times = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await SearchEngine.search(query);
    const end = performance.now();
    times.push(end - start);
  }
  
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const maxTime = Math.max(...times);
  const minTime = Math.min(...times);
  
  console.log(`平均耗时: ${avgTime.toFixed(2)}ms`);
  console.log(`最大耗时: ${maxTime.toFixed(2)}ms`);
  console.log(`最小耗时: ${minTime.toFixed(2)}ms`);
  
  if (avgTime < 200) {
    console.log('✓ 性能测试通过（目标: < 200ms）');
  } else {
    console.warn('⚠ 性能需要优化');
  }
}

// 导出测试函数
if (typeof window !== 'undefined') {
  window.QuickerTest = {
    testBookmarkManager,
    testSearchEngine,
    testPinyinUtil,
    testConfig,
    runAllTests,
    performanceTest
  };
  
  console.log('💡 测试工具已加载！使用方法：');
  console.log('  QuickerTest.runAllTests()     - 运行所有测试');
  console.log('  QuickerTest.testBookmarkManager()  - 测试书签管理');
  console.log('  QuickerTest.testSearchEngine()     - 测试搜索引擎');
  console.log('  QuickerTest.testPinyinUtil()       - 测试拼音工具');
  console.log('  QuickerTest.testConfig()           - 测试配置管理');
  console.log('  QuickerTest.performanceTest()      - 性能测试');
}
