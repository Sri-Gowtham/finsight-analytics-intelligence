import { pool } from '../config/db.js';
import { callGroqWithRetry } from '../services/ai/groq.service.js';
import { logger } from '../data_collector/logger/index.js';

/**
 * Safely parse a value (numeric or string) into a clean, standard format.
 * Strips commas and percentage signs from numeric strings.
 * @param {*} val - The raw value.
 * @returns {*} Cleaned value or null.
 */
function cleanValue(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return val;
  if (typeof val === 'object' && val.raw !== undefined) return val.raw;
  if (typeof val === 'string') {
    const cleaned = val.replace(/,/g, '').replace(/%/g, '').trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? val : num;
  }
  return val;
}

/**
 * Extract a value by testing multiple property paths.
 * @param {Object} obj - The target object.
 * @param {Array<string>} paths - Dot-separated paths to test.
 * @returns {*} The cleaned value or null if not found.
 */
function extractValue(obj, paths) {
  if (!obj) return null;
  for (const path of paths) {
    let current = obj;
    const keys = path.split('.');
    for (const key of keys) {
      if (current && typeof current === 'object') {
        current = current[key];
      } else {
        current = undefined;
        break;
      }
    }
    if (current !== undefined && current !== null) {
      return cleanValue(current);
    }
  }
  return null;
}

/**
 * Preprocess database context to select only relevant metrics instead of dumping raw JSON.
 * @param {Object} company - The company database row.
 * @param {Object} latestRaw - The latest raw financial database row.
 * @param {Array<Object>} historicalMetrics - The array of historical financial metrics.
 * @returns {string} The structured, lean context for the LLM.
 */
function preprocessDatabaseContext(company, latestRaw, historicalMetrics) {
  const normalized = {
    bankName: company.name,
    ticker: company.ticker,
    sector: company.sector,
    exchange: company.exchange,
    latestRevenue: null,
    netProfit: null,
    operatingProfit: null,
    profitBeforeTax: null,
    eps: null,
    roe: null,
    roa: null,
    profitMargin: null,
    operatingMargin: null,
    revenueGrowth: null,
    earningsGrowth: null,
    cash: null,
    debt: null,
    cashFlowSummary: {}
  };

  if (latestRaw) {
    normalized.latestRevenue = extractValue(latestRaw, [
      'income_statement.sales',
      'income_statement.totalRevenue',
      'income_statement.incomeStatementHistory.0.totalRevenue'
    ]);
    normalized.netProfit = extractValue(latestRaw, [
      'income_statement.net_profit',
      'income_statement.netIncome',
      'cash_flow.netIncome',
      'income_statement.incomeStatementHistory.0.netIncome'
    ]);
    normalized.operatingProfit = extractValue(latestRaw, [
      'income_statement.operating_profit',
      'income_statement.operatingIncome',
      'income_statement.incomeStatementHistory.0.operatingIncome'
    ]);
    normalized.profitBeforeTax = extractValue(latestRaw, [
      'income_statement.profit_before_tax',
      'income_statement.incomeBeforeTax',
      'income_statement.incomeStatementHistory.0.incomeBeforeTax'
    ]);
    normalized.eps = extractValue(latestRaw, [
      'income_statement.eps',
      'annual_results.eps',
      'annual_results.trailingEps',
      'annual_results.forwardEps'
    ]);
    normalized.roe = extractValue(latestRaw, [
      'quarterly_results.returnOnEquity',
      'annual_results.returnOnEquity'
    ]);
    normalized.roa = extractValue(latestRaw, [
      'quarterly_results.returnOnAssets',
      'annual_results.returnOnAssets'
    ]);
    normalized.profitMargin = extractValue(latestRaw, [
      'quarterly_results.profitMargins'
    ]);
    normalized.operatingMargin = extractValue(latestRaw, [
      'quarterly_results.operatingMargins',
      'income_statement.opm'
    ]);
    normalized.revenueGrowth = extractValue(latestRaw, [
      'quarterly_results.revenueGrowth'
    ]);
    normalized.earningsGrowth = extractValue(latestRaw, [
      'quarterly_results.earningsGrowth'
    ]);
    normalized.cash = extractValue(latestRaw, [
      'balance_sheet.totalCash',
      'balance_sheet.cash',
      'quarterly_results.totalCash',
      'balance_sheet.balanceSheetStatements.0.totalCash'
    ]);
    normalized.debt = extractValue(latestRaw, [
      'balance_sheet.totalDebt',
      'balance_sheet.debt',
      'quarterly_results.totalDebt',
      'balance_sheet.balanceSheetStatements.0.totalDebt'
    ]);

    // Cash flow values
    const opCash = extractValue(latestRaw, [
      'cash_flow.Cash from operating activity',
      'cash_flow.operatingCashflow',
      'cash_flow.cashflowStatements.0.totalCashFromOperatingActivities'
    ]);
    const invCash = extractValue(latestRaw, [
      'cash_flow.Cash from investing activity',
      'cash_flow.cashflowStatements.0.totalCashflowsFromInvestingActivities'
    ]);
    const finCash = extractValue(latestRaw, [
      'cash_flow.Cash from finance activity',
      'cash_flow.cashflowStatements.0.totalCashFromFinancingActivities'
    ]);

    if (opCash !== null) normalized.cashFlowSummary.operating = opCash;
    if (invCash !== null) normalized.cashFlowSummary.investing = invCash;
    if (finCash !== null) normalized.cashFlowSummary.financing = finCash;
  }

  let textContext = `=== BANK IDENTIFIERS ===
Bank Name: ${normalized.bankName}
Ticker: ${normalized.ticker}
Sector: ${normalized.sector}
Exchange: ${normalized.exchange}

=== LATEST KEY FINANCIAL VALUES ===
Latest Revenue / Sales: ${normalized.latestRevenue !== null ? normalized.latestRevenue : 'Unavailable'}
Net Profit: ${normalized.netProfit !== null ? normalized.netProfit : 'Unavailable'}
Operating Profit: ${normalized.operatingProfit !== null ? normalized.operatingProfit : 'Unavailable'}
Profit Before Tax: ${normalized.profitBeforeTax !== null ? normalized.profitBeforeTax : 'Unavailable'}
EPS: ${normalized.eps !== null ? normalized.eps : 'Unavailable'}
Return on Equity (ROE): ${normalized.roe !== null ? normalized.roe : 'Unavailable'}
Return on Assets (ROA): ${normalized.roa !== null ? normalized.roa : 'Unavailable'}
Profit Margin: ${normalized.profitMargin !== null ? normalized.profitMargin : 'Unavailable'}
Operating Margin: ${normalized.operatingMargin !== null ? normalized.operatingMargin : 'Unavailable'}
Revenue Growth: ${normalized.revenueGrowth !== null ? normalized.revenueGrowth : 'Unavailable'}
Earnings Growth: ${normalized.earningsGrowth !== null ? normalized.earningsGrowth : 'Unavailable'}
Cash: ${normalized.cash !== null ? normalized.cash : 'Unavailable'}
Debt: ${normalized.debt !== null ? normalized.debt : 'Unavailable'}

=== CASH FLOW SUMMARY ===
Operating Cash Flow: ${normalized.cashFlowSummary.operating !== undefined ? normalized.cashFlowSummary.operating : 'Unavailable'}
Investing Cash Flow: ${normalized.cashFlowSummary.investing !== undefined ? normalized.cashFlowSummary.investing : 'Unavailable'}
Financing Cash Flow: ${normalized.cashFlowSummary.financing !== undefined ? normalized.cashFlowSummary.financing : 'Unavailable'}

=== HISTORICAL FINANCIAL METRICS ===
(Note: The following metrics are sorted chronologically from OLDEST to NEWEST. Use them to trace historical trends, explain changes across different periods, and identify increasing/decreasing financial patterns for reasoning.)\n`;

  if (historicalMetrics && historicalMetrics.length > 0) {
    historicalMetrics.forEach((m, index) => {
      const dateStr = m.timestamp ? new Date(m.timestamp).toISOString().split('T')[0] : 'N/A';
      textContext += `[${index + 1}] Date: ${dateStr} | Metric Name: ${m.metric_name} | Value: ${m.value}\n`;
    });
  } else {
    textContext += `No historical metrics available in the financial_metrics table.\n`;
  }

  return textContext;
}

/**
 * POST /api/analysis/what-if
 * Body: { bank: string, question: string }
 */
export async function whatIfAnalysis(req, res, next) {
  try {
    const { bank, question } = req.body;

    // 1. Validation
    if (!bank || typeof bank !== 'string' || !bank.trim()) {
      return res.status(400).json({ error: "Missing or invalid 'bank' ticker in request body" });
    }
    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ error: "Missing or invalid 'question' in request body" });
    }

    const cleanBank = bank.trim();
    const cleanQuestion = question.trim();

    logger.info(`Starting What-if Analysis for bank: "${cleanBank}" with question: "${cleanQuestion}"`);

    // 2. Fetch company from DB (normalizing and stripping .NS suffix)
    const companyRes = await pool.query(
      `SELECT * FROM companies 
       WHERE REPLACE(UPPER(ticker), '.NS', '') = REPLACE(UPPER($1), '.NS', '')`,
      [cleanBank]
    );

    if (companyRes.rows.length === 0) {
      logger.warn(`Bank not found for ticker: "${cleanBank}"`);
      return res.status(404).json({ error: `Bank not found in database: ${cleanBank}` });
    }

    const company = companyRes.rows[0];
    const companyId = company.company_id;

    // 3. Fetch latest raw financials
    const latestRawRes = await pool.query(
      `SELECT * FROM bank_financials_raw 
       WHERE company_id = $1 
       ORDER BY fetch_date DESC 
       LIMIT 1`,
      [companyId]
    );
    const latestRaw = latestRawRes.rows[0] || null;

    // 4. Fetch historical metrics
    const historicalMetricsRes = await pool.query(
      `SELECT metric_name, value, timestamp 
       FROM financial_metrics 
       WHERE company_id = $1 
       ORDER BY timestamp ASC`,
      [companyId]
    );
    const historicalMetrics = historicalMetricsRes.rows;

    // 5. Preprocess database context (extract values instead of dumping raw JSON)
    const dbContext = preprocessDatabaseContext(company, latestRaw, historicalMetrics);

    // 6. Format system & user prompts
    const systemPrompt = `You are FinSight AI.
You analyze Indian banking financial statements and perform What-if scenarios.

Strict Rules of Engagement:
1. STRICT DATABASE-ONLY REASONING: You must ONLY use values supplied in the database context. Do not use prior model knowledge or external banking facts.
2. NEVER FABRICATE OR ESTIMATE: Never fabricate, guess, or estimate missing metrics. Never infer unavailable financial information.
3. ABSOLUTE FALLBACK FOR MISSING DATA: If the requested information is unavailable or if you lack the necessary metrics to answer, you must respond EXACTLY with the following string in the "answer" field:
"The requested information is unavailable in the current financial dataset."
4. NO INVESTMENT ADVICE: Never provide investment recommendations or stock advice (do not mention buy, sell, hold, or call out stock outlooks).
5. NO HALLUCINATION: Under no circumstances should you invent numbers or refer to facts outside the provided database context.
6. EXPLAIN CALCULATIONS: Explain all your calculations step-by-step using standard finance terminology.
7. EXPLAIN ASSUMPTIONS: List all scenario-based assumptions in the "assumptions" array.
8. USE OF HISTORICAL TRENDS: The historical metrics are listed chronologically from oldest to newest. Analyze increasing or decreasing trends across periods to justify your reasoning and show period-over-period changes where relevant. Do not summarize historical trends in a single sentence.
9. KEEP RESPONSES PROFESSIONAL: Maintain a formal and objective tone. Use standard banking financial terms.

Your output must be a JSON object matching this schema structure:
{
  "answer": "A string containing the detailed analysis or the fallback string if data is unavailable.",
  "assumptions": ["List of assumptions used in reasoning"],
  "metrics_used": ["List of database metric names referenced in the calculation"]
}`;

    const userPrompt = `### Database Context:
${dbContext}

### User What-If Question:
${cleanQuestion}

Please output the final result in JSON mode matching the schema structure.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    // 7. Send to Groq and measure execution time
    const startTime = Date.now();
    const groqResponse = await callGroqWithRetry(messages, {
      model: 'llama-3.3-70b-versatile',
      responseFormat: { type: 'json_object' }
    });
    const duration = Date.now() - startTime;

    const responseText = groqResponse.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('Received empty response content from Groq API');
    }

    // Log token usage (only on server side, not exposed to frontend)
    const modelUsed = groqResponse.model || 'llama-3.3-70b-versatile';
    const promptTokens = groqResponse.usage?.prompt_tokens || 0;
    const completionTokens = groqResponse.usage?.completion_tokens || 0;
    const totalTokens = groqResponse.usage?.total_tokens || 0;

    logger.info('Groq API call succeeded.', {
      model: modelUsed,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
      execution_time_ms: duration
    });

    // 8. Validate and return response
    let resultJson;
    try {
      resultJson = JSON.parse(responseText);
    } catch (parseErr) {
      logger.error('Failed to parse Groq response as JSON', parseErr, { responseText });
      return res.status(500).json({ error: 'Failed to generate a valid JSON response from AI service' });
    }

    if (
      typeof resultJson.answer !== 'string' ||
      !Array.isArray(resultJson.assumptions) ||
      !Array.isArray(resultJson.metrics_used)
    ) {
      logger.error('AI response did not conform to the required schema keys', null, { resultJson });
      return res.status(500).json({ error: 'AI service response template format was invalid' });
    }

    logger.info(`Completed What-if Analysis for bank: "${cleanBank}" successfully.`);
    return res.status(200).json(resultJson);
  } catch (error) {
    logger.error('Error during What-if Analysis execution', error);
    next(error);
  }
}
