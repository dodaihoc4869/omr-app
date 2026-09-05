// CHI TIẾT MỘT CA THI (QUANLYCATHI.md mục 2 + 5, nền cho mục 6): đi từ Lịch
// sử ca thi hoặc ngay sau khi mở ca. Dữ liệu lượt thi từ Google Sheet
// (chiTietCa); ĐIỂM chấm tại máy thầy bằng ngân hàng CÓ đáp án đã lưu khi mở
// ca (đáp án không rời máy thầy) rồi tự ghi điểm + chi tiết từng câu lên
// Sheet (ghiDiem) để phân tích về sau. Mỗi em một <Hang> kèm <Nhan>:
// xám chờ thi lại · tím đang làm · cam rời màn N lần · đỏ bị khoá · xanh đã nộp.
// Xoá ca = xoá mềm, phải gõ đúng mã ca.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Copy, Check, RefreshCw, Trash2, ArrowLeft, ChevronRight, Images, FileSpreadsheet, FileJson, Lock, Unlock } from 'lucide-react'
import { Hang, Nhan, OThongBao, NutChinh, TheNoiDung } from '../components/DesignSystem'
import { classify, type AnswerKey, type ScoreResult, type StudentAnswers } from '../engine/score'
import { chiTietCa, duyetThiLai, ghiDiem, khoaCa, moKhoa, moKhoaCa, sendTeacherMessage, xoaCa, type ChiTietCa, type ChiTietCauRow, type LuotThiRow, type PhamViCa, type CongBoDiem, khoiTuNamSinh } from '../lib/exam-api'
import { taoBaiGhiDiem, taoChiTietCau } from '../lib/chi-tiet-cau'
import { goiPhieuCaZip, tenTepZipCa, chuyenDeTuChiTiet, type EmTrongCaDeXuatPhieu } from '../lib/phieu-hang-loat'
import { viecCanLamMacDinh } from '../lib/phieu-zalo'
import { docSoCauCa, loadScriptUrl, loadSessionTeacherBank, luuSoCauCa, saveSessionTeacherBank, loadTeacherSecret } from '../lib/exam-db'
import { gradeSubmissionFull, type GradedSubmission } from '../lib/exam-grade'
import { gioMayChu } from '../lib/gio-may-chu'
import { soanTinRoiMan } from '../lib/phieu-zalo'
import { KhoiChuyenDe, KhoiLichSuCa } from '../components/HoSoEmView'
import NutBaiTapPdf from '../components/NutBaiTapPdf'
import NutTaiDeCa from '../components/NutTaiDeCa'
import KhoiTienBo from '../components/KhoiTienBo'
import KhoiGoiLenBang from '../components/KhoiGoiLenBang'
import PhieuZaloEm from '../components/PhieuZaloEm'
import { hoSoEm, type HoSoEm } from '../lib/exam-api'
import { buildStudentEntry, downloadDuLieuJson } from '../lib/json-export'
import { downloadBangDiem, type StudentRow } from '../lib/xlsx-export'
import { mergeKeepAnswers, type SoCauMoiPhan, type TeacherExamSource } from '../data/examContent'
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
  // HỒ SƠ MỘT EM mở ngay trong màn này: thầy đang xem ca, chạm tên em là thấy
  // luôn mạnh–yếu và soạn được phiếu gửi phụ huynh — không phải nhớ số báo danh
  // rồi sang tab Học sinh tìm lại.
  const [sbdHoSo, setSbdHoSo] = useState('')
  const [hoSo, setHoSo] = useState<HoSoEm | null>(null)
  const [dangTaiHoSo, setDangTaiHoSo] = useState(false)
  const [loiHoSo, setLoiHoSo] = useState('')
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
  // Số câu mỗi phần của ca này (màn Rút đề chốt lúc mở ca). Chấm lại PHẢI dùng
  // đúng con số đó, nếu không thầy rút 25 câu phần I mà máy chỉ lấy 18 ⇒ điểm
  // chấm lại khác điểm đã gửi phụ huynh mà không có dấu hiệu gì.
  const [soCauCa, setSoCauCa] = useState<SoCauMoiPhan | undefined>(undefined)
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
  const [hoiKhoa, setHoiKhoa] = useState(false)
  const [dangKhoa, setDangKhoa] = useState(false)
  // Tải phiếu cả ca: dựng ảnh cho từng em rồi gói .zip, chạy hoàn toàn tại máy
  // thầy nên không phụ thuộc mạng.
  const [dangGoiPhieu, setDangGoiPhieu] = useState('')
  // Đã ghi điểm lên Sheet cho lượt nào (khoá `${sbd}:${lanThu}:${nopLuc}`) — không ghi lặp mỗi lần tải lại.
  const daGhiRef = useRef<Set<string>>(new Set())

  // Nạp hồ sơ khi thầy chạm tên một em. Chỉ nạp khi thật sự mở — hồ sơ tốn
  // 2–4 giây một lượt gọi máy chủ, nạp sẵn cho cả lớp là phí.
  useEffect(() => {
    if (!sbdHoSo || !scriptUrl.trim() || !secret.trim()) {
      setHoSo(null)
      return
    }
    let huy = false
    setDangTaiHoSo(true)
    setLoiHoSo('')
    hoSoEm(scriptUrl.trim(), { secret: secret.trim(), sbd: sbdHoSo })
      .then((h) => !huy && setHoSo(h))
      .catch((e) => !huy && setLoiHoSo(e instanceof Error ? e.message : 'Không mở được hồ sơ'))
      .finally(() => !huy && setDangTaiHoSo(false))
    return () => {
      huy = true
    }
  }, [sbdHoSo, scriptUrl, secret])

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
      // Máy này chưa có bản đề CÓ đáp án của ca (ca mở ở máy/điện thoại khác)
      // thì XIN LUÔN từ máy chủ và cất lại — nếu không, thầy ngồi máy tính sẽ
      // không chấm lại, không xuất bảng điểm, không tải phiếu được. Lệnh đã đòi
      // mã bí mật nên không mở rộng quyền cho ai.
      const banksCu = await loadSessionTeacherBank(ma.trim())
      const ct = await chiTietCa(url, mat, ma.trim(), !banksCu)
      setChiTiet(ct)
      let bank = banksCu
      if (!bank && ct.keyBank && (ct.keyBank.phanI.length || ct.keyBank.phanII.length || ct.keyBank.phanIII.length)) {
        bank = [{ maDe: ct.ca.maCa, phanI: ct.keyBank.phanI, phanII: ct.keyBank.phanII, phanIII: ct.keyBank.phanIII }]
        await saveSessionTeacherBank(ma.trim(), bank)
      }
      setTeacherBank(bank ?? null)
      // Ưu tiên số câu lưu ở máy này; ca mở ở máy khác thì lấy theo gói đáp án
      // máy chủ vừa trả (mergeKeepAnswers đã đính soCau vào đó) rồi cất lại.
      const scLocal = await docSoCauCa(ma.trim())
      const scServer = (ct.keyBank as { soCau?: SoCauMoiPhan } | undefined)?.soCau
      const sc = scLocal ?? (scServer && scServer.I + scServer.II + scServer.III > 0 ? scServer : undefined)
      setSoCauCa(sc)
      if (!scLocal && sc) await luuSoCauCa(ma.trim(), sc)
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
          graded = gradeSubmissionFull(teacherBank, chiTiet.ca.maCa, sbd, moiNhat.dapAn, soCauCa)
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
  }, [chiTiet, teacherBank, soCauCa, classList])

  // Tự ghi điểm + chi tiết từng câu (mục 5) cho lượt vừa chấm được mà chưa ghi.
  useEffect(() => {
    if (!chiTiet || !teacherBank) return
    const bank = mergeKeepAnswers(teacherBank, soCauCa)
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
  /** TẢI PHIẾU HÀNG LOẠT — mỗi em đã chấm một ảnh, gói chung một .zip.
   *
   * Hạng lớp tính TẠI ĐÂY từ chính bảng điểm của ca (xếp giảm dần, đồng điểm
   * đồng hạng) chứ không gọi máy chủ — cùng một con số mà lấy hai nguồn thì sớm
   * muộn cũng lệch. Dòng "việc cần làm" dùng bản mặc định theo chuyên đề em sai
   * nhiều nhất; em nào cần lời riêng thì thầy mở hồ sơ em đó sửa rồi tải lại. */
  const handleTaiPhieuHangLoat = async () => {
    if (!chiTiet || daCham.length === 0) return
    const bank = teacherBank
    if (!bank || bank.length === 0) return showToast('Máy này chưa có bản đề CÓ đáp án của ca — không dựng được phiếu', 'error')
    setDangGoiPhieu('0/' + daCham.length)
    try {
      const keyBank = mergeKeepAnswers(bank, soCauCa)
      const xep = [...daCham].sort((a, b) => (b.diem ?? 0) - (a.diem ?? 0))
      const hangCua = new Map<string, number>()
      xep.forEach((e, i) => {
        const truoc = i > 0 ? xep[i - 1] : null
        hangCua.set(e.sbd, truoc && truoc.diem === e.diem ? hangCua.get(truoc.sbd)! : i + 1)
      })

      const ds: EmTrongCaDeXuatPhieu[] = daCham.map((e) => {
        const rows = taoChiTietCau(keyBank, chiTiet.ca.maCa, e.sbd, e.moiNhat.dapAn!, e.moiNhat.giayCau)
        const sc = e.graded!.score
        const cd = chuyenDeTuChiTiet(rows).filter((c) => c.soSai > 0)
        return {
          sbd: e.sbd,
          hoTen: e.hoTen,
          lop: e.lop || chiTiet.ca.lop || '',
          diem: sc.total,
          xepLoai: classify(sc.total),
          diemPhan: { I: sc.phanIScore, II: sc.phanIIScore, III: sc.phanIIIScore },
          toiDaPhan: { I: keyBank.phanI.length * 0.25, II: keyBank.phanII.length, III: keyBank.phanIII.length * 0.25 },
          chiTietCau: rows,
          hang: hangCua.get(e.sbd) ?? null,
          siSo: daCham.length,
          nopLuc: e.moiNhat.nopLuc || new Date().toISOString(),
          vieCanLam: viecCanLamMacDinh({
            hoTen: e.hoTen,
            ngay: e.moiNhat.nopLuc,
            diem: sc.total,
            xepLoai: classify(sc.total),
            soCauSai: rows.filter((r) => r.dungSai === false).length,
            chuyenDeSai: cd[0] ? { ten: cd[0].ten, soSai: cd[0].soSai } : null,
            baiTapDaGiao: null,
          }),
        }
      })

      const zip = await goiPhieuCaZip(ds, chiTiet.ca.tenCa || `Ca ${chiTiet.ca.maCa}`, (da, tong) => setDangGoiPhieu(`${da}/${tong}`))
      const ten = tenTepZipCa(chiTiet.ca.tenCa, chiTiet.ca.maCa)
      const u = URL.createObjectURL(zip)
      const a = document.createElement('a')
      a.href = u
      a.download = ten
      a.click()
      setTimeout(() => URL.revokeObjectURL(u), 6000)
      showToast(`Đã tải ${ten} — ${ds.length} phiếu`, 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không tạo được phiếu hàng loạt', 'error')
    } finally {
      setDangGoiPhieu('')
    }
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

  // ---------------------------------------------------------- KHOÁ / MỞ CA
  // Hai con số này đi thẳng vào hộp xác nhận. Nói "một số em" thì thầy không
  // biết mình đang cắt bài của ai, và bấm nhầm giữa giờ là hỏng cả ca.
  const dangLamNgay = dsEm.filter((e) => e.moiNhat.trangThai === 'dang_lam').length
  // Chỉ ca "chọn từng em" mới biết CHẮC bao nhiêu em chưa vào. Ca theo khối
  // hoặc tự do thì máy không biết sĩ số — nói một con số ở đó là bịa, nên để
  // null và câu xác nhận bỏ hẳn phần số.
  const chuaVao =
    chiTiet && chiTiet.ca.phamVi === 'chon' && Array.isArray(chiTiet.ca.danhSachMoi) ? Math.max(0, chiTiet.ca.danhSachMoi.length - dsEm.length) : null

  const khoaCaNay = async () => {
    if (!chiTiet) return
    setDangKhoa(true)
    try {
      const kq = await khoaCa(scriptUrl.trim(), secret.trim(), chiTiet.ca.maCa)
      setHoiKhoa(false)
      showToast(kq.soEmBiNop > 0 ? `Đã khoá ca — ${kq.soEmBiNop} em bị nộp bài theo phần đã làm` : 'Đã khoá ca — không em nào đang làm', 'success')
      await tai(chiTiet.ca.maCa, true)
    } catch (e) {
      showToast(`Không khoá được: ${e instanceof Error ? e.message : 'lỗi không rõ'}`, 'error')
    } finally {
      setDangKhoa(false)
    }
  }

  const moLaiCa = async () => {
    if (!chiTiet) return
    setDangKhoa(true)
    try {
      await moKhoaCa(scriptUrl.trim(), secret.trim(), chiTiet.ca.maCa)
      showToast('Đã mở ca lại — em mới vào được, em đã nộp phải duyệt thi lại', 'success')
      await tai(chiTiet.ca.maCa, true)
    } catch (e) {
      showToast(`Không mở lại được: ${e instanceof Error ? e.message : 'lỗi không rõ'}`, 'error')
    } finally {
      setDangKhoa(false)
    }
  }

  // ---------------------------------------------------------- HỒ SƠ MỘT EM
  // Cùng các khối với tab Học sinh (BA-APP mục 9 cấm dựng hai màn hồ sơ khác
  // nhau cho cùng một em), thêm khối gửi phụ huynh soạn theo ĐÚNG CA đang xem.
  if (sbdHoSo) {
    const emTrongCa = dsEm.find((e) => e.sbd === sbdHoSo)
    // Bảng chấm từng câu của đúng em này trong đúng ca này — nguồn của phần
    // "cách làm bài" và phần "từng câu sai" trong báo cáo gửi phụ huynh. Thiếu
    // ngân hàng đáp án (ca mở ở máy khác, chưa xin được) thì để null: báo cáo
    // bỏ hẳn hai phần đó chứ không dựng phần rỗng.
    let rowsHoSo: ChiTietCauRow[] | null = null
    if (chiTiet && teacherBank && emTrongCa?.moiNhat.dapAn) {
      try {
        rowsHoSo = taoChiTietCau(mergeKeepAnswers(teacherBank, soCauCa), chiTiet.ca.maCa, sbdHoSo, emTrongCa.moiNhat.dapAn, emTrongCa.moiNhat.giayCau)
      } catch {
        rowsHoSo = null
      }
    }
    return (
      <div className="min-h-screen pb-28 px-3 sm:px-4 pt-4 flex flex-col" style={{ background: 'var(--nen)', color: 'var(--muc)', gap: 'var(--k4)', fontFamily: 'var(--sans)' }}>
        <button onClick={() => setSbdHoSo('')} className="tap-target self-start inline-flex items-center" style={{ ...NHAN_NHO, gap: 4 }}>
          <ArrowLeft size={16} /> {chiTiet ? chiTiet.ca.tenCa || `Ca ${chiTiet.ca.maCa}` : 'Chi tiết ca'}
        </button>

        {loiHoSo && <OThongBao tone="do">{loiHoSo}</OThongBao>}
        {dangTaiHoSo && !hoSo && <div style={NHAN_NHO}>Đang mở hồ sơ…</div>}

        {hoSo && (
          <>
            <TheNoiDung>
              <div className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-5)' }}>
                {hoSo.em.hoTen || `SBD ${hoSo.em.sbd}`}
              </div>
              <div style={{ ...NHAN_NHO, marginTop: 4 }}>
                SBD <span style={SO}>{hoSo.em.sbd}</span>
                {hoSo.em.lop ? ` · Lớp ${hoSo.em.lop}` : ''}
                {hoSo.em.namSinh ? ` · sinh ${hoSo.em.namSinh}${khoiTuNamSinh(hoSo.em.namSinh) ? ` (khối ${khoiTuNamSinh(hoSo.em.namSinh)})` : ''}` : ''}
              </div>
              <div className="flex items-center flex-wrap" style={{ gap: 'var(--k2)', marginTop: 'var(--k3)' }}>
                <span className="font-bold" style={{ ...SO, fontSize: 'var(--cx-6)' }}>
                  {emTrongCa?.diem === null || emTrongCa?.diem === undefined ? '—' : emTrongCa.diem.toFixed(2).replace('.', ',')}
                </span>
                <span style={NHAN_NHO}>điểm ca này</span>
                <span style={{ ...NHAN_NHO, ...SO }}>· {hoSo.ca.length} ca đã làm</span>
              </div>
            </TheNoiDung>

            {/* Biểu đồ tiến bộ đứng đầu hồ sơ: mở ra là biết em đang lên hay
                đang xuống, trước khi đọc bất cứ số nào khác. */}
            <KhoiTienBo ca={hoSo.ca} />

            {/* Phiếu soạn theo ĐÚNG ca đang mở, không phải ca mới nhất của em —
                thầy đang đứng ở ca này thì tin nhắn phải nói về ca này. */}
            <PhieuZaloEm
              hoSo={hoSo}
              maCa={chiTiet?.ca.maCa}
              showToast={showToast}
              rows={rowsHoSo}
              banks={teacherBank}
              diemLop={dsEm.map((e) => e.diem).filter((d): d is number => typeof d === 'number')}
              thoiLuongPhut={chiTiet?.ca.thoiGianPhut ?? null}
              vaoLuc={emTrongCa?.moiNhat.vaoLuc ?? null}
              // BẰNG CHỨNG RỜI MÀN đi thẳng vào báo cáo: thầy bấm "Báo phụ
              // huynh" xong, phụ huynh mở link là thấy nút Vi phạm nhấp nháy,
              // bấm ra đúng mốc giờ máy đã ghi — thầy khỏi gõ tay lại con số.
              viPham={
                emTrongCa
                  ? {
                      soLan: emTrongCa.moiNhat.soLanRoiMan || 0,
                      tongGiay: emTrongCa.moiNhat.tongGiayRoiMan || 0,
                      daKhoa: emTrongCa.moiNhat.trangThai === 'khoa',
                      lyDoKhoa: emTrongCa.moiNhat.integrity?.lyDoKhoa ?? null,
                      nguong:
                        chiTiet?.ca.nguongLan && chiTiet?.ca.nguongGiay
                          ? { lan: Number(chiTiet.ca.nguongLan), giay: Number(chiTiet.ca.nguongGiay) }
                          : null,
                      events: emTrongCa.moiNhat.integrity?.events ?? null,
                    }
                  : null
              }
            />

            <KhoiChuyenDe chuyenDe={hoSo.chuyenDe} />
            <TheNoiDung>
              <NutBaiTapPdf sbd={hoSo.em.sbd} hoTen={hoSo.em.hoTen} lop={hoSo.em.lop} chuyenDe={hoSo.chuyenDe} showToast={showToast} />
            </TheNoiDung>
            <KhoiLichSuCa ca={hoSo.ca} />
          </>
        )}
      </div>
    )
  }

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
            {/* KHOÁ CA / MỞ CA LẠI (CATHIVAGOILENBANG mục 1.2) — ngay dưới mã
                ca, một nút đổi theo trạng thái. Đỏ là chặn, xanh là mở. */}
            <div style={{ marginTop: 'var(--k3)' }}>
              {chiTiet.ca.trangThai === 'dong' ? (
                <>
                  <button
                    type="button"
                    onClick={moLaiCa}
                    disabled={dangKhoa}
                    className="tap-target w-full font-bold"
                    style={{ height: 52, borderRadius: 'var(--bo-1)', background: 'var(--xanh)', color: 'var(--giay)', fontSize: 'var(--cx-2)' }}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Unlock size={18} /> {dangKhoa ? 'Đang mở…' : 'MỞ CA LẠI'}
                    </span>
                  </button>
                  <div style={{ ...NHAN_NHO, marginTop: 'var(--k2)' }}>
                    Đã khoá {chiTiet.ca.khoaLuc ? <span style={SO}>{gio(chiTiet.ca.khoaLuc)}</span> : ''}
                    {chiTiet.ca.khoaBoi ? ` bởi ${chiTiet.ca.khoaBoi}` : ''}. Mở lại thì em mới vào được; em đã bị nộp do khoá phải duyệt thi lại từng em.
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setHoiKhoa(true)}
                  disabled={dangKhoa}
                  className="tap-target w-full font-bold"
                  style={{ height: 52, borderRadius: 'var(--bo-1)', background: 'var(--do)', color: 'var(--giay)', fontSize: 'var(--cx-2)' }}
                >
                  <span className="inline-flex items-center gap-2">
                    <Lock size={18} /> KHOÁ CA
                  </span>
                </button>
              )}
            </div>
            <div style={{ marginTop: 'var(--k3)' }}>
              <NutChinh variant="phu" onClick={copyLink}>
                <span className="inline-flex items-center gap-2">
                  {daCopy ? <Check size={18} /> : <Copy size={18} />} {daCopy ? 'Đã copy link mời' : 'Copy link mời vào thi'}
                </span>
              </NutChinh>
            </div>
          </TheNoiDung>

          {/* HỘP XÁC NHẬN KHOÁ — nêu ĐÚNG SỐ ĐẾM THẬT, không nói chung chung.
              Thầy phải biết mình đang cắt bài của mấy em trước khi bấm. */}
          {hoiKhoa && (
            <TheNoiDung>
              <div style={{ ...TIEU_DE_MUC, marginBottom: 'var(--k3)' }}>Khoá ca {chiTiet.ca.maCa}?</div>
              <OThongBao tone="do">
                <b style={SO}>{dangLamNgay}</b> em đang làm bài sẽ bị nộp bài ngay, chấm theo phần đã làm.{' '}
                {chuaVao === null ? 'Em nào chưa vào sẽ không vào được nữa.' : <>
                  <b style={SO}>{chuaVao}</b> em chưa vào sẽ không vào được nữa.
                </>}
              </OThongBao>
              <div style={{ ...NHAN_NHO, marginTop: 'var(--k3)' }}>Mở ca lại được, nhưng em đã bị nộp thì phải duyệt thi lại từng em.</div>
              <div className="flex" style={{ gap: 'var(--k3)', marginTop: 'var(--k4)' }}>
                <button type="button" onClick={() => setHoiKhoa(false)} className="tap-target flex-1 font-bold" style={{ height: 48, borderRadius: 'var(--bo-1)', background: 'var(--the-2)', color: 'var(--muc)' }}>
                  Huỷ
                </button>
                <button type="button" onClick={khoaCaNay} disabled={dangKhoa} className="tap-target flex-1 font-bold" style={{ height: 48, borderRadius: 'var(--bo-1)', background: 'var(--do)', color: 'var(--giay)' }}>
                  {dangKhoa ? 'Đang khoá…' : 'Khoá'}
                </button>
              </div>
            </TheNoiDung>
          )}

          {loi && <OThongBao tone="do">{loi}</OThongBao>}
          {!teacherBank && dsEm.some((e) => e.moiNhat.dapAn) && (
            <OThongBao tone="cam">
              Máy này chưa lấy được ngân hàng CÓ đáp án của ca. Ca mở khi chưa bật "xem điểm" thì đáp án không nằm trên máy chủ, chỉ máy đã mở ca mới chấm được — điểm hiện ra là điểm đã ghi trên Sheet.
            </OThongBao>
          )}

          {/* GỌI LÊN BẢNG — dựng thẳng từ bài làm của ca này, không bắt thầy
              sang màn khác chọn lại đề và lớp. Cần ngân hàng CÓ đáp án mới
              biết em nào sai câu nào, nên chỉ hiện khi máy này có bản đề. */}
          {teacherBank && teacherBank.length > 0 && dsEm.some((e) => e.moiNhat.dapAn) && (
            <KhoiGoiLenBang
              maCa={chiTiet.ca.maCa}
              tenCa={`${chiTiet.ca.tenCa || `Ca ${chiTiet.ca.maCa}`}${chiTiet.ca.lop ? ` · ${chiTiet.ca.lop}` : ''}`}
              bank={mergeKeepAnswers(teacherBank, soCauCa)}
              luot={dsEm.map((e) => ({ sbd: e.sbd, hoTen: e.hoTen, trangThai: e.moiNhat.trangThai, dapAn: e.moiNhat.dapAn, giayCau: e.moiNhat.giayCau }))}
              onCopy={(ok) => showToast(ok ? 'Đã copy bảng phân công' : 'Không copy được', ok ? 'success' : 'error')}
            />
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
                          {/* CHẠM TÊN EM → hồ sơ đầy đủ ngay trong màn này:
                              mạnh–yếu, lịch sử ca, tin nhắn và ảnh phiếu Zalo. */}
                          <button
                            type="button"
                            onClick={() => setSbdHoSo(e.sbd)}
                            className="tap-target font-bold inline-flex items-center text-left"
                            style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-2)', color: 'var(--muc)', gap: 2, background: 'none', border: 'none', padding: 0, minHeight: 0, textDecoration: 'underline', textDecorationColor: 'var(--vien-dam)', textUnderlineOffset: 3 }}
                          >
                            {e.hoTen || '(chưa có tên)'}
                            <ChevronRight size={14} style={{ color: 'var(--mo)' }} />
                          </button>
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

          {/* XUẤT — ba việc cùng hạng, nên cùng cỡ và xếp một hàng. Bản trước
              một nút đen to đè hai nút viền, nhìn như ba việc khác hạng nhau
              trong khi thầy dùng cả ba ngang nhau. Nhãn còn hai chữ, đuôi tệp
              xuống dòng nhỏ bên dưới. */}
          {daCham.length > 0 && (
            <TheNoiDung>
              <div className="flex items-baseline justify-between" style={{ gap: 'var(--k3)', marginBottom: 'var(--k3)' }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-3)', fontWeight: 700 }}>Xuất kết quả</div>
                <div style={NHAN_NHO}>{daCham.length} em đã chấm</div>
              </div>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--k2)' }}>
                <NutXuat icon={<Images size={20} />} ten={dangGoiPhieu ? 'Đang dựng…' : 'Phiếu'} phu={dangGoiPhieu || `${daCham.length} ảnh · zip`} onClick={() => void handleTaiPhieuHangLoat()} tat={!!dangGoiPhieu} />
                <NutXuat icon={<FileSpreadsheet size={20} />} ten="Bảng điểm" phu="xlsx" onClick={handleExportXlsx} />
                <NutXuat icon={<FileJson size={20} />} ten="Dữ liệu" phu="json" onClick={handleExportJson} />
              </div>
            </TheNoiDung>
          )}

          {/* ĐỀ + LỜI GIẢI CỦA CA. Cần ngân hàng CÓ đáp án; ca mở ở máy khác mà
              chưa xin được thì không hiện nút chứ không hiện nút bấm vào lỗi. */}
          {teacherBank && teacherBank.length > 0 && chiTiet && (
            <TheNoiDung>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-3)', fontWeight: 700, marginBottom: 'var(--k3)' }}>Tải đề & lời giải</div>
              <NutTaiDeCa
                banks={teacherBank}
                maCa={chiTiet.ca.maCa}
                tenCa={chiTiet.ca.tenCa || `Ca ${chiTiet.ca.maCa}`}
                ghiChu={chiTiet.ca.lop ? `Lớp ${chiTiet.ca.lop}` : ''}
                soCauCa={soCauCa ?? null}
                dsEm={dsEm.map((e) => ({ sbd: e.sbd, hoTen: e.hoTen }))}
                showToast={showToast}
              />
            </TheNoiDung>
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

/** Một ô xuất kết quả: biểu tượng trên, tên hai chữ ở giữa, đuôi tệp bên dưới.
 * Ba ô cùng cỡ vì ba việc cùng hạng — thầy dùng cái nào cũng như nhau. */
function NutXuat({ icon, ten, phu, onClick, tat }: { icon: React.ReactNode; ten: string; phu: string; onClick: () => void; tat?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={tat}
      className="tap-target flex flex-col items-center justify-center"
      style={{
        gap: 4,
        minHeight: 84,
        padding: 'var(--k3) var(--k2)',
        borderRadius: 'var(--bo-2)',
        background: 'var(--the-2)',
        border: '1.5px solid transparent',
        color: tat ? 'var(--mo)' : 'var(--muc)',
        opacity: tat ? 0.7 : 1,
        transitionProperty: 'background-color, border-color',
        transitionDuration: 'var(--nhanh)',
      }}
    >
      <span style={{ color: tat ? 'var(--mo)' : 'var(--phu-dam)' }}>{icon}</span>
      <span className="font-bold text-center" style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', lineHeight: 1.2 }}>
        {ten}
      </span>
      <span className="text-center" style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)', fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>
        {phu}
      </span>
    </button>
  )
}
