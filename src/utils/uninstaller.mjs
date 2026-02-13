import { existsSync, readFileSync, writeFileSync, rmSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { homedir } from "node:os"

const XXCODER_MARKER = "<!-- xxcoder:start -->"
const XXCODER_MARKER_END = "<!-- xxcoder:end -->"

const WRAPPER_AGENT_FILES = [
  "developer.md",
  "explorer.md",
  "librarian.md",
  "looker.md",
  "oracle.md",
  "planner.md",
  "reviewer.md",
]

/**
 * Check if a directory has xxcoder installation artifacts.
 */
export function hasXxcoderInstall(dir) {
  if (existsSync(join(dir, "agents", "xx"))) return true
  if (existsSync(join(dir, "skills", "xx"))) return true
  if (existsSync(join(dir, "hooks", "pre-bash.py"))) return true
  const claudeMd = join(dir, "CLAUDE.md")
  if (existsSync(claudeMd)) {
    const content = readFileSync(claudeMd, "utf-8")
    if (content.includes(XXCODER_MARKER)) return true
  }
  return false
}

/**
 * Remove xxcoder directories (agents/xx, skills/xx) and hooks/pre-bash.py.
 * Returns { removed, skipped } counts.
 */
export function uninstallDir(dir) {
  let removed = 0
  let skipped = 0

  const targets = [
    join(dir, "agents", "xx"),
    join(dir, "skills", "xx"),
  ]

  for (const target of targets) {
    if (existsSync(target)) {
      rmSync(target, { recursive: true, force: true })
      removed++
    } else {
      skipped++
    }
  }

  const hookFile = join(dir, "hooks", "pre-bash.py")
  if (existsSync(hookFile)) {
    rmSync(hookFile)
    removed++
  } else {
    skipped++
  }

  return { removed, skipped }
}

/**
 * Remove xxcoder markers from CLAUDE.md, preserving user content.
 * If file becomes empty after removal, delete it entirely.
 * Returns { removed: 0|1, skipped: 0|1 }.
 */
export function uninstallClaudeMd(filePath) {
  if (!existsSync(filePath)) return { removed: 0, skipped: 1 }

  const content = readFileSync(filePath, "utf-8")
  if (!content.includes(XXCODER_MARKER)) return { removed: 0, skipped: 1 }

  const re = new RegExp(`\\n?${XXCODER_MARKER}[\\s\\S]*?${XXCODER_MARKER_END}\\n?`)
  const cleaned = content.replace(re, "").trim()

  if (!cleaned) {
    rmSync(filePath)
  } else {
    writeFileSync(filePath, cleaned + "\n", "utf-8")
  }
  return { removed: 1, skipped: 0 }
}

/**
 * Remove ~/.claude/bin/codeagent-wrapper binary.
 */
export function uninstallWrapper() {
  const destName = process.platform === "win32" ? "codeagent-wrapper.exe" : "codeagent-wrapper"
  const binaryPath = join(homedir(), ".claude", "bin", destName)
  if (existsSync(binaryPath)) {
    rmSync(binaryPath)
    return { removed: 1, skipped: 0 }
  }
  return { removed: 0, skipped: 1 }
}

/**
 * Remove ~/.codeagent/models.json and ~/.codeagent/agents/*.md wrapper prompts.
 */
export function uninstallCodeagentConfig() {
  const codeagentDir = join(homedir(), ".codeagent")
  let removed = 0
  let skipped = 0

  // models.json
  const modelsJson = join(codeagentDir, "models.json")
  if (existsSync(modelsJson)) {
    rmSync(modelsJson)
    removed++
  } else {
    skipped++
  }

  // agent wrapper prompts
  const agentsDir = join(codeagentDir, "agents")
  for (const file of WRAPPER_AGENT_FILES) {
    const filePath = join(agentsDir, file)
    if (existsSync(filePath)) {
      rmSync(filePath)
      removed++
    } else {
      skipped++
    }
  }

  return { removed, skipped }
}
