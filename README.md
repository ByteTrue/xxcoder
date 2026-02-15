# xxcoder

Multi-model agent orchestration for Claude Code. Route tasks to GPT, Gemini, Grok, GLM and more via the included codeagent-wrapper.

## What is this?

xxcoder adds a team of specialized AI agents to your Claude Code session. Instead of doing everything with one model, Sisyphus (the orchestrator) delegates tasks to the best-fit agent:

| Agent | Model | Role |
|-------|-------|------|
| xx-oracle | GPT-5.2 | Architecture consultation, code review, complex debugging |
| xx-developer | GPT-5.3-codex | Autonomous deep implementation |
| xx-explorer | opencode/kimi-k2.5-free | Fast codebase search, pattern discovery |
| xx-librarian | opencode/kimi-k2.5-free | Documentation search, GitHub exploration |
| xx-looker | Gemini-3-flash | Screenshot/diagram/PDF analysis |
| xx-planner | GPT-5.2 | Pre-planning, intent analysis, requirement discovery |
| xx-reviewer | GPT-5.2 | Plan verification, solution review |

## Prerequisites

xxcoder requires backend CLIs to communicate with different model providers:

| Backend | Agents | Install |
|---------|--------|---------|
| [codex](https://github.com/openai/codex) | oracle, developer | `npm i -g @openai/codex` |
| [gemini](https://github.com/google-gemini/gemini-cli) | looker | `npm i -g @google/gemini-cli` |
| [opencode](https://github.com/opencode-ai/opencode) | explorer, librarian | `go install github.com/opencode-ai/opencode@latest` |

`planner` defaults to `codex` to avoid nested `claude` CLI invocation inside an active Claude Code session.

`npx xxcoder init` installs the packaged `codeagent-wrapper` binary automatically.

If you're developing this repo and need to rebuild wrapper manually, use Go 1.21+:

```bash
cd codeagent-wrapper
make build
mkdir -p ~/.claude/bin
cp codeagent-wrapper ~/.claude/bin/
```

You only need the backends for the agents you plan to use. Run `xxcoder doctor` to check availability.
If doctor reports `wrapper INVALID`, the packaged binary architecture is mismatched; rebuild `codeagent-wrapper` locally or replace binaries before reinstalling.

## Install

```bash
xxcoder init
```

If you're running from source without npm publish, install globally first:

```bash
npm i -g .
```

For OpenCode-backed agents, model IDs must be `provider/model` format. Check available IDs with `opencode models` and adjust `~/.codeagent/models.json` if needed.

This copies agent definitions, skills, hooks, and config templates to `~/.claude/` and `~/.codeagent/`, and overwrites existing xxcoder files.
xxcoder does not rely on a global `CLAUDE.md` prompt; orchestration is activated manually via `/xx`.

## Setup

1. **Check backends**: `xxcoder doctor`
2. **Configure models**: Edit `~/.codeagent/models.json` and fill in your API keys (you can also tune wrapper timeout/log settings in the top-level `wrapper` block)
3. **Start fresh session**: Restart Claude Code after install
4. **Enable Sisyphus manually**: Run `/xx` in the session where you want orchestration

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
