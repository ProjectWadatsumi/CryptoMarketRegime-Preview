window.MOCK={
isMock:true,asOf:"DEMO FALLBACK",stateId:17,
states:{weekly:"U",daily:"U_TO_D","4h":"D_TO_U"},
target:{crypto:82,usdc:18},actual:{crypto:91,usdc:9},
reason:"Fallback demo only. Live causal market evidence replaces this when available.",
trigger:"Fallback demo only.",
progress:[
{phase:0,name:"Foundation",status:"Complete",tasks:[{name:"Principles",done:true,tests:["Six principles recorded"]},{name:"Tracking semantics",done:true,tests:["Epic → Phase → Task → Test defined"]}]},
{phase:1,name:"UI Prototype",status:"Complete",tasks:[{name:"App shell & navigation",done:true,tests:["Mobile navigation verified"]},{name:"Dashboard decision card",done:true,tests:["Required decision fields visible"]}]},
{phase:2,name:"Visual Chart Engine",status:"Complete",tasks:[{name:"Causal OHLC + structure",done:true,tests:["Completed candles only","W/D/4H evidence trace"]}]},
{phase:3,name:"64-State Engine",status:"Complete",tasks:[{name:"Canonical 64-State",done:true,tests:["64 unique reversible states","Live state highlight"]}]},
{phase:4,name:"Historical State Database",status:"Complete",tasks:[{name:"Causal historical classification",done:true,tests:["No look-ahead","Missing data fail closed"]}]},
{phase:5,name:"64-State Analytics",status:"Complete",tasks:[{name:"Historical diagnostics",done:true,tests:["Forward-return and temporal diagnostics preserved"]}]},
{phase:6,name:"Allocation Policy v0.1",status:"Complete",tasks:[{name:"Direct State target map",done:true,tests:["64 explicit candidate targets","Transition guard deterministic"]}]},
{phase:7,name:"Historical Simulation",status:"Complete",tasks:[{name:"Frozen retrospective replay",done:true,tests:["Frozen SHA reproduced","Risk/return tradeoff reported without retuning"]}]},
{phase:8,name:"Current Allocation Engine",status:"Complete",tasks:[{name:"Live current candidate",done:true,tests:["State → target → rationale → next condition","Phase 7 status reconciled in UI"]}]},
{phase:9,name:"Portfolio Read-only",status:"Complete",tasks:[{name:"Local snapshot adapter",done:true,tests:["A1 read-only schema supported","Actual → candidate gap","No upload or wallet capability"]}]},
{phase:10,name:"Operation Mode",status:"Verification",tasks:[{name:"Local operation log",done:true,tests:["User-triggered local record","JSON export","No execution authority"]},{name:"Operational evidence",done:false,tests:["First real daily-use entry pending"]}]},
{phase:11,name:"Improvement Loop",status:"Verification",tasks:[{name:"Version attribution",done:true,tests:["Every log stores exact app/model/policy versions"]},{name:"Cross-version operational comparison",done:false,tests:["Requires later real model version"]}]}
]};
