// BTVN NÂNG ĐỠ · BẢN 1.2 — phần MÁY EM: nhóm "Thử sức thêm · không bắt buộc" SAU chặng cuối (mở cùng chặng cuối).
// Boss 21/09: câu ghi "Câu cao — làm đúng được cộng, bỏ qua không sao"; KHÔNG chặn nút xong chặng/xong bài; không tính vào "N câu của em"
// và thanh tiến độ; bảng nhiệm vụ + phụ huynh "N câu của em (+M câu thử sức thêm, không bắt buộc)". Máy chủ chưa trả khoá ⇒ như cũ.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dungPhieuBtvn } from '../src/lib/btvn-cho-em'
import {
  GHI_CHU_CAU_THU_SUC,
  LOI_DAN_THU_SUC,
  TIEU_DE_THU_SUC,
  chuSoCauCuaEm,
  docBaiCaNhan,
  hienNhomThuSuc,
  tachThuSucThem,
} from '../src/lib/btvn-ca-nhan-kieu'
import { soThuSucCua, tuKeHoachNgay, type KeHoachNgayMayChu } from '../src/lib/nhiem-vu-adapter'
import type { CauLuyen } from '../src/lib/bai-tap-pdf'
import { boLoiGiai, dungPhieu, type ThongTinPhieu } from '../src/lib/html-phieu'
import { heroCaNhanHtml, type DauBaiCaNhanVao } from '../src/lib/html-phieu-ca-nhan'

const homNay = new Date()
const NGAY_MAI = new Date(homNay.getFullYear(), homNay.getMonth(), homNay.getDate() + 1, 0, 0).toISOString()
const HOM_QUA = new Date(homNay.getFullYear(), homNay.getMonth(), homNay.getDate() - 1, 0, 0).toISOString()
const HAN = new Date(homNay.getFullYear(), homNay.getMonth(), homNay.getDate() + 7, 20, 0).toISOString()

const cau = (so: number, phan: 'I' | 'II' | 'III') => ({
  qid: `M-${phan}-${so}`,
  phan,
  so,
  de: `Đề câu ${so}`,
  ...(phan === 'I' ? { pa: { A: 'a', B: 'b', C: 'c', D: 'd' } } : {}),
  ...(phan === 'II' ? { y: { a: 'ý a', b: 'ý b', c: 'ý c', d: 'ý d' } } : {}),
})
const C1 = cau(1, 'I')
const C2 = cau(2, 'II')
const C3 = cau(3, 'III') // chặng 0
const C4 = cau(4, 'I')
const C5 = cau(5, 'I') // chặng 1 (cuối)
const T6 = cau(6, 'III') // thử sức
const T7 = cau(7, 'I') // thử sức
const chang = (chiSo: number, soCau: number, daMo: boolean, daXong: boolean, moLuc = HOM_QUA) => ({ chiSo, soCau, moLuc, daMo, daXong })
const NHAN = { 'M-I-1': 'khoi_dong', 'M-II-2': 'loi', 'M-III-3': 'dang_yeu', 'M-I-4': 'loi', 'M-I-5': 'dang_yeu', 'M-III-6': 'loi_cao', 'M-I-7': 'loi_cao' }

/** Bài 5 câu BẮT BUỘC (3 + 2) + 2 câu thử sức. Mặc định: chặng 0 xong, chặng cuối (1) đang mở; câu thử sức nằm cuối `de.cau`. */
const phanHoi = (o: Record<string, unknown> = {}) => ({
  ok: true,
  caNhan: true,
  maBtvn: 'B1',
  hanNop: HAN,
  soCau: 5,
  soCauCuaEm: 5,
  soThuSucThem: 2,
  thuSucThem: ['M-III-6', 'M-I-7'],
  soChang: 2,
  loDaXong: 1,
  changDangMo: 1,
  chang: [chang(0, 3, true, true), chang(1, 2, true, false)],
  nhan: NHAN,
  de: { ma_de: 'M', khongDapAn: true, cau: [C1, C2, C3, C4, C5, T6, T7] },
  ...o,
})
const than = (html: string) => html.slice(html.indexOf('<body'), html.indexOf('<script type="application/json" id="du-nop">'))
const duNop = (html: string) => JSON.parse(/<script type="application\/json" id="du-nop">([\s\S]*?)<\/script>/.exec(html)![1].replace(/\\u003c/g, '<'))
const the = (html: string, qid: string) => new RegExp(`<article[^>]*data-qid="${qid}"[\\s\\S]*?</article>`).exec(than(html))![0]
const dung = (r: Record<string, unknown>) => dungPhieuBtvn(r as never, 'Riêng', '12121212')

beforeEach(() => localStorage.clear())

describe('bộ đọc: thuSucThem ở hai dạng máy chủ có thể gửi', () => {
  it('dạng 1: thuSucThem là danh sách mã ở gốc; soThuSucThem lấy theo số gửi hoặc độ dài danh sách', () => {
    const b = docBaiCaNhan(phanHoi())!
    expect(b.thuSucThem).toEqual(['M-III-6', 'M-I-7'])
    expect(b.soThuSucThem).toBe(2)
    expect(docBaiCaNhan(phanHoi({ soThuSucThem: undefined }))!.soThuSucThem).toBe(2)
    expect(docBaiCaNhan(phanHoi({ thuSucThem: undefined, soThuSucThem: 3 }))!.soThuSucThem).toBe(3) // chặng cuối chưa mở: chưa có mã nhưng bảng nói trước số
    expect(docBaiCaNhan(phanHoi({ soThuSucThem: 1 }))!.soThuSucThem).toBe(2) // số gửi nhỏ hơn số mã ⇒ lấy số lớn (không nói thiếu)
  })
  it('dạng 2: de.thuSucThem là danh sách câu (có qid); trộn cả hai dạng ⇒ bỏ trùng, giữ thứ tự', () => {
    const b = docBaiCaNhan(phanHoi({ thuSucThem: undefined, de: { cau: [C1], thuSucThem: [T6, T7] } }))!
    expect(b.thuSucThem).toEqual(['M-III-6', 'M-I-7'])
    const c = docBaiCaNhan(phanHoi({ thuSucThem: ['M-I-7'], de: { cau: [C1], thuSucThem: [T6, T7] } }))!
    expect(c.thuSucThem).toEqual(['M-I-7', 'M-III-6'])
  })
  it('vắng / rác ⇒ [] và 0 (bài như cũ)', () => {
    for (const thuSucThem of [undefined, null, 'x', 5, {}, [], [null, 5, '', '  ', {}]]) {
      const b = docBaiCaNhan(phanHoi({ thuSucThem, soThuSucThem: undefined, de: { cau: [C1] } }))!
      expect(b.thuSucThem).toEqual([])
      expect(b.soThuSucThem).toBe(0)
    }
    expect(docBaiCaNhan(phanHoi({ soThuSucThem: -1, thuSucThem: undefined }))!.soThuSucThem).toBe(0)
    expect(docBaiCaNhan(phanHoi({ soThuSucThem: 1.5, thuSucThem: undefined }))!.soThuSucThem).toBe(0)
  })
  it('tachThuSucThem: bắt buộc giữ thứ tự, thử sức tách ra; câu thử sức từ de.thuSucThem được gộp; không mã ⇒ như cũ', () => {
    const b = docBaiCaNhan(phanHoi())!
    const t = tachThuSucThem(b, [C1, C2, C3, C4, C5, T6, T7])
    expect(t.batBuoc.map((c) => c.qid)).toEqual(['M-I-1', 'M-II-2', 'M-III-3', 'M-I-4', 'M-I-5'])
    expect(t.thuSuc.map((c) => c.qid)).toEqual(['M-III-6', 'M-I-7'])
    const g = tachThuSucThem(b, [C1, C2, C3, C4, C5, T6], [T7, T6])
    expect(g.thuSuc.map((c) => c.qid)).toEqual(['M-III-6', 'M-I-7']) // không trùng T6
    expect(g.batBuoc).toHaveLength(5)
    // câu trong de.thuSucThem mà mã KHÔNG nằm trong thuSucThem thì bị bỏ, không lọt vào bắt buộc
    const la = tachThuSucThem(b, [C1], [T6, C2])
    expect(la.batBuoc.map((c) => c.qid)).toEqual(['M-I-1'])
    expect(la.thuSuc.map((c) => c.qid)).toEqual(['M-III-6'])
    const nguyen = tachThuSucThem({ thuSucThem: [] }, [C1, T6])
    expect(nguyen.batBuoc).toHaveLength(2)
    expect(nguyen.thuSuc).toEqual([])
  })
  it('hienNhomThuSuc: CHỈ ở chặng cuối và khi chặng cuối đã mở; không có mã ⇒ không', () => {
    const b = docBaiCaNhan(phanHoi())!
    expect(hienNhomThuSuc(b, 1)).toBe(true)
    expect(hienNhomThuSuc(b, 0)).toBe(false)
    const chuaMo = docBaiCaNhan(phanHoi({ chang: [chang(0, 3, true, false), chang(1, 2, false, false, NGAY_MAI)], thuSucThem: undefined, de: { cau: [C1, C2, C3] } }))!
    expect(hienNhomThuSuc(chuaMo, 1)).toBe(false)
    const coMaChuaMo = docBaiCaNhan(phanHoi({ chang: [chang(0, 3, true, true), chang(1, 2, false, false, NGAY_MAI)] }))! // có mã thử sức nhưng chặng cuối CHƯA mở
    expect(coMaChuaMo.thuSucThem).toHaveLength(2)
    expect(hienNhomThuSuc(coMaChuaMo, 1)).toBe(false)
    expect(hienNhomThuSuc(docBaiCaNhan(phanHoi({ thuSucThem: undefined, soThuSucThem: undefined }))!, 1)).toBe(false)
  })
  it('chữ: "N câu của em (+M câu thử sức thêm, không bắt buộc)"; M = 0 ⇒ như cũ', () => {
    expect(chuSoCauCuaEm(12, 3)).toBe('12 câu của em (+3 câu thử sức thêm, không bắt buộc)')
    expect(chuSoCauCuaEm(12, 0)).toBe('12 câu của em')
    expect(chuSoCauCuaEm(12, -1)).toBe('12 câu của em')
    expect(TIEU_DE_THU_SUC).toBe('Thử sức thêm · không bắt buộc')
    expect(GHI_CHU_CAU_THU_SUC).toBe('Câu cao — làm đúng được cộng, bỏ qua không sao')
    expect(LOI_DAN_THU_SUC).toMatch(/Không bắt buộc/)
  })
})

describe('phiếu dựng từ /btvn/cua-em: nhóm Thử sức thêm', () => {
  it('chặng cuối đang mở: nhóm đứng SAU câu bắt buộc, có tiêu đề + lời dẫn; câu thử sức có nhãn + dải ghi; câu bắt buộc KHÔNG có', async () => {
    const html = await dung(phanHoi())
    const t = than(html)
    expect(t).toContain('gcn-nhom-ts')
    expect(t).toContain('Thử sức thêm · không bắt buộc')
    expect(t.indexOf('gcn-nhom-ts')).toBeGreaterThan(t.indexOf('data-qid="M-I-5"'))
    expect(t.indexOf('gcn-nhom-ts')).toBeLessThan(t.indexOf('data-qid="M-III-6"'))
    for (const q of ['M-III-6', 'M-I-7']) {
      const c = the(html, q)
      expect(c).toContain('q-card-thu-suc')
      expect(c).toContain('data-nhan="thu_suc_them"')
      expect(c).toContain('Câu cao — làm đúng được cộng, bỏ qua không sao')
    }
    for (const q of ['M-I-4', 'M-I-5']) {
      expect(the(html, q)).not.toContain('q-card-thu-suc')
      expect(the(html, q)).not.toContain('Câu cao — làm đúng')
    }
    expect(t.match(/class="gcn-nhom-ts"/g)).toHaveLength(1) // MỘT tiêu đề nhóm
    expect(t).toContain('2 câu · không tính vào tiến độ')
  })
  it('KHÔNG lộ đáp án: du-nop chỉ có id + phan (+ ts cho câu thử sức)', async () => {
    const html = await dung(phanHoi())
    const ds = duNop(html).cau as { id: string; ts?: number }[]
    expect(ds.map((c) => c.id)).toEqual(['M-I-4', 'M-I-5', 'M-I-7', 'M-III-6']) // đề xếp theo phần I→III trong từng nhóm
    expect(ds.filter((c) => c.ts === 1).map((c) => c.id).sort()).toEqual(['M-I-7', 'M-III-6'])
    for (const c of ds) expect(Object.keys(c).sort()).toEqual(c.ts ? ['id', 'phan', 'ts'] : ['id', 'phan'])
    expect(than(html)).not.toContain('data-dung')
  })
  it('nhóm thử sức luôn ở CUỐI: câu bắt buộc phần III của chặng cuối vẫn đứng TRƯỚC câu thử sức phần I', async () => {
    const C6 = cau(8, 'III') // bắt buộc, phần III
    const html = await dung(phanHoi({ chang: [chang(0, 3, true, true), chang(1, 3, true, false)], soCau: 6, soCauCuaEm: 6, de: { ma_de: 'M', cau: [C1, C2, C3, C4, C5, C6, T6, T7] } }))
    const ds = (duNop(html).cau as { id: string }[]).map((c) => c.id)
    expect(ds).toEqual(['M-I-4', 'M-I-5', 'M-III-8', 'M-I-7', 'M-III-6'])
    expect(than(html).indexOf('gcn-nhom-ts"')).toBeGreaterThan(than(html).indexOf('data-qid="M-III-8"'))
  })
  it('thanh trên + đáy đếm CHỈ câu bắt buộc của chặng: 2, không phải 4', async () => {
    const html = await dung(phanHoi())
    expect(html).toContain('<span id="nop-tong">2</span>')
    expect(html).toContain('<span id="gd-tong">2</span>') // thanh trên M3
    expect(than(html)).toContain('Chặng 2/2 · Đã làm')
  })
  it('hero: "5 câu" giữ nguyên + dòng "(+2 câu thử sức thêm, không bắt buộc)"', async () => {
    const t = than(await dung(phanHoi()))
    expect(t).toContain('<b>5</b> câu')
    expect(t).toContain('(+2 câu thử sức thêm, không bắt buộc)')
  })
  it('chặng cuối CHƯA mở: máy chủ có gửi mã cũng KHÔNG hiện nhóm/câu thử sức; hero vẫn nói trước "+2"', async () => {
    const html = await dung(phanHoi({ loDaXong: 0, changDangMo: 0, chang: [chang(0, 3, true, false), chang(1, 2, false, false, NGAY_MAI)], de: { ma_de: 'M', cau: [C1, C2, C3, T6, T7] } }))
    const t = than(html)
    expect(t).not.toContain('gcn-nhom-ts')
    expect(t).not.toContain('q-card-thu-suc')
    expect(t).not.toContain('Đề câu 6')
    expect(t).not.toContain('Đề câu 7')
    expect(t).toContain('(+2 câu thử sức thêm, không bắt buộc)')
  })
  it('dạng 2 (de.thuSucThem là câu đầy đủ) cho ra cùng nhóm', async () => {
    const html = await dung(phanHoi({ thuSucThem: undefined, de: { ma_de: 'M', cau: [C1, C2, C3, C4, C5], thuSucThem: [T6, T7] } }))
    expect(than(html)).toContain('gcn-nhom-ts')
    expect((duNop(html).cau as { ts?: number }[]).filter((c) => c.ts === 1)).toHaveLength(2)
  })
  it('KHÔNG có thuSucThem (máy chủ chưa 1.2): không một dấu vết — không nhóm, không lớp, không chip, không dòng hero, du-nop không có ts', async () => {
    const html = await dung(phanHoi({ thuSucThem: undefined, soThuSucThem: undefined, de: { ma_de: 'M', cau: [C1, C2, C3, C4, C5] } }))
    const t = than(html)
    for (const dau of ['gcn-nhom-ts"', 'q-card-thu-suc"', 'thu_suc_them', 'thử sức thêm', 'Thử sức thêm']) expect(t, dau).not.toContain(dau)
    expect(JSON.stringify(duNop(html).cau)).not.toContain('"ts"')
    expect(t).not.toContain('gcn-hero-ts">') // lớp CSS có trong <style>, còn PHẦN TỬ thì không
  })
  it('mọi câu bắt buộc của chặng đã chấm ⇒ nút "Đã xong chặng" (khoá) — câu thử sức chưa làm KHÔNG giữ nút mở', async () => {
    const { luuKetQuaChang } = await import('../src/lib/btvn-ca-nhan-em')
    const kq = (qid: string) => ({ qid, dung: true, dapAnDung: 'A', loiGiai: { chot: 'ok' }, anhLoiGiai: [] })
    luuKetQuaChang('B1', '12121212', 1, [kq('M-I-4'), kq('M-I-5')] as never, { 'M-I-4': 'A', 'M-I-5': 'A' })
    const t = than(await dung(phanHoi()))
    expect(t).toContain('id="nut-nop" disabled')
    expect(t).toContain('Đã xong chặng')
    expect(t).toContain('q-card-thu-suc') // câu thử sức vẫn hiện, chưa chấm
  })
  it('còn câu bắt buộc chưa chấm ⇒ nút "Nộp chặng" mở (đối chứng)', async () => {
    const t = than(await dung(phanHoi()))
    expect(t).toContain('id="nut-nop">Nộp chặng</button>')
  })
})

// ─────────────────── CHẠY THẬT TRONG JSDOM: đếm, nộp chặng, không bị chặn ───────────────────
const C = (o: Partial<CauLuyen>): CauLuyen =>
  ({ phan: 'I', id: 'x', maDe: 'X', chuyenDe: 'Ester – lipid', dang: 'chua_ro', sao: 0, mucDo: 'hieu', text: 'Đề', luaChon: ['a', 'b', 'c', 'd'], dapAn: 'A', chot: 'c', lyDo: null, buoc: ['Bước'], ...o }) as CauLuyen
const chua = (o: Partial<CauLuyen>, thuSuc = false): CauLuyen => ({ ...boLoiGiai(C(o)), caNhan: { nhan: thuSuc ? 'loi_cao' : 'loi', chuaCoDapAn: true, ...(thuSuc ? { thuSuc: true as const } : {}) } })
const CAU_JS: CauLuyen[] = [chua({ id: 'b1', text: 'Bắt buộc 1' }), chua({ id: 'b2', text: 'Bắt buộc 2' }), chua({ id: 't1', text: 'Thử sức 1' }, true), chua({ id: 't2', text: 'Thử sức 2' }, true)]
const TT: ThongTinPhieu = { hoTen: '', sbd: '12121212', ngay: new Date(2026, 8, 21), tenChuyenDe: 'Bài tập về nhà', ketQua: '', hienDapAn: false, nhanBia: 'BÀI TẬP VỀ NHÀ', oBia: [{ nhan: 'Số báo danh', gia: '12121212' }, { nhan: 'Ca', gia: 'M' }, { nhan: 'Hạn nộp', gia: '—' }] }
const DAU: DauBaiCaNhanVao = { tong: 2, soChang: 1, phutMoiNgay: 10, han: '28/09', chang: [{ chiSo: 0, daXong: false }], chiSoHienThi: 0, nhanChang: { 0: 'Hôm nay' }, soThuSuc: 2 }
const phieuJs = () => dungPhieu(TT, CAU_JS, { nop: { ma: 'BTVN-abc', sbd: '12121212', url: 'https://may-chu.thu/goi' }, caNhan: { chiSo: 0, daCham: {}, dauBai: DAU, ghiCho: '', tienTo: 'Chặng 1/1 · ', nutNop: 'Nộp chặng', nutTat: false } })

let boNghe: Array<[string, EventListenerOrEventListenerObject, unknown]> = []
function moPhieu(html: string) {
  for (const [ten, ham, ch] of boNghe) document.removeEventListener(ten, ham, ch as boolean)
  boNghe = []
  for (const k of Object.keys(localStorage)) if (k.indexOf('ddh.lam.') === 0) localStorage.removeItem(k)
  const themGoc = document.addEventListener.bind(document)
  document.addEventListener = ((ten: string, ham: EventListenerOrEventListenerObject, ch?: unknown) => {
    boNghe.push([ten, ham, ch])
    themGoc(ten as keyof DocumentEventMap, ham as EventListener, ch as boolean)
  }) as typeof document.addEventListener
  const thanH = html.slice(html.indexOf('<body'), html.lastIndexOf('</body>'))
  document.documentElement.innerHTML = thanH.replace(/<\/?body[^>]*>/g, '')
  document.body.className = /<body class="([^"]*)"/.exec(html)?.[1] ?? ''
  new Function([...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('\n'))()
}
const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s)!
const chonI = (qid: string, k: number) => document.querySelectorAll<HTMLElement>(`.q-card[data-qid="${qid}"] .q-opt.lam-o`)[k].click()
const cho = () => new Promise((r) => setTimeout(r, 0))

describe('trong trình duyệt giả: câu thử sức không tính vào tiến độ và không chặn nộp chặng', () => {
  let guiHost: ReturnType<typeof vi.fn>
  const nopChang = () => guiHost.mock.calls.filter((c) => c[0]?.type === 'ddh-btvn-nop-chang')
  beforeEach(() => {
    guiHost = vi.fn()
    Object.defineProperty(window, 'parent', { value: { postMessage: guiHost }, configurable: true })
    window.confirm = vi.fn(() => true) as unknown as typeof window.confirm
    globalThis.fetch = vi.fn() as unknown as typeof fetch
    localStorage.clear()
  })

  it('tổng = 2 (chỉ bắt buộc); làm câu thử sức KHÔNG tăng "Đã làm"; làm câu bắt buộc mới tăng', () => {
    moPhieu(phieuJs())
    expect($('#nop-tong').textContent).toBe('2')
    expect($('#nop-dem').textContent).toBe('0')
    chonI('t1', 0)
    expect($('#nop-dem').textContent).toBe('0')
    chonI('b1', 1)
    expect($('#nop-dem').textContent).toBe('1')
  })
  it('làm đủ 2 câu bắt buộc, bỏ trống thử sức ⇒ nộp NGAY một lần, không hỏi "còn N câu chưa làm"', async () => {
    moPhieu(phieuJs())
    chonI('b1', 0)
    chonI('b2', 1)
    $('#nut-nop').click()
    await cho()
    expect(nopChang()).toHaveLength(1)
    expect(nopChang()[0][0]).toEqual({ type: 'ddh-btvn-nop-chang', ma: 'BTVN-abc', sbd: '12121212', chiSo: 0, dapAn: { b1: 'A', b2: 'B' } })
    expect($('#nop-loi').hidden).toBe(true)
  })
  it('có làm câu thử sức: đáp án đi CÙNG gói nộp chặng (máy chủ chấm theo luật câu thưởng)', async () => {
    moPhieu(phieuJs())
    chonI('b1', 0)
    chonI('b2', 1)
    chonI('t2', 2)
    $('#nut-nop').click()
    await cho()
    expect(nopChang()[0][0].dapAn).toEqual({ b1: 'A', b2: 'B', t2: 'C' })
  })
  it('còn câu BẮT BUỘC trống vẫn hỏi (chỉ đếm bắt buộc): "Còn 1 câu chưa làm", không tính hai câu thử sức', async () => {
    moPhieu(phieuJs())
    chonI('b1', 0)
    $('#nut-nop').click()
    await cho()
    expect(nopChang()).toHaveLength(0)
    expect($('#nop-loi').textContent).toContain('Còn 1 câu chưa làm')
  })
  it('chỉ làm câu thử sức, chưa làm câu bắt buộc nào ⇒ "chưa làm câu nào trong chặng", không gửi', async () => {
    moPhieu(phieuJs())
    chonI('t1', 0)
    $('#nut-nop').click()
    await cho()
    expect(nopChang()).toHaveLength(0)
    expect($('#nop-loi').textContent).toContain('chưa làm câu nào')
  })
  it('xong hết câu bắt buộc ⇒ trạng thái "xong" của phiếu bật dù câu thử sức chưa làm', async () => {
    moPhieu(phieuJs())
    chonI('b1', 0)
    chonI('b2', 1)
    await cho()
    expect(document.body.classList.contains('gd-xong')).toBe(true)
  })
})

describe('bảng nhiệm vụ: "N câu của em (+M câu thử sức thêm, không bắt buộc)"', () => {
  const NOW = new Date(2026, 8, 21, 10, 0).getTime()
  const v = (o: object) => ({ thuTu: 1, batBuoc: true, khan: false, cong: null, hien: true, nhan: null, trangThai: 'cho', ghiChu: '', chiTiet: {}, hanCung: null, hanMem: null, nguon: 'x', ...o })
  const keHoach = (chiSo: number, them: object = {}): KeHoachNgayMayChu => ({
    ok: true, ngay: '2026-09-21', nganSach: { mucTieuCau: 12, toiThieuCau: 6, vanTocGiay: 80, vanTocNguon: 'do', ghiChuVanToc: '' },
    viec: [v({ id: 'btvn_lo:B1:' + chiSo, loai: 'btvn_lo', soCau: 4, chiTiet: { ma: 'B1', caNhan: true, chiSo, tongLo: 3 }, ...them })] as never,
    canhBao: [], quaHan: [], tienBo: { daLamCau: 3, lenBac: 0, tutBac: 0, dat: false, toiThieuCau: 6, conThieu: 3 }, chuoiDat: 0, lanNghi: false, capNhatLuc: new Date(NOW).toISOString(),
  })
  const phu = (soThuSucThem: unknown) => ({ dsBtvn: [{ maBtvn: 'B1', tenBtvn: 'BTVN Este', soChang: 3, soThuSucThem }] })
  const moTa = (chiSo: number, ts: unknown) => {
    const d = tuKeHoachNgay(keHoach(chiSo), NOW, phu(ts) as never)
    return [...(d.lamNgay ? [d.lamNgay] : []), ...d.cacBac.flatMap((b) => b.viec)][0]!.moTa
  }
  it('CHẶNG CUỐI (chặng 3/3): "4 câu của em (+2 câu thử sức thêm, không bắt buộc)"', () => {
    expect(moTa(2, 2)).toContain('4 câu của em (+2 câu thử sức thêm, không bắt buộc)')
  })
  it('chặng không phải cuối: chỉ "4 câu của em" (nhóm thử sức mở cùng chặng cuối)', () => {
    expect(moTa(0, 2)).toContain('4 câu của em')
    expect(moTa(0, 2)).not.toContain('thử sức')
    expect(moTa(1, 2)).not.toContain('thử sức')
  })
  it('máy chủ chưa gửi / 0 / rác ⇒ như cũ', () => {
    for (const ts of [undefined, null, 0, '', 'x', -3, 1.5]) expect(moTa(2, ts)).not.toContain('thử sức')
  })
  it('soThuSucCua: ưu tiên /hs/btvn, rồi chiTiet; số nguyên dương mới tính', () => {
    expect(soThuSucCua({ soThuSucThem: 3 }, { soThuSucThem: 5 })).toBe(3)
    expect(soThuSucCua({}, { soThuSucThem: 5 })).toBe(5)
    expect(soThuSucCua({ soThuSucThem: 0 }, { soThuSucThem: 4 })).toBe(4)
    expect(soThuSucCua(undefined)).toBe(0)
    expect(soThuSucCua({ soThuSucThem: '2' })).toBe(2)
  })
})

describe('hero: dòng thử sức', () => {
  it('có soThuSuc > 0 ⇒ có dòng; 0/vắng ⇒ không có phần tử', () => {
    const d: DauBaiCaNhanVao = { tong: 12, soChang: 4, phutMoiNgay: null, han: '', chang: [], chiSoHienThi: null, nhanChang: {} }
    expect(heroCaNhanHtml({ ...d, soThuSuc: 3 })).toContain('<div class="gcn-hero-ts">(+3 câu thử sức thêm, không bắt buộc)</div>')
    expect(heroCaNhanHtml({ ...d, soThuSuc: 0 })).not.toContain('gcn-hero-ts')
    expect(heroCaNhanHtml(d)).not.toContain('gcn-hero-ts')
  })
})
