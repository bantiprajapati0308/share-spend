import {
  Timestamp,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { db } from '../../firebase';
import { comparePin, hashPin } from './hash.service';

const DEFAULT_SECURITY = {
  enabled: false,
  pinHash: '',
  pinLength: 4,
  autoLockAfter: 60,
  lockOnRefresh: true,
  lockOnTabHidden: true,
  failedAttempts: 0,
  lockUntil: null,
  requirePasswordForReset: true,
};

const securityRef = (uid) => doc(db, 'users', uid, 'settings', 'security');

const toMillis = (value) => {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (value instanceof Date) return value.getTime();
  return Number(value) || null;
};

const normalize = (data = {}) => ({
  ...DEFAULT_SECURITY,
  ...data,
  lockUntil: toMillis(data.lockUntil),
});

export async function getAppLock(uid) {
  if (!uid) throw new Error('User is required.');
  const snapshot = await getDoc(securityRef(uid));
  if (!snapshot.exists()) {
    const created = {
      ...DEFAULT_SECURITY,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(securityRef(uid), created, { merge: true });
    return normalize(created);
  }
  return normalize(snapshot.data());
}

export async function enableAppLock(uid, pin, options = {}) {
  const pinHash = await hashPin(pin, uid);
  const payload = {
    ...DEFAULT_SECURITY,
    ...options,
    enabled: true,
    pinHash,
    pinLength: pin.length,
    failedAttempts: 0,
    lockUntil: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(securityRef(uid), payload, { merge: true });
  return getAppLock(uid);
}

export async function disableAppLock(uid) {
  await updateDoc(securityRef(uid), {
    enabled: false,
    pinHash: '',
    failedAttempts: 0,
    lockUntil: null,
    updatedAt: serverTimestamp(),
  });
  return getAppLock(uid);
}

export async function updateFailedAttempts(uid, failedAttempts, lockUntil = null) {
  await updateDoc(securityRef(uid), {
    failedAttempts,
    lockUntil: lockUntil ? Timestamp.fromMillis(lockUntil) : null,
    updatedAt: serverTimestamp(),
  });
}

export async function resetFailedAttempts(uid) {
  await updateDoc(securityRef(uid), {
    failedAttempts: 0,
    lockUntil: null,
    updatedAt: serverTimestamp(),
  });
}

export async function verifyPin(uid, pin) {
  const settings = await getAppLock(uid);
  const currentTime = Date.now();

  if (settings.lockUntil && settings.lockUntil > currentTime) {
    return {
      success: false,
      locked: true,
      lockUntil: settings.lockUntil,
      message: 'Too many wrong attempts. Try again later.',
    };
  }

  const success = await comparePin(pin, uid, settings.pinHash);
  if (success) {
    await resetFailedAttempts(uid);
    return { success: true };
  }

  const attempts = (settings.failedAttempts || 0) + 1;
  const lockUntil = attempts >= 5 ? currentTime + 5 * 60 * 1000 : null;
  await updateFailedAttempts(uid, attempts, lockUntil);

  return {
    success: false,
    attempts,
    locked: Boolean(lockUntil),
    lockUntil,
    message: lockUntil ? 'App locked for 5 minutes.' : 'Incorrect PIN.',
  };
}

export async function changePin(uid, currentPin, nextPin) {
  const result = await verifyPin(uid, currentPin);
  if (!result.success) return result;

  const pinHash = await hashPin(nextPin, uid);
  await updateDoc(securityRef(uid), {
    pinHash,
    pinLength: nextPin.length,
    failedAttempts: 0,
    lockUntil: null,
    updatedAt: serverTimestamp(),
  });
  return { success: true, settings: await getAppLock(uid) };
}

export async function resetPin(user, password, nextPin) {
  if (!user?.email) throw new Error('Password reset requires an email account.');
  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);

  const pinHash = await hashPin(nextPin, user.uid);
  await setDoc(
    securityRef(user.uid),
    {
      enabled: true,
      pinHash,
      pinLength: nextPin.length,
      failedAttempts: 0,
      lockUntil: null,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
  return getAppLock(user.uid);
}

export async function updateAutoLock(uid, autoLockAfter) {
  await updateDoc(securityRef(uid), {
    autoLockAfter,
    updatedAt: serverTimestamp(),
  });
  return getAppLock(uid);
}

export async function updateAppLockPreferences(uid, updates) {
  await updateDoc(securityRef(uid), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
  return getAppLock(uid);
}

export const securityService = {
  getAppLock,
  enableAppLock,
  disableAppLock,
  verifyPin,
  changePin,
  resetPin,
  updateAutoLock,
  updateFailedAttempts,
  resetFailedAttempts,
  updateAppLockPreferences,
};
