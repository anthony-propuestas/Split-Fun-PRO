// Crypto helpers for auth: email normalization, hashing and encryption, password hashing.
// Diseñado para Cloudflare Workers (Web Crypto disponible como global `crypto`).

export type PasswordAlgo = "argon2id-v1" | "bcrypt-12";

// Normaliza email para comparaciones y hashing
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// Hash de email (SHA-256) para búsquedas sin descifrar el valor
export async function hashEmail(email: string): Promise<string> {
  const normalized = normalizeEmail(email);
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bufferToHex(digest);
}

function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuffer(hex: string): ArrayBuffer {
  if (hex.length % 2 !== 0) {
    throw new Error("Invalid hex string length");
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes.buffer;
}

// Deriva una CryptoKey simétrica desde una clave base64 almacenada en el entorno
export async function importEmailKey(base64Key: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(base64Key), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM", length: 256 }, false, [
    "encrypt",
    "decrypt",
  ]);
}

export interface EncryptedEmail {
  ivHex: string;
  ciphertextHex: string;
}

export async function encryptEmail(
  plaintextEmail: string,
  key: CryptoKey
): Promise<EncryptedEmail> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV recomendado para AES-GCM
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(normalizeEmail(plaintextEmail))
  );

  return {
    ivHex: bufferToHex(iv.buffer),
    ciphertextHex: bufferToHex(ciphertext),
  };
}

export async function decryptEmail(
  encrypted: EncryptedEmail,
  key: CryptoKey
): Promise<string> {
  const decoder = new TextDecoder();
  const iv = new Uint8Array(hexToBuffer(encrypted.ivHex));
  const ciphertext = hexToBuffer(encrypted.ciphertextHex);

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  return decoder.decode(plaintext);
}

// Placeholder para hashing de contraseñas: por ahora usamos Web Crypto PBKDF2 + SHA-256.
// En una iteración futura se puede sustituir por argon2id/bcrypt cuando haya soporte/librería adecuada.

const PASSWORD_ALGO: PasswordAlgo = "argon2id-v1";
const PBKDF2_ITERATIONS = 100_000; // Cloudflare Workers limita PBKDF2 a 100k iteraciones máximo
const PBKDF2_SALT_BYTES = 16;

export interface PasswordHashResult {
  algo: PasswordAlgo;
  hash: string; // formato: algo$saltHex$derivedKeyHex
}

export async function hashPassword(password: string): Promise<PasswordHashResult> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(PBKDF2_SALT_BYTES));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  const saltHex = bufferToHex(salt.buffer);
  const keyHex = bufferToHex(derivedBits);

  return {
    algo: PASSWORD_ALGO,
    hash: `${PASSWORD_ALGO}$${saltHex}$${keyHex}`,
  };
}

export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  try {
    const [algo, saltHex, keyHex] = stored.split("$");
    if (algo !== PASSWORD_ALGO) {
      // En el futuro se podría soportar migraciones de algoritmo
      return false;
    }
    const encoder = new TextEncoder();
    const saltBuf = hexToBuffer(saltHex);
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: new Uint8Array(saltBuf),
        iterations: PBKDF2_ITERATIONS,
        hash: "SHA-256",
      },
      keyMaterial,
      256
    );

    const derivedHex = bufferToHex(derivedBits);
    return timingSafeEqual(derivedHex, keyHex);
  } catch {
    return false;
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

