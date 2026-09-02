// Ghép các bước đọc file thành 1 luồng duy nhất: tách vùng (exam-answer-key)
// -> tách câu/phương án (exam-question-split) -> đọc bảng đáp án
// (exam-answer-key) -> gắn đáp án đúng vào từng câu. Đây là "bản nháp" đưa
// sang màn Duyệt câu cho thầy xem, KHÔNG tự lưu vào ngân hàng — câu nào chưa
// có đáp án phải được nêu rõ, không gán mặc định.
import { splitExamRegions, parseAnswerKey } from './exam-answer-key'
import { splitPhan, type ParsedOption } from './exam-question-split'

export interface DraftQuestion {
  so: number
  de: string
  pa: ParsedOption[]
  /** Đáp án đúng: Phần I là 1 chữ cái A/B/C/D; Phần II là chuỗi 4 ký tự Đ/S
   * theo thứ tự a-b-c-d; Phần III là đáp án số (giữ nguyên dấu phẩy thập
   * phân). Không xác định được thì để trống — KHÔNG suy đoán. */
  dapAnDung?: string
  coDapAn: boolean
  /** Nghi công thức Hoá bị vỡ khi trích từ PDF — cần đọc lại bằng ảnh. */
  canDocAnh: boolean
}

export interface DraftPhan {
  ten: 'I' | 'II' | 'III'
  cau: DraftQuestion[]
}

export interface ExamDraft {
  maDe?: string
  vungA_soKyTu: number
  vungB_soKyTu: number
  vungC_soKyTu: number
  phan: DraftPhan[]
  /** Danh sách "PHẦN.số câu" nghi công thức bị vỡ, cần đọc lại bằng ảnh. */
  canDocAnh: string[]
  /** Danh sách "PHẦN.số câu" CHƯA có đáp án — bắt buộc thầy điền tay, khoá
   * nút lưu khi danh sách này còn phần tử. */
  thieuDapAn: string[]
  warnings: string[]
}

/** Chạy trọn luồng đọc 1 file đề (đã trích thành text thô) ra bản nháp câu
 * hỏi + đáp án, sẵn sàng cho màn Duyệt câu. */
export function buildExamDraft(text: string): ExamDraft {
  const regions = splitExamRegions(text)
  const phanList = splitPhan(regions.vungA)
  const key = parseAnswerKey(regions.vungB)
  const warnings = [...key.warnings]
  const canDocAnh: string[] = []
  const thieuDapAn: string[] = []

  const phan: DraftPhan[] = phanList.map((p) => {
    const dapAnPhan = p.ten === 'I' ? key.phanI : p.ten === 'II' ? key.phanII : key.phanIII
    const cau: DraftQuestion[] = p.cau.map((c) => {
      const dapAnDung = dapAnPhan[c.so]
      const nhan = `${p.ten}.${c.so}`
      if (c.canDocAnh) canDocAnh.push(nhan)
      if (!dapAnDung) thieuDapAn.push(nhan)
      return { so: c.so, de: c.de, pa: c.pa, dapAnDung, coDapAn: !!dapAnDung, canDocAnh: c.canDocAnh }
    })
    return { ten: p.ten, cau }
  })

  if (phanList.length === 0) {
    warnings.push('Không tìm thấy tiêu đề "PHẦN I/II/III" trong đề — chưa tách được câu hỏi nào, thầy kiểm tra lại file gốc.')
  }

  const maMatch = /M[aã]\s*đ[ềe](?:\s*thi)?\s*[:\s]\s*(\d{2,4})/i.exec(text)

  return {
    maDe: maMatch ? maMatch[1] : undefined,
    vungA_soKyTu: regions.vungA.length,
    vungB_soKyTu: regions.vungB.length,
    vungC_soKyTu: regions.vungC.length,
    phan,
    canDocAnh,
    thieuDapAn,
    warnings,
  }
}
