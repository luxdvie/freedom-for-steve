import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

function getKey(): Buffer {
  const hex = process.env.EMAIL_ENCRYPTION_KEY;
  if (!hex) throw new Error("EMAIL_ENCRYPTION_KEY not set");
  return Buffer.from(hex, "hex");
}

export function encryptEmail(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${encrypted.toString("base64")}:${authTag.toString("base64")}`;
}

export function decryptEmail(encrypted: string): string {
  const key = getKey();
  const [ivB64, ciphertextB64, authTagB64] = encrypted.split(":");
  const iv = Buffer.from(ivB64, "base64");
  const ciphertext = Buffer.from(ciphertextB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(ciphertext, undefined, "utf8") + decipher.final("utf8");
}
