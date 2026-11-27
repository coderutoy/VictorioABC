import {
  encrypt,
  decrypt,
  isEncrypted,
  encryptPatientPII,
  decryptPatientPII,
} from '../src/utils/crypto.js';

export {
  encrypt,
  decrypt,
  isEncrypted,
  encryptPatientPII,
  decryptPatientPII,
};

export const encryptField = encrypt;
export const decryptField = decrypt;

function safeEncrypt(val) {
  if (val === null || val === undefined) return null;
  const trimmed = String(val).trim();
  if (!trimmed) return trimmed;
  try {
    return encrypt(trimmed);
  } catch {
    return trimmed;
  }
}

/**
 * Encrypts patient fields (`full_name`, `phone`, `address`) into `full_name_enc`, `phone_enc`, `address_enc`.
 */
export function encryptPatientRecord({ full_name, phone, address }) {
  return {
    full_name_enc: safeEncrypt(full_name || ''),
    phone_enc: phone ? safeEncrypt(phone) : null,
    address_enc: address ? safeEncrypt(address) : null,
  };
}

/**
 * Decrypts a `patients` row (`full_name_enc`, `phone_enc`, `address_enc`) into readable fields
 * while gracefully handling legacy plaintext values without throwing.
 */
export function decryptPatientRecord(row) {
  if (!row || typeof row !== 'object') return null;
  const fullName = row.full_name_enc ? decrypt(row.full_name_enc) : row.full_name || '';
  const phone = row.phone_enc ? decrypt(row.phone_enc) : row.phone || '';
  const address = row.address_enc ? decrypt(row.address_enc) : row.address || '';
  return {
    ...row,
    full_name: fullName,
    phone,
    address,
  };
}
