// ============================================================================
// APPS SCRIPT NHẬN BÀI KIỂM TRA — dán file này vào script.google.com
// ============================================================================
// CÁCH TRIỂN KHAI (thầy tự làm, 1 lần cho mỗi lớp hoặc dùng chung 1 file cho
// mọi lớp cũng được — sheet tự phân biệt theo cột "Lớp"):
//
// 1. Mở https://script.google.com → "Dự án mới" (New project).
// 2. Xoá hết code mẫu, dán TOÀN BỘ nội dung file này vào.
// 3. Vào Cài đặt dự án → Thuộc tính tập lệnh → thêm SPREADSHEET_ID = ID của
//    Google Sheet thầy đã tạo (KHÔNG sửa hằng trong file — dán file mới đè lên
//    là mất). Chưa đặt thuộc tính thì mới sửa hằng SPREADSHEET_ID bên dưới.
//    (mở sheet đó, lấy đoạn ký tự trong URL giữa /d/ và /edit).
// 4. Bấm biểu tượng đĩa mềm để lưu (Ctrl+S).
// 5. Bấm "Triển khai" (Deploy) → "Triển khai mới" (New deployment) → chọn
//    loại "Ứng dụng web" (Web app):
//      - Thực thi với quyền của: Tôi (Me)
//      - Ai có quyền truy cập: Bất kỳ ai (Anyone)
//    Bấm "Triển khai" → Google sẽ hỏi cấp quyền, thầy tự đăng nhập & đồng ý
//    (đây là bước thầy tự làm trên tài khoản Google của mình, không ai làm
//    thay được).
// 6. Copy đường link "URL ứng dụng web" (kết thúc bằng /exec) → dán vào ô
//    "Link Apps Script" trong màn Cài đặt ca kiểm tra của app.
// 7. (Nạp đề tự động) Đặt MÃ BÍ MẬT: trong trình soạn Apps Script → biểu
//    tượng bánh răng "Cài đặt dự án" (Project Settings) → "Thuộc tính tập
//    lệnh" (Script properties) → Thêm: tên MA_BI_MAT, giá trị là một chuỗi
//    dài tuỳ thầy (vd 20 ký tự ngẫu nhiên). Nhập cùng mã này vào màn "Ngân
//    hàng câu hỏi" của app trên máy thầy và vào file kho-de/cau-hinh.json
//    trên máy để pipeline "Nạp đề mới" đẩy đề lên. Ai không có mã này thì
//    KHÔNG đọc được đề/đáp án trong kho — đề không bao giờ nằm trên GitHub.
// 8. (Nạp đề tự động) CẤP QUYỀN DRIVE 1 LẦN: kho đề lưu file JSON trong thư
//    mục Drive OMR-APP-DATA (đề có ảnh vượt 50.000 ký tự/ô Sheet), nên script
//    cần thêm quyền Drive — cập nhật triển khai KHÔNG tự hỏi quyền này. Trong
//    trình soạn: chọn hàm capQuyenVaKiemTra ở thanh trên → Chạy → "Xem lại
//    quyền" → Cho phép. Nhật ký thực thi phải in "ghi/đọc JSON: OK". Chưa làm
//    bước này thì nút "Đẩy file JSON" trong app báo "Failed to fetch" (503).
//
// Mỗi lần sửa code này, phải bấm "Triển khai" → "Quản lý triển khai" →
// chỉnh sửa (bút chì) → chọn phiên bản mới → Triển khai lại, thì thay đổi
// mới có hiệu lực (không tự cập nhật).
//
// GHI CHÚ VỀ CHỐNG GIAN LẬN: không có cách nào để trang web/PWA phát hiện
// học sinh CHỤP ẢNH MÀN HÌNH — không trình duyệt nào (Chrome, Safari) cấp
// quyền đó cho JavaScript, vì lý do riêng tư của người dùng. Cột
// "SoLanRoiApp"/"TongGiayRoiApp" dưới đây ghi lại tín hiệu GẦN NHẤT có thể đo
// được: số lần và tổng thời gian học sinh chuyển sang app khác/tắt màn hình
// trong lúc làm bài — dùng để thầy để ý, không phải bằng chứng chắc chắn.
// ============================================================================

const SPREADSHEET_ID = 'DÁN_ID_GOOGLE_SHEET_CỦA_THẦY_VÀO_ĐÂY'

/** ID BẢNG TÍNH THẬT — đọc từ Script properties trước, hằng bên trên chỉ là
 * đường lui.
 *
 * Vì sao: file này nằm trong repo CÔNG KHAI nên hằng bên trên buộc phải là chỗ
 * trống mẫu. Dán cả file đè lên bản đang chạy là xoá mất ID thật của thầy và
 * máy chủ chết ngay — đã xảy ra một lần, 05/09/2026. Đặt ID vào Script
 * properties (Cài đặt dự án → Thuộc tính tập lệnh → thêm `SPREADSHEET_ID`) thì
 * từ nay dán đè bao nhiêu lần cũng không mất. */
function idBang_() {
  try {
    const p = (PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || '').trim()
    if (p) return p
  } catch (err) {}
  return SPREADSHEET_ID
}
const SHEET_CA = 'CaKiemTra'
const SHEET_BAILAM = 'BaiLam'
const SHEET_PHUHUYNH = 'PhuHuynh'
const SHEET_NHANXET = 'NhanXet'
const SHEET_TRANGTHAI = 'TrangThai'
const SHEET_TINNHAN = 'TinNhan'
const SHEET_HOCSINH = 'HocSinh'
const SHEET_TINTHAY = 'TinNhanThay'
const SHEET_DE = 'NganHangDe'
// PHIẾU KẾT QUẢ GỬI PHỤ HUYNH. Mỗi phiếu một dòng, khoá là MÃ NGẪU NHIÊN 16 ký
// tự do máy thầy sinh (crypto.getRandomValues, ~96 bit) — không dò ra được và
// KHÔNG có lệnh nào liệt kê danh sách mã. Chỉ `layPhieu` là đọc được, và phải
// đưa đúng mã. Xoá dòng ở đây là link đã gửi chết ngay: đó là đường thu hồi.
const SHEET_PHIEU = 'PhieuKetQua'
// Cột Loai (thứ 9) tách phiếu KẾT QUẢ với phiếu BÀI TẬP: một em trong một ca có
// cả hai, mà gửi Zalo thì phải gửi đúng loại. Phiếu cũ ô trống ⇒ 'ketqua'.
const PHIEU_HEADERS = ['Ma', 'MaCa', 'SBD', 'HoTen', 'PhieuJson', 'TaoLuc', 'SoLanXem', 'XemLanCuoi', 'Loai']
const SHEET_LUOT = 'LuotThi'
// NỘP PHIẾU KHẮC PHỤC (NOP-PHIEU-KHAC-PHUC.md). Mỗi LƯỢT nộp một hàng, KHÔNG
// đè: thầy cần thấy "lần 1 đúng 4/10, lần 2 đúng 8/10" — đè là mất tiến bộ.
//
// Bảng này KHÔNG dính gì tới điểm ca: không vào BangDiem, không vào ChiTietCau,
// không lên báo cáo phụ huynh như một con điểm. Đây là dấu vết luyện tập.
const SHEET_NOPKP = 'NopKhacPhuc'
const NOPKP_HEADERS = ['Ma', 'MaCa', 'SBD', 'LanThu', 'NopLuc', 'SoCau', 'SoDung', 'DapAnJson', 'QidSaiJson']
/** Trần số câu một lượt nộp — phiếu khắc phục dài nhất cũng chỉ vài chục câu. */
const TOI_DA_CAU_NOPKP = 200
const DRIVE_FOLDER = 'OMR-APP-DATA'

// Cột sheet CaKiemTra (1-based = vị trí trong mảng + 1). 7 cột đầu có từ bản
// đầu; từ cột 8 thêm khi làm QUANLYCATHI (3 mốc thời gian, trạng thái, phạm vi).
// getSheet_ chỉ ghi tiêu đề khi TẠO MỚI sheet — sheet cũ được bổ sung tiêu đề
// cột thiếu bằng boSungTieuDe_.
// Cột 18–19 thêm ở BA-APP đợt 3: Loai = 'thi' (mặc định, ô trống cũng là thi)
// hoặc 'baitap' — BÀI TẬP VỀ NHÀ dùng CHUNG mọi thứ với ca thi, chỉ khác 5 điểm
// (xem BA-APP.md mục 6). HanNop chỉ có nghĩa với bài tập.
// KhoaLuc/KhoaBoi/MoKhoaLuc (cột 20–22): thầy KHOÁ CA thủ công giữa giờ —
// CATHIVAGOILENBANG mục 1. Trạng thái ca vẫn dùng cột TrangThai sẵn có
// ('mo' · 'dong' · 'da_xoa'); ba cột này chỉ ghi DẤU VẾT ai khoá lúc nào, để
// sau còn đối chứng khi em kêu "con đang làm thì mất bài".
// Cột LenBang (thứ 23) = nút gạt thầy bật lúc mở ca: ca này có dùng để phân
// công gọi lên bảng hay không. Ô TRỐNG (mọi ca mở trước 05/09) = CÓ — ca cũ
// không được biến mất khỏi màn Gọi lên bảng chỉ vì thêm một cột.
// Cột GiuDeDoc (24) + AnHanGiay (25) = GIUDEDOC.md: đề chỉ hiện khi ngón tay em
// còn trên màn thi. Ô TRỐNG (mọi ca mở trước 05/09) = TẮT — ngược hẳn LenBang,
// vì bật nhầm cho ca cũ là đổi cách làm bài của một em không biết trước.
// PHÒNG CHỜ (thầy chốt 07/09) — hai cột cuối:
//   PhongCho     'co' = em vào ca thì đứng ở màn chờ, chưa nhận đề.
//   BatDauThiLuc thầy bấm "Bắt đầu thi" lúc nào. Rỗng = chưa bấm.
// `boSungTieuDe_` tự thêm hai cột này vào sheet cũ, ca cũ đọc ra rỗng nên chạy
// y như trước.
const CA_HEADERS = ['MaCa', 'Lop', 'ThoiGianPhut', 'MoLuc', 'BankJson', 'ImmediateFeedback', 'KeyBankJson', 'BatDau', 'HetHanVao', 'TrangThai', 'TenCa', 'PhamVi', 'DanhSachMoi', 'NguoiTao', 'XoaLuc', 'NguongLan', 'NguongGiay', 'Loai', 'HanNop', 'KhoaLuc', 'KhoaBoi', 'MoKhoaLuc', 'LenBang', 'GiuDeDoc', 'AnHanGiay', 'PhongCho', 'BatDauThiLuc', 'BoTheoEmJson', 'DeRieng']

/** Đọc cột GiuDeDoc: CHỈ chuỗi 'co' mới là BẬT. Ô trống = tắt. */
function giuDeDocCua_(v) {
  return String(v || '') === 'co'
}
/** Ân hạn nhả tay (giây). Ngoài bốn mức thầy chọn thì về mặc định 3. */
function anHanGiayCua_(v) {
  const n = Number(v)
  return n > 0 ? n : AN_HAN_GIAY_MAC_DINH
}
const AN_HAN_GIAY_MAC_DINH = 3

/** Đọc cột LenBang: chỉ chuỗi 'khong' mới là TẮT. Ô trống, 'co', giá trị lạ
 * đều là BẬT — một chỗ trả lời, để danhSachCa và docCa_ không hiểu khác nhau. */
function lenBangCua_(v) {
  return String(v || '') !== 'khong'
}
// CHỐNG GIAN LẬN THEO MỨC (QUANLYCATHI mục 6): rời màn lần 1, 2 chỉ cảnh báo;
// lần thứ NguongLan khoá bài; một lần rời quá NguongGiay giây khoá ngay. Thầy
// chỉnh khi mở ca; ô trống = mặc định dưới đây.
const NGUONG_LAN_MAC_DINH = 3
// Mặc định 10 giây (BA-APP đợt 5). Thầy chọn 2/5/10/30 khi mở ca; ô trống
// (ca mở từ bản cũ) dùng số này.
const NGUONG_GIAY_MAC_DINH = 10
// Mỗi LƯỢT THI một dòng: (MaCa, SBD, LanThu) là khoá. Thi lại = dòng mới, không
// đè dòng cũ. TrangThai: dang_lam · da_nop · khoa (bị khoá vì rời màn) ·
// duoc_duyet_lai (thầy đã duyệt, em chưa vào) · Điểm do app ghi sau khi chấm.
const LUOT_HEADERS = ['MaCa', 'SBD', 'LanThu', 'IdThietBi', 'VaoLuc', 'HetGioLuc', 'NopLuc', 'TrangThai', 'DapAnJson', 'SoLanRoiMan', 'TongGiayRoiMan', 'IntegrityJson', 'HoTen', 'DiemI', 'DiemII', 'DiemIII', 'Tong', 'DuyetBoi', 'DuyetLuc', 'GhiChu', 'CapNhatLuc', 'GiayCauJson']
// CHI TIẾT TỪNG CÂU của mỗi lượt (QUANLYCATHI mục 5) — ghi bởi ghiDiem sau khi
// chấm (máy thầy, hoặc máy em khi ca công bố điểm). Chuyên đề + mức độ lấy từ
// đề trong kho (loi_giai/chuyen_de, muc_do) — thiếu thì để trống, không đoán.
// BẢN ĐỒ SAI TỪNG CÂU — MỘT DÒNG MỖI (ca, em), ghi ngay lúc chấm.
//
// Thầy chốt 08/09: "Ca thi nào cũng phải dựng sẵn bản đồ sai từng câu, để
// những ca thi sau tôi chọn rút 30% câu sai ca trước thì sẵn có bản đồ để
// tính sai lần mấy".
//
// VÌ SAO KHÔNG ĐỌC THẲNG `ChiTietCau`: sheet đó một dòng MỘT CÂU, lớp 250 em
// nhân 30 ca nhân 30 câu là hơn hai trăm nghìn dòng — đọc để dựng đề là treo
// máy giữa lúc cả lớp đứng ở phòng chờ. Sheet này gọn hơn 30 lần và tra theo
// mã ca được ngay.
const SHEET_BANDO = 'BanDoSai'
const BANDO_HEADERS = ['MaCa', 'SBD', 'LanThu', 'QidSaiJson', 'QidLamJson', 'GhiLuc']

const SHEET_CHITIET = 'ChiTietCau'
const CHITIET_HEADERS = ['MaCa', 'SBD', 'LanThu', 'Phan', 'SoCau', 'Qid', 'ChuyenDe', 'MucDo', 'DapAnChon', 'DapAnDung', 'DungSai', 'GiayLamCau', 'GhiLuc']
// Thời gian ân hạn sau HẾT GIỜ làm bài (đồng hồ máy em lệch, mạng chậm lúc tự
// nộp) — quá mốc này vẫn nhận bài nhưng ghi chú "nộp muộn".
const AN_HAN_NOP_GIAY = 120

// ---------------------------------------------------------------------------
// TEM LUẬT CHẤM — chốt chặn cho lỗi "điểm 9 mà phiếu ghi 4" (thầy báo 08/09)
// ---------------------------------------------------------------------------
// Máy học sinh cũng chấm bài và cũng được ghi điểm lên LuotThi. Máy nào còn bản
// app trước 07/09 thì chấm bằng thang TUYỆT ĐỐI cũ (0,25/câu Phần I · 1,00/câu
// Phần II · 0,25/câu Phần III), nên ca 8/2/2 trần chỉ 4,50. Mỗi lần em mở lại
// trang kết quả, máy em ghi đè con số cũ lên điểm thầy vừa chấm lại — đo được
// trên ca 447479: cả 36 em đều nằm dưới 4,50, đúng ba em chạm trần 4,50.
//
// Từ nay máy chủ CHỈ nhận ĐIỂM từ máy em khi gói mang đúng tem này. Bản cũ
// không gửi tem ⇒ điểm bị từ chối (ghi vào `tuChoi` cho thầy đọc), còn CHI TIẾT
// TỪNG CÂU vẫn nhận vì chuyên đề, mức độ và giây làm không phụ thuộc luật chấm.
// Máy thầy có MA_BI_MAT thì luôn ghi được, không cần tem.
//
// Đổi biểu điểm về sau: đổi chuỗi này VÀ hằng `LUAT_DIEM` trong
// `src/engine/score.ts` — hai nơi phải khớp từng ký tự, có test khoá điều này.
const LUAT_DIEM = 'tile-450-400-150-v1'

/** Gom một danh sách CHỈ SỐ DÒNG GIẢM DẦN thành các khối liền mạch để xoá.
 *
 * Vào: [90, 89, 88, 50, 49, 10] (đã sắp giảm dần, không trùng).
 * Ra:  [[88, 3], [49, 2], [10, 1]] — mỗi khối là [dòng đầu, số dòng].
 *
 * Xoá từ khối có chỉ số LỚN xuống nhỏ thì chỉ số của khối sau không trôi, nên
 * thứ tự trả về giữ nguyên chiều giảm dần của đầu vào.
 *
 * Đầu vào rỗng trả mảng rỗng. Không tự sắp lại: bên gọi đã sắp, sắp thêm một
 * lần nữa chỉ giấu đi lỗi nếu bên gọi quên. */
function khoiLienMach_(dsGiamDan) {
  const ra = []
  let i = 0
  while (i < dsGiamDan.length) {
    const cuoi = dsGiamDan[i]
    let j = i
    while (j + 1 < dsGiamDan.length && dsGiamDan[j + 1] === dsGiamDan[j] - 1) j++
    const dau = dsGiamDan[j]
    ra.push([dau, cuoi - dau + 1])
    i = j + 1
  }
  return ra
}

/** Gói này có được phép ĐẶT ĐIỂM chính thức không?
 *
 * Hai đường: máy thầy (có MA_BI_MAT) — luôn được; máy em — phải mang đúng tem
 * luật chấm hiện hành. Trả `true` nghĩa là ghi được cột điểm. */
function duocGhiDiem_(coMat, body) {
  if (coMat) return true
  return String((body && body.luatDiem) || '') === LUAT_DIEM
}

// BA VAI TRÒ (BA-APP.md đợt 1). Hồ sơ học sinh/phụ huynh có TOKEN 32 ký tự do
// THẦY DUYỆT mới cấp; mọi lệnh đọc dữ liệu của một em đều tra token -> SBD ở
// máy chủ, KHÔNG tin SBD/SĐT do máy khách gửi kèm.
// TrangThai: '' = hồ sơ đăng ký trước v12 (đường cũ theo SBD/SĐT còn chạy để
// không cắt ngang người đang dùng) · cho_duyet · da_duyet (có token).
const HS_HEADERS = ['SBD', 'HoTen', 'NamSinh', 'Lop', 'DangKyLuc', 'Sdt', 'SdtPhuHuynh', 'Token', 'TrangThai', 'DuyetLuc']
const PH_HEADERS = ['SDT', 'HoTenPhuHuynh', 'SBD', 'Lop', 'HoTenHocSinh', 'DangKyLuc', 'Token', 'TrangThai', 'DuyetLuc']
const HS_COT_TOKEN = 7 // 0-based trong mảng giá trị
const HS_COT_TRANGTHAI = 8
const PH_COT_TOKEN = 6
const PH_COT_TRANGTHAI = 7
// TỔNG HỢP SẴN THEO CHUYÊN ĐỀ (BA-APP.md đợt 2). Hồ sơ một em phải mở bằng MỘT
// lệnh đọc, không quét cả ChiTietCau (34.000 dòng/tháng ở quy mô 300 em).
// TienDoCa = tổng hợp theo (em, ca, chuyên đề) — dùng vẽ xu hướng ↑↓.
// TienDoHS = cộng dồn toàn thời gian, LUÔN bằng tổng TienDoCa của em đó (nên
// chấm lại/ghi đè không bao giờ cộng trùng).
// QidDaLam = tập câu em ĐÃ từng làm, để đợt 3 rút bài tập tránh câu cũ.
const SHEET_TIENDO_CA = 'TienDoCa'
const TIENDO_CA_HEADERS = ['SBD', 'MaCa', 'ChuyenDe', 'SoCau', 'SoSai', 'NopLuc', 'CapNhatLuc']
const SHEET_TIENDO_HS = 'TienDoHS'
const TIENDO_HS_HEADERS = ['SBD', 'ChuyenDe', 'SoCau', 'SoSai', 'CapNhatLuc']
const SHEET_QID = 'QidDaLam'
const QID_HEADERS = ['SBD', 'DanhSachQid', 'SoCau', 'CapNhatLuc']
// Số ca gần nhất tính là "gần đây" khi so xu hướng; mỗi bên phải có tối thiểu
// SO_CAU_TOI_THIEU câu của chuyên đề đó thì mới dám kết luận tăng/giảm.
const SO_CA_GAN_DAY = 3
const SO_CAU_TOI_THIEU = 2
// Chênh lệch tỉ lệ sai coi là "có chuyển biến" (dưới mức này coi như đi ngang).
const NGUONG_XU_HUONG = 0.05

// YÊU CẦU GIAO BÀI (BA-APP.md đợt 4). Phụ huynh bấm "Đồng ý giao bài" trên
// phiếu kết quả → tạo một dòng chờ ở đây. MÁY THẦY là nơi rút câu (kho đề nằm
// trong Drive dạng file lớn, Apps Script đọc rất chậm), nên máy thầy mở app là
// tự xử lý hàng chờ này rồi đánh dấu xong. TrangThai: cho | xong | huy.
const SHEET_YEUCAU = 'YeuCauGiaoBai'
const YEUCAU_HEADERS = ['Id', 'SBD', 'ChuyenDe', 'SoCau', 'TaoLuc', 'TaoBoi', 'TrangThai', 'XuLyLuc', 'MaCa']
// Số câu mặc định khi phụ huynh bấm đồng ý mà không chọn gì.
const SO_CAU_YEU_CAU_MAC_DINH = 10

// DANH SÁCH HỌC SINH CHÍNH THỨC — thầy nạp từ file danh sách của mình (lệnh
// napDanhSachLop, đòi mã bí mật). Sheet này làm HAI việc:
//   1. CỔNG VÀO THI: em phải nhập ĐÚNG CẢ BA — số báo danh, họ tên, năm sinh —
//      khớp một dòng trong đây mới vào thi được, dù mã ca đúng. Gõ nhầm một
//      chữ số là bị chặn ngay thay vì tạo ra một em lạ trong bảng điểm.
//   2. NGUỒN HỌ TÊN cho bảng điểm và hồ sơ.
// Nạp lại là GHI ĐÈ TOÀN BỘ — file của thầy là nguồn sự thật duy nhất. Sheet
// rỗng thì mọi em đều bị chặn, nên lệnh nạp từ chối danh sách rỗng.
const SHEET_DSLOP = 'DanhSachLop'
const DSLOP_HEADERS = ['SBD', 'HoTen', 'NamSinh', 'Lop', 'CapNhatLuc']

// NHẬT KÝ BỊ CHẶN Ở CỔNG VÀO THI (thầy báo 07/09).
//
// Cổng vào thi so đủ ba: số báo danh, họ tên, năm sinh. Em bị chặn thì máy chủ
// CỐ Ý không nói sai ô nào — nói ra là cho phép dò tên học sinh từ số báo danh.
// Nhưng thầy đứng trong phòng thi thì cần biết ngay, mà bản cũ không giữ lại
// dấu vết gì: hai em gõ đúng cả ba ô vẫn bị chặn và không lần ra được vì sao.
//
// Mỗi lượt chặn ghi một dòng ở đây. Màn Theo dõi ca đọc ra và bày thẳng: em gõ
// gì, danh sách ghi gì. Chỉ thầy đọc được (lệnh `chiTietCa` đòi mã bí mật).
const SHEET_CHANVAO = 'ChanVao'
const CHANVAO_HEADERS = ['Luc', 'MaCa', 'SBD', 'HoTenGoi', 'NamSinhGoi', 'HoTenDs', 'NamSinhDs', 'LyDo']
/** Số dòng nhật ký chặn giữ lại cho MỘT ca khi trả về màn Theo dõi. */
const CHANVAO_TOI_DA = 40

// AI ĐANG ĐỨNG Ở PHÒNG CHỜ.
//
// Cổng phòng chờ trả em về màn chờ mà KHÔNG tạo lượt thi — nên trước 08/09
// máy chủ không biết ai đang chờ, và thầy cũng không. Chế độ ĐỀ RIÊNG TỪNG EM
// rút bộ câu đúng lúc thầy bấm Bắt đầu, nên phải biết chính xác em nào có mặt.
//
// Một em một dòng, vào lại thì cập nhật giờ chứ không đẻ dòng mới.
const SHEET_CHO = 'PhongCho'
const CHO_HEADERS = ['Khoa', 'MaCa', 'SBD', 'HoTen', 'VaoLuc']

/** Ghi em vào phòng chờ. Ghi hỏng KHÔNG được chặn em — em vẫn phải vào được
 * màn chờ, chỉ là thầy thiếu một tên trong danh sách. */
function ghiPhongCho_(maCa, sbd, hoTen) {
  try {
    const sh = getSheet_(SHEET_CHO, CHO_HEADERS)
    boSungTieuDe_(sh, CHO_HEADERS)
    const khoa = String(maCa || '') + '|' + String(sbd || '')
    const dong = [khoa, String(maCa || ''), String(sbd || ''), String(hoTen == null ? '' : hoTen), new Date().toISOString()]
    const cu = findRowByKey_(sh, 0, khoa)
    if (cu > 0) sh.getRange(cu, 1, 1, dong.length).setValues([dong])
    else sh.appendRow(dong)
  } catch (err) {
    // nuốt: nhật ký hỏng không được chặn em vào phòng chờ
  }
}

/** Danh sách em đang chờ của MỘT ca, vào trước đứng trước. */
function docPhongCho_(maCa) {
  try {
    const ss = bang_()
    const sh = ss.getSheetByName(SHEET_CHO)
    if (!sh || sh.getLastRow() < 2) return []
    const d = sh.getDataRange().getValues()
    const out = []
    for (let i = 1; i < d.length; i++) {
      if (String(d[i][1]).trim() !== String(maCa).trim()) continue
      out.push({ sbd: String(d[i][2] || ''), hoTen: String(d[i][3] || ''), vaoLuc: String(d[i][4] || '') })
    }
    out.sort(function (a, b) { return String(a.vaoLuc).localeCompare(String(b.vaoLuc)) })
    return out
  } catch (err) {
    return []
  }
}

/** Ghi một lượt bị chặn. Ghi hỏng KHÔNG được làm hỏng lượt vào thi — em đang
 * đứng chờ, nhật ký chỉ là chuyện phụ. */
function ghiChanVao_(maCa, sbd, hoTenGoi, namSinhGoi, hoTenDs, namSinhDs, lyDo) {
  try {
    const sh = getSheet_(SHEET_CHANVAO, CHANVAO_HEADERS)
    boSungTieuDe_(sh, CHANVAO_HEADERS)
    sh.appendRow([
      new Date().toISOString(),
      String(maCa || ''),
      String(sbd || ''),
      String(hoTenGoi == null ? '' : hoTenGoi),
      String(namSinhGoi == null ? '' : namSinhGoi),
      String(hoTenDs == null ? '' : hoTenDs),
      String(namSinhDs == null ? '' : namSinhDs),
      String(lyDo || ''),
    ])
  } catch (err) {
    // nuốt: nhật ký hỏng không được chặn em vào thi
  }
}

/** Đọc nhật ký chặn của MỘT ca, mới nhất trước, tối đa CHANVAO_TOI_DA dòng. */
function docChanVao_(maCa) {
  try {
    const ss = bang_()
    const sh = ss.getSheetByName(SHEET_CHANVAO)
    if (!sh || sh.getLastRow() < 2) return []
    const d = sh.getDataRange().getValues()
    const out = []
    for (let i = 1; i < d.length; i++) {
      if (String(d[i][1]).trim() !== String(maCa).trim()) continue
      out.push({
        luc: String(d[i][0] || ''),
        sbd: String(d[i][2] || ''),
        hoTenGoi: String(d[i][3] || ''),
        namSinhGoi: String(d[i][4] || ''),
        hoTenDs: String(d[i][5] || ''),
        namSinhDs: String(d[i][6] || ''),
        lyDo: String(d[i][7] || ''),
      })
    }
    out.sort(function (a, b) { return msCua_(b.luc) - msCua_(a.luc) })
    return out.slice(0, CHANVAO_TOI_DA)
  } catch (err) {
    return []
  }
}

// HỎI BÀI THẦY (HOIBAITHAY.md mục 2.2). Em nộp bài xong, tick câu chưa hiểu
// rồi gửi. MÁY CHỦ CHỈ GIỮ MÃ CÂU — không giữ đề, không giữ đáp án, không giữ
// lời giải (mục 2.1): máy thầy đã có `ca_<mã>_bank.json` nên tự dựng nội dung.
//
// MỘT EM MỘT CA ĐÚNG MỘT DÒNG. Gửi lại thì ghi đè — em đổi ý bỏ bớt hay thêm
// câu là chuyện thường; đẻ dòng mới thì thầy đọc hai bản mâu thuẫn của cùng
// một em.
const SHEET_CAUHOI = 'CauHoiEm'
// Cột `Xoa` (thứ 10) là THÙNG RÁC, không xoá hẳn dòng: thầy bấm nhầm thì còn
// khôi phục được, và câu hỏi của em là dữ liệu em đã gửi đi, không nên biến mất
// khỏi máy chủ chỉ vì một cú chạm. Có mốc thời gian = đang trong thùng rác.
const CAUHOI_HEADERS = ['Ma', 'MaCa', 'SBD', 'HoTen', 'QidJson', 'GhiChu', 'GuiLuc', 'DaChua', 'ChuaLuc', 'Xoa']
const COT_XOA_CAUHOI = 10
/** Ghi chú của em: đủ một câu "em không hiểu bước quy đổi", không thành bài
 * văn. Cắt cứng ở máy chủ, không tin máy khách cắt hộ. */
const TOI_DA_GHI_CHU = 300
/** Trần số câu một em hỏi được trong một lượt. Chặn gói khổng lồ, còn việc em
 * tick nhiều thì chỉ NHẮC ở máy em chứ không chặn (mục 9). */
const TOI_DA_CAU_HOI = 200

// Lệnh GET chỉ dành cho thầy — phải kèm secret. Trước v12 các lệnh này mở cho
// bất kỳ ai có link /exec (đọc được cả danh bạ phụ huynh) — đó là lỗ hổng v12 vá.
const GET_CHI_THAY = ['listParents', 'listStudents', 'listAllFeedback', 'listMessages', 'demTinMoi']

// ---------------------------------------------------------------------------
// JSON LỚN (đề có ảnh cắt base64 ~ vài trăm KB) KHÔNG nhét vừa 1 ô Sheet
// (giới hạn 50.000 ký tự) — lưu thành file trong thư mục Drive OMR-APP-DATA,
// ô Sheet chỉ giữ "drive:<fileId>". Đọc lại tự nhận cả 2 dạng (JSON thẳng
// trong ô — dữ liệu cũ, hoặc drive:...) nên các ca đã mở trước đây vẫn chạy.
// ---------------------------------------------------------------------------
function driveFolder_() {
  const it = DriveApp.getFoldersByName(DRIVE_FOLDER)
  return it.hasNext() ? it.next() : DriveApp.createFolder(DRIVE_FOLDER)
}

function luuJsonLon_(ten, obj, refCu) {
  const noiDung = JSON.stringify(obj)
  if (refCu && String(refCu).indexOf('drive:') === 0) {
    try {
      const f = DriveApp.getFileById(String(refCu).slice(6))
      f.setContent(noiDung)
      return refCu
    } catch (err) {
      // file cũ đã bị xoá tay -> tạo mới
    }
  }
  const f = driveFolder_().createFile(ten + '.json', noiDung, MimeType.PLAIN_TEXT)
  return 'drive:' + f.getId()
}

function docJsonLon_(cell) {
  const v = String(cell || '')
  if (!v) return null
  if (v.indexOf('drive:') === 0) return JSON.parse(DriveApp.getFileById(v.slice(6)).getBlob().getDataAsString('UTF-8'))
  return JSON.parse(v)
}

/** Gắn bản đồ ĐỀ RIÊNG TỪNG EM vào một gói đề đã đọc ra.
 *
 * Bản đồ cất ở CỘT RIÊNG chứ không nhét vào gói đề: gói đề có thể nằm trên
 * Drive, sửa nó là phải đọc cả megabyte rồi ghi lại — mà bản đồ thì đổi vào
 * đúng lúc thầy bấm Bắt đầu, giữa lúc cả lớp đang chờ. */
function gopBoTheoEm_(goi, ref) {
  if (!goi || !ref) return goi
  try {
    const bo = doiGoiDeRieng_(docJsonLon_(ref)).bo
    if (bo) goi.boTheoEm = bo
  } catch (err) {}
  return goi
}

/** Ô cột 28 chở HAI bản đồ từ 08/09: `{ bo: {sbd→qid}, lap: {sbd→qid câu hỏi
 * lại} }`. Ca mở trước đó cất thẳng `{sbd→qid}` — vẫn phải đọc được, nếu không
 * mọi ca cũ chấm lại ra bộ câu của người khác.
 *
 * Nhận dạng bằng khoá `bo` là ĐỐI TƯỢNG: số báo danh toàn chữ số nên không em
 * nào tên `bo`, và giá trị của một em là MẢNG chứ không phải đối tượng. */
function doiGoiDeRieng_(v) {
  if (!v || typeof v !== 'object') return { bo: null, lap: {} }
  const co = v.bo && typeof v.bo === 'object' && Object.prototype.toString.call(v.bo) !== '[object Array]'
  if (co) return { bo: v.bo, lap: v.lap && typeof v.lap === 'object' ? v.lap : {} }
  return { bo: v, lap: {} }
}

/** CÂU HỎI LẠI CỦA ĐÚNG MỘT EM.
 *
 * Trả riêng phần của em đang thi, KHÔNG trả cả bản đồ lớp: bản đồ lớp nói ra
 * câu nào bạn cùng lớp từng làm sai. */
function cauLapCuaEm_(ref, sbd) {
  if (!ref) return []
  try {
    const ds = doiGoiDeRieng_(docJsonLon_(ref)).lap[String(sbd).trim()]
    return Object.prototype.toString.call(ds) === '[object Array]' ? ds : []
  } catch (err) {
    return []
  }
}

/** SỐ LẦN EM ĐÃ SAI TỪNG CÂU LẶP, TRƯỚC ca này.
 *
 * Thầy bắt được 08/09: "học sinh thi xong nhưng chưa thống kê là đã làm sai câu
 * trước". Báo cáo em xem ngay sau khi nộp do chính máy em dựng; không có bản đồ
 * này thì nhãn "sai lần thứ N" và mục "Đã sửa được" biến mất sạch.
 *
 * Trả riêng phần của em, KHÔNG trả cả bản đồ lớp. */
function demLapCuaEm_(ref, sbd) {
  if (!ref) return null
  try {
    const goi = docJsonLon_(ref)
    const dem = goi && goi.dem && typeof goi.dem === 'object' ? goi.dem[String(sbd).trim()] : null
    return dem && typeof dem === 'object' ? dem : null
  } catch (err) {
    return null
  }
}

/** BỘ CÂU CỦA ĐÚNG MỘT EM — thứ quyết định em nhận tờ đề nào.
 *
 * Thầy bắt được 08/09: lệnh `vaoThi` gửi kho đề mà KHÔNG kèm bản đồ, nên máy em
 * cắt 28 câu theo luật hash trong khi máy thầy chấm theo bản đồ. Hai tờ đề khác
 * nhau ⇒ điểm sai và không câu hỏi lại nào vào được đề. `session` (đường cũ) có
 * kèm bản đồ, `vaoThi` (đường đang chạy) thì không — nên lỗi im lặng suốt.
 *
 * Trả riêng phần của em, KHÔNG trả cả bản đồ lớp: bản đồ lớp nói ra bạn bên
 * cạnh được những câu nào. */
function boCuaEm_(ref, sbd) {
  if (!ref) return []
  try {
    const bo = doiGoiDeRieng_(docJsonLon_(ref)).bo
    const ds = bo ? bo[String(sbd).trim()] : null
    return Object.prototype.toString.call(ds) === '[object Array]' ? ds : []
  } catch (err) {
    return []
  }
}

/** GHI BẢN ĐỒ SAI — một dòng mỗi (ca, em), ĐÈ dòng cũ của chính em đó.
 *
 * Đè chứ không nối: em thi lại thì bản đồ phải là lượt mới nhất, nếu không ca
 * sau hỏi lại câu em đã sửa được ở lượt hai. Ghi hỏng KHÔNG được làm hỏng việc
 * ghi điểm — bản đồ dựng lại được, điểm thì không. */
function ghiBanDoSai_(ds) {
  if (!ds || ds.length === 0) return
  try {
    const sh = getSheet_(SHEET_BANDO, BANDO_HEADERS)
    const data = sh.getDataRange().getValues()
    const viTri = {}
    for (let i = 1; i < data.length; i++) viTri[String(data[i][0]) + '|' + String(data[i][1])] = i + 1
    const them = []
    for (let k = 0; k < ds.length; k++) {
      const x = ds[k]
      const dong = [x.maCa, x.sbd, x.lanThu, JSON.stringify(x.sai), JSON.stringify(x.lam), x.luc]
      const row = viTri[String(x.maCa) + '|' + String(x.sbd)]
      if (row) sh.getRange(row, 1, 1, BANDO_HEADERS.length).setValues([dong])
      else them.push(dong)
    }
    if (them.length > 0) sh.getRange(sh.getLastRow() + 1, 1, them.length, BANDO_HEADERS.length).setValues(them)
  } catch (err) {}
}

function docBanDoSai_(dsMaCa) {
  const ra = {}
  for (let i = 0; i < dsMaCa.length; i++) ra[String(dsMaCa[i])] = { sai: {}, lam: {} }
  try {
    const sh = getSheet_(SHEET_BANDO, BANDO_HEADERS)
    const data = sh.getDataRange().getValues()
    for (let i = 1; i < data.length; i++) {
      const ma = String(data[i][0])
      if (!ra[ma]) continue
      const sbd = String(data[i][1])
      let sai = []
      let lam = []
      try { sai = JSON.parse(data[i][3] || '[]') } catch (e1) { sai = [] }
      try { lam = JSON.parse(data[i][4] || '[]') } catch (e2) { lam = [] }
      ra[ma].sai[sbd] = sai
      ra[ma].lam[sbd] = lam
    }
  } catch (err) {}
  return ra
}

function maBiMat_() {
  return (PropertiesService.getScriptProperties().getProperty('MA_BI_MAT') || '').trim()
}

function kiemTraMaBiMat_(body) {
  const mat = maBiMat_()
  if (!mat) return 'Chưa đặt MA_BI_MAT trong Script properties của Apps Script (xem hướng dẫn đầu file)'
  if (String(body.secret || '').trim() !== mat) return 'Sai mã bí mật'
  return ''
}

// CHẠY 1 LẦN trong trình soạn (bước 8 đầu file): chọn hàm capQuyenVaKiemTra
// → Chạy → Google hỏi cấp quyền Sheet + Drive (bấm Cho phép). Hàm tự ghi/đọc
// thử 1 file JSON trong thư mục Drive rồi xoá — xem kết quả ở Nhật ký thực thi.
function capQuyenVaKiemTra() {
  const ss = SpreadsheetApp.openById(idBang_())
  const folder = driveFolder_()
  const ref = luuJsonLon_('_kiem_tra', { ok: true, luc: new Date().toISOString() }, '')
  const doc = docJsonLon_(ref)
  DriveApp.getFileById(ref.slice(6)).setTrashed(true)
  Logger.log('Sheet: ' + ss.getName() + ' | Thư mục Drive: ' + folder.getName() + ' | ghi/đọc JSON: ' + (doc && doc.ok ? 'OK' : 'LỖI') + ' | MA_BI_MAT: ' + (maBiMat_() ? 'đã đặt' : 'CHƯA ĐẶT'))
}

// TỐI ƯU TỐC ĐỘ (05/09, trước ca thi thật) — CACHE TRONG MỘT REQUEST.
//
// `SpreadsheetApp.openById` và `getSheetByName` đều là lệnh gọi dịch vụ, mỗi
// lệnh vài chục mili giây. Một request gọi `getSheet_` từ ba tới tám lần, nên
// mở đi mở lại cùng một bảng là phí thuần tuý.
//
// Cache chỉ sống trong một lần chạy hàm doPost/doGet — Apps Script dựng lại
// môi trường cho mỗi request, nên không có chuyện dữ liệu cũ dính sang request
// sau. Đây là điều làm nó an toàn.
let _ss = null
const _shCache = {}

function bang_() {
  if (!_ss) _ss = SpreadsheetApp.openById(idBang_())
  return _ss
}

function getSheet_(name, headers) {
  if (_shCache[name]) return _shCache[name]
  const ss = bang_()
  let sh = ss.getSheetByName(name)
  if (!sh) {
    sh = ss.insertSheet(name)
    sh.appendRow(headers)
  } else if (headers && headers.length) {
    // NỚI CỘT CHO SHEET CŨ. Sheet Google mặc định 26 cột; thêm một cột vào
    // `*_HEADERS` mà sheet đang chạy chưa đủ cột là `getRange(row, 29)` ném
    // "range out of bounds" — giữa lúc cả lớp đứng ở phòng chờ. Nới ở đây một
    // lần, im lặng, thay vì bắt thầy tự thêm cột bằng tay.
    try {
      const thieu = headers.length - sh.getMaxColumns()
      if (thieu > 0) sh.insertColumnsAfter(sh.getMaxColumns(), thieu)
      const dau = sh.getRange(1, 1, 1, headers.length).getValues()[0]
      let phaiGhi = false
      for (let i = 0; i < headers.length; i++) {
        if (String(dau[i] || '') === '') { dau[i] = headers[i]; phaiGhi = true }
      }
      if (phaiGhi) sh.getRange(1, 1, 1, headers.length).setValues([dau])
    } catch (errNoi) {}
  }
  _shCache[name] = sh
  return sh
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}

// Cột ImmediateFeedback của ca -> tên chế độ công bố điểm dùng trong app.
function congBoCua_(cell) {
  const v = String(cell || '')
  if (v === 'true') return 'ngay'
  if (v === 'calop') return 'ca_lop_xong'
  return 'khong'
}

/** Tìm dòng theo khoá — CHỈ ĐỌC ĐÚNG MỘT CỘT.
 *
 * Bản cũ gọi `getDataRange().getValues()`, tức kéo về TOÀN BỘ sheet chỉ để so
 * một cột. Trên `CaKiemTra` mỗi dòng có BankJson và KeyBankJson; trên `LuotThi`
 * mỗi dòng có DapAnJson, IntegrityJson và GiayCauJson. Tìm một mã ca mà kéo cả
 * vài megabyte về là chỗ chậm nhất của máy chủ, và nó nằm trên đường đi của mọi
 * lệnh vào thi.
 *
 * Đọc một cột cho ra ĐÚNG kết quả cũ, chỉ nhanh hơn nhiều lần. */
function findRowByKey_(sh, keyCol, keyVal) {
  const n = sh.getLastRow()
  if (n < 2) return -1
  const cot = sh.getRange(1, keyCol + 1, n, 1).getValues()
  const can = String(keyVal)
  for (let i = 1; i < cot.length; i++) {
    if (String(cot[i][0]) === can) return i + 1 // 1-based row index
  }
  return -1
}

/** Sheet tạo từ bản cũ thiếu cột mới → ghi bổ sung tiêu đề các cột còn thiếu
 * (dữ liệu cũ giữ nguyên, ô cột mới để trống = mặc định). */
// Đã kiểm tiêu đề của sheet nào trong request này — xem ghi chú dưới.
const _daKiemTieuDe = {}

/** Bổ sung cột tiêu đề còn thiếu (dùng khi nâng cấp thêm cột mới).
 *
 * CHỈ CHẠY MỘT LẦN cho mỗi sheet trong mỗi request. Bản cũ chạy lại mỗi lần gọi
 * `sheetCa_()` / `sheetLuot_()`, mà một request gọi chúng nhiều lần — mỗi lần
 * tốn hai lệnh gọi dịch vụ (`getLastColumn` + `getValues`) chỉ để xác nhận một
 * việc không đổi trong suốt request.
 *
 * Vẫn chạy đủ ở lần đầu nên cột mới vẫn được thêm như trước. */
function boSungTieuDe_(sh, headers) {
  const ten = sh.getName ? sh.getName() : String(headers[0])
  if (_daKiemTieuDe[ten]) return
  _daKiemTieuDe[ten] = true
  const hienCo = sh.getLastColumn()
  const cu = hienCo > 0 ? sh.getRange(1, 1, 1, hienCo).getValues()[0] : []
  for (let i = 0; i < headers.length; i++) {
    if (String(cu[i] || '') !== headers[i]) sh.getRange(1, i + 1).setValue(headers[i])
  }
}

function sheetCa_() {
  const sh = getSheet_(SHEET_CA, CA_HEADERS)
  boSungTieuDe_(sh, CA_HEADERS)
  return sh
}

function sheetLuot_() {
  const sh = getSheet_(SHEET_LUOT, LUOT_HEADERS)
  boSungTieuDe_(sh, LUOT_HEADERS)
  return sh
}

/** Đọc 1 dòng CaKiemTra thành object có tên — không đụng chỉ số cột rải rác. */
function docCa_(sh, row) {
  const v = sh.getRange(row, 1, 1, CA_HEADERS.length).getValues()[0]
  return {
    row: row,
    maCa: String(v[0]),
    lop: v[1],
    thoiGianPhut: Number(v[2]) || 45,
    moLuc: v[3],
    bankRef: v[4],
    congBo: congBoCua_(v[5]),
    keyBankRef: v[6],
    batDau: v[7] ? String(v[7]) : '',
    hetHanVao: v[8] ? String(v[8]) : '',
    trangThai: v[9] ? String(v[9]) : 'mo',
    tenCa: v[10] ? String(v[10]) : '',
    phamVi: v[11] ? String(v[11]) : 'tu_do',
    danhSachMoi: v[12] ? String(v[12]) : '',
    nguoiTao: v[13] ? String(v[13]) : '',
    nguongLan: Number(v[15]) > 0 ? Number(v[15]) : NGUONG_LAN_MAC_DINH,
    nguongGiay: Number(v[16]) > 0 ? Number(v[16]) : NGUONG_GIAY_MAC_DINH,
    loai: String(v[17] || '') === 'baitap' ? 'baitap' : 'thi',
    hanNop: v[18] ? String(v[18]) : '',
    khoaLuc: v[19] ? String(v[19]) : '',
    khoaBoi: v[20] ? String(v[20]) : '',
    moKhoaLuc: v[21] ? String(v[21]) : '',
    lenBang: lenBangCua_(v[22]),
    giuDeDoc: giuDeDocCua_(v[23]),
    anHanGiay: anHanGiayCua_(v[24]),
    phongCho: String(v[25] || '') === 'co',
    batDauThiLuc: v[26] ? String(v[26]) : '',
    // ĐỀ RIÊNG TỪNG EM ghi lúc thầy bấm BẮT ĐẦU, không phải lúc mở ca: lúc mở
    // ca chưa biết em nào tới. Xem NOP/DE-RIENG — bản đồ sbd → qid.
    boTheoEmRef: v[27] ? String(v[27]) : '',
    // CHẾ ĐỘ ĐỀ RIÊNG TỪNG EM — ghi lúc MỞ ca, ở MÁY CHỦ.
    //
    // Trước 08/09 cờ này chỉ nằm trong IndexedDB của đúng cái máy mở ca. Thầy
    // mở ca ở điện thoại rồi bấm Bắt đầu trên máy tính là máy tính không biết
    // ca đang ở chế độ nào: không rút bộ câu, không gửi bản đồ, và em nhận đề
    // cắt theo luật hash trong khi máy thầy chấm theo bản đồ. Không một dòng
    // nào trên màn hình báo chuyện đó (thầy bắt được ở ca 933467).
    deRieng: String(v[28] || '').indexOf('co') === 0,
    phamViHoiLai: String(v[28] || '') === 'co3' ? 'ba_ca' : 'gan_nhat',
  }
}

/** Ca ĐANG KHOÁ? Một chỗ trả lời, để ba lệnh vaoThi/luuTam/submit không mỗi
 * nơi hiểu một kiểu. `da_xoa` cũng là khoá — ca đã xoá thì không nhận gì nữa. */
function caDangKhoa_(ca) {
  return !!ca && (ca.trangThai === 'dong' || ca.trangThai === 'da_xoa')
}

/** true = ca này là BÀI TẬP VỀ NHÀ (không đồng hồ đếm ngược, nộp muộn vẫn nhận). */
function laBaiTap_(ca) {
  return ca && ca.loai === 'baitap'
}

function docLuot_(v) {
  return {
    maCa: String(v[0]),
    sbd: String(v[1]),
    lanThu: Number(v[2]) || 1,
    idThietBi: String(v[3] || ''),
    vaoLuc: v[4] ? String(v[4]) : '',
    hetGioLuc: v[5] ? String(v[5]) : '',
    nopLuc: v[6] ? String(v[6]) : '',
    trangThai: String(v[7] || ''),
    dapAnJson: v[8],
    soLanRoiMan: Number(v[9]) || 0,
    tongGiayRoiMan: Number(v[10]) || 0,
    integrityJson: v[11],
    hoTen: v[12] ? String(v[12]) : '',
    tong: v[16] === '' || v[16] === null || v[16] === undefined ? null : Number(v[16]),
    duyetBoi: v[17] ? String(v[17]) : '',
    duyetLuc: v[18] ? String(v[18]) : '',
    ghiChu: v[19] ? String(v[19]) : '',
  }
}

/** Lượt MỚI NHẤT của mỗi SBD trong 1 ca (LanThu lớn nhất) + chỉ số dòng sheet. */
/** Lượt mới nhất của từng SBD trong một ca.
 *
 * `nhe = true` BỎ QUA ba cột JSON nặng — DapAnJson (9), IntegrityJson (12),
 * GiayCauJson (22). Mỗi lượt của một em có thể vài chục kilobyte ở ba cột đó;
 * một ca 30 em qua vài tuần là vài megabyte kéo về MỖI LẦN có em bấm Vào thi.
 *
 * Đường vào thi chỉ cần trạng thái lượt, không cần bài làm — nên nó dùng bản
 * nhẹ. Hai chỗ thật sự cần bài làm (listSubmissions, chiTietCa) vẫn đọc đủ.
 *
 * Đọc theo BA DẢI CỘT rồi ghép lại đúng chỉ số cũ, để `docLuot_` không phải
 * biết gì về việc này — hai bên không được hiểu khác nhau về chỉ số cột. */
function luotMoiNhatTheoSbd_(sh, maCa, nhe) {
  const n = sh.getLastRow()
  if (n < 2) return {}
  let data
  if (nhe) {
    const A = sh.getRange(1, 1, n, 8).getValues() // MaCa..TrangThai
    const B = sh.getRange(1, 10, n, 2).getValues() // SoLanRoiMan, TongGiayRoiMan
    const C = sh.getRange(1, 13, n, 9).getValues() // HoTen..CapNhatLuc
    data = []
    for (let i = 0; i < n; i++) {
      const d = A[i].slice()
      d[8] = '' // DapAnJson — cố ý bỏ trống
      d[9] = B[i][0]
      d[10] = B[i][1]
      d[11] = '' // IntegrityJson — cố ý bỏ trống
      for (let k = 0; k < 9; k++) d[12 + k] = C[i][k]
      d[21] = '' // GiayCauJson — cố ý bỏ trống
      data.push(d)
    }
  } else {
    data = sh.getDataRange().getValues()
  }
  const map = {}
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) !== String(maCa)) continue
    const l = docLuot_(data[i])
    l.row = i + 1
    l.giayCauJson = data[i][21]
    if (!map[l.sbd] || map[l.sbd].lanThu < l.lanThu) map[l.sbd] = l
  }
  return map
}

function msCua_(iso) {
  const t = new Date(iso).getTime()
  return isFinite(t) ? t : NaN
}

/** QUYẾT ĐỊNH CHO VÀO THI (thuần logic, không IO — có test ở tests/apps-script-vao-thi.test.ts).
 * ca: {trangThai, batDau, hetHanVao, thoiGianPhut} · luot: lượt mới nhất của
 * SBD hoặc null · idThietBi: id máy đang xin vào · nowMs: giờ MÁY CHỦ.
 * Trả về {ok:false, lyDo, ...} hoặc {ok:true, cach:'moi'|'khoi_phuc'|'duyet_lai'}.
 * Bảng xử lý theo QUANLYCATHI.md mục 1 + mục 3:
 *   chưa có lượt            → tạo lượt 1 (nếu ca đang mở & chưa quá hạn vào)
 *   dang_lam cùng máy       → cho vào tiếp (khôi phục), KHÔNG xét hạn vào phòng
 *   dang_lam khác máy       → chặn (kể cả khi lượt cũ đã hết giờ — tránh mượn máy thi lại từ đầu)
 *   da_nop / khoa           → chặn, cần thầy duyệt
 *   duoc_duyet_lai          → cho vào, lượt này thành dang_lam (xét hạn vào phòng như lượt mới) */
function quyetDinhVaoThi_(ca, luot, idThietBi, nowMs, hocSinh) {
  if (ca.trangThai === 'da_xoa') return { ok: false, lyDo: 'da_xoa' }
  if (ca.trangThai === 'dong') return { ok: false, lyDo: 'da_dong' }
  if (luot && luot.trangThai === 'dang_lam') {
    if (luot.idThietBi && idThietBi && luot.idThietBi === idThietBi) return { ok: true, cach: 'khoi_phuc' }
    return { ok: false, lyDo: 'dang_lam_may_khac' }
  }
  if (luot && (luot.trangThai === 'da_nop' || luot.trangThai === 'khoa')) return { ok: false, lyDo: 'da_nop', nopLuc: luot.nopLuc, lanThu: luot.lanThu }
  // CHO THI LẠI KHOÁ THEO MÁY (thầy chốt 08/09): lượt `duoc_duyet_lai` có ghi
  // sẵn id thiết bị nghĩa là thầy đã chốt em thi lại ở ĐÚNG máy cũ. Máy khác
  // gõ đúng số báo danh cũng không vào được.
  //
  // Chỉ khoá khi dòng CÓ id: `duyetThiLai` (đường cũ) để trống ô này, và ở đó
  // em vào máy nào cũng được — không đổi hành vi cũ.
  if (luot && luot.trangThai === 'duoc_duyet_lai' && luot.idThietBi && idThietBi && luot.idThietBi !== idThietBi) {
    return { ok: false, lyDo: 'sai_may' }
  }
  // lượt mới (chưa có, hoặc thầy đã duyệt thi lại) → xét cửa sổ vào phòng
  const batDau = ca.batDau ? msCua_(ca.batDau) : NaN
  if (isFinite(batDau) && nowMs < batDau) return { ok: false, lyDo: 'chua_mo', batDau: ca.batDau }
  // BÀI TẬP VỀ NHÀ: không có "hạn vào phòng" — em mở lúc nào cũng được, quá hạn
  // nộp vẫn vào làm được và chỉ bị đánh dấu nộp muộn (BA-APP.md mục 6).
  if (!laBaiTap_(ca)) {
    const hetHan = ca.hetHanVao ? msCua_(ca.hetHanVao) : NaN
    if (isFinite(hetHan) && nowMs > hetHan) return { ok: false, lyDo: 'het_han_vao', hetHanVao: ca.hetHanVao }
  }
  // PHẠM VI GỬI CA (QUANLYCATHI mục 4) — máy chủ kiểm tra, không chỉ ẩn giao diện.
  // tu_do: AI CÓ MÃ CA ĐỀU VÀO ĐƯỢC.
  // khoi:  DanhSachMoi = năm sinh; em phải có hồ sơ đúng năm sinh.
  // chon:  DanhSachMoi = JSON mảng SBD thầy đã tích.
  // sbd:   không tích ai; chỉ cần SBD có mặt trong DanhSachLop.
  const pv = ca.phamVi || 'tu_do'

  // CỔNG DANH SÁCH HỌC SINH — phải khớp đủ ba: số báo danh, họ tên, năm sinh.
  //
  // SỬA 05/09 (thầy báo): cổng này KHÔNG áp dụng cho ca TỰ DO. Bản cũ chặn
  // trước mọi phạm vi, nên chọn "Tự do" mà em không có trong danh sách vẫn bị
  // chặn — trái hẳn cái tên và trái dòng mô tả "ai có mã ca đều vào được".
  //
  // Tự do là để luyện tập, ôn ngoài giờ, em lớp khác học ké: ở đó danh sách lớp
  // không có nghĩa lý gì. Ba phạm vi kia vẫn giữ nguyên cổng.
  //
  // KHÔNG nói rõ trường nào sai: nói ra là cho phép dò tên từ số báo danh.
  if (pv !== 'tu_do' && hocSinh && hocSinh.trongDanhSach === false) return { ok: false, lyDo: 'sai_ho_so' }

  if (pv === 'sbd') {
    // Chế độ SỐ BÁO DANH: mã ca đúng CHƯA đủ, số báo danh phải nằm trong danh
    // sách lớp thầy đã nạp. SBD lạ bị chặn ngay, dù có mã ca.
    //
    // `trongDanhSach === null` nghĩa là thầy chưa nạp danh sách bao giờ; ở các
    // chế độ khác thì mở cổng cho khỏi đứng hình, nhưng ở CHÍNH chế độ này thì
    // không: cả mục đích của nó là cổng danh sách, mở ra là mất hết ý nghĩa.
    if (!hocSinh || hocSinh.trongDanhSach !== true) return { ok: false, lyDo: 'khong_trong_danh_sach' }
  }
  if (pv === 'khoi') {
    const namSinh = String(ca.danhSachMoi || '').trim().replace(/^"+|"+$/g, '').trim()
    const cuaEm = hocSinh && hocSinh.namSinh !== undefined && hocSinh.namSinh !== null ? String(hocSinh.namSinh).trim() : ''
    if (!cuaEm) return { ok: false, lyDo: 'chua_co_ho_so', namSinh: namSinh }
    if (cuaEm !== namSinh) return { ok: false, lyDo: 'khong_thuoc_khoi', namSinh: namSinh }
  } else if (pv === 'chon') {
    let ds = []
    try { ds = JSON.parse(ca.danhSachMoi || '[]') } catch (err) { ds = [] }
    const sbd = hocSinh && hocSinh.sbd !== undefined ? String(hocSinh.sbd).trim() : ''
    if (!ds.some(function (x) { return String(x).trim() === sbd })) return { ok: false, lyDo: 'khong_trong_danh_sach' }
  }
  return { ok: true, cach: luot && luot.trangThai === 'duoc_duyet_lai' ? 'duyet_lai' : 'moi' }
}

// ---------------------------------------------------------------------------
// TOKEN + DUYỆT HỒ SƠ (BA-APP.md đợt 1)
// ---------------------------------------------------------------------------

/** Chuẩn hoá họ tên để so khớp: bỏ dấu, thường hoá, gộp khoảng trắng.
 *
 * Vì sao bỏ dấu: em gõ tên mình trên điện thoại, sai một dấu là trượt — mà mục
 * đích của bước này là chặn gõ nhầm số báo danh và chặn em lạ, không phải làm
 * mật khẩu. Người khác vẫn phải biết đủ CẢ BA: số báo danh, tên, năm sinh. */
function chuanTen_(v) {
  return String(v == null ? '' : v)
    // KÝ TỰ TÀNG HÌNH. Tên dán từ Zalo, Word, Google Sheet hoặc gõ bằng vài bàn
    // phím điện thoại có kèm zero-width space / soft hyphen. `\s` KHÔNG bắt
    // được chúng, nên bản cũ so hai chuỗi NHÌN Y HỆT nhau mà vẫn báo lệch.
    .replace(/[\u200b-\u200d\u2060\ufeff\u00ad]/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // đ Đ (U+0111 / U+0110) VÀ ð Ð (U+00F0 / U+00D0 — chữ "eth"). Hai cặp này
    // hiện lên màn hình GIỐNG HỆT nhau; vài bàn phím và vài bản chuyển mã cho
    // ra eth. Bản cũ chỉ đổi cặp đầu, nên "Đồng" gõ trúng eth là trượt cổng mà
    // thầy soi vào danh sách không thấy sai chỗ nào.
    .replace(/[\u0111\u0110\u00f0\u00d0]/g, 'd')
    .toLowerCase()
    // Dấu câu thừa: em gõ "Nguyễn Thành Đồng." hoặc "Nguyen-Thanh-Dong".
    .replace(/[.,;:'’‘"“”`´\-_/\\|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Hai tên có phải MỘT người không.
 *
 * Bậc 1: khớp y nguyên sau khi chuẩn hoá.
 * Bậc 2: khớp khi bỏ hết khoảng trắng — em gõ dính "NguyễnThànhĐồng", hoặc
 *        ô trong danh sách lỡ mang khoảng trắng lạ. Vẫn phải đủ từng chữ cái
 *        theo đúng thứ tự nên không mở cổng cho em lạ.
 *
 * KHÔNG có bậc 3 kiểu "gần giống": cổng này để chặn gõ nhầm số báo danh và
 * chặn em lạ, hạ xuống so gần đúng là mất luôn tác dụng. */
/** CỔNG HỒ SƠ: em gõ có khớp dòng trong danh sách lớp không.
 *
 * HÀM THUẦN, không đọc Sheet, không ghi gì — tách ra khỏi thân `vaoThi` để phép
 * kiểm chạy được CHÍNH đoạn mã này chứ không chạy một bản chép tay của nó.
 *
 * Trả `{ tenKhop, namKhop, khongGuiGi }`.
 *
 * BA VẾ MỞ CỔNG, mỗi vế một lý do khác nhau:
 *   1. `xacNhanTen === true` — em đã NHÌN THẤY tên của số báo danh mình gõ trên
 *      màn xác nhận rồi mới bấm Bắt đầu (luồng từ 07/09). Không còn gì để so.
 *   2. Ô trong DANH SÁCH trống — thầy chưa điền thì không lấy đó làm cớ chặn.
 *   3. Ô EM GỬI trống — máy em không gửi thì KHÔNG CÓ GÌ ĐỂ SO.
 *
 * Vế 3 là chỗ hỏng ngày 08/09: thiếu nó, máy chủ đem chuỗi rỗng đi so với tên
 * trong danh sách rồi kết luận "lệch họ tên", chặn 17/36 em của ca 447479 —
 * 37/40 dòng trong sổ ChanVao có họ tên rỗng, 40/40 có năm sinh rỗng.
 *
 * Cổng chặn gõ nhầm số báo danh KHÔNG yếu đi: số báo danh vẫn phải nằm trong
 * danh sách, và client bắt em nhìn tên rồi mới cho bấm Bắt đầu. */
function khopHoSoDanhSach_(body, dong) {
  var daXacNhan = body && body.xacNhanTen === true
  var tenGoi = chuanTen_(body ? body.hoTen : '')
  var namGoi = chuanNamSinh_(body ? body.namSinh : '')
  var tenDs = chuanTen_(dong ? dong.hoTen : '')
  var namDs = dong && dong.namSinh ? String(dong.namSinh) : ''
  return {
    tenKhop: daXacNhan || !tenDs || !tenGoi || tenKhopNhau_(body.hoTen, dong.hoTen),
    namKhop: daXacNhan || !namDs || !namGoi || namGoi === namDs,
    // Máy em không gửi gì để so. Em vẫn vào được, nhưng thầy phải thấy: đó là
    // dấu hiệu máy ấy còn giữ bản cũ.
    khongGuiGi: !daXacNhan && !tenGoi && !namGoi,
  }
}

function tenKhopNhau_(a, b) {
  var x = chuanTen_(a)
  var y = chuanTen_(b)
  if (x === y) return true
  return x.replace(/\s/g, '') === y.replace(/\s/g, '')
}

/** Năm sinh về đúng 4 chữ số — ô Sheet có thể là số, là ngày, hay là chuỗi. */
function chuanNamSinh_(v) {
  if (v instanceof Date) return String(v.getFullYear())
  const m = String(v == null ? '' : v).match(/(19|20)\d{2}/)
  return m ? m[0] : ''
}

/** Tra một em trong bản sao danh sách lớp. Trả null nếu chưa đẩy hoặc không có. */
function timTrongDanhSachLop_(sbd) {
  try {
    const ss = SpreadsheetApp.openById(idBang_())
    const sh = ss.getSheetByName(SHEET_DSLOP)
    if (!sh) return null
    const data = sh.getDataRange().getValues()
    const khoa = String(sbd).trim()
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === khoa) {
        return { sbd: khoa, hoTen: String(data[i][1] || ''), namSinh: chuanNamSinh_(data[i][2]), lop: String(data[i][3] || '') }
      }
    }
    return null
  } catch (err) {
    return null
  }
}

/** DỌN SẠCH MỌI DẤU VẾT CỦA SỐ BÁO DANH KHÔNG CÒN TRONG DANH SÁCH.
 *
 * Chạy TAY trong trình soạn Apps Script (chọn hàm này → Chạy), không phải lệnh
 * web — nó xoá vĩnh viễn, không ai gọi được từ ngoài.
 *
 * Vì sao cần: danh sách học sinh nay do file của thầy quyết định. Số báo danh
 * của các ca thử cũ vẫn nằm rải trong LuotThi, ChiTietCau, TienDoCa, TienDoHS,
 * QidDaLam, HocSinh, NhanXet, YeuCauGiaoBai — màn Học sinh vẫn phải hiện chúng
 * kèm cờ đỏ (không giấu dữ liệu), nên muốn hết hẳn thì phải xoá thật.
 *
 * CHẶN AN TOÀN: danh sách trống thì DỪNG. Không có chặn này, chạy nhầm lúc
 * chưa nạp file là xoá sạch dữ liệu cả trung tâm.
 *
 * Kết quả in ra Nhật ký thực thi: xoá bao nhiêu dòng ở sheet nào, của SBD nào.
 */
function donEmNgoaiDanhSach() {
  const dsLop = docDanhSachLop_()
  if (!dsLop.length) {
    Logger.log('DỪNG: sheet DanhSachLop trống — chưa nạp file danh sách thì không biết ai là "ngoài danh sách".')
    return
  }
  const trongDs = {}
  for (let i = 0; i < dsLop.length; i++) trongDs[String(dsLop[i].sbd).trim()] = true

  // sheet → chỉ số cột chứa SBD
  const BANG = [
    [SHEET_LUOT, 1],
    [SHEET_CHITIET, 1],
    [SHEET_TIENDO_CA, 0],
    [SHEET_TIENDO_HS, 0],
    [SHEET_QID, 0],
    [SHEET_HOCSINH, 0],
    [SHEET_NHANXET, 0],
    [SHEET_YEUCAU, 1],
  ]
  const ss = SpreadsheetApp.openById(idBang_())
  const daXoa = {}
  let tongDong = 0

  for (let b = 0; b < BANG.length; b++) {
    const ten = BANG[b][0]
    const cot = BANG[b][1]
    const sh = ss.getSheetByName(ten)
    if (!sh || sh.getLastRow() < 2) continue
    const data = sh.getDataRange().getValues()
    // Xoá từ DƯỚI LÊN: xoá từ trên xuống thì chỉ số dòng phía dưới tụt hết.
    let n = 0
    for (let i = data.length - 1; i >= 1; i--) {
      const sbd = String(data[i][cot] || '').trim()
      if (!sbd || trongDs[sbd]) continue
      sh.deleteRow(i + 1)
      daXoa[sbd] = (daXoa[sbd] || 0) + 1
      n++
    }
    if (n) Logger.log(ten + ': xoá ' + n + ' dòng')
    tongDong += n
  }

  const dsSbd = Object.keys(daXoa)
  Logger.log('XONG. Xoá ' + tongDong + ' dòng của ' + dsSbd.length + ' số báo danh: ' + dsSbd.join(', '))
  Logger.log('Danh sách chính thức giữ nguyên ' + dsLop.length + ' em.')
}

// ---------------------------------------------------------------------------
// ĐỒNG BỘ DANH SÁCH LỚP TỪ GOOGLE SHEET CỦA THẦY (thầy chốt 07/09)
//
// Thầy dán link một lần cho mỗi khối, sau đó chỉ bấm Đồng bộ. Link nằm ở Script
// property nên đổi máy, đổi trình duyệt vẫn còn — thầy mở app trên điện thoại
// giữa buổi dạy cũng đồng bộ được.

/** Khoá Script property giữ danh sách link (chuỗi JSON một mảng). */
var KHOA_LINK_DSLOP = 'LINK_DANH_SACH_LOP'

function docLinkDsLop_() {
  try {
    var v = PropertiesService.getScriptProperties().getProperty(KHOA_LINK_DSLOP)
    if (!v) return []
    var a = JSON.parse(v)
    if (Object.prototype.toString.call(a) !== '[object Array]') return []
    var out = []
    for (var i = 0; i < a.length; i++) {
      var s = String(a[i] || '').trim()
      if (s) out.push(s)
    }
    return out
  } catch (err) {
    return []
  }
}

function luuLinkDsLop_(arr) {
  PropertiesService.getScriptProperties().setProperty(KHOA_LINK_DSLOP, JSON.stringify(arr || []))
}

/** Lớp suy từ năm sinh (vào lớp 1 lúc 6 tuổi; năm học mới tính từ tháng 9).
 * Sheet khối của thầy chỉ có SBD, họ tên, năm sinh — cột Lớp tự tính. */
function lopTuNamSinh_(namSinh) {
  var ns = Number(namSinh)
  if (!(ns >= 1990 && ns <= 2100)) return ''
  var d = new Date()
  var namHoc = d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1
  var lop = namHoc - ns - 5
  return lop >= 1 && lop <= 12 ? String(lop) : ''
}

/** Nhận diện cột theo TÊN TIÊU ĐỀ, không theo vị trí: ba sheet khối của thầy
 * đặt tiêu đề khác nhau ("HoTen" và "Họ tên"). Không tiêu đề nào khớp thì mới
 * lùi về vị trí 0-1-2-3. */
function cotDsLop_(tieuDe) {
  var vt = { sbd: -1, hoTen: -1, namSinh: -1, lop: -1 }
  for (var i = 0; i < tieuDe.length; i++) {
    var t = chuanTen_(tieuDe[i]).replace(/\s/g, '')
    if (vt.sbd < 0 && (t === 'sbd' || t === 'sobaodanh' || t === 'so')) vt.sbd = i
    else if (vt.hoTen < 0 && (t === 'hoten' || t === 'ten' || t === 'hovaten')) vt.hoTen = i
    else if (vt.namSinh < 0 && (t === 'namsinh' || t === 'nam' || t === 'ngaysinh')) vt.namSinh = i
    else if (vt.lop < 0 && (t === 'lop' || t === 'khoi')) vt.lop = i
  }
  if (vt.sbd < 0) vt.sbd = 0
  if (vt.hoTen < 0) vt.hoTen = 1
  if (vt.namSinh < 0) vt.namSinh = 2
  return vt
}

/** Khoá Script property giữ bản đồ năm sinh → id sheet khối. */
var KHOA_SHEET_KHOI = 'SHEET_KHOI_JSON'

/** Mở SHEET GỐC của một khối theo năm sinh.
 *
 * Nhớ id vào Script property sau lần tìm đầu, nên chỉ quét Drive một lần cho
 * mỗi khối. Không tìm ra, hoặc tìm ra HAI tệp cùng tên, thì DỪNG và nói rõ —
 * đoán bừa một sheet là ghi tên em vào khối khác. */
function moSheetKhoi_(namSinh) {
  var nam = String(namSinh || '').trim()
  if (!/^\d{4}$/.test(nam)) return { ok: false, error: 'Năm sinh không hợp lệ' }
  var props = PropertiesService.getScriptProperties()
  var ban = {}
  try { ban = JSON.parse(props.getProperty(KHOA_SHEET_KHOI) || '{}') } catch (err) { ban = {} }
  if (ban[nam]) {
    try { return { ok: true, ss: SpreadsheetApp.openById(ban[nam]) } } catch (err) { delete ban[nam] }
  }
  var it = DriveApp.getFilesByName(nam)
  var thay = []
  while (it.hasNext()) {
    var f = it.next()
    if (f.getMimeType() === MimeType.GOOGLE_SHEETS) thay.push(f.getId())
  }
  if (thay.length === 0) return { ok: false, error: 'Không thấy Google Sheet nào tên "' + nam + '" trong Drive của thầy' }
  if (thay.length > 1) return { ok: false, error: 'Có ' + thay.length + ' Google Sheet cùng tên "' + nam + '" — đổi tên cho khác nhau rồi thêm lại' }
  ban[nam] = thay[0]
  props.setProperty(KHOA_SHEET_KHOI, JSON.stringify(ban))
  return { ok: true, ss: SpreadsheetApp.openById(thay[0]) }
}

/** Đọc TOÀN BỘ bản sao danh sách học sinh (một lần đọc sheet). */
function docDanhSachLop_() {
  try {
    const ss = SpreadsheetApp.openById(idBang_())
    const sh = ss.getSheetByName(SHEET_DSLOP)
    if (!sh || sh.getLastRow() < 2) return []
    const data = sh.getDataRange().getValues()
    const out = []
    for (let i = 1; i < data.length; i++) {
      const sbd = String(data[i][0]).trim()
      if (!sbd) continue
      out.push({ sbd: sbd, hoTen: String(data[i][1] || ''), namSinh: chuanNamSinh_(data[i][2]), lop: String(data[i][3] || '') })
    }
    return out
  } catch (err) {
    return []
  }
}

/** Sheet DanhSachLop đã có dòng nào chưa. Chưa nạp bao giờ ⇒ KHÔNG chặn ai:
 * bật tính năng này lên mà chặn sạch cả trung tâm thì hỏng buổi dạy. */
function coDanhSachHocSinh_() {
  try {
    const ss = SpreadsheetApp.openById(idBang_())
    const sh = ss.getSheetByName(SHEET_DSLOP)
    return !!sh && sh.getLastRow() > 1
  } catch (err) {
    return false
  }
}

/** EM CÓ TRONG DANH SÁCH THÌ CÓ HỒ SƠ.
 *
 * Không còn màn đăng ký (app học sinh tách sang repo riêng). Em vào thi mà chưa
 * có dòng trong sheet HocSinh thì thêm tại đây, họ tên/năm sinh/lớp lấy từ danh
 * sách thầy đã nạp. CHỈ gọi khi số báo danh đã qua cổng danh sách — hàm này
 * không tự quyết ai được thi.
 *
 * Trả về đúng khuôn hoSoHocSinh_ để chỗ gọi dùng thẳng. */
function themEmVaoDanhSach_(sbd, ca, tu) {
  try {
    const sh = sheetHS_()
    if (findRowByKey_(sh, 0, sbd) >= 0) return hoSoHocSinh_(sbd)
    const row = []
    for (let i = 0; i < HS_HEADERS.length; i++) row.push('')
    row[0] = String(sbd)
    row[1] = tu ? tu.hoTen : ''
    row[2] = tu ? tu.namSinh : ''
    row[3] = tu && tu.lop ? tu.lop : (ca && ca.lop ? String(ca.lop) : '')
    row[4] = new Date().toISOString()
    row[HS_COT_TRANGTHAI] = 'tu_vao_thi'
    sh.appendRow(row)
    return { sbd: String(sbd), hoTen: row[1], namSinh: row[2], lop: row[3] }
  } catch (err) {
    return null
  }
}

function sheetHS_() {
  const sh = getSheet_(SHEET_HOCSINH, HS_HEADERS)
  boSungTieuDe_(sh, HS_HEADERS)
  return sh
}

/** SỐ ĐIỆN THOẠI làm khoá tra cứu: Google Sheets tự đổi "0912..." thành SỐ
 * 912... (mất số 0 đầu), nên mọi so sánh phải chuẩn hoá — nếu không thì phụ
 * huynh nào cũng tra không ra (số điện thoại Việt Nam đều bắt đầu bằng 0). */
function chuanSdt_(v) {
  const chuoi = String(v === null || v === undefined ? '' : v).trim().replace(/[^0-9]/g, '')
  return chuoi.replace(/^0+/, '')
}

/** Tìm dòng phụ huynh theo SĐT, chịu được cả ô lưu dạng số lẫn dạng chuỗi. */
function timDongPH_(sh, sdt) {
  const can = chuanSdt_(sdt)
  if (!can) return -1
  const data = sh.getDataRange().getValues()
  for (let i = 1; i < data.length; i++) {
    if (chuanSdt_(data[i][0]) === can) return i + 1
  }
  return -1
}

function sheetPH_() {
  const sh = getSheet_(SHEET_PHUHUYNH, PH_HEADERS)
  boSungTieuDe_(sh, PH_HEADERS)
  return sh
}

/** Token 32 ký tự chữ+số, không đoán được, không mang thông tin cá nhân. */
function sinhToken_() {
  return (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '').substring(0, 32)
}

function chuanToken_(t) {
  return String(t || '').trim()
}

/** Tìm dòng theo token. Trả -1 nếu token rỗng/sai độ dài/không có. */
function timTheoToken_(sh, cotToken, token) {
  const t = chuanToken_(token)
  if (t.length !== 32) return -1
  const data = sh.getDataRange().getValues()
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][cotToken]) === t) return i + 1
  }
  return -1
}

/** Hồ sơ HỌC SINH từ token — null nếu token sai. Đây là cửa duy nhất để máy
 * em nói "tôi là SBD nào"; SBD do máy khách gửi không bao giờ được tin. */
function hsTuToken_(token) {
  const sh = sheetHS_()
  const row = timTheoToken_(sh, HS_COT_TOKEN, token)
  if (row < 0) return null
  const v = sh.getRange(row, 1, 1, HS_HEADERS.length).getValues()[0]
  return { row: row, sbd: String(v[0]), hoTen: String(v[1] || ''), namSinh: String(v[2] || ''), lop: String(v[3] || ''), trangThai: String(v[HS_COT_TRANGTHAI] || '') }
}

/** Hồ sơ PHỤ HUYNH từ token — null nếu token sai. */
function phTuToken_(token) {
  const sh = sheetPH_()
  const row = timTheoToken_(sh, PH_COT_TOKEN, token)
  if (row < 0) return null
  const v = sh.getRange(row, 1, 1, PH_HEADERS.length).getValues()[0]
  return { row: row, sdt: String(v[0]), hoTenPhuHuynh: String(v[1] || ''), sbd: String(v[2]), lop: String(v[3] || ''), hoTenHocSinh: String(v[4] || ''), trangThai: String(v[PH_COT_TRANGTHAI] || '') }
}

/** Hồ sơ ĐÃ có token thì bắt buộc dùng link riêng — đường cũ (gõ SBD/SĐT) chỉ
 * còn cho hồ sơ đăng ký trước v12, để không cắt ngang người đang dùng. */
function conDungDuocDuongCu_(sh, row, cotToken) {
  if (row < 0) return false
  return chuanToken_(sh.getRange(row, cotToken + 1).getValue()).length !== 32
}

/** Học sinh: token (ưu tiên) hoặc SBD kiểu cũ. Trả { sbd } hoặc null. */
function sbdTuYeuCau_(token, sbdCu) {
  const t = chuanToken_(token)
  if (t) {
    const hs = hsTuToken_(t)
    return hs ? { sbd: hs.sbd, hs: hs } : null
  }
  const sbd = String(sbdCu || '').trim()
  if (!sbd) return null
  const sh = sheetHS_()
  const row = findRowByKey_(sh, 0, sbd)
  // Chưa đăng ký hồ sơ bao giờ (row < 0) vẫn cho qua: em mới vào thi lần đầu.
  if (row > 0 && !conDungDuocDuongCu_(sh, row, HS_COT_TOKEN)) return null
  return { sbd: sbd, hs: null }
}

/** Phụ huynh: token (ưu tiên) hoặc SĐT kiểu cũ. Trả { row, sbd, ... } hoặc null. */
function phTuYeuCau_(token, sdtCu) {
  const t = chuanToken_(token)
  if (t) return phTuToken_(t)
  const sdt = String(sdtCu || '').trim()
  if (!sdt) return null
  const sh = sheetPH_()
  const row = timDongPH_(sh, sdt)
  if (row < 0) return null
  if (!conDungDuocDuongCu_(sh, row, PH_COT_TOKEN)) return null
  const v = sh.getRange(row, 1, 1, PH_HEADERS.length).getValues()[0]
  return { row: row, sdt: String(v[0]), hoTenPhuHuynh: String(v[1] || ''), sbd: String(v[2]), lop: String(v[3] || ''), hoTenHocSinh: String(v[4] || ''), trangThai: String(v[PH_COT_TRANGTHAI] || '') }
}

// ---------------------------------------------------------------------------
// TIẾN ĐỘ THEO CHUYÊN ĐỀ (BA-APP.md đợt 2)
// ---------------------------------------------------------------------------

function sheetTienDoCa_() {
  const sh = getSheet_(SHEET_TIENDO_CA, TIENDO_CA_HEADERS)
  boSungTieuDe_(sh, TIENDO_CA_HEADERS)
  return sh
}

function sheetTienDoHS_() {
  const sh = getSheet_(SHEET_TIENDO_HS, TIENDO_HS_HEADERS)
  boSungTieuDe_(sh, TIENDO_HS_HEADERS)
  return sh
}

function sheetQid_() {
  const sh = getSheet_(SHEET_QID, QID_HEADERS)
  boSungTieuDe_(sh, QID_HEADERS)
  return sh
}

/** Gom mảng câu của MỘT lượt thành { chuyenDe: {soCau, soSai} }. Câu chưa phân
 * loại chuyên đề gom vào "(chưa phân loại)" — không đoán, không bỏ im lặng. */
function gomTheoChuyenDe_(cau) {
  const out = {}
  for (let i = 0; i < cau.length; i++) {
    const q = cau[i]
    const cd = String(q.chuyenDe || '').trim() || '(chưa phân loại)'
    if (!out[cd]) out[cd] = { soCau: 0, soSai: 0 }
    out[cd].soCau++
    // dungSai === false nghĩa là SAI; null/undefined = chưa chấm được -> không tính sai.
    if (q.dungSai === false) out[cd].soSai++
  }
  return out
}

/** Ghi tổng hợp cho các em vừa chấm trong 1 ca. tomTat = { sbd: { nopLuc,
 * theoCd: {cd:{soCau,soSai}}, qids: [] } }. Ghi ĐÈ theo khoá, không cộng dồn,
 * nên chấm lại lần 2 vẫn ra đúng số. Không xoá dòng nào (chuyên đề biến mất
 * khỏi lần chấm mới thì về 0) — tránh lệch chỉ số khi xoá hàng loạt. */
function ghiTienDo_(maCa, tomTat) {
  const dsSbd = Object.keys(tomTat)
  if (dsSbd.length === 0) return
  const luc = new Date().toISOString()

  // --- TienDoCa: khoá (SBD, MaCa, ChuyenDe)
  const caSh = sheetTienDoCa_()
  const caData = caSh.getDataRange().getValues()
  const viTri = {}
  for (let i = 1; i < caData.length; i++) {
    viTri[String(caData[i][0]) + '' + String(caData[i][1]) + '' + String(caData[i][2])] = i
  }
  const themCa = []
  for (let s = 0; s < dsSbd.length; s++) {
    const sbd = dsSbd[s]
    const t = tomTat[sbd]
    // Chuyên đề đã có dòng cho cặp (sbd, maCa) nhưng lần chấm mới không còn -> về 0.
    for (let i = 1; i < caData.length; i++) {
      if (String(caData[i][0]) === sbd && String(caData[i][1]) === maCa && !t.theoCd[String(caData[i][2])]) {
        caData[i][3] = 0
        caData[i][4] = 0
        caData[i][6] = luc
      }
    }
    const dsCd = Object.keys(t.theoCd)
    for (let c = 0; c < dsCd.length; c++) {
      const cd = dsCd[c]
      const v = t.theoCd[cd]
      const k = sbd + '' + maCa + '' + cd
      if (viTri[k] !== undefined) {
        const i = viTri[k]
        caData[i][3] = v.soCau
        caData[i][4] = v.soSai
        caData[i][5] = t.nopLuc || caData[i][5]
        caData[i][6] = luc
      } else {
        themCa.push([sbd, maCa, cd, v.soCau, v.soSai, t.nopLuc || '', luc])
      }
    }
  }
  if (caData.length > 1) caSh.getRange(2, 1, caData.length - 1, TIENDO_CA_HEADERS.length).setValues(caData.slice(1))
  if (themCa.length > 0) caSh.getRange(caSh.getLastRow() + 1, 1, themCa.length, TIENDO_CA_HEADERS.length).setValues(themCa)

  // --- TienDoHS: cộng lại TỪ ĐẦU cho các em vừa chấm (nguồn = TienDoCa mới)
  const tatCaCa = caData.slice(1).concat(themCa)
  const cong = {}
  for (let i = 0; i < tatCaCa.length; i++) {
    const sbd = String(tatCaCa[i][0])
    if (dsSbd.indexOf(sbd) < 0) continue
    const cd = String(tatCaCa[i][2])
    const k = sbd + '' + cd
    if (!cong[k]) cong[k] = { sbd: sbd, cd: cd, soCau: 0, soSai: 0 }
    cong[k].soCau += Number(tatCaCa[i][3]) || 0
    cong[k].soSai += Number(tatCaCa[i][4]) || 0
  }
  const hsSh = sheetTienDoHS_()
  const hsData = hsSh.getDataRange().getValues()
  const viTriHs = {}
  for (let i = 1; i < hsData.length; i++) viTriHs[String(hsData[i][0]) + '' + String(hsData[i][1])] = i
  const themHs = []
  const dsK = Object.keys(cong)
  for (let i = 0; i < dsK.length; i++) {
    const v = cong[dsK[i]]
    if (viTriHs[dsK[i]] !== undefined) {
      const r = viTriHs[dsK[i]]
      hsData[r][2] = v.soCau
      hsData[r][3] = v.soSai
      hsData[r][4] = luc
    } else {
      themHs.push([v.sbd, v.cd, v.soCau, v.soSai, luc])
    }
  }
  if (hsData.length > 1) hsSh.getRange(2, 1, hsData.length - 1, TIENDO_HS_HEADERS.length).setValues(hsData.slice(1))
  if (themHs.length > 0) hsSh.getRange(hsSh.getLastRow() + 1, 1, themHs.length, TIENDO_HS_HEADERS.length).setValues(themHs)

  // --- QidDaLam: hợp tập câu đã làm
  const qSh = sheetQid_()
  const qData = qSh.getDataRange().getValues()
  const themQ = []
  for (let s = 0; s < dsSbd.length; s++) {
    const sbd = dsSbd[s]
    const moi = tomTat[sbd].qids || []
    if (moi.length === 0) continue
    let r = -1
    for (let i = 1; i < qData.length; i++) if (String(qData[i][0]) === sbd) { r = i; break }
    const cu = r >= 0 ? String(qData[r][1] || '').split(',').filter(function (x) { return x }) : []
    const tap = {}
    for (let i = 0; i < cu.length; i++) tap[cu[i]] = 1
    for (let i = 0; i < moi.length; i++) if (moi[i]) tap[String(moi[i])] = 1
    const ds = Object.keys(tap)
    if (r >= 0) {
      qData[r][1] = ds.join(',')
      qData[r][2] = ds.length
      qData[r][3] = luc
    } else {
      themQ.push([sbd, ds.join(','), ds.length, luc])
    }
  }
  if (qData.length > 1) qSh.getRange(2, 1, qData.length - 1, QID_HEADERS.length).setValues(qData.slice(1))
  if (themQ.length > 0) qSh.getRange(qSh.getLastRow() + 1, 1, themQ.length, QID_HEADERS.length).setValues(themQ)
}

/** Xu hướng chuyên đề: so tỉ lệ sai của SO_CA_GAN_DAY ca gần nhất với các ca
 * trước đó. Thiếu dữ liệu ở một bên -> 'chua_du', không đoán. */
function xuHuongChuyenDe_(dongCua1Em) {
  const theoCd = {}
  for (let i = 0; i < dongCua1Em.length; i++) {
    const d = dongCua1Em[i]
    const cd = String(d[2])
    if (!theoCd[cd]) theoCd[cd] = []
    theoCd[cd].push({ nopLuc: String(d[5] || ''), soCau: Number(d[3]) || 0, soSai: Number(d[4]) || 0 })
  }
  const out = {}
  const ds = Object.keys(theoCd)
  for (let i = 0; i < ds.length; i++) {
    const cd = ds[i]
    const rows = theoCd[cd].slice().sort(function (a, b) { return msCua_(b.nopLuc) - msCua_(a.nopLuc) })
    const gan = rows.slice(0, SO_CA_GAN_DAY)
    const truoc = rows.slice(SO_CA_GAN_DAY)
    const tong = function (arr, k) { let s = 0; for (let j = 0; j < arr.length; j++) s += arr[j][k]; return s }
    const cauGan = tong(gan, 'soCau')
    const cauTruoc = tong(truoc, 'soCau')
    if (cauGan < SO_CAU_TOI_THIEU || cauTruoc < SO_CAU_TOI_THIEU) { out[cd] = 'chua_du'; continue }
    const tlGan = tong(gan, 'soSai') / cauGan
    const tlTruoc = tong(truoc, 'soSai') / cauTruoc
    if (tlGan < tlTruoc - NGUONG_XU_HUONG) out[cd] = 'tot'
    else if (tlGan > tlTruoc + NGUONG_XU_HUONG) out[cd] = 'xau'
    else out[cd] = 'deu'
  }
  return out
}

/** Hồ sơ học sinh đã đăng ký (sheet HocSinh) — null nếu chưa có. */
function hoSoHocSinh_(sbd) {
  try {
    // Đường chỉ-đọc: không gọi sheetHS_() vì hàm đó còn ghi bổ sung tiêu đề
    // (thêm một lượt đọc/ghi cho mỗi lệnh — đắt trên Apps Script).
    const sh = getSheet_(SHEET_HOCSINH, HS_HEADERS)
    const row = findRowByKey_(sh, 0, sbd)
    if (row < 0) return null
    const v = sh.getRange(row, 1, 1, 5).getValues()[0]
    return { sbd: String(v[0]), hoTen: String(v[1] || ''), namSinh: String(v[2] || ''), lop: String(v[3] || '') }
  } catch (err) {
    return null
  }
}

/** Đếm theo ca từ LuotThi: đã vào (lượt mới nhất không phải "chờ thi lại"),
 * đã nộp (da_nop|khoa), cảnh báo (khoa hoặc rời màn ≥ 1 lần). */
function thongKeLuot_(luotMap) {
  const kq = { daVao: 0, daNop: 0, canhBao: 0 }
  const ds = Object.keys(luotMap)
  for (let i = 0; i < ds.length; i++) {
    const l = luotMap[ds[i]]
    if (l.trangThai === 'duoc_duyet_lai') continue
    kq.daVao++
    if (l.trangThai === 'da_nop' || l.trangThai === 'khoa') kq.daNop++
    if (l.trangThai === 'khoa' || l.soLanRoiMan > 0) kq.canhBao++
  }
  return kq
}

function tenHocSinh_(sbd) {
  try {
    const sh = sheetHS_()
    const row = findRowByKey_(sh, 0, sbd)
    return row > 0 ? String(sh.getRange(row, 2).getValue() || '') : ''
  } catch (err) {
    return ''
  }
}

// ---------------------------------------------------------------------------
// CÂU KHẮC PHỤC RÚT TỪ KHO ĐỀ — thầy chốt 06/09
//
// Sau khi nộp bài, em được kéo tới 60 câu luyện đúng chỗ vừa mất điểm, rút
// THẲNG TỪ KHO ĐỀ của trung tâm chứ không còn bó trong ngân hàng của ca vừa
// thi (ca 28 câu thì kéo mãi cũng chỉ ra 28).
//
// ĐÂY LÀ LỆNH CÔNG KHAI DUY NHẤT TRẢ VỀ ĐỀ CÓ ĐÁP ÁN VÀ LỜI GIẢI, nên nó bị
// khoá đúng như `lichSuEm`, thêm hai cái trần:
//   1. Phải có lượt đã nộp / đã khoá của ĐÚNG (maCa, sbd).
//   2. IdThietBi của lượt đó phải khớp máy đang hỏi.
//   3. Trần 60 câu và trần dung lượng gói trả về.
// Thiếu (1) và (2) thì chỉ cần biết một số báo danh là kéo được cả kho.
const TRAN_CAU_KHAC_PHUC = 60
// Gói trả về không được vượt ngần này (câu có ảnh base64 nặng vài trăm KB).
const TRAN_BYTE_KHAC_PHUC = 2500000
// Rút câu từ tối đa ngần này ĐỀ trong một lần gọi. Mỗi đề là một lần đọc file
// Drive, mà file đề có ảnh nặng vài trăm KB tới vài MB — mở nhiều là em ngồi
// chờ. Sáu đề đã quá đủ để 60 câu không dồn vào một bài, và sáu đề bất kỳ
// trong kho cũng đã có hơn 60 câu cùng chuyên đề.
const TRAN_DE_MO = 6
const PROP_CHI_MUC_REF = 'CHI_MUC_CAU_REF'
const PROP_CHI_MUC_DAU = 'CHI_MUC_CAU_DAU'
const DE_HEADERS = ['MaDe', 'Nguon', 'NgayNap', 'SoCau', 'SoNghi', 'DeJson', 'CapNhatLuc', 'Nhom']

/** Em này có lượt ĐÃ NỘP của đúng ca này, gửi từ đúng máy này không.
 * `A` là dải MaCa..TrangThai (8 cột đầu) của sheet LuotThi. */
function quaCongLuot_(A, maCa, sbd, idTb) {
  for (let i = 1; i < A.length; i++) {
    if (String(A[i][0]) !== maCa || String(A[i][1]) !== sbd) continue
    const tt = String(A[i][7])
    if (tt !== 'da_nop' && tt !== 'khoa') continue
    if (String(A[i][3] || '') !== idTb) continue
    return true
  }
  return false
}

/** Mốc của kho đề: đổi một đề là chuỗi này đổi, chỉ mục phải dựng lại. */
function dauKhoDe_(sh) {
  const n = sh.getLastRow()
  if (n < 2) return 'rong'
  const ma = sh.getRange(2, 1, n - 1, 1).getValues()
  const luc = sh.getRange(2, 7, n - 1, 1).getValues()
  const ra = []
  for (let i = 0; i < ma.length; i++) ra.push(String(ma[i][0]) + '|' + String(luc[i][0]))
  return ra.join(';')
}

/** CHỈ MỤC CÂU: mỗi câu một dòng nhẹ (mã đề, phần, số, chuyên đề, mức độ, sao).
 *
 * Không có chỉ mục thì mỗi lần em bấm "tạo câu khắc phục" là mở CẢ KHO (20 file
 * Drive, mỗi file vài trăm KB) chỉ để đọc trường `chuyen_de`. Có chỉ mục thì
 * chọn xong mới mở đúng vài file chứa câu đã chọn.
 *
 * Dựng lại khi kho đổi. `luuDe` xoá mốc nên lần gọi sau tự dựng lại. */
function chiMucCau_(batDungLai) {
  const props = PropertiesService.getScriptProperties()
  const sh = getSheet_(SHEET_DE, DE_HEADERS)
  const dau = dauKhoDe_(sh)
  const ref = props.getProperty(PROP_CHI_MUC_REF)
  if (!batDungLai && ref && props.getProperty(PROP_CHI_MUC_DAU) === dau) {
    try {
      const cu = docJsonLon_(ref)
      if (cu && cu.cau) return cu
    } catch (err) {
      // file chỉ mục bị xoá tay -> dựng lại
    }
  }
  const data = sh.getDataRange().getValues()
  const cau = []
  for (let i = 1; i < data.length; i++) {
    const maDe = String(data[i][0])
    let de = null
    try {
      de = docJsonLon_(data[i][5])
    } catch (err) {
      continue
    }
    if (!de || !de.cau || !de.cau.length) continue
    for (let k = 0; k < de.cau.length; k++) {
      const c = de.cau[k]
      const lg = c.loi_giai
      cau.push({
        d: maDe,
        p: String(c.phan || ''),
        s: Number(c.so),
        cd: String(c.chuyen_de || ''),
        md: String(c.muc_do || ''),
        // Sao "cần chữa" — 0 khi thiếu hoặc sai kiểu, KHÔNG đoán.
        sao: c.can_chua && (c.can_chua.sao === 1 || c.can_chua.sao === 2) ? c.can_chua.sao : 0,
        // Có lời giải để em tự đối chiếu sau khi làm.
        co: lg && (lg.chot || (lg.buoc && lg.buoc.length) || lg.tung_pa || lg.tung_y) ? 1 : 0,
        // Đang nghi đáp án sai / thiếu đáp án -> KHÔNG đẩy cho em luyện.
        ng: lg && (lg.trang_thai === 'nghi_dap_an_sai' || lg.trang_thai === 'thieu_dap_an') ? 1 : 0,
        h: c.hinh && c.hinh.length ? 1 : 0,
      })
    }
  }
  const moi = { dau: dau, luc: new Date().toISOString(), cau: cau }
  const refMoi = luuJsonLon_('chi-muc-cau', moi, ref)
  props.setProperty(PROP_CHI_MUC_REF, refMoi)
  props.setProperty(PROP_CHI_MUC_DAU, dau)
  return moi
}

/** Chọn câu theo chuyên đề em vừa mất điểm, bỏ hẳn câu em vừa làm trong ca.
 *
 * Thứ tự: chuyên đề yếu nhất trước → trong cùng chuyên đề thì câu 2 sao trước
 * → câu KHÔNG có hình trước (một ảnh base64 nặng bằng vài chục câu chữ, xếp
 * sau thì cùng một hạn mức dung lượng em nhận được nhiều câu hơn; ảnh vẫn
 * gửi, chỉ là khi đã đủ câu thì thôi) → rải đều các đề để em không nhận 60 câu
 * của cùng một bài. */
const BAC_MUC_DO = { biet: 0, hieu: 1, van_dung: 2 }

function chonCauKhacPhuc_(chiMuc, chuyenDe, loaiTru, soCau) {
  const hangCua = {}
  for (let i = 0; i < chuyenDe.length; i++) if (chuyenDe[i]) hangCua[String(chuyenDe[i])] = i
  const bo = {}
  for (let i = 0; i < loaiTru.length; i++) bo[String(loaiTru[i])] = true

  const ung = []
  for (let i = 0; i < chiMuc.cau.length; i++) {
    const c = chiMuc.cau[i]
    const hang = hangCua[c.cd]
    if (hang === undefined) continue
    if (!c.co || c.ng) continue
    const qid = c.d + '-' + c.p + '-' + c.s
    if (bo[qid]) continue
    const bac = BAC_MUC_DO[c.md]
    ung.push({ qid: qid, d: c.d, p: c.p, s: c.s, hang: hang, sao: c.sao, h: c.h, bac: bac === undefined ? 1 : bac })
  }
  ung.sort(function (a, b) {
    if (a.hang !== b.hang) return a.hang - b.hang
    // KHÔNG HÌNH TRƯỚC, và đứng trước cả mức độ. Một câu có ảnh base64 nặng
    // bằng vài chục câu chữ; xếp ảnh sau thì cùng một hạn mức dung lượng em
    // nhận đủ 60 câu, xếp trước thì trần dung lượng cắt còn vài chục.
    if (a.h !== b.h) return a.h - b.h
    // DỄ LÊN KHÓ — đúng như màn báo cáo hứa với em.
    if (a.bac !== b.bac) return a.bac - b.bac
    if (a.sao !== b.sao) return b.sao - a.sao
    if (a.d !== b.d) return a.d < b.d ? -1 : 1
    return a.s - b.s
  })

  // CHỐT DANH SÁCH ĐỀ NGAY Ở ĐÂY, trước khi rải.
  //
  // LỖI ĐÃ DÍNH (thầy báo 06/09, thanh kéo dừng ở 36): bản trước rải đều qua
  // MỌI đề có câu khớp, rồi khâu đọc file mới cắt còn 8 đề. Câu khớp nằm rải
  // ở mười mấy đề nên 60 câu chia ra mỗi đề bốn năm câu, cắt còn 8 đề là mất
  // hơn một phần ba. Nay chỉ nhận câu của TRAN_DE_MO đề đầu tiên tính theo
  // thứ tự ưu tiên — vẫn đủ nhiều đề để không dồn vào một bài, mà 60 câu luôn
  // nằm trọn trong số đề sẽ mở.
  const nhanDe = {}
  const thuTuDe = []
  const hangDoi = {}
  for (let i = 0; i < ung.length; i++) {
    const d = ung[i].d
    if (!nhanDe[d]) {
      if (thuTuDe.length >= TRAN_DE_MO) continue
      nhanDe[d] = true
      thuTuDe.push(d)
      hangDoi[d] = []
    }
    hangDoi[d].push(ung[i])
  }

  // Rải đều: đi vòng qua các đề, mỗi vòng lấy một câu của mỗi đề.
  const ra = []
  let conCau = true
  while (ra.length < soCau && conCau) {
    conCau = false
    for (let i = 0; i < thuTuDe.length && ra.length < soCau; i++) {
      const q = hangDoi[thuTuDe[i]]
      if (q.length === 0) continue
      ra.push(q.shift())
      conCau = true
    }
  }
  return ra
}

/** CHẠY TAY TRONG TRÌNH SOẠN khi muốn dựng lại chỉ mục câu ngay: chọn hàm này
 * → Chạy → xem Nhật ký thực thi. Chỉ ĐỌC kho đề, không sửa gì. */
function dungChiMucNgay() {
  const cm = chiMucCau_(true)
  const theoDe = {}
  for (let i = 0; i < cm.cau.length; i++) theoDe[cm.cau[i].d] = (theoDe[cm.cau[i].d] || 0) + 1
  let coLoiGiai = 0
  let coSao = 0
  for (let i = 0; i < cm.cau.length; i++) {
    if (cm.cau[i].co) coLoiGiai++
    if (cm.cau[i].sao > 0) coSao++
  }
  Logger.log('Chỉ mục: ' + Object.keys(theoDe).length + ' đề | ' + cm.cau.length + ' câu | có lời giải ' + coLoiGiai + ' | có sao ' + coSao)
  return cm.cau.length
}

function doGet(e) {
  const action = e.parameter.action
  // CHẶN THEO VAI (BA-APP.md đợt 1): lệnh của thầy phải kèm mã bí mật. Không
  // có mã thì không đọc được danh sách học sinh, danh bạ phụ huynh, hộp thư.
  if (GET_CHI_THAY.indexOf(action) >= 0) {
    const mat = maBiMat_()
    if (!mat || String(e.parameter.secret || '').trim() !== mat) return jsonResponse_({ ok: false, error: 'Không có quyền' })
  }
  if (action === 'hsHoSo') {
    // Máy học sinh mở link riêng /hs/<token> — máy chủ tự tra token ra SBD.
    const hs = hsTuToken_(e.parameter.token)
    if (!hs) return jsonResponse_({ ok: false, found: false, error: 'Link không hợp lệ hoặc đã bị thu hồi' })
    return jsonResponse_({ ok: true, found: true, sbd: hs.sbd, hoTen: hs.hoTen, namSinh: hs.namSinh, lop: hs.lop, trangThai: hs.trangThai, serverNow: Date.now() })
  }
  if (action === 'phHoSo') {
    const ph = phTuToken_(e.parameter.token)
    if (!ph) return jsonResponse_({ ok: false, found: false, error: 'Link không hợp lệ hoặc đã bị thu hồi' })
    return jsonResponse_({ ok: true, found: true, sdt: ph.sdt, hoTenPhuHuynh: ph.hoTenPhuHuynh, sbd: ph.sbd, lop: ph.lop, hoTenHocSinh: ph.hoTenHocSinh, trangThai: ph.trangThai, serverNow: Date.now() })
  }
  if (action === 'session') {
    // Bản cũ (trước QUANLYCATHI): chỉ tải đề. App mới vào thi bằng POST
    // vaoThi (có kiểm tra 1 SBD 1 lượt + 3 mốc thời gian); giữ action này để
    // link cũ / bản app cũ còn chạy. Vẫn KHÔNG trả KeyBankJson.
    const maCa = e.parameter.maCa || ''
    const sh = sheetCa_()
    const row = findRowByKey_(sh, 0, maCa)
    if (row < 0) return jsonResponse_({ found: false })
    const ca = docCa_(sh, row)
    if (ca.trangThai === 'da_xoa') return jsonResponse_({ found: false })
    return jsonResponse_({
      found: true,
      maCa: ca.maCa,
      lop: ca.lop,
      thoiGianPhut: ca.thoiGianPhut,
      moLuc: ca.moLuc,
      batDau: ca.batDau,
      hetHanVao: ca.hetHanVao,
      serverNow: Date.now(),
      // Bản đồ đề riêng đi CÙNG gói đề: thiếu nó là máy em cắt câu theo luật
      // hash và nhận bộ câu của người khác.
      bank: gopBoTheoEm_(docJsonLon_(ca.bankRef), ca.boTheoEmRef),
    })
  }
  if (action === 'ketQua') {
    // Em hỏi lại sau khi nộp: đã được xem đáp án chưa? CHỈ trả keyBank cho em
    // ĐÃ NỘP, và với chế độ 'calop' chỉ khi mọi SBD đã vào thi ca này đều đã
    // nộp, hoặc đều đã hết giờ (HetGioLuc + ân hạn) — em nộp sớm không thể lấy
    // đáp án trong lúc bạn còn đang làm. Nguồn: sheet LuotThi (lượt mới nhất
    // mỗi SBD); ca mở từ bản cũ không có LuotThi → dùng BaiLam + TrangThai.
    const maCa = e.parameter.maCa || ''
    const sbd = (e.parameter.sbd || '').trim()
    const caSh = sheetCa_()
    const caRow = findRowByKey_(caSh, 0, maCa)
    if (caRow < 0) return jsonResponse_({ ok: false, error: 'Không có ca ' + maCa })
    const ca = docCa_(caSh, caRow)
    const congBo = ca.congBo
    const now = Date.now()

    const luot = luotMoiNhatTheoSbd_(sheetLuot_(), maCa)
    const dsSbd = Object.keys(luot)
    let daNop = {}
    let soDaNop = 0
    let daVao = 0
    let conDangLam = 0
    if (dsSbd.length > 0) {
      for (let k = 0; k < dsSbd.length; k++) {
        const l = luot[dsSbd[k]]
        if (l.trangThai === 'duoc_duyet_lai') continue // thầy duyệt nhưng em chưa vào
        daVao++
        if (l.trangThai === 'da_nop' || l.trangThai === 'khoa') {
          daNop[l.sbd] = true
          soDaNop++
        } else {
          const hetGio = msCua_(l.hetGioLuc)
          if (!(isFinite(hetGio) && now > hetGio + AN_HAN_NOP_GIAY * 1000)) conDangLam++
        }
      }
    } else {
      const blSh = getSheet_(SHEET_BAILAM, ['MaCa', 'SBD', 'MaDe', 'ThoiGianNop', 'DapAnJson', 'SoLanRoiApp', 'TongGiayRoiApp', 'IntegrityJson'])
      const bl = blSh.getDataRange().getValues()
      for (let i = 1; i < bl.length; i++) if (String(bl[i][0]) === String(maCa)) daNop[String(bl[i][1])] = true
      soDaNop = Object.keys(daNop).length
      const stSh = getSheet_(SHEET_TRANGTHAI, ['SBD', 'MaCa', 'Lop', 'DangLam', 'BatDauLuc', 'DaLamCauHoi', 'TongCauHoi', 'SoLanRoiApp', 'Blocked', 'CapNhatLuc'])
      const st = stSh.getDataRange().getValues()
      const han = (ca.thoiGianPhut + 2) * 60000
      for (let i = 1; i < st.length; i++) {
        if (String(st[i][1]) !== String(maCa)) continue
        daVao++
        const batDau = new Date(st[i][4]).getTime()
        const hetGio = isFinite(batDau) && now > batDau + han
        if (!daNop[String(st[i][0])] && !hetGio) conDangLam++
      }
      if (soDaNop > daVao) daVao = soDaNop
    }
    const emDaNop = !!daNop[sbd]

    if (congBo === 'khong' || !ca.keyBankRef) return jsonResponse_({ ok: true, congBo: congBo, sanSang: false, daNop: soDaNop, daVao: daVao, keyBank: null })
    if (congBo === 'ngay') return jsonResponse_({ ok: true, congBo: congBo, sanSang: emDaNop, daNop: soDaNop, daVao: daVao, keyBank: emDaNop ? docJsonLon_(ca.keyBankRef) : null })
    const sanSang = emDaNop && soDaNop > 0 && conDangLam === 0
    return jsonResponse_({ ok: true, congBo: congBo, sanSang: sanSang, daNop: soDaNop, daVao: daVao, keyBank: sanSang ? docJsonLon_(ca.keyBankRef) : null })
  }

  if (action === 'listSubmissions') {
    // Lượt MỚI NHẤT của mỗi SBD trong ca (mọi trạng thái — màn Theo dõi tự lọc
    // đã nộp để chấm). Ca mở từ bản cũ không có LuotThi → đọc BaiLam như trước.
    const maCa = e.parameter.maCa || ''
    const luot = luotMoiNhatTheoSbd_(sheetLuot_(), maCa)
    const rows = []
    const dsSbd = Object.keys(luot)
    for (let k = 0; k < dsSbd.length; k++) {
      const l = luot[dsSbd[k]]
      let integrity = null
      try { integrity = l.integrityJson ? JSON.parse(l.integrityJson) : null } catch (err) {}
      let dapAn = null
      try { dapAn = l.dapAnJson ? JSON.parse(l.dapAnJson) : null } catch (err) {}
      let giayCau = null
      try { giayCau = l.giayCauJson ? JSON.parse(l.giayCauJson) : null } catch (err) {}
      rows.push({
        sbd: l.sbd,
        hoTen: l.hoTen,
        maDe: 'ngân hàng',
        lanThu: l.lanThu,
        trangThai: l.trangThai,
        vaoLuc: l.vaoLuc,
        hetGioLuc: l.hetGioLuc,
        thoiGianNop: l.nopLuc,
        dapAn: dapAn,
        integrity: integrity,
        ghiChu: l.ghiChu,
        duyetBoi: l.duyetBoi,
        giayCau: giayCau,
        tong: l.tong,
      })
    }
    if (rows.length === 0) {
      const sh = getSheet_(SHEET_BAILAM, ['MaCa', 'SBD', 'MaDe', 'ThoiGianNop', 'DapAnJson', 'SoLanRoiApp', 'TongGiayRoiApp', 'IntegrityJson'])
      const data = sh.getDataRange().getValues()
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(maCa)) {
          const integ = data[i][7] ? JSON.parse(data[i][7]) : null
          rows.push({
            sbd: data[i][1],
            hoTen: '',
            maDe: data[i][2],
            lanThu: 1,
            trangThai: integ && integ.blocked ? 'khoa' : 'da_nop',
            vaoLuc: '',
            hetGioLuc: '',
            thoiGianNop: data[i][3],
            dapAn: JSON.parse(data[i][4]),
            integrity: integ,
            ghiChu: '',
            duyetBoi: '',
          })
        }
      }
    }
    return jsonResponse_({ rows: rows, serverNow: Date.now() })
  }
  if (action === 'parentFeedback') {
    const ph = phTuYeuCau_(e.parameter.token, e.parameter.sdt)
    if (!ph) return jsonResponse_({ found: false, canToken: true })
    const phSh = sheetPH_()
    const phVals = phSh.getRange(ph.row, 1, 1, 6).getValues()[0]
    const sbd = String(phVals[2])

    const nxSh = getSheet_(SHEET_NHANXET, ['SBD', 'MaCa', 'MaDe', 'ThoiGianNop', 'Diem', 'XepLoai', 'CauSai', 'GuiLuc'])
    const data = nxSh.getDataRange().getValues()
    const items = []
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === sbd) {
        items.push({
          maCa: data[i][1],
          maDe: data[i][2],
          thoiGianNop: data[i][3],
          diem: data[i][4],
          xepLoai: data[i][5],
          cauSai: data[i][6],
        })
      }
    }
    items.sort(function (a, b) {
      return new Date(b.thoiGianNop) - new Date(a.thoiGianNop)
    })
    return jsonResponse_({
      found: true,
      sdt: String(phVals[0]),
      hoTenPhuHuynh: phVals[1],
      sbd: sbd,
      lop: phVals[3],
      hoTenHocSinh: phVals[4],
      items: items,
    })
  }
  if (action === 'parentStatus') {
    // Trạng thái làm bài GẦN-THỜI-GIAN-THỰC cho phụ huynh xem — phụ huynh
    // tự poll lại endpoint này (app tự gọi lại mỗi ~15 giây khi đang mở màn
    // theo dõi), không phải server đẩy tin thật sự.
    const ph = phTuYeuCau_(e.parameter.token, e.parameter.sdt)
    if (!ph) return jsonResponse_({ found: false, canToken: true })
    const phSh = sheetPH_()
    const phVals = phSh.getRange(ph.row, 1, 1, 6).getValues()[0]
    const sbd = String(phVals[2])

    const stSh = getSheet_(SHEET_TRANGTHAI, [
      'SBD',
      'MaCa',
      'Lop',
      'DangLam',
      'BatDauLuc',
      'DaLamCauHoi',
      'TongCauHoi',
      'SoLanRoiApp',
      'Blocked',
      'CapNhatLuc',
    ])
    const stRow = findRowByKey_(stSh, 0, sbd)
    if (stRow < 0) {
      return jsonResponse_({ found: true, hoTenHocSinh: phVals[4], sbd: sbd, status: null })
    }
    const v = stSh.getRange(stRow, 1, 1, 10).getValues()[0]
    return jsonResponse_({
      found: true,
      hoTenHocSinh: phVals[4],
      sbd: sbd,
      status: {
        maCa: v[1],
        lop: v[2],
        dangLam: String(v[3]) === 'true',
        batDauLuc: v[4],
        daLamCauHoi: v[5],
        tongCauHoi: v[6],
        soLanRoiApp: v[7],
        blocked: String(v[8]) === 'true',
        capNhatLuc: v[9],
      },
    })
  }

  // ĐẾM TIN CHƯA ĐỌC — lệnh rẻ nhất của cả hệ (tối ưu 06/09).
  //
  // Bong bóng nổi hỏi lại đều đặn chỉ để biết CÓ MẤY TIN CHƯA ĐỌC, mà trước
  // đây nó gọi `listMessages` — máy chủ đọc CẢ SHEET, mười cột kể cả nội dung
  // từng tin, rồi trả về hết, để máy thầy đếm một con số. Nay đọc ĐÚNG MỘT CỘT
  // `DaDoc` và trả về đúng hai con số.
  if (action === 'demTinMoi') {
    const sh = getSheet_(SHEET_TINNHAN, ['Id', 'SDT', 'HoTenPhuHuynh', 'SBD', 'Lop', 'HoTenHocSinh', 'NoiDung', 'ThoiGian', 'DaDoc', 'NguoiGui'])
    const n = sh.getLastRow()
    if (n < 2) return jsonResponse_({ ok: true, soChuaDoc: 0, tong: 0 })
    const cot = sh.getRange(2, 9, n - 1, 1).getValues()
    let chuaDoc = 0
    for (let i = 0; i < cot.length; i++) if (String(cot[i][0]) !== 'true') chuaDoc++
    return jsonResponse_({ ok: true, soChuaDoc: chuaDoc, tong: cot.length })
  }

  if (action === 'listMessages') {
    // Thầy xem tin nhắn phụ huynh/học sinh gửi — không cần đăng nhập (giống
    // listSubmissions), chỉ ai có đúng link Apps Script này (thầy tự giữ
    // link) mới gọi được.
    const sh = getSheet_(SHEET_TINNHAN, ['Id', 'SDT', 'HoTenPhuHuynh', 'SBD', 'Lop', 'HoTenHocSinh', 'NoiDung', 'ThoiGian', 'DaDoc', 'NguoiGui'])
    const data = sh.getDataRange().getValues()
    const items = []
    for (let i = 1; i < data.length; i++) {
      items.push({
        id: data[i][0],
        sdt: data[i][1],
        hoTenPhuHuynh: data[i][2],
        sbd: data[i][3],
        lop: data[i][4],
        hoTenHocSinh: data[i][5],
        noiDung: data[i][6],
        thoiGian: data[i][7],
        daDoc: String(data[i][8]) === 'true',
        nguoiGui: data[i][9] || 'phuhuynh', // dòng cũ trước khi có cột này -> mặc định phụ huynh
      })
    }
    items.sort(function (a, b) {
      return new Date(b.thoiGian) - new Date(a.thoiGian)
    })
    return jsonResponse_({ items: items })
  }

  if (action === 'listParents') {
    // Danh sách phụ huynh đã đăng ký — cho màn quản lý của thầy (xoá khi đăng
    // ký nhầm). Phụ huynh/học sinh KHÔNG tự xoá được đăng ký của mình trong
    // app — chỉ thầy xoá được ở đây.
    const sh = sheetPH_()
    const data = sh.getDataRange().getValues()
    const items = []
    for (let i = 1; i < data.length; i++) {
      items.push({
        sdt: data[i][0],
        hoTenPhuHuynh: data[i][1],
        sbd: data[i][2],
        lop: data[i][3],
        hoTenHocSinh: data[i][4],
        dangKyLuc: data[i][5],
        token: String(data[i][PH_COT_TOKEN] || ''),
        trangThai: String(data[i][PH_COT_TRANGTHAI] || ''),
      })
    }
    return jsonResponse_({ items: items })
  }

  if (action === 'listStudents') {
    // Danh sách học sinh đã đăng ký hồ sơ — cho màn quản lý của thầy.
    const sh = sheetHS_()
    const data = sh.getDataRange().getValues()
    const items = []
    for (let i = 1; i < data.length; i++) {
      items.push({
        sbd: data[i][0],
        hoTen: data[i][1],
        namSinh: data[i][2],
        lop: data[i][3],
        dangKyLuc: data[i][4],
        sdt: String(data[i][5] || ''),
        sdtPhuHuynh: String(data[i][6] || ''),
        token: String(data[i][HS_COT_TOKEN] || ''),
        trangThai: String(data[i][HS_COT_TRANGTHAI] || ''),
      })
    }
    return jsonResponse_({ items: items })
  }

  if (action === 'studentProfile') {
    const q = sbdTuYeuCau_(e.parameter.token, e.parameter.sbd)
    if (!q) return jsonResponse_({ found: false, canToken: true })
    const sh = sheetHS_()
    const row = findRowByKey_(sh, 0, q.sbd)
    if (row < 0) return jsonResponse_({ found: false })
    const v = sh.getRange(row, 1, 1, HS_HEADERS.length).getValues()[0]
    return jsonResponse_({ found: true, sbd: String(v[0]), hoTen: v[1], namSinh: v[2], lop: v[3], trangThai: String(v[HS_COT_TRANGTHAI] || '') })
  }

  if (action === 'parentInbox' || action === 'studentInbox') {
    // Tin nhắn THẦY GỬI CHO 1 em — phụ huynh/học sinh tự poll lại (giống
    // parentStatus), không phải đẩy tức thì thật sự.
    let sbd = ''
    if (action === 'parentInbox') {
      const ph = phTuYeuCau_(e.parameter.token, e.parameter.sdt)
      if (!ph) return jsonResponse_({ found: false, canToken: true })
      sbd = ph.sbd
    } else {
      const q = sbdTuYeuCau_(e.parameter.token, e.parameter.sbd)
      if (!q) return jsonResponse_({ found: false, canToken: true })
      sbd = q.sbd
    }
    const sh = getSheet_(SHEET_TINTHAY, ['Id', 'SBD', 'NoiDung', 'ThoiGian', 'DaXem'])
    const data = sh.getDataRange().getValues()
    const items = []
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][1]) === sbd) {
        items.push({ id: data[i][0], sbd: data[i][1], noiDung: data[i][2], thoiGian: data[i][3], daXem: String(data[i][4]) === 'true' })
      }
    }
    items.sort(function (a, b) {
      return new Date(b.thoiGian) - new Date(a.thoiGian)
    })
    return jsonResponse_({ found: true, items: items })
  }

  if (action === 'listAllFeedback') {
    // Toàn bộ nhận xét/điểm đã chấm — dùng cho thầy tra cứu nhanh theo tên
    // học sinh (vd để gửi lại điểm cho phụ huynh) mà không cần nhớ SBD.
    const nxSh = getSheet_(SHEET_NHANXET, ['SBD', 'MaCa', 'MaDe', 'ThoiGianNop', 'Diem', 'XepLoai', 'CauSai', 'GuiLuc'])
    const data = nxSh.getDataRange().getValues()
    const items = []
    for (let i = 1; i < data.length; i++) {
      items.push({
        sbd: String(data[i][0]),
        maCa: data[i][1],
        maDe: data[i][2],
        thoiGianNop: data[i][3],
        diem: data[i][4],
        xepLoai: data[i][5],
      })
    }
    return jsonResponse_({ items: items })
  }

  return jsonResponse_({ error: 'Thiếu hoặc sai tham số action' })
}

// ---------------------------------------------------------------------------
// HỒ SƠ HỌC SINH — đọc bảng MỘT LẦN, tính cho bao nhiêu em cũng được.
//
// Tách ra từ `hoSoEm` (06/09) để `hoSoNhieuEm` dùng lại NGUYÊN VẸN phép tính:
// hai lệnh mà hai đường tính là sớm muộn cũng lệch số, mà đây là số in vào
// phiếu gửi phụ huynh.
const TRAN_HO_SO_NHIEU = 60
/** Số phiếu tối đa một gói `luuNhieuPhieu`. Phiếu có ảnh nặng vài trăm KB nên
 * gói to quá là quá cỡ POST; máy thầy tự chia gói theo số này. */
const TRAN_PHIEU_MOT_GOI = 6

/** Đọc trọn ba bảng cần cho hồ sơ. Gọi MỘT LẦN rồi truyền xuống từng em. */
function docBangHoSo_() {
  const caData = getSheet_(SHEET_TIENDO_CA, TIENDO_CA_HEADERS).getDataRange().getValues()
  // Chỉ 17 cột đầu: bỏ GhiChu/CapNhatLuc và nhất là GiayCauJson — đọc cả bảng
  // là kéo về JSON giây-từng-câu của MỌI lượt, rất nặng.
  const luotSh = sheetLuot_()
  const soDongLuot = luotSh.getLastRow()
  const luotData = soDongLuot > 0 ? luotSh.getRange(1, 1, soDongLuot, 17).getValues() : []
  const tenCa = {}
  const caRows = getSheet_(SHEET_CA, CA_HEADERS).getDataRange().getValues()
  for (let i = 1; i < caRows.length; i++) {
    // Ca thầy đã xoá thì không hiện lại trong hồ sơ em nữa.
    if (String(caRows[i][9]) === 'da_xoa') continue
    tenCa[String(caRows[i][0])] = { tenCa: String(caRows[i][10] || ''), lop: String(caRows[i][1] || '') }
  }
  // Điểm theo ca để xếp hạng — cũng chỉ tính một lần cho mọi em.
  const diemTheoCa = {}
  for (let i = 1; i < luotData.length; i++) {
    const tt = String(luotData[i][7])
    if (tt !== 'da_nop' && tt !== 'khoa') continue
    const mc = String(luotData[i][0])
    const tong = luotData[i][16]
    if (tong === '' || tong === null || tong === undefined) continue
    if (!diemTheoCa[mc]) diemTheoCa[mc] = []
    diemTheoCa[mc].push(Number(tong))
  }
  return { caData: caData, luotData: luotData, tenCa: tenCa, diemTheoCa: diemTheoCa }
}

/** Hồ sơ của MỘT em, tính từ bảng đã đọc sẵn. Trả về đúng khuôn `hoSoEm`. */
function hoSoTuBang_(sbd, bang) {
  // Em chưa thi lần nào thì chưa có dòng trong HocSinh — lấy tên từ danh sách
  // thầy đã nạp, để bấm vào em nào cũng ra hồ sơ có tên, không phải ô trống.
  let em = hoSoHocSinh_(sbd)
  if (!em || !em.hoTen) {
    const tu = timTrongDanhSachLop_(sbd)
    if (tu) em = { sbd: sbd, hoTen: tu.hoTen, namSinh: tu.namSinh, lop: tu.lop || (em ? em.lop : '') }
  }
  if (!em) em = { sbd: sbd, hoTen: '', namSinh: '', lop: '' }

  const caData = bang.caData
  const dongEm = []
  for (let i = 1; i < caData.length; i++) if (String(caData[i][0]) === sbd) dongEm.push(caData[i])
  const xh = xuHuongChuyenDe_(dongEm)
  const cong = {}
  for (let i = 0; i < dongEm.length; i++) {
    const cd = String(dongEm[i][2])
    if (!cong[cd]) cong[cd] = { soCau: 0, soSai: 0 }
    cong[cd].soCau += Number(dongEm[i][3]) || 0
    cong[cd].soSai += Number(dongEm[i][4]) || 0
  }
  const chuyenDe = []
  const dsCd = Object.keys(cong)
  for (let i = 0; i < dsCd.length; i++) {
    const v = cong[dsCd[i]]
    if (v.soCau === 0) continue
    chuyenDe.push({ ten: dsCd[i], soCau: v.soCau, soSai: v.soSai, tiLeSai: v.soSai / v.soCau, xuHuong: xh[dsCd[i]] || 'chua_du' })
  }
  chuyenDe.sort(function (a, b) { return b.tiLeSai - a.tiLeSai })

  const luotData = bang.luotData
  const tenCa = bang.tenCa
  const diemTheoCa = bang.diemTheoCa
  const ca = []
  for (let i = 1; i < luotData.length; i++) {
    if (String(luotData[i][1]) !== sbd) continue
    const tt = String(luotData[i][7])
    if (tt !== 'da_nop' && tt !== 'khoa') continue
    const mc = String(luotData[i][0])
    if (!tenCa[mc]) continue // ca đã xoá (hoặc không còn trong CaKiemTra)
    const tong = luotData[i][16] === '' || luotData[i][16] === null ? null : Number(luotData[i][16])
    let hang = null
    let siSo = null
    if (tong !== null && diemTheoCa[mc]) {
      const dsd = diemTheoCa[mc].slice().sort(function (a, b) { return b - a })
      siSo = dsd.length
      hang = dsd.indexOf(tong) + 1
    }
    ca.push({
      maCa: mc,
      tenCa: (tenCa[mc] || {}).tenCa || '',
      lop: (tenCa[mc] || {}).lop || '',
      lanThu: Number(luotData[i][2]) || 1,
      nopLuc: String(luotData[i][6] || ''),
      trangThai: tt,
      diemI: luotData[i][13] === '' ? null : Number(luotData[i][13]),
      diemII: luotData[i][14] === '' ? null : Number(luotData[i][14]),
      diemIII: luotData[i][15] === '' ? null : Number(luotData[i][15]),
      tong: tong,
      hang: hang,
      siSo: siSo,
      soLanRoiMan: Number(luotData[i][9]) || 0,
    })
  }
  ca.sort(function (a, b) { return msCua_(b.nopLuc) - msCua_(a.nopLuc) })

  // Số liệu của RIÊNG ca gần nhất đã chấm — phiếu gửi phụ huynh phải dùng số
  // của ca đó, không được dùng số cộng dồn (BA-APP: cấm bịa/nhầm số).
  let caGanNhat = null
  for (let i = 0; i < ca.length; i++) {
    if (ca[i].tong !== null) { caGanNhat = ca[i]; break }
  }
  const cdCaGanNhat = []
  let soCauSaiCaGanNhat = 0
  if (caGanNhat) {
    for (let i = 0; i < dongEm.length; i++) {
      if (String(dongEm[i][1]) !== caGanNhat.maCa) continue
      const soSai = Number(dongEm[i][4]) || 0
      soCauSaiCaGanNhat += soSai
      cdCaGanNhat.push({ ten: String(dongEm[i][2]), soCau: Number(dongEm[i][3]) || 0, soSai: soSai })
    }
    cdCaGanNhat.sort(function (a, b) { return b.soSai - a.soSai })
  }
  return { em: em, chuyenDe: chuyenDe, ca: ca, caGanNhat: caGanNhat, chuyenDeCaGanNhat: cdCaGanNhat, soCauSaiCaGanNhat: soCauSaiCaGanNhat }
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents)
  const action = body.action

  // -------------------------------------------------- CHẤM CÂU GỌI LÊN BẢNG
  // Thầy gọi em lên bảng chữa một câu rồi bấm Đạt / Không đạt. Ghi lại như MỘT
  // câu của chuyên đề đó, để lần sau máy phân công dựa trên cả những gì em làm
  // trên bảng chứ không chỉ bài thi trên máy.
  //
  // Cố ý KHÔNG tạo lượt thi giả: mỗi lần ghi là một dòng TienDoCa riêng, mã
  // 'LENBANG-<thời điểm>'. Nhờ vậy nó cộng vào bảng mạnh–yếu tổng của em nhưng
  // KHÔNG bao giờ thành "ca gần nhất" (ca gần nhất đọc từ LuotThi), và không
  // đụng vào điểm số của em.
  if (action === 'ghiLenBang') {
    const loiLB = kiemTraMaBiMat_(body)
    if (loiLB) return jsonResponse_({ ok: false, error: loiLB })
    const sbdLB = String(body.sbd || '').trim()
    const cdLB = String(body.chuyenDe || '').trim()
    if (!sbdLB || !cdLB) return jsonResponse_({ ok: false, error: 'Thiếu sbd hoặc chuyenDe' })
    const datLB = body.dat === true
    const lucLB = new Date().toISOString()
    const maCaLB = 'LENBANG-' + lucLB.slice(0, 19).replace(/[-:T]/g, '')
    const theoCd = {}
    theoCd[cdLB] = { soCau: 1, soSai: datLB ? 0 : 1 }
    const tomTat = {}
    tomTat[sbdLB] = { nopLuc: lucLB, theoCd: theoCd, qids: body.qid ? [String(body.qid)] : [] }
    ghiTienDo_(maCaLB, tomTat)
    return jsonResponse_({ ok: true, maCa: maCaLB, dat: datLB })
  }

  // ------------------------------------------------------------------ KHO ĐỀ
  // Pipeline "Nạp đề mới" (Cowork) đẩy đề ĐẦY ĐỦ đáp án + lời giải + ảnh lên
  // đây; app trên máy thầy tự tải về ngân hàng câu hỏi. Cả 3 action đều cần
  // MA_BI_MAT — học sinh/phụ huynh không bao giờ có mã này, và đề KHÔNG nằm
  // trên GitHub (repo public). Dùng POST để mã bí mật không lọt vào URL/log.
  if (action === 'luuDe' || action === 'danhSachDe' || action === 'layDe' || action === 'xoaDe') {
    const loi = kiemTraMaBiMat_(body)
    if (loi) return jsonResponse_({ ok: false, error: loi })
    const sh = getSheet_(SHEET_DE, ['MaDe', 'Nguon', 'NgayNap', 'SoCau', 'SoNghi', 'DeJson', 'CapNhatLuc', 'Nhom'])
    // Sheet tạo trước khi có cột Nhom (thư mục con trong kho-de/moi/) — bổ sung tiêu đề cột 8.
    if (String(sh.getRange(1, 8).getValue()) !== 'Nhom') sh.getRange(1, 8).setValue('Nhom')
    if (action === 'danhSachDe') {
      const data = sh.getDataRange().getValues()
      const items = []
      for (let i = 1; i < data.length; i++) {
        items.push({ maDe: String(data[i][0]), nguon: data[i][1], ngayNap: data[i][2], soCau: data[i][3], soNghi: data[i][4], capNhatLuc: data[i][6], nhom: data[i][7] ? String(data[i][7]) : '' })
      }
      return jsonResponse_({ ok: true, items: items })
    }
    if (action === 'layDe') {
      const row = findRowByKey_(sh, 0, body.maDe)
      if (row < 0) return jsonResponse_({ ok: false, error: 'Không có đề ' + body.maDe })
      const v = sh.getRange(row, 1, 1, 7).getValues()[0]
      return jsonResponse_({ ok: true, de: docJsonLon_(v[5]) })
    }
    if (action === 'xoaDe') {
      const row = findRowByKey_(sh, 0, body.maDe)
      if (row < 0) return jsonResponse_({ ok: true })
      const ref = String(sh.getRange(row, 6, 1, 1).getValues()[0][0])
      if (ref.indexOf('drive:') === 0) {
        try { DriveApp.getFileById(ref.slice(6)).setTrashed(true) } catch (err) {}
      }
      sh.deleteRow(row)
      PropertiesService.getScriptProperties().deleteProperty(PROP_CHI_MUC_DAU)
      return jsonResponse_({ ok: true })
    }
    // luuDe
    const de = body.de
    if (!de || !de.ma_de || !de.cau || !de.cau.length) return jsonResponse_({ ok: false, error: 'Thiếu de.ma_de hoặc de.cau' })
    const row = findRowByKey_(sh, 0, de.ma_de)
    const cu = row > 0 ? sh.getRange(row, 1, 1, 8).getValues()[0] : [null, null, null, null, null, '', null, '']
    let soNghi = 0
    for (let i = 0; i < de.cau.length; i++) {
      const lg = de.cau[i].loi_giai
      if (lg && (lg.trang_thai === 'nghi_dap_an_sai' || lg.trang_thai === 'thieu_dap_an')) soNghi++
    }
    const rowData = [
      String(de.ma_de),
      de.nguon || '',
      de.ngay_nap || new Date().toISOString(),
      de.cau.length,
      soNghi,
      luuJsonLon_('de_' + de.ma_de, de, cu[5]),
      new Date().toISOString(),
      de.nhom || '',
    ]
    if (row > 0) sh.getRange(row, 1, 1, 8).setValues([rowData])
    else sh.appendRow(rowData)
    // Kho vừa đổi -> CHỈ MỤC CÂU cũ hết đúng. Xoá mốc để lần gọi sau dựng lại;
    // không dựng ngay tại đây vì đẩy 20 đề thì dựng lại 20 lần thừa 19 lần.
    PropertiesService.getScriptProperties().deleteProperty(PROP_CHI_MUC_DAU)
    return jsonResponse_({ ok: true, maDe: String(de.ma_de), soCau: de.cau.length, soNghi: soNghi })
  }

  // -------------------------------------------------------- PHIẾU GỬI PHỤ HUYNH
  // `luuPhieu` cần MÃ BÍ MẬT (chỉ máy thầy ghi). `layPhieu` thì KHÔNG — phụ
  // huynh không có mã bí mật, họ chỉ có đường link. Đây là lệnh đọc công khai
  // duy nhất của hệ thống, nên nó bị bó chặt: phải đưa đúng mã 16 ký tự, trả
  // về ĐÚNG MỘT phiếu, không có lệnh liệt kê, và mã không suy ra được từ mã ca
  // hay số báo danh.
  // LƯU NHIỀU PHIẾU MỘT LƯỢT — để "Tạo & copy link cả ca" gửi một gói thay vì
  // ba chục lượt gọi (tối ưu 06/09). Mỗi lượt gọi Apps Script tốn sẵn ~1,5 giây
  // dựng máy, nên gộp là thứ tiết kiệm nhiều nhất, hơn cả việc đọc ít cột.
  //
  // Mở sheet MỘT LẦN cho cả gói. Phiếu nào hỏng thì ghi vào `loi` và đi tiếp —
  // một em lỗi không được kéo theo cả ca không có link.
  if (action === 'luuNhieuPhieu') {
    const loiN = kiemTraMaBiMat_(body)
    if (loiN) return jsonResponse_({ ok: false, error: loiN })
    const ds = Array.isArray(body.items) ? body.items : []
    if (ds.length === 0) return jsonResponse_({ ok: true, daLuu: [], loi: [] })
    if (ds.length > TRAN_PHIEU_MOT_GOI) return jsonResponse_({ ok: false, error: 'Gửi quá ' + TRAN_PHIEU_MOT_GOI + ' phiếu một gói' })
    const sh = getSheet_(SHEET_PHIEU, PHIEU_HEADERS)
    boSungTieuDe_(sh, PHIEU_HEADERS)
    const daLuu = []
    const loi = []
    for (let k = 0; k < ds.length; k++) {
      const it = ds[k] || {}
      const ma = String(it.ma || '').trim()
      if (!/^[A-Za-z0-9_-]{8,40}$/.test(ma) || !it.phieu) {
        loi.push({ sbd: String(it.sbd || ''), vi_sao: 'Mã phiếu không hợp lệ hoặc thiếu nội dung' })
        continue
      }
      try {
        const row = findRowByKey_(sh, 0, ma)
        const cu = row > 0 ? String(sh.getRange(row, 5).getValue()) : ''
        const hang = [
          ma,
          String(it.maCa || ''),
          String(it.sbd || ''),
          String(it.hoTen || ''),
          luuJsonLon_('phieu_' + ma, it.phieu, cu),
          row > 0 ? sh.getRange(row, 6).getValue() : new Date().toISOString(),
          row > 0 ? sh.getRange(row, 7).getValue() : 0,
          row > 0 ? sh.getRange(row, 8).getValue() : '',
          String(it.loai || '') === 'baitap' ? 'baitap' : 'ketqua',
        ]
        if (row > 0) sh.getRange(row, 1, 1, PHIEU_HEADERS.length).setValues([hang])
        else sh.appendRow(hang)
        daLuu.push({ sbd: String(it.sbd || ''), ma: ma })
      } catch (err) {
        loi.push({ sbd: String(it.sbd || ''), vi_sao: String(err && err.message ? err.message : err) })
      }
    }
    return jsonResponse_({ ok: true, daLuu: daLuu, loi: loi })
  }

  if (action === 'luuPhieu' || action === 'xoaPhieu') {
    const loiP = kiemTraMaBiMat_(body)
    if (loiP) return jsonResponse_({ ok: false, error: loiP })
    const sh = getSheet_(SHEET_PHIEU, PHIEU_HEADERS)
    boSungTieuDe_(sh, PHIEU_HEADERS)
    const ma = String(body.ma || '').trim()
    if (!/^[A-Za-z0-9_-]{8,40}$/.test(ma)) return jsonResponse_({ ok: false, error: 'Mã phiếu không hợp lệ' })
    const row = findRowByKey_(sh, 0, ma)
    if (action === 'xoaPhieu') {
      if (row > 0) {
        const refCu = String(sh.getRange(row, 5).getValue())
        if (refCu.indexOf('drive:') === 0) {
          try { DriveApp.getFileById(refCu.slice(6)).setTrashed(true) } catch (err) {}
        }
        sh.deleteRow(row)
      }
      return jsonResponse_({ ok: true })
    }
    if (!body.phieu) return jsonResponse_({ ok: false, error: 'Thiếu nội dung phiếu' })
    const cu = row > 0 ? String(sh.getRange(row, 5).getValue()) : ''
    const hang = [
      ma,
      String(body.maCa || ''),
      String(body.sbd || ''),
      String(body.hoTen || ''),
      luuJsonLon_('phieu_' + ma, body.phieu, cu),
      row > 0 ? sh.getRange(row, 6).getValue() : new Date().toISOString(),
      row > 0 ? sh.getRange(row, 7).getValue() : 0,
      row > 0 ? sh.getRange(row, 8).getValue() : '',
      String(body.loai || '') === 'baitap' ? 'baitap' : 'ketqua',
    ]
    if (row > 0) sh.getRange(row, 1, 1, PHIEU_HEADERS.length).setValues([hang])
    else sh.appendRow(hang)
    return jsonResponse_({ ok: true, ma: ma })
  }

  if (action === 'phieuTheoCa') {
    // MÃ PHIẾU CỦA CẢ MỘT CA — để thầy gửi Zalo hàng loạt thay vì mở từng em.
    // Chỉ trả DANH SÁCH MÃ, không trả nội dung phiếu: gói phiếu nặng vài MB
    // mỗi cái, kéo cả ca về là nghẹn mà thầy cũng không cần.
    const loiPC = kiemTraMaBiMat_(body)
    if (loiPC) return jsonResponse_({ ok: false, error: loiPC })
    const maCaPC = String(body.maCa || '').trim()
    if (!maCaPC) return jsonResponse_({ ok: false, error: 'Thiếu mã ca' })
    const shPC = getSheet_(SHEET_PHIEU, PHIEU_HEADERS)
    boSungTieuDe_(shPC, PHIEU_HEADERS)
    const dataPC = shPC.getDataRange().getValues()
    const itemsPC = []
    for (let i = 1; i < dataPC.length; i++) {
      if (String(dataPC[i][1]) !== maCaPC) continue
      itemsPC.push({
        ma: String(dataPC[i][0]),
        sbd: String(dataPC[i][2]),
        hoTen: String(dataPC[i][3]),
        taoLuc: dataPC[i][5] ? String(dataPC[i][5]) : '',
        soLanXem: Number(dataPC[i][6]) || 0,
        xemLanCuoi: dataPC[i][7] ? String(dataPC[i][7]) : '',
        loai: String(dataPC[i][8] || '') === 'baitap' ? 'baitap' : 'ketqua',
      })
    }
    // Mới nhất trước: thầy tạo lại phiếu cho một em thì bản mới đứng trên.
    itemsPC.sort(function (a, b) { return msCua_(b.taoLuc) - msCua_(a.taoLuc) })
    return jsonResponse_({ ok: true, items: itemsPC, serverNow: Date.now() })
  }

  if (action === 'phieuCuaEm') {
    // LINK XEM ĐIỂM `/d/<mã ca>` — thầy báo 07/09.
    //
    // VÌ SAO: link vào thi `/t/<mã ca>` sau khi nộp là đường cụt. Máy chủ chặn
    // vào lại, còn màn làm bài chỉ mở lại được điểm khi CHÍNH MÁY đó còn giữ
    // bài; `lichSuEm` thì khoá theo id thiết bị của lượt đã nộp nên em đổi máy
    // không lấy lại được gì.
    //
    // Trả về ĐỦ THỨ để máy em dựng lại nguyên màn "Đã nộp bài": bài làm của
    // chính em, ngân hàng CÓ đáp án của ca, và mã phiếu. Không dựng màn điểm
    // thứ hai — đúng màn em thấy lúc vừa nộp.
    //
    // CỔNG: số báo danh phải CÓ TRONG DANH SÁCH LỚP và phải có lượt ĐÃ NỘP của
    // đúng ca này. Thầy chốt 07/09: chỉ hỏi số báo danh, không hỏi thêm họ tên
    // và năm sinh nữa — em nhập ba ô trên điện thoại sai một dấu là tắc.
    // Đáp án của ca đã nộp xong vốn đã công bố cho các em, nên không mở thêm gì.
    const maCaXD = String(body.maCa || '').trim()
    const sbdXD = String(body.sbd || '').trim()
    if (!maCaXD || !sbdXD) return jsonResponse_({ ok: false, lyDo: 'thieu', error: 'Thiếu mã ca hoặc số báo danh' })
    const caShXD = sheetCa_()
    const caRowXD = findRowByKey_(caShXD, 0, maCaXD)
    if (caRowXD < 0) return jsonResponse_({ ok: false, lyDo: 'khong_co_ca', error: 'Không tìm thấy ca kiểm tra — kiểm tra lại mã ca' })
    const caXD = docCa_(caShXD, caRowXD)
    if (caXD.trangThai === 'da_xoa') return jsonResponse_({ ok: false, lyDo: 'da_xoa', error: 'Ca kiểm tra này đã bị thầy xoá' })

    if (coDanhSachHocSinh_() && !timTrongDanhSachLop_(sbdXD)) {
      return jsonResponse_({ ok: false, lyDo: 'khong_trong_danh_sach', error: 'Số báo danh không có trong danh sách lớp' })
    }

    const luotXD = luotMoiNhatTheoSbd_(sheetLuot_(), maCaXD)[sbdXD] || null
    if (!luotXD || (luotXD.trangThai !== 'da_nop' && luotXD.trangThai !== 'khoa')) {
      return jsonResponse_({ ok: false, lyDo: 'chua_nop', error: 'Em chưa nộp bài ca này' })
    }

    const shXD = getSheet_(SHEET_PHIEU, PHIEU_HEADERS)
    boSungTieuDe_(shXD, PHIEU_HEADERS)
    const dXD = shXD.getDataRange().getValues()
    // Một em có thể mang NHIỀU mã phiếu cùng loại (dựng hàng loạt một lần, mở
    // hồ sơ riêng dựng thêm một lần). Lấy mã MỚI NHẤT theo cột TaoLuc.
    let maKQ = '', lucKQ = '', maBT = '', lucBT = ''
    for (let i = 1; i < dXD.length; i++) {
      if (String(dXD[i][1]) !== maCaXD || String(dXD[i][2]) !== sbdXD) continue
      const maD = String(dXD[i][0])
      const lucD = dXD[i][5] ? String(dXD[i][5]) : ''
      if (String(dXD[i][8] || 'ketqua') === 'baitap') {
        if (!maBT || lucD > lucBT) { maBT = maD; lucBT = lucD }
      } else {
        if (!maKQ || lucD > lucKQ) { maKQ = maD; lucKQ = lucD }
      }
    }

    if (!caXD.keyBankRef) {
      return jsonResponse_({ ok: false, lyDo: 'chua_cong_bo', error: 'Ca này chưa công bố đáp án — hỏi Thầy' })
    }

    const hsXD = hoSoHocSinh_(sbdXD)
    return jsonResponse_({
      ok: true,
      ma: maKQ,
      maBaiTap: maBT,
      tong: luotXD.tong,
      hoTen: luotXD.hoTen || (hsXD ? hsXD.hoTen : '') || '',
      lop: caXD.lop || (hsXD ? hsXD.lop : '') || '',
      tenCa: caXD.tenCa || '',
      thoiGianPhut: caXD.thoiGianPhut || 0,
      giuDeDoc: !!caXD.giuDeDoc,
      luot: {
        lanThu: luotXD.lanThu || 1,
        vaoLuc: luotXD.vaoLuc || '',
        nopLuc: luotXD.nopLuc || '',
        trangThai: luotXD.trangThai,
        // `docLuot_` trả ba cột nặng ở dạng CHUỖI JSON thô, không phải đối
        // tượng — phải tự đọc, nếu không máy em nhận về chuỗi rồi hỏng ngầm.
        dapAn: docJsonLon_(luotXD.dapAnJson),
        giayCau: docJsonLon_(luotXD.giayCauJson),
        integrity: docJsonLon_(luotXD.integrityJson),
        soLanRoiMan: luotXD.soLanRoiMan || 0,
        tongGiayRoiMan: luotXD.tongGiayRoiMan || 0,
      },
      // NGÂN HÀNG CÓ ĐÁP ÁN (`keyBankRef`), KHÔNG phải `bankRef`.
      //
      // `bankRef` là bản GỬI CHO MÁY EM lúc thi — đã lược sạch đáp án, câu Phần
      // II không có trường `correct`. Trả bản đó thì máy em chấm lại là nổ
      // (`q.correct.join` trên undefined) — đo được ngay lần thử đầu 07/09.
      //
      // Thiếu `keyBankRef` (ca thầy đặt "không công bố điểm") thì trả null và
      // nói rõ, chứ không đưa bản không chấm được rồi để em nhìn màn hỏng.
      bank: caXD.keyBankRef ? gopBoTheoEm_(docJsonLon_(caXD.keyBankRef), caXD.boTheoEmRef) : null,
    })
  }

  if (action === 'layPhieu') {
    const sh = getSheet_(SHEET_PHIEU, PHIEU_HEADERS)
    const ma = String(body.ma || '').trim()
    // Mã sai định dạng thì trả về ĐÚNG câu như mã không tồn tại — không để ai
    // dò được định dạng mã qua thông điệp lỗi.
    if (!/^[A-Za-z0-9_-]{8,40}$/.test(ma)) return jsonResponse_({ ok: false, error: 'Không tìm thấy phiếu' })
    const row = findRowByKey_(sh, 0, ma)
    if (row < 0) return jsonResponse_({ ok: false, error: 'Không tìm thấy phiếu' })
    const phieu = docJsonLon_(sh.getRange(row, 5).getValue())
    // Đếm lượt xem để thầy biết phụ huynh đã mở chưa. Ghi hỏng không được chặn
    // việc trả phiếu — phụ huynh đang đứng chờ.
    try {
      sh.getRange(row, 7).setValue((Number(sh.getRange(row, 7).getValue()) || 0) + 1)
      sh.getRange(row, 8).setValue(new Date().toISOString())
    } catch (err) {}
    return jsonResponse_({ ok: true, phieu: phieu })
  }

  // -------------------------------------------------- NỘP PHIẾU KHẮC PHỤC
  //
  // LỆNH GHI CÔNG KHAI thứ hai (sau `guiCauHoi`). Em chỉ có cái link, không có
  // mã bí mật, nên không thể đòi mã. Ba khoá thay cho mã:
  //
  //   1. `ma` phải là phiếu CÓ THẬT và đúng loại `baitap`. Phiếu kết quả gửi
  //      phụ huynh không nộp được.
  //   2. `sbd` phải khớp đúng SBD của phiếu đó. Không ai nộp hộ người khác, và
  //      không ai nộp khống cho một SBD bất kỳ.
  //   3. MÁY CHỦ TỰ CHẤM LẠI từ đáp án cất trong chính phiếu. Con số máy em
  //      gửi lên không được tin — máy em sửa được.
  //
  // Sai khoá nào cũng trả CÙNG MỘT CÂU, không nói sai ở đâu.
  if (action === 'ghiPhieuKhacPhuc') {
    // MÁY EM GHI GÓI CÂU KHẮC PHỤC VỪA NHẬN, để nộp được ngay sau khi thi.
    //
    // VÌ SAO PHẢI CÓ LỆNH NÀY (thầy bắt được 08/09: "ca thi mới tôi bấm tạo đề
    // khắc phục ngay sau lúc thi vẫn không có thanh nộp"):
    //
    // Báo cáo em xem NGAY SAU KHI NỘP do chính máy em dựng tại chỗ, không phải
    // phiếu thầy cất trên máy chủ. Nó không có mã phiếu, mà `nopKhacPhuc` chấm
    // theo mã — nên đúng chỗ em hay bấm nhất lại là chỗ không nộp được. Phiếu
    // thầy dựng sau buổi thì có mã, và đó là lý do sau khi đồng bộ thì phiếu cũ
    // nộp được còn ca mới vừa thi xong thì không.
    //
    // CỔNG: đúng cái cổng của `cauKhacPhuc` — phải là một lượt CÓ THẬT của
    // chính em đó trong ca đó, đúng máy đã thi. Không có mã bí mật ở máy em.
    //
    // ĐÁNH ĐỔI, ghi thẳng: đáp án trong gói do máy em gửi lên, máy chủ không
    // đối chiếu lại với kho. Ai sửa gói có thể tự cho mình "đúng hết". Chấp
    // nhận vì (1) đây là bài TỰ LUYỆN ở nhà, không tính điểm, không xếp hạng;
    // (2) đáp án vốn đã nằm trong chính tệp phiếu trên máy em. Đổi lấy: máy chủ
    // không phải dựng lại cách chuẩn hoá đáp án lần thứ hai — hai cách chuẩn
    // hoá lệch nhau là chấm sai cho MỌI em, tệ hơn hẳn.
    const LOI_GP = { ok: false, error: 'Không ghi được phiếu khắc phục' }
    const maCaGP = String(body.maCa || '').trim()
    const sbdGP = String(body.sbd || '').trim()
    const idTbGP = String(body.idThietBi || '').trim()
    if (!maCaGP || !sbdGP || !idTbGP) return jsonResponse_(LOI_GP)

    const shLGP = sheetLuot_()
    const nLGP = shLGP.getLastRow()
    if (nLGP < 2) return jsonResponse_(LOI_GP)
    if (!quaCongLuot_(shLGP.getRange(1, 1, nLGP, 8).getValues(), maCaGP, sbdGP, idTbGP)) return jsonResponse_(LOI_GP)

    const dsCauGP = Object.prototype.toString.call(body.cau) === '[object Array]' ? body.cau : []
    if (dsCauGP.length === 0 || dsCauGP.length > TOI_DA_CAU_NOPKP) return jsonResponse_(LOI_GP)

    const shPGP = getSheet_(SHEET_PHIEU, PHIEU_HEADERS)
    boSungTieuDe_(shPGP, PHIEU_HEADERS)
    // DÙNG LẠI MÃ CŨ của chính em trong ca này nếu có: mỗi em một link bài tập,
    // không đẻ thêm mã mỗi lần em mở lại báo cáo. Thầy dựng phiếu cả ca sau đó
    // cũng ghi đè lên đúng mã này.
    const dataGP = shPGP.getDataRange().getValues()
    let maGP = ''
    let dongGP = -1
    for (let i = 1; i < dataGP.length; i++) {
      if (String(dataGP[i][1]) === maCaGP && String(dataGP[i][2]).trim() === sbdGP && String(dataGP[i][8] || '') === 'baitap') {
        maGP = String(dataGP[i][0])
        dongGP = i + 1
        break
      }
    }
    if (!maGP) maGP = sinhToken_()

    const goiGP = {
      v: 1,
      loai: 'baitap',
      tt: {
        hoTen: String(body.hoTen || '') || ('SBD ' + sbdGP),
        sbd: sbdGP,
        ngay: new Date().toISOString(),
        tenChuyenDe: String(body.tenChuyenDe || 'Hoá học'),
        ketQua: '',
        hienDapAn: false,
        nhanBia: 'Câu khắc phục lỗi sai',
      },
      cau: dsCauGP,
    }
    const lucGP = new Date().toISOString()
    try {
      if (dongGP > 0) {
        const refCu = shPGP.getRange(dongGP, 5).getValue()
        shPGP.getRange(dongGP, 5).setValue(luuJsonLon_('phieu_' + maGP, goiGP, refCu))
        shPGP.getRange(dongGP, 6).setValue(lucGP)
      } else {
        shPGP.appendRow([maGP, maCaGP, sbdGP, goiGP.tt.hoTen, luuJsonLon_('phieu_' + maGP, goiGP, ''), lucGP, 0, '', 'baitap'])
      }
    } catch (errGP) {
      return jsonResponse_(LOI_GP)
    }
    return jsonResponse_({ ok: true, ma: maGP, soCau: dsCauGP.length, serverNow: Date.now() })
  }

  if (action === 'nopKhacPhuc') {
    const LOI_NOP = { ok: false, error: 'Không nộp được bài' }
    const maNop = String(body.ma || '').trim()
    const sbdNop = String(body.sbd || '').trim()
    if (!/^[A-Za-z0-9_-]{8,40}$/.test(maNop) || !sbdNop) return jsonResponse_(LOI_NOP)

    const shPhieu = getSheet_(SHEET_PHIEU, PHIEU_HEADERS)
    boSungTieuDe_(shPhieu, PHIEU_HEADERS)
    const dongPhieu = findRowByKey_(shPhieu, 0, maNop)
    if (dongPhieu < 0) return jsonResponse_(LOI_NOP)
    // KHOÁ 1 + 2 — đúng loại, đúng em.
    if (String(shPhieu.getRange(dongPhieu, 9).getValue() || '') !== 'baitap') return jsonResponse_(LOI_NOP)
    if (String(shPhieu.getRange(dongPhieu, 3).getValue() || '').trim() !== sbdNop) return jsonResponse_(LOI_NOP)
    const maCaNop = String(shPhieu.getRange(dongPhieu, 2).getValue() || '').trim()

    let goi = null
    try {
      goi = docJsonLon_(shPhieu.getRange(dongPhieu, 5).getValue())
    } catch (err) {
      return jsonResponse_(LOI_NOP)
    }
    const dsCau = goi && Array.isArray(goi.cau) ? goi.cau : []
    if (!dsCau.length || dsCau.length > TOI_DA_CAU_NOPKP) return jsonResponse_(LOI_NOP)

    const daChon = body.dapAn && typeof body.dapAn === 'object' ? body.dapAn : {}

    // CHẤM ĐÚNG NHỮNG CÂU EM ĐƯỢC PHÁT, không phải cả gói 40 câu cất trên máy
    // chủ.
    //
    // Vì sao: khối câu khắc phục trong báo cáo cho phụ huynh KÉO SỐ CÂU và lọc
    // dạng, nên bộ em làm là một tập con của gói. Chấm cả gói thì mấy chục câu
    // em không được phát đều thành câu sai — báo về "đúng 7/40" trong khi em
    // làm 10 câu.
    //
    // Máy em gửi lên ĐỦ qid nó đã phát, ô nào chưa làm gửi chuỗi rỗng; nên "bỏ
    // trống tính là sai" vẫn giữ. qid lạ bị bỏ IM LẶNG: đáp án vẫn lấy từ gói
    // trên máy chủ, không ai chấm được câu không có trong phiếu của mình.
    const dsGui = {}
    let soGui = 0
    for (const k in daChon) {
      if (!Object.prototype.hasOwnProperty.call(daChon, k)) continue
      dsGui[String(k).trim()] = true
      soGui += 1
    }
    if (soGui === 0 || soGui > TOI_DA_CAU_NOPKP) return jsonResponse_(LOI_NOP)

    // KHOÁ 3 — CHẤM LẠI TẠI MÁY CHỦ. Ba phần ba luật, giống hệt
    // `taoChiTietCau` ở máy thầy để hai nơi không ra hai kết quả.
    const chuanIII = function (v) {
      return String(v == null ? '' : v).trim().replace(',', '.')
    }
    let soDung = 0
    let soCham = 0
    const qidSai = []
    const dapAnSach = {}
    for (let i = 0; i < dsCau.length; i++) {
      const c = dsCau[i]
      const qid = String(c.id || '').trim()
      if (!qid || !dsGui[qid]) continue
      soCham += 1
      const chon = String(daChon[qid] == null ? '' : daChon[qid]).trim().slice(0, 40)
      dapAnSach[qid] = chon
      const dung = String(c.dapAn == null ? '' : c.dapAn).trim()
      let khop = false
      if (!chon) khop = false
      else if (c.phan === 'III') khop = chuanIII(chon) === chuanIII(dung)
      else khop = chon.toUpperCase() === dung.toUpperCase()
      if (khop) soDung += 1
      else qidSai.push(qid)
    }
    // Không câu nào gửi lên khớp gói trên máy chủ ⇒ bài này không phải của
    // phiếu ấy. Ghi vào là ghi một dòng 0/0 vô nghĩa.
    if (soCham === 0) return jsonResponse_(LOI_NOP)

    const shNop = getSheet_(SHEET_NOPKP, NOPKP_HEADERS)
    boSungTieuDe_(shNop, NOPKP_HEADERS)
    const nayNop = new Date().toISOString()
    const lockNop = LockService.getScriptLock()
    let soLanNop = 1
    try {
      lockNop.waitLock(10000)
      // LƯỢT MỚI, KHÔNG ĐÈ. Đếm lượt cũ của đúng cặp (ma, sbd).
      const nNop = shNop.getLastRow()
      if (nNop >= 2) {
        const cotNop = shNop.getRange(1, 1, nNop, 4).getValues()
        for (let j = 1; j < cotNop.length; j++) {
          if (String(cotNop[j][0]) === maNop && String(cotNop[j][2]) === sbdNop) soLanNop += 1
        }
      }
      shNop.appendRow([maNop, maCaNop, sbdNop, soLanNop, nayNop, soCham, soDung, JSON.stringify(dapAnSach), JSON.stringify(qidSai)])
    } catch (err) {
      return jsonResponse_(LOI_NOP)
    } finally {
      try { lockNop.releaseLock() } catch (e2) {}
    }
    // Trả con số MÁY CHỦ tính, để trang phiếu hiện đúng cái đã được ghi.
    return jsonResponse_({ ok: true, lanThu: soLanNop, soCau: soCham, soDung: soDung, qidSai: qidSai, nopLuc: nayNop })
  }

  // ĐỌC LƯỢT NỘP KHẮC PHỤC CỦA MỘT CA — cần mã bí mật, chỉ thầy đọc.
  if (action === 'nopKhacPhucTheoCa') {
    // `kiemTraMaBiMat_` trả CHUỖI lỗi (rỗng là đạt), không phải một phản hồi.
    // Trả thẳng chuỗi ra khỏi doPost là Apps Script dựng phản hồi hỏng và trình
    // duyệt báo "Failed to fetch" — đúng lỗi tôi vừa dính lúc kiểm bản 54.
    const kt = kiemTraMaBiMat_(body)
    if (kt) return jsonResponse_({ ok: false, error: kt })
    const maCaKP = String(body.maCa || '').trim()
    if (!maCaKP) return jsonResponse_({ ok: false, error: 'Thiếu mã ca' })
    const shKP = getSheet_(SHEET_NOPKP, NOPKP_HEADERS)
    boSungTieuDe_(shKP, NOPKP_HEADERS)
    const dataKP = shKP.getDataRange().getValues()
    const itemsKP = []
    for (let i = 1; i < dataKP.length; i++) {
      if (String(dataKP[i][1]) !== maCaKP) continue
      itemsKP.push({
        ma: String(dataKP[i][0]),
        sbd: String(dataKP[i][2]),
        lanThu: Number(dataKP[i][3]) || 0,
        nopLuc: dataKP[i][4] ? String(dataKP[i][4]) : '',
        soCau: Number(dataKP[i][5]) || 0,
        soDung: Number(dataKP[i][6]) || 0,
        qidSai: (function (v) {
          try {
            const x = JSON.parse(String(v || '[]'))
            return Array.isArray(x) ? x : []
          } catch (err) {
            return []
          }
        })(dataKP[i][8]),
      })
    }
    itemsKP.sort(function (a, b) { return a.lanThu - b.lanThu })
    return jsonResponse_({ ok: true, items: itemsKP, serverNow: Date.now() })
  }

  // ------------------------------------------------------------- HỎI BÀI THẦY
  //
  // `guiCauHoi` là LỆNH GHI CÔNG KHAI ĐẦU TIÊN của cả hệ thống. Trước nay chỉ
  // có một lệnh đọc công khai (`layPhieu`) và nó đã bị bó rất chặt. Lệnh ghi
  // nguy hiểm hơn, nên BỐN KHOÁ (HOIBAITHAY.md mục 2.3):
  //
  //   1. Phải có lượt thi ĐÃ NỘP đúng cặp (maCa, sbd). Không có thì từ chối —
  //      nhờ vậy không ai gửi khống cho một SBD bất kỳ, và không gửi được vào
  //      ca chưa thi.
  //   2. `qids` phải nằm trong bộ câu CHÍNH EM ĐÓ ĐÃ LÀM (đọc ChiTietCau).
  //      Mã lạ bị loại IM LẶNG. Đọc ChiTietCau thay vì mở đề trong Drive: chặt
  //      hơn (em chỉ hỏi được câu của mình) và nhanh hơn hẳn.
  //   3. `ghiChu` cắt cứng ở TOI_DA_GHI_CHU.
  //   4. Ghi đè theo (maCa, sbd) — spam bao nhiêu lần cũng chỉ một dòng.
  //
  // Sai bất kỳ khoá nào đều trả CÙNG MỘT CÂU, không nói sai ở đâu.
  if (action === 'guiCauHoi') {
    const LOI_CHUNG = { ok: false, error: 'Không gửi được câu hỏi' }
    const maCa = String(body.maCa || '').trim()
    const sbd = String(body.sbd || '').trim()
    if (!maCa || !sbd) return jsonResponse_(LOI_CHUNG)

    let xin = []
    try {
      xin = Array.isArray(body.qids) ? body.qids : []
    } catch (err) {
      xin = []
    }
    if (xin.length > TOI_DA_CAU_HOI) return jsonResponse_(LOI_CHUNG)

    // KHOÁ 1 — phải có lượt ĐÃ NỘP đúng cặp này.
    const luotSh = sheetLuot_()
    const luots = luotMoiNhatTheoSbd_(luotSh, maCa, true)
    const luot = luots[sbd]
    if (!luot || (luot.trangThai !== 'da_nop' && luot.trangThai !== 'khoa')) return jsonResponse_(LOI_CHUNG)

    // KHOÁ 2 — chỉ nhận qid em đó đã thật sự làm trong ca này.
    const ctSh = getSheet_(SHEET_CHITIET, CHITIET_HEADERS)
    const hopLe = {}
    const nCt = ctSh.getLastRow()
    if (nCt >= 2) {
      // Ba cột thôi (MaCa, SBD, ... Qid) — đọc cả bảng ChiTietCau là rất nặng.
      const cot = ctSh.getRange(1, 1, nCt, 6).getValues()
      for (let i = 1; i < cot.length; i++) {
        if (String(cot[i][0]) !== maCa || String(cot[i][1]) !== sbd) continue
        const q = String(cot[i][5] || '').trim()
        if (q) hopLe[q] = true
      }
    }
    const qids = []
    const daCo = {}
    for (let i = 0; i < xin.length; i++) {
      const q = String(xin[i] || '').trim()
      if (!q || daCo[q] || !hopLe[q]) continue
      daCo[q] = true
      qids.push(q)
    }
    if (!qids.length) return jsonResponse_(LOI_CHUNG)

    // KHOÁ 3 — cắt ghi chú.
    const ghiChu = String(body.ghiChu || '').slice(0, TOI_DA_GHI_CHU)

    // KHOÁ 4 — ghi đè theo (maCa, sbd).
    const sh = getSheet_(SHEET_CAUHOI, CAUHOI_HEADERS)
    boSungTieuDe_(sh, CAUHOI_HEADERS)
    const ma = maCa + '|' + sbd
    const nay = new Date().toISOString()
    const row = findRowByKey_(sh, 0, ma)
    const dong = [ma, maCa, sbd, luot.hoTen || '', JSON.stringify(qids), ghiChu, nay, '', '']
    const lock = LockService.getScriptLock()
    try {
      lock.waitLock(10000)
      const lai = findRowByKey_(sh, 0, ma)
      if (lai > 0) sh.getRange(lai, 1, 1, dong.length).setValues([dong])
      else sh.appendRow(dong)
    } catch (err) {
      return jsonResponse_(LOI_CHUNG)
    } finally {
      try { lock.releaseLock() } catch (e2) {}
    }
    return jsonResponse_({ ok: true, soCau: qids.length, guiLuc: nay, ghiDe: row > 0 })
  }

  // ------------------------------------------------- LỊCH SỬ ĐIỂM CỦA MỘT EM
  //
  // Báo cáo sau thi của em cần đường tiến bộ. Thầy chốt 06/09: phải lấy từ MÁY
  // CHỦ, vì em đổi máy là mất sạch lịch sử nếu chỉ đọc trong máy.
  //
  // ĐÂY LÀ LỆNH ĐỌC CÔNG KHAI, không có mã bí mật (máy em không bao giờ có mã
  // đó). Đọc theo SỐ BÁO DANH TRẦN thì ai biết số báo danh cũng đọc được cả
  // quá trình học của em — mà số báo danh nằm ngay trên danh sách lớp. Nên
  // khoá HAI LỚP, cả hai đều phải qua:
  //
  //   1. Phải có LƯỢT ĐÃ NỘP đúng cặp (maCa, sbd) — như khoá 1 của guiCauHoi.
  //   2. `idThietBi` phải khớp lượt đó. Mã thiết bị sinh riêng từng máy và nằm
  //      trong máy, nên chỉ CHÍNH CÁI MÁY vừa ngồi thi mới đọc được.
  //
  // Vì sao khoá 2 vẫn cho em đổi máy: em thi ca kế tiếp trên máy mới thì mỏ
  // neo chính là lượt vừa nộp trên máy mới đó, còn lịch sử trả về vẫn đủ mọi
  // ca cũ. Đổi máy không mất gì; lấy trộm bằng số báo danh thì không qua được.
  //
  // Trả về ĐÚNG những gì vẽ được đường tiến bộ: mã ca, tên ca, ngày, điểm.
  // KHÔNG trả họ tên, không trả số điện thoại, không trả bài làm.
  if (action === 'lichSuEm') {
    const LOI_LS = { ok: false, error: 'Không xem được lịch sử' }
    const maCa = String(body.maCa || '').trim()
    const sbd = String(body.sbd || '').trim()
    const idTb = String(body.idThietBi || '').trim()
    if (!maCa || !sbd || !idTb) return jsonResponse_(LOI_LS)

    const sh = sheetLuot_()
    const n = sh.getLastRow()
    if (n < 2) return jsonResponse_(LOI_LS)
    // Hai dải hẹp: MaCa..TrangThai và cột Tong. Đọc cả bảng LuotThi là kéo
    // theo ba cột JSON nặng, mỗi ô tới 50.000 ký tự.
    const A = sh.getRange(1, 1, n, 8).getValues()
    const T = sh.getRange(1, 17, n, 1).getValues()

    if (!quaCongLuot_(A, maCa, sbd, idTb)) return jsonResponse_(LOI_LS)

    // Tên ca: hai cột hẹp của CaKiemTra, không mở từng dòng bằng docCa_.
    const caSh = sheetCa_()
    const nCa = caSh.getLastRow()
    const tenCua = {}
    if (nCa >= 2) {
      const cMa = caSh.getRange(1, 1, nCa, 1).getValues()
      const cTen = caSh.getRange(1, 11, nCa, 1).getValues()
      for (let i = 1; i < cMa.length; i++) tenCua[String(cMa[i][0])] = String(cTen[i][0] || '')
    }

    // MỘT CA MỘT DÒNG: em thi lại thì lấy lượt NỘP SAU CÙNG, đúng con số thầy
    // nhìn thấy ở bảng điểm.
    const theoCa = {}
    for (let i = 1; i < A.length; i++) {
      if (String(A[i][1]) !== sbd) continue
      const tt = String(A[i][7])
      if (tt !== 'da_nop' && tt !== 'khoa') continue
      // Ô ĐIỂM RỖNG KHÔNG PHẢI ĐIỂM 0. `Number('')` ra 0 và lọt qua isFinite,
      // nên lượt chưa chấm sẽ vẽ thành một chấm 0 điểm trên đường tiến bộ —
      // em nhìn tưởng mình tụt hạng. Phải chặn ngay ở ô rỗng.
      const oTong = T[i][0]
      if (oTong === '' || oTong === null || oTong === undefined) continue
      const tong = Number(oTong)
      if (!isFinite(tong)) continue
      const mc = String(A[i][0])
      const nop = A[i][6] ? String(A[i][6]) : ''
      const cu = theoCa[mc]
      if (cu && String(cu.ngay) >= nop) continue
      theoCa[mc] = { maCa: mc, tenCa: tenCua[mc] || '', ngay: nop, tong: tong }
    }

    const ds = []
    for (const k in theoCa) ds.push(theoCa[k])
    ds.sort(function (a, b) { return String(a.ngay).localeCompare(String(b.ngay)) })
    // Trần số ca: đường tiến bộ vẽ được chừng này là quá đủ, và gói trả về
    // không phình theo số năm em học.
    const TRAN = 40
    return jsonResponse_({ ok: true, items: ds.slice(-TRAN) })
  }

  // CÂU KHẮC PHỤC RÚT TỪ KHO ĐỀ (xem khối ghi chú ở `chiMucCau_`).
  if (action === 'cauKhacPhuc') {
    const LOI_KP = { ok: false, error: 'Không lấy được câu khắc phục' }
    const maCa = String(body.maCa || '').trim()
    const sbd = String(body.sbd || '').trim()
    const idTb = String(body.idThietBi || '').trim()
    if (!maCa || !sbd || !idTb) return jsonResponse_(LOI_KP)

    const shL = sheetLuot_()
    const nL = shL.getLastRow()
    if (nL < 2) return jsonResponse_(LOI_KP)
    if (!quaCongLuot_(shL.getRange(1, 1, nL, 8).getValues(), maCa, sbd, idTb)) return jsonResponse_(LOI_KP)

    const chuyenDe = Array.isArray(body.chuyenDe) ? body.chuyenDe.slice(0, 30) : []
    if (chuyenDe.length === 0) return jsonResponse_({ ok: true, soCau: 0, items: [], ghiChu: 'Không có chuyên đề nào để rút' })
    const loaiTru = Array.isArray(body.loaiTru) ? body.loaiTru.slice(0, 400) : []
    let soCau = Number(body.soCau)
    if (!isFinite(soCau) || soCau < 1) soCau = TRAN_CAU_KHAC_PHUC
    soCau = Math.min(Math.floor(soCau), TRAN_CAU_KHAC_PHUC)

    const chiMuc = chiMucCau_(false)
    const chon = chonCauKhacPhuc_(chiMuc, chuyenDe, loaiTru, soCau)
    if (chon.length === 0) return jsonResponse_({ ok: true, soCau: 0, items: [], ghiChu: 'Kho chưa có câu nào ngoài những câu em vừa làm' })

    // Gom theo đề rồi mới mở file: mỗi đề mở ĐÚNG MỘT LẦN.
    const canCua = {}
    const thuTuDe = []
    for (let i = 0; i < chon.length; i++) {
      if (!canCua[chon[i].d]) {
        canCua[chon[i].d] = {}
        thuTuDe.push(chon[i].d)
      }
      canCua[chon[i].d][chon[i].p + '-' + chon[i].s] = true
    }
    // THỨ TỰ ĐÃ CHỌN, gửi kèm để máy em xếp lại cho đúng.
    //
    // Gói trả về gom theo đề, mà trong một đề thì câu nằm theo thứ tự của file
    // gốc — không phải thứ tự dễ lên khó vừa xếp. Không gửi cái này thì màn
    // báo cáo hứa "xếp từ dễ lên khó" mà em mở ra thấy câu vận dụng nằm đầu.
    const thuTu = []
    for (let i = 0; i < chon.length; i++) thuTu.push(chon[i].qid)
    const shDe = getSheet_(SHEET_DE, DE_HEADERS)
    const items = []
    let byte = 0
    let daCat = false
    let soRa = 0
    // KHÔNG cắt theo TRAN_DE_MO ở đây nữa: `chonCauKhacPhuc_` đã chốt danh
    // sách đề, cắt lần thứ hai là vứt bớt đúng số câu vừa chọn.
    for (let i = 0; i < thuTuDe.length && !daCat; i++) {
      const maDe = thuTuDe[i]
      const row = findRowByKey_(shDe, 0, maDe)
      if (row < 0) continue
      let de = null
      try {
        de = docJsonLon_(shDe.getRange(row, 6, 1, 1).getValues()[0][0])
      } catch (err) {
        continue
      }
      if (!de || !de.cau) continue
      // Nhặt ra rồi XẾP LẠI theo thứ tự đã chọn, không giữ thứ tự file gốc:
      // gói trả về tự nó cũng phải đọc được từ dễ lên khó.
      const co = {}
      for (let k = 0; k < de.cau.length; k++) {
        const c = de.cau[k]
        if (canCua[maDe][String(c.phan) + '-' + Number(c.so)]) co[String(c.phan) + '-' + Number(c.so)] = c
      }
      const lay = []
      for (let k = 0; k < chon.length; k++) {
        if (chon[k].d !== maDe) continue
        const c = co[chon[k].p + '-' + chon[k].s]
        if (!c) continue
        const nang = JSON.stringify(c).length
        // Cắt theo DUNG LƯỢNG chứ không theo số câu: 60 câu toàn ảnh là gói
        // vài chục MB, máy em tải giữa buổi học là treo.
        if (byte + nang > TRAN_BYTE_KHAC_PHUC) {
          daCat = true
          break
        }
        byte += nang
        lay.push(c)
        soRa++
      }
      if (lay.length > 0) items.push({ ma_de: maDe, nguon: String(de.nguon || ''), nhom: String(de.nhom || ''), cau: lay })
    }
    return jsonResponse_({ ok: true, soCau: soRa, soChon: chon.length, items: items, thuTu: thuTu, catBotViNang: daCat })
  }

  // Dựng lại CHỈ MỤC CÂU của kho đề. Máy thầy gọi sau khi đẩy đề mới, để em
  // đầu tiên bấm "tạo câu khắc phục" không phải chờ máy chủ mở cả kho.
  if (action === 'dungChiMuc') {
    const loiCM = kiemTraMaBiMat_(body)
    if (loiCM) return jsonResponse_({ ok: false, error: loiCM })
    const cm = chiMucCau_(true)
    return jsonResponse_({ ok: true, soCau: cm.cau.length, luc: cm.luc })
  }

  if (action === 'danhSachCauHoi') {
    const loi = kiemTraMaBiMat_(body)
    if (loi) return jsonResponse_({ ok: false, error: loi })
    const maCa = String(body.maCa || '').trim()
    // `thungRac: true` = CHỈ những ca đã xoá. Mặc định = chỉ ca chưa xoá.
    // Hai lối nhìn tách hẳn nhau, không trộn rồi để màn tự lọc: trộn thì mỗi
    // lần thầy mở màn lại kéo về cả đống dòng đã bỏ.
    const thungRac = body.thungRac === true
    const sh = getSheet_(SHEET_CAUHOI, CAUHOI_HEADERS)
    boSungTieuDe_(sh, CAUHOI_HEADERS)
    const n = sh.getLastRow()
    const items = []
    // TÊN CA đi kèm để màn "Học sinh hỏi" gom theo ca mà không phải gọi thêm
    // một lệnh danhSachCa nữa. Hai cột hẹp, không mở từng dòng bằng docCa_.
    const tenCua = {}
    const caSh = sheetCa_()
    const nCa = caSh.getLastRow()
    if (nCa >= 2) {
      const cMa = caSh.getRange(1, 1, nCa, 1).getValues()
      const cTen = caSh.getRange(1, 11, nCa, 1).getValues()
      for (let i = 1; i < cMa.length; i++) tenCua[String(cMa[i][0])] = String(cTen[i][0] || '')
    }
    if (n >= 2) {
      const data = sh.getRange(1, 1, n, CAUHOI_HEADERS.length).getValues()
      for (let i = 1; i < data.length; i++) {
        if (maCa && String(data[i][1]) !== maCa) continue
        const xoa = String(data[i][9] || '')
        if (thungRac ? !xoa : !!xoa) continue
        let qids = []
        try { qids = JSON.parse(data[i][4] || '[]') } catch (err) { qids = [] }
        items.push({
          maCa: String(data[i][1]),
          tenCa: tenCua[String(data[i][1])] || '',
          sbd: String(data[i][2]),
          hoTen: String(data[i][3] || ''),
          qids: qids,
          ghiChu: String(data[i][5] || ''),
          guiLuc: data[i][6] ? String(data[i][6]) : '',
          daChua: String(data[i][7] || '') === 'x',
          chuaLuc: data[i][8] ? String(data[i][8]) : '',
          xoa: xoa,
        })
      }
    }
    return jsonResponse_({ ok: true, items: items })
  }

  // THÙNG RÁC CÂU HỎI — thầy chốt 06/09.
  //
  // Xoá là ĐÁNH DẤU cột `Xoa`, KHÔNG xoá dòng: bấm nhầm còn khôi phục được, và
  // câu hỏi là thứ em đã chủ động gửi đi, không nên bốc hơi vì một cú chạm.
  // Nhận nhiều mã ca một lượt để thầy tích rồi xoá hàng loạt.
  if (action === 'xoaCauHoi') {
    const loi = kiemTraMaBiMat_(body)
    if (loi) return jsonResponse_({ ok: false, error: loi })
    const dsMa = Array.isArray(body.maCa) ? body.maCa : body.maCa ? [body.maCa] : []
    const tatCa = body.tatCa === true
    const khoiPhuc = body.khoiPhuc === true
    if (dsMa.length === 0 && !tatCa) return jsonResponse_({ ok: false, error: 'Chưa chọn ca nào' })
    const can = {}
    for (let i = 0; i < dsMa.length; i++) can[String(dsMa[i]).trim()] = true

    const sh = getSheet_(SHEET_CAUHOI, CAUHOI_HEADERS)
    boSungTieuDe_(sh, CAUHOI_HEADERS)
    const n = sh.getLastRow()
    if (n < 2) return jsonResponse_({ ok: true, soDong: 0, soCa: 0 })
    const cot = sh.getRange(1, 2, n, 1).getValues()
    const cotXoa = sh.getRange(1, COT_XOA_CAUHOI, n, 1).getValues()
    const nay = new Date().toISOString()
    let soDong = 0
    const caDaDung = {}
    for (let i = 1; i < cot.length; i++) {
      const ma = String(cot[i][0])
      if (!tatCa && !can[ma]) continue
      const dangXoa = !!String(cotXoa[i][0] || '')
      // Khôi phục chỉ đụng dòng ĐANG trong thùng rác, xoá chỉ đụng dòng đang
      // hiện — không thì "khôi phục tất cả" lại ghi đè mốc xoá của dòng khác.
      if (khoiPhuc ? !dangXoa : dangXoa) continue
      sh.getRange(i + 1, COT_XOA_CAUHOI).setValue(khoiPhuc ? '' : nay)
      soDong++
      caDaDung[ma] = true
    }
    return jsonResponse_({ ok: true, soDong: soDong, soCa: Object.keys(caDaDung).length, khoiPhuc: khoiPhuc })
  }

  if (action === 'danhDauDaChua') {
    const loi = kiemTraMaBiMat_(body)
    if (loi) return jsonResponse_({ ok: false, error: loi })
    const maCa = String(body.maCa || '').trim()
    if (!maCa) return jsonResponse_({ ok: false, error: 'Thiếu mã ca' })
    // Không có sbd = đánh dấu cả ca. Có sbd = đúng một em.
    const sbd = String(body.sbd || '').trim()
    const chua = body.chua !== false
    const sh = getSheet_(SHEET_CAUHOI, CAUHOI_HEADERS)
    const n = sh.getLastRow()
    if (n < 2) return jsonResponse_({ ok: true, soDong: 0 })
    const data = sh.getRange(1, 1, n, 3).getValues()
    const nay = new Date().toISOString()
    let soDong = 0
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][1]) !== maCa) continue
      if (sbd && String(data[i][2]) !== sbd) continue
      sh.getRange(i + 1, 8, 1, 2).setValues([[chua ? 'x' : '', chua ? nay : '']])
      soDong++
    }
    return jsonResponse_({ ok: true, soDong: soDong })
  }

  if (action === 'capNhatKeyBank') {
    // Thầy chốt lại đáp án / lời giải mới về máy → cập nhật bản CÓ đáp án của
    // các ca ĐÃ MỞ (KeyBankJson) để học sinh xem lại thấy bản mới. Cần MA_BI_MAT.
    // Không đụng BankJson (đề học sinh đang làm) và chế độ công bố.
    const loi = kiemTraMaBiMat_(body)
    if (loi) return jsonResponse_({ ok: false, error: loi })
    const sh = sheetCa_()
    const row = findRowByKey_(sh, 0, body.maCa)
    if (row < 0) return jsonResponse_({ ok: false, error: 'Không có ca ' + body.maCa })
    const ca = docCa_(sh, row)
    sh.getRange(row, 7).setValue(luuJsonLon_('ca_' + body.maCa + '_key', body.keyBank, ca.keyBankRef))
    return jsonResponse_({ ok: true, maCa: String(body.maCa), congBo: ca.congBo })
  }

  if (action === 'banDoSaiCa') {
    // BẢN ĐỒ SAI CỦA MẤY CA, đọc một lượt. Đây là thứ chế độ đề riêng dùng để
    // biết em sai câu nào ở ca trước và sai lần thứ mấy — không phải chấm lại
    // từng ca ở máy thầy như trước, nên máy nào cũng chạy được và không đòi
    // máy đó phải có bản đề của ca cũ.
    const loiBD2 = kiemTraMaBiMat_(body)
    if (loiBD2) return jsonResponse_({ ok: false, error: loiBD2 })
    const dsMa = Object.prototype.toString.call(body.dsMaCa) === '[object Array]' ? body.dsMaCa : []
    if (dsMa.length === 0) return jsonResponse_({ ok: true, ca: {} })
    if (dsMa.length > 20) return jsonResponse_({ ok: false, error: 'Xin quá nhiều ca một lượt' })
    return jsonResponse_({ ok: true, ca: docBanDoSai_(dsMa), serverNow: Date.now() })
  }

  if (action === 'noiKhoCa') {
    // NỐI THÊM CÂU VÀO KHO CỦA MỘT CA — chỉ dùng cho ĐỀ RIÊNG TỪNG EM.
    //
    // Thầy chốt 08/09: "bất kể là tôi chọn chuyên đề gì thi mà ca trước sai 9
    // câu phải rút đúng 3 câu đó ra vào đề mới". Câu em từng sai có thể nằm
    // ngoài kho thầy vừa rút cho ca này; muốn lặp lại nó thì phải NỐI nó vào
    // kho của ca, cả bản gửi máy em (BankJson) lẫn bản có đáp án (KeyBankJson).
    //
    // CHỈ NỐI THÊM, KHÔNG THAY THẾ: câu cũ giữ nguyên vị trí và nội dung, nên
    // em đang làm dở không bị đổi đề. Câu trùng id thì bỏ qua.
    //
    // CHẶN SAU KHI ĐÃ PHÁT ĐỀ: ca đã bấm Bắt đầu thì kho là thứ em đang cầm,
    // nối thêm vào lúc đó là hai em cùng ca nhìn hai kho khác nhau.
    const loiNK = kiemTraMaBiMat_(body)
    if (loiNK) return jsonResponse_({ ok: false, error: loiNK })
    const shNK = sheetCa_()
    const rowNK = findRowByKey_(shNK, 0, body.maCa)
    if (rowNK < 0) return jsonResponse_({ ok: false, error: 'Không có ca ' + body.maCa })
    const caNK = docCa_(shNK, rowNK)
    if (caNK.trangThai === 'da_xoa') return jsonResponse_({ ok: false, error: 'Ca này đã bị xoá' })
    if (caNK.batDauThiLuc) return jsonResponse_({ ok: false, error: 'Ca đã phát đề — không nối thêm câu được nữa' })

    const noiMot = function (goiCu, them) {
      if (!goiCu || !them) return { goi: goiCu, them: 0 }
      let dem = 0
      const phan = ['phanI', 'phanII', 'phanIII']
      for (let i = 0; i < phan.length; i++) {
        const p = phan[i]
        const cu = Object.prototype.toString.call(goiCu[p]) === '[object Array]' ? goiCu[p] : []
        const moi = Object.prototype.toString.call(them[p]) === '[object Array]' ? them[p] : []
        if (moi.length === 0) { goiCu[p] = cu; continue }
        const daCo = {}
        for (let k = 0; k < cu.length; k++) daCo[String(cu[k] && cu[k].id)] = true
        for (let k = 0; k < moi.length; k++) {
          const id = String(moi[k] && moi[k].id || '')
          if (!id || daCo[id]) continue
          cu.push(moi[k])
          daCo[id] = true
          dem += 1
        }
        goiCu[p] = cu
      }
      return { goi: goiCu, them: dem }
    }

    let themBank = 0
    let themKey = 0
    try {
      if (body.bank && caNK.bankRef) {
        const ra = noiMot(docJsonLon_(caNK.bankRef), body.bank)
        themBank = ra.them
        if (themBank > 0) shNK.getRange(rowNK, 5).setValue(luuJsonLon_('ca_' + body.maCa + '_bank', ra.goi, caNK.bankRef))
      }
      if (body.keyBank && caNK.keyBankRef) {
        const ra = noiMot(docJsonLon_(caNK.keyBankRef), body.keyBank)
        themKey = ra.them
        if (themKey > 0) shNK.getRange(rowNK, 7).setValue(luuJsonLon_('ca_' + body.maCa + '_key', ra.goi, caNK.keyBankRef))
      }
    } catch (errNK) {
      return jsonResponse_({ ok: false, error: 'Không nối được kho ca: ' + errNK })
    }
    return jsonResponse_({ ok: true, maCa: String(body.maCa), themBank: themBank, themKey: themKey })
  }

  if (action === 'publish') {
    const sh = sheetCa_()
    const row = findRowByKey_(sh, 0, body.maCa)
    // keyBank (có đáp án) CHỈ được gửi lên nếu thầy chủ động bật "xem điểm
    // ngay sau khi nộp" ở màn Soạn đề — lưu riêng cột này, KHÔNG bao giờ trả
    // về ở action "session"/"vaoThi" (chỉ trả trong response của "submit").
    const cu = row > 0 ? docCa_(sh, row) : { bankRef: '', keyBankRef: '' }
    // 3 MỐC THỜI GIAN (QUANLYCATHI mục 3): BatDau (rỗng = mở ngay, lấy giờ máy
    // chủ) · HetHanVao (rỗng = không giới hạn) · ThoiGianPhut tính từ lúc TỪNG
    // EM vào (vaoThi), không phải giờ chung.
    const batDauMs0 = body.batDau ? msCua_(body.batDau) : NaN
    const batDauMs = isFinite(batDauMs0) ? batDauMs0 : Date.now()
    const batDau = new Date(batDauMs).toISOString()
    // hanVaoPhut (số phút sau BatDau, tính theo giờ máy chủ) ưu tiên hơn hetHanVao tuyệt đối.
    const hanPhut = Number(body.hanVaoPhut) || 0
    const hetHanMs = hanPhut > 0 ? batDauMs + hanPhut * 60000 : body.hetHanVao ? msCua_(body.hetHanVao) : NaN
    const rowData = [
      body.maCa,
      body.lop,
      body.thoiGianPhut,
      new Date().toISOString(),
      luuJsonLon_('ca_' + body.maCa + '_bank', body.bank, cu.bankRef),
      // 'true' = xem điểm ngay khi nộp · 'calop' = khi cả lớp nộp xong · 'false' = không
      body.immediateFeedback === 'calop' ? 'calop' : body.immediateFeedback ? 'true' : 'false',
      body.keyBank ? luuJsonLon_('ca_' + body.maCa + '_key', body.keyBank, cu.keyBankRef) : '',
      batDau,
      isFinite(hetHanMs) ? new Date(hetHanMs).toISOString() : '',
      'mo',
      body.tenCa || '',
      body.phamVi || 'tu_do',
      // khoi: chuỗi năm sinh giữ nguyên · chon: mảng SBD → JSON. (v10 từng bọc chuỗi trong dấu nháy — đọc lại đã chịu được.)
      typeof body.danhSachMoi === 'string' ? body.danhSachMoi.trim() : body.danhSachMoi ? JSON.stringify(body.danhSachMoi) : '',
      body.nguoiTao || '',
      '',
      Number(body.nguongLan) > 0 ? Number(body.nguongLan) : NGUONG_LAN_MAC_DINH,
      Number(body.nguongGiay) > 0 ? Number(body.nguongGiay) : NGUONG_GIAY_MAC_DINH,
      String(body.loai || '') === 'baitap' ? 'baitap' : 'thi',
      body.hanNop ? new Date(msCua_(body.hanNop)).toISOString() : '',
    ]
    let dong = row
    if (row > 0) {
      sh.getRange(row, 1, 1, rowData.length).setValues([rowData])
    } else {
      sh.appendRow(rowData)
      dong = sh.getLastRow()
    }
    // NÚT GẠT "dùng ca này để gọi lên bảng" — ghi riêng ô cột 23 chứ không nối
    // vào rowData: rowData dừng ở cột 19, nối thêm là ghi đè luôn KhoaLuc /
    // KhoaBoi / MoKhoaLuc (cột 20-22) của ca mở lại cùng mã.
    const lenBang = body.lenBang === false ? 'khong' : 'co'
    const giuDeDoc = body.giuDeDoc === true ? 'co' : ''
    const anHanGiay = body.giuDeDoc === true ? Number(body.anHanGiay) || AN_HAN_GIAY_MAC_DINH : ''
    // PHÒNG CHỜ: mở lại cùng mã ca thì BatDauThiLuc về rỗng — ca mới là chờ
    // mới, không kế thừa lần bấm bắt đầu của lần trước.
    const phongCho = body.phongCho === true ? 'co' : ''
    // CHẾ ĐỘ ĐỀ RIÊNG đi cùng ca lên máy chủ, không nằm lại ở máy mở ca. Mở
    // lại cùng mã ca thì lấy theo lần mở mới, không kế thừa lần trước.
    // Ô này chở HAI thứ: có bật chế độ không, và lấy câu sai từ đâu.
    // 'co' = ca gần nhất (mặc định) · 'co3' = gộp 3 ca gần nhất.
    // Gộp vào một ô để không phải thêm cột thứ ba cho cùng một tính năng.
    const deRieng = body.deRieng === true ? (body.phamViHoiLai === 'ba_ca' ? 'co3' : 'co') : ''
    sh.getRange(dong, 23, 1, 7).setValues([[lenBang, giuDeDoc, anHanGiay, phongCho, '', '', deRieng]])
    return jsonResponse_({ ok: true, batDau: batDau, hetHanVao: rowData[8], loai: rowData[17], hanNop: rowData[18], lenBang: lenBang === 'co', giuDeDoc: giuDeDoc === 'co', anHanGiay: anHanGiay || 0, phongCho: phongCho === 'co', deRieng: deRieng.indexOf('co') === 0, serverNow: Date.now() })
  }

  if (action === 'vaoThi') {
    // MỘT SỐ BÁO DANH — MỘT LƯỢT THI MỖI CA (QUANLYCATHI mục 1) + 3 mốc thời
    // gian (mục 3). Máy chủ là nguồn giờ duy nhất: trả serverNow, vaoLuc,
    // hetGioLuc để máy em CHỈ hiển thị — đổi giờ điện thoại không kéo dài được
    // bài. Khoá script để 2 máy cùng xin vào 1 SBD không tạo 2 lượt.
    const maCa = String(body.maCa || '').trim()
    const sbd = String(body.sbd || '').trim()
    const idThietBi = String(body.idThietBi || '').trim()
    if (!maCa || !sbd) return jsonResponse_({ ok: false, lyDo: 'thieu', error: 'Thiếu mã ca hoặc số báo danh' })
    const caSh = sheetCa_()
    const caRow = findRowByKey_(caSh, 0, maCa)
    if (caRow < 0) return jsonResponse_({ ok: false, lyDo: 'khong_co_ca', error: 'Không tìm thấy ca kiểm tra — kiểm tra lại mã ca' })
    const ca = docCa_(caSh, caRow)
    // ĐỌC ĐỀ TRƯỚC KHI VÀO KHOÁ (tối ưu 05/09, trước ca thi thật).
    //
    // Bản cũ đọc file đề từ Drive KHI ĐANG GIỮ KHOÁ. Cả lớp bấm Vào thi cùng
    // lúc thì mỗi em phải chờ em trước đọc xong vài trăm kilobyte — ba mươi em
    // xếp hàng nối tiếp, em cuối chờ hàng chục giây. Mà đề chẳng liên quan gì
    // tới thứ khoá bảo vệ: khoá giữ cho dòng LuotThi khỏi tranh nhau, còn đề là
    // dữ liệu CHỈ ĐỌC và giống hệt nhau cho mọi em.
    //
    // Đọc trước, ngoài khoá: khoá chỉ còn ôm đúng phần đọc-sửa-ghi LuotThi.
    const bankGui = body.canBank ? docJsonLon_(ca.bankRef) : null
    // BẢN ĐỒ ĐỀ RIÊNG PHẢI ĐI CÙNG ĐỀ. Thiếu nó là máy em cắt 28 câu theo luật
    // hash còn máy thầy chấm theo bản đồ — hai tờ đề khác nhau, điểm sai, và
    // câu hỏi lại không có câu nào vào được đề (thầy bắt được 08/09).
    //
    // Gửi RIÊNG trường `boCuaEm` chứ không chỉ nhét vào `bankGui`: máy em có
    // thể đã cất kho đề từ lần vào trước (`canBank` false), lúc đó `bankGui`
    // là null mà bản đồ vẫn phải tới nơi.
    const boCuaEm = boCuaEm_(ca.boTheoEmRef, sbd)
    if (bankGui && boCuaEm.length > 0) {
      const chiEm = {}
      chiEm[sbd] = boCuaEm
      bankGui.boTheoEm = chiEm
    }
    const lock = LockService.getScriptLock()
    lock.waitLock(15000)
    try {
      const sh = sheetLuot_()
      const luot = luotMoiNhatTheoSbd_(sh, maCa, true)[sbd] || null
      const now = Date.now()
      // CỔNG DANH SÁCH trước mọi thứ khác: phải khớp ĐỦ BA — số báo danh, họ
      // tên, năm sinh — với một dòng trong danh sách thầy đã nạp. Chưa nạp danh
      // sách bao giờ thì không chặn ai (để trung tâm không đứng hình).
      const coDs = coDanhSachHocSinh_()
      const dong = coDs ? timTrongDanhSachLop_(sbd) : null
      let trongDs = dong
      if (coDs && dong) {
        // Dòng trong danh sách thiếu tên hoặc năm sinh thì không lấy đó làm cớ
        // chặn em — chỉ so những gì thầy đã điền.
        // XÁC NHẬN BẰNG MẮT (thầy chốt 07/09). Màn vào thi mới chỉ hỏi số báo
        // danh, rồi hiện TÊN của số báo danh đó cho em nhìn và bấm Bắt đầu.
        // Em đã nhìn đúng tên mình thì không có gì để so thêm — cổng còn lại là
        // "số báo danh phải nằm trong danh sách lớp", vốn đã kiểm ở trên.
        //
        // Cách này bắt lỗi gõ nhầm TỐT HƠN cách cũ: gõ nhầm một số là em thấy
        // ngay tên người khác, thay vì nhận một câu "thông tin không đúng"
        // không nói được sai ở đâu.
        // Phép so nằm ở `khopHoSoDanhSach_` (hàm thuần, có phép kiểm riêng).
        var kq = khopHoSoDanhSach_(body, dong)
        var tenKhop = kq.tenKhop
        var namKhop = kq.namKhop
        // KHÔNG LẶNG LẼ MỞ CỔNG: em qua được vì máy không gửi gì để so thì thầy
        // vẫn phải thấy.
        if (kq.khongGuiGi) ghiChanVao_(maCa, sbd, '', '', dong.hoTen, dong.namSinh, 'khong_gui_ten')
        if (!tenKhop || !namKhop) {
          trongDs = null
          // GIỮ LẠI BẰNG CHỨNG. Máy chủ cố ý KHÔNG nói cho em biết sai ô nào
          // (nói ra là cho phép dò tên từ số báo danh) — nhưng THẦY thì phải
          // thấy, nếu không mỗi lần em bị chặn giữa giờ là mò trong bóng tối.
          //
          // Thầy báo 07/09: hai em gõ đúng cả ba ô mà vẫn bị chặn, và không
          // còn dấu vết nào để lần. Từ nay mỗi lượt chặn ghi một dòng, màn Theo
          // dõi ca hiện thẳng em gõ gì / danh sách ghi gì.
          ghiChanVao_(maCa, sbd, body.hoTen, body.namSinh, dong.hoTen, dong.namSinh, tenKhop ? 'lech_nam_sinh' : 'lech_ho_ten')
        }
      } else if (coDs && !dong) {
        ghiChanVao_(maCa, sbd, body.hoTen, body.namSinh, '', '', 'khong_co_sbd')
      }
      // Em qua cổng mà chưa có hồ sơ thì tạo luôn, TRƯỚC khi xét phạm vi — để
      // ca lọc theo khối đọc được năm sinh vừa lấy từ danh sách.
      let hoSo = hoSoHocSinh_(sbd)
      if (!hoSo && (!coDs || trongDs)) hoSo = themEmVaoDanhSach_(sbd, ca, trongDs)
      const qd = quyetDinhVaoThi_(ca, luot, idThietBi, now, {
        sbd: sbd,
        namSinh: hoSo ? hoSo.namSinh : '',
        trongDanhSach: coDs ? !!trongDs : null,
      })
      if (!qd.ok) {
        qd.serverNow = now
        qd.thoiGianPhut = ca.thoiGianPhut
        return jsonResponse_(qd)
      }
      // PHÒNG CHỜ (thầy chốt 07/09). Em qua hết cổng nhưng thầy chưa bấm "Bắt
      // đầu thi" thì DỪNG LẠI ĐÂY:
      //   - KHÔNG tạo lượt, nên đồng hồ chưa chạy cho ai;
      //   - KHÔNG trả đề, nên đề chưa nằm trên máy em một giây nào.
      // Cả lớp nhận đề đúng một thời điểm, và em vào sớm không đọc trước được.
      // Em đã có lượt (vào rồi, thoát ra vào lại) thì KHÔNG bị đẩy về phòng
      // chờ — bài của em đang chạy dở.
      if (ca.phongCho && !ca.batDauThiLuc && !luot) {
        // GHI TÊN EM ĐANG CHỜ. Chế độ đề riêng rút bộ câu đúng lúc thầy bấm
        // Bắt đầu, nên danh sách này là thứ quyết định ai có phần.
        ghiPhongCho_(maCa, sbd, dong && dong.hoTen ? dong.hoTen : body.hoTen)
        return jsonResponse_({
          ok: true,
          cach: 'cho',
          lop: ca.lop,
          thoiGianPhut: ca.thoiGianPhut,
          tenCa: ca.tenCa || '',
          congBo: ca.congBo,
          serverNow: now,
        })
      }
      let lanThu = 1
      let vaoLuc = new Date(now).toISOString()
      // Bài tập về nhà KHÔNG đếm ngược theo phút — mốc hết giờ là HẠN NỘP của
      // bài (rỗng thì coi như không có hạn: để trống, máy em không hiện đồng hồ).
      let hetGioLuc = laBaiTap_(ca) ? ca.hanNop || '' : new Date(now + ca.thoiGianPhut * 60000).toISOString()
      if (qd.cach === 'khoi_phuc') {
        lanThu = luot.lanThu
        vaoLuc = luot.vaoLuc
        hetGioLuc = laBaiTap_(ca) ? ca.hanNop || '' : luot.hetGioLuc || new Date(msCua_(luot.vaoLuc) + ca.thoiGianPhut * 60000).toISOString()
      } else if (qd.cach === 'duyet_lai') {
        lanThu = luot.lanThu
        sh.getRange(luot.row, 4, 1, 5).setValues([[idThietBi, vaoLuc, hetGioLuc, '', 'dang_lam']])
        sh.getRange(luot.row, 21).setValue(new Date().toISOString())
      } else {
        lanThu = luot ? luot.lanThu + 1 : 1
        const rowData = []
        for (let i = 0; i < LUOT_HEADERS.length; i++) rowData.push('')
        rowData[0] = maCa
        rowData[1] = sbd
        rowData[2] = lanThu
        rowData[3] = idThietBi
        rowData[4] = vaoLuc
        rowData[5] = hetGioLuc
        rowData[7] = 'dang_lam'
        rowData[9] = 0
        rowData[10] = 0
        rowData[12] = hoSo ? hoSo.hoTen : ''
        rowData[20] = new Date().toISOString()
        sh.appendRow(rowData)
      }
      const out = {
        ok: true,
        cach: qd.cach,
        maCa: maCa,
        lop: ca.lop,
        thoiGianPhut: ca.thoiGianPhut,
        loai: ca.loai,
        hanNop: ca.hanNop,
        tenCa: ca.tenCa,
        congBo: ca.congBo,
        lanThu: lanThu,
        vaoLuc: vaoLuc,
        hetGioLuc: hetGioLuc,
        nguongLan: ca.nguongLan,
        nguongGiay: ca.nguongGiay,
        giuDeDoc: ca.giuDeDoc,
        anHanGiay: ca.anHanGiay,
        // Thầy vừa mở khoá lượt này (dòng LuotThi đang dang_lam nhưng máy em còn giữ cờ khoá) → máy em bỏ khoá, làm tiếp.
        daMoKhoa: qd.cach === 'khoi_phuc' && luot && luot.ghiChu.indexOf('mở khoá') >= 0,
        serverNow: Date.now(),
      }
      // CÂU HỎI LẠI — máy em đánh dấu "em đã sai câu này buổi trước" ngay trên
      // thẻ câu (thầy chốt 08/09). Chỉ phần của CHÍNH EM này.
      out.cauLap = cauLapCuaEm_(ca.boTheoEmRef, sbd)
      // BỘ CÂU CỦA EM đi kèm MỌI lần vào, kể cả lần không xin lại kho đề: máy
      // em ghép vào kho đã cất rồi mới cắt đề.
      out.boCuaEm = boCuaEm
      // SỐ LẦN SAI TỪNG CÂU LẶP — nguồn nhãn "sai lần thứ N" ở báo cáo em xem
      // ngay sau khi nộp. Đọc ở đây, ngoài khoá thì tốn thêm một lượt mở tệp;
      // gói này vốn đã mở cho `cauLap` nên không thêm lần đọc nào.
      out.demLap = demLapCuaEm_(ca.boTheoEmRef, sbd)
      // Đề (KHÔNG đáp án) chỉ gửi khi máy em chưa có bản cache — tiết kiệm băng
      // thông. Đã đọc TRƯỚC KHI VÀO KHOÁ, xem `bankGui` bên trên.
      if (body.canBank) out.bank = bankGui
      return jsonResponse_(out)
    } finally {
      lock.releaseLock()
    }
  }

  if (action === 'duyetThiLai') {
    // Thầy cho 1 em thi lại (QUANLYCATHI mục 1): thêm dòng lượt MỚI trạng thái
    // duoc_duyet_lai — lượt cũ giữ nguyên, khi em vào (vaoThi) dòng này thành
    // dang_lam. Cần MA_BI_MAT (chỉ máy thầy có).
    const loi = kiemTraMaBiMat_(body)
    if (loi) return jsonResponse_({ ok: false, error: loi })
    const maCa = String(body.maCa || '').trim()
    const sbd = String(body.sbd || '').trim()
    const sh = sheetLuot_()
    const luot = luotMoiNhatTheoSbd_(sh, maCa, true)[sbd] || null
    if (luot && luot.trangThai === 'duoc_duyet_lai') return jsonResponse_({ ok: true, lanThu: luot.lanThu, daDuyetTruoc: true })
    if (luot && luot.trangThai === 'dang_lam') return jsonResponse_({ ok: false, error: 'Em này đang làm bài (lượt ' + luot.lanThu + ') — chưa nộp thì không cần duyệt' })
    const lanThu = luot ? luot.lanThu + 1 : 1
    const rowData = []
    for (let i = 0; i < LUOT_HEADERS.length; i++) rowData.push('')
    rowData[0] = maCa
    rowData[1] = sbd
    rowData[2] = lanThu
    rowData[7] = 'duoc_duyet_lai'
    rowData[9] = 0
    rowData[10] = 0
    rowData[12] = luot && luot.hoTen ? luot.hoTen : tenHocSinh_(sbd)
    rowData[17] = body.nguoiDuyet || 'thầy'
    rowData[18] = new Date().toISOString()
    rowData[20] = new Date().toISOString()
    sh.appendRow(rowData)
    return jsonResponse_({ ok: true, lanThu: lanThu })
  }

  if (action === 'choThiLai') {
    // CHO THI LẠI — ba việc trong một lệnh (thầy chốt 08/09):
    //   1. XOÁ HẲN lịch sử bài thi trước của em trong ca này;
    //   2. KHOÁ MÁY: em chỉ vào lại được từ đúng cái máy đã thi lượt trước;
    //   3. ĐỀ MỚI: máy thầy rút bộ câu khác rồi gửi kèm ở `boCauMoi`.
    //
    // Khác hẳn `duyetThiLai` cũ (vẫn giữ, dùng cho trường hợp chỉ cần thêm một
    // lượt mà không xoá gì): ở đó lượt cũ còn nguyên và em thi "lần 2".
    //
    // KHÔNG ĐỤNG PHIẾU đã dựng: link báo cáo có thể đã gửi phụ huynh rồi, xoá
    // nó là phụ huynh bấm vào thấy trang trống. Thầy dựng lại phiếu sau khi em
    // thi xong là phiếu tự mang số mới.
    const loiTL = kiemTraMaBiMat_(body)
    if (loiTL) return jsonResponse_({ ok: false, error: loiTL })
    const maCaTL = String(body.maCa || '').trim()
    const sbdTL = String(body.sbd || '').trim()
    if (!maCaTL || !sbdTL) return jsonResponse_({ ok: false, error: 'Thiếu mã ca hoặc số báo danh' })
    const shCaTL = sheetCa_()
    const rowCaTL = findRowByKey_(shCaTL, 0, maCaTL)
    if (rowCaTL < 0) return jsonResponse_({ ok: false, error: 'Không có ca ' + maCaTL })
    const caTL = docCa_(shCaTL, rowCaTL)

    const shTL = sheetLuot_()
    const dataTL = shTL.getDataRange().getValues()
    let mayCu = ''
    let hoTenCu = ''
    let lanCaoNhat = 0
    const xoaTL = []
    for (let i = 1; i < dataTL.length; i++) {
      if (String(dataTL[i][0]) !== maCaTL || String(dataTL[i][1]) !== sbdTL) continue
      const lan = Number(dataTL[i][2]) || 1
      // Máy khoá = máy của lượt GẦN NHẤT có ghi id thiết bị. Em thi ở máy nào
      // thì thi lại ở đúng máy đó.
      if (lan >= lanCaoNhat && String(dataTL[i][3] || '')) { mayCu = String(dataTL[i][3]); lanCaoNhat = lan }
      if (!hoTenCu && String(dataTL[i][12] || '')) hoTenCu = String(dataTL[i][12])
      // ĐANG LÀM thì KHÔNG xoá: cắt ngang em đang làm dở là mất bài đang gõ.
      if (String(dataTL[i][7] || '') === 'dang_lam') return jsonResponse_({ ok: false, error: 'Em này đang làm bài — khoá ca hoặc đợi em nộp rồi mới cho thi lại' })
      xoaTL.push(i + 1)
    }
    if (xoaTL.length === 0) return jsonResponse_({ ok: false, error: 'Em này chưa có lượt nào trong ca' })

    // Xoá TỪ DƯỚI LÊN, nếu không chỉ số các dòng sau trôi hết.
    xoaTL.sort(function (a, b) { return b - a })
    for (let i = 0; i < xoaTL.length; i++) shTL.deleteRow(xoaTL[i])

    // Chi tiết từng câu + bản đồ sai + tổng hợp chuyên đề của ca này: xoá sạch,
    // nếu không báo cáo và "sai lần thứ mấy" vẫn đếm lượt đã bỏ.
    let soCtXoa = 0
    try {
      const ctShTL = getSheet_(SHEET_CHITIET, CHITIET_HEADERS)
      const ctDataTL = ctShTL.getDataRange().getValues()
      const xoaCt = []
      for (let i = 1; i < ctDataTL.length; i++) {
        if (String(ctDataTL[i][0]) === maCaTL && String(ctDataTL[i][1]) === sbdTL) xoaCt.push(i + 1)
      }
      xoaCt.sort(function (a, b) { return b - a })
      for (let i = 0; i < xoaCt.length; i++) ctShTL.deleteRow(xoaCt[i])
      soCtXoa = xoaCt.length
    } catch (e1) {}
    try {
      const bdSh = getSheet_(SHEET_BANDO, BANDO_HEADERS)
      const bdData = bdSh.getDataRange().getValues()
      for (let i = bdData.length - 1; i >= 1; i--) {
        if (String(bdData[i][0]) === maCaTL && String(bdData[i][1]) === sbdTL) bdSh.deleteRow(i + 1)
      }
    } catch (e2) {}
    try {
      const tdSh = sheetTienDoCa_()
      const tdData = tdSh.getDataRange().getValues()
      const lucTL = new Date().toISOString()
      for (let i = 1; i < tdData.length; i++) {
        if (String(tdData[i][0]) === sbdTL && String(tdData[i][1]) === maCaTL) {
          tdSh.getRange(i + 1, 4, 1, 4).setValues([[0, 0, '', lucTL]])
        }
      }
    } catch (e3) {}

    // ĐỀ MỚI cho riêng em này: ghi vào chính bản đồ đề riêng của ca. Không đụng
    // luật hash, không đổi bộ câu của bạn nào khác.
    let daDoiDe = false
    if (Object.prototype.toString.call(body.boCauMoi) === '[object Array]' && body.boCauMoi.length > 0) {
      try {
        const goiCu = caTL.boTheoEmRef ? doiGoiDeRieng_(docJsonLon_(caTL.boTheoEmRef)) : { bo: null, lap: {} }
        const boTL = goiCu.bo && typeof goiCu.bo === 'object' ? goiCu.bo : {}
        const lapTL = goiCu.lap && typeof goiCu.lap === 'object' ? goiCu.lap : {}
        boTL[sbdTL] = body.boCauMoi
        if (Object.prototype.toString.call(body.lapMoi) === '[object Array]') lapTL[sbdTL] = body.lapMoi
        else delete lapTL[sbdTL]
        shCaTL.getRange(rowCaTL, 28).setValue(luuJsonLon_('ca_' + maCaTL + '_botheoem', { bo: boTL, lap: lapTL, dem: goiCu.dem || {}, bb: goiCu.bb || null }, caTL.boTheoEmRef))
        daDoiDe = true
      } catch (errTL) {
        return jsonResponse_({ ok: false, error: 'Đã xoá lượt cũ nhưng KHÔNG ghi được đề mới: ' + errTL })
      }
    }

    // Lượt mới: lần 1 (lịch sử cũ đã xoá nên không còn "lần 2"), khoá theo máy.
    const rowMoiTL = []
    for (let i = 0; i < LUOT_HEADERS.length; i++) rowMoiTL.push('')
    rowMoiTL[0] = maCaTL
    rowMoiTL[1] = sbdTL
    rowMoiTL[2] = 1
    rowMoiTL[3] = mayCu
    rowMoiTL[7] = 'duoc_duyet_lai'
    rowMoiTL[9] = 0
    rowMoiTL[10] = 0
    rowMoiTL[12] = hoTenCu || tenHocSinh_(sbdTL)
    rowMoiTL[17] = body.nguoiDuyet || 'thầy'
    rowMoiTL[18] = new Date().toISOString()
    rowMoiTL[19] = mayCu ? 'thi lại — khoá đúng máy cũ' : 'thi lại — lượt cũ không ghi máy, không khoá được'
    rowMoiTL[20] = new Date().toISOString()
    shTL.appendRow(rowMoiTL)
    return jsonResponse_({ ok: true, soLuotXoa: xoaTL.length, soCauXoa: soCtXoa, khoaMay: !!mayCu, daDoiDe: daDoiDe, serverNow: Date.now() })
  }

  if (action === 'moKhoa') {
    // Thầy MỞ KHOÁ một lượt bị khoá vì rời màn (QUANLYCATHI mục 6): trạng thái
    // về dang_lam, giữ nguyên đáp án đã tự nộp + số lần rời màn, ghi ai mở lúc
    // nào. Em mở lại link trên CÙNG máy là làm tiếp (đồng hồ vẫn theo HetGioLuc).
    const loi = kiemTraMaBiMat_(body)
    if (loi) return jsonResponse_({ ok: false, error: loi })
    const maCa = String(body.maCa || '').trim()
    const sbd = String(body.sbd || '').trim()
    const sh = sheetLuot_()
    const luot = luotMoiNhatTheoSbd_(sh, maCa, true)[sbd] || null
    if (!luot) return jsonResponse_({ ok: false, error: 'Em này chưa vào thi' })
    if (luot.trangThai !== 'khoa') return jsonResponse_({ ok: false, error: 'Lượt hiện tại không bị khoá (' + luot.trangThai + ')' })
    const luc = new Date().toISOString()
    const ghiChu = (luot.ghiChu ? luot.ghiChu + ' · ' : '') + 'thầy mở khoá ' + luc.slice(11, 16) + 'Z (' + (body.nguoiMo || 'thầy') + ')'
    sh.getRange(luot.row, 8).setValue('dang_lam')
    sh.getRange(luot.row, 20, 1, 2).setValues([[ghiChu, luc]])
    // Trạng thái theo dõi của phụ huynh: bỏ cờ khoá ngay.
    try {
      const st = getSheet_(SHEET_TRANGTHAI, ['SBD', 'MaCa', 'Lop', 'DangLam', 'BatDauLuc', 'DaLamCauHoi', 'TongCauHoi', 'SoLanRoiApp', 'Blocked', 'CapNhatLuc'])
      const r = findRowByKey_(st, 0, sbd)
      if (r > 0 && String(st.getRange(r, 2).getValue()) === maCa) st.getRange(r, 9).setValue('false')
    } catch (err) {}
    return jsonResponse_({ ok: true, lanThu: luot.lanThu })
  }

  // ------------------------------------------------------ LỊCH SỬ CA THI (mục 2)
  if (action === 'danhSachCa') {
    // Mọi ca (trừ đã xoá) + đếm đã vào / đã nộp / cảnh báo từ LuotThi. Không
    // gửi BankJson/KeyBankJson. Mới nhất trước. Cần MA_BI_MAT (chỉ máy thầy).
    const loi = kiemTraMaBiMat_(body)
    if (loi) return jsonResponse_({ ok: false, error: loi })
    const caSh = sheetCa_()
    const data = caSh.getDataRange().getValues()
    const luotData = sheetLuot_().getDataRange().getValues()
    // gom lượt mới nhất theo (maCa → sbd) một lần cho mọi ca
    const theoCa = {}
    for (let i = 1; i < luotData.length; i++) {
      const l = docLuot_(luotData[i])
      if (!theoCa[l.maCa]) theoCa[l.maCa] = {}
      const m = theoCa[l.maCa]
      if (!m[l.sbd] || m[l.sbd].lanThu < l.lanThu) m[l.sbd] = l
    }
    const items = []
    const layCaDaXoa = body.daXoa === true
    for (let i = 1; i < data.length; i++) {
      const v = data[i]
      const trangThai = v[9] ? String(v[9]) : 'mo'
      if (layCaDaXoa ? trangThai !== 'da_xoa' : trangThai === 'da_xoa') continue
      const maCa = String(v[0])
      const tk = thongKeLuot_(theoCa[maCa] || {})
      items.push({
        maCa: maCa,
        lop: v[1],
        thoiGianPhut: Number(v[2]) || 45,
        moLuc: v[3] ? String(v[3]) : '',
        congBo: congBoCua_(v[5]),
        batDau: v[7] ? String(v[7]) : '',
        hetHanVao: v[8] ? String(v[8]) : '',
        trangThai: trangThai,
        tenCa: v[10] ? String(v[10]) : '',
        phamVi: v[11] ? String(v[11]) : 'tu_do',
        loai: String(v[17] || '') === 'baitap' ? 'baitap' : 'thi',
        hanNop: v[18] ? String(v[18]) : '',
        lenBang: lenBangCua_(v[22]),
        giuDeDoc: giuDeDocCua_(v[23]),
        anHanGiay: anHanGiayCua_(v[24]),
        phongCho: String(v[25] || '') === 'co',
        batDauThiLuc: v[26] ? String(v[26]) : '',
        xoaLuc: v[14] ? String(v[14]) : '',
        daVao: tk.daVao,
        daNop: tk.daNop,
        canhBao: tk.canhBao,
      })
    }
    items.sort(function (a, b) { return msCua_(b.moLuc || b.batDau) - msCua_(a.moLuc || a.batDau) })
    return jsonResponse_({ ok: true, items: items, serverNow: Date.now() })
  }

  if (action === 'chiTietCa') {
    // Thông tin ca + MỌI lượt của ca (thi lại = nhiều dòng cùng SBD) kèm điểm,
    // giờ vào/nộp, cảnh báo, giây làm từng câu. Không gửi đề.
    const loi = kiemTraMaBiMat_(body)
    if (loi) return jsonResponse_({ ok: false, error: loi })
    const maCa = String(body.maCa || '').trim()
    const caSh = sheetCa_()
    const caRow = findRowByKey_(caSh, 0, maCa)
    if (caRow < 0) return jsonResponse_({ ok: false, error: 'Không có ca ' + maCa })
    const ca = docCa_(caSh, caRow)
    const luotData = sheetLuot_().getDataRange().getValues()
    const luot = []
    for (let i = 1; i < luotData.length; i++) {
      if (String(luotData[i][0]) !== maCa) continue
      const l = docLuot_(luotData[i])
      const v = luotData[i]
      let dapAn = null
      let integrity = null
      let giayCau = null
      try { dapAn = l.dapAnJson ? JSON.parse(l.dapAnJson) : null } catch (err) {}
      try { integrity = l.integrityJson ? JSON.parse(l.integrityJson) : null } catch (err) {}
      try { giayCau = v[21] ? JSON.parse(v[21]) : null } catch (err) {}
      luot.push({
        sbd: l.sbd,
        hoTen: l.hoTen,
        lanThu: l.lanThu,
        trangThai: l.trangThai,
        vaoLuc: l.vaoLuc,
        hetGioLuc: l.hetGioLuc,
        nopLuc: l.nopLuc,
        soLanRoiMan: l.soLanRoiMan,
        tongGiayRoiMan: l.tongGiayRoiMan,
        diemI: v[13] === '' ? null : Number(v[13]),
        diemII: v[14] === '' ? null : Number(v[14]),
        diemIII: v[15] === '' ? null : Number(v[15]),
        tong: l.tong,
        duyetBoi: l.duyetBoi,
        duyetLuc: l.duyetLuc,
        ghiChu: l.ghiChu,
        dapAn: dapAn,
        integrity: integrity,
        giayCau: giayCau,
      })
    }
    // NGÂN HÀNG CÓ ĐÁP ÁN của ca, trả kèm khi máy gọi xin (body.xinKeyBank).
    // Trước đây luôn xoá, nên thầy mở ca bằng điện thoại rồi ngồi máy tính là
    // không chấm lại, không xuất bảng điểm, không tải phiếu được — máy tính
    // không có bản đề đó. Lệnh này đã đòi MA_BI_MAT; ai có mã thì `layDe` đã
    // đọc được cả kho đề, nên trả thêm đáp án của MỘT ca không mở rộng quyền gì.
    const keyBank = body.xinKeyBank && ca.keyBankRef ? docJsonLon_(ca.keyBankRef) : null
    // GÓI ĐỀ RIÊNG trả nguyên cả hai bản đồ cho MÁY THẦY: thầy bấm Bắt đầu ở
    // điện thoại rồi mở ca trên máy tính thì máy tính không có bản đồ nào, và
    // màn Ca thi không có gì để báo (thầy bắt được 08/09). Lệnh này đòi mã bí
    // mật nên không mở rộng quyền cho ai.
    let goiDeRieng = null
    try { goiDeRieng = ca.boTheoEmRef ? docJsonLon_(ca.boTheoEmRef) : null } catch (errGDR) {}
    delete ca.bankRef
    delete ca.keyBankRef
    delete ca.row
    let danhSachMoi = []
    try { danhSachMoi = ca.danhSachMoi && ca.phamVi === 'chon' ? JSON.parse(ca.danhSachMoi) : [] } catch (err) {}
    ca.danhSachMoi = ca.phamVi === 'chon' ? danhSachMoi : ca.danhSachMoi
    return jsonResponse_({ ok: true, ca: ca, luot: luot, keyBank: keyBank, biChan: docChanVao_(maCa), dsCho: docPhongCho_(maCa), goiDeRieng: goiDeRieng, serverNow: Date.now() })
  }

  if (action === 'themEmVaoSheet') {
    // THÊM MỘT EM VÀO ĐÚNG SHEET KHỐI CỦA THẦY (thầy chốt 07/09).
    //
    // Thầy gõ ba ô ở màn Học sinh, bấm Thêm; máy ghi thẳng vào Google Sheet gốc
    // của khối đó rồi thêm luôn vào bản sao DanhSachLop — em vào thi được ngay,
    // không phải đợi lượt đồng bộ sau.
    //
    // GHI VÀO SHEET GỐC chứ không chỉ DanhSachLop: bản sao bị lượt Đồng bộ kế
    // tiếp ghi đè, nên em thêm vào bản sao sẽ biến mất mà không ai biết.
    //
    // TÌM SHEET THEO NĂM SINH: sheet của thầy đặt tên đúng bằng năm sinh
    // ("2009", "2010", "2011"). Tìm được thì nhớ vào Script property, lần sau
    // không phải quét Drive nữa. Không tìm ra thì DỪNG và nói rõ — đoán bừa
    // một sheet là ghi tên em vào khối khác.
    const loiTE = kiemTraMaBiMat_(body)
    if (loiTE) return jsonResponse_({ ok: false, error: loiTE })
    const sbdTE = String(body.sbd || '').trim()
    const tenTE = String(body.hoTen || '').replace(/\s+/g, ' ').trim()
    const namTE = chuanNamSinh_(body.namSinh)
    if (!/^\d{3,12}$/.test(sbdTE)) return jsonResponse_({ ok: false, error: 'Số báo danh phải là số, 3 tới 12 chữ số' })
    if (!tenTE) return jsonResponse_({ ok: false, error: 'Chưa nhập họ tên' })
    if (!namTE) return jsonResponse_({ ok: false, error: 'Năm sinh phải là 4 chữ số, ví dụ 2009' })

    // Số báo danh đã có trong danh sách thì DỪNG — trùng số là hai em cùng một
    // bài thi, hỏng cả buổi.
    const daCoTE = timTrongDanhSachLop_(sbdTE)
    if (daCoTE) {
      return jsonResponse_({ ok: false, lyDo: 'trung_sbd', error: 'Số báo danh ' + sbdTE + ' đã có trong danh sách: ' + (daCoTE.hoTen || '(chưa có tên)') })
    }

    const ssTE = moSheetKhoi_(namTE)
    if (!ssTE.ok) return jsonResponse_({ ok: false, error: ssTE.error })
    const shTE = ssTE.ss.getSheets()[0]
    const dTE = shTE.getDataRange().getValues()
    const vtTE = cotDsLop_(dTE.length ? dTE[0] : [])
    for (var iTE = 1; iTE < dTE.length; iTE++) {
      if (String(dTE[iTE][vtTE.sbd]).trim() === sbdTE) {
        return jsonResponse_({ ok: false, lyDo: 'trung_sbd', error: 'Sheet khối ' + namTE + ' đã có số báo danh ' + sbdTE })
      }
    }
    const soCot = Math.max(dTE.length ? dTE[0].length : 3, vtTE.sbd + 1, vtTE.hoTen + 1, vtTE.namSinh + 1)
    const hangTE = []
    for (var cTE = 0; cTE < soCot; cTE++) hangTE.push('')
    hangTE[vtTE.sbd] = sbdTE
    hangTE[vtTE.hoTen] = tenTE
    hangTE[vtTE.namSinh] = namTE
    if (vtTE.lop >= 0) hangTE[vtTE.lop] = lopTuNamSinh_(namTE)
    shTE.appendRow(hangTE)

    // Thêm luôn vào bản sao để em vào thi được ngay.
    const shDS = getSheet_(SHEET_DSLOP, DSLOP_HEADERS)
    shDS.appendRow([sbdTE, tenTE, namTE, lopTuNamSinh_(namTE), new Date().toISOString()])

    return jsonResponse_({ ok: true, sbd: sbdTE, hoTen: tenTE, namSinh: namTE, lop: lopTuNamSinh_(namTE), tenSheet: ssTE.ss.getName() })
  }

  if (action === 'trangThaiPhongCho') {
    // MÁY EM HỎI LẠI: thầy bấm bắt đầu chưa. Lệnh nhẹ nhất có thể — em đang
    // đứng chờ và hỏi vài giây một lần, nên chỉ đọc ĐÚNG một dòng ca và trả về
    // ba trường. Không đề, không đáp án, không danh sách.
    const maCaPC2 = String(body.maCa || '').trim()
    if (!maCaPC2) return jsonResponse_({ ok: false, error: 'Thiếu mã ca' })
    const shPC = sheetCa_()
    const rowPC = findRowByKey_(shPC, 0, maCaPC2)
    if (rowPC < 0) return jsonResponse_({ ok: false, lyDo: 'khong_co_ca', error: 'Không tìm thấy ca kiểm tra' })
    const caPC = docCa_(shPC, rowPC)
    // Ca bị thầy HUỶ giữa lúc em đang chờ: nói thẳng, đừng để em đứng mãi.
    if (caPC.trangThai === 'da_xoa') return jsonResponse_({ ok: false, lyDo: 'da_xoa', error: 'Thầy đã huỷ ca kiểm tra này.' })
    return jsonResponse_({
      ok: true,
      phongCho: !!caPC.phongCho,
      batDau: !!caPC.batDauThiLuc,
      batDauLuc: caPC.batDauThiLuc || '',
      trangThai: caPC.trangThai,
      serverNow: Date.now(),
    })
  }

  if (action === 'batDauThi') {
    // THẦY BẤM BẮT ĐẦU. Ghi mốc giờ; từ giây đó máy em mới xin đề và đồng hồ
    // mới chạy. Bấm hai lần thì giữ mốc lần đầu — bấm nhầm lần hai không được
    // kéo dài giờ của em đã vào.
    const loiBD = kiemTraMaBiMat_(body)
    if (loiBD) return jsonResponse_({ ok: false, error: loiBD })
    const maCaBD = String(body.maCa || '').trim()
    const shBD = sheetCa_()
    const rowBD = findRowByKey_(shBD, 0, maCaBD)
    if (rowBD < 0) return jsonResponse_({ ok: false, error: 'Không có ca ' + maCaBD })
    const caBD = docCa_(shBD, rowBD)
    // ĐÃ BẮT ĐẦU TỪ TRƯỚC thì KHÔNG ghi đè bản đồ: em đã cầm đề rồi, đổi bản
    // đồ lúc này là bảng chấm của thầy khác hẳn tờ đề em đang làm.
    //
    // Nhưng phải NÓI RA khi ca đề riêng đã bắt đầu mà chưa có bản đồ nào —
    // đó là ca em nhận đề cắt theo luật hash, và im lặng ở đây là thầy chấm
    // bằng một bộ câu khác bộ em đã làm.
    if (caBD.batDauThiLuc) {
      return jsonResponse_({ ok: true, batDauLuc: caBD.batDauThiLuc, daBatTruoc: true, coBoTheoEm: !!caBD.boTheoEmRef, canBoTheoEm: !!(body.boTheoEm && typeof body.boTheoEm === 'object') })
    }
    // ĐỀ RIÊNG TỪNG EM — bản đồ sbd → qid dựng ĐÚNG LÚC NÀY, từ danh sách em
    // đang đứng ở phòng chờ. Dựng lúc mở ca thì phải đoán trước ai tới, mà lớp
    // hôm đủ hôm thiếu (thầy chốt 08/09).
    //
    // Ghi TRƯỚC mốc giờ: mốc giờ là thứ mở cổng phát đề, ghi nó trước mà bản
    // đồ chưa có là có em nhận đề theo luật hash rồi mới có bản đồ.
    //
    // GÓI HAI BẢN ĐỒ VÀO MỘT Ô: `bo` là bộ câu của từng em, `lap` là những câu
    // trong đó chính em đã sai buổi trước (máy em dùng để đánh dấu). Gói chung
    // vì sheet đang chạy đúng 28 cột — thêm cột 29 là `getRange` ngoài phạm vi
    // ngay giữa lúc cả lớp đứng ở phòng chờ.
    if (body.boTheoEm && typeof body.boTheoEm === 'object') {
      try {
        const goiBD = {
          bo: body.boTheoEm,
          lap: body.lapTheoEm && typeof body.lapTheoEm === 'object' ? body.lapTheoEm : {},
          // `dem` và `bb` để MÀN CA THI ở máy khác đọc được: số lần em đã sai
          // từng câu, và biên bản nói vì sao em nào không có câu hỏi lại.
          dem: body.demSaiTheoEm && typeof body.demSaiTheoEm === 'object' ? body.demSaiTheoEm : {},
          bb: body.bienBan && typeof body.bienBan === 'object' ? body.bienBan : null,
        }
        shBD.getRange(rowBD, 28).setValue(luuJsonLon_('ca_' + maCaBD + '_botheoem', goiBD, caBD.boTheoEmRef))
      } catch (errBD) {
        return jsonResponse_({ ok: false, error: 'Không ghi được bộ câu riêng: ' + errBD })
      }
    }
    const lucBD = new Date().toISOString()
    shBD.getRange(rowBD, 27).setValue(lucBD)
    return jsonResponse_({ ok: true, batDauLuc: lucBD, daBatTruoc: false })
  }

  if (action === 'tenTheoSbd') {
    // TRA HỌ TÊN TỪ SỐ BÁO DANH ĐỂ EM XÁC NHẬN TRƯỚC KHI VÀO THI (thầy chốt
    // 07/09).
    //
    // Màn vào thi nay chỉ hỏi số báo danh. Bấm Vào thi thì hiện tên của số báo
    // danh đó cho em nhìn, rồi em chọn Bắt đầu hoặc Nhập lại. Gõ nhầm một số là
    // thấy ngay tên người khác — bắt lỗi tốt hơn hẳn cách bắt gõ đủ ba ô, vì
    // gõ ba ô thì lỗi nào cũng chỉ ra một câu "thông tin không đúng".
    //
    // ĐÁNH ĐỔI, nói thẳng: ai cầm mã ca cũng dò được "số báo danh này là ai".
    // Bản cũ cố tình giấu điều đó. Thầy chốt đổi vì phòng thi có thầy coi tại
    // chỗ, và cái giá của việc em không vào thi được lớn hơn.
    //
    // Vẫn giữ ba cổng: phải có mã ca thật, ca chưa xoá, và số báo danh phải nằm
    // trong danh sách lớp. KHÔNG trả năm sinh, KHÔNG trả số điện thoại.
    const maCaTS = String(body.maCa || '').trim()
    const sbdTS = String(body.sbd || '').trim()
    if (!maCaTS || !sbdTS) return jsonResponse_({ ok: false, lyDo: 'thieu', error: 'Nhập mã ca và số báo danh' })
    const caShTS = sheetCa_()
    const caRowTS = findRowByKey_(caShTS, 0, maCaTS)
    if (caRowTS < 0) return jsonResponse_({ ok: false, lyDo: 'khong_co_ca', error: 'Không tìm thấy ca kiểm tra — kiểm tra lại mã ca' })
    const caTS = docCa_(caShTS, caRowTS)
    if (caTS.trangThai === 'da_xoa') return jsonResponse_({ ok: false, lyDo: 'da_xoa', error: 'Ca kiểm tra này đã bị thầy xoá' })

    const dongTS = coDanhSachHocSinh_() ? timTrongDanhSachLop_(sbdTS) : null
    if (coDanhSachHocSinh_() && !dongTS) {
      ghiChanVao_(maCaTS, sbdTS, '', '', '', '', 'khong_co_sbd')
      return jsonResponse_({ ok: false, lyDo: 'khong_trong_danh_sach', error: 'Số báo danh này không có trong danh sách lớp. Kiểm tra lại đúng như Thầy ghi trong sổ.' })
    }
    // Chưa nạp danh sách bao giờ thì không chặn ai — nhưng cũng không bịa tên.
    const hoSoTS = hoSoHocSinh_(sbdTS)
    const tenTS = (dongTS && String(dongTS.hoTen || '').trim()) || (hoSoTS && String(hoSoTS.hoTen || '').trim()) || ''
    return jsonResponse_({
      ok: true,
      sbd: sbdTS,
      hoTen: tenTS,
      lop: (dongTS && dongTS.lop) || caTS.lop || (hoSoTS ? hoSoTS.lop : '') || '',
      tenCa: caTS.tenCa || '',
      serverNow: Date.now(),
    })
  }

  if (action === 'dongBoTenCa') {
    // ĐỒNG BỘ HỌ TÊN TỪ DANH SÁCH LỚP VÀO MỘT CA (thầy báo 07/09).
    //
    // Em vào thi chỉ gõ số báo danh nên cột HoTen của lượt thi bỏ trống. Phiếu
    // gửi phụ huynh khi đó in "SBD 10038" thay vì tên em — phụ huynh mở link ra
    // không thấy tên con mình.
    //
    // Danh sách lớp là NGUỒN SỰ THẬT: điền tên từ đó vào lượt thi, và điền cả
    // vào hồ sơ HocSinh nếu hồ sơ đang trống, để lần sau không phải chạy lại.
    // Tên đang có mà lệch danh sách thì cũng sửa theo danh sách, nhưng BÁO RA
    // từng dòng cũ → mới, không đổi lặng lẽ.
    //
    // Không đụng điểm, không đụng đáp án, không đụng chi tiết câu.
    const loiDT = kiemTraMaBiMat_(body)
    if (loiDT) return jsonResponse_({ ok: false, error: loiDT })
    const maCaDT2 = String(body.maCa || '').trim()
    if (!maCaDT2) return jsonResponse_({ ok: false, error: 'Thiếu mã ca' })
    const caShDT2 = sheetCa_()
    const caRowDT2 = findRowByKey_(caShDT2, 0, maCaDT2)
    if (caRowDT2 < 0) return jsonResponse_({ ok: false, error: 'Không có ca ' + maCaDT2 })

    var dsDT = docDanhSachLop_()
    if (!dsDT.length) return jsonResponse_({ ok: false, error: 'Danh sách lớp trên máy chủ đang rỗng — bấm Đồng bộ danh sách trước' })
    var tenTheoSbd = {}
    for (var i = 0; i < dsDT.length; i++) tenTheoSbd[dsDT[i].sbd] = dsDT[i]

    var shDT = sheetLuot_()
    var dDT = shDT.getDataRange().getValues()
    var daDien = []
    var daSua = []
    var khongCo = []
    var giuNguyen = 0
    for (var r = 1; r < dDT.length; r++) {
      if (String(dDT[r][0]) !== maCaDT2) continue
      var sbdR = String(dDT[r][1]).trim()
      var tenCu = String(dDT[r][12] || '').trim()
      var em = tenTheoSbd[sbdR]
      if (!em || !String(em.hoTen).trim()) {
        if (khongCo.indexOf(sbdR) < 0) khongCo.push(sbdR)
        continue
      }
      var tenMoi = String(em.hoTen).trim()
      if (!tenCu) {
        shDT.getRange(r + 1, 13).setValue(tenMoi)
        daDien.push({ sbd: sbdR, hoTen: tenMoi })
      } else if (chuanTen_(tenCu) !== chuanTen_(tenMoi)) {
        shDT.getRange(r + 1, 13).setValue(tenMoi)
        daSua.push({ sbd: sbdR, cu: tenCu, moi: tenMoi })
      } else {
        giuNguyen++
      }
      // Hồ sơ HocSinh trống tên thì điền luôn — lần sau khỏi chạy lại lệnh này.
      var hoSoDT = hoSoHocSinh_(sbdR)
      if (hoSoDT && !String(hoSoDT.hoTen || '').trim()) {
        var shHS = sheetHS_()
        var rowHS = findRowByKey_(shHS, 0, sbdR)
        if (rowHS > 0) shHS.getRange(rowHS, 2).setValue(tenMoi)
      }
    }
    return jsonResponse_({
      ok: true,
      maCa: maCaDT2,
      tenCa: docCa_(caShDT2, caRowDT2).tenCa || '',
      daDien: daDien,
      daSua: daSua,
      khongCo: khongCo,
      giuNguyen: giuNguyen,
    })
  }

  if (action === 'doiTenCa') {
    // ĐỔI TÊN CA (thầy báo 07/09). Tên ca đi theo ca suốt đời: in trong phiếu
    // gửi phụ huynh, trong bảng điểm, trong hồ sơ em. Gõ vội một lần là sai
    // mãi, nên phải sửa lại được.
    //
    // MÁY CHỦ CHUẨN HOÁ LẠI, KHÔNG TIN CHUỖI MÁY KHÁCH. Cùng luật với
    // `chuanTenCa` bên `src/lib/ten-ca.ts`:
    //   - gộp xuống dòng/tab/khoảng trắng thừa (dán từ Zalo, Word);
    //   - CẮT `=` `+` `@` Ở ĐẦU — ô Sheet nuốt chuỗi mở đầu bằng chúng thành
    //     CÔNG THỨC, đặt tên "=Ca 1" là ô hiện #NAME? và mất luôn tên ca;
    //   - cắt còn 80 ký tự, tên dài tràn khỏi thẻ ca và ô phiếu.
    //
    // Tên rỗng là HỢP LỆ: ca quay về gọi theo mã. Chỉ đụng ô TenCa, không đụng
    // đề, không đụng điểm, nên đổi tên giữa giờ thi cũng an toàn.
    var loiTen = kiemTraMaBiMat_(body)
    if (loiTen) return jsonResponse_({ ok: false, error: loiTen })
    var maCaDT = String(body.maCa || '').trim()
    var tenDT = String(body.tenCa == null ? '' : body.tenCa)
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/^\s+|\s+$/g, '')
    tenDT = tenDT.replace(/^[=+@]+\s*/, '').replace(/^\s+|\s+$/g, '')
    if (tenDT.length > 80) tenDT = tenDT.slice(0, 80).replace(/\s+$/, '')
    var caShDT = sheetCa_()
    var caRowDT = findRowByKey_(caShDT, 0, maCaDT)
    if (caRowDT < 0) return jsonResponse_({ ok: false, error: 'Không có ca ' + maCaDT })
    caShDT.getRange(caRowDT, 11).setValue(tenDT)
    return jsonResponse_({ ok: true, maCa: maCaDT, tenCa: tenDT })
  }

  if (action === 'xoaCa') {
    // XOÁ MỀM: đánh dấu da_xoa + XoaLuc, giữ nguyên LuotThi/ChiTietCau để phân
    // tích về sau. Phải gõ đúng mã ca (body.xacNhan) — tránh xoá nhầm.
    const loi = kiemTraMaBiMat_(body)
    if (loi) return jsonResponse_({ ok: false, error: loi })
    const maCa = String(body.maCa || '').trim()
    if (String(body.xacNhan || '').trim() !== maCa) return jsonResponse_({ ok: false, error: 'Mã ca xác nhận không khớp' })
    const caSh = sheetCa_()
    const caRow = findRowByKey_(caSh, 0, maCa)
    if (caRow < 0) return jsonResponse_({ ok: false, error: 'Không có ca ' + maCa })
    caSh.getRange(caRow, 10).setValue('da_xoa')
    caSh.getRange(caRow, 15).setValue(new Date().toISOString())
    return jsonResponse_({ ok: true })
  }

  if (action === 'khoiPhucCa') {
    // Xoá ca là xoá MỀM (TrangThai = da_xoa), bài làm giữ nguyên — nên xoá
    // nhầm là khôi phục lại được. Có tính năng xoá nhiều ca một lượt thì càng
    // cần đường lùi này.
    const loi = kiemTraMaBiMat_(body)
    if (loi) return jsonResponse_({ ok: false, error: loi })
    const maCa = String(body.maCa || '').trim()
    const caSh = sheetCa_()
    const caRow = findRowByKey_(caSh, 0, maCa)
    if (caRow < 0) return jsonResponse_({ ok: false, error: 'Không có ca ' + maCa })
    const ca = docCa_(caSh, caRow)
    if (ca.trangThai !== 'da_xoa') return jsonResponse_({ ok: false, error: 'Ca này chưa bị xoá' })
    caSh.getRange(caRow, 10).setValue('mo')
    caSh.getRange(caRow, 15).setValue('')
    return jsonResponse_({ ok: true, maCa: maCa, serverNow: Date.now() })
  }

  if (action === 'ghiDiem') {
    // Ghi điểm + CHI TIẾT TỪNG CÂU (mục 5) cho 1 hoặc nhiều lượt trong 1 ca.
    // Quyền: MA_BI_MAT (máy thầy) HOẶC đúng idThietBi của lượt (máy em, khi ca
    // công bố điểm và em chấm tại máy). body.bai = [{sbd, lanThu, idThietBi?,
    // diem:{I,II,III,tong}, cau:[{phan, soCau, qid, chuyenDe, mucDo, dapAnChon,
    // dapAnDung, dungSai, giay}]}]. Ghi đè chi tiết cũ của cùng lượt.
    const coMat = !kiemTraMaBiMat_(body)
    const maCa = String(body.maCa || '').trim()
    const bai = body.bai || []
    const sh = sheetLuot_()
    const luotData = sh.getDataRange().getValues()
    const ctSh = getSheet_(SHEET_CHITIET, CHITIET_HEADERS)
    const ctData = ctSh.getDataRange().getValues()
    const daGhi = []
    const tuChoi = []
    const xoaDong = []
    const themDong = []
    const banDoMoi = []
    const tomTat = {}
    for (let b = 0; b < bai.length; b++) {
      const x = bai[b]
      const sbd = String(x.sbd || '').trim()
      const lanThu = Number(x.lanThu) || 1
      let row = -1
      let l = null
      for (let i = 1; i < luotData.length; i++) {
        if (String(luotData[i][0]) === maCa && String(luotData[i][1]) === sbd && (Number(luotData[i][2]) || 1) === lanThu) {
          row = i + 1
          l = docLuot_(luotData[i])
          break
        }
      }
      if (row < 0) { tuChoi.push(sbd + ': không có lượt ' + lanThu); continue }
      if (!coMat && !(x.idThietBi && l.idThietBi && String(x.idThietBi) === l.idThietBi)) { tuChoi.push(sbd + ': không có quyền'); continue }
      // ĐIỂM chỉ ghi khi được phép (xem `duocGhiDiem_`). Máy em bản cũ chấm
      // bằng thang tuyệt đối cũ nên con số của nó KHÔNG được đè lên điểm thầy;
      // chi tiết từng câu bên dưới vẫn nhận vì không phụ thuộc luật chấm.
      const d = x.diem || {}
      if (duocGhiDiem_(coMat, body)) {
        sh.getRange(row, 14, 1, 4).setValues([[d.I === undefined ? '' : d.I, d.II === undefined ? '' : d.II, d.III === undefined ? '' : d.III, d.tong === undefined ? '' : d.tong]])
      } else {
        tuChoi.push(sbd + ': bản app cũ, chỉ nhận chi tiết câu — điểm giữ nguyên')
      }
      for (let i = 1; i < ctData.length; i++) {
        if (String(ctData[i][0]) === maCa && String(ctData[i][1]) === sbd && (Number(ctData[i][2]) || 1) === lanThu && xoaDong.indexOf(i + 1) < 0) xoaDong.push(i + 1)
      }
      const cau = x.cau || []
      const luc = new Date().toISOString()
      for (let c = 0; c < cau.length; c++) {
        const q = cau[c]
        themDong.push([maCa, sbd, lanThu, q.phan || '', q.soCau || '', q.qid || '', q.chuyenDe || '', q.mucDo || '', q.dapAnChon === undefined || q.dapAnChon === null ? '' : String(q.dapAnChon), q.dapAnDung === undefined || q.dapAnDung === null ? '' : String(q.dapAnDung), q.dungSai === true ? 'dung' : q.dungSai === false ? 'sai' : '', q.giay === undefined || q.giay === null ? '' : Number(q.giay), luc])
      }
      daGhi.push(sbd)
      // BẢN ĐỒ SAI dựng ngay tại đây, từ CHÍNH mảng câu vừa chấm — cùng một
      // nguồn với bảng thầy nhìn, nên không bao giờ lệch.
      banDoMoi.push({
        maCa: maCa,
        sbd: sbd,
        lanThu: lanThu,
        sai: cau.filter(function (q) { return q.dungSai === false }).map(function (q) { return String(q.qid || '') }).filter(function (q) { return q }),
        lam: cau.map(function (q) { return String(q.qid || '') }).filter(function (q) { return q }),
        luc: luc,
      })
      // Tổng hợp sẵn theo chuyên đề (đợt 2) — tính từ chính mảng câu vừa chấm.
      tomTat[sbd] = {
        nopLuc: l.nopLuc || luc,
        theoCd: gomTheoChuyenDe_(cau),
        qids: cau.map(function (q) { return String(q.qid || '') }).filter(function (q) { return q }),
      }
    }
    // Xoá dòng chi tiết cũ từ dưới lên (chỉ số không trôi), rồi ghi mới 1 lần.
    //
    // THEO KHỐI LIỀN MẠCH, không từng dòng một. Đo 08/09 khuya: `chamLaiCa` ca
    // 248567 (21 em) hỏng ba lần "không trả lời sau 25 giây"; hook fetch chỉ
    // đúng chỗ — `chiTietCa` xong trong 5 giây, `ghiDiem` một lô 5 em chết ở
    // 25,3 giây. Lô 5 em có ~60 dòng chi tiết cũ, mà `deleteRow` từng dòng là
    // ~60 lượt ghi Sheet. Chi tiết của một em được ghi liền một mạch nên các
    // dòng đó gần như luôn liền số: gom thành khối rồi `deleteRows` một lần cắt
    // ~60 lượt xuống còn vài lượt.
    xoaDong.sort(function (a, b) { return b - a })
    const khoi = khoiLienMach_(xoaDong)
    for (let i = 0; i < khoi.length; i++) ctSh.deleteRows(khoi[i][0], khoi[i][1])
    if (themDong.length > 0) ctSh.getRange(ctSh.getLastRow() + 1, 1, themDong.length, CHITIET_HEADERS.length).setValues(themDong)
    ghiBanDoSai_(banDoMoi)
    ghiTienDo_(maCa, tomTat)
    return jsonResponse_({ ok: true, daGhi: daGhi, tuChoi: tuChoi, soCau: themDong.length, serverNow: Date.now() })
  }

  if (action === 'submit') {
    // Ghi bài nộp vào dòng lượt (MaCa, SBD, LanThu) trong LuotThi: trạng thái
    // da_nop (hoặc khoa nếu bài bị khoá vì rời màn). Nộp lại (mất mạng nộp
    // lại) ghi đè cùng dòng. Ca mở từ bản cũ (không có lượt) → vẫn ghi BaiLam
    // như trước để màn Theo dõi đọc được.
    const integrity = body.integrity || { leaveCount: 0, totalHiddenMs: 0, events: [] }
    const nopLuc = new Date().toISOString()
    const trangThai = integrity.blocked ? 'khoa' : 'da_nop'
    // Ca này là bài tập về nhà? (đọc 1 lần, dùng cho ghi chú nộp muộn bên dưới)
    let laBaiTapCa = false
    try {
      const caShS = sheetCa_()
      const caRowS = findRowByKey_(caShS, 0, body.maCa)
      if (caRowS > 0) {
        const caS = docCa_(caShS, caRowS)
        // CA ĐÃ KHOÁ THÌ TỪ CHỐI (CATHIVAGOILENBANG mục 1.3). Bài của em đã
        // được `khoaCa` nộp hộ theo bản lưu tạm rồi; nhận thêm ở đây là ghi đè
        // lên bản đã chấm. Chặn ở máy chủ, không dựa vào giao diện đã ẩn nút.
        if (caDangKhoa_(caS)) return jsonResponse_({ ok: false, lyDo: 'da_dong', error: 'Ca đã khoá — bài của em đã được nộp theo phần đã làm', serverNow: Date.now() })
        laBaiTapCa = laBaiTap_(caS)
      }
    } catch (err) {
      laBaiTapCa = false
    }
    const sh = sheetLuot_()
    const data = sh.getDataRange().getValues()
    let luotRow = -1
    let luotCu = null
    const lanThuMuon = Number(body.lanThu) || 0
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) !== String(body.maCa) || String(data[i][1]) !== String(body.sbd)) continue
      const l = docLuot_(data[i])
      // Đúng lượt em đang làm; không gửi lanThu (bản app cũ) → lượt mới nhất.
      if (lanThuMuon ? l.lanThu === lanThuMuon : !luotCu || luotCu.lanThu < l.lanThu) {
        luotRow = i + 1
        luotCu = l
      }
    }
    if (luotRow > 0) {
      let ghiChu = luotCu.ghiChu
      const hetGio = msCua_(luotCu.hetGioLuc)
      if (isFinite(hetGio) && Date.now() > hetGio + AN_HAN_NOP_GIAY * 1000) {
        const muon = Math.round((Date.now() - hetGio) / 1000)
        // Bài tập về nhà: quá hạn VẪN NHẬN, chỉ đánh dấu; ghi theo ngày cho dễ đọc.
        ghiChu = laBaiTapCa ? 'nộp quá hạn ' + Math.max(1, Math.round(muon / 86400)) + ' ngày' : 'nộp muộn ' + muon + ' giây'
      }
      // Cột 7..12: NopLuc, TrangThai, DapAnJson, SoLanRoiMan, TongGiayRoiMan, IntegrityJson
      sh.getRange(luotRow, 7, 1, 6).setValues([[nopLuc, trangThai, JSON.stringify(body.dapAn), integrity.leaveCount || 0, Math.round((integrity.totalHiddenMs || 0) / 1000), JSON.stringify(integrity)]])
      // Cột 20..22: GhiChu, CapNhatLuc, GiayCauJson (giây làm từng câu — mục 5)
      sh.getRange(luotRow, 20, 1, 3).setValues([[ghiChu, nopLuc, body.giayCau ? JSON.stringify(body.giayCau) : '']])
    } else {
      const bl = getSheet_(SHEET_BAILAM, ['MaCa', 'SBD', 'MaDe', 'ThoiGianNop', 'DapAnJson', 'SoLanRoiApp', 'TongGiayRoiApp', 'IntegrityJson'])
      const blData = bl.getDataRange().getValues()
      let foundRow = -1
      for (let i = 1; i < blData.length; i++) {
        if (String(blData[i][0]) === String(body.maCa) && String(blData[i][1]) === String(body.sbd)) {
          foundRow = i + 1
          break
        }
      }
      const rowData = [body.maCa, body.sbd, body.maDe, nopLuc, JSON.stringify(body.dapAn), integrity.leaveCount, Math.round(integrity.totalHiddenMs / 1000), JSON.stringify(integrity)]
      if (foundRow > 0) bl.getRange(foundRow, 1, 1, 8).setValues([rowData])
      else bl.appendRow(rowData)
    }

    // Nếu ca này bật "xem điểm ngay sau khi nộp", trả kèm đáp án (keyBank)
    // NGAY TRONG RESPONSE của lần nộp này — chỉ em vừa nộp nhận được, không
    // có endpoint nào khác cho phép lấy đáp án trước khi nộp bài. Chế độ
    // 'calop' (khi cả lớp nộp xong) KHÔNG trả ở đây — em hỏi lại qua ketQua.
    const caSh = sheetCa_()
    const caRow = findRowByKey_(caSh, 0, body.maCa)
    let keyBank = null
    let congBo = 'khong'
    if (caRow > 0) {
      const ca = docCa_(caSh, caRow)
      congBo = ca.congBo
      if (congBo === 'ngay' && ca.keyBankRef) keyBank = docJsonLon_(ca.keyBankRef)
    }
    return jsonResponse_({ ok: true, keyBank: keyBank, congBo: congBo, serverNow: Date.now() })
  }

  if (action === 'luuTam') {
    // LƯU TẠM BÀI ĐANG LÀM (CATHIVAGOILENBANG mục 1). Máy em gọi mỗi 20 giây.
    //
    // Vì sao phải có: trước đây `DapAnJson` chỉ được ghi MỘT LẦN lúc bấm nộp.
    // Thầy khoá ca giữa giờ thì em đang làm bị nộp với bàn tay trắng — 0 điểm
    // cho bài em đã làm 30 phút. Có lưu tạm thì khoá ca chấm được phần đã làm.
    //
    // KHÔNG đổi TrangThai, KHÔNG ghi NopLuc: đây chỉ là bản nháp trên máy chủ.
    // Ghi đè cùng dòng nên sheet không phình theo số lần lưu.
    const maCa = String(body.maCa || '').trim()
    const sbd = String(body.sbd || '').trim()
    if (!maCa || !sbd) return jsonResponse_({ ok: false, lyDo: 'thieu', error: 'Thiếu mã ca hoặc số báo danh' })
    const caShT = sheetCa_()
    const caRowT = findRowByKey_(caShT, 0, maCa)
    if (caRowT < 0) return jsonResponse_({ ok: false, lyDo: 'khong_co_ca', error: 'Không tìm thấy ca kiểm tra' })
    // CHẶN Ở MÁY CHỦ, không dựa vào giao diện đã ẩn nút.
    if (caDangKhoa_(docCa_(caShT, caRowT))) return jsonResponse_({ ok: false, lyDo: 'da_dong', error: 'Ca đã khoá — không lưu thêm được' })
    const shT = sheetLuot_()
    const luotT = luotMoiNhatTheoSbd_(shT, maCa, true)[sbd] || null
    if (!luotT) return jsonResponse_({ ok: false, lyDo: 'chua_vao', error: 'Em này chưa vào thi' })
    if (luotT.trangThai !== 'dang_lam') return jsonResponse_({ ok: false, lyDo: 'khong_dang_lam', error: 'Lượt này không còn đang làm (' + luotT.trangThai + ')' })
    // Cột 9 DapAnJson · cột 21 CapNhatLuc · cột 22 GiayCauJson.
    shT.getRange(luotT.row, 9).setValue(JSON.stringify(body.dapAn || {}))
    shT.getRange(luotT.row, 21).setValue(new Date().toISOString())
    if (body.giayCau) shT.getRange(luotT.row, 22).setValue(JSON.stringify(body.giayCau))
    return jsonResponse_({ ok: true, serverNow: Date.now() })
  }

  if (action === 'khoaCa' || action === 'moKhoaCa') {
    // KHOÁ CA / MỞ CA LẠI thủ công (CATHIVAGOILENBANG mục 1).
    //
    // KHOÁ làm BA việc, ĐÚNG THỨ TỰ này — đảo thứ tự là có em lọt vào giữa
    // hai bước:
    //   1. Đặt TrangThai = 'dong' để chặn mọi lượt vào mới NGAY LẬP TỨC
    //   2. Mọi lượt 'dang_lam' chuyển 'da_nop', chấm theo bản LƯU TẠM gần nhất
    //   3. Ghi KhoaLuc, KhoaBoi
    //
    // MỞ LẠI đưa TrangThai về 'mo' VÀ GỠ HẠN VÀO PHÒNG (HetHanVao = rỗng).
    //
    // Vì sao phải gỡ cả hạn vào: cửa ca đóng vì HAI lý do khác nhau — thầy bấm
    // khoá, hoặc quá `HetHanVao`. Bản cũ chỉ mở lý do thứ nhất, nên em đến
    // muộn bấm link vẫn nhận `het_han_vao` dù thầy vừa bấm mở, và thầy phải
    // mở ca MỚI. Một nút MỞ CA phải mở được cả hai.
    //
    // Em đã bị nộp do khoá KHÔNG tự vào lại được — lượt của em là 'da_nop',
    // muốn thi lại phải qua `duyetThiLai` từng em như mọi trường hợp khác.
    const loi = kiemTraMaBiMat_(body)
    if (loi) return jsonResponse_({ ok: false, error: loi })
    const maCa = String(body.maCa || '').trim()
    const caSh = sheetCa_()
    const caRow = findRowByKey_(caSh, 0, maCa)
    if (caRow < 0) return jsonResponse_({ ok: false, error: 'Không có ca ' + maCa })
    const ca = docCa_(caSh, caRow)
    if (ca.trangThai === 'da_xoa') return jsonResponse_({ ok: false, error: 'Ca này đã bị xoá' })
    const luc = new Date().toISOString()
    const lock = LockService.getScriptLock()
    lock.waitLock(15000)
    try {
      if (action === 'moKhoaCa') {
        // KHÔNG chặn khi ca đang 'mo': ca chưa khoá mà QUÁ HẠN VÀO thì vẫn phải
        // mở được cửa. Bản cũ trả "Ca đang mở, không cần mở lại" đúng vào ca
        // này — thầy bấm mà không có gì xảy ra.
        const daKhoa = ca.trangThai === 'dong'
        const hanCu = ca.hetHanVao || ''
        if (!daKhoa && !hanCu) return jsonResponse_({ ok: false, error: 'Ca đang mở và không giới hạn giờ vào — không cần mở thêm' })
        if (daKhoa) caSh.getRange(caRow, 10).setValue('mo')
        // Cột 9 HetHanVao. Gỡ hạn = em đến muộn vào được ngay; đóng lại bằng
        // nút KHOÁ CA, không phải bằng đồng hồ.
        if (hanCu) caSh.getRange(caRow, 9).setValue('')
        caSh.getRange(caRow, 22).setValue(luc)
        return jsonResponse_({ ok: true, trangThai: 'mo', moKhoaLuc: luc, hetHanVao: '', goHanVao: !!hanCu, serverNow: Date.now() })
      }
      if (ca.trangThai === 'dong') return jsonResponse_({ ok: false, error: 'Ca đã khoá rồi' })
      // (1) chặn vào mới trước tiên
      caSh.getRange(caRow, 10).setValue('dong')
      // (2) nộp hộ em đang làm, theo bản lưu tạm gần nhất
      const sh = sheetLuot_()
      const data = sh.getDataRange().getValues()
      let daNop = 0
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) !== maCa) continue
        const l = docLuot_(data[i])
        if (l.trangThai !== 'dang_lam') continue
        const ghiChu = (l.ghiChu ? l.ghiChu + ' · ' : '') + 'thầy khoá ca ' + luc.slice(11, 16) + 'Z, nộp phần đã làm'
        // Cột 7 NopLuc · 8 TrangThai. KHÔNG đụng cột 9 DapAnJson: giữ nguyên
        // bản lưu tạm cuối cùng — đó chính là phần em đã làm.
        sh.getRange(i + 1, 7, 1, 2).setValues([[luc, 'da_nop']])
        sh.getRange(i + 1, 20, 1, 2).setValues([[ghiChu, luc]])
        daNop++
      }
      // (3) dấu vết
      caSh.getRange(caRow, 20, 1, 2).setValues([[luc, String(body.khoaBoi || 'thầy')]])
      return jsonResponse_({ ok: true, trangThai: 'dong', khoaLuc: luc, soEmBiNop: daNop, serverNow: Date.now() })
    } finally {
      lock.releaseLock()
    }
  }

  if (action === 'registerParent') {
    // Đăng ký = XIN, chưa phải được vào (BA-APP.md mục 4E). Thầy duyệt mới
    // cấp token. Ghi đè hồ sơ cũ KHÔNG được xoá token/trạng thái đã duyệt.
    const sh = sheetPH_()
    const row = timDongPH_(sh, body.sdt)
    const rowData = [String(body.sdt || ''), body.hoTenPhuHuynh, body.sbd, body.lop, body.hoTenHocSinh, new Date().toISOString()]
    if (row > 0) {
      sh.getRange(row, 1).setNumberFormat('@')
      sh.getRange(row, 1, 1, 6).setValues([rowData])
      const ttCu = String(sh.getRange(row, PH_COT_TRANGTHAI + 1).getValue() || '')
      if (!ttCu) sh.getRange(row, PH_COT_TRANGTHAI + 1).setValue('cho_duyet')
    } else {
      sh.appendRow(rowData.concat(['', 'cho_duyet', '']))
      sh.getRange(sh.getLastRow(), 1).setNumberFormat('@').setValue(String(body.sdt || ''))
    }
    return jsonResponse_({ ok: true, choDuyet: true })
  }

  if (action === 'danhSachChoDuyet') {
    // Màn Quản lý đăng ký của thầy: ai đang chờ duyệt, ai đã có link riêng.
    const loi = kiemTraMaBiMat_(body)
    if (loi) return jsonResponse_({ ok: false, error: loi })
    const hsSh = sheetHS_()
    const hsData = hsSh.getDataRange().getValues()
    const hs = []
    for (let i = 1; i < hsData.length; i++) {
      hs.push({
        sbd: String(hsData[i][0]),
        hoTen: String(hsData[i][1] || ''),
        namSinh: String(hsData[i][2] || ''),
        lop: String(hsData[i][3] || ''),
        dangKyLuc: hsData[i][4],
        sdt: String(hsData[i][5] || ''),
        sdtPhuHuynh: String(hsData[i][6] || ''),
        token: String(hsData[i][HS_COT_TOKEN] || ''),
        trangThai: String(hsData[i][HS_COT_TRANGTHAI] || ''),
      })
    }
    const phSh = sheetPH_()
    const phData = phSh.getDataRange().getValues()
    const ph = []
    for (let i = 1; i < phData.length; i++) {
      ph.push({
        sdt: String(phData[i][0]),
        hoTenPhuHuynh: String(phData[i][1] || ''),
        sbd: String(phData[i][2]),
        lop: String(phData[i][3] || ''),
        hoTenHocSinh: String(phData[i][4] || ''),
        dangKyLuc: phData[i][5],
        token: String(phData[i][PH_COT_TOKEN] || ''),
        trangThai: String(phData[i][PH_COT_TRANGTHAI] || ''),
      })
    }
    return jsonResponse_({ ok: true, hocSinh: hs, phuHuynh: ph, serverNow: Date.now() })
  }

  if (action === 'duyetHoSo' || action === 'capLaiToken') {
    // duyetHoSo: duyệt lần đầu, cấp token nếu chưa có.
    // capLaiToken: em/phụ huynh mất máy hoặc lộ link — token cũ mất hiệu lực NGAY.
    const loi = kiemTraMaBiMat_(body)
    if (loi) return jsonResponse_({ ok: false, error: loi })
    const laHS = String(body.loai || '') === 'hs'
    const sh = laHS ? sheetHS_() : sheetPH_()
    const row = laHS ? findRowByKey_(sh, 0, body.khoa) : timDongPH_(sh, body.khoa)
    if (row < 0) return jsonResponse_({ ok: false, error: 'Không tìm thấy hồ sơ' })
    const cotToken = (laHS ? HS_COT_TOKEN : PH_COT_TOKEN) + 1
    const cotTrangThai = (laHS ? HS_COT_TRANGTHAI : PH_COT_TRANGTHAI) + 1
    const cotDuyet = cotTrangThai + 1
    let token = chuanToken_(sh.getRange(row, cotToken).getValue())
    if (action === 'capLaiToken' || token.length !== 32) token = sinhToken_()
    sh.getRange(row, cotToken).setValue(token)
    sh.getRange(row, cotTrangThai).setValue('da_duyet')
    sh.getRange(row, cotDuyet).setValue(new Date().toISOString())
    return jsonResponse_({ ok: true, token: token, duong: (laHS ? 'hs' : 'ph') + '/' + token })
  }

  if (action === 'hoSoEm') {
    // HỒ SƠ MỘT EM (BA-APP.md đợt 2) — MỘT lệnh trả đủ: thông tin, bảng chuyên
    // đề mạnh/yếu (đã tổng hợp sẵn), xu hướng ↑↓, lịch sử ca thi kèm hạng lớp.
    // Quyền: mã bí mật (thầy, chọn SBD bất kỳ) · token học sinh (chỉ của mình)
    // · token phụ huynh (chỉ con mình). KHÔNG tin SBD máy khách gửi khi có token.
    let sbd = ''
    if (!kiemTraMaBiMat_(body)) {
      sbd = String(body.sbd || '').trim()
    } else if (body.tokenHS) {
      const hs = hsTuToken_(body.tokenHS)
      if (!hs) return jsonResponse_({ ok: false, error: 'Link không hợp lệ hoặc đã bị thu hồi' })
      sbd = hs.sbd
    } else if (body.tokenPH) {
      const ph = phTuToken_(body.tokenPH)
      if (!ph) return jsonResponse_({ ok: false, error: 'Link không hợp lệ hoặc đã bị thu hồi' })
      sbd = ph.sbd
    } else {
      return jsonResponse_({ ok: false, error: 'Không có quyền' })
    }
    if (!sbd) return jsonResponse_({ ok: false, error: 'Thiếu số báo danh' })
    const ho = hoSoTuBang_(sbd, docBangHoSo_())
    ho.ok = true
    ho.serverNow = Date.now()
    return jsonResponse_(ho)
  }

  // HỒ SƠ NHIỀU EM MỘT LƯỢT — để máy thầy dựng phiếu cả ca mà không phải gọi
  // `hoSoEm` từng em (tối ưu 06/09).
  //
  // Mỗi lượt `hoSoEm` đọc TRỌN ba sheet: TienDoCa, LuotThi 17 cột, CaKiemTra.
  // Ca ba chục em là chín chục lượt đọc sheet, mà nội dung ba sheet đó y hệt
  // nhau ở cả ba chục lượt. Lệnh này đọc ĐÚNG MỘT LẦN rồi tính cho từng em.
  // Chỉ thầy gọi được: nó trả hồ sơ của nhiều em cùng lúc.
  if (action === 'hoSoNhieuEm') {
    const loiHS = kiemTraMaBiMat_(body)
    if (loiHS) return jsonResponse_({ ok: false, error: loiHS })
    const ds = Array.isArray(body.sbd) ? body.sbd : []
    if (ds.length === 0) return jsonResponse_({ ok: true, items: [], serverNow: Date.now() })
    if (ds.length > TRAN_HO_SO_NHIEU) return jsonResponse_({ ok: false, error: 'Xin quá ' + TRAN_HO_SO_NHIEU + ' em một lượt' })
    const bang = docBangHoSo_()
    const items = []
    for (let i = 0; i < ds.length; i++) {
      const s1 = String(ds[i] || '').trim()
      if (!s1) continue
      items.push(hoSoTuBang_(s1, bang))
    }
    return jsonResponse_({ ok: true, items: items, serverNow: Date.now() })
  }

  if (action === 'phDongYGiaoBai') {
    // Phụ huynh bấm ĐỒNG Ý GIAO BÀI trên phiếu kết quả (BA-APP.md mục 4B).
    // Chỉ ghi YÊU CẦU — việc rút câu do máy thầy làm (kho đề ở Drive).
    const ph = phTuToken_(body.tokenPH)
    if (!ph) return jsonResponse_({ ok: false, error: 'Link không hợp lệ hoặc đã bị thu hồi' })
    const sh = getSheet_(SHEET_YEUCAU, YEUCAU_HEADERS)
    boSungTieuDe_(sh, YEUCAU_HEADERS)
    const data = sh.getDataRange().getValues()
    // Một em chỉ có MỘT yêu cầu đang chờ — bấm nhiều lần không tạo nhiều bài.
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][1]) === ph.sbd && String(data[i][6]) === 'cho') {
        return jsonResponse_({ ok: true, daCo: true, id: String(data[i][0]), serverNow: Date.now() })
      }
    }
    const id = Utilities.getUuid()
    const soCau = Number(body.soCau) > 0 ? Number(body.soCau) : SO_CAU_YEU_CAU_MAC_DINH
    const chuyenDe = Array.isArray(body.chuyenDe) ? body.chuyenDe.join('|') : String(body.chuyenDe || '')
    sh.appendRow([id, ph.sbd, chuyenDe, soCau, new Date().toISOString(), 'phu_huynh', 'cho', '', ''])
    return jsonResponse_({ ok: true, daCo: false, id: id, serverNow: Date.now() })
  }

  if (action === 'danhSachYeuCau') {
    // Hàng chờ cho máy thầy. Mặc định chỉ trả yêu cầu đang chờ.
    const loi = kiemTraMaBiMat_(body)
    if (loi) return jsonResponse_({ ok: false, error: loi })
    const sh = getSheet_(SHEET_YEUCAU, YEUCAU_HEADERS)
    boSungTieuDe_(sh, YEUCAU_HEADERS)
    const data = sh.getDataRange().getValues()
    const tatCa = body.tatCa === true
    const items = []
    for (let i = 1; i < data.length; i++) {
      const tt = String(data[i][6] || '')
      if (!tatCa && tt !== 'cho') continue
      items.push({
        id: String(data[i][0]),
        sbd: String(data[i][1]),
        hoTen: tenHocSinh_(String(data[i][1])),
        chuyenDe: String(data[i][2] || '').split('|').filter(function (x) { return x }),
        soCau: Number(data[i][3]) || SO_CAU_YEU_CAU_MAC_DINH,
        taoLuc: String(data[i][4] || ''),
        taoBoi: String(data[i][5] || ''),
        trangThai: tt,
        maCa: String(data[i][8] || ''),
      })
    }
    items.sort(function (a, b) { return msCua_(a.taoLuc) - msCua_(b.taoLuc) })
    return jsonResponse_({ ok: true, items: items, serverNow: Date.now() })
  }

  if (action === 'danhDauYeuCau') {
    // Máy thầy đã giao xong (hoặc thầy bỏ qua) → đóng yêu cầu.
    const loi = kiemTraMaBiMat_(body)
    if (loi) return jsonResponse_({ ok: false, error: loi })
    const sh = getSheet_(SHEET_YEUCAU, YEUCAU_HEADERS)
    const row = findRowByKey_(sh, 0, body.id)
    if (row < 0) return jsonResponse_({ ok: false, error: 'Không tìm thấy yêu cầu' })
    sh.getRange(row, 7, 1, 3).setValues([[String(body.trangThai || 'xong'), new Date().toISOString(), String(body.maCa || '')]])
    return jsonResponse_({ ok: true, serverNow: Date.now() })
  }

  if (action === 'qidDaLam') {
    // Tập câu em ĐÃ từng làm — máy thầy dùng để rút bài tập tránh câu cũ.
    const loi = kiemTraMaBiMat_(body)
    if (loi) return jsonResponse_({ ok: false, error: loi })
    const sbd = String(body.sbd || '').trim()
    const qData = getSheet_(SHEET_QID, QID_HEADERS).getDataRange().getValues()
    for (let i = 1; i < qData.length; i++) {
      if (String(qData[i][0]) === sbd) {
        const ds = String(qData[i][1] || '').split(',').filter(function (x) { return x })
        return jsonResponse_({ ok: true, qids: ds, serverNow: Date.now() })
      }
    }
    return jsonResponse_({ ok: true, qids: [], serverNow: Date.now() })
  }

  if (action === 'baiTapCuaEm') {
    // Danh sách BÀI TẬP VỀ NHÀ của một em (BA-APP.md đợt 3). Quyền: token học
    // sinh · token phụ huynh (xem bài của con) · mã bí mật + sbd (máy thầy).
    let sbd = ''
    if (!kiemTraMaBiMat_(body)) {
      sbd = String(body.sbd || '').trim()
    } else if (body.tokenHS) {
      const hs = hsTuToken_(body.tokenHS)
      if (!hs) return jsonResponse_({ ok: false, error: 'Link không hợp lệ hoặc đã bị thu hồi' })
      sbd = hs.sbd
    } else if (body.tokenPH) {
      const ph = phTuToken_(body.tokenPH)
      if (!ph) return jsonResponse_({ ok: false, error: 'Link không hợp lệ hoặc đã bị thu hồi' })
      sbd = ph.sbd
    } else {
      return jsonResponse_({ ok: false, error: 'Không có quyền' })
    }
    if (!sbd) return jsonResponse_({ ok: false, error: 'Thiếu số báo danh' })

    // Lượt của em: (maCa -> trạng thái, nộp lúc) — chỉ đọc cột cần.
    const luotSh = sheetLuot_()
    const nLuot = luotSh.getLastRow()
    const luotData = nLuot > 0 ? luotSh.getRange(1, 1, nLuot, 17).getValues() : []
    const luotCua = {}
    for (let i = 1; i < luotData.length; i++) {
      if (String(luotData[i][1]) !== sbd) continue
      const mc = String(luotData[i][0])
      const lan = Number(luotData[i][2]) || 1
      if (!luotCua[mc] || lan >= luotCua[mc].lanThu) {
        luotCua[mc] = {
          lanThu: lan,
          trangThai: String(luotData[i][7] || ''),
          nopLuc: String(luotData[i][6] || ''),
          tong: luotData[i][16] === '' || luotData[i][16] === null ? null : Number(luotData[i][16]),
        }
      }
    }

    const now = Date.now()
    const caRows = sheetCa_().getDataRange().getValues()
    const items = []
    for (let i = 1; i < caRows.length; i++) {
      if (String(caRows[i][17] || '') !== 'baitap') continue
      if (String(caRows[i][9]) === 'da_xoa') continue
      // Bài tập luôn giao đích danh (PhamVi = chon) — chỉ trả bài của đúng em này.
      let ds = []
      try { ds = JSON.parse(String(caRows[i][12] || '[]')) } catch (err) { ds = [] }
      if (!ds.some(function (x) { return String(x).trim() === sbd })) continue
      const mc = String(caRows[i][0])
      const l = luotCua[mc]
      const hanNop = caRows[i][18] ? String(caRows[i][18]) : ''
      const hetHan = hanNop ? msCua_(hanNop) : NaN
      let trangThai = 'chua_lam'
      if (l && (l.trangThai === 'da_nop' || l.trangThai === 'khoa')) trangThai = 'da_nop'
      else if (l && l.trangThai === 'dang_lam') trangThai = 'dang_lam'
      else if (isFinite(hetHan) && now > hetHan) trangThai = 'qua_han'
      items.push({
        maCa: mc,
        tenCa: String(caRows[i][10] || ''),
        giaoLuc: String(caRows[i][3] || ''),
        hanNop: hanNop,
        trangThai: trangThai,
        nopLuc: l ? l.nopLuc : '',
        tong: l ? l.tong : null,
      })
    }
    items.sort(function (a, b) { return msCua_(b.giaoLuc) - msCua_(a.giaoLuc) })
    return jsonResponse_({ ok: true, sbd: sbd, items: items, serverNow: Date.now() })
  }

  if (action === 'danhSachEm') {
    // Danh sách em cho màn HỌC SINH của thầy: hồ sơ + điểm gần nhất + số ca.
    const loi = kiemTraMaBiMat_(body)
    if (loi) return jsonResponse_({ ok: false, error: loi })
    // DANH SÁCH CHÍNH THỨC LÀ SHEET DanhSachLop (file thầy nạp) — thầy đồng bộ
    // xong là thấy đủ mọi em ngay, không phải chờ em vào thi mới có tên. Em nào
    // đã có hồ sơ riêng trong HocSinh (thi rồi, hoặc dữ liệu cũ) thì gộp thêm,
    // KHÔNG bỏ sót em cũ khi danh sách mới chưa có tên em đó.
    const hsSh = sheetHS_()
    const hsData = hsSh.getDataRange().getValues()
    const luotData = sheetLuot_().getDataRange().getValues()
    const moiNhat = {}
    const soCa = {}
    const tenTuLuot = {}
    const soCaTheoCa = {}
    for (let i = 1; i < luotData.length; i++) {
      const tt = String(luotData[i][7])
      if (tt !== 'da_nop' && tt !== 'khoa') continue
      const sbd = String(luotData[i][1])
      soCa[sbd] = (soCa[sbd] || 0) + 1
      if (!soCaTheoCa[sbd]) soCaTheoCa[sbd] = []
      soCaTheoCa[sbd].push(String(luotData[i][0]))
      if (!tenTuLuot[sbd] && luotData[i][12]) tenTuLuot[sbd] = String(luotData[i][12])
      const tong = luotData[i][16]
      if (tong === '' || tong === null || tong === undefined) continue
      const nop = String(luotData[i][6] || '')
      if (!moiNhat[sbd] || msCua_(nop) > msCua_(moiNhat[sbd].nopLuc)) moiNhat[sbd] = { nopLuc: nop, tong: Number(tong), maCa: String(luotData[i][0]) }
    }
    // Hồ sơ riêng theo SBD, để ghép tên/lớp cho em nào đã có.
    const hoSo = {}
    for (let i = 1; i < hsData.length; i++) {
      const sbd = String(hsData[i][0]).trim()
      if (!sbd) continue
      hoSo[sbd] = {
        hoTen: String(hsData[i][1] || ''),
        namSinh: String(hsData[i][2] || ''),
        lop: String(hsData[i][3] || ''),
        trangThai: String(hsData[i][HS_COT_TRANGTHAI] || ''),
      }
    }

    const dsLop = docDanhSachLop_()
    const items = []
    const daRa = {}
    function them_(sbd, hoTen, namSinh, lop, trangThai) {
      if (!sbd || daRa[sbd]) return
      daRa[sbd] = true
      items.push({
        sbd: sbd,
        hoTen: hoTen,
        namSinh: namSinh,
        lop: lop,
        trangThai: trangThai,
        soCa: soCa[sbd] || 0,
        diemGanNhat: moiNhat[sbd] ? moiNhat[sbd].tong : null,
        caGanNhat: moiNhat[sbd] ? moiNhat[sbd].maCa : '',
        nopGanNhat: moiNhat[sbd] ? moiNhat[sbd].nopLuc : '',
      })
    }
    // Danh sách thầy nạp đi trước; hồ sơ riêng chỉ bù chỗ thầy để trống.
    for (let i = 0; i < dsLop.length; i++) {
      const e = dsLop[i]
      const h = hoSo[e.sbd]
      them_(e.sbd, e.hoTen || (h ? h.hoTen : ''), e.namSinh || (h ? h.namSinh : ''), e.lop || (h ? h.lop : ''), h ? h.trangThai : '')
    }
    // Em có hồ sơ mà KHÔNG có trong danh sách mới: vẫn hiện, gắn cờ để thầy
    // biết — em đó không vào thi được nữa.
    const dsSbdHoSo = Object.keys(hoSo)
    for (let i = 0; i < dsSbdHoSo.length; i++) {
      const sbd = dsSbdHoSo[i]
      const h = hoSo[sbd]
      them_(sbd, h.hoTen, h.namSinh, h.lop, dsLop.length ? 'ngoai_danh_sach' : h.trangThai)
    }
    // Em ĐÃ LÀM BÀI mà không còn ở hai chỗ trên (danh sách thay rồi, hồ sơ đã
    // xoá): KHÔNG được biến mất — điểm của em vẫn nằm trong LuotThi và thầy
    // vẫn phải xem được. Tên lấy từ chính dòng lượt thi.
    //
    // NHƯNG chỉ tính lượt của ca CÒN TỒN TẠI: thầy xoá hẳn một ca là xoá cả bài
    // làm của ca đó, để lại lượt mồ côi trong LuotThi. Không lọc thì màn Học
    // sinh đầy số báo danh của các ca thử đã xoá từ đời nào.
    const caSong = {}
    const caSh = sheetCa_()
    const soDongCa = caSh.getLastRow()
    if (soDongCa > 1) {
      // Cột 0 = MaCa, cột 9 = TrangThai. Ca xoá MỀM (TrangThai='da_xoa') vẫn
      // nằm trong sheet — không loại nó ra thì bộ lọc này vô nghĩa.
      const caVals = caSh.getRange(1, 1, soDongCa, 10).getValues()
      for (let i = 1; i < caVals.length; i++) {
        if (String(caVals[i][9] || 'mo') === 'da_xoa') continue
        caSong[String(caVals[i][0])] = true
      }
    }
    const dsSbdLuot = Object.keys(soCaTheoCa)
    for (let i = 0; i < dsSbdLuot.length; i++) {
      const sbd = dsSbdLuot[i]
      let coCaSong = false
      for (let j = 0; j < soCaTheoCa[sbd].length; j++) {
        if (caSong[soCaTheoCa[sbd][j]]) { coCaSong = true; break }
      }
      if (!coCaSong) continue
      them_(sbd, tenTuLuot[sbd] || '', '', '', dsLop.length ? 'ngoai_danh_sach' : '')
    }
    return jsonResponse_({ ok: true, items: items, serverNow: Date.now() })
  }

  if (action === 'napDanhSachLop') {
    // App thầy đẩy bản sao danh sách lớp (Google Sheet của thầy) lên đây, để
    // máy chủ tra được HỌ TÊN khi em vào thi lần đầu — em chỉ gõ số báo danh.
    // GHI ĐÈ TOÀN BỘ: sheet gốc của thầy là nguồn sự thật duy nhất, bản này chỉ
    // là bản sao. Không đụng gì tới sheet HocSinh (điểm, token, em tự vào thi).
    const loi = kiemTraMaBiMat_(body)
    if (loi) return jsonResponse_({ ok: false, error: loi })
    const items = body.items || []
    if (!items.length) return jsonResponse_({ ok: false, error: 'Danh sách rỗng — không ghi đè' })
    const sh = getSheet_(SHEET_DSLOP, DSLOP_HEADERS)
    const luc = new Date().toISOString()
    const rows = []
    const daCo = {}
    for (let i = 0; i < items.length; i++) {
      const sbd = String(items[i].sbd || '').trim()
      if (!sbd || daCo[sbd]) continue // số báo danh trùng trong sheet của thầy: giữ dòng đầu
      daCo[sbd] = true
      rows.push([sbd, String(items[i].hoTen || '').trim(), String(items[i].namSinh || '').trim(), String(items[i].lop || '').trim(), luc])
    }
    if (!rows.length) return jsonResponse_({ ok: false, error: 'Không dòng nào có số báo danh' })
    // SO VỚI BẢN ĐANG CÓ TRƯỚC KHI GHI ĐÈ (thầy chốt 07/09). Đây là CỔNG VÀO
    // THI: em bị bỏ khỏi danh sách là em đó đứng ngoài phòng thi buổi sau. Nói
    // "đã đồng bộ" suông thì thầy không có cách nào biết mình vừa gạch tên ai.
    var cuDS = docDanhSachLop_()
    var cuTheo = {}
    for (var ci = 0; ci < cuDS.length; ci++) cuTheo[cuDS[ci].sbd] = cuDS[ci]
    var moiTheo = {}
    for (var mi = 0; mi < rows.length; mi++) moiTheo[rows[mi][0]] = { sbd: rows[mi][0], hoTen: rows[mi][1] }
    var themDS = []
    var boDS = []
    var doiTenDS = []
    for (var ai = 0; ai < rows.length; ai++) {
      var cuA = cuTheo[rows[ai][0]]
      if (!cuA) themDS.push({ sbd: rows[ai][0], hoTen: rows[ai][1] })
      else if (chuanTen_(cuA.hoTen) !== chuanTen_(rows[ai][1])) doiTenDS.push({ sbd: rows[ai][0], cu: cuA.hoTen, moi: rows[ai][1] })
    }
    for (var bi = 0; bi < cuDS.length; bi++) if (!moiTheo[cuDS[bi].sbd]) boDS.push({ sbd: cuDS[bi].sbd, hoTen: cuDS[bi].hoTen })
    sh.clear()
    sh.appendRow(DSLOP_HEADERS)
    sh.getRange(2, 1, rows.length, DSLOP_HEADERS.length).setValues(rows)
    return jsonResponse_({ ok: true, soDong: rows.length, capNhatLuc: luc, them: themDS, bo: boDS, doiTen: doiTenDS })
  }

  if (action === 'linkDanhSachLop' || action === 'luuLinkDanhSachLop') {
    // LINK DANH SÁCH LỚP (thầy chốt 07/09) — thầy dán MỘT LẦN, máy chủ giữ hộ.
    //
    // Chỉ GIỮ LINK, không tải. Máy thầy tự tải CSV rồi đẩy lên bằng
    // `napDanhSachLop`: tệp "Xuất bản lên web" của Google có gắn nhãn CORS nên
    // trình duyệt đọc thẳng được, mà `UrlFetchApp` thì đòi thêm quyền
    // `script.external_request` — thêm quyền là phải xin lại uỷ quyền cho CẢ
    // ứng dụng web, làm giữa buổi dạy là chặn hết em đang thi. Không đáng.
    //
    // Link nằm ở Script property nên thầy đổi máy, mở app trên điện thoại vẫn
    // còn, không phải dán lại.
    const loiLK = kiemTraMaBiMat_(body)
    if (loiLK) return jsonResponse_({ ok: false, error: loiLK })
    if (action === 'luuLinkDanhSachLop') {
      var dsLK = []
      if (Object.prototype.toString.call(body.links) === '[object Array]') {
        for (var iLK = 0; iLK < body.links.length; iLK++) {
          var lk = String(body.links[iLK] || '').trim()
          if (lk) dsLK.push(lk)
        }
      }
      luuLinkDsLop_(dsLK)
      return jsonResponse_({ ok: true, links: dsLK })
    }
    return jsonResponse_({ ok: true, links: docLinkDsLop_() })
  }

  if (action === 'huyDuyet') {
    // Thu hồi quyền vào mà KHÔNG xoá hồ sơ (em nghỉ học, phụ huynh đăng ký nhầm).
    const loi = kiemTraMaBiMat_(body)
    if (loi) return jsonResponse_({ ok: false, error: loi })
    const laHS = String(body.loai || '') === 'hs'
    const sh = laHS ? sheetHS_() : sheetPH_()
    const row = laHS ? findRowByKey_(sh, 0, body.khoa) : timDongPH_(sh, body.khoa)
    if (row < 0) return jsonResponse_({ ok: false, error: 'Không tìm thấy hồ sơ' })
    sh.getRange(row, (laHS ? HS_COT_TOKEN : PH_COT_TOKEN) + 1).setValue('')
    sh.getRange(row, (laHS ? HS_COT_TRANGTHAI : PH_COT_TRANGTHAI) + 1).setValue('cho_duyet')
    return jsonResponse_({ ok: true })
  }

  if (action === 'sendFeedback') {
    // AI ĐƯỢC ĐẶT ĐIỂM Ở ĐÂY. Trước 08/09 lệnh này KHÔNG kiểm gì cả mà vẫn ghi
    // thẳng cột 14..17 của LuotThi — nghĩa là bất kỳ máy nào cũng đặt được điểm
    // cho bất kỳ em nào, và máy em bản cũ đè điểm sai lên điểm thầy vừa chấm.
    // Nay hai lớp: (1) đúng thiết bị của chính lượt đó, (2) đúng tem luật chấm.
    // Máy thầy có MA_BI_MAT thì qua thẳng.
    const coMatNX = !kiemTraMaBiMat_(body)
    const luotNX = luotMoiNhatTheoSbd_(sheetLuot_(), body.maCa, true)[String(body.sbd)]
    if (!coMatNX && luotNX && !(body.idThietBi && luotNX.idThietBi && String(body.idThietBi) === String(luotNX.idThietBi))) {
      return jsonResponse_({ ok: false, lyDo: 'khong_co_quyen', error: 'Không có quyền ghi nhận xét cho lượt này' })
    }
    if (!duocGhiDiem_(coMatNX, body)) {
      // Bản app cũ: KHÔNG ghi gì. Điểm cũ của thầy giữ nguyên, không đẻ dòng
      // nhận xét mang con số sai gửi tới phụ huynh.
      return jsonResponse_({ ok: true, boQua: 'ban_cu', serverNow: Date.now() })
    }
    const sh = getSheet_(SHEET_NHANXET, ['SBD', 'MaCa', 'MaDe', 'ThoiGianNop', 'Diem', 'XepLoai', 'CauSai', 'GuiLuc'])
    const data = sh.getDataRange().getValues()
    let foundRow = -1
    for (let i = 1; i < data.length; i++) {
      // Khoá trùng theo SBD+MaCa — 1 ca kiểm tra chỉ có 1 nhận xét cho 1 em,
      // gửi lại (vd thầy chấm lại) thì ghi đè, không tạo dòng trùng.
      if (String(data[i][0]) === String(body.sbd) && String(data[i][1]) === String(body.maCa)) {
        foundRow = i + 1
        break
      }
    }
    const rowData = [
      body.sbd,
      body.maCa,
      body.maDe,
      body.thoiGianNop || new Date().toISOString(),
      body.diem,
      body.xepLoai,
      JSON.stringify(body.cauSai || {}),
      new Date().toISOString(),
    ]
    if (foundRow > 0) {
      sh.getRange(foundRow, 1, 1, 8).setValues([rowData])
    } else {
      sh.appendRow(rowData)
    }
    // Ghi điểm vào dòng lượt mới nhất của em trong LuotThi (cột 14..17) để
    // Lịch sử ca thi hiện điểm mà không cần chấm lại. diemPhan có thể thiếu
    // (bản app cũ) → chỉ ghi Tong.
    try {
      if (luotNX) {
        const p = body.diemPhan || {}
        sheetLuot_().getRange(luotNX.row, 14, 1, 4).setValues([[p.I === undefined ? '' : p.I, p.II === undefined ? '' : p.II, p.III === undefined ? '' : p.III, body.diem]])
      }
    } catch (err) {}
    return jsonResponse_({ ok: true })
  }

  if (action === 'examStatus') {
    // Trạng thái LÀM BÀI THỜI GIAN THỰC của 1 em — mỗi em 1 dòng duy nhất
    // (khoá theo SBD), lần cập nhật sau ghi đè lần trước. Học sinh tự động
    // gửi lên định kỳ trong lúc làm bài + gửi ngay mỗi lần rời màn hình, để
    // phụ huynh xem gần-như-thời-gian-thực (poll lại, không phải đẩy tức thì
    // thật sự vì Apps Script không hỗ trợ push).
    const sh = getSheet_(SHEET_TRANGTHAI, [
      'SBD',
      'MaCa',
      'Lop',
      'DangLam',
      'BatDauLuc',
      'DaLamCauHoi',
      'TongCauHoi',
      'SoLanRoiApp',
      'Blocked',
      'CapNhatLuc',
    ])
    const row = findRowByKey_(sh, 0, body.sbd)
    const rowData = [
      body.sbd,
      body.maCa,
      body.lop || '',
      body.dangLam ? 'true' : 'false',
      body.batDauLuc || new Date().toISOString(),
      body.daLamCauHoi || 0,
      body.tongCauHoi || 0,
      body.soLanRoiApp || 0,
      body.blocked ? 'true' : 'false',
      new Date().toISOString(),
    ]
    if (row > 0) {
      sh.getRange(row, 1, 1, 10).setValues([rowData])
    } else {
      sh.appendRow(rowData)
    }
    // serverNow: máy em hiệu chỉnh lại đồng hồ theo giờ máy chủ mỗi lần đẩy
    // trạng thái (10 giây/lần) — đổi giờ điện thoại giữa chừng cũng vô ích.
    return jsonResponse_({ ok: true, serverNow: Date.now() })
  }

  if (action === 'sendMessage') {
    // Phụ huynh HOẶC học sinh nhắn tin trực tiếp cho thầy — lưu nguyên văn,
    // không chỉnh sửa gì. body.nguoiGui = 'phuhuynh' | 'hocsinh'.
    const sh = getSheet_(SHEET_TINNHAN, ['Id', 'SDT', 'HoTenPhuHuynh', 'SBD', 'Lop', 'HoTenHocSinh', 'NoiDung', 'ThoiGian', 'DaDoc', 'NguoiGui'])
    const id = Utilities.getUuid()
    sh.appendRow([
      id,
      body.sdt || '',
      body.hoTenPhuHuynh || '',
      body.sbd || '',
      body.lop || '',
      body.hoTenHocSinh || '',
      body.noiDung,
      new Date().toISOString(),
      'false',
      body.nguoiGui || 'phuhuynh',
    ])
    return jsonResponse_({ ok: true, id: id })
  }

  if (action === 'markMessagesRead') {
    const sh = getSheet_(SHEET_TINNHAN, ['Id', 'SDT', 'HoTenPhuHuynh', 'SBD', 'Lop', 'HoTenHocSinh', 'NoiDung', 'ThoiGian', 'DaDoc', 'NguoiGui'])
    const data = sh.getDataRange().getValues()
    const ids = body.ids || []
    for (let i = 1; i < data.length; i++) {
      if (ids.indexOf(data[i][0]) >= 0) {
        sh.getRange(i + 1, 9).setValue('true')
      }
    }
    return jsonResponse_({ ok: true })
  }

  if (action === 'registerStudent') {
    // Học sinh đăng ký hồ sơ 1 lần (SBD + họ tên + năm sinh) — để tự điền
    // sẵn SBD lúc vào thi và nhắn tin cho thầy có tên hiển thị rõ ràng.
    const sh = sheetHS_()
    const row = findRowByKey_(sh, 0, body.sbd)
    const rowData = [body.sbd, body.hoTen, body.namSinh, body.lop || '', new Date().toISOString(), String(body.sdt || ''), String(body.sdtPhuHuynh || '')]
    if (row > 0) {
      sh.getRange(row, 1, 1, 7).setValues([rowData])
      const ttCu = String(sh.getRange(row, HS_COT_TRANGTHAI + 1).getValue() || '')
      if (!ttCu) sh.getRange(row, HS_COT_TRANGTHAI + 1).setValue('cho_duyet')
    } else {
      sh.appendRow(rowData.concat(['', 'cho_duyet', '']))
    }
    return jsonResponse_({ ok: true, choDuyet: true })
  }

  if (action === 'deleteParent') {
    // CHỈ thầy dùng (từ màn quản lý) — phụ huynh không có nút này trong app,
    // đăng ký xong không tự "đăng xuất/đăng ký lại" được, đúng theo yêu cầu.
    const loiDP = kiemTraMaBiMat_(body)
    if (loiDP) return jsonResponse_({ ok: false, error: loiDP })
    const sh = sheetPH_()
    const row = timDongPH_(sh, body.sdt)
    if (row > 0) sh.deleteRow(row)
    return jsonResponse_({ ok: true })
  }

  if (action === 'deleteStudent') {
    const loiDS = kiemTraMaBiMat_(body)
    if (loiDS) return jsonResponse_({ ok: false, error: loiDS })
    const sh = sheetHS_()
    const row = findRowByKey_(sh, 0, body.sbd)
    if (row > 0) sh.deleteRow(row)
    return jsonResponse_({ ok: true })
  }

  if (action === 'sendTeacherMessage') {
    // Thầy gửi tin nhắn cho 1 em (theo SBD) — phụ huynh/học sinh của em đó
    // sẽ thấy khi app tự poll lại (parentInbox/studentInbox). Phải có mã bí
    // mật: không ai được mạo danh thầy nhắn cho học sinh.
    const loiTM = kiemTraMaBiMat_(body)
    if (loiTM) return jsonResponse_({ ok: false, error: loiTM })
    const sh = getSheet_(SHEET_TINTHAY, ['Id', 'SBD', 'NoiDung', 'ThoiGian', 'DaXem'])
    const id = Utilities.getUuid()
    sh.appendRow([id, body.sbd, body.noiDung, new Date().toISOString(), 'false'])
    return jsonResponse_({ ok: true, id: id })
  }

  if (action === 'markTeacherMessagesRead') {
    const sh = getSheet_(SHEET_TINTHAY, ['Id', 'SBD', 'NoiDung', 'ThoiGian', 'DaXem'])
    const data = sh.getDataRange().getValues()
    const ids = body.ids || []
    for (let i = 1; i < data.length; i++) {
      if (ids.indexOf(data[i][0]) >= 0) {
        sh.getRange(i + 1, 5).setValue('true')
      }
    }
    return jsonResponse_({ ok: true })
  }

  return jsonResponse_({ error: 'Thiếu hoặc sai tham số action' })
}
