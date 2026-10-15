// @vitest-environment jsdom
// VÒNG 2 (văn phòng 3995d8066e73, 15/10/2026):
// Giới hạn trần 60 câu cho "Tất cả các bài" khi Tải PDF (tránh tệp 252 câu 65 MB gây treo máy yếu).
// - Mục "Tất cả các bài": Tải PDF chỉ lấy tối đa 60 câu đầu của danh sách đang lọc (mới nhất trước).
// - Nhãn nút: "Tải PDF · 60 câu gần nhất" khi > 60 câu; <= 60 câu thì "Tải PDF · N câu".
// - Mục một bài (vd Bài 9): giữ nguyên toàn bộ, không áp trần.
// - Tên tệp, nút "Tải đề làm lại", và đường dự phòng "Mở bản in" cũng theo đúng tập câu đó.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import CauDaLam, { TRAN_CAU_PDF_TAT_CA } from '../src/components/hoa2/CauDaLam'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))

const { dungPdfGia, luuTepGia } = vi.hoisted(() => ({
  dungPdfGia: vi.fn(async (..._a: any[]) => new Blob(['%PDF-1.3'], { type: 'application/pdf' })),
  luuTepGia: vi.fn((..._a: any[]) => {}),
}))
vi.mock('../src/components/hoa2/pdf-cau-da-lam', async (goc) => ({
  ...(await goc<object>()),
  dungPdf: dungPdfGia,
  luuTep: luuTepGia,
}))

beforeEach(() => {
  dungPdfGia.mockClear()
  luuTepGia.mockClear()
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  localStorage.clear()
})

const BAI9 = { id: '3c954a63-cbe1-4409-9a87-3e285ecd9040', ten: 'Bài 9 · Ôn tập chương 2 (đề 2)', hanNop: '2026-10-14', tong: 18 }
const MA = { id: '9c1d4f24-ea90-48f6-ba5d-3be8bb859321', ten: '#cd42011c1c2', hanNop: '2026-10-05', tong: 125 }
const HT = { id: 'hanh-trinh-v3-khoi-10', ten: 'Hành trình giỏi hoá · Khối 10', hanNop: '9999-12-31', tong: 2628 }

// Tạo 252 câu: 4 câu Bài 9, 84 câu Bài mã, 164 câu Hành trình (như em 10040).
// Trong đó: 31 câu "Thành thạo", 221 câu "Cần ôn" (dang_on).
const lo = (cd: { id: string }, n: number, ngay: string, batDau = 1, thanhThaoSoLuong = 0) =>
  Array.from({ length: n }, (_, i) => {
    const stt = batDau + i
    const laThanhThao = i < thanhThaoSoLuong
    return {
      qid: `${cd.id.slice(0, 6)}-${stt}`,
      chienDichId: cd.id,
      stt,
      phan: 'I',
      mucDo: 'hieu',
      tenDang: `Dạng ${cd.id.slice(0, 4)} ${stt}`,
      trangThai: laThanhThao ? 'thanh_thao' : 'dang_on',
      lanCuoiDung: laThanhThao,
      henOn: '2026-10-17',
      lichSu: [{ ngay, dung: laThanhThao, coGoiY: false }],
    }
  })

const CAU_252 = [
  ...lo(BAI9, 4, '2026-10-14', 1, 0),
  ...lo(MA, 84, '2026-10-05', 1, 0),
  ...lo(HT, 164, '2026-10-14', 1, 31), // 31 câu thành thạo ở HT
]

const moCdl = (chienDich = [BAI9, MA, HT], cau = CAU_252) => {
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: { body?: string }) => {
    const duong = new URL(String(url)).pathname
    if (duong === '/game-v2/hoa2-cau-da-lam') {
      return { ok: true, status: 200, json: async () => ({ ok: true, chienDich, cau }) }
    }
    if (duong === '/game-v2/hoa2-cau-chi-tiet') {
      const b = JSON.parse(init?.body || '{}') as { qids?: string[]; qid?: string }
      const qids = b.qids ?? (b.qid ? [b.qid] : [])
      const dsChiTiet = qids.map((q) => ({
        de: { qid: q, phan: 'I', text: `Nội dung câu ${q}`, choices: ['A', 'B', 'C', 'D'], ideas: [], hinhAnh: [], mucDo: 'hieu', tenDang: 'Dạng' },
        dapAn: 'A',
        loiGiai: { chot: 'Lời giải', tung_pa: {} },
        emTraLoi: 'A',
      }))
      return { ok: true, status: 200, json: async () => ({ ok: true, cau: dsChiTiet }) }
    }
    return { ok: true, status: 200, json: async () => ({ ok: true }) }
  }))
  return render(<CauDaLam token="tk" hoTen="Em 10040" sbd="10040" lop="10A" onVe={() => {}} />)
}

describe('Trần 60 câu khi Tải PDF ở mục "Tất cả các bài"', () => {
  it('hằng số TRAN_CAU_PDF_TAT_CA bằng 60', () => {
    expect(TRAN_CAU_PDF_TAT_CA).toBe(60)
  })

  it('Tất cả các bài có 252 câu: nhãn nút là "Tải PDF · 60 câu gần nhất", bấm tải xuất đúng 60 câu', async () => {
    const { container } = moCdl()
    const nutPdf = await screen.findByRole('button', { name: 'Tải PDF · 60 câu gần nhất' })
    expect(nutPdf).toBeTruthy()

    fireEvent.click(nutPdf)
    await waitFor(() => expect(dungPdfGia).toHaveBeenCalledTimes(1))

    const [tt, dsCauIn] = dungPdfGia.mock.calls[0]!
    expect(tt.nhanBoLoc).toBe('Tất cả')
    expect(dsCauIn).toHaveLength(60)
    // 60 câu đầu tiên phải là 60 câu mới nhất (ngày 2026-10-14)
    expect(dsCauIn[0].muc.lichSu[0].ngay).toBe('2026-10-14')

    expect(luuTepGia).toHaveBeenCalledTimes(1)
    await waitFor(() => {
      expect(container.querySelector('.h2-cdl-xong')?.textContent).toContain('(60 câu)')
    })
  })

  it('bộ lọc Thành thạo có 31 câu (<= 60): nhãn nút là "Tải PDF · 31 câu", xuất đúng 31 câu', async () => {
    moCdl()
    const nutLoc = await screen.findByRole('button', { name: /Thành thạo\s*31/ })
    fireEvent.click(nutLoc)

    const nutPdf = await screen.findByRole('button', { name: 'Tải PDF · 31 câu' })
    expect(nutPdf).toBeTruthy()

    fireEvent.click(nutPdf)
    await waitFor(() => expect(dungPdfGia).toHaveBeenCalledTimes(1))

    const [tt, dsCauIn] = dungPdfGia.mock.calls[0]!
    expect(tt.nhanBoLoc).toBe('Thành thạo')
    expect(dsCauIn).toHaveLength(31)
  })

  it('nút "Tải đề làm lại" ở mục Tất cả cũng xuất đúng 60 câu có chiDe=true', async () => {
    moCdl()
    await screen.findByRole('button', { name: 'Tải PDF · 60 câu gần nhất' })
    const nutChiDe = screen.getByRole('button', { name: 'Tải đề làm lại' })
    fireEvent.click(nutChiDe)

    await waitFor(() => expect(dungPdfGia).toHaveBeenCalledTimes(1))
    const [tt, dsCauIn] = dungPdfGia.mock.calls[0]!
    expect(tt.chiDe).toBe(true)
    expect(dsCauIn).toHaveLength(60)
  })

  it('đường dự phòng "Mở bản in" ở mục Tất cả cũng theo đúng 60 câu đó', async () => {
    dungPdfGia.mockRejectedValueOnce(new Error('bộ nhớ'))
    moCdl()
    const nutPdf = await screen.findByRole('button', { name: 'Tải PDF · 60 câu gần nhất' })
    fireEvent.click(nutPdf)

    const nutDuPhong = await screen.findByRole('button', { name: 'Mở bản in' })
    fireEvent.click(nutDuPhong)

    await waitFor(() => expect(document.querySelector('iframe')).not.toBeNull())
    const html = document.querySelector('iframe')!.getAttribute('srcdoc') || ''
    expect(html).toContain('60 câu · Tất cả')
  })

  it('mục một bài (chọn Bài 9): giữ nguyên không áp trần (Bài 9 có 4 câu => 4 câu)', async () => {
    moCdl()
    await screen.findByRole('button', { name: 'Tải PDF · 60 câu gần nhất' })
    const chon = screen.getByRole('combobox', { name: 'Chiến dịch' })
    fireEvent.change(chon, { target: { value: BAI9.id } })

    const nutPdf = await screen.findByRole('button', { name: 'Tải PDF · 4 câu' })
    expect(nutPdf).toBeTruthy()

    fireEvent.click(nutPdf)
    await waitFor(() => expect(dungPdfGia).toHaveBeenCalledTimes(1))
    const [, dsCauIn] = dungPdfGia.mock.calls[0]!
    expect(dsCauIn).toHaveLength(4)
  })

  it('mục một bài có > 60 câu (vd 65 câu): GIỮ NGUYÊN không trần, tải đủ 65 câu', async () => {
    const BAI_LON = { id: 'cd-lon', ten: 'Bài lớn 65 câu', hanNop: '2026-10-30', tong: 65 }
    const CAU_65 = lo(BAI_LON, 65, '2026-10-15')
    moCdl([BAI_LON], CAU_65)

    const nutPdf = await screen.findByRole('button', { name: 'Tải PDF · 65 câu' })
    expect(nutPdf).toBeTruthy()

    fireEvent.click(nutPdf)
    await waitFor(() => expect(dungPdfGia).toHaveBeenCalledTimes(1))
    const [, dsCauIn] = dungPdfGia.mock.calls[0]!
    expect(dsCauIn).toHaveLength(65)
  })
})
