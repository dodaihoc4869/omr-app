import { classify } from '../engine/score'
import { countUnreviewed, useAppStore } from '../store/appStore'
import { downloadBangDiem, type StudentRow } from '../lib/xlsx-export'
import { buildStudentEntry, downloadDuLieuJson, type DuLieuStudentEntry } from '../lib/json-export'

export default function ResultsScreen() {
  const sheets = useAppStore((s) => s.sheets)
  const answerKeys = useAppStore((s) => s.answerKeys)
  const showToast = useAppStore((s) => s.showToast)
  const unreviewed = countUnreviewed(sheets)
  const locked = unreviewed > 0

  const handleExport = async () => {
    if (locked) return
    const rows: StudentRow[] = []
    const jsonEntries: DuLieuStudentEntry[] = []
    sheets.forEach((s, i) => {
      if (!s.score) return
      rows.push({
        stt: i + 1,
        sbd: s.answers.sbd,
        hoTen: s.hoTen,
        lop: s.lop,
        madeThi: s.answers.madeThi,
        sdtPhuHuynh: s.sdt,
        score: s.score,
      })
      const key = answerKeys[s.answers.madeThi]
      if (key) jsonEntries.push(buildStudentEntry(s.hoTen, s.lop, s.sdt, s.answers, key))
    })

    downloadBangDiem(rows)
    downloadDuLieuJson(jsonEntries)
    showToast(`Đã xuất ${rows.length} bài — BangDiem.xlsx + dulieu.json`, 'success')

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Kết quả chấm bài', text: `Đã chấm ${rows.length} bài, xuất BangDiem.xlsx và dulieu.json.` })
      } catch {
        /* người dùng huỷ chia sẻ — không phải lỗi */
      }
    }
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-4 space-y-4 bg-slate-50 dark:bg-slate-950">
      <h1 className="text-xl font-bold">Kết quả & Xuất</h1>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 dark:bg-slate-800">
            <tr>
              <th className="p-2 text-left">SBD</th>
              <th className="p-2 text-left">Họ tên</th>
              <th className="p-2 text-left">Mã đề</th>
              <th className="p-2 text-right">Tổng</th>
              <th className="p-2 text-left">Xếp loại</th>
            </tr>
          </thead>
          <tbody>
            {sheets.map((s) => (
              <tr key={s.id} className="border-t border-slate-200 dark:border-slate-800">
                <td className="p-2">{s.answers.sbd}</td>
                <td className="p-2">{s.hoTen || '—'}</td>
                <td className="p-2">{s.answers.madeThi}</td>
                <td className="p-2 text-right font-semibold">{s.score ? s.score.total.toFixed(2) : '—'}</td>
                <td className="p-2">{s.score ? classify(s.score.total) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sheets.length === 0 && <div className="p-4 text-center text-slate-500 text-sm">Chưa có phiếu nào.</div>}
      </div>

      <button
        onClick={handleExport}
        disabled={locked}
        className={`tap-target w-full rounded-xl font-semibold ${
          locked ? 'bg-slate-200 text-slate-400 dark:bg-slate-800' : 'bg-indigo-600 text-white'
        }`}
      >
        {locked ? `Còn ${unreviewed} cờ chưa duyệt — khoá xuất` : 'Xuất BangDiem.xlsx + dulieu.json'}
      </button>
    </div>
  )
}
