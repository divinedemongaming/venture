/**
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 *
 * contentID — VENTURE's Content Identification Engine
 *
 * Protects creators by fingerprinting every uploaded video and scanning
 * for near-duplicates across the entire platform, even after re-encoding,
 * compression, or format conversion.
 *
 * ── Audio fingerprint (primary) ──────────────────────────────────────────────
 * Based on Haitsma & Kalker (2002) "A Highly Robust Audio Fingerprinting System"
 * — the same academic foundation behind Shazam and most commercial systems.
 *
 * Algorithm:
 *   1. Resample audio to 8 kHz, mono via ffmpeg
 *   2. Divide into overlapping 4096-sample frames (512ms, 2048-sample hop)
 *   3. Apply Goertzel algorithm at 32 logarithmically-spaced frequency bands
 *   4. For each frame: compare sub-band energy to adjacent band and previous frame
 *   5. Pack 32 comparison bits → uint32 per frame
 *   6. Result: compact array of uint32s (~8/sec) surviving re-encoding
 *
 * ── Video fingerprint (secondary) ────────────────────────────────────────────
 * 10-frame dHash array (from mediaFingerprint.js). Used when audio is absent
 * (silent videos, muted clips) or as a corroborating signal.
 *
 * ── Matching ─────────────────────────────────────────────────────────────────
 * Audio: sliding-window bit error rate. BER < 0.30 over a 30-second window = match.
 * Video: Hamming distance < 8 bits on any matching frame pair = candidate; 2+ = match.
 *
 * ── Storage ──────────────────────────────────────────────────────────────────
 * All fingerprints live in Redis (TTL: 1 year). A sorted set `cid:index` maps
 * contentId → upload timestamp for enumeration. O(N) scan is fine at startup
 * scale; swap in a vector DB (pgvector / FAISS) when N > 100K.
 *
 * ── Match reports ────────────────────────────────────────────────────────────
 * Matches are stored per content ID and per creator for dashboard display.
 * Original creator gets an in-app notification on confirmed match.
 */

'use strict';

const path     = require('path');
const ffmpeg   = require('fluent-ffmpeg');
const ffmpegBin = require('ffmpeg-static');
const { getRedis, redisSet, redisGet } = require('./redis');
const { notifyUser } = require('./socket');
const logger   = require('../utils/logger');

ffmpeg.setFfmpegPath(ffmpegBin);

// ── Constants ─────────────────────────────────────────────────────────────────
const SAMPLE_RATE      = 8000;
const FRAME_SIZE       = 4096;   // samples per frame (~512ms at 8kHz)
const HOP_SIZE         = 2048;   // 50% overlap (~8 frames/sec)
const NUM_BANDS        = 32;
const BER_THRESHOLD    = 0.30;   // bit error rate below this = audio match
const DHASH_THRESHOLD  = 8;      // Hamming distance below this = frame match
const MIN_FRAME_MATCHES = 2;     // need this many matching frames for video match
const MAX_OFFSET_RATIO = 0.15;   // scan ±15% time offset when comparing
const FP_TTL           = 60 * 60 * 24 * 365; // 1 year

// 32 logarithmically-spaced frequency band centres: 300 Hz → 4000 Hz
const BAND_FREQS = Array.from({ length: NUM_BANDS }, (_, i) =>
  Math.round(300 * Math.pow(4000 / 300, i / (NUM_BANDS - 1)))
);

// ── Goertzel — energy at a single target frequency ───────────────────────────
// O(N) — much faster than full FFT when only a few frequencies are needed
function goertzel(samples, targetFreq) {
  const N     = samples.length;
  const k     = Math.round(N * targetFreq / SAMPLE_RATE);
  const omega = (2 * Math.PI * k) / N;
  const coeff = 2 * Math.cos(omega);
  let s0 = 0, s1 = 0, s2 = 0;
  for (let i = 0; i < N; i++) {
    s0 = (samples[i] / 32768) + coeff * s1 - s2; // normalise int16 → float
    s2 = s1;
    s1 = s0;
  }
  return s1 * s1 + s2 * s2 - coeff * s1 * s2;
}

// ── Extract raw PCM from any video/audio file ─────────────────────────────────
function extractPCM(filePath) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let hasAudio = true;

    const cmd = ffmpeg(filePath)
      .noVideo()
      .audioFrequency(SAMPLE_RATE)
      .audioChannels(1)
      .audioCodec('pcm_s16le')
      .format('s16le');

    const stream = cmd.pipe();

    stream.on('data',  chunk  => chunks.push(chunk));
    stream.on('end',   ()     => {
      if (!chunks.length) return resolve(null); // no audio
      const buf = Buffer.concat(chunks);
      // Buffer is 16-bit LE PCM — view as Int16Array
      const samples = new Int16Array(buf.buffer, buf.byteOffset, Math.floor(buf.byteLength / 2));
      resolve(samples);
    });
    stream.on('error', ()     => resolve(null)); // no audio stream — not an error

    cmd.on('error', (err) => {
      if (err.message?.includes('no audio') || err.message?.includes('Output file #0')) {
        resolve(null); // gracefully handle no audio
      } else {
        reject(err);
      }
    });
  });
}

// ── Compute Haitsma & Kalker audio fingerprint ────────────────────────────────
function computeAudioFP(samples) {
  const fingerprint = [];
  let prevEnergies  = null;

  for (let pos = 0; pos + FRAME_SIZE <= samples.length; pos += HOP_SIZE) {
    const frame = samples.slice(pos, pos + FRAME_SIZE);

    // Energy at each band centre via Goertzel
    const energies = BAND_FREQS.map(f => goertzel(frame, f));

    if (prevEnergies !== null) {
      let bits = 0;
      for (let s = 0; s < NUM_BANDS - 1; s++) {
        // Temporal energy differential across adjacent bands
        // bit = 1 if (E[s,t] - E[s+1,t]) > (E[s,t-1] - E[s+1,t-1])
        const diff = (energies[s] - energies[s + 1]) - (prevEnergies[s] - prevEnergies[s + 1]);
        if (diff > 0) bits |= (1 << s);
      }
      fingerprint.push(bits >>> 0); // unsigned 32-bit
    }

    prevEnergies = energies;
  }

  return fingerprint; // uint32[]
}

// ── Popcount — count set bits in a 32-bit integer ────────────────────────────
function popcount(x) {
  x = x >>> 0;
  x -= (x >> 1) & 0x55555555;
  x  = (x & 0x33333333) + ((x >> 2) & 0x33333333);
  x  = (x + (x >> 4)) & 0x0f0f0f0f;
  return Math.imul(x, 0x01010101) >>> 24;
}

// ── Hamming distance between two 32-bit integers ─────────────────────────────
const hamming32 = (a, b) => popcount(a ^ b);

// ── Audio fingerprint BER with time-offset search ────────────────────────────
// Returns similarity score 0–1. Values > (1 - BER_THRESHOLD) are matches.
function audioSimilarity(fp1, fp2) {
  if (!fp1?.length || !fp2?.length) return 0;
  const maxOffset = Math.floor(Math.min(fp1.length, fp2.length) * MAX_OFFSET_RATIO);
  let best = 0;

  for (let offset = -maxOffset; offset <= maxOffset; offset++) {
    const start1 = Math.max(0,  offset);
    const start2 = Math.max(0, -offset);
    const len    = Math.min(fp1.length - start1, fp2.length - start2);
    if (len < 30) continue; // need at least ~4 seconds of overlap

    let matchBits = 0;
    for (let i = 0; i < len; i++) {
      matchBits += 32 - hamming32(fp1[start1 + i], fp2[start2 + i]);
    }
    const score = matchBits / (len * 32);
    if (score > best) best = score;
  }

  return best; // > 0.70 = strong match, > 0.65 = probable match
}

// ── Serialize fingerprint for Redis storage ───────────────────────────────────
function serializeFP(fp) {
  const buf = Buffer.allocUnsafe(fp.length * 4);
  fp.forEach((v, i) => buf.writeUInt32LE(v >>> 0, i * 4));
  return buf.toString('base64');
}

function deserializeFP(b64) {
  if (!b64) return null;
  const buf = Buffer.from(b64, 'base64');
  const fp  = [];
  for (let i = 0; i < buf.length; i += 4) fp.push(buf.readUInt32LE(i));
  return fp;
}

// ── Hamming distance between two dHash hex strings ───────────────────────────
function hashHamming(a, b) {
  const av = BigInt('0x' + a);
  const bv = BigInt('0x' + b);
  let xor = av ^ bv;
  let dist = 0;
  while (xor > 0n) { dist += Number(xor & 1n); xor >>= 1n; }
  return dist;
}

// ── Full fingerprint extraction from a video path ────────────────────────────
async function extractFingerprints(videoPath) {
  const [pcm] = await Promise.allSettled([extractPCM(videoPath)]);
  const samples = pcm.status === 'fulfilled' ? pcm.value : null;
  const audioFP = samples ? computeAudioFP(samples) : null;
  return { audioFP };
}

// ── Register content in the ContentID index ───────────────────────────────────
async function registerContent({ contentId, creatorId, creatorUsername, contentType, audioFP, frameHashes }) {
  const redis = getRedis();
  const meta  = JSON.stringify({ creatorId, creatorUsername, contentType, uploadedAt: new Date().toISOString() });

  await redisSet(`cid:meta:${contentId}`,  meta,                               { EX: FP_TTL });
  await redisSet(`cid:video:${contentId}`, JSON.stringify(frameHashes || []),  { EX: FP_TTL });

  if (audioFP?.length) {
    await redisSet(`cid:audio:${contentId}`, serializeFP(audioFP), { EX: FP_TTL });
  }

  // Add to enumeration index (sorted set: score = upload timestamp)
  if (redis) {
    await redis.zAdd('cid:index', { score: Date.now(), value: contentId });
    await redis.expire('cid:index', FP_TTL);
  }

  logger.info(`ContentID registered: ${contentId} (${contentType}) by @${creatorUsername} — audio frames: ${audioFP?.length ?? 0}, video frames: ${frameHashes?.length ?? 0}`);
}

// ── Scan all registered content for matches ───────────────────────────────────
// Returns array of { contentId, creatorId, audioScore, videoScore, matchType }
async function scanForMatches(newContentId, newAudioFP, newFrameHashes) {
  const redis = getRedis();
  if (!redis) return [];

  // Fetch all registered content IDs
  const allIds = await redis.zRange('cid:index', 0, -1).catch(() => []);
  if (!allIds.length) return [];

  const matches = [];

  await Promise.all(allIds.map(async (contentId) => {
    if (contentId === newContentId) return; // skip self

    const [metaRaw, audioRaw, videoRaw] = await Promise.all([
      redisGet(`cid:meta:${contentId}`),
      redisGet(`cid:audio:${contentId}`),
      redisGet(`cid:video:${contentId}`),
    ]);

    if (!metaRaw) return;
    const meta = JSON.parse(metaRaw);

    // ── Audio comparison ──────────────────────────────────────────────────────
    let audioScore = 0;
    if (newAudioFP?.length && audioRaw) {
      const existingFP = deserializeFP(audioRaw);
      audioScore = audioSimilarity(newAudioFP, existingFP);
    }

    // ── Video (pHash) comparison ──────────────────────────────────────────────
    let videoScore = 0;
    let frameMatchCount = 0;
    if (newFrameHashes?.length && videoRaw) {
      const existingHashes = JSON.parse(videoRaw);
      // Count frame pairs within Hamming threshold (position-independent)
      for (const newHash of newFrameHashes) {
        for (const exHash of existingHashes) {
          if (hashHamming(newHash, exHash) < DHASH_THRESHOLD) {
            frameMatchCount++;
            break; // one match per new frame is enough
          }
        }
      }
      videoScore = frameMatchCount / Math.max(newFrameHashes.length, 1);
    }

    // ── Determine match type ──────────────────────────────────────────────────
    const audioMatch = audioScore >= (1 - BER_THRESHOLD);  // >70% bits match
    const videoMatch = frameMatchCount >= MIN_FRAME_MATCHES;

    if (audioMatch || videoMatch) {
      let matchType = 'unknown';
      if (audioMatch && videoMatch) matchType = 'audio+video';
      else if (audioMatch)          matchType = 'audio';
      else if (videoMatch)          matchType = 'video_frames';

      matches.push({
        contentId,
        creatorId:  meta.creatorId,
        creatorUsername: meta.creatorUsername,
        contentType: meta.contentType,
        audioScore:  Math.round(audioScore * 100) / 100,
        videoScore:  Math.round(videoScore * 100) / 100,
        frameMatchCount,
        matchType,
        uploadedAt:  meta.uploadedAt,
      });
    }
  }));

  return matches;
}

// ── Store a match report and notify original creator ──────────────────────────
async function recordMatches(newContentId, newMeta, matches) {
  if (!matches.length) return;
  const redis = getRedis();

  for (const match of matches) {
    const report = {
      newContentId,
      newCreatorId:       newMeta.creatorId,
      newCreatorUsername: newMeta.creatorUsername,
      matchedContentId:   match.contentId,
      matchedCreatorId:   match.creatorId,
      audioScore:         match.audioScore,
      videoScore:         match.videoScore,
      matchType:          match.matchType,
      detectedAt:         new Date().toISOString(),
    };

    const key = `cid:matches:${match.contentId}`; // attach to ORIGINAL content
    const existing = await redisGet(key);
    const list = existing ? JSON.parse(existing) : [];
    list.unshift(report);
    await redisSet(key, JSON.stringify(list.slice(0, 50)), { EX: FP_TTL });

    // Notify original creator — their content was found reused
    notifyUser(match.creatorId, 'content_id_match', {
      message: `Your content was found in a new upload by @${newMeta.creatorUsername}.`,
      originalContentId: match.contentId,
      matchType: match.matchType,
      audioScore: match.audioScore,
      videoScore: match.videoScore,
    });

    logger.warn(
      `ContentID MATCH: new=${newContentId} (@${newMeta.creatorUsername}) ` +
      `matches original=${match.contentId} (@${match.creatorUsername}) ` +
      `type=${match.matchType} audio=${match.audioScore} video=${match.videoScore}`
    );
  }
}

// ── Get match report for a content ID ────────────────────────────────────────
async function getMatchReport(contentId) {
  const raw = await redisGet(`cid:matches:${contentId}`);
  return raw ? JSON.parse(raw) : [];
}

// ── Full pipeline: extract → scan → record ────────────────────────────────────
// Called async after upload response is sent.
async function runContentIDPipeline(videoPath, contentId, creatorId, creatorUsername, contentType, frameHashes) {
  try {
    logger.info(`ContentID pipeline started: ${contentId}`);
    const { audioFP } = await extractFingerprints(videoPath);

    // Register this content
    await registerContent({ contentId, creatorId, creatorUsername, contentType, audioFP, frameHashes });

    // Scan for matches against existing content
    const matches = await scanForMatches(contentId, audioFP, frameHashes);

    if (matches.length) {
      const meta = { creatorId, creatorUsername, contentType };
      await recordMatches(contentId, meta, matches);
    } else {
      logger.info(`ContentID: no matches found for ${contentId}`);
    }
  } catch (err) {
    // Non-fatal — never block an upload over a fingerprint failure
    logger.error(`ContentID pipeline error for ${contentId}: ${err.message}`);
  }
}

module.exports = {
  runContentIDPipeline,
  registerContent,
  scanForMatches,
  recordMatches,
  getMatchReport,
  audioSimilarity,
  extractFingerprints,
  serializeFP,
  deserializeFP,
};
