import crypto from 'node:crypto';
import dotenv from 'dotenv';

dotenv.config();

const ALGORITHM = 'aes-256-gcm';
const IV_BYTE_LENGTH = 12; // 96-bit IV recommended for AES-GCM
const AUTH_TAG_BYTE_LENGTH = 16; // 128-bit authentication tag
const ENCRYPTED_PAYLOAD_REGEX = /^[0-9a-fA-F]{24}:[0-9a-fA-F]{32}:[0-9a-fA-F]+$/;

/**
 * Resolves the 32-byte AES-256 key from process.env.ENCRYPTION_KEY.
 * Expects a 64-character hex string (32 bytes).
 */
function getEncryptionKey() {
  const rawKey = (process.env.ENCRYPTION_KEY || '').trim();
  if (!rawKey) {
    throw new Error('Missing process.env.ENCRYPTION_KEY required for AES-256-GCM encryption.');
  }

  if (/^[0-9a-fA-F]{64}$/.test(rawKey)) {
    return Buffer.from(rawKey, 'hex');
  }

  if (Buffer.byteLength(rawKey, 'utf8') === 32) {
    return Buffer.from(rawKey, 'utf8');
  }

  return crypto.createHash('sha256').update(rawKey).digest();
}

/**
 * Checks whether a string matches the `<24-hex-iv>:<32-hex-tag>:<hex-ciphertext>` format.
 */
export function isEncrypted(value) {
  return typeof value === 'string' && ENCRYPTED_PAYLOAD_REGEX.test(value);
}

/**
 * Encrypts a UTF-8 plaintext string using AES-256-GCM with a random 12-byte IV.
 * Output format: `<iv_hex>:<authTag_hex>:<ciphertext_hex>`
 */
export function encrypt(plaintext) {
  if (plaintext === null || plaintext === undefined) return null;
  const str = String(plaintext).trim();
  if (!str) return str;
  if (isEncrypted(str)) return str;

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_BYTE_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_BYTE_LENGTH,
  });

  const encrypted = Buffer.concat([cipher.update(str, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypts an AES-256-GCM `<iv_hex>:<authTag_hex>:<ciphertext_hex>` payload back to UTF-8.
 * Safely returns plaintext values untouched so legacy or unencrypted rows do not throw.
 */
export function decrypt(ciphertextPayload) {
  if (ciphertextPayload === null || ciphertextPayload === undefined) return null;
  const str = String(ciphertextPayload);
  if (!str || !isEncrypted(str)) {
    return str;
  }

  try {
    const [ivHex, authTagHex, encryptedHex] = str.split(':');
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encryptedBytes = Buffer.from(encryptedHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_BYTE_LENGTH,
    });
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encryptedBytes), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (err) {
    console.error('[Crypto] Failed to decrypt field, returning raw value:', err.message);
    return str;
  }
}

/**
 * Encrypts sensitive PII fields (`phone`, `address`, `government_id`) on a patient payload
 * prior to Supabase writes. Packs `government_id` inside the encrypted `address` envelope
 * when present so it is protected at rest without requiring extra schema columns.
 */
export function encryptPatientPII(payload = {}) {
  const next = { ...payload };

  if (typeof next.phone === 'string' && next.phone.trim() !== '') {
    next.phone = encrypt(next.phone.trim());
  }

  const rawAddress = typeof next.address === 'string' ? next.address.trim() : '';
  const rawGovId = typeof next.government_id === 'string' ? next.government_id.trim() : '';

  if (rawAddress) {
    if (rawGovId) {
      const envelope = JSON.stringify({
        __pii_v1: true,
        address: rawAddress,
        government_id: rawGovId,
      });
      next.address = encrypt(envelope);
    } else {
      next.address = encrypt(rawAddress);
    }
  }

  delete next.government_id;
  return next;
}

/**
 * Decrypts sensitive PII fields (`phone`, `address`, `government_id`) on a patient record
 * retrieved from Supabase.
 */
export function decryptPatientPII(record) {
  if (!record || typeof record !== 'object') return record;
  const next = { ...record };

  if (typeof next.phone === 'string') {
    next.phone = decrypt(next.phone);
  }

  if (typeof next.address === 'string') {
    const decryptedAddress = decrypt(next.address);
    if (typeof decryptedAddress === 'string' && decryptedAddress.startsWith('{"__pii_v1":true')) {
      try {
        const parsed = JSON.parse(decryptedAddress);
        next.address = parsed.address || '';
        next.government_id = parsed.government_id || null;
      } catch {
        next.address = decryptedAddress;
        next.government_id = next.government_id ? decrypt(next.government_id) : null;
      }
    } else {
      next.address = decryptedAddress;
      next.government_id = next.government_id ? decrypt(next.government_id) : null;
    }
  } else {
    next.government_id = next.government_id ? decrypt(next.government_id) : null;
  }

  return next;
}

export const encryptField = encrypt;
export const decryptField = decrypt;
