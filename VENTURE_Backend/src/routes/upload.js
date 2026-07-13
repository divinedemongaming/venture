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
 *
 * Every video uploaded runs through:
 *   1. MIME + extension validation
 *   2. Exact-hash duplicate check (SHA-256)
 *   3. ffmpeg metadata injection  — creator identity baked into container
 *   4. Perceptual fingerprint     — 10-frame dHash stored in Redis
 *   5. Thumbnail extraction       — returned alongside the video URL
 *
 * Videos are output as MP4 with faststart regardless of input format.
 * Images are processed with Sharp: EXIF stripped, converted to WebP.
 */

'use strict';

const router   = require('express').Router();
const { authenticate } = require('../middleware/auth');
const multer   = require('multer');
const path     = require('path');
const os       = require('os');
const crypto   = require('crypto');
const sharp    = require('sharp');
const fs       = require('fs').promises;
const logger   = require('../utils/logger');
const { injectMetadata, extractThumbnail } = require('../services/videoWatermark');
const { videoFingerprint, imageDHash, contentHash, storeFingerprint,
        checkDuplicate } = require('../services/mediaFingerprint');
const { runContentIDPipeline } = require('../services/contentID');
const { scanFile: csamScanFile } = require('../services/csam');

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'];
const MAX_IMAGE_SIZE = 10  * 1024 * 1024;  // 10 MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024;  // 500 MB
const MAX_AUDIO_SIZE = 50  * 1024 * 1024;  // 50 MB

// ── File filter — strict MIME + extension cross-check ─────────────────────────
const fileFilter = (req, file, cb) => {
  const allAllowed = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES, ...ALLOWED_AUDIO_TYPES];
  if (!allAllowed.includes(file.mimetype)) {
    return cb(new Error(`File type not allowed: ${file.mimetype}`), false);
  }
  const ext = path.extname(file.originalname).toLowerCase();
  const typeExtMap = {
    'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'],
    'image/gif': ['.gif'],          'image/webp': ['.webp'],
    'video/mp4': ['.mp4'],          'video/webm': ['.webm'],
    'video/quicktime': ['.mov'],    'video/x-msvideo': ['.avi'],
    'audio/mpeg': ['.mp3'],         'audio/wav': ['.wav'],
    'audio/ogg': ['.ogg'],          'audio/mp4': ['.m4a'],
  };
  if (!typeExtMap[file.mimetype]?.includes(ext)) {
    return cb(new Error('File extension does not match content type'), false);
  }
  cb(null, true);
};

const storage = multer.memoryStorage();
const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_VIDEO_SIZE, files: 10 } });


// ── CSAM safety gate — MUST run before any storage ───────────────────────────
// This is non-negotiable. If the scan fails the file must be rejected.
// The function throws on detection so existing try/catch in routes handles it.
async function csamScan(buffer, mimeType, pHash, req) {
  const result = await csamScanFile({
    buffer,
    mimeType,
    filePath: null, // no disk path yet — buffer only at this stage
    pHash: pHash || null,
    uploader: {
      id:       req.user.id,
      username: req.user.username,
      email:    req.user.email || '',
    },
    ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
    requestId: req.headers['x-request-id'] || `req-${Date.now()}`,
  });

  if (!result.safe) {
    // Account is already suspended and NCMEC report submitted inside scanFile.
    // Throw a typed error so the route can return the right HTTP status.
    throw Object.assign(
      new Error('Upload rejected. This content violates platform policy.'),
      { code: 'CSAM_DETECTED', incidentId: result.incidentId }
    );
  }
}

// ── Process image — strip EXIF, convert to WebP, compute dHash ────────────────
async function processImage(buffer, filename) {
  const uploadDir = path.join(__dirname, '../../uploads/images');
  await fs.mkdir(uploadDir, { recursive: true });

  const processed = await sharp(buffer)
    .rotate()
    .withMetadata({ exif: {} })   // strip EXIF for privacy
    .webp({ quality: 85 })
    .toBuffer();

  const outFile = `${filename}.webp`;
  await fs.writeFile(path.join(uploadDir, outFile), processed);

  // Compute image fingerprint for duplicate detection
  const dhash = await imageDHash(processed).catch(() => null);
  const sha256 = contentHash(buffer);

  return { url: `/uploads/images/${outFile}`, dhash, sha256 };
}

// ── Process video — watermark + fingerprint + thumbnail ───────────────────────
async function processVideo(buffer, filename, creator) {
  const videoDir   = path.join(__dirname, '../../uploads/videos');
  const thumbDir   = path.join(__dirname, '../../uploads/thumbnails');
  await fs.mkdir(videoDir,  { recursive: true });
  await fs.mkdir(thumbDir,  { recursive: true });

  const contentId  = crypto.randomUUID();
  const tmpInput   = path.join(os.tmpdir(), `venture-in-${contentId}.tmp`);
  const outFile    = `${filename}.mp4`;
  const outPath    = path.join(videoDir, outFile);

  // Write buffer to temp file so ffmpeg can read it
  await fs.writeFile(tmpInput, buffer);

  try {
    // ── 1. Exact-hash duplicate check ────────────────────────────────────────
    const sha256 = contentHash(buffer);
    const duplicate = await checkDuplicate(sha256, []);
    if (duplicate?.matchType === 'exact') {
      logger.warn(`Duplicate upload blocked: ${contentId} matches ${duplicate.matchedContentId} (creator: ${duplicate.matchedCreatorId})`);
      throw Object.assign(
        new Error('This video has already been uploaded to VENTURE.'),
        { code: 'DUPLICATE_CONTENT', matchedContentId: duplicate.matchedContentId }
      );
    }

    // ── 2. Inject creator watermark into container metadata ──────────────────
    await injectMetadata(tmpInput, outPath, creator, contentId);

    // ── 3. Compute perceptual fingerprint (10 frame dHashes) ─────────────────
    const frameHashes = await videoFingerprint(outPath).catch(err => {
      // Non-fatal — log and continue without fingerprint
      logger.warn(`Fingerprint failed for ${contentId}: ${err.message}`);
      return [];
    });

    // ── 4. Store fingerprint + run full ContentID pipeline async ──────────────
    if (frameHashes.length > 0) {
      await storeFingerprint({
        contentId,
        contentType: 'video',
        creatorId: creator.id,
        frameHashes,
        sha256,
      });
    }
    // Fire ContentID pipeline after response — extracts audio FP, scans all
    // registered content, notifies original creators on match. Non-blocking.
    setImmediate(() =>
      runContentIDPipeline(outPath, contentId, creator.id, creator.username, 'video', frameHashes)
    );

    // ── 5. Extract thumbnail ──────────────────────────────────────────────────
    let thumbnailUrl = null;
    try {
      const thumbBuffer = await extractThumbnail(outPath);
      const thumbFile   = `${filename}-thumb.webp`;
      const processed   = await sharp(thumbBuffer).webp({ quality: 80 }).toBuffer();
      await fs.writeFile(path.join(thumbDir, thumbFile), processed);
      thumbnailUrl = `/uploads/thumbnails/${thumbFile}`;
    } catch (err) {
      logger.warn(`Thumbnail extraction failed for ${contentId}: ${err.message}`);
    }

    return {
      url: `/uploads/videos/${outFile}`,
      thumbnailUrl,
      contentId,
      fingerprinted: frameHashes.length > 0,
    };

  } finally {
    // Always clean up the temp input file
    await fs.unlink(tmpInput).catch(() => {});
  }
}

// ── POST /upload/image ─────────────────────────────────────────────────────────
router.post('/image', authenticate, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  if (!ALLOWED_IMAGE_TYPES.includes(req.file.mimetype))
    return res.status(400).json({ error: 'Images only for this endpoint' });
  if (req.file.size > MAX_IMAGE_SIZE)
    return res.status(400).json({ error: 'Image too large (max 10MB)' });

  const filename = `\${req.user.id}-\${crypto.randomUUID()}`;
  // ── CSAM gate — must pass before any file processing ──
  const imgDhash = await imageDHash(req.file.buffer).catch(() => null);
  await csamScan(req.file.buffer, req.file.mimetype, imgDhash, req);

  const result = await processImage(req.file.buffer, filename);
  res.json({ url: result.url, type: 'image' });
});

// ── POST /upload/video ─────────────────────────────────────────────────────────
router.post('/video', authenticate, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  if (!ALLOWED_VIDEO_TYPES.includes(req.file.mimetype))
    return res.status(400).json({ error: 'Video files only for this endpoint' });

  const filename = `\${req.user.id}-\${crypto.randomUUID()}`;
  const creator  = { id: req.user.id, username: req.user.username };

  try {
    // ── CSAM gate — must pass before any file processing ──
    // For video we use SHA-256 only at this stage; pHash runs post-ffmpeg
    // in processVideo and would flag on subsequent uploads.
    await csamScan(req.file.buffer, req.file.mimetype, null, req);

    const result = await processVideo(req.file.buffer, filename, creator);
    res.json({
      url: result.url,
      thumbnailUrl: result.thumbnailUrl,
      contentId: result.contentId,
      type: 'video',
      fingerprinted: result.fingerprinted,
    });
  } catch (err) {
    if (err.code === 'CSAM_DETECTED') {
      return res.status(451).json({ error: err.message, code: 'CSAM_DETECTED' });
    }
    if (err.code === 'DUPLICATE_CONTENT') {
      return res.status(409).json({
        error: err.message,
        code: 'DUPLICATE_CONTENT',
        matchedContentId: err.matchedContentId,
      });
    }
    logger.error('Video upload failed:', err.message);
    res.status(500).json({ error: 'Video processing failed. Please try again.' });
  }
});

// ── POST /upload/media  (multi-file: images + videos) ─────────────────────────
router.post('/media', authenticate, upload.array('files', 10), async (req, res) => {
  if (!req.files?.length) return res.status(400).json({ error: 'No files uploaded' });

  const creator = { id: req.user.id, username: req.user.username };

  const results = await Promise.all(
    req.files.map(async (file) => {
      const filename = `${req.user.id}-${crypto.randomUUID()}`;
      if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        const iDhash = await imageDHash(file.buffer).catch(() => null);
        await csamScan(file.buffer, file.mimetype, iDhash, req);
        const r = await processImage(file.buffer, filename);
        return { url: r.url, type: 'image' };
      }
      if (ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
        try {
          await csamScan(file.buffer, file.mimetype, null, req);
          const r = await processVideo(file.buffer, filename, creator);
          return { url: r.url, thumbnailUrl: r.thumbnailUrl, contentId: r.contentId, type: 'video' };
        } catch (err) {
          if (err.code === 'CSAM_DETECTED') {
            throw err; // escalate — this terminates the whole multi-upload
          }
          if (err.code === 'DUPLICATE_CONTENT') {
            return { error: err.message, code: 'DUPLICATE_CONTENT', type: 'video' };
          }
          throw err;
        }
      }
      return null;
    })
  );

  res.json({ files: results.filter(Boolean) });
});

module.exports = router;
