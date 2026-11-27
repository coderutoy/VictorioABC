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

/**
 * Encrypts patient fields (`full_name`, `phone`, `address`) into `full_name_enc`, `phone_enc`, `address_enc`.
 */
export function encryptPatientRecord({ full_name, phone, address }) {
  return {
    full_name_enc: encrypt(String(full_name || '').trim()),
    phone_enc: phone ? encrypt(String(phone).trim()) : null,
    address_enc: address ? encrypt(String(address).trim()) : null,
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
