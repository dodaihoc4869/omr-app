import { describe, expect, it } from 'vitest'
import { giamGoiPhieu, type PhieuDayDu } from '../src/lib/phieu-du-lieu'
import type { CauLuyen } from '../src/lib/bai-tap-pdf'

/** Câu nặng giả lập: ảnh data URL là thứ làm gói phình. */
const cauNang = (n: number): CauLuyen[] =>
  Array.from({ length: n }, (_, i) => ({ phan: 'I', id: `q${i}`, chuyenDe: 'x', mucDo: 'biet', text: 'đề', luaChon: ['a', 'b', 'c', 'd'], dapAn: 'A', chot: '', lyDo: null, buoc: null, ketQua: '', anhThanCau: 'data:image/png;base64,' + 'A'.repeat(60_000) }) as CauLuyen)

const goc = (o: Partial<PhieuDayDu>): PhieuDayDu =>
  ({ v: 2, hoTen: 'A', sbd: '1', lop: '', tenCa: '', maCa: '', ngay: '', diem: 5, diemPhan: null, soCauSai: 1, tongSoCau: 10, hang: null, siSo: null, chuyenDeCa: [], chuyenDeTong: [], lichSu: [], diemLop: [], vieCanLam: '', thongKe: null, tinHieu: [], ducKet: [], cauSai: [], dai: [], ...o }) as PhieuDayDu

describe('giamGoiPhieu', () => {
  it('gói vừa cỡ thì GIỮ NGUYÊN, không bỏ gì', () => {
    const p = goc({ deCuaEm: cauNang(1), baiTap: cauNang(1) })
    const r = giamGoiPhieu(p, 10 * 1024 * 1024)
    expect(r.daBo).toEqual([])
    expect(r.phieu.deCuaEm).toHaveLength(1)
    expect(r.phieu.baiTap).toHaveLength(1)
  })

  it('quá cỡ thì bỏ ĐỀ trước — phụ huynh vẫn còn bài tập luyện', () => {
    const p = goc({ deCuaEm: cauNang(20), baiTap: cauNang(2) })
    const r = giamGoiPhieu(p, 400_000)
    expect(r.daBo).toContain('đề của em')
    expect(r.phieu.deCuaEm).toBeUndefined()
    expect(r.phieu.baiTap).toHaveLength(2)
  })

  it('bỏ đề rồi vẫn quá cỡ thì bỏ tiếp bài tập', () => {
    const p = goc({ deCuaEm: cauNang(10), baiTap: cauNang(10) })
    const r = giamGoiPhieu(p, 100_000)
    expect(r.daBo).toEqual(['đề của em', 'bài tập kèm sẵn'])
    expect(r.phieu.baiTap).toBeUndefined()
  })

  it('KHÔNG bao giờ động vào phần chấm bài — đó là ruột của báo cáo', () => {
    const p = goc({ deCuaEm: cauNang(10), baiTap: cauNang(10), cauSai: [{ phan: 'I', soCau: 3 }] as never, diem: 7.25 })
    const r = giamGoiPhieu(p, 1000)
    expect(r.phieu.cauSai).toHaveLength(1)
    expect(r.phieu.diem).toBe(7.25)
  })

  it('không sửa gói gốc — chỗ gọi còn dùng bản đầy đủ để hiện tại máy thầy', () => {
    const p = goc({ deCuaEm: cauNang(20) })
    giamGoiPhieu(p, 1000)
    expect(p.deCuaEm).toHaveLength(20)
  })
})
