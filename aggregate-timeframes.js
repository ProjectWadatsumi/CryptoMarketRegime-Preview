/* Phase 2 — causal aggregation of completed source candles. */
(function(global){"use strict";
 const MD=global.WADATSUMI_MARKET_DATA;
 if(!MD) throw new Error("WADATSUMI_MARKET_DATA is required");
 const HOUR=60*60*1000, DAY=24*HOUR, WEEK=7*DAY;
 function aggregate1hTo4h(series,decisionTime){
   const src=MD.completedOnly(series,decisionTime);
   if(src.timeframe!=="1h") throw new RangeError("1h source series is required");
   const groups=new Map();
   for(const c of src.candles){
     const t=Date.parse(c.openTime), bucket=Math.floor(t/(4*HOUR))*(4*HOUR);
     const key=new Date(bucket).toISOString();
     if(!groups.has(key)) groups.set(key,[]);
     groups.get(key).push(c);
   }
   const candles=[];
   for(const [openTime,items] of [...groups.entries()].sort()){
     items.sort((a,b)=>Date.parse(a.openTime)-Date.parse(b.openTime));
     const bucketStart=Date.parse(openTime), expected=[0,1,2,3].map(i=>bucketStart+i*HOUR);
     if(items.length!==4 || items.some((c,i)=>Date.parse(c.openTime)!==expected[i])) continue;
     const closeTime=new Date(bucketStart+4*HOUR).toISOString();
     if(Date.parse(closeTime)>Date.parse(decisionTime)) continue;
     candles.push({openTime,closeTime,open:items[0].open,high:Math.max(...items.map(x=>x.high)),low:Math.min(...items.map(x=>x.low)),close:items[3].close,volume:items.every(x=>x.volume!=null)?items.reduce((s,x)=>s+x.volume,0):null});
   }
   return MD.normalizeSeries({source:src.source+"|causal-1h-to-4h",symbol:src.symbol,timeframe:"4h",asOf:src.asOf,candles});
 }
 function mondayUtcStart(ms){
   const d=new Date(ms),day=d.getUTCDay(),daysSinceMonday=(day+6)%7;
   return Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()-daysSinceMonday);
 }
 function aggregate1dTo1w(series,decisionTime){
   const src=MD.completedOnly(series,decisionTime);
   if(src.timeframe!=="1d") throw new RangeError("1d source series is required");
   const groups=new Map();
   for(const c of src.candles){
     const t=Date.parse(c.openTime),bucket=mondayUtcStart(t),key=new Date(bucket).toISOString();
     if(!groups.has(key)) groups.set(key,[]);
     groups.get(key).push(c);
   }
   const candles=[];
   for(const [openTime,items] of [...groups.entries()].sort()){
     items.sort((a,b)=>Date.parse(a.openTime)-Date.parse(b.openTime));
     const bucketStart=Date.parse(openTime),expected=[0,1,2,3,4,5,6].map(i=>bucketStart+i*DAY);
     if(items.length!==7 || items.some((c,i)=>Date.parse(c.openTime)!==expected[i])) continue;
     const closeTime=new Date(bucketStart+WEEK).toISOString();
     if(Date.parse(closeTime)>Date.parse(decisionTime)) continue;
     candles.push({openTime,closeTime,open:items[0].open,high:Math.max(...items.map(x=>x.high)),low:Math.min(...items.map(x=>x.low)),close:items[6].close,volume:items.every(x=>x.volume!=null)?items.reduce((s,x)=>s+x.volume,0):null});
   }
   return MD.normalizeSeries({source:src.source+"|causal-1d-to-1w",symbol:src.symbol,timeframe:"1w",asOf:src.asOf,candles});
 }
 global.WADATSUMI_AGGREGATION=Object.freeze({aggregate1hTo4h,aggregate1dTo1w,mondayUtcStart});
})(typeof window!=="undefined"?window:globalThis);
