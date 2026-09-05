// MỞ APP BẰNG VÂN TAY / KHUÔN MẶT — MOBANGVANTAY.md, thầy duyệt 05/09.
//
// CÁI BẪY PHẢI TRÁNH (đặc tả mục 0).
//
// Cách hiển nhiên nhất là: hỏi vân tay, đúng thì mở màn. CẤM làm vậy. Mật khẩu
// hiện tại không phải tấm màn che — nó MÃ HOÁ mã bí mật, nên trong máy không
// còn mã bí mật dạng chữ thường. Nếu vân tay chỉ để "xác thực rồi mở màn" thì
// app phải giải mã được mà không cần mật khẩu, tức là khoá giải mã phải nằm sẵn
// đâu đó đọc được — và ta quay về đúng tình trạng trước khi làm mật khẩu, chỉ
// khác là có thêm một tấm màn.
//
// CÁCH ĐÚNG: để CHÍNH VÂN TAY SINH RA KHOÁ.
//
// WebAuthn có phần mở rộng PRF: con chip bảo mật nhận một muối cố định, trả về
// 32 byte bí mật LUÔN GIỐNG NHAU trên máy đó và CHỈ trả về sau khi quét vân tay
// thành công. Chuỗi đó không nằm trong đĩa, không đọc được bằng công cụ nhà
// phát triển, không lấy ra được nếu không có ngón tay của thầy. Lấy nó dẫn xuất
// khoá AES-GCM để mã hoá mã bí mật lần thứ hai.
//
// Kết quả: hai đường vào (mật khẩu · vân tay), CÙNG MỘT MỨC BẢO VỆ. Không đường
// nào là tấm màn.
//
// GIỚI HẠN, nói thẳng (đặc tả mục 11): vân tay ở đây là "ai mở được máy này",
// KHÔNG phải "đúng là thầy". Máy Mac có đăng ký vân tay người khác trong Touch
// ID thì người đó mở được app. Máy dùng chung thì đừng bật.

// ---------------------------------------------------------------------------
// MỘT NGUỒN SỰ THẬT CẤU HÌNH (mục 3). Cấm rải số vào màn hình.

/** Tên hiện trong hộp thoại vân tay của máy. */
export const TEN_RP = 'ĐỖ ĐẠI HỌC'

/** Muối đưa cho PRF. KHÔNG phải bí mật, nhưng phải cố định cho máy đó — đổi
 * muối là đổi khoá, tức là mất bản mã. */
export const DAI_MUOI_PRF = 32

/** Nhãn HKDF. Đổi nhãn là mất khoá, nên đánh phiên bản sẵn để sau này còn đường
 * đổi thuật toán mà không giẫm lên bản cũ. */
export const THONG_TIN_HKDF = 'ddh-khoa-app-v1'

/** Bắt buộc quét vân tay. `preferred` cho qua bằng mỗi việc CÓ máy — vô nghĩa. */
export const XAC_THUC_NGUOI_DUNG: UserVerificationRequirement = 'required'

/** Chỉ chip trong máy, không nhận khoá USB rời. */
export const GAN_NEN_TANG: AuthenticatorAttachment = 'platform'

/** Quá thì coi như thầy bỏ, quay về ô mật khẩu. */
export const MS_CHO_VAN_TAY = 60000

/** Chuẩn của AES-GCM, giống `khoa-app.ts`. */
export const DAI_IV_GCM = 12

/** Thuật toán chữ ký cho passkey: ES256 rồi RS256 (mọi nền tảng nhận một trong
 * hai). Chữ ký không dùng vào việc gì ở đây — khoá nằm ở PRF — nhưng WebAuthn
 * bắt buộc khai báo. */
export const THUAT_TOAN_KHOA = [-7, -257]

// ---------------------------------------------------------------------------
// BẢN GHI CẤT TRONG INDEXEDDB (mục 2.1)
//
// Nằm CẠNH `khoaApp`, không thay thế nó. KHÔNG có trường nào chứa mã bí mật,
// mật khẩu, hay kết quả PRF — phép kiểm số 1 quét thẳng chuỗi JSON này.

export interface BanGhiVanTay {
  /** base64 — id của passkey, để lần mở sau gọi đúng nó. */
  credentialId: string
  /** base64 — muối đưa cho PRF. Cố định cho máy này. */
  muoiPrf: string
  /** base64 */
  iv: string
  /** base64 — mã bí mật mã hoá bằng khoá dẫn xuất từ PRF. */
  maHoa: string
  taoLuc: string
  tenMay: string
}

/** Vì sao máy này không dùng được vân tay. Chuỗi rỗng = dùng được. */
export type LyDoKhongDung = '' | 'khong_co_webauthn' | 'khong_co_sinh_trac' | 'khong_co_prf'

export const CAU_LY_DO: Record<Exclude<LyDoKhongDung, ''>, string> = {
  khong_co_webauthn: 'Trình duyệt này không có WebAuthn. Mở app bằng mật khẩu.',
  khong_co_sinh_trac: 'Máy này không có Touch ID / Face ID. Mở app bằng mật khẩu.',
  khong_co_prf: 'Trình duyệt này chưa hỗ trợ PRF — Firefox trên Android và Windows cũ nằm trong nhóm đó. Mở app bằng mật khẩu.',
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

/** `rpId` lấy từ chính tên miền đang chạy — trên bản live là
 * `dodaihoc4869.github.io`. `github.io` nằm trong Public Suffix List nên mỗi
 * subdomain là một site riêng: passkey của app này không dùng được cho trang
 * github.io nào khác. Lấy động thay vì gõ cứng để bản chạy thử trên máy thầy
 * (localhost) không phải sửa dòng nào. */
export function rpIdCua(hostname: string = typeof location === 'undefined' ? '' : location.hostname): string {
  return hostname
}

/** Nhãn máy để thầy nhìn ra bản ghi này của máy nào. Không phải định danh —
 * chỉ để hiện một dòng trong Cài đặt. */
export function tenMayCua(ua: string = typeof navigator === 'undefined' ? '' : navigator.userAgent): string {
  if (/iPhone/i.test(ua)) return 'iPhone'
  if (/iPad/i.test(ua)) return 'iPad'
  if (/Macintosh|Mac OS X/i.test(ua)) return 'Mac'
  if (/Android/i.test(ua)) return 'Android'
  if (/Windows/i.test(ua)) return 'Windows'
  return 'Máy này'
}

/** iPhone/iPad dùng khuôn mặt, Mac dùng vân tay. Đổi chữ theo máy để câu hướng
 * dẫn khớp việc thầy thật sự làm. */
export function laKhuonMat(ua: string = typeof navigator === 'undefined' ? '' : navigator.userAgent): boolean {
  return /iPhone|iPad/i.test(ua)
}

// ---------------------------------------------------------------------------
// PHIÊN NÀY VÀO BẰNG GÌ (mục 4E)
//
// Vào bằng vân tay là đã chứng minh danh tính, nên đặt lại mật khẩu KHÔNG cần
// mật khẩu cũ. Đây là tiện ích thật: mật khẩu dài mà ít gõ thì hay quên.
//
// Cờ này sống trong BỘ NHỚ, mất khi đóng app — giống mã bí mật. Ghi xuống đĩa
// là mở đúng cái cửa sau mà mục 9 cấm.
let moBangVanTayPhien = false

export function datMoBangVanTay(v: boolean): void {
  moBangVanTayPhien = v
}

export function daMoBangVanTay(): boolean {
  return moBangVanTayPhien
}

// ---------------------------------------------------------------------------
// DẪN XUẤT KHOÁ TỪ PRF
//
// HKDF-SHA256, muối = muoiPrf, nhãn = THONG_TIN_HKDF. Không dùng thẳng 32 byte
// PRF làm khoá AES: PRF là đầu ra của một hàm khác, HKDF là bước chuẩn để biến
// nó thành khoá của đúng thuật toán này và buộc chặt vào nhãn phiên bản.

async function khoaTuPrf(prf: ArrayBuffer, muoi: Uint8Array): Promise<CryptoKey> {
  const goc = await crypto.subtle.importKey('raw', prf, 'HKDF', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: muoi as unknown as BufferSource,
      info: new TextEncoder().encode(THONG_TIN_HKDF) as unknown as BufferSource,
    },
    goc,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

// ---------------------------------------------------------------------------
// BA VIỆC (mục 2.2)

/** Máy này có xác thực sinh trắc trên nền tảng không.
 *
 * KHÔNG kiểm được PRF ở đây — trình duyệt chỉ nói có hỗ trợ hay không SAU khi
 * tạo passkey. Nên hàm này chỉ loại được hai trường hợp chắc chắn; trường hợp
 * "có sinh trắc mà không có PRF" bị chặn ở `batVanTay` nhịp hai. */
export async function coTheDungVanTay(): Promise<LyDoKhongDung> {
  if (typeof window === 'undefined') return 'khong_co_webauthn'
  const pkc = (window as unknown as { PublicKeyCredential?: typeof PublicKeyCredential }).PublicKeyCredential
  if (!navigator.credentials || !pkc) return 'khong_co_webauthn'
  try {
    const co = await pkc.isUserVerifyingPlatformAuthenticatorAvailable()
    return co ? '' : 'khong_co_sinh_trac'
  } catch {
    return 'khong_co_sinh_trac'
  }
}

interface KetQuaPrf {
  prf?: { enabled?: boolean; results?: { first?: ArrayBuffer } }
}

function docPrf(c: Credential | null): { enabled: boolean; first: ArrayBuffer | null } {
  const kq = (c as PublicKeyCredential | null)?.getClientExtensionResults?.() as KetQuaPrf | undefined
  const first = kq?.prf?.results?.first
  return { enabled: kq?.prf?.enabled === true, first: first instanceof ArrayBuffer ? first : null }
}

/** BẬT VÂN TAY — tạo passkey, lấy PRF, mã hoá mã bí mật, trả bản ghi để cất.
 *
 * BA NHỊP, nhịp hai là chỗ hay bị bỏ sót (mục 2.2):
 *
 *   1. `create` với `prf: {}` — xin một passkey có PRF.
 *   2. Kiểm `prf.enabled`. KHÔNG bật thì DỪNG NGAY, không cất gì. Đây là điều
 *      cấm số 3: bật vân tay khi PRF không có nghĩa là phải giấu khoá ở đâu đó
 *      đọc được, tức là rơi đúng vào cái bẫy mục 0.
 *   3. `get` với `prf.eval.first` — nhiều nền tảng CHỈ trả chuỗi bí mật ở bước
 *      xác thực chứ không ở bước tạo, nên phải gọi thêm lần này mới có khoá.
 *
 * Ném lỗi khi không bật được. Người gọi bắt lỗi và hiện câu lý do. */
export async function batVanTay(maBiMat: string): Promise<BanGhiVanTay> {
  if (!maBiMat) throw new Error('Chưa có mã bí mật để mã hoá')
  const lyDo = await coTheDungVanTay()
  if (lyDo) throw new Error(CAU_LY_DO[lyDo])

  const muoiPrf = nganNhien(DAI_MUOI_PRF)

  // NHỊP 1
  const tao = (await navigator.credentials.create({
    publicKey: {
      challenge: nganNhien(32) as unknown as BufferSource,
      rp: { id: rpIdCua(), name: TEN_RP },
      // `user.id` ngẫu nhiên, `name` trung tính: hộp thoại của máy hiện ra
      // TRƯỚC khi vào app, người lạ cầm máy cũng nhìn thấy — không để tên thầy
      // ở đó (cùng lý do màn khoá không hiện tên).
      user: { id: nganNhien(32) as unknown as BufferSource, name: 'app', displayName: 'App quản lý' },
      pubKeyCredParams: THUAT_TOAN_KHOA.map((alg) => ({ type: 'public-key' as const, alg })),
      authenticatorSelection: {
        authenticatorAttachment: GAN_NEN_TANG,
        userVerification: XAC_THUC_NGUOI_DUNG,
        residentKey: 'required',
      },
      timeout: MS_CHO_VAN_TAY,
      extensions: { prf: {} } as AuthenticationExtensionsClientInputs,
    },
  })) as PublicKeyCredential | null
  if (!tao) throw new Error('Không tạo được khoá vân tay')

  // NHỊP 2 — cấm đi tiếp khi PRF không bật.
  if (!docPrf(tao).enabled) throw new Error(CAU_LY_DO.khong_co_prf)

  const credentialId = b64(tao.rawId)

  // NHỊP 3
  const prf = await layPrf(credentialId, muoiPrf)
  if (!prf) throw new Error(CAU_LY_DO.khong_co_prf)

  const iv = nganNhien(DAI_IV_GCM)
  const khoa = await khoaTuPrf(prf, muoiPrf)
  const maHoa = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    khoa,
    new TextEncoder().encode(maBiMat),
  )
  return {
    credentialId,
    muoiPrf: b64(muoiPrf),
    iv: b64(iv),
    maHoa: b64(maHoa),
    taoLuc: new Date().toISOString(),
    tenMay: tenMayCua(),
  }
}

/** Quét vân tay rồi lấy 32 byte PRF. `null` = thầy huỷ, máy từ chối, hoặc nền
 * tảng không trả PRF. */
async function layPrf(credentialId: string, muoiPrf: Uint8Array): Promise<ArrayBuffer | null> {
  const lay = await navigator.credentials.get({
    publicKey: {
      challenge: nganNhien(32) as unknown as BufferSource,
      rpId: rpIdCua(),
      allowCredentials: [{ id: tuB64(credentialId) as unknown as BufferSource, type: 'public-key' }],
      userVerification: XAC_THUC_NGUOI_DUNG,
      timeout: MS_CHO_VAN_TAY,
      extensions: { prf: { eval: { first: muoiPrf } } } as unknown as AuthenticationExtensionsClientInputs,
    },
  })
  return docPrf(lay).first
}

/** MỞ BẰNG VÂN TAY — quét → PRF → giải mã.
 *
 * Hỏng, thầy huỷ, hay vân tay của máy khác đều trả `null`. KHÔNG ném lỗi và
 * KHÔNG phân biệt các trường hợp đó: phân biệt được là cho người dò biết nó
 * đang đi đúng hướng — cùng lý do với `moKhoa` của mật khẩu. */
export async function moBangVanTay(banGhi: BanGhiVanTay): Promise<string | null> {
  try {
    const muoi = tuB64(banGhi.muoiPrf)
    const prf = await layPrf(banGhi.credentialId, muoi)
    if (!prf) return null
    const khoa = await khoaTuPrf(prf, muoi)
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

/** MÃ HOÁ LẠI khi MÃ BÍ MẬT đổi (mục 4C, điều cấm số 5).
 *
 * Dùng lại đúng passkey và đúng muối cũ, nên thầy không phải đăng ký vân tay
 * lại — chỉ chạm một cái để chip trả PRF. Trả `null` khi thầy huỷ; người gọi
 * PHẢI xoá bản ghi vân tay trong trường hợp đó, vì để lại là để một đường vào
 * trỏ tới mã bí mật cũ đã hết dùng.
 *
 * ĐỔI MẬT KHẨU KHÔNG cần gọi hàm này: bản ghi vân tay mã hoá MÃ BÍ MẬT, mà đổi
 * mật khẩu không đổi mã bí mật. */
export async function maHoaLaiVanTay(banGhi: BanGhiVanTay, maBiMatMoi: string): Promise<BanGhiVanTay | null> {
  if (!maBiMatMoi) return null
  try {
    const muoi = tuB64(banGhi.muoiPrf)
    const prf = await layPrf(banGhi.credentialId, muoi)
    if (!prf) return null
    const khoa = await khoaTuPrf(prf, muoi)
    const iv = nganNhien(DAI_IV_GCM)
    const maHoa = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      khoa,
      new TextEncoder().encode(maBiMatMoi),
    )
    return { ...banGhi, iv: b64(iv), maHoa: b64(maHoa) }
  } catch {
    return null
  }
}
