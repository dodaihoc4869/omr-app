// BÚT VIẾT BẢNG (thầy 10/11: «chỉnh phần bút viết cho mượt mà … viết bằng bút wacom lên phần bảng đen, nét bút mảnh vừa phải siêu đẹp»).
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
/** Bề rộng đa giác bao tại hoành độ x của một nét nằm ngang. */
const beRongTai = (p: number[], x: number, sai = 3) => { const ys: number[] = []; for (let i = 0; i < p.length; i += 2) if (Math.abs(p[i] - x) < sai) ys.push(p[i + 1]); return Math.max(...ys) - Math.min(...ys) }
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
  it('điểm = [x 0..1, y 0..1, lực 0..1, ms]: gọn 5 số lẻ, kẹp trong vùng', () => {
    expect(L.diem(960, 540, 0.4567, 12.6, 1920, 1080)).toEqual([0.5, 0.5, 0.46, 13])
    expect(L.diem(-30, 5000, 2, -4, 1920, 1080)).toEqual([0, 1, 1, 0])
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

describe('làm mượt', () => {
  it('nét run tay (nhiễu ±1,2 px quanh một đường thẳng, viết chậm) ⇒ đường tâm sau lọc lệch ít hơn hẳn', () => {
    const nhieu = (i: number) => (((i * 7919) % 13) / 6 - 1) * 1.2
    const st = L.moXuLy({ co: 2.3 }, KH), n = net(160, (i) => [300 + i * 0.6, 500 + nhieu(i)])
    L.xuLyThem(st, n.diem, n.diem.length)
    const lechVao = Math.sqrt(n.diem.reduce((s, d) => s + (d[1] * 1080 - 500) ** 2, 0) / n.diem.length)
    const lechRa = Math.sqrt(st.Y.slice(10).reduce((s, y) => s + (y - 500) ** 2, 0) / (st.Y.length - 10))
    expect(lechVao).toBeGreaterThan(0.6)
    expect(lechRa).toBeLessThan(lechVao * 0.45)
  })
  it('viết nhanh (1200 px/s): lọc gần như không trễ — đường tâm bám sát điểm thật ≤ 3 px, và nét LUÔN kết thúc ở đúng điểm cuối', () => {
    const st = L.moXuLy({ co: 2.3 }, KH), n = net(60, (i) => [300 + i * 6, 500])
    L.xuLyThem(st, n.diem, n.diem.length)
    expect(st.px - st.X[st.X.length - 1]).toBeLessThan(3)
    const p = L.vien(st, 0, -1, null, true)
    expect(Math.max(...p.filter((_, i) => i % 2 === 0))).toBeGreaterThan(st.px - 0.01)
  })
  it('xử lý DẦN từng mẻ điểm cho đúng kết quả như xử lý một lần (máy nhận live dựng nét y hệt máy phát)', () => {
    const n = net(200, (i) => [400 + Math.cos(i / 15) * 180 + i, 500 + Math.sin(i / 9) * 120])
    const mot = L.moXuLy(n, KH), dan = L.moXuLy(n, KH)
    L.xuLyThem(mot, n.diem, n.diem.length)
    for (let i = 7; i < n.diem.length; i += 7) L.xuLyThem(dan, n.diem, i)
    L.xuLyThem(dan, n.diem, n.diem.length)
    expect(dan.X).toEqual(mot.X); expect(dan.Y).toEqual(mot.Y); expect(dan.R).toEqual(mot.R)
  })
  it('nét dài: phần đầu in dần xuống lớp tĩnh từng khúc — các khúc + đuôi phủ kín đường tâm, mỗi khung chỉ dựng đoạn đuôi', () => {
    const n = net(600, (i) => [200 + i * 2.5, 500 + Math.sin(i / 20) * 200])
    const st = L.moXuLy(n, KH)
    let dong = 0
    const khuc: number[][] = []
    for (let i = 10; i <= n.diem.length; i += 10) {
      L.xuLyThem(st, n.diem, i)
      const den = L.mocDong(st, dong)
      if (den > 0) { khuc.push(L.vien(st, dong, den, null, false)); dong = den - 2 }
    }
    expect(khuc.length).toBeGreaterThan(3)
    expect(st.X.length - dong).toBeLessThan(140)
    khuc.push(L.vien(st, dong, -1, null, true))
    for (let i = 0; i < st.X.length; i += 3) expect(khuc.some((p) => trongDaGiac(p, st.X[i], st.Y[i])), `điểm tâm ${i}`).toBe(true)
  })
})

describe('bề rộng theo lực + thon hai đầu + đa giác bao', () => {
  it('nét cơ sở 2,3 px ở màn 1920; lực nhẹ → mạnh đổi bề rộng trong khoảng 0,6× … 1,6×', () => {
    expect(L.heSo(0)).toBeCloseTo(0.6, 6); expect(L.heSo(1)).toBeCloseTo(1.6, 6)
    const ngang = (ap: number) => beRongTai(L.dungNet(net(120, (i) => [300 + i * 4, 500], ap), KH), 540)
    const nhe = ngang(0.05), vua = ngang(0.4), manh = ngang(0.95)
    expect(nhe).toBeGreaterThan(2.3 * 0.6); expect(nhe).toBeLessThan(vua); expect(vua).toBeLessThan(manh); expect(manh).toBeLessThan(2.3 * 1.62)
    expect(vua).toBeGreaterThan(2); expect(vua).toBeLessThan(2.9)
  })
  it('đầu nét và cuối nét thon lại; đang viết (chưa nhấc bút) thì cuối nét chưa thon', () => {
    const n = net(120, (i) => [300 + i * 4, 500]), st = L.moXuLy(n, KH)
    L.xuLyThem(st, n.diem, n.diem.length)
    const xong = L.vien(st, 0, -1, null, true), dang = L.vien(st, 0, -1, null, false)
    const giua = beRongTai(xong, 540)
    expect(beRongTai(xong, 301, 1.2)).toBeLessThan(giua * 0.75)
    expect(beRongTai(xong, 773)).toBeLessThan(giua * 0.7)
    expect(beRongTai(dang, 773)).toBeGreaterThan(giua * 0.9)
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
    const st = L.moXuLy(v, KH); L.xuLyThem(st, v.diem, v.diem.length)
    const pv = L.vien(st, 0, -1, null, true)
    expect(pv.every(Number.isFinite)).toBe(true)
    for (let i = 0; i < st.X.length; i++) expect(trongDaGiac(pv, st.X[i], st.Y[i]) || pv.some((_, k) => k % 2 === 0 && Math.hypot(pv[k] - st.X[i], pv[k + 1] - st.Y[i]) < 2.5), `điểm tâm ${i}`).toBe(true)
  })
  it('chấm một cái (một điểm) ⇒ một chấm tròn; tô bằng đường cong bậc hai qua trung điểm rồi đóng kín', () => {
    const cham = L.dungNet(net(1, () => [600, 600]), KH)
    expect(cham.length).toBe(28)
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
    huy(); viet(0.8); expect(sk).toHaveLength(0)
  })
})

// ───────────────────────── gắn vào tờ chiếu (JSDOM) ─────────────────────────
const cau = (id: string) => ({ phan: 'I', id, maDe: '', chuyenDe: 'x', dang: 'x', sao: 1, mucDo: '', text: 'Đề bài.', luaChon: ['Một', 'Hai', 'Ba', 'Bốn'], dapAn: 'B', chot: 'Cốt lõi.', lyDo: [], buoc: [] }) as unknown as OBang['cau']
const o = (sbd: string, hoTen: string): OBang => ({ sbd, hoTen, qid: `DE-I-${sbd}`, soCau: 3, sao: 1, cau: cau(`DE-I-${sbd}`), bacUoc: 2, lop: '12A1', lanLenBang: 1 } as OBang)
type ApiBut = { xuat(): { net: NetBut[] }; nhap(g: unknown): number; nghe(f: (s: SuKienBut) => void): () => void; hoanTac(): void; lamLai(): void; xoaHet(): void; bat(b: boolean): void; trang(): string }
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
  it('B bật bút: hai lớp canvas (tĩnh + sống), thanh bút có 5 màu · 3 cỡ · tẩy · hoàn tác · làm lại · xoá hết · tắt; mặc định phấn trắng, nét vừa', () => {
    const t = moTo()
    expect(t.doc.querySelectorAll('canvas.mc-but')).toHaveLength(2)
    t.phim('b')
    expect(t.doc.body.classList.contains('mc-co-but')).toBe(true)
    const thanh = t.doc.querySelector('.mc-but-cu')!
    expect(thanh.getAttribute('role')).toBe('toolbar')
    expect([...thanh.querySelectorAll('.mc-m')].map((b) => b.getAttribute('aria-label'))).toEqual(['Phấn trắng', 'Phấn vàng', 'Phấn xanh ngọc', 'Phấn hồng', 'Mực xanh (viết lên giấy đề)'])
    expect(thanh.querySelector('.mc-m.mc-chon')!.getAttribute('aria-label')).toBe('Phấn trắng')
    expect([...thanh.querySelectorAll('.mc-bc')].map((b) => b.getAttribute('aria-label'))).toEqual(['Nét mảnh', 'Nét vừa', 'Nét đậm'])
    expect(thanh.querySelector('.mc-bc.mc-chon')!.getAttribute('aria-label')).toBe('Nét vừa')
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
    expect(t.doc.querySelector('.mc-phim')!.textContent).toMatch(/Bút viết bảng.*hoàn tác \/ làm lại/)
  })
})
