const CHU = 'http://127.0.0.1:8799'
const nghi = (ms) => new Promise((r) => setTimeout(r, ms))
async function main() {
  const { ma } = await (await fetch(CHU + '/moi')).json()
  const log = []
  const o = new WebSocket(CHU.replace('http', 'ws') + '/phong/' + ma)
  await new Promise((ok) => { o.onopen = ok })
  o.onmessage = (e) => log.push(JSON.parse(e.data))
  o.send(JSON.stringify({ loai: 'vao', bietDanh: 'Bảo', maMay: 'a'.repeat(32), phienBan: 1 }))
  await nghi(500)
  o.send(JSON.stringify({ loai: 'chonChat', hoaChat: 'Zn' }))
  console.log('đợi hết 30 giây phòng chờ…')
  await nghi(32000)

  const vaoVan = log.find((g) => g.loai === 'vaoVan')
  if (!vaoVan) { console.log('✗ ván KHÔNG mở sau 30 giây'); process.exit(1) }

  // chạy sang phải 3 giây, xem máy chủ có thật sự di chuyển mình không
  const truoc = log.filter((g) => g.loai === 'anh').pop()
  let stt = 0
  for (let i = 0; i < 60; i++) {
    o.send(JSON.stringify({ loai: 'phim', trai: false, phai: true, nhay: i % 20 === 0, stt: ++stt }))
    await nghi(50)
  }
  await nghi(300)
  const sau = log.filter((g) => g.loai === 'anh').pop()
  const anh = log.filter((g) => g.loai === 'anh')
  const toiTruoc = truoc?.nguoi.find((n) => n.id === vaoVan.idCuaBan)
  const toiSau = sau?.nguoi.find((n) => n.id === vaoVan.idCuaBan)

  // gói giả: tự dời mình 5000 đơn vị
  const xTruocGia = toiSau?.x ?? 0
  o.send(JSON.stringify({ loai: 'phim', trai: false, phai: false, nhay: false, stt: ++stt, x: xTruocGia + 5000 }))
  await nghi(400)
  const sauGia = log.filter((g) => g.loai === 'anh').pop()
  const toiSauGia = sauGia?.nguoi.find((n) => n.id === vaoVan.idCuaBan)

  const nhipDo = anh.length / ((anh[anh.length-1].giay - anh[0].giay) || 1)
  const kq = {
    'ván mở sau 30 giây chờ': !!vaoVan,
    'có đúng 12 người (1 thật + 11 máy)': vaoVan.nguoi.length === 12,
    'mình giữ đúng chất đã chọn': vaoVan.nguoi.find(n=>n.id===vaoVan.idCuaBan)?.hoaChat === 'Zn',
    'máy chủ bắn ảnh liên tục': anh.length > 40,
    [`nhịp ảnh ≈20/giây (đo ${nhipDo.toFixed(1)})`]: nhipDo > 15 && nhipDo < 25,
    'gửi phím PHẢI thì máy chủ dời mình sang phải': (toiSau?.x ?? 0) > (toiTruoc?.x ?? 0),
    'GÓI GIẢ tự dời 5000 đơn vị BỊ BỎ QUA': Math.abs((toiSauGia?.x ?? 0) - xTruocGia) < 400,
    'ảnh có đủ quái và hoa': Array.isArray(sau?.quaiSong) && Array.isArray(sau?.hoaCon),
  }
  o.close()
  let dat = true
  for (const [k, v] of Object.entries(kq)) { if (!v) dat = false; console.log(`  ${v ? '✓' : '✗'} ${k}`) }
  console.log(dat ? '\nE2E VÁN THẬT: ĐẠT' : '\nE2E VÁN THẬT: TRƯỢT')
  process.exit(dat ? 0 : 1)
}
main().catch((e) => { console.error('lỗi:', e.message); process.exit(1) })
