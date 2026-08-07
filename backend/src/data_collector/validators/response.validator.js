import { logger } from '../logger/index.js';

export function validateResponse(data, ticker) {
  if (!data || typeof data !== 'object') {
    logger.error(`Validation Failed: Invalid JSON format for ${ticker}`);
    return false;
  }

  if (Array.isArray(data) && data.length === 0) {
    logger.error(`Validation Failed: Empty array returned for ${ticker}`);
    return false;
  }

  // Check essential fields
  if (!data.summaryDetail || !data.financialData) {
    logger.error(`Validation Failed: Missing critical fields (summaryDetail/financialData) for ${ticker}`);
    return false;
  }

  if (data.summaryDetail.currentPrice?.raw == null) {
    logger.error(`Validation Failed: Null price value for ${ticker}`);
    return false;
  }

  logger.info(`Validation Success for ${ticker}`);
  return true;
}
