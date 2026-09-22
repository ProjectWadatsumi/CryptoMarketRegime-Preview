/* Phase 6 — Allocation Policy v0.1
 * Direct canonical State ID -> Crypto/USDC lookup.
 * No D/R/C score, policy severity label, five-level family, or future outcome input.
 * Research decision support only; no execution authority.
 */
(function(global){
 "use strict";

 const S64=global.WADATSUMI_STATE64;
 if(!S64) throw new Error("WADATSUMI_STATE64 is required");

 const POLICY_VERSION="allocation-policy.v0.1";
 const RAW_TARGETS=Object.freeze([
   90,85,80,85, 75,70,65,70, 50,45,40,45, 70,65,60,65,
   80,75,70,75, 65,60,55,60, 40,35,30,35, 60,55,50,55,
   60,55,50,55, 45,40,35,40, 30,25,20,25, 45,40,35,40,
   75,70,65,70, 60,55,50,55, 40,35,30,35, 60,55,50,55
 ]);

 const TRANSITION_GUARD=Object.freeze({
   rebalanceDeadbandPct:10,
   cryptoDecreaseConfirmationBars:1,
   cryptoIncreaseConfirmationBars:2,
   decisionBarHours:4,
   unavailableBehavior:"hold_previous_effective_target",
   firstValidStateBehavior:"initialize_to_raw_target"
 });

 const PHASE_TEXT=Object.freeze({
   weekly:Object.freeze({
     U:"weekly structure is established UP, so long-horizon context supports higher Crypto participation",
     U_TO_D:"weekly UP is invalidating, so long-horizon exposure is reduced before a fully established DOWN state",
     D:"weekly structure is established DOWN, so long-horizon context limits Crypto exposure",
     D_TO_U:"weekly DOWN is invalidating, so long-horizon context allows partial recovery without treating it as fully established UP"
   }),
   daily:Object.freeze({
     U:"daily structure is established UP and supports the main exposure region",
     U_TO_D:"daily UP is invalidating and therefore lowers the raw target",
     D:"daily structure is established DOWN and materially lowers the raw target",
     D_TO_U:"daily DOWN is invalidating and permits partial recovery without assuming a confirmed daily UP"
   }),
   fourHour:Object.freeze({
     U:"4h structure is established UP, adding only a small near-term increase",
     U_TO_D:"4h UP is invalidating; the pair anchor is kept without an extra increase",
     D:"4h structure is established DOWN, removing only a small near-term amount",
     D_TO_U:"4h DOWN is invalidating; the pair anchor is kept rather than treating transition alone as confirmed recovery"
   })
 });

 function validStateId(value){
   const id=Number(value);
   if(!Number.isInteger(id)||id<1||id>64) throw new RangeError("State ID must be an integer 1..64");
   return id;
 }

 function ruleForState(stateId){
   const id=validStateId(stateId);
   const decoded=S64.decode(id);
   const cryptoPct=RAW_TARGETS[id-1];
   const usdcPct=100-cryptoPct;
   const rationale=[
     decoded.code+".",
     PHASE_TEXT.weekly[decoded.weekly]+".",
     PHASE_TEXT.daily[decoded.daily]+".",
     PHASE_TEXT.fourHour[decoded.fourHour]+".",
     "The frozen v0.1 direct lookup therefore sets "+cryptoPct+"% Crypto / "+usdcPct+"% USDC.",
     "This target is a research hypothesis constrained by sparse evidence, prior whipsaw/re-entry failures, and neighbor consistency; it is not claimed historically optimal or prospectively validated."
   ].join(" ");
   return Object.freeze({
     schemaVersion:"allocation-rule.v0.1",
     policyVersion:POLICY_VERSION,
     stateId:id,
     code:decoded.code,
     phases:Object.freeze({
       weekly:decoded.weekly,
       daily:decoded.daily,
       fourHour:decoded.fourHour
     }),
     cryptoPct,
     usdcPct,
     rationale,
     researchOnly:true,
     productionConnected:false,
     executionAuthorized:false
   });
 }

 function enumerateRules(){
   return Object.freeze(Array.from({length:64},(_,i)=>ruleForState(i+1)));
 }

 function policyDefinition(){
   const rules=enumerateRules();
   return Object.freeze({
     schemaVersion:"allocation-policy.v0.1",
     policyVersion:POLICY_VERSION,
     taxonomyCaseCount:64,
     directStateLookup:true,
     policySeverityScoreUsed:false,
     fiveLevelFamilyUsed:false,
     forwardOutcomeUsedAsPolicyInput:false,
     cryptoTargetMinPct:Math.min(...rules.map(x=>x.cryptoPct)),
     cryptoTargetMaxPct:Math.max(...rules.map(x=>x.cryptoPct)),
     uniqueCryptoTargetCount:new Set(rules.map(x=>x.cryptoPct)).size,
     transitionGuard:TRANSITION_GUARD,
     rules
   });
 }

 function initialTransitionState(){
   return Object.freeze({
     schemaVersion:"allocation-transition-state.v0.1",
     policyVersion:POLICY_VERSION,
     effectiveCryptoPct:null,
     pendingIncreaseCryptoPct:null,
     pendingIncreaseCount:0,
     lastStateId:null
   });
 }

 function normalizeTransitionState(state){
   if(!state) return initialTransitionState();
   if(state.schemaVersion!=="allocation-transition-state.v0.1"||state.policyVersion!==POLICY_VERSION){
     throw new TypeError("allocation-transition-state.v0.1 for "+POLICY_VERSION+" is required");
   }
   const effective=state.effectiveCryptoPct;
   if(effective!=null&&(!Number.isFinite(Number(effective))||Number(effective)<0||Number(effective)>100)){
     throw new RangeError("effectiveCryptoPct must be null or 0..100");
   }
   const pending=state.pendingIncreaseCryptoPct;
   if(pending!=null&&(!Number.isFinite(Number(pending))||Number(pending)<0||Number(pending)>100)){
     throw new RangeError("pendingIncreaseCryptoPct must be null or 0..100");
   }
   const count=Number(state.pendingIncreaseCount);
   if(!Number.isInteger(count)||count<0) throw new RangeError("pendingIncreaseCount must be a non-negative integer");
   const last=state.lastStateId;
   if(last!=null) validStateId(last);
   return Object.freeze({
     schemaVersion:"allocation-transition-state.v0.1",
     policyVersion:POLICY_VERSION,
     effectiveCryptoPct:effective==null?null:Number(effective),
     pendingIncreaseCryptoPct:pending==null?null:Number(pending),
     pendingIncreaseCount:count,
     lastStateId:last==null?null:Number(last)
   });
 }

 function result(state,rule,action,reason){
   const effective=state.effectiveCryptoPct;
   return Object.freeze({
     schemaVersion:"allocation-decision.v0.1",
     policyVersion:POLICY_VERSION,
     stateId:rule?rule.stateId:null,
     code:rule?rule.code:null,
     rawCryptoPct:rule?rule.cryptoPct:null,
     rawUsdcPct:rule?rule.usdcPct:null,
     effectiveCryptoPct:effective,
     effectiveUsdcPct:effective==null?null:100-effective,
     action,
     reason,
     researchOnly:true,
     productionConnected:false,
     executionAuthorized:false,
     transitionState:state
   });
 }

 function step(previousState,stateId){
   const prev=normalizeTransitionState(previousState);

   if(stateId==null){
     const next=Object.freeze({
       ...prev,
       pendingIncreaseCryptoPct:null,
       pendingIncreaseCount:0,
       lastStateId:null
     });
     return result(next,null,"unavailable-hold",
       prev.effectiveCryptoPct==null
         ?"No valid State ID and no prior effective target; remain unavailable."
         :"No valid State ID; hold the prior effective target and clear any pending increase."
     );
   }

   const rule=ruleForState(stateId);
   const raw=rule.cryptoPct;

   if(prev.effectiveCryptoPct==null){
     const next=Object.freeze({
       schemaVersion:"allocation-transition-state.v0.1",
       policyVersion:POLICY_VERSION,
       effectiveCryptoPct:raw,
       pendingIncreaseCryptoPct:null,
       pendingIncreaseCount:0,
       lastStateId:rule.stateId
     });
     return result(next,rule,"initialize","First valid State initializes directly to its frozen raw target.");
   }

   const delta=raw-prev.effectiveCryptoPct;
   if(Math.abs(delta)<TRANSITION_GUARD.rebalanceDeadbandPct){
     const next=Object.freeze({
       schemaVersion:"allocation-transition-state.v0.1",
       policyVersion:POLICY_VERSION,
       effectiveCryptoPct:prev.effectiveCryptoPct,
       pendingIncreaseCryptoPct:null,
       pendingIncreaseCount:0,
       lastStateId:rule.stateId
     });
     return result(next,rule,"hold-deadband",
       "Raw target differs by less than "+TRANSITION_GUARD.rebalanceDeadbandPct+" percentage points; hold to reduce churn."
     );
   }

   if(delta<0){
     const next=Object.freeze({
       schemaVersion:"allocation-transition-state.v0.1",
       policyVersion:POLICY_VERSION,
       effectiveCryptoPct:raw,
       pendingIncreaseCryptoPct:null,
       pendingIncreaseCount:0,
       lastStateId:rule.stateId
     });
     return result(next,rule,"decrease-immediate","Crypto decrease of at least 10 points applies immediately.");
   }

   const sameCandidate=prev.pendingIncreaseCryptoPct===raw;
   const count=sameCandidate?prev.pendingIncreaseCount+1:1;
   if(count>=TRANSITION_GUARD.cryptoIncreaseConfirmationBars){
     const next=Object.freeze({
       schemaVersion:"allocation-transition-state.v0.1",
       policyVersion:POLICY_VERSION,
       effectiveCryptoPct:raw,
       pendingIncreaseCryptoPct:null,
       pendingIncreaseCount:0,
       lastStateId:rule.stateId
     });
     return result(next,rule,"increase-confirmed",
       "Same higher raw target persisted for "+TRANSITION_GUARD.cryptoIncreaseConfirmationBars+" completed 4h decisions; apply the increase."
     );
   }

   const next=Object.freeze({
     schemaVersion:"allocation-transition-state.v0.1",
     policyVersion:POLICY_VERSION,
     effectiveCryptoPct:prev.effectiveCryptoPct,
     pendingIncreaseCryptoPct:raw,
     pendingIncreaseCount:count,
     lastStateId:rule.stateId
   });
   return result(next,rule,"increase-pending",
     "Higher raw target requires two consecutive completed 4h decisions to reduce rapid-reversal re-entry churn."
   );
 }

 function replay(stateIds,initialState){
   if(!Array.isArray(stateIds)) throw new TypeError("stateIds must be an array");
   let state=normalizeTransitionState(initialState);
   const decisions=[];
   for(const stateId of stateIds){
     const decision=step(state,stateId);
     decisions.push(decision);
     state=decision.transitionState;
   }
   return Object.freeze({
     schemaVersion:"allocation-policy-replay.v0.1",
     policyVersion:POLICY_VERSION,
     decisions:Object.freeze(decisions),
     finalTransitionState:state
   });
 }

 global.WADATSUMI_ALLOCATION_POLICY_V01=Object.freeze({
   POLICY_VERSION,
   RAW_TARGETS,
   TRANSITION_GUARD,
   ruleForState,
   enumerateRules,
   policyDefinition,
   initialTransitionState,
   step,
   replay
 });
})(typeof window!=="undefined"?window:globalThis);
