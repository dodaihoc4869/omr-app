// TÍN HIỆU "SAI RẤT NHANH RỒI ĐÚNG LẠI" CHO BẢNG TIN CỦA THẦY (Boss/Code 4 21/09: khoá `saiNhanh` của /gv/bang-tin; hàm thuần `demSaiNhanhDungLai` của Code 1, src/lib/tin-hieu-sai-nhanh.ts).
// Lệnh /gv/bang-tin là ĐỌC-CHỈ và ≤ 12 truy vấn nên KHÔNG tính ở đó: cron mỗi phút gọi `capNhatSaiNhanhNeuCu`, MỖI MỐC 6 GIỜ tính ĐÚNG MỘT LẦN (00:10 · 06:10 · 12:10 · 18:10 giờ VN ⇒ ≤ 4 lần/ngày; Boss 21/09: mỗi lần
// đọc ~70–85 nghìn dòng D1, tín hiệu bản chất theo NGÀY nên không cần dày hơn), khoá idempotent = mốc đã tính (lưu ở `moc` trong bản đệm `cau_hinh.sai_nhanh_gv`; lỡ mốc thì lần cron đầu tiên sau đó tính bù).
// Bảng tin chỉ ĐỌC bản đệm (chung truy vấn cấu hình đã có ⇒ 0 truy vấn thêm). Bản đệm cũ hơn 7 giờ (lỡ hơn một mốc) ⇒ coi như chưa có (khoá VẮNG, không bịa 0).
// MỘT truy vấn D1 khi tính: chỉ lấy các lần SAI NHANH và các lần ĐÚNG của đúng những (em, câu) đó trong cửa sổ, rồi chính hàm thuần của Code 1 đếm cho từng em (một nguồn định nghĩa duy nhất).
import type { Env } from './kieu'
import { demSaiNhanhDungLai, TIN_HIEU_SAI_NHANH, type SuKienSaiNhanh } from '../../src/lib/tin-hieu-sai-nhanh'
import { themNgay } from './ho-so-nam-kt'
import { ngayVn } from './su-kien-hoc'

export const KHOA_SAI_NHANH_GV = 'sai_nhanh_gv'
/** Giờ (giờ VN) và phút của các MỐC tính trong ngày: 00:10 · 06:10 · 12:10 · 18:10 — ĐÚNG 4 lần/ngày. */
export const GIO_MOC_SAI_NHANH = [0, 6, 12, 18] as const
export const PHUT_MOC_SAI_NHANH = 10
/** Bảng tin bỏ bản đệm cũ hơn ngần này phút (6 giờ giữa hai mốc + 1 giờ dung sai). */
export const PHUT_DEM_CU_NHAT = 7 * 60
/** Số dòng tối đa lưu trong bản đệm (màn tự cắt còn 20). */
export const TOI_DA_EM_LUU = 50
const TOI_DA_DONG_DOC = 20000
const SBD_THU = '12121212'

export interface EmSaiNhanhDem { sbd: string; soCau: number; nguongSoCau: number; nguongGiay: number; cuaSoNgay: number; tuNgay: string; co: true }
export interface SaiNhanhDem { ngay: string; luc: string; /** Mốc 6 giờ đã tính (khoá idempotent), ví dụ "2026-09-22T06:10". */ moc?: string; /** true = lần tính của mốc này LỖI (đánh dấu để không thử lại mỗi phút; bảng tin coi như chưa có). */ loi?: true; ds: EmSaiNhanhDem[] }

/** MỐC 6 giờ MỚI NHẤT đã tới lúc `nowMs` (giờ VN): "YYYY-MM-DDTHH:10" với HH ∈ {00, 06, 12, 18}; trước 00:10 thì là mốc 18:10 của ngày hôm trước. */
export function mocSaiNhanhMoiNhat(nowMs: number): string {
  const vn = new Date(nowMs + 7 * 3_600_000)
  const phutTrongNgay = vn.getUTCHours() * 60 + vn.getUTCMinutes()
  const daQua = GIO_MOC_SAI_NHANH.filter((g) => g * 60 + PHUT_MOC_SAI_NHANH <= phutTrongNgay)
  if (daQua.length > 0) return `${vn.toISOString().slice(0, 10)}T${String(daQua[daQua.length - 1]).padStart(2, '0')}:${String(PHUT_MOC_SAI_NHANH).padStart(2, '0')}`
  return `${new Date(vn.getTime() - 86_400_000).toISOString().slice(0, 10)}T${String(GIO_MOC_SAI_NHANH[GIO_MOC_SAI_NHANH.length - 1]).padStart(2, '0')}:${String(PHUT_MOC_SAI_NHANH).padStart(2, '0')}`
}

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
  return { ngay: homNay, luc: new Date(nowMs).toISOString(), moc: mocSaiNhanhMoiNhat(nowMs), ds: ds.slice(0, TOI_DA_EM_LUU) }
}

/** Đọc bản đệm (giá trị `cau_hinh`); hỏng / vắng / cũ hơn `PHUT_DEM_CU_NHAT` (lỡ hơn một mốc 6 giờ) ⇒ null (bảng tin để VẮNG khoá). */
export function docSaiNhanhDem(giaTri: unknown, nowMs: number): SaiNhanhDem | null {
  try {
    const o = JSON.parse(chuoi(giaTri)) as Partial<SaiNhanhDem> | null
    if (!o || typeof o !== 'object' || !Array.isArray(o.ds) || o.loi === true) return null
    const luc = Date.parse(chuoi(o.luc))
    if (!Number.isFinite(luc) || nowMs - luc > PHUT_DEM_CU_NHAT * 60_000 || luc > nowMs + 60_000) return null
    const ds = o.ds.filter((x): x is EmSaiNhanhDem => !!x && typeof x.sbd === 'string' && x.sbd !== '' && Number.isFinite(Number(x.soCau)) && x.co === true)
    return { ngay: chuoi(o.ngay), luc: chuoi(o.luc), moc: chuoi(o.moc) || undefined, ds }
  } catch {
    return null
  }
}

/**
 * Cron mỗi phút: chỉ tính khi ĐÃ TỚI một mốc 6 giờ MỚI mà bản đệm chưa tính (`moc` trong bản đệm ≠ mốc mới nhất) — ≤ 4 lần/ngày, lỡ mốc thì lần cron đầu tiên sau đó tính bù. Không ném lỗi.
 * Mốc đã tính rồi ⇒ chỉ MỘT truy vấn đọc bản đệm.
 */
export async function capNhatSaiNhanhNeuCu(env: Env, nowMs: number = Date.now()): Promise<{ chay: boolean; soEm?: number; lyDo?: 'con_moi' | 'loi' }> {
  try {
    const mocMoi = mocSaiNhanhMoiNhat(nowMs)
    const cu = await env.DB.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?').bind(KHOA_SAI_NHANH_GV).first<{ gia_tri: unknown }>()
    let mocCu = ''
    try {
      mocCu = chuoi((JSON.parse(chuoi(cu?.gia_tri)) as { moc?: unknown } | null)?.moc)
    } catch { /* chưa có bản đệm */ }
    if (mocCu === mocMoi) return { chay: false, lyDo: 'con_moi' }
    let moi: SaiNhanhDem | null = null
    try {
      moi = await tinhSaiNhanhTatCa(env, nowMs)
    } catch (e) {
      console.error('[sai-nhanh] tính lỗi (đánh dấu mốc này, không thử lại mỗi phút):', e instanceof Error ? e.message : e)
    }
    const ghi: SaiNhanhDem = moi ?? { ngay: ngayVn(nowMs), luc: new Date(nowMs).toISOString(), moc: mocMoi, loi: true, ds: [] }
    await env.DB.prepare('INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES (?, ?, ?) ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri, cap_nhat_luc = excluded.cap_nhat_luc')
      .bind(KHOA_SAI_NHANH_GV, JSON.stringify(ghi), ghi.luc).run()
    return moi ? { chay: true, soEm: moi.ds.length } : { chay: false, lyDo: 'loi' }
  } catch (e) {
    console.error('[sai-nhanh] cron lỗi (bỏ qua, phút sau thử lại):', e instanceof Error ? e.message : e)
    return { chay: false, lyDo: 'loi' }
  }
}
