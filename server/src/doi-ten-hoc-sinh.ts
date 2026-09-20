// `POST /hoc-sinh/doi-ten {sbd, hoTen}` — LỆNH THẦY: đổi TÊN MỘT học sinh (docs/hop-dong-doi-ten-hoc-sinh-2109.md mục 1; thầy lệnh 21/09).
//
// CHỈ cột tên, theo đúng `sbd`, trong năm bảng mà app đọc: `danh_sach` (cổng vào thi, hồ sơ app thầy), `hoc_sinh` (app học sinh/phụ huynh, vinh danh, game), và các bản chép
// `luot`, `btvn_em`, `phong_cho` (màn ca đọc `COALESCE(l.ho_ten, d.ho_ten)`: không sửa `luot` thì ca cũ vẫn hiện tên sai). Bản chép chỉ sửa ở dòng ĐÃ có tên (dòng trống vẫn
// rơi về `danh_sach`, không biến NULL thành tên). KHÔNG đụng: `phieu` và `chan_vao` (sổ và nhật ký đã phát: giữ nguyên lịch sử), `phu_huynh` (tên phụ huynh), SBD, lớp, năm sinh,
// mật khẩu, điểm, mọi thứ khác. Bảng hoặc cột chưa có thì bỏ qua bảng đó. Tên mới trùng tên hiện tại ở MỌI nơi thì từ chối, không ghi.
import type { D1PreparedStatement, Env } from './kieu'

export const TEN_TOI_THIEU = 2
export const TEN_TOI_DA = 60

interface BangTen {
  ten: 'danh_sach' | 'hoc_sinh' | 'luot' | 'btvn_em' | 'phong_cho'
  /** Bản chép: chỉ sửa dòng ĐÃ có tên. */
  banChep: boolean
}
const BANG: readonly BangTen[] = [
  { ten: 'danh_sach', banChep: false },
  { ten: 'hoc_sinh', banChep: false },
  { ten: 'luot', banChep: true },
  { ten: 'btvn_em', banChep: true },
  { ten: 'phong_cho', banChep: true },
]

/** Tên hợp lệ sau chuẩn hoá (NFC, gộp khoảng trắng, cắt đầu/cuối, 2..60 ký tự, không ký tự điều khiển/định dạng), hoặc null. */
export function chuanHoaTen(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const t = v.normalize('NFC').replace(/\s+/g, ' ').trim()
  if (/[\p{Cc}\p{Cf}]/u.test(t)) return null
  const dai = [...t].length
  return dai >= TEN_TOI_THIEU && dai <= TEN_TOI_DA ? t : null
}

const dieuKien = (b: BangTen): string => (b.banChep ? "sbd = ? AND COALESCE(ho_ten, '') <> '' AND ho_ten <> ?" : "sbd = ? AND COALESCE(ho_ten, '') <> ?")

async function thu<T>(f: () => Promise<T>): Promise<T | null> {
  try {
    return await f()
  } catch (e) {
    if (/no such (table|column)/i.test(e instanceof Error ? e.message : String(e))) return null
    throw e
  }
}

export async function doiTenHocSinh(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sbd = String(b.sbd ?? '').trim()
  if (!sbd || sbd.length > 40) return { ok: false, error: 'Thiếu số báo danh.' }
  const tenMoi = chuanHoaTen(b.hoTen)
  if (tenMoi === null) return { ok: false, error: `Tên phải dài từ ${TEN_TOI_THIEU} đến ${TEN_TOI_DA} ký tự và không có ký tự lạ.` }

  // Em có thật (danh_sach hoặc hoc_sinh) và tên hiện tại.
  const ds = await thu(() => env.DB.prepare('SELECT ho_ten FROM danh_sach WHERE sbd = ?').bind(sbd).first<{ ho_ten: string | null }>())
  const hs = await thu(() => env.DB.prepare('SELECT ho_ten FROM hoc_sinh WHERE sbd = ?').bind(sbd).first<{ ho_ten: string | null }>())
  if (!ds && !hs) return { ok: false, error: 'Không tìm thấy học sinh có số báo danh này.' }
  const tenCu = String(ds?.ho_ten ?? '').trim() || String(hs?.ho_ten ?? '').trim()

  // Số dòng cần đổi ở từng bảng (bảng/cột chưa có ⇒ null ⇒ bỏ qua).
  const can: Record<string, number | null> = {}
  for (const t of BANG) {
    const r = await thu(() => env.DB.prepare(`SELECT COUNT(*) AS n FROM ${t.ten} WHERE ${dieuKien(t)}`).bind(sbd, tenMoi).first<{ n: number }>())
    can[t.ten] = r === null ? null : Number(r.n) || 0
  }
  if (BANG.every((t) => !can[t.ten])) return { ok: false, khongDoi: true, error: 'Tên mới trùng tên hiện tại của em, không có gì để đổi.' }

  const lam = BANG.filter((t) => (can[t.ten] ?? 0) > 0)
  const cau: D1PreparedStatement[] = lam.map((t) => env.DB.prepare(`UPDATE ${t.ten} SET ho_ten = ? WHERE ${dieuKien(t)}`).bind(tenMoi, sbd, tenMoi))
  const kq = await env.DB.batch(cau)
  const soDong: Record<string, number> = Object.fromEntries(BANG.map((t) => [t.ten, 0]))
  lam.forEach((t, i) => { soDong[t.ten] = Number(kq[i]?.meta?.changes) || 0 })
  return { ok: true, sbd, tenCu, tenMoi, soDong }
}
