// Chẩn đoán đúng luồng đăng nhập -> Sảnh, một hồ sơ đã được thầy đặt trong phạm vi.
// Không in/lưu mật khẩu, token, tên học sinh, câu hỏi hay phản hồi nguyên bản.
// Không gọi bất kỳ lệnh làm bài/nộp bài/nhận thưởng nào.
const api = 'https://omr.ttadodaihoc.workers.dev'
const origin = 'https://omr-app-b3u.pages.dev'
const d1 = await fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/d1/database/d2e6d322-374a-45d7-83a3-9fac486b23f1/query`, {method:'POST',headers:{authorization:`Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,'content-type':'application/json'},body:JSON.stringify({sql:'SELECT mat_khau FROM hoc_sinh WHERE sbd = ?',params:['11010']}),signal:AbortSignal.timeout(20000)})
const rows = await d1.json()
if (!d1.ok || !rows.success) throw new Error('Không đọc được hồ sơ kiểm tra; dừng.')
const password = rows.result?.[0]?.results?.[0]?.mat_khau
if (!password) throw new Error('Hồ sơ không có thông tin đăng nhập; dừng, không đặt lại mật khẩu.')
async function post(path, body) {
  const start = Date.now()
  try {
    const r = await fetch(api + path,{method:'POST',headers:{'content-type':'application/json',origin},body:JSON.stringify(body),signal:AbortSignal.timeout(55000)})
    const json = await r.json().catch(()=>null)
    const ms = Date.now()-start
    const err = String(json?.error ?? json?.loi ?? '')
    const category = /overloaded|requests queued for too long|too many requests|SQLITE_BUSY/i.test(err) ? 'D1_OVERLOADED' : /Phiên game|Mật khẩu|đăng nhập/i.test(err) ? 'AUTH' : err ? 'SERVER_OTHER' : null
    console.log('live_step',JSON.stringify({path,status:r.status,ms,over15s:ms>15000,ok:json?.ok===true,category,cors:r.headers.get('access-control-allow-origin'),ray:r.headers.get('cf-ray'),fields:json?Object.keys(json):[],canChonThu:json?.canChonThu===true,cheDo2:json?.cheDo2===true}))
    return json
  } catch(e) {
    console.log('live_step',JSON.stringify({path,ms:Date.now()-start,errorType:e.name}))
    return null
  }
}
const login = await post('/hs/dang-nhap',{sbd:'11010',matKhau:password,kemSanh:false})
if (!login?.ok || !login.token) throw new Error('Đăng nhập kiểm tra chưa đạt; dừng.')
const lobby = await post('/game-v2/hoa2-sanh',{token:login.token})
if (!lobby?.ok) process.exitCode = 1
