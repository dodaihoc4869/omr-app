// @vitest-environment jsdom
// CHẶNG NGANG v2 01/11 — thầy: «chặng xoay ngang trên điện thoại chưa được» + ảnh Galaxy Z Fold MỞ (chưa xoay, ~900×680) vẫn MỘT cột, nửa dưới trống;
// «Tối ưu cho máy gập khi mở cùng giao diện với xoay ngang nhé». Khoá:
//   (1) MỘT NGUỒN luật hai cột `haiCotLam` / `MQ_HAI_COT` (bo-cuc-lam.ts): rộng > cao từ 640, hoặc rộng ≥ 700 mà cao ≤ 1,3 × rộng — quét lưới 600–2000 ×
//       300–1200: không khe giữa các bậc; dọc (điện thoại, Fold gập, máy tính bảng dọc 768×1024) một cột như cũ;
//   (2) CSS (trong-chang-ngang.css, hoc-tap.css) và JS (`chonBoCucLam`, MQ_LAM_*) cùng nghĩa với nguồn ấy — bộ đọc @media nhỏ chạy trên lưới;
//   (3) bậc chiều cao rất thấp ≤ 380 (bàn phím số hai hàng đủ 14 phím theo đúng thứ tự) · thấp ≤ 500 · vừa / cao > 500 phủ kín vùng hai cột;
//   (4) câu mới «Học cách giải / Tự làm câu này»: gốc `data-chon-cach` ⇒ hai nút xếp dọc giữa cột phải; màn sửa câu (KhungDuoSua) dùng chung gốc `data-chang`.
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import ManLamBaiTap from '../src/components/hoc-tap/ManLamBaiTap'
import { goiHoa2 } from '../src/components/hoa2/api'
import { MQ_HAI_COT, bacCao, haiCotLam } from '../src/components/hoc-tap/bo-cuc-lam'
import { BanPhimSo, MQ_LAM_RONG, MQ_LAM_THAP, chonBoCucLam } from '../src/components/hoc-tap/LamCau'
import { MQ_CHANG_HAI_COT } from '../src/components/hoc-tap/ThanhCuon'
import { KhungDuoSua } from '../src/components/chua-cau-sai/KhungDuoSua'

vi.mock('../src/components/hoa2/api', async (goc) => ({ ...await goc<typeof import('../src/components/hoa2/api')>(), goiHoa2: vi.fn() }))
vi.mock('../src/components/hoa2/doc-luong-nop', async () => { const api = await import('../src/components/hoa2/api'); return { nopCauLuong: (token: string, du: Record<string, unknown>, giay: number) => api.goiHoa2('answer', token, du, giay) } })

const doc = (p: string) => readFileSync(p, 'utf8')
const boChu = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '')
const CSS = boChu(doc('src/styles/trong-chang-ngang.css'))

/** Bộ đọc @media tối giản (đủ cho các điều kiện dùng ở đây): mệnh đề ngăn bởi dấu phẩy (HOẶC), mỗi mệnh đề là các (đặc điểm) nối «and». */
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
/** Mọi điều kiện @media của một tờ CSS (đã bỏ chú thích). */
const cacMedia = (css: string) => [...css.matchAll(/@media ([^{]+)\{/g)].map((m) => m[1]!.trim())
const LUOI: [number, number][] = []
for (let w = 600; w <= 2000; w += 10) for (let h = 300; h <= 1200; h += 10) LUOI.push([w, h])

describe('luật hai cột — một nguồn, không khe', () => {
  it('máy thật: Fold mở (884×760, 904×690, 760×884), điện thoại ngang, máy tính bảng ngang, máy tính ⇒ hai cột; dọc / Fold gập / máy tính bảng dọc ⇒ một cột', () => {
    for (const [w, h] of [[884, 760], [904, 690], [760, 884], [900, 680], [740, 300], [780, 330], [800, 360], [915, 412], [640, 360], [740, 280], [960, 600], [1024, 700], [1180, 820], [1440, 900], [1920, 1080]] as const) expect(haiCotLam(w, h), `${w}×${h}`).toBe(true)
    for (const [w, h] of [[390, 844], [360, 800], [412, 915], [768, 1024], [820, 1180], [600, 360], [600, 900]] as const) expect(haiCotLam(w, h), `${w}×${h}`).toBe(false)
  })
  it('quét lưới 600–2000 × 300–1200: ngang từ 640 ⇒ LUÔN hai cột (mọi bậc chiều cao); điện thoại / máy tính bảng dọc (cao > 1,3 × rộng) ⇒ LUÔN một cột', () => {
    for (const [w, h] of LUOI) {
      if (w > h && w >= 640) expect(haiCotLam(w, h), `${w}×${h}`).toBe(true)
      if (h > 1.3 * w + 1e-9) expect(haiCotLam(w, h), `${w}×${h}`).toBe(false)
      if (w < 640) expect(haiCotLam(w, h), `${w}×${h}`).toBe(false)
    }
  })
  it('CSS cùng nghĩa: @media chính của trong-chang-ngang.css = MQ_HAI_COT = hằng của ThanhCuon, khớp `haiCotLam` ở mọi điểm lưới', () => {
    expect(cacMedia(CSS)[0]).toBe(MQ_HAI_COT)
    expect(MQ_CHANG_HAI_COT).toBe(MQ_HAI_COT)
    for (const [w, h] of LUOI) expect(khop(MQ_HAI_COT, w, h), `${w}×${h}`).toBe(haiCotLam(w, h))
  })
  it('mọi @media của trong-chang-ngang.css chỉ bật TRONG vùng hai cột (dọc không đổi); hai bậc thấp ≤ 500 | cao > 500 phủ kín vùng hai cột', () => {
    const ds = cacMedia(CSS)
    expect(ds.length).toBeGreaterThanOrEqual(6)
    const thap = ds.find((m) => m.endsWith('(max-height: 500px)'))!, cao = ds.find((m) => m.includes('(min-height: 501px)') && !m.includes('1100px'))!
    const ratThap = ds.find((m) => m.endsWith('(max-height: 380px)'))!
    expect([thap, cao, ratThap].every(Boolean)).toBe(true)
    for (const [w, h] of LUOI) {
      for (const m of ds) if (khop(m, w, h)) expect(haiCotLam(w, h), `${m} @ ${w}×${h}`).toBe(true)
      if (haiCotLam(w, h)) expect(khop(thap, w, h) !== khop(cao, w, h), `một bậc duy nhất @ ${w}×${h}`).toBe(true)
      expect(khop(ratThap, w, h)).toBe(haiCotLam(w, h) && h <= 380)
    }
    expect([200, 380, 381, 500, 501, 800, 801].map(bacCao)).toEqual(['rat-thap', 'rat-thap', 'thap', 'thap', 'vua', 'vua', 'cao'])
  })
  it('JS cùng nghĩa: chonBoCucLam = doc ngoài vùng hai cột · thap khi cao ≤ 560 · rong khi cao hơn; MQ_LAM_THAP / MQ_LAM_RONG khớp ở mọi điểm lưới; hoc-tap.css dùng đúng MQ_LAM_RONG', () => {
    for (const [w, h] of LUOI) {
      const b = chonBoCucLam(w, h)
      expect(b, `${w}×${h}`).toBe(!haiCotLam(w, h) ? 'doc' : h <= 560 ? 'thap' : 'rong')
      expect(khop(MQ_LAM_THAP, w, h), `thap ${w}×${h}`).toBe(b === 'thap')
      expect(khop(MQ_LAM_RONG, w, h), `rong ${w}×${h}`).toBe(b === 'rong')
    }
    const ht = boChu(doc('src/components/hoc-tap/hoc-tap.css')).replace(/\s+/g, ' ')
    const rong = `@media ${MQ_LAM_RONG.replace(/: /g, ':').replace(/, /g, ',')}{`
    expect(ht.split(rong).length - 1).toBe(2)
    expect(ht).not.toContain('@media(min-width:900px){')
  })
})

describe('bậc rất thấp: bàn phím số HAI hàng đủ 14 phím', () => {
  it('7 cột, thứ tự hiện 1 2 3 4 5 6 7 / 8 9 0 , − ⌫ Xoá hết (theo `order` của CSS trên thứ tự phím trong mã)', () => {
    const k = CSS.slice(CSS.indexOf('(max-height: 380px) {'))
    expect(k).toMatch(/\.ht2-lam-phim \{ grid-template-columns: repeat\(7, minmax\(0, 1fr\)\);/)
    const order = new Map([...k.matchAll(/\.ht2-lam-phim > :nth-child\((\d+)\) \{ order: (\d+); \}/g)].map((m) => [Number(m[1]), Number(m[2])]))
    const { container } = render(<BanPhimSo value="" onPhim={() => {}} khoa={false} soO={4} />)
    const phim = [...container.querySelectorAll('.ht2-lam-phim > button')].map((b, i) => ({ chu: b.getAttribute('aria-label') ?? b.textContent ?? '', o: order.get(i + 1) ?? i + 1, i }))
    expect(phim).toHaveLength(14)
    const hien = [...phim].sort((a, b) => a.o - b.o || a.i - b.i).map((p) => p.chu)
    expect(hien).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'Dấu phẩy', 'Dấu trừ', 'Xoá một kí tự', 'Xoá hết'])
    cleanup()
  })
})

describe('câu mới + sửa câu dùng chung bố cục', () => {
  beforeEach(() => { document.documentElement.dataset.trong = 'hs' })
  afterEach(() => { cleanup(); vi.mocked(goiHoa2).mockReset(); localStorage.clear(); delete document.documentElement.dataset.trong })
  const nen = { maDe: 'BAI8-AMINE', version: 'v1', group: 'g', hinhAnh: [], dang: null, tenDang: 'Muối của amine', mucDo: 'hieu', sao: 0, kienThuc: [], ideas: [], choices: [] }
  const MOI = { ...nen, qid: 'g1', phan: 'III' as const, text: 'Cho 4,65 gam aniline tác dụng vừa đủ với dung dịch HCl. Khối lượng muối là bao nhiêu gam?', vaiGoi7: 'moi', coGoi7: true, soO: 4 }

  it('câu mới chờ chọn cách làm ⇒ gốc data-chon-cach (CSS: hai nút xếp dọc giữa cột phải); bấm «Tự làm câu này» ⇒ bỏ dấu, hiện bàn phím', async () => {
    vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, id: 'p1', questions: [MOI] })
    const { container } = render(<ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} homNay={null} />)
    await screen.findByRole('button', { name: 'Tự làm câu này' })
    const goc = container.querySelector('.ht-app.duo')!
    expect(goc.hasAttribute('data-chon-cach')).toBe(true)
    expect(goc.getAttribute('data-phan')).toBe('III')
    expect(CSS).toMatch(/\[data-chon-cach\] > \.duo-day \{ grid-row: 3 \/ -1; align-self: center; \}/)
    expect(CSS).toMatch(/\[data-chon-cach\] > \.duo-day \.duo-hai \{ grid-template-columns: minmax\(0, 1fr\);/)
    const nut = screen.getByRole('button', { name: 'Tự làm câu này' }) as HTMLButtonElement
    await vi.waitFor(() => expect(nut.disabled).toBe(false), { timeout: 4000 }) // máy chạy test bận: chờ phiên mở xong (nút khoá khi đang gửi)
    fireEvent.click(nut)
    await vi.waitFor(() => expect(goc.hasAttribute('data-chon-cach')).toBe(false), { timeout: 4000 })
    expect(container.querySelector('.duo-cot-tra .ht2-lam-phim')).not.toBeNull()
    expect(container.querySelector('.duo-day')?.textContent).toBe('Kiểm tra')
  })
  it('màn sửa câu (KhungDuoSua): gốc data-chang + data-phan + data-ket (dải kết quả) ⇒ cùng hai cột cuộn riêng; màn xong chặng sửa không có data-ket', () => {
    const { container, rerender } = render(<KhungDuoSua onVe={() => {}} pct={50} nhanThanh="Chặng 2" phan="III" ket>{null}</KhungDuoSua>)
    const g = container.querySelector('.duo-sua')!
    expect(g.hasAttribute('data-chang')).toBe(true)
    expect(g.getAttribute('data-phan')).toBe('III')
    expect(g.hasAttribute('data-ket')).toBe(true)
    rerender(<KhungDuoSua onVe={() => {}} pct={100} nhanThanh="" xong ket>{null}</KhungDuoSua>)
    expect(container.querySelector('.duo-sua')!.hasAttribute('data-ket')).toBe(false)
    expect(container.querySelector('.duo-sua')!.hasAttribute('data-xong')).toBe(true)
  })
})

describe('Lộ trình xoay ngang / máy gập mở (trong-hs-ngang.css)', () => {
  const NG = boChu(doc('src/styles/trong-hs-ngang.css'))
  it('điện thoại ngang: cột tóm tắt GHIM khi cuộn, chặng đang học chừa chỗ bong bóng; máy gập mở: hai cột đường chặng | tóm tắt (chỉ trong vùng hai cột, rộng < 1000)', () => {
    expect(NG).toMatch(/@media \(max-height: 520px\) and \(min-width: 600px\) \{\s*:root\[data-trong='hs'\] \.ht2\[data-mot\] \.dm-ben \{ position: sticky; top: 12px; align-self: start; \}/)
    expect(NG).toMatch(/\.da-nut\[data-tt='dang'\] \{ scroll-margin-top: 104px; \}/)
    const m = cacMedia(NG).find((x) => x.includes('max-width: 999px'))!
    for (const [w, h] of LUOI) if (khop(m, w, h)) expect(haiCotLam(w, h) && w < 1000 && h > 520, `${w}×${h}`).toBe(true)
    expect(khop(m, 904, 690) && khop(m, 884, 760) && khop(m, 760, 884)).toBe(true)
  })
})
