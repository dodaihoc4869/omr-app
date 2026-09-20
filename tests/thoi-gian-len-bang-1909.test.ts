// M1 — THỜI GIAN LÊN BẢNG THEO ĐỘ KHÓ × ĐỘ DÀI × EM (19/09/2026, 0.Planer giao, thầy chốt).
//
//   T = T_đọc + T_làm + T_chữa — công thức và hằng số ở `THOI_GIAN_LEN_BANG` (`len-bang-cau-hinh.ts`).
//   Bảng giá trị dưới đây tính TAY từ công thức: đổi hằng số là phải xem lại và sửa bảng (có chủ ý).
//   TƯƠNG THÍCH: câu thiếu văn bản rơi về 300/180/120 (`xep-buoi-chua-1409` khoá) — không đổi.
import { describe, it, expect } from 'vitest'
import { CAU_HINH_LEN_BANG_MAC_DINH, THOI_GIAN_LEN_BANG, giayLenBang, nganSachGiay } from '../src/lib/len-bang-cau-hinh'
import {
  demTu,
  giayBienGhepDoi,
  noiDungTuCauGoc,
  noiDungTuCauLuyen,
  thoiGianCau,
  thoiGianDot,
  type DauVaoThoiGian,
  type NoiDungCau,
} from '../src/lib/thoi-gian-len-bang'
import { BTVN_RONG, type HoSoEmDayDu, type NamKtCauEm } from '../src/lib/ho-so-lop'
import { xepBuoiChua, type CauVaoXep } from '../src/lib/xep-buoi-chua'
import { thoiGianDayHoc, type OBang } from '../src/lib/html-may-chieu'
import type { CauChua } from '../src/lib/phan-cong'
import type { CauLuyen } from '../src/lib/bai-tap-pdf'

const nd = (soTu: number, coHinh = false, soBuoc = 0): NoiDungCau => ({ soTu, coHinh, soBuoc })

describe('BẢNG GIÁ TRỊ — tính tay từ công thức (một nguồn hằng số)', () => {
  const bang: { ten: string; vao: DauVaoThoiGian; doc: number; lam: number; chua: number; tho: number; tong: number }[] = [
    // T_đọc = 8 + 0,35×20 = 15 · T_làm = 45×1×(1+0,5×0,2)×1 = 49,5 · T_chữa = 30+25×2 = 80 ⇒ 144,5 → 150
    { ten: 'I · 0 sao · 20 từ · lớp sai 20% · hiểu · 2 bước', vao: { phan: 'I', sao: 0, noiDung: nd(20, false, 2), tiLeLopSai: 0.2, bacEm: 'hieu' }, doc: 15, lam: 49.5, chua: 80, tho: 144.5, tong: 150 },
    // 8+0,35×40 = 22 · 45×2,2×(1+0,25)×1 = 123,75 · (30+75)×1,3 = 136,5 ⇒ 282,25 → 285
    { ten: 'I · 2 sao · 40 từ · lớp sai 50% · hiểu · 3 bước', vao: { phan: 'I', sao: 2, noiDung: nd(40, false, 3), tiLeLopSai: 0.5, bacEm: 'hieu' }, doc: 22, lam: 123.75, chua: 136.5, tho: 282.25, tong: 285 },
    // 8+0,35×90 = 39,5 · 120×2,2×1,3×1,25 = 429 · (30+100)×1,3 = 169 ⇒ 637,5 → kẹp 480
    { ten: 'II · 2 sao · 90 từ · lớp sai 60% · BIẾT · 4 bước', vao: { phan: 'II', sao: 2, noiDung: nd(90, false, 4), tiLeLopSai: 0.6, bacEm: 'biet' }, doc: 39.5, lam: 429, chua: 169, tho: 637.5, tong: 480 },
    // 8+14+10 = 32 · 150×1,5×1,15×0,85 = 219,9375 · 30+75 = 105 ⇒ 356,9375 → 360
    { ten: 'III · 1 sao · 40 từ · CÓ HÌNH · lớp sai 30% · vận dụng · 3 bước', vao: { phan: 'III', sao: 1, noiDung: nd(40, true, 3), tiLeLopSai: 0.3, bacEm: 'van_dung' }, doc: 32, lam: 219.9375, chua: 105, tho: 356.9375, tong: 360 },
    // không lớp sai, không bậc ⇒ hệ số 1,0: 8+0,35×60 = 29 · 120×1,5 = 180 · 30+25×1 = 55 ⇒ 264 → 270 (không lời giải = 1 bước)
    { ten: 'II · 1 sao · 60 từ · KHÔNG số liệu lớp/bậc · không lời giải', vao: { phan: 'II', sao: 1, noiDung: nd(60, false, 0) }, doc: 29, lam: 180, chua: 55, tho: 264, tong: 270 },
  ]

  for (const b of bang) {
    it(b.ten, () => {
      const t = thoiGianCau(b.vao)
      expect(t.roiVeMacDinh).toBe(false)
      expect(t.tong).toBe(b.tong)
      // ba thành phần cộng đúng bằng tổng (tờ chiếu cộng ba số này)
      expect(t.doc + t.lam + t.chua).toBe(t.tong)
      // và đúng tỉ trọng của công thức thô (co đều khi bị kẹp/làm tròn, lệch ≤ 1 giây do làm tròn)
      const k = b.tong / b.tho
      expect(Math.abs(t.doc - b.doc * k)).toBeLessThanOrEqual(1)
      expect(Math.abs(t.chua - b.chua * k)).toBeLessThanOrEqual(1.5)
    })
  }

  it('THƯỚC ĐO HỢP LÝ: câu Phần I 0 sao ngắn không vượt 3 phút; câu III 2 sao có hình không dưới 4 phút', () => {
    const p1 = thoiGianCau({ phan: 'I', sao: 0, noiDung: nd(25, false, 2), tiLeLopSai: 0.25 })
    expect(p1.tong).toBeLessThanOrEqual(180)
    const p3 = thoiGianCau({ phan: 'III', sao: 2, noiDung: nd(50, true, 4), tiLeLopSai: 0.4 })
    expect(p3.tong).toBeGreaterThanOrEqual(240)
  })

  it('luôn trong [60, 480] giây và là bội của 15 (mọi tổ hợp, không NaN)', () => {
    for (const phan of ['I', 'II', 'III'] as const)
      for (const sao of [0, 1, 2] as const)
        for (const soTu of [0, 5, 60, 400, 5000])
          for (const coHinh of [false, true])
            for (const soBuoc of [0, 1, 3, 9])
              for (const tiLeLopSai of [undefined, 0, 0.3, 0.5, 1, 7, -3])
                for (const bacEm of [undefined, null, 'biet', 'hieu', 'van_dung'] as const) {
                  const t = thoiGianCau({ phan, sao, noiDung: nd(soTu, coHinh, soBuoc), tiLeLopSai, bacEm })
                  expect(Number.isFinite(t.tong)).toBe(true)
                  expect(t.tong).toBeGreaterThanOrEqual(THOI_GIAN_LEN_BANG.TOI_THIEU_GIAY)
                  expect(t.tong).toBeLessThanOrEqual(THOI_GIAN_LEN_BANG.TOI_DA_GIAY)
                  expect(t.tong % THOI_GIAN_LEN_BANG.LAM_TRON_GIAY).toBe(0)
                  expect(t.doc + t.lam + t.chua).toBe(t.tong)
                  expect(t.doc).toBeGreaterThanOrEqual(0)
                  expect(t.lam).toBeGreaterThanOrEqual(0)
                  expect(t.chua).toBeGreaterThanOrEqual(0)
                }
  }, 60000)

  it('ĐƠN ĐIỆU: đề dài hơn, sao cao hơn, lớp sai nhiều hơn ⇒ không bao giờ ngắn hơn', () => {
    const tg = (o: Partial<DauVaoThoiGian> & { soTu?: number }) => thoiGianCau({ phan: 'II', sao: 1, noiDung: nd(o.soTu ?? 50, false, 3), ...o }).tong
    expect(tg({ soTu: 200 })).toBeGreaterThanOrEqual(tg({ soTu: 50 }))
    expect(tg({ sao: 2 })).toBeGreaterThanOrEqual(tg({ sao: 1 }))
    expect(tg({ sao: 1 })).toBeGreaterThanOrEqual(tg({ sao: 0 }))
    expect(tg({ tiLeLopSai: 0.8 })).toBeGreaterThanOrEqual(tg({ tiLeLopSai: 0.1 }))
    expect(tg({ bacEm: 'biet' })).toBeGreaterThanOrEqual(tg({ bacEm: 'hieu' }))
    expect(tg({ bacEm: 'hieu' })).toBeGreaterThanOrEqual(tg({ bacEm: 'van_dung' }))
  })

  it('HÌNH/BẢNG cộng đúng DOC_HINH_GIAY vào T_đọc (trước khi kẹp)', () => {
    const a = thoiGianCau({ phan: 'I', sao: 1, noiDung: nd(30, false, 2) }, CAU_HINH_LEN_BANG_MAC_DINH, { ...THOI_GIAN_LEN_BANG, LAM_TRON_GIAY: 1 } as typeof THOI_GIAN_LEN_BANG)
    const b = thoiGianCau({ phan: 'I', sao: 1, noiDung: nd(30, true, 2) }, CAU_HINH_LEN_BANG_MAC_DINH, { ...THOI_GIAN_LEN_BANG, LAM_TRON_GIAY: 1 } as typeof THOI_GIAN_LEN_BANG)
    expect(b.tong - a.tong).toBe(THOI_GIAN_LEN_BANG.DOC_HINH_GIAY)
  })

  it('số bước lời giải kẹp trong [1, 6]: 0 bước = 1 bước, 20 bước = 6 bước', () => {
    const chua = (soBuoc: number) => thoiGianCau({ phan: 'I', sao: 1, noiDung: nd(30, false, soBuoc) }).chua
    const goc = (soBuoc: number) => thoiGianCau({ phan: 'I', sao: 1, noiDung: nd(30, false, soBuoc) }, CAU_HINH_LEN_BANG_MAC_DINH, { ...THOI_GIAN_LEN_BANG, LAM_TRON_GIAY: 1, TOI_DA_GIAY: 99999 } as typeof THOI_GIAN_LEN_BANG).chua
    expect(goc(0)).toBe(goc(1))
    expect(goc(20)).toBe(goc(6))
    expect(goc(6)).toBeGreaterThan(goc(5))
    expect(chua(2)).toBeLessThan(chua(4))
  })

  it('câu 0 SAO chữa tối đa 3 bước (câu dễ không chữa 6 bước trên bảng); sao 1, 2 vẫn kẹp 6', () => {
    const cfg = { ...THOI_GIAN_LEN_BANG, LAM_TRON_GIAY: 1, TOI_DA_GIAY: 99999 } as typeof THOI_GIAN_LEN_BANG
    const chua = (sao: 0 | 1 | 2, soBuoc: number) => thoiGianCau({ phan: 'I', sao, noiDung: nd(30, false, soBuoc) }, CAU_HINH_LEN_BANG_MAC_DINH, cfg).chua
    expect(chua(0, 6)).toBe(chua(0, 3))
    expect(chua(0, 6)).toBe(30 + 25 * 3)
    expect(chua(0, 2)).toBe(30 + 25 * 2) // dưới trần thì giữ nguyên
    expect(chua(1, 6)).toBe(30 + 25 * 6)
    expect(chua(2, 9)).toBe(30 + 25 * 6)
    // câu I·0 sao·60 từ·6 bước từng ra 255 s (>4 phút) — nay còn ≤ 3 phút ở chi phí ghép đôi
    const t = thoiGianCau({ phan: 'I', sao: 0, noiDung: nd(60, false, 6), tiLeLopSai: 0.3, bacEm: 'hieu' })
    expect(giayBienGhepDoi(t)).toBeLessThanOrEqual(180)
  })

  it('lớp sai ≥ 50% nhân T_chữa 1,3; dưới 50% thì không', () => {
    const cfg = { ...THOI_GIAN_LEN_BANG, LAM_TRON_GIAY: 1, TOI_DA_GIAY: 99999 } as typeof THOI_GIAN_LEN_BANG
    const chua = (s: number) => thoiGianCau({ phan: 'I', sao: 0, noiDung: nd(30, false, 2), tiLeLopSai: s }, CAU_HINH_LEN_BANG_MAC_DINH, cfg).chua
    expect(chua(0.49)).toBe(80)
    expect(chua(0.5)).toBe(104)
  })
})

describe('TƯƠNG THÍCH — câu thiếu văn bản rơi về 300 / 180 / 120', () => {
  it('không có noiDung ⇒ đúng GIAY_LEN_BANG_THEO_SAO, bất kể lớp sai / bậc em', () => {
    for (const [sao, giay] of [[2, 300], [1, 180], [0, 120]] as const) {
      const t = thoiGianCau({ phan: 'II', sao, tiLeLopSai: 0.9, bacEm: 'biet' })
      expect(t.tong).toBe(giay)
      expect(t.roiVeMacDinh).toBe(true)
      expect(t.doc + t.lam + t.chua).toBe(giay)
      expect(t.tong).toBe(giayLenBang(CAU_HINH_LEN_BANG_MAC_DINH, sao))
    }
    expect(thoiGianCau({ phan: 'I' }).tong).toBe(120) // chưa gắn sao = 0 sao
  })

  it('hằng số cũ KHÔNG bị đổi', () => {
    expect(CAU_HINH_LEN_BANG_MAC_DINH.GIAY_LEN_BANG_THEO_SAO).toEqual({ 2: 300, 1: 180, 0: 120 })
    expect(nganSachGiay(CAU_HINH_LEN_BANG_MAC_DINH)).toBe(4920)
  })
})

describe('T_đợt — hai em song song', () => {
  it('T_đợt = max(T_đọc+T_làm) + T_chữa_A + T_chữa_B; một em = đúng T của em ấy', () => {
    const a = thoiGianCau({ phan: 'I', sao: 1, noiDung: nd(30, false, 2) })
    const b = thoiGianCau({ phan: 'II', sao: 2, noiDung: nd(80, false, 4), tiLeLopSai: 0.4 })
    expect(thoiGianDot(a)).toBe(a.tong)
    expect(thoiGianDot(a, b)).toBe(Math.max(a.doc + a.lam, b.doc + b.lam) + a.chua + b.chua)
    expect(thoiGianDot(a, b)).toBe(thoiGianDot(b, a)) // giao hoán
    expect(thoiGianDot(a, b)).toBeLessThan(a.tong + b.tong) // song song rẻ hơn nối tiếp
  })
})

describe('đo nội dung câu', () => {
  it('demTu: bỏ thẻ HTML, mỗi công thức một từ, chuỗi rỗng = 0', () => {
    expect(demTu('')).toBe(0)
    expect(demTu(undefined)).toBe(0)
    expect(demTu('  a   b  ')).toBe(2)
    expect(demTu('Cho <b>este</b> X')).toBe(3)
    expect(demTu('Tính $x^2 + 1$ và \\ce{H2O} xong')).toBe(5)
  })

  const luyen = (o: Partial<CauLuyen>): CauLuyen => ({ phan: 'I', id: 'q', maDe: '', chuyenDe: '', dang: 'chua_ro', sao: 0, mucDo: '', text: 'một hai ba', luaChon: ['a b', 'c', 'd', 'e'], dapAn: 'A', chot: '', lyDo: null, buoc: null, ketQua: '', ...o }) as CauLuyen

  it('CauLuyen: từ = đề + phương án; hình/bảng; số bước', () => {
    expect(noiDungTuCauLuyen(luyen({}))).toEqual({ soTu: 3 + 2 + 1 + 1 + 1, coHinh: false, soBuoc: 0 })
    expect(noiDungTuCauLuyen(luyen({ bang: [['a']] })).coHinh).toBe(true)
    expect(noiDungTuCauLuyen(luyen({ text: 'x <img src="a"> y' })).coHinh).toBe(true)
    expect(noiDungTuCauLuyen(luyen({ buoc: ['1', '2', '3'] })).soBuoc).toBe(3)
    expect(noiDungTuCauLuyen(luyen({ lyDo: [{ khoa: 'A', dung: true, ly: '' }, { khoa: 'B', dung: false, ly: '' }, { khoa: 'C', dung: false, ly: '' }] })).soBuoc).toBe(2)
  })

  it('đề là ẢNH (cắt cả thân) không tính thành 0 từ — ước một đề trung bình', () => {
    const t = noiDungTuCauLuyen(luyen({ anhThanCau: 'data:image/png;base64,xx', text: '', luaChon: null }))
    expect(t.coHinh).toBe(true)
    expect(t.soTu).toBeGreaterThan(0)
  })

  it('câu GỐC trong gói đề: Phần I đếm choices, Phần II đếm ideas, lời giải có bước / lý do từng phương án', () => {
    expect(noiDungTuCauGoc('I', { text: 'một hai', choices: ['a', 'b c', 'd', 'e'] })).toEqual({ soTu: 2 + 1 + 2 + 1 + 1, coHinh: false, soBuoc: 0 })
    expect(noiDungTuCauGoc('II', { text: 'một', ideas: ['a', 'b', 'c', 'd'], table: [['x']] })).toEqual({ soTu: 5, coHinh: true, soBuoc: 0 })
    expect(noiDungTuCauGoc('III', { text: 'một hai ba', loiGiai: { buoc: ['1', '2'], chot: 'x' } })).toEqual({ soTu: 3, coHinh: false, soBuoc: 2 })
    expect(noiDungTuCauGoc('I', { text: 'a', choices: [], loiGiai: { chot: 'x', tungPa: { A: {}, B: {}, C: {}, D: {} } } }).soBuoc).toBe(2)
    expect(noiDungTuCauGoc('I', { text: 'a', explanation: 'vì …' }).soBuoc).toBe(1)
    expect(noiDungTuCauGoc('I', null)).toEqual({ soTu: 0, coHinh: false, soBuoc: 0 }) // dữ liệu hỏng không ném lỗi
  })
})

describe('chi phí trong NGÂN SÁCH BUỔI khi hai em lên SONG SONG (giayBienGhepDoi)', () => {
  it('= T_chữa + ½ × (T_đọc + T_làm), làm tròn 15 s; câu thiếu văn bản giữ nguyên 300/180/120', () => {
    const t = thoiGianCau({ phan: 'II', sao: 1, noiDung: nd(90, false, 4), tiLeLopSai: 0.4, bacEm: 'hieu' })
    expect(giayBienGhepDoi(t)).toBe(Math.round((t.chua + 0.5 * (t.doc + t.lam)) / 15) * 15)
    for (const sao of [0, 1, 2] as const) expect(giayBienGhepDoi(thoiGianCau({ phan: 'I', sao }))).toBe(giayLenBang(CAU_HINH_LEN_BANG_MAC_DINH, sao))
  })

  it('BẢNG: các con số rơi đúng cỡ của 300/180/120 cũ (không phải gấp đôi) — 2 sao Phần II/III dài ≈ 300, 0 sao Phần I ngắn ≈ 120–150', () => {
    const b = (phan: 'I' | 'II' | 'III', sao: 0 | 1 | 2, soTu: number, coHinh: boolean, soBuoc: number, lop: number, bac: 'biet' | 'hieu' | 'van_dung') =>
      giayBienGhepDoi(thoiGianCau({ phan, sao, noiDung: nd(soTu, coHinh, soBuoc), tiLeLopSai: lop, bacEm: bac }))
    expect(b('I', 0, 20, false, 2, 0.2, 'hieu')).toBe(120)
    expect(b('I', 1, 30, false, 3, 0.4, 'hieu')).toBe(165)
    expect(b('I', 2, 80, true, 5, 0.6, 'biet')).toBe(300)
    expect(b('II', 2, 90, false, 4, 0.6, 'biet')).toBe(300)
    expect(b('III', 2, 50, true, 4, 0.4, 'hieu')).toBe(300)
    expect(b('III', 2, 70, true, 5, 0.7, 'biet')).toBe(300)
  })

  it('SÀN 20 EM GIỮ ĐƯỢC với đề thật (có văn bản, đủ Phần I/II/III): buổi 24–50 câu, 30 em ⇒ ≥ 20 em, tổng ≤ 4.920 s', () => {
    const lop = Array.from({ length: 30 }, (_, i) => emCo(i + 1))
    const mk = (i: number): CauVaoXep => {
      const sao = ([2, 1, 0] as const)[i % 3]
      const phan = (['I', 'I', 'I', 'II', 'III'] as const)[i % 5]
      const soTu = phan === 'I' ? 30 + (i % 4) * 12 : phan === 'II' ? 80 + (i % 3) * 25 : 45
      return { cau: cauChua(i + 1, sao, phan), tiLeDung: 0.7 - (i % 5) * 0.1, soEmLam: 25, batBuoc: false, noiDung: nd(soTu, i % 6 === 0, 2 + (i % 4)) }
    }
    for (const n of [24, 30, 40, 50]) {
      const kq = xepBuoiChua(Array.from({ length: n }, (_, i) => mk(i)), lop)
      expect(kq.soEmLenBang, `${n} câu`).toBeGreaterThanOrEqual(20)
      expect(kq.datSan, `${n} câu`).toBe(true)
      expect(kq.tongGiay).toBeLessThanOrEqual(nganSachGiay(CAU_HINH_LEN_BANG_MAC_DINH))
    }
  })

  it('LÝ DO có hệ số ½: buổi 30 câu thật, 20 câu RẺ NHẤT tính NỐI TIẾP đã tốn hơn ngân sách (sàn 20 em vô nghiệm); tính ghép đôi thì vừa', () => {
    const cost = (i: number) => {
      const sao = ([2, 1, 0] as const)[i % 3]
      const phan = (['I', 'I', 'I', 'II', 'III'] as const)[i % 5]
      const soTu = phan === 'I' ? 30 + (i % 4) * 12 : phan === 'II' ? 80 + (i % 3) * 25 : 45
      const t = thoiGianCau({ phan, sao, noiDung: nd(soTu, i % 6 === 0, 2 + (i % 4)), tiLeLopSai: 1 - (0.7 - (i % 5) * 0.1) })
      return { noiTiep: t.tong, ghepDoi: giayBienGhepDoi(t) }
    }
    const ds = Array.from({ length: 30 }, (_, i) => cost(i))
    const tong20 = (k: 'noiTiep' | 'ghepDoi') => ds.map((x) => x[k]).sort((a, b) => a - b).slice(0, 20).reduce((a, b) => a + b, 0)
    // 10 câu còn lại (30 − 20) vẫn phải được đọc đáp án, mỗi câu ≥ L0 = 5 giây.
    const docDapAn = 10 * CAU_HINH_LEN_BANG_MAC_DINH.GIAY_LANE.L0
    expect(tong20('noiTiep') + docDapAn).toBeGreaterThan(nganSachGiay(CAU_HINH_LEN_BANG_MAC_DINH)) // ≈4.905 + 50 > 4.920: dù chọn khéo cũng không đủ 20 em
    expect(tong20('ghepDoi') + docDapAn).toBeLessThanOrEqual(nganSachGiay(CAU_HINH_LEN_BANG_MAC_DINH)) // ≈3.700
  })
})

// ───────────────────── ENGINE E DÙNG T MỚI LÀM CHI PHÍ ─────────────────────
const CD = ['Ester – lipid', 'Carbohydrate', 'Cân bằng hoá học', 'Nguyên tử']
const cauChua = (i: number, sao: 0 | 1 | 2, phan: 'I' | 'II' | 'III' = 'I'): CauChua => ({ id: `Q${i}`, phan, so: i, chuyenDe: CD[i % CD.length], mucDo: 'hieu', tomTat: '', viTri: i, sao, lyDoSao: '' })
const vao = (i: number, sao: 0 | 1 | 2, noiDung?: NoiDungCau, phan: 'I' | 'II' | 'III' = 'I', tiLeDung: number | null = 0.5): CauVaoXep => ({ cau: cauChua(i, sao, phan), tiLeDung, soEmLam: 20, batBuoc: false, ...(noiDung ? { noiDung } : {}) })
const emCo = (i: number, bac?: NamKtCauEm['bac'], qids: string[] = []): HoSoEmDayDu => ({
  sbd: `120${String(i).padStart(2, '0')}`,
  hoTen: `Em ${i}`,
  coMat: true,
  chuyenDe: CD.map((t) => ({ ten: t, soCau: 10, soSai: 4 })),
  cauSai: [],
  daLam: new Map(),
  lenBang: { soLan: 0, lanCuoi: '', qids: [] },
  btvn: { ...BTVN_RONG, theoCau: new Map() },
  ...(bac ? { namKt: new Map(qids.map((q) => [q, { lanSai: 0, trangThai: 'chua_thay_sai', canDayLai: false, maDang: 'D', bac, dang: null } as NamKtCauEm])) } : {}),
})

describe('Engine E — chi phí lên bảng lấy từ T mới', () => {
  it('câu CÓ văn bản: `dong.giay` = T (tính theo lớp sai và bậc em, GHÉP ĐÔI THẬT khi hai câu ghép được); câu thiếu văn bản: vẫn 300/180/120', () => {
    // M5: hai câu bậc 1 CHỌN LIỀN NHAU ghép đôi thật — mỗi em mang T_chữa của mình + ½ phần làm bài dài hơn của cặp (M1 từng chia
    // ½ cho mọi câu, kể cả câu đứng một mình; nợ đã ghi ở M2). Câu thiếu văn bản không tham gia ghép (300/180/120 giữ nguyên).
    const ds = [vao(1, 2, nd(40, false, 3)), vao(2, 1), vao(3, 0, nd(20, false, 2))]
    const kq = xepBuoiChua(ds, [emCo(1), emCo(2), emCo(3)])
    const g = (id: string) => kq.dong.find((d) => d.tang === 'len_bang' && d.cau.id === id)!.giay
    const tg = (sao: 0 | 1 | 2, n: NoiDungCau) => thoiGianCau({ phan: 'I', sao, noiDung: n, tiLeLopSai: 0.5 })
    const t1 = tg(2, nd(40, false, 3))
    const t3 = tg(0, nd(20, false, 2))
    const maxL = Math.max(t1.doc + t1.lam, t3.doc + t3.lam)
    expect(g('Q1')).toBe(t1.chua + maxL / 2)
    expect(g('Q3')).toBe(t3.chua + maxL / 2)
    expect(g('Q2')).toBe(180)
  })

  it('bậc của EM ĐƯỢC CHỌN đổi chi phí: cùng câu, em "biết" tốn hơn em "vận dụng" (×1,25 so với ×0,85)', () => {
    const q = vao(1, 1, nd(40, false, 3))
    const chonBiet = xepBuoiChua([q], [emCo(1, 'biet', ['Q1'])]).dong[0]
    const chonVd = xepBuoiChua([q], [emCo(1, 'van_dung', ['Q1'])]).dong[0]
    // M5: một câu bậc 1 đứng MỘT MÌNH (không có bạn ghép đôi) mang TRỌN T, không phải ½.
    const t = (bacEm: 'biet' | 'van_dung') => thoiGianCau({ phan: 'I', sao: 1, noiDung: nd(40, false, 3), tiLeLopSai: 0.5, bacEm }).tong
    expect(chonBiet.giay).toBe(t('biet'))
    expect(chonVd.giay).toBe(t('van_dung'))
    expect(chonBiet.giay).toBeGreaterThanOrEqual(chonVd.giay)
  })

  it('tổng thời gian KHÔNG bao giờ vượt ngân sách, kể cả khi câu dài làm mỗi lượt lên bảng đắt hơn', () => {
    const ds = Array.from({ length: 40 }, (_, i) => vao(i + 1, (i % 3) as 0 | 1 | 2, nd(30 + (i % 7) * 25, i % 4 === 0, 1 + (i % 5)), (['I', 'II', 'III'] as const)[i % 3], 0.2 + (i % 6) * 0.15))
    const kq = xepBuoiChua(ds, Array.from({ length: 30 }, (_, i) => emCo(i + 1)))
    expect(kq.tongGiay).toBeLessThanOrEqual(nganSachGiay(CAU_HINH_LEN_BANG_MAC_DINH))
    const len = kq.dong.filter((d) => d.tang === 'len_bang')
    expect(new Set(len.map((d) => d.em!.sbd)).size).toBe(len.length) // mỗi em một lần
    expect(new Set(len.map((d) => d.cau.id)).size).toBe(len.length) // mỗi câu một em
  })

  it('đề DÀI hơn thì buổi chữa được ÍT em hơn hoặc bằng đề ngắn (giờ là thứ khan hiếm) — và trượt sàn thì nói lý do ngân sách', () => {
    const mau = (soTu: number) => Array.from({ length: 30 }, (_, i) => vao(i + 1, (i % 3) as 0 | 1 | 2, nd(soTu, false, 3), 'II', 0.4))
    const lop = Array.from({ length: 30 }, (_, i) => emCo(i + 1))
    const ngan = xepBuoiChua(mau(20), lop)
    const dai = xepBuoiChua(mau(300), lop)
    expect(dai.soEmLenBang).toBeLessThanOrEqual(ngan.soEmLenBang)
    if (!dai.datSan) expect(dai.thieu?.viSao).toMatch(/ngân sách/)
  })

  it('TẤT ĐỊNH: cùng đầu vào cùng buổi', () => {
    const ds = Array.from({ length: 30 }, (_, i) => vao(i + 1, (i % 3) as 0 | 1 | 2, nd(40, i % 5 === 0, 2), 'I', 0.3))
    const lop = Array.from({ length: 30 }, (_, i) => emCo(i + 1))
    expect(xepBuoiChua(ds, lop)).toEqual(xepBuoiChua(ds, lop))
  })
})

describe('thoiGianDayHoc của tờ chiếu dùng CHUNG hàm mới', () => {
  const o = (text: string, sao: 0 | 1 | 2, extra: Partial<CauLuyen> = {}): OBang => ({ sbd: 'A', hoTen: 'A', soCau: 1, sao, cau: { phan: 'I', id: 'A', text, luaChon: ['A', 'B', 'C', 'D'], dapAn: 'A', buoc: [], ...extra } as unknown as CauLuyen })
  it('giữ kẹp riêng 60–180 s của chế độ dạy học (test `day-hoc-dem-nguoc` khoá)', () => {
    expect(thoiGianDayHoc(o('Câu ngắn', 0))).toBe(60)
    expect(thoiGianDayHoc(o('dài '.repeat(1000), 2))).toBe(180)
    expect(thoiGianDayHoc(o('Câu ngắn', 2))).toBeGreaterThan(60)
  })

  it('bằng T_đọc + T_làm của hàm chung, làm tròn 15 s rồi kẹp', () => {
    const cauX = o('một hai ba bốn năm sáu bảy tám chín mười '.repeat(5), 1)
    const t = thoiGianCau({ phan: 'I', sao: 1, noiDung: noiDungTuCauLuyen(cauX.cau) })
    expect(thoiGianDayHoc(cauX)).toBe(Math.max(60, Math.min(180, Math.round((t.doc + t.lam) / 15) * 15)))
  })

  it('có hình/bảng và đề dài đẩy thời gian lên; đề Phần II dài hơn Phần I cùng sao', () => {
    const p1 = thoiGianDayHoc(o('x '.repeat(30), 1))
    const p1hinh = thoiGianDayHoc(o('x '.repeat(30), 1, { bang: [['a']] }))
    expect(p1hinh).toBeGreaterThanOrEqual(p1)
    const p2 = thoiGianDayHoc({ ...o('x '.repeat(30), 1), cau: { ...o('x', 1).cau, phan: 'II' } as unknown as CauLuyen })
    expect(p2).toBeGreaterThan(p1)
  })
})
