// CÂU RÚT GỌN — đọc câu trong kho KHÔNG kèm ảnh / lời giải / bảng (14/10, tối ưu giờ cao điểm: cao điểm 13/10 có 135 yêu cầu chết vì isolate vượt 128 MB;
// các lệnh lọc/đếm câu từng nạp JSON đầy đủ của 1.500–1.700 câu một lượt ≈ 6–7 triệu ký tự). Tách từ srs2-d1.ts để mọi mô-đun dùng chung, không vòng import.
import { docCauTuJson, laCauTuLuan } from './cam-tu-luan'

type Row = Record<string, unknown>

/**
 * Phần SQL đọc câu RÚT GỌN cho `tuLuanTuMeta` (bảng `game_v2_question`, cột `json`): câu bỏ trường nặng (ảnh, lời giải, bảng), ảnh phương án/ý thay bằng
 * mảng 0/1 cùng thứ tự, hình kèm câu thay bằng `{viTri, src: 'x'|''}`. Đủ MỌI trường `lyDoTuLuan` đọc ⇒ kết quả trùng `laCauTuLuan(câu đầy đủ)`
 * (phản biện #108: trước đây độn phương án bằng 'x' theo số lượng ⇒ phương án rỗng chữ lọt, kế hoạch đếm mà Đảo bỏ ⇒ rương vẫn kẹt).
 * CHÚ Ý: trong `json_each(...)` phải ghi `game_v2_question.json` — tên trần `json` bị hiểu là cột ẩn `json` của chính `json_each` (ra mảng rỗng).
 */
/** SQL: giá trị JSON (kiểu `t`, giá trị `v` của `json_each`) có "thật" theo JS `Boolean` không (null/false/''/0 ⇒ 0, còn lại — kể cả mảng/đối tượng rỗng — ⇒ 1). */
const THAT_JS = (v: string, t: string) => `(CASE ${t} WHEN 'null' THEN 0 WHEN 'false' THEN 0 WHEN 'text' THEN ${v} <> '' WHEN 'integer' THEN ${v} <> 0 WHEN 'real' THEN ${v} <> 0 ELSE 1 END)`
/** SQL: cờ 0/1 của MỘT phần tử mảng ảnh phương án/ý đúng như `CO_ANH` (src/lib/cau-tu-luan.ts): mảng ⇒ có phần tử "thật"; còn lại ⇒ `Boolean`. */
const CO_ANH_SQL = `CASE WHEN e.type = 'array' THEN EXISTS (SELECT 1 FROM json_each(e.value) f WHERE ${THAT_JS('f.value', 'f.type')}) ELSE ${THAT_JS('e.value', 'e.type')} END`
/** SQL: đường dẫn của khoá đầu tiên CÓ MẶT (kể cả JSON null) — đúng `lay(c, khoa1, khoa2)` (`!== undefined`). */
const KHOA_DAU = (a: string, b: string) => `(CASE WHEN json_type(game_v2_question.json,'$.${a}') IS NOT NULL THEN '$.${a}' ELSE '$.${b}' END)`
/** SQL: mảng cờ ảnh (chỉ khi giá trị là MẢNG — JS `Array.isArray(anh) ? anh : []`; chuỗi/đối tượng đơn ⇒ không có cờ nào). */
const CO_ANH_MANG = (a: string, b: string) =>
  `(SELECT json_group_array(${CO_ANH_SQL}) FROM json_each(game_v2_question.json, ${KHOA_DAU(a, b)}) e WHERE json_type(game_v2_question.json, ${KHOA_DAU(a, b)}) = 'array')`
/** SQL: "thật" của khoá `k` trong đối tượng `e.value` (khoá vắng/null ⇒ NULL để COALESCE sang khoá kế — đúng `??`). */
const THAT_KHOA = (k: string) => `CASE WHEN COALESCE(json_type(e.value,'$.${k}'),'null') = 'null' THEN NULL ELSE ${THAT_JS(`json_extract(e.value,'$.${k}')`, `json_type(e.value,'$.${k}')`)} END`
/** Phần SQL câu rút gọn; `giuKienThuc` ⇒ giữ nhãn kiến thức trong `gon` (pool theo dạng của `readScope` cần nhãn để chọn câu). */
const sqlCauGon = (giuKienThuc: boolean) => `json_remove(game_v2_question.json,'$.imageDataUrl','$.thanCauImg','$.solution','$.table','$.choiceImgs','$.ideaImgs','$.hinhAnh','$.hinh',${giuKienThuc ? '' : "'$.kienThuc',"}'$.anhLuaChon','$.anhY') AS gon,
        ${CO_ANH_MANG('choiceImgs', 'anhLuaChon')} AS anh_pa,
        ${CO_ANH_MANG('ideaImgs', 'anhY')} AS anh_y,
        (SELECT json_group_array(json_object('viTri', COALESCE(json_extract(e.value,'$.viTri'), json_extract(e.value,'$.vi_tri')),
            'src', CASE WHEN COALESCE(${THAT_KHOA('src')}, ${THAT_KHOA('url')}, ${THAT_KHOA('data')}, 0) THEN 'x' ELSE '' END))
          FROM json_each(game_v2_question.json, ${KHOA_DAU('hinh', 'hinhAnh')}) e
          WHERE e.type = 'object' AND json_type(game_v2_question.json, ${KHOA_DAU('hinh', 'hinhAnh')}) = 'array') AS hinh_gon`
export const SQL_CAU_GON = sqlCauGon(false)
/** Như `SQL_CAU_GON` nhưng giữ `kienThuc` trong `gon`. */
export const SQL_CAU_GON_KIEN_THUC = sqlCauGon(true)
const mangJson = (v: unknown): unknown[] => {
  try { const a = JSON.parse(typeof v === 'string' ? v : '[]') as unknown; return Array.isArray(a) ? a : [] } catch { return [] }
}
/**
 * Câu RÚT GỌN dựng lại từ một dòng đọc bằng `SQL_CAU_GON`: mọi trường của câu trừ ảnh / lời giải / bảng / kiến thức; ảnh phương án/ý thành mảng cờ,
 * hình kèm câu thành `{viTri, src}`. Đủ cho `laCauTuLuan`, khối câu (`khoi-cau.ts`), phần, mức độ, sao, dạng. JSON không đọc được ⇒ null.
 * Cỡ (số đo kho thật 14/10): ~650 ký tự/câu so với ~3.950 của JSON đầy đủ (có câu 290.000 vì ảnh) — dùng ở mọi chỗ chỉ LỌC/ĐẾM câu.
 */
export function cauGonTuDong(x: Row): Record<string, unknown> | null {
  const c = docCauTuJson(x.gon)
  if (!c) return null
  const anhPa = mangJson(x.anh_pa), anhY = mangJson(x.anh_y), hinh = mangJson(x.hinh_gon)
  return { ...c, ...(anhPa.length ? { choiceImgs: anhPa } : {}), ...(anhY.length ? { ideaImgs: anhY } : {}), ...(hinh.length ? { hinhAnh: hinh } : {}) }
}
/** Cờ tự luận của một dòng đọc bằng `SQL_CAU_GON`: dựng lại câu (ảnh = cờ) rồi hỏi ĐÚNG `laCauTuLuan` như lúc phát câu. JSON không đọc được ⇒ tự luận (không phục vụ). */
export function tuLuanTuMeta(x: Row): boolean {
  const c = cauGonTuDong(x)
  return !c || laCauTuLuan(c)
}
