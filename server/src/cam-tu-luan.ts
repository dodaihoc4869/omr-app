// CẤM RÚT CÂU TỰ LUẬN — phía MÁY CHỦ (Code 3, 21/09/2026). Đề bài: `prompt-cam-rut-tu-luan.md`.
// Thầy: "tuyệt đối không rút câu tự luận, chỉ được rút câu trắc nghiệm, đúng sai, trả lời ngắn — ở mọi chỗ rút đề của cả 3 app, TRỪ màn Gọi lên bảng".
//
// MỘT định nghĩa duy nhất: `src/lib/cau-tu-luan.ts` (Code 1, hàm thuần). File này chỉ là lớp mỏng cho máy chủ: cùng MỘT chỗ để (a) hỏi "câu này có phải tự luận", (b) đọc câu
// từ JSON đã lưu, (c) đếm/ghi nhật ký số câu bị bỏ. KHÔNG kênh nào tự viết lại luật.
//
// Kênh KHÔNG được gọi (thầy loại trừ): Gọi lên bảng (`len-bang*`, `ho-so-len-bang`), ca thi và bài thầy tự chọn bộ câu (`choThiLai`, `noiKhoCa`, `layDeKho`) — server chỉ kiểm thành viên.
// Câu tự luận em ĐÃ TỪNG sai vẫn nằm nguyên trong hồ sơ (`nam_kt_cau`, `su_kien_hoc`); chỉ là không phục vụ lại qua các kênh rút.
import type { Env } from './kieu'
import { chuBaoBoTuLuan, laCauTuLuan, locCauRutDuoc, lyDoTuLuan, type PhanCau } from '../../src/lib/cau-tu-luan'

export { chuBaoBoTuLuan, laCauTuLuan, locCauRutDuoc, lyDoTuLuan }
export type { PhanCau }

/** JSON đã lưu của một câu (`game_v2_question.json` — khuôn `PrivateQuestion`) → đối tượng, hoặc `null` khi JSON hỏng (câu hỏng không phục vụ được). */
export function docCauTuJson(json: unknown): Record<string, unknown> | null {
  if (typeof json !== 'string') return json !== null && typeof json === 'object' ? (json as Record<string, unknown>) : null
  try {
    const o = JSON.parse(json) as unknown
    return o !== null && typeof o === 'object' && !Array.isArray(o) ? (o as Record<string, unknown>) : null
  } catch {
    return null
  }
}

/** JSON câu này là tự luận? JSON hỏng ⇒ `true` (không có gì để phục vụ). */
export function jsonLaTuLuan(json: unknown): boolean {
  const c = docCauTuJson(json)
  return c === null || laCauTuLuan(c)
}

const PHAN_CUA_KHOA: ReadonlyArray<readonly [string, PhanCau]> = [['phanI', 'I'], ['phanII', 'II'], ['phanIII', 'III']]
const chuoiNgan = (v: unknown): string => (typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '')

/** qid của câu trong gói: `qid`/`id`, không có thì `<mã đề>-<phần>-<số>` (cùng cách `qidCuaCau` ở máy chủ dựng chỉ mục). */
export function qidCauTrongGoi(c: Record<string, unknown>, maDe: string, phanMacDinh?: PhanCau): string {
  return chuoiNgan(c.qid ?? c.id) || `${maDe}-${chuoiNgan(c.phan).toUpperCase() || phanMacDinh || ''}-${chuoiNgan(c.so)}`
}

/**
 * Gỡ câu TỰ LUẬN khỏi MỘT gói đề — SỬA TẠI CHỖ. Đọc cả hai khuôn: tờ kho thô (`cau[]`, mỗi câu mang `phan`) và nguồn thầy (`phanI/phanII/phanIII[]`, câu không mang `phan`).
 * Trả số câu đã gỡ + qid của chúng (để nơi gọi loại khỏi danh sách "nên lấy"). Gói không phải đối tượng ⇒ không làm gì.
 */
export function goTuLuanKhoiGoi(goi: unknown, maDe = ''): { soBo: number; qidBo: Set<string> } {
  const qidBo = new Set<string>()
  if (goi === null || typeof goi !== 'object' || Array.isArray(goi)) return { soBo: 0, qidBo }
  const g = goi as Record<string, unknown>
  const loc = (khoa: string, phan?: PhanCau): void => {
    const ds = g[khoa]
    if (!Array.isArray(ds)) return
    const r = locCauRutDuoc(ds, phan)
    for (const b of r.bo) if (b.cau !== null && typeof b.cau === 'object') qidBo.add(qidCauTrongGoi(b.cau as Record<string, unknown>, maDe, phan))
    if (r.bo.length) g[khoa] = r.giu
  }
  loc('cau')
  for (const [khoa, phan] of PHAN_CUA_KHOA) loc(khoa, phan)
  return { soBo: qidBo.size, qidBo }
}

// Đệm theo phiên bản tờ: `<mã đề>|<cap_nhat_luc>` → qid tự luận của tờ. Isolate của Worker sống lâu nên lượt rút sau không đọc lại R2; đổi phiên bản tờ ⇒ khoá mới.
const DEM_TO = new Map<string, Set<string>>()
const DEM_TO_TOI_DA = 400

/**
 * Qid TỰ LUẬN của một tờ kho (đọc gói R2 `kho/<mã đề>.json`, có đệm theo phiên bản tờ). `null` = KHÔNG đọc được gói ⇒ không biết ⇒ nơi gọi KHÔNG kết tội (giữ câu),
 * đúng nguyên tắc của hàm chung. Dùng ở các lệnh chỉ trả CHỈ MỤC (không có đáp án) như `/kho/rut-cau`.
 */
export async function qidTuLuanCuaTo(env: Pick<Env, 'DE'>, maDe: string, phienBan: string): Promise<Set<string> | null> {
  const khoa = `${maDe}|${phienBan}`
  const co = DEM_TO.get(khoa)
  if (co) return co
  if (!env.DE || !maDe) return null
  try {
    const o = await env.DE.get(`kho/${maDe}.json`)
    if (!o?.body) return null
    const goi = await new Response(o.body).json()
    const qidBo = goTuLuanKhoiGoi(goi, maDe).qidBo
    if (DEM_TO.size >= DEM_TO_TOI_DA) DEM_TO.clear()
    DEM_TO.set(khoa, qidBo)
    return qidBo
  } catch {
    return null
  }
}

/** PHIẾU BÀI TẬP (`phieu.cau[]`, khuôn `CauLuyen`): bản đã gỡ câu tự luận + số câu bị gỡ. Phiếu không có mảng `cau` (phiếu kết quả / báo cáo) ⇒ giữ nguyên, 0. */
export function locPhieuBaiTap<T>(phieu: T): { phieu: T; soBo: number } {
  if (phieu === null || typeof phieu !== 'object' || Array.isArray(phieu)) return { phieu, soBo: 0 }
  const p = phieu as unknown as Record<string, unknown>
  if (!Array.isArray(p.cau)) return { phieu, soBo: 0 }
  const r = locCauRutDuoc(p.cau)
  if (r.bo.length === 0) return { phieu, soBo: 0 }
  return { phieu: { ...p, cau: r.giu } as unknown as T, soBo: r.bo.length }
}

/** Giữ câu rút được, đếm số bị bỏ. `cau` là mảng đối tượng bất kỳ khuôn nào mà `laCauTuLuan` đọc được (tờ kho thô, PrivateQuestion, CauLuyen, phiếu). */
export function chiGiuCauRutDuoc<T>(cau: readonly T[], phanMacDinh?: PhanCau): { giu: T[]; soBo: number; lyDo: string[] } {
  const r = locCauRutDuoc(cau, phanMacDinh)
  return { giu: r.giu, soBo: r.bo.length, lyDo: [...new Set(r.bo.map((b) => b.lyDo))] }
}
