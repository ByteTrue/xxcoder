# xxcoder CLI 优化改进计划

## 综合分析总结

基于三个专业团队的深度分析，xxcoder CLI 在基础功能上表现良好，但在用户体验、代码质量和功能完整性方面存在显著改进空间。

### 整体评分
- **UX/UI**: 7/10 - 交互流程清晰，但语言不一致、错误提示不够友好
- **代码质量**: 6.5/10 - 模块化良好，但存在代码重复和错误处理不足
- **功能完整性**: 5.7/10 - 核心安装功能完善，但配置管理和维护工具缺失

---

## 优先级改进计划

### P0 - 立即修复（阻塞性问题）

#### 1. 统一语言（中英混杂问题）
**问题**: interactive.mjs 使用中文，其他文件使用英文
**影响**: 用户体验混乱
**方案**:
- 将 interactive.mjs 改为英文
- 或添加语言检测机制（基于 LANG 环境变量）

#### 2. 消除代码重复
**问题**: `detectExecutableFormat()` 和 `expectedExecutableFormat()` 在 installer.mjs 和 doctor.mjs 中完全重复
**影响**: 维护困难，容易产生不一致
**方案**: 创建 `src/utils/binary.mjs` 统一管理

#### 3. 修复配置读取错误处理
**问题**: `readModelsConfig()` 静默吞噬所有错误，无法区分"文件不存在"和"JSON 解析失败"
**影响**: 用户无法诊断配置文件损坏
**方案**: 区分错误类型，提供明确的错误消息

#### 4. 添加配置验证命令
**问题**: 用户手动编辑 JSON 容易出错，无验证工具
**影响**: 配置错误只能在运行时发现
**方案**: 实现 `xxcoder config validate` 命令

---

### P1 - 短期改进（用户体验提升）

#### 5. 改进进度指示
**问题**: init 安装时用户不知道总共有多少步，当前进度如何
**方案**: 显示 `[1/7] Installing subagent definitions...`

#### 6. 增强错误消息
**问题**: 错误消息过于技术化，缺少可操作建议
**方案**:
- 添加错误代码
- 提供修复建议
- 简化技术术语

#### 7. 实现配置管理套件
**功能**:
- `xxcoder config show` - 显示当前配置（脱敏）
- `xxcoder config set <key> <value>` - 交互式设置
- `xxcoder config edit` - 在编辑器中打开
- `xxcoder config reset` - 重置为默认

#### 8. 添加日志查看功能
**功能**: `xxcoder logs [--follow]` - 查看 wrapper 日志
**影响**: 极大改善问题排查体验

#### 9. 并行化 doctor 检查
**问题**: 串行检查 4 个后端，总耗时可达 20 秒
**方案**: 使用 `Promise.all()` 并行执行

---

### P2 - 中期完善（功能增强）

#### 10. Agent 管理功能
- `xxcoder agents list` - 列出所有 agents
- `xxcoder agents info <name>` - 显示详细信息
- `xxcoder agents enable/disable <name>` - 启用/禁用

#### 11. 更新机制
- `xxcoder update` - 更新到最新版本
- `xxcoder version --check` - 检查新版本
- 配置文件迁移工具

#### 12. 测试命令
- `xxcoder test <agent>` - 测试特定 agent
- `xxcoder test --all` - 测试所有 agents
- 端到端验证

#### 13. Wrapper 管理
- `xxcoder wrapper version` - 显示版本
- `xxcoder wrapper update` - 单独更新
- `xxcoder wrapper test <backend>` - 测试连接

---

### P3 - 长期优化（锦上添花）

#### 14. 交互式向导
- `xxcoder guide` - 新手引导
- `xxcoder examples` - 常见用例
- `xxcoder troubleshoot` - 自动诊断

#### 15. 性能工具
- `xxcoder benchmark` - 性能测试
- 详细的性能分析报告

---

## 代码重构建议

### 1. 创建共享工具模块

#### `src/utils/binary.mjs`
```javascript
export function detectExecutableFormat(filePath) { /* ... */ }
export function expectedExecutableFormat(platform) { /* ... */ }
export function assertBinaryFormatForPlatform(filePath, platform) { /* ... */ }
```

#### `src/utils/config.mjs`
```javascript
export const PATHS = {
  userClaudeDir: () => join(homedir(), ".claude"),
  projectClaudeDir: () => join(process.cwd(), ".claude"),
  codeagentDir: () => join(homedir(), ".codeagent"),
  modelsConfig: () => join(homedir(), ".codeagent", "models.json"),
  wrapperBinary: () => join(homedir(), ".claude", "bin",
    process.platform === "win32" ? "codeagent-wrapper.exe" : "codeagent-wrapper"),
}
```

#### `src/utils/runner.mjs`
```javascript
export async function runStep(label, fn, { failFast = false } = {}) {
  const spinner = ora(label).start()
  try {
    const result = await fn()
    spinner.succeed()
    return { ...result, ok: true, label }
  } catch (err) {
    spinner.fail(ansis.red(`${label} — ${err.message}`))
    if (failFast) throw err
    return { copied: 0, skipped: 0, ok: false, label, error: err.message }
  }
}
```

### 2. 错误处理标准化

```javascript
class XxcoderError extends Error {
  constructor(code, message, suggestion) {
    super(message)
    this.code = code
    this.suggestion = suggestion
  }
}

// 使用示例
throw new XxcoderError(
  'CONFIG_INVALID',
  'models.json syntax error at line 15',
  'Run: xxcoder config validate --fix'
)
```

### 3. 路径显示优化

```javascript
function formatPath(path) {
  return path.replace(homedir(), '~')
}
```

---

## 实施路线图

### 第一阶段（1 周）- 修复关键问题
- [ ] 统一语言（英文）
- [ ] 提取共享二进制工具模块
- [ ] 修复配置读取错误处理
- [ ] 添加二进制检测错误处理
- [ ] 并行化 doctor 检查

### 第二阶段（1-2 周）- 用户体验提升
- [ ] 改进进度指示
- [ ] 增强错误消息（错误代码 + 建议）
- [ ] 实现 `config validate` 命令
- [ ] 实现 `logs` 命令
- [ ] 改进路径显示（使用 `~`）

### 第三阶段（2-3 周）- 功能完善
- [ ] 完整的 `config` 子命令套件
- [ ] `agents list/info` 命令
- [ ] `update` 命令和版本检查
- [ ] 统一错误处理模式

### 第四阶段（1-2 月）- 高级功能
- [ ] `test` 命令
- [ ] `wrapper` 子命令
- [ ] 交互式向导
- [ ] 性能工具

---

## 关键文件清单

### 需要修改的文件
- `bin/xx.mjs` - CLI 入口
- `src/commands/init.mjs` - 安装命令
- `src/commands/doctor.mjs` - 检查命令
- `src/commands/interactive.mjs` - 交互菜单（语言统一）
- `src/utils/installer.mjs` - 安装工具

### 需要创建的文件
- `src/utils/binary.mjs` - 二进制工具（新建）
- `src/utils/config.mjs` - 配置管理（新建）
- `src/utils/runner.mjs` - 任务执行器（新建）
- `src/utils/errors.mjs` - 错误类（新建）
- `src/commands/config.mjs` - 配置命令（新建）
- `src/commands/logs.mjs` - 日志命令（新建）
- `src/commands/agents.mjs` - Agent 管理（新建）

---

## 成功指标

### 用户体验
- ✅ 语言统一（无中英混杂）
- ✅ 错误消息清晰（包含建议）
- ✅ 进度可见（显示步骤数）
- ✅ 配置简单（交互式设置）

### 代码质量
- ✅ 无代码重复
- ✅ 错误处理完善
- ✅ 模块化清晰
- ✅ 测试覆盖（未来）

### 功能完整性
- ✅ 配置管理完善
- ✅ 日志查看可用
- ✅ 更新机制就绪
- ✅ 测试工具完备

---

## 下一步行动

1. **立即开始**: P0 优先级项目（关键修复）
2. **并行实施**: 可以同时进行的改进项
3. **迭代发布**: 每个阶段完成后发布新版本
4. **收集反馈**: 从用户反馈中调整优先级
