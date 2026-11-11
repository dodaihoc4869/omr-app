// @vitest-environment node
// XEM LẠI LIVE (thầy chốt build 11/11; đặc tả docs/dac-ta-live-xem-lai-1011.md mục 4.3, 4.4 luật 7, 5, 7): CHỐT Ở MÁY CHỦ trên PHÒNG THẬT của Bình Phản Ứng
// (Durable Object thật, kho + R2 + D1 giả): nhật ký sự kiện + nét, ghép tiếng theo khung, an toàn câu chưa mở đáp án, chạy lại cho cùng kết quả,
// máy thầy tắt giữa chừng, thiếu khúc giữa, khúc tải bù, live quá ngắn, chia bước + tải nhiều phần.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { taoD1That } from './_d1-that'
import { viewCuoi } from './_live-phong-gia'
import { CAU_GIA, choXl, chot, datKhuc, guiBangMoi, guiNet, huyHen, khucGia, netGia, soKhungTrong, taoBuoiGia, taoR2Gia, type BuoiGia, type R2Gia } from './_live-xem-lai-gia'
import { BUOC_CHOT } from '../server/src/live-xem-lai'
import { docNetBin, type BuoiLiveJson } from '../src/lib/live/xem-lai-kieu'
import { giaiSo } from '../src/lib/live/ma-net'

const T0 = Date.parse('2026-11-10T12:00:00Z') // 19:00 giờ VN, thứ Ba
/** Đồng hồ máy thầy CHẬM hơn đồng hồ phòng 5 giây (để chứng minh máy chủ tự căn lệch). */
const LECH = 5000
const MS_KHUC = 417 * 24
let dong: BuoiGia[] = []
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0) })
afterEach(() => { for (const b of dong) huyHen(b.ph); dong = []; vi.useRealTimers(); BUOC_CHOT.khuc = 300 })

const luc = (ms: number): void => { vi.setSystemTime(T0 + ms) }
const docJson = (r2: R2Gia): BuoiLiveJson => JSON.parse(new TextDecoder().decode(r2.du.get('live/b1/buoi.json')!.b)) as BuoiLiveJson
/** Tải các khúc tiếng 10 giây phủ [0, `giay`) (bỏ các khúc trong `thieu`); khung thứ k của buổi mang số k + 1. */
async function taiKhuc(r2: R2Gia, giay: number, o: { thieu?: number[]; net?: Record<number, [string, number][]>; phien?: string } = {}): Promise<number> {
  const so = Math.ceil((giay * 1000) / MS_KHUC)
  for (let i = 0; i < so; i++) if (!o.thieu?.includes(i)) await datKhuc(r2, 'b1', o.phien ?? 'p1', i, khucGia({ t0: T0 - LECH + i * MS_KHUC, soDau: i * 417 + 1, net: o.net?.[i] }))
  return so
}
/** Buổi mẫu 300 giây: câu 1 (gọi e01 lên bảng, Đạt, mở đáp án) · câu 2 bị BỎ khi chưa mở đáp án (150–200 giây) · câu 3 mở đáp án rồi thầy chữa 8 nét. */
async function buoiMau(o: { r2: R2Gia; DB?: unknown; tat?: boolean; coKhuc?: boolean; thieu?: number[] } ) {
  const b = await taoBuoiGia({ r2: o.r2, DB: o.DB }); dong.push(b)
  const { ph, gv, hs } = b
  await guiBangMoi(ph, gv)
  await guiNet(ph, gv, netGia('truoc-live')) // nét viết TRƯỚC khi bật live
  luc(0); await ph.gui(gv, { t: 'live-bat' })
  await ph.gui(gv, { t: 'live-ghi', tt: 'dang-ghi', dh: T0 - LECH, p: 'p1' })
  luc(5000); await ph.post('/luot', CAU_GIA('q1'))
  for (let i = 0; i < 12; i++) { luc(8000 + i * 100); await ph.gui(hs[i]!, { t: 'tra', chon: i < 5 ? 'A' : 'B' }) } // 5/12 đúng
  luc(30_000); await ph.gui(gv, { t: 'goi', sbd: 'e01', lyDo: [] })
  for (let i = 0; i < 6; i++) { luc(40_000 + i * 3000); await guiNet(ph, gv, netGia(`c1-${i}`)) }
  luc(100_000); await ph.gui(gv, { t: 'dat', v: true })
  luc(110_000); await ph.gui(gv, { t: 'mo' })
  luc(150_000); await ph.post('/luot', CAU_GIA('q2'))
  for (let i = 0; i < 12; i++) await ph.gui(hs[i]!, { t: 'tra', chon: 'A' })
  for (let i = 0; i < 3; i++) { luc(160_000 + i * 2000); await guiNet(ph, gv, netGia(`an-${i}`)) } // nét của câu CHƯA mở đáp án
  luc(200_000); await ph.post('/luot', { ...CAU_GIA('q3'), bo: true }) // thầy chọn câu khác ⇒ câu 2 bỏ, không mở đáp án
  for (let i = 0; i < 12; i++) await ph.gui(hs[i]!, { t: 'tra', chon: 'A' })
  luc(210_000); await ph.gui(gv, { t: 'mo' })
  const moc: [string, number][] = []
  for (let i = 0; i < 8; i++) { luc(220_000 + i * 3000 + 500); await guiNet(ph, gv, netGia(`c3-${i}`)); moc.push([`c3-${i}`, 220_000 + i * 3000]) }
  if (o.coKhuc !== false) {
    // mốc giờ nét (đồng hồ máy thầy) nằm trong phần đầu khúc đang ghi lúc ấy
    const net: Record<number, [string, number][]> = {}
    for (const [id, t] of moc) { const k = Math.floor(t / MS_KHUC); (net[k] ??= []).push([id, t - k * MS_KHUC]) }
    await taiKhuc(o.r2, 300, { thieu: o.thieu, net })
  }
  if (o.tat !== false) { luc(300_000); await ph.gui(gv, { t: 'live-tat' }) }
  return b
}

describe('Phòng ghi nhật ký + trạng thái ghi', () => {
  it('view của bảng có `live.ghi`; máy ghi báo đang-ghi ⇒ bảng thấy; tắt live ⇒ về «tat»; công tắc tắt ⇒ không có trường', async () => {
    const r2 = taoR2Gia(), b = await taoBuoiGia({ r2 }); dong.push(b)
    expect(viewCuoi(b.gv).live.ghi).toBe('tat')
    await b.ph.gui(b.gv, { t: 'live-bat' })
    await b.ph.gui(b.gv, { t: 'live-ghi', tt: 'dang-ghi', dh: T0, p: 'p1' })
    expect(viewCuoi(b.gv).live.ghi).toBe('dang-ghi')
    expect(viewCuoi(b.hs[0]!).live.ghi).toBe(true) // máy em: buổi này đang được ghi
    await b.ph.gui(b.gv, { t: 'live-ghi', tt: 'loi', dh: T0, p: 'p1' })
    expect(viewCuoi(b.gv).live.ghi).toBe('loi'); expect(viewCuoi(b.gv).live.bat).toBe(true) // lỗi ghi KHÔNG tắt live
    await b.ph.gui(b.gv, { t: 'live-tat' })
    expect(viewCuoi(b.gv).live.ghi).toBe('tat'); expect(viewCuoi(b.hs[0]!).live.ghi).toBeUndefined()
    await b.ph.post('/khoi', { buoiId: 'b1', lop: '12A1', ds: [], live: { cho: true, sfu: false }, xl: { bat: false, lop: '12A1' } })
    expect('ghi' in viewCuoi(b.gv).live).toBe(false)
  })
})

describe('Chốt buổi ở máy chủ', () => {
  it('dựng đủ 4 tệp + ghi D1; câu CHƯA mở đáp án không có ở đâu (luật an toàn 7)', async () => {
    const r2 = taoR2Gia(), d1 = taoD1That()
    const { ph } = await buoiMau({ r2, DB: d1.env.DB })
    const kq = await chot(ph)
    expect(kq).toMatchObject({ ok: true, du: true, ban: 1 })
    for (const t of ['buoi.json', 'net.bin', 'tieng.mp3', 'su-kien.json']) expect(r2.du.has(`live/b1/${t}`), t).toBe(true)
    const j = docJson(r2), chu = JSON.stringify(j)
    // Hai câu đã mở đáp án; câu 2 (q2) không có thẻ, không có đoạn, không có chữ nào của đề
    expect(j.cau.map((c) => [c.so, c.qid, c.dung, c.soDung, c.soGui])).toEqual([[1, 'q1', 'A', 5, 12], [2, 'q3', 'A', 12, 12]])
    expect(chu).not.toContain('q2'); expect(chu).not.toContain('Đề của q2')
    // Tiếng: 30 khúc × 417 khung, khoảng 150–200 giây bị cắt theo khung (khung 6251..8334), không mã hoá lại
    const so = soKhungTrong(r2.du.get('live/b1/tieng.mp3')!.b)
    expect(so.length).toBe(30 * 417 - 2084); expect(j.byteTieng).toBe(so.length * 144); expect(j.msLive).toBe(so.length * 24)
    expect(so.some((n) => n >= 6251 && n <= 8334)).toBe(false)
    expect(so[0]).toBe(1); expect(so[6249]).toBe(6250); expect(so[6250]).toBe(8335)
    // Nét: đúng hợp đồng net.bin — xếp theo t, mốc đầu { t: 0, byte: 0 } là «bảng mới», nét của câu chưa mở đáp án không có
    const net = docNetBin(r2.du.get('live/b1/net.bin')!.b).muc.map((m) => ({ t: m.t, m: giaiSo(m.khung)! }))
    expect(j.byteNet).toBe(r2.du.get('live/b1/net.bin')!.b.length)
    expect(j.mocBang[0]).toEqual({ t: 0, byte: 0 }); expect(net[0]!.m.k).toBe('bang')
    expect(net.every((x, i) => i === 0 || x.t >= net[i - 1]!.t)).toBe(true)
    expect(net.map((x) => x.m.stt)).toEqual(net.map((_, i) => i + 1)) // số thứ tự đánh lại 1..N
    const id = net.flatMap((x) => (x.m.k === 'net' ? [x.m.net.id] : []))
    expect(id).toContain('truoc-live'); expect(id).toContain('c1-0'); expect(id).toContain('c3-7')
    expect(id.some((x) => x.startsWith('an-'))).toBe(false)
    // nét viết trước live hiện NGAY ở t = 0 (giờ điểm = 0); nét thầy viết lúc live giữ giờ từng điểm
    const truoc = net.find((x) => x.m.k === 'net' && x.m.net.id === 'truoc-live')!.m as { net: { diem: number[][] } }
    expect(truoc.net.diem.every((p) => p[3] === 0)).toBe(true)
    const c30 = net.find((x) => x.m.k === 'net' && x.m.net.id === 'c3-0')!
    expect((c30.m as { net: { diem: number[][] } }).net.diem[5]![3]).toBe(500)
    expect(c30.t).toBe(220_000 - 50_016) // mốc giờ máy thầy ⇒ trục tiếng (đã trừ khoảng cắt 2084 khung)
    // Đoạn: câu 1 lên bảng (e01, Đạt, từ 2 giây trước lúc gọi) + câu 3 thầy chữa (3 giây trước nét đầu)
    expect(j.doan.map((d) => [d.cau, d.loai, d.t0, d.lenBang?.sbd ?? null, d.lenBang?.dat ?? null])).toEqual([[1, 'len_bang', 28_000, 'e01', true], [2, 'thay_chua', 220_000 - 50_016 - 3000, null, null]])
    expect(j.doan[0]!.ten).toBe('Câu 1 · Em 1 lên bảng'); expect(j.doan[0]!.dangXem).toBe('cả lớp sai nhiều nhất')
    expect(j.doan[1]!.t1).toBe(j.msLive); expect(j.doan[1]!.soNet).toBe(8)
    expect(j).toMatchObject({ v: 1, id: 'b1', ban: 1, ngay: '2026-11-10', lop: '12A1', coTieng: true, giayToi: false, tenTuDong: 'Buổi live 12A1' })
    // buoi.json KHÔNG mang kết quả từng em: chỉ có em lên bảng
    expect(chu).not.toContain('e02'); expect(chu).not.toContain('ketQua'); expect(chu).not.toContain('"tra"')
    // D1: một dòng buổi «xong» + hai dòng đoạn
    const dong1 = d1.sql.prepare('SELECT * FROM live_buoi').all() as Record<string, unknown>[]
    expect(dong1).toHaveLength(1)
    expect(dong1[0]).toMatchObject({ id: 'b1', lop: '12A1', ngay: '2026-11-10', trang_thai: 'xong', tien_do: 100, so_cau: 2, so_doan: 2, giay_live: 250, quyen: 'lop', ban: 1, ten_thay: null })
    expect(Number(dong1[0]!.byte)).toBeGreaterThan(j.byteTieng)
    expect((d1.sql.prepare('SELECT stt, loai, sbd_len_bang, dat, dang_xem FROM live_doan ORDER BY stt').all() as unknown[])).toEqual([{ stt: 1, loai: 'len_bang', sbd_len_bang: 'e01', dat: 1, dang_xem: 1 }, { stt: 2, loai: 'thay_chua', sbd_len_bang: null, dat: null, dang_xem: 0 }])
    // kết quả các lượt đã mở đáp án vào `bpu_luot` ngay lúc chốt (em xem «Em làm đúng / chưa đúng» mà không cần chờ kết thúc buổi)
    // (D1 giả dùng lại MỘT câu lệnh cho mọi `bind` của lô ⇒ chỉ đếm được «có ghi», không đếm đủ 36 dòng.)
    expect(d1.dem('bpu_luot', "buoi_id = 'b1'")).toBeGreaterThan(0)
    // su-kien.json có nhật ký thô nhưng KHÔNG mang đáp án
    expect(new TextDecoder().decode(r2.du.get('live/b1/su-kien.json')!.b)).not.toContain('"dung"')
  })

  it('chốt chạy lại nhiều lần cho CÙNG kết quả (bản dựng không tăng, tệp không đổi)', async () => {
    const r2 = taoR2Gia(), d1 = taoD1That()
    const { ph } = await buoiMau({ r2, DB: d1.env.DB })
    await chot(ph)
    const chup = () => ['buoi.json', 'net.bin', 'tieng.mp3'].map((t) => Buffer.from(r2.du.get(`live/b1/${t}`)!.b).toString('base64'))
    const lan1 = chup(), d1Truoc = d1.chup('live_doan')
    luc(400_000)
    expect(await chot(ph)).toMatchObject({ ok: true, du: true, ban: 1, doi: false })
    expect(chup()).toEqual(lan1); expect(d1.chup('live_doan')).toBe(d1Truoc)
    // «Dựng lại» (ép): cùng nội dung, bản dựng +1 để máy em bỏ bản đệm cũ
    expect(await chot(ph, { ep: true })).toMatchObject({ ok: true, ban: 2 })
    const j = docJson(r2)
    expect(j.ban).toBe(2); expect({ ...j, ban: 1 }).toEqual(JSON.parse(Buffer.from(lan1[0]!, 'base64').toString()))
  })

  it('máy thầy tắt đột ngột giữa lúc live: mất kết nối 3 phút ⇒ phòng tự tắt live rồi chốt, khúc đã tải còn nguyên', async () => {
    const r2 = taoR2Gia(), d1 = taoD1That()
    const { ph, gv } = await buoiMau({ r2, DB: d1.env.DB, tat: false })
    luc(290_000); await ph.dong(gv)
    luc(300_000); expect(await ph.post('/xl-soat', {})).toMatchObject({ ok: true, live: true })
    luc(420_000); expect(await ph.post('/xl-soat', {})).toMatchObject({ ok: true, live: true }) // mới 2 phút
    luc(485_000); expect(await ph.post('/xl-soat', {})).toMatchObject({ ok: true, tuTat: true })
    expect(await chot(ph)).toMatchObject({ ok: true, du: true })
    const j = docJson(r2)
    expect(j.cau).toHaveLength(2); expect(j.tatLuc).toBe(new Date(T0 + 485_000).toISOString())
    // 30 khúc đã tải còn nguyên; phần sau khúc cuối tới lúc phòng tắt live được lấp khung câm (trục tiếng vẫn khớp nét)
    const so = soKhungTrong(r2.du.get('live/b1/tieng.mp3')!.b)
    expect(so.filter((n) => n > 0).length).toBe(30 * 417 - 2084); expect(so.filter((n) => n === 0).length).toBeGreaterThan(7000)
  })

  it('thiếu vài khúc ở giữa: lấp khung câm đúng thời lượng, ghi khoảng mất tiếng, nét vẫn chạy đúng giờ', async () => {
    const r2 = taoR2Gia()
    const { ph } = await buoiMau({ r2, thieu: [4, 5] })
    await chot(ph)
    const so = soKhungTrong(r2.du.get('live/b1/tieng.mp3')!.b), j = docJson(r2)
    expect(so.length).toBe(30 * 417 - 2084)
    expect(so.slice(4 * 417, 6 * 417).every((n) => n === 0)).toBe(true); expect(so[6 * 417]).toBe(6 * 417 + 1)
    expect(JSON.parse(new TextDecoder().decode(r2.du.get('live/b1/su-kien.json')!.b)).matTieng).toEqual([[4 * MS_KHUC, 6 * MS_KHUC]])
    expect(j.doan[0]!.t0).toBe(28_000)
  })

  it('khúc tải bù sau khi đã chốt ⇒ dựng lại, bản dựng +1, tiếng đủ', async () => {
    const r2 = taoR2Gia(), d1 = taoD1That()
    const { ph } = await buoiMau({ r2, DB: d1.env.DB, thieu: [4] })
    expect(await chot(ph)).toMatchObject({ ban: 1 })
    await datKhuc(r2, 'b1', 'p1', 4, khucGia({ t0: T0 - LECH + 4 * MS_KHUC, soDau: 4 * 417 + 1 }))
    expect(await ph.post('/xl-bu', {})).toEqual({ ok: true })
    expect(await chot(ph)).toMatchObject({ ok: true, ban: 2, doi: true })
    const so = soKhungTrong(r2.du.get('live/b1/tieng.mp3')!.b)
    expect(so.includes(0)).toBe(false); expect(docJson(r2).ban).toBe(2)
    expect(d1.sql.prepare('SELECT ban, trang_thai FROM live_buoi').all()).toEqual([{ ban: 2, trang_thai: 'xong' }])
  })

  // 11/11 — thầy trên bản sống: «kết thúc live chưa thấy có bản ghi». Trước: live dưới 2 phút / chưa có đoạn ⇒ dòng `live_buoi` bị XOÁ im lặng. Nay: KHÔNG BAO GIỜ
  // bỏ im một buổi đã live — dòng luôn có trong «Lịch sử Live» của thầy (xong, 0 đoạn, kèm lý do); máy em chỉ thấy buổi có từ 1 đoạn.
  it('buổi đã live mà chưa có đoạn nào ⇒ VẪN có dòng «xong · 0 đoạn» kèm lý do (không xoá im); chốt lại vẫn một dòng; kết thúc buổi dòng còn nguyên', async () => {
    const r2 = taoR2Gia(), d1 = taoD1That(), b = await taoBuoiGia({ r2, DB: d1.env.DB }); dong.push(b)
    const dongD1 = () => d1.sql.prepare('SELECT trang_thai, so_cau, so_doan, giay_live, ly_do FROM live_buoi').all() as Record<string, unknown>[]
    // (1) live 10 giây rồi tắt ⇒ «live dưới 15 giây»
    luc(0); await b.ph.gui(b.gv, { t: 'live-bat' }); await b.ph.gui(b.gv, { t: 'live-ghi', tt: 'dang-ghi', dh: T0 - LECH, p: 'p1' })
    await datKhuc(r2, 'b1', 'p1', 0, khucGia({ t0: T0 - LECH, soDau: 1 }))
    luc(10_000); await b.ph.gui(b.gv, { t: 'live-tat' })
    await choXl(b.ph)
    expect(d1.sql.prepare('SELECT trang_thai FROM live_buoi').all()).toEqual([{ trang_thai: 'dang_xu_ly' }])
    expect(await chot(b.ph)).toMatchObject({ ok: true, du: false, lyDo: 'ngan' })
    expect(dongD1()).toEqual([{ trang_thai: 'xong', so_cau: 0, so_doan: 0, giay_live: 10, ly_do: 'ngan' }])
    expect(r2.du.has('live/b1/buoi.json')).toBe(false)
    // (2) live lại 60 giây, có câu nhưng thầy không mở đáp án, không gọi ai, không bật bảng ⇒ «chưa câu nào được chữa»
    luc(100_000); await b.ph.gui(b.gv, { t: 'live-bat' }); await b.ph.gui(b.gv, { t: 'live-ghi', tt: 'dang-ghi', dh: T0 + 100_000 - LECH, p: 'p2' })
    luc(101_000); await b.ph.post('/luot', CAU_GIA('q1'))
    await b.ph.gui(b.hs[0]!, { t: 'tra', chon: 'A' })
    for (let i = 0; i < 6; i++) await datKhuc(r2, 'b1', 'p2', i, khucGia({ t0: T0 + 100_000 - LECH + i * MS_KHUC, soDau: 1000 + i * 417 }))
    luc(160_000); await b.ph.gui(b.gv, { t: 'live-tat' })
    expect(await chot(b.ph)).toMatchObject({ ok: true, du: false, lyDo: 'khong-cau' })
    expect(dongD1()).toEqual([{ trang_thai: 'xong', so_cau: 0, so_doan: 0, giay_live: 70, ly_do: 'khong-cau' }])
    // (3) thầy mở đáp án (live đã tắt) nhưng không chữa gì ⇒ có câu, chưa có đoạn: «phần chữa quá ngắn»; khúc + nhật ký vẫn giữ (dựng lại được)
    luc(170_000); await b.ph.gui(b.gv, { t: 'mo' })
    expect(await chot(b.ph)).toMatchObject({ ok: true, du: false, lyDo: 'khong-doan' })
    expect(dongD1()).toEqual([{ trang_thai: 'xong', so_cau: 1, so_doan: 0, giay_live: 70, ly_do: 'khong-doan' }])
    expect([...r2.du.keys()].some((k) => k.startsWith('live/b1/k/'))).toBe(true); expect(r2.du.has('live/b1/buoi.json')).toBe(false)
    // chốt lại bao nhiêu lần cũng MỘT dòng
    await chot(b.ph); expect(d1.dem('live_buoi')).toBe(1)
    // (4) kết thúc buổi mà vẫn chưa có đoạn ⇒ dòng CÒN NGUYÊN (không xoá im), khúc thô chờ cron dọn sau 24 giờ như mọi buổi
    await b.ph.post('/dong', {})
    expect(await chot(b.ph)).toMatchObject({ du: false, lyDo: 'khong-doan' })
    expect(dongD1()).toEqual([{ trang_thai: 'xong', so_cau: 1, so_doan: 0, giay_live: 70, ly_do: 'khong-doan' }])
  })

  it('live có câu nhưng không thu được tiếng và không có nét ⇒ dòng 0 đoạn với lý do «khong-tieng-net»', async () => {
    const r2 = taoR2Gia(), d1 = taoD1That(), b = await taoBuoiGia({ r2, DB: d1.env.DB }); dong.push(b)
    luc(0); await b.ph.gui(b.gv, { t: 'live-bat' })
    luc(1000); await b.ph.post('/luot', CAU_GIA('q1'))
    await b.ph.gui(b.hs[0]!, { t: 'tra', chon: 'A' })
    luc(5000); await b.ph.gui(b.gv, { t: 'goi', sbd: 'e01', lyDo: [] })
    luc(60_000); await b.ph.gui(b.gv, { t: 'live-tat' })
    expect(await chot(b.ph)).toMatchObject({ ok: true, du: false, lyDo: 'khong-tieng-net' })
    expect(d1.sql.prepare('SELECT trang_thai, so_cau, so_doan, giay_live, ly_do FROM live_buoi').all()).toEqual([{ trang_thai: 'xong', so_cau: 1, so_doan: 0, giay_live: 60, ly_do: 'khong-tieng-net' }])
  })

  // Đúng ca của thầy 11/11: live thử khoảng 40 giây, mic câm (mọi ô mức âm = 0), thầy bật bảng live và viết, KHÔNG bấm mở đáp án.
  it('live 40 giây có nét, mic câm ⇒ có buổi, có đoạn, `coTieng: false`; câu chưa mở đáp án vào theo đường «đã chữa trên bảng» (không đáp án, không lời giải)', async () => {
    for (const coKhuc of [true, false]) {
      const r2 = taoR2Gia(), d1 = taoD1That(), b = await taoBuoiGia({ r2, DB: d1.env.DB }); dong.push(b)
      const { ph, gv, hs } = b
      await guiBangMoi(ph, gv)
      luc(0); await ph.gui(gv, { t: 'live-bat' }); await ph.gui(gv, { t: 'live-ghi', tt: 'dang-ghi', dh: T0 - LECH, p: 'p1' })
      luc(2000); await ph.post('/luot', CAU_GIA('q1'))
      for (let i = 0; i < 4; i++) { luc(4000 + i * 100); await ph.gui(hs[i]!, { t: 'tra', chon: i < 3 ? 'A' : 'B' }) } // 3/4 đúng
      luc(8000); await ph.gui(gv, { t: 'live-dat', bang: true }) // thầy BẬT TAY bảng live cho câu này
      for (let i = 0; i < 6; i++) { luc(12_000 + i * 2000); await guiNet(ph, gv, netGia(`n-${i}`)) }
      luc(26_000); await ph.gui(hs[4]!, { t: 'tra', chon: 'A' }) // em gửi muộn: tỉ lệ lớp trong ảnh chụp kín được làm mới ⇒ 4/5
      if (coKhuc) for (let i = 0; i < 4; i++) await datKhuc(r2, 'b1', 'p1', i, khucGia({ t0: T0 - LECH + i * MS_KHUC, soDau: i * 417 + 1, muc: 0 })) // mic câm
      luc(40_000); await ph.gui(gv, { t: 'live-tat' })
      const kq = await chot(ph)
      expect(kq, `coKhuc=${coKhuc}`).toMatchObject({ ok: true, du: true, ban: 1, soCau: 1, soDoan: 1 })
      const j = docJson(r2), chu = JSON.stringify(j)
      expect(j.coTieng).toBe(false); expect(j.byteTieng).toBe(0); expect(r2.du.has('live/b1/tieng.mp3')).toBe(false)
      expect(j.msLive).toBeGreaterThan(39_000); expect(j.msLive).toBeLessThan(41_000)
      expect(j.doan).toMatchObject([{ loai: 'thay_chua', cau: 1, soNet: 6, lenBang: null }])
      // AN TOÀN: câu chưa mở đáp án ⇒ `dung` rỗng, `giai` null, có cờ `moDapAn: false`; tỉ lệ lớp vẫn có; không có kết quả từng em
      expect(j.cau).toMatchObject([{ so: 1, qid: 'q1', dung: '', giai: null, moDapAn: false, soDung: 4, soGui: 5 }])
      expect(chu).not.toContain('"tra"'); expect(chu).not.toContain('ketQua'); expect(chu).not.toContain('Lời giải q1')
      expect(new TextDecoder().decode(r2.du.get('live/b1/su-kien.json')!.b)).not.toContain('"dung"')
      const net = docNetBin(r2.du.get('live/b1/net.bin')!.b).muc.flatMap((m) => { const g = giaiSo(m.khung)!; return g.k === 'net' ? [g.net.id] : [] })
      expect(net).toEqual(expect.arrayContaining(['n-0', 'n-5']))
      expect(d1.sql.prepare('SELECT trang_thai, so_cau, so_doan FROM live_buoi').all()).toEqual([{ trang_thai: 'xong', so_cau: 1, so_doan: 1 }])
    }
  })

  // LUẬT AN TOÀN 7 sau 11/11 (thầy: «kết thúc live chưa thấy có bản ghi» ⇒ câu thầy đã chữa trên bảng phải vào, dù chưa bấm mở đáp án):
  //   · câu ĐÃ mở đáp án ⇒ vào đủ (đáp án + lời giải);
  //   · câu CHƯA mở đáp án nhưng đã GỌI EM LÊN BẢNG hoặc bảng live đang bật ⇒ vào, KHÔNG đáp án, KHÔNG lời giải;
  //   · câu chưa mở đáp án VÀ chưa từng lên bảng / bảng live ⇒ vẫn bị loại, cắt khỏi tiếng + nét (như trước).
  it('luật an toàn 7 (bản 11/11): gọi em lên bảng mà chưa mở đáp án ⇒ câu vào KHÔNG kèm đáp án; câu chưa chữa gì ⇒ vẫn bị cắt khỏi tiếng + nét', async () => {
    const r2 = taoR2Gia(), d1 = taoD1That(), b = await taoBuoiGia({ r2, DB: d1.env.DB }); dong.push(b)
    const { ph, gv, hs } = b
    await guiBangMoi(ph, gv)
    luc(0); await ph.gui(gv, { t: 'live-bat' }); await ph.gui(gv, { t: 'live-ghi', tt: 'dang-ghi', dh: T0 - LECH, p: 'p1' })
    luc(2000); await ph.post('/luot', CAU_GIA('q1')) // câu 1: gọi e02 lên bảng, chấm Đạt, KHÔNG mở đáp án
    for (let i = 0; i < 6; i++) await ph.gui(hs[i]!, { t: 'tra', chon: i < 2 ? 'A' : 'C' })
    luc(10_000); await ph.gui(gv, { t: 'goi', sbd: 'e02', lyDo: [] })
    for (let i = 0; i < 4; i++) { luc(15_000 + i * 2000); await guiNet(ph, gv, netGia(`len-${i}`)) }
    luc(50_000); await ph.gui(gv, { t: 'dat', v: true })
    luc(60_000); await ph.post('/luot', { ...CAU_GIA('q2'), bo: true }) // câu 2: không mở đáp án, không gọi ai, bảng live tắt ⇒ LOẠI
    luc(60_500); await ph.gui(gv, { t: 'live-dat', bang: false })
    for (let i = 0; i < 6; i++) await ph.gui(hs[i]!, { t: 'tra', chon: 'A' })
    for (let i = 0; i < 3; i++) { luc(70_000 + i * 2000); await guiNet(ph, gv, netGia(`an-${i}`)) }
    luc(100_000); await ph.post('/luot', { ...CAU_GIA('q3'), bo: true }) // câu 3: mở đáp án bình thường
    for (let i = 0; i < 6; i++) await ph.gui(hs[i]!, { t: 'tra', chon: 'A' })
    luc(110_000); await ph.gui(gv, { t: 'mo' })
    await taiKhuc(r2, 130)
    luc(130_000); await ph.gui(gv, { t: 'live-tat' })
    expect(await chot(ph)).toMatchObject({ ok: true, du: true, soCau: 2 })
    const j = docJson(r2), chu = JSON.stringify(j)
    expect(j.cau.map((c) => [c.so, c.qid, c.dung, c.moDapAn, c.soDung, c.soGui])).toEqual([[1, 'q1', '', false, 2, 6], [2, 'q3', 'A', undefined, 6, 6]])
    expect(j.cau[0]!.giai).toBeNull(); expect(chu).not.toContain('Lời giải q1'); expect(chu).toContain('Lời giải q3')
    expect(j.doan[0]).toMatchObject({ loai: 'len_bang', cau: 1, lenBang: { sbd: 'e02', dat: true }, soNet: 4 })
    // câu 2 (q2) không có thẻ, không có chữ nào của đề, nét của nó không có, tiếng 60–100 giây bị cắt theo khung
    expect(chu).not.toContain('q2'); expect(chu).not.toContain('Đề của q2')
    const id = docNetBin(r2.du.get('live/b1/net.bin')!.b).muc.flatMap((m) => { const g = giaiSo(m.khung)!; return g.k === 'net' ? [g.net.id] : [] })
    expect(id).toContain('len-0'); expect(id.some((x) => x.startsWith('an-'))).toBe(false)
    const so = soKhungTrong(r2.du.get('live/b1/tieng.mp3')!.b)
    expect(so.some((n) => n > 2502 && n < 4166)).toBe(false) // khung của 60–100 giây (2501 … 4167, trừ mép làm tròn)
    expect(so).toContain(2400); expect(so).toContain(4300)
    expect(j.msLive).toBeGreaterThan(88_000); expect(j.msLive).toBeLessThan(92_000)
    // chốt lại ⇒ cùng kết quả (bản dựng không tăng)
    expect(await chot(ph)).toMatchObject({ du: true, doi: false })
  })

  it('thầy mở đáp án SAU khi đã tắt live ⇒ dựng lại, câu ấy xuất hiện; bật live lại trong cùng buổi ⇒ nối tiếp một buổi', async () => {
    const r2 = taoR2Gia(), d1 = taoD1That(), b = await taoBuoiGia({ r2, DB: d1.env.DB }); dong.push(b)
    const { ph, gv, hs } = b
    luc(0); await ph.gui(gv, { t: 'live-bat' }); await ph.gui(gv, { t: 'live-ghi', tt: 'dang-ghi', dh: T0 - LECH, p: 'p1' })
    luc(2000); await ph.post('/luot', CAU_GIA('q1'))
    await ph.gui(hs[0]!, { t: 'tra', chon: 'A' })
    luc(10_000); await ph.gui(gv, { t: 'goi', sbd: 'e02', lyDo: [] })
    luc(100_000); await ph.gui(gv, { t: 'mo' })
    luc(140_000); await ph.post('/luot', CAU_GIA('q2'))
    await ph.gui(hs[0]!, { t: 'tra', chon: 'A' })
    luc(150_000); await ph.gui(gv, { t: 'goi', sbd: 'e03', lyDo: [] })
    await taiKhuc(r2, 240)
    luc(240_000); await ph.gui(gv, { t: 'live-tat' })
    // 11/11 (thầy: «kết thúc live chưa thấy có bản ghi»): câu 2 CHƯA mở đáp án nhưng thầy đã gọi e03 lên bảng ⇒ đã vào trang xem lại, KHÔNG kèm đáp án.
    // (Trước 11/11 chỗ này khẳng định câu 2 chưa có ở đâu cho tới khi mở đáp án — đổi có chủ đích theo luật mới.)
    expect(await chot(ph)).toMatchObject({ du: true, ban: 1, soCau: 2 })
    expect(docJson(r2).cau.map((c) => [c.qid, c.dung, c.giai, c.moDapAn])).toEqual([['q1', 'A', docJson(r2).cau[0]!.giai, undefined], ['q2', '', null, false]])
    luc(260_000); await ph.gui(gv, { t: 'mo' }) // mở đáp án câu 2 khi live đã tắt ⇒ dựng lại, lúc này mới có đáp án
    expect(await chot(ph)).toMatchObject({ du: true, ban: 2, soCau: 2 })
    expect(docJson(r2).cau.map((c) => [c.qid, c.dung, c.moDapAn])).toEqual([['q1', 'A', undefined], ['q2', 'A', undefined]])
    expect(docJson(r2).doan.map((d) => [d.cau, d.lenBang?.sbd])).toEqual([[1, 'e02'], [2, 'e03']])
    // bật live lại 60 giây (phiên máy ghi mới) rồi tắt ⇒ vẫn MỘT buổi, trục tiếng nối liền
    luc(600_000); await ph.gui(gv, { t: 'live-bat' }); await ph.gui(gv, { t: 'live-ghi', tt: 'dang-ghi', dh: T0 + 600_000 - LECH, p: 'p2' })
    await choXl(ph)
    expect(d1.sql.prepare('SELECT trang_thai FROM live_buoi').all()).toEqual([{ trang_thai: 'dang_ghi' }])
    for (let i = 0; i < 6; i++) await datKhuc(r2, 'b1', 'p2', i, khucGia({ t0: T0 + 600_000 - LECH + i * MS_KHUC, soDau: 100_000 + i * 417 }))
    luc(660_000); await ph.gui(gv, { t: 'live-tat' })
    expect(await chot(ph)).toMatchObject({ du: true, ban: 3 })
    const j = docJson(r2)
    expect(d1.dem('live_buoi')).toBe(1); expect(j.msLive).toBeGreaterThan(299_000); expect(j.msLive).toBeLessThan(301_500)
    expect(j.batLuc).toBe(new Date(T0).toISOString()); expect(j.tatLuc).toBe(new Date(T0 + 660_000).toISOString())
  })

  it('buổi dài: chốt chia nhiều bước + tải nhiều phần 5 MiB cho ra đúng tệp như chốt một lượt', async () => {
    const dung = async (buoc: number) => {
      const r2 = taoR2Gia(), b = await taoBuoiGia({ r2 }); dong.push(b)
      luc(0); await b.ph.gui(b.gv, { t: 'live-bat' }); await b.ph.gui(b.gv, { t: 'live-ghi', tt: 'dang-ghi', dh: T0 - LECH, p: 'p1' })
      luc(1000); await b.ph.post('/luot', CAU_GIA('q1'))
      await b.ph.gui(b.hs[0]!, { t: 'tra', chon: 'A' })
      luc(5000); await b.ph.gui(b.gv, { t: 'goi', sbd: 'e01', lyDo: [] })
      luc(900_000); await b.ph.gui(b.gv, { t: 'mo' })
      const so = await taiKhuc(r2, 960)
      luc(960_000); await b.ph.gui(b.gv, { t: 'live-tat' })
      BUOC_CHOT.khuc = buoc
      const kq = await chot(b.ph)
      return { r2, kq, so }
    }
    const mot = await dung(300), nhieu = await dung(25)
    expect(mot.so).toBe(96); expect(mot.kq).toMatchObject({ du: true, ban: 1 }); expect(nhieu.kq).toMatchObject({ du: true, ban: 1 })
    const a = mot.r2.du.get('live/b1/tieng.mp3')!.b, c = nhieu.r2.du.get('live/b1/tieng.mp3')!.b
    expect(a.length).toBe(96 * 417 * 144); expect(a.length).toBeGreaterThan(5 * 1024 * 1024)
    expect(Buffer.compare(Buffer.from(a), Buffer.from(c))).toBe(0)
    expect(soKhungTrong(c).every((n, i) => n === i + 1)).toBe(true)
    expect(nhieu.r2.dem.phan).toBeGreaterThanOrEqual(2); expect(nhieu.r2.tai.size).toBe(0) // phần tải lên đã hoàn tất, không còn dở
    expect([...nhieu.r2.du.keys()].some((k) => k.includes('/tam/'))).toBe(false)
  })

  it('dọn sau 24 giờ: xoá khúc thô + nhật ký của phòng, giữ 4 tệp; sau đó «Dựng lại» báo đã dọn', async () => {
    const r2 = taoR2Gia()
    const { ph } = await buoiMau({ r2 })
    await chot(ph)
    expect(await ph.post('/xl-don', {})).toEqual({ ok: true })
    expect([...r2.du.keys()].sort()).toEqual(['live/b1/buoi.json', 'live/b1/net.bin', 'live/b1/su-kien.json', 'live/b1/tieng.mp3'])
    expect(await chot(ph, { ep: true })).toMatchObject({ ok: false, lyDo: 'da-don' })
  })
})
