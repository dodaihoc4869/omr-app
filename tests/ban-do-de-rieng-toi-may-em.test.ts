// BẢN ĐỒ ĐỀ RIÊNG PHẢI TỚI ĐƯỢC MÁY EM.
//
// Thầy báo 08/09: "bạn chưa gắn nhãn những câu sai rút lại". Đọc dữ liệu thật
// của ca 845853 thì bản đồ trên máy chủ ĐỦ (bo 28 câu, lap 4 câu), nhưng tờ đề
// em nhận lại xếp câu I-36 trước I-30 — tức KHÔNG theo thứ tự kho, tức máy em
// cắt đề bằng luật hash chứ không bằng bản đồ.
//
// Nguyên nhân: `vaoThi` gửi kho đề bằng `docJsonLon_(ca.bankRef)` TRẦN, không
// qua `gopBoTheoEm_`. Đường cũ `session` có kèm bản đồ nên lỗi im lặng suốt.
//
// Hậu quả kép, phải nói thẳng: điểm chấm lệch (máy thầy chấm theo bản đồ, em
// làm tờ khác) VÀ không câu hỏi lại nào vào được đề nên không có gì để gắn
// nhãn.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { assignStudentQuestions } from '../src/lib/exam-assign'
import type { PublicExamBank } from '../src/data/examContent'

const goc = join(__dirname, '..')
const doc = (p: string) => readFileSync(join(goc, p), 'utf8')
const GS = doc('docs/apps-script-kiem-tra.gs')
const MAN_THI = doc('src/screens/ExamTakeScreen.tsx')
const API = doc('src/lib/exam-api.ts')

/** Lấy đúng khối lệnh `vaoThi` trong Apps Script. */
function khoiVaoThi(): string {
  const d = GS.indexOf("if (action === 'vaoThi')")
  const c = GS.indexOf("if (action === 'tenTheoSbd')")
  expect(d).toBeGreaterThan(0)
  expect(c).toBeGreaterThan(d)
  return GS.slice(d, c)
}

describe('MÁY CHỦ: lệnh vaoThi gửi bản đồ đề riêng kèm đề', () => {
  const kv = khoiVaoThi()

  it('đọc bộ câu của CHÍNH EM ĐANG THI, không đọc cả bản đồ lớp', () => {
    expect(GS).toContain('function boCuaEm_(ref, sbd)')
    expect(kv).toContain('const boCuaEm = boCuaEm_(ca.boTheoEmRef, sbd)')
  })

  it('GHÉP vào kho đề gửi đi — đây là dòng đã thiếu, gây lệch tờ đề', () => {
    expect(kv).toContain('bankGui.boTheoEm = chiEm')
    // Ghép TRƯỚC khi vào khoá và trước khi trả về, cùng chỗ đọc kho đề.
    expect(kv.indexOf('bankGui.boTheoEm')).toBeLessThan(kv.indexOf('LockService.getScriptLock()'))
  })

  it('bản đồ gửi đi CHỈ có phần của em — không lộ câu của bạn cùng lớp', () => {
    expect(kv).toContain('const chiEm = {}')
    expect(kv).toContain('chiEm[sbd] = boCuaEm')
    // Cấm gửi thẳng cả bản đồ lớp trong lệnh này.
    expect(kv).not.toContain('gopBoTheoEm_')
  })

  it('bộ câu về ở TRƯỜNG RIÊNG, kể cả lần vào KHÔNG xin lại kho đề', () => {
    // `bankGui` chỉ có khi canBank; `out.boCuaEm` thì luôn có.
    expect(kv).toContain('out.boCuaEm = boCuaEm')
    expect(kv.indexOf('out.boCuaEm')).toBeLessThan(kv.indexOf('if (body.canBank) out.bank = bankGui'))
  })

  it('vẫn trả câu hỏi lại như cũ — sửa lỗi này không được làm mất nhãn', () => {
    expect(kv).toContain('out.cauLap = cauLapCuaEm_(ca.boTheoEmRef, sbd)')
  })
})

describe('MÁY EM: ghép bản đồ vào kho TRƯỚC KHI cắt đề', () => {
  it('lệnh vaoThi đọc trường boCuaEm', () => {
    expect(API).toContain('boCuaEm: cauLapCuaEm(r.boCuaEm)')
  })

  it('màn thi ghép bản đồ vào kho, kể cả kho đã cất sẵn trên máy', () => {
    expect(MAN_THI).toContain('const boEm = kq.boCuaEm ?? []')
    expect(MAN_THI).toContain('const bank = boEm.length > 0 ? { ...bankGoc, boTheoEm: { [sb]: boEm } } : bankGoc')
  })

  it('kho CẤT LẠI cũng phải có bản đồ — lần mở sau không được cắt lại theo hash', () => {
    const i = MAN_THI.indexOf('const bank = boEm.length > 0')
    const j = MAN_THI.indexOf('await cacheSession({ maCa: ma, lop: kq.lop, thoiGianPhut: kq.thoiGianPhut, bank })')
    expect(i).toBeGreaterThan(0)
    expect(j).toBeGreaterThan(i)
  })
})

describe('BẰNG CHỨNG: có bản đồ thì đề đúng thứ tự kho, không có thì cắt theo hash', () => {
  // Dựng lại đúng hình dạng đã bắt được ở ca 845853: kho lớn, bộ của em nhỏ.
  const soCau = { I: 3, II: 0, III: 0 }
  const phanI = ['I-4', 'I-9', 'I-13', 'I-26', 'I-30', 'I-36', 'I-43', 'I-51'].map((id) => ({
    id,
    text: id,
    choices: ['a', 'b', 'c', 'd'],
    canXem: false,
  }))
  const khoGoc = { soCau, phanI, phanII: [], phanIII: [] } as unknown as PublicExamBank
  const boCuaEm = ['I-9', 'I-30', 'I-36']

  it('CÓ bản đồ: em nhận ĐÚNG ba câu đó, theo THỨ TỰ KHO', () => {
    const kho = { ...khoGoc, boTheoEm: { '12121212': boCuaEm } } as unknown as PublicExamBank
    const bai = assignStudentQuestions(kho, '845853', '12121212')
    expect(bai.phanI.map((x) => x.qid)).toEqual(['I-9', 'I-30', 'I-36'])
  })

  it('THIẾU bản đồ: em nhận một tờ đề KHÁC — đây là thứ thầy đã cầm trên tay', () => {
    const bai = assignStudentQuestions(khoGoc, '845853', '12121212')
    const nhan = bai.phanI.map((x) => x.qid)
    expect(nhan.length).toBe(3)
    expect(nhan).not.toEqual(['I-9', 'I-30', 'I-36'])
  })
})
