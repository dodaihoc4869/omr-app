// LINK BÁO CÁO GỬI PHỤ HUYNH — đường /p#<mã> và tin nhắn mang link.
import { describe, expect, it } from 'vitest'
import { docMaTuHash, taoLinkPhieu } from '../src/lib/phieu-link'
import { docDuongVao, docVaiTuDuongDan } from '../src/lib/vai-tro'
import { NHAN_XEM_PHIEU, soanPhieuZalo } from '../src/lib/phieu-zalo'
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

describe('tin nhắn Zalo mang link báo cáo', () => {
  const duTin = {
    hoTen: 'Nguyễn Thị Hồng Nhung',
    ngay: '2026-09-04T02:20:21.482Z',
    diem: 6.6,
    xepLoai: 'Khá',
    diemPhan: { I: 4, II: 1.6, III: 1 },
    soCauSai: 9,
    chuyenDeSai: { ten: 'Ester – lipid', soSai: 6 },
    baiTapDaGiao: null,
  }
  const link = taoLinkPhieu(GOC, 'Abcd234567')

  it('khối link đứng NGAY SAU dòng mở đầu, trước cả điểm', () => {
    const tin = soanPhieuZalo(duTin, undefined, link)
    const khoi = tin.split('\n\n')
    expect(khoi[0]).toContain('Thầy Đỗ Đại Học gửi kết quả')
    expect(khoi[1]).toBe(`${NHAN_XEM_PHIEU} ${link}`)
    expect(tin.indexOf(NHAN_XEM_PHIEU)).toBeLessThan(tin.indexOf('ĐIỂM:'))
  })

  it('KHÔNG có link thì không hứa suông có phiếu để xem', () => {
    const tin = soanPhieuZalo(duTin)
    expect(tin).not.toContain(NHAN_XEM_PHIEU)
    expect(tin).not.toContain('http')
  })

  it('tin vẫn tự đủ ý khi phụ huynh không bấm link', () => {
    const tin = soanPhieuZalo(duTin, undefined, link)
    const khongLink = tin
      .split('\n\n')
      .filter((k) => !k.startsWith(NHAN_XEM_PHIEU))
      .join('\n\n')
    expect(khongLink).toContain('ĐIỂM: 6,60/10')
    expect(khongLink).toContain('CHỖ MẤT ĐIỂM:')
    expect(khongLink).toContain('VIỆC CẦN LÀM:')
  })
})
