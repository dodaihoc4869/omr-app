// CHẠY THỬ BẢN THẬT của trò «Sinh Tồn» ngoài app (không cần đăng nhập, không cần máy chủ): gắn TroSinhTon.tsx thật với lớp kênh lớp THẬT của máy chủ
// (server/src/kenh-lop-may.ts) chạy ngay trong trình duyệt ⇒ máy bù chỗ, lượt hạ, hộp tiếp tế đều do đúng mã phát hành tính.
// Mở: npx vite rồi vào /docs/ban-ve-sinh-ton-1211/that/ — tham số: ?xem=1 (máy thầy) · ?ban=3 (số bạn giả tự chạy) · ?yeu=1 (máy yếu).
import { createRoot } from 'react-dom/client'
import '../../../src/styles/tokens.css'
import TroSinhTon from '../../../src/components/live-khoi/TroSinhTon'
import { KenhLopMay } from '../../../server/src/kenh-lop-may'
import { MAU_XANH_THAN } from '../../../src/lib/live-khoi/mau'
import type { KenhLop, NguoiLop, TinLop } from '../../../src/lib/live-khoi/kieu'
import { chonMucTieu, docDong, satThuong, taoBanDo, taoToi, buocToi, nhanDon, dangChet, type NhanVat } from '../../../src/lib/live-khoi/sinh-ton-loi'

const Q = new URLSearchParams(location.search)
const xem = Q.get('xem') === '1', soBan = Math.max(0, Math.min(110, Number(Q.get('ban') ?? 3)))
const TEN = ['Nguyễn Thị Hà', 'Đỗ Hoàng Nam', 'Lê Gia Huy', 'Ngô Gia Bảo', 'Bùi Đức Anh', 'Trần Minh Anh', 'Phạm Khánh Vy', 'Vũ Ngọc Lan']
const ds: NguoiLop[] = Array.from({ length: soBan + 1 }, (_, i) => ({ sbd: `S${i}`, ten: TEN[i % TEN.length], doi: i % 4 }))
const st = { ketThuc: false, live: { khoi: { k: 12, gd: 'cho', che: 'hoc' } }, ds: ds.map((e) => ({ ...e, vao: true, kj: 0 })), doiThuong: [0, 0, 0, 0] }

// ── Phòng giả: một «ổ cắm» cho máy em, tin phòng phát xuống chuyển thẳng cho người nghe ──
const nghe = new Set<(t: TinLop) => void>()
let anhMoi: Record<string, NhanVat> = {}
const o = { send(d: string) { const j = JSON.parse(d) as TinLop & { t: string }; if (j.t !== 'lop' || j.k !== 'tro') return; const x = j.x as { ds: Record<string, never> }; anhMoi = {}; for (const id in x.ds) { const n = docDong(id, x.ds[id]); if (n) anhMoi[id] = n } for (const f of nghe) f(j) } }
const phong = new KenhLopMay({ getWebSockets: (the?: string) => (the === 'gv' ? [] : [o]) } as never, () => st as never)
const gui = (sbd: string, x: unknown): void => { phong.tin(o as never, { v: 'hs', s: sbd } as never, { t: 'lop', k: 'tro', x } as never, st as never, Date.now()) }
const kenh: KenhLop = { gui: (k, x) => { if (k === 'tro' && !xem) gui('S0', x) }, nghe: (k, f) => { if (k !== 'tro') return () => {}; nghe.add(f); return () => { nghe.delete(f) } } }

// ── Bạn giả: chạy lung tung quanh giữa sân, súng tự bắn, bị bắn thì mất máu (cùng lõi luật với máy em thật) ──
const bd = taoBanDo(0)
const ban = ds.slice(xem ? 0 : 1).map((e, i) => ({ e, tt: taoToi(bd, e.doi, Date.now(), i / 7), dx: 0, dy: 0, doiHuong: 0 }))
setInterval(() => {
  const nay = Date.now()
  for (const b of ban) {
    if (nay > b.doiHuong) { const g = Math.atan2(500 - b.tt.y + (Math.random() - 0.5) * 700, 800 - b.tt.x + (Math.random() - 0.5) * 1100); b.dx = Math.cos(g); b.dy = Math.sin(g); b.doiHuong = nay + 1500 + Math.random() * 2500 }
    const khac = Object.values(anhMoi).filter((n) => n.id !== b.e.sbd)
    const don = satThuong({ id: b.e.sbd, x: b.tt.x, y: b.tt.y, doi: b.e.doi }, khac, 0.25), song = !dangChet(b.tt, nay)
    b.tt = nhanDon(b.tt, don.tong, nay)
    for (let k = 0; k < 5; k++) b.tt = buocToi(bd, b.tt, { dx: b.dx, dy: b.dy }, 50, nay)
    const chet = dangChet(b.tt, nay)
    gui(b.e.sbd, { p: [b.tt.x, b.tt.y, chet ? 0 : Math.max(1, b.tt.mau), b.tt.cap], t: chet ? '' : chonMucTieu(bd, { x: b.tt.x, y: b.tt.y, doi: b.e.doi }, khac), ...(song && chet && don.ai ? { a: don.ai } : {}) })
  }
}, 250)

createRoot(document.getElementById('goc')!).render(
  <div style={{ position: 'absolute', inset: 0, fontFamily: 'system-ui, sans-serif', ...(MAU_XANH_THAN as Record<string, string>) }}>
    <TroSinhTon toi={xem ? null : ds[0]} ds={ds} kenh={kenh} soEm={ds.length} xemThoi={xem} mayYeu={Q.get('yeu') === '1'} />
  </div>,
)
