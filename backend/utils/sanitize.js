/**
 * Basic Input Sanitizer to strip HTML script tags and trim whitespace
 */
const sanitizeText = (input) => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // strip scripts
    .replace(/<[^>]+>/g, '') // strip HTML tags
    .trim();
};

module.exports = { sanitizeText };
