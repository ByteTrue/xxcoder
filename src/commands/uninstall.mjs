import { join } from "node:path"
import inquirer from "inquirer"
import ora from "ora"
import ansis from "ansis"
import {
  hasXxcoderInstall,
  uninstallDir,
  uninstallClaudeMd,
  uninstallWrapper,
  uninstallCodeagentConfig,
} from "../utils/uninstaller.mjs"
import {
  getDefaultInstallDir,
  getProjectInstallDir,
} from "../utils/installer.mjs"

async function runStep(label, fn) {
  const spinner = ora(label).start()
  try {
    const result = await fn()
    spinner.succeed()
    return result
  } catch (err) {
    spinner.fail(ansis.red(`${label} — ${err.message}`))
    return { removed: 0, skipped: 0 }
  }
}

async function uninstallLocation(dir) {
  let totalRemoved = 0
  let totalSkipped = 0

  function addCounts(r) {
    totalRemoved += r.removed
    totalSkipped += r.skipped
  }

  console.log(ansis.dim(`\n正在卸载 ${ansis.cyan(dir)}\n`))

  addCounts(
    await runStep("移除 agent 定义 (agents/xx)", () => uninstallDir(dir))
  )

  addCounts(
    await runStep("清理 CLAUDE.md 中的 xxcoder 配置", () =>
      uninstallClaudeMd(join(dir, "CLAUDE.md"))
    )
  )

  return { totalRemoved, totalSkipped }
}

export async function uninstall({ force = false, installDir = "", interactive = true } = {}) {
  const userDir = getDefaultInstallDir()
  const projectDir = getProjectInstallDir()

  // Determine which locations to uninstall
  let locations = []
  if (installDir) {
    locations = [installDir]
  } else if (interactive) {
    const hasUser = hasXxcoderInstall(userDir)
    const hasProject = hasXxcoderInstall(projectDir)

    if (!hasUser && !hasProject) {
      console.log(ansis.dim("\n未检测到 xxcoder 安装。"))
      return
    }

    const choices = []
    if (hasUser) {
      choices.push({
        name: `用户目录  ${ansis.dim("(~/.claude)")}`,
        value: userDir,
      })
    }
    if (hasProject) {
      choices.push({
        name: `项目目录  ${ansis.dim("(./.claude)")}`,
        value: projectDir,
      })
    }
    if (hasUser && hasProject) {
      choices.push({
        name: `全部卸载`,
        value: "all",
      })
    }

    const { target } = await inquirer.prompt([
      {
        type: "list",
        name: "target",
        message: "选择要卸载的位置:",
        choices,
      },
    ])

    locations = target === "all" ? [userDir, projectDir] : [target]
  } else {
    // Non-interactive: uninstall wherever found
    if (hasXxcoderInstall(userDir)) locations.push(userDir)
    if (hasXxcoderInstall(projectDir)) locations.push(projectDir)
    if (!locations.length) {
      console.log(ansis.dim("\n未检测到 xxcoder 安装。"))
      return
    }
  }

  // Confirmation
  if (!force) {
    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: ansis.yellow("确认卸载? 此操作将移除 xxcoder 安装的所有文件"),
        default: false,
      },
    ])
    if (!confirm) {
      console.log(ansis.dim("\n已取消卸载。"))
      return
    }
  }

  let grandRemoved = 0
  let grandSkipped = 0

  // Uninstall each location
  for (const dir of locations) {
    const { totalRemoved, totalSkipped } = await uninstallLocation(dir)
    grandRemoved += totalRemoved
    grandSkipped += totalSkipped
  }

  // Global artifacts (wrapper binary, codeagent config)
  console.log(ansis.dim("\n正在清理全局配置\n"))

  const wrapperResult = await runStep("移除 codeagent-wrapper 二进制", () =>
    uninstallWrapper()
  )
  grandRemoved += wrapperResult.removed
  grandSkipped += wrapperResult.skipped

  const configResult = await runStep("移除 codeagent 配置文件", () =>
    uninstallCodeagentConfig()
  )
  grandRemoved += configResult.removed
  grandSkipped += configResult.skipped

  // Summary
  console.log()
  console.log(ansis.bold("  卸载完成!\n"))
  console.log(`  已移除: ${ansis.green(`${grandRemoved} 项`)}${grandSkipped ? ansis.dim(`, ${grandSkipped} 项已跳过 (不存在)`) : ""}`)
  console.log()
}
