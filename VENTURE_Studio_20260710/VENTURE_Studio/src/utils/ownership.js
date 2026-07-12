/*
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 */

/**
 * Ownership certificate for VENTURE Studio.
 * Mirrors the /ownership endpoint on the backend.
 * Call verifyOwnership() to produce a verifiable certificate object.
 */

const CERT = Object.freeze({
  owner:     'DivineDemonGaming Inc.',
  product:   'VENTURE Creator Platform',
  module:    'Studio (Web)',
  copyright: '© 2024 DivineDemonGaming Inc. All Rights Reserved.',
  year:      2024,
  contact:   'legal@divinedemongaming.com',
  rights:    'All rights reserved. Unauthorized use, reproduction, or distribution is strictly prohibited.',
  verifyUrl: 'https://studio.venture.app/ownership',
});

/**
 * Returns the ownership certificate with a live timestamp.
 * Expose via UI "About" dialog or attach to API calls as proof of origin.
 */
export function verifyOwnership() {
  return { ...CERT, verified: true, timestamp: new Date().toISOString() };
}

export default CERT;
