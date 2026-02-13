import { copyFileSync, chmodSync, mkdirSync, existsSync, readdirSync, statSync, readFileSync, writeFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { homedir } from "node:os"
import { fileURLToPath } from "node:url"

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
 * Check if xxcoder files already exist in the target directory.
 */
export function hasExistingInstall(dir) {
  return existsSync(join(dir, "agents", "xx")) || existsSync(join(dir, "skills", "xx"))
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

  const srcBinary = join(getPackageRoot(), "binaries", binaryName)
  if (!existsSync(srcBinary)) {
    throw new Error(`Binary not found: ${srcBinary}`)
  }

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

const XXCODER_MARKER = "<!-- xxcoder:start -->"
const XXCODER_MARKER_END = "<!-- xxcoder:end -->"

/**
 * Install CLAUDE.md — merge with existing content if present.
 * Uses markers to identify xxcoder's section for idempotent updates.
 */
export function installClaudeMd(src, dest, { force = false, silent = false } = {}) {
  const content = readFileSync(src, "utf-8")
  const wrapped = `${XXCODER_MARKER}\n${content}\n${XXCODER_MARKER_END}`

  if (!existsSync(dest)) {
    mkdirSync(dirname(dest), { recursive: true })
    writeFileSync(dest, wrapped, "utf-8")
    if (!silent) console.log(`  create: ${dest}`)
    return { copied: 1, skipped: 0 }
  }

  const existing = readFileSync(dest, "utf-8")

  // Already has xxcoder section — replace it if force, skip otherwise
  if (existing.includes(XXCODER_MARKER)) {
    if (!force) {
      if (!silent) console.log(`  skip (exists): ${dest}`)
      return { copied: 0, skipped: 1 }
    }
    const re = new RegExp(`${XXCODER_MARKER}[\\s\\S]*?${XXCODER_MARKER_END}`)
    const updated = existing.replace(re, wrapped)
    writeFileSync(dest, updated, "utf-8")
    if (!silent) console.log(`  update: ${dest}`)
    return { copied: 1, skipped: 0 }
  }

  // Existing CLAUDE.md without xxcoder section — append
  const merged = existing.trimEnd() + "\n\n" + wrapped + "\n"
  writeFileSync(dest, merged, "utf-8")
  if (!silent) console.log(`  append: ${dest}`)
  return { copied: 1, skipped: 0 }
}
