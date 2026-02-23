import { describe, it, expect, beforeAll, afterAll } from "vitest"
import {
  hasXxcoderInstall,
  uninstallDir,
  uninstallClaudeMd,
} from "../src/utils/uninstaller.mjs"
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

const tmp = join(tmpdir(), "xxcoder-test-uninstaller-" + Date.now())

beforeAll(() => mkdirSync(tmp, { recursive: true }))
afterAll(() => rmSync(tmp, { recursive: true, force: true }))

describe("hasXxcoderInstall", () => {
  it("returns true when agents/xx exists", () => {
    const dir = join(tmp, "has-agents")
    mkdirSync(join(dir, "agents", "xx"), { recursive: true })
    expect(hasXxcoderInstall(dir)).toBe(true)
  })

  it("returns true when skills/xx exists", () => {
    const dir = join(tmp, "has-skills")
    mkdirSync(join(dir, "skills", "xx"), { recursive: true })
    expect(hasXxcoderInstall(dir)).toBe(true)
  })

  it("returns true when hooks/pre-bash.py exists", () => {
    const dir = join(tmp, "has-hooks")
    mkdirSync(join(dir, "hooks"), { recursive: true })
    writeFileSync(join(dir, "hooks", "pre-bash.py"), "# hook")
    expect(hasXxcoderInstall(dir)).toBe(true)
  })

  it("returns true when CLAUDE.md has xxcoder marker", () => {
    const dir = join(tmp, "has-marker")
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, "CLAUDE.md"), "<!-- xxcoder:start -->\nstuff\n<!-- xxcoder:end -->")
    expect(hasXxcoderInstall(dir)).toBe(true)
  })

  it("returns true when CLAUDE.md starts with XX title", () => {
    const dir = join(tmp, "has-title")
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, "CLAUDE.md"), "# XX Multi-Agent Orchestration\nstuff")
    expect(hasXxcoderInstall(dir)).toBe(true)
  })

  it("returns false for empty directory", () => {
    const dir = join(tmp, "empty-dir")
    mkdirSync(dir, { recursive: true })
    expect(hasXxcoderInstall(dir)).toBe(false)
  })
})

describe("uninstallDir", () => {
  it("removes agents/xx and skills/xx directories", () => {
    const dir = join(tmp, "uninstall-dirs")
    mkdirSync(join(dir, "agents", "xx"), { recursive: true })
    mkdirSync(join(dir, "skills", "xx"), { recursive: true })
    writeFileSync(join(dir, "agents", "xx", "test.md"), "agent")

    const result = uninstallDir(dir)
    expect(result.removed).toBe(2)
    expect(existsSync(join(dir, "agents", "xx"))).toBe(false)
    expect(existsSync(join(dir, "skills", "xx"))).toBe(false)
  })

  it("removes hooks/pre-bash.py", () => {
    const dir = join(tmp, "uninstall-hook")
    mkdirSync(join(dir, "hooks"), { recursive: true })
    writeFileSync(join(dir, "hooks", "pre-bash.py"), "# hook")

    const result = uninstallDir(dir)
    expect(result.removed).toBeGreaterThanOrEqual(1)
    expect(existsSync(join(dir, "hooks", "pre-bash.py"))).toBe(false)
  })

  it("counts skipped for missing directories", () => {
    const dir = join(tmp, "uninstall-empty")
    mkdirSync(dir, { recursive: true })

    const result = uninstallDir(dir)
    expect(result.skipped).toBe(3)
    expect(result.removed).toBe(0)
  })
})

describe("uninstallClaudeMd", () => {
  it("removes file with marker-based content", () => {
    const file = join(tmp, "claude-marker.md")
    writeFileSync(file, "before\n<!-- xxcoder:start -->\nstuff\n<!-- xxcoder:end -->\nafter")

    const result = uninstallClaudeMd(file)
    expect(result.removed).toBe(1)
    const content = readFileSync(file, "utf-8")
    expect(content).not.toContain("xxcoder:start")
    expect(content).toContain("before")
    expect(content).toContain("after")
  })

  it("deletes file that starts with XX title", () => {
    const file = join(tmp, "claude-title.md")
    writeFileSync(file, "# XX Multi-Agent Orchestration\nstuff")

    const result = uninstallClaudeMd(file)
    expect(result.removed).toBe(1)
    expect(existsSync(file)).toBe(false)
  })

  it("skips non-xxcoder CLAUDE.md", () => {
    const file = join(tmp, "claude-user.md")
    writeFileSync(file, "# My Project\nCustom instructions")

    const result = uninstallClaudeMd(file)
    expect(result.skipped).toBe(1)
    expect(readFileSync(file, "utf-8")).toBe("# My Project\nCustom instructions")
  })

  it("skips non-existent file", () => {
    const result = uninstallClaudeMd(join(tmp, "nonexistent.md"))
    expect(result.skipped).toBe(1)
  })
})
