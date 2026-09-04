// MỞ CA KIỂM TRA — tối giản theo yêu cầu thầy (2026-09-02): đề đã tự về từ
// kho, link Apps Script đã cấu hình 1 lần ở màn Ngân hàng câu hỏi, nên màn
// này CHỈ còn 3 việc: chọn đề · lớp & thời gian · cách công bố điểm → Mở ca.
// Không còn mục dán link, không xoá đề ở đây (xoá ở Ngân hàng câu hỏi).
import { useEffect, useMemo, useState } from 'react'
import { CheckSquare, Square, Library, Copy, Check } from 'lucide-react'
import { bankSizeWarning, mergeAndStrip, mergeKeepAnswers, type TeacherExamSource } from '../data/examContent'
import { randomSessionCode, taoLinkMoi } from '../lib/ca-link'
import { TheNoiDung, Hang, OThongBao, NutChinh } from '../components/DesignSystem'
import NutDongBo from '../components/NutDongBo'
import { chuoi, danhSachEm, khoiTuNamSinh, publishSession, type CongBoDiem, type PhamViCa } from '../lib/exam-api'
import { loadExamSources, loadScriptUrl, loadTeacherSecret, saveSessionTeacherBank } from '../lib/exam-db'
import { dongBoNganHang } from '../lib/exam-sync'
import { useAppStore } from '../store/appStore'

const O_NHAP: React.CSSProperties = {
  height: 52,
  borderRadius: 'var(--bo-1)',
  padding: '0 var(--k4)',
  background: 'var(--the-2)',
  border: '1.5px solid transparent',
  fontFamily: 'var(--sans)',
  fontSize: 'var(--cx-2)',
  color: 'var(--muc)',
  outline: 'none',
  width: '100%',
}
const NHAN_NHO: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }
const TIEU_DE_MUC: React.CSSProperties = { fontFamily: 'var(--serif)', fontSize: 'var(--cx-3)', fontWeight: 700, color: 'var(--muc)' }
const SO: React.CSSProperties = { fontFamily: 'var(--sans)', fontVariantNumeric: 'tabular-nums' }

/** Cửa sổ VÀO PHÒNG (QUANLYCATHI mục 3): số phút sau giờ bắt đầu còn cho vào;
 * 0 = không giới hạn (luyện tập ngoài giờ). Thời lượng làm bài tách riêng —
 * em vào muộn 5 phút vẫn đủ giờ làm. Mặc định 30 phút (giả định: tại lớp, cả
 * lớp vào trong nửa giờ đầu). */
const HAN_VAO_CHON: { phut: number; ten: string }[] = [
  { phut: 15, ten: '15 phút' },
  { phut: 30, ten: '30 phút' },
  { phut: 60, ten: '60 phút' },
  { phut: 0, ten: 'Không giới hạn' },
]

/** Giá trị mặc định cho ô hẹn giờ (datetime-local): tròn 5 phút tới, theo giờ máy thầy. */
function henGioMacDinh(): string {
  const d = new Date(Date.now() + 5 * 60000)
  d.setSeconds(0, 0)
  d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

function gioHienThi(iso: string): string {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return ''
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

/** Chip chọn 1 trong nhiều (bắt đầu ngay/hẹn giờ, hạn vào phòng) — cùng kiểu với chip lớp. */
function ChipChon({ chon, onClick, children }: { chon: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={chon}
      onClick={onClick}
      className="tap-target font-bold"
      style={{
        ...SO,
        fontSize: 'var(--cx-2)',
        padding: '0 var(--k4)',
        borderRadius: 'var(--bo-tron)',
        background: chon ? 'var(--muc)' : 'var(--the-2)',
        color: chon ? 'var(--muc-nguoc)' : 'var(--muc)',
        transitionProperty: 'background-color, color',
        transitionDuration: 'var(--nhanh)',
      }}
    >
      {children}
    </button>
  )
}

/** Phạm vi gửi ca (QUANLYCATHI mục 4) — máy chủ kiểm tra lúc vào thi, không chỉ ẩn giao diện. */
const PHAM_VI_CHON: { id: PhamViCa; ten: string; mota: string }[] = [
  { id: 'tu_do', ten: 'Tự do', mota: 'Ai có mã ca đều vào được — luyện tập, ôn ngoài giờ.' },
  { id: 'khoi', ten: 'Theo khối', mota: 'Chọn năm sinh; em không đúng khối (theo hồ sơ đã đăng ký) bị chặn.' },
  { id: 'chon', ten: 'Chọn từng em', mota: 'Tích từng em trong danh sách — thi lại, phụ đạo, kiểm tra riêng nhóm yếu.' },
]

/** Năm sinh gợi ý: 5 năm quanh khối 10–12 hiện tại. */
function dsNamSinhGoiY(): string[] {
  const nam = new Date().getFullYear()
  const dau = nam - 5 - 12 // khối 12 năm nay
  return Array.from({ length: 5 }, (_, i) => String(dau - 1 + i))
}

const CACH_CONG_BO: { id: CongBoDiem; ten: string; mota: string }[] = [
  { id: 'khong', ten: 'Không công bố trên máy em', mota: 'Thầy chấm ở màn Theo dõi rồi gửi nhận xét cho phụ huynh.' },
  { id: 'ngay', ten: 'Ngay sau khi em nộp bài', mota: 'Hiện điểm + câu sai + lời giải trên máy em. Em nộp sớm có thể kể đáp án cho em đang làm.' },
  { id: 'ca_lop_xong', ten: 'Khi cả lớp nộp xong', mota: 'Em nộp xong chỉ thấy "đang chờ cả lớp"; điểm tự hiện khi mọi em đã vào thi đều nộp (hoặc đều hết giờ).' },
]

export default function ExamSetupScreen() {
  const showToast = useAppStore((s) => s.showToast)
  const setScreen = useAppStore((s) => s.setScreen)
  const moChiTietCa = useAppStore((s) => s.moChiTietCa)
  const classList = useAppStore((s) => s.classList)

  const [scriptUrl, setScriptUrl] = useState('')
  const [savedSources, setSavedSources] = useState<TeacherExamSource[]>([])
  const [selectedMaDe, setSelectedMaDe] = useState<Set<string>>(new Set())
  const [timKiemMaDe, setTimKiemMaDe] = useState('')
  // Lọc theo NHÓM ĐỀ (= thư mục con thầy tạo trong kho-de/moi/); '' = tất cả.
  const [nhomLoc, setNhomLoc] = useState('')

  const [lop, setLop] = useState('')
  const [thoiGianPhut, setThoiGianPhut] = useState(45)
  // 3 mốc thời gian: bắt đầu (ngay / hẹn giờ) · hạn vào phòng (phút sau bắt đầu) · thời lượng.
  const [batDauCach, setBatDauCach] = useState<'ngay' | 'hen'>('ngay')
  const [batDauLocal, setBatDauLocal] = useState(henGioMacDinh)
  const [hanVaoPhut, setHanVaoPhut] = useState(30)
  const [congBoDiem, setCongBoDiem] = useState<CongBoDiem>('khong')
  // Tên ca (tuỳ chọn) + phạm vi gửi ca.
  const [tenCa, setTenCa] = useState('')
  // Chống gian lận theo mức (mục 6): rời màn lần thứ N → khoá; một lần rời quá M giây → khoá.
  const [nguongLan, setNguongLan] = useState(3)
  // Mặc định 10 giây (BA-APP mục 3): 2 giây gắt tới mức một cuộc gọi đến cũng
  // khoá bài, nên để 10 và cho thầy hạ xuống 2 khi cần siết ca quan trọng.
  const [nguongGiay, setNguongGiay] = useState(10)
  const [phamVi, setPhamVi] = useState<PhamViCa>('tu_do')
  const [namSinhKhoi, setNamSinhKhoi] = useState('')
  const [chonSbd, setChonSbd] = useState<Set<string>>(new Set())
  const [timTen, setTimTen] = useState('')
  // Danh sách em để tích: danh sách lớp (Google Sheet) — không có thì lấy hồ sơ đã đăng ký trên máy chủ.
  const [dsDangKy, setDsDangKy] = useState<{ sbd: string; hoTen: string; lop: string }[] | null>(null)
  const [opening, setOpening] = useState(false)
  const [opened, setOpened] = useState<{ maCa: string; joinLink: string; batDau: string; hetHanVao: string } | null>(null)
  const [daCopy, setDaCopy] = useState(false)
  // Mã bí mật — mọi lệnh đọc dữ liệu học sinh của thầy đều phải kèm (BA-APP đợt 1).
  const [maBiMat, setMaBiMat] = useState('')

  useEffect(() => {
    let huy = false
    loadScriptUrl().then(setScriptUrl)
    loadTeacherSecret().then(setMaBiMat)
    loadExamSources().then((list) => {
      if (huy) return
      setSavedSources(list)
      // Chỉ có 1 đề thì chọn sẵn luôn — bớt một chạm.
      if (list.length === 1) setSelectedMaDe(new Set([list[0].maDe]))
    })
    // Đồng bộ IM LẶNG khi mở màn (đề pipeline vừa đẩy lên tự về) — lỗi/mất
    // mạng thì bỏ qua, thầy vẫn còn nút "Đồng bộ" để bấm tay.
    Promise.all([loadScriptUrl(), loadTeacherSecret()])
      .then(([url, mat]) => (url.trim() && mat.trim() ? dongBoNganHang(url.trim(), mat.trim()) : null))
      .then((kq) => {
        if (!kq || huy) return
        if (kq.moi.length + kq.capNhat.length > 0) loadExamSources().then((list) => !huy && setSavedSources(list))
      })
      .catch(() => {})
    return () => {
      huy = true
    }
  }, [])

  // Lớp gợi ý từ danh sách lớp đã nối (Google Sheet) — bấm 1 chạm thay vì gõ.
  const dsLop = useMemo(() => Array.from(new Set(classList.map((r) => chuoi(r.lop).trim()).filter(Boolean))).sort(), [classList])

  // Nguồn em để "Chọn từng em": danh sách lớp; rỗng thì hồ sơ đã đăng ký (tải khi cần).
  useEffect(() => {
    if (phamVi !== 'chon' || classList.length > 0 || dsDangKy !== null || !scriptUrl.trim() || !maBiMat.trim()) return
    // Nguồn phải là DANH SÁCH LỚP đã nạp (danhSachEm gộp danh sách + hồ sơ + lượt
    // thi), không phải listStudents — listStudents chỉ đọc bảng hồ sơ nên chỉ ra
    // vài em đã từng đăng ký, thầy tích không thấy 251 em trong danh sách.
    danhSachEm(scriptUrl.trim(), maBiMat.trim())
      .then((ds) => setDsDangKy(ds.map((d) => ({ sbd: chuoi(d.sbd), hoTen: chuoi(d.hoTen), lop: chuoi(d.lop) }))))
      .catch(() => setDsDangKy([]))
  }, [phamVi, classList.length, dsDangKy, scriptUrl, maBiMat])
  const dsEmChon = useMemo(() => {
    // chuoi() ở đây là lớp chắn thứ hai: dữ liệu có thể tới từ classList (Google
    // Sheet) chứ không riêng API, mà ô sheet vẫn có thể là số.
    const nguon = (classList.length > 0 ? classList : (dsDangKy ?? [])).map((r) => ({ sbd: chuoi(r.sbd), hoTen: chuoi(r.hoTen), lop: chuoi(r.lop) }))
    const q = timTen.trim().toLowerCase()
    const loc = nguon.filter((r) => r.sbd && (!lop.trim() || !r.lop || r.lop.trim() === lop.trim()) && (!q || r.hoTen.toLowerCase().includes(q) || r.sbd.toLowerCase().includes(q)))
    return loc.sort((a, b) => a.hoTen.localeCompare(b.hoTen, 'vi') || a.sbd.localeCompare(b.sbd, 'vi'))
  }, [classList, dsDangKy, timTen, lop])
  const toggleSbd = (sbd: string) =>
    setChonSbd((prev) => {
      const next = new Set(prev)
      if (next.has(sbd)) next.delete(sbd)
      else next.add(sbd)
      return next
    })

  const toggleSelect = (maDe: string) => {
    setSelectedMaDe((prev) => {
      const next = new Set(prev)
      if (next.has(maDe)) next.delete(maDe)
      else next.add(maDe)
      return next
    })
  }

  const selectedSources = savedSources.filter((c) => selectedMaDe.has(c.maDe))
  const sizeWarning = selectedSources.length > 0 ? bankSizeWarning(selectedSources) : null

  const dsNhom = useMemo(() => Array.from(new Set(savedSources.map((c) => (c.nhom || '').trim()).filter(Boolean))).sort(), [savedSources])

  const dsDeLoc = useMemo(() => {
    const q = timKiemMaDe.trim().toLowerCase()
    return savedSources.filter((c) => (!nhomLoc || (c.nhom || '') === nhomLoc) && (!q || c.maDe.toLowerCase().includes(q)))
  }, [savedSources, timKiemMaDe, nhomLoc])

  const tongCauDaChon = selectedSources.reduce((s, c) => s + c.phanI.length + c.phanII.length + c.phanIII.length, 0)

  const chonTatCa = () => setSelectedMaDe(new Set(dsDeLoc.map((c) => c.maDe)))
  const boChonTatCa = () => setSelectedMaDe(new Set())

  const handleOpenSession = async () => {
    if (!scriptUrl.trim()) return showToast('Chưa cấu hình link Apps Script — vào Ngân hàng câu hỏi → Cấu hình', 'error')
    if (selectedSources.length === 0) return showToast('Chưa chọn đề nào cho ca này', 'error')
    if (!lop.trim()) return showToast('Chưa nhập lớp', 'error')
    if (!Number.isFinite(thoiGianPhut) || thoiGianPhut <= 0) return showToast('Thời gian làm bài phải lớn hơn 0', 'error')
    if (phamVi === 'khoi' && !/^\d{4}$/.test(namSinhKhoi.trim())) return showToast('Chọn năm sinh cho phạm vi theo khối', 'error')
    if (phamVi === 'chon' && chonSbd.size === 0) return showToast('Chưa tích em nào cho phạm vi chọn từng em', 'error')
    let batDauIso = ''
    if (batDauCach === 'hen') {
      const t = new Date(batDauLocal).getTime()
      if (!Number.isFinite(t)) return showToast('Giờ bắt đầu không hợp lệ', 'error')
      if (t < Date.now() - 60000) return showToast('Giờ bắt đầu đã qua — chọn "Ngay bây giờ" hoặc giờ sau', 'error')
      batDauIso = new Date(t).toISOString()
    }

    setOpening(true)
    try {
      const maCa = randomSessionCode()
      const publicBank = mergeAndStrip(selectedSources)
      const keyBank = congBoDiem === 'khong' ? undefined : mergeKeepAnswers(selectedSources)
      const moc = await publishSession(scriptUrl.trim(), maCa, lop.trim(), thoiGianPhut, publicBank, congBoDiem, keyBank, {
        batDau: batDauIso,
        hanVaoPhut,
        tenCa: tenCa.trim(),
        phamVi,
        danhSachMoi: phamVi === 'khoi' ? namSinhKhoi.trim() : phamVi === 'chon' ? Array.from(chonSbd) : '',
        nguongLan,
        nguongGiay,
      })
      // Lưu bản CÓ đáp án trên máy thầy để màn Theo dõi chấm lại được sau này.
      await saveSessionTeacherBank(maCa, selectedSources)
      setOpened({ maCa, joinLink: await taoLinkMoi(maCa, scriptUrl.trim()), batDau: moc.batDau, hetHanVao: moc.hetHanVao })
      setDaCopy(false)
      showToast('Đã mở ca kiểm tra', 'success')
    } catch (e) {
      showToast(`Lỗi mở ca: ${e instanceof Error ? e.message : 'không rõ nguyên nhân'}`, 'error')
    } finally {
      setOpening(false)
    }
  }

  const copyLink = () => {
    if (!opened) return
    navigator.clipboard.writeText(opened.joinLink).then(() => {
      setDaCopy(true)
      showToast('Đã copy link mời vào thi', 'success')
    })
  }

  // ------------------------------------------------------------ CA ĐÃ MỞ
  if (opened) {
    return (
      <div className="min-h-screen pb-28 px-3 sm:px-4 pt-4 flex flex-col" style={{ background: 'var(--nen)', color: 'var(--muc)', gap: 'var(--k4)', fontFamily: 'var(--sans)' }}>
        <h1 className="font-bold" style={{ fontSize: 'var(--cx-5)', fontFamily: 'var(--serif)' }}>
          Ca kiểm tra đã mở
        </h1>
        <div className="text-center" style={{ background: 'var(--g1)', color: 'var(--giay)', borderRadius: 'var(--bo-3)', padding: 'var(--k6)', boxShadow: 'var(--bong-2)' }}>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', opacity: 0.9 }}>Mã ca</div>
          <div className="font-bold" style={{ ...SO, fontSize: 44, letterSpacing: '.18em' }}>
            {opened.maCa}
          </div>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', opacity: 0.9 }}>
            Lớp {lop.trim()} · {thoiGianPhut} phút · {tongCauDaChon} câu · {CACH_CONG_BO.find((c) => c.id === congBoDiem)?.ten}
          </div>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', opacity: 0.9, marginTop: 'var(--k1)' }}>
            Bắt đầu <b style={SO}>{gioHienThi(opened.batDau) || 'ngay'}</b> · vào phòng đến <b style={SO}>{opened.hetHanVao ? gioHienThi(opened.hetHanVao) : 'không giới hạn'}</b>
            {phamVi === 'khoi' ? ` · khối ${khoiTuNamSinh(namSinhKhoi) ?? '?'} (sinh ${namSinhKhoi})` : phamVi === 'chon' ? ` · ${chonSbd.size} em được mời` : ' · tự do'}
          </div>
        </div>
        <TheNoiDung>
          <div style={NHAN_NHO}>Gửi link này vào nhóm Zalo lớp — em mở link, gõ số báo danh là vào thi:</div>
          <div className="break-all" style={{ ...SO, fontSize: 'var(--cx-1)', background: 'var(--the-2)', borderRadius: 'var(--bo-1)', padding: 'var(--k3)', marginTop: 'var(--k2)', marginBottom: 'var(--k3)' }}>
            {opened.joinLink}
          </div>
          <NutChinh onClick={copyLink}>
            <span className="inline-flex items-center gap-2">
              {daCopy ? <Check size={18} /> : <Copy size={18} />} {daCopy ? 'Đã copy' : 'Copy link mời vào thi'}
            </span>
          </NutChinh>
        </TheNoiDung>
        <NutChinh variant="phu" onClick={() => moChiTietCa(opened.maCa)}>
          Theo dõi bài nộp của ca này →
        </NutChinh>
        <button onClick={() => setOpened(null)} className="tap-target" style={NHAN_NHO}>
          ← Mở ca khác
        </button>
      </div>
    )
  }

  // ------------------------------------------------------------ SOẠN CA
  return (
    <div className="min-h-screen pb-28 px-3 sm:px-4 pt-4 flex flex-col" style={{ background: 'var(--nen)', color: 'var(--muc)', gap: 'var(--k4)', fontFamily: 'var(--sans)' }}>
      <div className="flex items-center justify-between">
        <h1 className="font-bold" style={{ fontSize: 'var(--cx-5)', fontFamily: 'var(--serif)' }}>
          Mở ca kiểm tra
        </h1>
        <button onClick={() => setScreen('examhub')} style={NHAN_NHO} className="tap-target">
          ← Kiểm tra
        </button>
      </div>

      {/* 1. ĐỀ */}
      <TheNoiDung>
        <div className="flex items-center justify-between" style={{ gap: 'var(--k3)', marginBottom: 'var(--k3)' }}>
          <div className="min-w-0">
            <div style={TIEU_DE_MUC}>Đề cho ca này</div>
            {selectedSources.length > 0 && (
              <div style={NHAN_NHO}>
                Đã chọn {selectedSources.length} đề · {tongCauDaChon} câu
              </div>
            )}
          </div>
          {/* Một chạm kéo đề mới từ kho về — không cần vào Ngân hàng câu hỏi. */}
          <NutDongBo
            onXong={(kq) => {
              if (kq.moi.length + kq.capNhat.length > 0) loadExamSources().then(setSavedSources)
              if (kq.canXem.length > 0) showToast(`${kq.canXem.length} câu nghi đáp án — xem ở Ngân hàng câu hỏi`, 'error')
            }}
          />
        </div>

        {savedSources.length === 0 ? (
          <div className="flex flex-col" style={{ gap: 'var(--k3)' }}>
            <OThongBao tone="cam">Ngân hàng chưa có đề nào — thả file vào kho-de/moi/ trên máy, đề tự về.</OThongBao>
            <NutChinh variant="phu" onClick={() => setScreen('nganhangde')}>
              <span className="inline-flex items-center gap-2">
                <Library size={18} /> Mở Ngân hàng câu hỏi
              </span>
            </NutChinh>
          </div>
        ) : (
          <div className="flex flex-col" style={{ gap: 'var(--k2)' }}>
            {dsNhom.length > 0 && (
              <div className="flex flex-wrap" style={{ gap: 'var(--k2)' }} role="group" aria-label="Lọc theo nhóm đề">
                {['', ...dsNhom].map((n) => {
                  const chon = nhomLoc === n
                  return (
                    <button
                      key={n || '__tat_ca'}
                      type="button"
                      onClick={() => setNhomLoc(n)}
                      className="tap-target font-bold"
                      style={{
                        fontFamily: 'var(--sans)',
                        fontSize: 'var(--cx-1)',
                        minHeight: 36,
                        padding: '0 var(--k3)',
                        borderRadius: 'var(--bo-tron)',
                        background: chon ? 'var(--tim-nen)' : 'var(--the-2)',
                        color: chon ? 'var(--tim)' : 'var(--nhat)',
                        border: `1.5px solid ${chon ? 'var(--tim)' : 'transparent'}`,
                        transitionProperty: 'background-color, color, border-color',
                        transitionDuration: 'var(--nhanh)',
                      }}
                    >
                      {n || 'Tất cả'}
                    </button>
                  )
                })}
              </div>
            )}
            {savedSources.length >= 6 && (
              <input style={O_NHAP} placeholder="Tìm theo mã đề…" value={timKiemMaDe} onChange={(e) => setTimKiemMaDe(e.target.value)} inputMode="search" />
            )}
            {dsDeLoc.map((c) => {
              const dangChon = selectedMaDe.has(c.maDe)
              const tongCau = c.phanI.length + c.phanII.length + c.phanIII.length
              return (
                <Hang key={c.maDe} selected={dangChon} onClick={() => toggleSelect(c.maDe)} data-trang-thai={dangChon ? 'chon' : undefined}>
                  <span className="shrink-0" style={{ color: dangChon ? 'var(--xanh)' : 'var(--mo)' }}>
                    {dangChon ? <CheckSquare size={20} /> : <Square size={20} />}
                  </span>
                  <span className="flex-1 min-w-0">
                    <div className="font-bold" style={{ fontSize: 'var(--cx-2)' }}>
                      Mã {c.maDe}
                    </div>
                    <div style={NHAN_NHO}>
                      I {c.phanI.length} · II {c.phanII.length} · III {c.phanIII.length}
                      {c.nhom && !nhomLoc ? ` · ${c.nhom}` : ''}
                    </div>
                  </span>
                  <span className="shrink-0 font-bold" style={{ ...SO, fontSize: 'var(--cx-2)' }}>
                    {tongCau} câu
                  </span>
                </Hang>
              )
            })}
            {savedSources.length > 1 && (
              <div className="flex items-center" style={{ gap: 'var(--k4)', ...NHAN_NHO }}>
                <button onClick={chonTatCa} className="tap-target" style={{ color: 'var(--muc)', fontWeight: 700 }}>
                  Chọn tất cả
                </button>
                <button onClick={boChonTatCa} className="tap-target">
                  Bỏ chọn
                </button>
              </div>
            )}
            {sizeWarning && <OThongBao tone="cam">{sizeWarning}</OThongBao>}
          </div>
        )}
      </TheNoiDung>

      {/* 2. LỚP & THỜI GIAN */}
      <TheNoiDung>
        <div style={{ ...TIEU_DE_MUC, marginBottom: 'var(--k3)' }}>Lớp & thời gian</div>
        <div className="flex flex-col" style={{ gap: 'var(--k3)' }}>
          <input style={O_NHAP} placeholder="Tên ca (tuỳ chọn, vd Kiểm tra 15 phút — Este)" value={tenCa} onChange={(e) => setTenCa(e.target.value)} aria-label="Tên ca" />
          {dsLop.length > 0 && (
            <div className="flex flex-wrap" style={{ gap: 'var(--k2)' }}>
              {dsLop.map((l) => {
                const chon = lop.trim() === l
                return (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLop(l)}
                    className="tap-target font-bold"
                    style={{
                      ...SO,
                      fontSize: 'var(--cx-2)',
                      padding: '0 var(--k4)',
                      borderRadius: 'var(--bo-tron)',
                      background: chon ? 'var(--muc)' : 'var(--the-2)',
                      color: chon ? 'var(--muc-nguoc)' : 'var(--muc)',
                    }}
                  >
                    {l}
                  </button>
                )
              })}
            </div>
          )}
          <input style={O_NHAP} placeholder="Lớp (vd 12A1)" value={lop} onChange={(e) => setLop(e.target.value)} />
          <div className="flex items-center" style={{ gap: 'var(--k3)' }}>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              style={{ ...O_NHAP, width: 110, ...SO }}
              value={thoiGianPhut}
              onChange={(e) => setThoiGianPhut(Number(e.target.value))}
            />
            <span style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', color: 'var(--nhat)' }}>phút làm bài — tính từ lúc từng em vào</span>
          </div>

          {/* BẮT ĐẦU: ngay / hẹn giờ */}
          <div>
            <div style={{ ...NHAN_NHO, marginBottom: 'var(--k2)' }}>Bắt đầu</div>
            <div className="flex flex-wrap items-center" style={{ gap: 'var(--k2)' }} role="radiogroup" aria-label="Giờ bắt đầu">
              {(
                [
                  ['ngay', 'Ngay bây giờ'],
                  ['hen', 'Hẹn giờ'],
                ] as const
              ).map(([id, ten]) => (
                <ChipChon key={id} chon={batDauCach === id} onClick={() => setBatDauCach(id)}>
                  {ten}
                </ChipChon>
              ))}
              {batDauCach === 'hen' && (
                <input type="datetime-local" style={{ ...O_NHAP, width: 'auto', ...SO }} value={batDauLocal} onChange={(e) => setBatDauLocal(e.target.value)} aria-label="Giờ bắt đầu" />
              )}
            </div>
          </div>

          {/* HẠN VÀO PHÒNG */}
          <div>
            <div style={{ ...NHAN_NHO, marginBottom: 'var(--k2)' }}>Cho vào phòng trong</div>
            <div className="flex flex-wrap items-center" style={{ gap: 'var(--k2)' }} role="radiogroup" aria-label="Hạn vào phòng">
              {HAN_VAO_CHON.map((h) => (
                <ChipChon key={h.phut} chon={hanVaoPhut === h.phut} onClick={() => setHanVaoPhut(h.phut)}>
                  {h.ten}
                </ChipChon>
              ))}
            </div>
            <div style={{ ...NHAN_NHO, marginTop: 'var(--k2)' }}>
              {hanVaoPhut > 0 ? `Sau ${hanVaoPhut} phút kể từ giờ bắt đầu, mã ca vô hiệu — kể cả em đã có link. Em đã vào vẫn đủ ${thoiGianPhut || 0} phút làm bài.` : 'Ai có mã ca vào lúc nào cũng được — dùng cho luyện tập ngoài giờ.'}
            </div>
          </div>
        </div>
      </TheNoiDung>

      {/* 3. PHẠM VI GỬI CA */}
      <TheNoiDung>
        <div style={{ ...TIEU_DE_MUC, marginBottom: 'var(--k3)' }}>Ai được vào ca này</div>
        <div className="flex flex-col" style={{ gap: 'var(--k2)' }} role="radiogroup" aria-label="Phạm vi gửi ca">
          {PHAM_VI_CHON.map((p) => {
            const chon = phamVi === p.id
            return (
              <Hang key={p.id} selected={chon} onClick={() => setPhamVi(p.id)} data-trang-thai={chon ? 'chon' : undefined}>
                <span className="shrink-0 flex items-center justify-center" aria-hidden style={{ width: 20, height: 20, borderRadius: 'var(--bo-tron)', border: `2px solid ${chon ? 'var(--xanh)' : 'var(--vien-dam)'}` }}>
                  {chon && <span style={{ width: 10, height: 10, borderRadius: 'var(--bo-tron)', background: 'var(--xanh)' }} />}
                </span>
                <span className="flex-1 min-w-0">
                  <div className="font-bold" style={{ fontSize: 'var(--cx-2)' }}>
                    {p.ten}
                  </div>
                  <div style={NHAN_NHO}>{p.mota}</div>
                </span>
              </Hang>
            )
          })}
        </div>
        {phamVi === 'khoi' && (
          <div style={{ marginTop: 'var(--k3)' }}>
            <div style={{ ...NHAN_NHO, marginBottom: 'var(--k2)' }}>Năm sinh của khối</div>
            <div className="flex flex-wrap items-center" style={{ gap: 'var(--k2)' }} role="radiogroup" aria-label="Năm sinh">
              {dsNamSinhGoiY().map((ns) => (
                <ChipChon key={ns} chon={namSinhKhoi === ns} onClick={() => setNamSinhKhoi(ns)}>
                  {ns} → khối {khoiTuNamSinh(ns) ?? '?'}
                </ChipChon>
              ))}
              <input style={{ ...O_NHAP, width: 120, ...SO }} placeholder="Năm khác" value={dsNamSinhGoiY().includes(namSinhKhoi) ? '' : namSinhKhoi} onChange={(e) => setNamSinhKhoi(e.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" aria-label="Năm sinh khác" />
            </div>
            <div style={{ ...NHAN_NHO, marginTop: 'var(--k2)' }}>Em chưa đăng ký hồ sơ (năm sinh) sẽ bị chặn kèm hướng dẫn đăng ký rồi vào lại.</div>
          </div>
        )}
        {phamVi === 'chon' && (
          <div className="flex flex-col" style={{ gap: 'var(--k2)', marginTop: 'var(--k3)' }}>
            <div className="flex items-center justify-between" style={NHAN_NHO}>
              <span>
                Đã tích <b style={{ ...SO, color: 'var(--muc)' }}>{chonSbd.size}</b> em{classList.length === 0 ? ' (nguồn: hồ sơ đã đăng ký)' : ''}
              </span>
              {chonSbd.size > 0 && (
                <button type="button" onClick={() => setChonSbd(new Set())} className="tap-target">
                  Bỏ chọn
                </button>
              )}
            </div>
            <input style={O_NHAP} placeholder="Tìm theo tên hoặc SBD…" value={timTen} onChange={(e) => setTimTen(e.target.value)} inputMode="search" aria-label="Tìm học sinh" />
            {dsEmChon.length === 0 ? (
              <OThongBao tone="cam">{classList.length === 0 && dsDangKy === null ? 'Đang tải danh sách…' : 'Không có em nào — nối danh sách lớp (tab Lớp) hoặc để em đăng ký hồ sơ.'}</OThongBao>
            ) : (
              <div className="flex flex-col overflow-y-auto" style={{ gap: 'var(--k2)', maxHeight: 320 }}>
                {dsEmChon.map((r) => {
                  const chon = chonSbd.has(r.sbd)
                  return (
                    <Hang key={r.sbd} selected={chon} onClick={() => toggleSbd(r.sbd)} data-trang-thai={chon ? 'chon' : undefined}>
                      <span className="shrink-0" style={{ color: chon ? 'var(--xanh)' : 'var(--mo)' }}>
                        {chon ? <CheckSquare size={20} /> : <Square size={20} />}
                      </span>
                      <span className="flex-1 min-w-0">
                        <div className="font-bold truncate" style={{ fontSize: 'var(--cx-2)' }}>
                          {r.hoTen || '(chưa có tên)'}
                        </div>
                        <div style={NHAN_NHO}>
                          SBD <span style={SO}>{r.sbd}</span>
                          {r.lop ? ` · ${r.lop}` : ''}
                        </div>
                      </span>
                    </Hang>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </TheNoiDung>

      {/* 4. CHỐNG GIAN LẬN */}
      <TheNoiDung>
        <div style={{ ...TIEU_DE_MUC, marginBottom: 'var(--k1)' }}>Rời màn hình khi làm bài</div>
        <div style={{ ...NHAN_NHO, marginBottom: 'var(--k3)' }}>
          Lần 1 cảnh báo, lần 2 cảnh báo đậm + rung. Đến ngưỡng thì khoá bài, nộp phần đã làm, báo thầy và phụ huynh. Thầy mở khoá được ở Chi tiết ca.
        </div>
        <div className="flex flex-col" style={{ gap: 'var(--k3)' }}>
          <div>
            <div style={{ ...NHAN_NHO, marginBottom: 'var(--k2)' }}>Khoá khi rời màn lần thứ</div>
            <div className="flex flex-wrap items-center" style={{ gap: 'var(--k2)' }} role="radiogroup" aria-label="Số lần rời màn thì khoá">
              {[2, 3, 5].map((n) => (
                <ChipChon key={n} chon={nguongLan === n} onClick={() => setNguongLan(n)}>
                  {n} lần
                </ChipChon>
              ))}
            </div>
          </div>
          <div>
            <div style={{ ...NHAN_NHO, marginBottom: 'var(--k2)' }}>Khoá ngay nếu một lần rời quá</div>
            <div className="flex flex-wrap items-center" style={{ gap: 'var(--k2)' }} role="radiogroup" aria-label="Số giây rời màn thì khoá ngay">
              {[2, 5, 10, 30].map((g) => (
                <ChipChon key={g} chon={nguongGiay === g} onClick={() => setNguongGiay(g)}>
                  {g} giây
                </ChipChon>
              ))}
            </div>
            {nguongGiay <= 5 && (
              <div style={{ ...NHAN_NHO, marginTop: 'var(--k2)', color: 'var(--cam)' }}>
                {nguongGiay} giây rất gắt: một cuộc gọi đến hay thông báo Zalo cũng đủ khoá bài. Ca này thầy nên ngồi cạnh màn Chi tiết ca để mở khoá ngay.
              </div>
            )}
          </div>
        </div>
      </TheNoiDung>

      {/* 5. CÔNG BỐ ĐIỂM */}
      <TheNoiDung>
        <div style={{ ...TIEU_DE_MUC, marginBottom: 'var(--k3)' }}>Công bố điểm cho học sinh</div>
        <div className="flex flex-col" style={{ gap: 'var(--k2)' }} role="radiogroup" aria-label="Cách công bố điểm">
          {CACH_CONG_BO.map((c) => {
            const chon = congBoDiem === c.id
            return (
              <Hang key={c.id} selected={chon} onClick={() => setCongBoDiem(c.id)} data-trang-thai={chon ? 'chon' : undefined}>
                <span
                  className="shrink-0 flex items-center justify-center"
                  aria-hidden
                  style={{ width: 20, height: 20, borderRadius: 'var(--bo-tron)', border: `2px solid ${chon ? 'var(--xanh)' : 'var(--vien-dam)'}` }}
                >
                  {chon && <span style={{ width: 10, height: 10, borderRadius: 'var(--bo-tron)', background: 'var(--xanh)' }} />}
                </span>
                <span className="flex-1 min-w-0">
                  <div className="font-bold" style={{ fontSize: 'var(--cx-2)' }}>
                    {c.ten}
                  </div>
                  <div style={NHAN_NHO}>{c.mota}</div>
                </span>
              </Hang>
            )
          })}
        </div>
      </TheNoiDung>

      <NutChinh onClick={handleOpenSession} disabled={opening}>
        {opening ? 'Đang mở ca…' : 'Mở ca kiểm tra'}
      </NutChinh>
    </div>
  )
}
