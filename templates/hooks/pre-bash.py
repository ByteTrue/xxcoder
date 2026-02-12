#!/usr/bin/env python3
"""
Pre-Bash Hook - Block dangerous commands before execution.

Claude Code PreToolUse hooks receive JSON via stdin with the structure:
{
  "tool_name": "Bash",
  "tool_input": { "command": "..." },
  ...
}

Exit codes:
  0 = allow
  2 = block
"""

import sys
import json


def block(reason: str):
    print(f"[xxcoder] BLOCKED: {reason}", file=sys.stderr)
    sys.exit(2)


def main():
    # Read hook input from stdin (Claude Code PreToolUse spec)
    try:
        input_data = json.load(sys.stdin)
        tool_input = input_data.get("tool_input", {})
        command = tool_input.get("command", "")
    except (json.JSONDecodeError, ValueError):
        # If stdin is empty or invalid, allow (fail-open)
        sys.exit(0)

    if not command:
        sys.exit(0)

    # Destructive system commands
    destructive = [
        "rm -rf /",
        "rm -rf ~",
        "rm -rf $HOME",
        "dd if=",
        ":(){:|:&};:",
        "mkfs.",
        "> /dev/sd",
        "chmod -R 777 /",
    ]
    for pattern in destructive:
        if pattern in command:
            block(f"Dangerous command detected: {pattern}")

    # Pipe-to-shell patterns (curl/wget piped to sh/bash)
    if any(dl in command for dl in ["wget", "curl"]) and any(
        sh in command for sh in ["| sh", "|sh", "| bash", "|bash"]
    ):
        block("Piping download to shell is blocked")

    sys.exit(0)


if __name__ == "__main__":
    main()
