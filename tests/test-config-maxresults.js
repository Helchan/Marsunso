/**
 * 测试 maxResults 配置
 * 用于验证配置的加载和使用是否正确
 */

async function testMaxResultsConfig() {
  console.log('=== 测试 maxResults 配置 ===\n');
  
  // 步骤 1：查看当前配置
  console.log('步骤 1: 查看当前配置');
  await Config.loadConfig();
  const currentMaxResults = Config.get('maxResults');
  console.log(`  当前 maxResults: ${currentMaxResults}`);
  console.log(`  完整配置:`, Config.getAll());
  
  // 步骤 2：查看存储中的配置
  console.log('\n步骤 2: 查看 chrome.storage.sync 中的配置');
  const storageData = await chrome.storage.sync.get('config');
  if (storageData.config) {
    console.log(`  存储中的 maxResults: ${storageData.config.maxResults}`);
    console.log(`  存储的完整配置:`, storageData.config);
  } else {
    console.log('  存储中没有配置（使用默认值）');
  }
  
  // 步骤 3：测试搜索引擎是否使用正确的 maxResults
  console.log('\n步骤 3: 测试搜索引擎');
  const results = await SearchEngine.search('');
  console.log(`  搜索返回的结果数: ${results.length}`);
  console.log(`  预期最大结果数: ${currentMaxResults}`);
  
  if (results.length <= currentMaxResults) {
    console.log('  ✓ 结果数量符合预期');
  } else {
    console.warn(`  ⚠ 结果数量超出预期！实际 ${results.length} > 预期 ${currentMaxResults}`);
  }
  
  console.log('\n=== 测试完成 ===\n');
  console.log('💡 如果发现配置未生效，可以尝试以下操作：');
  console.log('  1. 清除存储中的旧配置: await Config.clearStorage()');
  console.log('  2. 重新加载配置: await Config.loadConfig()');
  console.log('  3. 手动设置配置: await Config.set("maxResults", 30)');
  console.log('  4. 重置为默认配置: await Config.reset()');
}

// 清除旧配置并使用默认值
async function resetToDefault() {
  console.log('=== 重置配置为默认值 ===\n');
  
  console.log('1. 清除存储中的配置...');
  await Config.clearStorage();
  
  console.log('2. 重新加载配置...');
  await Config.loadConfig();
  
  console.log('3. 验证配置...');
  const maxResults = Config.get('maxResults');
  console.log(`  当前 maxResults: ${maxResults}`);
  
  console.log('\n✅ 配置已重置！请刷新页面后重新测试。');
}

// 设置自定义 maxResults
async function setCustomMaxResults(value) {
  console.log(`=== 设置 maxResults 为 ${value} ===\n`);
  
  const success = await Config.set('maxResults', value);
  
  if (success) {
    console.log(`✓ 设置成功！新的 maxResults: ${Config.get('maxResults')}`);
    console.log('💡 请刷新页面后重新搜索以查看效果');
  } else {
    console.error('✗ 设置失败！');
  }
}

// 导出测试函数
if (typeof window !== 'undefined') {
  window.TestMaxResults = {
    testMaxResultsConfig,
    resetToDefault,
    setCustomMaxResults
  };
  
  console.log('💡 maxResults 配置测试工具已加载！使用方法：');
  console.log('  TestMaxResults.testMaxResultsConfig()       - 测试当前配置');
  console.log('  TestMaxResults.resetToDefault()             - 重置为默认配置');
  console.log('  TestMaxResults.setCustomMaxResults(50)      - 设置自定义值（如 50）');
}
