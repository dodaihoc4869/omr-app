// Bộ đọc luồng NDJSON của «Kiểm tra» (`answer` với `luong: 1`, server/src/nop-luong.ts — thầy 28/10 «bấm kiểm tra … chưa tức thì ngay»). Tách khỏi api.ts:
// chỉ màn làm chặng (ManLamBaiTap, nạp lười) dùng ⇒ không vào lượt tải mở app.
/** Đọc luồng NDJSON của `answer`: dòng `tam` ⇒ `khiTam`; trả dòng ĐẦY ĐỦ cuối cùng (không `tam`), hoặc `null` khi luồng đứt trước dòng ấy. */
export async function docLuongNop(than: ReadableStream<Uint8Array>, khiTam: (o: Record<string, unknown>) => void): Promise<Record<string, unknown> | null> {
  const doc = than.getReader()
  const gm = new TextDecoder()
  let dem = ''
  let cuoi: Record<string, unknown> | null = null
  const xuLy = (d: string) => {
    if (!d.trim()) return
    let o: unknown
    try { o = JSON.parse(d) } catch { return }
    if (!o || typeof o !== 'object') return
    const x = o as Record<string, unknown>
    if (x.tam === true) { try { khiTam(x) } catch { /* lỗi giao diện không chặn phản hồi đầy đủ */ } } else cuoi = x
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

