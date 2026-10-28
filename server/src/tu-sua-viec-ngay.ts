// VIỆC HÔM NAY CỦA TỰ SỬA LỖI TRÊN MÁY CHỦ (thầy duyệt 28/10 «sửa theo đề xuất»): 12 câu của ngày theo SBD + ngày VN ⇒ đổi máy vẫn cùng 12 câu.
// Máy em vẫn tự chọn câu (src/lib/tu-sua-viec-hom-nay.ts, localStorage là bản đệm); máy chủ chỉ GIỮ bản đã chọn và gộp:
//   · ĐỌC: một câu CÙNG lô đọc của `danhSach` (mở Tự sửa lỗi / số trên nút Lộ trình) — không thêm đợt chờ D1. Kèm các đợt em đã KHÉP hôm nay ở màn sửa câu
//     (chua_gon_lan: đúng, hoặc đã hết 2 lần) ⇒ máy khác cũng thấy câu ấy «xong phần».
//   · GHI: POST /hs/chua-cau-sai/viec-ngay {token, ngay, m, x, them} — chạy nền (máy em không chờ). Danh sách DÀI hơn thắng (thêm chặng), «đã xong» gộp hợp,
//     `them` lấy lớn nhất. Chỉ nhận ngày VN hôm nay của máy chủ. Bảng CHỈ-THÊM `tu_sua_viec_ngay` (migration-2810-tu-sua-viec-ngay.sql).
import type { D1PreparedStatement, Env } from './kieu'
import { quyen } from './chua-cau-sai'
import { ngayVn } from './su-kien-hoc'

type Obj = Record<string, unknown>
const str = (v: unknown) => (typeof v === 'string' ? v : '')
const loi = (ma: string, mo: string, status = 400) => Response.json({ ok: false, ma, mo }, { status })
/** Trần cỡ bản lưu: 12 câu + tối đa 12 chặng thêm × 4. */
export const TOI_DA_MUC_NGAY = 60
const LOAI = new Set(['gan', 'dang', 'moi', 'goc'])

export interface MucNgay { q: string; d?: string; t: string; h?: string; l: string }
export interface ViecNgay { n: string; m: MucNgay[]; x: string[]; them: number }

/** Câu đọc (một dòng) cho lô của danhSach: ?1 = sbd, ?2 = ngày VN. Không có bản lưu ⇒ m/x/them null, vẫn có `xg` (đợt đã khép hôm nay). */
export const lenhDocViecNgay = (env: Env, sbd: string, ngay: string): D1PreparedStatement => env.DB.prepare(
  `SELECT v.muc_json AS m, v.xong_json AS x, v.them AS them,
     (SELECT json_group_array(dot_id) FROM (SELECT DISTINCT dot_id FROM chua_gon_lan WHERE sbd=?1 AND ngay_vn=?2 AND (dung=1 OR lan>=2))) AS xg
   FROM (SELECT 1) LEFT JOIN tu_sua_viec_ngay v ON v.sbd=?1 AND v.ngay_vn=?2`).bind(sbd, ngay)

const docMang = (v: unknown): unknown[] => { try { const a = JSON.parse(str(v) || '[]'); return Array.isArray(a) ? a : [] } catch { return [] } }

/** Dòng đọc ⇒ `viecNgay` của phản hồi danh sách (null khi không có gì cho hôm nay). */
export function viecNgayTuDong(d: Obj | undefined, ngay: string): ViecNgay | null {
  if (!d) return null
  const m = chuanMuc(docMang(d.m))
  const x = [...new Set([...docMang(d.x), ...docMang(d.xg)].filter((k): k is string => typeof k === 'string' && !!k && k.length <= 160))]
  if (!m.length && !x.length) return null
  return { n: ngay, m, x, them: Math.max(0, Math.floor(Number(d.them) || 0)) }
}

/** Lọc mục máy em gửi: đúng hình, chuỗi ngắn, không trùng khoá, tối đa TOI_DA_MUC_NGAY. */
export function chuanMuc(ds: unknown[]): MucNgay[] {
  const ra: MucNgay[] = []
  const da = new Set<string>()
  for (const v of ds) {
    if (!v || typeof v !== 'object') continue
    const o = v as Obj
    const q = str(o.q), d = str(o.d), t = str(o.t), h = str(o.h), l = str(o.l)
    if (!q || q.length > 160 || d.length > 160 || !t || t.length > 40 || h.length > 40 || !LOAI.has(l)) continue
    const k = d || q
    if (da.has(k)) continue
    da.add(k)
    ra.push({ q, ...(d ? { d } : {}), t, ...(h ? { h } : {}), l })
    if (ra.length >= TOI_DA_MUC_NGAY) break
  }
  return ra
}

export async function hsGhiViecNgay(env: Env, b: Obj, nowMs: number = Date.now()): Promise<Response> {
  const sbd = await quyen(env, b)
  if (sbd instanceof Response) return sbd
  const ngay = ngayVn(nowMs)
  // Máy em lưu theo ngày của máy em: lệch ngày (qua nửa đêm, đồng hồ sai) ⇒ bỏ, không ghi đè ngày khác.
  if (str(b.ngay) !== ngay) return Response.json({ ok: true, boQua: 'khac_ngay', ngay })
  const m = chuanMuc(Array.isArray(b.m) ? b.m : [])
  const x = [...new Set((Array.isArray(b.x) ? b.x : []).filter((k): k is string => typeof k === 'string' && !!k && k.length <= 160))].slice(0, TOI_DA_MUC_NGAY * 2)
  const them = Math.min(12, Math.max(0, Math.floor(Number(b.them) || 0)))
  if (!m.length && !x.length) return loi('THIEU_THAM_SO', 'Thiếu việc hôm nay.')
  // 28/10 «sửa phải xong mới hiện chặng sau»: máy em báo Lộ trình đang KHOÁ các chặng sau nút Tự sửa lỗi ⇒ ghi một dòng / ngày (giữ lần đầu). Ghi riêng,
  // lỗi (bảng chưa áp) bỏ qua — không làm hỏng bản lưu việc hôm nay.
  if (b.khoa === true) await env.DB.prepare('INSERT OR IGNORE INTO tu_sua_khoa_ngay(sbd,ngay_vn,luc) VALUES(?1,?2,?3)').bind(sbd, ngay, nowMs).run().catch(() => null)
  await env.DB.prepare(`INSERT INTO tu_sua_viec_ngay(sbd,ngay_vn,muc_json,xong_json,them,cap_nhat_luc) VALUES(?1,?2,?3,?4,?5,?6)
    ON CONFLICT(sbd,ngay_vn) DO UPDATE SET
      muc_json=CASE WHEN json_array_length(excluded.muc_json)>json_array_length(tu_sua_viec_ngay.muc_json) THEN excluded.muc_json ELSE tu_sua_viec_ngay.muc_json END,
      xong_json=(SELECT json_group_array(value) FROM (SELECT value FROM json_each(tu_sua_viec_ngay.xong_json) UNION SELECT value FROM json_each(excluded.xong_json))),
      them=MAX(tu_sua_viec_ngay.them,excluded.them),cap_nhat_luc=excluded.cap_nhat_luc`)
    .bind(sbd, ngay, JSON.stringify(m), JSON.stringify(x), them, nowMs).run()
  return Response.json({ ok: true, ngay })
}

// ─────────────────────────── KHOÁ CHẶNG SAU TỰ SỬA LỖI (thầy 28/10 «Tôi muốn sửa phải xong mới hiện chặng sau») ───────────────────────────
// Giả định (ghi trong PR): «xong» = 12 câu ĐẦU của việc hôm nay (phần ngày; «Sửa thêm 1 chặng» nối thêm câu ở CUỐI nên không làm khoá lại) đều đã xong phần
// (khoá đợt / mã câu nằm trong xong_json, hoặc đợt đã khép hôm nay ở chua_gon_lan: đúng, hoặc đã hết 2 lần) — KHÔNG đòi đúng hết.
// Máy chủ chỉ chặn khi máy em đã báo khoá hôm nay (tu_sua_khoa_ngay) ⇒ không bao giờ chặt hơn Lộ trình em đang thấy; thiếu bảng / thiếu dòng ⇒ không chặn.
export const MA_TU_SUA_TRUOC = 'TU_SUA_TRUOC'
export const CHU_TU_SUA_TRUOC = 'Em sửa xong lỗi hôm nay rồi mới mở chặng tiếp nhé.'
export const SO_CAU_PHAN_NGAY = 12
/** Một câu đọc (chạy CÙNG đợt với mật khẩu ở nơi gọi — không thêm đợt chờ D1). ?1 = sbd, ?2 = ngày VN. */
export const lenhDocKhoaSua = (env: Env, sbd: string, ngay: string): D1PreparedStatement => env.DB.prepare(
  `SELECT k.luc AS khoa, v.muc_json AS m, v.xong_json AS x,
     (SELECT json_group_array(dot_id) FROM (SELECT DISTINCT dot_id FROM chua_gon_lan WHERE sbd=?1 AND ngay_vn=?2 AND (dung=1 OR lan>=2))) AS xg
   FROM tu_sua_khoa_ngay k LEFT JOIN tu_sua_viec_ngay v ON v.sbd=k.sbd AND v.ngay_vn=k.ngay_vn WHERE k.sbd=?1 AND k.ngay_vn=?2`).bind(sbd, ngay)
/** Số câu của phần ngày (12 câu đầu) CHƯA xong phần; không có dòng khoá / không có việc hôm nay ⇒ 0 (không chặn). */
export function conPhanNgay(d: Obj | null | undefined): number {
  if (!d || d.khoa === null || d.khoa === undefined) return 0
  const m = chuanMuc(docMang(d.m)).slice(0, SO_CAU_PHAN_NGAY)
  const x = new Set([...docMang(d.x), ...docMang(d.xg)].filter((k): k is string => typeof k === 'string'))
  return m.filter((v) => !x.has(v.d || v.q) && !x.has(v.q)).length
}
/** Đọc + tính (không bao giờ ném: bảng chưa áp ⇒ 0). */
export async function docConPhanKhoa(env: Env, sbd: string, nowMs: number = Date.now()): Promise<number> {
  try { return conPhanNgay(await lenhDocKhoaSua(env, sbd, ngayVn(nowMs)).first<Obj>()) } catch { return 0 }
}
