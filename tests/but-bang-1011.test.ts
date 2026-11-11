// BÚT VIẾT BẢNG (thầy 10/11: «chỉnh phần bút viết cho mượt mà … viết bằng bút wacom lên phần bảng đen, nét bút mảnh vừa phải siêu đẹp»;
// 11/11 thầy viết Wacom thật: «Viết bị nhằng nhằng chưa mượt như goodnote» ⇒ đường cong qua đúng mẫu, khử rung rất nhẹ, cắt nét chắc tay, ô đo bút).
// Kiểm bộ máy thuần `but-bang-loi.ts` (chạy đúng chuỗi JS mà tờ chiếu chạy): chuẩn hoá toạ độ · làm mượt · bề rộng theo lực + thon hai đầu ·
// đa giác bao · hoàn tác / làm lại / xoá hết · tẩy theo nét · xuất / nhập · sự kiện cho việc live; và phần gắn vào tờ (JSDOM, không có canvas thật).
import { describe, it, expect } from 'vitest'
import { JSDOM, VirtualConsole } from 'jsdom'
import { JS_LOI_BUT, taoLoiBut, type DiemBut, type NetBut, type SuKienBut } from '../src/lib/but-bang-loi'
import { CSS_BUT_BANG, JS_BUT_BANG } from '../src/lib/but-bang-to-chieu'
import { taoHtmlMayChieu, type OBang } from '../src/lib/html-may-chieu'

const L = taoLoiBut()
const KH = L.khung(1920, 1080)
/** Nét mẫu: n điểm cách nhau 5 ms đi theo hàm f(i) (px màn 1920 × 1080), lực cố định. */
const net = (n: number, f: (i: number) => [number, number], ap = 0.4, co = 2.3): NetBut =>
  ({ id: 'n', cong: 'but', mau: 'rgb(244,239,228)', co, diem: Array.from({ length: n }, (_, i) => { const [x, y] = f(i); return L.diem(x, y, ap, i * 5, 1920, 1080) }) })
/** Diện tích đa giác phẳng [x0, y0, x1, y1…] (trị tuyệt đối). */
const dienTich = (p: number[]) => { let s = 0; for (let i = 0; i < p.length; i += 2) { const j = (i + 2) % p.length; s += p[i] * p[j + 1] - p[j] * p[i + 1] } return Math.abs(s) / 2 }
/** Bề rộng đa giác bao tại hoành độ x của một nét nằm ngang: khoảng giữa giao điểm thấp nhất và cao nhất của đường x với các cạnh (đỉnh thưa hay dày đều đo được). */
const beRongTai = (p: number[], x: number, _sai?: number) => {
  const ys: number[] = []
  for (let i = 0; i < p.length; i += 2) { const j = (i + 2) % p.length, x0 = p[i], x1 = p[j]; if ((x0 - x) * (x1 - x) <= 0 && x0 !== x1) ys.push(p[i + 1] + (p[j + 1] - p[i + 1]) * (x - x0) / (x1 - x0)) }
  return Math.max(...ys) - Math.min(...ys)
}
const trongDaGiac = (p: number[], x: number, y: number) => { let t = false; for (let i = 0, j = p.length - 2; i < p.length; j = i, i += 2) if ((p[i + 1] > y) !== (p[j + 1] > y) && x < ((p[j] - p[i]) * (y - p[i + 1])) / (p[j + 1] - p[i + 1]) + p[i]) t = !t; return t }

describe('chuỗi JS chèn vào tờ', () => {
  it('ES5, không backtick, không ${ — chạy được trên trình duyệt cũ và nằm gọn trong chuỗi mẫu', () => {
    for (const js of [JS_LOI_BUT, JS_BUT_BANG]) {
      expect(js).not.toMatch(/`|\$\{/)
      expect(js).not.toMatch(/=>|\b(?:let|const|class)\s/)
    }
    expect(() => new Function(JS_LOI_BUT)).not.toThrow()
  })
  it('CSS thêm mới chỉ dùng biến màu của tờ (không rgb / hex thô)', () => {
    expect(CSS_BUT_BANG).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(/i)
    expect(CSS_BUT_BANG).toContain('var(--mc-thanh2)')
  })
})

describe('toạ độ chuẩn hoá theo vùng viết', () => {
  it('điểm = [x 0..1, y 0..160, lực 0..1, ms]: gọn 5 số lẻ, kẹp trong vùng (11/11: y vượt 1 = nét trên bảng đen đã cuộn; x, lực, giờ vẫn kẹp như cũ)', () => {
    expect(L.diem(960, 540, 0.4567, 12.6, 1920, 1080)).toEqual([0.5, 0.5, 0.46, 13])
    expect(L.diem(-30, 5000, 2, -4, 1920, 1080)).toEqual([0, 4.62963, 1, 0])
    expect(L.diem(3000, -8, 0.5, 0, 1920, 1080)).toEqual([1, 0, 0.5, 0])
    expect(L.diem(0, 1080 * 999, 0.5, 0, 1920, 1080)[1]).toBe(160)
    expect(L.diem(1234.5678, 321.987, 0.5, 0, 1920, 1080)).toEqual([0.643, 0.29814, 0.5, 0])
  })
  it('cùng một nét vẽ ở 1920×1080 và 1280×720 ⇒ cùng đa giác trong hệ «px màn 1920» (máy khác vẽ lại đúng)', () => {
    const n = net(80, (i) => [300 + i * 6, 400 + Math.sin(i / 8) * 50])
    const a = L.dungNet(n, L.khung(1920, 1080)), b = L.dungNet(n, L.khung(1280, 720))
    expect(L.khung(1280, 720).k).toBeCloseTo(2 / 3, 6)
    expect(b.length).toBe(a.length)
    a.forEach((v, i) => expect(b[i]).toBeCloseTo(v, 6))
  })
  it('cửa sổ hẹp ngang (4:3): đơn vị nét lấy theo bề ngang; cửa sổ dẹt: theo bề dọc × 16/9', () => {
    expect(L.khung(1600, 1200).k).toBeCloseTo(1600 / 1920, 6)
    expect(L.khung(2560, 1080).k).toBeCloseTo(1, 6)
    expect(L.khung(2560, 1080).rw).toBeCloseTo(2560, 6)
  })
})

/** Khoảng cách từ (x, y) tới đường gấp khúc phẳng [x0, y0, x1, y1…]. */
const xaDuong = (x: number, y: number, p: number[]) => {
  if (p.length === 2) return Math.hypot(x - p[0], y - p[1])
  let tot = Infinity
  for (let i = 0; i + 3 < p.length; i += 2) {
    const vx = p[i + 2] - p[i], vy = p[i + 3] - p[i + 1], q = vx * vx + vy * vy, t = q ? Math.max(0, Math.min(1, ((x - p[i]) * vx + (y - p[i + 1]) * vy) / q)) : 0
    tot = Math.min(tot, Math.hypot(p[i] + t * vx - x, p[i + 1] + t * vy - y))
  }
  return tot
}
/** Ba bướu chữ «m» nhỏ: mỗi bướu ngang 9 px, cao 7 px. t = 0..3. */
const buou = (t: number): [number, number] => [300 + 9 * t, 500 - 3.5 * (1 - Math.cos(2 * Math.PI * t))]
/** Lệch lớn nhất giữa đường thật (hàm f trên [0, T], bước 0,01) và đường tâm vẽ ra. */
const lechThat = (f: (t: number) => [number, number], T: number, tam: number[]) => { let lon = 0; for (let t = 0; t <= T; t += 0.01) { const [x, y] = f(t); lon = Math.max(lon, xaDuong(x, y, tam)) } return lon }

describe('đường tâm: đi QUA đúng mẫu · khử rung rất nhẹ · không trễ (thầy 11/11: «viết bị nhằng nhằng chưa mượt như goodnote»)', () => {
  it('mẫu THƯA (60 mẫu / giây, 6 mẫu mỗi bướu chữ «m» cao 7 px): bướu không bị san phẳng — lệch tâm ≤ 0,5 px, đỉnh bướu còn đủ cao', () => {
    const n = net(19, (i) => buou(i / 6))
    const tam = L.duongTam(n, KH)
    expect(lechThat(buou, 3, tam)).toBeLessThan(0.5)
    expect(Math.min(...tam.filter((_, i) => i % 2 === 1))).toBeLessThan(493.2)
    // đi QUA đúng từng mẫu (mẫu thưa ⇒ không khử rung)
    for (const d of n.diem) expect(xaDuong(d[0] * 1920, d[1] * 1080, tam)).toBeLessThan(0.02)
  })
  it('mẫu DÀY (200 mẫu / giây) trên cùng bướu đó: khử rung gần như không đụng tới chỗ cong thật — lệch tâm ≤ 0,15 px', () => {
    const n = net(49, (i) => buou(i / 16))
    expect(lechThat(buou, 3, L.duongTam(n, KH))).toBeLessThan(0.15)
  })
  it('bậc thang của toạ độ nguyên px (bút chạy như chuột, đi chậm theo đường xiên) ⇒ đường tâm sát đường thật hơn hẳn mẫu thô, không mẫu nào bị dịch quá 0,55 px', () => {
    const n = net(120, (i) => [300 + i, Math.round(500 + i / 3)])
    const tam = L.duongTam(n, KH)
    const lechDuong = (x: number, y: number) => Math.abs(y - (500 + (x - 300) / 3)) / Math.hypot(1, 1 / 3)
    const rms = (ds: number[][]) => Math.sqrt(ds.reduce((s, [x, y]) => s + lechDuong(x, y) ** 2, 0) / ds.length)
    const tho = rms(n.diem.slice(5, -5).map((d) => [d[0] * 1920, d[1] * 1080])), ve: number[][] = []
    for (let i = 0; i < tam.length; i += 2) if (tam[i] > 305 && tam[i] < 414) ve.push([tam[i], tam[i + 1]])
    expect(tho).toBeGreaterThan(0.25)
    expect(rms(ve)).toBeLessThan(tho * 0.6)
    for (const d of n.diem) expect(xaDuong(d[0] * 1920, d[1] * 1080, tam)).toBeLessThan(0.56)
  })
  it('góc nhọn / quay đầu bút là NÉT THẬT: không bị nắn — đường tâm vẫn chạm đúng đỉnh', () => {
    const v = net(81, (i) => (i <= 40 ? [500 + i * 0.1, 500 + i * 0.9] : [504 + (i - 40) * 0.1, 536 - (i - 40) * 0.9]))
    expect(xaDuong(504, 536, L.duongTam(v, KH))).toBeLessThan(0.02)
  })
  it('viết nhanh (1200 px/s): đầu nét KHÔNG trễ — đường tâm tới đúng mẫu mới nhất, phần chưa chốt chỉ là 3 đoạn cuối; hình không phụ thuộc giờ ghi trên mẫu', () => {
    const n = net(60, (i) => [300 + i * 6, 500 + Math.sin(i / 5) * 20]), st = L.moXuLy(n, KH)
    L.xuLyThem(st, n.diem, n.diem.length)
    const d = L.duoiTam(st, null), cuoi = n.diem[59]
    expect(Math.hypot(d.X[d.X.length - 1] - cuoi[0] * 1920, d.Y[d.Y.length - 1] - cuoi[1] * 1080)).toBeLessThan(1e-9)
    // phần đã chốt dừng ở mẫu thứ 4 từ cuối: đuôi tạm = 3 đoạn cuối
    expect(st.X[st.X.length - 1]).toBeCloseTo(n.diem[56][0] * 1920, 6)
    const p = L.vien(st, 0, -1, null, true)
    expect(Math.max(...p.filter((_, i) => i % 2 === 0))).toBeGreaterThan(st.px - 0.01)
    // giờ mẫu dồn cục / sai (mọi mẫu cùng giờ 0) ⇒ vẫn đúng hình đó
    expect(L.dungNet({ ...n, diem: n.diem.map((x) => [x[0], x[1], x[2], 0] as DiemBut) }, KH)).toEqual(L.dungNet(n, KH))
  })
  it('điểm nối thêm sau mẫu cuối (đầu bút thật, điểm xem trước, điểm dự đoán) chỉ kéo dài ĐUÔI tạm, không đổi phần đã chốt', () => {
    const n = net(40, (i) => [300 + i * 3, 500 + Math.sin(i / 4) * 12]), st = L.moXuLy(n, KH)
    L.xuLyThem(st, n.diem, n.diem.length)
    const X = st.X.slice(), a = L.duoiTam(st, null), b = L.duoiTam(st, [[425, 496], [431, 494]])
    expect(st.X).toEqual(X)
    expect(b.X[b.X.length - 1]).toBe(431); expect(b.L[b.L.length - 1]).toBeGreaterThan(a.L[a.L.length - 1] + 10)
  })
  it('xử lý DẦN từng mẻ điểm cho đúng kết quả như xử lý một lần (máy nhận live dựng nét y hệt máy phát)', () => {
    const n = net(200, (i) => [400 + Math.cos(i / 15) * 180 + i, 500 + Math.sin(i / 9) * 120])
    const mot = L.moXuLy(n, KH), dan = L.moXuLy(n, KH)
    L.xuLyThem(mot, n.diem, n.diem.length)
    for (let i = 7; i < n.diem.length; i += 7) L.xuLyThem(dan, n.diem, i)
    L.xuLyThem(dan, n.diem, n.diem.length)
    expect(dan.X).toEqual(mot.X); expect(dan.Y).toEqual(mot.Y); expect(dan.R).toEqual(mot.R)
    expect(L.vien(dan, 0, -1, null, true)).toEqual(L.dungNet(n, KH))
  })
  it('nét dài: phần đầu in dần xuống lớp tĩnh từng khúc — các khúc + đuôi phủ kín đường tâm, mỗi lượt vẽ chỉ dựng đoạn cuối', () => {
    const n = net(600, (i) => [200 + i * 2.5, 500 + Math.sin(i / 20) * 200])
    const st = L.moXuLy(n, KH)
    let dong = 0
    const khuc: number[][] = []
    for (let i = 10; i <= n.diem.length; i += 10) {
      L.xuLyThem(st, n.diem, i)
      const den = L.mocDong(st, dong)
      if (den > 0) { khuc.push(L.vien(st, dong, den, null, false)); dong = den - 2 }
      // phần chưa in luôn dài hơn đoạn thon cuối + ngưỡng «nét ngắn» (7,2 lần bề rộng) ⇒ nhấc bút lúc nào cũng thon được mà không phải xoá lớp tĩnh
      if (dong) expect(st.L[st.L.length - 1] - st.L[dong]).toBeGreaterThan(2.3 * 7.2)
    }
    expect(khuc.length).toBeGreaterThan(3)
    expect(st.X.length - dong).toBeLessThan(140)
    khuc.push(L.vien(st, dong, -1, null, true))
    const tam = L.duongTam(n, KH)
    for (let i = 0; i < tam.length; i += 6) expect(khuc.some((p) => trongDaGiac(p, tam[i], tam[i + 1])), `điểm tâm ${i / 2}`).toBe(true)
  })
})

describe('bề rộng theo lực + thon hai đầu + đa giác bao', () => {
  it('nét cơ sở 2,3 px ở màn 1920; lực nhẹ → mạnh đổi bề rộng trong khoảng 0,7× … 1,35× (hẹp hơn 0,6 … 1,6 cũ: chữ nhỏ ấn mạnh không bị nét to át chữ)', () => {
    expect(L.heSo(0)).toBeCloseTo(0.7, 6); expect(L.heSo(1)).toBeCloseTo(1.35, 6)
    const ngang = (ap: number) => beRongTai(L.dungNet(net(120, (i) => [300 + i * 4, 500], ap), KH), 540)
    const nhe = ngang(0.05), vua = ngang(0.4), manh = ngang(0.95)
    expect(nhe).toBeGreaterThan(2.3 * 0.7); expect(nhe).toBeLessThan(vua); expect(vua).toBeLessThan(manh); expect(manh).toBeLessThan(2.3 * 1.36)
    expect(vua).toBeGreaterThan(2.1); expect(vua).toBeLessThan(2.6)
  })
  it('lực đổi đột ngột giữa hai mẫu ⇒ bề rộng đổi dần (lực làm trơn 3 mẫu), không gãy khúc', () => {
    const n = net(60, (i) => [300 + i * 4, 500])
    n.diem.forEach((d, i) => { d[2] = i < 30 ? 0.1 : 0.9 })
    const p = L.dungNet(n, KH), truoc = beRongTai(p, 300 + 27 * 4, 1.5), giua = beRongTai(p, 300 + 29.5 * 4, 1.5), sau = beRongTai(p, 300 + 32 * 4, 1.5)
    expect(giua).toBeGreaterThan(truoc + 0.15); expect(giua).toBeLessThan(sau - 0.15)
  })
  it('thon RẤT NGẮN và nhẹ: đầu nét còn ~72 %, cuối nét ~55 %, chỉ trong ~2 lần bề rộng; đang viết (chưa nhấc bút) thì cuối nét chưa thon', () => {
    const n = net(120, (i) => [300 + i * 4, 500]), st = L.moXuLy(n, KH)
    L.xuLyThem(st, n.diem, n.diem.length)
    const xong = L.vien(st, 0, -1, null, true), dang = L.vien(st, 0, -1, null, false)
    const giua = beRongTai(xong, 540)
    expect(beRongTai(xong, 300.4, 0.5)).toBeLessThan(giua * 0.82); expect(beRongTai(xong, 300.4, 0.5)).toBeGreaterThan(giua * 0.6)
    expect(beRongTai(xong, 306, 1.5)).toBeGreaterThan(giua * 0.97)
    expect(beRongTai(xong, 775.6, 0.5)).toBeLessThan(giua * 0.7); expect(beRongTai(xong, 775.6, 0.5)).toBeGreaterThan(giua * 0.45)
    expect(beRongTai(xong, 769, 1.5)).toBeGreaterThan(giua * 0.97)
    expect(beRongTai(dang, 775.6, 0.5)).toBeGreaterThan(giua * 0.97)
  })
  it('nét NGẮN (dấu phẩy, dấu thanh dài 3 px) không bị thon thành sợi: giữ đủ bề rộng của nét dài', () => {
    const dai = beRongTai(L.dungNet(net(120, (i) => [300 + i * 4, 500]), KH), 540)
    const ngan = L.dungNet(net(7, (i) => [600 + i * 0.5, 500]), KH)
    expect(beRongTai(ngan, 601.5, 0.6)).toBeGreaterThan(dai * 0.97)
    expect(beRongTai(ngan, 600.2, 0.4)).toBeGreaterThan(dai * 0.9)
  })
  it('chuột / chạm: lực giả theo vận tốc — đi nhanh thì nhẹ (mảnh), đi chậm thì đậm, đổi dần không giật', () => {
    let cham = 0.3, nhanh = 0.3
    for (let i = 0; i < 40; i++) { cham = L.apLucGia(cham, 1, 8); nhanh = L.apLucGia(nhanh, 24, 8) }
    expect(cham).toBeGreaterThan(nhanh + 0.3)
    expect(Math.abs(L.apLucGia(0.3, 24, 8) - 0.3)).toBeLessThan(0.05)
  })
  it('đa giác bao kín quanh đường tâm (kể cả chỗ gập gắt quay đầu bút), diện tích ≈ dài × rộng, không NaN', () => {
    const thang = net(100, (i) => [300 + i * 4, 500])
    const p = L.dungNet(thang, KH)
    expect(p.every(Number.isFinite)).toBe(true)
    expect(dienTich(p)).toBeGreaterThan(396 * 2.3 * 0.8); expect(dienTich(p)).toBeLessThan(396 * 2.3 * 1.5)
    // chữ V nhọn: đi xuống rồi quay ngược lên
    const v = net(80, (i) => (i < 40 ? [500 + i * 0.5, 300 + i * 5] : [520 + (i - 40) * 0.5, 500 - (i - 40) * 5]))
    const pv = L.dungNet(v, KH), tam = L.duongTam(v, KH)
    expect(pv.every(Number.isFinite)).toBe(true)
    for (let i = 0; i < tam.length; i += 2) expect(trongDaGiac(pv, tam[i], tam[i + 1]) || pv.some((_, k) => k % 2 === 0 && Math.hypot(pv[k] - tam[i], pv[k + 1] - tam[i + 1]) < 2.5), `điểm tâm ${i / 2}`).toBe(true)
  })
  it('chấm một cái (một điểm) ⇒ một chấm tròn; ấn tại chỗ mạnh dần ⇒ chấm to hơn; tô bằng đường cong bậc hai qua trung điểm rồi đóng kín', () => {
    const cham = L.dungNet(net(1, () => [600, 600], 0.1), KH)
    expect(cham.length).toBe(28)
    const tb = (p: number[], le: number) => p.filter((_, i) => i % 2 === le).reduce((a, b) => a + b, 0) / (p.length / 2)
    const banKinh = (p: number[]) => Math.max(...p.filter((_, i) => i % 2 === 0)) - tb(p, 0)
    for (let i = 0; i < 28; i += 2) expect(Math.hypot(cham[i] - tb(cham, 0), cham[i + 1] - tb(cham, 1))).toBeCloseTo(banKinh(cham), 6)
    const an: NetBut = { id: 'c', cong: 'but', mau: 'rgb(244,239,228)', co: 2.3, diem: [0.1, 0.3, 0.6].map((ap, i) => L.diem(600, 600, ap, i * 5, 1920, 1080)) }
    expect(L.dungNet(an, KH).length).toBe(28)
    expect(banKinh(L.dungNet(an, KH))).toBeGreaterThan(banKinh(cham) * 1.25)
    expect(banKinh(cham)).toBeGreaterThan(1)
    const goi: string[] = []
    L.veDaGiac({ moveTo: () => goi.push('M'), quadraticCurveTo: () => goi.push('Q'), closePath: () => goi.push('Z') }, cham)
    expect(goi.join('')).toBe('M' + 'Q'.repeat(14) + 'Z')
  })
})

describe('sổ nét: hoàn tác · làm lại · xoá hết · tẩy theo nét · trang theo đợt', () => {
  const so3 = () => {
    const so = L.taoSo({ taoId: (d) => 'n' + d })
    for (let k = 0; k < 3; k++) { so.batDau({ mau: 'rgb(244,239,228)', co: 2.3, diem: [0.1, 0.2 + k * 0.2, 0.4, 0] }); so.themDiem([[0.5, 0.2 + k * 0.2, 0.4, 100], [0.9, 0.2 + k * 0.2, 0.4, 200]]); so.ketThuc() }
    return so
  }
  const ids = (so: ReturnType<typeof so3>) => so.ds().map((n) => n.id).join(',')
  it('hoàn tác gỡ nét mới nhất, làm lại trả về đúng chỗ; viết nét mới thì hết làm lại', () => {
    const so = so3()
    expect(ids(so)).toBe('n1,n2,n3'); expect(so.coLui()).toBe(true); expect(so.coToi()).toBe(false)
    expect(so.hoanTac()).toBe(true); expect(ids(so)).toBe('n1,n2'); expect(so.coToi()).toBe(true)
    expect(so.hoanTac()).toBe(true); expect(ids(so)).toBe('n1')
    expect(so.lamLai()).toBe(true); expect(ids(so)).toBe('n1,n2')
    so.batDau({ mau: 'rgb(255,210,122)', co: 3.4, diem: [0.3, 0.3, 0.5, 0] }); so.ketThuc()
    expect(so.coToi()).toBe(false); expect(so.lamLai()).toBe(false); expect(ids(so)).toBe('n1,n2,n4')
  })
  it('tẩy theo nét: chạm nét nào xoá nét đó; cả lượt kéo tẩy là MỘT bước hoàn tác, nét về đúng thứ tự cũ', () => {
    const so = so3()
    expect(L.timCham(so.ds(), 0.5, 0.4, 15, KH)).toEqual(['n2'])
    expect(L.timCham(so.ds(), 0.5, 0.4 + 14 / 1080, 15, KH)).toEqual(['n2'])
    expect(L.timCham(so.ds(), 0.5, 0.4 + 30 / 1080, 15, KH)).toEqual([])
    expect(L.timCham(so.ds(), 0.95, 0.4, 15, KH)).toEqual([])
    so.xoa(['n2'], true); so.xoa(['n1'], true); so.dongGop()
    expect(ids(so)).toBe('n3')
    so.hoanTac(); expect(ids(so)).toBe('n1,n2,n3')
    so.lamLai(); expect(ids(so)).toBe('n3')
    so.hoanTac(); so.xoa(['n3'], true); so.dongGop(); so.xoa(['n1'], true); so.dongGop()
    so.hoanTac(); expect(ids(so)).toBe('n1,n2'); so.hoanTac(); expect(ids(so)).toBe('n1,n2,n3')
  })
  it('xoá hết hoàn tác được (không cần hỏi lại)', () => {
    const so = so3()
    expect(so.xoaHet()).toBe(3); expect(so.ds()).toHaveLength(0)
    so.hoanTac(); expect(ids(so)).toBe('n1,n2,n3')
  })
  it('nét giữ theo từng đợt: sang đợt khác bảng sạch, quay lại vẫn còn; hoàn tác riêng từng đợt', () => {
    const so = so3()
    so.doiTrang('1'); expect(so.ds()).toHaveLength(0); expect(so.coLui()).toBe(false)
    so.batDau({ mau: 'rgb(244,239,228)', co: 2.3, diem: [0.5, 0.5, 0.4, 0] }); so.ketThuc()
    so.doiTrang(''); expect(ids(so)).toBe('n1,n2,n3'); expect(so.coLui()).toBe(true)
    so.doiTrang('1'); expect(ids(so)).toBe('n4')
  })
  it('bỏ nét đang viết (chạm tay bị huỷ) ⇒ không vào sổ, không vào hoàn tác', () => {
    const so = so3()
    so.batDau({ mau: 'rgb(244,239,228)', co: 2.3, diem: [0.5, 0.5, 0.4, 0] }); so.ketThuc(true)
    expect(ids(so)).toBe('n1,n2,n3'); so.hoanTac(); expect(ids(so)).toBe('n1,n2')
  })
})

describe('xuất / nhập + sự kiện cho việc phát live', () => {
  it('xuất ra JSON gọn rồi nhập lại ⇒ y nguyên; mỗi điểm < 30 byte', () => {
    const so = L.taoSo({ taoId: (d) => 'n' + d })
    so.datTiLe(1920 / 1080)
    const n = net(300, (i) => [200 + i * 3.37, 300 + Math.sin(i / 11) * 143.21], 0.37)
    so.batDau({ mau: n.mau, co: n.co, diem: n.diem[0] }); so.themDiem(n.diem.slice(1)); so.ketThuc()
    const goi = so.xuat(), chu = JSON.stringify(goi)
    expect(goi.v).toBe(1); expect(goi.tiLe).toBeCloseTo(1.7778, 4)
    expect(Object.keys(goi.net[0]).sort()).toEqual(['co', 'cong', 'diem', 'id', 'mau'])
    expect(chu.length / 300).toBeLessThan(30)
    const so2 = L.taoSo()
    expect(so2.nhap(JSON.parse(chu))).toBe(1)
    expect(so2.xuat().net).toEqual(goi.net)
  })
  it('nhập dữ liệu lạ: bỏ nét hỏng, kẹp toạ độ, màu không phải rgb() thì về phấn trắng', () => {
    const so = L.taoSo()
    const vao = [{ id: 'a', cong: 'but', mau: 'url(x)', co: 99, diem: [[2, -1, 5, 3.6], [0.5, 'x', 0.4, 0]] }, { id: 'b', diem: [] }, null, { id: 'c', cong: 'tay', mau: 'rgb(1, 2, 3)', co: 2, diem: [[0.25, 0.75, 0.5, 0]] }]
    expect(so.nhap(vao as unknown as NetBut[])).toBe(2)
    expect(so.xuat().net).toEqual([{ id: 'a', cong: 'but', mau: 'rgb(244,239,228)', co: 16, diem: [[1, 0, 1, 4]] }, { id: 'c', cong: 'tay', mau: 'rgb(1, 2, 3)', co: 2, diem: [[0.25, 0.75, 0.5, 0]] }])
  })
  it('sự kiện net-moi / them-diem / net-xong / xoa / trang — máy nhận áp lần lượt thì ra đúng mảng nét của máy phát', () => {
    const so = L.taoSo({ taoId: (d) => 'n' + d }), sk: SuKienBut[] = []
    const huy = so.nghe((x) => sk.push(JSON.parse(JSON.stringify(x))))
    const nhan: NetBut[] = []
    const kiem = () => { let ds = nhan; for (const x of sk.splice(0)) ds = L.apSuKien(ds, x); expect(ds).toEqual(so.xuat().net) }
    const viet = (y: number) => { so.batDau({ mau: 'rgb(244,239,228)', co: 2.3, diem: [0.1, y, 0.3, 0] }); so.themDiem([[0.2, y, 0.4, 5], [0.3, y, 0.5, 10]]); so.themDiem([[0.4, y, 0.4, 15]]); so.ketThuc() }
    viet(0.2); viet(0.4); viet(0.6)
    expect(sk.map((x) => x.loai).slice(0, 4)).toEqual(['net-moi', 'them-diem', 'them-diem', 'net-xong'])
    expect(sk.every((x) => x.trang === '')).toBe(true)
    kiem()
    so.xoa(['n2'], true); so.dongGop(); kiem()
    so.hoanTac(); kiem()
    so.hoanTac(); kiem()
    so.lamLai(); so.xoaHet(); kiem()
    so.hoanTac(); kiem()
    so.batDau({ mau: 'rgb(244,239,228)', co: 2.3, diem: [0.5, 0.5, 0.3, 0] }); so.themDiem([[0.6, 0.5, 0.3, 5]]); so.ketThuc(true); kiem()
    so.doiTrang('7'); expect(sk[sk.length - 1]).toMatchObject({ loai: 'trang', trang: '7', net: [] }); kiem()
    viet(0.5); so.doiTrang(''); kiem()
    so.tro(0.123456, 2); expect(sk.pop()).toEqual({ loai: 'tro', trang: '', x: 0.1235, y: 2 }); kiem() // y > 1: con trỏ trên bảng đã cuộn (11/11)
    so.tro(7, -3); expect(sk.pop()).toEqual({ loai: 'tro', trang: '', x: 1, y: 0 })
    huy(); viet(0.8); so.tro(0.5, 0.5); expect(sk).toHaveLength(0)
  })
})

// ───────────────────────── gắn vào tờ chiếu (JSDOM) ─────────────────────────
const cau = (id: string) => ({ phan: 'I', id, maDe: '', chuyenDe: 'x', dang: 'x', sao: 1, mucDo: '', text: 'Đề bài.', luaChon: ['Một', 'Hai', 'Ba', 'Bốn'], dapAn: 'B', chot: 'Cốt lõi.', lyDo: [], buoc: [] }) as unknown as OBang['cau']
const o = (sbd: string, hoTen: string): OBang => ({ sbd, hoTen, qid: `DE-I-${sbd}`, soCau: 3, sao: 1, cau: cau(`DE-I-${sbd}`), bacUoc: 2, lop: '12A1', lanLenBang: 1 } as OBang)
type ApiBut = { xuat(): { net: NetBut[] }; nhap(g: unknown): number; nghe(f: (s: SuKienBut) => void): () => void; hoanTac(): void; lamLai(): void; xoaHet(): void; bat(b: boolean): void; trang(): string; loi: typeof L; mau: [string, string][]; co: [number, string, string][]; vung(): Record<string, number[]>; doBut(b?: boolean): Record<string, number | string | boolean>; veNgay(b?: boolean): boolean }
function moTo() {
  const dom = new JSDOM(taoHtmlMayChieu([o('A', 'An'), o('B', 'Bình')]), {
    runScripts: 'dangerously', virtualConsole: new VirtualConsole(),
    beforeParse(w) {
      w.setTimeout = (() => 0) as never; w.setInterval = (() => 0) as never
      w.HTMLElement.prototype.scrollTo = () => {}
      ;(w as unknown as { matchMedia: unknown }).matchMedia = () => ({ matches: true })
    },
  })
  const doc = dom.window.document
  const phim = (key: string, them: KeyboardEventInit = {}) => { const e = new dom.window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...them }); doc.dispatchEvent(e); return e }
  const but = (dom.window as unknown as { __mcBut: ApiBut }).__mcBut
  const cv = doc.querySelector<HTMLCanvasElement>('canvas.mc-but-song')!
  /** Một sự kiện con trỏ giả (JSDOM không có PointerEvent đủ trường). */
  const tro = (loai: string, x: number, y: number, them: Record<string, unknown> = {}) => { const e = new dom.window.MouseEvent(loai, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, buttons: 1 }); for (const [k, v] of Object.entries({ pointerId: 1, pointerType: 'mouse', pressure: 0.5, ...them })) Object.defineProperty(e, k, { value: v }); cv.dispatchEvent(e); return e }
  return { dom, doc, phim, but, cv, tro, w: dom.window as unknown as { __mcLenh(k: string): void; __mcChiSo(): number } }
}
const netMau: NetBut = { id: 'x1', cong: 'but', mau: 'rgb(255,210,122)', co: 2.3, diem: [[0.7, 0.3, 0.3, 0], [0.75, 0.32, 0.5, 40], [0.8, 0.3, 0.3, 80]] as DiemBut[] }

describe('bút trên tờ chiếu', () => {
  // 11/11 (thầy: «màn live của thầy hiện bảng đen xì ko hiện đề», máy em bình thường): lớp hiện mực phủ CẢ TỜ không được xin `desynchronized` —
  // trên card đồ hoạ thật lớp ấy có thể thành lớp phủ đặc, nền đen che giấy đề. Khoá: không canvas nào của bút xin chế độ đó.
  it('không canvas nào của bút xin vẽ thẳng lên màn (desynchronized) — tránh nền đen che đề trên máy thầy', () => {
    expect(JS_BUT_BANG).not.toMatch(/nguCanh\(\s*cv[A-Za-z]*\s*,\s*true\s*\)/)
    expect(JS_BUT_BANG).toContain('nguCanh(cvT, false)')
  })
  it('B bật bút: hai canvas trên tờ (lớp hiện mực + lớp bắt con trỏ; 11/11 lớp đã chốt và ô nháp nằm ngoài màn), thanh bút có 5 màu · 4 cỡ · tẩy · hoàn tác · làm lại · xoá hết · tắt; mặc định phấn trắng, nét MẢNH (chữ nhỏ không bị nét to át chữ)', () => {
    const t = moTo()
    expect(t.doc.querySelectorAll('canvas.mc-but')).toHaveLength(2)
    t.phim('b')
    expect(t.doc.body.classList.contains('mc-co-but')).toBe(true)
    const thanh = t.doc.querySelector('.mc-but-cu')!
    expect(thanh.getAttribute('role')).toBe('toolbar')
    expect([...thanh.querySelectorAll('.mc-m')].map((b) => b.getAttribute('aria-label'))).toEqual(['Phấn trắng', 'Phấn vàng', 'Phấn xanh ngọc', 'Phấn hồng', 'Mực xanh (viết lên giấy đề)'])
    expect(thanh.querySelector('.mc-m.mc-chon')!.getAttribute('aria-label')).toBe('Phấn trắng')
    expect([...thanh.querySelectorAll('.mc-bc')].map((b) => b.getAttribute('aria-label'))).toEqual(['Nét rất mảnh', 'Nét mảnh', 'Nét vừa', 'Nét đậm'])
    expect(thanh.querySelector('.mc-bc.mc-chon')!.getAttribute('aria-label')).toBe('Nét mảnh')
    expect(t.doc.querySelector('.mc-but-do')).toBeNull() // ô đo bút chỉ có khi bấm Alt + B
    for (const s of ['[data-tay]', '[data-lui]', '[data-toi]', '[data-xoa]', '[data-tat]']) expect(thanh.querySelector(s), s).not.toBeNull()
    expect(thanh.querySelectorAll('button:not([aria-label])')).toHaveLength(0)
    expect(thanh.querySelector<HTMLButtonElement>('[data-lui]')!.disabled).toBe(true)
    thanh.querySelector<HTMLButtonElement>('[data-tat]')!.click()
    expect(t.doc.body.classList.contains('mc-co-but')).toBe(false)
  })
  it('viết một nét bằng con trỏ ⇒ nét vectơ chuẩn hoá đúng màu / cỡ đang chọn; Ctrl+Z hoàn tác, Ctrl+Y làm lại; phát đủ sự kiện', () => {
    const t = moTo(), sk: string[] = []
    t.phim('b'); t.but.nghe((x) => sk.push(x.loai))
    t.doc.querySelector<HTMLButtonElement>('.mc-m[aria-label="Phấn vàng"]')!.click()
    t.doc.querySelector<HTMLButtonElement>('.mc-bc[aria-label="Nét đậm"]')!.click()
    const W = t.dom.window.innerWidth, H = t.dom.window.innerHeight
    t.tro('pointerdown', 100, 100); t.tro('pointermove', 140, 110); t.tro('pointermove', 180, 100); t.tro('pointerup', 200, 100, { buttons: 0 })
    const g = t.but.xuat()
    expect(g.net).toHaveLength(1)
    expect(g.net[0]).toMatchObject({ cong: 'but', mau: 'rgb(255,210,122)', co: 3.4 })
    expect(g.net[0].diem.map((d) => [d[0], d[1]])).toEqual([[100, 100], [140, 110], [180, 100], [200, 100]].map(([x, y]) => [Math.round((x / W) * 1e5) / 1e5, Math.round((y / H) * 1e5) / 1e5]))
    expect(sk).toEqual(['net-moi', 'them-diem', 'net-xong'])
    expect(t.doc.querySelector<HTMLButtonElement>('[data-lui]')!.disabled).toBe(false)
    expect(t.phim('z', { ctrlKey: true }).defaultPrevented).toBe(true)
    expect(t.but.xuat().net).toHaveLength(0)
    t.phim('y', { ctrlKey: true }); expect(t.but.xuat().net).toHaveLength(1)
    t.phim('z', { ctrlKey: true }); t.phim('Z', { ctrlKey: true, shiftKey: true }); expect(t.but.xuat().net).toHaveLength(1)
  })
  it('chặn chạm tay: đang có nét bút (hoặc bút vừa ở gần bảng) thì chạm bị bỏ qua', () => {
    const t = moTo()
    t.phim('b')
    t.tro('pointerdown', 100, 100, { pointerType: 'pen', pressure: 0.3, timeStamp: 1000 })
    t.tro('pointerdown', 300, 300, { pointerId: 2, pointerType: 'touch' })
    t.tro('pointermove', 320, 320, { pointerId: 2, pointerType: 'touch' })
    t.tro('pointerup', 320, 320, { pointerId: 2, pointerType: 'touch' })
    t.tro('pointermove', 150, 120, { pointerType: 'pen', pressure: 0.6 })
    t.tro('pointerup', 150, 120, { pointerType: 'pen', pressure: 0 })
    const n = t.but.xuat().net
    expect(n).toHaveLength(1)
    expect(n[0].diem.map((d) => d[2])).toEqual([0.3, 0.6])
  })
  it('E đổi bút ↔ tẩy; tẩy kéo qua nét nào xoá nét đó, hoàn tác trả lại', () => {
    const t = moTo()
    t.phim('b'); t.but.nhap({ net: [netMau] })
    expect(t.but.xuat().net).toHaveLength(1)
    t.phim('e')
    expect(t.doc.querySelector('[data-tay]')!.classList.contains('mc-chon')).toBe(true)
    const W = t.dom.window.innerWidth, H = t.dom.window.innerHeight
    t.tro('pointerdown', 0.75 * W, 0.2 * H); t.tro('pointermove', 0.75 * W, 0.4 * H); t.tro('pointerup', 0.75 * W, 0.4 * H)
    expect(t.but.xuat().net).toHaveLength(0)
    t.phim('z', { ctrlKey: true }); expect(t.but.xuat().net).toEqual([netMau])
    t.phim('e'); expect(t.doc.querySelector('[data-tay]')!.classList.contains('mc-chon')).toBe(false)
  })
  it('nét giữ theo đợt: sang đợt sau bảng sạch, quay lại vẫn còn; xoá hết rồi hoàn tác được', () => {
    const t = moTo()
    t.phim('b'); t.but.nhap({ net: [netMau] })
    t.phim('ArrowRight')
    expect(t.w.__mcChiSo()).toBe(1); expect(t.but.trang()).toBe('1'); expect(t.but.xuat().net).toHaveLength(0)
    t.phim('ArrowLeft')
    expect(t.but.trang()).toBe('0'); expect(t.but.xuat().net).toEqual([netMau])
    t.doc.querySelector<HTMLButtonElement>('[data-xoa]')!.click(); expect(t.but.xuat().net).toHaveLength(0)
    t.doc.querySelector<HTMLButtonElement>('[data-lui]')!.click(); expect(t.but.xuat().net).toHaveLength(1)
  })
  it('API cho việc live: bộ máy dựng nét, bảng màu / cỡ, vùng giấy / bảng; bút lơ lửng phát sự kiện tro (mỗi khung một lần, cách nhau > 15 ms)', () => {
    const t = moTo(), sk: SuKienBut[] = []
    expect(t.but.loi.dungNet(netMau, t.but.loi.khung(1920, 1080)).length).toBeGreaterThan(20)
    expect(t.but.mau.map((m) => m[0])).toEqual(['rgb(244,239,228)', 'rgb(255,210,122)', 'rgb(110,231,183)', 'rgb(253,164,175)', 'rgb(36,86,201)'])
    expect(t.but.co.map((c) => c[0])).toEqual([1.2, 1.7, 2.3, 3.4])
    expect(typeof t.but.vung()).toBe('object')
    t.but.nghe((x) => sk.push(x))
    t.tro('pointermove', 100, 100, { pointerType: 'pen', buttons: 0, timeStamp: 5000 })
    expect(sk).toHaveLength(0) // bút tắt: không phát
    t.phim('b')
    t.tro('pointermove', 512, 384, { pointerType: 'pen', buttons: 0, timeStamp: 6000 })
    t.tro('pointermove', 520, 390, { pointerType: 'pen', buttons: 0, timeStamp: 6010 })
    t.tro('pointermove', 530, 400, { pointerType: 'pen', buttons: 0, timeStamp: 6060 })
    expect(sk.map((x) => x.loai)).toEqual(['tro', 'tro'])
    expect(sk[0]).toMatchObject({ x: Math.round((512 / t.dom.window.innerWidth) * 1e4) / 1e4, y: Math.round((384 / t.dom.window.innerHeight) * 1e4) / 1e4 })
  })
  it('CẮT NÉT khi máy không báo nhấc bút (thầy 11/11: chữ dính nhau): mẫu bút lướt `buttons 0` ⇒ nét dừng ở mẫu chạm cuối; bút chạm lại không cần pointerdown ⇒ nét MỚI', () => {
    const t = moTo(), W = t.dom.window.innerWidth
    t.phim('b')
    const but = (x: number, y: number, pressure: number, buttons: number, ts: number) => t.tro('pointermove', x, y, { pointerType: 'pen', pressure, buttons, timeStamp: ts })
    t.tro('pointerdown', 100, 100, { pointerType: 'pen', pressure: 0.3, timeStamp: 1000 })
    but(120, 100, 0.4, 1, 1008); but(140, 100, 0.4, 1, 1016)
    // nhấc bút: không có pointerup, chỉ có các mẫu lướt trên không
    but(160, 80, 0, 0, 1024); but(200, 60, 0, 0, 1032); but(240, 80, 0, 0, 1040)
    expect(t.but.xuat().net).toHaveLength(1) // nét 1 đã đóng ngay ở mẫu lướt đầu tiên
    // chạm lại: không có pointerdown
    but(260, 100, 0.3, 1, 1048); but(280, 100, 0.5, 1, 1056)
    t.tro('pointerup', 280, 100, { pointerType: 'pen', pressure: 0, buttons: 0, timeStamp: 1064 })
    const n = t.but.xuat().net
    expect(n).toHaveLength(2)
    expect(n[0].diem.map((d) => Math.round(d[0] * W))).toEqual([100, 120, 140])
    expect(n[1].diem.map((d) => Math.round(d[0] * W))).toEqual([260, 280])
    expect(t.but.doBut().nhacIm).toBe(0) // ô đo tắt thì không đếm
  })
  it('bút có lực mà lực về 0 trong khi nút còn: MỘT mẫu lẻ thì bỏ qua (không vỡ nét), HAI mẫu liền thì cắt; chuột hết nút trái cũng cắt', () => {
    const t = moTo(), W = t.dom.window.innerWidth
    t.phim('b')
    const but = (x: number, pressure: number) => t.tro('pointermove', x, 100, { pointerType: 'pen', pressure, buttons: 1 })
    t.tro('pointerdown', 100, 100, { pointerType: 'pen', pressure: 0.3 })
    but(120, 0.4); but(130, 0); but(140, 0.4)
    expect(t.but.xuat().net).toHaveLength(0) // còn đang viết: mẫu lực 0 lẻ không cắt nét
    but(150, 0); but(160, 0)
    expect(t.but.xuat().net).toHaveLength(1)
    expect(t.but.xuat().net[0].diem.map((d) => Math.round(d[0] * W))).toEqual([100, 120, 140])
    t.tro('pointerup', 160, 100, { pointerType: 'pen', pressure: 0, buttons: 0 })
    expect(t.but.xuat().net).toHaveLength(1)
    // chuột (bút chạy như chuột): mẫu không còn nút trái ⇒ cắt, mẫu đó không vào nét
    t.tro('pointerdown', 300, 300); t.tro('pointermove', 320, 300); t.tro('pointermove', 400, 300, { buttons: 0 })
    expect(t.but.xuat().net).toHaveLength(2)
    expect(t.but.xuat().net[1].diem.map((d) => Math.round(d[0] * W))).toEqual([300, 320])
  })
  it('nút thân bút Wacom: đang viết mà lỡ bấm (máy báo nút phải) thì nét KHÔNG đứt; bấm lúc bút lơ lửng (không lực) thì không sinh nét', () => {
    const t = moTo(), W = t.dom.window.innerWidth
    t.phim('b')
    t.tro('pointerdown', 100, 100, { pointerType: 'pen', pressure: 0.3 })
    t.tro('pointermove', 120, 100, { pointerType: 'pen', pressure: 0.4 })
    t.tro('pointermove', 140, 100, { pointerType: 'pen', pressure: 0.4, buttons: 2 })
    t.tro('pointermove', 160, 100, { pointerType: 'pen', pressure: 0.4, buttons: 3 })
    t.tro('pointerup', 160, 100, { pointerType: 'pen', pressure: 0, buttons: 0 })
    expect(t.but.xuat().net.map((n) => n.diem.map((d) => Math.round(d[0] * W)))).toEqual([[100, 120, 140, 160]])
    t.tro('pointerdown', 300, 300, { pointerType: 'pen', pressure: 0, button: 2, buttons: 2 })
    t.tro('pointermove', 320, 300, { pointerType: 'pen', pressure: 0, buttons: 2 })
    t.tro('pointerup', 320, 300, { pointerType: 'pen', pressure: 0, buttons: 0 })
    expect(t.but.xuat().net).toHaveLength(1)
  })
  it('mất quyền giữ con trỏ / con trỏ rời bảng / cửa sổ mất tiêu điểm / chạm lại khi nét trước chưa đóng ⇒ đóng nét, nét đã viết vẫn còn', () => {
    const t = moTo()
    t.phim('b')
    const viet = (x: number) => { t.tro('pointerdown', x, 100); t.tro('pointermove', x + 20, 110) }
    viet(100); t.tro('lostpointercapture', 120, 110)
    expect(t.but.xuat().net).toHaveLength(1)
    t.tro('pointermove', 400, 400, { buttons: 0 }) // sau đó chỉ là con trỏ lơ lửng
    expect(t.but.xuat().net[0].diem).toHaveLength(2)
    viet(200); t.tro('pointerleave', 220, 110)
    expect(t.but.xuat().net).toHaveLength(2)
    viet(300); t.dom.window.dispatchEvent(new t.dom.window.Event('blur'))
    expect(t.but.xuat().net).toHaveLength(3)
    // cửa sổ có lại, bút vẫn đang chạm ⇒ mẫu kế mở nét mới (không cần pointerdown)
    t.tro('pointermove', 340, 120); t.tro('pointermove', 360, 120); t.tro('pointerup', 360, 120, { buttons: 0 })
    expect(t.but.xuat().net).toHaveLength(4)
    viet(500); viet(600); t.tro('pointerup', 620, 110, { buttons: 0 })
    expect(t.but.xuat().net).toHaveLength(6)
  })
  it('ấn bút tại chỗ, lực mạnh dần (dấu chấm): ghi thêm lực ở đúng chỗ cũ ⇒ chấm đủ đậm; pointerrawupdate không bao giờ ghi vào nét', () => {
    const t = moTo(), W = t.dom.window.innerWidth
    t.phim('b')
    t.but.veNgay(true)
    t.tro('pointerdown', 100, 100, { pointerType: 'pen', pressure: 0.1 })
    for (const pressure of [0.15, 0.3, 0.45, 0.6]) t.tro('pointermove', 100, 100, { pointerType: 'pen', pressure })
    for (const x of [300, 500, 700]) t.tro('pointerrawupdate', x, 400, { pointerType: 'pen', pressure: 0.5 })
    t.tro('pointerup', 100, 100, { pointerType: 'pen', pressure: 0, buttons: 0 })
    const n = t.but.xuat().net
    expect(n).toHaveLength(1)
    expect(n[0].diem.every((d) => Math.round(d[0] * W) === 100)).toBe(true)
    expect(Math.max(...n[0].diem.map((d) => d[2]))).toBe(0.6)
    const kh = t.but.loi.khung(1920, 1080)
    expect(t.but.loi.dungNet(n[0], kh).length).toBe(28)
  })
  it('Alt + B: ô ĐO BÚT (bật luôn bút) — chữ tiếng Việt, không mã nội bộ; có thiết bị · số mẫu mỗi giây · lực · mẫu gộp · thời gian xử lý; Alt + B lần nữa thì tắt', () => {
    const t = moTo()
    expect(t.phim('b', { altKey: true }).defaultPrevented).toBe(true)
    expect(t.doc.body.classList.contains('mc-co-but')).toBe(true)
    const o = t.doc.querySelector<HTMLElement>('.mc-but-do')!
    expect(o.hidden).toBe(false)
    expect(o.textContent).toMatch(/Đo bút — viết vài chữ rồi chụp ô này gửi lại/)
    expect(o.textContent).toMatch(/Thiết bị\s*chưa viết/)
    t.tro('pointerdown', 100, 100, { pointerType: 'pen', pressure: 0.2, timeStamp: 2000 })
    for (let i = 1; i <= 20; i++) t.tro('pointermove', 100 + i * 4, 100, { pointerType: 'pen', pressure: 0.2 + i * 0.03, timeStamp: 2000 + i * 5 })
    t.tro('pointerup', 180, 100, { pointerType: 'pen', pressure: 0, buttons: 0, timeStamp: 2105 })
    const d = t.but.doBut()
    expect(d).toMatchObject({ bat: true, net: 1, thietBi: 'pen', coLuc: true, mauMoiGiay: 200, nhacIm: 0 })
    expect(d.lucNho).toBeCloseTo(0.23, 6); expect(d.lucLon).toBeCloseTo(0.8, 6); expect(d.mauGop).toBe(1)
    const chu = o.textContent!
    for (const nhan of ['Thiết bị', 'Bút có lực', 'Số mẫu mỗi giây', '200', 'Lực nhỏ nhất – lớn nhất', '0,23 – 0,8', 'Mẫu gộp mỗi lần báo', 'Trình duyệt đưa từng mẫu ngay', 'Vẽ thẳng lên màn', 'Xử lý mỗi mẫu', 'Xử lý mỗi khung hình', 'Mẫu trùng giờ', 'Nhấc bút mà máy không báo', 'Màn']) expect(chu, nhan).toContain(nhan)
    expect(chu).not.toMatch(/pointer|raw|desync|coalesc|\bHz\b|undefined|NaN/i)
    // chuột: ô nói rõ bút đang chạy như chuột
    t.tro('pointerdown', 300, 300); t.tro('pointermove', 330, 300); t.tro('pointerup', 330, 300, { buttons: 0 })
    expect(o.textContent).toMatch(/Chuột \(bút đang chạy như chuột, không có lực\)/)
    t.phim('b', { altKey: true })
    expect(o.hidden).toBe(true); expect(t.but.doBut().bat).toBe(false)
    expect(t.doc.body.classList.contains('mc-co-but')).toBe(true) // tắt ô đo không tắt bút
    t.phim('b', { altKey: true }); t.phim('b'); expect(o.hidden).toBe(true) // tắt bút thì ô đo tắt theo
  })
  it('bút TẮT: không cướp phím nào — Ctrl+Z, E không làm gì; L / G / ← → / Esc vẫn là của tờ; bảng phím có dòng bút', () => {
    const t = moTo()
    t.but.nhap({ net: [netMau] })
    expect(t.phim('z', { ctrlKey: true }).defaultPrevented).toBe(false)
    expect(t.but.xuat().net).toHaveLength(1)
    t.phim('e'); expect(t.doc.querySelector('[data-tay]')!.classList.contains('mc-chon')).toBe(false)
    t.tro('pointerdown', 100, 100); t.tro('pointermove', 200, 200); t.tro('pointerup', 200, 200)
    expect(t.but.xuat().net).toHaveLength(1)
    t.phim('ArrowRight'); expect(t.w.__mcChiSo()).toBe(1)
    t.phim('?')
    expect(t.doc.querySelector('.mc-phim')!.textContent).toMatch(/Bút viết bảng.*hoàn tác \/ làm lại.*ô đo bút/)
  })
})
