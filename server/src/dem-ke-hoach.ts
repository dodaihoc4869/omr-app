// ĐỆM + DỒN LƯỢT cho `/hs/ke-hoach-ngay` (Boss 21/09 ~21:05: lệnh MỖI EM gọi nhiều nhất, 89 lượt/phút, trung vị 7,6 giây, máy em hết giờ rồi tự gọi lại chồng lên nhau).
//   • DỒN LƯỢT theo em (single-flight): lượt trùng khi lượt trước còn đang chạy dùng CHUNG một Promise ⇒ tính kế hoạch MỘT lần.
//   • ĐỆM 20 GIÂY theo em, mức mô-đun. Phần KHÔNG đệm: `thanThu` (đọc tươi mỗi lượt) và mọi khoá chỉ có ở lượt thật.
//   • XOÁ ĐỆM NGAY khi em có GHI (`emCoGhi`): sổ học, EXP game, cảnh báo đã xem, số phút mỗi ngày, và cuối các lệnh nộp (ôn lại, bài về nhà, xong chặng, thử thách) — số ở thẻ Hôm nay không đứng sau khi em nộp.
//     Một lượt tính đang bay mà em vừa ghi thì KẾT QUẢ của lượt ấy không được đệm và lượt mới không dùng chung với nó (mốc `ghiLuc` so đầu / cuối).
//   • Chỉ đệm phản hồi `ok:true`. Lượt đệm KHÔNG ghi gì (không dựng kế hoạch, không cộng EXP, không đánh dấu thông báo): mọi việc ghi nằm trong lượt thật.
import { DemTTL } from './dem-chung'

type KeHoach = Record<string, unknown>
export const HAN_DEM_KE_HOACH_MS = 20_000
const dem = new DemTTL<KeHoach>(HAN_DEM_KE_HOACH_MS, 500)
const dangBay = new Map<string, Promise<KeHoach>>()
const ghiLuc = new Map<string, number>()
let bo = 0

/** Em có GHI: bỏ đệm + không cho lượt đang bay được đệm / được dùng chung. `sbd` rỗng ⇒ bỏ qua. */
export function emCoGhi(sbd: string): void {
  if (!sbd) return
  dem.xoaKhoa(sbd); dangBay.delete(sbd)
  ghiLuc.set(sbd, ++bo)
  if (ghiLuc.size > 4000) for (const k of ghiLuc.keys()) { ghiLuc.delete(k); if (ghiLuc.size <= 3000) break } // dọn khoá cũ nhất
}
/** Xoá toàn bộ (test). */
export function xoaDemKeHoach(): void { dem.xoa(); dangBay.clear(); ghiLuc.clear() }

/** Kế hoạch của `sbd`: đệm còn hạn ⇒ trả bản sao; đang có lượt bay ⇒ chờ lượt ấy; không thì chạy `dung()` một lần. Trả bản SAO nông (nơi gọi được sửa khoá cấp ngoài). */
export async function keHoachCoDem(sbd: string, dung: () => Promise<KeHoach>, nowMs: number = Date.now()): Promise<KeHoach> {
  const c = dem.doc(sbd, nowMs)
  if (c) return { ...c }
  const bay = dangBay.get(sbd)
  if (bay) return { ...(await bay) }
  const moc = ghiLuc.get(sbd) ?? 0
  const p: Promise<KeHoach> = dung().then((kh) => {
    if (kh.ok === true && (ghiLuc.get(sbd) ?? 0) === moc) dem.ghi(sbd, nowMs, kh) // tuổi đệm tính từ LÚC BẮT ĐẦU tính (an toàn hơn lúc xong)
    return kh
  }).finally(() => { if (dangBay.get(sbd) === p) dangBay.delete(sbd) })
  dangBay.set(sbd, p)
  return { ...(await p) }
}
