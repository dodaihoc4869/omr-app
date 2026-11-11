// Tách tệp migration Xem lại Live thành từng câu SQL (không chạm mạng — test gọi được): bỏ dòng chú thích + phần chú thích cuối dòng (`-- …`),
// gom tới dấu «;». Dùng bởi scripts/ap-migration-live-xem-lai-1111.mjs và tests/live-xem-lai-lenh-1111.test.ts.
export function tachCauLive(sql) {
  const ds = []
  let cur = []
  for (const dongTho of sql.split('\n')) {
    const dong = dongTho.replace(/\s+--.*$/, '')
    if (/^\s*--/.test(dongTho) || (!cur.length && !dong.trim())) continue
    cur.push(dong)
    if (/;\s*$/.test(dong)) { ds.push(cur.join('\n').trim()); cur = [] }
  }
  if (cur.join('').trim()) throw new Error('Migration Xem lại Live: câu cuối thiếu dấu «;».')
  return ds
}
