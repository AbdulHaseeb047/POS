import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "zappos-super-secret-key-32-chars-key!"; // Must be 32 bytes
const IV_LENGTH = 16; // For AES-256-CBC

export function encrypt(text: string | null | undefined): string {
  if (!text) return "";
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return "enc:" + iv.toString("hex") + ":" + encrypted.toString("hex");
  } catch (err) {
    console.error("Encryption failed:", err);
    return text;
  }
}

export function decrypt(text: string | null | undefined): string {
  if (!text) return "";
  if (!text.startsWith("enc:")) return text; // Not encrypted
  try {
    const parts = text.split(":");
    const iv = Buffer.from(parts[1], "hex");
    const encryptedText = Buffer.from(parts[2], "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err) {
    console.error("Decryption failed:", err);
    return text; // Return raw text if fail
  }
}
