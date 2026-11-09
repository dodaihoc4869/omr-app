// @vitest-environment node
// PHÂN LẠI CÂU CHO TOÀN BỘ HỌC SINH (thầy 09/11) — scripts/phan-lai-0911.ts, chạy MỘT lần trong bước phát hành.
// Khoá: gói đang chạy được KÉO DÀI tới hạn chung (không rút), qua đường sửa hạn (ghi hạn cũ ⇒ lùi được); dòng mức hôm nay ≠ 28 của em chưa đủ mức
// bị xoá để chốt lại 28; chỉ chạy một lần; có ca mở ⇒ không làm gì, không đánh dấu.
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { taoKhoOmni, themChienDich } from './omni-3-ke-hoach-chung'
import { dongBoGoi7 } from '../server/src/goi-bai-7'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { xoaDemChienDich } from '../server/src/srs2-d1'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { congNgay7 } from '../server/src/goi-bai-7-loi'
import { hanChung } from '../server/src/han-chung'
import { phanLai0911 } from '../scripts/phan-lai-0911'

const NOW = Date.parse('2026-10-12T02:00:00Z')
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW) })
afterEach(() => { vi.useRealTimers(); xoaDemPhamVi(); xoaDemChienDich(); xoaDemCaBaoVe() })

async function kho() {
  const k = taoKhoOmni({ 'DH-B1': 127 })
  await damBaoBangBaiDaDay(k.env)
  k.d.sql.exec(`INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B1','Bài mới',127,0,'v1');INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B1','v1','x');
    INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('goi_bai_7_v1','{"bat":true,"batDau":"2026-10-10"}','x')`)
  k.d.sql.prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES(?,?,?,?,?,?,?)')
    .run('latest', '12A1', 'B1', 'Bài mới', 1, '["DH-B1-TN","DH-B1-DS","DH-B1-TLN"]', '2026-10-09T18:30:00Z')
  themChienDich(k.d, { id: 'hanh-trinh-v3-khoi-12', qids: k.qids('DH-B1'), maDe: ['DH-B1'], sbd: ['S1', 'S2', 'S3'], hanNop: '9999-12-31', taoLuc: '2026-10-01T00:00:00Z', theLuc: 24, huyetChien: false })
  await dongBoGoi7(k.env, Date.parse('2026-10-10T02:00:00Z'))
  // Giả lập gói giao TRƯỚC khi có hạn chung: hạn cũ bat_dau + 6.
  k.d.sql.exec("UPDATE goi_bai_7 SET han='2026-10-16'; UPDATE goi_bai_7_em SET han='2026-10-16'")
  const muc = k.d.sql.prepare('INSERT INTO goi_bai_7_muc_ngay(sbd,ngay,tang,toi_thieu_tang,quota,muc,luc) VALUES(?,?,?,?,?,?,?)')
  muc.run('S1', '2026-10-12', 1, 24, 18, 24, 'x')
  muc.run('S2', '2026-10-12', 3, 36, 18, 36, 'x')
  muc.run('S3', '2026-10-12', 1, 28, 18, 28, 'x')
  return k
}

it('kéo dài gói đang chạy tới hạn chung (qua sửa hạn, ghi hạn cũ), chốt lại mức hôm nay ≠ 28 của em chưa đủ mức; chỉ chạy một lần', async () => {
  const k = await kho()
  const kq = await phanLai0911(k.env, NOW)
  const hanMoi = congNgay7('2026-10-10', hanChung(127, [null, null, null]).T - 1)
  expect(hanMoi > '2026-10-16').toBe(true)
  expect(kq).toMatchObject({ phanLai0911: 'xong', soGoiKeoDaiHan: 1, loi: [] })
  expect(k.d.sql.prepare("SELECT han FROM goi_bai_7 WHERE id='g7:latest'").get()).toEqual({ han: hanMoi })
  expect(k.d.sql.prepare("SELECT DISTINCT han FROM goi_bai_7_em WHERE goi_id='g7:latest'").all()).toEqual([{ han: hanMoi }])
  expect(k.d.sql.prepare("SELECT han_cu,han_moi FROM goi_bai_7_sua_han WHERE goi_id='g7:latest'").all()).toEqual([{ han_cu: '2026-10-16', han_moi: hanMoi }])
  // gói đổi hạn ⇒ đường sửa hạn xoá mức hôm nay của MỌI em chưa đủ mức trong gói (kể cả dòng 28) để lần mở kế tiếp chốt lại theo luật mới (28)
  expect(k.d.sql.prepare("SELECT sbd,muc FROM goi_bai_7_muc_ngay WHERE ngay='2026-10-12' ORDER BY sbd").all()).toEqual([])
  expect(await phanLai0911(k.env, NOW)).toEqual({ phanLai0911: 'da-chay-truoc' })
})

it('không rút hạn: gói đã có hạn dài hơn hạn chung giữ nguyên; vẫn chốt lại mức hôm nay ≠ 28 của em chưa đủ mức, giữ dòng 28', async () => {
  const k = await kho()
  k.d.sql.exec("UPDATE goi_bai_7 SET han='2026-12-31'; UPDATE goi_bai_7_em SET han='2026-12-31'")
  const kq = await phanLai0911(k.env, NOW)
  expect(kq).toMatchObject({ phanLai0911: 'xong', soGoiKeoDaiHan: 0, soDongMucHomNayTinhLai: 2 })
  expect(k.d.sql.prepare("SELECT han FROM goi_bai_7 WHERE id='g7:latest'").get()).toEqual({ han: '2026-12-31' })
  expect(k.d.sql.prepare("SELECT sbd,muc FROM goi_bai_7_muc_ngay WHERE ngay='2026-10-12' ORDER BY sbd").all()).toEqual([{ sbd: 'S3', muc: 28 }])
})

it('có ca thi mở ⇒ không đổi gì, không đánh dấu (lần phát hành sau chạy lại)', async () => {
  const k = await kho()
  k.d.sql.prepare("INSERT INTO ca(ma_ca,trang_thai,cap_nhat_luc) VALUES('CA1','mo','x')").run()
  expect(await phanLai0911(k.env, NOW)).toEqual({ phanLai0911: 'hoan-co-ca-mo' })
  expect(k.d.sql.prepare("SELECT han FROM goi_bai_7 WHERE id='g7:latest'").get()).toEqual({ han: '2026-10-16' })
  expect(k.d.sql.prepare("SELECT COUNT(*) n FROM cau_hinh WHERE khoa='phan_lai_0911'").get()).toEqual({ n: 0 })
})
