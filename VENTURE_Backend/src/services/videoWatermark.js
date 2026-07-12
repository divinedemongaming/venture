/**
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 *
 * videoWatermark — Embeds creator identity and platform ownership into
 * every video uploaded to VENTURE at the container-metadata level.
 *
 * What gets embedded (invisible to viewers, readable by any forensic tool):
 *   - MP4/container title field: "VENTURE :: @username :: <contentId>"
 *   - artist:     "@username (VENTURE Creator Platform)"
 *   - copyright:  "© 2024 DivineDemonGaming Inc. All Rights Reserved."
 *   - comment:    Full audit trail — creator, platform, timestamp, signature
 *   - encoder:    "VENTURE Platform v1.0 — DivineDemonGaming Inc."
 *   - Custom XMP: VENTURE_CREATOR, VENTURE_ID, VENTURE_SIG, VENTURE_TS
 *
 * Implementation:
 *   Uses ffmpeg with `-c copy` (stream copy — no re-encoding).
 *   Near-instant for any file size since only the container header changes.
 *   For non-MP4 inputs (MOV, AVI, WEBM) the video is remuxed to MP4.
 *
 * Ownership signature:
 *   HMAC-SHA256 of (creatorUsername + contentId + timestamp) using
 *   WATERMARK_SECRET env var. This lets us independently verify that
 *   a given video was processed by VENTURE's pipeline.
 */

'use strict';

const path    = require('path');
const os      = require('os');
const fs      = require('fs').promises;
const crypto  = require('crypto');
const ffmpeg  = require('fluent-ffmpeg');
const ffmpegBin = require('ffmpeg-static');
const logger  = require('../utils/logger');

ffmpeg.setFfmpegPath(ffmpegBin);

const OWNER   = 'DivineDemonGaming Inc';
const PRODUCT = 'VENTURE Creator Platform';
const SECRET  = process.env.WATERMARK_SECRET || 'venture_watermark_default_secret_change_in_prod';

// ── HMAC ownership signature ───────────────────────────────────────────────────
function ownershipSignature(creatorUsername, contentId, timestamp) {
  return crypto
    .createHmac('sha256', SECRET)
    .update(`${creatorUsername}::${contentId}::${timestamp}`)
    .digest('hex')
    .slice(0, 32); // 32 chars is enough — keeps metadata compact
}

// ── Inject metadata into video file ───────────────────────────────────────────
// inputPath  — path to source video file
// outputPath — path where watermarked file will be written
// creator    — { username, id }
// contentId  — UUID assigned to this content
//
// Returns outputPath on success.
async function injectMetadata(inputPath, outputPath, creator, contentId) {
  const timestamp = new Date().toISOString();
  const sig = ownershipSignature(creator.username, contentId, timestamp);

  const title     = `VENTURE :: @${creator.username} :: ${contentId}`;
  const artist    = `@${creator.username} (${PRODUCT})`;
  const comment   = [
    `Platform: ${PRODUCT}`,
    `Owner: ${OWNER}`,
    `Creator: @${creator.username}`,
    `Creator ID: ${creator.id}`,
    `Content ID: ${contentId}`,
    `Uploaded: ${timestamp}`,
    `Signature: ${sig}`,
    `Verify: https://venture.gg/ownership/verify/${sig}`,
  ].join(' | ');
  const copyright = `© 2024 ${OWNER}. All Rights Reserved.`;
  const encoder   = `${PRODUCT} v1.0 — ${OWNER}`;

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      // Stream copy — no re-encoding, preserves full quality, runs in <1s
      .videoCodec('copy')
      .audioCodec('copy')
      // Overwrite output format to MP4 (handles MOV, AVI, WEBM remux)
      .outputFormat('mp4')
      // Container metadata
      .outputOptions([
        `-metadata`, `title=${title}`,
        `-metadata`, `artist=${artist}`,
        `-metadata`, `comment=${comment}`,
        `-metadata`, `copyright=${copyright}`,
        `-metadata`, `encoder=${encoder}`,
        `-metadata`, `VENTURE_CREATOR=@${creator.username}`,
        `-metadata`, `VENTURE_ID=${contentId}`,
        `-metadata`, `VENTURE_SIG=${sig}`,
        `-metadata`, `VENTURE_TS=${timestamp}`,
        `-metadata`, `VENTURE_OWNER=${OWNER}`,
        // Move moov atom to start of file — better streaming performance
        `-movflags`, `+faststart`,
      ])
      .output(outputPath)
      .on('end', () => {
        logger.info(`Video watermarked: ${contentId} for @${creator.username}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        logger.error(`Watermark failed for ${contentId}: ${err.message}`);
        reject(err);
      })
      .run();
  });
}

// ── Extract thumbnail from video ───────────────────────────────────────────────
// Grabs a frame at 10% of video duration, returns PNG buffer.
async function extractThumbnail(videoPath) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'venture-thumb-'));
  const thumbPath = path.join(tmpDir, 'thumb.png');

  try {
    await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, meta) => {
        if (err) return reject(err);
        const duration = meta.format?.duration || 10;
        const ts = (duration * 0.1).toFixed(2);

        ffmpeg(videoPath)
          .seekInput(ts)
          .frames(1)
          .output(thumbPath)
          .on('end', resolve)
          .on('error', reject)
          .run();
      });
    });

    return await fs.readFile(thumbPath);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

// ── Verify a video's watermark (for admin / legal use) ────────────────────────
// Returns the embedded metadata object or null if not a VENTURE video.
function verifyWatermark(ffprobeMetadata) {
  const tags = ffprobeMetadata?.format?.tags || {};
  const sig = tags.VENTURE_SIG || tags.venture_sig;
  const creator = tags.VENTURE_CREATOR || tags.venture_creator;
  const contentId = tags.VENTURE_ID || tags.venture_id;
  const ts = tags.VENTURE_TS || tags.venture_ts;

  if (!sig || !creator || !contentId) return null;

  // Re-derive the expected signature and compare
  const username = creator.replace('@', '');
  const expected = ownershipSignature(username, contentId, ts);
  const valid = sig === expected;

  return {
    valid,
    creator,
    contentId,
    timestamp: ts,
    owner: OWNER,
    platform: PRODUCT,
    signature: sig,
  };
}

module.exports = { injectMetadata, extractThumbnail, verifyWatermark, ownershipSignature };
