// HỌC PHÍ — EM ĐÃ NGHỈ KHÔNG TÍNH PHẦN CHƯA NỘP (thầy 31/10: «những hs tick nghỉ thì ko tính thêm phần học phí chưa nộp»; src/lib/hoc-phi.ts).
// Em nghỉ: phải nộp chỉ còn bằng phần đã nộp ⇒ không còn thiếu; tiền đã thu vẫn vào «Đã nộp»; trạng thái «Không thu» (không nằm trong «Chưa nộp» / «Còn thiếu»).
import { describe, expect, it } from 'vitest'
import { hocPhiCuaEm, tongHocPhi, trangThaiCuaEm, type HocPhiEm } from '../src/lib/hoc-phi'

const em = (sbd: string, phaiNop: number, daNop: number): [string, HocPhiEm] => [sbd, { sbd, phaiNop, daNop, ghiChu: '', soLan: daNop ? 1 : 0 }]
const so = new Map([em('A', 4_500_000, 0), em('B', 4_500_000, 2_000_000), em('C', 4_500_000, 4_500_000), em('N1', 4_500_000, 1_000_000)])

describe('em đã nghỉ không tính phần học phí chưa nộp', () => {
  it('tổng: bỏ phần thiếu của em nghỉ (kể cả em chưa có dòng sổ), giữ tiền đã thu', () => {
    const ds = ['A', 'B', 'C', 'N1', 'N2']
    const truoc = tongHocPhi(ds, so)
    expect(truoc.conThieu).toBe(4_500_000 + 2_500_000 + 3_500_000 + 4_500_000)
    const sau = tongHocPhi(ds, so, new Set(['N1', 'N2']))
    expect(sau.conThieu).toBe(4_500_000 + 2_500_000)
    expect(sau.daNop).toBe(truoc.daNop)
    expect(sau.phaiNop).toBe(4_500_000 * 3 + 1_000_000)
    expect(sau.dem).toEqual({ chua_nop: 1, con_thieu: 1, du: 1, khong_thu: 2 })
    expect(sau.soEm).toBe(5)
  })
  it('từng em: nghỉ ⇒ «Không thu», không còn thiếu; bỏ tick ⇒ đúng mức cũ', () => {
    const h = hocPhiCuaEm('N1', so, true)
    expect(h.phaiNop).toBe(1_000_000)
    expect(trangThaiCuaEm(h, true)).toBe('khong_thu')
    const lai = hocPhiCuaEm('N1', so)
    expect(lai.phaiNop).toBe(4_500_000)
    expect(trangThaiCuaEm(lai)).toBe('con_thieu')
  })
})
