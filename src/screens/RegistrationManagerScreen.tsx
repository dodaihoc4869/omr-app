// Màn Giáo viên — Quản lý đăng ký: xem + XOÁ phụ huynh/học sinh đã đăng ký
// (chỉ thầy xoá được, phụ huynh/học sinh không tự xoá trong app của họ — cho
// đăng ký lại khi lỡ đăng ký nhầm). Kèm ô "Gửi tin cho 1 em" — thầy tự XÁC
// NHẬN đúng em (theo SBD, có tra điểm gần nhất để đối chiếu) trước khi gửi,
// KHÔNG suy đoán/khớp mờ theo tên để tránh gửi nhầm dữ liệu điểm cho phụ
// huynh/học sinh khác (dữ liệu vị thành niên — sai người nhận là lỗi nghiêm
// trọng).
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Users, Trash2, Send, RefreshCw, Check, Link2, KeyRound, Smartphone } from 'lucide-react'
import {
  listRegisteredParents,
  listRegisteredStudents,
  listAllFeedback,
  deleteParentRegistration,
  deleteStudentRegistration,
  sendTeacherMessage,
  duyetHoSo,
  capLaiToken,
  huyDuyetHoSo,
  type LoaiHoSo,
  type RegisteredParent,
  type RegisteredStudent,
  type FeedbackSummary,
} from '../lib/exam-api'
import { loadScriptUrl, loadTeacherSecret } from '../lib/exam-db'
import { GOC_APP_HS, GOC_APP_PH, linkRiengVai, tinGuiLinkCaiApp } from '../lib/ca-link'
import { useAppStore } from '../store/appStore'

export default function RegistrationManagerScreen() {
  const showToast = useAppStore((s) => s.showToast)
  const setScreen = useAppStore((s) => s.setScreen)
  const [scriptUrl, setScriptUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [loading, setLoading] = useState(true)
  const [parents, setParents] = useState<RegisteredParent[]>([])
  const [students, setStudents] = useState<RegisteredStudent[]>([])
  const [feedback, setFeedback] = useState<FeedbackSummary[]>([])

  const [composeSbd, setComposeSbd] = useState('')
  const [composeText, setComposeText] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    Promise.all([loadScriptUrl(), loadTeacherSecret()]).then(([url, mat]) => {
      setScriptUrl(url)
      setSecret(mat)
      if (url.trim() && mat.trim()) load(url, mat)
      else setLoading(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const load = async (url: string, mat: string) => {
    setLoading(true)
    try {
      const [ps, ss, fb] = await Promise.all([listRegisteredParents(url.trim(), mat.trim()), listRegisteredStudents(url.trim(), mat.trim()), listAllFeedback(url.trim(), mat.trim())])
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
      await deleteParentRegistration(scriptUrl.trim(), secret.trim(), sdt)
      setParents((prev) => prev.filter((p) => p.sdt !== sdt))
      showToast('Đã xoá đăng ký', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Xoá thất bại', 'error')
    }
  }

  const handleDeleteStudent = async (sbd: string, ten: string) => {
    if (!confirm(`Xoá hồ sơ học sinh "${ten}"? Em sẽ đăng ký lại được ngay sau đó.`)) return
    try {
      await deleteStudentRegistration(scriptUrl.trim(), secret.trim(), sbd)
      setStudents((prev) => prev.filter((s) => s.sbd !== sbd))
      showToast('Đã xoá hồ sơ', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Xoá thất bại', 'error')
    }
  }

  // DUYỆT HỒ SƠ (BA-APP.md đợt 1): duyệt xong máy chủ cấp token, app copy sẵn
  // link riêng để thầy dán vào Zalo. Chưa duyệt thì em/phụ huynh không đọc
  // được gì ngoài ca thi tự do.
  const [dangDuyet, setDangDuyet] = useState('')

  // App học sinh và app phụ huynh đã tách sang repo riêng (TACHAPPHSPH.md).
  // Chừng nào hai app đó chưa chạy thật thì KHÔNG có link để gửi — ẩn hẳn hai
  // nút copy thay vì đưa thầy một link chết. Bật lại bằng cách điền GOC_APP_HS
  // / GOC_APP_PH trong src/lib/ca-link.ts (một chỗ duy nhất).
  const COPY_DUOC: Record<'hs' | 'ph', boolean> = { hs: !!GOC_APP_HS, ph: !!GOC_APP_PH }

  const copyLink = async (vai: 'hs' | 'ph', token: string, ten: string) => {
    const link = linkRiengVai(vai, token)
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      showToast(`Đã copy link riêng của ${ten} — dán vào Zalo gửi đúng người đó`, 'success')
    } catch {
      showToast(link, 'success')
    }
  }

  /** Copy nguyên tin nhắn (link + hướng dẫn cài ra màn hình) để dán Zalo. */
  const copyTinCaiApp = async (vai: 'hs' | 'ph', token: string, ten: string) => {
    const link = linkRiengVai(vai, token)
    if (!link) return
    const tin = tinGuiLinkCaiApp(link, ten, vai)
    try {
      await navigator.clipboard.writeText(tin)
      showToast(`Đã copy tin gửi ${ten} (link + cách cài app)`, 'success')
    } catch {
      showToast(tin, 'success')
    }
  }

  const handleDuyet = async (loai: LoaiHoSo, khoa: string, ten: string, capLai = false) => {
    if (capLai && !confirm(`Cấp lại link cho "${ten}"? Link cũ mất hiệu lực ngay.`)) return
    setDangDuyet(khoa)
    try {
      const kq = capLai
        ? await capLaiToken(scriptUrl.trim(), secret.trim(), loai, khoa)
        : await duyetHoSo(scriptUrl.trim(), secret.trim(), loai, khoa)
      if (loai === 'hs') setStudents((prev) => prev.map((x) => (x.sbd === khoa ? { ...x, token: kq.token, trangThai: 'da_duyet' } : x)))
      else setParents((prev) => prev.map((x) => (x.sdt === khoa ? { ...x, token: kq.token, trangThai: 'da_duyet' } : x)))
      if (COPY_DUOC[loai]) await copyLink(loai, kq.token, ten)
      else showToast(`Đã duyệt ${ten}. App ${loai === 'hs' ? 'học sinh' : 'phụ huynh'} đang tách sang bản riêng — khi xong mới có link gửi.`, 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không duyệt được', 'error')
    } finally {
      setDangDuyet('')
    }
  }

  const handleHuyDuyet = async (loai: LoaiHoSo, khoa: string, ten: string) => {
    if (!confirm(`Thu hồi quyền vào của "${ten}"? Hồ sơ và điểm vẫn giữ nguyên, chỉ link riêng hết hiệu lực.`)) return
    try {
      await huyDuyetHoSo(scriptUrl.trim(), secret.trim(), loai, khoa)
      if (loai === 'hs') setStudents((prev) => prev.map((x) => (x.sbd === khoa ? { ...x, token: '', trangThai: 'cho_duyet' } : x)))
      else setParents((prev) => prev.map((x) => (x.sdt === khoa ? { ...x, token: '', trangThai: 'cho_duyet' } : x)))
      showToast('Đã thu hồi link riêng', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không thu hồi được', 'error')
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
      await sendTeacherMessage(scriptUrl.trim(), secret.trim(), composeSbd.trim(), composeText.trim())
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
            onClick={() => load(scriptUrl, secret)}
            className="tap-target w-9 h-9 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        )}
      </div>

      {!scriptUrl.trim() && <div className="text-sm text-slate-500">Chưa có link Apps Script — vào màn Soạn đề để cấu hình trước.</div>}
      {scriptUrl.trim() && !secret.trim() && (
        <div className="text-sm text-rose-600">Chưa nhập mã bí mật — vào Ngân hàng câu hỏi → Cấu hình. Từ bản này, danh sách học sinh và phụ huynh chỉ đọc được khi có mã bí mật.</div>
      )}

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
                  <div className="text-xs text-slate-400 truncate">
                    SĐT {p.sdt} · {p.hoTenPhuHuynh}
                    {p.token ? ' · đã duyệt' : p.trangThai === 'cho_duyet' ? ' · CHỜ DUYỆT' : ' · hồ sơ cũ (chưa có link riêng)'}
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-1.5">
                  {p.token ? (
                    <>
                      {COPY_DUOC.ph && (
                        <>
                          <button onClick={() => copyLink('ph', p.token ?? '', p.hoTenPhuHuynh || p.sdt)} className="tap-target w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center" title="Copy link riêng">
                            <Link2 size={16} />
                          </button>
                          <button onClick={() => copyTinCaiApp('ph', p.token ?? '', p.hoTenHocSinh || p.sdt)} className="tap-target w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center" title="Copy tin gửi link + cách cài app">
                            <Smartphone size={16} />
                          </button>
                        </>
                      )}
                      <button onClick={() => handleDuyet('ph', p.sdt, p.hoTenPhuHuynh || p.sdt, true)} className="tap-target w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center" title="Cấp lại link (link cũ hết hiệu lực)">
                        <KeyRound size={16} />
                      </button>
                      <button onClick={() => handleHuyDuyet('ph', p.sdt, p.hoTenPhuHuynh || p.sdt)} className="tap-target w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center" title="Thu hồi quyền vào">
                        <ArrowLeft size={16} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleDuyet('ph', p.sdt, p.hoTenPhuHuynh || p.sdt)}
                      disabled={dangDuyet === p.sdt || !secret.trim()}
                      className="tap-target h-9 px-3 rounded-full bg-indigo-600 text-white text-sm font-semibold flex items-center gap-1 disabled:opacity-60"
                    >
                      <Check size={16} /> Duyệt
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteParent(p.sdt, p.hoTenHocSinh || p.sdt)}
                    className="tap-target w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center"
                    title="Xoá đăng ký, cho đăng ký lại"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
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
                  <div className="text-xs text-slate-400 truncate">
                    {s.lop ? `Lớp ${s.lop}` : 'Chưa rõ lớp'}
                    {s.token ? ' · đã duyệt' : s.trangThai === 'cho_duyet' ? ' · CHỜ DUYỆT' : ' · hồ sơ cũ (chưa có link riêng)'}
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-1.5">
                  {s.token ? (
                    <>
                      {COPY_DUOC.hs && (
                        <>
                          <button onClick={() => copyLink('hs', s.token ?? '', s.hoTen || s.sbd)} className="tap-target w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center" title="Copy link riêng">
                            <Link2 size={16} />
                          </button>
                          <button onClick={() => copyTinCaiApp('hs', s.token ?? '', s.hoTen || s.sbd)} className="tap-target w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center" title="Copy tin gửi link + cách cài app">
                            <Smartphone size={16} />
                          </button>
                        </>
                      )}
                      <button onClick={() => handleDuyet('hs', s.sbd, s.hoTen || s.sbd, true)} className="tap-target w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center" title="Cấp lại link (link cũ hết hiệu lực)">
                        <KeyRound size={16} />
                      </button>
                      <button onClick={() => handleHuyDuyet('hs', s.sbd, s.hoTen || s.sbd)} className="tap-target w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center" title="Thu hồi quyền vào">
                        <ArrowLeft size={16} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleDuyet('hs', s.sbd, s.hoTen || s.sbd)}
                      disabled={dangDuyet === s.sbd || !secret.trim()}
                      className="tap-target h-9 px-3 rounded-full bg-indigo-600 text-white text-sm font-semibold flex items-center gap-1 disabled:opacity-60"
                    >
                      <Check size={16} /> Duyệt
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteStudent(s.sbd, s.hoTen)}
                    className="tap-target w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center"
                    title="Xoá hồ sơ, cho đăng ký lại"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
