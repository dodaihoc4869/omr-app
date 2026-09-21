// CA THI (QUANLYCATHI.md mục 2) — mọi ca nằm trên Google Sheet, máy
// nào của thầy mở cũng thấy đủ và giống nhau. Mỗi hàng: tên ca, mã ca, lớp,
// ngày, tỉ lệ đã nộp, nhãn trạng thái. Chạm → Chi tiết ca (ExamMonitorScreen).
// Bật "Chọn" → mỗi hàng thành ô tích, xoá được nhiều ca ngay tại màn này.
// Chỉ dùng token + 6 thành phần thiết kế; số liệu dùng --sans.
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

const SO: React.CSSProperties = { fontFamily: 'var(--sans)', fontVariantNumeric: 'tabular-nums' }
const NHAN_NHO: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }
/** Luật công bố điểm của ca, nói bằng lời cho từng dòng ca (bản vẽ GV-3). Ca cũ không có `congBo` ⇒ không vẽ chip, không đoán. */
const CONG_BO_NGAN: Record<string, string> = { khong: 'Điểm chưa công bố cho học sinh', ngay: 'Điểm hiện ngay khi học sinh nộp', ca_lop_xong: 'Điểm hiện khi cả lớp nộp xong' }

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

export default function LichSuCaScreen() {
  const setScreen = useAppStore((s) => s.setScreen)
  const moChiTietCa = useAppStore((s) => s.moChiTietCa)
  const showToast = useAppStore((s) => s.showToast)

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
      setDsCa(await danhSachCa(url.trim(), mat.trim(), xemDaXoa))
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
    return (dsCa ?? []).filter((c) => (!lopLoc || c.lop.trim() === lopLoc) && (!ttLoc || c.trangThai === ttLoc) && (!q || c.maCa.includes(q) || c.tenCa.toLowerCase().includes(q) || c.lop.toLowerCase().includes(q)))
  }, [dsCa, timKiem, lopLoc, ttLoc])
  const demMo = useMemo(() => (dsCa ?? []).filter((c) => c.trangThai === 'mo').length, [dsCa])
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

  return (
    <div className="gv-page ls-trang min-h-screen pb-28 px-3 sm:px-4 pt-4 flex flex-col" style={{ background: 'var(--nen)', color: 'var(--muc)', gap: 'var(--k4)', fontFamily: 'var(--sans)' }}>
      <div className="gv-page-header flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="ls-icon">
            <ClipboardList size={22} />
          </div>
          <div>
            <h1 className="ls-tieu-de">
              {xemDaXoa ? 'Ca đã xoá' : 'Ca kiểm tra'}
            </h1>
            <p className="ls-phu-de">
              {xemDaXoa ? 'Thùng rác và phục hồi dữ liệu ca' : 'Quản lý, tìm kiếm và chi tiết các ca kiểm tra'}
            </p>
          </div>
        </div>
      </div>

      <TheNoiDung className="gv-directory">
        <div className="gv-filterbar flex items-center gap-2 sm:gap-2.5 mb-3">
          <div className="relative flex-1">
            <Search size={18} className="ls-o-tim-bieu-tuong" />
            <input
              className="ls-o-tim"
              placeholder="Tìm mã ca, tên ca, lớp…"
              value={timKiem}
              onChange={(e) => setTimKiem(e.target.value)}
              inputMode="search"
              aria-label="Tìm ca"
            />
          </div>
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
          <div className="ls-chips" role="group" aria-label="Lọc theo trạng thái ca">
            {(
              [
                ['', `Tất cả ${dsCa.length}`],
                ['mo', `Đang mở ${demMo}`],
                ['dong', `Đã đóng ${demDong}`],
              ] as const
            ).map(([k, ten]) => (
              <button key={k || '__tat_ca_tt'} type="button" onClick={() => setTtLoc(k)} aria-pressed={ttLoc === k} className={`tap-target ls-chip${ttLoc === k ? ' ls-chip--chon' : ''}`} style={SO}>
                {ten}
              </button>
            ))}
          </div>
        )}

        {dsLop.length > 1 && (
          <div className="ls-chips" role="group" aria-label="Lọc theo lớp">
            {['', ...dsLop].map((l) => {
              const chon = lopLoc === l
              return (
                <button
                  key={l || '__tat_ca'}
                  type="button"
                  onClick={() => setLopLoc(l)}
                  className={`tap-target ls-chip${chon ? ' ls-chip--chon' : ''}`}
                  style={SO}
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
            <span style={NHAN_NHO}>
              Hoặc bấm nút <b>Xoá vĩnh viễn</b> ở từng ca bên dưới
            </span>
          </div>
        )}

        {loi && <OThongBao tone="do">{loi}</OThongBao>}
        {dsCa === null ? (
          <div style={{ ...NHAN_NHO, padding: 'var(--k4) 0' }}>Đang tải danh sách ca từ máy chủ…</div>
        ) : dsLoc.length === 0 ? (
          <div className="flex flex-col" style={{ gap: 'var(--k3)' }}>
            <div style={{ ...NHAN_NHO, padding: 'var(--k2) 0' }}>{dsCa.length === 0 ? (xemDaXoa ? 'Không có ca nào đã xoá.' : 'Chưa có ca nào.') : 'Không có ca khớp bộ lọc.'}</div>
            {dsCa.length === 0 && !xemDaXoa && (
              <NutChinh variant="phu" onClick={() => setScreen('examsetup')}>
                Mở ca kiểm tra đầu tiên
              </NutChinh>
            )}
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
      {!xemDaXoa && !chonMode && <NutDongBoMoiCa />}
    </div>
  )
}
