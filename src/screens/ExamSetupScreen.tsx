import './exam-setup.css'
import '../components/ca-thi/ca-thi.css'
import { laBoDe12, rutDeChuan2026, SO_CAU_CHUAN_2026 } from '../lib/ma-tran-hoa-2026'
// MỞ CA KIỂM TRA — tối giản theo yêu cầu thầy (2026-09-02): đề đã tự về từ
// kho, link Apps Script đã cấu hình 1 lần ở màn Ngân hàng câu hỏi, nên màn
// này CHỈ còn 3 việc: chọn đề · lớp & thời gian · cách công bố điểm → Mở ca.
// Không còn mục dán link, không xoá đề ở đây (xoá ở Ngân hàng câu hỏi).
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CheckSquare,
  Square,
  Library,
  Settings2,
  Users,
  X,
  RefreshCw,
  ShieldAlert,
  KeyRound,
  Zap,
  AlarmClock,
  DoorOpen,
  Pointer,
  Rocket,
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
import NutDongBo from '../components/NutDongBo'
import { chiTietCa, chuoi, danhSachEm, publishSession, type CongBoDiem, type PhamViCa } from '../lib/exam-api'
import { docSoCauCa, loadAllSessionTeacherBanks, loadExamSources, loadTeacherSecret, luuCheDoDeRieng, luuKhoChuaCa, luuSoCauCa, saveSessionTeacherBank } from '../lib/exam-db'
import { AN_HAN_CHON_GIAY, BAT_MAC_DINH_CA_THI, MS_AN_HAN_NHA_TAY } from '../lib/giu-de-doc'
import { dongBoNganHang } from '../lib/exam-sync'
import { khuTrungNguon, tongBoQua } from '../lib/khu-trung-cau'
import { canhBaoThieuSauLoc, chuBoTuLuanChiTiet, demCauTheoPhan, locTuLuanKhiMoCa } from '../lib/loc-tu-luan-mo-ca'
import CaDaMo from '../components/ca-thi/CaDaMo'
import TamPhuChieuMa, { gopEmDaVao } from '../components/TamPhuChieuMa'
import { useAppStore } from '../store/appStore'
import ONgayGio24 from '../components/ONgayGio24'
import { chonSanCaChot, chuBaoCaChot, docGoiCaChot, xoaGoiCaChot, type ChonSanCaChot } from '../lib/ca-chot-chien-dich'

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
      className={`tap-target text-xs sm:text-sm font-bold px-3.5 py-1.5 rounded-full transition-[transform,background-color,box-shadow,opacity] cursor-pointer active:scale-95 shadow-2xs ${
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
  // GAME HÓA 2.0 (RA-SOAT 28/09 mục 3): chỉ ĐỔI CHỮ cho dễ hiểu — luồng mở ca, phạm vi, link giữ nguyên.

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
  const [chieuMaMo, setChieuMaMo] = useState(false)
  const [loiMoCa, setLoiMoCa] = useState('')
  const [opened, setOpened] = useState<{ maCa: string; joinLink: string; batDau: string; hetHanVao: string } | null>(null)
  const [daCopy, setDaCopy] = useState(false)
  const [hienChonDe, setHienChonDe] = useState(false)
  const [hienRutDe, setHienRutDe] = useState(false)
  const [hienChonEm, setHienChonEm] = useState(false)
  const [hienNangCao, setHienNangCao] = useState(false)
  // Mã bí mật — mọi lệnh đọc dữ liệu học sinh của thầy đều phải kèm (BA-APP đợt 1).
  const [maBiMat, setMaBiMat] = useState('')
  // CA CHỐT CHIẾN DỊCH (Game Hóa 2.0): nút "Mở ca chốt" ở Buổi chữa để lại gói câu trong bộ nhớ phiên. Đọc MỘT LẦN
  // khi mở màn (xoá ngay sau đó), khi Ngân hàng đề đã nạp thì tích sẵn đúng tờ + đặt bộ rút = đúng các câu ấy.
  const [caChot] = useState(() => docGoiCaChot())
  const [kqCaChot, setKqCaChot] = useState<ChonSanCaChot | null>(null)
  const daApCaChot = useRef(false)
  useEffect(() => {
    if (!caChot) return
    xoaGoiCaChot()
    if (caChot.lop) setLop((cu) => cu || caChot.lop || '')
    setTenCa((cu) => cu || `Ca chốt · ${caChot.ten}`.trim())
  }, [caChot])
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

  // Áp ca chốt đúng một lần, khi Ngân hàng đề trên máy đã nạp (chạy sau "chỉ có 1 đề thì chọn sẵn" nên ghi đè lựa chọn ấy).
  useEffect(() => {
    if (!caChot || daApCaChot.current || savedSources.length === 0) return
    daApCaChot.current = true
    const kq = chonSanCaChot(dsDeTach, caChot.qids)
    setKqCaChot(kq)
    if (kq.soKhop === 0) return
    setSelectedMaDe(new Set(kq.maDe))
    setBoRut({ ids: kq.ids, soCau: kq.soCau, lenBang: false })
  }, [caChot, savedSources, dsDeTach])

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


  // CẤM RÚT CÂU TỰ LUẬN (thầy lệnh 21/09, kể cả ca kiểm tra): MỌI ca đều bỏ câu tự luận khỏi bộ câu — kể cả khi thầy chọn nguyên tờ; hiện RÕ ở bước chọn đề, không âm thầm thiếu câu.
  const locMoCa = useMemo(() => locTuLuanKhiMoCa(nguonRaDe, soCauRaDe, 'luon'), [nguonRaDe, soCauRaDe])
  const chuBoTuLuan = chuBoTuLuanChiTiet(locMoCa)
  const canhBaoThieu = useMemo(() => canhBaoThieuSauLoc(locMoCa, soCauRaDe), [locMoCa, soCauRaDe])
  const tongCauDaChon = (() => {
    const d = demCauTheoPhan(locMoCa.nguon)
    return d.I + d.II + d.III
  })()


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
      const nguonTruocLoc = chuan2026 ? rutDeChuan2026(selectedSources, maCa) : nguonRaDe
      const soCauCuoi = chuan2026 ? SO_CAU_CHUAN_2026 : soCauRaDe
      // CẤM RÚT CÂU TỰ LUẬN (thầy lệnh 21/09, kể cả ca kiểm tra nguyên tờ): luôn bỏ câu tự luận khỏi bộ câu của ca. Chỉ đổi NGUỒN câu đầu vào; chấm điểm, chia đề, seed không đổi.
      const locTuLuan = locTuLuanKhiMoCa(nguonTruocLoc, soCauCuoi, 'luon')
      const nguonCuoi = locTuLuan.nguon
      if (nguonCuoi.length === 0) return showToast('Bộ câu ra đề đang rỗng — chỉnh lại phần Bộ câu ra đề', 'error')
      // ĐỀ RIÊNG TỪNG EM: KHÔNG gắn bản đồ ở đây. Lúc mở ca chưa biết em nào
      // tới, nên bộ câu của từng em rút lúc thầy bấm Bắt đầu, từ đúng danh
      // sách em đang đứng ở phòng chờ (thầy chốt 08/09). Gói đề đẩy lên là KHO
      // RỘNG để lúc đó còn câu mà rút.
      const publicBank = mergeAndStrip(nguonCuoi, soCauCuoi)
      const keyBank = mergeKeepAnswers(nguonCuoi, soCauCuoi)
      setBuocMoCa(`Đang gửi ca #${maCa} lên máy chủ…${locTuLuan.soBo > 0 ? ` ${chuBoTuLuanChiTiet(locTuLuan)}.` : ''}`)
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

  // ------------------------------------------------------------ CA ĐÃ MỞ — màn app mới (CaDaMo, thầy 28/09): tên ca, mã ca chữ to, link + Chép link,
  // Chiếu mã lên bảng (TamPhuChieuMa dùng chung với Theo dõi ca), Sang Theo dõi ca.
  if (opened) {
    const tenMo = tenCa.trim() || `${selectedSources.length === 1 ? selectedSources[0]!.maDe : 'Ca kiểm tra'}${lop.trim() ? ` · ${lop.trim()}` : ''}`
    return (
      <>
        <CaDaMo
          maCa={opened.maCa}
          tenCa={tenMo}
          joinLink={opened.joinLink}
          lop={lop.trim()}
          soCau={tongCauDaChon}
          phut={chuan2026 ? 50 : thoiGianPhut}
          congBo={CACH_CONG_BO.find((c) => c.id === congBoDiem)?.ten ?? ''}
          gio={`Bắt đầu ${gioHienThi(opened.batDau) || 'ngay'} · vào phòng đến ${opened.hetHanVao ? gioHienThi(opened.hetHanVao) : 'không giới hạn'}`}
          aiLam={phamVi === 'chon' ? `${chonSbd.size} em được mời` : phamVi === 'sbd' ? 'Chỉ em trong danh sách lớp' : 'Mọi em có link'}
          daCopy={daCopy}
          onChepLink={copyLink}
          onChepMa={() => {
            void navigator.clipboard?.writeText(opened.maCa).then(() => showToast('Đã chép mã ca', 'success'))
          }}
          onChieuMa={() => setChieuMaMo(true)}
          onTheoDoi={() => moChiTietCa(opened.maCa)}
          onMoCaKhac={() => setOpened(null)}
        />
        {chieuMaMo && (
          <TamPhuChieuMa
            maCa={opened.maCa}
            tenCa={tenMo}
            lop={lop.trim()}
            link={opened.joinLink}
            diaChi={opened.joinLink.replace(/^https?:\/\//, '').split('?')[0]!}
            soEmCho={null}
            onDong={() => setChieuMaMo(false)}
            hoiPhongCho={async () => {
              // Cùng lệnh danh sách em của ca mà màn Theo dõi ca gọi (chiTietCa) — chỉ lấy TÊN em đã vào, không điểm.
              const ct = await chiTietCa((await layDiaChiMayChu(scriptUrl)) || scriptUrl.trim(), maBiMat.trim(), opened.maCa)
              const siSo = phamVi === 'chon' ? chonSbd.size : phamVi === 'sbd' && lop.trim() ? classList.filter((r) => chuoi(r.lop).trim() === lop.trim()).length || null : null
              return { em: gopEmDaVao(ct.dsCho, ct.luot), siSo }
            }}
          />
        )}
      </>
    )
  }

  // ------------------------------------------------------------ SOẠN CA — bản vẽ ca thi 28/09 (docs/ban-ve-ca-thi-2809, màn a): 4 bước Đề → Ai làm → Giờ → Luật + cột Xem trước
  const phutCa = chuan2026 ? 50 : thoiGianPhut
  const tenXemTruoc = tenCa.trim() || `${selectedSources.length === 1 ? selectedSources[0]!.maDe : 'Ca kiểm tra'}${lop.trim() ? ` · ${lop.trim()}` : ''}`
  const siSoLop = lop.trim() ? classList.filter((r) => chuoi(r.lop).trim() === lop.trim()).length : 0
  const chuAiLam = phamVi === 'chon' ? `${chonSbd.size} em được chọn` : phamVi === 'sbd' ? `${lop.trim() || 'Lớp'}${siSoLop ? ` · ${siSoLop} em` : ''} trong danh sách` : 'Mọi em có link'
  const mocMo = (() => {
    const t = batDauCach === 'hen' ? new Date(batDauLocal).getTime() : Date.now()
    return Number.isFinite(t) ? t : Date.now()
  })()
  const gioMoc = (ms: number) => new Date(ms).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  const mocHetVao = hanVaoPhut > 0 ? mocMo + hanVaoPhut * 60000 : null
  const mocEmCuoi = (mocHetVao ?? mocMo) + phutCa * 60000
  const phongChoBat = phongCho || deRiengBat || dongBoGio
  const cheDoDe = chuan2026 ? 'chuan' : deRiengBat ? 'rieng' : boRut ? 'rut' : 'nguyen'
  const LUAT: { id: CongBoDiem; ten: string; mota: string }[] = [
    { id: 'ngay', ten: 'Ngay khi em nộp', mota: 'Em nộp sớm có thể kể đáp án cho bạn đang làm.' },
    { id: 'ca_lop_xong', ten: 'Khi cả lớp nộp xong', mota: 'Em nộp xong thấy "đang chờ cả lớp".' },
    { id: 'khong', ten: 'Thầy công bố sau', mota: 'Thầy xem trước, rồi bấm Công bố điểm ở màn Kết thúc ca.' },
  ]
  return (
    <div className="gv-page ct" style={{ background: 'var(--gvm-nen)', color: 'var(--gvm-chu)', fontFamily: 'var(--sans)' }}>
      <div className="ct-khung" style={{ maxWidth: 1320, margin: '0 auto', padding: '16px clamp(12px, 3vw, 32px) 64px' }}>
        <div className="ct-dau">
          <div>
            <div className="ct-duong">Ca kiểm tra › Mở ca mới</div>
            <h1>Mở ca kiểm tra</h1>
            <p>Bốn việc, đi từ trên xuống. Mọi thứ khác đã có giá trị sẵn.</p>
          </div>
          <div className="ct-hang-nut" style={{ alignItems: 'center' }}>
            <NutQuayLai onClick={() => setScreen('lichsuca')} label="Ca kiểm tra" />
            <NutDongBo
              onXong={(kq) => {
                if (kq.moi.length + kq.capNhat.length > 0) loadExamSources().then(setSavedSources)
                if (kq.canXem.length > 0) showToast(`${kq.canXem.length} câu nghi đáp án — xem ở Ngân hàng câu hỏi`, 'error')
              }}
            />
          </div>
        </div>

        {caChot && (
          <div role="status" data-khoi="ca-chot" className="ct-tam" style={{ background: 'var(--gvm-xd-nen)', color: 'var(--gvm-xd-dam)', fontWeight: 600, padding: '12px 18px' }}>
            {chuBaoCaChot(caChot, kqCaChot)}
          </div>
        )}

        <div className="ct-moca">
          <div className="ct-tam">
            {/* BƯỚC 1 — ĐỀ */}
            <div className="ct-buoc c-xd">
              <div className="so-b">1</div>
              <div style={{ minWidth: 0 }}>
                <h3>Đề</h3>
                <p className="ct-ghi">Chọn một đề trong kho. Câu tự luận tự được lọc bỏ.</p>
                <div className="ct-de-chon">
                  <div className="bia" aria-hidden="true">
                    <Library size={22} />
                  </div>
                  <div className="tt">
                    <b>
                      {selectedSources.length > 0
                        ? `${selectedSources.length === 1 ? selectedSources[0]!.maDe : `${selectedSources.length} đề đã chọn`} · ${tongCauDaChon} câu${soCauTrung > 0 ? ` (lọc trùng ${soCauTrung})` : ''}`
                        : 'Chưa chọn đề kiểm tra'}
                    </b>
                    {selectedSources.length > 0 && (
                      <div className="ct-ghi so">{chuan2026 ? 'Bộ đề 12 · Chuẩn cấu trúc 2026 (50 phút)' : soCauRaDe ? `Chế độ rút: ${soCauRaDe.I} câu I · ${soCauRaDe.II} câu II · ${soCauRaDe.III} câu III` : 'Lấy nguyên vẹn toàn bộ câu trong đề'}</div>
                    )}
                    <div className="ct-pha">
                      {selectedSources.length > 0 ? (
                        <>
                          {(() => {
                            const d = soCauRaDe ?? demCauTheoPhan(locMoCa.nguon)
                            return (
                              <>
                                {d.I > 0 && <span className="ct-nhan n-xd so">Phần I · {d.I} câu</span>}
                                {d.II > 0 && <span className="ct-nhan n-tim so">Phần II · {d.II} câu</span>}
                                {d.III > 0 && <span className="ct-nhan n-xl so">Phần III · {d.III} câu</span>}
                              </>
                            )
                          })()}
                          {chuan2026 && <span className="ct-nhan n-hp">Chuẩn cấu trúc 2026 · 50 phút</span>}
                        </>
                      ) : (
                        <span className="ct-ghi">Bấm Chọn đề kiểm tra.</span>
                      )}
                    </div>
                  </div>
                  <button type="button" className="ct-nut ct-nut-vien ct-nut-nho" onClick={() => setHienChonDe(true)}>
                    {selectedSources.length > 0 ? 'Đổi đề khác' : 'Chọn đề kiểm tra'}
                  </button>
                </div>
                {!chuan2026 && selectedSources.length > 0 && (
                  <div className="ct-hang-chip" style={{ marginTop: 10 }} role="group" aria-label="Cách lấy câu">
                    <button type="button" className="ct-chip" aria-pressed={cheDoDe === 'nguyen'} onClick={() => setBoRut(null)}>
                      Lấy nguyên đề
                    </button>
                    <button type="button" className="ct-chip" aria-pressed={cheDoDe === 'rut'} onClick={() => setHienRutDe(true)}>
                      {boRut && !deRiengBat ? `Rút ${tongCauDaChon} câu` : 'Rút câu'}
                    </button>
                    <button type="button" className="ct-chip" aria-pressed={cheDoDe === 'rieng'} onClick={() => setHienRutDe(true)}>
                      Mỗi em một bộ câu riêng
                    </button>
                  </div>
                )}
                {(chuBoTuLuan || canhBaoThieu.length > 0) && (
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }} role="status">
                    {chuBoTuLuan && <div className="ct-ghi">{chuBoTuLuan}</div>}
                    {canhBaoThieu.map((c) => (
                      <div key={c} style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--gvm-ho)' }}>
                        {c}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* BƯỚC 2 — AI LÀM */}
            <div className="ct-buoc c-tim">
              <div className="so-b">2</div>
              <div style={{ minWidth: 0 }}>
                <h3>Ai làm</h3>
                <p className="ct-ghi">Chọn lớp, rồi chọn ai được vào.</p>
                <div className="ct-hang-chip" role="group" aria-label="Lớp">
                  {dsLop.map((l) => {
                    const n = classList.filter((r) => chuoi(r.lop).trim() === l).length
                    return (
                      <button key={l} type="button" className="ct-chip so" aria-pressed={lop.trim() === l} onClick={() => setLop(l)}>
                        {l}
                        {n ? ` · ${n} em` : ''}
                      </button>
                    )
                  })}
                  <input aria-label="Lớp của ca kiểm tra" placeholder="Nhập lớp…" value={lop} onChange={(e) => setLop(e.target.value)} className="ct-chip" style={{ width: 140, cursor: 'text' }} />
                </div>
                {/* Phạm vi học sinh tham gia — BA chế độ (thầy chốt 07/09; "Theo khối" đã bỏ). */}
                <div className="ct-hang-chip" style={{ marginTop: 10 }} role="group" aria-label="Ai được vào">
                  {[
                    { id: 'tu_do', label: 'Mọi em có link' },
                    { id: 'sbd', label: 'Chỉ em trong danh sách lớp' },
                    { id: 'chon', label: `Chọn từng em…${chonSbd.size > 0 ? ` (${chonSbd.size})` : ''}` },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="ct-chip"
                      aria-pressed={phamVi === p.id}
                      onClick={() => {
                        setPhamVi(p.id as PhamViCa)
                        if (p.id === 'chon') setHienChonEm(true)
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* BƯỚC 3 — GIỜ */}
            <div className="ct-buoc c-hp">
              <div className="so-b">3</div>
              <div style={{ minWidth: 0 }}>
                <h3>Giờ</h3>
                <p className="ct-ghi">Thời gian làm bài · lúc bắt đầu · hạn vào phòng.</p>
                <div className="ct-hang-chip" role="group" aria-label="Thời gian làm bài">
                  {[15, 45, 50, 90].map((ph) => (
                    <button key={ph} type="button" className="ct-chip so" aria-pressed={phutCa === ph} disabled={chuan2026} onClick={() => setThoiGianPhut(ph)}>
                      {ph} phút
                    </button>
                  ))}
                  {!chuan2026 && (
                    <label className="ct-chip so" style={{ cursor: 'text' }}>
                      <input type="number" min={1} aria-label="Số phút làm bài" value={thoiGianPhut} onChange={(e) => setThoiGianPhut(Number(e.target.value))} style={{ width: 52, border: 0, background: 'transparent', font: 'inherit', color: 'inherit', textAlign: 'center' }} />
                      phút
                    </label>
                  )}
                </div>
                <div className="ct-hang-chip" style={{ marginTop: 10 }} role="group" aria-label="Lúc bắt đầu và hạn vào phòng">
                  <button type="button" className="ct-chip" aria-pressed={batDauCach === 'ngay'} onClick={() => setBatDauCach('ngay')}>
                    <Zap size={14} aria-hidden="true" />
                    Bắt đầu ngay
                  </button>
                  <button type="button" className="ct-chip" aria-pressed={batDauCach === 'hen'} onClick={() => setBatDauCach('hen')}>
                    <AlarmClock size={14} aria-hidden="true" />
                    Hẹn giờ…
                  </button>
                  <span style={{ width: 8 }} />
                  {HAN_VAO_CHON.map((h) => (
                    <button key={h.phut} type="button" className="ct-chip so" aria-pressed={hanVaoPhut === h.phut} onClick={() => setHanVaoPhut(h.phut)}>
                      {h.phut ? `Vào trong ${h.phut} phút` : 'Không giới hạn'}
                    </button>
                  ))}
                </div>
                {batDauCach === 'hen' && (
                  <div style={{ marginTop: 10 }}>
                    <div className="ct-ghi" style={{ marginBottom: 4 }}>
                      Chọn thời điểm tự động mở ca (ngày/tháng/năm, giờ 24 giờ):
                    </div>
                    <ONgayGio24 nhan="Thời điểm tự động mở ca" value={batDauLocal} onChange={setBatDauLocal} muiGio="may" />
                  </div>
                )}
              </div>
            </div>

            {/* BƯỚC 4 — LUẬT */}
            <div className="ct-buoc c-xl">
              <div className="so-b">4</div>
              <div style={{ minWidth: 0 }}>
                <h3>Luật</h3>
                <p className="ct-ghi">Khi nào em thấy điểm. "Thầy công bố sau" thì bấm Công bố điểm khi ca kết thúc.</p>
                <div className="ct-o-luat" role="group" aria-label="Công bố điểm">
                  {LUAT.map((c) => (
                    <button key={c.id} type="button" className="ct-luat" aria-pressed={congBoDiem === c.id} onClick={() => setCongBoDiem(c.id)}>
                      <b>{c.ten}</b>
                      <span>{c.mota}</span>
                    </button>
                  ))}
                </div>
                <div className="ct-bao-ve">
                  <span className="ct-ghi" style={{ fontWeight: 700, color: 'var(--gvm-chu-2)' }}>
                    Chống gian lận:
                  </span>
                  <span className={`ct-nhan ${giuDeDoc ? 'n-xl' : 'n-xam'}`}>{giuDeDoc ? `Giữ để đọc đề (nhả tay ${anHanGiay} giây)` : 'Giữ để đọc đề: tắt'}</span>
                  <span className="ct-nhan n-xl so">Rời màn {nguongLan} lần thì khoá bài</span>
                  <span className="ct-nhan n-xl so">Rời màn quá {nguongGiay} giây thì khoá bài</span>
                  <span className={`ct-nhan ${phongChoBat ? 'n-xl' : 'n-xam'}`}>Phòng chờ: {phongChoBat ? 'bật' : 'tắt'}</span>
                  {dongBoGio && <span className="ct-nhan n-xl">Đồng bộ giờ cả phòng</span>}
                  {matKhauCa && <span className="ct-nhan n-xl">Có mật khẩu ca</span>}
                  {chiNop3PhutCuoi && <span className="ct-nhan n-xl">Chỉ nộp trong 3 phút cuối</span>}
                </div>
                <details className="ct-them">
                  <summary>Thêm tuỳ chọn…</summary>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span className="ct-ghi">Tên ca (để trống thì tự đặt theo đề và lớp)</span>
                      <input aria-label="Tên ca kiểm tra" placeholder="Ví dụ: Kiểm tra tuần 4" value={tenCa} onChange={(e) => setTenCa(e.target.value)} className="ct-chip" style={{ cursor: 'text', width: '100%' }} />
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                      {/* Mỗi công tắc là MỘT nút cả hàng (tiêu đề + mô tả + nhãn BẬT/TẮT trong nút). */}
                      <button type="button" className="tap-target ct-luat" aria-pressed={phongChoBat} disabled={deRiengBat || dongBoGio} onClick={() => !deRiengBat && setPhongCho((v) => !v)}>
                        <b style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <DoorOpen size={14} aria-hidden="true" />
                          <span>Phòng chờ phát đề</span>
                          <em className="ct-nhan n-xam" style={{ fontStyle: 'normal', marginLeft: 'auto' }}>{phongCho || deRiengBat || dongBoGio ? 'BẬT' : 'TẮT'}</em>
                        </b>
                        <span>{deRiengBat ? 'Bật sẵn và không tắt được (Đề riêng từng em)' : 'Chờ Thầy bấm Bắt đầu mới đếm ngược'}</span>
                      </button>
                      <button
                        type="button"
                        className={`tap-target ct-luat`}
                        aria-pressed={giuDeDoc}
                        onClick={() => {
                          setGiuDeDoc((v) => {
                            const moi = !v
                            if (moi) {
                              setAnHanGiay(3)
                            }
                            return moi
                          })
                        }}
                      >
                        <b style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Pointer size={14} aria-hidden="true" />
                          <span>Giữ để đọc đề</span>
                          <em className="ct-nhan n-xam" style={{ fontStyle: 'normal', marginLeft: 'auto' }}>{giuDeDoc ? 'BẬT (3s)' : 'TẮT'}</em>
                        </b>
                        <span>Chống chụp ảnh đề & chia sẻ · Mặc định 3s</span>
                      </button>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minHeight: 44 }}>
                      <input type="checkbox" role="switch" aria-label="Đồng bộ giờ cả phòng" checked={dongBoGio} onChange={(e) => setDongBoGio(e.target.checked)} style={{ width: 20, height: 20, marginTop: 2 }} />
                      <span style={{ fontSize: 14 }}>
                        <b>Đồng bộ giờ cả phòng</b> — bật sẽ dùng phòng chờ. Cả phòng tính giờ từ lúc thầy bấm Bắt đầu thi và cùng hết giờ; em vào muộn chỉ còn thời gian chung.
                      </span>
                    </label>
                    <button type="button" className="ct-nut ct-nut-vien ct-nut-nho" style={{ alignSelf: 'flex-start' }} onClick={() => setHienNangCao(true)}>
                      <Settings2 size={16} aria-hidden="true" />
                      Mức rời màn · mật khẩu ca · chỉ nộp phút cuối · ân hạn nhả tay
                    </button>
                  </div>
                </details>
              </div>
            </div>
          </div>

          <aside className="ct-xem-truoc" aria-label="Xem trước ca">
            <div className="ct-ve">
              <div className="ct-ve-dau">
                <div className="nho">Xem trước · ca sẽ mở</div>
                <h3>{tenXemTruoc}</h3>
              </div>
              <dl>
                <dt>Đề</dt>
                <dd>{selectedSources.length > 0 ? (selectedSources.length === 1 ? selectedSources[0]!.maDe : `${selectedSources.length} đề`) : 'Chưa chọn'}</dd>
                <dt>Số câu</dt>
                <dd className="so">{tongCauDaChon} câu · 10 điểm</dd>
                <dt>Ai làm</dt>
                <dd>{chuAiLam}</dd>
                <dt>Thời gian</dt>
                <dd className="so">{phutCa} phút</dd>
                <dt>Công bố điểm</dt>
                <dd>{LUAT.find((c) => c.id === congBoDiem)?.ten}</dd>
              </dl>
              <div className="ct-dong-thoi">
                <div className="c-xd">
                  <b className="so">{gioMoc(mocMo)}</b>Mở
                </div>
                <div className="c-hp">
                  <b className="so">{mocHetVao ? gioMoc(mocHetVao) : '—'}</b>Hết giờ vào
                </div>
                <div className="c-xl">
                  <b className="so">{mocHetVao ? gioMoc(mocEmCuoi) : '—'}</b>Em cuối nộp
                </div>
              </div>
              <div className="cuoi">
                {/* Thầy 28/09: đang gửi thì GIỮ đúng chữ nút, chỉ mờ đi (aria-busy) + vòng quay nhỏ thay biểu tượng — không đổi sang câu dài,
                    không đổi độ rộng. Bước đang làm vẫn báo cho máy đọc màn hình qua dòng ẩn. */}
                <button type="button" className="ct-nut ct-nut-chinh" disabled={opening || selectedSources.length === 0} aria-busy={opening || undefined} onClick={handleOpenSession}>
                  {opening ? <RefreshCw size={18} className="animate-spin" aria-hidden="true" /> : <Rocket size={18} aria-hidden="true" />}
                  Mở ca kiểm tra ngay
                </button>
                <span className="sr-only" role="status">
                  {opening ? buocMoCa : ''}
                </span>
                {loiMoCa && (
                  <p role="alert" style={{ borderRadius: 14, background: 'var(--gvm-ho-nen)', color: 'var(--gvm-ho-dam)', padding: 12, fontSize: 14 }}>
                    {loiMoCa}
                  </p>
                )}
                <p className="ct-ghi" style={{ textAlign: 'center' }}>
                  Mở xong có ngay link + mã ca để gửi nhóm lớp.
                </p>
              </div>
            </div>
            <div className="ct-tam" style={{ padding: '16px 18px' }}>
              <div className="ct-ghi" style={{ fontWeight: 700, color: 'var(--gvm-chu-2)', marginBottom: 6 }}>
                Em sẽ thấy khi vào
              </div>
              <p style={{ fontSize: 14 }}>
                Gõ số báo danh → máy hiện tên em → em bấm <b>Bắt đầu</b>. {phongChoBat ? 'Em chờ ở phòng chờ tới khi thầy bấm Bắt đầu thi.' : `Đồng hồ ${phutCa} phút chạy từ lúc em nhận đề.`}
              </p>
            </div>
          </aside>
        </div>
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
                aria-label="Đóng danh sách chọn đề"
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
                aria-label="Đóng rút đề"
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
                aria-label="Đóng danh sách chọn học sinh"
                onClick={() => setHienChonEm(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3 sm:p-4 flex-1 overflow-y-auto space-y-2.5">
              <input
                aria-label="Tìm học sinh theo tên hoặc số báo danh"
                placeholder="Tìm theo tên hoặc SBD…"
                value={timTen}
                onChange={(e) => setTimTen(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
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
                aria-label="Đóng tùy chọn nâng cao"
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
                  <KeyRound size={14} /> Mật khẩu ca kiểm tra (tuỳ chọn)
                </label>
                <input
                  type="text"
                  aria-label="Mật khẩu ca kiểm tra"
                  placeholder="Để trống nếu không đặt mật khẩu"
                  value={matKhauCa}
                  onChange={(e) => setMatKhauCa(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
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
