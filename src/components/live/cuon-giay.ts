// LIVE BẢNG — MÁY EM: EM TỰ CUỘN GIẤY ĐỀ (13/11, thầy buổi Live theo khối: «Đề trên máy học sinh không vuốt cuộn xuống được»). Thuần: không DOM.
//
// GỐC LỖI (đo bằng Chromium thật, scripts/thu-live-1011/thu-cuon-de-1311.mjs): điện thoại cầm DỌC ⇒ cả lớp live bị XOAY 90° bằng CSS (chieu-xoay.ts —
// iPhone không khoá hướng được nên đa số em ở cảnh này). Trong khối xoay, trình duyệt KHÔNG cuộn hộ khung cuộn bằng ngón tay:
//   · `touch-action: pan-y` xét theo trục MÀN ⇒ cú vuốt «xuống của hình» (= vuốt NGANG màn) bị coi là vuốt ngang, bị cấm ngay từ đầu;
//   · kể cả khi cho phép mọi hướng, khung cuộn nằm trong khối xoay 90° vẫn đứng im (trình duyệt nhận cú vuốt, huỷ con trỏ, không dời `scrollTop`).
// ⇒ Hình đang xoay thì khung giấy TỰ CUỘN THEO NGÓN TAY (KhungDocLap.tsx): đổi trục con trỏ về trục của hình (`toaDoXoay`), dời `scrollTop` đúng quãng
//   ngón đi, nhả tay thì trôi tiếp theo quán tính. Máy ngang thật / máy tính: trình duyệt cuộn như cũ (đo: vẫn chạy), không qua đường này.
//
// LỖI THỨ HAI (cùng triệu chứng, mọi máy): giấy SOI chỉ bật cuộn khi TẤM GIẤY (= ô giấy thầy đang thấy, đã co) cao hơn khung. Đề dài hơn cả ô giấy của
// thầy mà khung máy em cao (máy tính bảng dọc, cửa sổ máy tính) ⇒ khung không cuộn, phần đề dưới mép khung bị cắt. Thầy cuộn / lật trang giấy của thầy
// ⇒ phần đề đã trôi lên trên mép giấy thầy (toạ độ âm) em không bao giờ kéo về xem lại được. `tranGiay` tính phần đề nằm NGOÀI ô giấy thầy đang thấy
// để khung giấy máy em cuộn được HẾT đề (trên lẫn dưới), mốc «ngang hàng với thầy» vẫn là mép trên tấm giấy (nét gạch trên giấy không lệch chữ).

/** Ngón tay đi quá ngần này (px) mới tính là KÉO (dưới đó là chạm — như khung bảng đen). */
export const NGUONG_KEO = 7
/** Quán tính: hằng số tắt dần (ms) · dưới vận tốc này thì dừng (px/ms) · trần vận tốc (px/ms) · chỉ tính vận tốc từ các mẫu trong ngần này (ms). */
export const QUAN_TINH_MS = 325, V_DUNG = 0.03, V_TRAN = 4, CUA_SO_V_MS = 100

export interface KeoCuon {
  /** Ngón đi tới `y` (trục dọc của HÌNH, px) lúc `luc` (ms). Trả quãng phải cuộn thêm (px; dương = cuộn xuống, tức ngón đi lên) — 0 khi chưa vượt ngưỡng kéo. */
  di: (y: number, luc: number) => number
  /** Nhả ngón lúc `luc`: trả vận tốc trôi tiếp (px/ms, cùng dấu với quãng cuộn; 0 = đứng lại — chưa kéo, hoặc ngón đã dừng trước khi nhả). */
  nha: (luc: number) => number
  /** Đã vượt ngưỡng (đang kéo thật) chưa. */
  dangKeo: () => boolean
}
/** MỘT lần đặt ngón tay lên giấy: ngón ở `y0` lúc `luc0`. */
export function taoKeoCuon(y0: number, luc0: number): KeoCuon {
  let y = y0, keo = false
  /** Mẫu gần đây [y, lúc] để tính vận tốc lúc nhả. */
  let mau: [number, number][] = [[y0, luc0]]
  return {
    di(yMoi, luc) {
      if (!keo && Math.abs(yMoi - y0) < NGUONG_KEO) return 0
      // vừa vượt ngưỡng: cuộn từ chỗ ngón đang đứng (không giật bù cả quãng ngưỡng)
      const d = keo ? y - yMoi : 0
      keo = true; y = yMoi
      mau.push([yMoi, luc])
      if (mau.length > 8) mau = mau.slice(-8)
      return d
    },
    nha(luc) {
      if (!keo) return 0
      const gan = mau.filter((m) => luc - m[1] <= CUA_SO_V_MS), a = gan[0], b = gan[gan.length - 1]
      // ngón dừng hẳn rồi mới nhả (không còn mẫu gần) / chỉ một mẫu ⇒ không trôi
      if (!a || !b || b[1] - a[1] < 1) return 0
      const v = (a[0] - b[0]) / (b[1] - a[1])
      return Math.abs(v) < V_DUNG * 4 ? 0 : Math.max(-V_TRAN, Math.min(V_TRAN, v))
    },
    dangKeo: () => keo,
  }
}

/** MỘT bước quán tính: vận tốc `v` (px/ms) chạy `dt` ms ⇒ quãng cuộn thêm + vận tốc còn lại (0 = dừng). Tắt dần theo hàm mũ, không phụ thuộc nhịp khung hình. */
export function buocQuanTinh(v: number, dt: number): { di: number; v: number } {
  const t = Math.max(0, Math.min(64, dt)), k = Math.exp(-t / QUAN_TINH_MS)
  // quãng đi = tích phân v·e^(−t/τ) trên bước này
  const di = v * QUAN_TINH_MS * (1 - k), sau = v * k
  return { di, v: Math.abs(sau) < V_DUNG ? 0 : sau }
}

/** GIẤY SOI — phần đề nằm NGOÀI ô giấy thầy đang thấy (px của giấy thầy). `o` = các khối bố cục [loại, thứ tự, x, y, rộng, cao, …] (giay-thay-do.ts),
 *  `cao` = bề cao ô giấy của thầy. `tren` = đã trôi lên trên mép trên (thầy cuộn / lật trang xuống) · `duoi` = còn nằm dưới mép dưới (thầy chưa cuộn tới). */
export function tranGiay(o: readonly (readonly number[])[], cao: number): { tren: number; duoi: number } {
  let tren = 0, duoi = 0
  for (const b of o) {
    const y = b[3], h = b[5]
    if (typeof y !== 'number' || typeof h !== 'number' || !Number.isFinite(y) || !Number.isFinite(h)) continue
    if (-y > tren) tren = -y
    if (y + h - cao > duoi) duoi = y + h - cao
  }
  return { tren, duoi }
}

/** Thầy vừa cuộn giấy của thầy ⇒ phần đề phía trên tấm giấy (`du`, px máy em) đổi từ `duCu` sang `duMoi`. Trả độ cuộn mới của khung giấy máy em TÍNH TỪ
 *  MÉP TRÊN TẤM GIẤY (cùng mốc với `cuon`): em không tự cuộn gần đây ⇒ giữ nguyên (em đi theo giấy thầy như trước); em vừa tự cuộn (`nhuong`) ⇒ chữ em
 *  đang đọc ĐỨNG YÊN trên màn (mốc dời đúng quãng thầy cuộn). */
export function cuonSauThayCuon(cuon: number, duCu: number, duMoi: number, nhuong: boolean): number {
  return nhuong ? cuon + duCu - duMoi : cuon
}
