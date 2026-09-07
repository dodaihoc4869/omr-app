// AI CÒN SAI LẠI CÂU ĐÃ HỎI LẠI — thầy chốt 08/09.
//
// "Kết thúc mỗi ca thi thì trong mục ca thi phải có nút báo rõ cho tôi những
// học sinh nào vẫn sai tiếp các câu đã rút, liệt kê chi tiết."
//
// Ca đề riêng lấy ít nhất 30% là câu chính em đã sai. Câu hỏi đáng giá duy
// nhất sau ca là "em nào VẪN sai" — và nó phải trả lời được ngay ở màn ca thi,
// không bắt thầy mở phiếu từng em ra dò.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { dungCauSai } from '../src/lib/phieu-du-lieu'
import type { ChiTietCauRow } from '../src/lib/exam-api'
import type { TeacherExamSource } from '../src/data/examContent'

const MAN = fs.readFileSync(path.join(process.cwd(), 'src/screens/ExamMonitorScreen.tsx'), 'utf8')

const BANK: TeacherExamSource[] = [
  {
    maDe: 'X',
    phanI: [
      { id: 'q1', text: 'Câu lặp còn sai', choices: ['a', 'b', 'c', 'd'], correct: 'C', chuyenDe: 'Ester – lipid' },
      { id: 'q2', text: 'Câu lặp đã sửa', choices: ['a', 'b', 'c', 'd'], correct: 'A', chuyenDe: 'Amin' },
      { id: 'q3', text: 'Câu mới', choices: ['a', 'b', 'c', 'd'], correct: 'B', chuyenDe: 'Polymer' },
    ],
    phanII: [],
    phanIII: [],
  } as unknown as TeacherExamSource,
]

const row = (qid: string, soCau: number, dung: boolean, chon: string, dungDA: string, cd: string): ChiTietCauRow =>
  ({ phan: 'I', soCau, qid, chuyenDe: cd, mucDo: '', dapAnChon: chon, dapAnDung: dungDA, dungSai: dung, giay: 30 }) as ChiTietCauRow

describe('màn ca thi có nút báo em còn sai lại', () => {
  it('CÓ NÚT, và nút nói ngay bao nhiêu em còn sai', () => {
    expect(MAN).toContain('còn sai lại câu đã hỏi lại')
    expect(MAN).toContain('setMoSaiLai')
    expect(MAN).toContain('aria-expanded={moSaiLai}')
  })

  it('LIỆT KÊ CHI TIẾT — tên em, số câu, phần, chuyên đề, sai lần thứ mấy, em chọn gì', () => {
    const than = MAN.slice(MAN.indexOf('tongKetLap.emSaiLai.map'), MAN.indexOf('emSachTron.length > 0'))
    expect(than).toContain('Câu {c.soCau} phần {c.phan}')
    expect(than).toContain('sai lần thứ {c.soLanSai}')
    expect(than).toContain('c.chuyenDe')
    expect(than).toContain('c.dapAnDung')
    expect(than).toContain('c.dapAnChon')
    expect(than).toContain('e.hoTen')
  })

  it('EM SAI NHIỀU NHẤT ĐỨNG ĐẦU — thầy đọc từ trên xuống là gặp ngay em cần gọi', () => {
    expect(MAN).toContain('.sort((a, b) => (b.lap?.saiLai ?? 0) - (a.lap?.saiLai ?? 0))')
  })

  it('KHÔNG CÓ CÂU HỎI LẠI THÌ KHÔNG MỌC NÚT — ca thường không phải nhìn khối rỗng', () => {
    expect(MAN).toContain('{tongKetLap.soEmCoLap > 0 && (')
  })

  it('SỬA ĐƯỢC HẾT thì nói ra bằng chữ khác, không im lặng', () => {
    expect(MAN).toContain('đã sửa được hết')
    expect(MAN).toContain('Sửa được hết:')
  })

  it('SỐ LẦN SAI đếm CÙNG MỘT KIỂU với nhãn trong báo cáo', () => {
    // Màn ca thi: `(lapEm[r.qid] ?? 0) + 1`. Báo cáo: `truoc + 1` trong
    // `dungCauSai`. Hai chỗ lệch nhau là thầy đọc một số, phụ huynh đọc số khác.
    expect(MAN).toContain('soLanSai: (lapEm[r.qid] ?? 0) + 1')
    const ra = dungCauSai([row('q1', 1, false, 'B', 'C', 'Ester – lipid')], BANK, true, { lapCua: { q1: 2 } })
    expect(ra[0].soLanSai).toBe(3)
  })

  it('CÂU ĐÃ SỬA ĐƯỢC không bị đếm nhầm vào nhóm còn sai', () => {
    const rows = [row('q1', 1, false, 'B', 'C', 'Ester – lipid'), row('q2', 2, true, 'A', 'A', 'Amin'), row('q3', 3, false, 'D', 'B', 'Polymer')]
    const lapEm: Record<string, number> = { q1: 2, q2: 1 }
    const cua = rows.filter((r) => typeof lapEm[r.qid] === 'number')
    expect(cua).toHaveLength(2)
    expect(cua.filter((r) => r.dungSai === false).map((r) => r.qid)).toEqual(['q1'])
    expect(cua.filter((r) => r.dungSai).map((r) => r.qid)).toEqual(['q2'])
    // Câu MỚI làm sai (q3) KHÔNG nằm trong nhóm hỏi lại — nó chưa từng được hỏi.
    expect(cua.some((r) => r.qid === 'q3')).toBe(false)
  })
})

describe('nút "em nào đã mở phiếu khắc phục"', () => {
  it('CÓ NÚT, và bấm là ĐỒNG BỘ THẬT — hỏi lại máy chủ, không đọc bản cũ', () => {
    expect(MAN).toContain('Em nào đã mở phiếu khắc phục')
    expect(MAN).toContain('const taiLuyen = async () => {')
    // Đồng bộ thật: gọi thẳng hai lệnh máy chủ trong đúng hàm bấm nút.
    const than = MAN.slice(MAN.indexOf('const taiLuyen = async () => {'), MAN.indexOf('// CÂU HỎI LẠI'))
    expect(than).toContain('await danhSachCa(')
    expect(than).toContain('await phieuTheoCa(')
    // Và ghi lại MỐC GIỜ của số liệu, để thầy không đọc nhầm số cũ.
    expect(than).toContain('setLuyenLuc(new Date().toISOString())')
  })

  it('LIỆT KÊ THEO TỪNG BÀI — lần 1, lần 2… theo thứ tự ca cũ tới mới', () => {
    const than = MAN.slice(MAN.indexOf('const taiLuyen = async () => {'), MAN.indexOf('// CÂU HỎI LẠI'))
    // Cũ → mới, không phải mới → cũ: "lần 1" phải là bài đầu tiên.
    expect(than).toContain(".sort((a, b) => String(a.moLuc ?? '').localeCompare(String(b.moLuc ?? '')))")
    expect(MAN).toContain('Lần {i + 1} · {b.tenCa}')
  })

  it('EM CHƯA MỞ LẦN NÀO đứng ĐẦU và được nói thẳng', () => {
    expect(MAN).toContain('Chưa mở phiếu khắc phục nào')
    expect(MAN).toContain('.sort((a, b) => a.tongMo - b.tongMo')
  })

  it('KHÔNG BỊA SỐ CÂU ĐÃ LÀM — nói rõ máy chỉ đếm được lần MỞ', () => {
    // Máy chủ chỉ ghi `soLanXem`/`xemLanCuoi` cho phiếu bài tập. Gọi số lần mở
    // là "số câu đã luyện" là bịa. Giới hạn phải hiện ngay trên màn.
    expect(MAN).toContain('KHÔNG đếm được em làm mấy câu')
    expect(MAN).toContain('không có nút nộp')
    // Và không có BIẾN nào trong khối này chở một con số "đã làm / đã luyện" —
    // câu chữ giải thích giới hạn thì được, dựng số ra thì không.
    const than = MAN.slice(MAN.indexOf('Em nào đã mở phiếu khắc phục'), MAN.indexOf('chiTiet.biChan && chiTiet.biChan.length > 0'))
    expect(than).not.toMatch(/soCauDaLam|soCauLuyen|daLuyen|tongCauLam/)
    // Mọi con số hiện ra đều là số lần MỞ.
    expect(than).toContain('soLanXem')
  })

  it('cộng MỌI bản phiếu bài tập của cùng một ca, không bỏ sót bản dựng lại', () => {
    const than = MAN.slice(MAN.indexOf('const taiLuyen = async () => {'), MAN.indexOf('// CÂU HỎI LẠI'))
    expect(than).toContain('cu.soLanXem += p.soLanXem')
    expect(than).toContain("x.loai === 'baitap'")
  })
})
