const KEYS = {
  appUnlocked: 'appUnlocked',
  unlockTime: 'unlockTime',
  lastBackgroundTime: 'lastBackgroundTime',
  lastActivityTime: 'lastActivityTime',
};

const now = () => Date.now();

export const sessionService = {
  keys: KEYS,

  isUnlocked() {
    return sessionStorage.getItem(KEYS.appUnlocked) === 'true';
  },

  unlock() {
    const timestamp = String(now());
    sessionStorage.setItem(KEYS.appUnlocked, 'true');
    sessionStorage.setItem(KEYS.unlockTime, timestamp);
    sessionStorage.setItem(KEYS.lastActivityTime, timestamp);
  },

  lock() {
    sessionStorage.removeItem(KEYS.appUnlocked);
    sessionStorage.removeItem(KEYS.unlockTime);
  },

  clear() {
    Object.values(KEYS).forEach((key) => sessionStorage.removeItem(key));
  },

  setLastBackgroundTime(timestamp = now()) {
    sessionStorage.setItem(KEYS.lastBackgroundTime, String(timestamp));
  },

  getLastBackgroundTime() {
    return Number(sessionStorage.getItem(KEYS.lastBackgroundTime) || 0);
  },

  setLastActivityTime(timestamp = now()) {
    sessionStorage.setItem(KEYS.lastActivityTime, String(timestamp));
  },

  getLastActivityTime() {
    return Number(sessionStorage.getItem(KEYS.lastActivityTime) || 0);
  },
};
