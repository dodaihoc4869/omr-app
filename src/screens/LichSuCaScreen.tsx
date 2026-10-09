// CA THI (QUANLYCATHI.md mục 2) — mọi ca nằm trên Google Sheet, máy
// nào của thầy mở cũng thấy đủ và giống nhau. Mỗi hàng: tên ca, mã ca, lớp,
// ngày, tỉ lệ đã nộp, nhãn trạng thái. Chạm → Chi tiết ca (ExamMonitorScreen).
// Bật "Chọn" → mỗi hàng thành ô tích, xoá được nhiều ca ngay tại màn này.
// Chỉ dùng token + 6 thành phần thiết kế; số liệu dùng --sans.
// GAME HÓA 2.0 (cờ bật · thầy chốt 28/09 · docs/ban-ve-gv-2809/GV-CaKiemTra + RA-SOAT mục 2): BẢNG GỌN thay lưới thẻ "thư mục
// năm sinh"; hàng thẻ số tháng này; bỏ phụ đề, bỏ khối chiến dịch (sang màn Chiến dịch luyện), bỏ "Đồng bộ lại phiếu mọi ca"
// (cất ở Cài đặt › Công cụ kỹ thuật) và nút lớn "Mở ca kiểm tra đầu tiên" (trống = một dòng chữ); ca bài tập về nhà (cũ) ẩn khỏi
// mặc định, lọc ra được. Cờ tắt ⇒ màn y như cũ.
import ChuTheLoc, { tenTheLoc } from '../components/ChuTheLoc'
import { useEffect, useMemo, useState } from 'react'
import { CheckSquare, RefreshCw, RotateCcw, Search, Square, Trash2, ChevronDown, ChevronRight, ClipboardList } from 'lucide-react'
import { Nhan, OThongBao, NutChinh, TheNoiDung } from '../components/DesignSystem'
import { THU_MUC_KHAC, gomCaTheoNamSinh } from '../lib/nam-sinh-ca'
import { danhSachCa, khoiPhucCa, xoaNhieuCa, xoaVinhVienCa, type CaTomTat } from '../lib/exam-api'
import { loadScriptUrl, loadTeacherSecret } from '../lib/exam-db'
import { gioMayChu } from '../lib/gio-may-chu'
import { useAppStore } from '../store/appStore'
import NutDongBoMoiCa from '../components/NutDongBoMoiCa'
import './lich-su-ca-m3.css'
import { gioPhutVN } from '../lib/em-toan-canh'
import { useHoa2Bat } from '../components/chien-dich/co-hoa2'
import { useSoDemGv } from '../lib/so-dem-gv'
import { ngayVn } from '../components/chien-dich/ngay'
import { demEmTheoLop, soVi, thongKeThang } from '../lib/tong-quan-gv'
import './gv-hoa2.css'

const SO: React.CSSProperties = { fontFamily: 'var(--sans)', fontVariantNumeric: 'tabular-nums' }
const NHAN_NHO: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }
/** Luật công bố điểm của ca, nói bằng lời cho từng dòng ca (bản vẽ GV-3). Ca cũ không có `congBo` ⇒ không vẽ chip, không đoán. */
const CONG_BO_NGAN: Record<string, string> = { khong: 'Điểm chưa công bố cho học sinh', ngay: 'Điểm hiện ngay khi học sinh nộp', ca_lop_xong: 'Điểm hiện khi cả lớp nộp xong' }
/** Cột "Công bố điểm" của bảng 2.0 — chữ ngắn (RA-SOAT mục 2: gộp nhãn trên từng thẻ thành một cột). */
export const CONG_BO_COT: Record<string, string> = { khong: 'Chưa công bố', ngay: 'Ngay khi nộp', ca_lop_xong: 'Khi cả lớp nộp xong' }
/** Câu trạng thái trống của Ca kiểm tra 2.0 — một dòng chữ, không ảnh, không nút lớn. */
export const CHU_CA_TRONG_HOA2 = 'Chưa có ca kiểm tra nào. Mở ca bằng nút Mở ca kiểm tra ở thanh bên.'
/** Bảng 2.0 hiện bấy nhiêu dòng rồi mới "Xem thêm". */
const SO_DONG_TRANG = 20
const TONE_CHIP: Record<string, string> = { tim: 'la', xanh: 'la', cam: 'vang', do: 'do', xam: 'xam' }

/** Trạng thái hiển thị của ca theo mốc thời gian máy chủ + số đã nộp. */
export function trangThaiCa(ca: Pick<CaTomTat, 'trangThai' | 'batDau' | 'hetHanVao' | 'daVao' | 'daNop'>, nowMs: number): { ten: string; tone: 'xanh' | 'cam' | 'do' | 'tim' | 'xam' } {
  if (ca.trangThai === 'dong') return { ten: 'Đã đóng', tone: 'xam' }
  const batDau = ca.batDau ? new Date(ca.batDau).getTime() : NaN
  if (Number.isFinite(batDau) && nowMs < batDau) return { ten: 'Chưa mở', tone: 'xam' }
  const hetHan = ca.hetHanVao ? new Date(ca.hetHanVao).getTime() : NaN
  if (Number.isFinite(hetHan) && nowMs > hetHan) {
    if (ca.daVao > 0 && ca.daNop >= ca.daVao) return { ten: 'Xong', tone: 'xanh' }
    return { ten: ca.daVao > ca.daNop ? 'Còn em đang làm' : 'Hết giờ vào', tone: 'cam' }
  }
  return { ten: 'Đang mở', tone: 'tim' }
}

/** CA NÀY CÒN EM CHƯA NỘP XONG KHÔNG — dùng để cảnh báo trước khi xoá.
 *
 * Xoá ca là xoá MỀM, nhưng máy chủ coi `da_xoa` là KHOÁ (`caDangKhoa_`), nên
 * `nopBai` trả "Ca đã khoá — không lưu thêm được". Nghĩa là xoá một ca đang
 * chạy thì em đang làm dở KHÔNG NỘP ĐƯỢC BÀI. Khôi phục ca lại được, nhưng
 * mấy phút em ngồi bấm nút mà máy báo lỗi thì không lấy lại được.
 *
 * Dùng lại `trangThaiCa` chứ không viết luật thứ hai: hai bản đếm giờ lệch
 * nhau là cảnh báo hiện sai lúc, còn tệ hơn không có. */
export function caConEmDangLam(ca: Pick<CaTomTat, 'trangThai' | 'batDau' | 'hetHanVao' | 'daVao' | 'daNop'>, nowMs: number): boolean {
  const t = trangThaiCa(ca, nowMs).ten
  return t === 'Đang mở' || t === 'Còn em đang làm'
}

function ngayGio(iso: string): string {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return ''
  return `${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} ${gioPhutVN(iso)}`
}

/** Bảng 2.0: "19:15 · 28/09" (giờ Việt Nam, 24 giờ — bản vẽ GV-CaKiemTra). */
function gioNgayHoa2(iso: string): string {
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return ''
  const n = ngayVn(t)
  return `${gioPhutVN(iso)} · ${n.slice(8, 10)}/${n.slice(5, 7)}`
}

export default function LichSuCaScreen() {
  const setScreen = useAppStore((s) => s.setScreen)
  const moChiTietCa = useAppStore((s) => s.moChiTietCa)
  const showToast = useAppStore((s) => s.showToast)
  // GAME HÓA 2.0: bảng gọn + thẻ số; chiến dịch đã tách sang màn Chiến dịch luyện.
  const hoa2 = useHoa2Bat()
  const classList = useAppStore((s) => s.classList) as { lop?: string }[] | undefined
  const datSo = useSoDemGv((s) => s.datSo)
  /** 2.0: hiện cả ca bài tập về nhà (cũ) — mặc định ẩn. */
  const [hienBaiTap, setHienBaiTap] = useState(false)
  const [soDongHien, setSoDongHien] = useState(SO_DONG_TRANG)

  const [dsCa, setDsCa] = useState<CaTomTat[] | null>(null)
  const [dangTai, setDangTai] = useState(false)
  const [loi, setLoi] = useState('')
  const [timKiem, setTimKiem] = useState('')
  const [lopLoc, setLopLoc] = useState('')
  /** Lọc theo trạng thái ca (Xem điểm bản 2 · GV-3): '' = tất cả · 'mo' = đang mở · 'dong' = đã đóng. */
  const [ttLoc, setTtLoc] = useState<'' | 'mo' | 'dong'>('')
  // Chế độ tích chọn để xoá nhiều ca
  const [chonMode, setChonMode] = useState(false)
  const [daChon, setDaChon] = useState<string[]>([])
  const [hoiXoa, setHoiXoa] = useState(false)
  const [dangXoa, setDangXoa] = useState(false)
  // THÙNG RÁC: xoá ca là xoá MỀM, bài làm còn nguyên — xem lại và khôi phục được.
  const [xemDaXoa, setXemDaXoa] = useState(false)
  const [dangKhoiPhuc, setDangKhoiPhuc] = useState('')
  const [dsXoaVinhVien, setDsXoaVinhVien] = useState<string[]>([])
  const [dangXoaVinhVien, setDangXoaVinhVien] = useState(false)

  const tai = async () => {
    setDangTai(true)
    setLoi('')
    try {
      const [url, mat] = await Promise.all([loadScriptUrl(), loadTeacherSecret()])
      if (!url.trim()) throw new Error('Chưa cấu hình địa chỉ máy chủ — vào Cài đặt → Kết nối máy chủ')
      if (!mat.trim()) throw new Error('Chưa nhập mã bí mật — vào Cài đặt → Kết nối máy chủ')
      const ds = await danhSachCa(url.trim(), mat.trim(), xemDaXoa)
      setDsCa(ds)
      if (!xemDaXoa) datSo({ caMo: ds.filter((c) => c.loai !== 'baitap' && caConEmDangLam(c, gioMayChu())).length })
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Lỗi không rõ')
      if (dsCa === null) setDsCa([])
    } finally {
      setDangTai(false)
    }
  }

  useEffect(() => {
    tai()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xemDaXoa])

  /** Thư mục năm sinh đang gấp lại. Mặc định thu gọn; chỉ mở thư mục thầy chọn. */
  const [gapNam, setGapNam] = useState<Record<string, boolean>>({})
  const dsLop = useMemo(() => Array.from(new Set((dsCa ?? []).map((c) => c.lop.trim()).filter(Boolean))).sort(), [dsCa])
  const dsLoc = useMemo(() => {
    const q = timKiem.trim().toLowerCase()
    return (dsCa ?? []).filter((c) => (!hoa2 || hienBaiTap || c.loai !== 'baitap') && (!lopLoc || c.lop.trim() === lopLoc) && (!ttLoc || c.trangThai === ttLoc) && (!q || c.maCa.includes(q) || c.maCa.toLowerCase().includes(q) || c.tenCa.toLowerCase().includes(q) || c.lop.toLowerCase().includes(q)))
  }, [dsCa, timKiem, lopLoc, ttLoc, hoa2, hienBaiTap])
  const coBaiTap = useMemo(() => (dsCa ?? []).some((c) => c.loai === 'baitap'), [dsCa])
  const emTheoLop = useMemo(() => demEmTheoLop(classList), [classList])
  const demMo = useMemo(() => (dsCa ?? []).filter((c) => c.trangThai === 'mo').length, [dsCa])
  /** 2.0: ca ĐANG CHẠY thật (theo giờ máy chủ), không tính ca bài tập về nhà (cũ). */
  const demMoHoa2 = useMemo(() => (dsCa ?? []).filter((c) => c.loai !== 'baitap' && caConEmDangLam(c, gioMayChu())).length, [dsCa])
  const demDong = useMemo(() => (dsCa ?? []).filter((c) => c.trangThai === 'dong').length, [dsCa])

  // Chỉ tính trên danh sách ĐANG hiện — tích "Tất cả" không bao giờ chạm ca bị bộ lọc giấu đi.
  const chonTrongLoc = useMemo(() => dsLoc.filter((c) => daChon.includes(c.maCa)), [dsLoc, daChon])
  const tichHet = dsLoc.length > 0 && chonTrongLoc.length === dsLoc.length
  const soBaiLam = useMemo(() => chonTrongLoc.reduce((s, c) => s + c.daVao, 0), [chonTrongLoc])
  // CA ĐANG CHẠY NẰM TRONG NHÓM SẮP XOÁ — thứ nguy hiểm nhất ở màn này.
  const dangChay = useMemo(() => chonTrongLoc.filter((c) => caConEmDangLam(c, gioMayChu())), [chonTrongLoc])

  const bat = (maCa: string) => setDaChon((cu) => (cu.includes(maCa) ? cu.filter((m) => m !== maCa) : [...cu, maCa]))
  const thoatChon = () => {
    setChonMode(false)
    setDaChon([])
    setHoiXoa(false)
    setDsXoaVinhVien([])
  }

  const handleKhoiPhuc = async (maCa: string) => {
    setDangKhoiPhuc(maCa)
    try {
      const [url, mat] = await Promise.all([loadScriptUrl(), loadTeacherSecret()])
      await khoiPhucCa(url.trim(), mat.trim(), maCa)
      showToast(`Đã khôi phục ca ${maCa}`, 'success')
      await tai()
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không khôi phục được', 'error')
    } finally {
      setDangKhoiPhuc('')
    }
  }

  const handleKhoiPhucNhieu = async () => {
    const ds = chonTrongLoc.map((c) => c.maCa)
    if (ds.length === 0) return
    setDangKhoiPhuc('nhieu')
    try {
      const [url, mat] = await Promise.all([loadScriptUrl(), loadTeacherSecret()])
      for (const maCa of ds) {
        await khoiPhucCa(url.trim(), mat.trim(), maCa).catch(() => {})
      }
      showToast(`Đã khôi phục ${ds.length} ca`, 'success')
      thoatChon()
      await tai()
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không khôi phục được', 'error')
    } finally {
      setDangKhoiPhuc('')
    }
  }

  const handleXoaVinhVien = async () => {
    if (dsXoaVinhVien.length === 0) return
    setDangXoaVinhVien(true)
    try {
      const [url, mat] = await Promise.all([loadScriptUrl(), loadTeacherSecret()])
      await xoaVinhVienCa(url.trim(), mat.trim(), dsXoaVinhVien)
      showToast(`Đã xoá vĩnh viễn ${dsXoaVinhVien.length} ca`, 'success')
      setDsXoaVinhVien([])
      thoatChon()
      await tai()
    } catch (e) {
      showToast(`Không xoá được: ${e instanceof Error ? e.message : 'lỗi không rõ'}`, 'error')
    } finally {
      setDangXoaVinhVien(false)
    }
  }

  const handleXoa = async () => {
    const ds = chonTrongLoc.map((c) => c.maCa)
    if (ds.length === 0) return
    setDangXoa(true)
    try {
      const [url, mat] = await Promise.all([loadScriptUrl(), loadTeacherSecret()])
      const kq = await xoaNhieuCa(url.trim(), mat.trim(), ds)
      if (kq.loi.length === 0) showToast(`Đã xoá ${kq.ok.length} ca`, 'success')
      else if (kq.ok.length === 0) showToast(`Không xoá được ca nào: ${kq.loi[0].loi}`, 'error')
      else showToast(`Xoá được ${kq.ok.length} ca, ${kq.loi.length} ca lỗi (${kq.loi.map((l) => l.maCa).join(', ')})`, 'warn')
      thoatChon()
      await tai()
    } catch (e) {
      showToast(`Không xoá được: ${e instanceof Error ? e.message : 'lỗi không rõ'}`, 'error')
    } finally {
      setDangXoa(false)
    }
  }

  const now = gioMayChu()
  /** Thẻ số tháng này (2.0) — chỉ khi đang xem danh sách ca dùng và đã có ca. */
  const tkThang = hoa2 && !xemDaXoa && dsCa !== null && dsCa.length > 0 ? thongKeThang(dsCa, now) : null
  /** Bảng 2.0: mới nhất trước. */
  const dsBang = hoa2 ? [...dsLoc].sort((a, b) => (b.batDau || b.moLuc).localeCompare(a.batDau || a.moLuc)) : dsLoc

  return (
    <div className="gv-page ls-trang min-h-screen pb-28 px-3 sm:px-4 pt-4 flex flex-col" style={{ background: 'var(--nen)', color: 'var(--muc)', gap: 'var(--k4)', fontFamily: 'var(--sans)' }}>
      {hoa2 ? (
        <header className="gv2-dau">
          <div className="gv2-dau-chu">
            <h1 className="gv2-tieu-de">{xemDaXoa ? 'Ca đã xoá' : 'Ca kiểm tra'}</h1>
            {tkThang && (
              <p className="gv2-phu-de">
                <span className="gv2-so">{tkThang.soCa}</span> ca trong tháng {tkThang.thang} · <span className="gv2-so">{demMoHoa2}</span> ca đang mở
              </p>
            )}
          </div>
        </header>
      ) : (
        <div className="gv-page-header flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="ls-icon">
              <ClipboardList size={22} />
            </div>
            <div>
              <h1 className="ls-tieu-de">
                {xemDaXoa ? 'Ca đã xoá' : 'Ca kiểm tra'}
              </h1>
            </div>
          </div>
        </div>
      )}

      {tkThang && (
        <section className="gv2-kpi gv2-kpi--3" aria-label="Số liệu tháng này">
          <div className="gv2-the gv2-the-so" data-mau="xd">
            <div className="gv2-nhan">Ca trong tháng {tkThang.thang}</div>
            <div className="gv2-so-dong">
              <span className="gv2-so gv2-so-kpi">{tkThang.soCa}</span> <span className="gv2-don-vi">ca</span>
            </div>
            <div className="gv2-phu">
              <span className="gv2-so">{demMoHoa2}</span> ca đang mở
            </div>
          </div>
          <div className="gv2-the gv2-the-so" data-mau="xl">
            <div className="gv2-nhan">Bài đã nộp tháng {tkThang.thang}</div>
            <div className="gv2-so-dong">
              <span className="gv2-so gv2-so-kpi">{soVi(tkThang.daNop)}</span> <span className="gv2-don-vi">bài</span>
            </div>
            <div className="gv2-phu">
              trên <span className="gv2-so">{soVi(tkThang.daVao)}</span> lượt vào{tkThang.daVao > 0 ? ` · tỉ lệ nộp ${Math.round((tkThang.daNop / tkThang.daVao) * 100)}%` : ''}
            </div>
          </div>
          <div className="gv2-the gv2-the-so" data-mau="hp">
            <div className="gv2-nhan">Rời màn trong tháng {tkThang.thang}</div>
            <div className="gv2-so-dong">
              <span className="gv2-so gv2-so-kpi">{soVi(tkThang.roiMan)}</span> <span className="gv2-don-vi">lần</span>
            </div>
            <div className="gv2-phu">
              ở <span className="gv2-so">{tkThang.soCaRoiMan}</span> ca
            </div>
          </div>
        </section>
      )}

      <TheNoiDung className="gv-directory">
        <div className="gv-filterbar flex items-center gap-2 sm:gap-2.5 mb-3">
          <div className="relative flex-1">
            <Search size={18} className="ls-o-tim-bieu-tuong" />
            <input
              className="ls-o-tim"
              placeholder={hoa2 ? 'Tìm tên ca, mã ca, lớp…' : 'Tìm mã ca, tên ca, lớp…'}
              value={timKiem}
              onChange={(e) => setTimKiem(e.target.value)}
              inputMode="search"
              aria-label="Tìm ca"
            />
          </div>
          {hoa2 ? (
            <>
              <button type="button" onClick={() => (chonMode ? thoatChon() : setChonMode(true))} className={`gv2-nut-vien${chonMode ? ' gv2-nut-bat' : ''}`} aria-pressed={chonMode}>
                <CheckSquare size={16} aria-hidden="true" />
                {chonMode ? 'Xong' : 'Chọn để xoá'}
              </button>
              <button
                type="button"
                onClick={() => {
                  thoatChon()
                  setTtLoc('')
                  setXemDaXoa((v) => !v)
                }}
                className={`gv2-nut-vien${xemDaXoa ? ' gv2-nut-bat' : ''}`}
                aria-pressed={xemDaXoa}
              >
                <Trash2 size={16} aria-hidden="true" />
                {xemDaXoa ? 'Về danh sách ca' : 'Ca đã xoá'}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => (chonMode ? thoatChon() : setChonMode(true))}
                className={`tap-target ls-nut-tron${chonMode ? ' ls-nut-tron--bat' : ''}`}
                aria-label={chonMode ? 'Thoát chế độ chọn' : 'Chọn ca để xoá'}
                aria-pressed={chonMode}
                title={chonMode ? 'Xong' : 'Chọn ca để xoá'}
              >
                <CheckSquare size={18} />
              </button>
              <button
                type="button"
                onClick={() => {
                  thoatChon()
                  setTtLoc('') // thùng rác chỉ có ca đã xoá — không mang bộ lọc trạng thái sang
                  setXemDaXoa((v) => !v)
                }}
                className={`tap-target ls-nut-tron${xemDaXoa ? ' ls-nut-tron--do' : ''}`}
                aria-label={xemDaXoa ? 'Về danh sách ca đang dùng' : 'Xem ca đã xoá'}
                aria-pressed={xemDaXoa}
                title={xemDaXoa ? 'Về danh sách ca đang dùng' : 'Ca đã xoá'}
              >
                <RotateCcw size={18} />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={tai}
            disabled={dangTai}
            className="tap-target ls-nut-tron ls-nut-tron--nhan"
            aria-label="Tải lại"
            title="Tải lại"
          >
            <RefreshCw size={18} className={dangTai ? 'animate-spin' : ''} />
          </button>
        </div>

        {!xemDaXoa && dsCa !== null && dsCa.length > 0 && (
          <div className="tl-hang ls-chips" role="group" aria-label="Lọc theo trạng thái ca">
            {(
              [
                ['', 'Tất cả', dsCa.length],
                ['mo', 'Đang mở', demMo],
                ['dong', 'Đã đóng', demDong],
              ] as const
            ).map(([k, ten, so]) => (
              <button key={k || '__tat_ca_tt'} type="button" onClick={() => setTtLoc(k)} aria-pressed={ttLoc === k} aria-label={tenTheLoc(ten, so, ' ')} className={`tl-the ls-chip${ttLoc === k ? ' ls-chip--chon' : ''}`}>
                <ChuTheLoc chu={ten} so={so} noi=" " />
              </button>
            ))}
            {hoa2 && coBaiTap && (
              <button type="button" onClick={() => setHienBaiTap((v) => !v)} aria-pressed={hienBaiTap} className={`tl-the ls-chip${hienBaiTap ? ' ls-chip--chon' : ''}`}>
                Loại: Bài tập về nhà (cũ)
              </button>
            )}
          </div>
        )}

        {dsLop.length > 1 && (
          <div className="tl-hang ls-chips" role="group" aria-label="Lọc theo lớp">
            {['', ...dsLop].map((l) => {
              const chon = lopLoc === l
              return (
                <button
                  key={l || '__tat_ca'}
                  type="button"
                  onClick={() => setLopLoc(l)}
                  aria-pressed={chon}
                  className={`tl-the ls-chip${chon ? ' ls-chip--chon' : ''}`}
                >
                  {l || 'Tất cả'}
                </button>
              )
            })}
          </div>
        )}

        {chonMode && !xemDaXoa && (
          <div className="flex items-center flex-wrap" style={{ gap: 'var(--k2)', marginBottom: 'var(--k3)' }}>
            <button
              type="button"
              onClick={() => setDaChon(tichHet ? [] : dsLoc.map((c) => c.maCa))}
              className="tap-target font-bold inline-flex items-center active:scale-[0.98] hover:-translate-y-0.5 transition-[transform,background-color,box-shadow,opacity] cursor-pointer shadow-xs"
              style={{ ...SO, gap: 6, fontSize: 'var(--cx-1)', minHeight: 36, padding: '0 var(--k3)', borderRadius: 'var(--bo-tron)', background: 'var(--the-2)', color: 'var(--muc)' }}
            >
              {tichHet ? <CheckSquare size={16} /> : <Square size={16} />}
              {tichHet ? 'Bỏ chọn tất cả' : `Chọn tất cả (${dsLoc.length})`}
            </button>
            <span className="flex-1" style={{ ...NHAN_NHO, ...SO }}>
              Đã chọn {chonTrongLoc.length}
            </span>
            <button
              type="button"
              onClick={() => setHoiXoa(true)}
              disabled={chonTrongLoc.length === 0}
              className="tap-target font-bold inline-flex items-center active:scale-[0.98] hover:-translate-y-0.5 transition-[transform,background-color,box-shadow,opacity] cursor-pointer shadow-xs disabled:cursor-not-allowed disabled:hover:translate-y-0"
              style={{
                ...SO,
                gap: 6,
                fontSize: 'var(--cx-1)',
                minHeight: 36,
                padding: '0 var(--k3)',
                borderRadius: 'var(--bo-tron)',
                background: chonTrongLoc.length === 0 ? 'var(--the-2)' : 'var(--do-nen)',
                color: chonTrongLoc.length === 0 ? 'var(--mo)' : 'var(--do)',
              }}
            >
              <Trash2 size={16} /> Xoá {chonTrongLoc.length > 0 ? chonTrongLoc.length : ''}
            </button>
          </div>
        )}

        {chonMode && xemDaXoa && (
          <div className="flex items-center flex-wrap" style={{ gap: 'var(--k2)', marginBottom: 'var(--k3)' }}>
            <button
              type="button"
              onClick={() => setDaChon(tichHet ? [] : dsLoc.map((c) => c.maCa))}
              className="tap-target font-bold inline-flex items-center active:scale-[0.98] hover:-translate-y-0.5 transition-[transform,background-color,box-shadow,opacity] cursor-pointer shadow-xs"
              style={{ ...SO, gap: 6, fontSize: 'var(--cx-1)', minHeight: 36, padding: '0 var(--k3)', borderRadius: 'var(--bo-tron)', background: 'var(--the-2)', color: 'var(--muc)' }}
            >
              {tichHet ? <CheckSquare size={16} /> : <Square size={16} />}
              {tichHet ? 'Bỏ chọn tất cả' : `Chọn tất cả (${dsLoc.length})`}
            </button>
            <span className="flex-1" style={{ ...NHAN_NHO, ...SO }}>
              Đã chọn {chonTrongLoc.length}
            </span>
            <button
              type="button"
              onClick={handleKhoiPhucNhieu}
              disabled={chonTrongLoc.length === 0 || dangKhoiPhuc === 'nhieu'}
              className="tap-target font-bold inline-flex items-center active:scale-[0.98] hover:-translate-y-0.5 transition-[transform,background-color,box-shadow,opacity] cursor-pointer shadow-xs disabled:cursor-not-allowed disabled:hover:translate-y-0"
              style={{
                ...SO,
                gap: 6,
                fontSize: 'var(--cx-1)',
                minHeight: 36,
                padding: '0 var(--k3)',
                borderRadius: 'var(--bo-tron)',
                background: 'var(--the-2)',
                color: chonTrongLoc.length === 0 ? 'var(--mo)' : 'var(--muc)',
              }}
            >
              <RotateCcw size={16} /> Khôi phục {chonTrongLoc.length > 0 ? chonTrongLoc.length : ''}
            </button>
            <button
              type="button"
              onClick={() => setDsXoaVinhVien(chonTrongLoc.map((c) => c.maCa))}
              disabled={chonTrongLoc.length === 0}
              className="tap-target font-bold inline-flex items-center active:scale-[0.98] hover:-translate-y-0.5 transition-[transform,background-color,box-shadow,opacity] cursor-pointer shadow-xs disabled:cursor-not-allowed disabled:hover:translate-y-0"
              style={{
                ...SO,
                gap: 6,
                fontSize: 'var(--cx-1)',
                minHeight: 36,
                padding: '0 var(--k3)',
                borderRadius: 'var(--bo-tron)',
                background: chonTrongLoc.length === 0 ? 'var(--the-2)' : 'var(--do-nen)',
                color: chonTrongLoc.length === 0 ? 'var(--mo)' : 'var(--do)',
              }}
            >
              <Trash2 size={16} /> Xoá vĩnh viễn {chonTrongLoc.length > 0 ? chonTrongLoc.length : ''}
            </button>
          </div>
        )}

        {!chonMode && xemDaXoa && dsLoc.length > 0 && (
          <div className="flex items-center justify-between flex-wrap" style={{ gap: 'var(--k2)', marginBottom: 'var(--k3)' }}>
            <button
              type="button"
              onClick={() => setDsXoaVinhVien(dsLoc.map((c) => c.maCa))}
              className="tap-target font-bold inline-flex items-center"
              style={{
                ...NHAN_NHO,
                gap: 6,
                color: 'var(--do)',
                background: 'var(--do-nen)',
                minHeight: 36,
                padding: '0 var(--k3)',
                borderRadius: 'var(--bo-tron)',
                border: '1px solid var(--do)',
              }}
            >
              <Trash2 size={16} /> Xoá vĩnh viễn tất cả ({dsLoc.length} ca)
            </button>
          </div>
        )}

        {loi && <OThongBao tone="do">{loi}</OThongBao>}
        {dsCa === null ? (
          <div style={{ ...NHAN_NHO, padding: 'var(--k4) 0' }}>Đang tải danh sách ca từ máy chủ…</div>
        ) : dsLoc.length === 0 ? (
          <div className="flex flex-col" style={{ gap: 'var(--k3)' }}>
            <div style={{ ...NHAN_NHO, padding: 'var(--k2) 0' }} data-trong-ca="">{dsCa.length === 0 ? (xemDaXoa ? 'Không có ca nào đã xoá.' : hoa2 ? CHU_CA_TRONG_HOA2 : 'Chưa có ca nào.') : 'Không có ca khớp bộ lọc.'}</div>
            {dsCa.length === 0 && !xemDaXoa && !hoa2 && (
              <NutChinh variant="phu" onClick={() => setScreen('examsetup')}>
                Mở ca kiểm tra đầu tiên
              </NutChinh>
            )}
          </div>
        ) : hoa2 ? (
          <div className="gv2-cuon gv-scroll-box gv-scroll-box--table" role="region" aria-label="Danh sách ca kiểm tra" tabIndex={0}>
            <table className="gv2-bang gv2-bang-ca">
              <thead>
                <tr>
                  {chonMode && (
                    <th scope="col">
                      <span className="sr-only">Chọn</span>
                    </th>
                  )}
                  <th scope="col">Tên ca</th>
                  <th scope="col">Lớp</th>
                  <th scope="col">Bắt đầu</th>
                  <th scope="col" className="gv2-phai">
                    Đã vào / mời
                  </th>
                  <th scope="col" className="gv2-phai">
                    Đã nộp / vào
                  </th>
                  <th scope="col" className="gv2-phai">
                    Rời màn
                  </th>
                  <th scope="col">Công bố điểm</th>
                  <th scope="col">{xemDaXoa ? 'Việc' : 'Trạng thái'}</th>
                </tr>
              </thead>
              <tbody>
                {dsBang.slice(0, soDongHien).map((c) => {
                  const tt = trangThaiCa(c, now)
                  const tich = daChon.includes(c.maCa)
                  const moi = emTheoLop.get(c.lop.trim()) ?? 0
                  const bam = chonMode ? () => bat(c.maCa) : !xemDaXoa ? () => moChiTietCa(c.maCa) : undefined
                  return (
                    <tr key={c.maCa} data-trang-thai={tt.ten} className={chonMode && tich ? 'gv2-dong-chon' : undefined}>
                      {chonMode && (
                        <td>
                          <input type="checkbox" checked={tich} onChange={() => bat(c.maCa)} aria-label={`Chọn ${c.tenCa || c.maCa}`} />
                        </td>
                      )}
                      <td>
                        {bam ? (
                          <button type="button" className="gv2-ten-nut" onClick={bam}>
                            {c.tenCa || `Ca ${c.maCa}`}
                          </button>
                        ) : (
                          <span className="gv2-dam">{c.tenCa || `Ca ${c.maCa}`}</span>
                        )}
                        <div className="gv2-phu">Mã ca {c.maCa}</div>
                      </td>
                      <td>{c.lop || '—'}</td>
                      <td className="gv2-so gv2-khong-xuong">{gioNgayHoa2(c.batDau || c.moLuc)}</td>
                      <td className="gv2-so gv2-phai">
                        <b>{c.daVao}</b>
                        {moi > 0 && <span className="gv2-phu"> / {moi}</span>}
                      </td>
                      <td className="gv2-so gv2-phai">
                        <b>{c.daNop}</b>
                        <span className="gv2-phu"> / {c.daVao}</span>
                      </td>
                      <td className="gv2-so gv2-phai">{c.canhBao}</td>
                      <td className="gv2-phu">{CONG_BO_COT[c.congBo] || '—'}</td>
                      <td>
                        {xemDaXoa ? (
                          <span className="gv2-hang-nut">
                            <button type="button" className="gv2-nut-chu" onClick={() => handleKhoiPhuc(c.maCa)} disabled={dangKhoiPhuc === c.maCa}>
                              {dangKhoiPhuc === c.maCa ? 'Đang khôi phục…' : 'Khôi phục'}
                            </button>
                            <button type="button" className="gv2-nut-chu gv2-nut-do" onClick={() => setDsXoaVinhVien([c.maCa])} disabled={dangXoaVinhVien}>
                              Xoá vĩnh viễn
                            </button>
                          </span>
                        ) : (
                          <span className="gv2-chip" data-tone={TONE_CHIP[tt.tone] ?? 'xam'}>
                            {tt.ten}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="gv2-chan-bang">
              <span className="gv2-phu">
                <span className="gv2-so">{Math.min(soDongHien, dsLoc.length)}</span> / <span className="gv2-so">{dsLoc.length}</span> ca · xếp mới nhất trước
              </span>
              {dsLoc.length > soDongHien && (
                <button type="button" className="gv2-nut-vien" onClick={() => setSoDongHien((n) => n + SO_DONG_TRANG)}>
                  Xem thêm {Math.min(SO_DONG_TRANG, dsLoc.length - soDongHien)} ca
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="ls-thu-muc-luoi">
            {gomCaTheoNamSinh(dsLoc, (c) => c.tenCa).map((tm) => (
              <div key={tm.nam} className="ls-thu-muc">
                {/* THƯ MỤC NĂM SINH. Bấm để gấp lại cho đỡ dài. */}
                <button
                  type="button"
                  onClick={() => setGapNam((cu) => ({ ...cu, [tm.nam]: !cu[tm.nam] }))}
                  aria-expanded={!gapNam[tm.nam]}
                  className="tap-target ls-thu-muc-dau"
                >
                  <div className="ls-thu-muc-ten">
                    {gapNam[tm.nam] ? <ChevronRight size={17} className="ls-chevron" /> : <ChevronDown size={17} className="ls-chevron ls-chevron--mo" />}
                    <span>{tm.nam === THU_MUC_KHAC ? THU_MUC_KHAC : `Năm sinh ${tm.nam}`}</span>
                  </div>
                  <span className="ls-thu-muc-so">
                    {tm.ca.length} ca
                  </span>
                </button>
                {!gapNam[tm.nam] && (
                  <div role="region" aria-label={`Lịch sử ca ${tm.nam === THU_MUC_KHAC ? THU_MUC_KHAC : `Năm sinh ${tm.nam}`}`} tabIndex={0} className="ls-thu-muc-than" style={{ maxHeight: 'min(65vh, 560px)' }}>
                    {tm.ca.map((c) => {
              const tt = trangThaiCa(c, now)
              const tich = daChon.includes(c.maCa)
              return (
                <div
                  key={c.maCa}
                  onClick={chonMode ? () => bat(c.maCa) : (!xemDaXoa ? () => moChiTietCa(c.maCa) : undefined)}
                  // Hàng ca bấm được (chọn / mở chi tiết) ⇒ vai nút + bàn phím; ca đã xoá (chỉ xem) không bấm.
                  role={chonMode || !xemDaXoa ? 'button' : undefined}
                  tabIndex={chonMode || !xemDaXoa ? 0 : undefined}
                  onKeyDown={(e) => {
                    if ((chonMode || !xemDaXoa) && e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault()
                      e.currentTarget.click()
                    }
                  }}
                  data-trang-thai={tt.ten}
                  className={`ls-ca${chonMode && tich ? ' ls-ca--chon' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2.5 w-full">
                    {chonMode && (
                      <span className="shrink-0 pt-0.5" style={{ color: tich ? 'var(--xanh)' : 'var(--mo)' }} aria-hidden="true">
                        {tich ? <CheckSquare size={18} /> : <Square size={18} />}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="ls-ca-ma">
                          #{c.maCa}
                        </span>
                        <h4 className="ls-ca-ten">
                          {c.tenCa || `Ca ${c.maCa}`}
                        </h4>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="ls-ca-nop">
                        {c.daNop}/{c.daVao} nộp
                      </span>
                      <Nhan tone={xemDaXoa ? 'xam' : tt.tone}>{xemDaXoa ? 'đã xoá' : tt.ten}</Nhan>
                    </div>
                  </div>

                  <div className="ls-ca-meta">
                    {c.lop && (
                      <>
                        <span className="ls-ca-lop">
                          Lớp {c.lop}
                        </span>
                        <span className="ls-cham" aria-hidden="true">·</span>
                      </>
                    )}
                    <span>{ngayGio(c.batDau || c.moLuc)}</span>
                    <span className="ls-cham" aria-hidden="true">·</span>
                    <span>{c.thoiGianPhut} phút</span>
                  </div>

                  {(CONG_BO_NGAN[c.congBo] || c.canhBao > 0) && (
                    <div className="ls-ca-chan">
                      {CONG_BO_NGAN[c.congBo] && <Nhan tone="xam">{CONG_BO_NGAN[c.congBo]}</Nhan>}
                      {c.canhBao > 0 && <Nhan tone="cam">{c.canhBao} cảnh báo rời màn</Nhan>}
                    </div>
                  )}

                  {xemDaXoa && (
                    <div className="ls-ca-chan ls-ca-hd">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleKhoiPhuc(c.maCa)
                        }}
                        disabled={dangKhoiPhuc === c.maCa}
                        className="tap-target ls-nut-phu"
                      >
                        <RotateCcw size={14} className="ls-nut-phu-bieu-tuong" /> {dangKhoiPhuc === c.maCa ? 'Đang khôi phục…' : 'Khôi phục'}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDsXoaVinhVien([c.maCa])
                        }}
                        disabled={dangXoaVinhVien}
                        className="tap-target ls-nut-phu ls-nut-phu--do"
                      >
                        <Trash2 size={14} className="ls-nut-phu-bieu-tuong" /> Xoá vĩnh viễn
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {hoiXoa && chonTrongLoc.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'var(--phu)' }}>
            <div className="w-full flex flex-col" style={{ maxWidth: 400, background: 'var(--the)', borderRadius: 'var(--bo-3)', padding: 'var(--k5)', gap: 'var(--k3)', boxShadow: 'var(--bong-2)' }}>
              <div className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-4)' }}>
                Xoá {chonTrongLoc.length} ca?
              </div>
              {/* CẢNH BÁO NẶNG NHẤT ĐỨNG TRƯỚC: ca đang chạy.
                  Máy chủ coi ca đã xoá là ca KHOÁ, nên em đang làm dở sẽ nhận
                  "Ca đã khoá — không lưu thêm được" ngay giữa lúc thi. */}
              {dangChay.length > 0 && (
                <OThongBao tone="do">
                  <b style={SO}>{dangChay.length}</b> ca ĐANG CHẠY. Xoá là em đang làm dở không nộp được bài. Đóng ca trước, hoặc bỏ tích mấy ca này.
                </OThongBao>
              )}
              <OThongBao tone='cam'>
                {soBaiLam > 0 ? (
                  <>
                    Trong đó có bài làm của <b style={SO}>{soBaiLam}</b> em. Xoá là xoá mềm: bài làm giữ nguyên, khôi phục lại được ở mục <b>Ca đã xoá</b>.
                  </>
                ) : (
                  <>Các ca này chưa có em nào vào làm. Xoá là xoá mềm, khôi phục lại được ở mục <b>Ca đã xoá</b>.</>
                )}
              </OThongBao>
              <div className="overflow-auto" style={{ ...NHAN_NHO, maxHeight: 120 }}>
                {chonTrongLoc.map((c) => (
                  <div key={c.maCa} className="truncate">
                    <span style={SO}>{c.maCa}</span> · {c.tenCa || 'Ca chưa đặt tên'}
                    {c.daVao > 0 ? ` · ${c.daVao} em` : ''}
                    {caConEmDangLam(c, now) ? <b style={{ color: 'var(--do)' }}> · ĐANG CHẠY</b> : ''}
                  </div>
                ))}
              </div>
              <div className="flex" style={{ gap: 'var(--k2)' }}>
                <NutChinh
                  variant="phu"
                  onClick={() => {
                    setHoiXoa(false)
                                  }}
                >
                  Huỷ
                </NutChinh>
                <NutChinh variant="nguyhiem" onClick={handleXoa} disabled={dangXoa}>
                  {dangXoa ? 'Đang xoá…' : `Xoá ${chonTrongLoc.length} ca`}
                </NutChinh>
              </div>
            </div>
          </div>
        )}

        {dsXoaVinhVien.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'var(--phu)' }}>
            <div className="w-full flex flex-col" style={{ maxWidth: 420, background: 'var(--the)', borderRadius: 'var(--bo-3)', padding: 'var(--k5)', gap: 'var(--k3)', boxShadow: 'var(--bong-2)' }}>
              <div className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-4)', color: 'var(--do)' }}>
                Xoá vĩnh viễn {dsXoaVinhVien.length} ca?
              </div>
              <OThongBao tone="do">
                <b>Hành động này KHÔNG THỂ HOÀN TÁC!</b> Toàn bộ bài làm của học sinh, kết quả chấm điểm, link phiếu và cấu hình đề thi của {dsXoaVinhVien.length} ca này sẽ bị xoá sạch vĩnh viễn khỏi máy chủ.
              </OThongBao>
              <div className="overflow-auto" style={{ ...NHAN_NHO, maxHeight: 150 }}>
                {dsXoaVinhVien.map((ma) => {
                  const c = (dsCa ?? []).find((x) => x.maCa === ma)
                  return (
                    <div key={ma} className="truncate" style={{ padding: '2px 0' }}>
                      <span style={SO}>{ma}</span> · {c?.tenCa || 'Ca chưa đặt tên'}
                      {c && c.daVao > 0 ? ` · ${c.daVao} em` : ''}
                    </div>
                  )
                })}
              </div>
              <div className="flex" style={{ gap: 'var(--k2)' }}>
                <NutChinh
                  variant="phu"
                  onClick={() => setDsXoaVinhVien([])}
                  disabled={dangXoaVinhVien}
                >
                  Huỷ
                </NutChinh>
                <NutChinh variant="nguyhiem" onClick={handleXoaVinhVien} disabled={dangXoaVinhVien}>
                  {dangXoaVinhVien ? 'Đang xoá vĩnh viễn…' : `Xoá vĩnh viễn ${dsXoaVinhVien.length} ca`}
                </NutChinh>
              </div>
            </div>
          </div>
        )}
      </TheNoiDung>

      {/* Công cụ hiếm dùng: xuống CUỐI trang cho danh sách ca lên trước. Nút, câu chữ và luồng xác nhận trong khối này không đổi. */}
      {!hoa2 && !xemDaXoa && !chonMode && <NutDongBoMoiCa />}
    </div>
  )
}
