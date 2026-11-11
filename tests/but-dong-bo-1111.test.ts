// BÚT + ĐỒNG BỘ NÉT TỨC THÌ (thầy 11/11, thử Live trên máy thật):
//   «Nét bút trên máy gv … chữ đang bị nháy chưa mượt như goodnote» · «đang bị giật khựng ở máy hs, phải đồng bộ nét bút tức thì mượt mà cực mượt mà»
//   «thay nút vàng bằng một cái bút nhỏ» · «bảng đen khi live có cuộn vô hạn để viết được nhiều phần»
// Kiểm phần THUẦN: bộ dựng nét (nét ướt = nét khô, nét bảng cuộn), mã hoá mạng (y > 1, tin độ cuộn), tờ chiếu (JSDOM), đệm phát của máy em
// (đồng hồ phát bám đích, vá gói cuối, cây bút, độ cuộn). Số đo điểm ảnh / khung hình thật: scripts/but-bang-1011/do-nhay.mjs, scripts/thu-live-1011/*.
import { describe, expect, it } from 'vitest'
import { JSDOM, VirtualConsole } from 'jsdom'
import { taoLoiBut, type DiemBut, type NetBut, type SuKienBut } from '../src/lib/but-bang-loi'
import { JS_BUT_BANG } from '../src/lib/but-bang-to-chieu'
import { taoHtmlMayChieu, type OBang } from '../src/lib/html-may-chieu'
import { giaiGoi, giaiSo, maGoiDiem, maNetXong, maTro, type GoiDiem } from '../src/lib/live/ma-net'
import { taoDemPhat } from '../src/lib/live/noi-suy'

const L = taoLoiBut(), KH = L.khung(1920, 1080), MAU = 'rgb(244,239,228)'
const DAU = { id: 'n1', cong: 'but' as const, mau: MAU, co: 1.7 }
/** Nét mẫu lượn sóng n điểm, 5 ms một điểm. */
const netSong = (n: number, id = 'n', y0 = 500): NetBut => ({ id, cong: 'but', mau: MAU, co: 1.7, diem: Array.from({ length: n }, (_, i) => L.diem(300 + i * 3.4, y0 + Math.sin(i / 6) * 22, 0.3 + (i % 7) / 20, i * 5, 1920, 1080)) })

describe('máy thầy: nét «ướt» = nét «khô» (không nháy lúc nhấc bút)', () => {
  it('đuôi nét đang viết vẽ đúng dáng nét xong ⇒ lúc đủ điểm, đa giác đang viết TRÙNG TỪNG SỐ với đa giác vẽ lại từ vectơ', () => {
    const n = netSong(90), st = L.moXuLy(n, KH)
    // xử lý dần từng mẻ như lúc viết
    for (let den = 3; den < n.diem.length; den += 4) L.xuLyThem(st, n.diem, den)
    L.xuLyThem(st, n.diem, n.diem.length)
    expect(L.vien(st, 0, -1, null, true)).toEqual(L.dungNet(n, KH))
  })
  it('đầu bút thật chưa thành mẫu (làm tròn như một mẫu) rồi thành mẫu chốt lúc nhấc bút ⇒ cùng một đa giác', () => {
    const n = netSong(40), cuoi = L.diem(300 + 40 * 3.4 + 0.31, 500.4, 0, 0, 1920, 1080)
    const st = L.moXuLy(n, KH)
    L.xuLyThem(st, n.diem, n.diem.length)
    const uot = L.vien(st, 0, -1, [[cuoi[0] * KH.rw, cuoi[1] * KH.rh]], true)
    const kho: NetBut = { ...n, diem: [...n.diem, [cuoi[0], cuoi[1], n.diem[n.diem.length - 1][2], 200] as DiemBut] }
    expect(uot).toEqual(L.dungNet(kho, KH))
  })
  it('ngưỡng in dần: máy thầy 160 điểm ⇒ chữ viết thường (≤ ~134 điểm) không bao giờ bị cắt khúc; mặc định vẫn 64', () => {
    const n = netSong(96), st = L.moXuLy(n, KH)
    L.xuLyThem(st, n.diem, n.diem.length)
    expect(st.X.length).toBeGreaterThan(90)
    expect(st.X.length).toBeLessThan(165)
    expect(L.mocDong(st, 0)).toBeGreaterThan(0)
    expect(L.mocDong(st, 0, 160)).toBe(-1)
  })
  it('tờ chiếu: bỏ hẳn đoạn dự đoán; một lớp hiện + lớp đã chốt và ô nháp ngoài màn; nhấc bút chép ô nháp vào lớp đã chốt', () => {
    expect(JS_BUT_BANG).not.toContain('getPredictedEvents')
    expect(JS_BUT_BANG).toContain('getCoalescedEvents')
    expect(JS_BUT_BANG).toContain("globalCompositeOperation = 'copy'")
    expect(JS_BUT_BANG).toContain('if (UO) chep(gC, cvS, UO[0], UO[1], UO[2], UO[3]);')
    expect(JS_BUT_BANG).toContain('LoiBut.mocDong(st, n.dong, 160)')
    // đuôi luôn vẽ với cờ «xong» (thon cuối)
    expect(JS_BUT_BANG).toContain('hienDuoi(LoiBut.vien(st, n.dong, -1, them, true)')
  })
})

describe('bảng đen cuộn: nét bảng mang y = y màn + độ cuộn (không thêm loại khung nào)', () => {
  it('nét bắt đầu trên bảng ⇒ mã «b_…»; y vượt 1 giữ nguyên qua xuất / nhập và hộp bao', () => {
    const so = L.taoSo({ taoId: (d) => 'n' + d })
    so.batDau({ mau: MAU, co: 1.7, diem: [0.7, 0.9, 0.4, 0], bang: true })
    so.themDiem([[0.72, 1.4, 0.5, 20], [0.74, 2.25, 0.5, 40]])
    const net = so.ketThuc()!
    expect(net.id).toBe('b_n1')
    expect(L.laBang(net)).toBe(true)
    expect(L.laBang({ id: 'n7' })).toBe(false)
    expect(L.laBang({ id: 'b' })).toBe(false)
    const so2 = L.taoSo()
    so2.nhap(so.xuat())
    expect(so2.xuat().net[0].diem.map((d) => d[1])).toEqual([0.9, 1.4, 2.25])
    expect(L.hop(net)).toEqual([0.7, 0.9, 0.74, 2.25])
    // nét thường: mã như cũ
    so.batDau({ mau: MAU, co: 1.7, diem: [0.2, 0.3, 0.4, 0] })
    expect(so.ketThuc()!.id).toBe('n2')
  })
  it('mã hoá mạng KHÔNG MẤT với y > 1 (sổ nét, gói điểm đang viết, con trỏ) — khung 0x11 / 0x21 / 0x22 cũ, không đổi định dạng', () => {
    const net: NetBut = { id: 'b_nabc', cong: 'but', mau: MAU, co: 1.7, diem: [[0.70123, 0.91, 0.4, 0], [0.71, 1.23456, 0.52, 15], [0.72, 37.5, 0.6, 31]] }
    const k = maNetXong(net)
    expect(k).toHaveLength(1)
    expect(k[0][0]).toBe(0x11)
    const m = giaiSo(k[0])!
    expect(m.k === 'net' && m.net).toEqual(net)
    const g = giaiGoi(maGoiDiem({ phien: 3, tGui: 1000, dau: net, tGoc: 900, tu: 0, diem: net.diem }), 3)!
    expect(g.k === 'diem' && g.diem).toEqual(net.diem)
    const t = giaiGoi(maTro({ phien: 3, tGui: 5, x: 0.8123, y: 2.4567 }), 3)!
    expect(t).toMatchObject({ k: 'tro', x: 0.8123, y: 2.4567 })
  })
  it('độ cuộn của thầy đi bằng sự kiện `tro` có x = 2 (quy ước, không thêm loại sự kiện): `so.cuon(v)`', () => {
    const so = L.taoSo(), sk: SuKienBut[] = []
    so.cuon(0.5) // chưa ai nghe ⇒ không phát
    so.nghe((x) => sk.push(x))
    so.cuon(1.23456)
    expect(sk).toEqual([{ loai: 'tro', trang: '', x: 2, y: 1.2346 }])
    const t = giaiGoi(maTro({ phien: 1, tGui: 9, x: 2, y: 1.2346 }), 1)!
    expect(t).toMatchObject({ k: 'tro', x: 2, y: 1.2346 })
  })
})

// ───────────── tờ chiếu thật trong JSDOM (không có canvas thật, không có bố cục ⇒ không có ô bảng) ─────────────
const cau = (id: string) => ({ phan: 'I', id, maDe: '', chuyenDe: 'x', dang: 'x', sao: 1, mucDo: '', text: 'Đề bài.', luaChon: ['Một', 'Hai', 'Ba', 'Bốn'], dapAn: 'B', chot: 'Cốt lõi.', lyDo: [], buoc: [] }) as unknown as OBang['cau']
const o = (sbd: string, hoTen: string): OBang => ({ sbd, hoTen, qid: `DE-I-${sbd}`, soCau: 3, sao: 1, cau: cau(`DE-I-${sbd}`), bacUoc: 2, lop: '12A1', lanLenBang: 1 } as OBang)
type ApiBut = { xuat(): { net: NetBut[] }; nghe(f: (s: SuKienBut) => void): () => void; cuon(v?: number, em?: boolean): number }
function moTo() {
  const dom = new JSDOM(taoHtmlMayChieu([o('A', 'An'), o('B', 'Bình')]), {
    runScripts: 'dangerously', virtualConsole: new VirtualConsole(),
    beforeParse(w) { w.setTimeout = (() => 0) as never; w.setInterval = (() => 0) as never; w.HTMLElement.prototype.scrollTo = () => {}; (w as unknown as { matchMedia: unknown }).matchMedia = () => ({ matches: true }) },
  })
  const doc = dom.window.document
  const cv = doc.querySelector<HTMLCanvasElement>('canvas.mc-but-song')!
  const tro = (loai: string, x: number, y: number, them: Record<string, unknown> = {}) => { const e = new dom.window.MouseEvent(loai, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, buttons: 1 }); for (const [k, v] of Object.entries({ pointerId: 1, pointerType: 'mouse', pressure: 0.5, ...them })) Object.defineProperty(e, k, { value: v }); cv.dispatchEvent(e); return e }
  const phim = (key: string) => doc.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  return { dom, doc, cv, tro, phim, but: (dom.window as unknown as { __mcBut: ApiBut }).__mcBut }
}
describe('tờ chiếu (JSDOM)', () => {
  it('vẫn hai canvas trên tờ + vạch cuộn; API thêm `cuon`; tờ không có ô bảng ⇒ nét là nét thường (mã «n…»), cuộn không có tác dụng, lăn chuột không lỗi', () => {
    const t = moTo()
    expect(t.doc.querySelectorAll('canvas.mc-but')).toHaveLength(2)
    expect(t.doc.querySelectorAll('.mc-but-ray')).toHaveLength(1)
    t.phim('b')
    expect(t.but.cuon()).toBe(0)
    expect(t.but.cuon(0.4)).toBe(0)
    const e = new t.dom.window.Event('wheel', { bubbles: true, cancelable: true }) as Event & { deltaY?: number }
    Object.assign(e, { clientX: 800, clientY: 400, deltaY: 120, deltaMode: 0 })
    expect(() => t.cv.dispatchEvent(e)).not.toThrow()
    t.tro('pointerdown', 700, 300, { timeStamp: 1000 })
    t.tro('pointermove', 720, 310, { timeStamp: 1010 })
    t.tro('pointerup', 720, 310, { timeStamp: 1020 })
    const net = t.but.xuat().net
    expect(net).toHaveLength(1)
    expect(net[0].id.startsWith('b_')).toBe(false)
    expect(Math.max(...net[0].diem.map((d) => d[1]))).toBeLessThanOrEqual(1)
  })
  it('bút lơ lửng báo con trỏ mỗi khung (cách nhau > 15 ms) — máy em cần đủ dày để cây bút trượt, không nhảy', () => {
    const t = moTo(), sk: SuKienBut[] = []
    t.phim('b')
    t.but.nghe((x) => sk.push(x))
    for (let i = 0; i < 10; i++) t.tro('pointermove', 500 + i * 5, 300, { pointerType: 'pen', buttons: 0, timeStamp: 2000 + i * 8 })
    // 10 sự kiện cách 8 ms (72 ms) ⇒ 5 lần báo (cứ 16 ms một lần); bản trước 50 ms một lần ⇒ 2
    expect(sk.filter((x) => x.loai === 'tro')).toHaveLength(5)
  })
})

// ───────────── đệm phát của máy em ─────────────
/** Thầy viết một nét thẳng `giay` giây (200 điểm / giây), máy thầy gửi mỗi 16 ms: gói = lô trước + lô mới. */
function goiNet(giay: number, tuy: { treGui?: (lo: number) => number } = {}) {
  const tong = giay * 200, diem: DiemBut[] = []
  for (let i = 0; i < tong; i++) diem.push([0.1 + 0.8 * i / tong, 0.5, 0.5, i * 5])
  const goi: { gui: number; g: GoiDiem }[] = []
  let truoc = 0, da = 0
  for (let lo = 0, t = 16; da < tong; lo++, t += 16) {
    const den = Math.min(tong, Math.floor(t / 5) + 1)
    if (den <= da) continue
    const gui = 2000 + t + (tuy.treGui?.(lo) ?? 0)
    goi.push({ gui, g: { phien: 1, tGui: gui, k: 'diem', dau: DAU, tGoc: 2000, tu: truoc, diem: diem.slice(truoc, den) } })
    truoc = da; da = den
  }
  return { diem, goi, tong }
}
const LECH = 55_555
describe('máy em: đồng hồ phát bám đích — hết điểm thì ĐỨNG chờ, có điểm thì chạy bù êm, không dồn cục', () => {
  it('một lô về muộn 90 ms: đầu nét đứng lại ở điểm mới nhất rồi TIẾN DẦN (mỗi khung không quá 1,6 lần nhịp thường), không lùi, không nhảy cục', () => {
    const { goi, diem } = goiNet(4)
    const dem = taoDemPhat()
    const toi = goi.map((x, i) => ({ nhan: x.gui + LECH + 30 + (i === 120 ? 90 : 0), g: x.g })).sort((a, b) => a.nhan - b.nhan)
    let gi = 0, xTruoc = -1, buocLon = 0, lui = 0
    const ra: DiemBut[] = []
    for (let k = 0; k < 5 * 60; k++) {
      const nay = 2000 + LECH + k * (1000 / 60)
      while (gi < toi.length && toi[gi].nhan <= nay) { dem.nap(toi[gi].g, toi[gi].nhan); gi++ }
      const n = dem.khung(nay).net[0]
      if (!n?.head) continue
      ra.push(...n.moi)
      if (xTruoc >= 0) { if (n.head.x < xTruoc - 1e-12) lui++; buocLon = Math.max(buocLon, n.head.x - xTruoc) }
      xTruoc = n.head.x
    }
    // nhịp thường: 16,7 ms đường viết mỗi khung = 0,8 × 16,7 / 4000 = 0,00333 bề ngang
    const thuong = 0.8 * (1000 / 60) / 4000
    expect(lui).toBe(0)
    expect(buocLon).toBeLessThanOrEqual(thuong * 1.6 + 1e-9)
    expect(ra).toEqual(diem.slice(0, ra.length))
    expect(ra.length).toBeGreaterThan(diem.length - 40)
    const s = dem.soDo(2000 + LECH + 99_999)
    expect(s.dung).toBeGreaterThan(0) // có đứng chờ lô muộn
    expect(s.mat).toBe(0)
  })
  it('máy thầy gom lô chậm (điểm sinh ra 50 ms rồi mới gửi): D tự nâng theo «độ cần» ⇒ sau 2 giây làm nóng đầu nét không còn đứng', () => {
    const { goi } = goiNet(6, { treGui: () => 50 })
    const dem = taoDemPhat()
    const toi = goi.map((x) => ({ nhan: x.gui + LECH + 30, g: x.g }))
    let gi = 0, xTruoc = -1, dung = 0, khung = 0, d = 0
    for (let k = 0; k < 6 * 60; k++) {
      const nay = 2000 + LECH + k * (1000 / 60)
      while (gi < toi.length && toi[gi].nhan <= nay) { dem.nap(toi[gi].g, toi[gi].nhan); gi++ }
      const kh = dem.khung(nay), n = kh.net[0]
      d = kh.d
      if (!n?.head) continue
      if (nay - 2000 - LECH > 2000 && nay - 2000 - LECH < 5600) { khung++; if (n.head.x <= xTruoc + 1e-12) dung++ }
      xTruoc = n.head.x
    }
    expect(khung).toBeGreaterThan(150)
    expect(dung).toBe(0)
    expect(d).toBeGreaterThan(60) // 50 ms gom chậm + một lô 16 ms
    expect(d).toBeLessThanOrEqual(150)
  })
  it('gói CUỐI của nét mất: bản chốt từ sổ nét VÁ điểm thiếu (`va`) ⇒ nét phát nốt cho hết, đủ từng điểm, rồi xong — không phải xoá nét dở vẽ lại', () => {
    const { goi, diem, tong } = goiNet(1)
    const dem = taoDemPhat()
    const toi = goi.slice(0, -2).map((x) => ({ nhan: x.gui + LECH + 30, g: x.g })) // mất HAI gói cuối ⇒ thủng đuôi
    toi.push({ nhan: 2000 + 1000 + 20 + LECH + 30, g: { phien: 1, tGui: 3020, k: 'nhac', id: 'n1', tong } })
    let gi = 0, xong = false, daVa = 0
    const ra: DiemBut[] = []
    for (let k = 0; k < 2.2 * 60 && !xong; k++) {
      const nay = 2000 + LECH + k * (1000 / 60)
      while (gi < toi.length && toi[gi].nhan <= nay) { dem.nap(toi[gi].g, toi[gi].nhan); gi++ }
      // bản chốt tới 80 ms sau khi thầy nhấc bút
      if (!daVa && nay - LECH > 3100 && dem.dangPhat('n1')) daVa = dem.va('n1', diem)
      const n = dem.khung(nay).net[0]
      if (n) { ra.push(...n.moi); xong = n.xong }
    }
    expect(daVa).toBeGreaterThan(0)
    expect(xong).toBe(true)
    expect(ra).toEqual(diem)
    expect(dem.va('n1', diem)).toBe(0) // nét đã xong ⇒ không còn gì để vá
  })
})

describe('máy em: CÂY BÚT của thầy — một vị trí duy nhất, đang viết thì ở đúng đầu nét', () => {
  it('có con trỏ lơ lửng cũ rồi thầy viết: bút ở ĐẦU NÉT mọi khung (`cham`), không đứng ở chỗ lơ lửng cũ; nhấc bút xong trượt từ cuối nét tới chỗ lơ lửng mới', () => {
    const dem = taoDemPhat(), T0 = 2000
    const nap = (g: GoiDiem) => dem.nap(g, g.tGui + LECH + 20)
    // lơ lửng ở góc trái trên, rồi 300 ms sau viết một nét ở giữa bảng
    for (let i = 0; i < 6; i++) nap({ phien: 1, tGui: T0 + i * 16, k: 'tro', x: 0.1, y: 0.1 })
    const diem: DiemBut[] = Array.from({ length: 60 }, (_, i) => [0.5 + i * 0.002, 0.5, 0.5, i * 5])
    const cho: { gui: number; g: GoiDiem }[] = []
    for (let t = 16, da = 0, truoc = 0; da < 60; t += 16) { const den = Math.min(60, Math.floor(t / 5) + 1); cho.push({ gui: T0 + 400 + t, g: { phien: 1, tGui: T0 + 400 + t, k: 'diem', dau: DAU, tGoc: T0 + 400, tu: truoc, diem: diem.slice(truoc, den) } }); truoc = da; da = den }
    cho.push({ gui: T0 + 720, g: { phien: 1, tGui: T0 + 720, k: 'nhac', id: 'n1', tong: 60 } })
    for (let i = 0; i < 8; i++) cho.push({ gui: T0 + 760 + i * 16, g: { phien: 1, tGui: T0 + 760 + i * 16, k: 'tro', x: 0.62 + i * 0.01, y: 0.5 } })
    let gi = 0, khungCham = 0, lechDau = 0, veChoCu = 0, xCuoi = 0
    const sauNhac: number[] = []
    for (let k = 0; k < 70; k++) {
      const nay = T0 + LECH + k * (1000 / 60)
      while (gi < cho.length && cho[gi].gui + LECH + 20 <= nay) { nap(cho[gi].g); gi++ }
      const kh = dem.khung(nay), n = kh.net[0]
      if (n?.head && !n.xong) {
        khungCham++
        expect(kh.but).toMatchObject({ cham: true, net: 'n1', mau: MAU })
        if (Math.abs(kh.but!.x - n.head.x) > 1e-9) lechDau++
        xCuoi = n.head.x
      } else if (khungCham && kh.but) {
        expect(kh.but.cham).toBe(false)
        if (kh.but.x < 0.4) veChoCu++ // quay về chỗ lơ lửng cũ (0,1) = lỗi của bản trước
        sauNhac.push(kh.but.x)
      }
    }
    expect(khungCham).toBeGreaterThan(12)
    expect(lechDau).toBe(0)
    expect(veChoCu).toBe(0)
    expect(sauNhac.length).toBeGreaterThan(5)
    expect(sauNhac[0]).toBeGreaterThanOrEqual(xCuoi - 1e-9)
    for (let i = 1; i < sauNhac.length; i++) expect(sauNhac[i]).toBeGreaterThanOrEqual(sauNhac[i - 1] - 1e-9)
  })
  it('tin độ cuộn (`tro` x = 2) KHÔNG phải con trỏ: không dời cây bút, ra ở `cuon` đúng lúc mốc phát đi qua; `xoa` thì quên', () => {
    const dem = taoDemPhat()
    dem.nap({ phien: 1, tGui: 1000, k: 'tro', x: 0.3, y: 0.4 }, 1000 + LECH)
    expect(dem.khung(1000 + LECH + 16).cuon).toBeNull()
    dem.nap({ phien: 1, tGui: 1100, k: 'tro', x: 2, y: 0.75 }, 1100 + LECH)
    const som = dem.khung(1100 + LECH + 10) // mốc phát (bây giờ − D) chưa tới giờ gửi của tin
    expect(som.cuon).toBeNull()
    expect(som.but).toMatchObject({ x: 0.3, y: 0.4, cham: false })
    const sau = dem.khung(1100 + LECH + 80)
    expect(sau.cuon).toBe(0.75)
    expect(sau.but).toMatchObject({ x: 0.3, y: 0.4 })
    dem.xoa()
    expect(dem.khung(1100 + LECH + 100).cuon).toBeNull()
  })
})
