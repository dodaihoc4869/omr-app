// MÁY SOẠN LỜI GIẢI KIỂU SƠ ĐỒ THEO LÔ — TỆP TẠM của làn C (26/10) để Worker build được. Làn D thay CẢ tệp này bằng máy soạn thật.
// Route: `POST /quan-tri/soan-so-do-lo` (server/src/index.ts, sau cổng mã bí mật của thầy). Bản soạn lưu vào `loi_giai_so_do` sau cổng kiểm `kiemCong`
// (server/src/so-do-cong.ts); chỉ `cong = 'dat'` mới được trả cho em (server/src/loi-giai-so-do.ts).
import type { Env } from './kieu'

export async function soanSoDoLo(_env: Env, _thamSo: unknown): Promise<Response> {
  return new Response(JSON.stringify({ ok: false, error: 'Máy soạn sơ đồ theo lô chưa có (làn D đang làm).' }), {
    status: 501,
    headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' },
  })
}
