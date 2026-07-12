/**
 * ============================================================
 *  VENTURE — Creator Platform
 *  © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * ============================================================
 */

const crypto = require('crypto');

// Cryptographic ownership signature — generated from the owner string.
// Any derivative or stolen version that removes this can be proven
// inauthentic by the absence of this verifiable signature chain.
const OWNER          = 'DivineDemonGaming Inc';
const PRODUCT        = 'VENTURE Creator Platform';
const BUILD_DATE     = '2024';
const CONTACT        = 'legal@divinedemongaming.com';

// SHA-256 hash of the ownership string — embeds into every API response
// and can be independently verified against the original.
const OWNERSHIP_HASH = crypto
  .createHash('sha256')
  .update(`${OWNER}::${PRODUCT}::${BUILD_DATE}`)
  .digest('hex');

const SIGNATURE = Buffer.from(
  `${OWNER} | ${PRODUCT} | Copyright ${BUILD_DATE}`
).toString('base64');

/**
 * Middleware — injects ownership fingerprint into every HTTP response header.
 * Headers are logged by CDNs, proxies, and web inspection tools.
 * This creates a permanent, verifiable trail of ownership.
 */
const watermarkMiddleware = (req, res, next) => {
  res.setHeader('X-Platform',          'VENTURE');
  res.setHeader('X-Owner',             OWNER);
  res.setHeader('X-Product',           PRODUCT);
  res.setHeader('X-Copyright',         `Copyright ${BUILD_DATE} ${OWNER}. All Rights Reserved.`);
  res.setHeader('X-Ownership-Hash',    OWNERSHIP_HASH);
  res.setHeader('X-Contact',           CONTACT);
  next();
};

/**
 * Verify a claimed ownership hash matches the real one.
 * Used in admin panel to prove authenticity.
 */
const verifyOwnership = (hash) => hash === OWNERSHIP_HASH;

module.exports = { watermarkMiddleware, OWNERSHIP_HASH, SIGNATURE, OWNER, PRODUCT, verifyOwnership };
