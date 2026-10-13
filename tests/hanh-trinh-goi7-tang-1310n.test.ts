// @vitest-environment node
// ĐỢT 19 · LÀN N (13/10) — NGUYÊN NHÂN GỐC "Chưa có danh sách bài." ở tab Hành trình: khi Gói 7 bật, lệnh `hoc-tap-sanh` trả dạng gọn
// `{ goi7, theLuc, … }` KHÔNG có `hanhTrinh` (game-v2.ts, nhánh `lapGoi7`), mà màn chỉ đọc bài từ `hanhTrinh.bai`. Khoá đầu–cuối bằng máy chủ thật trên
// D1 giả: phản hồi Sảnh Gói 7 không có `hanhTrinh` nhưng app vẫn dựng được bài từ `goi7.goi`; trường CHỈ-THÊM `goi7.tang` / `goi7.goi[].tang` tính từ
// hồ sơ `lapGoi7` vừa đọc (không thêm lượt D1) và app đọc đúng; tóm tắt dựng tay không có hồ sơ ⇒ không gửi tầng (không bịa).
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { taoKhoOmni, themChienDich } from './omni-3-ke-hoach-chung'
import { dongBoGoi7, lapGoi7, tomTatGoi7 } from '../server/src/goi-bai-7'
import { SQL_BANG_HANH_TRINH } from '../server/src/hanh-trinh-hop-nhat'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { xoaDemChienDich } from '../server/src/srs2-d1'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { xoaDemChanKhoi } from '../server/src/chan-khac-khoi'
import { gameV2 } from '../server/src/game-v2'
import { gameToken } from '../server/src/game-v2-auth'
import { docSanh } from '../src/components/hoa2/api'
import { docTomTatGoi7 } from '../src/lib/goi-bai-7'
import { baiHanhTrinhEm, tangChungEm } from '../src/components/hoc-tap/HanhTrinhOnSua'

const NOW = Date.parse('2026-10-12T02:00:00Z') // 09:00 giờ VN
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW) })
afterEach(() => { vi.useRealTimers(); xoaDemPhamVi(); xoaDemChienDich(); xoaDemCaBaoVe(); xoaDemChanKhoi() })

async function kho() {
  const k = taoKhoOmni({ 'DH-B8': 12 }, 1)
  for (const q of SQL_BANG_HANH_TRINH) k.d.sql.exec(q)
  await damBaoBangBaiDaDay(k.env)
  k.d.sql.exec(`UPDATE hoc_sinh SET lop='12', ten_lop=NULL, mat_khau='mk';
    INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B8','Bài 8. Amine',12,0,'v1');
    INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B8','v1','x');
    INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('goi_bai_7_v1','{"bat":true,"batDau":"2026-10-10"}','x')`)
  k.d.sql.prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES(?,?,?,?,?,?,?)')
    .run('amine', '12 - Lớp Thường', 'B8', 'Bài 8. Amine', 8, '["DH-B8"]', '2026-10-11T11:00:00Z')
  themChienDich(k.d, { id: 'hanh-trinh-v3-khoi-12', qids: k.qids('DH-B8'), maDe: ['DH-B8'], sbd: ['S1'], hanNop: '9999-12-31', taoLuc: '2026-10-01T00:00:00Z', theLuc: 24, huyetChien: false })
  await dongBoGoi7(k.env, NOW)
  return { ...k, token: await gameToken(k.env, 'S1') }
}

it('Sảnh Gói 7 không có hanhTrinh (nguyên nhân gốc) — app vẫn có bài từ goi7; tầng CHỈ-THÊM là số thật 1–4 và app đọc đúng', async () => {
  const k = await kho()
  const r = (await gameV2(k.env, 'hoc-tap-sanh', { token: k.token })) as Record<string, unknown>
  expect(r.goi7).toBeTruthy()
  expect('hanhTrinh' in r).toBe(false)
  const g7 = r.goi7 as { tang?: number; goi: { ten: string; tang?: number }[] }
  expect([1, 2, 3, 4]).toContain(g7.tang)
  expect(g7.goi.map((g) => g.ten)).toEqual(['Bài 8. Amine'])
  expect([1, 2, 3, 4]).toContain(g7.goi[0]!.tang)
  const sanh = docSanh(JSON.parse(JSON.stringify(r)))
  const s = sanh && sanh.cheDo2 ? sanh.sanh : null
  const bai = baiHanhTrinhEm(s)
  expect(bai.map((b) => b.ten)).toEqual(['Bài 8. Amine'])
  expect(bai[0]!.tang).toBe(g7.goi[0]!.tang)
  expect(bai[0]!.gap).toEqual({ da: expect.any(Number), tong: 12 })
  expect(tangChungEm(s)).toBe(g7.tang)
  // Cùng số với lượt lập kế hoạch (không phép tính thứ hai)
  const lap = (await lapGoi7(k.env, 'S1', NOW))!
  expect(lap.tang).toBe(g7.tang)
  expect(lap.tangGoi.get(lap.goi[0]!.id)).toBe(g7.goi[0]!.tang)
})

it('tóm tắt dựng không có hồ sơ (không bằng chứng) ⇒ không gửi tầng; app bỏ tầng lạ', () => {
  const lap = { goi: [], plan: { viec: [], thieuPhu: 0, tuLam: 0, tiepCan: 0 }, toiThieu: 24, daLamNgay: 0, kienThucCu: { tong: 0, dat: 0, tyLe: null }, diemDaDo: [] } as unknown as Parameters<typeof tomTatGoi7>[0]
  expect('tang' in tomTatGoi7(lap, NOW)).toBe(false)
  const tho = { bat: true, ngay: '2026-10-12', toiThieu: 24, daLamHomNay: 0, tang: 7, goi: [{ id: 'a', ten: 'Bài 8. Amine', tong: 10, daGap: 2, tang: '2' }, { id: 'b', ten: 'Bài 9', tong: 5, daGap: 0, tang: 4 }] }
  const d = docTomTatGoi7(tho)!
  expect('tang' in d).toBe(false)
  expect('tang' in d.goi[0]!).toBe(false)
  expect(d.goi[1]!.tang).toBe(4)
})
