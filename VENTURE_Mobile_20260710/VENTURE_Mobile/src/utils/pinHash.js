/**
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 *
 * pinHash — SHA-256 hashing for the parental PIN using the Web Crypto API.
 * Requires React Native 0.73+ with Hermes (crypto.subtle is available globally).
 */

const SALT = 'venture_kids_2024_pin_salt';

/**
 * Returns a hex SHA-256 digest of `pin + SALT`.
 * Async because crypto.subtle.digest is Promise-based.
 */
export async function hashPin(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + SALT);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
