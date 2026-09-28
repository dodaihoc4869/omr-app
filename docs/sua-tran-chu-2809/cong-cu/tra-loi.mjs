import { fxChienDich } from './fx.mjs'
import { fxGv } from './fx-gv.mjs'
import { fxHs } from './fx-hs.mjs'
// Trả dữ liệu giả theo đường dẫn; undefined = chưa có mẫu (khung ghi lại).
export function traLoi(u, body, method) {
  const p = u.pathname
  if (p === '/presence' || p.endsWith('/presence')) return { ok: true }
  if (p === '/gv/chien-dich') return fxChienDich(body)
  const g = fxGv(p, body, u, method)
  if (g !== undefined) return g
  const h = fxHs(p, body, u, method)
  if (h !== undefined) return h
  return undefined
}
