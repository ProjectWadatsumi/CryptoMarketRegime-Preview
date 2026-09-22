(function(global){
"use strict";
const VERSION="portfolio-readonly.v0.1";

function num(value,field){
  const n=Number(String(value).replace(/,/g,""));
  if(!Number.isFinite(n)) throw new TypeError(field+" must be finite");
  return n;
}
function positiveOrZero(value,field){
  const n=num(value,field);
  if(n<0) throw new RangeError(field+" must be >= 0");
  return n;
}
function isoOrText(value){
  if(value==null||value==="") return null;
  const d=new Date(value);
  return Number.isNaN(d.getTime())?String(value):d.toISOString();
}
function normalizeGeneric(raw){
  const cryptoUsd=positiveOrZero(raw.cryptoUsd,"cryptoUsd");
  const usdcUsd=positiveOrZero(raw.usdcUsd,"usdcUsd");
  const totalUsd=cryptoUsd+usdcUsd;
  if(totalUsd<=0) throw new RangeError("portfolio total must be positive");
  if(raw.totalUsd!=null){
    const claimed=positiveOrZero(raw.totalUsd,"totalUsd");
    const tol=Math.max(0.01,totalUsd*1e-8);
    if(Math.abs(claimed-totalUsd)>tol) throw new RangeError("generic totalUsd does not reconcile");
  }
  return Object.freeze({
    schemaVersion:VERSION,
    sourceType:"generic-local-snapshot",
    source:String(raw.source||"local snapshot"),
    scope:String(raw.scope||"unspecified portfolio scope"),
    scopeCompleteness:String(raw.scopeCompleteness||"scope not independently verified"),
    asOf:isoOrText(raw.asOf),
    cryptoUsd,usdcUsd,totalUsd,
    actualCryptoPct:cryptoUsd/totalUsd*100,
    actualUsdcPct:usdcUsd/totalUsd*100,
    reconciliationStatus:String(raw.reconciliationStatus||"user-supplied local snapshot"),
    rawImported:false
  });
}
function normalizeA1(raw){
  const c=raw&&raw.candidate,values=c&&c.values;
  if(!values||typeof values!=="object") throw new TypeError("A1 candidate.values missing");
  const lp=positiveOrZero(values["LP評価額（手数料込）（$）"],"LP value");
  const cbbtc=positiveOrZero(values["cbBTC価値（$）"],"cbBTC value");
  const weth=positiveOrZero(values["WETH価値（$）"],"WETH value");
  const usdc=positiveOrZero(values["USDC価値（$）"],"USDC value");
  const claimed=positiveOrZero(values["A1全体資産（$）"],"A1 total");
  const cryptoUsd=lp+cbbtc+weth,totalUsd=cryptoUsd+usdc;
  const tol=Math.max(0.02,totalUsd*1e-8);
  if(Math.abs(claimed-totalUsd)>tol) throw new RangeError("A1 overall-assets values do not reconcile");
  return Object.freeze({
    schemaVersion:VERSION,
    sourceType:"uniswap-a1-overall-assets",
    source:"ProjectWadatsumi/UniSwap · A1 overall-assets read-only snapshot",
    scope:"A1 assets only",
    scopeCompleteness:"complete within A1 snapshot; not asserted as total crypto portfolio",
    asOf:isoOrText(raw.source&&raw.source.base_timestamp_jst)||String(values["JST日付"]||""),
    cryptoUsd,usdcUsd:usdc,totalUsd,
    actualCryptoPct:cryptoUsd/totalUsd*100,
    actualUsdcPct:usdc/totalUsd*100,
    reconciliationStatus:String(values["照合状態"]||raw.status||"read-only snapshot"),
    rawImported:false
  });
}
function normalize(input){
  const raw=typeof input==="string"?JSON.parse(input):input;
  if(!raw||typeof raw!=="object") throw new TypeError("portfolio snapshot must be an object");
  if(raw.candidate&&raw.candidate.values) return normalizeA1(raw);
  if(raw.cryptoUsd!=null&&raw.usdcUsd!=null) return normalizeGeneric(raw);
  throw new TypeError("unsupported portfolio snapshot schema");
}
function compare(snapshot,targetCryptoPct){
  const s=normalize(snapshot),target=num(targetCryptoPct,"targetCryptoPct");
  if(target<0||target>100) throw new RangeError("targetCryptoPct must be 0..100");
  const delta=target-s.actualCryptoPct;
  return Object.freeze({
    schemaVersion:"portfolio-gap.v0.1",
    portfolio:s,
    targetCryptoPct:target,
    targetUsdcPct:100-target,
    deltaCryptoPct:delta,
    deltaUsdcPct:-delta,
    direction:Math.abs(delta)<1e-9?"aligned":delta>0?"increase-crypto":"decrease-crypto",
    executionAuthorized:false
  });
}
global.WADATSUMI_PORTFOLIO_READONLY=Object.freeze({VERSION,normalize,compare});
})(typeof window!=="undefined"?window:globalThis);
