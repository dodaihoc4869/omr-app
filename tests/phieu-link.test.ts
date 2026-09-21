// LINK BÁO CÁO GỬI PHỤ HUYNH — đường /p#<mã>. (Khối "tin nhắn Zalo mang link" đã gỡ cùng phiếu Zalo, thầy lệnh 21/09.)
import { describe, expect, it } from 'vitest'
import { docMaTuHash, taoLinkPhieu } from '../src/lib/phieu-link'
import { docDuongVao, docVaiTuDuongDan } from '../src/lib/vai-tro'
import { sinhMaPhieu } from '../src/lib/exam-api'
import trang404 from '../public/404.html?raw'

const GOC = 'https://dodaihoc4869.github.io/omr-app/'

describe('mã phiếu', () => {
  it('10 ký tự, chỉ chữ và số, không lẫn ký tự dễ đọc nhầm', () => {
    for (let i = 0; i < 50; i++) {
      const m = sinhMaPhieu()
      expect(m).toHaveLength(10)
      expect(/^[A-Za-z0-9]+$/.test(m)).toBe(true)
      // Bỏ 0/O/1/I/l để thầy đọc mã qua điện thoại không bị nhầm.
      expect(/[0O1Il]/.test(m)).toBe(false)
    }
  })

  it('không trùng nhau — mã trùng là phiếu em này đè lên phiếu em kia', () => {
    const bo = new Set<string>()
    for (let i = 0; i < 500; i++) bo.add(sinhMaPhieu())
    expect(bo.size).toBe(500)
  })
})

describe('taoLinkPhieu / docMaTuHash', () => {
  it('link ngắn, mã nằm sau dấu #', () => {
    const link = taoLinkPhieu(GOC, 'Abcd234567')
    expect(link).toBe(GOC + 'p#Abcd234567')
    // Cả link phải vừa một dòng tin nhắn Zalo. Bản cũ nhét dữ liệu vào link dài
    // 458 ký tự, dán vào Zalo thành một khối xanh kín màn hình.
    expect(link.length).toBeLessThanOrEqual(52)
  })

  it('gốc thiếu dấu / ở cuối vẫn ra link đúng', () => {
    expect(taoLinkPhieu('https://dodaihoc4869.github.io/omr-app', 'Abcd234567')).toBe(GOC + 'p#Abcd234567')
  })

  it('đọc lại được mã từ hash, có hay không dấu #', () => {
    expect(docMaTuHash('#Abcd234567')).toBe('Abcd234567')
    expect(docMaTuHash('Abcd234567')).toBe('Abcd234567')
  })

  it('hash rác trả rỗng — không đem rác đi hỏi máy chủ', () => {
    for (const x of ['', '#', 'ngan', 'co khoang trang', '#<script>', 'a'.repeat(60)]) {
      expect(docMaTuHash(x)).toBe('')
    }
  })

  it('mã vừa sinh luôn qua được bộ đọc', () => {
    for (let i = 0; i < 20; i++) expect(docMaTuHash('#' + sinhMaPhieu())).not.toBe('')
  })
})

// Đường /p phải mở ra BÁO CÁO, không rơi vào app quản lý của thầy — đúng lỗi đã
// xảy ra với link riêng của em và phụ huynh (CAI-APP-VA-BA-VAI.md).
describe('đường /p vào đúng màn báo cáo', () => {
  it('đọc thẳng từ đường dẫn, có hay không dấu / ở cuối', () => {
    expect(docVaiTuDuongDan('/omr-app/p').vai).toBe('phieu')
    expect(docVaiTuDuongDan('/omr-app/p/').vai).toBe('phieu')
  })

  it('không nhầm với /gv, /t/<mã ca> hay đường khác bắt đầu bằng p', () => {
    expect(docVaiTuDuongDan('/omr-app/gv').vai).toBe('gv')
    expect(docVaiTuDuongDan('/omr-app/phieu').vai).toBeNull()
    expect(docVaiTuDuongDan('/omr-app/t/743710').maCa).toBe('743710')
  })

  it('sau khi 404.html đổi thành ?vai=phieu thì vẫn ra màn báo cáo', () => {
    expect(docDuongVao('?vai=phieu', '/omr-app/').vai).toBe('phieu')
  })

  it('404.html có nhánh /p và BÊ NGUYÊN location.hash sang — bỏ hash là mất mã', () => {
    expect(trang404).toContain("'?vai=phieu' + location.hash")
  })
})
