#!/usr/bin/env node
/**
 * Aplica las migraciones 1.sql … 8.sql a la base D1 configurada en wrangler.json.
 * Uso: node scripts/apply-d1-migrations.js [--local]
 * Por defecto usa --remote. Pasa --local para base local.
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
if (!d1 || !d1.database_name) {
  console.error("No se encontró d1_databases[0].database_name en wrangler.json");
  process.exit(1);
}

const databaseName = d1.database_name;
const local = process.argv.includes("--local");
const flag = local ? "--local" : "--remote";

const migrations = [1, 2, 3, 4, 5, 6, 7, 8];
for (const n of migrations) {
  const file = path.join(root, "migrations", `${n}.sql`);
  console.log(`Aplicando migración ${n}.sql (${flag})...`);
  execSync(
    `npx wrangler d1 execute "${databaseName}" ${flag} --file="${file}"`,
    { cwd: root, stdio: "inherit" }
  );
}
console.log("Migraciones aplicadas correctamente.");
