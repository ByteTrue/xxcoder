import { existsSync } from "node:fs"
import { execFileSync } from "node:child_process"
import { homedir } from "node:os"

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
  console.log("xxcoder doctor - Backend CLI availability check\n")

  let allOk = true

  for (const backend of BACKENDS) {
    process.stdout.write(`  ${backend.name.padEnd(10)} `)
    try {
      const output = execFileSync(backend.check[0], backend.check.slice(1), {
        timeout: 5000,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      }).trim()
      const version = output.split("\n")[0].slice(0, 40)
      console.log(`OK  ${version}`)
    } catch (error) {
      if (error.code === "ENOENT") {
        console.log(`MISSING  (${backend.purpose})`)
        console.log(`             Install: ${backend.install}`)
      } else if (error.code === "ETIMEDOUT" || error.killed) {
        console.log(`TIMEOUT  (${backend.purpose})`)
      } else {
        console.log(`ERROR  (${backend.purpose}: ${error.message})`)
      }
      allOk = false
    }
  }

  // Check codeagent-wrapper
  process.stdout.write(`  ${"wrapper".padEnd(10)} `)
  const home = homedir()
  const wrapperPaths = [
    `${home}/.claude/bin/codeagent-wrapper`,
    `${home}/.codeagent/bin/codeagent-wrapper`,
  ]
  const wrapperFound = wrapperPaths.find((p) => existsSync(p))
  if (wrapperFound) {
    console.log(`OK  ${wrapperFound}`)
  } else {
    console.log("MISSING  (codeagent-wrapper binary)")
    console.log("             Build: cd codeagent-wrapper && make build && cp codeagent-wrapper ~/.claude/bin/")
    allOk = false
  }

  console.log()
  if (allOk) {
    console.log("All backends available.")
  } else {
    console.log("Some backends are missing. Agents using those backends will not work.")
    console.log("Install missing CLIs and run 'npx xxcoder doctor' again.")
  }
}
