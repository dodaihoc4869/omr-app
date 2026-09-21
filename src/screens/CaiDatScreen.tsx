// CÀI ĐẶT của app giáo viên (màn MỚI, G1 — thầy chốt 21/09): gom những thứ trước đây nằm cuối "Ngân hàng đề → Cấu hình (1 lần)":
// kết nối máy chủ mới, mật khẩu mở app; thêm phần GIAO DIỆN (sáng / tối / theo máy). Không đổi hàm nào của hai khối cũ — chỉ đặt chúng ở đây.
import { Monitor, Moon, Sun } from 'lucide-react'
import { TheNoiDung } from '../components/DesignSystem'
import KhoiBoNaoCaiDat from '../components/KhoiBoNaoCaiDat'
import KhoiMatKhauApp from '../components/KhoiMatKhauApp'
import KhoiMayChuMoi from '../components/KhoiMayChuMoi'
import { useAppStore } from '../store/appStore'
import { useGiaoDien, type GiaoDien } from '../lib/giao-dien-thay'

const LUA_CHON: { v: GiaoDien; ten: string; icon: typeof Sun }[] = [
  { v: 'sang', ten: 'Sáng', icon: Sun },
  { v: 'toi', ten: 'Tối', icon: Moon },
  { v: 'may', ten: 'Theo máy', icon: Monitor },
]

export default function CaiDatScreen() {
  const showToast = useAppStore((s) => s.showToast)
  const [giaoDien, datGiaoDien] = useGiaoDien()

  return (
    <div className="gv-page min-h-screen pb-28 px-3 sm:px-4 pt-4 flex flex-col" style={{ color: 'var(--muc)', gap: 'var(--k5)', fontFamily: 'var(--sans)' }}>
      <div className="gv-page-header">
        <div>
          <h1>Cài đặt</h1>
          <p>Giao diện, Bộ não A.I, kết nối máy chủ và mật khẩu mở app</p>
        </div>
      </div>

      <TheNoiDung>
        <h2 style={{ fontSize: 'var(--cx-3)', fontWeight: 700, marginBottom: 'var(--k3)' }}>Giao diện</h2>
        <div role="radiogroup" aria-label="Giao diện" className="flex flex-wrap" style={{ gap: 'var(--k2)' }}>
          {LUA_CHON.map(({ v, ten, icon: Icon }) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={giaoDien === v}
              onClick={() => datGiaoDien(v)}
              className={`m3-nut-chu${giaoDien === v ? ' m3-nut-tonal' : ' m3-nut-vien'}`}
              style={{ gap: 'var(--k2)' }}
            >
              <Icon size={18} aria-hidden="true" />
              {ten}
            </button>
          ))}
        </div>
        <p style={{ marginTop: 'var(--k3)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }}>"Theo máy" đi theo chế độ sáng/tối của điện thoại hoặc máy tính. Lựa chọn nhớ trên máy này.</p>
      </TheNoiDung>

      <KhoiBoNaoCaiDat />

      <TheNoiDung>
        <KhoiMayChuMoi showToast={showToast} />
      </TheNoiDung>

      <TheNoiDung>
        <KhoiMatKhauApp showToast={showToast} />
      </TheNoiDung>
    </div>
  )
}
