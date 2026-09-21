import './exam-setup.css'
import { laBoDe12, rutDeChuan2026, SO_CAU_CHUAN_2026 } from '../lib/ma-tran-hoa-2026'
// MỞ CA KIỂM TRA — tối giản theo yêu cầu thầy (2026-09-02): đề đã tự về từ
// kho, link Apps Script đã cấu hình 1 lần ở màn Ngân hàng câu hỏi, nên màn
// này CHỈ còn 3 việc: chọn đề · lớp & thời gian · cách công bố điểm → Mở ca.
// Không còn mục dán link, không xoá đề ở đây (xoá ở Ngân hàng câu hỏi).
import { useEffect, useMemo, useState } from 'react'
import {
  CheckSquare,
  Square,
  Library,
  Copy,
  Check,
  Settings2,
  Users,
  X,
  RefreshCw,
  ShieldAlert,
  KeyRound,
} from 'lucide-react'
import NutQuayLai from '../components/NutQuayLai'
import { mergeAndStrip, mergeKeepAnswers, type TeacherExamSource } from '../data/examContent'
import KhoiRutDe from '../components/KhoiRutDe'
import HopChonDe from '../components/HopChonDe'
import HangNhomDe from '../components/HangNhomDe'
import { locNguonTheoId, qidDaRaTuCacCa, type SoCauPhan } from '../lib/rut-de'
import { tachNhieuTheoPhan } from '../lib/tach-phan-de'
import { randomSessionCode, taoLinkMoiTrucTiep } from '../lib/ca-link'
import { layDiaChiMayChu } from '../lib/dia-chi-may-chu'
import { voiHanCho } from '../lib/han-cho'
import { TheNoiDung, NutChinh } from '../components/DesignSystem'
import NutDongBo from '../components/NutDongBo'
import { chuoi, danhSachEm, publishSession, type CongBoDiem, type PhamViCa } from '../lib/exam-api'
import { docSoCauCa, loadAllSessionTeacherBanks, loadExamSources, loadTeacherSecret, luuCheDoDeRieng, luuKhoChuaCa, luuSoCauCa, saveSessionTeacherBank } from '../lib/exam-db'
import { AN_HAN_CHON_GIAY, BAT_MAC_DINH_CA_THI, MS_AN_HAN_NHA_TAY } from '../lib/giu-de-doc'
import { dongBoNganHang } from '../lib/exam-sync'
import { khuTrungNguon, tongBoQua } from '../lib/khu-trung-cau'
import { useAppStore } from '../store/appStore'
import ONgayGio24 from '../components/ONgayGio24'

const NHAN_NHO: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }
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
      className={`tap-target text-xs sm:text-sm font-bold px-3.5 py-1.5 rounded-full transition-all cursor-pointer active:scale-95 shadow-2xs ${
        chon
          ? 'bg-[color:var(--m3-primary)] text-[color:var(--m3-on-primary)] ring-2 ring-blue-400/30 shadow-xs'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'
      }`}
      style={SO}
    >
      {children}
    </button>
  )
}

/** Phạm vi gửi ca (QUANLYCATHI mục 4) — máy chủ kiểm tra lúc vào thi, không chỉ ẩn giao diện.
 *
 * CHỮ Ở ĐÂY PHẢI KHỚP ĐÚNG VIỆC MÁY CHỦ LÀM. Thầy hỏi 06/09: chế độ Số báo danh
 * có kiểm năm sinh và họ tên không. CÓ — `quyetDinhVaoThi_` chạy cổng danh sách
 * (khớp đủ SBD + họ tên + năm sinh) trước mọi phạm vi, chỉ Tự do được miễn. Cái
 * sai là dòng mô tả nói thiếu, khiến thầy tưởng nó chỉ dò số báo danh. */
// BA CHẾ ĐỘ (thầy chốt 07/09). "Theo khối" đã BỎ khỏi màn này: nó lọc bằng năm
// sinh, mà từ 07/09 em vào thi không gõ năm sinh nữa — giữ lại là một lựa chọn
// không còn cách nào thoả. Ca cũ đã mở ở chế độ đó vẫn chạy nguyên: máy chủ giữ
// nhánh `pv === 'khoi'`, chỉ màn Mở ca không cho chọn mới.
//
// Cả ba chế độ nay chỉ đòi SỐ BÁO DANH. Em gõ số, máy hiện TÊN của số đó, em
// nhìn rồi bấm Bắt đầu — gõ nhầm một số là thấy ngay tên người khác. Khác nhau

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
  // GIỮ ĐỂ ĐỌC (GIUDEDOC mục 3): đề chỉ hiện khi ngón tay em còn trên màn thi.
  // Bật mặc định cho ca thi; bài tập về nhà tắt — không có lý do làm phiền em
  // ngồi học ở nhà.
  const [giuDeDoc, setGiuDeDoc] = useState(BAT_MAC_DINH_CA_THI)
  // PHÒNG CHỜ (thầy chốt 07/09): em vào ca thì đứng ở màn chờ, chưa nhận đề;
  // cả lớp nhận đề đúng một thời điểm khi thầy bấm "Bắt đầu thi" ở màn Theo
  // dõi. Mặc định TẮT — ca luyện tập và bài tập về nhà không cần chờ ai.
  const [phongCho, setPhongCho] = useState(false)
  const [dongBoGio, setDongBoGio] = useState(false)
  const [anHanGiay, setAnHanGiay] = useState(MS_AN_HAN_NHA_TAY / 1000)
  const [matKhauCa, setMatKhauCa] = useState('')
  const [chiNop3PhutCuoi, setChiNop3PhutCuoi] = useState(false)
  const [phamVi, setPhamVi] = useState<PhamViCa>('tu_do')
  const [chonSbd, setChonSbd] = useState<Set<string>>(new Set())
  const [timTen, setTimTen] = useState('')
  // Danh sách em để tích: danh sách lớp trên máy (Google Sheet) — không có thì lấy danh sách lớp đã nạp lên máy chủ.
  const [dsDangKy, setDsDangKy] = useState<{ sbd: string; hoTen: string; lop: string }[] | null>(null)
  // Bộ câu màn Rút đề chốt; null = thầy chọn lấy trọn kho (đường cũ).
  const [boRut, setBoRut] = useState<{ ids: Set<string>; soCau: SoCauPhan; lenBang: boolean; idsChua?: Set<string>; deRieng?: boolean; phamViHoiLai?: 'gan_nhat' | 'ba_ca' } | null>(null)
  // Câu đã ra ở các ca trước (đọc từ bản đề CÓ đáp án đã lưu của từng ca) — để
  // rút đề tránh phát lại câu lớp vừa làm tuần trước.
  const [qidCaTruoc, setQidCaTruoc] = useState<string[]>([])
  const [opening, setOpening] = useState(false)
  const [buocMoCa, setBuocMoCa] = useState('')
  const [loiMoCa, setLoiMoCa] = useState('')
  const [opened, setOpened] = useState<{ maCa: string; joinLink: string; batDau: string; hetHanVao: string } | null>(null)
  const [daCopy, setDaCopy] = useState(false)
  const [hienChonDe, setHienChonDe] = useState(false)
  const [hienRutDe, setHienRutDe] = useState(false)
  const [hienChonEm, setHienChonEm] = useState(false)
  const [hienNangCao, setHienNangCao] = useState(false)
  // Mã bí mật — mọi lệnh đọc dữ liệu học sinh của thầy đều phải kèm (BA-APP đợt 1).
  const [maBiMat, setMaBiMat] = useState('')
  // MỘT MÀN MỞ CA DUY NHẤT (thầy chốt 05/09 chiều — bỏ tách kiểm tra/chẩn
  // đoán). Thầy tự tay tích đề, ca ghi đủ dữ liệu như mọi ca khác, nên một ca
  // phục vụ CẢ HAI việc: gửi phiếu cho phụ huynh và phân công gọi lên bảng.
  // Tách hai luồng chỉ thêm rối mà không thêm dữ liệu nào.

  useEffect(() => {
    let huy = false
    layDiaChiMayChu().then(setScriptUrl).catch(() => {})
    loadTeacherSecret().then(setMaBiMat)
    loadAllSessionTeacherBanks()
      .then(async (ds) => {
        const kem = await Promise.all(ds.map(async (b) => ({ ...b, soCau: await docSoCauCa(b.maCa) })))
        if (!huy) setQidCaTruoc(qidDaRaTuCacCa(kem))
      })
      .catch(() => {})
    loadExamSources().then((list) => {
      if (huy) return
      setSavedSources(list)
      // Chỉ có 1 đề thì chọn sẵn cả ba phần của đề đó — bớt một chạm, mà thầy
      // vẫn bỏ tích được phần không cần.
      if (list.length === 1) setSelectedMaDe(new Set(tachNhieuTheoPhan(list).map((s) => s.maDe)))
    })
    // Đồng bộ IM LẶNG khi mở màn (đề pipeline vừa đẩy lên tự về) — lỗi/mất
    // mạng thì bỏ qua, thầy vẫn còn nút "Đồng bộ" để bấm tay.
    Promise.all([layDiaChiMayChu(), loadTeacherSecret()])
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

  // Nguồn em để "Chọn từng em": danh sách lớp trên máy; rỗng thì danh sách lớp trên máy chủ (tải khi cần).
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

  // MỖI MÃ ĐỀ TÁCH LÀM BA (thầy chốt 04-09): trắc nghiệm · đúng sai · trả lời
  // ngắn. Một bài trong kho là 90–190 câu gộp cả ba phần; muốn mở ca chỉ gồm
  // trắc nghiệm thì trước đây phải chọn cả mã rồi vào màn Rút đề đặt hai phần
  // kia về 0. Nay tích đúng một dòng là xong.
  //
  // Tách CHỈ Ở ĐÂY, id từng câu giữ nguyên (xem `tach-phan-de.ts`), nên chấm
  // bài, tránh câu trùng ca trước, lịch sử ca cũ đều không đụng gì.
  const dsDeTach = useMemo(() => tachNhieuTheoPhan(savedSources), [savedSources])

  // KHỬ TRÙNG NGAY Ở ĐÂY, trước mọi thứ khác (đếm câu, bộ rút, gói đẩy lên máy
  // chủ), để cả màn chỉ nhìn thấy bộ câu đã sạch. Khử ở dưới sâu hơn thì con số
  // "đề ra N câu" thầy đọc trên màn vẫn là số có trùng.
  // Luật: trùng thì giữ bản trong nhánh "Bộ đề" (thầy chốt 09/09).
  const kqKhuTrung = useMemo(() => khuTrungNguon(dsDeTach.filter((c) => selectedMaDe.has(c.maDe))), [dsDeTach, selectedMaDe])
  const selectedSources = kqKhuTrung.nguon
  const chuan2026 = selectedSources.some(laBoDe12)
  const soCauTrung = tongBoQua(kqKhuTrung.boQua)

  /** Bộ đề THẬT SỰ gửi lên máy chủ: đã cắt xuống còn những câu thầy chốt. */
  // CA CÓ RA MÀN GỌI LÊN BẢNG HAY KHÔNG — suy thẳng từ lựa chọn ở khối Bộ câu
  // ra đề, không có nút gạt riêng (thầy chốt 05/09 chiều: "có lựa chọn phân
  // công lên bảng chỗ bộ câu ra đề rồi"). Chọn "Phân công lên bảng" là ca đẩy
  // dữ liệu sang màn đó; ba lựa chọn còn lại thì không.
  //
  // Phiếu gửi phụ huynh và cộng dồn mạnh/yếu KHÔNG dính gì tới cờ này: mọi ca,
  // mọi lựa chọn đều ghi điểm và chi tiết từng câu như nhau.
  const lenBang = boRut?.lenBang === true && !chuan2026
  /** Ca mở ở chế độ ĐỀ RIÊNG TỪNG EM — kéo theo phòng chờ, bắt buộc. */
  const deRiengBat = !chuan2026 && boRut?.deRieng === true

  const nguonRaDe = useMemo(() => (chuan2026 ? selectedSources.filter(laBoDe12) : boRut && !deRiengBat ? locNguonTheoId(selectedSources, boRut.ids) : selectedSources), [selectedSources, boRut, deRiengBat, chuan2026])
  const soCauRaDe = chuan2026 ? SO_CAU_CHUAN_2026 : boRut ? boRut.soCau : undefined

  const dsNhom = useMemo(() => Array.from(new Set(savedSources.map((c) => (c.nhom || '').trim()).filter(Boolean))).sort(), [savedSources])


  const tongCauDaChon = nguonRaDe.reduce((s, c) => s + c.phanI.length + c.phanII.length + c.phanIII.length, 0)


  const handleOpenSession = async () => {
    if (selectedSources.length === 0) return showToast('Chưa chọn đề nào cho ca này', 'error')
    if (!lop.trim()) return showToast('Chưa nhập lớp', 'error')
    if (!Number.isFinite(thoiGianPhut) || thoiGianPhut <= 0) return showToast('Thời gian làm bài phải lớn hơn 0', 'error')
    if (phamVi === 'chon' && chonSbd.size === 0) return showToast('Chưa tích em nào cho phạm vi chọn từng em', 'error')
    let batDauIso = ''
    if (batDauCach === 'hen') {
      const t = new Date(batDauLocal).getTime()
      if (!Number.isFinite(t)) return showToast('Giờ bắt đầu không hợp lệ', 'error')
      if (t < Date.now() - 60000) return showToast('Giờ bắt đầu đã qua — chọn "Ngay bây giờ" hoặc giờ sau', 'error')
      batDauIso = new Date(t).toISOString()
    }

    setOpening(true)
    setLoiMoCa('')
    setBuocMoCa('Đang kiểm tra kết nối…')
    try {
      const diaChi = await voiHanCho(layDiaChiMayChu(scriptUrl), 10000, 'Chưa đọc được kết nối máy chủ. Thầy đóng các tab app khác rồi thử lại.')
      if (!diaChi) throw new Error('Chưa có kết nối máy chủ. Thầy mở lại app khi có mạng.')
      const maCa = randomSessionCode()
      const nguonCuoi = chuan2026 ? rutDeChuan2026(selectedSources, maCa) : nguonRaDe
      const soCauCuoi = chuan2026 ? SO_CAU_CHUAN_2026 : soCauRaDe
      if (nguonCuoi.length === 0) return showToast('Bộ câu ra đề đang rỗng — chỉnh lại phần Bộ câu ra đề', 'error')
      // ĐỀ RIÊNG TỪNG EM: KHÔNG gắn bản đồ ở đây. Lúc mở ca chưa biết em nào
      // tới, nên bộ câu của từng em rút lúc thầy bấm Bắt đầu, từ đúng danh
      // sách em đang đứng ở phòng chờ (thầy chốt 08/09). Gói đề đẩy lên là KHO
      // RỘNG để lúc đó còn câu mà rút.
      const publicBank = mergeAndStrip(nguonCuoi, soCauCuoi)
      const keyBank = mergeKeepAnswers(nguonCuoi, soCauCuoi)
      setBuocMoCa(`Đang gửi ca #${maCa} lên máy chủ…`)
      const moc = await publishSession(diaChi, maCa, lop.trim(), chuan2026 ? 50 : thoiGianPhut, publicBank, congBoDiem, keyBank, {
        batDau: batDauIso,
        hanVaoPhut,
        tenCa: tenCa.trim(),
        phamVi,
        danhSachMoi: phamVi === 'chon' ? Array.from(chonSbd) : '',
        nguongLan,
        nguongGiay,
        lenBang,
        giuDeDoc,
        // ĐỀ RIÊNG TỰ BẬT PHÒNG CHỜ. Không có phòng chờ thì em vào là nhận đề
        // ngay, mà lúc đó bản đồ chưa dựng — em nhận bộ câu theo luật hash.
        phongCho: phongCho || deRiengBat || dongBoGio,
        dongBoGio,
        // Cờ chế độ lên MÁY CHỦ. `luuCheDoDeRieng` bên dưới chỉ còn là bản
        // sao ở máy này cho nhanh, không còn là nguồn sự thật duy nhất.
        deRieng: deRiengBat,
        // Phạm vi lấy câu sai đi CÙNG cờ chế độ, để máy nào bấm Bắt đầu cũng
        // rút đúng thứ thầy đã chọn lúc mở ca.
        phamViHoiLai: boRut?.phamViHoiLai ?? 'gan_nhat',
        anHanGiay: giuDeDoc ? (anHanGiay || 3) : 0,
        matKhau: matKhauCa.trim() || undefined,
        chiNop3PhutCuoi,
      })
      // Lưu bản CÓ đáp án trên máy thầy để màn Theo dõi chấm lại được sau này.
      // Lưu ĐÚNG bộ đã rút, không lưu cả kho: chấm lại phải tái tạo y hệt bộ
      // câu em đã làm, mà máy chủ chỉ giữ bộ đã rút.
      // Máy chủ đã giữ đầy đủ đề, đáp án, số câu và chế độ. Bản sao cục bộ
      // không được chặn thông báo thành công khi IndexedDB chậm/hết dung lượng.
      const banSao = [saveSessionTeacherBank(maCa, nguonCuoi)]
      // KHO CHỮA: chỉ ở chế độ "Phân công lên bảng". Rộng hơn đề em làm để màn
      // Gọi lên bảng đủ câu chia bốn lượt. Lưu ở máy thầy, không đẩy lên máy
      // chủ — em không được thấy câu chưa làm.
      if (!chuan2026 && boRut?.lenBang && boRut.idsChua) banSao.push(luuKhoChuaCa(maCa, locNguonTheoId(selectedSources, boRut.idsChua)))
      if (soCauCuoi) banSao.push(luuSoCauCa(maCa, soCauCuoi))
      // Đánh dấu ca này mở ở chế độ đề riêng. Bộ câu rút lúc bấm Bắt đầu.
      if (deRiengBat) banSao.push(luuCheDoDeRieng(maCa, true))
      void voiHanCho(Promise.all(banSao), 10000, 'Chưa lưu được bản sao trên máy').catch(() => {
        showToast(`Ca #${maCa} đã lưu trên máy chủ; chưa lưu được bản sao trên máy này.`, 'error')
      })
      setOpened({ maCa, joinLink: taoLinkMoiTrucTiep(maCa, diaChi), batDau: moc.batDau, hetHanVao: moc.hetHanVao })
      setDaCopy(false)
      showToast('Đã mở ca', 'success')
    } catch (e) {
      const loi = `Lỗi mở ca: ${e instanceof Error ? e.message : 'không rõ nguyên nhân'}`
      setLoiMoCa(loi)
      showToast(loi, 'error')
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
      <div className="gv-page min-h-screen pb-28 px-3 sm:px-4 pt-4 flex flex-col" style={{ background: 'var(--nen)', color: 'var(--muc)', gap: 'var(--k4)', fontFamily: 'var(--sans)' }}>
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
            {phamVi === 'chon' ? ` · ${chonSbd.size} em được mời` : phamVi === 'sbd' ? ' · Cả lớp (SBD)' : ' · tự do'}
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
        <NutQuayLai onClick={() => setOpened(null)} label="Mở ca khác" />
      </div>
    )
  }

  // ------------------------------------------------------------ SOẠN CA — GỌN 1 TRANG ĐIỆN THOẠI CHUẨN GOOGLE
  return (
    <div className="gv-page max-w-2xl mx-auto px-3 py-3 sm:py-4 flex flex-col gap-2.5 sm:gap-3" style={{ background: 'var(--nen)', color: 'var(--muc)', fontFamily: 'var(--sans)' }}>
      {/* HEADER COMPACT */}
      <div className="flex items-center justify-between gap-2 pb-1">
        <div className="flex items-center gap-2">
          <NutQuayLai onClick={() => setScreen('examhub')} label="Kiểm tra" />
          <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
            Mở ca kiểm tra
          </h1>
        </div>
        <NutDongBo
          onXong={(kq) => {
            if (kq.moi.length + kq.capNhat.length > 0) loadExamSources().then(setSavedSources)
            if (kq.canXem.length > 0) showToast(`${kq.canXem.length} câu nghi đáp án — xem ở Ngân hàng câu hỏi`, 'error')
          }}
        />
      </div>

      {/* THẺ 1: ĐỀ KIỂM TRA */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-[color:var(--m3-primary)] border border-blue-200/80 dark:border-blue-800 flex items-center justify-center shrink-0 shadow-2xs">
              <Library size={18} />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                {selectedSources.length > 0
                  ? `${selectedSources.length} đề đã chọn · ${tongCauDaChon} câu${soCauTrung > 0 ? ` (lọc trùng ${soCauTrung})` : ''}`
                  : 'Chưa chọn đề kiểm tra'}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {chuan2026 ? 'Bộ đề 12 · Chuẩn cấu trúc 2026 (50 phút)' : soCauRaDe ? `Chế độ rút: ${soCauRaDe.I} câu I · ${soCauRaDe.II} câu II · ${soCauRaDe.III} câu III` : 'Lấy nguyên vẹn toàn bộ câu trong đề'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {!chuan2026 && selectedSources.length > 0 && (
              <button
                type="button"
                onClick={() => setHienRutDe(true)}
                className="tap-target px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-50/70 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 hover:bg-amber-100/70 cursor-pointer transition active:scale-95 shadow-2xs"
              >
                {boRut ? `Rút ${tongCauDaChon} câu` : 'Rút câu'}
              </button>
            )}
            <button
              type="button"
              onClick={() => setHienChonDe(true)}
              className="tap-target px-4 py-2 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-950/70 text-[color:var(--m3-primary)] dark:text-blue-300 border border-blue-200/90 dark:border-blue-800 hover:bg-blue-100/70 cursor-pointer transition active:scale-95 shadow-2xs"
            >
              {selectedSources.length > 0 ? 'Đổi đề khác' : 'Chọn đề kiểm tra'}
            </button>
          </div>
        </div>
      </div>

      {/* THẺ 2: LỚP HỌC & THỜI GIAN LÀM BÀI */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
        {/* Hàng 1: Chọn lớp học */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Lớp kiểm tra:
            </span>
            <span className="text-[11px] text-slate-400">Chọn nhanh hoặc nhập tên lớp</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {dsLop.map((l) => {
              const chon = lop.trim() === l
              return (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLop(l)}
                  className={`tap-target text-xs font-semibold px-3.5 py-1.5 rounded-xl shrink-0 transition-all cursor-pointer active:scale-95 ${
                    chon
                      ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 font-bold shadow-2xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {l}
                </button>
              )
            })}
            <input
              placeholder="Nhập lớp…"
              value={lop}
              onChange={(e) => setLop(e.target.value)}
              className="h-8 w-28 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white shrink-0 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
            <input
              placeholder="Tên ca (tùy chọn, ví dụ: 15 Phút Số 1)"
              value={tenCa}
              onChange={(e) => setTenCa(e.target.value)}
              className="h-8 flex-1 min-w-[140px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 truncate"
            />
          </div>
        </div>

        {/* Hàng 2: Thời gian làm bài & Bắt đầu */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
          {/* Thời lượng làm bài */}
          <div className="space-y-1.5">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Thời gian làm bài:
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[15, 45, 50, 90].map((ph) => {
                const chon = (chuan2026 ? 50 : thoiGianPhut) === ph
                return (
                  <button
                    key={ph}
                    type="button"
                    disabled={chuan2026}
                    onClick={() => setThoiGianPhut(ph)}
                    className={`tap-target text-xs font-semibold px-3 py-1.5 rounded-xl transition-all cursor-pointer active:scale-95 ${
                      chon
                        ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 font-bold shadow-2xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {ph} phút
                  </button>
                )
              })}
              {!chuan2026 && (
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <input
                    type="number"
                    min={1}
                    value={thoiGianPhut}
                    onChange={(e) => setThoiGianPhut(Number(e.target.value))}
                    className="h-8 w-14 px-1.5 text-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <span>phút</span>
                </div>
              )}
            </div>
          </div>

          {/* Lựa chọn bắt đầu ngay / hẹn giờ */}
          <div className="space-y-1.5">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Thời điểm bắt đầu:
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBatDauCach('ngay')}
                className={`tap-target flex-1 text-xs font-semibold py-1.5 px-3 rounded-xl transition-all cursor-pointer active:scale-95 text-center ${
                  batDauCach === 'ngay'
                    ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 font-bold shadow-2xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                ⚡ Bắt đầu ngay
              </button>
              <button
                type="button"
                onClick={() => setBatDauCach('hen')}
                className={`tap-target flex-1 text-xs font-semibold py-1.5 px-3 rounded-xl transition-all cursor-pointer active:scale-95 text-center ${
                  batDauCach === 'hen'
                    ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 font-bold shadow-2xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                ⏰ Hẹn giờ mở
              </button>
            </div>
          </div>
        </div>

        {batDauCach === 'hen' && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
              Chọn thời điểm tự động mở ca (ngày/tháng/năm, giờ 24 giờ):
            </div>
            <ONgayGio24 nhan="Thời điểm tự động mở ca" value={batDauLocal} onChange={setBatDauLocal} muiGio="may" />
          </div>
        )}
      </div>

      {/* THẺ 3: QUY CHẾ THI & BẢO MẬT */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
        {/* Phạm vi tham gia */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Phạm vi học sinh tham gia:
            </span>
            <span className="text-[11px] text-slate-400">Quy định quyền truy cập</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'tu_do', label: '🌐 Tự do' },
              { id: 'sbd', label: '👥 SBD cả lớp' },
              { id: 'chon', label: `🎯 Chọn em${chonSbd.size > 0 ? ` (${chonSbd.size})` : ''}` },
            ].map((p) => {
              const chon = phamVi === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setPhamVi(p.id as PhamViCa)
                    if (p.id === 'chon') setHienChonEm(true)
                  }}
                  className={`tap-target text-xs font-semibold py-2 px-2.5 rounded-xl transition-all text-center cursor-pointer truncate active:scale-95 ${
                    chon
                      ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 font-bold shadow-2xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {p.label}
                </button>
              )
            })}
          </div>
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
          <input type="checkbox" role="switch" aria-label="Đồng bộ giờ cả phòng" checked={dongBoGio}
            onChange={e => setDongBoGio(e.target.checked)} className="mt-1 h-5 w-5" />
          <span className="text-sm text-slate-800 dark:text-slate-200"><b>Đồng bộ giờ cả phòng</b><br />
            Bật sẽ dùng phòng chờ. Cả phòng tính giờ từ lúc thầy bấm Bắt đầu thi và cùng hết giờ; em vào muộn chỉ còn thời gian chung.
          </span>
        </label>

        {/* 2 Chế độ kiểm soát phòng thi */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Kiểm soát phòng thi:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={deRiengBat || dongBoGio}
              onClick={() => !deRiengBat && setPhongCho((v) => !v)}
              className={`tap-target p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 active:scale-98 ${
                phongCho || deRiengBat || dongBoGio
                  ? 'bg-blue-50/70 dark:bg-blue-950/50 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200 shadow-2xs'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              } ${deRiengBat ? 'opacity-80 cursor-not-allowed' : ''}`}
            >
              <div className="min-w-0">
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <span>🚪 Phòng chờ phát đề</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {deRiengBat ? 'Bật sẵn và không tắt được (Đề riêng từng em)' : 'Chờ Thầy bấm Bắt đầu mới đếm ngược'}
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  phongCho || deRiengBat || dongBoGio
                    ? 'bg-blue-200/80 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                    : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {phongCho || deRiengBat || dongBoGio ? 'BẬT' : 'TẮT'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setGiuDeDoc((v) => {
                  const moi = !v
                  if (moi) {
                    setAnHanGiay(3)
                  }
                  return moi
                })
              }}
              className={`tap-target p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 active:scale-98 ${
                giuDeDoc
                  ? 'bg-blue-50/70 dark:bg-blue-950/50 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200 shadow-2xs'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              <div className="min-w-0">
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <span>👆 Giữ để đọc đề</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Chống chụp ảnh đề & chia sẻ · Mặc định 3s
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  giuDeDoc
                    ? 'bg-blue-200/80 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                    : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {giuDeDoc ? 'BẬT (3s)' : 'TẮT'}
              </span>
            </button>
          </div>
        </div>

        {/* Công bố điểm & Hạn vào phòng */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Công bố kết quả điểm:
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'khong', label: '🔒 Không hiện' },
                { id: 'ngay', label: '⚡ Khi nộp bài' },
                { id: 'ca_lop_xong', label: '👥 Cả lớp xong' },
              ].map((c) => {
                const chon = congBoDiem === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCongBoDiem(c.id as CongBoDiem)}
                    className={`tap-target text-xs font-semibold py-1.5 px-2 rounded-xl transition-all text-center cursor-pointer truncate active:scale-95 ${
                      chon
                        ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 font-bold shadow-2xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {c.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1 text-xs flex-wrap">
            <button
              type="button"
              onClick={() => setHienNangCao(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer tap-target transition shadow-2xs"
            >
              <Settings2 size={15} className="text-[color:var(--m3-primary)]" />
              <span>Nâng cao: {nguongLan}l rời · {matKhauCa ? 'có mật khẩu' : 'không MK'}</span>
            </button>

            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Hạn vào phòng:</span>
              <div className="flex items-center gap-1">
                {HAN_VAO_CHON.map((h) => {
                  const chon = hanVaoPhut === h.phut
                  return (
                    <button
                      key={h.phut}
                      type="button"
                      onClick={() => setHanVaoPhut(h.phut)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition ${
                        chon
                          ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 font-bold shadow-2xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {h.phut ? `${h.phut}'` : '∞'}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NÚT MỞ CA KIỂM TRA — NỔI BẬT, TRANG NHÃ CHUẨN GOOGLE */}
      <div className="pt-2">
        <button
          type="button"
          disabled={opening || selectedSources.length === 0}
          onClick={handleOpenSession}
          className="w-full py-4 px-6 rounded-2xl bg-[color:var(--m3-primary)] hover:opacity-90 text-[color:var(--m3-on-primary)] font-bold text-sm sm:text-base shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2.5"
        >
          {opening ? (
            <>
              <RefreshCw size={19} className="animate-spin" />
              <span role="status">{buocMoCa}</span>
            </>
          ) : (
            <>
              <span>🚀 Mở ca kiểm tra ngay</span>
              <span className="text-xs sm:text-sm font-normal opacity-90 pl-1 border-l border-white/30">
                {lop.trim() || 'Chưa chọn lớp'} · {tongCauDaChon} câu · {chuan2026 ? 50 : thoiGianPhut} phút
              </span>
            </>
          )}
        </button>
        {loiMoCa && <p role="alert" className="mt-3 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">{loiMoCa}</p>}
      </div>

      {/* MODAL 1: CHỌN ĐỀ KIỂM TRA (NGÂN HÀNG CÂY THƯ MỤC) */}
      {hienChonDe && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 animate-google-fade">
          <div className="w-full sm:max-w-2xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Library size={18} className="text-[color:var(--m3-primary)]" />
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  Chọn đề kiểm tra ({selectedSources.length} đề · {tongCauDaChon} câu)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setHienChonDe(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3 sm:p-4 flex-1 overflow-y-auto space-y-3">
              <HangNhomDe ds={dsNhom} chon={nhomLoc} onChon={setNhomLoc} />
              <HopChonDe
                ds={dsDeTach}
                daChon={selectedMaDe}
                onChon={toggleSelect}
                nhomLoc={nhomLoc}
                chonNhieu
                onChonTatCa={(ma) => setSelectedMaDe(new Set(ma))}
              />
            </div>

            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Đã chọn: <b className="text-[color:var(--m3-primary)]">{tongCauDaChon} câu</b>
              </span>
              <button
                type="button"
                onClick={() => setHienChonDe(false)}
                className="px-5 py-2 rounded-full bg-[color:var(--m3-primary)] text-[color:var(--m3-on-primary)] font-bold text-xs cursor-pointer shadow-xs active:scale-95"
              >
                Xong
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: RÚT ĐỀ / CẤU TRÚC */}
      {hienRutDe && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 animate-google-fade">
          <div className="w-full sm:max-w-xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                Rút đề theo số câu & dạng bài
              </h3>
              <button
                type="button"
                onClick={() => setHienRutDe(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3.5 sm:p-4 flex-1 overflow-y-auto">
              <KhoiRutDe
                nguon={selectedSources}
                qidCaTruoc={qidCaTruoc}
                phutLamBai={thoiGianPhut}
                onDoi={setBoRut}
                onDoiPhutLamBai={setThoiGianPhut}
              />
            </div>

            <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setHienRutDe(false)}
                className="px-5 py-2 rounded-full bg-[color:var(--m3-primary)] text-[color:var(--m3-on-primary)] font-bold text-xs cursor-pointer shadow-xs active:scale-95"
              >
                Xong
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CHỌN TỪNG EM HỌC SINH */}
      {hienChonEm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 animate-google-fade">
          <div className="w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-[color:var(--m3-primary)]" />
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  Tích chọn học sinh ({chonSbd.size} em)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setHienChonEm(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3 sm:p-4 flex-1 overflow-y-auto space-y-2.5">
              <input
                placeholder="Tìm theo tên hoặc SBD…"
                value={timTen}
                onChange={(e) => setTimTen(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none"
              />

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{dsEmChon.length} học sinh phù hợp</span>
                {chonSbd.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setChonSbd(new Set())}
                    className="text-rose-600 font-bold hover:underline"
                  >
                    Bỏ chọn tất cả
                  </button>
                )}
              </div>

              <div className="space-y-1 max-h-[50vh] overflow-y-auto pr-1">
                {dsEmChon.map((r) => {
                  const chon = chonSbd.has(r.sbd)
                  return (
                    <button
                      key={r.sbd}
                      type="button"
                      onClick={() => toggleSbd(r.sbd)}
                      className={`w-full p-2 rounded-xl border flex items-center gap-2.5 text-left transition cursor-pointer ${
                        chon
                          ? 'bg-blue-50/80 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 font-semibold'
                          : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/60 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <span className={chon ? 'text-[color:var(--m3-primary)]' : 'text-slate-400'}>
                        {chon ? <CheckSquare size={17} /> : <Square size={17} />}
                      </span>
                      <span className="truncate flex-1 text-xs">{r.hoTen || '(chưa có tên)'}</span>
                      <span className="font-mono text-[11px] text-slate-400 shrink-0">#{r.sbd}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setHienChonEm(false)}
                className="px-5 py-2 rounded-full bg-[color:var(--m3-primary)] text-[color:var(--m3-on-primary)] font-bold text-xs cursor-pointer shadow-xs active:scale-95"
              >
                Xong ({chonSbd.size} em)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: CÀI ĐẶT NÂNG CAO */}
      {hienNangCao && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 animate-google-fade">
          <div className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 size={18} className="text-[color:var(--m3-primary)]" />
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  Tùy chọn nâng cao
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setHienNangCao(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-4 flex-1 overflow-y-auto text-xs">
              {/* Mật khẩu ca */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <KeyRound size={14} /> Mật khẩu ca thi (tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Để trống nếu không đặt mật khẩu"
                  value={matKhauCa}
                  onChange={(e) => setMatKhauCa(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>

              {/* Chống rời màn hình */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ShieldAlert size={14} /> Khóa bài khi rời màn hình
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Số lần:</span>
                  {[2, 3, 5].map((n) => (
                    <ChipChon key={n} chon={nguongLan === n} onClick={() => setNguongLan(n)}>
                      {n} lần
                    </ChipChon>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Thời gian rời:</span>
                  {[2, 5, 10, 30].map((g) => (
                    <ChipChon key={g} chon={nguongGiay === g} onClick={() => setNguongGiay(g)}>
                      {g}s
                    </ChipChon>
                  ))}
                </div>
              </div>

              {/* Chỉ nộp 1 phút cuối */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    Chỉ nộp trong 1 phút cuối
                  </div>
                  <div className="text-[11px] text-slate-400">Tránh học sinh nộp bài vội</div>
                </div>
                <button
                  type="button"
                  onClick={() => setChiNop3PhutCuoi((v) => !v)}
                  className={`px-3 py-1 rounded-full font-bold cursor-pointer transition ${
                    chiNop3PhutCuoi
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {chiNop3PhutCuoi ? 'BẬT' : 'TẮT'}
                </button>
              </div>

              {/* Ân hạn nhả tay giữ để đọc */}
              {giuDeDoc && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    Ân hạn nhả tay (Giữ để đọc)
                  </div>
                  <div className="flex items-center gap-1.5">
                    {AN_HAN_CHON_GIAY.map((g) => (
                      <ChipChon key={g} chon={anHanGiay === g} onClick={() => setAnHanGiay(g)}>
                        {g} giây
                      </ChipChon>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setHienNangCao(false)}
                className="px-5 py-2 rounded-full bg-[color:var(--m3-primary)] text-[color:var(--m3-on-primary)] font-bold text-xs cursor-pointer shadow-xs active:scale-95"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
