// @vitest-environment node
// LỐI VÀO THỬ THÁCH KIM CƯƠNG (27/10, thầy: «tự làm theo đề xuất thông minh»): POST /hs/kim-cuong/ds — danh sách chuyên đề em ĐÃ VỮNG (cùng luật mở của
// /hs/kim-cuong/bat-dau) + lượt đang dở / khoá 24 giờ / đã đạt. Công tắc tắt ⇒ bat:false, ds rỗng. Không câu, không đáp án. D1 thật (node:sqlite).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { taoKhoOmni } from './omni-3-ke-hoach-chung'
import { gameToken } from '../server/src/game-v2-auth'
import { hsKimCuongDs, trangThaiMucKimCuong, KC_HAN_LUOT_MS } from '../server/src/thuong-kim-cuong'
import { KC_KHOA_MS } from '../server/src/thuong-luat'
import { gvCongTacThuong } from '../server/src/thuong-d1'

const NOW = Date.parse('2026-10-27T03:00:00Z')
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW) })
afterEach(() => { vi.useRealTimers() })

async function kho(muc: { vkn: string; trangThai: string }[]) {
  const k = taoKhoOmni({ 'DH-B8': 4 }, 2)
  k.d.sql.exec(`UPDATE hoc_sinh SET lop='12', mat_khau='mk';`)
  k.d.sql.prepare("INSERT INTO hanh_trinh_v5_muc(sbd,pham_vi,phien_ban,muc_json,tien_do_json,cap_nhat_luc) VALUES('S1','x','v',?,'{}',1)").run(JSON.stringify(muc))
  const token = await gameToken(k.env, 'S1')
  return { ...k, token }
}
const phien = (k: Awaited<ReturnType<typeof kho>>, id: string, cd: string, tao: number, ket: string | null, xong: number | null = null) =>
  k.d.sql.prepare('INSERT INTO kim_cuong_phien(id, em, chuyen_de, tao_luc, xong_luc, ket_qua, ong_con) VALUES (?,?,?,?,?,?,3)').run(id, 'S1', cd, tao, xong, ket)

describe('trạng thái thuần', () => {
  it('lượt dở còn hạn ⇒ dang; trượt ⇒ khoá tới +24 giờ; bỏ dở quá hạn ⇒ khoá từ lúc hết hạn; đạt / hết khoá ⇒ mo', () => {
    expect(trangThaiMucKimCuong(undefined, NOW)).toEqual({ tt: 'mo' })
    expect(trangThaiMucKimCuong({ tao_luc: NOW - 60_000, ket_qua: null }, NOW)).toEqual({ tt: 'dang' })
    expect(trangThaiMucKimCuong({ tao_luc: NOW - 3_600_000, xong_luc: NOW - 600_000, ket_qua: 'truot' }, NOW))
      .toEqual({ tt: 'khoa', moLaiLuc: new Date(NOW - 600_000 + KC_KHOA_MS).toISOString() })
    const tao = NOW - KC_HAN_LUOT_MS - 1000
    expect(trangThaiMucKimCuong({ tao_luc: tao, ket_qua: null }, NOW)).toEqual({ tt: 'khoa', moLaiLuc: new Date(tao + KC_HAN_LUOT_MS + KC_KHOA_MS).toISOString() })
    expect(trangThaiMucKimCuong({ tao_luc: NOW - 2 * KC_KHOA_MS, xong_luc: NOW - 2 * KC_KHOA_MS, ket_qua: 'truot' }, NOW)).toEqual({ tt: 'mo' })
    expect(trangThaiMucKimCuong({ tao_luc: NOW - 60_000, xong_luc: NOW - 1000, ket_qua: 'dat' }, NOW)).toEqual({ tt: 'mo' })
  })
})

describe('POST /hs/kim-cuong/ds (D1 thật)', () => {
  it('chỉ chuyên đề đã vững (≥ 80 % kỹ năng «vững») + lượt dở / khoá / đã đạt; tên chuyên đề tiếng Việt; không lộ câu', async () => {
    const k = await kho([
      { vkn: 'NGUYEN_TU.a', trangThai: 'vung' }, { vkn: 'NGUYEN_TU.b', trangThai: 'vung' },
      { vkn: 'ESTER.a', trangThai: 'vung' }, { vkn: 'ESTER.b', trangThai: 'chua_vung' },
      { vkn: 'POLYMER.a', trangThai: 'vung' },
    ])
    phien(k, 'p1', 'POLYMER', NOW - 3_600_000, 'truot', NOW - 600_000)
    phien(k, 'p2', 'HALOGEN', NOW - 5 * KC_KHOA_MS, 'dat', NOW - 5 * KC_KHOA_MS)
    const r = await hsKimCuongDs(k.env, { token: k.token }, NOW)
    expect(r).toMatchObject({ ok: true, bat: true })
    const ds = r.ds as { ma: string; ten: string; tt: string; daDat: boolean; moLaiLuc?: string }[]
    expect(ds.map((x) => [x.ma, x.tt, x.daDat])).toEqual([['NGUYEN_TU', 'mo', false], ['POLYMER', 'khoa', false], ['HALOGEN', 'chua_vung', true]])
    expect(ds[0]!.ten).toBe('Cấu tạo nguyên tử')
    expect(ds[1]!.moLaiLuc).toBe(new Date(NOW - 600_000 + KC_KHOA_MS).toISOString())
    expect(JSON.stringify(r)).not.toMatch(/correct|solution|"cau"/)
  })

  it('công tắc Kim cương tắt ⇒ bat:false, ds rỗng; token hỏng ⇒ ok:false; định tuyến /hs/kim-cuong/ds', async () => {
    const k = await kho([{ vkn: 'NGUYEN_TU.a', trangThai: 'vung' }])
    const ctx = { waitUntil() {}, passThroughOnException() {} }
    const res = await worker.fetch(new Request('https://test/hs/kim-cuong/ds', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token: k.token }) }), k.env, ctx as never)
    expect(await res.json()).toMatchObject({ ok: true, bat: true, ds: [{ ma: 'NGUYEN_TU', tt: 'mo' }] })
    await gvCongTacThuong(k.env, { khoa: 'thuong_kim_cuong', giaTri: 'tat' })
    expect(await hsKimCuongDs(k.env, { token: k.token }, NOW)).toEqual({ ok: true, bat: false, ds: [] })
    expect(await hsKimCuongDs(k.env, { token: 'x.y' }, NOW)).toMatchObject({ ok: false })
  })
})
