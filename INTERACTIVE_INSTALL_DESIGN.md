# 交互式安装体验优化设计

## 当前问题分析

### 现有流程
1. 用户运行 `xxcoder` 进入交互菜单
2. 选择 "Install xxcoder"
3. 选择安装位置（用户目录/项目目录/自定义）
4. 自动安装所有组件（7 个步骤）
5. 显示后续步骤提示

### 主要问题
1. **缺少模块化选择** - 强制安装所有组件，无法选择性安装
2. **配置体验差** - 安装后需要手动编辑 JSON 文件配置 API keys
3. **缺少验证反馈** - 安装后不知道是否真的可用
4. **后续步骤不清晰** - 5 个步骤的文字说明，用户容易忘记
5. **无引导式配置** - 新手不知道如何配置各个后端

---

## 优化设计方案

### 核心理念
**"安装即可用"** - 通过交互式向导，让用户在安装过程中完成所有必要配置，安装完成后立即可用。

---

## 新的交互式安装流程

### 阶段 1: 欢迎与环境检查
```
╔══════════════════════════════════════════╗
║     xxcoder - Multi-Model Orchestration  ║
║     for Claude Code                      ║
╚══════════════════════════════════════════╝

Welcome to xxcoder installer!

This wizard will guide you through:
  • Selecting installation location
  • Choosing which agents to install
  • Configuring backend API keys
  • Verifying your setup

Let's get started!

? Ready to begin? (Y/n)
```

### 阶段 2: 安装位置选择（保持现有）
```
? Where would you like to install xxcoder?
  ❯ User directory (~/.claude) — Global, all projects
    Project directory (./.claude) — Current project only
    Custom path...
```

### 阶段 3: 模块选择（新增）
```
? Which components would you like to install?

Core Components (required):
  ✓ Sisyphus orchestrator (xx skill)
  ✓ Wrapper binary (codeagent-wrapper)
  ✓ Configuration files

Agent Modules (select which ones you need):
  ◉ xx-oracle (GPT-5.2) — Architecture consultation, code review
  ◉ xx-developer (GPT-5.3-codex) — Deep implementation
  ◉ xx-explorer (kimi-k2.5) — Fast codebase search
  ◉ xx-librarian (kimi-k2.5) — Documentation search
  ◉ xx-looker (Gemini-3-flash) — Screenshot/diagram analysis
  ◯ xx-planner (GPT-5.2) — Pre-planning
  ◯ xx-reviewer (GPT-5.2) — Plan verification

Additional Components:
  ◉ Pre-bash safety hook
  ◯ Example prompts and templates

? Select/deselect with Space, confirm with Enter
```

### 阶段 4: 后端配置向导（新增）
```
Installing components...
[1/5] ✓ Installing Sisyphus orchestrator
[2/5] ✓ Installing selected agents (5 agents)
[3/5] ✓ Installing wrapper binary
[4/5] ✓ Installing configuration files
[5/5] ✓ Installing pre-bash hook

Installation complete!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Now let's configure your backends.

Based on your selected agents, you need:
  • codex (for xx-developer)
  • opencode (for xx-explorer, xx-librarian)
  • gemini (for xx-looker)

? Would you like to configure backends now? (Y/n)
```

#### 4.1 后端配置 - Codex
```
━━━ Configuring: codex ━━━

The codex backend is used by: xx-developer

? Do you have codex CLI installed? (Y/n)
  ✓ Checking... codex-cli 0.104.0 found

? Do you have an API key for codex? (Y/n)

? Enter your codex API key: [hidden input]
  ✓ API key saved

? Which model would you like to use?
  ❯ gpt-5.3-codex (default, recommended)
    gpt-5.2
    gpt-4o
    Custom model ID...

  ✓ Configuration saved
```

#### 4.2 后端配置 - OpenCode
```
━━━ Configuring: opencode ━━━

The opencode backend is used by: xx-explorer, xx-librarian

? Do you have opencode CLI installed? (Y/n)
  ✗ opencode not found in PATH

  To install opencode:
    go install github.com/opencode-ai/opencode@latest

? Would you like to skip opencode configuration for now? (Y/n)
  ⚠ Skipped. You can configure it later with: xxcoder config
```

### 阶段 5: 验证与完成
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Running final checks...

  ✓ Installation directory: ~/.claude
  ✓ Agents installed: 5
  ✓ Wrapper binary: OK
  ✓ Configured backends: 2/3
  ⚠ Missing backends: opencode

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎉 Installation complete!

What's next?

  1. Restart Claude Code to load the new agents

  2. In any Claude Code session, type: /xx
     This activates Sisyphus orchestration

  3. Try asking: "Help me refactor this code"
     Sisyphus will route to the best agent automatically

  ⚠ Note: xx-explorer and xx-librarian won't work until you:
     • Install opencode CLI
     • Run: xxcoder config setup opencode

Need help? Run: xxcoder --help

Press Enter to exit...
```

---

## 技术实现方案

### 1. 模块化安装架构

#### 定义模块清单
```javascript
// src/utils/modules.mjs

export const MODULES = {
  core: {
    id: 'core',
    name: 'Core Components',
    required: true,
    description: 'Sisyphus orchestrator, wrapper binary, config files',
    components: [
      { type: 'skill', path: 'skills/xx' },
      { type: 'binary', path: 'bin/codeagent-wrapper' },
      { type: 'config', path: 'config/models.json.example' },
    ]
  },

  agents: {
    'xx-oracle': {
      id: 'xx-oracle',
      name: 'Oracle (GPT-5.2)',
      description: 'Architecture consultation, code review, complex debugging',
      backend: 'codex',
      model: 'gpt-5.2',
      recommended: true,
      components: [
        { type: 'agent', path: 'agents/xx/xx-oracle.md' },
        { type: 'prompt', path: 'prompts/oracle.md' },
      ]
    },

    'xx-developer': {
      id: 'xx-developer',
      name: 'Developer (GPT-5.3-codex)',
      description: 'Autonomous deep implementation',
      backend: 'codex',
      model: 'gpt-5.3-codex',
      recommended: true,
      components: [
        { type: 'agent', path: 'agents/xx/xx-developer.md' },
        { type: 'prompt', path: 'prompts/developer.md' },
      ]
    },

    // ... 其他 agents
  },

  optional: {
    'pre-bash-hook': {
      id: 'pre-bash-hook',
      name: 'Pre-bash Safety Hook',
      description: 'Blocks dangerous shell commands',
      recommended: true,
      components: [
        { type: 'hook', path: 'hooks/pre-bash.py' },
      ]
    },
  }
}

export function getRequiredBackends(selectedAgents) {
  const backends = new Set()
  for (const agentId of selectedAgents) {
    const agent = MODULES.agents[agentId]
    if (agent?.backend) backends.add(agent.backend)
  }
  return Array.from(backends)
}
```

### 2. 交互式模块选择

```javascript
// src/commands/init.mjs

async function promptModuleSelection() {
  console.log(ansis.bold('\n? Which components would you like to install?\n'))

  console.log(ansis.dim('Core Components (required):'))
  console.log('  ✓ Sisyphus orchestrator (xx skill)')
  console.log('  ✓ Wrapper binary (codeagent-wrapper)')
  console.log('  ✓ Configuration files\n')

  const agentChoices = Object.values(MODULES.agents).map(agent => ({
    name: `${agent.name} — ${agent.description}`,
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
    }
  }])

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
```

### 3. 后端配置向导

```javascript
// src/commands/config-wizard.mjs

export async function runBackendConfigWizard(requiredBackends) {
  console.log(ansis.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))
  console.log('Now let\'s configure your backends.\n')

  console.log('Based on your selected agents, you need:')
  for (const backend of requiredBackends) {
    const agents = getAgentsUsingBackend(backend)
    console.log(`  • ${backend} (for ${agents.join(', ')})`)
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
    return
  }

  const config = await readModelsConfig() || getDefaultConfig()

  for (const backend of requiredBackends) {
    await configureBackend(backend, config)
  }

  await saveModelsConfig(config)
}

async function configureBackend(backendName, config) {
  console.log(ansis.bold(`\n━━━ Configuring: ${backendName} ━━━\n`))

  const agents = getAgentsUsingBackend(backendName)
  console.log(ansis.dim(`The ${backendName} backend is used by: ${agents.join(', ')}\n`))

  // 1. 检查 CLI 是否安装
  const cliInstalled = await checkBackendCLI(backendName)

  if (!cliInstalled) {
    console.log(ansis.yellow(`✗ ${backendName} CLI not found in PATH\n`))
    console.log(`To install ${backendName}:`)
    console.log(ansis.cyan(`  ${getInstallCommand(backendName)}\n`))

    const { skip } = await inquirer.prompt([{
      type: 'confirm',
      name: 'skip',
      message: `Would you like to skip ${backendName} configuration for now?`,
      default: true,
    }])

    if (skip) {
      console.log(ansis.yellow(`⚠ Skipped. Configure later with: xxcoder config setup ${backendName}`))
      return
    }
  } else {
    console.log(ansis.green(`✓ ${backendName} CLI found\n`))
  }

  // 2. API Key 配置
  const { hasApiKey } = await inquirer.prompt([{
    type: 'confirm',
    name: 'hasApiKey',
    message: `Do you have an API key for ${backendName}?`,
    default: true,
  }])

  if (hasApiKey) {
    const { apiKey } = await inquirer.prompt([{
      type: 'password',
      name: 'apiKey',
      message: `Enter your ${backendName} API key:`,
      mask: '*',
      validate: (v) => v.trim() ? true : 'API key cannot be empty',
    }])

    config.backends[backendName].api_key = apiKey.trim()
    console.log(ansis.green('✓ API key saved\n'))
  } else {
    console.log(ansis.yellow(`⚠ Skipped API key. Get one from: ${getApiKeyUrl(backendName)}\n`))
  }

  // 3. 模型选择
  const defaultModel = getDefaultModel(backendName)
  const modelChoices = getAvailableModels(backendName)

  const { model } = await inquirer.prompt([{
    type: 'list',
    name: 'model',
    message: 'Which model would you like to use?',
    choices: [
      ...modelChoices.map(m => ({
        name: m === defaultModel ? `${m} (default, recommended)` : m,
        value: m,
      })),
      { name: 'Custom model ID...', value: 'custom' },
    ],
    default: defaultModel,
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

  console.log(ansis.green('✓ Configuration saved'))
}
```

### 4. 最终验证

```javascript
// src/commands/init.mjs

async function runFinalVerification(installDir, selectedModules, configuredBackends) {
  console.log(ansis.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))
  console.log('Running final checks...\n')

  const checks = []

  // 检查安装目录
  checks.push({
    label: `Installation directory: ${installDir}`,
    status: existsSync(installDir) ? 'ok' : 'error',
  })

  // 检查已安装的 agents
  const agentCount = selectedModules.agents.length
  checks.push({
    label: `Agents installed: ${agentCount}`,
    status: agentCount > 0 ? 'ok' : 'warning',
  })

  // 检查 wrapper binary
  const wrapperPath = join(homedir(), '.claude', 'bin', 'codeagent-wrapper')
  checks.push({
    label: 'Wrapper binary',
    status: existsSync(wrapperPath) ? 'ok' : 'error',
  })

  // 检查已配置的后端
  const requiredBackends = getRequiredBackends(selectedModules.agents)
  const configuredCount = configuredBackends.length
  const totalRequired = requiredBackends.length
  checks.push({
    label: `Configured backends: ${configuredCount}/${totalRequired}`,
    status: configuredCount === totalRequired ? 'ok' : 'warning',
  })

  // 显示检查结果
  for (const check of checks) {
    const icon = check.status === 'ok' ? '✓' : check.status === 'warning' ? '⚠' : '✗'
    const color = check.status === 'ok' ? ansis.green : check.status === 'warning' ? ansis.yellow : ansis.red
    console.log(`  ${color(icon)} ${check.label}`)
  }

  // 显示缺失的后端
  const missingBackends = requiredBackends.filter(b => !configuredBackends.includes(b))
  if (missingBackends.length > 0) {
    console.log(ansis.yellow(`  ⚠ Missing backends: ${missingBackends.join(', ')}`))
  }

  console.log(ansis.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))
  console.log(ansis.bold.green('🎉 Installation complete!\n'))

  // 显示后续步骤
  printNextSteps(missingBackends)
}

function printNextSteps(missingBackends) {
  console.log(ansis.bold('What\'s next?\n'))

  console.log(ansis.yellow('  1.') + ' Restart Claude Code to load the new agents\n')
  console.log(ansis.yellow('  2.') + ' In any Claude Code session, type: ' + ansis.cyan('/xx'))
  console.log('     This activates Sisyphus orchestration\n')
  console.log(ansis.yellow('  3.') + ' Try asking: "Help me refactor this code"')
  console.log('     Sisyphus will route to the best agent automatically\n')

  if (missingBackends.length > 0) {
    console.log(ansis.yellow('  ⚠ Note:') + ' Some agents won\'t work until you:')
    for (const backend of missingBackends) {
      const agents = getAgentsUsingBackend(backend)
      console.log(`     • Configure ${backend} (used by ${agents.join(', ')})`)
    }
    console.log(`     • Run: ${ansis.cyan('xxcoder config setup ' + missingBackends[0])}\n`)
  }

  console.log(ansis.dim('Need help? Run: xxcoder --help\n'))

  await inquirer.prompt([{
    type: 'input',
    name: 'exit',
    message: 'Press Enter to exit...',
  }])
}
```

---

## 文件结构

```
src/
├── commands/
│   ├── init.mjs                    # 主安装命令（重构）
│   ├── config-wizard.mjs           # 后端配置向导（新建）
│   ├── interactive.mjs             # 交互式菜单（保持）
│   └── ...
├── utils/
│   ├── modules.mjs                 # 模块定义和管理（新建）
│   ├── backend-checker.mjs         # 后端检查工具（新建）
│   ├── config-manager.mjs          # 配置文件管理（新建）
│   └── ...
```

---

## 实施优先级

### P0 - 立即实施
1. 模块化安装架构（modules.mjs）
2. 交互式模块选择
3. 后端配置向导
4. 最终验证和反馈

### P1 - 短期实施
5. 配置管理命令（xxcoder config）
6. 后端测试功能
7. 安装后自动运行 doctor

### P2 - 中期实施
8. 安装模板保存（记住用户选择）
9. 增量安装（添加新 agents）
10. 配置导入/导出

---

## 用户体验目标

✅ **简单** - 向导式流程，无需查文档
✅ **灵活** - 可选择性安装需要的组件
✅ **即用** - 安装完成后立即可用
✅ **清晰** - 每一步都有明确的说明和反馈
✅ **可恢复** - 配置错误可以重新运行向导
