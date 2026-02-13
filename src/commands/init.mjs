import { join } from "node:path"
import { homedir } from "node:os"
import inquirer from "inquirer"
import ora from "ora"
import ansis from "ansis"
import {
  copyDir,
  copyFile,
  getTemplatesDir,
  getDefaultInstallDir,
  getProjectInstallDir,
  hasExistingInstall,
  installWrapper,
  installClaudeMd,
} from "../utils/installer.mjs"

function printBanner() {
  const banner = `
  ${ansis.cyan("╔══════════════════════════════════════════╗")}
  ${ansis.cyan("║")}     ${ansis.bold.white("xxcoder")} - Multi-Model Orchestration  ${ansis.cyan("║")}
  ${ansis.cyan("║")}     for Claude Code                      ${ansis.cyan("║")}
  ${ansis.cyan("╚══════════════════════════════════════════╝")}
`
  console.log(banner)
}

async function promptInstallDir() {
  const { location } = await inquirer.prompt([
    {
      type: "list",
      name: "location",
      message: "Where would you like to install xxcoder?",
      choices: [
        {
          name: `User directory  ${ansis.dim("(~/.claude)")} ${ansis.dim("— global, all projects")}`,
          value: "user",
        },
        {
          name: `Project directory ${ansis.dim("(./.claude)")} ${ansis.dim("— current project only")}`,
          value: "project",
        },
        {
          name: `Custom path...`,
          value: "custom",
        },
      ],
    },
  ])

  if (location === "user") return getDefaultInstallDir()
  if (location === "project") return getProjectInstallDir()

  const { customPath } = await inquirer.prompt([
    {
      type: "input",
      name: "customPath",
      message: "Enter installation path:",
      validate: (v) => (v.trim() ? true : "Path cannot be empty"),
    },
  ])
  return customPath.trim()
}

async function confirmOverwrite(dest) {
  const { proceed } = await inquirer.prompt([
    {
      type: "confirm",
      name: "proceed",
      message: ansis.yellow(`Existing xxcoder files found in ${dest}. Overwrite?`),
      default: false,
    },
  ])
  return proceed
}

async function runStep(label, fn) {
  const spinner = ora(label).start()
  try {
    const result = await fn()
    spinner.succeed()
    return result
  } catch (err) {
    spinner.fail(ansis.red(`${label} — ${err.message}`))
    return { copied: 0, skipped: 0 }
  }
}

export async function init({ force = false, installDir = "", interactive = true } = {}) {
  printBanner()

  // Resolve destination
  let dest = installDir
  if (!dest && interactive) {
    dest = await promptInstallDir()
  } else if (!dest) {
    dest = getDefaultInstallDir()
  }

  // Force overwrite confirmation
  if (!force && interactive && hasExistingInstall(dest)) {
    const proceed = await confirmOverwrite(dest)
    if (!proceed) {
      console.log(ansis.dim("\nInstallation cancelled."))
      return
    }
    force = true
  }

  console.log(ansis.dim(`\nInstalling to ${ansis.cyan(dest)}\n`))

  const templates = getTemplatesDir()
  const codeagentDir = join(homedir(), ".codeagent")
  const opts = { force, silent: true }
  let totalCopied = 0
  let totalSkipped = 0

  function addCounts(r) {
    totalCopied += r.copied
    totalSkipped += r.skipped
  }

  // 1. Agent definitions
  addCounts(
    await runStep("Installing subagent definitions", () =>
      copyDir(join(templates, "agents", "xx"), join(dest, "agents", "xx"), opts)
    )
  )

  // 2. Skill
  addCounts(
    await runStep("Installing xx orchestration skill", () =>
      copyDir(join(templates, "skills", "xx"), join(dest, "skills", "xx"), opts)
    )
  )

  // 3. models.json
  addCounts(
    await runStep("Installing models.json", () =>
      copyFile(
        join(templates, "config", "models.json.example"),
        join(codeagentDir, "models.json"),
        opts
      )
    )
  )

  // 4. Wrapper prompts
  addCounts(
    await runStep("Installing wrapper role prompts", () =>
      copyDir(join(templates, "prompts"), join(codeagentDir, "agents"), opts)
    )
  )

  // 5. Hooks
  addCounts(
    await runStep("Installing pre-bash hook", () =>
      copyDir(join(templates, "hooks"), join(dest, "hooks"), opts)
    )
  )

  // 6. CLAUDE.md (merge with existing if present)
  addCounts(
    await runStep("Installing CLAUDE.md", () =>
      installClaudeMd(
        join(templates, "config", "CLAUDE.md.example"),
        join(dest, "CLAUDE.md"),
        opts
      )
    )
  )

  // 7. codeagent-wrapper binary → ~/.claude/bin/
  addCounts(
    await runStep("Installing codeagent-wrapper binary", () =>
      installWrapper(opts)
    )
  )

  // Summary
  console.log()
  console.log(ansis.bold("  Installation complete!\n"))
  console.log(`  Path:    ${ansis.cyan(dest)}`)
  console.log(`  Files:   ${ansis.green(`${totalCopied} installed`)}${totalSkipped ? ansis.dim(`, ${totalSkipped} skipped`) : ""}`)
  console.log()
  console.log(ansis.yellow("  Next steps:"))
  console.log(ansis.yellow("  1.") + ` Run ${ansis.cyan("npx xxcoder doctor")} to check backend CLIs`)
  console.log(ansis.yellow("  2.") + ` Edit ${ansis.dim("~/.codeagent/models.json")} and configure API keys for your backends`)
  console.log(ansis.yellow("  3.") + ` Start Claude Code and use ${ansis.cyan("/xx")} to activate orchestration`)
  console.log()
}