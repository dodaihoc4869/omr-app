// LIVE BẢNG — SỔ NÉT PHÍA MÁY EM (đặc tả mục 4.3, 5): áp các mục sổ nét (đã có số thứ tự của phòng) thành BẢNG hiện tại và trả ra đúng SỰ KIỆN của bộ máy bút
// (`SuKienBut`, src/lib/but-bang-loi.ts) ⇒ lớp vẽ chỉ việc `taoLoiBut().apSuKien(ds, sk)` như máy thầy. Thuần.
// Luật: nét xong ⇒ thêm vào vị trí `vt` (trùng id ⇒ thay tại chỗ); xoá nét; xoá hết / bảng mới ⇒ bảng trắng (phòng cũng dọn sổ tại đây);
// hoàn tác (mục riêng, bộ máy bút hiện KHÔNG dùng — nó phát `xoa` / `net-moi` có `vt`) ⇒ lùi một việc gần nhất trong bảng hiện tại.
// Bắt kịp: máy em gửi `{t:'live-bu', net: <stt cuối>}`; phòng trả `{t:'live-so', lamLai}` rồi các mục còn thiếu. `lamLai` ⇒ `datLai` trước khi áp.
import type { NetBut, SuKienBut } from '../but-bang-loi'
import type { MucSo } from './ma-net'

type MucLichSu = { k: 'them'; id: string } | { k: 'xoa'; ds: { net: NetBut; vt: number }[] }
export interface BangNet {
  /** Khoá trang của bộ máy bút (thầy chuyển câu ⇒ trang mới). */
  trang: string
  /** Ngang / dọc của vùng viết trên máy thầy. */
  tiLe: number
  /** Nét đã chốt, theo thứ tự vẽ. */
  net: NetBut[]
  /** Số thứ tự mục cuối đã áp. */
  cuoi: number
  lichSu: MucLichSu[]
  /** Nét rất dài đang nhận dở (nhiều khung). */
  ghep: { net: NetBut; vt: number | null } | null
}

const LICH_SU_GIU = 300
export const taoBang = (): BangNet => ({ trang: '', tiLe: 16 / 9, net: [], cuoi: 0, lichSu: [], ghep: null })
const skTrang = (b: BangNet): SuKienBut => ({ loai: 'trang', trang: b.trang, net: b.net.slice(), tiLe: b.tiLe })
/** Phòng báo «làm lại» (máy em lệch sổ: vào muộn sau khi sổ đã dọn, phòng khởi động lại…) ⇒ bảng trắng, nhận lại từ đầu sổ. Trả sự kiện vẽ lại bảng trắng. */
export function datLai(b: BangNet): SuKienBut { b.net = []; b.lichSu = []; b.cuoi = 0; b.ghep = null; return skTrang(b) }
const ghiLichSu = (b: BangNet, m: MucLichSu): void => { b.lichSu.push(m); if (b.lichSu.length > LICH_SU_GIU) b.lichSu.shift() }

/** Áp một mục ⇒ các sự kiện bút cần áp lên lớp vẽ (rỗng = không đổi gì). Mục có `stt` ≤ mục cuối đã áp ⇒ bỏ (trùng). Sửa `b` tại chỗ. */
export function apMuc(b: BangNet, m: MucSo): SuKienBut[] {
  if (m.stt <= b.cuoi) return []
  b.cuoi = m.stt
  const trang = b.trang
  if (m.k === 'net') {
    // Nét nhiều khung: gom đủ rồi mới đưa vào bảng (lớp vẽ không thấy nửa nét).
    let net = m.net, vt = m.vt
    if (m.tu > 0) {
      if (!b.ghep || b.ghep.net.id !== m.net.id || b.ghep.net.diem.length !== m.tu) { b.ghep = null; return [] }
      b.ghep.net.diem = b.ghep.net.diem.concat(m.net.diem); net = b.ghep.net; vt = b.ghep.vt
    }
    if (!m.het) { b.ghep = { net, vt }; return [] }
    b.ghep = null
    const cu = b.net.findIndex((x) => x.id === net.id)
    if (cu >= 0) { b.net[cu] = net; return [{ loai: 'xoa', trang, id: [net.id] }, { loai: 'net-moi', trang, net, vt: cu, xong: true }] }
    const k = vt == null ? b.net.length : Math.min(vt, b.net.length)
    b.net.splice(k, 0, net)
    ghiLichSu(b, { k: 'them', id: net.id })
    return [{ loai: 'net-moi', trang, net, vt: k, xong: true }]
  }
  if (m.k === 'xoa') {
    const ds: { net: NetBut; vt: number }[] = []
    for (let i = b.net.length - 1; i >= 0; i--) if (m.id.includes(b.net[i]!.id)) { ds.push({ net: b.net[i]!, vt: i }); b.net.splice(i, 1) }
    if (ds.length) ghiLichSu(b, { k: 'xoa', ds })
    // Phát cả khi nét chưa có trong bảng đã chốt: có thể là nét đang viết dở bị huỷ ở lớp vẽ.
    return [{ loai: 'xoa', trang, id: m.id }]
  }
  if (m.k === 'xoa-het' || m.k === 'bang') {
    b.net = []; b.lichSu = []; b.ghep = null
    if (m.k === 'bang') { b.trang = m.trang; if (m.tiLe > 0) b.tiLe = m.tiLe }
    return [skTrang(b)]
  }
  // hoàn tác
  const cu = b.lichSu.pop()
  if (!cu) return []
  if (cu.k === 'them') { const i = b.net.findIndex((x) => x.id === cu.id); if (i < 0) return []; b.net.splice(i, 1); return [{ loai: 'xoa', trang, id: [cu.id] }] }
  const ra: SuKienBut[] = []
  for (let i = cu.ds.length - 1; i >= 0; i--) { const k = Math.min(cu.ds[i]!.vt, b.net.length); b.net.splice(k, 0, cu.ds[i]!.net); ra.push({ loai: 'net-moi', trang, net: cu.ds[i]!.net, vt: k, xong: true }) }
  return ra
}
