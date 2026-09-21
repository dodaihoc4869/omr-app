// TRANG XEM THỬ (chỉ `npm run dev`, KHÔNG vào bản build): /src/components/xem-thu/btvn-da-giao.html?canh=binh-thuong|cham|khong-chang|qua-han|may-cu[&vo=1][&toi=1]
// Dựng mục "Bài tập về nhà đã giao" thiết kế lại với dữ liệu GIẢ (không chờ máy chủ). `vo=1` đặt mục trong vỏ app (thanh bên trái thật); `toi=1` ép nền tối.
import { StrictMode, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/be-vietnam-pro/vietnamese-400.css'
import '@fontsource/be-vietnam-pro/vietnamese-600.css'
import '@fontsource/be-vietnam-pro/vietnamese-700.css'
import '@fontsource/be-vietnam-pro/latin-400.css'
import '@fontsource/be-vietnam-pro/latin-600.css'
import '@fontsource/be-vietnam-pro/latin-700.css'
import '../../styles/tokens.css'
import '../../index.css'
import '../../styles/teacher-layout.css'
import '../../styles/vo-thay.css'
import '../m3'
import KhungBtvnDaGiao from '../btvn-da-giao/KhungBtvnDaGiao'
import ThanhBenTrai from '../ThanhBenTrai'
import HocSinhNhanBai from '../HocSinhNhanBai'
import { nhomBtvn } from '../../lib/nhom-btvn'
import { useAppStore } from '../../store/appStore'
import { CAC_CANH, CHU_CANH, NOW_MAU, canh, type TenCanh } from './btvn-da-giao-canh'

const tham = new URLSearchParams(location.search)
const tenCanh = (CAC_CANH as readonly string[]).includes(tham.get('canh') ?? '') ? (tham.get('canh') as TenCanh) : 'binh-thuong'
const trongVo = tham.get('vo') === '1'
if (tham.get('toi') === '1') { document.documentElement.classList.add('dark'); document.documentElement.setAttribute('data-theme', 'dark'); document.documentElement.style.colorScheme = 'dark' }
if (trongVo) useAppStore.setState({ screen: 'giaobtvn' })

function Canh() {
  const [ds, setDs] = useState(() => canh(tenCanh))
  const [nhat, setNhat] = useState('')
  const [xacNhan, setXacNhan] = useState<{ text: string; nut: string; run: () => void } | null>(null)
  const g = useMemo(() => nhomBtvn(ds), [ds])
  const khung = (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {!trongVo && (
        <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontFamily: 'var(--sans)', fontSize: 13 }} aria-label="Cảnh xem thử">
          {CAC_CANH.map((c) => (<a key={c} href={`?canh=${c}`} style={{ padding: '6px 12px', borderRadius: 999, border: '1px solid var(--vien)', color: c === tenCanh ? 'var(--muc)' : 'var(--nhat)', fontWeight: c === tenCanh ? 700 : 400 }}>{CHU_CANH[c]}</a>))}
        </nav>
      )}
      {nhat && <p role="status" style={{ margin: 0, fontFamily: 'var(--sans)', fontSize: 13 }}>{nhat}</p>}
      <KhungBtvnDaGiao
        ds={g}
        nowMs={NOW_MAU}
        dangNap={false}
        onNap={() => setNhat('Cập nhật dữ liệu (xem thử — không gọi máy chủ)')}
        tenCu={(t) => t.maDe}
        dangSua=""
        hanChoOChon={(h) => h}
        onLuuHan={(t, gio) => { setNhat(`Lưu hạn ${t.maBtvn}: ${gio} (xem thử — không gọi máy chủ)`) }}
        onThuHoi={(t) => setXacNhan({ text: `Thu hồi bài này của ${t.tong} học sinh? Kết quả đã nộp vẫn được giữ lại.`, nut: 'Thu hồi bài', run: () => setDs((c) => c.filter((x) => x.maBtvn !== t.maBtvn)) })}
        dungBaiLam={(t) => <HocSinhNhanBai maTheoSbd={t.maTheoSbd} bai={t} busy={false} onAction={() => {}} />}
        onMoToanCanh={(sbd) => setNhat(`Mở Toàn cảnh em ${sbd} (xem thử)`)}
        onGiaoBaiMoi={() => setNhat('Giao bài mới (xem thử)')}
      />
    </div>
  )
  // Bản sao HỘP XÁC NHẬN của màn thật (PhanCongScreen `xacNhan`) để nhìn Thu hồi luôn qua hộp nói rõ hậu quả.
  const hop = xacNhan && (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'var(--phu)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div role="dialog" aria-modal="true" aria-labelledby="confirm-homework" style={{ width: '100%', maxWidth: 440, padding: 24, borderRadius: 22, background: 'var(--the)', color: 'var(--muc)', boxShadow: 'var(--bong-2)' }}>
        <h2 id="confirm-homework" style={{ fontSize: 20, fontWeight: 700 }}>Xác nhận thay đổi bài tập</h2>
        <p style={{ margin: '16px 0', lineHeight: 1.7 }}>{xacNhan.text}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button autoFocus className="btn-google-outlined" onClick={() => setXacNhan(null)}>Giữ nguyên</button>
          <button style={{ padding: '10px 18px', borderRadius: 12, background: 'var(--gg-xanh)', color: 'var(--muc-nguoc)', fontWeight: 700 }} onClick={() => { const chay = xacNhan.run; setXacNhan(null); chay() }}>{xacNhan.nut}</button>
        </div>
      </div>
    </div>
  )
  return trongVo ? (
    <div className="min-h-screen m3 m3-thay vo-thay">
      <ThanhBenTrai />
      <div className="khung-noi-dung"><div className="giua-noi-dung">{hop}{khung}</div></div>
    </div>
  ) : (
    <div className="m3">{hop}{khung}</div>
  )
}

createRoot(document.getElementById('root')!).render(<StrictMode><Canh /></StrictMode>)
