// "CẢNH BÁO CỦA THẦY" — báo máy chủ em/phụ huynh ĐÃ XEM (Code 3 chốt 21/09): `POST /hs/canh-bao/xem {token,id}` → {ok} (ghi lần xem đầu, chỉ
// cảnh báo của chính em) và `POST /ph/canh-bao/xem {pass,id}` → {ok}. Em bấm "Làm ngay" cũng gọi lệnh HS.
// KHÔNG ném lỗi: mất mạng / máy chủ cũ chưa có lệnh ⇒ trả false, giao diện vẫn thu gọn thẻ tại máy (lần mở sau máy chủ nhắc lại nếu chưa ghi được).
// Mã học sinh/phụ huynh chỉ đi trong thân lệnh này, không hiện, không ghi console.
import { layDiaChiMayChu } from './dia-chi-may-chu'
import { docPass } from './ph-token'

const HAN_MS = 10_000

async function goi(duong: string, than: Record<string, unknown>): Promise<boolean> {
  try {
    const url = await layDiaChiMayChu()
    if (!url) return false
    const bo = new AbortController()
    const hen = setTimeout(() => bo.abort(), HAN_MS)
    try {
      const r = await fetch(`${String(url).replace(/\/+$/, '')}${duong}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(than), signal: bo.signal })
      if (!r.ok) return false
      const j = (await r.json()) as { ok?: boolean } | null
      return !!j && j.ok === true
    } finally {
      clearTimeout(hen)
    }
  } catch {
    return false
  }
}

export function baoDaXemHocSinh(token: string, id: string): Promise<boolean> {
  return token && id ? goi('/hs/canh-bao/xem', { token, id }) : Promise.resolve(false)
}

export function baoDaXemPhuHuynh(id: string): Promise<boolean> {
  const pass = docPass()
  return pass && id ? goi('/ph/canh-bao/xem', { pass, id }) : Promise.resolve(false)
}
