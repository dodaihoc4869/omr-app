// "EM ĐÃ LÀM CÂU NÀY CHƯA" trên THẺ TÊN của Gọi lên bảng (Code 1, 21/09/2026; thầy lệnh 16:4x: "quét được học sinh đã làm câu đó chưa, quét hết mọi lịch sử").
// Phần THUẦN: kiểu dữ liệu của hợp đồng `POST /gv/lich-su-cau-cua-em` (docs/hop-dong-lich-su-cau-len-bang-2109.md), đọc + kiểm phản hồi, dựng NHÃN. Phần gọi máy chủ ở `lich-su-cau-len-bang-lenh.ts`.
// Luật nhãn: một trong bốn nhãn, một dòng phụ khi làm ≥ 2 lần, một dòng "đã lên bảng" khi có. KHÔNG gắn nhãn năng lực, không so em với em, không chữ "nắm chắc". Thiếu dữ liệu ⇒ KHÔNG nhãn (không bịa).
import { maDeGocMayChu } from './btvn-nang-do-thay'

/** Tối đa mỗi lần gọi (hợp đồng). */
export const TOI_DA_CAP_MOI_LAN = 200

export interface CapEmCau { sbd: string; qid: string }
export interface LichSuCauEm {
  sbd: string
  qid: string
  daLam: boolean
  soLan: number
  soDung: number
  soSai: number
  lanCuoi: { dung: boolean | null; ngay: string; nguon: string } | null
  lenBang: { soLan: number; datLanCuoi: boolean | null } | null
}

export type KieuNhanLichSu = 'chua_lam' | 'dung' | 'sai' | 'chua_ket_qua'
/** Nhãn đã dựng, đưa thẳng cho tờ chiếu / màn phân công: `chu` là nhãn chính, `phu` và `lenBang` là hai dòng phụ (có thì mới in). */
export interface NhanLichSuCau { kieu: KieuNhanLichSu; chu: string; phu?: string; lenBang?: string }

export const CHU_NHAN_LICH_SU: Record<KieuNhanLichSu, string> = {
  chua_lam: 'Chưa làm câu này',
  dung: 'Đã làm · lần gần nhất đúng',
  sai: 'Đã làm · lần gần nhất sai',
  chua_ket_qua: 'Đã làm · chưa có kết quả',
}

export const khoaEmCau = (sbd: string, qid: string): string => `${sbd}|${qid}`

/** Mã câu theo quy ước máy chủ (`<mã tờ gốc>-<phần>-<số>`) từ id câu ở màn (`X-I-3`, `X-TN-I-3`, `X-II-01`…). Không dựng được ⇒ null (câu ấy không có nhãn). */
export function qidMayChuCuaIdCau(idCau: string): string | null {
  const m = /^(.*)-(III|II|I)-(\d+)$/.exec(String(idCau ?? '').trim())
  if (!m) return null
  const goc = maDeGocMayChu(m[1] ?? '')
  return goc ? `${goc}-${m[2]}-${Number(m[3])}` : null
}

const soNguyenKhongAm = (x: unknown): x is number => typeof x === 'number' && Number.isInteger(x) && x >= 0
const chuoiKhongRong = (x: unknown): x is string => typeof x === 'string' && x.trim() !== ''
const dungSaiHoacNull = (x: unknown): x is boolean | null => x === true || x === false || x === null

/** Một phần tử của `ketQua`: sai dạng ⇒ null (bỏ, không đoán). Kiểm cả điều kiện chéo của hợp đồng: soDung + soSai ≤ soLan; chưa làm ⇒ không có lần cuối / lên bảng. */
export function docPhanTuLichSu(raw: unknown): LichSuCauEm | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (!chuoiKhongRong(r.sbd) || !chuoiKhongRong(r.qid) || typeof r.daLam !== 'boolean') return null
  if (!soNguyenKhongAm(r.soLan) || !soNguyenKhongAm(r.soDung) || !soNguyenKhongAm(r.soSai)) return null
  if (r.soDung + r.soSai > r.soLan) return null
  let lanCuoi: LichSuCauEm['lanCuoi'] = null
  if (r.lanCuoi !== null && r.lanCuoi !== undefined) {
    const lc = r.lanCuoi as Record<string, unknown>
    if (!lc || typeof lc !== 'object' || !dungSaiHoacNull(lc.dung) || typeof lc.ngay !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(lc.ngay)) return null
    lanCuoi = { dung: lc.dung, ngay: lc.ngay, nguon: typeof lc.nguon === 'string' ? lc.nguon : '' }
  }
  let lenBang: LichSuCauEm['lenBang'] = null
  if (r.lenBang !== null && r.lenBang !== undefined) {
    const lb = r.lenBang as Record<string, unknown>
    if (!lb || typeof lb !== 'object' || !soNguyenKhongAm(lb.soLan) || !dungSaiHoacNull(lb.datLanCuoi ?? null)) return null
    lenBang = { soLan: lb.soLan, datLanCuoi: (lb.datLanCuoi ?? null) as boolean | null }
  }
  if (!r.daLam && (r.soLan > 0 || lanCuoi || (lenBang && lenBang.soLan > 0))) return null // "chưa làm" mà có dòng ⇒ máy chủ trả sai, không dùng
  return { sbd: r.sbd, qid: r.qid, daLam: r.daLam, soLan: r.soLan, soDung: r.soDung, soSai: r.soSai, lanCuoi, lenBang }
}

/** Phản hồi `/gv/lich-su-cau-cua-em` → bản đồ theo khoá `sbd|qid`. Không đúng dạng ⇒ null; phần tử sai dạng bị bỏ (cặp ấy không có nhãn). */
export function docLichSuCauEm(raw: unknown): Map<string, LichSuCauEm> | null {
  if (!raw || typeof raw !== 'object') return null
  const kq = (raw as { ketQua?: unknown }).ketQua
  if (!Array.isArray(kq)) return null
  const ra = new Map<string, LichSuCauEm>()
  for (const p of kq) {
    const x = docPhanTuLichSu(p)
    if (x) ra.set(khoaEmCau(x.sbd, x.qid), x)
  }
  return ra
}

/** "2026-09-19" → "19/09". */
function ngayNgan(ngay: string): string {
  const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(ngay)
  return m ? `${m[2]}/${m[1]}` : ngay
}

/** Dòng phụ khi làm ≥ 2 lần: "3 lần: 1 đúng, 2 sai · gần nhất 19/09". Lần bị che đúng/sai (bài chưa nộp, ca chưa công bố…) được nói thật là "chưa có kết quả", không gộp vào đúng hay sai. */
function dongPhu(x: LichSuCauEm): string | undefined {
  if (x.soLan < 2) return undefined
  const coKq = x.soDung + x.soSai
  const chua = x.soLan - coKq
  const phan: string[] = []
  if (coKq > 0) {
    phan.push(`${x.soDung} đúng`, `${x.soSai} sai`)
    if (chua > 0) phan.push(`${chua} chưa có kết quả`)
  }
  let chu = `${x.soLan} lần${phan.length ? `: ${phan.join(', ')}` : ''}`
  if (x.lanCuoi?.ngay) chu += ` · gần nhất ${ngayNgan(x.lanCuoi.ngay)}`
  return chu
}

/** Dòng "đã lên bảng": "Đã lên bảng câu này 1 lần · đạt". */
function dongLenBang(x: LichSuCauEm): string | undefined {
  if (!x.lenBang || x.lenBang.soLan <= 0) return undefined
  const kq = x.lenBang.datLanCuoi === true ? ' · đạt' : x.lenBang.datLanCuoi === false ? ' · chưa đạt' : ''
  return `Đã lên bảng câu này ${x.lenBang.soLan} lần${kq}`
}

/** Nhãn cho MỘT cặp (em, câu). Không có dữ liệu (`undefined`) ⇒ null: tờ / màn KHÔNG hiện gì (không bịa "chưa làm"). */
export function nhanLichSuCau(x: LichSuCauEm | undefined | null): NhanLichSuCau | null {
  if (!x) return null
  if (!x.daLam) return { kieu: 'chua_lam', chu: CHU_NHAN_LICH_SU.chua_lam }
  const kieu: KieuNhanLichSu = x.lanCuoi?.dung === true ? 'dung' : x.lanCuoi?.dung === false ? 'sai' : 'chua_ket_qua'
  const ra: NhanLichSuCau = { kieu, chu: CHU_NHAN_LICH_SU[kieu] }
  const phu = dongPhu(x)
  if (phu) ra.phu = phu
  const lb = dongLenBang(x)
  if (lb) ra.lenBang = lb
  return ra
}

/** Gom cặp (em, câu) KHÔNG TRÙNG theo khoá rồi chia lô ≤ `toiDa` (mặc định 200) cho từng lần gọi. Cặp thiếu sbd / qid bị bỏ. */
export function chiaLoCap(cap: readonly CapEmCau[], toiDa = TOI_DA_CAP_MOI_LAN): CapEmCau[][] {
  const daCo = new Set<string>()
  const duy: CapEmCau[] = []
  for (const c of cap) {
    if (!chuoiKhongRong(c?.sbd) || !chuoiKhongRong(c?.qid)) continue
    const k = khoaEmCau(c.sbd, c.qid)
    if (daCo.has(k)) continue
    daCo.add(k)
    duy.push({ sbd: c.sbd, qid: c.qid })
  }
  const lo = Math.max(1, Math.floor(toiDa) || TOI_DA_CAP_MOI_LAN)
  const ra: CapEmCau[][] = []
  for (let i = 0; i < duy.length; i += lo) ra.push(duy.slice(i, i + lo))
  return ra
}
