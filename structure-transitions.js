/* Phase 2 — causal invalidation / transition markers.
 * Visualization rule:
 * - UP is established only when latest confirmed labels are HH + HL.
 * - DOWN is established only when latest confirmed labels are LH + LL.
 * - UP protection = latest confirmed HL low; DOWN protection = latest confirmed LH high.
 * - A completed candle CLOSE beyond the protected level creates a forming invalidation.
 * - A transition becomes confirmed only when the latest confirmed labels align with the opposite state.
 * Wicks alone never confirm invalidation.
 */
(function (global) {
  "use strict";
  const MD = global.WADATSUMI_MARKET_DATA;
  if (!MD) throw new Error("WADATSUMI_MARKET_DATA is required");

  function iso(value, field) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) throw new TypeError(field + " must be a valid timestamp");
    return d.toISOString();
  }

  function stateFrom(latest) {
    const high = latest.high && latest.high.label;
    const low = latest.low && latest.low.label;
    if (high === "HH" && low === "HL") return "UP";
    if (high === "LH" && low === "LL") return "DOWN";
    return null;
  }

  function traceLabel(label) {
    if (!label) return null;
    return Object.freeze({
      label: label.label,
      swingType: label.swingType,
      price: Number(label.currentPrice),
      swingOpenTime: iso(label.currentSwingOpenTime, "currentSwingOpenTime"),
      swingCloseTime: iso(label.currentSwingCloseTime, "currentSwingCloseTime"),
      confirmedAt: iso(label.currentSwingConfirmationTime || label.availableAt, "label confirmation")
    });
  }

  function protectedFrom(state, latest) {
    if (state === "UP" && latest.low && latest.low.label === "HL") {
      return Object.freeze({
        kind: "protected-low",
        level: Number(latest.low.currentPrice),
        sourceLabel: "HL",
        sourceSwingOpenTime: iso(latest.low.currentSwingOpenTime, "protected swing open"),
        sourceSwingCloseTime: iso(latest.low.currentSwingCloseTime, "protected swing close"),
        sourceConfirmedAt: iso(latest.low.currentSwingConfirmationTime || latest.low.availableAt, "protected confirmation")
      });
    }
    if (state === "DOWN" && latest.high && latest.high.label === "LH") {
      return Object.freeze({
        kind: "protected-high",
        level: Number(latest.high.currentPrice),
        sourceLabel: "LH",
        sourceSwingOpenTime: iso(latest.high.currentSwingOpenTime, "protected swing open"),
        sourceSwingCloseTime: iso(latest.high.currentSwingCloseTime, "protected swing close"),
        sourceConfirmedAt: iso(latest.high.currentSwingConfirmationTime || latest.high.availableAt, "protected confirmation")
      });
    }
    return null;
  }

  function build(series, structureResult, decisionTime) {
    if (!structureResult || structureResult.schemaVersion !== "structure-label.v1" || !Array.isArray(structureResult.labels)) {
      throw new TypeError("structure-label.v1 result is required");
    }
    const when = iso(decisionTime || structureResult.decisionTime, "decisionTime");
    const cutoff = Date.parse(when);
    const completed = MD.completedOnly(series, when);
    if (completed.symbol !== structureResult.symbol || completed.timeframe !== structureResult.timeframe) {
      throw new RangeError("series and structure result must share symbol/timeframe");
    }

    const labels = structureResult.labels.map((label, index) => {
      if (!label || !["HH","HL","LH","LL"].includes(label.label)) throw new TypeError("invalid structure label at index " + index);
      const availableAt = iso(label.availableAt || label.currentSwingConfirmationTime, "label availableAt");
      if (Date.parse(availableAt) > cutoff) throw new RangeError("structure label exceeds decisionTime");
      return Object.assign({}, label, {availableAt});
    });

    const events = [];
    completed.candles.forEach((candle, index) => events.push({
      kind:"candle",
      time:Date.parse(candle.closeTime),
      priority:0,
      index,
      candle
    }));
    labels.forEach((label, index) => events.push({
      kind:"label",
      time:Date.parse(label.availableAt),
      priority:1,
      index,
      label
    }));
    events.sort((a,b)=>a.time-b.time || a.priority-b.priority || a.index-b.index);

    const latest = {high:null, low:null};
    const markers = [];
    let confirmedState = null;
    let stateEstablishedAt = null;
    let protectedLevel = null;
    let pending = null;

    for (const event of events) {
      if (event.kind === "candle") {
        if (!confirmedState || !protectedLevel || pending) continue;
        const c = event.candle;
        const broken =
          confirmedState === "UP" ? Number(c.close) < protectedLevel.level :
          Number(c.close) > protectedLevel.level;
        if (!broken) continue;

        const toState = confirmedState === "UP" ? "DOWN" : "UP";
        const direction = confirmedState === "UP" ? "U_TO_D" : "D_TO_U";
        pending = Object.freeze({
          direction,
          fromState:confirmedState,
          toState,
          status:"forming",
          invalidatedAt:iso(c.closeTime, "invalidation close"),
          invalidationCandleOpenTime:iso(c.openTime, "invalidation candle open"),
          invalidationCandleCloseTime:iso(c.closeTime, "invalidation candle close"),
          invalidationClose:Number(c.close),
          protected:protectedLevel
        });
        markers.push(Object.freeze({
          type:"invalidation",
          status:"forming",
          direction,
          fromState:confirmedState,
          toState,
          availableAt:pending.invalidatedAt,
          candleOpenTime:pending.invalidationCandleOpenTime,
          candleCloseTime:pending.invalidationCandleCloseTime,
          closePrice:pending.invalidationClose,
          protected:protectedLevel
        }));
        continue;
      }

      const label = event.label;
      latest[label.swingType] = label;
      const alignedState = stateFrom(latest);

      if (!confirmedState && alignedState) {
        confirmedState = alignedState;
        stateEstablishedAt = label.availableAt;
        protectedLevel = protectedFrom(confirmedState, latest);
        continue;
      }

      if (pending && alignedState === pending.toState) {
        const confirmation = Object.freeze({
          type:"transition",
          status:"confirmed",
          direction:pending.direction,
          fromState:pending.fromState,
          toState:pending.toState,
          availableAt:label.availableAt,
          invalidatedAt:pending.invalidatedAt,
          protected:pending.protected,
          confirmingHigh:traceLabel(latest.high),
          confirmingLow:traceLabel(latest.low)
        });
        markers.push(confirmation);
        confirmedState = pending.toState;
        stateEstablishedAt = label.availableAt;
        protectedLevel = protectedFrom(confirmedState, latest);
        pending = null;
        continue;
      }

      if (!pending && confirmedState) {
        const candidateProtection = protectedFrom(confirmedState, latest);
        if (candidateProtection) protectedLevel = candidateProtection;
      }
    }

    return Object.freeze({
      schemaVersion:"structure-transition.v1",
      source:completed.source,
      symbol:completed.symbol,
      timeframe:completed.timeframe,
      dataAsOf:completed.asOf,
      decisionTime:when,
      confirmedState,
      stateEstablishedAt,
      protected:protectedLevel,
      currentTransition:pending,
      markers:Object.freeze(markers)
    });
  }

  global.WADATSUMI_STRUCTURE_TRANSITIONS = Object.freeze({build, stateFrom});
})(typeof window !== "undefined" ? window : globalThis);
