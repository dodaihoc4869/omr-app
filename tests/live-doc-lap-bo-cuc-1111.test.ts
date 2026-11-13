// LIVE BẢNG — MÁY EM: GIẤY VÀ BẢNG CO GIÃN ĐỘC LẬP (thầy 11/11: «Làm chuẩn cái này luôn nhé. Tối ưu cho hs nhất có thể»). Phần THUẦN: bo-cuc-doc-lap.ts.
// Khoá: ba mốc chia theo cỡ chữ thật của đề (sàn 15 px, trần 34 px, trần phép co), hai khung phủ kín bề ngang trong vùng an toàn (kể cả hình xoay), phóng kín
// một khung, ánh xạ điểm của thầy ⇒ điểm ảnh qua HAI phép biến đổi, tự ưu tiên có trễ 2 giây, giấy tự trôi theo bút + nhường khi em vừa cuộn, chuyển khung êm.
// Điểm ảnh thật + khung hình thật: scripts/thu-live-1011/do-doc-lap-1111.mjs, thu-2.mjs.
import { describe, expect, it } from 'vitest'
import { KHE_GIUA, LE_NGOAI, VUNG_MAC_DINH, anToanHinh, boCucEm, khungChieu } from '../src/components/live/bo-cuc'
import { KHOA_CHIA, NHUONG_MS, SAN_CHU, S_TRAN, TRAN_CHU, TRE_UU_TIEN_MS, boCucDocLap, buocTroi, chuyenKhung, diemBang, diemGiay, docChia, ghiChia, khungVeDL, laNetBang, mocChia, netOBang, taoUuTien, troiGiay, vungBut } from '../src/components/live/bo-cuc-doc-lap'

const KHONG = { trai: 0, phai: 0, duoi: 0, tren: 0 }
const KC = khungChieu(VUNG_MAC_DINH, 16 / 9)
/** Cỡ chữ đề / bề ngang ô giấy đo trên tờ thật 1366 × 768 (bộ thử Chromium): 17,67 px trên giấy 489 px. */
const TL = 17.67 / 489
/** Cỡ chữ đề trên máy em với một bố cục (giấy soi: chữ co theo tấm giấy). */
const chu = (bc: { tam: { w: number } }): number => TL * bc.tam.w
const MAY: [string, number, number][] = [['844 × 390', 844, 390], ['667 × 375', 667, 375], ['1180 × 820', 1180, 820], ['1971 × 1247', 1971, 1247]]

describe('ba mốc chia bề ngang theo nội dung', () => {
  it('luôn có bảng ≤ giữa ≤ giấy; ưu tiên giấy không quá 80 %, bảng không dưới 20 % bề ngang', () => {
    for (const [, w, h] of MAY) {
      const m = mocChia(w, h, KHONG, KC, TL)
      expect(m.bang).toBeLessThanOrEqual(m.giua + 1e-9); expect(m.giua).toBeLessThanOrEqual(m.giay + 1e-9)
      expect(m.giay).toBeLessThanOrEqual(0.8); expect(m.bang).toBeGreaterThanOrEqual(0.42)
    }
  })
  it('điện thoại ngang: ưu tiên GIẤY ⇒ chữ đề to hơn bản một-phép-co ≥ 35 % (844) / ≥ 18 % (667); ưu tiên BẢNG ⇒ chữ đề KHÔNG dưới 15 px', () => {
    for (const [ten, w, h, tang] of [['844', 844, 390, 1.35], ['667', 667, 375, 1.18]] as const) {
      const m = mocChia(w, h, KHONG, KC, TL), cu = boCucEm(w, h, KHONG, KC)
      const chuCu = TL * KC.giay.w * cu.s
      const g = boCucDocLap({ w, h, at: KHONG, kc: KC, chia: m.giay }), b = boCucDocLap({ w, h, at: KHONG, kc: KC, chia: m.bang })
      expect(chu(g) / chuCu, ten).toBeGreaterThanOrEqual(tang)
      expect(chu(b), ten).toBeGreaterThanOrEqual(SAN_CHU - 0.05)
      // 13/11 (thầy «bảng đen xanh trên màn thầy với hs phải đồng bộ tỷ lệ với nhau để viết bút hiển thị đầy đủ trên máy hs»): ô bảng nằm TRỌN trong khung
      // ở mọi mốc chia (trước đây ưu tiên bảng nở ≥ 40 % nhưng phần dưới bảng nằm ngoài khung, phải chờ máy trôi theo bút); khung bảng ôm sát ô bảng
      for (const bc of [g, b]) { expect(bc.oBang.h, ten).toBeLessThanOrEqual(bc.bang.h + 0.5); expect(bc.oBang.w, ten).toBeLessThanOrEqual(bc.bang.w + 0.5); expect(bc.bang.w - bc.oBang.w, ten).toBeLessThan(2) }
      expect(b.sB / cu.s, ten).toBeGreaterThan(0.9)
    }
  })
  it('máy bảng / máy tính: có TRẦN — ưu tiên giấy không đẩy chữ đề quá 34 px (trừ khi mốc giữa vốn đã to hơn), bảng không phóng quá nét thật của thầy', () => {
    for (const [ten, w, h] of MAY.slice(2)) {
      const m = mocChia(w, h, KHONG, KC, TL)
      const g = boCucDocLap({ w, h, at: KHONG, kc: KC, chia: m.giay }), giua = boCucDocLap({ w, h, at: KHONG, kc: KC, chia: m.giua }), b = boCucDocLap({ w, h, at: KHONG, kc: KC, chia: m.bang })
      expect(chu(g), ten).toBeLessThanOrEqual(Math.max(TRAN_CHU, chu(giua)) + 0.5)
      expect(b.sB, ten).toBeLessThanOrEqual(Math.max(S_TRAN, (h - 2 * LE_NGOAI) / KC.bang.h) + 1e-6)
    }
  })
  it('giấy dựng thường (câu có ảnh / bảng / sơ đồ ⇒ không có cỡ chữ của giấy thầy): giấy nhường bảng, ba mốc cố định', () => {
    expect(mocChia(844, 390, KHONG, KC, null)).toEqual({ giay: 0.6, giua: 0.5, bang: 0.42 })
  })
})

describe('hai khung độc lập', () => {
  it('phủ kín bề ngang + bề cao trong lề 4 px, khe giữa 5 px; mỗi khung co theo BỀ NGANG của chính nó; tấm giấy cao hơn khung ⇒ cuộn được', () => {
    for (const [ten, w, h] of MAY) {
      for (const chia of [0.45, 0.6, 0.8]) {
        const b = boCucDocLap({ w, h, at: KHONG, kc: KC, chia })
        expect(b.giay.x, ten).toBe(LE_NGOAI); expect(b.bang.x + b.bang.w, ten).toBeCloseTo(w - LE_NGOAI, 6)
        expect(b.bang.x - (b.giay.x + b.giay.w), ten).toBeCloseTo(KHE_GIUA, 6)
        for (const o of [b.giay, b.bang]) { expect(o.y).toBe(LE_NGOAI); expect(o.h).toBe(h - 2 * LE_NGOAI) }
        expect(b.sG).toBeCloseTo(Math.min(b.giay.w / KC.giay.w, Math.max(b.giay.h / KC.giay.h, S_TRAN)), 9)
        expect(b.tam.h).toBeCloseTo(KC.giay.h * b.sG, 6); expect(b.oBang.w).toBeCloseTo(KC.bang.w * b.sB, 6)
        expect(b.vach).toBeCloseTo(b.giay.x + b.giay.w + KHE_GIUA / 2, 6)
      }
    }
    // điện thoại dài, ưu tiên giấy: tấm giấy cao hơn khung ⇒ có phần phải cuộn tới (không cắt mất)
    const g = boCucDocLap({ w: 844, h: 390, at: KHONG, kc: KC, chia: 0.8 })
    expect(g.tam.h).toBeGreaterThan(g.giay.h + 60)
  })
  it('vùng an toàn (tai thỏ trái, thanh home phải, đáy): hai khung nằm gọn trong; iPhone dọc xoay CSS ⇒ đỉnh máy thành mép trái hình', () => {
    const at = { trai: 47, phai: 34, duoi: 21, tren: 0 }
    const b = boCucDocLap({ w: 844, h: 390, at, kc: KC, chia: 0.6 })
    expect(b.giay.x).toBe(47 + LE_NGOAI); expect(b.bang.x + b.bang.w).toBeCloseTo(844 - 34 - LE_NGOAI, 6); expect(b.giay.y + b.giay.h).toBe(390 - 21 - LE_NGOAI)
    const xoay = anToanHinh({ tren: 47, phai: 0, duoi: 34, trai: 0 }, true)
    const x = boCucDocLap({ w: 844, h: 390, at: xoay, kc: KC, chia: 0.6 })
    expect(x.giay.x).toBe(47 + LE_NGOAI); expect(x.bang.x + x.bang.w).toBeCloseTo(844 - 34 - LE_NGOAI, 6)
  })
  it('phóng kín một khung (chạm hai lần): khung đó phủ cả bề ngang, khung kia đứng NGOÀI màn; phép co không vượt trần', () => {
    const pb = boCucDocLap({ w: 844, h: 390, at: KHONG, kc: KC, chia: 0.6, phong: 'bang' })
    expect(pb.bang.x).toBe(LE_NGOAI); expect(pb.bang.w).toBe(844 - 2 * LE_NGOAI); expect(pb.giay.x + pb.giay.w).toBeLessThan(0); expect(pb.vach).toBeNull()
    expect(pb.sB).toBeCloseTo(S_TRAN, 6) // trần: nét bằng nét thật của thầy — ô bảng của thầy nằm giữa khung
    expect(pb.oBang.x).toBeCloseTo((pb.bang.w - pb.oBang.w) / 2, 6)
    const pg = boCucDocLap({ w: 844, h: 390, at: KHONG, kc: KC, chia: 0.6, phong: 'giay' })
    expect(pg.giay.w).toBe(844 - 2 * LE_NGOAI); expect(pg.bang.x).toBeGreaterThan(844)
    expect(pg.sG).toBeGreaterThan(boCucDocLap({ w: 844, h: 390, at: KHONG, kc: KC, chia: 0.8 }).sG)
  })
})

describe('ánh xạ nét qua HAI phép biến đổi', () => {
  const b = boCucDocLap({ w: 844, h: 390, at: KHONG, kc: KC, chia: 0.5 })
  const [g0, g1, g2, g3] = VUNG_MAC_DINH.giay, [b0, b1, b2, b3] = VUNG_MAC_DINH.bang
  it('góc ô giấy của thầy ⇒ góc khung giấy; góc ô bảng ⇒ góc khung bảng; mép phải mỗi ô ⇒ mép phải khung của nó', () => {
    const [x, y] = diemGiay(b, KC, g0, g1)
    expect(x).toBeCloseTo(b.giay.x + b.tam.x, 6); expect(y).toBeCloseTo(b.giay.y, 6)
    expect(diemGiay(b, KC, g2, g3)[0]).toBeCloseTo(b.giay.x + b.tam.x + b.tam.w, 6)
    expect(diemGiay(b, KC, g2, g3)[1]).toBeCloseTo(b.giay.y + b.tam.h, 6) // đáy tấm giấy (dưới đáy khung ⇒ phải cuộn tới)
    const [p, q] = diemBang(b, KC, b0, b1)
    expect(p).toBeCloseTo(b.bang.x + b.oBang.x, 6); expect(q).toBeCloseTo(b.bang.y, 6)
    expect(diemBang(b, KC, b2, b1)[0]).toBeCloseTo(b.bang.x + b.oBang.x + b.oBang.w, 6)
  })
  it('điểm GIỮA ô giấy ra giữa tấm giấy, điểm giữa ô bảng ra giữa ô bảng đã co — hai phép co khác nhau', () => {
    expect(b.sG).not.toBeCloseTo(b.sB, 2)
    const [x, y] = diemGiay(b, KC, (g0 + g2) / 2, (g1 + g3) / 2)
    expect(x).toBeCloseTo(b.giay.x + b.tam.x + b.tam.w / 2, 6); expect(y).toBeCloseTo(b.giay.y + b.tam.h / 2, 6)
    const [p, q] = diemBang(b, KC, (b0 + b2) / 2, (b1 + b3) / 2)
    expect(p).toBeCloseTo(b.bang.x + b.oBang.x + b.oBang.w / 2, 6); expect(q).toBeCloseTo(b.bang.y + b.oBang.h / 2, 6)
  })
  it('số cho lớp vẽ (`khungVeDL`) khớp đúng hai phép ấy: lớp chốt của giấy = tấm giấy; cửa sổ thầy ảo của bảng đặt góc ô bảng vào góc khung bảng', () => {
    const k = khungVeDL(b, KC, 2), d = k.dl!
    expect([k.w, k.h]).toEqual([b.tam.w, b.tam.h])
    // nét giấy: x·Wv − ox = px trên tấm giấy; cộng góc tấm giấy trong hình = diemGiay
    for (const [x, y] of [[g0, g1], [0.3, 0.4], [g2, g3]] as const) {
      const [mx, my] = diemGiay(b, KC, x, y)
      expect(x * k.Wv - k.ox + d.gx).toBeCloseTo(mx, 6); expect(y * k.Hv - k.oy + d.gy).toBeCloseTo(my, 6)
    }
    for (const [x, y] of [[b0, b1], [0.8, 0.5], [b2, 1.7]] as const) { // y > 1: bảng cuộn vô hạn
      const [mx, my] = diemBang(b, KC, x, y)
      expect(x * d.bWv - d.box).toBeCloseTo(mx, 6); expect(y * d.bHv - d.boy).toBeCloseTo(my, 6)
    }
    expect([d.hw, d.hh, d.bh, d.kx, d.ky]).toEqual([844, 390, b.bang.h, b.bang.x, b.bang.y])
    expect([d.gx, d.gy, d.gw, d.gh]).toEqual([b.giay.x + b.tam.x, b.giay.y, b.tam.w, b.giay.h])
  })
  it('bút đang ở vùng nào: theo mã nét («b_…» = bảng), không có mã thì theo hoành độ trong cột bảng đen', () => {
    expect(laNetBang('b_12')).toBe(true); expect(laNetBang('bx12')).toBe(false)
    expect(vungBut(VUNG_MAC_DINH.bang, 0.3, 'b_1')).toBe('bang'); expect(vungBut(VUNG_MAC_DINH.bang, 0.3, 'n7')).toBe('giay')
    expect(vungBut(VUNG_MAC_DINH.bang, 0.8)).toBe('bang'); expect(vungBut(VUNG_MAC_DINH.bang, 0.3, null)).toBe('giay')
    // nét mã thường nằm trên cột bảng đen (bản ghi / máy thầy trước khi có mã «b_») vẫn là nét của BẢNG
    expect(vungBut(VUNG_MAC_DINH.bang, 0.8, 'n7')).toBe('bang')
    expect(netOBang(VUNG_MAC_DINH.bang, { id: 'n7', diem: [[0.8, 0.3, 0.4, 0]] })).toBe(true)
    expect(netOBang(VUNG_MAC_DINH.bang, { id: 'n7', diem: [[0.3, 0.3, 0.4, 0], [0.8, 0.3, 0.4, 5]] })).toBe(false) // bắt đầu trên giấy
    expect(netOBang(VUNG_MAC_DINH.bang, { id: 'b_7', diem: [] })).toBe(true); expect(netOBang(VUNG_MAC_DINH.bang, { id: 'n7', diem: [] })).toBe(false)
  })
})

describe('tự ưu tiên theo thầy — có trễ 2 giây, không giật khi thầy nhấp qua lại', () => {
  it('thầy viết trên bảng: chưa đủ 2 giây vẫn ưu tiên giấy; đủ 2 giây ⇒ bảng; quay lại giấy 2 giây ⇒ giấy', () => {
    const u = taoUuTien('giay')
    expect(u.buoc(0, 'bang')).toBe('giay')
    expect(u.buoc(TRE_UU_TIEN_MS - 1, 'bang')).toBe('giay')
    expect(u.buoc(TRE_UU_TIEN_MS, 'bang')).toBe('bang')
    expect(u.buoc(5000, 'giay')).toBe('bang')
    expect(u.buoc(6999, null)).toBe('bang') // thầy gạch một nét rồi dừng: vẫn tính từ nét ấy
    expect(u.buoc(7000, null)).toBe('giay')
  })
  it('thầy nhấp sang bảng rồi quay lại giấy trong 2 giây ⇒ KHÔNG đổi; mốc tính lại từ lần sang kế', () => {
    const u = taoUuTien('giay')
    u.buoc(0, 'bang'); u.buoc(900, 'giay')
    expect(u.buoc(2500, null)).toBe('giay')
    u.buoc(3000, 'bang')
    expect(u.buoc(4900, 'bang')).toBe('giay'); expect(u.buoc(5000, 'bang')).toBe('bang')
  })
  it('đặt thẳng (vào live lúc bảng đã có nét) + thầy không làm gì thì đứng yên', () => {
    const u = taoUuTien()
    expect(u.dang()).toBe('giay')
    u.dat('bang')
    expect(u.buoc(99999, null)).toBe('bang')
  })
})

describe('giấy tự trôi theo bút của thầy', () => {
  const co = { cao: 382, tong: 520 }
  it('bút trong phần đang thấy ⇒ đứng yên, không mũi tên', () => {
    expect(troiGiay({ ...co, y: 200, cuon: 0, nay: 10_000, lucCham: -1e9 })).toEqual({ dich: null, mui: 0 })
  })
  it('bút ở phần khuất phía dưới ⇒ trôi cho bút về 45 % chiều cao khung (kẹp trong tấm giấy)', () => {
    const t = troiGiay({ ...co, y: 470, cuon: 0, nay: 10_000, lucCham: -1e9 })
    expect(t.mui).toBe(0); expect(t.dich).toBeCloseTo(Math.min(520 - 382, 470 - 382 * 0.45), 6)
    const len = troiGiay({ ...co, y: 20, cuon: 138, nay: 10_000, lucCham: -1e9 })
    expect(len.dich).toBe(0)
  })
  it('em vừa tự cuộn trong 4 giây ⇒ KHÔNG giật khung, chỉ báo mũi tên đúng hướng; hết 4 giây ⇒ trôi', () => {
    expect(troiGiay({ ...co, y: 470, cuon: 0, nay: 10_000, lucCham: 10_000 - NHUONG_MS + 1 })).toEqual({ dich: null, mui: 1 })
    expect(troiGiay({ ...co, y: 20, cuon: 138, nay: 10_000, lucCham: 9000 })).toEqual({ dich: null, mui: -1 })
    expect(troiGiay({ ...co, y: 470, cuon: 0, nay: 10_000, lucCham: 10_000 - NHUONG_MS }).dich).not.toBeNull()
  })
  it('tấm giấy không cao hơn khung (hết chỗ cuộn) ⇒ không trôi, không mũi tên', () => {
    expect(troiGiay({ cao: 382, tong: 382, y: 381, cuon: 0, nay: 0, lucCham: 0 })).toEqual({ dich: null, mui: 0 })
  })
  it('trôi ÊM: mỗi khung hình đi một phần quãng còn lại, không vọt quá đích, sát đích thì tới luôn', () => {
    let c = 0
    const vet: number[] = []
    for (let i = 0; i < 60 && c !== 138; i++) { c = buocTroi(c, 138, 1000 / 60); vet.push(c) }
    expect(vet[0]).toBeGreaterThan(5); expect(vet[0]).toBeLessThan(30)
    for (let i = 1; i < vet.length; i++) expect(vet[i]!).toBeGreaterThanOrEqual(vet[i - 1]!)
    expect(c).toBe(138); expect(vet.length).toBeGreaterThan(20) // ≥ 1/3 giây
  })
})

describe('chuyển khung êm (chỉ transform) + nhớ vạch chia', () => {
  it('phép đặt lên khung MỚI làm nó trông y như khung CŨ: mọi điểm nội dung trùng chỗ cũ', () => {
    const cu = boCucDocLap({ w: 844, h: 390, at: KHONG, kc: KC, chia: 0.8 }), moi = boCucDocLap({ w: 844, h: 390, at: KHONG, kc: KC, chia: 0.465 })
    const k = chuyenKhung(cu, moi)
    for (const u of [0, 100, 515]) { // u = toạ độ lôgic trong ô bảng
      const xCu = cu.bang.x + cu.oBang.x + u * cu.sB, xMoi = moi.bang.x + moi.oBang.x + u * moi.sB
      expect(moi.bang.x + k.bang.dx + k.bang.r * (xMoi - moi.bang.x)).toBeCloseTo(xCu, 6)
      // lớp «đang viết» (toạ độ hình) đi cùng khung bảng
      const n = k.net('bang')
      expect(n.dx + n.r * xMoi).toBeCloseTo(xCu, 6)
      const yMoi = moi.bang.y + u * moi.sB, yCu = cu.bang.y + u * cu.sB
      expect(n.dy + n.r * yMoi).toBeCloseTo(yCu, 6)
    }
    expect(k.giay.r).toBeCloseTo(cu.sG / moi.sG, 9); expect(k.giay.dx).toBeCloseTo(0, 6)
  })
  it('vạch chia em kéo: ghi / đọc trên máy, giá trị lạ ⇒ bỏ; máy chặn lưu ⇒ không vỡ', () => {
    const o: Record<string, string> = {}
    const kho = { getItem: (k: string) => o[k] ?? null, setItem: (k: string, v: string) => { o[k] = v }, removeItem: (k: string) => { delete o[k] } }
    expect(docChia(kho)).toBeNull()
    ghiChia(kho, 0.5234); expect(o[KHOA_CHIA]).toBe('0.523'); expect(docChia(kho)).toBeCloseTo(0.523, 6)
    o[KHOA_CHIA] = '7'; expect(docChia(kho)).toBeNull()
    o[KHOA_CHIA] = 'x'; expect(docChia(kho)).toBeNull()
    ghiChia(kho, null); expect(KHOA_CHIA in o).toBe(false)
    const hong = { getItem: () => { throw new Error('chặn') }, setItem: () => { throw new Error('chặn') }, removeItem: () => { throw new Error('chặn') } }
    expect(docChia(hong)).toBeNull(); expect(() => ghiChia(hong, 0.5)).not.toThrow()
    expect(docChia(null)).toBeNull()
  })
})
