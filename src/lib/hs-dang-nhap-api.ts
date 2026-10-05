// ĐĂNG NHẬP + ĐẶT MẬT KHẨU LẦN ĐẦU của cổng học sinh — tách khỏi exam-api.ts (05/10, tối ưu mở app học sinh): màn đăng nhập là màn
// ĐẦU TIÊN em thấy và chỉ cần hai lệnh này; để nó nhập exam-api là bắt máy em tải cả bộ gọi máy chủ của app thầy (≈ 16 KB gzip + bộ
// chấm) trước khi hiện ô SBD. exam-api.ts XUẤT LẠI hai hàm ⇒ mọi chỗ gọi cũ (và phép kiểm giả lập exam-api) giữ nguyên. Nội dung như cũ.
import { layDiaChiMayChu } from './dia-chi-may-chu'
import { HAN_GIAY, fetchCoHan } from './fetch-co-han'

export interface KetQuaDangNhapHs {
  token?: string
  ok: boolean
  chuaCoMatKhau?: boolean
  sbd?: string
  hoTen?: string
  lop?: string
  namSinh?: string
  error?: string
  /** CHỈ khi xin `kemSanh` (hsDangNhapKemSanhApi) và máy chủ trả MỘT khối JSON có sẵn Sảnh: phản hồi `hoa2-sanh` của em. Chưa kiểm hình — `hoi-som.ts` kiểm trước khi dùng. */
  sanh?: unknown
  /** CHỈ khi xin `kemSanh` và máy chủ trả THEO LUỒNG (D1 06/10): lời hứa của phản hồi `hoa2-sanh` (dòng 2 của luồng). KHÔNG BAO GIỜ bị từ chối; `null` = không có / hỏng /
   *  quá hạn ⇒ Sảnh tự hỏi như cũ. Đăng nhập đã trả đủ từ dòng 1 — không chờ Sảnh. */
  sanhHua?: Promise<unknown>
}

/** Dòng 2 của luồng chờ tối đa chừng này (máy chủ tự đóng sau 20 s; đây là lưới an toàn phía máy em). */
const HAN_DONG_SANH_MS = 25_000

/** Máy này đọc được thân phản hồi theo luồng (fetch + ReadableStream)? Không ⇒ KHÔNG xin kèm Sảnh (khỏi phải chờ cả thân mới đăng nhập được). */
function coTheDocLuong(): boolean {
  try {
    return typeof ReadableStream !== 'undefined' && typeof TextDecoder !== 'undefined' && typeof Response !== 'undefined' && 'body' in Response.prototype
  } catch {
    return false
  }
}

/**
 * Đọc phản hồi đăng nhập THEO LUỒNG (NDJSON, server/src/dang-nhap-kem-sanh.ts): dòng 1 = kết quả đăng nhập (trả NGAY), dòng 2 = `{sanh}` (chờ nền, lời hứa `sanhHua`).
 * Dòng 1 hỏng / luồng rỗng ⇒ ném lỗi (nơi gọi báo lỗi mạng như cũ). Dòng 2 hỏng / thiếu / quá hạn ⇒ `sanhHua` thành `null`.
 */
async function docLuongDangNhap(res: Response): Promise<KetQuaDangNhapHs> {
  const doc = res.body!.getReader()
  const giaiMa = new TextDecoder()
  let dem = ''
  let het = false
  /** Một dòng đầy đủ kế tiếp; `null` khi hết luồng mà không còn chữ nào. */
  const docDong = async (): Promise<string | null> => {
    for (;;) {
      const i = dem.indexOf('\n')
      if (i >= 0) {
        const d = dem.slice(0, i)
        dem = dem.slice(i + 1)
        return d
      }
      if (het) {
        const d = dem
        dem = ''
        return d.trim() ? d : null
      }
      const { value, done } = await doc.read()
      if (value) dem += giaiMa.decode(value, { stream: true })
      if (done) het = true
    }
  }
  const dong1 = await docDong()
  if (dong1 === null) throw new Error('Máy chủ trả lời rỗng. Em thử lại sau ít phút.')
  const ketQua = JSON.parse(dong1) as KetQuaDangNhapHs
  ketQua.sanhHua = (async (): Promise<unknown> => {
    let hen: ReturnType<typeof setTimeout> | undefined
    try {
      const d2 = await Promise.race([docDong(), new Promise<null>((xong) => { hen = setTimeout(() => xong(null), HAN_DONG_SANH_MS) })])
      if (!d2) return null
      const o = JSON.parse(d2) as { sanh?: unknown } | null
      return o && typeof o === 'object' ? (o.sanh ?? null) : null
    } catch {
      return null
    } finally {
      if (hen !== undefined) clearTimeout(hen)
      try { void doc.cancel().catch(() => {}) } catch { /* đã đóng */ }
    }
  })()
  return ketQua
}

async function dangNhapGoi(scriptUrl: string, sbd: string, matKhau: string | undefined, kemSanhXin: boolean): Promise<KetQuaDangNhapHs> {
  const kemSanh = kemSanhXin && coTheDocLuong()
  // MỘT NGUỒN ĐỊA CHỈ. Chỗ gọi truyền rỗng cũng phải chạy: xem `dia-chi-may-chu.ts`.
  const base = await layDiaChiMayChu(scriptUrl)
  if (!base) return { ok: false, error: 'Chưa lấy được địa chỉ máy chủ. Em tải lại trang rồi thử lại.' } as any
  try {
    const res = await fetchCoHan(`${base}/hs/dang-nhap`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sbd: sbd.trim(), matKhau: (matKhau ?? '').trim(), ...(kemSanh ? { kemSanh: true } : {}) }),
    }, HAN_GIAY)
    // Máy chủ mới trả THEO LUỒNG khi đăng nhập thành công + xin kèm Sảnh (kiểu NDJSON); mọi trường hợp khác (sai mật khẩu, máy chủ cũ) vẫn là MỘT khối JSON như cũ.
    if (kemSanh && /ndjson/i.test(res.headers.get('content-type') ?? '') && res.body) return await docLuongDangNhap(res)
    return (await res.json()) as any
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Không kết nối được máy chủ' }
  }
}

export async function hsDangNhapApi(scriptUrl: string, sbd: string, matKhau?: string): Promise<KetQuaDangNhapHs> {
  return dangNhapGoi(scriptUrl, sbd, matKhau, false)
}

/**
 * Như `hsDangNhapApi` nhưng xin máy chủ đính kèm phản hồi Sảnh vào lệnh đăng nhập (`kemSanh`, server/src/dang-nhap-kem-sanh.ts): vỏ app học sinh
 * (AppHocSinh) dùng — Sảnh có số ngay khi đăng nhập xong, bớt một vòng mạng. Máy chủ cũ bỏ qua khoá thừa ⇒ phản hồi không có `sanh`, đi đường cũ.
 */
export async function hsDangNhapKemSanhApi(scriptUrl: string, sbd: string, matKhau?: string): Promise<KetQuaDangNhapHs> {
  return dangNhapGoi(scriptUrl, sbd, matKhau, true)
}

export async function hsDatMatKhauApi(scriptUrl: string, sbd: string, matKhauMoi: string, matKhauCu?: string): Promise<{
  ok: boolean
  message?: string
  error?: string
}> {
  // MỘT NGUỒN ĐỊA CHỈ. Chỗ gọi truyền rỗng cũng phải chạy: xem `dia-chi-may-chu.ts`.
  const base = await layDiaChiMayChu(scriptUrl)
  if (!base) return { ok: false, error: 'Chưa lấy được địa chỉ máy chủ. Em tải lại trang rồi thử lại.' } as any
  try {
    const res = await fetchCoHan(`${base}/hs/dat-mat-khau`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sbd: sbd.trim(), matKhauMoi: matKhauMoi.trim(), matKhauCu: (matKhauCu ?? '').trim() }),
    }, HAN_GIAY)
    return (await res.json()) as any
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Không kết nối được máy chủ' }
  }
}
