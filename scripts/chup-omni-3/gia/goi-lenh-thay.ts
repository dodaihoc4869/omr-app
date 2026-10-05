// THAY `goiLenh` của app thầy trong BẢN BUILD CHỤP ẢNH (plugin trong ../vite.config.mjs chuyển hướng import) — mọi lệnh trả từ may-thay.ts.
export * from '../../../src/lib/goi-lenh-thay'
import { traLoiThay } from './may-thay'
export async function goiLenh(duong: string, body: unknown, _chuKhongCoLenh?: string, _chuCham?: string) {
  void _chuKhongCoLenh
  void _chuCham
  return traLoiThay(duong, (body ?? {}) as Record<string, unknown>)
}
