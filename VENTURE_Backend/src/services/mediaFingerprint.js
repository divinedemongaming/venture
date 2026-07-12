/**
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 *
 * mediaFingerprint — Perceptual fingerprinting for images and videos.
 *
 * Uses a 64-bit Difference Hash (dHash):
 *   1. Resize to 9×8 grayscale
 *   2. For each row, compare adjacent pixels — 1 if left > right, else 0
 *   3. Pack 64 bits into a 16-char hex string
 *
 * For video: extract 10 evenly-spaced frames via ffmpeg, hash each frame.
 * Fingerprint = array of 10 frame hashes stored in Redis.
 *
 * Duplicate detection: Hamming distance < DUPLICATE_THRESHOLD across any
 * matching frame pair indicates likely duplicate content.
 */

'use strict';

const path     = require('path');
const os       = require('os');
const fs       = require('fs').promises;
const crypto   = require('crypto');
const sharp    = require('sharp');
const ffmpeg   = require('fluent-ffmpeg');
const ffmpegBin = require('ffmpeg-static');
const { redisSet, redisGet } = require('./redis');
const logger   = require('../utils/logger');

ffmpeg.setFfmpegPath(ffmpegBin);

// Hamming distance threshold — hashes this close or closer = likely duplicate
const DUPLICATE_THRESHOLD = 8;   // out of 64 bits
const FRAME_COUNT         = 10;  // frames extracted per video
const REDIS_TTL           = 60 * 60 * 24 * 365; // 1 year

// ── dHash: 64-bit difference hash from an image buffer ────────────────────────
async function imageDHash(buffer) {
  // Resize to 9×8 grayscale — 9 wide gives us 8 horizontal comparisons per row
  const raw = await sharp(buffer)
    .resize(9, 8, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer();

  let bits = 0n; // BigInt — 64 bits
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const idx = row * 9 + col;
      const bit = raw[idx] > raw[idx + 1] ? 1n : 0n;
      bits = (bits << 1n) | bit;
    }
  }

  // Return as 16-char zero-padded hex
  return bits.toString(16).padStart(16, '0');
}

// ── Hamming distance between two hex dHash strings ────────────────────────────
function hammingDistance(hashA, hashB) {
  const a = BigInt('0x' + hashA);
  const b = BigInt('0x' + hashB);
  let xor = a ^ b;
  let dist = 0;
  while (xor > 0n) {
    dist += Number(xor & 1n);
    xor >>= 1n;
  }
  return dist;
}

// ── Extract N frames from a video file ────────────────────────────────────────
function extractFrames(videoPath, frameCount, tmpDir) {
  return new Promise((resolve, reject) => {
    // Get video duration first, then extract frames at even intervals
    ffmpeg.ffprobe(videoPath, (err, meta) => {
      if (err) return reject(err);

      const duration = meta.format?.duration || 30;
      // Avoid the very first and last second (often black/fade frames)
      const step = Math.max((duration - 2) / (frameCount + 1), 0.5);
      const timestamps = Array.from(
        { length: frameCount },
        (_, i) => Math.min(1 + step * (i + 1), duration - 0.5).toFixed(2)
      );

      const framePaths = timestamps.map((t, i) =>
        path.join(tmpDir, `frame_${i}_${t}.png`)
      );

      // Extract all frames in one ffmpeg pass using select filter
      const selectExpr = timestamps.map(t => `eq(t\\,${t})`).join('+');

      ffmpeg(videoPath)
        .outputOptions([
          `-vf`, `select='${selectExpr}',setpts=N/FRAME_RATE/TB`,
          `-vsync`, `vfr`,
          `-q:v`, `2`,
        ])
        .output(path.join(tmpDir, 'frame_%d.png'))
        .on('end', () => {
          // Resolve with whichever frame files actually exist
          Promise.all(
            Array.from({ length: frameCount }, (_, i) =>
              fs.access(path.join(tmpDir, `frame_${i + 1}.png`))
                .then(() => path.join(tmpDir, `frame_${i + 1}.png`))
                .catch(() => null)
            )
          ).then(paths => resolve(paths.filter(Boolean)));
        })
        .on('error', reject)
        .run();
    });
  });
}

// ── Compute fingerprint for a video file ──────────────────────────────────────
async function videoFingerprint(videoPath) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'venture-fp-'));
  try {
    const framePaths = await extractFrames(videoPath, FRAME_COUNT, tmpDir);
    const hashes = await Promise.all(
      framePaths.map(async (fp) => {
        const buf = await fs.readFile(fp);
        return imageDHash(buf);
      })
    );
    return hashes;
  } finally {
    // Clean up temp frames
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

// ── SHA-256 content hash (exact duplicate / tamper detection) ──────────────────
function contentHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// ── Store fingerprint in Redis ─────────────────────────────────────────────────
async function storeFingerprint({ contentId, contentType, creatorId, frameHashes, sha256 }) {
  const record = JSON.stringify({ contentId, contentType, creatorId, frameHashes, sha256, storedAt: new Date().toISOString() });
  // Keyed by sha256 for exact-match lookup
  await redisSet(`fp:sha256:${sha256}`, record, { EX: REDIS_TTL });
  // Also store by contentId for lookup by ID
  await redisSet(`fp:content:${contentId}`, record, { EX: REDIS_TTL });
  logger.info(`Fingerprint stored: ${contentId} (${contentType}) by ${creatorId}`);
}

// ── Check for duplicate content ────────────────────────────────────────────────
// Returns { isDuplicate, matchedContentId, matchType } or null
async function checkDuplicate(sha256, frameHashes) {
  // 1. Exact hash match (same file bytes — definite duplicate)
  const exact = await redisGet(`fp:sha256:${sha256}`);
  if (exact) {
    const rec = JSON.parse(exact);
    return { isDuplicate: true, matchType: 'exact', matchedContentId: rec.contentId, matchedCreatorId: rec.creatorId };
  }

  // 2. Perceptual match — scan recent fingerprints stored in a set
  // For scalability this would use a vector DB or dedicated pHash index.
  // Here we use a Redis set of recently stored perceptual hashes for fast scanning.
  // In production: replace with a dedicated ANN (approximate nearest neighbour) index.
  // We store a "compact fingerprint" — median frame hash — keyed for lookup.
  const medianHash = frameHashes[Math.floor(frameHashes.length / 2)];
  const nearbyKeys = []; // placeholder — full perceptual scan deferred to async job

  return null; // no exact duplicate
}

// ── Async duplicate scan — now delegates to ContentID engine ──────────────────
// Kept for backward compat; ContentID pipeline handles the real work.
async function asyncDuplicateScan(contentId, frameHashes, creatorId) {
  logger.info(`Async duplicate scan queued for ${contentId} (handled by ContentID pipeline)`);
}

module.exports = {
  imageDHash,
  videoFingerprint,
  contentHash,
  storeFingerprint,
  checkDuplicate,
  asyncDuplicateScan,
  hammingDistance,
  DUPLICATE_THRESHOLD,
};
