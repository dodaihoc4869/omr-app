// TRANG CHỤP «ĐỀ BÌNH PHẢN ỨNG GIỐNG CHẶNG» (thầy 10/11: «Đề hiển thị ko đúng, cho hiển thị đề giống với phần chặng luôn, có giám thị»).
// Component THẬT (ManLamBaiTap · ManBinhPhanUng) + máy chủ GIẢ trong trang (bọc fetch + WebSocket giả chạy đúng lõi phòng `src/lib/bpu/phong.ts`).
// Không yêu cầu nào tới máy chủ thật, không dữ liệu học sinh thật. Thứ tự CSS theo src/main.tsx + cổng học sinh.
//   ?man=chang|bpu  &cau=ds|tn|tln|ds-ve  [&yeu=1 máy yếu] [&chu=130 cỡ chữ %] [&ve=1 câu có cảnh «hình vẽ lại»]
//   Trang BPU: window.__bpu.mo() = thầy mở đáp án · window.__bpu.gui() = gửi lại viewEm.
//   npx vite build --config scripts/chup-bpu-de-chang-1011/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/chup-bpu-de-chang-1011/chup.mjs <thư mục tạm> docs/ban-ve-bpu-1011 [truoc|sau]
import './bat-trong'
import './../../src/components/m3/m3-tuong-thich.css'
import './../../src/components/bang-nhiem-vu/m3-theme.css'
import './../../src/components/m3/m3.css'
import './../../src/components/loi-giai/loi-giai.css'
import './../../src/components/o-so-tra-loi.css'
import './../../src/components/m3/khung-xem-phieu.css'
import '@fontsource/noto-serif/latin-400.css'
import '@fontsource/noto-serif/vietnamese-400.css'
import '@fontsource/be-vietnam-pro/latin-400.css'
import '@fontsource/be-vietnam-pro/latin-600.css'
import '@fontsource/be-vietnam-pro/latin-700.css'
import '@fontsource/be-vietnam-pro/vietnamese-400.css'
import '@fontsource/be-vietnam-pro/vietnamese-600.css'
import '@fontsource/be-vietnam-pro/vietnamese-700.css'
import './../../src/styles/tokens.css'
import './../../src/styles/thang.css'
import './../../src/index.css'
import './../../src/styles/the-loc.css'
import './../../src/styles/may-yeu.css'
import './../../src/components/exp-cau/exp-cau.css'
import './../../src/components/bat-linh/bat-linh.css'
import './../../src/components/bat-linh/hoc-sinh.css'
import './../../src/components/bat-linh/che-do-toi.css'
import './../../src/styles/giao-dien-day-du.css'
import './../../src/components/logo-ddh.css'
import './../../src/components/m3/phieu-screen.css'
import './../../src/styles/trong.css'
import './../../src/components/m3/the-cau.css'
import './../../src/components/bang-nhiem-vu/sheet-m3.css'
import './../../src/components/hoc-tap/hoc-tap.css'
import './../../src/styles/trong-hs.css'
import './../../src/styles/trong-hs-ngang.css'
import './../../src/styles/trong-kinh.css'
import './../../src/styles/bong-mol.css'
import './../../src/styles/bo-cuc-hn.css'
import './../../src/styles/khong-xuong-hs.css'
import { createElement as h } from 'react'
import { createRoot } from 'react-dom/client'
import ManLamBaiTap from '../../src/components/hoc-tap/ManLamBaiTap'
import ManBinhPhanUng from '../../src/components/bpu/ManBinhPhanUng'
import { goiLenBang, moDapAn, moLuot, nhanTra, taoPhong, vaoLop, viewEm } from '../../src/lib/bpu/phong'
import { layDiaChiMayChu } from '../../src/lib/dia-chi-may-chu'

const ts = new URLSearchParams(location.search)
const man = ts.get('man') ?? 'bpu'
const loaiCau = ts.get('cau') ?? 'ds'
const noop = () => {}

// Ảnh công thức NỀN TRẮNG như kho (một ảnh `sau_de` chứa cả ba chất (1) (2) (3) — đúng cấu trúc câu DH-12-C3-B9-P2-II-13 trong ảnh thầy gửi).
const anhBaChat = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="860" height="96" viewBox="0 0 860 96"><rect width="860" height="96" fill="white"/>'
  + '<g stroke="black" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">'
  + '<polyline points="14,52 50,30 86,52"/><polyline points="262,40 298,62 334,40 370,62"/><polyline points="540,60 576,40 612,60"/><polyline points="660,52 696,30"/><polyline points="742,30 778,52 814,30"/></g>'
  + '<g font-family="Arial, sans-serif" font-size="22" fill="black"><text x="90" y="60">NH</text><text x="122" y="68" font-size="15">2</text><text x="138" y="62">,</text>'
  + '<text x="196" y="40">HOOC</text><text x="374" y="70">NH</text><text x="406" y="78" font-size="15">2</text><text x="422" y="72">,</text>'
  + '<text x="474" y="70">HOOC</text><text x="616" y="70">N</text><text x="616" y="92">H</text><text x="698" y="30">CO</text><text x="816" y="30">NH</text><text x="846" y="38" font-size="15">2</text></g></svg>')
const anhVong = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="130" viewBox="0 0 320 130"><rect width="320" height="130" fill="white"/><g stroke="black" stroke-width="2" fill="none"><polygon points="50,30 85,10 120,30 120,70 85,90 50,70"/><line x1="120" y1="30" x2="165" y2="10"/><line x1="165" y1="10" x2="205" y2="30"/></g><text x="210" y="40" font-family="sans-serif" font-size="20">NH2</text></svg>')

type CauGia = Record<string, unknown> & { qid: string; phan: 'I' | 'II' | 'III'; dapAn: string }
const nen = { version: '1', group: 'g', maDe: 'DH-12-C3-B9-P2', dang: null, tenDang: 'Hợp chất chứa nitrogen', mucDo: 'van_dung', sao: 0, kienThuc: [], choices: [] as string[], ideas: [] as string[], hinhAnh: [] as unknown[] }
const CAU: Record<string, CauGia> = {
  // Đúng–sai: nguyên văn đề kho — «(1) (2) (3)» là chỗ đứng của ba công thức nằm chung MỘT ảnh `sau_de`.
  ds: { ...nen, qid: 'DH-12-C3-B9-P2-II-14', phan: 'II', dapAn: 'DDDS',
    text: 'Cho một số hợp chất chứa nguyên tố nitrogen như sau: (1) (2) (3) Tính chất hóa học của các hợp chất.',
    hinhAnh: [{ src: anhBaChat, viTri: 'sau_de', alt: 'Công thức cấu tạo ba chất (1), (2), (3)' }],
    ideas: ['Đều có phản ứng với dung dịch HCl, sinh ra muối.', 'Có 1 chất tham gia phản ứng thuỷ phân.', 'Chất số (3) có thể trùng ngưng tạo polypeptide.', 'Cả ba chất đều làm quỳ tím ẩm hoá xanh.'] },
  tn: { ...nen, qid: 'BPU-TN-1', phan: 'I', dapAn: 'B', mucDo: 'hieu',
    text: 'Hợp chất có công thức cấu tạo như hình dưới đây thuộc loại nào và có bậc mấy?',
    hinhAnh: [{ src: anhVong, viTri: 'sau_de', alt: 'Công thức cấu tạo' }],
    choices: ['Amine thơm, bậc một', 'Amine béo (no), bậc một', 'Amine béo (no), bậc hai', 'Amide, bậc một'] },
  tln: { ...nen, qid: 'BPU-TLN-1', phan: 'III', dapAn: '6,48', mucDo: 'van_dung_cao',
    text: 'Cho 4,65 gam aniline tác dụng vừa đủ với dung dịch HCl. Khối lượng muối thu được là bao nhiêu gam? (Làm tròn đến hàng phần trăm.)' },
  // Đề ngắn, không hình: bong bóng thường bên phải giám thị (không chữ L).
  ngan: { ...nen, qid: 'BPU-TN-2', phan: 'I', dapAn: 'B', mucDo: 'biet', text: 'Chất nào sau đây là amine bậc hai?', choices: ['CH3NH2', 'CH3NHCH3', '(CH3)3N', 'C6H5NH2'] },
}
const cau = CAU[loaiCau] ?? CAU.ds!
const congKhai = ({ dapAn, ...q }: CauGia) => (q.phan === 'III' ? { ...q, soO: dapAn.length } : q)

// Cảnh «hình của đề vẽ lại» (`/hs/hinh-ve`): `&ve=1` ⇒ câu có cảnh SVG (ba chất đứng đúng chỗ (1) (2) (3)); mặc định «chưa có» như phần lớn kho.
const CANH_VE = { phienBan: 1, tieuDe: 'Hình minh hoạ', canh: { loai: 'svg', rong: 320, cao: 150, svg:
  '<text x="8" y="30" class="t-chu t-dam" font-size="15">(1)</text><polyline points="44,34 68,20 92,34" class="f-khong s-chu" stroke-width="2"/><text x="96" y="40" class="t-tin" font-size="15">NH2</text>'
  + '<text x="8" y="78" class="t-chu t-dam" font-size="15">(2)</text><text x="44" y="72" class="t-sai" font-size="15">HOOC</text><polyline points="94,70 118,84 142,70 166,84" class="f-khong s-chu" stroke-width="2"/><text x="170" y="90" class="t-tin" font-size="15">NH2</text>'
  + '<text x="8" y="126" class="t-chu t-dam" font-size="15">(3)</text><text x="44" y="126" class="t-sai" font-size="15">HOOC</text><polyline points="94,124 118,110 142,124" class="f-khong s-chu" stroke-width="2"/><text x="146" y="130" class="t-tin" font-size="15">NH</text><polyline points="170,124 194,110" class="f-khong s-chu" stroke-width="2"/><text x="196" y="112" class="t-chu" font-size="15">CO</text><polyline points="222,110 246,124 270,110" class="f-khong s-chu" stroke-width="2"/><text x="272" y="112" class="t-tin" font-size="15">NH2</text>' } }

const tra = (o: unknown) => new Response(JSON.stringify(o), { status: 200, headers: { 'content-type': 'application/json' } })
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  const p = new URL(url, location.href).pathname
  let b: Record<string, unknown> = {}
  try { b = init?.body ? JSON.parse(String(init.body)) : input instanceof Request ? await input.clone().json() : {} } catch { /* bỏ qua */ }
  if (p.endsWith('/game-v2/hoc-tap-start')) return tra({ ok: true, id: 'phien-chup', questions: [congKhai(cau), congKhai(CAU.ngan!)] })
  if (p.endsWith('/hs/hinh-ve')) return tra({ ok: true, ban: ts.get('ve') === '1' ? Object.fromEntries(((b.qids as string[]) ?? []).filter((q) => q === CAU.ds!.qid).map((q) => [q, [CANH_VE]])) : {} })
  if (p.endsWith('/game-v2/answer') || p.endsWith('/hs/nop-luong')) { const dung = String(b.answer ?? '') === cau.dapAn; return tra({ ok: true, correct: dung, answer: cau.dapAn, solution: { chot: 'Lời giải minh hoạ.' }, solutionImages: [] }) }
  if (p.endsWith('/hs/bpu/ve') || p.endsWith('/hs/bpu/cua-em')) return tra({ ok: true, ve: 've-chup', buoiId: 'b1' })
  return tra({ ok: false })
}

// ───────────────────────────── phòng Bình Phản Ứng giả (lõi thật) ─────────────────────────────
const T0 = Date.now()
const st = taoPhong({ buoiId: 'b1', lop: '12A1', nay: T0, ds: [
  { sbd: 'S1', ten: 'Nguyễn Minh Anh', coMat: true, luc: T0 }, { sbd: 'S2', ten: 'Trần Gia Bảo', coMat: true, luc: T0 },
  { sbd: 'S3', ten: 'Lê Thu Hà', coMat: true, luc: T0 }, { sbd: 'S4', ten: 'Phạm Quốc Huy', coMat: true, luc: T0 } ] })
for (const e of st.ds) { vaoLop(st, e.sbd, T0); e.kj = 15 }
const chamSo = (a: string, b: string) => Number(a.replace(',', '.')) === Number(b.replace(',', '.'))
class WsGia {
  static ds: WsGia[] = []
  readyState = 1; onopen?: () => void; onmessage?: (e: { data: string }) => void; onclose?: () => void; onerror?: () => void
  constructor(public url: string) { WsGia.ds.push(this); setTimeout(() => this.onopen?.(), 0) }
  bao() { this.onmessage?.({ data: JSON.stringify(viewEm(st, 'S1')) }) }
  send(d: string) {
    const m = JSON.parse(d) as { t: string; chon?: string }
    if (m.t === 'chao') { if (!st.luot) moLuot(st, { qid: cau.qid, phan: cau.phan, tuLuan: false, cau: congKhai(cau), dung: cau.dapAn, hanGiay: null, giai: { solution: { chot: 'Lời giải minh hoạ.' }, anh: [] } }, Date.now()); setTimeout(() => this.bao(), 0) }
    if (m.t === 'tra') { nhanTra(st, 'S1', String(m.chon ?? ''), Date.now()); setTimeout(() => this.bao(), 30) }
  }
  close() {}
}
if (man === 'bpu') {
  ;(window as unknown as { WebSocket: unknown }).WebSocket = WsGia
  ;(window as unknown as { __bpu: unknown }).__bpu = { goi: () => { goiLenBang(st, 'S2', ['Chưa lên bảng buổi này'], Date.now()); for (const w of WsGia.ds) w.bao() }, mo: () => { moDapAn(st, Date.now(), chamSo); for (const w of WsGia.ds) w.bao() }, gui: () => { for (const w of WsGia.ds) w.bao() } }
}

// Nhớ địa chỉ máy chủ GIẢ trước khi dựng màn (mọi lệnh đều do `fetch` bọc ở trên trả lời) ⇒ lệnh `/hs/hinh-ve` có chỗ gửi. Không dùng `await` cấp mô-đun
// (bộ đóng gói sẽ chia lại mảnh ⇒ thứ tự tờ kiểu lệch so với app thật).
void layDiaChiMayChu('https://may-chu-gia.test').then(() => {
  const goc = createRoot(document.getElementById('root')!)
  if (man === 'chang') goc.render(h('div', { className: 'fixed inset-0 z-50 overflow-y-auto overscroll-contain' }, h(ManLamBaiTap, { token: 'tk', sbd: '12121212', onVe: noop, onCapNhat: noop, onChua: noop, homNay: { daLam: 6, muc: 24, chang: 2, soChang: 4 } })))
  else goc.render(h(ManBinhPhanUng, { token: 'tk', buoiId: 'b1', onDong: noop }))
})
