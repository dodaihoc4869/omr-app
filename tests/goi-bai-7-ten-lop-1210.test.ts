// @vitest-environment node
// LỖI THẬT 12/10 — thầy chụp bảng bài 7 ngày của gói "12 - Lớp Thường · Bài 8 Amine": "Học sinh nhận bài 0 · Câu cần chữa 132".
// Nguyên nhân: `goi_bai_7.lop` (= `bai_da_day.lop`) là TÊN LỚP ("12 - Lớp Thường", "12 - Tinh Hoa") còn máy chủ gắn em vào gói / lọc em của gói theo
// `hoc_sinh.lop` — cột ấy là KHỐI ("12", hợp đồng ten-lop.ts) ⇒ không em nào khớp: bảng thầy 0 em, máy em không thấy gói. Sửa: so theo tên lớp hiệu
// lực (`sqlTenLopHs` — đúng luật `tenLopCuaEm`). Test cũ (goi-bai-7-1010) dùng lớp "12A1" ở CẢ hai cột nên không bắt được lỗi.
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { taoKhoOmni, themChienDich } from './omni-3-ke-hoach-chung'
import { dongBoGoi7, docGoiCuaEm7, lapGoi7, sqlTenLopHs } from '../server/src/goi-bai-7'
import { gvGoi7 } from '../server/src/goi-bai-7-thay'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { xoaDemChienDich } from '../server/src/srs2-d1'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { tenLopCuaEm } from '../server/src/ten-lop'

const NOW = Date.parse('2026-10-12T02:00:00Z')
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
})
afterEach(() => {
  vi.useRealTimers()
  xoaDemPhamVi()
  xoaDemChienDich()
  xoaDemCaBaoVe()
})

/** Lớp thật của trung tâm: `lop` = KHỐI; S1–S3 khối 12 chưa gán tên lớp (⇒ "12 - Lớp Thường"), S4 "12 - Tinh Hoa", S5 khối 11 (⇒ "11"). */
async function kho() {
  const k = taoKhoOmni({ 'DH-B8': 30 }, 5)
  await damBaoBangBaiDaDay(k.env)
  k.d.sql.exec(`UPDATE hoc_sinh SET lop='12', ten_lop=NULL WHERE sbd IN ('S1','S2','S3');
    UPDATE hoc_sinh SET lop='12', ten_lop='12 - Tinh Hoa' WHERE sbd='S4';
    UPDATE hoc_sinh SET lop='11', ten_lop=NULL WHERE sbd='S5';
    INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B8','Bài 8. Amine',30,0,'v1');
    INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B8','v1','x');
    INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('goi_bai_7_v1','{"bat":true,"batDau":"2026-10-10"}','x')`)
  k.d.sql
    .prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES(?,?,?,?,?,?,?)')
    .run('amine', '12 - Lớp Thường', 'B8', 'Bài 8. Amine', 8, '["DH-B8-TN","DH-B8-DS","DH-B8-TLN"]', '2026-10-11T11:00:00Z')
  // Hành trình khối 12 của ba em (lập kế hoạch ngày cần chiến dịch của em — như kho của goi-bai-7-1010).
  themChienDich(k.d, { id: 'hanh-trinh-v3-khoi-12', qids: k.qids('DH-B8'), maDe: ['DH-B8'], sbd: ['S1', 'S2', 'S3'], hanNop: '9999-12-31', taoLuc: '2026-10-01T00:00:00Z', theLuc: 24, huyetChien: false })
  await dongBoGoi7(k.env, NOW)
  return k
}

it('biểu thức SQL tên lớp của em khớp đúng luật tenLopCuaEm (đã gán · khối 12 · khối khác · rỗng)', () => {
  const k = taoKhoOmni({}, 1)
  const cases: [string | null, string | null][] = [['12', null], ['12', ''], ['12', '12 - Tinh Hoa'], ['11', null], [' 10 ', null], ['', null], [null, null], ['12', '  12 - Nhóm 10 điểm  ']]
  for (const [lop, ten] of cases) {
    k.d.sql.prepare('UPDATE hoc_sinh SET lop=?, ten_lop=? WHERE sbd=?').run(lop ?? '', ten, 'S1')
    const r = k.d.sql.prepare(`SELECT ${sqlTenLopHs('h')} AS t FROM hoc_sinh h WHERE h.sbd='S1'`).get() as { t: string }
    expect(r.t, `lop=${lop} ten_lop=${ten}`).toBe(tenLopCuaEm(lop ?? '', ten))
  }
})

it('gói của lớp "12 - Lớp Thường" nhận đúng 3 em khối 12 chưa gán lớp; bảng thầy báo 3 em (trước: 0)', async () => {
  const k = await kho()
  const em = k.d.sql.prepare("SELECT sbd FROM goi_bai_7_em WHERE goi_id='g7:amine' ORDER BY sbd").all() as { sbd: string }[]
  expect(em.map((e) => e.sbd)).toEqual(['S1', 'S2', 'S3'])
  const r = await gvGoi7(k.env, { goiId: 'g7:amine' })
  expect(r).toMatchObject({ bat: true, goiId: 'g7:amine', soEm: 3, soCau: 30 })
  expect((r.em as { sbd: string }[]).map((e) => e.sbd).sort()).toEqual(['S1', 'S2', 'S3'])
  // em lớp khác (Tinh Hoa cùng khối 12, khối 11) không bị kéo vào gói
  expect((r.em as { sbd: string }[]).some((e) => e.sbd === 'S4' || e.sbd === 'S5')).toBe(false)
})

it('máy em thấy gói của lớp mình; em lớp khác không thấy; lập kế hoạch đọc phạm vi theo tên lớp', async () => {
  const k = await kho()
  const g1 = await docGoiCuaEm7(k.env, 'S1', NOW)
  expect(g1.map((g) => g.id)).toEqual(['g7:amine'])
  expect(g1[0]!.cau).toHaveLength(30)
  expect(await docGoiCuaEm7(k.env, 'S4', NOW)).toEqual([])
  expect(await docGoiCuaEm7(k.env, 'S5', NOW)).toEqual([])
  const lap = await lapGoi7(k.env, 'S2', NOW)
  expect(lap?.goi.map((g) => g.id)).toEqual(['g7:amine'])
})

it('em mới gán vào lớp sau khi gói đã lập cũng được nhận bài ở lần đồng bộ sau (không tạo lại tiến độ em cũ)', async () => {
  const k = await kho()
  k.d.sql.prepare("UPDATE hoc_sinh SET ten_lop='12 - Lớp Thường' WHERE sbd='S4'").run()
  await dongBoGoi7(k.env, NOW + 60_000, 2, '', true)
  const em = k.d.sql.prepare("SELECT sbd FROM goi_bai_7_em WHERE goi_id='g7:amine' ORDER BY sbd").all() as { sbd: string }[]
  expect(em.map((e) => e.sbd)).toEqual(['S1', 'S2', 'S3', 'S4'])
})
