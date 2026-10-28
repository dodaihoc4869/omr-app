// «KIỂM TRA» THEO LUỒNG (thầy 28/10 «Bấm kiểm tra vẫn bị chậm, chưa tức thì ngay» — server/src/nop-luong.ts, cham-nhanh.ts).
// `POST /game-v2/answer` kèm `luong: 1`: máy chủ chấm được từ bộ nhớ ⇒ NDJSON — dòng `tam: true` (đúng / sai, chưa thưởng) đi ngay ⇒ `tam(o)`; dòng cuối = phản hồi
// ĐẦY ĐỦ (đã ghi) ⇒ lời hứa xong. Không chấm nhanh được / máy chủ cũ ⇒ JSON thường như `goiHoa2`. Cùng hạn giờ, cùng lời lỗi, cùng mã lỗi (`het_gio` / `mat_mang`
// ⇒ `guiLaiBenVung` gửi lại; biên nhận phiên|câu chống trùng). Tệp riêng của màn làm chặng (nạp lười) — không vào lượt tải mở app.
import { layDiaChiMayChu } from '../../lib/dia-chi-may-chu'
import { loiCuaKetQua } from '../../game/than-thu-v2/loi-het-tran'
import { LoiHoa2 } from './api'
import { dauMocD1 } from '../../lib/moc-d1'

type Obj = Record<string, unknown>

/** Đọc thân NDJSON: dòng `tam` ⇒ `tam(o)`; trả dòng đầy đủ cuối cùng, hoặc `null` khi luồng đứt trước dòng ấy. */
async function docLuong(than: ReadableStream<Uint8Array>, tam: (o: Obj) => void): Promise<Obj | null> {
  const doc = than.getReader()
  const gm = new TextDecoder()
  let dem = ''
  let cuoi: Obj | null = null
  const xuLy = (d: string) => {
    if (!d.trim()) return
    let o: unknown
    try { o = JSON.parse(d) } catch { return }
    if (!o || typeof o !== 'object') return
    const x = o as Obj
    if (x.tam === true) { try { tam(x) } catch { /* lỗi giao diện không chặn phản hồi đầy đủ */ } } else cuoi = x
  }
  try {
    for (;;) {
      const { value, done } = await doc.read()
      if (value) dem += gm.decode(value, { stream: true })
      for (let i = dem.indexOf('\n'); i >= 0; i = dem.indexOf('\n')) { xuLy(dem.slice(0, i)); dem = dem.slice(i + 1) }
      if (done) { xuLy(dem); return cuoi }
    }
  } catch {
    return null
  }
}

/** Như `goiHoa2('answer', token, du, giay)` nhưng xin trả theo luồng; `tam` nhận dòng đúng / sai tạm. */
export async function nopCauLuong(token: string, du: Obj, giay: number, tam: (o: Obj) => void): Promise<Obj> {
  const c = new AbortController()
  let hen: ReturnType<typeof setTimeout> | undefined
  const hetHan = new Promise<never>((_, hong) => { hen = setTimeout(() => { c.abort(); hong(new DOMException('Đã hết giờ', 'AbortError')) }, giay * 1000) })
  try {
    return await Promise.race([hetHan, (async () => {
      const goc = (await layDiaChiMayChu('')) || 'https://omr.ttadodaihoc.workers.dev'
      if (c.signal.aborted) throw new DOMException('Đã hết giờ', 'AbortError')
      dauMocD1('answer') // 28/10: lần ghi ⇒ lượt đọc bản sao kế tiếp lấy mốc tươi (moc-d1.ts)
      const r = await fetch(`${goc}/game-v2/answer`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...du, luong: 1, token }), signal: c.signal })
      let j: Obj | null = null
      if (r.body && /ndjson/i.test(r.headers.get('content-type') ?? '')) {
        j = await docLuong(r.body, tam)
        if (!j) throw new LoiHoa2('Chưa kết nối được máy chủ. Em kiểm tra mạng rồi thử lại.', 'mat_mang')
      } else {
        try { j = (await r.json()) as Obj } catch { j = null }
      }
      if (!j || typeof j !== 'object') throw new LoiHoa2('Máy chủ chưa trả lời được. Em thử lại sau ít phút.')
      if (j.ok !== true) throw new LoiHoa2(loiCuaKetQua(j) || 'Máy chủ chưa trả lời được. Em thử lại sau ít phút.', typeof j.ma === 'string' ? j.ma : j.ma == null ? '' : String(j.ma))
      return j
    })()])
  } catch (e) {
    if (e instanceof LoiHoa2) throw e
    if ((e as { name?: string })?.name === 'AbortError') throw new LoiHoa2('Máy chủ phản hồi chậm hoặc mạng gián đoạn. Em thử lại nhé.', 'het_gio')
    throw new LoiHoa2('Chưa kết nối được máy chủ. Em kiểm tra mạng rồi thử lại.', 'mat_mang')
  } finally {
    clearTimeout(hen)
  }
}
