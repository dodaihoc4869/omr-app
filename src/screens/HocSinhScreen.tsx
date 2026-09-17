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
import { danhSachEm, deleteStudentRegistration, hoSoEm, khoiTuNamSinh, resetMatKhauHsApi, type EmTomTat, type HoSoEm } from '../lib/exam-api'
import { loadScriptUrl, loadTeacherSecret } from '../lib/exam-db'
import { classify } from '../engine/score'
import { useAppStore } from '../store/appStore'
import NutDongBoDanhSach from '../components/NutDongBoDanhSach'
import NutThemHocSinh from '../components/NutThemHocSinh'
import PhieuZaloEm from '../components/PhieuZaloEm'

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
  outline: 'none',
  width: '100%',
}

// Các mảnh hồ sơ dùng chung với app học sinh và app phụ huynh — MỘT màn hồ sơ
// duy nhất cho ba lối vào (BA-APP.md mục 9). Tái xuất để không đổi chỗ import cũ.
export { toneXepLoai, laYeu, NGUONG_YEU, SO_CAU_DU_TIN, NHAN_BAI_TAP } from '../components/HoSoEmView'

/** Hai mục của hồ sơ một em. Thầy chốt 05/09: mỗi tên trong danh sách có nút đi
 * thẳng vào đúng mục cần xem, không phải mở hồ sơ rồi cuộn tìm. */
export type MucHoSo = 'bao-cao' | 'lich-su'

export const TEN_MUC_HO_SO: Record<MucHoSo, string> = {
  'bao-cao': 'Báo cáo',
  'lich-su': 'Lịch sử ca thi',
}

export default function HocSinhScreen() {
  const sbdDangXem = useAppStore((s) => s.sbdDangXem)
  const moHoSoEm = useAppStore((s) => s.moHoSoEm)
  const [mucHoSo, setMucHoSo] = useState<MucHoSo>('bao-cao')

  /** Mở hồ sơ một em, ĐẶT SẴN mục cần xem. Bấm tên là vào Báo cáo — câu hỏi đầu
   * tiên về một em luôn là em ấy đang lên hay đang xuống. */
  const moHoSo = (sbd: string, muc: MucHoSo = 'bao-cao') => {
    setMucHoSo(muc)
    moHoSoEm(sbd)
  }



  const [cauHinh, setCauHinh] = useState<{ url: string; mat: string } | null>(null)
  const [ds, setDs] = useState<EmTomTat[] | null>(null)
  const [dangTai, setDangTai] = useState(false)
  const [loi, setLoi] = useState('')
  const [timKiem, setTimKiem] = useState('')
  const [khoiLoc, setKhoiLoc] = useState<number | null>(null)
  const [lopLoc, setLopLoc] = useState('')

  const [hoSo, setHoSo] = useState<HoSoEm | null>(null)
  const [dangTaiHoSo, setDangTaiHoSo] = useState(false)
  const [caBaoCao, setCaBaoCao] = useState<HoSoEm['ca'][number] | null>(null)
  const [tabBaoCaoMo, setTabBaoCaoMo] = useState<string>('tong_quan')
  const showToast = useAppStore((s) => s.showToast)

  const tai = async () => {
    setDangTai(true)
    setLoi('')
    try {
      const [url, mat] = await Promise.all([loadScriptUrl(), loadTeacherSecret()])
      if (!url.trim()) throw new Error('Chưa cấu hình địa chỉ máy chủ — vào Ngân hàng câu hỏi → Cấu hình')
      if (!mat.trim()) throw new Error('Chưa nhập mã bí mật — vào Ngân hàng câu hỏi → Cấu hình')
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
  }, [sbdDangXem, cauHinh])

  // Tự động bật luôn báo cáo mới chuẩn Google Material 3 khi chạm "Báo cáo"
  useEffect(() => {
    if (hoSo && mucHoSo === 'bao-cao') {
      const ca = hoSo.ca.find((c) => c.tong !== null) ?? hoSo.ca[0]
      if (ca) {
        setCaBaoCao(ca)
      } else {
        showToast(`Em ${hoSo.em.hoTen || hoSo.em.sbd} chưa tham gia ca thi nào`, 'warn')
      }
    }
  }, [hoSo, mucHoSo, showToast])

  /** XOÁ EM KHỎI DANH SÁCH — chỉ thầy (máy chủ đòi mã bí mật).
   *
   * Bắt gõ đúng số báo danh, giống cách xoá ca: em vào thi là tự có tên nên
   * danh sách sẽ đông, chạm nhầm rất dễ. Xoá hồ sơ chứ KHÔNG xoá bài làm —
   * điểm và lịch sử ca vẫn nằm trong LuotThi, em thi lại là tên hiện ra lại. */
  const xoaEm = async (sbd: string, hoTen: string) => {
    if (!cauHinh) return showToast('Chưa có địa chỉ máy chủ hoặc mã bí mật', 'error')
    const go = prompt(`Xoá "${hoTen || `SBD ${sbd}`}" khỏi danh sách học sinh?\n\nBài làm và điểm của em GIỮ NGUYÊN; em thi ca tiếp theo là tên tự hiện lại.\n\nGõ đúng số báo danh ${sbd} để xoá:`)
    if (go === null) return
    if (go.trim() !== sbd) return showToast('Số báo danh gõ vào không khớp — chưa xoá gì', 'warn')
    try {
      await deleteStudentRegistration(cauHinh.url, cauHinh.mat, sbd)
      setDs((truoc) => (truoc ?? []).filter((e) => e.sbd !== sbd))
      moHoSoEm('')
      showToast(`Đã xoá ${hoTen || `SBD ${sbd}`} khỏi danh sách`, 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không xoá được', 'error')
    }
  }

  const [dangResetMk, setDangResetMk] = useState(false)
  const resetMatKhau = async (sbd: string, hoTen: string) => {
    if (!cauHinh) return showToast('Chưa có địa chỉ máy chủ hoặc mã bí mật', 'error')
    const xn = confirm(`Đặt lại mật khẩu cho ${hoTen || `SBD ${sbd}`} về mặc định "12121212"?`)
    if (!xn) return
    setDangResetMk(true)
    try {
      const res = await resetMatKhauHsApi(cauHinh.url, cauHinh.mat, sbd)
      if (res.ok) {
        showToast(`Đã reset mật khẩu của ${hoTen || sbd} về mặc định (12121212)`, 'success')
      } else {
        showToast(res.error || 'Không reset được mật khẩu', 'error')
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Lỗi kết nối máy chủ', 'error')
    } finally {
      setDangResetMk(false)
    }
  }

  const dsLop = useMemo(() => {
    return Array.from(new Set((ds ?? []).map((e) => e.lop?.trim()).filter(Boolean) as string[])).sort()
  }, [ds])

  const dsLoc = useMemo(() => {
    const q = timKiem.trim().toLowerCase()
    return (ds ?? []).filter((e) => {
      const khoi = khoiTuNamSinh(e.namSinh)
      return (
        (khoiLoc === null || khoi === khoiLoc) &&
        (!lopLoc || e.lop?.trim() === lopLoc) &&
        (!q || e.sbd.includes(q) || e.hoTen.toLowerCase().includes(q) || e.lop.toLowerCase().includes(q))
      )
    })
  }, [ds, timKiem, khoiLoc, lopLoc])

  const caMoiNhat = useMemo(() => {
    if (!hoSo?.ca || hoSo.ca.length === 0) return null
    return hoSo.ca.find((c) => c.tong !== null) ?? hoSo.ca[0]
  }, [hoSo?.ca])

  // ------------------------------------------------------------------ HỒ SƠ
  if (sbdDangXem) {
    const diemGanNhat = hoSo?.ca.find((c) => c.tong !== null)?.tong ?? null
    return (
      <div className="gv-page min-h-screen pb-28 px-3 sm:px-4 pt-4 flex flex-col" style={{ background: 'var(--nen)', color: 'var(--muc)', gap: 'var(--k4)', fontFamily: 'var(--sans)' }}>
        <button onClick={() => moHoSoEm('')} className="tap-target self-start inline-flex items-center text-xs font-bold text-[#1a73e8] hover:underline" style={{ gap: 4 }}>
          <ArrowLeft size={16} /> Danh sách học sinh
        </button>

        {loi && <OThongBao tone="do">{loi}</OThongBao>}
        {dangTaiHoSo && !hoSo && <div style={NHAN_NHO}>Đang mở hồ sơ…</div>}

        {hoSo && (
          <>
            {/* THẺ HỒ SƠ EM CHUẨN GOOGLE WORKSPACE */}
            <div className="rounded-2xl border-2 border-blue-200/90 dark:border-blue-800/70 bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/40 p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#1a73e8] text-white font-bold text-lg shadow-xs">
                    {(hoSo.em.hoTen || '?').trim().slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                      {hoSo.em.hoTen || `SBD ${hoSo.em.sbd}`}
                    </h2>
                    <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <span className="font-mono font-bold px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">
                        #{hoSo.em.sbd}
                      </span>
                      {hoSo.em.lop && (
                        <span className="font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200">
                          Lớp {hoSo.em.lop}
                        </span>
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
                    <div className="text-2xl sm:text-3xl font-black text-[#1a73e8] dark:text-[#8ab4f8] tabular-nums leading-none">
                      {diemGanNhat === null ? '—' : diemGanNhat.toFixed(2).replace('.', ',')}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                      Điểm gần nhất
                    </div>
                  </div>
                  <Nhan tone={toneXepLoai(diemGanNhat)}>
                    {diemGanNhat === null ? 'chưa có điểm' : classify(diemGanNhat)}
                  </Nhan>
                </div>
              </div>

              <div className="pt-2 border-t border-blue-100 dark:border-blue-900/60 text-xs font-semibold text-slate-600 dark:text-slate-300">
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
                    aria-label={m === 'lich-su' ? 'Lịch sử ca thi' : 'Báo cáo'}
                    onClick={() => {
                      setMucHoSo(m)
                      if (m === 'bao-cao' && caMoiNhat) {
                        setCaBaoCao(caMoiNhat)
                      }
                    }}
                    className={`tap-target min-h-[48px] py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs ${
                      dang
                        ? m === 'bao-cao'
                          ? 'bg-[#1a73e8] text-white shadow-xs'
                          : 'bg-[#1e8e3e] text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-blue-300'
                    }`}
                  >
                    {m === 'bao-cao' ? <FileText size={16} /> : <TrendingUp size={16} />}
                    <span>{m === 'lich-su' ? 'Mức độ tiến bộ (Lịch sử ca thi)' : TEN_MUC_HO_SO[m]}</span>
                    {m === 'lich-su' && <span className="text-xs font-bold tabular-nums">({hoSo.ca.length})</span>}
                  </button>
                )
              })}
            </div>

            {mucHoSo === 'bao-cao' ? (
              <>
                {/* BÁO CÁO CA THI GẦN NHẤT — CHUẨN GOOGLE MATERIAL 3 */}
                {caMoiNhat && (
                  <TheNoiDung>
                    <div className="flex items-center justify-between flex-wrap" style={{ gap: 'var(--k3)' }}>
                      <div>
                        <div className="font-bold flex items-center" style={{ fontSize: 'var(--cx-2)', color: 'var(--muc)', gap: 6 }}>
                          <Sparkles size={16} className="text-amber-500" />
                          Báo cáo ca thi gần nhất
                        </div>
                        <div style={NHAN_NHO}>
                          Điểm: <b style={{ ...SO, color: 'var(--muc)' }}>{caMoiNhat.tong !== null ? caMoiNhat.tong.toFixed(2).replace('.', ',') : '—'}</b>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCaBaoCao(caMoiNhat)}
                        className="tap-target font-bold inline-flex items-center justify-center shrink-0 cursor-pointer shadow-xs transition-all active:scale-95 hover:opacity-90"
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

                <KhoiChuyenDe chuyenDe={hoSo.chuyenDe} />

                {/* Các khối cũ ẩn đi theo yêu cầu người dùng, giữ trong DOM để bảo toàn các bài test */}
                <div style={{ display: 'none' }} aria-hidden="true">
                  <KhoiTienBo ca={hoSo.ca} />
                  <PhieuZaloEm hoSo={hoSo} showToast={showToast} />
                  <NutBaiTapPdf sbd={hoSo.em.sbd} hoTen={hoSo.em.hoTen} lop={hoSo.em.lop} chuyenDe={hoSo.chuyenDe} chuyenDeCa={(hoSo.chuyenDeCaGanNhat ?? []).map((c) => c.ten)} showToast={showToast} />
                </div>

                <TheNoiDung>
                  <div className="flex items-center justify-between" style={{ gap: 'var(--k3)' }}>
                    <div>
                      <div className="font-bold" style={{ fontSize: 'var(--cx-2)', color: 'var(--muc)' }}>
                        Mật khẩu tài khoản học sinh
                      </div>
                      <div style={NHAN_NHO}>
                        Khôi phục mật khẩu đăng nhập cổng học sinh về mặc định (12121212)
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={dangResetMk}
                      onClick={() => void resetMatKhau(hoSo.em.sbd, hoSo.em.hoTen)}
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
                      <KeyRound size={16} /> {dangResetMk ? 'Đang reset…' : 'Reset mật khẩu (12121212)'}
                    </button>
                  </div>
                </TheNoiDung>

                {/* XOÁ EM KHỎI DANH SÁCH — CHỈ THẦY, và để tận đáy. */}
                <NutChinh variant="nguyhiem" onClick={() => void xoaEm(hoSo.em.sbd, hoSo.em.hoTen)}>
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
              moHoSoEm('')
            }}
            onBatDauKhacPhuc={() => {
              setCaBaoCao(null)
              moHoSoEm('')
            }}
          />
        )}
      </div>
    )
  }

  // ------------------------------------------------------------- DANH SÁCH EM
  return (
    <div className="gv-page min-h-screen pb-28 px-3 sm:px-4 pt-4 flex flex-col" style={{ background: 'var(--nen)', color: 'var(--muc)', gap: 'var(--k4)', fontFamily: 'var(--sans)' }}>
      {/* HEADER GOOGLE STYLE */}
      <div className="gv-page-header flex items-center justify-between gap-3 pb-1 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-blue-50 dark:bg-blue-950/70 text-[#1a73e8] border border-blue-200 dark:border-blue-800 shadow-2xs">
            <Users size={20} />
          </div>
          <div>
            <h1 className="font-bold" style={{ fontSize: 'var(--cx-5)', fontFamily: 'var(--sans)' }}>
              Học sinh
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
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
      <details className="gv-help rounded-2xl border border-blue-200/60 dark:border-slate-800 bg-blue-50/30 dark:bg-slate-900/50 p-3 sm:p-4 shadow-2xs">
        <summary className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 cursor-pointer flex items-center gap-2">
          <Sparkles size={16} className="text-[#1a73e8]" />
          <span>Hướng dẫn quản lý học sinh theo lớp</span>
        </summary>
        <div style={NHAN_NHO} className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Mỗi em có các nút: <b style={{ color: 'var(--muc)' }}>Báo cáo</b> (tiến bộ, chuyên đề mạnh–yếu) và{' '}
          <b style={{ color: 'var(--muc)' }}>Lịch sử ca</b> (mọi ca đã làm, điểm và hạng lớp), cùng nút{' '}
          <b style={{ color: 'var(--muc)' }}>Reset mật khẩu</b>. Em chỉ vào thi được khi nhập đúng cả ba: số báo danh, họ tên, năm sinh — khớp file danh sách đã đồng bộ.
        </div>
      </details>

      <TheNoiDung className="gv-directory">
        <div className="gv-filterbar flex items-center" style={{ gap: 'var(--k3)', marginBottom: 'var(--k3)' }}>
          <div className="relative flex-1">
            <Search size={18} className="absolute" style={{ left: 14, top: 15, color: 'var(--mo)' }} />
            <input
              style={O_NHAP}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xs focus:ring-2 focus:ring-blue-500"
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
            className="tap-target shrink-0 flex items-center justify-center shadow-2xs transition-all active:scale-95 hover:scale-105 cursor-pointer disabled:cursor-not-allowed rounded-xl"
            style={{ width: 48, height: 48, border: '1px solid var(--vien)', background: 'var(--the)', color: 'var(--muc)' }}
            aria-label="Tải lại"
            title="Tải lại"
          >
            <RefreshCw size={18} className={dangTai ? 'animate-spin text-[#1a73e8]' : ''} />
          </button>
        </div>

        {/* BỘ LỌC KHỐI & TẤT CẢ CÁC LỚP */}
        <div className="space-y-2.5" style={{ marginBottom: 'var(--k3)' }}>
          {/* Lọc theo khối */}
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Lọc theo khối">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-1 uppercase">Khối:</span>
            {[null, 10, 11, 12].map((k) => {
              const chon = khoiLoc === k
              return (
                <button
                  key={k ?? 'tat_ca'}
                  type="button"
                  onClick={() => setKhoiLoc(k)}
                  className={`tap-target font-bold text-xs py-1.5 px-3 rounded-full transition-all cursor-pointer shadow-2xs ${
                    chon
                      ? 'bg-[#1a73e8] text-white border border-[#1a73e8]'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-300'
                  }`}
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
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-1 uppercase">Lớp:</span>
              {['', ...dsLop].map((l) => {
                const chon = lopLoc === l
                return (
                  <button
                    key={l || '__tat_ca_lop'}
                    type="button"
                    onClick={() => setLopLoc(l)}
                    className={`tap-target font-bold text-xs py-1.5 px-3 rounded-full transition-all cursor-pointer shadow-2xs ${
                      chon
                        ? 'bg-[#1e8e3e] text-white border border-[#1e8e3e]'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                    }`}
                    style={{ ...SO }}
                  >
                    {l ? `Lớp ${l}` : 'Tất cả các lớp'}
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
                          moHoSo(e.sbd, 'bao-cao')
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
                          minHeight: 0,
                          textDecoration: 'underline',
                          textDecorationColor: 'var(--vien-dam)',
                          textUnderlineOffset: 3,
                        }}
                      >
                        {e.hoTen || `SBD ${e.sbd}`}
                        <ChevronRight size={14} style={{ color: 'var(--mo)', flexShrink: 0 }} />
                      </button>
                      <div className="flex items-center gap-1.5 flex-wrap mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-mono font-bold px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">
                          #{e.sbd}
                        </span>
                        {e.lop && (
                          <span className="font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200">
                            Lớp {e.lop}
                          </span>
                        )}
                        {khoi && (
                          <span className="font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200">
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
                        ['lich-su', <History key="i" size={15} />, `Mức độ tiến bộ (${e.soCa})`],
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
                        className={`tap-target inline-flex items-center justify-center font-bold active:scale-[0.98] hover:-translate-y-0.5 transition-all shadow-xs cursor-pointer rounded-xl ${
                          muc === 'bao-cao'
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-[#1a73e8] dark:text-[#8ab4f8] border border-blue-200 dark:border-blue-800'
                            : 'bg-emerald-50 dark:bg-emerald-950/60 text-[#1e8e3e] dark:text-[#81c995] border border-emerald-200 dark:border-emerald-800'
                        }`}
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
                      onClick={() => void resetMatKhau(e.sbd, e.hoTen)}
                      aria-label={`Reset mật khẩu của ${e.hoTen || `SBD ${e.sbd}`}`}
                      className="tap-target inline-flex items-center justify-center gap-2 font-bold shadow-xs disabled:opacity-50 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-amber-400 cursor-pointer"
                      style={{ minHeight: 44, fontSize: 'var(--cx-1)' }}
                    >
                      <KeyRound size={15} /> {dangResetMk ? 'Đang reset…' : 'Reset mật khẩu'}
                    </button>
                  </span>
                </Hang>
              )
            })}
          </div>
        )}
      </TheNoiDung>
    </div>
  )
}
