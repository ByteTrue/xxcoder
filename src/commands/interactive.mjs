import select, { Separator } from "@inquirer/select"
import ansis from "ansis"
import { init } from "./init.mjs"
import { uninstall } from "./uninstall.mjs"
import { doctor } from "./doctor.mjs"

function showBanner() {
  console.log()
  console.log(ansis.cyan("╔══════════════════════════════════════════╗"))
  console.log(ansis.cyan("║") + "     " + ansis.bold.white("xxcoder") + " - Multi-Model Orchestration  " + ansis.cyan("║"))
  console.log(ansis.cyan("║") + "     for Claude Code                      " + ansis.cyan("║"))
  console.log(ansis.cyan("╚══════════════════════════════════════════╝"))
  console.log()
}

export async function interactive() {
  showBanner()

  while (true) {
    const action = await select({
      message: "选择操作:",
      choices: [
        {
          name: "安装 xxcoder — 覆盖安装 agent 模板和配置到 Claude Code",
          value: "init",
        },
        {
          name: "卸载 xxcoder — 移除 xxcoder 安装的所有文件",
          value: "uninstall",
        },
        {
          name: "环境检查 (doctor) — 检查后端 CLI 和 wrapper 可用性",
          value: "doctor",
        },
        new Separator(),
        {
          name: "退出",
          value: "exit",
        },
      ],
    })

    if (action === "exit") break

    console.log()

    if (action === "init") {
      await init()
    } else if (action === "uninstall") {
      await uninstall()
    } else if (action === "doctor") {
      await doctor()
    }

    console.log()
  }
}
