// Dọn đúng job này; job cũ chỉ được truyền sau cổng xác minh manifest/Actions.
const run = process.env.CHUA_RUN_CAN_DON ?? process.env.GITHUB_RUN_ID
const attempt = process.env.CHUA_ATTEMPT_CAN_DON ?? process.env.GITHUB_RUN_ATTEMPT
const account = process.env.CLOUDFLARE_ACCOUNT_ID, token = process.env.CLOUDFLARE_API_TOKEN
if (!/^\d+$/.test(run ?? '') || !/^\d+$/.test(attempt ?? '') || !token || !account) throw new Error('Thiếu cấu hình dọn công cụ giao.')
const name = `chua-giao-${run}-${attempt}`
const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/${name}`, {
  method: 'DELETE', headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(30000),
})
if (response.status !== 404) {
  const result = await response.json()
  if (!response.ok || !result.success) throw new Error('Chưa dọn được công cụ giao tạm.')
}
console.log(JSON.stringify({ workerGiaoTamDaDon: true }))
