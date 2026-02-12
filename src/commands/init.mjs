import { join } from "node:path"
import { homedir } from "node:os"
import { copyDir, copyFile, getTemplatesDir, getDefaultInstallDir } from "../utils/installer.mjs"

export async function init({ force = false, installDir = "" } = {}) {
  const dest = installDir || getDefaultInstallDir()
  const templates = getTemplatesDir()

  console.log(`xxcoder init - Installing to ${dest}\n`)

  // 1. Install agent definitions
  console.log("[agents] Installing 7 subagent definitions...")
  copyDir(join(templates, "agents", "xx"), join(dest, "agents", "xx"), { force })

  // 2. Install skill
  console.log("\n[skill] Installing xx orchestration skill...")
  copyDir(join(templates, "skills", "xx"), join(dest, "skills", "xx"), { force })

  // 3. Install models.json example
  console.log("\n[config] Installing models.json.example...")
  const codeagentDir = join(homedir(), ".codeagent")
  copyFile(
    join(templates, "config", "models.json.example"),
    join(codeagentDir, "models.json.example"),
    { force }
  )

  // 4. Install wrapper prompts
  console.log("\n[prompts] Installing wrapper role prompts...")
  copyDir(join(templates, "prompts"), join(codeagentDir, "agents"), { force })

  // 5. Install hooks
  console.log("\n[hooks] Installing pre-bash hook...")
  copyDir(join(templates, "hooks"), join(dest, "hooks"), { force })

  // 6. Install CLAUDE.md example
  console.log("\n[config] Installing CLAUDE.md.example...")
  copyFile(
    join(templates, "config", "CLAUDE.md.example"),
    join(dest, "CLAUDE.md.example"),
    { force }
  )

  console.log("\nDone! Next steps:")
  console.log("  1. Run 'npx xxcoder doctor' to check backend CLIs and install any missing ones")
  console.log("  2. Copy ~/.codeagent/models.json.example to ~/.codeagent/models.json")
  console.log("     Configure API keys for the backends you plan to use")
  console.log("  3. Merge ~/.claude/CLAUDE.md.example into your project's CLAUDE.md")
  console.log("     (or copy it as ~/.claude/CLAUDE.md for global use)")
  console.log("  4. Start Claude Code and use /xx to activate Sisyphus orchestration")
}
