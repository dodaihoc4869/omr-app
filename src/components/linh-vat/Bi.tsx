// LINH VẬT CHÍNH «Lửa» (thầy chốt 27/10 «Chọn Lửa build luôn nhé»): chó shiba khoác blouse trắng viền chàm, kính bảo hộ trên trán, ống nghiệm hồng
// trong túi, thẻ ĐĐH — THAY «Bi» (bình cầu) ở mọi chỗ của app học sinh. GIỮ NGUYÊN API <Bi cam size className nhip noi> nên người gọi không đổi.
// Hình + chuyển động ở mảnh NẠP LƯỜI ./lua-dong (không vào nhóm mở app); trong lúc chờ mảnh về: khung giữ chỗ đúng tỉ lệ 200 : 230 (không xô bố cục).
// Lửa giữ MÀU LÔNG CAM ĐẤT riêng ở mọi cảm xúc (không mang màu đúng / sai như Bi): cảm xúc đọc bằng dáng, tai, mắt, miệng.
// Giảm chuyển động / máy yếu / không có rAF ⇒ Lửa đứng TĨNH ở tư thế của cảm xúc. Chỉ dùng trong app học sinh «Trong». aria-hidden: chữ đi kèm đã đủ nghĩa.
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { Lua, TrangThaiLua, TuyChonLua } from './lua-dong'
import '../../styles/bi.css' // khung bong bóng «Học tiếp nhé» (.bi-loi) vẫn ở tệp này
import '../../styles/lua.css'

export type CamBi = 'chao' | 'vui' | 'nghi' | 'sai' | 'mung' | 'ngu' | 'lua'
export const CAM_BI: readonly CamBi[] = ['chao', 'vui', 'nghi', 'sai', 'mung', 'ngu', 'lua']
/** Tên hiển thị của linh vật (chuẩn từ: «Lửa»). */
export const TEN_LINH_VAT = 'Lửa'

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
/** Lửa đứng tĩnh (không vòng hoạt ảnh): giảm chuyển động, máy yếu, hoặc môi trường không có requestAnimationFrame. */
export function biDungYen(): boolean {
  if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') return true
  return document.documentElement.classList.contains('may-yeu') || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}
let moDong: typeof import('./lua-dong') | null = null

export interface PropsBi {
  cam?: CamBi
  /** Cạnh rộng (px); cao tự theo tỉ lệ 200 : 230. */
  size?: number
  className?: string
  /** 'yen' = Lửa nhỏ trên thanh: không màn vào. Các giá trị khác giữ để tương thích người gọi cũ. */
  nhip?: 'nay' | 'lac' | 'nhay' | 'yen'
  /** Câu Lửa đang nói: miệng mấp máy khớp nhịp chữ (bong bóng lời do màn tự vẽ). */
  noi?: string
}

export function Bi({ cam = 'chao', size = 96, className, nhip, noi }: PropsBi) {
  const o = useRef<HTMLSpanElement>(null), lua = useRef<Lua | null>(null), dau = useRef(true)
  const [co, setCo] = useState(() => !!moDong)
  useEffect(() => {
    if (co) return
    let con = true
    import('./lua-dong').then((m) => { moDong = m; if (con) setCo(true) }, () => {})
    return () => { con = false }
  }, [co])
  useEffect(() => {
    if (!co || !moDong || !o.current) return
    const [trangThai, tuyChon] = ttTheoCam(cam, nhip)
    const l = moDong.taoLua(o.current, { trangThai, tuyChon, tinh: biDungYen() })
    if (noi) l.noi(noi, 40)
    lua.current = l
    return () => { l.huy(); lua.current = null }
  }, [co]) // eslint-disable-line react-hooks/exhaustive-deps -- tạo một lần; đổi cảm xúc đi qua datTrangThai để chuyển mượt
  useEffect(() => {
    if (dau.current) { dau.current = false; return }
    const [t, tc] = ttTheoCam(cam, nhip)
    lua.current?.datTrangThai(t, tc)
    if (noi) lua.current?.noi(noi, 40)
  }, [cam, nhip, noi])
  return <span ref={o} className={`bi lua${className ? ` ${className}` : ''}`} data-cam={cam} aria-hidden="true" style={{ '--lv-w': `${size}px` } as CSSProperties} />
}

export default Bi
