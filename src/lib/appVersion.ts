import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

// Current App Version - update here when releasing a new version
export const APP_VERSION = '3.1';

export const DISMISSED_UPDATE_STORAGE_KEY = 'somnify_dismissed_update_version';

export interface VersionCheckResult {
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  shouldNotify: boolean;
}

/**
 * Compare two semantic version strings (e.g. "2.0", "2.1", "2.0.1", "V2.0").
 * Returns:
 *   -1 if v1 < v2
 *    0 if v1 === v2
 *    1 if v1 > v2
 */
export function compareVersions(v1: string, v2: string): number {
  const clean1 = (v1 || '').replace(/^v/i, '').trim();
  const clean2 = (v2 || '').replace(/^v/i, '').trim();

  const parts1 = clean1.split('.').map((p) => parseInt(p, 10) || 0);
  const parts2 = clean2.split('.').map((p) => parseInt(p, 10) || 0);

  const len = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < len; i++) {
    const num1 = parts1[i] ?? 0;
    const num2 = parts2[i] ?? 0;
    if (num1 < num2) return -1;
    if (num1 > num2) return 1;
  }
  return 0;
}

/**
 * Checks Firestore document /appConfig/version for the latest version.
 * If Firestore is unavailable or document does not exist, returns safe defaults.
 */
export async function checkForAppUpdate(): Promise<VersionCheckResult> {
  const defaultResult: VersionCheckResult = {
    currentVersion: APP_VERSION,
    latestVersion: APP_VERSION,
    hasUpdate: false,
    shouldNotify: false,
  };

  try {
    const docRef = doc(db, 'appConfig', 'version');
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return defaultResult;
    }

    const data = snap.data();
    const remoteVersion: string = data?.latestVersion || data?.version || '';
    if (!remoteVersion) {
      return defaultResult;
    }

    const hasUpdate = compareVersions(APP_VERSION, remoteVersion) < 0;

    // If the user already updated to at least the remote version, clear any older dismissed flag
    if (!hasUpdate) {
      localStorage.removeItem(DISMISSED_UPDATE_STORAGE_KEY);
      return {
        currentVersion: APP_VERSION,
        latestVersion: remoteVersion,
        hasUpdate: false,
        shouldNotify: false,
      };
    }

    // Check if the user previously clicked "nicht erneut anzeigen" for this specific version
    const dismissedVersion = localStorage.getItem(DISMISSED_UPDATE_STORAGE_KEY);
    const shouldNotify = dismissedVersion !== remoteVersion;

    return {
      currentVersion: APP_VERSION,
      latestVersion: remoteVersion,
      hasUpdate: true,
      shouldNotify,
    };
  } catch (err) {
    console.warn('App version check fallback:', err);
    return defaultResult;
  }
}

/**
 * Persists the user's decision not to show the update dialog again for this version.
 */
export function dismissUpdateForVersion(version: string): void {
  localStorage.setItem(DISMISSED_UPDATE_STORAGE_KEY, version);
}
