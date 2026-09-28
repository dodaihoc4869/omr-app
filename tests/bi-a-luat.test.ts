// @vitest-environment node
// BI-A PHẢN ỨNG — luật (nghiệm thu 3, 16): bảng quyết định cuối cú, đánh đôi 4 ghế, người giữ bi trả lời, sai là sang lượt ngay.
import { describe, expect, it } from 'vitest'
import { chiaBi, biCuaGhe, congMatThan, conLaiDoi, diemMuc, duocDanhTiep, hopLeDich, quanHe, taoGhe, tiepTheo, xetCu, EM, type BangBi } from '../src/game/bi-a/luat'
import { KL, PK, type KiHieu } from '../src/game/bi-a/nguyen-to'
import { aiTinh, dichCua } from '../src/game/bi-a/ai'
import { suKienMoi, xepBan, type SuKienCu } from '../src/game/bi-a/vat-ly'

const ev = (firstHit: KiHieu | null, potted: (KiHieu | 'cue')[] = []): SuKienCu => ({ ...suKienMoi(), firstHit, potted, cuePotted: potted.includes('cue') })
const don = taoGhe('don', 'Khánh Linh'), doi = taoGhe('doi', 'Khánh Linh')
const an = (bi: BangBi, ids: KiHieu[]) => { for (const id of ids) bi[id].an = true; return bi }

describe('Bi-a — chia ghế và bi', () => {
  it('đấu đơn: 2 ghế, em giữ 7 bi Kim loại; đánh đôi: 4 ghế luân phiên 2 phe, em 4 bi, đồng đội 3 bi', () => {
    expect(don.map((g) => g.doi)).toEqual([0, 1])
    expect(biCuaGhe(chiaBi('don'), EM)).toEqual([...KL])
    expect(doi.map((g) => g.doi)).toEqual([0, 1, 0, 1])
    const b = chiaBi('doi')
    expect(biCuaGhe(b, 0)).toEqual(['Na', 'Al', 'Cu', 'Au'])
    expect(biCuaGhe(b, 2)).toEqual(['Mg', 'Fe', 'Ag'])
    expect(biCuaGhe(b, 1)).toEqual(['N', 'F', 'S', 'I'])
    expect(biCuaGhe(b, 3)).toEqual(['O', 'P', 'Cl'])
    expect([0, 1, 2, 3].map((g) => tiepTheo(g, 4))).toEqual([1, 2, 3, 0])
    expect(tiepTheo(1, 2)).toBe(0)
  })
  it('nhãn chỉ bi: của em / đồng đội / đối thủ / Bi chốt', () => {
    const b = chiaBi('doi')
    expect(quanHe('Na', EM, doi, b)).toBe('em')
    expect(quanHe('Mg', EM, doi, b)).toBe('dong-doi')
    expect(quanHe('O', EM, doi, b)).toBe('doi-thu')
    expect(quanHe('C', EM, doi, b)).toBe('chot')
    expect(quanHe('Mg', EM, don, chiaBi('don'))).toBe('em')
  })
})

describe('Bi-a — bảng quyết định cuối cú', () => {
  it('bi vàng rơi ⇒ ăn ngay, đánh tiếp', () => {
    const b = chiaBi('don'); b.Na.vang = true
    const k = xetCu(ev('Na', ['Na']), 0, don, b, false, 7)
    expect(k).toMatchObject({ maLoi: null, anNgay: ['Na'], hang: [] })
    expect(duocDanhTiep(k, [])).toBe(true)
  })
  it('bi thường rơi ⇒ hàng câu, người giữ bi trả lời; đúng ⇒ đánh tiếp, sai ⇒ hết lượt', () => {
    const k = xetCu(ev('Na', ['Na']), 0, don, chiaBi('don'), false, 7)
    expect(k.hang).toEqual([{ loai: 'bi', id: 'Na', nguoiTL: 0 }])
    expect(duocDanhTiep(k, [true])).toBe(true)
    expect(duocDanhTiep(k, [false])).toBe(false)
  })
  it('rơi 2 bi, câu đầu sai ⇒ hết lượt (bi sau về bàn do màn chơi xử lý, không mở câu)', () => {
    const k = xetCu(ev('Na', ['Na', 'Mg']), 0, don, chiaBi('don'), false, 7)
    expect(k.hang.map((h) => (h.loai === 'bi' ? h.id : 'C'))).toEqual(['Na', 'Mg'])
    expect(duocDanhTiep(k, [false])).toBe(false)
  })
  it('bi trống rơi ⇒ ăn ngay (không câu)', () => {
    const b = chiaBi('don'); b.Al.trong = true
    expect(xetCu(ev('Al', ['Al']), 0, don, b, false, 7).anNgay).toEqual(['Al'])
  })
  it('bi phe đối thủ rơi ⇒ đặt lại chân bàn, hết lượt dù ăn được bi mình', () => {
    const b = chiaBi('don'); b.Na.vang = true
    const k = xetCu(ev('Na', ['Na', 'O']), 0, don, b, false, 7)
    expect(k.cuaBan).toEqual(['O']); expect(k.datLai).toEqual(['O'])
    expect(duocDanhTiep(k, [])).toBe(false)
  })
  it('P1 bi cái rơi: mọi bi rơi về bàn, đặt bi cái đầu bàn, không mở câu', () => {
    const k = xetCu(ev('Na', ['Na', 'cue']), 0, don, chiaBi('don'), false, 7)
    expect(k).toMatchObject({ maLoi: 'P1', datLai: ['Na'], datBiCai: true, hang: [] })
  })
  it('P2 không chạm bi nào', () => { expect(xetCu(ev(null), 0, don, chiaBi('don'), false, 7).maLoi).toBe('P2') })
  it('P3 chạm bi đối thủ trước — nhưng cú phá bàn thì không', () => {
    expect(xetCu(ev('O'), 0, don, chiaBi('don'), false, 7).maLoi).toBe('P3')
    expect(xetCu(ev('O'), 0, don, chiaBi('don'), true, 7).maLoi).toBeNull()
  })
  it('đánh đôi: chạm trước bi của ĐỒNG ĐỘI không phạm luật; đồng đội đánh bi của em vào lỗ ⇒ EM trả lời', () => {
    const k = xetCu(ev('Mg', ['Na']), 2, doi, chiaBi('doi'), false, 7)
    expect(k.maLoi).toBeNull()
    expect(k.hang).toEqual([{ loai: 'bi', id: 'Na', nguoiTL: 0 }])
  })
  it('đánh đôi: em đánh bi của đồng đội vào lỗ ⇒ ĐỒNG ĐỘI (ghế 3) trả lời', () => {
    expect(xetCu(ev('Na', ['Mg']), 0, doi, chiaBi('doi'), false, 7).hang).toEqual([{ loai: 'bi', id: 'Mg', nguoiTL: 2 }])
  })
  it('P4 chạm Bi chốt trước khi phe ăn đủ 7 bi; P5 Bi chốt rơi sớm (kể cả phá bàn)', () => {
    expect(xetCu(ev('C'), 0, don, chiaBi('don'), false, 3).maLoi).toBe('P4')
    expect(xetCu(ev('Na', ['C']), 0, don, chiaBi('don'), false, 3).maLoi).toBe('P5')
    expect(xetCu(ev('Na', ['C']), 0, don, chiaBi('don'), true, 7).maLoi).toBe('P5')
  })
  it('Câu chốt: người HẠ Bi chốt trả lời câu của chính mình (đánh đôi: đồng đội hạ ⇒ đồng đội trả lời)', () => {
    const b = an(chiaBi('doi'), [...KL])
    const k = xetCu(ev('C', ['C']), 2, doi, b, false, 0)
    expect(k).toMatchObject({ maLoi: null, hang: [{ loai: 'chot', nguoiTL: 2 }] })
  })
  it('Bi chốt là bi trống (hết trần / giao hữu) rơi hợp lệ ⇒ thắng ngay, không câu', () => {
    const b = an(chiaBi('don'), [...KL])
    expect(xetCu(ev('C', ['C']), 0, don, b, false, 0, true)).toMatchObject({ thangNgay: true, hang: [] })
  })
  it('hết bi của phe mới được nhắm Bi chốt; phá bàn nhắm gì cũng hợp lệ', () => {
    const b = chiaBi('don')
    expect(hopLeDich('C', 0, b, false)).toBe(false)
    expect(hopLeDich('Na', 0, b, false)).toBe(true)
    expect(hopLeDich('O', 0, b, false)).toBe(false)
    expect(hopLeDich('O', 0, b, true)).toBe(true)
    an(b, [...KL])
    expect(conLaiDoi(b, 0)).toBe(0)
    expect(hopLeDich('C', 0, b, false)).toBe(true)
    expect(hopLeDich('Na', 0, b, false)).toBe(false)
  })
  it('không phạm luật mà không ăn bi nào ⇒ hết lượt', () => {
    expect(duocDanhTiep(xetCu(ev('Na'), 0, don, chiaBi('don'), false, 7), [])).toBe(false)
  })
  it('Mắt thần không vượt 3; điểm theo mức độ', () => {
    expect(congMatThan(congMatThan(congMatThan(congMatThan(0))))).toBe(3)
    expect([diemMuc('NB'), diemMuc('TH'), diemMuc('VD'), diemMuc('van_dung'), diemMuc(null)]).toEqual([10, 20, 30, 30, 10])
  })
})

describe('Bi-a — A.I Đỗ Đại Học', () => {
  it('chỉ nhắm bi của phe mình; ăn hết thì nhắm Bi chốt; cú phá bàn có lực', () => {
    const st = xepBan(() => 0.5), b = chiaBi('don')
    expect(dichCua(st, b, 1).map((x) => x.id).sort()).toEqual([...PK].sort())
    an(b, [...PK])
    expect(dichCua(st, b, 1).map((x) => x.id)).toEqual(['C'])
    const cu = aiTinh(xepBan(() => 0.5), 1, chiaBi('don'), true, { x: 0, y: -1 }, () => 0.5)
    expect(cu.p).toBeGreaterThan(0.3)
    expect(Math.hypot(cu.aim.x, cu.aim.y)).toBeCloseTo(1, 5)
  })
})
