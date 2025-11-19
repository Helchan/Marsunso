# 测试目录

本目录包含 Quicker 项目的所有测试文件，用于验证各个模块的功能正确性和稳定性。

## 测试文件列表

### 单元测试

- **test-navigate-up.js** - 路径回退算法测试
  - 验证 `navigateUp()` 函数的路径回退逻辑
  - 覆盖斜杠路径、空格分隔路径、边界情况等
  - 运行方式: `node tests/test-navigate-up.js`

- **test-hierarchy-matching.js** - 层级匹配算法测试
  - 验证多关键词层级匹配功能
  - 测试中文非连续匹配、拼音匹配、英文匹配、多层路径匹配
  - 需要在浏览器控制台运行（依赖 SearchEngine 模块）

- **test-pinyin-matching.js** - 拼音匹配算法测试
  - 验证拼音工具的各种匹配模式
  - 测试全拼、首字母、混合输入、非连续匹配等
  - 需要在浏览器控制台运行（依赖 PinyinUtil 模块）

- **test-path-navigation.js** - 路径导航功能测试
  - 验证路径导航模式的准确性
  - 测试精确路径匹配、路径搜索混合等场景
  - 需要在浏览器控制台运行

- **test-path-highlight.js** - 路径高亮功能测试
  - 验证路径匹配时的高亮位置计算
  - 测试 `pathRanges` 字段的正确性
  - 需要在浏览器控制台运行

### 集成测试

- **test.js** - 综合测试和演示脚本
  - 测试书签管理器、搜索引擎、拼音工具、配置管理等所有模块
  - 提供性能测试功能
  - 需要在浏览器控制台运行，使用 `QuickerTest.runAllTests()`

## 运行测试

### Node.js 环境测试

部分独立的单元测试可以直接使用 Node.js 运行：

```bash
# 测试路径回退算法
node tests/test-navigate-up.js
```

### 浏览器环境测试

大部分测试需要在 Chrome 扩展的开发者工具中运行：

1. 在 Chrome 中打开扩展程序管理页面 `chrome://extensions/`
2. 点击 Quicker 扩展的 "检查视图: Service Worker"
3. 在控制台中运行测试脚本

**加载综合测试工具：**

```javascript
// 在 popup.html 中添加 script 标签引用 test.js
// 然后在控制台运行：
QuickerTest.runAllTests();         // 运行所有测试
QuickerTest.testSearchEngine();    // 测试搜索引擎
QuickerTest.performanceTest();     // 性能测试
```

## 测试规范

根据项目测试规范，每个功能模块应该：

1. **创建独立测试文件** - 包含多场景测试用例
2. **提供清晰的测试输出** - 显示通过/失败状态
3. **覆盖边界情况** - 包括空值、极值、异常输入等
4. **性能基准测试** - 验证搜索响应时间 < 200ms

## 贡献测试

在添加新功能或修复 Bug 时，请：

1. 在 `tests/` 目录创建对应的测试文件
2. 遵循 `test-功能名.js` 的命名规范
3. 包含详细的测试用例和断言
4. 在 PR 中说明如何运行测试

## 测试覆盖范围

- ✅ 路径回退算法 (navigateUp)
- ✅ 层级匹配算法 (matchHierarchy)
- ✅ 拼音匹配算法 (matchPinyin)
- ✅ 路径导航功能
- ✅ 路径高亮功能
- ✅ 书签管理模块
- ✅ 搜索引擎模块
- ✅ 配置管理模块

## 相关文档

- [项目 README](../README.md)
- [技术设计文档](../.qoder/quests/bookmark-shortcut-search-extension.md)
