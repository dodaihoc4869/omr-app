// NÚT ĐẠT / KHÔNG ĐẠT TRÊN TỜ MÁY CHIẾU — ĐẦU-CUỐI QUA MÀN GIÁO VIÊN THẬT (GĐ 6 làn giáo viên, mốc d).
//
// Màn giáo viên (React thật, máy chủ giả) mở tờ chiếu vào `KhungXemPhieu`; tờ chiếu do CHÍNH `taoHtmlMayChieu` dựng
// (lấy từ `srcdoc` của iframe) được nạp vào một JSDOM riêng, và hai bên được NỐI TAY bằng hai đoạn chuyển tin:
//   tờ → cha:  `parent.postMessage`  ⇒ `MessageEvent` tại `window` của màn (source = iframe.contentWindow, origin = gốc app)
//   cha → tờ:  `iframe.contentWindow.postMessage` ⇒ `MessageEvent` tại cửa sổ tờ (source = cha, origin = gốc cha)
// Nên đây là giao thức thật hai đầu, không phải mô phỏng từng nửa.
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { cleanup, fireEvent, render, waitFor, act } from '@testing-library/react'
import { JSDOM, VirtualConsole } from 'jsdom'
import type { CaTomTat } from '../src/lib/exam-api'
import type { TeacherExamSource } from '../src/data/examContent'

const m = vi.hoisted(() => ({ ghi: vi.fn(), hoSo: vi.fn() }))

const ca = (maCa: string): CaTomTat =>
  ({ maCa, tenCa: `Ca ${maCa}`, lop: '12', daVao: 10, daNop: 10, lenBang: false, trangThai: 'dong', batDau: '2026-09-09T00:00:00.000Z', hetHanVao: '2026-09-09T01:00:00.000Z' }) as unknown as CaTomTat

const DE: TeacherExamSource = {
  maDe: 'CA',
  phanI: Array.from({ length: 6 }, (_, i) => ({
    id: `q${i + 1}`,
    text: `TN ${i + 1}`,
    choices: ['a', 'b', 'c', 'd'],
    correct: 'A',
    chuyenDe: i % 2 ? 'Ester' : 'Lipid',
    mucDo: 'hieu',
    canChua: { sao: 2, dk: [], ly_do: '', bay: null },
  })),
  phanII: [],
  phanIII: [],
} as unknown as TeacherExamSource

const LUOT = Array.from({ length: 10 }, (_, i) => ({
  sbd: `120${String(i).padStart(2, '0')}`,
  hoTen: `Em ${i + 1}`,
  lanThu: 1,
  trangThai: 'da_nop',
  dapAn: { phanI: Object.fromEntries(DE.phanI.map((q, j) => [q.id, j <= i % 4 ? 'B' : 'A'])), phanII: {}, phanIII: {} },
  giayCau: Object.fromEntries(DE.phanI.map((q, j) => [q.id, 20 + j * 5 + i])),
}))

vi.mock('../src/lib/exam-api', async (goc) => ({
  ...(await goc<Record<string, unknown>>()),
  danhSachCa: async () => [ca('111111')],
  chiTietCa: async () => ({ ca: { maCa: '111111', tenCa: 'Ca 111111', lop: '12' }, keyBank: { phanI: DE.phanI, phanII: [], phanIII: [] }, luot: LUOT }),
  hoSoEm: async ({ sbd }: { sbd: string }) => ({ em: { sbd, hoTen: `Em ${sbd}` }, chuyenDe: [{ ten: 'Ester', soCau: 4, soSai: 2 }] }),
  lichSuLenBang: async () => ({ soNgay: 30, theoEm: {} }),
  thanThuLopDocApi: async () => null,
  ghiLenBang: (...a: unknown[]) => m.ghi(...a),
  goiHoSoLopLenBang: (...a: unknown[]) => m.hoSo(...a),
}))
vi.mock('../src/lib/exam-db', () => ({
  loadScriptUrl: async () => 'https://x',
  loadTeacherSecret: async () => 'mat',
  loadExamSources: async () => [DE],
  loadSessionTeacherBank: async () => undefined,
  docKhoChuaCa: async () => [DE],
  docKhoDoKho: async () => undefined,
  luuKhoDoKho: async () => {},
}))
vi.mock('../src/lib/may-chu-moi', async (goc) => ({ ...(await goc<Record<string, unknown>>()), layCauHinhMayChu: async () => ({ BAT: true, URL: 'https://x' }) }))
const toast = vi.fn()
vi.mock('../src/store/appStore', () => ({ useAppStore: (sel: (s: Record<string, unknown>) => unknown) => sel({ setScreen: vi.fn(), showToast: toast }) }))

const { default: GoiLenBangScreen } = await import('../src/screens/GoiLenBangScreen')
const { TIN_TO_CHIEU } = await import('../src/lib/to-chieu-cau-noi')

const CHO = { timeout: 20000 }
const emRong = { chuyenDe: [], qidSai: [], qidDaLam: [], lenBang: { soLan: 0, lanCuoi: '', qids: [] } }

beforeEach(() => {
  cleanup()
  m.ghi.mockReset()
  m.ghi.mockResolvedValue(undefined)
  m.hoSo.mockReset()
  m.hoSo.mockImplementation(async () => ({ em: Object.fromEntries(LUOT.map((l) => [l.sbd, emRong])) }))
  toast.mockReset()
})

async function moBuoiChua() {
  const r = render(<GoiLenBangScreen />)
  await waitFor(() => expect(r.getByText('Ca 111111')).toBeTruthy(), CHO)
  fireEvent.click(r.getByText('Ca 111111'))
  await waitFor(() => expect([...r.container.querySelectorAll('button')].some((b) => (b.textContent ?? '').includes('Xếp giờ'))).toBe(true), CHO)
  fireEvent.click([...r.container.querySelectorAll('button')].find((b) => (b.textContent ?? '').includes('Xếp giờ')) as HTMLButtonElement)
  await waitFor(() => expect(r.container.querySelector('[data-khoi="buoi-chua"]')).toBeTruthy(), CHO)
  return r
}

const dongBuoi = (r: ReturnType<typeof render>) => [...r.container.querySelectorAll('[data-dong-buoi]')] as HTMLElement[]
const nutBang = (d: HTMLElement, chu: 'Đạt' | 'Không đạt') => [...d.querySelectorAll('button')].find((b) => (b.textContent ?? '').trim() === chu) as HTMLButtonElement | undefined

/** Bấm "Chiếu lên bảng ngay", chờ khung tờ chiếu, và trả về HTML thật của tờ. */
async function chieuLenBang(r: ReturnType<typeof render>) {
  const nut = [...r.container.querySelectorAll('button')].find((b) => (b.textContent ?? '').includes('Chiếu lên bảng ngay')) as HTMLButtonElement
  fireEvent.click(nut)
  await waitFor(() => expect(document.querySelector('.lop-xem-phieu iframe')).toBeTruthy(), CHO)
  const khung = document.querySelector('.lop-xem-phieu iframe') as HTMLIFrameElement
  const html = khung.getAttribute('srcdoc') ?? ''
  expect(html).toContain('data-cau-noi=')
  // Khung xuất hiện ở DOM TRƯỚC khi hiệu ứng thụ động của React gắn bộ nghe tin (`useEffect([htmlMayChieu])`).
  // Không xả ở đây thì tin gửi ngay sau đó rơi vào khoảng trống — lúc máy tải nặng test "bấm đúp" đỏ ngẫu nhiên (1/6 lần),
  // còn các test "bỏ tin lạ" thì xanh SUÔNG (không ai nghe thì đương nhiên không ghi).
  await act(async () => {})
  return { khung, html, ma: /data-cau-noi="([^"]+)"/.exec(html)![1], khoa: [...html.matchAll(/data-khoa="([^"]+)"/g)].map((x) => x[1]) }
}

/** Nạp HTML tờ vào một JSDOM riêng và NỐI HAI ĐẦU bằng chuyển tin — BẤT ĐỒNG BỘ như `postMessage` thật
 * (tờ chạy script ngay lúc dựng, khi đó tờ chưa kịp gán xong nên tin phải giao sau một nhịp). */
function noiTo(khung: HTMLIFrameElement, html: string) {
  const cha = new JSDOM('<!doctype html><body></body>', { url: `${window.location.origin}/` }).window as unknown as Window
  const w0 = khung.contentWindow as Window
  const hen: { f: () => void; ms: number; iv: boolean; id: number; huy: boolean }[] = []
  let dom!: JSDOM
  const tuCha = (data: unknown) =>
    dom.window.dispatchEvent(new (dom.window as unknown as { MessageEvent: typeof MessageEvent }).MessageEvent('message', { data, origin: `${window.location.origin}`, source: cha as unknown as MessageEventSource }))
  // cha → tờ: màn giáo viên gọi `khung.contentWindow.postMessage`
  const spy = vi.spyOn(w0, 'postMessage').mockImplementation(((data: unknown) => {
    setTimeout(() => tuCha(data), 0)
  }) as never)
  dom = new JSDOM(html, {
    runScripts: 'dangerously',
    virtualConsole: new VirtualConsole(),
    beforeParse(w) {
      Object.defineProperty(w, 'parent', { get: () => cha, configurable: true })
      let id = 0
      w.setTimeout = ((f: () => void, ms: number) => (hen.push({ f, ms, iv: false, id: ++id, huy: false }), id)) as never
      w.setInterval = ((f: () => void, ms: number) => (hen.push({ f, ms, iv: true, id: ++id, huy: false }), id)) as never
      w.clearTimeout = w.clearInterval = ((h: number) => {
        const x = hen.find((t) => t.id === h)
        if (x) x.huy = true
      }) as never
      w.HTMLElement.prototype.scrollTo = () => {}
      // tờ → cha: đúng như trình duyệt (source = khung iframe, origin = gốc app)
      ;(cha as unknown as { postMessage: unknown }).postMessage = (data: unknown) => {
        setTimeout(() => {
          act(() => {
            window.dispatchEvent(new MessageEvent('message', { data, origin: window.location.origin, source: w0 }))
          })
        }, 0)
      }
    },
  })
  return { dom, doc: dom.window.document, spy, hen, chayNhip: () => hen.filter((t) => !t.huy && t.iv).forEach((t) => t.f()) }
}

const daBam = (doc: Document, khoa: string, chu: 'Đạt' | 'Chưa đạt') =>
  ([...doc.querySelectorAll<HTMLElement>('.mc-cham')].find((v) => v.getAttribute('data-khoa') === khoa)!.querySelectorAll<HTMLButtonElement>('.mc-cham-nut') as NodeListOf<HTMLButtonElement>)
const nutTo = (doc: Document, khoa: string, chu: 'Đạt' | 'Chưa đạt') => [...daBam(doc, khoa, chu)].find((b) => b.textContent === chu)!
const vungTo = (doc: Document, khoa: string) => [...doc.querySelectorAll<HTMLElement>('.mc-cham')].find((v) => v.getAttribute('data-khoa') === khoa)!

describe('tờ chiếu ↔ màn giáo viên: bắt tay và ghi kết quả (giao thức thật hai đầu)', () => {
  it('mở tờ ⇒ bắt tay xong nút mới hiện (lớp mc-noi)', async () => {
    const r = await moBuoiChua()
    const { khung, html } = await chieuLenBang(r)
    const t = noiTo(khung, html)
    await waitFor(() => expect(t.doc.body.classList.contains('mc-noi')).toBe(true), CHO)
  }, 60000)

  it('bấm ĐẠT trên tờ ⇒ `ghiLenBang` ĐÚNG MỘT lần (url, mật khẩu, sbd, chuyên đề, dat, qid); tờ chỉ còn "Đã ghi"; bảng buổi chữa khoá', async () => {
    const r = await moBuoiChua()
    const { khung, html, khoa } = await chieuLenBang(r)
    const t = noiTo(khung, html)
    await waitFor(() => expect(t.doc.body.classList.contains('mc-noi')).toBe(true), CHO)
    const [sbd, qid] = khoa[0].split('|')

    nutTo(t.doc, khoa[0], 'Đạt').click()
    await waitFor(() => expect(m.ghi).toHaveBeenCalledTimes(1), CHO)
    const [url, mat, goi] = m.ghi.mock.calls[0]
    expect(url).toBe('https://x')
    expect(mat).toBe('mat')
    expect(goi).toEqual({ sbd, chuyenDe: expect.stringMatching(/Ester|Lipid/), dat: true, qid })
    await waitFor(() => expect(vungTo(t.doc, khoa[0]).textContent).toBe('Đã ghi'), CHO)

    // bảng buổi chữa (màn giáo viên) thấy CHI TIẾT và cũng khoá — MỘT khoá chung `sbd|qid`
    const dong = dongBuoi(r).find((d) => d.getAttribute('data-dong-buoi') === khoa[0])!
    await waitFor(() => expect(dong.textContent).toContain('Đã ghi: Đạt'), CHO)
    expect(nutBang(dong, 'Đạt')).toBeUndefined()
  }, 60000)

  it('bấm KHÔNG ĐẠT ⇒ dat:false ở máy chủ và ở bảng giáo viên, nhưng TỜ CHIẾU chỉ hiện "Đã ghi" (không lộ)', async () => {
    const r = await moBuoiChua()
    const { khung, html, khoa } = await chieuLenBang(r)
    const t = noiTo(khung, html)
    await waitFor(() => expect(t.doc.body.classList.contains('mc-noi')).toBe(true), CHO)

    nutTo(t.doc, khoa[1], 'Chưa đạt').click()
    await waitFor(() => expect(m.ghi).toHaveBeenCalledTimes(1), CHO)
    expect(m.ghi.mock.calls[0][2]).toMatchObject({ dat: false })
    await waitFor(() => expect(vungTo(t.doc, khoa[1]).textContent).toBe('Đã ghi'), CHO)
    expect(vungTo(t.doc, khoa[1]).outerHTML).not.toMatch(/không đạt|đạt/i)

    const dong = dongBuoi(r).find((d) => d.getAttribute('data-dong-buoi') === khoa[1])!
    await waitFor(() => expect(dong.textContent).toContain('Đã ghi: Không đạt'), CHO)
    // Toàn bộ tờ chiếu sau khi ghi: KHÔNG có "Chưa đạt" ở ô vừa ghi (các ô chưa ghi vẫn còn nút bấm).
    const conTrongO = [...t.doc.querySelectorAll<HTMLElement>('.mc-nua')].filter((n) => n.querySelector(`.mc-cham[data-khoa="${khoa[1]}"]`))
    expect(conTrongO.length).toBe(1)
    expect(conTrongO[0].querySelector('.mc-cham')!.textContent).not.toContain('Chưa đạt')
  }, 60000)

  it('BẤM ĐÚP / tin CHAM gửi hai lần ⇒ máy chủ vẫn nhận ĐÚNG MỘT lần (cổng ghi idempotent)', async () => {
    const r = await moBuoiChua()
    const { khung, html, ma, khoa } = await chieuLenBang(r)
    noiTo(khung, html)
    const tin = { type: TIN_TO_CHIEU.CHAM, maPhien: ma, khoa: khoa[0], dat: true }
    await act(async () => {
      window.dispatchEvent(new MessageEvent('message', { data: tin, origin: window.location.origin, source: khung.contentWindow }))
      window.dispatchEvent(new MessageEvent('message', { data: tin, origin: window.location.origin, source: khung.contentWindow }))
    })
    await waitFor(() => expect(m.ghi).toHaveBeenCalledTimes(1), CHO)
    await act(async () => {
      window.dispatchEvent(new MessageEvent('message', { data: tin, origin: window.location.origin, source: khung.contentWindow }))
    })
    await new Promise((res) => setTimeout(res, 100))
    expect(m.ghi).toHaveBeenCalledTimes(1)
  }, 60000)

  it('máy chủ từ chối ⇒ tờ nhận "lỗi": nút mở lại + "chưa ghi được, bấm lại"; bấm lại thì ghi được (2 lượt gọi, 1 kết quả)', async () => {
    m.ghi.mockRejectedValueOnce(new Error('Máy chủ lỗi'))
    const r = await moBuoiChua()
    const { khung, html, khoa } = await chieuLenBang(r)
    const t = noiTo(khung, html)
    await waitFor(() => expect(t.doc.body.classList.contains('mc-noi')).toBe(true), CHO)

    nutTo(t.doc, khoa[0], 'Đạt').click()
    await waitFor(() => expect(vungTo(t.doc, khoa[0]).querySelector('.mc-cham-tin')!.textContent).toBe('chưa ghi được, bấm lại'), CHO)
    expect(nutTo(t.doc, khoa[0], 'Đạt').disabled).toBe(false)
    // bảng buổi chữa CHƯA khoá dòng vì máy chủ chưa nhận
    const dong = dongBuoi(r).find((d) => d.getAttribute('data-dong-buoi') === khoa[0])!
    expect(dong.textContent).not.toContain('Đã ghi')

    nutTo(t.doc, khoa[0], 'Đạt').click()
    await waitFor(() => expect(vungTo(t.doc, khoa[0]).textContent).toBe('Đã ghi'), CHO)
    expect(m.ghi).toHaveBeenCalledTimes(2)
  }, 60000)

  it('bấm ở BẢNG BUỔI CHỮA trước ⇒ tờ đang chiếu nhận DA_GHI và khoá ô đó ngay (khoá chung, chiều ngược lại)', async () => {
    const r = await moBuoiChua()
    const { khung, html, khoa } = await chieuLenBang(r)
    const t = noiTo(khung, html)
    await waitFor(() => expect(t.doc.body.classList.contains('mc-noi')).toBe(true), CHO)

    const dong = dongBuoi(r).find((d) => d.getAttribute('data-dong-buoi') === khoa[0])!
    fireEvent.click(nutBang(dong, 'Đạt')!)
    await waitFor(() => expect(m.ghi).toHaveBeenCalledTimes(1), CHO)
    await waitFor(() => expect(vungTo(t.doc, khoa[0]).textContent).toBe('Đã ghi'), CHO)
    // và lệnh CHAM tới muộn cho đúng ô ấy cũng không ghi đôi
    await act(async () => {
      window.dispatchEvent(new MessageEvent('message', { data: { type: TIN_TO_CHIEU.CHAM, maPhien: /data-cau-noi="([^"]+)"/.exec(html)![1], khoa: khoa[0], dat: false }, origin: window.location.origin, source: khung.contentWindow }))
    })
    await new Promise((res) => setTimeout(res, 100))
    expect(m.ghi).toHaveBeenCalledTimes(1)
  }, 60000)

  it('ô đã ghi TRƯỚC khi mở tờ ⇒ bắt tay xong tờ tự khoá ô ấy', async () => {
    const r = await moBuoiChua()
    const dong0 = dongBuoi(r)[0]
    const khoa0 = dong0.getAttribute('data-dong-buoi')!
    fireEvent.click(nutBang(dong0, 'Đạt')!)
    await waitFor(() => expect(dong0.textContent).toContain('Đã ghi: Đạt'), CHO)

    const { khung, html } = await chieuLenBang(r)
    const t = noiTo(khung, html)
    await waitFor(() => expect(t.doc.body.classList.contains('mc-noi')).toBe(true), CHO)
    await waitFor(() => expect(vungTo(t.doc, khoa0).textContent).toBe('Đã ghi'), CHO)
    expect(m.ghi).toHaveBeenCalledTimes(1)
  }, 60000)
})

describe('màn giáo viên KHÔNG nhận lệnh ghi từ nguồn lạ', () => {
  async function chuanBi() {
    const r = await moBuoiChua()
    const o = await chieuLenBang(r)
    return { r, ...o, goc: window.location.origin }
  }
  const gui = async (data: unknown, opt: { origin?: string; source?: unknown }) => {
    await act(async () => {
      window.dispatchEvent(new MessageEvent('message', { data, origin: opt.origin ?? window.location.origin, source: opt.source as MessageEventSource }))
    })
    await new Promise((res) => setTimeout(res, 60))
  }

  it('đúng mã phiên nhưng từ cửa sổ KHÁC (không phải khung tờ chiếu) ⇒ bỏ', async () => {
    const { ma, khoa } = await chuanBi()
    const laCuaSo = new JSDOM('<!doctype html>').window as unknown as Window
    await gui({ type: TIN_TO_CHIEU.CHAM, maPhien: ma, khoa: khoa[0], dat: true }, { source: laCuaSo })
    await gui({ type: TIN_TO_CHIEU.CHAM, maPhien: ma, khoa: khoa[0], dat: true }, { source: window })
    await gui({ type: TIN_TO_CHIEU.CHAM, maPhien: ma, khoa: khoa[0], dat: true }, { source: null })
    expect(m.ghi).not.toHaveBeenCalled()
  }, 60000)

  it('từ đúng khung nhưng SAI mã phiên / thiếu mã ⇒ bỏ', async () => {
    const { khung, khoa } = await chuanBi()
    await gui({ type: TIN_TO_CHIEU.CHAM, maPhien: 'doan-mo', khoa: khoa[0], dat: true }, { source: khung.contentWindow })
    await gui({ type: TIN_TO_CHIEU.CHAM, khoa: khoa[0], dat: true }, { source: khung.contentWindow })
    expect(m.ghi).not.toHaveBeenCalled()
  }, 60000)

  it('từ đúng khung, đúng mã nhưng GỐC lạ ⇒ bỏ', async () => {
    const { khung, ma, khoa } = await chuanBi()
    await gui({ type: TIN_TO_CHIEU.CHAM, maPhien: ma, khoa: khoa[0], dat: true }, { source: khung.contentWindow, origin: 'https://ke-xau.example' })
    expect(m.ghi).not.toHaveBeenCalled()
  }, 60000)

  it('khoá không có trên tờ / kết quả không phải boolean / kiểu tin lạ ⇒ bỏ (không ghi sbd/qid tuỳ ý)', async () => {
    const { khung, ma } = await chuanBi()
    const src = { source: khung.contentWindow }
    await gui({ type: TIN_TO_CHIEU.CHAM, maPhien: ma, khoa: '99999|q-la', dat: true }, src)
    await gui({ type: TIN_TO_CHIEU.CHAM, maPhien: ma, khoa: '12000|q1', dat: 'true' }, src)
    await gui({ type: TIN_TO_CHIEU.CHAM, maPhien: ma, sbd: '12000', qid: 'q1', chuyenDe: 'Ester', dat: true }, src) // thiếu `khoa`
    await gui({ type: 'ddh-mc-xoa', maPhien: ma, khoa: '12000|q1' }, src)
    expect(m.ghi).not.toHaveBeenCalled()
  }, 60000)

  it('SAU KHI ĐÓNG tờ ⇒ tin cũ (dù đúng mã, đúng khung cũ) bị bỏ', async () => {
    const { khung, ma, khoa } = await chuanBi()
    const cuaSoCu = khung.contentWindow
    fireEvent.click(document.querySelector('.nut-dong-phieu') as HTMLElement)
    await waitFor(() => expect(document.querySelector('.lop-xem-phieu')).toBeNull(), CHO)
    await gui({ type: TIN_TO_CHIEU.CHAM, maPhien: ma, khoa: khoa[0], dat: true }, { source: cuaSoCu })
    expect(m.ghi).not.toHaveBeenCalled()
  }, 60000)

  it('mở tờ MỚI ⇒ mã phiên mới; mã của tờ cũ không còn dùng được', async () => {
    const r = await moBuoiChua()
    const a = await chieuLenBang(r)
    fireEvent.click(document.querySelector('.nut-dong-phieu') as HTMLElement)
    await waitFor(() => expect(document.querySelector('.lop-xem-phieu')).toBeNull(), CHO)
    const b = await chieuLenBang(r)
    expect(b.ma).not.toBe(a.ma)
    await gui({ type: TIN_TO_CHIEU.CHAM, maPhien: a.ma, khoa: b.khoa[0], dat: true }, { source: b.khung.contentWindow })
    expect(m.ghi).not.toHaveBeenCalled()
    await gui({ type: TIN_TO_CHIEU.CHAM, maPhien: b.ma, khoa: b.khoa[0], dat: true }, { source: b.khung.contentWindow })
    await waitFor(() => expect(m.ghi).toHaveBeenCalledTimes(1), CHO)
  }, 60000)

  it('tờ nhận phản hồi CHỈ khi tin hợp lệ: tin lạ không sinh phản hồi nào (không báo cho kẻ lạ biết có người nghe)', async () => {
    const { khung } = await chuanBi()
    const spy = vi.spyOn(khung.contentWindow as Window, 'postMessage')
    await gui({ type: TIN_TO_CHIEU.SAN_SANG, maPhien: 'sai' }, { source: khung.contentWindow })
    await gui({ type: TIN_TO_CHIEU.SAN_SANG, maPhien: '' }, { source: window })
    expect(spy).not.toHaveBeenCalled()
  }, 60000)
})
