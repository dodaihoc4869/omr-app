// Màn Học sinh — Hồ sơ & nhắn tin: đăng ký 1 LẦN DUY NHẤT (SBD + năm sinh +
// họ tên) để không phải gõ lại lúc vào thi/nhắn tin, và nhắn tin trực tiếp
// cho thầy. Sau khi đăng ký, học sinh KHÔNG có nút tự xoá/đăng ký lại — chỉ
// thầy xoá được (ở màn Giáo viên — Quản lý đăng ký), đúng theo yêu cầu.
import { useEffect, useState } from 'react'
import { GraduationCap, Send, MessageSquareText, NotebookPen } from 'lucide-react'
import { registerStudent, fetchStudentProfile, sendStudentMessage, fetchStudentInbox, markTeacherMessagesRead, baiTapCuaEm, type TeacherMessage, type BaiTapCuaEm } from '../lib/exam-api'
import { loadMyStudentSbd, loadScriptUrl, loadTokenHocSinh, saveMyStudentSbd } from '../lib/exam-db'
import { useAppStore } from '../store/appStore'

function titleCase(s: string): string {
  return s
    .split(' ')
    .map((w) => (w.length === 0 ? w : w[0].toLocaleUpperCase('vi') + w.slice(1).toLocaleLowerCase('vi')))
    .join(' ')
}

export default function StudentProfileScreen() {
  const showToast = useAppStore((s) => s.showToast)
  const [scriptUrl, setScriptUrl] = useState('')
  const [phase, setPhase] = useState<'loading' | 'register' | 'view'>('loading')

  const [sbd, setSbd] = useState('')
  // Link riêng /hs/<token> (BA-APP.md đợt 1): có token thì máy chủ tự tra ra
  // SBD — máy em không tự khai mình là ai nữa.
  const [token, setToken] = useState('')
  const [namSinh, setNamSinh] = useState('')
  const [hoTen, setHoTen] = useState('')
  const [lop, setLop] = useState('')
  const [sdtHS, setSdtHS] = useState('')
  const [sdtPH, setSdtPH] = useState('')
  const [saving, setSaving] = useState(false)

  const [inbox, setInbox] = useState<TeacherMessage[]>([])
  // BÀI TẬP VỀ NHÀ (BA-APP đợt 3) — chỉ đọc được khi em đã có link riêng.
  const [baiTap, setBaiTap] = useState<BaiTapCuaEm[] | null>(null)
  const [msgText, setMsgText] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)

  // Tên hiển thị đúng cấu trúc thầy yêu cầu: "Năm sinh - Họ Tên Học Sinh".
  const hoTenHienThi = namSinh && hoTen.trim() ? `${namSinh} - ${titleCase(hoTen.trim())}` : ''

  useEffect(() => {
    loadScriptUrl().then(setScriptUrl)
    Promise.all([loadMyStudentSbd(), loadTokenHocSinh()]).then(([saved, tk]) => {
      setSbd(saved)
      setToken(tk)
      setPhase(saved || tk ? 'view' : 'register')
    })
  }, [])

  const loadInbox = async (sbdToUse: string, urlToUse: string) => {
    if (!urlToUse.trim() || (!sbdToUse.trim() && !token)) return
    try {
      const ib = await fetchStudentInbox(urlToUse.trim(), sbdToUse.trim(), token)
      setInbox(ib.items || [])
      const unread = (ib.items || []).filter((m) => !m.daXem).map((m) => m.id)
      if (unread.length > 0) markTeacherMessagesRead(urlToUse.trim(), unread).catch(() => {})
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không tải được tin nhắn', 'error')
    }
  }

  useEffect(() => {
    if (phase !== 'view' || (!sbd.trim() && !token) || !scriptUrl.trim()) return
    fetchStudentProfile(scriptUrl.trim(), sbd.trim(), token)
      .then((p) => {
        if (p.found) {
          setNamSinh(p.namSinh || '')
          setHoTen(p.hoTen || '')
          setLop(p.lop || '')
          if (p.sbd) setSbd(String(p.sbd))
        }
      })
      .catch(() => {})
    loadInbox(sbd, scriptUrl)
    if (token) {
      baiTapCuaEm(scriptUrl.trim(), { tokenHS: token })
        .then(setBaiTap)
        .catch(() => setBaiTap([]))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, sbd, scriptUrl, token])

  /** Mở bài tập = vào đúng màn làm bài, đường như link mời ca thi. */
  const moBaiTap = (maCa: string) => {
    location.href = `${import.meta.env.BASE_URL}?examCode=${encodeURIComponent(maCa)}`
  }

  const handleRegister = async () => {
    if (!scriptUrl.trim()) return showToast('Chưa có link kết nối — hỏi thầy link Apps Script', 'error')
    if (!sbd.trim() || !namSinh.trim() || !hoTen.trim()) return showToast('Nhập đủ số báo danh, năm sinh và họ tên', 'error')
    setSaving(true)
    try {
      const tenChuan = titleCase(hoTen.trim())
      await registerStudent(scriptUrl.trim(), sbd.trim(), tenChuan, namSinh.trim(), lop.trim(), sdtHS.trim(), sdtPH.trim())
      await saveMyStudentSbd(sbd.trim())
      setHoTen(tenChuan)
      showToast('Đã gửi đăng ký — chờ thầy duyệt rồi gửi link riêng cho em', 'success')
      setPhase('view')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Đăng ký thất bại', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSendMessage = async () => {
    if (!scriptUrl.trim()) return showToast('Chưa có link kết nối', 'error')
    if (!msgText.trim()) return showToast('Nhập nội dung tin nhắn', 'error')
    setSendingMsg(true)
    try {
      await sendStudentMessage(scriptUrl.trim(), sbd.trim(), hoTenHienThi || hoTen.trim(), lop.trim(), msgText.trim())
      setMsgText('')
      showToast('Đã gửi tin nhắn cho thầy', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Gửi tin nhắn thất bại', 'error')
    } finally {
      setSendingMsg(false)
    }
  }

  if (phase === 'loading') {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Đang tải…</div>
  }

  if (phase === 'register') {
    return (
      <div className="min-h-screen pb-24 px-4 pt-4 space-y-4 bg-slate-50 dark:bg-slate-950">
        <div className="flex items-center gap-2">
          <GraduationCap className="text-indigo-600" size={22} />
          <h1 className="text-xl font-bold">Đăng ký hồ sơ học sinh</h1>
        </div>
        <p className="text-sm text-slate-500">
          Đăng ký 1 lần duy nhất. Gửi xong, THẦY DUYỆT rồi mới gửi cho em link riêng để xem lịch sử làm bài. Trong lúc chờ
          duyệt, em vẫn vào được ca thi thầy mở tự do. Sau khi đăng ký, chỉ thầy mới xoá được để đăng ký lại.
        </p>
        <div>
          <label className="text-xs text-slate-500 pl-1">Số báo danh (thầy cho khi vào thi)</label>
          <input
            className="tap-target w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3"
            placeholder="Số báo danh"
            value={sbd}
            onChange={(e) => setSbd(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 pl-1">Năm sinh</label>
          <input
            className="tap-target w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3"
            placeholder="Vd 2010"
            inputMode="numeric"
            maxLength={4}
            value={namSinh}
            onChange={(e) => setNamSinh(e.target.value.replace(/[^0-9]/g, ''))}
          />
        </div>
        <input
          className="tap-target w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3"
          placeholder="Họ tên"
          value={hoTen}
          onChange={(e) => setHoTen(e.target.value)}
          onBlur={(e) => setHoTen(titleCase(e.target.value.trim()))}
        />
        <input
          className="tap-target w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3"
          placeholder="Lớp (không bắt buộc)"
          value={lop}
          onChange={(e) => setLop(e.target.value)}
        />
        <input
          className="tap-target w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3"
          placeholder="Số điện thoại của em (không bắt buộc)"
          inputMode="tel"
          value={sdtHS}
          onChange={(e) => setSdtHS(e.target.value.replace(/[^0-9]/g, ''))}
        />
        <input
          className="tap-target w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3"
          placeholder="Số điện thoại phụ huynh (không bắt buộc)"
          inputMode="tel"
          value={sdtPH}
          onChange={(e) => setSdtPH(e.target.value.replace(/[^0-9]/g, ''))}
        />
        {hoTenHienThi && (
          <div className="text-xs text-slate-500 pl-1">
            Tên hiển thị: <span className="font-medium text-slate-700 dark:text-slate-300">{hoTenHienThi}</span>
          </div>
        )}
        <button
          onClick={handleRegister}
          disabled={saving}
          className="tap-target w-full rounded-xl bg-indigo-600 text-white font-semibold disabled:opacity-60"
        >
          {saving ? 'Đang lưu…' : 'Đăng ký'}
        </button>
        {sbd.trim() && (
          <button onClick={() => setPhase('view')} className="tap-target w-full rounded-xl bg-slate-200 dark:bg-slate-800 font-semibold">
            Đã đăng ký rồi — vào hồ sơ
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-4 space-y-4 bg-slate-50 dark:bg-slate-950">
      <div className="flex items-center gap-2">
        <GraduationCap className="text-indigo-600" size={22} />
        <h1 className="text-xl font-bold">{hoTenHienThi || 'Hồ sơ học sinh'}</h1>
      </div>
      <div className="text-sm text-slate-500">
        SBD <b className="text-slate-700 dark:text-slate-300">{sbd}</b>
        {lop ? <> — lớp <b className="text-slate-700 dark:text-slate-300">{lop}</b></> : null}
      </div>

      {baiTap !== null && (
        <div className="rounded-xl p-4 space-y-2.5" style={{ background: 'var(--the)', boxShadow: 'var(--bong-1)' }}>
          <div className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--muc)' }}>
            <NotebookPen size={16} /> Bài tập về nhà
          </div>
          {baiTap.length === 0 ? (
            <div className="text-sm" style={{ color: 'var(--nhat)' }}>Thầy chưa giao bài tập nào.</div>
          ) : (
            baiTap.map((b) => (
              <button
                key={b.maCa}
                onClick={() => moBaiTap(b.maCa)}
                className="tap-target w-full text-left rounded-lg p-2.5"
                style={{ background: 'var(--the-2)' }}
                data-bai-tap={b.maCa}
              >
                <div className="font-semibold text-sm">{b.tenCa || `Bài ${b.maCa}`}</div>
                <div className="text-[12px]" style={{ color: 'var(--nhat)' }}>
                  {b.hanNop ? `Hạn ${new Date(b.hanNop).toLocaleDateString('vi-VN')}` : 'Không có hạn'} ·{' '}
                  {b.trangThai === 'da_nop'
                    ? `đã nộp${b.tong !== null ? ` — ${b.tong.toFixed(2).replace('.', ',')} điểm` : ''}`
                    : b.trangThai === 'dang_lam'
                      ? 'đang làm'
                      : b.trangThai === 'qua_han'
                        ? 'QUÁ HẠN — làm muộn vẫn nộp được'
                        : 'chưa làm'}
                </div>
              </button>
            ))
          )}
        </div>
      )}

      <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4 space-y-2.5">
        <div className="font-semibold text-sm flex items-center gap-2">
          <Send size={16} className="text-indigo-600" /> Nhắn tin cho thầy
        </div>
        <textarea
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm min-h-[80px]"
          placeholder="Nhập nội dung muốn trao đổi với thầy…"
          value={msgText}
          onChange={(e) => setMsgText(e.target.value)}
        />
        <button
          onClick={handleSendMessage}
          disabled={sendingMsg}
          className="tap-target w-full rounded-xl bg-indigo-600 text-white font-semibold disabled:opacity-60"
        >
          {sendingMsg ? 'Đang gửi…' : 'Gửi tin nhắn'}
        </button>
      </div>

      {inbox.length > 0 && (
        <div className="rounded-xl p-4 space-y-2.5" style={{ background: 'var(--the)', boxShadow: 'var(--bong-1)' }}>
          <div className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--muc)' }}>
            <MessageSquareText size={16} /> Tin nhắn từ thầy
          </div>
          {inbox.map((m) => (
            <div key={m.id} className="text-sm rounded-lg p-2.5" style={{ background: 'var(--the-2)' }}>
              <div className="whitespace-pre-wrap">{m.noiDung}</div>
              <div className="text-[11px] text-slate-400 mt-1">{new Date(m.thoiGian).toLocaleString('vi-VN')}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
