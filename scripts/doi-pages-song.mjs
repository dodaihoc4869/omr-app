// Pages có thể báo deployment thành công trước khi mọi đường ở biên nhận bản mới.
// Chỉ chờ lỗi tạm thời, không biến lỗi quyền/nội dung thành một lượt kiểm đạt.
export async function kiemDuongPages(url, {
  laPhienBan = false, fetchFn = fetch, doi = ms => new Promise(resolve => setTimeout(resolve, ms)),
  soLan = 12, choMs = 10000,
} = {}) {
  for (let lan = 1; lan <= soLan; lan++) {
    let response
    try { response = await fetchFn(url, { signal: AbortSignal.timeout(30000), cache: 'no-store' }) }
    catch {
      if (lan === soLan) throw new Error('Pages chưa kết nối ổn định sau thời gian chờ.')
      await doi(choMs)
      continue
    }
    if (response.ok) {
      if (laPhienBan) {
        if (!Number.isFinite((await response.json()).builtAt)) throw new Error('Thiếu phiên bản service worker.')
      } else {
        const type = response.headers.get('content-type') ?? ''
        const html = await response.text()
        if (!type.includes('text/html') || !html.includes('startup-retry')) throw new Error('Pages chưa trả đúng trang app.')
      }
      return
    }
    const tamThoi = [404, 408, 429].includes(response.status) || response.status >= 500
    await response.body?.cancel()
    if (!tamThoi || lan === soLan) throw new Error(`Đường giao diện ${new URL(url).pathname} trả HTTP ${response.status}.`)
    await doi(choMs)
  }
  throw new Error('Chưa thực hiện kiểm đường Pages.')
}
