// Lọc thông báo thưởng phạt cần hiện: theo công tắc của thầy (tắt giải ⇒ bỏ «cuối tuần»; tắt thăng hoa ⇒ bỏ «thăng hoa»; tắt bạn bè ⇒ bỏ mời / gõ cửa / mốc đôi)
// và bỏ thông báo em đã xem trên máy này (máy chủ cũng xoá khi nhận /hs/thuong/da-xem; danh sách ở máy để không hiện lại khi mạng chậm).
import type { ThongBao, TongQuanThuong } from '../../lib/thuong-api'

const KHO = 'ddh.thuong.da-xem'
let ram: string[] | null = null
function docDaXem(): string[] {
  if (ram) return ram
  try { const v = JSON.parse(localStorage.getItem(KHO) || '[]'); ram = Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [] } catch { ram = [] }
  return ram
}
export function ghiDaXem(ma: string): void {
  const ds = [ma, ...docDaXem().filter((x) => x !== ma)].slice(0, 60)
  ram = ds
  try { localStorage.setItem(KHO, JSON.stringify(ds)) } catch { /* bỏ qua */ }
}
export function locThongBao(tq: TongQuanThuong): ThongBao[] {
  const da = new Set(docDaXem())
  return tq.thongBao.filter((t) => {
    if (da.has(t.ma)) return false
    if (t.loai === 'cuoi_tuan') return tq.bat.giai
    if (t.loai === 'thang_hoa') return tq.bat.thangHoa
    if (t.loai === 'moi_ban' || t.loai === 'go_cua' || t.loai === 'moc_doi') return tq.bat.banBe
    return true
  })
}
/** Chỉ test dùng. */
export function _quenDaXem(): void { ram = null }
