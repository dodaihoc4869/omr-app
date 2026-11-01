// @vitest-environment jsdom
// KIỂM TRA ÔN TẬP NGANG 02/11 (thầy: «Kiểm tra ôn tập cũng tối ưu xoay ngang, máy tính và Z Fold nhé»). Khoá:
//   (1) mọi @media mới / đổi của Kiểm tra ôn tập (trong-lam-bai.css mục 8, kiem-tra-ca-nhan.css) chỉ bật trong vùng HAI CỘT của luật chung `haiCotLam`
//       (bo-cuc-lam.ts) và khối hai cột chính trùng đúng luật ấy — quét lưới 600–2000 × 300–1200 ⇒ ngang / máy gập hai cột, dọc một cột như cũ;
//   (2) màn đang làm (Duo) gắn gốc `data-chang` + `data-phan` (dùng chung bố cục hai cột cuộn riêng của màn làm chặng) + lớp phủ thanh cuộn sau từng cột;
//   (3) trang bài + kết quả: gốc `data-mot-man` (một màn, hai cột cuộn riêng); các chặng + Nộp toàn bài bọc `.ktcn-cot-chang` (dọc: display: contents);
//   (4) chỉ bố cục: lệnh máy chủ, nút, chữ giữ nguyên.
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import ManKiemTra from '../src/components/hoc-tap/ManKiemTraCaNhan'
import { MQ_HAI_COT, haiCotLam } from '../src/components/hoc-tap/bo-cuc-lam'
import type { TomTatKiemTra } from '../src/lib/kiem-tra-ca-nhan'

const api = vi.hoisted(() => vi.fn())
vi.mock('../src/components/hoa2/api', async (goc) => ({ ...await goc<typeof import('../src/components/hoa2/api')>(), goiHoa2: api }))

const doc = (p: string) => readFileSync(p, 'utf8')
const boChu = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '')
/** Bộ đọc @media tối giản (như tests/chang-ngang-2-0111): mệnh đề ngăn bởi dấu phẩy, đặc điểm nối «and»; chấp nhận cả kiểu viết liền «a:b». */
function khop(mq: string, w: number, h: number): boolean {
  return mq.split(',').some((menhDe) => [...menhDe.matchAll(/\(([^)]+)\)/g)].every(([, dk]) => {
    const [ten, giaTri] = dk!.split(':').map((x) => x.trim())
    const so = parseFloat(giaTri ?? '')
    switch (ten) {
      case 'orientation': return giaTri === 'landscape' ? w > h : h >= w
      case 'min-width': return w >= so
      case 'max-width': return w <= so
      case 'min-height': return h >= so
      case 'max-height': return h <= so
      case 'min-aspect-ratio': { const [a, b] = giaTri!.split('/').map(Number); return w * b! >= h * a! }
      default: throw new Error(`chưa đọc được (${dk})`)
    }
  }))
}
const LUOI: [number, number][] = []
for (let w = 600; w <= 2000; w += 20) for (let h = 300; h <= 1200; h += 20) LUOI.push([w, h])
const chuan = (m: string) => m.replace(/\s+/g, ' ').replace(/: /g, ':').replace(/ ?, ?/g, ',').trim()

describe('luật hai cột chung cho Kiểm tra ôn tập', () => {
  const rawTlb = doc('src/styles/trong-lam-bai.css'), rawKt = doc('src/components/hoc-tap/kiem-tra-ca-nhan.css')
  // mục 8 của trong-lam-bai.css (Kiểm tra ôn tập) + khối mới cuối kiem-tra-ca-nhan.css
  const TLB8 = boChu(rawTlb.slice(rawTlb.indexOf('── 8. KIỂM TRA ÔN TẬP'), rawTlb.indexOf('── 9. LÀM CHẶNG KIỂU DUOLINGO')))
  const KTN = boChu(rawKt.slice(rawKt.indexOf('── KTCN NGANG 02/11')))
  const cacMedia = (css: string) => [...css.matchAll(/@media ([^{]+)\{/g)].map((m) => m[1]!.trim())
  // luật cũ của điện thoại ngang thấp / máy hẹp trong mục 8 (không đổi trong lượt này): không thuộc vùng xét
  const CU = [/^\(orientation: landscape\) and \(max-height: 500px\)$/, /^\(max-width: 380px\)$/]
  it('trang bài + kết quả: khối hai cột chính = MQ_HAI_COT (không còn «≥ 1100 hoặc ngang thấp từ 700»); một màn hai cột cuộn riêng', () => {
    expect(TLB8.length).toBeGreaterThan(500)
    expect(KTN.length).toBeGreaterThan(100)
    const hai = chuan(MQ_HAI_COT)
    expect(cacMedia(TLB8).map(chuan)).toContain(hai)
    expect(cacMedia(KTN).map(chuan)).toContain(hai)
    expect(TLB8).not.toContain('(min-width: 1100px), (orientation: landscape) and (max-height: 500px) and (min-width: 700px)')
    expect(TLB8).toMatch(/\[data-trong\] \.ht-app\.ktcn-man\[data-mot-man\] \{ display: flex; flex-direction: column; height: 100dvh;/)
    expect(TLB8).toMatch(/\.ktcn-cot-chang \{ grid-column: 2; display: flex; flex-direction: column;/)
    expect(boChu(rawKt)).toContain('.ktcn-cot-chang{display:contents}')
  })
  it('quét lưới: mọi @media mới / đổi của Kiểm tra ôn tập chỉ bật trong vùng hai cột; máy gập / ngang / máy tính bật, dọc / Fold gập / máy tính bảng dọc không', () => {
    const ds = [...cacMedia(TLB8), ...cacMedia(KTN)].filter((m) => !CU.some((r) => r.test(m)))
    expect(ds.length).toBeGreaterThanOrEqual(5)
    for (const m of ds) for (const [w, h] of LUOI) if (khop(m, w, h)) expect(haiCotLam(w, h), `${m} @ ${w}×${h}`).toBe(true)
    for (const [w, h] of [[904, 690], [884, 760], [760, 884], [844, 390], [740, 300], [915, 412], [1180, 820], [1440, 900], [1920, 1080]] as const) expect(khop(MQ_HAI_COT, w, h), `${w}×${h}`).toBe(true)
    for (const [w, h] of [[390, 844], [360, 800], [768, 1024]] as const) expect(khop(MQ_HAI_COT, w, h), `${w}×${h}`).toBe(false)
  })
})

describe('màn Kiểm tra ôn tập gắn gốc bố cục', () => {
  const now = Date.parse('2026-11-02T02:00:00Z')
  const kt: TomTatKiemTra = { id: 'kt-S1', ngay: '2026-11-02', moLuc: Date.parse('2026-11-01T17:00:00Z'), hanLuc: Date.parse('2026-11-02T17:00:00Z'), serverNow: now, trangThai: 'can_lam', homNay: true,
    tong: 2, daTra: 0, con: 2, soChang: 1, phut: 10, soBai: 1, tongKienThuc: 2, phuDe: 2, nguonDayDu: true, lyDo: '', thieuNguon: 0, diem: null, nopLuc: null } as unknown as TomTatKiemTra
  const nen = { maDe: 'd', version: 'v1', group: 'g', hinhAnh: [], dang: null, tenDang: 'Ester', mucDo: 'hieu', sao: 0, kienThuc: [], ideas: [] }
  const cau = [{ ...nen, qid: 'q1', phan: 'I', text: 'Câu kiểm chứng thứ nhất', choices: ['A1', 'B2', 'C3', 'D4'] }, { ...nen, qid: 'q2', phan: 'III', text: 'Câu kiểm chứng thứ hai', choices: [], soO: 4 }]
  beforeEach(() => { document.documentElement.dataset.trong = 'hs' })
  afterEach(() => { cleanup(); api.mockReset(); localStorage.clear(); delete document.documentElement.dataset.trong })

  it('trang bài: gốc data-mot-man; các chặng + Nộp toàn bài trong .ktcn-cot-chang; đang làm (Duo): gốc data-chang + data-phan, lớp phủ thanh cuộn sau từng cột', async () => {
    api.mockImplementation(async (a: string) => a === 'hoc-tap-ktcn-trang-thai' ? { ok: true, kiemTra: kt, chang: [{ stt: 0, soCau: 2, giay: 600, han: null, daChot: false }] }
      : a === 'hoc-tap-ktcn-start' ? { ok: true, kiemTra: kt, revision: 0, hanChang: Date.now() + 600_000, daChot: false, questions: cau, tra: {} } : { ok: true, kiemTra: kt, revision: 1, daLuu: true })
    const { container } = render(<ManKiemTra token="tk" sbd="S1" id="kt-S1" onVe={() => {}} onCapNhat={() => {}} />)
    const nut = await screen.findByRole('button', { name: /Làm chặng 1/ })
    const goc = container.querySelector('.ktcn-man')!
    expect(goc.hasAttribute('data-mot-man')).toBe(true)
    const cot = container.querySelector('.ktcn-khung > .ktcn-cot-chang')!
    expect(cot.querySelector(':scope > .ktcn-chang')).not.toBeNull()
    expect(cot.querySelector(':scope > .ktcn-nop')).not.toBeNull()
    fireEvent.click(nut)
    await screen.findByText('Câu kiểm chứng thứ nhất')
    const duo = container.querySelector('.ht-app.duo.duo-kt')!
    expect(duo.hasAttribute('data-chang')).toBe(true)
    expect(duo.getAttribute('data-phan')).toBe('I')
    expect(container.querySelector('.duo-cot-de')!.nextElementSibling?.matches('.duo-cuon[data-cot="de"]')).toBe(true)
    expect(container.querySelector('.duo-cot-tra')!.nextElementSibling?.matches('.duo-cuon[data-cot="tra"]')).toBe(true)
    // chỉ bố cục: lệnh máy chủ y như cũ (trạng thái → mở chặng)
    expect(api.mock.calls.map((c) => c[0]).slice(0, 2)).toEqual(['hoc-tap-ktcn-trang-thai', 'hoc-tap-ktcn-start'])
  })
})
