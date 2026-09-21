/* Phase 2 — causal swing detection on completed candles only.
 * A swing is attributed to its center candle but becomes known only when
 * the configured number of right-side candles have completed.
 */
(function (global) {
  "use strict";
  const MD = global.WADATSUMI_MARKET_DATA;
  if (!MD) throw new Error("WADATSUMI_MARKET_DATA is required");

  function normalizeRadius(value) {
    const radius = value == null ? 2 : Number(value);
    if (!Number.isInteger(radius) || radius < 1) throw new RangeError("radius must be a positive integer");
    return radius;
  }

  function detect(series, decisionTime, options) {
    const radius = normalizeRadius(options && options.radius);
    const completed = MD.completedOnly(series, decisionTime);
    const candles = completed.candles;
    const swings = [];

    for (let i = radius; i + radius < candles.length; i++) {
      const center = candles[i];
      const neighbors = candles.slice(i - radius, i).concat(candles.slice(i + 1, i + radius + 1));
      const confirmationIndex = i + radius;
      const confirmation = candles[confirmationIndex];
      const isHigh = neighbors.every(c => center.high > c.high);
      const isLow = neighbors.every(c => center.low < c.low);

      if (isHigh) swings.push(Object.freeze({
        type: "high",
        price: center.high,
        swingIndex: i,
        swingOpenTime: center.openTime,
        swingCloseTime: center.closeTime,
        confirmationIndex,
        confirmationOpenTime: confirmation.openTime,
        confirmationTime: confirmation.closeTime,
        radius
      }));
      if (isLow) swings.push(Object.freeze({
        type: "low",
        price: center.low,
        swingIndex: i,
        swingOpenTime: center.openTime,
        swingCloseTime: center.closeTime,
        confirmationIndex,
        confirmationOpenTime: confirmation.openTime,
        confirmationTime: confirmation.closeTime,
        radius
      }));
    }

    swings.sort((a, b) =>
      Date.parse(a.confirmationTime) - Date.parse(b.confirmationTime) ||
      a.swingIndex - b.swingIndex ||
      (a.type === b.type ? 0 : a.type === "high" ? -1 : 1)
    );

    return Object.freeze({
      schemaVersion: "swing.v1",
      source: completed.source,
      symbol: completed.symbol,
      timeframe: completed.timeframe,
      dataAsOf: completed.asOf,
      decisionTime: new Date(decisionTime).toISOString(),
      radius,
      latestCompletedCandleCloseTime: candles.length ? candles[candles.length - 1].closeTime : null,
      swings: Object.freeze(swings)
    });
  }

  global.WADATSUMI_SWING_ENGINE = Object.freeze({detect, normalizeRadius});
})(typeof window !== "undefined" ? window : globalThis);
