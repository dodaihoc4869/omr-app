import { afterEach, expect, it, vi } from 'vitest'
import { onRequest } from '../functions/api/ca/[[path]]'
import { diaChiGuiCa } from '../src/lib/day-ca-may-chu-moi'
afterEach(()=>vi.unstubAllGlobals())
it('app chính gửi ca qua cùng tên miền, không đổi đích của máy chủ riêng',()=>{
 expect(diaChiGuiCa('https://omr.ttadodaihoc.workers.dev','https://omr-app-b3u.pages.dev')).toBe('https://omr-app-b3u.pages.dev/api')
 expect(diaChiGuiCa('https://other.test','https://omr-app-b3u.pages.dev')).toBe('https://other.test')
 expect(diaChiGuiCa('https://omr.ttadodaihoc.workers.dev','https://fake.test')).toBe('https://omr.ttadodaihoc.workers.dev')
})
it.each([200,403,413,500])('chuyển tiếp nguyên gói, giữ mã trả về %s và không cấp thêm quyền',async status=>{
 let body=''
 const f=vi.fn(async (url:any,init:any)=>{
  expect(url).toBe('https://omr.ttadodaihoc.workers.dev/ca/day')
  body=await new Response(init.body).text()
  expect(init.headers).toEqual({'content-type':'text/plain;charset=utf-8'})
  return new Response(JSON.stringify({ok:status===200}),{status})
 });vi.stubGlobal('fetch',f)
 const payload=JSON.stringify({secret:'test-only',ca:{maCa:'TEST'},bank:{}})
 const response=await onRequest({env:{OMR:{fetch}},request:new Request('https://omr-app-b3u.pages.dev/api/ca/day',{method:'POST',body:payload})})
 expect(response.status).toBe(status);expect(body).toBe(payload)
 expect(response.headers.get('cache-control')).toBe('no-store')
})
it('không cho dùng đường chuyển tiếp sang lệnh khác',async()=>{
 const f=vi.fn();vi.stubGlobal('fetch',f)
 const r=await onRequest({env:{OMR:{fetch}},request:new Request('https://omr-app-b3u.pages.dev/api/ca/other',{method:'POST'})})
 expect(r.status).toBe(404);expect(f).not.toHaveBeenCalled()
})
it('mất kết nối máy chủ không báo thành công',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new TypeError('network')))
 const r=await onRequest({env:{OMR:{fetch}},request:new Request('https://omr-app-b3u.pages.dev/api/ca/xac-nhan',{method:'POST',body:'{}'})})
 expect(r.status).toBe(502);expect((await r.json()).ok).toBe(false)
})
it('tự dùng fetch toàn cục khi env không có binding OMR',async()=>{
 const f=vi.fn(async()=>new Response(JSON.stringify({ok:true}),{status:200}))
 vi.stubGlobal('fetch',f)
 const r=await onRequest({env:{},request:new Request('https://omr-app-b3u.pages.dev/api/ca/day',{method:'POST',body:'{"secret":"test"}'})})
 expect(r.status).toBe(200)
 expect(f).toHaveBeenCalled()
})
