// ĐỒNG BỘ DANH SÁCH LỚP TỪ GOOGLE SHEET CỦA THẦY — thầy chốt 07/09:
// "nhập link danh sách google sheet một lần duy nhất để đồng bộ danh sách, mỗi
// lần tôi thêm hay xoá học sinh tôi chỉ cần bấm vào đồng bộ là hiển thị đúng
// như trong danh sách".
//
// Danh sách này là CỔNG VÀO THI: sai một dòng là em đứng ngoài phòng thi. Nên
// bốn thứ phải khoá:
//   1. Mọi kiểu link thầy dán đều ra đúng một link tải CSV.
//   2. Cột nhận theo TÊN TIÊU ĐỀ — ba sheet của thầy đặt tiêu đề khác nhau.
//   3. Một link hỏng thì KHÔNG ghi đè gì cả.
//   4. Đồng bộ xong phải báo ra em thêm và em bị bỏ, không nói "đã xong" suông.
import { describe, expect, it, vi, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { tachLink, tomTatDongBo } from '../src/components/NutDongBoDanhSach'
import { dongBoDanhSachLop, linkDanhSachLop } from '../src/lib/exam-api'

const GS = fs.readFileSync(path.join(process.cwd(), 'docs/apps-script-kiem-tra.gs'), 'utf8')

function layHam(ten: string): string {
  const dau = GS.indexOf(`function ${ten}(`)
  if (dau < 0) throw new Error(`Không thấy hàm ${ten}`)
  let i = dau
  let ngoac = 0
  let daVao = false
  while (i < GS.length) {
    if (GS[i] === '{') {
      ngoac++
      daVao = true
    } else if (GS[i] === '}') {
      ngoac--
      if (daVao && ngoac === 0) return GS.slice(dau, i + 1)
    }
    i++
  }
  throw new Error(`Hàm ${ten} không đóng ngoặc`)
}

const sv = new Function(
  `${layHam('chuanTen_')}\n${layHam('chuanNamSinh_')}\n${layHam('linkCsvDsLop_')}\n${layHam('lopTuNamSinh_')}\n${layHam('cotDsLop_')}\nreturn { linkCsvDsLop_, lopTuNamSinh_, cotDsLop_ }`,
)() as {
  linkCsvDsLop_: (u: string) => string
  lopTuNamSinh_: (n: unknown) => string
  cotDsLop_: (tieuDe: string[]) => { sbd: number; hoTen: number; namSinh: number; lop: number }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('linkCsvDsLop_ — mọi kiểu link về một link tải CSV', () => {
  it('link "Xuất bản lên web" (đúng ba link thầy gửi 07/09)', () => {
    const pub = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSeTB77Ng6G8qbjnkywhHOjA5y5RbygvzISu2C_nOpNA6_vFRdM4ynJzyA3S5RGp_xaw-CEIWVWgJr5/pubhtml'
    expect(sv.linkCsvDsLop_(pub)).toBe(
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vSeTB77Ng6G8qbjnkywhHOjA5y5RbygvzISu2C_nOpNA6_vFRdM4ynJzyA3S5RGp_xaw-CEIWVWgJr5/pub?output=csv',
    )
  })

  it('giữ gid khi thầy trỏ vào MỘT tab, không mặc kệ lấy tab đầu', () => {
    expect(sv.linkCsvDsLop_('https://docs.google.com/spreadsheets/d/e/ABC/pubhtml?gid=577461977&single=true')).toContain('&gid=577461977')
    expect(sv.linkCsvDsLop_('https://docs.google.com/spreadsheets/d/1w_yOiMX01/edit#gid=123')).toBe(
      'https://docs.google.com/spreadsheets/d/1w_yOiMX01/export?format=csv&gid=123',
    )
  })

  it('link sheet thường về /export?format=csv', () => {
    expect(sv.linkCsvDsLop_('https://docs.google.com/spreadsheets/d/1w_yOiMX01/edit?usp=drivesdk')).toBe(
      'https://docs.google.com/spreadsheets/d/1w_yOiMX01/export?format=csv',
    )
  })

  it('rỗng thì trả rỗng, không dựng link nửa vời', () => {
    expect(sv.linkCsvDsLop_('')).toBe('')
    expect(sv.linkCsvDsLop_('   ')).toBe('')
  })
})

describe('cotDsLop_ — nhận cột theo tên tiêu đề', () => {
  it('ba sheet của thầy đặt tiêu đề khác nhau, đều phải nhận đúng', () => {
    // Khối 2009 ghi "HoTen,NamSinh"; khối 2010 và 2011 ghi "Họ tên,Năm sinh".
    expect(sv.cotDsLop_(['SBD', 'HoTen', 'NamSinh'])).toMatchObject({ sbd: 0, hoTen: 1, namSinh: 2 })
    expect(sv.cotDsLop_(['SBD', 'Họ tên', 'Năm sinh'])).toMatchObject({ sbd: 0, hoTen: 1, namSinh: 2 })
    expect(sv.cotDsLop_(['Số báo danh', 'Họ và tên', 'Năm sinh', 'Lớp'])).toMatchObject({ sbd: 0, hoTen: 1, namSinh: 2, lop: 3 })
  })

  it('cột đảo thứ tự vẫn nhận đúng theo tên', () => {
    expect(sv.cotDsLop_(['Họ tên', 'Năm sinh', 'SBD'])).toMatchObject({ sbd: 2, hoTen: 0, namSinh: 1 })
  })

  it('tiêu đề lạ hoàn toàn thì lùi về vị trí 0-1-2', () => {
    expect(sv.cotDsLop_(['a', 'b', 'c'])).toMatchObject({ sbd: 0, hoTen: 1, namSinh: 2, lop: -1 })
  })
})

describe('lopTuNamSinh_ — sheet của thầy không có cột Lớp', () => {
  it('năm học 2026–2027: 2009 là lớp 12, 2010 lớp 11, 2011 lớp 10', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-07T12:00:00Z'))
    expect(sv.lopTuNamSinh_('2009')).toBe('12')
    expect(sv.lopTuNamSinh_('2010')).toBe('11')
    expect(sv.lopTuNamSinh_('2011')).toBe('10')
  })

  it('trước tháng 9 vẫn tính theo năm học đang chạy', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-20T12:00:00Z'))
    expect(sv.lopTuNamSinh_('2009')).toBe('11')
  })

  it('năm sinh vô nghĩa thì để trống, KHÔNG đoán bừa một lớp', () => {
    expect(sv.lopTuNamSinh_('')).toBe('')
    expect(sv.lopTuNamSinh_('abc')).toBe('')
    expect(sv.lopTuNamSinh_('1200')).toBe('')
  })
})

describe('máy chủ — luật ghi đè', () => {
  const than = GS.slice(GS.indexOf("if (action === 'dongBoDanhSachLop'"), GS.indexOf("if (action === 'huyDuyet')"))

  it('MỘT LINK HỎNG LÀ DỪNG HẲN, chưa ghi đè gì', () => {
    // Ghi đè bằng danh sách thiếu một khối thì cả khối đó bị cổng vào thi chặn
    // sạch ngay buổi sau — hỏng nặng hơn nhiều so với việc sửa lại link.
    expect(than).toContain('chưa ghi đè gì cả')
    const viTriChan = than.indexOf('linkHong.length')
    const viTriGhi = than.indexOf('shDB.clear()')
    expect(viTriChan).toBeGreaterThan(0)
    expect(viTriGhi).toBeGreaterThan(viTriChan)
  })

  it('danh sách rỗng cũng không được ghi đè', () => {
    expect(than).toContain('if (!gom.length) return jsonResponse_({ ok: false')
  })

  it('đòi mã bí mật, và KHÔNG đụng sheet HocSinh', () => {
    expect(than).toContain('kiemTraMaBiMat_(body)')
    expect(than).not.toContain('sheetHS_()')
  })

  it('báo ra em thêm, em bị bỏ, em đổi tên — không nói "đã xong" suông', () => {
    expect(than).toContain('them: them')
    expect(than).toContain('bo: bo')
    expect(than).toContain('doiTen: doiTen')
  })

  it('số báo danh trùng giữa hai khối thì giữ dòng đầu và ghi lại', () => {
    expect(than).toContain('if (daCoSbd[e.sbd]) { trung.push(e.sbd); continue }')
  })

  it('link lưu ở Script property nên đổi máy vẫn còn', () => {
    expect(GS).toContain("var KHOA_LINK_DSLOP = 'LINK_DANH_SACH_LOP'")
    expect(layHam('luuLinkDsLop_')).toContain('PropertiesService.getScriptProperties().setProperty')
  })

  it('chỉ nhận dòng có số báo danh dạng số, bỏ dòng rác', () => {
    expect(layHam('tuLinkRaDanhSach_')).toContain('/^\\d{3,12}$/.test(sbd)')
  })
})

describe('máy khách', () => {
  function gia(tra: unknown) {
    const goi = vi.fn(async () => ({ ok: true, json: async () => tra }))
    vi.stubGlobal('fetch', goi)
    return goi
  }

  it('tachLink: mỗi dòng một link, bỏ dòng trống và dòng trùng', () => {
    expect(tachLink('a\n\n b \na')).toEqual(['a', 'b'])
    expect(tachLink('')).toEqual([])
  })

  it('bỏ trống links thì máy chủ dùng bộ đang lưu — không xoá mất link cũ', async () => {
    const goi = gia({ ok: true, soDong: 250, links: ['a'] })
    await dongBoDanhSachLop('https://x', 'MAT')
    const b = JSON.parse((goi.mock.calls[0][1] as { body: string }).body)
    expect(b).toEqual({ action: 'dongBoDanhSachLop', secret: 'MAT' })
    expect(Object.keys(b)).not.toContain('links')
  })

  it('truyền links thì gửi lên để lưu', async () => {
    const goi = gia({ ok: true, soDong: 250, links: ['a', 'b'] })
    await dongBoDanhSachLop('https://x', 'MAT', ['a', 'b'])
    const b = JSON.parse((goi.mock.calls[0][1] as { body: string }).body)
    expect(b.links).toEqual(['a', 'b'])
  })

  it('lỗi của máy chủ kèm lý do TỪNG LINK, không nuốt mất', async () => {
    gia({ ok: false, error: 'Không tải được 1/3 link — chưa ghi đè gì cả', theoLink: [{ link: 'a', so: 0, loi: 'Máy chủ Google trả mã 404' }, { link: 'b', so: 90, loi: '' }] })
    await expect(dongBoDanhSachLop('https://x', 'MAT')).rejects.toThrow(/404/)
  })

  it('máy chủ cũ chưa có lệnh linkDanhSachLop thì ném lỗi rõ ràng', async () => {
    gia({ ok: false, error: 'Thiếu hoặc sai tham số action' })
    await expect(linkDanhSachLop('https://x', 'MAT')).rejects.toThrow(/Thiếu hoặc sai tham số action/)
  })

  it('tomTatDongBo nêu ĐỦ SỐ, nhất là số em bị bỏ khỏi danh sách', () => {
    expect(
      tomTatDongBo({
        soDong: 250,
        links: [],
        theoLink: [],
        trung: ['12000'],
        them: [{ sbd: '12050', hoTen: 'A' }],
        bo: [{ sbd: '12001', hoTen: 'B' }, { sbd: '12002', hoTen: 'C' }],
        doiTen: [],
        capNhatLuc: '',
      }),
    ).toBe('250 em · +1 mới · −2 bỏ · 1 SBD trùng')
    expect(tomTatDongBo({ soDong: 250, links: [], theoLink: [], trung: [], them: [], bo: [], doiTen: [], capNhatLuc: '' })).toBe('250 em')
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
