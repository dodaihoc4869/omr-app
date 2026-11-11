// NỢ CÂU CHO THẦY VÀ PHỤ HUYNH XEM (thầy 11/11: «Làm tiếp cho thầy và phụ huynh xem nợ câu từng em») — thuần CPU, không đọc D1.
// Bảng «Bài hằng ngày» của thầy và trang «Về con» của phụ huynh dùng CHUNG `docNgayCacEm` (bai-hang-ngay.ts) ⇒ sổ nợ đọc CÙNG câu đọc mức Gói 7 ở đó
// (nối `SQL_NO_XEM`, 0 lệnh D1 thêm — cổng tốc độ `/ph` đếm cả số lệnh) và tính ở đây ⇒ thầy, phụ huynh, học sinh thấy cùng một số.
// Em chưa mở app từ sau ngày chốt sổ: tính tiếp các ngày đã qua bằng ĐÚNG luật `chotNo` (no-cau.ts) trên số «đã làm / mức» của bảng ⇒ con số thầy thấy
// là con số em sẽ thấy khi mở app (nhãn «theo loại» của ngày vắng có thể lệch — chỉ là nhãn).
import { congNgay7 } from './goi-bai-7-loi'
import { NGAY_NO_CAU, NGAY_TRUOC_NO_CAU, chonMacDinh, chotNo, soNoRong, tomTatNo, type KieuTra, type NgayNo, type SoNo, type TomTatNo } from './no-cau'

type Row = Record<string, unknown>
/** Tóm tắt nợ câu của một em cho thầy / phụ huynh. `daChon` = hôm nay em đã mở app (đã có lựa chọn trả nợ); chưa ⇒ số theo lựa chọn mặc định. */
export interface NoCauXem extends TomTatNo { daChon: boolean }
/** Nối SAU câu đọc mức Gói 7 đã thêm hai cột `k`, `d` (?1 = json mã em, ?2 = từ ngày, ?3 = đến ngày). Dòng: sbd · ngay · tang · muc · k · d. */
export const SQL_NO_XEM = ` UNION ALL SELECT sbd,den_ngay,lan,no,'e',loai_json FROM goi_bai_7_no_em WHERE sbd IN (SELECT value FROM json_each(?1))
 UNION ALL SELECT sbd,ngay,goc,so,'c',kieu FROM goi_bai_7_no_chon WHERE sbd IN (SELECT value FROM json_each(?1)) AND ngay BETWEEN ?2 AND ?3
 UNION ALL SELECT sbd,ngay,0,0,'l',loai FROM goi_bai_7_loai_ngay WHERE sbd IN (SELECT value FROM json_each(?1)) AND ngay BETWEEN ?2 AND ?3
 UNION ALL SELECT sbd,bat_dau,0,0,'g',han FROM goi_bai_7_em WHERE sbd IN (SELECT value FROM json_each(?1)) AND bat_dau<=?3 AND han>=?2`

const so0 = (v: unknown): number => { const n = Math.floor(Number(v)); return Number.isFinite(n) && n > 0 ? n : 0 }
const chu = (v: unknown): string => (typeof v === 'string' ? v : '')
/** Em chưa có dòng nào trong các bảng nợ: vẫn tính nợ từ 11/11 theo số «đã làm / mức» của bảng. */
export const SO_XEM_RONG: SoXem = { so: null, chon: new Map(), loai: new Map(), goi: [] }
export interface SoXem { so: SoNo | null; chon: Map<string, { kieu: KieuTra; so: number; goc: number }>; loai: Map<string, string>; goi: { tu: string; den: string }[] }
/** Gom các dòng `k` ≠ null của câu đọc trên theo em. */
export function gomDongNo(rows: readonly Row[]): Map<string, SoXem> {
  const ra = new Map<string, SoXem>()
  for (const r of rows) {
    const sbd = chu(r.sbd), ngay = chu(r.ngay)
    if (!sbd || !ngay) continue
    let x = ra.get(sbd)
    if (!x) { x = { so: null, chon: new Map(), loai: new Map(), goi: [] }; ra.set(sbd, x) }
    if (r.k === 'e') {
      let l: Row = {}
      try { const o: unknown = JSON.parse(chu(r.d) || '{}'); if (o && typeof o === 'object') l = o as Row } catch { /* loại hỏng ⇒ 0 */ }
      x.so = { no: so0(r.muc), lan: so0(r.tang), loai: { moi: so0(l.moi), sua: so0(l.sua), on: so0(l.on), lai: so0(l.lai) }, den: ngay }
    } else if (r.k === 'c') { if (r.d === 'toi_thieu' || r.d === 'het') x.chon.set(ngay, { kieu: r.d, so: so0(r.muc), goc: so0(r.tang) }) }
    else if (r.k === 'l') x.loai.set(ngay, chu(r.d))
    else if (r.k === 'g') x.goi.push({ tu: ngay, den: chu(r.d) })
  }
  return ra
}

/** Một ngày của em như bảng «Bài hằng ngày» thấy: `muc` = dòng mức ĐÃ CHỐT của ngày Gói 7 (null = chưa có dòng mức); `ktNop` chỉ dùng cho ngày Kiểm tra ôn tập. */
export interface NgayXem { ngay: string; cheDo: 'goi7' | 'kiem-tra' | 'khac'; muc: number | null; lam: number; ktNop?: boolean }
/** Nợ câu hiện tại của em (null = chưa có sổ hoặc không nợ). `ngay` = dãy ngày của bảng, gồm hôm nay. */
export function xemNoEm(x: SoXem, ngay: readonly NgayXem[], homNay: string, mucVang = 28): NoCauXem | null {
  if (homNay < NGAY_NO_CAU) return null
  const hq = congNgay7(homNay, -1)
  let s = x.so ?? soNoRong(NGAY_TRUOC_NO_CAU) // em chưa có sổ: tính từ 11/11 như mọi em (cùng luật noCau7)
  if (s.den < hq) {
    const tu = [congNgay7(s.den, 1), congNgay7(homNay, -7), NGAY_NO_CAU].sort().pop()!
    const ds: NgayNo[] = []
    for (const n of ngay) {
      if (n.ngay < tu || n.ngay >= homNay) continue
      if (n.cheDo === 'kiem-tra') ds.push({ ngay: n.ngay, muc: null, so: 0, kieu: null, lam: 0, kt: n.ktNop ? 'da_nop' : 'chua', loai: 'on' })
      else if (n.cheDo === 'goi7') {
        if (n.muc === null && !x.goi.some((g) => g.tu <= n.ngay && g.den >= n.ngay)) continue // ngày vắng mà không có bài trong hạn: không nợ, không lãi
        const c = x.chon.get(n.ngay), l = x.loai.get(n.ngay)
        ds.push({ ngay: n.ngay, muc: n.muc, so: c?.so ?? 0, kieu: c?.kieu ?? null, lam: n.lam, kt: null, loai: l === 'moi' || l === 'sua' ? l : 'on' })
      }
    }
    s = { ...chotNo(s, ds.sort((a, b) => a.ngay.localeCompare(b.ngay)), mucVang), den: hq }
  }
  if (s.no <= 0) return null
  const h = ngay.find((n) => n.ngay === homNay), c = x.chon.get(homNay), chon = c ?? chonMacDinh(s)
  const t = tomTatNo(s, chon, h && h.cheDo === 'goi7' ? h.lam : 0, c ? (h?.muc ?? c.goc + c.so) : mucVang + chon.so)
  return t ? { ...t, daChon: !!c } : null
}
