import {describe,it,expect} from 'vitest'
import {validPushEndpoint} from '../server/src/notifications'
describe('Địa chỉ thông báo đẩy',()=>{
 it('chỉ dùng dịch vụ push HTTPS được hỗ trợ',()=>{for(const url of ['https://fcm.googleapis.com/fcm/send/id','https://web.push.apple.com/id','https://updates.push.services.mozilla.com/id'])expect(validPushEndpoint(url)).toBe(true)})
 it('chặn máy nội bộ, chuyển hướng giả, credentials và tên miền giả',()=>{for(const url of ['http://fcm.googleapis.com/id','https://127.0.0.1/id','https://fcm.googleapis.com.evil.test/id','https://x@fcm.googleapis.com/id','https://fcm.googleapis.com:8443/id','invalid'])expect(validPushEndpoint(url)).toBe(false)})
})
