// Đo riêng bước tô pixel bi: CPU Chromium chậm 6 lần, năm lượt xen kẽ, lấy trung vị.
// Chạy Vite trang preview cục bộ trước; dữ liệu giả. node scripts/do-bi-a-trang-suc.mjs <origin> <kq.json>
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const b=await chromium.launch({executablePath:process.env.PW_CHROMIUM || '/usr/bin/chromium',args:['--no-sandbox']});
try{const p=await b.newPage();await p.goto(`${process.argv[2] || 'http://127.0.0.1:5183'}/scripts/preview-bat-linh/games.html?game=shop&tre=0`);const c=await p.context().newCDPSession(p);await c.send('Emulation.setCPUThrottlingRate',{rate:6});
 const r=await p.evaluate(async()=>{
  const moi=await import('/src/game/bi-a/ve-bi.ts'),cu=await import('/scripts/preview-bat-linh/ve-bi-baseline.ts');const rows=[];
  const chu={to:Uint8Array.from({length:4096},(_,i)=>i%256),vien:Uint8Array.from({length:4096},(_,i)=>(i*13)%256)};
  const qs=Array.from({length:64},(_,i)=>moi.huongKhoiTao('bench'+i));
  for(const n of [20,32,48])for(const k of ['ta','dich','chot','cai']){
   const B=moi.taoBong(n),d=new Uint8ClampedArray(n*n*4);const mask=k==='cai'?null:chu;
   const run=fn=>{const t=performance.now();for(let i=0;i<3000;i++)fn(B,k,mask,qs[i%64],false,d);return performance.now()-t};run(cu.toBiLan);run(moi.toBiLan);
   const old=[],neu=[];for(let t=0;t<5;t++){if(t%2){neu.push(run(moi.toBiLan));old.push(run(cu.toBiLan))}else{old.push(run(cu.toBiLan));neu.push(run(moi.toBiLan))}}
   old.sort((a,b)=>a-b);neu.sort((a,b)=>a-b);rows.push({n,k,beforeMs:old[2],afterMs:neu[2],speedup:old[2]/neu[2]});
  }return rows;
 });writeFileSync(process.argv[3] || '/tmp/luxury-shader-benchmark.json',JSON.stringify(r,null,2));console.log(JSON.stringify(r));
}finally{await b.close()}
