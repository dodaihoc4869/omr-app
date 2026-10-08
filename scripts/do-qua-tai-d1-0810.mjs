// Chỉ đọc, chỉ in số đo và cấu trúc chỉ mục, không in dữ liệu học sinh/token.
const root = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}`
const headers = {authorization:`Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,'content-type':'application/json'}
const db = 'd2e6d322-374a-45d7-83a3-9fac486b23f1'
async function read(path, body) {
  const start=Date.now()
  const res=await fetch(root+path,{headers,method:body?'POST':'GET',...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(35000)})
  const j=await res.json()
  return {ms:Date.now()-start,status:res.status,data:j}
}
const insights=await read(`/d1/database/${db}/insights?duration=15m`).catch(e=>({error:e.name}))
// Insights chỉ chứa thống kê truy vấn; không in SQL/tham số có thể chứa dữ liệu riêng.
console.log('insights',JSON.stringify({status:insights.status,ms:insights.ms,success:insights.data?.success,keys:Object.keys(insights.data?.result??{}),errorCodes:insights.data?.errors?.map(e=>e.code)}))
for(const [label,sql] of [
 ['ping','SELECT 1 AS ok'],
 ['schema',"SELECT name FROM sqlite_master WHERE type='index' AND tbl_name IN ('su_kien_hoc','srs2_ke_hoach','game_v2_question','nam_kt_dang') ORDER BY name"],
 ['sessions',"SELECT (SELECT COUNT(*) FROM ca WHERE trang_thai='mo') AS ca_mo, (SELECT COUNT(*) FROM chien_dich WHERE trang_thai='dang_chay') AS chien_dich"],
]) {
  const r=await read(`/d1/database/${db}/query`,{sql}).catch(e=>({error:e.name}))
  console.log(label,JSON.stringify(r))
  if(!r.data?.success) break // Không thêm tải khi D1 đã nghẽn.
}
