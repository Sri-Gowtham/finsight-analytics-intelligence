export function normalizeData(rawData) {
  // Map the raw Yahoo JSON into our expected database schema
  return {
    ticker: rawData.ticker,
    company_profile: {
      name: rawData.quoteType?.longName,
      sector: rawData.summaryProfile?.sector,
      industry: rawData.summaryProfile?.industry,
    },
    market_data: {
      currentPrice: rawData.summaryDetail?.currentPrice?.raw,
      marketCap: rawData.summaryDetail?.marketCap?.raw,
      peRatio: rawData.defaultKeyStatistics?.forwardPE?.raw,
      pbRatio: rawData.defaultKeyStatistics?.priceToBook?.raw,
    },
    income_statement: rawData.incomeStatementHistory || {},
    balance_sheet: rawData.balanceSheetHistory || {},
    cash_flow: rawData.cashflowStatementHistory || {},
    quarterly_results: rawData.financialData || {},
    annual_results: rawData.defaultKeyStatistics || {}
  };
}
