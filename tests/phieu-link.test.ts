// LINK PHIẾU GỬI PHỤ HUYNH.
//
// Hai thứ phải đúng tuyệt đối, sai là hỏng theo kiểu không ai phát hiện ra:
//   1. Số liệu đi qua link về đúng y nguyên — lệch một chữ số là phụ huynh đọc
//      sai điểm con mình mà không có cách nào biết.
//   2. Trong link KHÔNG có câu hỏi và đáp án. Link chuyển tiếp một chạm; lọt
//      đáp án vào đây là cả lớp có đề.
import { describe, expect, it } from 'vitest'
import { BAN_PHIEU, giaiPhieu, nenPhieu, taoLinkPhieu, type DuLieuPhieuLink } from '../src/lib/phieu-link'
import { docDuongVao, docVaiTuDuongDan } from '../src/lib/vai-tro'
import { NHAN_XEM_PHIEU, soanPhieuZalo } from '../src/lib/phieu-zalo'
import trang404 from '../public/404.html?raw'

const GOC = 'https://dodaihoc4869.github.io/omr-app/'

const mau: DuLieuPhieuLink = {
  hoTen: 'Nguyễn Thị Hồng Nhung',
  sbd: '12034',
  lop: '12',
  tenCa: 'Kiểm tra Ester – lipid buổi 3',
  ngay: '2026-09-04T02:20:21.482Z',
  diem: 6.6,
  diemPhan: { I: 4, II: 1.6, III: 1 },
  soCauSai: 9,
  tongSoCau: 28,
  hang: 7,
  siSo: 32,
  chuyenDe: [
    { ten: 'Ester – lipid', soCau: 18, soSai: 6 },
    { ten: 'Carbohydrate', soCau: 6, soSai: 2 },
    { ten: 'Hợp chất chứa nitrogen', soCau: 4, soSai: 1 },
  ],
  vieCanLam: 'Thầy sẽ giao em bài tập riêng chuyên đề Ester – lipid trong app. Em làm xong, Thầy chấm rồi báo lại.',
}

describe('nén và giải phiếu', () => {
  it('số liệu về đúng y nguyên, kể cả tiếng Việt có dấu và gạch en', async () => {
    const d = await giaiPhieu(await nenPhieu(mau))
    expect(d).toEqual(mau)
  })

  it('điểm 0 và điểm 10 không bị nuốt thành rỗng', async () => {
    for (const diem of [0, 10, 0.25, 9.75]) {
      const d = await giaiPhieu(await nenPhieu({ ...mau, diem, diemPhan: { I: 0, II: 0, III: diem } }))
      expect(d?.diem).toBe(diem)
      expect(d?.diemPhan?.III).toBe(diem)
    }
  })

  it('trường thiếu (chưa có hạng, chưa có điểm từng phần) về lại đúng là null, không thành số 0', async () => {
    const d = await giaiPhieu(await nenPhieu({ ...mau, diemPhan: null, hang: null, siSo: null, tongSoCau: null }))
    expect(d?.diemPhan).toBeNull()
    expect(d?.hang).toBeNull()
    expect(d?.siSo).toBeNull()
    expect(d?.tongSoCau).toBeNull()
  })

  it('em làm đúng hết: danh sách chuyên đề rỗng vẫn đọc được', async () => {
    const d = await giaiPhieu(await nenPhieu({ ...mau, soCauSai: 0, chuyenDe: [] }))
    expect(d?.soCauSai).toBe(0)
    expect(d?.chuyenDe).toEqual([])
  })
})

describe('link hỏng thì trả null, KHÔNG dựng phiếu số liệu một nửa', () => {
  it('rỗng, cụt, rác, sai cờ nén', async () => {
    for (const x of ['', '#', '1', 'x', '1@@@@', '0khongphaijson', 'aGVsbG8']) {
      expect(await giaiPhieu(x)).toBeNull()
    }
  })

  it('link bị cắt đuôi khi chuyển tiếp', async () => {
    const p = await nenPhieu(mau)
    expect(await giaiPhieu(p.slice(0, Math.floor(p.length * 0.7)))).toBeNull()
  })

  it('sai phiên bản định dạng thì từ chối', async () => {
    const goi = JSON.stringify({ v: BAN_PHIEU + 1, n: 'A', s: '1', t: 5 })
    const b64 = btoa(String.fromCharCode(...new TextEncoder().encode(goi)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    expect(await giaiPhieu('0' + b64)).toBeNull()
  })
})

describe('taoLinkPhieu', () => {
  it('dữ liệu nằm SAU dấu #, phần trước # không có gì của học sinh', async () => {
    const link = await taoLinkPhieu(GOC, mau)
    const truoc = link.slice(0, link.indexOf('#'))
    expect(truoc).toBe(GOC + 'p')
    for (const bi of ['Nhung', '12034', 'Ester', '6,6', '6.6']) expect(truoc).not.toContain(bi)
  })

  it('chỉ có đúng MỘT dấu # — thêm dấu nữa là trình duyệt cắt mất dữ liệu', async () => {
    const link = await taoLinkPhieu(GOC, mau)
    expect(link.split('#').length).toBe(2)
  })

  it('mở lại từ chính chuỗi hash (kèm dấu #) vẫn ra đúng phiếu', async () => {
    const link = await taoLinkPhieu(GOC, mau)
    const hash = link.slice(link.indexOf('#'))
    expect(hash.startsWith('#')).toBe(true)
    expect(await giaiPhieu(hash)).toEqual(mau)
  })

  it('gốc thiếu dấu / ở cuối vẫn ra link đúng', async () => {
    const link = await taoLinkPhieu('https://dodaihoc4869.github.io/omr-app', mau)
    expect(link.startsWith(GOC + 'p#')).toBe(true)
  })

  it('link đủ ngắn để dán vào Zalo: dưới 1200 ký tự cho phiếu 3 chuyên đề', async () => {
    const link = await taoLinkPhieu(GOC, mau)
    expect(link.length).toBeLessThan(1200)
  })

  it('chỉ dùng ký tự an toàn cho URL sau dấu #', async () => {
    const link = await taoLinkPhieu(GOC, mau)
    const hash = link.slice(link.indexOf('#') + 1)
    expect(/^[A-Za-z0-9\-_]+$/.test(hash)).toBe(true)
  })
})

// Đây là luật, không phải chi tiết: phiếu gửi phụ huynh KHÔNG mang theo đề.
describe('không có câu hỏi và đáp án trong link', () => {
  it('kiểu dữ liệu chỉ nhận đúng các trường của phiếu', async () => {
    const d = await giaiPhieu(await nenPhieu(mau))
    expect(Object.keys(d as object).sort()).toEqual(
      ['chuyenDe', 'diem', 'diemPhan', 'hang', 'hoTen', 'lop', 'ngay', 'sbd', 'siSo', 'soCauSai', 'tenCa', 'tongSoCau', 'vieCanLam'].sort(),
    )
  })

  it('trường lạ nhét thêm vào cũng không đi qua được', async () => {
    const banDau = { ...mau, dapAn: ['A', 'B', 'C'], cauHoi: 'Ester nào sau đây…' } as unknown as DuLieuPhieuLink
    const d = (await giaiPhieu(await nenPhieu(banDau))) as unknown as Record<string, unknown>
    expect(d.dapAn).toBeUndefined()
    expect(d.cauHoi).toBeUndefined()
  })
})

// Đường /p phải mở ra PHIẾU, không được rơi vào app quản lý của thầy — đúng lỗi
// đã xảy ra hồi tháng 9 với link riêng của em và phụ huynh (CAI-APP-VA-BA-VAI).
describe('đường /p vào đúng màn phiếu', () => {
  it('đọc thẳng từ đường dẫn, có hay không dấu / ở cuối', () => {
    expect(docVaiTuDuongDan('/omr-app/p').vai).toBe('phieu')
    expect(docVaiTuDuongDan('/omr-app/p/').vai).toBe('phieu')
  })

  it('không nhầm với /gv, /t/<mã ca> hay đường khác bắt đầu bằng p', () => {
    expect(docVaiTuDuongDan('/omr-app/gv').vai).toBe('gv')
    expect(docVaiTuDuongDan('/omr-app/phieu').vai).toBeNull()
    expect(docVaiTuDuongDan('/omr-app/t/743710').maCa).toBe('743710')
  })

  it('sau khi 404.html đổi thành ?vai=phieu thì vẫn ra màn phiếu', () => {
    expect(docDuongVao('?vai=phieu', '/omr-app/').vai).toBe('phieu')
  })

  it('404.html có nhánh /p và BÊ NGUYÊN location.hash sang — bỏ hash là mất cả phiếu', () => {
    expect(trang404).toContain("'?vai=phieu' + location.hash")
  })
})

describe('tin nhắn Zalo mang link phiếu', () => {
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

  it('có link thì thêm khối XEM PHIẾU ở CUỐI tin', async () => {
    const link = await taoLinkPhieu(GOC, mau)
    const tin = soanPhieuZalo(duTin, undefined, link)
    expect(tin).toContain(NHAN_XEM_PHIEU)
    expect(tin).toContain(link)
    expect(tin.trimEnd().endsWith(link)).toBe(true)
  })

  it('KHÔNG có link thì không hứa suông có phiếu để xem', () => {
    const tin = soanPhieuZalo(duTin)
    expect(tin).not.toContain(NHAN_XEM_PHIEU)
    expect(tin).not.toContain('http')
  })

  it('tin vẫn tự đủ ý khi phụ huynh không bấm link: có điểm, có chỗ mất điểm, có việc cần làm', async () => {
    const tin = soanPhieuZalo(duTin, undefined, await taoLinkPhieu(GOC, mau))
    const khongLink = tin.slice(0, tin.indexOf(NHAN_XEM_PHIEU))
    expect(khongLink).toContain('ĐIỂM: 6,60/10')
    expect(khongLink).toContain('CHỖ MẤT ĐIỂM:')
    expect(khongLink).toContain('VIỆC CẦN LÀM:')
  })
})
