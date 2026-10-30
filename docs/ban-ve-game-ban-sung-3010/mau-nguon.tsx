// NGUỒN CỦA mau.html — bản vẽ chạy được của «Đấu Nguyên Tử»: dựng ĐÚNG thành phần thật (PhongChoGame + DauIon) và luật phòng đấu thật
// (server/src/dau-ion-phong.ts) ngay trong trang; WebSocket được thay bằng ống nối nội bộ, «bạn mẫu» do máy điều khiển. Dữ liệu GIẢ.
// Dựng lại: `node docs/ban-ve-game-ban-sung-3010/dung-mau.mjs`. Tham số: ?giao-dien=toi (nền tối).
import '@fontsource/be-vietnam-pro/latin-400.css'
import '@fontsource/be-vietnam-pro/latin-600.css'
import '@fontsource/be-vietnam-pro/latin-700.css'
import '@fontsource/be-vietnam-pro/vietnamese-400.css'
import '@fontsource/be-vietnam-pro/vietnamese-600.css'
import '@fontsource/be-vietnam-pro/vietnamese-700.css'
import '../../src/styles/tokens.css'
import { createRoot } from 'react-dom/client'
import PhongChoGame from '../../src/components/PhongChoGame'
import { PhongMau, noiMayEm } from './phong-mau'

const q = new URLSearchParams(location.search)
document.documentElement.setAttribute('data-giao-dien', q.get('giao-dien') === 'toi' ? 'toi' : 'sang')
document.documentElement.style.colorScheme = q.get('giao-dien') === 'toi' ? 'dark' : 'light'

const phong = new PhongMau()
phong.themBan()
phong.chay()
const mau = { emId: 0, phong, thachEm: (i: number) => phong.thachEm(i, mau.emId), botBan: (b: boolean) => { phong.botBan = b } }
;(window as unknown as { __mau: typeof mau }).__mau = mau

class WsMau {
  readyState = 0
  binaryType = 'arraybuffer'
  onopen: (() => void) | null = null
  onmessage: ((e: { data: unknown }) => void) | null = null
  onclose: ((e: { code: number; reason: string }) => void) | null = null
  onerror: (() => void) | null = null
  private may: ReturnType<typeof noiMayEm>
  constructor() {
    this.may = noiMayEm(phong, (d) => {
      if (typeof d === 'string' && d.startsWith('{"t":"chao"')) mau.emId = JSON.parse(d).toi
      setTimeout(() => this.onmessage?.({ data: typeof d === 'string' ? d : d.slice().buffer }), 0)
    }, (ma, ly) => { this.readyState = 3; this.onclose?.({ code: ma, reason: ly }) })
    setTimeout(() => { this.readyState = 1; this.onopen?.() }, 150)
  }
  send(d: string | Uint8Array): void { this.may.nhan(d) }
  close(): void { this.readyState = 3; this.may.dong() }
}
;(window as unknown as { WebSocket: unknown }).WebSocket = WsMau

createRoot(document.getElementById('goc')!).render(
  <PhongChoGame cho={{ tenCa: 'Kiểm tra 45 phút · Ester – Lipid', lop: '12A1', thoiGianPhut: 45, maCa: '123456', veDau: 've-mau' }} />,
)
