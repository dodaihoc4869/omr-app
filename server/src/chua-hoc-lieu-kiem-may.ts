// Thầy giao máy tự kiểm, không chờ thầy duyệt từng câu. Bằng chứng máy được ghi đúng tên máy.
import type { HocLieuChua, ProbeRef } from './chua-cau-sai-kieu'
import { kiemTinhDayDu, tatCaProbe } from './chua-cau-sai-hoc-lieu'
import { chamProbe } from './chua-cau-sai-phien'

export interface TraLoiKiemMu {
  qid: string
  phienBan: string
  bamDe: string
  dapAn: string
  lyDo: string
  chac: boolean
}
export interface BangKiemMay {
  phienBan: 1
  luotSoan: string
  luotKiem: string
  tra: TraLoiKiemMu[]
  chuyenMon: {
    dungKhoaHoc: boolean
    tuongDuong: boolean
    dungDoKho: boolean
    duBuoc: boolean
    lyDo: string
  }
}
export function deChoKiemMu(p: ProbeRef) {
  const n = p.noiDungTrucTiep!
  // Giữ nguyên thứ tự mã lựa chọn/ý, bảng và ảnh: đổi thứ tự cũng đổi dấu vân tay.
  return { qid: p.qid, phienBan: p.phienBan, phan: p.phan,
    noiDung: { hoi:n.hoi, kieu:n.kieu, ...(n.luaChon ? {luaChon:n.luaChon} : {}),
      ...(n.y ? {y:n.y} : {}), ...(n.bang ? {bang:n.bang} : {}),
      ...(n.hinhAnh ? {hinhAnh:n.hinhAnh} : {}), ...(n.donVi ? {donVi:n.donVi} : {}) } }
}
export async function bamDeMu(p: ProbeRef): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(deChoKiemMu(p))))
  return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('')
}
export function probeDuyNhat(h: HocLieuChua): ProbeRef[] {
  return [...new Map(tatCaProbe(h).map(p=>[`${p.qid}@${p.phienBan}`,p])).values()]
}
export async function kiemBangMay(h: HocLieuChua, v: unknown): Promise<string[]> {
  const errors = kiemTinhDayDu(h)
  if(errors.length) return errors
  const b = v as BangKiemMay
  if(!b || b.phienBan!==1 || typeof b.luotSoan!=='string' || typeof b.luotKiem!=='string'
    || b.luotSoan.length<8 || b.luotKiem.length<8 || b.luotSoan===b.luotKiem || !Array.isArray(b.tra) || b.tra.length>2000)
    return ['thieu_hai_luot_kiem']
  const c=b.chuyenMon
  if(!c || c.dungKhoaHoc!==true || c.tuongDuong!==true || c.dungDoKho!==true || c.duBuoc!==true
    || typeof c.lyDo!=='string' || c.lyDo.trim().length<30) errors.push('chua_qua_kiem_chuyen_mon')
  const rows=new Map<string,TraLoiKiemMu>()
  for(const x of b.tra){
    if(!x || typeof x.qid!=='string' || typeof x.phienBan!=='string' || typeof x.dapAn!=='string'
      || typeof x.lyDo!=='string' || x.lyDo.trim().length<15 || x.chac!==true || !/^[a-f0-9]{64}$/.test(x.bamDe ?? '')){
      errors.push('kiem_mu_thieu_ly_do_hoac_chua_chac'); continue
    }
    const key=`${x.qid}@${x.phienBan}`
    if(rows.has(key)) errors.push('kiem_mu_trung_muc')
    rows.set(key,x)
  }
  const ps=probeDuyNhat(h)
  if(rows.size!==ps.length) errors.push('kiem_mu_thieu_hoac_thua_muc')
  for(const p of ps){
    const r=rows.get(`${p.qid}@${p.phienBan}`)
    if(!r || r.bamDe!==await bamDeMu(p)) errors.push('kiem_mu_lech_de')
    else if(!chamProbe(p,r.dapAn)) errors.push('hai_luot_lech_dap_an')
  }
  return [...new Set(errors)]
}
