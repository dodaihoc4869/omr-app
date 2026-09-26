import NhomCaThuGon from '../components/NhomCaThuGon'
import { phanCongDayHoc } from '../lib/phan-cong-day-hoc'
import { hashSeed } from '../lib/exam-shuffle'
import { TIN_TO_CHIEU, gocGuiLai, khoaToChieu, kiemTinToChieu, taoMaPhienChieu } from '../lib/to-chieu-cau-noi'
// GỌI HỌC SINH LÊN BẢNG — MỘT MÀN, MỘT LUỒNG (thầy chốt 05/09 chiều).
//
// Nguồn duy nhất là CA thầy vừa cho lớp làm. Từ một ca ấy ra cả hai việc:
// phiếu gửi phụ huynh (màn Theo dõi lo) và bảng phân công lên bảng (màn này).
// Không có ca thứ hai, không có luồng thứ hai.
//
// Khác bản cũ ở chỗ quan trọng nhất: bản cũ chỉ biết "em này yếu chuyên đề gì",
// nên hai em cùng yếu Ester nhận hai câu Ester bất kỳ. Bản này biết EM NÀO SAI
// CÂU NÀO và CẢ LỚP CÓ SAI GIỐNG NHAU KHÔNG, nên:
//   · câu quá nửa lớp cùng chọn một phương án sai → GIẢNG CẢ LỚP, không gọi ai;
//   · câu gần cả lớp làm đúng → chỉ đọc đáp án;
//   · phần còn lại mới chia cho em, ưu tiên em SAI CHÍNH CÂU ĐÓ.
// Thuật toán ở lib/phan-cong.ts, phần đọc dữ liệu ca ở lib/du-lieu-len-bang.ts.
import { useEffect, useMemo, useRef, useState } from 'react'
import { ClipboardCopy, Check, RefreshCw, Search, Wand2, Megaphone, BookOpenCheck, ThumbsUp, ThumbsDown, X, Printer, Shuffle, MonitorPlay, UserCheck, Trash2 } from 'lucide-react'
import { Hang, Nhan, OThongBao, NutChinh, TheNoiDung } from '../components/DesignSystem'
import HopXacNhan from '../components/HopXacNhan'
import { chiTietCa, chuoi, danhSachCa, ghiLenBang, hoSoEm, lichSuLenBang, thanThuLopDocApi, type CaTomTat, type LichSuLenBangEm } from '../lib/exam-api'
import { docBuoiChua, docKhoChuaCa, docMauGiayThuc, loadExamSources, loadScriptUrl, loadSessionTeacherBank, loadTeacherSecret, luuBuoiChua, themMauGiayThuc, xoaBuoiChua } from '../lib/exam-db'
import { HAN_BUOI_CHUA_NGAY, MOC_KHOA_BUOI, chuTheTiepTuc, conHan, emGiuKhiNoi, khoaBuoiChua, laBuoiChuaHopLe, taoBanGhiBuoi, tinhTrangBuoi, type BuoiChuaLuu } from '../lib/noi-buoi-chua'
import { theoDoiBtvn, type DongTheoDoiBtvn } from '../lib/btvn-may-chu-moi'
import { layCauHinhMayChu } from '../lib/may-chu-moi'
import { mergeKeepAnswers } from '../data/examContent'
import { khuTrungNguon } from '../lib/khu-trung-cau'
import type { TeacherExamSource, TeacherMcqQuestion, TeacherShortAnswerQuestion, TeacherTrueFalseQuestion } from '../data/examContent'
import { tachNhieuTheoPhan } from '../lib/tach-phan-de'
import HopChonDe from '../components/HopChonDe'
import { baiLamTuCa, cauTuBanDe, daCoBaiLam, emTuCa, luotMoiNhat, rowsLopSai, type BanDeCa, type HoSoRutGon, type LuotCa } from '../lib/du-lieu-len-bang'
import { rutDeChua } from '../lib/rut-de-chua'
import { LOC_SAO_MAC_DINH, MOI_LOC_SAO, TEN_LOC_SAO, type LocSao } from '../lib/loc-sao'
import { LOC_DANG_MAC_DINH, MOI_LOC_DANG, TEN_LOC_DANG, type LocDang } from '../lib/dang-cau'
import { SO_CAU_MAC_DINH } from '../lib/cau-hinh-chua'
import ThanhSoCauChua from '../components/ThanhSoCauChua'
import KhungXemPhieu from '../components/KhungXemPhieu'
import type { OBang as OBangMayChieu } from '../lib/html-may-chieu'
import { khoaEmCau, nhanLichSuCau, qidMayChuCuaIdCau, type CapEmCau, type LichSuCauEm, type NhanLichSuCau } from '../lib/lich-su-cau-len-bang'
import { layLichSuCau } from '../lib/lich-su-cau-len-bang-lenh'
import type { CauLuyen } from '../lib/bai-tap-pdf'
import { bangChu, chuCau, chuChum, MAC_DINH, phanCong, TEN_MUC_NHAM, type CauChua, type DongPhanCong, type KetQuaPhanCong } from '../lib/phan-cong'
import { baiLamCoGiayTuCa } from '../lib/du-lieu-len-bang'
import { CAU_HINH_LEN_BANG_MAC_DINH, TEN_LANE, dongHo, nganSachGiay } from '../lib/len-bang-cau-hinh'
import { dungDoKho, vapCuaLop } from '../lib/do-kho-cau'
import { doiEmChoDong, xepGioLenBang, type KetQuaXep } from '../lib/xep-gio-len-bang'
import { deXuatBuoiChuaPhuKienThuc, type DauVaoDeXuat } from '../lib/buoi-chua-de-xuat'
import { khoTuNguon, layDeXuatBuoiChua } from '../lib/buoi-chua-de-xuat-lenh'
import TheBuoiChuaXepSan from '../components/TheBuoiChuaXepSan'
import { chuThieuNoiDung, demCauThieuNoiDung, timCauTheoId } from '../lib/tra-cau-chieu'
import { noiDungTuCauGoc } from '../lib/thoi-gian-len-bang'
import { uocLuongBacCau, uocLuongBacCauGoc } from '../lib/uoc-luong-bo-cuc'
import { heSoCua, heSoHieuChinh } from '../lib/hieu-chinh-giay-thuc'
import { type CauVaoXep, type DongChua, type KetQuaBuoiChua } from '../lib/xep-buoi-chua'
import { bangChuBuoiChuaMoi, xepBuoiChuaMoi } from '../lib/xep-buoi-chua-moi'
import { btvnCuaCau, napHoSoLop, type HoSoEmDayDu, type KetQuaBtvn } from '../lib/ho-so-lop'
import { dungGiaoAn } from '../lib/giao-an-len-bang'
import { KHO_DO_KHO_RONG, gopCaVaoKho, thongKeKho, type KhoDoKhoLuu } from '../lib/kho-do-kho'
import { docKhoDoKho, luuKhoDoKho } from '../lib/exam-db'
import TheCau from '../components/TheCau'
import { useAppStore } from '../store/appStore'
import { gioDayDu } from '../lib/ngay-gio-24'

const SO: React.CSSProperties = { fontFamily: 'var(--sans)', fontVariantNumeric: 'tabular-nums' }
const NHAN_NHO: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }

/** "EM ĐÃ LÀM CÂU NÀY CHƯA" (thầy lệnh 21/09 16:4x) — nhãn cùng nội dung với thẻ tên trên tờ chiếu, để thầy biết TRƯỚC khi chiếu. Xanh = đúng, cam = sai (không đỏ), xám = còn lại. Không có dữ liệu ⇒ không hiện. */
function NhanLichSuCauEm({ nhan }: { nhan: NhanLichSuCau | null }) {
  if (!nhan) return null
  const tone = nhan.kieu === 'dung' ? 'xanh' : nhan.kieu === 'sai' ? 'cam' : 'xam'
  return (
    <span className="flex items-center flex-wrap" data-lich-su-cau={nhan.kieu} style={{ gap: 4, marginTop: 4 }}>
      <Nhan tone={tone}>{nhan.chu}</Nhan>
      {nhan.phu && <span style={NHAN_NHO}>{nhan.phu}</span>}
      {nhan.lenBang && <span style={NHAN_NHO}>{nhan.lenBang}</span>}
    </span>
  )
}
const TIEU_DE_MUC: React.CSSProperties = { fontFamily: 'var(--serif)', fontSize: 'var(--cx-3)', fontWeight: 700, color: 'var(--muc)' }

/** THẺ BÀI TẬP VỀ NHÀ của ĐÚNG câu em được phân lên bảng (thầy chốt 14/09).
 *
 * Ba màu, đọc lướt là ra: đỏ = ở nhà làm SAI (chữa đúng chỗ em hiểu lệch),
 * cam = CHƯA LÀM (em chưa qua được câu này), xanh = làm ĐÚNG rồi.
 * `null` nghĩa là câu ấy KHÔNG nằm trong bài giao về nhà — khác "chưa làm",
 * nên không hiện thẻ, tránh đọc nhầm. */
const MAU_BTVN: Record<KetQuaBtvn, { nen: string; vien: string; nhan: string }> = {
  sai: { nen: 'var(--gg-do-nen)', vien: 'var(--gg-do)', nhan: 'Nhà: SAI' },
  chuaLam: { nen: 'var(--cam-nen)', vien: 'var(--cam)', nhan: 'Nhà: CHƯA LÀM' },
  dung: { nen: 'var(--gg-luc-nen)', vien: 'var(--gg-luc)', nhan: 'Nhà: ĐÚNG' },
}

function TheBtvn({ kq }: { kq: KetQuaBtvn | null }) {
  if (!kq) return null
  const m = MAU_BTVN[kq]
  return (
    <span
      className="font-bold"
      style={{
        fontFamily: 'var(--sans)',
        fontSize: '12px',
        letterSpacing: '0.02em',
        padding: '1px 9px',
        borderRadius: 'var(--bo-tron)',
        background: m.nen,
        // CHỮ LẤY MÀU MỰC CHÍNH, không lấy màu trạng thái: chữ cam trên nền
        // cam nhạt chỉ đạt ~2:1, thầy nhìn màn hình giữa lớp là mất chữ. Màu
        // trạng thái chuyển sang VIỀN + NỀN, còn chữ thì luôn đọc được — mà
        // trạng thái vẫn không phụ thuộc màu, vì nó viết hẳn ra chữ.
        color: 'var(--muc)',
        border: `1.5px solid ${m.vien}`,
        whiteSpace: 'nowrap',
      }}
      data-btvn={kq}
    >
      {m.nhan}
    </span>
  )
}
/** NÚT ĐẠT / KHÔNG ĐẠT của một dòng trên BẢNG BUỔI CHỮA (thuật toán mới, Engine E) — cùng dáng
 * với hai nút của bảng "Phân công" cũ. Máy chủ nhận rồi thì chỉ còn nhãn kết quả: bấm lại là ghi
 * đôi vào sổ lên bảng, mà sổ chỉ thêm, không sửa. */
function NutChamBuoi({
  tenEm,
  ketQua,
  daGhi,
  dangGhi,
  onChon,
}: {
  tenEm: string
  ketQua: 'dat' | 'khong_dat' | undefined
  /** Em này đã được ghi câu ấy từ bảng khác (Engine C) trong phiên này. */
  daGhi: boolean
  dangGhi: boolean
  onChon: (dat: boolean) => void
}) {
  if (ketQua || daGhi) {
    return (
      <Nhan tone={ketQua === 'khong_dat' ? 'do' : 'xanh'} data-nhan="da-cham-buoi">
        {ketQua === 'dat' ? 'Đã ghi: Đạt' : ketQua === 'khong_dat' ? 'Đã ghi: Không đạt' : 'Đã ghi'}
      </Nhan>
    )
  }
  return (
    <span className="inline-flex items-center flex-wrap" style={{ gap: 'var(--k2)' }} data-cham-buoi>
      <button
        type="button"
        onClick={() => onChon(true)}
        disabled={dangGhi}
        aria-label={`${tenEm}: Đạt`}
        className="tap-target inline-flex items-center font-bold"
        style={{ gap: 6, minHeight: 36, padding: '0 var(--k3)', borderRadius: 'var(--bo-tron)', background: 'var(--xanh-nen)', color: 'var(--xanh)', border: 'none', fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)' }}
      >
        <ThumbsUp size={15} /> Đạt
      </button>
      <button
        type="button"
        onClick={() => onChon(false)}
        disabled={dangGhi}
        aria-label={`${tenEm}: Không đạt`}
        className="tap-target inline-flex items-center font-bold"
        style={{ gap: 6, minHeight: 36, padding: '0 var(--k3)', borderRadius: 'var(--bo-tron)', background: 'var(--do-nen)', color: 'var(--do)', border: 'none', fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)' }}
      >
        <ThumbsDown size={15} /> Không đạt
      </button>
      {dangGhi && <span style={NHAN_NHO}>Đang ghi…</span>}
    </span>
  )
}

const O_NHAP: React.CSSProperties = {
  height: 48,
  borderRadius: 'var(--bo-1)',
  padding: '0 var(--k4) 0 44px',
  background: 'var(--the-2)',
  border: '1.5px solid transparent',
  fontFamily: 'var(--sans)',
  fontSize: 'var(--cx-2)',
  color: 'var(--muc)',
  width: '100%',
}

/** Câu ĐẦY ĐỦ tra ra từ bản đề của ca. Kiểu hợp phân biệt theo `phan` để chỗ vẽ
 * thẻ câu biết chắc `q` là loại nào, không phải ép kiểu khắp nơi. */
type CauDayDu =
  | { phan: 'I'; q: TeacherMcqQuestion }
  | { phan: 'II'; q: TeacherTrueFalseQuestion }
  | { phan: 'III'; q: TeacherShortAnswerQuestion }

interface DuLieuCa {
  maCa: string
  /** Lớp của ca — một phần khoá buổi chữa lưu để nối buổi sau (`noi-buoi-chua.ts`). */
  lop: string
  ten: string
  bank: BanDeCa
  /** KHO CHỮA của ca — bộ câu rộng hơn đề em làm, do màn Mở ca lưu lại khi thầy
   * chọn "Phân công lên bảng". Không có thì rỗng, màn vẫn chạy trên bộ em làm. */
  khoChua: BanDeCa | null
  luot: LuotCa[]
  hoSo: Record<string, HoSoRutGon>
}

/** Chạy song song có giới hạn — 251 em mà gọi hết một lúc là máy chủ nghẹn. */
async function songSong<T, R>(ds: T[], soLuong: number, viec: (x: T) => Promise<R>, xong?: (da: number) => void): Promise<R[]> {
  const ra: R[] = new Array(ds.length)
  let i = 0
  let da = 0
  const chay = async () => {
    while (i < ds.length) {
      const k = i++
      ra[k] = await viec(ds[k])
      xong?.(++da)
    }
  }
  await Promise.all(Array.from({ length: Math.min(soLuong, ds.length) }, chay))
  return ra
}

export default function GoiLenBangScreen() {
  const showToast = useAppStore((s) => s.showToast)

  const [cauHinh, setCauHinh] = useState<{ url: string; mat: string } | null>(null)
  const [loi, setLoi] = useState('')
  const [dayHoc, setDayHoc] = useState(false)

  const [dsCa, setDsCa] = useState<CaTomTat[] | null>(null)
  const [timCa, setTimCa] = useState('')
  const [hienCaTat, setHienCaTat] = useState(false)
  const [dangTaiCa, setDangTaiCa] = useState('')
  const [tienDo, setTienDo] = useState('')
  const [du, setDu] = useState<DuLieuCa | null>(null)

  // Em vắng hôm nay: có bài trong ca nhưng không đứng lớp được. Bỏ tích ở đây
  // là em không nhận câu nào, chứ dữ liệu bài làm của em vẫn tính vào tỉ lệ
  // đúng/sai của câu — cả lớp sai giống nhau hay không là chuyện của cả lớp.
  const [vang, setVang] = useState<Set<string>>(new Set())

  // THÊM CÂU NGOÀI CA (thầy chốt 05/09): buổi chữa hiếm khi bó trong đúng bộ
  // câu vừa thi — thầy tích thêm bài nào cũng được, tích tới từng dạng. Câu
  // thêm KHÔNG có bài làm nên không bao giờ bị xếp "giảng cả lớp"/"đọc đáp án";
  // nó vào thẳng danh sách chữa và xếp theo sao.
  const [deDaLuu, setDeDaLuu] = useState<TeacherExamSource[]>([])
  const [maDeChon, setMaDeChon] = useState<Set<string>>(new Set())
  // HAI CÁCH LẤY CÂU ĐỂ CHỮA (thầy chốt 05/09 tối):
  //   'san'   — dùng bộ câu máy đã rút sẵn khi mở ca ở chế độ Kiểm tra điểm yếu;
  //   'tu_chon' — thầy tự tích bài muốn chữa, máy dựa vào điểm yếu cộng dồn ở
  //               ĐÚNG chuyên đề của câu đó để chọn em nào lên bảng.
  // Mặc định TỰ CHỌN: chưa mở ca thì chưa biết ca có bộ rút sẵn hay không, mà
  // hộp tích đề phải hiện sẵn để thầy làm việc được ngay.
  const [cachLayCau, setCachLayCau] = useState<'san' | 'tu_chon' | 'theo_dang' | 'btvn_gan_nhat'>('tu_chon')
  const [dsBtvnCa, setDsBtvnCa] = useState<DongTheoDoiBtvn[]>([])
  const [dangTaiBtvnCa, setDangTaiBtvnCa] = useState(false)
  const [btvnChon, setBtvnChon] = useState<string | null>(null)
  /** RÚT THEO MÃ DẠNG (v4 mục 2). Nguồn là CẢ KHO, không phải đề thầy tích. */
  const [khoDe, setKhoDe] = useState<TeacherExamSource[]>([])
  const [soCauChua, setSoCauChua] = useState(SO_CAU_MAC_DINH)
  // MỨC SAO — thầy chốt 07/09. Áp cho cả phần đếm lẫn phần rút, nếu không thì
  // thanh kéo hiện một trần còn bảng rút ra một bộ khác.
  const [locSao, setLocSao] = useState<LocSao>(LOC_SAO_MAC_DINH)
  const [locDang, setLocDang] = useState<LocDang>(LOC_DANG_MAC_DINH)
  useEffect(() => {
    void loadExamSources().then((ds) => setKhoDe(khuTrungNguon(ds).nguon))
  }, [])
  // BUỔI CHỮA XẾP SẴN (B6, Boss duyệt 21/09): máy chủ gom số liệu 3 ngày qua khi thầy mở màn; hàm thuần
  // `deXuatBuoiChuaPhuKienThuc` chọn câu/em trên kho của máy thầy (lọc tự luận). Lệnh chưa có / lỗi / thiếu kho
  // ⇒ thẻ ẨN, không báo lỗi đỏ. Thẻ chỉ ĐỌC (máy chuẩn bị sẵn); thầy muốn tự làm thì bấm "Tự chọn lại".
  const [deXuatDv, setDeXuatDv] = useState<DauVaoDeXuat | null>(null)
  const [anDeXuat, setAnDeXuat] = useState(false)
  useEffect(() => {
    let huy = false
    void layDeXuatBuoiChua()
      .then((r) => {
        if (!huy) setDeXuatDv(r.ok ? r.du : null)
      })
      .catch(() => {})
    return () => {
      huy = true
    }
  }, [])
  const khoCauDeXuat = useMemo(() => khoTuNguon(khoDe), [khoDe])
  const deXuat = useMemo(() => (deXuatDv && khoCauDeXuat.length > 0 ? deXuatBuoiChuaPhuKienThuc(deXuatDv, khoCauDeXuat) : null), [deXuatDv, khoCauDeXuat])
  const [timEm, setTimEm] = useState('')

  const [soLuot, setSoLuot] = useState(1)
  const [daGoiCau, setDaGoiCau] = useState<Record<string, string[]>>({})
  const [kq, setKq] = useState<KetQuaPhanCong | null>(null)

  // ---- GIÁO ÁN 80 PHÚT (GOI-LEN-BANG-80-PHUT.md) --------------------------
  const [kho, setKho] = useState<KhoDoKhoLuu>(KHO_DO_KHO_RONG)
  const [dangDungKho, setDangDungKho] = useState('')
  const [kqXep, setKqXep] = useState<KetQuaXep | null>(null)

  /** HTML tờ máy chiếu đang mở. Rỗng là chưa dựng. */
  const [htmlMayChieu, setHtmlMayChieu] = useState('')
  const [dangMoMayChieu, setDangMoMayChieu] = useState(false)

  /** Hồ sơ ĐẦY ĐỦ cả lớp — bài thi + bài tập về nhà + khắc phục câu sai. */
  const [hoSoLop, setHoSoLop] = useState<HoSoEmDayDu[]>([])
  const [loiHoSo, setLoiHoSo] = useState('')
  /** Kết quả xếp buổi chữa theo thuật toán mới. */
  const [kqBuoi, setKqBuoi] = useState<KetQuaBuoiChua | null>(null)
  const [boBatBuoc, setBoBatBuoc] = useState<string[]>([])
  const [tranEm, setTranEm] = useState(CAU_HINH_LEN_BANG_MAC_DINH.SO_EM_LEN_BANG_TOI_DA)
  // HỆ SỐ HIỆU CHỈNH GIỜ theo giây thật (M6): nạp từ các mẫu đã lưu trên máy; cập nhật sau mỗi lần bấm Đạt / Chưa đạt trên tờ chiếu.
  const [heSoHC, setHeSoHC] = useState<Record<string, number>>({})
  useEffect(() => {
    let huy = false
    void (async () => {
      try {
        const bang = heSoHieuChinh(await docMauGiayThuc())
        if (!huy) setHeSoHC(bang)
      } catch {
        /* không đọc được mẫu thì dùng mô hình gốc */
      }
    })()
    return () => {
      huy = true
    }
  }, [])
  const [giayMoiEm, setGiayMoiEm] = useState(CAU_HINH_LEN_BANG_MAC_DINH.GIAY_LANE.L3)
  const [daCopyGiaoAn, setDaCopyGiaoAn] = useState(false)
  /** Lịch sử lên bảng thật từ máy chủ. `null` = chưa đọc được (máy chủ bản cũ
   * chưa có lệnh, hoặc mất mạng) ⇒ màn phải nói thật là chưa có. */
  const [lichSu, setLichSu] = useState<{ soNgay: number; theoEm: Record<string, LichSuLenBangEm> } | null>(null)
  /** "Em đã làm câu này chưa": lịch sử MỌI ngày của từng cặp (em, câu) trên bảng phân công (`/gv/lich-su-cau-cua-em`). `null` = chưa có / không đọc được ⇒ không nhãn, không bịa. */
  const [lichSuCauEm, setLichSuCauEm] = useState<Map<string, LichSuCauEm> | null>(null)
  /** Hộp xác nhận "Xoá phiên phân công lên bảng". */
  const [hoiXoaPhien, setHoiXoaPhien] = useState(false)
  const [daCopy, setDaCopy] = useState(false)
  const [xemCau, setXemCau] = useState('')
  const [dangCham, setDangCham] = useState('')
  /** Kết quả thầy đã bấm trên BẢNG BUỔI CHỮA (Engine E), theo `sbd|qid`. Máy chủ nhận rồi thì
   * khoá nút: bấm lại là ghi đôi vào sổ lên bảng, mà sổ chỉ thêm, không sửa. */
  const [ketQuaBuoi, setKetQuaBuoi] = useState<Record<string, 'dat' | 'khong_dat'>>({})
  /** NỐI BUỔI (M4): buổi chữa dở đã lưu của ca này (null = không có / hết hạn / thầy đã bỏ). `buoiQuyet`: thầy đã chọn nối hay bắt đầu mới.
   * `tiepBuoi`: đang NỐI — chỉ xếp các câu còn lại, bắt buộc chưa chữa lên đầu, giữ em còn có mặt. */
  const [buoiDo, setBuoiDo] = useState<BuoiChuaLuu | null>(null)
  const [buoiQuyet, setBuoiQuyet] = useState<'tiep' | 'moi' | null>(null)
  const [tiepBuoi, setTiepBuoi] = useState<{ conLai: Set<string>; batBuoc: Set<string>; emGiu: Record<string, string> } | null>(null)
  const [tuDongXep, setTuDongXep] = useState(false)
  /** Bản ghi gốc của buổi đang chạy (lúc NỐI là bản đã lưu; buổi mới là null) và giờ bắt đầu ổn định của buổi mới. */
  const goiBuoiGoc = useRef<BuoiChuaLuu | null>(null)
  const batDauBuoiMoi = useRef('')
  /** Hồ sơ lớp đang giữ là của (danh sách em × danh sách câu) nào. Đổi em có mặt hay đổi
   * bài chữa thì phải xin lại: hồ sơ nắm kiến thức chỉ có đúng những câu ĐÃ XIN. */
  const khoaHoSoDaNap = useRef('')
  /** KHOÁ CHỐNG GHI ĐÔI CHUNG `sbd|qid` cho MỌI nơi bấm: bảng Phân công, bảng buổi chữa, tờ máy chiếu.
   * `dangGhiKhoa`: các ô ĐANG chờ máy chủ (`dangCham` chỉ nhớ MỘT dòng — bấm dòng khác trong lúc chờ là dòng
   * trước mở khoá lại, bấm tiếp là ghi đôi). `daGhiKhoa`: các ô máy chủ ĐÃ nhận trong phiên này. */
  const dangGhiKhoa = useRef(new Map<string, Promise<boolean>>())
  const daGhiKhoa = useRef(new Set<string>())
  /** PHIÊN TỜ MÁY CHIẾU đang mở: mã phiên ngẫu nhiên, các ô có trên tờ (tra lại theo `khoa`, không tin tin đến),
   * khung iframe đã bắt tay (`cuaSo`) và gốc của nó. `null` khi không có tờ nào đang chiếu. */
  const phienChieu = useRef<{
    ma: string
    o: Map<string, { sbd: string; hoTen: string; cau: CauChua }>
    cuaSo: Window | null
    goc: string
  } | null>(null)
  /** Bản MỚI NHẤT của `ghiTheoKhoa` cho bộ nghe tin của tờ chiếu (bộ nghe gắn một lần, không được giữ hàm cũ). */
  const ghiTheoKhoaRef = useRef<((o: { sbd: string; hoTen: string; cau: CauChua }, dat: boolean, giayThuc?: { giay: number; duTinh: number }) => Promise<boolean>) | null>(null)

  useEffect(() => {
    void (async () => {
      const [url, mat, kho] = await Promise.all([loadScriptUrl(), loadTeacherSecret(), loadExamSources()])
      // Mỗi mã đề tách làm ba dạng (trắc nghiệm · đúng sai · trả lời ngắn), y
      // hệt màn Mở ca — tích một dòng là lấy đúng dạng đó.
      // HỘP CHỌN BÀI HIỆN ĐỦ SỐ CÂU TRONG KHO (thầy chốt 14/09).
      //
      // Bản trước khử trùng câu NGAY TẠI ĐÂY rồi mới đưa vào hộp, nên số câu
      // mỗi bài hiện ra ít hơn số câu thật, và bài nào trùng sạch thì BIẾN MẤT
      // khỏi cây — thầy tìm không ra bài mình vừa nạp.
      //
      // Khử trùng là việc của lúc DỰNG DANH SÁCH CHỮA, không phải của lúc HIỆN
      // CÂY. Nay hộp nhận kho đầy đủ; `bankTichTay` mới là chỗ khử trùng.
      setDeDaLuu(tachNhieuTheoPhan(kho))
      if (!url.trim() || !mat.trim()) {
        setLoi('Chưa cấu hình địa chỉ máy chủ hoặc mã bí mật — vào Cài đặt → Kết nối máy chủ (1 lần)')
        setDsCa([])
        return
      }
      setCauHinh({ url: url.trim(), mat: mat.trim() })
      try {
        const ds = await danhSachCa(url.trim(), mat.trim())
        setDsCa(ds.filter((c) => c.loai !== 'baitap'))
      } catch (e) {
        setLoi(e instanceof Error ? e.message : 'Không lấy được danh sách ca')
        setDsCa([])
      }
    })()
  }, [])

  /** Ca thầy TẮT nút gạt lúc mở: chỉ gửi phiếu phụ huynh, không ra màn này.
   * Vẫn với tới được bằng chip "Hiện cả ca đã tắt" — thầy đổi ý sau buổi thi
   * thì không phải mở lại ca. */
  const soCaTat = useMemo(() => (dsCa ?? []).filter((c) => !c.lenBang).length, [dsCa])
  /** Số ca CÓ bật nút gạt "Phân công lên bảng" lúc mở ca. */
  const soCaCoNutGat = useMemo(() => (dsCa ?? []).filter((c) => c.lenBang).length, [dsCa])
  /** LỌC THEO NÚT GẠT CHỈ KHI CÒN GÌ ĐỂ LỌC.
   *
   * Thầy báo 10/09: "trong mục gọi học sinh lên bảng tôi chưa thấy thay đổi gì".
   * Đo trên máy chủ: 7/7 ca chưa xoá đều `LenBang='khong'`, KHÔNG ca nào 'co'.
   * Bộ lọc cũ vì thế cắt sạch danh sách, màn hiện đúng dòng "Chưa có ca nào
   * khớp" và DỪNG ở đó — mục 2, mục 3 lẫn khối Giáo án đều treo sau `du`, mà
   * `du` chỉ có khi mở được một ca. Nói cách khác cả màn chết, không riêng phần
   * mới.
   *
   * Bộ lọc là TIỆN ÍCH cho thầy nào có dùng nút gạt; khi nó lọc hết thì nó
   * không còn là tiện ích nữa. Không ca nào bật nút gạt ⇒ hiện tất, kèm một
   * dòng nói rõ vì sao, thay vì bắt thầy đoán ra cái nút "Hiện cả N ca". */
  const locTheoNutGat = soCaCoNutGat > 0 && !hienCaTat
  const dsCaLoc = useMemo(() => {
    const q = timCa.trim().toLowerCase()
    return (dsCa ?? [])
      .filter((c) => !locTheoNutGat || c.lenBang)
      .filter((c) => !q || c.maCa.includes(q) || (c.tenCa || '').toLowerCase().includes(q) || (c.lop || '').toLowerCase().includes(q))
  }, [dsCa, timCa, locTheoNutGat])

  /** MỞ MỘT CA: kéo về bản đề CÓ đáp án + đáp án từng em + hồ sơ tích luỹ.
   *
   * Bản đề lấy từ máy chủ khi ca có công bố điểm; ca "không công bố" thì máy chủ
   * không giữ đáp án, rơi về bản đã lưu trên máy thầy lúc mở ca. Không có cả hai
   * thì NÓI THẲNG chứ không phân công mò. */
  const moCa = async (ca: CaTomTat) => {
    if (!cauHinh) return showToast('Chưa cấu hình máy chủ', 'error')
    setDangTaiCa(ca.maCa)
    setLoi('')
    setKq(null)
    setSoLuot(1)
    setDaGoiCau({})
    setVang(new Set())
    try {
      const ct = await chiTietCa(cauHinh.url, cauHinh.mat, ca.maCa, true)
      let bank: BanDeCa | null = ct.keyBank ? { phanI: ct.keyBank.phanI, phanII: ct.keyBank.phanII, phanIII: ct.keyBank.phanIII } : null
      if (!bank) {
        const cuc: TeacherExamSource[] | undefined = await loadSessionTeacherBank(ca.maCa)
        if (cuc && cuc.length) bank = mergeKeepAnswers(cuc)
      }
      if (!bank) throw new Error(`Ca ${ca.tenCa || ca.maCa} không có bản đề kèm đáp án trên máy chủ lẫn trên máy này — mở ca ở máy khác thì đồng bộ đề trước`)

      const luot: LuotCa[] = ct.luot.map((l) => ({ sbd: chuoi(l.sbd), hoTen: chuoi(l.hoTen), lanThu: l.lanThu, trangThai: l.trangThai, dapAn: l.dapAn, giayCau: l.giayCau }))
      const coBai = luotMoiNhat(luot).filter(daCoBaiLam)
      if (coBai.length === 0) throw new Error(`Ca ${ca.tenCa || ca.maCa} chưa em nào nộp bài`)

      setTienDo(`0/${coBai.length}`)
      const hs = await songSong(
        coBai.map((l) => l.sbd),
        4,
        async (sbd) => {
          try {
            const h = await hoSoEm(cauHinh.url, { secret: cauHinh.mat, sbd })
            return { sbd, hoTen: h.em.hoTen, chuyenDe: h.chuyenDe.map((c) => ({ ten: c.ten, soCau: c.soCau, soSai: c.soSai })) } as HoSoRutGon
          } catch {
            // Hồ sơ hỏng thì để RỖNG: em vẫn được gọi, chỉ là máy không biết em
            // yếu chuyên đề nào. Bịa hồ sơ là gọi sai chỗ.
            return null
          }
        },
        (n) => setTienDo(`${n}/${coBai.length}`),
      )
      const hoSo: Record<string, HoSoRutGon> = {}
      for (const h of hs) if (h) hoSo[h.sbd] = h

      // Kho chữa lưu sẵn lúc mở ca (chế độ "Phân công lên bảng") — tự nạp, thầy
      // không phải tick lại đề ở khối bên dưới.
      const kc = await docKhoChuaCa(ca.maCa).catch(() => undefined)
      const khoChua = kc && kc.length ? mergeKeepAnswers(kc) : null
      setDu({ maCa: ca.maCa, lop: String(ca.lop ?? ''), ten: ca.tenCa || `mã ${ca.maCa}`, bank, khoChua, luot, hoSo })
      // Ca thường (mở bằng Rút bộ câu / Lấy trọn kho) không có bộ rút sẵn — đưa
      // thẳng thầy sang nhánh tự chọn, khỏi phải bấm thêm một chạm.
      setCachLayCau(!dayHoc && khoChua ? 'san' : 'tu_chon')
      showToast(`Ca ${ca.tenCa || ca.maCa}: ${coBai.length} em có bài`, 'success')
    } catch (e) {
      setDu(null)
      setLoi(e instanceof Error ? e.message : 'Không mở được ca')
    } finally {
      setDangTaiCa('')
      setTienDo('')
    }
  }

  /** Bảng chấm gộp cả lớp: mỗi câu một dòng, câu nhiều em sai xếp trước. */
  const rowsLop = useMemo(() => (du ? rowsLopSai(du.bank, du.maCa, du.luot) : []), [du])

  /** Cổng chạy hai lần: một lần đếm (soCau 0) để biết max cho thanh kéo, một lần
   * rút thật theo số thầy kéo. Đếm rẻ và thuần máy nên không tiếc. */
  const demChua = useMemo(
    () => (khoDe.length > 0 && rowsLop.length > 0 ? rutDeChua({ khoDe, rows: rowsLop, soCau: 0, locSao, locDang }) : null),
    [khoDe, rowsLop, locSao, locDang],
  )
  const kqChua = useMemo(
    () => (cachLayCau === 'theo_dang' && demChua ? rutDeChua({ khoDe, rows: rowsLop, soCau: soCauChua, locSao, locDang }) : null),
    [cachLayCau, demChua, khoDe, rowsLop, soCauChua, locSao, locDang],
  )
  /** Câu cổng chọn, dựng lại thành BanDeCa để phần dưới của màn chạy nguyên. */
  const bankTheoDang: BanDeCa = useMemo((): BanDeCa => {
    if (!kqChua || kqChua.cau.length === 0) return { phanI: [], phanII: [], phanIII: [] }
    const id = new Set(kqChua.cau.map((c) => c.id))
    return mergeKeepAnswers(
      khoDe.map((s) => ({
        ...s,
        phanI: s.phanI.filter((q) => id.has(q.id)),
        phanII: s.phanII.filter((q) => id.has(q.id)),
        phanIII: s.phanIII.filter((q) => id.has(q.id)),
      })),
    )
  }, [kqChua, khoDe])

  /** Bản đề của các mã thầy tích thêm, gộp lại thành một kho. */
  // KHỬ TRÙNG Ở ĐÂY, sau khi thầy đã tích — hộp chọn vẫn hiện đủ kho, còn danh
  // sách chữa thì không có hai câu y hệt nhau.
  const bankTichTay: BanDeCa = useMemo(() => {
    return mergeKeepAnswers(dayHoc ? deDaLuu.filter(d => maDeChon.has(d.maDe)) : khuTrungNguon(deDaLuu.filter((d) => maDeChon.has(d.maDe))).nguon)
  }, [deDaLuu, maDeChon, dayHoc])
  /** Số câu bị bỏ vì trùng — nói ra để thầy khỏi thắc mắc sao tích 40 ra 36. */
  const soCauTrung = useMemo(() => {
    const bo = khuTrungNguon(deDaLuu.filter((d) => maDeChon.has(d.maDe))).boQua
    return bo.I + bo.II + bo.III
  }, [deDaLuu, maDeChon])

  /** Câu chữa THÊM = kho chữa tự nạp của ca + đề thầy tích tay. Cả hai đều là
   * câu không em nào làm, nên không bao giờ bị xếp "giảng cả lớp". */
  const bankThem: BanDeCa = useMemo(() => {
    // Thầy tự chọn thì BỎ HẲN kho tự nạp: gộp cả hai là bảng chữa lại đầy câu
    // máy chọn, đúng chỗ thầy vừa kêu.
    if (cachLayCau === 'theo_dang') return bankTheoDang
    if (cachLayCau === 'btvn_gan_nhat') return bankTichTay
    const san = cachLayCau === 'san' ? du?.khoChua : null
    return {
      phanI: [...(san?.phanI ?? []), ...bankTichTay.phanI],
      phanII: [...(san?.phanII ?? []), ...bankTichTay.phanII],
      phanIII: [...(san?.phanIII ?? []), ...bankTichTay.phanIII],
    }
  }, [du, bankTichTay, cachLayCau, bankTheoDang])

  /** NẠP BTVN ĐÃ GIAO CHO CA NÀY (ĐỂ CHỌN CHỮA BTVN GẦN NHẤT) */
  useEffect(() => {
    if (!du?.maCa) {
      setDsBtvnCa([])
      setBtvnChon(null)
      return
    }
    let huy = false
    void (async () => {
      setDangTaiBtvnCa(true)
      try {
        const ch = await layCauHinhMayChu()
        const mat = (await loadTeacherSecret()) || ''
        const list = await theoDoiBtvn(ch, mat, du.maCa)
        if (!huy) {
          setDsBtvnCa(list)
          if (list.length > 0) {
            setBtvnChon(list[0].maBtvn)
            if (list[0].maDe) {
              setMaDeChon(new Set([list[0].maDe]))
            }
          }
        }
      } catch (err) {
        console.error('Lỗi nạp BTVN theo ca:', err)
      } finally {
        if (!huy) setDangTaiBtvnCa(false)
      }
    })()
    return () => {
      huy = true
    }
  }, [du?.maCa])

  /** DANH SÁCH CÂU ĐÁNG CHỮA = câu của ca + câu thầy tích thêm.
   *
   * Số câu của phần thêm đánh tiếp sau câu của ca, không đánh lại từ 1: hai
   * dòng cùng ghi "Phần I câu 3" là thầy đọc nhầm câu ngay trên lớp. */
  const dsCau: CauChua[] = useMemo(() => {
    // THẦY TỰ CHỌN BÀI hoặc CHỌN BTVN GẦN NHẤT ⇒ CHỈ chữa đúng những câu đó.
    if (cachLayCau === 'tu_chon' || cachLayCau === 'theo_dang' || cachLayCau === 'btvn_gan_nhat') return cauTuBanDe(bankThem)

    const cuaCa = du ? cauTuBanDe(du.bank) : []
    const dich = { I: du?.bank.phanI.length ?? 0, II: du?.bank.phanII.length ?? 0, III: du?.bank.phanIII.length ?? 0 }
    const daCo = new Set(cuaCa.map((c) => c.id))
    return [...cuaCa, ...cauTuBanDe(bankThem, dich).filter((c) => !daCo.has(c.id))]
  }, [du, bankThem, cachLayCau])
  const baiLam = useMemo(() => (du ? baiLamTuCa(du.bank, du.maCa, du.luot) : []), [du])
  const dsEmCa = useMemo(() => (du ? emTuCa(du.luot, du.hoSo, dsCau, daGoiCau, vang) : []), [du, dsCau, daGoiCau, vang])
  const dsEm = useMemo(() => {
    const q = timEm.trim().toLowerCase()
    return q ? dsEmCa.filter((e) => e.sbd.includes(q) || e.hoTen.toLowerCase().includes(q)) : dsEmCa
  }, [dsEmCa, timEm])
  useEffect(() => { if(dayHoc) { setKq(null); setKqBuoi(null); setKqXep(null); setHtmlMayChieu('') } }, [dayHoc, maDeChon, vang, du?.maCa])
  const soCoMat = dsEmCa.filter((e) => e.coMat).length

  /** Tra câu ĐẦY ĐỦ theo id — gộp nhiều đề thì `viTri` của hai đề trùng nhau,
   * phải tra theo id. Nạp thêm toàn bộ đề đã lưu để không bao giờ thiếu câu. */
  const traCau = useMemo(() => {
    const m = new Map<string, CauDayDu>()
    for (const b of [du?.bank, bankThem]) {
      if (!b) continue
      for (const q of b.phanI) m.set(q.id, { phan: 'I', q })
      for (const q of b.phanII) m.set(q.id, { phan: 'II', q })
      for (const q of b.phanIII) m.set(q.id, { phan: 'III', q })
    }
    for (const s of deDaLuu) {
      for (const q of s.phanI) m.set(q.id, { phan: 'I', q })
      for (const q of s.phanII) m.set(q.id, { phan: 'II', q })
      for (const q of s.phanIII) m.set(q.id, { phan: 'III', q })
    }
    return m
  }, [du, bankThem, deDaLuu])

  /** Số câu (khác nhau) trên bảng sắp chiếu mà máy KHÔNG tra được nội dung đề — tờ chiếu vẫn mở nhưng hiện dòng thay thế; thầy được báo TRƯỚC khi mở (Boss 21/09). Cùng nguồn với `moMayChieu`:
   *  buổi chữa mới khi có em lên bảng, không thì bảng phân công cũ. */
  const soCauThieuNoiDung = useMemo(() => {
    const dongLen = kqBuoi ? kqBuoi.dong.filter((d) => d.tang === 'len_bang' && d.em) : []
    const ids = dongLen.length > 0 ? dongLen.map((d) => d.cau.id) : (kq?.phanCong ?? []).map((p) => p.cau.id)
    return demCauThieuNoiDung(ids, traCau)
  }, [kqBuoi, kq, traCau])
  const dongBaoThieuNoiDung = chuThieuNoiDung(soCauThieuNoiDung)
  /** Thống kê buổi chữa theo LUẬT MỚI: số câu CHỮA + số em NHIỀU LƯỢT (suy từ `dong`, không cần thêm trường). */
  const thongKeBuoi = useMemo(() => {
    const dem = new Map<string, number>()
    for (const d of kqBuoi?.dong ?? []) if (d.tang === 'len_bang' && d.em) dem.set(d.em.sbd, (dem.get(d.em.sbd) ?? 0) + 1)
    return {
      soCauChua: kqBuoi ? kqBuoi.dong.filter((d) => d.tang === 'len_bang').length : 0,
      soEmNhieuLuot: [...dem.values()].filter((n) => n > 1).length,
    }
  }, [kqBuoi])



  // ------------------------------------------------ GIÁO ÁN 80 PHÚT: dữ liệu
  //
  // Dùng CHUNG `dsCau` / `dsEmCa` với đường phân công cũ — một nguồn sự thật về
  // "chữa câu nào, có mặt em nào". Chỉ thêm hai thứ đường cũ không cần: giây
  // làm từng câu (để đọc nguyên nhân sai) và kho lịch sử (nguồn N2).
  const baiLamGiay = useMemo(() => (du ? baiLamCoGiayTuCa(du.bank, du.maCa, du.luot) : []), [du])
  const vapCa = useMemo(() => vapCuaLop(dsCau, baiLamGiay), [dsCau, baiLamGiay])
  const doKhoCau = useMemo(() => dungDoKho(dsCau, baiLamGiay, kho.muc), [dsCau, baiLamGiay, kho])
  const soBatBuoc = useMemo(() => doKhoCau.filter((d) => d.batBuoc && !boBatBuoc.includes(d.cau.id)).length, [doKhoCau, boBatBuoc])
  // `soLanLenBang` = LỊCH SỬ THẬT 30 NGÀY + số lần đã gọi TRONG BUỔI.
  //
  // Trước đây chỗ này cắm cứng 0 vì máy chủ vứt mất `qid` của `ghiLenBang` và
  // `TienDoCa` không có cột nào giữ lịch sử. Nay có sheet `LenBang` riêng (thêm
  // sheet, KHÔNG đụng bảng nào đang chạy) nên đọc được số thật.
  //
  // Cộng cả hai vì chúng là hai chuyện khác nhau: lịch sử trả lời "tháng qua em
  // lên mấy lần", còn đếm trong buổi trả lời "hôm nay đã gọi rồi". Thiếu vế sau
  // thì bấm xếp lại lần hai sẽ gọi đúng em vừa lên.
  const emLenBang = useMemo(
    () =>
      dsEmCa.map((e) => ({
        sbd: e.sbd,
        hoTen: e.hoTen,
        coMat: e.coMat,
        soLanLenBang: (lichSu?.theoEm[e.sbd]?.soLan ?? 0) + (daGoiCau[e.sbd] ?? []).length,
      })),
    [dsEmCa, daGoiCau, lichSu],
  )
  const chuGiaoAn = useMemo(() => {
    if (!kqXep || !du) return ''
    return dungGiaoAn(kqXep, {
      ngay: new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      maCa: du.maCa,
      soEmNop: du.luot.filter((l) => daCoBaiLam(l)).length,
      tenDe: du.ten,
      // Bộ câu lấy thẳng từ ca đang mở ⇒ đường A, khớp tuyệt đối, không suy đoán.
      duong: 'A',
      soCauKhop: kqXep.dong.length,
      soCauTong: dsCau.length,
    })
  }, [kqXep, du, dsCau])

  useEffect(() => {
    void (async () => {
      // Đọc hỏng thì chạy tiếp với kho rỗng: mất N2 chỉ làm độ khó rơi về N1/N3
      // kèm dòng chữ nói rõ, còn ném lỗi ở đây là gãy cả màn.
      try {
        const c = await docKhoDoKho<KhoDoKhoLuu>()
        if (c && c.muc) setKho(c)
      } catch {
        /* kho độ khó là phần thêm, không có vẫn xếp được giờ */
      }
    })()
  }, [])

  // Lịch sử lên bảng: đọc một lần khi có cấu hình máy chủ. Máy chủ bản cũ chưa
  // có lệnh này ⇒ để `null` và màn nói thật, KHÔNG coi là hỏng.
  useEffect(() => {
    if (!cauHinh) return
    void (async () => {
      try {
        setLichSu(await lichSuLenBang(cauHinh.url, cauHinh.mat))
      } catch {
        setLichSu(null)
      }
    })()
  }, [cauHinh])

  /** Dựng nền kho độ khó: duyệt ca cũ trên máy chủ, cộng dồn theo qid. Chỉ nạp
   * ca CHƯA duyệt nên bấm lại lần hai gần như tức thì. */
  const dungKho = async () => {
    if (!cauHinh) return showToast('Chưa cấu hình máy chủ', 'error')
    setDangDungKho('Đang lấy danh sách ca…')
    try {
      const ds = await danhSachCa(cauHinh.url, cauHinh.mat)
      let hienTai = kho
      const canNap = ds.filter((c) => !hienTai.daDuyet.includes(c.maCa))
      let i = 0
      for (const c of canNap) {
        i++
        setDangDungKho(`Đang nạp ca ${i}/${canNap.length} — ${c.maCa}`)
        try {
          const ct = await chiTietCa(cauHinh.url, cauHinh.mat, c.maCa, true)
          const bank: BanDeCa | null = ct.keyBank ? { phanI: ct.keyBank.phanI, phanII: ct.keyBank.phanII, phanIII: ct.keyBank.phanIII } : null
          if (!bank) continue
          hienTai = gopCaVaoKho(hienTai, c.maCa, bank, ct.luot as unknown as LuotCa[], new Date().toISOString())
        } catch {
          // Một ca hỏng KHÔNG chặn các ca còn lại; ca ấy đơn giản là chưa vào kho.
        }
        // CẤT DỌC ĐƯỜNG, không đợi tới cuối. Dựng kho là việc dài (mỗi ca một
        // lượt gọi máy chủ kèm cả bản đề); cất một lần ở cuối thì thầy đóng tab
        // ở ca 25/32 là mất trắng cả 25 ca vừa nạp. `daDuyet` giữ danh sách ca
        // đã cộng nên lần sau bấm lại chỉ nạp phần còn thiếu.
        if (i % 5 === 0 || i === canNap.length) {
          await luuKhoDoKho(hienTai)
          setKho(hienTai)
        }
      }
      await luuKhoDoKho(hienTai)
      setKho(hienTai)
      const tk = thongKeKho(hienTai)
      showToast(`Kho độ khó: ${tk.soQid} câu qua ${tk.soCa} ca · ${tk.ge8} câu đạt 8 lượt trở lên`, 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không dựng được kho độ khó', 'error')
    } finally {
      setDangDungKho('')
    }
  }


  const chayGiaoAn = () => {
    if (!du) return showToast('Chưa mở ca nào', 'warn')
    if (!dsCau.length) return showToast('Chưa có câu nào để chữa — lên mục 2 tích bài cần chữa trước', 'warn')
    const r = xepGioLenBang(doKhoCau, emLenBang, baiLamGiay, vapCa.theoEm, {
      boBatBuoc,
      tranEm,
      giayMoiEm,
      thieuGiay: !vapCa.coGiay,
      // Chỉ khai "chưa có lịch sử" khi ĐÚNG LÀ chưa có — máy chủ bản cũ chưa có
      // lệnh đọc, hoặc có lệnh mà chưa em nào lên bảng lần nào.
      chuaCoLichSuLenBang: !lichSu || Object.keys(lichSu.theoEm).length === 0,
    })
    setKqXep(r)
  }

  /** Thầy chạm MỘT lựa chọn thừa giờ là áp ngay và xếp lại — không bắt tự dò ô số.
   * Đặc tả mục 4.3 viết "chờ thầy chạm", nên nó phải chạm được. */
  const chamLuaChon = (ma: 1 | 2 | 3) => {
    const t = kqXep?.thuaGio
    if (!t) return
    let bo = boBatBuoc
    let tran = tranEm
    let giay = giayMoiEm
    if (ma === 1) {
      const canBo = Math.ceil(Math.max(0, t.giayCan - t.giayCo) / CAU_HINH_LEN_BANG_MAC_DINH.GIAY_LANE.L2)
      bo = [
        ...boBatBuoc,
        ...doKhoCau
          .filter((d) => d.batBuoc && !boBatBuoc.includes(d.cau.id))
          .sort((a, b) => a.giaTri - b.giaTri)
          .slice(0, canBo)
          .map((d) => d.cau.id),
      ]
      setBoBatBuoc(bo)
    } else if (ma === 2) {
      const nen = t.giayCan - Math.min(tranEm, soCoMat) * (giayMoiEm - CAU_HINH_LEN_BANG_MAC_DINH.GIAY_LANE.L2)
      tran = Math.max(0, Math.floor((t.giayCo - nen) / Math.max(1, giayMoiEm - CAU_HINH_LEN_BANG_MAC_DINH.GIAY_LANE.L2)))
      setTranEm(tran)
    } else {
      const soL3 = Math.min(tranEm, soCoMat)
      const nen = t.giayCan - soL3 * (giayMoiEm - CAU_HINH_LEN_BANG_MAC_DINH.GIAY_LANE.L2)
      giay = soL3 > 0 ? Math.max(CAU_HINH_LEN_BANG_MAC_DINH.GIAY_LANE.L2, Math.floor((t.giayCo - nen) / soL3) + CAU_HINH_LEN_BANG_MAC_DINH.GIAY_LANE.L2) : giayMoiEm
      setGiayMoiEm(giay)
    }
    setKqXep(
      xepGioLenBang(doKhoCau, emLenBang, baiLamGiay, vapCa.theoEm, {
        boBatBuoc: bo,
        tranEm: tran,
        giayMoiEm: giay,
        thieuGiay: !vapCa.coGiay,
        chuaCoLichSuLenBang: !lichSu || Object.keys(lichSu.theoEm).length === 0,
      }),
    )
  }

  /** Đổi em cho ĐÚNG một dòng, giữ nguyên phần còn lại. */
  const doiEm = (cauId: string) =>
    setKqXep((cu) => (cu ? doiEmChoDong(cu, cauId, doKhoCau, emLenBang, vapCa.theoEm) : cu))

  /** In giáo án: mở cửa sổ chỉ có chữ giáo án, khổ A4 dọc. Trình duyệt tự lo
   * phần "lưu thành PDF" — không nhét thư viện PDF vào bundle cho một nút in. */
  const inGiaoAn = () => {
    if (!chuGiaoAn) return
    const w = window.open('', '_blank')
    if (!w) return showToast('Trình duyệt chặn cửa sổ in — cho phép rồi bấm lại', 'warn')
    const thoat = (t: string) => t.replace(/[&<>]/g, (c) => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : '&gt;'))
    w.document.write(
      `<!doctype html><meta charset="utf-8"><title>Giáo án chữa</title>` +
        `<style>@page{size:A4 portrait;margin:14mm}body{font:12px/1.5 ui-monospace,Menlo,Consolas,monospace;white-space:pre-wrap}</style>` +
        `<body>${thoat(chuGiaoAn)}</body>`,
    )
    w.document.close()
    w.focus()
    w.print()
  }

  const copyGiaoAn = async () => {
    if (!chuGiaoAn) return
    try {
      await navigator.clipboard.writeText(chuGiaoAn)
      setDaCopyGiaoAn(true)
      setTimeout(() => setDaCopyGiaoAn(false), 2500)
      showToast('Đã copy giáo án', 'success')
    } catch {
      showToast(chuGiaoAn, 'success')
    }
  }

  const chay = (luot: number) => {
    if (!du) return showToast('Chưa mở ca nào', 'warn')
    if (soCoMat === 0) return showToast('Không em nào có mặt — bỏ tích lại vài em', 'warn')
    const r = phanCong(dsCau, baiLam, dsEmCa, { ...MAC_DINH, soLuot: luot })
    setSoLuot(luot)
    setKq(r)
    setXemCau('')
  }

  /** MỘT NÚT CHẠY CẢ HAI, đúng thứ tự: xếp giờ trước để biết em nào lên bảng,
   * phân công sau để biết em ấy chữa câu nào. */
  /** CÂU ĐƯA VÀO THUẬT TOÁN MỚI — gộp độ khó đo được với sao trong kho. */
  const cauVaoXepGoc = useMemo<CauVaoXep[]>(
    () =>
      doKhoCau.map((d) => {
        const goc = traCau.get(d.cau.id)
        return {
          cau: d.cau,
          tiLeDung: d.n1 && d.n1.n > 0 ? (d.n1.n - d.n1.sai) / d.n1.n : null,
          soEmLam: d.n1?.n ?? 0,
          batBuoc: d.batBuoc && !boBatBuoc.includes(d.cau.id),
          // Độ DÀI của câu (số từ, hình/bảng, số bước lời giải) — để giờ lên bảng tính theo đề dài hay ngắn, không chỉ theo sao.
          noiDung: goc ? noiDungTuCauGoc(goc.phan, goc.q) : undefined,
          // Bậc bố cục ƯỚC LƯỢNG trên tờ chiếu (1 = ghép đôi được … 5 = chiếm cả bảng) — để cảnh báo câu quá dài ngay lúc xếp buổi.
          bacUoc: goc ? uocLuongBacCauGoc(goc.phan, goc.q).bac : undefined,
          // Hệ số hiệu chỉnh giờ theo GIÂY THẬT của (phần, sao) này (M6) — chưa đủ mẫu thì không có.
          heSoHieuChinh: heSoCua(heSoHC, d.cau.phan, d.cau.sao),
        }
      }),
    [doKhoCau, boBatBuoc, traCau, heSoHC],
  )
  /** Đang NỐI buổi: chỉ các câu còn lại (câu bắt buộc chưa chữa vẫn bắt buộc, trừ khi thầy bỏ tích), mỗi câu mang em đã định để giữ nếu còn có mặt. */
  const cauVaoXep = useMemo<CauVaoXep[]>(
    () =>
      tiepBuoi
        ? cauVaoXepGoc
            .filter((c) => tiepBuoi.conLai.has(c.cau.id))
            .map((c) => ({ ...c, batBuoc: c.batBuoc || (tiepBuoi.batBuoc.has(c.cau.id) && !boBatBuoc.includes(c.cau.id)), emDaDinh: tiepBuoi.emGiu[c.cau.id] }))
        : cauVaoXepGoc,
    [cauVaoXepGoc, tiepBuoi, boBatBuoc],
  )

  /** BÀI TẬP VỀ NHÀ CẢ LỚP — cộng dồn từ hồ sơ, KHÔNG ước lượng. Không em nào
   * có bài giao thì trả `null` để màn hình nói thẳng là chưa có dữ liệu. */
  const tomBtvnLop = useMemo(() => {
    const co = hoSoLop.filter((e) => e.btvn.soCauGiao > 0)
    if (co.length === 0) return null
    return {
      soEmCoBai: co.length,
      giao: co.reduce((t, e) => t + e.btvn.soCauGiao, 0),
      daLam: co.reduce((t, e) => t + e.btvn.soDaLam, 0),
      dung: co.reduce((t, e) => t + e.btvn.soDung, 0),
      sai: co.reduce((t, e) => t + e.btvn.soSai, 0),
      chua: co.reduce((t, e) => t + e.btvn.soChuaLam, 0),
    }
  }, [hoSoLop])

  /** XẾP BUỔI CHỮA 90 PHÚT — thuật toán viết lại 14/09.
   *
   * Trước khi xếp phải có HỒ SƠ ĐẦY ĐỦ của lớp: chỉ nhìn ca vừa thi thì gọi
   * nhầm hai kiểu em — em đã chữa câu ấy rồi, và em ca này không làm câu ấy
   * nhưng sai đúng dạng ấy trong bài tập về nhà. */
  const chayBuoiChua = async () => {
    if (!du) return
    const coMat = dsEmCa.filter((e) => e.coMat).map((e) => ({ sbd: e.sbd, hoTen: e.hoTen, coMat: true }))
    if (coMat.length === 0) return showToast('Không em nào có mặt', 'warn')

    // Hồ sơ lớp là của (em có mặt × câu của buổi) nào — đổi một trong hai thì xin lại. Trước 19/09
    // chỉ so SỐ em có mặt: hai em đổi chỗ vẫn giữ hồ sơ cũ; và một lần mất mạng thì hồ sơ rỗng
    // được giữ mãi vì số em không đổi.
    const qidBuoi = cauVaoXep.map((c) => c.cau.id)
    const khoaHoSo = `${coMat.map((e) => e.sbd).sort().join(',')}|${[...new Set(qidBuoi)].sort().join(',')}`
    let hoSo = hoSoLop
    if (loiHoSo || khoaHoSo !== khoaHoSoDaNap.current) {
      // `qidBuoi`: máy chủ mới trả thêm hồ sơ nắm kiến thức (số lần sai thật, dạng yếu, bậc) ĐÚNG cho các câu này.
      const r = await napHoSoLop(cauHinh?.url ?? '', cauHinh?.mat ?? '', coMat, qidBuoi)
      hoSo = r.hoSo
      setHoSoLop(r.hoSo)
      setLoiHoSo(r.loi)
      khoaHoSoDaNap.current = r.loi ? '' : khoaHoSo
      // KHÔNG DỪNG khi mất mạng: vẫn xếp được bằng dữ liệu ca hiện tại, chỉ là
      // ghép em kém chính xác hơn — và màn hình nói rõ điều đó.
      if (r.loi) showToast(`Chưa lấy được hồ sơ lớp (${r.loi}) — xếp bằng dữ liệu ca này`, 'warn')
    }

    // LUẬT MỚI (thầy chốt 25/09): chọn câu "sai nhiều → … → cốt tủy" + khoá sàn 80 %, gán em mọi em ≥ 1 lượt
    // (lượt thêm cân bằng, seed tất định). `cham` = em SAI CHÍNH câu này được ưu tiên lên chữa — KHÔNG còn ZPD.
    const saiSet = new Set<string>()
    for (const b of baiLamGiay) if (b.sbd && b.idCau && !b.dung) saiSet.add(`${b.sbd}|${b.idCau}`)
    const kq = xepBuoiChuaMoi(cauVaoXep, hoSo, CAU_HINH_LEN_BANG_MAC_DINH, (sbd, c) =>
      saiSet.has(`${sbd}|${c.qid}`) ? { diem: 0.6, viSao: 'sai câu này' } : { diem: 0 },
    )
    setKqBuoi(kq)
    if (!kq.datSan && kq.thieu) showToast(kq.thieu.viSao, 'warn')
  }

  /** NỐI BUỔI (M4): tình trạng buổi dở đã lưu — câu còn lại / đã chữa (đối chiếu cả lịch sử lên bảng của máy chủ khi đã đọc được). */
  const tinhTrangDo = useMemo(() => (buoiDo ? tinhTrangBuoi(buoiDo, lichSu) : null), [buoiDo, lichSu])

  const chayCaHai = () => {
    // Có buổi dở của ca này mà thầy chưa chọn nối hay bắt đầu mới: chặn (im lặng ghi đè bản lưu là mất phần đã làm).
    if (!dayHoc && buoiDo && tinhTrangDo && tinhTrangDo.conLai.length > 0 && !buoiQuyet) {
      return showToast('Ca này có buổi chữa dở — bấm "Tiếp tục buổi trước" hoặc "Bắt đầu buổi mới" trước', 'warn')
    }
    if (dayHoc) {
      if (!lichSu) return showToast('Chưa tải được lịch sử lên bảng. Thầy tải lại lịch sử trước khi phân công.', 'warn')
      try {
        // Seed theo MÃ CA: cùng ca, cùng đầu vào ⇒ cùng bảng (không còn bốc thăm `Math.random` mỗi lần bấm).
        const result = phanCongDayHoc(dsCau, dsEmCa.map(e => ({...e, soLanLenBang: lichSu.theoEm[e.sbd]?.soLan ?? 0})), hashSeed(`day-hoc:${du?.maCa ?? ''}`))
        setKqXep(null); setKqBuoi(null); setKq(result); setXemCau('')
      } catch (e) { showToast(e instanceof Error ? e.message : 'Chưa phân công được', 'warn') }
      return
    }
    chayGiaoAn()
    chay(1)
    void chayBuoiChua()
  }

  // ── NỐI BUỔI CHỮA (M4) ──────────────────────────────────────────────────────────────────────────────────
  // Mở ca ⇒ đọc buổi dở đã lưu (khoá = mốc reset | lớp | mã ca; hết hạn 14 ngày; buổi trước reset không có vì đã bị dọn).
  useEffect(() => {
    setBuoiDo(null)
    setBuoiQuyet(null)
    setTiepBuoi(null)
    setTuDongXep(false)
    goiBuoiGoc.current = null
    batDauBuoiMoi.current = ''
    if (!du || dayHoc) return
    let huy = false
    void (async () => {
      try {
        // Khoá buổi KHÔNG gắn mốc reset: reset giữ toàn bộ ca thi (21/09) nên buổi dở của ca còn nguyên vẫn nối được qua reset.
        const khoa = khoaBuoiChua(MOC_KHOA_BUOI, du.lop, du.maCa)
        const raw = await docBuoiChua(khoa)
        if (huy || !raw) return
        if (!laBuoiChuaHopLe(raw) || raw.khoa !== khoa || !conHan(raw, new Date())) {
          await xoaBuoiChua(khoa).catch(() => {}) // hỏng / quá 14 ngày ⇒ bỏ, không nối nhầm
          return
        }
        setBuoiDo(raw)
      } catch {
        /* không đọc được buổi dở thì coi như không có — buổi mới vẫn xếp được */
      }
    })()
    return () => {
      huy = true
    }
  }, [du?.maCa, du?.lop, dayHoc])

  /** LƯU BUỔI sau mỗi lần xếp và mỗi lần ghi kết quả. Lỗi lưu không được làm hỏng buổi đang chữa. */
  useEffect(() => {
    if (!kqBuoi || !du || dayHoc) return
    const kehoach = kqBuoi.dong.filter((d) => d.tang === 'len_bang' && d.em).map((d) => ({ qid: d.cau.id, sbd: d.em!.sbd }))
    const cauTrongBuoi = kqBuoi.dong.map((d) => ({ qid: d.cau.id, batBuoc: cauVaoXep.find((c) => c.cau.id === d.cau.id)?.batBuoc ?? false }))
    // Kết quả đã ghi của MỌI câu thuộc buổi này (kể cả ô của lần xếp trước trong cùng phiên) — không lấy ô của ca khác.
    const qidBuoi = new Set([...cauTrongBuoi.map((c) => c.qid), ...(goiBuoiGoc.current?.cauBuoi ?? [])])
    const ketQua = Object.fromEntries(Object.entries(ketQuaBuoi).filter(([k]) => qidBuoi.has(k.slice(k.indexOf('|') + 1))))
    if (!goiBuoiGoc.current && !batDauBuoiMoi.current) batDauBuoiMoi.current = new Date().toISOString()
    const nguon = { cachLayCau, maDeChon: [...maDeChon], soCauChua, locSao, locDang }
    const goc = goiBuoiGoc.current
    const batDauLuc = batDauBuoiMoi.current
    void (async () => {
      try {
        const rec = taoBanGhiBuoi(goc, { moc: MOC_KHOA_BUOI, lop: du.lop, maCa: du.maCa, tenCa: du.ten, nguon, cauTrongBuoi, kehoach, ketQua, nay: new Date(), batDauLuc })
        await luuBuoiChua(rec.khoa, rec)
      } catch (e) {
        console.warn('[buổi chữa] không lưu được buổi dở:', e)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kqBuoi, ketQuaBuoi])

  /** "XOÁ PHIÊN PHÂN CÔNG LÊN BẢNG" (thầy lệnh 21/09 16:4x): dọn phiên đang có TRÊN MÁY NÀY — buổi dở đã lưu (`xoaBuoiChua`) + bảng phân công, tiến độ các đợt, tờ chiếu, kết quả Đạt / Chưa đạt đang nhớ trên màn —
   * rồi đưa màn về lúc chưa phân công để phân công lại từ đầu. KHÔNG GỬI LỆNH GHI NÀO lên máy chủ: bảng `len_bang` và sổ học của học sinh giữ nguyên (kết quả đã ghi vẫn còn). Ca đang mở (`du`) giữ nguyên. */
  const xoaPhienPhanCong = async () => {
    const khoaCa = du ? khoaBuoiChua(MOC_KHOA_BUOI, du.lop, du.maCa) : ''
    for (const khoa of new Set([khoaCa, buoiDo?.khoa ?? ''])) if (khoa) await xoaBuoiChua(khoa).catch(() => {})
    phienChieu.current = null
    setKq(null)
    setKqXep(null)
    setKqBuoi(null)
    setHtmlMayChieu('')
    setKetQuaBuoi({})
    setDaGoiCau({})
    setSoLuot(1)
    setXemCau('')
    setBuoiDo(null)
    setBuoiQuyet(null)
    setTiepBuoi(null)
    setTuDongXep(false)
    goiBuoiGoc.current = null
    batDauBuoiMoi.current = ''
    setLichSuCauEm(null)
    setHoiXoaPhien(false)
    showToast('Đã xoá phiên phân công lên bảng — phân công lại từ đầu', 'success')
  }

  /** "Tiếp tục buổi trước": dựng lại nguồn câu của buổi, rồi xếp CHỈ các câu còn lại cho em CÓ MẶT hôm nay (em vắng được thay). */
  const tiepTucBuoi = () => {
    if (!buoiDo || !tinhTrangDo) return
    const tt = tinhTrangDo
    setCachLayCau(buoiDo.nguon.cachLayCau)
    setMaDeChon(new Set(buoiDo.nguon.maDeChon))
    setSoCauChua(buoiDo.nguon.soCauChua)
    setLocSao(buoiDo.nguon.locSao as LocSao)
    setLocDang(buoiDo.nguon.locDang as LocDang)
    const coMat = new Set(dsEmCa.filter((e) => e.coMat).map((e) => e.sbd))
    setTiepBuoi({ conLai: new Set(tt.conLai), batBuoc: new Set(buoiDo.batBuoc), emGiu: emGiuKhiNoi(buoiDo, tt.conLai, coMat) })
    // Câu máy chủ đã xác nhận chữa (ở máy khác) được GHI VÀO bản lưu — mất mạng lần sau vẫn không hiện lại như câu còn lại.
    goiBuoiGoc.current = { ...buoiDo, daChua: tt.daChua }
    setKetQuaBuoi({})
    setBuoiQuyet('tiep')
    setTuDongXep(true)
  }

  /** "Bắt đầu buổi mới": bỏ phần dở đã lưu (KHÔNG đụng lịch sử lên bảng ở máy chủ). */
  const batDauBuoiMoiFn = () => {
    if (buoiDo) void xoaBuoiChua(buoiDo.khoa).catch(() => {})
    goiBuoiGoc.current = null
    batDauBuoiMoi.current = ''
    setBuoiDo(null)
    setTiepBuoi(null)
    setBuoiQuyet('moi')
  }

  // Nối xong dựng lại nguồn câu thì tự xếp; nguồn không dựng lại được thì nói thật thay vì xếp rỗng.
  useEffect(() => {
    if (!tuDongXep || !tiepBuoi) return
    if (cauVaoXep.length === 0) {
      const hen = setTimeout(() => {
        setTuDongXep(false)
        showToast('Không dựng lại được câu của buổi trước — chọn lại nguồn câu ở mục 2 rồi xếp giờ', 'warn')
      }, 2500)
      return () => clearTimeout(hen)
    }
    setTuDongXep(false)
    const thieu = [...tiepBuoi.conLai].filter((q) => !cauVaoXep.some((c) => c.cau.id === q)).length
    if (thieu > 0) showToast(`${thieu} câu của buổi trước không còn trong nguồn câu hiện tại — bỏ qua`, 'warn')
    chayCaHai()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tuDongXep, tiepBuoi, cauVaoXep])

  // ── "EM ĐÃ LÀM CÂU NÀY CHƯA" (thầy lệnh 21/09 16:4x) ─────────────────────────────────────────────────────────────
  // Mọi cặp (em, câu) đang có trên bảng (buổi chữa xếp sẵn + bảng phân công); mã câu theo quy ước máy chủ. Quét HẾT lịch sử (lệnh chỉ-đọc `/gv/lich-su-cau-cua-em`, không áp mốc hiển thị 12:00).
  const capLichSuCau = useMemo(() => {
    const cap: CapEmCau[] = []
    const them = (sbd: string, idCau: string) => {
      const qid = qidMayChuCuaIdCau(idCau)
      if (qid) cap.push({ sbd, qid })
    }
    for (const d of kqBuoi?.dong ?? []) if (d.tang === 'len_bang' && d.em) them(d.em.sbd, d.cau.id)
    for (const p of kq?.phanCong ?? []) them(p.sbd, p.cau.id)
    return cap
  }, [kqBuoi, kq])
  const khoaCapLichSuCau = useMemo(() => [...new Set(capLichSuCau.map((c) => khoaEmCau(c.sbd, c.qid)))].sort().join(','), [capLichSuCau])
  useEffect(() => {
    if (!khoaCapLichSuCau) {
      setLichSuCauEm(null)
      return
    }
    let huy = false
    void layLichSuCau(capLichSuCau)
      .then((m) => { if (!huy) setLichSuCauEm(m) })
      .catch(() => { if (!huy) setLichSuCauEm(null) })
    return () => { huy = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [khoaCapLichSuCau])
  /** Nhãn của một cặp (em, câu) trên màn thầy; chưa có dữ liệu ⇒ null. */
  const nhanLichSuCua = (sbd: string, idCau: string): NhanLichSuCau | null => {
    const qid = qidMayChuCuaIdCau(idCau)
    return qid && lichSuCauEm ? nhanLichSuCau(lichSuCauEm.get(khoaEmCau(sbd, qid))) : null
  }


  /** TỜ MÁY CHIẾU — hai em một đợt, chiếu lên bảng để gọi lên chữa.
   *
   * Nguồn là ĐÚNG bảng phân công vừa chạy, không rút lại bộ khác: tờ chiếu lên
   * bảng mà khác bảng phân công thầy đang cầm thì gọi nhầm em ngay. */
  const moMayChieu = async () => {
    setDangMoMayChieu(true)
    try {
      // NGUỒN LÀ BUỔI CHỮA MỚI khi có học sinh lên bảng; nếu không có thì lùi về bảng phân công
      const dongLenBang = kqBuoi ? kqBuoi.dong.filter((d) => d.tang === 'len_bang' && d.em) : []
      const dsPc: {
        sbd: string
        hoTen: string
        cau: CauChua
        viSao: string
        btvnCau?: KetQuaBtvn
        btvnTom?: OBangMayChieu['btvnTom']
      }[] = dongLenBang.length > 0
        ? dongLenBang.map((d) => ({
            sbd: d.em!.sbd,
            hoTen: d.em!.hoTen,
            cau: d.cau,
            viSao: d.viSao,
            btvnCau: btvnCuaCau(d.em!, d.cau.id) ?? undefined,
            btvnTom:
              d.em!.btvn.soCauGiao > 0
                ? {
                    soCauGiao: d.em!.btvn.soCauGiao,
                    soDaLam: d.em!.btvn.soDaLam,
                    soDung: d.em!.btvn.soDung,
                    soSai: d.em!.btvn.soSai,
                    soChuaLam: d.em!.btvn.soChuaLam,
                  }
                : undefined,
          }))
        : (kq?.phanCong ?? []).map((p) => ({ sbd: p.sbd, hoTen: p.hoTen, cau: p.cau, viSao: p.viSao }))

      if (dsPc.length === 0) {
        showToast('Chưa có bảng phân công — bấm "Xếp giờ & phân công lên bảng" trước', 'warn')
        return
      }

      const [{ cauLuyenTuBoCau }, { taoHtmlMayChieu }] = await Promise.all([
        import('../lib/bai-tap-pdf'),
        import('../lib/html-may-chieu'),
      ])

      const dsO: OBangMayChieu[] = []
      const hoSoEmTheoSbd = new Map(hoSoLop.map((e) => [e.sbd, e]))
      const tiLeDungTheoCau = new Map(cauVaoXep.map((c) => [c.cau.id, c.tiLeDung]))
      // Các ô CÓ TRÊN tờ, tra theo `khoa` khi tờ gửi lệnh ghi (không tin sbd/qid trong tin đến).
      const oTrenTo = new Map<string, { sbd: string; hoTen: string; cau: CauChua }>()
      for (const p of dsPc) {
        const day = timCauTheoId(traCau, p.cau.id) // cùng hàm tra với dòng báo "câu chưa tra được nội dung" ở màn

        let cl: CauLuyen | undefined
        if (day) {
          const [parsed] = cauLuyenTuBoCau([{ phan: day.phan, q: day.q } as Parameters<typeof cauLuyenTuBoCau>[0][number]])
          cl = parsed
        }

        // Tạo câu luyện dự phòng đảm bảo tờ chiếu 100% mở được
        const cauHopLe: CauLuyen = cl ?? {
          id: p.cau.id,
          phan: p.cau.phan,
          maDe: '',
          chuyenDe: '',
          dang: 'chua_ro',
          sao: p.cau.sao,
          mucDo: (p.cau.mucDo as any) || '',
          text: p.cau.tomTat || `Nội dung câu hỏi ${p.cau.so}`,
          luaChon: null,
          dapAn: '',
          chot: '',
          lyDo: null,
          buoc: null,
          ketQua: '',
        }

        oTrenTo.set(khoaToChieu(p.sbd, p.cau.id), { sbd: p.sbd, hoTen: p.hoTen, cau: p.cau })
        dsO.push({
          sbd: p.sbd,
          hoTen: p.hoTen,
          qid: p.cau.id,
          // Bậc bố cục ước lượng: tờ CHỈ ghép đôi hai câu cùng bậc 1 (câu dài đứng một mình); tờ vẫn đo lại lúc chiếu.
          bacUoc: (day ? uocLuongBacCauGoc(day.phan, day.q) : uocLuongBacCau(cauHopLe)).bac,
          soCau: p.cau.so,
          sao: p.cau.sao,
          mucDo: p.cau.mucDo,
          cau: cauHopLe,
          viSao: p.viSao,
          btvnCau: p.btvnCau,
          btvnTom: p.btvnTom,
          // Thẻ tên + màn gọi tên: "lần lên bảng thứ N" (lần này tính vào). Chưa có hồ sơ lớp (chế độ dạy học) thì không in.
          lanLenBang: hoSoEmTheoSbd.get(p.sbd) ? hoSoEmTheoSbd.get(p.sbd)!.lenBang.soLan + 1 : undefined,
          // Cùng đầu vào Engine E dùng để tính T của câu ⇒ giờ hai pha trên tờ khớp giờ đã xếp cho buổi.
          tiLeLopSai: tiLeDungTheoCau.get(p.cau.id) != null ? 1 - (tiLeDungTheoCau.get(p.cau.id) as number) : undefined,
          bacEm: hoSoEmTheoSbd.get(p.sbd)?.namKt?.get(p.cau.id)?.bac ?? null,
          heSoHieuChinh: heSoCua(heSoHC, p.cau.phan, p.cau.sao),
        })
      }

      if (dsO.length === 0) {
        showToast('Chưa có câu nào để chiếu lên bảng', 'warn')
        return
      }

      // "EM ĐÃ LÀM CÂU NÀY CHƯA": quét HẾT lịch sử của từng cặp (em, câu) MỘT lần, chạy song song với thần thú. Không gọi được ⇒ tờ không có nhãn (không bịa).
      const lichSuTheoCap = layLichSuCau(dsO.flatMap((o) => (o.qid && qidMayChuCuaIdCau(o.qid) ? [{ sbd: o.sbd, qid: qidMayChuCuaIdCau(o.qid)! }] : []))).catch(() => null)

      // THẦN THÚ CỦA TỪNG EM (có timeout an toàn)
      try {
        const { thanThuV2ChoToChieu } = await import('../lib/anh-than-thu-v2')
        const docThu = thanThuLopDocApi
        const dsThu = await Promise.all(
          dsO.map((o) => thanThuV2ChoToChieu(docThu, o.sbd, 2000).catch(() => null)),
        )
        for (const [i, t] of dsThu.entries()) {
          if (t !== null && dsO[i]) dsO[i]!.thanThu = t
        }
      } catch {
        /* không lấy được thú thì thôi — tờ chiếu vẫn phải mở */
      }

      const mapLichSu = await lichSuTheoCap
      if (mapLichSu) {
        for (const o of dsO) {
          const qid = o.qid ? qidMayChuCuaIdCau(o.qid) : null
          const nhan = qid ? nhanLichSuCau(mapLichSu.get(khoaEmCau(o.sbd, qid))) : null
          if (nhan) o.lichSuCau = nhan
        }
      }

      // CÂU CHỈ ĐỌC ĐÁP ÁN đi thành trang đáp án nối sau các đợt
      const dsDapAn: CauLuyen[] = []
      for (const c of kqBuoi?.cauDocDapAn ?? []) {
        let day = traCau.get(c.id)
        if (!day) {
          for (const [k, v] of traCau.entries()) {
            if (k.endsWith(c.id) || c.id.endsWith(k)) {
              day = v
              break
            }
          }
        }
        if (!day) continue
        const [cl] = cauLuyenTuBoCau([{ phan: day.phan, q: day.q } as Parameters<typeof cauLuyenTuBoCau>[0][number]])
        if (cl) dsDapAn.push(cl)
      }

      // CẦU NỐI GHI KẾT QUẢ NGAY TRÊN TỜ CHIẾU: mã phiên ngẫu nhiên mỗi lần mở, chỉ nằm trong HTML của tờ này.
      const maPhien = taoMaPhienChieu()
      const html = taoHtmlMayChieu(dsO, {
        dayHoc,
        tenBuoi: dayHoc ? 'Dạy học · Gọi lên bảng' : du ? `Chữa bài ca ${du.maCa}` : 'Gọi lên bảng',
        ngay: new Date(),
        dsDapAn,
        cauNoi: { maPhien },
        nganSachPhut: dayHoc ? undefined : CAU_HINH_LEN_BANG_MAC_DINH.NGAN_SACH_PHUT,
      })

      phienChieu.current = { ma: maPhien, o: oTrenTo, cuaSo: null, goc: '*' }
      setHtmlMayChieu(html)
      showToast('Đang mở tờ chiếu lên bảng', 'success')
    } catch (e) {
      console.error('Lỗi khi mở tờ máy chiếu:', e)
      showToast(e instanceof Error ? e.message : 'Không mở được tờ máy chiếu', 'warn')
    } finally {
      setDangMoMayChieu(false)
    }
  }

  const doiVang = (sbd: string) =>
    setVang((cu) => {
      const m = new Set(cu)
      if (m.has(sbd)) m.delete(sbd)
      else m.add(sbd)
      return m
    })

  const copyBang = async () => {
    if (!kq || !du) return
    const t = bangChu(kq, du.ten)
    try {
      await navigator.clipboard.writeText(t)
      setDaCopy(true)
      setTimeout(() => setDaCopy(false), 2500)
      showToast('Đã copy bảng phân công', 'success')
    } catch {
      showToast(t, 'success')
    }
  }

  /** Gửi một tin xuống khung tờ máy chiếu đang mở (nếu đã bắt tay). Khung đóng rồi thì thôi. */
  const guiToChieu = (msg: Record<string, unknown>) => {
    const p = phienChieu.current
    if (!p?.cuaSo) return
    try {
      p.cuaSo.postMessage({ ...msg, maPhien: p.ma }, p.goc)
    } catch {
      /* khung đã đóng */
    }
  }

  /** CHẤM CÂU TRÊN BẢNG PHÂN CÔNG (Engine C): ghi đạt/không đạt vào log mạnh–yếu rồi bỏ dòng
   * khỏi bảng (`boDong`). Ghi hỏng thì GIỮ dòng lại — mất dòng mà máy chủ chưa có gì là thầy
   * tưởng đã ghi rồi. Việc ghi nằm ở `ghiKetQua`, dùng chung với bảng buổi chữa và tờ máy chiếu.
   * Ô đã ghi từ chỗ khác (bảng buổi chữa, tờ chiếu) thì chỉ bỏ dòng, không ghi đôi. */
  const cham = async (p: DongPhanCong, dat: boolean) => {
    if (daGhiKhoa.current.has(khoaToChieu(p.sbd, p.cau.id))) return boDong(p)
    if (await ghiKetQua(p, dat)) boDong(p)
  }

  /** LƯU MỘT MẪU GIÂY THẬT (M6) sau khi máy chủ đã nhận kết quả, rồi tính lại hệ số. Lỗi lưu không được làm hỏng việc ghi kết quả. */
  const ghiMauGiayThuc = async (cau: CauChua, g: { giay: number; duTinh: number }) => {
    try {
      const ds = await themMauGiayThuc({ phan: cau.phan, sao: (cau.sao ?? 0) as 0 | 1 | 2, giay: g.giay, duTinh: g.duTinh, luc: new Date().toISOString() })
      setHeSoHC(heSoHieuChinh(ds))
    } catch (e) {
      console.warn('[giờ thật] không lưu được mẫu:', e)
    }
  }

  /** GHI MỘT KẾT QUẢ LÊN BẢNG — MỘT đường duy nhất cho MỌI nơi bấm: `cham` (Engine C, bảng
   * "Phân công"), `chamBuoi` (Engine E, bảng buổi chữa) và tờ máy chiếu (qua `ghiTheoKhoa`). Cùng
   * một lệnh `ghiLenBang`, máy chủ ghi `len_bang` + sổ `nguon='len_bang'`, cùng thông báo, cùng cập
   * nhật lịch sử tại chỗ. Trả `true` chỉ khi máy chủ đã nhận: ghi hỏng thì bên gọi GIỮ dòng lại —
   * mất dòng mà máy chủ chưa có gì là thầy tưởng đã ghi rồi. */
  const ghiKetQua = async (p: { sbd: string; hoTen: string; cau: CauChua }, dat: boolean, giayThuc?: { giay: number; duTinh: number }): Promise<boolean> => {
    if (!cauHinh) {
      showToast('Chưa cấu hình máy chủ', 'error')
      return false
    }
    const cd = p.cau.chuyenDe
    if (!cd) {
      showToast('Câu này không có chuyên đề — chưa ghi được vào log mạnh–yếu', 'warn')
      return false
    }
    setDangCham(p.sbd + p.cau.id)
    try {
      await ghiLenBang(cauHinh.url, cauHinh.mat, { sbd: p.sbd, chuyenDe: cd, dat, qid: p.cau.id, ...(giayThuc ? { giayThuc: giayThuc.giay } : {}) })
      if (giayThuc) void ghiMauGiayThuc(p.cau, giayThuc)
      showToast(`${p.hoTen || p.sbd}: ${dat ? 'đạt' : 'không đạt'} — đã ghi vào ${cd}`, dat ? 'success' : 'warn')
      setDaGoiCau((cu) => ({ ...cu, [p.sbd]: [...new Set([...(cu[p.sbd] ?? []), p.cau.id])] }))
      // Cộng ngay vào lịch sử đang giữ: máy chủ vừa ghi xong, khỏi tải lại cả bảng.
      setLichSu((cu) =>
        cu
          ? {
              ...cu,
              theoEm: {
                ...cu.theoEm,
                [p.sbd]: {
                  soLan: (cu.theoEm[p.sbd]?.soLan ?? 0) + 1,
                  lanCuoi: new Date().toISOString(),
                  qids: [...new Set([...(cu.theoEm[p.sbd]?.qids ?? []), p.cau.id])],
                },
              },
            }
          : cu,
      )
      // …và vào hồ sơ lớp của buổi chữa: xếp lại buổi thì em vừa lên bảng đã tính một lượt, không bị gọi lại như chưa từng lên.
      setHoSoLop((cu) =>
        cu.map((e) =>
          e.sbd === p.sbd
            ? { ...e, lenBang: { soLan: e.lenBang.soLan + 1, lanCuoi: new Date().toISOString(), qids: [...new Set([...e.lenBang.qids, p.cau.id])] } }
            : e,
        ),
      )
      // Khoá chung + báo cho tờ máy chiếu (nếu đang chiếu) khoá ô ấy — bấm ở bảng thì tờ chiếu cũng khoá.
      const khoa = khoaToChieu(p.sbd, p.cau.id)
      daGhiKhoa.current.add(khoa)
      guiToChieu({ type: TIN_TO_CHIEU.DA_GHI, khoa, dat })
      return true
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không ghi được kết quả', 'error')
      return false
    } finally {
      setDangCham('')
    }
  }

  /** GHI THEO KHOÁ `sbd|qid` — cổng chung của bảng buổi chữa và tờ máy chiếu, IDEMPOTENT: ô đã ghi trả `true`
   * ngay (không ghi lại); ô đang chờ máy chủ thì chờ đúng lượt ghi ấy (không mở lượt thứ hai). Nhờ vậy tờ chiếu
   * quá 8 giây coi là lỗi rồi bấm lại cũng không ghi đôi nếu lượt đầu thật ra đã thành công. */
  const ghiTheoKhoa = async (o: { sbd: string; hoTen: string; cau: CauChua }, dat: boolean, giayThuc?: { giay: number; duTinh: number }): Promise<boolean> => {
    const khoa = khoaToChieu(o.sbd, o.cau.id)
    if (daGhiKhoa.current.has(khoa)) return true
    const dang = dangGhiKhoa.current.get(khoa)
    if (dang) return dang
    const luot = ghiKetQua(o, dat, giayThuc)
    dangGhiKhoa.current.set(khoa, luot)
    try {
      const ok = await luot
      if (ok) setKetQuaBuoi((cu) => (cu[khoa] ? cu : { ...cu, [khoa]: dat ? 'dat' : 'khong_dat' }))
      return ok
    } finally {
      dangGhiKhoa.current.delete(khoa)
    }
  }
  ghiTheoKhoaRef.current = ghiTheoKhoa

  /** CHẤM CÂU TRÊN BẢNG BUỔI CHỮA (Engine E) — cùng `ghiKetQua` với `cham`. Dòng KHÔNG bị bỏ khỏi
   * bảng (bảng này cũng là nguồn của tờ máy chiếu đang chiếu): chỉ đổi nút thành kết quả đã ghi. */
  const chamBuoi = async (d: DongChua, dat: boolean) => {
    if (!d.em) return
    await ghiTheoKhoa({ sbd: d.em.sbd, hoTen: d.em.hoTen, cau: d.cau }, dat)
  }

  /** NGHE TỜ MÁY CHIẾU — chỉ khi đang chiếu. Mọi tin đi qua `kiemTinToChieu` (nguồn = ĐÚNG khung iframe tờ
   * chiếu, gốc, mã phiên, ô có trên tờ); tin không đủ thì bỏ lặng lẽ. Lệnh ghi đi qua `ghiTheoKhoa` — cùng đường
   * và cùng khoá chống ghi đôi với bảng buổi chữa; app trả lại `da_ghi` hoặc `loi` cho tờ. */
  useEffect(() => {
    if (!htmlMayChieu) return
    const ma = phienChieu.current?.ma
    const nghe = (e: MessageEvent) => {
      const p = phienChieu.current
      if (!p) return
      const tin = kiemTinToChieu(e, {
        maPhien: p.ma,
        gocApp: window.location.origin,
        laKhungToChieu: (nguon) =>
          !!nguon && [...document.querySelectorAll<HTMLIFrameElement>('.lop-xem-phieu iframe')].some((f) => f.contentWindow === nguon),
        khoaHopLe: (khoa) => p.o.has(khoa),
      })
      if (!tin) return
      const cuaSo = e.source as Window
      const goc = gocGuiLai(e.origin)
      if (tin.loai === 'san_sang') {
        p.cuaSo = cuaSo
        p.goc = goc
        guiToChieu({ type: TIN_TO_CHIEU.KET_NOI })
        // Ô đã ghi từ trước khi tờ mở (bảng buổi chữa, bảng Phân công): khoá ngay, khỏi để bấm lần nữa.
        for (const khoa of p.o.keys()) if (daGhiKhoa.current.has(khoa)) guiToChieu({ type: TIN_TO_CHIEU.DA_GHI, khoa })
        return
      }
      const o = p.o.get(tin.khoa)
      if (!o) return
      void ghiTheoKhoaRef.current?.(o, tin.dat, tin.giayThuc).then((ok) => {
        if (phienChieu.current !== p) return // tờ đã đóng/đổi phiên trong lúc chờ máy chủ
        try {
          cuaSo.postMessage({ type: TIN_TO_CHIEU.PHAN_HOI, maPhien: p.ma, khoa: tin.khoa, kq: ok ? 'da_ghi' : 'loi', dat: ok ? tin.dat : undefined }, goc)
        } catch {
          /* khung đã đóng */
        }
      })
    }
    window.addEventListener('message', nghe)
    return () => {
      window.removeEventListener('message', nghe)
      // Chỉ xoá phiên CỦA MÌNH: mở tờ mới đè lên tờ cũ thì phiên mới đã đặt trước khi dọn tờ cũ.
      if (phienChieu.current?.ma === ma) phienChieu.current = null
    }
    // Gắn một lần cho mỗi tờ; các hàm bên trong đọc qua ref nên luôn là bản mới nhất.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [htmlMayChieu])

  const boDong = (p: DongPhanCong) => {
    setKq((cu) => (cu ? { ...cu, phanCong: cu.phanCong.filter((x) => !(x.sbd === p.sbd && x.cau.id === p.cau.id)) } : cu))
    if (xemCau === p.sbd + p.cau.id) setXemCau('')
  }

  const theoLuot = useMemo(() => {
    const m = new Map<number, DongPhanCong[]>()
    for (const p of kq?.phanCong ?? []) {
      const a = m.get(p.luot)
      if (a) a.push(p)
      else m.set(p.luot, [p])
    }
    return [...m.entries()].sort((a, b) => a[0] - b[0])
  }, [kq])

  /** Thẻ câu đầy đủ (phương án, hình, lời giải) — dựng bằng đúng thẻ của màn
   * xem lại, không vẽ một kiểu hiển thị thứ hai. */
  const veCau = (id: string, so: number) => {
    const day = traCau.get(id)
    if (!day) return <OThongBao tone="cam">Không tìm thấy câu này trong bản đề của ca.</OThongBao>
    if (day.phan === 'I')
      return (
        <TheCau
          cheDo="xem_lai"
          phan="I"
          stt={so}
          tieuDe={day.q.tieuDe}
          text={day.q.text}
          thanCauImg={day.q.thanCauImg}
          table={day.q.table}
          imageDataUrl={day.q.imageDataUrl}
          hinhAnh={day.q.hinhAnh}
          choices={day.q.choices}
          choiceImgs={day.q.choiceImgs}
          choicePerm={[0, 1, 2, 3]}
          selected={null}
          correct={day.q.correct}
          explanation={day.q.explanation}
          loiGiai={day.q.loiGiai}
          nhanLoiGiai={day.q.loiGiaiTrangThai}
        />
      )
    if (day.phan === 'II')
      return (
        <TheCau
          cheDo="xem_lai"
          phan="II"
          stt={so}
          tieuDe={day.q.tieuDe}
          text={day.q.text}
          thanCauImg={day.q.thanCauImg}
          table={day.q.table}
          imageDataUrl={day.q.imageDataUrl}
          hinhAnh={day.q.hinhAnh}
          ideas={day.q.ideas}
          ideaImgs={day.q.ideaImgs}
          selected={[null, null, null, null]}
          correct={day.q.correct}
          explanation={day.q.explanation}
          loiGiai={day.q.loiGiai}
          nhanLoiGiai={day.q.loiGiaiTrangThai}
        />
      )
    return (
      <TheCau
        cheDo="xem_lai"
        phan="III"
        stt={so}
        tieuDe={day.q.tieuDe}
        text={day.q.text}
        thanCauImg={day.q.thanCauImg}
        table={day.q.table}
        imageDataUrl={day.q.imageDataUrl}
        hinhAnh={day.q.hinhAnh}
        selected={null}
        correct={day.q.correct}
        explanation={day.q.explanation}
        loiGiai={day.q.loiGiai}
        nhanLoiGiai={day.q.loiGiaiTrangThai}
      />
    )
  }

  return (
    <div className="gv-page min-h-screen pb-28 px-3 sm:px-4 pt-4 flex flex-col" style={{ background: 'var(--nen)', color: 'var(--muc)', gap: 'var(--k4)', fontFamily: 'var(--sans)' }}>
      <div className="gv-page-header flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/70 text-[color:var(--m3-on-tertiary-container)] border border-emerald-200 dark:border-emerald-800 shadow-2xs shrink-0">
            <UserCheck size={22} />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-tight">
              Gọi học sinh lên bảng
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Phân công chữa bài tập, dạy học và theo dõi lượt lên bảng
            </p>
          </div>
        </div>
      </div>

      {/* SEGMENTED SWITCHER CHUẨN GOOGLE MATERIAL 3 */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-full max-w-md border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
        <button
          type="button"
          onClick={() => { setDayHoc(false); setCachLayCau('tu_chon'); setKq(null); setKqXep(null); setKqBuoi(null); setHtmlMayChieu('') }}
          className={`flex-1 py-2 px-3.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
            !dayHoc
              ? 'bg-white dark:bg-slate-700 text-[color:var(--m3-primary)] dark:text-blue-400 shadow-xs ring-1 ring-black/5 dark:ring-white/10'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <BookOpenCheck size={16} /> Chữa bài thi & BTVN
        </button>
        <button
          type="button"
          onClick={() => { setDayHoc(true); setCachLayCau('tu_chon'); setKq(null); setKqXep(null); setKqBuoi(null); setHtmlMayChieu('') }}
          className={`flex-1 py-2 px-3.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
            dayHoc
              ? 'bg-white dark:bg-slate-700 text-[color:var(--m3-primary)] dark:text-blue-400 shadow-xs ring-1 ring-black/5 dark:ring-white/10'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <UserCheck size={16} /> Dạy học theo đề
        </button>
      </div>
      {dayHoc ? (
        <p className="text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 p-2.5 rounded-xl border border-blue-200 dark:border-blue-800/60 -mt-2 leading-relaxed">
          ✨ <strong>Thuật toán Bậc thang Sư phạm 3 Nấc</strong>: Phân công câu hỏi theo nấc nhận thức (Nấc 1: Khởi động nền tảng cho em yếu/củng cố gốc · Nấc 2: Kỹ năng chuẩn mực cho em khá · Nấc 3: Mở rộng bứt phá bản chất cho em giỏi). Đảm bảo công bằng số lượt lên bảng.
        </p>
      ) : (
        <p className="text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 -mt-2 leading-relaxed">
          ✨ <strong>Thuật toán Chữa BTVN 3 Luồng & Vùng phát triển gần (ZPD)</strong>: Lọc câu dễ (≥ 85% đúng) vào Chiếu đáp án · Lọc câu bẫy tập thể (≥ 35% độ chụm) Thầy giảng cả lớp · Gọi 12–20 em lên bảng cho các câu trọng điểm theo đúng tầm với ZPD của em để cả lớp cùng tiến bộ.
        </p>
      )}
      {loi && <OThongBao tone="do">{loi}</OThongBao>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* 1 — CA LẤY BÀI LÀM */}
        <TheNoiDung className="h-full">
        <div className="flex items-center justify-between" style={{ gap: 'var(--k2)' }}>
          <div style={TIEU_DE_MUC}>1. Ca lớp vừa làm</div>
          {du && (
            <span style={{ ...NHAN_NHO, ...SO }}>
              {dsCau.length} câu · {dsEm.length} em có bài
            </span>
          )}
        </div>
        <div style={{ ...NHAN_NHO, marginTop: 4 }}>Câu để chữa và bài làm của em đều lấy từ ca này — cùng dữ liệu với phiếu gửi phụ huynh.</div>
        {dsCa !== null && soCaCoNutGat === 0 && soCaTat > 0 && (
          <div style={{ ...NHAN_NHO, marginTop: 4 }}>
            Không ca nào mở ở chế độ &ldquo;Phân công lên bảng&rdquo; nên đang hiện cả <span style={SO}>{soCaTat}</span> ca. Chọn một ca để xếp giáo án.
          </div>
        )}

        {soCaCoNutGat > 0 && soCaTat > 0 && (
          <button
            type="button"
            onClick={() => setHienCaTat((v) => !v)}
            aria-pressed={hienCaTat}
            className="tap-target self-start font-bold"
            style={{ marginTop: 'var(--k2)', minHeight: 36, padding: '0 var(--k3)', borderRadius: 'var(--bo-tron)', background: hienCaTat ? 'var(--muc)' : 'var(--the-2)', color: hienCaTat ? 'var(--muc-nguoc)' : 'var(--nhat)', border: 'none', fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)' }}
          >
            {hienCaTat ? 'Ẩn lại' : `Hiện cả ${soCaTat} ca đã tắt nút gạt`}
          </button>
        )}

        <div className="relative" style={{ marginTop: 'var(--k3)' }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: 15, color: 'var(--nhat)' }} />
          <input value={timCa} onChange={(e) => setTimCa(e.target.value)} placeholder="Tìm ca theo tên, mã hoặc lớp…" style={O_NHAP} aria-label="Tìm ca" />
        </div>

        {dsCa === null ? (
          <div style={{ ...NHAN_NHO, marginTop: 'var(--k3)' }}>Đang tải danh sách ca…</div>
        ) : dsCaLoc.length === 0 ? (
          <div style={{ ...NHAN_NHO, marginTop: 'var(--k3)' }}>Chưa có ca nào khớp.</div>
        ) : (
          <div className="flex flex-col" style={{ gap: 'var(--k1)', marginTop: 'var(--k3)', maxHeight: 300, overflowY: 'auto' }} data-hop-ca>
            <NhomCaThuGon ds={dsCaLoc} selected={c=>du?.maCa===c.maCa} render={(c) => {
              const chon = du?.maCa === c.maCa
              return (
                <button
                  key={c.maCa}
                  type="button"
                  onClick={() => void moCa(c)}
                  disabled={!!dangTaiCa}
                  aria-pressed={chon}
                  className="tap-target text-left flex items-center"
                  style={{ gap: 'var(--k3)', padding: 'var(--k2) var(--k3)', borderRadius: 'var(--bo-1)', background: chon ? 'var(--xanh-nen)' : 'var(--the-2)', border: 'none', color: 'var(--muc)' }}
                >
                  <span className="flex-1 min-w-0">
                    <span className="block truncate font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-2)' }}>
                      {c.tenCa || `Ca ${c.maCa}`}
                    </span>
                    <span style={NHAN_NHO}>
                      mã <span style={SO}>{c.maCa}</span>
                      {c.lop ? ` · lớp ${c.lop}` : ''} · <span style={SO}>{c.daNop}</span>/<span style={SO}>{c.daVao}</span> đã nộp
                      {!c.lenBang ? ' · đã tắt nút gạt' : ''}
                    </span>
                  </span>
                  {dangTaiCa === c.maCa ? <RefreshCw size={16} className="animate-spin shrink-0" /> : chon ? <Check size={16} className="shrink-0" style={{ color: 'var(--xanh)' }} /> : null}
                </button>
              )
            }}/>
          </div>
        )}
        {dangTaiCa && tienDo && <div style={{ ...NHAN_NHO, ...SO, marginTop: 'var(--k2)' }}>Đang lấy hồ sơ chuyên đề từng em… {tienDo}</div>}
      </TheNoiDung>

      {/* 2 — THÊM CÂU NGOÀI CA */}
      <TheNoiDung className="h-full">
        {!dayHoc && !anDeXuat && (
          <TheBuoiChuaXepSan deXuat={deXuat} onTuChon={() => setAnDeXuat(true)} />
        )}
        <div style={TIEU_DE_MUC}>2. Câu để chữa lấy ở đâu</div>
        <div style={{ ...NHAN_NHO, marginTop: 4, marginBottom: 'var(--k3)' }}>
          Bài làm của em ở mục 1 luôn được dùng để tính câu nào cả lớp cùng sai. Mục này chỉ quyết định LẤY CÂU NÀO RA CHỮA.
        </div>

        <div className="flex flex-wrap gap-2 mb-3" role="radiogroup" aria-label="Cách lấy câu để chữa">
          {(!dayHoc ? ['theo_dang', 'san', 'tu_chon', 'btvn_gan_nhat'] as const : []).map((c) => {
            const chon = cachLayCau === c
            const tat = (c === 'san' && !du?.khoChua) || (c === 'theo_dang' && (demChua?.tongUngVien ?? 0) === 0) || (c === 'btvn_gan_nhat' && !du)
            return (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={chon}
                disabled={tat}
                onClick={() => {
                  setCachLayCau(c)
                }}
                className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
                  chon
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-[color:var(--m3-primary)] dark:text-blue-300 border border-blue-300 dark:border-blue-700 shadow-2xs ring-2 ring-blue-400/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'
                } ${tat ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {c === 'theo_dang'
                  ? 'Theo dạng câu cả lớp sai'
                  : c === 'san'
                  ? 'Kiểm tra điểm yếu cộng dồn'
                  : c === 'btvn_gan_nhat'
                  ? 'Chữa BTVN đã phân gần nhất'
                  : 'Tôi tự chọn bài để chữa'}
              </button>
            )
          })}
        </div>

        {dayHoc ? <p className="text-sm text-slate-500">Chọn đề dạy học bên dưới. Toàn bộ câu sẽ được phân công theo thứ tự đề.</p> : cachLayCau === 'theo_dang' ? (
          <div data-theo-dang>
            <div style={{ ...NHAN_NHO, marginBottom: 'var(--k3)' }}>
              Rút từ <b>cả kho</b>, chỉ lấy câu cùng mã dạng với những câu cả lớp làm sai. Không lấy câu chuyên đề khác, không bó trong đề của ca.
            </div>
            {/* DẠNG CÂU — bấm là trần ở thanh dưới đổi theo, thầy chốt 07/09. */}
            <div className="flex flex-wrap gap-1.5 mb-2" role="radiogroup" aria-label="Dạng câu">
              {MOI_LOC_DANG.map((v) => {
                const chon = locDang === v
                return (
                  <button
                    key={v}
                    type="button"
                    role="radio"
                    aria-checked={chon}
                    onClick={() => setLocDang(v)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
                      chon
                        ? 'bg-[color:var(--m3-primary)] text-[color:var(--m3-on-primary)] shadow-2xs ring-2 ring-blue-400/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'
                    }`}
                  >
                    {TEN_LOC_DANG[v]}
                  </button>
                )
              })}
            </div>
            {/* MỨC SAO — thầy chốt 07/09. */}
            <div className="flex flex-wrap gap-1.5 mb-3" role="radiogroup" aria-label="Mức sao">
              {MOI_LOC_SAO.map((v) => {
                const chon = locSao === v
                return (
                  <button
                    key={v}
                    type="button"
                    role="radio"
                    aria-checked={chon}
                    onClick={() => setLocSao(v)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
                      chon
                        ? 'bg-[color:var(--m3-primary)] text-[color:var(--m3-on-primary)] shadow-2xs ring-2 ring-blue-400/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'
                    }`}
                  >
                    {TEN_LOC_SAO[v]}
                  </button>
                )
              })}
            </div>
            <ThanhSoCauChua
              soCau={soCauChua}
              onDoi={setSoCauChua}
              tongUngVien={demChua?.tongUngVien ?? 0}
              poolTheoCauSai={demChua?.poolTheoCauSai}
              thieu={demChua?.thieu}
              soCauSai={demChua?.poolTheoCauSai.length}
            />
          </div>
        ) : cachLayCau === 'san' ? (
          du?.khoChua ? (
            <div style={{ ...NHAN_NHO, color: 'var(--xanh)' }} data-kho-chua>
              Ca này mở bằng chế độ Kiểm tra điểm yếu nên đã tự nạp sẵn <b style={SO}>{du.khoChua.phanI.length + du.khoChua.phanII.length + du.khoChua.phanIII.length}</b> câu cùng chuyên đề để chia đủ bốn lượt. Không cần
              tích gì thêm.
            </div>
          ) : (
            <OThongBao tone="cam">Ca này không mở bằng chế độ Kiểm tra điểm yếu nên không có bộ câu rút sẵn. Chuyển sang "Tôi tự chọn bài để chữa".</OThongBao>
          )
        ) : cachLayCau === 'btvn_gan_nhat' ? (
          <div className="space-y-3 mb-3" data-btvn-gan-nhat>
            <div style={{ ...NHAN_NHO, marginBottom: 'var(--k2)' }}>
              Chọn bài tập về nhà đã phân gần nhất cho ca <b>{du?.maCa}</b> để gọi học sinh lên bảng chữa.
              Hệ thống áp dụng <b>Bậc thang Sư phạm 3 Nấc & Vùng phát triển gần (ZPD)</b> để gọi đúng em cần củng cố câu đó.
            </div>

            {dangTaiBtvnCa ? (
              <div className="p-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <RefreshCw size={15} className="animate-spin text-blue-600" />
                <span>Đang tải danh sách bài tập về nhà đã giao cho ca này…</span>
              </div>
            ) : dsBtvnCa.length === 0 ? (
              <OThongBao tone="cam">
                Chưa có bài tập về nhà nào được giao cho ca {du?.maCa}. Thầy có thể chuyển sang "Tôi tự chọn bài để chữa" để chọn đề từ kho.
              </OThongBao>
            ) : (
              <div className="space-y-2 max-h-[280px] overflow-y-auto">
                {dsBtvnCa.map((bt) => {
                  const daChon = btvnChon === bt.maBtvn
                  const tiLeNop = bt.tong > 0 ? Math.round((bt.daNop / bt.tong) * 100) : 0
                  return (
                    <div
                      key={bt.maBtvn}
                      role="button"
                      tabIndex={0}
                      aria-pressed={daChon}
                      onKeyDown={(e) => {
                        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault()
                          e.currentTarget.click()
                        }
                      }}
                      onClick={() => {
                        setBtvnChon(bt.maBtvn)
                        if (bt.maDe) {
                          setMaDeChon(new Set([bt.maDe]))
                        }
                      }}
                      className={`p-3 rounded-xl border transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                        daChon
                          ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-400 dark:border-blue-600 shadow-2xs ring-2 ring-blue-400/20'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100/60 dark:bg-blue-900/60 px-2 py-0.5 rounded">
                            #{bt.maDe || bt.maBtvn}
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {bt.maDe ? `Đề: ${bt.maDe}` : `BTVN: ${bt.maBtvn}`}
                          </span>
                          {bt.soCau > 0 && (
                            <span className="text-[11px] text-slate-500 font-semibold">
                              ({bt.soCau} câu)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                          <span>Giao {gioDayDu(bt.giaoLuc)}</span>
                          <span>·</span>
                          <span>Hạn nộp {gioDayDu(bt.hanNop)}</span>
                          {bt.quaHan && <span className="text-rose-500 font-bold">(Đã quá hạn)</span>}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {bt.daNop}/{bt.tong} em đã nộp
                        </div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          {tiLeNop}% hoàn thành
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          <div style={{ ...NHAN_NHO, marginBottom: 'var(--k3)' }} data-tu-chon>
            Tích bài muốn chữa. Bảng chữa CHỈ lấy câu trong bài thầy tích, áp dụng <b>Bậc thang Sư phạm 3 Nấc & Vùng phát triển gần (ZPD)</b>: Nấc 1 (câu 0 sao/Nhận biết) gọi em cần củng cố gốc để làm được ngay, tự tin; Nấc 2 (1 sao/Thông hiểu) gọi em khá làm mẫu chuẩn mực cho cả lớp; Nấc 3 (2 sao/Vận dụng) gọi em giỏi mở rộng tư duy tranh biện. Ghép đúng em đã làm sai hoặc chưa làm câu đó ở nhà nhưng rơi đúng vào vùng ZPD để em tự sửa và tiến bộ thực sự.
          </div>
        )}

        {cachLayCau === 'tu_chon' &&
          (deDaLuu.length === 0 ? (
          <OThongBao tone="cam">Chưa có đề nào trong máy — vào Ngân hàng câu hỏi bấm Đồng bộ trước.</OThongBao>
        ) : (
          <HopChonDe
            ds={deDaLuu}
            daChon={maDeChon}
            chonNhieu
            onChon={(ma) => {
              setMaDeChon((cu) => {
                const m = new Set(cu)
                if (m.has(ma)) m.delete(ma)
                else m.add(ma)
                return m
              })
            }}
            onChonTatCa={(ma) => {
              setMaDeChon(new Set(ma))
            }}
            cao={264}
          />
          ))}
        {/* Hộp trên hiện ĐỦ SỐ CÂU TRONG KHO. Câu trùng chỉ bị bỏ khi dựng danh
            sách chữa — nói ra con số ấy để thầy khỏi thắc mắc tích 40 ra 36. */}
        {!dayHoc && soCauTrung > 0 && (
          <div style={{ ...NHAN_NHO, marginTop: 'var(--k2)' }}>
            Đã bỏ <span style={SO}>{soCauTrung}</span> câu trùng giữa các bài đã tích — danh sách chữa lấy mỗi câu một lần.
          </div>
        )}
      </TheNoiDung>
      </div>

      {/* 3 — EM CÓ MẶT */}
      {du && (
        <TheNoiDung>
          <div className="flex items-center justify-between" style={{ gap: 'var(--k2)' }}>
            <div style={TIEU_DE_MUC}>3. Em có mặt hôm nay</div>
            <span style={{ ...NHAN_NHO, ...SO }}>
              {soCoMat}/{dsEmCa.length}
            </span>
          </div>
          <div style={{ ...NHAN_NHO, marginTop: 4 }}>Bỏ tích em vắng. Bài của em vắng vẫn tính vào tỉ lệ đúng/sai của câu, chỉ là em không nhận câu nào.</div>
          <div className="relative" style={{ marginTop: 'var(--k3)' }}>
            <Search size={18} style={{ position: 'absolute', left: 14, top: 15, color: 'var(--nhat)' }} />
            <input value={timEm} onChange={(e) => setTimEm(e.target.value)} placeholder="Tìm theo tên hoặc số báo danh…" style={O_NHAP} aria-label="Tìm học sinh" />
          </div>
          <div className="flex flex-col" style={{ gap: 'var(--k1)', marginTop: 'var(--k3)', maxHeight: 320, overflowY: 'auto' }}>
            {dsEm.map((e) => (
              <label key={e.sbd} className="tap-target flex items-center" style={{ gap: 'var(--k3)', padding: 'var(--k2) var(--k3)', borderRadius: 'var(--bo-1)', background: e.coMat ? 'var(--xanh-nen)' : 'transparent', cursor: 'pointer' }}>
                <input type="checkbox" checked={e.coMat} onChange={() => doiVang(e.sbd)} aria-label={`${e.hoTen || e.sbd} có mặt`} style={{ width: 20, height: 20, accentColor: 'var(--xanh)' }} />
                <span className="flex-1 min-w-0">
                  <span className="block truncate" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-2)' }}>
                    {e.hoTen || '(chưa có tên)'}
                  </span>
                  <span style={NHAN_NHO}>
                    SBD <span style={SO}>{e.sbd}</span>
                  </span>
                </span>
              </label>
            ))}
          </div>
        </TheNoiDung>
      )}

      {/* 4A — GIÁO ÁN 80 PHÚT (GOI-LEN-BANG-80-PHUT.md mục 6) */}
      {du && (
        <TheNoiDung>
          <div className="flex items-center justify-between flex-wrap" style={{ gap: 'var(--k2)' }}>
            <div style={TIEU_DE_MUC}>{dayHoc ? 'Phân công dạy học' : `Giáo án ${CAU_HINH_LEN_BANG_MAC_DINH.NGAN_SACH_PHUT} phút`}</div>
            <button
              type="button"
              onClick={() => void dungKho()}
              disabled={!!dangDungKho}
              className="tap-target inline-flex items-center font-bold"
              style={{ gap: 6, minHeight: 40, padding: '0 var(--k4)', borderRadius: 'var(--bo-tron)', background: 'var(--the-2)', color: 'var(--muc)', border: 'none', fontSize: 'var(--cx-1)' }}
            >
              <RefreshCw size={16} /> {dangDungKho || 'Dựng kho độ khó'}
            </button>
          </div>

          {/* Kho lịch sử là nguồn N2. Nói thẳng nó đang có gì, đừng để thầy đoán. */}
          <div style={{ ...NHAN_NHO, marginTop: 4 }}>
            Kho độ khó: <span style={SO}>{Object.keys(kho.muc).length}</span> câu qua <span style={SO}>{kho.daDuyet.length}</span> ca đã duyệt
            {Object.keys(kho.muc).length === 0 && ' — chưa dựng, độ khó đang chỉ đọc từ ca này và nhãn sao trong kho'}
          </div>
          <div style={{ ...NHAN_NHO, marginTop: 2 }}>
            {lichSu
              ? <>Lịch sử lên bảng {lichSu.soNgay} ngày: <span style={SO}>{Object.keys(lichSu.theoEm).length}</span> em, <span style={SO}>{Object.values(lichSu.theoEm).reduce((t, x) => t + x.soLan, 0)}</span> lượt</>
              : 'Chưa đọc được lịch sử lên bảng — mọi em coi như nhau về tần suất'}
          </div>

          {/* 4 — DANH SÁCH BẮT BUỘC CHỮA, hiện TRƯỚC khi xếp giờ */}
          {!dayHoc && doKhoCau.length > 0 && (
            <div style={{ marginTop: 'var(--k4)', padding: 'var(--k3)', borderRadius: 'var(--bo-2)', background: 'var(--cam-nen)' }} data-khoi="bat-buoc-chua">
              <div className="flex items-center font-bold" style={{ gap: 6, color: 'var(--cam)', fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)' }}>
                <BookOpenCheck size={16} /> BẮT BUỘC CHỮA — <span style={SO}>{soBatBuoc}</span>/<span style={SO}>{doKhoCau.length}</span> câu
              </div>
              <div className="flex flex-col" style={{ gap: 4, marginTop: 'var(--k2)' }}>
                {doKhoCau
                  .filter((d) => d.batBuoc)
                  .map((d) => (
                    <label key={d.cau.id} className="flex items-start" style={{ gap: 8, fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--muc)' }}>
                      <input
                        type="checkbox"
                        checked={!boBatBuoc.includes(d.cau.id)}
                        onChange={() =>
                          setBoBatBuoc((cu) => (cu.includes(d.cau.id) ? cu.filter((x) => x !== d.cau.id) : [...cu, d.cau.id]))
                        }
                        style={{ marginTop: 3 }}
                      />
                      <span>
                        <b>{chuCau(d.cau)}</b> · {d.viSaoBatBuoc}
                      </span>
                    </label>
                  ))}
              </div>
            </div>
          )}

          {!dayHoc && <>
          {/* 6 — CÀI ĐẶT: một nguồn sự thật, thầy chỉnh được đúng hai thứ mà ba
              lựa chọn thừa giờ nhắc tới. */}
          <div className="flex items-center flex-wrap" style={{ gap: 'var(--k3)', marginTop: 'var(--k4)', fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }}>
            <label className="flex items-center" style={{ gap: 6 }}>
              Trần em lên bảng
              <input
                type="number"
                min={0}
                max={30}
                value={tranEm}
                onChange={(e) => setTranEm(Math.max(0, Math.min(30, Number(e.target.value) || 0)))}
                style={{ ...SO, width: 64, height: 36, borderRadius: 'var(--bo-1)', background: 'var(--the-2)', border: 'none', color: 'var(--muc)', textAlign: 'center' }}
              />
            </label>
            <label className="flex items-center" style={{ gap: 6 }}>
              Phút mỗi em
              <input
                type="number"
                min={1}
                max={20}
                value={Math.round(giayMoiEm / 60)}
                onChange={(e) => setGiayMoiEm(Math.max(60, Math.min(1200, (Number(e.target.value) || 1) * 60)))}
                style={{ ...SO, width: 64, height: 36, borderRadius: 'var(--bo-1)', background: 'var(--the-2)', border: 'none', color: 'var(--muc)', textAlign: 'center' }}
              />
            </label>
            <span>
              ngân sách chữa <span style={SO}>{Math.round(nganSachGiay(CAU_HINH_LEN_BANG_MAC_DINH) / 60)}</span> phút
            </span>
          </div>

          </>}
          {/* MỘT NÚT, MỘT VIỆC (thầy chốt 14/09: "gộp 2 nút này làm một").
              Trước đây "Xếp giờ" và "Phân công lên bảng" là hai nút xanh y hệt
              nhau, nằm cách nhau một thẻ — thầy phải nhớ bấm cái nào trước, và
              bấm mỗi cái một lần mới đủ. Hai nút cùng màu cùng cỡ cạnh nhau là
              chỗ dễ bấm nhầm nhất. Nay một nút chạy cả hai: xếp giờ trước, phân
              công sau, đúng thứ tự vốn phải làm.

              ĐIỀU KIỆN MỜ giữ nguyên `!du || soCoMat === 0`. Bản cũ từng mờ theo
              `!dsCau.length`, mà `chayGiaoAn` đã có sẵn lời nhắc cho đúng ca ấy
              — nút mờ chặn trước nên lời nhắc không bao giờ hiện. Nút chết lặng
              là đúng thứ đặc tả cấm: không lặng lẽ sai. */}
          {!dayHoc && buoiDo && tinhTrangDo && tinhTrangDo.conLai.length > 0 && !buoiQuyet && (
            <div data-khoi="tiep-tuc-buoi" style={{ marginTop: 'var(--k4)', padding: 'var(--k3)', borderRadius: 'var(--bo-2)', background: 'var(--the-2)' }}>
              <div className="font-bold" style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', color: 'var(--muc)' }}>{chuTheTiepTuc(tinhTrangDo)}</div>
              <div style={{ ...NHAN_NHO, marginTop: 4 }}>
                Buổi bắt đầu {new Date(buoiDo.batDauLuc).toLocaleDateString('vi-VN')}, lưu tới {HAN_BUOI_CHUA_NGAY} ngày kể từ lần chữa gần nhất.
                {tinhTrangDo.soTuMayChu > 0 ? ` ${tinhTrangDo.soTuMayChu} câu máy chủ ghi nhận đã chữa ở máy khác.` : ''} Em vắng hôm nay: bỏ tích ở mục 3 rồi
                bấm Tiếp tục — em còn có mặt giữ nguyên câu cũ, em vắng được thay bằng em hợp nhất.
              </div>
              <div className="flex items-center flex-wrap" style={{ gap: 'var(--k3)', marginTop: 'var(--k3)' }}>
                <NutChinh onClick={tiepTucBuoi} disabled={soCoMat === 0}>Tiếp tục buổi trước</NutChinh>
                <button
                  type="button"
                  onClick={batDauBuoiMoiFn}
                  className="tap-target inline-flex items-center font-bold"
                  style={{ minHeight: 40, padding: '0 var(--k3)', borderRadius: 'var(--bo-tron)', background: 'transparent', color: 'var(--muc)', border: '1px solid var(--vien)', fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)' }}
                >
                  Bắt đầu buổi mới
                </button>
              </div>
            </div>
          )}

          <div style={{ marginTop: 'var(--k4)' }}>
            <NutChinh onClick={chayCaHai} disabled={!du || soCoMat === 0}>
              <span className="inline-flex items-center" style={{ gap: 8 }}>
                <Wand2 size={18} />
                <span>{dayHoc ? 'Phân công toàn bộ câu dạy học' : 'Xếp giờ & phân công lên bảng'}</span>
                <span style={{ ...SO, opacity: 0.82, fontWeight: 600 }}>
                  {dsCau.length} câu · {soCoMat} em
                </span>
              </span>
            </NutChinh>
            <div style={{ ...NHAN_NHO, marginTop: 6, textAlign: 'center' }}>
              {dayHoc ? 'Mỗi câu được phân cho một em; số lượt trong buổi được tính để chia đều.' : 'Một lượt bấm ra cả giáo án theo phút và bảng phân công từng em.'}
            </div>
          {(kq || kqBuoi || kqXep || buoiDo) && (
            <div style={{ marginTop: 'var(--k3)' }}>
              <button
                type="button"
                data-nut="xoa-phien-phan-cong"
                onClick={() => setHoiXoaPhien(true)}
                className="tap-target inline-flex items-center font-bold"
                style={{ gap: 6, minHeight: 36, padding: '0 var(--k3)', borderRadius: 'var(--bo-tron)', background: 'transparent', color: 'var(--nhat)', border: '1px solid var(--vien)', fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)' }}
              >
                <Trash2 size={14} /> Xoá phiên phân công lên bảng
              </button>
            </div>
          )}
          </div>

          {/* BUỔI CHỮA — LUẬT MỚI 25/09 (thay Engine E 14/09): chọn câu "sai nhiều → khó → cốt tủy" + khoá
              sàn 80 %, gán em mọi em ≥ 1 lượt. Hai con số thầy cần nhìn đầu tiên: bao nhiêu CÂU CHỮA, và
              đã ĐẠT SÀN 80 % chưa; rồi bao nhiêu em lên bảng (kèm số em nhiều lượt). */}
          {kqBuoi && (
            <div style={{ marginTop: 'var(--k4)', padding: 'var(--k3)', borderRadius: 'var(--bo-2)', background: kqBuoi.datSan ? 'var(--gg-luc-nen)' : 'var(--cam-nen)' }} data-khoi="buoi-chua">
              <div className="flex items-center flex-wrap" style={{ gap: 'var(--k3)' }}>
                <span className="font-bold" style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', color: kqBuoi.datSan ? 'var(--gg-luc)' : 'var(--cam)' }}>
                  <span style={SO}>{thongKeBuoi.soCauChua}</span> câu chữa · {kqBuoi.datSan ? 'đạt sàn 80 %' : 'chưa đạt sàn 80 %'}
                </span>
                <span style={{ ...NHAN_NHO, ...SO }}>
                  <span style={SO}>{kqBuoi.soEmLenBang}</span>/<span style={SO}>{kqBuoi.soEmToiThieu}</span> em lên bảng
                  {thongKeBuoi.soEmNhieuLuot > 0 ? ` · ${thongKeBuoi.soEmNhieuLuot} em nhiều lượt` : ''}
                </span>
                <span style={{ ...NHAN_NHO, ...SO }}>
                  {Math.round(kqBuoi.tongGiay / 60)}/{Math.round(kqBuoi.nganSach / 60)} phút
                </span>
                <span style={{ ...NHAN_NHO, ...SO }}>{kqBuoi.cauDocDapAn.length} câu chỉ đọc đáp án</span>
              </div>
              {tomBtvnLop && (
                <div style={{ ...NHAN_NHO, ...SO, marginTop: 6 }}>
                  Bài tập về nhà cả lớp: làm {tomBtvnLop.daLam}/{tomBtvnLop.giao} câu · đúng {tomBtvnLop.dung} · sai{' '}
                  {tomBtvnLop.sai} · chưa làm {tomBtvnLop.chua} · {tomBtvnLop.soEmCoBai} em có bài giao
                </div>
              )}
              {!tomBtvnLop && !loiHoSo && (
                <div style={{ ...NHAN_NHO, marginTop: 6 }}>
                  Chưa có dữ liệu bài tập về nhà cho lớp này — đang ghép em bằng bài thi và phiếu khắc phục.
                </div>
              )}
              {kqBuoi.thieu && (
                <div style={{ ...NHAN_NHO, marginTop: 6 }}>Chưa đủ sàn: {kqBuoi.thieu.viSao}</div>
              )}
              {loiHoSo && (
                <div style={{ ...NHAN_NHO, marginTop: 6 }}>
                  Hồ sơ lớp chưa lấy được ({loiHoSo}) — đang ghép em bằng dữ liệu ca này, kém chính xác hơn.
                </div>
              )}
              <div className="flex flex-col" style={{ gap: 'var(--k1)', marginTop: 'var(--k3)', maxHeight: 260, overflowY: 'auto' }}>
                {kqBuoi.dong
                  .filter((d) => d.tang === 'len_bang')
                  .map((d, i) => (
                    <div key={d.cau.id} className="flex items-center flex-wrap" style={{ gap: 'var(--k2)', fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)' }} data-dong-buoi={d.em ? `${d.em.sbd}|${d.cau.id}` : undefined}>
                      <span style={{ ...SO, color: 'var(--nhat)', minWidth: 22 }}>{i + 1}.</span>
                      <span className="font-bold">{d.em?.hoTen || d.em?.sbd}</span>
                      <span style={{ ...NHAN_NHO, ...SO }}>{chuCau(d.cau)}</span>
                      {/* BÀI TẬP VỀ NHÀ — hai thứ, đúng như thầy chốt 14/09:
                          câu ĐANG PHÂN em ở nhà làm ra sao, và cả lượt em làm
                          được bao nhiêu trên tổng số câu được giao. */}
                      <TheBtvn kq={d.em ? btvnCuaCau(d.em, d.cau.id) : null} />
                      {d.em && d.em.btvn.soCauGiao > 0 && (
                        <span style={{ ...NHAN_NHO, ...SO }}>
                          {d.em.btvn.soDaLam}/{d.em.btvn.soCauGiao} · Đ {d.em.btvn.soDung} · S {d.em.btvn.soSai} · ? {d.em.btvn.soChuaLam}
                        </span>
                      )}
                      {d.em && <NhanLichSuCauEm nhan={nhanLichSuCua(d.em.sbd, d.cau.id)} />}
                      <span style={{ ...NHAN_NHO, ...SO, marginLeft: 'auto' }}>{Math.round(d.giay / 60)}′</span>
                      <span className="truncate" style={{ ...NHAN_NHO, flex: '0 1 auto' }}>{d.viSao}</span>
                      {/* ĐẠT / KHÔNG ĐẠT ngay trên bảng thầy đang cầm — ghi ĐÚNG lệnh `ghiLenBang`
                          của bảng Phân công (máy chủ ghi `len_bang` + sổ `nguon='len_bang'`). */}
                      {d.em && (
                        <NutChamBuoi
                          tenEm={d.em.hoTen || d.em.sbd}
                          ketQua={ketQuaBuoi[`${d.em.sbd}|${d.cau.id}`]}
                          daGhi={(daGoiCau[d.em.sbd] ?? []).includes(d.cau.id)}
                          dangGhi={dangCham === d.em.sbd + d.cau.id}
                          onChon={(dat) => void chamBuoi(d, dat)}
                        />
                      )}
                    </div>
                  ))}
              </div>
              {dongBaoThieuNoiDung && (
                <div role="status" data-thieu-noi-dung style={{ ...NHAN_NHO, marginTop: 'var(--k3)' }}>
                  {dongBaoThieuNoiDung}
                </div>
              )}
              <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: 'var(--k3)' }}>
                <button
                  type="button"
                  onClick={() => void moMayChieu()}
                  disabled={dangMoMayChieu}
                  className="tap-target inline-flex items-center font-bold px-4 py-2 rounded-full cursor-pointer bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
                  style={{ gap: 6, minHeight: 40, fontSize: 'var(--cx-1)' }}
                >
                  <MonitorPlay size={16} />
                  <span>{dangMoMayChieu ? 'Đang mở tờ chiếu...' : 'Chiếu lên bảng ngay'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => void navigator.clipboard.writeText(bangChuBuoiChuaMoi(kqBuoi, du ? `Ca ${du.maCa}` : 'Buổi chữa')).then(() => showToast('Đã copy bảng buổi chữa', 'success'))}
                  className="tap-target inline-flex items-center font-bold"
                  style={{ gap: 6, minHeight: 40, padding: '0 var(--k4)', borderRadius: 'var(--bo-tron)', background: 'var(--the)', color: 'var(--muc)', border: '1px solid var(--vien)', fontSize: 'var(--cx-1)' }}
                >
                  <ClipboardCopy size={16} /> Copy bảng buổi chữa
                </button>
              </div>
            </div>
          )}

          {/* 5 — CẢNH BÁO THỪA GIỜ: hiện đúng con số và ba lựa chọn, CHỜ THẦY CHẠM */}
          {kqXep?.thuaGio && (
            <OThongBao tone="do">
              <b style={SO}>{kqXep.thuaGio.soCauBatBuoc}</b> câu bắt buộc · cần{' '}
              <b style={SO}>{Math.round(kqXep.thuaGio.giayCan / 60)}</b> phút, có{' '}
              <b style={SO}>{Math.round(kqXep.thuaGio.giayCo / 60)}</b> phút.
              {' '}Giá phải trả: chỉ <b style={SO}>{kqXep.soEmLenBang}</b>/<b style={SO}>{tranEm}</b> em được lên bảng.
              <div className="flex flex-col" style={{ gap: 6, marginTop: 8 }}>
                {kqXep.thuaGio.luaChon.map((l) => (
                  <button
                    key={l.ma}
                    type="button"
                    onClick={() => chamLuaChon(l.ma)}
                    className="tap-target text-left w-full"
                    style={{ minHeight: 44, padding: '8px var(--k3)', borderRadius: 'var(--bo-1)', background: 'var(--the-2)', color: 'var(--muc)', border: 'none', fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)' }}
                  >
                    {l.ma === 1 ? '①' : l.ma === 2 ? '②' : '③'} {l.chu} → <span style={SO}>{l.phutSau}</span> phút
                  </button>
                ))}
              </div>
              <div style={{ ...NHAN_NHO, marginTop: 6 }}>Chạm một dòng là áp ngay và xếp lại. Không chạm thì không đổi gì.</div>
            </OThongBao>
          )}

          {kqXep?.canhBao.map((c) => (
            <OThongBao key={c} tone="cam">
              {c}
            </OThongBao>
          ))}

          {/* 7 — GIÁO ÁN CÓ ĐỒNG HỒ */}
          {kqXep && kqXep.dong.length > 0 && (
            <div style={{ marginTop: 'var(--k4)' }} data-khoi="giao-an">
              <div className="flex items-center justify-between flex-wrap" style={{ gap: 'var(--k2)' }}>
                <div style={{ ...NHAN_NHO }}>
                  <span style={SO}>{Math.round(kqXep.tongGiay / 60)}</span>/
                  <span style={SO}>{CAU_HINH_LEN_BANG_MAC_DINH.NGAN_SACH_PHUT}</span> phút ·{' '}
                  <span style={SO}>{kqXep.soEmLenBang}</span> em lên bảng ·{' '}
                  {(['L0', 'L1', 'L2', 'L3'] as const).map((l) => `${kqXep.dong.filter((d) => d.lane === l).length} ${TEN_LANE[l].toLowerCase()}`).join(' · ')}
                </div>
                <button
                  type="button"
                  onClick={() => void copyGiaoAn()}
                  className="tap-target inline-flex items-center font-bold"
                  style={{ gap: 6, minHeight: 40, padding: '0 var(--k4)', borderRadius: 'var(--bo-tron)', background: daCopyGiaoAn ? 'var(--xanh-nen)' : 'var(--the-2)', color: daCopyGiaoAn ? 'var(--xanh)' : 'var(--muc)', border: 'none', fontSize: 'var(--cx-1)' }}
                >
                  {daCopyGiaoAn ? <Check size={16} /> : <ClipboardCopy size={16} />} {daCopyGiaoAn ? 'Đã copy' : 'Copy giáo án'}
                </button>
                <button
                  type="button"
                  onClick={inGiaoAn}
                  className="tap-target inline-flex items-center font-bold"
                  style={{ gap: 6, minHeight: 40, padding: '0 var(--k4)', borderRadius: 'var(--bo-tron)', background: 'var(--the-2)', color: 'var(--muc)', border: 'none', fontSize: 'var(--cx-1)' }}
                >
                  <Printer size={16} /> In / lưu PDF
                </button>
              </div>
              {/* ĐỔI EM CHO MỘT DÒNG — đặc tả mục 6.7. Đứng trên bản in để thầy
                  chốt người trước, rồi mới in ra giấy. */}
              {kqXep.dong.some((d) => d.lane === 'L3') && (
                <div className="flex flex-col" style={{ gap: 4, marginTop: 'var(--k3)' }} data-khoi="em-len-bang">
                  {kqXep.dong
                    .filter((d) => d.lane === 'L3')
                    .map((d) => (
                      <div key={d.cau.id} className="flex items-center justify-between flex-wrap" style={{ gap: 8, padding: '6px var(--k3)', borderRadius: 'var(--bo-1)', background: 'var(--the-2)' }}>
                        <span style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--muc)' }}>
                          <b>{chuCau(d.cau)}</b> → {d.em?.hoTen || `SBD ${d.em?.sbd ?? ''}`}
                          {d.vap ? <span style={NHAN_NHO}> · vấp {d.vap.idCau}</span> : <span style={NHAN_NHO}> · chưa vấp câu nào cùng chuyên đề</span>}
                        </span>
                        <button
                          type="button"
                          onClick={() => doiEm(d.cau.id)}
                          className="tap-target inline-flex items-center font-bold"
                          style={{ gap: 6, minHeight: 36, padding: '0 var(--k3)', borderRadius: 'var(--bo-tron)', background: 'var(--the-1)', color: 'var(--muc)', border: 'none', fontSize: 'var(--cx-1)' }}
                        >
                          <Shuffle size={14} /> Đổi em này
                        </button>
                      </div>
                    ))}
                </div>
              )}
              <pre
                style={{
                  marginTop: 'var(--k3)',
                  padding: 'var(--k3)',
                  borderRadius: 'var(--bo-2)',
                  background: 'var(--the-2)',
                  color: 'var(--muc)',
                  fontFamily: 'var(--sans)',
                  fontSize: 'var(--cx-1)',
                  whiteSpace: 'pre-wrap',
                  overflowX: 'auto',
                }}
              >
                {chuGiaoAn}
              </pre>
              <div style={{ ...NHAN_NHO, marginTop: 4 }}>
                Đồng hồ bắt đầu từ {dongHo(0)}. Mỗi con số trong giáo án đều kèm cỡ mẫu và tên nguồn.
              </div>
            </div>
          )}
        </TheNoiDung>
      )}

      {/* 4 — PHÂN CÔNG: nút cũ đã gộp lên trên. Ở đây chỉ còn TỜ MÁY CHIẾU.

          Nút phụ, không phải nút chính: việc chính là xếp giờ và phân công;
          chiếu lên bảng là bước sau, và chỉ có nghĩa khi đã có bảng phân công.
          Nên nó mang dáng nút viền (Material 3 outlined), không tranh chỗ với
          nút xanh ở trên. */}
      {kq && kq.phanCong.length > 0 && !kqBuoi && dongBaoThieuNoiDung && (
        <div role="status" data-thieu-noi-dung style={{ ...NHAN_NHO, marginTop: 'var(--k3)' }}>
          {dongBaoThieuNoiDung}
        </div>
      )}
      {kq && kq.phanCong.length > 0 && (
        <button
          type="button"
          onClick={() => void moMayChieu()}
          disabled={dangMoMayChieu}
          className="tap-target w-full font-bold flex items-center justify-center gap-2 select-none active:scale-[0.98] hover:-translate-y-0.5 transition-[transform,background-color,box-shadow,opacity] duration-150"
          style={{
            height: 52,
            marginTop: 'var(--k3)',
            borderRadius: 'var(--bo-tron)',
            background: 'var(--the)',
            color: 'var(--xanh)',
            border: '1px solid var(--vien)',
            fontFamily: 'var(--sans)',
            fontSize: 'var(--cx-2)',
          }}
        >
          <MonitorPlay size={18} /> {dangMoMayChieu ? 'Đang mở tờ chiếu...' : 'Chiếu lên bảng'}
          <span style={{ ...SO, opacity: 0.75, fontWeight: 600 }}>
            {Math.ceil(((kqBuoi && kqBuoi.dong.filter(d => d.tang === 'len_bang' && d.em).length > 0) ? kqBuoi.soEmLenBang : kq.phanCong.length) / 2)} đợt · 2 em mỗi đợt
          </span>
        </button>
      )}

      {kq && (
        <TheNoiDung>
          <div className="flex items-center justify-between flex-wrap" style={{ gap: 'var(--k2)' }}>
            <div style={TIEU_DE_MUC}>Phân công</div>
            <button
              type="button"
              onClick={() => void copyBang()}
              className="tap-target inline-flex items-center font-bold"
              style={{ gap: 6, minHeight: 40, padding: '0 var(--k4)', borderRadius: 'var(--bo-tron)', background: daCopy ? 'var(--xanh-nen)' : 'var(--the-2)', color: daCopy ? 'var(--xanh)' : 'var(--muc)', border: 'none', fontSize: 'var(--cx-1)' }}
            >
              {daCopy ? <Check size={16} /> : <ClipboardCopy size={16} />} {daCopy ? 'Đã copy' : 'Copy bảng'}
            </button>
          </div>
          <div style={{ ...NHAN_NHO, marginTop: 4 }} data-dong-tong>
            <span style={SO}>{kq.thongKe.length - kq.giangCaLop.length - kq.chiDocDapAn.length}</span> câu đáng chữa · <span style={SO}>{kq.giangCaLop.length}</span> giảng cả lớp ·{' '}
            <span style={SO}>{kq.chiDocDapAn.length}</span> đọc đáp án
          </div>

          {/* GIẢNG CẢ LỚP LÊN ĐẦU — chỗ đắt nhất của buổi: một lần giảng sửa cho
              nhiều em, còn gọi một em lên chữa thì cả lớp ngồi xem. */}
          {kq.giangCaLop.length > 0 && (
            <div style={{ marginTop: 'var(--k4)', padding: 'var(--k3)', borderRadius: 'var(--bo-2)', background: 'var(--cam-nen)' }} data-khoi="giang-ca-lop">
              <div className="flex items-center font-bold" style={{ gap: 6, color: 'var(--cam)', fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)' }}>
                <Megaphone size={16} /> GIẢNG CẢ LỚP — không gọi ai lên bảng
              </div>
              <div className="flex flex-col" style={{ gap: 'var(--k2)', marginTop: 'var(--k2)' }}>
                {kq.giangCaLop.map((t) => (
                  <div key={t.cau.id}>
                    <button
                      type="button"
                      onClick={() => setXemCau(xemCau === t.cau.id ? '' : t.cau.id)}
                      className="tap-target text-left w-full"
                      style={{ background: 'none', border: 'none', padding: 0, minHeight: 0, color: 'var(--muc)' }}
                    >
                      <span className="block font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-2)' }}>
                        {chuCau(t.cau)}
                      </span>
                      <span className="block" style={{ ...NHAN_NHO, ...SO }}>
                        {chuChum(t)}
                      </span>
                      {t.cau.tomTat && (
                        <span className="block" style={{ ...NHAN_NHO, color: 'var(--muc)' }}>
                          {t.cau.tomTat}
                        </span>
                      )}
                    </button>
                    {xemCau === t.cau.id && <div style={{ marginTop: 'var(--k2)' }}>{veCau(t.cau.id, t.cau.so)}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CÁC LƯỢT */}
          {theoLuot.map(([luot, ds]) => (
            <div key={luot} style={{ marginTop: 'var(--k4)' }} data-luot={luot}>
              <div className="font-bold" style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', letterSpacing: '.04em' }}>
                LƯỢT {luot}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 'var(--k3)', marginTop: 'var(--k2)' }}>
                {ds.map((p) => {
                  const ma = p.sbd + p.cau.id
                  return (
                    <div key={ma} className="flex flex-col" style={{ gap: 'var(--k2)' }}>
                      <Hang style={{ alignItems: 'flex-start' }}>
                        <button
                          type="button"
                          onClick={() => setXemCau(xemCau === ma ? '' : ma)}
                          className="flex-1 min-w-0 text-left tap-target"
                          style={{ background: 'none', border: 'none', padding: 0, minHeight: 0, color: 'var(--muc)' }}
                        >
                          <span className="block font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-2)' }}>
                            {chuCau(p.cau)} <span style={{ color: 'var(--nhat)' }}>→</span> {p.hoTen || `SBD ${p.sbd}`}
                          </span>
                          {/* VÌ SAO CHỌN EM NÀY + NHẮM MỨC NÀO — thầy đọc là biết
                              lý do, không phải tin một con số. */}
                          <span className="block" style={NHAN_NHO} data-vi-sao>
                            {p.viSao} · nhắm {TEN_MUC_NHAM[p.mucDoNham]}
                          </span>
                          {p.cau.tomTat && (
                            <span className="block" style={{ ...NHAN_NHO, color: 'var(--muc)' }}>
                              {p.cau.tomTat}
                            </span>
                          )}
                          {p.cau.lyDoSao && !!p.cau.sao && (
                            <span className="block" style={{ ...NHAN_NHO, color: 'var(--cam)' }}>
                              {p.cau.lyDoSao}
                            </span>
                          )}
                          <span className="flex items-center flex-wrap" style={{ gap: 4, marginTop: 4 }}>
                            {p.muc <= 2 && <Nhan tone="do">sai chính câu này</Nhan>}
                            {p.muc === 3 && <Nhan tone="cam">chưa làm câu này</Nhan>}
                            {p.cau.mucDo && <Nhan tone="xam">{TEN_MUC_NHAM[p.cau.mucDo]}</Nhan>}
                          </span>
                          <NhanLichSuCauEm nhan={nhanLichSuCua(p.sbd, p.cau.id)} />
                        </button>
                        <button
                          type="button"
                          onClick={() => boDong(p)}
                          aria-label={`Bỏ ${p.hoTen || p.sbd} khỏi bảng`}
                          className="tap-target flex items-center justify-center shrink-0"
                          style={{ width: 32, height: 32, borderRadius: 'var(--bo-tron)', background: 'transparent', border: 'none', color: 'var(--mo)' }}
                        >
                          <X size={16} />
                        </button>
                      </Hang>

                      <div className="flex items-center flex-wrap" style={{ gap: 'var(--k2)' }}>
                        <button
                          type="button"
                          onClick={() => void cham(p, true)}
                          disabled={dangCham === ma}
                          className="tap-target inline-flex items-center font-bold"
                          style={{ gap: 6, minHeight: 36, padding: '0 var(--k4)', borderRadius: 'var(--bo-tron)', background: 'var(--xanh-nen)', color: 'var(--xanh)', border: 'none', fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)' }}
                        >
                          <ThumbsUp size={15} /> Đạt
                        </button>
                        <button
                          type="button"
                          onClick={() => void cham(p, false)}
                          disabled={dangCham === ma}
                          className="tap-target inline-flex items-center font-bold"
                          style={{ gap: 6, minHeight: 36, padding: '0 var(--k4)', borderRadius: 'var(--bo-tron)', background: 'var(--do-nen)', color: 'var(--do)', border: 'none', fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)' }}
                        >
                          <ThumbsDown size={15} /> Không đạt
                        </button>
                        {dangCham === ma && <span style={NHAN_NHO}>Đang ghi…</span>}
                      </div>

                      {xemCau === ma && <div>{veCau(p.cau.id, p.cau.so)}</div>}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* CHỈ ĐỌC ĐÁP ÁN — cắt đầu tiên khi thiếu giờ, nên để cuối. */}
          {kq.chiDocDapAn.length > 0 && (
            <div style={{ marginTop: 'var(--k4)', padding: 'var(--k3)', borderRadius: 'var(--bo-2)', background: 'var(--the-2)' }} data-khoi="chi-doc-dap-an">
              <div className="flex items-center font-bold" style={{ gap: 6, fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)' }}>
                <BookOpenCheck size={16} /> CHỈ ĐỌC ĐÁP ÁN
              </div>
              <div className="flex flex-col" style={{ gap: 4, marginTop: 'var(--k2)' }}>
                {kq.chiDocDapAn.map((t) => (
                  <div key={t.cau.id} style={{ ...NHAN_NHO, color: 'var(--muc)' }}>
                    {chuCau(t.cau)} — <span style={SO}>{Math.round(t.tiLeDung * 100)}%</span> em làm đúng
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CHÂN BẢNG: ai chưa được gọi, con số nào chỉ tham khảo, còn câu thì
              gọi tiếp lượt sau. */}
          <div className="flex flex-col" style={{ gap: 'var(--k2)', marginTop: 'var(--k4)' }}>
            {kq.emChuaGoi.length > 0 && (
              <div style={NHAN_NHO} data-chua-goi>
                <span style={SO}>{kq.emChuaGoi.length}</span> em chưa được gọi lượt nào: {kq.emChuaGoi.join(', ')}
              </div>
            )}
            {kq.canhBao.map((c) => (
              <div key={c} style={{ ...NHAN_NHO, color: 'var(--cam)' }} data-canh-bao>
                ⚠ {c}
              </div>
            ))}
            {kq.chuaPhan.length > 0 && (
              <button
                type="button"
                onClick={() => chay(soLuot + 1)}
                className="tap-target self-start inline-flex items-center font-bold"
                style={{ gap: 6, minHeight: 44, padding: '0 var(--k5)', borderRadius: 'var(--bo-tron)', background: 'var(--muc)', color: 'var(--muc-nguoc)', border: 'none', fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)' }}
              >
                GỌI LƯỢT {soLuot + 1}
              </button>
            )}
          </div>
        </TheNoiDung>
      )}

      {/* TỜ MÁY CHIẾU — mở đúng trong khung xem chung với mọi phiếu khác. */}
      {htmlMayChieu && (
        <KhungXemPhieu html={htmlMayChieu} ten="Tờ máy chiếu — gọi lên bảng" dong={() => setHtmlMayChieu('')} />
      )}

      {/* XOÁ PHIÊN PHÂN CÔNG — chỉ dọn trên máy này, không đụng máy chủ (nói thật trong hộp). */}
      {hoiXoaPhien && (
        <HopXacNhan
          tieuDe={`Xoá phiên phân công lên bảng của ca ${du?.ten || du?.maCa || 'này'}?`}
          noiDung="Bảng phân công và tiến độ các đợt trên máy này sẽ mất. Kết quả Đạt / Chưa đạt đã ghi vào hồ sơ học sinh KHÔNG bị xoá."
          nhanXacNhan="Xoá phiên"
          nhanHuy="Giữ lại"
          nguyHiem
          onXacNhan={() => void xoaPhienPhanCong()}
          onHuy={() => setHoiXoaPhien(false)}
        />
      )}
    </div>
  )
}
