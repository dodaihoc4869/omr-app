import { useEffect, useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import { classify, type AnswerKey, type ScoreResult, type StudentAnswers } from '../engine/score'
import { duyetThiLai, listSubmissions, type SubmissionRow, type TrangThaiLuot } from '../lib/exam-api'
import { loadScriptUrl, loadSessionTeacherBank, loadTeacherSecret } from '../lib/exam-db'
import { gradeSubmissionFull } from '../lib/exam-grade'
import { buildStudentEntry, downloadDuLieuJson } from '../lib/json-export'
import { downloadBangDiem, type StudentRow } from '../lib/xlsx-export'
import { useAppStore } from '../store/appStore'

interface GradedRow {
  sbd: string
  hoTen: string
  lop: string
  sdt: string
  thoiGianNop: string
  score: ScoreResult | null
  key: AnswerKey | null
  studentAnswers: StudentAnswers | null
  leaveCount: number
  totalHiddenSec: number
  blocked: boolean
  lanThu: number
  trangThai: TrangThaiLuot
  ghiChu: string
}

const TEN_TRANG_THAI: Record<TrangThaiLuot, string> = {
  dang_lam: 'Đang làm',
  da_nop: 'Đã nộp',
  khoa: 'Bị khoá',
  duoc_duyet_lai: 'Chờ thi lại',
}

export default function ExamMonitorScreen() {
  const showToast = useAppStore((s) => s.showToast)
  const classList = useAppStore((s) => s.classList)

  const [scriptUrl, setScriptUrl] = useState('')
  const [maCa, setMaCa] = useState('')
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<GradedRow[]>([])
  const [noBankWarning, setNoBankWarning] = useState(false)
  const [dangDuyet, setDangDuyet] = useState<string | null>(null)
  // SBD đang chờ thầy xác nhận "Cho thi lại" (xác nhận ngay trong hàng, không dùng hộp thoại trình duyệt).
  const [xacNhanSbd, setXacNhanSbd] = useState<string | null>(null)

  useEffect(() => {
    loadScriptUrl().then(setScriptUrl)
  }, [])

  const buildRow = (s: SubmissionRow, graded: { score: ScoreResult; key: AnswerKey; studentAnswers: StudentAnswers } | null): GradedRow => {
    const student = classList.find((c) => c.sbd === s.sbd)
    return {
      sbd: s.sbd,
      hoTen: student?.hoTen ?? s.hoTen ?? '',
      lop: student?.lop ?? '',
      sdt: student?.sdt ?? '',
      thoiGianNop: s.thoiGianNop,
      score: graded?.score ?? null,
      key: graded?.key ?? null,
      studentAnswers: graded?.studentAnswers ?? null,
      leaveCount: s.integrity?.leaveCount ?? 0,
      totalHiddenSec: Math.round((s.integrity?.totalHiddenMs ?? 0) / 1000),
      blocked: s.integrity?.blocked ?? false,
      lanThu: s.lanThu ?? 1,
      trangThai: s.trangThai ?? 'da_nop',
      ghiChu: s.ghiChu ?? '',
    }
  }

  // Cho 1 em thi lại (QUANLYCATHI mục 1): máy chủ tạo lượt mới, lượt cũ giữ
  // nguyên; bảng này hiện lượt mới nhất kèm nhãn "lần N".
  const handleChoThiLai = async (sbd: string) => {
    const mat = (await loadTeacherSecret()).trim()
    if (!mat) return showToast('Chưa nhập mã bí mật — vào Ngân hàng câu hỏi → Cấu hình', 'error')
    setXacNhanSbd(null)
    setDangDuyet(sbd)
    try {
      const lan = await duyetThiLai(scriptUrl.trim(), mat, maCa.trim(), sbd)
      showToast(`Đã duyệt — em vào lại link là làm lần ${lan}`, 'success')
      setRows((cur) => cur.map((r) => (r.sbd === sbd ? { ...r, trangThai: 'duoc_duyet_lai', lanThu: lan } : r)))
    } catch (e) {
      showToast(`Không duyệt được: ${e instanceof Error ? e.message : 'lỗi không rõ'}`, 'error')
    } finally {
      setDangDuyet(null)
    }
  }

  const handleLoad = async () => {
    if (!scriptUrl.trim()) return showToast('Chưa có link Apps Script — vào màn Soạn đề để nhập', 'error')
    if (!maCa.trim()) return showToast('Nhập mã ca', 'error')
    setLoading(true)
    try {
      const [submissions, teacherBank] = await Promise.all([
        listSubmissions(scriptUrl.trim(), maCa.trim()),
        loadSessionTeacherBank(maCa.trim()),
      ])
      if (!teacherBank) {
        setNoBankWarning(true)
        setRows(submissions.map((s) => buildRow(s, null)))
        return
      }
      setNoBankWarning(false)
      // Chỉ chấm lượt ĐÃ NỘP / BỊ KHOÁ có đáp án; đang làm / chờ thi lại hiện trạng thái thôi.
      const graded = submissions.map((s) => {
        if (!s.dapAn || (s.trangThai !== 'da_nop' && s.trangThai !== 'khoa')) return buildRow(s, null)
        try {
          return buildRow(s, gradeSubmissionFull(teacherBank, maCa.trim(), s.sbd, s.dapAn))
        } catch {
          return buildRow(s, null)
        }
      })
      setRows(graded)
      showToast(`Tải ${graded.length} em · chấm được ${graded.filter((r) => r.score).length} bài`, 'success')
    } catch (e) {
      showToast(`Lỗi tải danh sách: ${e instanceof Error ? e.message : 'không rõ nguyên nhân'}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const gradedRows = rows.filter((r) => r.score && r.key && r.studentAnswers)

  const handleExportXlsx = () => {
    const studentRows: StudentRow[] = gradedRows.map((r, i) => ({
      stt: i + 1,
      sbd: r.sbd,
      hoTen: r.hoTen,
      lop: r.lop,
      madeThi: maCa,
      sdtPhuHuynh: r.sdt,
      score: r.score as ScoreResult,
    }))
    downloadBangDiem(studentRows, `BangDiem_kiemtra_${maCa}.xlsx`)
  }

  const handleExportJson = () => {
    const entries = gradedRows.map((r) =>
      buildStudentEntry(r.hoTen, r.lop, r.sdt, r.studentAnswers as StudentAnswers, r.key as AnswerKey),
    )
    downloadDuLieuJson(entries, `dulieu_kiemtra_${maCa}.json`)
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-4 space-y-4 bg-slate-50 dark:bg-slate-950">
      <h1 className="text-xl font-bold">Theo dõi &amp; chấm bài kiểm tra</h1>

      <div className="flex gap-2">
        <input
          className="tap-target flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3"
          placeholder="Mã ca"
          value={maCa}
          onChange={(e) => setMaCa(e.target.value)}
        />
        <button onClick={handleLoad} disabled={loading} className="tap-target rounded-lg bg-indigo-600 text-white font-semibold px-4">
          {loading ? '…' : 'Tải'}
        </button>
      </div>

      {noBankWarning && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Không tìm thấy ngân hàng câu hỏi (có đáp án) của mã ca này trên máy — chỉ mở ca kiểm tra từ máy nào thì chấm
          được trên máy đó (đáp án không rời máy thầy). Nếu đổi máy, cần mở lại ca hoặc chấm bằng máy đã mở ca.
        </p>
      )}

      {rows.length > 0 && (
        <>
          <div className="text-sm text-slate-500">
            {rows.length} em đã vào · {rows.filter((r) => r.trangThai === 'da_nop' || r.trangThai === 'khoa').length} đã nộp · {gradedRows.length} chấm được
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800">
                <tr>
                  <th className="p-2 text-left">SBD</th>
                  <th className="p-2 text-left">Họ tên</th>
                  <th className="p-2 text-left">Giờ nộp</th>
                  <th className="p-2 text-right">Điểm</th>
                  <th className="p-2 text-left">Xếp loại</th>
                  <th className="p-2 text-right">Rời app</th>
                  <th className="p-2 text-left">Trạng thái</th>
                  <th className="p-2 text-left">Thi lại</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.sbd}
                    className={`border-t border-slate-100 dark:border-slate-800 ${r.blocked ? 'bg-rose-50 dark:bg-rose-950/40' : ''}`}
                  >
                    <td className="p-2">
                      {r.sbd}
                      {r.lanThu > 1 && <span className="ml-1 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 text-[10px] font-bold px-1.5 py-0.5">lần {r.lanThu}</span>}
                    </td>
                    <td className="p-2">{r.hoTen || '(không khớp danh sách lớp)'}</td>
                    <td className="p-2">{r.thoiGianNop ? new Date(r.thoiGianNop).toLocaleTimeString('vi-VN') : '—'}</td>
                    <td className="p-2 text-right font-semibold">{r.score ? r.score.total.toFixed(2) : '—'}</td>
                    <td className="p-2">{r.score ? classify(r.score.total) : ''}</td>
                    <td className={`p-2 text-right ${r.leaveCount >= 1 ? 'text-rose-600 font-semibold' : ''}`}>
                      {r.leaveCount > 0 ? `${r.leaveCount} lần / ${r.totalHiddenSec}s` : '—'}
                    </td>
                    <td className="p-2">
                      {r.blocked || r.trangThai === 'khoa' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5">
                          <TriangleAlert size={11} /> Bị khoá
                        </span>
                      ) : (
                        <span className={r.trangThai === 'dang_lam' ? 'text-indigo-600 font-semibold' : r.trangThai === 'duoc_duyet_lai' ? 'text-amber-600 font-semibold' : ''}>
                          {TEN_TRANG_THAI[r.trangThai]}
                        </span>
                      )}
                      {r.ghiChu && <div className="text-[10px] text-amber-600">{r.ghiChu}</div>}
                    </td>
                    <td className="p-2">
                      {(r.trangThai === 'da_nop' || r.trangThai === 'khoa') &&
                        (xacNhanSbd === r.sbd ? (
                          <span className="inline-flex items-center gap-1">
                            <button onClick={() => handleChoThiLai(r.sbd)} disabled={dangDuyet === r.sbd} className="tap-target rounded-md bg-indigo-600 text-white font-semibold px-2">
                              {dangDuyet === r.sbd ? '…' : 'Đồng ý'}
                            </button>
                            <button onClick={() => setXacNhanSbd(null)} className="tap-target rounded-md bg-slate-200 dark:bg-slate-800 px-2">
                              Huỷ
                            </button>
                          </span>
                        ) : (
                          <button onClick={() => setXacNhanSbd(r.sbd)} className="tap-target rounded-md border border-indigo-300 text-indigo-700 dark:text-indigo-200 font-semibold px-2">
                            Cho thi lại
                          </button>
                        ))}
                      {r.trangThai === 'duoc_duyet_lai' && <span className="text-slate-400">đã duyệt</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400">
            Cột "Rời app" đếm số lần &amp; tổng thời gian học sinh chuyển tab/tắt màn hình lúc làm bài — không phát
            hiện được chụp ảnh màn hình (không trình duyệt nào cho phép web làm việc này), chỉ để thầy tham khảo
            thêm. "Gian lận" là bài bị hệ thống tự khoá + tự nộp ngay lần đầu rời màn hình (quy định từ 2/9/2026).
          </p>

          <div className="flex gap-2">
            <button onClick={handleExportXlsx} disabled={gradedRows.length === 0} className="tap-target flex-1 rounded-lg bg-emerald-600 text-white font-semibold disabled:opacity-50">
              Xuất BangDiem.xlsx
            </button>
            <button onClick={handleExportJson} disabled={gradedRows.length === 0} className="tap-target flex-1 rounded-lg bg-slate-200 dark:bg-slate-800 font-semibold disabled:opacity-50">
              Xuất dulieu.json
            </button>
          </div>
        </>
      )}
    </div>
  )
}
