// @vitest-environment node
// CHUẨN HOÁ ĐÁP ÁN SỐ PHẦN III DÙNG CHUNG (Boss 21/09, P0 "0,54 chấm sai"): bảng 60+ cặp cho hai chính sách; Phần I/II không đổi; các kênh luyện tập cùng một bộ chuẩn hoá.
import { describe, expect, it, vi } from 'vitest'
import { chuanHoaSoNhap, soKhopSo } from '../src/lib/cham-so'
import { chamTheoPolicy } from '../src/lib/cham-so-policy'
import { isAnswerCorrect } from '../server/src/btvn-grading'
import { grade } from '../src/game/than-thu-v2/core'
import { gradeMom } from '../server/src/mom'
import { chamMotCau } from '../server/src/on-lai-nop'

const u = (...ma: number[]) => String.fromCodePoint(...ma)
/** [em gõ, đáp án lưu, khớp theo 'chat', khớp theo 'so_hoc'] */
const BANG: [string, string, boolean, boolean][] = [
  // nhiễu hình thức: phải KHỚP ở cả hai chính sách
  ['0,54', '0,54', true, true], ['0.54', '0,54', true, true], ['0,54', '0.54', true, true], [' 0,54 ', '0,54', true, true], ['0, 54', '0,54', true, true], ['0 ,54', '0,54', true, true],
  [`0,54${u(0xa0)}`, '0,54', true, true], [`${u(0xa0)}0,54`, '0,54', true, true], [`0,54${u(0x200b)}`, '0,54', true, true], [`0${u(0xfeff)},54`, '0,54', true, true],
  [`0${u(0xff0c)}54`, '0,54', true, true], [`0${u(0x66b)}54`, '0,54', true, true], [`0${u(0x201a)}54`, '0,54', true, true], [`0${u(0xff0e)}54`, '0,54', true, true],
  ['0,54.', '0,54', true, true], ['0,54;', '0,54', true, true], ['0,54,', '0,54', true, true], ['0,54!', '0,54', true, true],
  ['≈0,54', '0,54', true, true], ['=0,54', '0,54', true, true], ['~0,54', '0,54', true, true], ['+0,54', '0,54', true, true],
  // đơn vị viết theo
  ['0,54 mol/L', '0,54', true, true], ['0,54mol/l', '0,54', true, true], ['0,54 M', '0,54', true, true], ['0,54 (M)', '0,54', true, true], ['0,54%', '0,54', true, true], ['25 °C', '25', true, true],
  ['12 g', '12 g', true, true], ['12 g', '12', true, true], ['12', '12 g', true, true], ['0,54 M', '0,54 mol/L', false, false], ['12 g', '12 kg', false, false], ['12kg', '12g', false, false],
  // dấu trừ các kiểu
  ['-1,5', '-1,5', true, true], [u(0x2212) + '1,5', '-1,5', true, true], [u(0x2013) + '1,5', '-1,5', true, true], [u(0x2014) + '1,5', '-1,5', true, true], [u(0xff0d) + '1,5', '-1,5', true, true], ['-1.5', '-1,5', true, true],
  ['1,5', '-1,5', false, false], ['-1,5', '1,5', false, false], ['- 1,5', '-1,5', true, true],
  // ký hiệu khoa học
  ['1.5e0', '1,5', true, true], ['1,5e0', '1,5', true, true], ['15e-1', '1,5', true, true], ['2,5x10^-3', '0,0025', true, true], [`2,5${u(0xd7)}10^-3`, '0,0025', true, true], ['2,5*10^3', '2500', true, true], ['1,1e-3', '0,0011', true, true],
  // chữ số có nghĩa: 'chat' phân biệt, 'so_hoc' coi là bằng
  ['0,540', '0,54', false, true], ['0,54', '0,540', false, true], ['12,340', '12,34', false, true], ['.54', '0,54', false, true], [',54', '0,54', false, true], ['00,54', '0,54', false, true], ['0,5400001', '0,54', false, true],
  // SAI thật: cả hai chính sách phải từ chối
  ['0,5', '0,54', false, false], ['0,55', '0,54', false, false], ['0,45', '0,54', false, false], ['54', '0,54', false, false], ['0,054', '0,54', false, false], ['0,54,5', '0,54', false, false], ['5,4', '0,54', false, false],
  ['-0,54', '0,54', false, false], ['1', '0', false, false], ['0', '0,0001', false, false],
  // rỗng
  ['', '0,54', false, false], ['0,54', '', false, false], ['   ', '0,54', false, false], ['.', '0,54', false, false],
  // CNH-1.0 docs/cline-ca-nhan-hoa-2309/02-HOC-TAP-VA-RUT-CAU.md §1.2:
  // numeric parser must consume the whole string; identical text is not a numeric key.
  // Literal matching requires the explicit policy tested below, never an implicit fallback.
  ['A', 'A', false, false], ['B', 'A', false, false], ['SO3', 'SO3', false, false], ['SO2', 'SO3', false, false], ['12b', '12a', false, false], ['0,54abc', '0,54abc', false, false],
]

describe('soKhopSo · bảng cặp', () => {
  it('literal-v1 explicitly permits the text keys excluded from numeric wrappers', () => {
    for (const key of ['A', 'SO3', '0,54abc']) {
      expect(chamTheoPolicy({ policy: 'literal-v1', key, answer: key })).toEqual({ correct: true })
    }
  })
  it(`${BANG.length} cặp: chính sách 'chat' và 'so_hoc'`, () => {
    for (const [v, d, chat, soHoc] of BANG) {
      expect(soKhopSo(v, d, 'chat'), `chat: ${JSON.stringify(v)} vs ${JSON.stringify(d)}`).toBe(chat)
      expect(soKhopSo(v, d, 'so_hoc'), `so_hoc: ${JSON.stringify(v)} vs ${JSON.stringify(d)}`).toBe(soHoc)
    }
    expect(BANG.length).toBeGreaterThanOrEqual(60)
  })
  it('null / undefined / số: không ném lỗi; số thuần đọc như chuỗi', () => {
    expect(soKhopSo(null, '1', 'chat')).toBe(false); expect(soKhopSo(undefined, undefined, 'so_hoc')).toBe(false); expect(soKhopSo(0.54, '0,54', 'chat')).toBe(true); expect(soKhopSo(54, '54', 'so_hoc')).toBe(true)
  })
  it('chuanHoaSoNhap: không đổi giá trị số, chỉ dọn hình thức; kết quả ổn định (chạy hai lần không đổi)', () => {
    for (const [v] of BANG) { const a = chuanHoaSoNhap(v); expect(chuanHoaSoNhap(a)).toBe(a) }
    expect(chuanHoaSoNhap(`  0${u(0xff0c)}540${u(0x200b)} `)).toBe('0.540')      // giữ nguyên chữ số 0 thừa (chính sách quyết ở soKhopSo)
  })
})

describe('các kênh dùng CHUNG bộ chuẩn hoá', () => {
  it('isAnswerCorrect (ôn lại, bài về nhà, nâng đỡ, khắc phục gọi cũ): Phần III theo bảng, chính sách số học', () => {
    for (const [v, d, , soHoc] of BANG) expect(isAnswerCorrect(v, d, 'III'), `${JSON.stringify(v)} vs ${JSON.stringify(d)}`).toBe(v.trim() !== '' && d.trim() !== '' && soHoc)
  })
  it('Phần I / II KHÔNG được nới: hoa thường như cũ, "0,54" không làm đúng câu Phần I', () => {
    expect(isAnswerCorrect('a', 'A', 'I')).toBe(true); expect(isAnswerCorrect('B', 'A', 'I')).toBe(false); expect(isAnswerCorrect('A.', 'A', 'I')).toBe(false); expect(isAnswerCorrect('0,54', '0.54', 'I')).toBe(false)
    expect(isAnswerCorrect('ĐSĐS', 'DSDS', 'II')).toBe(true); expect(isAnswerCorrect('DSDD', 'DSDS', 'II')).toBe(false); expect(isAnswerCorrect('0,54', '0.54', 'II')).toBe(false)
  })
  it('game Đảo/Đoàn (grade): Phần III theo chính sách chặt (0,540 ≠ 0,54) nhưng nhiễu hình thức được bỏ; Phần I giữ nguyên', () => {
    const q = (phan: 'I' | 'III', correct: string) => ({ phan, correct }) as never
    expect(grade(q('III', '0,54'), '0.54')).toBe(true); expect(grade(q('III', '0,54'), `0${u(0xff0c)}54`)).toBe(true); expect(grade(q('III', '0,54'), '0,54 mol/L')).toBe(true); expect(grade(q('III', '0,54'), '0,540')).toBe(false); expect(grade(q('III', '0,54'), '0,55')).toBe(false)
    expect(grade(q('I', 'B'), 'b')).toBe(true); expect(grade(q('I', 'B'), 'B.')).toBe(false); expect(grade(q('III', '0,54'), '  ')).toBe(false)
  })
  it('Mom (gradeMom): câu Phần III chấm theo số ("0,54" = "0.54"), câu khác so chuỗi như cũ', () => {
    const qs = [{ id: 'X-III-1', phan: 'III', dapAn: '0,54' }, { id: 'X-I-2', phan: 'I', dapAn: 'B' }, { id: 'X-III-3', phan: 'III', dapAn: '1,5' }]
    expect(gradeMom(qs, { 'X-III-1': '0.54', 'X-I-2': 'b', 'X-III-3': '1,50' }).soCauDung).toBe(3)
    expect(gradeMom(qs, { 'X-III-1': '0.55', 'X-I-2': 'C', 'X-III-3': '1,5' }).soCauDung).toBe(1)
    expect(gradeMom([{ id: 'Y-I-1', dapAn: 'A' }], { 'Y-I-1': 'A' }).soCauDung).toBe(1)   // không có phan: giữ nguyên cách cũ
  })
  it('chamMotCau (ôn lại): câu Phần III bị chấm SAI thì ghi nhật ký máy chuỗi em gõ (mã ký tự) + đáp án lưu, KHÔNG có mã em; chấm đúng / Phần I thì không ghi', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      expect(chamMotCau({ qid: 'DH-11-C1-B1-III-18', dapAn: '0,54' }, { correct: '0,54', phan: 'III' })).toBe(true); expect(warn).not.toHaveBeenCalled()
      expect(chamMotCau({ qid: 'DH-11-C1-B1-III-18', dapAn: '0,45' }, { correct: '0,54', phan: 'III' })).toBe(false); expect(warn).toHaveBeenCalledTimes(1)
      const [tag, json] = warn.mock.calls[0] as [string, string]
      expect(tag).toBe('[cham-III-sai]'); expect(JSON.parse(json)).toEqual({ qid: 'DH-11-C1-B1-III-18', em: '0,45', dung: '0,54', maEm: '30 2c 34 35' })
      expect(json).not.toMatch(/sbd|maEm":"S/i)
      chamMotCau({ qid: 'DH-11-C1-B1-I-3', dapAn: 'A' }, { correct: 'B', phan: 'I' }); expect(warn).toHaveBeenCalledTimes(1)
    } finally { warn.mockRestore() }
  })
})
