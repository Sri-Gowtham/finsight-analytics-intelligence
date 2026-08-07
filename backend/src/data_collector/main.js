import { config } from './config/index.js';
import { logger } from './logger/index.js';
import { fetchBankData } from './clients/yahoo.client.js';
import { validateResponse } from './validators/response.validator.js';
import { normalizeData } from './normalizers/data.normalizer.js';
import { upsertBankFinancials } from './repository/financials.repo.js';

export async function runDataCollectionCycle() {
  logger.info('--- Data Collection Cycle Started ---', { totalBanks: config.banks.length });
  
  let successCount = 0;
  let failureCount = 0;

  for (const ticker of config.banks) {
    logger.info(`Starting processing for bank: ${ticker}`);
    try {
      // 1. Fetch
      const rawData = await fetchBankData(ticker);
      
      // 2. Validate
      const isValid = validateResponse(rawData, ticker);
      if (!isValid) {
        failureCount++;
        continue; // Skip to next bank, don't terminate the loop
      }

      // 3. Normalize
      const normalizedData = normalizeData(rawData);

      // 4. Store
      await upsertBankFinancials(normalizedData);
      
      successCount++;
    } catch (error) {
      logger.error(`Error processing bank ${ticker}`, error);
      failureCount++;
      // Continue to next bank on error
    }
  }

  logger.info('--- Data Collection Cycle Completed ---', { 
    successCount, 
    failureCount, 
    totalProcessed: successCount + failureCount 
  });
}
