import {afterEach,it,expect,vi} from 'vitest'
import {taoCaDaXacNhan} from '../src/lib/day-ca-may-chu-moi'
const ch={BAT:true,URL:'https://test'} as any
const ca={maCa:'123456',tenCa:'Ca thử',batDau:'2026-09-18T10:00:00Z'}
const res=(data:any,status=200)=>new Response(JSON.stringify(data),{status})
afterEach(()=>vi.unstubAllGlobals())
it('mất phản hồi nhưng máy chủ đã lưu: xác nhận thành công, không tạo lại',async()=>{
 const f=vi.fn().mockRejectedValueOnce(new TypeError('network')).mockResolvedValueOnce(res({daLuu:true}));vi.stubGlobal('fetch',f)
 expect(await taoCaDaXacNhan(ch,'test',ca,{})).toBe(true);expect(f).toHaveBeenCalledTimes(2)
 expect(f.mock.calls[1][0]).toBe('https://test/ca/xac-nhan')
})
it('lỗi tạm thời: gửi lại đúng mã và nguyên gói đề',async()=>{
 const f=vi.fn().mockResolvedValueOnce(res({},503)).mockResolvedValueOnce(res({daLuu:false})).mockResolvedValueOnce(res({ok:true}));vi.stubGlobal('fetch',f)
 expect(await taoCaDaXacNhan(ch,'test',ca,{},{})).toBe(true)
 expect(f.mock.calls[0][1].body).toBe(f.mock.calls[2][1].body)
})
it('lỗi xác thực không bị đổi thành lỗi mạng và không gửi lại',async()=>{
 const f=vi.fn().mockResolvedValue(res({ok:false},403));vi.stubGlobal('fetch',f)
 await expect(taoCaDaXacNhan(ch,'bad',ca,{})).rejects.toThrow('Mã xác thực');expect(f).toHaveBeenCalledTimes(1)
})
it('gói quá lớn báo rõ và không tải lại vô ích',async()=>{
 const f=vi.fn().mockResolvedValueOnce(res({},413)).mockResolvedValueOnce(res({daLuu:false}));vi.stubGlobal('fetch',f)
 await expect(taoCaDaXacNhan(ch,'test',ca,{})).rejects.toThrow('Gói đề quá lớn');expect(f).toHaveBeenCalledTimes(2)
})
it('mạng hỏng kéo dài không báo ca đã mở',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new TypeError('network')))
 await expect(taoCaDaXacNhan(ch,'test',ca,{})).rejects.toThrow('Chưa xác nhận lưu ca #123456')
})
it('thiếu mã xác thực không gửi dữ liệu',async()=>{
 const f=vi.fn();vi.stubGlobal('fetch',f)
 await expect(taoCaDaXacNhan(ch,'',ca,{})).rejects.toThrow('Chưa có mã xác thực');expect(f).not.toHaveBeenCalled()
})

it('đường tạo ca dùng xác thực trong thân và không cần preflight trên điện thoại',async()=>{
 const f=vi.fn().mockResolvedValue(res({ok:true}));vi.stubGlobal('fetch',f)
 await taoCaDaXacNhan(ch,'test',ca,{},{})
 const request=f.mock.calls[0][1]
 expect(request.headers).toEqual({'content-type':'text/plain;charset=utf-8'})
 expect(JSON.parse(request.body)).toMatchObject({secret:'test',ca})
})

it('đã có header nhưng thân phản hồi treo: hết hạn rồi xác nhận ca đã lưu',async()=>{
 vi.useFakeTimers()
 const f=vi.fn().mockResolvedValueOnce({ok:true,status:200,json:()=>new Promise(()=>{})}).mockResolvedValueOnce(res({daLuu:true}))
 vi.stubGlobal('fetch',f)
 try {
  const done=taoCaDaXacNhan(ch,'test',ca,{})
  await vi.advanceTimersByTimeAsync(45001)
  expect(await done).toBe(true)
  expect(f.mock.calls[0][1].signal.aborted).toBe(true)
  expect(f).toHaveBeenCalledTimes(2)
 } finally {vi.useRealTimers()}
})
it('fetch không kết thúc dù đã abort: thoát hữu hạn, không quay mãi',async()=>{
 vi.useFakeTimers();vi.stubGlobal('fetch',vi.fn(()=>new Promise(()=>{})))
 try {
  const done=expect(taoCaDaXacNhan(ch,'test',ca,{})).rejects.toThrow('Chưa xác nhận lưu ca')
  await vi.advanceTimersByTimeAsync(110001)
  await done
 } finally {vi.useRealTimers()}
})
// GỐC LỖI "Đang gửi ca…" treo rồi báo "Mất kết nối": bản cũ gửi QUA PROXY Pages
// trước, và chỉ lui về gọi thẳng khi proxy lỗi mạng/5xx. Khi proxy TREO tới hạn
// thì abort nuốt luôn lượt gọi thẳng ⇒ hai đường đều không xong.
// Từ 23/09: gọi THẲNG `workers.dev` trước, proxy là đường lui, mỗi đường một hạn.
it('gọi THẲNG máy chủ trước; proxy Pages chỉ là đường lui',async()=>{
 vi.stubGlobal('location', { origin: 'https://omr-app-b3u.pages.dev' } as any)
 const chProxy = { BAT: true, URL: 'https://omr.ttadodaihoc.workers.dev' }
 const f = vi.fn()
   .mockResolvedValueOnce(res({ error: 'máy chủ bận' }, 503)) // đường thẳng lỗi 5xx
   .mockResolvedValueOnce(res({ ok: true }, 200)) // proxy lưu được
 vi.stubGlobal('fetch', f)
 expect(await taoCaDaXacNhan(chProxy, 'test', ca, {})).toBe(true)
 expect(f).toHaveBeenCalledTimes(2)
 expect(f.mock.calls[0][0]).toBe('https://omr.ttadodaihoc.workers.dev/ca/day')
 expect(f.mock.calls[1][0]).toBe('https://omr-app-b3u.pages.dev/api/ca/day')
})
it('máy chủ thẳng chạy được thì KHÔNG đụng tới proxy (bỏ hẳn chặng thừa)',async()=>{
 vi.stubGlobal('location', { origin: 'https://omr-app-b3u.pages.dev' } as any)
 const chProxy = { BAT: true, URL: 'https://omr.ttadodaihoc.workers.dev' }
 const f = vi.fn().mockResolvedValue(res({ ok: true }, 200))
 vi.stubGlobal('fetch', f)
 expect(await taoCaDaXacNhan(chProxy, 'test', ca, {})).toBe(true)
 expect(f).toHaveBeenCalledTimes(1)
 expect(f.mock.calls[0][0]).toBe('https://omr.ttadodaihoc.workers.dev/ca/day')
})
it('máy chủ thẳng TREO tới hạn: vẫn còn nguyên lượt thử của proxy',async()=>{
 vi.useFakeTimers()
 try {
  vi.stubGlobal('location', { origin: 'https://omr-app-b3u.pages.dev' } as any)
  const chProxy = { BAT: true, URL: 'https://omr.ttadodaihoc.workers.dev' }
  const f = vi.fn()
    .mockResolvedValueOnce({ ok: true, status: 200, json: () => new Promise(() => {}) }) // thẳng: treo ở thân phản hồi
    .mockResolvedValueOnce(res({ ok: true }, 200)) // proxy lưu được
  vi.stubGlobal('fetch', f)
  const done = taoCaDaXacNhan(chProxy, 'test', ca, {})
  await vi.advanceTimersByTimeAsync(45001)
  expect(await done).toBe(true)
  expect(f.mock.calls[0][0]).toBe('https://omr.ttadodaihoc.workers.dev/ca/day')
  expect(f.mock.calls[1][0]).toBe('https://omr-app-b3u.pages.dev/api/ca/day')
 } finally { vi.useRealTimers() }
})
