// @vitest-environment node
// CHUẨN BỊ KHI RỜI APP GIỮA CHỪNG (thầy 29/10 «mở app tức thì mọi lúc»; server/src/san-sang.ts `chuanBiKhiThoat`, lệnh `hoc-tap-chuan-bi`): em làm dở chặng rồi khoá máy / đổi ứng dụng ⇒
// bản lập sẵn Sảnh + chặng (đã hết hạn vì em vừa làm câu) được lập lại NỀN một lần — lần mở app sau không phải lập kế hoạch ~3 s. Tối đa 1 lượt / 90 s mỗi em.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { taoKhoOmni, themChienDich } from './omni-3-ke-hoach-chung'
import { dongBoGoi7 } from '../server/src/goi-bai-7'
import { SQL_BANG_HANH_TRINH } from '../server/src/hanh-trinh-hop-nhat'
import { SQL_SAN_SANG, chuanBiKhiThoat, xoaChuanBiKhiThoat, HAN_CHUAN_BI_THOAT_MS } from '../server/src/san-sang'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { xoaDemChienDich, xoaDemMetaCau } from '../server/src/srs2-d1'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { xoaDemChanKhoi } from '../server/src/chan-khac-khoi'
import { gameToken } from '../server/src/game-v2-auth'
import type { Env } from '../server/src/kieu'

const NOW = Date.parse('2026-10-29T13:30:00Z')
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW); xoaChuanBiKhiThoat() })
afterEach(() => { vi.useRealTimers(); xoaChuanBiKhiThoat(); xoaDemPhamVi(); xoaDemChienDich(); xoaDemCaBaoVe(); xoaDemChanKhoi(); xoaDemMetaCau() })

describe('chuanBiKhiThoat — giới hạn lượt', () => {
  it('lượt đầu lập nền; trong 90 s không lập thêm; qua 90 s lập lại; không có ctx ⇒ không làm gì', async () => {
    const nen: Promise<unknown>[] = []
    const ctx = { waitUntil: (p: Promise<unknown>) => { nen.push(p) } }
    const env = {} as Env // lập lỗi ⇒ trả false, không ném
    expect(chuanBiKhiThoat(env, 'S1', ctx, NOW)).toEqual({ ok: true, dang: true })
    expect(chuanBiKhiThoat(env, 'S1', ctx, NOW + 1000)).toEqual({ ok: true, dang: false })
    expect(chuanBiKhiThoat(env, 'S2', ctx, NOW + 1000)).toEqual({ ok: true, dang: true }) // em khác không bị chặn
    expect(chuanBiKhiThoat(env, 'S1', ctx, NOW + HAN_CHUAN_BI_THOAT_MS + 1)).toEqual({ ok: true, dang: true })
    expect(chuanBiKhiThoat(env, 'S3', undefined, NOW)).toEqual({ ok: true, dang: false })
    expect(nen).toHaveLength(3)
    await Promise.all(nen)
  })
})

describe('đường thật qua Worker', () => {
  async function kho() {
    const k = taoKhoOmni({ 'DH-B8': 24 }, 3)
    for (const q of SQL_BANG_HANH_TRINH) k.d.sql.exec(q)
    for (const q of SQL_SAN_SANG) k.d.sql.exec(q)
    k.d.sql.exec('CREATE TABLE IF NOT EXISTS chien_dich_em (chien_dich_id TEXT NOT NULL, sbd TEXT NOT NULL, them_luc TEXT, bot_luc TEXT, PRIMARY KEY (chien_dich_id, sbd))')
    await damBaoBangBaiDaDay(k.env)
    const b8 = k.qids('DH-B8')
    k.d.sql.exec(`UPDATE hoc_sinh SET lop='12', ten_lop=NULL, mat_khau='mk';
      INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B8','Bài 8. Amine',24,0,'v1');
      INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B8','v1','x');
      INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('goi_bai_7_v1','{"bat":true,"batDau":"2026-10-10"}','x')`)
    k.d.sql.prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES(?,?,?,?,?,?,?)')
      .run('amine', '12 - Lớp Thường', 'B8', 'Bài 8. Amine', 8, '["DH-B8"]', '2026-10-28T11:00:00Z')
    themChienDich(k.d, { id: 'hanh-trinh-v3-khoi-12', qids: b8, maDe: ['DH-B8'], sbd: ['S1', 'S2'], hanNop: '9999-12-31', taoLuc: '2026-10-01T00:00:00Z', theLuc: 24, huyetChien: false })
    await dongBoGoi7(k.env, NOW)
    return { k, env: k.env as Env, token: await gameToken(k.env as Env, 'S1') }
  }

  it('lệnh `hoc-tap-chuan-bi`: trả ok ngay, lập nền bản sẵn hôm nay (Sảnh + chặng có tem); lượt thứ hai trong 90 s không lập lại; token giả bị từ chối', async () => {
    const x = await kho()
    const nen: Promise<unknown>[] = []
    const ctx = { waitUntil: (p: Promise<unknown>) => { nen.push(p) }, passThroughOnException() {} }
    const goi = async (token: string) => worker.fetch(new Request('https://test/game-v2/hoc-tap-chuan-bi', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token }) }), x.env, ctx as never)
    expect(x.k.d.dem('hoc_tap_san_sang', "sbd='S1'")).toBe(0)
    const r = await goi(x.token)
    expect(await r.json()).toMatchObject({ ok: true, dang: true })
    await Promise.all(nen)
    expect(x.k.d.dem('hoc_tap_san_sang', "sbd='S1' AND ngay='2026-10-29'")).toBe(1)
    const cau = x.k.d.sql.prepare("SELECT json_array_length(json_extract(chang_json,'$.questions')) n FROM hoc_tap_san_sang WHERE sbd='S1'").get() as { n: number }
    expect(cau.n).toBeGreaterThanOrEqual(5)
    const r2 = await goi(x.token)
    expect(await r2.json()).toMatchObject({ ok: true, dang: false })
    expect(nen).toHaveLength(1)
    const sai = await goi('khong.hop-le')
    expect(((await sai.json()) as { ok?: boolean }).ok).not.toBe(true)
  })
})
