// TRANG XEM THỬ phụ kiện thần thú (chỉ `npm run dev`, KHÔNG vào bản build): mỗi món × 8 loài, sáng/tối, tĩnh/động. Dữ liệu GIẢ (tên thú giả) — chữ của món do danh mục của Code 3 giữ nên ở đây chỉ hiện MÃ.
// Tham số: ?gd=sang|toi · ?tinh=1 (bản tĩnh) · ?trai=1 (thú nhìn sang trái) · ?cap=1|10|30|50|70|100 (giai đoạn tiến hoá) · ?mon=HQ-03,KT-08 (lọc) · ?ten=... (tên thú giả trên khung).
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/be-vietnam-pro/vietnamese-400.css'
import '@fontsource/be-vietnam-pro/vietnamese-600.css'
import '@fontsource/be-vietnam-pro/vietnamese-700.css'
import '@fontsource/be-vietnam-pro/latin-400.css'
import '@fontsource/be-vietnam-pro/latin-600.css'
import '@fontsource/be-vietnam-pro/latin-700.css'
import '../../styles/tokens.css'
import '../../index.css'
import { apDungGiaoDien } from '../../lib/giao-dien-thay'
import { ThuMacDo, CAO_KHUNG_TEN, type DangMac } from '../../game/than-thu-v2/phu-kien/ThuMacDo'
import { MON_DOT_1, type MonHinh } from '../../game/than-thu-v2/phu-kien/phu-kien-mon'
import { coHinhSvg } from '../../game/than-thu-v2/phu-kien/nap-hinh'

const q = new URLSearchParams(location.search)
const gd = q.get('gd')
apDungGiaoDien(gd === 'sang' || gd === 'toi' ? gd : 'may')
const CAP = Number(q.get('cap')) || 100
const TINH = q.get('tinh') === '1'
const TRAI = q.get('trai') === '1'
const TEN = q.get('ten') || 'Mập Địch'
const LOC = (q.get('mon') || '').split(',').map((x) => x.trim()).filter(Boolean)
const CO_ART = (m: MonHinh) => m.o === 'khung' || coHinhSvg(m.ma)
const DS = MON_DOT_1.filter((m) => CO_ART(m) && (LOC.length === 0 || LOC.includes(m.ma)))
const CO = 92

const dangMacCua = (m: MonHinh): DangMac => ({ [m.o]: m.ma })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <main data-khoi="xem-thu-phu-kien" style={{ padding: 16, display: 'grid', gap: 22, background: 'var(--nen)', color: 'var(--muc)', minHeight: '100vh' }}>
      <h1 style={{ margin: 0, fontSize: 18 }}>Phụ kiện thần thú — xem thử ({DS.length} món × 8 loài · cấp {CAP} · {TINH ? 'tĩnh' : 'động'})</h1>
      {DS.map((m) => (
        <section key={m.ma} data-mon={m.ma} style={{ display: 'grid', gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 14 }}>{m.ma} · {m.o} · bậc {m.bac}</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '46px 60px', padding: '70px 60px 8px', background: 'var(--the)', borderRadius: 16 }}>
            {Array.from({ length: 8 }, (_, pet) => (
              <div key={pet} data-thu={pet} style={{ width: CO, height: CO + CAO_KHUNG_TEN }}>
                <ThuMacDo pet={pet} cap={CAP} size={CO} tinh={TINH} quayTrai={TRAI} ten={TEN} nhan="Thần thú của em" dangMac={dangMacCua(m)} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </main>
  </StrictMode>,
)
