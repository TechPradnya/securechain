import { keccak256 } from "ethers";

/**
 * Calculates cryptographic hashes of a file in the browser
 * Completely client-side: the file never leaves the user's computer.
 */

export interface FileHashResult {
  fileName: string;
  fileSize: number;
  fileType: string;
  sha256: string;      // Standard SHA-256 hash (0x-prefixed bytes32 hex)
  keccak256Hash: string; // Ethereum / Solidity native Keccak-256 hash
}

export async function computeFileHash(file: File): Promise<FileHashResult> {
  const arrayBuffer = await file.arrayBuffer();
  
  // 1. Native Web Crypto API SHA-256
  const sha256Buffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const sha256Array = Array.from(new Uint8Array(sha256Buffer));
  const sha256Hex = "0x" + sha256Array.map((b) => b.toString(16).padStart(2, "0")).join("");

  // 2. Solidity-standard Keccak-256
  const uint8Array = new Uint8Array(arrayBuffer);
  const keccakHex = keccak256(uint8Array);

  return {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type || "application/octet-stream",
    sha256: sha256Hex,
    keccak256Hash: keccakHex,
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
