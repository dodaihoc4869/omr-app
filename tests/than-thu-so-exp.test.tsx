/**
 * SỔ EXP NĂM NGUỒN + POPUP LẤP LÁNH.
 *
 * Thầy chốt 15-09: hoàn thành nhiệm vụ thì popup lấp lánh báo được bao nhiêu
 * EXP, và có bảng tóm tắt cộng/trừ theo từng nhiệm vụ, tất cả dồn vào ống.
 *
 * Bất biến quan trọng nhất ở đây: **tổng sổ phải bằng đúng EXP đã vào ống**.
 * Sổ ghi nhiều hơn thực rót là nói dối em; ghi ít hơn là giấu công của em.
 */
// GỌN MÃ 06/10 (lần 2, docs/gon-ma-0610-lan-2.md): màn ThanThuHoaHocGame, PopupThuongExp và he-thong-pet (game Thần thú v1, đã bị than-thu-v2 thay) bị xoá.
// Đã gỡ ĐÚNG phần dùng chúng — quy đổi ghi vào đúng nguồn, popup lấp lánh, bảng tóm tắt, và một `it` đọc hồ sơ qua `vaHoSo`; luật thuần của `kinh-nghiem` (mã còn sống) giữ NGUYÊN.
import { describe, expect, it } from 'vitest'
import {
  NGUON_EXP, DS_NGUON_EXP, TEN_NGUON_EXP, soExpRong, vaSoExp, tongSoExp,
} from '../src/game/than-thu-hoa-hoc/kinh-nghiem'

describe('Năm nguồn EXP', () => {
  it('đúng năm nguồn, nguồn nào cũng có tên tiếng Việt', () => {
    expect(DS_NGUON_EXP).toHaveLength(5)
    for (const k of DS_NGUON_EXP) expect(TEN_NGUON_EXP[k].length).toBeGreaterThan(4)
    expect(DS_NGUON_EXP).toContain('mom')
  })

  it('nộp bài gia đình giao nặng hơn bài tập về nhà — bài dài hai tiếng có người nhà ngồi cạnh', () => {
    expect(NGUON_EXP.nopMom(0)).toBeGreaterThan(NGUON_EXP.nopBtvn() * 0.7)
    expect(NGUON_EXP.nopMom(10)).toBe(400)
    expect(NGUON_EXP.nopMom(8)).toBe(350)
  })

  it('điểm âm hoặc rác không làm EXP âm', () => {
    expect(NGUON_EXP.nopMom(-5)).toBe(150)
    expect(NGUON_EXP.caThi(-3)).toBe(0)
  })
})

describe('Sổ EXP đọc từ máy', () => {
  it('sổ rỗng có đủ năm khoá bằng 0', () => {
    const so = soExpRong()
    expect(Object.keys(so).sort()).toEqual([...DS_NGUON_EXP].sort())
    expect(tongSoExp(so)).toBe(0)
  })
  it('khoá lạ và số âm bị loại', () => {
    const so = vaSoExp({ caThi: 500, linhTinh: 900, btvn: -20 })
    expect(so.caThi).toBe(500)
    expect(so.btvn).toBe(0)
    expect(tongSoExp(so)).toBe(500)
    expect((so as Record<string, number>).linhTinh).toBeUndefined()
  })
})
