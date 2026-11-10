// GIAO DIỆN «TRONG» · APP HỌC SINH — phần trình bày RIÊNG của bản vẽ thầy chốt 26/10 (ve-moi/hs-mot-trang*.html, hs-menu-phai.html; từ 26/10 tối: ve-moi/dm-*.html —
// hướng Duolingo + chất Hoá), NẠP LƯỜI qua nap-trong-hs.ts (chỉ khi `<html data-trong>`): Lộ trình · Luyện tập · Thành tích + menu dọc mép phải (Điểm danh đầu menu, A.I Đỗ Đại Học dưới 3 mục). Cùng số, cùng
// chữ nút, cùng lệnh với bản cũ — chỉ đổi trình bày. Kiểu ở styles/trong-hs.css (nạp cùng mảnh này ⇒ vẽ là đã có kiểu).
import { ChuNutChinh, ViecTrong } from './nut-chinh-chu'
import { lazy, Suspense, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { Award, Check, CheckCircle2, ChevronRight, ClipboardCheck, FlaskConical, Flame, GraduationCap, History, Layers, LineChart, Lock, PenLine, Play, QrCode, RefreshCw, Route, Sparkles, Target, Trophy, Wrench, type LucideIcon } from 'lucide-react'
import { chuCauMuc, soChangXong, vuotMuc, type SoHomNay } from './lam-bai'
import { chuViecBai } from './chu-viec-bai'
import { laLop12 } from './la-lop-12'
import { chiaChang, chuNutHoc, useNhipHocEm } from './nhip-hom-nay'
import { NHAN_LOAI_NGAY, bongHoc, chuNutLoai, nhomDangSua, type LoaiNgay } from './loai-ngay'
import { chuViecTiepHs, nhipTheoSanh } from '../../lib/nhip-hoc-em'
import type { TomTatKiemTra } from '../../lib/kiem-tra-ca-nhan'
import type { TomTatGoi7 } from '../../lib/goi-bai-7'
import type { Props as PropsHomNayCu } from './HocTapHomNay'
import { ngayGon, useDiemDanhHs } from '../diem-danh/diem-danh-hs'
import NutVaoBpu from '../bpu/NutVaoBpu'
import type { BuoiCuaEm } from '../../lib/buoi-hoc-api'
import { Bi, type CamBi } from '../linh-vat/Bi'
// LỬA ĐỔI CẢM XÚC (thầy «Chốt duyệt tất» 31/10, docs/DE-XUAT-BI-CAM-XUC-3110.md): luật + lời (hàm thuần) · sổ câu được tính trên máy · biểu tượng tab + chấm số.
import { chanNgon, loiLua, mocDoiLua, soLuot, xetLua, type CapLua, type VaoLua } from '../../lib/lua-cam-xuc'
import { chonChoBong, rongOmChu, type Hop } from '../../lib/bong-bong-mol'
import { useBongVuaChu } from '../../lib/bong-vua-chu'
import { docLuaThat } from '../../lib/lua-that'
import { gioMayChu } from '../../lib/gio-may-chu'
import { anMung, banHat, KHOA_AM_AN_MUNG, kichRuong, napAnMung, napTruocAnMung, yenLang } from '../../lib/hieu-ung'
import { napTruocKhoHs } from '../../lib/nap-truoc-kho-hs'
import { docNhoTuSua, ngheTuSua } from '../../lib/tu-sua-loi'
// Việc hôm nay NẠP ĐỘNG qua mảnh ManTuChua (đã là điểm nạp lười, có trong precache, Lộ trình nạp sẵn lúc rảnh): nhập tĩnh / nạp thẳng tu-sua-viec-hom-nay làm
// Rolldown tách chua-truc-tiep thành tệp riêng (+1 tệp precache, trần 170).
type ModViec = Pick<typeof import('./ManTuChua'), 'baoKhoaSua' | 'conSuaHomNay' | 'conSuaPhanNgay' | 'docSbdHs' | 'dungViecHomNay' | 'luuViecHomNay' | 'ngheXongSua' | 'napTruocCauSua' | 'napTruocSuaNgay' | 'napGoiSuaDem' | 'guiLaiSuaCho'>
// TẢI LẠI KHÔNG CÓ HIỆU ỨNG CHÈN VÀO (thầy 02/11 khuya «Bấm f5 vẫn có những hiệu ứng gì đó chèn vào sửa triệt để đi»): mảnh này nạp ngay khi mở trang
// (napTrongHs) ⇒ trong 2,5 giây đầu gắn <html data-vua-mo>: hoạt ảnh CSS vào màn nhảy thẳng tới cuối, không chuyển tiếp màu (trong-kinh.css), Mol hiện
// trọn lời không gõ từng chữ (bi-dong.ts). Mở mảnh muộn (sau đăng nhập, > 6 giây) ⇒ không gắn.
if (typeof document !== 'undefined' && typeof performance !== 'undefined' && performance.now() < 6000) {
  const h = document.documentElement
  h.setAttribute('data-vua-mo', '')
  window.setTimeout(() => h.removeAttribute('data-vua-mo'), 2500)
}
const SO_CAU_MOI_NGAY = 12 // = SO_CAU_MOI_NGAY của tu-sua-viec-hom-nay (chỉ dùng khi mảnh chưa nạp)
import type { KetQuaDanhSachChua } from '../../lib/chua-cau-sai-api'
import '../../styles/trong-hs.css'
import '../../styles/trong-hs-ngang.css' // NGANG + MÁY TÍNH 27/10: chỉ bố cục, nạp SAU trong-hs.css
import '../../styles/trong-kinh.css' // HỆ KÍNH 02/11: Hôm nay + thanh nổi + tấm Thêm — nạp SAU hai tờ trên (cùng mảnh, không thêm tệp)
import '../../styles/bong-mol.css' // 07/11 bong bóng Mol theo cảm xúc (thầy chốt docs/ban-ve-bong-bi-0711) — sau trong-kinh.css, cùng mảnh
import '../../styles/bo-cuc-hn.css' // 07/11 bố cục khổ rộng thầy duyệt (docs/ban-ve-bo-cuc-hn-0711) — sau bong-mol.css, cùng mảnh
import '../../styles/khong-xuong-hs.css' // thầy 03/11 «màn nào load hiện khung xương … xoá sạch»: khối giữ chỗ lúc tải trong suốt (cùng mảnh, không thêm tệp)
// THƯỞNG PHẠT (gộp đợt 3, 26/10 — src/components/thuong/CAM-VAO.md): thanh trên ThanhThuong vẽ NGAY từ bản lưu máy (nhỏ, cùng mảnh «Trong»); mọi màn
// thưởng phạt + thẻ bên là MỘT mảnh nạp lười (ManThuong). Học sinh không thấy nhãn nhịp học / bậc.
import { ThanhThuong } from '../thuong/ThanhThuong'
import { IcNguyenTu, IcTinhThe } from '../thuong/hinh' // biểu tượng nguyên tử / tinh thể ĐÚNG như bộ đếm thưởng (không thêm biểu tượng thư viện)
import { TheBanLoTrinh } from '../thuong/TheBanLoTrinh' // lối vào Học cùng bạn trên Lộ trình (27/10)
import { capNhatTongQuan, useTongQuan } from '../thuong/dung-thuong'
import { moRuong, napSanThanhTich, type TongQuanThuong } from '../../lib/thuong-api'
import { laSamsungInternet } from '../../lib/nhac-samsung'
import { giuToanManHs } from '../../lib/toan-man-hs'
import { ganNghieng } from '../../lib/binh-nghieng'
import { anhSvg, baoLoTrinh, goKhungTinh, henChupKhungTinhHs, sbdPhien } from '../../lib/khung-tinh-hs'
import type { TenManThuong } from '../thuong/ManThuong'
const ManThuong = lazy(() => import('../thuong/ManThuong'))
const TheBenThuong = lazy(() => import('../thuong/ManThuong').then((m) => ({ default: m.TheBenThuong })))
// Thẻ nhắc Samsung Internet (27/10): mảnh riêng chỉ máy Samsung Internet tải; tải hỏng ⇒ không vẽ gì.
const NhacSamsung = lazy(() => import('./NhacSamsung').catch(() => ({ default: () => null })))
const DemNguocThi = lazy(() => import('./DemNguocThi').catch(() => ({ default: () => null }))) // 10/11: đầu cột phải khổ ≥ 1100
const LichBaiHs = lazy(() => import('./LichBaiHs').catch(() => ({ default: () => null })))
const NhomSuaHomNay = lazy(() => import('./NhomSuaHomNay').catch(() => ({ default: () => null }))) // khối B lát 3: chỉ ngày Sửa, kho tải ngầm
// Màn phủ tạm đóng (27/10): đi cùng mảnh nạp lười ManThuong, chỉ tải khi thầy đang đóng app (28/10 tác tử tốc độ: trước nằm trong mảnh này ⇒ mọi lần mở
// Lộ trình cõng ~0,6 KB nén mã chỉ dùng lúc đóng). Không thêm mảnh / tệp precache mới (precache đang ở trần 170 tệp).
const PhuTamDong = lazy(() => import('../thuong/ManThuong').then((m) => ({ default: m.PhuTamDong })))
// LUÔN TRÀN TOÀN MÀN (thầy 28/10 «full hẳn, không dải đen»): gắn một lần lúc mảnh này nạp (song song Sảnh, ngoài đường mở app ⇒ không cộng byte lượt mở).
giuToanManHs()
/** Sự kiện màn làm chặng phát khi xong bài ĐẦU TIÊN trong ngày ⇒ Lộ trình mở «Chuỗi ngày» với hiệu ứng lửa bùng (C1). */
export const SU_KIEN_MO_CHUOI = 'ddh-thuong-mo-chuoi'
/** Chạm mục menu ⇒ phanHoi('chon') (rung + tiếng, tự theo công tắc). Nạp LƯỜI: không kéo am-thanh / rung vào nhóm mở app (luật tốc độ). — khai báo TRƯỚC mọi chỗ dùng (lint no-use-before-define). */
const cham = () => { void import('../../lib/phan-hoi').then((m) => m.phanHoi('chon'), () => {}) }
/** Cột bên (thẻ Giải tuần + Nhiệm vụ) chỉ hiện ở máy tính / điện thoại ngang (cùng điều kiện CSS `.dm-ben`) ⇒ điện thoại dọc không nạp mảnh màn thưởng. */
const MQ_BEN = '(min-width: 1000px), (max-height: 520px) and (min-width: 600px)'
function useMq(q: string): boolean {
  const [co, setCo] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(q).matches)
  useEffect(() => {
    const m = window.matchMedia?.(q)
    if (!m) return
    const doi = () => setCo(m.matches)
    m.addEventListener?.('change', doi)
    return () => m.removeEventListener?.('change', doi)
  }, [q])
  return co
}
const useCoBen = (): boolean => useMq(MQ_BEN)
/** Điện thoại ngang thấp (cao < 600 px): Lộ trình tự cuộn tới chặng hiện tại ⇒ bong bóng đầu trang khuất ⇒ từ cấp 2 Lửa nói CẠNH mình (đặc tả 31/10 mục 2.2). */
/** Biểu tượng tab mặt Mol cáu (đầu đỏ): ở mảnh lười mol-dong (đã nạp cùng linh vật; chỉ cần từ cấp 4). */
/** Chấm số trên biểu tượng app đã cài (`navigator.setAppBadge` — iPhone iOS 16.4+ đã cho phép thông báo, Chrome/Edge máy tính): = câu còn thiếu; 0 ⇒ xoá. */
function chamSoApp(n: number): void {
  const nav = (typeof navigator === 'undefined' ? {} : navigator) as { setAppBadge?: (n?: number) => Promise<void>; clearAppBadge?: () => Promise<void> }
  try { (n > 0 ? nav.setAppBadge?.(Math.min(999, n)) : nav.clearAppBadge?.())?.catch(() => {}) } catch { /* không hỗ trợ */ }
}

// ── SỐ CỦA EM TRONG HÀNG ĐẦU MENU (thầy 27/10 xem bản sống: «Ko làm hai ẩn, chuyển hết 4 biểu tượng bên trái vào menu ẩn bên phải… thiết kế tinh tế dễ nhìn
// siêu đẹp» · «Chuyển hết vào menu này» · «Cho nó xếp dọc tinh tế bỏ nền thẳng hàng với cái chuông để ko phải thêm hàng vào menu»): bỏ viên mép trái (PR 501);
// · «Ý tôi là để dọc xuống thẳng hàng cách đều dưới cái chuông»: 4 mục — vòng mục tiêu · lửa · nguyên tử · tinh thể — biểu tượng trên, số dưới, không nền,
// thành CỘT DỌC bên phải 6 mục của menu, ngay dưới chuông, cùng trục (ô #tr-menu-dem của MenuDocTrong).
// Vẽ bằng portal vào ô ấy (menu là cây React khác); chạm ô ⇒ mở màn như cũ + menu thu (MenuDocTrong nghe click DOM của ô). Nội dung lấy lại TOÀN bộ bề ngang.
/** Ô #tr-menu-dem trong menu (chưa vẽ xong ⇒ thử lại vài khung hình). Không có menu ⇒ không vẽ số (không chỗ nổi nào khác). */
function useChoSo(bat: boolean): HTMLElement | null {
  const [cho, datCho] = useState<HTMLElement | null>(null)
  useLayoutEffect(() => {
    if (!bat || typeof document === 'undefined') { datCho(null); return }
    let lan = 0, h = 0
    const tim = () => {
      const o = document.getElementById('tr-menu-dem')
      if (o) datCho(o)
      else if (lan++ < 30) h = requestAnimationFrame(tim)
    }
    tim()
    return () => cancelAnimationFrame(h)
  }, [bat])
  return cho
}

export interface PropsMotTrang {
  loaiNgay?: LoaiNgay
  /** Khối B lát 3–4: tóm tắt Gói 7 ⇒ mảnh lười NhomSuaHomNay (nhóm lỗi ngày Sửa + dải nợ bài cũ) trên Việc hôm nay. */
  goi7?: TomTatGoi7
  so: SoHomNay | null; dangTai: boolean; tenBai?: string; viec?: string
  onHoc: () => void; khoaHoc: boolean; hetCau: boolean; kho?: { choBoSung?: number; sanSang?: number; caThi?: boolean }
  coCa: boolean; onThi: () => void; token?: string
  soSua: number | null; onChua: () => void; hinhSua?: ReactNode
  kiem?: TomTatKiemTra; ngayKiem: boolean; onKiemTra?: () => void
  soBaiTap?: number; coBaiTap?: boolean; onBaiTap: () => void
  /** Dòng nhắc sẵn có của Hôm nay (thiếu câu phù hợp, câu đang giữ cho ca). */
  ghi: string[]
  /** Mục menu đang mở: 'hom-nay' = Lộ trình · 'on-lai' = Luyện tập · 'ket-qua' = Thành tích (cùng id mục cũ của cổng). */
  muc?: string
  hs?: HsTrong
  /** Hệ Kính 02/11: đầu trang «Chào …» + chuông thông báo THẬT (ThongBaoHocSinh, chuyển từ menu ra đầu trang — một bản duy nhất). */
  ten?: string; thongBao?: ReactNode
}
// Chữ ngày giờ Kiểm tra ôn tập — cùng luật với kiem-tra-chu.ts (giờ Việt Nam, hạn đúng 00:00 hôm sau ⇒ "24:00"); viết gọn tại đây để mảnh «Trong» không kéo
// kiem-tra-chu thành một tệp precache riêng (trần 170 tệp — scripts/kiem-sw.mjs).
const VN = 7 * 3600_000, hai = (n: number) => String(n).padStart(2, '0')
const ngayVn = (ms: number) => new Date(ms + VN).toISOString().slice(0, 10)
const gioVn = (ms: number) => { const t = new Date(ms + VN); return `${hai(t.getUTCHours())}:${hai(t.getUTCMinutes())}` }
const gioHan = (han: number, ngay: string) => (gioVn(han) === '00:00' && ngayVn(han - 1) === ngay ? '24:00' : gioVn(han))
const diemChu = (d: number) => String(Math.round(d * 100) / 100).replace('.', ',')
const THU = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
const ngayKiemChu = (ngay: string, now: number) => {
  const [y, m, d] = ngay.split('-').map(Number)
  if (!y || !m || !d) return ngay
  const con = Math.round((Date.UTC(y, m - 1, d) - Date.parse(`${ngayVn(now)}T00:00:00Z`)) / 86_400_000)
  return `${THU[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]} ${hai(d)}/${hai(m)}${con > 0 ? ` · còn ${con} ngày` : ''}`
}

/** Chữ phụ của dòng Kiểm tra ôn tập — chỉ số có trong TomTatKiemTra (như thẻ TheKiemTraCaNhan). */
function chuKiem(k: TomTatKiemTra): string {
  if (k.trangThai === 'cho_nguon') return 'Đang chuẩn bị'
  if (k.nopLuc !== null || k.trangThai === 'het_han') return `${k.trangThai === 'het_han' ? (k.nopLuc === null ? 'Đã lỡ' : 'Đã hết hạn') : 'Đã nộp'} · ${k.diem !== null ? `điểm ${diemChu(k.diem)}/10` : 'đang chấm'}`
  if (!k.homNay) return ngayKiemChu(k.ngay, k.serverNow)
  return `${k.tong} câu · khoảng ${k.phut} phút · hạn nộp ${gioHan(k.hanLuc, k.ngay)}`
}

/** SỐ TRÊN NÚT «SỬA LỖI» (thầy duyệt 28/10 «sửa theo đề xuất»): số câu CÒN PHẢI SỬA HÔM NAY của việc hôm nay (12 câu, chặng 4 — tu-sua-viec-hom-nay.ts), không phải
 *  tổng nợ (tổng chỉ ở màn Tự sửa lỗi: «Còn N lỗi cần sửa»). Danh sách lấy từ bản nhớ `taiTuSuaLoi` mà Lộ trình đã tải cho số cần sửa (không thêm lượt gọi máy chủ);
 *  cùng hàm dựng ngày với màn Tự sửa lỗi ⇒ cùng con số. 0 ⇒ xong hôm nay (nút ✓). Chưa dựng được ⇒ null. */
function useConSuaHomNay(token: string | undefined, bat: boolean, nho: number[] | null): { con: number | null | undefined; phan: number | null | undefined; xong: number | null | undefined; mod: ModViec | null } {
  const [kq, setKq] = useState<KetQuaDanhSachChua | null>(() => (token ? docNhoTuSua(token) : null))
  const [mod, setMod] = useState<ModViec | null>(null)
  useEffect(() => {
    if (!bat) return
    let huy = false
    void import('./ManTuChua').then((m) => { if (!huy) setMod(m) }).catch(() => {})
    return () => { huy = true }
  }, [bat])
  useEffect(() => {
    if (!token) return
    setKq(docNhoTuSua(token))
    return ngheTuSua((t, moi) => { if (t === token) setKq(moi) })
  }, [token])
  // 29/10: em vừa sửa xong một câu ⇒ dựng lại việc hôm nay NGAY từ nhật ký trên máy (bản sao danh sách ⇒ vẽ lại)
  useEffect(() => mod?.ngheXongSua?.(() => setKq((k) => k && { ...k } as KetQuaDanhSachChua)), [mod])
  const r = useMemo(() => { const sbd = mod?.docSbdHs(); return mod && bat && sbd ? mod.dungViecHomNay(kq, Date.now(), sbd) : null }, [kq, mod, bat])
  useEffect(() => { if (r && mod) mod.luuViecHomNay(r.luu, r.day ?? null) }, [r, mod])
  // 29/10: câu chưa xong đầu tiên của Việc hôm nay ⇒ mở sẵn ở máy chủ khi Lộ trình đã yên (nap-truoc-sua.ts).
  const tiepNap = r?.viec?.tiep?.m.qid
  useEffect(() => {
    if (!mod || !token || !tiepNap) return
    // 02/11 khuya (thầy «chỗ đó bấm vào phải tức thì» — lần bấm đầu sau khi mở app còn chờ): 2,5 s → 0,6 s, em bấm ngay vẫn có câu đầu sẵn
    const h = setTimeout(() => mod.napTruocCauSua?.(token, tiepNap), 600)
    return () => clearTimeout(h)
  }, [mod, token, tiepNap])
  // 31/10 (thầy «làm cả cho tự sửa lỗi»): Lộ trình yên ⇒ TẢI SẴN cả phần Sửa lỗi hôm nay chưa xong (một lượt) + gửi lại lần nộp chờ từ lúc mất mạng.
  // Hẹn 3–15 giây ngẫu nhiên: cả lớp mở app cùng lúc không dồn lượt mở câu vào D1 trong cùng một giây.
  const conLaiSua = r?.viec?.muc?.filter((x) => !x.xong && !x.m.kiemHoiThay).map((x) => x.m.qid).join('|') ?? ''
  // 31/10 (thầy «hs mở app lên là mọi thứ sẵn rồi»; server/src/goi-sua-dem.ts): GÓI ĐÓNG SẴN cả phần hôm nay ⇒ hỏi NGAY khi Lộ trình hiện (một lượt rẻ: R2 + một câu đọc D1).
  useEffect(() => {
    if (!mod || !token) return
    const h = setTimeout(() => { void mod.napGoiSuaDem?.(token) }, 300)
    return () => clearTimeout(h)
  }, [mod, token])
  useEffect(() => {
    if (!mod || !token || !conLaiSua) return
    const h = setTimeout(() => { void mod.guiLaiSuaCho?.(token); void Promise.resolve(mod.napGoiSuaDem?.(token)).finally(() => mod.napTruocSuaNgay?.(token, conLaiSua.split('|'))) }, 3000 + Math.random() * 12_000)
    return () => clearTimeout(h)
  }, [mod, token, conLaiSua])
  // undefined = mảnh chưa nạp (chưa vẽ số, khỏi nháy 12 → 9); null = không dựng được việc hôm nay
  // phan = câu PHẦN NGÀY (12 câu đầu) chưa xong — khoá chặng sau nút Sửa lỗi (28/10); «Sửa thêm 1 chặng» không làm khoá lại · xong = câu đã sửa xong hôm nay
  const viec = r?.viec
  if (mod && viec) return { con: mod.conSuaHomNay(viec), phan: mod.conSuaPhanNgay(viec), xong: viec.xong, mod }
  // 28/10 (video thầy «hai thẻ dưới load bị khựng»): chưa có danh sách (tải lại trang) ⇒ số nhớ trên máy của hôm nay — nút ✓ / số đúng ngay lần vẽ đầu
  if (nho) return { con: nho[1], phan: nho[2], xong: nho[3], mod }
  return bat && !mod ? { con: undefined, phan: undefined, xong: undefined, mod } : { con: null, phan: null, xong: null, mod }
}
/** 28/10 (video thầy «hai thẻ dưới load bị khựng»): bản nhớ phiên mất khi tải lại ⇒ Lộ trình vẽ lần đầu THIẾU nút Tự sửa lỗi, số về mới chèn nút (đường nhảy,
 *  trang giật). Nhớ trên máy số của HÔM NAY theo phiên: [câu cần sửa, còn phải sửa hôm nay, phần ngày chưa xong, đã sửa xong hôm nay]. */
const KHOA_SUA_NHO = 'ddh.sua-nho'
const docSuaNho = (tk?: string): number[] | null => {
  try { const o = JSON.parse(localStorage.getItem(KHOA_SUA_NHO) || '0'); return tk && o.t === tk.slice(-16) && o.n === ngayVn(Date.now()) ? o.s : null } catch { return null }
}

/** Phần của cổng HocTapHomNay mà Luyện tập / Thành tích cần (truyền nguyên props cổng — không thêm lệnh, không thêm số). */
export interface HsTrong { lop?: string; onXemLai: () => void; onTuLuyen: () => void; onLichSu: () => void; onKetQua?: () => void; onLuyenLai?: () => void }
/** Một nút trên con đường chặng (Lộ trình). `x` = độ lệch ngang (px) để đường uốn như bản vẽ. */
type Nut = { k: string; loai: 'hoc' | 'kiem' | 'sua' | 'bt'; tt: 'xong' | 'dang' | 'khoa' | 'mo'; dem?: number; cau?: number; bong?: string; vong?: number; soDoan?: number; daDoan?: number; khoaVong?: string; ten: string; pop: Pop }
/** Thẻ bật ra khi bấm một nút Lộ trình (thầy 27/10, ảnh Duolingo «bấm vào hiện như thế này»): tiêu đề · dòng phụ · nút việc chính (không có ⇒ chỉ thông tin). */
type Pop = { tieu: string; phu: string; nut?: { chu: string; onClick?: () => void; tat?: boolean } }
const HINH_NUT: Record<Nut['loai'], LucideIcon> = { hoc: Play, kiem: FlaskConical, sua: Wrench, bt: PenLine }

/** F2/F3 — nhớ trên máy số chặng đã xong hôm nay (giờ VN): lần mở Lộ trình kế tiếp thấy THÊM đúng một chặng ⇒ chặng đó «vừa xong». Không bao giờ ghi lùi
 *  (bản Sảnh đệm cũ vẽ trước bản mới không làm chạy lại hiệu ứng). Trả chỉ số chặng vừa xong hoặc null. */
const KHOA_LO_TRINH = 'ddh.lo-trinh'
/** MỐC CHÈN Tự sửa lỗi = số chặng đứng TRƯỚC nút (thầy 27/10 «sửa lỗi chèn vào giữa hành trình mới»). Giả định: một nút Tự sửa lỗi / ngày; tính MỘT lần mỗi
 *  ngày từ chỗ em đang học (d = số chặng đã xong) rồi nhớ trên máy để nút không trôi theo em: còn ≥ 3 chặng mới ⇒ sau chặng mới thứ 2 (d + 2); còn 1–2 ⇒ sau
 *  chặng mới đầu tiên (d + 1); hết chặng ⇒ cuối đường. Số chặng hôm nay đổi ⇒ tính lại. Không đọc / ghi được bộ nhớ máy ⇒ tính theo chỗ hiện tại. */
const KHOA_MOC_SUA = 'ddh.moc-sua'
export function mocSuaHomNay(tong: number, xong: number): number {
  const ngay = ngayVn(Date.now()), con = tong - xong, moi = con <= 0 ? tong : con <= 2 ? xong + 1 : xong + 2
  try {
    const cu = JSON.parse(localStorage.getItem(KHOA_MOC_SUA) || 'null') as { ngay?: string; tong?: number; sau?: number } | null
    if (cu && cu.ngay === ngay && cu.tong === tong && typeof cu.sau === 'number') return Math.min(tong, cu.sau)
    localStorage.setItem(KHOA_MOC_SUA, JSON.stringify({ ngay, tong, sau: moi }))
  } catch { /* bộ nhớ máy không dùng được: tính theo chỗ hiện tại */ }
  return moi
}
/** id Kiểm tra ôn tập đang khoá chặng (để biết lúc quay về sau khi nộp mà chạy hiệu ứng mở khoá một lần). */
const KHOA_KT_MO = 'ddh.kt-khoa'
/** Ngày VN Lộ trình đang khoá chặng sau nút Tự sửa lỗi (28/10) — lúc phần ngày xong thì chạy vỡ khoá một lần. */
const KHOA_SUA_MO = 'ddh.sua-khoa'
function changVuaXong(xong: number, tong: number): number | null {
  if (!tong) return null
  const ngay = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10)
  let cu: { ngay?: string; tong?: number; xong?: number } | null = null
  try { cu = JSON.parse(localStorage.getItem(KHOA_LO_TRINH) || 'null') } catch { /* bộ nhớ máy không đọc được: bỏ hiệu ứng */ }
  const cung = !!cu && cu.ngay === ngay && cu.tong === tong
  if (cung && typeof cu!.xong === 'number' && xong < cu!.xong) return null
  try { localStorage.setItem(KHOA_LO_TRINH, JSON.stringify({ ngay, tong, xong })) } catch { /* không lưu được: lần sau không có hiệu ứng */ }
  return cung && xong === (cu!.xong ?? -1) + 1 ? xong - 1 : null
}

/** CON ĐƯỜNG CHẶNG (bản vẽ dm-1/2/3, thầy chốt 26/10): nút lục giác nổi khối, nối bằng đường chấm mềm (vẽ theo vị trí thật của nút).
 *  Hiệu ứng (HIEU-UNG.md F): F1 nút hiện tại phồng thở + bong bóng nhún (CSS) · F2 chặng vừa xong: vòng lan + sao bay · F3 chặng mới mở: khoá tinh thể vỡ
 *  · F4 tự cuộn mượt tới nút hiện tại khi nút nằm ngoài khung nhìn. */
/** RƯƠNG VÀNG (thầy 02/11 khuya: «sửa thành rương màu vàng như thế này nhé, vẽ lại cho đẹp hơn» — mẫu = rương ngày cũ của màn Nhiệm vụ).
 *  Thân vàng cam đổ bóng, đai vàng giữa có ánh, viền đồng, nắp vòm có vệt sáng, ổ khoá ngọc; mở ⇒ nắp bật nghiêng (lớp .rg-nap — bộ ăn mừng xoay đúng lớp này),
 *  lộ quầng vàng + 3 tinh thể lục giác. Màu chỉ biến --tr-*. */
function Ruong({ mo }: { mo?: boolean }) {
  const u = useId().replace(/[^a-zA-Z0-9]/g, '')
  // khung cắt sát rương ĐÓNG (y 14–100) ⇒ rương nằm chính giữa thẻ (thầy 02/11 «Rương nằm chưa chính giữa»); nắp mở tràn lên trên (overflow: visible)
  return <svg className="rv" viewBox="0 14 120 86" aria-hidden="true">
    <defs>
      <linearGradient id={`${u}t`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" className="rv-t0" /><stop offset="1" className="rv-t1" /></linearGradient>
      <linearGradient id={`${u}n`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" className="rv-n0" /><stop offset="1" className="rv-n1" /></linearGradient>
      <radialGradient id={`${u}q`} cy=".7"><stop offset="0" className="rv-q" stopOpacity=".9" /><stop offset="1" className="rv-q" stopOpacity="0" /></radialGradient>
    </defs>
    <ellipse className="rv-bong" cx="60" cy="94" rx="46" ry="5" />
    {mo && <><ellipse cx="60" cy="40" rx="40" ry="26" fill={`url(#${u}q)`} />
      <g className="rv-tt"><path d="M60 22l9 5v10l-9 5-9-5V27z" /><path d="M41 32l6 3.5v7L41 46l-6-3.5v-7z" opacity=".85" /><path d="M79 32l6 3.5v7L79 46l-6-3.5v-7z" opacity=".85" /></g>
      <path className="rv-tt-sang" d="M60 22l9 5-9 5-9-5z" /></>}
    <rect x="14" y="44" width="92" height="46" rx="9" fill={`url(#${u}t)`} />
    <rect x="14" y="44" width="92" height="10" className="rv-mieng" />
    <rect x="52" y="44" width="16" height="46" className="rv-dai" /><rect x="54" y="47" width="4" height="40" rx="2" className="rv-anh" />
    <rect x="14" y="44" width="92" height="46" rx="9" className="rv-vien" />
    {!mo && <g transform="translate(60 63)"><rect x="-9" y="-10" width="18" height="18" rx="4" className="rv-khoa" /><path d="M0-5l4 3.5L0 4l-4-6.5z" className="rv-ngoc" /></g>}
    <g className="rg-nap">
      <path d="M14 44V32a14 14 0 0 1 14-14h64a14 14 0 0 1 14 14v12z" fill={`url(#${u}n)`} />
      <rect x="52" y="18" width="16" height="26" className="rv-dai" />
      <path d="M14 44V32a14 14 0 0 1 14-14h64a14 14 0 0 1 14 14v12z" className="rv-vien" />
      <path d="M26 27h20" className="rv-vet" />
    </g>
  </svg>
}
/** Vòng tiến độ quanh nút HIỆN TẠI (thầy 27/10, ảnh Duolingo; «làm sát lại, tinh tế hơn»): bốn đoạn đầu tròn, khe nhỏ, ôm sát nút, nền xám
 *  rất nhạt; phần đã làm cùng màu nút, tô dần 0 → tỉ lệ thật lúc mở (mặt nạ stroke-dashoffset, 500 ms ease-out). Không có số ⇒ vòng xám nguyên.
 *  31/10 (thầy «vòng bị lệch, muốn khít cân đối»): cỡ / tâm / nét ở trong-hs.css (vòng đặt đúng tâm khối mặt + đáy, khe đều ~5 px mọi phía). */
// khe giữa hai đoạn theo đơn vị khung 116 — CHUNG cho vòng 4 đoạn và vòng đoạn theo câu (nét 5,7 đầu tròn ⇒ khe nhìn thấy ~3 px ở vòng 102 px)
const CV = 2 * Math.PI * 54, KHE = 9
/** `so` = số đoạn (mặc định 4). Nút Kiểm tra ôn tập (28/10): MỖI CHẶNG MỘT ĐOẠN, `pt` = chặng đã chốt / tổng ⇒ tô trọn đúng số đoạn (mặt nạ dừng giữa khe).
 *  `da` (thầy 30/10 «chặng đó bao nhiêu câu thì chia thành bấy nhiêu đoạn, xong câu nào thì đoạn câu đó đồng bộ tức thì tô màu, làm khít lại, hiệu ứng tinh
 *  tế hơn») ⇒ vòng ĐOẠN: `so` đoạn = số câu, `da` đoạn đầu tô trọn; đoạn VỪA xong kể từ lần vẽ trước (nhớ theo `khoa` trong phiên trình duyệt) vẽ dần + sáng
 *  nhẹ, đoạn cũ hiện ngay. */
function VongChang({ pt, so = 4, da, khoa }: { pt?: number; so?: number; da?: number; khoa?: string }) {
  // useId TRƯỚC lệnh return sớm (dọn mã 02/11, luật rules-of-hooks): `da` đổi từ vắng → có trên cùng một vòng thì số hook giữa hai lần vẽ lệch ⇒ React sập màn.
  const maId = useId()
  if (da !== undefined) return <VongDoan so={so} da={da} khoa={khoa} />
  const L = Math.max(0, Math.min(100, pt ?? 0)) / 100 * CV, DOAN = CV / Math.max(2, Math.min(8, so))
  const id = `da-vm${maId.replace(/[^a-zA-Z0-9]/g, '')}`
  const doan = { cx: 58, cy: 58, r: 54, strokeDasharray: `${DOAN - KHE} ${KHE}`, strokeDashoffset: DOAN - KHE / 2 }
  return <svg className="da-vong" viewBox="0 0 116 116" aria-hidden="true">
    {L > 0 && <mask id={id}><circle className="mo" cx="58" cy="58" r="54" strokeDasharray={`${L} ${CV}`} style={{ '--L': `${L}` } as CSSProperties} /></mask>}
    <circle className="nen" {...doan} />
    {L > 0 && <circle className="chay" {...doan} mask={`url(#${id})`} />}</svg>
}

function VongDoan({ so, da, khoa }: { so: number; da: number; khoa?: string }) {
  const n = Math.max(1, Math.min(12, Math.round(so))), d = Math.max(0, Math.min(n, Math.round(da)))
  const doan = CV / n, cung = Math.max(4, doan - (n > 1 ? KHE : 0))
  // đoạn tô MỚI kể từ lần vẽ trước: lần đầu trong phiên ⇒ không hiệu ứng (hiện ngay); quay về Lộ trình sau khi làm câu ⇒ chỉ các đoạn mới chạy
  // mốc giữ nguyên qua các lần vẽ lại cùng số câu (màn còn vẽ lại sau khi hiện — mất mốc là mất hiệu ứng), đổi khi số câu đổi
  const moc = useRef<{ d: number; tu: number } | null>(null)
  if (moc.current === null) { let v = d; try { const x = khoa ? sessionStorage.getItem(khoa) : null; if (x !== null && Number(x) >= 0 && Number(x) < d) v = Number(x) } catch { /* bỏ qua */ } moc.current = { d, tu: v } }
  else if (moc.current.d !== d) moc.current = { d, tu: Math.min(moc.current.d, d) }
  const tu = moc.current.tu
  useEffect(() => { try { if (khoa) sessionStorage.setItem(khoa, String(d)) } catch { /* bỏ qua */ } }, [khoa, d])
  return <svg className="da-vong" data-doan="" viewBox="0 0 116 116" aria-hidden="true">
    {Array.from({ length: n }, (_, i) => {
      const moi = i < d && i >= tu
      return <circle key={i} className={i < d ? 'chay' : 'nen'} data-moi={moi || undefined} cx="58" cy="58" r="54" strokeDasharray={`${cung} ${CV}`}
        strokeDashoffset={-(i * doan + (n > 1 ? KHE / 2 : 0))} style={moi ? { '--tre': `${(i - tu) * 160}ms` } as CSSProperties : undefined} />
    })}
  </svg>
}

/** Viền bánh quy 12 múi (hình logo app học sinh, M3 Expressive) — chuỗi path tính sẵn một lần. */
const BANH_12 = Array.from({ length: 121 }, (_, i) => { const t = (i / 120) * 2 * Math.PI, r = 50 * (1 + 0.075 * Math.cos(12 * t)) / 1.075; return `${i ? 'L' : 'M'}${(50 + r * Math.cos(t)).toFixed(1)} ${(50 + r * Math.sin(t)).toFixed(1)}` }).join('') + 'Z'
/** Chữ cái đầu tên (ảnh đại diện) — «Nguyễn Minh Anh» ⇒ «MA»; trống ⇒ «Em». */
const chuCaiTen = (t?: string) => { const w = (t || '').trim().split(/\s+/).filter(Boolean); return w.length ? w.slice(-2).map((x) => x[0]!.toUpperCase()).join('') : 'Em' }
/** «Thứ Hai 02/11» theo giờ VN. */
const ngayTuan = () => { const d = new Date(Date.now() + VN); return `${THU[d.getUTCDay()]} ${hai(d.getUTCDate())}/${hai(d.getUTCMonth() + 1)}` }
const SAC_POP: Record<Nut['loai'], string> = { hoc: 'hs', kiem: 'tin', sua: 'sai', bt: 'chu-y' }
/** Tên dòng của một nút: chặng ⇒ «Chặng n» (thẻ bật ra cũ để tên bài), còn lại tên việc. Dòng phụ bỏ «Chặng n / m · » đứng đầu (đã ở tên). */
const tenDong = (n: Nut, so: number) => n.loai === 'hoc' ? `Chặng ${so}` : n.dem && n.tt !== 'xong' ? `${n.pop.tieu} · ${n.dem} câu` : n.pop.tieu
/** Dòng phụ như bản vẽ: chặng xong ⇒ «6 câu» · chặng đang học ⇒ «Học tiếp · còn 4 câu» · còn lại = lời thẻ bật ra cũ (bỏ «Chặng n / m · » đầu dòng). */
const phuDong = (n: Nut) => {
  const p = n.pop.phu.replace(/^Chặng \d+ \/ \d+ · /, '')
  if (n.loai === 'hoc' && n.tt === 'xong' && n.cau) return `${n.cau} câu`
  if (n.loai === 'hoc' && n.tt === 'dang' && /^\d+ câu$/.test(p)) return `${n.bong ?? 'Học tiếp'} · còn ${p}`
  return p
}

/** BÌNH TAM GIÁC «MỨC HÔM NAY» (hệ Kính, thầy chốt 02/11 — docs/ban-ve-ban-sac-hs-0211/v2): dung dịch dâng theo câu đã làm; vạch chia = ranh chặng,
 *  vạch đứt = mức; tới mức ⇒ hồng (phenolphtalein tới điểm tương đương). Màu chỉ biến --tr-*.
 *  SINH ĐỘNG (thầy 02/11 tối, docs/ban-ve-binh-0211): nghiêng máy ⇒ dung dịch nghiêng theo (src/lib/binh-nghieng.ts, nạp lúc rảnh, vòng vẽ tự dừng);
 *  đổi hồng ⇒ HÀO QUANG hồng dịu nở một lần mỗi ngày (CSS, chạy hữu hạn) rồi giữ quầng dịu + 3 sao nhỏ. Không hoạt ảnh vô hạn. */
const KHOA_BINH_HONG = 'ddh.binh-hong'
export function BinhHomNay({ da, muc, ranh }: { da: number; muc: number; ranh: number[] }) {
  const u = useId().replace(/[^a-zA-Z0-9]/g, ''), du = muc > 0 && da >= muc
  const DAY = 214, MUC = 98, y = muc > 0 ? DAY - (Math.min(da, muc * 1.3) / muc) * (DAY - MUC) : DAY
  const xP = (v: number) => 118 + Math.max(0, v - 74) * (56 / 122), xT = (v: number) => 82 - Math.max(0, v - 74) * (56 / 122)
  const vo = 'M84 18V74L28 190Q20 208 36 214Q44 217 54 217H146Q156 217 164 214Q180 208 172 190L116 74V18Z'
  const f = (n: number) => n.toFixed(1)
  const dd = useRef<SVGGElement>(null), mucY = useRef(y), binh = useRef<SVGSVGElement>(null)
  useEffect(() => { mucY.current = y }, [y])
  // hào quang nở MỘT lần mỗi ngày (nhớ trong máy; gắn data-no thẳng lên SVG — không vẽ lại React); lần sau trong ngày chỉ hiện quầng dịu tĩnh
  useEffect(() => {
    if (!du) return
    try { const h = new Date().toDateString(); if (localStorage.getItem(KHOA_BINH_HONG) !== h) { localStorage.setItem(KHOA_BINH_HONG, h); binh.current?.setAttribute('data-no', '') } } catch { /* không có bộ nhớ: không nở */ }
  }, [du])
  // nghiêng theo máy: mã cảm biến nằm trong mảnh Hôm nay (đã nạp lười, không thêm tệp precache — trần 170); bật lúc rảnh, sau lần vẽ đầu
  useEffect(() => {
    const g = dd.current
    if (!g || typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) return
    let go: (() => void) | undefined
    const ri = (window as Window & { requestIdleCallback?: (f: () => void) => number; cancelIdleCallback?: (h: number) => void })
    const bat = () => { go = ganNghieng(g, () => [100, mucY.current], { tatDan: document.documentElement.classList.contains('may-yeu') || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches }) }
    const h = ri.requestIdleCallback ? ri.requestIdleCallback(bat) : window.setTimeout(bat, 1200)
    return () => { if (ri.cancelIdleCallback) ri.cancelIdleCallback(h); else window.clearTimeout(h); go?.() }
  }, [])
  return <svg ref={binh} className="kb-binh" data-du={du || undefined} viewBox="0 0 200 236" aria-hidden="true">
    <defs>
      <clipPath id={`${u}c`}><path d={vo} /></clipPath>
      <linearGradient id={`${u}k`} x1="0" x2="1"><stop offset="0" className="kb-k0" /><stop offset=".45" className="kb-k1" /><stop offset="1" className="kb-k2" /></linearGradient>
      <linearGradient id={`${u}l`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" className="kb-l0" /><stop offset="1" className="kb-l1" /></linearGradient>
      <radialGradient id={`${u}b`} cx=".35" cy=".35" r=".7"><stop offset="0" className="kb-b0" /><stop offset="1" className="kb-b1" /></radialGradient>
      <radialGradient id={`${u}q`} cy=".58"><stop offset="0" className="kb-q" stopOpacity=".4" /><stop offset=".55" className="kb-q" stopOpacity=".12" /><stop offset="1" className="kb-q" stopOpacity="0" /></radialGradient>
      <radialGradient id={`${u}v`}><stop offset=".55" className="kb-q" stopOpacity="0" /><stop offset=".8" className="kb-q" stopOpacity=".18" /><stop offset="1" className="kb-q" stopOpacity="0" /></radialGradient>
    </defs>
    {du && <g className="kb-hao"><ellipse cx="100" cy="150" rx="100" ry="90" fill={`url(#${u}q)`} /><circle className="kb-vanh" cx="100" cy="146" r="92" fill={`url(#${u}v)`} /></g>}
    <ellipse className="kb-bong" cx="100" cy="226" rx="74" ry="7" />
    <path d={vo} fill={`url(#${u}k)`} />
    <g clipPath={`url(#${u}c)`}>
      <g ref={dd}>
        <rect x="-120" y={f(y)} width="440" height="260" fill={`url(#${u}l)`} />
        <ellipse className="kb-khum" cx="100" cy={f(y)} rx={f((xP(y) - xT(y)) / 2 + 30)} ry="4.5" />
        {[[70, 200, 6], [118, 190, 4], [138, 204, 5], [92, 178, 3], [108, 206, 2.5], [150, 186, 2.5]].map(([bx, by, r]) => by! > y + 9 ? <circle key={bx} cx={bx} cy={by} r={r} fill={`url(#${u}b)`} /> : null)}
      </g>
    </g>
    {muc > 0 && ranh.filter((n) => n > 0 && n < muc).map((n) => { const v = DAY - (n / muc) * (DAY - MUC); return <line key={n} className="kb-vach" x1={f(xP(v) - 18)} x2={f(xP(v) - 5)} y1={f(v)} y2={f(v)} /> })}
    <line className="kb-muc" x1={f(xT(MUC) + 5)} x2={f(xP(MUC) - 5)} y1={MUC} y2={MUC} />
    <path className="kb-vo" d={vo} />
    <rect className="kb-mieng" x="78" y="10" width="44" height="11" rx="5.5" />
    <path className="kb-loe" d="M91 28V76M76 104L46 168M42 182L39 189" />
    {du && <g className="kb-sao">{[[166, 64, .8], [32, 100, .55], [176, 150, .45]].map(([x, yy, c]) => <path key={x} transform={`translate(${x} ${yy}) scale(${c})`} d="M0-8C1-2 2-1 8 0C2 1 1 2 0 8C-1 2-2 1-8 0C-2-1-1-2 0-8Z" />)}</g>}
  </svg>
}

/** VIỆC HÔM NAY (hệ Kính — thay con đường nút tròn): mỗi nút cũ thành MỘT DÒNG ô tích theo ĐÚNG thứ tự và khoá cũ (tuần tự từ trên xuống, thầy 29/10).
 *  Chạm dòng ⇒ THẺ BẬT RA như con đường cũ (thầy 27/10 «không vào thẳng»: tên việc, lý do, nút việc chính); dòng khoá ⇒ thẻ nói lý do. Giữ hiệu ứng: chặng vừa xong (sao bay),
 *  vỡ khoá lần lượt sau khi nộp Kiểm tra ôn tập / sửa xong lỗi, rương mở (anMung). Không vẽ đường / linh vật cạnh đường nữa. */
/** THẺ BẬT RA dưới nút (thầy 27/10): rộng gần hết màn (lề 16 px, tối đa 440), mũi nhọn chỉ đúng tâm nút; gần đáy màn ⇒ bật LÊN TRÊN nút. Vẽ vào <body>
 *  (position: fixed, trên dải thẻ ghim) ⇒ không bị khung nào cắt. Chạm ra ngoài / cuộn / đổi khổ / Esc ⇒ đóng; Esc trả focus về nút. */
function TheNut({ id, sac, pop, mo, onDong }: { id: string; sac: string; pop: Pop; mo: HTMLElement; onDong: (traFocus: boolean) => void }) {
  const the = useRef<HTMLDivElement>(null)
  const dat = useRef<() => void>(() => {})
  useLayoutEffect(() => {
    const t = the.current
    if (!t) return
    let goc0 = mo.getBoundingClientRect().top
    // cuộn nhỏ (trình duyệt đưa nút vào khung, cuộn mượt đang dừng) ⇒ thẻ đi theo nút; cuộn hẳn (> 40 px) ⇒ đóng
    dat.current = () => { if (Math.abs(mo.getBoundingClientRect().top - goc0) > 40) onDong(false); else datCho() }
    const datCho = () => {
      const r = mo.getBoundingClientRect(), vw = document.documentElement.clientWidth || window.innerWidth, vh = window.innerHeight
      const w = Math.min(vw - 32, 440), cx = r.left + r.width / 2, left = Math.max(16, Math.min(vw - 16 - w, cx - w / 2))
      t.style.width = `${w}px`; t.style.left = `${left}px`
      t.style.setProperty('--ox', `${Math.max(24, Math.min(w - 24, cx - left))}px`)
      const h = t.offsetHeight, duoi = r.bottom + 14, tren = r.top - 14 - h
      const lenTren = duoi + h > vh - 12 && tren >= 8
      t.toggleAttribute('data-tren', lenTren)
      t.style.top = `${lenTren ? tren : duoi}px`
    }
    datCho()
    // khổ thấp (điện thoại ngang): trên / dưới nút đều không đủ chỗ ⇒ cuộn khung NGAY (không mượt) cho thẻ nằm trọn dưới nút, rồi đặt lại
    const r = mo.getBoundingClientRect(), du = r.bottom + 14 + t.offsetHeight - (window.innerHeight - 12)
    if (du > 0 && !t.hasAttribute('data-tren')) {
      let k: Element | null = mo.parentElement
      while (k && !(/(auto|scroll)/.test(getComputedStyle(k).overflowY) && k.scrollHeight > k.clientHeight)) k = k.parentElement
      ;(k ?? document.scrollingElement)?.scrollBy?.({ top: Math.min(du, r.top - 8), behavior: 'instant' as ScrollBehavior })
      goc0 = mo.getBoundingClientRect().top
      datCho()
    }
    ;(t.querySelector<HTMLElement>('.da-pop-nut:not(:disabled)') ?? t).focus({ preventScroll: true })
  }, [mo]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const ngoai = (e: Event) => { const x = e.target as Node; if (!the.current?.contains(x) && !mo.contains(x)) onDong(false) }
    const dong = () => onDong(false), cuon = () => dat.current()
    const phim = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); onDong(true) } }
    document.addEventListener('pointerdown', ngoai, true)
    window.addEventListener('scroll', cuon, true)
    window.addEventListener('resize', dong)
    document.addEventListener('keydown', phim)
    return () => { document.removeEventListener('pointerdown', ngoai, true); window.removeEventListener('scroll', cuon, true); window.removeEventListener('resize', dong); document.removeEventListener('keydown', phim) }
  }, [mo, onDong])
  const n = pop.nut
  return createPortal(<div ref={the} id={id} className="da-pop" data-sac={sac} role="dialog" aria-label={pop.tieu} tabIndex={-1}>
    <b className="da-pop-tieu">{pop.tieu}</b><span className="da-pop-phu">{pop.phu}</span>
    {n && <button type="button" className="da-pop-nut" disabled={n.tat || !n.onClick} onClick={() => { onDong(false); n.onClick?.() }}>{n.chu}</button>}
  </div>, document.body)
}
/** RƯƠNG HÔM NAY — MỘT rương duy nhất (thầy 02/11 khuya: «để rương ở ngoài thôi, rương bên trong bỏ đi»): có hệ thưởng ⇒ đây là RƯƠNG NGÀY thật (xong cả
 *  nhiệm vụ hôm nay ⇒ chạm mở, máy chủ cộng tinh thể — /hs/thuong/mo-ruong), chữ như thẻ cũ của màn Nhiệm vụ; không có hệ thưởng ⇒ rương trang trí theo chặng như cũ.
 *  Rương ĐÃ MỞ: thẻ tĩnh, chạm không chạy hiệu ứng nữa (thầy «mở rồi thì không còn hiệu ứng khi bấm vào nữa»). Chưa sáng ⇒ chạm hiện bảng nhắc. */
const khoaRuong = () => `ddh.ruong-mo.${new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10)}`
export function TheRuong({ ds, token, tq, onNhiemVu }: { ds: Nut[]; token?: string; tq?: TongQuanThuong | null; onNhiemVu?: () => void }) {
  const chang = ds.filter((n) => n.k.startsWith('c')), soChang = chang.length, soXongC = chang.filter((n) => n.tt === 'xong').length
  const [mo, setMo] = useState<HTMLElement | null>(null)
  const [daMoNho, setDaMoNho] = useState(() => { try { return localStorage.getItem(khoaRuong()) === '1' } catch { return false } })
  const [dangMo, setDangMo] = useState(false)
  const [loi, setLoi] = useState('')
  const dong = useRef((traFocus: boolean) => setMo((m) => { if (traFocus) m?.focus(); return null })).current
  const dangBung = useRef(false)
  const nv = tq?.nhiemVu ?? [], r = tq?.ruong, thuong = !!(token && r && nv.length)
  const soXongNv = nv.filter((x) => x.xong).length
  const sang = thuong ? soXongNv === nv.length : soChang > 0 && soXongC === soChang
  const daMo = thuong ? !!r!.mo || daMoNho : sang && daMoNho
  if (!thuong && soChang < 2) return null
  const tt = <>{'\u00a0'}·{'\u00a0'}+{r?.thuong}{'\u00a0'}<IcTinhThe /></>
  const tieu = daMo ? (thuong ? <>Rương đã mở{tt}</> : 'Rương đã mở') : 'Rương hôm nay'
  const phu = loi || (thuong
    ? (daMo ? `Hẹn em mai với ${nv.length} nhiệm vụ mới.` : sang ? 'Rương đã sáng · chạm để mở!' : `Xong cả ${nv.length} nhiệm vụ để mở rương · còn ${nv.length - soXongNv}`)
    : (daMo ? `Xong cả ${soChang} chặng hôm nay` : sang ? 'Rương đã sáng · chạm để mở!' : `Rương sáng lên khi em xong cả ${soChang} chặng hôm nay · còn ${soChang - soXongC} chặng`))
  const ghiNho = () => { setDaMoNho(true); try { localStorage.setItem(khoaRuong(), '1') } catch { /* máy chặn ⇒ chỉ nhớ trong phiên */ } }
  // Hiệu ứng chạy TRÊN NÚT ĐANG CÓ: chỉ chuyển sang thẻ tĩnh (đổi phần tử) khi hiệu ứng đã xong — đổi ngay thì nút bị gỡ, hiệu ứng đo vị trí phần tử đã gỡ
  // ⇒ nổ ở góc màn (lỗi bắt được ở ảnh chụp 02/11). Đang nổ ⇒ chạm thêm không chạy lại.
  const bung = (nut: HTMLElement, sau: () => void) => {
    if (dangBung.current) return
    dangBung.current = true
    const co = kichRuong({ duMo: true, cham: true })
    if (co) anMung('ruong', { goc: nut.querySelector('.kb-ruong') ?? nut, nap: nut.querySelector('.rg-nap'), rung: true })
    window.setTimeout(sau, co ? 2400 : 0)
  }
  const cham1 = async (nut: HTMLButtonElement) => {
    if (dangBung.current) return
    cham()
    if (!sang) { setMo(mo ? null : nut); return }
    if (!thuong) { bung(nut, ghiNho); return }
    if (dangMo) return
    setDangMo(true); setLoi('')
    const kq = await moRuong(token!)
    setDangMo(false)
    if (!kq.ok) { setLoi(kq.chu || 'Chưa mở được rương, em thử lại nhé.'); return }
    bung(nut, () => { ghiNho(); void capNhatTongQuan(token!) })
  }
  const ba = thuong && <span className="kb-ba-cham" role="img" aria-label={`Đã xong ${soXongNv}/${nv.length} nhiệm vụ`}>{nv.map((x) => <i key={x.ma} data-x={x.xong || undefined} />)}</span>
  const ruot = <>
    <span className="kb-ruong" aria-hidden="true"><Ruong mo={daMo} /></span>
    <span className="kb-giua"><b>{tieu}</b><span className="kb-phu">{phu}</span>{ba}</span>
  </>
  // đã mở ⇒ thẻ tĩnh (không phải nút): chạm không làm gì
  if (daMo) return <section className="kb-the-ruong" data-mo="" data-da-mo="" aria-label={thuong ? `Rương đã mở, cộng ${r!.thuong} tinh thể` : 'Rương hôm nay đã mở'}>{ruot}</section>
  return <><button type="button" className="kb-the-ruong da-ruong-nut" data-mo={sang || undefined} disabled={dangMo}
    aria-label={sang ? 'Mở rương hôm nay' : 'Rương hôm nay'} {...(sang ? {} : { 'aria-haspopup': 'dialog' as const, 'aria-expanded': !!mo, 'aria-controls': mo ? 'da-pop-ruong' : undefined })}
    onClick={(e) => void cham1(e.currentTarget)}>
    {ruot}
    {sang ? <span className="kb-mo-ruong" aria-hidden="true">{dangMo ? '…' : 'Mở'}</span> : <ChevronRight size={20} aria-hidden="true" />}
  </button>
  {mo && !sang && <TheNut id="da-pop-ruong" sac="sao" mo={mo} onDong={dong} pop={{ tieu: 'Rương hôm nay', phu, nut: thuong && onNhiemVu ? { chu: 'Xem nhiệm vụ', onClick: onNhiemVu } : undefined }} />}</>
}

/** màu THẺ BẬT RA giữ đúng như con đường cũ (thầy 05/10 «giữ nguyên mọi màu sắc»): chặng xanh · kiểm tra lam · sửa đỏ · bài tập vàng */
const SAC_THE: Record<Nut['loai'], string> = { hoc: 'dung', kiem: 'tin', sua: 'sai', bt: 'chu-y' }
function DanhSachViec({ ds, moKhoa, moDi }: { ds: Nut[]; moKhoa?: 'kt' | 'sua'; moDi?: boolean }) {
  const goc = useRef<HTMLOListElement>(null)
  const [vua, setVua] = useState<number | null>(null)
  // chỉ MỘT thẻ mở một lúc: k của dòng đang mở + phần tử dòng (đặt thẻ, trả focus khi Esc)
  const [moThe, setMoThe] = useState<{ k: string; el: HTMLElement } | null>(null)
  const dongThe = useRef((traFocus: boolean) => setMoThe((m) => { if (traFocus) m?.el.focus(); return null })).current
  const chang = ds.filter((n) => n.k.startsWith('c')), soChang = chang.length, soXong = chang.filter((n) => n.tt === 'xong').length
  useEffect(() => {
    const v = changVuaXong(soXong, soChang)
    if (v === null || yenLang()) return
    const iDong = ds.findIndex((n) => n.k === `c${v}`)
    const mo = window.setTimeout(() => setVua(iDong), 450)
    const t = window.setTimeout(() => banHat(goc.current?.querySelectorAll('.kb-dong')[iDong]?.querySelector('.kb-tich'), { hinh: 'sao', so: 10, xa: 80, ms: 700, mau: ['--tr-sao', '--tr-dung', '--tr-tin'] }), 570)
    const het = window.setTimeout(() => setVua(null), 2100)
    return () => { window.clearTimeout(mo); window.clearTimeout(t); window.clearTimeout(het) }
  }, [soXong, soChang]) // eslint-disable-line react-hooks/exhaustive-deps
  const viSua = ds.findIndex((m) => m.k === 'sua')
  const vuaMo = (m: Nut, j: number) => m.tt !== 'khoa' && m.tt !== 'xong' && (moKhoa === 'kt' ? m.k.startsWith('c') || m.k === 'sua' : m.k.startsWith('c') && viSua >= 0 && j > viSua)
  let thuChang = 0
  // ca kiểm tra đang mở ⇒ danh sách mờ đi (như đường chặng cũ `data-mo-di`): mắt dồn vào băng ca phía trên
  return <ol ref={goc} className="kb-viec-ds" data-mo-di={moDi || undefined} aria-label="Việc hôm nay">
    {ds.map((n, i) => {
      if (n.loai === 'hoc') thuChang++
      const thuMo = moKhoa && vuaMo(n, i) ? ds.slice(0, i).filter(vuaMo).length : -1
      const hu = moKhoa ? (n.tt === 'xong' && n.k === (moKhoa === 'kt' ? 'kiem' : 'sua') ? 'xong' : thuMo >= 0 ? 'mo' : undefined) : i === vua ? 'xong' : vua !== null && i === vua + 1 && n.tt === 'dang' ? 'mo' : undefined
      const viec = n.pop.nut, mo = moThe?.k === n.k
      const Icon = n.tt === 'xong' ? Check : Lock
      return <li key={n.k} className="kb-o" data-hu={hu} style={thuMo >= 0 ? { '--tre': `${300 + thuMo * 160}ms` } as CSSProperties : undefined}>
        {/* chạm dòng KHÔNG vào thẳng (thầy 27/10): thẻ bật ra dưới dòng — việc chính nằm trong thẻ; dòng khoá ⇒ thẻ nói lý do */}
        <button type="button" className="kb-dong" data-loai={n.loai} data-tt={n.tt} data-sac={SAC_POP[n.loai]} aria-label={n.ten} aria-haspopup="dialog" aria-expanded={mo}
          aria-controls={mo ? `da-pop-${n.k}` : undefined} onClick={(e) => { const el = e.currentTarget; cham(); setMoThe((m) => (m?.k === n.k ? null : { k: n.k, el })) }}>
          <span className="kb-tich">{n.vong !== undefined && n.tt === 'dang' ? <VongChang pt={n.vong} so={n.soDoan} da={n.daDoan} khoa={n.khoaVong} /> : null}{n.tt === 'xong' || n.tt === 'khoa' ? <Icon size={n.tt === 'khoa' ? 15 : 18} strokeWidth={n.tt === 'xong' ? 3 : 2.4} aria-hidden="true" /> : null}</span>
          <span className="kb-giua"><b>{tenDong(n, thuChang)}</b><span className="kb-phu">{phuDong(n)}</span></span>
          {n.tt === 'dang' ? <span className="kb-viec" aria-hidden="true">{n.daDoan !== undefined && n.soDoan ? `${n.daDoan}/${n.soDoan}` : n.bong ?? viec?.chu ?? ''}</span> : <i className="kb-loai" aria-hidden="true" />}
          {/* huy hiệu số như chấm thông báo (thầy 27/10 — số câu Tự sửa lỗi còn hôm nay…); tên đầy đủ ở aria-label + thẻ bật ra */}
          {n.dem ? <b className="da-dem kb-dem" aria-hidden="true">{n.dem > 99 ? '99+' : n.dem}</b> : null}
        </button>
        {mo && <TheNut id={`da-pop-${n.k}`} sac={n.tt === 'khoa' ? 'khoa' : SAC_THE[n.loai]} pop={n.pop} mo={moThe!.el} onDong={dongThe} />}
      </li>
    })}
  </ol>
}

/** G — Bi NÓI: bong bóng lời hiện chữ gõ dần (~28 ms/chữ); giảm chuyển động / máy yếu ⇒ hiện đủ ngay. Trình đọc màn hình đọc cả câu một lần. */
/** Lời Bi NHẮC MỘT LẦN (thầy 27/10: «Chỗ học tiếp nhé nhắc 1 lần xong ẩn đi»): khoá = ngày VN + loại lời + bài. Đã hiện khoá ấy ⇒ không hiện nữa
 *  trong ngày; nội dung đổi hẳn (vừa đủ mức, sang bài mới) ⇒ khoá mới ⇒ hiện lại một lần. Máy không có localStorage ⇒ hiện như cũ (không lỗi). */
const KHOA_LOI_BI = 'ddh.loi-bi'
const docDaNhac = (): string[] => { try { const v = JSON.parse(localStorage.getItem(KHOA_LOI_BI) || '[]'); return Array.isArray(v) ? v : [] } catch { return [] } }
const ghiDaNhac = (k: string) => { try { localStorage.setItem(KHOA_LOI_BI, JSON.stringify([...docDaNhac().filter((x) => x !== k).slice(-19), k])) } catch { /* không lưu được: lần sau nhắc lại */ } }
/** KHO CÂU giận không lặp liền (thầy 01/11 tối): nhớ câu đã hiện theo LƯỢT `ngày|số câu đã làm|cấp|lý do` — l = lượt, c = câu của lượt ấy, t = câu lượt trước. */
const KHOA_LOI_MOL = 'ddh.loi-mol'
type NhoLoiMol = { l?: string; c?: string; t?: string }
const docLoiMol = (): NhoLoiMol => { try { const v = JSON.parse(localStorage.getItem(KHOA_LOI_MOL) || '{}'); return v && typeof v === 'object' ? v : {} } catch { return {} } }
const ghiLoiMol = (v: NhoLoiMol) => { try { localStorage.setItem(KHOA_LOI_MOL, JSON.stringify(v)) } catch { /* không lưu được: lượt sau có thể lặp câu */ } }

/** Cỡ Mol góc thẻ đầu (px), PHẢI ≥ 64: dưới 64 Bi chạy chế độ 'nho' mặt tĩnh (thầy 03/11 «hiệu ứng của mol mất hết rồi … cho Mol to lên»). */
export const MOL_GOC = 84
function LoiBi({ cam, loi, coBi = true, khoa, cap = 0, ben, chanNgon: laChanNgon, goc }: { cam: CamBi; loi: string; coBi?: boolean; khoa?: string; cap?: number; ben?: HTMLElement | null; chanNgon?: boolean; goc?: boolean }) {
  // pha: hien (gõ chữ, giữ ~4 s) → thu (mờ + co chiều cao mượt, đường đi trượt lên) → an (gỡ hẳn). Không khoá (lời quan trọng) ⇒ luôn hiện.
  const [pha, setPha] = useState<'hien' | 'thu' | 'an'>(() => (khoa && docDaNhac().includes(khoa) ? 'an' : 'hien'))
  useEffect(() => {
    if (!khoa || pha !== 'hien') return
    ghiDaNhac(khoa)
    if (ben) return // bong bóng trên đầu Mol: hẹn ẩn riêng (~6 s) ở dưới
    const t1 = window.setTimeout(() => setPha('thu'), 4700), t2 = window.setTimeout(() => setPha('an'), 5100)
    return () => { window.clearTimeout(t1); window.clearTimeout(t2) }
  }, [khoa, ben]) // eslint-disable-line react-hooks/exhaustive-deps
  // BONG BÓNG TRÊN ĐẦU MOL (Boss soát PR 733): tự mờ dần sau ~6 s (cả lời cấp 4–5); có lời mới ⇒ LoiBi gắn lại (key) nên hiện lại; CHẠM MOL ⇒ hiện lại lời
  // gần nhất và hẹn ẩn lại từ đầu. Bong bóng không bao giờ chặn chạm (pointer-events: none — trong-hs.css). Giảm chuyển động ⇒ ẩn không hiệu ứng (CSS).
  const [lanCham, datLanCham] = useState(0)
  // 02/11 (ảnh thật: bong bóng đè nút KIỂM TRA ÔN TẬP): không chỗ nào né được mọi nút ⇒ THU THÀNH NÚT NHỎ cạnh Mol (`gon`, chờ em chạm, không tự mờ);
  // em chạm nút nhỏ / chạm Mol ⇒ ĐỌC (`doc`): bong bóng hiện ở chỗ ít đè nhất rồi tự mờ như thường.
  const [gon, datGon] = useState(false)
  const [doc, datDoc] = useState(false)
  const docLai = () => { setPha('hien'); datDoc(true); datLanCham((x) => x + 1) }
  const daAn = pha === 'an'
  useEffect(() => {
    if (!ben || daAn || (gon && !doc)) return // hẹn lại chỉ khi vừa hiện (từ ẩn) hoặc chạm Mol — đổi «hiện → mờ» không được huỷ hẹn gỡ hẳn
    const t1 = window.setTimeout(() => setPha('thu'), 6000), t2 = window.setTimeout(() => { setPha('an'); datDoc(false) }, 6400)
    return () => { window.clearTimeout(t1); window.clearTimeout(t2) }
  }, [ben, daAn, lanCham, gon, doc])
  useEffect(() => {
    const mol = ben?.parentElement?.querySelector('.da-linh-vat[data-lv="bi"]')
    if (!mol) return
    mol.addEventListener('click', docLai)
    return () => mol.removeEventListener('click', docLai)
  }, [ben]) // eslint-disable-line react-hooks/exhaustive-deps
  const [n, setN] = useState(loi.length)
  useEffect(() => {
    // vừa mở / tải lại trang (data-vua-mo) ⇒ hiện trọn câu, không gõ (thầy 02/11 «Bấm f5 … hiệu ứng chèn vào»)
    const yen = document.documentElement.classList.contains('may-yeu') || document.documentElement.hasAttribute('data-vua-mo') || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (yen) { setN(loi.length); return }
    setN(0)
    let t = 0, i = 0
    // 27/10 (soát ảnh: bong bóng trông «cụt câu» khi đang gõ): gõ xong câu trong ≤ 0,7 s (câu dài ⇒ mỗi chữ nhanh hơn, tối thiểu 8 ms).
    const nhip = Math.max(8, Math.min(28, Math.floor(700 / Math.max(1, loi.length))))
    const go = () => { i++; setN(i); if (i < loi.length) t = window.setTimeout(go, nhip) }
    t = window.setTimeout(go, nhip)
    return () => window.clearTimeout(t)
  }, [loi])
  // BONG BÓNG TRÊN ĐẦU MOL: tự căn trong đường đi, không tràn mép; đuôi chỉ đầu Mol (lệch trái khỏi nút bấc / lửa) — hình học thuần ở src/lib/bong-bong-mol.ts.
  // Thầy 01/11 23h «Viền bong bóng phải gọn vừa với chữ nhé» ⇒ CO THEO CHỮ: cho bề rộng tối đa (≤ 280), chữ cân dòng (text-wrap: balance), đo DÒNG DÀI NHẤT
  // ⇒ bong bóng ôm sát chữ; đặt lại vị trí + đuôi theo bề rộng thật (--rong · --trai · --duoi · --nang · --tren).
  // Thầy 02/11 (ảnh thật: bong bóng đè nút KIỂM TRA ÔN TẬP ngay trên Mol) ⇒ KHÔNG BAO GIỜ ĐÈ NÚT: né theo KHUNG THẬT của mọi thứ bấm được / nhãn trên đường đi
  // (nút chặng · Kiểm tra ôn tập · Tự sửa lỗi · Bài tập · rương · nút đang chọn · vòng tiến độ tràn ngoài nút · nhãn «BẮT ĐẦU» · huy hiệu số): trên đầu Mol →
  // nâng / thu hẹp → dưới Mol → cạnh Mol → thu thành nút nhỏ (chonChoBong). Đo SAU bố cục (ResizeObserver, như đường nối của DuongChang — không ép bố cục giữa
  // lượt dựng) và lại khi đường đi đổi cỡ / xoay màn, nút đổi (thêm bớt, đổi trạng thái, mở thẻ), phông chữ nạp xong, cuộn xong.
  useLayoutEffect(() => {
    const d = ben?.closest('.da-duong'), bb = ben?.querySelector<HTMLElement>('.bi-loi-bong')
    if (!ben || !d || !bb) return
    const hop = (e: Element): Hop => { const q = e.getBoundingClientRect(); return { left: q.left, top: q.top, right: q.right, bottom: q.bottom } }
    const datCho = () => {
      const o = ben.getBoundingClientRect(), mol = ben.parentElement?.querySelector('.da-linh-vat[data-lv="bi"]')
      const vat = Array.from(d.querySelectorAll('button, [role="button"], a[href], .da-vong, .da-bong, .da-dem')).filter((e) => !ben.contains(e)).map(hop)
        .filter((n) => n.right > n.left && n.bottom > n.top)
      const daDo = new Map<number, { w: number; h: number }>()
      const kho = (rong: number) => {
        const cu = daDo.get(rong)
        if (cu) return cu
        ben.style.setProperty('--rong', `${rong}px`)
        bb.style.width = ''
        let w = rong
        const chu = bb.querySelector('[aria-hidden="true"]'), rg = chu ? document.createRange?.() : undefined
        if (chu && rg && typeof rg.getClientRects === 'function') {
          rg.selectNodeContents(chu)
          const cs = getComputedStyle(bb), so = (x: string) => parseFloat(x) || 0
          const wc = rongOmChu(Array.from(rg.getClientRects()), so(cs.paddingLeft) + so(cs.paddingRight) + so(cs.borderLeftWidth) + so(cs.borderRightWidth))
          if (wc) w = Math.min(rong, wc + 1)
        }
        bb.style.width = `${w}px`
        const kq = { w, h: bb.getBoundingClientRect().height }
        daDo.set(rong, kq)
        return kq
      }
      const kq = chonChoBong({ duong: hop(d), neo: { x: o.left, y: o.top }, mol: mol ? hop(mol) : { left: o.left, right: o.left, top: o.top, bottom: o.top }, vat, to: ben.hasAttribute('data-cap'), kho })
      const c = kq.bong
      ben.dataset.cho = kq.cho ?? (doc ? c.cho : 'gon')
      if (c.benTrai) ben.dataset.benTrai = ''; else delete ben.dataset.benTrai
      ben.style.setProperty('--rong', `${c.rong}px`)
      bb.style.width = `${c.w}px`
      for (const [k, x] of [['--trai', c.trai], ['--duoi', c.duoi], ['--nang', c.nang], ['--tren', c.tren], ['--chip-trai', kq.chip?.trai ?? 0], ['--chip-tren', kq.chip?.tren ?? 0]] as const) ben.style.setProperty(k, `${x}px`)
      datGon(kq.cho === null)
    }
    let con = true, hen = 0
    const henDat = () => {
      if (typeof requestAnimationFrame !== 'function') { if (con) datCho(); return }
      cancelAnimationFrame(hen); hen = requestAnimationFrame(() => { if (con) datCho() })
    }
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => datCho()) : null
    if (ro) ro.observe(d); else datCho()
    const mo = typeof MutationObserver === 'function' ? new MutationObserver((ds) => { if (ds.some((m) => !ben.contains(m.target))) henDat() }) : null
    mo?.observe(d, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['data-tt', 'data-loai', 'aria-expanded', 'data-hu'] })
    window.addEventListener('resize', henDat)
    window.addEventListener('scrollend', henDat, { capture: true, passive: true })
    void document.fonts?.ready.then(henDat)
    return () => {
      con = false; if (hen) cancelAnimationFrame(hen); ro?.disconnect(); mo?.disconnect()
      window.removeEventListener('resize', henDat); window.removeEventListener('scrollend', henDat, { capture: true })
    }
  }, [ben, daAn, doc]) // eslint-disable-line react-hooks/exhaustive-deps
  const bongGoc = useBongVuaChu(!!goc, loi) // thầy 03/11 «khung bong bóng vừa với chữ» (src/lib/bong-vua-chu.ts)
  // màu bong bóng theo cảm xúc (trong-hs.css .bi-loi-bong[data-cx]): cấp ≥ 2 ⇒ dỗi · bực · cáu · rất cáu; còn lại theo mặt Mol
  const cx = cap >= 2 ? (['doi', 'buc', 'cau', 'ratCau'] as const)[Math.min(cap, 5) - 2] : cam === 'mung' || cam === 'lua' ? 'khen' : cam === 'sai' ? 'buon' : cam
  // MOL Ở GÓC TRÁI THẺ ĐẦU (thầy 03/11, bản vẽ docs/ban-ve-mol-goc-0311): Mol nhỏ ở góc trái thẻ «Tổng câu hôm nay», bong bóng cảm xúc cạnh Mol
  if (goc) return <div className="kb-mol"><Bi cam={cam} cap={cap} size={MOL_GOC} noi={loi} /><p ref={bongGoc} className="bi-loi-bong kb-mol-bong" data-cap={cap >= 4 ? cap : undefined} data-cx={cx} data-chan-ngon={laChanNgon || undefined}><span className="ht2-an">{loi}</span><span aria-hidden="true">{loi.slice(0, n)}<span className="bi-loi-con">{loi.slice(n)}</span></span></p></div>
  if (pha === 'an') return null
  // cấp 4–5: viền bong bóng màu «sai» (token có sẵn). `ben` (điện thoại ngang thấp): bong bóng nói CẠNH Lửa trên đường, đuôi chỉ xuống Lửa.
  const bong = <div className="bi-loi-boc" data-thu={pha === 'thu' || undefined} data-ben={ben ? '' : undefined}><div className="bi-loi" data-khong-bi={!coBi || !!ben || undefined}>{coBi && !ben && <Bi cam={cam} cap={cap} size={84} noi={loi} />}<p className="bi-loi-bong" data-cap={cap >= 4 ? cap : undefined} data-cx={cx} data-chan-ngon={laChanNgon || undefined}><span className="ht2-an">{loi}</span><span aria-hidden="true">{loi.slice(0, n)}<span className="bi-loi-con">{loi.slice(n)}</span></span></p></div></div>
  if (!ben) return bong
  // nút nhỏ «Mol nhắn» (hết chỗ trống): chạm ⇒ đọc. Bong bóng vẫn dựng (ẩn) để đo lại khi bố cục đổi.
  return createPortal(<>{bong}{gon && !doc && <button type="button" className="da-lv-chip" aria-label={`Mol nhắn: ${loi}`} onClick={docLai}>
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /><path d="M8 12h.01M12 12h.01M16 12h.01" /></svg>
  </button>}</>, ben)
}

const THU_NGAN = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const thuNgan = (ngay: string) => THU_NGAN[new Date(`${ngay}T00:00:00Z`).getUTCDay()] ?? ''
const lopSo = (lop?: string) => lop?.match(/^\d{1,2}/)?.[0]

function OTo({ ten, mo, sac, Icon, so, noi, onClick, tat }: { ten: string; mo: string; sac: string; Icon: LucideIcon; so?: ReactNode; noi?: boolean; onClick?: () => void; tat?: boolean }) {
  const than = <><span className="h" data-sac={sac}><Icon size={30} aria-hidden="true" /></span><span className="giua"><b>{ten}</b><span className="mo">{mo.replace(/ · /g, '\u00a0· ')/* SOÁT 26/10: «·» không mở đầu dòng */}</span></span>{so != null && <span className="so">{so}</span>}{onClick && <ChevronRight size={22} aria-hidden="true" className="da-mui" />}</>
  return onClick ? <button type="button" className="da-o" data-noi={noi || undefined} onClick={onClick} disabled={tat}>{than}</button> : <div className="da-o" data-noi={noi || undefined}>{than}</div>
}

/** HÔM NAY kiểu Duolingo + chất Hoá (bản vẽ ve-moi/dm-*.html, thầy chốt 26/10): ba mục của menu dọc — Lộ trình (con đường chặng: học → Kiểm tra ôn tập →
 *  Tự sửa lỗi → Bài tập về nhà, ĐÚNG thứ tự việc của «Một trang») · Luyện tập (mỗi việc một ô to có số) · Thành tích (chuỗi ngày, tuần này, việc tiếp, huy hiệu
 *  từ số sẵn có). Cùng số, cùng lệnh, cùng nút như bản trước; ô nào app chưa có số rẻ thì giữ nhãn, bỏ số. */
/**
 * GIAO DIỆN CŨ (ddh.trong = 'tat') cũng phải đóng: Hôm nay cũ nạp lười mảnh này, tự đọc /hs/thuong (lúc mở + khi em quay lại thẻ); `tamDong` ⇒ ÉP «Trong»
 * (gắn `<html data-trong>` để màn phủ đúng màu --tr-*) rồi phủ y như Lộ trình; thầy mở lại ⇒ gỡ thuộc tính, trả giao diện cũ nguyên vẹn. Màn phủ: mảnh PhuTamDong.
 */
export default function GacTamDong({ p, kiem }: { p: PropsHomNayCu; kiem?: TomTatKiemTra }) {
  const t = useTongQuan(p.token)
  const dong = !!t.du?.tamDong
  const { thuLai } = t
  useEffect(() => {
    if (dong) return // đang phủ: PhuTamDong tự đọc lại (vòng chuẩn)
    const nhin = () => { if (document.visibilityState === 'visible') thuLai() }
    document.addEventListener('visibilitychange', nhin)
    return () => document.removeEventListener('visibilitychange', nhin)
  }, [dong, thuLai])
  useLayoutEffect(() => {
    const h = document.documentElement
    if (!dong || h.dataset.trong) return
    h.dataset.trong = 'hs'
    return () => { delete h.dataset.trong }
  }, [dong])
  return dong ? <Suspense fallback={null}><PhuTamDong token={p.token} caMo={p.coCa ? p.onThi : undefined}
    kiemDo={!p.coCa && kiem?.homNay && kiem.nopLuc === null && kiem.trangThai === 'can_lam' && kiem.daTra > 0 ? p.onKiemTra : undefined} /></Suspense> : null
}

/** Đồng bộ tức thì tiến độ chặng đang làm dở (`omr_chang_dang_cua`) vào `so` trên Lộ trình — chỉ tính câu ĐÃ BẤM NỘP (`ket`), và giữ chặng ở trạng thái đang học (`changDangDo`, chưa tích ✓) cho tới khi màn báo hoàn thành chặng hiện ra. */
let cuaDoc: { s: string | null; d: any } = { s: null, d: null } // eslint-disable-line @typescript-eslint/no-explicit-any
/** Bỏ chặng dở đã cũ (đúng các khoá của `xoaChangDangLam` ở mo-chang-truoc.ts — không nhập mô-đun ấy vào mảnh mở app) + báo mô-đun ấy (nếu đã nạp) xoá bản nhớ. */
function boChangDangCu(sbd: string): void {
  try {
    const em = sbd.trim()
    if (em) { localStorage.removeItem(`omr_chang_dang_lam_${em}`); localStorage.removeItem(`omr_chang_dang_cau_${em}`) }
    localStorage.removeItem('omr_chang_dang_cua')
    cuaDoc = { s: null, d: null }
    window.dispatchEvent(new CustomEvent('ddh-bo-chang-dang', { detail: em }))
  } catch { /* bỏ qua */ }
}
function nangSoTuChangDangDo(so: SoHomNay | null): SoHomNay | null {
  if (!so) return so
  try {
    // Lộ trình vẽ lại nhiều lần ⇒ chỉ giải mã khi bản lưu đổi (máy yếu 30/10)
    const s = localStorage.getItem('omr_chang_dang_cua')
    if (s !== cuaDoc.s) cuaDoc = { s, d: JSON.parse(s || 'null') }
    const d = cuaDoc.d, sbd = sbdPhien(), now = Date.now()
    if (!d || d.ngay !== ngayVn(now) || (sbd && d.sbd && String(d.sbd).trim() !== sbd.trim()) || now - d.moLuc >= 6300_000 || !d.cau?.length) return so
    const ket = d.ket || {}, g = d.soGoc > 0 ? d.soGoc : d.cau.length
    const n = d.cau.slice(0, g).filter((c: { qid?: string; vaiGoi7?: string }) => c?.qid && c.vaiGoi7 !== 'lam_lai' && ket[c.qid] && ket[c.qid].omni?.luot !== true).length
    const d0Luu = d.moi?.d0 ?? -1
    // ĐỒNG BỘ NHIỀU MÁY (thầy 31/10: «hai thiết bị đăng nhập ko đồng bộ với nhau. Làm như doligo đi»): máy chủ biết em đã làm NHIỀU HƠN chặng dở lưu ở máy này
    // (máy khác đã làm tiếp) ⇒ bản lưu ở máy này cũ: bỏ, hiện đúng số máy chủ — trước: kẹp số về cuối chặng cũ (máy chủ 18 mà máy hiện 12, «chặng 2 đang học»).
    if (d0Luu >= 0 && so.daLam > d0Luu + n) { boChangDangCu(String(d.sbd || sbd || '')); return so }
    const ch = d.chang >= 1 && d.chang <= so.soChang ? d.chang : so.soChang > 0 ? Math.min(so.soChang, (((d0Luu >= 0 ? d0Luu : Math.max(0, so.daLam - n)) / 6) | 0) + 1) : 0
    if (ch >= 1 && d0Luu < so.muc) {
      const dau = Math.min((ch - 1) * 6, so.muc), cuoi = ch === so.soChang ? so.muc : Math.min(ch * 6, so.muc)
      const d0 = d0Luu >= dau && d0Luu + g <= cuoi ? d0Luu : Math.max(dau, cuoi - g)
      return { ...so, daLam: n > 0 ? Math.min(cuoi, Math.max(dau, d0 + n)) : Math.min(so.daLam, cuoi), chang: ch, changDangDo: n > 0 || so.daLam >= cuoi ? ch : undefined, cauChang: g, daCauChang: Math.min(n, g) }
    }
    return n > 0 ? { ...so, daLam: Math.max(so.daLam, (d0Luu >= 0 ? d0Luu : Math.max(0, so.daLam - n)) + n) } : so
  } catch { return so }
}

export function MotTrangHs(p: PropsMotTrang) {
  const so = nangSoTuChangDangDo(p.so), kiem = p.kiem, hs = p.hs
  // THẺ BÀI GHIM (thầy 27/10: «ghim phần bài 8 amine lại»): dính ngay dưới hàng bộ đếm (đo chiều cao thật của hàng — ngang thấp khác dọc); vạch mốc
  // ngay trên thẻ khuất dưới hàng bộ đếm ⇒ thẻ đã dính ⇒ thu gọn (bỏ dòng nhãn nhỏ) + bóng đáy.
  const khung = useRef<HTMLDivElement>(null)
  // vạch mốc đáy thẻ bài: state (không phải ref) ⇒ thẻ dựng lại thì bộ theo dõi gắn sang vạch MỚI (ref cũ ⇒ theo dõi nút đã gỡ, dải kẹt «hiện» — thầy 31/10)
  const [mocBai, datMocBai] = useState<HTMLElement | null>(null)
  const [trenCao, datTrenCao] = useState(52)
  const [dinh, datDinh] = useState(false)
  // dải gọn chỉ dựng từ lần dính đầu (chưa cuộn ⇒ không có bản sao tên bài trong cây); đã dựng thì giữ để thu / hiện mượt
  const daDinh = useRef(false)
  if (dinh) daDinh.current = true
  // 27/10 MƯỢT (đo scripts/do-muot-hs.mjs): trước đây hiệu ứng này chạy lại SAU MỌI lượt vẽ của Lộ trình và đọc toạ độ ngay ⇒ mỗi lần cổng vẽ lại (mở
  // màn làm chặng, số cập nhật…) là ép tính bố cục cả trang (~190 ms ở CPU ×6, đúng lúc em bấm «Bắt đầu»). Nay: chỉ đo ngay khi hàng bộ đếm MỚI xuất
  // hiện; còn lại do ResizeObserver báo (sau khi trình duyệt tự tính bố cục) — theo dõi cả hàng lẫn từng ô / nhãn bên trong (nhãn đặt tuyệt đối đổi cỡ
  // khi số đổi mà hàng không đổi cỡ). Mỗi lượt vẽ chỉ còn querySelectorAll (không đọc bố cục).
  const doTren = useRef<{ tr: HTMLElement | null; ro: ResizeObserver | null }>({ tr: null, ro: null })
  useLayoutEffect(() => {
    const tr = khung.current?.querySelector<HTMLElement>('.da-tren') ?? null
    const d = doTren.current
    // viên đếm nổi (portal ra ngoài khung) ⇒ không còn hàng bộ đếm trên cùng: dải bài ghim sát mép trên (8 px)
    if (!tr) { d.ro?.disconnect(); d.ro = null; d.tr = null; datTrenCao(8); return }
    // mép dưới THỰC của hàng bộ đếm: tính cả vòng Bi + nhãn «x/y bài» (nhãn đặt tuyệt đối, có thể thò khỏi hàng) + khe 8px (thầy 27/10 «chữ 1/16 vẫn bị cắt»)
    const CHON = '.tp-tr, .tp-tr-o, .tp-tr-muc, .tp-tr-muc > :not(svg)'
    const do_ = () => {
      const r = tr.getBoundingClientRect()
      let day = r.bottom
      tr.querySelectorAll(CHON).forEach((e) => { day = Math.max(day, e.getBoundingClientRect().bottom) })
      // hàng bộ đếm là THANH NGANG trên cùng (≤ ~2 dòng). Cao bất thường (cột dọc / bố cục lạ) ⇒ không phải thanh trên ⇒ ghim sát mép (8 px), không bật dải oan.
      const cao = Math.round(day - r.top) + 8
      datTrenCao(cao > 200 ? 8 : cao)
    }
    if (d.tr !== tr) {
      d.ro?.disconnect()
      d.tr = tr
      d.ro = typeof ResizeObserver === 'function' ? new ResizeObserver(do_) : null
      do_()
    }
    if (d.ro) { d.ro.observe(tr); tr.querySelectorAll(CHON).forEach((e) => d.ro!.observe(e)) } // quan sát lại là không đổi gì; phần tử mới được theo dõi thêm
    else do_()
  })
  useEffect(() => () => { doTren.current.ro?.disconnect() }, [])
  // KHUNG TĨNH (28/10, thầy «vẫn chưa tức thì»): Lộ trình thật đã gắn ⇒ gỡ ảnh tĩnh của lần mở trước TRONG CÙNG khung hình (không nháy); đang ở Lộ
  // trình + đủ số ⇒ hẹn chụp ảnh mới lúc máy rảnh (src/lib/khung-tinh-hs.ts).
  useLayoutEffect(() => { goKhungTinh() }, [])
  const laLoTrinh = (p.muc ?? 'hom-nay') === 'hom-nay'
  useEffect(() => { baoLoTrinh(laLoTrinh); if (laLoTrinh && so) henChupKhungTinhHs(sbdPhien()) }, [laLoTrinh, so])
  useEffect(() => () => baoLoTrinh(false), [])
  // DẢI GỌN ⇔ thẻ bài đầy đủ ĐÃ CUỘN KHUẤT (thầy 31/10: «Giao diện thỉnh thoảng hiện 2 vạch màu tím, chỉ cho hiện 1 vạch thôi»): MỘT vạch tại một lúc.
  // vạch mốc nằm ở ĐÁY thẻ: quyết bằng TOẠ ĐỘ THẬT đọc lúc ấy (một lần đọc, trong khung hình kế), không tin cờ cũ của IntersectionObserver — Lộ trình ẩn
  // (màn phủ, tab nền, máy ngủ) cho hộp rỗng / toạ độ 0 ⇒ trước đây bật dải oan rồi kẹt. Không có hộp ⇒ không dải.
  const xetDinh = useRef<() => void>(() => {})
  useEffect(() => {
    const m = mocBai
    if (!m) { datDinh(false); return }
    let hen = 0
    const xet = () => { hen = 0; const r = m.getBoundingClientRect(); datDinh(m.isConnected && r.width > 0 && r.top < trenCao + 2) }
    const henXet = () => { if (!hen) hen = requestAnimationFrame(xet) }
    xetDinh.current = henXet
    const io = typeof IntersectionObserver === 'function' ? new IntersectionObserver(henXet, { rootMargin: `-${trenCao + 1}px 0px 0px 0px`, threshold: 0 }) : null
    io?.observe(m)
    // đổi khổ / quay lại app / trang hiện lại ⇒ xét lại (không tốn gì lúc đứng yên)
    window.addEventListener('resize', henXet, { passive: true })
    window.addEventListener('pageshow', henXet)
    document.addEventListener('visibilitychange', henXet)
    henXet()
    return () => {
      io?.disconnect(); cancelAnimationFrame(hen); xetDinh.current = () => {}
      window.removeEventListener('resize', henXet); window.removeEventListener('pageshow', henXet); document.removeEventListener('visibilitychange', henXet)
    }
  }, [trenCao, mocBai])
  // TỰ CHỮA khi dải ĐANG hiện: mỗi lượt cuộn (mọi khung cuộn) xét lại ⇒ thẻ về màn là dải tắt ngay. Dải tắt ⇒ gỡ nghe cuộn (cuộn thường không tính gì).
  useEffect(() => {
    if (!dinh) return
    const nghe = () => xetDinh.current()
    document.addEventListener('scroll', nghe, { passive: true, capture: true })
    return () => document.removeEventListener('scroll', nghe, { capture: true })
  }, [dinh])
  const nhipGoc = useNhipHocEm(p.ngayKiem ? undefined : p.token, null)
  const nhip = typeof nhipGoc === 'string' ? null : nhipTheoSanh(nhipGoc, so ? { muc: so.muc, daLam: so.daLam } : null)
  // Thưởng phạt: tổng quan /hs/thuong (bản lưu máy trước, máy chủ sau). Có chuỗi ngày theo bài (B3, cờ duolingo_bai) ⇒ MỌI chỗ hiện chuỗi dùng CÙNG số với
  // thanh trên; cờ tắt (chuoiNgay vắng) ⇒ chuỗi «đủ mức» cũ. Máy chủ chưa có lệnh (404) / lỗi mà chưa có bản lưu ⇒ thanh trên cũ.
  const tqTai = useTongQuan(p.token)
  const tq = tqTai.du
  // NẠP SẴN giám thị, màn thưởng, Tu luyện, Câu đã làm lúc rảnh: ở cong-hs-nap-luoi.ts (mảnh nạp lúc rảnh — không cộng byte lượt mở /hs).
  // HỆ KÍNH (bản vẽ v2): đầu trang = ảnh đại diện bánh quy 12 múi (Hôm nay) + tiêu đề + CHUÔNG THÔNG BÁO THẬT (ThongBaoHocSinh — đúng một bản, chuyển từ menu)
  const dauKinh = (giua: ReactNode, coAnh = false) => <header className="kb-dau" data-chinh={coAnh || undefined}>
    {coAnh && <span className="kb-ava" aria-hidden="true"><svg viewBox="0 0 100 100"><path d={BANH_12} /></svg><b>{chuCaiTen(p.ten)}</b></span>}
    <div className="kb-dau-giua">{giua}</div>
    {p.thongBao && <div className="kb-chuong">{p.thongBao}</div>}
  </header>
  const coThuong = !!p.token && (!!tq || tqTai.tai)
  const chuoi = tq?.chuoiNgay?.so ?? nhip?.chuoiDuGanNhat ?? 0
  // Thầy 27/10 (luật 28/10): chuỗi giữ khi LÀM ĐỦ MỨC HÔM NAY (cùng thước đo vòng «Đủ mức») ⇒ dòng chuỗi nói đúng luật đó.
  const giuHomNay = !!tq?.chuoiNgay && tq.chuoiNgay.lich7.some((x) => x.ngay.slice(0, 10) === ngayVn(Date.now()) && x.kieu === 'hoc')
  const chuLuatChuoi = giuHomNay ? 'hôm nay đã giữ chuỗi' : 'mỗi ngày làm đủ mức hôm nay để giữ chuỗi'
  const [tp, setTp] = useState<{ man: TenManThuong; hieuUng?: 'chuoi' } | null>(null)
  const coBen = useCoBen()
  const choSo = useChoSo(coThuong)
  useEffect(() => { setTp(null) }, [p.muc])
  // Vừa nộp Kiểm tra ôn tập (lần mở trước còn khoá) ⇒ hiệu ứng vỡ khoá các chặng MỘT lần: nhớ id bài đang khoá trên máy, thấy đã nộp ⇒ chạy rồi xoá.
  const [moKt, setMoKt] = useState(false)
  const ktKhoaNay = !!kiem && kiem.homNay && !p.ngayKiem && kiem.nopLuc === null && kiem.trangThai === 'can_lam'
  useEffect(() => {
    if (!kiem || !kiem.homNay || p.ngayKiem) return
    try {
      if (ktKhoaNay) { localStorage.setItem(KHOA_KT_MO, kiem.id); return }
      if (kiem.nopLuc === null || localStorage.getItem(KHOA_KT_MO) !== kiem.id) return
      localStorage.removeItem(KHOA_KT_MO)
    } catch { return }
    if (yenLang()) return
    setMoKt(true)
    const t = window.setTimeout(() => setMoKt(false), 3200)
    return () => window.clearTimeout(t)
  }, [kiem?.id, kiem?.nopLuc, ktKhoaNay]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const mo = () => setTp({ man: 'chuoi', hieuUng: 'chuoi' })
    window.addEventListener(SU_KIEN_MO_CHUOI, mo)
    return () => window.removeEventListener(SU_KIEN_MO_CHUOI, mo)
  }, [])
  // TẢI SẴN bộ hiệu ứng ăn mừng (thầy 02/11 «tải luôn hiệu ứng sẵn cho máy yếu»): Lộ trình đã hiện ⇒ nạp mảnh hiệu ứng lúc trình duyệt rảnh (kho chạy-lúc,
  // không cộng byte lượt mở) ⇒ vào làm câu / mở rương là chạy tức thì.
  useEffect(() => { napTruocAnMung() }, [])
  useEffect(() => { napTruocKhoHs() }, []) // 02/11: lúc rảnh tải ngầm mọi mảnh app học sinh máy chưa có (lib/nap-truoc-kho-hs.ts)
  // Thành tích mở ⇒ gọi sẵn giải + bạn + huy hiệu (song song) để bấm ô là có số.
  useEffect(() => { if (p.muc === 'ket-qua' && p.token) napSanThanhTich(p.token) }, [p.muc, p.token])
  const moTp = (man: TenManThuong) => setTp({ man })
  const con = so ? Math.max(0, so.muc - so.daLam) : null
  const du = con === 0 && !so?.changDangDo
  const nutHoc = chuNutLoai(chuNutHoc(so, p.hetCau, p.kho), p.loaiNgay), ns = p.loaiNgay === 'sua' && !p.ngayKiem ? nhomDangSua(p.goi7?.nhomSua) : null
  const kiemXong = !!kiem && (kiem.nopLuc !== null || kiem.trangThai === 'het_han')
  const kiemLam = !!kiem && kiem.homNay && !kiemXong && kiem.trangThai === 'can_lam'
  const nhoSua = useMemo(() => docSuaNho(p.token), [p.token])
  const soSua = p.soSua ?? nhoSua?.[0]
  const coSua = !!soSua && soSua > 0 && !p.loaiNgay // ngày có loại: 28 câu, không chặng Tự sửa (10/11)
  const { con: conSua, phan: conSuaPhan, xong: daSuaNay, mod: modSua } = useConSuaHomNay(p.token, coSua, nhoSua)
  useEffect(() => {
    if (p.token && p.soSua != null && conSuaPhan != null) try { localStorage.setItem(KHOA_SUA_NHO, JSON.stringify({ t: p.token.slice(-16), n: ngayVn(Date.now()), s: [p.soSua, conSua, conSuaPhan, daSuaNay] })) } catch { /* máy chặn: như cũ */ }
  }, [p.token, p.soSua, conSua, conSuaPhan, daSuaNay])
  /** Số trên nút: còn phải sửa HÔM NAY (chưa dựng được việc hôm nay ⇒ tối đa 12 trên số cần sửa). */
  const suaNay = conSua ?? (coSua ? Math.min(SO_CAU_MOI_NGAY, soSua!) : 0)
  const choSoSua = conSua === undefined // mảnh việc hôm nay đang nạp ⇒ chưa vẽ huy hiệu số
  const xongSuaNay = coSua && conSua === 0
  const coBt = false // thầy 02/11 «phần btvn không còn nữa bỏ đi»: app học sinh không còn lối Bài tập về nhà (Hôm nay, Luyện tập)
  // Thứ tự việc (thầy 26/10, như «Một trang»): ca đang mở → ngày chỉ có kiểm tra → học → đủ mức ⇒ Kiểm tra ôn tập (nếu phải làm) → Tự sửa lỗi → Bài tập về nhà.
  // KHOÁ THEO KIỂM TRA ÔN TẬP (thầy 27/10 «Nếu có kiểm tra tuần thì đẩy lên đầu hành trình, làm xong mới mở khoá các chặng sau»): ngày có Kiểm tra ôn tập
  // (bài kiểm tra trong tuần theo lịch riêng) MÀ vẫn có bài học ⇒ nút kiểm tra lên ĐẦU đường; bài đang mở chưa nộp ⇒ mọi chặng chưa xong + Tự sửa lỗi KHOÁ (máy chủ
  // cũng từ chối mở chặng — game-v2 `KIEM_TRA_ON_TAP_TRUOC`). Nộp xong ⇒ nút thành ✓, các chặng vỡ khoá lần lượt (F3). Quá hạn ⇒ không khoá, ghi «Đã lỡ».
  const ktDau = !!kiem && kiem.homNay && !p.ngayKiem
  const khoaKt = ktDau && kiemLam
  const chang = so && !p.ngayKiem ? chiaChang(so) : []
  const xongChang = so ? soChangXong(so) : 0
  // TỰ SỬA LỖI CHÈN GIỮA HÀNH TRÌNH (thầy 27/10 «Ưu tiên bài kiểm tra lên đầu hành trình sau đó sửa lỗi chèn vào giữa hành trình mới»): nút Tự sửa lỗi đứng SAU
  // `mocSua` chặng (xem mocSuaHomNay). Đường đi theo thứ tự: các chặng trước mốc xong rồi ⇒ Tự sửa lỗi là việc hiện tại (dù chưa đủ mức).
  const mocSua = coSua && !p.ngayKiem && chang.length ? mocSuaHomNay(chang.length, xongChang) : chang.length
  // Xong phần sửa HÔM NAY ⇒ Tự sửa lỗi thôi là việc chính (nút ✓, vẫn bấm vào sửa thêm được).
  // SỬA XONG MỚI MỞ CHẶNG SAU (thầy 28/10 «Tôi muốn sửa phải xong mới hiện chặng sau»): phần ngày (12 câu đầu) còn câu chưa xong ⇒ mọi chặng chưa xong
  // NẰM SAU nút Sửa lỗi khoá xám (thẻ «Sửa xong N lỗi hôm nay để mở chặng tiếp»); xong ⇒ vỡ khoá (một lần). Máy chủ cũng chặn (TU_SUA_TRUOC). Kiểm tra ôn tập
  // đang khoá thì khoá kiểm tra đứng trên. CHỈ khoá khi có số thật của việc hôm nay: mảnh chưa nạp / không dựng được việc hôm nay (vòng chữa tắt, bảo trì,
  // chưa có danh sách) ⇒ KHÔNG khoá — không phạt em vì thiếu số (máy chủ cũng chỉ chặn khi có dữ liệu).
  const conPhan = conSuaPhan ?? 0
  const khoaSua = coSua && !p.ngayKiem && !khoaKt && conPhan > 0
  const toiSua = coSua && !p.ngayKiem && (khoaSua || !xongSuaNay) && xongChang >= mocSua
  // Tới nút Sửa lỗi mà phần ngày chưa xong ⇒ báo máy chủ (nền, một lần / ngày) để chặn mở chặng bằng lối khác; nhớ trên máy để lúc xong chạy vỡ khoá MỘT lần.
  const [moSua, setMoSua] = useState(false)
  const khoaSuaToi = khoaSua && toiSua
  useEffect(() => {
    const ngay = ngayVn(Date.now())
    try {
      if (khoaSuaToi) { modSua?.baoKhoaSua(); localStorage.setItem(KHOA_SUA_MO, ngay); return }
      if (khoaSua || !coSua || conSuaPhan !== 0 || localStorage.getItem(KHOA_SUA_MO) !== ngay) return
      localStorage.removeItem(KHOA_SUA_MO)
    } catch { return }
    if (yenLang()) return
    setMoSua(true)
    const t = window.setTimeout(() => setMoSua(false), 3200)
    return () => window.clearTimeout(t)
  }, [khoaSuaToi, khoaSua, conSuaPhan, modSua]) // eslint-disable-line react-hooks/exhaustive-deps
  const chinh = p.coCa ? 'ca' : p.ngayKiem || khoaKt ? 'kiem' : toiSua ? 'sua' : du && kiemLam ? 'kiem' : du && coSua && !xongSuaNay ? 'sua' : du && coBt && p.soBaiTap ? 'bt' : 'hoc'
  const pct = so && so.muc > 0 ? Math.min(100, Math.round((100 * so.daLam) / so.muc)) : 0

  // ── LỬA ĐỔI CẢM XÚC (thầy «Chốt duyệt tất» 31/10, docs/DE-XUAT-BI-CAM-XUC-3110.md): cấp 0–5 tính TRÊN MÁY từ số đã có (Sảnh, /hs/thuong, sổ `ddh.lua-that`)
  // ⇒ 0 lệnh máy chủ, 0 lượt đọc D1. Tính lại khi quay lại tab / trang hiện lại, về từ chặng (số câu đổi), đúng mốc giờ kế (19 · 21 · 22 · 23 · 00 giờ, hết
  // 30 phút vui) — không chạy ngầm. Giờ chốt lúc tính ⇒ chữ đứng yên. Đang tải (chưa có số) ⇒ cấp 1; thầy tạm đóng app ⇒ không có Lửa (phủ tạm đóng).
  const [nhipLua, datNhipLua] = useState(0)
  useEffect(() => {
    const lai = () => { if (document.visibilityState !== 'hidden') datNhipLua((n) => n + 1) }
    document.addEventListener('visibilitychange', lai)
    window.addEventListener('pageshow', lai)
    return () => { document.removeEventListener('visibilitychange', lai); window.removeEventListener('pageshow', lai) }
  }, [])
  const tLua = useMemo(() => gioMayChu(), [nhipLua, so?.daLam, so?.muc, p.dangTai]) // eslint-disable-line react-hooks/exhaustive-deps
  const soThat = useMemo(() => docLuaThat(sbdPhien(), tLua), [tLua])
  const lichNay = tq?.chuoiNgay?.lich7.find((x) => x.ngay.slice(0, 10) === ngayVn(tLua))
  const vaoLua: VaoLua | null = so ? {
    now: tLua, daLam: so.daLam, muc: so.muc, du, hetCau: p.hetCau || !!so.duNgay, coCa: p.coCa, kiem: p.ngayKiem || khoaKt,
    nghi: lichNay?.kieu === 'phep' || lichNay?.kieu === 'tat', chuoi, giuHomNay, giuChuoi: tq?.chuoiNgay?.giuChuoi,
    // ngày đầu: chưa có chuỗi, trước hôm nay chưa làm câu nào (dải 7 ngày không có ngày học / bình / cứu)
    ngayDau: chuoi === 0 && !tq?.chuoiNgay?.lich7.some((x) => x.kieu === 'hoc' || x.kieu === 'binh' || x.kieu === 'cuu') && Math.max(0, (nhip?.tongDaLam ?? 0) - so.daLam) === 0,
    cu: !!tqTai.loi || (typeof navigator !== 'undefined' && navigator.onLine === false), so: soThat,
  } : null
  const kLua = vaoLua ? xetLua(vaoLua) : null
  const capLua: CapLua = kLua?.cap ?? 1
  const mocLua = vaoLua ? mocDoiLua(vaoLua) : 0
  // LỬA ĐỔI CẢM XÚC: cấp ≥ 2 (và cấp 0 «vừa làm thật») ⇒ lời theo cấp; còn lại giữ lời cũ. Kho câu giận xoay vòng theo lượt, KHÔNG lặp liền câu vừa hiện:
  // cùng lượt ⇒ truyền lại đúng câu-trước đã dùng (câu đứng yên khi vẽ lại); lượt mới ⇒ truyền câu của lượt vừa rồi để kho chọn câu khác.
  const luotLoi = kLua && so ? `${ngayVn(tLua)}|${so.daLam}|${kLua.cap}|${kLua.lyDo}` : ''
  const nhoLoi = useMemo(docLoiMol, [luotLoi])
  const loiCap = kLua && vaoLua ? loiLua(kLua.cap, { ...vaoLua, loiTruoc: nhoLoi.l === luotLoi ? nhoLoi.t : nhoLoi.c }, kLua) : null
  useEffect(() => { if (loiCap && kLua && kLua.cap >= 2 && nhoLoi.l !== luotLoi) ghiLoiMol({ l: luotLoi, c: loiCap, t: nhoLoi.c }) }, [luotLoi, loiCap]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!mocLua) return
    const h = window.setTimeout(() => { if (document.visibilityState !== 'hidden') datNhipLua((n) => n + 1) }, Math.max(1000, mocLua - gioMayChu() + 500))
    return () => window.clearTimeout(h)
  }, [mocLua])
  // biểu tượng tab = mặt Mol đang hiện, đổi theo cảm xúc (thầy 09/11; icon-tab-mol.ts); rời Lộ trình ⇒ logo
  useEffect(() => { let don: (() => void) | undefined, het = false
    void import('../linh-vat/icon-tab-mol').then((m) => { if (!het) don = m.theoDoiIconTabMol(anhSvg) }).catch(() => {})
    return () => { het = true; don?.() } }, [])
  // chấm số trên biểu tượng app = câu còn thiếu hôm nay (đủ mức / nghỉ / hết câu ⇒ xoá)
  const chamApp = kLua && kLua.lyDo !== 'nghi' && !du && con ? con : 0
  const coSoLua = !!so
  useEffect(() => { if (coSoLua) chamSoApp(chamApp) }, [chamApp, coSoLua])

  // Thanh trên: ĐÚNG 3 bộ đếm thưởng phạt (chuỗi · nguyên tử hôm nay · tinh thể) + vòng Mục tiêu ngày (bản vẽ tp-4); thông báo thưởng chưa xem chỉ bật ở Lộ trình.
  // Khối trạng thái trong menu (thầy 27/10) — xem useChoSo. Chưa có chỗ vẽ (lần vẽ đầu) ⇒ chưa hiện, không chớp.
  const tren = coThuong ? choSo && createPortal(<header className="da-tren" data-menu="" aria-label="Số của em">
    <ThanhThuong token={p.token} onMo={moTp} onHoc={p.onHoc} capLua={capLua} thongBao={!tp && (p.muc ?? 'hom-nay') === 'hom-nay'} menu />
  </header>, choSo) : <header className="da-tren" aria-label="Số của em">
    <>
    {lopSo(hs?.lop) && <span data-sac="tin" aria-label={`Khối ${lopSo(hs?.lop)}`}><GraduationCap size={22} aria-hidden="true" />{lopSo(hs?.lop)}</span>}
    <span data-sac="sao" aria-label={`Chuỗi ${chuoi} ngày đủ mức`}><Flame size={22} aria-hidden="true" />{chuoi}</span>
    {so && <span data-sac="dung" aria-label={vuotMuc(so) ? `Đã làm ${so.daLam} câu hôm nay, đủ mức ${so.muc}` : `${so.daLam}/${so.muc} câu hôm nay`}>{du ? <CheckCircle2 size={22} aria-hidden="true" /> : <Target size={22} aria-hidden="true" />}{vuotMuc(so) ? so.daLam : `${so.daLam}/${so.muc}`}</span>}
    </>
  </header>
  // Thầy tạm đóng app (27/10): phủ cả Lộ trình; còn ca đang mở / bài kiểm tra dở ⇒ nút vào nộp cho xong (máy chủ không chặn các lệnh ấy).
  if (tq?.tamDong) return <Suspense fallback={null}><PhuTamDong token={p.token} caMo={p.coCa ? p.onThi : undefined} kiemDo={!p.coCa && kiemLam && kiem!.daTra > 0 && p.onKiemTra ? p.onKiemTra : undefined} /></Suspense>
  // Một màn thưởng phạt đang mở (bấm bộ đếm / thẻ bên / ô Thành tích): thay nội dung mục, thanh trên + menu giữ nguyên; «Quay lại» về mục cũ.
  if (tp && p.token) return <div className="dm-khung" data-muc="thuong" data-so-menu={coThuong || undefined}>{tren}<main className="tp-cam">
    <Suspense fallback={<div className="tp-cam-cho" role="status" aria-busy="true" aria-label="Đang mở" />}>
      <ManThuong man={tp.man} token={p.token} hieuUng={tp.hieuUng} onVe={() => setTp(null)} onHoc={() => { setTp(null); p.onHoc() }} anPhuKien
        onMo={(m) => { if (m !== 'phu-kien' && m !== 'cuu') moTp(m) }} />
    </Suspense>
  </main></div>
  const dongHomNay = so && <div className="dm-the"><h3>Hôm nay</h3>
    <div className="dm-dong"><span className="h" data-sac="sao"><Flame size={22} aria-hidden="true" /></span><div className="giua"><b>Chuỗi {chuoi} ngày</b><span className="mo">{tq?.chuoiNgay ? chuLuatChuoi : du ? 'hôm nay đã đủ mức' : `làm ${con} câu nữa để đủ mức`}</span></div></div>
    <div className="dm-thanh" role="progressbar" aria-label="Câu hôm nay" aria-valuemin={0} aria-valuemax={so.muc} aria-valuenow={Math.min(so.daLam, so.muc)}><i style={{ width: `${pct}%` }} /></div>
    <span className="mo">{tq?.chuoiNgay ? <>Mục tiêu hôm nay · {chuCauMuc(so)}{du ? ' · đã đủ' : ` · còn ${con} câu`}</> : <>{vuotMuc(so) ? `Đã làm ${so.daLam} câu hôm nay (mức ${so.muc})` : `${so.daLam}/${so.muc} câu hôm nay`}{du ? ' · đủ mức' : ''}</>}</span></div>
  // Thầy 26/10: hệ lười (nhóm, bậc chăm, Học thật / Đối phó, mức làm) CHỈ thầy và phụ huynh xem ⇒ em chỉ thấy chuỗi ngày + việc tiếp trung tính.
  const theViec = nhip && <div className="dm-the da-viec"><h3>Chuỗi {chuoi} ngày</h3><span className="mo">Việc tiếp: {chuViecTiepHs(nhip)}</span></div>

  // ───── LUYỆN TẬP (mục «Ôn & sửa» cũ): mỗi việc một ô to; ô đỏ (Tự sửa lỗi còn câu) là việc nên làm trước.
  if (p.muc === 'on-lai' && hs) return <div className="dm-khung" data-muc="luyen" data-so-menu={coThuong || undefined}>{tren}<main className="da-vo">
    {dauKinh(<h1 className="da-tieu">Luyện tập</h1>)}
    <OTo ten="Tự sửa lỗi" mo={p.soSua === 0 ? 'Không còn câu cần sửa' : xongSuaNay ? 'Hôm nay đã sửa xong' : coSua ? 'Câu cần sửa hôm nay' : 'Câu em làm sai'} sac="sai" Icon={Wrench} so={coSua && !xongSuaNay ? <>{suaNay}<small className="so-dv">câu</small></> : undefined} noi={coSua && !xongSuaNay} onClick={p.onChua} />
    {kiem && <OTo ten="Kiểm tra ôn tập" mo={chuKiem(kiem)} sac="tin" Icon={Target} so={<>{kiem.daTra}/{kiem.tong}<small className="so-dv">câu</small></>} onClick={(kiemLam || kiemXong) && p.onKiemTra ? p.onKiemTra : undefined} tat={p.coCa} />}
    <OTo ten="Câu đã làm" mo="Lời giải và lịch ôn từng câu" sac="dung" Icon={History} onClick={hs.onXemLai} />
    {coBt && <OTo ten="Bài tập về nhà" mo={p.soBaiTap ? 'Thầy đang giao' : 'Xem lại bài đã nộp'} sac="chu-y" Icon={PenLine} so={p.soBaiTap ? <>{p.soBaiTap}<small className="so-dv">bài</small></> : undefined} onClick={p.onBaiTap} />}
    <OTo ten="Tu luyện" mo="Luyện thêm theo chương, dạng, mức" sac="sao" Icon={Layers} onClick={hs.onTuLuyen} />
    {hs.onLuyenLai && <OTo ten="Luyện lại từ bài kiểm tra" mo="Câu sai trong các bài kiểm tra" sac="sai" Icon={RefreshCw} onClick={hs.onLuyenLai} />}
  </main></div>

  // ───── THÀNH TÍCH (mục «Kết quả» cũ + Nhịp học): chuỗi ngày, 7 ngày gần nhất, việc tiếp, huy hiệu từ số sẵn có; lối vào điểm thầy đã công bố giữ nguyên.
  if (p.muc === 'ket-qua' && hs) {
    const tuan = nhip ? nhip.ngay.slice(-7) : []
    const huy: { ten: string; sac: string; Icon: LucideIcon; co: boolean }[] = [
      { ten: du ? 'Đủ mức hôm nay' : 'Chưa đủ mức hôm nay', sac: 'dung', Icon: CheckCircle2, co: du },
      { ten: kiem?.diem != null ? `Kiểm tra ${diemChu(kiem.diem)}` : 'Kiểm tra ôn tập', sac: 'tin', Icon: Target, co: kiem?.diem != null },
      { ten: '7 ngày liền', sac: 'sao', Icon: Flame, co: chuoi >= 7 },
      { ten: '30 ngày liền', sac: 'chu-y', Icon: Trophy, co: chuoi >= 30 },
    ]
    return <div className="dm-khung" data-muc="thanh-tich" data-so-menu={coThuong || undefined}>{tren}<main className="da-vo">
      {dauKinh(<h1 className="da-tieu">Thành tích</h1>)}
      <div className="da-cot">{/* ngang / máy tính: hai cột (chuỗi · tuần · việc tiếp | huy hiệu · điểm); dọc: display: contents */}
      <div className="da-lua"><Bi cam={chuoi > 0 ? 'lua' : so && so.daLam === 0 ? 'ngu' : 'chao'} size={72} /><div><b>{chuoi} ngày</b><span>{tq?.chuoiNgay ? `Chuỗi ngày · ${chuLuatChuoi}` : <>Chuỗi ngày đủ mức{so && !du ? ` · làm ${con} câu nữa để đủ mức hôm nay` : du ? ' · hôm nay đã đủ' : ''}</>}</span></div></div>
      {/* có chuỗi ngày theo bài (thưởng phạt) ⇒ lịch / việc tiếp theo chuỗi «đủ mức» cũ ẩn (hai cách đếm khác nhau không đứng cạnh nhau); lịch ở ô «Chuỗi ngày» */}
      {!tq?.chuoiNgay && tuan.length > 0 && <ol className="da-tuan" aria-label="7 ngày gần nhất">{tuan.map((x) => { const nay = x.ngay === nhip!.homNay, d = x.muc > 0 && x.lam >= x.muc
        return <li key={x.ngay} aria-label={`${nay ? 'Hôm nay' : thuNgan(x.ngay)}: ${d ? 'đủ mức' : `${x.lam}/${x.muc} câu`}`}><i data-d={d || undefined} data-nay={nay || undefined}>{d && <Check size={18} strokeWidth={3} aria-hidden="true" />}</i>{nay ? 'Nay' : thuNgan(x.ngay)}</li> })}</ol>}
      {!tq?.chuoiNgay && theViec}
      </div>
      <div className="da-cot">
      {coThuong ? <>
        <OTo ten="Huy hiệu" mo="Huy hiệu đã có và sắp đạt" sac="sao" Icon={Trophy} onClick={() => moTp('huy-hieu')} />
        {tq?.chuoiNgay && <OTo ten="Chuỗi ngày" mo="Lịch chuỗi, bình giữ chuỗi, mốc" sac="chu-y" Icon={Flame} onClick={() => moTp('chuoi')} />}
        {tq?.bat.giai !== false && <OTo ten="Giải tuần" mo="Bảng nhóm tuần này" sac="tin" Icon={Route} onClick={() => moTp('giai')} />}
        {tq?.bat.banBe !== false && <OTo ten="Học cùng bạn" mo="Chuỗi đôi với bạn học cùng" sac="dung" Icon={GraduationCap} onClick={() => moTp('ban')} />}
        {tq?.bat.kimCuong && <OTo ten="Thử thách Kim cương" mo="10 câu khó của chuyên đề em đã vững" sac="tin" Icon={Award} onClick={() => moTp('kim-cuong')} />}
        <OTo ten="Cửa hàng" mo="Tinh thể và bình giữ chuỗi" sac="sao" Icon={Sparkles} so={tq?.tinhThe !== undefined ? <>{tq.tinhThe}<span className="sr-only"> tinh thể</span></> : undefined} onClick={() => moTp('cua-hang')} />
      </> : <div className="da-huy">{huy.map(({ ten, sac, Icon, co }) => <div key={ten}><i data-sac={co ? sac : undefined}>{co ? <Icon size={28} aria-hidden="true" /> : <Lock size={26} aria-hidden="true" />}</i>{ten}</div>)}</div>}
      <h2 className="da-tieu-nho">Điểm thầy đã công bố</h2>
      <OTo ten="Ca kiểm tra" mo="Điểm và lời giải ca đã công bố" sac="tin" Icon={LineChart} onClick={hs.onLichSu} />
      {hs.onKetQua && <OTo ten="Kết quả bài đã nộp" mo="Điểm và báo cáo đã công bố" sac="chu-y" Icon={ClipboardCheck} onClick={hs.onKetQua} />}
      </div>
    </main></div>
  }

  // ───── LỘ TRÌNH: con đường chặng của hôm nay + nút việc sau (đúng thứ tự «Một trang»).
  const nut: Nut[] = []
  // Mỗi nút kèm THẺ BẬT RA (thầy 27/10): tên · dòng phụ · nút việc chính GỌI ĐÚNG lệnh cũ. Số nguyên tử của chặng phụ thuộc đúng / sai từng câu ⇒ không ghi «+N».
  const tenBaiThe = p.tenBai || 'Bài học hôm nay'
  let dauChang = 0
  const CHU_KHOA_KT = 'Làm Kiểm tra ôn tập trước để mở khoá'
  const nutKiem: Nut | null = !kiem ? null : { k: 'kiem', loai: 'kiem', tt: ktDau && kiemXong && kiem.nopLuc !== null ? 'xong' : chinh === 'kiem' ? 'dang' : 'mo',
    bong: chinh === 'kiem' && kiemLam ? (khoaKt && kiem.daTra === 0 ? 'Kiểm tra ôn tập' : kiem.daTra > 0 ? 'Làm tiếp' : 'Bắt đầu') : undefined,
    // vòng = chặng ĐÃ CHỐT / tổng chặng (cùng nguồn với màn bài «3/5 chặng đã chốt»); máy chủ cũ chưa gửi số chặng ⇒ theo số câu đã trả lời
    ...(kiemLam && kiem.soChang > 0 ? { soDoan: kiem.soChang, vong: kiem.changChot !== undefined ? (100 * kiem.changChot) / kiem.soChang : kiem.tong > 0 ? (100 * kiem.daTra) / kiem.tong : 0 } : {}),
    ten: `Kiểm tra ôn tập: ${chuKiem(kiem)}`, pop: { tieu: 'Kiểm tra ôn tập', phu: chuKiem(kiem),
      nut: (kiemLam || kiemXong) && p.onKiemTra ? { chu: kiemXong ? 'Xem kết quả' : kiem.daTra > 0 ? 'Làm tiếp' : 'Bắt đầu', onClick: p.onKiemTra, tat: p.coCa } : undefined } }
  if (nutKiem) nut.push(nutKiem) // Kiểm tra ôn tập LUÔN đứng đầu hành trình (thầy 27/10)
  let nutSua: Nut | null = null
  if (coSua && !p.ngayKiem && khoaKt) nutSua = { k: 'sua', loai: 'sua', tt: 'khoa', ten: 'Tự sửa lỗi: khoá đến khi làm xong Kiểm tra ôn tập', pop: { tieu: 'Tự sửa lỗi', phu: CHU_KHOA_KT } }
  else if (coSua && !p.ngayKiem && xongSuaNay) nutSua = { k: 'sua', loai: 'sua', tt: 'xong', ten: 'Tự sửa lỗi: hôm nay đã sửa xong',
    pop: { tieu: 'Tự sửa lỗi', phu: 'Hôm nay em đã sửa đủ phần của mình. Những câu còn lại để ngày mai nhé.' } } // thầy 29/10: xong phần hôm nay ⇒ không cho sửa thêm
  else if (coSua && !p.ngayKiem) nutSua = { k: 'sua', loai: 'sua', tt: chinh === 'sua' ? 'dang' : 'mo', dem: choSoSua ? undefined : suaNay || undefined, bong: chinh === 'sua' ? 'Sửa lỗi' : undefined, ten: `Tự sửa lỗi: hôm nay còn ${suaNay} câu`,
    pop: { tieu: 'Tự sửa lỗi', phu: `Hôm nay còn ${suaNay} câu cần sửa`, nut: { chu: 'Sửa ngay', onClick: p.onChua } } }
  if (!p.ngayKiem) chang.forEach((c, i) => {
    if (nutSua && i === mocSua) nut.push(nutSua)
    const dang = c.tt === 'dang' && chinh === 'hoc' || c.tt === 'dang' && chinh === 'ca'
    const dangDoNay = c.tt === 'dang' && so?.changDangDo === i + 1
    const thu = `Chặng ${i + 1} / ${chang.length}`, conChang = so ? Math.max(dangDoNay ? 1 : 0, Math.min(c.co, dauChang + c.co - so.daLam)) : c.co
    // vòng ĐOẠN (thầy 30/10): chặng đang dở trên máy ⇒ đúng số câu thật của chặng + số câu đã nộp; không ⇒ ranh 6 câu của Lộ trình (đã làm − đầu chặng)
    const cauMay = so?.cauChang !== undefined && so.chang === i + 1
    const soDoan = cauMay ? so!.cauChang! : c.co, daDoan = cauMay ? (so!.daCauChang ?? 0) : so ? Math.max(0, Math.min(c.co, so.daLam - dauChang)) : 0
    dauChang += c.co
    if (khoaKt && c.tt !== 'xong') { nut.push({ k: `c${i}`, loai: 'hoc', tt: 'khoa', ten: `Chặng ${i + 1}: khoá đến khi làm xong Kiểm tra ôn tập`, pop: { tieu: tenBaiThe, phu: `${thu} · ${CHU_KHOA_KT}` } }); return }
    if (khoaSua && i >= mocSua && c.tt !== 'xong') { nut.push({ k: `c${i}`, loai: 'hoc', tt: 'khoa', ten: `Chặng ${i + 1}: khoá đến khi sửa xong lỗi hôm nay`, pop: { tieu: tenBaiThe, phu: `${thu} · Sửa xong ${conPhan} lỗi hôm nay để mở chặng tiếp` } }); return }
    nut.push(c.tt === 'xong' ? { k: `c${i}`, loai: 'hoc', tt: 'xong', cau: c.co, ten: `Chặng ${i + 1}: đã xong`,
      pop: { tieu: tenBaiThe, phu: `${thu} · đã xong`, nut: hs ? { chu: 'Xem lại', onClick: hs.onXemLai } : undefined } }
      : c.tt === 'dang' ? { k: `c${i}`, loai: 'hoc', tt: 'dang', ten: nutHoc, bong: dang && chinh === 'hoc' && !(p.hetCau && !dangDoNay) ? bongHoc(c.phan > 0, p.loaiNgay) : undefined, vong: chinh === 'sua' ? undefined : c.phan,
        soDoan, daDoan, khoaVong: `ddh.vong-chang.${ngayVn(Date.now())}.${sbdPhien() ?? ''}.${i}`,
        pop: { tieu: tenBaiThe, phu: (p.khoaHoc || p.hetCau) && !dangDoNay ? nutHoc : `${thu} · ${conChang} câu`, nut: { chu: p.hetCau && p.kho?.caThi && !dangDoNay ? 'Chờ ca kiểm tra đóng' : c.phan > 0 ? 'Tiếp tục' : 'Bắt đầu', onClick: p.onHoc, tat: p.khoaHoc && !dangDoNay } } }
      : { k: `c${i}`, loai: 'hoc', tt: 'khoa', ten: `Chặng ${i + 1}: chưa mở`, pop: { tieu: tenBaiThe, phu: `${thu} · Hoàn thành các chặng trước để mở khoá` } })
  })
  if (nutSua && mocSua >= chang.length) nut.push(nutSua) // hết chặng mới (hoặc ngày không có chặng) ⇒ sau chặng cuối
  // TUẦN TỰ TỪ TRÊN XUỐNG (thầy 29/10 «Làm tuần tự từ trên xuống dưới, chặng trước làm xong thì mở khoá chặng sau»): nút Tự sửa lỗi đứng SAU các chặng trước mốc ⇒ còn chặng
  // phía trên chưa xong thì nút khoá xám (trước đây vẫn bấm được ngay dù chặng 1 chưa làm). Chặng sau nút Sửa lỗi đã khoá cho tới khi sửa xong (khoaSua). Đủ mức rồi (du) thì
  // việc chính đã nhảy sang Sửa lỗi ⇒ không khoá. Bài tập về nhà có hạn riêng ⇒ không khoá theo chặng.
  if (nutSua && nutSua.tt !== 'xong' && nutSua.tt !== 'khoa' && !du && nut.slice(0, nut.indexOf(nutSua)).some((x) => x.loai === 'hoc' && x.tt !== 'xong'))
    Object.assign(nutSua, { tt: 'khoa', dem: undefined, bong: undefined, ten: 'Tự sửa lỗi: làm xong các chặng phía trên để mở khoá', pop: { tieu: 'Tự sửa lỗi', phu: 'Em làm xong các chặng phía trên thì Tự sửa lỗi mở khoá nhé.' } })
  if (coBt && !p.ngayKiem) nut.push({ k: 'bt', loai: 'bt', tt: chinh === 'bt' ? 'dang' : 'mo', dem: p.soBaiTap || undefined, bong: chinh === 'bt' ? 'Làm bài' : undefined, ten: 'Bài tập về nhà',
    pop: { tieu: 'Bài tập về nhà', phu: p.soBaiTap ? `${p.soBaiTap} bài thầy đang giao` : 'Xem lại bài đã nộp', nut: { chu: p.soBaiTap ? 'Làm bài' : 'Xem bài', onClick: p.onBaiTap } } })
  // TỔNG CÂU HÔM NAY trên thẻ mức (thầy 02/11: «Còn 5 câu cần sửa và chặng 2 nhưng trên kia lại báo 8/12. Tôi muốn báo tổng số câu của tất cả ngày. Đủ thì
  // dung dịch đổi màu»): cộng MỌI việc hôm nay — câu học (đến mức, phần vượt mức không cộng) + câu Tự sửa lỗi phần hôm nay (đã sửa + còn lại) + câu Kiểm tra
  // ôn tập của hôm nay (chưa quá hạn; đã nộp ⇒ tính đủ). Chỉ để HIỆN số + đổi màu dung dịch — thứ tự / khoá việc vẫn theo `du` (đủ mức câu học) như cũ.
  const ktNgay = !!kiem && kiem.homNay && (kiem.trangThai === 'can_lam' || kiem.trangThai === 'da_nop')
  const daSuaNgay = typeof daSuaNay === 'number' ? daSuaNay : 0
  const tongSuaNay = coSua && !p.ngayKiem ? suaNay + daSuaNgay : 0 // cùng số «còn N câu cần sửa» của nút chính
  const tongNgay = (so && !p.ngayKiem ? so.muc : 0) + tongSuaNay + (ktNgay ? kiem!.tong : 0)
  const daNgay = (so && !p.ngayKiem ? Math.min(so.daLam, so.muc) : 0) + (tongSuaNay ? daSuaNgay : 0) + (ktNgay ? (kiem!.nopLuc !== null ? kiem!.tong : kiem!.daTra) : 0)
  const coTong = tongNgay > 0 && (!!so || !!p.ngayKiem)
  const duNgay = coTong && daNgay >= tongNgay
  const tiepTheo = [kiemLam && 'Kiểm tra ôn tập', coSua && !xongSuaNay && 'Tự sửa lỗi', coBt && !!p.soBaiTap && 'Bài tập về nhà'].filter(Boolean) as string[]
  const hocThem = ((chinh === 'sua' && du) || chinh === 'bt' || (chinh === 'kiem' && !p.ngayKiem)) && !p.khoaHoc && !khoaKt
  // Bi nói việc chính của hôm nay (cùng thứ tự `chinh`); xong hết ⇒ Bi mừng. Chưa có số (đang tải) ⇒ chưa hiện, không đoán.
  // [cảm xúc, lời, loại]: loại làm khoá «nhắc một lần» (số câu còn lại đổi theo từng câu KHÔNG tính là nội dung mới); 'ca' = lời quan trọng, luôn hiện.
  const loiBi: [CamBi, string, string] | null = chinh === 'ca' ? ['chao', 'Có ca kiểm tra đang mở. Em vào ca trước nhé.', 'ca']
    : p.ngayKiem ? ['chao', 'Hôm nay là ngày Kiểm tra ôn tập. Em làm bài nhé.', 'ngay-kiem']
    : khoaKt ? ['chao', 'Hôm nay có Kiểm tra ôn tập. Em làm xong là mở khoá các chặng nhé.', 'kt-khoa']
    : !so ? null
    : toiSua && !du ? ['chao', `Tới chặng Tự sửa lỗi rồi! Em sửa ${suaNay} câu sai rồi học tiếp nhé.`, 'toi-sua']
    : du ? (tiepTheo.length ? ['vui', `Đủ mức rồi! Giờ đến ${tiepTheo[0]} nhé.`, `du-${tiepTheo[0]}`] : ['mung', 'Xong hết việc hôm nay! Em giỏi lắm.', 'xong'])
    : so.daLam === 0 ? ['chao', 'Chào em! Hôm nay bắt đầu từ chặng Học nhé.', 'bat-dau'] : ['chao', `Học tiếp nhé! Còn ${con} câu nữa là đủ mức hôm nay.`, 'hoc-tiep']

  // Khoá nhắc một lần = ngày | cấp | lý do ⇒ lên cấp là hiện lại một lần; cấp 4–5 hiện MỖI lần mở Lộ trình, không tự ẩn (thầy quyết 4). (loiCap tính ở trên.)
  const loiLuaBi0: [CamBi, string, string] | null = loiCap && kLua ? [kLua.cap === 0 ? 'vui' : loiBi?.[0] ?? 'chao', loiCap, `lua${kLua.cap}-${kLua.lyDo}`] : loiBi
  // CHÂN NGÔN (thầy 01/11 tối «lúc nào vui vẻ thêm các câu chân ngôn chân lý»): lời VUI (vui · mừng) ⇒ 1/3 lượt thay bằng chân ngôn nguyên văn, đặt trong «»
  const cn = loiLuaBi0 && (loiLuaBi0[0] === 'vui' || loiLuaBi0[0] === 'mung') && so ? chanNgon(soLuot(so.daLam, tLua)) : null
  // thầy 03/11 «Bỏ dấu << ở hai đầu bong bóng của mol đi nhé»: chân ngôn không còn «…» (vẫn nghiêng — data-chan-ngon)
  const loiLuaBi: [CamBi, string, string] | null = cn && loiLuaBi0 ? [loiLuaBi0[0], cn, `${loiLuaBi0[2]}-cn`] : loiLuaBi0

  // Bi đứng cạnh đường (bản vẽ nâng cấp 27/10) khi đường có ≥ 2 chặng ⇒ lời Bi phía trên chỉ còn bong bóng (không hai Bi).
  // 01/11 tối (thầy «chữ hiện bong bóng trên đầu Mol»): có Mol cạnh đường + lời theo cấp ⇒ bong bóng TRÊN ĐẦU Mol ở mọi hướng màn (thay thẻ riêng ở trên)
  return <div ref={khung} className="dm-khung" data-so-menu={coThuong || undefined} style={{ '--tren-cao': `${trenCao}px` } as CSSProperties}>{tren}
    <main className="da-vo" aria-busy={!so && p.dangTai}><div className="kb-cot-trai">
      {/* THẺ BÀI (thầy 27/10 «thu vào bị giật… cho thanh màu xanh xuống kẻo chèn vào ống nghiệm»): thẻ đầy đủ ĐỨNG YÊN trong luồng (giữ chỗ, không nhảy cuộn);
          cuộn qua ⇒ DẢI GỌN 54px (tên bài · thanh mảnh · chặng) dính dưới hàng bộ đếm, cross-fade opacity + translateY 200 ms; sau dải là nền trang đặc + mép mờ
          ⇒ nút chặng / linh vật trượt khuất gọn dưới dải. Dải nằm trong khối cao 0 ⇒ không chiếm chỗ. */}
      {dauKinh(<><p>{ngayTuan()}{hs?.lop ? <span className="kb-lop">{hs.lop}</span> : null}</p><h1>Chào {p.ten || 'em'}</h1></>, true)}
      {/* HỆ KÍNH (thầy chốt 02/11): thẻ «Mức hôm nay» — số lớn + bình tam giác (thay thẻ bài). Tên bài + việc + chặng giữ nguyên nguồn cũ. */}
      <section className="kb-hero" data-du={duNgay || undefined} data-loai={!p.ngayKiem ? p.loaiNgay : undefined} aria-label={`${!p.ngayKiem && p.loaiNgay ? NHAN_LOAI_NGAY[p.loaiNgay] : 'Tổng câu hôm nay'}${coTong ? `: ${daNgay}/${tongNgay}` : ''}${duNgay ? ' · đã xong' : ''}${p.viec ? ` · ${chuViecBai(p.viec, so)}` : ''}`} aria-busy={!coTong && p.dangTai}>
        {loiLuaBi && <LoiBi key={`g${loiLuaBi[2]}`} cam={loiLuaBi[0]} loi={loiLuaBi[1]} cap={capLua} chanNgon={!!cn} goc />}
        <div className="kb-hero-chu">
          <span className="kb-nhan">{duNgay ? 'Xong hết hôm nay' : p.ngayKiem ? 'Ngày Kiểm tra ôn tập' : p.loaiNgay ? NHAN_LOAI_NGAY[p.loaiNgay] : 'Tổng câu hôm nay'}</span>
          {coTong ? <div className="kb-so">{daNgay}<small>/{tongNgay} câu</small></div> : <span className="mot-xuong" aria-hidden="true" />}
          <p className="kb-dong-hero" role={!coTong && p.dangTai ? 'status' : undefined}>{!coTong ? (p.dangTai ? 'Đang tải bài học hôm nay…' : '') : duNgay ? 'Xong hết việc hôm nay — tới điểm tương đương, dung dịch đã hồng!' : p.ngayKiem || khoaKt ? `Còn ${tongNgay - daNgay} câu · làm Kiểm tra ôn tập trước, rồi mới học chặng.` : `Còn ${tongNgay - daNgay} câu nữa là dung dịch đổi màu.`}</p>
        </div>
        {/* vạch trên bình = ranh từng việc theo thứ tự: Kiểm tra ôn tập · từng chặng · Tự sửa lỗi */}
        <BinhHomNay da={daNgay} muc={tongNgay} ranh={chang.reduce<number[]>((a, c) => [...a, (a[a.length - 1] ?? 0) + c.co], ktNgay && !p.ngayKiem ? [kiem!.tong] : [])} />
        {coThuong && tq && <div className="kb-chip-h">
          <button type="button" className="kb-chip" data-k="lua" onClick={() => moTp('chuoi')} aria-label={`Chuỗi ${chuoi} ngày`}><span><Flame size={18} aria-hidden="true" />{chuoi} ngày</span></button>
          {tq.nguyenTuHomNay !== undefined && <button type="button" className="kb-chip" data-k="nt" onClick={() => moTp('nhiem-vu')} aria-label={`${tq.nguyenTuHomNay} nguyên tử hôm nay`}><span><IcNguyenTu />{tq.nguyenTuHomNay}</span></button>}
          {tq.tinhThe !== undefined && <button type="button" className="kb-chip" data-k="tt" onClick={() => moTp('cua-hang')} aria-label={`${tq.tinhThe} tinh thể`}><span><IcTinhThe />{tq.tinhThe}</span></button>}
        </div>}
      </section>
      {/* hệ Kính: băng ca kiểm tra / đủ mức đứng DƯỚI thẻ mức (đầu trang luôn là lời chào) */}
      {chinh === 'ca' && <section className="da-bang" data-sac="tin" aria-label="Ca kiểm tra đang mở"><span className="h"><ClipboardCheck size={26} aria-hidden="true" /></span><div className="giua"><b>Ca kiểm tra đang mở</b><span className="mo">Nhập mã ca và mật khẩu thầy cung cấp để vào phòng kiểm tra.</span></div><button type="button" className="nut-to" onClick={p.onThi}>Vào ca kiểm tra</button></section>}
      {/* 28/10 + 02/11: xong hết ⇒ thẻ chúc mừng; còn việc ⇒ «Đủ x/y câu hôm nay! · Tiếp theo: …»; vượt mức ⇒ «Đủ mức hôm nay! …» (lam-bai.ts vuotMuc). */}
      {du && chinh !== 'ca' && so && <section className="da-bang" data-sac="dung" aria-label={tiepTheo.length ? 'Đủ mức hôm nay' : 'Hoàn thành bài hôm nay'}><span className="h"><Check size={26} strokeWidth={3} aria-hidden="true" /></span><div className="giua">{tiepTheo.length
        ? <><b>{vuotMuc(so) ? `Đủ mức hôm nay! Đã\u00a0làm\u00a0${so.daLam}\u00a0câu\u00a0(mức\u00a0${so.muc})` : `Đủ ${so.daLam}/${so.muc} câu hôm nay!`}</b><span className="mo">Tiếp theo: {tiepTheo.join(', rồi ')}</span></>
        : <><b>Chúc mừng, em đã hoàn thành bài hôm nay!</b><span className="mo">{so.daLam} câu học{daSuaNay ? ` · ${daSuaNay} câu sửa` : ''}{kiem?.homNay && kiem.nopLuc !== null ? ` · Kiểm tra ôn tập ${kiem.diem !== null ? `${diemChu(kiem.diem)}/10` : 'đã nộp'}` : ''}</span></>}</div></section>}
      {!p.ngayKiem && <i ref={datMocBai} className="da-bai-moc" aria-hidden="true" />}
      {!p.ngayKiem && (dinh || daDinh.current) && <div className="da-dai-dinh" data-hien={dinh || undefined} aria-hidden="true">
        <div className="da-dai"><b>{p.tenBai || 'Bài học hôm nay'}</b>
          {chang.length > 0 && <span className="da-dai-tien"><i><s style={{ width: `${Math.round((100 * xongChang) / chang.length)}%` }} /></i>{xongChang}/{chang.length} chặng</span>}</div>
      </div>}
      {/* 03/11: Mol nói ở góc trái thẻ đầu (kb-mol) */}
      {p.ghi.map((g) => <p key={g} className="da-ghi">{g}</p>)}
      {p.token && chinh !== 'ca' && laSamsungInternet() && <Suspense fallback={null}><NhacSamsung /></Suspense>}
      {/* 28/10: Sảnh chưa về ⇒ chưa vẽ đường, báo đang tải. */}
      {/* NÚT CHÍNH (viên thuốc lớn + ô bánh quy 12 múi): đúng việc của nút đang làm trên danh sách (cùng onClick thẻ bật ra cũ) */}
      {(() => { const d = nut.find((n) => n.tt === 'dang' && n.pop.nut?.onClick && !n.pop.nut.tat); if (!d) return null; const Ic = HINH_NUT[d.loai]
        return <button type="button" className="kb-cta" data-sac={d.loai === 'hoc' && p.loaiNgay === 'sua' && !p.ngayKiem ? 'sai' : SAC_POP[d.loai]} onClick={() => { cham(); d.pop.nut!.onClick!() }}>
          <span className="kb-banh" aria-hidden="true"><svg viewBox="0 0 100 100"><path d={BANH_12} fill="currentColor" stroke="currentColor" strokeWidth={0} /></svg><Ic size={24} strokeWidth={2.6} /></span>
          <span className="kb-giua"><ChuNutChinh v={d.bong ?? d.pop.nut!.chu} t={d.loai === 'hoc' ? ns ? `Sửa nhóm ${ns.i}` : tenDong(d, nut.slice(0, nut.indexOf(d) + 1).filter((x) => x.loai === 'hoc').length) : d.pop.tieu} phu={phuDong(d)} bai={d.loai === 'hoc' ? ns?.ten ?? (p.tenBai || 'Bài học hôm nay') : undefined} /></span>
          <ChevronRight size={22} aria-hidden="true" /></button> })()}
      {p.goi7 && !p.ngayKiem && (p.loaiNgay === 'sua' || p.goi7.goi.some(g => g.quaHan && g.con > 0)) && <Suspense fallback={null}><NhomSuaHomNay g={p.goi7} token={p.token} /></Suspense>}
      {!so && p.dangTai && !p.ngayKiem ? null : nut.length > 0 && <section className="kb-viec" aria-label="Việc hôm nay"><h2>Việc hôm nay<span>{nut.filter((n) => n.tt === 'xong').length}/{nut.length} xong</span></h2>
        <DanhSachViec ds={nut} moDi={chinh === 'ca'} moKhoa={moKt ? 'kt' : moSua ? 'sua' : undefined} /></section>}
      {so && !p.dangTai && !nut.length && <ViecTrong />}
      </div><div className="kb-cot-phai">
      {hs?.lop && laLop12(hs.lop) && <Suspense fallback={null}><DemNguocThi lop={hs.lop} /></Suspense>}
      {p.goi7?.lichBai ? <Suspense fallback={null}><LichBaiHs g={p.goi7} /></Suspense> : null}
      {coThuong && <TheBanLoTrinh token={p.token} bat={tq?.bat.banBe} onMo={() => moTp('ban')} />}
      {!(!so && p.dangTai) && <TheRuong ds={nut} token={p.token} tq={tq} onNhiemVu={() => moTp('nhiem-vu')} />}
      {hocThem && <button type="button" className="mot-lien-ket" onClick={p.onHoc}>Học thêm câu mới<ChevronRight size={18} aria-hidden="true" /></button>}
    </div>
    </main>
    <aside className="dm-ben" aria-label="Tóm tắt">
      {dongHomNay}
      {/* thưởng phạt (tp-4): Giải tuần + Nhiệm vụ ngày thay thẻ «việc tiếp» cũ */}
      {coThuong && coBen && <Suspense fallback={null}><TheBenThuong token={p.token} onMo={moTp} /></Suspense>}
      <div className="dm-the"><h3>Luyện tập</h3>
        <button type="button" className="dm-dong" onClick={p.onChua}><span className="h" data-sac="sai"><Wrench size={20} aria-hidden="true" /></span><span className="giua"><b>Tự sửa lỗi</b></span>{coSua && (xongSuaNay ? <span className="so"><Check size={18} strokeWidth={3} aria-hidden="true" /><span className="sr-only">Hôm nay đã sửa xong</span></span> : <span className="so">{suaNay}<small className="so-dv">câu</small></span>)}</button>
        {kiem && <button type="button" className="dm-dong" onClick={(kiemLam || kiemXong) && p.onKiemTra ? p.onKiemTra : undefined} disabled={p.coCa || !((kiemLam || kiemXong) && p.onKiemTra)}><span className="h" data-sac="tin"><Target size={20} aria-hidden="true" /></span><span className="giua"><b>Kiểm tra ôn tập</b></span><span className="so">{kiem.daTra}/{kiem.tong}<small className="so-dv">câu</small></span></button>}
        {hs && <button type="button" className="dm-dong" onClick={hs.onXemLai}><span className="h" data-sac="dung"><History size={20} aria-hidden="true" /></span><span className="giua"><b>Câu đã làm</b></span></button>}
      </div>
      {!coThuong && theViec}
    </aside>
  </div>
}

const tenBuoi = (b: BuoiCuaEm) => { const n = ngayGon(b.ten); return `${n === b.ten ? b.ten : `Buổi ${n}`}${b.lop ? ` · ${b.lop}` : ''}` }

/** KHỐI ĐIỂM DANH đầu menu (bản vẽ hs-mot-trang-menu; MENU 6 MỤC thầy 27/10): CÙNG hook với thẻ nổi cũ (useDiemDanhHs — cùng lệnh gửi, cùng luồng QR `?diem-danh=`).
 *  CHỈ hiện khi có buổi học đang mở: em chưa điểm danh ⇒ thẻ nổi chàm (màu điểm danh đang có), 6 ô mã (một ô nhập thật phủ trên) + nút Điểm danh · đã điểm danh ⇒ một dòng
 *  xanh (+ giờ em vừa bấm trên máy này) · không có buổi ⇒ ẨN HẲN (trả null). App chưa có máy quét QR riêng ⇒ em quét QR bằng máy ảnh điện thoại như cũ. */
type DiemDanh = ReturnType<typeof useDiemDanhHs>
const coKhoiDiemDanh = (tt: DiemDanh['tt']) => tt.loai === 'cho' || tt.loai === 'xong' || !!tt.daXong
function KhoiDiemDanh({ tt, ma, setMa, loi, setLoi, dangGui, gui, oNhap, token }: Pick<DiemDanh, 'tt' | 'ma' | 'setMa' | 'loi' | 'setLoi' | 'dangGui' | 'gui' | 'oNhap'> & { token: string }) {
  if (tt.loai === 'cho') return (
    <form className="tr-dd" aria-label="Điểm danh buổi học" onSubmit={(e) => { e.preventDefault(); void gui(ma) }}>
      <div className="tr-dd-dau"><span className="tr-dd-h" aria-hidden="true"><QrCode size={20} /></span><b>Điểm danh buổi học</b>{tt.buoi?.lop && <span>{tt.buoi.lop}</span>}</div>
      <label className="tr-dd-o">
        <span className="sr-only">Mã 6 số trên máy chiếu</span>
        <input ref={oNhap} value={ma} onChange={(e) => { setMa(e.target.value.replace(/\D/g, '').slice(0, 6)); setLoi('') }}
          inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*" maxLength={6} aria-invalid={!!loi} aria-describedby={loi ? 'tr-dd-loi' : undefined} />
        {Array.from({ length: 6 }, (_, i) => <span key={i} aria-hidden="true" data-co={ma[i] ? '' : undefined} data-dang={i === Math.min(ma.length, 5) || undefined}>{ma[i] ?? ''}</span>)}
      </label>
      <button type="submit" className="tr-dd-nut" disabled={dangGui || ma.length !== 6}>{dangGui ? 'Đang gửi…' : 'Điểm danh'}</button>
      {loi && <p id="tr-dd-loi" className="tr-dd-loi" role="alert">{loi}</p>}
      <p className="tr-dd-phu">{tt.buoi && <><b>{tenBuoi(tt.buoi).split(' · ')[0]}</b> · </>}Gõ mã 6 số trên máy chiếu, hoặc quét mã QR</p>
    </form>
  )
  const xong = tt.loai === 'xong' ? tt : tt.daXong ? { buoi: tt.daXong, luc: 0 } : null
  if (!xong) return null
  return (
    <section className="tr-dd" data-tt="xong" aria-label="Điểm danh buổi học">
      <div className="tr-dd-dau"><CheckCircle2 size={20} aria-hidden="true" /><b>Đã điểm danh</b>{xong.luc > 0 && <span>{hai(new Date(xong.luc).getHours())}:{hai(new Date(xong.luc).getMinutes())}</span>}</div>
      <p className="tr-dd-phu">{tenBuoi(xong.buoi)}</p>
      <NutVaoBpu token={token} buoiId={xong.buoi.id} />
    </section>
  )
}

/** MENU DỌC MÉP PHẢI — MENU 6 MỤC (thầy 27/10: «gọn lại còn tối đa 6 mục, đẹp tinh tế khoa học, học sinh dễ thấy dễ hiểu»; kiểu menu bên Duolingo web).
 *  Đầu menu: logo «Đỗ Đại Học» + CHUÔNG THÔNG BÁO (ĐÚNG phần tử ThongBaoHocSinh — giữ hành vi, số chưa đọc). Dưới: khối Điểm danh (chỉ khi có buổi mở),
 *  rồi đúng 6 mục, mỗi mục một ô biểu tượng màu riêng: Lộ trình · Luyện tập · Thành tích · Ca kiểm tra (= Vào ca kiểm tra; ẩn khi ca đang mở vì Lộ trình đã
 *  có nút vào ca) · Hỏi A.I Đỗ Đại Học (mở ĐÚNG tấm chat của BongBongAiDdh, sự kiện `ddh:mo-ai`; chỉ hiện khi kênh bật — `<html data-ai-ddh>`) · Cài đặt
 *  (trượt sang tấm con: Âm thanh, Rung, Cập nhật bài học, Của em — cùng nút, cùng hành vi cũ).
 *  Buổi mở mà em chưa điểm danh ⇒ nút «Thêm» thò «Điểm danh»; QR xong / hỏng ⇒ menu tự mở. Chạm ngoài / chọn / Esc / cuộn ⇒ thu.
 *  Menu luôn gắn trong DOM (ẩn bằng CSS) để tấm thông báo mở từ đây không mất. */
// Biểu tượng chỉ màn «Trong» dùng — vẽ nội tuyến (nét như lucide) để không kéo thêm vào mảnh biểu tượng chung của app thầy / màn thi (luật tốc độ).
const IconNet = ({ d, size = 20 }: { d: string[]; size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d.map((x) => <path key={x} d={x} />)}</svg>
const Volume2 = ({ size }: { size?: number }) => <IconNet size={size} d={['M11 5 6 9H2v6h4l5 4z', 'M15.5 8.5a5 5 0 0 1 0 7', 'M19 5a10 10 0 0 1 0 14']} />
const Vibrate = ({ size }: { size?: number }) => <IconNet size={size} d={['m2 8 2 2-2 2 2 2-2 2', 'm22 8-2 2 2 2-2 2 2 2', 'M9 5h6a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z']} />
const Luoi4 = ({ size }: { size?: number }) => <IconNet size={size} d={['M4 4h6v6H4z', 'M14 4h6v6h-6z', 'M14 14h6v6h-6z', 'M4 14h6v6H4z']} />
const BanhRang = ({ size }: { size?: number }) => <IconNet size={size} d={['M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z', 'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0']} />
const MuiTrai = ({ size }: { size?: number }) => <IconNet size={size} d={['m15 18-6-6 6-6']} />

/** Công tắc phản hồi ở menu (thầy 26/10): «Âm thanh» / «Rung» Bật–Tắt — chỉ đọc/ghi localStorage ('ddh.am' / 'ddh.rung' = 'tat' khi tắt); tiếng và rung
 *  ở mảnh màn luyện tự đọc khoá này (không kéo am-thanh / rung vào nhóm mở app). Mặc định bật. */
function CongTac({ khoa, ten, Icon, sac }: { khoa: 'ddh.am' | 'ddh.rung' | typeof KHOA_AM_AN_MUNG; ten: string; Icon: (p: { size?: number }) => ReactNode; sac: string }) {
  // «Tiếng ăn mừng» (bộ hiệu ứng ăn mừng 02/11): MẶC ĐỊNH TẮT — chỉ 'bat' mới kêu; hai công tắc cũ mặc định bật ('tat' khi tắt).
  const tatSan = khoa === KHOA_AM_AN_MUNG
  const [bat, setBat] = useState(() => { try { return tatSan ? localStorage.getItem(khoa) === 'bat' : localStorage.getItem(khoa) !== 'tat' } catch { return !tatSan } })
  return <button type="button" role="switch" aria-checked={bat} className="tr-menu-muc tr-menu-cong" onClick={() => {
    const v = !bat
    setBat(v)
    try { if (tatSan) { if (v) localStorage.setItem(khoa, 'bat'); else localStorage.removeItem(khoa) } else if (v) localStorage.removeItem(khoa); else localStorage.setItem(khoa, 'tat') } catch { /* máy chặn lưu: chỉ đổi trong phiên này */ }
    if (v && tatSan) void napAnMung().then((m) => m?.thuTieng(), () => {}) // kêu thử một tiếng chuông ngắn
    // 27/10: bật «Rung» ⇒ rung thử ngay một nhịp để em (và thầy) biết máy rung được.
    if (v && khoa === 'ddh.rung') try { (navigator as Navigator & { vibrate?: (m: number) => boolean }).vibrate?.(80) } catch { /* máy không rung được */ }
    // bật «Âm thanh» ⇒ kêu thử tiếng chọn (rung không gọi: phanHoi nạp lười sẽ đè nhịp rung thử ở trên).
    if (v && khoa === 'ddh.am') cham()
  }}><span className="tr-menu-o" data-sac={sac} aria-hidden="true"><Icon size={20} /></span>{ten}<span className="tr-cong" data-bat={bat || undefined} aria-hidden="true">{bat ? 'Bật' : 'Tắt'}</span></button>
}
/** Ba mục menu kiểu Duolingo (bản vẽ dm-4, thầy chốt 26/10) — cùng id mục của cổng: Lộ trình = Hôm nay (+ Hành trình) · Luyện tập = Ôn & sửa · Thành tích = Kết quả.
 *  `sac` = màu ô biểu tượng (menu 6 mục 27/10): chính · chú ý · sao. */
const MENU_DUO = [{ id: 'hom-nay', ten: 'Hôm nay', icon: Sparkles, sac: 'chinh' }, { id: 'on-lai', ten: 'Luyện tập', icon: Wrench, sac: 'chu-y' }, { id: 'ket-qua', ten: 'Thành tích', icon: Trophy, sac: 'sao' }] as const
let soMenuCham = 0
export function MenuDocTrong(p: {
  muc: string; ds: readonly { id: string; ten: string; icon: LucideIcon }[]; onMuc: (id: string) => void
  coCa: boolean; onThi: () => void; thongBao?: ReactNode; dangTai: boolean; onTaiLai: () => void
  chuDau: string; moCuaEm: boolean; onCuaEm: () => void; nutCuaEm: RefObject<HTMLButtonElement | null>
  token?: string; moDiemDanh: boolean
}) {
  const [mo, setMo] = useState(false)
  const [cai, setCai] = useState(false) // tấm con «Cài đặt» đang mở (thay chỗ 6 mục)
  // Kết quả ca thi «Về Lộ trình» (Boss 27/10): đóng phòng thi ⇒ về đúng mục Lộ trình dù em vào thi từ mục khác (sự kiện do cổng phát khi đóng phòng thi)
  const onMuc = useRef(p.onMuc)
  onMuc.current = p.onMuc
  useEffect(() => { const ve = () => onMuc.current('hom-nay'); window.addEventListener('ddh:ve-lt', ve); return () => window.removeEventListener('ddh:ve-lt', ve) }, [])
  // NGANG + MÁY TÍNH 27/10: đổi sang Luyện tập / Thành tích ⇒ về đầu trang (trước đây giữ chỗ cuộn của Lộ trình ⇒ mở mục mới ở giữa trang, cột trái trống).
  // Lộ trình tự cuộn tới chặng hiện tại (F4) nên không đụng.
  const mucTruoc = useRef(p.muc)
  useEffect(() => { if (mucTruoc.current === p.muc) return; mucTruoc.current = p.muc; if (p.muc !== 'hom-nay') document.scrollingElement?.scrollTo?.(0, 0) }, [p.muc])
  const caiRef = useRef(false)
  caiRef.current = cai
  const nut = useRef<HTMLButtonElement>(null)
  // 28/10 MƯỢT: `<html data-menu-cham>` thay `body:has(.tr-menu-cham)` (trong-hs.css) — :has() trên body khiến MỖI lần thêm / gỡ nút ở bất kì đâu
  // (vd đổi câu) Chrome lên lịch kiểm lại cả trang theo tập luật :has() chung (tính lại kiểu mọi <span>…). Đếm tham chiếu: nhiều menu cùng lúc vẫn đúng.
  useLayoutEffect(() => {
    const g = document.documentElement
    if (soMenuCham++ === 0) g.setAttribute('data-menu-cham', '')
    return () => { if (--soMenuCham <= 0) { soMenuCham = 0; g.removeAttribute('data-menu-cham') } }
  }, [])
  const the = useRef<HTMLElement>(null)
  const nutCai = useRef<HTMLButtonElement>(null)
  const nutLui = useRef<HTMLButtonElement>(null)
  const { tt, setTt, ma, setMa, loi, setLoi, dangGui, gui, oNhap, mo: ddMoLoi, tuQr } = useDiemDanhHs(p.token ?? '', p.moDiemDanh && !!p.token)
  const ddMo = tt.loai === 'cho'
  const coDd = !!p.token && coKhoiDiemDanh(tt)
  const dong = (traVe: boolean) => { setMo(false); if (traVe) nut.current?.focus() }
  useEffect(() => { if (ddMoLoi || (tuQr && tt.loai === 'xong')) setMo(true) }, [ddMoLoi, tuQr, tt.loai])
  // Menu thu lại ⇒ lần mở sau luôn về 6 mục. Đổi qua lại 6 mục ↔ Cài đặt ⇒ tiêu điểm theo (nút Quay lại / mục Cài đặt).
  useEffect(() => { if (!mo) setCai(false) }, [mo])
  // (chạy TRƯỚC hiệu ứng mở menu bên dưới ⇒ lúc mở, tiêu điểm cuối cùng vẫn là mục đầu / ô mã điểm danh)
  useEffect(() => { if (mo) (cai ? nutLui : nutCai).current?.focus() }, [cai, mo])
  useEffect(() => {
    if (!mo) return
    ;(oNhap.current ?? the.current?.querySelector<HTMLElement>('.tr-menu-muc'))?.focus()
    const phim = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (caiRef.current) { setCai(false); return }
      setMo(false); nut.current?.focus()
    }
    const cuon = () => setMo(false)
    window.addEventListener('keydown', phim)
    window.addEventListener('scroll', cuon, { passive: true })
    return () => { window.removeEventListener('keydown', phim); window.removeEventListener('scroll', cuon) }
  }, [mo, oNhap])
  const chon = (fn: () => void) => () => { cham(); fn() }
  // Chạm một ô số (cây React khác vẽ portal vào ô) ⇒ tiếng chạm + menu thu như mọi mục menu (nghe click DOM, không qua sự kiện React).
  const oSo = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const o = oSo.current
    if (!o) return
    const bam = (e: Event) => { if ((e.target as Element | null)?.closest?.('button')) { cham(); setMo(false) } }
    o.addEventListener('click', bam)
    return () => o.removeEventListener('click', bam)
  }, [])
  return <>
    {/* Khung thấp xoay ngang: menu thu thành DẢI BIỂU TƯỢNG mép phải (3 mục + A.I + nút mở menu đủ); dọc / máy tính: display: contents ⇒ chỉ vạch cũ. */}
    {/* HỆ KÍNH (thầy chốt 02/11): THANH CÔNG CỤ KÍNH NỔI (không chạm mép) — 3 mục chính + «Thêm» (mở đúng menu cũ: chuông, điểm danh, số của em,
        Ca kiểm tra, Cài đặt…) + NÚT A.I TRÒN TÁCH RIÊNG (sự kiện ddh:mo-ai như cũ). Ngang thấp / máy tính: CSS xếp thành ray dọc bên trái. Chấm đỏ của «Thêm» =
        luật cũ `.tr-menu-cham s` (đọc số chưa đọc của chuông thật). */}
    <div className="tr-menu-ray kb-thanh">
      <div className="kb-thanh-ds">
        {/* thầy 02/11 khuya «Đổi vị trí Luyện tập bằng Kiểm tra»: thanh nổi = Hôm nay · Kiểm tra (vào ca kiểm tra) · Thành tích · Thêm; Luyện tập vào tấm Thêm */}
        {MENU_DUO.map(({ id, ten, icon: Icon }) => id === 'on-lai'
          ? <button key="kiem-tra" type="button" className="tr-ray-muc kb-thanh-muc" onClick={chon(() => p.onThi())} aria-label="Kiểm tra"><ClipboardCheck size={22} aria-hidden="true" /><span aria-hidden="true">Kiểm tra</span></button>
          : <button key={id} type="button" className="tr-ray-muc kb-thanh-muc" onClick={chon(() => p.onMuc(id))} aria-current={p.muc === id ? 'page' : undefined} aria-label={ten}><Icon size={22} aria-hidden="true" /><span aria-hidden="true">{ten}</span></button>)}
        <button ref={nut} type="button" className="tr-menu-cham kb-thanh-muc" data-dd={ddMo || undefined} aria-label={ddMo ? 'Thêm · Buổi học đang mở điểm danh' : 'Thêm'} aria-expanded={mo} aria-controls="tr-menu" onClick={() => { if (mo) dong(false); else setMo(true) }}>
          <i /><s /><Luoi4 size={22} /><span aria-hidden="true">Thêm</span>{ddMo && <em aria-hidden="true"><QrCode size={14} />Điểm danh</em>}
        </button>
      </div>
      <button type="button" className="tr-ray-muc tr-ray-ai kb-thanh-ai" onClick={chon(() => window.dispatchEvent(new Event('ddh:mo-ai')))} aria-label="Hỏi A.I Đỗ Đại Học" title="Hỏi A.I Đỗ Đại Học"><IconNet size={26} d={['M7.9 20A9 9 0 1 0 4 16.1L2 22Z', 'M8 12h.01M12 12h.01M16 12h.01']} /></button>
    </div>
    {mo && <div className="tr-menu-phu" onClick={() => dong(true)} aria-hidden="true" />}
    <nav ref={the} id="tr-menu" className="tr-menu" data-mo={mo || undefined} data-dd={coDd ? '' : undefined} aria-label="Điều hướng học sinh">
      <b className="kb-them-tieu" aria-hidden="true">Thêm</b>
      <div className="tr-menu-dau">
        <a className="tr-menu-ten" href="/hs"><img src={`${import.meta.env.BASE_URL}logo-hs-nho-v3.svg`} width={28} height={28} alt="" draggable={false} />Đỗ Đại Học</a>

        {/* Chuông = ĐÚNG phần tử ThongBaoHocSinh (số chưa đọc, tấm thông báo); bấm ⇒ menu thu, tấm thông báo vẫn hiện (CSS giữ tấm hiện). */}
        {p.thongBao && <div className="tr-menu-tb" onClickCapture={(e) => { if ((e.target as Element).closest?.('.m3-tb-chuong')) { cham(); dong(false) } }}>{p.thongBao}</div>}
      </div>
      {coDd && <KhoiDiemDanh tt={tt} ma={ma} setMa={setMa} loi={loi} setLoi={setLoi} dangGui={dangGui} gui={gui} oNhap={oNhap} token={p.token!} />}
      {/* SỐ CỦA EM (thầy 27/10 «để dọc xuống thẳng hàng cách đều dưới cái chuông»): cột dọc bên phải 6 mục, cùng trục với chuông — MotTrangHs vẽ portal vào
          đây (useChoSo); chưa có số ⇒ rỗng, menu giữ một cột như cũ */}
      <div ref={oSo} id="tr-menu-dem" className="tr-menu-dem" />
      <div className="tr-menu-ds" hidden={cai}>
        {MENU_DUO.map(({ id, ten, icon: Icon, sac }) => <button key={id} type="button" className="tr-menu-muc" data-k={id} data-hien={id === 'on-lai' || undefined} onClick={chon(() => { p.onMuc(id); dong(true) })} aria-current={p.muc === id ? 'page' : undefined}><span className="tr-menu-o" data-sac={sac} aria-hidden="true"><Icon size={20} /></span>{ten}</button>)}
        {/* thầy 02/11 khuya: Kiểm tra lên thanh nổi ⇒ tấm Thêm hiện Luyện tập (MENU_DUO «on-lai», data-hien), bỏ Ca kiểm tra; bỏ
            «Hỏi A.I Đỗ Đại Học» (đã có nút A.I riêng ngoài thanh) */}
        {p.token && !coDd && <button type="button" className="tr-menu-muc" data-hien onClick={chon(() => { setTt({ loai: 'cho', buoi: null }); setTimeout(() => oNhap.current?.focus()) })}><span className="tr-menu-o" data-sac="tin" aria-hidden="true"><QrCode size={20} /></span>Điểm danh</button>}
        <button ref={nutCai} type="button" className="tr-menu-muc" onClick={chon(() => setCai(true))} aria-expanded={cai} aria-controls="tr-menu-cai"><span className="tr-menu-o" data-sac="xam" aria-hidden="true"><BanhRang size={20} /></span>Cài đặt<ChevronRight size={20} aria-hidden="true" className="tr-menu-mui" /></button>
      </div>
      <div id="tr-menu-cai" className="tr-menu-cai" role="group" aria-labelledby="tr-menu-cai-ten" hidden={!cai}>
        <div className="tr-menu-cai-dau"><button ref={nutLui} type="button" className="tr-menu-lui" onClick={chon(() => setCai(false))} aria-label="Quay lại menu"><MuiTrai size={22} /></button><b id="tr-menu-cai-ten">Cài đặt</b></div>
        <CongTac khoa="ddh.am" ten="Âm thanh" Icon={Volume2} sac="tin" />
        <CongTac khoa="ddh.rung" ten="Rung" Icon={Vibrate} sac="chu-y" />
        <CongTac khoa={KHOA_AM_AN_MUNG} ten="Tiếng ăn mừng" Icon={Sparkles} sac="sao" />
        <hr className="tr-menu-vach" />
        <button type="button" className="tr-menu-muc" onClick={chon(() => { dong(true); p.onTaiLai() })} disabled={p.dangTai}><span className="tr-menu-o" data-sac="chinh" aria-hidden="true"><RefreshCw size={20} /></span>Cập nhật bài học</button>
        <button ref={p.nutCuaEm} type="button" className="tr-menu-muc" onClick={chon(() => { dong(false); p.onCuaEm() })} aria-haspopup="dialog" aria-expanded={p.moCuaEm}><span className="tr-menu-o tr-menu-anh" aria-hidden="true">{p.chuDau}</span>Của em</button>
      </div>
    </nav>
  </>
}
