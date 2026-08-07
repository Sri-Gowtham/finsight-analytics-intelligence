export function buildRecord(ticker, companyId, responses) {
  return {
    company_id: companyId,
    ticker: ticker,
    company_profile: responses.profile ?? null,
    market_data: {
      current_price: responses.profile?.currentPrice ?? null,
      market_cap: responses.profile?.marketCap ?? null,
      pe_ratio: responses.profile?.pe ?? null,
      week_52_high: responses.profile?.week52High ?? null,
      week_52_low: responses.profile?.week52Low ?? null,
    },
    income_statement: responses.ttm_results ?? null,
    annual_results: responses.yoy_results ?? null,
    cash_flow: responses.cashflow ?? null,
    quarterly_results: responses.historical_stats ?? null,
    balance_sheet: null,
    fetched_at: new Date().toISOString(),
    fetch_date: new Date().toISOString().split('T')[0],
    source: "indianapi.in"
  };
}
