// BẢNG SIÊU DỮ LIỆU CÂU TÍNH SẴN (B2 — thầy 15/10: "giữ làm cả đợt 1 và 2"; docs/de-xuat-toi-uu-1510.md).
// Số đo D1 thật cao điểm 14/10 19:30–22:30: ba câu đọc siêu dữ liệu câu TÁCH JSON mỗi lượt — srs2 `docMetaCauD1` 5.980 lần × 16 ms, omni `SQL_CAU_KHO`
// 8.830 × 8,9 ms, danh mục Hành trình (`dungDanhMuc`) 1.270 × 48 ms ≈ 235 s trên 1.047 s D1. Bảng `cau_meta` giữ SẴN các cột ấy, tính bằng ĐÚNG biểu
// thức SQL cũ trên ĐÚNG dòng `game_v2_question` ⇒ đọc ra cùng giá trị, không phải tách JSON câu (kèm ảnh) mỗi lượt.
// ĐÚNG ĐẮN (không bao giờ trả số cũ):
//  · `cau_meta_to(ma_de, indexed_at)`: tờ nào đã dựng, ứng với mốc lập chỉ mục nào. Mọi đường ghi câu (`lapChiMucTo` game-v2-bank.ts, scripts/ap-goi7-song.ts)
//    ghi `game_v2_index.indexed_at` CÙNG lô với câu ⇒ mốc khớp ⇔ câu của tờ chưa đổi kể từ lúc dựng.
//  · Dòng DẤU `cau_meta_to('*')`: chỉ ghi khi cron đã dựng hết tờ lệch VÀ kiểm không còn tờ "mồ côi" (có câu trong `game_v2_question` mà không có dòng
//    `game_v2_index` — bảng mốc không thấy tờ ấy). Có tờ mồ côi ⇒ xoá dấu ⇒ mọi câu đọc đi đường cũ (D1 test dựng câu không kèm mốc rơi đúng vào đây).
//  · Câu đọc mang điều kiện KHỚP (`KHOP`): có DẤU và MỌI tờ trong `game_v2_index` có dòng `cau_meta_to` cùng mốc. Khớp ⇒ nhánh `cau_meta`; lệch (tờ vừa lập lại,
//    bảng chưa dựng xong, D1 mới) ⇒ CÙNG câu SQL đọc thẳng `game_v2_question` như cũ (UNION ALL hai nhánh loại trừ nhau): một lệnh, một ảnh chụp D1,
//    không thêm vòng chờ, không có khe giữa "kiểm" và "đọc".
//  · Cron mỗi phút (`dongBoCauMeta`) dựng lại tờ lệch: xoá dòng cũ của tờ + chèn từ `game_v2_question` + ghi mốc — MỘT lô (giao dịch) ⇒ không có tờ dựng dở.
// Bảng chỉ là ĐỆM DẪN XUẤT (xoá đi thì tự dựng lại); schema chỉ-thêm: server/migration-z-1510-cau-meta.sql (bản sao `SQL_CAU_META`).
import type { Env, D1PreparedStatement } from './kieu'
import { SQL_CAU_GON } from './cau-gon'

export const SQL_CAU_META: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS cau_meta(ma_de TEXT NOT NULL,qid TEXT NOT NULL,thu_tu INTEGER NOT NULL,version,content_group,dang,phan,muc_do,ten_dang,sao,lop_json,chuyen_de,kien_thuc,kien_thuc_y,tu_luan,reviewed,nhan_ht,gon,anh_pa,anh_y,hinh_gon,j_qid,j_version,PRIMARY KEY(ma_de,qid))`,
  `CREATE INDEX IF NOT EXISTS cau_meta_qid ON cau_meta(qid,thu_tu)`,
  `CREATE TABLE IF NOT EXISTS cau_meta_to(ma_de TEXT PRIMARY KEY,indexed_at TEXT NOT NULL)`,
]

/**
 * Điều kiện KHỚP (biểu thức vô hướng, 1 ⇔ có DẤU và mọi tờ đã lập chỉ mục có bản dựng `cau_meta` cùng mốc). Câu đọc: nhánh `cau_meta` ghép `WHERE ${KHOP}`,
 * nhánh cũ ghép `WHERE NOT ${KHOP}`. Câu PHẢI bắt đầu bằng SELECT (không dùng WITH): bản gộp D1 (doc-d1-theo-luot.ts) chỉ coi câu mở đầu SELECT là câu đọc
 * — câu mở đầu WITH bị xếp như lệnh ghi (chờ mọi lượt đọc trước) và mất đệm chung 60 giây (cổng tốc độ bắt được: +2 đợt ở sảnh / mở chặng).
 */
export const KHOP = `(EXISTS (SELECT 1 FROM cau_meta_to WHERE ma_de='*') AND NOT EXISTS (SELECT 1 FROM game_v2_index gi LEFT JOIN cau_meta_to mt ON mt.ma_de=gi.ma_de WHERE mt.indexed_at IS NOT gi.indexed_at))`
const SQL_TO_LECH = 'SELECT gi.ma_de FROM game_v2_index gi LEFT JOIN cau_meta_to mt ON mt.ma_de=gi.ma_de WHERE mt.indexed_at IS NOT gi.indexed_at LIMIT ?1'
/** Tờ mồ côi: có câu mà không có dòng mốc. Dò theo khoá chính (ma_de, qid) — chỉ chạy khi vừa dựng xong / chưa có dấu (hiếm). */
const SQL_CO_MO_COI = 'SELECT EXISTS (SELECT 1 FROM game_v2_question q WHERE NOT EXISTS (SELECT 1 FROM game_v2_index gi WHERE gi.ma_de=q.ma_de)) AS n'

/** Các cột dẫn xuất, ĐÚNG biểu thức các câu đọc cũ (bảng `game_v2_question`, cột `json`), theo thứ tự cột của `cau_meta` sau `dang`. */
const COT_DAN_XUAT = `json_extract(json,'$.phan'), json_extract(json,'$.mucDo'), json_extract(json,'$.tenDang'), json_extract(json,'$.sao'),
  COALESCE(json_extract(json,'$.lop'), json_extract(json,'$.khoi')), json_extract(json,'$.chuyenDe'), json_extract(json,'$.kienThuc'),
  json_extract(json,'$.kienThucY'), json_extract(json,'$.tuLuan'), json_extract(json,'$.reviewed'), json_extract(json,'$.hanhTrinh'),
  ${SQL_CAU_GON}, json_extract(json,'$.qid'), json_extract(json,'$.version')`

/** Lô dựng lại MỘT tờ (giao dịch): dòng JSON hỏng không vào bảng — mọi câu đọc cũ đều lọc `json_valid(json)`. */
export function lenhDungTo(env: Env, maDe: string): D1PreparedStatement[] {
  return [
    env.DB.prepare('DELETE FROM cau_meta WHERE ma_de=?1').bind(maDe),
    env.DB.prepare(`INSERT INTO cau_meta SELECT ma_de, qid, rowid, version, content_group, dang, ${COT_DAN_XUAT} FROM game_v2_question WHERE ma_de=?1 AND json_valid(json)`).bind(maDe),
    env.DB.prepare('INSERT INTO cau_meta_to(ma_de,indexed_at) SELECT ma_de,indexed_at FROM game_v2_index WHERE ma_de=?1 ON CONFLICT(ma_de) DO UPDATE SET indexed_at=excluded.indexed_at').bind(maDe),
  ]
}

const daTao = new WeakMap<object, Promise<void>>()
/** Tạo bảng (mỗi isolate một lần; lỗi ⇒ lần sau thử lại). Chỉ gọi trong cron — đường đọc không cần (thiếu bảng ⇒ lỗi ⇒ nơi gọi đọc như cũ). */
function damBaoBang(env: Env): Promise<void> {
  const db = env.DB as unknown as object
  let p = daTao.get(db)
  if (!p) {
    p = env.DB.batch(SQL_CAU_META.map((s) => env.DB.prepare(s))).then(() => undefined)
    p.catch(() => daTao.delete(db))
    daTao.set(db, p)
  }
  return p
}

/**
 * Cron mỗi phút: dựng lại tối đa `toiDa` tờ đang lệch (mỗi tờ một lô). Trạng thái thường ngày: không tờ nào lệch, có dấu ⇒ MỘT lô hai câu đọc nhẹ.
 * Thầy sửa một tờ ⇒ tờ ấy lệch ⇒ mọi câu đọc tạm đi đường cũ cho tới phút kế tiếp. Dựng xong hết (hoặc chưa có dấu) ⇒ kiểm tờ mồ côi rồi ghi/xoá dấu.
 */
export async function dongBoCauMeta(env: Env, toiDa: number): Promise<{ dung: number; conNua: boolean; khop: boolean }> {
  await damBaoBang(env)
  const [r, dau] = await env.DB.batch([
    env.DB.prepare(SQL_TO_LECH).bind(toiDa + 1),
    env.DB.prepare("SELECT ma_de, indexed_at FROM cau_meta_to WHERE ma_de IN ('*','!')"),
  ])
  const lech = ((r?.results ?? []) as { ma_de: string }[]).map((x) => String(x.ma_de))
  const dauDong = (dau?.results ?? []) as { ma_de: string; indexed_at: string }[]
  const coDau = dauDong.some((x) => x.ma_de === '*')
  const dung = lech.slice(0, toiDa)
  for (const ma of dung) await env.DB.batch(lenhDungTo(env, ma))
  const conNua = lech.length > dung.length
  if (conNua || (!dung.length && coDau)) return { dung: dung.length, conNua, khop: !conNua && coDau }
  // Lần kiểm trước thấy tờ mồ côi (dòng '!') chưa quá 1 giờ và không tờ nào vừa dựng ⇒ không dò lại (dò ~ một lượt khoá chính bảng câu).
  const moCoiLuc = Date.parse(dauDong.find((x) => x.ma_de === '!')?.indexed_at ?? '')
  if (!dung.length && Number.isFinite(moCoiLuc) && Date.now() - moCoiLuc < 3_600_000) return { dung: 0, conNua: false, khop: false }
  const moCoi = await env.DB.prepare(SQL_CO_MO_COI).first<{ n: number }>()
  const khop = !Number(moCoi?.n)
  const luc = new Date().toISOString()
  await env.DB.batch(khop
    ? [env.DB.prepare("INSERT INTO cau_meta_to(ma_de,indexed_at) VALUES('*',?1) ON CONFLICT(ma_de) DO UPDATE SET indexed_at=excluded.indexed_at").bind(luc),
      env.DB.prepare("DELETE FROM cau_meta_to WHERE ma_de='!'")]
    : [env.DB.prepare("DELETE FROM cau_meta_to WHERE ma_de='*'"),
      env.DB.prepare("INSERT INTO cau_meta_to(ma_de,indexed_at) VALUES('!',?1) ON CONFLICT(ma_de) DO UPDATE SET indexed_at=excluded.indexed_at").bind(luc)])
  if (!khop) console.error('[cau-meta] có tờ chưa có mốc lập chỉ mục — câu đọc đi đường cũ')
  return { dung: dung.length, conNua, khop }
}
