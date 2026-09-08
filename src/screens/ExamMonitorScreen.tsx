// CHI TIẾT MỘT CA THI (QUANLYCATHI.md mục 2 + 5, nền cho mục 6): đi từ Lịch
// sử ca thi hoặc ngay sau khi mở ca. Dữ liệu lượt thi từ Google Sheet
// (chiTietCa); ĐIỂM chấm tại máy thầy bằng ngân hàng CÓ đáp án đã lưu khi mở
// ca (đáp án không rời máy thầy) rồi tự ghi điểm + chi tiết từng câu lên
// Sheet (ghiDiem) để phân tích về sau. Mỗi em một <Hang> kèm <Nhan>:
// xám chờ thi lại · tím đang làm · cam rời màn N lần · đỏ bị khoá · xanh đã nộp.
// Xoá ca = xoá mềm, phải gõ đúng mã ca.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, RefreshCw, Trash2, ArrowLeft, ChevronRight, Images, FileSpreadsheet, FileJson, Lock, Unlock, Send, Pencil, LogIn, BarChart3 } from 'lucide-react'
import { Hang, Nhan, OThongBao, NutChinh, TheNoiDung } from '../components/DesignSystem'
import { classify, type AnswerKey, type ScoreResult, type StudentAnswers } from '../engine/score'
import { batDauThi, chiTietCa, doiTenCa, dongBoTenCa, moTaLyDoChan, ghiDiem, khoaCa, moKhoa, moKhoaCa, sendTeacherMessage, xoaCa, type ChiTietCa, type ChiTietCauRow, type LuotThiRow, type PhamViCa, type CongBoDiem, khoiTuNamSinh } from '../lib/exam-api'
import { chuanTenCa, tenHienCua, TEN_CA_TOI_DA } from '../lib/ten-ca'
import { taoBaiGhiDiem, taoChiTietCau } from '../lib/chi-tiet-cau'
import { emLechDiem, loiBaoLechDiem } from '../lib/lech-diem'
import { dongSoCauHoiLai } from '../lib/dem-cau-hoi-lai'
import { maCaLay, vaBienBanCu } from '../lib/va-bien-ban-cu'
import { goiPhieuCaZip, tenTepZipCa, chuyenDeTuChiTiet, type EmTrongCaDeXuatPhieu } from '../lib/phieu-hang-loat'
import { viecCanLamMacDinh } from '../lib/phieu-zalo'
import { gomLinkPhieu, tomTatLinkPhieu, vanBanLinkPhieu, type DongLinkPhieu } from '../lib/link-phieu-ca'
import { dungPhieuChoEm } from '../lib/phieu-ca-ca'
import { phieuTheoCa } from '../lib/exam-api'
import { docCheDoDeRieng, docDeRiengCa, docSoCauCa, loadScriptUrl, loadSessionTeacherBank, luuDeRiengCa, luuSoCauCa, saveSessionTeacherBank, loadTeacherSecret, type BienBanDeRieng, type DeRiengCaLuu } from '../lib/exam-db'
import { CHU_LY_DO_THIEU } from '../lib/de-rieng'
import { CAU_HINH_DE_RIENG_MAC_DINH } from '../lib/cau-hinh-de-rieng'
import { dungDeRiengChoCa, dungLapTuMayChu } from '../lib/de-rieng-nguon'
import { choEmThiLai } from '../lib/thi-lai'
import { gradeSubmissionFull, type GradedSubmission } from '../lib/exam-grade'
import { gioMayChu } from '../lib/gio-may-chu'
import { soanTinRoiMan } from '../lib/phieu-zalo'
import { KhoiChuyenDe, KhoiLichSuCa } from '../components/HoSoEmView'
import NutBaiTapPdf from '../components/NutBaiTapPdf'
import NutTaiDeCa from '../components/NutTaiDeCa'
import KhoiCauHoiEm from '../components/KhoiCauHoiEm'
import KhoiTienBo from '../components/KhoiTienBo'
import PhieuZaloEm from '../components/PhieuZaloEm'
import { hoSoEm, type HoSoEm } from '../lib/exam-api'
import { buildStudentEntry, downloadDuLieuJson } from '../lib/json-export'
import { downloadBangDiem, type StudentRow } from '../lib/xlsx-export'
import { mergeKeepAnswers, type SoCauMoiPhan, type TeacherExamSource } from '../data/examContent'
import { chuTatDe } from '../lib/giu-de-doc'
import { useAppStore } from '../store/appStore'
import { cuaVaoCa } from '../lib/cua-vao-ca'
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
const TEN_PHAM_VI: Record<PhamViCa, string> = { tu_do: 'Tự do', khoi: 'Theo khối', chon: 'Chọn từng em', sbd: 'Số báo danh' }

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
  /** CA ĐỀ RIÊNG TỪNG EM (DE-RIENG-TUNG-EM mục 6): ba con số của riêng em này,
   * kèm CHI TIẾT từng câu để thầy đọc thẳng chứ không phải mở phiếu từng em.
   * `null` ở ca thường — cột biến mất chứ không hiện số 0 giả. */
  lap?: {
    tong: number
    daSua: number
    saiLai: number
    /** Câu hỏi lại mà em VẪN SAI, kèm sai lần thứ mấy. Đây là thứ thầy cần. */
    saiLaiChiTiet: { phan: 'I' | 'II' | 'III'; soCau: number; qid: string; chuyenDe: string; soLanSai: number; dapAnDung: string; dapAnChon: string }[]
    /** Câu hỏi lại em đã làm đúng — tin tốt, cũng phải đếm được. */
    daSuaChiTiet: { phan: 'I' | 'II' | 'III'; soCau: number; qid: string; chuyenDe: string }[]
  } | null
}

/** BIÊN BẢN LÚC RÚT ĐỀ RIÊNG — trả lời "vì sao em này không có câu hỏi lại".
 *
 * Trước đây mấy con số này chỉ chạy qua một toast rồi mất; thầy mở ca ra sau đó
 * không thấy gì. Bày thẳng: mỗi em một dòng, cần mấy câu, được mấy câu, vì sao
 * thiếu. Không có con số nào tự bịa — mọi thứ ở đây do chính lượt rút ghi lại. */
export function BangBienBanLap({ bb, tenCua }: { bb: BienBanDeRieng; tenCua: (sbd: string) => string }) {
  const ds = Object.keys(bb.canCua)
  const thieuCua = new Map(bb.thieu.map((t) => [t.sbd, t]))
  return (
    <div style={{ background: 'var(--the-2)', borderRadius: 'var(--bo-1)', padding: 'var(--k3)' }}>
      <div className="font-bold" style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', color: 'var(--muc)' }}>
        Biên bản rút câu hỏi lại
      </div>
      <div style={{ ...NHAN_NHO, ...SO }}>
        {/* NÓI ĐÚNG PHẠM VI THẦY CHỌN. Bản trước ghi cứng "quét N ca gần nhất"
            cho cả hai chế độ, nên thầy chọn "Ca gần nhất" mà đọc ra "3 ca gần
            nhất" và tưởng máy rút sai (thầy bắt được 08/09). Quét mấy ca là
            chuyện tìm ca em có nộp; LẤY mấy ca mới là điều thầy chốt. */}
        {bb.caDaQuet.length === 0
          ? 'không quét được ca nào trước đó'
          : bb.phamVi === 'ba_ca'
            ? `bốc 3 ca ngẫu nhiên: ${bb.caDaQuet.join(' · ')}`
            : `lấy ca gần nhất em có nộp — đã dò ${bb.caDaQuet.length} ca: ${bb.caDaQuet.join(' · ')}`}
        {bb.lucRut ? ` · rút lúc ${ngayGio(bb.lucRut)}` : ''}
      </div>
      {bb.boQua.length > 0 && (
        <div style={{ ...NHAN_NHO, color: 'var(--cam)', marginTop: 4, lineHeight: 1.6 }}>
          Ca không đọc được: {bb.boQua.map((b) => `${b.maCa} (${b.vi_sao})`).join(' · ')}
        </div>
      )}
      <div className="flex flex-col" style={{ gap: 4, marginTop: 'var(--k2)' }}>
        {ds.map((sbd) => {
          const can = bb.canCua[sbd] ?? 0
          const duoc = bb.soLapCua[sbd] ?? 0
          const sai = bb.saiCaTruocCua[sbd] ?? 0
          const t = thieuCua.get(sbd)
          return (
            <div key={`bb-${sbd}`} style={{ ...NHAN_NHO, color: 'var(--muc)', lineHeight: 1.6 }}>
              <b>{tenCua(sbd) || `SBD ${sbd}`}</b>
              <span style={{ ...SO, color: 'var(--nhat)' }}>
                {' '}
                {maCaLay(bb, sbd) ? ` · lấy từ ca ${maCaLay(bb, sbd)}` : ''} · sai {sai} câu · cần {can} · rút được {duoc}
              </span>
              {t && (
                <span style={{ color: 'var(--cam)' }}>
                  {' '}
                  — {CHU_LY_DO_THIEU[t.lyDo as keyof typeof CHU_LY_DO_THIEU] ?? t.lyDo}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
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
  const [deRiengCa, setDeRiengCa] = useState<DeRiengCaLuu | null>(null)
  /** Ca này MỞ ở chế độ đề riêng — cờ đánh lúc mở ca. Bộ câu thì rút lúc bấm
   * Bắt đầu, nên hai thứ này tách nhau. */
  const [caCanDeRieng, setCaCanDeRieng] = useState(false)
  /** BẢN ĐỒ BỘ CÂU DÙNG ĐỂ CHẤM — MỘT nguồn cho cả màn.
   *
   * Máy chủ trước, IndexedDB của máy này sau. Thầy bắt được 08/09: mọi chỗ ở
   * đây đọc thẳng bản đồ trong IndexedDB, tức bản chỉ nằm ở đúng cái máy đã bấm
   * Bắt đầu. Mở ca ở máy khác là chấm lại bằng luật hash — khối "câu em sai
   * buổi trước" đếm ra 0 dù máy chủ có đủ, và điểm trên bảng cũng lệch. */
  const boTheoEmDung = chiTiet?.boTheoEmCa ?? deRiengCa?.boTheoEm
  /** BẢN DỰNG LẠI TỪ MÁY CHỦ cho khối "còn sai lại" — dùng khi ô trên máy chủ
   * không chở sẵn (ca mở trước 08/09, hoặc bấm Bắt đầu bằng máy chưa cập nhật).
   * Nhờ nó, MÁY NÀO mở ca cũng thấy đủ khối đỏ, không phải đúng máy đã bấm. */
  const [lapDungLai, setLapDungLai] = useState<{ lapTheoEm: Record<string, string[]>; demSai: Record<string, Record<string, number>> } | null>(null)
  const [teacherBank, setTeacherBank] = useState<TeacherExamSource[] | null>(null)
  // Số câu mỗi phần của ca này (màn Rút đề chốt lúc mở ca). Chấm lại PHẢI dùng
  // đúng con số đó, nếu không thầy rút 25 câu phần I mà máy chỉ lấy 18 ⇒ điểm
  // chấm lại khác điểm đã gửi phụ huynh mà không có dấu hiệu gì.
  const [soCauCa, setSoCauCa] = useState<SoCauMoiPhan | undefined>(undefined)
  const [daCopy, setDaCopy] = useState(false)
  const [daCopyDiem, setDaCopyDiem] = useState(false)
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
  // ĐỔI TÊN CA (thầy báo 07/09). `null` = đang không sửa; chuỗi = ô nhập đang
  // mở và giữ bản nháp. Bản nháp tách khỏi `chiTiet` để thầy gõ dở rồi bấm Huỷ
  // là tên cũ còn nguyên, không phải tải lại ca.
  const [tenNhap, setTenNhap] = useState<string | null>(null)
  const [dangDoiTen, setDangDoiTen] = useState(false)
  // Đồng bộ họ tên từ danh sách lớp vào ca. Em vào thi chỉ gõ số báo danh nên
  // cột tên của lượt bỏ trống, phiếu gửi phụ huynh in "SBD 10038" thay vì tên.
  const [dangDongBoTen, setDangDongBoTen] = useState(false)
  // PHÒNG CHỜ (thầy chốt 07/09): ca bật phòng chờ thì em đứng ở màn trắng cho
  // tới khi thầy bấm Bắt đầu thi ngay tại đây.
  const [dangBatDau, setDangBatDau] = useState(false)
  const [hoiHuy, setHoiHuy] = useState(false)
  // Tải phiếu cả ca: dựng ảnh cho từng em rồi gói .zip, chạy hoàn toàn tại máy
  // thầy nên không phụ thuộc mạng.
  const [dangGoiPhieu, setDangGoiPhieu] = useState('')
  // Gom link phiếu của cả ca để dán một lượt vào Zalo (thầy chốt 05/09 chiều).
  const [dangGomLink, setDangGomLink] = useState(false)
  /** "3/12" khi đang dựng nốt phiếu còn thiếu — nút phải nói nó đang làm gì,
   * không thì thầy tưởng máy treo. */
  const [tienTaoPhieu, setTienTaoPhieu] = useState('')
  const [tomTatLink, setTomTatLink] = useState('')
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
      // CA ĐỀ RIÊNG TỪNG EM: bản đồ sbd → câu PHẢI có mặt trước khi chấm. Chấm
      // bằng luật hash trong khi em nhận bộ câu theo bản đồ là ra bộ câu của
      // người khác — sai điểm mà màn hình không báo gì.
      setDeRiengCa((await docDeRiengCa(ma.trim()).catch(() => undefined)) ?? null)
      // MÁY CHỦ LÀ NGUỒN CHÍNH. IndexedDB chỉ còn là bản sao cho ca mở trước
      // 08/09 — hồi đó cờ chế độ chỉ nằm ở máy mở ca, nên mở ca ở điện thoại
      // rồi bấm Bắt đầu trên máy tính là máy tính im lặng coi đây là ca thường
      // (ca 933467).
      const drMayChu = (ct.ca as { deRieng?: boolean }).deRieng === true
      setCaCanDeRieng(drMayChu || (await docCheDoDeRieng(ma.trim()).catch(() => false)))
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

  // DỰNG LẠI KHỐI ĐỎ TỪ MÁY CHỦ khi ô của ca không chở sẵn (thầy chốt 08/09:
  // "đồng bộ phần màu đỏ đấy vào tất cả các thiết bị").
  //
  // Chỉ chạy khi THIẾU: có sẵn thì không tốn thêm lệnh nào. Hỏng thì im lặng —
  // khối đỏ đã có sẵn dòng nói máy này không giữ biên bản.
  useEffect(() => {
    if (!chiTiet) return
    const url = scriptUrl.trim()
    const mat = secret.trim()
    if (!url || !mat) return
    const bo = boTheoEmDung
    if (!bo || Object.keys(bo).length === 0) return
    const daCoLap = Object.keys(chiTiet.lapTheoEm ?? {}).length > 0 || Object.keys(deRiengCa?.lapTheoEm ?? {}).length > 0
    const daCoDem = Object.keys(chiTiet.demSaiTheoEm ?? {}).length > 0 || Object.keys(deRiengCa?.lapCua ?? {}).length > 0
    if (daCoLap && daCoDem) return
    let huy = false
    dungLapTuMayChu(url, mat, chiTiet.ca.maCa, bo)
      .then((ra) => {
        if (!huy && Object.keys(ra.lapTheoEm).length > 0) setLapDungLai(ra)
      })
      .catch(() => {})
    return () => {
      huy = true
    }
  }, [chiTiet, scriptUrl, secret, deRiengCa])

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
          graded = gradeSubmissionFull(teacherBank, chiTiet.ca.maCa, sbd, moiNhat.dapAn, soCauCa, boTheoEmDung)
        } catch {
          graded = null
        }
      }
      // Ba con số câu lặp, đếm từ ĐÚNG bảng chấm của em, không ước lượng.
      let lap: HangEm['lap'] = null
      // NGUỒN 1 (đủ nhất): bản đồ máy này ghi lúc bấm Bắt đầu — có cả SỐ LẦN
      // em đã sai từng câu. NGUỒN 2: bản đồ máy chủ trả về, chỉ có DANH SÁCH
      // câu lặp. Thầy bấm Bắt đầu ở điện thoại rồi mở ca trên máy tính thì chỉ
      // còn nguồn 2 — vẫn đếm được "sửa được / còn sai", chỉ không có số lần.
      // Số 0 ở đây nghĩa là CHƯA BIẾT, và chỗ hiển thị phải im về số lần chứ
      // không được in "sai lần thứ 1".
      const lapEm: Record<string, number> | undefined =
        deRiengCa?.lapCua?.[sbd] ??
        chiTiet.demSaiTheoEm?.[sbd] ??
        // Bản dựng lại từ máy chủ: có ĐỦ số lần sai, nên nhãn "sai lần thứ N"
        // vẫn đúng trên máy chưa từng mở ca này.
        lapDungLai?.demSai?.[sbd] ??
        (chiTiet.lapTheoEm?.[sbd]?.length ? Object.fromEntries(chiTiet.lapTheoEm[sbd].map((q) => [q, 0])) : undefined)
      if (lapEm && teacherBank && moiNhat.dapAn && graded) {
        try {
          const rows = taoChiTietCau(mergeKeepAnswers(teacherBank, soCauCa, boTheoEmDung), chiTiet.ca.maCa, sbd, moiNhat.dapAn, moiNhat.giayCau)
          const cua = rows.filter((r) => typeof lapEm[r.qid] === 'number')
          lap = {
            tong: cua.length,
            daSua: cua.filter((r) => r.dungSai).length,
            saiLai: cua.filter((r) => r.dungSai === false).length,
            // `soLanSai` = số lần sai TRƯỚC ca này cộng lần này. Cùng một phép
            // tính với nhãn trong báo cáo (`dungCauSai`), không đếm kiểu khác.
            saiLaiChiTiet: cua
              .filter((r) => r.dungSai === false)
              // `soLanSai` = 0 nghĩa là máy này không giữ số lần sai cũ. In số
              // 1 vào đó là bịa: em có thể đã sai câu này ba lần rồi.
              .map((r) => ({
                phan: r.phan,
                soCau: r.soCau,
                qid: r.qid,
                chuyenDe: r.chuyenDe || '',
                soLanSai: (lapEm[r.qid] ?? 0) > 0 ? (lapEm[r.qid] ?? 0) + 1 : 0,
                dapAnDung: r.dapAnDung || '',
                dapAnChon: r.dapAnChon || '',
              })),
            daSuaChiTiet: cua.filter((r) => r.dungSai).map((r) => ({ phan: r.phan, soCau: r.soCau, qid: r.qid, chuyenDe: r.chuyenDe || '' })),
          }
        } catch {
          lap = null
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
        lap,
      })
    })
    // Đã nộp/khoá lên trước theo giờ nộp mới nhất, rồi đang làm, rồi chờ thi lại.
    const thuTu = (l: LuotThiRow) => (l.trangThai === 'dang_lam' ? 1 : l.trangThai === 'duoc_duyet_lai' ? 2 : 0)
    out.sort((a, b) => thuTu(a.moiNhat) - thuTu(b.moiNhat) || (a.hoTen || a.sbd).localeCompare(b.hoTen || b.sbd, 'vi'))
    return out
  }, [chiTiet, teacherBank, soCauCa, classList, deRiengCa, lapDungLai])

  // Tự ghi điểm + chi tiết từng câu (mục 5) cho lượt vừa chấm được mà chưa ghi.
  useEffect(() => {
    if (!chiTiet || !teacherBank) return
    const bank = mergeKeepAnswers(teacherBank, soCauCa, boTheoEmDung)
    const can = dsEm.filter((e) => e.graded && !daGhiRef.current.has(`${e.sbd}:${e.moiNhat.lanThu}:${e.moiNhat.nopLuc}`))
    if (can.length === 0) return
    const bai = can.map((e) => taoBaiGhiDiem(bank, chiTiet.ca.maCa, e.sbd, e.moiNhat.lanThu, e.moiNhat.dapAn!, e.graded!, e.moiNhat.giayCau))
    let huy = false
    ghiDiem(scriptUrl.trim(), secret.trim(), chiTiet.ca.maCa, bai)
      .then((kq) => {
        if (huy) return
        for (const e of can) if (kq.daGhi.includes(e.sbd)) daGhiRef.current.add(`${e.sbd}:${e.moiNhat.lanThu}:${e.moiNhat.nopLuc}`)
        if (kq.tuChoi.length > 0) showToast(`Không ghi được điểm ${kq.tuChoi.length} em lên Sheet`, 'error')
        // GHI ĐÈ ĐIỂM CŨ THÌ PHẢI NÓI RA. Màn này chấm lại tại chỗ rồi ghi
        // đè con số trên Sheet — con số mà màn Học sinh, bảng điểm, bản xuất
        // Excel và phiếu gửi phụ huynh đều đọc. Đổi mà im lặng thì thầy thấy
        // hai điểm khác nhau ở hai màn và không biết vì sao (đúng việc thầy
        // báo 08/09). Xem lech-diem.ts.
        const lech = emLechDiem(
          can
            .filter((e) => kq.daGhi.includes(e.sbd))
            .map((e) => ({ sbd: e.sbd, hoTen: e.hoTen, tongSheet: e.moiNhat.tong, tongChamLai: e.graded!.score.total })),
        )
        if (lech.length > 0) showToast(loiBaoLechDiem(lech), 'warn')
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
      // CHO THI LẠI nay là ba việc trong một (thầy chốt 08/09): xoá lịch sử
      // lượt cũ, khoá đúng máy em đã thi, và rút ĐỀ MỚI.
      const kq = await choEmThiLai(scriptUrl.trim(), secret.trim(), chiTiet.ca.maCa, sbd)
      const phan = [`xoá ${kq.soLuotXoa} lượt cũ`, kq.daDoiDe ? `đề mới ${kq.soCauKhac}/${kq.soCauMoi} câu khác đề cũ` : 'GIỮ ĐỀ CŨ']
      phan.push(kq.khoaMay ? 'chỉ vào được ở máy cũ' : 'lượt cũ không ghi máy nên KHÔNG khoá được máy')
      showToast(`Đã cho thi lại: ${phan.join(' · ')}.`, kq.daDoiDe && kq.khoaMay ? 'success' : 'warn')
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

  // ĐỔI TÊN CA. Ghi xong thì lấy tên MÁY CHỦ TRẢ VỀ mà hiển thị, không lấy
  // chuỗi vừa gõ: máy chủ mới là chỗ chuẩn hoá cuối cùng (cắt 80 ký tự, cắt
  // `=` `+` `@` đầu chuỗi), nên hai bên chỉ chắc chắn khớp khi màn hình đọc lại
  // của máy chủ.
  const luuTenCa = async () => {
    if (!chiTiet || tenNhap === null) return
    const moi = chuanTenCa(tenNhap)
    if (moi === chuanTenCa(chiTiet.ca.tenCa)) {
      setTenNhap(null)
      return
    }
    setDangDoiTen(true)
    try {
      const kq = await doiTenCa(scriptUrl.trim(), secret.trim(), chiTiet.ca.maCa, moi)
      setChiTiet((c) => (c ? { ...c, ca: { ...c.ca, tenCa: kq.tenCa } } : c))
      setTenNhap(null)
      showToast(kq.tenCa ? `Đã đổi tên ca thành "${kq.tenCa}"` : 'Đã xoá tên ca, ca gọi theo mã', 'success')
    } catch (e) {
      showToast(`Không đổi được tên: ${e instanceof Error ? e.message : 'lỗi không rõ'}`, 'error')
    } finally {
      setDangDoiTen(false)
    }
  }

  // LINK XEM ĐIỂM (thầy báo 07/09). Link mời vào thi `/t/…` sau khi nộp là
  // đường cụt trên máy khác; link này em nhập lại danh tính rồi vào thẳng phiếu.
  const copyLinkDiem = () => {
    if (!chiTiet) return
    const link = `${location.origin}${import.meta.env.BASE_URL}d/${chiTiet.ca.maCa}`
    navigator.clipboard.writeText(link).then(() => {
      setDaCopyDiem(true)
      showToast('Đã copy link xem điểm', 'success')
    })
  }

  /** Em trong ca đang KHÔNG có họ tên. Phiếu của những em này in "SBD 10038"
   * thay vì tên con, phụ huynh mở link ra không biết là phiếu của ai. */
  const emThieuTen = useMemo(() => dsEm.filter((e) => !e.hoTen.trim()).map((e) => e.sbd), [dsEm])

  // CÂU HỎI LẠI — thầy chốt 08/09: "kết thúc mỗi ca thi thì trong mục ca thi
  // phải có nút báo rõ những học sinh nào vẫn sai tiếp các câu đã rút, liệt kê
  // chi tiết". Gom sẵn ở đây để cả nút lẫn bảng đọc cùng một nguồn.
  const [moSaiLai, setMoSaiLai] = useState(false)
  /** Ca này có phải ca đề riêng không — hỏi CẢ HAI nguồn.
   *
   * `caCanDeRieng` là cờ máy này ghi lúc mở ca; `deRiengCa` là bản đồ máy này
   * ghi lúc bấm Bắt đầu. Thầy mở ca ở điện thoại rồi xem trên máy tính thì máy
   * tính không có cờ, nhưng `chiTiet.ca` vẫn nói ca có bộ câu riêng. */
  const laCaDeRieng =
    caCanDeRieng ||
    Boolean(deRiengCa) ||
    Object.keys(chiTiet?.lapTheoEm ?? {}).length > 0 ||
    Object.keys(lapDungLai?.lapTheoEm ?? {}).length > 0 ||
    (chiTiet?.ca as { deRieng?: boolean } | undefined)?.deRieng === true
  // Biên bản: bản ở máy này trước (đầy đủ nhất), rồi tới bản máy chủ đã cất
  // lúc bấm Bắt đầu — nhờ nó mà máy thứ hai vẫn đọc được.
  const bienBanGoc = deRiengCa?.bienBan ?? (chiTiet?.bienBanDeRieng as BienBanDeRieng | undefined) ?? null
  // BIÊN BẢN CŨ NÓI SAI THÌ VÁ LÚC ĐỌC. Bản cất trước 08/09 không có `phamVi`,
  // `tuCaCua` và chưa biết lý do `het_cho`, nên màn này in "lấy từ ca —" và dán
  // nhãn "ngoài kho" cho em thật ra chỉ hết chỗ trong đề (thầy hỏi đúng chỗ đó).
  // Không sửa bản đã cất — đó là bằng chứng của lượt rút. Xem va-bien-ban-cu.ts.
  const bienBanLap = useMemo(() => {
    if (!bienBanGoc) return null
    const kho = teacherBank
      ? new Set(teacherBank.flatMap((t) => [...t.phanI, ...t.phanII, ...t.phanIII].map((q) => q.id)))
      : null
    return vaBienBanCu(bienBanGoc, {
      phamViCa: (chiTiet?.ca as { phamViHoiLai?: 'gan_nhat' | 'ba_ca' } | undefined)?.phamViHoiLai ?? null,
      lapTheoEm: deRiengCa?.lapTheoEm ?? chiTiet?.lapTheoEm ?? lapDungLai?.lapTheoEm ?? null,
      qidTrongKho: kho,
    })
  }, [bienBanGoc, teacherBank, chiTiet, deRiengCa, lapDungLai])
  const tongKetLap = useMemo(() => {
    const co = dsEm.filter((e) => e.lap && e.lap.tong > 0)
    return {
      soEmCoLap: co.length,
      tongCauLap: co.reduce((n, e) => n + (e.lap?.tong ?? 0), 0),
      tongDaSua: co.reduce((n, e) => n + (e.lap?.daSua ?? 0), 0),
      tongSaiLai: co.reduce((n, e) => n + (e.lap?.saiLai ?? 0), 0),
      // Xếp em sai nhiều nhất lên đầu: thầy đọc từ trên xuống là gặp ngay em
      // cần gọi lên bảng.
      emSaiLai: co.filter((e) => (e.lap?.saiLai ?? 0) > 0).sort((a, b) => (b.lap?.saiLai ?? 0) - (a.lap?.saiLai ?? 0)),
      emSachTron: co.filter((e) => (e.lap?.saiLai ?? 0) === 0),
    }
  }, [dsEm])

  const dongBoTenChoCa = async () => {
    if (!chiTiet) return
    setDangDongBoTen(true)
    try {
      const kq = await dongBoTenCa(scriptUrl.trim(), secret.trim(), chiTiet.ca.maCa)
      const phan: string[] = []
      if (kq.daDien.length) phan.push(`điền ${kq.daDien.length} tên`)
      if (kq.daSua.length) phan.push(`sửa ${kq.daSua.length} tên lệch`)
      if (kq.khongCo.length) phan.push(`${kq.khongCo.length} SBD không có trong danh sách`)
      showToast(
        phan.length ? `Đã đồng bộ: ${phan.join(' · ')}. Dựng lại phiếu để tên hiện đúng.` : 'Mọi em trong ca đã đúng tên danh sách.',
        kq.khongCo.length ? 'error' : 'success',
      )
      await tai(chiTiet.ca.maCa)
    } catch (e) {
      showToast(`Không đồng bộ được tên: ${e instanceof Error ? e.message : 'lỗi không rõ'}`, 'error')
    } finally {
      setDangDongBoTen(false)
    }
  }

  const batDauCaNay = async () => {
    if (!chiTiet) return
    setDangBatDau(true)
    try {
      // ĐỀ RIÊNG TỪNG EM — rút ĐÚNG LÚC NÀY, cho ĐÚNG những em đang đứng chờ.
      //
      // Vì sao không rút lúc mở ca: lúc đó chưa biết em nào tới. Bản đầu bó
      // vào phạm vi "tích từng em" và thầy bắt được ngay — mở ca test32 ở chế
      // độ khác thì không có bộ nào, không có gì để báo (thầy chốt 08/09).
      let boTheoEm: Record<string, string[]> | undefined
      let lapTheoEm: Record<string, string[]> | undefined
      // BIÊN BẢN VÀ SỐ LẦN SAI ĐI LÊN MÁY CHỦ luôn. Để lại ở IndexedDB thì chỉ
      // đúng cái máy bấm Bắt đầu mới đọc được — thầy bấm ở điện thoại rồi mở ca
      // trên máy tính là màn hình trống (thầy chốt 08/09: "máy nào cũng được").
      let bienBan: BienBanDeRieng | undefined
      let demSai: Record<string, Record<string, number>> | undefined
      if (caCanDeRieng) {
        const dsCho = (chiTiet.dsCho ?? []).map((x) => x.sbd).filter(Boolean)
        if (dsCho.length === 0) {
          showToast('Chưa em nào vào phòng chờ — chưa rút được đề riêng.', 'error')
          setDangBatDau(false)
          return
        }
        // PHẠM VI thầy chọn lúc mở ca, đọc từ máy chủ nên máy nào bấm Bắt đầu
        // cũng rút đúng thứ thầy đã chốt.
        const pv = (chiTiet.ca as { phamViHoiLai?: 'gan_nhat' | 'ba_ca' }).phamViHoiLai === 'ba_ca' ? 'ba_ca' : 'gan_nhat'
        const ra = await dungDeRiengChoCa(scriptUrl.trim(), secret.trim(), chiTiet.ca.maCa, dsCho, { ...CAU_HINH_DE_RIENG_MAC_DINH, PHAM_VI_HOI_LAI: pv })
        boTheoEm = ra.boTheoEm
        lapTheoEm = ra.lapTheoEm
        // BIÊN BẢN cất cùng bản đồ. Toast biến mất sau ba giây; câu hỏi "vì sao
        // em này không có câu hỏi lại" thì còn nguyên cả buổi.
        bienBan = {
          canCua: ra.canCua,
          soLapCua: ra.soLapCua,
          saiCaTruocCua: ra.saiCaTruocCua,
          tuCaCua: ra.tuCaCua,
          phamVi: pv,
          thieu: ra.thieu,
          boQua: ra.boQua,
          caDaQuet: ra.caDaQuet,
          lucRut: new Date().toISOString(),
        }
        demSai = ra.lapCua
        await luuDeRiengCa(chiTiet.ca.maCa, ra.boTheoEm, ra.lapCua, ra.lapTheoEm, bienBan)
        if (ra.cauNoiThem.soCau > 0) showToast(`Đã kéo ${ra.cauNoiThem.soCau} câu em từng sai từ kho vào đề ca này.`, 'success')
        if (ra.thieu.length > 0) showToast(`${ra.thieu.length} em không đủ câu hỏi lại — xem chi tiết trong ca.`, 'warn')
      }
      const kq = await batDauThi(scriptUrl.trim(), secret.trim(), chiTiet.ca.maCa, boTheoEm, lapTheoEm, demSai, bienBan as unknown as Record<string, unknown>)
      if (kq.thieuBoTheoEm) {
        // KHÔNG NUỐT. Ca đã phát đề trước khi có bản đồ ⇒ em làm một bộ câu,
        // máy thầy chấm một bộ khác. Ghi đè bản đồ lúc này còn tệ hơn, nên
        // việc duy nhất đúng là báo thầy mở ca lại.
        showToast('Ca này đã phát đề TRƯỚC khi có bộ câu riêng — điểm chấm sẽ sai. Huỷ ca và mở lại.', 'error')
      } else {
        showToast(kq.daBatTruoc ? 'Ca này đã bắt đầu từ trước.' : 'Đã bắt đầu — cả lớp hiện đề ngay bây giờ.', 'success')
      }
      await tai(chiTiet.ca.maCa)
    } catch (e) {
      showToast(`Không bắt đầu được: ${e instanceof Error ? e.message : 'lỗi không rõ'}`, 'error')
    } finally {
      setDangBatDau(false)
    }
  }

  /** HUỶ CA ĐANG CHỜ. Chưa em nào làm bài nên không mất gì; xoá vẫn là xoá MỀM
   * nên bấm nhầm thì vào Lịch sử ca khôi phục lại được. */
  const huyCaCho = async () => {
    if (!chiTiet) return
    setDangXoa(true)
    try {
      await xoaCa(scriptUrl.trim(), secret.trim(), chiTiet.ca.maCa, chiTiet.ca.maCa)
      showToast('Đã huỷ ca. Em đang chờ sẽ thấy báo ca đã huỷ.', 'success')
      setHoiHuy(false)
      setScreen('lichsuca')
    } catch (e) {
      showToast(`Không huỷ được ca: ${e instanceof Error ? e.message : 'lỗi không rõ'}`, 'error')
    } finally {
      setDangXoa(false)
    }
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
      // `boTheoEm` PHẢI đi cùng ở MỌI chỗ dựng bảng chấm: thiếu ở một chỗ là
      // chỗ đó cắt câu theo luật hash và dựng bảng của người khác.
      const keyBank = mergeKeepAnswers(bank, soCauCa, boTheoEmDung)
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

  /** DỰNG VÀ CẤT PHIẾU cho những em chưa có, trả về dòng link của các em đó.
   *
   * Hai chỗ gộp để đỡ tải máy chủ: hồ sơ lấy MỘT lệnh cho cả danh sách
   * (`hoSoNhieuEm`), phiếu cất theo GÓI (`luuNhieuPhieu`) chứ không từng em. */
  const taoPhieuChoEm = async (
    url: string,
    mat: string,
    dsSbd: string[],
    goc: string,
    tien: (da: number, tong: number) => void,
  ): Promise<DongLinkPhieu[]> => {
    if (!chiTiet || dsSbd.length === 0) return []
    const bank = teacherBank
    if (!bank || bank.length === 0) return []
    // Lõi dựng phiếu nằm ở `phieu-ca-ca.ts`, dùng chung với cầu nối
    // `window.__ddh`. Màn hình chỉ đưa dữ liệu nó đã có sẵn trong bộ nhớ.
    const { dong, loi } = await dungPhieuChoEm(
      url,
      mat,
      {
        maCa: chiTiet.ca.maCa,
        tenCa: chiTiet.ca.tenCa || '',
        lop: chiTiet.ca.lop || '',
        thoiGianPhut: chiTiet.ca.thoiGianPhut ?? null,
        nguongLan: chiTiet.ca.nguongLan ?? null,
        nguongGiay: chiTiet.ca.nguongGiay ?? null,
        // CA ĐỀ RIÊNG TỪNG EM: cờ tắt hạng lớp, và bản đồ số lần sai để báo
        // cáo gắn đúng nhãn. Thiếu ở đây là phiếu dựng từ màn Theo dõi khác
        // phiếu dựng từ cầu nối — hai bản cho cùng một em.
        deRieng: Boolean(deRiengCa),
        lapCua: deRiengCa?.lapCua,
      },
      mergeKeepAnswers(bank, soCauCa, boTheoEmDung),
      daCham.filter((e): e is typeof e & { graded: NonNullable<typeof e.graded> } => !!e.graded),
      dsSbd,
      goc,
      tien,
    )
    if (loi.length > 0) showToast(`${loi.length} em chưa cất được phiếu: ${loi[0].vi_sao}`, 'warn')
    return dong
  }

  /** COPY HẾT LINK PHIẾU CỦA CA. Máy chủ đã giữ mã phiếu theo mã ca, nên chỉ
   * cần một lệnh thay vì mở phiếu từng em.
   *
   * Em CHƯA CÓ PHIẾU vẫn được kê tên ở cuối văn bản: im lặng bỏ qua là thầy gửi
   * thiếu một phụ huynh mà không biết. */
  const handleCopyLinkPhieu = async () => {
    if (!chiTiet) return
    const url = scriptUrl.trim()
    const mat = secret.trim()
    if (!url || !mat) return showToast('Chưa cấu hình link Apps Script hoặc mã bí mật', 'error')
    setDangGomLink(true)
    try {
      const goc = `${location.origin}${import.meta.env.BASE_URL}`
      const ds = await phieuTheoCa(url, mat, chiTiet.ca.maCa)
      let g = gomLinkPhieu(
        daCham.map((e) => ({ sbd: e.sbd, hoTen: e.hoTen })),
        ds,
        goc,
      )

      // TỰ TẠO PHIẾU CHO EM CÒN THIẾU (thầy chốt 06/09).
      //
      // Trước đây phiếu chỉ được cất khi thầy MỞ hồ sơ từng em — ca ba chục em
      // là ba chục lần mở chỉ để có link gửi Zalo. Nay bấm một nút: máy dựng
      // nốt phiếu còn thiếu rồi copy đủ cả ca.
      if (g.chuaCoPhieu.length > 0) {
        setDangGomLink(true)
        const them = await taoPhieuChoEm(
          url,
          mat,
          g.chuaCoPhieu.map((x) => x.sbd),
          goc,
          (da, tong) => setTienTaoPhieu(`${da}/${tong}`),
        )
        if (them.length > 0) {
          // Ghép tại chỗ, KHÔNG gọi lại `phieuTheoCa`: mã vừa tạo đã nằm trong
          // tay, hỏi lại máy chủ là một lượt gọi thừa.
          const conThieu = g.chuaCoPhieu.filter((x) => !them.some((t) => t.sbd === x.sbd))
          g = { dong: [...g.dong, ...them], chuaCoPhieu: conThieu }
        }
      }

      if (g.dong.length === 0) {
        setTomTatLink('')
        return showToast('Chưa dựng được phiếu nào — máy này cần bản đề CÓ đáp án của ca', 'warn')
      }
      const t = vanBanLinkPhieu(g)
      setTomTatLink(tomTatLinkPhieu(g))
      try {
        await navigator.clipboard.writeText(t)
        showToast(`Đã copy ${g.dong.length} link phiếu${g.chuaCoPhieu.length ? ` · ${g.chuaCoPhieu.length} em chưa dựng được` : ''}`, 'success')
      } catch {
        showToast(t, 'success')
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không lấy được danh sách phiếu', 'error')
    } finally {
      setDangGomLink(false)
      setTienTaoPhieu('')
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

  // CỬA VÀO CA — luật nằm trong `cua-vao-ca.ts`, màn này chỉ vẽ.
  const cua = cuaVaoCa(chiTiet?.ca ?? null, now)

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
      const kq = await moKhoaCa(scriptUrl.trim(), secret.trim(), chiTiet.ca.maCa)
      showToast(kq.goHanVao ? 'Đã mở ca — bỏ hạn giờ vào, em đến muộn vào được ngay' : 'Đã mở ca — em mới vào được, em đã nộp phải duyệt thi lại', 'success')
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
        rowsHoSo = taoChiTietCau(mergeKeepAnswers(teacherBank, soCauCa, boTheoEmDung), chiTiet.ca.maCa, sbdHoSo, emTrongCa.moiNhat.dapAn, emTrongCa.moiNhat.giayCau)
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
              <NutBaiTapPdf sbd={hoSo.em.sbd} hoTen={hoSo.em.hoTen} lop={hoSo.em.lop} chuyenDe={hoSo.chuyenDe} chuyenDeCa={(hoSo.chuyenDeCaGanNhat ?? []).map((c) => c.ten)} maCa={chiTiet?.ca.maCa} rows={rowsHoSo} showToast={showToast} />
            </TheNoiDung>
            <KhoiLichSuCa ca={hoSo.ca} />
          </>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-28 px-3 sm:px-4 pt-4 flex flex-col" style={{ background: 'var(--nen)', color: 'var(--muc)', gap: 'var(--k4)', fontFamily: 'var(--sans)' }}>
      <div className="flex items-center justify-between" style={{ gap: 'var(--k3)' }}>
        {/* TÊN CA SỬA ĐƯỢC TẠI CHỖ (thầy báo 07/09).
            Chạm vào tên là mở ô nhập ngay tại chỗ nó đang đứng, không nhảy sang
            màn khác: thầy sửa tên giữa lúc coi thi, mất bảng lượt thi một nhịp
            là mất luôn cái đang theo dõi. */}
        {chiTiet && tenNhap !== null ? (
          <div className="flex items-center min-w-0 flex-1" style={{ gap: 'var(--k2)' }}>
            <input
              autoFocus
              value={tenNhap}
              onChange={(e) => setTenNhap(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void luuTenCa()
                if (e.key === 'Escape') setTenNhap(null)
              }}
              maxLength={TEN_CA_TOI_DA}
              placeholder={`Ca ${chiTiet.ca.maCa}`}
              aria-label="Tên ca thi"
              style={{ ...O_NHAP, fontFamily: 'var(--serif)', fontWeight: 700 }}
            />
            <button
              type="button"
              onClick={() => void luuTenCa()}
              disabled={dangDoiTen}
              className="tap-target shrink-0 font-bold"
              style={{ height: 52, padding: '0 var(--k4)', borderRadius: 'var(--bo-1)', background: 'var(--muc)', color: 'var(--muc-nguoc)', border: 'none', fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)' }}
            >
              {dangDoiTen ? '…' : 'Xong'}
            </button>
            <button
              type="button"
              onClick={() => setTenNhap(null)}
              disabled={dangDoiTen}
              className="tap-target shrink-0"
              style={{ height: 52, padding: '0 var(--k3)', borderRadius: 'var(--bo-1)', background: 'transparent', border: 'none', ...NHAN_NHO }}
            >
              Huỷ
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => chiTiet && setTenNhap(chiTiet.ca.tenCa || '')}
              disabled={!chiTiet}
              className="tap-target flex items-center min-w-0"
              style={{ gap: 'var(--k2)', background: 'transparent', border: 'none', padding: 0, textAlign: 'left', color: 'var(--muc)' }}
              aria-label="Sửa tên ca thi"
            >
              <h1 className="font-bold truncate" style={{ fontSize: 'var(--cx-5)', fontFamily: 'var(--serif)' }}>
                {chiTiet ? tenHienCua(chiTiet.ca.tenCa, chiTiet.ca.maCa) : 'Chi tiết ca thi'}
              </h1>
              {chiTiet && <Pencil size={16} className="shrink-0" style={{ color: 'var(--nhat)' }} />}
            </button>
            <button onClick={() => setScreen('lichsuca')} style={NHAN_NHO} className="tap-target shrink-0">
              ← Lịch sử
            </button>
          </>
        )}
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
            {/* PHÒNG CHỜ (thầy chốt 07/09). Ca bật phòng chờ mà thầy chưa bấm
                bắt đầu thì em đang đứng ở màn trắng — đây là việc gấp nhất
                trên màn này, nên nó đứng trên cả cửa vào ca.
                Hai nút đúng như thầy chốt: Bắt đầu thi và Huỷ ca thi. */}
            {chiTiet.ca.phongCho && !chiTiet.ca.batDauThiLuc && (
              <div style={{ marginTop: 'var(--k3)', background: 'var(--tim-nen)', borderRadius: 'var(--bo-2)', padding: 'var(--k4)' }}>
                <div className="font-bold" style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', color: 'var(--muc)' }}>
                  Ca đang ở phòng chờ
                </div>
                <div style={{ ...NHAN_NHO, marginTop: 'var(--k1)' }}>
                  Em vào ca đang thấy màn chờ, chưa nhận đề và đồng hồ chưa chạy. Bấm Bắt đầu thi thì cả lớp hiện đề cùng một lúc.
                </div>
                {/* AI ĐANG CÓ MẶT. Với ca đề riêng, đây chính là danh sách máy
                    rút bộ câu cho — thầy phải nhìn thấy trước khi bấm, không
                    phải bấm rồi mới biết ai có phần. */}
                <div style={{ ...NHAN_NHO, ...SO, marginTop: 'var(--k2)', color: 'var(--muc)' }}>
                  <b>{(chiTiet.dsCho ?? []).length}</b> em đang chờ
                  {(chiTiet.dsCho ?? []).length > 0 ? `: ${(chiTiet.dsCho ?? []).map((x) => x.hoTen || `SBD ${x.sbd}`).join(' · ')}` : ' — chưa em nào vào.'}
                </div>
                {caCanDeRieng && (
                  <div style={{ ...NHAN_NHO, marginTop: 'var(--k2)', color: 'var(--tim)' }}>
                    Ca này hỏi lại câu em từng sai. Bấm Bắt đầu thì máy rút bộ câu riêng cho đúng {(chiTiet.dsCho ?? []).length} em đang chờ — em vào sau đó nhận đề theo luật bốc ngẫu nhiên như ca thường.
                  </div>
                )}
                <div className="grid grid-cols-2" style={{ gap: 'var(--k2)', marginTop: 'var(--k3)' }}>
                  <button
                    type="button"
                    onClick={() => void batDauCaNay()}
                    disabled={dangBatDau}
                    className="tap-target font-bold"
                    style={{ minHeight: 52, borderRadius: 'var(--bo-2)', border: 'none', background: 'var(--xanh)', color: 'var(--muc-nguoc)', fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)' }}
                  >
                    {dangBatDau ? 'Đang bắt đầu…' : 'Bắt đầu thi'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setHoiHuy(true)}
                    disabled={dangXoa}
                    className="tap-target font-bold"
                    style={{ minHeight: 52, borderRadius: 'var(--bo-2)', border: '1.5px solid var(--do)', background: 'transparent', color: 'var(--do)', fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)' }}
                  >
                    Huỷ ca thi
                  </button>
                </div>
                {hoiHuy && (
                  <div style={{ marginTop: 'var(--k3)' }}>
                    <OThongBao tone="do">Huỷ ca <b style={SO}>{chiTiet.ca.maCa}</b>? Em đang chờ sẽ thấy báo ca đã huỷ. Ca vào Lịch sử ca, khôi phục lại được.</OThongBao>
                    <div className="flex" style={{ gap: 'var(--k2)', marginTop: 'var(--k2)' }}>
                      <button type="button" onClick={() => setHoiHuy(false)} className="tap-target flex-1 font-bold" style={{ height: 48, borderRadius: 'var(--bo-1)', background: 'var(--the-2)', color: 'var(--muc)', border: 'none' }}>
                        Không huỷ
                      </button>
                      <button type="button" onClick={() => void huyCaCho()} disabled={dangXoa} className="tap-target flex-1 font-bold" style={{ height: 48, borderRadius: 'var(--bo-1)', background: 'var(--do)', color: 'var(--giay)', border: 'none' }}>
                        {dangXoa ? 'Đang huỷ…' : 'Huỷ ca'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {chiTiet.ca.phongCho && chiTiet.ca.batDauThiLuc && (
              <div style={{ ...NHAN_NHO, marginTop: 'var(--k3)' }}>
                Phòng chờ đã mở lúc <span style={SO}>{gio(chiTiet.ca.batDauThiLuc)}</span> — em vào từ giờ nhận đề ngay.
              </div>
            )}
            {/* CỬA VÀO CA — HAI NÚT, LUÔN THẤY CẢ HAI (thầy chốt 05/09).
                Trước đây chỉ có MỘT nút đổi mặt theo trạng thái: đang mở thì
                thấy nút khoá, đã khoá thì thấy nút mở. Nhìn một nút
                không biết ca đang ở trạng thái nào, phải đọc chữ trên nút rồi
                suy ngược — giữa giờ dễ bấm nhầm.

                Nay hai nút nằm cạnh nhau, nút ứng với trạng thái ĐANG CÓ thì
                tắt và tô nhạt. Thầy liếc là biết cửa đang mở hay đóng.

                MỞ CA cũng dùng khi QUÁ GIỜ VÀO: nó gỡ luôn hạn vào phòng, nên
                em đến muộn vào được ngay, không phải mở ca mới. */}
            <div style={{ marginTop: 'var(--k3)' }}>
              <div style={{ ...NHAN_NHO, marginBottom: 'var(--k2)' }} data-cua-vao={cua.nhan}>
                Cửa vào ca: <b style={{ color: cua.moCua ? 'var(--xanh)' : 'var(--do)' }}>{cua.nhan}</b>
                {cua.daKhoa && chiTiet.ca.khoaLuc ? (
                  <>
                    {' '}
                    lúc <span style={SO}>{gio(chiTiet.ca.khoaLuc)}</span>
                    {chiTiet.ca.khoaBoi ? ` bởi ${chiTiet.ca.khoaBoi}` : ''}
                  </>
                ) : null}
                {cua.quaGioVao && !cua.daKhoa && chiTiet.ca.hetHanVao ? (
                  <>
                    {' '}
                    (hạn <span style={SO}>{gio(chiTiet.ca.hetHanVao)}</span>)
                  </>
                ) : null}
              </div>
              {/* HAI NÚT MỞ / KHOÁ CA — vẽ lại 06/09 theo ý thầy.
                  Luật vẽ: việc BẤM ĐƯỢC thì tô đặc và nổi lên; việc không bấm
                  được thì chìm hẳn, không viền, không tranh mắt. Trạng thái ca
                  nói bằng chữ ở nhãn trên, không bắt thầy suy từ màu. */}
              <div className="flex items-center" style={{ gap: 'var(--k2)', marginBottom: 'var(--k2)' }}>
                <span
                  aria-hidden
                  style={{ width: 8, height: 8, borderRadius: 'var(--bo-tron)', background: cua.moCua ? 'var(--xanh)' : 'var(--do)', display: 'block' }}
                />
                <span className="font-bold" style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: cua.moCua ? 'var(--xanh)' : 'var(--do)' }}>
                  {cua.moCua ? 'Ca đang mở' : 'Ca đang khoá'}
                </span>
              </div>
              <div className="grid grid-cols-2" style={{ gap: 'var(--k2)' }}>
                <button
                  type="button"
                  onClick={moLaiCa}
                  disabled={dangKhoa || !cua.moDuoc}
                  aria-label="Mở ca cho em vào"
                  className="tap-target flex items-center"
                  style={{
                    minHeight: 64,
                    gap: 'var(--k2)',
                    padding: '0 var(--k3)',
                    borderRadius: 'var(--bo-3)',
                    border: 'none',
                    textAlign: 'left',
                    background: cua.moDuoc ? 'var(--xanh)' : 'var(--the-2)',
                    color: cua.moDuoc ? 'var(--muc-nguoc)' : 'var(--mo)',
                    boxShadow: cua.moDuoc ? 'var(--bong-2)' : 'none',
                    transition: 'transform 120ms ease, box-shadow 120ms ease',
                  }}
                >
                  <span
                    className="flex items-center justify-center shrink-0"
                    style={{ width: 36, height: 36, borderRadius: 'var(--bo-tron)', background: cua.moDuoc ? 'var(--xanh-nen)' : 'var(--the)', color: cua.moDuoc ? 'var(--xanh)' : 'var(--mo)' }}
                  >
                    <Unlock size={19} />
                  </span>
                  <span className="flex flex-col" style={{ gap: 1, minWidth: 0 }}>
                    <span className="font-bold" style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)' }}>
                      {dangKhoa && cua.moDuoc ? 'Đang mở…' : 'Mở ca'}
                    </span>
                    <span style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-0)', opacity: 0.85 }}>Em vào được ngay</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setHoiKhoa(true)}
                  disabled={dangKhoa || !cua.khoaDuoc}
                  aria-label="Khoá ca"
                  className="tap-target flex items-center"
                  style={{
                    minHeight: 64,
                    gap: 'var(--k2)',
                    padding: '0 var(--k3)',
                    borderRadius: 'var(--bo-3)',
                    border: 'none',
                    textAlign: 'left',
                    background: cua.khoaDuoc ? 'var(--do-nen)' : 'var(--the-2)',
                    color: cua.khoaDuoc ? 'var(--do)' : 'var(--mo)',
                    boxShadow: cua.khoaDuoc ? 'var(--bong-1)' : 'none',
                    transition: 'transform 120ms ease, box-shadow 120ms ease',
                  }}
                >
                  <span
                    className="flex items-center justify-center shrink-0"
                    style={{ width: 36, height: 36, borderRadius: 'var(--bo-tron)', background: cua.khoaDuoc ? 'var(--do)' : 'var(--the)', color: cua.khoaDuoc ? 'var(--muc-nguoc)' : 'var(--mo)' }}
                  >
                    <Lock size={19} />
                  </span>
                  <span className="flex flex-col" style={{ gap: 1, minWidth: 0 }}>
                    <span className="font-bold" style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)' }}>
                      Khoá ca
                    </span>
                    <span style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-0)', opacity: 0.85 }}>Dừng và nộp bài</span>
                  </span>
                </button>
              </div>
              <div style={{ ...NHAN_NHO, marginTop: 'var(--k2)' }}>
                {cua.moCua
                  ? 'Khoá ca: em đang làm bị nộp ngay theo phần đã làm, em chưa vào thì không vào được nữa.'
                  : 'Mở ca: bỏ hạn giờ vào phòng, em đến muộn vào được ngay. Em đã bị nộp do khoá phải duyệt thi lại từng em.'}
              </div>
            </div>
            {/* HAI LINK GỬI CHO EM — vẽ lại 07/09 theo ý thầy.
                Bản cũ là hai thanh chữ xám xếp dọc, chữ dài gần bằng nhau
                ("Copy link mời vào thi" / "Copy link XEM ĐIỂM cho em") nên giữa
                giờ phải đọc hết mới biết bấm cái nào.

                Nay đi theo đúng luật vẽ của cặp Mở ca / Khoá ca ngay trên:
                mỗi việc một thẻ, biểu tượng tròn nói việc, dòng phụ nói em nhận
                được gì. Hai việc khác nhau nên hai màu khác nhau — tím là VÀO
                THI, xanh là XEM ĐIỂM — và copy xong thì chính thẻ đó đổi nền,
                không phải đọc chữ mới biết đã copy. */}
            {/* EM BỊ CHẶN Ở CỔNG DANH SÁCH (thầy báo 07/09).
                Cổng so đủ ba: số báo danh, họ tên, năm sinh. Máy chủ CỐ Ý không
                nói cho em biết sai ô nào — nói ra là cho phép dò tên học sinh
                từ số báo danh. Nhưng thầy đứng ngay trong phòng thì phải thấy:
                07/09 hai em bị chặn giữa buổi mà không còn dấu vết nào để lần.
                Bày thẳng em gõ gì / danh sách ghi gì, thầy sửa trong một phút. */}
            {/* CÂU HỎI LẠI — CÒN SAI TIẾP.
                Ca đề riêng lấy ít nhất 30% là câu chính em đã sai; câu hỏi
                duy nhất đáng giá sau ca là "em nào VẪN sai". Bày ngay ở màn ca
                thi, không bắt thầy mở phiếu 21 em ra dò. */}
            {/* HIỆN CẢ KHI KHÔNG RÚT ĐƯỢC CÂU NÀO. Bản trước chỉ hiện khi có em
                có câu lặp, nên ca rút hụt thì màn hình im lặng hoàn toàn và
                thầy không biết vì sao (thầy bắt được 08/09: "vẫn chưa có nút
                xem lại câu đã làm sai buổi trước"). Im lặng là điều cấm. */}
            {laCaDeRieng && (
              <div style={{ marginTop: 'var(--k3)' }}>
                <button
                  type="button"
                  onClick={() => setMoSaiLai((v) => !v)}
                  aria-expanded={moSaiLai}
                  className="tap-target font-bold w-full"
                  style={{
                    ...SO,
                    textAlign: 'left',
                    minHeight: 48,
                    padding: 'var(--k3)',
                    borderRadius: 'var(--bo-1)',
                    background: tongKetLap.soEmCoLap === 0 ? 'var(--cam-nen)' : tongKetLap.tongSaiLai > 0 ? 'var(--do-nen)' : 'var(--xanh-nen)',
                    color: tongKetLap.soEmCoLap === 0 ? 'var(--cam)' : tongKetLap.tongSaiLai > 0 ? 'var(--do)' : 'var(--xanh)',
                    border: 'none',
                    fontSize: 'var(--cx-2)',
                  }}
                >
                  {tongKetLap.soEmCoLap === 0
                    ? 'Câu em sai buổi trước · chưa rút được câu nào'
                    : tongKetLap.tongSaiLai > 0
                      ? `${tongKetLap.emSaiLai.length} em còn sai lại câu từng sai · ${tongKetLap.tongSaiLai}/${tongKetLap.tongCauLap} câu`
                      : `Cả ${tongKetLap.soEmCoLap} em đã sửa được hết ${tongKetLap.tongCauLap} câu từng sai`}
                  <span style={{ ...NHAN_NHO, display: 'block', color: 'inherit', opacity: 0.85 }}>
                    {moSaiLai ? 'Bấm để gập lại' : tongKetLap.soEmCoLap === 0 ? 'Bấm để xem vì sao' : 'Bấm để xem chi tiết từng em, từng câu'}
                  </span>
                </button>

                {moSaiLai && (
                  <div className="flex flex-col" style={{ gap: 'var(--k2)', marginTop: 'var(--k2)' }}>
                    {bienBanLap && <BangBienBanLap bb={bienBanLap} tenCua={(sbd) => dsEm.find((e) => e.sbd === sbd)?.hoTen || ''} />}
                    {!bienBanLap && tongKetLap.soEmCoLap === 0 && (
                      <div style={{ ...NHAN_NHO, color: 'var(--cam)', lineHeight: 1.6 }}>
                        Máy này không giữ biên bản lúc rút đề. Bấm Bắt đầu ở máy khác thì biên bản nằm ở máy đó; mở lại ca sau khi máy chủ đã ghi bản đồ thì
                        bảng trên vẫn đếm đúng.
                      </div>
                    )}
                    {tongKetLap.emSaiLai.map((e) => (
                      <div key={`sailai-${e.sbd}`} style={{ background: 'var(--the-2)', borderRadius: 'var(--bo-1)', padding: 'var(--k3)' }}>
                        <div className="font-bold" style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', color: 'var(--muc)' }}>
                          {e.hoTen || `SBD ${e.sbd}`} <span style={{ ...NHAN_NHO, ...SO }}>· SBD {e.sbd}</span>
                        </div>
                        {/* GỌI ĐÚNG TÊN CON SỐ. Biên bản ghi "rút được 8" còn
                            chỗ này từng ghi "hỏi lại 9 câu" — thầy đọc ra hai số
                            vênh nhau (08/09). Cả hai đều đúng, chỉ đếm hai tập
                            khác nhau. Xem dem-cau-hoi-lai.ts. */}
                        <div style={{ ...NHAN_NHO, ...SO }}>
                          {dongSoCauHoiLai({
                            tong: e.lap!.tong,
                            daSua: e.lap!.daSua,
                            saiLai: e.lap!.saiLai,
                            rutChuDong: bienBanLap?.soLapCua?.[e.sbd] ?? null,
                          })}
                        </div>
                        <div className="flex flex-col" style={{ gap: 4, marginTop: 'var(--k2)' }}>
                          {e.lap!.saiLaiChiTiet.map((c) => (
                            <div key={`${e.sbd}-${c.qid}`} style={{ ...NHAN_NHO, color: 'var(--muc)' }}>
                              <b style={SO}>
                                Câu {c.soCau} phần {c.phan}
                              </b>
                              {c.chuyenDe ? ` · ${c.chuyenDe}` : ''} · <span style={{ color: 'var(--do)' }}>{c.soLanSai > 0 ? `sai lần thứ ${c.soLanSai}` : 'lại sai'}</span>
                              <span style={{ ...SO, display: 'block', color: 'var(--nhat)' }}>
                                đúng: {c.dapAnDung || '—'} · em chọn: {c.dapAnChon || 'bỏ trống'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {tongKetLap.emSachTron.length > 0 && (
                      <div style={{ ...NHAN_NHO, color: 'var(--xanh)' }}>
                        Sửa được hết: {tongKetLap.emSachTron.map((e) => e.hoTen || `SBD ${e.sbd}`).join(' · ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {chiTiet.biChan && chiTiet.biChan.length > 0 && (
              <div style={{ marginTop: 'var(--k3)' }}>
                <div style={{ ...NHAN_NHO, marginBottom: 'var(--k2)' }}>
                  Bị chặn ở cổng danh sách (<b style={SO}>{chiTiet.biChan.length}</b> lượt)
                </div>
                <div className="flex flex-col" style={{ gap: 'var(--k2)' }}>
                  {chiTiet.biChan.slice(0, 8).map((b, i) => (
                    <div key={`${b.luc}-${i}`} style={{ background: 'var(--cam-nen)', borderRadius: 'var(--bo-1)', padding: 'var(--k3)' }}>
                      <div className="font-bold" style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', color: 'var(--muc)' }}>
                        SBD <span style={SO}>{b.sbd}</span> · {moTaLyDoChan(b.lyDo)}
                      </div>
                      <div style={NHAN_NHO}>
                        Em gõ: <b>{b.hoTenGoi || '(trống)'}</b>
                        {b.namSinhGoi ? <> · sinh <span style={SO}>{b.namSinhGoi}</span></> : null}
                      </div>
                      <div style={NHAN_NHO}>
                        {b.hoTenDs ? (
                          <>
                            Danh sách: <b>{b.hoTenDs}</b>
                            {b.namSinhDs ? <> · sinh <span style={SO}>{b.namSinhDs}</span></> : null}
                          </>
                        ) : (
                          'Danh sách lớp không có số báo danh này'
                        )}
                        {b.luc ? <> · lúc <span style={SO}>{gio(b.luc)}</span></> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ marginTop: 'var(--k3)' }}>
              <div style={{ ...NHAN_NHO, marginBottom: 'var(--k2)' }}>Link gửi cho em</div>
              <div className="grid grid-cols-2" style={{ gap: 'var(--k2)' }}>
                <NutLinkCa
                  icon={daCopy ? <Check size={19} /> : <LogIn size={19} />}
                  ten={daCopy ? 'Đã copy' : 'Link vào thi'}
                  phu="Em bấm là vào phòng"
                  mau="var(--tim)"
                  nen="var(--tim-nen)"
                  daCopy={daCopy}
                  onClick={copyLink}
                />
                <NutLinkCa
                  icon={daCopyDiem ? <Check size={19} /> : <BarChart3 size={19} />}
                  ten={daCopyDiem ? 'Đã copy' : 'Link xem điểm'}
                  phu="Em xem điểm và báo cáo"
                  mau="var(--xanh)"
                  nen="var(--xanh-nen)"
                  daCopy={daCopyDiem}
                  onClick={copyLinkDiem}
                />
              </div>
              <div style={{ ...NHAN_NHO, marginTop: 'var(--k2)' }}>
                Link xem điểm: em chỉ nhập số báo danh, có trong danh sách lớp là mở đúng màn hình lúc vừa nộp
                bài. Gửi được sau khi đã dựng phiếu cho ca.
              </div>
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

          {/* GỌI LÊN BẢNG đã GỠ khỏi màn này (thầy chốt 05/09). Nó có màn riêng
              ở thanh điều hướng, chọn được nhiều đề và nhiều lớp. Nhét thêm
              vào đây thì màn coi thi dài gấp đôi, mà lúc đang coi thi thì thầy
              chưa chữa bài — chữa bài là việc sau khi ca xong. */}

          {/* DANH SÁCH EM */}
          <TheNoiDung>
            <div style={{ ...TIEU_DE_MUC, marginBottom: 'var(--k3)' }}>Học sinh trong ca ({dsEm.length})</div>
            {/* EM CHƯA CÓ TÊN (thầy báo 07/09). Em vào thi chỉ gõ số báo danh
                nên cột tên của lượt bỏ trống, và phiếu gửi phụ huynh in
                "SBD 10038" thay vì tên con. Danh sách lớp có sẵn tên, chỉ cần
                một nút kéo sang. Nút chỉ hiện khi thật sự có em thiếu tên. */}
            {emThieuTen.length > 0 && (
              <div style={{ background: 'var(--cam-nen)', borderRadius: 'var(--bo-1)', padding: 'var(--k3)', marginBottom: 'var(--k3)' }}>
                <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--muc)' }}>
                  <b style={SO}>{emThieuTen.length}</b> em trong ca chưa có họ tên, phiếu gửi phụ huynh sẽ in số báo danh thay cho tên con.
                </div>
                <button
                  type="button"
                  onClick={() => void dongBoTenChoCa()}
                  disabled={dangDongBoTen}
                  className="tap-target font-bold"
                  style={{ marginTop: 'var(--k2)', minHeight: 40, padding: '0 var(--k4)', borderRadius: 'var(--bo-tron)', background: 'var(--muc)', color: 'var(--muc-nguoc)', border: 'none', fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)' }}
                >
                  {dangDongBoTen ? 'Đang đồng bộ…' : 'Lấy tên từ danh sách lớp'}
                </button>
              </div>
            )}
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
                          {/* GIỮ ĐỂ ĐỌC (GIUDEDOC mục 4F): hai con số, KHÔNG tô
                              đỏ, KHÔNG gọi là vi phạm. Nhả tay là chuyện bình
                              thường; nhưng đề tắt 20 phút trong ca 50 phút là
                              điều thầy nên nhìn. */}
                          {chuTatDe(l.integrity) && <Nhan tone="xam">{chuTatDe(l.integrity)}</Nhan>}
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
                              /* NÓI RÕ NÓ XOÁ GÌ trước khi thầy bấm. Việc này
                                 KHÔNG khôi phục được: điểm, bài làm và chi tiết
                                 từng câu của lượt cũ mất hẳn. */
                              <span className="inline-flex flex-col" style={{ gap: 4 }}>
                                <span style={{ ...NHAN_NHO, color: 'var(--do)', lineHeight: 1.5 }}>
                                  Xoá hẳn điểm và bài làm lượt này của em, rút đề mới, và em chỉ vào lại được ở đúng máy cũ. Không khôi phục được.
                                </span>
                                <span className="inline-flex items-center" style={{ gap: 4 }}>
                                <button type="button" onClick={() => handleChoThiLai(e.sbd)} disabled={dangDuyet === e.sbd} className="tap-target font-bold" style={{ ...NHAN_NHO, minHeight: 32, padding: '0 10px', borderRadius: 'var(--bo-tron)', background: 'var(--do)', color: 'var(--muc-nguoc)' }}>
                                  {dangDuyet === e.sbd ? '…' : 'Xoá lượt cũ và cho thi lại'}
                                </button>
                                <button type="button" onClick={() => setXacNhanSbd(null)} className="tap-target" style={{ ...NHAN_NHO, minHeight: 32, padding: '0 10px', borderRadius: 'var(--bo-tron)', background: 'var(--the)' }}>
                                  Huỷ
                                </button>
                                </span>
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
                        {/* CA ĐỀ RIÊNG: câu hỏi lại của riêng em này. Luôn kèm
                            chữ, không dùng riêng màu. */}
                        {e.lap && e.lap.tong > 0 && (
                          <span className="block" style={{ ...NHAN_NHO, ...SO }}>
                            {e.lap.tong} hỏi lại · {e.lap.daSua} đã sửa · {e.lap.saiLai} sai lại
                          </span>
                        )}
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
              {/* LINK PHIẾU GỬI ZALO — một lệnh cho cả ca, thay vì mở phiếu
                  từng em rồi copy từng link. */}
              <button
                type="button"
                onClick={() => void handleCopyLinkPhieu()}
                disabled={dangGomLink}
                className="tap-target w-full inline-flex items-center justify-center font-bold"
                style={{ gap: 8, minHeight: 48, marginTop: 'var(--k2)', borderRadius: 'var(--bo-1)', background: 'var(--the-2)', border: 'none', color: 'var(--muc)', fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)' }}
              >
                {dangGomLink ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                {dangGomLink ? (tienTaoPhieu ? `Đang dựng phiếu ${tienTaoPhieu}…` : 'Đang lấy mã phiếu…') : 'Tạo & copy link phiếu gửi Zalo'}
              </button>
              {tomTatLink && <div style={{ ...NHAN_NHO, marginTop: 4, textAlign: 'center' }}>{tomTatLink}</div>}
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

          {/* CÂU HỎI CỦA EM (HOIBAITHAY.md mục 4C). Không gọi máy chủ cho tới
              khi thầy bấm — Chi tiết ca đã đủ nặng, thêm một lệnh nữa mỗi lần
              mở màn là đi ngược việc giảm tải vừa làm. */}
          {chiTiet && (
            <KhoiCauHoiEm
              scriptUrl={scriptUrl.trim()}
              secret={secret.trim()}
              maCa={chiTiet.ca.maCa}
              tenCa={chiTiet.ca.tenCa || ''}
              lop={chiTiet.ca.lop || ''}
              banks={teacherBank}
              showToast={showToast}
            />
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
/** MỘT THẺ LINK GỬI CHO EM. Cùng khuôn với cặp Mở ca / Khoá ca ngay trên nó:
 * cao 64, biểu tượng tròn bên trái, tên việc và dòng phụ xếp dọc bên phải.
 * Copy xong thì nền thẻ chuyển sang màu của chính việc đó — dấu hiệu nằm ở nơi
 * ngón tay vừa chạm, không phải ở dòng thông báo trôi qua. */
function NutLinkCa({ icon, ten, phu, mau, nen, daCopy, onClick }: { icon: React.ReactNode; ten: string; phu: string; mau: string; nen: string; daCopy: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ten}
      className="tap-target flex items-center"
      style={{
        minHeight: 64,
        gap: 'var(--k2)',
        padding: '0 var(--k3)',
        borderRadius: 'var(--bo-3)',
        border: `1.5px solid ${daCopy ? mau : 'var(--vien)'}`,
        textAlign: 'left',
        background: daCopy ? nen : 'var(--the-2)',
        color: 'var(--muc)',
        transitionProperty: 'background-color, border-color',
        transitionDuration: 'var(--nhanh)',
      }}
    >
      <span className="flex items-center justify-center shrink-0" style={{ width: 36, height: 36, borderRadius: 'var(--bo-tron)', background: daCopy ? mau : nen, color: daCopy ? 'var(--muc-nguoc)' : mau }}>
        {icon}
      </span>
      <span className="flex flex-col" style={{ gap: 1, minWidth: 0 }}>
        <span className="font-bold truncate" style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)' }}>
          {ten}
        </span>
        <span className="truncate" style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-0)', color: 'var(--nhat)' }}>
          {phu}
        </span>
      </span>
    </button>
  )
}

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
