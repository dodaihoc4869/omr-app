// VIDEO TÓM TẮT — CỔNG KIỂM KỊCH BẢN TRƯỚC KHI TẢI (thầy 14/11: văn phòng làm tự động, không ai xem tay ⇒ lỗi phải chặn, không được im lặng).
// Hỏng (thoát 1) khi: cảnh nội dung KHÔNG có hoạt hoạ · mốc hoạt hoạ / khoanh / Em nhẩm / Đoán nhanh ra rỗng · hoạt hoạ «tu-do»: trùng id, bước gọi id / mốc không có, nét nối gọi phần tử
// không có, phần tử ngoài lưới 12 cột hoặc tràn đáy cột, phần tử không có bước «hien», chữ dài quá sức ô (kể cả khi đã thu cỡ) · Đoán nhanh phương án dài.
// Dùng: node kiem-hoat.mjs <kich-ban.json>
import { readFileSync } from 'node:fs'
const kb = JSON.parse(readFileSync(process.argv[2], 'utf8'))
const loi = [], canh = kb.doan.filter((d) => d.loai === 'canh')
const COT_W = 828, HANG = 56, CO = { lon: 44, vua: 34, nho: 27 }
const bo = (s) => String(s ?? '').replace(/\*\*/g, '')
for (const d of canh) {
  const ten = `${d.id} «${d.tieuDe}»`
  // Thầy 14/11 «tất cả phải có hoạt hoạ đầy đủ như video K12»: cảnh nội dung không có hoạt hoạ ⇒ HỎNG (chỉ bảng phấn chưa đủ; không có mô-đun hợp ⇒ dùng «tu-do»; «phanTu» = hoạt hoạ Gly + Gly riêng của K12 c4 cũng tính).
  if (!d.hoat && !d.phanTu) loi.push(`${ten}: cảnh không có hoạt hoạ — mọi cảnh nội dung phải có «hoat» (không có mô-đun hợp ⇒ soạn «tu-do»)`)
  if (d.hoat) {
    for (const [k, v] of Object.entries(d.hoat.moc || {})) if (!Number.isFinite(v)) loi.push(`${ten}: mốc hoạt hoạ «${k}» không tìm được chữ trong lời`)
    if (d.hoat.loai === 'tu-do') {
      const p = d.hoat.p || {}, ids = new Set(), rows = Math.floor(d.hoat.cao / HANG)
      for (const e of p.phanTu || []) {
        if (!e.id) { loi.push(`${ten}: phần tử thiếu id`); continue }
        if (ids.has(e.id)) loi.push(`${ten}: trùng id «${e.id}»`); ids.add(e.id)
        if (e.kieu === 'pt') (e.tu || []).forEach((_, k) => ids.add(`${e.id}.${k}`))
      }
      for (const e of p.phanTu || []) {
        if (e.kieu === 'lien-ket' || e.kieu === 'mui-ten') { for (const x of [e.tu, e.den]) if (!ids.has(x)) loi.push(`${ten}: «${e.id}» nối tới «${x}» không có`); }
        else {
          const o = e.o ?? -1, h = e.h ?? -1, r = e.r || 4, c = e.c || 1
          if (o < 0 || h < 0 || o + r > 12) loi.push(`${ten}: «${e.id}» ngoài lưới (o ${o}, r ${r}: o + r phải ≤ 12)`)
          if (h + c > rows) loi.push(`${ten}: «${e.id}» tràn đáy cột (h ${h} + c ${c} > ${rows} hàng của cao ${d.hoat.cao})`)
          if (e.kieu === 'chu') {
            const w = (r / 12) * COT_W - 24, px = CO[e.co || 'vua'], dai = bo(e.chu).length * px * 0.55, sucChua = w * c * 1.0
            if (dai > sucChua * 1.9) loi.push(`${ten}: chữ «${bo(e.chu).slice(0, 40)}…» quá dài cho ô ${r}×${c} (cỡ ${e.co || 'vua'}) — tách ô / rút gọn / cỡ nhỏ`)
          }
        }
        if (e.kieu !== 'khung' && !(p.buoc || []).some((b) => b.id === e.id && b.lam === 'hien')) loi.push(`${ten}: «${e.id}» không có bước «hien» (sẽ không bao giờ hiện)`)
      }
      for (const b of p.buoc || []) {
        if (!ids.has(b.id)) loi.push(`${ten}: bước ${b.lam} gọi «${b.id}» không có`)
        if (!(b.moc in (d.hoat.moc || {}))) loi.push(`${ten}: bước ${b.lam} «${b.id}» dùng mốc «${b.moc}» chưa khai trong moc`)
      }
    }
  }
  for (const x of d.danhDau || []) if (!Number.isFinite(x.t0)) loi.push(`${ten}: khoanh bảng không tìm được mốc`)
  for (const x of d.nham || []) if (!Number.isFinite(x.t0)) loi.push(`${ten}: Em nhẩm không đặt được`)
  if (d.doVui) {
    if (!Number.isFinite(d.doVui.tMo)) loi.push(`${ten}: Đoán nhanh không tìm được lúc lộ đáp án (moLuc)`)
    for (const l of d.doVui.luaChon || []) if (bo(l[1]).length > 24) loi.push(`${ten}: phương án Đoán nhanh «${l[1]}» dài quá 24 kí tự (vỡ thẻ) — rút còn 1–3 chữ`)
    if (!(d.doVui.luaChon || []).some((l) => l[2])) loi.push(`${ten}: Đoán nhanh không có phương án đúng`)
  }
}
// NHỊP HÌNH (thầy 14/11 «cắt cảnh hấp dẫn hơn và gây nghiện hơn»): quãng > 12 s không có gì mới trên hình (bước hoạt hoạ, khoanh, máy quay đổi khung,
// thẻ, Em nhẩm, Đoán nhanh) ⇒ CẢNH BÁO (in ra, không chặn) — văn phòng thêm bước hình / khoanh vào quãng đó.
const canhBao = []
for (const d of canh) {
  const ev = [...Object.values(d.hoat?.moc || {}), ...Object.values(d.phanTu || {}), ...(d.danhDau || []).map((x) => x.t0), ...(d.khung || []).map((x) => x.t), ...(d.su || []).map((x) => x.t), ...(d.nham || []).map((x) => x.t0), ...(d.theNoi || []).map((x) => x.t0), d.doVui?.t0].filter(Number.isFinite).sort((a, b) => a - b)
  const moc = [d.t0, ...ev, d.t1]
  for (let i = 1; i < moc.length; i++) if (moc[i] - moc[i - 1] > 12) canhBao.push(`${d.id}: ${(moc[i] - moc[i - 1]).toFixed(0)} s không có gì mới trên hình (từ giây ${(moc[i - 1] - d.t0).toFixed(0)} của cảnh)`)
}
if (canhBao.length) console.log(`NHỊP HÌNH: ${canhBao.length} quãng đứng yên > 12 s — thêm bước hình / khoanh:\n  · ${canhBao.join('\n  · ')}`)
const mo = kb.doan.find((d) => d.loai === 'mo-dau')
if (mo && bo(mo.tieuDe).length > 12) loi.push(`mở đầu: tiêu đề «${mo.tieuDe}» dài quá 12 kí tự (chữ 230 px sẽ tràn) — 1–2 chữ`)
if (mo && bo(mo.phu).length > 56) loi.push(`mở đầu: dòng phụ dài quá 56 kí tự (tràn màn điện thoại)`)
console.log(loi.length ? `CỔNG KIỂM: ${loi.length} lỗi\n  - ${loi.join('\n  - ')}` : `CỔNG KIỂM: đạt (${canh.length} cảnh, ${canh.filter((d) => d.hoat || d.phanTu).length} có hoạt hoạ)`)
process.exit(loi.length ? 1 : 0)
