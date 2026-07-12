/**
 * Web shim for expo-secure-store.
 * On web, SecureStore isn't available — this wraps localStorage
 * with the same API surface. Not cryptographically secure on web
 * (no TEE/Keychain), but functionally equivalent for dev/testing.
 *
 * Import pattern in your files:
 *   import * as SecureStore from '../utils/secureStoreWeb';  // web
 *   import * as SecureStore from 'expo-secure-store';         // native
 *
 * Or use the Platform.select shim below for auto-switching.
 */
import { Platform } from 'react-native';
import * as ExpoSecureStore from 'expo-secure-store';

const webStore = {
  async getItemAsync(key) {
    try { return localStorage.getItem(`venture_ss_${key}`); } catch { return null; }
  },
  async setItemAsync(key, value) {
    try { localStorage.setItem(`venture_ss_${key}`, value); } catch {}
  },
  async deleteItemAsync(key) {
    try { localStorage.removeItem(`venture_ss_${key}`); } catch {}
  },
};

// Auto-select correct implementation based on platform
const SecureStore = Platform.OS === 'web' ? webStore : ExpoSecureStore;
export const getItemAsync    = SecureStore.getItemAsync.bind(SecureStore);
export const setItemAsync    = SecureStore.setItemAsync.bind(SecureStore);
export const deleteItemAsync = SecureStore.deleteItemAsync.bind(SecureStore);
export default SecureStore;
