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

function findRowByKey_(sh, keyCol, keyVal) {
  const data = sh.getDataRange().getValues()
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][keyCol]) === String(keyVal)) return i + 1 // 1-based row index
  }
  return -1
}

function doGet(e) {
  const action = e.parameter.action
  if (action === 'session') {
    const maCa = e.parameter.maCa || ''
    const sh = getSheet_(SHEET_CA, ['MaCa', 'Lop', 'ThoiGianPhut', 'MoLuc', 'BankJson', 'ImmediateFeedback', 'KeyBankJson'])
    const row = findRowByKey_(sh, 0, maCa)
    if (row < 0) return jsonResponse_({ found: false })
    // CHỈ trả về bank KHÔNG đáp án (BankJson) ở đây — đây là lúc học sinh
    // vào thi, đáp án đúng (KeyBankJson) tuyệt đối không được lộ lúc này.
    const vals = sh.getRange(row, 1, 1, 5).getValues()[0]
    return jsonResponse_({
      found: true,
      maCa: vals[0],
      lop: vals[1],
      thoiGianPhut: vals[2],
      moLuc: vals[3],
      bank: JSON.parse(vals[4]),
    })
  }
  if (action === 'listSubmissions') {
    const maCa = e.parameter.maCa || ''
    const sh = getSheet_(SHEET_BAILAM, ['MaCa', 'SBD', 'MaDe', 'ThoiGianNop', 'DapAnJson', 'SoLanRoiApp', 'TongGiayRoiApp', 'IntegrityJson'])
    const data = sh.getDataRange().getValues()
    const rows = []
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(maCa)) {
        rows.push({
          sbd: data[i][1],
          maDe: data[i][2],
          thoiGianNop: data[i][3],
          dapAn: JSON.parse(data[i][4]),
          integrity: data[i][7] ? JSON.parse(data[i][7]) : null,
        })
      }
    }
    return jsonResponse_({ rows: rows })
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

  if (action === 'publish') {
    const sh = getSheet_(SHEET_CA, ['MaCa', 'Lop', 'ThoiGianPhut', 'MoLuc', 'BankJson', 'ImmediateFeedback', 'KeyBankJson'])
    const row = findRowByKey_(sh, 0, body.maCa)
    // keyBank (có đáp án) CHỈ được gửi lên nếu thầy chủ động bật "xem điểm
    // ngay sau khi nộp" ở màn Soạn đề — lưu riêng cột này, KHÔNG bao giờ trả
    // về ở action "session" (chỉ trả trong response của "submit", xem dưới).
    const rowData = [
      body.maCa,
      body.lop,
      body.thoiGianPhut,
      new Date().toISOString(),
      JSON.stringify(body.bank),
      body.immediateFeedback ? 'true' : 'false',
      body.keyBank ? JSON.stringify(body.keyBank) : '',
    ]
    if (row > 0) {
      sh.getRange(row, 1, 1, 7).setValues([rowData])
    } else {
      sh.appendRow(rowData)
    }
    return jsonResponse_({ ok: true })
  }

  if (action === 'submit') {
    const sh = getSheet_(SHEET_BAILAM, ['MaCa', 'SBD', 'MaDe', 'ThoiGianNop', 'DapAnJson', 'SoLanRoiApp', 'TongGiayRoiApp', 'IntegrityJson'])
    const data = sh.getDataRange().getValues()
    let foundRow = -1
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(body.maCa) && String(data[i][1]) === String(body.sbd)) {
        foundRow = i + 1
        break
      }
    }
    const integrity = body.integrity || { leaveCount: 0, totalHiddenMs: 0, events: [] }
    const rowData = [
      body.maCa,
      body.sbd,
      body.maDe,
      new Date().toISOString(),
      JSON.stringify(body.dapAn),
      integrity.leaveCount,
      Math.round(integrity.totalHiddenMs / 1000),
      JSON.stringify(integrity),
    ]
    if (foundRow > 0) {
      // Học sinh nộp lại (vd mất mạng nộp lại) — ghi đè bài cũ bằng bài mới nhất, không tạo dòng trùng.
      sh.getRange(foundRow, 1, 1, 8).setValues([rowData])
    } else {
      sh.appendRow(rowData)
    }

    // Nếu ca này bật "xem điểm ngay sau khi nộp", trả kèm đáp án (keyBank)
    // NGAY TRONG RESPONSE của lần nộp này — chỉ em vừa nộp nhận được, không
    // có endpoint nào khác cho phép lấy đáp án trước khi nộp bài.
    const caSh = getSheet_(SHEET_CA, ['MaCa', 'Lop', 'ThoiGianPhut', 'MoLuc', 'BankJson', 'ImmediateFeedback', 'KeyBankJson'])
    const caRow = findRowByKey_(caSh, 0, body.maCa)
    let keyBank = null
    if (caRow > 0) {
      const caVals = caSh.getRange(caRow, 1, 1, 7).getValues()[0]
      if (String(caVals[5]) === 'true' && caVals[6]) keyBank = JSON.parse(caVals[6])
    }
    return jsonResponse_({ ok: true, keyBank: keyBank })
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
    return jsonResponse_({ ok: true })
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
