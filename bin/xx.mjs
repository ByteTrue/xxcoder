#!/usr/bin/env node

import { createRequire } from "node:module"
import { homedir } from "node:os"
import { join } from "node:path"
import cac from "cac"
import { init } from "../src/commands/init.mjs"
import { uninstall } from "../src/commands/uninstall.mjs"
import { doctor } from "../src/commands/doctor.mjs"

const require = createRequire(import.meta.url)
const { version } = require("../package.json")

const cli = cac("xxcoder")

let commandMatched = false

cli
  .command("init", "Install agent templates", { allowUnknownOptions: false })
  .option("--force", "Overwrite existing files")
  .option("--install-dir <path>", "Custom installation directory")
  .option("--user", "Install to ~/.claude")
  .option("--project", "Install to ./.claude")
  .action(async (options) => {
    commandMatched = true
    let installDir = options.installDir || ""
    if (options.user) installDir = join(homedir(), ".claude")
    if (options.project) installDir = join(process.cwd(), ".claude")
    const interactive = !installDir && !options.force
    await init({ force: options.force, installDir, interactive })
  })

cli
  .command("doctor", "Check backend CLI availability")
  .action(async () => {
    commandMatched = true
    await doctor()
  })

cli
  .command("uninstall", "Uninstall xxcoder files")
  .option("--user", "Uninstall from ~/.claude")
  .option("--project", "Uninstall from ./.claude")
  .option("--force", "Skip confirmation prompt")
  .action(async (options) => {
    commandMatched = true
    let installDir = ""
    if (options.user) installDir = join(homedir(), ".claude")
    if (options.project) installDir = join(process.cwd(), ".claude")
    const interactive = !installDir && !options.force
    await uninstall({ force: options.force, installDir, interactive })
  })

cli.help()
cli.version(version)

const parsed = cli.parse()

// No command given and no help/version flags → interactive menu
if (!commandMatched && !parsed.options.help && !parsed.options.version) {
  const { interactive } = await import("../src/commands/interactive.mjs")
  await interactive()
}
