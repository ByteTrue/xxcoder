# xxcoder - Claude Code 多模型 Agent 编排系统（V2 / Thin Proxy 架构）

## 归档信息

- source: `/home/z1j1e/.claude/plans/majestic-skipping-sunset.md`
- archived_to: `docs/majestic-skipping-sunset.md`
- archived_at: `2026-02-14`
- status: `active-baseline`

## Context

将 oh-my-opencode 的多模型编排能力迁移到 Claude Code，并复用 myclaude 的 codeagent-wrapper 能力。

参考项目（仅两个）：
- `myclaude/` — codeagent-wrapper、skill/hook/安装器实现参考
- `oh-my-opencode/` — agent 角色设计、路由信号、模型建议

## 核心架构决策（V2）

### 1) Sisyphus 在主会话
- 通过 `CLAUDE.md` + `/xx` skill 注入编排逻辑。
- 负责意图识别、路由、并行调度、结果汇总。

### 2) 所有 `xx-*` subagent 都是 Thin Proxy（关键）
- `templates/agents/xx/*.md` 不承载完整业务 prompt。
- subagent 仅负责：
  1. 调用 `codeagent-wrapper --agent <name>`
  2. 传递任务上下文
  3. 返回目标模型输出

### 3) 角色提示词放在 wrapper prompt
- 角色能力和行为约束由 `templates/prompts/*.md` 提供。
- 通过 `models.json` 的 `prompt_file` 绑定到 agent。

### 4) 模型/后端映射在 `models.json`
- 后端固定四类：`codex` / `claude` / `gemini` / `opencode`
- agent -> backend/model 的调度策略集中在 `templates/config/models.json.example`

## 工具差异适配（OMO → Claude Code）

适配重点分层：

- 编排层（`CLAUDE.md` + `SKILL.md`）
  - `task(...)` → `Task(...)`
  - `background_output(...)` → `TaskOutput(...)`
  - `background_cancel(...)` → `TaskStop(...)`

- 执行层（wrapper prompt）
  - 外部检索、库文档、只读分析等策略写入 `templates/prompts/*.md`
  - 不在 subagent 文件中直接实现复杂工具编排

> 注：V1 计划中“在每个 subagent 内做 1:1 OMO prompt 迁移”的描述，已被 Thin Proxy 架构替代。

## Agent 映射

| Agent | OMO 原名 | backend | model | 职责 |
|------|---------|---------|-------|------|
| xx-oracle | oracle | codex | gpt-5.2 | 架构咨询、复杂调试 |
| xx-developer | hephaestus | codex | gpt-5.3-codex | 深度实现 |
| xx-explorer | explore | opencode | grok-code-fast-1 | 代码搜索与模式发现 |
| xx-librarian | librarian | opencode | glm-4.7 | 文档与 OSS 检索 |
| xx-looker | multimodal-looker | gemini | gemini-3-flash | 图像/PDF 分析 |
| xx-planner | metis | claude | claude-opus-4-6 | 预规划、意图分析 |
| xx-reviewer | momus | codex | gpt-5.2 | 计划审查 |

## 实施计划（按当前仓库结构）

### Phase 1: CLI 安装器（已完成）

- `bin/xx.mjs` — CLI 入口
- `src/commands/init.mjs` — 安装
- `src/commands/uninstall.mjs` — 卸载
- `src/commands/doctor.mjs` — 环境检查
- `src/utils/installer.mjs` / `src/utils/uninstaller.mjs`

关键行为：
- `init` 默认覆盖安装（无重复安装确认）
- `CLAUDE.md` 直接整文件覆盖

### Phase 2: Thin Proxy Subagents（已完成）

- `templates/agents/xx/*.md`（7 个）
- 每个 agent 只通过 `Bash` 调用 wrapper 并回传结果

### Phase 3: 编排层（已完成）

- `templates/config/CLAUDE.md.example` — Sisyphus 主提示词
- `templates/skills/xx/SKILL.md` — `/xx` 路由规则与示例

### Phase 4: 模型配置 + wrapper prompts（已完成）

- `templates/config/models.json.example`
- `templates/prompts/*.md`（7 个角色提示词）

### Phase 5: Hook + Binary + Doctor（已完成）

- `templates/hooks/pre-bash.py`
- `binaries/codeagent-wrapper-*`
- `doctor` 检查 4 个后端 CLI + wrapper

## 验证清单（V2）

1. `npx xxcoder doctor` 可检查 codex/claude/gemini/opencode + wrapper
2. 手动任务验证：`/xx` 能委派并回收结果
3. subagent 输出中能看到 wrapper 调用链路
4. 后端路由验证：
   - `xx-oracle -> codex`
   - `xx-explorer -> opencode`
   - `xx-looker -> gemini`
5. 并行验证：`xx-explorer + xx-librarian` 使用 `run_in_background=true`
6. 重装验证：重复执行 `npx xxcoder init`，结果为覆盖安装
7. 卸载验证：兼容清理新格式和旧 marker 格式的 `CLAUDE.md`

## 与原计划的差异说明

1. `src/cli.ts` 改为 `bin/xx.mjs` 直连命令路由（实现已稳定）。
2. subagent 不做 OMO prompt 1:1 内嵌迁移，改为 Thin Proxy + wrapper prompt 分层。
3. 验证项中的 `xx-frontend` 修正为 `xx-looker`。
4. 安装行为从“检测重复后确认”改为“默认覆盖”。

## 后续维护建议

- 当模型策略变化时，仅更新：
  - `templates/config/models.json.example`
  - `templates/prompts/*.md`
- 避免在 `templates/agents/xx/*.md` 堆积角色逻辑，保持代理层稳定。
