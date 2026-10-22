// TẤM "HỒ SƠ LÀM BÀI" CỦA MỘT EM — MỘT tấm cho cả ba app: thầy (Hành trình › Nhịp học / Bài hằng ngày / Điểm danh), học sinh (HoSoCuaEmHs), phụ huynh
// (ph-v3/HoSoCuaConPh). LỊCH SỬ: 09/10 khuya thầy: "bấm vào từng học sinh hiển thị rõ toàn bộ lịch sử, câu làm sai số giây làm mỗi câu" ⇒ "Lịch sử làm
// câu". 12/10 trùng tu: nhãn thái độ + lý do bằng số (`/gv/ho-so-thai-do`, luật + ngưỡng một chỗ ở server/src/bai-hang-ngay-kieu.ts), nhóm Nhịp học là nhãn
// chính (`nhomNhip`), cờ đối phó là chip riêng, Lười kèm "đủ mức liền x/6 ngày để thoát". 12/10F: cùng tấm mở trong app học sinh (`nguon` + `cheDo`).
//
// ĐỢT 16 (thầy 12/10: "Hồ sơ học sinh tối ưu lại giao diện cho thân thiện hơn nữa, đẹp và đầy đủ hơn nữa, hiện đại. Tối ưu cho cả dọc ngang máy tính.
// Đồng bộ cho cả app hs gv và ph" · "đo kĩ hơn nữa thái độ … chính xác hơn 90%" · "số giây hiển thị cho cả việc làm câu dễ khó, chỗ các câu học sinh
// chưa chữa được bấm vào phải nảy vào đúng chỗ tự sửa … cho vào box"):
//   · ĐẦU TẤM (điểm nhấn duy nhất): nhãn nhóm + biểu tượng, chip đối phó, chip "Độ tin cậy N%" (khi máy chủ gửi `doTinCay`; dưới 90% ⇒ kết luận ghi "tạm —
//     đang theo dõi" + câu `canThem`), mô tả, Lười: 6 ô thoát, lý do bằng số; bên phải (máy tính) / bên dưới (điện thoại): dải 14 ngày gần nhất.
//   · Sáu tín hiệu thành thẻ gọn: số đo lớn, thước 0–100% có VẠCH NGƯỠNG đúng `NGUONG_THAI_DO` (chú ý · vượt ngưỡng), câu số liệu, ngưỡng bằng chữ, độ tin cậy.
//   · SỐ GIÂY Ở MỌI LƯỢT (đúng, sai, bỏ trống — câu dễ lẫn câu khó): dòng lịch sử có cột số giây; thẻ câu sai ghi số giây TỪNG lần (cũ → mới); khối "Số
//     giây theo mức độ câu" (Nhận biết → Vận dụng cao). Không đo được ⇒ "—" + chú thích (không bao giờ bịa); ước tính ⇒ "≈".
//   · CÂU CHƯA SỬA ĐƯỢC: lưới hộp gọn (tên câu · mức · số lần sai · lần cuối · số giây). Chế độ học sinh + `onChuaCau` ⇒ mỗi hộp là MỘT nút mở Tự chữa
//     đúng câu ấy (`onChuaCau(qid)` — khoá câu của bản học sinh, cổng học sinh nối). Thầy / phụ huynh: hộp KHÔNG là đường vào Tự chữa.
//   · Khung: tấm phải trên máy tính, RỘNG tới 1200 px, lưới nhiều cột theo bề rộng CHÍNH TẤM (container query) — điện thoại dọc một cột, xoay ngang / máy
//     tính bảng hai cột, máy tính 12 cột; xoay ngang thấp (≤ 500 px cao) ⇒ toàn màn + đầu tấm gọn. CSS: ho-so-lam-cau-em.css (chỉ biến --gvm-* sẵn có).
//   · cheDo 'phu-huynh': chữ của phụ huynh (ngôi "con"), ẩn mọi đường của thầy như chế độ học sinh.
// ĐỢT 18 (13/10 — thầy: "trong hồ sơ của học sinh những câu chưa sửa lỗi mà có trong tự sửa lỗi mới hiện sửa câu này, nếu chưa có thì chưa hiện. Làm
// nổi bật phần tự sửa lỗi lên và mời gọi thân thiện" · "Bỏ hết các gợi ý hướng dẫn để học sinh phụ huynh không bị phân tâm"):
//   · chế độ học sinh: hộp "Chưa sửa được" có nút "Sửa câu này" CHỈ KHI khoá mở `moChua` nằm trong `coTheChua` (câu đang ở Tự sửa lỗi và còn cần sửa —
//     HoSoCuaEmHs dựng từ danh sách Tự sửa lỗi). Vắng tập / tải lỗi ⇒ hộp thường, không nút, không chữ gợi ý. Nhóm chưa sửa mở đầu bằng MỘT dòng mời
//     có số câu ("N câu đang chờ em tự sửa").
//   · học sinh / phụ huynh: bỏ chữ hướng dẫn và chú thích cách tính (dòng "Mỗi lượt: …", ghi chú trung bình, "Vạch: …", "Cách tính độ tin cậy",
//     câu "Bấm một câu…"); chế độ thầy GIỮ NGUYÊN mọi chi tiết.
// Esc / Đóng / bấm nền che ⇒ đóng; Tab giữ trong tấm; đóng xong focus về đúng nút đã bấm (nơi mở lo). Lệnh nào lỗi ⇒ một câu nói thật + nút tải lại,
// phần còn lại vẫn đủ. Mảnh riêng nạp LƯỜI (ngoài precache, vite.config.ts). Biểu đồ bằng CSS, không thư viện.
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Activity, Check, ChevronRight, ExternalLink, Hourglass, PenLine, RotateCcw, ShieldCheck, TriangleAlert, X } from 'lucide-react'
import { gioPhutVN, ngayThuChu, ngayVN } from '../../lib/em-toan-canh'
import { lyDoDeHieu } from '../../lib/loi-de-hieu'
import { layLichSuLamCau, TRAN_GIOI_HAN, type CauEmSai, type KetQuaLichSuLamCau, type LanLamCau, type NguonGiay } from '../../lib/lich-su-lam-cau-api'
import {
  layHoSoThaiDo,
  NGAY_BAT_DAU_BAI_HANG_NGAY,
  NGUONG_THAI_DO,
  type CauTomTat,
  type KetLuanThaiDoApp,
  type KetQuaHoSoThaiDo,
  type KetQuaHoSoThaiDoApp,
  type MaTinHieu,
  type NgayHoatDong,
  type NhanThaiDo,
  type TinHieuThaiDoApp,
} from '../../lib/bai-hang-ngay-api'
import type { KetQuaLenh } from '../../lib/goi-lenh-thay'
import { useAppStore } from '../../store/appStore'
import { chuCaiTen, chuHomNay, coMucNhip, nhomNhipCuaEm, TEN_NHOM_NHIP, tenKhoi, tenTang, type DongNhip, type LoaiNhomNhip } from './nhip-hanh-trinh'
import { chuO, MO_TA_NHAN, MO_TA_NHOM, mucO, NHAN_THEO_NHOM, ngayNgan, TEN_MUC_O, TEN_MUC_TIN_HIEU, thuNgan } from './bai-hang-ngay-ui'
import { doiNgoiCon } from '../hoc-tap/BangNhipHoc'
import { chuCanThem, chuDoTinCay, NGUONG_TIN_CAY } from '../../lib/nhip-hoc-em'
import { LUAT_NHOM_NHIP } from '../../../server/src/nhip-hoc-kieu'
import { TEN_NHOM_NHIP as TEN_NHOM_NHIP_HOC } from '../../../server/src/nhip-hoc-luat'
import { NutBac } from '../bac-cham-chi/ChipBac'
import { chuanHoaMucLam, ChipChuaCoSoDo, ChipMuc, ChuGiaiThuoc } from './muc-lam-giao-dien'
import { chuaDoTreoHet, chuKhoang7, HinhCoTinh, HinhMatMang, KhoiCachLamEm6, KhoiSauMucThay, KhoiTheoNgay, locLuot, maHien, MucLuot6, ThanhSau, type LoaiLoc, type LocLuot } from './ho-so-6-muc'
import './bai-hang-ngay.css'
import './ho-so-lam-cau-em.css'

/** Em mở tấm: bắt buộc SBD · tên · khối; số Nhịp học (mức hôm nay, tầng…) có khi mở từ Nhịp học; `lop` khi mở từ Bài hằng ngày. */
export type EmHoSo = Pick<DongNhip, 'sbd' | 'ten' | 'khoi'> & Partial<Omit<DongNhip, 'sbd' | 'ten' | 'khoi'>> & { lop?: string }

export { chuDoTinCay, NGUONG_TIN_CAY }
/** Số lần hiện mỗi đợt ở "Toàn bộ lịch sử" (danh sách dài — chuẩn B16). */
export const MOI_DOT = 100

// TẢI TỨC THÌ (thầy 21/10: "hồ sơ làm bài của học sinh load quá chậm, bạn cho load tức thì đi"). Tấm trước đây xin MỘT lần 1000 lượt rồi mới vẽ (tổng + từng lượt + Mức làm: nửa MB JSON trên mạng điện thoại),
// cùng lúc xin thêm Thái độ làm bài — hai lệnh nặng chồng nhau trên D1 đơn luồng. Nay: (1) khung đầu CHỈ xin 150 lượt mới nhất (≥ một đợt hiển thị MOI_DOT) — tổng, câu sai, Mức làm vẫn tính trên MỌI lượt máy chủ đọc,
// nên vẽ ngay; (2) Thái độ làm bài hỏi SAU khung đầu; (3) lượt cũ hơn CHỈ nạp khi thầy bấm «Tải thêm lượt cũ hơn» (máy chủ đọc cả cửa sổ để tính tổng — tự nạp thêm là thêm một lần đọc nặng); (4) mở lại tấm của em vừa xem trong 5 phút ⇒ vẽ ngay bản
// trong bộ nhớ rồi nạp mới nền. Bản trong bộ nhớ chỉ sống tới khi đóng tab (không ghi đĩa: dữ liệu học sinh).
export const GIOI_HAN_KHUNG_DAU = 150
const HAN_DEM_TAM_MS = 5 * 60_000
const TOI_DA_DEM_TAM = 12
const demTam = new Map<string, { luc: number; kq?: KetQuaLichSuLamCau; td?: KetQuaHoSoThaiDo }>()
/** Xoá bản trong bộ nhớ (đổi tài khoản / thoát; test). */
export function xoaDemHoSoLamCau(): void {
  demTam.clear()
}
function layDemTam(khoa: string) {
  const c = demTam.get(khoa)
  return c && Date.now() - c.luc < HAN_DEM_TAM_MS ? c : null
}
function ghiDemTam(khoa: string, ghi: { kq?: KetQuaLichSuLamCau; td?: KetQuaHoSoThaiDo }) {
  const cu = demTam.get(khoa)
  demTam.delete(khoa)
  demTam.set(khoa, { luc: Date.now(), ...(cu && Date.now() - cu.luc < HAN_DEM_TAM_MS ? cu : {}), ...ghi })
  if (demTam.size > TOI_DA_DEM_TAM) demTam.delete(demTam.keys().next().value as string)
}
/** Số lần gần nhất ghi số giây trong một hộp câu (phần còn lại: một chip "+ N lần khác"). */
export const SO_LAN_GIAY_HOP = 8

/** Nguồn dữ liệu của tấm (12/10F). Vắng ⇒ hai lệnh thầy theo `em.sbd`. App học sinh / phụ huynh truyền hai lệnh của mình. Nơi truyền giữ
 *  MỘT đối tượng cho mỗi em (useMemo) — đổi đối tượng là tấm nạp lại. */
export interface NguonHoSo {
  hoSoThaiDo(): Promise<KetQuaLenh<KetQuaHoSoThaiDo>>
  lichSu(gioiHan?: number): Promise<KetQuaLenh<KetQuaLichSuLamCau>>
}
/** Ai đang xem: 'thay' (mặc định — app thầy) · 'hoc-sinh' (em xem hồ sơ của chính mình) · 'phu-huynh' (phụ huynh xem hồ sơ của con). */
export type CheDoHoSo = 'thay' | 'hoc-sinh' | 'phu-huynh'
type Ngoi = 'em' | 'con'

/** Chữ khác nhau theo người xem. `ngoi`: thầy và em đọc "em", phụ huynh đọc "con". */
const CHU_CHE_DO: Record<CheDoHoSo, { matDau: string; dangTai: string; loi: string; nutTai: string; ngoi: Ngoi }> = {
  thay: { matDau: 'Thái độ làm bài', dangTai: 'Đang tải hồ sơ thái độ làm bài', loi: 'Chưa tải được hồ sơ thái độ làm bài của em.', nutTai: 'Tải lại hồ sơ thái độ', ngoi: 'em' },
  'hoc-sinh': { matDau: 'Nhịp học của em', dangTai: 'Đang tải nhịp học của em', loi: 'Chưa tải được nhịp học của em.', nutTai: 'Tải lại nhịp học', ngoi: 'em' },
  'phu-huynh': { matDau: 'Nhịp học của con', dangTai: 'Đang tải nhịp học của con', loi: 'Chưa tải được nhịp học của con.', nutTai: 'Tải lại nhịp học', ngoi: 'con' },
}
const hoa = (ngoi: Ngoi): string => (ngoi === 'con' ? 'Con' : 'Em')
const theoNgoi = (chu: string, ngoi: Ngoi): string => (ngoi === 'con' ? doiNgoiCon(chu) : chu)

// ------------------------------------------------------------------ PHÉP THUẦN (test gọi thẳng)

/** Mức độ câu theo chữ chương trình (bảng từ chuẩn A2: Nhận biết · Thông hiểu · Vận dụng). Không rõ ⇒ ''. */
export function tenMucDo(m: string): string {
  const k = m.trim().toLowerCase()
  if (k === 'biet' || k === 'nb') return 'Nhận biết'
  if (k === 'hieu' || k === 'th') return 'Thông hiểu'
  if (k === 'vd' || k === 'van_dung') return 'Vận dụng'
  if (k === 'vdc' || k === 'van_dung_cao') return 'Vận dụng cao'
  return ''
}

/** "45 giây" · "1 phút 5 giây" · "2 phút". */
export function doiGiay(giay: number): string {
  const s = Math.max(1, Math.round(giay))
  if (s < 60) return `${s} giây`
  const p = Math.floor(s / 60)
  const du = s % 60
  return du ? `${p} phút ${du} giây` : `${p} phút`
}

/** Chữ số giây một lần làm: đo thật ⇒ "45 giây"; ƯỚC TÍNH ⇒ "≈ 45 giây"; không đo được ⇒ "chưa đo giờ". `nguon` 'khong-ro' = có số nhưng không
 *  biết nguồn (câu sai không khớp được với lần nào trong danh sách) ⇒ ghi số trơn. */
export function chuGiay(giay: number | null, nguon: NguonGiay | 'khong-ro'): string {
  if (giay === null || nguon === null) return 'chưa đo giờ'
  return nguon === 'uoc' ? `≈ ${doiGiay(giay)}` : doiGiay(giay)
}

export const tieuDeCau = (c: Pick<LanLamCau, 'tieuDe' | 'qid'>): string => c.tieuDe.trim() || `Câu ${c.qid}`
export const chuKetQua = (dung: boolean | null): string => (dung === true ? 'Đúng' : dung === false ? 'Sai' : 'Bỏ trống')

/** Gom các lần theo ngày lịch Việt Nam, GIỮ thứ tự máy chủ (mới trước). */
export function gomTheoNgay(lan: readonly LanLamCau[]): { ngay: string; lan: LanLamCau[] }[] {
  const ra: { ngay: string; lan: LanLamCau[] }[] = []
  for (const l of lan) {
    const ngay = l.ngay || ngayVN(l.luc)
    const cuoi = ra[ra.length - 1]
    if (cuoi && cuoi.ngay === ngay) cuoi.lan.push(l)
    else ra.push({ ngay, lan: [l] })
  }
  return ra
}

/** Số giây các lần SAI của một câu kèm nguồn đo: lấy từ các lần sai của câu ấy trong `lan` (cũ → mới) khi khớp đúng số lần với `giaySai`;
 *  không khớp (lần cũ nằm ngoài `lan` được trả) ⇒ số trơn từ `giaySai`, nguồn 'khong-ro' (không ghi "≈" khi không chắc). */
export function giayCacLanSai(c: Pick<CauEmSai, 'qid' | 'giaySai'>, lan: readonly LanLamCau[]): { giay: number | null; nguon: NguonGiay | 'khong-ro' }[] {
  const sai = lan.filter((l) => l.qid === c.qid && l.dung === false).sort((a, b) => a.luc.localeCompare(b.luc))
  if (sai.length === c.giaySai.length)
    return sai.map((l, i) => {
      const giay = c.giaySai[i] ?? l.giay
      return { giay, nguon: giay === null ? null : (l.nguonGiay ?? 'khong-ro') }
    })
  return c.giaySai.map((g) => ({ giay: g, nguon: g === null ? null : 'khong-ro' }))
}

/** Một lần làm của một câu, kèm số giây (đợt 16 — MỌI lần: đúng, sai, bỏ trống). */
export interface LanGiay {
  dung: boolean | null
  giay: number | null
  nguon: NguonGiay | 'khong-ro'
}
/**
 * Số giây TỪNG LẦN của một câu (cũ → mới): mọi lần của câu trong `lan` (đúng, sai, bỏ trống — số giây máy chủ đo, ước tính ghi "≈"). Lần sai CŨ HƠN
 * nằm ngoài `lan` (sổ chỉ trả các lượt gần nhất) ⇒ lấy từ `giaySai` của máy chủ, đứng trước, nguồn 'khong-ro'. `truoc` = số lần còn lại của câu
 * (theo `soLan`) không có trong hai nguồn ấy — hộp ghi "+ N lần khác", KHÔNG bịa số giây cho chúng. Thuần.
 */
export function giayCacLan(c: Pick<CauEmSai, 'qid' | 'giaySai' | 'soLan'>, lan: readonly LanLamCau[]): { ds: LanGiay[]; truoc: number } {
  const cua = lan.filter((l) => l.qid === c.qid).sort((a, b) => a.luc.localeCompare(b.luc))
  const saiTrong = cua.filter((l) => l.dung === false).length
  const cu: LanGiay[] = saiTrong < c.giaySai.length ? c.giaySai.slice(0, c.giaySai.length - saiTrong).map((g): LanGiay => ({ dung: false, giay: g, nguon: g === null ? null : 'khong-ro' })) : []
  const ds: LanGiay[] = [...cu, ...cua.map((l): LanGiay => ({ dung: l.dung, giay: l.giay, nguon: l.giay === null ? null : (l.nguonGiay ?? 'khong-ro') }))]
  return { ds, truoc: Math.max(0, c.soLan - ds.length) }
}

/** Một hàng "Số giây theo mức độ câu" (Nhận biết → Vận dụng cao, rồi "Chưa ghi mức độ"). */
export interface DongGiayMuc {
  ten: string
  soLuot: number
  soCoGiay: number
  giayTb: number | null
  soDung: number
  soSai: number
  coUoc: boolean
}
const THU_TU_MUC = ['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao', 'Chưa ghi mức độ']
/** Gom các lượt theo mức độ câu: trung bình số giây (chỉ lượt có số giây — đo thật hoặc ước tính), số lượt, đúng/sai. Mức không có lượt ⇒ bỏ. Thuần. */
export function giayTheoMucDo(lan: readonly LanLamCau[]): DongGiayMuc[] {
  const m = new Map<string, DongGiayMuc & { tong: number }>()
  for (const l of lan) {
    const ten = tenMucDo(l.mucDo) || 'Chưa ghi mức độ'
    const d = m.get(ten) ?? { ten, soLuot: 0, soCoGiay: 0, giayTb: null, soDung: 0, soSai: 0, coUoc: false, tong: 0 }
    d.soLuot++
    if (l.dung === true) d.soDung++
    else if (l.dung === false) d.soSai++
    if (l.giay !== null) {
      d.soCoGiay++
      d.tong += l.giay
      if (l.nguonGiay === 'uoc') d.coUoc = true
    }
    m.set(ten, d)
  }
  return THU_TU_MUC.filter((t) => m.has(t)).map((t) => {
    const { tong, ...d } = m.get(t)!
    return { ...d, giayTb: d.soCoGiay > 0 ? Math.round(tong / d.soCoGiay) : null }
  })
}


const ngayGio = (iso: string) => {
  const ngay = ngayThuChu(ngayVN(iso))
  const gio = gioPhutVN(iso)
  return gio && ngay ? `${gio} · ${ngay}` : ''
}

// ------------------------------------------------------------------ GIAO DIỆN

// `summary`: ngăn gập (6 mức) phải vào được vòng Tab — bản học sinh / phụ huynh không có nút chân tấm sau các ngăn.
const CHON_FOCUS = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, summary, [tabindex]:not([tabindex="-1"])'
const GIAI_THICH_CHUA_DO = 'Lượt này chưa đo được số giây (lượt cũ, hoặc máy chưa ghi giờ) — không ước đoán.'
const GIAI_THICH_UOC = 'Số giây ước tính: tính từ lúc trả lời câu liền trước (lượt cũ chưa đo giờ).'

/** Số giây một lần: "45 giây" · "≈ 45 giây" · "—" (chưa đo được, có chú thích) — KHÔNG bao giờ bịa. */
function GiayO({ giay, nguon }: { giay: number | null; nguon: NguonGiay | 'khong-ro' }) {
  if (giay === null || nguon === null)
    return (
      <span className="hslc-giay" data-chua="" title={GIAI_THICH_CHUA_DO}>
        —<span className="gvv2-an-chu"> chưa đo số giây</span>
      </span>
    )
  return (
    <span className="hslc-giay gvv2-so" data-uoc={nguon === 'uoc' ? '' : undefined} title={nguon === 'uoc' ? GIAI_THICH_UOC : undefined}>
      {chuGiay(giay, nguon)}
    </span>
  )
}

/** Khung xương giữ chiều cao (đặc tả mục 3): khối mức 120 · thanh 32 · ô mức 180 · danh sách. Tắt nhấp nháy khi giảm chuyển động (CSS). */
function XuongTam() {
  return (
    <div className="hsv-xuong" role="status" aria-label="Đang tải hồ sơ làm bài">
      {[120, 32, 180, 220].map((h, i) => (
        <i key={i} style={{ height: h }} />
      ))}
      <p className="hsv-ghi">Đang tải hồ sơ làm bài…</p>
    </div>
  )
}

function OSo({ nhan, so, phu }: { nhan: string; so: string; phu: string }) {
  return (
    <div className="gvv2-hs-o">
      <dt>{nhan}</dt>
      <dd>
        <b className="gvv2-so">{so}</b>
        <small className="gvv2-so">{phu}</small>
      </dd>
    </div>
  )
}

/** Số giây từng lần của một câu (cũ → mới), tối đa `SO_LAN_GIAY_HOP` lần gần nhất. */
function GiayTungLan({ ds, truoc }: { ds: readonly LanGiay[]; truoc: number }) {
  if (ds.length === 0 && truoc === 0) return null
  const bot = Math.max(0, ds.length - SO_LAN_GIAY_HOP)
  const hien = ds.slice(bot)
  const cuHon = bot + truoc
  return (
    <span className="gvv2-hs-cau-giay hslc-giay-hang">
      <span className="hslc-giay-nhan">Số giây từng lần (cũ → mới):</span>
      {cuHon > 0 && (
        <span className="hslc-giay-lan" data-kq="cu" title="Các lần này không ghi số giây ở hộp — xem thẻ Toàn bộ lịch sử.">
          + {cuHon} lần khác
        </span>
      )}
      {hien.map((l, i) => (
        <span key={i} className="hslc-giay-lan" data-kq={l.dung === true ? 'dung' : l.dung === false ? 'sai' : 'trong'}>
          {chuKetQua(l.dung)} <GiayO giay={l.giay} nguon={l.nguon} />
        </span>
      ))}
    </span>
  )
}

/** Chữ nút trên hộp câu chưa sửa (chế độ học sinh, câu đang ở Tự sửa lỗi). */
export const CHU_SUA_CAU = 'Sửa câu này'

/** Hộp chưa sửa có nút "Sửa câu này" không: chỉ khi có đường mở và khoá mở của câu nằm trong tập câu còn cần sửa của Tự sửa lỗi. */
export function coNutSua(c: Pick<CauEmSai, 'moChua'>, coTheChua: ReadonlySet<string> | undefined): boolean {
  return !!c.moChua && !!coTheChua?.has(c.moChua)
}

/** Một hộp câu từng sai. Có `onChua` (chỉ chế độ học sinh, câu đang ở Tự sửa lỗi) ⇒ cả hộp là MỘT nút mở đúng câu ấy. */
function OCauSai({ c, lan, onChua, cheDo }: { c: CauEmSai; lan: readonly LanLamCau[]; onChua?: (qid: string) => void; cheDo: CheDoHoSo }) {
  const { ds, truoc } = giayCacLan(c, lan)
  // Mức làm của lượt GẦN NHẤT của câu (máy chủ trả mới trước); chưa có số đo ⇒ không chip (không đoán).
  const mucGanNhat = lan.find((l) => l.luc === c.lanCuoi)?.mucLam
  const muc = tenMucDo(c.mucDo)
  const lanCuoi = ngayGio(c.lanCuoi)
  const sua = c.lanCuoiDung
  const than = (
    <>
      <span className="gvv2-hs-cau-dau">
        <b className="hslc-o-ten">{tieuDeCau(c)}</b>
        <span className="gvv2-hs-nhan" data-sua={sua ? 'true' : 'false'}>
          {sua ? <Check size={14} aria-hidden="true" /> : <RotateCcw size={14} aria-hidden="true" />}
          {sua ? 'Đã sửa được' : 'Chưa sửa được'}
        </span>
      </span>
      <span className="gvv2-hs-cau-phu gvv2-so">
        {muc ? `${muc} · ` : ''}sai {c.soSai} lần · đúng {c.soDung} lần{lanCuoi ? ` · lần cuối ${lanCuoi}` : ''}
      </span>
      <GiayTungLan ds={ds} truoc={truoc} />
      {mucGanNhat && (
        <span className="hslc-o-muc">
          <span className="hslc-giay-nhan">Lần gần nhất:</span>{' '}
          <ChipMuc ma={mucGanNhat.ma} cheDo={cheDo} dai uoc={!!mucGanNhat.uocTinh} />
        </span>
      )}
      {onChua && (
        <span className="hslc-o-mo" aria-hidden="true">
          {CHU_SUA_CAU}
          <ChevronRight size={18} />
        </span>
      )}
    </>
  )
  return (
    <li className="gvv2-hs-cau hslc-o" data-sua={sua ? 'true' : 'false'}>
      {onChua ? (
        <button type="button" className="hslc-o-nut tt-nhan" onClick={() => onChua(c.moChua ?? c.qid)} aria-label={`${CHU_SUA_CAU}: ${tieuDeCau(c)}`}>
          {than}
        </button>
      ) : (
        <div className="hslc-o-than">{than}</div>
      )}
    </li>
  )
}

/** Thẻ "Câu sai": hai nhóm hộp — CHƯA SỬA ĐƯỢC (đứng trước, nổi) · ĐÃ SỬA ĐƯỢC. Lưới hộp tự giãn theo bề rộng tấm. */
function DsCauSai({
  cauSai,
  lan,
  onChuaCau,
  coTheChua,
  soCauCanSua,
  ngoi,
  cheDo,
}: {
  cauSai: readonly CauEmSai[]
  lan: readonly LanLamCau[]
  onChuaCau?: (qid: string) => void
  coTheChua?: ReadonlySet<string>
  soCauCanSua?: number
  ngoi: Ngoi
  cheDo: CheDoHoSo
}) {
  const id = useId()
  if (cauSai.length === 0) return <p className="gvv2-trong">{hoa(ngoi)} chưa sai câu nào trong các lượt đã ghi.</p>
  const chua = cauSai.filter((c) => !c.lanCuoiDung)
  const da = cauSai.filter((c) => c.lanCuoiDung)
  const soSua = onChuaCau ? soCauCanSua ?? chua.filter((c) => coNutSua(c, coTheChua)).length : 0
  return (
    <div className="hslc-cs">
      <section className="hslc-cs-nhom" data-loai="chua" aria-labelledby={`${id}-chua`}>
        <h4 id={`${id}-chua`} className="hslc-cs-tieu">
          <RotateCcw size={18} aria-hidden="true" />
          Chưa sửa được <span className="gvv2-so">· {chua.length} câu</span>
        </h4>
        {soSua > 0 && (
          <p className="hslc-cs-moi gvv2-so">
            <PenLine size={18} aria-hidden="true" />
            <span>
              <b>{soSua} câu</b> đang chờ em tự sửa
            </span>
          </p>
        )}
        {chua.length === 0 ? (
          <p className="gvv2-trong">Câu nào từng sai, lần làm gần nhất cũng đã đúng.</p>
        ) : (
          <ul className="gvv2-hs-cau-ds hslc-o-luoi">
            {chua.map((c) => (
              <OCauSai key={c.qid} c={c} lan={lan} cheDo={cheDo} onChua={onChuaCau && coNutSua(c, coTheChua) ? onChuaCau : undefined} />
            ))}
          </ul>
        )}
      </section>
      {da.length > 0 && (
        <section className="hslc-cs-nhom" data-loai="da" aria-labelledby={`${id}-da`}>
          <h4 id={`${id}-da`} className="hslc-cs-tieu">
            <Check size={18} aria-hidden="true" />
            Đã sửa được <span className="gvv2-so">· {da.length} câu</span>
          </h4>
          <ul className="gvv2-hs-cau-ds hslc-o-luoi">
            {da.map((c) => (
              <OCauSai key={c.qid} c={c} lan={lan} cheDo={cheDo} />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

/** Một dòng lượt (giờ · câu · nơi làm · kết quả · Mức làm). Lượt treo: chip Mức 5/6 + số phút thay cho số giây / thước giây. */
function DongLuot({ l, laThay, cheDo, coMuc, soCungNgay }: { l: LanLamCau; laThay: boolean; cheDo: CheDoHoSo; coMuc: boolean; soCungNgay?: number }) {
  const muc = tenMucDo(l.mucDo)
  const phu = [l.noi, muc, l.chon ? `Chọn ${l.chon}` : '', l.coGoiY ? 'có dùng gợi ý' : ''].filter(Boolean).join(' · ')
  const k = l.dung === true ? 'dung' : l.dung === false ? 'sai' : 'trong'
  const m = l.mucLam
  return (
    <li className="gvv2-hs-lan hslc-lan" data-kq={k} data-m={m && !m.treo ? m.ma : undefined} data-t={m?.treo ? maHien(m, laThay) : undefined} data-treo={m?.treo ? '' : undefined}>
      <time className="gvv2-so" dateTime={l.luc}>
        {gioPhutVN(l.luc)}
      </time>
      <span className="gvv2-hs-lan-chu">
        <b>{tieuDeCau(l)}</b>
        <small className="gvv2-so">{phu}</small>
      </span>
      <span className="hslc-lan-phai">
        <span className="gvv2-hs-kq" data-kq={k}>
          {chuKetQua(l.dung)}
        </span>
        {!m && (
          <>
            <GiayO giay={l.giay} nguon={l.nguonGiay} />
            {laThay && coMuc && <ChipChuaCoSoDo />}
          </>
        )}
      </span>
      {m && <MucLuot6 m={m} cheDo={cheDo} soCungNgay={soCungNgay} />}
    </li>
  )
}

const CHU_LOC: Record<LoaiLoc, { nut: string; trong: string; dem: string }> = {
  'tat-ca': { nut: 'Tất cả', trong: 'Chưa có lượt nào.', dem: 'lượt' },
  sai: { nut: 'Lượt sai', trong: 'chưa có lượt sai nào trong các lượt đã tải.', dem: 'lượt sai' },
  treo: { nut: 'Treo máy', trong: 'Không có lượt treo máy nào trong các lượt đã tải.', dem: 'lượt treo máy' },
  'chua-so-do': { nut: 'Chưa có số đo', trong: 'Lượt nào đã tải cũng có số đo Mức làm.', dem: 'lượt chưa có số đo' },
}

/** «Từng lượt»: nút lọc 44 px (role=tab) Tất cả · Lượt sai · Treo máy (học sinh: Máy để treo) · Chưa có số đo (chỉ thầy), lượt gom theo ngày, đợt 100. */
function LichSu({
  kq,
  onTaiThem,
  dangTai,
  ngoi,
  laThay,
  cheDo,
  loc,
  datLoc,
  coDoTreo,
}: {
  kq: KetQuaLichSuLamCau
  onTaiThem: () => void
  dangTai: boolean
  ngoi: Ngoi
  laThay: boolean
  cheDo: CheDoHoSo
  loc: LocLuot
  datLoc: (l: LocLuot) => void
  coDoTreo: boolean
}) {
  const [soHien, setSoHien] = useState(MOI_DOT)
  const ds = useMemo(() => locLuot(kq.lan, loc), [kq.lan, loc])
  const ngay = useMemo(() => gomTheoNgay(ds.slice(0, soHien)), [ds, soHien])
  const soCungNgay = useMemo(() => new Map((kq.mucLam6?.ngayCoTinh ?? []).map((n) => [n.ngay, n.so])), [kq.mucLam6])
  const con = ds.length - Math.min(soHien, ds.length)
  const coMuc = !!kq.mucLam || !!kq.mucLam6
  const nut: LoaiLoc[] = ['tat-ca', 'sai', ...(coDoTreo ? (['treo'] as const) : []), ...(laThay && coMuc ? (['chua-so-do'] as const) : [])]
  const chu = (x: LoaiLoc) => (x === 'treo' && !laThay ? 'Máy để treo' : CHU_LOC[x].nut)
  const dem = (x: LoaiLoc) => (x === loc.loai && loc.ngay ? ds.length : locLuot(kq.lan, { loai: x }).length)
  return (
    <div className="gvv2-hs-ls">
      <div className="hsv-loc" role="tablist" aria-label="Lọc lượt">
        {nut.map((x) => (
          <button
            key={x}
            type="button"
            role="tab"
            aria-selected={loc.loai === x}
            className="tt-nhan"
            onClick={() => {
              datLoc({ loai: x })
              setSoHien(MOI_DOT)
            }}
          >
            {chu(x)}
            <span className="gvv2-so"> · {dem(x)}</span>
          </button>
        ))}
      </div>
      <p className="gvv2-so hsv-ghi" aria-live="polite">
        Đang hiện <b>{Math.min(soHien, ds.length)}</b>/{ds.length} {loc.loai === 'treo' && !laThay ? 'lượt máy để treo' : CHU_LOC[loc.loai].dem}
        {loc.ngay ? ` ngày ${ngayNgan(loc.ngay)}` : ''}
        {kq.conNua ? ` · trong ${kq.lan.length} lượt gần nhất` : ''}
      </p>
      {laThay && <p className="hslc-ls-ghi">Mỗi lượt: giờ · câu · nơi làm · mức độ · kết quả · số giây (≈ là ước tính, — là chưa đo được).</p>}
      {laThay && coMuc && <ChuGiaiThuoc />} {/* máy chủ chưa có Mức làm (không có `mucLam`) ⇒ không vẽ chú giải / nhãn "Chưa có số đo" */}
      {ds.length === 0 ? (
        <p className="gvv2-trong">{loc.loai === 'sai' ? `${hoa(ngoi)} ${CHU_LOC.sai.trong}` : loc.loai === 'treo' && !laThay ? 'Không có lượt máy để treo nào trong các lượt đã tải.' : CHU_LOC[loc.loai].trong}</p>
      ) : (
        ngay.map((n) => (
          <section key={n.ngay} className="gvv2-hs-ngay" aria-label={ngayThuChu(n.ngay) || n.ngay}>
            <h4 className="gvv2-hs-ngay-tieu">
              {ngayThuChu(n.ngay) || n.ngay}
              <span className="gvv2-so"> · {n.lan.length} lượt</span>
            </h4>
            <ol className="gvv2-hs-lan-ds">
              {n.lan.map((l, i) => (
                <DongLuot key={`${l.luc}-${l.qid}-${i}`} l={l} laThay={laThay} cheDo={cheDo} coMuc={coMuc} soCungNgay={soCungNgay.get(l.ngay)} />
              ))}
            </ol>
          </section>
        ))
      )}
      {con > 0 && (
        <button type="button" className="gvv2-nut-vien tt-nhan gvv2-hs-them" onClick={() => setSoHien((s) => s + MOI_DOT)}>
          Xem thêm {Math.min(MOI_DOT, con)} {CHU_LOC[loc.loai].dem} (còn {con})
        </button>
      )}
      {con === 0 && kq.conNua && kq.lan.length < TRAN_GIOI_HAN && (
        <button type="button" className="gvv2-nut-vien tt-nhan gvv2-hs-them" onClick={onTaiThem} disabled={dangTai} aria-busy={dangTai}>
          {dangTai ? 'Đang tải…' : 'Tải thêm lượt cũ hơn'}
        </button>
      )}
      {con === 0 && kq.conNua && kq.lan.length >= TRAN_GIOI_HAN && <p className="gvv2-hs-ghi">Máy chủ gửi tối đa {TRAN_GIOI_HAN} lượt gần nhất; lượt cũ hơn không hiện ở đây.</p>}
    </div>
  )
}

/** Phụ huynh: «Lượt sai gần đây» — 3 lượt sai mới nhất (lượt treo mang chip "Mức làm 5 · Máy để treo", không số phút). */
function LuotSaiGanDay({ kq }: { kq: KetQuaLichSuLamCau }) {
  const ds = useMemo(() => kq.lan.filter((l) => l.dung === false).slice(0, 3), [kq.lan])
  const ngay = useMemo(() => gomTheoNgay(ds), [ds])
  if (ds.length === 0) return <p className="gvv2-trong">Con chưa có lượt sai nào trong các lượt đã tải.</p>
  return (
    <div className="gvv2-hs-ls">
      {ngay.map((n) => (
        <section key={n.ngay} className="gvv2-hs-ngay" aria-label={ngayThuChu(n.ngay) || n.ngay}>
          <h4 className="gvv2-hs-ngay-tieu">
            {ngayThuChu(n.ngay) || n.ngay}
            <span className="gvv2-so"> · {n.lan.length} lượt</span>
          </h4>
          <ol className="gvv2-hs-lan-ds">
            {n.lan.map((l, i) => (
              <DongLuot key={`${l.luc}-${l.qid}-${i}`} l={l} laThay={false} cheDo="phu-huynh" coMuc={!!kq.mucLam} />
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}

/** "Số giây theo mức độ câu" — câu dễ (Nhận biết) tới câu khó (Vận dụng cao): trung bình số giây, số lượt có số giây, đúng/sai. */
function GiayMucDo({ lan, laThay }: { lan: readonly LanLamCau[]; laThay: boolean }) {
  const id = useId()
  const ds = useMemo(() => giayTheoMucDo(lan), [lan])
  if (ds.length === 0) return null
  const lon = Math.max(1, ...ds.map((d) => d.giayTb ?? 0))
  const coUoc = ds.some((d) => d.coUoc)
  return (
    <section className="hslc-khoi-con" aria-labelledby={`${id}-t`}>
      <h4 id={`${id}-t`} className="hslc-tieu-nho">
        Số giây theo mức độ câu <small className="gvv2-so">· dễ → khó · {lan.length} lượt gần nhất đã tải</small>
      </h4>
      <ul className="hslc-muc">
        {ds.map((d) => {
          const coKq = d.soDung + d.soSai
          return (
            <li key={d.ten} className="hslc-muc-dong">
              <span className="hslc-muc-ten">{d.ten}</span>
              <span className="hslc-muc-thanh" aria-hidden="true">
                {d.giayTb !== null && <i style={{ width: `${Math.max(4, (100 * d.giayTb) / lon)}%` }} />}
              </span>
              <span className="hslc-muc-so gvv2-so">
                <b>{d.giayTb !== null ? doiGiay(d.giayTb) : '—'}</b>
                <small>
                  {d.giayTb !== null ? 'trung bình mỗi lượt' : 'chưa đo được số giây'} · {d.soCoGiay}/{d.soLuot} lượt có số giây
                  {coKq > 0 ? ` · đúng ${d.soDung}/${coKq}` : ''}
                </small>
              </span>
            </li>
          )
        })}
      </ul>
      {laThay && <p className="hslc-ghi">Trung bình tính trên lượt có số giây{coUoc ? ', gồm số giây ước tính (≈) ở lượt cũ' : ''}; lượt chưa đo được không tính.</p>}
    </section>
  )
}

// ------------------------------------------------------------------ HỒ SƠ THÁI ĐỘ (từ mốc 01/10)

const phan = (tu: number, mau: number): number | null => (mau > 0 ? Math.round((100 * tu) / mau) : null)
/** Khoảng xem: "01/10 – 12/10" (một ngày ⇒ "12/10"). */
export const chuKhoang = (tu: string, den: string): string => (tu === den ? ngayNgan(tu) : `${ngayNgan(tu)} – ${ngayNgan(den)}`)
/** Khoảng xem trong câu: "từ 01/10 đến 12/10" (một ngày ⇒ "ngày 12/10"). */
export const chuTuDen = (tu: string, den: string): string => (tu === den ? `ngày ${ngayNgan(tu)}` : `từ ${ngayNgan(tu)} đến ${ngayNgan(den)}`)

function XuongThaiDo({ chu }: { chu: string }) {
  return (
    <div className="gvv2-tdo-xuong" role="status" aria-label={chu}>
      <span className="gvv2-cc-xuong-khoi tt-xuong" style={{ width: '100%', height: 132, borderRadius: 20 }} />
      <span className="gvv2-cc-xuong-khoi tt-xuong" style={{ width: '100%', height: 84, borderRadius: 16 }} />
    </div>
  )
}

const ICON_NHAN: Record<NhanThaiDo, typeof Check> = { 'cham-chi': Check, 'chua-deu': Activity, luoi: TriangleAlert, 'doi-pho': TriangleAlert, 'chua-du-du-lieu': Hourglass }

/** Chip độ tin cậy (chỉ khi máy chủ gửi). Dưới `NGUONG_TIN_CAY` ⇒ tông hổ phách + "đang theo dõi". */
function ChipTinCay({ n, nho = false }: { n: number; nho?: boolean }) {
  const du = n >= NGUONG_TIN_CAY
  return (
    <span className={`hslc-tin${nho ? ' hslc-tin--nho' : ''}`} data-du={du ? 'true' : 'false'} title={`Kết luận chắc khi độ tin cậy từ ${NGUONG_TIN_CAY}%.`}>
      {du ? <ShieldCheck size={nho ? 14 : 16} aria-hidden="true" /> : <Hourglass size={nho ? 14 : 16} aria-hidden="true" />}
      {chuDoTinCay(n)}
      {!du && ' · đang theo dõi'}
    </span>
  )
}

/** Dải 14 ngày gần nhất (Lười / Chăm trong nháy mắt): ô tô theo bốn mức của bảng Bài hằng ngày; hôm nay chưa đủ ⇒ ô viền "đang làm". */
function DaiMuoiBon({ ngay, chuoi }: { ngay: readonly NgayHoatDong[]; chuoi?: number }) {
  const gan = ngay.slice(-14)
  if (gan.length === 0) return null
  const qua = gan.filter((n) => !n.homNay)
  const du = qua.filter((n) => n.datMuc).length
  const tom = `${gan.length} ngày gần nhất: đủ mức ${du}/${qua.length} ngày đã qua. ${gan.map((n) => chuO(n)).join('; ')}`
  return (
    <div className="hslc-dai">
      <p className="hslc-dai-tieu">
        <b>{gan.length} ngày gần nhất</b>
        <span className="gvv2-so"> · đủ mức {du}/{qua.length} ngày đã qua</span>
      </p>
      <ol className="hslc-dai-o" role="img" aria-label={tom} style={{ '--cot': gan.length } as CSSProperties}>
        {gan.map((n) => (
          <li key={n.ngay} data-muc={n.homNay && !n.datMuc ? 'cho' : mucO(n)} data-hom-nay={n.homNay ? 'true' : undefined} title={chuO(n)}>
            <i />
            <small className="gvv2-so">{n.homNay ? 'Nay' : n.ngay.slice(8, 10)}</small>
          </li>
        ))}
      </ol>
      <span className="hslc-dai-chu-thich" aria-hidden="true">
        {(['du', 'thieu-it', 'thieu-nhieu', 'khong-lam'] as const).map((m) => (
          <span key={m}>
            <i data-muc={m} />
            {TEN_MUC_O[m].replace(/ \(.*\)$/, '').replace('Không làm câu nào', 'Không làm')}
          </span>
        ))}
        <span>
          <i data-muc="cho" />
          Hôm nay
        </span>
      </span>
      {chuoi !== undefined && (
        <p className="hslc-dai-chuoi gvv2-so">
          Chuỗi đủ mức liền gần nhất: <b>{chuoi} ngày</b>
        </p>
      )}
    </div>
  )
}

/** Đầu tấm. Máy chủ có `nhomNhip` ⇒ NHÓM Nhịp học (Chăm / Chưa đều / Lười / Chưa đủ dữ liệu — cùng luật Hôm nay) là nhãn chính, cờ "Có dấu hiệu đối
 *  phó" là chip riêng, nhóm Lười kèm "đủ mức liền x/6 ngày để thoát" + 6 ô. Máy chủ cũ (thiếu trường) ⇒ nhãn thái độ cũ. Lý do bằng số giữ nguyên.
 *  Đợt 16: chip "Độ tin cậy N%" + kết luận tạm khi dưới 90%; dải 14 ngày gần nhất.
 *  13/10: máy chủ có `bacCham` (đã kiểm khớp nhóm) ⇒ chip "Bậc N/12 · Tên" ngay cạnh tên nhóm (cùng chip 3 app). Vắng ⇒ y như trước.
 *  13/10 đợt 19: chip là NÚT (NutBac, ChipBac.tsx) mở tấm đủ 12 bậc nằm TRÊN tấm hồ sơ (Esc đóng tấm bậc trước, hồ sơ vẫn mở). */
function DauThaiDo({ td, matDau, ngoi, laThay, laHocSinh }: { td: KetQuaHoSoThaiDo; matDau: string; ngoi: Ngoi; laThay: boolean; laHocSinh: boolean }) {
  const k = td.ketLuan as KetLuanThaiDoApp
  const nhom = td.nhomNhip
  const nhan: NhanThaiDo = nhom ? NHAN_THEO_NHOM[nhom] : k.nhan
  const Icon = ICON_NHAN[nhan]
  const canThoat = LUAT_NHOM_NHIP.ngayLienThoatLuoi
  const coThoat = Math.min(td.chuoiDuGanNhat ?? 0, canThoat)
  // Chip cạnh tên NHÓM ⇒ độ tin cậy của nhóm (cùng số bảng Nhịp học của thầy); không có nhóm ⇒ của nhãn thái độ như cũ.
  const tinNguon = nhom ? td.tinCayNhom : k
  const tin = tinNguon?.doTinCay
  const canThem = tinNguon?.canThem
  const tam = tin !== undefined && tin < NGUONG_TIN_CAY
  const cachTinh = (td as KetQuaHoSoThaiDoApp).cachTinhTinCay
  return (
    <section className="gvv2-tdo-dau hslc-hero" data-nhan={nhan} data-tam={tam ? 'true' : undefined} aria-labelledby="gvv2-tdo-nhan">
      <div className="hslc-hero-chinh">
        <small className="gvv2-tdo-mat gvv2-so">
          {matDau} · {chuKhoang(td.tu, td.den)}
        </small>
        <div className="gvv2-tdo-nhan-hang">
          <span className="hslc-hero-bt" aria-hidden="true">
            <Icon size={22} strokeWidth={2.6} />
          </span>
          <h3 id="gvv2-tdo-nhan" className="gvv2-tdo-nhan">
            {nhom ? TEN_NHOM_NHIP_HOC[nhom] : k.chu}
          </h3>
          {nhom && td.bacCham && <NutBac kq={td.bacCham} xung={ngoi} />}
          {nhom && td.coDoiPho && !laHocSinh && (
            <span className="gvv2-tdo-co-doi-pho">
              <TriangleAlert size={15} aria-hidden="true" />
              Có dấu hiệu đối phó
            </span>
          )}
          {tin !== undefined && <ChipTinCay n={tin} />}
        </div>
        {tam && (
          <p className="hslc-tam">
            <b>Kết luận tạm, đang theo dõi.</b> {canThem ? chuCanThem(theoNgoi(canThem, ngoi)) : `Độ tin cậy dưới ${NGUONG_TIN_CAY}%: cần thêm ngày làm bài để chắc.`}
          </p>
        )}
        <p className="gvv2-tdo-mo-ta">{theoNgoi(nhom ? MO_TA_NHOM[nhom] : MO_TA_NHAN[k.nhan], ngoi)}</p>
        {nhom === 'luoi' && (
          <div className="hslc-thoat">
            <p className="gvv2-tdo-thoat gvv2-so">
              Đủ mức liền {coThoat}/{canThoat} ngày để thoát
            </p>
            <span className="hslc-thoat-o" aria-hidden="true">
              {Array.from({ length: canThoat }, (_, i) => (
                <i key={i} data-xong={i < coThoat ? 'true' : undefined} />
              ))}
            </span>
          </div>
        )}
        {k.lyDo.length > 0 && (
          <ul className="gvv2-tdo-ly-do gvv2-so" aria-label="Lý do">
            {k.lyDo.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        )}
        {cachTinh && laThay && (
          <details className="hslc-cach">
            <summary className="tt-nhan">Cách tính độ tin cậy</summary>
            <p>{theoNgoi(cachTinh, ngoi)}</p>
          </details>
        )}
      </div>
      <DaiMuoiBon ngay={td.ngay} chuoi={td.chuoiDuGanNhat} />
    </section>
  )
}

function OSoTd({ nhan, so, phu }: { nhan: string; so: string; phu: string }) {
  return (
    <div className="gvv2-tdo-o">
      <dt>{nhan}</dt>
      <dd>
        <b className="gvv2-so">{so}</b>
        <small className="gvv2-so">{phu}</small>
      </dd>
    </div>
  )
}

function LichNgay({ ngay }: { ngay: readonly NgayHoatDong[] }) {
  return (
    <ol className="gvv2-tdo-lich" aria-label="Lịch làm bài theo ngày">
      {ngay.map((n) => (
        <li key={n.ngay} className="gvv2-tdo-ngay" data-muc={mucO(n)} data-hom-nay={n.homNay ? 'true' : undefined} title={chuO(n)}>
          <small className="gvv2-so" aria-hidden="true">
            {n.homNay ? 'Hôm nay' : thuNgan(n.ngay)} · {ngayNgan(n.ngay)}
          </small>
          <b className="gvv2-so" aria-hidden="true">
            {n.daLam}/{n.mucToiThieu}
          </b>
          <small className="gvv2-so" aria-hidden="true">
            {n.datMuc ? 'đủ mức' : `thiếu ${n.thieu}`}
          </small>
          {/* Thầy 12/10 ("hiển thị thật chính xác"): ô có mức ƯỚC TÍNH (ngày chưa chốt mức) ghi rõ ngay trên ô, không chỉ trong chú thích trỏ chuột. */}
          {n.mucUocTinh && (
            <small className="gvv2-so" aria-hidden="true">
              mức ước tính
            </small>
          )}
          <span className="gvv2-an-chu">{chuO(n)}</span>
        </li>
      ))}
    </ol>
  )
}

/** Nhiều ngày (từ 01/10) ⇒ dải cột cuộn ngang trong khung; mở sẵn ở NGÀY GẦN NHẤT (ngày cũ cuộn sang trái). */
function CotDoDung({ ngay }: { ngay: readonly NgayHoatDong[] }) {
  const khung = useRef<HTMLOListElement | null>(null)
  useLayoutEffect(() => {
    const k = khung.current
    if (k && k.scrollWidth > k.clientWidth + 1) k.scrollLeft = k.scrollWidth
  }, [ngay])
  return (
    <ol ref={khung} className="gvv2-tdo-cot" aria-label="Độ đúng theo ngày">
      {ngay.map((n) => {
        const coKq = n.soDung + n.soSai
        return (
          <li key={n.ngay} className="gvv2-tdo-cot-o">
            <span className="gvv2-tdo-cot-so gvv2-so" aria-hidden="true">
              {n.tiLeDung === null ? '—' : `${n.tiLeDung}%`}
            </span>
            <span className="gvv2-tdo-cot-khung" aria-hidden="true">
              <i style={{ height: `${n.tiLeDung ?? 0}%` }} />
            </span>
            <span className="gvv2-tdo-cot-ngay gvv2-so" aria-hidden="true">
              {ngayNgan(n.ngay)}
            </span>
            <small className="gvv2-so" aria-hidden="true">
              {coKq} lượt
            </small>
            <span className="gvv2-an-chu">
              {ngayNgan(n.ngay)}: {coKq ? `đúng ${n.soDung}/${coKq} lượt (${n.tiLeDung}%)` : 'chưa có lượt có kết quả'}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function PhanBoGiay({ td, laThay }: { td: KetQuaHoSoThaiDo; laThay: boolean }) {
  const lon = Math.max(1, ...td.phanBoGiay.map((g) => g.soLuot))
  if (td.dem.soLuotCoGiay === 0) return <p className="gvv2-hs-ghi">Chưa có lượt nào đo được số giây trong khoảng này.</p>
  return (
    <>
      <ul className="gvv2-tdo-giay">
        {td.phanBoGiay.map((g) => {
          const d = phan(g.soDung, g.soLuot)
          return (
            <li key={g.nhan} className="gvv2-tdo-giay-dong">
              <span className="gvv2-tdo-giay-nhan">{g.nhan}</span>
              <span className="gvv2-tdo-giay-thanh" aria-hidden="true">
                {g.soNhanh > 0 && <i data-nhanh="true" style={{ width: `${(100 * g.soNhanh) / lon}%` }} />}
                {g.soLuot - g.soNhanh > 0 && <i style={{ width: `${(100 * (g.soLuot - g.soNhanh)) / lon}%` }} />}
              </span>
              <span className="gvv2-tdo-giay-so gvv2-so">
                {g.soLuot} lượt{g.soNhanh > 0 ? ` · ${g.soNhanh} quá nhanh` : ''}
                {d !== null ? ` · đúng ${d}%` : ''}
              </span>
            </li>
          )
        })}
      </ul>
      <p className="gvv2-tdo-giay-ghi">
        <span className="gvv2-tdo-giay-mau" aria-hidden="true" />
        Phần thanh cùng màu ô này là lượt quá nhanh: dưới {NGUONG_THAI_DO.giayNhanhTracNghiem} giây với câu trắc nghiệm, dưới {NGUONG_THAI_DO.giayNhanhTuTinh}{' '}
        giây với câu tự tính.{laThay ? ' Số giây gồm cả ước tính ở lượt cũ chưa đo giờ.' : ''}
      </p>
    </>
  )
}

const NG = NGUONG_THAI_DO
/** Vạch ngưỡng trên thước 0–100% của từng tín hiệu (đúng `NGUONG_THAI_DO`; 'xu-huong' là chênh điểm % ⇒ không thước). `caoTot` = càng cao càng tốt. */
const VACH: Partial<Record<MaTinHieu, { chuY: number; xau: number; caoTot: boolean }>> = {
  'ngay-du-muc': { chuY: NG.ngayDuTot, xau: NG.ngayDuChuY, caoTot: true },
  'qua-nhanh': { chuY: NG.nhanChuY, xau: NG.nhanXau, caoTot: false },
  'don-bai': { chuY: NG.donChuY, xau: NG.donXau, caoTot: false },
  'goi-y': { chuY: NG.goiYChuY, xau: NG.goiYXau, caoTot: false },
  'chon-lap': { chuY: NG.lapChuY, xau: NG.lapXau, caoTot: false },
}
/** Số đo lớn của thẻ tín hiệu: "86%" · "−12 điểm %" (xu hướng) · "—" (chưa đo được). */
export function soTinHieu(t: Pick<TinHieuThaiDoApp, 'ma' | 'giaTri'>): string {
  if (t.giaTri === null) return '—'
  if (t.ma === 'xu-huong') return `${t.giaTri > 0 ? '+' : t.giaTri < 0 ? '−' : ''}${Math.abs(t.giaTri)} điểm %`
  return `${t.giaTri}%`
}

function TinHieu({ td, laThay }: { td: KetQuaHoSoThaiDo; laThay: boolean }) {
  return (
    <ul className="gvv2-tdo-th hslc-th-luoi">
      {(td.tinHieu as TinHieuThaiDoApp[]).map((t) => {
        const v = VACH[t.ma]
        const coThuoc = !!v && t.giaTri !== null && t.muc !== 'chua-du'
        return (
          <li key={t.ma} className="gvv2-tdo-th-o hslc-th" data-muc={t.muc} data-ma={t.ma}>
            <div className="gvv2-tdo-th-dau">
              <b>{t.ten}</b>
              <span className="gvv2-tdo-chip" data-muc={t.muc}>
                {TEN_MUC_TIN_HIEU[t.muc]}
              </span>
            </div>
            <p className="hslc-th-so gvv2-so">{soTinHieu(t)}</p>
            {coThuoc && (
              <span className="hslc-th-thuoc" data-muc={t.muc} aria-hidden="true">
                <i style={{ width: `${Math.max(0, Math.min(100, t.giaTri!))}%` }} />
                <b data-vach="chu-y" style={{ left: `${v.chuY}%` }} />
                <b data-vach="xau" style={{ left: `${v.xau}%` }} />
              </span>
            )}
            {coThuoc && laThay && (
              <small className="hslc-th-vach gvv2-so" aria-hidden="true">
                {v.caoTot ? `Vạch: dưới ${v.xau}% chưa đều · từ ${v.chuY}% tốt` : `Vạch: từ ${v.chuY}% cần để mắt · từ ${v.xau}% vượt ngưỡng`}
              </small>
            )}
            <p className="gvv2-tdo-th-chu gvv2-so">{t.chu}</p>
            <small className="gvv2-tdo-th-nguong">Ngưỡng: {t.nguong}.</small>
            {t.doTinCay !== undefined && <ChipTinCay n={t.doTinCay} nho />}
          </li>
        )
      })}
    </ul>
  )
}

/** Số giây từng lần của một câu trong Câu đúng / Câu đã ôn — ghép theo khoá câu của hai lệnh: app thầy là mã thật; bản học sinh / phụ huynh là khoá băm
 *  CỐ ĐỊNH theo mã (đợt 16, server/src/ho-so-em-hs-loc.ts) nên hai lệnh cùng khoá — ba app đều thấy số giây từng lần. */
function GiayCauTomTat({ c, lan }: { c: CauTomTat; lan: readonly LanLamCau[] }) {
  const cua = lan.filter((l) => l.qid === c.qid).sort((a, b) => a.luc.localeCompare(b.luc))
  if (cua.length === 0) return null
  return <GiayTungLan ds={cua.map((l): LanGiay => ({ dung: l.dung, giay: l.giay, nguon: l.giay === null ? null : (l.nguonGiay ?? 'khong-ro') }))} truoc={Math.max(0, c.soLan - cua.length)} />
}

function DsCauTomTat({ cau, loai, lan, ngoi }: { cau: readonly CauTomTat[]; loai: 'dung' | 'on'; lan: readonly LanLamCau[] | null; ngoi: Ngoi }) {
  const [soHien, setSoHien] = useState(MOI_DOT)
  if (cau.length === 0)
    return (
      <p className="gvv2-trong">
        {loai === 'dung' ? `${hoa(ngoi)} chưa làm đúng câu nào trong các lượt đã ghi.` : `${hoa(ngoi)} chưa ôn câu nào (Ôn lại, hoặc làm lại câu từng sai).`}
      </p>
    )
  const con = cau.length - Math.min(soHien, cau.length)
  return (
    <>
      <ul className="gvv2-hs-cau-ds hslc-o-luoi">
        {cau.slice(0, soHien).map((c) => {
          const muc = tenMucDo(c.mucDo)
          const lanCuoi = ngayGio(c.lanCuoi)
          const chip =
            loai === 'dung'
              ? { k: c.dungLanDau ? 'dung-ngay' : 'dung-sau', chu: c.dungLanDau ? 'Đúng ngay lần đầu' : `Đúng sau ${c.soSai} lần sai` }
              : { k: c.lanCuoiDung ? 'dung-ngay' : 'chua', chu: c.lanCuoiDung ? 'Đã sửa được' : 'Chưa sửa được' }
          return (
            <li key={c.qid} className="gvv2-hs-cau hslc-o" data-sua={loai === 'on' && !c.lanCuoiDung ? 'false' : 'true'}>
              <div className="hslc-o-than">
                <span className="gvv2-hs-cau-dau">
                  <b className="hslc-o-ten">{tieuDeCau(c)}</b>
                  <span className="gvv2-tdo-nhan-cau" data-loai={chip.k}>
                    {chip.k === 'chua' ? <RotateCcw size={14} aria-hidden="true" /> : <Check size={14} aria-hidden="true" />}
                    {chip.chu}
                  </span>
                </span>
                <span className="gvv2-hs-cau-phu gvv2-so">
                  {muc ? `${muc} · ` : ''}
                  {loai === 'on' ? `ôn ${c.soLanOn} lần · ` : ''}làm {c.soLan} lần · đúng {c.soDung} · sai {c.soSai}
                  {lanCuoi ? ` · lần cuối ${lanCuoi}` : ''}
                </span>
                {lan && <GiayCauTomTat c={c} lan={lan} />}
              </div>
            </li>
          )
        })}
      </ul>
      {con > 0 && (
        <button type="button" className="gvv2-nut-vien tt-nhan gvv2-hs-them" onClick={() => setSoHien((s) => s + MOI_DOT)}>
          Xem thêm {Math.min(MOI_DOT, con)} câu (còn {con})
        </button>
      )}
    </>
  )
}

/** Khối cũ GẬP (đặc tả 6 mức mục 2: không bỏ khối nào, chỉ dời và gập). Thân chỉ vẽ khi mở (lần đầu mở mới dựng — tấm mở nhanh hơn). */
function Gap({ ten, phu, children }: { ten: string; phu?: string; children: ReactNode }) {
  const [mo, setMo] = useState(false)
  return (
    <details open={mo} onToggle={(e) => setMo(e.currentTarget.open)}>
      <summary className="tt-nhan">
        {ten}
        {phu && <small className="gvv2-so">{phu}</small>}
      </summary>
      {mo && <div className="hsv-gap-than">{children}</div>}
    </details>
  )
}

/** Một ô "Làm bài 7 ngày" (thầy). */
function OSo7({ nhan, so, phu }: { nhan: string; so: string; phu: string }) {
  return (
    <div>
      <dt>{nhan}</dt>
      <dd className="gvv2-so">
        {so}
        <small>{phu}</small>
      </dd>
    </div>
  )
}

export default function HoSoLamCauEm({
  em,
  nhom,
  onDong,
  nguon,
  cheDo = 'thay',
  onChuaCau,
  coTheChua,
  soCauCanSua,
}: {
  em: EmHoSo
  nhom?: LoaiNhomNhip
  onDong: () => void
  /** 12/10F: nguồn dữ liệu riêng (app học sinh / phụ huynh) — xem `NguonHoSo`. */
  nguon?: NguonHoSo
  /** 12/10F: 'hoc-sinh' / 'phu-huynh' ⇒ chữ của người xem, ẩn đường của thầy (xem đầu tệp). */
  cheDo?: CheDoHoSo
  /** Đợt 16 — CHỈ chế độ học sinh: bấm hộp "Chưa sửa được" ⇒ mở Tự sửa lỗi đúng câu ấy (khoá câu của lệnh lịch sử). Chế độ khác bỏ qua. */
  onChuaCau?: (qid: string) => void
  /** Đợt 18 — CHỈ chế độ học sinh: tập khoá mở ("g<số>") của câu đang ở Tự sửa lỗi và còn cần sửa. Hộp có khoá trong tập mới có nút "Sửa câu này";
   *  vắng ⇒ không hộp nào có nút. */
  coTheChua?: ReadonlySet<string>
  /** Tổng thật từ Tự sửa lỗi; tập khoá trên chỉ quyết định nút ở những câu đã tải. */
  soCauCanSua?: number
}) {
  const laThay = cheDo === 'thay'
  const chuCd = CHU_CHE_DO[cheDo]
  const ngoi = chuCd.ngoi
  const onChua = cheDo === 'hoc-sinh' ? onChuaCau : undefined
  const khoaDem = `${cheDo}|${em.sbd}`
  const [dem0] = useState(() => layDemTam(khoaDem))
  const [kq, setKq] = useState<KetQuaLichSuLamCau | null>(dem0?.kq ?? null)
  const [loi, setLoi] = useState('')
  const [dangTai, setDangTai] = useState(!dem0?.kq)
  const [td, setTd] = useState<KetQuaHoSoThaiDo | null>(dem0?.td ?? null)
  const [loiTd, setLoiTd] = useState('')
  const [dangTaiTd, setDangTaiTd] = useState(!dem0?.td)
  const [theGap, setTheGap] = useState<'cau-dung' | 'da-on'>('cau-dung')
  const [loc, setLoc] = useState<LocLuot>({ loai: 'tat-ca' })
  const [phMoHet, setPhMoHet] = useState(false)
  /** Mất mạng khi làm mới NỀN: lúc (ms) của bản đang hiện (bộ nhớ tạm 5 phút) — dải hổ phách "Đang xem bản đã tải lúc …". */
  const [matMang, setMatMang] = useState<number | null>(null)
  const [dangTaiLai, setDangTaiLai] = useState(false)
  const lucBan = useRef<number>(dem0?.luc ?? 0)
  const tungLuot = useRef<HTMLElement>(null)
  const tam = useRef<HTMLElement>(null)
  const nutDong = useRef<HTMLButtonElement>(null)
  const moHoSoEm = useAppStore((s) => s.moHoSoEm)

  const lan = useRef(0)
  /** Trả kết quả đã chuẩn hoá khi đọc được (nền: không bật khung xương, không báo lỗi — đã có bản đang hiện). */
  const tai = useCallback(
    async (gioiHan?: number, nen = false): Promise<KetQuaLichSuLamCau | null> => {
      const l = ++lan.current
      if (!nen) {
        setDangTai(true)
        setLoi('')
      }
      let r: Awaited<ReturnType<typeof layLichSuLamCau>>
      try {
        r = await (nguon ? nguon.lichSu(gioiHan) : layLichSuLamCau(em.sbd, gioiHan))
      } catch (e) {
        r = { ok: false, loai: 'mang', chu: lyDoDeHieu(e) }
      }
      if (l !== lan.current) return null
      let ra: KetQuaLichSuLamCau | null = null
      if (r.ok) {
        ra = chuanHoaMucLam(r.du, cheDo === 'thay')
        setKq(ra)
        lucBan.current = Date.now()
        setMatMang(null)
        // Chỉ cất bản ĐỦ (không bị cắt ở khung đầu) — khung đầu ngắn không được thay bản đủ trong đệm.
        if (!(gioiHan && gioiHan <= GIOI_HAN_KHUNG_DAU && ra.conNua)) ghiDemTam(khoaDem, { kq: ra })
        else ghiDemTam(khoaDem, {})
      } else if (!nen) setLoi(r.loai === 'chua_co_lenh' ? r.chu : lyDoDeHieu(r.chu))
      else if (r.loai === 'mang' && lucBan.current > 0) setMatMang(lucBan.current)
      if (!nen || r.ok) setDangTai(false)
      return ra
    },
    [em.sbd, nguon, khoaDem, cheDo],
  )
  const lanTd = useRef(0)
  const taiTd = useCallback(async () => {
    const l = ++lanTd.current
    setDangTaiTd(true)
    setLoiTd('')
    let r: Awaited<ReturnType<typeof layHoSoThaiDo>>
    try {
      r = await (nguon ? nguon.hoSoThaiDo() : layHoSoThaiDo(em.sbd))
    } catch (e) {
      r = { ok: false, loai: 'mang', chu: lyDoDeHieu(e) }
    }
    if (l !== lanTd.current) return
    if (r.ok) {
      setTd(r.du)
      ghiDemTam(khoaDem, { td: r.du })
    } else setLoiTd(r.loai === 'chua_co_lenh' ? r.chu : lyDoDeHieu(r.chu))
    setDangTaiTd(false)
  }, [em.sbd, nguon, khoaDem])
  useEffect(() => {
    let huy = false
    void (async () => {
      // Chưa có bản trong bộ nhớ: khung đầu nhỏ trước, thái độ sau. Có rồi: đã vẽ — đọc mới NỀN đúng số dòng đang hiện (không rút ngắn danh sách thầy đã mở rộng), rồi thái độ.
      // KHÔNG tự nạp thêm lượt cũ: máy chủ đọc cả cửa sổ để tính tổng nên mỗi lần xin là một lần đọc nặng trên D1 — thầy bấm «Tải thêm lượt cũ hơn» khi cần.
      await tai(dem0?.kq ? Math.min(TRAN_GIOI_HAN, Math.max(GIOI_HAN_KHUNG_DAU, dem0.kq.lan.length)) : GIOI_HAN_KHUNG_DAU, !!dem0?.kq)
      if (huy) return
      void taiTd()
    })()
    return () => {
      huy = true
      lan.current++
      lanTd.current++
    }
  }, [tai, taiTd, dem0])

  // Mở tấm ⇒ focus vào nút Đóng (đầu tấm); Esc đóng; Tab / Shift+Tab vòng trong tấm.
  useEffect(() => {
    nutDong.current?.focus()
  }, [])
  useEffect(() => {
    const phim = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        ev.preventDefault()
        onDong()
        return
      }
      if (ev.key !== 'Tab' || !tam.current) return
      const ds = [...tam.current.querySelectorAll<HTMLElement>(CHON_FOCUS)]
      if (ds.length === 0) return
      const dau = ds[0]!
      const cuoi = ds[ds.length - 1]!
      const dang = document.activeElement
      if (ev.shiftKey && (dang === dau || !tam.current.contains(dang))) {
        ev.preventDefault()
        cuoi.focus()
      } else if (!ev.shiftKey && (dang === cuoi || !tam.current.contains(dang))) {
        ev.preventDefault()
        dau.focus()
      }
    }
    document.addEventListener('keydown', phim)
    return () => document.removeEventListener('keydown', phim)
  }, [onDong])

  const ten = kq?.em.hoTen || td?.em.hoTen || em.ten || em.sbd
  // Lớp: cùng nguồn với bảng đã mở tấm (hồ sơ thái độ / dòng bảng) trước, rồi lịch sử làm câu.
  const tenLop = td?.em.lop || em.lop || kq?.em.lop || ''
  const lop = tenLop ? `Lớp ${tenLop}` : tenKhoi(em.khoi)
  const t = kq?.tong
  const chuaSua = kq ? kq.cauSai.filter((c) => !c.lanCuoiDung).length : 0
  const tiLe = t && t.soLuot > 0 ? `${Math.round((100 * t.soDung) / t.soLuot)}%` : '—'

  // "Hôm nay": dòng Nhịp học (mức hôm nay của kế hoạch Hành trình) khi mở từ Nhịp học; không thì ngày hôm nay của lịch hồ sơ thái độ.
  const hn = useMemo(() => {
    if (em.toiThieu !== undefined && em.daLam !== undefined) {
      const e = { sbd: em.sbd, ten: em.ten, daLam: em.daLam, toiThieu: em.toiThieu }
      return { chu: chuHomNay(e), nhom: nhom ?? nhomNhipCuaEm(e), tang: tenTang(em.tang ?? null), con: coMucNhip(e) ? Math.max(0, (e.toiThieu ?? 0) - e.daLam) : 0 }
    }
    const n = td?.ngay.find((x) => x.homNay)
    if (!n) return null
    return { chu: `${n.daLam}/${n.mucToiThieu} câu`, nhom: nhomNhipCuaEm({ sbd: em.sbd, ten: em.ten, daLam: n.daLam, toiThieu: n.mucToiThieu }), tang: tenTang(n.tang), con: n.thieu }
  }, [em, nhom, td])
  const d = td?.dem
  const coKq = d ? d.soDung + d.soSai : 0
  const tuSuaSai = (td as KetQuaHoSoThaiDoApp | null)?.tuSuaSai
  // 6 MỨC: khối Mức làm + "Theo ngày" mặc định 7 ngày gần nhất (`mucLam6`); máy chủ cũ ⇒ tổng cả sổ `mucLam`, Mức 5–6 "Chưa đo treo máy".
  const m6 = kq?.mucLam6
  const tongMuc = m6?.bay ?? kq?.mucLam
  const coDoTreo = !chuaDoTreoHet(tongMuc, !!m6)
  const lam7 = m6?.lam7
  const soNgayCoTinh = laThay ? (m6?.ngayCoTinh?.length ?? 0) : 0
  const xemTreo = useCallback((ngay?: string) => {
    setLoc({ loai: 'treo', ...(ngay ? { ngay } : {}) })
    const giam = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    tungLuot.current?.scrollIntoView?.({ block: 'start', behavior: giam ? 'auto' : 'smooth' })
  }, [])
  const taiLai = async () => {
    setDangTaiLai(true)
    await tai(kq ? Math.min(TRAN_GIOI_HAN, Math.max(GIOI_HAN_KHUNG_DAU, kq.lan.length)) : GIOI_HAN_KHUNG_DAU, !!kq)
    setDangTaiLai(false)
  }
  const nhomTd = td?.nhomNhip
  // Nhịp 7 ngày cho điểm nhấn học sinh / phụ huynh: ngày ĐÃ QUA đủ mức (hôm nay chưa hết, không tính).
  const bayNgay = td ? td.ngay.slice(-7).filter((n) => !n.homNay) : []
  const chuNhip = td
    ? `${nhomTd ? `Nhịp học: ${TEN_NHOM_NHIP_HOC[nhomTd]} · ` : ''}đủ mức ${bayNgay.filter((n) => n.datMuc).length}/${bayNgay.length} ngày đã qua.${hn && hn.con > 0 ? ` ${hoa(ngoi)} còn ${hn.con} câu tới mức tối thiểu hôm nay.` : ''}`
    : ''

  return (
    <>
      <div className="gvv2-hs-che" aria-hidden="true" onClick={onDong} />
      <section
        ref={tam}
        className="gvv2-hs gvv2-hs--rong hslc hsv"
        data-che-do={cheDo}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gvv2-hs-ten"
        aria-describedby="gvv2-hs-phu"
      >
        <header className="gvv2-hs-dau hslc-dau">
          <span className="gvv2-avatar" aria-hidden="true">
            {chuCaiTen(ten)}
          </span>
          {laThay ? (
            <div className="gvv2-hs-dau-chu">
              <small className="gvv2-hs-mat">Hồ sơ làm bài</small>
              <h2 id="gvv2-hs-ten" className="gvv2-h2">
                {ten}
              </h2>
              <p id="gvv2-hs-phu" className="gvv2-so">
                SBD {em.sbd} · {lop}
                {m6 ? ` · ${chuKhoang7(m6)}` : ''}
              </p>
              {(soNgayCoTinh > 0 || td?.coDoiPho || nhomTd) && (
                <div className="hsv-dau-chip">
                  {soNgayCoTinh > 0 && (
                    <span className="hsv-chip-dau" data-t="6">
                      <HinhCoTinh />
                      Cố tình treo máy · {soNgayCoTinh} ngày trong 7 ngày
                    </span>
                  )}
                  {td?.coDoiPho && nhomTd && (
                    <span className="hsv-chip-dau" data-l="">
                      Có dấu hiệu đối phó
                    </span>
                  )}
                  {nhomTd && (
                    <span className="hsv-chip-dau" data-l={nhomTd === 'cham' ? undefined : ''} data-nhom={nhomTd}>
                      Nhịp học: {TEN_NHOM_NHIP_HOC[nhomTd]}
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="gvv2-hs-dau-chu">
              <small className="gvv2-hs-mat">
                {ten}
                {tenLop ? ` · Lớp ${tenLop}` : ''}
              </small>
              <h2 id="gvv2-hs-ten" className="gvv2-h2 gvv2-so">
                Hồ sơ làm bài của {ngoi}
              </h2>
              <p id="gvv2-hs-phu" className="gvv2-so">
                {m6 ? `${chuKhoang7(m6)} · ` : `Từ ${ngayNgan(td?.tu ?? NGAY_BAT_DAU_BAI_HANG_NGAY)} · `}Thầy cũng xem hồ sơ này.
              </p>
            </div>
          )}
          <button ref={nutDong} type="button" className="gvv2-nut-chu tt-nhan gvv2-hs-dong" onClick={onDong}>
            <X size={18} aria-hidden="true" />
            Đóng
          </button>
        </header>

        <div className="gvv2-hs-than hslc-than">
          {matMang !== null && kq && (
            <div className="hsv-mang" role="status">
              <HinhMatMang />
              <p>Mất mạng. Đang xem bản đã tải lúc {ngayGio(new Date(matMang).toISOString())}.</p>
              <button type="button" className="gvv2-nut-vien tt-nhan" onClick={() => void taiLai()} disabled={dangTaiLai || dangTai}>
                Tải lại
              </button>
            </div>
          )}
          <div className="hsv-luoi">
            {/* CỘT TRÁI: thầy = Cách làm bài 6 mức + Từng lượt · học sinh / phụ huynh = điểm nhấn + cách làm bài + từng lượt */}
            <div className="hsv-cot">
              {!laThay && (lam7 || td) && (
                <section className="hsv-nhan" aria-labelledby="hsv-nhan">
                  <small id="hsv-nhan">{lam7 ? `7 ngày gần nhất của ${ngoi}` : `Từ ${ngayNgan(td!.tu)} tới nay`}</small>
                  <div className="hsv-nhan-so gvv2-so">
                    <b>{lam7 ? lam7.soLuot : td!.dem.soLuot}</b>{' '}
                    <span>lượt làm câu · đúng {lam7 ? lam7.soDung : td!.dem.soDung} lượt</span>
                  </div>
                  {chuNhip && <p>{chuNhip}</p>}
                </section>
              )}
              {kq === null && dangTai ? (
                <XuongTam />
              ) : kq === null ? (
                <div className="hsv-loi" role="alert">
                  <p>
                    Chưa tải được hồ sơ làm bài của {ngoi}. {loi}
                  </p>
                  <button type="button" className="gvv2-nut-vien tt-nhan" onClick={() => void tai()} disabled={dangTai}>
                    Thử lại
                  </button>
                </div>
              ) : (
                <>
                  {loi && (
                    <div className="hsv-loi" role="alert">
                      <p>Chưa tải thêm được lượt cũ hơn. {loi}</p>
                      <button type="button" className="gvv2-nut-vien tt-nhan" onClick={() => void tai(TRAN_GIOI_HAN)} disabled={dangTai}>
                        Thử lại
                      </button>
                    </div>
                  )}
                  {t!.soLuot === 0 ? (
                    <div className="hsv-trong">
                      <b>Chưa có lượt làm câu nào</b>
                      <p>
                        Sổ chưa ghi lượt làm câu nào của {ngoi}. Khi {ngoi} làm bài hằng ngày, ca kiểm tra hay Ôn lại, lượt sẽ hiện ở đây.
                      </p>
                    </div>
                  ) : (
                    <>
                      {tongMuc &&
                        (laThay ? (
                          <KhoiSauMucThay tong={tongMuc} m6={m6} onXemTreo={xemTreo} />
                        ) : (
                          <KhoiCachLamEm6 tong={tongMuc} m6={m6} cheDo={cheDo} soSaiTong={lam7 ? lam7.soSai + lam7.soBoTrong : m6 ? undefined : t!.soSai + t!.soBoTrong} />
                        ))}
                      <section ref={tungLuot} className="hsv-khoi" aria-labelledby="hsv-lan">
                        <h3 id="hsv-lan">
                          {cheDo === 'phu-huynh' && !phMoHet ? 'Lượt sai gần đây' : 'Từng lượt'} <small>· mới nhất trên cùng</small>
                        </h3>
                        {cheDo === 'phu-huynh' && !phMoHet ? (
                          <>
                            <LuotSaiGanDay kq={kq} />
                            <button type="button" className="gvv2-nut-vien tt-nhan hsv-them" onClick={() => setPhMoHet(true)}>
                              Xem mọi lượt của con
                            </button>
                          </>
                        ) : (
                          <LichSu kq={kq} dangTai={dangTai} onTaiThem={() => void tai(TRAN_GIOI_HAN)} ngoi={ngoi} laThay={laThay} cheDo={cheDo} loc={loc} datLoc={setLoc} coDoTreo={coDoTreo} />
                        )}
                      </section>
                    </>
                  )}
                </>
              )}
            </div>

            {/* CỘT PHẢI: thầy = Hôm nay · Làm bài 7 ngày · Theo ngày · Câu chưa sửa · khối gập; học sinh = câu chờ sửa lên đầu */}
            <div className="hsv-cot">
              {laThay && hn && (
                <div className="gvv2-hs-hn" data-nhom={hn.nhom}>
                  <span className="gvv2-hs-hn-chu">
                    <small>Hôm nay</small>
                    <b className="gvv2-so">{hn.chu}</b>
                  </span>
                  <span className="gvv2-hs-hn-chu">
                    <small>Tầng hiện tại</small>
                    <b>{hn.tang}</b>
                  </span>
                  <span className="gvv2-hs-nhom" data-nhom={hn.nhom}>
                    {TEN_NHOM_NHIP[hn.nhom]}
                  </span>
                  {hn.nhom !== 'du' && hn.con > 0 && <small className="gvv2-hs-hn-phu gvv2-so">Còn {hn.con} câu tới mức tối thiểu</small>}
                  {!!em.conThieu && em.conThieu > 0 && <small className="gvv2-hs-hn-phu gvv2-so">Kho thiếu {em.conThieu} câu phù hợp cho em hôm nay</small>}
                </div>
              )}
              {laThay && !!em.canBoSung?.length && (
                <div className="gvv2-hs-bo-sung">
                  <b>Kiến thức cần bổ sung</b>
                  <ul>
                    {em.canBoSung.map((c, i) => (
                      <li key={i}>
                        {c.ten} · {c.lyDo === 'can_sua_nen' ? 'Cần câu củng cố nền' : 'Cần thêm câu đã duyệt'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {laThay && lam7 && (
                <section className="hsv-khoi" aria-labelledby="hsv-tong">
                  <h3 id="hsv-tong">Làm bài 7 ngày</h3>
                  <dl className="hsv-so">
                    <OSo7 nhan="Đã làm" so={`${lam7.soLuot} lượt`} phu={`${lam7.soCau} câu khác nhau`} />
                    <OSo7 nhan="Đúng" so={`${lam7.soDung} lượt`} phu={lam7.soLuot > 0 ? `${Math.round((100 * lam7.soDung) / lam7.soLuot)}% số lượt` : 'chưa có lượt'} />
                    <OSo7 nhan="Sai" so={`${lam7.soSai + lam7.soBoTrong} lượt`} phu={`gồm ${lam7.soBoTrong} lượt bỏ trống`} />
                    <OSo7
                      nhan="Giây trung bình"
                      so={lam7.giayTb !== null && lam7.giayTb > 0 ? doiGiay(lam7.giayTb) : 'Chưa đo'}
                      phu={lam7.soTreo > 0 ? `không tính ${lam7.soTreo} lượt treo máy` : coDoTreo ? `${lam7.soLuotCoGiay} lượt có số giây` : 'chưa đo treo máy'}
                    />
                  </dl>
                </section>
              )}
              {cheDo !== 'thay' && kq && kq.cauSai.length > 0 && (
                <section className="hsv-khoi" aria-labelledby="hsv-sua">
                  <h3 id="hsv-sua">Câu từng sai</h3>
                  <DsCauSai cauSai={kq.cauSai} lan={kq.lan} onChuaCau={onChua} coTheChua={coTheChua} soCauCanSua={soCauCanSua} ngoi={ngoi} cheDo={cheDo} />
                </section>
              )}
              {cheDo !== 'phu-huynh' && m6 && m6.theoNgay.length === 7 && <KhoiTheoNgay theoNgay={m6.theoNgay} cheDo={cheDo} />}
              {laThay && kq && kq.cauSai.length > 0 && (
                <section className="hsv-khoi" aria-labelledby="hsv-sua">
                  <h3 id="hsv-sua">Câu từng sai</h3>
                  <DsCauSai cauSai={kq.cauSai} lan={kq.lan} onChuaCau={onChua} coTheChua={coTheChua} soCauCanSua={soCauCanSua} ngoi={ngoi} cheDo={cheDo} />
                </section>
              )}

              {/* KHỐI CŨ, GẬP: nội dung giữ nguyên, chỉ dời xuống (đặc tả mục 2 — không bỏ khối nào). Vẽ khi mở lần đầu. */}
              <div className="hsv-gap">
                <Gap ten={laThay ? 'Nhịp học và 14 ngày gần nhất' : 'Lịch làm bài 14 ngày'} phu={nhomTd ? TEN_NHOM_NHIP_HOC[nhomTd] : !td && !dangTaiTd ? 'Chưa tải được' : undefined}>
                  {td ? (
                    <DauThaiDo td={td} matDau={chuCd.matDau} ngoi={ngoi} laThay={laThay} laHocSinh={cheDo === 'hoc-sinh'} />
                  ) : dangTaiTd ? (
                    <XuongThaiDo chu={chuCd.dangTai} />
                  ) : (
                    <div className="gvv2-tdo-loi" role="status">
                      <p>
                        {chuCd.loi} {loiTd}
                      </p>
                      <button type="button" className="gvv2-nut-vien tt-nhan" onClick={() => void taiTd()} disabled={dangTaiTd}>
                        {chuCd.nutTai}
                      </button>
                    </div>
                  )}
                  {td && d && (
                    <>
                      <section className="gvv2-tdo-khoi hslc-khoi" aria-labelledby="gvv2-tdo-so-tieu">
                        <h3 id="gvv2-tdo-so-tieu" className="gvv2-tdo-tieu">
                          Làm bài {chuTuDen(td.tu, td.den)}
                        </h3>
                        <dl className="gvv2-tdo-so">
                          <OSoTd nhan="Đã làm" so={`${d.soLuot} lượt`} phu={`${d.soCau} câu khác nhau`} />
                          <OSoTd nhan="Đúng" so={`${d.soDung} lượt`} phu={phan(d.soDung, coKq) === null ? 'chưa có lượt có kết quả' : `${phan(d.soDung, coKq)}% lượt có kết quả`} />
                          <OSoTd nhan="Sai" so={`${d.soSai} lượt`} phu={`${d.soBoTrong} lượt bỏ trống`} />
                          <OSoTd nhan="Đã ôn" so={`${d.soCauOn} câu`} phu={`${d.soLuotOn} lượt ôn`} />
                          <OSoTd
                            nhan="Giây trung bình"
                            so={d.giayTb !== null && d.giayTb > 0 ? doiGiay(d.giayTb) : 'Chưa đo'}
                            phu={d.giayTrungVi !== null ? `trung vị ${doiGiay(d.giayTrungVi)} · ${d.soLuotCoGiay} lượt có số giây` : 'chưa có lượt có số giây'}
                          />
                          {tuSuaSai && tuSuaSai.soCauSai > 0 && <OSoTd nhan="Tự sửa được" so={`${tuSuaSai.soCauDaSua}/${tuSuaSai.soCauSai} câu`} phu={tuSuaSai.chu} />}
                        </dl>
                      </section>
                      <section className="gvv2-tdo-khoi hslc-khoi" aria-labelledby="gvv2-tdo-lich-tieu">
                        <h3 id="gvv2-tdo-lich-tieu" className="gvv2-tdo-tieu">
                          Lịch làm bài theo ngày <small>· đã làm/mức tối thiểu</small>
                        </h3>
                        <LichNgay ngay={td.ngay} />
                      </section>
                      <section className="gvv2-tdo-khoi hslc-khoi" aria-labelledby="gvv2-tdo-dung-tieu">
                        <h3 id="gvv2-tdo-dung-tieu" className="gvv2-tdo-tieu">
                          Độ đúng theo ngày <small>· % lượt đúng trên lượt có kết quả</small>
                        </h3>
                        <CotDoDung ngay={td.ngay} />
                      </section>
                      <section className="gvv2-tdo-khoi hslc-khoi" aria-labelledby="gvv2-tdo-giay-tieu">
                        <h3 id="gvv2-tdo-giay-tieu" className="gvv2-tdo-tieu">
                          Số giây mỗi lượt
                        </h3>
                        <PhanBoGiay td={td} laThay={laThay} />
                      </section>
                      {td.canhBao.map((c) => (
                        <p key={c} className="gvv2-hs-ghi">
                          {c}
                        </p>
                      ))}
                    </>
                  )}
                </Gap>
                {td && (
                  <Gap ten="Sáu tín hiệu và ngưỡng" phu={laThay ? 'số đo, vạch ngưỡng, mức' : undefined}>
                    <section className="gvv2-tdo-khoi hslc-khoi" aria-labelledby="gvv2-tdo-th-tieu">
                      <h3 id="gvv2-tdo-th-tieu" className="gvv2-tdo-tieu gvv2-an-chu">
                        Sáu tín hiệu và ngưỡng
                      </h3>
                      <TinHieu td={td} laThay={laThay} />
                    </section>
                  </Gap>
                )}
                {kq && kq.lan.length > 0 && (
                  <Gap ten="Số giây theo mức độ câu" phu="dễ → khó">
                    <GiayMucDo lan={kq.lan} laThay={laThay} />
                  </Gap>
                )}
                {td && (
                  <Gap ten="Câu đúng · Câu đã ôn" phu={`${td.cauDung.length} · ${td.cauDaOn.length} câu`}>
                    <div className="gvv2-con hslc-the-con" data-so="2" role="tablist" aria-label="Câu đúng và câu đã ôn">
                      {(
                        [
                          ['cau-dung', 'Câu đúng', td.cauDung.length],
                          ['da-on', 'Câu đã ôn', td.cauDaOn.length],
                        ] as const
                      ).map(([k, nhan, so]) => (
                        <button
                          key={k}
                          type="button"
                          role="tab"
                          id={`gvv2-hs-the-${k}`}
                          aria-controls={`gvv2-hs-o-${k}`}
                          aria-selected={theGap === k}
                          className="gvv2-con-nut tt-nhan"
                          onClick={() => setTheGap(k)}
                        >
                          {nhan} <span className="gvv2-so">· {so}</span>
                        </button>
                      ))}
                    </div>
                    <div role="tabpanel" id={`gvv2-hs-o-${theGap}`} aria-labelledby={`gvv2-hs-the-${theGap}`} className="gvv2-hs-o-the">
                      <DsCauTomTat key={theGap} cau={theGap === 'cau-dung' ? td.cauDung : td.cauDaOn} loai={theGap === 'cau-dung' ? 'dung' : 'on'} lan={kq?.lan ?? null} ngoi={ngoi} />
                    </div>
                  </Gap>
                )}
                {kq && t && t.soLuot > 0 && (
                  <Gap ten={`Toàn bộ sổ của ${ngoi}`} phu={`${t.soLuot} lượt`}>
                    <dl className="gvv2-hs-so">
                      <OSo nhan="Số lượt làm câu" so={String(t.soLuot)} phu={`${t.soCau} câu khác nhau`} />
                      <OSo nhan="Tỉ lệ đúng" so={tiLe} phu={`${t.soDung} đúng · ${t.soSai} sai · ${t.soBoTrong} bỏ trống`} />
                      <OSo nhan="Câu từng sai" so={String(t.soCauSai)} phu={`${chuaSua} câu chưa sửa được`} />
                      <OSo nhan="Trung bình mỗi câu" so={t.giayTb !== null && t.giayTb > 0 ? doiGiay(t.giayTb) : 'Chưa đo'} phu="lượt đo được, gồm ước tính" />
                    </dl>
                    {kq.catBot && <p className="gvv2-hs-ghi">Số liệu tính trên 5000 lượt gần nhất của {ngoi}.</p>}
                    {m6 && m6.toanBo.soDo + m6.toanBo.chuaCoSoDo > 0 && (
                      <>
                        <p className="hsv-phu gvv2-so">
                          Mức làm cả sổ: đo được <b>{m6.toanBo.soDo}</b>/<b>{m6.toanBo.soDo + m6.toanBo.chuaCoSoDo}</b> lượt.
                        </p>
                        <ThanhSau
                          dem={[...m6.toanBo.theoMuc.map((r) => r.luot), m6.toanBo.soTreo, m6.toanBo.soCoTinh].slice(0, laThay ? 6 : 5)}
                          chua={m6.toanBo.chuaCoSoDo}
                          cheDo={cheDo}
                        />
                      </>
                    )}
                  </Gap>
                )}
              </div>
            </div>
          </div>
        </div>

        {laThay && (
          <footer className="gvv2-hs-chan">
            <button type="button" className="gvv2-nut-vien tt-nhan" onClick={() => moHoSoEm(em.sbd)}>
              <ExternalLink size={18} aria-hidden="true" />
              Mở hồ sơ đầy đủ
            </button>
            <small>Ca kiểm tra, EXP, phụ huynh của em</small>
          </footer>
        )}
      </section>
    </>
  )
}
