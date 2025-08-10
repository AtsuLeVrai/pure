import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scrypt,
} from "node:crypto";
import { promisify } from "node:util";
import { env } from "@/env";

const scryptAsync = promisify(scrypt);

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

async function getDerivedKey(): Promise<Buffer> {
  const salt = Buffer.from(
    env.ENCRYPTION_SALT || "default-salt-change-in-production",
    "utf8",
  );
  return (await scryptAsync(env.ENCRYPTION_KEY, salt, KEY_LENGTH)) as Buffer;
}

export async function encrypt(text: string): Promise<string> {
  try {
    const key = await getDerivedKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    // Combine iv + authTag + encrypted data
    return iv.toString("hex") + authTag.toString("hex") + encrypted;
  } catch {
    throw new Error("Failed to encrypt data");
  }
}

export async function decrypt(encryptedText: string): Promise<string> {
  try {
    const key = await getDerivedKey();

    // Extract iv, authTag and encrypted data
    const iv = Buffer.from(encryptedText.slice(0, IV_LENGTH * 2), "hex");
    const authTag = Buffer.from(
      encryptedText.slice(IV_LENGTH * 2, (IV_LENGTH + TAG_LENGTH) * 2),
      "hex",
    );
    const encrypted = encryptedText.slice((IV_LENGTH + TAG_LENGTH) * 2);

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch {
    throw new Error("Failed to decrypt data");
  }
}
