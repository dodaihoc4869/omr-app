// @vitest-environment node
// BỘ BẮN TẢI GIẢ — SO PHẢN HỒI + DÒ LỘ ĐÁP ÁN (scripts/ban-tai-gia/phan-hoi.mjs; Code 1, 22/09/2026; Boss lệnh sau 79bf9ec: "so khớp JSON phản hồi từng lệnh giữa hai mốc, bỏ trường giờ").
import { describe, expect, it } from 'vitest'
// @ts-expect-error — tệp .mjs không có kiểu
import { chuanHoa, kiemLoDapAn, soPhanHoi } from '../scripts/ban-tai-gia/phan-hoi.mjs'

describe('chuanHoa', () => {
  it('xoá giờ ISO-8601 và epoch 13 chữ số; giữ nguyên số/chuỗi khác', () => {
    expect(chuanHoa({ taoLuc: '2026-09-22T07:00:00.000Z', now: 1790000000000, soCau: 6, ten: 'A' })).toEqual({ taoLuc: '<GIO>', now: '<GIO>', soCau: 6, ten: 'A' })
  })
  it('xoá id/session/receipt/token ngẫu nhiên; GIỮ maCa và maBtvn (ổn định)', () => {
    expect(chuanHoa({ id: 'x1', session: 'y2', ma: 'z3', receipt: 'r4', token: 't5', maCa: 'CA1', maBtvn: 'BT1' }))
      .toEqual({ id: '<ID>', session: '<ID>', ma: '<ID>', receipt: '<ID>', token: '<ID>', maCa: 'CA1', maBtvn: 'BT1' })
  })
  it('rút gọn văn bản câu (text/choices/ideas/hinhAnh) thành hash, không chép nội dung thật; hai nội dung khác nhau ⇒ hash khác nhau, giống nhau ⇒ hash giống nhau', () => {
    const a = chuanHoa({ text: 'Nội dung câu hỏi A', choices: ['a', 'b'] })
    const b = chuanHoa({ text: 'Nội dung câu hỏi B', choices: ['a', 'b'] })
    expect(JSON.stringify(a)).not.toContain('Nội dung câu hỏi')
    expect(a.text).not.toBe(b.text)
    expect(a.choices).toBe(chuanHoa({ choices: ['a', 'b'] }).choices)
  })
  it('đệ quy vào mảng và đối tượng lồng nhau; không sửa đầu vào', () => {
    const goc = { cau: [{ qid: 'Q1', maDe: 'D1', hanNop: '2026-09-25T00:00:00.000Z' }] }
    const bacSao = JSON.stringify(goc)
    const ra = chuanHoa(goc)
    expect(ra.cau[0]).toEqual({ qid: 'Q1', maDe: 'D1', hanNop: '<GIO>' })
    expect(JSON.stringify(goc)).toBe(bacSao)
  })
})

describe('kiemLoDapAn', () => {
  const phanHoi = (lenh: string, body: unknown) => ({ lenh, body })
  it('phản hồi CHƯA CHẤM (start/resume/recommendations/mở/nền) có trường dapAn/correct(chuỗi)/solution/loiGiai ⇒ CẢNH BÁO', () => {
    const m = new Map([
      ['1|game-v2/start [Đảo]', phanHoi('game-v2/start [Đảo]', { questions: [{ qid: 'Q1', correct: 'A' }] })],
      ['2|hs/cau-theo-qid [ôn]', phanHoi('hs/cau-theo-qid [ôn]', { cau: [{ qid: 'Q2', solution: 'Lời giải bí mật' }] })],
      ['3|hs/ke-hoach-ngay [mở]', phanHoi('hs/ke-hoach-ngay [mở]', { viec: [{ chiTiet: { loiGiai: 'x' } }] })],
    ])
    const canh = kiemLoDapAn(m)
    expect(canh).toHaveLength(3)
    expect(canh[0]).toMatchObject({ key: '1|game-v2/start [Đảo]', duong: ['questions.0.correct'] })
  })
  it('`correct` KIỂU BOOLEAN (kết quả bài đã nộp trước, vd mom/list liệt kê lịch sử) KHÔNG bị coi là lộ đáp án', () => {
    const m = new Map([['7|mom/list [mở]', phanHoi('mom/list [mở]', { items: [{ trangThai: 'da_nop', questionOutcomes: [{ qid: 'Q1', correct: false }] }] })]])
    expect(kiemLoDapAn(m)).toEqual([])
  })
  it('lệnh ĐÃ CHẤM (nộp, answer, complete, xong-lo, on-lai/nop) được PHÉP có đáp án — không cảnh báo dù trùng mẫu tên lệnh chưa chấm', () => {
    const m = new Map([
      ['1|btvn/xong-lo [nộp chặng]', phanHoi('btvn/xong-lo [nộp chặng]', { ketQua: [{ qid: 'Q1', dung: true, dapAnDung: 'A' }] })],
      ['2|game-v2/answer [Đảo]', phanHoi('game-v2/answer [Đảo]', { correct: true, answer: 'A', solution: 'Vì...' })],
      ['3|hs/on-lai/nop [nộp ôn]', phanHoi('hs/on-lai/nop [nộp ôn]', { ketQua: [{ qid: 'Q1', dapAn: 'A' }] })],
    ])
    expect(kiemLoDapAn(m)).toEqual([])
  })
  it('chấp nhận cả object thường ({key: {lenh, body}}) thay vì chỉ Map', () => {
    expect(kiemLoDapAn({ '1|game-v2/start [Đảo]': phanHoi('game-v2/start [Đảo]', { correct: 'A' }) })).toHaveLength(1)
  })
  it('`game-v2/resume [Đảo]`: khoá `answered[]` (phiếu ĐÃ CHẤM của câu em làm xong trong lượt đang resume — game_v2_attempt) KHÔNG bị coi là lộ đáp án dù có correct/answer/solution; `questions[]` CÒN LẠI (câu chưa làm) vẫn bị soát bình thường', () => {
    const resume = phanHoi('game-v2/resume [Đảo]', {
      ok: true, id: 'x', mode: 'adventure',
      questions: [{ qid: 'Q1', phan: 'I' }, { qid: 'Q2', phan: 'I' }],
      answered: [{ attempt: { qid: 'Q1', correct: false, assisted: false }, correct: false, answer: 'D', solution: { chot: 'vì...' } }],
    })
    expect(kiemLoDapAn(new Map([['1|game-v2/resume [Đảo]', resume]]))).toEqual([])
    const roLe = phanHoi('game-v2/resume [Đảo]', { questions: [{ qid: 'Q1', correct: 'A' }], answered: [] }) // đáp án lọt ra NGOÀI answered (giả lập lỗi thật) vẫn phải bắt được
    expect(kiemLoDapAn(new Map([['1|game-v2/resume [Đảo]', roLe]]))).toHaveLength(1)
  })
})

describe('soPhanHoi', () => {
  it('so cặp (em, lệnh) khớp ở cả hai lô: khớp / khác nhau; đếm chỉ-cũ, chỉ-mới', () => {
    const cu = {
      '1|a': { lenh: 'a', body: { x: 1 } },
      '2|b': { lenh: 'b', body: { x: 2 } },
      '3|c': { lenh: 'c', body: { x: 3 } },
    }
    const moi = {
      '1|a': { lenh: 'a', body: { x: 1 } }, // khớp
      '2|b': { lenh: 'b', body: { x: 99 } }, // khác
      '4|d': { lenh: 'd', body: { x: 4 } }, // chỉ mới
    }
    const r = soPhanHoi(cu, moi)
    expect(r).toMatchObject({ tongChung: 2, khopY: 1 })
    expect(r.khacNhau).toEqual([{ key: '2|b', lenh: 'b' }])
    expect(r.chiCu).toEqual(['3|c'])
    expect(r.chiMoi).toEqual(['4|d'])
  })
  it('rỗng cả hai bên ⇒ mọi số đều 0, không lỗi', () => {
    expect(soPhanHoi({}, {})).toMatchObject({ tongChung: 0, khopY: 0, khacNhau: [], chiCu: [], chiMoi: [] })
  })
})
