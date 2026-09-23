// @vitest-environment node
// P01 — CNH-1.0: HỢP ĐỒNG CHẤM CÓ VERSION. Test gọi CODE SẢN PHẨM thật:
//   src/lib/cham-so-policy.ts (policy), src/lib/cham-so.ts (lớp mỏng + tên hàm cũ),
//   server/src/btvn-grading.ts, server/src/on-lai-nop.ts, server/src/mom.ts,
//   src/engine/score.ts, src/game/than-thu-v2/core.ts (chính sách 'chat' của game).
// Kết quả mong đợi lấy từ docs/cline-ca-nhan-hoa-2309/MAU-KET-QUA.json — KHÔNG chép công thức vào test.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  chamTheoPolicy, parseChamInput, ChamInputError, chuanHoaSoNhap, tachSoVaDonVi,
  POLICY_VERSION, POLICY_MAC_DINH_PHAN_III, THAM_SO_CHAM_CNH_1_0,
} from '../src/lib/cham-so-policy'
import { khopPhanIII } from '../src/lib/cham-so'
import { isAnswerCorrect } from '../server/src/btvn-grading'
import { chamMotCau } from '../server/src/on-lai-nop'
import { gradeMom } from '../server/src/mom'
import { grade } from '../src/game/than-thu-v2/core'
import { scorePhanII, scoreStudent } from '../src/engine/score'

type Vector = { id: string; kind: string; input: Record<string, unknown>; expected: Record<string, unknown> }
const MAU = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'docs/cline-ca-nhan-hoa-2309/MAU-KET-QUA.json'), 'utf8')) as { vectors: Vector[] }
const VECTORS_GRADING = MAU.vectors.filter((v) => v.kind === 'grading')
const SO_CHUAN = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/
const laSoChuan = (dapAn: string) => SO_CHUAN.test(chuanHoaSoNhap(dapAn))

describe('T33 — 12 vector grading trong MAU-KET-QUA chạy qua ĐÚNG hàm sản phẩm', () => {
  it('chamTheoPolicy khớp từng vector, kể cả mã lỗi unsupported-format', () => {
    expect(VECTORS_GRADING.length).toBe(12)
    for (const v of VECTORS_GRADING) {
      expect(chamTheoPolicy(v.input), v.id).toEqual(v.expected)
    }
  })
  it('policy mặc định cho câu Phần III chưa gắn metadata là numeric-value-v1', () => {
    expect(POLICY_MAC_DINH_PHAN_III).toBe('numeric-value-v1')
    expect(THAM_SO_CHAM_CNH_1_0.policyVersion).toBe(POLICY_VERSION)
    expect(THAM_SO_CHAM_CNH_1_0.saiSoTuyetDoiLoaiTru).toBe(1e-4)
    expect([...THAM_SO_CHAM_CNH_1_0.policies]).toEqual(['numeric-value-v1', 'numeric-rounded-v1', 'numeric-unit-v1', 'literal-v1'])
  })
})

describe('T33 — bốn adapter chấm đi CÙNG một policy, không lệch nhau', () => {
  /** [em gõ, đáp án lưu] — phủ Unicode, ký hiệu khoa học, đơn vị viết theo, hậu tố chữ, biên 1e-4. */
  const CAP: [string, string][] = [
    ['0,54', '0.54'], ['0.54', '0,54'], [' 0,54 ', '0,54'], ['0,54.', '0,54'],
    ['０，５４０', '0.54'], ['2,5×10^-3', '0.0025'], ['1.5e0', '1,5'], ['≈0,54', '0,54'],
    ['0,540', '0,54'], ['0,80', '0,8'], ['0,5', '0,54'], ['0,55', '0,54'],
    ['12abc', '12'], ['12 g', '12'], ['12 g', '12 kg'], ['0,54 M', '0,54 mol/L'],
    ['1.0001', '1'], ['1.00009', '1'], ['0', '0.0001'], ['', '0,54'], ['.', '0,54'],
    ['1/2', '0.5'], ['SO3', 'SO3'], ['SO2', 'SO3'],
  ]
  it('khopPhanIII (ca thi + mọi màn), isAnswerCorrect (BTVN/ôn lại), chamMotCau, gradeMom cùng kết quả', () => {
    for (const [em, dapAn] of CAP) {
      // Em BỎ TRỐNG: hợp đồng chấm từ chối đầu vào rỗng ở tầng API; các adapter cũ trả false.
      const chuan = em.trim() === '' ? null : chamTheoPolicy({ policy: POLICY_MAC_DINH_PHAN_III, key: dapAn, answer: em })
      const mongDoi = chuan === null || chuan.error ? false : chuan.correct
      expect(khopPhanIII(em, dapAn), `khopPhanIII ${JSON.stringify(em)} vs ${JSON.stringify(dapAn)}`).toBe(mongDoi)
      expect(isAnswerCorrect(em, dapAn, 'III'), `isAnswerCorrect ${JSON.stringify(em)}`).toBe(mongDoi)
      expect(chamMotCau({ qid: 'SYN-CNH-III-1', dapAn }, { correct: em, phan: 'III' }), `chamMotCau ${JSON.stringify(em)}`).toBe(mongDoi)
      // Mom chỉ nhận khóa là SỐ THUẦN (khoaMom loại khóa có đơn vị) — kiểm riêng để không khẳng định sai.
      if (laSoChuan(dapAn)) {
        const diem = gradeMom([{ id: 'SYN-CNH-III-1', phan: 'III', dapAn }], { 'SYN-CNH-III-1': em }).soCauDung
        expect(diem, `gradeMom ${JSON.stringify(em)} vs ${JSON.stringify(dapAn)}`).toBe(mongDoi ? 1 : 0)
      }
    }
  })
  it('game Đảo/Đoàn GIỮ chính sách chặt \'chat\': 0,540 KHÁC 0,54 (không bị CNH-1.0 làm lỏng)', () => {
    const q = (correct: string) => ({ phan: 'III', correct }) as never
    expect(grade(q('0,54'), '0,540')).toBe(false)
    expect(grade(q('0,54'), '0,54')).toBe(true)
    expect(grade(q('0,54'), '0.54')).toBe(true)
    expect(grade(q('0,54'), '0,54 mol/L')).toBe(true)
    expect(grade(q('0,54'), '0,55')).toBe(false)
  })
})

describe('T33 — ngữ nghĩa bốn policy v1 (phân số, đơn vị, làm tròn, literal, biên 1e-4)', () => {
  it('numeric-value-v1: phân số CHỈ khi policy cho phép; mẫu 0 là unsupported-format', () => {
    expect(chamTheoPolicy({ policy: 'numeric-value-v1', key: '0.5', answer: '1/2', allowFraction: true })).toEqual({ correct: true })
    expect(chamTheoPolicy({ policy: 'numeric-value-v1', key: '0.5', answer: '1/2' })).toEqual({ correct: false, error: 'unsupported-format' })
    expect(chamTheoPolicy({ policy: 'numeric-value-v1', key: '0.5', answer: '1/0', allowFraction: true })).toEqual({ correct: false, error: 'unsupported-format' })
    expect(chamTheoPolicy({ policy: 'numeric-value-v1', key: '0.75', answer: '6/8', allowFraction: true })).toEqual({ correct: true })
    expect(chamTheoPolicy({ policy: 'numeric-value-v1', key: '0.5', answer: '-1/2', allowFraction: true })).toEqual({ correct: false })
  })
  it('numeric-unit-v1: chỉ nhận đơn vị đích (hoặc tên trong allowedConversions); thiếu đơn vị là SAI', () => {
    const c = (answer: string, allowedConversions: string[] = []) =>
      chamTheoPolicy({ policy: 'numeric-unit-v1', key: '12', requiredUnit: 'g/mol', allowedConversions, answer })
    expect(c('12 g/mol')).toEqual({ correct: true })
    expect(c('12 mol')).toEqual({ correct: false })
    expect(c('12')).toEqual({ correct: false })
    expect(c('12 kg/mol')).toEqual({ correct: false })
    expect(c('12 mol', ['mol'])).toEqual({ correct: true })
    // Đuôi chữ KHÔNG phải đơn vị đã biết ⇒ không đọc được thành số+đơn vị (không bỏ chữ để lấy số).
    expect(c('12abc')).toEqual({ correct: false, error: 'unsupported-format' })
  })
  it('numeric-rounded-v1: làm tròn nửa-ra-xa-0 theo ĐÚNG số chữ số thập phân của metadata', () => {
    const c = (key: string, answer: string, decimals: number) => chamTheoPolicy({ policy: 'numeric-rounded-v1', key, answer, decimals })
    expect(c('1.25', '1.3', 1)).toEqual({ correct: true })
    expect(c('-1.25', '-1.3', 1)).toEqual({ correct: true })
    expect(c('1.25', '1.2', 1)).toEqual({ correct: false })
    expect(c('2.449', '2.45', 2)).toEqual({ correct: true })
    expect(c('2.4449', '2.45', 2)).toEqual({ correct: false })
  })
  it('literal-v1: chỉ khớp biểu diễn thầy đã duyệt, không tự bật cho câu số', () => {
    expect(chamTheoPolicy({ policy: 'literal-v1', key: 'pH', answer: 'ph' })).toEqual({ correct: true })
    expect(chamTheoPolicy({ policy: 'literal-v1', key: 'pH', answer: 'PH', accepted: ['pH', 'PH'] })).toEqual({ correct: true })
    expect(chamTheoPolicy({ policy: 'literal-v1', key: 'pH', answer: 'pOH' })).toEqual({ correct: false })
    expect(chamTheoPolicy({ policy: 'literal-v1', key: '12', answer: '12.0' })).toEqual({ correct: false })
  })
  it('biên 1e-4 là "NHỎ HƠN" tuyệt đối, tính trên số hữu tỉ (không dấu phẩy động)', () => {
    const c = (answer: string) => chamTheoPolicy({ policy: 'numeric-value-v1', key: '1', answer })
    expect(c('1.0001')).toEqual({ correct: false })
    expect(c('1.00009')).toEqual({ correct: true })
    expect(c('0.9999')).toEqual({ correct: false })
    expect(chamTheoPolicy({ policy: 'numeric-value-v1', key: '0', answer: '0.0001' })).toEqual({ correct: false })
    expect(chamTheoPolicy({ policy: 'numeric-value-v1', key: '0', answer: '0.00009' })).toEqual({ correct: true })
  })
  it('KHÔNG dùng eval/Function trong module chấm (đường chấm không chạy mã do máy khách gửi)', () => {
    const ma = fs.readFileSync(path.join(process.cwd(), 'src/lib/cham-so-policy.ts'), 'utf8')
    expect(ma).not.toMatch(/\beval\s*\(/)
    expect(ma).not.toMatch(/new\s+Function\s*\(/)
  })
})


describe('T34 — hợp đồng có version + kiểm tra kiểu LÚC CHẠY', () => {
  it('đầu vào sai KIỂU bị từ chối bằng ChamInputError (422), không âm thầm chấm', () => {
    const loi = (x: unknown) => expect(() => chamTheoPolicy(x)).toThrow(ChamInputError)
    loi(undefined); loi(null); loi([]); loi('0,54'); loi({})
    loi({ policy: 'numeric-value-v2', key: '1', answer: '1' })
    loi({ policy: 'numeric-value-v1', key: '', answer: '1' })
    loi({ policy: 'numeric-value-v1', key: '1', answer: '' })
    loi({ policy: 'numeric-value-v1', key: '1', answer: '1', policyVersion: 'CNH-2.0' })
    loi({ policy: 'numeric-rounded-v1', key: '1', answer: '1' })
    loi({ policy: 'numeric-rounded-v1', key: '1', answer: '1', decimals: 1.5 })
    loi({ policy: 'numeric-rounded-v1', key: '1', answer: '1', decimals: -1 })
    loi({ policy: 'numeric-unit-v1', key: '1', answer: '1 g' })
    loi({ policy: 'numeric-value-v1', key: '1', answer: '1', allowFraction: 'yes' })
    loi({ policy: 'numeric-value-v1', key: '1', answer: '1', accepted: ['', 'x'] })
    expect(new ChamInputError('x')).toBeInstanceOf(Error)
  })
  it('parseChamInput trả hợp đồng đã chuẩn hoá; version CNH-1.0 được chấp nhận', () => {
    expect(parseChamInput({ policy: 'numeric-value-v1', key: '1', answer: '1', policyVersion: POLICY_VERSION })).toEqual({ policy: 'numeric-value-v1', key: '1', answer: '1' })
    expect(parseChamInput({ policy: 'numeric-rounded-v1', key: '1.25', answer: '1.3', decimals: 1 })).toEqual({ policy: 'numeric-rounded-v1', key: '1.25', answer: '1.3', decimals: 1 })
  })
  it('tachSoVaDonVi phân biệt rõ số thuần / đơn vị đã biết / đuôi lạ', () => {
    expect(tachSoVaDonVi('12', false).ok).toBe(true)
    expect(tachSoVaDonVi('12b', false)).toEqual({ ok: false, loi: 'unsupported-format' })
    const co = tachSoVaDonVi('12g', false)
    expect(co.ok && co.so.unit).toBe('g')
  })
})

describe('T19 — Phần II: lưu kết quả TỪNG Ý, không hạ cả câu vì một ý sai', () => {
  const y = (v: 'D' | 'S' | null) => ({ value: v, flag: null }) as const
  it('bốn ý đúng ba: giữ số ý đúng (3) và điểm theo policy của đề, câu chưa đạt trọn', () => {
    const kq = scorePhanII([[y('D'), y('D'), y('D'), y(null)]], [['D', 'D', 'D', 'S']], 400)
    expect(kq.items[0].yDung).toBe(3)
    expect(kq.items[0].correct).toBe(false)
    expect(kq.cents).toBeGreaterThan(0)
  })
  it('đúng cả bốn ý: câu đạt trọn', () => {
    const kq = scorePhanII([[y('D'), y('S'), y('D'), y('S')]], [['D', 'S', 'D', 'S']], 400)
    expect(kq.items[0].yDung).toBe(4)
    expect(kq.items[0].correct).toBe(true)
  })
  it('scoreStudent vẫn dùng đúng luật Phần III của policy CNH-1.0', () => {
    const key = { madeThi: 'S', phanI: [], phanII: [], phanIII: ['0,54'] }
    const answers = {
      sbd: 'SYN-CNH', madeThi: 'S',
      phanI: [], phanII: [],
      phanIII: [{ value: '０，５４０', flag: null }],
    }
    const kq = scoreStudent(answers as never, key as never)
    expect(kq.phanIII.items[0].correct).toBe(true)
    expect(kq.total).toBe(10)
  })
})

