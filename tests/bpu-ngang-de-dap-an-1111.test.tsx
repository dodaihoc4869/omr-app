// @vitest-environment jsdom
// BÌNH PHẢN ỨNG · BỐ CỤC NGANG MÀN CÂU HỎI CỦA MÁY EM (thầy 11/11 tối: «tôi muốn câu hỏi xoay ngang trên máy học sinh thì hiển thị giao diện xoay ngang, một bên
// đề một bên chọn đáp án»). Ảnh trước: docs/ban-ve-live-1011/ngang-chuyen-cau-sau-cau-moi-android-740.jpg — thanh đầu cao, giám thị + bong bóng chiếm chỗ,
// phương án cách xa, D bị cắt, phải cuộn cả trang. Đo Chromium thật (bounding box, cuộn, chạm được, ≥ 44 px) ở bộ thử:
//   scripts/chup-bpu-de-chang-1011/ngang-1111.mjs  (3 dạng câu + đề dài + phương án dài × 640·740·844·932 ngang, dọc 390, 1366 × 768)
//   scripts/thu-live-1011/thu-ngang-chuyen-cau-1111.mjs  (live: Android 740 khoá ngang, iPhone xoay hình CSS ≡ ngang thật 844)
// Ở đây khoá: (1) cây DOM hai cột + kiểu phiếu, (2) MỌI luật ngang có bản sinh đôi cho màn xoay hình, (3) dọc giữ nguyên, (4) không đáp án xuống máy, (5) đo cột.
import { act, cleanup, render, waitFor } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { moLuot, taoPhong, viewEm } from '../src/lib/bpu/phong'
import { cauCongKhai } from '../server/src/cau-theo-qid'
import type { PrivateQuestion, Question } from '../src/game/than-thu-v2/core'
import { CAO_KHUNG_THAP, RONG_HAI_COT } from '../src/components/bpu/luat-man-live'
import { RONG_NGANG_MIN } from '../src/components/hoc-tap/bo-cuc-lam'
import { YDeNgang, coPhieu, doCotTra } from '../src/components/bpu/bo-cuc-ngang'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu' }))

const CSS = readFileSync('src/components/bpu/bpu-hs.css', 'utf8')
const MOC = '/* ── BỐ CỤC NGANG 11/11'
const KHOI = CSS.slice(CSS.indexOf(MOC))
const MQ = '@media (orientation: landscape) and (min-width: 640px) {'
const MQT = '@media (orientation: landscape) and (min-width: 640px) and (max-height: 500px) {'
/** Luật (mỗi dòng một luật) trong khối @media mở bằng `dau` của phần BỐ CỤC NGANG. */
function luatTrong(dau: string): string[] {
  const i = KHOI.indexOf(dau)
  expect(i, dau).toBeGreaterThan(0)
  const het = KHOI.indexOf('\n}', i)
  return KHOI.slice(i + dau.length, het).split('\n').map((x) => x.trim()).filter(Boolean)
}
/** Tách danh sách bộ chọn ở dấu phẩy NGOÀI ngoặc (`:is(a, b)` là một bộ chọn). */
const tachBoChon = (sel: string): string[] => { const ra = ['']; let d = 0; for (const c of sel) { if (c === ',' && !d) { ra.push(''); continue } d += c === '(' ? 1 : c === ')' ? -1 : 0; ra[ra.length - 1] += c } return ra }
const sinhDoi = (goc: string, luat: string) => { const [sel, than] = [luat.slice(0, luat.indexOf('{')), luat.slice(luat.indexOf('{'))]; return tachBoChon(sel).map((x) => `:where(${goc}) ${x.trim()}`).join(', ') + ' ' + than }

describe('kiểu: luật ngang + bản sinh đôi cho màn xoay hình (luat-man-live.tsx đặt data-ngang / data-thap)', () => {
  it('ngưỡng một nguồn: hai cột từ 640 px (= màn chặng RONG_NGANG_MIN), máy thấp ≤ 500 px; không còn ngưỡng 700 cũ', () => {
    expect(RONG_HAI_COT).toBe(RONG_NGANG_MIN)
    expect(RONG_HAI_COT).toBe(640)
    expect(CAO_KHUNG_THAP).toBe(500)
    expect(CSS).not.toContain('(min-width: 700px)')
    expect(CSS.match(/@media \(orientation: landscape\) and \(min-width: 640px\)/g)!.length).toBeGreaterThanOrEqual(5)
  })
  it.each([[MQ, '.bpu-hs[data-ngang]'], [MQT, '.bpu-hs[data-ngang][data-thap]']])('mọi luật trong %s có bản sinh đôi `:where(%s) …` CÙNG khai báo (ngoài @media)', (mq, goc) => {
    const ds = luatTrong(mq)
    expect(ds.length).toBeGreaterThan(10)
    const ngoai = KHOI.split('\n').filter((x) => x.startsWith(':where('))
    for (const l of ds) expect(ngoai, l).toContain(sinhDoi(goc, l))
  })
  it('khung câu hỏi ngang: thân KHÔNG cuộn; cột đề cuộn riêng; cột trả lời ở cột 2; kiểu phiếu hiện danh sách ý / phương án ở cột đề', () => {
    const l = luatTrong(MQ).join('\n')
    expect(l).toMatch(/\.bpu-hs-than\.bpu-cau \{[^}]*grid-template-columns: minmax\(0, 1fr\) minmax\(0, 1fr\);[^}]*overflow: hidden;/)
    expect(l).toMatch(/\.bpu-cau > \.bpu-cot-de \{[^}]*grid-column: 1;[^}]*overflow-y: auto;/)
    expect(l).toMatch(/\.bpu-cau > \.bpu-tra \{[^}]*grid-column: 2;/)
    expect(l).toContain('.bpu-cau[data-gon] .bpu-y-de { display: grid; }')
    // thẻ ±kJ chỉ trên nửa trái — không đè phương án / nút Gửi
    expect(l).toContain('.bpu-hs-tren ~ .bpu-bd-neo .bpu-bd { right: calc(50% + 24px);')
  })
  it('máy thấp: đầu màn một dải mảnh; giám thị 72 px; nút trả lời / phím số ≥ 44 px', () => {
    const l = luatTrong(MQT).join('\n')
    expect(l).toMatch(/\.bpu-hs-tren, \.bpu-hs-tren\.co-doi \{[^}]*padding: 3px 16px;/)
    expect(l).toContain('.bpu-hs-than.bpu-cau .duo-gt-san { --gt-nvw: 72px; }')
    for (const m of l.matchAll(/(?:min-)?height: (\d+)px/g)) if (/ht2-lam-pa|bpu-phim button/.test(l.slice(l.lastIndexOf('\n', m.index), m.index))) expect(Number(m[1])).toBeGreaterThanOrEqual(44)
    expect(l).toMatch(/\.bpu-phim \.xoa \{ grid-column: 4; grid-row: 1 \/ span 4;/)
  })
  it('DỌC giữ nguyên: hai lớp bọc là display: contents; ảnh cuối câu / lời giải đứng SAU phần trả lời (order), danh sách kiểu phiếu ẩn — ngoài mọi @media', () => {
    const dau = KHOI.slice(0, KHOI.indexOf('\n@media'))
    expect(dau).toContain('.bpu-cot-de, .bpu-sau-tra { display: contents; }')
    expect(dau).toContain('.bpu-sau-tra > * { order: 1; }')
    expect(dau).toContain('.bpu-cau > .bpu-bao { order: 2; }')
    expect(dau).toMatch(/\.bpu-y-de \{ display: none;/)
  })
  it('màu: chỉ biến --tr-* sẵn có, không mã màu thô; không :has() (iPhone iOS 14–15)', () => {
    expect(KHOI).not.toMatch(/#[0-9a-f]{3,8}\b/i)
    expect(KHOI).not.toMatch(/rgba?\(|hsla?\(/)
    expect(KHOI).not.toContain(':has(')
    const bien = new Set([...KHOI.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]))
    for (const b of bien) expect(CSS.slice(0, CSS.indexOf(MOC)) + readFileSync('src/styles/trong.css', 'utf8'), b).toContain(b)
  })
})

// ───────────── cây DOM của màn câu hỏi (máy em, phòng giả lõi thật) ─────────────
class WsGia { static ds: WsGia[] = []; readyState = 1; gui: string[] = []; onopen?: () => void; onmessage?: (e: { data: string }) => void; onclose?: () => void; onerror?: () => void
  constructor(public url: string) { WsGia.ds.push(this); setTimeout(() => this.onopen?.(), 0) }
  send(d: string) { this.gui.push(d) } close() {} nhan(v: unknown) { act(() => { this.onmessage?.({ data: JSON.stringify(v) }) }) } }
const T0 = Date.now()
const phong = () => taoPhong({ buoiId: 'b1', lop: '12A1', nay: T0, ds: [{ sbd: 'S1', ten: 'Nguyễn Minh Anh', coMat: true, luc: T0 }, { sbd: 'S2', ten: 'Trần Gia Bảo', coMat: true, luc: T0 }] })
const DS: PrivateQuestion = {
  qid: 'BPU-NGANG-DS', maDe: 'm', version: '1', group: 'g', phan: 'II', text: 'Cho các phát biểu sau về phenol và ethanol.', choices: [],
  ideas: ['Phenol tác dụng được với dung dịch NaOH.', 'Cả hai chất tác dụng với Na.', 'Phenol làm quỳ tím hoá đỏ.', 'Phenol tạo kết tủa trắng với nước bromine.'],
  hinhAnh: [{ src: 'data:image/png;base64,BBBB', viTri: 'sau_y_a' }, { src: 'data:image/png;base64,CCCC', viTri: 'cuoi_cau', alt: 'Hình cuối câu' }, { src: 'data:image/png;base64,DDDD', viTri: 'sau_loi_giai' }],
  ideaImgs: ['', 'data:image/png;base64,EEEE', '', ''],
  dang: null, tenDang: 'Phenol', mucDo: 'hieu', sao: 1, kienThuc: [], correct: 'DDSD', solution: { chot: 'Lời giải BÍ MẬT' }, reviewed: true,
}
const TLN: PrivateQuestion = { ...DS, qid: 'BPU-NGANG-TLN', phan: 'III', text: 'Khối lượng muối thu được là bao nhiêu gam?', ideas: [], ideaImgs: undefined, hinhAnh: [], correct: '6,48' }

describe('màn câu hỏi: hai cột «một bên đề một bên chọn đáp án»', () => {
  beforeEach(() => { WsGia.ds = []; document.documentElement.dataset.trong = 'hs'; vi.stubGlobal('WebSocket', WsGia); vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ok: true, ve: 've-em', buoiId: 'b1', ban: {} })))) })
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); delete document.documentElement.dataset.trong })
  async function vao(q: PrivateQuestion | null) {
    const { default: Man } = await import('../src/components/bpu/ManBinhPhanUng')
    render(<Man token="tok" buoiId="b1" onDong={() => {}} />)
    await waitFor(() => expect(WsGia.ds.length).toBe(1))
    const st = phong()
    if (q) moLuot(st, { qid: q.qid, phan: q.phan, tuLuan: false, cau: cauCongKhai(q) as unknown as Record<string, unknown>, dung: q.correct, hanGiay: 0 }, T0)
    WsGia.ds[0]!.nhan(viewEm(st, 'S1'))
    if (q) await waitFor(() => expect(document.querySelector('.bpu-tra .ht2-lam-ds, .bpu-tra .bpu-tln')).toBeTruthy(), { timeout: 8000 })
    else await waitFor(() => expect(document.querySelector('.bpu-hs-than')).toBeTruthy(), { timeout: 8000 })
  }

  it('đúng–sai: thân `.bpu-cau[data-phieu]` = cột đề (nhãn · đề · danh sách ý · ảnh cuối câu) + cột trả lời; đủ ảnh ý, ảnh cuối câu; KHÔNG đáp án / lời giải', async () => {
    await vao(DS)
    const than = document.querySelector('.bpu-hs-than')!
    expect(than.classList.contains('bpu-cau')).toBe(true)
    expect(than.hasAttribute('data-phieu')).toBe(true)
    expect([...than.children].slice(0, 2).map((x) => x.className)).toEqual(['bpu-cot-de', 'duo-tra bpu-tra'])
    const cot = than.querySelector(':scope > .bpu-cot-de')!
    expect([...cot.children].map((x) => x.classList[0])).toEqual(['m3-chip', 'ht-app', 'bpu-y-de', 'bpu-sau-tra'])
    const y = [...cot.querySelectorAll('.bpu-y-de > li')]
    expect(y.map((li) => li.querySelector('b')!.textContent)).toEqual(['a.', 'b.', 'c.', 'd.'])
    expect(y[0]!.textContent).toContain('Phenol tác dụng được với dung dịch NaOH.')
    expect(y[0]!.querySelector('img[src$="BBBB"]')).toBeTruthy() // ảnh sau ý a: cũng ở cột đề (kiểu phiếu ẩn ảnh ở cột phải)
    expect(y[1]!.querySelector('img[src$="EEEE"]')).toBeTruthy() // ý là ảnh
    expect(cot.querySelector('.bpu-sau-tra img[src$="CCCC"]')).toBeTruthy() // ảnh cuối câu: cột đề (ngang) · sau phần trả lời (dọc, order)
    expect(than.querySelectorAll(':scope > .bpu-tra .ht2-lam-y')).toHaveLength(4) // cột phải vẫn đủ 4 ý + nút Đúng / Sai
    expect(document.body.innerHTML).not.toContain('BÍ MẬT')
    expect(document.querySelector('img[src$="DDDD"]')).toBeNull()
  })
  it('trả lời ngắn: hai cột nhưng KHÔNG kiểu phiếu (không danh sách ý); bàn phím số ở cột trả lời', async () => {
    await vao(TLN)
    const than = document.querySelector('.bpu-hs-than.bpu-cau')!
    expect(than.hasAttribute('data-phieu')).toBe(false)
    expect(document.querySelector('.bpu-y-de')).toBeNull()
    expect(than.querySelector(':scope > .bpu-tra .bpu-phim .xoa')).toBeTruthy()
  })
  it('màn khác (chưa có lượt) không phải màn câu hỏi ⇒ thân cuộn như cũ (không `.bpu-cau`)', async () => {
    await vao(null)
    expect(document.querySelector('.bpu-hs-than')!.classList.contains('bpu-cau')).toBe(false)
  })
})

describe('YDeNgang — chữ đầy đủ phương án / ý ở cột đề (kiểu phiếu)', () => {
  afterEach(cleanup)
  const Chu = ({ text }: { text: string }) => <>{text}</>
  const q = (o: Partial<Question>): Question => ({ qid: 'q', maDe: '', version: '1', group: 'g', phan: 'I', text: 'Đề', choices: ['A1', '(xem hình phương án B)', 'C1', 'D1'], ideas: [], hinhAnh: [], dang: null, tenDang: '', mucDo: null, sao: null, kienThuc: [], ...o })
  it('trắc nghiệm: «A.»…«D.»; phương án chỉ là ảnh (chữ giữ chỗ + ảnh sau_pa_B) ⇒ ảnh, bỏ chữ giữ chỗ; phương án ảnh riêng ⇒ ảnh', () => {
    const { container } = render(<YDeNgang Chu={Chu} q={q({ hinhAnh: [{ src: 'data:image/png;base64,PPPP', viTri: 'sau_pa_B' }], choiceImgs: ['', '', 'data:image/png;base64,QQQQ', ''] })} />)
    const li = [...container.querySelectorAll('li')]
    expect(li.map((x) => x.querySelector('b')!.textContent)).toEqual(['A.', 'B.', 'C.', 'D.'])
    expect(li[1]!.textContent).not.toContain('xem hình')
    expect(li[1]!.querySelector('img[src$="PPPP"]')).toBeTruthy()
    expect(li[2]!.querySelector('img[src$="QQQQ"]')).toBeTruthy()
  })
  it('trả lời ngắn / tự luận / chưa có bộ chữ ⇒ không dựng gì', () => {
    expect(render(<YDeNgang Chu={Chu} q={q({ phan: 'III' })} />).container.innerHTML).toBe('')
    expect(render(<YDeNgang Chu={Chu} q={q({})} tuLuan />).container.innerHTML).toBe('')
    expect(render(<YDeNgang q={q({})} />).container.innerHTML).toBe('')
    expect(coPhieu(q({}), false)).toBe(true)
    expect(coPhieu(q({ phan: 'III' }), false)).toBe(false)
    expect(coPhieu(q({}), true)).toBe(false)
  })
})

describe('doCotTra — kiểu phiếu khi (và chỉ khi) cột trả lời đầy đủ không vừa khung ngang', () => {
  afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })
  function dung(luoi: boolean, cao: number, khung: number, phieu = true) {
    document.body.innerHTML = `<div class="bpu-hs"><main class="bpu-hs-than bpu-cau"${phieu ? ' data-phieu="true"' : ''}><div class="bpu-cot-de"></div><div class="bpu-tra"></div></main></div>`
    const tra = document.querySelector<HTMLElement>('.bpu-tra')!
    Object.defineProperty(tra, 'scrollHeight', { configurable: true, value: cao })
    Object.defineProperty(tra, 'clientHeight', { configurable: true, value: khung })
    // ngang: cột đề là hộp thật (lưới hai cột) · dọc: `display: contents` ⇒ không có hộp
    vi.spyOn(document.querySelector<HTMLElement>('.bpu-cot-de')!, 'getClientRects').mockImplementation(() => (luoi ? [new DOMRect(0, 0, 300, 300)] : []) as unknown as DOMRectList)
    return document.querySelector<HTMLElement>('.bpu-hs')!
  }
  it('ngang (cột đề có hộp) + cột tràn ⇒ data-gon; vừa ⇒ gỡ; dọc (cột đề display: contents) ⇒ không bao giờ; câu không có phương án / ý ⇒ không', () => {
    const g = dung(true, 520, 300)
    doCotTra(g)
    expect(g.querySelector('.bpu-cau')!.hasAttribute('data-gon')).toBe(true)
    Object.defineProperty(g.querySelector('.bpu-tra')!, 'clientHeight', { configurable: true, value: 600 })
    doCotTra(g)
    expect(g.querySelector('.bpu-cau')!.hasAttribute('data-gon')).toBe(false)
    vi.restoreAllMocks()
    const d = dung(false, 520, 300)
    doCotTra(d)
    expect(d.querySelector('.bpu-cau')!.hasAttribute('data-gon')).toBe(false)
    vi.restoreAllMocks()
    const n = dung(true, 520, 300, false)
    doCotTra(n)
    expect(n.querySelector('.bpu-cau')!.hasAttribute('data-gon')).toBe(false)
  })
})
