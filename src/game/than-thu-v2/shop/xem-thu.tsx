// TRANG XEM THỬ (chỉ dùng khi `npm run dev`, KHÔNG vào bản build): mở /src/game/than-thu-v2/shop/xem-thu.html
// Tham số: ?kb=mac-dinh|du-vang|thieu-vang|het-exp-thua|tu-trong|co-tat|mat-mang|loi-tai  &tre=400 (ms)  &man=cua-hang|thu-do|tu-do  &chao  &pet=2&cap=34&ten=…  &giao-dien=sang|toi
// Máy chủ GIẢ (du-lieu-mau.ts) chạy ngay trong trang; các nút ở đầu trang bật công tắc lỗi. Nhãn nút viết không dấu vì đây là công cụ dev, không phải màn của em.
import { StrictMode, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/be-vietnam-pro/vietnamese-400.css'
import '@fontsource/be-vietnam-pro/vietnamese-600.css'
import '@fontsource/be-vietnam-pro/vietnamese-700.css'
import '@fontsource/be-vietnam-pro/latin-400.css'
import '@fontsource/be-vietnam-pro/latin-600.css'
import '@fontsource/be-vietnam-pro/latin-700.css'
import '../../../styles/tokens.css'
import '../../../index.css'
import '../game.css'
import { KICH_BAN_MAU, ShopApiGia } from './du-lieu-mau'
import type { MaLoiEp } from './du-lieu-mau'
import ManShop from './ManShop'
import type { ManShopMan } from './ManShop'

const q = new URLSearchParams(location.search)
const giaoDien = q.get('giao-dien')
if (giaoDien === 'sang' || giaoDien === 'toi') document.documentElement.setAttribute('data-giao-dien', giaoDien)
const LOI: MaLoiEp[] = ['thieu_vang', 'chua_mo', 'het_suat', 'gia_doi', 'tam_dong', 'da_co', 'duoi_nguong', 'khong_co_mon', 'sap_mo', 'sai_dau_vao']

function Trang() {
  const [kb, setKb] = useState(q.get('kb') ?? 'mac-dinh')
  const [tre, setTre] = useState(Number(q.get('tre') ?? 400))
  const [lan, setLan] = useState(0)
  const [nhat, setNhat] = useState('')
  const api = useMemo(() => new ShopApiGia({ ...(KICH_BAN_MAU[kb] ?? {}), tre }), [kb, tre, lan])
  const cap = (n: string) => () => {
    setNhat(n)
    api.congTac.epLoi = n as MaLoiEp
  }
  const bat = (k: 'matMang' | 'batShop') => () => {
    api.congTac[k] = !api.congTac[k]
    setNhat(`${k}=${api.congTac[k]}`)
  }
  return (
    <section className="spirit-game" style={{ padding: 0, borderRadius: 0 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: 8, fontSize: 12 }}>
        {Object.keys(KICH_BAN_MAU).map((k) => (
          <button key={k} type="button" aria-pressed={k === kb} onClick={() => { setKb(k); setLan((n) => n + 1) }}>{k}</button>
        ))}
        <button type="button" onClick={() => setTre((t) => (t === 0 ? 800 : 0))}>tre={tre}</button>
        <button type="button" onClick={bat('matMang')}>bat/tat mat mang</button>
        <button type="button" onClick={bat('batShop')}>bat/tat co cua hang</button>
        {LOI.map((l) => (
          <button key={l} type="button" onClick={cap(l)}>ep {l}</button>
        ))}
        <output data-nhat>{nhat}</output>
      </div>
      <ManShop
        key={`${kb}-${tre}-${lan}`}
        api={api}
        pet={Number(q.get('pet') ?? 2)}
        cap={Number(q.get('cap') ?? 34)}
        tenThu={q.get('ten') ?? 'Be May'}
        manDau={(q.get('man') as ManShopMan | null) ?? 'cua-hang'}
        chaoLanDau={q.has('chao')}
        onDong={() => setNhat('dong')}
      />
    </section>
  )
}
createRoot(document.getElementById('root')!).render(<StrictMode><Trang /></StrictMode>)
