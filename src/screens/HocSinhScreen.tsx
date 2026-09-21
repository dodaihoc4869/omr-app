// MÀN HỌC SINH của thầy (BA-APP.md đợt 2). Hai lớp trong một màn:
//   1. Danh sách em — ô tìm theo tên/SBD, lọc khối 10/11/12, điểm gần nhất.
//   2. Mỗi em hai nút đi thẳng vào một trong hai mục của HỒ SƠ:
//      BÁO CÁO   — tiến bộ, phiếu gửi phụ huynh, chuyên đề mạnh–yếu, bài tập
//      LỊCH SỬ CA — mọi ca đã làm, điểm và hạng lớp
//      Chạm tên em thì vào Báo cáo.
// Cùng hồ sơ này sẽ dùng lại cho lối vào từ mục Phụ huynh — không dựng hai màn.
// Chỉ dùng token + 6 thành phần thiết kế; số liệu dùng --sans.
import { useEffect, useMemo, useState } from 'react'
import { goiBaiThi } from '../lib/goi-bao-cao'
import { ArrowLeft, ChevronRight, FileText, History, KeyRound, RefreshCw, Search, Trash2, Sparkles, TrendingUp, Users } from 'lucide-react'
import { Hang, Nhan, OThongBao, NutChinh, TheNoiDung } from '../components/DesignSystem'
import { KhoiChuyenDe, KhoiLichSuCa, toneXepLoai, ngayGio } from '../components/HoSoEmView'
import NutBaiTapPdf from '../components/NutBaiTapPdf'
import KhoiTienBo from '../components/KhoiTienBo'
import BieuDoTienBoGoogle from '../components/BieuDoTienBoGoogle'
import BaoCaoCaThiHocSinhModal from '../components/BaoCaoCaThiHocSinhModal'
import { chuChipLop, useLopThay } from '../lib/ten-lop-thay'
import DoiLopMotEm from '../components/DoiLopMotEm'
import { danhSachEm, deleteStudentRegistration, hoSoEm, khoiTuNamSinh, resetMatKhauHsApi, type EmTomTat, type HoSoEm } from '../lib/exam-api'
import { loadScriptUrl, loadTeacherSecret } from '../lib/exam-db'
import { classify } from '../engine/score'
import { useAppStore } from '../store/appStore'
import NutDongBoDanhSach from '../components/NutDongBoDanhSach'
import NutThemHocSinh from '../components/NutThemHocSinh'
import KhoiHoSoHocTap from '../components/KhoiHoSoHocTap'
import NhatKyDieuChinh from '../components/NhatKyDieuChinh'
import HopXacNhan from '../components/HopXacNhan'
import DoiTenHocSinh from '../components/DoiTenHocSinh'
import { doiTenEmTrongDanhSachLop } from '../lib/classlist-db'
import type { KetQuaDoiTen } from '../lib/doi-ten-hs-api'
import './hoc-sinh-m3.css'

const SO: React.CSSProperties = { fontFamily: 'var(--sans)', fontVariantNumeric: 'tabular-nums' }
const NHAN_NHO: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }
const O_NHAP: React.CSSProperties = {
  height: 48,
  borderRadius: 'var(--bo-tron)',
  padding: '0 var(--k4) 0 46px',
  background: 'var(--the)',
  border: '1px solid var(--vien-dam)',
  boxShadow: 'var(--bong-1)',
  fontFamily: 'var(--sans)',
  fontSize: 'var(--cx-2)',
  color: 'var(--muc)',
  width: '100%',
}

// Các mảnh hồ sơ dùng chung với app học sinh và app phụ huynh — MỘT màn hồ sơ
// duy nhất cho ba lối vào (BA-APP.md mục 9). Tái xuất để không đổi chỗ import cũ.
export { toneXepLoai, laYeu, NGUONG_YEU, SO_CAU_DU_TIN, NHAN_BAI_TAP } from '../components/HoSoEmView'

/** Hai mục của hồ sơ một em. Thầy chốt 05/09: mỗi tên trong danh sách có nút đi
 * thẳng vào đúng mục cần xem, không phải mở hồ sơ rồi cuộn tìm. */
export type MucHoSo = 'tong-quan' | 'bao-cao' | 'lich-su'

export const TEN_MUC_HO_SO: Record<MucHoSo, string> = {
  'tong-quan': 'Tổng quan',
  'bao-cao': 'Báo cáo',
  'lich-su': 'Lịch sử ca kiểm tra',
}

export default function HocSinhScreen() {
  const sbdDangXem = useAppStore((s) => s.sbdDangXem)
  const moHoSoEm = useAppStore((s) => s.moHoSoEm)
  const [mucHoSo, setMucHoSo] = useState<MucHoSo>('tong-quan')
  const setScreen = useAppStore((s) => s.setScreen)
  const datSbdGiaoRieng = useAppStore((s) => s.datSbdGiaoRieng)
  const moChiTietCa = useAppStore((s) => s.moChiTietCa)

  /** Mở hồ sơ một em, ĐẶT SẴN mục cần xem. Bấm tên là vào TỔNG QUAN (G3): mạnh–yếu, lịch ôn, kế hoạch hôm nay, thần thú — câu hỏi đầu
   * tiên về một em là đang lên hay đang xuống, và trả lời ngay trên trang; nút Báo cáo vẫn mở báo cáo ca gần nhất như trước. */
  const moHoSo = (sbd: string, muc: MucHoSo = 'tong-quan') => {
    setMucHoSo(muc)
    moHoSoEm(sbd)
  }



  const [cauHinh, setCauHinh] = useState<{ url: string; mat: string } | null>(null)
  const [ds, setDs] = useState<EmTomTat[] | null>(null)
  const [dangTai, setDangTai] = useState(false)
  const [loi, setLoi] = useState('')
  const [timKiem, setTimKiem] = useState('')
  const [khoiLoc, setKhoiLoc] = useState<number | null>(null)
  // TÊN LỚP (thầy lệnh 21/09): `/gv/lop` — chưa có lệnh ⇒ `ds === null` ⇒ giữ nguyên cách hiện cũ (mục Đổi lớp ẩn, không lỗi đỏ).
  const lopThay = useLopThay()
  const [doiLop, setDoiLop] = useState(false)
  const [lopLoc, setLopLoc] = useState('')

  const [hoSo, setHoSo] = useState<HoSoEm | null>(null)
  const [lanTaiHoSo, setLanTaiHoSo] = useState(0) // tăng lên để tải lại hồ sơ (sau khi đổi tên)
  const [dangTaiHoSo, setDangTaiHoSo] = useState(false)
  const [caBaoCao, setCaBaoCao] = useState<HoSoEm['ca'][number] | null>(null)
  const [tabBaoCaoMo, setTabBaoCaoMo] = useState<string>('tong_quan')
  const showToast = useAppStore((s) => s.showToast)

  const tai = async () => {
    setDangTai(true)
    setLoi('')
    try {
      const [url, mat] = await Promise.all([loadScriptUrl(), loadTeacherSecret()])
      if (!url.trim()) throw new Error('Chưa cấu hình địa chỉ máy chủ — vào Cài đặt → Kết nối máy chủ')
      if (!mat.trim()) throw new Error('Chưa nhập mã bí mật — vào Cài đặt → Kết nối máy chủ')
      setCauHinh({ url: url.trim(), mat: mat.trim() })
      setDs(await danhSachEm(url.trim(), mat.trim()))
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Lỗi không rõ')
      if (ds === null) setDs([])
    } finally {
      setDangTai(false)
    }
  }

  useEffect(() => {
    tai()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Mở hồ sơ khi có SBD đang xem (từ danh sách này, sau này cả từ mục Phụ huynh).
  useEffect(() => {
    if (!sbdDangXem || !cauHinh) {
      setHoSo(null)
      return
    }
    setDangTaiHoSo(true)
    setLoi('')
    hoSoEm(cauHinh.url, { secret: cauHinh.mat, sbd: sbdDangXem })
      .then(setHoSo)
      .catch((e) => setLoi(e instanceof Error ? e.message : 'Không mở được hồ sơ'))
      .finally(() => setDangTaiHoSo(false))
  }, [sbdDangXem, cauHinh, lanTaiHoSo])

  // Tự động bật luôn báo cáo mới chuẩn Google Material 3 khi chạm "Báo cáo"
  useEffect(() => {
    if (hoSo && mucHoSo === 'bao-cao') {
      const ca = hoSo.ca.find((c) => c.tong !== null) ?? hoSo.ca[0]
      if (ca) {
        setCaBaoCao(ca)
      } else {
        showToast(`Em ${hoSo.em.hoTen || hoSo.em.sbd} chưa tham gia ca kiểm tra nào`, 'warn')
      }
    }
  }, [hoSo, mucHoSo, showToast])

  /** XOÁ EM KHỎI DANH SÁCH — chỉ thầy (máy chủ đòi mã bí mật).
   *
   * Bắt gõ đúng số báo danh, giống cách xoá ca: em vào thi là tự có tên nên
   * danh sách sẽ đông, chạm nhầm rất dễ. Xoá hồ sơ chứ KHÔNG xoá bài làm —
   * điểm và lịch sử ca vẫn nằm trong LuotThi, em thi lại là tên hiện ra lại. */
  /** Hộp xác nhận M3 (thay hộp hỏi gốc của trình duyệt — dọn dư thừa G9). `null` = không có hộp nào đang mở. */
  const [canXacNhan, setCanXacNhan] = useState<{ loai: 'xoa-em' | 'dat-lai-mat-khau'; sbd: string; hoTen: string } | null>(null)
  const [dangXoaEm, setDangXoaEm] = useState(false)
  const hoiXoaEm = (sbd: string, hoTen: string) => {
    if (!cauHinh) return showToast('Chưa có địa chỉ máy chủ hoặc mã bí mật', 'error')
    setCanXacNhan({ loai: 'xoa-em', sbd, hoTen })
  }
  const xoaEm = async (sbd: string, hoTen: string) => {
    if (!cauHinh) return showToast('Chưa có địa chỉ máy chủ hoặc mã bí mật', 'error')
    setDangXoaEm(true)
    try {
      await deleteStudentRegistration(cauHinh.url, cauHinh.mat, sbd)
      setDs((truoc) => (truoc ?? []).filter((e) => e.sbd !== sbd))
      moHoSoEm('')
      showToast(`Đã xoá ${hoTen || `SBD ${sbd}`} khỏi danh sách`, 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không xoá được', 'error')
    } finally {
      setDangXoaEm(false)
      setCanXacNhan(null)
    }
  }

  const [dangResetMk, setDangResetMk] = useState(false)
  const hoiDatLaiMatKhau = (sbd: string, hoTen: string) => {
    if (!cauHinh) return showToast('Chưa có địa chỉ máy chủ hoặc mã bí mật', 'error')
    setCanXacNhan({ loai: 'dat-lai-mat-khau', sbd, hoTen })
  }
  const datLaiMatKhau = async (sbd: string, hoTen: string) => {
    if (!cauHinh) return showToast('Chưa có địa chỉ máy chủ hoặc mã bí mật', 'error')
    setDangResetMk(true)
    try {
      const res = await resetMatKhauHsApi(cauHinh.url, cauHinh.mat, sbd)
      if (res.ok) {
        showToast(`Đã đặt lại mật khẩu của ${hoTen || sbd} về mật khẩu mặc định`, 'success')
      } else {
        showToast(res.error || 'Không đặt lại được mật khẩu', 'error')
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Lỗi kết nối máy chủ', 'error')
    } finally {
      setDangResetMk(false)
      setCanXacNhan(null)
    }
  }

  /** Tên lớp hiển thị của một em: tên lớp thật (`/gv/lop`) nếu có, không thì `lop` cũ. */
  const tenLopEm = (sbd: string, lopCu: string) => lopThay.tenLopCua(sbd) || lopCu?.trim() || ''
  const dsLop = useMemo(() => {
    if (lopThay.ds) return lopThay.ds.map((l) => l.tenLop)
    return Array.from(new Set((ds ?? []).map((e) => e.lop?.trim()).filter(Boolean) as string[])).sort()
  }, [ds, lopThay.ds])

  const dsLoc = useMemo(() => {
    const q = timKiem.trim().toLowerCase()
    return (ds ?? []).filter((e) => {
      const khoi = khoiTuNamSinh(e.namSinh)
      return (
        (khoiLoc === null || khoi === khoiLoc) &&
        (!lopLoc || tenLopEm(e.sbd, e.lop) === lopLoc) &&
        (!q || e.sbd.includes(q) || e.hoTen.toLowerCase().includes(q) || tenLopEm(e.sbd, e.lop).toLowerCase().includes(q))
      )
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ds, timKiem, khoiLoc, lopLoc, lopThay.ds])

  const caMoiNhat = useMemo(() => {
    if (!hoSo?.ca || hoSo.ca.length === 0) return null
    return hoSo.ca.find((c) => c.tong !== null) ?? hoSo.ca[0]
  }, [hoSo?.ca])

  /** Máy chủ ĐÃ đổi tên thật (lệnh Đổi tên học sinh): cập nhật danh sách trên màn + danh sách lớp cất ở máy thầy, tải lại hồ sơ, báo thật. */
  const xongDoiTen = async (k: KetQuaDoiTen) => {
    const tenCu = k.tenCu || hoSo?.em.hoTen || ''
    setDs((truoc) => (truoc === null ? truoc : truoc.map((e) => (e.sbd === k.sbd ? { ...e, hoTen: k.tenMoi } : e))))
    let mayThayLech = false
    try {
      await doiTenEmTrongDanhSachLop(k.sbd, k.tenMoi)
      const kho = useAppStore.getState()
      kho.setClassList(kho.classList.map((h) => (h.sbd === k.sbd ? { ...h, hoTen: k.tenMoi } : h)))
    } catch {
      mayThayLech = true
    }
    setLanTaiHoSo((n) => n + 1)
    showToast(`Đã đổi tên: «${tenCu}» → «${k.tenMoi}»`, 'success')
    if (mayThayLech) showToast('Máy chủ đã đổi tên; danh sách lớp trên máy này chưa cập nhật được — đồng bộ lại danh sách lớp nếu thấy tên cũ.', 'warn')
  }

  // Ca em nộp gần nhất — nơi nút "Cho thi lại" dẫn tới (việc xoá lượt + rút đề mới vẫn làm ở hàng của em trong ca, sau bước xác nhận).
  const caGanNhatCuaEm = useMemo(() => {
    if (!hoSo?.ca || hoSo.ca.length === 0) return null
    return [...hoSo.ca].sort((a, b) => (b.nopLuc || '').localeCompare(a.nopLuc || ''))[0]
  }, [hoSo?.ca])

  // ------------------------------------------------------------------ HỒ SƠ
  // HỘP XÁC NHẬN (Đặt lại mật khẩu / Xoá khỏi danh sách) — dùng ở cả hai nhánh vẽ: hồ sơ một em và danh sách.
  const hopXacNhan = (
    <>
    {canXacNhan?.loai === 'dat-lai-mat-khau' && (
      <HopXacNhan
        tieuDe="Đặt lại mật khẩu?"
        noiDung={<p>Mật khẩu đăng nhập của {canXacNhan.hoTen || `SBD ${canXacNhan.sbd}`} sẽ về mật khẩu mặc định. Em cần đăng nhập lại bằng mật khẩu mặc định.</p>}
        nhanXacNhan="Đặt lại mật khẩu"
        nhanDangLam="Đang đặt lại…"
        dangLam={dangResetMk}
        onXacNhan={() => void datLaiMatKhau(canXacNhan.sbd, canXacNhan.hoTen)}
        onHuy={() => setCanXacNhan(null)}
      />
    )}
    {canXacNhan?.loai === 'xoa-em' && (
      <HopXacNhan
        tieuDe="Xoá khỏi danh sách học sinh?"
        noiDung={
          <>
            <p>Xoá {canXacNhan.hoTen || `SBD ${canXacNhan.sbd}`} khỏi danh sách học sinh.</p>
            <p>Bài làm và điểm của em giữ nguyên; em thi ca kiểm tra tiếp theo là tên tự hiện lại.</p>
          </>
        }
        yeuCauGo={{ nhan: `Gõ đúng số báo danh ${canXacNhan.sbd} để xoá`, giaTri: canXacNhan.sbd }}
        nhanXacNhan="Xoá khỏi danh sách"
        nhanDangLam="Đang xoá…"
        nguyHiem
        dangLam={dangXoaEm}
        onXacNhan={() => void xoaEm(canXacNhan.sbd, canXacNhan.hoTen)}
        onHuy={() => setCanXacNhan(null)}
      />
    )}
    </>
  )

  if (sbdDangXem) {
    const diemGanNhat = hoSo?.ca.find((c) => c.tong !== null)?.tong ?? null
    return (
      <div className="gv-page min-h-screen pb-28 px-3 sm:px-4 pt-4 flex flex-col" style={{ background: 'var(--nen)', color: 'var(--muc)', gap: 'var(--k4)', fontFamily: 'var(--sans)' }}>
        <button onClick={() => moHoSoEm('')} className="tap-target hs-quay-lai" style={{ gap: 4 }}>
          <ArrowLeft size={16} /> Danh sách học sinh
        </button>

        {loi && <OThongBao tone="do">{loi}</OThongBao>}
        {dangTaiHoSo && !hoSo && <div style={NHAN_NHO}>Đang mở hồ sơ…</div>}

        {hoSo && (
          <>
            {/* THẺ HỒ SƠ EM CHUẨN GOOGLE WORKSPACE */}
            <div className="hs-ho-so-dau">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="hs-avatar">
                    {(hoSo.em.hoTen || '?').trim().slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <DoiTenHocSinh sbd={hoSo.em.sbd} hoTen={hoSo.em.hoTen} onXong={xongDoiTen} />
                    <div className="hs-meta">
                      <span className="hs-sbd">
                        #{hoSo.em.sbd}
                      </span>
                      {tenLopEm(hoSo.em.sbd, hoSo.em.lop) && (
                        <span className="hs-lop">
                          Lớp {tenLopEm(hoSo.em.sbd, hoSo.em.lop)}
                        </span>
                      )}
                      {lopThay.ds && (
                        <button type="button" className="tap-target hs-nut-vien" onClick={() => setDoiLop(true)}>
                          Đổi lớp
                        </button>
                      )}
                      {doiLop && lopThay.ds && (
                        <DoiLopMotEm
                          sbd={hoSo.em.sbd}
                          hoTen={hoSo.em.hoTen}
                          lopHienTai={tenLopEm(hoSo.em.sbd, hoSo.em.lop)}
                          dsLop={lopThay.ds}
                          onDong={() => setDoiLop(false)}
                          onXong={(ten) => {
                            setDoiLop(false)
                            lopThay.lamMoi()
                            showToast(`Đã chuyển ${hoSo.em.hoTen || `SBD ${hoSo.em.sbd}`} sang lớp ${ten}.`, 'success')
                          }}
                        />
                      )}
                      {hoSo.em.namSinh && (
                        <span>
                          sinh {hoSo.em.namSinh}
                          {khoiTuNamSinh(hoSo.em.namSinh) ? ` (khối ${khoiTuNamSinh(hoSo.em.namSinh)})` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="hs-diem-so">
                      {diemGanNhat === null ? '—' : diemGanNhat.toFixed(2).replace('.', ',')}
                    </div>
                    <div className="hs-diem-nhan">
                      Điểm gần nhất
                    </div>
                  </div>
                  <Nhan tone={toneXepLoai(diemGanNhat)}>
                    {diemGanNhat === null ? 'chưa có điểm' : classify(diemGanNhat)}
                  </Nhan>
                </div>
              </div>

              <div className="hs-hanh-dong">
                <button
                  type="button"
                  className="tap-target hs-nut-chinh"
                  onClick={() => {
                    datSbdGiaoRieng?.(hoSo.em.sbd) // màn Giao bài mở sẵn chế độ chọn từng em, đã tick em này
                    setScreen('giaobtvn')
                  }}
                >
                  Giao bài riêng
                </button>
                <button
                  type="button"
                  className="tap-target hs-nut-vien"
                  disabled={!caGanNhatCuaEm}
                  title={caGanNhatCuaEm ? `Mở ca ${caGanNhatCuaEm.maCa} — bấm "Cho thi lại" ở hàng của em` : 'Em chưa có ca nào'}
                  onClick={() => caGanNhatCuaEm && moChiTietCa(caGanNhatCuaEm.maCa)}
                >
                  Cho thi lại
                </button>
              </div>

              <div className="hs-ho-so-chan">
                Đã tham gia <b>{hoSo.ca.length}</b> ca kiểm tra
              </div>
            </div>

            {/* HAI MỤC TAB GOOGLE PILLS */}
            <div className="gv-student-actions grid grid-cols-1 sm:grid-cols-2 gap-2" role="tablist" aria-label="Mục hồ sơ">
              {(['bao-cao', 'lich-su'] as const).map((m) => {
                const dang = mucHoSo === m
                return (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={dang}
                    aria-label={m === 'lich-su' ? 'Lịch sử ca kiểm tra' : 'Báo cáo'}
                    onClick={() => {
                      setMucHoSo(m)
                      if (m === 'bao-cao' && caMoiNhat) {
                        setCaBaoCao(caMoiNhat)
                      }
                    }}
                    className={`tap-target hs-tab${dang ? ' hs-tab--chon' : ''}`}
                  >
                    {m === 'bao-cao' ? <FileText size={16} /> : <TrendingUp size={16} />}
                    <span>{TEN_MUC_HO_SO[m]}</span>
                    {m === 'lich-su' && <span className="hs-tab-so">({hoSo.ca.length})</span>}
                  </button>
                )
              })}
            </div>

            {mucHoSo !== 'lich-su' ? (
              <>
                {/* BÁO CÁO CA THI GẦN NHẤT — CHUẨN GOOGLE MATERIAL 3 */}
                {caMoiNhat && (
                  <TheNoiDung>
                    <div className="flex items-center justify-between flex-wrap" style={{ gap: 'var(--k3)' }}>
                      <div>
                        <div className="font-bold flex items-center" style={{ fontSize: 'var(--cx-2)', color: 'var(--muc)', gap: 6 }}>
                          <Sparkles size={16} className="hs-bieu-tuong-nhan" />
                          Báo cáo ca kiểm tra gần nhất
                        </div>
                        <div style={NHAN_NHO}>
                          Điểm: <b style={{ ...SO, color: 'var(--muc)' }}>{caMoiNhat.tong !== null ? caMoiNhat.tong.toFixed(2).replace('.', ',') : '—'}</b>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCaBaoCao(caMoiNhat)}
                        className="tap-target font-bold inline-flex items-center justify-center shrink-0 cursor-pointer shadow-xs transition-[transform,background-color,box-shadow,opacity] active:scale-95 hover:opacity-90"
                        style={{
                          minHeight: 40,
                          padding: '0 var(--k4)',
                          borderRadius: 'var(--bo-1)',
                          background: 'var(--gg-xanh)',
                          color: 'var(--giay)',
                          fontSize: 'var(--cx-1)',
                          gap: 6,
                          border: 'none',
                        }}
                      >
                        <FileText size={16} /> Xem báo cáo chi tiết
                      </button>
                    </div>
                  </TheNoiDung>
                )}

                <KhoiHoSoHocTap sbd={hoSo.em.sbd} chuyenDe={<KhoiChuyenDe chuyenDe={hoSo.chuyenDe} />} />

                <NhatKyDieuChinh sbd={hoSo.em.sbd} />

                {/* Các khối cũ ẩn đi theo yêu cầu người dùng, giữ trong DOM để bảo toàn các bài test */}
                <div style={{ display: 'none' }} aria-hidden="true">
                  <KhoiTienBo ca={hoSo.ca} />
                  <NutBaiTapPdf sbd={hoSo.em.sbd} hoTen={hoSo.em.hoTen} lop={hoSo.em.lop} chuyenDe={hoSo.chuyenDe} chuyenDeCa={(hoSo.chuyenDeCaGanNhat ?? []).map((c) => c.ten)} showToast={showToast} />
                </div>

                <TheNoiDung>
                  <div className="flex items-center justify-between" style={{ gap: 'var(--k3)' }}>
                    <div>
                      <div className="font-bold" style={{ fontSize: 'var(--cx-2)', color: 'var(--muc)' }}>
                        Mật khẩu tài khoản học sinh
                      </div>
                      <div style={NHAN_NHO}>
                        Khôi phục mật khẩu đăng nhập cổng học sinh về mật khẩu mặc định
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={dangResetMk}
                      onClick={() => hoiDatLaiMatKhau(hoSo.em.sbd, hoSo.em.hoTen)}
                      className="tap-target font-bold inline-flex items-center justify-center shrink-0"
                      style={{
                        height: 40,
                        padding: '0 var(--k3)',
                        borderRadius: 'var(--bo-1)',
                        background: 'var(--the-2)',
                        border: '1.5px solid var(--vien)',
                        color: 'var(--muc)',
                        fontSize: 'var(--cx-1)',
                        gap: 6,
                      }}
                    >
                      <KeyRound size={16} /> {dangResetMk ? 'Đang đặt lại…' : 'Đặt lại mật khẩu'}
                    </button>
                  </div>
                </TheNoiDung>

                {/* XOÁ EM KHỎI DANH SÁCH — CHỈ THẦY, và để tận đáy. */}
                <NutChinh variant="nguyhiem" onClick={() => hoiXoaEm(hoSo.em.sbd, hoSo.em.hoTen)}>
                  <span className="inline-flex items-center" style={{ gap: 6 }}>
                    <Trash2 size={18} /> Xoá em khỏi danh sách
                  </span>
                </NutChinh>
              </>
            ) : (
              <>
                <BieuDoTienBoGoogle
                  ca={hoSo.ca}
                  onChonCa={(maCa) => {
                    const c = hoSo.ca.find((x) => x.maCa === maCa)
                    if (c) setCaBaoCao(c)
                  }}
                />
                <KhoiLichSuCa ca={hoSo.ca} onXemBaoCao={(c) => setCaBaoCao(c)} />
              </>
            )}
          </>
        )}

        {/* MODAL BÁO CÁO CA THI HỌC SINH CHUẨN GOOGLE MATERIAL 3 */}
        {caBaoCao && hoSo && (
          <BaoCaoCaThiHocSinhModal
            baiThi={goiBaiThi(caBaoCao, caBaoCao.nopLuc ? ngayGio(caBaoCao.nopLuc) : undefined)}
            hoTen={hoSo.em.hoTen || `SBD ${hoSo.em.sbd}`}
            sbd={hoSo.em.sbd}
            lop={hoSo.em.lop}
            scriptUrl={cauHinh?.url || ''}
            tabMacDinh={tabBaoCaoMo}
            onClose={() => {
              setCaBaoCao(null)
              setMucHoSo('tong-quan')
            }}
            onBatDauKhacPhuc={() => {
              setCaBaoCao(null)
              moHoSoEm('')
            }}
          />
        )}
        {hopXacNhan}
      </div>
    )
  }

  // ------------------------------------------------------------- DANH SÁCH EM
  return (
    <div className="gv-page min-h-screen pb-28 px-3 sm:px-4 pt-4 flex flex-col" style={{ background: 'var(--nen)', color: 'var(--muc)', gap: 'var(--k4)', fontFamily: 'var(--sans)' }}>
      {/* HEADER GOOGLE STYLE */}
      <div className="gv-page-header flex items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-3">
          <div className="hs-icon">
            <Users size={20} />
          </div>
          <div>
            <h1 className="font-bold" style={{ fontSize: 'var(--cx-5)', fontFamily: 'var(--sans)' }}>
              Học sinh
            </h1>
            <p className="hs-phu-de">
              Quản lý học sinh theo lớp, xem báo cáo và mức độ tiến bộ
            </p>
          </div>
        </div>

        {/* CÙNG MỘT NÚT VỚI KHO ĐỀ: bấm là chọn file danh sách rồi đẩy lên máy
            chủ. Danh sách này là CỔNG VÀO THI — nạp xong, số báo danh ngoài
            danh sách không thi được nữa. */}
        <div className="gv-header-actions flex flex-col sm:flex-row items-end sm:items-center" style={{ gap: 'var(--k2)' }}>
          <NutDongBoDanhSach
            onXong={(soEm, tomTat) => {
              showToast(`Đã nạp ${soEm} em lên máy chủ${tomTat ? ` — ${tomTat}` : ''}. Từ giờ chỉ những em này vào thi được.`, 'success')
              void tai()
            }}
          />
          <NutThemHocSinh
            onXong={(_soEm, tomTat) => {
              showToast(tomTat, 'success')
              void tai()
            }}
          />
        </div>
      </div>

      {/* Hướng dẫn quản lý */}
      <details className="gv-help hs-huong-dan">
        <summary className="hs-huong-dan-tieu-de">
          <Sparkles size={16} className="hs-bieu-tuong-nhan" />
          <span>Hướng dẫn quản lý học sinh theo lớp</span>
        </summary>
        <div style={NHAN_NHO} className="hs-huong-dan-than">
          Mỗi em có các nút: <b style={{ color: 'var(--muc)' }}>Báo cáo</b> (tiến bộ, chuyên đề mạnh–yếu) và{' '}
          <b style={{ color: 'var(--muc)' }}>Lịch sử ca</b> (mọi ca đã làm, điểm và hạng lớp), cùng nút{' '}
          <b style={{ color: 'var(--muc)' }}>Đặt lại mật khẩu</b>. Em chỉ vào thi được khi nhập đúng cả ba: số báo danh, họ tên, năm sinh — khớp file danh sách đã đồng bộ.
        </div>
      </details>

      <TheNoiDung className="gv-directory">
        <div className="gv-filterbar flex items-center" style={{ gap: 'var(--k3)', marginBottom: 'var(--k3)' }}>
          <div className="relative flex-1">
            <Search size={18} className="absolute" style={{ left: 14, top: 15, color: 'var(--mo)' }} />
            <input
              style={O_NHAP}
              className="hs-o-tim"
              placeholder="Tìm tên, số báo danh hoặc lớp…"
              value={timKiem}
              onChange={(e) => setTimKiem(e.target.value)}
              inputMode="search"
              aria-label="Tìm học sinh"
            />
          </div>
          <button
            type="button"
            onClick={tai}
            disabled={dangTai}
            className="tap-target shrink-0 flex items-center justify-center shadow-2xs transition-[transform,background-color,box-shadow,opacity] active:scale-95 hover:scale-105 cursor-pointer disabled:cursor-not-allowed rounded-xl"
            style={{ width: 48, height: 48, border: '1px solid var(--vien)', background: 'var(--the)', color: 'var(--muc)' }}
            aria-label="Tải lại"
            title="Tải lại"
          >
            <RefreshCw size={18} className={dangTai ? 'animate-spin hs-bieu-tuong-nhan' : ''} />
          </button>
        </div>

        {/* BỘ LỌC KHỐI & TẤT CẢ CÁC LỚP */}
        <div className="space-y-2.5" style={{ marginBottom: 'var(--k3)' }}>
          {/* Lọc theo khối */}
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Lọc theo khối">
            <span className="hs-nhan-loc">Khối:</span>
            {[null, 10, 11, 12].map((k) => {
              const chon = khoiLoc === k
              return (
                <button
                  key={k ?? 'tat_ca'}
                  type="button"
                  onClick={() => setKhoiLoc(k)}
                  className={`tap-target hs-chip${chon ? ' hs-chip--chon' : ''}`}
                  style={{ ...SO }}
                >
                  {k === null ? 'Tất cả khối' : `Khối ${k}`}
                </button>
              )
            })}
          </div>

          {/* Lọc theo lớp (đồng bộ tất cả các lớp) */}
          {dsLop.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Lọc theo lớp">
              <span className="hs-nhan-loc">Lớp:</span>
              {['', ...dsLop].map((l) => {
                const chon = lopLoc === l
                return (
                  <button
                    key={l || '__tat_ca_lop'}
                    type="button"
                    onClick={() => setLopLoc(l)}
                    className={`tap-target hs-chip${chon ? ' hs-chip--chon' : ''}`}
                    style={{ ...SO }}
                  >
                    {l ? (lopThay.ds ? chuChipLop(lopThay.ds.find((x) => x.tenLop === l) ?? { tenLop: l, soEm: 0 }) : `Lớp ${l}`) : 'Tất cả các lớp'}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {loi && <OThongBao tone="do">{loi}</OThongBao>}
        {ds === null ? (
          <div style={{ ...NHAN_NHO, padding: 'var(--k4) 0' }}>Đang tải danh sách học sinh…</div>
        ) : dsLoc.length === 0 ? (
          <div className="flex flex-col" style={{ gap: 'var(--k3)' }}>
            <div style={{ ...NHAN_NHO, padding: 'var(--k2) 0' }}>
              {ds.length === 0 ? 'Chưa em nào có tên trong danh sách. Em vào thi một ca là tự có tên ở đây.' : 'Không có em nào khớp bộ lọc.'}
            </div>
          </div>
        ) : (
          <div className="gv-student-list" style={{ gap: 'var(--k2)' }}>
            {dsLoc.map((e) => {
              const khoi = khoiTuNamSinh(e.namSinh)
              return (
                <Hang key={e.sbd} className="flex-col" style={{ alignItems: 'stretch' }} data-sbd={e.sbd}>
                  <span className="flex items-start justify-between" style={{ gap: 'var(--k3)' }}>
                    <span className="flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => {
                          setTabBaoCaoMo('tong_quan')
                          moHoSo(e.sbd, 'tong-quan')
                        }}
                        className="tap-target font-bold inline-flex items-center text-left"
                        style={{
                          fontFamily: 'var(--sans)',
                          fontSize: 'var(--cx-2)',
                          color: 'var(--muc)',
                          gap: 4,
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          minHeight: 44,
                          textDecoration: 'underline',
                          textDecorationColor: 'var(--vien-dam)',
                          textUnderlineOffset: 3,
                        }}
                      >
                        {e.hoTen || `SBD ${e.sbd}`}
                        <ChevronRight size={14} style={{ color: 'var(--mo)', flexShrink: 0 }} />
                      </button>
                      <div className="hs-meta">
                        <span className="hs-sbd">
                          #{e.sbd}
                        </span>
                        {tenLopEm(e.sbd, e.lop) && (
                          <span className="hs-lop">
                            Lớp {tenLopEm(e.sbd, e.lop)}
                          </span>
                        )}
                        {khoi && (
                          <span className="hs-khoi">
                            Khối {khoi}
                          </span>
                        )}
                        <span>· <span style={SO}>{e.soCa}</span> ca</span>
                      </div>
                    </span>
                    <span className="shrink-0 font-bold" style={{ ...SO, fontSize: 'var(--cx-3)' }}>
                      {e.diemGanNhat === null ? '—' : e.diemGanNhat.toFixed(2).replace('.', ',')}
                    </span>
                  </span>
                  <span className="flex items-center flex-wrap" style={{ gap: 4, marginTop: 6 }}>
                    <Nhan tone={toneXepLoai(e.diemGanNhat)}>{e.diemGanNhat === null ? 'chưa có điểm' : classify(e.diemGanNhat)}</Nhan>
                    {!e.hoTen && <Nhan tone="cam">chưa có tên</Nhan>}
                    {e.trangThai === 'ngoai_danh_sach' && <Nhan tone="do">ngoài danh sách</Nhan>}
                    {e.soCa === 0 && <Nhan tone="xam">chưa thi ca nào</Nhan>}
                  </span>

                  {/* BA NÚT MỖI EM */}
                  <span className="gv-student-actions grid grid-cols-1 sm:grid-cols-3" style={{ gap: 'var(--k2)', marginTop: 'var(--k2)' }}>
                    {(
                      [
                        ['bao-cao', <FileText key="i" size={15} />, 'Báo cáo'],
                        ['lich-su', <History key="i" size={15} />, `${TEN_MUC_HO_SO['lich-su']} (${e.soCa})`],
                      ] as const
                    ).map(([muc, icon, chu]) => (
                      <button
                        key={muc}
                        type="button"
                        onClick={() => {
                          setTabBaoCaoMo(muc === 'bao-cao' ? 'tong_quan' : 'tien_bo')
                          moHoSo(e.sbd, muc)
                        }}
                        aria-label={`${TEN_MUC_HO_SO[muc]} của ${e.hoTen || `SBD ${e.sbd}`}`}
                        className={`tap-target hs-nut-hang ${muc === 'bao-cao' ? 'hs-nut-hang--bao-cao' : 'hs-nut-hang--tien-bo'}`}
                        style={{
                          minHeight: 44,
                          gap: 6,
                          fontFamily: 'var(--sans)',
                          fontSize: 'var(--cx-1)',
                        }}
                      >
                        {icon}
                        {chu}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={dangResetMk}
                      onClick={() => hoiDatLaiMatKhau(e.sbd, e.hoTen)}
                      aria-label={`Đặt lại mật khẩu của ${e.hoTen || `SBD ${e.sbd}`}`}
                      className="tap-target hs-nut-phu"
                      style={{ minHeight: 44, fontSize: 'var(--cx-1)' }}
                    >
                      <KeyRound size={15} /> {dangResetMk ? 'Đang đặt lại…' : 'Đặt lại mật khẩu'}
                    </button>
                  </span>
                </Hang>
              )
            })}
          </div>
        )}
      </TheNoiDung>
      {hopXacNhan}
    </div>
  )
}
