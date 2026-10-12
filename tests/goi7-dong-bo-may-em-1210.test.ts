// @vitest-environment node
// LỖI 12/10 (soát "việc giao câu của code" theo yêu cầu thầy): khi em mở app (`hoc-tap-sanh` / `hoc-tap-start`), máy chủ đồng bộ Gói bài 7 ngày theo
// `hoc_sinh.lop` — cột ấy là KHỐI ("12") trong khi bài thầy tick (`bai_da_day.lop`) mang TÊN LỚP ("12 - Lớp Thường") ⇒ lượt đồng bộ từ máy em khối
// 12 không thấy bài mới nào, phải chờ cron. Khẩn 12/10 21h: bỏ hẳn lượt đồng bộ từ máy em (quá tải giờ cao điểm) — cron + trang thầy đồng bộ, theo
// tên lớp (`sqlTenLopHs` trong `dongBoThat7`).
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { taoKhoOmni } from './omni-3-ke-hoach-chung'
import { dongBoGoi7 } from '../server/src/goi-bai-7'
import { damBaoBangBaiDaDay, lopCuaEm, xoaDemPhamVi } from '../server/src/bai-da-day'
import { xoaDemChienDich } from '../server/src/srs2-d1'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'

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

/** Ba em khối 12 chưa gán tên lớp (⇒ "12 - Lớp Thường"); thầy vừa tick Bài 8 cho lớp ấy; CHƯA đồng bộ lần nào. */
async function kho() {
  const k = taoKhoOmni({ 'DH-B8': 30 }, 3)
  await damBaoBangBaiDaDay(k.env)
  k.d.sql.exec(`UPDATE hoc_sinh SET lop='12', ten_lop=NULL;
    INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B8','Bài 8. Amine',30,0,'v1');
    INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B8','v1','x');
    INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('goi_bai_7_v1','{"bat":true,"batDau":"2026-10-10"}','x')`)
  k.d.sql
    .prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES(?,?,?,?,?,?,?)')
    .run('amine', '12 - Lớp Thường', 'B8', 'Bài 8. Amine', 8, '["DH-B8-TN","DH-B8-DS","DH-B8-TLN"]', '2026-10-11T11:00:00Z')
  return k
}
const soGoi = (k: Awaited<ReturnType<typeof kho>>) => (k.d.sql.prepare('SELECT COUNT(*) AS n FROM goi_bai_7').get() as { n: number }).n

it('đồng bộ theo KHỐI ("12") không thấy bài của lớp "12 - Lớp Thường" — đúng lỗi cũ', async () => {
  const k = await kho()
  await dongBoGoi7(k.env, NOW, 10, '12')
  expect(soGoi(k)).toBe(0)
})

it('đồng bộ theo tên lớp của em (lopCuaEm) tạo gói và gắn đủ 3 em', async () => {
  const k = await kho()
  const lop = await lopCuaEm(k.env, 'S1')
  expect(lop).toBe('12 - Lớp Thường')
  await dongBoGoi7(k.env, NOW, 10, lop ?? '')
  expect(soGoi(k)).toBe(1)
  const em = k.d.sql.prepare("SELECT sbd FROM goi_bai_7_em WHERE goi_id='g7:amine' ORDER BY sbd").all() as { sbd: string }[]
  expect(em.map((e) => e.sbd)).toEqual(['S1', 'S2', 'S3'])
})

it('khẩn 12/10 21h: lệnh hoc-tap-sanh / hoc-tap-start của máy em KHÔNG đồng bộ gói (nạp lại mọi gói của lớp mỗi 20 giây ⇒ quá tải giờ cao điểm)', () => {
  const src = readFileSync(new URL('../server/src/game-v2.ts', import.meta.url), 'utf8')
  const khoi = src.slice(src.indexOf("if(action.startsWith('hoc-tap-'))"), src.indexOf("if(action==='hoc-tap-gap')"))
  expect(khoi).not.toMatch(/dongBoGoi7\(/)
  expect(khoi).not.toMatch(/SELECT lop FROM hoc_sinh/)
  // Bài mới vẫn vào gói qua cron mỗi phút của Worker.
  const idx = readFileSync(new URL('../server/src/index.ts', import.meta.url), 'utf8')
  expect(idx).toMatch(/m\.dongBoGoi7\(env,Date\.now\(\)\)/)
})
