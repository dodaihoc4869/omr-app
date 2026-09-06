// GIỮ ĐĂNG NHẬP THEO TAB — GIU-DANG-NHAP-THEO-TAB.md mục 8, đủ 11 phép.
//
// Phép quan trọng nhất là số 4: quét chuỗi `sessionStorage`, đòi KHÔNG chứa mã
// bí mật. Cả tính năng này chỉ đúng khi phép đó đúng — cất chữ thường ra ngoài
// bộ nhớ là xoá sạch lý do tồn tại của mật khẩu mở app.
import { describe, expect, it, beforeEach, vi } from 'vitest'

const MA_BI_MAT = 'MA-BI-MAT-RIENG-CUA-THAY-7q2'

// IndexedDB giả: giữ đúng đối tượng CryptoKey, đúng như structured clone làm.
let khoIdb: Record<string, unknown> = {}
let maTrongBoNho: string | null = null

vi.mock('../src/lib/exam-db', () => ({
  datMaBiMatPhien: (m: string | null) => {
    maTrongBoNho = m
  },
  coMaBiMatPhien: () => maTrongBoNho !== null && maTrongBoNho !== '',
  loadKhoaPhien: async () => (khoIdb.khoaPhien as CryptoKey) ?? null,
  saveKhoaPhien: async (k: CryptoKey) => {
    khoIdb.khoaPhien = k
  },
  xoaKhoaPhien: async () => {
    delete khoIdb.khoaPhien
  },
}))

const { KHOA_PHIEN_SS, GIU_PHIEN_MAC_DINH, catPhien, khoiPhucPhien, donPhien, xoaChiaPhien, coGoiPhien } = await import('../src/lib/khoa-phien')

beforeEach(() => {
  khoIdb = {}
  maTrongBoNho = MA_BI_MAT
  sessionStorage.clear()
})

describe('Phép 1–2 — cất rồi khôi phục', () => {
  it('1. cất phiên rồi khôi phục ra ĐÚNG mã bí mật ban đầu', async () => {
    expect(await catPhien(MA_BI_MAT)).toBe(true)
    expect(await khoiPhucPhien()).toBe(MA_BI_MAT)
  })

  it('2. có bản mã nhưng KHÔNG có khoá phiên → null, không ném lỗi', async () => {
    await catPhien(MA_BI_MAT)
    delete khoIdb.khoaPhien
    await expect(khoiPhucPhien()).resolves.toBeNull()
  })
})

describe('Phép 3 — dọn rác khoá phiên mồ côi', () => {
  it('có khoá phiên nhưng sessionStorage RỖNG → null, và khoá bị xoá', async () => {
    await catPhien(MA_BI_MAT)
    expect(khoIdb.khoaPhien).toBeDefined()
    // Đúng cảnh đóng tab rồi mở lại: bản mã mất, khoá còn nằm trong máy.
    sessionStorage.clear()
    expect(await khoiPhucPhien()).toBeNull()
    expect(khoIdb.khoaPhien).toBeUndefined()
  })
})

describe('Phép 4 — QUÉT CHUỖI, sessionStorage không chứa mã bí mật', () => {
  it('bản mã cất đi không lộ mã bí mật ở bất kỳ đâu', async () => {
    await catPhien(MA_BI_MAT)
    const tho = sessionStorage.getItem(KHOA_PHIEN_SS)
    expect(tho).toBeTruthy()
    expect(tho!).not.toContain(MA_BI_MAT)
    // Quét cả kho, không chỉ đúng một khoá — phòng khi có chỗ nào lỡ ghi thêm.
    let tatCa = ''
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i)!
      tatCa += k + '\n' + sessionStorage.getItem(k) + '\n'
    }
    expect(tatCa).not.toContain(MA_BI_MAT)
    expect(JSON.stringify(localStorage)).not.toContain(MA_BI_MAT)
    // Và bản mã phải là JSON đúng hai trường, không thừa trường nào.
    expect(Object.keys(JSON.parse(tho!)).sort()).toEqual(['iv', 'maHoa'])
  })

  it('bản ghi trong IndexedDB là CryptoKey, không phải chuỗi mã bí mật', async () => {
    await catPhien(MA_BI_MAT)
    const k = khoIdb.khoaPhien as CryptoKey
    expect(typeof k).toBe('object')
    expect(k.type).toBe('secret')
    expect(String(JSON.stringify(khoIdb) ?? '')).not.toContain(MA_BI_MAT)
  })
})

describe('Phép 5 — khoá phiên KHÔNG xuất được', () => {
  it('extractable === false và exportKey ném lỗi', async () => {
    await catPhien(MA_BI_MAT)
    const k = khoIdb.khoaPhien as CryptoKey
    expect(k.extractable).toBe(false)
    await expect(crypto.subtle.exportKey('raw', k)).rejects.toBeTruthy()
  })
})

describe('Phép 6 — mỗi lần cất một iv khác', () => {
  it('cùng một mã bí mật, hai lần cất ra iv và bản mã khác nhau', async () => {
    await catPhien(MA_BI_MAT)
    const a = JSON.parse(sessionStorage.getItem(KHOA_PHIEN_SS)!)
    await catPhien(MA_BI_MAT)
    const b = JSON.parse(sessionStorage.getItem(KHOA_PHIEN_SS)!)
    expect(a.iv).not.toBe(b.iv)
    expect(a.maHoa).not.toBe(b.maHoa)
    // Bản mới vẫn giải ra đúng.
    expect(await khoiPhucPhien()).toBe(MA_BI_MAT)
  })
})

describe('Phép 7 — dọn phiên xoá ĐỦ BA THỨ', () => {
  it('sessionStorage, khoá phiên, và mã bí mật trong bộ nhớ', async () => {
    await catPhien(MA_BI_MAT)
    expect(coGoiPhien()).toBe(true)
    expect(khoIdb.khoaPhien).toBeDefined()

    await donPhien()

    expect(sessionStorage.getItem(KHOA_PHIEN_SS)).toBeNull()
    expect(khoIdb.khoaPhien).toBeUndefined()
    expect(maTrongBoNho).toBeNull()
    expect(await khoiPhucPhien()).toBeNull()
  })

  it('xoaChiaPhien xoá hai mảnh nhưng GIỮ mã bí mật trong bộ nhớ', async () => {
    await catPhien(MA_BI_MAT)
    await xoaChiaPhien()
    expect(coGoiPhien()).toBe(false)
    expect(khoIdb.khoaPhien).toBeUndefined()
    // Thầy tắt ô gạt giữa lúc đang làm việc thì không được đá ra màn khoá.
    expect(maTrongBoNho).toBe(MA_BI_MAT)
  })
})

describe('Phép 8 — khoá lại là phải DỌN, không chỉ đổi màn hình', () => {
  it('App.tsx: mọi chỗ setKhoa(can_mo) khi đang mở đều gọi donPhien', async () => {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const app = readFileSync(resolve(__dirname, '../src/App.tsx'), 'utf8')
    // Chỗ khoá lại theo nấc HOI_LAI — cắt đúng hiệu ứng đó.
    const dau = app.indexOf('QUAY LẠI SAU KHI ẨN')
    const cuoi = app.indexOf('CẦU NỐI')
    expect(dau).toBeGreaterThan(0)
    expect(cuoi).toBeGreaterThan(dau)
    const hieuUng = app.slice(dau, cuoi)
    expect(hieuUng).toContain('donPhien()')
    expect(hieuUng).toContain("setKhoa('can_mo')")
    // Và KHÔNG được chỉ gọi `datMaBiMatPhien(null)` rồi thôi — làm vậy là để
    // lại hai mảnh chìa, tải lại trang vào thẳng được.
    expect(hieuUng).not.toContain('datMaBiMatPhien(null)')
  })

  it('App.tsx: mở khoá xong CẤT PHIÊN KHÔNG ĐIỀU KIỆN', async () => {
    // Ô gạt "giữ đăng nhập" đã bỏ khỏi đường này 06/09: thầy lỡ tắt nó là mỗi
    // lần tải lại trang phải gõ mật khẩu mà không hiểu vì sao. Lệnh của thầy
    // là giữ mở khoá tới khi đóng tab hay thoát app, không có ngoại lệ.
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const app = readFileSync(resolve(__dirname, '../src/App.tsx'), 'utf8')
    expect(app).toContain('khoiPhucPhien()')
    expect(app).toContain('await catPhien(ma)')
    expect(app).not.toContain('if (await docGiuPhien())')
  })
})

describe('Phép 9 — vai KHÔNG phải giáo viên thì không đụng gì', () => {
  it('cầu nối phiên chỉ chạy trong nhánh đã có mật khẩu của app thầy', async () => {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const app = readFileSync(resolve(__dirname, '../src/App.tsx'), 'utf8')
    // `khoiPhucPhien` nằm TRONG hiệu ứng có `if (!canHoi) return` ở đầu.
    const dau = app.indexOf('// Máy này đã đặt mật khẩu chưa')
    const cuoi = app.indexOf('// QUAY LẠI SAU KHI ẨN')
    expect(dau).toBeGreaterThan(0)
    expect(cuoi).toBeGreaterThan(dau)
    const hieuUng = app.slice(dau, cuoi)
    expect(hieuUng).toContain('if (!canHoi) return')
    expect(hieuUng).toContain('khoiPhucPhien()')
    // Và màn mở khoá — nơi gọi `catPhien` — chỉ dựng khi `canHoi` đúng, vì
    // `khoa` khởi tạo là 'da_mo' cho mọi vai khác.
    expect(app).toContain("useState<'dang_doc' | 'can_dat' | 'can_mo' | 'da_mo'>(() => (canHoi ? 'dang_doc' : 'da_mo'))")
  })

  it('module phiên KHÔNG tự chạy gì lúc nạp — phải gọi mới làm', async () => {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const ma = readFileSync(resolve(__dirname, '../src/lib/khoa-phien.ts'), 'utf8')
    // Không có lời gọi ở mức cao nhất của module (mọi truy cập sessionStorage
    // đều nằm trong hàm `kho()`), nên nhập module ở vai học sinh cũng vô hại.
    expect(ma).not.toMatch(/^\s*(catPhien|khoiPhucPhien|donPhien)\(/m)
    expect(ma).not.toContain('localStorage')
  })
})

describe('Phép 10 — ô gạt tắt thì không cất phiên', () => {
  it('màn Cài đặt có ô gạt và nút Khoá app ngay, và tắt là xoá chìa', async () => {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const kh = readFileSync(resolve(__dirname, '../src/components/KhoiMatKhauApp.tsx'), 'utf8')
    expect(kh).toContain('Giữ đăng nhập trong tab này')
    expect(kh).toContain('Khoá app ngay')
    expect(kh).toContain('luuGiuPhien(v)')
    expect(kh).toContain('xoaChiaPhien()')
    // Đổi mật khẩu và gỡ mật khẩu đều phải dọn phiên (mục 2.3 điều 3 và 4).
    const doi = kh.slice(kh.indexOf('const bamDoi'), kh.indexOf('const bamBatVanTay'))
    expect(doi).toContain('donPhien()')
    const go = kh.slice(kh.indexOf('const bamGo ='), kh.indexOf('const doiNac'))
    expect(go).toContain('donPhien()')
  })

  it('mặc định là BẬT, và đọc ô trống ra true', () => {
    expect(GIU_PHIEN_MAC_DINH).toBe(true)
  })
})

describe('Phép 11 — không phá cái cũ', () => {
  it('mã bí mật rỗng thì không cất gì', async () => {
    expect(await catPhien('')).toBe(false)
    expect(coGoiPhien()).toBe(false)
    expect(khoIdb.khoaPhien).toBeUndefined()
  })

  it('bản mã hỏng thì dọn sạch rồi trả null, không ném lỗi', async () => {
    await catPhien(MA_BI_MAT)
    sessionStorage.setItem(KHOA_PHIEN_SS, '{"iv":"###","maHoa":"###"}')
    await expect(khoiPhucPhien()).resolves.toBeNull()
    expect(khoIdb.khoaPhien).toBeUndefined()
    expect(sessionStorage.getItem(KHOA_PHIEN_SS)).toBeNull()
  })

  it('khoá phiên của tab này KHÔNG giải được bản mã của tab khác', async () => {
    await catPhien(MA_BI_MAT)
    const goiCu = sessionStorage.getItem(KHOA_PHIEN_SS)!
    // Tab khác mở khoá: sinh khoá mới, đè lên khoá cũ trong IndexedDB.
    await catPhien(MA_BI_MAT)
    // Bản mã của tab cũ nay không giải được nữa.
    sessionStorage.setItem(KHOA_PHIEN_SS, goiCu)
    await expect(khoiPhucPhien()).resolves.toBeNull()
  })
})
