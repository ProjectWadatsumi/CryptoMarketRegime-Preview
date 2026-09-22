(function(global){
"use strict";
const SCHEMA_VERSION="operation-log.v1";
const STORAGE_KEY="wadatsumi.crypto.operation-log.v1";

function cleanText(v,max=500){
  const s=String(v==null?"":v).trim();
  return s.length>max?s.slice(0,max):s;
}
function finiteOrNull(v){
  if(v==null||v==="") return null;
  const n=Number(v);
  return Number.isFinite(n)?n:null;
}
function normalizeEntry(raw){
  if(!raw||typeof raw!=="object") throw new TypeError("operation log entry must be object");
  const versions=raw.versions&&typeof raw.versions==="object"?raw.versions:{};
  return Object.freeze({
    id:cleanText(raw.id,120)||null,
    loggedAt:cleanText(raw.loggedAt,80)||new Date().toISOString(),
    dataAsOf:cleanText(raw.dataAsOf,120)||null,
    stateId:Number.isInteger(Number(raw.stateId))?Number(raw.stateId):null,
    stateCode:cleanText(raw.stateCode,120)||null,
    modelTargetCryptoPct:finiteOrNull(raw.modelTargetCryptoPct),
    modelTargetUsdcPct:finiteOrNull(raw.modelTargetUsdcPct),
    actualCryptoPct:finiteOrNull(raw.actualCryptoPct),
    actualUsdcPct:finiteOrNull(raw.actualUsdcPct),
    deltaCryptoPct:finiteOrNull(raw.deltaCryptoPct),
    portfolioScope:cleanText(raw.portfolioScope,160)||null,
    rationale:cleanText(raw.rationale,1000),
    nextChangeCondition:cleanText(raw.nextChangeCondition,1000),
    userDecision:cleanText(raw.userDecision,80)||"observe_only",
    userNote:cleanText(raw.userNote,500),
    versions:Object.freeze({
      app:cleanText(versions.app,120)||"unknown",
      stateEngine:cleanText(versions.stateEngine,120)||"unknown",
      allocationPolicy:cleanText(versions.allocationPolicy,120)||"unknown",
      currentAllocation:cleanText(versions.currentAllocation,120)||"unknown",
      portfolioAdapter:cleanText(versions.portfolioAdapter,120)||"unknown"
    }),
    executionPerformedByApp:false
  });
}
function memoryId(){
  if(global.crypto&&typeof global.crypto.randomUUID==="function") return global.crypto.randomUUID();
  return "local-"+Date.now()+"-"+Math.random().toString(36).slice(2);
}
function load(storage){
  const s=storage||global.localStorage;
  if(!s) return [];
  const raw=s.getItem(STORAGE_KEY);
  if(!raw) return [];
  const parsed=JSON.parse(raw);
  if(!Array.isArray(parsed)) throw new TypeError("stored operation log is not an array");
  return parsed.map(normalizeEntry);
}
function append(raw,storage){
  const s=storage||global.localStorage;
  if(!s) throw new Error("local storage unavailable");
  const entry=normalizeEntry({...raw,id:raw.id||memoryId(),loggedAt:raw.loggedAt||new Date().toISOString()});
  const rows=load(s);
  rows.push(entry);
  s.setItem(STORAGE_KEY,JSON.stringify(rows));
  return entry;
}
function exportPayload(storage){
  const entries=load(storage);
  return JSON.stringify({
    schemaVersion:SCHEMA_VERSION,
    exportedAt:new Date().toISOString(),
    entries,
    externalWritePerformed:false,
    executionAuthority:false
  },null,2);
}
function versionSummary(storage){
  const counts={};
  for(const row of load(storage)){
    const key=[row.versions.app,row.versions.allocationPolicy,row.versions.currentAllocation].join(" | ");
    counts[key]=(counts[key]||0)+1;
  }
  return Object.freeze(Object.entries(counts).map(([version,count])=>Object.freeze({version,count})));
}
global.WADATSUMI_OPERATION_LOG=Object.freeze({SCHEMA_VERSION,STORAGE_KEY,normalizeEntry,load,append,exportPayload,versionSummary});
})(typeof window!=="undefined"?window:globalThis);
