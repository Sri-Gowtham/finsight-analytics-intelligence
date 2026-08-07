import dotenv from 'dotenv';
dotenv.config();

export const config = {
  dbUrl: process.env.DATABASE_URL,
  port: process.env.PORT || 3001,
  yahooApiKey: process.env.YAHOO_API_KEY || process.env.RAPIDAPI_KEY || 'MOCK_KEY', // Fallback for mocking/dev
  banks: [
    'HDFCBANK.NS',
    'ICICIBANK.NS',
    'SBIN.NS',
    'AXISBANK.NS',
    'KOTAKBANK.NS'
  ],
  fetchIntervalMs: 1000 * 60 * 60 * 24 // 24 hours
};
