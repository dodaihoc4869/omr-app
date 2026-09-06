// GIỮ ĐĂNG NHẬP THEO TAB — GIU-DANG-NHAP-THEO-TAB.md, thầy duyệt 06/09.
//
// VẤN ĐỀ. Mã bí mật sống trong bộ nhớ chương trình nên TẢI LẠI TRANG là mất:
// F5, kéo xuống làm mới, app tự cập nhật, bấm nhầm link rồi quay lại, và điện
// thoại huỷ tab ở nền rồi dựng lại. Thầy phải gõ mật khẩu lại giữa buổi dạy.
//
// KHÔNG ĐƯỢC cất mã bí mật dạng chữ thường ra ngoài bộ nhớ — đó là điều cấm
// gốc của MATKHAUMOAPP, và cũng là lý do tính năng mật khẩu tồn tại.
//
// CHÌA PHIÊN HAI MẢNH. Mở khoá xong, app chia chìa làm hai, không mảnh nào
// dùng được một mình:
//
//   mảnh 1 — BẢN MÃ của mã bí mật, cất trong `sessionStorage`.
//            Sống qua tải lại trang. CHẾT khi đóng tab. Một mình thì vô nghĩa
//            vì không có khoá để giải.
//
//   mảnh 2 — KHOÁ PHIÊN AES-GCM, cất trong IndexedDB.
//            Sinh với `extractable: false`, nên trình duyệt KHÔNG cho xuất nội
//            dung khoá ra, kể cả bằng `crypto.subtle.exportKey`. Công cụ nhà
//            phát triển nhìn thấy một đối tượng khoá, không đọc được byte nào.
//            Một mình cũng vô nghĩa vì không có bản mã để giải.
//
// Đóng tab: mảnh 1 mất, mảnh 2 nằm lại thành rác và bị dọn ngay lần mở sau.
//
// GIỚI HẠN, nói thẳng (đặc tả mục 10): người ngồi TẠI máy thầy với tab đang mở
// khoá thì chạy JS trong trang đó vẫn giải ra được. Điều đó ĐÃ đúng từ trước —
// tab đang mở khoá thì mọi lệnh của app cũng gọi được. Thay đổi này không làm
// yếu thêm; nó chỉ khiến tải lại trang không phải gõ lại mật khẩu.
import { datMaBiMatPhien, loadKhoaPhien, saveKhoaPhien, xoaKhoaPhien } from './exam-db'

// ---------------------------------------------------------------------------
// MỘT NGUỒN SỰ THẬT CẤU HÌNH (đặc tả mục 3)

/** Tên khoá trong `sessionStorage`. Một chỗ khai, để bộ kiểm không đoán. */
export const KHOA_PHIEN_SS = 'omr-phien'

/** Thầy chốt 06/09: giữ đăng nhập là hành vi mặc định. */
export const GIU_PHIEN_MAC_DINH = true

/** Chuẩn của AES-GCM. Trùng `DAI_IV` của khoa-app nhưng cố ý khai riêng: hai
 * lớp mã hoá độc lập, đổi lớp này không được kéo theo lớp kia. */
const DAI_IV_PHIEN = 12

// ---------------------------------------------------------------------------
// TIỆN ÍCH

function b64(b: ArrayBuffer | Uint8Array): string {
  const u = b instanceof Uint8Array ? b : new Uint8Array(b)
  let s = ''
  for (const x of u) s += String.fromCharCode(x)
  return btoa(s)
}

function tuB64(s: string): Uint8Array {
  const t = atob(s)
  const u = new Uint8Array(t.length)
  for (let i = 0; i < t.length; i++) u[i] = t.charCodeAt(i)
  return u
}

/** `sessionStorage` có thể ném lỗi (chế độ riêng tư, trình duyệt chặn lưu trữ).
 * Hỏng thì coi như không có phiên — thầy gõ mật khẩu, app vẫn chạy. */
function kho(): Storage | null {
  try {
    const s = window.sessionStorage
    // Thử ghi thật: Safari chế độ riêng tư cho đọc `sessionStorage` nhưng ném
    // lỗi lúc ghi, mà biết muộn thì đã tưởng cất được rồi.
    const k = '__thu-omr'
    s.setItem(k, '1')
    s.removeItem(k)
    return s
  } catch {
    return null
  }
}

/** Bản mã cất trong `sessionStorage`. KHÔNG có trường nào là mã bí mật. */
interface GoiPhien {
  /** base64 */
  iv: string
  /** base64 — mã bí mật đã mã hoá bằng khoá phiên */
  maHoa: string
}

// ---------------------------------------------------------------------------
// BA VIỆC

/** CẤT PHIÊN. Gọi ngay sau khi mở khoá thành công.
 *
 * Hỏng ở bất kỳ bước nào thì dọn sạch rồi trả `false` — thà không có phiên còn
 * hơn để lại một nửa. App vẫn chạy bình thường, chỉ là tải lại trang sẽ hỏi. */
export async function catPhien(maBiMat: string): Promise<boolean> {
  const s = kho()
  if (!s || !maBiMat) return false
  try {
    const khoa = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
    const iv = crypto.getRandomValues(new Uint8Array(DAI_IV_PHIEN))
    const maHoa = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      khoa,
      new TextEncoder().encode(maBiMat),
    )
    // Cất KHOÁ trước, BẢN MÃ sau. Ngược lại thì có lúc bản mã nằm đó mà chưa có
    // khoá, và lần mở sau sẽ dọn nhầm.
    await saveKhoaPhien(khoa)
    const goi: GoiPhien = { iv: b64(iv), maHoa: b64(maHoa) }
    s.setItem(KHOA_PHIEN_SS, JSON.stringify(goi))
    return true
  } catch {
    await donPhien()
    return false
  }
}

/** KHÔI PHỤC PHIÊN. Trả mã bí mật, hoặc `null` nếu tab này chưa có phiên.
 *
 * Thiếu MỘT mảnh cũng là không có phiên. Riêng trường hợp có khoá mà không có
 * bản mã (tab cũ đã đóng) thì xoá luôn khoá — đặc tả mục 2.3 điều 1, đây là
 * chỗ dễ để rác lại nhất. */
export async function khoiPhucPhien(): Promise<string | null> {
  const s = kho()
  const tho = s ? s.getItem(KHOA_PHIEN_SS) : null
  if (!tho) {
    // Không có bản mã ⇒ khoá phiên còn nằm trong máy là rác.
    await xoaKhoaPhien().catch(() => {})
    return null
  }
  try {
    const goi = JSON.parse(tho) as GoiPhien
    const khoa = await loadKhoaPhien()
    if (!khoa || !goi?.iv || !goi?.maHoa) {
      await donPhien()
      return null
    }
    const ra = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: tuB64(goi.iv) as unknown as BufferSource },
      khoa,
      tuB64(goi.maHoa) as unknown as BufferSource,
    )
    const ma = new TextDecoder().decode(ra)
    return ma || null
  } catch {
    // Dữ liệu hỏng, khoá không khớp, hay trình duyệt từ chối: dọn rồi hỏi mật
    // khẩu như bình thường. KHÔNG báo lỗi kỹ thuật cho thầy.
    await donPhien()
    return null
  }
}

/** XOÁ HAI MẢNH CHÌA, giữ nguyên mã bí mật trong bộ nhớ.
 *
 * Dùng khi thầy tắt ô gạt "Giữ đăng nhập" giữa lúc đang làm việc: phiên hết
 * hiệu lực từ bây giờ, nhưng thầy không bị đá ra màn khoá. */
export async function xoaChiaPhien(): Promise<void> {
  try {
    kho()?.removeItem(KHOA_PHIEN_SS)
  } catch {
    // Không xoá được thì bản mã còn đó, nhưng khoá phiên bị xoá ngay dưới đây
    // nên nó cũng không giải ra được gì.
  }
  await xoaKhoaPhien().catch(() => {})
}

/** DỌN PHIÊN — ba việc đi liền nhau, cấm gọi lẻ (đặc tả mục 2.3).
 *
 * Bỏ sót một trong ba là đẻ cửa sau: khoá màn hình xong mà tải lại trang vẫn
 * vào được thì cái khoá đó vô nghĩa. */
export async function donPhien(): Promise<void> {
  datMaBiMatPhien(null)
  await xoaChiaPhien()
}

/** Tab này có bản mã phiên chưa. Dùng để test và để màn Cài đặt hiện trạng thái. */
export function coGoiPhien(): boolean {
  try {
    return !!kho()?.getItem(KHOA_PHIEN_SS)
  } catch {
    return false
  }
}
