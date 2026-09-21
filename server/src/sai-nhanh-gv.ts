// TÍN HIỆU "SAI RẤT NHANH RỒI ĐÚNG LẠI" CHO BẢNG TIN CỦA THẦY (Boss/Code 4 21/09: khoá `saiNhanh` của /gv/bang-tin; hàm thuần `demSaiNhanhDungLai` của Code 1, src/lib/tin-hieu-sai-nhanh.ts).
// Lệnh /gv/bang-tin là ĐỌC-CHỈ và ≤ 12 truy vấn nên KHÔNG tính ở đó: cron mỗi phút gọi `capNhatSaiNhanhNeuCu`, chỉ tính lại khi bản đệm ở `cau_hinh.sai_nhanh_gv` cũ hơn 10 phút (hoặc sang ngày mới),
// bảng tin chỉ ĐỌC bản đệm (chung truy vấn cấu hình đã có ⇒ 0 truy vấn thêm). Bản đệm cũ hơn 60 phút ⇒ coi như chưa có (khoá VẮNG, không bịa 0).
// MỘT truy vấn D1 khi tính: chỉ lấy các lần SAI NHANH và các lần ĐÚNG của đúng những (em, câu) đó trong cửa sổ, rồi chính hàm thuần của Code 1 đếm cho từng em (một nguồn định nghĩa duy nhất).
import type { Env } from './kieu'
import { demSaiNhanhDungLai, TIN_HIEU_SAI_NHANH, type SuKienSaiNhanh } from '../../src/lib/tin-hieu-sai-nhanh'
import { themNgay } from './ho-so-nam-kt'
import { ngayVn } from './su-kien-hoc'

export const KHOA_SAI_NHANH_GV = 'sai_nhanh_gv'
/** Tính lại khi bản đệm cũ hơn ngần này phút; bảng tin bỏ bản đệm cũ hơn `PHUT_DEM_CU_NHAT`. */
export const PHUT_TINH_LAI = 10
export const PHUT_DEM_CU_NHAT = 60
/** Số dòng tối đa lưu trong bản đệm (màn tự cắt còn 20). */
export const TOI_DA_EM_LUU = 50
const TOI_DA_DONG_DOC = 20000
const SBD_THU = '12121212'

export interface EmSaiNhanhDem { sbd: string; soCau: number; nguongSoCau: number; nguongGiay: number; cuaSoNgay: number; tuNgay: string; co: true }
export interface SaiNhanhDem { ngay: string; luc: string; ds: EmSaiNhanhDem[] }

const chuoi = (v: unknown): string => (v === null || v === undefined ? '' : String(v)).trim()

/** Tính cho MỌI em: chỉ em `co = true`, số câu giảm dần (hoà: sbd tăng dần), tối đa `TOI_DA_EM_LUU`. Không ghi gì. */
export async function tinhSaiNhanhTatCa(env: Env, nowMs: number): Promise<SaiNhanhDem> {
  const homNay = ngayVn(nowMs)
  const tuNgay = themNgay(homNay, -(TIN_HIEU_SAI_NHANH.cuaSoNgay - 1))
  const nguong = TIN_HIEU_SAI_NHANH.nguongGiay
  const r = await env.DB.prepare(
    `SELECT a.sbd, a.qid, a.ngay_vn, a.ket_qua, a.giay
       FROM su_kien_hoc a
      WHERE a.ngay_vn >= ? AND a.ngay_vn <= ?
        AND ((a.ket_qua = 0 AND a.giay IS NOT NULL AND a.giay >= 0 AND a.giay < ?)
          OR (a.ket_qua = 1 AND EXISTS (SELECT 1 FROM su_kien_hoc f WHERE f.sbd = a.sbd AND f.qid = a.qid AND f.ket_qua = 0 AND f.giay IS NOT NULL AND f.giay >= 0 AND f.giay < ? AND f.ngay_vn >= ? AND f.ngay_vn <= ?)))
      LIMIT ?`,
  ).bind(tuNgay, homNay, nguong, nguong, tuNgay, homNay, TOI_DA_DONG_DOC).all<Record<string, unknown>>()
  const theoEm = new Map<string, SuKienSaiNhanh[]>()
  for (const x of r.results ?? []) {
    const sbd = chuoi(x.sbd)
    if (!sbd || sbd === SBD_THU) continue
    const kq = Number(x.ket_qua)
    ;(theoEm.get(sbd) ?? theoEm.set(sbd, []).get(sbd)!).push({ qid: chuoi(x.qid), ngayVn: chuoi(x.ngay_vn), ketQua: kq === 1 ? 1 : kq === 0 ? 0 : null, giay: x.giay === null || x.giay === undefined ? null : Number(x.giay) })
  }
  const ds: EmSaiNhanhDem[] = []
  for (const [sbd, ev] of theoEm) {
    const k = demSaiNhanhDungLai(ev, homNay)
    if (k.co) ds.push({ sbd, soCau: k.soCau, nguongSoCau: k.nguongSoCau, nguongGiay: k.nguongGiay, cuaSoNgay: k.cuaSoNgay, tuNgay: k.tuNgay, co: true })
  }
  ds.sort((a, c) => c.soCau - a.soCau || (a.sbd < c.sbd ? -1 : 1))
  return { ngay: homNay, luc: new Date(nowMs).toISOString(), ds: ds.slice(0, TOI_DA_EM_LUU) }
}

/** Đọc bản đệm (giá trị `cau_hinh`); hỏng / vắng / cũ hơn `PHUT_DEM_CU_NHAT` / khác ngày VN hiện tại ⇒ null (bảng tin để VẮNG khoá). */
export function docSaiNhanhDem(giaTri: unknown, nowMs: number): SaiNhanhDem | null {
  try {
    const o = JSON.parse(chuoi(giaTri)) as Partial<SaiNhanhDem> | null
    if (!o || typeof o !== 'object' || !Array.isArray(o.ds)) return null
    const luc = Date.parse(chuoi(o.luc))
    if (!Number.isFinite(luc) || nowMs - luc > PHUT_DEM_CU_NHAT * 60_000 || luc > nowMs + 60_000) return null
    if (chuoi(o.ngay) !== ngayVn(nowMs)) return null
    const ds = o.ds.filter((x): x is EmSaiNhanhDem => !!x && typeof x.sbd === 'string' && x.sbd !== '' && Number.isFinite(Number(x.soCau)) && x.co === true)
    return { ngay: chuoi(o.ngay), luc: chuoi(o.luc), ds }
  } catch {
    return null
  }
}

/** Cron mỗi phút: tính lại khi bản đệm cũ (> 10 phút) hoặc sang ngày mới, rồi ghi `cau_hinh.sai_nhanh_gv`. Không ném lỗi. Bản đệm còn mới ⇒ chỉ MỘT truy vấn đọc. */
export async function capNhatSaiNhanhNeuCu(env: Env, nowMs: number = Date.now()): Promise<{ chay: boolean; soEm?: number; lyDo?: 'con_moi' | 'loi' }> {
  try {
    const cu = await env.DB.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?').bind(KHOA_SAI_NHANH_GV).first<{ gia_tri: unknown }>()
    let luc = NaN
    let ngay = ''
    try {
      const o = JSON.parse(chuoi(cu?.gia_tri)) as { luc?: unknown; ngay?: unknown } | null
      luc = Date.parse(chuoi(o?.luc)); ngay = chuoi(o?.ngay)
    } catch { /* chưa có bản đệm */ }
    if (Number.isFinite(luc) && ngay === ngayVn(nowMs) && nowMs - luc >= 0 && nowMs - luc < PHUT_TINH_LAI * 60_000) return { chay: false, lyDo: 'con_moi' }
    const moi = await tinhSaiNhanhTatCa(env, nowMs)
    await env.DB.prepare('INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES (?, ?, ?) ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri, cap_nhat_luc = excluded.cap_nhat_luc')
      .bind(KHOA_SAI_NHANH_GV, JSON.stringify(moi), moi.luc).run()
    return { chay: true, soEm: moi.ds.length }
  } catch (e) {
    console.error('[sai-nhanh] cron lỗi (bỏ qua, lần sau tính lại):', e instanceof Error ? e.message : e)
    return { chay: false, lyDo: 'loi' }
  }
}
