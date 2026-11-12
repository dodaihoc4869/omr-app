// ĐIỂM DANH TỪ MÀN HÔM NAY (thầy 09/11: «bấm điểm danh cái vào màn chiếu luôn, hs nào điểm danh ở trên lớp là được … bỏ luôn chọn lớp đi … tối ưu tốc độ
// tức thì hơn nữa»). Nạp lười. Một lần bấm, KHÔNG hỏi gì:
//   · buổi đang mở trong 3 giờ gần nhất ⇒ dùng tiếp (bảng mở NGAY, mã đọc song song rồi cập nhật lên bảng); không có ⇒ mở buổi mới «mọi lớp» (em nào nhập
//     mã ở lớp là có mặt) ⇒ bảng mở với mã vừa cấp;
//   · bảng Bình Phản Ứng ở màn điểm danh ⇒ «Xong điểm danh» ⇒ «Hôm nay làm gì?» (có «Kết thúc buổi học»).
// TỨC THÌ: `napSan()` (Hôm nay rảnh thì gọi) tải sẵn mảnh bảng; `hoiSom()` (chạm / rê vào nút) hỏi máy chủ buổi đang mở TRƯỚC khi bấm xong.
// Mã đổi mỗi phút ⇒ khi bảng còn mở, đọc lại buổi 15 giây một lần (một lệnh nhẹ `xem`) và cập nhật mã trên bảng; bảng đóng ⇒ thôi đọc.
import { buoiDangMo, linkDiemDanh, moBuoiHoc, xemBuoiHoc, type BuoiHoc, laBuoiLive } from '../buoi-hoc-api'
import type { KetQuaLenh } from '../goi-lenh-thay'

const GAN_DAY_MS = 3 * 3_600_000
const DOC_LAI_MS = 15_000
const HOI_SOM_MS = 20_000
const homNayVn = () => new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10)
let henDoc: ReturnType<typeof setInterval> | null = null
let som: { p: Promise<KetQuaLenh<BuoiHoc[]>>; luc: number } | null = null

function dungDoc(): void { if (henDoc) clearInterval(henDoc); henDoc = null }
const napGan = () => import('../../components/bpu/gan-gv')

/** Tải sẵn mảnh bảng (gọi lúc Hôm nay rảnh) ⇒ bấm Điểm danh không phải chờ tải mã. */
export function napSan(): void { void napGan().catch(() => {}) }
/** Buổi đang mở gần đây (≤ 3 giờ) — nút «Kết thúc» cạnh Điểm danh ở Hôm nay. */
export async function buoiMoGanDay(): Promise<string | null> {
  const r = await hoiSom()
  return r.ok ? r.du.find((b) => !laBuoiLive(b) && Date.now() - Date.parse(b.moLuc) < GAN_DAY_MS)?.id ?? null : null
}
/** Hỏi sớm buổi đang mở (chạm / rê vào nút) — lần bấm ngay sau dùng lại kết quả (≤ 20 giây). */
export function hoiSom(): Promise<KetQuaLenh<BuoiHoc[]>> {
  if (!som || Date.now() - som.luc > HOI_SOM_MS) som = { p: buoiDangMo(), luc: Date.now() }
  return som.p
}

export type KetQuaDiemDanh = { loai: 'chieu' } | { loai: 'loi'; chu: string }

export async function batDauDiemDanh(): Promise<KetQuaDiemDanh> {
  // Đang có phiên (Esc ra Hôm nay) ⇒ vào lại ĐÚNG chỗ dở NGAY, không hỏi máy chủ (thầy 09/11 «bấm vào điểm danh thì vào đúng chỗ đang dở»).
  const g0 = await napGan()
  const p = g0.phienDangCo()
  if (p) { g0.moBangDiemDanh({ buoiId: p.buoiId }); return { loai: 'chieu' } } // (đang có phòng live tạm ẩn ⇒ vào lại đúng phòng đó)
  const [dm, g] = await Promise.all([hoiSom(), napGan()])
  som = null
  if (!dm.ok) return { loai: 'loi', chu: dm.chu }
  const mo = dm.du.find((b) => !laBuoiLive(b) && Date.now() - Date.parse(b.moLuc) < GAN_DAY_MS) ?? null
  const goc = window.location.origin
  const lk = (ma: string | null) => (ma ? linkDiemDanh(goc, ma) : null)
  let id = '', ma: string | null = null
  if (mo) {
    id = mo.id
    // Bảng mở NGAY (chưa có mã ⇒ ô mã chờ); mã đọc song song rồi cập nhật lên bảng.
    void xemBuoiHoc(id).then((x) => { if (x.ok) g.capNhatMa(id, x.du.ma ?? null, lk(x.du.ma ?? null)) })
  } else {
    const m = await moBuoiHoc('')
    if (!m.ok) return { loai: 'loi', chu: m.chu }
    id = m.du.buoi.id; ma = m.du.ma ?? null
  }
  // Bước Điểm danh / tin tự động của tờ chiếu nhận đúng buổi này (cùng khoá `ddh.gv.buoi-xem` của DiemDanhBuoi.tsx).
  try { localStorage.setItem('ddh.gv.buoi-xem', JSON.stringify({ id, n: homNayVn() })) } catch { /* chế độ riêng tư */ }
  g.moBangDiemDanh({ buoiId: id, ma, linkQr: lk(ma), onDong: dungDoc })
  dungDoc()
  henDoc = setInterval(() => {
    if (document.hidden || document.documentElement.hasAttribute('data-bpu-an')) return // tab ẩn / phiên tạm ẩn ⇒ thôi đọc
    void xemBuoiHoc(id).then((x) => { if (x.ok) g.capNhatMa(id, x.du.ma ?? null, lk(x.du.ma ?? null)) })
  }, DOC_LAI_MS)
  return { loai: 'chieu' }
}
