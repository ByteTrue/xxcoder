/**
 * Backend configuration wizard for interactive installation
 */

import { execFileSync } from "node:child_process"
import { homedir } from "node:os"
import { join } from "node:path"
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs"
import inquirer from "inquirer"
import ansis from "ansis"
import { getBackendInfo, getAgentsUsingBackend } from "./modules.mjs"

/**
 * Check if a backend CLI is installed and available
 */
export async function checkBackendCLI(backendName) {
  const info = getBackendInfo(backendName)
  if (!info) return false

  try {
    execFileSync(info.cliCommand, info.checkArgs, {
      timeout: 5000,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    })
    return true
  } catch {
    return false
  }
}

/**
 * Read models.json configuration file
 */
export function readModelsConfig() {
  const configPath = join(homedir(), ".codeagent", "models.json")

  if (!existsSync(configPath)) {
    return null
  }

  try {
    const content = readFileSync(configPath, "utf-8")
    return JSON.parse(content)
  } catch (err) {
    console.log(ansis.yellow(`⚠ Warning: Could not read ${configPath}`))
    console.log(ansis.dim(`  ${err.message}`))
    return null
  }
}

/**
 * Save models.json configuration file
 */
export function saveModelsConfig(config) {
  const configPath = join(homedir(), ".codeagent", "models.json")
  const configDir = join(homedir(), ".codeagent")

  // Ensure directory exists
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true })
  }

  try {
    writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8")
    return true
  } catch (err) {
    console.log(ansis.red(`✗ Error: Could not save ${configPath}`))
    console.log(ansis.dim(`  ${err.message}`))
    return false
  }
}

/**
 * Get default configuration structure
 */
export function getDefaultConfig() {
  return {
    default_backend: "codex",
    backends: {
      codex: {
        api_key: "",
        model: "gpt-5.3-codex",
        timeout: 300,
      },
      claude: {
        api_key: "",
        model: "claude-opus-4-6",
        timeout: 300,
      },
      gemini: {
        api_key: "",
        model: "gemini-3-flash",
        timeout: 300,
      },
      opencode: {
        api_key: "",
        model: "opencode/kimi-k2.5-free",
        timeout: 300,
      },
    },
  }
}

/**
 * Configure a single backend interactively
 */
async function configureBackend(backendName, config, selectedAgents) {
  const info = getBackendInfo(backendName)
  if (!info) {
    console.log(ansis.red(`✗ Unknown backend: ${backendName}`))
    return false
  }

  console.log(ansis.bold(`\n━━━ Configuring: ${info.displayName} ━━━\n`))

  const agents = getAgentsUsingBackend(backendName, selectedAgents)
  console.log(ansis.dim(`The ${backendName} backend is used by: ${agents.join(', ')}\n`))

  // 1. Check if CLI is installed
  const spinner = ansis.dim('  Checking CLI...')
  process.stdout.write(spinner)

  const cliInstalled = await checkBackendCLI(backendName)
  process.stdout.write('\r' + ' '.repeat(spinner.length) + '\r')

  if (!cliInstalled) {
    console.log(ansis.yellow(`✗ ${info.displayName} CLI not found in PATH\n`))
    console.log(`  To install ${backendName}:`)
    console.log(ansis.cyan(`    ${info.installCommand}\n`))

    const { skip } = await inquirer.prompt([{
      type: 'confirm',
      name: 'skip',
      message: `Would you like to skip ${backendName} configuration for now?`,
      default: true,
    }])

    if (skip) {
      console.log(ansis.yellow(`  ⚠ Skipped. Configure later with: ${ansis.cyan(`xxcoder config setup ${backendName}`)}`))
      return false
    }
  } else {
    console.log(ansis.green(`✓ ${info.displayName} CLI found\n`))
  }

  // Ensure backend config exists
  if (!config.backends[backendName]) {
    config.backends[backendName] = {
      api_key: "",
      model: info.defaultModel,
      timeout: 300,
    }
  }

  // 2. API Key configuration
  const { hasApiKey } = await inquirer.prompt([{
    type: 'confirm',
    name: 'hasApiKey',
    message: `Do you have an API key for ${info.displayName}?`,
    default: true,
  }])

  if (hasApiKey) {
    const { apiKey } = await inquirer.prompt([{
      type: 'password',
      name: 'apiKey',
      message: `Enter your ${info.displayName} API key:`,
      mask: '*',
      validate: (v) => v.trim() ? true : 'API key cannot be empty',
    }])

    config.backends[backendName].api_key = apiKey.trim()
    console.log(ansis.green('  ✓ API key saved\n'))
  } else {
    console.log(ansis.yellow(`  ⚠ Skipped API key.`))
    console.log(ansis.dim(`    Get one from: ${info.apiKeyUrl}\n`))
    return false
  }

  // 3. Model selection
  const modelChoices = info.availableModels.map(m => ({
    name: m === info.defaultModel ? `${m} (recommended)` : m,
    value: m,
  }))

  modelChoices.push({ name: 'Custom model ID...', value: 'custom' })

  const { model } = await inquirer.prompt([{
    type: 'list',
    name: 'model',
    message: 'Which model would you like to use?',
    choices: modelChoices,
    default: info.defaultModel,
  }])

  if (model === 'custom') {
    const { customModel } = await inquirer.prompt([{
      type: 'input',
      name: 'customModel',
      message: 'Enter custom model ID:',
      validate: (v) => v.trim() ? true : 'Model ID cannot be empty',
    }])
    config.backends[backendName].model = customModel.trim()
  } else {
    config.backends[backendName].model = model
  }

  console.log(ansis.green('  ✓ Configuration saved'))
  return true
}

/**
 * Run the complete backend configuration wizard
 */
export async function runBackendConfigWizard(requiredBackends, selectedAgents) {
  console.log(ansis.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))
  console.log('Now let\'s configure your backends.\n')

  if (requiredBackends.length === 0) {
    console.log(ansis.dim('No backends need configuration.\n'))
    return []
  }

  console.log('Based on your selected agents, you need:')
  for (const backend of requiredBackends) {
    const agents = getAgentsUsingBackend(backend, selectedAgents)
    const info = getBackendInfo(backend)
    console.log(`  • ${info.displayName} (for ${agents.join(', ')})`)
  }
  console.log()

  const { shouldConfigure } = await inquirer.prompt([{
    type: 'confirm',
    name: 'shouldConfigure',
    message: 'Would you like to configure backends now?',
    default: true,
  }])

  if (!shouldConfigure) {
    console.log(ansis.yellow('\n⚠ Skipped backend configuration.'))
    console.log(ansis.dim('You can configure later with: xxcoder config\n'))
    return []
  }

  // Load or create config
  let config = readModelsConfig()
  if (!config) {
    config = getDefaultConfig()
  }

  const configuredBackends = []

  // Configure each backend
  for (const backend of requiredBackends) {
    const success = await configureBackend(backend, config, selectedAgents)
    if (success) {
      configuredBackends.push(backend)
    }
  }

  // Save configuration
  if (configuredBackends.length > 0) {
    const saved = saveModelsConfig(config)
    if (saved) {
      console.log(ansis.green(`\n✓ Configuration saved to ${ansis.dim('~/.codeagent/models.json')}`))
    }
  }

  return configuredBackends
}
