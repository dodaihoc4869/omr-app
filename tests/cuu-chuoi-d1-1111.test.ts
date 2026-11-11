// @vitest-environment node
// LÀM BÙ CỨU CHUỖI — nối với D1 (thầy 11/11). Khoá: (1) chuỗi một em đọc đúng phần trả nợ câu của ngày (mức gốc) và lịch Kiểm tra ôn tập trong CÙNG lệnh đọc
// mức; (2) câu trả nợ câu tính là câu bù; (3) ngày Kiểm tra ôn tập đã nộp là ngày đạt (lỗi 11/11: ngày ấy chỉ còn 28 câu kiểm tra, chuỗi lại không đếm câu
// kiểm tra ⇒ em nào có bài kiểm tra cũng bị tính lỡ ngày); (4) đọc nhiều em (lửa đôi, bảng thầy, phụ huynh) ra cùng kết quả với đọc một em.
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { taoKhoOmni, themChienDich, lam } from './omni-3-ke-hoach-chung'
import { dongBoGoi7, lapGoi7 } from '../server/src/goi-bai-7'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { damBaoKtCn } from '../server/src/kiem-tra-ca-nhan-schema'
import { xoaDemChienDich } from '../server/src/srs2-d1'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { xoaMoiDem } from '../server/src/dem-chung'
import { docChuoiNgayBai, docNhatKyChuoi } from '../server/src/chuoi-ngay-bai-d1'
import { chuoiNgayCuaEm } from '../server/src/chuoi-ngay-bai'
import { docNhatKyNhieuEm } from '../server/src/thuong-ngay-hoc'

const D11 = Date.parse('2026-11-11T02:00:00Z'), NGAY = 86400000
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(D11) })
afterEach(() => { vi.useRealTimers(); xoaDemPhamVi(); xoaDemChienDich(); xoaDemCaBaoVe(); xoaMoiDem() })

async function kho(n = 400) {
  const k = taoKhoOmni({ 'DH-B1': n })
  await damBaoBangBaiDaDay(k.env); await damBaoKtCn(k.env)
  k.d.sql.exec(`INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B1','Bài mới',${n},0,'v1');INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B1','v1','x');
    INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('goi_bai_7_v1','{"bat":true,"batDau":"2026-10-10"}','x')`)
  k.d.sql.prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES(?,?,?,?,?,?,?)').run('latest', '12A1', 'B1', 'Bài mới', 1, '["DH-B1-TN","DH-B1-DS","DH-B1-TLN"]', '2026-11-08T18:30:00Z')
  themChienDich(k.d, { id: 'hanh-trinh-v3-khoi-12', qids: k.qids('DH-B1'), maDe: ['DH-B1'], sbd: ['S1', 'S2', 'S3'], hanNop: '9999-12-31', taoLuc: '2026-10-01T00:00:00Z', theLuc: 24, huyetChien: false })
  await dongBoGoi7(k.env, D11 - NGAY)
  return k
}
type Kho = Awaited<ReturnType<typeof kho>>
const sang = (now: number) => { vi.setSystemTime(now); xoaMoiDem(); xoaDemChienDich() }
async function lamKeHoach(k: Kho, now: number, n: number) {
  const l = (await lapGoi7(k.env, 'S1', now))!
  expect(l.plan.viec.length).toBeGreaterThanOrEqual(n)
  for (const [i, v] of l.plan.viec.slice(0, n).entries()) await lam(k.env, 'S1', v.qid, now + 60_000 + i * 1000, true, { cauVersion: 'v1' })
  return l
}

it('lỡ 11/11 (làm 20/28) ⇒ 12/11 chuỗi chờ bù 8 câu; câu trả nợ câu là câu bù; ngày Kiểm tra ôn tập đã nộp là ngày đạt; một em = nhiều em', async () => {
  const k = await kho()
  const D10 = D11 - NGAY, D12 = D11 + NGAY, D13 = D12 + NGAY, D14 = D13 + NGAY
  sang(D10)
  await lamKeHoach(k, D10, 28) // 10/11 đủ 28 ⇒ chuỗi 1
  sang(D11)
  await lamKeHoach(k, D11, 20) // 11/11 thiếu 8
  sang(D12)
  const a = (await docChuoiNgayBai(k.env, 'S1', D12))!
  expect(a.cuu).toMatchObject({ cau: true, can: 8, daLam: 0, soCu: 1, ngayLo: '2026-11-11', hetHan: '2026-11-15T17:00:00.000Z' })
  expect(a.so).toBe(0)

  const l12 = await lamKeHoach(k, D12, 34) // em mở app: nợ câu 8 ⇒ trả tối thiểu 6 ⇒ mức 34; làm đủ 34
  expect(l12.toiThieu).toBe(34)
  const nk12 = await docNhatKyChuoi(k.env, 'S1', D12 + 3_600_000)
  expect(nk12.muc!.get('2026-11-12')).toBe(34)
  expect(nk12.traNo!.get('2026-11-12')).toBe(6)
  const b = chuoiNgayCuaEm(nk12, '2026-11-12')
  expect(b.cuu).toMatchObject({ can: 8, daLam: 6, soCu: 2 }) // 6 câu trả nợ = 6 câu bù; còn 2
  expect(b.so).toBe(1)
  // đọc nhiều em (lửa đôi / bảng thầy / phụ huynh) ra cùng kết quả
  const nhieu = (await docNhatKyNhieuEm(k.env, ['S1'], '2026-10-28', '2026-11-12')).get('S1')!
  expect(chuoiNgayCuaEm(nhieu, '2026-11-12')).toMatchObject({ so: b.so, cuu: b.cuu })

  // 13/11 là ngày Kiểm tra ôn tập: em nộp bài (kể cả bài trắng — sổ học không có dòng nào) ⇒ ngày đạt
  k.d.sql.prepare("INSERT INTO kiem_tra_ca_nhan(id,sbd,lop,ngay,mo_luc,han_luc,trang_thai,json,nop_luc,diem,cap_nhat_luc) VALUES('ktcn:S1:2026-11-13','S1','12A1','2026-11-13',0,0,'can_lam','{}',NULL,NULL,0)").run()
  sang(D13)
  const chuaNop = (await docChuoiNgayBai(k.env, 'S1', D13))!
  expect(chuaNop.lich7.find((x) => x.ngay === '2026-11-13')!.kieu).toBe('cho')
  k.d.sql.prepare("UPDATE kiem_tra_ca_nhan SET trang_thai='da_nop',nop_luc=1,diem=8 WHERE id='ktcn:S1:2026-11-13'").run()
  const daNop = (await docChuoiNgayBai(k.env, 'S1', D13 + 1000))!
  expect(daNop.lich7.find((x) => x.ngay === '2026-11-13')!.kieu).toBe('hoc')
  expect(daNop.cuu).toMatchObject({ can: 8, daLam: 6, soCu: 3 }) // ngày kiểm tra không có câu bù; chuỗi nếu bù kịp = 10, 12, 13/11
  expect(daNop.so).toBe(2)

  // 14/11: em trả nốt nợ câu ⇒ bù đủ ⇒ ngày 11/11 thành «cứu», chuỗi nối lại
  sang(D14)
  const l14 = (await lapGoi7(k.env, 'S1', D14))!
  await lamKeHoach(k, D14, l14.toiThieu)
  const c = (await docChuoiNgayBai(k.env, 'S1', D14 + 3_600_000))!
  expect(c.cuu).toBeUndefined()
  expect(c.lich7.find((x) => x.ngay === '2026-11-11')!.kieu).toBe('cuu')
  expect(c.so).toBe(4) // 10, 12, 13, 14/11
})

it('bảng nợ câu / lịch kiểm tra chưa có ⇒ chuỗi vẫn đọc được như cũ (lùi về câu đọc mức cũ)', async () => {
  const k = await kho()
  sang(D11 - NGAY)
  await lamKeHoach(k, D11 - NGAY, 28)
  k.d.sql.exec('DROP TABLE goi_bai_7_no_chon')
  const c = (await docChuoiNgayBai(k.env, 'S1', D11))!
  expect(c.so).toBe(1)
  const nk = await docNhatKyChuoi(k.env, 'S1', D11)
  expect(nk.muc!.get('2026-11-10')).toBe(28)
  expect(nk.traNo!.size).toBe(0)
})
