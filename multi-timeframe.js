/* Phase 2 — read-only multi-timeframe structure snapshots. */
(function(global){
 "use strict";
 const S=global.WADATSUMI_SWING_ENGINE,L=global.WADATSUMI_STRUCTURE_LABELS,T=global.WADATSUMI_STRUCTURE_TRANSITIONS;
 if(!S||!L||!T) throw new Error("swing, structure-label and transition engines are required");

 function latestByType(labels,type){
   for(let i=labels.length-1;i>=0;i--) if(labels[i].swingType===type) return labels[i];
   return null;
 }
 function trace(label){
   return label?Object.freeze({
     label:label.label,
     swingType:label.swingType,
     price:Number(label.currentPrice),
     swingOpenTime:label.currentSwingOpenTime,
     swingCloseTime:label.currentSwingCloseTime,
     confirmedAt:label.currentSwingConfirmationTime||label.availableAt
   }):null;
 }
 function lastConfirmedChange(transitions){
   const confirmed=transitions.markers.filter(x=>x.type==="transition"&&x.status==="confirmed").slice(-1)[0];
   if(confirmed) return Object.freeze({
     kind:"transition",
     fromState:confirmed.fromState,
     toState:confirmed.toState,
     direction:confirmed.direction,
     invalidatedAt:confirmed.invalidatedAt,
     confirmedAt:confirmed.availableAt
   });
   if(transitions.confirmedState&&transitions.stateEstablishedAt) return Object.freeze({
     kind:"initial-state",
     fromState:null,
     toState:transitions.confirmedState,
     direction:null,
     invalidatedAt:null,
     confirmedAt:transitions.stateEstablishedAt
   });
   return null;
 }
 function analyze(series,decisionTime,options){
   const radius=options&&options.radius!=null?options.radius:2;
   const swings=S.detect(series,decisionTime,{radius});
   const structure=L.build(swings);
   const transitions=T.build(series,structure,decisionTime);
   const high=latestByType(structure.labels,"high"),low=latestByType(structure.labels,"low");
   const last=series.candles.length?series.candles.filter(c=>Date.parse(c.closeTime)<=Date.parse(decisionTime)).slice(-1)[0]:null;
   return Object.freeze({
     timeframe:series.timeframe,
     source:series.source,
     dataAsOf:series.asOf,
     decisionTime:new Date(decisionTime).toISOString(),
     latestCompletedCandleCloseTime:last?last.closeTime:null,
     confirmedState:transitions.confirmedState,
     formingTransition:transitions.currentTransition?Object.freeze({
       direction:transitions.currentTransition.direction,
       invalidatedAt:transitions.currentTransition.invalidatedAt,
       protectedLevel:transitions.currentTransition.protected.level
     }):null,
     protected:transitions.protected,
     latestHigh:trace(high),
     latestLow:trace(low),
     supportingSwingSequence:Object.freeze(structure.labels.slice(-4).map(trace)),
     lastConfirmedChange:lastConfirmedChange(transitions),
     swingCount:swings.swings.length,
     structureLabelCount:structure.labels.length
   });
 }

 function build(input,decisionTime,options){
   if(!input||!input.weekly||!input.daily||!input.fourHour) throw new TypeError("weekly, daily and fourHour series are required");
   return Object.freeze({
     schemaVersion:"multi-timeframe.v1",
     symbol:input.fourHour.symbol,
     decisionTime:new Date(decisionTime).toISOString(),
     weekly:analyze(input.weekly,decisionTime,options),
     daily:analyze(input.daily,decisionTime,options),
     fourHour:analyze(input.fourHour,decisionTime,options)
   });
 }
 global.WADATSUMI_MULTI_TIMEFRAME=Object.freeze({analyze,build});
})(typeof window!=="undefined"?window:globalThis);
