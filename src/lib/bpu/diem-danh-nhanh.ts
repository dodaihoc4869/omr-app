// ĐIỂM DANH TỪ MÀN HÔM NAY (thầy 09/11: «chuyển nút điểm danh ra màn hôm nay, bỏ hẳn thẻ hành trình, khi bấm nút điểm danh tự động hiện ra mọi thứ
// chọn như đang làm»). Nạp lười khi thầy bấm nút. Một lần bấm:
//   1) buổi đang mở của máy chủ (mở trong 4 giờ gần nhất) ⇒ dùng tiếp; không có ⇒ mở buổi mới (thầy dạy nhiều lớp ⇒ hỏi lớp);
//   2) bật bảng Bình Phản Ứng ở màn điểm danh (mã + QR) ⇒ «Xong điểm danh · Chọn câu» ⇒ chọn câu ngay trên bảng ⇒ các lượt, gọi lên bảng.
// Mã đổi mỗi phút ⇒ khi bảng còn mở, đọc lại buổi 15 giây một lần (một lệnh nhẹ `xem`) và cập nhật mã trên bảng; bảng đóng ⇒ thôi đọc.
import { buoiDangMo, linkDiemDanh, moBuoiHoc, xemBuoiHoc } from '../buoi-hoc-api'
import { layLopThay } from '../ten-lop-thay'

const GAN_DAY_MS = 4 * 3_600_000
const DOC_LAI_MS = 15_000
const homNayVn = () => new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10)
let henDoc: ReturnType<typeof setInterval> | null = null

function dungDoc(): void { if (henDoc) clearInterval(henDoc); henDoc = null }

/** Mở điểm danh + bảng. `chonLop` hỏi thầy khi có nhiều lớp (trả null = huỷ). Trả câu báo lỗi (rỗng = đã mở bảng / thầy huỷ). */
export async function batDauDiemDanh(chonLop: (ds: string[]) => Promise<string | null>): Promise<string> {
  const dm = await buoiDangMo()
  if (!dm.ok) return dm.chu
  let id = dm.du.find((b) => Date.now() - Date.parse(b.moLuc) < GAN_DAY_MS)?.id ?? ''
  let ma: string | null = null
  if (!id) {
    const r = await layLopThay()
    const ds = r.ok ? r.du.lop.map((l) => l.tenLop).filter(Boolean) : []
    const lop = ds.length === 1 ? ds[0]! : await chonLop(ds)
    if (lop == null) return ''
    const m = await moBuoiHoc(lop)
    if (!m.ok) return m.chu
    id = m.du.buoi.id
    ma = m.du.ma ?? null
  } else {
    const x = await xemBuoiHoc(id)
    if (!x.ok) return x.chu
    ma = x.du.ma ?? null
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
  return ''
}
