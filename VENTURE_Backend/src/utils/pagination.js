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
const paginate = (query, page = 1, limit = 20) => {
  const skip = (Math.max(1, parseInt(page)) - 1) * Math.min(50, parseInt(limit));
  const take = Math.min(50, parseInt(limit));
  return { skip, take };
};

const paginatedResponse = (data, total, page, limit) => ({
  data,
  pagination: {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil(total / parseInt(limit)),
    hasMore: parseInt(page) * parseInt(limit) < total
  }
});

module.exports = { paginate, paginatedResponse };
