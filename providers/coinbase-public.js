/* Coinbase Exchange public candles provider — read-only.
 * Uses only the public market-data GET endpoint. No auth, wallet or trading capability.
 */
(function (global) {
  "use strict";
  const M=global.WADATSUMI_MARKET_DATA;
  if (!M) throw new Error("market-data.js must be loaded first");

  const GRANULARITY=Object.freeze({"1h":3600,"1d":86400});
  const ENDPOINT="https://api.exchange.coinbase.com/products";
  const MAX_AGE_MS=Object.freeze({"1h":3*60*60*1000,"1d":48*60*60*1000});

  function mapRows(rows,timeframe,asOf) {
    if (!Array.isArray(rows)) throw new TypeError("provider response must be an array");
    const seconds=GRANULARITY[timeframe];
    if (!seconds) throw new RangeError("Coinbase provider supports 1h and 1d; 4h is derived causally from 1h");
    return {
      source:"coinbase-exchange-public",
      symbol:"BTC-USD",
      timeframe,
      asOf,
      candles:rows.map(row=>{
        if (!Array.isArray(row)||row.length<6) throw new TypeError("invalid Coinbase candle row");
        const openMs=Number(row[0])*1000;
        return {
          openTime:new Date(openMs).toISOString(),
          closeTime:new Date(openMs+seconds*1000).toISOString(),
          low:row[1],high:row[2],open:row[3],close:row[4],volume:row[5]
        };
      })
    };
  }

  function assertFresh(series,nowMs) {
    if (!series.candles.length) throw new Error("provider returned no candles");
    const latest=Date.parse(series.candles[series.candles.length-1].closeTime);
    if (nowMs-latest>MAX_AGE_MS[series.timeframe]) throw new Error("market data is stale");
    return series;
  }

  const provider=M.createProviderAdapter("coinbase-exchange-public",async request=>{
    const timeframe=request.timeframe;
    const granularity=GRANULARITY[timeframe];
    if (!granularity) throw new RangeError("Coinbase provider supports 1h and 1d; 4h is derived causally from 1h");
    const fetchFn=request.fetchFn||global.fetch;
    if (typeof fetchFn!=="function") throw new Error("fetch is unavailable");
    const asOf=new Date(request.asOf||Date.now()).toISOString();
    const response=await fetchFn(ENDPOINT+"/BTC-USD/candles?granularity="+granularity,{method:"GET",headers:{"Accept":"application/json"}});
    if (!response.ok) throw new Error("Coinbase candles request failed: HTTP "+response.status);
    return mapRows(await response.json(),timeframe,asOf);
  });

  async function loadCompleted(request) {
    const decisionTime=request.decisionTime||request.asOf||new Date().toISOString();
    const series=await provider.load(request);
    const completed=M.completedOnly(series,decisionTime);
    return assertFresh(completed,Date.parse(decisionTime));
  }

  global.WADATSUMI_COINBASE_PROVIDER=Object.freeze({provider,loadCompleted,mapRows,assertFresh,GRANULARITY});
})(typeof window!=="undefined"?window:globalThis);
