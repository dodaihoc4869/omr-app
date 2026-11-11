// 11/11 (hoá đơn Cloudflare — hàng đọc D1): docNhieuTrangThaiLoiDau đổi hai câu quét-cả-lịch-sử-của-em sang câu đi đúng chỉ mục.
// Test này chứng minh: (1) câu MỚI trả ĐÚNG tập dòng mà câu CŨ trả (sau đúng bộ lọc JS như mã thật) trên dữ liệu giả ngẫu nhiên có đủ ca khó —
// song sinh ~ss/~bt/~yd, hậu tố #n, tiền tố tc:, tc trong raw_json, câu thi đã/chưa công bố, luyện đề đã/chưa nộp, embargoed, purpose bị loại,
// trước TU_NGAY, em khác, gốc là tiền tố của gốc khác; (2) kế hoạch truy vấn đi chỉ mục theo câu, không quét theo ngày.
import { describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { SQL_LOI_DAU_HOI, SQL_LOI_DAU_SKH, qidChuan, docNhieuTrangThaiLoiDau } from '../server/src/chua-cau-sai-adapter'
import { SQL_LA_LAN_LAM } from '../server/src/omni-kieu'
import { SQL_DA_CONG_BO } from '../server/src/cong-bo-diem'
import { SQL_DAU_HO_TRO_CHUA } from '../server/src/dau-ho-tro-chua'
import { TU_NGAY } from '../server/src/loi-hoc-luat'

// Bản sao NGUYÊN VĂN hai câu cũ (trước 11/11) — làm chuẩn so sánh.
const SKH_CU = `SELECT s.qid,s.nguon,s.luc,s.ngay_vn,s.ket_qua,s.assistance,json_extract(s.raw_json,'$.tc') AS tc FROM su_kien_hoc s WHERE s.sbd=? AND s.ngay_vn>=? AND ${SQL_LA_LAN_LAM} AND COALESCE(s.visibility,'')<>'embargoed'
   AND (s.qid IN (SELECT value FROM json_each(?)) OR json_extract(s.raw_json,'$.tc') IN (SELECT value FROM json_each(?)))
   AND (s.nguon<>'thi' OR EXISTS(SELECT 1 FROM ca c WHERE c.ma_ca=s.ma_nguon AND c.trang_thai<>'da_xoa' AND ${SQL_DA_CONG_BO('c')}))
   AND (s.nguon<>'luyen' OR EXISTS(SELECT 1 FROM luyen_de_2026 ld WHERE ld.id=s.ma_nguon AND ld.sbd=s.sbd AND ld.status='submitted'))`
const HOI_CU = `SELECT qid,luc FROM loi_giai_hoi WHERE sbd=? AND ${SQL_DAU_HO_TRO_CHUA} AND luc>=?`

function ngauNhien(hat: number) {
  let x = hat >>> 0
  return () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 2 ** 32 }
}
const chon = <T,>(r: () => number, a: readonly T[]): T => a[Math.floor(r() * a.length)]!

function dung(hat: number) {
  const d = taoD1That(), r = ngauNhien(hat)
  const GOC = ['Q1', 'Q12', 'Q2', 'H5', 'H50', 'Z9']
  const bienThe = (g: string) => chon(r, [g, `${g}#1`, `${g}~ss0`, `${g}~ss3`, `${g}~ss7`, `${g}~bt1`, `${g}~yd2#4`, `tc:${g}`, `tc:${g}~ss1`, `${g}x`])
  d.sql.exec(`INSERT INTO ca(ma_ca,trang_thai,cong_bo,cap_nhat_luc) VALUES('caA','dong','ca_lop_xong','x'),('caB','mo','ca_lop_xong','x'),('caC','mo','ngay','x'),('caD','da_xoa','ngay','x')`)
  d.sql.exec(`INSERT INTO luyen_de_2026(id,sbd,created_at,deadline,status,bank_key,updated_at) VALUES('ld1','E1',1,1,'submitted','k',1),('ld2','E1',1,1,'active','k',1),('ld3','E2',1,1,'submitted','k',1)`)
  const themSk = d.sql.prepare(`INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,ket_qua,luc,ngay_vn,assistance,visibility,purpose,raw_json) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`)
  const themHoi = d.sql.prepare(`INSERT OR IGNORE INTO loi_giai_hoi(sbd,qid,nguon,luc,co_ho_so) VALUES(?,?,?,?,?)`)
  for (let i = 0; i < 600; i++) {
    const g = chon(r, GOC), nguon = chon(r, ['thi', 'luyen', 'goi7', 'chua', 'tu_luyen'])
    const ma = nguon === 'thi' ? chon(r, ['caA', 'caB', 'caC', 'caD', 'caX']) : nguon === 'luyen' ? chon(r, ['ld1', 'ld2', 'ld3']) : 'm'
    const tc = chon(r, [null, null, g, chon(r, GOC), `tc:${g}`])
    const ngay = chon(r, ['2026-09-20', '2026-09-29', '2026-10-15', '2026-11-10'])
    themSk.run(`k${i}`, chon(r, ['E1', 'E1', 'E2']), bienThe(g), nguon, ma, chon(r, [0, 1, null]), `${ngay}T0${i % 10}:00:00.${i}Z`, ngay,
      chon(r, [null, '', 'none', 'goi_y']), chon(r, [null, '', 'embargoed']), chon(r, [null, '', 'luot', 'chan_doan', 'on']),
      tc === null ? chon(r, [null, '{}']) : JSON.stringify({ tc }))
    themHoi.run(chon(r, ['E1', 'E1', 'E2']), bienThe(g), chon(r, ['x:tro_ly', 'x:goi_y', 'goi7:sau_nop', 'khac', 'y:thay_go']), `${ngay}T1${i % 10}:00:00.${i}`, chon(r, [0, 1]))
  }
  return d
}

// Đúng như mã thật: aliases → roots → tat / tcList; lọc JS theo qidChuan.
function thamSo(goc: string[], nhom: Record<string, string[]> = {}) {
  const alias = new Map<string, Set<string>>()
  for (const q of goc) alias.set(q, new Set([q, ...(nhom[q] ?? [])]))
  const roots = [...new Set([...alias.values()].flatMap((x) => [...x]))]
  const tat = JSON.stringify(roots.flatMap((q) => [q, ...[0, 1, 2, 3].map((i) => `${q}~ss${i}`)]))
  return { alias, roots, tat, tcList: JSON.stringify(roots) }
}
const khoa = (x: Record<string, unknown>) => JSON.stringify(Object.keys(x).sort().map((k) => [k, x[k]]))
const tapDong = (ds: Record<string, unknown>[]) => ds.map(khoa).sort()

describe('docNhieuTrangThaiLoiDau — câu đi chỉ mục trả đúng tập dòng như câu cũ (11/11)', () => {
  const BO = [
    { goc: ['Q1'] }, { goc: ['Q12'] }, { goc: ['Q1', 'H5'] }, { goc: ['H50', 'Z9', 'Q2'] },
    { goc: ['Q1'], nhom: { Q1: ['Q2', 'Z9'] } }, { goc: ['KHONG_CO'] }, { goc: ['Q1', 'Q12', 'Q2', 'H5', 'H50', 'Z9'] },
  ]
  for (const hat of [1, 7, 42, 2026]) {
    it(`su_kien_hoc + loi_giai_hoi — hạt ${hat}`, () => {
      const d = dung(hat)
      for (const b of BO) for (const sbd of ['E1', 'E2', 'E9']) {
        const { alias, roots, tat, tcList } = thamSo(b.goc, b.nhom)
        const cu = d.sql.prepare(SKH_CU).all(sbd, TU_NGAY, tat, tcList) as Record<string, unknown>[]
        const moi = d.sql.prepare(SQL_LOI_DAU_SKH).all(sbd, tat, TU_NGAY, sbd, tcList, tat, TU_NGAY) as Record<string, unknown>[]
        expect(moi.length).toBe(cu.length) // UNION ALL không nhân đôi dòng
        expect(tapDong(moi)).toEqual(tapDong(cu))
        const loc = (ds: { qid: string; luc: string }[]) => b.goc.flatMap((q) => ds.filter((x) => alias.get(q)?.has(qidChuan(x.qid))).map((x) => `${q}|${x.qid}|${x.luc}`)).sort()
        const hoiCu = d.sql.prepare(HOI_CU).all(sbd, `${TU_NGAY}T00:00:00`) as { qid: string; luc: string }[]
        const hoiMoi = d.sql.prepare(SQL_LOI_DAU_HOI).all(JSON.stringify(roots.flatMap((q) => [q, `tc:${q}`])), sbd, `${TU_NGAY}T00:00:00`) as { qid: string; luc: string }[]
        expect(loc(hoiMoi)).toEqual(loc(hoiCu))
      }
    })
  }
  it('dữ liệu giả có đủ dòng để phép so có nghĩa', () => {
    const d = dung(42), { tat, tcList } = thamSo(['Q1', 'H5'])
    expect((d.sql.prepare(SKH_CU).all('E1', TU_NGAY, tat, tcList) as unknown[]).length).toBeGreaterThanOrEqual(10)
    expect((d.sql.prepare(HOI_CU).all('E1', `${TU_NGAY}T00:00:00`) as unknown[]).length).toBeGreaterThanOrEqual(10)
  })
  it('đường thật (env.DB) chạy được và có kết quả', async () => {
    const d = dung(7)
    const ra = await docNhieuTrangThaiLoiDau(d.env, 'E1', ['Q1', 'H5~ss1', 'tc:Z9'], '2026-11-11')
    expect(ra.size).toBeGreaterThan(0)
  })
  it('kế hoạch truy vấn: nhánh qid đi idx_skh_em_qid_ngay, nhánh tc đi idx_skh_em_tc, dấu hỗ trợ dò khoảng qid', () => {
    const d = taoD1That()
    const ke = (q: string) => (d.sql.prepare(`EXPLAIN QUERY PLAN ${q}`).all() as { detail: string }[]).map((x) => x.detail).join('\n')
    const skh = ke(SQL_LOI_DAU_SKH)
    expect(skh).toMatch(/SEARCH s USING INDEX idx_skh_em_qid_ngay \(sbd=\? AND qid=\?/)
    expect(skh).toMatch(/SEARCH s USING INDEX idx_skh_em_tc \(sbd=\? AND <expr>=\?\)/)
    expect(ke(SQL_LOI_DAU_HOI)).toMatch(/SEARCH l USING INDEX \w+ \(sbd=\? AND qid>\? AND qid<\?\)/)
  })
})

describe('cron gói sửa mỗi phút đi chỉ mục đợt mở (11/11)', () => {
  it('sau khi dựng chỉ mục cron đêm, câu tìm em còn đợt mở chỉ quét idx_cld_mo_em', async () => {
    const { CHI_MUC_CRON_DEM } = await import('../server/src/chi-muc-luc-chay')
    const { BANG_GOI_SUA, SQL_GOI_SUA } = await import('../server/src/goi-sua-dem')
    const d = taoD1That()
    for (const s of [...SQL_GOI_SUA, ...CHI_MUC_CRON_DEM]) d.sql.exec(s)
    const q = `SELECT d.sbd AS sbd FROM chua_loi_dot d WHERE d.trang_thai_day<>'da_tu_sua' AND d.dong_luc IS NULL
        AND NOT EXISTS (SELECT 1 FROM ${BANG_GOI_SUA} g WHERE g.sbd=d.sbd AND g.ngay=?1 AND (g.so>=0 OR g.luc>?2))
      GROUP BY d.sbd ORDER BY MAX(d.cap_nhat_luc) DESC LIMIT ?3`
    expect((await import('node:fs')).readFileSync('server/src/goi-sua-dem.ts', 'utf8')).toContain(q.split('\n')[0]!.trim())
    const ke = (d.sql.prepare(`EXPLAIN QUERY PLAN ${q}`).all() as { detail: string }[]).map((x) => x.detail).join('\n')
    expect(ke).toMatch(/SCAN d USING (COVERING )?INDEX idx_cld_mo_em/)
  })
})
