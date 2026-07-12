/**
 * ============================================================
 *  VENTURE — Creator Platform
 *  © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * ============================================================
 */

const router = require('express').Router();
const { OWNERSHIP_HASH, SIGNATURE, OWNER, PRODUCT, verifyOwnership } = require('../middleware/watermark');

/**
 * Public ownership certificate endpoint.
 * Accessible at GET /ownership — returns a verifiable
 * proof of ownership for DivineDemonGaming Inc.
 */
router.get('/', (req, res) => {
  res.json({
    platform:     'VENTURE Creator Platform',
    owner:        'DivineDemonGaming Inc',
    copyright:    '© 2024 DivineDemonGaming Inc. All Rights Reserved.',
    contact:      'legal@divinedemongaming.com',
    signature:    SIGNATURE,
    ownershipHash: OWNERSHIP_HASH,
    statement:    'This platform and all its source code, design, and intellectual property are the exclusive property of DivineDemonGaming Inc. Unauthorized use, copying, or distribution is prohibited by law.',
    timestamp:    new Date().toISOString()
  });
});

/**
 * Verification endpoint — prove a hash belongs to this platform.
 */
router.get('/verify/:hash', (req, res) => {
  const valid = verifyOwnership(req.params.hash);
  res.json({
    valid,
    owner: valid ? OWNER : null,
    product: valid ? PRODUCT : null,
    message: valid
      ? 'Verified: This is an authentic DivineDemonGaming Inc. VENTURE installation.'
      : 'Invalid: This hash does not match the DivineDemonGaming Inc. ownership signature.'
  });
});

/**
 * Admin endpoint — verify a specific video file's embedded watermark.
 * Usage: POST /ownership/verify-video  { videoUrl }
 * Returns the extracted VENTURE metadata and whether the signature is valid.
 */
const ffmpeg = require('fluent-ffmpeg');
const ffmpegBin = require('ffmpeg-static');
const { verifyWatermark } = require('../services/videoWatermark');
const { requireAdmin } = require('../middleware/auth');
const { authenticate } = require('../middleware/auth');
ffmpeg.setFfmpegPath(ffmpegBin);

router.post('/verify-video', authenticate, requireAdmin, (req, res) => {
  const { videoUrl } = req.body;
  if (!videoUrl) return res.status(400).json({ error: 'videoUrl required' });

  // Resolve local path from URL
  const localPath = videoUrl.startsWith('/uploads/')
    ? require('path').join(__dirname, '../../', videoUrl)
    : null;

  if (!localPath) return res.status(400).json({ error: 'Only local VENTURE uploads can be verified here.' });

  ffmpeg.ffprobe(localPath, (err, metadata) => {
    if (err) return res.status(400).json({ error: 'Could not read video file.', detail: err.message });
    const result = verifyWatermark(metadata);
    if (!result) {
      return res.json({ verified: false, message: 'No VENTURE watermark found in this file.' });
    }
    res.json({ verified: result.valid, ...result });
  });
});

module.exports = router;
