/**
 * ============================================================
 *  VENTURE — Creator Platform
 *  © 2024 DivineDemonGaming Inc. All Rights Reserved.
 *
 *  This software is the exclusive intellectual property of
 *  DivineDemonGaming Inc. Unauthorized copying, distribution,
 *  modification, or use of this software, in whole or in part,
 *  is strictly prohibited without written permission from
 *  DivineDemonGaming Inc.
 *
 *  Owner:    DivineDemonGaming Inc.
 *  Product:  VENTURE Creator Platform
 *  Contact:  legal@divinedemongaming.com
 * ============================================================
 */
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateAccessToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

const generateRefreshToken = (userId) =>
  jwt.sign({ userId, type: 'refresh' }, process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET, { expiresIn: '30d' });

const generateOTP = () => crypto.randomInt(100000, 999999).toString();

const generateSlug = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

module.exports = { generateAccessToken, generateRefreshToken, generateOTP, generateSlug };
