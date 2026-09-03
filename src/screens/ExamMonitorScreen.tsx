// CHI TIẾT MỘT CA THI (QUANLYCATHI.md mục 2 + 5, nền cho mục 6): đi từ Lịch
// sử ca thi hoặc ngay sau khi mở ca. Dữ liệu lượt thi từ Google Sheet
// (chiTietCa); ĐIỂM chấm tại máy thầy bằng ngân hàng CÓ đáp án đã lưu khi mở
// ca (đáp án không rời máy thầy) rồi tự ghi điểm + chi tiết từng câu lên
// Sheet (ghiDiem) để phân tích về sau. Mỗi em một <Hang> kèm <Nhan>:
// xám chờ thi lại · tím đang làm · cam rời màn N lần · đỏ bị khoá · xanh đã nộp.
// Xoá ca = xoá mềm, phải gõ đúng mã ca.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Copy, Check, RefreshCw, Trash2 } from 'lucide-react'
import { Hang, Nhan, OThongBao, NutChinh, TheNoiDung } from '../components/DesignSystem'
import { classify, type AnswerKey, type ScoreResult, type StudentAnswers } from '../engine/score'
import { chiTietCa, duyetThiLai, ghiDiem, moKhoa, sendTeacherMessage, xoaCa, type ChiTietCa, type LuotThiRow, type PhamViCa, type CongBoDiem, khoiTuNamSinh } from '../lib/exam-api'
import { taoBaiGhiDiem } from '../lib/chi-tiet-cau'
import { loadScriptUrl, loadSessionTeacherBank, loadTeacherSecret } from '../lib/exam-db'
import { gradeSubmissionFull, type GradedSubmission } from '../lib/exam-grade'
import { gioMayChu } from '../lib/gio-may-chu'
import { soanTinRoiMan } from '../lib/phieu-zalo'
import { buildStudentEntry, downloadDuLieuJson } from '../lib/json-export'
import { downloadBangDiem, type StudentRow } from '../lib/xlsx-export'
import { mergeKeepAnswers, type TeacherExamSource } from '../data/examContent'
import { useAppStore } from '../store/appStore'
import { trangThaiCa } from './LichSuCaScreen'

const SO: React.CSSProperties = { fontFamily: 'var(--sans)', fontVariantNumeric: 'tabular-nums' }
const NHAN_NHO: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }
const TIEU_DE_MUC: React.CSSProperties = { fontFamily: 'var(--serif)', fontSize: 'var(--cx-3)', fontWeight: 700, color: 'var(--muc)' }
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

const TEN_CONG_BO: Record<CongBoDiem, string> = { khong: 'Không công bố trên máy em', ngay: 'Xem điểm ngay khi nộp', ca_lop_xong: 'Xem điểm khi cả lớp xong' }
const TEN_PHAM_VI: Record<PhamViCa, string> = { tu_do: 'Tự do', khoi: 'Theo khối', chon: 'Chọn từng em' }

function gio(iso: string): string {
  const d = new Date(iso)
  return Number.isFinite(d.getTime()) ? d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''
}
function ngayGio(iso: string): string {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return ''
  return `${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} ${gio(iso)}`
}

interface HangEm {
  sbd: string
  hoTen: string
  lop: string
  sdt: string
  moiNhat: LuotThiRow
  cacLuotCu: LuotThiRow[]
  graded: GradedSubmission | null
  /** Điểm hiện ra: chấm tại máy (ưu tiên) hoặc điểm đã ghi trên Sheet. */
  diem: number | null
}

/** Nhãn trạng thái cho 1 em (màu theo QUANLYCATHI mục 6). */
export function nhanCuaLuot(l: Pick<LuotThiRow, 'trangThai' | 'soLanRoiMan'>): { ten: string; tone: 'xanh' | 'cam' | 'do' | 'tim' | 'xam' } {
  if (l.trangThai === 'khoa') return { ten: 'Bị khoá', tone: 'do' }
  if (l.trangThai === 'duoc_duyet_lai') return { ten: 'Chờ thi lại', tone: 'xam' }
  if (l.trangThai === 'dang_lam') return l.soLanRoiMan > 0 ? { ten: `Rời màn ${l.soLanRoiMan} lần`, tone: 'cam' } : { ten: 'Đang làm', tone: 'tim' }
  return { ten: 'Đã nộp', tone: 'xanh' }
}

export default function ExamMonitorScreen() {
  const showToast = useAppStore((s) => s.showToast)
  const setScreen = useAppStore((s) => s.setScreen)
  const classList = useAppStore((s) => s.classList)
  const maCaTheoDoi = useAppStore((s) => s.maCaTheoDoi)

  const [scriptUrl, setScriptUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [maCa, setMaCa] = useState(maCaTheoDoi)
  const [dangTai, setDangTai] = useState(false)
  const [loi, setLoi] = useState('')
  const [chiTiet, setChiTiet] = useState<ChiTietCa | null>(null)
  const [teacherBank, setTeacherBank] = useState<TeacherExamSource[] | null>(null)
  const [daCopy, setDaCopy] = useState(false)
  const [xacNhanSbd, setXacNhanSbd] = useState<string | null>(null)
  const [dangDuyet, setDangDuyet] = useState<string | null>(null)
  const [hoiXoa, setHoiXoa] = useState(false)
  const [maXoa, setMaXoa] = useState('')
  // BÁO PHỤ HUYNH việc rời màn (BA-APP mục 4D): tin soạn sẵn, THẦY sửa rồi mới
  // gửi — máy không tự gửi vì một cuộc gọi đến cũng cho đúng tín hiệu này.
  const [tinBao, setTinBao] = useState<{ sbd: string; noiDung: string } | null>(null)
  const [dangGuiBao, setDangGuiBao] = useState(false)
  const [dangXoa, setDangXoa] = useState(false)
  // Đã ghi điểm lên Sheet cho lượt nào (khoá `${sbd}:${lanThu}:${nopLuc}`) — không ghi lặp mỗi lần tải lại.
  const daGhiRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    loadScriptUrl().then(setScriptUrl)
    loadTeacherSecret().then(setSecret)
  }, [])

  const tai = async (ma: string, imLang = false) => {
    const url = (scriptUrl || (await loadScriptUrl())).trim()
    const mat = (secret || (await loadTeacherSecret())).trim()
    if (!url) return setLoi('Chưa cấu hình link Apps Script — vào Ngân hàng câu hỏi → Cấu hình')
    if (!mat) return setLoi('Chưa nhập mã bí mật — vào Ngân hàng câu hỏi → Cấu hình')
    if (!ma.trim()) return setLoi('Nhập mã ca')
    if (!imLang) setDangTai(true)
    setLoi('')
    try {
      const [ct, bank] = await Promise.all([chiTietCa(url, mat, ma.trim()), loadSessionTeacherBank(ma.trim())])
      setChiTiet(ct)
      setTeacherBank(bank ?? null)
    } catch (e) {
      setLoi(`Không tải được ca: ${e instanceof Error ? e.message : 'lỗi không rõ'}`)
    } finally {
      setDangTai(false)
    }
  }

  useEffect(() => {
    if (maCaTheoDoi) tai(maCaTheoDoi)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maCaTheoDoi])

  // Gom theo SBD: lượt mới nhất + các lượt cũ; chấm tại máy nếu có ngân hàng.
  const dsEm: HangEm[] = useMemo(() => {
    if (!chiTiet) return []
    const theoSbd = new Map<string, LuotThiRow[]>()
    for (const l of chiTiet.luot) {
      const arr = theoSbd.get(l.sbd) ?? []
      arr.push(l)
      theoSbd.set(l.sbd, arr)
    }
    const out: HangEm[] = []
    theoSbd.forEach((arr, sbd) => {
      arr.sort((a, b) => b.lanThu - a.lanThu)
      const moiNhat = arr[0]
      const hs = classList.find((c) => c.sbd === sbd)
      let graded: GradedSubmission | null = null
      if (teacherBank && moiNhat.dapAn && (moiNhat.trangThai === 'da_nop' || moiNhat.trangThai === 'khoa')) {
        try {
          graded = gradeSubmissionFull(teacherBank, chiTiet.ca.maCa, sbd, moiNhat.dapAn)
        } catch {
          graded = null
        }
      }
      out.push({
        sbd,
        hoTen: hs?.hoTen ?? moiNhat.hoTen ?? '',
        lop: hs?.lop ?? '',
        sdt: hs?.sdt ?? '',
        moiNhat,
        cacLuotCu: arr.slice(1),
        graded,
        diem: graded ? graded.score.total : moiNhat.tong,
      })
    })
    // Đã nộp/khoá lên trước theo giờ nộp mới nhất, rồi đang làm, rồi chờ thi lại.
    const thuTu = (l: LuotThiRow) => (l.trangThai === 'dang_lam' ? 1 : l.trangThai === 'duoc_duyet_lai' ? 2 : 0)
    out.sort((a, b) => thuTu(a.moiNhat) - thuTu(b.moiNhat) || (a.hoTen || a.sbd).localeCompare(b.hoTen || b.sbd, 'vi'))
    return out
  }, [chiTiet, teacherBank, classList])

  // Tự ghi điểm + chi tiết từng câu (mục 5) cho lượt vừa chấm được mà chưa ghi.
  useEffect(() => {
    if (!chiTiet || !teacherBank) return
    const bank = mergeKeepAnswers(teacherBank)
    const can = dsEm.filter((e) => e.graded && !daGhiRef.current.has(`${e.sbd}:${e.moiNhat.lanThu}:${e.moiNhat.nopLuc}`))
    if (can.length === 0) return
    const bai = can.map((e) => taoBaiGhiDiem(bank, chiTiet.ca.maCa, e.sbd, e.moiNhat.lanThu, e.moiNhat.dapAn!, e.graded!, e.moiNhat.giayCau))
    let huy = false
    ghiDiem(scriptUrl.trim(), secret.trim(), chiTiet.ca.maCa, bai)
      .then((kq) => {
        if (huy) return
        for (const e of can) if (kq.daGhi.includes(e.sbd)) daGhiRef.current.add(`${e.sbd}:${e.moiNhat.lanThu}:${e.moiNhat.nopLuc}`)
        if (kq.tuChoi.length > 0) showToast(`Không ghi được điểm ${kq.tuChoi.length} em lên Sheet`, 'error')
      })
      .catch(() => {
        // mất mạng — lần tải sau ghi lại
      })
    return () => {
      huy = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dsEm])

  // Ca đang mở và còn em đang làm → tự tải lại mỗi 20 giây (theo dõi gần thời gian thực).
  useEffect(() => {
    if (!chiTiet) return
    const conDangLam = chiTiet.luot.some((l) => l.trangThai === 'dang_lam')
    if (!conDangLam) return
    const id = setInterval(() => {
      if (!document.hidden) tai(chiTiet.ca.maCa, true)
    }, 20000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chiTiet])

  const handleChoThiLai = async (sbd: string) => {
    if (!chiTiet) return
    setXacNhanSbd(null)
    setDangDuyet(sbd)
    try {
      const lan = await duyetThiLai(scriptUrl.trim(), secret.trim(), chiTiet.ca.maCa, sbd)
      showToast(`Đã duyệt — em vào lại link là làm lần ${lan}`, 'success')
      await tai(chiTiet.ca.maCa, true)
    } catch (e) {
      showToast(`Không duyệt được: ${e instanceof Error ? e.message : 'lỗi không rõ'}`, 'error')
    } finally {
      setDangDuyet(null)
    }
  }

  // Mở khoá (mục 6): lượt về dang_lam, em mở lại link trên cùng máy là làm tiếp.
  const [xacNhanMoKhoa, setXacNhanMoKhoa] = useState<string | null>(null)
  const handleMoKhoa = async (sbd: string) => {
    if (!chiTiet) return
    setXacNhanMoKhoa(null)
    setDangDuyet(sbd)
    try {
      await moKhoa(scriptUrl.trim(), secret.trim(), chiTiet.ca.maCa, sbd)
      showToast('Đã mở khoá — em mở lại link trên đúng máy đang làm để tiếp tục', 'success')
      await tai(chiTiet.ca.maCa, true)
    } catch (e) {
      showToast(`Không mở khoá được: ${e instanceof Error ? e.message : 'lỗi không rõ'}`, 'error')
    } finally {
      setDangDuyet(null)
    }
  }

  const handleXoa = async () => {
    if (!chiTiet) return
    setDangXoa(true)
    try {
      await xoaCa(scriptUrl.trim(), secret.trim(), chiTiet.ca.maCa, maXoa.trim())
      showToast(`Đã xoá ca ${chiTiet.ca.maCa}`, 'success')
      setHoiXoa(false)
      setScreen('lichsuca')
    } catch (e) {
      showToast(`Không xoá được: ${e instanceof Error ? e.message : 'lỗi không rõ'}`, 'error')
    } finally {
      setDangXoa(false)
    }
  }

  const moBaoPhuHuynh = (sbd: string, hoTen: string, l: LuotThiRow) => {
    setTinBao({
      sbd,
      noiDung: soanTinRoiMan({
        hoTen: hoTen || `SBD ${sbd}`,
        maCa: chiTiet?.ca.maCa ?? '',
        tenCa: chiTiet?.ca.tenCa || '',
        ngay: l.nopLuc || l.vaoLuc || new Date().toISOString(),
        soLan: l.soLanRoiMan || 0,
        tongGiay: l.tongGiayRoiMan || 0,
        daKhoa: l.trangThai === 'khoa',
      }),
    })
  }

  const guiBaoPhuHuynh = async () => {
    if (!tinBao || !tinBao.noiDung.trim()) return
    setDangGuiBao(true)
    try {
      await sendTeacherMessage(scriptUrl.trim(), secret.trim(), tinBao.sbd, tinBao.noiDung.trim())
      showToast('Đã gửi vào hộp thư của em — phụ huynh thấy khi mở app', 'success')
      setTinBao(null)
    } catch (e) {
      showToast(`Không gửi được: ${e instanceof Error ? e.message : 'lỗi không rõ'}`, 'error')
    } finally {
      setDangGuiBao(false)
    }
  }

  const copyLink = () => {
    if (!chiTiet) return
    const link = `${location.origin}${import.meta.env.BASE_URL}t/${chiTiet.ca.maCa}`
    navigator.clipboard.writeText(link).then(() => {
      setDaCopy(true)
      showToast('Đã copy link mời vào thi', 'success')
    })
  }

  const daCham = dsEm.filter((e) => e.graded)
  const handleExportXlsx = () => {
    const rows: StudentRow[] = daCham.map((e, i) => ({ stt: i + 1, sbd: e.sbd, hoTen: e.hoTen, lop: e.lop || chiTiet?.ca.lop || '', madeThi: chiTiet?.ca.maCa ?? '', sdtPhuHuynh: e.sdt, score: e.graded!.score as ScoreResult }))
    downloadBangDiem(rows, `BangDiem_kiemtra_${chiTiet?.ca.maCa}.xlsx`)
  }
  const handleExportJson = () => {
    const entries = daCham.map((e) => buildStudentEntry(e.hoTen, e.lop || chiTiet?.ca.lop || '', e.sdt, e.graded!.studentAnswers as StudentAnswers, e.graded!.key as AnswerKey))
    downloadDuLieuJson(entries, `dulieu_kiemtra_${chiTiet?.ca.maCa}.json`)
  }

  const now = gioMayChu()
  const tk = chiTiet
    ? {
        daVao: dsEm.filter((e) => e.moiNhat.trangThai !== 'duoc_duyet_lai').length,
        daNop: dsEm.filter((e) => e.moiNhat.trangThai === 'da_nop' || e.moiNhat.trangThai === 'khoa').length,
        canhBao: dsEm.filter((e) => e.moiNhat.trangThai === 'khoa' || e.moiNhat.soLanRoiMan > 0).length,
      }
    : null
  const tt = chiTiet && tk ? trangThaiCa({ ...chiTiet.ca, ...tk }, now) : null

  return (
    <div className="min-h-screen pb-28 px-3 sm:px-4 pt-4 flex flex-col" style={{ background: 'var(--nen)', color: 'var(--muc)', gap: 'var(--k4)', fontFamily: 'var(--sans)' }}>
      <div className="flex items-center justify-between">
        <h1 className="font-bold" style={{ fontSize: 'var(--cx-5)', fontFamily: 'var(--serif)' }}>
          {chiTiet ? chiTiet.ca.tenCa || `Ca ${chiTiet.ca.maCa}` : 'Chi tiết ca thi'}
        </h1>
        <button onClick={() => setScreen('lichsuca')} style={NHAN_NHO} className="tap-target">
          ← Lịch sử
        </button>
      </div>

      {!chiTiet && (
        <TheNoiDung>
          <div style={{ ...TIEU_DE_MUC, marginBottom: 'var(--k3)' }}>Nhập mã ca</div>
          <div className="flex items-center" style={{ gap: 'var(--k3)' }}>
            <input style={{ ...O_NHAP, ...SO }} placeholder="Mã ca (6 số)" value={maCa} onChange={(e) => setMaCa(e.target.value)} inputMode="numeric" onKeyDown={(e) => e.key === 'Enter' && tai(maCa)} />
            <button type="button" onClick={() => tai(maCa)} disabled={dangTai} className="tap-target shrink-0 font-bold" style={{ height: 52, padding: '0 var(--k5)', borderRadius: 'var(--bo-1)', background: 'var(--muc)', color: 'var(--muc-nguoc)' }}>
              {dangTai ? '…' : 'Tải'}
            </button>
          </div>
          {loi && (
            <div style={{ marginTop: 'var(--k3)' }}>
              <OThongBao tone="do">{loi}</OThongBao>
            </div>
          )}
        </TheNoiDung>
      )}

      {chiTiet && tk && tt && (
        <>
          {/* THÔNG TIN CA */}
          <TheNoiDung>
            <div className="flex items-start justify-between" style={{ gap: 'var(--k3)' }}>
              <div className="min-w-0">
                <div className="font-bold" style={{ ...SO, fontSize: 'var(--cx-5)', letterSpacing: '.12em' }}>
                  {chiTiet.ca.maCa}
                </div>
                <div style={NHAN_NHO}>
                  {chiTiet.ca.lop ? `Lớp ${chiTiet.ca.lop} · ` : ''}
                  {chiTiet.ca.thoiGianPhut} phút · bắt đầu <span style={SO}>{ngayGio(chiTiet.ca.batDau || chiTiet.ca.moLuc)}</span> · vào phòng đến <span style={SO}>{chiTiet.ca.hetHanVao ? gio(chiTiet.ca.hetHanVao) : 'không giới hạn'}</span>
                </div>
                <div style={NHAN_NHO}>
                  Khoá khi rời màn {chiTiet.ca.nguongLan ?? 3} lần / quá {chiTiet.ca.nguongGiay ?? 30} giây
                </div>
                <div style={NHAN_NHO}>
                  {TEN_CONG_BO[chiTiet.ca.congBo]} · {TEN_PHAM_VI[chiTiet.ca.phamVi]}
                  {chiTiet.ca.phamVi === 'khoi' ? ` (sinh ${chiTiet.ca.danhSachMoi} → khối ${khoiTuNamSinh(String(chiTiet.ca.danhSachMoi)) ?? '?'})` : ''}
                  {chiTiet.ca.phamVi === 'chon' && Array.isArray(chiTiet.ca.danhSachMoi) ? ` (${chiTiet.ca.danhSachMoi.length} em)` : ''}
                </div>
              </div>
              <div className="shrink-0 flex flex-col items-end" style={{ gap: 'var(--k2)' }}>
                <Nhan tone={tt.tone}>{tt.ten}</Nhan>
                <button type="button" onClick={() => tai(chiTiet.ca.maCa)} disabled={dangTai} className="tap-target flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 'var(--bo-1)', background: 'var(--the-2)', color: 'var(--muc)' }} aria-label="Tải lại" title="Tải lại">
                  <RefreshCw size={16} className={dangTai ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3" style={{ gap: 'var(--k2)', marginTop: 'var(--k4)' }}>
              {(
                [
                  ['Đã vào', tk.daVao, 'var(--muc)'],
                  ['Đã nộp', tk.daNop, 'var(--xanh)'],
                  ['Cảnh báo', tk.canhBao, tk.canhBao > 0 ? 'var(--cam)' : 'var(--nhat)'],
                ] as const
              ).map(([ten, so, mau]) => (
                <div key={ten} className="text-center" style={{ background: 'var(--the-2)', borderRadius: 'var(--bo-1)', padding: 'var(--k3) var(--k2)' }}>
                  <div className="font-bold" style={{ ...SO, fontSize: 'var(--cx-5)', color: mau }}>
                    {so}
                  </div>
                  <div style={NHAN_NHO}>{ten}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 'var(--k3)' }}>
              <NutChinh variant="phu" onClick={copyLink}>
                <span className="inline-flex items-center gap-2">
                  {daCopy ? <Check size={18} /> : <Copy size={18} />} {daCopy ? 'Đã copy link mời' : 'Copy link mời vào thi'}
                </span>
              </NutChinh>
            </div>
          </TheNoiDung>

          {loi && <OThongBao tone="do">{loi}</OThongBao>}
          {!teacherBank && dsEm.some((e) => e.moiNhat.dapAn) && (
            <OThongBao tone="cam">
              Máy này không có ngân hàng CÓ đáp án của ca — chỉ máy đã mở ca mới chấm được (đáp án không rời máy thầy). Điểm hiện ra (nếu có) là điểm đã ghi trên Sheet.
            </OThongBao>
          )}

          {/* DANH SÁCH EM */}
          <TheNoiDung>
            <div style={{ ...TIEU_DE_MUC, marginBottom: 'var(--k3)' }}>Học sinh trong ca ({dsEm.length})</div>
            {dsEm.length === 0 ? (
              <div style={NHAN_NHO}>Chưa có em nào vào thi.</div>
            ) : (
              <div className="flex flex-col" style={{ gap: 'var(--k2)' }}>
                {dsEm.map((e) => {
                  const l = e.moiNhat
                  const nh = nhanCuaLuot(l)
                  const daNop = l.trangThai === 'da_nop' || l.trangThai === 'khoa'
                  return (
                    <Hang key={e.sbd} data-trang-thai={nh.ten} style={{ alignItems: 'flex-start' }}>
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center flex-wrap" style={{ gap: 6 }}>
                          <span className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-2)' }}>
                            {e.hoTen || '(chưa có tên)'}
                          </span>
                          {l.lanThu > 1 && <Nhan tone="tim">lần {l.lanThu}</Nhan>}
                        </span>
                        <span style={NHAN_NHO}>
                          SBD <span style={SO}>{e.sbd}</span>
                          {daNop && l.nopLuc ? ` · nộp ${gio(l.nopLuc)}` : l.trangThai === 'dang_lam' && l.vaoLuc ? ` · vào ${gio(l.vaoLuc)}` : ''}
                          {l.ghiChu ? ` · ${l.ghiChu}` : ''}
                        </span>
                        {e.cacLuotCu.length > 0 && (
                          <span className="block" style={{ ...NHAN_NHO, color: 'var(--mo)' }}>
                            {e.cacLuotCu.map((c) => `lần ${c.lanThu}: ${c.tong !== null && c.tong !== undefined ? c.tong.toFixed(2) : c.trangThai === 'khoa' ? 'khoá' : '—'}${c.nopLuc ? ` · ${gio(c.nopLuc)}` : ''}`).join(' · ')}
                          </span>
                        )}
                        <span className="flex items-center flex-wrap" style={{ gap: 4, marginTop: 4 }}>
                          <Nhan tone={nh.tone}>{nh.ten}</Nhan>
                          {daNop && l.soLanRoiMan > 0 && <Nhan tone="cam">rời màn {l.soLanRoiMan} lần / {l.tongGiayRoiMan}s</Nhan>}
                          {(l.trangThai === 'khoa' || l.soLanRoiMan > 0) && (
                            <button type="button" onClick={() => moBaoPhuHuynh(e.sbd, l.hoTen, l)} className="tap-target font-bold" style={{ ...NHAN_NHO, color: 'var(--cam)', minHeight: 32, padding: '0 10px', borderRadius: 'var(--bo-tron)', border: '1px solid var(--cam)' }}>
                              Báo phụ huynh
                            </button>
                          )}
                          {l.trangThai === 'khoa' &&
                            (xacNhanMoKhoa === e.sbd ? (
                              <span className="inline-flex items-center" style={{ gap: 4 }}>
                                <button type="button" onClick={() => handleMoKhoa(e.sbd)} disabled={dangDuyet === e.sbd} className="tap-target font-bold" style={{ ...NHAN_NHO, minHeight: 32, padding: '0 10px', borderRadius: 'var(--bo-tron)', background: 'var(--muc)', color: 'var(--muc-nguoc)' }}>
                                  {dangDuyet === e.sbd ? '…' : 'Đồng ý mở khoá'}
                                </button>
                                <button type="button" onClick={() => setXacNhanMoKhoa(null)} className="tap-target" style={{ ...NHAN_NHO, minHeight: 32, padding: '0 10px', borderRadius: 'var(--bo-tron)', background: 'var(--the)' }}>
                                  Huỷ
                                </button>
                              </span>
                            ) : (
                              <button type="button" onClick={() => setXacNhanMoKhoa(e.sbd)} className="tap-target font-bold" style={{ ...NHAN_NHO, color: 'var(--do)', minHeight: 32, padding: '0 10px', borderRadius: 'var(--bo-tron)', border: '1px solid var(--do)' }}>
                                Mở khoá
                              </button>
                            ))}
                          {daNop &&
                            (xacNhanSbd === e.sbd ? (
                              <span className="inline-flex items-center" style={{ gap: 4 }}>
                                <button type="button" onClick={() => handleChoThiLai(e.sbd)} disabled={dangDuyet === e.sbd} className="tap-target font-bold" style={{ ...NHAN_NHO, minHeight: 32, padding: '0 10px', borderRadius: 'var(--bo-tron)', background: 'var(--muc)', color: 'var(--muc-nguoc)' }}>
                                  {dangDuyet === e.sbd ? '…' : 'Đồng ý cho thi lại'}
                                </button>
                                <button type="button" onClick={() => setXacNhanSbd(null)} className="tap-target" style={{ ...NHAN_NHO, minHeight: 32, padding: '0 10px', borderRadius: 'var(--bo-tron)', background: 'var(--the)' }}>
                                  Huỷ
                                </button>
                              </span>
                            ) : (
                              <button type="button" onClick={() => setXacNhanSbd(e.sbd)} className="tap-target font-bold" style={{ ...NHAN_NHO, color: 'var(--muc)', minHeight: 32, padding: '0 10px', borderRadius: 'var(--bo-tron)', border: '1px solid var(--vien-dam)' }}>
                                Cho thi lại
                              </button>
                            ))}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block font-bold" style={{ ...SO, fontSize: 'var(--cx-4)', color: e.diem === null ? 'var(--mo)' : 'var(--muc)' }}>
                          {e.diem === null ? '—' : e.diem.toFixed(2)}
                        </span>
                        {e.diem !== null && <span style={NHAN_NHO}>{classify(e.diem)}</span>}
                      </span>
                    </Hang>
                  )
                })}
              </div>
            )}
          </TheNoiDung>

          {/* XUẤT */}
          {daCham.length > 0 && (
            <div className="flex" style={{ gap: 'var(--k2)' }}>
              <NutChinh onClick={handleExportXlsx}>Xuất BangDiem.xlsx ({daCham.length})</NutChinh>
              <NutChinh variant="phu" onClick={handleExportJson}>
                Xuất dulieu.json
              </NutChinh>
            </div>
          )}

          {/* BÁO PHỤ HUYNH — thầy đọc lại, sửa, rồi mới gửi */}
          {tinBao && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'var(--phu)' }}>
              <div className="w-full flex flex-col" style={{ maxWidth: 460, background: 'var(--the)', borderRadius: 'var(--bo-3)', padding: 'var(--k5)', gap: 'var(--k3)', boxShadow: 'var(--bong-2)' }}>
                <div className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-4)' }}>
                  Báo phụ huynh · SBD <span style={SO}>{tinBao.sbd}</span>
                </div>
                <OThongBao tone="cam">
                  Máy chỉ đo được em rời khỏi màn làm bài mấy lần, mấy giây. Một cuộc gọi đến cũng cho đúng tín hiệu đó, nên tin này nêu dữ kiện, không kết luận gian lận. Thầy sửa lại trước khi gửi.
                </OThongBao>
                <textarea
                  value={tinBao.noiDung}
                  onChange={(ev) => setTinBao({ ...tinBao, noiDung: ev.target.value })}
                  style={{ width: '100%', minHeight: 140, borderRadius: 'var(--bo-1)', padding: 'var(--k3)', background: 'var(--the-2)', border: '1.5px solid transparent', fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', color: 'var(--muc)', outline: 'none', lineHeight: 1.6 }}
                  aria-label="Nội dung tin báo phụ huynh"
                />
                <div className="flex" style={{ gap: 'var(--k2)' }}>
                  <NutChinh variant="phu" onClick={() => setTinBao(null)}>
                    Huỷ
                  </NutChinh>
                  <NutChinh onClick={guiBaoPhuHuynh} disabled={dangGuiBao || !tinBao.noiDung.trim()}>
                    {dangGuiBao ? 'Đang gửi…' : 'Gửi'}
                  </NutChinh>
                </div>
              </div>
            </div>
          )}

          {/* XOÁ CA */}
          <button type="button" onClick={() => setHoiXoa(true)} className="tap-target self-end inline-flex items-center gap-1" style={{ ...NHAN_NHO, color: 'var(--do)' }}>
            <Trash2 size={14} /> Xoá ca này
          </button>
          {hoiXoa && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'var(--phu)' }}>
              <div className="w-full flex flex-col" style={{ maxWidth: 400, background: 'var(--the)', borderRadius: 'var(--bo-3)', padding: 'var(--k5)', gap: 'var(--k3)', boxShadow: 'var(--bong-2)' }}>
                <div className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-4)' }}>
                  Xoá ca {chiTiet.ca.maCa}?
                </div>
                <OThongBao tone="do">
                  Xoá ca này sẽ xoá luôn bài làm của <b style={SO}>{tk.daVao}</b> em, không khôi phục được.
                </OThongBao>
                <div style={NHAN_NHO}>Gõ đúng mã ca để xác nhận:</div>
                <input style={{ ...O_NHAP, ...SO, letterSpacing: '.15em' }} placeholder={chiTiet.ca.maCa} value={maXoa} onChange={(e) => setMaXoa(e.target.value)} inputMode="numeric" autoFocus aria-label="Gõ mã ca để xác nhận xoá" />
                <div className="flex" style={{ gap: 'var(--k2)' }}>
                  <NutChinh
                    variant="phu"
                    onClick={() => {
                      setHoiXoa(false)
                      setMaXoa('')
                    }}
                  >
                    Huỷ
                  </NutChinh>
                  <NutChinh variant="nguyhiem" onClick={handleXoa} disabled={dangXoa || maXoa.trim() !== chiTiet.ca.maCa}>
                    {dangXoa ? 'Đang xoá…' : 'Xoá ca'}
                  </NutChinh>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
