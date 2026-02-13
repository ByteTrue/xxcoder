import { existsSync } from "node:fs"
import { execFileSync } from "node:child_process"
import { homedir } from "node:os"
import ansis from "ansis"
import ora from "ora"

const BACKENDS = [
  {
    name: "codex",
    command: "codex",
    check: ["codex", "--version"],
    purpose: "OpenAI Codex CLI (oracle, developer)",
    install: "npm install -g @openai/codex",
  },
  {
    name: "claude",
    command: "claude",
    check: ["claude", "--version"],
    purpose: "Anthropic Claude Code CLI (planner)",
    install: "npm install -g @anthropic-ai/claude-code",
  },
  {
    name: "gemini",
    command: "gemini",
    check: ["gemini", "--version"],
    purpose: "Google Gemini CLI (looker)",
    install: "npm install -g @anthropic-ai/claude-code  # or see https://github.com/anthropics/claude-code",
  },
  {
    name: "opencode",
    command: "opencode",
    check: ["opencode", "version"],
    purpose: "OpenCode CLI (explorer, librarian)",
    install: "go install github.com/opencode-ai/opencode@latest",
  },
]

export async function doctor() {
  console.log(ansis.cyan("\nxxcoder doctor") + " - Backend CLI availability check\n")

  const results = []

  // Check each backend CLI
  for (const backend of BACKENDS) {
    const spinner = ora({ text: `Checking ${backend.name}...`, indent: 2 }).start()
    try {
      const output = execFileSync(backend.check[0], backend.check.slice(1), {
        timeout: 5000,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      }).trim()
      const version = output.split("\n")[0].slice(0, 40)
      spinner.succeed(ansis.green(`${backend.name.padEnd(10)} OK`) + `  ${version}`)
      results.push({ name: backend.name, status: "ok", detail: version })
    } catch (error) {
      if (error.code === "ENOENT") {
        spinner.fail(ansis.red(`${backend.name.padEnd(10)} MISSING`) + `  (${backend.purpose})`)
        console.log(ansis.dim(`             Install: ${backend.install}`))
        results.push({ name: backend.name, status: "missing", detail: backend.purpose })
      } else if (error.code === "ETIMEDOUT" || error.killed) {
        spinner.warn(ansis.yellow(`${backend.name.padEnd(10)} TIMEOUT`) + `  (${backend.purpose})`)
        results.push({ name: backend.name, status: "timeout", detail: backend.purpose })
      } else {
        spinner.fail(ansis.red(`${backend.name.padEnd(10)} ERROR`) + `  (${error.message})`)
        results.push({ name: backend.name, status: "error", detail: error.message })
      }
    }
  }

  // Check codeagent-wrapper
  const wrapperSpinner = ora({ text: "Checking wrapper...", indent: 2 }).start()
  const home = homedir()
  const wrapperPaths = [
    `${home}/.claude/bin/codeagent-wrapper`,
    `${home}/.codeagent/bin/codeagent-wrapper`,
  ]
  const wrapperFound = wrapperPaths.find((p) => existsSync(p))
  if (wrapperFound) {
    wrapperSpinner.succeed(ansis.green(`${"wrapper".padEnd(10)} OK`) + `  ${wrapperFound}`)
    results.push({ name: "wrapper", status: "ok", detail: wrapperFound })
  } else {
    wrapperSpinner.fail(ansis.red(`${"wrapper".padEnd(10)} MISSING`) + "  (codeagent-wrapper binary)")
    console.log(ansis.dim("             Build: cd codeagent-wrapper && make build && cp codeagent-wrapper ~/.claude/bin/"))
    results.push({ name: "wrapper", status: "missing", detail: "codeagent-wrapper binary" })
  }

  // Summary table
  const allOk = results.every((r) => r.status === "ok")
  console.log(ansis.cyan("\n  Summary:"))
  for (const r of results) {
    const icon = r.status === "ok" ? ansis.green("✓") : ansis.red("✗")
    const name = r.name.padEnd(10)
    const statusLabel =
      r.status === "ok" ? ansis.green("available") :
      r.status === "timeout" ? ansis.yellow("timeout") :
      ansis.red(r.status)
    console.log(`  ${icon} ${name} ${statusLabel}`)
  }

  console.log()
  if (allOk) {
    console.log(ansis.green("  All backends available."))
  } else {
    console.log(ansis.yellow("  Some backends are missing. Agents using those backends will not work."))
    console.log(ansis.dim("  Install missing CLIs and run 'npx xxcoder doctor' again."))
  }
}
