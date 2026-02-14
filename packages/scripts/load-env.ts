/**
 * Load env before any package that validates env (e.g. @repo/auth) is imported.
 * Must be imported first in seed.ts so it runs before @repo/auth.
 */
import { config } from "dotenv"
import { dirname, resolve } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, "../..")

config({ path: resolve(root, "packages/db/.env") })
config({ path: resolve(root, "apps/web/.env") })
