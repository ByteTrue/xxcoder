# Known Issues

## 2026-02-15 - Nested Claude CLI invocation fails inside Claude Code session

### Symptom

When a role is configured with `backend: "claude"` and invoked from an active Claude Code session, wrapper execution may fail with:

`Error: Claude Code cannot be launched inside another Claude Code session.`

### Reproduction

1. Start Claude Code.
2. Trigger `/xx` orchestration.
3. Route a role to `backend: "claude"` (for example `planner`).
4. The wrapper runs `claude -p ...` and exits with the nested-session error.

### Root Cause

Current Claude CLI startup logic blocks nested non-team launches when `CLAUDECODE=1` is present in the environment.

### Current Mitigation

- `planner` default backend is switched to `codex` in `models.json.example`.
- Existing local installs should keep `~/.codeagent/models.json` `planner.backend` as `codex` unless you intentionally test team-mode integration.

### Follow-up (Open)

- Evaluate whether we should support Claude backend roles through Claude team-mode integration instead of direct `claude -p` invocation.
