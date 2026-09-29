// @vitest-environment node
// LUẬT EXP v4 (thầy chốt 29/09/2026 "chốt theo đề xuất, build luôn" — docs/DE-XUAT-EXP-2909.md). Bảng nghiệm thu:
//   (1) đường cấp công thức đóng; (2) mô phỏng em chăm nhất: ngày 20 cấp 9, ngày 21 cấp 10, khiên đầu ngày 21; (3) trần KIẾM (câu 3× mục tiêu, khắc phục ≤ 3, lên bậc ≤ 10);
//   (4) vàng 1 / 5 EXP; (5) khoá mốc 21 ngày đạt (EXP chờ, không mất); (6) chuyển dữ liệu cũ v3 → v4 không tụt cấp, gọi lại không nạp đôi; (7) khiên bằng vàng, không cần cấp 10;
//   (8) D1 thật: đúc vàng lười chỉ-thêm, không đúc đôi; rèn khiên trừ đúng 1 400 vàng một lần; vang-doi đã bỏ.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BANG_THANH_EXP, BANG_THANH_EXP_V3, THANH_DAU_V4, thanhExp, thanhExpV3, tongExpToiCap, tongExpToiDinh } from '../src/game/than-thu-hoa-hoc/kinh-nghiem'
import { EXP_MOI_VANG, NGAY_DAT_MO_CAP_10, VANG_REN_KHIEN, vangDangDuc } from '../src/lib/kinh-te-game'
import { LUAT_CAP_MOI, LUAT_CAP_V3, chuyenDoiLuatCap, chuyenV3SangV4, dangKhoaMoc, nhanTuDo } from '../src/lib/hap-thu-ngay'
import { HO_SO_MO_PHONG, chayMoPhong, expCauNgay } from '../src/lib/mo-phong-bang-gia-exp'
import { KHAC_PHUC_TOI_DA_NGAY, LEN_BAC_TOI_DA_NGAY, TRAN_CUNG_HE_SO } from '../server/src/exp-cau-hinh'
import { tinhExp, type SuKienExp, type VaoTinhExp } from '../server/src/exp-hoc-tap'
import { congTongSoVaoHoSo, renKhienBangVang, type HoSoGameExp } from '../server/src/exp-ho-so-game'
import { ducVang, renKhienVang } from '../server/src/vang-duc'
import { gameV2 } from '../server/src/game-v2'
import { gameToken } from '../server/src/game-v2-auth'
import { taoD1That, type D1That } from './_d1-that'

describe('(1) đường cấp v4 — công thức đóng', () => {
  it('9 thanh đầu = làmTròn10(87,49·c^1,6), tổng 11 700 (thanh 9 bù lệch); từ cấp 10 +60 mỗi cấp; tổng các mốc đúng đề xuất', () => {
    expect([...THANH_DAU_V4]).toEqual([90, 270, 510, 800, 1150, 1540, 1970, 2440, 2930])
    const K = 11700 / Array.from({ length: 9 }, (_, i) => (i + 1) ** 1.6).reduce((a, b) => a + b, 0)
    for (let c = 1; c <= 8; c++) expect(thanhExp(c), `cấp ${c}`).toBe(Math.round((K * c ** 1.6) / 10) * 10)
    expect(BANG_THANH_EXP).toHaveLength(119)
    for (let c = 10; c <= 119; c++) expect(thanhExp(c), `cấp ${c}`).toBe(2930 + 60 * (c - 9))
    for (let i = 1; i < 119; i++) expect(BANG_THANH_EXP[i]!).toBeGreaterThan(BANG_THANH_EXP[i - 1]!)
    expect([10, 20, 30, 50, 100, 120].map(tongExpToiCap)).toEqual([11_700, 44_300, 82_900, 178_100, 521_100, 700_300])
    expect(tongExpToiDinh()).toBe(700_300)
    expect(thanhExp(120)).toBe(0)
    // bảng v3 giữ nguyên cho chuyển đổi và P08
    expect(BANG_THANH_EXP_V3.reduce((a, b) => a + b, 0)).toBe(238_200)
    expect(thanhExpV3(1)).toBe(120)
  })
})

describe('(2) mô phỏng 60 ngày bằng hàm sản phẩm', () => {
  it('em chăm nhất: ngày 20 cấp 9, ngày 21 cấp 10; khiên đầu ngày 21', () => {
    const r = chayMoPhong(HO_SO_MO_PHONG.cham, 60)
    expect(r.capNgay[20]).toBe(9)
    expect(r.cap[10]).toBe(21)
    expect(r.khienDau).toBe(21)
    expect(r.khien2).toBe(42)
    expect(r.cap[5]).toBe(3)
    expect(Math.round(r.tbNgay)).toBe(584)
    expect([7, 14, 21, 30].map((n) => r.vangTichLuy[n])).toEqual([802, 1620, 2440, 3490])
  })
  it('không khoá mốc: đường cấp một mình vẫn cho ngày 21; lịch dày hơn (thêm 1 ca thi + 1 lên bảng/tuần): khoá mốc giữ đúng ngày 21', () => {
    expect(chayMoPhong(HO_SO_MO_PHONG.cham, 60, false).cap[10]).toBe(21)
    const day = { ...HO_SO_MO_PHONG.cham, ca: (t: number) => (t === 7 || t === 3 ? 10 : null), lenBang: (t: number) => (t === 4 || t === 2 ? 'dat' as const : null) }
    expect(chayMoPhong(day, 60, false).cap[10]).toBe(20)
    expect(chayMoPhong(day, 60, true).cap[10]).toBe(21)
  })
  it('trung bình và yếu chậm hơn (cấp 10 ngày 38 / 75), không ai sớm hơn ngày 21', () => {
    expect(chayMoPhong(HO_SO_MO_PHONG.tb, 60).cap[10]).toBe(38)
    expect(chayMoPhong(HO_SO_MO_PHONG.yeu, 120).cap[10]).toBe(75)
    expect(chayMoPhong(HO_SO_MO_PHONG.tb, 60).khienDau).toBe(24)
  })
  it('cày 200 câu/ngày: EXP câu không đổi (trần cứng 3× mục tiêu)', () => {
    expect(expCauNgay({ ...HO_SO_MO_PHONG.cham, cauDung: 200 })).toBeCloseTo(expCauNgay(HO_SO_MO_PHONG.cham), 9)
  })
})

// ── (3) trần KIẾM ─────────────────────────────────────────────────────────────────────────────────
const NGAY = '2026-09-30'
const vao = (o: Partial<VaoTinhExp> = {}): VaoTinhExp => ({
  ngay: NGAY, suKien: [], metaCau: {}, mucTieuCau: 16, lenBac: [], khacPhuc: [], loXong: [], baiBtvnNop: [], momXong: [], diemCa: [], datNgay: null, dangRoiYeu: [], daCoKhoa: new Set(), ...o,
})
const cauDung = (n: number): SuKienExp[] => Array.from({ length: n }, (_, i) => ({ khoa: `k${String(i).padStart(4, '0')}`, nguon: 'on_lai', maNguon: 'x', qid: `Q-I-${i}`, lan: 1, ketQua: 1, luc: `2026-09-30T01:${String(Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}.000Z` }))

describe('(3) trần KIẾM mới', () => {
  it('câu học tập: mục tiêu 16 ⇒ câu 1–32 đủ, 33–48 tính 25 %, từ câu 49 = 0 (không sinh khoản)', () => {
    expect(TRAN_CUNG_HE_SO).toBe(3)
    const k = tinhExp(vao({ suKien: cauDung(200) })).khoan.filter((x) => x.loai === 'cau')
    expect(k).toHaveLength(48)
    expect(k.slice(0, 32).every((x) => x.exp === 2)).toBe(true)
    expect(k.slice(32).every((x) => x.exp === 1)).toBe(true)
  })
  it('khắc phục ≤ 3 lần có EXP/ngày; lên bậc ≤ 10 lần có EXP/ngày', () => {
    expect([KHAC_PHUC_TOI_DA_NGAY, LEN_BAC_TOI_DA_NGAY]).toEqual([3, 10])
    const r = tinhExp(vao({ lenBac: Array.from({ length: 15 }, (_, i) => `B${i}`), khacPhuc: Array.from({ length: 6 }, (_, i) => ({ qid: `K${i}`, lan: 1, luc: `2026-09-30T02:0${i}:00.000Z` })) }))
    expect(r.khoan.filter((x) => x.loai === 'len_bac')).toHaveLength(10)
    expect(r.khoan.filter((x) => x.loai === 'khac_phuc')).toHaveLength(3)
  })
  it('trần tính trên CẢ ngày: lần gọi sau chỉ thêm phần còn thiếu (khoá đã ghi + số đã trả trong ngày)', () => {
    const lan1 = tinhExp(vao({ lenBac: ['B0', 'B1', 'B2', 'B3', 'B4', 'B5'], khacPhuc: [{ qid: 'K0', lan: 1, luc: '2026-09-30T02:00:00.000Z' }, { qid: 'K1', lan: 1, luc: '2026-09-30T02:01:00.000Z' }] }))
    const daCo = new Set(lan1.khoan.map((x) => x.khoa))
    const lan2 = tinhExp(vao({
      daCoKhoa: daCo, daTraTrongNgay: { khacPhuc: 2, lenBac: 6 },
      lenBac: Array.from({ length: 12 }, (_, i) => `B${i}`), khacPhuc: Array.from({ length: 5 }, (_, i) => ({ qid: `K${i}`, lan: 1, luc: `2026-09-30T02:0${i}:00.000Z` })),
    }))
    expect(lan2.khoan.filter((x) => x.loai === 'len_bac')).toHaveLength(4)
    expect(lan2.khoan.filter((x) => x.loai === 'khac_phuc')).toHaveLength(1)
  })
})

describe('(4) vàng tự động 1 / 5 EXP, thú vẫn nhận đủ', () => {
  it('vàng đáng đúc = floor((earned − mocVang)/5); hồ sơ chưa sang v4 (thiếu mocVang) ⇒ 0', () => {
    expect(EXP_MOI_VANG).toBe(5)
    expect(vangDangDuc({ earned: 1004, mocVang: 0 })).toBe(200)
    expect(vangDangDuc({ earned: 1004, mocVang: 500 })).toBe(100)
    expect(vangDangDuc({ earned: 400, mocVang: 500 })).toBe(0)
    expect(vangDangDuc({ earned: 9999 })).toBe(0)
  })
  it('cộng EXP vào hồ sơ v4: thú nhận ĐỦ số EXP (không chia), earned tăng đúng số đó', () => {
    const p: HoSoGameExp = { cap: 1, exp: 0, wallet: 0, earned: 0, luatCap: LUAT_CAP_MOI, mocVang: 0, expMoi: { daCong: 0, manhDaTinh: 0, ngayDat: 0 } }
    const r = congTongSoVaoHoSo(p, 400, 0, 0)
    expect(r.exp).toBe(400)
    expect(tongExpToiCap(p.cap) + p.exp).toBe(400)
    expect(p.earned).toBe(400)
    expect(p.wallet).toBe(0)
    expect(vangDangDuc(p)).toBe(80)
    expect(r.thu).toMatchObject({ cap: 3, exp: 40, soCapLen: 2, choMoc: 0 })
  })
})

describe('(5) khoá mốc: cấp 10 cần ≥ 21 ngày đạt; EXP vượt giữ chờ, đủ ngày thì vào thú', () => {
  it('20 ngày đạt: dừng cuối cấp 9, phần vượt chờ mốc; ngày đạt thứ 21 (them = 0) mở hết, không mất EXP', () => {
    expect(NGAY_DAT_MO_CAP_10).toBe(21)
    const a = nhanTuDo({ cap: 1, exp: 0, wallet: 0 }, 15_000, 20)
    expect(a.hoSo.cap).toBe(9)
    expect(a.hoSo.exp).toBe(thanhExp(9) - 1)
    expect(a.choMoc).toBe(15_000 - (tongExpToiCap(10) - 1))
    const b = nhanTuDo(a.hoSo, 0, 21)
    expect(b.hoSo.choMoc).toBe(0)
    expect(tongExpToiCap(b.hoSo.cap) + b.hoSo.exp).toBe(15_000)
    expect(b.hoSo.cap).toBe(11)
  })
  it('em đã ở cấp ≥ 10 (kể cả theo đường cũ) không bị chặn; cấp 120: EXP chỉ ghi sổ', () => {
    expect(dangKhoaMoc(10, 0)).toBe(false)
    expect(dangKhoaMoc(9, 20)).toBe(true)
    expect(nhanTuDo({ cap: 12, exp: 0, wallet: 0 }, 5000, 0).hoSo.cap).toBeGreaterThan(12)
    expect(nhanTuDo({ cap: 120, exp: 0, wallet: 0 }, 5000, 0).hoSo).toMatchObject({ cap: 120, exp: 0, choMoc: 0 })
  })
  it('qua congTongSoVaoHoSo: ngày đạt thứ 21 về cùng lượt cộng thì mở phần chờ ngay; không có EXP mới vẫn mở', () => {
    const p: HoSoGameExp = { cap: 1, exp: 0, wallet: 0, earned: 0, luatCap: LUAT_CAP_MOI, mocVang: 0, expMoi: { daCong: 0, manhDaTinh: 0, ngayDat: 20 } }
    congTongSoVaoHoSo(p, 12_000, 20, 20)
    expect(p.cap).toBe(9)
    expect(p.choMoc).toBe(12_000 - (tongExpToiCap(10) - 1))
    congTongSoVaoHoSo(p, 12_000, 21, 21)
    expect(p.cap).toBe(10)
    expect(p.choMoc).toBe(0)
    expect(tongExpToiCap(p.cap) + p.exp).toBe(12_000)
  })
})

describe('(6) chuyển dữ liệu cũ v3 → v4: chỉ-thêm, không ai tụt cấp, gọi lại không nạp đôi', () => {
  it('mọi cấp 1…120 × nhiều mức EXP/ống: cấp sau ≥ cấp trước; ống về 0 và đã vào thú (hoặc chờ mốc); ghi truocSiet4; mocVang = earned', () => {
    for (let cap = 1; cap <= 120; cap++) for (const exp of [0, 7, 119, 3000]) for (const wallet of [0, 150, 5000, 60_000]) for (const ngayDat of [0, 21]) {
      const cu = { cap, exp: Math.min(exp, Math.max(0, thanhExpV3(cap) - 1)), wallet, earned: 777, luatCap: LUAT_CAP_V3, hapThu: { ngay: '2026-09-29', da: 50 } }
      const r = chuyenV3SangV4(cu, ngayDat, '2026-09-30T00:00:00.000Z')
      const nhan = `cấp ${cap} exp ${exp} ống ${wallet} ngày đạt ${ngayDat}`
      expect(r.hoSo.cap, nhan).toBeGreaterThanOrEqual(cap)
      expect(r.hoSo.luatCap, nhan).toBe(LUAT_CAP_MOI)
      expect(r.hoSo.wallet, nhan).toBe(0)
      expect(r.hoSo.mocVang, nhan).toBe(777)
      expect(r.hoSo.truocSiet4, nhan).toEqual({ cap, exp: cu.exp, wallet, earned: 777, luc: '2026-09-30T00:00:00.000Z' })
      expect('hapThu' in r.hoSo, nhan).toBe(false)
      if (cap < 120) {
        const truoc = tongExpToiCap(cap) + Math.floor((cu.exp / thanhExpV3(cap)) * thanhExp(cap))
        expect(tongExpToiCap(r.hoSo.cap) + r.hoSo.exp + (r.hoSo.choMoc ?? 0), nhan).toBe(Math.min(truoc + wallet, tongExpToiCap(120))) // quá cấp 120: EXP chỉ ghi sổ
      }
      // gọi lại: y nguyên, không nạp đôi
      const lai = chuyenV3SangV4(r.hoSo, ngayDat, 'sau')
      expect(lai.daChuyen, nhan).toBe(false)
      expect(lai.hoSo, nhan).toBe(r.hoSo)
    }
  })
  it('giữ tiến độ trong thanh theo tỉ lệ: cấp 5 nửa thanh cũ (130/260) ⇒ nửa thanh mới (575/1150)', () => {
    const r = chuyenV3SangV4({ cap: 5, exp: 130, wallet: 0, earned: 0, luatCap: 3 }, 0, 'x')
    expect(r.hoSo).toMatchObject({ cap: 5, exp: 575, choMoc: 0 })
  })
  it('chuyenDoiLuatCap: v4 trả nguyên (idempotent); v2 đi qua v3 rồi v4; không đụng vàng/mảnh/khiên/đồ', () => {
    const v3 = { cap: 6, exp: 10, wallet: 900, earned: 5000, luatCap: 3, khienRen: { manh: 7, daRen: 1 }, shields: { used: 1 }, pet: 'lua_phuong' }
    const a = chuyenDoiLuatCap(v3, 5, '2026-09-30', { soNgayDat: 3 })
    expect(a.daChuyen).toBe(true)
    expect(a.hoSo).toMatchObject({ luatCap: 4, khienRen: { manh: 7, daRen: 1 }, shields: { used: 1 }, pet: 'lua_phuong', wallet: 0 })
    expect(chuyenDoiLuatCap(a.hoSo, 5, '2026-09-30').hoSo).toBe(a.hoSo)
    const v2 = chuyenDoiLuatCap({ cap: 4, exp: 0, wallet: 100, earned: 0, luatCap: 2 }, 1, '2026-09-30')
    expect(v2.hoSo.luatCap).toBe(4)
    expect(v2.hoSo.cap).toBeGreaterThanOrEqual(4)
  })
  it('congTongSoVaoHoSo trên hồ sơ v3: chuyển rồi cộng; gọi lại cùng tổng sổ không cộng đôi', () => {
    const p = { cap: 3, exp: 20, wallet: 500, earned: 900, luatCap: 3, expMoi: { daCong: 900, manhDaTinh: 0, ngayDat: 2 } } as HoSoGameExp
    const r = congTongSoVaoHoSo(p, 1000, 0, 2)
    expect(r.exp).toBe(100)
    expect(p.luatCap).toBe(4)
    expect(p.mocVang).toBe(900)
    expect(p.earned).toBe(1000)
    expect(vangDangDuc(p)).toBe(20)
    const chup = JSON.stringify(p)
    expect(congTongSoVaoHoSo(p, 1000, 0, 2).exp).toBe(0)
    expect(JSON.stringify(p)).toBe(chup)
  })
})

describe('(7) khiên rèn: 21 mảnh + 21 ngày đạt + 1 400 vàng, không cần cấp 10, giữ tối đa 5', () => {
  const ho = (o: Partial<HoSoGameExp> = {}): HoSoGameExp => ({ cap: 2, exp: 0, earned: 0, luatCap: 4, expMoi: { daCong: 0, manhDaTinh: 21, ngayDat: 21 }, khienRen: { manh: 21, daRen: 0 }, ...o })
  it('cấp 2 vẫn rèn được khi đủ 1 400 vàng; thiếu vàng / thiếu ngày / thiếu mảnh ⇒ lỗi nói rõ', () => {
    expect(VANG_REN_KHIEN).toBe(1400)
    const p = ho()
    expect(renKhienBangVang(p, 0, 1400)).toBe(true)
    expect(p.khienRen).toEqual({ manh: 0, daRen: 1 })
    expect(() => renKhienBangVang(ho(), 0, 1399)).toThrow(/1\.400 vàng/)
    expect(() => renKhienBangVang(ho({ expMoi: { daCong: 0, manhDaTinh: 21, ngayDat: 20 } }), 0, 9999)).toThrow(/21 ngày đạt/)
    expect(() => renKhienBangVang(ho({ khienRen: { manh: 20, daRen: 0 } }), 0, 9999)).toThrow(/21 mảnh/)
  })
  it('gửi lại cùng số đã rèn ⇒ không rèn thêm; đủ 5 khiên chưa dùng ⇒ ngừng', () => {
    const p = ho({ khienRen: { manh: 21, daRen: 1 } })
    expect(renKhienBangVang(p, 0, 9999)).toBe(false)
    expect(() => renKhienBangVang(ho({ khienRen: { manh: 21, daRen: 5 }, shields: { used: 0 } }), 5, 9999)).toThrow(/đủ khiên/)
  })
})

// ── (8) D1 thật (node:sqlite, lược đồ thật) ─────────────────────────────────────────────────────────
const T0 = Date.parse('2026-09-30T12:00:00+07:00')
describe('(8) D1: đúc vàng lười, rèn khiên bằng vàng, vang-doi đã bỏ', () => {
  beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0) })
  afterEach(() => vi.useRealTimers())
  const dung = (p: Record<string, unknown>): D1That => {
    const d = taoD1That()
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Em','12','mk','x')").run()
    d.sql.prepare('INSERT INTO game_v2_profile(sbd,json,created_at) VALUES(?,?,?)').run('S1', JSON.stringify({ pet: 'lua_phuong', choice: false, legacy: null, cap: 5, exp: 40, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null, cutover: '2026-09-01T00:00:00.000Z', luatCap: 4, mocVang: 0, ...p }), 'x')
    d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('shop_phu_kien',?,'x')").run(JSON.stringify({ bat: true }))
    return d
  }
  const vangSo = (d: D1That): number => (d.sql.prepare("SELECT COALESCE(SUM(so_vang),0) v FROM vang_so WHERE sbd='S1'").get() as { v: number }).v
  it('đúc: thêm MỘT dòng phần chênh; gọi lại cùng hồ sơ không đúc đôi; EXP kiếm thêm ⇒ dòng mới đúng phần chênh; vàng cũ giữ nguyên', async () => {
    const d = dung({ earned: 1003 })
    d.sql.prepare("INSERT INTO vang_so(sbd,loai,so_vang,exp_tru,ma_mon,khoa_yeu_cau,luc) VALUES('S1','doi',300,300,NULL,'cu-abcdefgh','x')").run()
    expect(await ducVang(d.env, 'S1', { earned: 1003, mocVang: 0 })).toBe(200)
    expect(await ducVang(d.env, 'S1', { earned: 1003, mocVang: 0 })).toBe(0)
    await Promise.all([ducVang(d.env, 'S1', { earned: 1500, mocVang: 0 }), ducVang(d.env, 'S1', { earned: 1500, mocVang: 0 })])
    expect(vangSo(d)).toBe(300 + 300)
    const dong = d.sql.prepare("SELECT so_vang, exp_tru FROM vang_so WHERE sbd='S1' AND khoa_yeu_cau LIKE 'duc|%' ORDER BY id").all() as { so_vang: number; exp_tru: number }[]
    expect(dong).toEqual([{ so_vang: 200, exp_tru: 0 }, { so_vang: 100, exp_tru: 0 }])
  })
  it('vang-xem: đúc rồi trả số dư; không còn ống nghiệm/đổi tay; vang-doi ⇒ da_bo, không ghi gì', async () => {
    const d = dung({ earned: 2000 })
    const tk = await gameToken(d.env, 'S1')
    expect(await gameV2(d.env, 'vang-xem', { token: tk })).toMatchObject({ ok: true, bat: true, vang: 400, ongNghiem: 0, doiToiDa: 0, expMoiVang: 5 })
    expect(await gameV2(d.env, 'vang-doi', { token: tk, soExp: 10, khoaYeuCau: 'khoa-abcdefgh' })).toMatchObject({ ok: false, ma: 'da_bo' })
    expect(vangSo(d)).toBe(400)
  })
  it('rèn khiên: trừ đúng 1 400 vàng MỘT lần (gửi lại cùng số đã rèn không trừ nữa); thiếu vàng ⇒ lỗi, không trừ', async () => {
    const d = dung({ earned: 7500, cap: 3, expMoi: { daCong: 0, manhDaTinh: 21, ngayDat: 21 }, khienRen: { manh: 21, daRen: 0 } })
    const tk = await gameToken(d.env, 'S1')
    const r = await gameV2(d.env, 'khien-ren', { token: tk, soDaRen: 0 }) as Record<string, any>
    expect(r).toMatchObject({ ok: true, daRen: true })
    expect(vangSo(d)).toBe(1500 - 1400)
    const lai = await gameV2(d.env, 'khien-ren', { token: tk, soDaRen: 0 }) as Record<string, any>
    expect(lai.daRen).toBe(false)
    expect(vangSo(d)).toBe(100)
    const p = JSON.parse((d.sql.prepare("SELECT json FROM game_v2_profile WHERE sbd='S1'").get() as { json: string }).json)
    expect(p.khienRen).toEqual({ manh: 0, daRen: 1 })
    const d2 = dung({ earned: 5000, expMoi: { daCong: 0, manhDaTinh: 21, ngayDat: 21 }, khienRen: { manh: 21, daRen: 0 } })
    await expect(renKhienVang(d2.env, 'S1', JSON.parse((d2.sql.prepare("SELECT json FROM game_v2_profile WHERE sbd='S1'").get() as { json: string }).json), 0, 0)).rejects.toThrow(/1\.400 vàng/)
    expect(vangSo(d2)).toBe(1000)
  })
})
