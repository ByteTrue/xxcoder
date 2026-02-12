#!/usr/bin/env node

/**
 * xxcoder CLI - Multi-model agent orchestration installer for Claude Code
 *
 * Usage:
 *   npx xxcoder [init|doctor]
 *   npx xxcoder init [--force] [--install-dir <path>]
 *   npx xxcoder doctor
 */

import { parseArgs } from "node:util"
import { init } from "../src/commands/init.mjs"
import { doctor } from "../src/commands/doctor.mjs"

let values, positionals
try {
  ({ values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      force: { type: "boolean", default: false },
      "install-dir": { type: "string", default: "" },
      help: { type: "boolean", short: "h", default: false },
    },
  }))
} catch (err) {
  console.error(`Error: ${err.message}`)
  console.error(`Run 'xxcoder --help' for usage information.`)
  process.exit(1)
}

const command = positionals[0] || "init"

if (values.help) {
  console.log(`
xxcoder - Multi-model agent orchestration for Claude Code

Commands:
  init      Install agent templates to ~/.claude/ (default)
  doctor    Check backend CLI availability

Options:
  --force          Overwrite existing files
  --install-dir    Custom installation directory (default: ~/.claude)
  -h, --help       Show this help
`)
  process.exit(0)
}

switch (command) {
  case "init":
    await init({
      force: values.force,
      installDir: values["install-dir"] || "",
    })
    break
  case "doctor":
    await doctor()
    break
  default:
    console.error(`Unknown command: ${command}`)
    process.exit(1)
}
