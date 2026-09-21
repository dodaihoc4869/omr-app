// TRANG XEM THỬ phụ kiện thần thú (chỉ `npm run dev`, KHÔNG vào bản build): mỗi món × 8 loài, sáng/tối, tĩnh/động. Dữ liệu GIẢ (tên thú giả) — chữ của món do danh mục của Code 3 giữ nên ở đây chỉ hiện MÃ.
// Tham số: ?gd=sang|toi · ?dot=1|2 (đợt 1: 24 món vòng sáng/đuôi sáng/khung · đợt 2: 16 món trên đầu/trên lưng) · ?tinh=1 (bản tĩnh) · ?trai=1 (thú nhìn sang trái) · ?cap=1|10|30|50|70|100 (giai đoạn tiến hoá) · ?mon=HQ-03,KT-08 (lọc)
// · ?thu=2 (chỉ MỘT loài, hiện to hơn để soi nét) · ?tong=1 (BẢNG TỔNG: cả bộ món của đợt trên MỘT loài, mỗi món một ô) · ?bo=HQ-08,VD-08,KT-08,DA-08,CL-08 (MẶC ĐỦ bộ này lên cả 8 loài, để thử luật ≤ 3 món chuyển động) · ?co=NNN (cạnh hộp thú, px) · ?ten=... (tên thú giả trên khung)
// · ?neo=1&thu=N (TRANG SOI ĐIỂM ĐẶT: một loài, cả 6 giai đoạn, dấu đỉnh đầu (lục) · mặt (đỏ) · cổ (lam) · lưng (tím) lấy từ bảng neo; thêm ?trai=1 để soi bản lật).
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
import { MON_DOT_1, MON_DOT_2, docMon, type MonHinh } from '../../game/than-thu-v2/phu-kien/phu-kien-mon'
import { coHinhSvg } from '../../game/than-thu-v2/phu-kien/nap-hinh'
import { neoCua } from '../../game/than-thu-v2/phu-kien/phu-kien-neo'

const q = new URLSearchParams(location.search)
const gd = q.get('gd')
apDungGiaoDien(gd === 'sang' || gd === 'toi' ? gd : 'may')
const CAP = Number(q.get('cap')) || 100
const TINH = q.get('tinh') === '1'
const TRAI = q.get('trai') === '1'
const TEN = q.get('ten') || 'Bé Mây'
const LOC = (q.get('mon') || '').split(',').map((x) => x.trim()).filter(Boolean)
const DOT = q.get('dot') === '2' ? 2 : 1
const CO_ART = (m: MonHinh) => m.o === 'khung' || coHinhSvg(m.ma)
const DS = (DOT === 2 ? MON_DOT_2 : MON_DOT_1).filter((m) => CO_ART(m) && (LOC.length === 0 || LOC.includes(m.ma)))
const THU = q.get('thu') === null ? null : Number(q.get('thu'))
const TONG = q.get('tong') === '1'
const CO = Number(q.get('co')) || (TONG ? 104 : THU === null ? 92 : 150)
const CHO_DEO: Record<string, string> = { 'hao-quang': 'Vòng sáng', vet: 'Đuôi sáng', khung: 'Khung tên', dau: 'Trên đầu', 'co-lung': 'Trên lưng' }
// Tên chốt của 40 món (DE-XUAT-SHOP-PHU-KIEN-2109.md mục 3, chữ đã chốt) — CHỈ để đọc trang xem thử này; mã ứng dụng không có tên (danh mục của Code 3 giữ).
const TEN_MON: Record<string, string> = {
  'HQ-01': 'Vòng Sương Mai', 'HQ-02': 'Thảm Đỏ Xanh', 'HQ-03': 'Vòng Lửa Vàng', 'HQ-04': 'Thảm Tinh Thể Xanh', 'HQ-05': 'Vòng Sáng Neon', 'HQ-06': 'Thảm Kim Cương', 'HQ-07': 'Dải Cực Quang', 'HQ-08': 'Vòng Nguyên Tử Vàng',
  'VD-01': 'Đuôi Bong Bóng', 'VD-02': 'Dấu Chân Muối', 'VD-03': 'Đuôi Giọt Hồng', 'VD-04': 'Đuôi Lửa Tím', 'VD-05': 'Đuôi Lửa Xanh Lục', 'VD-06': 'Đuôi Pháo Sáng', 'VD-07': 'Đuôi Sao Băng Đỏ', 'VD-08': 'Đuôi Tia Sét',
  'DA-01': 'Kính Bảo Hộ', 'DA-02': 'Mũ Phễu Lọc', 'DA-03': 'Nơ Đôi', 'DA-04': 'Mũ Bình Sủi Bọt', 'DA-05': 'Nguyệt Quế Đồng', 'DA-06': 'Sừng Cầu Vồng', 'DA-07': 'Vương Miện Thạch Anh', 'DA-08': 'Vương Miện Bạch Kim',
  'CL-01': 'Khăn Loang Màu', 'CL-02': 'Vòng Cổ Ngọc Trai', 'CL-03': 'Áo Nhà Khoa Học', 'CL-04': 'Khăn Lửa Trắng', 'CL-05': 'Cánh Giọt Nước', 'CL-06': 'Ba Lô Bóng Bay', 'CL-07': 'Cánh Bóng Đêm', 'CL-08': 'Áo Choàng Ngân Hà',
  'KT-01': 'Khung Thuỷ Tinh', 'KT-02': 'Khung Nhãn Lọ', 'KT-03': 'Khung Ô Nguyên Tố', 'KT-04': 'Khung Bạc Sáng', 'KT-05': 'Khung Lục Giác', 'KT-06': 'Khung Thạch Anh Tím', 'KT-07': 'Khung Đổi Màu', 'KT-08': 'Khung Vàng 999',
}

const dangMacCua = (m: MonHinh): DangMac => ({ [m.o]: m.ma })
const BO = (q.get('bo') || '').split(',').map((x) => docMon(x.trim())).filter((m): m is MonHinh => !!m)
const dangMacBo: DangMac = Object.fromEntries(BO.map((m) => [m.o, m.ma]))

const BANG_TONG = (
  <main data-khoi="xem-thu-phu-kien-tong" style={{ padding: 16, background: 'var(--nen)', color: 'var(--muc)', minHeight: '100vh' }}>
    <h1 style={{ margin: '0 0 14px', fontSize: 18 }}>Phụ kiện thần thú — {DS.length} món đợt {DOT} trên loài số {THU ?? 2} · cấp {CAP} · {TINH ? 'tĩnh' : 'động'}</h1>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px 18px' }}>
      {DS.map((m) => (
        <figure key={m.ma} data-mon={m.ma} style={{ margin: 0, width: CO + 146, padding: '52px 12px 10px 128px', background: 'var(--the)', borderRadius: 16, position: 'relative' }}>
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

const CAP_GD = [1, 10, 30, 50, 70, 100]
const O_NEO = 400
/** Trang soi điểm đặt: một loài × 6 giai đoạn, dấu vẽ đúng từ `neoCua` (kể cả khi lật). */
function TrangNeo() {
  const pet = THU ?? 0
  return (
    <main data-khoi="xem-thu-phu-kien-neo" style={{ padding: 12, background: 'var(--nen)', color: 'var(--muc)', minHeight: '100vh' }}>
      <h1 style={{ margin: '0 0 10px', fontSize: 16 }}>Điểm đặt loài {pet}{TRAI ? ' (nhìn trái)' : ''} — lục: đỉnh đầu · đỏ: mặt · lam: cổ · tím: lưng</h1>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(3, ${O_NEO}px)`, gap: 6 }}>
        {CAP_GD.map((cap, k) => {
          const n = neoCua(pet, cap, TRAI)
          const cham = (x: number, y: number, mau: string, kt = 9) => <i style={{ position: 'absolute', left: x * O_NEO - kt / 2, top: y * O_NEO - kt / 2, width: kt, height: kt, borderRadius: '50%', background: mau, boxShadow: '0 0 0 1.5px rgb(0 0 0 / 0.7)' }} />
          const ngang = (x: number, y: number, r: number, mau: string) => <i style={{ position: 'absolute', left: (x - r / 2) * O_NEO, top: y * O_NEO - 1, width: r * O_NEO, height: 2, background: mau }} />
          return (
            <div key={cap} data-giai-doan={k} style={{ position: 'relative', width: O_NEO, height: O_NEO, background: 'var(--the)', outline: '1px solid rgb(120 130 160 / 0.5)' }}>
              <ThuMacDo pet={pet} cap={cap} size={O_NEO} tinh quayTrai={TRAI} />
              {ngang(n.dau.x, n.dau.y, n.dau.r, 'rgb(90 230 120)')}
              {cham(n.dau.x, n.dau.y, 'rgb(90 230 120)')}
              <i style={{ position: 'absolute', left: (n.mat.x - 0.34 * n.dau.r) * O_NEO, top: (n.mat.y - 0.2 * n.dau.r) * O_NEO, width: 0.68 * n.dau.r * O_NEO, height: 0.4 * n.dau.r * O_NEO, border: '1.5px solid rgb(255 80 80)' }} />
              {cham(n.mat.x, n.mat.y, 'rgb(255 80 80)', 6)}
              {ngang(n.co.x, n.co.y, n.co.r, 'rgb(90 170 255)')}
              {cham(n.co.x, n.co.y, 'rgb(90 170 255)')}
              {ngang(n.lung.x, n.lung.y, n.lung.r, 'rgb(230 110 255)')}
              {cham(n.lung.x, n.lung.y, 'rgb(230 110 255)')}
              <span style={{ position: 'absolute', right: 6, bottom: 4, fontSize: 12 }}>{pet}.{k}</span>
            </div>
          )
        })}
      </div>
    </main>
  )
}
const TRANG_BO = (
  <main data-khoi="xem-thu-phu-kien-bo" style={{ padding: '70px 60px 8px 170px', background: 'var(--nen)', color: 'var(--muc)', minHeight: '100vh' }}>
    <h1 style={{ margin: '0 0 14px -110px', fontSize: 16 }}>Mặc đủ bộ {BO.map((m) => m.ma).join(' + ')} · cấp {CAP} · {TINH ? 'tĩnh' : 'động'}</h1>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '46px 60px' }}>
      {Array.from({ length: 8 }, (_, pet) => (
        <div key={pet} data-thu={pet} style={{ width: CO, height: CO + CAO_KHUNG_TEN }}>
          <ThuMacDo pet={pet} cap={CAP} size={CO} tinh={TINH} quayTrai={TRAI} ten={TEN} dangMac={dangMacBo} />
        </div>
      ))}
    </div>
  </main>
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {q.get('neo') === '1' ? <TrangNeo /> : BO.length > 0 ? TRANG_BO : TONG ? BANG_TONG : <main data-khoi="xem-thu-phu-kien" style={{ padding: 16, display: 'grid', gap: 22, background: 'var(--nen)', color: 'var(--muc)', minHeight: '100vh' }}>
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
