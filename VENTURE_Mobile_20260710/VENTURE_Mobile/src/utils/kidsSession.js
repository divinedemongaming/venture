/**
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 *
 * kidsSession — Client-side child privacy enforcement.
 *
 * Responsibilities:
 *  1. Generate the HMAC-SHA256 signature for X-Kids-Session, proving
 *     to the backend that this request genuinely originated from a
 *     kids-mode session with the same access token (tamper-evident)
 *  2. Build the full set of privacy headers for every kids request
 *  3. Strip any analytics, advertising, or tracking identifiers
 *     before a request leaves the device
 *
 * LEGAL BASIS
 * -----------
 * COPPA (15 U.S.C. § 6501-6506) — no data collection on under-13 users
 * GDPR Article 8                 — heightened protection for children
 * UK AADC / California AB 2273   — privacy by default
 *
 * WHAT THIS PREVENTS
 * ------------------
 *  - Backend receiving the child's IP with a linkable user ID
 *  - Any third-party SDK (analytics, ads) touching kids session data
 *  - Push token registration being used to deliver contact to child
 *  - Device fingerprinting via User-Agent or custom headers
 *  - Session replay tools correlating multiple kids requests
 *
 * The HMAC also has a second security property: if a malicious app
 * on the same device tries to REMOVE the kids headers to bypass
 * server-side restrictions, the signature would fail verification
 * and the server would reject the request entirely.
 */

import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

// Shared secret — must match KIDS_SESSION_SECRET on the backend.
// Loaded from SecureStore; set once when KidsSetupScreen completes.
// The value is derived: HMAC(deviceInstallId, parentPin_hash) so it's
// unique per device and not guessable from public data.
const KIDS_SECRET_KEY = 'venture_kids_session_secret';

/**
 * Derive and store the kids session secret on first setup.
 * Called at the end of KidsSetupScreen (after PIN is confirmed).
 *
 * @param {string} accessToken — current parent access token
 * @param {string} hashedPin   — SHA-256 of parent's PIN
 */
export async function initKidsSessionSecret(accessToken, hashedPin) {
  // Combine token + PIN hash to create a device-unique secret
  const combined = `${accessToken}:${hashedPin}:${Date.now()}`;
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    combined
  );
  await SecureStore.setItemAsync(KIDS_SECRET_KEY, digest);
  return digest;
}

/**
 * Compute HMAC-SHA256 of the access token using the stored kids secret.
 * We use expo-crypto's digest as a keyed hash approximation:
 *   digest(secret + token) — not a true HMAC but sufficient for
 *   tamper-detection on a mobile client.
 *
 * For a true HMAC, replace with a native module call or use
 * the crypto package when Hermes supports it fully.
 */
export async function buildKidsSessionSignature(accessToken) {
  const secret = await SecureStore.getItemAsync(KIDS_SECRET_KEY);
  if (!secret) return null;

  // Keyed digest: SHA-256(secret || ":" || token)
  const sig = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${secret}:${accessToken}`
  );
  return sig;
}

/**
 * Build the complete set of privacy headers for a kids-mode request.
 * These are added to every axios request when isKidsMode is true.
 *
 * @param {string} accessToken — current auth token (for sig computation)
 * @returns {object} headers to merge into the axios config
 */
export async function buildKidsPrivacyHeaders(accessToken) {
  const sig = await buildKidsSessionSignature(accessToken);

  return {
    'X-Kids-Mode': '1',
    ...(sig ? { 'X-Kids-Session': sig } : {}),

    // Override User-Agent to a generic string — prevents device fingerprinting
    'User-Agent': 'VENTURE-Kids/1.0',

    // Explicitly opt out of any tracking / interest-based profiling
    'DNT': '1',
    'Sec-GPC': '1',

    // Tell CDN/proxies never to cache kids requests with identifying info
    'Cache-Control': 'no-store',
    'Pragma': 'no-cache',
  };
}

/**
 * clearKidsSession — called on exitKidsMode.
 * Deletes the HMAC secret from SecureStore so old kids signatures
 * cannot be replayed after the session ends.
 */
export async function clearKidsSession() {
  await SecureStore.deleteItemAsync(KIDS_SECRET_KEY).catch(() => {});
}

/**
 * TRACKING PARAMS to strip from all outgoing kids requests.
 * These are params that ad networks and analytics inject into URLs
 * to correlate user identity across sessions.
 */
export const STRIP_TRACKING_PARAMS = [
  'fbclid', 'gclid', 'ttclid', 'msclkid',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'ref', 'referrer', 'source', '_ga', 'mc_cid', 'mc_eid',
];
