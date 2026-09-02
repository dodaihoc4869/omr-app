import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import type { AnswerKey, Choice, DS, GradedItem, StudentAnswers } from '../src/engine/score'
import { buildBangDiemWorkbook, type StudentRow } from '../src/lib/xlsx-export'
import { buildDuLieuJson, buildStudentEntry } from '../src/lib/json-export'
import { scoreStudent } from '../src/engine/score'

function item<T>(value: T | null): GradedItem<T> {
  return { value, flag: null }
}

const KEY: AnswerKey = {
  madeThi: '101',
  phanI: new Array(18).fill('A') as Choice[],
  phanII: new Array(4).fill(['D', 'S', 'D', 'S']) as DS[][],
  phanIII: new Array(6).fill('1,00'),
}

const ANSWERS: StudentAnswers = {
  sbd: '000123',
  madeThi: '101',
  phanI: KEY.phanI.map((v) => item<Choice>(v)),
  phanII: KEY.phanII.map((q) => q.map((v) => item<DS>(v))),
  phanIII: KEY.phanIII.map((v) => item<string>(v)),
}

describe('buildBangDiemWorkbook', () => {
  it('sinh công thức SUM thật, không phải giá trị tĩnh', () => {
    const score = scoreStudent(ANSWERS, KEY)
    const rows: StudentRow[] = [{ stt: 1, sbd: '000123', hoTen: 'Lê Minh Đức', lop: '12A1', madeThi: '101', sdtPhuHuynh: '0912345678', score }]
    const wb = buildBangDiemWorkbook(rows)
    const ws = wb.Sheets['BangDiem']
    const totalCell = ws['J2'] // cột Tổng điểm, dòng dữ liệu đầu tiên
    expect(totalCell.f).toBe('SUM(G2:I2)')
    // SĐT phụ huynh phải giữ nguyên số 0 đầu (không bị Excel hiểu thành số)
    const sdtCell = ws['F2']
    expect(String(sdtCell.v)).toBe('0912345678')
  })

  it('mở lại bằng SheetJS đọc đúng header', () => {
    const score = scoreStudent(ANSWERS, KEY)
    const wb = buildBangDiemWorkbook([{ stt: 1, sbd: '1', hoTen: 'A', lop: 'B', madeThi: '101', sdtPhuHuynh: '0', score }])
    const json = XLSX.utils.sheet_to_json(wb.Sheets['BangDiem'], { header: 1 }) as string[][]
    expect(json[0]).toEqual(['STT', 'SBD', 'Họ tên', 'Lớp', 'Mã đề', 'SĐT phụ huynh', 'Điểm Phần I', 'Điểm Phần II', 'Điểm Phần III', 'Tổng điểm', 'Xếp loại', 'Cờ còn lại'])
  })
})

describe('json-export', () => {
  it('buildStudentEntry khớp điểm engine chấm, nghi_van rỗng khi bài sạch', () => {
    const entry = buildStudentEntry('Lê Minh Đức', '12A1', '0912345678', ANSWERS, KEY)
    expect(entry.tong_diem).toBe(10)
    expect(entry.nghi_van).toHaveLength(0)
    expect(entry.sdt_phu_huynh).toBe('0912345678')
  })

  it('buildDuLieuJson bọc đúng metadata', () => {
    const entry = buildStudentEntry('X', 'Y', 'Z', ANSWERS, KEY)
    const doc = buildDuLieuJson([entry])
    expect(doc.nguon).toBe('omr-app')
    expect(doc.hoc_sinh).toHaveLength(1)
    expect(() => new Date(doc.xuat_luc).toISOString()).not.toThrow()
  })
})
