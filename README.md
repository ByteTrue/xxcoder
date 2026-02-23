# xxcoder

Multi-model agent orchestration for Claude Code. Route tasks to GPT, Gemini, Grok, GLM and more via the included codeagent-wrapper.

## What is this?

xxcoder adds a team of specialized AI agents to your Claude Code session. Instead of doing everything with one model, Sisyphus (the orchestrator) delegates tasks to the best-fit agent:

| Agent | Model | Role |
|-------|-------|------|
| xx-oracle | GPT-5.2 | Architecture consultation, code review, complex debugging |
| xx-developer | GPT-5.3-codex | Autonomous deep implementation |
| xx-explorer | opencode/kimi-k2.5 | Fast codebase search, pattern discovery |
| xx-librarian | opencode/kimi-k2.5 | Documentation search, GitHub exploration |
| xx-looker | Gemini-3-flash | Screenshot/diagram/PDF analysis |
| xx-planner | GPT-5.2 | Pre-planning, intent analysis, requirement discovery |
| xx-reviewer | GPT-5.2 | Plan verification, solution review |

## ✨ New in v0.2.0

- **🎯 Interactive Installation Wizard** - Guided setup with module selection and backend configuration
- **🔧 Modular Agent Selection** - Choose only the agents you need
- **⚙️ Configuration Management** - New `xxcoder config` command suite
- **⚡ Performance Improvements** - 4x faster backend checks with parallel execution
- **📚 Comprehensive Documentation** - Complete usage guides and design docs

## Quick Start

### Installation

```bash
# Install globally
npm install -g .

# Or run directly
npx xxcoder
```

### Interactive Setup (Recommended)

```bash
# Launch interactive installation wizard
xxcoder init
```

The wizard will guide you through:

1. **Selecting installation location** (user directory / project directory / custom)
2. **Choosing agents to install** (select only what you need)
3. **Configuring backend API keys** (interactive, secure input)
4. **Verifying your setup** (automatic checks)

### Quick Install (Non-Interactive)

```bash
# Install all components to user directory
xxcoder init --user

# Install to project directory
xxcoder init --project
```

### Verify Installation

```bash
# Check backend CLI availability
xxcoder doctor

# Validate configuration
xxcoder config validate

# View current configuration
xxcoder config show
```

## Prerequisites

xxcoder requires backend CLIs to communicate with different model providers:

| Backend | Agents | Install |
|---------|--------|---------|
| [codex](https://github.com/openai/codex) | oracle, developer, planner, reviewer | `npm i -g @openai/codex` |
| [gemini](https://github.com/google-gemini/gemini-cli) | looker | `npm i -g @google/gemini-cli` |
| [opencode](https://github.com/opencode-ai/opencode) | explorer, librarian | `go install github.com/opencode-ai/opencode@latest` |

**Note**: You only need the backends for the agents you plan to use. The interactive installer will help you configure only what's needed.

## Configuration Management

### View Configuration

```bash
# Show all backends
xxcoder config show

# Show specific backend
xxcoder config show --backend codex
```

### Configure Backend

```bash
# Interactive configuration
xxcoder config setup --backend codex

# Edit configuration file directly
xxcoder config edit

# Validate configuration
xxcoder config validate

# Reset to defaults
xxcoder config reset
```

## Usage

1. **Install and configure**: `xxcoder init`
2. **Restart Claude Code** to load the new agents
3. **Activate orchestration**: Type `/xx` in any Claude Code session
4. **Start working**: Ask questions like "Help me refactor this code"

Sisyphus will automatically route your request to the best agent based on the task type.

## Documentation

- **[CLI Usage Guide](CLI_USAGE_GUIDE.md)** - Complete command reference and examples
- **[Interactive Install Design](INTERACTIVE_INSTALL_DESIGN.md)** - Design documentation for the installation wizard
- **[Optimization Summary](OPTIMIZATION_SUMMARY.md)** - Overview of recent improvements
- **[CLI Improvement Plan](CLI_IMPROVEMENT_PLAN.md)** - Roadmap and future enhancements

## Advanced Topics

### Rebuilding the Wrapper

If you're developing this repo and need to rebuild the wrapper manually (Go 1.21+ required):

```bash
cd codeagent-wrapper
make build
mkdir -p ~/.claude/bin
cp codeagent-wrapper ~/.claude/bin/
```

If `xxcoder doctor` reports `wrapper INVALID`, the packaged binary architecture is mismatched. Rebuild locally or replace binaries before reinstalling.

### OpenCode Model IDs

For OpenCode-backed agents, model IDs must use `provider/model` format. Check available IDs:

```bash
opencode models
```

Adjust `~/.codeagent/models.json` if needed.

### Manual Activation

xxcoder does not rely on a global `CLAUDE.md` prompt. Orchestration is activated manually via `/xx` in each session where you want it enabled.

## Troubleshooting

### Agent not working?

```bash
# 1. Check backend CLIs
xxcoder doctor

# 2. Validate configuration
xxcoder config validate

# 3. View configuration details
xxcoder config show

# 4. Reconfigure if needed
xxcoder config setup --backend <name>
```

### Configuration issues?

```bash
# Edit configuration file
xxcoder config edit

# Or reset to defaults
xxcoder config reset
```

### Need to reinstall?

```bash
# Uninstall first
xxcoder uninstall --user

# Then reinstall
xxcoder init
```

## How it works

```
User request
  → Claude Code session
    → manual `/xx` activation
    → xx orchestration skill (Sisyphus routing brain)
      → Task subagent (thin proxy agent)
      → codeagent-wrapper → backend CLI (oracle/developer/explorer/librarian/looker/planner/reviewer)
```

All 7 `xx-*` subagents are thin Claude Code proxies that call `codeagent-wrapper`, pass role + task prompts to the target backend/model, then return the backend output to the main session.

## Project structure

```
xxcoder/
├── bin/xx.mjs                  # CLI entry point
├── src/commands/               # init, doctor commands
├── codeagent-wrapper/          # Go source — bridge between Claude Code and backend CLIs
├── docs/                       # project planning/archive docs
├── templates/
│   ├── agents/xx/              # 7 Claude Code subagent definitions (.md with frontmatter)
│   ├── prompts/                # 7 codeagent-wrapper role prompts (minimal system prompts)
│   ├── config/                 # models.json.example
│   ├── hooks/                  # pre-bash.py (dangerous command blocker)
│   └── skills/xx/SKILL.md      # Sisyphus orchestration brain
```

`agents/xx/*.md` — Full agent definitions used when invoked as Claude Code Task subagents (with frontmatter: model, tools, maxTurns).

`prompts/*.md` — Minimal role prompts passed to target models when invoked via codeagent-wrapper.

## License

MIT
