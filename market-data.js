/* Phase 2 — normalized, read-only market-data boundary.
 * Provider adapters may fetch data, but chart/structure code consumes only this schema.
 * No wallet, signing, trading or production-write capability belongs here.
 */
(function (global) {
  "use strict";

  const SUPPORTED_TIMEFRAMES = Object.freeze(["1h", "4h", "1d", "1w"]);

  function finiteNumber(value, field) {
    const n = Number(value);
    if (!Number.isFinite(n)) throw new TypeError(field + " must be a finite number");
    return n;
  }

  function isoTime(value, field) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) throw new TypeError(field + " must be a valid timestamp");
    return d.toISOString();
  }

  function normalizeCandle(raw) {
    const candle = {
      openTime: isoTime(raw.openTime, "openTime"),
      closeTime: isoTime(raw.closeTime, "closeTime"),
      open: finiteNumber(raw.open, "open"),
      high: finiteNumber(raw.high, "high"),
      low: finiteNumber(raw.low, "low"),
      close: finiteNumber(raw.close, "close"),
      volume: raw.volume == null ? null : finiteNumber(raw.volume, "volume")
    };
    if (candle.high < Math.max(candle.open, candle.close, candle.low)) throw new RangeError("high is inconsistent");
    if (candle.low > Math.min(candle.open, candle.close, candle.high)) throw new RangeError("low is inconsistent");
    if (Date.parse(candle.closeTime) <= Date.parse(candle.openTime)) throw new RangeError("closeTime must follow openTime");
    return Object.freeze(candle);
  }

  function normalizeSeries(input) {
    if (!input || typeof input !== "object") throw new TypeError("series is required");
    if (!input.source) throw new TypeError("source is required");
    if (!input.symbol) throw new TypeError("symbol is required");
    if (!SUPPORTED_TIMEFRAMES.includes(input.timeframe)) throw new RangeError("unsupported timeframe");
    if (!Array.isArray(input.candles)) throw new TypeError("candles must be an array");

    const asOf = isoTime(input.asOf, "asOf");
    const candles = input.candles.map(normalizeCandle).sort((a,b)=>Date.parse(a.openTime)-Date.parse(b.openTime));
    for (let i=1;i<candles.length;i++) {
      if (Date.parse(candles[i].openTime) <= Date.parse(candles[i-1].openTime)) throw new RangeError("candles must have unique increasing openTime");
    }

    return Object.freeze({
      schemaVersion: "ohlc.v1",
      source: String(input.source),
      symbol: String(input.symbol),
      timeframe: input.timeframe,
      asOf,
      candles: Object.freeze(candles)
    });
  }

  function completedOnly(series, decisionTime) {
    const normalized = normalizeSeries(series);
    const cutoff = Date.parse(isoTime(decisionTime, "decisionTime"));
    return Object.freeze({
      ...normalized,
      candles: Object.freeze(normalized.candles.filter(c=>Date.parse(c.closeTime)<=cutoff))
    });
  }

  function createProviderAdapter(name, loader) {
    if (!name || typeof loader !== "function") throw new TypeError("provider name and loader are required");
    return Object.freeze({
      name: String(name),
      async load(request) {
        const raw = await loader(Object.freeze({...request}));
        return normalizeSeries({...raw, source: raw.source || name});
      }
    });
  }

  global.WADATSUMI_MARKET_DATA = Object.freeze({
    SUPPORTED_TIMEFRAMES,
    normalizeCandle,
    normalizeSeries,
    completedOnly,
    createProviderAdapter
  });
})(typeof window !== "undefined" ? window : globalThis);
