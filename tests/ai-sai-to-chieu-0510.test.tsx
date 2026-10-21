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

/** Mỗi làn: "đầu làn|thẻ tên·giây thẻ tên·giây…" (nối chuỗi, không khoảng trắng) — để so sánh gọn. */
const chuLan = (panel: Element) => [...panel.querySelectorAll('.mc-ln')].map((l) => `${l.querySelector('header')!.textContent}|${[...l.querySelectorAll('.mc-pl')].map((p) => p.textContent).join(' ')}`)
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
    // 21/10 (thầy: "hiển thị đầy đủ các mức 1 tới 4"): một thẻ khi app chưa nói lớp; lượt không có `mucLam` ⇒ làn "Chưa có số đo" (giữ số giây cũ, "≈" khi ước tính, "chưa đo giờ" khi không đo)
    const the = panel.querySelector('.mc-ai-the')!
    expect(panel.querySelectorAll('.mc-ai-the')).toHaveLength(1)
    expect([...the.querySelectorAll('.mc-ai-so b')].map((b) => b.textContent)).toEqual(['2', '3']) // em · lượt
    expect(the.querySelector('.mc-ln-chua header em')!.textContent).toBe('3 lượt')
    expect([...the.querySelectorAll('.mc-ln-chua .mc-pl')].map((x) => x.textContent)).toEqual(['Trần An≈ 40 giây', 'Trần An95 giây', 'Lê Bìnhchưa đo giờ'])
    expect(the.querySelector('.mc-pl')!.getAttribute('title')).toBe('10:00 · 03/10 · Lên bảng') // nơi + giờ VN nằm ở chú thích của thẻ tên
    expect(panel.textContent).toContain('≈ là số giây ước tính') // chú thích chỉ khi có lượt ước tính
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
    // không lượt nào có `mucLam` (lượt cũ) ⇒ ba lượt đều ở làn "Chưa có số đo"; số giây thật không "≈", "chưa đo giờ" cho lượt không đo; không chú thích ước tính
    expect([...panel.querySelectorAll('.mc-ln-chua .mc-pl u')].map((x) => x.textContent)).toEqual(['18 giây', '64 giây', 'chưa đo giờ'])
    expect(panel.textContent).not.toContain('≈')
    expect(panel.querySelector('.mc-ai-chan')!.textContent).toContain('Mức làm có từ khi máy em dùng đồng hồ mới')
  })
  it('(thầy 21/10, đo lại lượt cũ) lượt xếp từ giây đồng hồ cũ / ước tính (mucLam.uocTinh) ⇒ vẫn vào làn Mức làm với "≈" trước số giây + chú thích; lượt có số đo mới không "≈"', () => {
    const t = moTo()
    t.tuCha({ type: TIN_TO_CHIEU.KET_NOI, maPhien: MA })
    t.phim('x')
    const m = t.gui.filter((g) => g.type === TIN_TO_CHIEU.AI_SAI)
    const muc = (ma: number, giay: number, o: Record<string, unknown> = {}) => ({ ma, giay, giayDoc: 24, sanNghi: 6, ranh2: 24, ranh3: 30, ...o })
    t.tuCha({
      type: TIN_TO_CHIEU.AI_SAI_TRA, maPhien: MA, id: m[0]!.id,
      ds: [
        { sbd: 'S1', ten: 'Nguyễn Đức Anh', luc: '2026-10-26T11:48:00Z', noi: 'Ôn lại', giay: 9, uocTinh: true, mucLam: muc(1, 9, { uocTinh: 'uoc' }) },
        { sbd: 'S2', ten: 'Lê Thu Hà', luc: '2026-10-26T11:50:00Z', noi: 'Đảo', giay: 26, mucLam: muc(2, 26, { uocTinh: 'cu' }) },
        { sbd: 'S3', ten: 'Vũ Minh Quân', luc: '2026-10-26T11:52:00Z', noi: 'BTVN', giay: 40, mucLam: muc(3, 40) },
      ],
    })
    const panel = t.doc.querySelector('.mc-aisai')!
    expect([...panel.querySelectorAll('.mc-ln[data-m="1"] .mc-pl u, .mc-ln[data-m="2"] .mc-pl u, .mc-ln[data-m="3"] .mc-pl u')].map((x) => x.textContent)).toEqual(['≈ 9 giây', '≈ 26 giây', '40 giây'])
    expect(panel.querySelector('.mc-ln-chua')).toBeNull() // không còn lượt nào "Chưa có số đo"
    expect(panel.querySelector('.mc-ai-chan')!.textContent).toContain('≈ là số giây ước tính hoặc đo bằng đồng hồ cũ')
  })
  it('(thầy 21/10) Mức làm 1–4: làn theo mức với khoảng giây lấy từ ranh giới máy chủ gửi; thẻ tên + giây; thanh 4 mức; câu chưa đủ mẫu ⇒ không Mức làm 4', () => {
    const t = moTo()
    t.tuCha({ type: TIN_TO_CHIEU.KET_NOI, maPhien: MA })
    t.phim('x')
    const m = t.gui.filter((g) => g.type === TIN_TO_CHIEU.AI_SAI)
    const muc = (ma: number, giay: number, o: Record<string, unknown> = {}) => ({ ma, giay, giayDoc: 24, sanNghi: 6, ranh2: 24, ranh3: 30, ...o })
    t.tuCha({
      type: TIN_TO_CHIEU.AI_SAI_TRA, maPhien: MA, id: m[0]!.id, conNua: true,
      ds: [
        { sbd: 'S1', ten: 'Nguyễn Đức Anh', luc: '2026-10-26T11:48:00Z', noi: 'BTVN', giay: 9, mucLam: muc(1, 9) },
        { sbd: 'S2', ten: 'Lê Thu Hà', luc: '2026-10-26T11:50:00Z', noi: 'BTVN', giay: 26, mucLam: muc(2, 26) },
        { sbd: 'S3', ten: 'Vũ Minh Quân', luc: '2026-10-26T11:52:00Z', noi: 'BTVN', giay: 40, mucLam: muc(3, 40) },
        { sbd: 'S4', ten: 'Đỗ Khánh Linh', luc: '2026-10-25T11:52:00Z', noi: 'Tự sửa lỗi', giay: 12, uocTinh: true },
      ],
    })
    const panel = t.doc.querySelector('.mc-aisai')!
    expect(chuLan(panel)).toEqual([
      'Mức làm 1Chưa đọc hết đề · dưới 24 giây1 lượt|Nguyễn Đức Anh9 giây', // jsdom không đo bố cục ⇒ giữ tên đầy đủ; bản viết tắt nằm ở data-t
      'Mức làm 2Đọc xong, chưa kịp nghĩ · 24–29 giây1 lượt|Lê Thu Hà26 giây',
      'Mức làm 3Có nghĩ · từ 30 giây1 lượt|Vũ Minh Quân40 giây', // không ranh4 ⇒ Mức làm 3 mở tới hết thước
      'Mức làm 4Lớp chưa đủ mẫu của câu này, hoặc số giây là ước tính, nên chưa xếp Mức làm 4|',
      'Chưa có số đoLượt chưa có số giây đáng tin để xếp mức1 lượt|Đỗ Khánh Linh≈ 12 giây',
    ])
    expect(panel.querySelector('.mc-pl b')!.getAttribute('data-t')).toBe('Nguyễn Đ. Anh') // tên viết tắt chữ đệm khi thẻ hẹp
    expect([...panel.querySelectorAll('.mc-ai-tn > i')].map((i) => [i.getAttribute('data-m'), i.textContent])).toEqual([['1', '1'], ['2', '1'], ['3', '1'], ['0', '1']])
    expect(panel.querySelector('.mc-ai-thuoc')!.textContent).toBe('Đọc hết đề cần24 giâyNghĩ từ 30 giây')
    const chan = panel.querySelector('.mc-ai-chan')!.textContent!
    expect(chan).toContain('thời gian đọc hết đề (24 giây) và sàn nghĩ (6 giây)')
    expect(chan).toContain('300 lượt gần nhất')
    expect(chan).toContain('≈ là số giây ước tính')
    // có ranh4 ⇒ Mức làm 3 có khoảng đóng, Mức làm 4 "từ N giây"
    t.phim('x')
    const m2 = t.gui.filter((g) => g.type === TIN_TO_CHIEU.AI_SAI)
    t.tuCha({ type: TIN_TO_CHIEU.AI_SAI_TRA, maPhien: MA, id: m2[1]!.id, ds: [{ sbd: 'S9', ten: 'Em Chín', luc: '2026-10-26T11:48:00Z', noi: 'BTVN', giay: 70, mucLam: muc(4, 70, { ranh4: 60 }) }] })
    expect(chuLan(t.doc.querySelector('.mc-aisai')!).slice(2)).toEqual(['Mức làm 3Có nghĩ · 30–59 giây', 'Mức làm 4Làm kỹ · từ 60 giây1 lượt|Em Chín70 giây'].map((x, i) => (i === 0 ? x + '|' : x)))
  })
  it('(thầy 21/10) hai mã gốc cùng một câu chiếu: lượt đầu thuộc mã chưa có β (không ranh4), lượt sau xếp Mức làm 4 ⇒ làn Mức làm 4 vẫn hiện TÊN em (không báo "chưa đủ mẫu")', () => {
    const t = moTo()
    t.tuCha({ type: TIN_TO_CHIEU.KET_NOI, maPhien: MA })
    t.phim('x')
    const m = t.gui.filter((g) => g.type === TIN_TO_CHIEU.AI_SAI)
    const muc = (ma: number, giay: number, o: Record<string, unknown> = {}) => ({ ma, giay, giayDoc: 24, sanNghi: 6, ranh2: 24, ranh3: 30, ...o })
    t.tuCha({
      type: TIN_TO_CHIEU.AI_SAI_TRA, maPhien: MA, id: m[0]!.id,
      ds: [
        { sbd: 'S1', ten: 'Nguyễn Đức Anh', luc: '2026-10-26T11:48:00Z', noi: 'BTVN', giay: 9, mucLam: muc(1, 9) },
        { sbd: 'S2', ten: 'Lê Thu Hà', luc: '2026-10-26T11:50:00Z', noi: 'BTVN', giay: 70, mucLam: muc(4, 70, { ranh4: 60 }) },
      ],
    })
    const lan = chuLan(t.doc.querySelector('.mc-aisai')!)
    expect(lan.some((x) => x.startsWith('Mức làm 4') && x.includes('Lê Thu Hà70 giây'))).toBe(true)
    expect(lan.some((x) => x.includes('chưa đủ mẫu'))).toBe(false)
  })
  it('(thầy 21/10) HAI THẺ: đã điểm danh (em có mặt) · cả lớp (mọi em của lớp, vắng đánh dấu vòng tròn rỗng) — số em / sĩ số, thanh 4 mức riêng từng thẻ', () => {
    const t = moTo()
    t.tuCha({ type: TIN_TO_CHIEU.KET_NOI, maPhien: MA })
    t.phim('x')
    const m = t.gui.filter((g) => g.type === TIN_TO_CHIEU.AI_SAI)
    const muc = (ma: number, giay: number) => ({ ma, giay, giayDoc: 24, sanNghi: 6, ranh2: 24, ranh3: 30, ranh4: 60 })
    t.tuCha({
      type: TIN_TO_CHIEU.AI_SAI_TRA, maPhien: MA, id: m[0]!.id,
      lop: { soLop: 34, soCoMat: 28, coMat: ['S1', 'S2'] },
      ds: [
        { sbd: 'S1', ten: 'Nguyễn Đức Anh', luc: '2026-10-26T11:48:00Z', noi: 'BTVN', giay: 9, mucLam: muc(1, 9) },
        { sbd: 'S2', ten: 'Lê Thu Hà', luc: '2026-10-26T11:50:00Z', noi: 'BTVN', giay: 66, mucLam: muc(4, 66) },
        { sbd: 'S2', ten: 'Lê Thu Hà', luc: '2026-10-25T11:50:00Z', noi: 'BTVN', giay: 20, mucLam: muc(1, 20) },
        { sbd: 'S7', ten: 'Vũ Minh Quân', luc: '2026-10-26T11:52:00Z', noi: 'BTVN', giay: 15, mucLam: muc(1, 15) },
      ],
    })
    const panel = t.doc.querySelector('.mc-aisai')!
    const the = [...panel.querySelectorAll('.mc-ai-the')]
    expect(the.map((x) => x.getAttribute('data-k'))).toEqual(['dd', 'lop'])
    expect(the.map((x) => [...x.querySelectorAll('.mc-ai-so p')].map((p) => p.textContent))).toEqual([
      ['2/ 28 em có mặt làm sai', '3lượt sai'],
      ['3/ 34 em của lớp làm sai', '4lượt sai'],
    ])
    expect(the[0]!.querySelector('.mc-ai-ky')!.textContent).toBe('ĐÃ ĐIỂM DANH')
    expect(the[1]!.querySelector('.mc-ai-ky')!.textContent).toBe('CẢ LỚP')
    expect(the[0]!.querySelectorAll('.mc-vg')).toHaveLength(0)
    // thẻ cả lớp: em vắng (S7 không có trong coMat) có vòng tròn rỗng; em có mặt thì không
    const vang = [...the[1]!.querySelectorAll('.mc-pl')].filter((x) => x.querySelector('.mc-vg')).map((x) => x.querySelector('b')!.textContent)
    expect(vang).toEqual(['Vũ Minh Quân'])
    expect(the[1]!.querySelector('.mc-ai-ph')!.textContent).toContain('em vắng buổi này')
    expect([...the[0]!.querySelectorAll('.mc-ai-tn > i')].map((i) => [i.getAttribute('data-m'), i.textContent])).toEqual([['1', '2'], ['4', '1']])
    expect([...the[1]!.querySelectorAll('.mc-ai-tn > i')].map((i) => [i.getAttribute('data-m'), i.textContent])).toEqual([['1', '3'], ['4', '1']])
  })
  it('(thầy 21/10) buổi chưa điểm danh: thẻ "Đã điểm danh" báo rõ (không để trống), thẻ cả lớp vẫn đủ; lớp trả về không có em sai ⇒ câu riêng của lớp', () => {
    const t = moTo()
    t.tuCha({ type: TIN_TO_CHIEU.KET_NOI, maPhien: MA })
    t.phim('x')
    const m = t.gui.filter((g) => g.type === TIN_TO_CHIEU.AI_SAI)
    t.tuCha({ type: TIN_TO_CHIEU.AI_SAI_TRA, maPhien: MA, id: m[0]!.id, lop: { soLop: 34, soCoMat: null, coMat: null }, ds: [{ sbd: 'S1', ten: 'Em Một', luc: '2026-10-26T11:48:00Z', noi: 'BTVN', giay: 9 }] })
    const panel = t.doc.querySelector('.mc-aisai')!
    expect(panel.querySelector('.mc-ai-the[data-k="dd"] .mc-ai-rong b')!.textContent).toBe('Buổi này chưa điểm danh')
    expect(panel.querySelector('.mc-ai-the[data-k="lop"] .mc-ai-so b')!.textContent).toBe('1')
    expect(panel.querySelectorAll('.mc-vg').length).toBe(0) // chưa điểm danh ⇒ không biết ai vắng ⇒ không đánh dấu vòng tròn
    t.phim('x')
    const m2 = t.gui.filter((g) => g.type === TIN_TO_CHIEU.AI_SAI)
    t.tuCha({ type: TIN_TO_CHIEU.AI_SAI_TRA, maPhien: MA, id: m2[1]!.id, lop: { soLop: 34, soCoMat: 28, coMat: ['S1'] }, ds: [] })
    expect(t.doc.querySelector('.mc-sai-tt')!.textContent).toBe('Chưa em nào của lớp làm sai câu này.')
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
