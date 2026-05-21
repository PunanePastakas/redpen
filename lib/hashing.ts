import { createHash } from "node:crypto"

export async function sha256Hex(value: string | ArrayBuffer | Uint8Array) {
  if (typeof value === "string") {
    return createHash("sha256").update(value, "utf8").digest("hex")
  }

  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value)
  return createHash("sha256").update(bytes).digest("hex")
}

export function sha256HexSync(value: string | Uint8Array) {
  return createHash("sha256").update(value).digest("hex")
}
