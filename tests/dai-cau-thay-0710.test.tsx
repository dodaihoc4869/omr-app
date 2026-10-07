// Ô GHI CHÚ DƯỚI SỐ CÂU ở ca "Kiểm chứng câu đã đúng" (thầy 07/10): nhãn gọn + nút nhỏ "Xem câu gốc" CÙNG ô, không chèn nút "Xem lại sau".
//   · câu THAY (DaiCauThay): dòng đậm ngắn + dòng phụ "nơi · ngày · mức", nút nhỏ nếu có `gocQid` + `layCauGoc`;
//   · câu em đã đúng giữ NGUYÊN VĂN: vẫn là ô cũ "Em đã làm đúng: …" của TheCau (không đổi, không nút) — chọn ô ở TheCau bằng `laNhanThay`;
//   · bấm nút: tải một lần, nhớ; mất mạng ⇒ nói thật + "Tải lại"; máy chủ không có câu ⇒ nói thật, em cứ làm câu thay;
//   · KHÔNG bao giờ hiện đáp án / lời giải của câu gốc (kể cả khi dữ liệu lỡ mang theo).
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import DaiCauThay from '../src/components/DaiCauThay'
import TheCau from '../src/components/TheCau'
import { nhanThay } from '../src/lib/rut-de-da-dung'
import type { CauGocCongKhai } from '../src/lib/cau-goc'

afterEach(() => cleanup())

const NOI = 'Ca Kiểm tra tuần 3 · 28/09 · Thông hiểu'
const NHAN_SO = nhanThay('thay_so', false, NOI)
const NHAN_LT = nhanThay('cung_dang', true, NOI)

const CAU_I: CauGocCongKhai = { qid: 'Q1', phan: 'I', text: 'Chất nào sau đây là este?', choices: ['HCOOCH₃', 'CH₃COOH', 'C₂H₅OH', 'CH₃CHO'] }
const CAU_II: CauGocCongKhai = { qid: 'Q2', phan: 'II', text: 'Cho các phát biểu về chất béo:', ideas: ['Là trieste của glixerol.', 'Không tan trong nước.', 'Chất béo lỏng chứa gốc axit béo no.', 'Thủy phân trong kiềm thuận nghịch.'] }
const CAU_III: CauGocCongKhai = { qid: 'Q3', phan: 'III', text: 'Đốt cháy 0,1 mol este đơn chức, thu 0,3 mol CO₂. Số nguyên tử cacbon là bao nhiêu?', table: [['Chất', 'M'], ['X', '60']] }

const the = (p: Partial<React.ComponentProps<typeof DaiCauThay>> = {}) => render(<DaiCauThay nhan={NHAN_SO} gocQid="Q1" layCauGoc={async () => CAU_I} {...p} />)
const nut = () => screen.queryByRole('button', { name: /câu gốc/i })
const cho = async () => { await act(async () => { await Promise.resolve() }) }

describe('nhãn gọn', () => {
  it('câu thay số: dòng đậm ngắn + dòng phụ nơi · ngày · mức (không lặp cả câu dài)', () => {
    const { container } = the()
    expect(container.querySelector('.thi-thay-loai')!.textContent).toBe('Thay số từ câu em đã đúng')
    expect(container.querySelector('.thi-thay-noi')!.textContent).toBe(NOI)
    expect(container.textContent).not.toContain('Câu này thay số của câu em đã đúng ở')
    expect(container.querySelector('[data-da-dung="1"]')!.getAttribute('data-thay')).toBe('thay_so')
  })

  it('câu lý thuyết thay: dòng riêng cho câu lý thuyết; không còn vế "(cùng dạng bài, nội dung khác)"', () => {
    const { container } = the({ nhan: NHAN_LT })
    expect(container.querySelector('.thi-thay-loai')!.textContent).toBe('Thay cho câu lý thuyết em đã đúng')
    expect(container.querySelector('.thi-thay-noi')!.textContent).toBe(NOI)
    expect(container.textContent).not.toContain('cùng dạng bài')
  })

  it('nhãn thay nhưng KHÔNG có qid câu gốc hoặc KHÔNG có hàm xin ⇒ vẫn nhãn gọn, không nút', () => {
    expect(the({ gocQid: undefined }).container.querySelector('.thi-thay-loai')).not.toBeNull()
    expect(nut()).toBeNull()
    cleanup()
    the({ layCauGoc: undefined })
    expect(nut()).toBeNull()
  })

  it('nhãn KHÔNG phải nhãn câu thay ⇒ DaiCauThay không vẽ gì (câu nguyên văn là việc của ô cũ ở TheCau)', () => {
    expect(the({ nhan: NOI }).container.innerHTML).toBe('')
    cleanup()
    expect(the({ nhan: 'Nơi lạ không có ngày' }).container.innerHTML).toBe('')
  })
})

describe('chọn ô ở thẻ câu (TheCau)', () => {
  const theCau = (daDungO: React.ComponentProps<typeof TheCau>['daDungO']) =>
    render(<TheCau cheDo="thi" phan="I" stt={3} text="Câu hỏi thử" choices={['1', '2', '3', '4']} choicePerm={[0, 1, 2, 3]} selected={null} onSelect={() => {}} daDungO={daDungO} />).container

  it('câu em đã đúng giữ NGUYÊN VĂN: ô cũ "Em đã làm đúng: …", KHÔNG nút xem câu gốc (dù có truyền hàm)', () => {
    const c = theCau({ nhan: NOI, gocQid: 'Q1', layCauGoc: async () => CAU_I })
    expect(c.querySelector('[data-da-dung="1"]')!.textContent).toBe(`Em đã làm đúng: ${NOI}`)
    expect(c.querySelector('[data-thay]')).toBeNull()
    expect(c.querySelector('button.thi-thay-nut')).toBeNull()
  })

  it('câu THAY: ô mới (nhãn gọn + nút) thay chỗ ô cũ — chỉ MỘT ô ghi chú mỗi thẻ', () => {
    const c = theCau({ nhan: NHAN_SO, gocQid: 'Q1', layCauGoc: async () => CAU_I })
    expect(c.querySelectorAll('[data-da-dung="1"]').length).toBe(1)
    expect(c.querySelector('[data-da-dung="1"]')!.getAttribute('data-thay')).toBe('thay_so')
    expect(c.querySelector('.thi-thay-loai')!.textContent).toBe('Thay số từ câu em đã đúng')
    expect(c.querySelector('button.thi-thay-nut')).not.toBeNull()
  })

  it('nhãn rỗng ⇒ không ô ghi chú nào', () => {
    expect(theCau({ nhan: '' }).querySelector('[data-da-dung="1"]')).toBeNull()
  })
})

describe('nút nhỏ "Xem câu gốc"', () => {
  it('cùng ô với ghi chú (một khối), cỡ nhỏ, đóng sẵn: aria-expanded=false, chưa gọi máy chủ', () => {
    const f = vi.fn(async () => CAU_I)
    const { container } = the({ layCauGoc: f })
    const n = nut()!
    expect(n.getAttribute('aria-expanded')).toBe('false')
    expect(n.textContent).toBe('Xem câu gốc')
    expect(container.querySelector('[data-da-dung="1"]')!.contains(n)).toBe(true) // cùng ô
    expect(container.querySelectorAll('[data-da-dung="1"]').length).toBe(1)
    expect(f).not.toHaveBeenCalled()
    expect(container.querySelector('.thi-thay-goc')).toBeNull()
  })

  it('bấm: hỏi ĐÚNG qid câu gốc, hiện "Đang tải…" rồi đề + 4 phương án A–D + chú thích "không tính điểm"; nút thành "Ẩn câu gốc"', async () => {
    let xong: (c: CauGocCongKhai) => void = () => {}
    const f = vi.fn(() => new Promise<CauGocCongKhai>((r) => { xong = r }))
    const { container } = the({ layCauGoc: f })
    fireEvent.click(nut()!)
    expect(f).toHaveBeenCalledTimes(1)
    expect(f).toHaveBeenCalledWith('Q1')
    expect(screen.getByText('Đang tải câu gốc…')).toBeTruthy()
    expect(nut()!.getAttribute('aria-expanded')).toBe('true')
    expect(nut()!.textContent).toBe('Ẩn câu gốc')
    await act(async () => { xong(CAU_I) })
    expect(screen.queryByText('Đang tải câu gốc…')).toBeNull()
    const vung = screen.getByRole('region', { name: 'Câu gốc em đã làm đúng' })
    expect(vung.textContent).toContain('Chất nào sau đây là este?')
    expect([...vung.querySelectorAll('.thi-thay-ma')].map((x) => x.textContent)).toEqual(['A', 'B', 'C', 'D'])
    expect(vung.textContent).toContain('HCOOCH₃')
    expect(vung.textContent).toContain('Chỉ để đối chiếu, không tính điểm.')
    expect(nut()!.getAttribute('aria-controls')).toBe(vung.id)
    expect(container.querySelector('[data-da-dung="1"]')!.contains(vung)).toBe(true)
  })

  it('bấm lần nữa: gập lại; mở lại KHÔNG hỏi máy chủ thêm (nhớ trong ô)', async () => {
    const f = vi.fn(async () => CAU_I)
    the({ layCauGoc: f })
    fireEvent.click(nut()!)
    await waitFor(() => expect(screen.getByRole('region')).toBeTruthy())
    fireEvent.click(nut()!)
    expect(screen.queryByRole('region')).toBeNull()
    expect(nut()!.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(nut()!)
    expect(screen.getByRole('region').textContent).toContain('Chất nào sau đây là este?')
    expect(f).toHaveBeenCalledTimes(1)
  })

  it('bấm hai lần liền khi đang tải: chỉ MỘT lượt hỏi', async () => {
    let xong: (c: CauGocCongKhai) => void = () => {}
    const f = vi.fn(() => new Promise<CauGocCongKhai>((r) => { xong = r }))
    the({ layCauGoc: f })
    fireEvent.click(nut()!) // mở, bắt đầu tải
    fireEvent.click(nut()!) // gập
    fireEvent.click(nut()!) // mở lại khi lượt đầu chưa xong
    expect(f).toHaveBeenCalledTimes(1)
    await act(async () => { xong(CAU_I) })
    expect(screen.getByRole('region').textContent).toContain('Chất nào sau đây là este?')
  })

  it('máy chủ trả lời "không có câu" (null) ⇒ nói thật, dặn em cứ làm câu bên dưới; mở lại không hỏi lại', async () => {
    const f = vi.fn(async () => null)
    the({ layCauGoc: f })
    fireEvent.click(nut()!)
    await waitFor(() => expect(screen.getByText(/Chưa có câu gốc để xem ở lúc này/)).toBeTruthy())
    expect(screen.getByText(/Em cứ làm câu bên dưới/)).toBeTruthy()
    fireEvent.click(nut()!)
    fireEvent.click(nut()!)
    expect(f).toHaveBeenCalledTimes(1)
  })

  it('không hỏi được (lỗi) ⇒ báo thật + nút "Tải lại"; bấm "Tải lại" hỏi lần hai và hiện câu', async () => {
    const f = vi.fn<(q: string) => Promise<CauGocCongKhai | null>>().mockRejectedValueOnce(new Error('mạng')).mockResolvedValueOnce(CAU_I)
    the({ layCauGoc: f })
    fireEvent.click(nut()!)
    const thu = await screen.findByRole('button', { name: 'Tải lại' })
    expect(screen.getByRole('alert').textContent).toContain('Chưa tải được câu gốc lúc này.')
    expect(screen.queryByText('Chất nào sau đây là este?')).toBeNull()
    fireEvent.click(thu)
    await waitFor(() => expect(screen.getByRole('region').textContent).toContain('Chất nào sau đây là este?'))
    expect(f).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('lỗi rồi gập/mở lại cũng hỏi lại (không nhớ lỗi)', async () => {
    const f = vi.fn<(q: string) => Promise<CauGocCongKhai | null>>().mockRejectedValueOnce(new Error('mạng')).mockResolvedValueOnce(CAU_I)
    the({ layCauGoc: f })
    fireEvent.click(nut()!)
    await screen.findByRole('alert')
    fireEvent.click(nut()!) // gập
    fireEvent.click(nut()!) // mở lại ⇒ hỏi lần hai
    await waitFor(() => expect(screen.getByRole('region').textContent).toContain('Chất nào sau đây là este?'))
    expect(f).toHaveBeenCalledTimes(2)
  })
})

describe('hiển thị câu gốc theo phần', () => {
  it('Phần II: bốn ý a) b) c) d)', async () => {
    the({ layCauGoc: async () => CAU_II })
    fireEvent.click(nut()!)
    const vung = await screen.findByRole('region')
    await waitFor(() => expect(vung.textContent).toContain('Cho các phát biểu về chất béo:'))
    expect([...vung.querySelectorAll('.thi-thay-ma')].map((x) => x.textContent)).toEqual(['a)', 'b)', 'c)', 'd)'])
    expect(vung.textContent).toContain('Thủy phân trong kiềm thuận nghịch.')
  })

  it('Phần III: đề + bảng số liệu, không có danh sách phương án', async () => {
    const { container } = the({ layCauGoc: async () => CAU_III })
    fireEvent.click(nut()!)
    await waitFor(() => expect(container.querySelector('.thi-thay-de')).not.toBeNull())
    expect(container.querySelector('.thi-thay-de')!.textContent).toContain('Số nguyên tử cacbon là bao nhiêu?')
    expect(container.querySelector('table')).not.toBeNull()
    expect(container.querySelector('.thi-thay-pa')).toBeNull()
  })

  it('đề là ảnh: hiện ảnh, ảnh phương án thay chữ; ảnh theo vị trí sau phương án', async () => {
    const cau: CauGocCongKhai = {
      qid: 'Q4', phan: 'I', text: '', thanCauImg: 'data:image/png;base64,DDDD', choices: ['', 'B2', '(xem hình phương án C)', 'D4'],
      choiceImgs: ['data:image/png;base64,AAAA', undefined, undefined, undefined],
      hinhAnh: [{ src: 'data:image/png;base64,CCCC', viTri: 'sau_pa_C' }, { src: 'data:image/png;base64,BBBB', viTri: 'sau_pa_B' }],
    }
    const { container } = the({ layCauGoc: async () => cau })
    fireEvent.click(nut()!)
    await waitFor(() => expect(container.querySelector('.thi-thay-pa')).not.toBeNull())
    const srcs = [...container.querySelectorAll('.thi-thay-goc img')].map((i) => i.getAttribute('src'))
    expect(srcs[0]).toBe('data:image/png;base64,DDDD') // đề là ảnh
    expect(srcs).toContain('data:image/png;base64,AAAA') // ảnh phương án A
    expect(srcs).toContain('data:image/png;base64,CCCC') // chữ giữ chỗ ⇒ ảnh vào trong ô C
    expect(srcs).toContain('data:image/png;base64,BBBB') // ảnh sau phương án B
    expect(container.textContent).not.toContain('(xem hình phương án C)')
  })
})

describe('KHÔNG BAO GIỜ hiện đáp án / lời giải của câu gốc', () => {
  it('dù dữ liệu lỡ mang theo `correct`, `solution`… ô vẫn không in ra', async () => {
    const lo = { ...CAU_I, correct: 'A', solution: 'LỜI GIẢI BÍ MẬT', dapAn: 'HCOOCH₃ là đáp án', loiGiai: 'XEM LỜI GIẢI' } as unknown as CauGocCongKhai
    const { container } = the({ layCauGoc: async () => lo })
    fireEvent.click(nut()!)
    await waitFor(() => expect(screen.getByRole('region').textContent).toContain('Chất nào sau đây là este?'))
    const chu = container.textContent ?? ''
    for (const bi of ['LỜI GIẢI BÍ MẬT', 'XEM LỜI GIẢI', 'đáp án', 'Đáp án']) expect(chu, bi).not.toContain(bi)
    expect(container.querySelector('[data-trang-thai="dung"]')).toBeNull()
    expect(container.querySelector('button[data-trang-thai]')).toBeNull() // không có ô chọn: câu gốc chỉ để ĐỌC
  })

  it('mã nguồn của ô không đọc `correct` / `solution` / `loiGiai` (chặn từ gốc, không chỉ che)', () => {
    const ma = fs.readFileSync(path.join(process.cwd(), 'src/components/DaiCauThay.tsx'), 'utf8')
    const kieu = fs.readFileSync(path.join(process.cwd(), 'src/lib/cau-goc.ts'), 'utf8')
    for (const t of ['.correct', '.solution', '.loiGiai', '.dapAn', 'explanation']) expect(ma, t).not.toContain(t)
    expect(kieu).not.toMatch(/correct\??:|solution\??:/)
  })
})

describe('nối vào màn thi (khoá bằng nguồn)', () => {
  const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
  it('màn thi: một hàm xin câu gốc BỀN (useCallback, deps rỗng) + bộ nhớ ref; chỉ câu THAY có gocQid', () => {
    const man = doc('src/screens/ExamTakeScreen.tsx')
    expect(man).toMatch(/const layCauGoc = useCallback<LayCauGoc>\(\(qidGoc\) => \{[\s\S]*?\}, \[\]\)/)
    expect(man).toContain('layCauGocQuaMayChu(scriptUrlRef.current.trim(), luot.maCa, luot.sbd, qidGoc)')
    expect(man).toContain('return gocQid ? { nhan, gocQid, layCauGoc } : { nhan }')
    expect(man).toContain('const gocQid = gocCuaCauThay(daDungNhan, qid)')
  })

  it('thẻ câu: DaiCauThay thay ô cũ; nhãn vẫn đi qua `daDungO.nhan`; `bangPropsBoQuaHam` không bị đổi', () => {
    const the = doc('src/components/TheCau.tsx')
    expect(the).toContain('<DaiCauThay nhan={props.daDungO.nhan} gocQid={props.daDungO.gocQid} layCauGoc={props.daDungO.layCauGoc} />')
    expect(the).toContain('(laNhanThay(props.daDungO.nhan)') // câu thay → ô mới; còn lại → ô cũ
    expect(the).toContain('<DaiDaDung nhan={props.daDungO.nhan} />')
    expect(the).toContain("style={{ padding: '6px var(--k5)', background: 'var(--the-2)', color: 'var(--nhat)', fontSize: 13, lineHeight: 1.5 }}") // ô cũ nguyên vẹn (cổng màu giữ nguyên)
  })

  it('điện thoại xoay ngang, câu CHIA ĐÔI (lam-bai-ngang.css): câu gốc có trần cao + cuộn riêng, nếu không ép thân câu còn ~33 px (đo bằng trình duyệt thật, có đối chứng)', () => {
    const css = doc('src/components/dai-cau-thay.css')
    expect(css).toMatch(/\.lb-gon-de\[data-chia\] \.thi-thay-goc \{[^}]*max-height: 38vh;[^}]*overflow-y: auto;/)
    expect(doc('src/screens/lam-bai-ngang.css')).toMatch(/\.lb-gon-de\[data-chia\] \.the-cau > \* \{ flex: none; \}/) // lý do cần trần: mọi khối ngoài thân thẻ là flex: none
  })

  it('nút "Xem lại sau" không còn thò xuống đè ô ghi chú: cao 36 px, vùng chạm 48 px bằng ::after', () => {
    const css = doc('src/screens/man-thi-m3.css')
    expect(css).toMatch(/\.m3 \.thi-cau-dau \{[^}]*min-height: 0; height: 36px/) // phải kèm min-height: 0, nếu không luật chung `.m3 button { min-height: 48px }` ép lại 48 px
    expect(doc('src/components/m3/m3.css')).toMatch(/\.m3 button,\s*\.m3 \[role='button'\] \{\s*min-height: 48px;/) // luật chung vẫn như cũ (việc này không đụng)
    expect(css).toMatch(/\.m3 \.thi-cau-dau::after \{ content: ''; position: absolute; inset: -6px -2px; \}/)
  })
})
