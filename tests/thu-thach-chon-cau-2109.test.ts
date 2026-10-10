import {readFileSync as docHocTap} from 'node:fs'
// @vitest-environment node
// "Luyện nâng cao / Thử sức ngay": câu thử thách chỉ được lấy từ câu HỢP KHỐI của em (Code 1 yêu cầu 21/09 — em lớp 11 không nhận câu lớp 12).
// SỬA CÓ CHỦ Ý 05/10 — LUẬT THẦY (nguyên văn): "rất nhiều cấu thuộc lớp 10 nhưng bị rút nhầm sang lớp 11, bạn phải chặn chuẩn 100% không được rút nhầm kho khác khối cho tôi nhé"
// ⇒ chỉ câu ĐÚNG khối em; câu không đọc ra khối (mã lạ) bị bỏ; em chưa rõ khối ⇒ không câu nào (trước: không lọc).
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
    // luật 05/10: 'X-1' (mã lạ, không rõ khối) KHÔNG còn được lấy bù ⇒ thiếu thì trả thiếu
    expect(r.map((c) => c.id)).toEqual(['DH-10-C1-B1-I-1'])
    expect(chonCauThuThach([cau('DH-12-A', 'DH-12-A')], 11)).toEqual([])
  })
  it('không rõ khối em (chưa xếp lớp) ⇒ (luật 05/10) KHÔNG câu nào; câu không đáp án bị bỏ', () => {
    expect(chonCauThuThach(KHO, khoiCuaEm({ lop: '' }))).toEqual([])
    expect(chonCauThuThach([cau('a', 'DH-12-A', { dapAn: '' }), cau('b', 'DH-12-B')], 12).map((c) => c.id)).toEqual(['b'])
  })
  it('cổng học tập chọn và nộp qua máy chủ, không nạp kho đáp án tại máy',()=>{const c=docHocTap('src/components/hoc-tap/ManLamBaiTap.tsx','utf8');expect(c).toContain("goiHoa2('hoc-tap-start'");expect(c).toContain("goiHoa2('answer'");expect(c).not.toContain('loadExamSources');expect(c).toContain('localStorage.setItem(khoa, v)')})
})
