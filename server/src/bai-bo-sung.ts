// BÀI BỔ SUNG — đáp án em làm trên máy nhưng tới máy chủ SAU KHI lượt đã đóng (thầy 01/10: "xử lý câu trả lời ngắn để trống,
// để lần sau kiểm tra không học sinh nào bị như vậy nữa").
//
// Ca 313224 (01/10): ba em 12007, 12026, 12049 ngừng liên lạc với máy chủ ~3 phút sau giờ thi (trang thi tắt / mất mạng). Đáp án
// vẫn được máy em lưu từng lần chạm, nhưng lượt bị chốt bằng bản lưu tạm cuối ⇒ mọi câu sau đó hiện "bỏ trống". Khi máy em gửi lại,
// `/nop` thấy lượt đã đóng ⇒ trả "đã nhận" và VỨT đáp án đi; máy em tưởng đã nộp xong.
//
// Nay: đáp án tới sau khi đóng mà KHÁC bản máy chủ đang giữ ⇒ cất vào `bai_bo_sung` (trạng thái `cho`). Điểm KHÔNG tự đổi —
// thầy xem rồi bấm Nhận (gộp vào bài + chấm lại ca bằng luật hiện hành) hoặc Bỏ. Em không thể lợi dụng để sửa bài sau giờ.
// Bảng CHỈ THÊM, tự tạo lần đầu dùng (cùng cách bi-a.ts); bản SQL: server/migration-0110-bai-bo-sung.sql.
import type { Env } from './kieu'

const TAO_BANG = [
  `CREATE TABLE IF NOT EXISTS bai_bo_sung (
    khoa TEXT PRIMARY KEY, ma_ca TEXT NOT NULL, sbd TEXT NOT NULL, lan_thu INTEGER NOT NULL,
    dap_an_json TEXT NOT NULL, giay_cau_json TEXT, so_cau_moi INTEGER NOT NULL DEFAULT 0,
    gui_luc TEXT NOT NULL, trang_thai TEXT NOT NULL DEFAULT 'cho', xu_ly_luc TEXT)`,
  'CREATE INDEX IF NOT EXISTS idx_bai_bo_sung_ca ON bai_bo_sung (ma_ca, trang_thai)',
]
let daTao = false
export async function damBaoBangBoSung(env: Env): Promise<void> {
  if (daTao) return
  await env.DB.batch(TAO_BANG.map((s) => env.DB.prepare(s)))
  daTao = true
}

type BaiLam = { phanI?: Record<string, unknown>; phanII?: Record<string, unknown>; phanIII?: Record<string, unknown> }

function docBai(v: unknown): BaiLam {
  if (typeof v === 'string') {
    try { return (JSON.parse(v) ?? {}) as BaiLam } catch { return {} }
  }
  return v && typeof v === 'object' ? (v as BaiLam) : {}
}
const coChu = (x: unknown) => typeof x === 'string' ? x.trim() !== '' : x !== null && x !== undefined
const chuoi = (x: unknown) => (typeof x === 'string' ? x.trim() : x == null ? '' : String(x))

/** Số câu bài MỚI có trả lời mà bài CŨ không có hoặc khác. Phần II: tính một câu khi có ý mới/khác. */
export function demCauMoi(cuV: unknown, moiV: unknown): number {
  const cu = docBai(cuV), moi = docBai(moiV)
  let n = 0
  for (const p of ['phanI', 'phanIII'] as const) {
    for (const [qid, v] of Object.entries(moi[p] ?? {})) if (coChu(v) && chuoi(v) !== chuoi(cu[p]?.[qid])) n++
  }
  for (const [qid, v] of Object.entries(moi.phanII ?? {})) {
    if (!Array.isArray(v)) continue
    const c = Array.isArray(cu.phanII?.[qid]) ? (cu.phanII![qid] as unknown[]) : []
    if (v.some((y, i) => coChu(y) && chuoi(y) !== chuoi(c[i]))) n++
  }
  return n
}

/** Gộp: lấy bài cũ, ô nào bài bổ sung CÓ trả lời thì lấy bài bổ sung (bổ sung là toàn bộ bài trên máy em). */
export function gopBai(cuV: unknown, moiV: unknown): BaiLam {
  const cu = docBai(cuV), moi = docBai(moiV)
  const ra: BaiLam = { phanI: { ...(cu.phanI ?? {}) }, phanII: { ...(cu.phanII ?? {}) }, phanIII: { ...(cu.phanIII ?? {}) } }
  for (const p of ['phanI', 'phanIII'] as const) for (const [qid, v] of Object.entries(moi[p] ?? {})) if (coChu(v)) ra[p]![qid] = v
  for (const [qid, v] of Object.entries(moi.phanII ?? {})) {
    if (!Array.isArray(v)) continue
    const c = Array.isArray(ra.phanII![qid]) ? [...(ra.phanII![qid] as unknown[])] : [null, null, null, null]
    v.forEach((y, i) => { if (coChu(y)) c[i] = y })
    ra.phanII![qid] = c
  }
  return ra
}

/** DẤU «THẦY KẾT THÚC CA ĐÓNG HỘ» (thầy 04/11: «Khi bấm kết thúc ca thì nhiều hs ko chấm chuẩn bị mất câu phải bấm nhận chấm lại»): lượt `dang_lam` bị
 *  đóng bởi nút Kết thúc ca (goi-cu.ts `khoaCa`, index.ts sửa ca `khoaLuot`) mang `integrity_json.dongBoi = 'khoa'` — em CHƯA tự nộp. */
export const SQL_DAU_KHOA = `integrity_json = json_set(COALESCE(NULLIF(integrity_json, ''), '{}'), '$.dongBoi', 'khoa')`
/** Cửa nhận bài máy em gửi tới SAU khi thầy kết thúc ca (giây): máy em tự nộp khi hết giờ / lưu tạm 20 giây một nhịp — bài tới trong vài giây, mạng chậm vài
 *  chục giây. Giữ HẸP (90 giây): bài tới muộn hơn có thể có câu làm sau giờ ⇒ vẫn là bài bổ sung chờ thầy duyệt (em không lợi dụng sửa bài sau giờ được). */
export const GIAY_NHAN_SAU_KHOA = 90

/**
 * `/nop` tới khi lượt ĐÃ đóng. Lượt do thầy KẾT THÚC CA đóng hộ (dấu `SQL_DAU_KHOA`) và bài tới trong `GIAY_NHAN_SAU_KHOA` giây ⇒ NHẬN THẲNG vào bài
 * (gộp bản lưu tạm + bài máy em, máy em thắng ô nào có trả lời), xoá điểm cũ ⇒ cron chấm bù (cham-bu.ts) chấm lại ngay lượt sau — không còn «bài bổ sung chờ
 * duyệt», thầy không phải bấm Nhận. Một lần duy nhất (lần nhận xoá dấu). Quá cửa / lượt em tự nộp / bị khoá ⇒ như cũ: cất bài bổ sung chờ thầy duyệt
 * (01/10 — ca 313224 ba em mất mọi câu làm sau khi máy ngừng liên lạc; em không thể lợi dụng để sửa bài sau giờ).
 */
export async function nhanSauKhoaHoacBoSung(
  env: Env,
  d: { khoa?: string; ma_ca?: string; sbd?: string; lan_thu?: number; dap_an_json?: unknown; nop_luc?: string | null; integrity_json?: string | null; trang_thai?: string },
  b: Record<string, unknown>,
  nowMs = Date.now(),
): Promise<{ nhan: boolean; boSung: number }> {
  if (!d.khoa) return { nhan: false, boSung: 0 }
  let dau = ''
  try { dau = String((JSON.parse(String(d.integrity_json ?? '')) as { dongBoi?: unknown })?.dongBoi ?? '') } catch { /* không dấu */ }
  const tre = nowMs - Date.parse(String(d.nop_luc ?? ''))
  if (d.trang_thai === 'da_nop' && dau === 'khoa' && b.dapAn && typeof b.dapAn === 'object' && tre >= 0 && tre <= GIAY_NHAN_SAU_KHOA * 1000) {
    const it = (b.integrity && typeof b.integrity === 'object' ? b.integrity : {}) as { leaveCount?: unknown; totalHiddenMs?: unknown }
    const r = await env.DB.prepare(
      // `nop_luc` = lúc nhận: màn Theo dõi của thầy nhận diện lượt đã ghi điểm theo (sbd, lần, nop_luc) ⇒ thấy lượt «mới» và CHẤM LẠI theo bài đã gộp — kể cả khi
      // lượt ghi điểm theo bản lưu tạm của chính màn ấy (vừa bấm Kết thúc) tới máy chủ SAU lượt nhận này. Màn đã đóng ⇒ `tong` NULL ⇒ cron chấm bù chấm.
      `UPDATE luot SET dap_an_json = ?, giay_cau_json = COALESCE(?, giay_cau_json), integrity_json = ?, so_lan_roi_man = ?, tong_giay_roi_man = ?,
         nop_luc = ?, da_day_sheet = 0, tong = NULL, diem_i = NULL, diem_ii = NULL, diem_iii = NULL, cap_nhat_luc = ?
       WHERE khoa = ? AND trang_thai = 'da_nop' AND json_extract(integrity_json, '$.dongBoi') = 'khoa'`,
    ).bind(
      JSON.stringify(gopBai(d.dap_an_json, b.dapAn)), b.giayCau ? JSON.stringify(b.giayCau) : null, JSON.stringify({ ...it, nopSauKhoa: true, khoaLuc: d.nop_luc }),
      Number(it.leaveCount ?? 0) || 0, Math.round(Number(it.totalHiddenMs ?? 0) / 1000) || 0, new Date(nowMs).toISOString(), new Date(nowMs).toISOString(), d.khoa,
    ).run().catch(() => null)
    if (r && Number(r.meta?.changes ?? 0) > 0) return { nhan: true, boSung: 0 }
  }
  return { nhan: false, boSung: await catBaiBoSung(env, { khoa: d.khoa, ma_ca: String(d.ma_ca ?? ''), sbd: String(d.sbd ?? ''), lan_thu: Number(d.lan_thu) || 1, dap_an_json: d.dap_an_json }, b.dapAn, b.giayCau) }
}

/** Gọi từ `/nop` khi lượt ĐÃ đóng. Trả số câu mới đã cất (0 = bài trùng, không cất). Không bao giờ ném lỗi. */
export async function catBaiBoSung(
  env: Env,
  luot: { khoa: string; ma_ca: string; sbd: string; lan_thu: number; dap_an_json: unknown },
  dapAn: unknown,
  giayCau: unknown,
): Promise<number> {
  try {
    if (!dapAn || typeof dapAn !== 'object') return 0
    const n = demCauMoi(luot.dap_an_json, dapAn)
    if (n === 0) return 0
    await damBaoBangBoSung(env)
    await env.DB.prepare(
      `INSERT INTO bai_bo_sung (khoa, ma_ca, sbd, lan_thu, dap_an_json, giay_cau_json, so_cau_moi, gui_luc, trang_thai)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'cho')
       ON CONFLICT(khoa) DO UPDATE SET dap_an_json = excluded.dap_an_json, giay_cau_json = excluded.giay_cau_json,
         so_cau_moi = excluded.so_cau_moi, gui_luc = excluded.gui_luc, trang_thai = 'cho', xu_ly_luc = NULL`,
    ).bind(luot.khoa, luot.ma_ca, luot.sbd, luot.lan_thu, JSON.stringify(dapAn), giayCau ? JSON.stringify(giayCau) : null, n, new Date().toISOString()).run()
    return n
  } catch {
    return 0
  }
}

/** `/bo-sung/ds {maCa?}` (thầy) — bài bổ sung CHỜ duyệt (một ca, hoặc mọi ca). */
export async function dsBaiBoSung(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  await damBaoBangBoSung(env)
  const maCa = String(b.maCa ?? '').trim()
  const r = await env.DB.prepare(
    `SELECT s.khoa, s.ma_ca, s.sbd, s.lan_thu, s.so_cau_moi, s.gui_luc, l.ho_ten, l.nop_luc, c.ten_ca
       FROM bai_bo_sung s LEFT JOIN luot l ON l.khoa = s.khoa LEFT JOIN ca c ON c.ma_ca = s.ma_ca
      WHERE s.trang_thai = 'cho'${maCa ? ' AND s.ma_ca = ?' : ''} ORDER BY s.gui_luc DESC LIMIT 200`,
  ).bind(...(maCa ? [maCa] : [])).all<Record<string, unknown>>()
  const ds = (r.results ?? []).map((x) => ({
    khoa: String(x.khoa), maCa: String(x.ma_ca), tenCa: String(x.ten_ca ?? ''), sbd: String(x.sbd), hoTen: String(x.ho_ten ?? ''),
    lanThu: Number(x.lan_thu) || 1, soCauMoi: Number(x.so_cau_moi) || 0, guiLuc: String(x.gui_luc ?? ''), nopLuc: String(x.nop_luc ?? ''),
  }))
  return { ok: true, ds }
}

/** `/bo-sung/xu-ly {khoa, nhan}` (thầy). Nhận ⇒ gộp vào `luot.dap_an_json`; chỗ gọi chấm lại ca. Bỏ ⇒ chỉ đánh dấu. */
export async function xuLyBaiBoSung(env: Env, b: Record<string, unknown>): Promise<{ ok: boolean; error?: string; maCa?: string; nhan?: boolean }> {
  await damBaoBangBoSung(env)
  const khoa = String(b.khoa ?? '').trim()
  if (!khoa) return { ok: false, error: 'Thiếu khoá bài bổ sung' }
  const nhan = b.nhan === true
  const s = await env.DB.prepare(`SELECT s.ma_ca, s.dap_an_json AS moi, s.giay_cau_json, s.trang_thai, l.dap_an_json AS cu
    FROM bai_bo_sung s LEFT JOIN luot l ON l.khoa = s.khoa WHERE s.khoa = ?`).bind(khoa).first<Record<string, unknown>>()
  if (!s) return { ok: false, error: 'Không tìm thấy bài bổ sung' }
  if (s.trang_thai !== 'cho') return { ok: false, error: 'Bài bổ sung này đã xử lý rồi' }
  const nay = new Date().toISOString()
  const xong = env.DB.prepare('UPDATE bai_bo_sung SET trang_thai = ?, xu_ly_luc = ? WHERE khoa = ?').bind(nhan ? 'nhan' : 'bo', nay, khoa)
  if (!nhan) {
    await xong.run()
    return { ok: true, maCa: String(s.ma_ca), nhan: false }
  }
  await env.DB.batch([
    env.DB.prepare(
      `UPDATE luot SET dap_an_json = ?, giay_cau_json = COALESCE(?, giay_cau_json), da_day_sheet = 0, cap_nhat_luc = ?,
         ghi_chu = TRIM(COALESCE(ghi_chu, '') || ' · thầy nhận bài bổ sung ' || ?)
       WHERE khoa = ?`,
    ).bind(JSON.stringify(gopBai(s.cu, s.moi)), s.giay_cau_json ?? null, nay, nay.slice(0, 16), khoa),
    xong,
  ])
  return { ok: true, maCa: String(s.ma_ca), nhan: true }
}
