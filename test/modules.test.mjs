import { describe, it, expect } from "vitest"
import {
  MODULES,
  BACKEND_INFO,
  getRequiredBackends,
  getAgentsUsingBackend,
  getComponentsToInstall,
  getDefaultAgentSelection,
  getDefaultOptionalSelection,
  getBackendInfo,
} from "../src/utils/modules.mjs"

describe("MODULES", () => {
  it("has core module with required components", () => {
    expect(MODULES.core).toBeDefined()
    expect(MODULES.core.required).toBe(true)
    expect(MODULES.core.components.length).toBeGreaterThan(0)
  })

  it("has 7 agent definitions", () => {
    expect(Object.keys(MODULES.agents)).toHaveLength(7)
  })

  it("each agent has required fields", () => {
    for (const [id, agent] of Object.entries(MODULES.agents)) {
      expect(agent.id).toBe(id)
      expect(agent.name).toBeTruthy()
      expect(agent.backend).toBeTruthy()
      expect(agent.components.length).toBeGreaterThan(0)
    }
  })
})

describe("getRequiredBackends", () => {
  it("returns unique sorted backends for selected agents", () => {
    const backends = getRequiredBackends(["xx-oracle", "xx-explorer"])
    expect(backends).toEqual(["codex", "opencode"])
  })

  it("returns empty array for empty selection", () => {
    expect(getRequiredBackends([])).toEqual([])
  })

  it("deduplicates backends", () => {
    const backends = getRequiredBackends(["xx-oracle", "xx-developer"])
    expect(backends).toEqual(["codex"])
  })
})

describe("getAgentsUsingBackend", () => {
  it("returns agents using codex backend", () => {
    const agents = getAgentsUsingBackend("codex")
    expect(agents).toContain("Oracle")
    expect(agents).toContain("Developer")
  })

  it("filters by selected agents when provided", () => {
    const agents = getAgentsUsingBackend("codex", ["xx-oracle"])
    expect(agents).toEqual(["Oracle"])
  })

  it("returns empty for unknown backend", () => {
    expect(getAgentsUsingBackend("nonexistent")).toEqual([])
  })
})

describe("getComponentsToInstall", () => {
  it("always includes core components", () => {
    const components = getComponentsToInstall([], [])
    expect(components.length).toBe(MODULES.core.components.length)
  })

  it("includes selected agent components", () => {
    const components = getComponentsToInstall(["xx-oracle"], [])
    expect(components.length).toBeGreaterThan(MODULES.core.components.length)
  })

  it("includes optional components", () => {
    const components = getComponentsToInstall([], ["pre-bash-hook"])
    const hookComponent = components.find((c) => c.type === "hook")
    expect(hookComponent).toBeDefined()
  })
})

describe("getDefaultAgentSelection", () => {
  it("returns only recommended agents", () => {
    const defaults = getDefaultAgentSelection()
    for (const id of defaults) {
      expect(MODULES.agents[id].recommended).toBe(true)
    }
  })

  it("does not include non-recommended agents", () => {
    const defaults = getDefaultAgentSelection()
    const nonRecommended = Object.values(MODULES.agents)
      .filter((a) => !a.recommended)
      .map((a) => a.id)
    for (const id of nonRecommended) {
      expect(defaults).not.toContain(id)
    }
  })
})

describe("getDefaultOptionalSelection", () => {
  it("returns recommended optional components", () => {
    const defaults = getDefaultOptionalSelection()
    expect(defaults).toContain("pre-bash-hook")
  })
})

describe("BACKEND_INFO", () => {
  it("has 4 backends defined", () => {
    expect(Object.keys(BACKEND_INFO)).toHaveLength(4)
  })

  it("each backend has required fields", () => {
    for (const info of Object.values(BACKEND_INFO)) {
      expect(info.name).toBeTruthy()
      expect(info.cliCommand).toBeTruthy()
      expect(info.defaultModel).toBeTruthy()
      expect(info.availableModels.length).toBeGreaterThan(0)
    }
  })
})

describe("getBackendInfo", () => {
  it("returns info for known backend", () => {
    expect(getBackendInfo("codex")).toBe(BACKEND_INFO.codex)
  })

  it("returns undefined for unknown backend", () => {
    expect(getBackendInfo("nonexistent")).toBeUndefined()
  })
})
