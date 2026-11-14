// VIDEO BÀI GIẢNG — NÉT CÓ GIỜ TỪNG ĐIỂM (thầy 14/11 «nét bút bị giật … làm thật mượt như live»). `trang.json` của nhật ký mất giờ từng điểm (mỗi lần Thầy
// đổi Học ⇄ Bảng, phòng live gửi lại cả trang nét với giờ 0 ⇒ nét bung ra một lần). Tệp này dựng lại từ `net.bin` bằng ĐÚNG bộ giải của trình phát Xem lại
// Live: lấy lần ĐẦU mỗi nét xuất hiện (giờ thật từng điểm, `raiGio` rải các điểm trùng giờ), chỉ các nét còn trên trang bảng đen lúc cuối.
// Dùng: npx jiti scripts/video-bai-giang/net-co-gio.ts <thư mục tư liệu có net.bin + buoi.json> ⇒ <thư mục>/net-gio.json
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { docNetBin } from '../../src/lib/live/xem-lai-kieu'
import { giaiMuc } from '../../src/screens/live-xem-lai/hs/may-phat'
import { tachTrang } from '../../src/lib/nhat-ky/trang-bang'

const thuMuc = process.argv[2]
if (!thuMuc) { console.error('dùng: npx jiti net-co-gio.ts <thư mục tư liệu>'); process.exit(1) }
const bin = new Uint8Array(readFileSync(join(thuMuc, 'net.bin')))
const buoi = JSON.parse(readFileSync(join(thuMuc, 'buoi.json'), 'utf8')) as { msLive: number }
const trang = tachTrang(bin, buoi.msLive).filter((t) => t.loai === 'bang').sort((a, b) => b.net.length - a.net.length)[0]
if (!trang) throw new Error('không có trang bảng đen')
const lanDau = new Map<string, { t: number; diem: number[][]; gio?: number[] }>()
for (const m of giaiMuc(docNetBin(bin).muc)) if (m.k === 'net' && !lanDau.has(m.net.id) && m.net.diem.length) lanDau.set(m.net.id, { t: m.t, diem: m.net.diem, gio: m.gio })
const tron = (x: number, k: number): number => Math.round(x * k) / k
const net = []
let thieu = 0
for (const n of trang.net) {
  if (n.net.cong === 'tay' || !n.net.diem.length) continue
  const g = lanDau.get(n.net.id)
  const diem = g ? g.diem : n.net.diem, gio = g?.gio
  if (!g) thieu++
  const d: number[] = []
  diem.forEach((p, i) => d.push(tron(p[0], 1e5), tron(p[1], 1e5), tron(p[2], 100), Math.max(0, Math.round(gio ? gio[i]! : p[3]))))
  net.push({ t: Math.round(g ? g.t : n.t0), mau: n.net.mau, co: tron(n.net.co, 100), d })
}
net.sort((a, b) => a.t - b.t)
writeFileSync(join(thuMuc, 'net-gio.json'), JSON.stringify({ v: 2, tiLe: trang.tiLe, rong: 1600, net }))
const coGio = net.filter((n) => n.d.length > 4 && n.d[n.d.length - 1]! > 0).length
console.log(`trang bảng: ${net.length} nét · ${coGio} nét có giờ từng điểm · ${thieu} nét không tìm được bản gốc · tỉ lệ ${trang.tiLe}`)
