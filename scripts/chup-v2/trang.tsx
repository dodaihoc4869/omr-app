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
import '../../src/styles/vo-thay.css'
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
// Như main.tsx: giao diện «Trong» (26/10) — cảnh thầy `gv…` = 'gv', cảnh phụ huynh không bật, còn lại (học sinh, màn thi) = 'hs'. `&trong=tat` ⇒ giao diện cũ.
if (man !== 'ph' && !man.startsWith('ph-') && thamSo.get('trong') !== 'tat') document.documentElement.dataset.trong = man.startsWith('gv') ? 'gv' : 'hs'
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
  if (b.action === 'danhSachCa') return tra({ ok: true, items: b.daXoa ? [] : CA_GIA })
  if (b.action === 'danhSachCauHoi') return tra({ ok: true, items: CAU_HOI_GIA })
  if (u.pathname.endsWith('/gv/hoc-phi/ds')) return tra({ ok: true, items: HOC_PHI_GIA })
  // Hành trình › Cần thầy chữa (trung tu 09/10 tối): bước cuối trên lớp + thẻ nút thắt GIẢ (tên em giả).
  if (u.pathname.endsWith('/gv/chua-cau-sai/hang-chieu')) return tra({ ok: true, bat: true, conNua: false, ds: BUOC_CUOI_GIA })
  if (u.pathname.endsWith('/gv/nut-that/ds')) return tra(NUT_THAT_GIA)
  // «Trong» nhóm 4: Duyệt lời giải mở sẵn đề 12-KT-C1-D4 (28 câu: 15 đã duyệt · 9 chờ duyệt, 5 sạch · 2 máy đang soạn · 2 chờ sửa kho)
  if (u.pathname.endsWith('/gv/loi-giai/cho-duyet')) return tra({ ok: true, maDe: '12-KT-C1-D4', cau: cauDuyetGia(), tong: { cau: 28, daDuyet: 15, choDuyet: 9, sach: 5, dangSoan: 2, traLai: 0, truot: 2, chuaCoBo: 0 } })
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
    const r = traLoiLam13(new URL(url, location.href).pathname, b)
    return r ? new Response(JSON.stringify(r), { status: 200, headers: { 'content-type': 'application/json' } }) : fetchChung(input, init)
  }
}
function ManLam13() {
  const [homNay, datHomNay] = useStateLam13(soHomNayLam13())
  return h('div', { className: 'fixed inset-0 z-50 overflow-y-auto' }, h(ManLamBaiTap, { token: 'tk', sbd: '12121212', onVe: noop, onCapNhat: () => datHomNay(soHomNayLam13()), onChua: noop, homNay }))
}
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
const con =
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
  man === 'gv-hom-nay' ? h(GvHomNayScreen) : man === 'gv-kho' ? h(NganHangDeScreen) : man === 'gv-cai-dat' ? h(CaiDatScreen) : man === 'gv-hoc-sinh' ? h(HocSinhScreen) : man === 'gv-mo-ca' ? h(ExamSetupScreen) : man === 'gv-go-nut' ? h(BanGoNutThatScreen) : man === 'gv-duyet' ? h(DuyetLoiGiaiScreen) :
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
    : man === 'ph' || man === 'gv-chieu' ? (document.body.removeAttribute('data-bat-linh'), con) : h(BatLinhShell, { vai: 'hs' }, con),
)
