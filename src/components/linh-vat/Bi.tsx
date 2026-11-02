// LINH VẬT CHÍNH «MOL» — MẶT BÌNH CẦU (thầy chốt 01/11: «Chọn Mol bình cầu, thêm cả cáu, rất cáu nữa nhé. Đặt tên linh vật là Mol thôi»; bản vẽ
// docs/ban-ve-mol-0111): chỉ có mặt, đầu bình cầu xanh dương của app, dung dịch cam ở cằm, mắt to — ở mọi chỗ của app học sinh. Thay hình cú ngọc «Lửa» (28/10).
// GIỮ NGUYÊN API <Bi cam size className nhip noi> nên người gọi không đổi; thêm `goc` (tuỳ chọn) để đứng nghiêng.
// Hình + chuyển động ở mảnh NẠP LƯỜI ./mol-dong (SVG + CSS) (không vào nhóm mở app); trong lúc chờ mảnh về: khung giữ chỗ đúng tỉ lệ 200 : 230 (không xô bố cục).
// Mol giữ màu xanh dương của app ở mọi cảm xúc (giận ⇒ dung dịch trong bình hoá đỏ, dâng lên, sôi): cảm xúc đọc bằng mắt, mày, miệng.
// 02/11 MOL SỐNG ĐỘNG (thầy «Chốt Mol sống động và hiệu ứng gắn luôn vào app, đảm bảo máy siêu yếu cũng hoạt động được»): mol-dong.ts nhận CHẾ ĐỘ —
//   máy thường 'day-du' · máy yếu 'gon' (30 khung/giây, ít hạt, không kéo, không gradient) · giảm chuyển động 'tinh' (chỉ chuyển mặt) · cỡ < 64 px 'nho'
//   (mặt tĩnh + chớp CSS, không vòng JS). Mol đứng nghiêng cạnh đường (có `goc` — Mol to ở Lộ trình) mới KÉO được. Không thêm prop, mọi chỗ gọi giữ nguyên.
// Chỉ dùng trong app học sinh «Trong». aria-hidden: chữ đi kèm đã đủ nghĩa.
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import type { GocLua, Lua, TrangThaiLua, TuyChonLua } from './lua-dong'
import type { CheDoMol } from './mol-lo-xo'
import '../../styles/bi.css' // khung bong bóng «Học tiếp nhé» (.bi-loi) vẫn ở tệp này
import { gioMayChu } from '../../lib/gio-may-chu'
import { boMauMol } from '../../lib/mau-mol-ngay'
import '../../styles/lua.css'

export type CamBi = 'chao' | 'vui' | 'nghi' | 'sai' | 'mung' | 'ngu' | 'lua'
export const CAM_BI: readonly CamBi[] = ['chao', 'vui', 'nghi', 'sai', 'mung', 'ngu', 'lua']
/** Tên hiển thị của linh vật (chuẩn từ: «Mol», thầy 01/11). */
export const TEN_LINH_VAT = 'Mol'

/** Cảm xúc Bi cũ ⇒ trạng thái Lửa (map 1-1): chào → vẫy tay · vui → nảy cười híp · nghĩ → chống cằm + dấu hỏi · sai → giật mình, tai cụp, mồ hôi ·
 *  mừng → combo nhảy cao giơ hai tay + lấp lánh · ngủ → ngủ gật zzz · lửa (chuỗi ngày) → cổ vũ đấm tay, nháy mắt. */
export const TT_THEO_CAM: Record<CamBi, TrangThaiLua> = { chao: 'chao', vui: 'vui', nghi: 'nghi', sai: 'buon', mung: 'combo', ngu: 'ngu', lua: 'covu' }
/** Nhịp 'yen' (Lửa nhỏ trên thanh): không màn vào, mừng chỉ cười, chào chỉ đứng thở. */
const TT_YEN: Partial<Record<CamBi, TrangThaiLua>> = { chao: 'yen', vui: 'cuoi', mung: 'cuoi', lua: 'cuoi' }
export function ttTheoCam(cam: CamBi, nhip?: PropsBi['nhip']): [TrangThaiLua, TuyChonLua] {
  if (nhip === 'yen') return [TT_YEN[cam] ?? TT_THEO_CAM[cam], { em: true }]
  if (cam === 'mung') return ['combo', { sau: 3600, ve: 'vui' }] // nhảy mừng một hồi rồi vui
  return [TT_THEO_CAM[cam], {}]
}
/** Mol đứng tĩnh (chỉ chuyển mặt): xin giảm chuyển động, hoặc môi trường không có requestAnimationFrame. 02/11: máy yếu KHÔNG còn tĩnh — chạy chế độ gọn. */
export function biDungYen(): boolean {
  if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') return true
  return !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}
/** Chế độ của Mol (mol-lo-xo.ts cheDoMol, viết lại tại chỗ để mảnh Bi không kéo mã của mảnh lười): cỡ < 64 px ⇒ 'nho'; tĩnh ⇒ 'tinh'; máy yếu ⇒ 'gon'. */
export function cheDoBi(size: number): CheDoMol {
  if (size < 64) return 'nho'
  if (biDungYen()) return 'tinh'
  return document.documentElement.classList.contains('may-yeu') ? 'gon' : 'day-du'
}
let moDong: typeof import('./mol-dong') | null = null
/** LỬA ĐỔI CẢM XÚC (thầy chốt 31/10): cấp giận ⇒ dáng có sẵn — 2 Sốt ruột: dỗi khoanh tay · 3 Bực: càu nhàu · 4 Giận / 5 Siêu cáu: tức giận. Cấp 0–1 theo `cam` như cũ. */
const TT_CAP: Record<number, TrangThaiLua> = { 2: 'doi', 3: 'caunhau', 4: 'gian', 5: 'gian' }
export function ttTheoCap(cam: CamBi, nhip: PropsBi['nhip'], cap = 0): [TrangThaiLua, TuyChonLua] {
  const t = TT_CAP[cap]
  return t ? [t, nhip === 'yen' ? { em: true } : {}] : ttTheoCam(cam, nhip)
}
/** Sự kiện phát khi một linh vật vừa vẽ xong cấp giận mới (biểu tượng tab của Lộ trình chụp lại đầu Mol). */
export const SU_KIEN_LUA_CAP = 'ddh-lua-cap'
/** Mol tự vẽ 4 mức giận (dỗi · bực · cáu · rất cáu) — không cần mảnh vẽ giận riêng như hình cú cũ. */
function apCap(l: Lua, cap: number, con: () => boolean): void {
  if (l.cap === cap || !con()) return
  l.datCap(cap)
  window.dispatchEvent(new Event(SU_KIEN_LUA_CAP))
}

/** (28/10 «vẫn chưa tức thì») Ảnh TĨNH của linh vật ở Lộ trình lần mở trước (src/lib/khung-tinh-hs.ts chụp): `{ "<cỡ>|<cảm xúc>|<hướng>": { src, st } }`. */
export const KHOA_BI_TINH = 'ddh.bi-tinh-mol2' // 01/11 đổi khoá: ảnh tĩnh cú ngọc cũ không làm khung giữ chỗ cho Mol; tối 01/11 Mol phối màu mới ⇒ đổi khoá lần nữa
let biTinh: Record<string, { src?: string; st?: string; ngay?: string }> | null = null
/** Ảnh tĩnh khớp đúng cỡ + cảm xúc + hướng (không khớp ⇒ không có, giữ khung trống như trước). */
function anhBiTinh(size: number, cam: string, goc?: string): { src?: string; st?: string } | null {
  if (!biTinh) { try { biTinh = JSON.parse(localStorage.getItem(KHOA_BI_TINH) || '{}') || {} } catch { biTinh = {} } }
  const a = biTinh![`${size}px|${cam}|${goc ?? ''}`]
  if (!a || typeof a.src !== 'string' || !/^data:image\/(?:svg\+xml|webp|png)/.test(a.src)) return null
  // Mol đổi bộ màu mỗi ngày (mau-mol-ngay.ts): ảnh tĩnh của bộ màu ngày khác ⇒ bỏ (không chớp màu hôm qua lúc mảnh Mol chưa về).
  // Ảnh điểm có `ngay` (ngày VN lúc chụp) ⇒ so bộ màu của ngày ấy; ảnh SVG ⇒ đọc thẳng data-mol-mau trong ảnh.
  const bo = boMauMol(gioMayChu())
  return (a.ngay ? boMauMol(Date.parse(a.ngay)) === bo : a.src.includes(`data-mol-mau='${bo}'`)) ? a : null
}

export interface PropsBi {
  cam?: CamBi
  /** Cạnh rộng (px); cao tự theo tỉ lệ 200 : 230. */
  size?: number
  className?: string
  /** 'yen' = Lửa nhỏ trên thanh: không màn vào. Các giá trị khác giữ để tương thích người gọi cũ. */
  nhip?: 'nay' | 'lac' | 'nhay' | 'yen'
  /** Câu Lửa đang nói: miệng mấp máy khớp nhịp chữ (bong bóng lời do màn tự vẽ). */
  noi?: string
  /** Đứng nghiêng: 'phai' = quay mặt sang phải, 'trai' = sang trái (Lộ trình: nhìn về phía đường). */
  goc?: GocLua
  /** Cấp giận 0–5 (src/lib/lua-cam-xuc.ts). ≥ 2 ⇒ đổi dáng + mặt + màu (lớp vẽ giận nạp lười). Vắng = 0. */
  cap?: number
  /** 'tron' = Mol trong KHUNG TRÒN (vòng Mục tiêu): khung vuông bo tròn, mặt Mol cắt sát lấp đầy khung (mol-dong.ts VIEWBOX_MOL_TRON). */
  khung?: 'tron'
}

export function Bi({ cam = 'chao', size = 96, className, nhip, noi, goc, cap: cap0, khung }: PropsBi) {
  const cap = cap0 && cap0 >= 2 ? Math.min(5, Math.round(cap0)) : 0
  // khoá ảnh tĩnh + data-cam: cấp ≥ 2 là hình khác hẳn ⇒ khoá riêng (không lấy ảnh vui vẻ của lần trước làm khung giữ chỗ cho Lửa đang giận, và ngược lại)
  const camKhoa = cap >= 2 ? `gian${cap}` : cam
  const o = useRef<HTMLSpanElement>(null), lua = useRef<Lua | null>(null), dau = useRef(true)
  const [co, setCo] = useState(() => !!moDong)
  // Mảnh hoạt ảnh chưa về: đặt ẢNH TĨNH lần trước vào khung giữ chỗ (đúng cỡ, đúng tư thế) ⇒ linh vật hiện ngay từ khung đầu (khung tĩnh Lộ trình gỡ ra
  // là thấy đúng hình ấy), mảnh về thì thay bằng hình động (cùng lượt, không chớp).
  useLayoutEffect(() => {
    const el = o.current
    if (co || !el || el.firstChild) return
    const a = khung ? null : anhBiTinh(size, camKhoa, goc) // khung tròn: không dùng ảnh tĩnh toàn thân làm chỗ giữ
    if (!a) return
    const img = document.createElement('img')
    img.className = 'lua-svg bi-tinh'
    img.alt = ''
    img.src = a.src!
    if (a.st) img.setAttribute('style', a.st)
    el.appendChild(img)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- chỉ lượt gắn đầu
  useEffect(() => {
    if (co) return
    let con = true
    import('./mol-dong').then((m) => { moDong = m; if (con) setCo(true) }, () => {})
    return () => { con = false }
  }, [co])
  useEffect(() => {
    if (!co || !moDong || !o.current) return
    const [trangThai, tuyChon] = ttTheoCap(cam, nhip, cap)
    o.current.querySelector(':scope > .bi-tinh')?.remove()
    const l = moDong.taoLua(o.current, { trangThai, tuyChon, cheDo: cheDoBi(size), goc, keo: !!goc })
    if (noi) l.noi(noi, 40)
    lua.current = l
    apCap(l, cap, () => lua.current === l)
    return () => { l.huy(); lua.current = null }
  }, [co]) // eslint-disable-line react-hooks/exhaustive-deps -- tạo một lần; đổi cảm xúc đi qua datTrangThai để chuyển mượt
  useEffect(() => {
    if (dau.current) { dau.current = false; return }
    const [t, tc] = ttTheoCap(cam, nhip, cap)
    const l = lua.current
    l?.datTrangThai(t, tc)
    if (noi) l?.noi(noi, 40)
    if (l) apCap(l, cap, () => lua.current === l)
  }, [cam, nhip, noi, cap])
  return <span ref={o} className={`bi lua${className ? ` ${className}` : ''}`} data-cam={camKhoa} data-cap={cap || undefined} data-goc={goc} data-khung={khung} data-nho={size < 64 ? '' : undefined} aria-hidden="true" style={{ '--lv-w': `${size}px` } as CSSProperties} />
}

/** NẠP TRƯỚC mảnh Mol (thầy 02/11 «tải luôn hiệu ứng sẵn cho máy yếu»): cổng học sinh gọi lúc rảnh ⇒ lần Mol hiện đầu không phải chờ mảnh. Cửa nạp ở ĐÂY
 *  (mảnh Bi) ⇒ đồ thị mảnh không đổi (mol-dong vẫn chỉ được nạp từ Bi / Lộ trình, không tách thêm mảnh precache). */
export function napTruocMol(): void { if (!moDong) void import('./mol-dong').then((m) => { moDong = m }, () => {}) }

export default Bi
