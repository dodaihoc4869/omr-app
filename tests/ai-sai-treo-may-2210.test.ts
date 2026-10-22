// MỨC LÀM 6 MỨC TRÊN TỜ CHIẾU (thầy duyệt bản vẽ docs/ban-ve-muc-lam-6-muc-2210 ngày 22/10). Tờ chiếu là MÀN CÔNG KHAI:
//   · «Ai đã sai?» (phím X): lượt TREO rời làn Mức 1–4 sang làn «Treo máy» (thẻ tên ghi số phút treo), thanh có đoạn Treo; chưa lượt nào đo treo ⇒ làn nét đứt nói thật;
//   · Mức 6 «Cố tình treo máy» KHÔNG BAO GIỜ lên tờ: app hạ 'co_tinh' ⇒ 'treo' ở `aiSaiQuaMayChu` (tin AI_SAI_TRA) và `layHoSoLenBang` (tin HO_SO_TRA); tờ cũng gộp mọi lượt treo;
//   · máy chiếu 4:3: hai nút chuyển thẻ (phím S — L đã là "gọi lên bảng");
//   · bảng chi tiết em: lần làm treo ⇒ chip «Treo máy · N phút», không thước Mức làm; «Cách làm bài 14 ngày» có dòng treo máy.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { JSDOM, VirtualConsole } from 'jsdom'
import { taoHtmlMayChieu, type OBang } from '../src/lib/html-may-chieu'
import { TIN_TO_CHIEU } from '../src/lib/to-chieu-cau-noi'

vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may-chu-gia.example.com' }) }))
vi.mock('../src/lib/exam-db', () => ({ loadTeacherSecret: async () => 'mat-gia' }))
const { aiSaiQuaMayChu } = await import('../src/components/chien-dich/ghi-to-chieu')
const { haCoTinhHoSo } = await import('../src/lib/ho-so-em-thay')

afterEach(() => vi.unstubAllGlobals())

const MA = 'PHIEN-treo'
const GOC = 'http://localhost:3000'
const o = (sbd: string, hoTen = `Em ${sbd}`): OBang => ({
  sbd, hoTen, qid: `Q-${sbd}`, soCau: 1, sao: 1,
  cau: { phan: 'I', id: `Q-${sbd}`, text: 'Câu ngắn', luaChon: ['A', 'B', 'C', 'D'], dapAn: 'A', buoc: [] } as unknown as OBang['cau'],
})
function moTo() {
  const cha = new JSDOM('<!doctype html><body></body>', { url: `${GOC}/` }).window as unknown as Window & { postMessage: (m: unknown, o?: string) => void }
  const gui: Record<string, unknown>[] = []
  cha.postMessage = ((m: Record<string, unknown>) => void gui.push(m)) as never
  const dom = new JSDOM(taoHtmlMayChieu([o('A'), o('B')], { cauNoi: { maPhien: MA } }), {
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
  const tuCha = (data: Record<string, unknown>) =>
    dom.window.dispatchEvent(new (dom.window as unknown as { MessageEvent: typeof MessageEvent }).MessageEvent('message', { data: { maPhien: MA, ...data }, origin: GOC, source: cha as unknown as MessageEventSource }))
  const phim = (key: string) => doc.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key, bubbles: true }))
  return { doc, gui, tuCha, phim }
}
const muc = (ma: number, giay: number, x: Record<string, unknown> = {}) => ({ ma, giay, giayDoc: 24, sanNghi: 6, ranh2: 24, ranh3: 30, ranh4: 60, thuong: 75, ...x })
const luot = (sbd: string, ten: string, mucLam?: Record<string, unknown>) => ({ sbd, ten, luc: '2026-10-26T11:48:00Z', noi: 'BTVN', giay: mucLam ? (mucLam.giay as number) : 12, ...(mucLam ? { mucLam } : {}) })
const chuLan = (el: Element) => [...el.querySelectorAll('.mc-ln')].map((l) => `${l.querySelector('header')!.textContent}|${[...l.querySelectorAll('.mc-pl')].map((p) => p.textContent).join(' ')}`)

function moAiSai(t: ReturnType<typeof moTo>, ds: unknown[], lop?: Record<string, unknown>) {
  t.tuCha({ type: TIN_TO_CHIEU.KET_NOI })
  t.phim('x')
  const m = t.gui.filter((g) => g.type === TIN_TO_CHIEU.AI_SAI)
  t.tuCha({ type: TIN_TO_CHIEU.AI_SAI_TRA, id: m[m.length - 1]!.id, ds, ...(lop ? { lop } : {}) })
  return t.doc.querySelector('.mc-aisai')!
}

describe('«Ai đã sai?» — làn Treo máy', () => {
  it('lượt treo RỜI làn Mức 1–4 sang làn Treo máy (xếp theo phút treo giảm dần), thanh có đoạn Treo; lọt "co_tinh" vẫn chỉ là Treo; không chữ "Cố tình" nào', () => {
    const t = moTo()
    const panel = moAiSai(t, [
      luot('S1', 'Nguyễn Đức Anh', muc(1, 9, { daDoTreo: true })),
      luot('S2', 'Tô Gia Hân', muc(3, 40, { treo: 'treo', giayTreo: 420 })), // giây 40 ⇒ lẽ ra Mức 3: phải RỜI làn 3
      luot('S3', 'Trần Bảo Châu', muc(2, 27, { treo: 'co_tinh', giayTreo: 720 })), // Mức 6 lọt tới tờ ⇒ vẫn chỉ là Treo máy
      luot('S4', 'Lương Tuệ Minh', muc(4, 61, { daDoTreo: true })),
    ])
    expect(chuLan(panel)).toEqual([
      'Mức làm 1Chưa đọc hết đề · dưới 24 giây · số = giây làm1 lượt|Nguyễn Đức Anh9 giây',
      'Mức làm 2Đọc xong, chưa kịp nghĩ · 24–29 giây|',
      'Mức làm 3Có nghĩ · 30–59 giây|',
      'Mức làm 4Làm kỹ · từ 60 giây · số = giây làm1 lượt|Lương Tuệ Minh61 giây',
      'Treo máymáy để treo lâu rồi mới nộp · số = phút treo2 lượt|Trần Bảo Châu12 phút Tô Gia Hân7 phút',
    ])
    expect([...panel.querySelectorAll('.mc-ai-tn > i')].map((i) => [i.getAttribute('data-m'), i.textContent])).toEqual([['1', '1'], ['4', '1'], ['5', '2']])
    expect(panel.querySelector('.mc-ai-tn')!.getAttribute('aria-label')).toContain('treo máy: 2 lượt')
    expect(panel.querySelector('.mc-ai-chan')!.textContent).toContain('Lượt treo máy không xếp Mức làm 1–4')
    expect(panel.innerHTML).not.toMatch(/Cố tình|cố tình|co_tinh|coTinh/)
  })

  it('đã có lượt đo treo mà không lượt nào treo ⇒ làn Treo mờ «Không lượt nào để máy treo»; chưa lượt nào đo treo (lượt cũ) ⇒ làn nét đứt «Chưa đo»', () => {
    const a = moAiSai(moTo(), [luot('S1', 'Em Một', muc(1, 9, { daDoTreo: true }))])
    expect(a.querySelector('.mc-ln-treo')!.classList.contains('mc-ln-rong')).toBe(true)
    expect(a.querySelector('.mc-ln-treo')!.textContent).toContain('Không lượt nào để máy treo')
    const b = moAiSai(moTo(), [luot('S1', 'Em Một', muc(1, 9))])
    expect(b.querySelector('.mc-ln-treo-chua')!.textContent).toContain('Chưa đo')
  })

  it('hai thẻ (có lớp) ⇒ có nút chuyển «Đã điểm danh / Cả lớp» (phím S); bấm ⇒ đổi thẻ đang hiện, aria-selected theo', () => {
    const t = moTo()
    const panel = moAiSai(t, [luot('S1', 'Em Một', muc(1, 9, { daDoTreo: true })), luot('S2', 'Em Hai', muc(3, 40, { treo: 'treo', giayTreo: 400 }))], { soLop: 3, soCoMat: 1, coMat: ['S1'] })
    const nut = [...panel.querySelectorAll<HTMLButtonElement>('.mc-ai-tab button')]
    expect(nut.map((b) => b.textContent)).toEqual(['Đã điểm danh · 1 em', 'Cả lớp · 2 em S'])
    expect(panel.querySelector('.mc-ai-hai')!.getAttribute('data-tab')).toBe('dd')
    nut[1]!.click()
    expect(panel.querySelector('.mc-ai-hai')!.getAttribute('data-tab')).toBe('lop')
    expect(nut.map((b) => b.getAttribute('aria-selected'))).toEqual(['false', 'true'])
  })
})

describe('Mức 6 không lên tờ chiếu — app hạ trước khi gửi', () => {
  it('aiSaiQuaMayChu: lượt «co_tinh» ⇒ «treo» (giữ giayTreo); lượt khác đi nguyên; tin không còn chữ co_tinh', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ok: true, conNua: false, ds: [
      luot('A', 'Em A', muc(3, 40, { treo: 'co_tinh', giayTreo: 600 })),
      luot('B', 'Em B', muc(1, 9, { daDoTreo: true })),
    ] }), { status: 200, headers: { 'content-type': 'application/json' } })))
    const r = await aiSaiQuaMayChu(['Q1'])
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.ds[0]!.mucLam).toMatchObject({ treo: 'treo', giayTreo: 600, ma: 3 })
    expect(r.ds[1]!.mucLam).toMatchObject({ ma: 1, daDoTreo: true })
    expect(JSON.stringify(r)).not.toContain('co_tinh')
  })

  it('haCoTinhHoSo: cachLam14 gộp soCoTinh vào soTreo; lần làm co_tinh ⇒ treo; hồ sơ không có Mức 6 ⇒ trả NGUYÊN đối tượng', () => {
    const hs = {
      em: { hoTen: 'Em A' },
      cauNay: { soLan: 2, lan: [{ dung: false, mucLam: muc(2, 27, { treo: 'co_tinh', giayTreo: 700 }) }, { dung: true, mucLam: muc(1, 9) }] },
      cachLam14: { soDo: 6, soTreo: 1, soCoTinh: 3, theoMuc: [] },
    }
    const ra = haCoTinhHoSo(hs)
    expect(ra.cachLam14).toMatchObject({ soTreo: 4, soCoTinh: 0, soDo: 6 })
    expect((ra.cauNay as { lan: { mucLam: { treo?: string } }[] }).lan.map((l) => l.mucLam.treo)).toEqual(['treo', undefined])
    expect(JSON.stringify(ra)).not.toContain('co_tinh')
    expect(hs.cachLam14.soCoTinh).toBe(3) // không sửa đầu vào
    const sach = { em: {}, cachLam14: { soDo: 1, soTreo: 0, soCoTinh: 0 } }
    expect(haCoTinhHoSo(sach)).toBe(sach)
  })
})

describe('bảng chi tiết em trên tờ — lần làm treo + «Cách làm bài 14 ngày»', () => {
  it('lần treo ⇒ chip «Treo máy · N phút», không thước Mức làm; tổng 14 ngày có dòng treo máy và đoạn Treo trên thanh', () => {
    const t = moTo()
    t.tuCha({ type: TIN_TO_CHIEU.KET_NOI })
    t.phim('l')
    ;(t.doc.querySelector('.mc-em[id]') as HTMLElement | null)?.click()
    const xin = t.gui.find((m) => m.type === TIN_TO_CHIEU.HO_SO)
    expect(xin).toBeTruthy()
    t.tuCha({ type: TIN_TO_CHIEU.HO_SO_TRA, id: xin!.id, hoSo: {
      em: { hoTen: 'Em A' },
      cauNay: { soLan: 2, soDung: 0, soSai: 2, lan: [
        { luc: '2026-10-24T13:12:00Z', dung: false, coGoiY: false, nguon: 'BTVN', giay: 40, chon: 'B', mucLam: muc(3, 40, { treo: 'treo', giayTreo: 480 }) },
        { luc: '2026-10-26T11:48:00Z', dung: false, coGoiY: false, nguon: 'BTVN', giay: 9, chon: 'C', mucLam: muc(1, 9, { daDoTreo: true }) },
      ] },
      cachLam14: { soDo: 5, chuaCoSoDo: 0, theoMuc: [{ ma: 1, luot: 2, dung: 0, sai: 2 }, { ma: 2, luot: 0, dung: 0, sai: 0 }, { ma: 3, luot: 1, dung: 1, sai: 0 }, { ma: 4, luot: 0, dung: 0, sai: 0 }], saiLamVoi: 2, saiDuNghi: 0, dungTruocDoc: 0, coBetaThat: true, soUocTinh: 0, soTreo: 2, soCoTinh: 0, soChuaDoTreo: 0 },
    } })
    const ct = t.doc.querySelector('.mc-ct')!
    const lanTreo = [...ct.querySelectorAll('.mc-lanl')].find((l) => l.textContent!.includes('Treo máy'))!
    expect(lanTreo.querySelector('.mc-chm-treo')!.textContent).toBe('Treo máy 8 phút')
    expect(lanTreo.querySelector('.mc-th')).toBeNull()
    expect(lanTreo.querySelector('.mc-lanl-gt')!.textContent).toContain('không xếp Mức làm 1–4')
    const cach = ct.querySelector('.mc-cach')!
    expect(cach.querySelector('.mc-ket-treo')!.textContent).toContain('2 lượt treo máy')
    expect([...cach.querySelectorAll('.mc-ai-tn > i')].map((i) => [i.getAttribute('data-m'), i.textContent])).toEqual([['1', '2'], ['3', '1'], ['5', '2']])
    expect(ct.innerHTML).not.toMatch(/Cố tình|cố tình/)
  })
})
