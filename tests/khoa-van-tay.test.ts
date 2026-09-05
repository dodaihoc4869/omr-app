// @vitest-environment node
//
// ĐỊNH NGHĨA HOÀN THÀNH của MOBANGVANTAY.md mục 8, chín phép kiểm tự động.
//
// Chạy ở môi trường `node`: jsdom không có `crypto.subtle`, mà cả tính năng này
// dựng trên Web Crypto — giống `khoa-app.test.ts`.
//
// WEBAUTHN PHẢI GIẢ LẬP (mục 8 nói thẳng): không có con chip bảo mật nào trong
// máy chạy CI. Nhưng phần DẪN XUẤT KHOÁ và CẤT GIỮ thì kiểm THẬT — HKDF và
// AES-GCM chạy đúng bộ Web Crypto mà trình duyệt sẽ chạy. Chỗ giả lập chỉ là
// "con chip trả về 32 byte này", đúng phần không kiểm được bằng máy.
//
// Phép kiểm số 1 là quan trọng nhất: bản ghi cất đi không được chứa mã bí mật,
// mật khẩu, hay kết quả PRF ở bất kỳ trường nào.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const GOC = resolve(__dirname, '..')
const doc = (p: string) => readFileSync(resolve(GOC, p), 'utf8')

// ---------------------------------------------------------------------------
// GIẢ LẬP CON CHIP BẢO MẬT
//
// Chip thật: nhận một muối, trả 32 byte LUÔN GIỐNG NHAU trên máy đó, chỉ trả
// sau khi quét vân tay thành công. Bản giả lập giữ đúng ba tính chất đó — hạt
// giống cố định cho mỗi "máy", đầu ra phụ thuộc muối, và một cờ `chapNhan` thay
// cho ngón tay.

interface May {
  hatGiong: number
  /** false = thầy huỷ hộp thoại, hoặc quét hỏng. */
  chapNhan: boolean
  /** false = nền tảng không có PRF (Firefox Android, Windows cũ). */
  coPrf: boolean
  /** false = máy không có Touch ID / Face ID. */
  coSinhTrac: boolean
}

let may: May
let soLanGoiTao = 0

/** PRF giả: trộn hạt giống của máy với muối. Cùng máy + cùng muối ⇒ cùng đầu
 * ra, đúng như chip thật; máy khác ⇒ khác hẳn. */
function prfGia(hatGiong: number, muoi: Uint8Array): ArrayBuffer {
  const ra = new Uint8Array(32)
  let x = hatGiong >>> 0
  for (let i = 0; i < 32; i++) {
    x = (x * 1664525 + 1013904223 + (muoi[i % muoi.length] ?? 0)) >>> 0
    ra[i] = x & 0xff
  }
  return ra.buffer
}

function dungMay(sua: Partial<May> = {}) {
  may = { hatGiong: 12345, chapNhan: true, coPrf: true, coSinhTrac: true, ...sua }
  soLanGoiTao = 0

  const ID_KHOA = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])

  const g = globalThis as unknown as {
    window?: unknown
    navigator: { credentials?: unknown; userAgent?: string }
    PublicKeyCredential?: unknown
    btoa?: (s: string) => string
    atob?: (s: string) => string
    location?: { hostname: string }
  }

  g.window = g
  g.location = { hostname: 'dodaihoc4869.github.io' }
  g.PublicKeyCredential = {
    isUserVerifyingPlatformAuthenticatorAvailable: async () => may.coSinhTrac,
  }
  Object.defineProperty(g.navigator, 'credentials', {
    configurable: true,
    value: {
      create: async () => {
        soLanGoiTao++
        if (!may.chapNhan) return null
        return {
          rawId: ID_KHOA.buffer,
          // Nhịp 2 của mục 2.2: nhiều nền tảng chỉ báo `enabled` ở bước tạo,
          // chưa trả chuỗi bí mật — bản giả lập làm đúng như vậy.
          getClientExtensionResults: () => ({ prf: { enabled: may.coPrf } }),
        }
      },
      get: async (opt: { publicKey?: { extensions?: { prf?: { eval?: { first?: Uint8Array } } } } }) => {
        if (!may.chapNhan) return null
        const muoi = opt?.publicKey?.extensions?.prf?.eval?.first
        if (!muoi || !may.coPrf) return { getClientExtensionResults: () => ({ prf: {} }) }
        return {
          rawId: ID_KHOA.buffer,
          getClientExtensionResults: () => ({ prf: { results: { first: prfGia(may.hatGiong, muoi) } } }),
        }
      },
    },
  })
}

beforeEach(() => dungMay())
afterEach(() => vi.restoreAllMocks())

const MA_BI_MAT = 'ma-bi-mat-that-cua-thay-2026'

async function nap() {
  return import('../src/lib/khoa-van-tay')
}

// ---------------------------------------------------------------------------

describe('MOBANGVANTAY.md mục 8 — định nghĩa hoàn thành', () => {
  it('1. bản ghi KHÔNG chứa mã bí mật, mật khẩu, hay kết quả PRF (phép kiểm quan trọng nhất)', async () => {
    const { batVanTay } = await nap()
    const b = await batVanTay(MA_BI_MAT)
    const chuoi = JSON.stringify(b)

    expect(chuoi).not.toContain(MA_BI_MAT)
    expect(chuoi).not.toContain('ma-bi-mat')
    // Kết quả PRF dạng base64 cũng không được có mặt ở bất kỳ trường nào.
    const prf = Buffer.from(new Uint8Array(prfGia(may.hatGiong, Buffer.from(b.muoiPrf, 'base64')))).toString('base64')
    expect(chuoi).not.toContain(prf)
    // Đúng sáu trường của mục 2.1, không thừa trường nào.
    expect(Object.keys(b).sort()).toEqual(['credentialId', 'iv', 'maHoa', 'muoiPrf', 'taoLuc', 'tenMay'])
  })

  it('2. cùng PRF + muối → ra ĐÚNG mã bí mật ban đầu', async () => {
    const { batVanTay, moBangVanTay } = await nap()
    const b = await batVanTay(MA_BI_MAT)
    expect(await moBangVanTay(b)).toBe(MA_BI_MAT)
    // Mở lại lần nữa vẫn ra đúng — chip trả cùng một chuỗi mỗi lần.
    expect(await moBangVanTay(b)).toBe(MA_BI_MAT)
  })

  it('3. PRF khác (vân tay máy khác) → trả null, KHÔNG ném lỗi', async () => {
    const { batVanTay, moBangVanTay } = await nap()
    const b = await batVanTay(MA_BI_MAT)
    may.hatGiong = 99999 // máy khác
    const ra = await moBangVanTay(b)
    expect(ra).toBeNull()
  })

  it('3b. muối bị đổi → giải mã thất bại, trả null', async () => {
    const { batVanTay, moBangVanTay } = await nap()
    const b = await batVanTay(MA_BI_MAT)
    const muoiKhac = Buffer.from(new Uint8Array(32).fill(7)).toString('base64')
    expect(await moBangVanTay({ ...b, muoiPrf: muoiKhac })).toBeNull()
  })

  it('4. prf.enabled false → batVanTay TỪ CHỐI, không trả bản ghi nào', async () => {
    const { batVanTay, CAU_LY_DO } = await nap()
    dungMay({ coPrf: false })
    await expect(batVanTay(MA_BI_MAT)).rejects.toThrow(CAU_LY_DO.khong_co_prf)
    // Đã gọi create một lần rồi dừng ở nhịp hai — không đi tiếp sang nhịp ba.
    expect(soLanGoiTao).toBe(1)
  })

  it('4b. máy không có sinh trắc → từ chối TRƯỚC khi gọi create', async () => {
    const { batVanTay, coTheDungVanTay, CAU_LY_DO } = await nap()
    dungMay({ coSinhTrac: false })
    expect(await coTheDungVanTay()).toBe('khong_co_sinh_trac')
    await expect(batVanTay(MA_BI_MAT)).rejects.toThrow(CAU_LY_DO.khong_co_sinh_trac)
    expect(soLanGoiTao).toBe(0)
  })

  it('5. ĐỔI MÃ BÍ MẬT → mã hoá lại; mở bằng vân tay ra mã MỚI, mã cũ mất hẳn', async () => {
    const { batVanTay, maHoaLaiVanTay, moBangVanTay } = await nap()
    const b = await batVanTay(MA_BI_MAT)
    const MOI = 'ma-bi-mat-moi-sau-khi-doi'
    const b2 = await maHoaLaiVanTay(b, MOI)
    expect(b2).not.toBeNull()
    expect(await moBangVanTay(b2!)).toBe(MOI)
    // Dùng lại đúng passkey và đúng muối — thầy không phải đăng ký vân tay lại.
    expect(b2!.credentialId).toBe(b.credentialId)
    expect(b2!.muoiPrf).toBe(b.muoiPrf)
    // Bản mã thật sự đổi, không phải giữ nguyên khối cũ.
    expect(b2!.maHoa).not.toBe(b.maHoa)
    expect(JSON.stringify(b2)).not.toContain(MOI)
  })

  it('5b. thầy huỷ lúc mã hoá lại → trả null để người gọi XOÁ bản ghi, không giữ bản trỏ mã cũ', async () => {
    const { batVanTay, maHoaLaiVanTay } = await nap()
    const b = await batVanTay(MA_BI_MAT)
    may.chapNhan = false
    expect(await maHoaLaiVanTay(b, 'ma-moi')).toBeNull()
  })

  it('6. GỠ vân tay → khoaVanTay biến mất, khoaApp CÒN NGUYÊN', async () => {
    const db = doc('src/lib/exam-db.ts')
    const go = db.slice(db.indexOf('export async function goKhoaVanTay'))
    const than = go.slice(0, go.indexOf('\n}') + 2)
    expect(than).toContain("delete(STORE_SETTINGS, 'khoaVanTay')")
    expect(than).not.toContain("'khoaApp'")
    expect(than).not.toContain('teacherSecret')
  })

  it('7. bật vân tay khi chưa có mã bí mật → TỪ CHỐI', async () => {
    const { batVanTay } = await nap()
    await expect(batVanTay('')).rejects.toThrow('Chưa có mã bí mật')
    expect(soLanGoiTao).toBe(0)
  })

  it('8. vai KHÔNG phải giáo viên thì không bao giờ gọi WebAuthn — kiểm đủ năm đường', async () => {
    const { laManThayQuanLy } = await import('../src/lib/vai-tro')
    // Vân tay chỉ được gọi từ KhoaAppScreen và KhoiMatKhauApp, mà App chỉ dựng
    // hai chỗ đó khi `laManThayQuanLy` đúng. Chặn ở đúng một chỗ, kiểm ở đây.
    expect(laManThayQuanLy('?examCode=123456', '/omr-app/')).toBe(false) // vào thi
    expect(laManThayQuanLy('', '/omr-app/t/123456')).toBe(false) // link mời làm bài
    expect(laManThayQuanLy('', '/omr-app/p')).toBe(false) // phiếu phụ huynh
    expect(laManThayQuanLy('', '/omr-app/hs/abcd1234efgh')).toBe(false) // link cũ của em
    expect(laManThayQuanLy('', '/omr-app/')).toBe(true) // app quản lý của thầy

    const app = doc('src/App.tsx')
    const iCanHoi = app.indexOf('laManThayQuanLy')
    const iKhoaMan = app.indexOf('<KhoaAppScreen')
    expect(iCanHoi).toBeGreaterThan(0)
    expect(iCanHoi).toBeLessThan(iKhoaMan)

    // Không file nào ngoài hai chỗ đó được gọi WebAuthn.
    for (const f of ['src/screens/ExamTakeScreen.tsx', 'src/screens/PhieuScreen.tsx', 'src/screens/AppDaChuyenScreen.tsx']) {
      expect(doc(f)).not.toContain('khoa-van-tay')
      expect(doc(f)).not.toContain('navigator.credentials')
    }
  })

  it('9. thầy từ chối vân tay → rơi về ô mật khẩu, KHÔNG khoá app, KHÔNG đếm sai', async () => {
    const { batVanTay, moBangVanTay } = await nap()
    const b = await batVanTay(MA_BI_MAT)
    may.chapNhan = false
    expect(await moBangVanTay(b)).toBeNull()

    // Trong màn khoá, nhánh vân tay hỏng CHỈ đổi trạng thái hiển thị; nó không
    // được đi qua `sauKhiSai` (bộ đếm dò mật khẩu).
    const man = doc('src/screens/KhoaAppScreen.tsx')
    const quet = man.slice(man.indexOf('const quetVanTay'), man.indexOf('const thuLaiVanTay'))
    expect(quet).toContain("setVanTay('go')")
    expect(quet).not.toContain('sauKhiSai')
    expect(quet).not.toContain('setChoGiay')
  })
})

// ---------------------------------------------------------------------------

describe('Điều cấm mục 9 — kiểm bằng cách đọc chính mã nguồn', () => {
  const lib = doc('src/lib/khoa-van-tay.ts')

  it('cấm dùng WebAuthn chỉ để xác thực rồi mở màn: khoá PHẢI dẫn xuất từ PRF', () => {
    expect(lib).toContain("name: 'HKDF'")
    expect(lib).toContain('prf: { eval: { first: muoiPrf } }')
    // Không có nhánh nào tự sinh khoá rồi cất xuống đĩa.
    expect(lib).not.toMatch(/generateKey\s*\(/)
    expect(lib).not.toContain('exportKey')
  })

  it('cấm lưu kết quả PRF vào bất cứ đâu', () => {
    expect(lib).not.toContain('localStorage')
    expect(lib).not.toContain('sessionStorage')
    expect(lib).not.toContain('indexedDB')
    // Không hàm nào trả thẳng chuỗi PRF ra ngoài module.
    expect(lib).not.toMatch(/export\s+(async\s+)?function\s+layPrf/)
  })

  it('cấm bật vân tay khi prf.enabled không true — nhịp hai đứng TRƯỚC nhịp ba', () => {
    const iKiem = lib.indexOf('if (!docPrf(tao).enabled)')
    const iLay = lib.indexOf('const prf = await layPrf(credentialId, muoiPrf)')
    expect(iKiem).toBeGreaterThan(0)
    expect(iLay).toBeGreaterThan(0)
    expect(iKiem).toBeLessThan(iLay)
  })

  it('cấm bỏ mật khẩu hay ẩn nút Dùng mật khẩu trên màn khoá', () => {
    const man = doc('src/screens/KhoaAppScreen.tsx')
    expect(man).toContain('Dùng mật khẩu')
    // Ô mật khẩu hiện ở MỌI trạng thái vân tay trừ lúc đang quét.
    expect(man).toContain("che === 'mo' && vanTay !== 'dang_quet'")
  })

  it('cấm cửa sau: cờ "vào bằng vân tay" sống trong bộ nhớ, không xuống đĩa', () => {
    const khoi = lib.slice(lib.indexOf('let moBangVanTayPhien'), lib.indexOf('// DẪN XUẤT KHOÁ'))
    expect(khoi).toContain('let moBangVanTayPhien = false')
    expect(khoi).not.toContain('localStorage')
    expect(khoi).not.toContain('await')
  })

  it('gỡ MẬT KHẨU thì xoá luôn bản ghi vân tay — không để một bản mã mồ côi', () => {
    const db = doc('src/lib/exam-db.ts')
    const go = db.slice(db.indexOf('export async function goKhoaApp'))
    const than = go.slice(0, go.indexOf('\n}') + 2)
    expect(than).toContain("delete(STORE_SETTINGS, 'khoaVanTay')")
  })
})

// ---------------------------------------------------------------------------

describe('Một nguồn sự thật cấu hình (mục 3)', () => {
  it('đủ sáu khoá, đúng giá trị đặc tả', async () => {
    const k = await nap()
    expect(k.TEN_RP).toBe('ĐỖ ĐẠI HỌC')
    expect(k.DAI_MUOI_PRF).toBe(32)
    expect(k.THONG_TIN_HKDF).toBe('ddh-khoa-app-v1')
    expect(k.XAC_THUC_NGUOI_DUNG).toBe('required')
    expect(k.GAN_NEN_TANG).toBe('platform')
    expect(k.MS_CHO_VAN_TAY).toBe(60000)
  })

  it('muối PRF đúng 32 byte và khác nhau mỗi lần bật', async () => {
    const { batVanTay, DAI_MUOI_PRF } = await nap()
    const a = await batVanTay(MA_BI_MAT)
    const b = await batVanTay(MA_BI_MAT)
    expect(Buffer.from(a.muoiPrf, 'base64')).toHaveLength(DAI_MUOI_PRF)
    expect(a.muoiPrf).not.toBe(b.muoiPrf)
  })

  it('chữ đổi theo máy: iPhone nhìn màn hình, Mac chạm cảm biến', async () => {
    const { laKhuonMat, tenMayCua } = await nap()
    expect(laKhuonMat('Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X)')).toBe(true)
    expect(laKhuonMat('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')).toBe(false)
    expect(tenMayCua('Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X)')).toBe('iPhone')
    expect(tenMayCua('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')).toBe('Mac')
  })

  it('rpId lấy từ tên miền đang chạy — bản live là dodaihoc4869.github.io', async () => {
    const { rpIdCua } = await nap()
    expect(rpIdCua('dodaihoc4869.github.io')).toBe('dodaihoc4869.github.io')
    expect(rpIdCua('localhost')).toBe('localhost')
  })
})
