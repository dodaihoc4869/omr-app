// THANG NỚI MIC của máy thầy + tìm lại mic đã chọn theo TÊN (tách khỏi thay.ts 11/11 tối).
// LỖI THẬT (ảnh cửa sổ nút Live của thầy 11/11 00:55): ô chọn ghi «Microphone (BOYALINK)» mà dòng chẩn đoán là «Microphone Array (Intel…) · cách mở 4/4» —
// bậc cuối cũ để thiết bị là «ideal», nên khi mã của mic đã chọn không còn đúng (cắm bộ thu sang cổng USB khác / Windows đổi mã ⇒ `exact` báo
// OverconstrainedError, thang nhảy thẳng lên bậc cuối) trình duyệt ÂM THẦM mở mic khác. Nay:
//  · thiết bị LUÔN `exact`; thang nới chỉ nới phần xử lý tiếng (bậc 0 theo luật lọc · 1 tắt khử vọng + lọc ồn · 2 mic thô);
//  · mã không còn đúng ⇒ tìm lại đúng mic ấy theo TÊN (`timMicTheoTen`); không thấy ⇒ mới mở mic mặc định của máy và BÁO RÕ trên cửa sổ nút Live
//    («Không mở được … — đang dùng …»), cắm lại là tự về mic đã chọn.

/** Số bậc; bậc cuối = SO_BAC − 1. */
export const SO_BAC = 3
export const BAC_CUOI = SO_BAC - 1

/** Ràng buộc mở mic ở bậc `b` (0 theo luật lọc `loc` · 1 tắt khử vọng + lọc ồn · 2 mic thô). Tự chỉnh âm lượng của TRÌNH DUYỆT giữ bật ở hai bậc đầu (đo 11/11:
 *  không «thở», giữ luồng 48 kHz một kênh), bậc 2 tắt. KHÔNG ép `channelCount` (chuỗi làm rõ tiếng tự cộng hai kênh về mono). */
export function rangBuocMic(id: string | null, loc: boolean, b: number, agc = true): MediaTrackConstraints {
  return {
    ...(id ? { deviceId: { exact: id } } : {}),
    echoCancellation: b >= 1 ? false : loc, noiseSuppression: b >= 1 ? false : loc, autoGainControl: (b < 2) === agc,
    ...(b < 1 ? { sampleRate: { ideal: 48000 } } : {}),
  }
}

/** Tên gọn của một thiết bị để so: bỏ «Default - » / «Communications - » / «Mặc định - », bỏ số thứ tự Windows thêm khi cắm lại («2- BOYALINK»). */
export function tenGon(ten: string): string {
  return ten.replace(/^(Default|Communications|Mặc định|Liên lạc)\s*-\s*/i, '').replace(/\(\s*\d+\s*-\s*/g, '(').replace(/\s+/g, ' ').trim().toLowerCase()
}
/** Phần TÊN THIẾT BỊ trong ngoặc («Microphone (BOYALINK)» ⇒ «boyalink»); không có ngoặc ⇒ cả tên gọn. */
export function loiThietBi(ten: string): string {
  const g = tenGon(ten), m = g.match(/\(([^()]*(?:\([^()]*\)[^()]*)*)\)\s*$/)
  return (m ? m[1]! : g).trim()
}

/** Mã thiết bị HIỆN TẠI của mic có tên `ten` (mã cũ không còn đúng). Không thấy / không có tên ⇒ null. */
export async function timMicTheoTen(ten: string): Promise<string | null> {
  if (!ten) return null
  try {
    const g = tenGon(ten)
    const d = (await navigator.mediaDevices.enumerateDevices()).find((x) => x.kind === 'audioinput' && !!x.deviceId && x.deviceId !== 'default' && x.deviceId !== 'communications' && tenGon(x.label) === g)
    return d?.deviceId ?? null
  } catch { return null }
}
/** Mic `id` (hoặc mic tên `ten`) đã có mặt trên máy chưa — dùng khi cắm / rút để quay về mic đã chọn. */
export async function coMic(id: string | null, ten: string): Promise<string | null> {
  try {
    const ds = (await navigator.mediaDevices.enumerateDevices()).filter((x) => x.kind === 'audioinput')
    if (id && ds.some((x) => x.deviceId === id)) return id
    const g = ten ? tenGon(ten) : ''
    return (g && ds.find((x) => !!x.deviceId && x.deviceId !== 'default' && x.deviceId !== 'communications' && tenGon(x.label) === g)?.deviceId) || null
  } catch { return null }
}
