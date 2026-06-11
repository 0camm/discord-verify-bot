/**
 * In-memory key store for verification keys.
 * Keys are stored as: userId -> { key, expiresAt, guildId }
 * Rate limiting: userId -> { count, resetAt }
 */

const logger = require('./logger');

const KEY_EXPIRY_MS    = (parseInt(process.env.KEY_EXPIRY_MINUTES) || 10) * 60 * 1000;
const RATE_LIMIT_COUNT = parseInt(process.env.RATE_LIMIT_COUNT)   || 3;
const RATE_LIMIT_MS    = (parseInt(process.env.RATE_LIMIT_MINUTES) || 30) * 60 * 1000;

// Map: userId -> { key, expiresAt, guildId }
const pendingKeys = new Map();

// Map: userId -> { count, resetAt }
const rateLimits  = new Map();

/**
 * Generate a cryptographically random key.
 */
function generateKey() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // omit similar-looking chars
  let key = '';
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) key += '-';
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key; // e.g. ABCD-EFGH-IJKL-MNOP
}

/**
 * Check if a user is rate-limited.
 * Returns { limited: bool, remainingMs: number }
 */
function checkRateLimit(userId) {
  const now = Date.now();
  const entry = rateLimits.get(userId);

  if (!entry || now > entry.resetAt) {
    // Fresh window
    rateLimits.set(userId, { count: 0, resetAt: now + RATE_LIMIT_MS });
    return { limited: false, remainingMs: 0 };
  }

  if (entry.count >= RATE_LIMIT_COUNT) {
    return { limited: true, remainingMs: entry.resetAt - now };
  }

  return { limited: false, remainingMs: 0 };
}

/**
 * Store a verification key for a user.
 */
function storeKey(userId, guildId) {
  // Bump rate limit counter
  const now = Date.now();
  const rl = rateLimits.get(userId) || { count: 0, resetAt: now + RATE_LIMIT_MS };
  rl.count += 1;
  rateLimits.set(userId, rl);

  const key = generateKey();
  const expiresAt = now + KEY_EXPIRY_MS;

  pendingKeys.set(userId, { key, expiresAt, guildId });
  logger.info(`Key stored for user ${userId} in guild ${guildId}. Expires at ${new Date(expiresAt).toISOString()}`);

  return key;
}

/**
 * Validate a key for a given userId.
 * Returns { valid: bool, guildId?: string, reason?: string }
 */
function validateKey(userId, submittedKey) {
  const entry = pendingKeys.get(userId);

  if (!entry) {
    return { valid: false, reason: 'No pending key found. Please generate a new key.' };
  }

  if (Date.now() > entry.expiresAt) {
    pendingKeys.delete(userId);
    return { valid: false, reason: 'Your key has expired. Please generate a new one.' };
  }

  if (entry.key !== submittedKey.trim().toUpperCase()) {
    return { valid: false, reason: 'Invalid key. Please double-check and try again.' };
  }

  // Valid — consume the key (one-time use)
  const guildId = entry.guildId;
  pendingKeys.delete(userId);
  return { valid: true, guildId };
}

/**
 * Periodically clean up expired keys to avoid memory leaks.
 */
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [userId, entry] of pendingKeys.entries()) {
    if (now > entry.expiresAt) {
      pendingKeys.delete(userId);
      cleaned++;
    }
  }
  for (const [userId, entry] of rateLimits.entries()) {
    if (now > entry.resetAt) {
      rateLimits.delete(userId);
      cleaned++;
    }
  }
  if (cleaned > 0) logger.info(`Cleaned up ${cleaned} expired entries from key store.`);
}, 5 * 60 * 1000); // every 5 minutes

module.exports = { generateKey, checkRateLimit, storeKey, validateKey, KEY_EXPIRY_MS, RATE_LIMIT_COUNT, RATE_LIMIT_MS };
