// @vitest-environment node
// LINK PHỤ HUYNH GÕ/CHÉP LỆCH (thầy 22/10: bấm link app phụ huynh mà hiện màn khoá «App của Thầy» — "thiết kế để phụ huynh bấm vào chỉ cần nhập sbd luôn").
import { describe, expect, it } from 'vitest'
import { chonMangNapTruoc } from '../src/lib/nap-truoc-man-em'
import { chuanHoaUrlTheoVai } from '../src/lib/khoa-vai'
import { docDuongVao, docVaiTuDuongDan, laManThayQuanLy } from '../src/lib/vai-tro'

describe('đường lệch vẫn vào cổng phụ huynh', () => {
  it('viết hoa, dấu câu / khoảng trắng dính đuôi, mã hoá %20 ⇒ cổng phụ huynh, không phải app thầy', () => {
    for (const d of ['/PH', '/Ph', '/ph.', '/ph)', '/ph%20', '/ph/.', '/Phu-Huynh', '/ph,', '/ph!', '/omr-app/PH']) {
      expect(docVaiTuDuongDan(d).vai, d).toBe('phuhuynh')
      expect(laManThayQuanLy('', d), d).toBe(false)
    }
    expect(docVaiTuDuongDan('/HS.').vai).toBe('hocsinh')
    expect(docVaiTuDuongDan('/t/561169.').maCa).toBe('561169')
  })

  it('địa chỉ được viết lại về đường chuẩn /ph (thanh địa chỉ gọn, tải lại vẫn đúng vai)', () => {
    expect(chuanHoaUrlTheoVai('/', '/PH', '', '')).toBe('/ph')
    expect(chuanHoaUrlTheoVai('/', '/', '?vai=ph', '')).toBe('/ph')
    expect(chuanHoaUrlTheoVai('/', `/ph/${'a'.repeat(32)}`, '', '')).toBe('/ph')
  })

  it('KHÔNG so tiền tố: phiếu /p, /p#…, /phieu và đường lạ giữ nguyên vai cũ', () => {
    expect(docVaiTuDuongDan('/p').vai).toBe('phieu')
    expect(docVaiTuDuongDan('/P.').vai).toBe('phieu')
    expect(docVaiTuDuongDan('/phieu/abc').vai).toBeNull()
    expect(docVaiTuDuongDan('/pha').vai).toBeNull()
    expect(docVaiTuDuongDan('/').vai).toBeNull()
    expect(laManThayQuanLy('', '/')).toBe(true)
    expect(laManThayQuanLy('', '/GV')).toBe(true)
    expect(docDuongVao('?vai=gv', '/ph').vai).toBe('gv')
  })

  it('mảnh tải sớm của đường chuẩn không đổi', () => {
    expect(chonMangNapTruoc('/ph', '')).toBe('ph')
    expect(chonMangNapTruoc('/hs', '')).toBe('hs')
  })
})
