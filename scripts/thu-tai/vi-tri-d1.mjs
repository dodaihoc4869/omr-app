// THỬ TẢI 28/10 — D1 THẬT và D1 SAO đang chạy ở đâu (CHỈ ĐỌC, một câu `SELECT 1` mỗi D1, ngoài khung học). In meta `served_by*` + thời gian khứ hồi
// từ runner — không đọc dòng dữ liệu nào. Dùng để chọn nơi ghim Worker sao cho giống bản thật (Smart Placement của bản thật đặt Worker sát D1 thật).
const { CF_TOKEN_SACH: TOKEN, CF_ACC_SACH: ACC, DB_THAT, DB_SAO } = process.env
const gio = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', hourCycle: 'h23' }).format(new Date()))
if (gio >= 18) { console.log('Khung học 18–24 giờ VN — không hỏi D1 thật.'); process.exit(0) }
for (const [ten, id] of [['that', DB_THAT], ['sao', DB_SAO]]) {
  if (!id) continue
  for (let i = 0; i < 3; i++) {
    const t0 = Date.now()
    const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACC}/d1/database/${id}/query`, { method: 'POST', headers: { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' }, body: JSON.stringify({ sql: 'SELECT 1 AS x' }) })
    const j = await r.json()
    const m = j.result?.[0]?.meta ?? {}
    const giu = Object.fromEntries(Object.entries(m).filter(([k]) => /served|region|colo|primary|duration/i.test(k)))
    console.log(`D1 ${ten}: ${Date.now() - t0} ms · ${JSON.stringify(giu)}`)
  }
}
