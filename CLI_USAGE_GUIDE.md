# xxcoder CLI 使用指南

## 快速开始

### 安装

```bash
# 全局安装
npm install -g .

# 或本地运行
npx xxcoder
```

### 首次使用

```bash
# 启动交互式安装向导
xxcoder init

# 或快速安装到用户目录
xxcoder init --user
```

---

## 命令参考

### `xxcoder` (无参数)

启动交互式菜单，提供以下选项：
- Install xxcoder
- Uninstall xxcoder
- Environment check (doctor)
- Exit

### `xxcoder init`

交互式安装向导，引导你完成：
1. 选择安装位置
2. 选择要安装的 agents
3. 配置后端 API keys
4. 验证安装

**选项**:
- `--user` - 非交互式安装到 `~/.claude`（全部组件）
- `--project` - 非交互式安装到 `./.claude`（全部组件）
- `--install-dir <path>` - 安装到自定义路径

**示例**:
```bash
# 交互式安装（推荐）
xxcoder init

# 快速安装到用户目录
xxcoder init --user

# 安装到项目目录
xxcoder init --project

# 自定义路径
xxcoder init --install-dir /path/to/install
```

---

### `xxcoder doctor`

检查后端 CLI 和 wrapper 的可用性。

**输出示例**:
```
xxcoder doctor - Backend CLI availability check

  ✓ codex      OK  codex-cli 0.104.0
  ✓ claude     OK  2.1.50 (Claude Code)
  ✓ gemini     OK  0.29.5
  ✗ opencode   MISSING  (OpenCode CLI)
  ✓ wrapper    OK  codeagent-wrapper

  Summary:
  ✓ codex      available
  ✓ claude     available
  ✓ gemini     available
  ✗ opencode   missing
  ✓ wrapper    available
```

---

### `xxcoder config`

管理后端配置。

#### `xxcoder config show`

显示当前配置（API keys 已脱敏）。

**示例**:
```bash
# 显示所有后端配置
xxcoder config show

# 显示特定后端配置
xxcoder config show --backend codex
```

**输出示例**:
```
Current Configuration:

Default backend: codex

Codex (OpenAI):
  API Key:  ✓ Configured (sk-proj-...)
  Model:    gpt-5.3-codex
  Timeout:  300s

Gemini (Google):
  API Key:  ✗ Not configured
  Model:    gemini-3-flash
  Timeout:  300s
```

#### `xxcoder config setup --backend <name>`

交互式配置特定后端。

**示例**:
```bash
# 配置 codex 后端
xxcoder config setup --backend codex

# 配置 opencode 后端
xxcoder config setup --backend opencode
```

**交互流程**:
1. 检查 CLI 是否安装
2. 配置或更新 API key
3. 选择模型
4. 保存配置

#### `xxcoder config validate`

验证配置文件的结构和完整性。

**示例**:
```bash
xxcoder config validate
```

**输出示例**:
```
Validating configuration...

✓ Configuration file exists
✓ Valid JSON format
✓ Configuration structure is valid
✓ 4 backend(s) configured
```

或发现问题时：
```
Validating configuration...

✓ Configuration file exists
✓ Valid JSON format
⚠ Found 2 issue(s):
  • Backend "codex": API key not configured
  • Backend "opencode": missing model
```

#### `xxcoder config edit`

在默认编辑器中打开配置文件。

**示例**:
```bash
xxcoder config edit
```

使用 `$EDITOR` 或 `$VISUAL` 环境变量指定的编辑器，默认为 `nano`。

#### `xxcoder config reset`

重置配置为默认值（需要确认）。

**示例**:
```bash
xxcoder config reset
```

**警告**: 这将删除所有 API keys 和自定义设置。

---

### `xxcoder uninstall`

卸载 xxcoder 文件。

**选项**:
- `--user` - 从 `~/.claude` 卸载
- `--project` - 从 `./.claude` 卸载
- `--force` - 跳过确认提示

**示例**:
```bash
# 交互式卸载（选择位置）
xxcoder uninstall

# 从用户目录卸载
xxcoder uninstall --user

# 强制卸载（无确认）
xxcoder uninstall --user --force
```

---

## 配置文件

### 位置

- **配置文件**: `~/.codeagent/models.json`
- **Agent 定义**: `~/.claude/agents/xx/` 或 `./.claude/agents/xx/`
- **Wrapper binary**: `~/.claude/bin/codeagent-wrapper`

### 配置文件格式

`~/.codeagent/models.json`:

```json
{
  "default_backend": "codex",
  "backends": {
    "codex": {
      "api_key": "sk-proj-...",
      "model": "gpt-5.3-codex",
      "timeout": 300
    },
    "claude": {
      "api_key": "sk-ant-...",
      "model": "claude-opus-4-6",
      "timeout": 300
    },
    "gemini": {
      "api_key": "AIza...",
      "model": "gemini-3-flash",
      "timeout": 300
    },
    "opencode": {
      "api_key": "",
      "model": "opencode/kimi-k2.5-free",
      "timeout": 300
    }
  }
}
```

---

## 工作流示例

### 场景 1: 首次安装

```bash
# 1. 运行交互式安装
xxcoder init

# 2. 选择安装位置（例如：User directory）
# 3. 选择要安装的 agents（例如：Oracle, Developer, Explorer）
# 4. 配置后端（输入 API keys）
# 5. 完成安装

# 6. 验证安装
xxcoder doctor

# 7. 重启 Claude Code

# 8. 在 Claude Code 会话中输入 /xx 激活
```

### 场景 2: 添加新后端

```bash
# 1. 安装后端 CLI（如果需要）
go install github.com/opencode-ai/opencode@latest

# 2. 配置后端
xxcoder config setup --backend opencode

# 3. 验证配置
xxcoder config validate

# 4. 测试后端
xxcoder doctor
```

### 场景 3: 更新 API key

```bash
# 1. 配置特定后端
xxcoder config setup --backend codex

# 2. 选择更新 API key
# 3. 输入新的 API key

# 4. 验证
xxcoder config show --backend codex
```

### 场景 4: 故障排查

```bash
# 1. 检查后端状态
xxcoder doctor

# 2. 验证配置
xxcoder config validate

# 3. 查看配置详情
xxcoder config show

# 4. 如果需要，重新配置
xxcoder config setup --backend <name>

# 5. 或重置配置
xxcoder config reset
```

---

## 环境变量

- `EDITOR` / `VISUAL` - 用于 `xxcoder config edit` 的编辑器
- `CODEAGENT_WRAPPER` - 自定义 wrapper binary 路径（默认：`~/.claude/bin/codeagent-wrapper`）

---

## 后端 CLI 安装

### Codex (OpenAI)

```bash
npm install -g @openai/codex-cli
```

获取 API key: https://platform.openai.com/api-keys

### Claude

```bash
npm install -g @anthropic-ai/claude-cli
```

获取 API key: https://console.anthropic.com/settings/keys

### Gemini (Google)

```bash
npm install -g @google/gemini-cli
```

获取 API key: https://makersuite.google.com/app/apikey

### OpenCode

```bash
go install github.com/opencode-ai/opencode@latest
```

获取 API key: https://opencode.ai/api-keys

---

## 常见问题

### Q: 如何查看已安装的 agents？

A: 查看 `~/.claude/agents/xx/` 目录：
```bash
ls ~/.claude/agents/xx/
```

### Q: 如何只安装特定的 agents？

A: 使用交互式安装：
```bash
xxcoder init
# 在模块选择界面，只勾选需要的 agents
```

### Q: 配置文件在哪里？

A: `~/.codeagent/models.json`

查看：
```bash
xxcoder config show
```

编辑：
```bash
xxcoder config edit
```

### Q: 如何更新 xxcoder？

A: 重新安装：
```bash
npm install -g .
xxcoder init --user  # 覆盖安装
```

### Q: 如何完全卸载？

A:
```bash
# 1. 卸载文件
xxcoder uninstall --user --force

# 2. 删除配置
rm -rf ~/.codeagent

# 3. 卸载 CLI
npm uninstall -g xxcoder
```

### Q: Agent 无法工作怎么办？

A: 按顺序检查：
```bash
# 1. 检查后端 CLI
xxcoder doctor

# 2. 验证配置
xxcoder config validate

# 3. 查看配置详情
xxcoder config show

# 4. 重新配置后端
xxcoder config setup --backend <name>
```

### Q: 如何在多个项目中使用不同配置？

A: 使用项目级安装：
```bash
cd /path/to/project1
xxcoder init --project  # 安装到 ./.claude

cd /path/to/project2
xxcoder init --project  # 安装到 ./.claude
```

每个项目可以有独立的 agent 配置，但共享 `~/.codeagent/models.json` 中的后端配置。

---

## 高级用法

### 自定义 Wrapper 路径

```bash
export CODEAGENT_WRAPPER=/custom/path/to/wrapper
xxcoder doctor
```

### 批量配置

编辑配置文件：
```bash
xxcoder config edit
```

或直接编辑：
```bash
nano ~/.codeagent/models.json
```

验证修改：
```bash
xxcoder config validate
```

### 脚本化安装

```bash
#!/bin/bash
# 自动化安装脚本

# 安装到用户目录
xxcoder init --user

# 配置后端（需要交互）
# xxcoder config setup --backend codex

# 验证
xxcoder doctor
xxcoder config validate
```

---

## 获取帮助

```bash
# 查看所有命令
xxcoder --help

# 查看特定命令帮助
xxcoder init --help
xxcoder config --help
xxcoder doctor --help
xxcoder uninstall --help

# 查看版本
xxcoder --version
```

---

## 反馈和支持

- GitHub Issues: https://github.com/ByteTrue/xxcoder/issues
- 文档: 查看项目根目录的 Markdown 文件
  - `INTERACTIVE_INSTALL_DESIGN.md` - 交互式安装设计
  - `CLI_IMPROVEMENT_PLAN.md` - CLI 改进计划
  - `OPTIMIZATION_SUMMARY.md` - 优化总结

---

## 更新日志

### v0.2.0 (最新)

**新功能**:
- ✨ 交互式安装向导
- ✨ 模块化 agent 选择
- ✨ 后端配置向导
- ✨ `xxcoder config` 命令套件
- ✨ 最终验证和清晰的后续步骤

**改进**:
- ⚡ Doctor 命令并行化（4倍性能提升）
- 🐛 修复配置错误处理
- 🎨 统一语言（英文）
- 📝 添加进度指示器
- 🔧 消除代码重复

**文档**:
- 📚 完整的使用指南
- 📚 交互式安装设计文档
- 📚 CLI 改进计划

### v0.1.0

- 🎉 初始版本
- 基础安装/卸载功能
- Doctor 命令
- 7 个 agents 支持
