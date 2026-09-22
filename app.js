const d=window.MOCK,VERS=window.WADATSUMI_APP_VERSION,PORT=window.WADATSUMI_PORTFOLIO_READONLY,OLOG=window.WADATSUMI_OPERATION_LOG;let liveAllocationOutput=null,portfolioSnapshot=null;const $=s=>document.querySelector(s);$("#asof").textContent=d.asOf;$("#stateId").textContent="State "+String(d.stateId).padStart(2,"0");$("#stateTuple").textContent=d.states.weekly+" / "+d.states.daily+" / "+d.states["4h"];$("#crypto").textContent=d.target.crypto;$("#usdc").textContent=d.target.usdc;$("#actual").textContent=d.actual.crypto+"% Crypto / "+d.actual.usdc+"% USDC";$("#delta").textContent="Demo delta: "+(d.target.crypto-d.actual.crypto)+" pp Crypto";$("#reason").textContent=d.reason;$("#trigger").textContent=d.trigger;$("#tf").innerHTML=Object.entries(d.states).map(([k,v])=>`<div><small>${k.toUpperCase()}</small><b>${v.replace("_","→")}</b></div>`).join("");document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>{document.querySelectorAll("nav button,.screen").forEach(x=>x.classList.remove("active"));b.classList.add("active");$("#"+b.dataset.screen).classList.add("active")});const S64=window.WADATSUMI_STATE64,P01=window.WADATSUMI_ALLOCATION_POLICY_V01,matrixCases=S64.enumerate(),mg=$("#matrixGrid");for(const row of matrixCases){const c=document.createElement("button");c.className="cell";c.textContent=String(row.stateId).padStart(2,"0");c.dataset.stateId=String(row.stateId);c.dataset.code=row.code;c.title=row.code;c.onclick=()=>{const rule=P01.ruleForState(row.stateId);$("#stateDetail").textContent=`State ${String(row.stateId).padStart(2,"0")} — ${row.code} — candidate ${rule.cryptoPct}% Crypto / ${rule.usdcPct}% USDC · historical simulation completed; production adoption false.`};mg.appendChild(c)}$("#stateDetail").textContent="Canonical 64-state inventory with Phase 6 candidate targets. Phase 7 historical simulation completed; production adoption remains false.";const pct=p=>{if(!p.tasks.length)return 0;return Math.round(100*p.tasks.filter(t=>t.done).length/p.tasks.length)};$("#phases").innerHTML=d.progress.map(p=>`<details class="progress-detail" ${p.phase<2?"open":""}><summary><b>Phase ${p.phase}</b><span>${p.name}</span><span class="status">${p.status}</span><span>${pct(p)}%</span></summary><div class="bar"><i style="width:${pct(p)}%"></i></div><div class="tasks">${p.tasks.length?p.tasks.map(t=>`<details><summary>${t.done?"✓":"○"} ${t.name}</summary><ul>${t.tests.map(x=>`<li>TEST — ${x}</li>`).join("")}</ul></details>`).join(""):"<p>Tasks will be decomposed when this phase starts.</p>"}</div></details>`).join("");const I18N={
ja:{
 banner:"研究候補配分 — Phase 7履歴検証完了 / 本番採用・自動執行ではありません",
 title:"暗号資産 配分コンソール",language:"言語",asof:"データ時点",
 navDashboard:"ダッシュボード",navChart:"チャート",navMatrix:"64状態",navOperation:"運用",navProgress:"進捗",
 currentState:"現在の状態",target:"候補配分",actualTarget:"実保有 → 候補",why:"理由",nextChange:"次の変更条件",safety:"安全境界",crypto:"暗号資産",
 boundaryText:"閲覧専用の意思決定支援です。ウォレット署名、承認、スワップ、流動性操作、送金は行いません。",
 chartTitle:"BTC 構造チャート",matrixTitle:"64状態マトリクス",buildProgress:"開発進捗",
 progressNote:"GitHub Issuesが進捗正本です。UI v1.0は意思決定支援とローカル記録までを担当し、資産執行権限を持ちません。",
 portfolioTitle:"実保有スナップショット / Read-only",portfolioNote:"実資産データはこのブラウザ内でのみ読み取ります。公開previewやGitHubへアップロードしません。",
 portfolioLoad:"JSON snapshotを読み込む",operationLogTitle:"運用ログ",operationLogNote:"モデルの提案と、たけちゃんの判断をローカル保存します。資産操作は行いません。",
 decisionLabel:"判断",noteLabel:"メモ",recordDecision:"この判断を記録",exportLog:"ログを書き出す",versionTitle:"バージョン / 改善ループ"
},
en:{
 banner:"RESEARCH CANDIDATE — PHASE 7 HISTORICAL SIMULATION COMPLETE / NOT PRODUCTION OR EXECUTION",
 title:"Crypto Allocation Console",language:"Language",asof:"Data as of",
 navDashboard:"Dashboard",navChart:"Chart",navMatrix:"64-State",navOperation:"Operate",navProgress:"Progress",
 currentState:"CURRENT STATE",target:"CANDIDATE TARGET",actualTarget:"Actual → Candidate",why:"Why",nextChange:"Next change",safety:"Safety boundary",crypto:"Crypto",
 boundaryText:"Read-only decision support. No wallet signing, approvals, swaps, liquidity actions or transfers.",
 chartTitle:"BTC Structure Chart",matrixTitle:"64-State Matrix",buildProgress:"Build Progress",
 progressNote:"GitHub Issues are the progress source of truth. UI v1.0 provides decision support and local logging only; it has no execution authority.",
 portfolioTitle:"Portfolio snapshot / Read-only",portfolioNote:"Asset data are read locally in this browser only. The raw snapshot is not uploaded to the public preview or GitHub.",
 portfolioLoad:"Load JSON snapshot",operationLogTitle:"Operation log",operationLogNote:"Store model output and the user's decision locally. The app does not execute assets.",
 decisionLabel:"Decision",noteLabel:"Note",recordDecision:"Record this decision",exportLog:"Export log",versionTitle:"Version / Improvement loop"
}
};
let lang="ja";try{lang=localStorage.getItem("wadatsumi-lang")||"ja"}catch(e){}
const phaseText=v=>v==null?"—":String(v).replaceAll("_TO_","→");
const fmtPct=v=>Number.isFinite(Number(v))?Number(v).toFixed(2).replace(/\.00$/,""):"—";
const renderPortfolioGap=()=>{
 const status=$("#portfolioStatus"),actual=$("#actual"),delta=$("#delta");
 if(!portfolioSnapshot){
  actual.textContent=lang==="ja"?"実保有snapshot未読込":"Portfolio snapshot not loaded";
  delta.textContent=lang==="ja"?"候補との差分は未算出":"Candidate gap unavailable";
  status.textContent=lang==="ja"?"運用タブから読取専用JSON snapshotを読み込めます。":"Load a read-only JSON snapshot from the Operate tab.";
  return;
 }
 actual.textContent=`${fmtPct(portfolioSnapshot.actualCryptoPct)}% Crypto / ${fmtPct(portfolioSnapshot.actualUsdcPct)}% USDC`;
 status.textContent=`${portfolioSnapshot.scope} · ${portfolioSnapshot.asOf||"as-of unavailable"} · ${portfolioSnapshot.reconciliationStatus}`;
 if(!liveAllocationOutput||liveAllocationOutput===false||!liveAllocationOutput.targetAvailable){
  delta.textContent=lang==="ja"?"candidate targetが利用不能のため差分は未算出":"Candidate target unavailable; gap not calculated";
  return;
 }
 const gap=PORT.compare(portfolioSnapshot,liveAllocationOutput.effectiveCryptoPct);
 const sign=gap.deltaCryptoPct>0?"+":"";
 delta.textContent=lang==="ja"
  ?`Crypto差分 ${sign}${fmtPct(gap.deltaCryptoPct)}ポイント（actual → candidate）`
  :`Crypto gap ${sign}${fmtPct(gap.deltaCryptoPct)} pp (actual → candidate)`;
};
const renderPortfolioPanel=()=>{
 $("#portfolioScope").textContent=portfolioSnapshot?portfolioSnapshot.scope:"—";
 $("#portfolioAsOf").textContent=portfolioSnapshot?(portfolioSnapshot.asOf||"—"):"—";
 $("#portfolioCrypto").textContent=portfolioSnapshot?fmtPct(portfolioSnapshot.actualCryptoPct)+"%":"—";
 $("#portfolioUsdc").textContent=portfolioSnapshot?fmtPct(portfolioSnapshot.actualUsdcPct)+"%":"—";
 if(portfolioSnapshot){
  $("#portfolioImportStatus").textContent=`READ-ONLY · ${portfolioSnapshot.source} · ${portfolioSnapshot.scopeCompleteness}`;
 }
 renderPortfolioGap();
};
const renderVersionMeta=()=>{
 const rows=[
  ["App",VERS.app],["State",VERS.stateEngine],["Policy",VERS.allocationPolicy],
  ["Current",VERS.currentAllocation],["Portfolio",VERS.portfolioAdapter],["Log",VERS.operationLog]
 ];
 $("#versionMeta").innerHTML=rows.map(([k,v])=>`<div><small>${k}</small><b>${v}</b></div>`).join("");
 const groups=OLOG.versionSummary();
 $("#versionSummary").textContent=groups.length
  ?groups.map(x=>`${x.version}: ${x.count} log${x.count===1?"":"s"}`).join(" · ")
  :(lang==="ja"?"運用ログはまだありません。":"No operation logs yet.");
};
const renderOperationLog=()=>{
 let rows=[];
 try{rows=OLOG.load();}catch(e){$("#operationStatus").textContent="Local log unavailable: "+e.message;return;}
 $("#operationEntries").innerHTML=rows.slice().reverse().map(r=>`<article class="log-entry"><header><b>${r.stateId==null?"State —":"State "+String(r.stateId).padStart(2,"0")}</b><small>${r.loggedAt}</small></header><p>${r.modelTargetCryptoPct==null?"Target —":fmtPct(r.modelTargetCryptoPct)+"% Crypto"} · ${r.actualCryptoPct==null?"Actual —":fmtPct(r.actualCryptoPct)+"% actual"} · ${r.deltaCryptoPct==null?"Gap —":fmtPct(r.deltaCryptoPct)+" pp gap"}</p><p>${r.userDecision}${r.userNote?" · "+r.userNote:""}</p><small>${r.versions.app} · ${r.versions.allocationPolicy}</small></article>`).join("");
 renderVersionMeta();
};
const renderLiveAllocation=o=>{
 liveAllocationOutput=o;
 const banner=$("#modeBanner");
 if(o.stateAvailable){
  $("#stateId").textContent="State "+String(o.stateId).padStart(2,"0");
  $("#stateTuple").textContent=phaseText(o.phases.weekly)+" / "+phaseText(o.phases.daily)+" / "+phaseText(o.phases.fourHour);
 }else{
  $("#stateId").textContent="State unavailable";
  $("#stateTuple").textContent="— / — / —";
 }
 $("#crypto").textContent=o.targetAvailable?o.effectiveCryptoPct:"—";
 $("#usdc").textContent=o.targetAvailable?o.effectiveUsdcPct:"—";
 $("#asof").textContent=o.dataAsOf||o.decisionTime||"—";
 const prefix=lang==="ja"
  ?"Phase 7履歴シミュレーションは完了していますが、candidate policyは本番採用されていません。"
  :"Phase 7 historical simulation is complete, but the candidate policy is not production-adopted.";
 $("#reason").textContent=prefix+" "+o.rationale+" "+o.policyReason;
 $("#trigger").textContent=o.nextStateChangeCondition;
 $("#tf").innerHTML=[
  ["W",o.phases&&o.phases.weekly],["D",o.phases&&o.phases.daily],["4H",o.phases&&o.phases.fourHour]
 ].map(([k,v])=>`<div><small>${k}</small><b>${phaseText(v)}</b></div>`).join("");
 banner.textContent=lang==="ja"
  ?"研究候補配分 — Phase 7履歴検証完了 / 本番採用・自動執行ではありません"
  :"RESEARCH CANDIDATE — PHASE 7 HISTORICAL SIMULATION COMPLETE / NOT PRODUCTION OR EXECUTION";
 renderPortfolioGap();
};
const renderLiveUnavailable=()=>{
 liveAllocationOutput=false;
 $("#stateId").textContent="State unavailable";
 $("#stateTuple").textContent="— / — / —";
 $("#crypto").textContent="—";$("#usdc").textContent="—";
 $("#asof").textContent=lang==="ja"?"取得不能":"unavailable";
 $("#reason").textContent=lang==="ja"?"ライブの因果的市場データを確認できないため、candidate targetを表示しません。":"Live causal market evidence is unavailable; no candidate target is shown.";
 $("#trigger").textContent=lang==="ja"?"完成データが取得でき、W/D/4HのStateが因果的に確定した後に再計算します。":"Recompute only after completed data are available and W/D/4H can be causally classified.";
 $("#tf").innerHTML="";
 $("#modeBanner").textContent=lang==="ja"?"ライブエンジン利用不能 — candidate targetなし / 実保有snapshotはローカル保持":"LIVE ENGINE UNAVAILABLE — NO CANDIDATE TARGET / PORTFOLIO SNAPSHOT REMAINS LOCAL";
 renderPortfolioGap();
};
const dynamic=()=>{
 if(liveAllocationOutput===false){renderLiveUnavailable();renderOperationLog();return;}
 if(liveAllocationOutput){renderLiveAllocation(liveAllocationOutput);renderOperationLog();return;}
 renderPortfolioGap();
 $("#reason").textContent=lang==="ja"?"ライブ因果データを読み込み中です。":"Loading live causal evidence.";
 $("#trigger").textContent=lang==="ja"?"完成した市場データからStateを確定後に表示します。":"Shown after completed market data establish the current State.";
 $("#stateDetail").textContent=lang==="ja"?"64状態はPhase 6 candidate targetを保持します。Phase 7履歴シミュレーション完了、本番採用はfalseです。":"64-State cells carry Phase 6 candidate targets. Phase 7 historical simulation is complete; production adoption is false.";
 renderOperationLog();
};
const applyLang=()=>{document.documentElement.lang=lang;document.querySelectorAll("[data-i18n]").forEach(x=>x.textContent=I18N[lang][x.dataset.i18n]||x.textContent);$("#language").value=lang;dynamic()};
$("#language").onchange=e=>{lang=e.target.value;try{localStorage.setItem("wadatsumi-lang",lang)}catch(err){}applyLang()};
$("#portfolioFile").onchange=async e=>{
 const file=e.target.files&&e.target.files[0];
 if(!file)return;
 try{
  const raw=JSON.parse(await file.text());
  portfolioSnapshot=PORT.normalize(raw);
  $("#portfolioImportStatus").textContent=lang==="ja"?"読取専用snapshotを読み込みました。生JSONは保存しません。":"Read-only snapshot loaded. Raw JSON is not stored.";
  renderPortfolioPanel();
 }catch(err){
  portfolioSnapshot=null;
  $("#portfolioImportStatus").textContent=(lang==="ja"?"snapshotを読み込めません: ":"Could not load snapshot: ")+err.message;
  renderPortfolioPanel();
 }
};
$("#recordDecision").onclick=()=>{
 if(!liveAllocationOutput||liveAllocationOutput===false||!liveAllocationOutput.targetAvailable){
  $("#operationStatus").textContent=lang==="ja"?"現在のcandidate targetがないため記録できません。":"No current candidate target to record.";
  return;
 }
 let gap=null;
 if(portfolioSnapshot)gap=PORT.compare(portfolioSnapshot,liveAllocationOutput.effectiveCryptoPct);
 try{
  const row=OLOG.append({
   dataAsOf:liveAllocationOutput.dataAsOf||liveAllocationOutput.decisionTime,
   stateId:liveAllocationOutput.stateId,stateCode:liveAllocationOutput.code,
   modelTargetCryptoPct:liveAllocationOutput.effectiveCryptoPct,modelTargetUsdcPct:liveAllocationOutput.effectiveUsdcPct,
   actualCryptoPct:gap?gap.portfolio.actualCryptoPct:null,actualUsdcPct:gap?gap.portfolio.actualUsdcPct:null,
   deltaCryptoPct:gap?gap.deltaCryptoPct:null,portfolioScope:gap?gap.portfolio.scope:null,
   rationale:liveAllocationOutput.rationale+" "+liveAllocationOutput.policyReason,
   nextChangeCondition:liveAllocationOutput.nextStateChangeCondition,
   userDecision:$("#userDecision").value,userNote:$("#userNote").value,
   versions:VERS
  });
  $("#userNote").value="";
  $("#operationStatus").textContent=(lang==="ja"?"ローカル運用ログへ保存: ":"Saved to local operation log: ")+row.loggedAt;
  renderOperationLog();
 }catch(err){
  $("#operationStatus").textContent=(lang==="ja"?"保存できません: ":"Could not save: ")+err.message;
 }
};
$("#exportLog").onclick=()=>{
 try{
  const payload=OLOG.exportPayload(),blob=new Blob([payload],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download="crypto-allocation-operation-log.json";a.click();URL.revokeObjectURL(url);
  $("#operationStatus").textContent=lang==="ja"?"ローカル運用ログを書き出しました。":"Exported local operation log.";
 }catch(err){
  $("#operationStatus").textContent=(lang==="ja"?"書き出せません: ":"Could not export: ")+err.message;
 }
};
renderPortfolioPanel();renderOperationLog();applyLang();
async function loadLiveChart(){
 const status=$("#chartStatus"),meta=$("#chartMeta"),svg=$("#ohlcChart"),overlay=$("#tfOverlay"),explain=$("#explanationPanel"),live64=$("#liveState64"),matrixLive=$("#matrixLiveStatus");
 try{
  const decisionTime=new Date().toISOString();
  const [oneHour,daily]=await Promise.all([window.WADATSUMI_COINBASE_PROVIDER.loadCompleted({symbol:"BTC-USD",timeframe:"1h",decisionTime}),window.WADATSUMI_COINBASE_PROVIDER.loadCompleted({symbol:"BTC-USD",timeframe:"1d",decisionTime})]);
  const fourHour=window.WADATSUMI_AGGREGATION.aggregate1hTo4h(oneHour,decisionTime);
  const weekly=window.WADATSUMI_AGGREGATION.aggregate1dTo1w(daily,decisionTime);
  const swingSnapshot=window.WADATSUMI_SWING_ENGINE.detect(fourHour,decisionTime,{radius:2});
  const structure=window.WADATSUMI_STRUCTURE_LABELS.build(swingSnapshot);
  const transitions=window.WADATSUMI_STRUCTURE_TRANSITIONS.build(fourHour,structure,decisionTime);
  const multi=window.WADATSUMI_MULTI_TIMEFRAME.build({weekly,daily,fourHour},decisionTime,{radius:2});
  const explanation=window.WADATSUMI_EXPLANATION_PANEL.build(multi);
  const state64=S64.fromMultiTimeframe(multi);
  const allocation=window.WADATSUMI_CURRENT_ALLOCATION_ENGINE.build({weekly,daily,fourHour,decisionTime,radius:2}).output;
  if(allocation.stateAvailable!==state64.available) throw new Error("current allocation/state64 availability mismatch");
  if(state64.available&&allocation.stateId!==state64.stateId) throw new Error("current allocation/state64 State ID mismatch");
  renderLiveAllocation(allocation);
  const candles=fourHour.candles.slice(-48);
  if(!candles.length) throw new Error("No completed 4h candles");
  const lo=Math.min(...candles.map(x=>x.low)),hi=Math.max(...candles.map(x=>x.high)),span=Math.max(hi-lo,1);
  const y=v=>285-(v-lo)/span*270, step=800/candles.length, body=Math.max(3,step*.55);
  const byOpen=new Map(candles.map((x,i)=>[x.openTime,i])),byClose=new Map(candles.map((x,i)=>[x.closeTime,i]));
  const candleMarkup=candles.map((x,i)=>{const cx=(i+.5)*step,o=y(x.open),cl=y(x.close),h=y(x.high),l=y(x.low),top=Math.min(o,cl),height=Math.max(1,Math.abs(cl-o)),dir=x.close>=x.open?"up":"down";return `<g class="candle ${dir}"><line x1="${cx}" y1="${h}" x2="${cx}" y2="${l}"></line><rect x="${cx-body/2}" y="${top}" width="${body}" height="${height}"></rect></g>`}).join("");
  const labelMarkup=structure.labels.filter(x=>byOpen.has(x.currentSwingOpenTime)).map(x=>{
   const i=byOpen.get(x.currentSwingOpenTime),cx=(i+.5)*step,high=x.swingType==="high";
   const cy=Math.max(12,Math.min(292,y(x.currentPrice)+(high?-10:14)));
   const trace=`${x.label}: ${x.previousPrice} → ${x.currentPrice}; swing ${x.currentSwingOpenTime}; confirmed ${x.currentSwingConfirmationTime}`;
   return `<g class="structure-mark ${high?"swing-high":"swing-low"}" data-label="${x.label}" data-swing-time="${x.currentSwingOpenTime}" data-confirmed-at="${x.currentSwingConfirmationTime}" data-previous-swing-time="${x.previousSwingOpenTime}"><circle cx="${cx}" cy="${y(x.currentPrice)}" r="3"></circle><text x="${cx}" y="${cy}" text-anchor="middle">${x.label}</text><title>${trace}</title></g>`;
  }).join("");
  const transitionMarkup=transitions.markers.map(m=>{
   const forming=m.type==="invalidation",i=forming?byOpen.get(m.candleOpenTime):byClose.get(m.availableAt);
   if(i==null)return "";
   const cx=(i+.5)*step,direction=m.direction==="U_TO_D"?"U→D":"D→U";
   if(forming){
    const cy=Math.max(18,Math.min(282,y(m.protected.level))),trace=`${direction} forming: close ${m.closePrice} crossed ${m.protected.kind} ${m.protected.level} at ${m.availableAt}`;
    return `<g class="transition-mark forming" data-status="forming" data-direction="${m.direction}" data-available-at="${m.availableAt}" data-level="${m.protected.level}"><line x1="${cx}" y1="15" x2="${cx}" y2="285"></line><circle cx="${cx}" cy="${cy}" r="4"></circle><text x="${cx}" y="${Math.max(13,cy-8)}" text-anchor="middle">${direction}?</text><title>${trace}</title></g>`;
   }
   const prices=[m.confirmingHigh&&m.confirmingHigh.price,m.confirmingLow&&m.confirmingLow.price].filter(Number.isFinite),price=prices.length?prices.reduce((a,b)=>a+b,0)/prices.length:(lo+hi)/2,cy=Math.max(18,Math.min(282,y(price))),trace=`${direction} confirmed at ${m.availableAt}; invalidated ${m.invalidatedAt}`;
   return `<g class="transition-mark confirmed" data-status="confirmed" data-direction="${m.direction}" data-available-at="${m.availableAt}" data-invalidated-at="${m.invalidatedAt}"><circle cx="${cx}" cy="${cy}" r="5"></circle><text x="${cx}" y="${Math.max(13,cy-9)}" text-anchor="middle">${direction}✓</text><title>${trace}</title></g>`;
  }).join("");
  svg.innerHTML=candleMarkup+labelMarkup+transitionMarkup;
  const fmtDirection=d=>d==="U_TO_D"?"U→D":"D→U";
  const tfRows=[["W",multi.weekly],["D",multi.daily],["4H",multi.fourHour]];
  overlay.innerHTML=tfRows.map(([name,s])=>{
   const state=s.confirmedState||"UNESTABLISHED",forming=s.formingTransition?(" · "+fmtDirection(s.formingTransition.direction)+" forming"):"";
   const hi=s.latestHigh?(s.latestHigh.label+" @ "+s.latestHigh.price):"—",loLabel=s.latestLow?(s.latestLow.label+" @ "+s.latestLow.price):"—";
   const trace=[s.latestHigh&&s.latestHigh.confirmedAt,s.latestLow&&s.latestLow.confirmedAt].filter(Boolean).sort().slice(-1)[0]||s.latestCompletedCandleCloseTime||"—";
   return `<div class="tf-overlay-row" data-timeframe="${s.timeframe}" data-state="${state}" data-latest-close="${s.latestCompletedCandleCloseTime||""}" data-evidence-at="${trace}"><b>${name}</b><span>${state}${forming}</span><small>${hi} · ${loLabel}</small></div>`;
  }).join("");
  const changeText=c=>!c?"—":c.kind==="transition"?((c.fromState||"?")+" → "+c.toState+" @ "+c.confirmedAt):("initial "+c.toState+" @ "+c.confirmedAt);
  explain.innerHTML=explanation.rows.map(r=>{
   const sequence=r.supportingSwingSequence.length?r.supportingSwingSequence.map(x=>`${x.label} @ ${x.price} [${x.confirmedAt}]`).join(" → "):"—";
   const forming=r.formingTransition?(`<div class="explain-forming">FORMING: ${r.formingTransition.direction} · invalidated ${r.formingTransition.invalidatedAt} · protected ${r.formingTransition.protectedLevel}</div>`):"";
   return `<article class="explain-card" data-timeframe="${r.timeframe}" data-state="${r.state}" data-as-of="${r.dataAsOf}" data-last-change-at="${r.lastConfirmedChange?r.lastConfirmedChange.confirmedAt:""}"><header><b>${r.name}</b><strong>${r.state}</strong></header><div><small>Supporting swings</small><p class="explain-sequence">${sequence}</p></div><div><small>Last confirmed change</small><p class="explain-change">${changeText(r.lastConfirmedChange)}</p></div><div><small>Data as of</small><p class="explain-asof">${r.dataAsOf}</p></div>${forming}</article>`;
  }).join("");
  document.querySelectorAll("#matrixGrid .cell").forEach(x=>x.classList.remove("live-current"));
  if(state64.available){
   const id=String(state64.stateId).padStart(2,"0");
   live64.dataset.available="true";live64.dataset.stateId=String(state64.stateId);live64.dataset.code=state64.code;
   const targetText=allocation.targetAvailable?`${allocation.effectiveCryptoPct}% CRYPTO / ${allocation.effectiveUsdcPct}% USDC`:"TARGET UNAVAILABLE";
   live64.innerHTML=`<b>State ${id}</b><span>${state64.code}</span><small>CANDIDATE ${targetText} · HISTORICAL SIM COMPLETE · NOT ADOPTED · NO EXECUTION</small>`;
   matrixLive.textContent=`Live structure: State ${id} — ${state64.code} — candidate ${targetText}; Phase 7 complete · production not adopted`;
   const cell=document.querySelector(`#matrixGrid .cell[data-state-id="${state64.stateId}"]`);if(cell)cell.classList.add("live-current");
  }else{
   live64.dataset.available="false";live64.removeAttribute("data-state-id");live64.removeAttribute("data-code");
   const held=allocation.targetAvailable?` · HOLD ${allocation.effectiveCryptoPct}% Crypto / ${allocation.effectiveUsdcPct}% USDC`:"";
   live64.innerHTML=`<b>64-State unavailable</b><span>${state64.reason}</span><small>FAIL-CLOSED${held} · HISTORICAL SIM COMPLETE · NOT ADOPTED · NO EXECUTION</small>`;
   matrixLive.textContent="Live structure State ID unavailable — incomplete causal W/D/4H evidence."+held;
  }
  status.textContent="BTC-USD 4h — completed candles only + W/D/4H causal structure overlays";
  meta.textContent=`4h: ${multi.fourHour.latestCompletedCandleCloseTime||"—"} · Daily: ${multi.daily.latestCompletedCandleCloseTime||"—"} · Weekly: ${multi.weekly.latestCompletedCandleCloseTime||"—"} · Source: Coinbase public GET + causal aggregation · Data as of: ${fourHour.asOf}`;
 }catch(err){
  svg.innerHTML="";
  overlay.innerHTML="";
  explain.innerHTML="";
  live64.dataset.available="false";live64.removeAttribute("data-state-id");live64.removeAttribute("data-code");
  live64.innerHTML="<b>64-State unavailable</b><span>live market/structure evidence unavailable</span><small>FAIL-CLOSED · NO ALLOCATION</small>";
  matrixLive.textContent="Live structure State ID unavailable — live data unavailable.";
  document.querySelectorAll("#matrixGrid .cell").forEach(x=>x.classList.remove("live-current"));
  status.textContent="Live BTC chart unavailable";
  meta.textContent="Read-only market data could not be loaded. No mock chart is substituted.";
  renderLiveUnavailable();
 }
}
loadLiveChart();
