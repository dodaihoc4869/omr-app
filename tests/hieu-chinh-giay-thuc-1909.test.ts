// M6 — TỰ HIỆU CHỈNH THỜI GIAN LÊN BẢNG TỪ GIÂY THẬT (21/09/2026, Code 1).
//
//   tờ chiếu đo   giây thật từ lúc đợt bắt đầu LÀM BÀI tới lúc thầy bấm + T dự tính của ĐÚNG khoảng ấy (mô hình CHƯA hiệu chỉnh)
//   app lọc       giây 20..1800 (ngoài khoảng: BỎ số đo, vẫn ghi kết quả); chỉ lưu mẫu khi máy chủ đã nhận
//   hệ số         (phần, sao) → trung vị(giây / T) khi có ≥ 8 mẫu, kẹp 0,6..1,4; tất định, không phụ thuộc thứ tự mẫu
//   áp dụng       `thoiGianCau({heSo})` nhân đều ba thành phần — Engine E và tờ chiếu cùng dùng
//
// Phần đầu-cuối (tờ ↔ màn ↔ lưu ↔ buổi sau) nằm ở `goi-len-bang-to-chieu-cham-1909.test.tsx`.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { JSDOM, VirtualConsole } from 'jsdom'
import { GIAY_THUC, CAU_HINH_LEN_BANG_MAC_DINH, THOI_GIAN_LEN_BANG, nganSachGiay } from '../src/lib/len-bang-cau-hinh'
import { chuanDuTinh, chuanGiayThuc, chuanMau, heSoCua, heSoHieuChinh, khoaHeSo, themMau, trungVi, type MauGiayThuc } from '../src/lib/hieu-chinh-giay-thuc'
import { thoiGianCau, type NoiDungCau } from '../src/lib/thoi-gian-len-bang'
import { BTVN_RONG, type HoSoEmDayDu } from '../src/lib/ho-so-lop'
import { xepBuoiChua, type CauVaoXep } from '../src/lib/xep-buoi-chua'
import { taoHtmlMayChieu, type OBang } from '../src/lib/html-may-chieu'
import { GIAO_DIEN_TO_CHIEU } from '../src/lib/giao-dien-to-chieu'
import { TIN_TO_CHIEU, kiemTinToChieu } from '../src/lib/to-chieu-cau-noi'
import type { CauChua } from '../src/lib/phan-cong'

const mau = (phan: 'I' | 'II' | 'III', sao: 0 | 1 | 2, giay: number, duTinh: number, luc = ''): MauGiayThuc => ({ phan, sao, giay, duTinh, luc })
const lap = (n: number, f: (i: number) => MauGiayThuc) => Array.from({ length: n }, (_, i) => f(i))

describe('HẰNG SỐ — một nguồn ở `len-bang-cau-hinh.ts`', () => {
  it('20..1800 s · ≥ 8 mẫu · kẹp 0,6..1,4 · giữ 400 mẫu mới nhất', () => {
    expect(GIAY_THUC).toEqual({ TOI_THIEU: 20, TOI_DA: 1800, SO_MAU_TOI_THIEU: 8, HE_SO_THAP: 0.6, HE_SO_CAO: 1.4, SO_MAU_GIU_TOI_DA: 400 })
  })
})

describe('lọc số đo lạ', () => {
  it('giây thật: chỉ 20..1800 và là số hữu hạn (làm tròn 0,1); ngoài khoảng ⇒ null (BỎ, không kẹp)', () => {
    expect(chuanGiayThuc(20)).toBe(20)
    expect(chuanGiayThuc(1800)).toBe(1800)
    expect(chuanGiayThuc(95.54)).toBe(95.5)
    for (const x of [19.9, 0, -5, 1800.1, 5000, NaN, Infinity, '90', null, undefined, {}, [], true]) expect(chuanGiayThuc(x), String(x)).toBeNull()
  })
  it('T dự tính: số hữu hạn > 0, không quá 3600', () => {
    expect(chuanDuTinh(120)).toBe(120)
    for (const x of [0, -1, NaN, Infinity, 3601, '120', null]) expect(chuanDuTinh(x), String(x)).toBeNull()
  })
  it('mẫu hợp lệ cần đủ phần I/II/III, sao 0/1/2, giây, T dự tính; thiếu/sai kiểu ⇒ null', () => {
    expect(chuanMau({ phan: 'II', sao: 1, giay: 100, duTinh: 90, luc: 'x' })).toEqual({ phan: 'II', sao: 1, giay: 100, duTinh: 90, luc: 'x' })
    for (const x of [null, 'rác', 5, { phan: 'IV', sao: 1, giay: 100, duTinh: 90 }, { phan: 'I', sao: 3, giay: 100, duTinh: 90 }, { phan: 'I', sao: 1, giay: 10, duTinh: 90 }, { phan: 'I', sao: 1, giay: 100 }, { phan: 'I', sao: 1, giay: 100, duTinh: 0 }]) {
      expect(chuanMau(x), JSON.stringify(x)).toBeNull()
    }
  })
})

describe('HỆ SỐ theo (phần, sao)', () => {
  it('dưới 8 mẫu ⇒ KHÔNG có hệ số (= không hiệu chỉnh); đúng 8 mẫu ⇒ có', () => {
    expect(heSoHieuChinh(lap(7, () => mau('I', 2, 120, 100)))).toEqual({})
    expect(heSoHieuChinh(lap(8, () => mau('I', 2, 120, 100)))).toEqual({ 'I|2': 1.2 })
  })

  it('TRUNG VỊ của giây/T: số mẫu chẵn lấy trung bình hai số giữa (4 mẫu 1,0 và 4 mẫu 1,2 ⇒ 1,1)', () => {
    const ds = [...lap(4, () => mau('II', 1, 100, 100)), ...lap(4, () => mau('II', 1, 120, 100))]
    expect(heSoHieuChinh(ds)['II|1']).toBe(1.1)
    expect(trungVi([3, 1, 2])).toBe(2)
    expect(trungVi([4, 1, 3, 2])).toBe(2.5)
  })

  it('CHỊU ĐƯỢC ngoại lai: 7 lần thầy bấm sát dự tính và 1 lần bỏ quên tờ 20 phút ⇒ hệ số vẫn ~1,0 (trung bình sẽ ra 1,4+)', () => {
    const ds = [...lap(7, () => mau('I', 1, 100, 100)), mau('I', 1, 1500, 100)]
    expect(heSoHieuChinh(ds)['I|1']).toBe(1)
  })

  it('KẸP 0,6..1,4: thầy chậm gấp 3 ⇒ 1,4; nhanh gấp 5 ⇒ 0,6', () => {
    expect(heSoHieuChinh(lap(8, () => mau('III', 2, 300, 100)))['III|2']).toBe(1.4)
    expect(heSoHieuChinh(lap(8, () => mau('III', 0, 20, 100)))['III|0']).toBe(0.6)
  })

  it('TÁCH theo (phần, sao): nhóm đủ mẫu có hệ số riêng, nhóm thiếu mẫu không bị kéo theo', () => {
    const ds = [...lap(8, () => mau('I', 2, 130, 100)), ...lap(8, () => mau('I', 0, 80, 100)), ...lap(7, () => mau('II', 2, 200, 100))]
    const b = heSoHieuChinh(ds)
    expect(b).toEqual({ 'I|2': 1.3, 'I|0': 0.8 })
    expect(heSoCua(b, 'I', 2)).toBe(1.3)
    expect(heSoCua(b, 'II', 2)).toBeUndefined()
    expect(heSoCua(b, 'I', undefined)).toBe(0.8) // chưa gắn sao ⇒ 0 sao
    expect(heSoCua(null, 'I', 2)).toBeUndefined()
    expect(khoaHeSo('II', 1)).toBe('II|1')
  })

  it('TẤT ĐỊNH: đảo thứ tự mẫu, chèn dòng rác ⇒ cùng hệ số', () => {
    const ds = lap(12, (i) => mau('I', 1, 80 + i * 7, 100))
    const a = heSoHieuChinh(ds)
    expect(heSoHieuChinh([...ds].reverse())).toEqual(a)
    expect(heSoHieuChinh([null, 'rác', ...ds, { phan: 'I' }, 5])).toEqual(a)
    expect(heSoHieuChinh('không phải mảng')).toEqual({})
  })
})

describe('lưu mẫu — chỉ giữ số mẫu mới nhất, lọc dữ liệu hỏng', () => {
  it('thêm mẫu vào danh sách đọc từ máy: bỏ dòng hỏng, giữ 400 mẫu MỚI NHẤT', () => {
    const cu = [...lap(400, (i) => mau('I', 1, 100 + (i % 50), 100, `L${i}`)), 'rác', null]
    const moi = themMau(cu, mau('II', 0, 90, 100, 'MOI'))
    expect(moi).toHaveLength(GIAY_THUC.SO_MAU_GIU_TOI_DA)
    expect(moi[moi.length - 1].luc).toBe('MOI')
    expect(moi[0].luc).toBe('L1') // mẫu cũ nhất (L0) bị đẩy ra
    expect(themMau('không phải mảng', mau('I', 1, 100, 100))).toHaveLength(1)
  })
})

// ──────────────────────── ÁP DỤNG VÀO `thoiGianCau` ────────────────────────
const nd = (soTu: number, coHinh = false, soBuoc = 0): NoiDungCau => ({ soTu, coHinh, soBuoc })

describe('`thoiGianCau({ heSo })`', () => {
  const dau = { phan: 'II' as const, sao: 1 as const, noiDung: nd(90, false, 4), tiLeLopSai: 0.5 }
  const t0 = thoiGianCau(dau)

  it('không hệ số / hệ số 1 / hệ số rác (NaN, 0, âm, không phải số) ⇒ GIỐNG HỆT bản chưa có M6', () => {
    for (const heSo of [undefined, 1, NaN, 0, -2, Infinity, '1.5' as unknown as number]) {
      expect(thoiGianCau({ ...dau, heSo }), String(heSo)).toEqual(t0)
    }
  })

  it('hệ số 1,2 ⇒ T lớn hơn ~1,2 lần (làm tròn 15 s), ba thành phần vẫn cộng đúng bằng tổng và giữ tỉ trọng pha', () => {
    // câu vừa phải để T × 1,2 chưa chạm trần `TOI_DA_GIAY` (480 s) — trần vẫn áp sau hiệu chỉnh
    const dauVua = { phan: 'I' as const, sao: 1 as const, noiDung: nd(40, false, 3), tiLeLopSai: 0.3 }
    const g0 = thoiGianCau(dauVua)
    expect(g0.tong * 1.2).toBeLessThan(THOI_GIAN_LEN_BANG.TOI_DA_GIAY)
    const t = thoiGianCau({ ...dauVua, heSo: 1.2 })
    expect(Math.abs(t.tong - 1.2 * g0.tong)).toBeLessThanOrEqual(15)
    expect(t.doc + t.lam + t.chua).toBe(t.tong)
    expect(t.tong).toBeGreaterThan(g0.tong)
    expect(Math.abs(t.chua / t.tong - g0.chua / g0.tong)).toBeLessThan(0.03)
    expect(thoiGianCau({ ...dauVua, heSo: 0.8 }).tong).toBeLessThan(g0.tong)
    // trần vẫn áp: câu đã sát trần thì hệ số cao không đẩy quá 480 s
    expect(thoiGianCau({ ...dau, heSo: 1.4 }).tong).toBeLessThanOrEqual(THOI_GIAN_LEN_BANG.TOI_DA_GIAY)
  })

  it('hệ số ngoài 0,6..1,4 bị kẹp lại (đề phòng bảng hệ số lỗi)', () => {
    expect(thoiGianCau({ ...dau, heSo: 9 })).toEqual(thoiGianCau({ ...dau, heSo: 1.4 }))
    expect(thoiGianCau({ ...dau, heSo: 0.05 })).toEqual(thoiGianCau({ ...dau, heSo: 0.6 }))
  })

  it('câu THIẾU văn bản (300/180/120 thầy đã chốt) KHÔNG bị hiệu chỉnh', () => {
    for (const sao of [0, 1, 2] as const) expect(thoiGianCau({ phan: 'I', sao, heSo: 1.4 })).toEqual(thoiGianCau({ phan: 'I', sao }))
    expect(thoiGianCau({ phan: 'I', sao: 2, heSo: 1.4 }).tong).toBe(300)
  })
})

// ──────────────────────── ENGINE E ────────────────────────
const cauChua = (id: string, i: number, sao: 0 | 1 | 2): CauChua => ({ id, phan: 'I', so: i, chuyenDe: 'CD', mucDo: 'hieu', tomTat: '', viTri: i, sao, lyDoSao: '' })
const em = (i: number): HoSoEmDayDu => ({ sbd: `120${String(i).padStart(2, '0')}`, hoTen: `Em ${i}`, coMat: true, chuyenDe: [], cauSai: [], daLam: new Map(), lenBang: { soLan: 0, lanCuoi: '', qids: [] }, btvn: { ...BTVN_RONG, theoCau: new Map() } })

describe('Engine E dùng hệ số của từng câu', () => {
  const cau = (i: number, o: Partial<CauVaoXep> = {}): CauVaoXep => ({ cau: cauChua(`Q${i}`, i, (i % 3) as 0 | 1 | 2), tiLeDung: 0.5, soEmLam: 20, batBuoc: false, noiDung: nd(80, false, 4), bacUoc: 2, ...o })

  it('câu đứng một mình mang T ĐÃ hiệu chỉnh: dong.giay = thoiGianCau({heSo}).tong', () => {
    const q = cau(2)
    const truoc = xepBuoiChua([q], [em(1)]).dong[0].giay
    const sau = xepBuoiChua([{ ...q, heSoHieuChinh: 1.3 }], [em(1)]).dong[0].giay
    expect(truoc).toBe(thoiGianCau({ phan: 'I', sao: 2, noiDung: q.noiDung, tiLeLopSai: 0.5 }).tong)
    expect(sau).toBe(thoiGianCau({ phan: 'I', sao: 2, noiDung: q.noiDung, tiLeLopSai: 0.5, heSo: 1.3 }).tong)
    expect(sau).toBeGreaterThan(truoc)
  })

  it('hệ số CAO hơn ⇒ buổi lên bảng được ÍT em hơn hoặc bằng (giờ khan hiếm hơn), không bao giờ vượt ngân sách', () => {
    const ds = (h?: number) => Array.from({ length: 40 }, (_, i) => cau(i + 1, { heSoHieuChinh: h, bacUoc: undefined }))
    const lop = Array.from({ length: 30 }, (_, i) => em(i + 1))
    const a = xepBuoiChua(ds(), lop)
    const b = xepBuoiChua(ds(1.4), lop)
    const c = xepBuoiChua(ds(0.6), lop)
    expect(b.soEmLenBang).toBeLessThanOrEqual(a.soEmLenBang)
    expect(c.soEmLenBang).toBeGreaterThanOrEqual(a.soEmLenBang)
    for (const kq of [a, b, c]) expect(kq.tongGiay).toBeLessThanOrEqual(nganSachGiay(CAU_HINH_LEN_BANG_MAC_DINH))
  })
})

// ──────────────────────── TỜ CHIẾU (JSDOM) ────────────────────────
const GOC = 'https://app.test'
const MA = 'abc123'
const cauSheet = (id: string, sao = 1): OBang['cau'] =>
  ({ phan: 'I', id, maDe: '', chuyenDe: '', dang: 'x', sao, mucDo: '', text: 'Ancol nào sau đây là ancol bậc II?', luaChon: ['A', 'B', 'C', 'D'], dapAn: 'B', chot: '', lyDo: null, buoc: ['Bước 1.', 'Bước 2.'], ketQua: 'B' }) as unknown as OBang['cau']
const thu = { anh: 'https://x/pet.png', ten: 'Hoả Long', danhHieu: '', he: 'Lửa', capDo: 12, hinhThai: 'Thức Tỉnh', tangThapCaoNhat: 3, soCauDaThanhTay: 0, capToiDa: 120 } as NonNullable<OBang['thanThu']>
const o = (sbd: string, extra: Partial<OBang> = {}): OBang => ({ sbd, hoTen: `Em ${sbd}`, qid: `q-${sbd}`, soCau: 3, sao: 1, cau: cauSheet(`q-${sbd}`), ...extra })

function moTo(dsO: OBang[], opt: { dayHoc?: boolean; thu?: boolean } = {}) {
  const hen: { f: () => void; ms: number; iv: boolean; id: number; huy: boolean }[] = []
  let bay = 0
  const gui: { m: Record<string, unknown>; o: string }[] = []
  const cha = new JSDOM('<!doctype html><body></body>', { url: `${GOC}/` }).window as unknown as Window
  ;(cha as unknown as { postMessage: (m: Record<string, unknown>, o: string) => void }).postMessage = (m, og) => void gui.push({ m, o: og })
  const html = taoHtmlMayChieu(opt.thu ? dsO.map((x) => ({ ...x, thanThu: thu })) : dsO, { cauNoi: { maPhien: MA }, dayHoc: opt.dayHoc })
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    virtualConsole: new VirtualConsole(),
    beforeParse(w) {
      Object.defineProperty(w, 'parent', { get: () => cha, configurable: true })
      let id = 0
      w.Date.now = () => bay
      w.setTimeout = ((f: () => void, ms: number) => (hen.push({ f, ms, iv: false, id: ++id, huy: false }), id)) as never
      w.setInterval = ((f: () => void, ms: number) => (hen.push({ f, ms, iv: true, id: ++id, huy: false }), id)) as never
      w.clearTimeout = w.clearInterval = ((h: number) => {
        const x = hen.find((t) => t.id === h)
        if (x) x.huy = true
      }) as never
      w.HTMLElement.prototype.scrollTo = () => {}
      Object.defineProperty(w.HTMLImageElement.prototype, 'complete', { get: () => true, configurable: true })
      Object.defineProperty(w.HTMLImageElement.prototype, 'naturalWidth', { get: () => 100, configurable: true })
    },
  })
  const w = dom.window as unknown as Window & typeof globalThis
  const doc = dom.window.document
  const chay = (ms: number) => hen.filter((t) => !t.huy && !t.iv && t.ms === ms).forEach((t) => ((t.huy = true), t.f()))
  const tuCha = (data: unknown) => w.dispatchEvent(new (dom.window as unknown as { MessageEvent: typeof MessageEvent }).MessageEvent('message', { data, origin: GOC, source: cha as unknown as MessageEventSource }))
  tuCha({ type: TIN_TO_CHIEU.KET_NOI, maPhien: MA })
  const dat = (giay: number) => {
    bay = giay * 1000
  }
  const bam = (i: number, chu: 'Đạt' | 'Chưa đạt') => {
    const v = doc.querySelectorAll<HTMLElement>('.mc-cham')[i]
    const nut = [...v.querySelectorAll<HTMLButtonElement>('.mc-cham-nut')].find((b) => b.textContent === chu)!
    nut.click()
    return v
  }
  const cham = () => gui.filter((g) => g.m.type === TIN_TO_CHIEU.CHAM).map((g) => g.m)
  const goiXong = () => {
    chay(GIAO_DIEN_TO_CHIEU.GOI_TEN_MS)
    chay(GIAO_DIEN_TO_CHIEU.BAY_VE_THE_MS + 60)
  }
  const nua = () => [...doc.querySelectorAll<HTMLElement>('.mc-nua[data-lam]')]
  const so = (n: HTMLElement, k: string) => Number(n.getAttribute(k))
  return { html, doc, w, dat, bam, cham, goiXong, nua, so, tuCha }
}

describe('tờ chiếu gọi thủ công không đo giờ',()=>{
  it.each([false,true])('dayHoc=%s: ghi kết quả vẫn hoạt động, không gửi giây/dự tính',dayHoc=>{
    const t=moTo([o('A'),o('B'),o('C'),o('D')],{dayHoc})
    t.doc.getElementById('mc-len-bang')!.click()
    t.dat(100);t.bam(0,'Đạt')
    t.doc.getElementById('mc-sau')!.click()
    t.doc.getElementById('mc-len-bang')!.click()
    t.dat(300);t.bam(3,'Chưa đạt')
    const messages=t.cham()
    expect(messages).toHaveLength(2)
    expect(messages[0]).toMatchObject({khoa:'A|q-A',dat:true})
    expect(messages[1]).toMatchObject({khoa:'D|q-D',dat:false})
    for(const m of messages){expect(m).not.toHaveProperty('giay');expect(m).not.toHaveProperty('duTinh')}
  })
})

describe('app lọc tin: `kiemTinToChieu` mang `giayThuc` chỉ khi CẢ HAI số hợp lệ', () => {
  const ctx = { maPhien: MA, gocApp: GOC, laKhungToChieu: () => true, khoaHopLe: () => true }
  const gui = (extra: Record<string, unknown>) => kiemTinToChieu({ data: { type: TIN_TO_CHIEU.CHAM, maPhien: MA, khoa: 'S|Q', dat: true, ...extra }, origin: GOC, source: {} }, ctx)
  it('hợp lệ ⇒ có giayThuc (làm tròn 0,1)', () => {
    expect(gui({ giay: 95.54, duTinh: 120 })).toEqual({ loai: 'cham', khoa: 'S|Q', dat: true, giayThuc: { giay: 95.5, duTinh: 120 } })
  })
  it('thiếu / ngoài khoảng / sai kiểu ⇒ lệnh ghi VẪN nhận nhưng không có giayThuc', () => {
    for (const x of [{}, { giay: 95 }, { duTinh: 120 }, { giay: 19, duTinh: 120 }, { giay: 1801, duTinh: 120 }, { giay: '95', duTinh: 120 }, { giay: 95, duTinh: 0 }, { giay: 95, duTinh: 'x' }]) {
      expect(gui(x), JSON.stringify(x)).toEqual({ loai: 'cham', khoa: 'S|Q', dat: true })
    }
  })
})

describe('khoá nguồn', () => {
  const man = readFileSync('src/screens/GoiLenBangScreen.tsx', 'utf8')
  it('màn Gọi lên bảng: nạp mẫu lúc mở, truyền hệ số cho Engine E VÀ tờ chiếu, gửi `giayThuc` cùng lệnh ghi, lưu mẫu SAU khi máy chủ nhận', () => {
    expect(man).toContain('heSoHieuChinh(await docMauGiayThuc())')
    expect(man).toContain('heSoHieuChinh: heSoCua(heSoHC, d.cau.phan, d.cau.sao)')
    expect(man).toContain('heSoHieuChinh: heSoCua(heSoHC, p.cau.phan, p.cau.sao)')
    expect(man).toContain('...(giayThuc ? { giayThuc: giayThuc.giay } : {})')
    expect(man.indexOf('await ghiLenBang(cauHinh.url')).toBeLessThan(man.indexOf('void ghiMauGiayThuc(p.cau, giayThuc)'))
    expect(man).toContain('ghiTheoKhoaRef.current?.(o, tin.dat, tin.giayThuc)')
    expect(man).toContain('xepBuoiChuaMoi(cauVaoXep, hoSo, CAU_HINH_LEN_BANG_MAC_DINH') // LUẬT MỚI 25/09: thay Engine E
  })
  it('exam-api gửi `giayThuc` chỉ khi có; cầu nối đo qua `__mcGiayDot`', () => {
    expect(readFileSync('src/lib/exam-api.ts', 'utf8')).toContain('...(d.giayThuc !== undefined ? { giayThuc: d.giayThuc } : {})')
    expect(readFileSync('src/lib/to-chieu-cau-noi.ts', 'utf8')).toContain('window.__mcGiayDot')
    expect(readFileSync('src/lib/html-may-chieu.ts', 'utf8')).toContain('window.__mcGiayDot = function () { return null; }')
  })
})
