/* Phase 3 — canonical 64-state classifier.
 * Canonical order mirrors main research taxonomy v0.1:
 * U, U_TO_D, D, D_TO_U; H4 varies fastest, then D, then W.
 * This module classifies structure only. It assigns no allocation percentage.
 */
(function(global){
 "use strict";
 const PHASE_ORDER=Object.freeze(["U","U_TO_D","D","D_TO_U"]);
 const PHASE_INDEX=Object.freeze(Object.fromEntries(PHASE_ORDER.map((x,i)=>[x,i])));

 function phase(value,field){
   if(!PHASE_ORDER.includes(value)) throw new RangeError((field||"phase")+" must be one of "+PHASE_ORDER.join(", "));
   return value;
 }

 function codeOf(tuple){
   return `W:${tuple.weekly}|D:${tuple.daily}|H4:${tuple.fourHour}`;
 }

 function encode(tuple){
   if(!tuple||typeof tuple!=="object") throw new TypeError("weekly/daily/fourHour tuple is required");
   const weekly=phase(tuple.weekly,"weekly"),daily=phase(tuple.daily,"daily"),fourHour=phase(tuple.fourHour,"fourHour");
   const stateId=PHASE_INDEX[weekly]*16+PHASE_INDEX[daily]*4+PHASE_INDEX[fourHour]+1;
   return Object.freeze({stateId,weekly,daily,fourHour,code:codeOf({weekly,daily,fourHour})});
 }

 function decode(stateId){
   if(!Number.isInteger(stateId)||stateId<1||stateId>64) throw new RangeError("stateId must be an integer from 1 to 64");
   let n=stateId-1;
   const weekly=PHASE_ORDER[Math.floor(n/16)];
   n%=16;
   const daily=PHASE_ORDER[Math.floor(n/4)];
   const fourHour=PHASE_ORDER[n%4];
   return Object.freeze({stateId,weekly,daily,fourHour,code:codeOf({weekly,daily,fourHour})});
 }

 function enumerate(){
   return Object.freeze(Array.from({length:64},(_,i)=>decode(i+1)));
 }

 function phaseFromSnapshot(snapshot){
   if(!snapshot||typeof snapshot!=="object") return null;
   const confirmed=snapshot.confirmedState;
   const forming=snapshot.formingTransition;
   if(forming){
     if(forming.direction==="U_TO_D"&&confirmed==="UP") return "U_TO_D";
     if(forming.direction==="D_TO_U"&&confirmed==="DOWN") return "D_TO_U";
     throw new RangeError("forming transition is inconsistent with retained confirmed state");
   }
   if(confirmed==="UP") return "U";
   if(confirmed==="DOWN") return "D";
   return null;
 }

 function evidence(snapshot,phaseValue){
   return Object.freeze({
     timeframe:snapshot.timeframe,
     phase:phaseValue,
     confirmedState:snapshot.confirmedState,
     formingDirection:snapshot.formingTransition?snapshot.formingTransition.direction:null,
     latestCompletedCandleCloseTime:snapshot.latestCompletedCandleCloseTime||null,
     dataAsOf:snapshot.dataAsOf||null,
     decisionTime:snapshot.decisionTime||null
   });
 }

 function fromMultiTimeframe(multi){
   if(!multi||multi.schemaVersion!=="multi-timeframe.v1") throw new TypeError("multi-timeframe.v1 snapshot is required");
   const w=phaseFromSnapshot(multi.weekly),d=phaseFromSnapshot(multi.daily),h=phaseFromSnapshot(multi.fourHour);
   const phases=Object.freeze({weekly:w,daily:d,fourHour:h});
   if(!w||!d||!h){
     return Object.freeze({
       schemaVersion:"state64.v1",
       available:false,
       stateId:null,
       code:null,
       phases,
       decisionTime:multi.decisionTime,
       reason:"weekly, daily, and four-hour phases must all be causally established",
       evidence:Object.freeze({
         weekly:evidence(multi.weekly,w),
         daily:evidence(multi.daily,d),
         fourHour:evidence(multi.fourHour,h)
       })
     });
   }
   const encoded=encode({weekly:w,daily:d,fourHour:h});
   return Object.freeze({
     schemaVersion:"state64.v1",
     available:true,
     stateId:encoded.stateId,
     code:encoded.code,
     phases:Object.freeze({weekly:w,daily:d,fourHour:h}),
     decisionTime:multi.decisionTime,
     reason:null,
     evidence:Object.freeze({
       weekly:evidence(multi.weekly,w),
       daily:evidence(multi.daily,d),
       fourHour:evidence(multi.fourHour,h)
     })
   });
 }

 global.WADATSUMI_STATE64=Object.freeze({PHASE_ORDER,encode,decode,enumerate,phaseFromSnapshot,fromMultiTimeframe});
})(typeof window!=="undefined"?window:globalThis);
