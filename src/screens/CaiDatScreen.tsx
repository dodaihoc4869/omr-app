// CÀI ĐẶT của app giáo viên (màn MỚI, G1 — thầy chốt 21/09): gom những thứ trước đây nằm cuối "Ngân hàng đề → Cấu hình (1 lần)":
// địa chỉ máy chủ + mã bí mật kho đề (G4, dời nguyên từ Ngân hàng đề), kết nối máy chủ mới, mật khẩu mở app; thêm phần GIAO DIỆN (sáng / tối / theo máy). Không đổi hàm nào của hai khối cũ — chỉ đặt chúng ở đây.
// GAME HÓA 2.0 (thầy chốt 28/09 · docs/ban-ve-gv-2809/RA-SOAT.md mục 7): còn Giao diện · Game Hóa 2.0 · Bộ não A.I; mọi thứ kỹ thuật
// (kết nối máy chủ, máy chủ mới, mật khẩu mở app, cập nhật app, đồng bộ lại phiếu mọi ca, đồng bộ danh sách lớp) gom vào MỘT nhóm
// thu gọn "Công cụ kỹ thuật" (mặc định đóng). Không đổi hàm nào — chỉ chỗ đặt. Cờ tắt ⇒ màn như cũ.
import { useState, type ReactNode } from 'react'
import { ChevronDown, ChevronRight, Monitor, Moon, Sun } from 'lucide-react'
import NutDongBoMoiCa from '../components/NutDongBoMoiCa'
import NutDongBoDanhSach from '../components/NutDongBoDanhSach'
import { useHoa2Bat } from '../components/chien-dich/co-hoa2'
import { TheNoiDung } from '../components/DesignSystem'
import KhoiBoNaoCaiDat from '../components/KhoiBoNaoCaiDat'
import CongTacHoa2 from '../components/chien-dich/CongTacHoa2'
import CongTacBia from '../components/chien-dich/CongTacBia'
import KhoiKetNoiKhoDe from '../components/KhoiKetNoiKhoDe'
import KhoiMatKhauApp from '../components/KhoiMatKhauApp'
import KhoiMayChuMoi from '../components/KhoiMayChuMoi'
import NutCapNhatApp from '../components/NutCapNhatApp'
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
  const hoa2 = useHoa2Bat()
  const [moKyThuat, setMoKyThuat] = useState(false)

  const ketNoi = (
    <TheNoiDung>
      <h2 style={{ fontSize: 'var(--cx-3)', fontWeight: 700, marginBottom: 'var(--k3)' }}>Kết nối máy chủ</h2>
      <div className="flex flex-col" style={{ gap: 'var(--k3)' }}>
        <KhoiKetNoiKhoDe showToast={showToast} />
        <div style={{ height: 1, background: 'var(--vien)' }} />
        <KhoiMayChuMoi showToast={showToast} />
      </div>
    </TheNoiDung>
  )
  const matKhau = (
    <TheNoiDung>
      <KhoiMatKhauApp showToast={showToast} />
    </TheNoiDung>
  )
  const capNhat = (
    <TheNoiDung>
      <h2 style={{ fontSize: 'var(--cx-3)', fontWeight: 700, marginBottom: 'var(--k3)' }}>Cập nhật app</h2>
      <p style={{ marginBottom: 'var(--k3)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }}>Máy này chưa thấy tính năng mới? Bấm “Lấy bản mới” để tải bản mới nhất về; app tự mở lại một lần.</p>
      <NutCapNhatApp />
    </TheNoiDung>
  )

  return (
    <div className="gv-page min-h-screen pb-28 px-3 sm:px-4 pt-4 flex flex-col" style={{ color: 'var(--muc)', gap: 'var(--k5)', fontFamily: 'var(--sans)' }}>
      <div className="gv-page-header">
        <div>
          <h1>Cài đặt</h1>
          {!hoa2 && <p>Giao diện, Bộ não A.I, kết nối máy chủ, mật khẩu mở app và cập nhật app</p>}
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

      {/* GAME HÓA 2.0 — công tắc cả trung tâm / theo lớp (`/gv/chien-dich` co-luu), có hộp xác nhận nói rõ hậu quả. */}
      <CongTacHoa2 />
      {/* BI-A PHẢN ỨNG — cửa thứ ba trên Sảnh Bát Linh (`/gv/chien-dich` bia-co-luu, khoá riêng `bi_a`, mặc định TẮT). */}
      <CongTacBia />

      <KhoiBoNaoCaiDat />

      {hoa2 ? (
        <section aria-labelledby="cai-dat-ky-thuat">
          <button type="button" id="cai-dat-ky-thuat" className="m3-nut-chu" aria-expanded={moKyThuat} aria-controls="cai-dat-ky-thuat-than" onClick={() => setMoKyThuat((v) => !v)} style={{ gap: 'var(--k2)', fontSize: 'var(--cx-3)', fontWeight: 700, color: 'var(--muc)' }}>
            {moKyThuat ? <ChevronDown size={20} aria-hidden="true" /> : <ChevronRight size={20} aria-hidden="true" />}
            Công cụ kỹ thuật
          </button>
          {!moKyThuat && (
            <p style={{ margin: '0 0 0 var(--k2)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }}>
              Kết nối máy chủ · Mật khẩu mở app · Cập nhật app · Đồng bộ lại phiếu mọi ca · Đồng bộ danh sách lớp
            </p>
          )}
          <div id="cai-dat-ky-thuat-than" hidden={!moKyThuat} className="flex flex-col" style={{ gap: 'var(--k5)', marginTop: 'var(--k3)' }}>
            {ketNoi}
            {matKhau}
            {capNhat}
            <NutDongBoMoiCa />
            <KhoiNho tieuDe="Đồng bộ danh sách lớp">
              <NutDongBoDanhSach onXong={(soEm, tomTat) => showToast(`Đã nạp ${soEm} em lên máy chủ${tomTat ? ` — ${tomTat}` : ''}. Từ giờ chỉ những em này vào thi được.`, 'success')} />
            </KhoiNho>
          </div>
        </section>
      ) : (
        <>
          {ketNoi}
          {matKhau}
          {capNhat}
        </>
      )}
    </div>
  )
}

function KhoiNho({ tieuDe, children }: { tieuDe: string; children: ReactNode }) {
  return (
    <TheNoiDung>
      <h2 style={{ fontSize: 'var(--cx-3)', fontWeight: 700, marginBottom: 'var(--k3)' }}>{tieuDe}</h2>
      {children}
    </TheNoiDung>
  )
}
