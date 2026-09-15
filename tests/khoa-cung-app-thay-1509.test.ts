// KHOÁ CỨNG APP GIÁO VIÊN · HỌC SINH VÀ PHỤ HUYNH TÁCH HẲN. 15/09.
//
// Thầy chốt: "xem kĩ lại việc đảm bảo an toàn 100% không được phép nhảy app
// kiểu học sinh nhảy sang app giáo viên, nếu được app giáo viên khoá cứng lại
// không thể chạm vào được bằng cách nào, app học sinh và phụ huynh cũng phải
// tách biệt hoàn toàn không được nhảy lẫn lộn nhau."
//
// ─────────────────────────────────────────────────────────────────────────
// LỖ HỔNG THẬT ĐÃ BỊT (đọc kỹ, đừng mở lại)
//
// `App.tsx` từng quyết định:
//
//     const ma = await loadTeacherSecret()
//     setKhoa(ma ? 'can_dat' : 'da_mo')     // ← MÁY TRẮNG VÀO THẲNG
//
// Nghĩa là: em gõ `/gv` trên điện thoại của chính em — máy chưa từng có mã bí
// mật — thì `da_mo`, và APP QUẢN LÝ MỞ RA, không hỏi một câu nào.
//
// Lý lẽ cũ là "máy chưa có mã bí mật thì chưa có gì để khoá". Đúng về dữ liệu,
// sai về quyền: em vẫn thấy toàn bộ giao diện quản lý, và mã bí mật thì đã
// từng lộ ngày 10/09 nên "em không có mã" không phải hàng rào.
//
// Nay: KHÔNG CÓ MÃ BÍ MẬT TRÊN MÁY ⇒ KHÔNG CÓ APP. Chỉ hiện đúng một cửa nhập
// mã, và MÁY CHỦ chấm mã chứ không phải máy này tự chấm.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { docDuongVao, laManThayQuanLy, nhoVaiDaDung } from '../src/lib/vai-tro'

const GOC = process.cwd()
const doc = (p: string) => fs.readFileSync(path.join(GOC, p), 'utf8')
const boChuThich = (ma: string) => ma.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
const APP = boChuThich(doc('src/App.tsx'))
const CUA = doc('src/screens/KhoaMayThayScreen.tsx')

describe('MÁY TRẮNG KHÔNG VÀO ĐƯỢC APP CỦA THẦY', () => {
  it('lỗ "chưa có mã bí mật ⇒ vào thẳng" đã bịt', () => {
    expect(APP).not.toContain("setKhoa(ma ? 'can_dat' : 'da_mo')")
    expect(APP).toContain("setKhoa(ma ? 'can_dat' : 'chua_cap_quyen')")
  })

  it('IndexedDB hỏng thì KHOÁ, không mở toang', () => {
    // Bản trước: `catch { setKhoa('da_mo') }` — kho hỏng là mở cửa. Máy em xoá
    // được IndexedDB trong hai chạm, nên đó là đường vòng.
    const i = APP.indexOf("const ma = await loadTeacherSecret()")
    const khoi = APP.slice(i, i + 400)
    expect(khoi).toContain("setKhoa('chua_cap_quyen')")
    expect(khoi).not.toContain("setKhoa('da_mo')")
  })

  it('màn chưa cấp quyền chặn TRƯỚC mọi màn của thầy', () => {
    expect(APP).toContain("if (khoa === 'chua_cap_quyen') {")
    expect(APP.indexOf("if (khoa === 'chua_cap_quyen') {")).toBeLessThan(
      APP.indexOf("if (khoa === 'can_dat' || khoa === 'can_mo') {"),
    )
  })
})

describe('CỬA KHOÁ — máy chủ chấm mã, không phải máy này', () => {
  it('gọi máy chủ để chấm, không so chuỗi tại chỗ', () => {
    expect(CUA).toContain('await lichSuLenBang(url, sach, 1)')
    // So MÃ tại máy là em sửa được trong trình duyệt. (`e.key === 'Enter'` thì
    // vô hại nên phép kiểm chỉ soi đúng các biến giữ mã.)
    const t = boChuThich(CUA)
    for (const bien of ['ma', 'sach']) {
      expect(t, bien).not.toMatch(new RegExp(`\\b${bien}\\s*===`))
    }
  })

  it('chấm ĐẬU rồi mới cất mã, cất xong mới cho đi tiếp', () => {
    const t = boChuThich(CUA)
    expect(t.indexOf('await lichSuLenBang(')).toBeLessThan(t.indexOf('await saveTeacherSecret('))
    expect(t.indexOf('await saveTeacherSecret(')).toBeLessThan(t.indexOf('onMoDuoc()'))
  })

  it('KHÔNG chỉ điểm cho người dò mã: sai mã và mất mạng nói khác nhau nhưng không lộ gì thêm', () => {
    const t = boChuThich(CUA)
    expect(t).toContain('Mã bí mật không đúng.')
    expect(t).not.toMatch(/gần đúng|còn thiếu|sai ký tự/i)
  })

  it('cửa này KHÔNG có lối nào khác: không link sang app nào', () => {
    expect(CUA).not.toMatch(/<a\b/)
    expect(CUA).not.toContain('DUONG_APP')
  })
})

describe('VAI CHỈ ĐẾN TỪ ĐƯỜNG LINK — không đoán, không nhớ', () => {
  it('`/` trần KHÔNG bao giờ là app của thầy, dù máy nhớ vai gì', () => {
    for (const v of ['gv', 'hs', 'ph'] as const) {
      nhoVaiDaDung(v)
      expect(laManThayQuanLy('', '/'), v).toBe(false)
    }
  })

  it('App.tsx KHÔNG còn hỏi `vaiDaDung` để quyết cổng em hay cổng phụ huynh', () => {
    expect(APP).not.toContain("vaiDaDung() === 'hs'")
    expect(APP).not.toContain("vaiDaDung() === 'ph'")
    expect(APP).toContain("docDuongVao(location.search, location.pathname).vai === 'hocsinh'")
    expect(APP).toContain("docDuongVao(location.search, location.pathname).vai === 'phuhuynh'")
  })

  it('`vai-tro.ts` KHÔNG còn nhánh đoán nào trong `laManThayQuanLy`', () => {
    const t = boChuThich(doc('src/lib/vai-tro.ts'))
    const i = t.indexOf('export function laManThayQuanLy')
    const than = t.slice(i, t.indexOf('\n}', i))
    expect(than).not.toContain('vaiDaDung()')
    expect(than).not.toContain('daCai()')
  })
})

describe('LINK VÀO THI KHÔNG DỰNG VỎ APP CỦA THẦY', () => {
  it('`/t/<mã ca>` và `/d/<mã ca>` trả ĐÚNG màn làm bài, không vỏ quản lý', () => {
    expect(APP).toContain("if (docDuongVao(location.search, location.pathname).maCa || laXemDiem) {")
    const i = APP.indexOf('.maCa || laXemDiem) {')
    const khoi = APP.slice(i, i + 320)
    expect(khoi).toContain('<ExamTakeScreen />')
    expect(khoi).not.toContain('ThanhBenTrai')
    expect(khoi).not.toContain('BottomNav')
  })

  it('màn thi ném lỗi thì TẢI LẠI LINK, KHÔNG mời về màn chính của thầy', () => {
    // Đây là lỗ thật: `veManChinh={() => setScreen('examhub')}` đưa em thẳng
    // vào app quản lý, đủ thanh bên, trên chính điện thoại của em.
    const i = APP.indexOf('.maCa || laXemDiem) {')
    const khoi = APP.slice(i, i + 320)
    expect(khoi).toContain('veManChinh={() => location.reload()}')
    expect(khoi).not.toContain("setScreen('examhub')")
  })

  it('nhánh này đứng TRƯỚC vỏ app quản lý', () => {
    expect(APP.indexOf('.maCa || laXemDiem) {')).toBeLessThan(APP.indexOf('<ThanhBenTrai />'))
  })
})

describe('HỌC SINH VÀ PHỤ HUYNH TÁCH HẲN', () => {
  const duongHs = ['/hs', '/hoc-sinh', '/hocsinh', '/?vai=hocsinh']
  const duongPh = ['/ph', '/phu-huynh', '/phuhuynh', '/?vai=phuhuynh']
  const tach = (d: string) => {
    const i = d.indexOf('?')
    return i === -1 ? { p: d, s: '' } : { p: d.slice(0, i), s: d.slice(i) }
  }

  it('mọi đường của EM ra đúng vai học sinh, không bao giờ ra phụ huynh hay thầy', () => {
    for (const d of duongHs) {
      const { p, s } = tach(d)
      expect(docDuongVao(s, p).vai, d).toBe('hocsinh')
      expect(laManThayQuanLy(s, p), d).toBe(false)
    }
  })

  it('mọi đường của PHỤ HUYNH ra đúng vai phụ huynh, không bao giờ ra học sinh hay thầy', () => {
    for (const d of duongPh) {
      const { p, s } = tach(d)
      expect(docDuongVao(s, p).vai, d).toBe('phuhuynh')
      expect(laManThayQuanLy(s, p), d).toBe(false)
    }
  })

  it('cờ `vaiDaDung` KHÔNG kéo được đường của em sang phụ huynh và ngược lại', () => {
    nhoVaiDaDung('ph')
    for (const d of duongHs) {
      const { p, s } = tach(d)
      expect(docDuongVao(s, p).vai, d).toBe('hocsinh')
    }
    nhoVaiDaDung('hs')
    for (const d of duongPh) {
      const { p, s } = tach(d)
      expect(docDuongVao(s, p).vai, d).toBe('phuhuynh')
    }
  })

  it('hai cổng cất phiên ở HAI KHOÁ KHÁC NHAU — không đọc được của nhau', () => {
    const hs = doc('src/screens/StudentPortalScreen.tsx')
    const ph = doc('src/screens/ParentPortalScreen.tsx')
    const khoaHs = hs.match(/const KHOA_LUU_AUTH = '([^']+)'/)?.[1]
    const khoaPh = ph.match(/const SBD_STORAGE_KEY = '([^']+)'/)?.[1]
    expect(khoaHs).toBeTruthy()
    expect(khoaPh).toBeTruthy()
    expect(khoaHs).not.toBe(khoaPh)
    // Và không cổng nào đọc khoá của cổng kia.
    expect(hs).not.toContain(khoaPh!)
    expect(ph).not.toContain(khoaHs!)
  })

  it('không cổng nào của em hay phụ huynh mở được đường sang app thầy', () => {
    for (const f of ['src/screens/StudentPortalScreen.tsx', 'src/screens/ParentPortalScreen.tsx']) {
      const t = boChuThich(doc(f))
      expect(t, f).not.toContain('vai=gv')
      expect(t, f).not.toMatch(/['"`]\/gv['"`]/)
    }
  })
})
