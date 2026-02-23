import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { copyDir, copyFile, getTemplatesDir, getDefaultInstallDir, getProjectInstallDir, getPackageRoot } from "../src/utils/installer.mjs"
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { homedir } from "node:os"

const tmp = join(tmpdir(), "xxcoder-test-installer-" + Date.now())

beforeAll(() => mkdirSync(tmp, { recursive: true }))
afterAll(() => rmSync(tmp, { recursive: true, force: true }))

describe("copyDir", () => {
  it("copies directory recursively", () => {
    const src = join(tmp, "copy-src")
    const dest = join(tmp, "copy-dest")
    mkdirSync(join(src, "sub"), { recursive: true })
    writeFileSync(join(src, "a.txt"), "hello")
    writeFileSync(join(src, "sub", "b.txt"), "world")

    const result = copyDir(src, dest, { silent: true })
    expect(result.copied).toBe(2)
    expect(result.skipped).toBe(0)
    expect(readFileSync(join(dest, "a.txt"), "utf-8")).toBe("hello")
    expect(readFileSync(join(dest, "sub", "b.txt"), "utf-8")).toBe("world")
  })

  it("skips existing files without force", () => {
    const src = join(tmp, "skip-src")
    const dest = join(tmp, "skip-dest")
    mkdirSync(src, { recursive: true })
    mkdirSync(dest, { recursive: true })
    writeFileSync(join(src, "a.txt"), "new")
    writeFileSync(join(dest, "a.txt"), "old")

    const result = copyDir(src, dest, { force: false, silent: true })
    expect(result.skipped).toBe(1)
    expect(readFileSync(join(dest, "a.txt"), "utf-8")).toBe("old")
  })

  it("overwrites existing files with force", () => {
    const src = join(tmp, "force-src")
    const dest = join(tmp, "force-dest")
    mkdirSync(src, { recursive: true })
    mkdirSync(dest, { recursive: true })
    writeFileSync(join(src, "a.txt"), "new")
    writeFileSync(join(dest, "a.txt"), "old")

    const result = copyDir(src, dest, { force: true, silent: true })
    expect(result.copied).toBe(1)
    expect(readFileSync(join(dest, "a.txt"), "utf-8")).toBe("new")
  })
})

describe("copyFile", () => {
  it("copies a single file", () => {
    const src = join(tmp, "single-src.txt")
    const dest = join(tmp, "single-dest.txt")
    writeFileSync(src, "content")

    const result = copyFile(src, dest, { silent: true })
    expect(result.copied).toBe(1)
    expect(readFileSync(dest, "utf-8")).toBe("content")
  })

  it("skips existing file without force", () => {
    const src = join(tmp, "skip-file-src.txt")
    const dest = join(tmp, "skip-file-dest.txt")
    writeFileSync(src, "new")
    writeFileSync(dest, "old")

    const result = copyFile(src, dest, { force: false, silent: true })
    expect(result.skipped).toBe(1)
    expect(readFileSync(dest, "utf-8")).toBe("old")
  })
})

describe("path helpers", () => {
  it("getTemplatesDir returns valid path", () => {
    const dir = getTemplatesDir()
    expect(dir).toContain("templates")
    expect(existsSync(dir)).toBe(true)
  })

  it("getDefaultInstallDir returns ~/.claude", () => {
    expect(getDefaultInstallDir()).toBe(join(homedir(), ".claude"))
  })

  it("getProjectInstallDir returns .claude in cwd", () => {
    expect(getProjectInstallDir()).toBe(join(process.cwd(), ".claude"))
  })

  it("getPackageRoot returns valid path", () => {
    const root = getPackageRoot()
    expect(existsSync(join(root, "package.json"))).toBe(true)
  })
})
