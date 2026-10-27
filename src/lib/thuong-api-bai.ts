// Đọc phản hồi CHẶNG của lệnh `answer` (`thuong` mỗi câu, `ketBai` câu cuối) — tách khỏi thuong-api.ts (27/10, luật tốc độ): chỉ màn làm chặng / Kim cương
// (nạp lười) cần, nên không nằm trong khối thanh trên nạp sẵn ở Lộ trình.
import { chu, dt, mang, so, soNg, type KetBai, type ThuongCau } from './thuong-api'

export function docThuongCau(x: unknown): ThuongCau | null {
  const o = dt(x)
  if (!o || typeof o.tinh !== 'boolean') return null
  if (!o.tinh) return { tinh: false, nguyenTu: 0, dong: [], chuoiDung: 0, cauKho: false }
  const nt = soNg(o.nguyenTu)
  if (nt === undefined) return null
  const dong = mang(o.dong, (v) => { const d = dt(v); const n = chu(d?.nhan), s = so(d?.so); return n && s !== undefined ? { nhan: n, so: Math.round(s) } : undefined }) ?? []
  return { tinh: true, nguyenTu: nt, dong, chuoiDung: soNg(o.chuoiDung) ?? 0, cauKho: o.cauKho === true }
}
export function docKetBai(x: unknown): KetBai | null {
  const o = dt(x)
  const tong = soNg(o?.tong), sd = soNg(o?.soDung), sc = soNg(o?.soCau), cx = so(o?.chinhXac), gi = soNg(o?.giay)
  if (!o || tong === undefined || sd === undefined || !sc || cx === undefined || gi === undefined) return null
  const dong = mang(o.dong, (v) => { const d = dt(v); const n = chu(d?.nhan), s = so(d?.so); return n && s !== undefined ? { nhan: n, so: Math.round(s) } : undefined }) ?? []
  // chinhXac: tỉ lệ 0–1 hoặc phần trăm
  const kq: KetBai = { tong, dong, soDung: sd, soCau: sc, chinhXac: Math.max(0, Math.min(100, Math.round(cx <= 1 ? cx * 100 : cx))), giay: gi, hoanHao: o.hoanHao === true }
  const mt = dt(o.mucTieu), dx = soNg(mt?.daXong), can = soNg(mt?.can); if (dx !== undefined && can) kq.mucTieu = { daXong: dx, can }
  const g = dt(o.giai), th = soNg(g?.thuHang), doi = so(g?.doi); if (th && doi !== undefined) kq.giai = { thuHang: th, doi: Math.round(doi) }
  return kq
}
