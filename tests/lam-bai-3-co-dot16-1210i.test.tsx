// @vitest-environment jsdom
// LÀN B ĐỢT 16 (thầy 12/10: "Tối ưu cho dọc ngang máy tính tất cả các màn làm bài của học sinh phải siêu đẹp và thân thiện").
// Khoá: (1) chọn bố cục theo khổ màn — điện thoại dọc 390×844 · điện thoại xoay ngang 844×390 · máy tính 1440×900 — cho màn làm bài (ManLamBaiTap)
// và màn thi (ExamTakeScreen, `chonBoCuc`); (2) máy tính / xoay ngang: phần trả lời sang CỘT PHẢI cạnh nút Nộp, bản dọc giữ nguyên chỗ cũ;
// (3) CHỈ đổi chỗ đặt — lệnh gửi máy chủ y nguyên (answer · assisted · msLam); (4) CSS: luật mới nằm trong đúng điểm ngắt, không `:has()` lồng
// (trình duyệt bỏ cả luật), mọi bộ chọn màn ôn câu dưới `.lco`, không màu thô. Ảnh Chromium thật: scripts/chup-dot16-lan-b/chup.mjs.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import ManLamBaiTap from '../src/components/hoc-tap/ManLamBaiTap'
import { MQ_LAM_RONG, MQ_LAM_THAP, chonBoCucLam, traLoiCotPhai, useBoCucLam } from '../src/components/hoc-tap/LamCau'
import { chonBoCuc } from '../src/lib/lam-bai-ngang'
import { goiHoa2 } from '../src/components/hoa2/api'
vi.mock('../src/components/hoa2/api', async (goc) => ({ ...await goc<typeof import('../src/components/hoa2/api')>(), goiHoa2: vi.fn() }))

const goc = window.matchMedia
/** Giả `matchMedia` cho một khổ màn: hai truy vấn của màn làm bài (cùng điểm ngắt hoc-tap.css) + hướng máy. */
function datKhung(w: number, h: number) {
  window.matchMedia = ((q: string) => ({
    matches: q === MQ_LAM_THAP ? h <= 560 && w >= 640 : q === MQ_LAM_RONG ? w >= 900 : q.includes('landscape') ? w > h : false,
    media: q, onchange: null, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
  })) as typeof window.matchMedia
}
afterEach(() => { cleanup(); vi.mocked(goiHoa2).mockReset(); localStorage.clear(); window.matchMedia = goc })

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const nen = { maDe: 'de-8', version: 'v1', group: 'g', hinhAnh: [], dang: null, tenDang: 'Bậc của amine', mucDo: 'hieu', sao: 0, kienThuc: [] }
const TN = { ...nen, qid: 'tn1', phan: 'I' as const, text: 'Chất nào sau đây là amine bậc hai?', choices: ['CH3NH2', '(CH3)2NH', '(CH3)3N', 'C6H5NH2'], ideas: [] }
const DS = { ...nen, qid: 'ds1', phan: 'II' as const, text: 'Xét dãy hydroxide chu kì 2.', choices: [], ideas: ['Tính base giảm dần.', 'Tính acid tăng dần.', 'HNO3 acid mạnh nhất.', 'H3BO3 mạnh hơn H2CO3.'] }
const moMan = (cau: object[]) => {
  vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, id: 'p1', questions: cau })
  return render(<ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} homNay={{ daLam: 6, muc: 24, chang: 2, soChang: 4 }} />)
}
const cotPhai = () => screen.getByRole('region', { name: 'Thao tác câu' })

describe('chọn bố cục theo khổ màn', () => {
  it('màn làm bài: dọc 390×844 · xoay ngang 844×390 (và 640×360) · máy tính 1440×900 / máy tính bảng ngang 1024×768; máy tính bảng dọc giữ dọc', () => {
    expect(chonBoCucLam(390, 844)).toBe('doc')
    expect(chonBoCucLam(768, 1024)).toBe('doc')
    expect(chonBoCucLam(600, 360)).toBe('doc') // quá hẹp để chia hai cột
    expect(chonBoCucLam(844, 390)).toBe('thap')
    expect(chonBoCucLam(640, 360)).toBe('thap')
    expect(chonBoCucLam(1440, 500)).toBe('thap') // cửa sổ máy tính thấp: cùng luật CSS (điểm ngắt thấp thắng)
    expect(chonBoCucLam(1440, 900)).toBe('rong')
    expect(chonBoCucLam(1024, 768)).toBe('rong')
  })
  it('chỗ đặt phần trả lời: máy tính mọi loại câu; xoay ngang chỉ trắc nghiệm; dọc không bao giờ', () => {
    expect(['I', 'II', 'III'].map((p) => traLoiCotPhai('rong', p))).toEqual([true, true, true])
    expect(['I', 'II', 'III'].map((p) => traLoiCotPhai('thap', p))).toEqual([true, false, false])
    expect(['I', 'II', 'III'].map((p) => traLoiCotPhai('doc', p))).toEqual([false, false, false])
  })
  it('hook: không có matchMedia (jsdom, máy chủ) ⇒ dọc; có ⇒ theo khổ màn', () => {
    // jsdom không có matchMedia
    // @ts-expect-error — xoá có chủ ý để giả trình duyệt thiếu API
    window.matchMedia = undefined
    expect(renderHook(() => useBoCucLam()).result.current).toBe('doc')
    datKhung(844, 390)
    expect(renderHook(() => useBoCucLam()).result.current).toBe('thap')
    datKhung(1440, 900)
    expect(renderHook(() => useBoCucLam()).result.current).toBe('rong')
  })
  it('màn thi (ExamTakeScreen): dọc giữ bản cũ · điện thoại xoay ngang ⇒ ngang gọn · máy tính ⇒ ngang đủ', () => {
    expect(chonBoCuc(390, 844, false)).toBe('doc')
    expect(chonBoCuc(844, 390, true)).toBe('ngang-gon')
    expect(chonBoCuc(1440, 900, true)).toBe('ngang')
  })
})

describe('ManLamBaiTap theo khổ màn (chỉ đổi chỗ đặt)', () => {
  it('dọc: phương án nằm dưới đề trong vùng nội dung, cột thao tác chỉ có nút — như bản thầy duyệt 12/10', async () => {
    moMan([TN])
    await screen.findByText(TN.text)
    expect(within(screen.getByRole('main')).getAllByRole('radio')).toHaveLength(4)
    expect(within(cotPhai()).queryAllByRole('radio')).toHaveLength(0)
    expect(cotPhai().hasAttribute('data-tra-loi')).toBe(false)
  })
  it('máy tính 1440×900: phương án + ghi chú sang cột phải ngay trên nút Nộp; nộp gửi y nguyên lệnh cũ; dải kết quả đứng đầu cột phải', async () => {
    datKhung(1440, 900)
    const { container } = moMan([TN])
    await screen.findByText(TN.text)
    const phai = cotPhai()
    expect(phai.getAttribute('data-tra-loi')).toBe('I')
    expect(container.querySelector('.ht2-lam-khung')?.getAttribute('data-tra-loi')).toBe('I')
    expect(within(screen.getByRole('main')).queryAllByRole('radio')).toHaveLength(0)
    fireEvent.click(within(phai).getAllByRole('radio')[1])
    // thứ tự trong cột phải: khối trả lời → nút chính
    const nut = within(phai).getByRole('button', { name: /Nộp câu · đã chọn B/ })
    expect(phai.querySelector('.ht2-lam-cot-tra-loi')!.compareDocumentPosition(nut) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    vi.mocked(goiHoa2).mockResolvedValueOnce({ correct: false, answer: 'A', solution: { chot: 'Amine bậc hai: N liên kết hai gốc hydrocarbon.' } })
    fireEvent.click(nut)
    await within(phai).findByText(/Chưa đúng · đáp án A/)
    const [lenh, , duLieu] = vi.mocked(goiHoa2).mock.calls[1]!
    expect(lenh).toBe('answer')
    expect(duLieu).toMatchObject({ session: 'p1', qid: 'tn1', answer: 'B', assisted: false })
    expect(typeof (duLieu as { msLam: unknown }).msLam).toBe('number')
    expect(container.querySelector('.ht2-lam-khung')?.hasAttribute('data-ket')).toBe(true)
    // lời giải vẫn ở cột đề (bên trái)
    expect(within(screen.getByRole('main')).getByText(/N liên kết hai gốc/)).toBeTruthy()
    await waitFor(() => expect(within(phai).getByRole('button', { name: /Kết thúc chặng/ })).toBeTruthy())
    // xong chặng: màn tổng kết giữ bố cục cũ — cột phải chỉ còn nút, không kéo theo phản hồi câu cuối
    fireEvent.click(within(phai).getByRole('button', { name: /Kết thúc chặng/ }))
    await screen.findByRole('heading', { name: 'Đã lưu chặng 2' })
    expect(container.querySelector('.ht2-lam-khung')?.hasAttribute('data-tra-loi')).toBe(false)
    expect(within(cotPhai()).queryAllByRole('radio')).toHaveLength(0)
    expect(within(cotPhai()).getByRole('button', { name: /Học tiếp chặng 3/ })).toBeTruthy()
  })
  it('điện thoại xoay ngang 844×390: trắc nghiệm sang phải; đúng–sai giữ dưới đề (4 ý cao hơn màn thấp)', async () => {
    datKhung(844, 390)
    moMan([DS, TN])
    await screen.findByText(DS.text)
    expect(cotPhai().hasAttribute('data-tra-loi')).toBe(false)
    expect(within(screen.getByRole('main')).getByRole('group', { name: 'Chọn cho ý d' })).toBeTruthy()
  })
})

describe('CSS bố cục ba khổ', () => {
  const bo = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '')
  it('hoc-tap.css: luật `data-tra-loi` chỉ trong điểm ngắt máy tính / xoay ngang (bản dọc không đổi); không màu thô', () => {
    const css = bo(doc('src/components/hoc-tap/hoc-tap.css'))
    const i = css.indexOf('.ht2-lam-khung[data-tra-loi]')
    expect(i).toBeGreaterThan(0)
    // 01/11 (máy gập mở): điểm ngắt «rộng» = luật hai cột chung bo-cuc-lam.ts (MQ_LAM_RONG), không còn ≥ 900 px
    const RONG = '@media (orientation:landscape) and (min-width:640px) and (min-height:561px),(min-width:700px) and (min-aspect-ratio:10/13) and (min-height:561px)'
    expect(MQ_LAM_RONG.replace(/: /g, ':').replace(/, /g, ',')).toBe(RONG.slice(7))
    expect(css.lastIndexOf(RONG, i)).toBeGreaterThan(0)
    const khoi = css.slice(css.lastIndexOf(RONG, i))
    expect(khoi).toContain('@media(max-height:560px) and (min-width:640px){\n  .ht2-lam-khung[data-tra-loi]')
    expect(khoi.slice(0, 2600)).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\brgba?\(/)
  })
  it('luyện đề + ôn câu: không `:has()` lồng trong `:has()` (trình duyệt bỏ cả luật); ôn câu mọi bộ chọn dưới `.lco`', () => {
    for (const p of ['src/components/m3/luyen-khac-phuc.css', 'src/components/bang-nhiem-vu/lam-cau-on.css']) {
      const css = bo(doc(p))
      for (const m of css.matchAll(/:has\(/g)) {
        let sau = 1, j = m.index! + 5
        for (; j < css.length && sau > 0; j++) sau += css[j] === '(' ? 1 : css[j] === ')' ? -1 : 0
        expect(css.slice(m.index! + 5, j), p).not.toContain(':has(')
      }
      expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    }
    const lco = bo(doc('src/components/bang-nhiem-vu/lam-cau-on.css'))
    expect(lco).toMatch(/@media \(min-width: 900px\), \(orientation: landscape\) and \(min-width: 640px\) \{\s*\.lco \{ max-width: 1080px; \}/)
    expect(lco).toMatch(/\.lco-the > \.lco-nhom \{ grid-column: 2; grid-row: 2; \}/)
    expect(doc('src/components/LuyenDeChuan.tsx')).toContain('m3 m3-man-lam ldc-lam fixed inset-0')
  })
  it('đích chạm: ô nhảy câu Luyện đề cấu trúc ≥ 44 px trên màn chạm dọc; Câu đã làm xoay ngang bù tỉ lệ thu', () => {
    expect(bo(doc('src/components/tu-luyen/luyen-de-cau-truc.css'))).toMatch(/@media \(pointer: coarse\) and \(orientation: portrait\) \{\s*\.ldct-dh-o \{\s*width: 44px;\s*height: 44px;/)
    expect(doc('src/components/hoa2/cau-da-lam.css')).toContain("min-height: calc(44px / var(--h2-ti-le, 1));")
  })
})
