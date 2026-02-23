# xxcoder 本地测试指南

## 🎯 快速开始

### 1. 确认环境

```bash
# 检查 xxcoder 是否已链接
which xxcoder
# 输出: /Users/byte/.nvm/versions/node/v24.13.1/bin/xxcoder

# 检查版本
xxcoder --version
# 输出: xxcoder/0.1.0 darwin-arm64 node-v24.13.1
```

### 2. 快速测试（2分钟）

```bash
# 查看帮助
xxcoder --help

# 检查后端（并行，约5秒）
xxcoder doctor

# 查看配置
xxcoder config show
```

### 3. 完整测试（10分钟）

```bash
# 启动交互式安装向导
xxcoder init
```

---

## 📋 测试命令速查表

### 非交互式命令（可自动化）

| 命令 | 说明 | 预期时间 |
|------|------|----------|
| `xxcoder --version` | 显示版本信息 | <1s |
| `xxcoder --help` | 显示帮助信息 | <1s |
| `xxcoder doctor` | 检查后端状态（并行） | ~5s |
| `xxcoder config show` | 显示所有配置 | <1s |
| `xxcoder config show --backend codex` | 显示特定后端 | <1s |
| `xxcoder config validate` | 验证配置文件 | <1s |
| `xxcoder init --user` | 快速安装到用户目录 | ~10s |
| `xxcoder init --project` | 快速安装到项目目录 | ~10s |

### 交互式命令（需要手动操作）

| 命令 | 说明 | 交互步骤 |
|------|------|----------|
| `xxcoder` | 交互式菜单 | 选择操作 |
| `xxcoder init` | 交互式安装向导 | 7个步骤 |
| `xxcoder config setup --backend <name>` | 配置后端 | 3-4个步骤 |
| `xxcoder config edit` | 编辑配置文件 | 打开编辑器 |
| `xxcoder config reset` | 重置配置 | 需要确认 |
| `xxcoder uninstall` | 卸载 | 选择位置 |

---

## 🧪 详细测试步骤

### 测试 1: 基础命令

```bash
# 1.1 版本信息
xxcoder --version
# ✓ 应显示: xxcoder/0.1.0 darwin-arm64 node-v24.13.1

# 1.2 帮助信息
xxcoder --help
# ✓ 应显示: 4个命令 (init, doctor, uninstall, config)

# 1.3 子命令帮助
xxcoder init --help
xxcoder config --help
xxcoder doctor --help
xxcoder uninstall --help
```

### 测试 2: Doctor 命令（性能测试）

```bash
# 2.1 运行 doctor（测试并行化）
time xxcoder doctor

# ✓ 预期结果:
# - 显示 5 个检查项（codex, claude, gemini, opencode, wrapper）
# - 并行执行，总时间约 5 秒
# - 显示每个后端的状态（OK/MISSING）
# - 显示汇总信息

# 2.2 验证输出格式
xxcoder doctor 2>&1 | grep "✔"
# ✓ 应显示可用的后端（带 ✔ 标记）

xxcoder doctor 2>&1 | grep "✖"
# ✓ 应显示缺失的后端（带 ✖ 标记）
```

### 测试 3: 配置管理

```bash
# 3.1 显示配置
xxcoder config show
# ✓ 应显示:
# - Default backend: codex
# - 4 个后端的配置（codex, claude, gemini, opencode）
# - API keys 状态（✓ Configured 或 ✗ Not configured）
# - 模型和超时设置

# 3.2 显示特定后端
xxcoder config show --backend codex
# ✓ 只显示 codex 的配置

# 3.3 验证配置
xxcoder config validate
# ✓ 应显示:
# - ✓ Configuration file exists
# - ✓ Valid JSON format
# - ⚠ 配置问题列表（如果有）

# 3.4 查看配置文件
cat ~/.codeagent/models.json
# ✓ 应该是有效的 JSON 格式
```

### 测试 4: 交互式安装（手动测试）

```bash
# 4.1 启动交互式安装
xxcoder init

# 预期流程:
# ┌─────────────────────────────────────────┐
# │ Step 1: 欢迎界面                         │
# ├─────────────────────────────────────────┤
# │ ╔══════════════════════════════════════╗│
# │ ║  xxcoder - Multi-Model Orchestration ║│
# │ ╚══════════════════════════════════════╝│
# │                                          │
# │ Welcome to xxcoder installer!            │
# │                                          │
# │ This wizard will guide you through:     │
# │   • Selecting installation location     │
# │   • Choosing which agents to install    │
# │   • Configuring backend API keys        │
# │   • Verifying your setup                │
# │                                          │
# │ ? Ready to begin? (Y/n)                 │
# └─────────────────────────────────────────┘

# ✓ 输入 Y 继续

# ┌─────────────────────────────────────────┐
# │ Step 2: 选择安装位置                     │
# ├─────────────────────────────────────────┤
# │ ? Where would you like to install?      │
# │   ❯ User directory (~/.claude)          │
# │     Project directory (./.claude)       │
# │     Custom path...                      │
# └─────────────────────────────────────────┘

# ✓ 选择一个位置（建议选 Project directory 测试）

# ┌─────────────────────────────────────────┐
# │ Step 3: 选择 Agents                      │
# ├─────────────────────────────────────────┤
# │ ? Which components would you like?      │
# │                                          │
# │ Core Components (required):             │
# │   ✓ Sisyphus orchestrator               │
# │   ✓ Wrapper binary                      │
# │   ✓ Configuration files                 │
# │                                          │
# │ Agent Modules:                          │
# │   ◉ Oracle (GPT-5.2)                    │
# │   ◉ Developer (GPT-5.3-codex)           │
# │   ◉ Explorer (kimi-k2.5)                │
# │   ◉ Librarian (kimi-k2.5)               │
# │   ◉ Looker (Gemini-3-flash)             │
# │   ◯ Planner (GPT-5.2)                   │
# │   ◯ Reviewer (GPT-5.2)                  │
# │                                          │
# │ Additional Components:                  │
# │   ◉ Pre-bash Safety Hook                │
# └─────────────────────────────────────────┘

# ✓ 用空格键选择/取消，Enter 确认
# ✓ 建议测试: 只选 Oracle + Developer（轻量级安装）

# ┌─────────────────────────────────────────┐
# │ Step 4: 安装进度                         │
# ├─────────────────────────────────────────┤
# │ Installing to ./.claude                 │
# │ Installing (6 steps)...                 │
# │                                          │
# │ [1/6] ✓ Installing Sisyphus             │
# │ [2/6] ✓ Installing selected agents      │
# │ [3/6] ✓ Installing wrapper binary       │
# │ [4/6] ✓ Installing configuration        │
# │ [5/6] ✓ Installing wrapper prompts      │
# │ [6/6] ✓ Installing pre-bash hook        │
# │                                          │
# │   Installation complete!                │
# │   Files:   10 installed                 │
# └─────────────────────────────────────────┘

# ✓ 检查进度指示器是否显示
# ✓ 检查每个步骤是否有 ✓ 标记

# ┌─────────────────────────────────────────┐
# │ Step 5: 后端配置                         │
# ├─────────────────────────────────────────┤
# │ Now let's configure your backends.      │
# │                                          │
# │ Based on your selected agents, you need:│
# │   • Codex (OpenAI) (for Oracle, Dev)   │
# │                                          │
# │ ? Configure backends now? (Y/n)         │
# └─────────────────────────────────────────┘

# ✓ 输入 Y 继续配置，或 n 跳过

# 如果选择配置:
# ┌─────────────────────────────────────────┐
# │ ━━━ Configuring: Codex (OpenAI) ━━━    │
# │                                          │
# │ ✓ Codex (OpenAI) CLI found              │
# │                                          │
# │ ? Do you have an API key? (Y/n)         │
# │ ? Enter your API key: ********          │
# │   ✓ API key saved                       │
# │                                          │
# │ ? Which model would you like to use?    │
# │   ❯ gpt-5.3-codex (recommended)         │
# │     gpt-5.2                             │
# │     gpt-4o                              │
# │     Custom model ID...                  │
# │                                          │
# │   ✓ Configuration saved                 │
# └─────────────────────────────────────────┘

# ✓ 检查 API key 输入是否隐藏（显示 ****）
# ✓ 检查推荐模型是否标记

# ┌─────────────────────────────────────────┐
# │ Step 6: 最终验证                         │
# ├─────────────────────────────────────────┤
# │ Running final checks...                 │
# │                                          │
# │   ✓ Installation directory: ./.claude   │
# │   ✓ Agents installed: 2                 │
# │   ✓ Wrapper binary: OK                  │
# │   ✓ Configured backends: 1/1            │
# │                                          │
# │ 🎉 Installation complete!               │
# │                                          │
# │ What's next?                            │
# │   1. Restart Claude Code                │
# │   2. Type: /xx                          │
# │   3. Try: "Help me refactor this code"  │
# │                                          │
# │ ? Press Enter to exit...                │
# └─────────────────────────────────────────┘

# ✓ 检查验证结果是否正确
# ✓ 检查后续步骤是否清晰
```

### 测试 5: 验证安装结果

```bash
# 5.1 检查安装的文件
ls -la ./.claude/agents/xx/
# ✓ 应该只有选择的 agents（如 xx-oracle.md, xx-developer.md）

ls -la ./.claude/skills/xx/
# ✓ 应该有 SKILL.md（Sisyphus orchestrator）

ls -la ./.claude/bin/
# ✓ 应该有 codeagent-wrapper

# 5.2 检查配置文件
cat ~/.codeagent/models.json
# ✓ 应该包含配置的后端信息

# 5.3 验证配置
xxcoder config validate
# ✓ 应该显示配置有效或列出问题

# 5.4 再次运行 doctor
xxcoder doctor
# ✓ 应该显示 wrapper OK
```

### 测试 6: 配置管理（交互式）

```bash
# 6.1 配置特定后端
xxcoder config setup --backend codex

# 预期流程:
# ━━━ Configuring: Codex (OpenAI) ━━━
# 
# ✓ Codex (OpenAI) CLI found
# 
# Current API key: sk-proj-...
# 
# ? Update API key? (Y/n)
# ? Enter your API key: ********
#   ✓ API key saved
# 
# ? Update model? (current: gpt-5.3-codex) (Y/n)
# ? Which model would you like to use?
#   ❯ gpt-5.3-codex (recommended)
#     gpt-5.2
#     Custom model ID...
# 
#   ✓ Configuration saved
# 
# ✓ Configuration saved to ~/.codeagent/models.json

# ✓ 检查是否显示当前配置
# ✓ 检查 API key 是否脱敏显示
# ✓ 检查新 API key 输入是否隐藏

# 6.2 验证更新后的配置
xxcoder config show --backend codex
# ✓ 应该显示更新后的配置
```

### 测试 7: 交互式菜单

```bash
# 7.1 启动交互式菜单
xxcoder

# 预期显示:
# ╔══════════════════════════════════════════╗
# ║     xxcoder - Multi-Model Orchestration  ║
# ║     for Claude Code                      ║
# ╚══════════════════════════════════════════╝
# 
# ? Select an action:
#   ❯ Install xxcoder — Install agent templates and config
#     Uninstall xxcoder — Remove all xxcoder installed files
#     Environment check (doctor) — Verify backend CLIs
#     ─────────
#     Exit

# ✓ 检查菜单是否显示
# ✓ 检查所有选项是否为英文
# ✓ 选择 "Environment check" 测试
# ✓ 选择 "Exit" 退出
```

---

## ✅ 测试检查清单

### 基础功能
- [ ] `xxcoder --version` 显示正确版本
- [ ] `xxcoder --help` 显示所有命令
- [ ] 所有子命令的 `--help` 都能正常显示

### Doctor 命令
- [ ] 并行检查所有后端（约5秒）
- [ ] 正确显示每个后端的状态
- [ ] 显示安装命令（对于缺失的后端）
- [ ] 显示汇总信息

### 配置管理
- [ ] `config show` 显示所有后端配置
- [ ] `config show --backend <name>` 显示特定后端
- [ ] `config validate` 检测配置问题
- [ ] `config setup` 交互式配置工作正常
- [ ] API keys 在显示时已脱敏（sk-proj-...）

### 交互式安装
- [ ] 欢迎界面显示正确
- [ ] 可以选择安装位置
- [ ] 可以选择 agents（checkbox 多选）
- [ ] 显示进度指示器 `[1/7]`、`[2/7]` 等
- [ ] 后端配置向导工作正常
- [ ] API key 输入时隐藏（显示 ****）
- [ ] 最终验证显示正确
- [ ] 后续步骤清晰明确

### 用户体验
- [ ] 所有文本为英文（无中英混杂）
- [ ] 错误消息清晰且有建议
- [ ] 进度反馈及时
- [ ] 颜色和符号显示正确（✓ ✗ ◉ ◯）

### 性能
- [ ] doctor 命令约5秒完成
- [ ] 安装过程流畅，无明显卡顿
- [ ] 配置验证即时反馈

---

## 🐛 常见问题

### 问题 1: 命令找不到

```bash
# 症状
xxcoder: command not found

# 解决方案
npm link
which xxcoder  # 验证链接成功
```

### 问题 2: 交互式界面显示异常

```bash
# 症状
- 颜色不显示
- Unicode 字符显示为乱码
- 菜单选择不工作

# 解决方案
# 确保在真实终端中运行（不是通过脚本）
# 检查终端是否支持 UTF-8
echo $LANG  # 应该包含 UTF-8
```

### 问题 3: 安装失败

```bash
# 症状
安装过程中某个步骤失败

# 调试步骤
# 1. 查看详细错误信息
xxcoder init --user 2>&1 | tee install.log

# 2. 检查目录权限
ls -la ~/.claude
ls -la ~/.codeagent

# 3. 手动创建目录
mkdir -p ~/.claude/agents/xx
mkdir -p ~/.codeagent
```

### 问题 4: 配置文件损坏

```bash
# 症状
xxcoder config validate 报错

# 解决方案
# 1. 查看配置文件
cat ~/.codeagent/models.json

# 2. 验证 JSON 格式
cat ~/.codeagent/models.json | jq .

# 3. 重置配置
xxcoder config reset
```

---

## 🔄 开发迭代流程

### 修改代码后测试

```bash
# 1. 修改代码（例如 src/commands/init.mjs）

# 2. 直接测试（不需要重新 link）
xxcoder init

# 3. 如果有语法错误，会立即显示
```

### 调试技巧

```bash
# 1. 添加 console.log 调试
# 在代码中添加: console.log('Debug:', variable)

# 2. 运行命令查看输出
xxcoder init

# 3. 查看错误堆栈
xxcoder init 2>&1 | grep -A 10 "Error"
```

### 测试特定功能

```bash
# 测试配置管理
node -e "import('./src/commands/config.mjs').then(m => m.configShow())"

# 测试模块定义
node -e "import('./src/utils/modules.mjs').then(m => console.log(m.MODULES))"
```

---

## 📊 性能基准

### 预期性能指标

| 命令 | 预期时间 | 说明 |
|------|----------|------|
| `xxcoder --version` | <100ms | 即时响应 |
| `xxcoder --help` | <100ms | 即时响应 |
| `xxcoder doctor` | ~5s | 并行检查4个后端 |
| `xxcoder config show` | <100ms | 读取配置文件 |
| `xxcoder config validate` | <200ms | 验证 JSON |
| `xxcoder init --user` | ~10s | 安装所有组件 |

### 性能测试

```bash
# 测试 doctor 命令性能
time xxcoder doctor

# 预期输出:
# real    0m5.123s  # 总时间约5秒
# user    0m0.234s
# sys     0m0.089s

# 如果超过10秒，说明并行化可能有问题
```

---

## 🎯 推荐测试顺序

### 第一次测试（10分钟）

1. **基础命令** (2分钟)
   ```bash
   xxcoder --version
   xxcoder --help
   xxcoder doctor
   ```

2. **配置查看** (2分钟)
   ```bash
   xxcoder config show
   xxcoder config validate
   ```

3. **交互式安装** (5分钟)
   ```bash
   xxcoder init
   # 选择项目目录
   # 只选 Oracle + Developer
   # 跳过后端配置
   ```

4. **验证结果** (1分钟)
   ```bash
   ls -la ./.claude/agents/xx/
   xxcoder doctor
   ```

### 完整测试（30分钟）

1. **所有非交互式命令** (5分钟)
2. **交互式安装（完整流程）** (10分钟)
3. **配置管理测试** (5分钟)
4. **交互式菜单测试** (5分钟)
5. **卸载和重装测试** (5分钟)

---

## 📝 测试报告模板

```markdown
# xxcoder 测试报告

## 测试环境
- OS: macOS (darwin-arm64)
- Node: v24.13.1
- xxcoder: 0.1.0
- 测试日期: 2026-02-23

## 测试结果

### 基础功能
- [x] 版本显示正常
- [x] 帮助信息完整
- [x] Doctor 命令工作正常（5.2秒）

### 交互式安装
- [x] 欢迎界面显示正确
- [x] 模块选择工作正常
- [x] 进度指示器显示正确
- [x] 后端配置向导正常
- [x] API key 输入已隐藏
- [x] 最终验证正确

### 配置管理
- [x] config show 正常
- [x] config validate 正常
- [x] config setup 正常
- [x] API keys 已脱敏

### 性能
- [x] Doctor 命令: 5.2秒（符合预期）
- [x] 安装流程流畅
- [x] 配置验证即时

### 用户体验
- [x] 语言统一（英文）
- [x] 错误消息清晰
- [x] 进度反馈及时
- [x] 符号显示正确

## 发现的问题
无

## 建议
无

## 总体评价
✅ 所有功能正常，可以发布
```

---

## 🚀 开始测试

现在你可以开始测试了！建议按照以下步骤：

```bash
# 1. 快速验证（2分钟）
xxcoder --version
xxcoder doctor
xxcoder config show

# 2. 完整测试（10分钟）
xxcoder init
# 按照向导完成安装

# 3. 验证结果
xxcoder config validate
ls -la ./.claude/agents/xx/
```

祝测试顺利！如果遇到任何问题，请查看上面的"常见问题"部分。🎉
