// TÊN LỚP (thầy lệnh 21/09/2026, Boss chốt; hợp đồng docs/hop-dong-ten-lop-2109.md — Code 3 ↔ Code 4).
// `hoc_sinh.lop` GIỮ NGUYÊN = KHỐI ('10' | '11' | '12', dùng ở cổng vào thi và nhiều nơi). `hoc_sinh.ten_lop` (thêm mới, migration-2109-ten-lop.sql) = tên lớp thầy đặt, ví dụ "12 - Tinh Hoa".
// Chưa gán (NULL/rỗng) ⇒ mặc định THEO KHỐI: khối 12 ⇒ "12 - Lớp Thường"; khối khác ⇒ chính khối; khối rỗng ⇒ "Chưa xếp lớp". Mỗi em đúng MỘT lớp.
//   · `/gv/lop`         ĐỌC-CHỈ: [{tenLop, khoi, soEm, sbd[]}] — em = hồ sơ (`hoc_sinh`, trừ đã khoá) ∪ danh sách cổng (`danh_sach`); ≤ 3 truy vấn.
//   · `/gv/doi-lop-em`  GHI: đổi tên lớp MỘT em (chỉ `ten_lop`, không đụng `lop`, không đụng `cap_nhat_luc`).
//   · `docBangTenLop`   cho `/em/danh-sach` và `listStudents` thêm trường `tenLop` (vắng cột ⇒ null ⇒ không thêm trường, không bịa).
import type { Env } from './kieu'

type Dong = Record<string, unknown>
const chuoi = (v: unknown): string => (v === null || v === undefined ? '' : String(v)).trim()

export const TEN_LOP_TOI_DA = 40
export const TEN_LOP_THUONG_12 = '12 - Lớp Thường'
export const TEN_LOP_CHUA_XEP = 'Chưa xếp lớp'

/** Tên lớp mặc định theo khối. */
export function macDinhTenLop(khoi: unknown): string {
  const k = chuoi(khoi)
  if (k === '12') return TEN_LOP_THUONG_12
  return k || TEN_LOP_CHUA_XEP
}
/** Tên lớp hiệu lực của một em: đã gán thì dùng, không thì mặc định theo khối. */
export const tenLopCuaEm = (khoi: unknown, tenLop: unknown): string => chuoi(tenLop) || macDinhTenLop(khoi)

/** Chuẩn hoá tên lớp thầy gõ: gộp khoảng trắng, ≤ 40 ký tự, không rỗng, không ký tự điều khiển / dấu < >. */
export function chuanTenLop(v: unknown): { ok: true; ten: string } | { ok: false; error: string } {
  if (typeof v !== 'string') return { ok: false, error: 'Thiếu tên lớp.' }
  const ten = v.replace(/\s+/g, ' ').trim()
  if (!ten) return { ok: false, error: 'Tên lớp không được để trống.' }
  if ([...ten].length > TEN_LOP_TOI_DA) return { ok: false, error: `Tên lớp tối đa ${TEN_LOP_TOI_DA} ký tự.` }
  if (/[\u0000-\u001f\u007f<>]/.test(ten)) return { ok: false, error: 'Tên lớp có ký tự không hợp lệ.' }
  return { ok: true, ten }
}

/** sbd → `ten_lop` ĐÃ GÁN (bỏ dòng NULL/rỗng). `null` khi chưa có cột (Worker lên trước migration) — nơi dùng thì không thêm trường. */
export async function docBangTenLop(env: Env): Promise<Map<string, string> | null> {
  try {
    const r = await env.DB.prepare("SELECT sbd, ten_lop FROM hoc_sinh WHERE ten_lop IS NOT NULL AND TRIM(ten_lop) <> ''").all<Dong>()
    return new Map((r.results ?? []).map((x) => [chuoi(x.sbd), chuoi(x.ten_lop)]))
  } catch {
    return null
  }
}

const soKhoi = (k: string): number => (/^\d+$/.test(k) ? Number(k) : -1)

/** `POST /gv/lop {}` (thầy, ĐỌC-CHỈ). */
export async function gvLop(env: Env): Promise<Dong> {
  let n = 0
  const hoi = async (sql: string): Promise<Dong[] | null> => {
    n++
    try {
      return ((await env.DB.prepare(sql).all<Dong>()).results ?? []) as Dong[]
    } catch {
      return null
    }
  }
  let coCot = true
  let hs = await hoi("SELECT sbd, lop, ten_lop FROM hoc_sinh WHERE COALESCE(trang_thai, '') <> 'khoa'")
  if (!hs) {
    coCot = false
    hs = await hoi("SELECT sbd, lop, NULL AS ten_lop FROM hoc_sinh WHERE COALESCE(trang_thai, '') <> 'khoa'")
  }
  if (!hs) return { ok: false, error: 'Không đọc được danh sách học sinh.', soTruyVan: n }
  const ds = (await hoi('SELECT sbd, lop FROM danh_sach')) ?? []
  const em = new Map<string, { khoi: string; tenLop: string }>()
  for (const x of hs) {
    const sbd = chuoi(x.sbd)
    if (sbd) em.set(sbd, { khoi: chuoi(x.lop), tenLop: tenLopCuaEm(x.lop, x.ten_lop) })
  }
  for (const x of ds) {
    const sbd = chuoi(x.sbd)
    if (sbd && !em.has(sbd)) em.set(sbd, { khoi: chuoi(x.lop), tenLop: macDinhTenLop(x.lop) })
  }
  const nhom = new Map<string, { khoi: Map<string, number>; sbd: string[] }>()
  for (const [sbd, e] of em) {
    const g = nhom.get(e.tenLop) ?? { khoi: new Map<string, number>(), sbd: [] }
    g.khoi.set(e.khoi, (g.khoi.get(e.khoi) ?? 0) + 1)
    g.sbd.push(sbd)
    nhom.set(e.tenLop, g)
  }
  const lop = [...nhom].map(([tenLop, g]) => ({
    tenLop,
    // khối = khối đông nhất trong lớp (hoà: khối lớn hơn)
    khoi: [...g.khoi].sort((a, b) => b[1] - a[1] || soKhoi(b[0]) - soKhoi(a[0]))[0]![0],
    soEm: g.sbd.length,
    sbd: g.sbd.sort(),
  })).sort((a, b) => soKhoi(b.khoi) - soKhoi(a.khoi) || a.tenLop.localeCompare(b.tenLop, 'vi'))
  return { ok: true, lop, soEm: em.size, ...(coCot ? {} : { lyDoThieu: 'Chưa có cột ten_lop (chưa chạy migration): mọi em ở lớp mặc định theo khối.' }), soTruyVan: n }
}

/** `POST /gv/doi-lop-em {sbd, tenLop}` (thầy, GHI): đổi tên lớp MỘT em. Từ chối bằng lời tiếng Việt. */
export async function gvDoiLopEm(env: Env, b: Dong): Promise<Dong> {
  const sbd = chuoi(b.sbd)
  if (!sbd) return { ok: false, error: 'Thiếu số báo danh.' }
  const t = chuanTenLop(b.tenLop)
  if (!t.ok) return { ok: false, error: t.error }
  let doi = 0
  try {
    const r = await env.DB.prepare('UPDATE hoc_sinh SET ten_lop = ? WHERE sbd = ?').bind(t.ten, sbd).run()
    doi = r.meta?.changes ?? 0
  } catch {
    return { ok: false, error: 'Chưa cập nhật cơ sở dữ liệu (thiếu cột tên lớp). Chưa đổi được tên lớp.' }
  }
  if (doi > 0) return { ok: true, sbd, tenLop: t.ten }
  const conTrongDanhSach = await env.DB.prepare('SELECT 1 AS x FROM danh_sach WHERE sbd = ?').bind(sbd).first<Dong>().catch(() => null)
  return { ok: false, error: conTrongDanhSach ? 'Em này chưa có hồ sơ tài khoản nên chưa đổi được tên lớp.' : `Không tìm thấy học sinh có số báo danh ${sbd}.` }
}
