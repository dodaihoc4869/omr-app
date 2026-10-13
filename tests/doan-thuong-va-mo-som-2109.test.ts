// EXP KẾT CHẶNG ĐOÀN + MỞ SỚM CHẶNG BTVN (Code 1, 21/09/2026; Điều 9 + Điều 6 phương án B).
import { describe, expect, it } from 'vitest'
import { NGUONG_MO_SOM, chuMoSomChang, duocMoSomChang } from '../src/lib/mo-som-chang'

describe('duocMoSomChang (Điều 6 B)', () => {
  it('đúng ≥ 80 %, hôm nay chưa mở sớm, còn chặng kế ⇒ được; dưới 80 % ⇒ chua_du_ti_le; đã mở sớm ⇒ da_mo_som_hom_nay; hết chặng ⇒ het_chang (thứ tự nói lý do)', () => {
    expect(NGUONG_MO_SOM).toBe(0.8)
    const v = (o = {}) => ({ tiLeDungChangVuaXong: 0.9, soChangMoSomHomNay: 0, conChangKe: true, ...o })
    expect(duocMoSomChang(v())).toEqual({ duoc: true, lyDo: null })
    expect(duocMoSomChang(v({ tiLeDungChangVuaXong: 0.8 }))).toEqual({ duoc: true, lyDo: null }) // đúng 80 % vừa đủ
    expect(duocMoSomChang(v({ tiLeDungChangVuaXong: 8 / 10 }))).toEqual({ duoc: true, lyDo: null })
    expect(duocMoSomChang(v({ tiLeDungChangVuaXong: 0.79 }))).toEqual({ duoc: false, lyDo: 'chua_du_ti_le' })
    expect(duocMoSomChang(v({ soChangMoSomHomNay: 1 }))).toEqual({ duoc: false, lyDo: 'da_mo_som_hom_nay' })
    expect(duocMoSomChang(v({ conChangKe: false }))).toEqual({ duoc: false, lyDo: 'het_chang' })
    // thứ tự: hết chặng thắng đã mở sớm thắng chưa đủ %
    expect(duocMoSomChang(v({ conChangKe: false, soChangMoSomHomNay: 1, tiLeDungChangVuaXong: 0 }))).toEqual({ duoc: false, lyDo: 'het_chang' })
    expect(duocMoSomChang(v({ soChangMoSomHomNay: 2, tiLeDungChangVuaXong: 0 }))).toEqual({ duoc: false, lyDo: 'da_mo_som_hom_nay' })
    // số lạ: tỉ lệ không phải số ⇒ 0 ⇒ chưa đủ; số chặng đã mở lạ ⇒ 0
    expect(duocMoSomChang(v({ tiLeDungChangVuaXong: Number.NaN }))).toEqual({ duoc: false, lyDo: 'chua_du_ti_le' })
    expect(duocMoSomChang(v({ soChangMoSomHomNay: Number.NaN }))).toEqual({ duoc: true, lyDo: null })
  })
  it('TÍNH CHẤT: mọi tổ hợp — được ⇔ tỉ lệ ≥ 0,8 ∧ chưa mở sớm hôm nay ∧ còn chặng kế; đúng MỘT chặng mỗi ngày (mở rồi thì không mở thêm dù đúng 100 %)', () => {
    for (const t of [0, 0.5, 0.79, 0.8, 0.85, 1]) for (const da of [0, 1, 2, 5]) for (const con of [true, false]) {
      const kq = duocMoSomChang({ tiLeDungChangVuaXong: t, soChangMoSomHomNay: da, conChangKe: con })
      expect(kq.duoc, `${t}/${da}/${con}`).toBe(t >= 0.8 && da === 0 && con)
      expect(kq.duoc, `${t}/${da}/${con}`).toBe(kq.lyDo === null)
    }
  })
  it('chữ cho màn theo đề bài: đủ điều kiện · chưa đủ; hết chặng nói thật', () => {
    const d = { soChangXong: 1, soChangKe: 2, dung: 9, tong: 10 }
    expect(chuMoSomChang({ duoc: true, lyDo: null }, d)).toBe('Em làm tốt chặng 1 (đúng 9/10). Em được mở sớm chặng 2 ngay hôm nay.')
    expect(chuMoSomChang({ duoc: false, lyDo: 'chua_du_ti_le' }, d)).toBe('Chặng 2 mở 00:00 ngày mai. Muốn luyện thêm hôm nay: vào Bát Linh Đảo.')
    expect(chuMoSomChang({ duoc: false, lyDo: 'da_mo_som_hom_nay' }, d)).toBe('Chặng 2 mở 00:00 ngày mai. Muốn luyện thêm hôm nay: vào Bát Linh Đảo.')
    expect(chuMoSomChang({ duoc: false, lyDo: 'het_chang' }, d)).toBe('Em đã làm hết các chặng của bài tập về nhà này.')
  })
})
