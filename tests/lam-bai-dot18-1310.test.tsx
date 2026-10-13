// @vitest-environment jsdom
// ĐỢT 18 · LÀN H (thầy 12/10: "Tối ưu cho dọc ngang máy tính tất cả các màn làm bài của học sinh phải siêu đẹp và thân thiện" ·
// "Tối ưu lại câu từ cho dễ hiểu ở mọi [màn]. Bỏ hết các gợi ý hướng dẫn để học sinh phụ huynh không bị phân tâm" ·
// Câu đã làm: "Chỗ tải đề làm lại cho đẹp tinh tế và gọn gàng" và ô chọn chiến dịch "chỉ giữ lại bài đã chọn là bài 8, các phần dưới xóa bỏ nhé").
// Khoá: các dòng gợi ý/hướng dẫn đã bỏ KHÔNG quay lại; nhãn số, trạng thái, lỗi, luật bài làm vẫn còn; ô chọn của Câu đã làm chỉ có bài thật.
import fs from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import ManLamBaiTap from '../src/components/hoc-tap/ManLamBaiTap'
import LamCauOn from '../src/components/bang-nhiem-vu/LamCauOn'
import DaiCauChuaLamM3 from '../src/screens/DaiCauChuaLamM3'
import CauDaLam, { chienDichHienChon, coTenThat, laHanhTrinhCd } from '../src/components/hoa2/CauDaLam'
import { goiHoa2 } from '../src/components/hoa2/api'

vi.mock('../src/components/hoa2/api', async (goc) => ({ ...(await goc<typeof import('../src/components/hoa2/api')>()), goiHoa2: vi.fn() }))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  vi.mocked(goiHoa2).mockReset()
  vi.unstubAllGlobals()
  localStorage.clear()
})

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')

const nen = { maDe: 'de-8', version: 'v1', group: 'g', hinhAnh: [], dang: null, tenDang: 'Amine', mucDo: 'hieu', sao: 0, kienThuc: [] }
const TN = { ...nen, qid: 'tn1', phan: 'I' as const, text: 'Chất nào sau đây là amine bậc hai?', choices: ['CH3NH2', '(CH3)2NH', '(CH3)3N', 'C6H5NH2'], ideas: [] }
const DS = { ...nen, qid: 'ds1', phan: 'II' as const, text: 'Xét dãy hydroxide chu kì 2.', choices: [], ideas: ['Ý một.', 'Ý hai.', 'Ý ba.', 'Ý bốn.'] }
const TLN = { ...nen, qid: 'tl1', phan: 'III' as const, text: 'Giá trị của V là bao nhiêu?', choices: [], ideas: [] }
const moLam = (cau: object[]) => {
  vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, id: 'p1', questions: cau })
  return render(<ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} homNay={{ daLam: 6, muc: 24, chang: 2, soChang: 4 }} />)
}

describe('Màn làm bài (ManLamBaiTap): bỏ dòng hướng dẫn, giữ nhãn số', () => {
  it('trắc nghiệm / đúng–sai / trả lời ngắn: không còn chữ hướng dẫn; còn tiêu đề câu, "câu hôm nay", chữ nút Nộp', async () => {
    const { container } = moLam([TN, DS, TLN])
    await screen.findByText(TN.text)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Chặng 2 · Câu 1/3')
    expect(screen.getByText('6/24')).toBeTruthy()
    expect(screen.getByText('câu hôm nay')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Chọn một đáp án để nộp' })).toBeTruthy()
    for (const bo of ['Chạm cả ô để chọn', 'chọn lại được trước khi nộp', 'Lựa chọn được lưu nháp', 'thoát ra vào lại vẫn còn', 'Tối đa 4 kí tự như phiếu', 'Cách nào cũng được tính', 'đúng con số thầy thấy'])
      expect(container.textContent, bo).not.toContain(bo)
    expect(doc('src/components/hoc-tap/ManLamBaiTap.tsx')).not.toMatch(/đúng con số thầy thấy|Thầy xem riêng số câu tự làm|lưu nháp — thoát ra/)
    expect(doc('src/components/hoc-tap/LamCau.tsx')).not.toContain('Tối đa 4 kí tự như phiếu')
  })
  it('câu có gợi ý: còn nút bóng đèn và MỘT dòng ngắn nói cách tính', async () => {
    moLam([{ ...TN, goiY: { cotLoi: 'Bậc amine = số gốc hydrocarbon gắn vào N.' } }])
    await screen.findByText(TN.text)
    expect(screen.getByText('Câu có gợi ý: tính là có hỗ trợ.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Xem gợi ý' }))
    expect(screen.getByText('Bậc amine = số gốc hydrocarbon gắn vào N.')).toBeTruthy()
  })
})

describe('Ôn câu (LamCauOn): đầu màn gọn', () => {
  const CAU = [{ qid: 'on1', phan: 'I' as const, text: 'Este X có tên gọi là gì?', choices: ['A1', 'B1', 'C1', 'D1'], tenDang: 'Danh pháp ester' }]
  it('không còn đoạn hướng dẫn; còn tiêu đề + chip "Đã trả lời 0/1 câu" + thanh nộp', async () => {
    const { container } = render(<LamCauOn token="tk" sbd="s1" viecId="on_lai:2026-10-13" qid={['on1']} cauSan={CAU} onXong={vi.fn()} />)
    await screen.findByText('Este X có tên gọi là gì?')
    expect(screen.getByRole('heading', { name: 'Ôn câu hôm nay' })).toBeTruthy()
    expect(screen.getByText('Đã trả lời 0/1 câu')).toBeTruthy()
    expect(screen.getByText('Còn 1 câu chưa trả lời')).toBeTruthy()
    expect(container.textContent).not.toMatch(/Chọn đáp án cho từng câu|làm nốt sau cũng được/)
  })
  it('điện thoại xoay ngang: đầu màn một hàng (tiêu đề + chip), không chiếm 1/3 màn đầu', () => {
    const css = doc('src/components/bang-nhiem-vu/lam-cau-on.css').replace(/\/\*[\s\S]*?\*\//g, '')
    const khoi = css.slice(css.lastIndexOf('@media (orientation: landscape) and (max-height: 500px)'))
    expect(khoi).toMatch(/\.lco-dau\s*\{[^}]*flex-direction:\s*row/)
    expect(khoi).toMatch(/\.lco-tieu-de\s*\{[^}]*font-size:\s*var\(--bnv-cx-3\)/)
  })
})

describe('Màn thi (ExamTakeScreen và các mảnh bố cục): chỉ bố cục + bỏ gợi ý, luật thi giữ nguyên', () => {
  it('dải "Còn N câu chưa làm" không còn dòng "chạm số để tới câu"', () => {
    const { container } = render(<DaiCauChuaLamM3 chuaLam={[1, 2, 3]} onToiCau={() => {}} onMoLuoi={() => {}} />)
    expect(container.textContent).toContain('Còn 3 câu chưa làm')
    expect(container.textContent).not.toContain('chạm số để tới câu')
  })
  it('máy tính: đầu cột đề chỉ ghi số câu, bỏ dải chú thích phím tắt (bảng phím tắt vẫn mở được bằng nút)', () => {
    const src = doc('src/screens/LamBaiNgang.tsx')
    expect(src).not.toContain('Phím tắt: bấm')
    expect(src).not.toContain('lb-goi-y-ds')
    expect(src).toContain('Phím tắt khi làm bài')
    expect(doc('src/screens/ExamTakeScreen.tsx')).toContain('Sau khi nộp không sửa được nữa.')
  })
  it('đích chạm: thanh mỏng 32 px của điện thoại xoay ngang nới vùng chạm lên 44 px; ô tô phiếu 44 px trên máy cảm ứng; thanh trên dọc không cắt chữ', () => {
    const ngang = doc('src/screens/lam-bai-ngang.css')
    expect(ngang).toMatch(/\.lb-gon \.lb-gon-so::after, \.lb-gon \.lb-nop::after \{ inset: -9px 0; \}/)
    expect(ngang).toMatch(/@media \(pointer: coarse\) \{\s*\.lb-phieu \.lb-bong \{ width: 44px; height: 44px; \}/)
    expect(ngang).toMatch(/\.lb-gon-thanh \{[^}]*height: 32px/)
    const m3 = doc('src/screens/man-thi-m3.css')
    expect(m3).toMatch(/@media \(max-width: 439px\) \{[^@]*\.m3 \.thi-tren-ten \{ display: none; \}/)
  })
})

describe('Tu luyện / Luyện đề cấu trúc: bỏ chữ hướng dẫn', () => {
  it('nguồn không còn các dòng hướng dẫn đã bỏ; luật "Hết 50 phút bài tự nộp." còn', () => {
    const tl = doc('src/components/tu-luyen/ManTuLuyen.tsx')
    for (const bo of ['theo dõi riêng', 'hẹn gặp lại sau 1 ngày', 'Chọn một cách luyện để bắt đầu', 'bấm một ô để xem lại', 'Kéo quá', 'chọn được nhiều dạng', 'Em làm tốt lắm'])
      expect(tl, bo).not.toContain(bo)
    const ld = doc('src/components/tu-luyen/LuyenDeCauTruc.tsx')
    for (const bo of ['bấm Hỏi thầy ngay', 'bấm một ô để xem lại', 'Em làm tốt lắm', 'Làm đề đầu tiên']) expect(ld, bo).not.toContain(bo)
    expect(ld).toContain('Hết 50 phút bài tự nộp.')
    expect(doc('src/components/tu-luyen/bo-cuc.tsx')).not.toContain('className="tlu-phim"')
  })
})

// ───────────────────────────── Câu đã làm: ô chọn chỉ có bài thật + hàng tải gọn ─────────────────────────────
const BAI8 = { id: 'cd8', ten: 'Bài 8 · Amine', hanNop: '2026-10-20', tong: 164 }
const MA = { id: 'cd12009c1c2', ten: '#cd12009c1c2', hanNop: '2026-10-25', tong: 112 }
const HT = { id: 'hanh-trinh-v3-khoi-12', ten: 'Hành trình giỏi hoá · Khối 12', hanNop: '9999-12-31', tong: 9269 }
const cau = (qid: string, chienDichId: string, tenDang: string) => ({ qid, chienDichId, stt: 3, phan: 'I', mucDo: 'hieu', tenDang, trangThai: 'dang_on', lanCuoiDung: false, henOn: null, lichSu: [{ ngay: '2026-10-11', dung: false, coGoiY: false }] })
const moCdl = (chienDich: object[], dsCau: object[]) => {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => ({ ok: true, status: 200, json: async () => (new URL(String(url)).pathname === '/game-v2/hoa2-cau-da-lam' ? { ok: true, chienDich, cau: dsCau } : { ok: true, cau: [] }) })))
  return render(<CauDaLam token="tk" hoTen="Nguyễn An" sbd="S1" onVe={() => {}} />)
}

describe('Câu đã làm (CauDaLam)', () => {
  it('phép lọc: bỏ Hành trình và mục mang mã nội bộ, giữ bài thật theo thứ tự máy chủ', () => {
    expect(chienDichHienChon([BAI8, MA, HT]).map((c) => c.id)).toEqual(['cd8'])
    expect(laHanhTrinhCd(HT)).toBe(true)
    expect(laHanhTrinhCd({ id: 'x', ten: 'Ôn tập', hanNop: '9999-12-31' })).toBe(true) // hạn giả của Hành trình
    expect(laHanhTrinhCd(BAI8)).toBe(false)
    expect(coTenThat(MA)).toBe(false)
    expect(coTenThat({ id: 'cd77', ten: 'Chiến dịch' })).toBe(false) // tên mặc định khi máy chủ không gửi tên
    expect(coTenThat({ id: 'cd77', ten: 'cd77' })).toBe(false)
    expect(coTenThat({ id: 'cau-sai-ca-kiem-tra', ten: 'Câu sai trong ca kiểm tra' })).toBe(true)
  })
  it('chỉ còn MỘT bài ⇒ tiêu đề trơn "Bài 8 · Amine · 164 câu", không hộp chọn, không mã "#cd…", không Hành trình', async () => {
    const { container } = moCdl([BAI8, MA, HT], [cau('A1', 'cd8', 'Amine bậc hai'), cau('H1', HT.id, 'Glucose')])
    await screen.findByText('Amine bậc hai')
    expect(screen.queryByRole('combobox')).toBeNull()
    expect(container.querySelector('.h2-cdl-bai')!.textContent).toBe('Bài 8 · Amine · 164 câu')
    expect(container.textContent).not.toContain('#cd')
    expect(container.textContent).not.toContain('Hành trình')
    expect(container.textContent).not.toContain('Glucose') // câu của mục đã bỏ không lẫn vào danh sách bài 8
  })
  it('không còn bài thật nào (chỉ Hành trình) ⇒ ẩn ô chọn nhưng danh sách câu vẫn chạy', async () => {
    const { container } = moCdl([HT], [cau('H1', HT.id, 'Glucose')])
    await screen.findByText('Glucose')
    expect(screen.queryByRole('combobox')).toBeNull()
    expect(container.querySelector('.h2-cdl-bai, .h2-cdl-chon')).toBeNull()
    expect(screen.getByRole('button', { name: /Tải PDF · 1 câu/ })).toBeTruthy()
  })
  it('từ hai bài trở lên ⇒ hộp chọn chỉ liệt kê bài thật', async () => {
    moCdl([BAI8, MA, { id: 'cd9', ten: 'Bài 9 · Amino acid', hanNop: '2026-10-28', tong: 80 }, HT], [cau('A1', 'cd8', 'Amine bậc hai')])
    await screen.findByText('Amine bậc hai')
    const chon = screen.getByRole('combobox', { name: 'Chiến dịch' }) as HTMLSelectElement
    expect([...chon.options].map((o) => o.textContent)).toEqual(['Bài 8 · Amine · 164 câu', 'Bài 9 · Amino acid · 80 câu'])
  })
  it('hàng tải gọn: hai nút vừa "Tải PDF · N câu" và "Tải đề làm lại"; bỏ dòng chữ nhỏ giải thích', async () => {
    const { container } = moCdl([BAI8], [cau('A1', 'cd8', 'Amine bậc hai'), cau('A2', 'cd8', 'Amine bậc ba')])
    await screen.findByText('Amine bậc hai')
    const hang = container.querySelector('.h2-cdl-chan .h2-cdl-hang-pdf')!
    expect([...hang.querySelectorAll('button')].map((b) => b.textContent)).toEqual(['Tải PDF · 2 câu', 'Tải đề làm lại'])
    expect(container.textContent).not.toMatch(/tải thẳng về máy|Chạy trên điện thoại và máy tính/)
    expect(container.querySelector('.h2-cdl-nhac')).toBeNull()
    const css = doc('src/components/hoa2/cau-da-lam.css')
    expect(css).toMatch(/\.h2-cdl-hang-pdf \.h2-cdl-nut-chinh,\s*\.h2-cdl-hang-pdf \.h2-cdl-chi-de \{ min-height: 44px;/)
  })
})
