import { readFileSync } from "node:fs"

/**
 * Detect the executable format of a binary file by reading its magic bytes.
 * @param {string} filePath - Path to the binary file
 * @returns {"pe" | "elf" | "macho" | "unknown"} The detected format
 */
export function detectExecutableFormat(filePath) {
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

/**
 * Get the expected executable format for a given platform.
 * @param {string} platform - Platform identifier (e.g., "win32", "linux", "darwin")
 * @returns {"pe" | "elf" | "macho" | "unknown"} The expected format
 */
export function expectedExecutableFormat(platform) {
  if (platform === "win32") return "pe"
  if (platform === "linux") return "elf"
  if (platform === "darwin") return "macho"
  return "unknown"
}
