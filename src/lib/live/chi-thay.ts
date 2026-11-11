// «CHỈ GIỌNG THẦY» — CỜ, CÔNG TẮC LÙI KHẨN, TẢI MÔ HÌNH (lượt 2, 11/11 đêm; docs/do-live-1011.md mục 11). Mảnh nhỏ, không phụ thuộc gì.
// CHƯA PHÁT HÀNH: mức này chỉ hiện khi ĐỦ HAI điều kiện — (1) có địa chỉ mô hình (URL_MO_HINH_THAY, hoặc `ddh.live.chi-thay-url` để thử) và (2) cờ
// `ddh.live.chi-thay` = 'hien'. Mô hình đạt đủ 4 tiêu chí mục 10.5 thì mới đặt URL_MO_HINH_THAY + bỏ điều kiện cờ. Mặc định TẮT (thầy phải chọn).
// CÔNG TẮC LÙI KHẨN: `ddh.live.chi-thay` = 'tat' ⇒ không bao giờ chạy mô hình (mức «Chỉ giọng thầy» coi như Tắt lọc), không hiện nút.
// Tệp mô hình (.tgt ≈ 2 MB) tải LƯỜI lần đầu thầy bật, KHÔNG nằm trong kho / precache của service worker; giọng thầy là dữ liệu riêng ⇒ khi phát hành, đặt
// sau lệnh có mã thầy của Worker, không để công khai.

/** Địa chỉ mô hình phát hành (null = chưa phát hành). */
export const URL_MO_HINH_THAY: string | null = null

const doc = (k: string): string => { try { return typeof localStorage !== 'undefined' ? localStorage.getItem(k) ?? '' : '' } catch { return '' } }
/** Công tắc lùi khẩn bật? */
export const chiThayTatKhan = (): boolean => doc('ddh.live.chi-thay') === 'tat'
/** Địa chỉ mô hình đang dùng (bản thử trong localStorage trước, rồi bản phát hành). */
export const urlMoHinhThay = (): string | null => { const u = doc('ddh.live.chi-thay-url'); return /^(https:\/\/|\/)/.test(u) ? u : URL_MO_HINH_THAY }
/** Có hiện mức «Chỉ giọng thầy» không. */
export const chiThayCo = (): boolean => !chiThayTatKhan() && doc('ddh.live.chi-thay') === 'hien' && !!urlMoHinhThay()

let dangTai: Promise<ArrayBuffer | null> | null = null
/** Tải tệp mô hình MỘT lần cho cả phiên (lỗi ⇒ null, lần bật sau thử lại). Trả BẢN SAO (Worker nhận bằng chuyển quyền sở hữu). */
export async function taiMoHinhThay(laySo: typeof fetch = fetch): Promise<ArrayBuffer | null> {
  const u = urlMoHinhThay()
  if (!u) return null
  if (!dangTai) dangTai = (async () => { try { const r = await laySo(u, { credentials: 'omit' }); if (!r.ok) return null; const b = await r.arrayBuffer(); return b.byteLength >= 16 ? b : null } catch { return null } })().then((b) => { if (!b) dangTai = null; return b })
  const b = await dangTai
  return b ? b.slice(0) : null
}
