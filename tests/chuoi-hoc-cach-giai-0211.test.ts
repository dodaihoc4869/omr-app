// @vitest-environment node
// MỘT MỨC, MỘT SỐ ĐẾM CHO CHUỖI (02/11, thầy: «Kiểm tra xem có học sinh nào làm đủ bị mất chuỗi không?»). Đo D1 thật (scripts/kiem-chuoi-0211.ts): 31/10 + 01/11
// có 17 + 42 em màn báo «Đủ x/y câu hôm nay!» mà chuỗi tắt — Lộ trình / vòng «Đủ mức» / lịch ngày đếm cả CÂU HỌC CÁCH GIẢI (`goi_bai_7_gap`), chuỗi (từ #520)
// chỉ đếm sổ. Nay mọi nơi tính chuỗi (một em B3, nhiều em, cược) dùng SQL_SO_CAU_MUC; xoá mức để chốt lại (giao bài mới / sửa hạn / sửa danh sách em) giữ
// mức của em ĐÃ ĐỦ (sqlDaDuMuc). D1 thật (node:sqlite, lược đồ từ migration).
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { taoKhoOmni } from './omni-3-ke-hoach-chung'
import { sqlDaDuMuc } from '../server/src/chuoi-ngay-bai'
import { docChuoiNgayBai } from '../server/src/chuoi-ngay-bai-d1'
import { chuoiCuaEm, datNgay, docNhatKyNhieuEm } from '../server/src/thuong-ngay-hoc'
import { cauNoiChuoi } from '../server/src/thuong-cau-noi-chuoi'
import { datNgayBaoTriChoTest } from '../server/src/ngay-bao-tri'

beforeAll(() => datNgayBaoTriChoTest(['2026-10-27']))
afterAll(() => datNgayBaoTriChoTest())
const VN = (s: string) => Date.parse(`${s}+07:00`)

function kho() {
  const k = taoKhoOmni({}, 2)
  const sk = k.d.sql.prepare("INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn,assistance,purpose) VALUES(?,?,?,'game','p',1,1,?,?,'none',NULL)")
  const lam = (sbd: string, ngay: string, so: number, ma = 'q') => { for (let i = 0; i < so; i++) sk.run(`${sbd}|${ngay}|${ma}|${i}`, sbd, `${ma}${i}`, `${ngay}T03:00:00Z`, ngay) }
  const muc = (sbd: string, ngay: string, m: number) => k.d.sql.prepare('INSERT OR REPLACE INTO goi_bai_7_muc_ngay(sbd,ngay,tang,toi_thieu_tang,quota,muc,luc) VALUES(?,?,1,12,0,?,?)').run(sbd, ngay, m, `${ngay}T00:00:00Z`)
  // câu học cách giải: `luc` ISO (UTC) như goi-bai-7.ts ghi
  const hoc = (sbd: string, qid: string, lucUtc: string) => k.d.sql.prepare("INSERT INTO goi_bai_7_gap(receipt,goi_id,sbd,qid,version,kieu,luc) VALUES(?,?,?,?,'1','co_ho_tro',?)").run(`${sbd}|${qid}|${lucUtc}`, 'g1', sbd, qid, lucUtc)
  return { ...k, lam, muc, hoc }
}

describe('chuỗi đếm câu học cách giải như màn «Đủ x/y»', () => {
  it('10 câu làm + 2 câu học cách giải, mức 12 ⇒ ĐỦ (trước: tắt chuỗi); một em = nhiều em = cược', async () => {
    const k = kho()
    k.lam('S1', '2026-10-31', 12); k.muc('S1', '2026-10-31', 12)
    k.lam('S1', '2026-11-01', 10); k.muc('S1', '2026-11-01', 12)
    k.hoc('S1', 'h1', '2026-11-01T05:00:00.000Z'); k.hoc('S1', 'h2', '2026-10-31T17:00:00.000Z') // 12:00 và 00:00 ngày 01/11 (VN)
    const r = await docChuoiNgayBai(k.env, 'S1', VN('2026-11-02T08:00:00'))
    expect(r?.lich7.find((x) => x.ngay === '2026-11-01')?.kieu).toBe('hoc')
    expect(r?.so).toBe(2)
    const nk = (await docNhatKyNhieuEm(k.env, ['S1'], '2026-10-01', '2026-11-02')).get('S1')
    expect(datNgay(nk, '2026-11-01')).toBe(true)
    expect(chuoiCuaEm(nk, '2026-11-02').so).toBe(2)
    const cuoc = await cauNoiChuoi().docNgayCoHoc(k.env, ['S1'], '2026-11-01', '2026-11-01', true)
    expect([...(cuoc.get('S1') ?? [])]).toEqual(['2026-11-01'])
  })
  it('không cộng hai lần câu đã có trong sổ; câu học ngày khác (theo giờ VN) không tính ⇒ vẫn thiếu mức', async () => {
    const k = kho()
    k.lam('S1', '2026-10-31', 12); k.muc('S1', '2026-10-31', 12)
    k.lam('S1', '2026-11-01', 10); k.muc('S1', '2026-11-01', 12)
    k.hoc('S1', 'q3', '2026-11-01T05:00:00.000Z') // câu đã làm trong sổ cùng ngày
    k.hoc('S1', 'h9', '2026-10-31T16:59:59.000Z') // 23:59:59 ngày 31/10 (VN)
    k.hoc('S1', 'h8', '2026-11-01T17:00:00.000Z') // 00:00 ngày 02/11 (VN)
    const r = await docChuoiNgayBai(k.env, 'S1', VN('2026-11-02T08:00:00'))
    expect(r?.lich7.find((x) => x.ngay === '2026-11-01')?.kieu).toBe('tat')
    // 02/11 chưa có dòng sổ nào ⇒ chưa có nhóm ngày ⇒ 0 (giới hạn đã biết: ngày CHỈ có câu học cách giải không được đếm — không thể đủ mức thật)
    expect(r?.homNay).toEqual({ can: 6, da: 0 })
  })
})

describe('xoá mức để chốt lại giữ mức của em đã đủ (một mức cho màn và chuỗi)', () => {
  it('em đủ (sổ + học cách giải) giữ dòng mức; em chưa đủ bị xoá để chốt lại', () => {
    const k = kho()
    k.lam('S1', '2026-11-01', 10); k.hoc('S1', 'h1', '2026-11-01T05:00:00.000Z'); k.hoc('S1', 'h2', '2026-11-01T06:00:00.000Z'); k.muc('S1', '2026-11-01', 12)
    k.lam('S2', '2026-11-01', 11); k.muc('S2', '2026-11-01', 12)
    k.d.sql.prepare(`DELETE FROM goi_bai_7_muc_ngay WHERE ngay>=? AND NOT ${sqlDaDuMuc('goi_bai_7_muc_ngay')}`).run('2026-11-01')
    const con = (k.d.sql.prepare('SELECT sbd FROM goi_bai_7_muc_ngay ORDER BY sbd').all() as { sbd: string }[]).map((x) => x.sbd)
    expect(con).toEqual(['S1'])
  })
  it('ba đường xoá mức (giao bài mới, sửa hạn, sửa danh sách em) đều giữ em đã đủ', () => {
    for (const tep of ['server/src/goi-bai-7.ts', 'server/src/goi-bai-7-thay.ts', 'server/src/goi-bai-7-membership.ts']) {
      const s = readFileSync(tep, 'utf8')
      const xoa = s.split('\n').filter((d) => d.includes('DELETE FROM goi_bai_7_muc_ngay'))
      expect(xoa.length, tep).toBeGreaterThan(0)
      for (const d of xoa) expect(d, tep).toContain("NOT ${sqlDaDuMuc('goi_bai_7_muc_ngay')}")
    }
  })
})
