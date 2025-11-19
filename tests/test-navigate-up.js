/**
 * navigateUp 函数测试脚本
 * 用于验证 Bug #4 修复后的路径回退逻辑
 */

// 模拟 navigateUp 函数
function navigateUp(currentValue) {
  // 步骤1：去除末尾的连续分隔符
  let trimmedValue = currentValue;
  while (trimmedValue.length > 0 && 
         (trimmedValue.endsWith('/') || trimmedValue.endsWith(' '))) {
    trimmedValue = trimmedValue.slice(0, -1);
  }
  
  // 步骤2：查找最后一个分隔符
  let lastSeparatorIndex = -1;
  for (let i = trimmedValue.length - 1; i >= 0; i--) {
    const char = trimmedValue[i];
    if (char === '/' || char === ' ') {
      lastSeparatorIndex = i;
      break;
    }
  }
  
  // 步骤3：生成新路径
  let newValue = '';
  if (lastSeparatorIndex >= 0) {
    newValue = trimmedValue.substring(0, lastSeparatorIndex);
  }
  
  return newValue;
}

// 测试用例
const testCases = [
  { input: "/学习/读书/语文", expected: "/学习/读书", description: "标准三级路径" },
  { input: "/学习/读书", expected: "/学习", description: "标准二级路径" },
  { input: "/学习", expected: "", description: "单级路径" },
  { input: "/学习/读书/", expected: "/学习", description: "末尾带斜杠的路径" },
  { input: "/学习/", expected: "", description: "单级路径末尾带斜杠" },
  { input: "/", expected: "", description: "仅根路径" },
  { input: "", expected: "", description: "空路径" },
  { input: "学习 读书 语文", expected: "学习 读书", description: "空格分隔的三级" },
  { input: "学习 读书", expected: "学习", description: "空格分隔的二级" },
  { input: "学习", expected: "", description: "空格分隔的单级" },
  { input: "///", expected: "", description: "多个连续斜杠" },
  { input: "   ", expected: "", description: "多个连续空格" },
];

// 执行测试
console.log("=== navigateUp 函数测试 ===\n");

let passCount = 0;
let failCount = 0;

testCases.forEach((testCase, index) => {
  const result = navigateUp(testCase.input);
  const passed = result === testCase.expected;
  
  if (passed) {
    passCount++;
    console.log(`✅ 测试 ${index + 1} 通过: ${testCase.description}`);
  } else {
    failCount++;
    console.log(`❌ 测试 ${index + 1} 失败: ${testCase.description}`);
    console.log(`   输入: "${testCase.input}"`);
    console.log(`   预期: "${testCase.expected}"`);
    console.log(`   实际: "${result}"`);
  }
});

console.log(`\n=== 测试总结 ===`);
console.log(`通过: ${passCount}/${testCases.length}`);
console.log(`失败: ${failCount}/${testCases.length}`);

if (failCount === 0) {
  console.log("\n🎉 所有测试通过！");
} else {
  console.log("\n⚠️  存在失败的测试，请检查代码");
}
