// HOOK + HÀM CHỮ CỦA MÀN HÔM NAY (tách khỏi TheHomNayEm.tsx 26/10 — luật tốc độ): Lộ trình «Trong» (TrongHs.tsx) và màn Hôm nay cũ cùng dùng. Nằm trong nhóm
// mở app học sinh (nhỏ); thẻ giao diện cũ TheHomNayEm (kèm BangNhipHoc) nạp lười, chỉ khi tắt «Trong».
import { useEffect, useState } from 'react'
import { CAU_MOI_CHANG, soChangXong, type SoHomNay } from './lam-bai'
import { layNhipHocEm, type NhipHocHs } from '../../lib/nhip-hoc-em'

/** Bản nhớ trong phiên (mỗi token một bản, 60 giây, gắn với `lamMoi`): em chuyển qua lại các mục rồi về Hôm nay thì vẽ ngay, không gọi lại máy
 *  chủ (bớt lượt D1); số câu hôm nay đổi ⇒ khoá khác ⇒ nạp lại. */
const NHO = new Map<string, { kq: NhipHocHs; luc: number; khoa: number | null | undefined }>()
// Khẩn 12/10 21h (giờ cao điểm): lịch sử ngày không đổi trong ngày — số HÔM NAY lấy từ sảnh ⇒ nhớ 10 phút, KHÔNG nạp lại sau mỗi câu.
const NHO_MS = 600_000
/** Chỉ cho test: xoá bản nhớ. */
export const xoaNhoNhipHocEm = (): void => NHO.clear()

/** Nạp `/hs/nhip-hoc`: 'tai' (đang tải) · 'an' (không token / lỗi lần đầu ⇒ ẩn gọn) · số. Lỗi khi đã có số ⇒ giữ số cũ. */
export function useNhipHocEm(token: string | undefined, lamMoi: number | null | undefined): NhipHocHs | 'tai' | 'an' {
  const [ban, setBan] = useState(() => ({ token, kq: token ? NHO.get(token)?.kq ?? null : null, hong: false }))
  useEffect(() => {
    if (!token) return
    const c = NHO.get(token)
    if (c && c.khoa === lamMoi && Date.now() - c.luc < NHO_MS) { setBan({ token, kq: c.kq, hong: false }); return }
    let huy = false
    void layNhipHocEm(token).then((r) => {
      if (huy) return
      if (r) { NHO.set(token, { kq: r, luc: Date.now(), khoa: lamMoi }); setBan({ token, kq: r, hong: false }) }
      else setBan(v => ({ token, kq: v.token === token ? v.kq : null, hong: true }))
    })
    return () => { huy = true }
  }, [token, lamMoi])
  return !token ? 'an' : ban.token === token ? ban.kq ?? (ban.hong ? 'an' : 'tai') : NHO.get(token)?.kq ?? 'tai'
}

/** Các chặng của hôm nay: mỗi chặng chuẩn 6 câu; chặng cuối lấy hết phần còn lại tới tổng câu của bài. */
export function chiaChang(so: SoHomNay): { co: number; tt: 'xong' | 'dang' | 'cho'; phan: number }[] {
  const xong = soChangXong(so)
  const tongCau = Math.max(so.muc, so.soChang * CAU_MOI_CHANG)
  return Array.from({ length: so.soChang }, (_, i) => {
    const dau = i * CAU_MOI_CHANG
    const cuoi = i === so.soChang - 1 ? tongCau : Math.min((i + 1) * CAU_MOI_CHANG, tongCau)
    const co = Math.max(1, cuoi - dau)
    const tt = i < xong ? 'xong' : i === xong ? 'dang' : 'cho'
    const dangDo = tt === 'dang' && (so.changDangDo === i + 1 || (so.cauChang !== undefined && so.chang === i + 1))
    return { co, tt, phan: dangDo ? Math.max(0, Math.min(100, Math.round((100 * Math.max(0, so.daLam - dau)) / co))) : 0 }
  })
}

/** Chữ nút học — MỘT nút cho cả màn (Hôm nay và Hành trình dùng chung).
 *  Gói 7 kho thiếu (khẩn 12/10 21h30): hết việc xếp được mà chưa đủ mức ⇒ "Hôm nay còn N câu chờ thầy bổ sung" (nút khoá); còn việc xếp được nhưng ít
 *  hơn phần còn lại của mức ⇒ nút VẪN BẤM ĐƯỢC, nói đúng số câu sẵn sàng ("Học tiếp · 1 câu sẵn sàng") — số "Còn N câu" phía trên vẫn theo M. */
export function chuNutHoc(so: SoHomNay | null, hetCau: boolean, kho?: { choBoSung?: number; sanSang?: number; caThi?: boolean }): string {
  // (30/10) hết việc vì câu của bài đang khoá cho ca kiểm tra mở ⇒ nói đúng lý do (không phải thầy thiếu câu)
  if (hetCau && kho?.caThi) return 'Đang có ca kiểm tra · câu bài này mở lại khi ca đóng'
  if (hetCau) return kho?.choBoSung ? `Hôm nay còn ${kho.choBoSung} câu chờ thầy bổ sung` : 'Đã làm hết câu được giao'
  if (!so) return 'Bắt đầu học'
  const con = Math.max(0, so.muc - so.daLam)
  if (con === 0) return so.changDangDo ? 'Học tiếp' : 'Học thêm'
  const dau = so.daLam > 0 ? 'Học tiếp' : 'Bắt đầu học'
  const sanSang = kho?.sanSang
  return sanSang !== undefined && sanSang > 0 && sanSang < con ? `${dau} · ${sanSang} câu sẵn sàng` : `${dau} · ${con} câu`
}
