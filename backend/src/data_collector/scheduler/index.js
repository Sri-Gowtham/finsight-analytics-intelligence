import { config } from '../config/index.js';
import { logger } from '../logger/index.js';
import { runDataCollectionCycle } from '../main.js';

let intervalId = null;

export function startScheduler() {
  if (intervalId) {
    logger.warn('Scheduler is already running.');
    return;
  }

  logger.info(`Initializing Financial Data Scheduler. Interval: ${config.fetchIntervalMs}ms`);
  
  // Run immediately on boot
  setTimeout(() => {
    runDataCollectionCycle().catch((err) =>
      console.error('Initial data collection failed:', err)
    );
  }, 15000);

  // Schedule periodic runs
  intervalId = setInterval(() => {
    runDataCollectionCycle().catch(err => {
      logger.error('Failed during scheduled data collection cycle', err);
    });
  }, config.fetchIntervalMs);
}

export function stopScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info('Scheduler stopped.');
  }
}
