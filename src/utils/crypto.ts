// Custom client-side encryption using the Web Crypto API
// Ensures End-to-End Encryption (E2EE) for chats before sending they are transmitted.

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Derives a strong 256-bit AES-GCM Key from the room password and a room ID.
 * This ensures that even if two rooms use the same password, they derive different keys.
 */
export async function deriveRoomKey(password: string, roomId: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passwordBuffer = enc.encode(password);

  // Import password as PBKDF2 key material
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  // Pad or slice roomId to create a static 16-byte salt for PBKDF2
  const salt = enc.encode(roomId.padEnd(16, "salt-padding-string").slice(0, 16));

  // Derive AES-GCM 256-bit key
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 20000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts clean string text using derived room key
 */
export async function encryptText(text: string, key: CryptoKey): Promise<string> {
  const enc = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV is recommended for GCM
  
  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    enc.encode(text)
  );

  // Combine IV (12 bytes) and ciphertext of encrypted text
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return arrayBufferToBase64(combined.buffer);
}

/**
 * Decrypts a base64 encoded ciphertext string using the derived room key
 */
export async function decryptText(encryptedBase64: string, key: CryptoKey): Promise<string> {
  try {
    const combined = base64ToArrayBuffer(encryptedBase64);
    if (combined.byteLength < 12) {
      throw new Error("Invalid cipher packet structure.");
    }
    
    const iv = new Uint8Array(combined, 0, 12);
    const ciphertext = new Uint8Array(combined, 12);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (err) {
    console.error("Decryption failed. This is likely due to key mismatch.", err);
    return "🔐 [Decryption failed: Password incorrect or network handshake corrupted]";
  }
}
