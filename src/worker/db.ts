/**
 * Capa de acceso a datos para Cloudflare D1.
 * Centraliza tipos y helpers para que el cambio de backend (o añadir logging/retries) sea en un solo lugar.
 */

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  all<T = unknown>(): Promise<{
    results: T[];
    success: boolean;
    meta: { last_row_id?: number };
  }>;
  run(): Promise<{ success: boolean; meta: { last_row_id?: number } }>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

export interface R2Bucket {
  put(key: string, value: unknown): Promise<void>;
  get(key: string): Promise<unknown>;
  delete(key: string): Promise<void>;
}

export interface Env {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
  ASSETS: { fetch(req: Request): Promise<Response> };
  // Clave simétrica base64 para cifrar correos (AES-GCM)
  EMAIL_ENCRYPTION_KEY: string;
  // Resend API — configurar con: npx wrangler secret put RESEND_API_KEY
  RESEND_API_KEY: string;
  // Opcional: dirección remitente verificada en Resend (ej: "Split Fun PRO <no-reply@tudominio.com>")
  FROM_EMAIL?: string;
  // Opcional: URL base de la app (default: https://split-fun-pro.pages.dev)
  APP_BASE_URL?: string;
}

/** Ejecuta una query y devuelve la primera fila, con logging de errores D1. */
export async function queryOne<T = unknown>(
  db: D1Database,
  sql: string,
  ...params: unknown[]
): Promise<T | null> {
  try {
    const stmt = params.length ? db.prepare(sql).bind(...params) : db.prepare(sql);
    return (await stmt.first()) as Promise<T | null>;
  } catch (e) {
    console.error("[D1] queryOne error", String(e), sql.slice(0, 100));
    throw e;
  }
}

/** Ejecuta una query y devuelve todas las filas, con logging de errores D1. */
export async function queryAll<T = unknown>(
  db: D1Database,
  sql: string,
  ...params: unknown[]
): Promise<{ results: T[] }> {
  try {
    const stmt = params.length ? db.prepare(sql).bind(...params) : db.prepare(sql);
    const out = await stmt.all<T>();
    return { results: out.results ?? [] };
  } catch (e) {
    console.error("[D1] queryAll error", String(e), sql.slice(0, 100));
    throw e;
  }
}

/** Ejecuta una sentencia (INSERT/UPDATE/DELETE), con logging de errores D1. */
export async function run(
  db: D1Database,
  sql: string,
  ...params: unknown[]
): Promise<{ success: boolean; meta: { last_row_id?: number } }> {
  try {
    const stmt = params.length ? db.prepare(sql).bind(...params) : db.prepare(sql);
    return await stmt.run();
  } catch (e) {
    console.error("[D1] run error", String(e), sql.slice(0, 100));
    throw e;
  }
}
