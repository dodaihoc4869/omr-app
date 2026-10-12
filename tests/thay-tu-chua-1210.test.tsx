// THẦY TỰ CHỮA (thầy 12/10: "mục cần chữa cho tôi một phần tự chữa, phần này cho tôi chọn đề trong Mục dạy học (trắc nghiệm khách quan trả lời ngắn)
// khi chọn đề nào thì đề đó hiển thị tất cả các câu chiếu lên máy chiếu, ưu tiên đẩy câu đúng sai và tính toán lên đầu tiên hiển thị, bảng hiển thị
// đầy đủ mọi thứ như mục chiếu lên bảng (đúng chuẩn)"):
//   · hàm xếp: Đúng–sai có tính toán → Đúng–sai → có tính toán → còn lại; cùng hạng giữ thứ tự đề (Phần I → II → III);
//   · nhận diện "có tính toán": nhãn kho / `dangCua` trước, câu chưa rõ dùng ĐÚNG biểu thức gói 7 (khoá chữ với máy chủ); "Tính chất…" không phải tính toán;
//   · chọn đề ⇒ tờ chiếu có ĐỦ mọi câu, đúng mã, đúng thứ tự, câu khác khối bị bỏ; tự luận giữ (thầy tự chọn); dải T có số lớp; nút X "Ai sai" chạy
//     trên tờ cả lớp (mốc khoá ẩn), không có nút Đạt / Chưa đạt;
//   · giao diện: thẻ "Thầy tự chữa" gập sẵn ở đầu Cần thầy chữa (không đọc kho), mở ⇒ chọn lớp · bài · tờ, xem trước thứ tự + tỉ lệ sai, nút chiếu mở khung.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { JSDOM, VirtualConsole } from 'jsdom'
import type { TeacherExamSource } from '../src/data/examContent'

const g = vi.hoisted(() => ({ goi: vi.fn(), kho: vi.fn(), tk: vi.fn(), toast: vi.fn() }))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: (duong: string, body: Record<string, unknown>) => g.goi(duong, body) }))
vi.mock('../src/lib/exam-db', () => ({
  loadExamSources: () => g.kho(),
  loadAllSessionTeacherBanks: async () => [],
  loadScriptUrl: async () => 'https://may-chu.test',
  loadTeacherSecret: async () => 'bi-mat',
}))
vi.mock('../src/lib/ho-so-em-thay', () => ({ layThongKeLopCau: (sbd: string[], qid: string[]) => g.tk(sbd, qid), layHoSoLenBang: async () => null }))
vi.mock('../src/components/KhungXemPhieu', () => ({ default: ({ html, ten }: { html: string; ten?: string }) => <pre data-testid="to-chieu" data-ten={ten}>{html}</pre> }))
vi.mock('../src/lib/chua-cau-sai-thay-api', () => ({ goiChuaThay: async () => ({ ok: true, bat: false, ds: [], conNua: false }) }))
vi.mock('../src/lib/nut-that-api', () => ({ gvDsNutThat: async () => ({ ok: true, nhom: [], kemRieng: [] }), gvGoNutThat: vi.fn() }))

import { CUM_TINH_LY_THUYET, MAU_TINH_TOAN_GOI_7, cauCuaDe, hangCau, laCauKhacKhoi, laCauTinhToan, tiLeSaiLop, xepThuTuChua } from '../src/lib/thay-tu-chua'
import { cauKhacKhoiLop } from '../src/components/chien-dich/to-chieu'
import { dungToThayTuChua } from '../src/components/chien-dich/thay-tu-chua-to'
import { TIN_TO_CHIEU } from '../src/lib/to-chieu-cau-noi'
import { useAppStore } from '../src/store/appStore'
import ThayTuChua from '../src/components/chien-dich/ThayTuChua'
import TheCanThayChua from '../src/components/chien-dich/TheCanThayChua'

// ───────────────────────── đề mẫu: Bài 6 khối 11 (TN 4 câu · Đúng–sai 2 · Trả lời ngắn 2) + một bài khối 12 ─────────────────────────
const mcq = (id: string, text: string, mucDo?: 'biet' | 'hieu' | 'van_dung') => ({ id, text, choices: ['pa a', 'pa b', 'pa c', 'pa d'], correct: 'A' as const, chuyenDe: 'Nitrogen', ...(mucDo ? { mucDo } : {}) })
const tf = (id: string, text: string, ideas: [string, string, string, string]) => ({ id, text, ideas, correct: ['D', 'S', 'D', 'S'] as ['D', 'S', 'D', 'S'], chuyenDe: 'Nitrogen' })
const sa = (id: string, text: string, correct: string, them: Record<string, unknown> = {}) => ({ id, text, correct, chuyenDe: 'Nitrogen', ...them })
const BAI6: TeacherExamSource = {
  maDe: 'DH-11-C2-B6',
  nhom: '11 · DẠY HỌC/C2 - Nitrogen',
  nguon: 'Bài 6. Ammonia và muối ammonium',
  phanI: [
    mcq('DH-11-C2-B6-I-1', 'Tính chất hoá học đặc trưng của ammonia là', 'hieu'),
    mcq('DH-11-C2-B6-I-2', 'Cho 3,36 lít khí ammonia (đkc) tác dụng hết với dung dịch HCl dư. Khối lượng muối thu được là', 'van_dung'),
    mcq('DH-11-C2-B6-I-3', 'Phát biểu nào sau đây về muối ammonium là đúng?', 'hieu'),
    // câu nhập NHẦM vào tờ khối 11 nhưng mang mã khối 10 ⇒ phải bị bỏ
    mcq('DH-10-C1-B1-I-4', 'CÂU NHẦM KHỐI MƯỜI', 'biet'),
  ],
  phanII: [
    tf('DH-11-C2-B6-II-1', 'Cho các phát biểu về ammonia:', ['Ammonia tan nhiều trong nước.', 'Ammonia có tính base yếu.', 'Ammonia nhẹ hơn không khí.', 'Dung dịch ammonia làm quỳ tím hoá đỏ.']),
    tf('DH-11-C2-B6-II-2', 'Nhiệt phân hoàn toàn 10,7 gam ammonium chloride.', ['Thu được 0,2 mol khí.', 'Khối lượng khí ammonia là 3,4 gam.', 'Phản ứng thu nhiệt.', 'Sản phẩm có HCl.']),
  ],
  phanIII: [
    sa('DH-11-C2-B6-III-1', 'Tổng hợp ammonia với hiệu suất 25%. Cần bao nhiêu lít N2 (đkc) để thu được 6,8 gam ammonia?', '39,66'),
    sa('DH-11-C2-B6-III-2', 'Giải thích vì sao ammonia tan rất nhiều trong nước.', 'Vì phân tử phân cực và tạo liên kết hydrogen với nước', { tuLuan: true }),
  ],
} as unknown as TeacherExamSource
const BAI1_12: TeacherExamSource = {
  maDe: 'DH-12-C1-B1',
  nhom: '12 · DẠY HỌC/C1 - Ester – Lipid',
  nguon: 'Bài 1. Ester',
  phanI: [mcq('DH-12-C1-B1-I-1', 'Chất nào sau đây là ester?', 'biet')],
  phanII: [],
  phanIII: [],
} as unknown as TeacherExamSource
/** Thứ tự chiếu mong đợi (I-4 khác khối không có mặt). */
const THU_TU = ['DH-11-C2-B6-II-2', 'DH-11-C2-B6-II-1', 'DH-11-C2-B6-I-2', 'DH-11-C2-B6-III-1', 'DH-11-C2-B6-I-1', 'DH-11-C2-B6-I-3', 'DH-11-C2-B6-III-2']
/** Một đoạn chữ riêng của từng câu để dò thứ tự trên tờ. */
const CHU: Record<string, string> = {
  'DH-11-C2-B6-I-1': 'đặc trưng của ammonia',
  'DH-11-C2-B6-I-2': 'tác dụng hết với dung dịch HCl',
  'DH-11-C2-B6-I-3': 'về muối ammonium là đúng',
  'DH-11-C2-B6-II-1': 'Cho các phát biểu về ammonia',
  'DH-11-C2-B6-II-2': 'Nhiệt phân hoàn toàn',
  'DH-11-C2-B6-III-1': 'Tổng hợp ammonia với hiệu suất',
  'DH-11-C2-B6-III-2': 'Giải thích vì sao ammonia tan rất nhiều',
}
const SO_GOP = {
  'DH-11-C2-B6-I-2': { bai: 3, dung: 1, coChon: 3, chon: { A: 1, B: 2 }, chonSai: { B: 2 } },
  'DH-11-C2-B6-III-1': { bai: 2, dung: 2, coChon: 2, chon: { '39,66': 2 }, chonSai: {} },
}

beforeEach(() => {
  g.goi.mockReset()
  g.kho.mockReset()
  g.tk.mockReset()
  g.toast.mockReset()
  g.kho.mockResolvedValue([BAI6, BAI1_12])
  g.tk.mockResolvedValue(SO_GOP)
  g.goi.mockImplementation(async (duong: string, b: Record<string, unknown>) => {
    if (duong === '/gv/lop') return { ok: true, du: { lop: [{ tenLop: '12A1', khoi: '12', soEm: 2, sbd: ['S1', 'S2'] }, { tenLop: '11B', khoi: '11', soEm: 3, sbd: ['T1', 'T2', 'T3'] }] } }
    if (duong === '/gv/chien-dich' && b.action === 'danh-sach') return { ok: true, du: { homNay: '2026-10-12', chienDich: [] } }
    return { ok: false, loai: 'chua_co_lenh', chu: 'lệnh lạ' }
  })
  useAppStore.setState({ showToast: g.toast } as never)
  try {
    localStorage.clear()
  } catch {
    /* bỏ qua */
  }
})
afterEach(cleanup)

// ───────────────────────── phần thuần ─────────────────────────
describe('luật xếp: Đúng–sai và câu tính toán lên trước', () => {
  it('hạng: Đúng–sai có tính toán 0 · Đúng–sai 1 · có tính toán 2 · còn lại 3', () => {
    expect(hangCau({ phan: 'II', tinhToan: true })).toBe(0)
    expect(hangCau({ phan: 'II', tinhToan: false })).toBe(1)
    expect(hangCau({ phan: 'I', tinhToan: true })).toBe(2)
    expect(hangCau({ phan: 'III', tinhToan: true })).toBe(2)
    expect(hangCau({ phan: 'I', tinhToan: false })).toBe(3)
  })
  it('sắp ỔN ĐỊNH: cùng hạng giữ thứ tự đề (Phần I → II → III, số câu tăng dần); không đổi mảng vào', () => {
    const ds = [
      { id: 'a', phan: 'I' as const, tinhToan: false, thuTuDe: 0 },
      { id: 'b', phan: 'I' as const, tinhToan: true, thuTuDe: 1 },
      { id: 'c', phan: 'II' as const, tinhToan: false, thuTuDe: 2 },
      { id: 'd', phan: 'II' as const, tinhToan: true, thuTuDe: 3 },
      { id: 'e', phan: 'III' as const, tinhToan: true, thuTuDe: 4 },
      { id: 'f', phan: 'I' as const, tinhToan: false, thuTuDe: 5 },
      { id: 'g', phan: 'II' as const, tinhToan: true, thuTuDe: 6 },
    ]
    const truoc = ds.map((x) => x.id)
    expect(xepThuTuChua(ds).map((x) => x.id)).toEqual(['d', 'g', 'c', 'b', 'e', 'a', 'f'])
    expect(ds.map((x) => x.id)).toEqual(truoc)
  })
  it('đề mẫu: thứ tự đề Phần I → II → III, số câu đọc từ mã; sau khi xếp đúng thứ tự chiếu', () => {
    const ds = cauCuaDe([BAI6])
    expect(ds.map((c) => c.qid)).toEqual([
      'DH-11-C2-B6-I-1', 'DH-11-C2-B6-I-2', 'DH-11-C2-B6-I-3', 'DH-10-C1-B1-I-4', 'DH-11-C2-B6-II-1', 'DH-11-C2-B6-II-2', 'DH-11-C2-B6-III-1', 'DH-11-C2-B6-III-2',
    ])
    expect(ds.map((c) => c.so)).toEqual([1, 2, 3, 4, 1, 2, 1, 2])
    expect(ds.filter((c) => c.tinhToan).map((c) => c.qid)).toEqual(['DH-11-C2-B6-I-2', 'DH-11-C2-B6-II-2', 'DH-11-C2-B6-III-1'])
    expect(ds.filter((c) => c.tuLuan).map((c) => c.qid)).toEqual(['DH-11-C2-B6-III-2'])
    expect(xepThuTuChua(ds.filter((c) => !laCauKhacKhoi(c.qid, 11))).map((c) => c.qid)).toEqual(THU_TU)
  })
})

describe('nhận diện "có tính toán"', () => {
  it('biểu thức của gói 7 CHÉP NGUYÊN từ máy chủ (server/src/goi-bai-7.ts) — đổi một bên thì test đỏ', () => {
    const mayChu = readFileSync(resolve(__dirname, '../server/src/goi-bai-7.ts'), 'utf8')
    expect(mayChu).toContain(`tinhToan: q.phan === 'III' || /${MAU_TINH_TOAN_GOI_7.source}/i.test(`)
  })
  it('Phần III ⇒ có; nhãn kho `kieu` thắng mặt chữ; câu tính có số kèm đơn vị ⇒ có; "Tính chất…", "tính base", "lưỡng tính" KHÔNG phải tính toán', () => {
    expect(laCauTinhToan({ phan: 'III', text: 'Giá trị của x là bao nhiêu?' })).toBe(true)
    expect(laCauTinhToan({ phan: 'I', text: 'Chất nào sau đây là ester?', kieu: 'bai_tap' })).toBe(true)
    expect(laCauTinhToan({ phan: 'I', text: 'Cho 8,8 gam ethyl acetate…', kieu: 'ly_thuyet' })).toBe(false)
    expect(laCauTinhToan({ phan: 'I', text: 'Cho 3,36 lít khí ammonia (đkc) tác dụng với HCl. Khối lượng muối là', mucDo: 'hieu' })).toBe(true)
    expect(laCauTinhToan({ phan: 'I', text: 'Tính khối lượng muối thu được khi cho ammonia dư vào dung dịch.', mucDo: 'hieu' })).toBe(true)
    for (const text of ['Tính chất hoá học đặc trưng của ammonia là', 'Ammonia thể hiện tính base yếu vì', 'Chất nào sau đây có tính lưỡng tính?', 'Aluminium hydroxide là chất lưỡng tính.'])
      expect(laCauTinhToan({ phan: 'I', text, mucDo: 'hieu' }), text).toBe(false)
    expect('Tính chất hoá học'.replace(CUM_TINH_LY_THUYET, '').trim()).toBe('hoá học')
    // tự luận Phần III: "Giải thích…" không mặc nhiên là tính toán
    expect(laCauTinhToan({ phan: 'III', text: 'Giải thích vì sao ammonia tan nhiều trong nước.' }, true)).toBe(false)
    expect(laCauTinhToan({ phan: 'III', text: 'Tính thể tích khí thu được (lít) khi nung 10,7 gam muối.' }, true)).toBe(true)
  })
  it('luật khác khối của xem trước TRÙNG luật `cauKhacKhoiLop` của tờ chiếu', () => {
    for (const qid of ['DH-11-C2-B6-I-1', 'DH-10-C1-B1-I-4', 'DH-12-C1-B1-I-1', '11-C2-B6-I-1', 'Q-LA-9', 'DH-11-C2-B6-II-2'])
      for (const k of [10, 11, 12]) expect(laCauKhacKhoi(qid, k), `${qid} · ${k}`).toBe(cauKhacKhoiLop(qid, [k]))
    expect(laCauKhacKhoi('DH-10-C1-B1-I-4', null)).toBe(false)
  })
  it('tỉ lệ sai lớp: (bài − đúng) ÷ bài; chưa em nào làm ⇒ null', () => {
    expect(tiLeSaiLop(SO_GOP['DH-11-C2-B6-I-2'])).toEqual({ phanTram: 67, bai: 3 })
    expect(tiLeSaiLop(SO_GOP['DH-11-C2-B6-III-1'])).toEqual({ phanTram: 0, bai: 2 })
    expect(tiLeSaiLop({ bai: 0, dung: 0, coChon: 0, chon: {}, chonSai: {} })).toBeNull()
    expect(tiLeSaiLop(undefined)).toBeNull()
  })
})

// ───────────────────────── tờ chiếu ─────────────────────────
function viTri(html: string, qid: string) {
  const i = html.indexOf(CHU[qid]!)
  expect(i, qid).toBeGreaterThan(0)
  return i
}

describe('chọn đề ⇒ tờ chiếu đủ mọi câu, đúng mã, câu khác khối bị bỏ', () => {
  it('đủ 7 câu theo đúng thứ tự xếp; câu mã khối 10 bị bỏ (không thay câu khác); tự luận giữ; dải thống kê lớp có số; X "Ai sai" có, Đạt/Chưa đạt không', async () => {
    const ds = xepThuTuChua(cauCuaDe([BAI6]))
    const { html, soBoKhoi, soThieu, o } = await dungToThayTuChua(ds, [BAI6], { tenBuoi: 'Thầy tự chữa · Bài 6', khoi: 11, maPhien: 'PHIEN-ttc', soGop: SO_GOP })
    expect(soBoKhoi).toBe(1)
    expect(soThieu).toBe(0)
    expect(html).not.toContain('CÂU NHẦM KHỐI MƯỜI')
    const vt = THU_TU.map((q) => viTri(html, q))
    expect([...vt].sort((a, b) => a - b)).toEqual(vt)
    const doc = new JSDOM(html).window.document
    expect(doc.querySelectorAll('.mc-dot')).toHaveLength(7)
    // số câu trên tờ = số trên đề + phần đúng loại
    expect([...doc.querySelectorAll('.mc-dot .mc-de-dau')].map((d) => d.textContent)).toEqual([
      'Câu 2Phần II · Đúng / Sai', 'Câu 1Phần II · Đúng / Sai', 'Câu 2Phần I · Trắc nghiệm', 'Câu 1Phần III · Trả lời ngắn',
      'Câu 1Phần I · Trắc nghiệm', 'Câu 3Phần I · Trắc nghiệm', 'Câu 2Phần III · Tự luận',
    ])
    // dải T: câu có số gộp (I-2, III-1) ⇒ có dải; câu không có số ⇒ không dải
    const dai = [...doc.querySelectorAll('.mc-dot')].map((d) => !!d.querySelector('.mc-tk'))
    expect(dai).toEqual([false, false, true, true, false, false, false])
    expect(doc.querySelectorAll('.mc-dot')[2]!.querySelector('.mc-tk')!.textContent).toContain('3 bài nộp')
    // cả lớp: không Đạt / Chưa đạt, không nút Thầy chữa bấm được; mỗi đợt một mốc khoá ẩn `|<mã câu>` cho X
    expect(doc.querySelectorAll('.mc-cham')).toHaveLength(0)
    expect(doc.querySelectorAll('.mc-thay-chua-nut')).toHaveLength(0)
    expect([...doc.querySelectorAll('.mc-moc-ca-lop')].map((m) => m.getAttribute('data-khoa-tc'))).toEqual(THU_TU.map((q) => `|${q}`))
    expect(doc.querySelector('#mc-phim-nhom [data-k="X"]')).toBeTruthy()
    expect([...o.keys()].sort()).toEqual(THU_TU.map((q) => `|${q}`).sort())
    // lời giải hiện dần, phím tắt, chữ cố định: đúng tờ của Chiếu lên bảng
    expect(doc.querySelectorAll('.mc-giai')).toHaveLength(7)
    expect(doc.querySelector('#mc-phim-nhom [data-k="T"]')).toBeTruthy()
    expect(doc.querySelector('#mc-phim-nhom [data-k="G"]')).toBeTruthy()
  })

  it('câu không có nội dung trên máy ⇒ dòng thay thế + đếm thiếu (không mượn câu khác); không có số lớp ⇒ không dải thống kê', async () => {
    const rong = { ...BAI6, phanI: [{ ...BAI6.phanI[0]!, text: '' }, BAI6.phanI[1]!], phanII: [], phanIII: [] } as TeacherExamSource
    const ds = xepThuTuChua(cauCuaDe([rong]))
    expect(ds.filter((c) => c.thieuNoiDung).map((c) => c.qid)).toEqual(['DH-11-C2-B6-I-1'])
    const { html, soThieu } = await dungToThayTuChua(ds, [rong], { tenBuoi: 'x', khoi: 11, maPhien: 'PHIEN-2' })
    expect(soThieu).toBe(1)
    expect(html).toContain('Nội dung câu hỏi 1')
    expect(new JSDOM(html).window.document.querySelectorAll('.mc-tk')).toHaveLength(0)
  })

  it('tờ chạy thật: nối app ⇒ X gửi AI_SAI đúng câu của đợt (khoá cả lớp); app trả ⇒ bảng em · nơi · số giây; sang đợt sau ⇒ đúng câu kế', async () => {
    const ds = xepThuTuChua(cauCuaDe([BAI6]))
    const { html } = await dungToThayTuChua(ds, [BAI6], { tenBuoi: 'Thầy tự chữa', khoi: 11, maPhien: 'PHIEN-x' })
    const GOC = 'http://localhost:3000'
    const cha = new JSDOM('<!doctype html><body></body>', { url: `${GOC}/` }).window as unknown as Window & { postMessage: (m: unknown) => void }
    const gui: Record<string, unknown>[] = []
    cha.postMessage = ((m: Record<string, unknown>) => void gui.push(m)) as never
    const dom = new JSDOM(html, {
      runScripts: 'dangerously',
      virtualConsole: new VirtualConsole(),
      beforeParse(w) {
        Object.defineProperty(w, 'parent', { get: () => cha, configurable: true })
        w.setTimeout = (() => 0) as never
        w.setInterval = (() => 0) as never
        w.HTMLElement.prototype.scrollTo = () => {}
      },
    })
    const d = dom.window.document
    const tuCha = (data: unknown) =>
      dom.window.dispatchEvent(new (dom.window as unknown as { MessageEvent: typeof MessageEvent }).MessageEvent('message', { data, origin: GOC, source: cha as unknown as MessageEventSource }))
    const phim = (key: string) => d.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key, bubbles: true }))
    tuCha({ type: TIN_TO_CHIEU.KET_NOI, maPhien: 'PHIEN-x' })
    const x = d.querySelector<HTMLButtonElement>('#mc-phim-nhom [data-k="X"]')!
    expect(x.hidden).toBe(false)
    // phím C (Thầy chữa) không hiện: tờ cả lớp không có gì để ghi
    expect(d.querySelector<HTMLButtonElement>('#mc-phim-nhom [data-k="C"]')!.hidden).toBe(true)
    phim('x')
    const m = gui.filter((t) => t.type === TIN_TO_CHIEU.AI_SAI)
    expect(m).toHaveLength(1)
    expect(m[0]).toMatchObject({ khoa: `|${THU_TU[0]}`, maPhien: 'PHIEN-x' })
    tuCha({ type: TIN_TO_CHIEU.AI_SAI_TRA, maPhien: 'PHIEN-x', id: m[0]!.id, ds: [{ sbd: 'T1', ten: 'Lý Thanh Tâm', luc: '2026-10-10T03:00:00Z', noi: 'Đảo', giay: 42 }] })
    const panel = d.querySelector('.mc-aisai')!
    expect(panel.textContent).toContain('Lý Thanh Tâm')
    expect(panel.textContent).toContain('42 giây')
    phim('Escape')
    phim('ArrowRight')
    phim('x')
    const m2 = gui.filter((t) => t.type === TIN_TO_CHIEU.AI_SAI)
    expect(m2.at(-1)).toMatchObject({ khoa: `|${THU_TU[1]}` })
  })
})

// ───────────────────────── giao diện ─────────────────────────
describe('giao diện: thẻ "Thầy tự chữa" trong Cần thầy chữa', () => {
  it('Cần thầy chữa có thẻ "Thầy tự chữa" GẬP sẵn ở đầu: chưa đọc kho, chưa gọi lệnh lớp; danh sách cần chữa vẫn tải như cũ', async () => {
    const { container } = render(<TheCanThayChua />)
    const the = screen.getByRole('region', { name: 'Thầy tự chữa' })
    expect(the.compareDocumentPosition(container.querySelector('.gvv2-cc')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    const nut = within(the).getByRole('button', { name: 'Chọn đề' })
    expect(nut.getAttribute('aria-expanded')).toBe('false')
    expect(await screen.findByText('Chưa có câu nào cần thầy chữa.')).toBeTruthy()
    expect(g.kho).not.toHaveBeenCalled()
    expect(g.goi.mock.calls.filter(([d]) => d === '/gv/lop')).toHaveLength(0)
    expect(screen.queryByRole('combobox')).toBeNull()
  })

  it('mở ⇒ chọn lớp (theo khối) · bài Dạy học · tờ đề (đủ ba tờ bật sẵn) ⇒ xem trước thứ tự + "Có tính toán" + tỉ lệ sai lớp; tắt một tờ ⇒ danh sách theo; Chiếu ⇒ khung tờ chiếu đủ câu', async () => {
    render(<ThayTuChua />)
    fireEvent.click(screen.getByRole('button', { name: 'Chọn đề' }))
    const lop = (await screen.findByRole('combobox', { name: 'Lớp' })) as HTMLSelectElement
    expect([...lop.querySelectorAll('optgroup')].map((o) => o.label)).toEqual(['Khối 11', 'Khối 12'])
    expect([...lop.options].map((o) => o.textContent)).toEqual(['11B · 3 em', '12A1 · 2 em'])
    expect(lop.value).toBe('lop:11B')
    const bai = screen.getByRole('combobox', { name: /Bài trong Dạy học · Khối 11/ }) as HTMLSelectElement
    expect(bai.value).toBe('')
    expect(screen.getByText('Chọn một bài để xem các câu sẽ chiếu.')).toBeTruthy()
    fireEvent.change(bai, { target: { value: 'DH-11-C2-B6' } })

    const nhom = screen.getByRole('group', { name: /Tờ đề của Bài 6/ })
    const chip = within(nhom).getAllByRole('button')
    expect(chip.map((b) => b.textContent)).toEqual(['Trắc nghiệm 4 câu', 'Đúng–sai 2 câu', 'Trả lời ngắn 2 câu'])
    expect(chip.map((b) => b.getAttribute('aria-pressed'))).toEqual(['true', 'true', 'true'])

    const ds = screen.getByRole('list', { name: 'Thứ tự câu sẽ chiếu' })
    const dong = () => [...ds.querySelectorAll<HTMLElement>('li[data-qid]')]
    expect(dong().map((l) => l.dataset.qid)).toEqual(THU_TU)
    expect(dong().map((l) => l.querySelector('.gvv2-ttc-meta b')!.textContent)).toEqual([
      'Câu 2 · Đúng–sai', 'Câu 1 · Đúng–sai', 'Câu 2 · Trắc nghiệm', 'Câu 1 · Trả lời ngắn', 'Câu 1 · Trắc nghiệm', 'Câu 3 · Trắc nghiệm', 'Câu 2 · Tự luận',
    ])
    expect(dong().filter((l) => l.textContent!.includes('Có tính toán')).map((l) => l.dataset.qid)).toEqual(['DH-11-C2-B6-II-2', 'DH-11-C2-B6-I-2', 'DH-11-C2-B6-III-1'])
    expect(screen.getByText(/1 câu mang mã khối khác Khối 11/)).toBeTruthy()
    expect(document.querySelector('.gvv2-ttc-tom')!.textContent).toBe('7 câu sẽ chiếu · 2 câu Đúng–sai · 3 câu có tính toán — Đúng–sai và câu có tính toán chiếu trước')
    // tỉ lệ sai lớp: số gộp của đúng các em lớp 11B, đúng mã câu
    await waitFor(() => expect(dong()[2]!.querySelector('.gvv2-ttc-sai')!.textContent).toBe('67% lớp sai · 3 em làm'))
    expect(dong()[3]!.querySelector('.gvv2-ttc-sai')!.textContent).toBe('0% lớp sai · 2 em làm')
    expect(dong()[0]!.querySelector('.gvv2-ttc-sai')!.textContent).toBe('chưa em nào làm')
    const [sbd, qid] = g.tk.mock.calls.at(-1)!
    expect(sbd).toEqual(['T1', 'T2', 'T3'])
    expect([...qid].sort()).toEqual([...THU_TU].sort())

    // tắt tờ Trắc nghiệm ⇒ chỉ còn Đúng–sai + Trả lời ngắn
    fireEvent.click(chip[0]!)
    expect(chip[0]!.getAttribute('aria-pressed')).toBe('false')
    expect(dong().map((l) => l.dataset.qid)).toEqual(['DH-11-C2-B6-II-2', 'DH-11-C2-B6-II-1', 'DH-11-C2-B6-III-1', 'DH-11-C2-B6-III-2'])
    fireEvent.click(chip[0]!)
    await waitFor(() => expect(dong()[2]!.querySelector('.gvv2-ttc-sai')!.textContent).toBe('67% lớp sai · 3 em làm'))

    fireEvent.click(screen.getByRole('button', { name: 'Chiếu lên máy chiếu' }))
    const to = await screen.findByTestId('to-chieu')
    expect(to.dataset.ten).toBe('Tờ máy chiếu — Thầy tự chữa')
    const html = to.textContent!
    const vt = THU_TU.map((q) => viTri(html, q))
    expect([...vt].sort((a, b) => a - b)).toEqual(vt)
    expect(html).not.toContain('CÂU NHẦM KHỐI MƯỜI')
    expect(html).toContain('data-k="X"')
    expect(html).toContain('3 bài nộp')
    expect(html).toContain('Thầy tự chữa · Bài 6 · Trắc nghiệm + Đúng–sai + Trả lời ngắn')
  })

  it('lớp khác khối ⇒ danh sách bài của khối ấy; nhớ lựa chọn trên máy', async () => {
    const l1 = render(<ThayTuChua />)
    fireEvent.click(screen.getByRole('button', { name: 'Chọn đề' }))
    const lop = (await screen.findByRole('combobox', { name: 'Lớp' })) as HTMLSelectElement
    fireEvent.change(lop, { target: { value: 'lop:12A1' } })
    const bai = screen.getByRole('combobox', { name: /Bài trong Dạy học · Khối 12/ }) as HTMLSelectElement
    expect([...bai.options].filter((o) => !o.disabled).map((o) => o.textContent)).toEqual(['Bài 1. Ester'])
    fireEvent.change(bai, { target: { value: 'DH-12-C1-B1' } })
    expect(screen.getByRole('list', { name: 'Thứ tự câu sẽ chiếu' }).querySelectorAll('li')).toHaveLength(1)
    l1.unmount()
    render(<ThayTuChua />)
    fireEvent.click(screen.getByRole('button', { name: 'Chọn đề' }))
    expect(((await screen.findByRole('combobox', { name: 'Lớp' })) as HTMLSelectElement).value).toBe('lop:12A1')
    expect((screen.getByRole('combobox', { name: /Bài trong Dạy học/ }) as HTMLSelectElement).value).toBe('DH-12-C1-B1')
  })

  it('trạng thái: kho trống ⇒ nói vì sao + Mở Kho đề; kho lỗi ⇒ lý do + Thử lại; danh sách lớp lỗi ⇒ chọn theo khối, nói thật không có tỉ lệ sai', async () => {
    g.kho.mockResolvedValue([])
    const a = render(<ThayTuChua />)
    fireEvent.click(screen.getByRole('button', { name: 'Chọn đề' }))
    expect(await screen.findByText(/Kho Dạy học trên máy này chưa có bài nào/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Mở Kho đề' })).toBeTruthy()
    a.unmount()

    g.kho.mockRejectedValueOnce(new Error('IndexedDB hỏng'))
    const b = render(<ThayTuChua />)
    fireEvent.click(screen.getByRole('button', { name: 'Chọn đề' }))
    const loi = await screen.findByRole('alert')
    expect(loi.textContent).toContain('Chưa đọc được kho đề trên máy này.')
    g.kho.mockResolvedValue([BAI6])
    fireEvent.click(within(loi).getByRole('button', { name: 'Thử lại' }))
    expect(await screen.findByRole('combobox', { name: 'Lớp' })).toBeTruthy()
    b.unmount()

    g.kho.mockResolvedValue([BAI6])
    g.goi.mockImplementation(async () => ({ ok: false, loai: 'mang', chu: 'Không nối được máy chủ.' }))
    render(<ThayTuChua />)
    fireEvent.click(screen.getByRole('button', { name: 'Chọn đề' }))
    const lop = (await screen.findByRole('combobox', { name: 'Lớp' })) as HTMLSelectElement
    expect([...lop.options].map((o) => o.textContent)).toEqual(['Khối 11'])
    expect(screen.getByText(/Chưa tải được danh sách lớp/)).toBeTruthy()
    fireEvent.change(screen.getByRole('combobox', { name: /Bài trong Dạy học/ }), { target: { value: 'DH-11-C2-B6' } })
    expect(screen.getByText('Chọn một lớp để thấy tỉ lệ sai của lớp.')).toBeTruthy()
    expect(g.tk).not.toHaveBeenCalled()
  })
})
