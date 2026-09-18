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
it('proxy Pages trả 502: tự động thử đường trực tiếp và tạo ca thành công',async()=>{
 vi.stubGlobal('location', { origin: 'https://omr-app-b3u.pages.dev' } as any)
 const chProxy = { BAT: true, URL: 'https://omr.ttadodaihoc.workers.dev' }
 const f = vi.fn()
   .mockResolvedValueOnce(res({ error: 'Chưa kết nối được máy chủ lưu ca.' }, 502)) // proxy /api/ca/day thất bại
   .mockResolvedValueOnce(res({ ok: true }, 200)) // direct /ca/day thành công
 vi.stubGlobal('fetch', f)
 expect(await taoCaDaXacNhan(chProxy, 'test', ca, {})).toBe(true)
 expect(f).toHaveBeenCalledTimes(2)
 expect(f.mock.calls[0][0]).toBe('https://omr-app-b3u.pages.dev/api/ca/day')
 expect(f.mock.calls[1][0]).toBe('https://omr.ttadodaihoc.workers.dev/ca/day')
})
