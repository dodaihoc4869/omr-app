// Xuất BangDiem.xlsx với công thức =SUM() thật (không phải giá trị tĩnh) —
// để thầy mở bằng Excel vẫn tính lại được nếu sửa điểm từng phần tay.
import * as XLSX from 'xlsx'
import { classify, type ScoreResult } from '../engine/score'

export interface StudentRow {
  stt: number
  sbd: string
  hoTen: string
  lop: string
  madeThi: string
  sdtPhuHuynh: string
  score: ScoreResult
}

const HEADER = [
  'STT', 'SBD', 'Họ tên', 'Lớp', 'Mã đề', 'SĐT phụ huynh',
  'Điểm Phần I', 'Điểm Phần II', 'Điểm Phần III', 'Tổng điểm', 'Xếp loại', 'Cờ còn lại',
]

export function buildBangDiemWorkbook(rows: StudentRow[]): XLSX.WorkBook {
  const aoa: (string | number | { t: string; f: string })[][] = [HEADER]

  rows.forEach((r) => {
    const excelRow = aoa.length + 1 // 1-indexed, hàng 1 là header
    aoa.push([
      r.stt,
      r.sbd,
      r.hoTen,
      r.lop,
      r.madeThi,
      r.sdtPhuHuynh,
      r.score.phanIScore,
      r.score.phanIIScore,
      r.score.phanIIIScore,
      { t: 'n', f: `SUM(G${excelRow}:I${excelRow})` },
      classify(r.score.total),
      r.score.remainingFlags,
    ])
  })

  const ws = XLSX.utils.aoa_to_sheet(aoa)
  ws['!cols'] = [
    { wch: 5 }, { wch: 10 }, { wch: 24 }, { wch: 10 }, { wch: 8 }, { wch: 14 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'BangDiem')
  return wb
}

export function downloadBangDiem(rows: StudentRow[], fileName = 'BangDiem.xlsx') {
  const wb = buildBangDiemWorkbook(rows)
  XLSX.writeFile(wb, fileName)
}
