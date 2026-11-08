// `POST /ca/them-phut {maCa, phut}` — LỆNH THẦY: THÊM phút cho ca ĐANG CHẠY (docs/hop-dong-them-phut-2109.md mục 1; thầy lệnh 21/09 "thêm 2 nút luôn").
//
// Trước đây hạn một lượt ghi MỘT LẦN vào `luot.het_gio_luc` lúc `/vao-thi` và không lệnh nào sửa giờ ca đang chạy. Lệnh này chỉ CỘNG, không bao giờ trừ:
//   · `ca.thoi_gian_phut += phut` (em vào SAU khi thêm phút cũng nhận đủ: `mocHetGio` tính theo cột này; ca đồng bộ giờ thì `bat_dau_thi_luc + thoi_gian_phut`),
//   · mọi lượt ĐANG LÀM của ca có `het_gio_luc` thì `het_gio_luc += phut`, và mọi lượt KHOÁ (`khoa`, bị khoá vì rời màn) cũng vậy: `moKhoaEm` đưa `khoa` về `dang_lam` với NGUYÊN
//     `het_gio_luc`, nên em được mở khoá SAU khi thêm phút mà không cộng thì thiệt giờ,
//   · `ca.them_phut_tong += phut` (cột chỉ-thêm, trần 30 phút mỗi ca).
// KHÔNG đụng: `het_han_vao`, điểm, đáp án, lượt đã nộp/khoá/chờ duyệt lại. Luật "chỉ nộp 1 phút cuối" tính theo `het_gio_luc` nên tự theo giờ mới.
//
// ĐẨY LẠI CA: `publish` (`dayCa`) và `/ca/nhieu` ghi đè `thoi_gian_phut` theo bản của app thầy; ca ĐÃ được thêm phút thì `phutKhongHaSauKhiThem` chặn việc hạ nó xuống dưới giá trị hiện có.
//
// MỘT batch, ba câu, cùng điều kiện tiên quyết "`them_phut_tong` vẫn bằng giá trị vừa đọc" (khoá lạc quan): hai lệnh chạy chồng nhau thì chỉ một lệnh có tác dụng, lệnh kia
// không đổi gì và báo thử lại — không bao giờ lệch giữa giờ của ca và giờ của lượt. Hai câu lượt đi TRƯỚC câu ca (cả ba đọc cùng điều kiện lúc bắt đầu batch).
import type { D1PreparedStatement, Env } from './kieu'
import { xoaDemCaBaoVe } from './game-v2-bank'
import { xoaDemHetGioLuot } from './dem-ca-thi'
import { mocHetGio } from './luat-vao-thi'

export const PHUT_THEM_TOI_DA_MOT_LAN = 15
export const PHUT_THEM_TOI_DA_MOT_CA = 30

const LOI_THIEU_COT = 'Máy chủ chưa có cột thêm phút (chưa chạy migration-2109-them-phut.sql). Thầy nhờ Code 3 chạy migration.'

export async function themPhutCa(env: Env, b: Record<string, unknown>, nowMs: number = Date.now()): Promise<Record<string, unknown>> {
  const maCa = String(b.maCa ?? '').trim()
  if (!maCa) return { ok: false, error: 'Thiếu mã ca' }
  const phut = b.phut
  if (typeof phut !== 'number' || !Number.isInteger(phut) || phut < 1 || phut > PHUT_THEM_TOI_DA_MOT_LAN) {
    return { ok: false, error: `Số phút thêm phải là số nguyên từ 1 đến ${PHUT_THEM_TOI_DA_MOT_LAN}.` }
  }
  let ca: Record<string, unknown> | null
  try {
    ca = await env.DB.prepare('SELECT ma_ca, trang_thai, loai, thoi_gian_phut, them_phut_tong FROM ca WHERE ma_ca = ?').bind(maCa).first<Record<string, unknown>>()
  } catch (e) {
    if (/no such column/i.test(e instanceof Error ? e.message : String(e))) return { ok: false, error: LOI_THIEU_COT }
    throw e
  }
  if (!ca) return { ok: false, error: 'Không tìm thấy ca.' }
  if (String(ca.trang_thai ?? '') !== 'mo') return { ok: false, error: 'Ca không đang mở nên không thêm phút được.' }
  if (String(ca.loai ?? '') === 'baitap') return { ok: false, error: 'Bài tập về nhà tính hạn theo giờ nộp, không thêm phút được.' }
  const daThem = Number(ca.them_phut_tong) || 0
  if (daThem + phut > PHUT_THEM_TOI_DA_MOT_CA) {
    return { ok: false, error: `Ca này đã thêm ${daThem} phút. Thêm ${phut} phút nữa sẽ vượt trần ${PHUT_THEM_TOI_DA_MOT_CA} phút mỗi ca.` }
  }
  const nay = new Date(nowMs).toISOString()
  const dieuKien = "ma_ca = ? AND trang_thai = 'mo' AND COALESCE(loai, 'thi') <> 'baitap' AND them_phut_tong = ?"
  const cong = `+${phut} minutes`
  const cau: D1PreparedStatement[] = [
    // 1. Lượt ĐANG LÀM có hạn đọc được: cộng phút (hạn không đọc được thì bỏ qua, giữ nguyên, không bao giờ xoá hạn và không tính vào `soLuotCong`).
    env.DB.prepare(
      `UPDATE luot SET het_gio_luc = COALESCE(strftime('%Y-%m-%dT%H:%M:%fZ', het_gio_luc, ?), het_gio_luc), cap_nhat_luc = ?
        WHERE ma_ca = ? AND trang_thai = 'dang_lam' AND het_gio_luc IS NOT NULL AND het_gio_luc <> '' AND strftime('%s', het_gio_luc) IS NOT NULL
          AND EXISTS (SELECT 1 FROM ca WHERE ${dieuKien})`,
    ).bind(cong, nay, maCa, maCa, daThem),
    // 2. Lượt KHOÁ (chờ thầy mở khoá) có hạn đọc được: cộng như trên, để em được mở khoá sau đó không thiệt giờ.
    env.DB.prepare(
      `UPDATE luot SET het_gio_luc = COALESCE(strftime('%Y-%m-%dT%H:%M:%fZ', het_gio_luc, ?), het_gio_luc), cap_nhat_luc = ?
        WHERE ma_ca = ? AND trang_thai = 'khoa' AND het_gio_luc IS NOT NULL AND het_gio_luc <> '' AND strftime('%s', het_gio_luc) IS NOT NULL
          AND EXISTS (SELECT 1 FROM ca WHERE ${dieuKien})`,
    ).bind(cong, nay, maCa, maCa, daThem),
    // 3. Ca: cộng phút và tổng đã thêm (cùng điều kiện tiên quyết).
    env.DB.prepare(
      `UPDATE ca SET thoi_gian_phut = COALESCE(thoi_gian_phut, 45) + ?, them_phut_tong = them_phut_tong + ?, cap_nhat_luc = ? WHERE ${dieuKien}`,
    ).bind(phut, phut, nay, maCa, daThem),
  ]
  const kq = await env.DB.batch(cau)
  const soLuotCong = Number(kq[0]?.meta?.changes) || 0
  const soLuotKhoaCong = Number(kq[1]?.meta?.changes) || 0
  if (!(Number(kq[2]?.meta?.changes) > 0)) {
    return { ok: false, error: 'Ca vừa được đổi ở nơi khác (thêm phút, đóng ca…). Thầy xem lại số phút rồi thử lại.', thuLai: true }
  }
  xoaDemCaBaoVe() // HẠ TẢI D1 (Boss 22/09): thêm phút đổi thoi_gian_phut ⇒ bỏ đệm `protectedQuestions` ngay
  xoaDemHetGioLuot(maCa) // HẠ TẢI D1: thêm phút đổi het_gio_luc ⇒ bỏ đệm hạn giờ lượt ngay
  const sau = await env.DB.prepare('SELECT thoi_gian_phut, them_phut_tong FROM ca WHERE ma_ca = ?').bind(maCa).first<Record<string, unknown>>()
  return { ok: true, phut, soLuotCong, soLuotKhoaCong, thoiGianPhut: Number(sau?.thoi_gian_phut) || 0, themPhutTong: Number(sau?.them_phut_tong) || 0 }
}

/**
 * Với các ca ĐÃ được thêm phút (`them_phut_tong > 0`): `thoi_gian_phut` hiện có của từng ca. Ca chưa thêm phút không có trong kết quả. Chưa có cột/bảng ⇒ rỗng (ghi như cũ).
 * Dùng khi đẩy lại ca (`publish`, `/ca/nhieu`): `phutKhongHaSauKhiThem(phutMoi, hienCo)` để không làm mất phút đã thêm.
 */
export async function docPhutCaDaThem(env: Env, dsMaCa: string[]): Promise<Map<string, number>> {
  const ra = new Map<string, number>()
  const ma = [...new Set(dsMaCa.filter(Boolean))]
  if (ma.length === 0) return ra
  try {
    const r = await env.DB.prepare('SELECT ma_ca, thoi_gian_phut FROM ca WHERE them_phut_tong > 0 AND ma_ca IN (SELECT value FROM json_each(?))').bind(JSON.stringify(ma)).all<{ ma_ca: string; thoi_gian_phut: number | null }>()
    for (const x of r.results ?? []) ra.set(String(x.ma_ca), Number(x.thoi_gian_phut) || 0)
  } catch { /* chưa chạy migration them_phut_tong hoặc thiếu bảng: đẩy ca như cũ */ }
  return ra
}

/** Phút ghi khi đẩy lại ca: ca đã thêm phút thì KHÔNG thấp hơn giá trị hiện có (đẩy số lớn hơn thì theo số lớn hơn); ca chưa thêm thì đúng số app gửi. */
export const phutKhongHaSauKhiThem = (phutMoi: number, hienCo: number | undefined): number => (hienCo === undefined ? phutMoi : Math.max(phutMoi, hienCo))

/** Trần phút THẦY THÊM RIÊNG cho một em trong một ca (ngoài phần thêm cho cả phòng). */
export const PHUT_THEM_EM_TOI_DA = 30

/**
 * `POST /ca/them-phut-em {maCa, sbd, phut}` — LỆNH THẦY (thầy 08/11: «bấm vào từng hs đang làm để thêm giờ cho từng hs đó»; bản vẽ docs/ban-ve-them-gio-em-0811).
 * Chỉ cộng `het_gio_luc` của MỘT lượt (lượt mới nhất của em, đang làm hoặc đang bị khoá) — các em khác giữ nguyên; máy em tự nhận hạn mới ở nhịp gửi trạng thái.
 * Không thêm cột: phút đã thêm riêng = hạn hiện hành − hạn gốc `mocHetGio(ca, vao_luc)` (thoi_gian_phut của ca đã gồm phần thêm cả phòng). Trần 30 phút mỗi em.
 * Khoá lạc quan: câu ghi chỉ chạy khi `het_gio_luc` vẫn bằng giá trị vừa đọc ⇒ hai lần bấm chồng nhau chỉ một lần có tác dụng.
 */
export async function themPhutEm(env: Env, b: Record<string, unknown>, nowMs: number = Date.now()): Promise<Record<string, unknown>> {
  const maCa = String(b.maCa ?? '').trim()
  const sbd = String(b.sbd ?? '').trim()
  if (!maCa || !sbd) return { ok: false, error: 'Thiếu mã ca hoặc số báo danh.' }
  const phut = b.phut
  if (typeof phut !== 'number' || !Number.isInteger(phut) || phut < 1 || phut > PHUT_THEM_TOI_DA_MOT_LAN) {
    return { ok: false, error: `Số phút thêm phải là số nguyên từ 1 đến ${PHUT_THEM_TOI_DA_MOT_LAN}.` }
  }
  const [ca, luot] = await Promise.all([
    env.DB.prepare('SELECT ma_ca, trang_thai, loai, thoi_gian_phut, dong_bo_gio, bat_dau_thi_luc, han_nop FROM ca WHERE ma_ca = ?').bind(maCa).first<Record<string, unknown>>(),
    env.DB.prepare('SELECT khoa, trang_thai, vao_luc, het_gio_luc FROM luot WHERE ma_ca = ? AND sbd = ? ORDER BY lan_thu DESC LIMIT 1').bind(maCa, sbd).first<Record<string, unknown>>(),
  ])
  if (!ca) return { ok: false, error: 'Không tìm thấy ca.' }
  if (String(ca.trang_thai ?? '') !== 'mo') return { ok: false, error: 'Ca không đang mở nên không thêm giờ được.' }
  if (String(ca.loai ?? '') === 'baitap') return { ok: false, error: 'Bài tập về nhà tính hạn theo giờ nộp, không thêm giờ được.' }
  if (!luot) return { ok: false, error: 'Em chưa vào ca này.' }
  const tt = String(luot.trang_thai ?? '')
  if (tt !== 'dang_lam' && tt !== 'khoa') return { ok: false, error: tt === 'da_nop' ? 'Em đã nộp bài — không thêm giờ.' : 'Em không đang làm bài — không thêm giờ.' }
  const hanCu = String(luot.het_gio_luc ?? '')
  const hanCuMs = Date.parse(hanCu)
  const vaoMs = Date.parse(String(luot.vao_luc ?? ''))
  if (!Number.isFinite(hanCuMs) || !Number.isFinite(vaoMs)) return { ok: false, error: 'Lượt của em chưa có hạn giờ đọc được.' }
  const goc = Date.parse(mocHetGio(ca as unknown as Parameters<typeof mocHetGio>[0], vaoMs))
  const daThem = Number.isFinite(goc) ? Math.max(0, Math.round((hanCuMs - goc) / 60000)) : 0
  if (daThem + phut > PHUT_THEM_EM_TOI_DA) {
    return { ok: false, error: `Em này đã được thêm ${daThem} phút. Thêm ${phut} phút nữa sẽ vượt trần ${PHUT_THEM_EM_TOI_DA} phút mỗi em.` }
  }
  const hanMoi = new Date(hanCuMs + phut * 60000).toISOString()
  const r = await env.DB.prepare(
    `UPDATE luot SET het_gio_luc = ?, cap_nhat_luc = ? WHERE khoa = ? AND het_gio_luc = ? AND trang_thai IN ('dang_lam', 'khoa')
      AND EXISTS (SELECT 1 FROM ca WHERE ma_ca = ? AND trang_thai = 'mo')`,
  ).bind(hanMoi, new Date(nowMs).toISOString(), String(luot.khoa), hanCu, maCa).run()
  if (!(Number(r.meta?.changes) > 0)) {
    return { ok: false, error: 'Giờ của em vừa đổi ở nơi khác (em nộp bài, thầy thêm phút…). Chưa cộng gì — thầy xem lại rồi bấm lại.', thuLai: true }
  }
  xoaDemHetGioLuot(maCa) // bỏ đệm hạn giờ lượt ⇒ nhịp kế tiếp của em đọc hạn mới
  return { ok: true, phut, sbd, hetGioLuc: hanMoi, themPhutEm: daThem + phut }
}
