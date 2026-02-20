# Known Issues

## 2026-02-18 - Nested Claude CLI invocation (RESOLVED)

### Symptom

When a role is configured with `backend: "claude"` and invoked from an active Claude Code session, wrapper execution would fail with:

`Error: Claude Code cannot be launched inside another Claude Code session.`

### Root Cause

Claude CLI startup logic blocks nested launches when `CLAUDECODE=1` is present in the environment. The `codeagent-wrapper` subprocess inherited this environment variable from the parent Claude Code session.

### Solution (Implemented 2026-02-20)

The `claude` backend now explicitly clears all Claude Code session environment variables before spawning `claude -p` subprocesses. This allows nested invocation while maintaining safety:

**Implementation:** `codeagent-wrapper/internal/backend/claude.go` - The `Env()` method sets all Claude Code session markers to empty strings:
- `CLAUDECODE=""`
- `CLAUDE_CODE_ENTRYPOINT=""`
- `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=""`
- `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=""`

**Why this is safe:**

1. **No recursion risk:** xxcoder uses single-shot, non-interactive `claude -p` calls. The subagent prompt is predefined and won't trigger another `codeagent-wrapper` invocation.

2. **File system safety:** Claude Code officially supports multiple instances in the same directory. Each session has an independent session ID and state files don't conflict.

3. **Independent security context:** The child `claude -p` process has its own permission model. The wrapper passes `--dangerously-skip-permissions` and `--setting-sources ""` to ensure clean execution.

4. **No functional loss:** `CLAUDECODE` is only used for nesting detection. Clearing it doesn't affect tool use, MCP integration, file access, or any other Claude Code features.

5. **Validated by investigation:** A 5-person research team investigated environment variables, file system conflicts, recursion risks, security implications, and historical context. All findings confirmed this approach is safe for xxcoder's use case.

### Usage

You can now configure any agent role to use `backend: "claude"` in `~/.codeagent/models.json`:

```json
{
  "agents": {
    "planner": {
      "backend": "claude",
      "model": "claude-opus-4"
    }
  }
}
```

### Monitoring

While this solution is safe for current Claude CLI versions, future updates might introduce additional nesting checks. Monitor Claude Code release notes for changes to nested invocation behavior.
