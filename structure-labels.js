/* Phase 2 — causal HH/HL/LH/LL labels derived only from confirmed swings. */
(function (global) {
  "use strict";

  function iso(value, field) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) throw new TypeError(field + " must be a valid timestamp");
    return d.toISOString();
  }

  function finite(value, field) {
    const n = Number(value);
    if (!Number.isFinite(n)) throw new TypeError(field + " must be a finite number");
    return n;
  }

  function validateSwing(swing, index) {
    if (!swing || (swing.type !== "high" && swing.type !== "low")) throw new TypeError("invalid swing at index " + index);
    return Object.freeze({
      type: swing.type,
      price: finite(swing.price, "swing.price"),
      swingIndex: Number(swing.swingIndex),
      swingOpenTime: iso(swing.swingOpenTime, "swingOpenTime"),
      swingCloseTime: iso(swing.swingCloseTime, "swingCloseTime"),
      confirmationIndex: Number(swing.confirmationIndex),
      confirmationTime: iso(swing.confirmationTime, "confirmationTime")
    });
  }

  function classify(type, previousPrice, currentPrice) {
    if (currentPrice === previousPrice) return Object.freeze({relation:"equal", label:null});
    if (type === "high") return Object.freeze({
      relation: currentPrice > previousPrice ? "higher" : "lower",
      label: currentPrice > previousPrice ? "HH" : "LH"
    });
    return Object.freeze({
      relation: currentPrice > previousPrice ? "higher" : "lower",
      label: currentPrice > previousPrice ? "HL" : "LL"
    });
  }

  function build(swingResult) {
    if (!swingResult || swingResult.schemaVersion !== "swing.v1" || !Array.isArray(swingResult.swings)) {
      throw new TypeError("swing.v1 result is required");
    }
    const decisionTime = iso(swingResult.decisionTime, "decisionTime");
    const cutoff = Date.parse(decisionTime);
    const previous = {high:null, low:null};
    const comparisons = [];
    const labels = [];
    let lastConfirmation = -Infinity;

    swingResult.swings.forEach((raw, index) => {
      const current = validateSwing(raw, index);
      const confirmedAt = Date.parse(current.confirmationTime);
      if (confirmedAt > cutoff) throw new RangeError("swing confirmation exceeds decisionTime");
      if (confirmedAt < lastConfirmation) throw new RangeError("swings must be ordered by confirmationTime");
      lastConfirmation = confirmedAt;

      const prior = previous[current.type];
      if (prior) {
        const relation = classify(current.type, prior.price, current.price);
        const comparison = Object.freeze({
          label: relation.label,
          relation: relation.relation,
          swingType: current.type,
          availableAt: current.confirmationTime,
          currentPrice: current.price,
          currentSwingIndex: current.swingIndex,
          currentSwingOpenTime: current.swingOpenTime,
          currentSwingCloseTime: current.swingCloseTime,
          currentSwingConfirmationIndex: current.confirmationIndex,
          currentSwingConfirmationTime: current.confirmationTime,
          previousPrice: prior.price,
          previousSwingIndex: prior.swingIndex,
          previousSwingOpenTime: prior.swingOpenTime,
          previousSwingCloseTime: prior.swingCloseTime,
          previousSwingConfirmationIndex: prior.confirmationIndex,
          previousSwingConfirmationTime: prior.confirmationTime
        });
        comparisons.push(comparison);
        if (comparison.label) labels.push(comparison);
      }
      previous[current.type] = current;
    });

    return Object.freeze({
      schemaVersion: "structure-label.v1",
      source: String(swingResult.source || ""),
      symbol: String(swingResult.symbol || ""),
      timeframe: String(swingResult.timeframe || ""),
      dataAsOf: iso(swingResult.dataAsOf, "dataAsOf"),
      decisionTime,
      radius: Number(swingResult.radius),
      comparisons: Object.freeze(comparisons),
      labels: Object.freeze(labels)
    });
  }

  global.WADATSUMI_STRUCTURE_LABELS = Object.freeze({build, classify});
})(typeof window !== "undefined" ? window : globalThis);
