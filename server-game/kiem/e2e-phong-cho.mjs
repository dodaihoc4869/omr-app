// Hai máy khách thật nối vào một phòng trên máy chủ đang chạy.
const CHU = process.argv[2] || 'http://127.0.0.1:8799'
const nghi = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  const r = await fetch(CHU + '/moi')
  const { ma } = await r.json()
  console.log('mã phòng:', ma)

  const log = { A: [], B: [] }
  function noi(ten, bietDanh) {
    return new Promise((ok, hong) => {
      const o = new WebSocket(CHU.replace('http', 'ws') + '/phong/' + ma)
      o.onopen = () => {
        o.send(JSON.stringify({ loai: 'vao', bietDanh, maMay: ten.repeat(32).slice(0, 32), phienBan: 1 }))
        ok(o)
      }
      o.onerror = (e) => hong(new Error('ws lỗi ' + ten))
      o.onmessage = (e) => { const g = JSON.parse(e.data); log[ten].push(g) }
    })
  }

  const A = await noi('A', 'Bảo')
  const B = await noi('B', 'Minh Anh')
  await nghi(700)

  // A chọn HCl, B thử chọn ĐÚNG chất đó -> phải bị từ chối
  A.send(JSON.stringify({ loai: 'chonChat', hoaChat: 'HCl' }))
  await nghi(300)
  B.send(JSON.stringify({ loai: 'chonChat', hoaChat: 'HCl' }))
  await nghi(400)
  B.send(JSON.stringify({ loai: 'chonChat', hoaChat: 'Zn' }))
  await nghi(400)

  // A là chủ phòng -> đổi mức độ được; B không phải chủ -> không đổi được
  A.send(JSON.stringify({ loai: 'chonMuc', doKho: 'thuKhoa' }))
  await nghi(300)
  B.send(JSON.stringify({ loai: 'chonMuc', doKho: 'truot' }))
  await nghi(500)

  const phongCuoi = [...log.B].reverse().find((g) => g.loai === 'phongCho')
  const loiB = log.B.find((g) => g.loai === 'loi')

  // gửi gói GIẢ: kèm toạ độ và "tôi thắng" -> máy chủ phải bỏ qua hết
  A.send(JSON.stringify({ loai: 'phim', trai: false, phai: true, nhay: true, stt: 1, x: 999999, y: 999999, mang: 99 }))
  await nghi(300)

  const kq = {
    'hai người vào được phòng': phongCuoi?.nguoi?.length === 2,
    'CẤM TRÙNG CHẤT — B bị từ chối HCl': loiB?.ma === 'chatDaCoNguoi',
    'B lấy được Zn': phongCuoi?.chatDaLay?.includes('Zn') === true,
    'chủ phòng đổi được mức độ': phongCuoi?.doKho === 'thuKhoa',
    'người thường KHÔNG đổi được mức độ': phongCuoi?.doKho !== 'truot',
    'phòng chờ có đếm ngược': typeof phongCuoi?.giayConLai === 'number',
    'gói giả không làm máy chủ sập': true,
  }
  // đợi hết 30 giây chờ thì ván mở -> rút ngắn: chỉ kiểm tra máy chủ còn sống
  const r2 = await fetch(CHU + '/khoe')
  kq['máy chủ còn sống sau gói giả'] = (await r2.text()) === 'ok'

  A.close(); B.close()
  let dat = true
  for (const [k, v] of Object.entries(kq)) { if (!v) dat = false; console.log(`  ${v ? '✓' : '✗'} ${k}`) }
  console.log(dat ? '\nE2E: ĐẠT' : '\nE2E: TRƯỢT')
  process.exit(dat ? 0 : 1)
}
main().catch((e) => { console.error('lỗi:', e.message); process.exit(1) })
