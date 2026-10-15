// @vitest-environment jsdom
// LỖI 15/10 (em lớp 10 báo tối 15/10: "Câu đã làm" ít câu hơn trước, "có 3 câu thôi"). Gốc: đợt 18 (thầy 12/10) bỏ Hành trình và bài mang
// mã nội bộ "#cd…" khỏi ô chọn chiến dịch, nhưng danh sách vẫn chỉ hiện câu của MỘT mục đang chọn ⇒ câu em làm trong Hành trình / bài "#cd…"
// không còn đường nào xem. Dữ liệu thật của em (D1, 15/10): Bài 9 (18 câu, em làm 6), "#cd42011c1c2" (em làm 125), Hành trình khối 10 (em làm 273).
// Sửa: mục đầu "Tất cả các bài" (không phải một bài) và là MẶC ĐỊNH khi câu em làm nằm ngoài một bài thật duy nhất; ô chọn vẫn KHÔNG liệt kê
// Hành trình hay "#cd…" (giữ ý thầy 12/10). Danh sách dài hiện từng trang 30 câu, chỉ lấy lời giải câu đang hiện (giữ luật tốc độ 13/10).
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import CauDaLam from '../src/components/hoa2/CauDaLam'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  localStorage.clear()
})

const BAI9 = { id: '3c954a63', ten: 'Bài 9 · Ôn tập chương 2 (đề 2)', hanNop: '2026-10-14', tong: 18 }
const MA = { id: '9c1d4f24', ten: '#cd42011c1c2', hanNop: '2026-10-05', tong: 125 }
const HT = { id: 'hanh-trinh-v3-khoi-10', ten: 'Hành trình giỏi hoá · Khối 10', hanNop: '9999-12-31', tong: 2628 }
const cau = (qid: string, chienDichId: string, tenDang: string, ngay = '2026-10-11') => ({
  qid, chienDichId, stt: 1, phan: 'I', mucDo: 'hieu', tenDang, trangThai: 'dang_on', lanCuoiDung: false, henOn: null,
  lichSu: [{ ngay, dung: false, coGoiY: false }],
})

/** Máy chủ giả: trả danh sách câu đã làm; ghi lại các qid màn xin chi tiết. */
const moCdl = (chienDich: object[], dsCau: object[]) => {
  const xinChiTiet: string[][] = []
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: { body?: string }) => {
    const duong = new URL(String(url)).pathname
    if (duong === '/game-v2/hoa2-cau-chi-tiet') {
      const b = JSON.parse(init?.body || '{}') as { qids?: string[]; qid?: string }
      xinChiTiet.push(b.qids ?? (b.qid ? [b.qid] : []))
    }
    return { ok: true, status: 200, json: async () => (duong === '/game-v2/hoa2-cau-da-lam' ? { ok: true, chienDich, cau: dsCau } : { ok: true, cau: [] }) }
  }))
  return { ...render(<CauDaLam token="tk" hoTen="Lê Hải" sbd="S1" onVe={() => {}} />), xinChiTiet }
}

const soThe = (c: HTMLElement) => c.querySelectorAll('article.h2-the').length

describe('Câu đã làm: em thấy MỌI câu đã làm (lỗi 15/10)', () => {
  const DU_LIEU_EM = [
    cau('B1', BAI9.id, 'Bài 9 câu một'), cau('B2', BAI9.id, 'Bài 9 câu hai'), cau('B3', BAI9.id, 'Bài 9 câu ba'),
    cau('M1', MA.id, 'Cấu hình electron'), cau('M2', MA.id, 'Bảng tuần hoàn'),
    cau('H1', HT.id, 'Liên kết ion'), cau('H2', HT.id, 'Liên kết cộng hoá trị'), cau('H3', HT.id, 'Số oxi hoá'), cau('H4', HT.id, 'Phản ứng oxi hoá khử'),
  ]

  it('dữ liệu như em 10040 (một bài thật + bài mã "#cd…" + Hành trình): mặc định hiện ĐỦ 9 câu, không chỉ 3 câu của Bài 9', async () => {
    const { container } = moCdl([BAI9, MA, HT], DU_LIEU_EM)
    await screen.findByText('Liên kết ion')
    expect(soThe(container)).toBe(9)
    expect(screen.getByText('Cấu hình electron')).toBeTruthy()
    expect(screen.getByText('Bài 9 câu một')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Tải PDF · 9 câu/ })).toBeTruthy()
  })

  it('ô chọn: "Tất cả các bài" đứng đầu và là mặc định, sau đó CHỈ bài thật; không Hành trình, không mã "#cd…" (ý thầy 12/10 giữ nguyên)', async () => {
    const { container } = moCdl([BAI9, MA, HT], DU_LIEU_EM)
    await screen.findByText('Liên kết ion')
    const chon = screen.getByRole('combobox', { name: 'Chiến dịch' }) as HTMLSelectElement
    expect([...chon.options].map((o) => o.textContent)).toEqual(['Tất cả các bài · 9 câu đã làm', 'Bài 9 · Ôn tập chương 2 (đề 2) · 18 câu'])
    expect(chon.selectedIndex).toBe(0)
    expect(container.textContent).not.toContain('#cd')
    expect(container.textContent).not.toContain('Hành trình')
  })

  it('chọn Bài 9 ⇒ chỉ câu của Bài 9 (câu Hành trình không lẫn vào); chọn lại Tất cả ⇒ đủ 9', async () => {
    const { container } = moCdl([BAI9, MA, HT], DU_LIEU_EM)
    await screen.findByText('Liên kết ion')
    const chon = screen.getByRole('combobox', { name: 'Chiến dịch' }) as HTMLSelectElement
    fireEvent.change(chon, { target: { value: BAI9.id } })
    await waitFor(() => expect(soThe(container)).toBe(3))
    expect(screen.queryByText('Liên kết ion')).toBeNull()
    fireEvent.change(chon, { target: { value: chon.options[0]!.value } })
    await waitFor(() => expect(soThe(container)).toBe(9))
  })

  it('mọi câu em làm đều thuộc MỘT bài thật ⇒ giữ tiêu đề trơn của đợt 18, không hộp chọn thừa', async () => {
    const { container } = moCdl([BAI9, MA, HT], DU_LIEU_EM.slice(0, 3))
    await screen.findByText('Bài 9 câu một')
    expect(screen.queryByRole('combobox')).toBeNull()
    expect(container.querySelector('.h2-cdl-bai')!.textContent).toBe('Bài 9 · Ôn tập chương 2 (đề 2) · 18 câu')
    expect(soThe(container)).toBe(3)
  })

  it('câu đều nằm trong các bài thật ⇒ như bản vẽ 27/09: mặc định bài mới nhất có câu, không thêm mục "Tất cả các bài"', async () => {
    const BAI8 = { id: 'cd8', ten: 'Bài 8 · Amine', hanNop: '2026-10-20', tong: 164 }
    const { container } = moCdl([BAI9, BAI8, HT], [cau('B1', BAI9.id, 'Bài 9 câu một'), cau('A1', BAI8.id, 'Amine bậc hai')])
    await screen.findByText('Bài 9 câu một')
    const chon = screen.getByRole('combobox', { name: 'Chiến dịch' }) as HTMLSelectElement
    expect([...chon.options].map((o) => o.textContent)).toEqual(['Bài 9 · Ôn tập chương 2 (đề 2) · 18 câu', 'Bài 8 · Amine · 164 câu'])
    expect(soThe(container)).toBe(1)
  })

  it('không có bài thật nào (chỉ Hành trình + "#cd…") ⇒ không ô chọn, vẫn đủ câu của CẢ hai nhóm', async () => {
    const { container } = moCdl([MA, HT], DU_LIEU_EM.slice(3))
    await screen.findByText('Liên kết ion')
    expect(screen.queryByRole('combobox')).toBeNull()
    expect(soThe(container)).toBe(6)
    expect(screen.getByText('Cấu hình electron')).toBeTruthy()
  })

  it('danh sách dài: hiện 30 câu đầu, chỉ xin lời giải 30 câu đó; "Xem thêm" mở tiếp', async () => {
    const nhieu = Array.from({ length: 45 }, (_, i) => cau(`Q${i}`, HT.id, `Dạng ${i}`, `2026-10-${String(10 + (i % 5)).padStart(2, '0')}`))
    const { container, xinChiTiet } = moCdl([BAI9, HT], [cau('B1', BAI9.id, 'Bài 9 câu một'), ...nhieu])
    await screen.findByText('Bài 9 câu một')
    expect(soThe(container)).toBe(30)
    expect(screen.getByText(/46 câu · xếp theo lần làm gần nhất/)).toBeTruthy()
    await waitFor(() => expect(xinChiTiet.flat().length).toBe(30))
    fireEvent.click(screen.getByRole('button', { name: 'Xem thêm 16 câu' }))
    await waitFor(() => expect(soThe(container)).toBe(46))
    await waitFor(() => expect(xinChiTiet.flat().length).toBe(46))
    expect(new Set(xinChiTiet.flat()).size).toBe(46)
    expect(screen.queryByRole('button', { name: /Xem thêm/ })).toBeNull()
  })
})
