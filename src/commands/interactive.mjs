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
      message: "Select an action:",
      choices: [
        {
          name: "Install xxcoder — Install agent templates and config to Claude Code",
          value: "init",
        },
        {
          name: "Uninstall xxcoder — Remove all xxcoder installed files",
          value: "uninstall",
        },
        {
          name: "Environment check (doctor) — Verify backend CLIs and wrapper availability",
          value: "doctor",
        },
        new Separator(),
        {
          name: "Exit",
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
