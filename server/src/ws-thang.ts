// CỬA ĐI THẲNG + LỆNH BÌNH PHẢN ỨNG (tách khỏi index.ts 07/11 để tệp chính không phình — cổng kiem-co-tep).
// WebSocket phải đi THẲNG, trước mọi lớp bọc của index.ts (lớp bọc dựng lại Response ⇒ mất kết nối 101). Nội dung các nhánh giữ nguyên như trước khi tách.
import type { Env, ExecutionContext } from './kieu'
import { vaoPhongDau } from './dau-ion-ve'
import { DAU_TRONG_NGAN, vaoKenh } from './ngan-hoc-sinh'
import { DUONG_KENH } from './kenh-day'
import { gvBuoiHoc, hsDiemDanh } from './buoi-hoc'
import { gameIdentity } from './game-v2-auth'
import { DUONG_LIVE, cuaLive } from './live-sfu'
import { cuaXemLai } from './live-xem-lai-lenh'
import { DUONG_PHONG_BPU, baoPhongVaoLop, dongPhongBpu, gvBpuLuot, gvBpuMo, hsBpuCuaEm, hsBpuVe, vaoPhongBpu } from './phong-binh-phan-ung'

type Row = Record<string, unknown>

export function wsThang(req: Request, env: Env, ctx?: ExecutionContext): Promise<Response> | null {
  const u = req.url
  // XEM LẠI LIVE (11/11, live-xem-lai-lenh.ts): tải khúc tiếng, tệp buổi live có `Range`, lệnh `/hs/live-*` `/gv/live-*` — đi thẳng để index.ts không to thêm.
  const xl = cuaXemLai(req, env, ctx)
  if (xl) return xl
  // LIVE BẢNG (10/11, live-sfu.ts): cửa `/bpu/live/*` làm trung gian tới Cloudflare Realtime SFU — kiểm vé `bpu|`, 0 lệnh D1; đi thẳng để index.ts không to thêm.
  if (req.method === 'POST') return u.includes(DUONG_LIVE) && new URL(u).pathname.startsWith(DUONG_LIVE) ? cuaLive(req, env) : null
  if (req.method !== 'GET') return null
  // ĐẤU ION (30/10): nâng cấp WebSocket vào phòng đấu của ca.
  if (u.includes('/dau-ion/') && new URL(u).pathname.startsWith('/dau-ion/')) return vaoPhongDau(req, env)
  // BÌNH PHẢN ỨNG (06/11): nâng cấp WebSocket vào phòng của buổi; vé kiểm ở phong-binh-phan-ung.ts.
  if (u.includes(DUONG_PHONG_BPU) && new URL(u).pathname === DUONG_PHONG_BPU) return vaoPhongBpu(req, env)
  // KÊNH ĐẨY HAI THIẾT BỊ (31/10, kenh-day.ts): nâng cấp WebSocket vào ngăn của em.
  if (u.includes(DUONG_KENH) && new URL(u).pathname === DUONG_KENH && !req.headers.has(DAU_TRONG_NGAN)) return vaoKenh(req, env, ctx)
  return null
}

/** `/hs/diem-danh` + báo phòng Bình Phản Ứng của buổi (nếu đang mở) để bảng hiện em vào lớp NGAY. Việc báo phòng chạy NỀN (`waitUntil`):
 *  câu trả lời điểm danh KHÔNG BAO GIỜ chờ phòng; lỗi báo phòng không ảnh hưởng điểm danh. */
export async function hsDiemDanhBao(env: Env, b: Row, ctx?: ExecutionContext): Promise<Row> {
  const r = await hsDiemDanh(env, b)
  if (r.ok && r.buoi) {
    const viec = gameIdentity(env, b).then((sbd) => baoPhongVaoLop(env, (r.buoi as { id?: unknown }).id, sbd)).catch(() => undefined)
    if (ctx) ctx.waitUntil(viec); else void viec
  }
  return r
}
/** `/gv/buoi-hoc`: thầy KẾT THÚC buổi ⇒ phòng Bình Phản Ứng của buổi cũng kết thúc (máy em về chỗ cũ, ghi kết quả). */
export async function gvBuoiHocBpu(env: Env, b: Row): Promise<Row> {
  const r = await gvBuoiHoc(env, b)
  if (String(b.action ?? '') === 'dong' && r.ok !== false) await dongPhongBpu(env, b.id).catch(() => undefined)
  return r
}
/** `/hs/bpu/*` (token em). */
export async function bpuHs(env: Env, p: string, b: Row, ctx?: ExecutionContext): Promise<Row> {
  if (p === '/hs/bpu/ve') return hsBpuVe(env, b)
  if (p === '/hs/bpu/cua-em') return hsBpuCuaEm(env, b)
  if (p.startsWith('/hs/bpu/khoi-')) return (await import('./live-khoi')).hsLiveKhoi(env, p, b, Date.now(), ctx)
  return { ok: false, error: 'Không có lệnh này.' }
}
/** `/gv/bpu/*` (sau chốt mã bí mật của thầy). */
export async function bpuGv(env: Env, p: string, b: Row, ctx?: ExecutionContext): Promise<Row> {
  if (p === '/gv/bpu/mo') return gvBpuMo(env, b)
  if (p === '/gv/bpu/luot') return gvBpuLuot(env, b)
  if (p.startsWith('/gv/bpu/khoi-')) return (await import('./live-khoi')).gvLiveKhoi(env, p, b, Date.now(), ctx)
  return { ok: false, error: 'Không có lệnh này.' }
}
