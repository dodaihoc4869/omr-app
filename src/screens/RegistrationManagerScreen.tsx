// Màn Giáo viên — Quản lý đăng ký: xem + XOÁ phụ huynh/học sinh đã đăng ký
// (chỉ thầy xoá được, phụ huynh/học sinh không tự xoá trong app của họ — cho
// đăng ký lại khi lỡ đăng ký nhầm). Kèm ô "Gửi tin cho 1 em" — thầy tự XÁC
// NHẬN đúng em (theo SBD, có tra điểm gần nhất để đối chiếu) trước khi gửi,
// KHÔNG suy đoán/khớp mờ theo tên để tránh gửi nhầm dữ liệu điểm cho phụ
// huynh/học sinh khác (dữ liệu vị thành niên — sai người nhận là lỗi nghiêm
// trọng).
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Users, Trash2, Send, RefreshCw } from 'lucide-react'
import {
  listRegisteredParents,
  listRegisteredStudents,
  listAllFeedback,
  deleteParentRegistration,
  deleteStudentRegistration,
  sendTeacherMessage,
  type RegisteredParent,
  type RegisteredStudent,
  type FeedbackSummary,
} from '../lib/exam-api'
import { loadScriptUrl } from '../lib/exam-db'
import { useAppStore } from '../store/appStore'

export default function RegistrationManagerScreen() {
  const showToast = useAppStore((s) => s.showToast)
  const setScreen = useAppStore((s) => s.setScreen)
  const [scriptUrl, setScriptUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [parents, setParents] = useState<RegisteredParent[]>([])
  const [students, setStudents] = useState<RegisteredStudent[]>([])
  const [feedback, setFeedback] = useState<FeedbackSummary[]>([])

  const [composeSbd, setComposeSbd] = useState('')
  const [composeText, setComposeText] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    loadScriptUrl().then((url) => {
      setScriptUrl(url)
      if (url.trim()) load(url)
      else setLoading(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const load = async (url: string) => {
    setLoading(true)
    try {
      const [ps, ss, fb] = await Promise.all([listRegisteredParents(url.trim()), listRegisteredStudents(url.trim()), listAllFeedback(url.trim())])
      setParents(ps)
      setStudents(ss)
      setFeedback(fb)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không tải được dữ liệu', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteParent = async (sdt: string, ten: string) => {
    if (!confirm(`Xoá đăng ký phụ huynh của "${ten}"? Phụ huynh sẽ đăng ký lại được ngay sau đó.`)) return
    try {
      await deleteParentRegistration(scriptUrl.trim(), sdt)
      setParents((prev) => prev.filter((p) => p.sdt !== sdt))
      showToast('Đã xoá đăng ký', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Xoá thất bại', 'error')
    }
  }

  const handleDeleteStudent = async (sbd: string, ten: string) => {
    if (!confirm(`Xoá hồ sơ học sinh "${ten}"? Em sẽ đăng ký lại được ngay sau đó.`)) return
    try {
      await deleteStudentRegistration(scriptUrl.trim(), sbd)
      setStudents((prev) => prev.filter((s) => s.sbd !== sbd))
      showToast('Đã xoá hồ sơ', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Xoá thất bại', 'error')
    }
  }

  // Điểm gần nhất của SBD đang soạn tin — hiện ra để thầy tự đối chiếu đúng
  // em trước khi bấm gửi (không tự động chèn/gửi điểm thay thầy).
  const latestScoreForCompose = useMemo(() => {
    const rows = feedback.filter((f) => f.sbd === composeSbd.trim())
    if (rows.length === 0) return null
    return rows.sort((a, b) => new Date(b.thoiGianNop).getTime() - new Date(a.thoiGianNop).getTime())[0]
  }, [feedback, composeSbd])

  const matchedStudent = students.find((s) => s.sbd === composeSbd.trim())
  const matchedParent = parents.find((p) => p.sbd === composeSbd.trim())

  const handleSend = async () => {
    if (!composeSbd.trim() || !composeText.trim()) return showToast('Nhập SBD và nội dung tin nhắn', 'error')
    setSending(true)
    try {
      await sendTeacherMessage(scriptUrl.trim(), composeSbd.trim(), composeText.trim())
      showToast('Đã gửi — phụ huynh/học sinh của SBD này sẽ thấy khi mở app', 'success')
      setComposeText('')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Gửi thất bại', 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-4 space-y-5 bg-slate-50 dark:bg-slate-950">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setScreen('examhub')} className="tap-target w-9 h-9 rounded-full flex items-center justify-center text-slate-500">
            <ArrowLeft size={18} />
          </button>
          <Users className="text-indigo-600" size={22} />
          <h1 className="text-xl font-bold">Quản lý đăng ký</h1>
        </div>
        {scriptUrl.trim() && (
          <button
            onClick={() => load(scriptUrl)}
            className="tap-target w-9 h-9 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        )}
      </div>

      {!scriptUrl.trim() && <div className="text-sm text-slate-500">Chưa có link Apps Script — vào màn Soạn đề để cấu hình trước.</div>}

      {scriptUrl.trim() && (
        <>
          <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4 space-y-2.5">
            <div className="font-semibold text-sm flex items-center gap-2">
              <Send size={16} className="text-indigo-600" /> Gửi tin cho 1 em (theo SBD)
            </div>
            <p className="text-xs text-slate-500">
              Nhập đúng SBD — app hiện tên + điểm gần nhất để thầy tự đối chiếu đúng em trước khi gửi, không tự đoán
              theo tên để tránh gửi nhầm.
            </p>
            <input
              className="tap-target w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3"
              placeholder="Số báo danh"
              value={composeSbd}
              onChange={(e) => setComposeSbd(e.target.value)}
            />
            {composeSbd.trim() && (
              <div className="text-xs rounded-lg bg-slate-50 dark:bg-slate-800 p-2.5 space-y-0.5">
                <div>
                  Học sinh: <b>{matchedStudent?.hoTen || matchedParent?.hoTenHocSinh || '(chưa có hồ sơ/đăng ký với SBD này)'}</b>
                </div>
                <div>Điểm gần nhất: {latestScoreForCompose ? <b>{latestScoreForCompose.diem} — {latestScoreForCompose.xepLoai} (ca {latestScoreForCompose.maCa})</b> : 'chưa có'}</div>
              </div>
            )}
            <textarea
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm min-h-[70px]"
              placeholder="Nội dung nhắn cho phụ huynh/học sinh của SBD này…"
              value={composeText}
              onChange={(e) => setComposeText(e.target.value)}
            />
            <button
              onClick={handleSend}
              disabled={sending}
              className="tap-target w-full rounded-xl bg-indigo-600 text-white font-semibold disabled:opacity-60"
            >
              {sending ? 'Đang gửi…' : 'Gửi'}
            </button>
          </div>

          <div className="space-y-2">
            <h2 className="font-bold text-indigo-700 dark:text-indigo-400 text-sm">Phụ huynh đã đăng ký ({parents.length})</h2>
            {parents.length === 0 && !loading && <div className="text-sm text-slate-500">Chưa có phụ huynh nào đăng ký.</div>}
            {parents.map((p) => (
              <div key={p.sdt} className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 flex items-center justify-between gap-2">
                <div className="text-sm min-w-0">
                  <div className="font-medium truncate">{p.hoTenHocSinh || '(chưa rõ tên con)'} — SBD {p.sbd}</div>
                  <div className="text-xs text-slate-400 truncate">SĐT {p.sdt} · {p.hoTenPhuHuynh}</div>
                </div>
                <button
                  onClick={() => handleDeleteParent(p.sdt, p.hoTenHocSinh || p.sdt)}
                  className="tap-target shrink-0 w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center"
                  title="Xoá đăng ký, cho đăng ký lại"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <h2 className="font-bold text-indigo-700 dark:text-indigo-400 text-sm">Học sinh đã đăng ký hồ sơ ({students.length})</h2>
            {students.length === 0 && !loading && <div className="text-sm text-slate-500">Chưa có học sinh nào đăng ký.</div>}
            {students.map((s) => (
              <div key={s.sbd} className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 flex items-center justify-between gap-2">
                <div className="text-sm min-w-0">
                  <div className="font-medium truncate">{s.namSinh} - {s.hoTen} — SBD {s.sbd}</div>
                  <div className="text-xs text-slate-400 truncate">{s.lop ? `Lớp ${s.lop}` : 'Chưa rõ lớp'}</div>
                </div>
                <button
                  onClick={() => handleDeleteStudent(s.sbd, s.hoTen)}
                  className="tap-target shrink-0 w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center"
                  title="Xoá hồ sơ, cho đăng ký lại"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
