#!/usr/bin/env node
/**
 * Comprueba que el esquema D1 tenga las tablas esperadas (migraciones aplicadas).
 * Uso: node scripts/verify-d1-schema.js [--local]
 */

import { readFileSync } from "fs";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const wranglerPath = path.join(root, "wrangler.json");
const config = JSON.parse(readFileSync(wranglerPath, "utf8"));
const d1 = config.d1_databases && config.d1_databases[0];
if (!d1?.database_name) {
  console.error("No d1_databases[0].database_name en wrangler.json");
  process.exit(1);
}

const local = process.argv.includes("--local");
const flag = local ? "--local" : "--remote";

const expected = [
  "expense_splits",
  "expenses",
  "group_members",
  "groups",
  "payment_reminders",
  "settlements",
  "user_achievements",
  "user_profiles",
].sort();

const out = execSync(
  `npx wrangler d1 execute "${d1.database_name}" ${flag} --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;" --json`,
  { cwd: root, encoding: "utf8" }
);
let tables = [];
try {
  const parsed = JSON.parse(out);
  const results = parsed?.[0]?.results ?? parsed?.results ?? [];
  tables = results.map((r) => (r.name != null ? r.name : r)).filter(Boolean).sort();
} catch (_) {
  console.error("No se pudo parsear la salida de wrangler. Ejecuta manualmente:");
  console.error(`npx wrangler d1 execute "${d1.database_name}" ${flag} --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"`);
  process.exit(1);
}

const missing = expected.filter((t) => !tables.includes(t));
if (missing.length) {
  console.error("Tablas esperadas faltantes:", missing.join(", "));
  console.error("Tablas presentes:", tables.join(", "));
  process.exit(1);
}
console.log("Esquema D1 OK: todas las tablas presentes.", tables.join(", "));
