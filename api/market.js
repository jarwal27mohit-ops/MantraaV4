export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=60");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const symbols = ["^NSEI", "CL=F", "USDINR=X", "^INDIAVIX", "GC=F"].join(",");
    const url = "https://query1.finance.yahoo.com/v7/finance/quote?symbols=" + encodeURIComponent(symbols);
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    });
    if (!response.ok) throw new Error("Yahoo Finance returned " + response.status);
    const data = await response.json();
    const quotes = data.quoteResponse?.result || [];
    const result = {
      nifty: null, niftyChange: null, crude: null, crudeChange: null,
      usdinr: null, usdinrChange: null, vix: null, vixChange: null,
      gold: null, goldChange: null, timestamp: new Date().toISOString(),
    };
    for (const q of quotes) {
      switch (q.symbol) {
        case "^NSEI": result.nifty = q.regularMarketPrice; result.niftyChange = q.regularMarketChangePercent; break;
        case "CL=F": result.crude = q.regularMarketPrice; result.crudeChange = q.regularMarketChangePercent; break;
        case "USDINR=X": result.usdinr = q.regularMarketPrice; result.usdinrChange = q.regularMarketChangePercent; break;
        case "^INDIAVIX": result.vix = q.regularMarketPrice; result.vixChange = q.regularMarketChangePercent; break;
        case "GC=F": result.gold = q.regularMarketPrice; result.goldChange = q.regularMarketChangePercent; break;
      }
    }
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message, timestamp: new Date().toISOString() });
  }
}
