export function log(level, ticker, message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] [${ticker}] ${message}`);
}
