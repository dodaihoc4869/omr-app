// NÚT X "AI SAI CÂU NÀY" TRÊN TỜ CHIẾU (thầy 05/10): mọi tờ TRỪ Dạy học; bấm X / phím x ⇒ danh sách em đã làm sai câu đang chiếu:
// giờ nào · ca nào (nơi làm) · làm trong bao lâu.
//   · máy chủ `/gv/ai-sai-cau`: chỉ lượt sai tự làm (bỏ đúng, bỏ "đọc lời giải"), gồm câu song sinh, tên ca, số giây; chỉ thầy;
//   · giao thức AI_SAI {khoa,id} qua bốn lớp kiểm; tờ: có nút khi có cầu nối và không phải Dạy học;
//   · tờ chạy thật (JSDOM): X gửi đúng ô của đợt, app trả về ⇒ bảng em · giờ · nơi · thời gian; Esc đóng.
import { describe, expect, it } from 'vitest'
import { JSDOM, VirtualConsole } from 'jsdom'
import { taoHtmlMayChieu, type OBang } from '../src/lib/html-may-chieu'
import { TIN_TO_CHIEU, kiemTinToChieu, type BoiCanhKiemTin } from '../src/lib/to-chieu-cau-noi'

describe('giao thức AI_SAI', () => {
  const KHUNG = {}
  const ctx: BoiCanhKiemTin = { maPhien: 'M', gocApp: 'http://a', laKhungToChieu: (s) => s === KHUNG, khoaHopLe: (k) => k === 'S1|Q1' }
  const tin = (data: Record<string, unknown>) => ({ data: { maPhien: 'M', ...data }, origin: 'http://a', source: KHUNG })
  it('ô có trên tờ + id hợp lệ ⇒ nhận; ô lạ / id xấu ⇒ bỏ', () => {
    expect(kiemTinToChieu(tin({ type: TIN_TO_CHIEU.AI_SAI, khoa: 'S1|Q1', id: 's1' }), ctx)).toEqual({ loai: 'ai_sai', khoa: 'S1|Q1', id: 's1' })
    expect(kiemTinToChieu(tin({ type: TIN_TO_CHIEU.AI_SAI, khoa: 'X|Y', id: 's1' }), ctx)).toBeNull()
    expect(kiemTinToChieu(tin({ type: TIN_TO_CHIEU.AI_SAI, khoa: 'S1|Q1', id: '<x>' }), ctx)).toBeNull()
  })
})

const MA = 'PHIEN-ai-sai'
const GOC = 'http://localhost:3000'
const o = (sbd: string, qid = `Q-${sbd}`): OBang => ({
  sbd, hoTen: `Em ${sbd}`, qid, soCau: 1, sao: 1,
  cau: { phan: 'I', id: qid, text: 'Câu ngắn', luaChon: ['A', 'B', 'C', 'D'], dapAn: 'A', buoc: [] } as unknown as OBang['cau'],
})

describe('tờ dựng: lớp bảng "Ai sai" không trùng thẻ lần làm', () => {
  it('(05/10, lỗi chồng thẻ) thẻ "Sai" trong lịch sử lần làm là .mc-lanlam.mc-sai — bảng nổi dùng .mc-aisai; không quy tắc nào nhắm .mc-sai trơn', () => {
    const h = taoHtmlMayChieu([o('A')], { cauNoi: { maPhien: MA } })
    const css = [...new JSDOM(h).window.document.querySelectorAll('style')].map((x) => x.textContent).join('')
    expect(css.match(/(^|[^\w.-])\.mc-sai(?![-\w])/g) ?? []).toEqual([])
    expect(css).toContain('.mc-aisai{position:fixed')
  })
})

describe('tờ dựng: nút X', () => {
  it('có cầu nối ⇒ có nút X; không cầu nối / Dạy học / nutAiSai:false ⇒ không dựng nút (không thêm thuộc tính nào lên body)', () => {
    const co = (h: string) => !!new JSDOM(h).window.document.querySelector('#mc-phim-nhom [data-k="X"]')
    expect(new JSDOM(taoHtmlMayChieu([o('A')], { cauNoi: { maPhien: MA } })).window.document.body.hasAttribute('data-ai-sai')).toBe(false)
    expect(co(taoHtmlMayChieu([o('A')], { cauNoi: { maPhien: MA } }))).toBe(true)
    expect(co(taoHtmlMayChieu([o('A')], {}))).toBe(false)
    expect(co(taoHtmlMayChieu([o('A')], { cauNoi: { maPhien: MA }, dayHoc: true }))).toBe(false)
    expect(co(taoHtmlMayChieu([o('A')], { cauNoi: { maPhien: MA }, nutAiSai: false }))).toBe(false)
  })
})

function moTo(tuy: Parameters<typeof taoHtmlMayChieu>[1] = { cauNoi: { maPhien: MA } }) {
  const cha = new JSDOM('<!doctype html><body></body>', { url: `${GOC}/` }).window as unknown as Window & { postMessage: (m: unknown, o?: string) => void }
  const gui: Record<string, unknown>[] = []
  cha.postMessage = ((m: Record<string, unknown>) => void gui.push(m)) as never
  const dom = new JSDOM(taoHtmlMayChieu([o('A'), o('B')], tuy), {
    runScripts: 'dangerously',
    virtualConsole: new VirtualConsole(),
    beforeParse(w) {
      Object.defineProperty(w, 'parent', { get: () => cha, configurable: true })
      w.setTimeout = (() => 0) as never
      w.setInterval = (() => 0) as never
      w.HTMLElement.prototype.scrollTo = () => {}
    },
  })
  const doc = dom.window.document
  const tuCha = (data: unknown) =>
    dom.window.dispatchEvent(new (dom.window as unknown as { MessageEvent: typeof MessageEvent }).MessageEvent('message', { data, origin: GOC, source: cha as unknown as MessageEventSource }))
  const phim = (key: string) => doc.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key, bubbles: true }))
  return { doc, gui, tuCha, phim }
}

describe('tờ chạy thật — nút X', () => {
  it('nút X ẩn trước khi nối app, hiện sau khi nối; bấm ⇒ gửi AI_SAI đúng ô của đợt; app trả ⇒ bảng em · giờ (VN) · nơi · thời gian; Esc đóng', () => {
    const t = moTo()
    const x = t.doc.querySelector<HTMLButtonElement>('#mc-phim-nhom [data-k="X"]')!
    expect(x.textContent).toContain('Ai sai')
    expect(x.hidden).toBe(true)
    t.tuCha({ type: TIN_TO_CHIEU.KET_NOI, maPhien: MA })
    expect(x.hidden).toBe(false)
    x.click()
    const m = t.gui.filter((g) => g.type === TIN_TO_CHIEU.AI_SAI)
    expect(m).toHaveLength(1)
    expect(m[0]).toMatchObject({ khoa: 'A|Q-A', maPhien: MA })
    const panel = t.doc.querySelector('.mc-aisai')!
    expect(panel.classList.contains('mc-mo')).toBe(true)
    t.tuCha({
      type: TIN_TO_CHIEU.AI_SAI_TRA, maPhien: MA, id: m[0]!.id,
      ds: [
        { sbd: 'S1', ten: 'Trần An', luc: '2026-10-03T03:00:00Z', noi: 'Lên bảng', giay: 40, uocTinh: true },
        { sbd: 'S1', ten: 'Trần An', luc: '2026-10-01T02:05:00Z', noi: 'Ca Kiểm tra tuần 3', giay: 95 },
        { sbd: 'S2', ten: 'Lê Bình', luc: '2026-10-01T02:06:00Z', noi: 'Ca Kiểm tra tuần 3', giay: null },
      ],
    })
    // 4 ô số: em · lượt · trung bình (có ước tính ⇒ "≈") · nơi sai nhiều nhất
    // (40 + 95) / 2 = 67,5 ⇒ 68 giây
    expect([...panel.querySelectorAll('.mc-sai-o b')].map((b) => b.textContent)).toEqual(['2', '3', '≈ 1 phút 8 giây', 'Ca'])
    // thanh theo nơi: "Ca Kiểm tra tuần 3" gộp vào nhóm "Ca"; xếp nhiều trước
    expect([...panel.querySelectorAll('.mc-sai-thanh')].map((x) => [x.querySelector('span')!.textContent, x.querySelector('em')!.textContent])).toEqual([['Ca', '2'], ['Lên bảng', '1']])
    // cột theo ngày, tăng dần
    expect([...panel.querySelectorAll('.mc-sai-ngay span')].map((x) => x.textContent)).toEqual(['01/10', '03/10'])
    // thẻ từng em: em sai nhiều trước; dòng tên có trung bình giây của em (chỉ lượt có số giây; có ước tính ⇒ "≈") — thầy 09/10;
    // mỗi lượt một chip giờ (VN) · nơi · thời gian (ước tính có "≈"); không đo được ⇒ "chưa đo giờ" (không bỏ trống)
    const em = [...panel.querySelectorAll('.mc-sai-em')]
    expect(em.map((x) => x.querySelector('.mc-sai-ten')!.textContent)).toEqual(['Trần An2 lần sai · trung bình ≈ 1 phút 8 giây', 'Lê Bình1 lần sai'])
    expect([...em[0]!.querySelectorAll('.mc-sai-chip > span')].map((x) => x.textContent)).toEqual(['10:00 · 03/10 · Lên bảng · ≈ 40 giây', '09:05 · 01/10 · Ca Kiểm tra tuần 3 · 1 phút 35 giây'])
    expect([...em[1]!.querySelectorAll('.mc-sai-chip > span')].map((x) => x.textContent)).toEqual(['09:06 · 01/10 · Ca Kiểm tra tuần 3 · chưa đo giờ'])
    expect(panel.textContent).toContain('thời gian ước tính')
    t.phim('Escape')
    expect(panel.classList.contains('mc-mo')).toBe(false)
  })
  it('(thầy 09/10) số giây THẬT: em có lượt đo được ⇒ "trung bình <x> giây" không "≈"; chỉ tính lượt đo được; chưa đo ⇒ chip "chưa đo giờ"; không chú thích ước tính', () => {
    const t = moTo()
    t.tuCha({ type: TIN_TO_CHIEU.KET_NOI, maPhien: MA })
    t.phim('x')
    const m = t.gui.filter((g) => g.type === TIN_TO_CHIEU.AI_SAI)
    t.tuCha({
      type: TIN_TO_CHIEU.AI_SAI_TRA, maPhien: MA, id: m[0]!.id,
      ds: [
        { sbd: 'S1', ten: 'Trần An', luc: '2026-10-03T03:00:00Z', noi: 'Đảo', giay: 18 },
        { sbd: 'S1', ten: 'Trần An', luc: '2026-10-02T03:00:00Z', noi: 'Lên bảng', giay: null },
        { sbd: 'S1', ten: 'Trần An', luc: '2026-10-01T02:05:00Z', noi: 'Ca Kiểm tra tuần 3', giay: 64 },
      ],
    })
    const panel = t.doc.querySelector('.mc-aisai')!
    const em = panel.querySelector('.mc-sai-em')!
    // (18 + 64) / 2 = 41 — lượt "chưa đo giờ" không kéo trung bình
    expect(em.querySelector('.mc-sai-ten small')!.textContent).toBe('3 lần sai · trung bình 41 giây')
    expect([...em.querySelectorAll('.mc-sai-chip > span')].map((x) => x.textContent)).toEqual([
      '10:00 · 03/10 · Đảo · 18 giây', '10:00 · 02/10 · Lên bảng · chưa đo giờ', '09:05 · 01/10 · Ca Kiểm tra tuần 3 · 1 phút 4 giây',
    ])
    // số đo nổi bật (thẻ <u>), "chưa đo giờ" là chữ thường của chip — không thêm màu
    expect([...em.querySelectorAll('.mc-sai-chip > span u')].map((x) => x.textContent)).toEqual(['18 giây', '1 phút 4 giây'])
    expect(panel.textContent).not.toContain('thời gian ước tính')
  })
  it('phím x mở; app báo lỗi ⇒ nói chưa tải được; danh sách rỗng ⇒ "Chưa em nào làm sai câu này."', () => {
    const t = moTo()
    t.tuCha({ type: TIN_TO_CHIEU.KET_NOI, maPhien: MA })
    t.phim('x')
    let m = t.gui.filter((g) => g.type === TIN_TO_CHIEU.AI_SAI)
    t.tuCha({ type: TIN_TO_CHIEU.AI_SAI_TRA, maPhien: MA, id: m[0]!.id, loi: 'Mất mạng' })
    expect(t.doc.querySelector('.mc-sai-tt')!.textContent).toContain('Chưa tải được')
    t.phim('x')
    m = t.gui.filter((g) => g.type === TIN_TO_CHIEU.AI_SAI)
    t.tuCha({ type: TIN_TO_CHIEU.AI_SAI_TRA, maPhien: MA, id: m[1]!.id, ds: [] })
    expect(t.doc.querySelector('.mc-sai-tt')!.textContent).toBe('Chưa em nào làm sai câu này.')
  })
  it('tờ Dạy học: không có nút X dùng được (phím x chỉ nhắc, không gửi gì)', () => {
    const t = moTo({ cauNoi: { maPhien: MA }, nutAiSai: false })
    t.tuCha({ type: TIN_TO_CHIEU.KET_NOI, maPhien: MA })
    expect(t.doc.querySelector('#mc-phim-nhom [data-k="X"]')).toBeNull()
    t.phim('x')
    expect(t.gui.filter((g) => g.type === TIN_TO_CHIEU.AI_SAI)).toHaveLength(0)
  })
})
