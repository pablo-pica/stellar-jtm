import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Merge Tailwind CSS classes dynamically
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Validate Stellar public address format
export function validateStellarAddress(address: string): boolean {
  return /^G[A-D][A-Z2-7]{54}$/.test(address);
}

// Sanitize string to be a valid Soroban Symbol (a-zA-Z0-9_, max 32 chars)
export function sanitizeSymbol(str: string): string {
  const sanitized = str
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .slice(0, 32);
  return sanitized || "milestone";
}
