// @vitest-environment node
// BÙ KHO của đề riêng chỉ lấy câu HỢP KHỐI của ca (Code 1 yêu cầu 21/09): ca lớp 11 không bù câu lớp 12; ca không ghi lớp ⇒ không lọc.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { chonCauBuKho, locKhoBuTheoKhoi, locKhoToanBoTheoChuyenDeCa } from '../src/lib/de-rieng-nguon'
import { khoiCuaEm } from '../src/lib/khoi-cau'
import type { TeacherExamSource } from '../src/data/examContent'

const q = (id: string, chuyenDe = 'Este') => ({ id, chuyenDe, type: 'mcq', text: 'x', options: ['a', 'b', 'c', 'd'], correct: 'A' }) as unknown as TeacherExamSource['phanI'][number]
const src = (maDe: string, ids: string[]): TeacherExamSource => ({ maDe, phanI: ids.map((i) => q(i)), phanII: [], phanIII: [] }) as unknown as TeacherExamSource

const KHO = [
  src('DH-12-C1-B1', ['DH-12-C1-B1-I-1', 'DH-12-C1-B1-I-2']),
  src('DH-11-C2-B3', ['DH-11-C2-B3-I-1', 'DH-11-C2-B3-I-2']),
  src('12-C1-B2-D1', ['12-C1-B2-D1-I-5']), // mã tờ dạng số-đầu (khoi-cau.ts đã vá 41ce3d2)
  src('LA-TEN', ['LA-TEN-I-1']), // không đọc ra khối ⇒ giữ
]
const ids = (k: TeacherExamSource[]) => k.flatMap((s) => s.phanI.map((x) => x.id))

describe('locKhoBuTheoKhoi', () => {
  it('ca lớp 11 ⇒ bỏ câu khối 12 (cả mã tờ chữ-đầu lẫn số-đầu), giữ câu khối 11 và câu không rõ khối', () => {
    const r = ids(locKhoBuTheoKhoi(KHO, khoiCuaEm({ lop: '11 - Tinh Hoa' })))
    expect(r).toEqual(['DH-11-C2-B3-I-1', 'DH-11-C2-B3-I-2', 'LA-TEN-I-1'])
  })
  it('ca lớp 12 ⇒ giữ hết; ca không ghi lớp (khối không rõ) ⇒ không lọc, trả nguyên kho', () => {
    expect(ids(locKhoBuTheoKhoi(KHO, 12))).toEqual(ids(KHO))
    expect(locKhoBuTheoKhoi(KHO, khoiCuaEm({ lop: '' }))).toBe(KHO)
    expect(locKhoBuTheoKhoi(KHO, null)).toBe(KHO)
  })
  it('không sửa kho đầu vào; giữ thứ tự và các trường khác của nguồn', () => {
    const truoc = JSON.stringify(KHO)
    const r = locKhoBuTheoKhoi(KHO, 11)
    expect(JSON.stringify(KHO)).toBe(truoc)
    expect(r.map((s) => s.maDe)).toEqual(['DH-12-C1-B1', 'DH-11-C2-B3', '12-C1-B2-D1', 'LA-TEN'])
    expect(r[0]!.phanI).toEqual([])
  })
  it('ghép với luật chuyên đề + chọn câu bù: ca lớp 11 thiếu 3 câu Phần I chỉ nhận câu hợp khối', () => {
    const bankGoc = [src('DH-11-C2-B3', ['DH-11-C2-B3-I-9'])]
    const kho = locKhoBuTheoKhoi(locKhoToanBoTheoChuyenDeCa(KHO, bankGoc), 11)
    const bu = chonCauBuKho(kho, new Set(), { I: 3, II: 0, III: 0 })
    expect(bu.phanI.map((x) => x.id)).toEqual(['DH-11-C2-B3-I-1', 'DH-11-C2-B3-I-2', 'LA-TEN-I-1'])
    expect(bu.phanI.some((x) => x.id.startsWith('DH-12') || x.id.startsWith('12-'))).toBe(false)
  })
  it('khoá nguồn: dungDeRiengChoCa lọc khối ca (lopCa) SAU lọc chuyên đề và TRƯỚC khi chọn câu bù', () => {
    const s = fs.readFileSync(path.join(process.cwd(), 'src/lib/de-rieng-nguon.ts'), 'utf8')
    expect(s).toMatch(/locKhoBuTheoKhoi\(locKhoToanBoTheoChuyenDeCa\(khoToanBoGoc, bank\), khoiCuaEm\(\{ lop: lopCa \}\)\)/)
    expect(s.indexOf('locKhoBuTheoKhoi(locKhoToanBoTheoChuyenDeCa')).toBeLessThan(s.indexOf('chonCauBuKho(khoToanBo, daCo'))
  })
})
