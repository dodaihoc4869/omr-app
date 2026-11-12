// CHẠY THỬ BẢN THẬT phòng chờ CA KIỂM TRA có trò «Sinh Tồn bốn đội» ngoài app (không đăng nhập, KHÔNG chạm máy chủ): gắn PhongChoGame.tsx thật, thay
// `WebSocket` của trang bằng ổ cắm giả nối thẳng vào lớp phòng THẬT của máy chủ (server/src/sinh-ton-ca.ts) chạy ngay trong trình duyệt ⇒ xếp đội, máy bù chỗ,
// lượt hạ, mã đóng 4000 đều do đúng mã phát hành tính. Mở: npx vite rồi vào /docs/ban-ve-sinh-ton-ca-1311/that/
// Tham số: ?ban=5 (số bạn giả tự chạy) · ?toi=1 (nền tối) · ?batdau=6 (sau 6 giây «thầy bấm Bắt đầu»: phòng đóng mã 4000) · ?tat=1 (ca không phát vé).
import { createRoot } from 'react-dom/client'
import '../../../src/styles/tokens.css'
import '../../../src/styles/trong.css'
import '../../../src/styles/trong-hs-mau.css'
import PhongChoGame from '../../../src/components/PhongChoGame'
import { PhongSinhTonCa } from '../../../server/src/sinh-ton-ca'
import type { KetNoi } from '../../../server/src/dau-ion-phong'
import type { SinhTonAnh } from '../../../src/lib/live-khoi/kieu'
import { buocToi, chonMucTieu, dangChet, docDong, nhanDon, satThuong, taoBanDo, taoToi, type NhanVat } from '../../../src/lib/live-khoi/sinh-ton-loi'

const Q = new URLSearchParams(location.search)
const soBan = Math.max(0, Math.min(40, Number(Q.get('ban') ?? 5)))
document.documentElement.dataset.trong = 'hs'
document.documentElement.setAttribute('data-giao-dien', Q.get('toi') === '1' ? 'toi' : 'sang')
const HAN = Date.now() + 3_600_000
const TEN = ['Khánh Ngọc', 'Hoàng Nam', 'Gia Huy', 'Gia Bảo', 'Đức Anh', 'Minh Anh', 'Khánh Vy', 'Ngọc Lan']

const phong = new PhongSinhTonCa()
setInterval(() => phong.nhip(), 250)
const dem = { mo: 0, dong4000: 0 }
Object.assign(window, { __stCa: { phong, dem } })

// ── Ổ cắm giả cho máy em: đúng những gì lớp MangDau dùng (onopen / onmessage / onclose / send / close / readyState) ──
class WsGia {
  readyState = 0; binaryType = ''
  onopen: (() => void) | null = null; onmessage: ((e: { data: unknown }) => void) | null = null; onclose: ((e: { code: number; reason: string }) => void) | null = null; onerror: (() => void) | null = null
  private kn: KetNoi = {
    gui: (d) => { if (this.readyState === 1) this.onmessage?.({ data: d }) },
    dong: (ma, ly) => { if (ma === 4000) dem.dong4000++; this.readyState = 3; setTimeout(() => this.onclose?.({ code: ma, reason: ly }), 0) },
    ghiKem: () => {},
  }
  constructor(readonly url: string) { dem.mo++; setTimeout(() => { this.readyState = 1; this.onopen?.() }, 40) }
  send(d: unknown) {
    if (typeof d !== 'string') return
    const j = JSON.parse(d) as { t?: string }
    if (j.t === 'vao') phong.vao(this.kn, { c: '123456', s: 'S0', t: TEN[0], h: HAN })
    else phong.nhan(this.kn, d)
  }
  close() { this.readyState = 3; phong.roi(this.kn) }
}
Object.assign(window, { WebSocket: WsGia })

// ── Bạn giả: vào phòng bằng vé như em thật, chạy lung tung quanh giữa sân, súng tự bắn (cùng lõi luật với máy em thật) ──
const bd = taoBanDo(0)
let anhMoi: Record<string, NhanVat> = {}
const ban = Array.from({ length: soBan }, (_, i) => {
  const sbd = `S${i + 1}`
  const b = { sbd, doi: 0, tt: taoToi(bd, 0, Date.now(), i / 7), dx: 0, dy: 0, doiHuong: 0, kn: null as unknown as KetNoi }
  b.kn = {
    gui: (d) => {
      if (typeof d !== 'string') return
      const j = JSON.parse(d) as { t: string; k?: string; toi?: [string, string, number]; x?: SinhTonAnh }
      if (j.t === 'st-vao' && j.toi) { b.doi = j.toi[2]; b.tt = taoToi(bd, b.doi, Date.now(), i / 7) }
      else if (i === 0 && j.t === 'lop' && j.k === 'tro' && j.x) { anhMoi = {}; for (const id in j.x.ds) { const n = docDong(id, j.x.ds[id]); if (n) anhMoi[id] = n } }
    },
    dong: () => {}, ghiKem: () => {},
  }
  phong.vao(b.kn, { c: '123456', s: sbd, t: TEN[(i + 1) % TEN.length], h: HAN })
  return b
})
setInterval(() => {
  const nay = Date.now()
  for (const b of ban) {
    if (nay > b.doiHuong) { const g = Math.atan2(500 - b.tt.y + (Math.random() - 0.5) * 700, 800 - b.tt.x + (Math.random() - 0.5) * 1100); b.dx = Math.cos(g); b.dy = Math.sin(g); b.doiHuong = nay + 1500 + Math.random() * 2000 }
    const khac = Object.values(anhMoi).filter((n) => n.id !== b.sbd)
    const don = satThuong({ id: b.sbd, x: b.tt.x, y: b.tt.y, doi: b.doi }, khac, 0.25), song = !dangChet(b.tt, nay)
    b.tt = nhanDon(b.tt, don.tong, nay)
    for (let k = 0; k < 5; k++) b.tt = buocToi(bd, b.tt, { dx: b.dx, dy: b.dy }, 50, nay)
    const chet = dangChet(b.tt, nay)
    phong.nhan(b.kn, JSON.stringify({ t: 'st', x: { p: [Math.round(b.tt.x), Math.round(b.tt.y), chet ? 0 : Math.max(1, Math.round(b.tt.mau)), b.tt.cap], t: chet ? '' : chonMucTieu(bd, { x: b.tt.x, y: b.tt.y, doi: b.doi }, khac), ...(song && chet && don.ai ? { a: don.ai } : {}) } }))
  }
}, 250)

// Trang: phòng chờ thật + ô đếm số lần màn cha được gọi «vào bài». Trạng thái giữ ngoài React, vẽ lại bằng root.render.
const goc = createRoot(document.getElementById('goc')!)
let batDau = false, vaoBai = 0
function ve(): void {
  goc.render(<>
    <PhongChoGame cho={{ tenCa: 'Kiểm tra Ancol – Phenol', lop: '11A2', thoiGianPhut: 45, ...(Q.get('tat') === '1' ? {} : { maCa: '123456', veDau: 've-thu' }), batDau }} onBatDau={() => { vaoBai++; ve() }} />
    <output id="vao-bai" hidden>{vaoBai}</output>
  </>)
}
ve()
// «Thầy bấm Bắt đầu»: phòng đóng mọi kết nối mã 4000 (đường nhanh); màn cha thật còn thấy `batDau` qua nhịp hỏi phòng chờ (đường chậm, ở đây +1,5 giây).
const giayBatDau = Number(Q.get('batdau'))
if (giayBatDau > 0) setTimeout(() => { phong.dongTatCa('bat-dau'); setTimeout(() => { batDau = true; ve() }, 1500) }, giayBatDau * 1000)
