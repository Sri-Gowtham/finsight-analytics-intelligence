import { log } from './logger.js';

export function validateResponse(data, ticker, dataType) {
  if (data === null || data === undefined) {
    log('WARN', ticker, `SKIP: null response for ${dataType}`);
    return false;
  }
  
  if (typeof data === 'object' && Object.keys(data).length === 0) {
    log('WARN', ticker, `SKIP: empty response for ${dataType}`);
    return false;
  }
  
  // Note: We could check for missing expected fields here.
  // For now, we consider it valid if it's a non-empty object.
  // We log if something seems missing, but return true.
  
  return true;
}
