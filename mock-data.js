window.MOCK={
isMock:true,asOf:"DEMO 2026-09-20 00:00 UTC",stateId:17,
states:{weekly:"U",daily:"U_TO_D","4h":"D_TO_U"},
target:{crypto:82,usdc:18},actual:{crypto:91,usdc:9},
reason:"Demo only: weekly structure remains U while lower timeframes show transition states.",
trigger:"Demo only: allocation would be recalculated when a completed timeframe changes its causal structure state.",
progress:[
{phase:0,name:"Foundation",status:"Complete",tasks:[{name:"Principles",done:true,tests:["Six principles recorded"]},{name:"Tracking semantics",done:true,tests:["Epic → Phase → Task → Test defined"]}]},
{phase:1,name:"UI Prototype",status:"Verification",tasks:[{name:"App shell & navigation",done:true,tests:["Four screens navigable"]},{name:"Dashboard decision card",done:true,tests:["Required decision fields visible"]},{name:"Chart prototype",done:true,tests:["Structure annotation concept visible"]},{name:"64-State Matrix",done:true,tests:["Exactly 64 addressable cells"]},{name:"Progress hierarchy",done:true,tests:["Phase → Task → Test drill-down visible"]},{name:"Mobile-first pass",done:true,tests:["Primary decisions usable at phone width"]},{name:"Mock-data contract",done:true,tests:["Mock values unmistakably labelled"]}]},
...Array.from({length:10},(_,i)=>({phase:i+2,name:["Visual Chart Engine","64-State Engine","Historical State Database","64-State Analytics","Allocation Policy v0.1","Historical Simulation","Current Allocation Engine","Portfolio Read-only","Operation Mode","Improvement Loop"][i],status:"Not started",tasks:[]}))
]};