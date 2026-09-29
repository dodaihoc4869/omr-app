// ĐỌC MỘT ĐÁP ÁN SỐ PHẦN III THÀNH (SỐ CHUẨN, ĐƠN VỊ) — MỘT HÀM DÙNG CHUNG cho mọi kênh (29/09/2026).
//
// LỖI THẦY BÁO 29/09 (màn Câu đã làm/Đang ôn): đáp án kho "1,2375×10⁹ kJ", em nhập "1237500000" → chấm SAI.
// Nguyên nhân gốc: luật cũ chạy `normalize('NFKC')` TRƯỚC khi hiểu số mũ chữ nhỏ, NFKC biến "10⁹" thành "109"
// ⇒ đáp án thành "1,2375×109kJ" — không đọc được là số ⇒ câu nào cũng sai, kể cả em làm đúng.
//
// Hàm này đọc được:
//   · dấu phẩy thập phân kiểu Việt Nam ("0,54") và dấu chấm ("0.54");
//   · phân cách hàng nghìn KHI RÕ RÀNG: "1.237.500.000", "1,237,500", "1 237 500 000", "1.237,5" (chấm nghìn + phẩy thập phân),
//     "1,237.5" (phẩy nghìn + chấm thập phân). MỘT dấu duy nhất ("1.237", "1,237") ⇒ luôn là dấu THẬP PHÂN (như luật cũ);
//   · kí hiệu khoa học: ×10⁹, x10^9, *10^9, ·10^9, .10^-3 ("2,5.10^-3"), 10^(9), 10^{9}, e9/E9, \times, \cdot, số mũ chữ nhỏ
//     ⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺ (kể cả âm: 10⁻³); dấu trừ unicode (− – — …); mọi khoảng trắng; dấu ≈ = ~ + ở đầu; dấu câu thừa ở cuối.
// Phần còn lại sau số được trả về làm `donVi` (chữ thường, đã bỏ khoảng trắng) — việc đơn vị nào được chấp nhận do
// `cham-so-policy.ts` quyết (danh mục ĐÓNG: "12abc" vẫn KHÔNG phải 12).
//
// QUAN TRỌNG: hàm TỰ ĐỦ (không gọi hàm/biến nào bên ngoài, không BigInt, không lookbehind) vì `html-phieu.ts` nhúng NGUYÊN VĂN
// mã của nó vào phiếu HTML chạy độc lập (`docSoPhanIII.toString()`) — một luật, không có bản chép tay thứ hai.
// Số trả về là CHUỖI thập phân CHÍNH XÁC (không qua dấu phẩy động): "1,2375×10⁹" → "1237500000", "1,6.10⁻¹⁹" → "0.00000000000000000016".
// Số không có số mũ giữ nguyên chữ số (kể cả số 0 cuối: "0,80" → "0.80") để chế độ 'chat' của game còn phân biệt được.

export interface SoPhanIII {
  /** Số thập phân chính xác, dấu thập phân là ".", có thể có "-" ở đầu. */
  so: string
  /** Phần đuôi sau số (đơn vị/chữ), chữ thường, không khoảng trắng; "" nếu không có. */
  donVi: string
}

/** Đọc `raw` thành số + đơn vị; `null` nếu phần đầu không phải số đọc được một cách RÕ RÀNG. */
export function docSoPhanIII(raw: unknown): SoPhanIII | null {
  var s = String(raw == null ? '' : raw)
  // 1. Số mũ chữ nhỏ → "^…" TRƯỚC NFKC (NFKC gộp "10⁹" thành "109" — gốc lỗi 29/09).
  var MU: { [k: string]: string } = {
    '\u2070': '0', '\u00b9': '1', '\u00b2': '2', '\u00b3': '3', '\u2074': '4', '\u2075': '5', '\u2076': '6',
    '\u2077': '7', '\u2078': '8', '\u2079': '9', '\u207b': '-', '\u207a': '+',
  }
  // Chỉ đổi khi chữ nhỏ đứng NGAY SAU "10" (số mũ); "m²", "cm³" để NFKC thành "m2", "cm3" như đơn vị cũ.
  s = s.replace(/10([\s\u00a0\u202f]*)([\u2070\u00b9\u00b2\u00b3\u2074-\u2079\u207a\u207b]+)/g, function (_t: string, _k: string, m: string) {
    var r = '10^'
    for (var i = 0; i < m.length; i++) r += MU[m.charAt(i)]
    return r
  })
  if (s.normalize) s = s.normalize('NFKC')
  s = s.replace(/\\times/g, '\u00d7').replace(/\\cdot/g, '\u00b7')
  s = s.replace(/[\s\u00a0\u1680\u180e\u2000-\u200f\u2028\u2029\u202f\u205f\u2060\u3000\ufeff]+/g, '')
  s = s.replace(/[\u2010-\u2015\u2212\ufe63\uff0d]/g, '-').replace(/[\u066b\u201a\u060c]/g, ',').toLowerCase()
  s = s.replace(/^[+\u2248~=]+/, '').replace(/[.,;:!?]+$/, '')
  s = s.replace(/\^+/g, '^')
  if (!s) return null

  // 2. Tách phần định trị, số mũ (nếu có), đuôi.
  var dinhTri = ''
  var mu = 0
  var coMu = false
  var duoi = ''
  var SO = '([+-]?(?:\\d[\\d.,]*|[.,]\\d+))'
  var MU10 = '10(?:\\^|\\*\\*)?[({]?([+-]?\\d+)[)}]?'
  var m = new RegExp('^' + SO + '[x\u00d7*\u00b7\u22c5\u2219]' + MU10 + '(.*)$').exec(s) ||
    new RegExp('^' + SO + '\\.10(?:\\^|\\*\\*)[({]?([+-]?\\d+)[)}]?(.*)$').exec(s) ||
    new RegExp('^' + SO + 'e([+-]?\\d+)(.*)$').exec(s)
  if (m) {
    dinhTri = m[1]; mu = parseInt(m[2], 10); coMu = true; duoi = m[3]
  } else {
    var m10 = /^([+-]?)10(?:\^|\*\*)[({]?([+-]?\d+)[)}]?(.*)$/.exec(s)
    if (m10) {
      dinhTri = m10[1] + '1'; mu = parseInt(m10[2], 10); coMu = true; duoi = m10[3]
    } else {
      var mp = new RegExp('^' + SO + '(.*)$').exec(s)
      if (!mp) return null
      dinhTri = mp[1]; duoi = mp[2]
    }
  }
  if (!isFinite(mu) || Math.abs(mu) > 400) return null

  // 3. Dấu thập phân / phân cách nghìn của phần định trị.
  var dau = ''
  if (dinhTri.charAt(0) === '-' || dinhTri.charAt(0) === '+') { dau = dinhTri.charAt(0) === '-' ? '-' : ''; dinhTri = dinhTri.slice(1) }
  var soCham = dinhTri.split('.').length - 1
  var soPhay = dinhTri.split(',').length - 1
  var nghin = ''
  var thapPhan = ''
  if (soCham && soPhay) {
    // Dấu xuất hiện SAU CÙNG là dấu thập phân (chỉ một), dấu kia là phân cách nghìn.
    var cuoiCham = dinhTri.lastIndexOf('.')
    var cuoiPhay = dinhTri.lastIndexOf(',')
    thapPhan = cuoiCham > cuoiPhay ? '.' : ','
    nghin = thapPhan === '.' ? ',' : '.'
    if ((thapPhan === '.' ? soCham : soPhay) !== 1) return null
  } else if (soCham > 1) nghin = '.'
  else if (soPhay > 1) nghin = ','
  else thapPhan = soCham ? '.' : (soPhay ? ',' : '')
  var nguyen = dinhTri
  var le = ''
  var coDauThapPhan = false
  if (thapPhan) {
    var k = dinhTri.lastIndexOf(thapPhan)
    nguyen = dinhTri.slice(0, k); le = dinhTri.slice(k + 1); coDauThapPhan = true
  }
  if (nghin) {
    // Phân cách nghìn chỉ chấp nhận khi RÕ RÀNG: nhóm đầu 1–3 chữ số, các nhóm sau đúng 3 chữ số.
    var nhom = nguyen.split(nghin)
    if (!/^\d{1,3}$/.test(nhom[0])) return null
    for (var j = 1; j < nhom.length; j++) if (!/^\d{3}$/.test(nhom[j])) return null
    nguyen = nhom.join('')
  }
  if (!/^\d*$/.test(nguyen) || !/^\d*$/.test(le) || (!nguyen && !le)) return null

  if (!coMu) {
    return { so: dau + nguyen + (coDauThapPhan ? '.' + le : ''), donVi: duoi }
  }
  // 4. Có số mũ: dời dấu thập phân CHÍNH XÁC bằng thao tác chuỗi, rồi đưa về dạng gọn (như String(Number) cũ).
  var chuSo = (nguyen || '0') + le
  var viTri = (nguyen || '0').length + mu
  if (viTri <= 0) { chuSo = new Array(1 - viTri + 1).join('0') + chuSo; viTri = 1 }
  if (viTri > chuSo.length) chuSo = chuSo + new Array(viTri - chuSo.length + 1).join('0')
  var phanNguyen = chuSo.slice(0, viTri).replace(/^0+(?=\d)/, '')
  var phanLe = chuSo.slice(viTri).replace(/0+$/, '')
  var ketQua = phanNguyen + (phanLe ? '.' + phanLe : '')
  if (/^0(?:\.0*)?$/.test(ketQua)) dau = ''
  return { so: dau + ketQua, donVi: duoi }
}
