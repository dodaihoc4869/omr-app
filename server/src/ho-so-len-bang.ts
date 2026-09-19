// HỒ SƠ NẮM KIẾN THỨC CHO BUỔI CHỮA (Gọi lên bảng) — GĐ 6 phần máy chủ, theo docs/hop-dong-ho-so-len-bang-1909.md (Code 1).
//
// `hoSoLopLenBang` nhận thêm `dsQid` (các câu của buổi chữa) và trả thêm `em[sbd].namKt[qid]`. Đúng 3 truy vấn D1, mỗi cái MỘT hoặc HAI tham số
// `json_each(?)` (bẫy D1: ≤ 100 tham số):
//   1. `nam_kt_cau`   theo (em, qid)              → lanSai, trangThai, canDayLai, maDang
//   2. `game_v2_question` theo qid                → mã dạng cho câu em CHƯA gặp (độ phủ đo 19/09: 99,9%)
//   3. `nam_kt_dang`  theo (em, mã dạng thu được) → bậc + số liệu dạng
// Thiếu bảng (D1 chưa migration, fixture cũ) hoặc lỗi bất kỳ → trả `null`: KHÔNG có `namKt`, các trường cũ vẫn ra (máy thầy chạy như trước 19/09).
import type { Env } from './kieu'
import { TEN_BAC_DANG } from './ho-so-cau-hinh'

type Row = Record<string, unknown>

export const TOI_DA_QID_LEN_BANG = 200
export const DAI_QID_LEN_BANG = 80

export interface NamKtCauMayChu {
  lanSai: number
  trangThai: 'chua_thay_sai' | 'moi_sai' | 'dang_on' | 'da_khac_phuc' | null
  canDayLai: boolean
  maDang: string | null
  bac: 'biet' | 'hieu' | 'van_dung' | null
  dang: { soGap: number; soDaKhacPhuc: number; soChuaThaySai: number } | null
}

/** `dsQid` do máy thầy gửi: chỉ chữ, bỏ rỗng/trùng/quá 80 ký tự, cắt ở 200. Không phải mảng ⇒ rỗng ⇒ không trả `namKt` (đúng đời cũ). */
export function docDsQid(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  const ra: string[] = []
  const thay = new Set<string>()
  for (const x of v) {
    const q = typeof x === 'string' ? x.trim() : ''
    if (!q || q.length > DAI_QID_LEN_BANG || thay.has(q)) continue
    thay.add(q)
    ra.push(q)
    if (ra.length >= TOI_DA_QID_LEN_BANG) break
  }
  return ra
}

const TRANG_THAI = new Set(['chua_thay_sai', 'moi_sai', 'dang_on', 'da_khac_phuc'])

export async function docNamKtChoLop(env: Env, dsSbd: string[], dsQid: string[]): Promise<Map<string, Record<string, NamKtCauMayChu>> | null> {
  if (dsSbd.length === 0 || dsQid.length === 0) return null
  try {
    const sbd = JSON.stringify(dsSbd)
    const qid = JSON.stringify(dsQid)
    const [rc, rk] = await Promise.all([
      env.DB.prepare(
        `SELECT sbd, qid, ma_dang, lan_sai, trang_thai, can_day_lai FROM nam_kt_cau
          WHERE sbd IN (SELECT value FROM json_each(?)) AND qid IN (SELECT value FROM json_each(?))`,
      ).bind(sbd, qid).all<Row>(),
      env.DB.prepare('SELECT qid, dang FROM game_v2_question WHERE dang IS NOT NULL AND qid IN (SELECT value FROM json_each(?))').bind(qid).all<Row>(),
    ])
    const cauEm = new Map((rc.results ?? []).map((x) => [`${x.sbd}|${x.qid}`, x]))
    const dangKho = new Map<string, string>()
    for (const x of rk.results ?? []) if (x.dang && !dangKho.has(String(x.qid))) dangKho.set(String(x.qid), String(x.dang))

    const maDangCan = new Set<string>()
    for (const x of rc.results ?? []) if (x.ma_dang) maDangCan.add(String(x.ma_dang))
    for (const d of dangKho.values()) maDangCan.add(d)
    const dangEm = new Map<string, Row>()
    if (maDangCan.size > 0) {
      const rd = await env.DB.prepare(
        `SELECT sbd, ma_dang, so_gap, so_da_khac_phuc, so_chua_thay_sai, bac FROM nam_kt_dang
          WHERE sbd IN (SELECT value FROM json_each(?)) AND ma_dang IN (SELECT value FROM json_each(?))`,
      ).bind(sbd, JSON.stringify([...maDangCan])).all<Row>()
      for (const x of rd.results ?? []) dangEm.set(`${x.sbd}|${x.ma_dang}`, x)
    }

    const ra = new Map<string, Record<string, NamKtCauMayChu>>()
    for (const s of dsSbd) {
      const muc: Record<string, NamKtCauMayChu> = {}
      for (const q of dsQid) {
        const c = cauEm.get(`${s}|${q}`)
        // Dòng câu → mã dạng của chính dòng ấy (đã có `CD:` khi thiếu mã); chưa gặp → tra chỉ mục game; thiếu nữa → null.
        const maDang = c?.ma_dang ? String(c.ma_dang) : dangKho.get(q) ?? null
        const d = maDang ? dangEm.get(`${s}|${maDang}`) : undefined
        if (!c && !d) continue // không có gì để nói ⇒ KHÔNG có khoá (không ghi mục rỗng)
        const tt = c ? String(c.trang_thai) : null
        const bac = d ? TEN_BAC_DANG[Number(d.bac)] : undefined
        muc[q] = {
          lanSai: c ? Number(c.lan_sai) || 0 : 0,
          trangThai: tt !== null && TRANG_THAI.has(tt) ? (tt as NamKtCauMayChu['trangThai']) : null,
          canDayLai: c ? Number(c.can_day_lai) === 1 : false,
          maDang,
          bac: bac ?? null,
          dang: d ? { soGap: Number(d.so_gap) || 0, soDaKhacPhuc: Number(d.so_da_khac_phuc) || 0, soChuaThaySai: Number(d.so_chua_thay_sai) || 0 } : null,
        }
      }
      ra.set(s, muc)
    }
    return ra
  } catch (e) {
    if (!/no such (table|column)/i.test(e instanceof Error ? e.message : String(e))) console.error('[ho-so-lop] namKt lỗi (bỏ qua, các trường cũ vẫn trả):', e)
    return null
  }
}
