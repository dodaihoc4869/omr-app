// @vitest-environment node
// XEM LẠI LIVE cho buổi LIVE THEO KHỐI (thầy 12/11 tối, ảnh «Lịch sử Live»: buổi 39 phút ra «Chưa có đoạn xem lại · chưa câu nào được chữa», 0 đoạn —
// «live xong xử lý quá lâu, tăng tốc xử lý tức thì đi để hs còn xem lại»). Gốc: đoạn chỉ sinh trong chương của một CÂU đã chữa; buổi khối thầy giảng trên
// bảng cả buổi, không chiếu câu nào ⇒ không có chương ⇒ 0 đoạn mãi mãi. Nay: phần live trước câu đầu (hoặc cả buổi) là chương «Thầy giảng».
// Chạy trên PHÒNG THẬT (Durable Object thật; kho + R2 + D1 giả) như tests/live-xem-lai-chot-1111.test.ts.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { taoD1That } from './_d1-that'
import { CAU_GIA, chot, datKhuc, guiBangMoi, guiNet, huyHen, khucGia, netGia, taoBuoiGia, taoR2Gia, type BuoiGia, type R2Gia } from './_live-xem-lai-gia'
import { CHU_GIANG } from '../src/lib/live/xem-lai-dung'
import type { BuoiLiveJson } from '../src/lib/live/xem-lai-kieu'
import { doanHopLe } from '../src/screens/live-xem-lai/hs/sap-doan'

const T0 = Date.parse('2026-11-12T13:18:00Z'), LECH = 5000, MS_KHUC = 417 * 24
let dong: BuoiGia[] = []
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0) })
afterEach(() => { for (const b of dong) huyHen(b.ph); dong = []; vi.useRealTimers() })
const luc = (ms: number): void => { vi.setSystemTime(T0 + ms) }
const docJson = (r2: R2Gia): BuoiLiveJson => JSON.parse(new TextDecoder().decode(r2.du.get('live/b1/buoi.json')!.b)) as BuoiLiveJson
/** Buổi 120 giây: thầy chỉ viết bảng (10 nét), có tiếng; `khoi` = có bật cờ live theo khối không; `cau` = giây chiếu một câu (không mở đáp án). */
async function buoiGiang(o: { khoi: boolean; cau?: number }) {
  const r2 = taoR2Gia(), d1 = taoD1That(), b = await taoBuoiGia({ r2, DB: d1.env.DB }); dong.push(b)
  const { ph, gv } = b
  await guiBangMoi(ph, gv)
  luc(0); await ph.gui(gv, { t: 'live-bat' })
  if (o.khoi) await ph.gui(gv, { t: 'live-dat', khoi: { k: 10, gd: 'dang', che: 'bang' } })
  await ph.gui(gv, { t: 'live-ghi', tt: 'dang-ghi', dh: T0 - LECH, p: 'p1' })
  const moc: [string, number][] = []
  for (let i = 0; i < 10; i++) { const t = 10_000 + i * 4000; luc(t + 500); await guiNet(ph, gv, netGia(`g-${i}`)); moc.push([`g-${i}`, t]) }
  if (o.cau != null) { luc(o.cau * 1000); await ph.post('/luot', CAU_GIA('q1')); for (let i = 0; i < 6; i++) { const t = o.cau * 1000 + 5000 + i * 3000; luc(t + 500); await guiNet(ph, gv, netGia(`c-${i}`)); moc.push([`c-${i}`, t]) } }
  const net: Record<number, [string, number][]> = {}
  for (const [id, t] of moc) { const k = Math.floor(t / MS_KHUC); (net[k] ??= []).push([id, t - k * MS_KHUC]) }
  for (let i = 0; i < Math.ceil(120_000 / MS_KHUC); i++) await datKhuc(r2, 'b1', 'p1', i, khucGia({ t0: T0 - LECH + i * MS_KHUC, soDau: i * 417 + 1, net: net[i] }))
  luc(120_000); await ph.gui(gv, { t: 'live-tat' })
  return { b, r2, d1 }
}

describe('xem lại live — buổi live theo khối', () => {
  it('thầy giảng trên bảng cả buổi, KHÔNG chiếu câu nào ⇒ CÓ đoạn «Thầy giảng trên bảng» (trước: 0 đoạn, «chưa câu nào được chữa»)', async () => {
    const { b, r2, d1 } = await buoiGiang({ khoi: true })
    expect(await chot(b.ph)).toMatchObject({ ok: true, du: true })
    const j = docJson(r2)
    expect(j.cau).toHaveLength(1)
    expect(j.cau[0]).toMatchObject({ so: 1, luot: 0, qid: '', dung: '', giai: null, dang: CHU_GIANG, moDapAn: false })
    expect(j.doan.length).toBeGreaterThanOrEqual(1)
    expect(j.doan[0]).toMatchObject({ loai: 'thay_chua', cau: 1, luot: 0, ten: `Câu 1 · ${CHU_GIANG}`, lenBang: null })
    expect(j.doan[0]!.soNet).toBeGreaterThanOrEqual(5)
    expect(j.doan[0]!.t1 - j.doan[0]!.t0).toBeGreaterThan(30_000)
    expect(doanHopLe(j)).toHaveLength(j.doan.length) // máy em không lọc bỏ đoạn này
    expect(r2.du.has('live/b1/tieng.mp3')).toBe(true)
    const dongD1 = d1.sql.prepare('SELECT trang_thai, so_cau, so_doan, byte > 0 AS co FROM live_buoi').all()
    expect(dongD1).toEqual([{ trang_thai: 'xong', so_cau: 1, so_doan: j.doan.length, co: 1 }])
    expect(d1.sql.prepare('SELECT luot, qid, ten FROM live_doan ORDER BY stt LIMIT 1').all()).toEqual([{ luot: 0, qid: '', ten: `Câu 1 · ${CHU_GIANG}` }])
  })
  it('giảng 60 giây rồi mới chiếu một câu (không mở đáp án): phần giảng là câu 1, câu đã chiếu vào như «chữa trên bảng» — không đáp án, không lời giải', async () => {
    const { b, r2 } = await buoiGiang({ khoi: true, cau: 60 })
    expect(await chot(b.ph)).toMatchObject({ ok: true, du: true })
    const j = docJson(r2)
    expect(j.cau.map((c) => [c.so, c.luot, c.qid, c.dung, c.giai])).toEqual([[1, 0, '', '', null], [2, 1, 'q1', '', null]])
    expect(j.doan.map((d) => d.cau)).toEqual(expect.arrayContaining([1, 2]))
    expect(JSON.stringify(j)).not.toContain('"dung":"A"')
  })
  it('buổi thường trên lớp (không phải live theo khối) giữ luật cũ: không câu nào được chữa ⇒ 0 đoạn', async () => {
    const { b } = await buoiGiang({ khoi: false })
    expect(await chot(b.ph)).toMatchObject({ ok: true, du: false, lyDo: 'khong-cau' })
  })
})
