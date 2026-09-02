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
const CA_HEADERS = ['MaCa', 'Lop', 'ThoiGianPhut', 'MoLuc', 'BankJson', 'ImmediateFeedback', 'KeyBankJson', 'BatDau', 'HetHanVao', 'TrangThai', 'TenCa', 'PhamVi', 'DanhSachMoi', 'NguoiTao', 'XoaLuc']
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
  }
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
  const hetHan = ca.hetHanVao ? msCua_(ca.hetHanVao) : NaN
  if (isFinite(hetHan) && nowMs > hetHan) return { ok: false, lyDo: 'het_han_vao', hetHanVao: ca.hetHanVao }
  // PHẠM VI GỬI CA (QUANLYCATHI mục 4) — máy chủ kiểm tra, không chỉ ẩn giao diện.
  // khoi: DanhSachMoi = năm sinh; em phải có hồ sơ (sheet HocSinh) đúng năm sinh.
  // chon: DanhSachMoi = JSON mảng SBD.
  const pv = ca.phamVi || 'tu_do'
  if (pv === 'khoi') {
    const namSinh = String(ca.danhSachMoi || '').trim()
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

/** Hồ sơ học sinh đã đăng ký (sheet HocSinh) — null nếu chưa có. */
function hoSoHocSinh_(sbd) {
  try {
    const sh = getSheet_(SHEET_HOCSINH, ['SBD', 'HoTen', 'NamSinh', 'Lop', 'DangKyLuc'])
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
    const sh = getSheet_(SHEET_HOCSINH, ['SBD', 'HoTen', 'NamSinh', 'Lop', 'DangKyLuc'])
    const row = findRowByKey_(sh, 0, sbd)
    return row > 0 ? String(sh.getRange(row, 2).getValue() || '') : ''
  } catch (err) {
    return ''
  }
}

function doGet(e) {
  const action = e.parameter.action
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
    const sdt = (e.parameter.sdt || '').trim()
    const phSh = getSheet_(SHEET_PHUHUYNH, ['SDT', 'HoTenPhuHuynh', 'SBD', 'Lop', 'HoTenHocSinh', 'DangKyLuc'])
    const phRow = findRowByKey_(phSh, 0, sdt)
    if (phRow < 0) return jsonResponse_({ found: false })
    const phVals = phSh.getRange(phRow, 1, 1, 6).getValues()[0]
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
    const sdt = (e.parameter.sdt || '').trim()
    const phSh = getSheet_(SHEET_PHUHUYNH, ['SDT', 'HoTenPhuHuynh', 'SBD', 'Lop', 'HoTenHocSinh', 'DangKyLuc'])
    const phRow = findRowByKey_(phSh, 0, sdt)
    if (phRow < 0) return jsonResponse_({ found: false })
    const phVals = phSh.getRange(phRow, 1, 1, 6).getValues()[0]
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
    const sh = getSheet_(SHEET_PHUHUYNH, ['SDT', 'HoTenPhuHuynh', 'SBD', 'Lop', 'HoTenHocSinh', 'DangKyLuc'])
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
      })
    }
    return jsonResponse_({ items: items })
  }

  if (action === 'listStudents') {
    // Danh sách học sinh đã đăng ký hồ sơ — cho màn quản lý của thầy.
    const sh = getSheet_(SHEET_HOCSINH, ['SBD', 'HoTen', 'NamSinh', 'Lop', 'DangKyLuc'])
    const data = sh.getDataRange().getValues()
    const items = []
    for (let i = 1; i < data.length; i++) {
      items.push({
        sbd: data[i][0],
        hoTen: data[i][1],
        namSinh: data[i][2],
        lop: data[i][3],
        dangKyLuc: data[i][4],
      })
    }
    return jsonResponse_({ items: items })
  }

  if (action === 'studentProfile') {
    const sbd = (e.parameter.sbd || '').trim()
    const sh = getSheet_(SHEET_HOCSINH, ['SBD', 'HoTen', 'NamSinh', 'Lop', 'DangKyLuc'])
    const row = findRowByKey_(sh, 0, sbd)
    if (row < 0) return jsonResponse_({ found: false })
    const v = sh.getRange(row, 1, 1, 5).getValues()[0]
    return jsonResponse_({ found: true, sbd: String(v[0]), hoTen: v[1], namSinh: v[2], lop: v[3] })
  }

  if (action === 'parentInbox' || action === 'studentInbox') {
    // Tin nhắn THẦY GỬI CHO 1 em — phụ huynh/học sinh tự poll lại (giống
    // parentStatus), không phải đẩy tức thì thật sự.
    let sbd = ''
    if (action === 'parentInbox') {
      const sdt = (e.parameter.sdt || '').trim()
      const phSh = getSheet_(SHEET_PHUHUYNH, ['SDT', 'HoTenPhuHuynh', 'SBD', 'Lop', 'HoTenHocSinh', 'DangKyLuc'])
      const phRow = findRowByKey_(phSh, 0, sdt)
      if (phRow < 0) return jsonResponse_({ found: false })
      sbd = String(phSh.getRange(phRow, 3, 1, 1).getValues()[0][0])
    } else {
      sbd = (e.parameter.sbd || '').trim()
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
      body.danhSachMoi ? JSON.stringify(body.danhSachMoi) : '',
      body.nguoiTao || '',
      '',
    ]
    if (row > 0) {
      sh.getRange(row, 1, 1, rowData.length).setValues([rowData])
    } else {
      sh.appendRow(rowData)
    }
    return jsonResponse_({ ok: true, batDau: batDau, hetHanVao: rowData[8], serverNow: Date.now() })
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
      const hoSo = hoSoHocSinh_(sbd)
      const qd = quyetDinhVaoThi_(ca, luot, idThietBi, now, { sbd: sbd, namSinh: hoSo ? hoSo.namSinh : '' })
      if (!qd.ok) {
        qd.serverNow = now
        qd.thoiGianPhut = ca.thoiGianPhut
        return jsonResponse_(qd)
      }
      let lanThu = 1
      let vaoLuc = new Date(now).toISOString()
      let hetGioLuc = new Date(now + ca.thoiGianPhut * 60000).toISOString()
      if (qd.cach === 'khoi_phuc') {
        lanThu = luot.lanThu
        vaoLuc = luot.vaoLuc
        hetGioLuc = luot.hetGioLuc || new Date(msCua_(luot.vaoLuc) + ca.thoiGianPhut * 60000).toISOString()
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
        congBo: ca.congBo,
        lanThu: lanThu,
        vaoLuc: vaoLuc,
        hetGioLuc: hetGioLuc,
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
    for (let i = 1; i < data.length; i++) {
      const v = data[i]
      const trangThai = v[9] ? String(v[9]) : 'mo'
      if (trangThai === 'da_xoa') continue
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
    }
    // Xoá dòng chi tiết cũ từ dưới lên (chỉ số không trôi), rồi ghi mới 1 lần.
    xoaDong.sort(function (a, b) { return b - a })
    for (let i = 0; i < xoaDong.length; i++) ctSh.deleteRow(xoaDong[i])
    if (themDong.length > 0) ctSh.getRange(ctSh.getLastRow() + 1, 1, themDong.length, CHITIET_HEADERS.length).setValues(themDong)
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
        ghiChu = 'nộp muộn ' + muon + ' giây'
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
    const sh = getSheet_(SHEET_PHUHUYNH, ['SDT', 'HoTenPhuHuynh', 'SBD', 'Lop', 'HoTenHocSinh', 'DangKyLuc'])
    const row = findRowByKey_(sh, 0, body.sdt)
    const rowData = [body.sdt, body.hoTenPhuHuynh, body.sbd, body.lop, body.hoTenHocSinh, new Date().toISOString()]
    if (row > 0) {
      sh.getRange(row, 1, 1, 6).setValues([rowData])
    } else {
      sh.appendRow(rowData)
    }
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
    const sh = getSheet_(SHEET_HOCSINH, ['SBD', 'HoTen', 'NamSinh', 'Lop', 'DangKyLuc'])
    const row = findRowByKey_(sh, 0, body.sbd)
    const rowData = [body.sbd, body.hoTen, body.namSinh, body.lop || '', new Date().toISOString()]
    if (row > 0) {
      sh.getRange(row, 1, 1, 5).setValues([rowData])
    } else {
      sh.appendRow(rowData)
    }
    return jsonResponse_({ ok: true })
  }

  if (action === 'deleteParent') {
    // CHỈ thầy dùng (từ màn quản lý) — phụ huynh không có nút này trong app,
    // đăng ký xong không tự "đăng xuất/đăng ký lại" được, đúng theo yêu cầu.
    const sh = getSheet_(SHEET_PHUHUYNH, ['SDT', 'HoTenPhuHuynh', 'SBD', 'Lop', 'HoTenHocSinh', 'DangKyLuc'])
    const row = findRowByKey_(sh, 0, body.sdt)
    if (row > 0) sh.deleteRow(row)
    return jsonResponse_({ ok: true })
  }

  if (action === 'deleteStudent') {
    const sh = getSheet_(SHEET_HOCSINH, ['SBD', 'HoTen', 'NamSinh', 'Lop', 'DangKyLuc'])
    const row = findRowByKey_(sh, 0, body.sbd)
    if (row > 0) sh.deleteRow(row)
    return jsonResponse_({ ok: true })
  }

  if (action === 'sendTeacherMessage') {
    // Thầy gửi tin nhắn cho 1 em (theo SBD) — phụ huynh/học sinh của em đó
    // sẽ thấy khi app tự poll lại (parentInbox/studentInbox).
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
