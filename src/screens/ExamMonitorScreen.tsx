// CHI TIẾT MỘT CA THI (QUANLYCATHI.md mục 2 + 5, nền cho mục 6): đi từ Lịch
// sử ca thi hoặc ngay sau khi mở ca. Dữ liệu lượt thi từ máy chủ
// (chiTietCa); ĐIỂM chấm tại máy thầy bằng ngân hàng CÓ đáp án đã lưu khi mở
// ca (đáp án không rời máy thầy) rồi tự ghi điểm + chi tiết từng câu lên
// Sheet (ghiDiem) để phân tích về sau. Mỗi em một hàng `.ca-hang` kèm <Nhan>:
// xám chờ thi lại · tím đang làm · cam rời màn N lần · đỏ bị khoá · xanh đã nộp.
// Xoá ca = xoá mềm, phải gõ đúng mã ca.
import { useEffect, useMemo, useRef, useState } from 'react'
import { demKetQua } from '../lib/dem-ket-qua'
import { goiBaiThi } from '../lib/goi-bao-cao'
import { Check, RefreshCw, Trash2, ChevronRight, Lock, Unlock, Pencil, LogIn, BarChart3, ArrowLeft } from 'lucide-react'
import BaoCaoCaThiHocSinhModal from '../components/BaoCaoCaThiHocSinhModal'
import { Nhan, OThongBao, NutChinh, TheNoiDung } from '../components/DesignSystem'
import { classify } from '../engine/score'
import { danhSachCa, type CaTomTat, batDauThi, capNhatKeyBank, chiTietCa, doiTenCa, dongBoTenCa, moTaLyDoChan, ghiDiem, khoaCa, moKhoa, moKhoaCa, sendTeacherMessage, xoaCa, type ChiTietCa, type ChiTietCauRow, type LuotThiRow, type PhamViCa, type CongBoDiem, khoiTuNamSinh } from '../lib/exam-api'
import { chuanTenCa, tenHienCua, TEN_CA_TOI_DA } from '../lib/ten-ca'
import { taoBaiGhiDiem, taoChiTietCau } from '../lib/chi-tiet-cau'
import { emLechDiem, loiBaoLechDiem } from '../lib/lech-diem'
import { dongSoCauHoiLai } from '../lib/dem-cau-hoi-lai'
import { maCaLay, vaBienBanCu } from '../lib/va-bien-ban-cu'
import { sinhBoTheoEm, TEN_MUC_PHAN_TANG } from '../lib/de-rieng-blueprint'
import { docCheDoDeRieng, docDeRiengCa, docSoCauCa, loadScriptUrl, loadSessionTeacherBank, luuDeRiengCa, luuSoCauCa, saveSessionTeacherBank, loadTeacherSecret, type BienBanDeRieng, type DeRiengCaLuu } from '../lib/exam-db'
import { loiKhongTimThayCa } from '../lib/cau-chu-ca'
import { CHU_LY_DO_THIEU } from '../lib/de-rieng'
import { CAU_HINH_DE_RIENG_MAC_DINH } from '../lib/cau-hinh-de-rieng'
import { dungDeRiengChoCa, dungLapTuMayChu } from '../lib/de-rieng-nguon'
import { choEmThiLai } from '../lib/thi-lai'
import { gradeSubmissionFull, type GradedSubmission } from '../lib/exam-grade'
import { gioMayChu } from '../lib/gio-may-chu'
import { soanTinRoiMan } from '../lib/tin-nhan-thay'
import KhoiCauHoiEm from '../components/KhoiCauHoiEm'
import { hoSoEm, type HoSoEm } from '../lib/exam-api'
import { mergeKeepAnswers, type SoCauMoiPhan, type TeacherExamSource } from '../data/examContent'
import { chuTatDe } from '../lib/giu-de-doc'
import { useAppStore } from '../store/appStore'
import { cuaVaoCa } from '../lib/cua-vao-ca'
import { trangThaiCa } from './LichSuCaScreen'
import KhoiThoiGianCa from '../components/KhoiThoiGianCa'
import TamPhuChieuMa from '../components/TamPhuChieuMa'
import { themPhutCa, cauKetQuaThemPhut } from '../lib/them-phut-api'
import ThanhTabCa, { type MucTabCa } from '../components/ThanhTabCa'
import { demCauDaLam, tongSoCauCa } from '../lib/con-lai-ca'
import './ca-thi-m3.css'
import BaoCaoCaLopKhoi from '../components/xem-diem-gv/BaoCaoCaLop'
import { tinhBaoCaoCaLop } from '../lib/bao-cao-ca-lop'

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
            ? `mỗi em lấy tối đa 3 ca gần nhất CHÍNH EM có nộp — đã dò ${bb.caDaQuet.length} ca: ${bb.caDaQuet.join(' · ')}`
            : `lấy ca gần nhất em có nộp — đã dò ${bb.caDaQuet.length} ca: ${bb.caDaQuet.join(' · ')}`}
        {bb.lucRut ? ` · rút lúc ${ngayGio(bb.lucRut)}` : ''}
      </div>
      {/* PHẠM VI QUÉT — thầy phải đọc được đã quét ĐÚNG thư mục chưa.
          Ngày 10/09 cả lớp ra "mới vào lớp, chưa có ca nào" chỉ vì tên ca không
          còn bắt đầu bằng năm sinh nên bộ lọc tự tắt và quét sang khối khác.
          Máy biết chuyện đó ngay lúc chạy mà không nói ra một chữ. */}
      {bb.nguonNam !== undefined && (
        <div
          style={{
            ...NHAN_NHO,
            ...SO,
            color: bb.nguonNam === 'khong_xac_dinh' ? 'var(--do)' : 'var(--nhat)',
            marginTop: 2,
            lineHeight: 1.6,
          }}
        >
          {bb.nguonNam === 'khong_xac_dinh'
            ? '⚠ KHÔNG xác định được năm sinh của ca này (hồ sơ em thiếu năm sinh, và tên ca không bắt đầu bằng năm) — đã quét MỌI khối, câu hỏi lại có thể lấy nhầm lớp. Sửa: đặt tên ca dạng "2009 - Lớp 1 - L3".'
            : `thư mục năm sinh ${bb.namQuet} · ${bb.soCaThuMuc ?? 0} ca trong thư mục · nguồn năm sinh: ${bb.nguonNam === 'hoc_sinh' ? 'hồ sơ học sinh' : 'tên ca'}`}
        </div>
      )}
      {bb.boQua.length > 0 && (
        <div style={{ ...NHAN_NHO, color: 'var(--cam)', marginTop: 4, lineHeight: 1.6 }}>
          Ca không đọc được: {bb.boQua.map((b) => `${b.maCa} (${b.vi_sao})`).join(' · ')}
        </div>
      )}
      {/* GHI CHÚ LÚC RÚT (19/09). Tin thầy CẦN LÀM GÌ ĐÓ (kho mỏng, hồ sơ không đọc
          được) in cam; tin tốt (em vắng đã có đề sẵn, em đã tự khắc phục) in màu
          thường. Biên bản cũ không có `ghiChu` thì khối này không in gì. */}
      {(bb.ghiChu ?? []).map((g, i) => (
        <div key={`ghi-chu-${i}`} style={{ ...NHAN_NHO, color: g.loai === 'canh_bao' ? 'var(--cam)' : 'var(--nhat)', marginTop: 4, lineHeight: 1.6 }}>
          {g.loai === 'canh_bao' ? '⚠ ' : ''}
          {g.loi}
        </div>
      ))}
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
  // TAB LỌC danh sách em (G4): chỉ đổi cái được hiện. Mặc định 'tat_ca' để thầy không bị ẩn em nào lúc mới mở.
  const [tabEm, setTabEm] = useState('tat_ca')
  // CHIẾU MÃ VÀO THI (thầy duyệt 21/09): tấm phủ toàn màn cho máy chiếu.
  const [chieuMa, setChieuMa] = useState(false)
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
  const [gioChungTheoCa, setGioChungTheoCa] = useState<Record<string, boolean>>({})
  const [hoiHuy, setHoiHuy] = useState(false)
  // Đã ghi điểm lên Sheet cho lượt nào (khoá `${sbd}:${lanThu}:${nopLuc}`) — không ghi lặp mỗi lần tải lại.
  const daGhiRef = useRef<Set<string>>(new Set())
  /** Ca nào đã vá khoá `key/<maCa>.json` rồi — vá một lần là đủ. */
  const daVaKeyRef = useRef<Set<string>>(new Set())

  // Nạp hồ sơ khi thầy chạm tên một em. Chỉ nạp khi thật sự mở — hồ sơ tốn
  // 2–4 giây một lượt gọi máy chủ, nạp sẵn cho cả lớp là phí.
  useEffect(() => {
    if (!sbdHoSo || !scriptUrl.trim() || !secret.trim()) {
      setHoSo(null)
      return
    }
    let huy = false
    // KHÔNG NUỐT LỖI: thẻ hiện lỗi đã bỏ theo lệnh thầy (báo cáo chỉ còn bốn
    // thẻ), nên báo thẳng bằng toast thay vì cất vào một biến không ai đọc.
    hoSoEm(scriptUrl.trim(), { secret: secret.trim(), sbd: sbdHoSo })
      .then((h) => !huy && setHoSo(h))
      .catch((e) => !huy && showToast(e instanceof Error ? e.message : 'Không mở được hồ sơ', 'error'))
    return () => {
      huy = true
    }
  }, [sbdHoSo, scriptUrl, secret])

  const [dsCaGoiY, setDsCaGoiY] = useState<CaTomTat[]>([])

  useEffect(() => {
    loadScriptUrl().then(setScriptUrl)
    loadTeacherSecret().then(setSecret)
  }, [])

  useEffect(() => {
    if (!chiTiet) {
      Promise.all([loadScriptUrl(), loadTeacherSecret()])
        .then(([u, m]) => {
          if (u.trim() && m.trim()) {
            return danhSachCa(u.trim(), m.trim(), false)
          }
          return []
        })
        .then((list) => {
          if (list && list.length > 0) {
            setDsCaGoiY(list.slice(0, 8))
          }
        })
        .catch(() => {})
    }
  }, [chiTiet, scriptUrl, secret])

  const tai = async (ma: string, imLang = false) => {
    const url = (scriptUrl || (await loadScriptUrl())).trim()
    const mat = (secret || (await loadTeacherSecret())).trim()
    if (!url) return setLoi('Chưa cấu hình địa chỉ máy chủ — vào Ngân hàng câu hỏi → Cấu hình')
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
      const msg = e instanceof Error ? e.message : 'lỗi không rõ'
      if (msg.includes('Không tìm thấy ca kiểm tra')) {
        setLoi(loiKhongTimThayCa(ma, dsCaGoiY.length > 0))
      } else {
        setLoi(`Không tải được ca: ${msg}`)
      }
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

  // BÁO CÁO CẢ LỚP (Xem điểm bản 2 · GV-1): chỉ GOM số đã có ở máy này — điểm đã chấm + bảng chấm từng câu của em đã nộp. Không chấm lại, không gọi mạng.
  const baoCaoLop = useMemo(() => {
    if (!chiTiet) return null
    let bank: ReturnType<typeof mergeKeepAnswers> | null = null
    try {
      bank = teacherBank ? mergeKeepAnswers(teacherBank, soCauCa, boTheoEmDung) : null
    } catch {
      bank = null
    }
    const em = dsEm.map((e) => {
      let rows: ChiTietCauRow[] | null = null
      if (bank && e.graded && e.moiNhat.dapAn) {
        try {
          rows = taoChiTietCau(bank, chiTiet.ca.maCa, e.sbd, e.moiNhat.dapAn, e.moiNhat.giayCau)
        } catch {
          rows = null
        }
      }
      return { sbd: e.sbd, hoTen: e.hoTen, lop: e.lop, trangThai: e.moiNhat.trangThai, diem: e.diem, score: e.graded?.score ?? null, vaoLuc: e.moiNhat.vaoLuc, nopLuc: e.moiNhat.nopLuc, soLanRoiMan: e.moiNhat.soLanRoiMan, tongGiayRoiMan: e.moiNhat.tongGiayRoiMan, rows }
    })
    return tinhBaoCaoCaLop(em, dsEm.length)
  }, [chiTiet, dsEm, teacherBank, soCauCa, boTheoEmDung])

  // VÁ NGƯỢC KHOÁ `key/<maCa>.json` CHO CA CŨ — TỰ LÀNH KHI THẦY MỞ MÀN.
  //
  // Trước 12/09, ngân hàng CÓ đáp án chỉ được đẩy lên máy chủ khi ca công bố
  // NGAY. Ca 195422 sáng 12/09 đặt `ca_lop_xong`, nên máy chủ không có khoá ấy
  // và LINK XEM ĐIỂM của cả ca báo "Máy chủ chưa gửi đề của ca này".
  //
  // 15/09: việc này TỪNG nằm trong `handleTaiPhieuHangLoat` của thẻ "Xuất kết
  // quả". Thầy chốt gỡ thẻ ấy, nên nó phải dọn ra đây — nó KHÔNG dính gì tới
  // việc xuất phiếu, chỉ tình cờ ở nhờ trong đó. Gỡ mà không dọn là ca cũ mất
  // đường tự lành trong im lặng.
  //
  // Chạy MỘT LẦN mỗi ca: `daVaKeyRef` chặn lặp mỗi lần màn vẽ lại. Lệnh
  // `capNhatKeyBank` chỉ ghi MỘT đối tượng R2, không đụng dòng ca. Hỏng thì im
  // lặng — đây là việc vá nền, không được chặn màn của thầy.
  useEffect(() => {
    if (!chiTiet || !teacherBank || teacherBank.length === 0) return
    const ma = chiTiet.ca.maCa
    if (daVaKeyRef.current.has(ma)) return
    daVaKeyRef.current.add(ma)
    const keyBank = mergeKeepAnswers(teacherBank, soCauCa, boTheoEmDung)
    void capNhatKeyBank(scriptUrl, secret, chiTiet.ca.maCa, keyBank).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chiTiet, teacherBank, soCauCa])

  // Tự ghi điểm + chi tiết từng câu (mục 5) cho lượt vừa chấm được mà chưa ghi.
  useEffect(() => {
    if (!chiTiet || !teacherBank) return
    const bank = mergeKeepAnswers(teacherBank, soCauCa, boTheoEmDung)
    const can = dsEm.filter((e) => e.graded && !daGhiRef.current.has(`${e.sbd}:${e.moiNhat.lanThu}:${e.moiNhat.nopLuc}`))
    if (can.length === 0) return
    const bai = can.map((e) => taoBaiGhiDiem(bank, chiTiet.ca.maCa, e.sbd, e.moiNhat.lanThu, e.moiNhat.dapAn!, e.graded!, e.moiNhat.giayCau))
    let huy = false
    // MẪU SỐ đã dùng để chấm — lấy từ CHÍNH bank vừa gộp, không lấy `soCauCa`
    // thô, để con số khai lên máy chủ đúng bằng con số đã chia. Xem `ghiDiem`.
    ghiDiem(scriptUrl.trim(), secret.trim(), chiTiet.ca.maCa, bai, {
      I: bank.phanI.length,
      II: bank.phanII.length,
      III: bank.phanIII.length,
    })
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
      phan.push(kq.khoaMay ? 'chỉ vào được ở máy cũ (máy cũ hỏng thì bấm "Cho vào bằng máy khác")' : 'lượt cũ không ghi máy nên KHÔNG khoá được máy')
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

  // CHO VÀO BẰNG MÁY KHÁC: sau "Cho thi lại" em chỉ vào được ĐÚNG MÁY CŨ; máy cũ hỏng / mất thì thầy gỡ khoá máy. Cùng lệnh `moKhoa` của
  // máy chủ (lượt vẫn chờ thi lại, chỉ xoá id máy — đề mới giữ nguyên). Máy chủ báo `goKhoaMay`: nói ĐÚNG kết quả, không mặc định là đã gỡ.
  const [xacNhanMayKhac, setXacNhanMayKhac] = useState<string | null>(null)
  const handleChoVaoMayKhac = async (sbd: string) => {
    if (!chiTiet) return
    setXacNhanMayKhac(null)
    setDangDuyet(sbd)
    try {
      const kq = await moKhoa(scriptUrl.trim(), secret.trim(), chiTiet.ca.maCa, sbd)
      if (kq.goKhoaMay === true) showToast('Đã gỡ khoá máy: em đăng nhập lại bằng MÁY KHÁC là vào được (đề mới giữ nguyên)', 'success')
      else if (kq.goKhoaMay === false) showToast('Lượt này không còn khoá máy (đã gỡ trước đó, hoặc lượt cũ không ghi máy) — em vào được ở máy nào cũng được', 'warn')
      else showToast('Đã gửi lệnh nhưng máy chủ chưa báo có gỡ khoá máy hay không — nhờ em thử vào bằng máy khác, không được thì báo thầy', 'warn')
      await tai(chiTiet.ca.maCa, true)
    } catch (e) {
      showToast(`Không gỡ được khoá máy: ${e instanceof Error ? e.message : 'lỗi không rõ'}`, 'error')
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
        // ĐÚNG NHỮNG EM TRONG PHÒNG CHỜ — không ∪ cả lớp đăng ký (vá 19/09). Bản 17/09
        // gộp thêm mọi em cùng lớp: em vắng cũng chiếm một suất chia vòng tròn, nên
        // kho mỏng bị chia cho 40 em trong khi chỉ 25 em ngồi thi — đỉnh trùng của
        // các em CÓ MẶT cao lên vô cớ, và biên bản đếm "thiếu câu hỏi lại" cho cả em
        // không tới. Em vào sau khi bấm Bắt đầu rơi về bốc theo hash như ca thường.
        const dsCho = (chiTiet.dsCho ?? []).map((x) => x.sbd).filter(Boolean)
        if (dsCho.length === 0) {
          showToast('Chưa em nào vào phòng chờ — chưa rút được đề riêng.', 'error')
          setDangBatDau(false)
          return
        }
        // PHẠM VI thầy chọn lúc mở ca, đọc từ máy chủ nên máy nào bấm Bắt đầu
        // cũng rút đúng thứ thầy đã chốt.
        const pv = (chiTiet.ca as { phamViHoiLai?: 'gan_nhat' | 'ba_ca' }).phamViHoiLai === 'ba_ca' ? 'ba_ca' : 'gan_nhat'
        // LƯỢT HAI (19/09): em CÙNG LỚP chưa kịp vào phòng chờ vẫn được chuẩn bị đề
        // riêng, nhưng tính SAU khi mọi em trong `dsCho` đã chốt — không chiếm suất
        // chia của ai, không vào con số nào của biên bản. Ca không ghi lớp thì thôi.
        const ra = await dungDeRiengChoCa(scriptUrl.trim(), secret.trim(), chiTiet.ca.maCa, dsCho, { ...CAU_HINH_DE_RIENG_MAC_DINH, PHAM_VI_HOI_LAI: pv }, { lopCa: chiTiet.ca.lop })
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
          namQuet: ra.namQuet,
          cauGocTheoEm: ra.cauGocTheoEm,
          songSinhTheoEm: ra.songSinhTheoEm,
          ghiChu: ra.ghiChu,
          lucRut: new Date().toISOString(),
        }
        demSai = ra.lapCua
        await luuDeRiengCa(chiTiet.ca.maCa, ra.boTheoEm, ra.lapCua, ra.lapTheoEm, bienBan)
        const tongSongSinh = Object.values(ra.songSinhTheoEm ?? {}).reduce((s, a) => s + (a?.length ?? 0), 0)
        if (tongSongSinh > 0) showToast(`Đã sinh ${tongSongSinh} câu song sinh cùng dạng đổi số chống học vẹt.`, 'success')
        if (ra.cauNoiThem.soCau > 0) showToast(`Đã kéo ${ra.cauNoiThem.soCau} câu em từng sai từ kho vào đề ca này.`, 'success')
        if (ra.thieu.length > 0) showToast(`${ra.thieu.length} em không đủ câu hỏi lại — xem chi tiết trong ca.`, 'warn')
      }
      // CHẶN TRẦN TRÙNG CÂU — DE-RIENG-CHAN-TRAN-TRUNG.md.
      //
      // Ca thường (không phải ca chẩn đoán) mà có phòng chờ thì ĐÚNG LÚC NÀY là
      // chỗ duy nhất biết chính xác em nào đang ngồi trong phòng. Bốc độc lập
      // theo `hash(maCa:sbd)` luôn để lọt một cặp xui xẻo trùng 3–7 lần trung
      // bình (đo được: kho 600 câu vẫn còn cặp chung 3–4 câu). Điều phối cả lớp
      // một lượt thì chặn được cái đuôi đó, và kho đủ lớn thì trùng bằng 0.
      //
      // Không đụng ca chẩn đoán: ca đó đã có bản đồ riêng theo hồ sơ từng em.
      // Em vào sau khi bấm Bắt đầu không có tên trong bản đồ ⇒ rơi về bốc độc
      // lập như cũ, vẫn thi được, chỉ là không được bảo đảm trần trùng.
      let bcTranTrung: string[] = []
      if (!caCanDeRieng && !boTheoEm) {
        const dsCho = (chiTiet.dsCho ?? []).map((x) => x.sbd).filter(Boolean)
        const kho = teacherBank ?? []
        const sc = soCauCa
        if (dsCho.length >= 2 && kho.length > 0 && sc && sc.I + sc.II + sc.III > 0) {
          try {
            const ra = sinhBoTheoEm(kho, dsCho, sc, chiTiet.ca.maCa)
            if (Object.keys(ra.boTheoEm).length > 0) {
              boTheoEm = ra.boTheoEm
              bcTranTrung = [
                ra.dinhTrung === 0
                  ? `Đề riêng từng em: KHÔNG cặp nào trùng câu nào (${dsCho.length} em, chia theo ${TEN_MUC_PHAN_TANG[ra.mucPhanTang]}).`
                  : `Đề riêng từng em: cặp trùng nhiều nhất ${ra.dinhTrung} câu (${dsCho.length} em, chia theo ${TEN_MUC_PHAN_TANG[ra.mucPhanTang]})` +
                    (ra.thieuDeVeKhong > 0 ? `. Muốn về 0 cần thêm ${ra.thieuDeVeKhong} câu vào kho.` : '.'),
                ...ra.canhBao,
              ]
            }
          } catch (e) {
            // KHÔNG NUỐT: hỏng thì ca vẫn chạy bằng luật cũ, nhưng thầy phải biết.
            bcTranTrung = ['Không dựng được đề riêng chặn trùng — ca chạy theo luật cũ. ' + (e instanceof Error ? e.message : '')]
          }
        }
      }
      const kq = await batDauThi(scriptUrl.trim(), secret.trim(), chiTiet.ca.maCa, boTheoEm, lapTheoEm, demSai, bienBan as unknown as Record<string, unknown>, gioChungTheoCa[chiTiet.ca.maCa] ?? chiTiet.ca.dongBoGio ?? false)
      for (const d of bcTranTrung) showToast(d, d.startsWith('Không dựng được') ? 'error' : 'success')
      if (kq.thieuBoTheoEm) {
        // KHÔNG NUỐT. Ca đã phát đề trước khi có bản đồ ⇒ em làm một bộ câu,
        // máy thầy chấm một bộ khác. Ghi đè bản đồ lúc này còn tệ hơn, nên
        // việc duy nhất đúng là báo thầy mở ca lại.
        showToast('Ca này đã phát đề TRƯỚC khi có bộ câu riêng — điểm chấm sẽ sai. Huỷ ca và mở lại.', 'error')
      } else {
        showToast(kq.daBatTruoc ? 'Ca này đã bắt đầu từ trước.' : 'Đã bắt đầu — cả lớp hiện đề ngay bây giờ.', 'success')
      }
      // KHÔNG NUỐT. Mốc bắt đầu chưa sang máy chủ mới thì cả lớp tụt về đường
      // cũ suốt ca — chạy được, nhưng chậm như trước và thầy phải biết.
      if (kq.chuaSangMayChuMoi) {
        showToast('Mốc bắt đầu CHƯA sang máy chủ mới — cả lớp sẽ chạy bằng đường cũ. Bấm Bắt đầu lại một lần.', 'error')
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

  // ---------------------------------------------------------- TAB LỌC DANH SÁCH EM (G4)
  // Mọi số ở tab là ĐẾM từ dữ liệu ca đã có (lượt, phòng chờ, danh sách mời) — không gọi thêm lệnh nào.
  const sbdDaCoLuot = new Set(dsEm.map((e) => e.sbd))
  const emChoVao = (chiTiet?.dsCho ?? []).filter((x) => !sbdDaCoLuot.has(x.sbd))
  const emChuaVao =
    chuaVao === null || !chiTiet || !Array.isArray(chiTiet.ca.danhSachMoi)
      ? []
      : (chiTiet.ca.danhSachMoi as unknown[]).map((x) => String(x)).filter((sbd) => !sbdDaCoLuot.has(sbd))
  const mucTab: MucTabCa[] = [
    { ma: 'tat_ca', nhan: 'Tất cả', so: dsEm.length },
    { ma: 'dang_lam', nhan: 'Đang làm', so: dangLamNgay },
    ...(chiTiet?.ca.phongCho || emChoVao.length > 0 ? [{ ma: 'cho', nhan: 'Phòng chờ', so: emChoVao.length }] : []),
    { ma: 'da_nop', nhan: 'Đã nộp', so: tk?.daNop ?? 0 },
    ...(chuaVao !== null ? [{ ma: 'chua_vao', nhan: 'Chưa vào', so: emChuaVao.length }] : []),
  ]
  const tabHieu = mucTab.some((m) => m.ma === tabEm) ? tabEm : 'tat_ca'
  const dsHienThi =
    tabHieu === 'dang_lam'
      ? dsEm.filter((e) => e.moiNhat.trangThai === 'dang_lam')
      : tabHieu === 'da_nop'
        ? dsEm.filter((e) => e.moiNhat.trangThai === 'da_nop' || e.moiNhat.trangThai === 'khoa')
        : dsEm
  const tongCauDe = tongSoCauCa(soCauCa)

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

  // ---------------------------------------------------------- HỒ SƠ MỘT EM (MODAL BÁO CÁO CHUẨN GOOGLE MATERIAL 3)
  // Thay toàn bộ màn chi tiết cũ bằng modal Báo cáo ca thi chuẩn Google Material 3 của học sinh
  const emTrongCa = useMemo(() => {
    if (!sbdHoSo) return null
    return dsEm.find((e) => e.sbd === sbdHoSo) || null
  }, [sbdHoSo, dsEm])

  const rowsHoSo: ChiTietCauRow[] | null = useMemo(() => {
    if (!sbdHoSo || !chiTiet || !teacherBank || !emTrongCa?.moiNhat.dapAn) return null
    try {
      return taoChiTietCau(
        mergeKeepAnswers(teacherBank, soCauCa, boTheoEmDung),
        chiTiet.ca.maCa,
        sbdHoSo,
        emTrongCa.moiNhat.dapAn,
        emTrongCa.moiNhat.giayCau
      )
    } catch {
      return null
    }
  }, [sbdHoSo, chiTiet, teacherBank, emTrongCa, soCauCa, boTheoEmDung])

  // ĐẾM BẢNG CHẤM BẰNG ĐÚNG LUẬT DÙNG CHUNG CHO CẢ BA APP.
  //
  // Đếm từ `rowsHoSo` — chính bảng chấm đang bày trên màn — chứ không đếm lại
  // từ `graded.score.items`: hai nguồn là hai con số, và đó là cách bản trước
  // in "Đúng 4/12 câu (sai 5 câu)" trên cùng một dòng.
  const demBangCham = useMemo(() => (rowsHoSo ? demKetQua(rowsHoSo) : null), [rowsHoSo])

  return (
    <div className="gv-page min-h-screen pb-28 px-3 sm:px-4 pt-4 flex flex-col" style={{ background: 'var(--nen)', color: 'var(--muc)', gap: 'var(--k4)', fontFamily: 'var(--sans)' }}>
      <div className="gv-page-header flex items-center justify-between" style={{ gap: 'var(--k3)' }}>
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
              aria-label="Tên ca kiểm tra"
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
              aria-label="Sửa tên ca kiểm tra"
            >
              <h1 className="font-bold truncate" style={{ fontSize: 'var(--cx-5)', fontFamily: 'var(--serif)' }}>
                {chiTiet ? tenHienCua(chiTiet.ca.tenCa, chiTiet.ca.maCa) : 'Chi tiết ca kiểm tra'}
              </h1>
              {chiTiet && <Pencil size={16} className="shrink-0" style={{ color: 'var(--nhat)' }} />}
            </button>
            <span className="flex items-center shrink-0" style={{ gap: 'var(--k2)' }}>
            {chiTiet && (
              <button type="button" className="ca-nut-chieu" onClick={() => setChieuMa(true)}>
                Chiếu mã vào thi
              </button>
            )}
            <button
              type="button"
              onClick={() => setScreen('lichsuca')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 shadow-2xs font-semibold text-xs transition cursor-pointer active:scale-95 shrink-0"
              aria-label="Quay lại Lịch sử ca"
            >
              <ArrowLeft size={15} className="text-slate-600 dark:text-slate-300" />
              <span>Lịch sử ca</span>
            </button>
            </span>
          </>
        )}
      </div>

      {!chiTiet && (
        <TheNoiDung>
          <div style={{ ...TIEU_DE_MUC, marginBottom: 'var(--k3)' }}>Nhập mã ca</div>
          <div className="flex items-center" style={{ gap: 'var(--k3)' }}>
            <input style={{ ...O_NHAP, ...SO }} placeholder="Mã ca (6 số)" value={maCa} onChange={(e) => setMaCa(e.target.value)} inputMode="numeric" onKeyDown={(e) => e.key === 'Enter' && tai(maCa)} />
            <button type="button" onClick={() => tai(maCa)} disabled={dangTai} className="tap-target shrink-0 font-bold active:scale-95 transition cursor-pointer" style={{ height: 52, padding: '0 var(--k5)', borderRadius: 'var(--bo-1)', background: 'var(--muc)', color: 'var(--muc-nguoc)' }}>
              {dangTai ? '…' : 'Tải'}
            </button>
          </div>
          {loi && (
            <div style={{ marginTop: 'var(--k3)' }}>
              <OThongBao tone="do">{loi}</OThongBao>
            </div>
          )}

          {dsCaGoiY.length > 0 && (
            <div className="mt-5 pt-4 border-t border-dashed border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <span style={NHAN_NHO} className="font-semibold text-slate-700 dark:text-slate-300">
                  Hoặc chọn nhanh ca gần đây:
                </span>
                <button
                  type="button"
                  onClick={() => setScreen('lichsuca')}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  Xem tất cả ca kiểm tra <ChevronRight size={14} />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {dsCaGoiY.map((c) => (
                  <button
                    key={c.maCa}
                    type="button"
                    onClick={() => {
                      setMaCa(c.maCa)
                      tai(c.maCa)
                    }}
                    className="tap-target flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-left transition cursor-pointer active:scale-98"
                  >
                    <div className="min-w-0 flex-1 mr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                          #{c.maCa}
                        </span>
                        {c.lop && (
                          <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {c.lop}
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate mt-1">
                        {c.tenCa || 'Ca kiểm tra'}
                      </div>
                    </div>
                    <Nhan tone={c.trangThai === 'mo' ? 'tim' : 'xam'}>
                      {c.trangThai === 'mo' ? 'Đang mở' : 'Đã đóng'}
                    </Nhan>
                  </button>
                ))}
              </div>
            </div>
          )}
        </TheNoiDung>
      )}

      {chiTiet && tk && tt && (
        <>
          <div className="ca-luoi">
          <div className="ca-cot ca-cot-phai">
          <KhoiThoiGianCa
            ca={chiTiet.ca}
            themPhut={{
              tong: chiTiet.themPhutTong,
              chay: () => themPhutCa(chiTiet.ca.maCa),
              onXong: (k) => {
                showToast(cauKetQuaThemPhut(k), 'success')
                void tai(chiTiet.ca.maCa, true) // tải lại: giờ hết chung mới (thoiGianPhut đã cộng) hiện ngay ở đồng hồ
              },
            }}
          />
          {/* THÔNG TIN CA */}
          <TheNoiDung className="gv-monitor-overview">
            <div className="gv-page-header flex items-start justify-between flex-wrap" style={{ gap: 'var(--k3)' }}>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-black text-xl sm:text-2xl text-blue-600 dark:text-blue-400 tracking-wider">
                    #{chiTiet.ca.maCa}
                  </span>
                  {chiTiet.ca.lop && (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700">
                      Lớp {chiTiet.ca.lop}
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                    {chiTiet.ca.thoiGianPhut} phút
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600 dark:text-slate-300">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80">
                    <span className="text-slate-400">Bắt đầu:</span>
                    <span style={SO} className="font-semibold">{ngayGio(chiTiet.ca.batDau || chiTiet.ca.moLuc)}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80">
                    <span className="text-slate-400">Vào phòng đến:</span>
                    <span style={SO} className="font-semibold">{chiTiet.ca.hetHanVao ? gio(chiTiet.ca.hetHanVao) : 'không giới hạn'}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/80 font-medium">
                    Khoá rời màn: {chiTiet.ca.nguongLan ?? 3} lần / {chiTiet.ca.nguongGiay ?? 30}s
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800/80 font-medium">
                    {TEN_CONG_BO[chiTiet.ca.congBo]} · {TEN_PHAM_VI[chiTiet.ca.phamVi]}
                    {chiTiet.ca.phamVi === 'khoi' ? ` (sinh ${chiTiet.ca.danhSachMoi} → K${khoiTuNamSinh(String(chiTiet.ca.danhSachMoi)) ?? '?'})` : ''}
                    {chiTiet.ca.phamVi === 'chon' && Array.isArray(chiTiet.ca.danhSachMoi) ? ` (${chiTiet.ca.danhSachMoi.length} em)` : ''}
                  </span>
                </div>
              </div>

              {/* Nhãn trạng thái và Nút làm mới cùng một cụm cân xứng */}
              <div className="shrink-0 flex items-center gap-2">
                <Nhan tone={tt.tone}>{tt.ten}</Nhan>
                <button
                  type="button"
                  onClick={() => tai(chiTiet.ca.maCa)}
                  disabled={dangTai}
                  className="tap-target inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition shadow-2xs text-xs font-bold cursor-pointer active:scale-95 disabled:opacity-50"
                  aria-label="Làm mới ca kiểm tra"
                  title="Làm mới dữ liệu ca kiểm tra"
                >
                  <RefreshCw size={13} className={dangTai ? 'animate-spin' : ''} />
                  <span>Làm mới</span>
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
                Hai nút đúng như thầy chốt: Bắt đầu thi và Huỷ ca kiểm tra (đổi chữ 21/09). */}
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
                    Ca này hỏi lại câu em từng sai. Bấm Bắt đầu thì A.I Đỗ Đại Học rút bộ câu riêng cho đúng {(chiTiet.dsCho ?? []).length} em đang chờ — em vào sau đó nhận đề theo luật bốc ngẫu nhiên như ca thường.
                  </div>
                )}
                {chiTiet.ca.loai !== 'baitap' && (
                  <label className="flex items-start" style={{ gap: 'var(--k2)', marginTop: 'var(--k3)', color: 'var(--muc)' }}>
                    <input type="checkbox" role="switch" aria-label="Đồng bộ giờ cả phòng"
                      checked={gioChungTheoCa[chiTiet.ca.maCa] ?? chiTiet.ca.dongBoGio ?? false} disabled={dangBatDau}
                      onChange={e => setGioChungTheoCa(c => ({ ...c, [chiTiet.ca.maCa]: e.target.checked }))}
                      style={{ width: 22, height: 22, accentColor: 'var(--tim)' }} />
                    <span><b>Đồng bộ giờ cả phòng</b><br />
                      <span style={NHAN_NHO}>Bật: cả phòng tính giờ từ lúc thầy bấm Bắt đầu thi, cùng hết giờ. Em vào muộn chỉ còn thời gian chung. Tắt: mỗi em có đủ thời gian từ lúc nhận đề. Lựa chọn được lưu khi bắt đầu ca.</span>
                    </span>
                  </label>
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
                    Huỷ ca kiểm tra
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
                Phòng chờ đã mở lúc <span style={SO}>{gio(chiTiet.ca.batDauThiLuc)}</span> — {chiTiet.ca.dongBoGio ? `đồng bộ giờ cả phòng, cùng hết giờ lúc ${gio(new Date(Date.parse(chiTiet.ca.batDauThiLuc) + chiTiet.ca.thoiGianPhut * 60000).toISOString())}.` : 'em vào từ giờ nhận đề ngay, tính giờ riêng từng em.'}
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
                                {/* Cùng luật với hai cổng kia: phần EM CHỌN tô đỏ,
                                    phần đáp án đúng giữ màu chữ thường. */}
                                đúng: {c.dapAnDung || '—'} · em chọn:{' '}
                                <b style={{ color: 'var(--do)' }}>{c.dapAnChon || 'bỏ trống'}</b>
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

            {/* XOÁ CA — chuyển lên đây 15/09 theo lệnh thầy, sau khi gỡ hai thẻ
                "Xuất kết quả" và "Tải đề & lời giải". Đặt cuối thẻ thông tin ca
                là đúng chỗ: mọi việc tác động lên CHÍNH CA này (Bắt đầu thi,
                Khoá ca, Xoá ca) nằm chung một thẻ. */}
            <div className="flex justify-end" style={{ marginTop: 'var(--k4)', paddingTop: 'var(--k3)', borderTop: '1px solid var(--vien)' }}>
              <button type="button" onClick={() => setHoiXoa(true)} className="tap-target inline-flex items-center gap-1" style={{ ...NHAN_NHO, color: 'var(--do)' }}>
                <Trash2 size={14} /> Xoá ca này
              </button>
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

          </div>
          <div className="ca-cot ca-cot-trai">
          {baoCaoLop && <BaoCaoCaLopKhoi key={chiTiet.ca.maCa} bc={baoCaoLop} phutDe={chiTiet.ca.thoiGianPhut} moSan={chiTiet.ca.trangThai !== 'mo'} onMoEm={setSbdHoSo} />}
          {/* DANH SÁCH EM */}
          <TheNoiDung className="gv-monitor-students">
            <div style={{ ...TIEU_DE_MUC, marginBottom: 'var(--k3)' }}>Học sinh trong ca ({dsEm.length})</div>
            <ThanhTabCa muc={mucTab} dangChon={tabHieu} doi={setTabEm} idBang="ca-bang-em" />
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
            <div id="ca-bang-em" className="ca-bang" role="tabpanel" aria-labelledby={`ca-tab-${tabHieu}`}>
            {tabHieu === 'cho' ? (
              emChoVao.length === 0 ? (
                <div className="ca-rong">Chưa em nào đứng ở phòng chờ.</div>
              ) : (
                emChoVao.map((x) => (
                  <div key={`cho-${x.sbd}`} className="ca-hang ca-hang--don" data-trang-thai="Đang chờ">
                    <span className="ca-o ca-o-em">
                      <span className="ca-ten">{x.hoTen || '(chưa có tên)'}</span>
                      <span style={NHAN_NHO}>
                        SBD <span style={SO}>{x.sbd}</span>
                        {x.vaoLuc ? ` · vào chờ ${gio(x.vaoLuc)}` : ''}
                      </span>
                    </span>
                    <span className="ca-o ca-o-tt">
                      <Nhan tone="xam">Đang chờ</Nhan>
                    </span>
                  </div>
                ))
              )
            ) : tabHieu === 'chua_vao' ? (
              emChuaVao.length === 0 ? (
                <div className="ca-rong">Em được mời đã vào hết.</div>
              ) : (
                emChuaVao.map((sbd) => (
                  <div key={`chua-${sbd}`} className="ca-hang ca-hang--don" data-trang-thai="Chưa vào">
                    <span className="ca-o ca-o-em">
                      <span className="ca-ten">{classList.find((c) => c.sbd === sbd)?.hoTen || '(chưa có tên)'}</span>
                      <span style={NHAN_NHO}>
                        SBD <span style={SO}>{sbd}</span>
                      </span>
                    </span>
                    <span className="ca-o ca-o-tt">
                      <Nhan tone="xam">Chưa vào</Nhan>
                    </span>
                  </div>
                ))
              )
            ) : dsEm.length === 0 ? (
              <div style={NHAN_NHO}>Chưa có em nào vào thi.</div>
            ) : dsHienThi.length === 0 ? (
              <div className="ca-rong">Không có em nào ở mục này.</div>
            ) : (
              <>
                <div className="ca-bang-dau" aria-hidden="true">
                  <span>HỌC SINH</span>
                  <span>TRẠNG THÁI</span>
                  <span>TIẾN ĐỘ</span>
                  <span>CHỐNG GIAN LẬN</span>
                  <span>ĐIỂM</span>
                </div>
                {dsHienThi.map((e) => {
                  const l = e.moiNhat
                  const nh = nhanCuaLuot(l)
                  const daNop = l.trangThai === 'da_nop' || l.trangThai === 'khoa'
                  return (
                    <div key={e.sbd} className="ca-hang" data-trang-thai={nh.ten}>
                      <span className="ca-o ca-o-em">
                        <span className="flex items-center flex-wrap" style={{ gap: 6 }}>
                          {/* CHẠM TÊN EM → hồ sơ đầy đủ ngay trong màn này:
                              mạnh–yếu và lịch sử ca. */}
                          <button
                            type="button"
                            onClick={() => setSbdHoSo(e.sbd)}
                            className="tap-target font-bold inline-flex items-center text-left"
                            style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-2)', color: 'var(--muc)', gap: 2, background: 'none', border: 'none', padding: 0, minHeight: 44, textDecoration: 'underline', textDecorationColor: 'var(--vien-dam)', textUnderlineOffset: 3 }}
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
                      </span>
                      <span className="ca-o ca-o-tt">
                        <Nhan tone={nh.tone}>{nh.ten}</Nhan>
                      </span>
                      <span className="ca-o ca-o-tien">
                        {l.dapAn && tongCauDe ? (
                          <>
                            <span className="ca-tien-thanh" aria-hidden="true">
                              <i style={{ width: `${Math.min(100, Math.round((demCauDaLam(l.dapAn) / tongCauDe) * 100))}%` }} />
                            </span>
                            <span className="ca-tien-so">
                              <span className="ca-vh">Đã làm </span>
                              {demCauDaLam(l.dapAn)}/{tongCauDe}
                              <span className="ca-vh"> câu</span>
                            </span>
                          </>
                        ) : (
                          <span className="ca-khong" aria-label="Chưa có số liệu tiến độ">—</span>
                        )}
                      </span>
                      <span className="ca-o ca-o-gian">
                          {daNop && l.soLanRoiMan > 0 && <Nhan tone="cam">rời màn {l.soLanRoiMan} lần / {l.tongGiayRoiMan}s</Nhan>}
                          {!daNop && l.soLanRoiMan > 0 && <span className="ca-gian-so">{l.tongGiayRoiMan}s ngoài màn</span>}
                          {/* GIỮ ĐỂ ĐỌC (GIUDEDOC mục 4F): hai con số, KHÔNG tô
                              đỏ, KHÔNG gọi là vi phạm. Nhả tay là chuyện bình
                              thường; nhưng đề tắt 20 phút trong ca 50 phút là
                              điều thầy nên nhìn. */}
                          {chuTatDe(l.integrity) && <Nhan tone="xam">{chuTatDe(l.integrity)}</Nhan>}
                          {l.soLanRoiMan === 0 && !chuTatDe(l.integrity) && <span className="ca-khong" aria-label="Không có cảnh báo">—</span>}
                      </span>
                      <span className="ca-hd">
                          {(l.trangThai === 'khoa' || l.soLanRoiMan > 0) && (
                            <button type="button" onClick={() => moBaoPhuHuynh(e.sbd, l.hoTen, l)} className="tap-target font-bold" style={{ ...NHAN_NHO, color: 'var(--cam)', minHeight: 44, padding: '0 10px', borderRadius: 'var(--bo-tron)', border: '1px solid var(--cam)' }}>
                              Báo phụ huynh
                            </button>
                          )}
                          {l.trangThai === 'khoa' &&
                            (xacNhanMoKhoa === e.sbd ? (
                              <span className="inline-flex items-center" style={{ gap: 4 }}>
                                <button type="button" onClick={() => handleMoKhoa(e.sbd)} disabled={dangDuyet === e.sbd} className="tap-target font-bold" style={{ ...NHAN_NHO, minHeight: 44, padding: '0 10px', borderRadius: 'var(--bo-tron)', background: 'var(--muc)', color: 'var(--muc-nguoc)' }}>
                                  {dangDuyet === e.sbd ? '…' : 'Đồng ý mở khoá'}
                                </button>
                                <button type="button" onClick={() => setXacNhanMoKhoa(null)} className="tap-target" style={{ ...NHAN_NHO, minHeight: 44, padding: '0 10px', borderRadius: 'var(--bo-tron)', background: 'var(--the)' }}>
                                  Huỷ
                                </button>
                              </span>
                            ) : (
                              <button type="button" onClick={() => setXacNhanMoKhoa(e.sbd)} className="tap-target font-bold" style={{ ...NHAN_NHO, color: 'var(--do)', minHeight: 44, padding: '0 10px', borderRadius: 'var(--bo-tron)', border: '1px solid var(--do)' }}>
                                Mở khoá
                              </button>
                            ))}
                          {l.trangThai === 'duoc_duyet_lai' &&
                            l.khoaMay !== false &&
                            (xacNhanMayKhac === e.sbd ? (
                              /* Nói rõ việc này làm gì TRƯỚC khi thầy bấm: chỉ gỡ khoá máy, không xoá gì, không đổi đề. */
                              <span className="inline-flex flex-col" style={{ gap: 4 }}>
                                <span style={{ ...NHAN_NHO, lineHeight: 1.5 }}>
                                  Em sẽ vào được bằng MÁY KHÁC (không còn buộc vào máy cũ). Đề mới giữ nguyên; máy cũ cũng vẫn vào được.
                                </span>
                                <span className="inline-flex items-center" style={{ gap: 4 }}>
                                  <button type="button" onClick={() => handleChoVaoMayKhac(e.sbd)} disabled={dangDuyet === e.sbd} className="tap-target font-bold" style={{ ...NHAN_NHO, minHeight: 44, padding: '0 10px', borderRadius: 'var(--bo-tron)', background: 'var(--muc)', color: 'var(--muc-nguoc)' }}>
                                    {dangDuyet === e.sbd ? '…' : 'Đồng ý cho vào bằng máy khác'}
                                  </button>
                                  <button type="button" onClick={() => setXacNhanMayKhac(null)} className="tap-target" style={{ ...NHAN_NHO, minHeight: 44, padding: '0 10px', borderRadius: 'var(--bo-tron)', background: 'var(--the)' }}>
                                    Huỷ
                                  </button>
                                </span>
                              </span>
                            ) : (
                              <button type="button" onClick={() => setXacNhanMayKhac(e.sbd)} className="tap-target font-bold" style={{ ...NHAN_NHO, color: 'var(--muc)', minHeight: 44, padding: '0 10px', borderRadius: 'var(--bo-tron)', border: '1px solid var(--vien-dam)' }}>
                                Cho vào bằng máy khác
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
                                <button type="button" onClick={() => handleChoThiLai(e.sbd)} disabled={dangDuyet === e.sbd} className="tap-target font-bold" style={{ ...NHAN_NHO, minHeight: 44, padding: '0 10px', borderRadius: 'var(--bo-tron)', background: 'var(--do)', color: 'var(--muc-nguoc)' }}>
                                  {dangDuyet === e.sbd ? '…' : 'Xoá lượt cũ và cho thi lại'}
                                </button>
                                <button type="button" onClick={() => setXacNhanSbd(null)} className="tap-target" style={{ ...NHAN_NHO, minHeight: 44, padding: '0 10px', borderRadius: 'var(--bo-tron)', background: 'var(--the)' }}>
                                  Huỷ
                                </button>
                                </span>
                              </span>
                            ) : (
                              <button type="button" onClick={() => setXacNhanSbd(e.sbd)} className="tap-target font-bold" style={{ ...NHAN_NHO, color: 'var(--muc)', minHeight: 44, padding: '0 10px', borderRadius: 'var(--bo-tron)', border: '1px solid var(--vien-dam)' }}>
                                Cho thi lại
                              </button>
                            ))}
                      </span>
                      <span className="ca-o ca-o-diem">
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
                    </div>
                  )
                })}
              </>
            )}
            </div>
          </TheNoiDung>

          {/* HAI THẺ "XUẤT KẾT QUẢ" VÀ "TẢI ĐỀ & LỜI GIẢI" ĐÃ GỠ — thầy chốt
              15/09: "Xóa luôn phần này trên app gv. Chuyển nút xóa lên phần
              còn lại." Nút "Xoá ca này" nay nằm cuối thẻ thông tin ca, cùng
              chỗ với Bắt đầu thi và Khoá ca. */}
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

          </div>
          </div>

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
                  style={{ width: '100%', minHeight: 140, borderRadius: 'var(--bo-1)', padding: 'var(--k3)', background: 'var(--the-2)', border: '1.5px solid transparent', fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', color: 'var(--muc)', lineHeight: 1.6 }}
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

      {/* MODAL BÁO CÁO CA THI HỌC SINH CHUẨN GOOGLE MATERIAL 3 */}
      {chieuMa && chiTiet && (
        <TamPhuChieuMa
          maCa={chiTiet.ca.maCa}
          tenCa={chiTiet.ca.tenCa || ''}
          diaChi={`${location.host}${import.meta.env.BASE_URL}t/${chiTiet.ca.maCa}`}
          soEmCho={chiTiet.ca.phongCho && !chiTiet.ca.batDauThiLuc ? (chiTiet.dsCho ?? []).length : null}
          onDong={() => setChieuMa(false)}
        />
      )}

      {sbdHoSo && (
        <BaoCaoCaThiHocSinhModal
          baiThi={goiBaiThi(
            {
              maCa: chiTiet ? chiTiet.ca.maCa : '',
              tenCa: chiTiet ? chiTiet.ca.tenCa : '',
              tong: emTrongCa?.diem ?? emTrongCa?.graded?.score.total ?? 0,
              diemI: emTrongCa?.graded?.score.phanIScore,
              diemII: emTrongCa?.graded?.score.phanIIScore,
              diemIII: emTrongCa?.graded?.score.phanIIIScore,
              // ĐẾM THẬT TỪNG CÂU TỪ BẢNG CHẤM, không suy từ điểm và không
              // nhặt tay từng trường — `goiBaiThi` là cửa duy nhất, để màn này
              // và cổng học sinh không bao giờ ra hai con số khác nhau nữa.
              tongCau: demBangCham?.tongCau,
              soCauDung: demBangCham?.soDung,
              soCauSai: demBangCham?.soSai,
              soCauDungMotPhan: demBangCham?.soDungMotPhan,
              soCauBoTrong: demBangCham?.soBoTrong,
              soYDungII: demBangCham?.yPhanII.dung,
              soYTongII: demBangCham?.yPhanII.tong,
            },
            emTrongCa?.moiNhat.nopLuc ? ngayGio(emTrongCa.moiNhat.nopLuc) : undefined,
          )}
          hoTen={emTrongCa?.hoTen || hoSo?.em.hoTen || `SBD ${sbdHoSo}`}
          sbd={sbdHoSo}
          lop={emTrongCa?.lop || hoSo?.em.lop}
          scriptUrl={scriptUrl}
          onClose={() => setSbdHoSo('')}
          onBatDauKhacPhuc={() => {
            setSbdHoSo('')
          }}
        />
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

