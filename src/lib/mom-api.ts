import {layDiaChiMayChu} from './dia-chi-may-chu'
import {chuanHoaLoiGiaiCau} from './chuan-hoa-loi-giai'
import {dungPhieu, type ThongTinPhieu} from './html-phieu'
import type {CauLuyen} from './bai-tap-pdf'
const saves = new Map<string, Promise<any>>()
// TOKEN PHỤ HUYNH (giai đoạn mềm, docs/token-phu-huynh-1909.md): có pass thì các lệnh phụ huynh gửi `{pass}` THAY `{sbd}` (máy chủ lấy danh tính từ token).
// Chỉ bốn đường máy chủ đã nhận pass: /parent-news/*, /mom/parent-list, /mom/create. Không có pass ⇒ như cũ (SBD trần).
let passPhuHuynh = ''
export function datPassPhuHuynh(pass: string): void {
  passPhuHuynh = pass.trim()
}
export function goiPhuHuynhCoPass(action: string, prefix: string): boolean {
  return !!passPhuHuynh && (prefix === '/parent-news' || (prefix === '/mom' && (action === 'parent-list' || action === 'create')))
}
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
  if (prefix === '/mom' && !action.startsWith('parent-') && action !== 'create' && !body.token) throw new Error('Em đăng xuất rồi đăng nhập lại để nhận bài gia đình giao.')
  if(goiPhuHuynhCoPass(action,prefix)){const {sbd:_boSbd,...con}=body;void _boSbd;body={...con,pass:passPhuHuynh}}
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

export function chuanHoaBaiMom(b: any): any {
  const rawCau = Array.isArray(b?.dsCau) ? b.dsCau : (Array.isArray(b?.cau) ? b.cau : [])
  const dsCau = rawCau.map((c: any, i: number) => ({
    ...c,
    phan: c?.phan || (/^[DS]{4}$/i.test(String(c?.dapAn || c?.dapAnDung)) ? 'II' : undefined),
    id: String(c?.id || `cau_${i + 1}`),
    text: String(c?.text || c?.noiDung || 'Câu hỏi'),
    choices: Array.isArray(c?.choices)
      ? c.choices.map(String)
      : (Array.isArray(c?.luaChon) ? c.luaChon.map(String) : (Array.isArray(c?.ideas) ? c.ideas.map(String) : [])),
    dapAn: String(c?.dapAn || c?.dapAnDung || 'A'),
    dapAnDung: String(c?.dapAnDung || c?.dapAn || 'A'),
    loiGiai: c?.loiGiai != null && String(c.loiGiai) !== '[object Object]' ? c.loiGiai : '',
    chuyenDe: String(c?.chuyenDe || 'Hoá học'),
  }))

  const id = String(b?.id || `mom_${Date.now()}`)
  const tieuDe = String(b?.tieuDe || `Bài gia đình giao (${dsCau.length} câu)`)
  const ngayGiao = String(b?.ngayGiao || b?.taoLuc || new Date().toISOString())
  const taoLuc = String(b?.taoLuc || b?.ngayGiao || new Date().toISOString())
  const soCau = Number(b?.soCau) || dsCau.length
  const thoiGianPhut = Number(b?.thoiGianPhut) || 120
  const trangThai = b?.trangThai || 'chua_lam'
  const htmlKetQua = b?.htmlKetQua || b?.htmlBaoCao || ''

  return {
    dapAnDaNop: b?.dapAnDaNop,
    ...b,
    id,
    tieuDe,
    ngayGiao,
    taoLuc,
    soCau,
    thoiGianPhut,
    dsCau,
    cau: dsCau,
    trangThai,
    htmlKetQua,
    htmlBaoCao: htmlKetQua,
  }
}

/** Báo cáo dựng từ nội dung và điểm đã lưu trên máy chủ, đồng điệu với tất cả các phiếu HTML trong app. */
export function momReviewHtml(b: any): string {
  const dsCauRaw = Array.isArray(b.dsCau) ? b.dsCau : (Array.isArray(b.cau) ? b.cau : [])
  const dapAnDaNop = b.dapAnDaNop || b.answers || {}

  const cauLuyen: CauLuyen[] = dsCauRaw.map((c: any, i: number) => {
    const daChon = dapAnDaNop[c.id] || ''
    const dung = String(c.dapAn || c.dapAnDung || '').trim()
    const lg = chuanHoaLoiGiaiCau(c.loiGiai, c.phan || 'I', dung)
    const phan = (c.phan as 'I' | 'II' | 'III') || (/^[DS]{4}$/i.test(dung) ? 'II' : (c.choices?.length || c.luaChon?.length ? 'I' : 'III'))

    return {
      id: c.id || `cau_${i + 1}`,
      phan,
      maDe: c.maDe || 'MOM',
      chuyenDe: c.chuyenDe || 'Hoá học',
      dang: 'chua_ro',
      sao: 1,
      mucDo: c.mucDo || '',
      text: c.text || c.noiDung || '',
      luaChon: c.choices || c.luaChon || null,
      dapAn: dung,
      chot: lg.chot,
      lyDo: lg.lyDo,
      buoc: lg.buoc,
      ketQua: lg.ketQua,
      anhThanCau: c.anhThanCau || c.thanCauImg,
      anhLuaChon: c.anhLuaChon,
      chuaCho: {
        qid: c.id,
        soCau: i + 1,
        phan,
        maDang: '',
        bac: 1,
        laDeCuaEm: true,
        daChon,
        dapAnDung: dung,
      },
    }
  })

  const thongTin: ThongTinPhieu = {
    hoTen: b.sbd ? `SBD: ${b.sbd}` : '',
    sbd: b.sbd || '',
    ngay: new Date(b.nopLuc || b.taoLuc || Date.now()),
    tenChuyenDe: b.tieuDe || 'Bài luyện gia đình giao',
    ketQua: `${b.diem ?? 0} điểm · Đúng ${b.soCauDung ?? 0}/${b.soCau ?? cauLuyen.length} câu`,
    hienDapAn: true,
    giaoDienHocSinh: true,
    nhanBia: 'BÀI GIA ĐÌNH GIAO',
    oBia: [
      { nhan: 'Điểm số', gia: `${b.diem ?? 0}/10` },
      { nhan: 'Kết quả', gia: `${b.soCauDung ?? 0}/${b.soCau ?? cauLuyen.length} câu đúng` },
      { nhan: 'Thời gian nộp', gia: b.nopLuc ? new Date(b.nopLuc).toLocaleDateString('vi-VN') : 'Đã nộp' },
    ],
  }

  return dungPhieu(thongTin, cauLuyen, {
    moSan: true,
    loiNhac: `Kết quả bài gia đình giao: Đạt ${b.diem ?? 0}/10 điểm (Đúng ${b.soCauDung ?? 0}/${b.soCau ?? cauLuyen.length} câu). Bấm vào từng câu để mở hoặc đóng lời giải chi tiết.`,
  })
}
