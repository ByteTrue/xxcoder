import { copyFileSync, chmodSync, mkdirSync, existsSync, readdirSync, statSync, readFileSync, writeFileSync } from "node:fs"
import { join, dirname, delimiter } from "node:path"
import { homedir } from "node:os"
import { fileURLToPath } from "node:url"

function detectExecutableFormat(filePath) {
  const data = readFileSync(filePath)
  if (data.length < 4) return "unknown"

  // PE/COFF (Windows)
  if (data[0] === 0x4d && data[1] === 0x5a) return "pe"

  // ELF (Linux)
  if (data[0] === 0x7f && data[1] === 0x45 && data[2] === 0x4c && data[3] === 0x46) return "elf"

  // Mach-O + fat binaries (macOS)
  const hex = Buffer.from(data.subarray(0, 4)).toString("hex")
  const machoMagics = new Set([
    "feedface", "feedfacf", "cefaedfe", "cffaedfe",
    "cafebabe", "bebafeca",
  ])
  if (machoMagics.has(hex)) return "macho"

  return "unknown"
}

function expectedExecutableFormat(platform) {
  if (platform === "win32") return "pe"
  if (platform === "linux") return "elf"
  if (platform === "darwin") return "macho"
  return "unknown"
}

function assertBinaryFormatForPlatform(filePath, platform) {
  const expected = expectedExecutableFormat(platform)
  const actual = detectExecutableFormat(filePath)
  if (expected !== "unknown" && actual !== expected) {
    throw new Error(
      `Bundled wrapper binary format mismatch for ${platform}: expected ${expected}, got ${actual}. ` +
      `Please rebuild/repackage binaries. Source: ${filePath}`
    )
  }
}

function findWrapperInPath(platform) {
  const pathValue = process.env.PATH || ""
  if (!pathValue) return ""
  const entries = pathValue.split(delimiter).filter(Boolean)
  const names = platform === "win32"
    ? ["codeagent-wrapper.exe", "codeagent-wrapper"]
    : ["codeagent-wrapper"]

  for (const entry of entries) {
    for (const name of names) {
      const candidate = join(entry, name)
      if (existsSync(candidate)) return candidate
    }
  }
  return ""
}

function resolveWrapperSourceBinary({ packageRoot, platform, binaryName }) {
  const expected = expectedExecutableFormat(platform)
  const checked = []
  const candidates = [
    join(packageRoot, "binaries", binaryName),
    join(packageRoot, "codeagent-wrapper", platform === "win32" ? "codeagent-wrapper.exe" : "codeagent-wrapper"),
    findWrapperInPath(platform),
  ].filter(Boolean)

  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue
    const actual = detectExecutableFormat(candidate)
    checked.push({ candidate, actual })
    if (expected === "unknown" || actual === expected) return candidate
  }

  const details = checked.length > 0
    ? checked.map((x) => `${x.candidate} (detected ${x.actual})`).join("; ")
    : "none found"
  throw new Error(
    `No usable wrapper binary for ${platform}. Expected format: ${expected}. Checked: ${details}`
  )
}

/**
 * Recursively copy a directory, optionally overwriting existing files.
 * Returns { copied, skipped } counts.
 */
export function copyDir(src, dest, { force = false, silent = false } = {}) {
  mkdirSync(dest, { recursive: true })
  let copied = 0
  let skipped = 0
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry)
    const destPath = join(dest, entry)
    const stat = statSync(srcPath)
    if (stat.isDirectory()) {
      const sub = copyDir(srcPath, destPath, { force, silent })
      copied += sub.copied
      skipped += sub.skipped
    } else {
      if (!force && existsSync(destPath)) {
        if (!silent) console.log(`  skip (exists): ${destPath}`)
        skipped++
        continue
      }
      mkdirSync(dirname(destPath), { recursive: true })
      copyFileSync(srcPath, destPath)
      if (!silent) console.log(`  copy: ${destPath}`)
      copied++
    }
  }
  return { copied, skipped }
}

/**
 * Copy a single file, optionally overwriting.
 * Returns { copied, skipped } counts.
 */
export function copyFile(src, dest, { force = false, silent = false } = {}) {
  if (!force && existsSync(dest)) {
    if (!silent) console.log(`  skip (exists): ${dest}`)
    return { copied: 0, skipped: 1 }
  }
  mkdirSync(dirname(dest), { recursive: true })
  copyFileSync(src, dest)
  if (!silent) console.log(`  copy: ${dest}`)
  return { copied: 1, skipped: 0 }
}

/**
 * Resolve the templates directory from the package root.
 */
export function getTemplatesDir() {
  const __dirname = fileURLToPath(new URL(".", import.meta.url))
  return join(__dirname, "..", "..", "templates")
}

/**
 * Resolve the default install directory (~/.claude).
 */
export function getDefaultInstallDir() {
  return join(homedir(), ".claude")
}

/**
 * Resolve the project-local install directory (.claude in cwd).
 */
export function getProjectInstallDir() {
  return join(process.cwd(), ".claude")
}

/**
 * Resolve the package root directory.
 */
export function getPackageRoot() {
  const __dirname = fileURLToPath(new URL(".", import.meta.url))
  return join(__dirname, "..", "..")
}

/**
 * Install the codeagent-wrapper binary for the current platform.
 * Always installs to ~/.claude/bin/.
 */
export function installWrapper({ force = false, silent = false } = {}) {
  const platform = process.platform
  const arch = process.arch

  let binaryName
  if (platform === "darwin") {
    binaryName = arch === "arm64" ? "codeagent-wrapper-darwin-arm64" : "codeagent-wrapper-darwin-amd64"
  } else if (platform === "linux") {
    binaryName = arch === "arm64" ? "codeagent-wrapper-linux-arm64" : "codeagent-wrapper-linux-amd64"
  } else if (platform === "win32") {
    binaryName = arch === "arm64" ? "codeagent-wrapper-windows-arm64.exe" : "codeagent-wrapper-windows-amd64.exe"
  } else {
    throw new Error(`Unsupported platform: ${platform}/${arch}`)
  }

  const packageRoot = getPackageRoot()
  const srcBinary = resolveWrapperSourceBinary({ packageRoot, platform, binaryName })
  assertBinaryFormatForPlatform(srcBinary, platform)

  const destDir = join(homedir(), ".claude", "bin")
  const destName = platform === "win32" ? "codeagent-wrapper.exe" : "codeagent-wrapper"
  const destBinary = join(destDir, destName)

  if (!force && existsSync(destBinary)) {
    if (!silent) console.log(`  skip (exists): ${destBinary}`)
    return { copied: 0, skipped: 1 }
  }

  mkdirSync(destDir, { recursive: true })
  copyFileSync(srcBinary, destBinary)
  if (platform !== "win32") {
    chmodSync(destBinary, 0o755)
  }
  if (!silent) console.log(`  copy: ${destBinary}`)
  return { copied: 1, skipped: 0 }
}

/**
 * Install CLAUDE.md and always overwrite the destination file.
 */
export function installClaudeMd(src, dest, { silent = false } = {}) {
  const content = readFileSync(src, "utf-8")
  const action = existsSync(dest) ? "overwrite" : "create"
  mkdirSync(dirname(dest), { recursive: true })
  writeFileSync(dest, content, "utf-8")
  if (!silent) console.log(`  ${action}: ${dest}`)
  return { copied: 1, skipped: 0 }
}
