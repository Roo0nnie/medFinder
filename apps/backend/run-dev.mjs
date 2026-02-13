#!/usr/bin/env node
/**
 * Starts Django runserver. Tries python3 then python so it works when
 * Windows Python Launcher (py) is the default "python" and no runtime is registered.
 */
import { spawn } from "node:child_process"

const args = ["manage.py", "runserver", "0.0.0.0:3000"]
const candidates = ["python3", "python"]

function run(cmd) {
	return new Promise((resolve) => {
		const child = spawn(cmd, args, {
			stdio: "inherit",
			shell: true,
		})
		child.on("error", (err) => resolve({ started: false, err }))
		child.on("exit", (code, signal) => resolve({ started: true, code: code ?? 0, signal }))
	})
}

for (const cmd of candidates) {
	const result = await run(cmd)
	if (result.started && result.code === 0) process.exit(0)
	if (result.started && result.code !== 0) {
		console.error(
			"\n[backend] If you see 'No runtimes are installed' above, run:  py install default\n"
		)
		process.exit(result.code)
	}
	// Failed to start (e.g. ENOENT) — try next candidate
}

console.error(
	"\n[backend] Could not start Python (tried: " +
		candidates.join(", ") +
		"). On Windows, run:  py install default\n"
)
process.exit(1)
