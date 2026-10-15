// @vitest-environment node
// B5 "máy chủ nhanh hơn giờ cao điểm" (thầy duyệt 15/10): bảng Thi đua của lớp không còn ĐỌC + GOM mọi lượt 60 ngày; ngày đã qua chỉ dò "có học"
// (EXISTS theo chỉ mục (sbd, ngay_vn)), hôm nay đếm như cũ — MỘT câu (`SQL_SO_CAU_LOP`), chạy song song với câu "đạt nhiệm vụ ngày".
// Khoá: CÙNG SỐ với câu cũ (giữ nguyên văn ở đây làm chuẩn) — số câu hôm nay, lúc đạt câu thứ N, tập ngày có học ⇒ chuỗi ngày học — trên lớp 30 em ×
// 70 ngày có lượt bỏ trống, lượt trước mốc, lượt 23:5x / 00:0x; sau lượt nộp bù mang giờ CŨ (hiện ngay, không đệm tới nửa đêm); qua nửa đêm VN.
// EXPLAIN QUERY PLAN: phần ngày đã qua dò theo chỉ mục (sbd=? AND ngay_vn=?), không quét theo thời gian (`idx_skh_luc`), không SCAN sổ.
import { beforeEach, describe, expect, it } from 'vitest'
import { taoD1That, type D1That } from './_d1-that'
import type { Env } from '../server/src/kieu'
import { docLopHomNay, ngayTruocCuaChuoi, SO_NGAY_DOC_CHUOI, SQL_SO_CAU_LOP, xoaDemThiDua } from '../server/src/thi-dua-hom-nay'
import { ghiSuKien, ngayVn } from '../server/src/su-kien-hoc'
import { themNgay } from '../server/src/ho-so-nam-kt'
import { giaiMocHienThi } from '../server/src/moc-no'
import { chuoiNgayHoc } from '../src/lib/han-bai-tap'

type Row = Record<string, unknown>
const VN = (s: string): number => Date.parse(`${s}+07:00`)
const MOC = giaiMocHienThi('2026-09-21T05:00:00.000Z') // 12:00 trưa 21/09 — mốc hiển thị mặc định
beforeEach(() => xoaDemThiDua())

/** Câu CŨ (nguyên văn trước B5) — chuẩn để so. */
const SQL_CU = `SELECT sbd, ngay_vn, COUNT(*) AS n, MAX(luc1) AS luc FROM (
         SELECT sbd, ngay_vn, qid, MIN(luc) AS luc1 FROM su_kien_hoc
          WHERE sbd IN (SELECT value FROM json_each(?)) AND ngay_vn >= ? AND ngay_vn <= ? AND luc >= ? AND ket_qua IS NOT NULL
          GROUP BY sbd, ngay_vn, qid
       ) GROUP BY sbd, ngay_vn`

function hat(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
let k = 0
const sk = (d: D1That, sbd: string, qid: string, lucIso: string, kq: number | null) =>
  d.sql.prepare('INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, luc, ngay_vn) VALUES (?,?,?,?,?,?,?,?,?)').run(`t${++k}`, sbd, qid, 'game', 'P', 1, kq, lucIso, ngayVn(lucIso))

/** Lớp "12 - Tinh Hoa" 30 em (+ 1 em lớp khác); 19/09 → 15/10 lượt ngẫu nhiên, có ngày nghỉ (đứt chuỗi), lượt bỏ trống, lượt trước mốc 21/09 12:00. */
function lop(): D1That {
  const d = taoD1That()
  const r = hat(2110)
  const sbd = Array.from({ length: 30 }, (_, i) => `L${String(i).padStart(2, '0')}`)
  for (const s of [...sbd, 'KHAC']) d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,ten_lop,mat_khau,cap_nhat_luc) VALUES(?,?,?,?,'mk','x')").run(s, `Em ${s}`, '12', s === 'KHAC' ? '12 - Khác' : '12 - Tinh Hoa')
  d.sql.exec('BEGIN')
  for (const s of sbd) {
    const nghi = r() * 0.5
    for (let t = VN('2026-09-19T00:00:00'); t < VN('2026-10-16T00:00:00'); t += 86_400_000) {
      if (r() < nghi) continue
      const n = Math.floor(r() * 9)
      for (let i = 0; i < n; i++) {
        const phut = r() < 0.1 ? 23 * 60 + 50 + Math.floor(r() * 10) : r() < 0.1 ? Math.floor(r() * 5) : Math.floor(r() * 1440)
        sk(d, s, `Q${Math.floor(r() * 15)}`, new Date(t + phut * 60_000 + Math.floor(r() * 60_000)).toISOString(), r() < 0.15 ? null : r() < 0.6 ? 1 : 0)
      }
    }
  }
  d.sql.exec('COMMIT')
  return d
}

/** Chuẩn: câu cũ + đúng phép dựng của `soLieuCuaLopTho` ⇒ {soCau, lucDatSoCau, chuoi} mỗi em. */
async function chuan(env: Env, sbd: string[], nowMs: number) {
  const homNay = ngayVn(nowMs)
  const r = (await env.DB.prepare(SQL_CU).bind(JSON.stringify(sbd), themNgay(homNay, -(SO_NGAY_DOC_CHUOI - 1)), homNay, MOC.iso).all<Row>()).results ?? []
  const ngay = new Map<string, string[]>()
  const hom = new Map<string, { n: number; luc: number }>()
  for (const x of r) {
    ngay.set(String(x.sbd), [...(ngay.get(String(x.sbd)) ?? []), String(x.ngay_vn)])
    if (x.ngay_vn === homNay) hom.set(String(x.sbd), { n: Number(x.n), luc: Date.parse(String(x.luc)) })
  }
  return Object.fromEntries(sbd.map((s) => [s, { soCau: hom.get(s)?.n ?? 0, lucDatSoCau: hom.get(s)?.luc ?? null, chuoi: chuoiNgayHoc(ngay.get(s) ?? [], nowMs), ngay: [...new Set(ngay.get(s) ?? [])].sort() }]))
}
async function moi(env: Env, sbd: string[], nowMs: number) {
  const homNay = ngayVn(nowMs)
  const r = (await env.DB.prepare(SQL_SO_CAU_LOP).bind(JSON.stringify(sbd), homNay, MOC.iso, JSON.stringify(ngayTruocCuaChuoi(homNay))).all<Row>()).results ?? []
  const ngay = new Map<string, string[]>()
  for (const x of r) ngay.set(String(x.sbd), [...(ngay.get(String(x.sbd)) ?? []), String(x.ngay_vn)])
  return Object.fromEntries(sbd.map((s) => [s, [...new Set(ngay.get(s) ?? [])].sort()]))
}

/** So `docLopHomNay` (mã thật, đệm 30 giây đã xoá) với chuẩn của câu cũ; so cả tập ngày có học. */
async function soSanh(d: D1That, nowMs: number) {
  xoaDemThiDua()
  const env = d.env as unknown as Env
  const lopNay = (await docLopHomNay(env, 'L00', nowMs, MOC))!
  const sbd = lopNay.thanhVien.map((x) => x.sbd)
  expect(sbd).toHaveLength(30)
  const c = await chuan(env, sbd, nowMs)
  for (const t of lopNay.thanhVien) expect({ sbd: t.sbd, soCau: t.soCau, lucDatSoCau: t.lucDatSoCau, chuoi: t.chuoi }).toEqual({ sbd: t.sbd, soCau: c[t.sbd]!.soCau, lucDatSoCau: c[t.sbd]!.lucDatSoCau, chuoi: c[t.sbd]!.chuoi })
  const m = await moi(env, sbd, nowMs)
  for (const s of sbd) expect(m[s]).toEqual(c[s]!.ngay)
  return { lopNay, c }
}

describe('B5 · Thi đua: ngày đã qua dò "có học", cùng số với câu cũ', { timeout: 120_000 }, () => {
  it('lớp 30 em × 27 ngày: số câu hôm nay, lúc đạt câu thứ N, chuỗi ngày học, tập ngày có học — y hệt (trưa, 23:59, 00:01)', async () => {
    const d = lop()
    const { lopNay, c } = await soSanh(d, VN('2026-10-15T12:00:00'))
    expect(lopNay.thanhVien.filter((x) => x.chuoi >= 2).length).toBeGreaterThan(3) // có chuỗi dài để so
    expect(Object.values(c).filter((x) => x.soCau > 0).length).toBeGreaterThan(10)
    await soSanh(d, VN('2026-10-14T23:59:00'))
    await soSanh(d, VN('2026-10-15T00:01:00'))
    await soSanh(d, VN('2026-09-21T13:00:00')) // ngày mốc: lượt trước 12:00 không tính
  })

  it('lượt nộp bù mang giờ CŨ (hôm qua, 3 ngày trước, trước mốc) và lượt bỏ trống: hiện NGAY như câu cũ (không đệm tới nửa đêm)', async () => {
    const d = lop()
    const env = d.env as unknown as Env
    const now = VN('2026-10-15T20:30:00')
    await soSanh(d, now)
    // Em L01: nghỉ trọn 12/10 rồi được nộp bù một lượt 12/10 ⇒ chuỗi nối lại.
    d.sql.prepare("DELETE FROM su_kien_hoc WHERE sbd = 'L01' AND ngay_vn = '2026-10-12'").run()
    const dut = await soSanh(d, now)
    await ghiSuKien(env, [{ nguon: 'on_lai', maNguon: 'bu', sbd: 'L01', qid: 'BU1', lan: 1, ketQua: 1, luc: new Date(VN('2026-10-12T21:00:00')).toISOString() }])
    const noi = await soSanh(d, now)
    expect(noi.c.L01!.ngay).toContain('2026-10-12')
    expect(dut.c.L01!.ngay).not.toContain('2026-10-12')
    // Bỏ trống (kết quả rỗng) không phải "có học"; lượt trước mốc không tính.
    d.sql.prepare("DELETE FROM su_kien_hoc WHERE sbd = 'L02' AND ngay_vn = '2026-10-14'").run()
    await ghiSuKien(env, [{ nguon: 'on_lai', maNguon: 'bu', sbd: 'L02', qid: 'BU2', lan: 1, ketQua: null, luc: new Date(VN('2026-10-14T21:00:00')).toISOString() }])
    sk(d, 'L03', 'TRUOC', new Date(VN('2026-09-21T11:59:59')).toISOString(), 1)
    const sau = await soSanh(d, now)
    expect(sau.c.L02!.ngay).not.toContain('2026-10-14')
    await soSanh(d, VN('2026-09-21T13:00:00'))
  })

  it('EXPLAIN QUERY PLAN: phần ngày đã qua dò theo chỉ mục (sbd=? AND ngay_vn=?); không idx_skh_luc, không SCAN sổ', () => {
    const d = lop()
    const ke = (d.sql.prepare(`EXPLAIN QUERY PLAN ${SQL_SO_CAU_LOP}`).all('["L00","L01"]', '2026-10-15', MOC.iso, JSON.stringify(ngayTruocCuaChuoi('2026-10-15'))) as { detail: string }[]).map((x) => x.detail)
    const noi = ke.join('\n')
    expect(noi).toMatch(/SEARCH s USING (COVERING )?INDEX idx_skh_em_ngay\w* \(sbd=\? AND ngay_vn=\?\)/)
    expect(noi).not.toMatch(/idx_skh_luc/)
    expect(noi).not.toMatch(/SCAN (su_kien_hoc|s)\b/)
    expect(ngayTruocCuaChuoi('2026-10-15')).toHaveLength(SO_NGAY_DOC_CHUOI - 1)
    expect(ngayTruocCuaChuoi('2026-10-15')[0]).toBe(themNgay('2026-10-15', -(SO_NGAY_DOC_CHUOI - 1)))
    expect(ngayTruocCuaChuoi('2026-10-15').at(-1)).toBe('2026-10-14')
  })
})
