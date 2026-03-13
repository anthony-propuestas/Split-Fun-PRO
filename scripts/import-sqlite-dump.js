#!/usr/bin/env node
/**
 * Importa datos desde un dump SQL (ej. exportado con sqlite3 .dump) a Cloudflare D1.
 * El esquema debe estar ya aplicado en D1 (migraciones 1–8).
 * Uso: node scripts/import-sqlite-dump.js <dump.sql> [--local]
 *
 * El script filtra solo INSERTs y los ejecuta por lotes contra la base D1
 * configurada en wrangler.json. Ignora CREATE TABLE/INDEX y otras sentencias.
 */

import { readFileSync, mkdirSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const dumpPath = process.argv.find((a) => a.endsWith(".sql"));
if (!dumpPath) {
  console.error("Uso: node scripts/import-sqlite-dump.js <dump.sql> [--local]");
  process.exit(1);
}

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

const content = readFileSync(path.resolve(root, dumpPath), "utf8");
// Extraer líneas que sean INSERT INTO (ignorar CREATE, PRAGMA, BEGIN, COMMIT, etc.)
const insertLines = content
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => /^INSERT\s+INTO\s+/i.test(line));

if (insertLines.length === 0) {
  console.log("No se encontraron sentencias INSERT en el dump.");
  process.exit(0);
}

console.log(`Ejecutando ${insertLines.length} INSERT(s)...`);
const tmpDir = path.join(root, "node_modules", ".tmp-d1-import");
try {
  mkdirSync(tmpDir, { recursive: true });
} catch (_) {}

let ok = 0;
let err = 0;
const tmpFile = path.join(tmpDir, "stmt.sql");
for (let i = 0; i < insertLines.length; i++) {
  const sql = insertLines[i];
  try {
    writeFileSync(tmpFile, sql, "utf8");
    execSync(
      `npx wrangler d1 execute "${databaseName}" ${flag} --file="${tmpFile}"`,
      { cwd: root, stdio: "pipe" }
    );
    ok++;
  } catch (e) {
    err++;
    console.warn("Error en INSERT:", sql.slice(0, 80) + "...");
  }
}
console.log(`Listo: ${ok} OK, ${err} errores.`);
