#!/usr/bin/env node
/**
 * Starts Django runserver. Prefers the backend .venv so Django is found.
 * Falls back to py -3 / python3 / python if no venv.
 * Port: from .env PORT or default 8000 (avoids Windows permission issues on 3000).
 */
import { spawn } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load PORT from .env so we don't need to hardcode (default 8000 avoids port permission issues on Windows)
function loadEnvPort() {
	const envPath = path.join(__dirname, ".env")
	if (!existsSync(envPath)) return 8000
	try {
		const content = readFileSync(envPath, "utf8")
		const m = content.match(/^\s*PORT\s*=\s*(\d+)/m)
		return m ? parseInt(m[1], 10) : 8000
	} catch {
		return 8000
	}
}
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : loadEnvPort()
const args = ["manage.py", "runserver", `0.0.0.0:${port}`]
const isWindows = process.platform === "win32"
const venvPython = isWindows
	? path.join(__dirname, ".venv", "Scripts", "python.exe")
	: path.join(__dirname, ".venv", "bin", "python")
const hasVenv = existsSync(venvPython)
// Prefer venv so Django and deps are found; then system Python
const baseCandidates = isWindows
	? [["py", "-3"], ["py"], "python3", "python"]
	: ["python3", "python"]
const candidates = hasVenv ? [venvPython, ...baseCandidates] : baseCandidates

function run(cmd, argsPrefix = []) {
	const allArgs = [...argsPrefix, ...args]
	return new Promise(resolve => {
		const child = spawn(cmd, allArgs, {
			stdio: "inherit",
			shell: false,
			cwd: __dirname,
		})
		child.on("error", err => resolve({ started: false, err }))
		child.on("exit", (code, signal) => resolve({ started: true, code: code ?? 0, signal }))
	})
}

function normalize(c) {
	return Array.isArray(c) ? { cmd: c[0], prefix: c.slice(1) } : { cmd: c, prefix: [] }
}

const tried = candidates.map(c => (Array.isArray(c) ? c.join(" ") : c === venvPython ? ".venv" : c))

async function main() {
	for (const c of candidates) {
		const { cmd, prefix } = normalize(c)
		const result = await run(cmd, prefix)
		if (result.started && result.code === 0) process.exit(0)
		if (result.started && result.code !== 0) {
			console.error(
				"\n[backend] If you see 'No runtimes are installed' above, install Python then run:  py install default\n"
			)
			process.exit(result.code)
		}
	}

	console.error(
		"\n[backend] Could not start Python (tried: " +
			tried.join(", ") +
			"). Install Python 3, then on Windows run:  py install default\n"
	)
	process.exit(1)
}

main()
