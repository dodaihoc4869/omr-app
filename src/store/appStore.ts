// State toàn app — một nguồn sự thật duy nhất cho phiên quét hiện tại.
// Không persist ra ngoài phiên (trừ đáp án + danh sách lớp, lưu riêng ở
// IndexedDB) vì dữ liệu học sinh không được rời máy và mỗi buổi chấm là một
// phiên làm việc độc lập.
import { create } from 'zustand'
import type { AnswerKey, StudentAnswers } from '../engine/score'
import { scoreStudent, type ScoreResult } from '../engine/score'
import type { ClassListRow } from '../lib/sheet-gviz'

export type ScreenId =
  | 'classlist'
  | 'examhub'
  | 'examsetup'
  | 'nganhangde'
  | 'examtake'
  | 'exammonitor'
  | 'lichsuca'
  | 'hocsinh'
  | 'toancanh'
  | 'giaobtvn'
  | 'goilenbang'
  | 'cauhoi'
  | 'caidat'
  | 'khodegiao'
  // GAME HÓA 2.0 (bản vẽ docs/ban-ve-gv-2809): trang đầu Tổng quan + màn riêng Chiến dịch luyện.
  | 'tongquan'
  | 'chiendich'
  // LỜI GIẢI TỪNG BƯỚC (29/09): thầy duyệt hồ sơ lời giải theo đề trước khi giao.
  | 'duyetloigiai'
  // BÀN GỠ NÚT THẮT (Vòng học v2, 02/10): thẻ câu em đã đi hết thang tự gỡ mà vẫn vướng — thầy gỡ bước cuối.
  | 'bangonutthat'

export interface ScannedSheet {
  id: string
  scannedAt: string
  answers: StudentAnswers
  score: ScoreResult | null
  hoTen: string
  lop: string
  sdt: string
  sbdKnown: boolean // false nếu SBD không khớp danh sách lớp — cờ "SBD lạ"
  duplicateOf?: string // id của phiếu trùng SBD trước đó, nếu thầy chọn giữ cả hai
  reviewed: boolean // thầy đã xem qua hàng Duyệt cờ và xác nhận (kể cả khi không sửa gì)
  imageDataUrl?: string // ảnh đã warp, dùng để phóng to trong Duyệt cờ
}

interface AppState {
  screen: ScreenId
  setScreen: (s: ScreenId) => void
  /** Mã ca đang mở ở màn Chi tiết ca / Theo dõi (đi từ Lịch sử ca thi hoặc ngay sau khi mở ca). */
  maCaTheoDoi: string
  /** `sbdBaoCao` (tuỳ chọn): mở thẳng Báo cáo chi tiết › Từng em của em này (thay modal báo cáo HS cũ ở app thầy — bản vẽ ca thi 28/09). */
  moChiTietCa: (maCa: string, sbdBaoCao?: string) => void
  /** SBD chờ mở ở Báo cáo chi tiết › Từng em khi màn Theo dõi ca tải xong ca `maCaTheoDoi`. Rỗng = không. */
  sbdBaoCaoCa: string
  xongSbdBaoCaoCa: () => void
  /** SBD đang mở hồ sơ ở màn Học sinh (BA-APP.md đợt 2). Rỗng = đang ở danh sách. */
  sbdDangXem: string
  moHoSoEm: (sbd: string) => void
  /** SBD đang mở ở trang "Toàn cảnh một em" (Hôm nay v2, bước 5) — mở từ ô tra cứu / bấm tên em ở các ô của màn Hôm nay. */
  sbdToanCanh: string
  moToanCanh: (sbd: string) => void
  /** Em thầy vừa bấm "Giao bài riêng" ở hồ sơ: màn Giao bài tập về nhà đọc một lần để chọn sẵn em ấy, rồi xoá. Rỗng = không có. */
  sbdGiaoRieng: string
  datSbdGiaoRieng: (sbd: string) => void

  sheets: ScannedSheet[]
  addSheet: (sheet: ScannedSheet) => void
  updateSheetAnswers: (id: string, answers: StudentAnswers) => void
  markReviewed: (id: string) => void
  removeSheet: (id: string) => void

  answerKeys: Record<string, AnswerKey>
  setAnswerKey: (madeThi: string, key: AnswerKey) => void

  classList: ClassListRow[]
  setClassList: (rows: ClassListRow[]) => void

  toast: { text: string; kind: 'success' | 'warn' | 'error' } | null
  showToast: (text: string, kind?: 'success' | 'warn' | 'error') => void
  clearToast: () => void
}

function recomputeScore(answers: StudentAnswers, key: AnswerKey | undefined): ScoreResult | null {
  if (!key) return null
  try {
    return scoreStudent(answers, key)
  } catch {
    return null
  }
}

export const useAppStore = create<AppState>((set) => ({
  screen: 'examhub',
  setScreen: (s) => set({ screen: s }),
  maCaTheoDoi: '',
  moChiTietCa: (maCa, sbdBaoCao) => set({ maCaTheoDoi: maCa, sbdBaoCaoCa: sbdBaoCao ?? '', screen: 'exammonitor' }),
  sbdBaoCaoCa: '',
  xongSbdBaoCaoCa: () => set({ sbdBaoCaoCa: '' }),
  sbdDangXem: '',
  moHoSoEm: (sbd) => set({ sbdDangXem: sbd, screen: 'hocsinh' }),
  sbdToanCanh: '',
  moToanCanh: (sbd) => set({ sbdToanCanh: sbd, screen: 'toancanh' }),
  sbdGiaoRieng: '',
  datSbdGiaoRieng: (sbd) => set({ sbdGiaoRieng: sbd }),

  sheets: [],
  addSheet: (sheet) => set((st) => ({ sheets: [...st.sheets, sheet] })),
  updateSheetAnswers: (id, answers) =>
    set((st) => ({
      sheets: st.sheets.map((s) =>
        s.id === id
          ? { ...s, answers, score: recomputeScore(answers, st.answerKeys[answers.madeThi]) }
          : s,
      ),
    })),
  markReviewed: (id) => set((st) => ({ sheets: st.sheets.map((s) => (s.id === id ? { ...s, reviewed: true } : s)) })),
  removeSheet: (id) => set((st) => ({ sheets: st.sheets.filter((s) => s.id !== id) })),

  answerKeys: {},
  setAnswerKey: (madeThi, key) =>
    set((st) => ({
      answerKeys: { ...st.answerKeys, [madeThi]: key },
      // Đáp án vừa cập nhật có thể ảnh hưởng các phiếu đã quét cùng mã đề — chấm lại ngay.
      sheets: st.sheets.map((s) =>
        s.answers.madeThi === madeThi ? { ...s, score: recomputeScore(s.answers, key) } : s,
      ),
    })),

  classList: [],
  setClassList: (rows) => set({ classList: rows }),

  toast: null,
  showToast: (text, kind = 'success') => set({ toast: { text, kind } }),
  clearToast: () => set({ toast: null }),
}))
