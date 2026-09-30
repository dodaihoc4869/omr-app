// @vitest-environment node
// LUẬT EXP v5 (THẦY ĐÃ CHỐT 29/09/2026 "build và đẩy luôn" — docs/DE-XUAT-EXP-V5-2909.md). BẢNG NGHIỆM THU chạy bằng HÀM THẬT:
//   (1) bảng D/T khoá theo công thức đóng; (2) mô phỏng 1 300 ngày: cày vô hạn cấp 10 ≥ ngày 21, chăm = 21; cấp 120 chăm = 1 200 ± 5; khiên 1 chăm = 36, cày ≥ 36;
//       chăm cấp 2 ≤ ngày 1, cấp 3 ≤ ngày 2; (3) không trần ngày nào còn chặn EXP; (4) EXP tràn quy đổi đúng công thức; (5) ngày nghỉ chung; (6) khoá shop bậc 4/5;
//   (7) chuyển dữ liệu v4 → v5 (và hồ sơ cũ hơn) không tụt cấp, không mất EXP/vàng/mảnh/khiên, gọi lại không cộng đôi; (8) EXP câu game = ½ câu học tập.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  BANG_NGAY_CAP, BANG_TONG_EXP_V5, CAP_MO_BAC_PHU_KIEN, EXP_MOI_VANG, MANH_REN_KHIEN, S_EXP_NGAY, VANG_REN_KHIEN,
  capChoPhepTheoNgay, manhTranNgay, ngayDatKhien, vangDangDuc, vangTranNgay,
} from '../src/lib/kinh-te-game'
import { thanhExp, thanhExpV4, tongExpToiCap, tongExpToiCapV4, tongExpToiDinh } from '../src/game/than-thu-hoa-hoc/kinh-nghiem'
import { LUAT_CAP_MOI, LUAT_CAP_V3, LUAT_CAP_V4, chuyenDoiLuatCap, chuyenV4SangV5, nhanV5, sucChuaV5, type HoSoV5 } from '../src/lib/hap-thu-ngay'
import { HO_SO_MO_PHONG, chayMoPhong } from '../src/lib/mo-phong-bang-gia-exp'
import { DANH_MUC_PHU_KIEN } from '../src/lib/phu-kien-danh-muc'
import * as CH from '../server/src/exp-cau-hinh'
import { EXP_CAU, EXP_CAU_GAME } from '../server/src/exp-cau-hinh'
import { expMotCau, expMotCauGame, tinhExp, type SuKienExp, type VaoTinhExp } from '../server/src/exp-hoc-tap'
import { congTongSoVaoHoSo, renKhienBangVang, type HoSoGameExp } from '../server/src/exp-ho-so-game'
import { demNgayNghiChoCap } from '../server/src/exp-d1'
import { nhanExpGame } from '../server/src/game-v2-hap-thu'

// ── (1) bảng D/T ─────────────────────────────────────────────────────────────────────────────────
describe('(1) bảng mốc ngày D(c) và tổng EXP T(c) — viết thẳng, khớp công thức đóng', () => {
  const P = Math.log(1200 / 21) / Math.log(119 / 9)
  const Dc = (c: number) => 21 * ((c - 1) / 9) ** P
  it('121 số D và 121 số T sinh đúng từ công thức (không tính mũ lúc chạy)', () => {
    expect(P).toBeCloseTo(1.5669, 4)
    expect(BANG_NGAY_CAP).toHaveLength(121)
    expect(BANG_TONG_EXP_V5).toHaveLength(121)
    for (let c = 1; c <= 120; c++) {
      expect(BANG_NGAY_CAP[c], `D(${c})`).toBe(c <= 1 ? 0 : Math.floor(Dc(c) + 1e-6))
      expect(BANG_TONG_EXP_V5[c], `T(${c})`).toBe(c <= 1 ? 0 : Math.round((S_EXP_NGAY * (Dc(c) - 0.5)) / 10) * 10)
    }
    expect(S_EXP_NGAY).toBe(570)
  })
  it('đúng bảng mục 2 của đề xuất; D không giảm, T tăng ngặt; thanh = T(c+1) − T(c)', () => {
    const bang: [number, number, number][] = [[1, 0, 0], [2, 0, 100], [3, 1, 850], [4, 3, 1860], [5, 5, 3070], [10, 21, 11_690], [20, 67, 38_310], [30, 131, 74_590], [50, 298, 170_030], [80, 631, 359_690], [100, 899, 512_390], [120, 1200, 683_720]]
    for (const [c, d, t] of bang) { expect(BANG_NGAY_CAP[c], `D(${c})`).toBe(d); expect(tongExpToiCap(c), `T(${c})`).toBe(t) }
    for (let c = 2; c <= 120; c++) { expect(BANG_NGAY_CAP[c]!).toBeGreaterThanOrEqual(BANG_NGAY_CAP[c - 1]!); expect(BANG_TONG_EXP_V5[c]!).toBeGreaterThan(BANG_TONG_EXP_V5[c - 1]!) }
    expect([1, 2, 3, 4, 9].map(thanhExp)).toEqual([100, 750, 1010, 1210, 2020])
    expect(thanhExp(120)).toBe(0)
    expect(tongExpToiDinh()).toBe(683_720)
    expect([0, 1, 2, 3, 20, 21, 1199, 1200, 99_999].map(capChoPhepTheoNgay)).toEqual([2, 3, 3, 4, 9, 10, 119, 120, 120])
  })
})

// ── (2) mô phỏng 1 300 ngày bằng hàm sản phẩm ─────────────────────────────────────────────────────
describe('(2) mô phỏng 1 300 ngày (ngày 1 = Thứ Hai, không mua đồ) — đúng bảng mục 7', () => {
  const r = Object.fromEntries((['cay', 'cham', 'tb', 'yeu', 'quang'] as const).map((k) => [k, chayMoPhong(HO_SO_MO_PHONG[k], 1300)])) as Record<'cay' | 'cham' | 'tb' | 'yeu' | 'quang', ReturnType<typeof chayMoPhong>>
  it('NGHIỆM THU: cày vô hạn cấp 10 ≥ ngày 21, chăm = 21; cấp 120 chăm = 1 200 ± 5 (cày ≥ 1 200); khiên 1 chăm = 36, cày ≥ 36; chăm cấp 2 ≤ ngày 1, cấp 3 ≤ ngày 2', () => {
    expect(r.cay.cap[10]).toBeGreaterThanOrEqual(21)
    expect(r.cham.cap[10]).toBe(21)
    expect(Math.abs(r.cham.cap[120]! - 1200)).toBeLessThanOrEqual(5)
    expect(r.cay.cap[120]).toBeGreaterThanOrEqual(1200)
    expect(r.cham.khien[1]).toBe(36)
    expect(r.cay.khien[1]).toBeGreaterThanOrEqual(36)
    expect(r.cham.cap[2]).toBeLessThanOrEqual(1)
    expect(r.cham.cap[3]).toBeLessThanOrEqual(2)
  })
  it('đúng từng số của bảng mục 7 (EXP/ngày, cấp 2/3/5/10/20/50/120, khiên 1/2/3, vàng n7/21/36/100/365)', () => {
    const hang = (k: keyof typeof r) => [Math.round(r[k].tbNgay), ...[2, 3, 5, 10, 20, 50, 120].map((c) => r[k].cap[c] ?? null), ...[1, 2, 3].map((i) => r[k].khien[i] ?? null), ...[7, 21, 36, 100, 365].map((n) => r[k].vangTichLuy[n])]
    expect(hang('cay')).toEqual([3494, 1, 1, 5, 21, 67, 298, 1200, 36, 54, 72, 1875, 5366, 9241, 25_467, 90_305])
    expect(hang('cham')).toEqual([636, 1, 2, 5, 21, 67, 298, 1200, 36, 72, 108, 874, 2595, 4459, 12_374, 44_901])
    expect(hang('tb')).toEqual([313, 1, 3, 10, 38, 123, 544, null, 42, 83, 125, 438, 1314, 2255, 6263, 22_845])
    expect(hang('yeu')).toEqual([152, 1, 6, 20, 78, 253, 1122, null, 86, 172, 258, 215, 639, 1101, 3028, 11_071])
    expect(hang('quang')).toEqual([363, 1, 2, 8, 36, 116, 520, null, 62, 125, 188, 496, 1490, 2592, 7192, 25_774])
  })
  it('em chăm lên MỌI cấp đúng ngày mốc D(c) (trừ cấp 2, 3 lên sớm hơn); TB, yếu, cách quãng đều chậm hơn mốc', () => {
    const lech: string[] = []
    for (let c = 4; c <= 120; c++) if (r.cham.cap[c] !== undefined && r.cham.cap[c] !== BANG_NGAY_CAP[c]) lech.push(String(c))
    let dau = 0
    for (let c = 4; c <= 120; c++) { let n = 1; while (n <= 1300 && (r.cham.capNgay[n] ?? 0) < c) n++; if (n !== Math.max(1, BANG_NGAY_CAP[c]!)) { dau++; lech.push(`${c}:${n}`) } }
    expect(lech).toEqual([])
    expect(dau).toBe(0)
    for (const k of ['tb', 'yeu', 'quang'] as const) { expect(r[k].cap[10]!).toBeGreaterThan(21); expect(r[k].khien[1]!).toBeGreaterThan(36) }
  })
})

// ── (3) không trần ngày ────────────────────────────────────────────────────────────────────────
const NGAY = '2026-09-30'
const vao = (o: Partial<VaoTinhExp> = {}): VaoTinhExp => ({
  ngay: NGAY, suKien: [], metaCau: {}, mucTieuCau: 16, lenBac: [], khacPhuc: [], loXong: [], baiBtvnNop: [], momXong: [], diemCa: [], datNgay: null, dangRoiYeu: [], daCoKhoa: new Set(), ...o,
})
const cauDung = (n: number): SuKienExp[] => Array.from({ length: n }, (_, i) => ({ khoa: `k${String(i).padStart(4, '0')}`, nguon: 'on_lai', maNguon: 'x', qid: `Q-I-${i}`, lan: 1, ketQua: 1, luc: `2026-09-30T01:${String(Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}.000Z` }))

describe('(3) KHÔNG trần ngày nào còn chặn EXP', () => {
  it('hằng số trần cũ đã gỡ khỏi nguồn cấu hình (TRAN_MEM_*, TRAN_CUNG_HE_SO, KHAC_PHUC_TOI_DA_NGAY, LEN_BAC_TOI_DA_NGAY, TIEP_SUC_TOI_DA_NGAY)', () => {
    for (const k of ['TRAN_MEM_HE_SO', 'TRAN_MEM_TY_LE', 'TRAN_CUNG_HE_SO', 'KHAC_PHUC_TOI_DA_NGAY', 'LEN_BAC_TOI_DA_NGAY', 'TIEP_SUC_TOI_DA_NGAY']) expect(CH, k).not.toHaveProperty(k)
  })
  it('500 câu học tập đúng (mục tiêu 16) ⇒ 500 khoản đủ giá; 30 lên bậc, 10 khắc phục ⇒ đủ cả', () => {
    const r = tinhExp(vao({ suKien: cauDung(500), lenBac: Array.from({ length: 30 }, (_, i) => `B${i}`), khacPhuc: Array.from({ length: 10 }, (_, i) => ({ qid: `K${i}`, lan: 1, luc: `2026-09-30T02:0${i}:00.000Z` })) }))
    expect(r.khoan.filter((x) => x.loai === 'cau')).toHaveLength(500)
    expect(r.khoan.filter((x) => x.loai === 'cau').every((x) => x.exp === expMotCau('I', 0))).toBe(true)
    expect(r.khoan.filter((x) => x.loai === 'len_bac')).toHaveLength(30)
    expect(r.khoan.filter((x) => x.loai === 'khac_phuc')).toHaveLength(10)
  })
  it('EXP game: nhận ĐỦ dù đã 5 000 EXP game hôm nay (bỏ trần 120)', () => {
    const p: any = { expGame: { ngay: NGAY, da: 5000 } }
    expect(nhanExpGame(p, NGAY, 30)).toBe(30)
  })
  it('máy chủ không còn dùng Huyết Chiến / trần game để cắt EXP (chỉ còn cho vật phẩm)', () => {
    const doc = (t: string) => readFileSync(new URL(`../server/src/${t}`, import.meta.url), 'utf8')
    expect(doc('game-v2.ts')).not.toMatch(/khongThuong|duocThuongCauThu|TRAN_EXP_GAME_NGAY/)
    expect(doc('game-v2-doan-exp.ts')).not.toMatch(/duocThuongCauThu/)
    expect(doc('exp-d1.ts')).not.toMatch(/TIEP_SUC_TOI_DA_NGAY/)
    expect(doc('exp-hoc-tap.ts')).not.toMatch(/TRAN_MEM|TRAN_CUNG|TOI_DA_NGAY/)
  })
  it('sức chứa không phải trần ngày: EXP vượt vẫn KHÔNG mất (vào thú hoặc thành vàng + mảnh)', () => {
    const k = nhanV5({ cap: 1, exp: 0, wallet: 0 }, 50_000, 0, NGAY)
    expect(k.daVao + k.tran).toBe(50_000)
    expect(k.vangTran).toBe(vangTranNgay(k.tran))
    expect(k.manhTran).toBe(manhTranNgay(k.tran))
  })
})

// ── (4) EXP tràn → vàng + mảnh ───────────────────────────────────────────────────────────────────
describe('(4) EXP tràn quy đổi đúng công thức (lợi suất giảm dần trong ngày VN, không trần)', () => {
  it('bảng mục 4: 100 · 300 · 600 · 1 000 · 1 800 · 3 000 · 5 000 · 10 000 · 20 000', () => {
    const t = [100, 300, 600, 1000, 1800, 3000, 5000, 10_000, 20_000]
    expect(t.map(vangTranNgay)).toEqual([17, 41, 65, 87, 116, 143, 172, 212, 252])
    expect(t.map(manhTranNgay)).toEqual([0, 0, 1, 1, 2, 2, 3, 4, 5])
    for (const x of [1, 7, 333, 4321]) { expect(vangTranNgay(x)).toBe(Math.floor(60 * Math.log(1 + x / 300))); expect(manhTranNgay(x)).toBe(Math.floor(Math.log2(1 + x / 600))) }
  })
  it('chia nhỏ trong ngày = gộp một lần (đúc phần chênh của TỔNG hôm nay); sang ngày mới lợi suất tốt lại; thú đầy thanh = sức chứa − 0', () => {
    const goc: HoSoV5 = { cap: 1, exp: 0, wallet: 0 }
    const mot = nhanV5(goc, 10_000, 0, NGAY)
    let h: HoSoV5 = goc, v = 0, m = 0
    for (const x of [1000, 2500, 17, 3483, 3000]) { const k = nhanV5(h, x, 0, NGAY); h = k.hoSo; v += k.vangTran; m += k.manhTran }
    expect(h.tranV5).toEqual(mot.hoSo.tranV5)
    expect([v, m]).toEqual([mot.vangTran, mot.manhTran])
    expect(tongExpToiCap(h.cap) + h.exp).toBe(sucChuaV5(1, 0))
    const mai = nhanV5(h, 300, 0, '2026-10-01')
    expect(mai.vangTran).toBe(41)
    expect(mai.hoSo.tranV5).toMatchObject({ ngay: '2026-10-01', exp: 300, vang: 41, tongExp: mot.tran + 300, tongVang: mot.vangTran + 41 })
  })
  it('vàng: 1 vàng / 5 EXP VÀO THÚ + vàng tràn; mảnh tràn cộng thẳng vào khienRen (cùng lần ghi, gọi lại không cộng đôi)', () => {
    const p: HoSoGameExp = { cap: 1, exp: 0, wallet: 0, earned: 0, luatCap: LUAT_CAP_MOI, mocVang: 0, expMoi: { daCong: 0, manhDaTinh: 0, ngayDat: 0 } }
    const r = congTongSoVaoHoSo(p, 5000, 0, 0)
    const vao = sucChuaV5(1, 0), tran = 5000 - vao
    expect(r.thu).toMatchObject({ cap: 2, tran, vangTran: vangTranNgay(tran), manhTran: manhTranNgay(tran), choNgay: 1 })
    expect(vangDangDuc(p)).toBe(Math.floor(vao / EXP_MOI_VANG) + vangTranNgay(tran))
    expect(p.khienRen).toEqual({ manh: manhTranNgay(tran), daRen: 0 })
    const chup = JSON.stringify(p)
    expect(congTongSoVaoHoSo(p, 5000, 0, 0).exp).toBe(0)
    expect(JSON.stringify(p)).toBe(chup)
  })
  it('đủ thêm ngày đạt ⇒ sức chứa tăng, EXP mới vào thú (EXP tràn cũ đã đổi vàng, không quay lại)', () => {
    const p: HoSoGameExp = { cap: 1, exp: 0, wallet: 0, earned: 0, luatCap: LUAT_CAP_MOI, mocVang: 0, expMoi: { daCong: 0, manhDaTinh: 0, ngayDat: 20 } }
    congTongSoVaoHoSo(p, 12_000, 20, 20)
    expect(p.cap).toBe(9)
    expect(tongExpToiCap(p.cap) + p.exp).toBe(tongExpToiCap(10) - 1)
    congTongSoVaoHoSo(p, 12_000, 21, 21) // ngày đạt thứ 21, chưa có EXP mới: cấp giữ (thiếu 1 EXP)
    expect(p.cap).toBe(9)
    congTongSoVaoHoSo(p, 12_001, 21, 21)
    expect(p.cap).toBe(10)
  })
})

// ── (5) ngày nghỉ chung ─────────────────────────────────────────────────────────────────────────
describe('(5) ngày nghỉ chung thầy đặt = ngày đạt cho MỐC CẤP (không cộng mảnh, không mở khiên)', () => {
  it('đếm ngày nghỉ từ mốc khiên và đầu mùa tới hôm nay, bỏ ngày đã đạt; nhận JSON hoặc chuỗi', () => {
    expect(demNgayNghiChoCap('["2026-09-20","2026-09-25","2026-09-26","2026-10-05"]', '2026-09-25', '2026-09-21', '', '2026-09-30')).toBe(1)
    expect(demNgayNghiChoCap('2026-09-22, 2026-09-23', '', '2026-09-21', '2026-09-23T00:00:00.000Z', '2026-09-30')).toBe(1)
    expect(demNgayNghiChoCap('', '', '', '', '2026-09-30')).toBe(0)
  })
  it('20 ngày đạt + 1 ngày nghỉ chung ⇒ thú lên được cấp 10; khiên vẫn đòi đủ ngày đạt thật', () => {
    const p: HoSoGameExp = { cap: 1, exp: 0, wallet: 0, earned: 0, luatCap: LUAT_CAP_MOI, mocVang: 0, expMoi: { daCong: 0, manhDaTinh: 0, ngayDat: 20 } }
    congTongSoVaoHoSo(p, 12_000, 20, 20, 1)
    expect(p.cap).toBe(10)
    expect(p.expMoi).toMatchObject({ ngayDat: 20, ngayNghi: 1 })
    expect(p.khienRen).toMatchObject({ manh: 20 })
    const k: HoSoGameExp = { ...p, khienRen: { manh: 36, daRen: 0 }, expMoi: { daCong: 0, manhDaTinh: 36, ngayDat: 35, ngayNghi: 5 } }
    expect(() => renKhienBangVang(k, 0, 99_999)).toThrow(/36 ngày đạt/)
  })
})

// ── (6) khiên + khoá shop ───────────────────────────────────────────────────────────────────────
describe('(6) khiên 36 mảnh + 2 600 vàng + ngày ≥ 36 + 18(k − 1); khoá cấp shop bậc 4/5', () => {
  it('hằng số và cổng ngày khiên thứ k', () => {
    expect([MANH_REN_KHIEN, VANG_REN_KHIEN]).toEqual([36, 2600])
    expect([1, 2, 3, 5].map(ngayDatKhien)).toEqual([36, 54, 72, 108])
    const ho = (ngayDat: number, daRen: number): HoSoGameExp => ({ cap: 30, exp: 0, earned: 0, luatCap: 5, expMoi: { daCong: 0, manhDaTinh: 0, ngayDat }, khienRen: { manh: 36, daRen } })
    expect(() => renKhienBangVang(ho(53, 1), 1, 9999)).toThrow(/khiên thứ 2 cần 54 ngày đạt/)
    expect(renKhienBangVang(ho(54, 1), 1, 9999)).toBe(true)
  })
  it('bậc 4 cần cấp 10, bậc 5 cần cấp 20, bậc 1–3 không khoá (trường chỉ-thêm `canCap`); giá m1-v2 theo yêu cầu 30/09', () => {
    expect(CAP_MO_BAC_PHU_KIEN).toEqual({ 1: null, 2: null, 3: null, 4: 10, 5: 20 })
    for (const m of DANH_MUC_PHU_KIEN) expect(m.canCap, m.ma).toBe(m.bac === 4 ? 10 : m.bac === 5 ? 20 : null)
    expect(DANH_MUC_PHU_KIEN.find((m) => m.ma === 'HQ-07')!.gia).toBe(1200)
    expect(DANH_MUC_PHU_KIEN.reduce((t, m) => t + m.gia, 0)).toBe(26_270)
  })
})

// ── (7) chuyển dữ liệu ──────────────────────────────────────────────────────────────────────────
describe('(7) chuyển dữ liệu v4 → v5 (và hồ sơ cũ hơn): không tụt cấp, không mất EXP/vàng/mảnh/khiên, gọi lại không cộng đôi', () => {
  it('mọi cấp × EXP trong thanh × EXP chờ mốc: giữ cấp, tiến độ theo tỉ lệ thanh, chờ mốc giữ nguyên, vàng đáng đúc không đổi; idempotent', () => {
    for (let cap = 1; cap <= 120; cap++) for (const tile of [0, 0.37, 0.999]) for (const cho of [0, 1234]) {
      const exp = cap >= 120 ? 0 : Math.floor(tile * thanhExpV4(cap))
      const cu = { cap, exp, wallet: 0, earned: 50_000, mocVang: 1_000, choMoc: cho, luatCap: LUAT_CAP_V4, khienRen: { manh: 9, daRen: 1 }, shields: { used: 1 } }
      const r = chuyenV4SangV5(cu, '2026-09-30T08:00:00.000Z')
      const n = `cấp ${cap} tỉ lệ ${tile} chờ ${cho}`
      expect(r.daChuyen, n).toBe(true)
      expect(r.hoSo.cap, n).toBe(cap)
      expect(r.hoSo.luatCap, n).toBe(LUAT_CAP_MOI)
      expect(r.hoSo.choMoc, n).toBe(cho)
      if (cap < 120) {
        expect(r.hoSo.exp, n).toBe(Math.min(thanhExp(cap) - 1, Math.floor((exp / thanhExpV4(cap)) * thanhExp(cap))))
        expect(Math.abs(r.hoSo.exp / thanhExp(cap) - exp / thanhExpV4(cap)), n).toBeLessThan(1 / thanhExp(cap) + 1e-9)
      } else expect(r.hoSo.exp, n).toBe(0)
      expect(vangDangDuc(r.hoSo), n).toBe(vangDangDuc(cu))
      expect(r.hoSo, n).toMatchObject({ earned: 50_000, mocVang: 1_000, khienRen: { manh: 9, daRen: 1 }, shields: { used: 1 }, truocV5: { cap, exp, choMoc: cho, earned: 50_000, mocVang: 1_000 } })
      const lai = chuyenV4SangV5(r.hoSo, 'sau')
      expect(lai.daChuyen, n).toBe(false)
      expect(lai.hoSo, n).toBe(r.hoSo)
    }
  })
  it('ngăn chờ mốc v4 đổ vào thú khi sức chứa tăng, KHÔNG thành EXP tràn, không đúc vàng lần nữa', () => {
    const v5 = chuyenV4SangV5({ cap: 9, exp: 2439, wallet: 0, earned: 20_000, mocVang: 0, choMoc: 8000, luatCap: LUAT_CAP_V4 }, 'x').hoSo
    const vangTruoc = vangDangDuc(v5)
    const a = nhanV5(v5, 0, 20, NGAY) // chưa đủ ngày: thú đầy thanh, chờ mốc vẫn giữ
    expect(a.tran).toBe(0)
    expect(a.hoSo.choMoc! + a.daVao).toBe(8000)
    const b = nhanV5(a.hoSo, 0, 24, NGAY) // đủ ngày cho cấp 11 ⇒ ngăn đổ vào
    expect(b.tran).toBe(0)
    expect(b.hoSo.cap).toBeGreaterThanOrEqual(10)
    expect(tongExpToiCap(b.hoSo.cap) + b.hoSo.exp + (b.hoSo.choMoc ?? 0)).toBe(tongExpToiCap(9) + v5.exp + 8000)
    expect(vangDangDuc({ ...b.hoSo, earned: 20_000, mocVang: 0 })).toBe(vangTruoc)
  })
  it('hồ sơ v3 / v2 / cũ hơn đi chuỗi → v5: không tụt cấp; gọi lại trả nguyên', () => {
    for (const cu of [
      { cap: 7, exp: 100, wallet: 900, earned: 5000, luatCap: LUAT_CAP_V3 },
      { cap: 12, exp: 0, wallet: 0, earned: 0, luatCap: LUAT_CAP_V3 },
      { cap: 4, exp: 10, wallet: 100, earned: 0, luatCap: 2 },
      { cap: 6, exp: 50, wallet: 300, earned: 0, mastery: [{ stage: 1 }] },
    ]) {
      const r = chuyenDoiLuatCap(cu, 3, NGAY, { soNgayDat: 3, luc: 'x' })
      expect(r.daChuyen).toBe(true)
      expect(r.hoSo.luatCap).toBe(LUAT_CAP_MOI)
      expect(r.hoSo.cap).toBeGreaterThanOrEqual(cu.cap)
      expect(r.hoSo.truocV5).toBeTruthy()
      expect(chuyenDoiLuatCap(r.hoSo, 3, NGAY).hoSo).toBe(r.hoSo)
    }
  })
  it('qua congTongSoVaoHoSo (đường máy chủ): hồ sơ v4 chuyển lười rồi cộng; vàng liền mạch; mảnh/khiên giữ; gọi lại cùng tổng sổ không cộng đôi', () => {
    const p: HoSoGameExp = { cap: 10, exp: 500, wallet: 0, earned: 13_000, mocVang: 0, choMoc: 0, luatCap: LUAT_CAP_V4, khienRen: { manh: 8, daRen: 0 }, expMoi: { daCong: 13_000, manhDaTinh: 8, ngayDat: 8 } }
    const vangV4 = vangDangDuc(p)
    congTongSoVaoHoSo(p, 13_000, 8, 8)
    expect(p).toMatchObject({ luatCap: 5, cap: 10, khienRen: { manh: 8, daRen: 0 } })
    expect(vangDangDuc(p)).toBe(vangV4)
    const r = congTongSoVaoHoSo(p, 13_100, 8, 8) // cấp 10 với 8 ngày đạt: vẫn làm đầy thanh cấp 10
    expect(r.exp).toBe(100)
    expect(p.cap).toBe(10)
    expect(vangDangDuc(p)).toBe(vangV4 + 20)
    const chup = JSON.stringify(p)
    congTongSoVaoHoSo(p, 13_100, 8, 8)
    expect(JSON.stringify(p)).toBe(chup)
  })
})

// ── (8) EXP câu game ─────────────────────────────────────────────────────────────────────────────
describe('(8) EXP câu game đúng = ½ câu học tập làm tròn lên (1–5)', () => {
  it('bảng EXP_CAU_GAME = ⌈EXP_CAU / 2⌉; một hàm `expMotCauGame`; phần/sao lạ ⇒ Phần I, 0 sao', () => {
    for (const ph of ['I', 'II', 'III'] as const) for (const s of [0, 1, 2]) {
      expect(EXP_CAU_GAME[ph][s]).toBe(Math.ceil(EXP_CAU[ph][s]! / 2))
      expect(expMotCauGame(ph, s)).toBe(EXP_CAU_GAME[ph][s])
    }
    expect(expMotCauGame('X', 9)).toBe(1)
    expect(Math.min(...Object.values(EXP_CAU_GAME).flat())).toBe(1)
    expect(Math.max(...Object.values(EXP_CAU_GAME).flat())).toBe(5)
  })
  it('tổng EXP chăm từ câu game ≈ 74/ngày (30 câu, trộn phần/sao của hồ sơ chăm)', () => {
    const h = HO_SO_MO_PHONG.cham
    let tb = 0
    for (const ph of ['I', 'II', 'III'] as const) for (let s = 0; s < 3; s++) tb += h.phan[ph] * h.sao[s]! * expMotCauGame(ph, s)
    expect(Math.round(30 * tb)).toBe(74)
  })
})

describe('bảng giữ để chuyển đổi (v4) không đổi', () => {
  it('tổng tới cấp 10 của v4 = 11 700, của v5 = 11 690', () => {
    expect(tongExpToiCapV4(10)).toBe(11_700)
    expect(tongExpToiCap(10)).toBe(11_690)
  })
})
