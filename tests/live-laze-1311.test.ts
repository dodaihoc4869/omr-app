// @vitest-environment node
// CHẤM LAZE (thầy 13/11: «nút laze để lại nhưng cho tôi một phím tắt để bật tắt và nó phải soi được mọi chỗ trên màn chiếu nhé, mặc định tắt nhé» ·
// «ẩn laze trong video nhé»). Khoá: (1) gói con trỏ mang cờ laze (14 byte), gói cũ 13 byte = không laze, máy em bản cũ vẫn đọc được x, y; (2) bộ nội suy
// máy em đưa cờ tới lớp vẽ; (3) gói con trỏ là luồng KHÔNG lưu ⇒ không vào sổ nét / xem lại; (4) mã tờ: phím P báo app, app giữ trạng thái mặc định tắt,
// chấm soi mọi chỗ (nghe cả tài liệu, cả khi bút tắt), nhắc vị trí khi đứng yên bằng hẹn giờ tự nối (không vòng setInterval).
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { giaiGoi, maTro } from '../src/lib/live/ma-net'
import { taoDemPhat } from '../src/lib/live/noi-suy'
import { MA_DIEM, nhomKhung } from '../src/lib/bpu/phong-live'
import { JS_LIVE_KHOI_TO_CHIEU } from '../src/lib/live-khoi-to-chieu'

describe('gói con trỏ mang cờ laze', () => {
  it('có cờ ⇒ 14 byte, giải ra lz; không cờ ⇒ 13 byte như cũ, không lz', () => {
    const co = maTro({ phien: 7, tGui: 1234, x: 0.25, y: 1.5, lz: true }), khong = maTro({ phien: 7, tGui: 1234, x: 0.25, y: 1.5 })
    expect(co.length).toBe(14); expect(khong.length).toBe(13)
    expect(giaiGoi(co, 7)).toEqual({ phien: 7, tGui: 1234, k: 'tro', x: 0.25, y: 1.5, lz: true })
    expect(giaiGoi(khong, 7)).toEqual({ phien: 7, tGui: 1234, k: 'tro', x: 0.25, y: 1.5 })
  })
  it('máy em bản cũ (chỉ đọc x, y) vẫn đọc đúng gói laze: 13 byte đầu y hệt gói thường', () => {
    const co = maTro({ phien: 7, tGui: 99, x: 0.4, y: 0.6, lz: true }), khong = maTro({ phien: 7, tGui: 99, x: 0.4, y: 0.6 })
    expect([...co.subarray(0, 13)]).toEqual([...khong])
  })
  it('gói con trỏ thuộc nhóm ĐIỂM (phòng chỉ chuyển tiếp, không ghi sổ nét) ⇒ video xem lại không có chấm laze', () => {
    expect(nhomKhung(MA_DIEM.tro)).toBe('diem')
  })
})

describe('máy em: bộ nội suy đưa cờ laze tới lớp vẽ', () => {
  it('con trỏ có cờ ⇒ khung.but.lz = true; không cờ ⇒ không có lz (cây bút như thường)', () => {
    const a = taoDemPhat(), b = taoDemPhat()
    for (let i = 0; i <= 5; i++) { a.nap({ phien: 1, tGui: i * 50, k: 'tro', x: i / 10, y: 0.5, lz: true }, 1000 + i * 50); b.nap({ phien: 1, tGui: i * 50, k: 'tro', x: i / 10, y: 0.5 }, 1000 + i * 50) }
    const ka = a.khung(1400), kb = b.khung(1400)
    expect(ka.but?.lz).toBe(true); expect(ka.tro?.lz).toBe(true)
    expect(kb.but).not.toBeNull(); expect(kb.but?.lz).toBeUndefined()
  })
})

describe('mã tờ + app', () => {
  const to = JS_LIVE_KHOI_TO_CHIEU, but = readFileSync('src/lib/but-bang-to-chieu.ts', 'utf8'), app = readFileSync('src/components/live/thay-noi.ts', 'utf8'), lop = readFileSync('src/components/live-khoi/LopNoiThay.tsx', 'utf8')
  it('phím P trên tờ (đang live, không gõ chữ) ⇒ báo app; app giữ trạng thái MẶC ĐỊNH TẮT và báo tờ bằng live-lz; phím P ở cửa sổ app cũng đổi', () => {
    expect(to).toContain("e.code !== 'KeyP'")
    expect(to).toContain("lvGui('lz')")
    expect(to).toContain("m.lenh !== 'live-lz'")
    expect(app).toMatch(/let lzBat = false/)
    expect(app).toContain("case 'lz': doiLaze(); break")
    expect(app).toContain("export function doiLaze(): void { lzBat = !lzBat; guiTo({ lenh: 'live-lz', bat: lzBat }) }")
    expect(app).toContain("guiTo({ lenh: 'live-lz', bat: lzBat }) }") // tờ mới lên chiếu nhận đúng trạng thái
    expect(lop).toContain("m.doiLaze()")
  })
  it('chấm soi MỌI chỗ: nghe con trỏ trên cả tài liệu (cả khi bút tắt), ẩn khi đặt bút; bút gửi cờ laze; nhắc vị trí bằng hẹn giờ tự nối, không setInterval', () => {
    expect(to).toContain("document.addEventListener('pointermove'")
    expect(to).toContain("document.addEventListener('pointerdown', function () { nhan = true; an(); }, true)")
    expect(but).toContain('S.lz ? 1 : 0')
    expect(but).toMatch(/document\.addEventListener\('pointermove', function \(e\) \{\s+ngoaiLz = 0;\s+if \(!S\.lz/)
    expect(but).toContain('hLz = setTimeout(')
    expect(`${to}\n${but}`).not.toMatch(/setInterval\(\s*function\s*\(\)\s*\{[^}]*baoTro/)
  })
})
