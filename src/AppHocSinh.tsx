// VỎ APP HỌC SINH (/hs, /hoc-sinh, ?vai=hocsinh) — gốc React RIÊNG của cổng học sinh (05/10, thầy: "app học sinh nhanh gấp 2 lần",
// "giữ nguyên mọi thứ giao diện, hình nền màu").
//
// Đo trước khi tách (scripts/do-app-hs.mjs, máy yếu giả lập CPU ×6 + Slow 4G): mở `/hs` lần đầu phải tải ~300 KB JS nén / 57 tệp rồi mới hiện
// ô SBD — gồm cả vỏ app THẦY (App.tsx kéo màn phiếu, màn khoá, thanh bên, bộ chấm…) lẫn cả cổng (Sảnh, bảng nhiệm vụ…) trong khi màn đầu
// chỉ là form đăng nhập. Nay `main.tsx` chọn gốc theo đường vào: đường của em dựng vỏ này, KHÔNG nạp App.tsx.
//   · Chưa đăng nhập ⇒ dựng ngay màn đăng nhập (DangNhapHocSinh, mảnh nhỏ). Mảnh cổng: index.html tải khi mã khởi động đã về (ưu tiên
//     THẤP, nhường đường truyền cho màn đầu); mã cổng chỉ CHẠY sau khi màn đăng nhập đã vẽ. Bấm Đăng nhập được ⇒ hỏi sớm các lệnh Sảnh
//     (src/lib/hoi-som.ts) rồi mới chuyển sang cổng.
//   · Đã đăng nhập ⇒ tải mảnh cổng ngay (index.html đã nạp trước + đã hỏi sớm lệnh Sảnh), Sảnh có số sớm hơn một vòng mạng.
// Cây phần tử, chữ, lớp CSS y như khi App.tsx dựng cổng: ChanLoi → Suspense(ChoManEm) → BatLinhShell vai="hs" → màn. App.tsx VẪN giữ nhánh
// cổng học sinh (phép kiểm dựng thẳng <App/>) — hai nhánh cùng một cây.
import { lazy, Suspense, useEffect, useState, type ComponentType } from 'react'
import BatLinhShell from './components/bat-linh/BatLinhShell'
import ChanLoi from './components/ChanLoi'
import { LogoDoc } from './components/LogoVai'
import DangNhapHocSinh, { type ApiDangNhapHs } from './screens/DangNhapHocSinh'
import { layDiaChiMayChu } from './lib/dia-chi-may-chu'
import { hsDangNhapKemSanhApi, hsDatMatKhauApi } from './lib/hs-dang-nhap-api'
import { batDauHoiSom, diaChiDangDung } from './lib/hoi-som'
import { docPhienHs, ghiPhienHs, type KemDangNhap, type ThongTinHs } from './lib/phien-hoc-sinh'
import { danhDauAppHocSinh } from './lib/pwa-install'

/** Tải mảnh cổng; hỏng (mạng chập) thì chờ 0,8 giây thử lại một lần (như App.tsx). Thiếu mảnh vì đang mở bản cũ ⇒ batLoiThieuManh() lo. */
const napCong = () => import('./screens/StudentPortalScreen').catch(() => new Promise<void>((r) => setTimeout(r, 800)).then(() => import('./screens/StudentPortalScreen')))
let huaCong: ReturnType<typeof napCong> | null = null
/** Lượt tải mảnh cổng đã XONG (thành hay hỏng) — mốc KaTeX, xem `huaManEmSom`. */
let baoCongXong: () => void = () => {}
const congXong = new Promise<void>((r) => (baoCongXong = r))
const layCong = () => {
  if (!huaCong) {
    huaCong = napCong()
    huaCong.then(baoCongXong, baoCongXong)
  }
  return huaCong
}
/** Máy ĐÃ đăng nhập lúc mở: cổng là màn đầu ⇒ `lazy` + Suspense (ChoManEm) như App.tsx. */
const StudentPortalScreen = lazy(layCong)

/**
 * Mốc tải KaTeX — GIỮ ĐÚNG LUẬT CŨ của App.tsx (`huaManEmSom` = lượt tải mảnh cổng): main.tsx nối KaTeX NGAY SAU khi mảnh cổng về, không hoãn
 * thêm (điều phối 05/10: màn có công thức không được hiện chữ thô dù một nhịp ⇒ KaTeX về sớm như bản cũ). Hàm này không tự gọi tải mảnh cổng:
 * máy đã đăng nhập tải ngay lúc vỏ chạy (dưới), máy chưa đăng nhập tải sau lượt vẽ màn đăng nhập (AppHocSinh).
 */
export function huaManEmSom(): Promise<unknown> {
  return congXong
}

// MÁY ĐÃ ĐĂNG NHẬP: màn đầu là cổng ⇒ tải mảnh cổng ngay lúc vỏ vừa chạy (index.html đã nạp trước), không chờ React dựng. Tìm địa chỉ máy chủ
// ngay (để Sảnh nhận được phản hồi đã hỏi sớm từ lượt vẽ đầu); index.html chưa hỏi sớm được (máy chưa nhớ địa chỉ) ⇒ hỏi ở đây.
const phienLucMo = docPhienHs()
if (phienLucMo) {
  void layCong().catch(() => {}) // hỏng thì `lazy` nhận đúng lỗi ấy và ChanLoi báo như cũ
  if (phienLucMo.token) void layDiaChiMayChu('').then((goc) => batDauHoiSom(goc, phienLucMo)).catch(() => {})
}

/** Chỗ giữ màn khi mảnh cổng đang về — đúng nền app, không chữ, không nhấp nháy (= ChoManEm của App.tsx). */
const ChoManEm = () => <div className="min-h-screen" style={{ background: 'var(--nen)' }} />

// Đăng nhập XIN KÈM SẢNH (D1 06/10, server/src/dang-nhap-kem-sanh.ts): máy chủ trả sẵn phản hồi `hoa2-sanh` trong phản hồi đăng nhập ⇒ Sảnh có số ngay, bớt một vòng mạng.
const API_DANG_NHAP: ApiDangNhapHs = { dangNhap: hsDangNhapKemSanhApi, datMatKhau: hsDatMatKhauApi }

export default function AppHocSinh() {
  // Màn cổng dựng ở đâu: máy đã đăng nhập lúc mở ⇒ bản `lazy` (chờ mảnh dưới Suspense như App.tsx); em vừa đăng nhập ⇒ CHÍNH component của mảnh
  // đã tải xong — dựng thẳng trong cùng lượt vẽ, không treo Suspense một nhịp (không chớp nền trống giữa màn đăng nhập và cổng: bản cũ đổi
  // từ đăng nhập sang cổng trong cùng một component). Chọn MỘT lần, giữ suốt phiên trang (đăng xuất do cổng tự vẽ lại màn đăng nhập).
  const [Cong, setCong] = useState<ComponentType | null>(() => (docPhienHs() ? StudentPortalScreen : null))
  const coPhien = Cong !== null
  useEffect(() => {
    // Tên app + manifest + nhớ vai — như StudentPortalScreen làm lúc dựng (màn đăng nhập trước đây nằm trong cổng).
    danhDauAppHocSinh()
  }, [])
  // CHƯA ĐĂNG NHẬP: màn đăng nhập vẽ xong rồi mới CHẠY sẵn mảnh cổng (index.html đã tải trước, ưu tiên thấp) — không giành luồng chính với
  // lượt vẽ đầu; em gõ xong là đã có.
  useEffect(() => {
    if (coPhien) return
    let id = 0
    const raf = requestAnimationFrame(() => {
      id = window.setTimeout(() => void layCong().catch(() => {}), 0)
    })
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(id)
    }
  }, [coPhien])
  const daDangNhap = async (t: ThongTinHs, kem?: KemDangNhap) => {
    ghiPhienHs(t) // máy chặn lưu ⇒ ném lỗi ⇒ form báo lỗi, ở lại màn đăng nhập (như cũ)
    // Hỏi sớm lệnh Sảnh NGAY (địa chỉ vừa dùng để đăng nhập, đã nhớ trong máy) — song song với lúc chạy mảnh cổng. Máy chủ đã đính kèm phản hồi Sảnh vào
    // lệnh đăng nhập (`kem.sanh`) ⇒ ghi nó TRƯỚC lượt vẽ cổng (địa chỉ vừa dùng đã biết ⇒ không chờ đọc IndexedDB), lượt vẽ đầu của Sảnh nhận số ngay.
    const gocBiet = diaChiDangDung()
    if (gocBiet) batDauHoiSom(gocBiet, t, kem)
    else void layDiaChiMayChu('').then((goc) => batDauHoiSom(goc, t, kem)).catch(() => {})
    // Mảnh cổng (đã tải + chạy sẵn trong lúc em gõ) — nút giữ vòng quay tới khi có, không chớp màn trống giữa hai màn. Tải hỏng ⇒ bản `lazy`
    // nhận đúng lỗi ấy, ChanLoi báo như cũ.
    const m = await layCong().catch(() => null)
    setCong(() => (m ? m.default : StudentPortalScreen))
  }
  return (
    <ChanLoi o="Cổng học sinh">
      <Suspense fallback={<ChoManEm />}>
        <BatLinhShell vai="hs">{Cong ? <Cong /> : <DangNhapHocSinh api={API_DANG_NHAP} onDangNhap={daDangNhap} logo={<LogoDoc vai="hs" size={48} />} />}</BatLinhShell>
      </Suspense>
    </ChanLoi>
  )
}
