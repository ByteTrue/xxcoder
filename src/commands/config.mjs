/**
 * Configuration management commands for xxcoder
 */

import { join } from "node:path"
import { homedir } from "node:os"
import { existsSync, readFileSync } from "node:fs"
import inquirer from "inquirer"
import ansis from "ansis"
import { getBackendInfo } from "../utils/modules.mjs"
import {
  readModelsConfig,
  saveModelsConfig,
  checkBackendCLI,
  getDefaultConfig,
} from "../utils/config-wizard.mjs"

/**
 * Show current configuration
 */
export async function configShow({ backend = null } = {}) {
  const config = readModelsConfig()

  if (!config) {
    console.log(ansis.yellow('\n⚠ No configuration found.'))
    console.log(ansis.dim('Run: xxcoder init to create configuration\n'))
    return
  }

  console.log(ansis.bold('\nCurrent Configuration:\n'))
  console.log(`Default backend: ${ansis.cyan(config.default_backend || 'codex')}`)
  console.log()

  const backends = backend ? [backend] : Object.keys(config.backends || {})

  for (const backendName of backends) {
    const backendConfig = config.backends?.[backendName]
    if (!backendConfig) {
      console.log(ansis.yellow(`⚠ Backend "${backendName}" not found in config`))
      continue
    }

    const info = getBackendInfo(backendName)
    const displayName = info?.displayName || backendName

    console.log(ansis.bold(`${displayName}:`))

    // API key (masked)
    const hasApiKey = backendConfig.api_key && backendConfig.api_key.trim() !== ''
    const apiKeyDisplay = hasApiKey
      ? ansis.green('✓ Configured') + ansis.dim(` (${backendConfig.api_key.substring(0, 8)}...)`)
      : ansis.yellow('✗ Not configured')
    console.log(`  API Key:  ${apiKeyDisplay}`)

    // Model
    console.log(`  Model:    ${ansis.cyan(backendConfig.model || 'not set')}`)

    // Timeout
    console.log(`  Timeout:  ${backendConfig.timeout || 300}s`)

    console.log()
  }

  console.log(ansis.dim(`Config file: ~/.codeagent/models.json\n`))
}

/**
 * Setup/configure a specific backend
 */
export async function configSetup({ backend }) {
  if (!backend) {
    console.log(ansis.red('\n✗ Error: Backend name is required'))
    console.log(ansis.dim('Usage: xxcoder config setup <backend>\n'))
    console.log('Available backends: codex, claude, gemini, opencode\n')
    return
  }

  const info = getBackendInfo(backend)
  if (!info) {
    console.log(ansis.red(`\n✗ Error: Unknown backend "${backend}"`))
    console.log('Available backends: codex, claude, gemini, opencode\n')
    return
  }

  console.log(ansis.bold(`\n━━━ Configuring: ${info.displayName} ━━━\n`))

  // Check if CLI is installed
  const spinner = ansis.dim('  Checking CLI...')
  process.stdout.write(spinner)

  const cliInstalled = await checkBackendCLI(backend)
  process.stdout.write('\r' + ' '.repeat(spinner.length) + '\r')

  if (!cliInstalled) {
    console.log(ansis.yellow(`✗ ${info.displayName} CLI not found in PATH\n`))
    console.log(`  To install ${backend}:`)
    console.log(ansis.cyan(`    ${info.installCommand}\n`))

    const { continueAnyway } = await inquirer.prompt([{
      type: 'confirm',
      name: 'continueAnyway',
      message: 'Continue configuration anyway?',
      default: false,
    }])

    if (!continueAnyway) {
      console.log(ansis.dim('\nConfiguration cancelled.\n'))
      return
    }
  } else {
    console.log(ansis.green(`✓ ${info.displayName} CLI found\n`))
  }

  // Load or create config
  let config = readModelsConfig()
  if (!config) {
    config = getDefaultConfig()
  }

  // Ensure backend config exists
  if (!config.backends[backend]) {
    config.backends[backend] = {
      api_key: "",
      model: info.defaultModel,
      timeout: 300,
    }
  }

  // API Key configuration
  const currentKey = config.backends[backend].api_key
  const hasCurrentKey = currentKey && currentKey.trim() !== ''

  if (hasCurrentKey) {
    console.log(ansis.dim(`Current API key: ${currentKey.substring(0, 8)}...\n`))
  }

  const { updateApiKey } = await inquirer.prompt([{
    type: 'confirm',
    name: 'updateApiKey',
    message: hasCurrentKey ? 'Update API key?' : 'Configure API key?',
    default: !hasCurrentKey,
  }])

  if (updateApiKey) {
    const { apiKey } = await inquirer.prompt([{
      type: 'password',
      name: 'apiKey',
      message: `Enter your ${info.displayName} API key:`,
      mask: '*',
      validate: (v) => v.trim() ? true : 'API key cannot be empty',
    }])

    config.backends[backend].api_key = apiKey.trim()
    console.log(ansis.green('  ✓ API key saved\n'))
  } else {
    console.log(ansis.dim('  API key unchanged\n'))
  }

  // Model selection
  const currentModel = config.backends[backend].model

  const { updateModel } = await inquirer.prompt([{
    type: 'confirm',
    name: 'updateModel',
    message: `Update model? (current: ${currentModel})`,
    default: false,
  }])

  if (updateModel) {
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
      default: currentModel || info.defaultModel,
    }])

    if (model === 'custom') {
      const { customModel } = await inquirer.prompt([{
        type: 'input',
        name: 'customModel',
        message: 'Enter custom model ID:',
        validate: (v) => v.trim() ? true : 'Model ID cannot be empty',
      }])
      config.backends[backend].model = customModel.trim()
    } else {
      config.backends[backend].model = model
    }

    console.log(ansis.green('  ✓ Model updated\n'))
  } else {
    console.log(ansis.dim('  Model unchanged\n'))
  }

  // Save configuration
  const saved = saveModelsConfig(config)
  if (saved) {
    console.log(ansis.green(`✓ Configuration saved to ${ansis.dim('~/.codeagent/models.json')}\n`))
  } else {
    console.log(ansis.red('✗ Failed to save configuration\n'))
  }
}

/**
 * Validate configuration file
 */
export async function configValidate() {
  console.log(ansis.bold('\nValidating configuration...\n'))

  const configPath = join(homedir(), '.codeagent', 'models.json')

  // Check if file exists
  if (!existsSync(configPath)) {
    console.log(ansis.red('✗ Configuration file not found'))
    console.log(ansis.dim(`  Expected: ${configPath}`))
    console.log(ansis.yellow('\n  Run: xxcoder init to create configuration\n'))
    return false
  }

  console.log(ansis.green('✓ Configuration file exists'))

  // Try to parse JSON
  let config
  try {
    const content = readFileSync(configPath, 'utf-8')
    config = JSON.parse(content)
    console.log(ansis.green('✓ Valid JSON format'))
  } catch (err) {
    console.log(ansis.red('✗ Invalid JSON format'))
    console.log(ansis.dim(`  Error: ${err.message}`))
    console.log(ansis.yellow('\n  Fix the JSON syntax or run: xxcoder init --user\n'))
    return false
  }

  // Validate structure
  const issues = []

  if (!config.backends || typeof config.backends !== 'object') {
    issues.push('Missing or invalid "backends" object')
  }

  if (config.default_backend && !config.backends?.[config.default_backend]) {
    issues.push(`Default backend "${config.default_backend}" not found in backends`)
  }

  // Validate each backend
  const backends = Object.keys(config.backends || {})
  for (const backend of backends) {
    const backendConfig = config.backends[backend]

    if (!backendConfig.model) {
      issues.push(`Backend "${backend}": missing model`)
    }

    if (!backendConfig.api_key || backendConfig.api_key.trim() === '') {
      issues.push(`Backend "${backend}": API key not configured`)
    }

    if (backendConfig.timeout && (typeof backendConfig.timeout !== 'number' || backendConfig.timeout <= 0)) {
      issues.push(`Backend "${backend}": invalid timeout value`)
    }
  }

  if (issues.length === 0) {
    console.log(ansis.green('✓ Configuration structure is valid'))
    console.log(ansis.green(`✓ ${backends.length} backend(s) configured`))
    console.log()
    return true
  } else {
    console.log(ansis.yellow(`⚠ Found ${issues.length} issue(s):`))
    for (const issue of issues) {
      console.log(ansis.yellow(`  • ${issue}`))
    }
    console.log()
    return false
  }
}

/**
 * Edit configuration file in default editor
 */
export async function configEdit() {
  const configPath = join(homedir(), '.codeagent', 'models.json')

  if (!existsSync(configPath)) {
    console.log(ansis.yellow('\n⚠ Configuration file not found.'))
    console.log(ansis.dim('Run: xxcoder init to create configuration\n'))
    return
  }

  const editor = process.env.EDITOR || process.env.VISUAL || 'nano'

  console.log(ansis.dim(`\nOpening ${configPath} in ${editor}...\n`))

  const { execSync } = await import('node:child_process')
  try {
    execSync(`${editor} "${configPath}"`, { stdio: 'inherit' })
    console.log(ansis.green('\n✓ Configuration file closed\n'))
  } catch (err) {
    console.log(ansis.red('\n✗ Error opening editor'))
    console.log(ansis.dim(`  ${err.message}\n`))
  }
}

/**
 * Reset configuration to defaults
 */
export async function configReset() {
  const configPath = join(homedir(), '.codeagent', 'models.json')

  console.log(ansis.yellow('\n⚠ Warning: This will reset your configuration to defaults.'))
  console.log(ansis.dim('  All API keys and custom settings will be lost.\n'))

  const { confirm } = await inquirer.prompt([{
    type: 'confirm',
    name: 'confirm',
    message: 'Are you sure you want to reset configuration?',
    default: false,
  }])

  if (!confirm) {
    console.log(ansis.dim('\nReset cancelled.\n'))
    return
  }

  const config = getDefaultConfig()
  const saved = saveModelsConfig(config)

  if (saved) {
    console.log(ansis.green('\n✓ Configuration reset to defaults'))
    console.log(ansis.dim(`  File: ${configPath}\n`))
    console.log(ansis.yellow('  Run: xxcoder config setup <backend> to configure backends\n'))
  } else {
    console.log(ansis.red('\n✗ Failed to reset configuration\n'))
  }
}
