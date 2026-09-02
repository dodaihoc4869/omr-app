// Giờ máy chủ là nguồn duy nhất (QUANLYCATHI mục 3, kiểm chứng 11: đổi giờ
// điện thoại không kéo dài được bài thi).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { _resetGioMayChu, daDongBoGio, dongBoGioMayChu, giayConLai, gioMayChu } from '../src/lib/gio-may-chu'

let wall = 1_700_000_000_000 // Date.now() giả
let perf = 10_000 // performance.now() giả

describe('gio-may-chu', () => {
  beforeEach(() => {
    _resetGioMayChu()
    wall = 1_700_000_000_000
    perf = 10_000
    vi.spyOn(Date, 'now').mockImplementation(() => wall)
    vi.spyOn(performance, 'now').mockImplementation(() => perf)
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('chưa đồng bộ → dùng giờ máy em', () => {
    expect(daDongBoGio()).toBe(false)
    expect(gioMayChu()).toBe(wall)
  })

  it('máy em lệch 5 phút so với máy chủ → sau đồng bộ, giờ trả về là giờ máy chủ', () => {
    const server = wall - 5 * 60_000
    dongBoGioMayChu(server)
    expect(gioMayChu()).toBe(server)
    wall += 30_000
    perf += 30_000
    expect(gioMayChu()).toBe(server + 30_000)
  })

  it('em chỉnh giờ điện thoại LÙI 20 phút giữa chừng → đồng hồ vẫn chạy theo thời gian thật', () => {
    const server = wall
    dongBoGioMayChu(server)
    wall += 60_000
    perf += 60_000
    // lùi đồng hồ tường 20 phút
    wall -= 20 * 60_000
    perf += 1_000
    expect(gioMayChu()).toBe(server + 61_000)
  })

  it('máy ngủ làm performance.now() đứng yên → lấy theo đồng hồ tường (không chậm giờ)', () => {
    dongBoGioMayChu(wall)
    wall += 120_000 // 2 phút trôi qua thật, perf không nhúc nhích
    expect(gioMayChu()).toBe(1_700_000_000_000 + 120_000)
  })

  it('chỉnh giờ TIẾN chỉ làm mất giờ (không có lợi), không bao giờ âm thời gian trôi', () => {
    dongBoGioMayChu(wall)
    wall -= 10_000
    perf -= 10_000 // không thể xảy ra thực tế, nhưng không được ra giờ trước mốc
    expect(gioMayChu()).toBe(1_700_000_000_000)
  })

  it('giayConLai tính từ mốc hết giờ ISO của máy chủ', () => {
    dongBoGioMayChu(wall)
    const het = new Date(wall + 45 * 60_000).toISOString()
    expect(giayConLai(het)).toBe(45 * 60)
    wall += 45 * 60_000 + 5_000
    perf += 45 * 60_000 + 5_000
    expect(giayConLai(het)).toBe(-5)
  })

  it('bỏ qua serverNow không hợp lệ', () => {
    dongBoGioMayChu(NaN)
    dongBoGioMayChu(0)
    expect(daDongBoGio()).toBe(false)
  })
})
