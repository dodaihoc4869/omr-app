// ĐIỂM DANH TỪ MÀN HÔM NAY (thầy 09/11: «chuyển nút điểm danh ra màn hôm nay, bỏ hẳn thẻ hành trình, khi bấm nút điểm danh tự động hiện ra mọi thứ
// chọn như đang làm»). Nạp lười khi thầy bấm nút. Một lần bấm:
//   · KHÔNG có buổi đang mở (≤ 4 giờ) và thầy dạy MỘT lớp ⇒ mở buổi lớp ấy, bật bảng ngay;
//   · còn lại ⇒ hỏi thầy (hộp nhỏ ở nút): «Tiếp buổi 12A1 · mở 14:02» (đứng đầu) · lớp khác (buổi MỚI — thầy dạy nhiều lớp một ngày, buổi lớp sáng quên
//     đóng KHÔNG nuốt lớp chiều) · «Kết thúc buổi» (chỗ kết thúc buổi duy nhất từ khi bỏ Hành trình) · «Trang buổi dạy» (đầu giờ, chữa câu, ôn tập…);
//   · bật bảng Bình Phản Ứng ở màn điểm danh ⇒ «Xong điểm danh · Chọn câu» ⇒ chọn câu ngay trên bảng ⇒ các lượt, gọi lên bảng.
// Mã đổi mỗi phút ⇒ khi bảng còn mở, đọc lại buổi 15 giây một lần (một lệnh nhẹ `xem`) và cập nhật mã trên bảng; bảng đóng ⇒ thôi đọc.
import { buoiDangMo, dongBuoiHoc, linkDiemDanh, moBuoiHoc, xemBuoiHoc, type BuoiHoc } from '../buoi-hoc-api'
import { layLopThay } from '../ten-lop-thay'

const GAN_DAY_MS = 4 * 3_600_000
const DOC_LAI_MS = 15_000
const homNayVn = () => new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10)
let henDoc: ReturnType<typeof setInterval> | null = null

function dungDoc(): void { if (henDoc) clearInterval(henDoc); henDoc = null }

export type ChonDiemDanh = { loai: 'tiep' } | { loai: 'moi'; lop: string } | { loai: 'ket-thuc' } | { loai: 'trang' } | null
export type KetQuaDiemDanh = { loai: 'chieu' } | { loai: 'ket-thuc'; lop: string } | { loai: 'trang' } | { loai: 'huy' } | { loai: 'loi'; chu: string }

/** Mở điểm danh + bảng. `hoi` hỏi thầy khi đang có buổi mở hoặc dạy nhiều lớp (trả null = huỷ). */
export async function batDauDiemDanh(hoi: (o: { dangMo: BuoiHoc | null; ds: string[] }) => Promise<ChonDiemDanh>): Promise<KetQuaDiemDanh> {
  const [dm, l] = await Promise.all([buoiDangMo(), layLopThay()])
  if (!dm.ok) return { loai: 'loi', chu: dm.chu }
  const mo = dm.du.find((b) => Date.now() - Date.parse(b.moLuc) < GAN_DAY_MS) ?? null
  const ds = l.ok ? l.du.lop.map((x) => x.tenLop).filter(Boolean) : []
  const chon: ChonDiemDanh = !mo && ds.length <= 1 ? { loai: 'moi', lop: ds[0] ?? '' } : await hoi({ dangMo: mo, ds })
  if (!chon) return { loai: 'huy' }
  if (chon.loai === 'trang') return { loai: 'trang' }
  if (chon.loai === 'ket-thuc') {
    if (!mo) return { loai: 'huy' }
    const r = await dongBuoiHoc(mo.id)
    if (!r.ok) return { loai: 'loi', chu: r.chu }
    dungDoc()
    try { (await import('../../components/bpu/gan-gv')).dongBang() } catch { /* bảng chưa nạp */ }
    return { loai: 'ket-thuc', lop: mo.lop || mo.ten }
  }
  let id = '', ma: string | null = null
  if (chon.loai === 'tiep' && mo) {
    const x = await xemBuoiHoc(mo.id)
    if (!x.ok) return { loai: 'loi', chu: x.chu }
    id = mo.id; ma = x.du.ma ?? null
  } else {
    const m = await moBuoiHoc(chon.loai === 'moi' ? chon.lop : '')
    if (!m.ok) return { loai: 'loi', chu: m.chu }
    id = m.du.buoi.id; ma = m.du.ma ?? null
  }
  // Bước Điểm danh / tin tự động của tờ chiếu nhận đúng buổi này (cùng khoá `ddh.gv.buoi-xem` của DiemDanhBuoi.tsx).
  try { localStorage.setItem('ddh.gv.buoi-xem', JSON.stringify({ id, n: homNayVn() })) } catch { /* chế độ riêng tư */ }
  const goc = window.location.origin
  const g = await import('../../components/bpu/gan-gv')
  g.moBangDiemDanh({ buoiId: id, ma, linkQr: ma ? linkDiemDanh(goc, ma) : null, onDong: dungDoc })
  dungDoc()
  const buoi = id
  henDoc = setInterval(() => {
    if (document.hidden) return
    void xemBuoiHoc(buoi).then((x) => { if (x.ok) g.capNhatMa(buoi, x.du.ma ?? null, x.du.ma ? linkDiemDanh(goc, x.du.ma) : null) })
  }, DOC_LAI_MS)
  return { loai: 'chieu' }
}
