// State toàn app — một nguồn sự thật duy nhất cho phiên quét hiện tại.
// Không persist ra ngoài phiên (trừ đáp án + danh sách lớp, lưu riêng ở
// IndexedDB) vì dữ liệu học sinh không được rời máy và mỗi buổi chấm là một
// phiên làm việc độc lập.
import { create } from 'zustand'
import type { AnswerKey, StudentAnswers } from '../engine/score'
import { isReviewFlag, scoreStudent, type ScoreResult } from '../engine/score'
import type { ClassListRow } from '../lib/sheet-gviz'

export type ScreenId =
  | 'classlist'
  | 'examhub'
  | 'examsetup'
  | 'nganhangde'
  | 'examtake'
  | 'exammonitor'
  | 'lichsuca'
  | 'parent'
  | 'studentprofile'
  | 'registrationmanager'

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
  moChiTietCa: (maCa: string) => void

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
  moChiTietCa: (maCa) => set({ maCaTheoDoi: maCa, screen: 'exammonitor' }),

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

export function sheetHasUnreviewedFlag(sheet: ScannedSheet): boolean {
  if (sheet.reviewed) return false
  if (!sheet.sbdKnown) return true
  const a = sheet.answers
  const review = a.phanI.some((x) => isReviewFlag(x.flag)) ||
    a.phanII.some((q) => q.some((x) => isReviewFlag(x.flag))) ||
    a.phanIII.some((x) => isReviewFlag(x.flag))
  return review
}

export function countUnreviewed(sheets: ScannedSheet[]): number {
  return sheets.filter(sheetHasUnreviewedFlag).length
}

export const useSheets = () => useAppStore((s) => s.sheets)
