import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync, readFileSync } from "node:fs"
import { join, dirname, relative } from "node:path"
import { homedir } from "node:os"
import { fileURLToPath } from "node:url"

/**
 * Recursively copy a directory, optionally overwriting existing files.
 */
export function copyDir(src, dest, { force = false } = {}) {
  mkdirSync(dest, { recursive: true })
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry)
    const destPath = join(dest, entry)
    const stat = statSync(srcPath)
    if (stat.isDirectory()) {
      copyDir(srcPath, destPath, { force })
    } else {
      if (!force && existsSync(destPath)) {
        console.log(`  skip (exists): ${destPath}`)
        continue
      }
      mkdirSync(dirname(destPath), { recursive: true })
      copyFileSync(srcPath, destPath)
      console.log(`  copy: ${destPath}`)
    }
  }
}

/**
 * Copy a single file, optionally overwriting.
 */
export function copyFile(src, dest, { force = false } = {}) {
  if (!force && existsSync(dest)) {
    console.log(`  skip (exists): ${dest}`)
    return
  }
  mkdirSync(dirname(dest), { recursive: true })
  copyFileSync(src, dest)
  console.log(`  copy: ${dest}`)
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
