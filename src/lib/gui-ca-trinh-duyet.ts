/** Đường tải ca cho Samsung Internet. Không thêm header xác thực hoặc quyền mới. */
export interface PhanHoiGuiCa {
  ok: boolean
  status: number
  data: { ok?: boolean; error?: string; daLuu?: boolean } | null
}

export function laSamsungInternet(): boolean {
  return typeof navigator !== 'undefined' && /SamsungBrowser\//i.test(navigator.userAgent)
}

/** XHR có sự kiện kết thúc riêng; vẫn nhận tín hiệu hủy từ hạn chờ của toàn lượt. */
export function guiCaBangXhr(url: string, body: string | Uint8Array, signal: AbortSignal, hanMs: number, encoding?: string): Promise<PhanHoiGuiCa> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    let xong = false
    const ketThuc = (viec: () => void) => {
      if (xong) return
      xong = true
      signal.removeEventListener('abort', huy)
      xhr.onload = xhr.onerror = xhr.onabort = xhr.ontimeout = null
      viec()
    }
    const huy = () => {
      ketThuc(() => reject(new Error('Máy chủ chưa phản hồi kịp.')))
      xhr.abort()
    }
    if (signal.aborted) { huy(); return }
    signal.addEventListener('abort', huy, { once: true })
    xhr.onload = () => ketThuc(() => {
      let data: PhanHoiGuiCa['data'] = null
      try { data = JSON.parse(xhr.responseText) as PhanHoiGuiCa['data'] } catch { /* chỗ gọi thử đường còn lại */ }
      resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, data })
    })
    xhr.onerror = () => ketThuc(() => reject(new Error('Không tải được ca lên máy chủ.')))
    xhr.onabort = xhr.ontimeout = () => ketThuc(() => reject(new Error('Máy chủ chưa phản hồi kịp.')))
    try {
      xhr.open('POST', url, true)
      xhr.timeout = hanMs
      xhr.setRequestHeader('content-type', 'text/plain;charset=utf-8')
      if (encoding) xhr.setRequestHeader('content-encoding', encoding)
      xhr.send(body as any)
    } catch (e) {
      ketThuc(() => reject(e))
    }
  })
}
