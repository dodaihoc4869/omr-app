// SO PHẢN HỒI TRƯỚC/SAU + DÒ LỘ ĐÁP ÁN (Code 1, 22/09/2026; Boss lệnh: "so khớp JSON phản hồi từng lệnh giữa hai mốc, bỏ trường giờ"). Thuần.
//
// CHUẨN HOÁ: xoá field GIỜ/ID ngẫu nhiên trước khi so (khác nhau giữa hai lượt chạy dù server không đổi): chuỗi ISO-8601, số 13 chữ số (epoch ms),
// và các khoá tên id/session/ma/receipt/token (giá trị đổi mỗi lượt vì random/uuid). CHỐT NỘI DUNG CÂU (đề thi thật, không đưa vào báo cáo git):
// text/choices/ideas/hinhAnh/table/… được RÚT GỌN thành `<VAN_BAN len=N sha1=...>` — so được ĐỔI/KHÔNG ĐỔI mà không chép đề vào tệp.
import { createHash } from 'node:crypto'

const KHOA_GIO_ID = new Set(['id', 'session', 'ma', 'receipt', 'token', 'maCa', 'maBtvn'])
// maCa/maBtvn giữ NGUYÊN (ổn định giữa hai lượt, lấy từ dữ liệu mẫu cố định) — chỉ id/session/ma/receipt/token là ngẫu nhiên mỗi lượt.
KHOA_GIO_ID.delete('maCa'); KHOA_GIO_ID.delete('maBtvn')
const KHOA_VAN_BAN = new Set(['text', 'choices', 'pa', 'ideas', 'y', 'hinhAnh', 'table', 'thanCauImg', 'imageDataUrl', 'choiceImgs', 'ideaImgs'])
const RE_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
const RE_EPOCH_MS = /^\d{13}$/

const sha1 = (v) => createHash('sha1').update(JSON.stringify(v)).digest('hex').slice(0, 10)

/** Chuẩn hoá SÂU: xoá giờ/id ngẫu nhiên, rút gọn văn bản câu thành hash. Không sửa đầu vào. */
export function chuanHoa(v, khoaCha = '') {
  if (Array.isArray(v)) return v.map((x) => chuanHoa(x))
  if (v !== null && typeof v === 'object') {
    const ra = {}
    for (const [k, x] of Object.entries(v)) {
      if (KHOA_GIO_ID.has(k)) { ra[k] = '<ID>'; continue }
      if (KHOA_VAN_BAN.has(k) && x !== null && x !== undefined) { ra[k] = `<VAN_BAN len=${JSON.stringify(x).length} sha1=${sha1(x)}>`; continue }
      ra[k] = chuanHoa(x, k)
    }
    return ra
  }
  if (typeof v === 'string' && RE_ISO.test(v)) return '<GIO>'
  if (typeof v === 'number' && RE_EPOCH_MS.test(String(Math.trunc(v)))) return '<GIO>'
  return v
}

/** Field KHÔNG ĐƯỢC XUẤT HIỆN (khác rỗng) ở phản hồi CHƯA CHẤM — đáp án đúng lộ trước khi em nộp là lỗi nặng. */
const KHOA_DAP_AN = ['correct', 'dapAn', 'dap_an', 'dapAnDung', 'solution', 'loiGiai']
/** Lệnh mà phản hồi KHÔNG được mang đáp án (liệt kê câu / vào lượt, chưa chấm). Lệnh có chữ "nộp"/"answer"/"complete" ĐƯỢC PHÉP có (đã chấm). */
export const LENH_CHUA_CHAM = /(\[(mở|nền|chặng|Đảo)\]|hs\/cau-theo-qid|game-v2\/(start|resume|so-tay|recommendations))/
const LA_LENH_DA_CHAM = /(nộp|xong-lo|on-lai\/nop|game-v2\/(answer|complete))/

/** Tên khoá mà GIÁ TRỊ của nó là vùng ĐÃ CHẤM hợp lệ (server chỉ điền khi em đã nộp câu ấy) dù lệnh bao quanh (vd `game-v2/resume`) còn CÂU CHƯA LÀM khác trong cùng phản hồi — không quét bên trong các khoá này.
 * `answered`: phiếu chấm của các câu đã trả lời TRONG lượt đang resume (`game-v2/resume`, mảng `{attempt:{...,correct:boolean},correct,answer,solution}` — từ `game_v2_attempt`, định nghĩa đã-chấm). */
const KHOA_DA_CHAM = new Set(['answered'])

function timDapAnLo(v, duong = []) {
  const ra = []
  if (Array.isArray(v)) { v.forEach((x, i) => ra.push(...timDapAnLo(x, [...duong, i]))); return ra }
  if (v !== null && typeof v === 'object') {
    for (const [k, x] of Object.entries(v)) {
      if (KHOA_DA_CHAM.has(k)) continue // vùng đã chấm hợp lệ — không quét bên trong (xem giải thích ở trên)
      // `correct` KIỂU BOOLEAN là kết quả chấm (đúng/sai) của bài ĐÃ NỘP trước đó (vd lịch sử "Mẹ giao thêm") — không phải đáp án. Chỉ đáng ngờ khi là CHUỖI (chữ cái/DS/số — chính đáp án).
      const dang = k === 'correct' && typeof x === 'boolean' ? false : KHOA_DAP_AN.includes(k) && x !== null && x !== undefined && x !== ''
      if (dang) ra.push([...duong, k].join('.'))
      else ra.push(...timDapAnLo(x, [...duong, k]))
    }
  }
  return ra
}

/** Dò lộ đáp án trên một lô phản hồi đã bắt (Map hoặc {key: {lenh, body}}). Trả danh sách {key, lenh, duong[]}. */
export function kiemLoDapAn(phanHoi) {
  const canh = []
  for (const [key, { lenh, body }] of (phanHoi instanceof Map ? phanHoi.entries() : Object.entries(phanHoi))) {
    if (!LENH_CHUA_CHAM.test(lenh) || LA_LENH_DA_CHAM.test(lenh)) continue
    const duong = timDapAnLo(body)
    if (duong.length) canh.push({ key, lenh, duong })
  }
  return canh
}

const bangSau = (a, b) => JSON.stringify(a) === JSON.stringify(b)

/**
 * So HAI lô phản hồi đã chuẩn hoá (giữ nguyên khoá `${stt}|${lenh}`). Trả {tongChung, khopY, khacNhau[], chiCu[], chiMoi[]}.
 * `khacNhau` mỗi phần tử {key, lenh}. KHÔNG kèm nội dung khác nhau (tránh in đề/số liệu em ra báo cáo) — dò tay bằng `key` khi cần.
 */
export function soPhanHoi(cu, moi) {
  const kCu = new Set(Object.keys(cu)), kMoi = new Set(Object.keys(moi))
  const chung = [...kCu].filter((k) => kMoi.has(k))
  const khacNhau = []
  for (const k of chung) if (!bangSau(cu[k].body, moi[k].body)) khacNhau.push({ key: k, lenh: cu[k].lenh })
  return {
    tongChung: chung.length,
    khopY: chung.length - khacNhau.length,
    khacNhau,
    chiCu: [...kCu].filter((k) => !kMoi.has(k)),
    chiMoi: [...kMoi].filter((k) => !kCu.has(k)),
  }
}

export function lapMarkdownPhanHoi({ cu, moi, ketQua, canhBaoDapAnCu, canhBaoDapAnMoi }) {
  const dong = []
  const P = (s = '') => dong.push(s)
  P(`# So phản hồi từng lệnh: ${cu} → ${moi}`)
  P()
  P(`So JSON phản hồi (đã chuẩn hoá: bỏ giờ/id ngẫu nhiên, văn bản câu rút thành hash) của CÙNG một cặp (em, lệnh) giữa hai lượt bắn tải, mỗi lượt lấy mẫu tối đa \`--mau-phan-hoi\` em đầu tiên.`)
  P()
  P(`- **Khớp cùng một cặp (em, lệnh) ở cả hai lượt:** ${ketQua.tongChung}`)
  P(`- **Y HỆT sau chuẩn hoá:** ${ketQua.khopY} (${ketQua.tongChung ? ((ketQua.khopY / ketQua.tongChung) * 100).toFixed(1) : '0'} %)`)
  P(`- **KHÁC NHAU:** ${ketQua.khacNhau.length}${ketQua.khacNhau.length ? ' — ' + [...new Set(ketQua.khacNhau.map((x) => x.lenh))].slice(0, 10).join(' · ') : ''}`)
  P(`- Chỉ có ở lượt cũ (kịch bản rẽ nhánh khác, không hẳn là lỗi): ${ketQua.chiCu.length}`)
  P(`- Chỉ có ở lượt mới: ${ketQua.chiMoi.length}`)
  P()
  P('## Dò lộ đáp án (phản hồi CHƯA CHẤM mà có `correct`/`dapAn`/`solution`/`loiGiai`)')
  P()
  P(`- Lượt **${cu}**: ${canhBaoDapAnCu.length === 0 ? '✅ không thấy' : `❌ ${canhBaoDapAnCu.length} phản hồi — ${canhBaoDapAnCu.slice(0, 6).map((x) => `\`${x.lenh}\` (${x.duong.join(', ')})`).join('; ')}`}`)
  P(`- Lượt **${moi}**: ${canhBaoDapAnMoi.length === 0 ? '✅ không thấy' : `❌ ${canhBaoDapAnMoi.length} phản hồi — ${canhBaoDapAnMoi.slice(0, 6).map((x) => `\`${x.lenh}\` (${x.duong.join(', ')})`).join('; ')}`}`)
  P()
  if (ketQua.khacNhau.length) {
    P('## Các lệnh KHÁC NHAU (khoá `stt|lệnh` — dò tay bằng cách chạy lại đúng em ấy nếu cần xem nội dung)')
    P()
    for (const x of ketQua.khacNhau.slice(0, 60)) P(`- \`${x.key}\``)
    if (ketQua.khacNhau.length > 60) P(`- … và ${ketQua.khacNhau.length - 60} lệnh khác`)
    P()
  }
  P('Giới hạn: chuẩn hoá bỏ MỌI chuỗi ISO-8601 và số 13 chữ số, nên hạn nộp/mốc thật cũng bị che — khác biệt về HẠN không hiện ở đây, chỉ hiện khác biệt về CẤU TRÚC/NỘI DUNG khác giờ.')
  return dong.join('\n') + '\n'
}
