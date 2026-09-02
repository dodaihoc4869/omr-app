// Màn Phụ huynh — 3 việc: (1) đăng ký 1 lần để app biết SĐT này là phụ huynh
// của học sinh nào, (2) xem nhận xét/điểm từng bài kiểm tra con đã nộp,
// (3) theo dõi GẦN-THỜI-GIAN-THỰC lúc con đang làm bài, kèm cảnh báo ngay
// khi con rời màn hình làm bài (tín hiệu nghi gian lận) — poll lại server
// mỗi ~15 giây, KHÔNG phải push thật (Apps Script không hỗ trợ push).
import { useEffect, useRef, useState } from 'react'
import { HeartHandshake, TriangleAlert, RefreshCw, ShieldAlert, Send, MessageSquareText } from 'lucide-react'
import {
  registerParent,
  fetchParentFeedback,
  fetchParentStatus,
  fetchParentInbox,
  markTeacherMessagesRead,
  sendParentMessage,
  type ParentFeedbackResult,
  type ParentStatus,
  type TeacherMessage,
} from '../lib/exam-api'
import { loadMyParentPhone, loadScriptUrl, saveMyParentPhone } from '../lib/exam-db'
import { useAppStore } from '../store/appStore'

function classifyBadgeColor(xepLoai: string): string {
  if (xepLoai === 'Giỏi') return 'text-emerald-600 dark:text-emerald-400'
  if (xepLoai === 'Khá') return 'text-indigo-600 dark:text-indigo-400'
  if (xepLoai === 'Trung bình') return 'text-amber-600 dark:text-amber-400'
  return 'text-rose-600 dark:text-rose-400'
}

/** In hoa chữ cái đầu mỗi từ, phần còn lại về chữ thường (kiểu "Title Case") — áp
 * dụng cho họ tên con gõ tay, để không phụ thuộc thói quen gõ hoa/thường của phụ huynh. */
function titleCase(s: string): string {
  return s
    .split(' ')
    .map((w) => (w.length === 0 ? w : w[0].toLocaleUpperCase('vi') + w.slice(1).toLocaleLowerCase('vi')))
    .join(' ')
}

export default function ParentScreen() {
  const showToast = useAppStore((s) => s.showToast)
  const [scriptUrl, setScriptUrl] = useState('')
  const [sdt, setSdt] = useState('')
  const [phase, setPhase] = useState<'loading' | 'register' | 'view'>('loading')

  // Đăng ký: SĐT, SBD của con (KHOÁ ĐỐI CHIẾU THẬT — mọi tra cứu bài làm/nhận
  // xét/trạng thái đều theo đúng SBD này, không còn suy đoán qua ngày sinh),
  // ngày sinh của con (chỉ để tự sinh mã phụ huynh cho dễ nhớ, không dùng để
  // đối chiếu), và họ tên con. Họ tên phụ huynh không hỏi nữa — tự sinh theo
  // cấu trúc "<năm sinh con>PH<Họ tên con>".
  const [sbd, setSbd] = useState('')
  const [ngaySinh, setNgaySinh] = useState('')
  const [hoTenHocSinh, setHoTenHocSinh] = useState('')
  const [saving, setSaving] = useState(false)
  const hoTenPhuHuynhAuto = ngaySinh && hoTenHocSinh.trim() ? `${ngaySinh.slice(0, 4)}PH${titleCase(hoTenHocSinh.trim())}` : ''

  const [data, setData] = useState<ParentFeedbackResult | null>(null)
  const [status, setStatus] = useState<ParentStatus | null>(null)
  const [inbox, setInbox] = useState<TeacherMessage[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [msgText, setMsgText] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)

  useEffect(() => {
    loadScriptUrl().then(setScriptUrl)
    loadMyParentPhone().then((saved) => {
      setSdt(saved)
      if (saved) {
        setPhase('view')
      } else {
        setPhase('register')
      }
    })
  }, [])

  const refresh = async (sdtToUse: string, urlToUse: string) => {
    if (!urlToUse.trim() || !sdtToUse.trim()) return
    setRefreshing(true)
    try {
      const [fb, st, ib] = await Promise.all([
        fetchParentFeedback(urlToUse.trim(), sdtToUse.trim()),
        fetchParentStatus(urlToUse.trim(), sdtToUse.trim()),
        fetchParentInbox(urlToUse.trim(), sdtToUse.trim()),
      ])
      setData(fb)
      setStatus(st)
      setInbox(ib.items || [])
      const unread = (ib.items || []).filter((m) => !m.daXem).map((m) => m.id)
      if (unread.length > 0) markTeacherMessagesRead(urlToUse.trim(), unread).catch(() => {})
      if (!fb.found) {
        showToast('Chưa đăng ký với SĐT này — đăng ký lại bên dưới', 'warn')
        setPhase('register')
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không tải được dữ liệu', 'error')
    } finally {
      setRefreshing(false)
    }
  }

  // Poll lại trạng thái mỗi 15s khi đang ở màn xem (để thấy con đang làm bài
  // gần-thời-gian-thực + cảnh báo rời màn hình sớm nhất có thể).
  useEffect(() => {
    if (phase !== 'view' || !sdt.trim() || !scriptUrl.trim()) return
    refresh(sdt, scriptUrl)
    pollRef.current = setInterval(() => refresh(sdt, scriptUrl), 15000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, sdt, scriptUrl])

  const handleRegister = async () => {
    if (!scriptUrl.trim()) return showToast('Chưa có link kết nối — hỏi thầy link Apps Script', 'error')
    if (!sdt.trim() || !sbd.trim() || !ngaySinh.trim() || !hoTenHocSinh.trim())
      return showToast('Nhập đủ SĐT, số báo danh, ngày sinh và họ tên con', 'error')
    setSaving(true)
    try {
      const tenChuan = titleCase(hoTenHocSinh.trim())
      await registerParent(scriptUrl.trim(), sdt.trim(), hoTenPhuHuynhAuto, sbd.trim(), '', tenChuan)
      await saveMyParentPhone(sdt.trim())
      showToast('Đăng ký thành công', 'success')
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
      await sendParentMessage(
        scriptUrl.trim(),
        sdt.trim(),
        data?.hoTenPhuHuynh || '',
        data?.sbd || '',
        data?.lop || '',
        data?.hoTenHocSinh || '',
        msgText.trim(),
      )
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
          <HeartHandshake className="text-indigo-600" size={22} />
          <h1 className="text-xl font-bold">Đăng ký phụ huynh</h1>
        </div>
        <p className="text-sm text-slate-500">
          Đăng ký 1 lần để xem nhận xét bài kiểm tra và theo dõi con làm bài. Thông tin chỉ dùng để đối chiếu đúng học
          sinh, không dùng cho mục đích khác. Sau khi đăng ký, chỉ thầy mới xoá được để đăng ký lại — phụ huynh không tự
          xoá trong app.
        </p>
        <input
          className="tap-target w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3"
          placeholder="Số điện thoại phụ huynh"
          value={sdt}
          onChange={(e) => setSdt(e.target.value)}
        />
        <div>
          <label className="text-xs text-slate-500 pl-1">Số báo danh của con (thầy cho khi vào thi)</label>
          <input
            className="tap-target w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3"
            placeholder="Số báo danh"
            value={sbd}
            onChange={(e) => setSbd(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 pl-1">Ngày sinh của con</label>
          <input
            type="date"
            className="tap-target w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3"
            value={ngaySinh}
            onChange={(e) => setNgaySinh(e.target.value)}
          />
        </div>
        <input
          className="tap-target w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3"
          placeholder="Họ tên con"
          value={hoTenHocSinh}
          onChange={(e) => setHoTenHocSinh(e.target.value)}
          onBlur={(e) => setHoTenHocSinh(titleCase(e.target.value.trim()))}
        />
        {hoTenPhuHuynhAuto && (
          <div className="text-xs text-slate-500 pl-1">
            Mã phụ huynh tự sinh: <span className="font-medium text-slate-700 dark:text-slate-300">{hoTenPhuHuynhAuto}</span>
          </div>
        )}
        <button
          onClick={handleRegister}
          disabled={saving}
          className="tap-target w-full rounded-xl bg-indigo-600 text-white font-semibold disabled:opacity-60"
        >
          {saving ? 'Đang lưu…' : 'Đăng ký'}
        </button>
        {sdt.trim() && (
          <button onClick={() => setPhase('view')} className="tap-target w-full rounded-xl bg-slate-200 dark:bg-slate-800 font-semibold">
            Đã đăng ký rồi — xem nhận xét
          </button>
        )}
      </div>
    )
  }

  const st = status?.status
  const daLamCauHoi = st?.daLamCauHoi ?? 0
  const tongCauHoi = st?.tongCauHoi ?? 0
  const soLanRoiApp = st?.soLanRoiApp ?? 0

  return (
    <div className="min-h-screen pb-24 px-4 pt-4 space-y-4 bg-slate-50 dark:bg-slate-950">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HeartHandshake className="text-indigo-600" size={22} />
          <h1 className="text-xl font-bold">{data?.hoTenHocSinh || 'Con của bạn'}</h1>
        </div>
        <button
          onClick={() => refresh(sdt, scriptUrl)}
          className="tap-target w-9 h-9 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

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

      {st?.blocked && (
        <div className="rounded-xl bg-rose-600 text-white p-4 flex items-start gap-3 shadow-lg">
          <ShieldAlert size={26} className="shrink-0" />
          <div className="text-sm leading-relaxed">
            <b>Con có hành vi nghi gian lận trong lúc thi.</b> Con đã rời màn hình làm bài từ 2 lần trở lên trong ca
            kiểm tra {st.maCa}, bài đã bị hệ thống tự động khoá và nộp. Thầy sẽ xem xét kỹ hơn khi chấm bài.
          </div>
        </div>
      )}
      {!st?.blocked && soLanRoiApp > 0 && st?.dangLam && (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 p-3 flex items-start gap-2.5">
          <TriangleAlert size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-300">
            Con đã rời màn hình làm bài <b>{soLanRoiApp} lần</b> trong ca kiểm tra đang diễn ra — nếu rời thêm 1 lần
            nữa bài sẽ tự động bị khoá và đánh dấu nghi gian lận.
          </div>
        </div>
      )}

      {st?.dangLam && (
        <div className="rounded-xl p-4 space-y-2" style={{ background: 'var(--the)', boxShadow: 'var(--bong-1)' }}>
          <div className="flex items-center gap-2 font-semibold text-sm" style={{ color: 'var(--muc)' }}>
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" /> Đang làm bài — ca {st.maCa}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-300">
            Đã làm {daLamCauHoi}/{tongCauHoi || '?'} câu
          </div>
          <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all"
              style={{ width: tongCauHoi > 0 ? `${Math.min(100, (daLamCauHoi / tongCauHoi) * 100)}%` : '0%' }}
            />
          </div>
          <div className="text-[11px] text-slate-400">Tự cập nhật mỗi ~15 giây.</div>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="font-bold text-indigo-700 dark:text-indigo-400">Nhận xét các bài kiểm tra</h2>
        {(!data?.items || data.items.length === 0) && (
          <div className="text-sm text-slate-500">Chưa có nhận xét bài kiểm tra nào.</div>
        )}
        {data?.items?.map((it) => {
          let wrong: { phanI: number[]; phanII: number[]; phanIII: number[] } = { phanI: [], phanII: [], phanIII: [] }
          try {
            wrong = JSON.parse(it.cauSai)
          } catch {
            // dữ liệu cũ/hỏng — bỏ qua chi tiết câu sai, vẫn hiện điểm
          }
          return (
            <div
              key={`${it.maCa}-${it.thoiGianNop}`}
              className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-400">Ca {it.maCa}</div>
                <div className="text-xs text-slate-400">{new Date(it.thoiGianNop).toLocaleString('vi-VN')}</div>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-extrabold tabular-nums">{it.diem.toFixed(2)}</div>
                <div className="text-sm text-slate-400">/10</div>
                <div className={`text-sm font-semibold ${classifyBadgeColor(it.xepLoai)}`}>{it.xepLoai}</div>
              </div>
              {(wrong.phanI.length > 0 || wrong.phanII.length > 0 || wrong.phanIII.length > 0) && (
                <div className="text-xs text-rose-600 dark:text-rose-400 leading-relaxed">
                  {wrong.phanI.length > 0 && <div>Phần I sai câu: {wrong.phanI.join(', ')}</div>}
                  {wrong.phanII.length > 0 && <div>Phần II sai câu: {wrong.phanII.join(', ')}</div>}
                  {wrong.phanIII.length > 0 && <div>Phần III sai câu: {wrong.phanIII.join(', ')}</div>}
                </div>
              )}
              {wrong.phanI.length === 0 && wrong.phanII.length === 0 && wrong.phanIII.length === 0 && (
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Đúng hết tất cả các câu</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
