// THƯỞNG PHẠT phần B — số cho THẦY (bảng thi đua tuần) và PHỤ HUYNH (khối `tuan` của /ph/bao-cao-tuan). Thầy/phụ huynh THẤY nhãn Học thật / Đối phó.
// Mỗi lệnh MỘT batch đọc (tập em tính ngay trong SQL; không vòng chờ nối tiếp). Chuỗi/số bài: thuong-ngay-hoc.ts (= luật chuỗi B3, cùng số với màn học sinh).
import type { Env } from './kieu'
import { ngayVn } from './su-kien-hoc'
import { themNgay } from './ho-so-nam-kt'
import { bacCongKhai, type BacDanhGia } from './danh-gia-hoc-that'
import { SQL_TEN_LOP, chuanHang, docCongTacTuDong, num, sqlCongTac, str, tuanCua, type Hang, type Row } from './thuong-b-chung'
import { SO_NGAY_NHIEU_EM, cauNhatKy, cauNhatKyDs, chuoiCuaEm, gopNhatKy, soBaiNgay } from './thuong-ngay-hoc'
import { SO_NGAY_DOC } from './chuoi-ngay-bai'
import { nguyenTuThat, xepNhom } from './thuong-giai-tuan'
import { tenRutGon } from './thi-dua-hom-nay'

const kq = (r: { results?: unknown[] }[]): Row[][] => r.map((x) => (x.results ?? []) as Row[])
const bacHoacNull = (v: unknown): number | null => (v === null || v === undefined || v === '' ? null : num(v))

// ───────────────────────── THẦY ─────────────────────────

const TAP_EM_LOP = `(SELECT h.sbd FROM hoc_sinh h WHERE COALESCE(h.trang_thai, '') <> 'khoa' AND ${SQL_TEN_LOP('h')} = ?1)`

export interface HocCungGv { ten: string; lop?: string; chuoiDoi: number }
export interface DongThiDuaTuan {
  sbd: string
  ten: string
  nguyenTuThat: number
  nguyenTuLoai: number
  hang: { kl: Hang; thuHang: number | null } | null
  chuoi: number
  nhan: 'Học thật' | 'Đối phó' | null
  bacDuoi: number | null
  hocCung: HocCungGv[]
}

/**
 * `POST /gv/thi-dua-tuan {lop}` (hợp đồng «GET /gv/thi-dua-tuan?lop=»; router chỉ nhận POST, nhận cả `?lop=` trên URL) →
 * `{ok, lop, tuan, ds: DongThiDuaTuan[]}`. Cổng thầy ở router. MỘT batch 8 câu: em của lớp, dòng giải tuần (cả nhóm để xếp thứ hạng), bậc xếp mới nhất,
 * nhật ký chuỗi SO_NGAY_NHIEU_EM ngày (câu · tự sửa · vắng có phép · bình mua), các cặp học cùng.
 */
export async function gvThiDuaTuan(env: Env, b: Row, nowMs: number = Date.now()): Promise<Row> {
  const lop = str(b.lop).slice(0, 60)
  if (!lop) return { ok: false, error: 'Thầy chọn một lớp.' }
  const tuan = tuanCua(nowMs)
  const homNay = ngayVn(nowMs)
  const tu = themNgay(homNay, -SO_NGAY_NHIEU_EM)
  const DB = env.DB
  const batch = await DB.batch([
    DB.prepare(`SELECT h.sbd AS sbd, h.ho_ten AS ho_ten FROM hoc_sinh h WHERE COALESCE(h.trang_thai, '') <> 'khoa' AND ${SQL_TEN_LOP('h')} = ?1`).bind(lop),
    DB.prepare(`SELECT g.em AS em, g.hang AS hang, g.nhom AS nhom, g.nguyen_tu AS nguyen_tu, g.nguyen_tu_ho_tro AS ho_tro, g.vao_luc AS vao_luc, d.bac AS bac
        FROM giai_tuan g LEFT JOIN danh_gia_em_tuan d ON d.sbd = g.em AND d.tuan = g.tuan
       WHERE g.tuan = ?2 AND (g.em IN ${TAP_EM_LOP} OR (g.nhom NOT IN ('', '-') AND g.nhom IN (SELECT nhom FROM giai_tuan WHERE tuan = ?2 AND em IN ${TAP_EM_LOP})))`).bind(lop, tuan),
    DB.prepare(`SELECT d.sbd AS sbd, d.bac AS bac FROM danh_gia_em_tuan d WHERE d.sbd IN ${TAP_EM_LOP} AND d.tuan = (SELECT MAX(tuan) FROM danh_gia_em_tuan WHERE sbd = d.sbd)`).bind(lop),
    ...cauNhatKy(env, TAP_EM_LOP, lop, tu, homNay),
    DB.prepare(`SELECT p.em_a AS em_a, p.em_b AS em_b, p.chuoi_doi AS chuoi_doi, ha.ho_ten AS ten_a, hb.ho_ten AS ten_b, ${SQL_TEN_LOP('ha')} AS lop_a, ${SQL_TEN_LOP('hb')} AS lop_b
        FROM ban_hoc p JOIN hoc_sinh ha ON ha.sbd = p.em_a JOIN hoc_sinh hb ON hb.sbd = p.em_b
       WHERE p.trang_thai = 'dong_y' AND (p.em_a IN ${TAP_EM_LOP} OR p.em_b IN ${TAP_EM_LOP})`).bind(lop),
  ])
  const [rEm, rGiai, rBac, rSo, rSua, rPhep, rMua, rCap] = kq(batch)
  const nhatKy = gopNhatKy(rSo, rSua, rPhep, rMua)
  const bacMoi = new Map((rBac ?? []).map((x) => [str(x.sbd), num(x.bac)] as const))
  // Thứ hạng trong nhóm (cả nhóm, kể cả bạn lớp khác).
  const theoNhom = new Map<string, { em: string; nguyenTu: number; vaoLuc: string }[]>()
  const dongEm = new Map<string, Row & { that: number }>()
  for (const x of rGiai ?? []) {
    const that = nguyenTuThat(num(x.nguyen_tu), num(x.ho_tro), bacHoacNull(x.bac))
    dongEm.set(str(x.em), { ...x, that })
    const nhom = str(x.nhom)
    if (nhom && nhom !== '-') theoNhom.set(nhom, [...(theoNhom.get(nhom) ?? []), { em: str(x.em), nguyenTu: that, vaoLuc: str(x.vao_luc) }])
  }
  const thuHang = new Map<string, number>()
  for (const ds of theoNhom.values()) for (const x of xepNhom(ds)) thuHang.set(x.em, x.thuHang)
  const hocCung = new Map<string, HocCungGv[]>()
  for (const x of rCap ?? []) {
    const chuoi = num(x.chuoi_doi)
    for (const [em, ten, lopBan] of [[str(x.em_a), str(x.ten_b), str(x.lop_b)], [str(x.em_b), str(x.ten_a), str(x.lop_a)]] as const) {
      hocCung.set(em, [...(hocCung.get(em) ?? []), { ten: ten || 'Bạn học', ...(lopBan ? { lop: lopBan } : {}), chuoiDoi: chuoi }])
    }
  }
  const ds: DongThiDuaTuan[] = (rEm ?? []).map((x): DongThiDuaTuan => {
    const sbd = str(x.sbd)
    const g = dongEm.get(sbd)
    const bac = bacMoi.has(sbd) ? bacMoi.get(sbd)! : null
    return {
      sbd,
      ten: str(x.ho_ten) || sbd,
      nguyenTuThat: g ? g.that : 0,
      nguyenTuLoai: g ? Math.max(0, num(g.nguyen_tu) - g.that) : 0,
      hang: g ? { kl: chuanHang(g.hang), thuHang: thuHang.get(sbd) ?? null } : null,
      chuoi: chuoiCuaEm(nhatKy.get(sbd), homNay).so,
      nhan: bac === null ? null : bacCongKhai((Math.min(5, Math.max(1, bac)) as BacDanhGia)) === 1 ? 'Học thật' : 'Đối phó',
      bacDuoi: bac === null ? null : Math.min(5, Math.max(1, bac)),
      hocCung: hocCung.get(sbd) ?? [],
    }
  }).sort((a, c) => c.nguyenTuThat - a.nguyenTuThat || a.ten.localeCompare(c.ten, 'vi'))
  return { ok: true, lop, tuan, ds }
}

// ───────────────────────── PHỤ HUYNH ─────────────────────────

export interface TuanThuongPh { chuoi?: number; soBai?: number; hang?: Hang; tiLeHocThat?: number; hocCung?: string[] }

/**
 * Khối `tuan` của `/ph/bao-cao-tuan` (gốc phản hồi): `{chuoi, soBai, hang, tiLeHocThat (0..1), hocCung: string[]}`; trường chưa có dữ liệu thì BỎ.
 * MỘT batch; nơi gọi chạy SONG SONG với đọc báo cáo tuần sẵn có ⇒ không thêm vòng chờ. Lỗi ⇒ null (thẻ cũ vẫn hiện).
 */
export async function tuanThuongPh(env: Env, sbd: string, nowMs: number = Date.now()): Promise<TuanThuongPh | null> {
  try {
    const tuan = tuanCua(nowMs)
    const homNay = ngayVn(nowMs)
    const tu = themNgay(homNay, -SO_NGAY_DOC)
    const DB = env.DB
    const [rCt, rGiai, rTruoc, rSo, rSua, rPhep, rMua, rCap] = kq(await DB.batch([
      sqlCongTac(env),
      DB.prepare(`SELECT g.hang AS hang, g.nguyen_tu AS nguyen_tu, g.nguyen_tu_ho_tro AS ho_tro, d.bac AS bac FROM giai_tuan g
          LEFT JOIN danh_gia_em_tuan d ON d.sbd = g.em AND d.tuan = g.tuan WHERE g.tuan = ? AND g.em = ?`).bind(tuan, sbd),
      DB.prepare('SELECT COALESCE(hang_sau, hang) AS hang FROM giai_tuan WHERE em = ? AND tuan < ? ORDER BY tuan DESC LIMIT 1').bind(sbd, tuan),
      ...cauNhatKyDs(env, [sbd], tu, homNay),
      DB.prepare(`SELECT h.ho_ten AS ho_ten FROM ban_hoc p JOIN hoc_sinh h ON h.sbd = CASE WHEN p.em_a = ?1 THEN p.em_b ELSE p.em_a END
          WHERE (p.em_a = ?1 OR p.em_b = ?1) AND p.trang_thai = 'dong_y'`).bind(sbd),
    ]))
    const bat = docCongTacTuDong(rCt)
    const nk = gopNhatKy(rSo, rSua, rPhep, rMua).get(sbd)
    const ra: TuanThuongPh = { chuoi: chuoiCuaEm(nk, homNay).so }
    let soBai = 0
    for (let d = tuan; d <= homNay; d = themNgay(d, 1)) soBai += soBaiNgay(nk, d)
    ra.soBai = soBai
    const g = rGiai?.[0]
    if (bat.giai) {
      const h = g ? g.hang : rTruoc?.[0]?.hang
      if (h) ra.hang = chuanHang(h)
    }
    if (g && num(g.nguyen_tu) > 0) ra.tiLeHocThat = Math.round((nguyenTuThat(num(g.nguyen_tu), num(g.ho_tro), bacHoacNull(g.bac)) / num(g.nguyen_tu)) * 100) / 100
    const ten = (rCap ?? []).map((x) => tenRutGon(x.ho_ten))
    if (bat.banBe && ten.length) ra.hocCung = ten
    return ra
  } catch (e) {
    console.error('[thuong-ph] khối tuần lỗi (bỏ khối):', e instanceof Error ? e.message : e)
    return null
  }
}

