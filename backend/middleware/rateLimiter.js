const rateLimitMap = new Map();

/**
 * Message sending rate limiter middleware (30 messages per minute max)
 */
const messageRateLimiter = (req, res, next) => {
  const userId = req.user?.id || req.ip;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxLimit = 30; // 30 messages per min

  const userRecord = rateLimitMap.get(userId) || { count: 0, resetTime: now + windowMs };

  if (now > userRecord.resetTime) {
    userRecord.count = 1;
    userRecord.resetTime = now + windowMs;
  } else {
    userRecord.count += 1;
  }

  rateLimitMap.set(userId, userRecord);

  if (userRecord.count > maxLimit) {
    return res.status(429).json({
      success: false,
      message: 'Too many messages sent. Please wait a moment before sending again.',
    });
  }

  next();
};

module.exports = { messageRateLimiter };
