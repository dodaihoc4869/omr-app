/**
 * MÁY CHỦ GAME — Worker RIÊNG, tách hẳn khỏi máy chủ thi `omr`.
 *
 * Vì sao tách: máy chủ thi giữ đề, đáp án và bài làm của học sinh. Game là đồ
 * chơi. Nhét chung một Worker là một lỗi trong game có thể làm sập đường thi
 * giữa ca — không đáng đổi lấy chút tiện.
 *
 * Ở đây KHÔNG có D1, KHÔNG có R2, KHÔNG có MA_BI_MAT. Máy chủ này không chạm
 * được vào một byte dữ liệu học sinh nào, kể cả khi bị chiếm.
 */
export { PhongChoi } from './phong'

export interface Env {
  PHONG: DurableObjectNamespace
}

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,OPTIONS',
  'access-control-allow-headers': 'content-type',
}

/** Mã phòng 4 ký tự, bỏ chữ dễ đọc nhầm (0/O, 1/I). */
const CHU = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function maPhongMoi(): string {
  const b = new Uint8Array(4)
  crypto.getRandomValues(b)
  return Array.from(b, (n) => CHU[n % CHU.length]).join('')
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url)
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

    // /moi → xin một mã phòng mới
    if (url.pathname === '/moi') {
      return new Response(JSON.stringify({ ma: maPhongMoi() }), {
        headers: { 'content-type': 'application/json', ...CORS },
      })
    }

    // /phong/<MÃ> → nối vào phòng đó (WebSocket)
    const m = /^\/phong\/([A-Z0-9]{4})$/.exec(url.pathname)
    if (m) {
      const ma = m[1]!
      const id = env.PHONG.idFromName(ma)
      const phong = env.PHONG.get(id)
      const u = new URL(req.url)
      u.searchParams.set('ma', ma)
      return phong.fetch(new Request(u.toString(), req))
    }

    if (url.pathname === '/khoe') {
      return new Response('ok', { headers: CORS })
    }

    return new Response('không có đường này', { status: 404, headers: CORS })
  },
}
