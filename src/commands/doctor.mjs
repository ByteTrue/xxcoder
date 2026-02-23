import { existsSync, readFileSync } from "node:fs"
import { execFileSync } from "node:child_process"
import { homedir } from "node:os"
import { join, delimiter } from "node:path"
import ansis from "ansis"
import ora from "ora"
import { detectExecutableFormat, expectedExecutableFormat } from "../utils/binary.mjs"

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
    install: "npm install -g @google/gemini-cli",
  },
  {
    name: "opencode",
    command: "opencode",
    check: ["opencode", "--version"],
    purpose: "OpenCode CLI (explorer, librarian)",
    install: "go install github.com/opencode-ai/opencode@latest",
  },
]

function findWrapperInPath() {
  const pathValue = process.env.PATH || ""
  if (!pathValue) return ""
  const names = process.platform === "win32"
    ? ["codeagent-wrapper.exe", "codeagent-wrapper"]
    : ["codeagent-wrapper"]
  for (const entry of pathValue.split(delimiter).filter(Boolean)) {
    for (const name of names) {
      const candidate = join(entry, name)
      if (existsSync(candidate)) return candidate
    }
  }
  return ""
}

function readModelsConfig() {
  const path = join(homedir(), ".codeagent", "models.json")

  // File not found is acceptable
  if (!existsSync(path)) return null

  try {
    const content = readFileSync(path, "utf-8")
    return JSON.parse(content)
  } catch (error) {
    // Distinguish between different error types
    if (error.code === "EACCES" || error.code === "EPERM") {
      console.warn(ansis.yellow(`\n  Warning: Cannot read ${path}`))
      console.warn(ansis.dim(`           Permission denied. Check file permissions.\n`))
    } else if (error instanceof SyntaxError) {
      console.warn(ansis.yellow(`\n  Warning: Invalid JSON in ${path}`))
      console.warn(ansis.dim(`           ${error.message}`))
      console.warn(ansis.dim(`           Fix the JSON syntax or run 'xxcoder init' to regenerate.\n`))
    } else {
      console.warn(ansis.yellow(`\n  Warning: Failed to read ${path}`))
      console.warn(ansis.dim(`           ${error.message}\n`))
    }
    return null
  }
}

export async function doctor() {
  console.log(ansis.cyan("\nxxcoder doctor") + " - Backend CLI availability check\n")

  const results = []

  // Check all backend CLIs in parallel
  const backendChecks = BACKENDS.map((backend) => {
    const spinner = ora({ text: `Checking ${backend.name}...`, indent: 2 }).start()
    return (async () => {
      try {
        const output = execFileSync(backend.check[0], backend.check.slice(1), {
          timeout: 5000,
          encoding: "utf-8",
          stdio: ["pipe", "pipe", "pipe"],
        }).trim()
        const version = output.split("\n")[0].slice(0, 40)
        spinner.succeed(ansis.green(`${backend.name.padEnd(10)} OK`) + `  ${version}`)
        return { name: backend.name, status: "ok", detail: version }
      } catch (error) {
        if (error.code === "ENOENT") {
          spinner.fail(ansis.red(`${backend.name.padEnd(10)} MISSING`) + `  (${backend.purpose})`)
          console.log(ansis.dim(`             Install: ${backend.install}`))
          return { name: backend.name, status: "missing", detail: backend.purpose }
        } else if (error.code === "ETIMEDOUT" || error.killed) {
          spinner.warn(ansis.yellow(`${backend.name.padEnd(10)} TIMEOUT`) + `  (${backend.purpose})`)
          return { name: backend.name, status: "timeout", detail: backend.purpose }
        } else {
          spinner.fail(ansis.red(`${backend.name.padEnd(10)} ERROR`) + `  (${error.message})`)
          return { name: backend.name, status: "error", detail: error.message }
        }
      }
    })()
  })

  const backendResults = await Promise.all(backendChecks)
  results.push(...backendResults)

  // Check codeagent-wrapper
  const wrapperSpinner = ora({ text: "Checking wrapper...", indent: 2 }).start()
  const home = homedir()
  const wrapperPaths = [
    `${home}/.claude/bin/codeagent-wrapper`,
    `${home}/.codeagent/bin/codeagent-wrapper`,
    findWrapperInPath(),
  ].filter(Boolean)
  const wrapperFound = wrapperPaths.find((p) => existsSync(p))
  if (wrapperFound) {
    const expected = expectedExecutableFormat(process.platform)
    let actual = "unknown"
    try {
      actual = detectExecutableFormat(wrapperFound)
    } catch {
      // keep default "unknown"
    }

    if (expected !== "unknown" && actual !== expected) {
      wrapperSpinner.fail(
        ansis.red(`${"wrapper".padEnd(10)} INVALID`) +
        `  ${wrapperFound} (expected ${expected}, got ${actual})`
      )
      console.log(ansis.dim("             Reinstall after fixing packaged binaries or rebuild wrapper locally."))
      results.push({ name: "wrapper", status: "error", detail: `format mismatch: expected ${expected}, got ${actual}` })
    } else {
      wrapperSpinner.succeed(ansis.green(`${"wrapper".padEnd(10)} OK`) + `  ${wrapperFound}`)
      results.push({ name: "wrapper", status: "ok", detail: wrapperFound })
    }
  } else {
    wrapperSpinner.fail(ansis.red(`${"wrapper".padEnd(10)} MISSING`) + "  (codeagent-wrapper binary)")
    console.log(ansis.dim("             Build: cd codeagent-wrapper && make build && cp codeagent-wrapper ~/.claude/bin/"))
    results.push({ name: "wrapper", status: "missing", detail: "codeagent-wrapper binary" })
  }

  // Validate opencode model IDs used by agents (if opencode is available)
  const opencodeOk = results.some((r) => r.name === "opencode" && r.status === "ok")
  if (opencodeOk) {
    const modelSpinner = ora({ text: "Checking opencode agent models...", indent: 2 }).start()
    try {
      const output = execFileSync("opencode", ["models"], {
        timeout: 8000,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      })
      const available = new Set(
        output
          .split("\n")
          .map((x) => x.trim())
          .filter(Boolean)
      )
      const cfg = readModelsConfig()
      if (!cfg?.agents) {
        modelSpinner.warn(ansis.yellow(`${"op-models".padEnd(10)} SKIP`) + "  ~/.codeagent/models.json not found or invalid")
        results.push({ name: "op-models", status: "timeout", detail: "models config missing" })
      } else {
        const missing = []
        for (const [agentName, agentCfg] of Object.entries(cfg.agents)) {
          if (agentCfg?.backend !== "opencode") continue
          const model = String(agentCfg?.model || "").trim()
          if (!model || !available.has(model)) {
            missing.push(`${agentName}:${model || "<empty>"}`)
          }
        }
        if (missing.length > 0) {
          modelSpinner.fail(ansis.red(`${"op-models".padEnd(10)} INVALID`) + `  missing: ${missing.join(", ")}`)
          console.log(ansis.dim("             Run `opencode models` and update ~/.codeagent/models.json to supported provider/model IDs."))
          results.push({ name: "op-models", status: "error", detail: missing.join(", ") })
        } else {
          modelSpinner.succeed(ansis.green(`${"op-models".padEnd(10)} OK`) + "  all opencode agent models are available")
          results.push({ name: "op-models", status: "ok", detail: "model IDs validated" })
        }
      }
    } catch (error) {
      modelSpinner.warn(ansis.yellow(`${"op-models".padEnd(10)} SKIP`) + `  (${error.code || error.message})`)
      results.push({ name: "op-models", status: "timeout", detail: error.code || error.message })
    }
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
    console.log(ansis.yellow("  Some dependencies are missing or invalid. Affected agents will not work."))
    console.log(ansis.dim("  Fix missing CLIs/wrapper and run 'xxcoder doctor' again."))
  }
}
