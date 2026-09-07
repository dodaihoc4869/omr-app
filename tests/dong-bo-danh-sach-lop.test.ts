// ĐỒNG BỘ DANH SÁCH LỚP TỪ GOOGLE SHEET CỦA THẦY — thầy chốt 07/09:
// "nhập link danh sách google sheet một lần duy nhất để đồng bộ danh sách, mỗi
// lần tôi thêm hay xoá học sinh tôi chỉ cần bấm vào đồng bộ là hiển thị đúng
// như trong danh sách".
//
// KIẾN TRÚC, và vì sao nó KHÔNG phải bản đầu tiên: bản đầu để Apps Script gọi
// `UrlFetchApp` tải hộ. Đo trên máy chủ thật thì trả nguyên văn "Bạn không có
// quyền thực hiện lệnh gọi UrlFetchApp.fetch — cần
// https://www.googleapis.com/auth/script.external_request". Thêm quyền đó là
// phải xin lại uỷ quyền cho CẢ ứng dụng web, làm giữa buổi dạy thì chặn hết em
// đang thi. Đo tiếp thì tệp "Xuất bản lên web" CÓ gắn nhãn CORS, máy thầy đọc
// thẳng được. Nên: MÁY THẦY TẢI, máy chủ chỉ giữ link và ghi đè bằng
// `napDanhSachLop` vốn đã có quyền.
//
// Danh sách này là CỔNG VÀO THI: sai một dòng là em đứng ngoài phòng thi.
import { describe, expect, it, vi, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { tachLink, tomTatDongBo } from '../src/components/NutDongBoDanhSach'
import { linkDanhSachLop, luuLinkDanhSachLop, napDanhSachLop } from '../src/lib/exam-api'
import { cotDanhSach, docDanhSachTuCsv, gomDanhSachTuLink, linkCsvDanhSach, lopTuNamSinh, tachCsv, taiDanhSachTuLink } from '../src/lib/danh-sach-tu-link'

const GS = fs.readFileSync(path.join(process.cwd(), 'docs/apps-script-kiem-tra.gs'), 'utf8')
const HOM_NAY = new Date('2026-09-07T12:00:00Z')

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('linkCsvDanhSach — mọi kiểu link về một link tải CSV', () => {
  it('link "Xuất bản lên web" (đúng ba link thầy gửi 07/09)', () => {
    const pub = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSeTB77Ng/pubhtml'
    expect(linkCsvDanhSach(pub)).toBe('https://docs.google.com/spreadsheets/d/e/2PACX-1vSeTB77Ng/pub?output=csv')
  })

  it('giữ gid khi thầy trỏ vào MỘT tab, không mặc kệ lấy tab đầu', () => {
    expect(linkCsvDanhSach('https://docs.google.com/spreadsheets/d/e/ABC/pubhtml?gid=577461977&single=true')).toContain('&gid=577461977')
    expect(linkCsvDanhSach('https://docs.google.com/spreadsheets/d/1w_yOiMX01/edit#gid=123')).toBe(
      'https://docs.google.com/spreadsheets/d/1w_yOiMX01/export?format=csv&gid=123',
    )
  })

  it('link sheet thường về /export?format=csv; rỗng thì trả rỗng', () => {
    expect(linkCsvDanhSach('https://docs.google.com/spreadsheets/d/1w_yOiMX01/edit?usp=drivesdk')).toBe(
      'https://docs.google.com/spreadsheets/d/1w_yOiMX01/export?format=csv',
    )
    expect(linkCsvDanhSach('')).toBe('')
    expect(linkCsvDanhSach('   ')).toBe('')
  })
})

describe('tachCsv — bóc đúng luật dấu ngoặc kép', () => {
  it('ô có dấu phẩy bên trong không được cắt làm đôi', () => {
    expect(tachCsv('a,"b,c",d')).toEqual([['a', 'b,c', 'd']])
  })

  it('ô có xuống dòng và dấu nháy đôi lồng nhau', () => {
    expect(tachCsv('a,"hai\ndòng"\nb,c')).toEqual([['a', 'hai\ndòng'], ['b', 'c']])
    expect(tachCsv('a,"nói ""thế"" đấy"')).toEqual([['a', 'nói "thế" đấy']])
  })

  it('CRLF của Google Sheet không để lại \\r ở cuối ô', () => {
    expect(tachCsv('SBD,HoTen\r\n12000,A\r\n')).toEqual([['SBD', 'HoTen'], ['12000', 'A']])
  })
})

describe('cotDanhSach — nhận cột theo tên tiêu đề', () => {
  it('ba sheet của thầy đặt tiêu đề khác nhau, đều phải nhận đúng', () => {
    // Khối 2009 ghi "HoTen,NamSinh"; khối 2010 và 2011 ghi "Họ tên,Năm sinh".
    expect(cotDanhSach(['SBD', 'HoTen', 'NamSinh'])).toMatchObject({ sbd: 0, hoTen: 1, namSinh: 2 })
    expect(cotDanhSach(['SBD', 'Họ tên', 'Năm sinh'])).toMatchObject({ sbd: 0, hoTen: 1, namSinh: 2 })
    expect(cotDanhSach(['Số báo danh', 'Họ và tên', 'Năm sinh', 'Lớp'])).toMatchObject({ sbd: 0, hoTen: 1, namSinh: 2, lop: 3 })
  })

  it('cột đảo thứ tự vẫn nhận đúng; tiêu đề lạ thì lùi về 0-1-2', () => {
    expect(cotDanhSach(['Họ tên', 'Năm sinh', 'SBD'])).toMatchObject({ sbd: 2, hoTen: 0, namSinh: 1 })
    expect(cotDanhSach(['a', 'b', 'c'])).toMatchObject({ sbd: 0, hoTen: 1, namSinh: 2, lop: -1 })
  })
})

describe('lopTuNamSinh — sheet của thầy không có cột Lớp', () => {
  it('năm học 2026–2027: 2009 là lớp 12, 2010 lớp 11, 2011 lớp 10', () => {
    expect(lopTuNamSinh('2009', HOM_NAY)).toBe('12')
    expect(lopTuNamSinh('2010', HOM_NAY)).toBe('11')
    expect(lopTuNamSinh('2011', HOM_NAY)).toBe('10')
  })

  it('trước tháng 9 vẫn tính theo năm học đang chạy', () => {
    expect(lopTuNamSinh('2009', new Date('2026-05-20T12:00:00Z'))).toBe('11')
  })

  it('năm sinh vô nghĩa thì để trống, KHÔNG đoán bừa một lớp', () => {
    expect(lopTuNamSinh('', HOM_NAY)).toBe('')
    expect(lopTuNamSinh('abc', HOM_NAY)).toBe('')
    expect(lopTuNamSinh('1200', HOM_NAY)).toBe('')
  })
})

describe('docDanhSachTuCsv — đúng ba sheet thật của thầy', () => {
  const K2009 = 'SBD,HoTen,NamSinh\r\n12000,Hoàng Thị Kim Ngân,2009\r\n12034,Phạm Thành Nam,2009\r\n12042,Nguyễn Thành Đồng,2009\r\n'
  const K2010 = 'SBD,Họ tên,Năm sinh\r\n11000,Nguyễn Hoàng Thành,2010\r\n11001,Đỗ Quốc Tư,2010\r\n'

  it('đọc đủ em và tự điền cột Lớp từ năm sinh', () => {
    expect(docDanhSachTuCsv(K2009, HOM_NAY)).toEqual([
      { sbd: '12000', hoTen: 'Hoàng Thị Kim Ngân', namSinh: '2009', lop: '12' },
      { sbd: '12034', hoTen: 'Phạm Thành Nam', namSinh: '2009', lop: '12' },
      { sbd: '12042', hoTen: 'Nguyễn Thành Đồng', namSinh: '2009', lop: '12' },
    ])
    expect(docDanhSachTuCsv(K2010, HOM_NAY).map((e) => e.lop)).toEqual(['11', '11'])
  })

  it('bỏ dòng rác: dòng trống, dòng tổng, dòng ghi chú không có số báo danh', () => {
    const ban = 'SBD,HoTen,NamSinh\n12000,A,2009\n,Tổng cộng,\n\nghi chú,B,2009\n12001,C,2009\n'
    expect(docDanhSachTuCsv(ban, HOM_NAY).map((e) => e.sbd)).toEqual(['12000', '12001'])
  })

  it('sheet rỗng hoặc chỉ có tiêu đề thì trả mảng rỗng, không ném', () => {
    expect(docDanhSachTuCsv('', HOM_NAY)).toEqual([])
    expect(docDanhSachTuCsv('SBD,HoTen,NamSinh\n', HOM_NAY)).toEqual([])
  })
})

describe('taiDanhSachTuLink / gomDanhSachTuLink', () => {
  const csv = (t: string) => async () => ({ ok: true, status: 200, text: async () => t })

  it('link trả HTML (chưa Xuất bản lên web) bị nhận ra, không bóc bừa', async () => {
    const tai = (async () => ({ ok: true, status: 200, text: async () => '<!DOCTYPE html><html>…' })) as unknown as typeof fetch
    const kq = await taiDanhSachTuLink('https://docs.google.com/spreadsheets/d/e/A/pubhtml', tai)
    expect(kq.items).toEqual([])
    expect(kq.loi).toMatch(/HTML/)
  })

  it('mã lỗi HTTP nói rõ phải bật Xuất bản lên web', async () => {
    const tai = (async () => ({ ok: false, status: 404, text: async () => '' })) as unknown as typeof fetch
    expect((await taiDanhSachTuLink('https://docs.google.com/spreadsheets/d/e/A/pubhtml', tai)).loi).toMatch(/404[\s\S]*Xuất bản lên web/)
  })

  it('mất mạng thì báo lỗi, KHÔNG trả danh sách rỗng coi như thành công', async () => {
    const tai = (async () => {
      throw new Error('Failed to fetch')
    }) as unknown as typeof fetch
    const kq = await taiDanhSachTuLink('https://docs.google.com/spreadsheets/d/e/A/pubhtml', tai)
    expect(kq.items).toEqual([])
    expect(kq.loi).toMatch(/Không tải được/)
  })

  it('số báo danh trùng giữa hai khối: giữ dòng của link đứng trước và ghi lại', async () => {
    const tai = (async (u: string) =>
      String(u).includes('/A/')
        ? { ok: true, status: 200, text: async () => 'SBD,HoTen,NamSinh\n12000,Bản A,2009\n' }
        : { ok: true, status: 200, text: async () => 'SBD,HoTen,NamSinh\n12000,Bản B,2009\n11000,Em khối 11,2010\n' }) as unknown as typeof fetch
    const kq = await gomDanhSachTuLink(['https://docs.google.com/spreadsheets/d/e/A/pubhtml', 'https://docs.google.com/spreadsheets/d/e/B/pubhtml'], tai, HOM_NAY)
    expect(kq.items.map((e) => e.hoTen)).toEqual(['Bản A', 'Em khối 11'])
    expect(kq.trung).toEqual(['12000'])
    expect(kq.hong).toEqual([])
  })

  it('MỘT LINK HỎNG thì `hong` có dòng — màn hình dừng, chưa đẩy gì', async () => {
    const tai = (async (u: string) =>
      String(u).includes('/A/') ? { ok: true, status: 200, text: async () => 'SBD,HoTen,NamSinh\n12000,A,2009\n' } : { ok: false, status: 404, text: async () => '' }) as unknown as typeof fetch
    const kq = await gomDanhSachTuLink(['https://docs.google.com/spreadsheets/d/e/A/pubhtml', 'https://docs.google.com/spreadsheets/d/e/B/pubhtml'], tai, HOM_NAY)
    expect(kq.hong).toHaveLength(1)
    expect(kq.items).toHaveLength(1)
  })

  it('màn hình PHẢI dừng khi có link hỏng — khoá bằng chính mã của nút', () => {
    // Ghi đè bằng danh sách thiếu một khối thì cả khối đó bị cổng vào thi chặn
    // sạch buổi sau. Nặng hơn nhiều so với việc thầy sửa lại một cái link.
    const nut = fs.readFileSync(path.join(process.cwd(), 'src/components/NutDongBoDanhSach.tsx'), 'utf8')
    const than = nut.slice(nut.indexOf('const chay = async'), nut.indexOf('const luuVaChay'))
    expect(than.indexOf('gom.hong.length')).toBeLessThan(than.indexOf('napDanhSachLop('))
    expect(than).toContain('return bao({ kieu: \'loi\'')
  })

  it('tải hết ba link rồi mới ghi — không ghi từng phần', async () => {
    const goi: string[] = []
    const tai = (async (u: string) => {
      goi.push(String(u))
      return csv('SBD,HoTen,NamSinh\n1200' + goi.length + ',E,2009\n')()
    }) as unknown as typeof fetch
    const kq = await gomDanhSachTuLink(['https://docs.google.com/spreadsheets/d/e/A/pubhtml', 'https://docs.google.com/spreadsheets/d/e/B/pubhtml', 'https://docs.google.com/spreadsheets/d/e/C/pubhtml'], tai, HOM_NAY)
    expect(goi).toHaveLength(3)
    expect(goi.every((u) => u.includes('output=csv'))).toBe(true)
    expect(kq.items).toHaveLength(3)
  })
})

describe('máy chủ', () => {
  it('KHÔNG gọi UrlFetchApp nữa — không kéo theo quyền script.external_request', () => {
    // Đây là ràng buộc, không phải chi tiết: thêm quyền là phải xin lại uỷ
    // quyền cho cả ứng dụng web, mà uỷ quyền dở dang thì em đang thi bị chặn.
    expect(GS.replace(/\/\/.*$/gm, '')).not.toContain('UrlFetchApp')
  })

  it('lệnh link chỉ giữ link, đòi mã bí mật', () => {
    const than = GS.slice(GS.indexOf("if (action === 'linkDanhSachLop'"), GS.indexOf("if (action === 'huyDuyet')"))
    expect(than).toContain('kiemTraMaBiMat_(body)')
    expect(than).toContain('luuLinkDsLop_(dsLK)')
    expect(GS).toContain("var KHOA_LINK_DSLOP = 'LINK_DANH_SACH_LOP'")
  })

  it('napDanhSachLop so bản cũ TRƯỚC khi ghi đè và báo ra em thêm / em bị bỏ', () => {
    const than = GS.slice(GS.indexOf("if (action === 'napDanhSachLop')"), GS.indexOf("if (action === 'linkDanhSachLop'"))
    expect(than.indexOf('docDanhSachLop_()')).toBeLessThan(than.indexOf('sh.clear()'))
    expect(than).toContain('them: themDS')
    expect(than).toContain('bo: boDS')
    expect(than).toContain('doiTen: doiTenDS')
    // Danh sách rỗng thì tuyệt đối không ghi đè.
    expect(than).toContain("if (!rows.length) return jsonResponse_({ ok: false")
  })
})

describe('máy khách — lệnh gửi đi', () => {
  function gia(tra: unknown) {
    const goi = vi.fn(async () => ({ ok: true, json: async () => tra }))
    vi.stubGlobal('fetch', goi)
    return goi
  }

  it('tachLink: mỗi dòng một link, bỏ dòng trống và dòng trùng', () => {
    expect(tachLink('a\n\n b \na')).toEqual(['a', 'b'])
    expect(tachLink('')).toEqual([])
  })

  it('luuLinkDanhSachLop gửi đúng lệnh và bộ link', async () => {
    const goi = gia({ ok: true, links: ['a', 'b'] })
    expect(await luuLinkDanhSachLop('https://x', 'MAT', ['a', 'b'])).toEqual(['a', 'b'])
    expect(JSON.parse((goi.mock.calls[0][1] as { body: string }).body)).toEqual({ action: 'luuLinkDanhSachLop', secret: 'MAT', links: ['a', 'b'] })
  })

  it('máy chủ cũ chưa có lệnh thì ném lỗi rõ ràng, không trả rỗng im lặng', async () => {
    gia({ ok: false, error: 'Thiếu hoặc sai tham số action' })
    await expect(linkDanhSachLop('https://x', 'MAT')).rejects.toThrow(/Thiếu hoặc sai tham số action/)
  })

  it('napDanhSachLop đọc được ba trường mới, máy chủ cũ thì trả mảng rỗng', async () => {
    gia({ ok: true, soDong: 250, them: [{ sbd: '12050', hoTen: 'A' }], bo: [], doiTen: [] })
    expect(await napDanhSachLop('https://x', 'MAT', [])).toMatchObject({ soDong: 250, them: [{ sbd: '12050', hoTen: 'A' }], bo: [], doiTen: [] })
    gia({ ok: true, soDong: 250 })
    expect(await napDanhSachLop('https://x', 'MAT', [])).toMatchObject({ soDong: 250, them: [], bo: [], doiTen: [] })
  })

  it('tomTatDongBo nêu ĐỦ SỐ, nhất là số em bị bỏ khỏi danh sách', () => {
    expect(tomTatDongBo({ soDong: 250, them: [{ sbd: '12050', hoTen: 'A' }], bo: [{ sbd: '12001', hoTen: 'B' }, { sbd: '12002', hoTen: 'C' }], doiTen: [] }, 1)).toBe(
      '250 em · +1 mới · −2 bỏ · 1 SBD trùng',
    )
    expect(tomTatDongBo({ soDong: 250, them: [], bo: [], doiTen: [] })).toBe('250 em')
  })
})

describe('phiếu bài tập nói rõ nó có phải phiếu khắc phục không', () => {
  it('không có bảng chấm từng câu thì NÓI RA, không lặng lẽ đổi thành phiếu chuyên đề', () => {
    // Thầy báo 07/09: tạo 10 câu khắc phục cho một em mà mất dòng đỏ "câu này
    // khắc phục câu nào". Nguyên nhân: mở từ chỗ không kèm bảng chấm của một
    // ca ⇒ `chuaDuoc` sai ⇒ máy rút phiếu luyện chuyên đề, và không nói gì.
    const man = fs.readFileSync(path.join(process.cwd(), 'src/components/NutBaiTapPdf.tsx'), 'utf8')
    expect(man).toContain('{!chuaDuoc && (')
    expect(man).toMatch(/luyện theo chuyên đề[\s\S]{0,200}không phải phiếu khắc phục/)
    expect(man).toContain('Theo dõi ca')
  })
})
