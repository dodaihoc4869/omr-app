// THẺ «EM VÀ CÂU NÀY» trong hộp Hỏi Thầy (thầy 21/10; bản vẽ + đặc tả docs/ban-ve-hoi-thay-em-2110; thầy "Tự tối ưu thông minh và hiệu quả nhất"
// ⇒ chốt theo đề xuất: «Phần em đã vững» / «Phần em đang luyện thêm», đang làm chỉ số lần, mặc định gập).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-thu' }))
import HopHoiThay from '../src/components/loi-giai/HopHoiThay'
import { docEmVaCau, gioDayDuVn, nhanTomTat, type EmVaCau } from '../src/lib/em-va-cau'
import { gioDayDu } from '../src/lib/ngay-gio-24'
import { tomTatEmVaCau, type HoSoHoiThay } from '../server/src/hoi-thay-ca-nhan'

const NOW = Date.parse('2026-10-21T07:05:00Z'), MOC = '2026-10-20T17:00:00.000Z'
const kn = (ten: string, trangThai: string, tuLam = 5, chuaChac = false) => ({ ten, p: 0.5, tuLam, ngay: 3, capNhat: MOC, chuaChac, trangThai })
const HO_SO: HoSoHoiThay = {
  kyNang: [kn('Bậc amine', 'chua_vung'), kn('Đếm đồng phân amine', 'vung', 7), kn('Amine gặp HNO2', 'chua_du', 1, true), kn('Chưa làm bao giờ', '', 0, true)],
  // Máy chủ đọc MỚI → CŨ.
  lanLam: [
    { ketQua: 0, troGiup: false, luc: new Date(NOW).toISOString() },
    { ketQua: 1, troGiup: true, luc: new Date(NOW - 86_400_000).toISOString() },
    { ketQua: 1, troGiup: false, luc: new Date(NOW - 3 * 86_400_000).toISOString() },
  ],
  cungDang: { canOn: [{ ten: 'So sánh lực base', p: 0.3, tuLam: 3, ngay: 2, capNhat: MOC }], vung: [{ ten: 'Gọi tên amine', p: 0.9, tuLam: 5, ngay: 4, capNhat: MOC }] },
}

describe('máy chủ: tomTatEmVaCau', () => {
  it('đã nộp: cũ → mới, tự làm bỏ lần trợ giúp; mức theo trang_thai SPRT; hỏi nhanh ≤ 2 (đang luyện thêm trước); không p thô', () => {
    const t = tomTatEmVaCau(HO_SO, { dangLam: false })
    expect(t.cauNay).toEqual({ tuLam: 2, tuLamDung: 1, coTroGiup: 1, lan: [...HO_SO.lanLam].reverse() })
    expect(t.kienThuc.map((k) => [k.ten, k.muc, k.trongCau])).toEqual([
      ['Bậc amine', 'luyen_them', true], ['Đếm đồng phân amine', 'vung', true], ['Amine gặp HNO2', 'chua_du', true],
      ['Gọi tên amine', 'vung', false], ['So sánh lực base', 'luyen_them', false],
    ])
    expect(t.hoiNhanh).toEqual(['Bậc amine', 'Amine gặp HNO2'])
    expect(t.mocKienThuc).toBe(MOC)
    expect(JSON.stringify(t)).not.toMatch(/"p"|"qid"|dapAn|Chưa làm bao giờ/)
  })
  it('ĐANG LÀM: chỉ tổng số lần — không đúng/sai, không lần nào, không trợ giúp', () => {
    const t = tomTatEmVaCau(HO_SO, { dangLam: true })
    expect(t.cauNay).toEqual({ soLan: 3 })
    expect(JSON.stringify(t)).not.toMatch(/ketQua|tuLamDung|coTroGiup|"lan"/)
  })
  it('chưa có gì: không cauNay, danh sách rỗng (máy em hiện "lần đầu")', () => {
    expect(tomTatEmVaCau({ kyNang: [], lanLam: [] }, { dangLam: false })).toEqual({ kienThuc: [], hoiNhanh: [] })
  })
})

describe('máy em: docEmVaCau + nhãn', () => {
  it('ngày giờ tự viết (không nhập chung để khỏi thêm tệp precache) ra ĐÚNG như hàm chuẩn của app', () => {
    for (const x of ['2026-10-21T07:05:00Z', '2026-10-20T17:00:00.000Z', '2026-12-31T16:59:00Z', '2026-10-18T23:30:00Z']) expect(gioDayDuVn(x)).toBe(gioDayDu(x, ''))
    expect(gioDayDuVn('hỏng')).toBe('')
  })
  it('khuôn hỏng ⇒ null (thẻ ẩn); khuôn đúng đọc đủ; nhãn không bao giờ "0/0"', () => {
    for (const x of [null, 'x', [], { kienThuc: 1 }, { kienThuc: [] }]) expect(docEmVaCau(x)).toBeNull()
    const e = docEmVaCau(tomTatEmVaCau(HO_SO, { dangLam: false }))!
    expect(nhanTomTat(e)).toBe('Tự làm đúng 1/2 lần')
    expect(nhanTomTat(docEmVaCau(tomTatEmVaCau(HO_SO, { dangLam: true }))!)).toBe('Đã làm 3 lần')
    expect(nhanTomTat({ kienThuc: [{ ten: 'A', muc: 'vung', tuLam: 4, ngay: 2, trongCau: true }], hoiNhanh: [] })).toBe('Lần đầu làm câu này · 1 phần đã vững')
    expect(nhanTomTat({ cauNay: { tuLam: 0, tuLamDung: 0, coTroGiup: 2, lan: [{ ketQua: 1, troGiup: true, luc: MOC }, { ketQua: 0, troGiup: true, luc: MOC }] }, kienThuc: [], hoiNhanh: [] })).toBe('Đã làm 2 lần, đều có trợ giúp')
  })
})

// Hộp vẽ qua portal vào <body> ⇒ tìm trong document.
describe('giao diện thẻ trong hộp Hỏi Thầy', () => {
  const goi: { url: string; body: Record<string, unknown> }[] = []
  beforeEach(() => {
    goi.length = 0
    localStorage.setItem('omr_student_portal_auth', JSON.stringify({ token: 'token-em' }))
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      goi.push({ url: String(input), body: JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown> })
      return new Response(JSON.stringify({ ok: true, traLoi: 'Bậc amine là số gốc hydrocarbon gắn vào N.', conLai: 30 }), { status: 200, headers: { 'content-type': 'application/json' } })
    })
  })
  afterEach(() => { cleanup(); vi.restoreAllMocks(); localStorage.clear() })
  const CAU = { qid: 'Q-33', so: 'Câu 33', nguon: 'luyen', chuong: 'Hợp chất chứa nitrogen', de: '<p>Ứng với công thức phân tử C4H11N …</p>', y: {} }
  const EM: EmVaCau = docEmVaCau(tomTatEmVaCau(HO_SO, { dangLam: false }))!

  it('mặc định GẬP với nhãn tóm tắt; mở thẻ thì Đề gập; đủ hai nhóm + chưa đủ lượt; chữ đúng chuẩn', () => {
    render(<HopHoiThay cau={CAU} em={EM} nguon="luyen" onDong={() => {}} />)
    const the = document.querySelector('details.lg-ev') as HTMLDetailsElement
    const de = document.querySelector('details.lg-hh-de') as HTMLDetailsElement
    expect(the.open).toBe(false); expect(de.open).toBe(true)
    expect(the.querySelector('.lg-ev-tom')!.textContent).toBe('Tự làm đúng 1/2 lần')
    the.open = true; fireEvent(the, new Event('toggle'))
    expect(de.open).toBe(false)
    const chu = the.textContent ?? ''
    for (const x of ['Phần em đã vững', 'Phần em đang luyện thêm', 'Chưa đủ lượt để biết', 'Cùng dạng', 'Không tính điểm', 'Lần gần nhất: Sai']) expect(chu).toContain(x)
    expect(chu).not.toMatch(/điểm yếu|kém|nắm chắc|kỹ năng|0,\d/)
    expect(the.querySelectorAll('.lg-ev-lan li')).toHaveLength(3)
  })
  it('chạm hỏi nhanh: gửi ĐÚNG MỘT câu cho Thầy như em tự gõ, thẻ gập', async () => {
    render(<HopHoiThay cau={CAU} em={EM} nguon="luyen" onDong={() => {}} />)
    const the = document.querySelector('details.lg-ev') as HTMLDetailsElement
    the.open = true; fireEvent(the, new Event('toggle'))
    fireEvent.click(screen.getByRole('button', { name: 'Giải thích lại: Bậc amine' }))
    await screen.findByText('Bậc amine là số gốc hydrocarbon gắn vào N.')
    expect(goi.filter((g) => g.url.endsWith('/hs/hoi-tro-ly'))).toHaveLength(1)
    expect(goi[0]!.body).toMatchObject({ qid: 'Q-33', cauHoi: 'Thầy giải thích lại giúp em phần Bậc amine trong câu này.' })
    expect(screen.getByText('Thầy giải thích lại giúp em phần Bậc amine trong câu này.')).toBeTruthy()
    await waitFor(() => expect(the.open).toBe(false))
  })
  it('đang làm: chỉ "Đã làm 3 lần", không chấm Đúng/Sai, nút xin gợi hướng', () => {
    const em = docEmVaCau(tomTatEmVaCau(HO_SO, { dangLam: true }))!
    render(<HopHoiThay cau={CAU} em={em} dangLam nguon="luyen" onDong={() => {}} />)
    const the = document.querySelector('details.lg-ev') as HTMLDetailsElement
    expect(the.querySelector('.lg-ev-tom')!.textContent).toBe('Đã làm 3 lần')
    expect(the.querySelector('.lg-ev-lan')).toBeNull()
    expect(the.textContent).not.toMatch(/Lần gần nhất|Đúng|Sai/)
    expect(screen.getByRole('button', { name: 'Gợi hướng: Bậc amine' })).toBeTruthy()
  })
  it('đang tải (đề chưa về) ⇒ dòng chờ; máy chủ không gửi (null) ⇒ không có thẻ; lần đầu ⇒ một dòng, không mở được', () => {
    const { rerender } = render(<HopHoiThay cau={null} qid="Q-33" nguon="luyen" onDong={() => {}} />)
    expect(document.querySelector('.lg-ev .lg-ev-vach')).toBeTruthy()
    rerender(<HopHoiThay cau={CAU} em={null} nguon="luyen" onDong={() => {}} />)
    expect(document.querySelector('.lg-ev')).toBeNull()
    rerender(<HopHoiThay cau={CAU} em={{ kienThuc: [], hoiNhanh: [] }} nguon="luyen" onDong={() => {}} />)
    expect(document.querySelector('.lg-ev--moi')!.textContent).toContain('Đây là lần đầu em làm câu này')
    expect(document.querySelector('details.lg-ev')).toBeNull()
  })
})
