// Chỉ SELECT D1/GET R2; chỉ lưu vị trí + hash URL, không lưu đề/đáp án/lời giải.
import{writeFileSync}from'node:fs';import{createHash}from'node:crypto';
const token=process.env.CLOUDFLARE_API_TOKEN?.trim(),account=process.env.CLOUDFLARE_ACCOUNT_ID?.trim();if(!token||!/^[a-f0-9]{32}$/i.test(account??''))throw Error('Thiếu cấu hình đọc');
const r=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/d2e6d322-374a-45d7-83a3-9fac486b23f1/query`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify({sql:'SELECT ma_de,r2_khoa FROM de_kho WHERE COALESCE(da_xoa,0)=0 ORDER BY ma_de'}),signal:AbortSignal.timeout(30000)});const j=await r.json();if(!r.ok||!j.success)throw Error('Không đọc được danh mục D1');const exams=j.result.flatMap(x=>x.results??[]);const refs=[],errors=[];
function scan(v,where,position=null,top=null){
 if(typeof v==='string'){
  const urls=/^data:image|^(?:https:\/\/omr\.ttadodaihoc\.workers\.dev)?\/anh\//.test(v)?[v]:[...v.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)].map(x=>x[1]);
  for(const src of urls){const publicPosition=position!==null?/^(sau_de|cuoi_cau|sau_pa_[A-D]|sau_y_[a-d])$/.test(position):['de','text','stem','pa','y','options','statements','thanCauImg','imageDataUrl'].includes(top);refs.push({where,hashDataUrl:createHash('sha256').update(src).digest('hex'),viTri:position,truong:top,congKhaiTruocNop:publicPosition});}
 }else if(Array.isArray(v)){v.forEach((x,i)=>scan(x,where+'.'+i,position,top));}
 else if(v&&typeof v==='object'){
  const pos=typeof(v.vi_tri??v.viTri)==='string'?String(v.vi_tri??v.viTri):position;
  for(const[k,x]of Object.entries(v)){if(/^(correct|dap.?an|loi.?giai|answer|solution|dung|vi_sao)/i.test(k))continue;scan(x,where+'.'+k,pos,top??k);}
 }
}
for(let i=0;i<exams.length;i+=4){await Promise.all(exams.slice(i,i+4).map(async e=>{try{const k=e.r2_khoa||`kho/${e.ma_de}.json`;const r=await fetch('http://127.0.0.1:8788/?key='+encodeURIComponent(k),{signal:AbortSignal.timeout(45000)});if(!r.ok)throw Error('R2 HTTP'+r.status);const g=await r.json();const list=Array.isArray(g.cau)?g.cau:['I','II','III'].flatMap(p=>(g['phan'+p]??[]).map(c=>({...c,phan:p})));for(let n=0;n<list.length;n++){const c=list[n],qid=String(c.qid??c.id??`${e.ma_de}-${c.phan}-${c.so??n+1}`);const pub=Object.fromEntries(['de','text','stem','pa','y','options','statements','hinh','hinhAnh','thanCauImg','imageDataUrl','table','bang'].filter(k=>c[k]!=null).map(k=>[k,c[k]]));scan(pub,qid);}}catch(e2){errors.push({maDe:e.ma_de,lyDo:e2.message});}}));}
const out={luc:new Date().toISOString(),chiDoc:true,soDe:exams.length,soThamChieu:refs.length,congKhai:refs.filter(r=>r.congKhaiTruocNop).length,khongCongKhaiHoacChuaRo:refs.filter(r=>!r.congKhaiTruocNop).length,errors,refs};writeFileSync('/tmp/vi-tri-cong-khai.json',JSON.stringify(out,null,2));console.log(JSON.stringify({soDe:out.soDe,soThamChieu:out.soThamChieu,congKhai:out.congKhai,khongCongKhaiHoacChuaRo:out.khongCongKhaiHoacChuaRo,soLoi:errors.length}));if(errors.length)process.exitCode=1;
