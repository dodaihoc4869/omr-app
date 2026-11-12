// CHAT TRONG LIVE THEO KHỐI (thầy chốt build 12/11) — lõi thuần src/lib/live-khoi/chat-loi.ts.
import { describe, expect, it } from 'vitest'
import { CHAT_GIU, chuCongThuc, chuanGui, docKhoa, duocGui, gioHien, laCauHoi, nhanTin, tenTat, type TinChat } from '../src/lib/live-khoi/chat-loi'
import { CHAT_DAI, CHAT_NHIP_MS, type TinLop } from '../src/lib/live-khoi/kieu'

const tin = (l: number, c: string, s = '12001', n = 'Trần Thu Hà', d = 0): TinLop => ({ k: 'chat', s, n, d, l, x: { c } })
/** Ghép lại thành chữ, mảnh chỉ số dưới bọc trong «_{…}» để so cho dễ đọc. */
const ve = (chu: string) => chuCongThuc(chu).map((m) => (m.duoi ? `_{${m.t}}` : m.t)).join('')

describe('nhanTin', () => {
  it('đổi tin phòng thành tin chat, id = giờ phòng + số báo danh', () => {
    const ds = nhanTin([], tin(1000, '  Em hiểu rồi ạ  '))
    expect(ds).toEqual([{ id: '1000-12001', sbd: '12001', ten: 'Trần Thu Hà', doi: 0, luc: 1000, chu: 'Em hiểu rồi ạ', hoi: false, thay: false }])
  })
  it('khử trùng theo id và trả đúng mảng cũ khi không đổi gì', () => {
    const a = nhanTin([], tin(1000, 'một'))
    expect(nhanTin(a, tin(1000, 'một'))).toBe(a)
    expect(nhanTin(a, tin(1000, 'khác người gửi', '12002'))).toHaveLength(2)
  })
  it('sắp theo giờ phòng dù tin tới lộn thứ tự', () => {
    let ds: TinChat[] = []
    for (const l of [3000, 1000, 2000]) ds = nhanTin(ds, tin(l, `t${l}`))
    expect(ds.map((t) => t.luc)).toEqual([1000, 2000, 3000])
  })
  it('chỉ giữ 200 tin mới nhất', () => {
    let ds: TinChat[] = []
    for (let i = 1; i <= CHAT_GIU + 30; i++) ds = nhanTin(ds, tin(i, `tin ${i}`))
    expect(ds).toHaveLength(200)
    expect(ds[0].luc).toBe(31)
    expect(ds[199].luc).toBe(230)
  })
  it('tin khoá, tin rỗng, tin kênh khác không vào danh sách', () => {
    const ds = nhanTin([], tin(1, 'a'))
    expect(nhanTin(ds, { k: 'chat', s: 'gv', n: 'Thầy', d: -1, l: 2, x: { tat: true } })).toBe(ds)
    expect(nhanTin(ds, tin(3, '   '))).toBe(ds)
    expect(nhanTin(ds, { ...tin(4, 'b'), k: 'tro' })).toBe(ds)
    expect(nhanTin(ds, { k: 'chat', s: '1', n: '', d: 0, l: 5, x: null })).toBe(ds)
  })
  it('tin của thầy mang cờ thay và không tính là câu hỏi', () => {
    const [t] = nhanTin([], tin(9, 'Em nào chưa hiểu?', 'gv', 'Thầy Đại Học', -1))
    expect(t).toMatchObject({ thay: true, hoi: false, doi: -1, id: '9-gv' })
  })
  it('cắt chữ dài quá 200 ký tự', () => {
    expect(nhanTin([], tin(1, 'a'.repeat(300)))[0].chu).toHaveLength(CHAT_DAI)
  })
})

describe('nhận biết câu hỏi', () => {
  it('có dấu hỏi là câu hỏi', () => {
    expect(laCauHoi('Câu này chọn B đúng không ạ?')).toBe(true)
    expect(nhanTin([], tin(1, 'nếu NaOH dư thì tính thế nào ạ?'))[0].hoi).toBe(true)
  })
  it('mở đầu «thầy ơi», «cho em hỏi» — không phân biệt hoa thường và dấu', () => {
    for (const c of ['Thầy ơi câu 11 em ra 9,6 ạ', 'THAY OI cau 3', 'thầy  ơi, giảng lại ạ', 'Cho em hỏi câu 5 ạ', 'cho em hoi', 'Thầy cho em hỏi: nếu NaOH dư']) expect(laCauHoi(c), c).toBe(true)
  })
  it('lời thường không phải câu hỏi', () => {
    for (const c of ['Em hiểu rồi ạ', '🔥', 'Muối là CH3COONa chứ, M = 82 mà', 'Em cảm ơn thầy ơi', 'thầy ơiii']) expect(laCauHoi(c), c).toBe(false)
  })
})

describe('chuCongThuc', () => {
  it('CH3COONa và C2H5OH', () => {
    expect(chuCongThuc('CH3COONa')).toEqual([{ t: 'CH' }, { t: '3', duoi: true }, { t: 'COONa' }])
    expect(ve('C2H5OH')).toBe('C_{2}H_{5}OH')
  })
  it('chỉ số sau dấu đóng ngoặc: Ca(OH)2, Fe2(SO4)3', () => {
    expect(ve('Ca(OH)2')).toBe('Ca(OH)_{2}')
    expect(ve('Fe2(SO4)3')).toBe('Fe_{2}(SO_{4})_{3}')
  })
  it('không đụng số thường', () => {
    for (const c of ['câu 11 em ra 9,6', '0,1 mol', 'Thầy ơi câu 11 em ra 9,6 ạ', 'M = 82 mà', 'lớp 12A1 có 40 em', '19:52', 'Đội Đồng lên 1975 kJ rồi nhé']) expect(chuCongThuc(c), c).toEqual([{ t: c }])
  })
  it('công thức nằm giữa câu, số quanh nó giữ nguyên', () => {
    expect(ve('Muối là CH3COONa chứ, M = 82 mà')).toBe('Muối là CH_{3}COONa chứ, M = 82 mà')
    expect(ve('0,1 mol H2SO4 và 2H2O')).toBe('0,1 mol H_{2}SO_{4} và 2H_{2}O')
    expect(ve('muối (CH3COONa, M = 82) và nước (H2O)')).toBe('muối (CH_{3}COONa, M = 82) và nước (H_{2}O)')
  })
  it('chữ rỗng và chữ không có công thức', () => {
    expect(chuCongThuc('')).toEqual([])
    expect(chuCongThuc('NaOH dư')).toEqual([{ t: 'NaOH dư' }])
  })
})

describe('gửi tin', () => {
  it('chuanGui: cắt khoảng trắng, rỗng ⇒ null, dài ⇒ cắt 200', () => {
    expect(chuanGui('  Em hiểu rồi ạ \n')).toBe('Em hiểu rồi ạ')
    expect(chuanGui('   ')).toBeNull()
    expect(chuanGui('')).toBeNull()
    expect(chuanGui('b'.repeat(250))).toHaveLength(CHAT_DAI)
  })
  it('duocGui: đủ 2 giây mới gửi tiếp, lần đầu gửi được ngay', () => {
    expect(duocGui(0, 1_700_000_000_000)).toBe(true)
    expect(duocGui(10_000, 10_000 + CHAT_NHIP_MS - 1)).toBe(false)
    expect(duocGui(10_000, 10_000 + CHAT_NHIP_MS)).toBe(true)
  })
})

describe('docKhoa', () => {
  const khoa = (tat: unknown, s = 'gv'): TinLop => ({ k: 'chat', s, n: 'Thầy', d: -1, l: 1, x: { tat } })
  it('đọc tin thầy tắt / mở nhắn tin', () => {
    expect(docKhoa(khoa(true))).toBe(true)
    expect(docKhoa(khoa(false))).toBe(false)
  })
  it('tin thường, tin không phải của thầy, tin kênh khác ⇒ null', () => {
    expect(docKhoa(tin(1, 'chào'))).toBeNull()
    expect(docKhoa(khoa(true, '12001'))).toBeNull()
    expect(docKhoa(khoa('co'))).toBeNull()
    expect(docKhoa({ ...khoa(true), k: 'tro' })).toBeNull()
  })
})

describe('giờ và chữ tắt', () => {
  it('gioHien theo giờ Việt Nam (UTC+7)', () => {
    expect(gioHien(Date.UTC(2026, 10, 12, 12, 52, 30))).toBe('19:52')
    expect(gioHien(Date.UTC(2026, 10, 12, 17, 5))).toBe('00:05')
    expect(gioHien(Date.UTC(2026, 10, 12, 23, 59, 59))).toBe('06:59')
  })
  it('tenTat lấy chữ cái đầu của hai từ cuối', () => {
    expect(tenTat('Nguyễn Thu Hà')).toBe('TH')
    expect(tenTat('  đặng   khôi ')).toBe('ĐK')
    expect(tenTat('Lan')).toBe('L')
    expect(tenTat('')).toBe('?')
  })
})
