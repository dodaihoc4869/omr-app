// CHẠY THỬ BẢN THẬT của trò «Sinh Tồn» ngoài app (không cần đăng nhập, không cần máy chủ): gắn TroSinhTon.tsx thật với lớp kênh lớp THẬT của máy chủ
// (server/src/kenh-lop-may.ts) chạy ngay trong trình duyệt ⇒ máy bù chỗ, lượt hạ, hộp tiếp tế đều do đúng mã phát hành tính.
// Mở: npx vite rồi vào /docs/ban-ve-sinh-ton-1211/that/ — tham số: ?xem=1 (máy thầy, có nút «Thầy vào trận») · ?ban=3 (số bạn giả tự chạy) · ?yeu=1 (máy yếu)
//   · ?thay=1 (đợt 3: một bé ma Thầy GIẢ chạy trong sân — gói đi qua kết nối vai `gv` như máy thầy thật) · ?giay=65 (tua đồng hồ tới giây 65 của ván ⇒ Ma Mực trồi ngay).
import { createRoot } from 'react-dom/client'
import '../../../src/styles/tokens.css'
import TroSinhTon from '../../../src/components/live-khoi/TroSinhTon'
import { KenhLopMay } from '../../../server/src/kenh-lop-may'
import { MAU_XANH_THAN } from '../../../src/lib/live-khoi/mau'
import type { KenhLop, NguoiLop, TinLop } from '../../../src/lib/live-khoi/kieu'
import { DOI_THAY, VAN_MS, chonMucTieu, docDong, nvBoss, satThuong, taoBanDo, taoToi, buocToi, nhanDon, dangChet, type NhanVat } from '../../../src/lib/live-khoi/sinh-ton-loi'

const Q = new URLSearchParams(location.search)
// ?giay=65: lệch đồng hồ cả trang (phòng giả + màn cùng đọc Date.now) để ván đang ở giây đó.
const giay = Number(Q.get('giay'))
if (giay > 0) { const goc = Date.now.bind(Date), t = goc(), lechT = (((giay * 1000 - (t % VAN_MS)) % VAN_MS) + VAN_MS) % VAN_MS; Date.now = () => goc() + lechT }
const xem = Q.get('xem') === '1', soBan = Math.max(0, Math.min(110, Number(Q.get('ban') ?? 3)))
const TEN = ['Nguyễn Thị Hà', 'Đỗ Hoàng Nam', 'Lê Gia Huy', 'Ngô Gia Bảo', 'Bùi Đức Anh', 'Trần Minh Anh', 'Phạm Khánh Vy', 'Vũ Ngọc Lan']
const ds: NguoiLop[] = Array.from({ length: soBan + 1 }, (_, i) => ({ sbd: `S${i}`, ten: TEN[i % TEN.length], doi: i % 4 }))
const st = { ketThuc: false, live: { khoi: { k: 12, gd: 'cho', che: 'hoc' } }, ds: ds.map((e) => ({ ...e, vao: true, kj: 0 })), doiThuong: [0, 0, 0, 0] }

// ── Phòng giả: mỗi bạn giả một «ổ cắm» riêng (phòng «chỉ gửi gần» nhận ra người nhận theo ổ cắm). Ổ của em (S0) chuyển ảnh LỌC cho màn; ổ «máy thầy» luôn
//    nhận ảnh ĐỦ để bạn giả ngắm / tính sát thương như thật, và ở ?xem=1 chuyển ảnh đủ đó cho màn. ──
const nghe = new Set<(t: TinLop) => void>()
let anhMoi: Record<string, NhanVat> = {}
let bossMoi: NhanVat | null = null
const phat = (d: string) => { const j = JSON.parse(d) as TinLop & { t: string }; if (j.t === 'lop' && j.k === 'tro') for (const f of nghe) f(j) }
const oEm = { send(d: string) { if (!xem) phat(d) } }
const oThay = {
  send(d: string) {
    const j = JSON.parse(d) as TinLop & { t: string }
    if (j.t !== 'lop' || j.k !== 'tro') return
    const x = j.x as { ds: Record<string, never>; bx?: unknown }
    anhMoi = {}; for (const id in x.ds) { const n = docDong(id, x.ds[id]); if (n) anhMoi[id] = n }
    bossMoi = nvBoss(x.bx)
    if (xem) phat(d)
  },
}
const phong = new KenhLopMay({ getWebSockets: (the?: string) => (the === 'gv' ? [oThay] : xem ? [] : [oEm]) } as never, () => st as never)
const gui = (o: unknown, sbd: string, x: unknown): void => { phong.tin(o as never, { v: 'hs', s: sbd } as never, { t: 'lop', k: 'tro', x } as never, st as never, Date.now()) }
const kenh: KenhLop = { gui: (k, x) => { if (k === 'tro') { if (!xem) gui(oEm, 'S0', x); else phong.tin(oThay as never, { v: 'gv' } as never, { t: 'lop', k: 'tro', x } as never, st as never, Date.now()) } }, nghe: (k, f) => { if (k !== 'tro') return () => {}; nghe.add(f); return () => { nghe.delete(f) } } }

// ── Bạn giả: chạy lung tung quanh giữa sân, súng tự bắn, bị bắn thì mất máu (cùng lõi luật với máy em thật) ──
const bd = taoBanDo(0)
const ban = ds.slice(xem ? 0 : 1).map((e, i) => ({ e, o: { send() {} }, tt: taoToi(bd, e.doi, Date.now(), i / 7), dx: 0, dy: 0, doiHuong: 0, thay: false }))
// Bé ma Thầy giả (?thay=1, chỉ ở màn em — máy thầy thì bấm nút): gửi qua kết nối vai `gv`, đúng đường máy thầy thật.
if (Q.get('thay') === '1' && !xem) ban.push({ e: { sbd: 'THAY', ten: 'Thầy', doi: DOI_THAY }, o: { send() {} }, tt: taoToi(bd, DOI_THAY, Date.now(), 0.37), dx: 0, dy: 0, doiHuong: 0, thay: true })
setInterval(() => {
  const nay = Date.now()
  for (const b of ban) {
    if (nay > b.doiHuong) { const g = Math.atan2(500 - b.tt.y + (Math.random() - 0.5) * 700, 800 - b.tt.x + (Math.random() - 0.5) * 1100); b.dx = Math.cos(g); b.dy = Math.sin(g); b.doiHuong = nay + 1500 + Math.random() * 2500 }
    const khac = Object.values(anhMoi).filter((n) => n.id !== b.e.sbd)
    if (bossMoi) khac.push(bossMoi)
    const don = satThuong({ id: b.e.sbd, x: b.tt.x, y: b.tt.y, doi: b.e.doi }, khac, 0.25), song = !dangChet(b.tt, nay)
    b.tt = nhanDon(b.tt, don.tong, nay)
    for (let k = 0; k < 5; k++) b.tt = buocToi(bd, b.tt, { dx: b.dx, dy: b.dy }, 50, nay)
    const chet = dangChet(b.tt, nay)
    // Thỉnh thoảng gửi biểu cảm (phòng nhận 1 lần / 2 giây) ⇒ trang chạy thử thấy bong bóng biểu cảm.
    const goi = { p: [b.tt.x, b.tt.y, chet ? 0 : Math.max(1, b.tt.mau), b.tt.cap], t: chet ? '' : chonMucTieu(bd, { x: b.tt.x, y: b.tt.y, doi: b.e.doi }, khac), ...(song && chet && don.ai ? { a: don.ai } : {}), ...(!b.thay && Math.random() < 0.025 ? { e: Math.floor(Math.random() * 4) } : {}) }
    if (b.thay) phong.tin(b.o as never, { v: 'gv' } as never, { t: 'lop', k: 'tro', x: goi } as never, st as never, nay)
    else gui(b.o, b.e.sbd, goi)
  }
}, 250)

createRoot(document.getElementById('goc')!).render(
  <div style={{ position: 'absolute', inset: 0, fontFamily: 'system-ui, sans-serif', ...(MAU_XANH_THAN as Record<string, string>) }}>
    <TroSinhTon toi={xem ? null : ds[0]} ds={ds} kenh={kenh} soEm={ds.length} xemThoi={xem} thayVao={xem} mayYeu={Q.get('yeu') === '1'} />
  </div>,
)
