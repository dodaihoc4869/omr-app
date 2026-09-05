// MẬT KHẨU MỞ APP QUẢN LÝ — MATKHAUMOAPP.md, thầy duyệt 05/09.
//
// VÌ SAO KHÔNG CHỈ DỰNG MỘT MÀN HỎI MẬT KHẨU.
//
// Hôm nay mã bí mật gọi Apps Script nằm DẠNG CHỮ THƯỜNG trong IndexedDB máy
// thầy. Ai cầm được máy đang mở khoá thì xem được điểm cả trung tâm, danh bạ số
// điện thoại phụ huynh, kho đề có đáp án — và nếu biết chút kỹ thuật thì mở công
// cụ nhà phát triển đọc thẳng mã bí mật ra rồi gọi Apps Script TỪ MÁY KHÁC. Lúc
// đó mất máy hay không cũng không còn quan trọng.
//
// Một tấm màn che giao diện chặn được người tò mò, KHÔNG chặn được người biết
// nghề: mã bí mật vẫn nằm nguyên đó.
//
// Nên ở đây mật khẩu dùng để MÃ HOÁ mã bí mật. Sau khi thầy đặt mật khẩu,
// IndexedDB không còn mã bí mật dạng chữ thường — chỉ còn một khối đã mã hoá,
// muối và số vòng. Nhập đúng thì app giải ra và giữ trong BỘ NHỚ PHIÊN LÀM VIỆC;
// đóng app là mất. Nhập sai thì app KHÔNG CÓ CHÌA để gọi máy chủ, chứ không phải
// bị một tấm màn chặn.
//
// Dùng Web Crypto có sẵn trong trình duyệt: PBKDF2-SHA256 dẫn xuất khoá, AES-GCM
// mã hoá. Không thêm thư viện, không đổi nền công nghệ.
//
// GIỚI HẠN, nói thẳng để không tin quá mức (đặc tả mục 11): mật khẩu này bảo vệ
// MÁY THẦY, không bảo vệ Google Sheet. Ai đã có mã bí mật từ nguồn khác thì gọi
// thẳng Apps Script được, không cần đi qua app.

// ---------------------------------------------------------------------------
// MỘT NGUỒN SỰ THẬT CẤU HÌNH (mục 3). Cấm rải số vào màn hình.

/** Đủ chậm để dò mật khẩu ngắn không kinh tế, đủ nhanh để mở app dưới một giây
 * trên điện thoại thầy. */
export const SO_VONG_PBKDF2 = 210000

/** Muối ngẫu nhiên mỗi lần đặt mật khẩu — hai máy cùng mật khẩu vẫn ra hai khối
 * mã khác nhau, và bảng dò dựng sẵn vô dụng. */
export const DAI_MUOI = 16

/** Chuẩn của AES-GCM. */
export const DAI_IV = 12

/** Thầy gõ trên điện thoại. Ép chữ hoa, chữ số, ký tự đặc biệt chỉ dẫn tới việc
 * thầy viết mật khẩu ra giấy dán cạnh máy — đó mới là lỗ hổng thật. */
export const TOI_THIEU_KY_TU = 6

export const SAI_TRUOC_KHI_CHO = 5
export const CHO_BAN_DAU_GIAY = 60
export const CHO_TOI_DA_GIAY = 1800

/** Ba nấc hỏi lại. Mặc định MỖI LẦN MỞ, đúng câu thầy nói; hai nấc kia cho buổi
 * dạy nào thầy đóng mở app liên tục. */
export type NacHoiLai = 'moi_lan_mo' | 'sau_15_phut' | 'sau_60_phut'
export const HOI_LAI_MAC_DINH: NacHoiLai = 'moi_lan_mo'
export const PHUT_CUA_NAC: Record<NacHoiLai, number> = { moi_lan_mo: 0, sau_15_phut: 15, sau_60_phut: 60 }
export const TEN_NAC: Record<NacHoiLai, string> = {
  moi_lan_mo: 'Mỗi lần mở app',
  sau_15_phut: 'Sau 15 phút không dùng',
  sau_60_phut: 'Sau 60 phút không dùng',
}

export const LOI_SAI_MAT_KHAU = 'Mật khẩu không đúng'

// ---------------------------------------------------------------------------
// BẢN GHI CẤT TRONG INDEXEDDB
//
// KHÔNG có trường nào chứa mật khẩu, kể cả dạng băm để "kiểm tra nhanh". Không
// cần: sai mật khẩu thì AES-GCM tự báo lỗi xác thực, đó CHÍNH LÀ phép kiểm.

export interface BanGhiKhoa {
  /** base64 */
  muoi: string
  soVong: number
  /** base64 */
  iv: string
  /** base64 — mã bí mật đã mã hoá */
  maHoa: string
  /** Số lần nhập sai liên tiếp; về 0 khi mở được. */
  soLanSai: number
  /** Mốc (ms) trước đó không cho thử tiếp. 0 = không chờ. */
  mocMoLai: number
  hoiLai: NacHoiLai
}

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

function nganNhien(n: number): Uint8Array {
  const u = new Uint8Array(n)
  crypto.getRandomValues(u)
  return u
}

async function danXuatKhoa(matKhau: string, muoi: Uint8Array, soVong: number): Promise<CryptoKey> {
  const goc = await crypto.subtle.importKey('raw', new TextEncoder().encode(matKhau), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: muoi as unknown as BufferSource, iterations: soVong, hash: 'SHA-256' },
    goc,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

// ---------------------------------------------------------------------------
// BA VIỆC (mục 2.2)

export function hopLeMatKhau(matKhau: string): boolean {
  return typeof matKhau === 'string' && matKhau.length >= TOI_THIEU_KY_TU
}

/** Dẫn xuất khoá từ mật khẩu, mã hoá mã bí mật, trả bản ghi để cất.
 *
 * Muối và IV sinh mới mỗi lần, nên đặt lại cùng một mật khẩu vẫn ra bản ghi
 * khác hẳn — không ai so hai bản ghi mà đoán được mật khẩu có đổi hay không. */
export async function datMatKhau(matKhau: string, maBiMat: string, hoiLai: NacHoiLai = HOI_LAI_MAC_DINH): Promise<BanGhiKhoa> {
  if (!hopLeMatKhau(matKhau)) throw new Error(`Mật khẩu phải từ ${TOI_THIEU_KY_TU} ký tự`)
  if (!maBiMat) throw new Error('Chưa có mã bí mật để mã hoá')
  const muoi = nganNhien(DAI_MUOI)
  const iv = nganNhien(DAI_IV)
  const khoa = await danXuatKhoa(matKhau, muoi, SO_VONG_PBKDF2)
  const maHoa = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as unknown as BufferSource }, khoa, new TextEncoder().encode(maBiMat))
  return { muoi: b64(muoi), soVong: SO_VONG_PBKDF2, iv: b64(iv), maHoa: b64(maHoa), soLanSai: 0, mocMoLai: 0, hoiLai }
}

/** Giải mã. Sai mật khẩu → `null`.
 *
 * KHÔNG phân biệt "sai mật khẩu" với "dữ liệu hỏng": phân biệt được là cho kẻ
 * dò biết nó đang đi đúng hướng. Cũng không ném lỗi ra ngoài — thông điệp lỗi
 * của Web Crypto là thứ không nên hiện lên màn hình. */
export async function moKhoa(matKhau: string, banGhi: BanGhiKhoa): Promise<string | null> {
  try {
    const khoa = await danXuatKhoa(matKhau, tuB64(banGhi.muoi), banGhi.soVong || SO_VONG_PBKDF2)
    const ra = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: tuB64(banGhi.iv) as unknown as BufferSource },
      khoa,
      tuB64(banGhi.maHoa) as unknown as BufferSource,
    )
    return new TextDecoder().decode(ra)
  } catch {
    return null
  }
}

/** Giải bằng mật khẩu cũ rồi mã hoá lại bằng mật khẩu mới. Mật khẩu cũ sai →
 * `null`, bản ghi giữ nguyên. */
export async function doiMatKhau(cu: string, moi: string, banGhi: BanGhiKhoa): Promise<BanGhiKhoa | null> {
  const maBiMat = await moKhoa(cu, banGhi)
  if (maBiMat === null) return null
  return datMatKhau(moi, maBiMat, banGhi.hoiLai)
}

// ---------------------------------------------------------------------------
// CHỐNG DÒ (mục 2.5)
//
// Kẻ tấn công ở đây là NGƯỜI ĐANG CẦM MÁY THẦY, không phải máy dò tự động. Sai 5
// lần thì chờ 60 giây; mỗi 5 lần sai tiếp theo, thời gian chờ nhân đôi, trần 30
// phút. Số lần sai và mốc chờ ghi vào IndexedDB nên TẢI LẠI TRANG KHÔNG XOÁ ĐƯỢC.

/** Đợt chờ thứ mấy (1, 2, 3…) ứng với số lần sai. */
export function giayChoCua(soLanSai: number): number {
  const dot = Math.floor(soLanSai / SAI_TRUOC_KHI_CHO)
  if (dot <= 0) return 0
  return Math.min(CHO_BAN_DAU_GIAY * Math.pow(2, dot - 1), CHO_TOI_DA_GIAY)
}

/** Còn phải chờ bao nhiêu giây. 0 = thử được ngay. */
export function conChoGiay(banGhi: BanGhiKhoa, nay: number = Date.now()): number {
  const con = (banGhi.mocMoLai || 0) - nay
  return con > 0 ? Math.ceil(con / 1000) : 0
}

/** Sau một lần nhập sai. Đủ ngưỡng thì đặt mốc chờ. */
export function sauKhiSai(banGhi: BanGhiKhoa, nay: number = Date.now()): BanGhiKhoa {
  const soLanSai = (banGhi.soLanSai || 0) + 1
  const giay = soLanSai % SAI_TRUOC_KHI_CHO === 0 ? giayChoCua(soLanSai) : 0
  return { ...banGhi, soLanSai, mocMoLai: giay > 0 ? nay + giay * 1000 : banGhi.mocMoLai || 0 }
}

/** Mở được rồi thì xoá sạch dấu vết dò. */
export function sauKhiDung(banGhi: BanGhiKhoa): BanGhiKhoa {
  return { ...banGhi, soLanSai: 0, mocMoLai: 0 }
}

/** Ẩn app bao lâu thì hỏi lại. Nấc `moi_lan_mo` trả 0 nghĩa là: đóng hẳn app rồi
 * mở lại thì hỏi, còn chuyển sang app khác vài phút rồi quay lại thì KHÔNG. */
export function phaiHoiLai(nac: NacHoiLai, msDaAn: number): boolean {
  const phut = PHUT_CUA_NAC[nac] ?? 0
  if (phut <= 0) return false
  return msDaAn >= phut * 60000
}
