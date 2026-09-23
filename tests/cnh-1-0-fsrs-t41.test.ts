// @vitest-environment node
// P04 — LỊCH NHỚ FSRS (lát cắt lõi): T41 (FSRS ngày/card) + phần CARD của T04 (bản sao dùng chung card).
// Gọi CODE SẢN PHẨM THẬT: `server/src/lich-on-fsrs.ts` (thuần) và đường replay `phatLaiSuKien` của hồ sơ.
// Nguồn luật: 02 mục 4 (một quan sát độc lập/card/ngày, Again thắng, assisted không đẩy due, state đủ)
// + THAM-SO.json `memory` (ts-fsrs 5.4.2, FSRS-6, retention 0,9, fuzz/short-term tắt).
import { describe, expect, it } from 'vitest'
import { createEmptyCard, fsrs, Rating, type Card } from 'ts-fsrs'
import { CAU_HINH_FSRS, khoaTriNho, ngayVnFsrs, PHIEN_BAN_FSRS, taoLichOnFsrs, type LichOnFsrs } from '../server/src/lich-on-fsrs'
import { phatLaiSuKien, type SuKienDoc } from '../server/src/ho-so-nam-kt'

const ev = (o: Partial<SuKienDoc> & { khoa: string; ngay: string; ketQua: 0 | 1 | null }): SuKienDoc => ({
  sbd: 'S1', qid: 'Q1', nguon: 'on_lai', giay: null, maDang: 'D1', chuyenDe: '', assistance: 'none',
  luc: `${o.ngay}T03:00:00.000Z`, ngayVn: o.ngay, ...o,
})
const lucCua = (ngay: string) => Date.parse(`${ngay}T03:00:00.000Z`)

describe('T41 — FSRS theo ngày và theo CARD (khóa trí nhớ content_group/version)', () => {
  it('giữ đúng cấu hình đã khóa (01 §1) và có PHIÊN BẢN lịch nhớ trong state', () => {
    expect(CAU_HINH_FSRS).toEqual({ request_retention: 0.9, enable_fuzz: false, enable_short_term: false })
    const s = taoLichOnFsrs()(undefined, lucCua('2026-09-01'), 1, { khoa: khoaTriNho('cg-A', 'v1') })
    expect(s.phienBan).toBe(PHIEN_BAN_FSRS)
    expect(s.khoa).toBe('cg-A#v1')
    expect(s.lucGoc).toBe(lucCua('2026-09-01'))
    expect(s.soLanHoTro).toBe(0)
  })

  it('HAI qid cùng content_group + cùng version ⇒ MỘT card (bản sao không tạo card thứ hai)', () => {
    const on = taoLichOnFsrs()
    const k = khoaTriNho('cg-A', 'v1')
    expect(khoaTriNho('cg-A', 'v1')).toBe(k) // hai qid khác nhau nhưng cùng khoá
    const s1 = on(undefined, lucCua('2026-09-01'), 1, { khoa: k, cursor: 'e1' })
    const s2 = on(s1, lucCua('2026-09-05'), 1, { khoa: k, cursor: 'e2' })
    expect(s2.card.due.getTime()).toBeGreaterThan(s1.card.due.getTime()) // vẫn là MỘT card đang giãn ra
    expect(s2.lucGoc).toBe(s1.lucGoc) // thời điểm gốc KHÔNG đổi
    expect(s2.cursor).toBe('e2')
  })

  it('ĐỔI VERSION (đổi nội dung/đáp án có ý nghĩa) ⇒ memory_version mới ⇒ card MỚI, không trộn state cũ', () => {
    const on = taoLichOnFsrs()
    const cu = on(undefined, lucCua('2026-09-01'), 1, { khoa: khoaTriNho('cg-A', 'v1') })
    const moi = on(cu, lucCua('2026-09-08'), 1, { khoa: khoaTriNho('cg-A', 'v2') })
    expect(moi.khoa).toBe('cg-A#v2')
    expect(moi.lucGoc).toBe(lucCua('2026-09-08')) // card mới ⇒ gốc mới
    expect(moi.card.reps ?? 0).toBeLessThanOrEqual(cu.card.reps ?? 0) // KHÔNG cộng dồn reps của card cũ
  })

  it('MỘT quan sát ĐỘC LẬP mỗi ngày: đúng thêm trong ngày không tăng mốc; sai hợp lệ sau đó thì Again thắng', () => {
    const on = taoLichOnFsrs(), k = khoaTriNho('cg-A', 'v1')
    const a = on(undefined, lucCua('2026-09-01'), 1, { khoa: k })
    const themDung = on(a, Date.parse('2026-09-01T09:00:00.000Z'), 1, { khoa: k })
    expect(themDung.card.due.getTime()).toBe(a.card.due.getTime())
    const saiSau = on(a, Date.parse('2026-09-01T10:00:00.000Z'), 0, { khoa: k })
    expect(saiSau.daSai).toBe(true)
    const goc = fsrs(CAU_HINH_FSRS).next(a.truocNgay, new Date(a.lucDauNgay), Rating.Again).card
    expect(saiSau.card.due.getTime()).toBe(goc.due.getTime()) // Again trên STATE ĐẦU NGÀY, không nhân đôi
    expect(saiSau.card.due.getTime()).toBeLessThan(a.card.due.getTime())
  })

  it('LẦN CÓ HỖ TRỢ không thêm Good và KHÔNG kéo mốc xa (vẫn được ghi nhận)', () => {
    const on = taoLichOnFsrs(), k = khoaTriNho('cg-A', 'v1')
    const s1 = on(undefined, lucCua('2026-09-01'), 1, { khoa: k })
    const hoTro = on(s1, lucCua('2026-09-05'), 1, { khoa: k, docLap: false, cursor: 'e-ho-tro' })
    expect(hoTro.card.due.getTime()).toBe(s1.card.due.getTime())
    expect(hoTro.soLanHoTro).toBe(1)
    expect(hoTro.docLap).toBe(false)
    expect(hoTro.cursor).toBe('e-ho-tro')
  })

  it('state phiên bản lịch KHÁC ⇒ dựng lại card (không trộn hai phiên bản)', () => {
    const on = taoLichOnFsrs(), k = khoaTriNho('cg-A', 'v1')
    const cu = { ...on(undefined, lucCua('2026-09-01'), 1, { khoa: k }), phienBan: 'fsrs6-cu' } as LichOnFsrs
    const moi = on(cu, lucCua('2026-09-02'), 1, { khoa: k })
    expect(moi.phienBan).toBe(PHIEN_BAN_FSRS)
    expect(moi.card.due.getTime()).toBe(on(undefined, lucCua('2026-09-02'), 1, { khoa: k }).card.due.getTime())
  })

  it('cùng đầu vào ⇒ cùng mốc (tất định); giữ con trỏ để giải thích', () => {
    const chay = (on: ReturnType<typeof taoLichOnFsrs>) => {
      let s: LichOnFsrs | undefined
      for (const [ngay, kq] of [['2026-09-01', 0], ['2026-09-02', 1], ['2026-09-09', 1], ['2026-09-20', 0]] as [string, 0 | 1][]) {
        s = on(s, lucCua(ngay), kq, { khoa: khoaTriNho('cg-A', 'v1'), cursor: `e-${ngay}` })
      }
      return s!
    }
    expect(chay(taoLichOnFsrs()).card.due.getTime()).toBe(chay(taoLichOnFsrs()).card.due.getTime())
    expect(chay(taoLichOnFsrs()).cursor).toBe('e-2026-09-20')
  })
})


describe('P04 trên ĐƯỜNG HỒ SƠ THẬT — hỗ trợ không dời mốc, chỉ lần TỰ LÀM mới tính', () => {
  it('sự kiện `assisted` cùng ngày KHÔNG dời mốc, nhưng vẫn được GIỮ trong hồ sơ (lanGap tăng)', () => {
    const tuLam = [ev({ khoa: 'a1', ngay: '2026-09-01', ketQua: 1 })]
    const coHoTro = [...tuLam, ev({ khoa: 'a2', ngay: '2026-09-01', ketQua: 1, assistance: 'assisted' })]
    const mocTuLam = phatLaiSuKien(tuLam).cau[0]!
    const mocHoTro = phatLaiSuKien(coHoTro).cau[0]!
    expect(mocHoTro.mocOnKe).toBe(mocTuLam.mocOnKe)
    expect(mocHoTro.lanGap).toBe(2)
  })

  it('lần HỖ TRỢ đúng KHÔNG gỡ nhãn "cần dạy lại"; lần TỰ LÀM đúng thì gỡ', () => {
    const baLoi = [
      ev({ khoa: 'l1', ngay: '2026-09-01', ketQua: 0 }),
      ev({ khoa: 'l2', ngay: '2026-09-02', ketQua: 0 }),
      ev({ khoa: 'l3', ngay: '2026-09-03', ketQua: 0 }),
    ]
    expect(phatLaiSuKien(baLoi).cau[0]!.canDayLai).toBe(true)
    expect(phatLaiSuKien([...baLoi, ev({ khoa: 'l4', ngay: '2026-09-04', ketQua: 1, assistance: 'assisted' })]).cau[0]!.canDayLai).toBe(true)
    expect(phatLaiSuKien([...baLoi, ev({ khoa: 'l5', ngay: '2026-09-04', ketQua: 1 })]).cau[0]!.canDayLai).toBe(false)
  })

  it('mốc khớp thư viện chính thức khi có sự kiện HỖ TRỢ xen giữa (chỉ lần tự làm mới tính)', () => {
    const ds = [
      ev({ khoa: 'b1', ngay: '2026-09-01', ketQua: 1 }),
      ev({ khoa: 'b2', ngay: '2026-09-04', ketQua: 1, assistance: 'assisted' }),
      ev({ khoa: 'b3', ngay: '2026-09-10', ketQua: 1 }),
    ]
    const f = fsrs(CAU_HINH_FSRS)
    let card: Card = createEmptyCard(new Date(lucCua('2026-09-01')))
    card = f.next(card, new Date(lucCua('2026-09-01')), Rating.Good).card
    card = f.next(card, new Date(lucCua('2026-09-10')), Rating.Good).card
    expect(phatLaiSuKien(ds).cau[0]!.mocOnKe).toBe(ngayVnFsrs(card.due.getTime()))
  })

  it('bỏ trống KHÔNG cập nhật card (mốc giữ nguyên), kể cả khi lần trước là hỗ trợ', () => {
    const a = ev({ khoa: 'c1', ngay: '2026-09-01', ketQua: 1 })
    const trong = phatLaiSuKien([a, ev({ khoa: 'c2', ngay: '2026-09-05', ketQua: null })]).cau[0]!
    expect(trong.mocOnKe).toBe(phatLaiSuKien([a]).cau[0]!.mocOnKe)
    expect(trong.lanTrong).toBe(1)
  })
})
