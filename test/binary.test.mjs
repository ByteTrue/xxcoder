import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { detectExecutableFormat, expectedExecutableFormat } from "../src/utils/binary.mjs"
import { writeFileSync, mkdirSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

describe("expectedExecutableFormat", () => {
  it("returns pe for win32", () => {
    expect(expectedExecutableFormat("win32")).toBe("pe")
  })

  it("returns elf for linux", () => {
    expect(expectedExecutableFormat("linux")).toBe("elf")
  })

  it("returns macho for darwin", () => {
    expect(expectedExecutableFormat("darwin")).toBe("macho")
  })

  it("returns unknown for unsupported platform", () => {
    expect(expectedExecutableFormat("freebsd")).toBe("unknown")
  })
})

describe("detectExecutableFormat", () => {
  const tmp = join(tmpdir(), "xxcoder-test-binary-" + Date.now())

  function writeBin(name, bytes) {
    const p = join(tmp, name)
    writeFileSync(p, Buffer.from(bytes))
    return p
  }

  beforeAll(() => mkdirSync(tmp, { recursive: true }))
  afterAll(() => rmSync(tmp, { recursive: true, force: true }))

  it("detects PE format (MZ header)", () => {
    const p = writeBin("test.exe", [0x4d, 0x5a, 0x00, 0x00])
    expect(detectExecutableFormat(p)).toBe("pe")
  })

  it("detects ELF format", () => {
    const p = writeBin("test.elf", [0x7f, 0x45, 0x4c, 0x46])
    expect(detectExecutableFormat(p)).toBe("elf")
  })

  it("detects Mach-O 64-bit format", () => {
    const p = writeBin("test.macho", [0xfe, 0xed, 0xfa, 0xcf])
    expect(detectExecutableFormat(p)).toBe("macho")
  })

  it("returns unknown for short file", () => {
    const p = writeBin("test.short", [0x00, 0x01])
    expect(detectExecutableFormat(p)).toBe("unknown")
  })

  it("returns unknown for unrecognized magic", () => {
    const p = writeBin("test.unknown", [0x01, 0x02, 0x03, 0x04])
    expect(detectExecutableFormat(p)).toBe("unknown")
  })
})
