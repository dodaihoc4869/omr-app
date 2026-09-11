// MÁY CHỦ MỚI — cấu hình. Hai luật an toàn phải được mã ép, không dựa vào trí nhớ.
import { describe, expect, it, vi } from 'vitest'
import { MAC_DINH_MAY_CHU, chuanHoaMayChu, gianVaoThi } from '../src/lib/cau-hinh-may-chu'

describe('mặc định phải AN TOÀN', () => {
  it('TẮT khi thầy chưa đụng gì — app chạy y như hôm nay', () => {
    expect(MAC_DINH_MAY_CHU.BAT).toBe(false)
    expect(chuanHoaMayChu(undefined).BAT).toBe(false)
    expect(chuanHoaMayChu(null).BAT).toBe(false)
  })
  it('đường lùi về Apps Script mặc định BẬT', () => {
    expect(chuanHoaMayChu({}).LUI_VE_APPS_SCRIPT).toBe(true)
    expect(chuanHoaMayChu({ LUI_VE_APPS_SCRIPT: undefined }).LUI_VE_APPS_SCRIPT).toBe(true)
  })
  it('chỉ tắt được đường lùi khi ghi ĐÚNG false, không phải giá trị mơ hồ', () => {
    expect(chuanHoaMayChu({ LUI_VE_APPS_SCRIPT: false }).LUI_VE_APPS_SCRIPT).toBe(false)
  })
})

describe('bật mà chưa có URL thì vẫn coi là tắt', () => {
  it('URL rỗng ⇒ BAT false, dù thầy đã tích bật', () => {
    expect(chuanHoaMayChu({ BAT: true, URL: '' }).BAT).toBe(false)
    expect(chuanHoaMayChu({ BAT: true, URL: '   ' }).BAT).toBe(false)
  })
  it('có URL ⇒ bật được', () => {
    expect(chuanHoaMayChu({ BAT: true, URL: 'https://omr.workers.dev' }).BAT).toBe(true)
  })
  it('cắt dấu / thừa ở cuối để ghép đường dẫn không ra //', () => {
    expect(chuanHoaMayChu({ URL: 'https://omr.workers.dev///' }).URL).toBe('https://omr.workers.dev')
  })
})

describe('số hỏng thì về mặc định, không ra NaN', () => {
  it('hạn chờ và số lần thử', () => {
    const c = chuanHoaMayChu({ HAN_GIAY: 0, SO_LAN_THU: -2 })
    expect(c.HAN_GIAY).toBe(10)
    expect(c.SO_LAN_THU).toBe(3)
  })
  it('giãn vào thi CHẤP NHẬN 0 — thầy tắt giãn được', () => {
    expect(chuanHoaMayChu({ GIAN_VAO_THI_GIAY: 0 }).GIAN_VAO_THI_GIAY).toBe(0)
  })
  it('giãn vào thi hỏng ⇒ về 3', () => {
    expect(chuanHoaMayChu({ GIAN_VAO_THI_GIAY: NaN }).GIAN_VAO_THI_GIAY).toBe(3)
  })
})

describe('giãn vào thi', () => {
  it('chờ trong khoảng 0..N giây', async () => {
    vi.useFakeTimers()
    const p = gianVaoThi(chuanHoaMayChu({ GIAN_VAO_THI_GIAY: 3 }), () => 0.5)
    await vi.advanceTimersByTimeAsync(2000)
    await expect(p).resolves.toBe(1500)
    vi.useRealTimers()
  })
  it('đặt 0 thì KHÔNG chờ chút nào', async () => {
    await expect(gianVaoThi(chuanHoaMayChu({ GIAN_VAO_THI_GIAY: 0 }), () => 0.9)).resolves.toBe(0)
  })
})
