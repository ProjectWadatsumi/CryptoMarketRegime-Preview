/* Phase 2 — pure view model for the visual explanation panel.
 * It adds no market-state logic; it only formats evidence already present in multi-timeframe.v1.
 */
(function(global){
 "use strict";

 function tfName(timeframe){
   return timeframe==="1w"?"W":timeframe==="1d"?"D":timeframe==="4h"?"4H":timeframe;
 }
 function formatSequence(sequence){
   return (sequence||[]).map(x=>Object.freeze({
     label:x.label,
     swingType:x.swingType,
     price:Number(x.price),
     swingOpenTime:x.swingOpenTime,
     confirmedAt:x.confirmedAt
   }));
 }
 function buildRow(snapshot){
   if(!snapshot||!snapshot.timeframe) throw new TypeError("timeframe snapshot is required");
   const change=snapshot.lastConfirmedChange;
   return Object.freeze({
     timeframe:snapshot.timeframe,
     name:tfName(snapshot.timeframe),
     state:snapshot.confirmedState||"UNESTABLISHED",
     formingTransition:snapshot.formingTransition,
     supportingSwingSequence:Object.freeze(formatSequence(snapshot.supportingSwingSequence)),
     lastConfirmedChange:change?Object.freeze({...change}):null,
     dataAsOf:snapshot.dataAsOf,
     latestCompletedCandleCloseTime:snapshot.latestCompletedCandleCloseTime,
     source:snapshot.source
   });
 }
 function build(multi){
   if(!multi||multi.schemaVersion!=="multi-timeframe.v1") throw new TypeError("multi-timeframe.v1 snapshot is required");
   return Object.freeze({
     schemaVersion:"explanation-panel.v1",
     symbol:multi.symbol,
     decisionTime:multi.decisionTime,
     rows:Object.freeze([buildRow(multi.weekly),buildRow(multi.daily),buildRow(multi.fourHour)])
   });
 }
 global.WADATSUMI_EXPLANATION_PANEL=Object.freeze({build,buildRow,tfName});
})(typeof window!=="undefined"?window:globalThis);
