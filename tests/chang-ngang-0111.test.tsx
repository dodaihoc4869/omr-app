// @vitest-environment jsdom
// CHẶNG NGANG 01/11 (thầy: «Phần chặng của học sinh tối ưu thêm cho màn xoay ngang và máy tính cho đẹp mắt bố cục khoa học nhé, đề dài nhớ có thanh cuộn»).
// Khoá: (1) thanh cuộn vẽ tay — con trượt tỉ lệ khung / nội dung, tối thiểu 28px, tới đáy thì hết «còn nữa»; (2) tờ styles/trong-chang-ngang.css CHỈ
// đụng màn làm chặng (gốc `data-chang`) — màn thi / kiểm tra / sửa câu dùng chung lớp .duo không đổi; ngoài @media ngang / máy tính không có luật nào
// (điện thoại dọc giữ nguyên); chỉ biến màu sẵn có; (3) màn làm chặng gắn gốc + lớp phủ thanh cuộn ngay sau từng cột; (4) bố cục: một màn không cuộn
// trang, cột đề + cột trả lời cuộn riêng, «Kiểm tra» ngay dưới cột phải, dải kết quả điện thoại ngang là hàng đáy riêng (không phủ đề).
// Ảnh trước / sau: docs/chang-ngang-0111/.
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import ManLamBaiTap from '../src/components/hoc-tap/ManLamBaiTap'
import { goiHoa2 } from '../src/components/hoa2/api'
import { CON_TRUOT_MIN, MQ_CHANG_HAI_COT, ganThanhCuon, tinhThanhCuon } from '../src/components/hoc-tap/ThanhCuon'

vi.mock('../src/components/hoa2/api', async (goc) => ({ ...await goc<typeof import('../src/components/hoa2/api')>(), goiHoa2: vi.fn() }))
vi.mock('../src/components/hoa2/doc-luong-nop', async () => { const api = await import('../src/components/hoa2/api'); return { nopCauLuong: (token: string, du: Record<string, unknown>, giay: number) => api.goiHoa2('answer', token, du, giay) } })

const doc = (p: string) => readFileSync(p, 'utf8')
const CSS = doc('src/styles/trong-chang-ngang.css')
/** Bỏ chú thích CSS. */
const boChu = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '')
/** Tách danh sách bộ chọn theo dấu phẩy NGOÀI ngoặc (giữ nguyên `:is(a, b)`). */
const tachPhay = (s: string) => { const ra: string[] = []; let sau = 0, dau = 0; for (let i = 0; i < s.length; i++) { if (s[i] === '(') sau++; else if (s[i] === ')') sau--; else if (s[i] === ',' && !sau) { ra.push(s.slice(dau, i).trim()); dau = i + 1 } } ra.push(s.slice(dau).trim()); return ra.filter(Boolean) }
/** Mọi bộ chọn của luật kiểu (không phải @media / @container / @keyframes), kèm cờ «nằm trong @media». */
function boChon(css: string): { chon: string; trongMedia: boolean }[] {
  const s = boChu(css), ra: { chon: string; trongMedia: boolean }[] = []
  let sau = 0, media = 0, dau = 0
  const ngan: string[] = []
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (c === '{') {
      const dauKhoi = s.slice(dau, i).trim()
      if (dauKhoi.startsWith('@')) { ngan.push(dauKhoi); if (dauKhoi.startsWith('@media')) media++ }
      else { ngan.push(''); ra.push({ chon: dauKhoi, trongMedia: media > 0 }) }
      sau++; dau = i + 1
    } else if (c === '}') {
      const ra1 = ngan.pop()
      if (ra1?.startsWith('@media')) media--
      sau--; dau = i + 1
    } else if (c === ';' && ngan[ngan.length - 1] === '') dau = i + 1
  }
  return ra
}

describe('thanh cuộn vẽ tay — tinhThanhCuon (thuần)', () => {
  it('nội dung vừa khung (dư ≤ 2px) ⇒ không thanh, không «còn nữa»', () => {
    expect(tinhThanhCuon(0, 300, 300)).toEqual({ co: false, con: false, dai: 0, dau: 0 })
    expect(tinhThanhCuon(0, 302, 300)).toMatchObject({ co: false })
    expect(tinhThanhCuon(0, 900, 0)).toMatchObject({ co: false })
  })
  it('con trượt tỉ lệ khung / nội dung; đầu cột ⇒ vị trí 0 + còn nữa; cuộn hết ⇒ chạm đáy rãnh + hết «còn nữa»', () => {
    const dau = tinhThanhCuon(0, 1200, 400, 400)
    expect(dau).toEqual({ co: true, con: true, dai: 133, dau: 0 })
    const giua = tinhThanhCuon(400, 1200, 400, 400)
    expect(giua.dau).toBe(Math.round((400 - 133) * 0.5))
    const het = tinhThanhCuon(800, 1200, 400, 400)
    expect(het).toMatchObject({ con: false, dau: 400 - 133 })
    expect(tinhThanhCuon(9999, 1200, 400, 400).dau).toBe(400 - 133) // cuộn quá đà (iOS) không vượt rãnh
  })
  it('đề rất dài ⇒ con trượt không ngắn hơn mức tối thiểu (vẫn thấy rõ), không dài hơn rãnh', () => {
    expect(tinhThanhCuon(0, 40000, 300, 288).dai).toBe(CON_TRUOT_MIN)
    expect(tinhThanhCuon(0, 40, 30, 20).dai).toBe(20)
  })
  it('ganThanhCuon: cột cuộn được ⇒ bật data-co + data-con, đặt chiều dài / vị trí con trượt; cuộn hết ⇒ bỏ data-con; gỡ sạch', () => {
    const rafCu = globalThis.requestAnimationFrame
    globalThis.requestAnimationFrame = ((f: FrameRequestCallback) => { f(0); return 0 }) as typeof requestAnimationFrame // chạy ngay (trả 0 ⇒ lượt xin sau không bị chặn)
    const mmCu = window.matchMedia
    window.matchMedia = ((q: string) => ({ matches: q === MQ_CHANG_HAI_COT, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia
    try {
      const cot = document.createElement('div'), phu = document.createElement('span'), truot = document.createElement('i')
      phu.append(truot)
      let top = 0
      Object.defineProperties(cot, { scrollHeight: { get: () => 1000 }, clientHeight: { get: () => 400 }, scrollTop: { get: () => top, set: (v: number) => { top = v } } })
      Object.defineProperty(phu, 'clientHeight', { get: () => 412 })
      const go = ganThanhCuon(cot, phu)
      expect(phu.hasAttribute('data-co')).toBe(true)
      expect(phu.hasAttribute('data-con')).toBe(true)
      expect(truot.style.height).toBe('160px')
      expect(truot.style.transform).toBe('translateY(0px)')
      top = 600; cot.dispatchEvent(new Event('scroll'))
      expect(phu.hasAttribute('data-con')).toBe(false)
      expect(truot.style.transform).toBe('translateY(240px)')
      go()
      top = 0; cot.dispatchEvent(new Event('scroll'))
      expect(phu.hasAttribute('data-con')).toBe(false) // đã gỡ: không còn nghe cuộn
    } finally { globalThis.requestAnimationFrame = rafCu; window.matchMedia = mmCu }
  })
})

describe('tờ trong-chang-ngang.css — chỉ màn làm chặng, chỉ ngang / máy tính, chỉ biến màu sẵn có', () => {
  const ds = boChon(CSS)
  it('nạp qua @import ngay sau trong-lam-ngang.css trong trong-lam-bai.css', () => {
    const goc = doc('src/styles/trong-lam-bai.css')
    expect(goc.indexOf("@import './trong-chang-ngang.css';")).toBeGreaterThan(goc.indexOf("@import './trong-lam-ngang.css';"))
  })
  it('mọi bộ chọn (trừ luật ẩn lớp phủ mặc định) đều có gốc riêng `[data-chang]` ⇒ màn thi / kiểm tra cá nhân / sửa câu không đổi', () => {
    expect(ds.length).toBeGreaterThan(40)
    const ngoai = ds.flatMap((r) => tachPhay(r.chon)).filter((x) => !x.includes('[data-chang]'))
    expect(ngoai).toEqual([':root[data-trong] .duo-cuon'])
  })
  it('ngoài @media ngang / máy tính chỉ có luật ẩn lớp phủ ⇒ điện thoại dọc giữ nguyên; điều kiện @media khớp hằng của ThanhCuon', () => {
    expect(ds.filter((r) => !r.trongMedia).map((r) => r.chon)).toEqual([':root[data-trong] .duo-cuon'])
    expect(boChu(CSS)).toContain(`@media ${MQ_CHANG_HAI_COT} {`)
    for (const m of boChu(CSS).match(/@media[^{]+/g) ?? []) expect(m).toMatch(/orientation: landscape\) and \(max-height: 500px\)|min-width: 1000px\) and \(min-height: 501px\)|min-width: 1700px\) and \(min-height: 900px\)/)
  })
  it('màu: không mã thô, chỉ biến --tr-* (và biến bố cục --cn-* / --gyc-cot-phai)', () => {
    const s = boChu(CSS)
    expect(s).not.toMatch(/#[0-9a-f]{3,8}\b/i)
    expect(s).not.toMatch(/\brgba?\(|\bhsla?\(/i)
    const bien = new Set([...s.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]!))
    for (const b of bien) expect(b).toMatch(/^--(tr-|cn-|gyc-cot-phai$)/)
  })
  it('bố cục: một màn không cuộn trang; cột đề + cột trả lời cuộn riêng (thanh trình duyệt ẩn, thay bằng thanh vẽ tay); «Kiểm tra» ngay dưới cột phải', () => {
    const s = boChu(CSS)
    expect(s).toMatch(/\.duo\[data-chang\]\[data-duo\]:not\(\[data-xong\]\) \{[^}]*display: grid; height: 100dvh;[^}]*overflow: hidden;[^}]*grid-template-rows: auto auto minmax\(0, max-content\) auto minmax\(0, 1fr\);/)
    expect(s).toMatch(/\.duo-cot-de \{[^}]*grid-column: 1; grid-row: 2 \/ -1;[^}]*overflow-y: auto;[^}]*scrollbar-width: none;/)
    expect(s).toMatch(/\.duo-cot-tra \{[^}]*grid-column: 2; grid-row: 3;[^}]*overflow-y: auto;/)
    expect(s).toMatch(/> \.duo-day \{[^}]*grid-column: 2; grid-row: 4; position: relative;/)
    // thanh vẽ tay: rãnh + con trượt luôn thấy khi cột dài (data-co), bóng mờ đáy khi còn nội dung (data-con)
    expect(s).toMatch(/\.duo-cuon\[data-co\] > i \{ opacity: 1; \}/)
    expect(s).toMatch(/\.duo-cuon\[data-con\]::after \{ opacity: 1; \}/)
  })
  it('điện thoại ngang: thanh trên 44px; dải kết quả là HÀNG ĐÁY riêng trải bề ngang (không fixed phủ đề), đề thu lên hàng 2–3', () => {
    const i = boChu(CSS).indexOf('@media (orientation: landscape) and (max-height: 500px) {\n')
    const k = boChu(CSS).slice(i)
    expect(k).toMatch(/> \.duo-tren \{ min-height: 44px;/)
    expect(k).toMatch(/\[data-ket\] \{ grid-template-rows: auto auto minmax\(0, 1fr\) auto; \}/)
    expect(k).toMatch(/\[data-ket\] :is\(\.duo-cot-de, \.duo-than > \.duo-cuon\[data-cot='de'\]\) \{ grid-row: 2 \/ 4; \}/)
    expect(k).toMatch(/> \.duo-day\.duo-ket \{[^}]*grid-column: 1 \/ -1; grid-row: 4;/)
  })
  it('máy tính: bề rộng tổng tối đa 1240px căn giữa, cột đề rộng hơn (dòng đề 60–70 ký tự), thẻ kết quả ở cột phải; lời giải tấm bên phải không phủ đề', () => {
    const s = boChu(CSS)
    expect(s).toContain('--cn-rong: 1240px; --cn-le: max(24px, calc((100% - var(--cn-rong)) / 2));')
    expect(s).toContain('grid-template-columns: minmax(0, 1.32fr) minmax(340px, 1fr);')
    expect(s).toMatch(/\[data-hai-cot\]:not\(\[data-xong\]\) \.duo-cot-de \.ht2-lam-de-chu \{ font-size: 19px; line-height: 1\.6; \}/)
    expect(s).toMatch(/> \.duo-day\.duo-ket \{[^}]*max-height: 52dvh;[^}]*border-radius: 20px;/)
    expect(s).toMatch(/\.duo-lg \{ justify-content: flex-end;[^}]*pointer-events: none; \}/)
  })
  it('phương trình dài giữ ô cuộn ngang `.ct-dai` (không bẻ dòng) — chỉ thêm thanh mảnh + bóng mép', () => {
    const s = boChu(CSS)
    expect(s).toMatch(/\.duo-cot-de \.ct-dai \{[^}]*scrollbar-width: thin;/)
    expect(s).not.toMatch(/\.ct-dai[^{]*\{[^}]*(white-space|overflow-wrap|word-break)/)
  })
})

describe('màn làm chặng (Duo) gắn gốc riêng + lớp phủ thanh cuộn', () => {
  beforeEach(() => { document.documentElement.dataset.trong = 'hs' })
  afterEach(() => { cleanup(); vi.mocked(goiHoa2).mockReset(); localStorage.clear(); delete document.documentElement.dataset.trong })
  const nen = { maDe: 'de-8', version: 'v1', group: 'g', hinhAnh: [], dang: null, tenDang: 'Hợp chất chứa nitrogen', mucDo: 'hieu', sao: 0, kienThuc: [], ideas: [] }
  const C1 = { ...nen, qid: 'q1', phan: 'I' as const, text: 'Số đồng phân amine bậc một tạo alcohol là', choices: ['2', '8', '3', '4'] }
  const C2 = { ...nen, qid: 'q2', phan: 'II' as const, text: 'Xét dãy hydroxide.', choices: [], ideas: ['ý a', 'ý b', 'ý c', 'ý d'] }

  it('gốc có data-chang + data-phan; lớp phủ .duo-cuon đứng NGAY SAU cột đề và cột trả lời; dải kết quả ⇒ data-ket; sang câu ⇒ data-phan đổi', async () => {
    vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, id: 'p1', questions: [C1, C2] })
    const { container } = render(<ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} homNay={null} />)
    await screen.findByText(C1.text)
    const goc = container.querySelector('.ht-app.duo')!
    expect(goc.hasAttribute('data-chang')).toBe(true)
    expect(goc.getAttribute('data-phan')).toBe('I')
    expect(goc.hasAttribute('data-ket')).toBe(false)
    const de = container.querySelector('.duo-cot-de')!, tra = container.querySelector('.duo-cot-tra')!
    expect(de.nextElementSibling?.matches('.duo-cuon[data-cot="de"][aria-hidden="true"]')).toBe(true)
    expect(tra.nextElementSibling?.matches('.duo-cuon[data-cot="tra"][aria-hidden="true"]')).toBe(true)
    vi.mocked(goiHoa2).mockResolvedValueOnce({ correct: true, answer: 'D', solution: { chot: 'Bốn amine bậc một.' } })
    fireEvent.click(screen.getByRole('radio', { name: /^D/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra' }))
    await screen.findByRole('button', { name: 'Tiếp tục' })
    expect(goc.hasAttribute('data-ket')).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục' }))
    await screen.findByText('Xét dãy hydroxide.')
    expect(goc.getAttribute('data-phan')).toBe('II')
    expect(goc.hasAttribute('data-ket')).toBe(false)
  })

  it('màn cũ (tắt «Trong») không có gốc data-chang, không lớp phủ', async () => {
    delete document.documentElement.dataset.trong
    vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, id: 'p1', questions: [C1] })
    const { container } = render(<ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} homNay={null} />)
    await screen.findByText(C1.text)
    expect(container.querySelector('[data-chang]')).toBeNull()
    expect(container.querySelector('.duo-cuon')).toBeNull()
  })
})
