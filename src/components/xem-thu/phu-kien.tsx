// TRANG XEM THỬ phụ kiện thần thú (chỉ `npm run dev`, KHÔNG vào bản build): mỗi món × 8 loài, sáng/tối, tĩnh/động. Dữ liệu GIẢ (tên thú giả) — chữ của món do danh mục của Code 3 giữ nên ở đây chỉ hiện MÃ.
// Tham số: ?gd=sang|toi · ?tinh=1 (bản tĩnh) · ?trai=1 (thú nhìn sang trái) · ?cap=1|10|30|50|70|100 (giai đoạn tiến hoá) · ?mon=HQ-03,KT-08 (lọc) · ?thu=2 (chỉ MỘT loài, hiện to hơn để soi nét) · ?tong=1 (BẢNG TỔNG: cả 24 món trên MỘT loài, mỗi món một ô) · ?ten=... (tên thú giả trên khung).
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
const TEN = q.get('ten') || 'Bé Mây'
const LOC = (q.get('mon') || '').split(',').map((x) => x.trim()).filter(Boolean)
const CO_ART = (m: MonHinh) => m.o === 'khung' || coHinhSvg(m.ma)
const DS = MON_DOT_1.filter((m) => CO_ART(m) && (LOC.length === 0 || LOC.includes(m.ma)))
const THU = q.get('thu') === null ? null : Number(q.get('thu'))
const TONG = q.get('tong') === '1'
const CO = TONG ? 104 : THU === null ? 92 : 150
const CHO_DEO: Record<string, string> = { 'hao-quang': 'Vòng sáng', vet: 'Đuôi sáng', khung: 'Khung tên' }
// Tên chốt của 24 món (DE-XUAT-SHOP-PHU-KIEN-2109.md mục 3, chữ đã chốt) — CHỈ để đọc trang xem thử này; mã ứng dụng không có tên (danh mục của Code 3 giữ).
const TEN_MON: Record<string, string> = {
  'HQ-01': 'Vòng Sương Mai', 'HQ-02': 'Thảm Đỏ Xanh', 'HQ-03': 'Vòng Lửa Vàng', 'HQ-04': 'Thảm Tinh Thể Xanh', 'HQ-05': 'Vòng Sáng Neon', 'HQ-06': 'Thảm Kim Cương', 'HQ-07': 'Dải Cực Quang', 'HQ-08': 'Vòng Nguyên Tử Vàng',
  'VD-01': 'Đuôi Bong Bóng', 'VD-02': 'Dấu Chân Muối', 'VD-03': 'Đuôi Giọt Hồng', 'VD-04': 'Đuôi Lửa Tím', 'VD-05': 'Đuôi Lửa Xanh Lục', 'VD-06': 'Đuôi Pháo Sáng', 'VD-07': 'Đuôi Sao Băng Đỏ', 'VD-08': 'Đuôi Tia Sét',
  'KT-01': 'Khung Thuỷ Tinh', 'KT-02': 'Khung Nhãn Lọ', 'KT-03': 'Khung Ô Nguyên Tố', 'KT-04': 'Khung Bạc Sáng', 'KT-05': 'Khung Lục Giác', 'KT-06': 'Khung Thạch Anh Tím', 'KT-07': 'Khung Đổi Màu', 'KT-08': 'Khung Vàng 999',
}

const dangMacCua = (m: MonHinh): DangMac => ({ [m.o]: m.ma })

const BANG_TONG = (
  <main data-khoi="xem-thu-phu-kien-tong" style={{ padding: 16, background: 'var(--nen)', color: 'var(--muc)', minHeight: '100vh' }}>
    <h1 style={{ margin: '0 0 14px', fontSize: 18 }}>Phụ kiện thần thú — 24 món đợt 1 trên loài số {THU ?? 2} · cấp {CAP} · {TINH ? 'tĩnh' : 'động'}</h1>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px 18px' }}>
      {DS.map((m) => (
        <figure key={m.ma} data-mon={m.ma} style={{ margin: 0, width: 250, padding: '52px 12px 10px 128px', background: 'var(--the)', borderRadius: 16, position: 'relative' }}>
          <figcaption style={{ position: 'absolute', left: 12, top: 10, fontSize: 12, lineHeight: 1.3 }}>
            <b>{m.ma}</b> · bậc {m.bac}
            <br />
            {TEN_MON[m.ma] ?? ''}
          </figcaption>
          <div data-thu={THU ?? 2} style={{ width: CO, height: CO + CAO_KHUNG_TEN }}>
            <ThuMacDo pet={THU ?? 2} cap={CAP} size={CO} tinh={TINH} quayTrai={TRAI} ten={TEN} dangMac={dangMacCua(m)} />
          </div>
        </figure>
      ))}
    </div>
  </main>
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {TONG ? BANG_TONG : <main data-khoi="xem-thu-phu-kien" style={{ padding: 16, display: 'grid', gap: 22, background: 'var(--nen)', color: 'var(--muc)', minHeight: '100vh' }}>
      <h1 style={{ margin: 0, fontSize: 18 }}>Phụ kiện thần thú — xem thử ({DS.length} món × 8 loài · cấp {CAP} · {TINH ? 'tĩnh' : 'động'})</h1>
      {DS.map((m) => (
        <section key={m.ma} data-mon={m.ma} style={{ display: 'grid', gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 14 }}>{m.ma} · {TEN_MON[m.ma] ?? ''} · {CHO_DEO[m.o]} · bậc {m.bac}</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '46px 60px', padding: '70px 60px 8px 170px', background: 'var(--the)', borderRadius: 16 }}>
            {(THU === null ? Array.from({ length: 8 }, (_, i) => i) : [THU]).map((pet) => (
              <div key={pet} data-thu={pet} style={{ width: CO, height: CO + CAO_KHUNG_TEN }}>
                <ThuMacDo pet={pet} cap={CAP} size={CO} tinh={TINH} quayTrai={TRAI} ten={TEN} dangMac={dangMacCua(m)} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </main>}
  </StrictMode>,
)
