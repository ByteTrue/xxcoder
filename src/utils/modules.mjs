/**
 * Module definitions and management for xxcoder installation
 */

export const MODULES = {
  core: {
    id: 'core',
    name: 'Core Components',
    required: true,
    description: 'Sisyphus orchestrator, wrapper binary, config files',
    components: [
      { type: 'skill', src: 'skills/xx', dest: 'skills/xx' },
      { type: 'binary', src: 'bin/codeagent-wrapper', dest: 'bin/codeagent-wrapper' },
      { type: 'config', src: 'config/models.json.example', dest: '~/.codeagent/models.json' },
    ]
  },

  agents: {
    'xx-oracle': {
      id: 'xx-oracle',
      name: 'Oracle',
      displayName: 'Oracle (GPT-5.2)',
      description: 'Architecture consultation, code review, complex debugging',
      backend: 'codex',
      model: 'gpt-5.2',
      recommended: true,
      components: [
        { type: 'agent', src: 'agents/xx/xx-oracle.md', dest: 'agents/xx/xx-oracle.md' },
        { type: 'prompt', src: 'prompts/oracle.md', dest: '~/.codeagent/agents/oracle.md' },
      ]
    },

    'xx-developer': {
      id: 'xx-developer',
      name: 'Developer',
      displayName: 'Developer (GPT-5.3-codex)',
      description: 'Autonomous deep implementation',
      backend: 'codex',
      model: 'gpt-5.3-codex',
      recommended: true,
      components: [
        { type: 'agent', src: 'agents/xx/xx-developer.md', dest: 'agents/xx/xx-developer.md' },
        { type: 'prompt', src: 'prompts/developer.md', dest: '~/.codeagent/agents/developer.md' },
      ]
    },

    'xx-explorer': {
      id: 'xx-explorer',
      name: 'Explorer',
      displayName: 'Explorer (kimi-k2.5)',
      description: 'Fast codebase search, pattern discovery',
      backend: 'opencode',
      model: 'opencode/kimi-k2.5-free',
      recommended: true,
      components: [
        { type: 'agent', src: 'agents/xx/xx-explorer.md', dest: 'agents/xx/xx-explorer.md' },
        { type: 'prompt', src: 'prompts/explorer.md', dest: '~/.codeagent/agents/explorer.md' },
      ]
    },

    'xx-librarian': {
      id: 'xx-librarian',
      name: 'Librarian',
      displayName: 'Librarian (kimi-k2.5)',
      description: 'Documentation search, GitHub exploration',
      backend: 'opencode',
      model: 'opencode/kimi-k2.5-free',
      recommended: true,
      components: [
        { type: 'agent', src: 'agents/xx/xx-librarian.md', dest: 'agents/xx/xx-librarian.md' },
        { type: 'prompt', src: 'prompts/librarian.md', dest: '~/.codeagent/agents/librarian.md' },
      ]
    },

    'xx-looker': {
      id: 'xx-looker',
      name: 'Looker',
      displayName: 'Looker (Gemini-3-flash)',
      description: 'Screenshot/diagram/PDF analysis',
      backend: 'gemini',
      model: 'gemini-3-flash',
      recommended: true,
      components: [
        { type: 'agent', src: 'agents/xx/xx-looker.md', dest: 'agents/xx/xx-looker.md' },
        { type: 'prompt', src: 'prompts/looker.md', dest: '~/.codeagent/agents/looker.md' },
      ]
    },

    'xx-planner': {
      id: 'xx-planner',
      name: 'Planner',
      displayName: 'Planner (GPT-5.2)',
      description: 'Pre-planning, intent analysis',
      backend: 'codex',
      model: 'gpt-5.2',
      recommended: false,
      components: [
        { type: 'agent', src: 'agents/xx/xx-planner.md', dest: 'agents/xx/xx-planner.md' },
        { type: 'prompt', src: 'prompts/planner.md', dest: '~/.codeagent/agents/planner.md' },
      ]
    },

    'xx-reviewer': {
      id: 'xx-reviewer',
      name: 'Reviewer',
      displayName: 'Reviewer (GPT-5.2)',
      description: 'Plan verification, solution review',
      backend: 'codex',
      model: 'gpt-5.2',
      recommended: false,
      components: [
        { type: 'agent', src: 'agents/xx/xx-reviewer.md', dest: 'agents/xx/xx-reviewer.md' },
        { type: 'prompt', src: 'prompts/reviewer.md', dest: '~/.codeagent/agents/reviewer.md' },
      ]
    },
  },

  optional: {
    'pre-bash-hook': {
      id: 'pre-bash-hook',
      name: 'Pre-bash Safety Hook',
      description: 'Blocks dangerous shell commands',
      recommended: true,
      components: [
        { type: 'hook', src: 'hooks/pre-bash.py', dest: 'hooks/pre-bash.py' },
      ]
    },
  }
}

/**
 * Get list of backends required by selected agents
 */
export function getRequiredBackends(selectedAgents) {
  const backends = new Set()
  for (const agentId of selectedAgents) {
    const agent = MODULES.agents[agentId]
    if (agent?.backend) {
      backends.add(agent.backend)
    }
  }
  return Array.from(backends).sort()
}

/**
 * Get list of agents that use a specific backend
 */
export function getAgentsUsingBackend(backendName, selectedAgents = null) {
  const agents = []
  const agentList = selectedAgents
    ? selectedAgents.map(id => MODULES.agents[id]).filter(Boolean)
    : Object.values(MODULES.agents)

  for (const agent of agentList) {
    if (agent.backend === backendName) {
      agents.push(agent.name)
    }
  }
  return agents
}

/**
 * Get all components to install based on selections
 */
export function getComponentsToInstall(selectedAgents, selectedOptional) {
  const components = []

  // Core components (always installed)
  components.push(...MODULES.core.components)

  // Selected agents
  for (const agentId of selectedAgents) {
    const agent = MODULES.agents[agentId]
    if (agent) {
      components.push(...agent.components)
    }
  }

  // Selected optional components
  for (const optId of selectedOptional) {
    const opt = MODULES.optional[optId]
    if (opt) {
      components.push(...opt.components)
    }
  }

  return components
}

/**
 * Get default agent selection (all recommended agents)
 */
export function getDefaultAgentSelection() {
  return Object.values(MODULES.agents)
    .filter(agent => agent.recommended)
    .map(agent => agent.id)
}

/**
 * Get default optional component selection
 */
export function getDefaultOptionalSelection() {
  return Object.values(MODULES.optional)
    .filter(opt => opt.recommended)
    .map(opt => opt.id)
}

/**
 * Backend metadata
 */
export const BACKEND_INFO = {
  codex: {
    name: 'codex',
    displayName: 'Codex (OpenAI)',
    cliCommand: 'codex',
    checkArgs: ['--version'],
    installCommand: 'npm install -g @openai/codex-cli',
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    defaultModel: 'gpt-5.3-codex',
    availableModels: ['gpt-5.3-codex', 'gpt-5.2', 'gpt-4o', 'gpt-4-turbo'],
  },

  claude: {
    name: 'claude',
    displayName: 'Claude',
    cliCommand: 'claude',
    checkArgs: ['--version'],
    installCommand: 'npm install -g @anthropic-ai/claude-cli',
    apiKeyUrl: 'https://console.anthropic.com/settings/keys',
    defaultModel: 'claude-opus-4-6',
    availableModels: ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-6'],
  },

  gemini: {
    name: 'gemini',
    displayName: 'Gemini (Google)',
    cliCommand: 'gemini',
    checkArgs: ['--version'],
    installCommand: 'npm install -g @google/gemini-cli',
    apiKeyUrl: 'https://makersuite.google.com/app/apikey',
    defaultModel: 'gemini-3-flash',
    availableModels: ['gemini-3-flash', 'gemini-3-pro', 'gemini-2-ultra'],
  },

  opencode: {
    name: 'opencode',
    displayName: 'OpenCode',
    cliCommand: 'opencode',
    checkArgs: ['models'],
    installCommand: 'go install github.com/opencode-ai/opencode@latest',
    apiKeyUrl: 'https://opencode.ai/api-keys',
    defaultModel: 'opencode/kimi-k2.5-free',
    availableModels: ['opencode/kimi-k2.5-free', 'opencode/kimi-k2.5-pro'],
  },
}

/**
 * Get backend info by name
 */
export function getBackendInfo(backendName) {
  return BACKEND_INFO[backendName]
}
