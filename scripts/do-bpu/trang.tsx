// TRANG ĐO TỐC ĐỘ BÌNH PHẢN ỨNG: component THẬT + phòng GIẢ (luật phòng thật src/lib/bpu/phong.ts, WebSocket giả). Không dữ liệu thật.
// ?man=bang  — bảng chiếu, lớp `n` em (mặc định 30), `window.__dua(k, gian)` cho k em gửi dồn (mỗi tin cách `gian` ms).
// ?man=em    — máy em S0: bấm đáp án ⇒ phòng giả trả view mới sau 20 ms.
import { createRoot } from 'react-dom/client'
import { createElement as h } from 'react'
import '@fontsource/be-vietnam-pro/vietnamese-400.css'
import '@fontsource/be-vietnam-pro/vietnamese-600.css'
import '@fontsource/be-vietnam-pro/vietnamese-700.css'
import '@fontsource/be-vietnam-pro/latin-400.css'
import '@fontsource/be-vietnam-pro/latin-600.css'
import '@fontsource/be-vietnam-pro/latin-700.css'
import '../../src/components/m3/m3-tuong-thich.css'
import '../../src/components/bang-nhiem-vu/m3-theme.css'
import '../../src/components/m3/m3.css'
import '../../src/styles/tokens.css'
import '../../src/styles/thang.css'
import '../../src/index.css'
import '../../src/styles/may-yeu.css'
import '../../src/components/bat-linh/bat-linh.css'
import '../../src/components/bat-linh/hoc-sinh.css'
import '../../src/styles/giao-dien-day-du.css'
import { moLuot, nhanTra, taoPhong, vaoLop, viewBang, viewEm } from '../../src/lib/bpu/phong'

const q = new URLSearchParams(location.search)
const man = q.get('man') ?? 'bang'
const N = Number(q.get('n') ?? 30)
const T0 = Date.now()
const TEN = ['Nguyễn Minh Anh', 'Trần Gia Bảo', 'Lê Hoàng Nam', 'Phạm Thu Hà', 'Đỗ Quang Huy', 'Vũ Ngọc Lan', 'Bùi Đức Anh', 'Hoàng Mai Chi', 'Ngô Thanh Tùng', 'Đặng Khánh Linh']
const ds = Array.from({ length: N }, (_, i) => ({ sbd: `S${i}`, ten: `${TEN[i % 10]}${i >= 10 ? ' ' + Math.floor(i / 10) : ''}`, coMat: true, luc: T0 + i }))
const st = taoPhong({ buoiId: 'b1', lop: '12A1', nay: T0, ds })
for (const e of ds) vaoLop(st, e.sbd, T0)
const cau = { qid: 'q1', phan: 'I' as const, tuLuan: false, cau: { qid: 'q1', maDe: 'm', phan: 'I', text: 'Chất nào sau đây là amine bậc hai?', choices: ['CH3NH2', 'CH3NHCH3', '(CH3)3N', 'C6H5NH2'], ideas: [], hinhAnh: [], kienThuc: [] }, dung: 'B', hanGiay: null }
moLuot(st, cau, T0)

class WsGia {
  static ds: WsGia[] = []
  readyState = 1; onopen?: () => void; onmessage?: (e: { data: string }) => void; onclose?: () => void; onerror?: () => void; gui: string[] = []
  constructor(public url: string) { WsGia.ds.push(this); setTimeout(() => this.onopen?.(), 0) }
  send(d: string) {
    this.gui.push(d)
    if (man !== 'em') return
    try { const j = JSON.parse(d) as { t: string; chon?: string }; if (j.t === 'tra' && j.chon) { nhanTra(st, 'S0', j.chon, Date.now()); setTimeout(() => this.day(), 20) } } catch { /* ping */ }
  }
  close() { /* giả */ }
  day() { this.onmessage?.({ data: JSON.stringify(man === 'em' ? viewEm(st, 'S0') : viewBang(st, (a: string, b: string) => a === b)) }) }
}
;(window as unknown as { WebSocket: unknown }).WebSocket = WsGia
window.fetch = (async () => new Response(JSON.stringify({ ok: true, ve: 've-gia', buoiId: 'b1' }))) as typeof fetch
const W = window as unknown as Record<string, unknown>
W.__day = () => WsGia.ds[0]?.day()
/** k em gửi dồn: mỗi em một lần `nhanTra` + một tin `bang` cách `gian` ms (như phòng thật: mỗi lần nộp là một lần phát). */
W.__dua = (k: number, gian: number) => new Promise<void>((xong) => {
  // ?nhip=120 mô phỏng NHỊP PHÁT của máy chủ sau tối ưu (tin đầu đi ngay, tin kế trong nhịp gom thành một lần phát cuối); mặc định 0 = mỗi bài nộp một tin (bản trước).
  const nhip = Number(q.get('nhip') ?? 0); let luc = -1e9, hen: ReturnType<typeof setTimeout> | null = null
  const phat = () => { luc = performance.now(); if (hen) { clearTimeout(hen); hen = null } WsGia.ds[0]?.day() }
  const day = () => { const cho = nhip - (performance.now() - luc); if (nhip <= 0 || cho <= 0) phat(); else if (!hen) hen = setTimeout(() => { hen = null; phat() }, cho) }
  let i = 0
  const buoc = () => { if (i >= k) { setTimeout(xong, nhip + 20); return } nhanTra(st, `S${i}`, ['A', 'B', 'C', 'D'][i % 4]!, Date.now()); day(); i++; setTimeout(buoc, gian) }
  buoc()
})

const root = createRoot(document.getElementById('root')!)
if (q.get('yeu') === '1') document.documentElement.classList.add('may-yeu')
if (man === 'bang') {
  void import('../../src/components/bpu/BangBinhPhanUng').then((m) => root.render(h(m.default, { buoiId: 'b1', onDong: () => {}, qid: 'q1', luot: 1, tuDong: false } as never)))
} else {
  void import('../../src/components/bpu/ManBinhPhanUng').then((m) => root.render(h(m.default, { token: 'tok', buoiId: 'b1', onDong: () => {} })))
}
