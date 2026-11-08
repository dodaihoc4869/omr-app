// MÁY YẾU (29/09): hai khối cổng học sinh chỉ hiện khi em BẤM mở (tab Bảng tin, hộp Khắc phục câu sai).
// Gom vào MỘT điểm nạp lười để Rolldown sinh ít mảnh (precache ≤ 170 tệp — scripts/kiem-sw.mjs); StudentPortalScreen nạp tệp này bằng import().
// Tab Khắc phục: LuyenDeChuan nay nạp khi mở (13/10), không precache.
// Gói C 15/10 (app mở nhanh hơn): thêm ba khối chỉ hiện khi em BẤM mở tab — Khắc phục (KhoiKhacPhuc3CheDo, kéo theo cửa nạp kho đề, thẻ câu,
// thuật toán rút câu sai), Bài tập về nhà (BtvnM3), Bài gia đình giao (MomM3). Cùng mảnh này ⇒ không thêm tệp precache; cổng nạp trước lúc rảnh.
export { default as BangTinPhuHuynh } from './BangTinPhuHuynh'
export { default as ModalKhacPhucCauSai } from './ModalKhacPhucCauSai'
export { default as KhoiKhacPhuc3CheDo } from './KhoiKhacPhuc3CheDo'
export { default as BtvnM3 } from './bang-nhiem-vu/BtvnM3'
export { MomDanhSachM3, MomLamBaiM3 } from './bang-nhiem-vu/MomM3'
// 25/10 (tức thì hơn nữa): tab «Xem điểm» (LichSuCaM3) cũng chỉ hiện khi em BẤM ⇒ vào mảnh này, lượt mở /hs bớt mã của nó.
export { default as LichSuCaM3 } from './bang-nhiem-vu/LichSuCaM3'
// 02/11: khung xem phiếu (StudentPortalScreen chỉ vẽ khi em bấm mở phiếu) — mảnh này đã chứa nó (hộp Khắc phục dùng chung) ⇒ không thêm tệp.
export { default as KhungXemPhieu } from './KhungXemPhieu'
// 02/11 (lần 2): tấm «Vào phòng thi» + form vào ca (chỉ hiện khi em bấm Vào ca kiểm tra) — lượt mở /hs bớt mã + tờ kiểu của hai khối này.
export { default as PhongVaoThi } from './PhongVaoThi'
export { default as VaoThiForm } from './bang-nhiem-vu/VaoThiForm'
// 02/11 (sau PR 759): nhãn hạn nộp của danh sách Bài tập về nhà kiểu cũ (nhánh không-M3) — chỉ cổng học sinh nhập ⇒ vào thẳng mảnh này, không thêm tệp.
export { default as NhanHanBaiTap } from './NhanHanBaiTap'
// 02/11 (sau PR 786): đề + phương án màn làm Bài gia đình giao kiểu cũ — MomM3 ở mảnh này vốn dùng chung ⇒ không thêm tệp.
export { MomQuestionStem, MomOption } from './MomQuestionMedia'
// …và màn Ôn câu (LamCauOn — dùng chung MomQuestionMedia; trước là mảnh riêng + tờ kiểu riêng): gom về đây ⇒ precache bớt tệp, nạp sẵn lúc rảnh.
export { default as LamCauOn } from './bang-nhiem-vu/LamCauOn'
// Bong bóng A.I Đỗ Đại Học (24/10): cửa nạp nằm Ở ĐÂY (không ở StudentPortalScreen) ⇒ danh sách mảnh kèm của import() không vào lượt mở /hs; bong bóng vẫn là mảnh riêng ngoài precache.
export const napBong = () => import('./ai-ddh/BongBongAiDdh')

// MÁY YẾU 27/10 (thầy: «Máy yếu bị lag»): mảnh này nạp lúc rảnh sau khi Lộ trình hiện ⇒ đo nhịp khung thật ở đây (src/lib/do-nhip-khung.ts):
// thông số máy trông ổn mà khung hình chậm ⇒ bật chế độ máy yếu ngay + nhớ cho lần mở sau. Không thêm tệp, không cộng byte lượt mở.
import { henDoNhipKhung } from '../lib/do-nhip-khung'
// 03/11 PHƯƠNG ÁN VỪA VẶN (thầy «tất cả công thức kiểu này phải hiển thị đẹp vừa vặn»): tự dò mọi nhóm phương án (làm chặng · luyện tập · kiểm tra · xem lại)
// ⇒ công thức dài không bị cắt giữa chừng: thu cỡ chữ cả nhóm / lưới 2 cột ⇒ 1 cột (src/lib/vua-phuong-an.ts). Gắn ở mảnh nạp lười này ⇒ lượt mở /hs không cộng byte.
import { ganToanTrang } from '../lib/vua-phuong-an'
if (typeof document !== 'undefined') ganToanTrang()
// 03/11 NHÃN «ĐÃ LÀM ĐÚNG / SAI» ở màn kiểm tra ôn tập (thầy: «đếm rõ mấy lần, sau ca xem rõ 4 kết quả»): bộ quét chỗ giữ `.duo-kt-ls` (src/lib/nhan-lich-su.ts).
if (typeof document !== 'undefined') void import('../lib/nhan-lich-su').then((m) => m.ganNhanLichSu(), () => {}) // nạp lười lồng: không phụ thuộc tĩnh
if (typeof window !== 'undefined') henDoNhipKhung(window)

// 27/10 MƯỢT: hâm nóng bộ dò «Chạm để hiểu đề» lúc rảnh trên Lộ trình (src/components/goi-y-cham/tu-dien.ts) ⇒ mở câu đầu / sang câu không còn khựng
// 200–400 ms ở máy yếu. Chỉ giao diện «Trong» của học sinh (nơi màn làm chặng có chạm để hiểu đề).
import { hamNongTuDien } from './goi-y-cham/tu-dien'
// Bắt đầu sau 8 s: sau khung đo nhịp của henDoNhipKhung ở trên (không làm khung đo chậm đi, kẻo bật nhầm chế độ máy yếu) và sau lúc Lộ trình vừa mở
// xong (không chen tác vụ vào lúc em vừa mở app). Em bấm học sớm hơn ⇒ màn làm chặng tự hâm nóng lúc rảnh.
if (typeof document !== 'undefined' && document.documentElement.dataset.trong === 'hs') window.setTimeout(hamNongTuDien, 8000)

// 02/11 MOL SỐNG ĐỘNG (thầy «tải luôn hiệu ứng sẵn cho máy yếu nhé»): app mở xong và rảnh (sau khung đo nhịp ở trên) ⇒ NẠP TRƯỚC mảnh Mol (mol-dong,
// kho chạy-lúc của service worker, không vào precache) ⇒ lần Mol hiện đầu ở màn khác (kết chặng, kiểm tra, thưởng) không phải chờ mảnh. Đã nạp ⇒ không làm gì.
if (typeof document !== 'undefined' && document.documentElement.dataset.trong === 'hs') {
  const napMol = () => { void import('./linh-vat/Bi').then((m) => m.napTruocMol(), () => {}) }
  const ric = (window as Window & { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number }).requestIdleCallback
  window.setTimeout(() => (ric ? ric(napMol, { timeout: 5000 }) : napMol()), 4000)
}

// 02/11 HỆ KÍNH (thầy «mọi hiệu ứng tải sẵn» · «Nạp sẵn hết hiệu ứng và giao diện đảm bảo máy yếu cũng chạy được mượt mà lung linh»): sau Mol, NẠP LẦN LƯỢT
// các màn em mở từ Hôm nay mà trước đây tải lúc bấm — giám thị mới (đứng cạnh mọi câu), màn thưởng (chuỗi · giải tuần · nhiệm vụ · cửa hàng · huy hiệu ·
// bạn), Tu luyện, Câu đã làm; mỗi mảnh kéo theo tờ kiểu của nó ⇒ giao diện có sẵn. Một mảnh một lúc, mỗi mảnh đợi lúc rảnh (napTruocLanLuot); tiết kiệm
// dữ liệu / 2G / mất mạng ⇒ thôi. Em đã mở màn con (Hôm nay nằm dưới khung `inert`) ⇒ dừng: chèn tờ kiểu lúc em đang làm câu là một lượt tính kiểu cả trang.
// Toàn mảnh có sẵn (không thêm tệp precache); vòng nạp viết NGAY Ở ĐÂY (không gọi napTruocLanLuot của hoa2/nap-truoc-man — mảnh ấy nằm trong lượt
// mở /hs, gọi thêm hàm của nó là kéo hàm vào lượt mở +149 byte nén) ⇒ lượt mở /hs không cộng byte.
if (typeof document !== 'undefined' && document.documentElement.dataset.trong === 'hs') {
  const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
  const nenNap = navigator.onLine !== false && !c?.saveData && !/2g/.test(c?.effectiveType ?? '')
  const hang: (() => Promise<unknown>)[] = [
    () => import('./giam-thi/GiamThi'),
    () => import('./thuong/ManThuong'),
    () => import('./tu-luyen/ManTuLuyen'),
    () => import('./hoa2/CauDaLam'),
  ]
  const ric = (window as Window & { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number }).requestIdleCallback
  const tiep = (): void => {
    if (!hang.length || document.querySelector('[inert] .ht2[data-mot]')) return
    const lam = () => { if (!document.querySelector('[inert] .ht2[data-mot]')) hang.shift()?.().then(tiep, () => { hang.length = 0 }) }
    if (ric) ric(lam, { timeout: 2000 }); else window.setTimeout(lam, 200)
  }
  if (nenNap) window.setTimeout(tiep, 6000)
}
