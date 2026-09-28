// LÀM SẠCH MỘT ĐOẠN LỜI trước khi vẽ (dùng chung: cảnh báo của thầy, thử thách riêng…). Tách ra từ `bo-nao-hien-thi.ts` khi gỡ Bộ não A.I (28/09/2026), giữ nguyên hành vi.
// Tệp THUẦN: bỏ ký tự điều khiển, gọn khoảng trắng, chặn độ dài — chữ luôn được vẽ như CHỮ (React), không bao giờ như HTML.

const TRAN_LOI = 400

/** Làm sạch một đoạn chữ: bỏ ký tự điều khiển, gọn khoảng trắng THEO DÒNG (giữ xuống dòng), cắt tại `tran`. Rỗng ⇒ ''. */
export function lamSachLoi(v: unknown, tran = TRAN_LOI): string {
  if (typeof v !== 'string') return ''
  // eslint-disable-next-line no-control-regex
  const s = v.replace(/[\u0000-\u0009\u000B-\u001F\u007F-\u009F\u200B-\u200F\u2028\u2029\uFEFF]/g, '').replace(/[ \t]+/g, ' ').replace(/ ?\n ?/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
  if (s.length <= tran) return s
  // cắt ở ranh giới câu/từ gần nhất, thêm dấu ba chấm — không cắt cụt giữa chữ
  const cat = s.slice(0, tran)
  // ƯU TIÊN dừng sau dấu kết câu (giữ dấu), rồi mới tới ranh giới từ; đều phải nằm ở 60% cuối của trần, không thì cắt cứng.
  const cauKet = Math.max(cat.lastIndexOf('. '), cat.lastIndexOf('! '), cat.lastIndexOf('? '))
  const tu = cat.lastIndexOf(' ')
  const dungTai = cauKet >= tran * 0.6 ? cauKet + 1 : tu >= tran * 0.6 ? tu : tran
  return `${cat.slice(0, dungTai).trimEnd()}…`
}
