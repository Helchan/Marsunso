/**
 * 拼音模糊匹配优化测试
 * 验证设计文档中的所有测试场景
 */

// 测试用例
const testCases = [
  {
    name: '拼音汉字混合-基础',
    input: 'w学xi',
    target: '我爱学习',
    expected: true,
    description: '测试 w 匹配"我"，学匹配"学"，xi 匹配"习"'
  },
  {
    name: '拼音汉字混合-复杂',
    input: 'w爱xu习',
    target: '我爱学习',
    expected: true,
    description: '测试复杂混合输入'
  },
  {
    name: '非连续汉字-基础',
    input: '我学',
    target: '我爱学习',
    expected: true,
    description: '测试非连续汉字"我"和"学"'
  },
  {
    name: '非连续汉字-复杂',
    input: '我习',
    target: '我爱学习',
    expected: true,
    description: '测试跨度更大的非连续汉字'
  },
  {
    name: '全拼音',
    input: 'woxuexi',
    target: '我学习',
    expected: true,
    description: '保持原有全拼匹配能力'
  },
  {
    name: '全汉字连续',
    input: '学习',
    target: '我爱学习',
    expected: true,
    description: '保持原有连续汉字匹配能力'
  },
  {
    name: '首字母',
    input: 'waxx',
    target: '我爱学习',
    expected: true,
    description: '保持原有首字母匹配能力'
  },
  {
    name: '无匹配',
    input: 'abc',
    target: '我爱学习',
    expected: false,
    description: '不应该匹配完全无关的输入'
  },
  {
    name: '顺序错误',
    input: 'xi学w',
    target: '我爱学习',
    expected: false,
    description: '顺序错误的输入不应该匹配'
  }
];

// 运行测试
function runTests() {
  console.log('=== 拼音模糊匹配优化测试 ===\n');
  
  let passedCount = 0;
  let failedCount = 0;
  const results = [];

  for (const testCase of testCases) {
    const { name, input, target, expected, description } = testCase;
    
    // 获取拼音数据
    const pinyinData = PinyinUtil.convertToPinyin(target);
    
    // 执行匹配
    const result = PinyinUtil.matchPinyin(input, target, pinyinData);
    const matched = result && result.matched;
    const passed = matched === expected;
    
    if (passed) {
      passedCount++;
    } else {
      failedCount++;
    }
    
    results.push({
      name,
      input,
      target,
      description,
      expected,
      actual: matched,
      passed,
      result: result || { matched: false, score: 0, type: 'none' }
    });
    
    // 打印结果
    const status = passed ? '✓ PASS' : '✗ FAIL';
    const color = passed ? '\x1b[32m' : '\x1b[31m';
    const reset = '\x1b[0m';
    
    console.log(`${color}${status}${reset} ${name}`);
    console.log(`  描述: ${description}`);
    console.log(`  输入: "${input}" -> 目标: "${target}"`);
    console.log(`  预期: ${expected ? '匹配' : '不匹配'}, 实际: ${matched ? '匹配' : '不匹配'}`);
    
    if (matched && result) {
      console.log(`  匹配类型: ${result.type}, 分数: ${result.score.toFixed(2)}`);
    }
    
    if (!passed) {
      console.log(`  ⚠️  测试失败！`);
    }
    console.log('');
  }
  
  // 打印汇总
  console.log('=== 测试汇总 ===');
  console.log(`总计: ${testCases.length} 个测试`);
  console.log(`\x1b[32m通过: ${passedCount}\x1b[0m`);
  console.log(`\x1b[31m失败: ${failedCount}\x1b[0m`);
  console.log(`通过率: ${((passedCount / testCases.length) * 100).toFixed(1)}%\n`);
  
  return results;
}

// 额外的功能测试
function testSegmentation() {
  console.log('=== 输入拆分测试 ===\n');
  
  const testInputs = [
    'w学xi',
    '我学习',
    'woxuexi',
    'w爱xu习',
    '123abc中文'
  ];
  
  for (const input of testInputs) {
    const segments = PinyinUtil.segmentInput(input);
    console.log(`输入: "${input}"`);
    console.log('拆分结果:', segments.map(s => `[${s.type}:"${s.value}"]`).join(' '));
    console.log('');
  }
}

// 导出到全局
if (typeof window !== 'undefined') {
  window.runPinyinTests = runTests;
  window.testSegmentation = testSegmentation;
}

// 在控制台中可以调用: runPinyinTests() 或 testSegmentation()
console.log('测试函数已加载。在控制台中运行:');
console.log('  runPinyinTests()     - 运行所有匹配测试');
console.log('  testSegmentation()   - 测试输入拆分功能');
