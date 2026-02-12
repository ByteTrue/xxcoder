# xxcoder

Multi-model agent orchestration for Claude Code. Route tasks to GPT, Gemini, Grok, GLM and more via [codeagent-wrapper](https://github.com/ByteTrue/codeagent-wrapper).

## What is this?

xxcoder adds a team of specialized AI agents to your Claude Code session. Instead of doing everything with one model, Sisyphus (the orchestrator) delegates tasks to the best-fit agent:

| Agent | Model | Role |
|-------|-------|------|
| xx-oracle | GPT-5.2 | Architecture consultation, code review, complex debugging |
| xx-developer | GPT-5.3-codex | Autonomous deep implementation |
| xx-explorer | Grok-code-fast-1 | Fast codebase search, pattern discovery |
| xx-librarian | GLM-4.7 | Documentation search, GitHub exploration |
| xx-looker | Gemini-3-flash | Screenshot/diagram/PDF analysis |
| xx-planner | Claude Opus 4.6 | Pre-planning, intent analysis, requirement discovery |
| xx-reviewer | GPT-5.2 | Plan verification, solution review |

## Prerequisites

xxcoder requires backend CLIs to communicate with different model providers:

| Backend | Agents | Install |
|---------|--------|---------|
| [codex](https://github.com/openai/codex) | oracle, developer | `npm i -g @openai/codex` |
| [claude](https://github.com/anthropics/claude-code) | planner | `npm i -g @anthropic-ai/claude-code` |
| [gemini](https://github.com/google-gemini/gemini-cli) | looker | `npm i -g @anthropic-ai/claude-code` |
| [opencode](https://github.com/opencode-ai/opencode) | explorer, librarian | `go install github.com/opencode-ai/opencode@latest` |

You also need **codeagent-wrapper** — the bridge between Claude Code and backend CLIs. See [codeagent-wrapper](https://github.com/ByteTrue/codeagent-wrapper) for installation.

You only need the backends for the agents you plan to use. Run `npx xxcoder doctor` to check availability.

## Install

```bash
npx xxcoder init
```

This copies agent definitions, skills, hooks, and config templates to `~/.claude/` and `~/.codeagent/`.

## Setup

1. **Check backends**: `npx xxcoder doctor`
2. **Configure models**: Copy `~/.codeagent/models.json.example` to `~/.codeagent/models.json` and fill in your API keys
3. **Enable Sisyphus**: Merge `~/.claude/CLAUDE.md.example` into your project's `CLAUDE.md` (or use it as `~/.claude/CLAUDE.md` for global use)
4. **Use it**: Start Claude Code and invoke `/xx` to activate the orchestration skill

## How it works

```
User request
  → Claude Code (Sisyphus orchestrator)
    → /xx skill (routing signals)
      → Task subagent (explorer, librarian, looker, planner, reviewer)
      → codeagent-wrapper → backend CLI (oracle, developer)
```

Lightweight read-only agents (explorer, librarian, looker, planner, reviewer) run as Claude Code subagents. Heavy implementation agents (oracle, developer) route through codeagent-wrapper to dedicated models.

## Project structure

```
xxcoder/
├── bin/xx.mjs                  # CLI entry point
├── src/commands/               # init, doctor commands
├── templates/
│   ├── agents/xx/              # 7 Claude Code subagent definitions (.md with frontmatter)
│   ├── prompts/                # 7 codeagent-wrapper role prompts (minimal system prompts)
│   ├── config/                 # CLAUDE.md.example, models.json.example
│   ├── hooks/                  # pre-bash.py (dangerous command blocker)
│   └── skills/xx/SKILL.md      # Orchestration skill with routing signals
```

`agents/xx/*.md` — Full agent definitions used when invoked as Claude Code Task subagents (with frontmatter: model, tools, maxTurns).

`prompts/*.md` — Minimal role prompts passed to target models when invoked via codeagent-wrapper.

## License

MIT
