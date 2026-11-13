// «SINH TỒN» BẢN 2 — ĐỢT 2 (thầy duyệt 13/11, docs/dac-ta-sinh-ton-v2-1311.md): «chỉ gửi gần» (ảnh lọc = ảnh đủ cho mọi phép tính của máy em),
// truy nã thủ khoa `tk` + chuỗi trong lượt hạ, hộp 4 loại (`loaiHop` dùng chung + hiệu ứng), biểu cảm `bc`, bảng vàng `bv` + hạng `hg`.
import { describe, expect, it } from 'vitest'
import {
  CAP_TOI_DA, HE_NHANH, HOI_SINH_MS, KHIEN_MS, LOAI_HOP, MAU_DAY, NHANH_MS, SAO_MS, TAM_NHIN_X, TAM_NHIN_Y, VAN_CHOI_MS, VAN_MS, apHop, buocToi, capSung, chonMucTieu,
  coKhien, dangNhanh, docDong, hopSo, loaiHop, nhanDon, satThuong, taoBanDo, taoToi, type KhungNhin, type NhanVat, type Toi,
} from '../src/lib/live-khoi/sinh-ton-loi'
import { buocMay, taoMay, type May } from '../src/lib/live-khoi/sinh-ton-may'
import type { SinhTonAnh, SinhTonDong, SinhTonHa } from '../src/lib/live-khoi/kieu'
import { BIEU_CAM_MS, GUI_GAN_BK, GoiSinhTon, MaySinhTon } from '../server/src/sinh-ton-may-chu'

const hat = (s: number) => () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
/** Giây thứ 10 của một ván (không nghỉ). */
const T0 = 1000 * VAN_MS + 10_000

// ── «CHỈ GỬI GẦN» ──
/** Đọc ảnh như máy em đọc: JSON.parse rồi for…in + docDong, bỏ chính mình (thứ tự khoá sau parse = thứ tự máy em thấy). */
function docNhu(x: { ds: Record<string, SinhTonDong> }, toi: string): NhanVat[] {
  const kq: NhanVat[] = []
  for (const id in x.ds) { if (id === toi) continue; const n = docDong(id, x.ds[id]); if (n) kq.push(n) }
  return kq
}
/** Ảnh ngẫu nhiên: `n` nhân vật, mã giống số báo danh thật (khoá số nguyên ⇒ parse đổi thứ tự) + máy bù `~a-b`; đủ 6 cấp; một nửa cấu hình xếp toạ độ
 *  theo lưới 30 (nhiều thế hoà khoảng cách / sát thương); vài cấu hình dồn cục (cuối ván ai cũng trong vòng nhỏ). */
function anhNgauNhien(r: () => number, co: number, n: number, kieu: 'rai' | 'cum' | 'luoi'): SinhTonAnh {
  const bd = taoBanDo(co)
  const ids: string[] = []
  for (let i = 0; i < n; i++) ids.push(r() < 0.25 ? `~${Math.floor(r() * 80)}-${i}` : String(100000 + Math.floor(r() * 900000)))
  const tam = { x: bd.rong * (0.2 + r() * 0.6), y: bd.cao * (0.2 + r() * 0.6) }
  const ds: Record<string, SinhTonDong> = {}
  const vt: { id: string; x: number; y: number; doi: number }[] = []
  for (const id of ids) {
    if (ds[id]) continue
    let x: number, y: number
    if (kieu === 'cum') { x = tam.x + (r() - 0.5) * 1400; y = tam.y + (r() - 0.5) * 900 } else { x = r() * bd.rong; y = r() * bd.cao }
    if (kieu === 'luoi') { x = Math.round(x / 30) * 30; y = Math.round(y / 30) * 30 }
    x = Math.round(Math.min(bd.rong, Math.max(0, x))); y = Math.round(Math.min(bd.cao, Math.max(0, y)))
    const doi = Math.floor(r() * 4)
    ds[id] = [x, y, r() < 0.1 ? 0 : 1 + Math.floor(r() * 100), doi, 1 + Math.floor(r() * CAP_TOI_DA), '']
    vt.push({ id, x, y, doi })
  }
  // Mục tiêu: phần lớn bắn đối thủ gần (như máy em khai), một ít bắn xa / khai bừa (máy chủ chỉ kiểm khác đội).
  for (const a of vt) {
    const u = r()
    if (u < 0.25) continue
    let ung = vt.filter((b) => b.doi !== a.doi && Math.hypot(b.x - a.x, b.y - a.y) < 700)
    if (u > 0.9 || !ung.length) ung = vt.filter((b) => b.doi !== a.doi)
    if (ung.length) ds[a.id][5] = ung[Math.floor(r() * ung.length)].id
  }
  return { ds, an: [], d: [0, 0, 0, 0], v: 1, c: co, h: [-1, ''] }
}

describe('«chỉ gửi gần»: ảnh lọc cho từng em = ảnh đủ (sát thương + chọn mục tiêu)', () => {
  it(`ngẫu nhiên nhiều cấu hình, 6 cấp súng, sân cỡ 0 và cỡ 4, máy em lệch vị trí ≤ 250 (hộp ±${GUI_GAN_BK}): 0 sai khác`, () => {
    const r = hat(2026)
    let soNhan = 0, soLech = 0, coLan = 0, coBan = 0
    const lech: string[] = []
    for (let lan = 0; lan < 160; lan++) {
      const co = lan % 2 ? 4 : 0, kieu = (['rai', 'cum', 'luoi'] as const)[lan % 3], n = 8 + Math.floor(r() * 92)
      const anh = anhNgauNhien(r, co, n, kieu), bd = taoBanDo(co), goi = new GoiSinhTon(anh, T0, new Map())
      const du = JSON.parse(goi.du()) as { x: SinhTonAnh }
      for (const id of Object.keys(anh.ds)) {
        const loc = JSON.parse(goi.cho(id)) as { x: SinhTonAnh }
        const row = anh.ds[id]
        const dsDu = docNhu(du.x, id), dsLoc = docNhu(loc.x, id)
        // Hai lượt: đúng vị trí phòng biết, và vị trí thật ở máy em lệch tối đa 250 (trễ gói + mạng).
        for (const truot of [0, 250]) {
          const g = r() * Math.PI * 2, d = truot * Math.sqrt(r())
          const toi = { id, x: row[0] + Math.cos(g) * d, y: row[1] + Math.sin(g) * d, doi: row[3] }
          const k: KhungNhin = { x0: toi.x - 420, y0: toi.y - 180, x1: toi.x + 420, y1: toi.y + 220 }
          for (const giay of [0.25, 1 / 3]) {
            const a = satThuong(toi, dsDu, giay), b = satThuong(toi, dsLoc, giay)
            soNhan++
            if (a.tong > 0) coBan++
            if (dsDu.some((e) => e.t && e.t !== id && e.doi !== toi.doi && (e.cap === 3 || e.cap === 4 || e.cap === 6)) && a.tong > 0) coLan++
            // So TUYỆT ĐỐI (tổng số thực, kẻ gây nhiều nhất, kẻ châm lửa) — không toBeCloseTo.
            if (a.tong !== b.tong || a.ai !== b.ai || a.chay !== b.chay) { soLech++; if (lech.length < 3) lech.push(`${id} ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`) }
          }
          for (const kh of [undefined, k]) if (chonMucTieu(bd, toi, dsDu, kh) !== chonMucTieu(bd, toi, dsLoc, kh)) { soLech++; if (lech.length < 3) lech.push(`ngắm ${id}`) }
        }
        // Luôn kèm phần chung; đồng đội đủ (bản đồ nhỏ): dòng đủ trong `ds` hoặc chấm [x, y] trong `dd`.
        expect([loc.x.an, loc.x.d, loc.x.v, loc.x.c, loc.x.h]).toEqual([du.x.an, du.x.d, du.x.v, du.x.c, du.x.h])
        const dd = loc.x.dd ?? [], cham = new Set<string>()
        for (let i = 0; i < dd.length; i += 2) cham.add(`${dd[i]},${dd[i + 1]}`)
        let dongDoi = 0
        for (const k2 in anh.ds) {
          if (anh.ds[k2][3] !== row[3]) continue
          dongDoi++
          if (loc.x.ds[k2]) expect(loc.x.ds[k2]).toEqual(anh.ds[k2]); else expect(cham.has(`${anh.ds[k2][0]},${anh.ds[k2][1]}`)).toBe(true)
        }
        expect(Object.values(loc.x.ds).filter((r) => r[3] === row[3]).length + dd.length / 2).toBe(dongDoi)
      }
    }
    expect(lech).toEqual([]); expect(soLech).toBe(0)
    // Bộ thử thật sự có bắn và có lan (không phải 0 = 0 suông).
    expect(coBan).toBeGreaterThan(1000); expect(coLan).toBeGreaterThan(100); expect(soNhan).toBeGreaterThan(20_000)
  })
  it('thế hoà dựng tay: hai kẻ bắn cách đều, cùng cấp ⇒ `ai` / `chay` / mục tiêu y hệt ảnh đủ (giữ đúng thứ tự dòng)', () => {
    const ds: Record<string, SinhTonDong> = {
      // X ở (2000, 1500), đội 0. Hai kẻ cấp 5 cùng cách 300, cùng bắn X; một kẻ cấp 4 ở rất xa bắn M sát X (sấm nảy sang X).
      '900001': [2300, 1500, 80, 1, 5, '200000'], '~5-1': [1700, 1500, 80, 2, 5, '200000'], '300000': [2000, 1800, 80, 3, 5, '200000'],
      '200000': [2000, 1500, 90, 0, 1, ''], '~7-2': [2050, 1500, 70, 1, 1, ''], '400000': [2050 + 600, 1500, 60, 2, 4, '~7-2'],
      '500000': [5000, 3500, 100, 3, 6, '400000'], '600000': [100, 100, 100, 0, 2, ''],
    }
    const anh: SinhTonAnh = { ds, an: [], d: [0, 0, 0, 0], v: 1, c: 4, h: [-1, ''] }
    const goi = new GoiSinhTon(anh, T0, new Map()), bd = taoBanDo(4)
    const loc = JSON.parse(goi.cho('200000')).x as SinhTonAnh, du = JSON.parse(goi.du()).x as SinhTonAnh
    const toi = { id: '200000', x: 2000, y: 1500, doi: 0 }
    expect(satThuong(toi, docNhu(loc, toi.id), 0.25)).toEqual(satThuong(toi, docNhu(du, toi.id), 0.25))
    expect(chonMucTieu(bd, toi, docNhu(loc, toi.id))).toBe(chonMucTieu(bd, toi, docNhu(du, toi.id)))
    // Kẻ ở xa bắn kẻ đã trong tập (lặp tới ổn định) có mặt; đồng đội xa chỉ là chấm `dd`; người không liên quan ở xa vắng.
    expect(loc.ds['500000']).toBeDefined(); expect(loc.ds['600000']).toBeUndefined(); expect(loc.dd).toEqual([100, 100])
    const xa: Record<string, SinhTonDong> = { ...ds, '700000': [6000, 200, 100, 1, 1, ''] }
    expect(JSON.parse(new GoiSinhTon({ ...anh, ds: xa }, T0, new Map()).cho('200000')).x.ds['700000']).toBeUndefined()
  })
  it('máy chưa lên sân / mã lạ ⇒ ảnh đủ; ảnh đủ = JSON.stringify của ảnh (tin `lop` · `tro`)', () => {
    const anh = anhNgauNhien(hat(5), 2, 40, 'rai')
    anh.tk = Object.keys(anh.ds)[3]; anh.bc = { [Object.keys(anh.ds)[0]]: 2 }
    const goi = new GoiSinhTon(anh, T0, new Map())
    expect(JSON.parse(goi.du())).toEqual({ t: 'lop', k: 'tro', s: '', n: '', d: -1, l: T0, x: anh })
    expect(goi.cho('khong-co')).toBe(goi.du())
    // Thủ khoa luôn có trong ảnh lọc (sao trên bản đồ nhỏ).
    for (const id of Object.keys(anh.ds)) expect(JSON.parse(goi.cho(id)).x.ds[anh.tk!]).toEqual(anh.ds[anh.tk!])
  })
})

// ── Truy nã thủ khoa + chuỗi ──
/** Sân giả cỡ 0 (đầu ván): em thật đứng thành bốn cụm theo đội, cách nhau xa hơn khung nhìn ⇒ máy bù (đi theo em cùng đội) không bắn nhau, lượt hạ chỉ do
 *  test khai; `ha(ai, bi)` = máy `bi` báo bị `ai` hạ (mỗi em 1 lần / 2,5 giây ⇒ tự tiến 2,6 giây, mọi em gửi gói để không bị gỡ vì im). */
const CUM = [[900, 700], [2300, 700], [900, 1300], [2300, 1300]]
function san(soEm = 8) {
  const m = new MaySinhTon(hat(9))
  let nay = 1000 * VAN_MS + 1000
  const em = Array.from({ length: soEm }, (_, i) => ({ id: `E${i}`, doi: i % 4 }))
  const goi = (id: string, x: Record<string, unknown>) => {
    const e = em.find((v) => v.id === id)!, c = CUM[e.doi]
    m.nhan(id, e.doi, { p: [c[0] + 40 * Math.floor(Number(id.slice(1)) / 4), c[1], 100, 1], ...x }, nay)
  }
  for (const e of em) goi(e.id, {})
  let anh = m.nhip(nay)!
  const buoc = (ms = 250) => { nay += ms; for (const e of em) goi(e.id, {}); anh = m.nhip(nay)!; return anh }
  const ha = (ai: string, bi: string) => {
    nay += 2600
    for (const e of em) goi(e.id, e.id === bi ? { a: ai } : {})
    anh = m.nhip(nay)!
    return anh.an.find((d) => d[0] === ai && d[1] === bi) as SinhTonHa
  }
  return { m, em, goi, buoc, ha, get anh() { return anh }, get nay() { return nay }, dat: (t: number) => { nay = t } }
}

describe('truy nã thủ khoa (`tk`) + chuỗi trong lượt hạ', () => {
  it('≥ 3 lượt hạ mới thành thủ khoa; bằng lượt ⇒ người đang giữ giữ nguyên; vượt hẳn ⇒ đổi; ván mới ⇒ hết', () => {
    const s = san()
    s.ha('E0', 'E1'); s.ha('E0', 'E3')
    expect(s.anh.tk).toBeUndefined()
    s.ha('E0', 'E5')
    expect(s.anh.tk).toBe('E0')
    s.ha('E2', 'E1'); s.ha('E2', 'E3'); s.ha('E2', 'E5')
    expect(s.anh.tk).toBe('E0') // E2 cũng 3 ⇒ E0 vẫn giữ
    s.ha('E2', 'E7')
    expect(s.anh.tk).toBe('E2')
    s.dat(Math.ceil(s.nay / VAN_MS) * VAN_MS + 1000); s.buoc()
    expect(s.anh.tk).toBeUndefined()
  })
  it('lượt hạ mang [kẻ hạ, bị hạ, chuỗi người bị hạ, chuỗi kẻ hạ, bị hạ là thủ khoa]; chết ngoài vòng (máu 0, không kẻ hạ) ⇒ hết chuỗi', () => {
    const s = san()
    expect(s.ha('E0', 'E1')).toEqual(['E0', 'E1', 0, 1, 0])
    expect(s.ha('E0', 'E3')).toEqual(['E0', 'E3', 0, 2, 0])
    expect(s.ha('E0', 'E5')).toEqual(['E0', 'E5', 0, 3, 0])
    expect(s.anh.tk).toBe('E0')
    // E1 hạ thủ khoa đang chuỗi 3 ⇒ «ĐÃ TIÊU DIỆT THỦ KHOA!» + «ĐÁNH TRƯỢT ĐẠI HỌC!».
    expect(s.ha('E1', 'E0')).toEqual(['E1', 'E0', 3, 1, 1])
    expect(s.anh.tk).toBe('E0') // bị hạ không mất lượt hạ ⇒ vẫn dẫn đầu, vẫn bị truy nã
    expect(s.ha('E1', 'E2')).toEqual(['E1', 'E2', 0, 2, 0])
    // E1 chết ngoài vòng: gói máu 0 không kèm kẻ hạ ⇒ chuỗi về 0.
    s.buoc(2600); s.dat(s.nay + 200); s.goi('E1', { p: [2300, 700, 0, 1] })
    expect(s.ha('E1', 'E4')).toEqual(['E1', 'E4', 0, 1, 0])
  })
  it('máy bù được làm thủ khoa; máy hạ thủ khoa ⇒ lên thêm một cấp (tối đa cấp 3 của máy)', () => {
    const s = san(4)
    const may = Object.keys(s.anh.ds).filter((id) => id.startsWith('~'))
    const mayDoi = (d: number) => may.find((id) => s.anh.ds[id][3] === d)!
    // Thủ khoa là em E0 (đội 0); một máy đội 1 hạ E0 ⇒ máy lên 2 cấp (1 → 3).
    s.ha('E0', 'E1'); s.ha('E0', 'E2'); s.ha('E0', 'E3')
    expect(s.anh.tk).toBe('E0')
    const b = mayDoi(1)
    expect(s.ha(b, 'E0')).toEqual([b, 'E0', 3, 1, 1])
    expect(s.anh.ds[b][4]).toBe(3)
    // Máy đội 2 hạ ba em ⇒ thành thủ khoa nếu vượt hẳn E0 (3) ⇒ cần 4.
    const c = mayDoi(2)
    for (const v of ['E0', 'E1', 'E3']) s.ha(c, v)
    expect(s.anh.tk).toBe('E0')
    s.ha(c, 'E0')
    expect(s.anh.tk).toBe(c)
  })
  it('thủ khoa rời sân ⇒ chọn lại người nhiều lượt hạ nhất còn trên sân (≥ 3), không ai ⇒ hết', () => {
    const s = san()
    s.ha('E0', 'E1'); s.ha('E0', 'E3'); s.ha('E0', 'E5'); s.ha('E0', 'E7')
    s.ha('E2', 'E1'); s.ha('E2', 'E3'); s.ha('E2', 'E5')
    expect(s.anh.tk).toBe('E0')
    s.m.xoa('E0'); s.em.splice(0, 1); s.buoc()
    expect(s.anh.tk).toBe('E2')
    s.m.xoa('E2'); s.em.splice(1, 1); s.buoc()
    expect(s.anh.tk).toBeUndefined()
  })
})

// ── Hộp 4 loại ──
describe('hộp tiếp tế 4 loại (`loaiHop` dùng chung máy chủ / máy em / máy bù)', () => {
  it('giá trị cố định (đổi = đổi giao thức), bốn loại đều nhau, không lặp vòng 4', () => {
    expect(LOAI_HOP).toEqual(['mau', 'khien', 'nhanh', 'sao'])
    expect([0, 1, 2, 3, 4, 5, 6, 7, 88_000_000, 88_000_001, 88_000_002, 88_000_003].map(loaiHop))
      .toEqual(['mau', 'nhanh', 'mau', 'sao', 'khien', 'mau', 'nhanh', 'khien', 'sao', 'khien', 'mau', 'nhanh'])
    const dem: Record<string, number> = {}
    const goc = hopSo(Date.UTC(2026, 10, 13))
    for (let i = 0; i < 4000; i++) dem[loaiHop(goc + i)] = (dem[loaiHop(goc + i)] ?? 0) + 1
    for (const l of LOAI_HOP) { expect(dem[l]).toBeGreaterThan(900); expect(dem[l]).toBeLessThan(1100) }
    expect(new Set([0, 4, 8, 12, 16].map((i) => loaiHop(goc + i))).size).toBeGreaterThan(1)
    expect(loaiHop(Number.NaN)).toBe(loaiHop(0)); expect(loaiHop(5.7)).toBe(loaiHop(5))
  })
  const bd = taoBanDo(0)
  const giua = () => ({ ...taoToi(bd, 0, T0), x: bd.rong / 2, y: bd.cao / 2, batTuDen: 0 })
  it('Hồi đầy máu · Khiên 5 giây chặn MỌI sát thương (đạn, cháy, ngoài vòng) · Chạy nhanh 6 giây ×1,35', () => {
    expect(apHop({ ...giua(), mau: 12 }, 'mau', T0).mau).toBe(MAU_DAY)
    const k = apHop({ ...giua(), mau: 50 }, 'khien', T0)
    expect(k.khienDen).toBe(T0 + KHIEN_MS); expect(coKhien(k, T0 + KHIEN_MS - 1)).toBe(true); expect(coKhien(k, T0 + KHIEN_MS)).toBe(false)
    expect(nhanDon(k, 40, T0 + 100, 'X')).toBe(k) // không mất, không cháy
    expect(nhanDon(k, 40, T0 + KHIEN_MS).mau).toBe(10)
    // Đang cháy + đứng ngoài vòng (góc sân lúc cuối ván) mà có khiên ⇒ không mất máu.
    const cuoi = Math.floor(T0 / VAN_MS) * VAN_MS + VAN_CHOI_MS - 2000
    const ngoai: Toi = { ...taoToi(bd, 0, cuoi), x: 30, y: 30, batTuDen: 0, mau: 50, chayDen: cuoi + 1500, chayAi: 'X', lucTrung: cuoi, khienDen: cuoi + 1000 }
    expect(buocToi(bd, ngoai, { dx: 0, dy: 0 }, 100, cuoi).mau).toBe(50)
    expect(buocToi(bd, { ...ngoai, khienDen: 0 }, { dx: 0, dy: 0 }, 100, cuoi).mau).toBeLessThan(50)
    // Chạy nhanh: cùng một bước đi xa hơn đúng ×1,35 (giữa sân trống).
    const n = apHop(giua(), 'nhanh', T0)
    expect(n.nhanhDen).toBe(T0 + NHANH_MS); expect(dangNhanh(n, T0 + 1)).toBe(true)
    const di = (t: Toi) => buocToi(bd, t, { dx: 1, dy: 0 }, 50, T0 + 10).x - t.x
    expect(di(n)).toBeCloseTo(di(giua()) * HE_NHANH, 6)
    expect(di({ ...n, nhanhDen: T0 })).toBeCloseTo(di(giua()), 6)
  })
  it('Pháo Sao 10 giây = súng TẠM cấp 6: không tính lên cấp, hết giờ trả cấp thật (kể cả cấp vừa lên), bị hạ giữa chừng ⇒ hồi sinh cấp 1', () => {
    const s = apHop({ ...giua(), cap: 2 }, 'sao', T0)
    expect(s.cap).toBe(2); expect(s.saoDen).toBe(T0 + SAO_MS)
    expect(capSung(s, T0 + 1)).toBe(6); expect(capSung(s, T0 + SAO_MS)).toBe(2)
    // Hạ được bạn giữa lúc Pháo Sao: cấp thật lên 3, súng vẫn 6; hết giờ về 3.
    const len = { ...s, cap: s.cap + 1 }
    expect(capSung(len, T0 + 5000)).toBe(6); expect(capSung(len, T0 + SAO_MS + 1)).toBe(3)
    // Bị hạ giữa chừng: mất Pháo Sao ngay, hồi sinh cấp 1.
    const chet = nhanDon(len, 500, T0 + 3000)
    expect(chet.saoDen).toBe(0); expect(capSung(chet, T0 + 3001)).toBe(3)
    const song = buocToi(bd, chet, { dx: 0, dy: 0 }, 16, T0 + 3000 + HOI_SINH_MS)
    expect(song.cap).toBe(1); expect(capSung(song, T0 + 3000 + HOI_SINH_MS)).toBe(1)
    expect([song.khienDen ?? 0, song.nhanhDen ?? 0, song.saoDen ?? 0]).toEqual([0, 0, 0])
  })
  it('máy bù: khiên chặn sát thương, chạy nhanh, Pháo Sao làm dòng ảnh chụp mang cấp 6; bị hạ ⇒ mất hết', () => {
    const r = hat(4)
    const m: May = { ...taoMay(bd, '~1-0', 0, T0, 0), x: 1600, y: 600, batTuDen: 0 }
    const ban: NhanVat = { id: 'A', x: 1700, y: 600, mau: 100, doi: 1, cap: 6, t: '~1-0' }
    const k: May = { ...m, ...apHop(m, 'khien', T0) }
    buocMay(bd, k, [ban], T0 + 250, 250, r)
    expect(k.mau).toBe(MAU_DAY)
    const kk: May = { ...m }
    buocMay(bd, kk, [ban], T0 + 250, 250, r)
    expect(kk.mau).toBeLessThan(MAU_DAY)
    // Pháo Sao: chết ⇒ saoDen 0.
    const s: May = { ...m, ...apHop(m, 'sao', T0), mau: 1 }
    expect(capSung(s, T0 + 1)).toBe(6)
    buocMay(bd, s, [ban], T0 + 250, 250, r)
    expect(s.chetDen).toBeGreaterThan(0); expect(s.saoDen).toBe(0)
  })
  it('máy chủ: máy bù đi ngang hộp chưa ai nhặt ⇒ nhận hộp, áp ĐÚNG loại `loaiHop(số hộp)`; em thật chạm trước thì em được', () => {
    // Em đứng giữa sân (không xin hộp) ⇒ máy đồng đội đi theo quanh em, sớm muộn chạm hộp giữa sân.
    const m = new MaySinhTon(hat(21))
    let nhan = 0
    for (let t = T0; t < T0 + 100_000; t += 250) {
      m.nhan('E0', 0, { p: [1600, 1000, 100, 1] }, t)
      const anh = m.nhip(t)!
      const [so, ai] = anh.h
      if (ai.startsWith('~') && so === hopSo(t)) {
        const may = (m as unknown as { may: May[] }).may.find((v) => v.id === ai)!
        const l = loaiHop(so)
        if (l === 'khien') expect(coKhien(may, t)).toBe(true)
        if (l === 'nhanh') expect(dangNhanh(may, t)).toBe(true)
        if (l === 'sao') expect(anh.ds[ai][4]).toBe(6)
        if (l === 'mau') expect(may.mau).toBe(MAU_DAY)
        nhan++
        t = (so + 1) * 20_000 - 250 // sang hộp kế
      }
    }
    expect(nhan).toBeGreaterThan(0)
  })
})

// ── Biểu cảm + bảng vàng ──
describe('biểu cảm `e` ⇒ `bc` (1 lần / 2 giây mỗi em, 4 chỉ số cố định)', () => {
  it('nhận 0..3; lần thứ hai trong 2 giây bị bỏ; hết 2 giây ⇒ mất; chỉ số lạ / chữ ⇒ bỏ; em chưa lên sân ⇒ bỏ', () => {
    const m = new MaySinhTon(hat(3))
    m.nhan('E9', 0, { p: [500, 500, 100, 1], e: 1 }, T0) // chưa lên sân ⇒ bỏ biểu cảm (gói vị trí vẫn nhận)
    expect(m.nhip(T0)!.bc).toBeUndefined()
    m.nhan('E9', 0, { p: [500, 500, 100, 1], e: 2 }, T0 + 50) // gói nhanh hơn 180 ms vẫn nhận biểu cảm
    expect(m.nhip(T0 + 250)!.bc).toEqual({ E9: 2 })
    m.nhan('E9', 0, { p: [500, 500, 100, 1], e: 3 }, T0 + 1000)
    expect(m.nhip(T0 + 1000)!.bc).toEqual({ E9: 2 })
    expect(m.nhip(T0 + 50 + BIEU_CAM_MS)!.bc).toBeUndefined()
    for (const e of [4, -1, 1.5, '2', null]) m.nhan('E9', 0, { p: [500, 500, 100, 1], e }, T0 + 5000)
    expect(m.nhip(T0 + 5000)!.bc).toBeUndefined()
    m.nhan('E9', 0, { p: [500, 500, 100, 1], e: 0 }, T0 + 5300)
    expect(m.nhip(T0 + 5300)!.bc).toEqual({ E9: 0 })
  })
  it('ảnh lọc chỉ mang biểu cảm của nhân vật trong tập', () => {
    const anh: SinhTonAnh = { ds: { A: [100, 100, 100, 0, 1, ''], B: [5000, 3000, 100, 1, 1, ''], C: [200, 100, 100, 2, 1, ''] }, an: [], d: [0, 0, 0, 0], v: 1, c: 4, h: [-1, ''], bc: { B: 1, C: 3 } }
    const g = new GoiSinhTon(anh, T0, new Map())
    expect(JSON.parse(g.cho('A')).x.bc).toEqual({ C: 3 })
    expect(JSON.parse(g.du()).x.bc).toEqual({ B: 1, C: 3 })
  })
})

describe('bảng vàng `bv` + hạng riêng `hg` (5 giây nghỉ cuối ván)', () => {
  it('chỉ trong 5 giây nghỉ; top 3 EM THẬT theo lượt hạ (bằng lượt ⇒ ai đạt trước); máy bù không bao giờ vào; `hg` riêng từng em, bằng nhau cùng hạng', () => {
    const s = san(8)
    const may = Object.keys(s.anh.ds).filter((id) => id.startsWith('~'))
    // Máy bù hạ nhiều nhất (5) — vẫn không vào bảng vàng.
    const bot = may.find((id) => s.anh.ds[id][3] === 1)!
    for (const v of ['E0', 'E2', 'E4', 'E6', 'E0']) s.ha(bot, v)
    s.ha('E0', 'E1'); s.ha('E0', 'E3'); s.ha('E0', 'E5')
    s.ha('E2', 'E1'); s.ha('E2', 'E3'); s.ha('E2', 'E5')
    s.ha('E4', 'E7'); s.ha('E6', 'E5')
    s.ha('E1', 'E2')
    expect(s.anh.bv).toBeUndefined(); expect(s.anh.tk).toBe(bot)
    s.dat(Math.floor(s.nay / VAN_MS) * VAN_MS + VAN_CHOI_MS + 500)
    const anh = s.buoc(0)
    expect(anh.bv).toEqual([['E0', 3], ['E2', 3], ['E4', 1]])
    const g = s.m.goi(anh, s.nay)
    const hg = (id: string) => JSON.parse(g.cho(id)).x.hg as number | undefined
    expect(['E0', 'E2', 'E4', 'E6', 'E1', 'E3', 'E5', 'E7'].map(hg)).toEqual([1, 1, 3, 3, 3, 6, 6, 6])
    expect(JSON.parse(g.du()).x.hg).toBeUndefined()
    expect(JSON.parse(g.cho(bot)).x.hg).toBeUndefined()
    // Ván mới ⇒ hết bảng vàng, hết hạng.
    s.dat(Math.ceil(s.nay / VAN_MS) * VAN_MS + 1000)
    const moi = s.buoc(0)
    expect(moi.bv).toBeUndefined(); expect(JSON.parse(s.m.goi(moi, s.nay).cho('E0')).x.hg).toBeUndefined()
  })
})

describe('khung nhìn mặc định vẫn nằm gọn trong hộp gửi gần', () => {
  it('TAM_NHIN + trượt < GUI_GAN_BK', () => {
    expect(TAM_NHIN_X + 250).toBeLessThan(GUI_GAN_BK); expect(TAM_NHIN_Y + 250).toBeLessThan(GUI_GAN_BK)
  })
})
