// CA 814335 "Test4" — số liệu THẬT lấy từ bảng chấm trên máy chủ 14/09.
//
// Thầy bắt được: em được 2,00 điểm phần II mà báo cáo in "Đúng 0/12 câu · Sai
// 12 câu". Phép kiểm này dựng lại đúng 12 dòng ấy.
import { describe, expect, it } from 'vitest'
import { demKetQua, chuTomTat, soYDungPhanII, soYCuaCau, type CauDeDem } from '../src/lib/dem-ket-qua'

// Nguyên văn bảng chấm ca 814335, SBD 12121212.
const TEST4: CauDeDem[] = [
  { phan: 'I', dapAnChon: 'A', dapAnDung: 'D', dungSai: false },
  { phan: 'I', dapAnChon: 'C', dapAnDung: 'A', dungSai: false },
  { phan: 'I', dapAnChon: 'B', dapAnDung: 'C', dungSai: false },
  { phan: 'I', dapAnChon: 'D', dapAnDung: 'C', dungSai: false },
  { phan: 'I', dapAnChon: 'A', dapAnDung: 'C', dungSai: false },
  { phan: 'I', dapAnChon: 'C', dapAnDung: 'D', dungSai: false },
  { phan: 'I', dapAnChon: 'C', dapAnDung: 'B', dungSai: false },
  { phan: 'I', dapAnChon: 'B', dapAnDung: 'A', dungSai: false },
  { phan: 'II', dapAnChon: 'SDDS', dapAnDung: 'DDDS', dungSai: false },
  { phan: 'II', dapAnChon: 'DDDS', dapAnDung: 'DDDD', dungSai: false },
  { phan: 'III', dapAnChon: '2', dapAnDung: '6', dungSai: false },
  { phan: 'III', dapAnChon: '3', dapAnDung: '9', dungSai: false },
]

describe('ca Test4 — không được báo 12 câu sai khi em có điểm', () => {
  it('đếm đúng sáu ý phần II mà bản cũ nuốt mất', () => {
    const k = demKetQua(TEST4)
    expect(k.tongCau).toBe(12)
    expect(k.yPhanII).toEqual({ tong: 8, dung: 6 })
  })

  it('hai câu phần II là ĐÚNG MỘT PHẦN, không phải sai', () => {
    const k = demKetQua(TEST4)
    expect(k.soDungMotPhan).toBe(2)
    expect(k.soSai).toBe(10)
    expect(k.soDung).toBe(0)
    expect(k.soBoTrong).toBe(0)
    // Bốn nhóm cộng lại đúng bằng tổng — không câu nào đếm hai lần, không câu
    // nào rơi ra ngoài.
    expect(k.soDung + k.soDungMotPhan + k.soSai + k.soBoTrong).toBe(k.tongCau)
  })

  it('dòng tóm tắt không còn nói "Sai 12 câu"', () => {
    const s = chuTomTat(demKetQua(TEST4))
    expect(s).toBe('Đúng 0/12 câu · 2 câu đúng một phần · Sai 10 câu')
    expect(s).not.toContain('Sai 12 câu')
  })
})

describe('luật đếm', () => {
  it('câu bỏ trống KHÔNG bị đếm thành sai', () => {
    const k = demKetQua([
      { phan: 'I', dapAnChon: '', dapAnDung: 'A', dungSai: null },
      { phan: 'I', dapAnChon: 'A', dapAnDung: 'A', dungSai: true },
    ])
    expect(k).toMatchObject({ tongCau: 2, soDung: 1, soSai: 0, soBoTrong: 1, soDungMotPhan: 0 })
    expect(chuTomTat(k)).toBe('Đúng 1/2 câu · Bỏ trống 1 câu')
  })

  it('phần II bỏ trống hẳn ("----") thì không ý nào tính là đúng', () => {
    expect(soYDungPhanII('----', 'DDSS')).toBe(0)
    expect(soYDungPhanII('----', '----')).toBe(0)
    const k = demKetQua([{ phan: 'II', dapAnChon: '----', dapAnDung: 'DDSS', dungSai: null }])
    expect(k.soBoTrong).toBe(1)
    expect(k.soSai).toBe(0)
    expect(k.yPhanII).toEqual({ tong: 4, dung: 0 })
  })

  it('phần II tô nửa chừng thì chỉ tính ô đã tô', () => {
    expect(soYDungPhanII('D-S-', 'DDSS')).toBe(2)
    const k = demKetQua([{ phan: 'II', dapAnChon: 'D-S-', dapAnDung: 'DDSS', dungSai: false }])
    expect(k.soDungMotPhan).toBe(1)
    expect(k.soSai).toBe(0)
  })

  it('phần II sai sạch bốn ý vẫn là câu SAI', () => {
    expect(soYDungPhanII('SSDD', 'DDSS')).toBe(0)
    const k = demKetQua([{ phan: 'II', dapAnChon: 'SSDD', dapAnDung: 'DDSS', dungSai: false }])
    expect(k.soSai).toBe(1)
    expect(k.soDungMotPhan).toBe(0)
  })

  it('chữ "Đ" của kho đề cũ tính y như "D"', () => {
    expect(soYDungPhanII('ĐĐSS', 'DDSS')).toBe(4)
  })

  it('đáp án phần II ít hơn bốn ý thì đếm theo đúng số ý có thật', () => {
    expect(soYCuaCau('DDS')).toBe(3)
    expect(soYCuaCau('')).toBe(4)
    expect(soYCuaCau('DDSSD')).toBe(4)
  })

  it('phần I và III không bao giờ có "đúng một phần"', () => {
    const k = demKetQua([
      { phan: 'I', dapAnChon: 'A', dapAnDung: 'B', dungSai: false },
      { phan: 'III', dapAnChon: '2', dapAnDung: '6', dungSai: false },
    ])
    expect(k.soDungMotPhan).toBe(0)
    expect(k.soSai).toBe(2)
    expect(k.yPhanII).toEqual({ tong: 0, dung: 0 })
  })

  it('bảng chấm rỗng thì trả số không, không nổ', () => {
    expect(demKetQua([])).toEqual({ tongCau: 0, soDung: 0, soDungMotPhan: 0, soSai: 0, soBoTrong: 0, yPhanII: { tong: 0, dung: 0 } })
  })
})
