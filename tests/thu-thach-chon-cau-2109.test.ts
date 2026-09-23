// @vitest-environment node
// "Luyện nâng cao / Thử sức ngay": câu thử thách chỉ được lấy từ câu HỢP KHỐI của em (Code 1 yêu cầu 21/09 — em lớp 11 không nhận câu lớp 12).
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { khoiCuaEm } from '../src/lib/khoi-cau'
import { chonCauThuThach } from '../src/lib/thu-thach-chon-cau'
import type { CauLuyen } from '../src/lib/bai-tap-pdf'

const cau = (id: string, maDe: string, sua: Partial<CauLuyen> = {}): CauLuyen =>
  ({ phan: 'I', id, maDe, chuyenDe: 'Este', dang: 'chua_ro', sao: 2, mucDo: 'van_dung', text: 'x', luaChon: ['A', 'B', 'C', 'D'], dapAn: 'A', chot: '', lyDo: null, buoc: null, ketQua: '', ...sua }) as CauLuyen

const KHO = [
  cau('DH-12-C1-B1-I-1', 'DH-12-C1-B1'),
  cau('DH-12-C1-B1-I-2', 'DH-12-C1-B1'),
  cau('DH-11-C2-B3-I-1', 'DH-11-C2-B3'),
  cau('DH-11-C2-B3-I-2', 'DH-11-C2-B3'),
  cau('DH-10-C1-B1-I-1', 'DH-10-C1-B1'),
  cau('X-1', '', { sao: 0, mucDo: 'nhan_biet' }),
]

describe('chonCauThuThach', () => {
  it('em lớp 11 ⇒ KHÔNG bao giờ nhận câu lớp 12; giữ thứ tự kho', () => {
    const r = chonCauThuThach(KHO, khoiCuaEm({ lop: '11 - Tinh Hoa' }))
    expect(r.map((c) => c.id)).toEqual(['DH-11-C2-B3-I-1', 'DH-11-C2-B3-I-2'])
    expect(r.some((c) => c.maDe.startsWith('DH-12'))).toBe(false)
  })
  it('em lớp 12 ⇒ câu lớp 12 (và thấp hơn) đều được; lớp 10 ⇒ không có câu lớp 11–12', () => {
    expect(chonCauThuThach(KHO, 12).map((c) => c.id)).toEqual(['DH-12-C1-B1-I-1', 'DH-12-C1-B1-I-2'])
    const r10 = chonCauThuThach(KHO, khoiCuaEm({ lop: '10' }))
    expect(r10.some((c) => /^DH-1[12]/.test(c.maDe))).toBe(false)
    expect(r10[0]!.id).toBe('DH-10-C1-B1-I-1')
  })
  it('không đủ 2 câu Vận dụng hợp khối ⇒ lấy câu có đáp án bất kỳ NHƯNG vẫn hợp khối', () => {
    const r = chonCauThuThach(KHO, 10)
    expect(r.map((c) => c.id)).toEqual(['DH-10-C1-B1-I-1', 'X-1'])
    expect(chonCauThuThach([cau('DH-12-A', 'DH-12-A')], 11)).toEqual([])
  })
  it('không rõ khối em (chưa xếp lớp) ⇒ không lọc (giữ hành vi cũ); câu không đáp án bị bỏ', () => {
    expect(chonCauThuThach(KHO, khoiCuaEm({ lop: '' })).map((c) => c.id)).toEqual(['DH-12-C1-B1-I-1', 'DH-12-C1-B1-I-2'])
    expect(chonCauThuThach([cau('a', 'DH-12-A', { dapAn: '' }), cau('b', 'DH-12-B')], 12).map((c) => c.id)).toEqual(['b'])
  })
  it('màn thử thách legacy đi qua server và lịch riêng của em', () => {
    const s = fs.readFileSync(path.join(process.cwd(), 'src/screens/StudentPortalScreen.tsx'), 'utf8')
    const branch = s.split("case 'mo_thu_thach':")[1]!.split("case 'mo_thi':")[0]!
    expect(branch).toContain('taiThuThachHomNay(auth.token)')
    expect(branch).not.toContain('loadExamSources')
  })
})
