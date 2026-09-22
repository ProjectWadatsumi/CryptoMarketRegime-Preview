(function(global){
"use strict";
global.WADATSUMI_APP_VERSION=Object.freeze({
  app:"crypto-allocation-ui.v1.0",
  stateEngine:"state64.v1",
  allocationPolicy:"allocation-policy.v0.1",
  currentAllocation:"current-allocation.v0.1",
  portfolioAdapter:"portfolio-readonly.v0.1",
  operationLog:"operation-log.v1",
  historicalSimulation:Object.freeze({
    status:"completed",
    phase7Issue:19,
    evidence:"historical only",
    primaryTerminalBtcEquivalent:0.23035117448025172,
    productionAdopted:false
  }),
  executionAuthorized:false,
  walletCapability:false
});
})(typeof window!=="undefined"?window:globalThis);
