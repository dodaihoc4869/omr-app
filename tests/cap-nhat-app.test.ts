// TỰ HỎI BẢN MỚI — vì sửa lỗi xong mà máy vẫn chạy bản cũ là lỗi làm thầy
// mất thời gian nhất: tưởng chưa sửa, sửa lại lần nữa.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { batTuHoiBanMoi, datDangLamBai, GIAN_CACH_TOI_THIEU_MS, NHIP_HOI_MS } from '../src/lib/cap-nhat-app'

afterEach(() => datDangLamBai(false))

function moiTruongGia() {
  const nghe = new Map<string, Set<() => void>>()
  let gio = 1_000_000_000
  let nhipF: (() => void) | null = null
  return {
    ban(t: string) {
      for (const f of nghe.get(t) || []) f()
    },
    troiQua(ms: number) {
      gio += ms
    },
    chayNhip() {
      nhipF?.()
    },
    conNghe() {
      return [...nghe.values()].reduce((n, s) => n + s.size, 0)
    },
    nhipMs: 0,
    daGoNhip: false,
    moi: {
      addEventListener: (t: string, f: () => void) => {
        if (!nghe.has(t)) nghe.set(t, new Set())
        nghe.get(t)!.add(f)
      },
      removeEventListener: (t: string, f: () => void) => nghe.get(t)?.delete(f),
      an: () => false,
      now: () => gio,
      setInterval: (f: () => void, ms: number) => {
        nhipF = f
        return ms
      },
      clearInterval: () => {},
    },
  }
}

describe('batTuHoiBanMoi', () => {
  it('quay lại app thì hỏi máy chủ xem có bản mới', () => {
    const mt = moiTruongGia()
    const update = vi.fn().mockResolvedValue(undefined)
    batTuHoiBanMoi({ update }, mt.moi)
    mt.ban('visibilitychange')
    expect(update).toHaveBeenCalledTimes(1)
  })

  it('có mạng lại thì hỏi — lần trước offline thì hỏi cũng vô ích', () => {
    const mt = moiTruongGia()
    const update = vi.fn().mockResolvedValue(undefined)
    batTuHoiBanMoi({ update }, mt.moi)
    mt.ban('online')
    expect(update).toHaveBeenCalledTimes(1)
  })

  it('bật tắt màn hình liên tục KHÔNG làm hỏi dồn', () => {
    const mt = moiTruongGia()
    const update = vi.fn().mockResolvedValue(undefined)
    batTuHoiBanMoi({ update }, mt.moi)
    for (let i = 0; i < 10; i++) mt.ban('focus')
    expect(update).toHaveBeenCalledTimes(1)
    mt.troiQua(GIAN_CACH_TOI_THIEU_MS + 1)
    mt.ban('focus')
    expect(update).toHaveBeenCalledTimes(2)
  })

  it('app mở cả buổi vẫn hỏi theo nhịp', () => {
    const mt = moiTruongGia()
    const update = vi.fn().mockResolvedValue(undefined)
    batTuHoiBanMoi({ update }, mt.moi)
    mt.troiQua(NHIP_HOI_MS)
    mt.chayNhip()
    expect(update).toHaveBeenCalledTimes(1)
  })

  it('app đang ẩn thì không hỏi', () => {
    const mt = moiTruongGia()
    mt.moi.an = () => true
    const update = vi.fn().mockResolvedValue(undefined)
    batTuHoiBanMoi({ update }, mt.moi)
    mt.ban('visibilitychange')
    expect(update).not.toHaveBeenCalled()
  })

  it('máy chủ lỗi thì nuốt lỗi, không làm sập app', async () => {
    const mt = moiTruongGia()
    const update = vi.fn().mockRejectedValue(new Error('mất mạng'))
    batTuHoiBanMoi({ update }, mt.moi)
    expect(() => mt.ban('focus')).not.toThrow()
    await Promise.resolve()
  })

  it('EM ĐANG THI thì không hỏi — tải lại giữa bài là mất toàn màn hình', () => {
    const mt = moiTruongGia()
    const update = vi.fn().mockResolvedValue(undefined)
    batTuHoiBanMoi({ update }, mt.moi)
    datDangLamBai(true)
    mt.ban('focus')
    mt.troiQua(NHIP_HOI_MS)
    mt.chayNhip()
    expect(update).not.toHaveBeenCalled()

    datDangLamBai(false)
    mt.ban('focus')
    expect(update).toHaveBeenCalledTimes(1)
  })

  it('gỡ xong thì không còn nghe sự kiện nào', () => {
    const mt = moiTruongGia()
    const go = batTuHoiBanMoi({ update: vi.fn().mockResolvedValue(undefined) }, mt.moi)
    expect(mt.conNghe()).toBeGreaterThan(0)
    go()
    expect(mt.conNghe()).toBe(0)
  })
})
