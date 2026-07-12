/**
 * ============================================================
 *  VENTURE — Creator Platform
 *  © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * ============================================================
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';

export const OWNERSHIP = {
  owner:     'DivineDemonGaming Inc',
  product:   'VENTURE Creator Platform',
  copyright: '© 2024 DivineDemonGaming Inc. All Rights Reserved.',
  contact:   'legal@divinedemongaming.com',
  website:   'https://venture.divinedemongaming.com',
};

/** Embeds a runtime ownership record into app metadata. */
export const getRuntimeFingerprint = () => ({
  ...OWNERSHIP,
  platform: Platform.OS,
  version: Constants.expoConfig?.version || '1.0.0',
  buildDate: '2024',
  statement: 'Property of DivineDemonGaming Inc. All rights reserved.'
});
