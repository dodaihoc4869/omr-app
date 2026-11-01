// @vitest-environment node
// GIAO BÀI MỚI ⇒ XẾP LẠI PHẦN LUYỆN HÔM NAY + BÁO MÁY EM (thầy 01/11: «Khi giao bài mới thì học sinh ngay lập tức được phân câu lại, tự động xoá bỏ lượt phân câu
// trong ngày không đè lên số câu cũ trước đó. Tự động tải lại câu mới đề và đáp án về máy học sinh»). Khoá:
//   · gói 7 MỚI tạo ⇒ xoá số kế hoạch tính sẵn từ hôm nay (`goi_bai_7_ngay` mọi gói, `goi_bai_7_muc_ngay`) của ĐÚNG các em nhận gói; ngày trước + em khác giữ nguyên;
//     sổ làm bài không đụng; lần đồng bộ sau (gói đã có) không xoá lại;
//   · báo máy: mỗi em ⇒ ngăn của em (`apac|<sbd>`, đường `/__ngan/bao`, dấu nội bộ) ⇒ ngăn đẩy `{"t":"doi","k":["goi"]}` tới MỌI máy đang mở (không trừ máy nào);
//   · dấu báo nội bộ do máy khách tự gửi bị Worker xoá (không giả được tin).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { taoKhoOmni } from './omni-3-ke-hoach-chung'
import { dongBoGoi7 } from '../server/src/goi-bai-7'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { xoaDemChienDich } from '../server/src/srs2-d1'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { NganHocSinh } from '../server/src/index'
import { DAU_BAO_NGAN, DAU_SBD_NGAN, DAU_TRONG_NGAN, DUONG_BAO_NGAN, baoMayCacEm, xoaDemNganDinh } from '../server/src/ngan-hoc-sinh'
import type { Env } from '../server/src/kieu'

const NOW = Date.parse('2026-11-01T02:00:00Z') // 09:00 VN, hôm nay 2026-11-01
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW); xoaDemNganDinh() })
afterEach(() => { vi.useRealTimers(); xoaDemPhamVi(); xoaDemChienDich(); xoaDemCaBaoVe() })

/** Ngăn giả: ghi lại mọi lượt gọi (tên ngăn, đường, dấu báo). */
function nsGia() {
  const goi: { ten: string; duong: string; bao: string | null; sbd: string | null }[] = []
  const ns = {
    idFromName: (ten: string) => ({ toString: () => ten }),
    get: (id: { toString(): string }) => ({
      fetch: async (req: Request) => {
        goi.push({ ten: id.toString(), duong: new URL(req.url).pathname, bao: req.headers.get(DAU_BAO_NGAN), sbd: req.headers.get(DAU_SBD_NGAN) })
        return new Response(null, { status: 204 })
      },
    }),
  }
  return { ns, goi }
}

async function kho() {
  const k = taoKhoOmni({ 'DH-B1': 40, 'DH-B2': 30 })
  await damBaoBangBaiDaDay(k.env)
  k.d.sql.exec(`INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B1','Bài 1',40,0,'v1'),('DH-B2','Bài 2',30,0,'v1');
    INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B1','v1','x'),('DH-B2','v1','x');
    INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('goi_bai_7_v1','{"bat":true,"batDau":"2026-10-25"}','x')`)
  k.d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('K1','Em lớp khác','11A1','x')").run()
  const tick = k.d.sql.prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES(?,?,?,?,?,?,?)')
  tick.run('t1', '12A1', 'B1', 'Bài 1', 1, '["DH-B1-TN","DH-B1-DS","DH-B1-TLN"]', '2026-10-28T01:00:00Z')
  const { ns, goi } = nsGia()
  const env = { ...k.env, NGAN_HS: ns, MA_BI_MAT: 'bi-mat-thu' } as unknown as Env
  await dongBoGoi7(env, Date.parse('2026-10-28T02:00:00Z'), 2, '', true)
  goi.length = 0
  // Kế hoạch tính sẵn: hôm qua + hôm nay + mai cho em lớp 12A1 (S1) và em lớp khác (K1).
  const muc = k.d.sql.prepare('INSERT INTO goi_bai_7_muc_ngay(sbd,ngay,tang,toi_thieu_tang,quota,muc,luc) VALUES(?,?,1,24,6,24,?)')
  const ngay = k.d.sql.prepare('INSERT INTO goi_bai_7_ngay(goi_id,sbd,ngay,quota) VALUES(?,?,?,6)')
  for (const s of ['S1', 'K1']) for (const n of ['2026-10-31', '2026-11-01', '2026-11-02']) { muc.run(s, n, 'x'); ngay.run('g7:t1', s, n) }
  return { k, env, goi, tick }
}
const dem = (k: Awaited<ReturnType<typeof kho>>['k'], bang: string, sbd: string) =>
  k.d.sql.prepare(`SELECT ngay FROM ${bang} WHERE sbd = ? ORDER BY ngay`).all(sbd).map((r) => (r as { ngay: string }).ngay)

describe('giao bài mới ⇒ xếp lại phần luyện hôm nay', () => {
  it('gói mới ⇒ xoá số kế hoạch từ hôm nay của đúng em nhận gói; hôm qua và em khác giữ nguyên; báo máy từng em; đồng bộ lại không xoá nữa', async () => {
    const { k, env, goi, tick } = await kho()
    tick.run('t2', '12A1', 'B2', 'Bài 2', 2, '["DH-B2-TN","DH-B2-DS","DH-B2-TLN"]', '2026-11-01T01:30:00Z')
    const r = await dongBoGoi7(env, NOW, 2, '12A1', true)
    expect(r.soGoi).toBe(1)
    expect(dem(k, 'goi_bai_7_muc_ngay', 'S1')).toEqual(['2026-10-31'])
    expect(dem(k, 'goi_bai_7_ngay', 'S1')).toEqual(['2026-10-31'])
    expect(dem(k, 'goi_bai_7_muc_ngay', 'K1')).toEqual(['2026-10-31', '2026-11-01', '2026-11-02'])
    expect(dem(k, 'goi_bai_7_ngay', 'K1')).toEqual(['2026-10-31', '2026-11-01', '2026-11-02'])
    const emNhan = k.d.sql.prepare("SELECT sbd FROM goi_bai_7_em WHERE goi_id = 'g7:t2' ORDER BY sbd").all().map((x) => (x as { sbd: string }).sbd)
    expect(emNhan.length).toBeGreaterThan(0)
    expect(goi.filter((g) => g.duong === DUONG_BAO_NGAN).map((g) => g.sbd).sort()).toEqual(emNhan)
    expect(goi.every((g) => g.ten === `apac|${g.sbd}` && g.bao === 'goi')).toBe(true)
    // Ghi lại kế hoạch mới cho hôm nay; đồng bộ lần nữa (gói đã có) ⇒ không xoá, không báo lại.
    k.d.sql.prepare("INSERT INTO goi_bai_7_muc_ngay(sbd,ngay,tang,toi_thieu_tang,quota,muc,luc) VALUES('S1','2026-11-01',1,24,9,30,'y')").run()
    goi.length = 0
    expect((await dongBoGoi7(env, NOW + 60_000, 2, '12A1', true)).soGoi).toBe(0)
    expect(dem(k, 'goi_bai_7_muc_ngay', 'S1')).toEqual(['2026-10-31', '2026-11-01'])
    expect(goi).toEqual([])
  })

  it('có ca thi mở ⇒ không tạo gói, không xoá kế hoạch, không báo máy', async () => {
    const { k, env, goi, tick } = await kho()
    k.d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,thoi_gian_phut,loai,cap_nhat_luc) VALUES('C1','Ca',  'mo',45,'thi','x')").run()
    xoaDemCaBaoVe()
    tick.run('t2', '12A1', 'B2', 'Bài 2', 2, '["DH-B2-TN"]', '2026-11-01T01:30:00Z')
    expect((await dongBoGoi7(env, NOW, 2, '12A1', true)).soGoi).toBe(0)
    expect(dem(k, 'goi_bai_7_muc_ngay', 'S1')).toEqual(['2026-10-31', '2026-11-01', '2026-11-02'])
    expect(goi).toEqual([])
  })
})

describe('báo máy em qua ngăn', () => {
  interface WsGia { gui: string[]; kem: unknown; send(x: string): void; close(): void; serializeAttachment(v: unknown): void; deserializeAttachment(): unknown }
  const wsGia = (m: string): WsGia => ({ gui: [], kem: { m }, send(x) { this.gui.push(x) }, close() {}, serializeAttachment(v) { this.kem = v }, deserializeAttachment() { return this.kem } })
  it('ngăn nhận lệnh báo ⇒ đẩy ngay {"t":"doi","k":["goi"]} tới MỌI máy đang mở (không trừ máy nào)', async () => {
    const A = wsGia('mayA'), B = wsGia('mayB')
    const state = { waitUntil() {}, getWebSockets: () => [A, B] } as never
    const ngan = new NganHocSinh(state, { MA_BI_MAT: 'x' } as unknown as Env)
    const r = await ngan.fetch(new Request(`https://ngan${DUONG_BAO_NGAN}`, { method: 'POST', headers: { [DAU_TRONG_NGAN]: '1', [DAU_SBD_NGAN]: 'S1', [DAU_BAO_NGAN]: 'goi' } }))
    expect(r.status).toBe(204)
    expect(A.gui.map((x) => JSON.parse(x))).toEqual([{ t: 'doi', k: ['goi'] }])
    expect(B.gui.map((x) => JSON.parse(x))).toEqual([{ t: 'doi', k: ['goi'] }])
  })
  it('kênh tắt / không có ngăn ⇒ không gọi gì; nhiều em ⇒ mỗi em một lượt (bỏ trùng)', async () => {
    const { ns, goi } = nsGia()
    expect(await baoMayCacEm({ NGAN_HS: ns, MA_BI_MAT: 'x', TAT_KENH_DAY: '1' } as unknown as Env, ['S1'])).toBe(0)
    expect(await baoMayCacEm({ MA_BI_MAT: 'x' } as unknown as Env, ['S1'])).toBe(0)
    expect(goi).toEqual([])
    const env = { NGAN_HS: ns, MA_BI_MAT: 'x', TAT_NGAN_DINH: '1', DB: {} } as unknown as Env
    expect(await baoMayCacEm(env, ['S1', 'S2', 'S1', ' '])).toBe(2)
    expect(goi.map((g) => g.ten).sort()).toEqual(['apac|S1', 'apac|S2'])
  })
})
