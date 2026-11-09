// @vitest-environment node
// THỬ THÁCH KIM CƯƠNG MẤT HÌNH (thầy 09/11) — phía máy chủ: lượt MỚI (đọc thẳng cột json của kho) và lượt ĐANG DỞ (đọc lại theo ref) đều trả đủ
// trường hình của câu (thanCauImg, imageDataUrl, table, choiceImgs, ideaImgs, hinhAnh); ảnh lời giải (`sau_loi_giai`) KHÔNG đi trước khi nộp.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { taoKhoOmni, cauJson } from './omni-3-ke-hoach-chung'
import { xoaDemPhamVi } from '../server/src/bai-da-day'
import { xoaDemChienDich, xoaDemMetaCau } from '../server/src/srs2-d1'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { xoaDemChanKhoi } from '../server/src/chan-khac-khoi'
import { gameToken } from '../server/src/game-v2-auth'
import { hsKimCuongBatDau } from '../server/src/thuong-kim-cuong'

const NOW = Date.parse('2026-11-09T03:00:00Z')
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW) })
afterEach(() => { vi.useRealTimers(); xoaDemPhamVi(); xoaDemChienDich(); xoaDemCaBaoVe(); xoaDemChanKhoi(); xoaDemMetaCau() })

const CD = 'NGUYEN_TU'
const HINH = {
  thanCauImg: 'https://anh/than.png', imageDataUrl: 'data:image/png;base64,AA', table: [['Chất', 'm (g)'], ['X', '2']],
  choiceImgs: ['https://anh/a.png', '', '', ''], ideaImgs: ['', 'https://anh/yb.png', '', ''],
  hinhAnh: [{ src: 'https://anh/sau-de.png', viTri: 'sau_de' }, { src: 'https://anh/lg.png', viTri: 'sau_loi_giai' }],
}

describe('Kim cương — máy chủ trả đủ hình câu', () => {
  it('lượt mới và lượt đang dở', async () => {
    const k = taoKhoOmni({ 'DH-B8': 16 }, 2)
    k.d.sql.exec(`UPDATE hoc_sinh SET lop='12', mat_khau='mk';
      INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B8','Bài 8',16,0,'v1');
      INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B8','v1','x');`)
    const up = k.d.sql.prepare('UPDATE game_v2_question SET dang = ?, json = ? WHERE ma_de = ? AND qid = ?')
    for (let i = 0; i < 12; i++) up.run(`${CD.toLowerCase()}.d${i % 2}`, cauJson(`DH-B8-${i}`, 'DH-B8', i, { dang: `${CD.toLowerCase()}.d${i % 2}`, sao: 2, ...HINH }), 'DH-B8', `DH-B8-${i}`)
    k.d.sql.prepare("INSERT INTO hanh_trinh_v5_muc(sbd,pham_vi,phien_ban,muc_json,tien_do_json,cap_nhat_luc) VALUES('S1','x','v',?,'{}',1)")
      .run(JSON.stringify([{ vkn: `${CD}.a`, tang: 1, trangThai: 'vung' }, { vkn: `${CD}.b`, tang: 1, trangThai: 'vung' }]))
    const token = await gameToken(k.env, 'S1')
    const kiem = (r: Record<string, unknown>) => {
      const cau = r.cau as Record<string, unknown>[]
      expect(cau.length).toBeGreaterThan(0)
      for (const q of cau) {
        expect(q).toMatchObject({ thanCauImg: HINH.thanCauImg, imageDataUrl: HINH.imageDataUrl, table: HINH.table, choiceImgs: HINH.choiceImgs, ideaImgs: HINH.ideaImgs })
        expect(q.hinhAnh).toEqual([{ src: 'https://anh/sau-de.png', viTri: 'sau_de' }])
      }
      expect(JSON.stringify(r)).not.toMatch(/lg\.png|"correct"|"solution"/)
    }
    const moi = await hsKimCuongBatDau(k.env, { token, chuyenDe: CD }, NOW)
    expect(moi).toMatchObject({ ok: true })
    kiem(moi)
    const tiep = await hsKimCuongBatDau(k.env, { token, chuyenDe: CD }, NOW + 1000)
    expect(tiep).toMatchObject({ ok: true, tiepTuc: true })
    kiem(tiep)
  })
})
