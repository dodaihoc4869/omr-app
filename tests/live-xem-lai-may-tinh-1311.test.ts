// @vitest-environment node
// XEM LẠI LIVE — MÁY TÍNH FX4869 CỦA THẦY (thầy 13/11: «Máy tính không hiện trong video (xem lại); hôm qua live có bật máy tính»).
// Trước 13/11 phòng chỉ CHUYỂN TIẾP tin `mt` của thầy, không ghi ⇒ buổi cũ không có dữ liệu máy tính. Từ nay:
//   · phòng lọc + ghi các lần đổi vào nhật ký buổi (bấm phím ghi ngay, kéo dồn 200 ms, nhắc lại chỉ ghi dòng «còn»);
//   · bộ dựng đưa vào `buoi.json` (`mayTinh`) theo trục tiếng; thầy im quá 13 giây / tắt live ⇒ cất;
//   · trình phát tra máy tính tại giờ đang phát (`chiSoMayTinh` + `mayTinhTai`) rồi vẽ bằng mặt máy chỉ-xem của bảng live.
// Phần cuối chạy trên PHÒNG THẬT (Durable Object thật; kho + R2 + D1 giả) như tests/live-xem-lai-khoi-1211.test.ts.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { taoD1That } from './_d1-that'
import { chot, datKhuc, guiBangMoi, guiNet, huyHen, khucGia, netGia, taoBuoiGia, taoR2Gia, type BuoiGia, type R2Gia } from './_live-xem-lai-gia'
import { HET_HAN_MS, docTin, type TinMayTinh } from '../src/components/may-tinh/dong-bo'
import { bam, manHinh, taoMay, type TrangThai } from '../src/lib/may-tinh/may'
import { MT_NHIP_CON_MS, MT_NHIP_KEO_MS, MT_TRAN_MUC, dungMayTinh, taoLocMayTinh, type MucMayTinhXl } from '../src/lib/live/xem-lai-may-tinh'
import { chiSoMayTinh, mayTinhTai, type BuoiLiveJson } from '../src/lib/live/xem-lai-kieu'

/** Gói `mt` như máy thầy gửi: bấm lần lượt các phím `phim` rồi chụp màn. */
function goi(phim: string[], o: { x?: number; y?: number; w?: number; n?: number; p?: string } = {}): TinMayTinh {
  let tt: TrangThai = taoMay()
  for (const p of phim) tt = bam(tt, p)
  return { mo: true, x: o.x ?? 0.8, y: o.y ?? 0.5, w: o.w ?? 0.25, mh: manHinh(tt), p: o.p ?? (phim[phim.length - 1] ?? ''), n: o.n ?? phim.length }
}
const chuBt = (m: TinMayTinh | { mh: { bt: string[] } } | null): string => (m && 'mh' in m && m.mh ? m.mh.bt.join('') : '')

describe('phòng lọc tin máy tính trước khi ghi', () => {
  it('mở / bấm phím ghi NGAY; tin nhắc lại y như cũ chỉ ghi một dòng «còn» mỗi 3,5 giây; cất ghi ngay', () => {
    const loc = taoLocMayTinh()
    expect(loc.nhan({ mo: false }, 0)).toEqual([]) // chưa mở mà báo cất ⇒ không có gì để ghi
    const a = goi(['1']), b = goi(['1', 'cong']), c = goi(['1', 'cong', '2'])
    expect(loc.nhan(a, 1000)).toEqual([{ t: 1000, x: docTin(a) }])
    expect(loc.nhan(b, 1060)).toEqual([{ t: 1060, x: docTin(b) }]) // hai phím cách nhau 60 ms vẫn ghi cả hai
    expect(loc.nhan(c, 1120)).toHaveLength(1)
    expect(loc.nhan({ ...c, p: '' }, 2000)).toEqual([]) // nhắc lại (phím đã hết nháy): không phải đổi mới
    expect(loc.nhan({ ...c, p: '' }, 1120 + MT_NHIP_CON_MS)).toEqual([{ t: 1120 + MT_NHIP_CON_MS, c: 1 }])
    expect(loc.nhan({ ...c, p: '' }, 1120 + MT_NHIP_CON_MS + 500)).toEqual([])
    expect(loc.nhan({ mo: false }, 9000)).toEqual([{ t: 9000, x: { mo: false } }])
    expect(loc.nhan({ mo: false }, 9100)).toEqual([])
    expect(loc.nhan('rác', 9200)).toEqual([]); expect(loc.nhan({ mo: true }, 9300)).toEqual([]) // gói sai dạng bị bỏ
  })
  it('đang KÉO máy tính (60 ms một tin): ghi thưa ~200 ms, chỗ cuối cùng vẫn được ghi với đúng giờ lúc nhận', () => {
    const loc = taoLocMayTinh(), ra: MucMayTinhXl[] = []
    const tai = (x: number) => goi(['7'], { x, n: 1 })
    ra.push(...loc.nhan(tai(0.2), 0))
    for (let i = 1; i <= 20; i++) ra.push(...loc.nhan(tai(0.2 + i * 0.02), i * 60)) // kéo 1,2 giây
    ra.push(...loc.nhan(tai(0.6), 4000)) // tin nhắc lại sau khi thả tay
    const coX = ra.filter((m): m is { t: number; x: TinMayTinh } => 'x' in m)
    expect(coX.length).toBeGreaterThanOrEqual(5); expect(coX.length).toBeLessThanOrEqual(9) // ~1,2 giây / 200 ms
    for (let i = 1; i < coX.length; i++) expect(coX[i]!.t - coX[i - 1]!.t).toBeGreaterThanOrEqual(MT_NHIP_KEO_MS / 2)
    const cuoi = coX[coX.length - 1]!
    expect(cuoi.x.x).toBeCloseTo(0.6, 5) // chỗ thả tay
    expect(cuoi.t).toBe(1200) // giờ lúc NHẬN tin ấy, không phải giờ tin nhắc lại
  })
  it('thầy im quá 13 giây rồi quay lại với đúng trạng thái cũ ⇒ ghi lại ĐỦ (máy em đã tự cất); có trần số dòng một buổi', () => {
    const loc = taoLocMayTinh(), a = goi(['5'])
    expect(loc.nhan(a, 0)).toHaveLength(1)
    expect(loc.nhan(a, HET_HAN_MS + 2000)).toEqual([{ t: HET_HAN_MS + 2000, x: docTin(a) }])
    let dem = 1
    for (let i = 0; i < MT_TRAN_MUC + 50; i++) dem += loc.nhan(goi(['5'], { n: i + 2 }), 20_000 + i * 70).length
    expect(dem).toBeLessThanOrEqual(MT_TRAN_MUC + 2)
  })
})

describe('bộ dựng: nhật ký máy tính ⇒ dòng thời gian trên trục tiếng', () => {
  const F = (w: number): number => w - 100_000 // buổi bắt đầu lúc 100 000 (giờ phòng)
  const trongLive = (w: number): boolean => w >= 100_000 && w <= 400_000
  it('mở → bấm phím → dời → cất: màn hình chỉ ghi khi đổi, phím chỉ ghi ở lần bấm mới, giờ đúng trục tiếng', () => {
    const a = docTin(goi(['1']))!, b = docTin(goi(['1', 'cong']))!, bDoi = { ...b, x: 0.3, y: 0.4, p: '' }
    const ra = dungMayTinh([{ t: 110_000, x: a }, { t: 111_000, x: b }, { t: 112_000, x: bDoi }, { t: 114_000, c: 1 }, { t: 115_000, x: { mo: false } }], [400_000], F, trongLive)
    expect(ra.map((m) => [m.t, m.mo])).toEqual([[10_000, 1], [11_000, 1], [12_000, 1], [15_000, 0]])
    expect(ra[0]).toMatchObject({ x: 0.8, y: 0.5, w: 0.25, p: '1', n: 1 }); expect(chuBt(ra[0] as never)).toBe('1')
    expect(chuBt(ra[1] as never)).toBe(chuBt(b)); expect(chuBt(b)).not.toBe('1'); expect(ra[1]).toMatchObject({ p: 'cong', n: 2 })
    expect(ra[2]).toEqual({ t: 12_000, mo: 1, x: 0.3, y: 0.4, w: 0.25 }) // chỉ đổi chỗ: không lặp màn hình, không lặp phím
  })
  it('thầy im quá 13 giây (mất nối) ⇒ cất sau đúng 13 giây; tắt live ⇒ cất; tin ngoài lúc live bị bỏ', () => {
    const a = docTin(goi(['9']))!
    let ra = dungMayTinh([{ t: 110_000, x: a }, { t: 113_500, c: 1 }, { t: 117_000, c: 1 }], [400_000], F, trongLive)
    expect(ra.map((m) => [m.t, m.mo])).toEqual([[10_000, 1], [17_000 + HET_HAN_MS, 0]])
    ra = dungMayTinh([{ t: 395_000, x: a }, { t: 398_500, c: 1 }], [400_000], F, trongLive)
    expect(ra.map((m) => [m.t, m.mo])).toEqual([[295_000, 1], [300_000, 0]]) // tắt live lúc 400 000
    expect(dungMayTinh([{ t: 50_000, x: a }, { t: 500_000, x: a }], [400_000], F, trongLive)).toEqual([])
    expect(dungMayTinh([], [400_000], F, trongLive)).toEqual([])
  })
  it('trình phát tra đúng máy tính tại giờ đang phát (kể cả tua vào giữa): màn hình + chỗ + lần bấm gần nhất; đã cất ⇒ null', () => {
    const a = docTin(goi(['1']))!, b = docTin(goi(['1', 'cong']))!
    const ds = dungMayTinh([{ t: 110_000, x: a }, { t: 111_000, x: b }, { t: 112_000, x: { ...b, x: 0.3, p: '' } }, { t: 115_000, x: { mo: false } }, { t: 120_000, x: a }], [400_000], F, trongLive)
    const tai = (t: number) => mayTinhTai(ds, chiSoMayTinh(ds, t))
    expect(chiSoMayTinh(ds, 9999)).toBe(-1); expect(tai(9999)).toBeNull()
    expect(chuBt(tai(10_500))).toBe('1')
    expect(tai(13_000)).toMatchObject({ mo: true, x: 0.3, p: 'cong', n: 2 }); expect(chuBt(tai(13_000))).toBe(chuBt(b)) // mốc «chỉ đổi chỗ» lấy màn hình của mốc trước
    expect(tai(16_000)).toBeNull()
    expect(chuBt(tai(25_000))).toBe('1') // mở lại: không lấy nhầm màn hình của lần mở trước
    expect(chiSoMayTinh(undefined, 5)).toBe(-1); expect(mayTinhTai(undefined, 0)).toBeNull()
  })
})

describe('phòng thật: live có bật máy tính ⇒ bản xem lại có máy tính', () => {
  const T0 = Date.parse('2026-11-13T12:00:00Z'), LECH = 5000, MS_KHUC = 417 * 24
  let dong: BuoiGia[] = []
  beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0) })
  afterEach(() => { for (const b of dong) huyHen(b.ph); dong = []; vi.useRealTimers() })
  const luc = (ms: number): void => { vi.setSystemTime(T0 + ms) }
  const docJson = (r2: R2Gia): BuoiLiveJson => JSON.parse(new TextDecoder().decode(r2.du.get('live/b1/buoi.json')!.b)) as BuoiLiveJson
  /** Buổi live theo khối 120 giây, thầy viết 10 nét; `mt` = việc thầy làm với máy tính (gọi giữa buổi). */
  async function buoi(mt?: (gui: (x: unknown) => Promise<void>) => Promise<void>) {
    const r2 = taoR2Gia(), d1 = taoD1That(), b = await taoBuoiGia({ r2, DB: d1.env.DB }); dong.push(b)
    const { ph, gv, hs } = b
    await guiBangMoi(ph, gv)
    luc(0); await ph.gui(gv, { t: 'live-bat' })
    await ph.gui(gv, { t: 'live-dat', khoi: { k: 10, gd: 'dang', che: 'bang' } })
    await ph.gui(gv, { t: 'live-ghi', tt: 'dang-ghi', dh: T0 - LECH, p: 'p1' })
    const moc: [string, number][] = []
    for (let i = 0; i < 10; i++) { const t = 10_000 + i * 4000; luc(t + 500); await guiNet(ph, gv, netGia(`g-${i}`)); moc.push([`g-${i}`, t]) }
    if (mt) await mt((x) => ph.gui(gv, { t: 'lop', k: 'mt', x }))
    const net: Record<number, [string, number][]> = {}
    for (const [id, t] of moc) { const k = Math.floor(t / MS_KHUC); (net[k] ??= []).push([id, t - k * MS_KHUC]) }
    for (let i = 0; i < Math.ceil(120_000 / MS_KHUC); i++) await datKhuc(r2, 'b1', 'p1', i, khucGia({ t0: T0 - LECH + i * MS_KHUC, soDau: i * 417 + 1, net: net[i] }))
    luc(120_000); await ph.gui(gv, { t: 'live-tat' })
    return { b, r2, hs }
  }
  it('thầy mở máy tính lúc 60 giây, bấm 2 × 3 =, kéo sang trái, cất lúc 80 giây ⇒ `buoi.mayTinh` đúng giờ, đúng nội dung; máy em lúc live vẫn nhận tin như cũ', async () => {
    const phim = ['2', 'nhan', '3', 'bang']
    const { b, r2, hs } = await buoi(async (gui) => {
      luc(60_000); await gui(goi([], { n: 0, p: '' }))
      for (let i = 0; i < phim.length; i++) { luc(62_000 + i * 700); await gui(goi(phim.slice(0, i + 1))) }
      for (const g of [64_000, 68_000, 72_000]) { luc(g + 900); await gui(goi(phim, { p: '' })) } // tin nhắc lại mỗi 4 giây
      luc(74_000); await gui(goi(phim, { x: 0.3, y: 0.4, p: '' }))
      luc(80_000); await gui({ mo: false })
    })
    const tinEm = hs[0]!.tin.filter((t): t is string => typeof t === 'string' && t.startsWith('{"t":"lop","k":"mt"'))
    expect(tinEm).toHaveLength(1 + phim.length + 3 + 1 + 1) // chuyển tiếp đủ mọi tin, kể cả tin nhắc lại
    expect(await chot(b.ph)).toMatchObject({ ok: true, du: true })
    const j = docJson(r2), mt = j.mayTinh!
    expect(mt.map((m) => m.mo)).toEqual([1, 1, 1, 1, 1, 1, 0])
    // giờ trên trục tiếng = giờ phòng (live bật lúc 0), lệch không quá một khung tiếng
    const gio = [60_000, 62_000, 62_700, 63_400, 64_100, 74_000, 80_000]
    mt.forEach((m, i) => expect(Math.abs(m.t - gio[i]!)).toBeLessThan(60))
    expect(mt.filter((m) => m.mh).length).toBe(5) // mở + 4 lần bấm; lần dời không lặp màn hình
    expect(mt.slice(1, 5).map((m) => m.p)).toEqual(phim)
    expect(mt[5]).toMatchObject({ x: 0.3, y: 0.4 }); expect(mt[5]!.mh).toBeUndefined()
    const tai = (t: number) => mayTinhTai(mt, chiSoMayTinh(mt, t))
    expect(tai(59_000)).toBeNull()
    expect(chuBt(tai(63_000))).toBe(chuBt(goi(phim.slice(0, 2))))
    expect(tai(70_000)!.mh.kq).toEqual(goi(phim).mh!.kq) // kết quả 2 × 3 đang hiện
    expect(tai(76_000)).toMatchObject({ x: 0.3, y: 0.4 })
    expect(tai(81_000)).toBeNull()
    expect(JSON.stringify(mt).length).toBeLessThan(4000) // gọn: không phình `buoi.json`
  })
  it('thầy để máy tính mở tới lúc tắt live ⇒ cất đúng lúc tắt; buổi KHÔNG dùng máy tính (và mọi buổi dựng trước 13/11) ⇒ không có trường `mayTinh`', async () => {
    const { b, r2 } = await buoi(async (gui) => { luc(100_000); await gui(goi(['4'])); for (const g of [104_000, 108_000, 112_000, 116_000]) { luc(g); await gui(goi(['4'], { p: '' })) } })
    expect(await chot(b.ph)).toMatchObject({ ok: true, du: true })
    const mt = docJson(r2).mayTinh!
    expect(mt.map((m) => m.mo)).toEqual([1, 0])
    expect(Math.abs(mt[1]!.t - 120_000)).toBeLessThan(60)
    const k = await buoi()
    expect(await chot(k.b.ph)).toMatchObject({ ok: true, du: true })
    expect(docJson(k.r2).mayTinh).toBeUndefined()
  })
  it('tin máy tính lúc CHƯA bật live / của máy em ⇒ không ghi', async () => {
    const r2 = taoR2Gia(), d1 = taoD1That(), b = await taoBuoiGia({ r2, DB: d1.env.DB }); dong.push(b)
    const { ph, gv, hs } = b
    await ph.gui(gv, { t: 'lop', k: 'mt', x: goi(['1']) }) // chưa live
    luc(0); await ph.gui(gv, { t: 'live-bat' })
    await ph.gui(gv, { t: 'live-dat', khoi: { k: 10, gd: 'dang', che: 'bang' } })
    luc(5000); await ph.gui(hs[0]!, { t: 'lop', k: 'mt', x: goi(['6']) }) // em giả làm thầy
    for (let i = 0; i < 6; i++) { luc(10_000 + i * 3000); await guiNet(ph, gv, netGia(`n-${i}`)) }
    luc(40_000); await ph.gui(gv, { t: 'live-tat' })
    expect(await chot(ph)).toMatchObject({ ok: true })
    expect(docJson(r2).mayTinh).toBeUndefined()
  })
})
