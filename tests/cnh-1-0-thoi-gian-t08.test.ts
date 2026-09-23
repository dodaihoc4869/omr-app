// @vitest-environment node
// P05 — ƯỚC LƯỢNG THỜI GIAN (02 §5.1–5.2): T08 "600 giây không thành 32 phút" + luật mẫu/hệ số.
// Gọi CODE SẢN PHẨM THẬT `server/src/uoc-luong-thoi-gian.ts` (hàm thuần).
import { describe, expect, it } from 'vitest'
import {
  giayCoSo, giayDocThem, giayHinhThem, heSoTocDo, mauHopLe, uocLuongChuaLoi, uocLuongMotCau, xepVuaNganSach,
  type CauUocLuong, type MauThoiGian,
} from '../server/src/uoc-luong-thoi-gian'
import {
  GIAY_BAI_MAU, GIAY_CO_SO, HE_SO_SAN, HE_SO_TRAN, MAU_TOI_THIEU, NGAY_MAU_TOI_DA, TRAN_DOC, TRAN_HINH,
} from '../server/src/ho-so-cau-hinh'

const NOW = Date.parse('2026-09-23T10:00:00.000Z')
const cau = (o: Partial<CauUocLuong> & { qid: string }): CauUocLuong => ({ part: 'I', difficulty: 1, ...o })

describe('T08 — 600 giây KHÔNG thành 32 phút (không ép sàn số câu)', () => {
  it('solve 240 + feedback 60 ⇒ mỗi câu 300 giây; ngân sách 600 chỉ nhận ĐÚNG 2 câu, tổng 600', () => {
    // Câu Phần II mức Vận dụng: base 300 giây; với hệ số đo 0,8 ⇒ solve = 240, feedback = 60, task = 300.
    const mau: MauThoiGian[] = Array.from({ length: 6 }, (_, i) => ({ part: 'II', difficulty: 2, activeSeconds: 240, daNop: true, docLap: true, lucMs: NOW - i * 3600_000 }))
    const e = uocLuongMotCau(cau({ qid: 'Q1', part: 'II', difficulty: 2 }), { mau, nowMs: NOW })
    expect(e.baseSeconds).toBe(GIAY_CO_SO.II[2])
    expect(e.factor).toBe(0.8)
    expect(e.solveSeconds).toBe(240)
    expect(e.feedbackSeconds).toBe(60)
    expect(e.taskSeconds).toBe(300)
    const ds = Array.from({ length: 8 }, (_, i) => ({ qid: `Q${i}`, taskSeconds: 300 }))
    const r = xepVuaNganSach(ds, 600)
    expect(r.chon).toHaveLength(2) // KHÔNG ép sàn 4/8 câu
    expect(r.tongGiay).toBe(600)
    expect(r.conLai).toBe(0)
    expect(r.boQua.every((x) => x.lyDo === 'BUDGET_EXHAUSTED')).toBe(true)
  })

  it('ngân sách 600 mà mỗi câu cần 301 giây ⇒ 1 câu, 0 giây thừa bị nhét (không cắt phản hồi)', () => {
    const r = xepVuaNganSach([{ qid: 'A', taskSeconds: 301 }, { qid: 'B', taskSeconds: 299 }], 600)
    expect(r.chon.map((x) => x.qid)).toEqual(['A', 'B']) // 301 + 299 = 600 vừa đúng
    const r2 = xepVuaNganSach([{ qid: 'A', taskSeconds: 301 }, { qid: 'B', taskSeconds: 300 }], 600)
    expect(r2.chon.map((x) => x.qid)).toEqual(['A'])
    expect(r2.boQua).toEqual([{ qid: 'B', lyDo: 'BUDGET_EXHAUSTED' }])
  })

  it('mẫu thời gian ÍT (<5) ⇒ dùng hệ số 1 và NÓI RA số mẫu (không giả vờ đo được)', () => {
    const e = uocLuongMotCau(cau({ qid: 'Q1', part: 'I', difficulty: 2 }), { mau: [], nowMs: NOW })
    expect(e.factor).toBe(1)
    expect(e.nguon).toBe('mac_dinh')
    expect(e.soMau).toBe(0)
    expect(e.ghiChu).toMatch(/chưa đủ mẫu đo \(0\/5\)/)
    expect(e.solveSeconds).toBe(GIAY_CO_SO.I[2])
  })

  it('bảng giây gốc đúng THAM-SO và hệ số bị kẹp [0,75 · 2]', () => {
    expect(GIAY_CO_SO).toEqual({ I: [75, 105, 150], II: [150, 210, 300], III: [120, 180, 240] })
    const nhanh = Array.from({ length: MAU_TOI_THIEU }, () => 10)
    const cham = Array.from({ length: MAU_TOI_THIEU }, () => 900)
    expect(heSoTocDo(300, nhanh).factor).toBe(HE_SO_SAN)
    expect(heSoTocDo(300, cham).factor).toBe(HE_SO_TRAN)
    expect(heSoTocDo(300, nhanh).nguon).toBe('do')
  })

  it('lọc mẫu: bỏ mẫu HỖ TRỢ, chưa nộp, gián đoạn, ngoài 10–900 giây, quá 30 ngày; lấy 20 mới nhất', () => {
    const mau: MauThoiGian[] = [
      { part: 'I', difficulty: 1, activeSeconds: 100, daNop: true, lucMs: NOW },
      { part: 'I', difficulty: 1, activeSeconds: 100, daNop: true, docLap: false, lucMs: NOW },
      { part: 'I', difficulty: 1, activeSeconds: 100, daNop: false, lucMs: NOW },
      { part: 'I', difficulty: 1, activeSeconds: 100, gianDoan: true, lucMs: NOW },
      { part: 'I', difficulty: 1, activeSeconds: 5, daNop: true, lucMs: NOW },
      { part: 'I', difficulty: 1, activeSeconds: 4000, daNop: true, lucMs: NOW },
      { part: 'I', difficulty: 1, activeSeconds: 100, daNop: true, lucMs: NOW - (NGAY_MAU_TOI_DA + 1) * 86_400_000 },
      { part: 'II', difficulty: 1, activeSeconds: 100, daNop: true, lucMs: NOW },
    ]
    expect(mauHopLe(cau({ qid: 'x', part: 'I', difficulty: 1 }), mau, NOW)).toEqual([100])
    const nhieu = Array.from({ length: 25 }, (_, i) => ({ part: 'I' as const, difficulty: 1 as const, activeSeconds: 100 + i, daNop: true, lucMs: NOW - i * 1000 }))
    expect(mauHopLe(cau({ qid: 'x', part: 'I', difficulty: 1 }), nhieu, NOW)).toHaveLength(20)
  })
})

describe('P05 — phần cộng ĐỌC đề / BẢNG-HÌNH và chữa lỗi có bài mẫu', () => {
  it('đọc đề: ≤300 ký tự không cộng; quá thì mỗi 120 ký tự +10 giây, trần 120', () => {
    expect(giayDocThem(300)).toBe(0)
    expect(giayDocThem(301)).toBe(10)
    expect(giayDocThem(420)).toBe(10)
    expect(giayDocThem(421)).toBe(20)
    expect(giayDocThem(99999)).toBe(TRAN_DOC)
  })

  it('bảng/hình: mỗi cái 30 giây, trần 90', () => {
    expect(giayHinhThem(0)).toBe(0)
    expect(giayHinhThem(1)).toBe(30)
    expect(giayHinhThem(4)).toBe(TRAN_HINH)
    expect(giayCoSo({ part: 'I', difficulty: 1, visibleChars: 420, tableOrFigureCount: 1 })).toBe(GIAY_CO_SO.I[1]! + 10 + 30)
  })

  it('chữa lỗi CÓ BÀI MẪU cộng 90 giây; biến thể kiểm tự làm cộng RIÊNG thời gian của nó', () => {
    const goc = uocLuongMotCau(cau({ qid: 'R', part: 'I', difficulty: 1 }), { mau: [], nowMs: NOW })
    const r = uocLuongChuaLoi(cau({ qid: 'R', part: 'I', difficulty: 1 }), { mau: [], nowMs: NOW, coBaiMau: true, bienThe: cau({ qid: 'V', part: 'I', difficulty: 1 }) })
    expect(r.giayBaiMau).toBe(GIAY_BAI_MAU)
    expect(r.giayBienThe).toBe(goc.taskSeconds)
    expect(r.taskSeconds).toBe(goc.taskSeconds * 2 + GIAY_BAI_MAU)
  })

  it('không đọc đồng hồ/không random: cùng đầu vào ⇒ cùng kết quả', () => {
    const a = uocLuongMotCau(cau({ qid: 'Q', part: 'III', difficulty: 0 }), { mau: [], nowMs: NOW })
    const b = uocLuongMotCau(cau({ qid: 'Q', part: 'III', difficulty: 0 }), { mau: [], nowMs: NOW })
    expect(a).toEqual(b)
  })
})
