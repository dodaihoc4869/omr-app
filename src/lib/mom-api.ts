import {layDiaChiMayChu} from './dia-chi-may-chu'
import {chuanHoaLoiGiaiCau, taoHtmlKhungLoiGiaiGoogle} from './chuan-hoa-loi-giai'
const saves = new Map<string, Promise<any>>()
export function momApi(action:string,body:Record<string,unknown>):Promise<any>{
  if (action !== 'save' && action !== 'submit') return requestMom(action,body)
  const key = `${body.token}:${body.id}`
  const prior = saves.get(key) || Promise.resolve()
  const next = prior.catch(() => {}).then(() => requestMom(action,body))
  saves.set(key,next)
  void next.finally(() => { if (saves.get(key) === next) saves.delete(key) }).catch(() => {})
  return next
}
export function studentNewsApi(action:'list'|'assign',token:string){return requestMom(action,{token},'/student-news')}
export function parentNewsApi(action:'list'|'assign',sbd:string){return requestMom(action,{sbd},'/parent-news')}
async function requestMom(action:string,body:Record<string,unknown>,prefix='/mom'):Promise<any>{
  if (prefix === '/mom' && !action.startsWith('parent-') && action !== 'create' && !body.token) throw new Error('Em đăng xuất rồi đăng nhập lại để nhận bài từ Mom.')
  const url=await layDiaChiMayChu()
  if(!url)throw new Error('Chưa kết nối được máy chủ. Vui lòng thử lại.')
  const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),25000)
  try{
    const r=await fetch(`${url}${prefix}/${action}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),signal:controller.signal})
    const data=await r.json()
    if(!r.ok||!data.ok)throw new Error(data.error||data.loi||'Chưa đồng bộ được bài. Vui lòng thử lại.')
    return data
  }finally{clearTimeout(timer)}
}
// Kho cũ chỉ nằm trên điện thoại. Giữ nguyên bản gốc và đánh dấu từng bài sau ACK.
export async function migrateMom(sbd:string){
  let old:any[]=[]
  try{const data=JSON.parse(localStorage.getItem(`omr_mom_btvn_${sbd}`)||'[]');if(Array.isArray(data))old=data}catch{return}
  for(const b of old){
    const marker=`omr_mom_sent_${sbd}_${b.id}`
    if(localStorage.getItem(marker))continue
    const dsCau=b.dsCau||b.cau
    if(!Array.isArray(dsCau)||!dsCau.length)continue
    // Kết quả cũ vẫn giữ trong máy; chỉ chuyển bài chưa nộp, không bắt con làm lại bài hoàn thành.
    if(b.trangThai==='da_nop')continue
    await momApi('create',{sbd,id:b.id,tieuDe:b.tieuDe,taoLuc:b.taoLuc||b.ngayGiao,dsCau})
    try{localStorage.setItem(marker,'1')}catch{/* Máy đầy: retry có cùng ID nên không tạo trùng. */}
  }
}

/** Báo cáo dựng từ nội dung và điểm đã lưu trên máy chủ, không nhận HTML tùy ý. */
export function momReviewHtml(b:any):string {
  const escape=(s:unknown)=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
  const plain=(s:unknown)=>{
    try {
      const doc=new DOMParser().parseFromString(String(s??''),'text/html')
      return doc.body.textContent||''
    } catch {
      return String(s??'')
    }
  }
  return `<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kết quả bài của Mom</title><style>
body{font:16px/1.7 system-ui,-apple-system,BlinkMacSystemFont,sans-serif;background:#f8fafc;color:#172033;max-width:900px;margin:auto;padding:24px}
article{background:white;padding:24px;border:1px solid #e2e8f0;border-radius:20px;margin:20px 0;box-shadow:0 1px 3px rgba(0,0,0,0.05)}
p{white-space:pre-wrap;margin:10px 0}
h1{font-size:24px;margin-bottom:8px}
h2{font-size:18px;margin-top:0;color:#1e293b}
.score{font-size:36px;font-weight:900;color:#059669;margin:8px 0}
.summary{color:#64748b;font-size:15px;margin-bottom:24px}
.ans-box{background:#f1f5f9;padding:12px 16px;border-radius:12px;margin:12px 0}
</style>
<h1>${escape(b.tieuDe)}</h1>
<div class="score">${escape(b.diem ?? 0)}/10</div>
<div class="summary">Đúng ${escape(b.soCauDung ?? 0)}/${escape(b.soCau ?? 0)} câu</div>
${(b.dsCau||[]).map((c:any,i:number)=>{
  const lgChuan = chuanHoaLoiGiaiCau(c.loiGiai, c.phan || 'I', c.dapAn || c.dapAnDung)
  const khungLg = taoHtmlKhungLoiGiaiGoogle(lgChuan)
  const daChon = b.dapAnDaNop?.[c.id] || 'Chưa trả lời'
  const dung = c.dapAn || c.dapAnDung || ''
  return `<article>
    <h2>Câu ${i+1}</h2>
    <p>${escape(plain(c.text||c.noiDung))}</p>
    ${(c.choices||c.luaChon||[]).map((v:unknown,k:number)=>`<p><b>${String.fromCharCode(65+k)}.</b> ${escape(plain(v))}</p>`).join('')}
    <div class="ans-box">
      Em trả lời: <b>${escape(daChon)}</b><br>
      Đáp án đúng: <b>${escape(dung)}</b>
    </div>
    ${khungLg}
  </article>`
}).join('')}
</html>`
}
