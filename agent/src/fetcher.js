import { log } from './logger.js';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.INDIAN_API_KEY;
const BASE_URL = 'https://stock.indianapi.in';
const HEADERS = {
  "x-api-key": API_KEY,
  "accept": "application/json"
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithDelay(url, ticker, endpointName) {
  log('INFO', ticker, `Fetching ${endpointName} for ${ticker}...`);
  try {
    const response = await fetch(url, { headers: HEADERS });
    if (!response.ok) {
      log('ERROR', ticker, `HTTP error! status: ${response.status} for ${endpointName}`);
      await delay(500);
      return null;
    }
    const data = await response.json();
    log('SUCCESS', ticker, `HTTP 200 for ${endpointName}`);
    await delay(500);
    return data;
  } catch (error) {
    log('ERROR', ticker, `Fetch failed for ${endpointName}: ${error.message}`);
    await delay(500);
    return null;
  }
}

export async function fetchCompanyProfile(ticker) {
  return fetchWithDelay(`${BASE_URL}/stock?name=${ticker}`, ticker, '/stock');
}

export async function fetchIncomeStatement(ticker) {
  return fetchWithDelay(`${BASE_URL}/statement?stock_name=${ticker}&stats=ttm_results`, ticker, '/statement?stats=ttm_results');
}

export async function fetchAnnualResults(ticker) {
  return fetchWithDelay(`${BASE_URL}/statement?stock_name=${ticker}&stats=yoy_results`, ticker, '/statement?stats=yoy_results');
}

export async function fetchCashFlow(ticker) {
  return fetchWithDelay(`${BASE_URL}/statement?stock_name=${ticker}&stats=cashflow`, ticker, '/statement?stats=cashflow');
}

export async function fetchQuarterlyStats(ticker) {
  return fetchWithDelay(`${BASE_URL}/historical_stats?name=${ticker}`, ticker, '/historical_stats');
}
