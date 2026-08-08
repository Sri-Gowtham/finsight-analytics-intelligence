import { runDataCollectionCycle } from './src/data_collector/main.js';
import dotenv from 'dotenv';
dotenv.config();

runDataCollectionCycle().then(() => process.exit(0)).catch(console.error);
