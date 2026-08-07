import { log } from './logger.js';
import { processAllBanks } from '../index.js';
import dotenv from 'dotenv';

dotenv.config();

export function startScheduler() {
  const intervalHours = parseInt(process.env.FETCH_INTERVAL_HOURS || '24', 10);
  const intervalMs = intervalHours * 60 * 60 * 1000;
  
  log('INFO', 'SYSTEM', `Scheduler started. Next run in ${intervalHours} hours.`);
  
  setInterval(async () => {
    log('INFO', 'SYSTEM', `Starting scheduled fetch...`);
    await processAllBanks();
  }, intervalMs);
}
