// @vitest-environment node
// BÙ KHO của đề riêng chỉ lấy câu HỢP KHỐI của ca (Code 1 yêu cầu 21/09): ca lớp 11 không bù câu lớp 12; ca không ghi lớp ⇒ không lọc.
// SỬA CÓ CHỦ Ý 05/10 — LUẬT THẦY (nguyên văn): "rất nhiều cấu thuộc lớp 10 nhưng bị rút nhầm sang lớp 11, bạn phải chặn chuẩn 100% không được rút nhầm kho khác khối cho tôi nhé"
// ⇒ phần MÁY TỰ BÙ chỉ câu ĐÚNG khối ca: bỏ câu khối khác (cao HAY thấp), câu không rõ khối, câu mâu thuẫn khối; ca không ghi lớp (khối không rõ) ⇒ KHÔNG bù câu nào.
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
  src('LA-TEN', ['LA-TEN-I-1']), // không đọc ra khối ⇒ (luật 05/10) BỎ ở phần máy tự bù
]
const ids = (k: TeacherExamSource[]) => k.flatMap((s) => s.phanI.map((x) => x.id))

describe('locKhoBuTheoKhoi', () => {
  it('ca lớp 11 ⇒ bỏ câu khối 12 (cả mã tờ chữ-đầu lẫn số-đầu) VÀ câu không rõ khối (luật 05/10); chỉ giữ câu khối 11', () => {
    const r = ids(locKhoBuTheoKhoi(KHO, khoiCuaEm({ lop: '11 - Tinh Hoa' })))
    expect(r).toEqual(['DH-11-C2-B3-I-1', 'DH-11-C2-B3-I-2'])
  })
  it('ca lớp 12 ⇒ chỉ câu khối 12 (bỏ khối 11 THẤP hơn + không rõ khối); ca không ghi lớp (khối không rõ) ⇒ không bù câu nào (luật 05/10)', () => {
    expect(ids(locKhoBuTheoKhoi(KHO, 12))).toEqual(['DH-12-C1-B1-I-1', 'DH-12-C1-B1-I-2', '12-C1-B2-D1-I-5'])
    expect(ids(locKhoBuTheoKhoi(KHO, khoiCuaEm({ lop: '' })))).toEqual([])
    expect(ids(locKhoBuTheoKhoi(KHO, null))).toEqual([])
    expect(locKhoBuTheoKhoi(KHO, null).map((s) => s.maDe)).toEqual(KHO.map((s) => s.maDe)) // giữ khung nguồn, chỉ rỗng câu
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
    // luật 05/10: câu không rõ khối (LA-TEN) không được bù ⇒ thiếu 1 câu (thà thiếu còn hơn lẫn khối)
    expect(bu.phanI.map((x) => x.id)).toEqual(['DH-11-C2-B3-I-1', 'DH-11-C2-B3-I-2'])
    expect(bu.phanI.some((x) => x.id.startsWith('DH-12') || x.id.startsWith('12-'))).toBe(false)
  })
  it('khoá nguồn: dungDeRiengChoCa lọc khối ca (lopCa) SAU lọc chuyên đề và TRƯỚC khi chọn câu bù', () => {
    const s = fs.readFileSync(path.join(process.cwd(), 'src/lib/de-rieng-nguon.ts'), 'utf8')
    expect(s).toMatch(/locKhoBuTheoKhoi\(locKhoToanBoTheoChuyenDeCa\(khoToanBoGoc, bank\), khoiCuaEm\(\{ lop: lopCa \}\)\)/)
    expect(s.indexOf('locKhoBuTheoKhoi(locKhoToanBoTheoChuyenDeCa')).toBeLessThan(s.indexOf('chonCauBuKho(khoToanBo, daCo'))
  })
})
