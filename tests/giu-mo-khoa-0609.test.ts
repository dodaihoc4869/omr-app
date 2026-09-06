// GIỮ MỞ KHOÁ TỚI KHI ĐÓNG TAB HAY THOÁT APP — thầy chốt 06/09, lần thứ hai.
//
// Nguyên văn: "giữ nguyên mở khoá ứng dụng, chỉ khi nào tắt tab mở lại hoặc
// thoát app mở lại mới phải điền mật khẩu".
//
// Đây là một câu có RANH GIỚI RÕ, nên test được hết: mọi đường khác từng khoá
// app lại giữa buổi đều phải chết, và đúng một đường được giữ.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { HOI_LAI_MAC_DINH, phaiHoiLai, type NacHoiLai } from '../src/lib/khoa-app'

const doc = (f: string) => readFileSync(resolve(__dirname, '..', f), 'utf8')

describe('không có mốc thời gian nào khoá app lại', () => {
  it('1. mọi nấc, mọi khoảng thời gian ẩn — đều KHÔNG hỏi lại', () => {
    const nac: NacHoiLai[] = ['moi_lan_mo', 'sau_15_phut', 'sau_60_phut']
    const khoang = [0, 1000, 60_000, 15 * 60_000, 60 * 60_000, 24 * 3600_000]
    for (const n of nac) for (const ms of khoang) expect(phaiHoiLai(n, ms)).toBe(false)
  })

  it('2. thầy để nấc 60 phút từ trước thì cũng KHÔNG bị khoá — dữ liệu cũ không lôi lại luật cũ', () => {
    expect(phaiHoiLai('sau_60_phut', 99 * 3600_000)).toBe(false)
  })

  it('3. mặc định vẫn là nấc nhẹ nhất, phòng khi luật đổi lần nữa', () => {
    expect(HOI_LAI_MAC_DINH).toBe('moi_lan_mo')
  })
})

describe('phiên được cất KHÔNG ĐIỀU KIỆN', () => {
  it('4. mở khoá xong là cất phiên, không hỏi ô gạt nào', () => {
    // Trước đây `if (await docGiuPhien()) await catPhien(ma)` — thầy lỡ tắt ô
    // gạt là mỗi lần tải lại trang phải gõ mật khẩu, mà không hiểu vì sao.
    const app = doc('src/App.tsx')
    expect(app).toContain('await catPhien(ma)')
    expect(app).not.toContain('if (await docGiuPhien())')
    const kh = doc('src/components/KhoiMatKhauApp.tsx')
    expect(kh).not.toContain('if (await docGiuPhien()) await catPhien')
  })

  it('5. tải lại trang trong CÙNG tab thì khôi phục phiên, không hỏi', () => {
    const app = doc('src/App.tsx')
    expect(app).toContain('const maPhien = await khoiPhucPhien()')
    const dau = app.indexOf('const maPhien = await khoiPhucPhien()')
    const doan = app.slice(dau, dau + 320)
    expect(doan).toContain("setKhoa('da_mo')")
  })
})

describe('ranh giới vẫn còn thật — không phải bỏ khoá', () => {
  it('6. khoá phiên vẫn nằm trong sessionStorage, nên chết theo tab', () => {
    const lib = doc('src/lib/khoa-phien.ts')
    expect(lib).toContain('sessionStorage')
  })

  it('7. và vẫn cần MỘT khoá trong IndexedDB — một mình sessionStorage không mở được', () => {
    // Hai mảnh: bản mã trong sessionStorage + khoá AES không trích xuất được
    // trong IndexedDB. Thiếu mảnh nào cũng không khôi phục được phiên.
    const lib = doc('src/lib/khoa-phien.ts')
    expect(lib).toContain('extractable')
    expect(lib).toContain('AES-GCM')
  })

  it('8. gỡ mật khẩu hay đổi mật khẩu vẫn DỌN phiên — không để chìa mồ côi', () => {
    const kh = doc('src/components/KhoiMatKhauApp.tsx')
    expect(kh).toContain('donPhien()')
  })
})
