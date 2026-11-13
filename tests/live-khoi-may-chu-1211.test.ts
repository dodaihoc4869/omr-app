// LIVE THEO KHỐI (12/11) — máy chủ: lịch theo khối (thuần), cờ `khoi` của phòng, kênh lớp (chat + trò) chuyển tiếp trong bộ nhớ.
import { describe, expect, it, vi } from 'vitest'
import { docDsLich, donLich, khoiTuLop, lichChoEm, type LichLiveMc } from '../server/src/live-khoi'
import { KenhLopMay } from '../server/src/kenh-lop-may'
import { chuanKhoi, liveDat, viewLiveBang, viewLiveEm } from '../src/lib/bpu/phong-live'
import { taoPhong, vaoLop, type TrangThaiPhong } from '../src/lib/bpu/phong'
import { saoBuoi, xepHangDoi } from '../src/lib/live-khoi/vinh-danh'
import { VAN_MS } from '../src/lib/live-khoi/sinh-ton-loi'
import { tenMay } from '../src/lib/live-khoi/ten-may'

const NAY = Date.UTC(2026, 10, 12, 12, 0, 0)
const lich = (o: Partial<LichLiveMc>): LichLiveMc => ({ id: 'a', khoi: 12, batDau: NAY, ten: '', trangThai: 'hen', luc: NAY, ...o })

describe('lịch live theo khối', () => {
  it('khối đọc từ lớp của em', () => {
    expect(khoiTuLop('12')).toBe(12); expect(khoiTuLop('11A2')).toBe(11); expect(khoiTuLop('Lớp 10 chuyên')).toBe(10)
    expect(khoiTuLop('12 - Lớp Thường')).toBe(12); expect(khoiTuLop('11 - Tinh Hoa')).toBe(11)
    expect(khoiTuLop('')).toBeNull(); expect(khoiTuLop('9A')).toBeNull(); expect(khoiTuLop('112')).toBeNull()
  })
  it('đọc JSON hỏng / sai dạng ⇒ bỏ dòng sai, không ném lỗi', () => {
    expect(docDsLich('không phải json')).toEqual([])
    expect(docDsLich(JSON.stringify([{ id: 'x', khoi: 13, batDau: 1, trangThai: 'hen' }, { id: 'y', khoi: 11, batDau: 5, trangThai: 'cho', buoiId: 'b1' }]))).toEqual([{ id: 'y', khoi: 11, batDau: 5, ten: '', trangThai: 'cho', buoiId: 'b1', luc: 5 }])
  })
  it('dọn: buổi xong bị gỡ, phòng bỏ quên quá 6 giờ bị gỡ, lịch hẹn quá 24 giờ bị gỡ', () => {
    const ds = [lich({ id: 'xong', trangThai: 'xong' }), lich({ id: 'quen', trangThai: 'dang', luc: NAY - 7 * 3_600_000 }), lich({ id: 'cu', batDau: NAY - 25 * 3_600_000 }), lich({ id: 'con', batDau: NAY + 3_600_000 })]
    expect(donLich(ds, NAY).map((x) => x.id)).toEqual(['con'])
  })
  it('máy em: đúng khối mới thấy; phòng đang mở thắng lịch hẹn; hẹn trễ quá 30 phút thì thôi hiện', () => {
    const ds = [lich({ id: 'h12', batDau: NAY + 3_600_000 }), lich({ id: 'c12', trangThai: 'cho', buoiId: 'b' }), lich({ id: 'h11', khoi: 11, batDau: NAY - 31 * 60_000 })]
    expect(lichChoEm(ds, 12, NAY)?.id).toBe('c12')
    expect(lichChoEm(ds, 10, NAY)).toBeNull()
    expect(lichChoEm(ds, null, NAY)?.id).toBe('c12') // tài khoản thử của thầy: mọi khối
    expect(lichChoEm([lich({ id: 'c10', khoi: 10, trangThai: 'dang', buoiId: 'b' })], null, NAY)?.id).toBe('c10')
    expect(lichChoEm(ds, 11, NAY)).toBeNull()
    expect(lichChoEm([lich({ id: 'h11', khoi: 11, batDau: NAY - 29 * 60_000 })], 11, NAY)?.id).toBe('h11')
  })
})

function phong(): TrangThaiPhong {
  const st = taoPhong({ buoiId: 'b1', lop: 'Live Khối 12', ds: [{ sbd: 'S1', ten: 'Minh Anh', coMat: true, luc: NAY }, { sbd: 'S2', ten: 'Hải Đăng', coMat: true, luc: NAY }, { sbd: 'S3', ten: 'Lan Anh', coMat: false, luc: null }], nay: NAY })
  st.live = { cho: true, sfu: false, san: false, bat: false, tu: null, phien: 0, ss: null, tay: [], noi: [], xa: false, tiengLop: true, soNet: 0, nhip: 0 }
  return st
}
describe('cờ khối của phòng', () => {
  it('chuẩn hoá: sai dạng ⇒ giữ, null ⇒ gỡ', () => {
    expect(chuanKhoi({ k: 12, gd: 'dang', che: 'bang' })).toEqual({ k: 12, gd: 'dang', che: 'bang' })
    expect(chuanKhoi({ k: 12 })).toEqual({ k: 12, gd: 'cho', che: 'hoc' })
    expect(chuanKhoi({ k: 9 })).toBeUndefined(); expect(chuanKhoi('x')).toBeUndefined(); expect(chuanKhoi(null)).toBeNull()
  })
  it('thầy đặt khối TRƯỚC khi bật live; bản xem của bảng và của em có mặt mang cờ; em chưa vào thì không', () => {
    const st = phong()
    expect(liveDat(st, { khoi: { k: 12, gd: 'cho', che: 'hoc' } }, NAY)).toBe(true)
    expect(liveDat(st, { khoi: { k: 12, gd: 'cho', che: 'hoc' } }, NAY)).toBe(false)
    expect(viewLiveBang(st)?.khoi).toEqual({ k: 12, gd: 'cho', che: 'hoc' })
    expect(viewLiveEm(st, 'S1')?.khoi).toEqual({ k: 12, gd: 'cho', che: 'hoc' })
    expect(viewLiveEm(st, 'S3')?.khoi).toBeUndefined()
  })
  it('chế độ Bảng khi đang live ⇒ máy em có mặt hiện bảng; về Học ⇒ thôi', () => {
    const st = phong()
    liveDat(st, { khoi: { k: 12, gd: 'dang', che: 'bang' } }, NAY)
    st.live!.bat = true
    expect(viewLiveEm(st, 'S1')?.bang).toBe(true)
    liveDat(st, { khoi: { k: 12, gd: 'dang', che: 'hoc' } }, NAY)
    expect(viewLiveEm(st, 'S1')?.bang).toBe(false)
  })
  it('buổi dạy trên lớp (không cờ khối): bản xem không có `khoi`', () => {
    const st = phong()
    expect(viewLiveBang(st)).not.toHaveProperty('khoi')
    expect(viewLiveEm(st, 'S1')).not.toHaveProperty('khoi')
  })
})

interface Ws { tin: string[]; send(d: string): void }
const taoWs = (): Ws => ({ tin: [], send(d) { this.tin.push(d) } })
function kenhGia(gd: 'cho' | 'dang' = 'dang') {
  const st = phong()
  liveDat(st, { khoi: { k: 12, gd, che: 'hoc' } }, NAY)
  const hs1 = taoWs(), hs2 = taoWs(), gv = taoWs()
  const ctx = { getWebSockets: (tag?: string) => (tag === 'gv' ? [gv] : [hs1, hs2]) }
  const k = new KenhLopMay(ctx as never, () => st)
  const em = (w: Ws, s: string, j: unknown, nay = NAY) => k.tin(w as never, { v: 'hs', s }, j as never, st, nay)
  const thay = (j: unknown, nay = NAY) => k.tin(gv as never, { v: 'gv', s: '' }, j as never, st, nay)
  return { st, k, hs1, hs2, gv, em, thay }
}
const doc = (w: Ws) => w.tin.map((x) => JSON.parse(x) as Record<string, unknown>)

describe('kênh lớp', () => {
  it('tin không thuộc kênh lớp ⇒ trả false (để phòng xử lý tiếp)', () => {
    const { em, hs1 } = kenhGia()
    expect(em(hs1, 'S1', { t: 'tra', chon: 'A' })).toBe(false)
  })
  it('chat: phòng đóng dấu người gửi, cắt 200 ký tự, phát cho MỌI máy kể cả thầy', () => {
    const { em, hs1, hs2, gv } = kenhGia()
    em(hs1, 'S1', { t: 'lop', k: 'chat', x: { c: '  ' + 'a'.repeat(300) } })
    for (const w of [hs1, hs2, gv]) {
      const t = doc(w)[0]!
      expect(t).toMatchObject({ t: 'lop', k: 'chat', s: 'S1', n: 'Minh Anh' })
      expect((t.x as { c: string }).c).toHaveLength(200)
    }
  })
  it('chat: em gửi dồn dập ⇒ chỉ 1 tin / 2 giây; thầy không bị giới hạn', () => {
    const { em, thay, hs1, gv } = kenhGia()
    em(hs1, 'S1', { t: 'lop', k: 'chat', x: { c: 'một' } }, NAY)
    em(hs1, 'S1', { t: 'lop', k: 'chat', x: { c: 'hai' } }, NAY + 500)
    em(hs1, 'S1', { t: 'lop', k: 'chat', x: { c: 'ba' } }, NAY + 2100)
    thay({ t: 'lop', k: 'chat', x: { c: 'thầy 1' } }, NAY + 2200); thay({ t: 'lop', k: 'chat', x: { c: 'thầy 2' } }, NAY + 2201)
    expect(doc(gv).map((t) => (t.x as { c: string }).c)).toEqual(['một', 'ba', 'thầy 1', 'thầy 2'])
    expect(new Set(doc(gv).map((t) => t.l)).size).toBe(4)
  })
  it('chat: thầy tắt nhắn tin ⇒ tin của em bị bỏ; em không tự tắt / mở được', () => {
    const { em, thay, hs1, hs2 } = kenhGia()
    em(hs1, 'S1', { t: 'lop', k: 'chat', x: { tat: true } })
    expect(hs2.tin).toHaveLength(0)
    thay({ t: 'lop', k: 'chat', x: { tat: true } })
    em(hs1, 'S1', { t: 'lop', k: 'chat', x: { c: 'em nhắn' } })
    expect(doc(hs2)).toHaveLength(1)
    expect(doc(hs2)[0]).toMatchObject({ s: 'gv', x: { tat: true } })
  })
  it('chat: em chưa vào lớp / em không có trong phòng ⇒ không gửi được; máy mới xin ⇒ nhận lại tin cũ', () => {
    const { em, hs1, hs2 } = kenhGia()
    em(hs1, 'S3', { t: 'lop', k: 'chat', x: { c: 'chưa vào' } }); em(hs1, 'LA', { t: 'lop', k: 'chat', x: { c: 'lạ' } })
    expect(hs2.tin).toHaveLength(0)
    em(hs1, 'S1', { t: 'lop', k: 'chat', x: { c: 'chào' } })
    const moi = taoWs()
    em(moi, 'S2', { t: 'lop', k: 'chat', x: { xin: 1 } })
    expect(doc(moi).map((t) => (t.x as { c: string }).c)).toEqual(['chào'])
  })
  it('buổi trên lớp (không cờ khối) ⇒ kênh lớp im lặng', () => {
    const { em, hs1, hs2, st } = kenhGia()
    st.live!.khoi = null
    expect(em(hs1, 'S1', { t: 'lop', k: 'chat', x: { c: 'x' } })).toBe(true)
    expect(hs2.tin).toHaveLength(0)
  })
  // Giây thứ 10 của một ván (không rơi vào 5 giây bảng kết quả, không sát mép ván).
  const T0 = Math.ceil(NAY / VAN_MS) * VAN_MS + 10_000
  it('trò Sinh Tồn: chỉ chạy ở phòng chờ; phòng gom vị trí, phát MỘT ảnh chụp mỗi 250 ms, kẹp trong sân, máy bù đủ 4 mỗi đội, ghi lượt hạ khác đội', () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(T0)
      const { em, hs1, hs2, gv, st } = kenhGia('cho')
      vaoLop(st, 'S3', NAY)
      const doi = (s: string) => st.ds.find((e) => e.sbd === s)!.doi
      st.ds.find((e) => e.sbd === 'S2')!.doi = (doi('S1') + 1) % 4
      em(hs1, 'S1', { t: 'lop', k: 'tro', x: { p: [100.4, 9999, 50, 9], t: 'S2' } }, T0)
      em(hs1, 'S1', { t: 'lop', k: 'tro', x: { p: [200, 200, 50, 1] } }, T0 + 50) // quá nhanh ⇒ bỏ
      em(hs2, 'S2', { t: 'lop', k: 'tro', x: { p: [300, 300, 0, 2], a: 'S1', t: 'khong-co' } }, T0 + 60)
      expect(gv.tin).toHaveLength(0)
      vi.advanceTimersByTime(260)
      const anh = doc(hs1).at(-1)!.x as { ds: Record<string, [number, number, number, number, number, string]>; an: unknown[]; d: number[]; v: number; c: number }
      // S1: y kẹp trong sân 2000 (cỡ 0 = 3200 × 2000), cấp kẹp về 6; mục tiêu S2 chưa có lúc gói S1 tới ⇒ bỏ. S2: mục tiêu không có thật ⇒ bỏ.
      expect(anh.ds.S1).toEqual([100, 2000, 50, doi('S1'), 6, ''])
      expect(anh.ds.S2).toEqual([300, 300, 0, doi('S2'), 2, ''])
      expect(anh.an).toEqual([['S1', 'S2']])
      expect(anh.d[doi('S1')]).toBe(1)
      expect(anh.v).toBe(1); expect(anh.c).toBe(0)
      // Hai em thật ở hai đội ⇒ 3 + 3 + 4 + 4 máy; mã máy bắt đầu bằng '~'; 0 lượt D1 (phòng giả không có D1).
      const may = Object.keys(anh.ds).filter((id) => id.startsWith('~'))
      expect(may).toHaveLength(14)
      // Máy bù mang tên như học sinh: mỗi máy một tên khác nhau, không trùng tên gọi em nào trong DANH SÁCH LỚP (kể cả em chưa vào).
      const ten = may.map(tenMay)
      expect(ten.every((t) => typeof t === 'string')).toBe(true); expect(new Set(ten).size).toBe(14)
      for (const e of st.ds) expect(ten).not.toContain(e.ten)
      expect([0, 1, 2, 3].map((d) => Object.values(anh.ds).filter((r) => r[3] === d).length)).toEqual([4, 4, 4, 4])
      expect(doc(gv)).toHaveLength(1)
      // báo «bị hạ» lặp trong 2,5 giây ⇒ chỉ tính một lượt
      em(hs2, 'S2', { t: 'lop', k: 'tro', x: { p: [300, 300, 0, 1], a: 'S1' } }, T0 + 400)
      vi.advanceTimersByTime(260)
      expect((doc(hs1).at(-1)!.x as { d: number[] }).d[doi('S1')]).toBe(1)
      // thầy bấm Bắt đầu ⇒ trò dừng hẳn, máy bù rời sân
      st.live!.khoi!.gd = 'dang'
      vi.advanceTimersByTime(1000)
      const n = hs1.tin.length
      em(hs1, 'S1', { t: 'lop', k: 'tro', x: { p: [1, 1, 10, 1] } }, T0 + 5000)
      vi.advanceTimersByTime(1000)
      expect(hs1.tin.length).toBe(n)
    } finally { vi.useRealTimers() }
  })
  it('trò Sinh Tồn: hộp tiếp tế — em chạm ĐẦU TIÊN của mỗi hộp được nhận', () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(T0)
      const { em, hs1, hs2 } = kenhGia('cho')
      const soHop = Math.floor(T0 / 20_000)
      em(hs1, 'S1', { t: 'lop', k: 'tro', x: { p: [800, 500, 60, 1], h: soHop } }, T0)
      em(hs2, 'S2', { t: 'lop', k: 'tro', x: { p: [800, 500, 60, 1], h: soHop } }, T0 + 10)
      vi.advanceTimersByTime(260)
      expect((doc(hs2).at(-1)!.x as { h: [number, string] }).h).toEqual([soHop, 'S1'])
    } finally { vi.useRealTimers() }
  })
  it('danh sách bốn đội: chỉ em đã vào; phát lại khi sĩ số đổi; `lop-xin` trả riêng máy hỏi', () => {
    const { k, st, hs1, hs2, em } = kenhGia()
    k.soatDs(st)
    const d = doc(hs2).at(-1)!
    expect(d.t).toBe('lop-ds'); expect((d.ds as unknown[][]).map((x) => x[0])).toEqual(['S1', 'S2']); expect(d.kj).toHaveLength(4)
    const n = hs2.tin.length
    k.soatDs(st); expect(hs2.tin.length).toBe(n)
    vaoLop(st, 'S3', NAY); k.soatDs(st); expect(hs2.tin.length).toBe(n + 1)
    expect((doc(hs2).at(-1)!.ds as unknown[][])[0]).toHaveLength(4) // kèm kJ từng em
    // kết thúc buổi ⇒ phát đúng MỘT lần danh sách + kJ chốt (màn vinh danh)
    st.ketThuc = true; const n2 = hs2.tin.length; k.soatDs(st); k.soatDs(st); expect(hs2.tin.length).toBe(n2 + 1); st.ketThuc = false; k.soatDs(st)
    const rieng = taoWs(); em(rieng, 'S1', { t: 'lop-xin' }); expect(doc(rieng)[0]!.t).toBe('lop-ds'); expect(hs1.tin.length).toBe(hs2.tin.length)
  })
})

describe('vinh danh đội thắng', () => {
  const ds = [{ sbd: 'a', ten: 'An', doi: 0, kj: 300 }, { sbd: 'b', ten: 'Bình', doi: 1, kj: 500 }, { sbd: 'c', ten: 'Chi', doi: 1, kj: 0 }, { sbd: 'd', ten: 'Dũng', doi: 2, kj: 120 }]
  it('xếp hạng theo kJ đội, chỉ đội có em; bằng kJ ⇒ cùng hạng', () => {
    expect(xepHangDoi(ds, [300, 650, 120, 999]).map((x) => [x.doi, x.hang])).toEqual([[1, 1], [0, 2], [2, 3]])
    expect(xepHangDoi(ds, [400, 400, 100, 0]).map((x) => [x.doi, x.hang])).toEqual([[0, 1], [1, 1], [2, 3]])
    expect(xepHangDoi([], [1, 2, 3, 4])).toEqual([])
  })
  it('ngôi sao buổi học: ba em nhiều kJ nhất, bỏ em 0 kJ', () => {
    expect(saoBuoi(ds).map((e) => e.sbd)).toEqual(['b', 'a', 'd'])
  })
})
