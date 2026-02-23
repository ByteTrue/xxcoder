# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

xxcoder is a multi-model AI agent orchestration system for Claude Code. It routes tasks to specialized agents backed by different LLM backends (GPT, Gemini, Grok, GLM, etc.) via a Go bridge called `codeagent-wrapper`. Activation is manual via the `/xx` skill in a Claude Code session.

## Build & Development Commands

### Node.js CLI (`xxcoder`)

```bash
npm install              # install dependencies
npm i -g .               # install CLI globally from source
xxcoder init             # install agent templates to ~/.claude or ./.claude
xxcoder doctor           # verify backend CLIs are available
xxcoder uninstall        # remove installation
```

No test or lint commands exist for the Node.js side.

### Go bridge (`codeagent-wrapper/`)

All commands run from the `codeagent-wrapper/` directory:

```bash
make build               # build binary → ./codeagent-wrapper
make test                # run all Go tests (go test ./...)
make lint                # golangci-lint + staticcheck
make install             # install to $GOPATH/bin
make cross-build         # build for darwin/linux/windows × arm64/amd64
make clean               # remove build artifacts
```

Requires Go 1.21+. Lint toolchain pinned to go1.22.0.

## Architecture

### Two-tier system

```
User → Claude Code session → /xx skill → Sisyphus (orchestrator)
  → Specialized xx-* subagents (thin Claude Code proxies)
    → codeagent-wrapper (Go binary)
      → Backend CLIs (codex, claude, gemini, opencode)
```

### Node.js CLI (`bin/xx.mjs` → `src/`)

Installer only. Uses `cac` for CLI parsing, `inquirer` for prompts. Copies templates into `~/.claude/` or `./.claude/` and distributes pre-built wrapper binaries from `binaries/`.

- `src/commands/init.mjs` — install/overwrite templates and config
- `src/commands/doctor.mjs` — check backend CLI availability
- `src/commands/uninstall.mjs` — remove installation
- `src/utils/installer.mjs` — file copying, binary distribution

### Orchestration layer (`templates/`)

- `templates/skills/xx/SKILL.md` — **Sisyphus**: the orchestration brain. Classifies intent, routes to agents via a routing matrix, handles failure/escalation. This is the core coordination logic.
- `templates/agents/xx/*.md` — Seven Claude Code subagent definitions (frontmatter + markdown). All are thin proxies that invoke `codeagent-wrapper` with a role prompt and return results.
- `templates/prompts/*.md` — Role-specific system prompts passed to backend CLIs via the wrapper.
- `templates/config/models.json.example` — Agent→backend/model mapping, API keys, timeout config.
- `templates/hooks/pre-bash.py` — Safety hook blocking dangerous shell commands (fail-open).

### The seven agents

| Agent | Backend | Purpose |
|-------|---------|---------|
| xx-oracle | GPT-5.2 | Architecture consultation, code review, complex debugging |
| xx-developer | GPT-5.3-codex | Autonomous deep implementation |
| xx-explorer | opencode/kimi-k2.5 | Fast codebase search, pattern discovery |
| xx-librarian | opencode/kimi-k2.5 | Documentation search, GitHub exploration |
| xx-looker | Gemini-3-flash | Screenshot/diagram/PDF analysis |
| xx-planner | GPT-5.2 | Pre-planning, intent analysis |
| xx-reviewer | GPT-5.2 | Plan verification, solution review |

### Go bridge (`codeagent-wrapper/`)

Unified CLI interface to multiple AI backends. Key packages:

- `cmd/codeagent-wrapper/main.go` — entry point
- `internal/backend/` — backend implementations (claude, codex, gemini, opencode). Each clears environment vars to avoid session conflicts.
- `internal/executor/` — task execution, parallel config with dependency resolution, session management/resumption
- `internal/config/` — Viper-based config loading from `~/.codeagent/models.json`
- `internal/parser/` — input parsing (stdin auto-detection, `---TASK---`/`---CONTENT---` separators for parallel tasks)
- `internal/logger/` — zerolog structured logging
- `internal/worktree/` — git worktree management

### Wrapper invocation pattern (used by all agents)

```bash
WRAPPER="${CODEAGENT_WRAPPER:-$HOME/.claude/bin/codeagent-wrapper}"
"$WRAPPER" --agent <role> - "$PWD" <<'PROMPT'
{task}
PROMPT
```

### Failure handling

Sisyphus treats these as failures: non-zero exit, empty output, output that looks like a command template, `ROLE_EXECUTION_FAILED` marker. Retry policy: once per role, then escalate to user.

## Installed file locations

- Agent definitions: `~/.claude/agents/xx/*.md`
- Orchestration skill: `~/.claude/skills/xx/SKILL.md`
- Wrapper binary: `~/.claude/bin/codeagent-wrapper`
- Wrapper prompts: `~/.codeagent/agents/*.md`
- Config: `~/.codeagent/models.json`
- Hook: `~/.claude/hooks/pre-bash.py`

## Known issues

Nested Claude invocation: Claude CLI blocks `claude -p` when `CLAUDECODE=1` is set. Resolved by clearing session env vars in `codeagent-wrapper/internal/backend/claude.go` before spawning subprocesses. See `docs/known-issues.md`.
