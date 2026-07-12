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
const { createClient } = require('redis');
const logger = require('../utils/logger');

let client = null;

const connectRedis = async () => {
  try {
    client = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    client.on('error', (err) => logger.error('Redis error:', err));
    client.on('reconnecting', () => logger.warn('Redis reconnecting...'));
    await client.connect();
    return client;
  } catch (err) {
    logger.warn('Redis unavailable — running without cache. Some features may be degraded.');
    client = null;
  }
};

const getRedis = () => client;

// Helper wrappers with null safety
const redisGet = async (key) => {
  if (!client) return null;
  return client.get(key);
};

const redisSet = async (key, value, options = {}) => {
  if (!client) return;
  return client.set(key, value, options);
};

const redisDel = async (key) => {
  if (!client) return;
  return client.del(key);
};

const redisIncr = async (key) => {
  if (!client) return 0;
  return client.incr(key);
};

const redisExpire = async (key, seconds) => {
  if (!client) return;
  return client.expire(key, seconds);
};

module.exports = { connectRedis, getRedis, redisGet, redisSet, redisDel, redisIncr, redisExpire };
