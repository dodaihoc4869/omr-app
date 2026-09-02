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
    const sh = getSheet_(SHEET_CA, ['MaCa', 'Lop', 'ThoiGianPhut', 'MoLuc', 'BankJson'])
    const row = findRowByKey_(sh, 0, maCa)
    if (row < 0) return jsonResponse_({ found: false })
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
  return jsonResponse_({ error: 'Thiếu hoặc sai tham số action' })
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents)
  const action = body.action

  if (action === 'publish') {
    const sh = getSheet_(SHEET_CA, ['MaCa', 'Lop', 'ThoiGianPhut', 'MoLuc', 'BankJson'])
    const row = findRowByKey_(sh, 0, body.maCa)
    const rowData = [body.maCa, body.lop, body.thoiGianPhut, new Date().toISOString(), JSON.stringify(body.bank)]
    if (row > 0) {
      sh.getRange(row, 1, 1, 5).setValues([rowData])
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
    return jsonResponse_({ ok: true })
  }

  return jsonResponse_({ error: 'Thiếu hoặc sai tham số action' })
}
