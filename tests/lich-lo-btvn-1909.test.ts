// LỊCH LÔ BTVN — thay Vòng 1/2/3 (mục 3 SO-VIEC.md 19/09).
import { describe, expect, it } from 'vitest'
import { loDangCho, tinhLichLoBtvn, tongCauDenLo, SO_CAU_MOI_LO_TOI_THIEU, type LichLoBtvn } from '../src/lib/lich-lo-btvn'

const NGAY = 24 * 3600_000
const GIO = 3600_000

describe('tinhLichLoBtvn — dãn câu theo ngày/giờ', () => {
  it('khung dài (5 ngày), không nhiệm vụ khác: chia thành nhiều lô theo NGÀY, tổng câu khớp', () => {
    const giao = Date.UTC(2026, 8, 19, 0, 0, 0)
    const han = giao + 5 * NGAY
    const lich = tinhLichLoBtvn({ soCau: 30, giaoLuc: new Date(giao).toISOString(), hanNop: new Date(han).toISOString(), nganSachNgay: 12, taiKhac: 0 })
    expect(lich.donViDan).toBe('ngay')
    expect(lich.cacLo.reduce((s, l) => s + l.soCau, 0)).toBe(30)
    expect(lich.cacLo.length).toBeGreaterThan(1)
    expect(lich.cacLo.length).toBeLessThanOrEqual(5)
    // Lô đầu mở ngay lúc giao.
    expect(lich.cacLo[0]!.moDuKienLuc).toBe(new Date(giao).toISOString())
    // Mốc các lô sau tăng dần, không vượt hạn nộp.
    for (let i = 1; i < lich.cacLo.length; i++) {
      expect(Date.parse(lich.cacLo[i]!.moDuKienLuc)).toBeGreaterThan(Date.parse(lich.cacLo[i - 1]!.moDuKienLuc))
      expect(Date.parse(lich.cacLo[i]!.moDuKienLuc)).toBeLessThanOrEqual(han)
    }
  })

  it('em đang bận nhiều nhiệm vụ khác (taiKhac lớn) ⇒ lô CÙNG bài này nhỏ hơn, số lô nhiều hơn — không dồn thêm tải', () => {
    const giao = Date.UTC(2026, 8, 19, 0, 0, 0)
    const han = giao + 5 * NGAY
    const nhe = tinhLichLoBtvn({ soCau: 30, giaoLuc: new Date(giao).toISOString(), hanNop: new Date(han).toISOString(), nganSachNgay: 12, taiKhac: 0 })
    const ban = tinhLichLoBtvn({ soCau: 30, giaoLuc: new Date(giao).toISOString(), hanNop: new Date(han).toISOString(), nganSachNgay: 12, taiKhac: 10 })
    expect(ban.cacLo.length).toBeGreaterThanOrEqual(nhe.cacLo.length)
    expect(Math.max(...ban.cacLo.map((l) => l.soCau))).toBeLessThanOrEqual(Math.max(...nhe.cacLo.map((l) => l.soCau)))
  })

  it('khung NGẮN (3 giờ) ⇒ dãn theo GIỜ, không theo ngày', () => {
    const giao = Date.UTC(2026, 8, 19, 8, 0, 0)
    const han = giao + 3 * GIO
    const lich = tinhLichLoBtvn({ soCau: 12, giaoLuc: new Date(giao).toISOString(), hanNop: new Date(han).toISOString(), nganSachNgay: 12, taiKhac: 0 })
    expect(lich.donViDan).toBe('gio')
    expect(lich.cacLo.reduce((s, l) => s + l.soCau, 0)).toBe(12)
    for (const lo of lich.cacLo) expect(Date.parse(lo.moDuKienLuc)).toBeLessThanOrEqual(han)
  })

  it('số lô KHÔNG BAO GIỜ vượt số mốc trong khung — thà lô to hơn còn hơn trễ hạn', () => {
    const giao = Date.UTC(2026, 8, 19, 0, 0, 0)
    const han = giao + 2 * NGAY // chỉ 2 mốc ngày
    const lich = tinhLichLoBtvn({ soCau: 40, giaoLuc: new Date(giao).toISOString(), hanNop: new Date(han).toISOString(), nganSachNgay: 8, taiKhac: 0 })
    expect(lich.cacLo.length).toBeLessThanOrEqual(2)
    expect(lich.cacLo.reduce((s, l) => s + l.soCau, 0)).toBe(40)
  })

  it('mỗi lô ít nhất SO_CAU_MOI_LO_TOI_THIEU câu (trừ khi tổng câu ít hơn cả mức đó)', () => {
    const giao = Date.UTC(2026, 8, 19, 0, 0, 0)
    const han = giao + 10 * NGAY
    const lich = tinhLichLoBtvn({ soCau: 6, giaoLuc: new Date(giao).toISOString(), hanNop: new Date(han).toISOString(), nganSachNgay: 8, taiKhac: 0 })
    for (const lo of lich.cacLo) expect(lo.soCau).toBeGreaterThanOrEqual(Math.min(SO_CAU_MOI_LO_TOI_THIEU, 6))
  })

  it('CA BIÊN: hạn không sau lúc giao, hoặc 0 câu ⇒ một lô duy nhất, không nổ, không khoá em', () => {
    const giao = new Date(Date.UTC(2026, 8, 19)).toISOString()
    expect(tinhLichLoBtvn({ soCau: 10, giaoLuc: giao, hanNop: giao, nganSachNgay: 10, taiKhac: 0 }).cacLo).toEqual([
      { chiSo: 0, soCau: 10, moDuKienLuc: giao },
    ])
    expect(tinhLichLoBtvn({ soCau: 0, giaoLuc: giao, hanNop: '', nganSachNgay: 10, taiKhac: 0 }).cacLo).toEqual([])
  })

  it('TẤT ĐỊNH: cùng đầu vào ra đúng lịch cũ (chấm lại/ mở lại phiếu không lệch)', () => {
    const t = { soCau: 24, giaoLuc: new Date(Date.UTC(2026, 8, 19)).toISOString(), hanNop: new Date(Date.UTC(2026, 8, 23)).toISOString(), nganSachNgay: 10, taiKhac: 3 }
    expect(tinhLichLoBtvn(t)).toEqual(tinhLichLoBtvn(t))
  })
})

describe('loDangCho — cổng hiển thị, chỉ khi xong lô trước mới sang lô sau', () => {
  const giao = Date.UTC(2026, 8, 19, 0, 0, 0)
  const han = giao + 4 * NGAY
  const lich: LichLoBtvn = tinhLichLoBtvn({ soCau: 20, giaoLuc: new Date(giao).toISOString(), hanNop: new Date(han).toISOString(), nganSachNgay: 5, taiKhac: 0 })

  it('mới giao, loDaXong=0: lô 0 đã tới mốc (mở ngay), chưa trễ nhịp', () => {
    const tt = loDangCho(lich, 0, giao)
    expect(tt).not.toBeNull()
    expect(tt!.chiSo).toBe(0)
    expect(tt!.daToiMoc).toBe(true)
    expect(tt!.treNhip).toBe(false)
  })

  it('trước khi tới mốc lô kế tiếp: lô đang chờ hiện đúng, không trễ nhịp', () => {
    if (lich.cacLo.length < 2) return
    const mocLo1 = Date.parse(lich.cacLo[1]!.moDuKienLuc)
    const tt = loDangCho(lich, 0, mocLo1 - 1000)
    expect(tt!.daToiMoc).toBe(true) // lô 0 luôn mở ngay từ giaoLuc
    expect(tt!.treNhip).toBe(false) // chưa qua mốc lô 1 nên chưa tính là trễ nhịp
  })

  it('CHƯA XONG lô hiện tại mà đã qua mốc lô kế tiếp ⇒ treNhip=true (gán nhãn khẩn cấp hơn)', () => {
    if (lich.cacLo.length < 2) return
    const mocLo1 = Date.parse(lich.cacLo[1]!.moDuKienLuc)
    const tt = loDangCho(lich, 0, mocLo1 + 1000)
    expect(tt!.treNhip).toBe(true)
  })

  it('đã xong hết mọi lô ⇒ trả null (chỗ gọi tự quyết định có mở "lô thử thách" hay không)', () => {
    expect(loDangCho(lich, lich.cacLo.length, han)).toBeNull()
  })

  it('mỗi lần xong một lô, lô kế tiếp là ĐÚNG lô kế — không nhảy cóc, không lặp lại lô cũ', () => {
    for (let i = 0; i < lich.cacLo.length; i++) {
      const tt = loDangCho(lich, i, han)
      expect(tt!.chiSo).toBe(i)
    }
  })
})

describe('tongCauDenLo — dùng để tính "sáng bao nhiêu câu" trong phiếu', () => {
  it('cộng dồn đúng số câu tới lô hiện tại, không đếm lô sau', () => {
    const lich = tinhLichLoBtvn({ soCau: 20, giaoLuc: new Date(0).toISOString(), hanNop: new Date(5 * NGAY).toISOString(), nganSachNgay: 5, taiKhac: 0 })
    let cong = 0
    for (let i = 0; i < lich.cacLo.length; i++) {
      cong += lich.cacLo[i]!.soCau
      expect(tongCauDenLo(lich, i)).toBe(cong)
    }
    expect(tongCauDenLo(lich, lich.cacLo.length - 1)).toBe(20)
  })
})
