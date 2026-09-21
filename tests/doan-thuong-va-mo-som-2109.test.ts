// EXP KẾT CHẶNG ĐOÀN + MỞ SỚM CHẶNG BTVN (Code 1, 21/09/2026; Điều 9 + Điều 6 phương án B).
import { describe, expect, it } from 'vitest'
import { THUONG_KET_CHANG, THUONG_VO_GIAP, khoanKetChang, thuongKetChang, thuongVoGiap } from '../src/game/than-thu-v2/doan-core'
import { NGUONG_MO_SOM, chuMoSomChang, duocMoSomChang } from '../src/lib/mo-som-chang'

describe('thuongKetChang / vỡ giáp (Điều 9)', () => {
  it('thắng 1 · 2 · 3 sao ⇒ 5 · 10 · 15 EXP (chặng thắng đầu ngày); các chặng sau MỘT NỬA làm tròn lên ⇒ 3 · 5 · 8; thua / 0 sao / số lạ ⇒ 0', () => {
    expect(THUONG_KET_CHANG).toEqual([5, 10, 15])
    expect([1, 2, 3].map((s) => thuongKetChang(s, true))).toEqual([5, 10, 15])
    expect([1, 2, 3].map((s) => thuongKetChang(s, false))).toEqual([3, 5, 8])
    for (const s of [0, -1, Number.NaN, Number.NEGATIVE_INFINITY]) expect(thuongKetChang(s, true), String(s)).toBe(0)
    expect(thuongKetChang(4, true)).toBe(15) // kẹp 3 sao
    expect(thuongKetChang(2.9, true)).toBe(10)
    expect(thuongKetChang(Number.POSITIVE_INFINITY, true)).toBe(0) // không phải số hữu hạn ⇒ 0
  })
  it('vỡ giáp +3 EXP mỗi trùm cho TỪNG bạn; khoản gộp: chặng + vỡ giáp; thua vẫn được điểm vỡ giáp, không được điểm chặng', () => {
    expect(THUONG_VO_GIAP).toBe(3)
    expect(thuongVoGiap([])).toBe(0)
    expect(thuongVoGiap([true])).toBe(3)
    expect(thuongVoGiap([true, false])).toBe(3)
    expect(thuongVoGiap([true, true])).toBe(6)
    expect(khoanKetChang({ thang: true, sao: 3, trumVoGiap: [true, true] }, true)).toEqual({ chang: 15, voGiap: 6, tong: 21 })
    expect(khoanKetChang({ thang: true, sao: 2, trumVoGiap: [true, false] }, false)).toEqual({ chang: 5, voGiap: 3, tong: 8 })
    expect(khoanKetChang({ thang: false, sao: 0, trumVoGiap: [true] }, true)).toEqual({ chang: 0, voGiap: 3, tong: 3 })
    expect(khoanKetChang({ thang: false, sao: 3, trumVoGiap: [] }, true)).toEqual({ chang: 0, voGiap: 0, tong: 0 }) // sao chỉ tính khi thắng
  })
})

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
    expect(chuMoSomChang({ duoc: false, lyDo: 'chua_du_ti_le' }, d)).toBe('Chặng 2 mở 00:00 ngày mai. Muốn luyện thêm hôm nay: vào Đảo thần thú.')
    expect(chuMoSomChang({ duoc: false, lyDo: 'da_mo_som_hom_nay' }, d)).toBe('Chặng 2 mở 00:00 ngày mai. Muốn luyện thêm hôm nay: vào Đảo thần thú.')
    expect(chuMoSomChang({ duoc: false, lyDo: 'het_chang' }, d)).toBe('Em đã làm hết các chặng của bài tập về nhà này.')
  })
})
