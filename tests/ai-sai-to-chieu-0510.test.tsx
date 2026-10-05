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
    const panel = t.doc.querySelector('.mc-sai')!
    expect(panel.classList.contains('mc-mo')).toBe(true)
    t.tuCha({
      type: TIN_TO_CHIEU.AI_SAI_TRA, maPhien: MA, id: m[0]!.id,
      ds: [
        { sbd: 'S1', ten: 'Trần An', luc: '2026-10-03T03:00:00Z', noi: 'Lên bảng', giay: 40 },
        { sbd: 'S1', ten: 'Trần An', luc: '2026-10-01T02:05:00Z', noi: 'Ca Kiểm tra tuần 3', giay: 95 },
        { sbd: 'S2', ten: 'Lê Bình', luc: '2026-10-01T02:06:00Z', noi: 'Ca Kiểm tra tuần 3', giay: null },
      ],
    })
    expect(panel.querySelector('.mc-sai-tt')!.textContent).toBe('2 em · 3 lượt làm sai')
    const dong = [...panel.querySelectorAll('tbody tr')].map((tr) => [...tr.querySelectorAll('td')].map((td) => td.textContent))
    expect(dong).toEqual([
      ['Trần An', '10:00 · 03/10', 'Lên bảng', '40 giây'],
      ['Trần An', '09:05 · 01/10', 'Ca Kiểm tra tuần 3', '1 phút 35 giây'],
      ['Lê Bình', '09:06 · 01/10', 'Ca Kiểm tra tuần 3', '—'],
    ])
    t.phim('Escape')
    expect(panel.classList.contains('mc-mo')).toBe(false)
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
