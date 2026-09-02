// Xuất dulieu.json — đúng schema 6.CHẤM BÀI/dulieu.json để nối tiếp khâu
// nhận xét cá nhân hoá + gửi Zalo chạy bằng COWORK.md sẵn có. App này chỉ
// thay khâu đọc ảnh, không đổi các bước sau.
//
// GIẢ ĐỊNH (ghi rõ vì không có quyền truy cập trực tiếp file schema gốc của
// thầy trong phiên này): các trường dưới đây bám sát mô tả trong OMR-APP.md
// mục 8 — "họ tên, mã đề, SĐT phụ huynh, đáp án ba phần, cờ chưa duyệt →
// nghi_van". Nếu tên trường thực tế trong 6.CHẤM BÀI/dulieu.json khác, chỉ
// cần sửa trong hàm buildDuLieuJson() này, không đụng vào engine chấm điểm.
import type { AnswerKey, StudentAnswers } from '../engine/score'
import { isReviewFlag, scoreStudent } from '../engine/score'

export interface DuLieuStudentEntry {
  ho_ten: string
  sbd: string
  lop: string
  ma_de: string
  sdt_phu_huynh: string
  diem_phan_1: number
  diem_phan_2: number
  diem_phan_3: number
  tong_diem: number
  dap_an: {
    phan_i: (string | null)[]
    phan_ii: (string | null)[][]
    phan_iii: (string | null)[]
  }
  nghi_van: string[] // mô tả các câu còn cờ chưa duyệt, rỗng nếu bài sạch
}

export interface DuLieuJson {
  xuat_luc: string // ISO timestamp
  nguon: 'omr-app'
  hoc_sinh: DuLieuStudentEntry[]
}

export function buildStudentEntry(
  hoTen: string,
  lop: string,
  sdtPhuHuynh: string,
  answers: StudentAnswers,
  key: AnswerKey,
): DuLieuStudentEntry {
  const score = scoreStudent(answers, key)

  const nghiVan: string[] = []
  answers.phanI.forEach((a, i) => {
    if (isReviewFlag(a.flag)) nghiVan.push(`Phần I câu ${i + 1}: ${a.flag}`)
  })
  answers.phanII.forEach((q, i) => {
    q.forEach((a, j) => {
      if (isReviewFlag(a.flag)) nghiVan.push(`Phần II câu ${i + 1} ý ${j + 1}: ${a.flag}`)
    })
  })
  answers.phanIII.forEach((a, i) => {
    if (isReviewFlag(a.flag)) nghiVan.push(`Phần III câu ${i + 1}: ${a.flag}`)
  })

  return {
    ho_ten: hoTen,
    sbd: answers.sbd,
    lop,
    ma_de: answers.madeThi,
    sdt_phu_huynh: sdtPhuHuynh,
    diem_phan_1: score.phanIScore,
    diem_phan_2: score.phanIIScore,
    diem_phan_3: score.phanIIIScore,
    tong_diem: score.total,
    dap_an: {
      phan_i: answers.phanI.map((a) => a.value),
      phan_ii: answers.phanII.map((q) => q.map((a) => a.value)),
      phan_iii: answers.phanIII.map((a) => a.value),
    },
    nghi_van: nghiVan,
  }
}

export function buildDuLieuJson(entries: DuLieuStudentEntry[]): DuLieuJson {
  return {
    xuat_luc: new Date().toISOString(),
    nguon: 'omr-app',
    hoc_sinh: entries,
  }
}

export function downloadDuLieuJson(entries: DuLieuStudentEntry[], fileName = 'dulieu.json') {
  const data = buildDuLieuJson(entries)
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}
