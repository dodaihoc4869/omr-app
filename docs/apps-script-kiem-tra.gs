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
const DRIVE_FOLDER = 'OMR-APP-DATA'

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
      bank: docJsonLon_(vals[4]),
    })
  }
  if (action === 'ketQua') {
    // Em hỏi lại sau khi nộp: đã được xem đáp án chưa? CHỈ trả keyBank cho em
    // ĐÃ NỘP, và với chế độ 'calop' chỉ khi (a) mọi SBD đã vào thi ca này
    // (sheet TrangThai) đều đã có bài nộp, hoặc (b) mọi em đó đều đã hết giờ
    // (BatDauLuc + thoiGianPhut + 2 phút) — em nộp sớm không thể lấy đáp án
    // trong lúc bạn còn đang làm.
    const maCa = e.parameter.maCa || ''
    const sbd = (e.parameter.sbd || '').trim()
    const caSh = getSheet_(SHEET_CA, ['MaCa', 'Lop', 'ThoiGianPhut', 'MoLuc', 'BankJson', 'ImmediateFeedback', 'KeyBankJson'])
    const caRow = findRowByKey_(caSh, 0, maCa)
    if (caRow < 0) return jsonResponse_({ ok: false, error: 'Không có ca ' + maCa })
    const caVals = caSh.getRange(caRow, 1, 1, 7).getValues()[0]
    const congBo = congBoCua_(caVals[5])
    const thoiGianPhut = Number(caVals[2]) || 45

    const blSh = getSheet_(SHEET_BAILAM, ['MaCa', 'SBD', 'MaDe', 'ThoiGianNop', 'DapAnJson', 'SoLanRoiApp', 'TongGiayRoiApp', 'IntegrityJson'])
    const bl = blSh.getDataRange().getValues()
    const daNop = {}
    for (let i = 1; i < bl.length; i++) if (String(bl[i][0]) === String(maCa)) daNop[String(bl[i][1])] = true
    const emDaNop = !!daNop[sbd]
    const soDaNop = Object.keys(daNop).length

    if (congBo === 'khong' || !caVals[6]) return jsonResponse_({ ok: true, congBo: congBo, sanSang: false, daNop: soDaNop, daVao: soDaNop, keyBank: null })
    if (congBo === 'ngay') return jsonResponse_({ ok: true, congBo: congBo, sanSang: emDaNop, daNop: soDaNop, daVao: soDaNop, keyBank: emDaNop ? docJsonLon_(caVals[6]) : null })

    // calop
    const stSh = getSheet_(SHEET_TRANGTHAI, ['SBD', 'MaCa', 'Lop', 'DangLam', 'BatDauLuc', 'DaLamCauHoi', 'TongCauHoi', 'SoLanRoiApp', 'Blocked', 'CapNhatLuc'])
    const st = stSh.getDataRange().getValues()
    const now = Date.now()
    const han = (thoiGianPhut + 2) * 60000
    let daVao = 0
    let conDangLam = 0
    for (let i = 1; i < st.length; i++) {
      if (String(st[i][1]) !== String(maCa)) continue
      daVao++
      const sbdKia = String(st[i][0])
      const batDau = new Date(st[i][4]).getTime()
      const hetGio = isFinite(batDau) && now > batDau + han
      if (!daNop[sbdKia] && !hetGio) conDangLam++
    }
    // Em nào nộp mà không có dòng TrangThai (mất mạng lúc đẩy trạng thái) vẫn tính là đã vào.
    if (soDaNop > daVao) daVao = soDaNop
    const sanSang = emDaNop && soDaNop > 0 && conDangLam === 0
    return jsonResponse_({ ok: true, congBo: congBo, sanSang: sanSang, daNop: soDaNop, daVao: daVao, keyBank: sanSang ? docJsonLon_(caVals[6]) : null })
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
    const sh = getSheet_(SHEET_CA, ['MaCa', 'Lop', 'ThoiGianPhut', 'MoLuc', 'BankJson', 'ImmediateFeedback', 'KeyBankJson'])
    const row = findRowByKey_(sh, 0, body.maCa)
    if (row < 0) return jsonResponse_({ ok: false, error: 'Không có ca ' + body.maCa })
    const cu = sh.getRange(row, 1, 1, 7).getValues()[0]
    sh.getRange(row, 7).setValue(luuJsonLon_('ca_' + body.maCa + '_key', body.keyBank, cu[6]))
    return jsonResponse_({ ok: true, maCa: String(body.maCa), congBo: congBoCua_(cu[5]) })
  }

  if (action === 'publish') {
    const sh = getSheet_(SHEET_CA, ['MaCa', 'Lop', 'ThoiGianPhut', 'MoLuc', 'BankJson', 'ImmediateFeedback', 'KeyBankJson'])
    const row = findRowByKey_(sh, 0, body.maCa)
    // keyBank (có đáp án) CHỈ được gửi lên nếu thầy chủ động bật "xem điểm
    // ngay sau khi nộp" ở màn Soạn đề — lưu riêng cột này, KHÔNG bao giờ trả
    // về ở action "session" (chỉ trả trong response của "submit", xem dưới).
    const cu = row > 0 ? sh.getRange(row, 1, 1, 7).getValues()[0] : [null, null, null, null, '', '', '']
    const rowData = [
      body.maCa,
      body.lop,
      body.thoiGianPhut,
      new Date().toISOString(),
      luuJsonLon_('ca_' + body.maCa + '_bank', body.bank, cu[4]),
      // 'true' = xem điểm ngay khi nộp · 'calop' = khi cả lớp nộp xong · 'false' = không
      body.immediateFeedback === 'calop' ? 'calop' : body.immediateFeedback ? 'true' : 'false',
      body.keyBank ? luuJsonLon_('ca_' + body.maCa + '_key', body.keyBank, cu[6]) : '',
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
    // có endpoint nào khác cho phép lấy đáp án trước khi nộp bài. Chế độ
    // 'calop' (khi cả lớp nộp xong) KHÔNG trả ở đây — em hỏi lại qua ketQua.
    const caSh = getSheet_(SHEET_CA, ['MaCa', 'Lop', 'ThoiGianPhut', 'MoLuc', 'BankJson', 'ImmediateFeedback', 'KeyBankJson'])
    const caRow = findRowByKey_(caSh, 0, body.maCa)
    let keyBank = null
    let congBo = 'khong'
    if (caRow > 0) {
      const caVals = caSh.getRange(caRow, 1, 1, 7).getValues()[0]
      congBo = congBoCua_(caVals[5])
      if (congBo === 'ngay' && caVals[6]) keyBank = docJsonLon_(caVals[6])
    }
    return jsonResponse_({ ok: true, keyBank: keyBank, congBo: congBo })
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
