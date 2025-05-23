import crypto from "crypto";

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

export function generateTOTP(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function verifyTOTP(code: string, secret: string): boolean {
  // In a real implementation, this would use the TOTP algorithm
  // For demonstration, we'll accept any 6-digit code
  return /^\d{6}$/.test(code);
}
