// ĐĂNG NHẬP + ĐẶT MẬT KHẨU LẦN ĐẦU của cổng học sinh — tách khỏi exam-api.ts (05/10, tối ưu mở app học sinh): màn đăng nhập là màn
// ĐẦU TIÊN em thấy và chỉ cần hai lệnh này; để nó nhập exam-api là bắt máy em tải cả bộ gọi máy chủ của app thầy (≈ 16 KB gzip + bộ
// chấm) trước khi hiện ô SBD. exam-api.ts XUẤT LẠI hai hàm ⇒ mọi chỗ gọi cũ (và phép kiểm giả lập exam-api) giữ nguyên. Nội dung như cũ.
import { layDiaChiMayChu } from './dia-chi-may-chu'
import { HAN_GIAY, fetchCoHan } from './fetch-co-han'

export async function hsDangNhapApi(scriptUrl: string, sbd: string, matKhau?: string): Promise<{
  token?: string
  ok: boolean
  chuaCoMatKhau?: boolean
  sbd?: string
  hoTen?: string
  lop?: string
  namSinh?: string
  error?: string
}> {
  // MỘT NGUỒN ĐỊA CHỈ. Chỗ gọi truyền rỗng cũng phải chạy: xem `dia-chi-may-chu.ts`.
  const base = await layDiaChiMayChu(scriptUrl)
  if (!base) return { ok: false, error: 'Chưa lấy được địa chỉ máy chủ. Em tải lại trang rồi thử lại.' } as any
  try {
    const res = await fetchCoHan(`${base}/hs/dang-nhap`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sbd: sbd.trim(), matKhau: (matKhau ?? '').trim() }),
    }, HAN_GIAY)
    return (await res.json()) as any
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Không kết nối được máy chủ' }
  }
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
