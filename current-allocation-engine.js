/* Phase 8 — Current Allocation Engine.
 * Converts completed causal market structure into today's read-only decision-support output.
 * Phase 7 historical simulation is still pending; outputs remain candidate-policy research.
 */
(function(global){
 "use strict";

 const MD=global.WADATSUMI_MARKET_DATA;
 const MTF=global.WADATSUMI_MULTI_TIMEFRAME;
 const S64=global.WADATSUMI_STATE64;
 const POLICY=global.WADATSUMI_ALLOCATION_POLICY_V01;
 if(!MD||!MTF||!S64||!POLICY) throw new Error("Phase 8 requires market-data, multi-timeframe, state64 and allocation-policy-v0.1 modules");

 function iso(value,field){
   const d=new Date(value);
   if(Number.isNaN(d.getTime())) throw new TypeError((field||"timestamp")+" must be valid");
   return d.toISOString();
 }

 function stateSnapshot(value){
   if(!value||value.schemaVersion!=="state64.v1") throw new TypeError("state64.v1 snapshot is required");
   if(value.available){
     if(!Number.isInteger(value.stateId)||value.stateId<1||value.stateId>64) throw new RangeError("available state64 snapshot must carry State ID 1..64");
     const canonical=S64.decode(value.stateId);
     if(value.code!==canonical.code) throw new RangeError("state64 code disagrees with canonical State ID");
   }else if(value.stateId!=null||value.code!=null){
     throw new RangeError("unavailable state64 snapshot must not carry State ID/code");
   }
   return value;
 }

 function orderedHistory(history){
   if(!Array.isArray(history)||!history.length) throw new TypeError("non-empty state history is required");
   let last=-Infinity;
   return history.map((row,i)=>{
     const s=stateSnapshot(row);
     const t=Date.parse(iso(s.decisionTime,"stateHistory["+i+"].decisionTime"));
     if(t<=last) throw new RangeError("state history decisionTime values must be unique and strictly increasing");
     last=t;
     return s;
   });
 }

 function nextCondition(decision){
   if(!decision) return "No allocation decision is available.";
   if(decision.action==="increase-pending"){
     return "The same higher raw Crypto target must appear again on the next completed 4h decision before the effective target can increase.";
   }
   if(decision.action==="unavailable-hold"){
     return "Wait for a causally established Weekly / Daily / 4H State. Any pending Crypto increase is cleared while the State is unavailable.";
   }
   return "At the next completed 4h decision, recompute the canonical State. A Crypto decrease of at least 10 percentage points applies immediately; an increase of at least 10 points requires the same higher raw target twice consecutively; changes below 10 points remain inside the deadband.";
 }

 function evaluateStateHistory(history){
   const rows=orderedHistory(history);
   let transition=POLICY.initialTransitionState();
   const replay=[];
   for(const state of rows){
     const decision=POLICY.step(transition,state.available?state.stateId:null);
     replay.push(Object.freeze({state,decision}));
     transition=decision.transitionState;
   }

   const current=replay[replay.length-1];
   const prior=replay.length>1?replay[replay.length-2]:null;
   const effective=current.decision.effectiveCryptoPct;
   const priorEffective=prior?prior.decision.effectiveCryptoPct:null;
   const delta=(effective==null||priorEffective==null)?null:effective-priorEffective;
   const raw=current.state.available?current.decision.rawCryptoPct:null;
   const rule=current.state.available?POLICY.ruleForState(current.state.stateId):null;

   return Object.freeze({
     schemaVersion:"current-allocation-output.v0.1",
     policyVersion:POLICY.POLICY_VERSION,
     phase7HistoricalSimulationStatus:"pending",
     historicalSimulationPassed:false,
     productionAdopted:false,
     executionAuthorized:false,
     stateAvailable:current.state.available,
     targetAvailable:effective!=null,
     stateId:current.state.available?current.state.stateId:null,
     code:current.state.available?current.state.code:null,
     phases:current.state.phases,
     rawCryptoPct:raw,
     rawUsdcPct:raw==null?null:100-raw,
     effectiveCryptoPct:effective,
     effectiveUsdcPct:effective==null?null:100-effective,
     priorEffectiveCryptoPct:priorEffective,
     priorEffectiveUsdcPct:priorEffective==null?null:100-priorEffective,
     priorTargetDeltaCryptoPct:delta,
     policyAction:current.decision.action,
     policyReason:current.decision.reason,
     rationale:rule?rule.rationale:(current.state.reason||"Current causal State is unavailable."),
     nextStateChangeCondition:nextCondition(current.decision),
     decisionTime:current.state.decisionTime,
     dataAsOf:current.state.evidence&&current.state.evidence.fourHour
       ? current.state.evidence.fourHour.latestCompletedCandleCloseTime
       : current.state.decisionTime,
     evidence:current.state.evidence||null,
     replayDecisionCount:replay.length,
     transitionState:current.decision.transitionState,
     researchOnly:true
   });
 }

 function historyFromCompletedSeries(input){
   if(!input||!input.weekly||!input.daily||!input.fourHour) throw new TypeError("weekly, daily and fourHour series are required");
   const cutoff=iso(input.decisionTime||new Date().toISOString(),"decisionTime");
   const completed4h=MD.completedOnly(input.fourHour,cutoff);
   if(!completed4h.candles.length) throw new RangeError("no completed 4h decision rows are available");
   const decisionTimes=completed4h.candles.map(c=>c.closeTime);
   const radius=input.radius==null?2:Number(input.radius);
   if(!Number.isInteger(radius)||radius<1) throw new RangeError("radius must be an integer >= 1");

   const rows=[];
   for(const decisionTime of decisionTimes){
     const weekly=MD.completedOnly(input.weekly,decisionTime);
     const daily=MD.completedOnly(input.daily,decisionTime);
     const fourHour=MD.completedOnly(input.fourHour,decisionTime);
     const multi=MTF.build({weekly,daily,fourHour},decisionTime,{radius});
     rows.push(S64.fromMultiTimeframe(multi));
   }
   return Object.freeze(rows);
 }

 function build(input){
   const history=historyFromCompletedSeries(input);
   const output=evaluateStateHistory(history);
   return Object.freeze({
     schemaVersion:"current-allocation-engine.v0.1",
     output,
     stateHistory:Object.freeze(history)
   });
 }

 global.WADATSUMI_CURRENT_ALLOCATION_ENGINE=Object.freeze({
   evaluateStateHistory,
   historyFromCompletedSeries,
   build
 });
})(typeof window!=="undefined"?window:globalThis);
