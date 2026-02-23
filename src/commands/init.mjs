import { join } from "node:path"
import { homedir } from "node:os"
import { existsSync } from "node:fs"
import inquirer from "inquirer"
import ora from "ora"
import ansis from "ansis"
import {
  copyDir,
  copyFile,
  getTemplatesDir,
  getDefaultInstallDir,
  getProjectInstallDir,
  installWrapper,
  disableManagedClaudeMd,
} from "../utils/installer.mjs"
import {
  MODULES,
  getRequiredBackends,
  getAgentsUsingBackend,
} from "../utils/modules.mjs"
import { runBackendConfigWizard } from "../utils/config-wizard.mjs"

function printBanner() {
  const banner = `
  ${ansis.cyan("╔══════════════════════════════════════════╗")}
  ${ansis.cyan("║")}     ${ansis.bold.white("xxcoder")} - Multi-Model Orchestration  ${ansis.cyan("║")}
  ${ansis.cyan("║")}     for Claude Code                      ${ansis.cyan("║")}
  ${ansis.cyan("╚══════════════════════════════════════════╝")}
`
  console.log(banner)
}

function printWelcome() {
  console.log('Welcome to xxcoder installer!\n')
  console.log('This wizard will guide you through:')
  console.log('  • Selecting installation location')
  console.log('  • Choosing which agents to install')
  console.log('  • Configuring backend API keys')
  console.log('  • Verifying your setup\n')
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

async function promptModuleSelection() {
  console.log(ansis.bold('\n? Which components would you like to install?\n'))

  console.log(ansis.dim('Core Components (required):'))
  console.log('  ✓ Sisyphus orchestrator (xx skill)')
  console.log('  ✓ Wrapper binary (codeagent-wrapper)')
  console.log('  ✓ Configuration files\n')

  // Agent selection
  const agentChoices = Object.values(MODULES.agents).map(agent => ({
    name: `${agent.displayName} — ${agent.description}`,
    value: agent.id,
    checked: agent.recommended,
  }))

  const { selectedAgents } = await inquirer.prompt([{
    type: 'checkbox',
    name: 'selectedAgents',
    message: 'Agent Modules (select which ones you need):',
    choices: agentChoices,
    validate: (answer) => {
      if (answer.length === 0) {
        return 'Please select at least one agent'
      }
      return true
    },
    pageSize: 10,
  }])

  // Optional components selection
  const optionalChoices = Object.values(MODULES.optional).map(opt => ({
    name: `${opt.name} — ${opt.description}`,
    value: opt.id,
    checked: opt.recommended,
  }))

  const { selectedOptional } = await inquirer.prompt([{
    type: 'checkbox',
    name: 'selectedOptional',
    message: 'Additional Components:',
    choices: optionalChoices,
  }])

  return {
    agents: selectedAgents,
    optional: selectedOptional,
  }
}

async function runStep(label, fn, stepNum, totalSteps) {
  const prefix = `[${stepNum}/${totalSteps}]`
  const spinner = ora(`${prefix} ${label}`).start()
  try {
    const result = await fn()
    spinner.succeed()
    return { ...result, ok: true, label }
  } catch (err) {
    spinner.fail(ansis.red(`${prefix} ${label} — ${err.message}`))
    return { copied: 0, skipped: 0, ok: false, label, error: err.message }
  }
}

async function installComponents(dest, selectedModules) {
  const templates = getTemplatesDir()
  const codeagentDir = join(homedir(), ".codeagent")
  const opts = { force: true, silent: true }

  let totalCopied = 0
  let totalSkipped = 0
  const failures = []

  function addCounts(r) {
    totalCopied += r.copied
    totalSkipped += r.skipped
    if (r.ok === false) failures.push(r)
  }

  // Calculate total steps
  const steps = [
    { label: 'Installing Sisyphus orchestrator', required: true },
    { label: `Installing selected agents (${selectedModules.agents.length} agents)`, required: true },
    { label: 'Installing wrapper binary', required: true },
    { label: 'Installing configuration files', required: true },
    { label: 'Installing wrapper role prompts', required: true },
  ]

  if (selectedModules.optional.includes('pre-bash-hook')) {
    steps.push({ label: 'Installing pre-bash hook', required: false })
  }

  steps.push({ label: 'Disabling managed CLAUDE.md', required: true })

  const totalSteps = steps.length
  let currentStep = 0

  console.log(ansis.dim(`\nInstalling to ${ansis.cyan(dest)}`))
  console.log(ansis.dim(`Installing (${totalSteps} steps)...\n`))

  // 1. Sisyphus orchestrator (skill)
  currentStep++
  addCounts(
    await runStep("Installing Sisyphus orchestrator", () =>
      copyDir(join(templates, "skills", "xx"), join(dest, "skills", "xx"), opts)
    , currentStep, totalSteps)
  )

  // 2. Selected agents
  currentStep++
  addCounts(
    await runStep(`Installing selected agents (${selectedModules.agents.length} agents)`, async () => {
      let copied = 0
      let skipped = 0

      for (const agentId of selectedModules.agents) {
        const agent = MODULES.agents[agentId]
        if (!agent) continue

        // Copy agent definition
        const agentResult = await copyFile(
          join(templates, agent.components[0].src),
          join(dest, agent.components[0].dest),
          opts
        )
        copied += agentResult.copied
        skipped += agentResult.skipped
      }

      return { copied, skipped }
    }, currentStep, totalSteps)
  )

  // 3. Wrapper binary
  currentStep++
  addCounts(
    await runStep("Installing wrapper binary", () =>
      installWrapper(opts)
    , currentStep, totalSteps)
  )

  // 4. Configuration files
  currentStep++
  addCounts(
    await runStep("Installing configuration files", () =>
      copyFile(
        join(templates, "config", "models.json.example"),
        join(codeagentDir, "models.json"),
        opts
      )
    , currentStep, totalSteps)
  )

  // 5. Wrapper role prompts
  currentStep++
  addCounts(
    await runStep("Installing wrapper role prompts", async () => {
      let copied = 0
      let skipped = 0

      for (const agentId of selectedModules.agents) {
        const agent = MODULES.agents[agentId]
        if (!agent || agent.components.length < 2) continue

        const promptComponent = agent.components[1]
        const result = await copyFile(
          join(templates, promptComponent.src),
          join(codeagentDir, "agents", `${agent.name.toLowerCase()}.md`),
          opts
        )
        copied += result.copied
        skipped += result.skipped
      }

      return { copied, skipped }
    }, currentStep, totalSteps)
  )

  // 6. Optional: Pre-bash hook
  if (selectedModules.optional.includes('pre-bash-hook')) {
    currentStep++
    addCounts(
      await runStep("Installing pre-bash hook", () =>
        copyDir(join(templates, "hooks"), join(dest, "hooks"), opts)
      , currentStep, totalSteps)
    )
  }

  // 7. Disable managed CLAUDE.md
  currentStep++
  addCounts(
    await runStep("Disabling managed CLAUDE.md", () =>
      disableManagedClaudeMd(join(dest, "CLAUDE.md"), opts)
    , currentStep, totalSteps)
  )

  return { totalCopied, totalSkipped, failures }
}

async function runFinalVerification(installDir, selectedModules, configuredBackends) {
  console.log(ansis.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))
  console.log('Running final checks...\n')

  const checks = []

  // Check installation directory
  checks.push({
    label: `Installation directory: ${installDir.replace(homedir(), '~')}`,
    status: existsSync(installDir) ? 'ok' : 'error',
  })

  // Check installed agents
  const agentCount = selectedModules.agents.length
  checks.push({
    label: `Agents installed: ${agentCount}`,
    status: agentCount > 0 ? 'ok' : 'warning',
  })

  // Check wrapper binary
  const wrapperPath = join(homedir(), '.claude', 'bin',
    process.platform === 'win32' ? 'codeagent-wrapper.exe' : 'codeagent-wrapper')
  checks.push({
    label: 'Wrapper binary',
    status: existsSync(wrapperPath) ? 'ok' : 'error',
  })

  // Check configured backends
  const requiredBackends = getRequiredBackends(selectedModules.agents)
  const configuredCount = configuredBackends.length
  const totalRequired = requiredBackends.length
  checks.push({
    label: `Configured backends: ${configuredCount}/${totalRequired}`,
    status: configuredCount === totalRequired ? 'ok' : 'warning',
  })

  // Display check results
  for (const check of checks) {
    const icon = check.status === 'ok' ? '✓' : check.status === 'warning' ? '⚠' : '✗'
    const color = check.status === 'ok' ? ansis.green : check.status === 'warning' ? ansis.yellow : ansis.red
    console.log(`  ${color(icon)} ${check.label}`)
  }

  // Display missing backends
  const missingBackends = requiredBackends.filter(b => !configuredBackends.includes(b))
  if (missingBackends.length > 0) {
    console.log(ansis.yellow(`  ⚠ Missing backends: ${missingBackends.join(', ')}`))
  }

  console.log(ansis.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))
  console.log(ansis.bold.green('🎉 Installation complete!\n'))

  // Display next steps
  printNextSteps(missingBackends, selectedModules)
}

function printNextSteps(missingBackends, selectedModules) {
  console.log(ansis.bold('What\'s next?\n'))

  console.log(ansis.yellow('  1.') + ' Restart Claude Code to load the new agents\n')

  console.log(ansis.yellow('  2.') + ' In any Claude Code session, type: ' + ansis.cyan('/xx'))
  console.log('     This activates Sisyphus orchestration\n')

  console.log(ansis.yellow('  3.') + ' Try asking: "Help me refactor this code"')
  console.log('     Sisyphus will route to the best agent automatically\n')

  if (missingBackends.length > 0) {
    console.log(ansis.yellow('  ⚠ Note:') + ' Some agents won\'t work until you:')
    for (const backend of missingBackends) {
      const agents = getAgentsUsingBackend(backend, selectedModules.agents)
      console.log(`     • Configure ${backend} (used by ${agents.join(', ')})`)
    }
    console.log(`     • Run: ${ansis.cyan('xxcoder config')}\n`)
  }

  console.log(ansis.dim('Need help? Run: xxcoder --help\n'))
}

export async function init({ installDir = "", interactive = true, skipConfig = false } = {}) {
  printBanner()

  // Non-interactive mode (legacy behavior)
  if (!interactive) {
    return initLegacy({ installDir })
  }

  // Interactive mode with wizard
  printWelcome()

  const { ready } = await inquirer.prompt([{
    type: 'confirm',
    name: 'ready',
    message: 'Ready to begin?',
    default: true,
  }])

  if (!ready) {
    console.log(ansis.dim('\nInstallation cancelled.\n'))
    return
  }

  // Step 1: Select installation location
  const dest = installDir || await promptInstallDir()

  // Step 2: Select modules
  const selectedModules = await promptModuleSelection()

  // Step 3: Install components
  const { totalCopied, totalSkipped, failures } = await installComponents(dest, selectedModules)

  // Display installation summary
  console.log()
  if (failures.length > 0) {
    console.log(ansis.bold.yellow("  Installation completed with errors.\n"))
    console.log(ansis.red(`  Failed steps: ${failures.length}`))
    for (const failure of failures) {
      console.log(ansis.red(`  - ${failure.label}: ${failure.error}`))
    }
  } else {
    console.log(ansis.bold.green("  Installation complete!\n"))
  }
  console.log(`  Files:   ${ansis.green(`${totalCopied} installed`)}${totalSkipped ? ansis.dim(`, ${totalSkipped} skipped`) : ""}`)

  // Step 4: Backend configuration wizard
  let configuredBackends = []
  if (!skipConfig) {
    const requiredBackends = getRequiredBackends(selectedModules.agents)
    configuredBackends = await runBackendConfigWizard(requiredBackends, selectedModules.agents)
  }

  // Step 5: Final verification and next steps
  await runFinalVerification(dest, selectedModules, configuredBackends)

  // Wait for user to acknowledge
  await inquirer.prompt([{
    type: 'input',
    name: 'exit',
    message: 'Press Enter to exit...',
  }])
}

// Legacy non-interactive installation (for --user, --project flags)
async function initLegacy({ installDir }) {
  const dest = installDir || getDefaultInstallDir()

  const totalSteps = 7
  console.log(ansis.dim(`\nInstalling to ${ansis.cyan(dest)} (overwrite mode)`))
  console.log(ansis.dim(`Installing (${totalSteps} steps)...\n`))

  const templates = getTemplatesDir()
  const codeagentDir = join(homedir(), ".codeagent")
  const opts = { force: true, silent: true }
  let totalCopied = 0
  let totalSkipped = 0
  const failures = []

  function addCounts(r) {
    totalCopied += r.copied
    totalSkipped += r.skipped
    if (r.ok === false) failures.push(r)
  }

  // Install all components (legacy full installation)
  addCounts(
    await runStep("Installing subagent definitions", () =>
      copyDir(join(templates, "agents", "xx"), join(dest, "agents", "xx"), opts)
    , 1, totalSteps)
  )

  addCounts(
    await runStep("Installing xx orchestration skill", () =>
      copyDir(join(templates, "skills", "xx"), join(dest, "skills", "xx"), opts)
    , 2, totalSteps)
  )

  addCounts(
    await runStep("Installing models.json", () =>
      copyFile(
        join(templates, "config", "models.json.example"),
        join(codeagentDir, "models.json"),
        opts
      )
    , 3, totalSteps)
  )

  addCounts(
    await runStep("Installing wrapper role prompts", () =>
      copyDir(join(templates, "prompts"), join(codeagentDir, "agents"), opts)
    , 4, totalSteps)
  )

  addCounts(
    await runStep("Installing pre-bash hook", () =>
      copyDir(join(templates, "hooks"), join(dest, "hooks"), opts)
    , 5, totalSteps)
  )

  addCounts(
    await runStep("Disabling managed CLAUDE.md", () =>
      disableManagedClaudeMd(join(dest, "CLAUDE.md"), opts)
    , 6, totalSteps)
  )

  addCounts(
    await runStep("Installing codeagent-wrapper binary", () =>
      installWrapper(opts)
    , 7, totalSteps)
  )

  // Summary
  console.log()
  if (failures.length > 0) {
    console.log(ansis.bold.yellow("  Installation completed with errors.\n"))
  } else {
    console.log(ansis.bold("  Installation complete!\n"))
  }
  console.log(`  Path:    ${ansis.cyan(dest)}`)
  console.log(`  Files:   ${ansis.green(`${totalCopied} installed`)}${totalSkipped ? ansis.dim(`, ${totalSkipped} skipped`) : ""}`)
  if (failures.length > 0) {
    console.log(ansis.red(`  Failed steps: ${failures.length}`))
    for (const failure of failures) {
      console.log(ansis.red(`  - ${failure.label}: ${failure.error}`))
    }
  }
  console.log()
  console.log(ansis.yellow("  Next steps:"))
  console.log(ansis.yellow("  1.") + ` Run ${ansis.cyan("xxcoder doctor")} to check backend CLIs`)
  console.log(ansis.yellow("  2.") + ` Edit ${ansis.dim("~/.codeagent/models.json")} and configure API keys for your backends`)
  console.log(ansis.yellow("  3.") + " Restart Claude Code to reload updated skills and subagents")
  console.log(ansis.yellow("  4.") + ` In each session, run ${ansis.cyan("/xx")} to activate Sisyphus orchestration manually`)
  console.log(ansis.yellow("  5.") + ` If wrapper command is not in PATH, use ${ansis.dim("~/.claude/bin/codeagent-wrapper")} (subagents now auto-detect this path)`)
  console.log()
}
