const d=window.MOCK;const $=s=>document.querySelector(s);$("#asof").textContent=d.asOf;$("#stateId").textContent="State "+String(d.stateId).padStart(2,"0");$("#stateTuple").textContent=d.states.weekly+" / "+d.states.daily+" / "+d.states["4h"];$("#crypto").textContent=d.target.crypto;$("#usdc").textContent=d.target.usdc;$("#actual").textContent=d.actual.crypto+"% Crypto / "+d.actual.usdc+"% USDC";$("#delta").textContent="Demo delta: "+(d.target.crypto-d.actual.crypto)+" pp Crypto";$("#reason").textContent=d.reason;$("#trigger").textContent=d.trigger;$("#tf").innerHTML=Object.entries(d.states).map(([k,v])=>`<div><small>${k.toUpperCase()}</small><b>${v.replace("_","→")}</b></div>`).join("");document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>{document.querySelectorAll("nav button,.screen").forEach(x=>x.classList.remove("active"));b.classList.add("active");$("#"+b.dataset.screen).classList.add("active")});const S64=window.WADATSUMI_STATE64,matrixCases=S64.enumerate(),mg=$("#matrixGrid");for(const row of matrixCases){const c=document.createElement("button");c.className="cell";c.textContent=String(row.stateId).padStart(2,"0");c.dataset.stateId=String(row.stateId);c.dataset.code=row.code;c.title=row.code;c.onclick=()=>$("#stateDetail").textContent=`State ${String(row.stateId).padStart(2,"0")} — ${row.code} — structure taxonomy only; no allocation percentage assigned.`;mg.appendChild(c)}$("#stateDetail").textContent="Canonical 64-state inventory. Live causal structure will highlight one state when W/D/4H are all established.";const pct=p=>{if(!p.tasks.length)return 0;return Math.round(100*p.tasks.filter(t=>t.done).length/p.tasks.length)};$("#phases").innerHTML=d.progress.map(p=>`<details class="progress-detail" ${p.phase<2?"open":""}><summary><b>Phase ${p.phase}</b><span>${p.name}</span><span class="status">${p.status}</span><span>${pct(p)}%</span></summary><div class="bar"><i style="width:${pct(p)}%"></i></div><div class="tasks">${p.tasks.length?p.tasks.map(t=>`<details><summary>${t.done?"✓":"○"} ${t.name}</summary><ul>${t.tests.map(x=>`<li>TEST — ${x}</li>`).join("")}</ul></details>`).join(""):"<p>Tasks will be decomposed when this phase starts.</p>"}</div></details>`).join("");const I18N={ja:{banner:"プロトタイプ / モックデータ — ライブの配分シグナルではありません",title:"暗号資産 配分コンソール",language:"言語",asof:"データ時点",navDashboard:"ダッシュボード",navChart:"チャート",navMatrix:"64状態",navProgress:"進捗",currentState:"現在の状態",target:"目標配分",actualTarget:"現在 → 目標",why:"理由",nextChange:"次の変更条件",safety:"安全境界",crypto:"暗号資産",boundaryText:"閲覧専用の意思決定支援です。ウォレット署名、承認、スワップ、流動性操作、送金は行いません。",chartTitle:"BTC 構造チャート",chartLegend:"Swing・HH/HL/LH/LL・無効化/転換マーカーはPhase 2で因果的な構造データへ接続します。",matrixTitle:"64状態マトリクス",buildProgress:"開発進捗",progressNote:"GitHub Issuesが正本です。このプロトタイプはモックスナップショットを使用し、GitHubの読み取り専用接続は後のPhaseで実装します。"},en:{banner:"PROTOTYPE / MOCK DATA — NOT A LIVE ALLOCATION SIGNAL",title:"Crypto Allocation Console",language:"Language",asof:"Data as of",navDashboard:"Dashboard",navChart:"Chart",navMatrix:"64-State",navProgress:"Progress",currentState:"CURRENT STATE",target:"TARGET",actualTarget:"Actual → Target",why:"Why",nextChange:"Next change",safety:"Safety boundary",crypto:"Crypto",boundaryText:"Read-only decision support. No wallet signing, approvals, swaps, liquidity actions or transfers.",chartTitle:"BTC Structure Chart",chartLegend:"Swing · HH/HL/LH/LL · invalidation/transition markers will be wired to causal structure data in Phase 2.",matrixTitle:"64-State Matrix",buildProgress:"Build Progress",progressNote:"GitHub Issues are the source of truth. This prototype uses a mock snapshot; read-only GitHub wiring comes later."}};
let lang="ja";try{lang=localStorage.getItem("wadatsumi-lang")||"ja"}catch(e){}
const dynamic=()=>{$("#actual").textContent=lang==="ja"?d.actual.crypto+"% 暗号資産 / "+d.actual.usdc+"% USDC":d.actual.crypto+"% Crypto / "+d.actual.usdc+"% USDC";$("#delta").textContent=lang==="ja"?"デモ差分: "+(d.target.crypto-d.actual.crypto)+"ポイント 暗号資産":"Demo delta: "+(d.target.crypto-d.actual.crypto)+" pp Crypto";$("#reason").textContent=lang==="ja"?"デモのみ：週足構造はUを維持していますが、下位時間足は転換状態を示しています。":d.reason;$("#trigger").textContent=lang==="ja"?"デモのみ：確定した時間足の因果的な構造状態が変化したとき、配分を再計算する想定です。":d.trigger;$("#stateDetail").textContent=lang==="ja"?"64状態IDは構造分類のみです。Phase 3では配分比率を付与しません。":"64-State IDs classify structure only. Phase 3 assigns no allocation percentage."};
const applyLang=()=>{document.documentElement.lang=lang;document.querySelectorAll("[data-i18n]").forEach(x=>x.textContent=I18N[lang][x.dataset.i18n]||x.textContent);$("#language").value=lang;dynamic()};
$("#language").onchange=e=>{lang=e.target.value;try{localStorage.setItem("wadatsumi-lang",lang)}catch(err){}applyLang()};applyLang();
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
   live64.innerHTML=`<b>State ${id}</b><span>${state64.code}</span><small>LIVE CAUSAL STRUCTURE · NO ALLOCATION</small>`;
   matrixLive.textContent=`Live structure: State ${id} — ${state64.code} — no allocation assigned`;
   const cell=document.querySelector(`#matrixGrid .cell[data-state-id="${state64.stateId}"]`);if(cell)cell.classList.add("live-current");
  }else{
   live64.dataset.available="false";live64.removeAttribute("data-state-id");live64.removeAttribute("data-code");
   live64.innerHTML=`<b>64-State unavailable</b><span>${state64.reason}</span><small>FAIL-CLOSED · NO ALLOCATION</small>`;
   matrixLive.textContent="Live structure State ID unavailable — incomplete causal W/D/4H evidence.";
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
 }
}
loadLiveChart();
