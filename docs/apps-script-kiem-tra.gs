// ============================================================================
// APPS SCRIPT NHẬN BÀI KIỂM TRA — dán file này vào script.google.com
// ============================================================================
// CÁCH TRIỂN KHAI (thầy tự làm, 1 lần cho mỗi lớp hoặc dùng chung 1 file cho
// mọi lớp cũng được — sheet tự phân biệt theo cột "Lớp"):
//
// 1. Mở https://script.google.com → "Dự án mới" (New project).
// 2. Xoá hết code mẫu, dán TOÀN BỘ nội dung file này vào.
// 3. Đổi SPREADSHEET_ID bên dưới thành ID của 1 Google Sheet thầy đã tạo
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
const SHEET_CA = 'CaKiemTra'
const SHEET_BAILAM = 'BaiLam'
const SHEET_PHUHUYNH = 'PhuHuynh'
const SHEET_NHANXET = 'NhanXet'
const SHEET_TRANGTHAI = 'TrangThai'
const SHEET_TINNHAN = 'TinNhan'
const SHEET_HOCSINH = 'HocSinh'
const SHEET_TINTHAY = 'TinNhanThay'
const SHEET_DE = 'NganHangDe'
const SHEET_LUOT = 'LuotThi'
const DRIVE_FOLDER = 'OMR-APP-DATA'

// Cột sheet CaKiemTra (1-based = vị trí trong mảng + 1). 7 cột đầu có từ bản
// đầu; từ cột 8 thêm khi làm QUANLYCATHI (3 mốc thời gian, trạng thái, phạm vi).
// getSheet_ chỉ ghi tiêu đề khi TẠO MỚI sheet — sheet cũ được bổ sung tiêu đề
// cột thiếu bằng boSungTieuDe_.
// Cột 18–19 thêm ở BA-APP đợt 3: Loai = 'thi' (mặc định, ô trống cũng là thi)
// hoặc 'baitap' — BÀI TẬP VỀ NHÀ dùng CHUNG mọi thứ với ca thi, chỉ khác 5 điểm
// (xem BA-APP.md mục 6). HanNop chỉ có nghĩa với bài tập.
const CA_HEADERS = ['MaCa', 'Lop', 'ThoiGianPhut', 'MoLuc', 'BankJson', 'ImmediateFeedback', 'KeyBankJson', 'BatDau', 'HetHanVao', 'TrangThai', 'TenCa', 'PhamVi', 'DanhSachMoi', 'NguoiTao', 'XoaLuc', 'NguongLan', 'NguongGiay', 'Loai', 'HanNop']
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
const SHEET_CHITIET = 'ChiTietCau'
const CHITIET_HEADERS = ['MaCa', 'SBD', 'LanThu', 'Phan', 'SoCau', 'Qid', 'ChuyenDe', 'MucDo', 'DapAnChon', 'DapAnDung', 'DungSai', 'GiayLamCau', 'GhiLuc']
// Thời gian ân hạn sau HẾT GIỜ làm bài (đồng hồ máy em lệch, mạng chậm lúc tự
// nộp) — quá mốc này vẫn nhận bài nhưng ghi chú "nộp muộn".
const AN_HAN_NOP_GIAY = 120

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

// Lệnh GET chỉ dành cho thầy — phải kèm secret. Trước v12 các lệnh này mở cho
// bất kỳ ai có link /exec (đọc được cả danh bạ phụ huynh) — đó là lỗ hổng v12 vá.
const GET_CHI_THAY = ['listParents', 'listStudents', 'listAllFeedback', 'listMessages']

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
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID)
  const folder = driveFolder_()
  const ref = luuJsonLon_('_kiem_tra', { ok: true, luc: new Date().toISOString() }, '')
  const doc = docJsonLon_(ref)
  DriveApp.getFileById(ref.slice(6)).setTrashed(true)
  Logger.log('Sheet: ' + ss.getName() + ' | Thư mục Drive: ' + folder.getName() + ' | ghi/đọc JSON: ' + (doc && doc.ok ? 'OK' : 'LỖI') + ' | MA_BI_MAT: ' + (maBiMat_() ? 'đã đặt' : 'CHƯA ĐẶT'))
}

function getSheet_(name, headers) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID)
  let sh = ss.getSheetByName(name)
  if (!sh) {
    sh = ss.insertSheet(name)
    sh.appendRow(headers)
  }
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

function findRowByKey_(sh, keyCol, keyVal) {
  const data = sh.getDataRange().getValues()
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][keyCol]) === String(keyVal)) return i + 1 // 1-based row index
  }
  return -1
}

/** Sheet tạo từ bản cũ thiếu cột mới → ghi bổ sung tiêu đề các cột còn thiếu
 * (dữ liệu cũ giữ nguyên, ô cột mới để trống = mặc định). */
function boSungTieuDe_(sh, headers) {
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
  }
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
function luotMoiNhatTheoSbd_(sh, maCa) {
  const data = sh.getDataRange().getValues()
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
  // lượt mới (chưa có, hoặc thầy đã duyệt thi lại) → xét cửa sổ vào phòng
  const batDau = ca.batDau ? msCua_(ca.batDau) : NaN
  if (isFinite(batDau) && nowMs < batDau) return { ok: false, lyDo: 'chua_mo', batDau: ca.batDau }
  // BÀI TẬP VỀ NHÀ: không có "hạn vào phòng" — em mở lúc nào cũng được, quá hạn
  // nộp vẫn vào làm được và chỉ bị đánh dấu nộp muộn (BA-APP.md mục 6).
  if (!laBaiTap_(ca)) {
    const hetHan = ca.hetHanVao ? msCua_(ca.hetHanVao) : NaN
    if (isFinite(hetHan) && nowMs > hetHan) return { ok: false, lyDo: 'het_han_vao', hetHanVao: ca.hetHanVao }
  }
  // CỔNG DANH SÁCH HỌC SINH — chặn trước mọi phạm vi ca. Phải khớp đủ ba: số
  // báo danh, họ tên, năm sinh. hocSinh.trongDanhSach do vaoThi tra sẵn
  // (null = chưa nạp danh sách bao giờ → mở cổng, để trung tâm không đứng hình
  // lúc thầy chưa kịp nạp file).
  // KHÔNG nói rõ trường nào sai: nói ra là cho phép dò tên từ số báo danh.
  if (hocSinh && hocSinh.trongDanhSach === false) return { ok: false, lyDo: 'sai_ho_so' }

  // PHẠM VI GỬI CA (QUANLYCATHI mục 4) — máy chủ kiểm tra, không chỉ ẩn giao diện.
  // khoi: DanhSachMoi = năm sinh; em phải có hồ sơ (sheet HocSinh) đúng năm sinh.
  // chon: DanhSachMoi = JSON mảng SBD.
  const pv = ca.phamVi || 'tu_do'
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
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
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
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID)
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
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID)
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

/** Đọc TOÀN BỘ bản sao danh sách học sinh (một lần đọc sheet). */
function docDanhSachLop_() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID)
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
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID)
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
      bank: docJsonLon_(ca.bankRef),
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

function doPost(e) {
  const body = JSON.parse(e.postData.contents)
  const action = body.action

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
    return jsonResponse_({ ok: true, maDe: String(de.ma_de), soCau: de.cau.length, soNghi: soNghi })
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
    if (row > 0) {
      sh.getRange(row, 1, 1, rowData.length).setValues([rowData])
    } else {
      sh.appendRow(rowData)
    }
    return jsonResponse_({ ok: true, batDau: batDau, hetHanVao: rowData[8], loai: rowData[17], hanNop: rowData[18], serverNow: Date.now() })
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
    const lock = LockService.getScriptLock()
    lock.waitLock(15000)
    try {
      const sh = sheetLuot_()
      const luot = luotMoiNhatTheoSbd_(sh, maCa)[sbd] || null
      const now = Date.now()
      // CỔNG DANH SÁCH trước mọi thứ khác: phải khớp ĐỦ BA — số báo danh, họ
      // tên, năm sinh — với một dòng trong danh sách thầy đã nạp. Chưa nạp danh
      // sách bao giờ thì không chặn ai (để trung tâm không đứng hình).
      const coDs = coDanhSachHocSinh_()
      const dong = coDs ? timTrongDanhSachLop_(sbd) : null
      let trongDs = dong
      if (coDs && dong) {
        const tenGoi = chuanTen_(body.hoTen)
        const namGoi = chuanNamSinh_(body.namSinh)
        // Dòng trong danh sách thiếu tên hoặc năm sinh thì không lấy đó làm cớ
        // chặn em — chỉ so những gì thầy đã điền.
        const tenKhop = !chuanTen_(dong.hoTen) || tenGoi === chuanTen_(dong.hoTen)
        const namKhop = !dong.namSinh || namGoi === dong.namSinh
        if (!tenKhop || !namKhop) trongDs = null
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
        // Thầy vừa mở khoá lượt này (dòng LuotThi đang dang_lam nhưng máy em còn giữ cờ khoá) → máy em bỏ khoá, làm tiếp.
        daMoKhoa: qd.cach === 'khoi_phuc' && luot && luot.ghiChu.indexOf('mở khoá') >= 0,
        serverNow: Date.now(),
      }
      // Đề (KHÔNG đáp án) chỉ gửi khi máy em chưa có bản cache — tiết kiệm băng thông.
      if (body.canBank) out.bank = docJsonLon_(ca.bankRef)
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
    const luot = luotMoiNhatTheoSbd_(sh, maCa)[sbd] || null
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

  if (action === 'moKhoa') {
    // Thầy MỞ KHOÁ một lượt bị khoá vì rời màn (QUANLYCATHI mục 6): trạng thái
    // về dang_lam, giữ nguyên đáp án đã tự nộp + số lần rời màn, ghi ai mở lúc
    // nào. Em mở lại link trên CÙNG máy là làm tiếp (đồng hồ vẫn theo HetGioLuc).
    const loi = kiemTraMaBiMat_(body)
    if (loi) return jsonResponse_({ ok: false, error: loi })
    const maCa = String(body.maCa || '').trim()
    const sbd = String(body.sbd || '').trim()
    const sh = sheetLuot_()
    const luot = luotMoiNhatTheoSbd_(sh, maCa)[sbd] || null
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
    delete ca.bankRef
    delete ca.keyBankRef
    delete ca.row
    let danhSachMoi = []
    try { danhSachMoi = ca.danhSachMoi && ca.phamVi === 'chon' ? JSON.parse(ca.danhSachMoi) : [] } catch (err) {}
    ca.danhSachMoi = ca.phamVi === 'chon' ? danhSachMoi : ca.danhSachMoi
    return jsonResponse_({ ok: true, ca: ca, luot: luot, serverNow: Date.now() })
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
      const d = x.diem || {}
      sh.getRange(row, 14, 1, 4).setValues([[d.I === undefined ? '' : d.I, d.II === undefined ? '' : d.II, d.III === undefined ? '' : d.III, d.tong === undefined ? '' : d.tong]])
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
      // Tổng hợp sẵn theo chuyên đề (đợt 2) — tính từ chính mảng câu vừa chấm.
      tomTat[sbd] = {
        nopLuc: l.nopLuc || luc,
        theoCd: gomTheoChuyenDe_(cau),
        qids: cau.map(function (q) { return String(q.qid || '') }).filter(function (q) { return q }),
      }
    }
    // Xoá dòng chi tiết cũ từ dưới lên (chỉ số không trôi), rồi ghi mới 1 lần.
    xoaDong.sort(function (a, b) { return b - a })
    for (let i = 0; i < xoaDong.length; i++) ctSh.deleteRow(xoaDong[i])
    if (themDong.length > 0) ctSh.getRange(ctSh.getLastRow() + 1, 1, themDong.length, CHITIET_HEADERS.length).setValues(themDong)
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
      if (caRowS > 0) laBaiTapCa = laBaiTap_(docCa_(caShS, caRowS))
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

    // Em chưa thi lần nào thì chưa có dòng trong HocSinh — lấy tên từ danh sách
    // thầy đã nạp, để bấm vào em nào cũng ra hồ sơ có tên, không phải ô trống.
    let em = hoSoHocSinh_(sbd)
    if (!em || !em.hoTen) {
      const tu = timTrongDanhSachLop_(sbd)
      if (tu) em = { sbd: sbd, hoTen: tu.hoTen, namSinh: tu.namSinh, lop: tu.lop || (em ? em.lop : '') }
    }
    if (!em) em = { sbd: sbd, hoTen: '', namSinh: '', lop: '' }

    // Bảng chuyên đề + xu hướng, cả hai tính từ MỘT lần đọc TienDoCa: mỗi lệnh
    // Apps Script tốn sẵn ~1,5 giây overhead nên cắt được lần đọc sheet nào là
    // cắt (TienDoHS vẫn giữ để các lệnh khác dùng, nhưng ở đây không cần đọc).
    const caData = getSheet_(SHEET_TIENDO_CA, TIENDO_CA_HEADERS).getDataRange().getValues()
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

    // Lịch sử ca thi + hạng trong ca (tính từ chính LuotThi, không lưu sẵn).
    // Chỉ lấy 17 cột đầu: bỏ GhiChu/CapNhatLuc và nhất là GiayCauJson —
    // getDataRange() kéo về cả JSON giây-từng-câu của MỌI lượt, rất nặng.
    const luotSh = sheetLuot_()
    const soDongLuot = luotSh.getLastRow()
    const luotData = soDongLuot > 0 ? luotSh.getRange(1, 1, soDongLuot, 17).getValues() : []
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
    const tenCa = {}
    const caRows = getSheet_(SHEET_CA, CA_HEADERS).getDataRange().getValues()
    for (let i = 1; i < caRows.length; i++) {
      // Ca thầy đã xoá thì không hiện lại trong hồ sơ em nữa.
      if (String(caRows[i][9]) === 'da_xoa') continue
      tenCa[String(caRows[i][0])] = { tenCa: String(caRows[i][10] || ''), lop: String(caRows[i][1] || '') }
    }
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
        const ds = diemTheoCa[mc].slice().sort(function (a, b) { return b - a })
        siSo = ds.length
        hang = ds.indexOf(tong) + 1
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
    return jsonResponse_({
      ok: true,
      em: em,
      chuyenDe: chuyenDe,
      ca: ca,
      caGanNhat: caGanNhat,
      chuyenDeCaGanNhat: cdCaGanNhat,
      soCauSaiCaGanNhat: soCauSaiCaGanNhat,
      serverNow: Date.now(),
    })
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
    sh.clear()
    sh.appendRow(DSLOP_HEADERS)
    sh.getRange(2, 1, rows.length, DSLOP_HEADERS.length).setValues(rows)
    return jsonResponse_({ ok: true, soDong: rows.length, capNhatLuc: luc })
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
      const luot = luotMoiNhatTheoSbd_(sheetLuot_(), body.maCa)[String(body.sbd)]
      if (luot) {
        const p = body.diemPhan || {}
        sheetLuot_().getRange(luot.row, 14, 1, 4).setValues([[p.I === undefined ? '' : p.I, p.II === undefined ? '' : p.II, p.III === undefined ? '' : p.III, body.diem]])
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
