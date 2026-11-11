// LIVE BẢNG — LUẬT GỬI ĐIỂM ĐANG VIẾT của máy thầy (phần thuần, tách khỏi thay.ts 12/11 để thử được và để thay.ts không phình).
// Hai đường: DataChannel «net» qua SFU (không thứ tự, không gửi lại — nhanh, có thể mất) và WebSocket của phòng (tin cậy, chậm hơn; chỉ gửi khi có em cần).
//   · DataChannel: gửi NGAY sau mỗi khung vẽ của thầy (11/11: bản trước chờ thêm 16 ms ⇒ máy em trễ thêm đúng một khung), hai gói cách nhau ≥ 12 ms
//     (màn 120–240 Hz không bắn quá ~80 gói / giây).
//   · DƯ THỪA CHỐNG MẤT GÓI (12/11, thầy: «thử iphone mạng wifi 1 vạch nét chữ ko mượt»): mỗi gói mang kèm điểm của `LO_KEM` = 3 lô liền trước (trước: 1 lô)
//     ⇒ mất tới 3 gói liền không thủng nét; phần kèm không quá `DU_TOI_DA` điểm (bút 240 Hz không làm gói phình).
//     KHÔNG đổi định dạng gói: vẫn là gói `0x21`, chỉ là `tu` lùi về trước. Máy em — kể cả bản cũ đang mở chưa tải lại — vốn ghi điểm theo CHỈ SỐ trong
//     nét, điểm đã có thì bỏ qua (bản cũ đã nhận «lô trước + lô mới» từ 11/11) ⇒ tương thích ngược. Tốn thêm ≈ 9 byte × ~7 điểm mỗi gói.
//   · KHÔNG gửi lặp gói cuối của nét SAU một quãng trễ (đã thử +25 / +70 ms): máy em bản cũ lúc đó đã phát xong nét, gói lặp tới muộn làm nó dựng lại
//     một nét «ma» (mô phỏng mạng tốt: trễ 54 → 90 ms, 11 nét phải sửa hình). Gói cuối vẫn gửi hai lần liền nhau như trước.
//   · WebSocket: ≥ 34 ms một lô (≤ 30 lô / giây). Không em nào cần thì `daWs` đứng yên ⇒ có em vừa xin giữa nét (DataChannel của em thủng / rớt) thì nét
//     đang viết đi WebSocket TỪ ĐẦU, máy em vá được các lỗ của chính nét đó. Đường lên của thầy nghẽn (`bufferedAmount` > `NGHEN_WS`) ⇒ chưa gửi thêm;
//     hết nghẽn chỉ gửi phần MỚI NHẤT của nét (một gói), điểm cũ bỏ — bản chốt của nét sẽ mang đủ — để không dồn trễ.
import type { DiemBut } from '../but-bang-loi'
import { DIEM_TOI_DA_MOT_GOI, type DauNet } from './ma-net'

/** Một nét đang viết ở phía gửi. `daDc` / `daWs` = số điểm đã gửi trên từng đường; `lichDc` = chỉ số điểm đầu của các lô DataChannel vừa gửi
 *  (cũ → mới, giữ `LO_KEM` lô); `nghen` = đường WebSocket vừa nghẽn lúc nét này còn điểm chờ. */
export interface NetGui { dau: DauNet; diem: DiemBut[]; tGoc: number | null; daDc: number; lichDc: number[]; daWs: number; nghen?: boolean }
export const WS_CACH_MS = 34, XA_MS = 0, DC_CACH_MS = 12
export const LO_KEM = 3, DU_TOI_DA = 24, NGHEN_WS = 24_000
/** TIN NHẤC BÚT nhắc lại sau ngần này ms (chỉ tin nhấc, 20 byte): máy em BẢN CŨ khi mạng rung hay dựng lại nét đã xong thành nét «ma» không bao giờ nhấc
 *  (con trỏ cứ nhảy về chỗ nét ma) — tin nhấc tới sau sẽ dọn nó. Máy em bản mới và nét đã dọn: tin này vô hại (không có nét thì bỏ qua). */
export const NHAC_LAI_MS = [300, 1200]

export const netGuiMoi = (dau: DauNet, diem: DiemBut[]): NetGui => ({ dau, diem, tGoc: null, daDc: 0, lichDc: [], daWs: 0 })
/** Gói DataChannel kế tiếp của nét bắt đầu từ điểm nào: đầu của lô thứ `LO_KEM` trước đó (chưa đủ thì từ lô cũ nhất đang nhớ). */
export function tuGoiDc(n: NetGui): number {
  return Math.max(n.lichDc.length ? n.lichDc[0]! : n.daDc, n.daDc - DU_TOI_DA, n.diem.length - DIEM_TOI_DA_MOT_GOI, 0)
}
/** Vừa gửi xong một gói DataChannel tới hết nét hiện có: ghi lô đó vào lịch. */
export function daGuiDc(n: NetGui): void {
  n.lichDc.push(n.daDc)
  if (n.lichDc.length > LO_KEM) n.lichDc.shift()
  n.daDc = n.diem.length
}
/** Gói LẶP của lô cuối nét (gửi ngay sau gói cuối): cùng tầm với gói cuối. */
export function tuGoiCuoi(n: NetGui): number {
  return Math.max(n.lichDc.length ? n.lichDc[0]! : 0, n.diem.length - DU_TOI_DA - 8, n.diem.length - DIEM_TOI_DA_MOT_GOI, 0)
}
/** Đường WebSocket vừa hết nghẽn: nét nào từng bị chặn thì chỉ còn gửi phần mới nhất (một gói). Trả chỉ số điểm bắt đầu gửi. */
export function tuGoiWs(n: NetGui): number {
  if (n.nghen) { n.nghen = false; n.daWs = Math.max(n.daWs, n.diem.length - DIEM_TOI_DA_MOT_GOI) }
  return n.daWs
}
