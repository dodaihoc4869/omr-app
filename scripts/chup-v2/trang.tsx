import GvHomNayScreen from '../../src/screens/GvHomNayScreen'
import NganHangDeScreen from '../../src/screens/NganHangDeScreen'
import CaiDatScreen from '../../src/screens/CaiDatScreen'
import HocSinhScreen from '../../src/screens/HocSinhScreen'
import ExamSetupScreen from '../../src/screens/ExamSetupScreen'
import BanGoNutThatScreen from '../../src/screens/BanGoNutThatScreen'
import DuyetLoiGiaiScreen from '../../src/screens/DuyetLoiGiaiScreen'
// «Trong» nhóm 4 (26/10) — màn quản lý app thầy: Ca kiểm tra · Học sinh hỏi · Theo dõi ca (TheoDoiCa thuần props, số giả khớp nhau).
import LichSuCaScreen from '../../src/screens/LichSuCaScreen'
import CauHoiScreen from '../../src/screens/CauHoiScreen'
import TheoDoiCa from '../../src/components/ca-thi/TheoDoiCa'
import ToanCanhEmScreen from '../../src/screens/ToanCanhEmScreen'
import PhanCongScreen from '../../src/screens/PhanCongScreen'
import GiaoDeTheoTuanScreen from '../../src/screens/GiaoDeTheoTuanScreen'
import '../../src/styles/giao-dien-day-du.css'
// TRANG CHỤP ẢNH BẢN DUYỆT V2 (chỉ để lấy bằng chứng giao diện, không vào bản phát hành): component THẬT + máy chủ GIẢ ngay trong trang
// (thay `fetch`) — không một yêu cầu nào tới máy chủ thật, không dữ liệu học sinh thật (tên em trong ảnh là tên giả).
// `?man=` sanh | sanh-xong | sanh-chon-thu | sanh-dang-tai | than-thu | cua-hang | dao | doan | gv-nhip | gv-bo-sung | gv-can-chua | gv-ca | gv-ma-tran
// `gv-nhip&the=day-hoc|nhip|dau-gio|can-chua|chien-dich[&khoi=12]` = màn Hành trình mở sẵn đúng thẻ (như Hôm nay / Cài đặt mở) — trung tu 09/10 tối;
// `the=nhip` (09/10 khuya) = thẻ Nhịp học, bấm một em ⇒ tấm Lịch sử làm câu (`/gv/lich-su-lam-cau` GIẢ: gia/lich-su-lam-cau.ts).
import { createElement as h } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/be-vietnam-pro/vietnamese-400.css'
import '@fontsource/be-vietnam-pro/vietnamese-600.css'
import '@fontsource/be-vietnam-pro/vietnamese-700.css'
import '@fontsource/be-vietnam-pro/latin-400.css'
import '@fontsource/be-vietnam-pro/latin-600.css'
import '@fontsource/be-vietnam-pro/latin-700.css'
import '@fontsource/noto-serif/vietnamese-400.css'
import '@fontsource/noto-serif/latin-400.css'
import '../../src/styles/tokens.css'
import '../../src/styles/thang.css' // thang chung 3 app (main.tsx nạp ngay sau tokens.css) — thiếu thì --nut-*-cao, --t-*, --r-* rỗng trong ảnh chụp
import '../../src/index.css'
import '../../src/styles/the-loc.css'
// App học sinh tập trung học (PR231): Hôm nay nạp hoc-tap.css rồi mới mở các màn con ⇒ nạp sẵn ở đây cho ảnh khớp bản sống.
import '../../src/components/hoc-tap/hoc-tap.css'
import '../../src/components/m3'
import BatLinhShell from '../../src/components/bat-linh/BatLinhShell'
import CauDaLam from '../../src/components/hoa2/CauDaLam'
import HocTapHomNay from '../../src/components/hoc-tap/HocTapHomNay'
import ManLamBaiTap from '../../src/components/hoc-tap/ManLamBaiTap'
import ManChuaCauSai from '../../src/components/chua-cau-sai/ManChuaCauSai'
import ManTuLuyen from '../../src/components/tu-luyen/ManTuLuyen' // LÀN HỌC SINH 12/10
import ManTuChua from '../../src/components/hoc-tap/ManTuChua' // LÀN HỌC SINH 12/10
import { docSanh, type KetQuaSanh } from '../../src/components/hoa2/api'
// Bản màu app thầy (App.tsx nạp ba tệp này, phạm vi `.vo-thay`) — màn thầy bọc đúng khung `.m3.m3-thay.vo-thay` như app thật.
import '../../src/styles/teacher-layout.css' // ═══ SOÁT 26/10: ba tờ vỏ thầy nay App.tsx chèn bằng chuỗi (main 26/10) — trang chụp nạp thẳng, đúng thứ tự,
import '../../src/styles/vo-thay.css'
import '../../src/components/chien-dich/thanh-ben-hoa2.css' // ═══ SOÁT 26/10 (thiếu ⇒ thanh trên điện thoại «tĩnh» rơi xuống cuối trang, ảnh sai)
import '../../src/components/thanh-ben-gv2.css' // ═══ SOÁT 26/10
import '../../src/styles/gv-mau.css'
import '../../src/styles/teacher-modern.css'
import '../../src/styles/trong.css' // giao diện «Trong» 26/10 (App / AppHocSinh / AppThi nạp y như vậy)
import '../../src/styles/trong-gv.css' // «Trong» — khung app thầy (App.tsx nạp ngay sau trong.css)
import GoiLenBangScreen from '../../src/screens/GoiLenBangScreen' // «TRONG» NHÓM 3
import DieuKhienToChieuScreen from '../../src/screens/DieuKhienToChieuScreen' // «TRONG» NHÓM 3
import '../../src/styles/trong-gv-chieu.css' // màn thật gắn chuỗi này lúc nạp mảnh (khi data-trong đã có); trang chụp đặt data-trong SAU khi nạp ⇒ nạp thẳng
const PHIEN_CHIEU_GIA = {
  maPhien: 'PHIEN1', tieuDe: 'Điều khiển Máy chiếu', dotHienTai: 6, tongSoDot: 20, pha: 'cho', loiGiaiMo: false, daCham: {},
  dsO: Array.from({ length: 20 }, (_, i) => ({
    khoa: `o${i}`, dot: i, soCau: i + 1, phan: 'I', sao: i === 6 ? 2 : 0, sbd: String(1200 + i), hoTen: ['Hoàng Bảo Ngọc', 'Lê Khánh Vy', 'Trần Gia Bảo'][i % 3], lop: '12A1', lanLenBang: 2,
    qid: `DH-12-C2-B6-${i + 1}`, de: 'Xà phòng hoá hoàn toàn 8,9 gam tristearin bằng NaOH vừa đủ. Khối lượng glycerol thu được là', pa: ['0,46 g', '0,92 g', '1,84 g', '2,76 g'],
    dapAn: 'B', loiGiai: 'n(chất béo) = 8,9 : 890 = 0,01 mol\nTristearin có 3 nhóm ester: n(NaOH) = 3 · 0,01 = 0,03 mol\nn(glycerol) = n(chất béo) = 0,01 mol ⇒ m = 0,01 · 92 = 0,92 g',
  })),
}
import ThanhBenTrai from '../../src/components/ThanhBenTrai'
import ChienDichScreen from '../../src/screens/ChienDichScreen'
import AppPhuHuynh from '../../src/components/ph-v3/AppPhuHuynh'
import { PH_OK } from '../../tests/_ph-moi/du-lieu-mau'
import BangMaTranDe from '../../src/components/ma-tran-de/BangMaTranDe'
import { useCoHoa2 } from '../../src/components/chien-dich/co-hoa2'
import { useAppStore } from '../../src/store/appStore'
import { KHO } from '../chup-omni-3/gia/may-thay'
import BottomNav from '../../src/components/BottomNav'
import { apDungGiaoDien } from '../../src/lib/giao-dien-thay'
import { useSoDemGv, type TheHanhTrinh } from '../../src/lib/so-dem-gv'
import { lichSuGia } from './gia/lich-su-lam-cau'
// LÀN PHỤ HUYNH 12/10: tổng quan về con GIẢ (`/ph/con-tong-quan`).
import { conTongQuanGia } from './gia/ph-con-tong-quan'
// ═══ PH CHỈ ĐỌC 26/10: bộ số giả đợt 19 (cảnh `ph&mot=1`)
import { NAY as NAY_PH19, hoc2Gia as hoc2Ph19, lichSuGia as lichSuPh19, loiThayGia as loiThayPh19, nhipGia as nhipPh19, thaiDoGia as thaiDoPh19, tatCaGia as tatCaPh19, tongQuanGia as tongQuanPh19 } from '../chup-ph-dot19/gia'
// LÀN GIÁO VIÊN 12/10: `gv-nhip&the=bai-hang-ngay` = Hành trình › Bài hằng ngày (bảng nhiệt), bấm một em ⇒ tấm Hồ sơ làm bài (gia/bai-hang-ngay.ts).
import { baiHangNgayGia, hoSoThaiDoGia } from './gia/bai-hang-ngay'
// LÀN NHỊP EM 12/10C: `?man=hs-nhip&nhe=…` = bảng "Nhịp học của em" (app học sinh), `/hs/nhip-hoc` GIẢ đúng số bản vẽ.
import { nhipEmGia } from './gia/nhip-hoc-em'
// LÀN MÀN LÀM BÀI 12/10D: `?man=lam13[&lam=g7|ds-dau]` = màn làm bài học sinh theo bản vẽ dot13 (máy chủ giả gia/lam-bai-1210d.ts).
import { useState as useStateLam13 } from 'react'
import { LA_LAM13, soHomNayLam13, traLoiLam13 } from './gia/lam-bai-1210d'
// ═════════ LÀN BÀI MỚI 7 NGÀY 12/10: `gv-nhip&the=goi-7` = Hành trình › Bài mới trong 7 ngày (trùng tu: thẻ chọn bài · 6 ô số · dải tiến độ ·
// danh sách chữa lọc/xếp · Học sinh cần hỗ trợ · Tiến độ học sinh · tấm soạn phần chữa). `/gv/goi-bai-7` GIẢ: gia/goi-bai-7.ts (≈ 60 em × 40 câu);
// `&g7=trong` chưa có bài · `&g7=loi` máy chủ lỗi · `&g7=thieu-nguon` cảnh báo thiếu nguồn. ═════════
import { goi7Du } from './gia/goi-bai-7'
// LÀN THẦY TỰ CHỮA 12/10: `gv-nhip&the=can-chua&ttc=1` = Cần thầy chữa › thẻ Thầy tự chữa (bài Dạy học giả có đủ ba tờ, lớp có SBD, số liệu lớp giả).
import { LA_TTC, BAI_TTC, aiSaiTtc, soGopTtc } from './gia/thay-tu-chua'
// ═════════ LÀN CHỮA BÀI 12/10B: `gv-nhip&the=can-chua&ttc=1&cb=1` = Hành trình › Chữa bài — (A) Học sinh cần chữa + (B) Chữa câu khó & tính toán MỞ SẴN
// (bài + lớp + số liệu lớp giả của làn Thầy tự chữa; em làm sai theo lô + buổi điểm danh đang mở: gia/chua-bai.ts qua `goiLenh` giả). ═════════
import { LA_CB } from './gia/chua-bai'
// ═════════ LÀN HÀNH TRÌNH 12/10B: `gv-nhip&ht2=1` = Hành trình còn 2 mục › Dạy học & đầu giờ — MỘT buổi dạy 4 bước (điểm danh có 6 em vắng · gọi lên
// bảng đầu giờ 6 em · dạy và chiếu câu · tick bài vừa dạy + bảng Bài đang giao). Màn THẬT (`ChienDichScreen` ⇒ `HanhTrinhV2`); máy giả riêng
// gia/hanh-trinh-2-muc.ts nối ở gia/goi-lenh-thay.ts, chỉ trả lời khi `ht2=1` (ảnh cảnh khác không đổi). ═════════
import { LA_HT2 } from './gia/hanh-trinh-2-muc'
if (LA_HT2) document.documentElement.dataset.canhHt2 = '1' // LÀN HÀNH TRÌNH 12/10B — đánh dấu cảnh (đọc khi soát ảnh)
// ═════════ LÀN ĐIỂM DANH 12/10C: `gv-nhip&ht2=1&dd12c=1` = Hành trình › Dạy học & đầu giờ, bước 1 Điểm danh theo bản vẽ GV-DiemDanh (ô mã + QR, có mặt
// chia nhóm Chăm / Chưa đều / Lười / Mới, ô em vắng, Vừa điểm danh) + hai bản chiếu React (đang điểm danh · Nhịp học của lớp) + tấm Hồ sơ làm bài mở trên
// bản chiếu. Màn THẬT; máy giả riêng gia/diem-danh-1210c.ts (lớp "12 Nhóm 10 điểm" của bộ Nhịp học giả, 30/38 em có mặt) nối ở gia/goi-lenh-thay.ts
// TRƯỚC máy giả ht2, chỉ trả lời khi `dd12c=1`. ═════════
import { LA_DD12C } from './gia/diem-danh-1210c'
if (LA_DD12C) document.documentElement.dataset.canhDd12c = '1' // LÀN ĐIỂM DANH 12/10C — đánh dấu cảnh
// ═════════ hết LÀN ĐIỂM DANH 12/10C ═════════
// ═════════ LÀN HÔM NAY 12/10B: `gv-hom-nay&nh=1` = Hôm nay của thầy bản vẽ duyệt 12/10 (Việc cần thầy dạng thẻ + Nhịp học: 262 em × 12 ngày, hai cột
// Lười nhất · Chăm nhất, Đối phó, Theo lớp, bảng từng ngày, tấm hồ sơ). `/gv/nhip-hoc` GIẢ: gia/nhip-hoc.ts; `&nh=loi` máy chủ lỗi · `&nh=trong` chưa có em. ═════════
import { nhipHocGia } from './gia/nhip-hoc'
// ═════════ LÀN THẺ HÔM NAY 12/10E: `?man=hs-the&the=…` = thẻ "Hôm nay của em" (gộp vòng Mục tiêu hôm nay + bảng Nhịp học) — bộ giả Nhịp học dùng lại. ═════════
import { NHIP_EM_CHAM, NHIP_EM_CHUA_DEU, NHIP_EM_LUOI } from './gia/nhip-hoc-em'

const thamSo = new URLSearchParams(location.search)
const man = thamSo.get('man') ?? 'sanh'
// NHẮC SAMSUNG 27/10: `&ua=samsung` ⇒ giả chuỗi nhận diện Samsung Internet (thẻ nhắc một lần trên Lộ trình).
if (thamSo.get('ua') === 'samsung') Object.defineProperty(navigator, 'userAgent', { get: () => 'Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36' })
// Như main.tsx: giao diện «Trong» (26/10) — cảnh thầy `gv…` = 'gv', cảnh phụ huynh không bật, còn lại (học sinh, màn thi) = 'hs'. `&trong=tat` ⇒ giao diện cũ.
if (man !== 'ph' && !man.startsWith('ph-') && thamSo.get('trong') !== 'tat') document.documentElement.dataset.trong = man.startsWith('gv') ? 'gv' : 'hs'
// ═══ PH CHỈ ĐỌC 26/10 (thay khối MỘT TRANG PH): `?man=ph&mot=1` = app phụ huynh «Chỉ đọc» (DocPh.tsx; bật bằng <html data-trong="ph"> như main.tsx;
// cảnh `ph` cũ KHÔNG có `mot` ⇒ giữ y như trước, không data-trong). Số = bộ GIẢ đợt 19 (scripts/chup-ph-dot19/gia.ts: 21:05 Thứ Tư 14/10/2026, con
// «Nguyễn Minh Khôi», hôm nay 18/30, nhóm Chưa đều) + Báo cáo tuần GIẢ (Học thật) + một cảnh báo của thầy (`/ph/ke-hoach`). Biến thể (`bienThePh`):
//   `&hn=chua|dang|du` hôm nay 0 · 18 · 31/30 câu · `&nhom=luoi|cham` · `&dg=doi-pho|hoc-that|khong` (chưa có đánh giá) · `&cb=0` không cảnh báo
//   · `&lt=0` thầy chưa gửi nhận xét · `&dai=1` dữ liệu dài (tên dài, lời thầy dài, số lớn). Thẻ «Kiểm tra và sửa lỗi»: `&kt=chua|dang|nop|het|cu|sap|khong`
//   (Kiểm tra ôn tập hôm nay chưa làm · đang làm 10/28 · đã nộp 8 · hết hạn · lần trước 7,5 · bài sắp mở · không có lịch) · `&ss=het|do` (đã sửa hết ·
//   còn nhiều mà 14 ngày không sửa) · `&bt=du|khong` (Bài tập về nhà đã nộp đủ · không có bài). Đồng hồ trang = mốc của bộ giả.
const MOT_PH = man === 'ph' && thamSo.get('mot') === '1'
const traMotPh = (duong: string): unknown => {
  if (duong.endsWith('/ph/nhip-hoc')) return nhipPh19()
  if (duong.endsWith('/ph/con-tong-quan')) return tongQuanPh19()
  if (duong.endsWith('/ph/tat-ca-ve-con')) return tatCaPh19()
  if (duong.endsWith('/ph/hoc-2')) return hoc2Ph19()
  if (duong.endsWith('/ph/loi-thay')) return loiThayPh19()
  if (duong.endsWith('/ph/ho-so-thai-do')) return thaiDoPh19()
  if (duong.endsWith('/ph/lich-su-lam-cau')) return lichSuPh19()
  if (duong.endsWith('/ph/bao-cao-tuan')) return { ok: true, soLieu: 'Báo cáo tuần (giả)', duLieu: { tu: '08/10', den: '14/10', buoi: { tong: 3, coMat: 3, coPhep: 0 }, soNgay: 7, ngayCoLam: 6, ngayKhongLam: ['10/10'], soCau: 186, soDung: 141, mucLam: { thuoc: 96, bamVoi: 8, treo: 0, doDuoc: 155 }, ktcn: { nop: 1, hetHan: [], diem: [8] }, banKhac: { lam: 12, dung: 9 }, banKhacTruoc: null, chuyenDeYeu: [{ ten: 'Ester – Lipid', sai: 9, lam: 24 }], nhan: 'Học thật', lyDo: [] } }
  if (duong.endsWith('/ph/ke-hoach')) return { ok: true, canhBaoThay: thamSo.get('cb') === '0' ? [] : [{ id: 'cb-mot-ph', maBtvn: 'BT-1', tenBtvn: 'Ester – Lipid buổi 3', guiLuc: '2026-10-14T12:30:00Z', hanNop: '2026-10-15T15:00:00Z', loi: '', trangThaiEm: 'do_chang', chang: { hienTai: 3, tong: 5 } }] }
  return null
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const bienThePh = (duong: string, r: any): unknown => {
  const hn = thamSo.get('hn'), nhom = thamSo.get('nhom'), dg = thamSo.get('dg'), dai = thamSo.get('dai') === '1'
  const lam = hn === 'chua' ? 0 : hn === 'du' ? 31 : null
  if (duong.endsWith('/ph/con-tong-quan')) {
    const n = r.ngay[r.ngay.length - 1]
    if (lam !== null) {
      Object.assign(n, { daLam: lam, soCau: lam, dung: lam ? 24 : 0, sai: lam ? lam - 24 : 0, trangThai: lam ? 'du' : 'khong' })
      r.dem.homNay = { ...r.dem.homNay, soLuot: lam, soCau: lam, dung: n.dung, sai: n.sai, giayTb: lam ? 41 : null }
    }
    if (dai) r.cauSai = { ...r.cauSai, tong: 12456, daSua: 34 }
  }
  if (duong.endsWith('/ph/hoc-2') && lam !== null) r.homNay = { ...r.homNay, daLam: lam }
  const kt = thamSo.get('kt')
  if (duong.endsWith('/ph/hoc-2') && kt && kt !== 'khong') {
    const homNay = kt !== 'cu' && kt !== 'sap'
    const mo = Date.UTC(2026, 9, homNay ? 13 : kt === 'cu' ? 9 : 15, 17) // nửa đêm giờ VN: 14/10 (hôm nay) · 10/10 (lần trước) · 16/10 (sắp mở)
    const daTra = kt === 'dang' ? 10 : kt === 'nop' || kt === 'cu' ? 28 : 0
    r.kiemTraCaNhan = {
      id: `kt-${kt}`, ngay: new Date(mo + 7 * 3_600_000).toISOString().slice(0, 10), moLuc: mo, hanLuc: mo + 86_400_000, serverNow: NAY_PH19,
      trangThai: kt === 'chua' || kt === 'dang' ? 'can_lam' : kt === 'het' ? 'het_han' : kt === 'sap' ? 'sap_den' : 'da_nop', homNay,
      tong: 28, daTra, con: 28 - daTra, soChang: 5, phut: 25, soBai: 6, tongKienThuc: 12, phuDe: 0, nguonDayDu: true, lyDo: '', thieuNguon: 0,
      diem: kt === 'nop' ? 8 : kt === 'cu' ? 7.5 : null, nopLuc: kt === 'nop' ? NAY_PH19 - 3_600_000 : kt === 'cu' ? mo + 20 * 3_600_000 : null,
    }
  }
  if (duong.endsWith('/ph/con-tong-quan') && thamSo.get('ss') === 'het') r.cauSai = { ...r.cauSai, daSua: r.cauSai.tong }
  if (duong.endsWith('/ph/tat-ca-ve-con') && thamSo.get('ss') === 'do' && r.lichOn) r.lichOn = { ...r.lichOn, daKhacPhuc14Ngay: 0 }
  if (duong.endsWith('/ph/tat-ca-ve-con') && thamSo.get('bt') && r.baiTapVeNha) {
    const gan = [{ maBtvn: 'BT-0', ten: 'Ester – Lipid buổi 2', nopLuc: '2026-10-12T13:00:00Z', dungHan: true, diem: 9, nopTreGio: null }]
    r.baiTapVeNha = { ...r.baiTapVeNha, dangChay: [], gan: thamSo.get('bt') === 'du' ? gan : [] }
  }
  if (duong.endsWith('/ph/tat-ca-ve-con') && dai) r.hoTen = 'Nguyễn Hoàng Bảo Ngọc Phương Thảo Khánh Linh'
  if (duong.endsWith('/ph/nhip-hoc') && (nhom === 'luoi' || nhom === 'cham')) {
    Object.assign(r, nhom === 'luoi'
      ? { nhom: 'luoi', soNgayDu: 4, viecTiep: { loai: 'thoat-luoi', coNgay: 0, canNgay: 6, cauConHomNay: 30, homNayDu: false } }
      : { nhom: 'cham', soNgayDu: 12, viecTiep: { loai: 'giu-chuoi', cauConHomNay: 0, homNayDu: true, chuoiNeuDu: 7 } })
    r.bacCham = { ...(r.bacCham ?? { diem: 0 }), bac: nhom === 'luoi' ? 3 : 10 }
  }
  if (duong.endsWith('/ph/bao-cao-tuan') && dg) {
    r.duLieu = dg === 'khong' ? { ...r.duLieu, nhan: null }
      : dg === 'doi-pho' ? { ...r.duLieu, nhan: 'Đối phó', mucLam: { thuoc: 20, bamVoi: 21, treo: 3, doDuoc: 120 }, lyDo: ['x'] }
      : { ...r.duLieu, nhan: 'Học thật', mucLam: { thuoc: 126, bamVoi: 8, treo: 0, doDuoc: 180 } }
  }
  if (duong.endsWith('/ph/loi-thay')) {
    if (thamSo.get('lt') === '0') r.nhanXet = []
    else if (dai) r.nhanXet[0].noiDung = 'Bài Ester 25/10 con sai 3/5 câu gọi tên muối. Con nhớ công thức nhưng đọc nhầm gốc acid, nhất là các ester có gốc acid mạch nhánh. Tuần này con làm thêm 10 câu gọi tên ester, thứ Bảy Thầy kiểm tra lại; anh/chị nhắc con làm đủ trước tối thứ Sáu và ghi lại những câu còn nhầm để hỏi Thầy trên lớp.'
  }
  return r
}
if (MOT_PH) {
  if (thamSo.get('trong') !== 'tat') document.documentElement.dataset.trong = 'ph'
  try { localStorage.setItem('omr_ph_pass', 'ma-gia-chup') } catch { /* bỏ qua */ }
  const dau = performance.now()
  Date.now = () => NAY_PH19 + (performance.now() - dau)
}
// ═══ hết PH CHỈ ĐỌC 26/10
// ═══ NGANG PH 26/10: `?man=ph-vao` = màn đăng nhập phụ huynh như app thật (<html data-trong="ph">, vỏ BatLinhShell vai ph). `&bl=1` trên cảnh
// `ph&mot=1` ⇒ giữ body[data-bat-linh="ph"] như app thật (vỏ Bát Linh đổi bảng --ph3-*; cảnh cũ bỏ thuộc tính này).
import ParentPortalScreen from '../../src/screens/ParentPortalScreen'
const PH_VAO = man === 'ph-vao'
if (PH_VAO && thamSo.get('trong') !== 'tat') document.documentElement.dataset.trong = 'ph'
if (man === 'ph' && thamSo.get('bl') === '1') setTimeout(() => document.body.setAttribute('data-bat-linh', 'ph'), 0)
// ═══ hết NGANG PH 26/10
const now = Date.now()
const noop = () => {}

// ---------------------------------------------------------------- dữ liệu Sảnh giả (đúng kiểu SanhHoa2 — số đối chiếu được với nhau)
// Hành trình tầng Hiểu: tối thiểu 30 câu; đã làm 12 ⇒ còn 18 = 2 câu ôn (Đoàn) + 16 câu mới (Đảo). Chặng 3/5 (6 câu/chặng), còn 6 câu trong chặng.
const SANH_HT = {
  ok: true, cheDo2: true, ngay: '2026-10-09',
  hanhTrinh: { tang: 2, toiThieu: 30, daLam: 12, daXep: 30, conThieu: 0, soChang: 5, changHienTai: 3, cauTrongChang: 6 },
  chienDich: null,
  theLuc: { con: 18, tong: 30 }, huyetChien: false, doan: { con: 2 }, dao: { con: 16 }, khoaDao: true, loiKhoaDao: 'Gỡ xong 2 lỗi cũ ở Đoàn Hộ Tống để mở cầu sang đảo.',
  ruong: { daLam: 12, tong: 30, moDuoc: false, daMo: false, qua: null },
  // Bi-a + Đề thử bật (09/10): đủ 5 màu nhấn của lưới Luyện thêm trong ảnh chụp.
  bia: { bat: true, con: 9, tong: 9, giaoHuu: { mo: false, con: 0 }, lyDoKhoa: null }, tamGiuCa: 0, thuSucThem: { duoc: false, soCau: 0 }, chuoiNgay: 12,
  omni: { bat: true, baiDangLuyen: [], dangVung: { a: 5, b: 8 }, conDangDe8: 2, sEm: 0.06, sMucTieu: 0.07, chungChi: [], ve: { con: 2, tong: 2 }, choBaiMoi: false, onBaiCu: 0, metGio: null, nhatKy: null, deThu: { duoc: true, soCau: 14, phut: 25 } },
}
// App học sinh tập trung học (PR231, 10/10): cùng kế hoạch, thêm danh sách bài + tên Hành trình.
const SANH_MOI = { ...SANH_HT, chienDich: { id: 'cd1', ten: 'Hành trình giỏi hoá · Khối 12' }, hanhTrinh: { ...SANH_HT.hanhTrinh, bai: [
  { khoa: 'b1', ten: 'Este — khái niệm, danh pháp', tangMo: 3 }, { khoa: 'b2', ten: 'Thuỷ phân este', tangMo: 2 },
  { khoa: 'b3', ten: 'Chất béo', tangMo: 1 }, { khoa: 'b4', ten: 'Glucose và fructose', tangMo: 1 }] } }
const CAU_HOC = [
  { qid: 'H1', version: '1', group: 'g', phan: 'I', tenDang: 'Thuỷ phân este', mucDo: 'hieu', text: 'Thuỷ phân hoàn toàn 8,8 gam etyl axetat bằng dung dịch NaOH vừa đủ. Khối lượng muối thu được là', choices: ['8,2 gam.', '6,8 gam.', '9,6 gam.', '4,1 gam.'], ideas: [], hinhAnh: [] },
  { qid: 'H2', version: '1', group: 'g', phan: 'II', tenDang: 'Chất béo', mucDo: 'hieu', text: 'Cho các phát biểu về chất béo:', choices: [], ideas: ['Chất béo là trieste của glixerol với axit béo.', 'Tristearin ở thể lỏng ở nhiệt độ thường.', 'Thuỷ phân chất béo trong kiềm gọi là phản ứng xà phòng hoá.', 'Chất béo tan tốt trong nước.'], hinhAnh: [] },
  { qid: 'H3', version: '1', group: 'g', phan: 'III', tenDang: 'Glucose', mucDo: 'VD', text: 'Lên men 45 gam glucose với hiệu suất 80%. Thể tích khí CO₂ (đktc, lít) thu được là bao nhiêu?', choices: [], ideas: [], hinhAnh: [] },
]
// Xong kế hoạch: 30/30, rương mở được, có Thử sức thêm 6 câu.
const SANH_XONG = { ...SANH_HT, hanhTrinh: { ...SANH_HT.hanhTrinh, daLam: 30, changHienTai: 5, cauTrongChang: 0 }, theLuc: { con: 0, tong: 30 }, doan: { con: 0 }, dao: { con: 0 }, khoaDao: false, loiKhoaDao: '', ruong: { daLam: 30, tong: 30, moDuoc: true, daMo: false, qua: null }, thuSucThem: { duoc: true, soCau: 6 } }

// ---------------------------------------------------------------- app thầy 2.0 (trung tu 09/10): danh sách em / ca / câu hỏi / học phí GIẢ
// 60 em (chia trang 25); 12 em đầu trùng SBD bảng Hành trình giả (gia/goi-lenh-thay.ts) ⇒ cột "Hôm nay" có số thật của bộ giả.
const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Ngô']
const TEN = ['Minh Anh', 'Đức Huy', 'Phương Linh', 'Quang Minh', 'Thu Trang', 'Khánh', 'Anh', 'Thảo Linh', 'Gia Bảo', 'Hải Yến', 'Quốc Việt', 'Mai Chi']
const EM_GIA = Array.from({ length: 60 }, (_, i) => {
  const khoi = [12, 11, 10][i % 3]!
  return {
    sbd: String(11010 + i), hoTen: i === 7 ? '' : `${HO[i % HO.length]} ${TEN[i % TEN.length]}`, namSinh: String(2021 - khoi), lop: khoi === 12 ? '12A1' : khoi === 11 ? '11B' : '10C',
    trangThai: i === 9 ? 'ngoai_danh_sach' : 'trong_danh_sach', soCa: i % 5, diemGanNhat: i % 4 === 3 ? null : Math.round((5 + ((i * 7) % 50) / 10) * 4) / 4, caGanNhat: '', nopGanNhat: '',
  }
})
const HOC_PHI_GIA = EM_GIA.map((e, i) => ({ sbd: e.sbd, phaiNop: 4_500_000, daNop: i % 3 === 0 ? 4_500_000 : i % 3 === 1 ? 3_000_000 : 0, ghiChu: '', soLan: i % 3 === 2 ? 0 : 1 }))
const phutTruoc = (p: number) => new Date(now - p * 60_000).toISOString()
const CA_GIA = [
  { maCa: 'DH-12-C2-B6', tenCa: 'Kiểm tra Ester 12A1', lop: '12A1', thoiGianPhut: 45, moLuc: phutTruoc(12), batDau: phutTruoc(12), hetHanVao: new Date(now + 30 * 60_000).toISOString(), trangThai: 'mo', phamVi: 'tu_do', congBo: 'ca_lop_xong', loai: 'thi', hanNop: '', lenBang: true, daVao: 36, daNop: 12, canhBao: 0 },
  { maCa: 'DH-11-C1-A2', tenCa: 'Kiểm tra 15 phút 11B', lop: '11B', thoiGianPhut: 15, moLuc: '2026-10-07T02:00:00Z', batDau: '2026-10-07T02:00:00Z', hetHanVao: '2026-10-07T02:20:00Z', trangThai: 'dong', phamVi: 'tu_do', congBo: 'ngay', loai: 'thi', hanNop: '', lenBang: true, daVao: 28, daNop: 28, canhBao: 1 },
]
const CAU_HOI_GIA = [0, 1, 2].map((i) => ({ maCa: 'DH-11-C1-A2', tenCa: 'Kiểm tra 15 phút 11B', sbd: String(11011 + i * 3), hoTen: EM_GIA[1 + i * 3]!.hoTen, qids: ['Q3'], ghiChu: '', guiLuc: '2026-10-07T03:00:00Z', daChua: i === 2, chuaLuc: '' }))

const DANG_CDL = ['Khái niệm ester', 'Thuỷ phân ester', 'Chất béo', 'Glucose', 'Saccharose', 'Tinh bột', 'Cellulose', 'Amine']
const CDL_GIA = {
  ok: true,
  chienDich: [{ id: 'cd1', ten: 'Hành trình giỏi hoá · Khối 12', hanNop: '9999-12-31', tong: 120 }],
  cau: Array.from({ length: 24 }, (_, i) => ({
    qid: `C${8300 + i}`, chienDichId: 'cd1', stt: 8300 + i, phan: i % 5 === 3 ? 'II' : i % 7 === 6 ? 'III' : 'I', mucDo: i % 3 === 0 ? 'biet' : i % 3 === 1 ? 'hieu' : 'VD',
    tenDang: DANG_CDL[i % DANG_CDL.length], trangThai: i === 0 ? 'thanh_thao' : i % 4 === 1 ? 'can_day_lai' : 'dang_on', lanCuoiDung: i % 3 !== 1, henOn: i % 2 ? '2026-10-12' : null,
    lichSu: [{ ngay: '2026-10-09', dung: i % 3 !== 1, coGoiY: false }],
  })),
}
const CT_GIA = {
  de: { qid: 'C8300', maDe: 'DH-12-C2-B1', version: '1', group: 'g', phan: 'I', text: 'Carbohydrate nào sau đây thuộc loại disaccharide?', choices: ['Saccharose.', 'Glucose.', 'Tinh bột.', 'Fructose.'], ideas: [], hinhAnh: [], tenDang: 'Saccharose', mucDo: 'biet', sao: 1, kienThuc: [] },
  dapAn: 'A',
  loiGiai: { chot: 'Disaccharide thuỷ phân cho hai đơn vị monosaccharide; trong bốn chất chỉ saccharose là disaccharide.', tung_pa: { A: { dung: true, vi_sao: 'Saccharose là disaccharide.' }, B: { dung: false, vi_sao: 'Glucose là monosaccharide.' }, C: { dung: false, vi_sao: 'Tinh bột là polysaccharide.' }, D: { dung: false, vi_sao: 'Fructose là monosaccharide.' } } },
  emTraLoi: 'A',
}
const emGia = (i: number) => ({ dotId: `d${i}`, sbd: EM_GIA[i]!.sbd, hoTen: EM_GIA[i]!.hoTen || EM_GIA[i]!.sbd, revision: 1, daHieu: [], traLoi: '0,2 mol', hoi: 'Số mol NaOH phản ứng là bao nhiêu?', soVongHoTro: 2 })
const BUOC_CUOI_GIA = [
  { id: 'bc-1', lop: '12A1', qid: 'DH-12-C1-B2-31', buocId: 'b3', tieuDe: 'Câu 31 · Bảo toàn khối lượng khi xà phòng hoá', maLoi: null, diemVuong: 'Quên cộng khối lượng H2O sinh ra vào vế sau', cauGoc: { phan: 'III', text: 'Xà phòng hoá hoàn toàn m gam chất béo…' }, buoc: [], em: [0, 3, 6].map(emGia), guiLuc: 1 },
]
const nhomNutGia = (khoa: string, qidMau: string, so: string, buoc: number, soEm: number, nhanNen: string, nhieuEmVuong = false) => ({ khoa, bam: khoa, buoc, qidMau, so, de: '<p>Cho m gam Fe tác dụng với HNO₃ loãng dư…</p>', chuBuoc: 'Bảo toàn electron: 3x = 0,4', nhanNen, cauKiemHoi: 'Số mol electron nhận là bao nhiêu?', soEm, em: Array.from({ length: soEm }, (_, i) => ({ sbd: EM_GIA[i * 3]!.sbd, hoTen: EM_GIA[i * 3]!.hoTen || EM_GIA[i * 3]!.sbd, dapAnChon: 'B', kiem: [], viet: '', soLanThu: 2, guiLuc: 'x' })), soCauCungChuyenDe: 0, hanGanNhat: null, diem: soEm, nhieuEmVuong })
const NUT_THAT_GIA = {
  ok: true,
  nhom: [nhomNutGia('BAM17|1', 'DH-12-C1-B2-17', 'Câu 17', 1, 2, 'Thuỷ phân ester'), nhomNutGia('BAM6|2', 'DH-12-C3-B1-6', 'Câu 6', 2, 4, 'Bảo toàn electron', true)],
  cungNen: [{ nen: 'Bảo toàn electron', soEm: 4, soCau: 2, khoa: ['BAM6|2'] }],
  kemRieng: [{ sbd: EM_GIA[4]!.sbd, hoTen: EM_GIA[4]!.hoTen, qid: 'DH-12-C1-B2-17', buoc: 1, so: 'Câu 17', chuBuoc: 'Đổi đơn vị' }],
  tong: { soThe: 7, soNhom: 2, theNgayDongNhat: 4, quaTai: false },
}

const fetchGoc = window.fetch.bind(window)
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  const u = new URL(url, location.href)
  if (u.origin === location.origin && !u.pathname.startsWith('/game-v2/') && !u.pathname.startsWith('/hs/') && !u.pathname.startsWith('/gv/') && !u.pathname.endsWith('cau-hinh.json')) return fetchGoc(input, init)
  const tra = (o: unknown) => new Response(JSON.stringify(o), { status: 200, headers: { 'content-type': 'application/json' } })
  if (u.pathname.endsWith('cau-hinh.json')) return tra({ mayChuMoi: 'https://may-chu-gia.example.com' })
  let b: Record<string, unknown> = {}
  try { b = init?.body ? JSON.parse(String(init.body)) : {} } catch { /* bỏ qua */ }
  if (u.pathname.includes('vang-xem') || b.action === 'vang-xem' || b.lenh === 'vang-xem') return tra({ ok: true, bat: true, vang: 340, ongNghiem: 1200, giuLai: 200, chuoiNgay: 12, doiToiDa: 10 })
  if (b.action === 'danhSachEm' || u.pathname.endsWith('/em/danh-sach')) return tra({ ok: true, items: EM_GIA })
  // ═══ MỘT TRANG GV 26/10: `&mg=dai` = danh sách dài hơn bản vẽ — thêm 3 ca đang mở ⇒ 6 việc cần thầy (thấy cắt 4 việc + «Xem đủ 6 việc», trang vẫn không cuộn). ═══
  if (b.action === 'danhSachCa' && thamSo.get('mg') === 'dai')
    return tra({ ok: true, items: [...CA_GIA, ...['11A2', '10A1', '12A2'].map((lop, i) => ({ ...CA_GIA[0]!, maCa: `MG-${i}`, tenCa: `Kiểm tra nhanh ${lop}`, lop, daVao: 30 + i, daNop: 5 * i }))] })
  // ═══ hết MỘT TRANG GV 26/10
  // ═══ NGANG GV 26/10: `&ca=0` = không ca nào đang mở (Hôm nay hiện nút «Bổ sung bài hôm nay») · `&ca=nhieu` = 14 ca, tên dài, mã 6 số (như ảnh thầy chụp)
  if (b.action === 'danhSachCa' && thamSo.get('ca') === '0') return tra({ ok: true, items: b.daXoa ? [] : CA_GIA.filter((c) => c.trangThai !== 'mo') })
  if (b.action === 'danhSachCa' && thamSo.get('ca') === 'nhieu') return tra({ ok: true, items: b.daXoa ? [] : [...CA_GIA, ...Array.from({ length: 12 }, (_, i) => ({ ...CA_GIA[1]!, maCa: String(844396 + i), tenCa: i % 3 === 0 ? `LD${i + 3} - Doll · Kiểm tra cuối chương Este – Lipit lớp tăng cường` : `Kiểm tra 15 phút ${i % 2 ? '12A2' : '11B'}`, lop: i % 2 ? '12A2' : '11B', moLuc: phutTruoc(60 * 24 * (i + 1)), batDau: phutTruoc(60 * 24 * (i + 1)), daVao: 28 + i, daNop: 27 + i, canhBao: i % 4 }))] })
  // ═══ hết NGANG GV 26/10
  if (b.action === 'danhSachCa') return tra({ ok: true, items: b.daXoa ? [] : CA_GIA })
  if (b.action === 'danhSachCauHoi') return tra({ ok: true, items: CAU_HOI_GIA })
  if (u.pathname.endsWith('/gv/hoc-phi/ds')) return tra({ ok: true, items: HOC_PHI_GIA })
  // Hành trình › Cần thầy chữa (trung tu 09/10 tối): bước cuối trên lớp + thẻ nút thắt GIẢ (tên em giả).
  if (u.pathname.endsWith('/gv/chua-cau-sai/hang-chieu')) return tra({ ok: true, bat: true, conNua: false, ds: BUOC_CUOI_GIA })
  if (u.pathname.endsWith('/gv/nut-that/ds')) return tra(NUT_THAT_GIA)
  // «Trong» nhóm 4: Duyệt lời giải mở sẵn đề 12-KT-C1-D4 (28 câu: 15 đã duyệt · 9 chờ duyệt, 5 sạch · 2 máy đang soạn · 2 chờ sửa kho)
  if (u.pathname.endsWith('/gv/loi-giai/cho-duyet')) return tra({ ok: true, maDe: '12-KT-C1-D4', cau: cauDuyetGia(), tong: { cau: 28, daDuyet: 15, choDuyet: 9, sach: 5, dangSoan: 2, traLai: 0, truot: 2, chuaCoBo: 0 } })
  if (MOT_PH) { const r = traMotPh(u.pathname); if (r) return tra(bienThePh(u.pathname, r)) } // ═══ PH CHỈ ĐỌC 26/10
  // ---- LÀN PHỤ HUYNH 12/10 (khối riêng): `/ph/con-tong-quan` GIẢ — `&tq=loi` ⇒ máy chủ lỗi (khối Gợi ý nhắc con hiện lý do + Thử lại).
  if (u.pathname.endsWith('/ph/con-tong-quan')) return thamSo.get('tq') === 'loi'
    ? new Response(JSON.stringify({ ok: false, error: 'Máy chủ đang bận. Anh/chị thử lại sau ít phút.' }), { status: 500, headers: { 'content-type': 'application/json' } })
    : tra(conTongQuanGia())
  // ---- hết khối LÀN PHỤ HUYNH 12/10
  if (u.pathname.endsWith('/ph/tat-ca-ve-con')) return tra(PH_OK)
  if (u.pathname.endsWith('/ph/hoc-2')) return tra({ ok: true, cheDo2: true, ngay: '2026-10-09', homNay: { tong: 30, daLam: 12 } })
  // App phụ huynh (trung tu 09/10): một nhận xét đã công bố để ảnh có thẻ "Nhận xét của thầy" ở Hôm nay và màn con `#loi-thay`.
  if (u.pathname.endsWith('/ph/loi-thay')) return tra({ ok: true, nhanXet: [{ maCa: 'CA-2', tenCa: 'Kiểm tra 45 phút · Ester – Lipid', noiDung: 'Con làm tốt phần lý thuyết ester. Bài đốt cháy hỗn hợp con còn nhầm bước bảo toàn nguyên tố, thầy sẽ chữa cùng con ở buổi tới.', capNhatLuc: '2026-09-20T01:00:00Z', nopLuc: '2026-09-19T02:12:00Z', tong: 7.5 }] })
  // Câu đã làm (09/10): 24 câu để danh sách cột trái đủ dài mà cuộn — tái hiện lỗi thẻ chồng chữ ở bố cục ngang.
  if (u.pathname.endsWith('/hoa2-cau-da-lam')) return tra(CDL_GIA)
  if (u.pathname.endsWith('/game-v2/hoc-tap-start')) return tra({ ok: true, id: 's1', questions: CAU_HOC })
  if (u.pathname.endsWith('/game-v2/answer')) return tra({ correct: false, answer: 'A', solution: null })
  if (u.pathname.endsWith('/hoa2-cau-chi-tiet')) return tra({ ok: true, cau: [CT_GIA] })
  // Cùng gỡ câu này (10/10): thầy gửi ảnh chữ chìm trên nền xanh than ở trạng thái chờ bài luyện.
  if (u.pathname.endsWith('/hs/chua-cau-sai/mo-dot')) return tra({ ok: true, dotId: 'd1', trangThai: 'thieu_hoc_lieu', coHocLieu: false, revision: 1, tienDo: { soBuocDaQua: 0, soBuocCanKiem: 0 } })
  if (u.pathname.endsWith('/hs/chua-cau-sai/phat-item')) return tra(thamSo.get('go') === 'buoc'
    ? { ok: true, dotId: 'd1', trangThai: 'dang_chua_buoc', revision: 2, tienDo: { soBuocDaQua: 1, soBuocCanKiem: 3 },
        tienDoChiTiet: [{ buocId: 'b1', tieuDe: 'Viết phương trình thuỷ phân', trangThai: 'da_qua' }, { buocId: 'b2', tieuDe: 'Tính số mol NaOH', trangThai: 'dang_lam' }, { buocId: 'b3', tieuDe: 'Bảo toàn khối lượng', trangThai: 'chua' }],
        cauGoc: { phan: 'I', text: 'Thuỷ phân hoàn toàn 8,8 gam etyl axetat bằng dung dịch NaOH vừa đủ. Khối lượng muối thu được là' },
        item: { id: 'it1', loai: 'phan_biet', buocSo: 2, tieuDe: 'Tính số mol NaOH', kieu: 'chon', hoi: 'Số mol NaOH phản ứng bằng bao nhiêu?', luaChon: [{ ky: 'A', noi: '0,05 mol' }, { ky: 'B', noi: '0,1 mol' }, { ky: 'C', noi: '0,2 mol' }, { ky: 'D', noi: '0,15 mol' }] } }
    : { ok: true, dotId: 'd1', trangThai: 'thieu_hoc_lieu', coHocLieu: false, revision: 1, tienDo: { soBuocDaQua: 0, soBuocCanKiem: 0 } })
  // Tấm Lịch sử làm câu của một em (09/10 khuya) — app thầy gọi qua `goiLenh` (bản chụp đã thay bằng gia/goi-lenh-thay.ts, cùng dữ liệu này);
  // giữ thêm đường `fetch` để mọi lối gọi thẳng cũng nhận dữ liệu giả, không chạm máy chủ thật.
  if (u.pathname.endsWith('/gv/lich-su-lam-cau')) return tra(lichSuGia(String(b.sbd ?? ''), 'Trần Đức Huy'))
  // ---- LÀN HÔM NAY 12/10B: Nhịp học (app thầy gọi qua `goiLenh` giả — gia/goi-lenh-thay.ts; giữ thêm đường `fetch` cùng dữ liệu)
  if (u.pathname.endsWith('/gv/nhip-hoc')) { const r = nhipHocGia(); return r.ok ? tra(r.du) : new Response(JSON.stringify({ ok: false, error: r.chu }), { status: 500, headers: { 'content-type': 'application/json' } }) }
  // ---- hết LÀN HÔM NAY 12/10B
  // ---- «TRONG» NHÓM 3: điện thoại điều khiển máy chiếu (`?man=gv-chieu&remote=PHIEN1`) — phiên giả 20 đợt, đang ở đợt 7
  if (u.pathname.endsWith('/gv/to-chieu/phien')) return tra({ ok: true, phien: PHIEN_CHIEU_GIA })
  if (u.pathname.endsWith('/gv/to-chieu/trang-thai')) return tra({ ok: true, dotHienTai: 6, tongSoDot: 20, pha: 'cho', loiGiaiMo: false, daCham: {} })
  // ---- LÀN GIÁO VIÊN 12/10: Bài hằng ngày + hồ sơ thái độ (app thầy gọi qua `goiLenh` giả; giữ thêm đường `fetch` như trên)
  if (u.pathname.endsWith('/gv/bai-hang-ngay')) return tra(baiHangNgayGia())
  if (u.pathname.endsWith('/gv/ho-so-thai-do')) return tra(hoSoThaiDoGia(String(b.sbd ?? '')))
  // ---- hết LÀN GIÁO VIÊN 12/10
  // ---- LÀN BÀI MỚI 7 NGÀY 12/10: app thầy gọi qua `goiLenh` giả (gia/goi-lenh-thay.ts); giữ thêm đường `fetch` cùng dữ liệu như các làn trên
  if (u.pathname.endsWith('/gv/goi-bai-7')) return tra(goi7Du(b))
  // ---- hết LÀN BÀI MỚI 7 NGÀY 12/10
  return tra({ ok: true })
}

function manSanh(du: Record<string, unknown> | null, them: Record<string, unknown> = {}) {
  return h(HocTapHomNay, {
    ten: 'Minh Anh', lop: '12A1', ketQua: du ? (docSanh(du) as KetQuaSanh) : null, loi: '', dangTai: !du,
    coCa: them.caDangMo === true, onHoc: noop, onXemLai: noop, onChua: noop, onThi: noop,
    onTuLuyen: noop, onLichSu: noop, onBaiTap: noop, onGiaDinh: noop, onDangXuat: noop, onTaiLai: noop,
  })
}

// ═════════════════════════════════════════ LÀN HỌC SINH 12/10 ═════════════════════════════════════════
// Thầy 12/10: "trùng tu lại giao diện mục tu luyện của app học sinh, bỏ phần những câu cần gỡ, thay những từ đảo đoàn, bia bằng những từ
// phù hợp, mục chữa lỗi hiển thị cho thật chuẩn để học sinh chữa lỗi được". Cảnh `?man=hs12-*` (component THẬT, máy chủ GIẢ riêng — bọc
// `fetch` ở trên, chỉ trả lời khi đang chụp cảnh hs12; mọi cảnh khác đi tiếp bộ giả chung):
//   hs12-tu-luyen        Tu luyện (màn chọn cách luyện, kho câu sai theo nguồn)
//   hs12-chua-truc-tiep  Cùng gỡ câu này ở trạng thái thiếu bài luyện từng bước ⇒ Chữa trực tiếp câu gốc
//   hs12-chua-gap-lai    Chờ lần gặp lại 2 (giờ · thứ · ngày hẹn)
//   hs12-tu-chua         Danh sách Tự chữa lỗi (tên câu + trạng thái bằng chữ)
const HS12_KHO = { tong: 14, tuCa: 6, tuChienDich: 8, tuLuyenDe: 0, tuTuLuyen: 0, loi: '', tongTuMoc: 20, daKhacPhuc: 6, toiHan: 2, choHen: 3,
  theoNguon: { ca: 6, dao: 5, doan: 4, bia: 2, tu_luyen: 0, luyen_de: 0 }, theoMat: { 1: 5, 3: 1, 2: 3, 4: 3, 6: 1, 8: 1 } }
const HS12_DANH_MUC = [{ lop: '12', bais: [
  { tenBai: 'Bài 1 · Ester – Lipid', dangs: [{ ma: 'DB-ES-1', ten: 'Khái niệm, danh pháp ester', soCau: 40 }, { ma: 'DB-ES-2', ten: 'Thuỷ phân ester', soCau: 36 }, { ma: 'DB-ES-3', ten: 'Chất béo', soCau: 28 }] },
  { tenBai: 'Bài 2 · Carbohydrate', dangs: [{ ma: 'DB-CH-1', ten: 'Glucose và fructose', soCau: 30 }, { ma: 'DB-CH-2', ten: 'Saccharose, tinh bột', soCau: 26 }] },
] }]
const HS12_CT = {
  de: { qid: 'DH-12-C1-B2-17', maDe: 'DH-12-C1-B2', version: '1', group: 'g', phan: 'I', text: 'Thuỷ phân hoàn toàn 8,8 gam ethyl acetate (CH₃COOC₂H₅) bằng dung dịch NaOH vừa đủ. Khối lượng muối thu được là',
    choices: ['8,2 gam.', '6,8 gam.', '9,6 gam.', '4,1 gam.'], ideas: [], hinhAnh: [], tenDang: 'Thuỷ phân ester', mucDo: 'hieu', sao: 1 },
  dapAn: 'A',
  loiGiai: {
    chot: 'Số mol ester bằng 0,1 mol nên muối CH₃COONa thu được là 0,1 mol, nặng 8,2 gam.',
    buoc: ['Tính số mol ethyl acetate: n = 8,8 : 88 = 0,1 mol.', 'Viết phương trình: CH₃COOC₂H₅ + NaOH → CH₃COONa + C₂H₅OH, tỉ lệ 1 : 1.', 'Khối lượng muối: m = 0,1 × 82 = 8,2 gam.'],
    tung_pa: { A: { dung: true, vi_sao: 'Muối là CH₃COONa (M = 82): 0,1 × 82 = 8,2 gam.' }, B: { dung: false, vi_sao: '6,8 gam là khối lượng HCOONa — nhầm gốc acid.' }, C: { dung: false, vi_sao: '9,6 gam là muối C₂H₅COONa — nhầm gốc acid.' }, D: { dung: false, vi_sao: '4,1 gam ứng với 0,05 mol — tính sai số mol ester.' } },
  },
  emTraLoi: 'B',
}
const HS12_CDL = { ok: true, chienDich: [{ id: 'cd1', ten: 'Hành trình giỏi hoá · Khối 12', hanNop: '9999-12-31', tong: 120 }], cau: [
  { qid: 'H12-1', chienDichId: 'cd1', stt: 12, phan: 'I', mucDo: 'hieu', tenDang: 'Thuỷ phân ester', trangThai: 'dang_on', lanCuoiDung: false, henOn: null, lichSu: [{ ngay: '2026-10-10', dung: false, coGoiY: false, nguon: 'dao' }] },
  { qid: 'H12-2', chienDichId: 'cd1', stt: 18, phan: 'III', mucDo: 'VD', tenDang: 'Bài toán đốt cháy chất béo', trangThai: 'dang_on', lanCuoiDung: false, henOn: null, lichSu: [{ ngay: '2026-10-11', dung: false, coGoiY: false, nguon: 'thi' }] },
  { qid: 'H12-3', chienDichId: 'cd1', stt: 21, phan: 'II', mucDo: 'hieu', tenDang: 'Glucose và fructose', trangThai: 'dang_on', lanCuoiDung: false, henOn: null, lichSu: [{ ngay: '2026-10-09', dung: false, coGoiY: true, nguon: 'doan' }] },
  { qid: 'H12-4', chienDichId: 'cd1', stt: 25, phan: 'I', mucDo: 'biet', tenDang: 'Saccharose, tinh bột', trangThai: 'dang_on', lanCuoiDung: false, henOn: null, lichSu: [{ ngay: '2026-10-08', dung: false, coGoiY: false, nguon: 'bia' }] },
  { qid: 'H12-5', chienDichId: 'cd1', stt: 30, phan: 'I', mucDo: 'hieu', tenDang: 'Khái niệm, danh pháp ester', trangThai: 'thanh_thao', lanCuoiDung: true, henOn: null, lichSu: [{ ngay: '2026-10-05', dung: false, coGoiY: false, nguon: 'dao' }, { ngay: '2026-10-07', dung: true, coGoiY: false, nguon: 'dao' }] },
] }
const HS12_DS_CHUA = [
  { dotId: 'd1', qid: 'H12-1', trangThai: 'thieu_hoc_lieu' },
  { dotId: 'd2', qid: 'H12-2', trangThai: 'dang_chua_buoc' },
  { dotId: 'd3', qid: 'H12-3', trangThai: 'can_thay' },
  { dotId: 'd4', qid: 'H12-4', trangThai: 'cho_gap_lai_2', denHan: new Date(now + 20 * 3600_000).toISOString() },
  { dotId: 'd5', qid: 'H12-5', trangThai: 'da_tu_sua' },
]
// hs12-tu-luyen-lam: bài Tu luyện đang làm dở (máy em giữ trong localStorage — chỉ câu công khai, không đáp án) ⇒ màn làm bài mở thẳng.
if (man === 'hs12-tu-luyen-lam') {
  const cau = [
    { qid: 'L1', phan: 'I', text: 'Thuỷ phân hoàn toàn 8,8 gam ethyl acetate bằng dung dịch NaOH vừa đủ. Khối lượng muối thu được là', luaChon: ['8,2 gam.', '6,8 gam.', '9,6 gam.', '4,1 gam.'], tenDang: 'Thuỷ phân ester', sao: 1, loai: 'bai_tap', nhanLuyen: 'Luyện lại lần 2', saiGoc: 'Sai gốc: Chiến dịch Ôn ester · Đoàn Hộ Tống · 10/10', conMotLan: 'Còn 1 lần đúng nữa là khắc phục' },
    { qid: 'L2', phan: 'II', text: 'Cho các phát biểu về chất béo:', luaChon: ['Chất béo là triester của glycerol với acid béo.', 'Tristearin ở thể lỏng ở nhiệt độ thường.', 'Chất béo không tan trong nước.', 'Thuỷ phân chất béo trong môi trường kiềm gọi là phản ứng xà phòng hoá.'], tenDang: 'Chất béo', sao: 0, loai: 'ly_thuyet', nhanLuyen: 'Luyện lần đầu', saiGoc: 'Sai gốc: Bi-a · 09/10' },
    { qid: 'L3', phan: 'III', text: 'Lên men 45 gam glucose với hiệu suất 80%. Thể tích khí CO₂ (đkc, lít) thu được là bao nhiêu?', luaChon: null, tenDang: 'Glucose và fructose', sao: 2, loai: 'bai_tap', nhanLuyen: 'Luyện lần đầu', saiGoc: 'Sai gốc: Ca kiểm tra Carbohydrate · 11/10' },
  ]
  try { localStorage.setItem('ddh.tuluyen.dang.12121212', JSON.stringify({ luotId: 'tl_hs12', cheDo: 1, tieuDe: 'Sửa câu sai · 3 câu', taoLuc: now, cau, traLoi: { L1: 'B' }, giay: 95, giayCau: {}, coGoiY: [] })) } catch { /* bỏ qua */ }
}
if (man.startsWith('hs12-')) {
  const fetchChung = window.fetch
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const p = new URL(url, location.href).pathname
    const tra = (o: unknown) => new Response(JSON.stringify(o), { status: 200, headers: { 'content-type': 'application/json' } })
    if (p.endsWith('/hs/tu-luyen/nguon')) return tra({ ok: true, cacCa: [], soCauSai: 14, danhMuc: HS12_DANH_MUC, dangThi: false, khoCauSai: HS12_KHO,
      dangCauSai: { kieu: 'cau_sai', nhan: 'Theo câu sai của em' }, tuDo: { kieu: 'cau_sai', nhan: 'Theo câu sai của em' }, dangNenLuyen: null })
    if (p.endsWith('/hs/tu-luyen/tong-hop')) return tra({ ok: true, luot: [], cau: [], luyenDe: [], khacPhuc: null })
    if (p.endsWith('/hs/tu-luyen/xem-truoc')) return tra({ ok: true, tongToiDa: 40, loi: '', thongKe: [{ tenDang: 'Thuỷ phân ester', soCauSai: 4, soUngVien: 36 }], nguonDang: { kieu: 'cau_sai', nhan: 'Theo câu sai của em', loi: '' } })
    if (p.endsWith('/luyen-de/dieu-kien')) return tra({ ok: true, trangThai: 'mo', lyDo: '', items: [] })
    if (p.endsWith('/hs/chua-cau-sai/co')) return tra({ ok: true })
    if (p.endsWith('/hs/chua-cau-sai/danh-sach')) return tra({ ok: true, ds: HS12_DS_CHUA })
    if (p.endsWith('/hs/chua-cau-sai/mo-dot')) return tra({ ok: true, dotId: 'd1', trangThai: 'thieu_hoc_lieu', coHocLieu: false })
    if (p.endsWith('/hs/chua-cau-sai/phat-item')) return tra({ ok: true, dotId: 'd1', revision: 1, tienDo: { soBuocDaQua: 0, soBuocCanKiem: 0 }, tienDoChiTiet: [], cauGoc: null, item: null,
      ...(man === 'hs12-chua-gap-lai' ? { trangThai: 'cho_gap_lai_2', denHan: new Date(now + 20 * 3600_000).toISOString() } : { trangThai: 'thieu_hoc_lieu' }) })
    if (p.endsWith('/hoa2-cau-chi-tiet')) return tra({ ok: true, cau: [HS12_CT] })
    if (p.endsWith('/hoa2-cau-da-lam')) return tra(HS12_CDL)
    return fetchChung(input, init)
  }
}
// ═════════════════════════════════════════ LÀN THẦY TỰ CHỮA 12/10 ═════════════════════════════════════════
// Thầy 12/10: "mục cần chữa cho tôi một phần tự chữa, phần này cho tôi chọn đề trong Mục dạy học … chiếu lên máy chiếu, ưu tiên đẩy câu đúng sai và tính
// toán lên đầu …". Cảnh `?man=gv-nhip&the=can-chua&ttc=1` (component THẬT): kho trên máy thêm Bài 6 · Tinh bột và cellulose (khối 12, ba tờ); lớp có SBD
// (gia/goi-lenh-thay.ts); `/gv/thong-ke-lop-cau` + `/gv/ai-sai-cau` GIẢ tất định (bọc `fetch`, chỉ khi đang chụp cảnh ttc).
if (LA_TTC) {
  if (!KHO.some((s) => s.maDe === BAI_TTC.maDe)) KHO.push(BAI_TTC)
  const fetchChung = window.fetch
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const p = new URL(url, location.href).pathname
    const tra = (o: unknown) => new Response(JSON.stringify(o), { status: 200, headers: { 'content-type': 'application/json' } })
    let b: Record<string, unknown> = {}
    try { b = init?.body ? JSON.parse(String(init.body)) : {} } catch { /* bỏ qua */ }
    if (p.endsWith('/gv/thong-ke-lop-cau')) return tra({ ok: true, cau: Object.fromEntries((Array.isArray(b.qid) ? (b.qid as string[]) : []).map((q) => [q, soGopTtc(q)])) })
    if (p.endsWith('/gv/ai-sai-cau')) return tra(aiSaiTtc(String((b.qids as string[] | undefined)?.[0] ?? '')))
    return fetchChung(input, init)
  }
}
// ═════════════════════════════════════════ hết LÀN THẦY TỰ CHỮA 12/10 ═════════════════════════════════════════
// ═════════════════════════════════════════ LÀN CHỮA BÀI 12/10B ═════════════════════════════════════════
// Thầy 12/10: "… thu gọn tối giản hết lại thành 2 mục …" · "chữa câu khó và tính toán cũng phải chiếu lên bảng theo chuẩn nhé". Cảnh `cb=1` đi cùng `ttc=1`
// (kho có Bài 6 khối 12, lớp 12A1 có SBD, `/gv/thong-ke-lop-cau` giả); thiếu `ttc=1` thì nạp bài giả ở đây. Lệnh `/gv/ai-sai-nhieu-cau` + `/gv/buoi-hoc`
// gan-day trả ở gia/chua-bai.ts.
if (LA_CB && !KHO.some((s) => s.maDe === BAI_TTC.maDe)) KHO.push(BAI_TTC)
// ═════════════════════════════════════════ hết LÀN CHỮA BÀI 12/10B ═════════════════════════════════════════
const manHs12 = () =>
  man === 'hs12-tu-luyen' || man === 'hs12-tu-luyen-lam' ? h(ManTuLuyen, { token: 'tk', sbd: '12121212', onVe: noop })
  : man === 'hs12-tu-chua' ? h(ManTuChua, { token: 'tk', onVe: noop, onTuLuyen: noop })
  : h(ManChuaCauSai, { token: 'tk', qid: 'DH-12-C1-B2-17', tenCau: 'Thuỷ phân ester', onVe: noop })
// ═════════════════════════════════════════ hết LÀN HỌC SINH 12/10 ═════════════════════════════════════════
// ═════════════════════════════════════════ LÀN NHỊP EM 12/10C ═════════════════════════════════════════
// Thầy 12/10 duyệt bản vẽ HS-Cham / HS-Luoi: bảng "Nhịp học của em · từ 01/10" đầu màn Hôm nay của app học sinh. Cảnh `?man=hs-nhip&nhe=cham|luoi|
// luoi-thoat|chua-deu|chua-du|loi` (component THẬT HocTapHomNay có token, `/hs/nhip-hoc` GIẢ đúng số bản vẽ: gia/nhip-hoc-em.ts — bọc `fetch`, chỉ trả
// lời khi đang chụp cảnh hs-nhip; mọi cảnh khác đi tiếp bộ giả chung).
if (man === 'hs-nhip') {
  const fetchChung = window.fetch
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    if (new URL(url, location.href).pathname.endsWith('/hs/nhip-hoc')) {
      const r = nhipEmGia(thamSo.get('nhe'))
      return new Response(JSON.stringify(r), { status: r.ok ? 200 : 500, headers: { 'content-type': 'application/json' } })
    }
    return fetchChung(input, init)
  }
}
// Khối Hôm nay chính dưới bảng dùng CÙNG số câu hôm nay với bảng (bộ giả) — ảnh không hiện hai con số lệch nhau.
const homNhe = (() => { const k = nhipEmGia(thamSo.get('nhe')); return k.ok && k.homNayMuc ? k.homNayMuc : { muc: 30, lam: 12 } })()
const SANH_NHE = { ...SANH_MOI, hanhTrinh: { ...SANH_MOI.hanhTrinh, toiThieu: homNhe.muc, daLam: homNhe.lam, daXep: homNhe.muc, changHienTai: Math.min(5, Math.floor(homNhe.lam / 6) + 1) },
  theLuc: { con: Math.max(0, homNhe.muc - homNhe.lam), tong: homNhe.muc }, ruong: { ...SANH_MOI.ruong, daLam: homNhe.lam, tong: homNhe.muc } }
const manNhipEm = () =>
  h(HocTapHomNay, { ten: thamSo.get('nhe')?.startsWith('luoi') ? 'Ngọc Ánh' : 'Minh Anh', lop: '12A1', ketQua: { cheDo2: true, sanh: SANH_NHE } as never, dangTai: false, loi: '', coCa: false, token: 'tk',
    onHoc: noop, onXemLai: noop, onChua: noop, onThi: noop, onTuLuyen: noop, onLichSu: noop, onBaiTap: noop, onGiaDinh: noop, onTaiLai: noop, onDangXuat: noop, onKetQua: noop, onBangTin: noop, onLuyenLai: noop })
// ═════════════════════════════════════════ hết LÀN NHỊP EM 12/10C ═════════════════════════════════════════
// ═════════════════════════════════════════ LÀN THẺ HÔM NAY 12/10E ═════════════════════════════════════════
// Thầy 12/10: "gộp 2 phần làm bài này vào làm một … tập trung vào việc nhắc học sinh làm bao nhiêu câu". Cảnh `?man=hs-the&the=luoi|cham|chua-deu|du|loi`
// (component THẬT HocTapHomNay, token 'tk'; `&hs=0` = không truyền onMoHoSo). Sảnh giả: Gói 7 "Bài 8. Amine" (Lười đúng ảnh thầy: 7/32 · 25 câu tự làm ·
// 0 câu học có hỗ trợ · 6 chặng) hoặc Hành trình (Chăm). `/hs/nhip-hoc` GIẢ (bọc `fetch`, chỉ cảnh hs-the) cố ý giữ số hôm nay CŨ (vd Lười 0/30) để ảnh chứng
// minh thẻ dùng số của Sảnh (MỘT con số); `loi` ⇒ máy chủ 500 ⇒ phần Nhịp học ẩn gọn.
const THE_1210E = thamSo.get('the') ?? 'luoi'
const goi7The = (muc: number, lam: number, tuLam: number, hoTro: number) => ({
  bat: true, ngay: '2026-10-12', toiThieu: muc, daLamHomNay: lam, tuLamCon: tuLam, tiepCanCon: hoTro, thieuPhu: 0, thieuNgay: 0, canHoTro: false,
  kienThucCu: { tong: 0, dat: 0, tyLe: null }, diemDaDo: [],
  goi: [{ id: 'g7:amine', ten: 'Bài 8. Amine', batDau: '2026-10-11', han: '2026-10-16', tong: 164, daGap: 8 + lam, con: 156 - lam, quota: 32, gapHomNay: Math.min(lam, 8), quaHan: false, canBoSung: 0, to: ['DH-B8-TN'] }],
})
const NHIP_1210E = THE_1210E === 'loi' ? null
  : THE_1210E === 'cham' || THE_1210E === 'du' ? NHIP_EM_CHAM
  : THE_1210E === 'chua-deu' ? NHIP_EM_CHUA_DEU
  : { ...NHIP_EM_LUOI, tocDo: { soNhanh: 28, soCoGiay: 50, dungNhanh: 43, coTuTinh: true, muc: 'xau' as const } }
if (man === 'hs-the') {
  const fetchChung = window.fetch
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    if (new URL(url, location.href).pathname.endsWith('/hs/nhip-hoc')) {
      const r = NHIP_1210E ?? { ok: false, error: 'Chưa tải được nhịp học của em.' }
      return new Response(JSON.stringify(r), { status: NHIP_1210E ? 200 : 500, headers: { 'content-type': 'application/json' } })
    }
    return fetchChung(input, init)
  }
}
const SANH_1210E =
  THE_1210E === 'cham' ? { ...SANH_MOI, hanhTrinh: { ...SANH_MOI.hanhTrinh, tang: 2, toiThieu: 30, daLam: 18, daXep: 30, soChang: 5, changHienTai: 4 }, theLuc: { con: 12, tong: 30 } }
  : THE_1210E === 'du' ? { ...SANH_MOI, chienDich: null, goi7: goi7The(30, 31, 0, 0), theLuc: { con: 6, tong: 37 } }
  : THE_1210E === 'chua-deu' ? { ...SANH_MOI, chienDich: null, goi7: goi7The(30, 5, 19, 6), theLuc: { con: 25, tong: 30 } }
  : { ...SANH_MOI, chienDich: null, goi7: goi7The(32, 7, 25, 0), theLuc: { con: 25, tong: 32 } }
const manTheHomNay = () =>
  h(HocTapHomNay, { ten: 'Đỗ Đại Học', lop: '12 - Lớp Thường', ketQua: { cheDo2: true, sanh: SANH_1210E } as never, dangTai: false, loi: '', coCa: false, token: 'tk',
    onMoHoSo: thamSo.get('hs') === '0' ? undefined : noop,
    onHoc: noop, onXemLai: noop, onChua: noop, onThi: noop, onTuLuyen: noop, onLichSu: noop, onBaiTap: noop, onGiaDinh: noop, onTaiLai: noop, onDangXuat: noop, onKetQua: noop, onBangTin: noop, onLuyenLai: noop })
// ═════════════════════════════════════════ hết LÀN THẺ HÔM NAY 12/10E ═════════════════════════════════════════
// ═════════════════════════════════════════ LÀN MÀN LÀM BÀI 12/10D ═════════════════════════════════════════
// Thầy 12/10 duyệt bản vẽ dot13 (màn làm bài học sinh: Đúng–sai · Trắc nghiệm · Trả lời ngắn 4 ô + bàn phím số · câu mới tự làm / học cách giải ·
// phản hồi sai / đúng · xong chặng). Cảnh `?man=lam13[&lam=g7|ds-dau]`: component THẬT ManLamBaiTap trong ĐÚNG lớp bọc cuộn của cổng học sinh
// (StudentPortalScreen: `fixed inset-0 z-50 overflow-y-auto`); máy chủ giả gia/lam-bai-1210d.ts (bọc `fetch`, chỉ trả lời khi đang chụp cảnh lam13);
// "đã làm/M câu hôm nay" tải lại sau mỗi câu như `hoa2.taiLai`.
if (LA_LAM13) {
  const fetchChung = window.fetch
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    let b: Record<string, unknown> = {}
    try { b = init?.body ? JSON.parse(String(init.body)) : {} } catch { /* bỏ qua */ }
    // NỘP TỨC THÌ 27/10: `&cho=1` ⇒ lệnh answer không trả lời (máy chấm đang bận) — chụp nút «Kiểm tra» ở trạng thái chờ.
    if (thamSo.get('cho') === '1' && new URL(url, location.href).pathname.endsWith('/game-v2/answer')) return new Promise<Response>(() => {})
    const r = traLoiLam13(new URL(url, location.href).pathname, b)
    return r ? new Response(JSON.stringify(r), { status: 200, headers: { 'content-type': 'application/json' } }) : fetchChung(input, init)
  }
}
function ManLam13() {
  const [homNay, datHomNay] = useStateLam13(soHomNayLam13())
  return h('div', { className: 'fixed inset-0 z-50 overflow-y-auto' }, h(ManLamBaiTap, { token: 'tk', sbd: '12121212', onVe: noop, onCapNhat: () => datHomNay(soHomNayLam13()), onChua: noop, homNay }))
}
// ═══ DUO 26/10: `lam13&lam=duo` — phiên học sinh giả trên máy (nút Hỏi thầy / Lời giải từng bước chỉ hiện khi có phiên; lệnh hỏi thầy đi bộ giả chung).
// ═══ KIỂM GD MỚI 26/10: `lam13&lam=duo-xau` (dữ liệu xấu, gia/lam-bai-1210d.ts) cũng có phiên học sinh giả như `duo`.
// GIÁM THỊ 27/10: `&gtloi=1` ⇒ ngẫu nhiên luôn 0: giám thị chắc chắn càu nhàu (câu đầu kho) để chụp và đo bong bóng không chồng chữ.
if (LA_LAM13 && thamSo.get('gtloi') === '1') Math.random = () => 0
// LỬA 27/10: `&luadien=1` ⇒ lộ các Lửa đang sống ra window.__lua để máy quay điều khiển cảm xúc (video quay từ bản build thật).
if (thamSo.get('luadien') === '1') void import('../../src/components/linh-vat/lua-dong').then((m) => { (window as unknown as { __lua: unknown }).__lua = m.LUA_DANG_SONG })
// GIÁM THỊ NGƯỜI 27/10: `&gtdien=1` ⇒ lộ các giám thị đang sống ra window.__gt để máy quay điều khiển trạng thái (video quay từ bản build thật).
if (LA_LAM13 && thamSo.get('gtdien') === '1') void import('../../src/components/giam-thi/giam-thi-nguoi').then((m) => { (window as unknown as { __gt: unknown }).__gt = m.GT_DANG_SONG })
if (LA_LAM13 && thamSo.get('lam') === 'duo-xau') try { localStorage.setItem('omr_student_portal_auth', JSON.stringify({ token: 'tk', sbd: '12121212' })) } catch { /* bỏ qua */ }
// ═══ hết KIỂM GD MỚI 26/10
if (LA_LAM13 && ['duo', 'duo-nc', 'duo-bang', 'duo-pt', 'duo-tn'].includes(thamSo.get('lam') ?? '')) try { localStorage.setItem('omr_student_portal_auth', JSON.stringify({ token: 'tk', sbd: '12121212' })) } catch { /* bỏ qua */ }
// ═══ DUO APP 26/10: app thật nạp TrongHs (kèm phông riêng ĐĐH Rounded + hiệu ứng Lộ trình, styles/trong-hs.css) ngay lúc mở cổng ⇒ màn làm chặng luôn có phông ấy;
// trang chụp mở thẳng màn làm chặng nên nạp tờ đó tại đây cho giống app thật.
// Phông tròn chỉ bật khi cổng đã vẽ (<html data-ht2> do Hôm nay gắn — app thật luôn gắn Hôm nay dưới màn con) ⇒ trang chụp gắn .ht2 rỗng ẩn + data-ht2.
if (LA_LAM13 && ['duo', 'duo-nc', 'duo-bang', 'duo-pt', 'duo-tn'].includes(thamSo.get('lam') ?? '') && document.documentElement.dataset.trong === 'hs') { void import('../../src/styles/trong-hs.css'); document.body.insertAdjacentHTML('beforeend', '<div class="ht2" hidden></div>'); document.documentElement.setAttribute('data-ht2', '') }
// ═══ hết DUO APP 26/10
// ═══ GIỮ CHÂN 27/10: `lam13&lam=duo&tp=1&giu=1` — bản tổng quan thưởng ở máy như app thật đã nạp lúc mở (chuỗi 12 ngày, hôm nay chưa đạt, mục tiêu 3/4).
import { DUONG as DUONG_TP, docTongQuan as docTqGiu, ghiTam as ghiTamGiu, khoaTam as khoaTamGiu } from '../../src/lib/thuong-api'
import { tongQuanGia as tqGiaGiu, lich7 as lich7Giu } from '../../tests/_thuong-mau'
if (LA_LAM13 && thamSo.get('giu') === '1') {
  const l = lich7Giu(['hoc', 'hoc', 'hoc', 'hoc', 'hoc', 'hoc', 'hoc']).map((x, i, a) => i === a.length - 1 ? { ...x, kieu: 'cho' } : x)
  ghiTamGiu(khoaTamGiu(DUONG_TP.tongQuan, 'tk'), docTqGiu(tqGiaGiu({ chuoiNgay: { so: 12, giuChuoi: 1, sucChua: 2, lich7: l } })))
}
// ═══ hết GIỮ CHÂN 27/10
// ═════════════════════════════════════════ hết LÀN MÀN LÀM BÀI 12/10D ═════════════════════════════════════════
// ═════════════════════════════════════════ LÀN HỒ SƠ EM 12/10F ═════════════════════════════════════════
// Thầy 12/10: "Cho hs bấm vào bảng lười chăm. Khi bấm vào hiển thị đủ hồ sơ như trong nhịp học nhé". Cảnh `?man=hs-ho-so[&nhe=luoi|cham]`: Hôm nay
// của app học sinh (component THẬT HocTapHomNay, bảng Nhịp học phía sau) + tấm "Hồ sơ làm bài của em" (component THẬT HoSoCuaEmHs ⇒ HoSoLamCauEm chế độ
// học sinh) MỞ SẴN như sau khi em bấm bảng. `/hs/nhip-hoc` · `/hs/ho-so-thai-do` · `/hs/lich-su-lam-cau` GIẢ (gia/ho-so-em-hs.ts — qua đúng hàm lọc bản
// học sinh của máy chủ); bọc `fetch`, chỉ trả lời khi đang chụp cảnh này.
import { Fragment as FragmentHse, useState as useStateHse } from 'react'
import HoSoCuaEmHs from '../../src/components/hoc-tap/HoSoCuaEmHs'
import { hoSoEmGia, lichSuEmGia } from './gia/ho-so-em-hs'
if (man === 'hs-ho-so') {
  const fetchChung = window.fetch
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const duong = new URL(url, location.href).pathname
    const nhe = thamSo.get('nhe') ?? 'luoi'
    const du = duong.endsWith('/hs/nhip-hoc') ? nhipEmGia(nhe) : duong.endsWith('/hs/ho-so-thai-do') ? hoSoEmGia(nhe) : duong.endsWith('/hs/lich-su-lam-cau') ? lichSuEmGia(nhe) : null
    return du ? new Response(JSON.stringify(du), { status: 200, headers: { 'content-type': 'application/json' } }) : fetchChung(input, init)
  }
}
function ManHoSoEm() {
  const [mo, datMo] = useStateHse(true)
  const nhe = thamSo.get('nhe') ?? 'luoi'
  return h(FragmentHse, null, manNhipEm(), mo ? h(HoSoCuaEmHs, { token: 'tk', tenEm: nhe.startsWith('luoi') ? 'Ngọc Ánh' : 'Minh Anh', lop: '12A1', onDong: () => datMo(false) }) : null)
}
// ═════════════════════════════════════════ hết LÀN HỒ SƠ EM 12/10F ═════════════════════════════════════════

// ═════════ LÀN «TRONG» HS 26/10: `?man=hs-menu` = Hôm nay (Nhịp học Chăm) + chuông THẬT ThongBaoHocSinh (2 tin chưa đọc, `/notifications/list` GIẢ) —
// chụp menu dọc mép phải thu gọn / mở (`nut:Mở menu`). `&ca=1` = ca đang mở. ═════════
import ThongBaoHocSinh from '../../src/components/ThongBaoHocSinh'
if (man === 'hs-menu' || man === 'hs-sheet') {
  const fetchChung = window.fetch
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const duong = new URL(url, location.href).pathname
    if (duong.endsWith('/notifications/list')) return new Response(JSON.stringify({ ok: true, publicKey: '', items: [
      { id: 'n1', kind: 'btvn', title: 'Bài tập về nhà mới', body: 'Thầy giao 1 bài, hạn 28/10.', created_at: new Date(now - 3600_000).toISOString(), read_at: null },
      { id: 'n2', kind: 'mom', title: 'Lời nhắn từ gia đình', body: 'Mẹ nhắn: con nhớ làm đủ 30 câu nhé.', created_at: new Date(now - 7200_000).toISOString(), read_at: null },
    ] }), { status: 200, headers: { 'content-type': 'application/json' } })
    if (duong.endsWith('/hs/nhip-hoc')) return new Response(JSON.stringify(nhipEmGia('cham')), { status: 200, headers: { 'content-type': 'application/json' } })
    return fetchChung(input, init)
  }
}
import BongBongAiDdh from '../../src/components/ai-ddh/BongBongAiDdh'
import KhoiKhacPhuc3CheDo from '../../src/components/KhoiKhacPhuc3CheDo'
import LuyenDeChuan from '../../src/components/LuyenDeChuan'
import LichSuCaEm from '../../src/components/hoa2/LichSuCaEm'
if (man === 'hs-sheet' && thamSo.get('tam') === 'ai') {
  try { localStorage.setItem('omr-ai-ddh-co', JSON.stringify({ sbd: '12121212', bat: true, luc: Date.now() })) } catch { /* bỏ qua */ }
  const fetchAi = window.fetch
  const TIN_AI = [
    { id: 't1', ben: 'em', chu: 'Cho 5,6 gam Fe tác dụng hết với dung dịch HCl dư, thu được V lít khí H2 (đkc). Giá trị của V là? Em ra 1,2395 lít mà thấy sai sai.', anh: 0, trangThai: 'xong', luc: now - 600_000 },
    { id: 't2', ben: 'vp', chu: 'Bạn chia đôi số mol H2 rồi đó. Fe + 2HCl → FeCl2 + H2; n(H2) = n(Fe) = 0,1 mol ⇒ V = 0,1 × 24,79 = 2,479 lít.', anh: 0, nguon: 'kho', traLoiCho: 't1', luc: now - 540_000 },
  ]
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const duong = new URL(url, location.href).pathname
    if (duong.endsWith('/hs/ai-ddh/mo')) return new Response(JSON.stringify({ ok: true, bat: true, khoa: null, vanPhongTruc: true, conLuot: 18, tranLuot: 20, tin: TIN_AI }), { status: 200, headers: { 'content-type': 'application/json' } })
    if (duong.endsWith('/hs/ai-ddh/tin')) return new Response(JSON.stringify({ ok: true, tin: [] }), { status: 200, headers: { 'content-type': 'application/json' } })
    return fetchAi(input, init)
  }
}
const manMenuTrong = () => h(HocTapHomNay, { ten: 'Minh Anh', lop: '12A1', ketQua: { cheDo2: true, sanh: SANH_NHE } as never, dangTai: false, loi: '', coCa: thamSo.get('ca') === '1', token: 'tk',
  thongBao: h(ThongBaoHocSinh, { token: 'tk', onOpen: noop }), onMoHoSo: noop, soBaiTap: 1,
  onHoc: noop, onXemLai: noop, onChua: noop, onThi: noop, onTuLuyen: noop, onLichSu: noop, onBaiTap: noop, onGiaDinh: noop, onTaiLai: noop, onDangXuat: noop, onKetQua: noop, onBangTin: noop, onLuyenLai: noop })
import DangNhapHocSinh from '../../src/screens/DangNhapHocSinh'
import { LogoDoc } from '../../src/components/LogoVai'
// `?man=hs-dang-nhap` = màn đăng nhập THẬT (lệnh giả: SBD 12026 chưa có mật khẩu ⇒ bước đặt mật khẩu; SBD khác ⇒ báo sai mật khẩu).
const manDangNhapTrong = () => h(DangNhapHocSinh, { logo: h(LogoDoc, { vai: 'hs', size: 48 }), onDangNhap: noop,
  api: { dangNhap: (async () => ({ ok: false, chuaCoMatKhau: true, error: '' })) as never, datMatKhau: (async () => ({ ok: false, error: 'Xác nhận mật khẩu không khớp' })) as never } })
// `?man=hs-sheet&tam=btvn|lich-su|gia-dinh|vao-thi` = các tấm toàn màn của cổng học sinh (component THẬT, số giả) đè lên Hôm nay như app thật.
import '../../src/components/bang-nhiem-vu/sheet-m3.css'
import { ThanhTren } from '../../src/components/m3'
import BtvnM3 from '../../src/components/bang-nhiem-vu/BtvnM3'
import LichSuCaM3 from '../../src/components/bang-nhiem-vu/LichSuCaM3'
import { MomDanhSachM3 } from '../../src/components/bang-nhiem-vu/MomM3'
import PhongVaoThi from '../../src/components/PhongVaoThi'
import VaoThiForm from '../../src/components/bang-nhiem-vu/VaoThiForm'
const ngayGioGia = (iso: string) => { const d = new Date(iso); return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` }
const ngayIso = (ngay: number, gio = 21) => new Date(now + ngay * 86400_000).toISOString().slice(0, 11) + `${String(gio).padStart(2, '0')}:00:00+07:00`
const manTamTrong = () => {
  const tam = thamSo.get('tam') ?? 'btvn'
  if (tam === 'cau-da-lam') return h(FragmentHse, null, manMenuTrong(), h('div', { className: 'fixed inset-0 z-50 overflow-y-auto overscroll-contain' }, h(CauDaLam, { token: 'tk', hoTen: 'Nguyễn Minh Anh', sbd: '12121212', lop: '12A1', onVe: noop, caGanNhat: { chu: 'Chưa có ca đã công bố', coDiem: false }, onLichSuCa: noop })))
  if (tam === 'ai') return h(FragmentHse, null, manMenuTrong(), h(BongBongAiDdh, { auth: { token: 'tk', sbd: '12121212', hoTen: 'Nguyễn Minh Anh' } }))
  const DS_CA = [
    { maCa: '543998', tenCa: 'Kiểm tra tuần 12 · Polymer', nopLuc: ngayIso(-2, 10), tong: 7.25, diemI: 3, diemII: 2.75, diemIII: 1.5, tongCau: 28 },
    { maCa: '541207', tenCa: 'Kiểm tra tuần 11 · Amino acid và peptide', nopLuc: ngayIso(-9, 10), tong: 7, diemI: 3.25, diemII: 2.25, diemIII: 1.5, tongCau: 28 },
    { maCa: '538114', tenCa: 'Kiểm tra tuần 10 · Amine', nopLuc: ngayIso(-16, 10), tong: 6, diemI: 3, diemII: 2, diemIII: 1, tongCau: 28 },
  ]
  if (tam === 'ca') return h(FragmentHse, null, manMenuTrong(), h('div', { className: 'fixed inset-0 z-50 overflow-y-auto' }, h(LichSuCaEm, { sbd: '12121212', onVe: noop, banDau: { items: DS_CA, chuaCongBo: [] } } as never)))
  if (tam === 'khac-phuc') return h(FragmentHse, null, manMenuTrong(), h('div', { className: 'm3 m3-sheet fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 overflow-y-auto overscroll-contain flex flex-col' },
    h(ThanhTren, { tieuDe: 'Luyện lại từ bài kiểm tra', onQuayLai: noop, nhanQuayLai: 'Về Hôm nay' }), h('main', { className: 'max-w-6xl mx-auto w-full px-3 sm:px-6 py-4 sm:py-6 flex-1' },
      h('div', { className: 'grid grid-cols-1 lg:grid-cols-2 gap-6 items-start' }, h('div', null, h(LuyenDeChuan, { sbd: '12121212', token: 'tk' })),
        h('div', null, h(KhoiKhacPhuc3CheDo, { sbd: '12121212', token: 'tk', hoTen: 'Nguyễn Minh Anh', dsLichSu: DS_CA, scriptUrl: '', lop: '12A1' } as never))))))
  if (tam === 'vao-thi') return h(FragmentHse, null, manMenuTrong(), h(PhongVaoThi, { onClose: noop }, h(VaoThiForm, { maCa: '', onMaCa: noop, matKhau: '', onMatKhau: noop, loi: '', onSubmit: (e: Event) => e.preventDefault(), sbd: '12121212', hoTen: 'Nguyễn Minh Anh' } as never)))
  const tieu = tam === 'lich-su' ? 'Kết quả bài đã nộp' : tam === 'gia-dinh' ? 'Bài gia đình giao' : 'Bài tập về nhà'
  const con = tam === 'lich-su' ? h(LichSuCaM3, { dangTai: false, ngayGio: ngayGioGia, dongDem: (x: { tongCau?: number | null }) => `Đúng ${Math.round((x.tongCau ?? 0) * 0.8)}/${x.tongCau} câu`, dangMoDe: false, onXemBaoCao: noop, onXemDe: noop, ds: [
      { maCa: '543998', tenCa: 'Kiểm tra tuần 12 · Polymer', nopLuc: ngayIso(-2, 10), tong: 8.5, diemI: 3.5, diemII: 3.25, diemIII: 1.75, tongCau: 28 },
      { maCa: '541207', tenCa: 'Kiểm tra tuần 11 · Amino acid và peptide', nopLuc: ngayIso(-9, 10), tong: 8.25, diemI: 3.25, diemII: 3.5, diemIII: 1.5, tongCau: 28 },
      { maCa: '538114', tenCa: 'Kiểm tra tuần 10 · Amine', nopLuc: ngayIso(-16, 10), tong: 6.75, diemI: 3, diemII: 2.5, diemIII: 1.25, tongCau: 28 },
    ] } as never)
    : tam === 'gia-dinh' ? h(MomDanhSachM3, { daTai: true, loi: '', thongBaoNop: null, onDongThongBao: noop, onLamMoi: noop, ngayGio: ngayGioGia, onBatDau: noop, onXemKetQua: noop, ds: [
      { id: 'm1', tieuDe: 'Đề ôn chương Carbohydrate', ngayGiao: ngayIso(-1, 19), soCau: 28, trangThai: 'dang_lam' },
      { id: 'm2', tieuDe: 'Ôn câu sai Ester – Lipid', ngayGiao: ngayIso(-8, 19), soCau: 20, trangThai: 'da_nop', diem: 7.85 },
    ] } as never)
    : h(BtvnM3, { dangTai: false, now, dangMoId: null, ngayGio: ngayGioGia, onMo: noop, onTaiLai: noop, ds: [
      { maBtvn: 'b1', maCa: '612004', tenBtvn: 'Thế điện cực và nguồn điện hoá học', soCau: 24, hanNop: ngayIso(4) },
      { maBtvn: 'b2', maCa: '611872', tenBtvn: 'Amino acid và peptide', soCau: 25, hanNop: ngayIso(3), daNop: true, nopLuc: ngayIso(-4, 21), diem: 8.4, soDung: 21, soLanLamLaiConLai: 2 },
      { maBtvn: 'b3', maCa: '610455', tenBtvn: 'Amine', soCau: 24, hanNop: ngayIso(-11) },
    ] } as never)
  return h(FragmentHse, null, manMenuTrong(), h('div', { className: 'm3 m3-sheet fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 overflow-y-auto overscroll-contain flex flex-col' },
    h(ThanhTren, { tieuDe: tieu, onQuayLai: noop, nhanQuayLai: 'Về Hôm nay' }), h('main', { className: 'max-w-6xl mx-auto w-full px-3 sm:px-6 py-4 sm:py-6 flex-1' }, con)))
}
// ═════════ hết LÀN «TRONG» HS 26/10
// ═══ MỘT TRANG HS 26/10: `?man=hs-mot&tt=thuong|ca|du&dd=mo|xong|khong` = Hôm nay «Một trang» (component THẬT HocTapHomNay + menu dọc + BongBongAiDdh
// không nút nổi). Máy chủ GIẢ trong khối: `/hs/buoi-hoc` (buổi đang mở / đã điểm danh / không có), `/hs/diem-danh` (mã QR `&diem-danh=482913` ⇒ đã điểm danh
// kèm giờ), `/hs/chua-cau-sai/*` (5 câu cần sửa), `/hs/nhip-hoc` (Chăm), `/notifications/list` (2 tin). Số khớp nhau: 12/30 câu, chặng 3/5, kiểm tra 28 câu.
const MT_TT = thamSo.get('tt') ?? 'thuong', MT_DD = thamSo.get('dd') ?? 'mo'
const mtNgay = new Date(now + 7 * 3600_000).toISOString().slice(0, 10), mtMo = Date.parse(`${mtNgay}T00:00:00+07:00`)
// 27/10 «kiểm tra tuần lên đầu, làm xong mới mở khoá»: `&kt=khoa` = Kiểm tra ôn tập HÔM NAY đang mở chưa nộp (nút kiểm tra đầu đường, chặng khoá) · `&kt=xong` =
// đã nộp (điểm 8,5; mở trang ngay sau `kt=khoa` ⇒ hiệu ứng vỡ khoá) · mặc định = bài kiểm tra NGÀY MAI (đường như cũ, không khoá).
const MT_KT = thamSo.get('kt')
const MT_KIEM = { id: 'kt1', ngay: mtNgay, moLuc: mtMo, hanLuc: mtMo + 86400_000, serverNow: now, trangThai: 'can_lam', homNay: true, baiNgayToiThieu: 12, tong: 28, daTra: 0, con: 28,
  soChang: 4, phut: 50, soBai: 6, tongKienThuc: 10, phuDe: 10, nguonDayDu: true, lyDo: '', thieuNguon: 0, diem: null as number | null, nopLuc: null as number | null,
  ...(MT_KT === 'xong' ? { trangThai: 'da_nop', daTra: 28, con: 0, diem: 8.5, nopLuc: now - 60_000 } : MT_KT === 'khoa' ? {}
    : { ngay: new Date(mtMo + 86400_000 + 7 * 3600_000).toISOString().slice(0, 10), moLuc: mtMo + 86400_000, hanLuc: mtMo + 2 * 86400_000, trangThai: 'sap_den', homNay: false }) }
const mtLam = MT_TT === 'du' ? 30 : 12
const SANH_MT = { ...SANH_MOI, chienDich: { id: 'cd1', ten: 'Ester – Lipid' }, hanhTrinh: { ...SANH_MOI.hanhTrinh, tang: 2, toiThieu: 30, daLam: mtLam, daXep: 30, soChang: 5, changHienTai: MT_TT === 'du' ? 5 : 3 },
  theLuc: MT_TT === 'du' ? { con: 6, tong: 36 } : { con: 18, tong: 30 }, ruong: { ...SANH_MOI.ruong, daLam: mtLam, tong: 30 }, tamGiuCa: 0, kiemTraCaNhan: MT_KIEM }
if (man === 'hs-mot') {
  try { localStorage.setItem('omr-ai-ddh-co', JSON.stringify({ sbd: '12121212', bat: true, luc: Date.now() })) } catch { /* bỏ qua */ }
  const fetchMt = window.fetch
  const buoi = { id: 'b1', ten: 'Buổi học 26/10/2026', lop: '12A1' }
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const duong = new URL(url, location.href).pathname
    const tra = (o: unknown) => new Response(JSON.stringify(o), { status: 200, headers: { 'content-type': 'application/json' } })
    if (duong.endsWith('/hs/buoi-hoc')) return tra(MT_DD === 'khong' ? { ok: true, buoi: null } : { ok: true, buoi: { ...buoi, daDiemDanh: MT_DD === 'xong' } })
    if (duong.endsWith('/hs/diem-danh')) return tra({ ok: true, buoi: { ...buoi, daDiemDanh: true } })
    if (duong.endsWith('/hs/chua-cau-sai/co')) return tra({ ok: true })
    if (duong.endsWith('/hs/chua-cau-sai/danh-sach')) return tra({ ok: true, ds: [], dem: { tong: 5, can: 5, cho: 0, xong: 0 } })
    if (duong.endsWith('/hs/nhip-hoc')) return tra(nhipEmGia('cham'))
    if (duong.endsWith('/notifications/list')) return tra({ ok: true, publicKey: '', items: [
      { id: 'n1', kind: 'btvn', title: 'Bài tập về nhà mới', body: 'Thầy giao 1 bài, hạn 28/10.', created_at: new Date(now - 3600_000).toISOString(), read_at: null },
      { id: 'n2', kind: 'mom', title: 'Lời nhắn từ gia đình', body: 'Mẹ nhắn: con nhớ làm đủ 30 câu nhé.', created_at: new Date(now - 7200_000).toISOString(), read_at: null },
    ] })
    return fetchMt(input, init)
  }
}
const manMotTrang = () => h(FragmentHse, null,
  h(HocTapHomNay, { ten: 'Minh Anh', lop: '12A1', ketQua: { cheDo2: true, sanh: SANH_MT } as never, dangTai: false, loi: '', coCa: MT_TT === 'ca', token: 'tk', moDiemDanh: true,
    thongBao: h(ThongBaoHocSinh, { token: 'tk', onOpen: noop }), onMoHoSo: noop, soBaiTap: 1, coBaiTap: true, onKiemTra: noop,
    onHoc: noop, onXemLai: noop, onChua: noop, onThi: noop, onTuLuyen: noop, onLichSu: noop, onBaiTap: noop, onGiaDinh: noop, onTaiLai: noop, onDangXuat: noop, onKetQua: noop, onBangTin: noop, onLuyenLai: noop }),
  h(BongBongAiDdh, { auth: { token: 'tk', sbd: '12121212', hoTen: 'Nguyễn Minh Anh' }, anBong: true }))
// ═══ hết MỘT TRANG HS 26/10
// ═══ NGANG HS 26/10: `?man=hs-ng&v=tu-sua|kiem|lam|ai` = màn con / tấm của cổng học sinh MỞ ĐÈ lên Hôm nay «Một trang» đúng như StudentPortalScreen
// (Hôm nay trong `<div inert>`, moDiemDanh=false khi có màn con; màn con trong `fixed inset-0 z-50 overflow-y-auto overscroll-contain`).
//   tu-sua  Tự sửa lỗi · «Em tự làm lại câu này» (chữa câu gọn) — câu có 4 hình công thức cấu tạo (lỗi thầy chỉ 26/10: thanh «Kiểm tra» đè hình 4)
//   kiem    Kiểm tra ôn tập (ManKiemTraCaNhan, máy giả tối thiểu)  ·  ai = tấm chat A.I Đỗ Đại Học mở sẵn (sự kiện ddh:mo-ai như mục menu)
//   `&dd=mo` = buổi học đang mở điểm danh (vạch menu thò thẻ «Điểm danh» khi ở Hôm nay).
import ManKiemTraCaNhanNg from '../../src/components/hoc-tap/ManKiemTraCaNhan'
const NG_V = thamSo.get('v') ?? 'tu-sua'
// Màn làm bài / tự sửa / Tu luyện / kiểm tra nạp tờ «Trong» riêng lúc mảnh mã chạy MÀ data-trong đã gắn (main.tsx gắn trước); trang chụp gắn data-trong
// SAU khi nạp ⇒ nạp thẳng tờ ấy cho các cảnh học sinh này (như app thật sau khi mở màn).
if (document.documentElement.dataset.trong === 'hs' && (man === 'hs-ng' || man === 'duo-sua' || man.startsWith('hs12-') || man === 'lam13')) void import('../../src/styles/trong-lam-bai.css')
const hinhCauTao = (chu: string) => 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="150" viewBox="0 0 320 150"><rect width="320" height="150" fill="white"/><g stroke="black" stroke-width="2" fill="none"><polygon points="60,40 95,20 130,40 130,80 95,100 60,80"/><line x1="130" y1="40" x2="175" y2="20"/><line x1="175" y1="20" x2="215" y2="40"/><line x1="215" y1="40" x2="215" y2="80"/></g><text x="222" y="92" font-family="sans-serif" font-size="20">OH</text><text x="20" y="135" font-family="sans-serif" font-size="18">${chu}</text></svg>`)
if (man === 'hs-ng') {
  try { localStorage.setItem('omr-ai-ddh-co', JSON.stringify({ sbd: '12121212', bat: true, luc: Date.now() })) } catch { /* bỏ qua */ }
  const fetchNg = window.fetch
  const buoiNg = { id: 'b1', ten: 'Buổi học 26/10/2026', lop: '12A1' }
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const duong = new URL(url, location.href).pathname
    const tra = (o: unknown) => new Response(JSON.stringify(o), { status: 200, headers: { 'content-type': 'application/json' } })
    if (duong.endsWith('/hs/buoi-hoc')) return tra(thamSo.get('dd') === 'mo' ? { ok: true, buoi: { ...buoiNg, daDiemDanh: false } } : { ok: true, buoi: null })
    if (duong.endsWith('/hs/chua-cau-sai/co')) return tra({ ok: true })
    if (duong.endsWith('/hs/chua-cau-sai/danh-sach')) return tra({ ok: true, ds: [], dem: { tong: 5, can: 5, cho: 0, xong: 0 } })
    if (duong.endsWith('/hs/chua-cau-sai/mo-dot')) return tra({ ok: true, dotId: 'd-ng', trangThai: 'dang_chua_buoc', coHocLieu: false })
    if (duong.endsWith('/hs/chua-cau-sai/gon-mo')) return tra({ ok: true, dotId: 'd-ng', lan: 1, ban: 'ban-1', tuSuaNeuDung: true, de: { qid: 'DH-12-C1-B4-9', phan: 'I', tenDang: 'Đồng phân alcohol',
      text: 'Cho bốn chất hữu cơ có công thức cấu tạo như hình dưới. Số chất thuộc loại alcohol bậc một là',
      choices: ['1.', '2.', '3.', '4.'], hinhAnh: ['(1)', '(2)', '(3)', '(4)'].map((c) => ({ src: hinhCauTao(`Chất ${c}`), viTri: 'sau_de', alt: `Chất ${c}` })) } })
    if (duong.endsWith('/hs/nhip-hoc')) return tra(nhipEmGia('cham'))
    if (duong.endsWith('/notifications/list')) return tra({ ok: true, publicKey: '', items: [] })
    if (duong.endsWith('/hs/ai-ddh/mo')) return tra({ ok: true, bat: true, khoa: null, vanPhongTruc: true, conLuot: 18, tranLuot: 20, tin: [
      { id: 't1', ben: 'em', chu: 'Cho 5,6 gam Fe tác dụng hết với dung dịch HCl dư, thu được V lít khí H2 (đkc). Giá trị của V là?', anh: 0, trangThai: 'xong', luc: now - 600_000 },
      { id: 't2', ben: 'vp', chu: 'Fe + 2HCl → FeCl2 + H2; n(H2) = n(Fe) = 0,1 mol ⇒ V = 0,1 × 24,79 = 2,479 lít.', anh: 0, nguon: 'kho', traLoiCho: 't1', luc: now - 540_000 },
    ] })
    if (duong.endsWith('/hs/ai-ddh/tin')) return tra({ ok: true, tin: [] })
    // Kiểm tra ôn tập (ảnh thầy 26/10): 10/28 câu đã trả lời; chặng 1 ĐÃ CHỐT mà bỏ trống cả 6 câu, chặng 2 chốt đủ 8/8, chặng 3 đang 2/7 (khớp: 0 + 8 + 2 = 10);
    // `start` chặng ⇒ 3 câu mẫu (CAU_HOC), hạn chặng 12 phút.
    if (duong.endsWith('/game-v2/hoc-tap-ktcn-trang-thai')) return tra({ ok: true, revision: 1, kiemTra: { ...MT_KIEM, daTra: 10, con: 18, serverNow: Date.now() },
      chang: [{ stt: 0, soCau: 6, giay: 360, han: null, daChot: true, daTra: 0 }, { stt: 1, soCau: 8, giay: 720, han: null, daChot: true, daTra: 8 },
        { stt: 2, soCau: 7, giay: 720, han: null, daChot: false, daTra: 2 }, { stt: 3, soCau: 7, giay: 720, han: null, daChot: false, daTra: 0 }] })
    if (duong.endsWith('/game-v2/hoc-tap-ktcn-start')) return tra({ ok: true, revision: 1, kiemTra: { ...MT_KIEM, serverNow: Date.now() }, daChot: false,
      questions: CAU_HOC, tra: {}, hanChang: Date.now() + 720_000 })
    if (duong.endsWith('/game-v2/hoc-tap-ktcn-luu')) return tra({ ok: true, revision: 2, kiemTra: { ...MT_KIEM, serverNow: Date.now() }, daLuu: true })
    return fetchNg(input, init)
  }
  if (NG_V === 'ai') setTimeout(() => window.dispatchEvent(new Event('ddh:mo-ai')), 900)
}
const manNgang = () => h(FragmentHse, null,
  h('div', { inert: NG_V !== 'ai', 'aria-hidden': NG_V !== 'ai' || undefined } as never, h(HocTapHomNay, { ten: 'Minh Anh', lop: '12A1', ketQua: { cheDo2: true, sanh: SANH_MT } as never, dangTai: false, loi: '', coCa: false, token: 'tk',
    moDiemDanh: NG_V === 'ai', onMoHoSo: noop, soBaiTap: 1, coBaiTap: true, onKiemTra: noop,
    onHoc: noop, onXemLai: noop, onChua: noop, onThi: noop, onTuLuyen: noop, onLichSu: noop, onBaiTap: noop, onGiaDinh: noop, onTaiLai: noop, onDangXuat: noop, onKetQua: noop, onBangTin: noop, onLuyenLai: noop })),
  NG_V === 'ai' ? h(BongBongAiDdh, { auth: { token: 'tk', sbd: '12121212', hoTen: 'Nguyễn Minh Anh' }, anBong: true })
  : h('div', { className: 'fixed inset-0 z-50 overflow-y-auto overscroll-contain' },
    NG_V === 'kiem' ? h(ManKiemTraCaNhanNg, { token: 'tk', sbd: '12121212', id: 'kt1', onVe: noop, onCapNhat: noop } as never)
    : h(ManChuaCauSai, { token: 'tk', qid: 'DH-12-C1-B4-9', tenCau: 'Đồng phân alcohol', onVe: noop })))
// ═══ hết NGANG HS 26/10
// ═══ DUO SỬA 27/10 (thầy «Phần sửa câu tôi chưa thấy giao diện của doligo»): `?man=duo-sua&de=1|2|3|4[&mo=da-sua|loi][&trong=tat]` = màn sửa câu
// (ManChuaCauSai đường gọn → ChuaGonDuo) mở đè Hôm nay như cổng học sinh. Máy chủ GIẢ gon-mo / gon-nop chấm theo đáp án của câu: lần 1 đúng ⇒ tu_sua ·
// lần 1 sai ⇒ goi_y · lần 2 đúng ⇒ xong_phan (co_goi_y) · lần 2 sai ⇒ loi_giai (đáp án + lời giải chỉ về SAU khi nộp, như máy chủ thật).
// Câu là câu cuối của chặng sửa 2 (đã sửa 3/4 câu) ⇒ «Tiếp tục» sau khi khép mở màn xong chặng có Bi mừng.
// de: 1 = 4 hình công thức cấu tạo (đề dài) · 2 = trắc nghiệm ngắn (lưới 2×2) · 3 = Đúng–sai · 4 = trả lời ngắn. mo=da-sua: câu đã tự sửa; mo=loi: không mở được.
const DUO_SUA = man === 'duo-sua'
const DS_CAU: Record<string, { de: Record<string, unknown>; dapAn: string; loiGiai: unknown }> = {
  '1': { de: { qid: 'DH-12-C1-B4-9', phan: 'I', tenDang: 'Đồng phân alcohol', text: 'Cho bốn chất hữu cơ có công thức cấu tạo như hình dưới. Số chất thuộc loại alcohol bậc một là',
    choices: ['1.', '2.', '3.', '4.'], hinhAnh: ['(1)', '(2)', '(3)', '(4)'].map((c) => ({ src: hinhCauTao(`Chất ${c}`), viTri: 'sau_de', alt: `Chất ${c}` })) }, dapAn: 'B',
    loiGiai: { chot: 'Alcohol bậc một: nhóm OH gắn với carbon chỉ liên kết với một nguyên tử carbon khác. Chất (1) và (3) thoả mãn.' } },
  '2': { de: { qid: 'DH-12-C1-B2-17', phan: 'I', tenDang: 'Thuỷ phân ester', text: 'Thuỷ phân hoàn toàn 8,8 gam ethyl acetate (CH₃COOC₂H₅) bằng dung dịch NaOH vừa đủ. Khối lượng muối thu được là',
    choices: ['8,2 gam.', '6,8 gam.', '9,6 gam.', '4,1 gam.'], hinhAnh: [] }, dapAn: 'A',
    loiGiai: { chot: 'n(ester) = 8,8 : 88 = 0,1 mol ⇒ n(CH₃COONa) = 0,1 mol ⇒ m = 0,1 × 82 = 8,2 gam.' } },
  '3': { de: { qid: 'DH-12-C2-B6-4', phan: 'II', tenDang: 'Glucose và fructose', text: 'Cho các phát biểu về glucose và fructose:', ideas: ['Glucose và fructose là đồng phân của nhau.', 'Fructose không tham gia phản ứng tráng bạc.',
    'Glucose có phản ứng với Cu(OH)₂ ở nhiệt độ thường tạo dung dịch xanh lam.', 'Fructose làm mất màu nước bromine.'], hinhAnh: [] }, dapAn: 'DSDS',
    loiGiai: { chot: 'Glucose và fructose cùng công thức C₆H₁₂O₆; fructose vẫn tráng bạc trong môi trường base; chỉ glucose làm mất màu nước bromine.' } },
  '4': { de: { qid: 'DH-12-C1-B2-21', phan: 'III', tenDang: 'Xà phòng hoá ester', soO: 3, text: 'Xà phòng hoá hoàn toàn 8,8 gam ethyl acetate bằng dung dịch NaOH vừa đủ, cô cạn thu được m gam muối. Giá trị của m là bao nhiêu?', hinhAnh: [] },
    dapAn: '8,2', loiGiai: { chot: 'n(muối) = n(ester) = 0,1 mol ⇒ m = 0,1 × 82 = 8,2.' } },
}
if (DUO_SUA) {
  try { localStorage.setItem('omr_student_portal_auth', JSON.stringify({ token: 'tk', sbd: '12121212' })) } catch { /* bỏ qua */ } // nút Hỏi thầy cần phiên em
  const cau = DS_CAU[thamSo.get('de') ?? '2'] ?? DS_CAU['2']!
  const MO = thamSo.get('mo') ?? ''
  let lanSua = 1
  const fetchSua = window.fetch
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const duong = new URL(url, location.href).pathname
    const tra = (o: unknown) => new Response(JSON.stringify(o), { status: 200, headers: { 'content-type': 'application/json' } })
    let b: Record<string, unknown> = {}
    try { b = init?.body ? JSON.parse(String(init.body)) : {} } catch { /* bỏ qua */ }
    if (duong.endsWith('/hs/buoi-hoc')) return tra({ ok: true, buoi: null })
    if (duong.endsWith('/hs/chua-cau-sai/co')) return tra({ ok: true })
    if (duong.endsWith('/hs/chua-cau-sai/danh-sach')) return tra({ ok: true, ds: [], dem: { tong: 5, can: 5, cho: 0, xong: 0 } })
    if (duong.endsWith('/hs/chua-cau-sai/mo-dot')) return tra({ ok: true, dotId: 'd-sua', trangThai: 'dang_chua_buoc', coHocLieu: false })
    if (duong.endsWith('/hs/chua-cau-sai/gon-mo')) {
      if (MO === 'loi') return tra({ ok: false, ma: 'KHONG_MO_DUOC_CAU', mo: 'Câu này đang được thầy cập nhật nội dung. Em sang câu khác, lát nữa quay lại nhé.' })
      if (MO === 'da-sua') return tra({ ok: true, dotId: 'd-sua', trangThai: 'da_tu_sua', de: cau.de })
      return tra({ ok: true, dotId: 'd-sua', lan: lanSua, ban: `ban-${lanSua}`, tuSuaNeuDung: lanSua === 1, de: cau.de })
    }
    if (duong.endsWith('/hs/chua-cau-sai/gon-nop')) {
      const em = String(b.traLoi ?? '').trim().toUpperCase().replace(/Đ/g, 'D')
      const dung = em === cau.dapAn.toUpperCase()
      const chiTiet = { de: { ...cau.de, maDe: 'DH-12', mucDo: 'hieu', sao: 0 }, dapAn: cau.dapAn, loiGiai: cau.loiGiai }
      const lan = lanSua
      if (!dung && lan === 1) { lanSua = 2; return tra({ ok: true, dotId: 'd-sua', lan, ban: `ban-${lan}`, dung: false, ket: 'goi_y', goiY: 'Tính số mol ester trước: n = 8,8 : 88' }) }
      if (dung) return tra({ ok: true, dotId: 'd-sua', lan, ban: `ban-${lan}`, dung: true, ...(lan === 1 ? { ket: 'tu_sua', trangThai: 'da_tu_sua' } : { ket: 'xong_phan', lyDo: 'co_goi_y' }), chiTiet })
      return tra({ ok: true, dotId: 'd-sua', lan, ban: `ban-${lan}`, dung: false, ket: 'loi_giai', chiTiet })
    }
    if (duong.endsWith('/hs/nhip-hoc')) return tra(nhipEmGia('cham'))
    if (duong.endsWith('/notifications/list')) return tra({ ok: true, publicKey: '', items: [] })
    return fetchSua(input, init)
  }
}
const manDuoSua = () => h(FragmentHse, null,
  h('div', { inert: true, 'aria-hidden': true } as never, h(HocTapHomNay, { ten: 'Minh Anh', lop: '12A1', ketQua: { cheDo2: true, sanh: SANH_MT } as never, dangTai: false, loi: '', coCa: false, token: 'tk',
    moDiemDanh: false, onMoHoSo: noop, soBaiTap: 1, coBaiTap: true, onKiemTra: noop,
    onHoc: noop, onXemLai: noop, onChua: noop, onThi: noop, onTuLuyen: noop, onLichSu: noop, onBaiTap: noop, onGiaDinh: noop, onTaiLai: noop, onDangXuat: noop, onKetQua: noop, onBangTin: noop, onLuyenLai: noop })),
  h('div', { className: 'fixed inset-0 z-50 overflow-y-auto overscroll-contain' },
    h(ManChuaCauSai, { token: 'tk', qid: String(DS_CAU[thamSo.get('de') ?? '2']?.de.qid ?? 'DH-12-C1-B2-17'), tenCau: 'Thuỷ phân ester', onVe: noop, onTiep: noop,
      tienDo: { so: 2, xong: 3, tong: 4, cuoi: true, conSau: true, changTiep: 3, homNay: { xong: 8, tong: 12 } } })))
// ═══ hết DUO SỬA 27/10
// ═══ SOÁT 26/10: cảnh cho bộ soát chữ chèn (scripts/soat-chu-chen) — các màn thầy chụp ảnh điện thoại 26/10 tối mà bộ chụp chưa có:
//   `?man=soat-ktcn[&kt=ket]` = màn «Kiểm tra ôn tập của em» THẬT (ManKiemTraCaNhan): 28 câu, đã trả lời 10 (vòng «10/28»), 4 chặng, chặng 2 đang chạy;
//     `&kt=ket` = đã nộp (kết quả lọc câu). Bấm «Làm tiếp chặng 2» (thao tác `nut:`) ⇒ màn làm chặng.
//   `&soat=khong-ca` trên cảnh thầy (gv-lich-su-ca, gv-hom-nay) = máy chủ GIẢ không có ca nào đang mở (chỉ ca đã đóng).
//   `&soat=dai` trên `ph&mot=1` = phụ huynh «Một trang» dữ liệu DÀI (tên con, tên bài, tên dạng dài; danh sách gấp ba).
import ManKiemTraCaNhan from '../../src/components/hoc-tap/ManKiemTraCaNhan'
const SOAT = thamSo.get('soat') ?? ''
const soatNgay = new Date(now + 7 * 3600_000).toISOString().slice(0, 10), soatMo = Date.parse(`${soatNgay}T00:00:00+07:00`)
const SOAT_KT = { id: 'kt-soat', ngay: soatNgay, moLuc: soatMo, hanLuc: soatMo + 86400_000, serverNow: now, trangThai: thamSo.get('kt') === 'ket' ? 'da_nop' : 'can_lam', homNay: true,
  baiNgayToiThieu: 12, tong: 28, daTra: thamSo.get('kt') === 'ket' ? 28 : 10, con: thamSo.get('kt') === 'ket' ? 0 : 18, soChang: 4, phut: 50, soBai: 6, tongKienThuc: 10, phuDe: 10, nguonDayDu: true,
  lyDo: 'Kiểm chứng những phần em đang luyện thêm', thieuNguon: 0, diem: thamSo.get('kt') === 'ket' ? 7.75 : null, nopLuc: thamSo.get('kt') === 'ket' ? now - 3600_000 : null }
const SOAT_CHANG = [{ stt: 0, soCau: 7, giay: 780, han: now - 1_200_000, daChot: true, daTra: 7 }, { stt: 1, soCau: 7, giay: 780, han: now + 462_000, daChot: false, daTra: 3 },
  { stt: 2, soCau: 7, giay: 840, han: null, daChot: false, daTra: 0 }, { stt: 3, soCau: 7, giay: 840, han: null, daChot: false, daTra: 0 }]
const SOAT_CAU = CAU_HOC.filter((c) => c.phan === 'I').concat(Array.from({ length: 6 }, (_, i) => ({ ...CAU_HOC[0]!, qid: `S${i}`, text: `Câu ${i + 2}: Thuỷ phân hoàn toàn ${(i + 2) * 4.4} gam ester đơn chức X bằng dung dịch NaOH vừa đủ, thu được muối và alcohol. Công thức của X là` })))
const SOAT_KET = { chu: 'Em vững phần Ester – Lipid; phần Amine cần luyện thêm bậc amine và tính base.',
  bai: [{ ten: 'Bài 6. Ester – Lipid', tong: 10, daKiem: 10, dungLanNay: 8 }, { ten: 'Bài 7. Carbohydrate (glucose, fructose, saccharose, tinh bột và cellulose)', tong: 10, daKiem: 10, dungLanNay: 7 }, { ten: 'Bài 8. Amine', tong: 8, daKiem: 8, dungLanNay: 6 }],
  cau: Array.from({ length: 28 }, (_, i) => ({ de: SOAT_CAU[i % SOAT_CAU.length]!, tra: i === 9 ? '' : 'A', dung: ![3, 9, 15, 20, 22, 27].includes(i), dapAn: 'A', loiGiai: null })) }
if (man === 'soat-ktcn') {
  const fetchKt = window.fetch
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const tra = (o: unknown) => new Response(JSON.stringify(o), { status: 200, headers: { 'content-type': 'application/json' } })
    if (url.includes('hoc-tap-ktcn-trang-thai')) return tra({ ok: true, kiemTra: SOAT_KT, chang: SOAT_CHANG })
    if (url.includes('hoc-tap-ktcn-start')) return tra({ ok: true, kiemTra: SOAT_KT, revision: 3, hanChang: now + 462_000, daChot: false, questions: SOAT_CAU.slice(0, 7), tra: { [SOAT_CAU[0]!.qid]: 'A', [SOAT_CAU[1]!.qid]: 'B' } })
    if (url.includes('hoc-tap-ktcn-ket-qua')) return tra({ ok: true, kiemTra: SOAT_KT, ketQua: SOAT_KET })
    if (url.includes('hoc-tap-ktcn-')) return tra({ ok: true, kiemTra: SOAT_KT, revision: 4, daLuu: true })
    return fetchKt(input, init)
  }
}
if (SOAT === 'khong-ca' && man.startsWith('gv-')) {
  const fetchCa = window.fetch
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    let b: Record<string, unknown> = {}
    try { b = init?.body ? JSON.parse(String(init.body)) : {} } catch { /* bỏ qua */ }
    if (b.action === 'danhSachCa') return new Response(JSON.stringify({ ok: true, items: b.daXoa ? [] : CA_GIA.filter((c) => c.trangThai !== 'mo') }), { status: 200, headers: { 'content-type': 'application/json' } })
    return fetchCa(input, init)
  }
}
if (SOAT === 'dai' && MOT_PH) {
  const fetchPh = window.fetch
  const DUOI = ' · Thuỷ phân ester và xà phòng hoá chất béo (ôn tập tổng hợp)'
  const keoDai = (x: unknown, khoa = ''): unknown => {
    if (Array.isArray(x)) return (['dangChay', 'canhBaoThay', 'bacTheoDang', 'vuaLenBac', 'nhanXet'].includes(khoa) ? [...x, ...x, ...x] : x).map((o, i) => {
      const v = keoDai(o) as Record<string, unknown>
      if (i < x.length || !v || typeof v !== 'object') return v
      return Object.fromEntries(Object.entries(v).map(([k, g]) => [k, ['id', 'ma', 'maBtvn', 'maCa'].includes(k) && typeof g === 'string' ? `${g}-${i}` : g]))
    })
    if (!x || typeof x !== 'object') return x
    return Object.fromEntries(Object.entries(x).map(([k, v]) => [k, typeof v === 'string'
      ? k === 'hoTen' ? 'Nguyễn Ngọc Minh Khôi Nguyên' : ['ten', 'tenBtvn', 'tenCa', 'tieuDe'].includes(k) ? v + DUOI : k === 'noiDung' ? `${v} ${v}` : v
      : keoDai(v, k)]))
  }
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const r = await fetchPh(input, init)
    if (!new URL(url, location.href).pathname.includes('/ph/')) return r
    try { return new Response(JSON.stringify(keoDai(await r.clone().json())), { status: r.status, headers: { 'content-type': 'application/json' } }) } catch { return r }
  }
}
// như app thật: màn Kiểm tra ôn tập nạp tờ «Trong» riêng khi <html data-trong> đã gắn (trang chụp gắn SAU khi nạp mã ⇒ nạp thẳng)
if (man === 'soat-ktcn' && document.documentElement.dataset.trong === 'hs') void import('../../src/styles/trong-lam-bai.css')
const manSoatKtcn = () => h(ManKiemTraCaNhan, { token: 'tk', sbd: '12121212', id: 'kt-soat', onVe: noop, onCapNhat: noop })
// ═══ hết SOÁT 26/10
// ═══ DUO KIỂM TRA 27/10 (tiền tố ảnh "duo-kt-"): màn làm bài kiểm tra kiểu Duolingo — component THẬT, máy chủ GIẢ trong khối.
//   `?man=duo-kt&v=ktcn`  Kiểm tra ôn tập (ManKiemTraCaNhan): chặng 2 đang chạy, 6 câu đủ ba loại (2 câu đã trả lời); bấm «Làm tiếp chặng 2» ⇒ màn Duo.
//   `?man=duo-kt&v=ket`   Kiểm tra ôn tập đã nộp (Bi + kết quả lọc câu).
//   `?man=duo-kt&v=thi&vai=hocsinh`  Ca thi (ExamTakeScreen) — vào lại lượt dở cất trong IndexedDB (máy chủ không trả lời ⇒ đường rớt mạng), 8 câu.
//   `?man=duo-kt&v=kq&vai=hocsinh`   Kết quả sau nộp ca thi (KetQuaSauNop, đã công bố) có Bi.
import ManKiemTraCaNhanDk from '../../src/components/hoc-tap/ManKiemTraCaNhan'
import ExamTakeScreenDk from '../../src/screens/ExamTakeScreen'
import KetQuaSauNopDk from '../../src/components/xem-diem/KetQuaSauNop'
import { cacheSession as cacheSessionDk, emptyAnswerRecord as emptyAnswerRecordDk, emptyIntegrityLog as emptyIntegrityLogDk, saveAttempt as saveAttemptDk, type ExamAttempt as ExamAttemptDk } from '../../src/lib/exam-db'
import type { PublicExamBank as PublicExamBankDk } from '../../src/data/examContent'
import { useEffect as useEffectDk, useState as useStateDk } from 'react'
const DK_V = thamSo.get('v') ?? 'ktcn'
if (man === 'duo-kt' && document.documentElement.dataset.trong === 'hs') void import('../../src/styles/trong-lam-bai.css')
const dkNgay = new Date(now + 7 * 3600_000).toISOString().slice(0, 10), dkMo = Date.parse(`${dkNgay}T00:00:00+07:00`)
const DK_KT = { id: 'kt-dk', ngay: dkNgay, moLuc: dkMo, hanLuc: dkMo + 86400_000, serverNow: now, trangThai: DK_V === 'ket' ? 'da_nop' : 'can_lam', homNay: true,
  baiNgayToiThieu: 12, tong: 24, daTra: DK_V === 'ket' ? 24 : 8, con: DK_V === 'ket' ? 0 : 16, soChang: 4, phut: 50, soBai: 6, tongKienThuc: 10, phuDe: 10, nguonDayDu: true,
  lyDo: 'Kiểm chứng những phần em đang luyện thêm', thieuNguon: 0, diem: DK_V === 'ket' ? 8.25 : null, nopLuc: DK_V === 'ket' ? now - 3600_000 : null }
const DK_CHANG = [{ stt: 0, soCau: 6, giay: 720, han: now - 1_200_000, daChot: true, daTra: 6 }, { stt: 1, soCau: 6, giay: 720, han: now + 462_000, daChot: false, daTra: 2 },
  { stt: 2, soCau: 6, giay: 720, han: null, daChot: false, daTra: 0 }, { stt: 3, soCau: 6, giay: 720, han: null, daChot: false, daTra: 0 }]
const DK_CAU = [
  { ...CAU_HOC[0]!, qid: 'K1' },
  { ...CAU_HOC[0]!, qid: 'K2', tenDang: 'Amine', text: 'Dung dịch chất nào sau đây làm quỳ tím chuyển màu xanh?', choices: ['Aniline.', 'Methylamine.', 'Glycine.', 'Ethanol.'] },
  { ...CAU_HOC[0]!, qid: 'K3', tenDang: 'Carbohydrate', text: 'Chất nào sau đây thuộc loại disaccharide và có phản ứng tráng bạc khi đun nóng với dung dịch AgNO₃ trong NH₃?', choices: ['Saccharose.', 'Maltose.', 'Tinh bột.', 'Cellulose.'] },
  { ...CAU_HOC[1]!, qid: 'K4' },
  { ...CAU_HOC[0]!, qid: 'K5', tenDang: 'Ester', text: 'Số đồng phân ester ứng với công thức phân tử C₃H₆O₂ là', choices: ['1.', '2.', '3.', '4.'] },
  { ...CAU_HOC[2]!, qid: 'K6', soO: 4 },
]
const DK_KET = { chu: 'Em vững phần Ester – Lipid; phần Amine cần luyện thêm bậc amine và tính base.',
  bai: [{ ten: 'Bài 6. Ester – Lipid', tong: 8, daKiem: 8, dungLanNay: 7 }, { ten: 'Bài 8. Amine', tong: 6, daKiem: 6, dungLanNay: 4 }],
  cau: Array.from({ length: 12 }, (_, i) => ({ de: DK_CAU[i % 3]!, tra: i === 5 ? '' : 'A', dung: ![2, 5, 9].includes(i), dapAn: 'A', loiGiai: null })) }
if (man === 'duo-kt' && (DK_V === 'ktcn' || DK_V === 'ket')) {
  const fetchDk = window.fetch
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const tra = (o: unknown) => new Response(JSON.stringify(o), { status: 200, headers: { 'content-type': 'application/json' } })
    const kt = { ...DK_KT, serverNow: Date.now() }
    if (url.includes('hoc-tap-ktcn-trang-thai')) return tra({ ok: true, kiemTra: kt, chang: DK_CHANG })
    if (url.includes('hoc-tap-ktcn-start')) return tra({ ok: true, kiemTra: kt, revision: 3, hanChang: now + 462_000, daChot: false, questions: DK_CAU, tra: { K1: 'B', K4: 'DS--' } })
    if (url.includes('hoc-tap-ktcn-ket-qua')) return tra({ ok: true, kiemTra: kt, ketQua: DK_KET })
    if (url.includes('hoc-tap-ktcn-')) return tra({ ok: true, kiemTra: kt, revision: 4, daLuu: true })
    return fetchDk(input, init)
  }
}
const DK_BANK: PublicExamBankDk = {
  phanI: [
    { id: 'q1', text: 'Thuỷ phân hoàn toàn 8,8 gam ethyl acetate (CH₃COOC₂H₅) bằng dung dịch NaOH vừa đủ. Khối lượng muối thu được là', choices: ['8,2 gam.', '6,8 gam.', '9,6 gam.', '4,1 gam.'] },
    { id: 'q2', text: 'Dung dịch chất nào sau đây làm quỳ tím chuyển màu xanh?', choices: ['Aniline.', 'Methylamine.', 'Glycine.', 'Ethanol.'] },
    { id: 'q3', text: 'Chất nào sau đây thuộc loại disaccharide?', choices: ['Glucose.', 'Saccharose.', 'Tinh bột.', 'Cellulose.'] },
    { id: 'q4', text: 'Số đồng phân ester ứng với công thức phân tử C₃H₆O₂ là', choices: ['1.', '2.', '3.', '4.'] },
  ],
  phanII: [
    { id: 'q5', text: 'Xét dãy hydroxide ứng với hoá trị cao nhất của các nguyên tố chu kì 2: LiOH, Be(OH)₂, H₃BO₃, H₂CO₃, HNO₃.',
      ideas: ['Theo chiều tăng điện tích hạt nhân, tính base của các hydroxide trong dãy giảm dần.', 'Theo chiều tăng điện tích hạt nhân, tính acid của các hydroxide trong dãy tăng dần.', 'Trong dãy trên, HNO₃ là acid mạnh nhất.', 'H₃BO₃ có tính acid mạnh hơn H₂CO₃.'] },
    { id: 'q6', text: 'Cho các phát biểu về chất béo:', ideas: ['Chất béo là triester của glycerol với acid béo.', 'Tristearin ở thể lỏng ở nhiệt độ thường.', 'Chất béo không tan trong nước.', 'Thuỷ phân chất béo trong môi trường kiềm gọi là phản ứng xà phòng hoá.'] },
  ],
  phanIII: [
    { id: 'q7', text: 'Lên men 45 gam glucose với hiệu suất 80%. Thể tích khí CO₂ (đkc, lít) thu được là bao nhiêu? (Làm tròn đến hàng phần mười.)', soO: 4 },
    { id: 'q8', text: 'Đốt cháy hoàn toàn 0,1 mol ethylamine (C₂H₅NH₂) thu được V lít khí N₂ (đkc). Giá trị của V là bao nhiêu? (Làm tròn đến hàng phần mười.)', soO: 4 },
  ],
  soCau: { I: 4, II: 2, III: 2 },
} as PublicExamBankDk
async function datLuotDk() {
  const maCa = '246810'
  await cacheSessionDk({ maCa, lop: '12A1', thoiGianPhut: 50, bank: DK_BANK })
  const a: ExamAttemptDk = {
    key: `${maCa}:12121212`, maCa, sbd: '12121212', maDe: 'ngân hàng', startedAt: new Date(now - 12 * 60_000).toISOString(), durationMinutes: 50,
    hetGioLuc: new Date(now + 38 * 60_000).toISOString(), lanThu: 1, idThietBi: 'may-gia', nguong: { lan: 99, giay: 999 }, loai: 'thi', tenCa: 'Ca kiểm tra Hoá 12 · Ester – Carbohydrate',
    answers: { ...emptyAnswerRecordDk(), phanI: { q1: 'A' }, phanII: {}, phanIII: {} } as ExamAttemptDk['answers'], integrity: emptyIntegrityLogDk(), submitted: false, submittedAt: null, pendingSubmit: false,
  }
  await saveAttemptDk(a)
}
// 27/10 (thầy: bảng trong đề ở màn thi không được tràn): `&bang=1` ⇒ câu 1 có bảng 2 hàng × 4 cột (tự xoay dọc ở khổ hẹp), câu 2 có bảng lớn 3 × 5 (cuộn, bóng mép).
if (thamSo.get('bang') === '1') {
  DK_BANK.phanI[0] = { ...DK_BANK.phanI[0]!, text: 'Cho nhiệt độ sôi của ammonia và các amine như bảng sau. Yếu tố nào sau đây ảnh hưởng chính đến chiều biến đổi nhiệt độ sôi trong dãy trên?',
    choices: ['Độ dài liên kết N–H.', 'Số oxi hoá của nguyên tử N.', 'Khối lượng phân tử.', 'Năng lượng liên kết N–H.'], table: [['Chất', 'Ammonia', 'Methylamine', 'Ethylamine'], ['Nhiệt độ sôi (°C)', '−33,3', '−6,4', '16,6']] }
  DK_BANK.phanI[1] = { ...DK_BANK.phanI[1]!, text: 'Cho bảng nhiệt độ sôi và độ tan trong nước của một số amine. Chất nào sau đây tan tốt nhất trong nước?',
    choices: ['Methylamine.', 'Aniline.', 'Propylamine.', 'Ethylamine.'], table: [['Chất', 'Methylamine', 'Ethylamine', 'Propylamine', 'Aniline'], ['Nhiệt độ sôi (°C)', '−6,4', '16,6', '47,8', '184,1'], ['Độ tan (g/100 g nước)', 'rất lớn', 'rất lớn', 'lớn', '3,6']] }
}
function ManThiDk() {
  const [san, datSan] = useStateDk(false)
  useEffectDk(() => { void datLuotDk().then(() => datSan(true)) }, [])
  return san ? h('div', { className: 'fixed inset-0 z-[60] overflow-y-auto overscroll-contain man-thi-phu' },
    h(ExamTakeScreenDk, { tuCong: { maCa: '246810', sbd: '12121212', hoTen: 'Nguyễn Minh Anh', namSinh: '2008', lop: '12A1', scriptUrl: 'https://may-chu-gia.invalid' } })) : null
}
const manDuoKt = () => DK_V === 'thi' ? h(ManThiDk)
  : DK_V === 'kq' ? h(KetQuaSauNopDk, { kieu: 'da_cong_bo', tenCa: 'Kiểm tra 50 phút · 12A1', gioNop: '20:41 · Thứ Bảy 24/10/2026', lanThu: 1, diem: 8.25, dung: 23, tong: 28, lam: '41 phút', de: '50 phút', ss: 0.5, truoc: 7.75,
      phan: [{ ma: 'I', ten: 'Phần I · Trắc nghiệm', dung: 16, tong: 18, motPhan: 0, diem: 4, toiDa: 4.5 }, { ma: 'II', ten: 'Phần II · Đúng–sai', dung: 2, tong: 4, motPhan: 2, diem: 2.75, toiDa: 4 }, { ma: 'III', ten: 'Phần III · Trả lời ngắn', dung: 5, tong: 6, motPhan: 0, diem: 1.5, toiDa: 1.5 }],
      cau: Array.from({ length: 28 }, (_, i) => ({ phan: i < 18 ? 'I' : i < 22 ? 'II' : 'III', so: i + 1, kq: [4, 13].includes(i) ? 'sai' : i === 20 ? 'mot_phan' : 'dung' })), expCa: 40, onXemBaoCao: noop, onVe: noop } as never)
  : h('div', { className: 'fixed inset-0 z-50 overflow-y-auto overscroll-contain' }, h(ManKiemTraCaNhanDk, { token: 'tk', sbd: '12121212', id: 'kt-dk', onVe: noop, onCapNhat: noop }))
// ═══ hết DUO KIỂM TRA 27/10
// ═══ THƯỞNG PHẠT 26/10: `?man=tp&v=…` = giao diện học sinh hệ thưởng phạt (khối riêng gia/thuong.tsx — component THẬT, máy chủ GIẢ tests/_thuong-mau.ts).
import { canhThuong, capFetchThuong } from './gia/thuong'
if (man === 'tp' || thamSo.get('tp') === '1') capFetchThuong() // gộp 26/10: `&tp=1` ⇒ Lộ trình / làm chặng THẬT có cắm thưởng phạt
// ═══ hết THƯỞNG PHẠT 26/10
if (['dao', 'doan', 'de-thu', 'than-thu', 'cua-hang'].includes(man)) throw Error('Cảnh Game đã ngừng: ' + man)

const MAN_THAY: Record<string, string> ={ 'gv-len-bang': 'goilenbang', 'gv-toan-canh':'hocsinh', 'gv-giao-btvn':'giaobtvn', 'gv-giao-tuan':'khodegiao', 'gv-lich-su-ca':'lichsuca', 'gv-hs-hoi':'cauhoi', 'gv-theo-doi':'lichsuca', 'gv-hom-nay':'tongquan', 'gv-kho':'nganhangde', 'gv-cai-dat':'caidat', 'gv-hoc-sinh':'hocsinh', 'gv-mo-ca':'tao-ca', 'gv-go-nut':'cauhoi', 'gv-duyet':'duyetloigiai', 'gv-nhip': 'chiendich', 'gv-ma-tran': 'tao-ca' }
if (man === 'gv-duyet' && thamSo.get('ma')) location.hash = `duyet-loi-giai=${thamSo.get('ma')}`
// Hàm (cẩu lên đầu) vì cảnh giả fetch ở trên gọi tới trước dòng này.
function cauDuyetGia() { return [
  { qid: 'DH-12-C1-D4-3', bam: 'b3', dang: 'tn', bo: 'C1', trangThai: 'cho_duyet', sach: true, co: [], ghiChu: '', loiMay: '', soLan: 1 },
  { qid: 'DH-12-C1-D4-7', bam: 'b7', dang: 'tn', bo: 'C1', trangThai: 'cho_duyet', sach: false, co: [{ loai: 'dapAn', ghi: 'số ester ứng với C4H8O2 là 4, kho đang ghi B (3 chất).', chot: 'D', sua: { truong: 'dapAn', truoc: 'B', sau: 'D' } }], ghiChu: '', loiMay: '', soLan: 1 },
  { qid: 'DH-12-C1-D4-12', bam: 'b12', dang: 'ds', bo: 'C1', trangThai: 'cho_duyet', sach: true, co: [], ghiChu: '', loiMay: '', soLan: 1 },
  { qid: 'DH-12-C1-D4-19', bam: 'b19', dang: 'tln', bo: 'C1', trangThai: 'truot', sach: false, co: [], ghiChu: '', loiMay: 'phương trình ở bước 2 chưa cân bằng số nguyên tử O.', soLan: 2 },
  { qid: 'DH-12-C1-D4-22', bam: 'b22', dang: 'tln', bo: 'C1', trangThai: 'da_duyet', sach: true, co: [], ghiChu: '', loiMay: '', soLan: 1 },
] }
const EM_TD = [
  ['Trịnh Quốc Huy', 'khoa', 9, null, 3, 41], ['Trần Minh Hiếu', 'dang_lam', 12, null, 2, 18], ['Ninh Thị Mai', 'dang_lam', 8, null, 1, 6],
  ['Lê Hà My', 'da_nop', 20, 9.5, 0, 0], ['Phan Gia Bảo', 'da_nop', 20, 8.5, 0, 0], ['Ngô Minh Châu', 'da_nop', 20, 9, 0, 0],
  ['Bùi Thanh Tâm', 'dang_lam', 15, null, 0, 0], ['Hoàng Yến Nhi', 'dang_lam', 13, null, 0, 0], ['Phạm Tuấn Kiệt', 'cho_thi_lai', 10, null, 0, 0], ['Đỗ Khánh Linh', 'chua_vao', null, null, 0, 0],
].map(([hoTen, tt, daLam, diem, soLanRoiMan, tongGiayRoiMan], i) => ({ sbd: String(120100 + i), hoTen, tt, daLam, tongCau: daLam === null ? null : 20, soLanRoiMan, tongGiayRoiMan, diem })) as never[]
const manTheoDoi = () => h('div', { className: 'gv-page', style: { padding: '16px clamp(12px, 3vw, 32px) 64px', maxWidth: 1320, margin: '0 auto' } }, h(TheoDoiCa, { tenCa: 'Kiểm tra 15 phút · 12A1', maCa: 'DH-12-C2-B6', link: 'https://omr-app-b3u.pages.dev/hs?ca=DH-12-C2-B6', daChepLink: false, onChepLink: noop, onChepLinkDiem: noop,
  moLuc: '19:30 · Thứ Hai 26/10/2026', hetHanVao: '19:40', thoiGianPhut: 15, congBoChu: 'Khi cả lớp nộp xong', phamViChu: 'Lớp 12A1', conGiay: 522, em: EM_TD, soChuaVao: 1,
  nguongLan: 3, dangTai: false, dangDuyet: null, onLamMoi: noop, onMoKhoa: noop, onXemEm: noop, onChieuMa: noop, onKetThuc: noop, onDongCuaVao: noop, dangLamNgay: 6 } as never))
// ═══ NGANG GV 26/10: `gv-lich-su-ca&mo=1` = màn Ca kiểm tra bọc như App.tsx khi cờ 2.0 bật (nút «Mở ca kiểm tra» góc phải đầu màn)
const manCaHoa2 = () => h('div', { className: 'ca-hoa2-khung' }, h('button', { type: 'button', className: 'ca-hoa2-mo-ca' }, 'Mở ca kiểm tra'), h(LichSuCaScreen))
// ═══ hết NGANG GV 26/10
const con =
  man === 'gv-lich-su-ca' && thamSo.get('mo') === '1' ? manCaHoa2() : // NGANG GV 26/10
  man === 'gv-toan-canh' ? h(ToanCanhEmScreen, { sbdHoSo: '11011' }) : man === 'gv-giao-btvn' ? h(PhanCongScreen) : man === 'gv-giao-tuan' ? h(GiaoDeTheoTuanScreen) :
  man === 'gv-lich-su-ca' ? h(LichSuCaScreen) : man === 'gv-hs-hoi' ? h(CauHoiScreen) : man === 'gv-theo-doi' ? manTheoDoi() : // «Trong» nhóm 4
  man.startsWith('hs12-') ? manHs12() : // LÀN HỌC SINH 12/10
  man === 'hs-nhip' ? manNhipEm() : // LÀN NHỊP EM 12/10C
  man === 'hs-the' ? manTheHomNay() : // LÀN THẺ HÔM NAY 12/10E
  man === 'lam13' ? h(ManLam13) : // LÀN MÀN LÀM BÀI 12/10D
  man === 'hs-ho-so' ? h(ManHoSoEm) : // LÀN HỒ SƠ EM 12/10F
  man === 'gv-len-bang' ? h(GoiLenBangScreen) : man === 'gv-chieu' ? h(DieuKhienToChieuScreen) : // «TRONG» NHÓM 3
  man === 'hs-menu' ? manMenuTrong() : // LÀN «TRONG» HS 26/10
  man === 'hs-dang-nhap' ? manDangNhapTrong() : // LÀN «TRONG» HS 26/10
  man === 'hs-sheet' ? manTamTrong() : // LÀN «TRONG» HS 26/10
  man === 'hs-mot' ? manMotTrang() : // MỘT TRANG HS 26/10
  man === 'hs-ng' ? manNgang() : // NGANG HS 26/10
  man === 'duo-sua' ? manDuoSua() : // DUO SỬA 27/10
  man === 'soat-ktcn' ? manSoatKtcn() : // ═══ SOÁT 26/10
  man === 'duo-kt' ? manDuoKt() : // DUO KIỂM TRA 27/10
  man === 'tp' ? canhThuong() : // THƯỞNG PHẠT 26/10
  man === 'gv-hom-nay' ? h(GvHomNayScreen) : man === 'gv-kho' ? h(NganHangDeScreen) : man === 'gv-cai-dat' ? h(CaiDatScreen) : man === 'gv-hoc-sinh' ? h(HocSinhScreen) : man === 'gv-mo-ca' ? h(ExamSetupScreen) : man === 'gv-go-nut' ? h(BanGoNutThatScreen) : man === 'gv-duyet' ? h(DuyetLoiGiaiScreen) :
  PH_VAO ? h(BatLinhShell, { vai: 'ph' }, h(ParentPortalScreen)) : // NGANG PH 26/10
  man === 'ph' ? h(AppPhuHuynh, { sbd: '12121212', hoTen: 'Nguyễn Minh Anh', lop: '12A1', onDoiSbd: noop })
  : man === 'gv-nhip' ? (useCoHoa2.getState().dat({ bat: true, lop: [], sbd: [] }), thamSo.get('the') && useSoDemGv.getState().datMoHanhTrinh({ the: thamSo.get('the') as TheHanhTrinh, ...(thamSo.get('khoi') ? { khoi: Number(thamSo.get('khoi')) } : {}) }), h(ChienDichScreen))
  : man === 'gv-ma-tran' ? h('div', { style: { padding: 24, maxWidth: 900 } }, h(BangMaTranDe, { nguon: KHO, rut: false }))
  : man === 'hs-moi' ? h(HocTapHomNay, { ten: 'Minh Anh', lop: '12A1', ketQua: { cheDo2: true, sanh: SANH_MOI } as never, dangTai: false, loi: '', coCa: thamSo.get('ca') === '1',
      onHoc: noop, onXemLai: noop, onChua: noop, onThi: noop, onTuLuyen: noop, onLichSu: noop, onBaiTap: noop, onGiaDinh: noop, onTaiLai: noop, onDangXuat: noop, onKetQua: noop, onBangTin: noop, onLuyenLai: noop })
  : man === 'hs-lam' ? h(ManLamBaiTap, { token: 'tk', sbd: '12121212', onVe: noop, onCapNhat: noop, onChua: noop })
  : man === 'chua-cau-sai' ? h(ManChuaCauSai, { token: 'tk', qid: 'DH-12-C1-B2-17', onVe: noop })
  : man === 'cau-da-lam' ? h(CauDaLam, { token: 'tk', hoTen: 'Nguyễn Minh Anh', sbd: '12121212', lop: '12A1', onVe: noop, caGanNhat: { chu: 'Chưa có ca đã công bố', coDiem: false }, onLichSuCa: noop })
  : man === 'sanh-xong' ? manSanh(SANH_XONG)
  : man === 'sanh-ca-mo' ? manSanh(SANH_HT, { caDangMo: true })
  : man === 'sanh-dang-tai' ? manSanh(null)
  : manSanh(SANH_HT)

const manThay = MAN_THAY[man]
// TRUNG TU 09/10: mọi màn thầy chụp ở CHẾ ĐỘ 2.0 thật (cờ bật + `data-hoa2` trên vỏ như App.tsx) — trước đây chỉ gv-nhip bật cờ nên thanh bên
// trong ảnh là danh sách cũ 9 mục. Thanh đáy (< 880 px) cũng dựng như app thật. `?giao=toi|sang` = thầy ép nút Sáng/Tối trong Cài đặt.
const MAN_STORE: Record<string, string> = { 'gv-len-bang': 'goilenbang', 'gv-toan-canh': 'toancanh', 'gv-giao-btvn': 'giaobtvn', 'gv-giao-tuan': 'khodegiao', 'gv-lich-su-ca': 'lichsuca', 'gv-hs-hoi': 'cauhoi', 'gv-theo-doi': 'exammonitor', 'gv-hom-nay': 'tongquan', 'gv-kho': 'nganhangde', 'gv-cai-dat': 'caidat', 'gv-hoc-sinh': 'hocsinh', 'gv-mo-ca': 'examsetup', 'gv-go-nut': 'bangonutthat', 'gv-duyet': 'duyetloigiai', 'gv-nhip': 'chiendich', 'gv-ma-tran': 'examsetup' }
if (manThay) {
  // Trang chụp nạp CHUNG CSS game (doan.css có lớp `.dh-so` cùng tên — ô đáp số Đoàn Hộ Tống, rộng 100%, nền giấy) với màn thầy; app thầy thật
  // KHÔNG nạp doan.css (mảnh game chỉ máy em tải) ⇒ trả số bước Dạy học / Kiểm tra đầu giờ về đúng hình tròn 36 px của day-hoc.css cho ảnh chụp.
  document.head.append(Object.assign(document.createElement('style'), { textContent: '.vo-thay .dh-buoc-dau > .dh-so{width:36px;height:36px;padding:0;border-radius:50%;box-shadow:none;background:var(--bts-duong);color:var(--bts-mat);font-size:16px}' }))
  useCoHoa2.getState().dat({ bat: true, lop: [], sbd: [] })
  useAppStore.setState({ screen: MAN_STORE[man] as never })
}
const giao = thamSo.get('giao')
if (giao === 'toi' || giao === 'sang') apDungGiaoDien(giao)
createRoot(document.getElementById('root')!).render(
  manThay
    ? (document.body.removeAttribute('data-bat-linh'), h('div', { className: 'min-h-screen m3 m3-thay vo-thay', 'data-hoa2': '' }, h(ThanhBenTrai), h('div', { className: 'khung-noi-dung' }, h('div', { className: 'giua-noi-dung', 'data-teacher-screen': manThay }, con)), h(BottomNav)))
    : man === 'ph' || man === 'gv-chieu' || PH_VAO ? (document.body.removeAttribute('data-bat-linh'), con) : h(BatLinhShell, { vai: 'hs' }, con),
)
