const ITERATIONS = 210000;
const HASH_ALGORITHM = 'SHA-256';
const KEY_LENGTH = 256;

const encoder = new TextEncoder();

const toBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

const timingSafeEqual = (a, b) => {
  if (!a || !b || a.length !== b.length) return false;
  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return mismatch === 0;
};

const getSalt = (uid) => encoder.encode(`sharespend-app-lock:${uid}`);

export async function hashPin(pin, uid) {
  if (!/^\d{4,6}$/.test(pin)) {
    throw new Error('PIN must contain 4 to 6 digits.');
  }

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: getSalt(uid),
      iterations: ITERATIONS,
      hash: HASH_ALGORITHM,
    },
    keyMaterial,
    KEY_LENGTH
  );

  return `pbkdf2-sha256:${ITERATIONS}:${toBase64(bits)}`;
}

export async function comparePin(pin, uid, savedHash) {
  if (!savedHash) return false;
  const currentHash = await hashPin(pin, uid);
  return timingSafeEqual(currentHash, savedHash);
}
