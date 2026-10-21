// LỊCH SỬ LÀM CÂU CỦA MỘT EM (thầy 09/10 khuya: "bấm vào từng học sinh hiển thị rõ toàn bộ lịch sử, câu làm sai số giây làm mỗi câu,
// mọi thứ về học sinh đó"). Hợp đồng ĐÃ CHỐT: `lich-su-lam-cau-kieu.ts` (dùng chung với app thầy).
//
// `POST /gv/lich-su-lam-cau {sbd, gioiHan?}` — LỆNH THẦY, CHỈ ĐỌC (sau cổng `laThay`, chạy trên `envDoc`). Không ghi gì.
//   · Đọc sổ `su_kien_hoc` của MỘT em (lọc `sbd` ⇒ chỉ mục `idx_skh_em_ngay`), mọi nguồn, tối đa 5000 lượt gần nhất (`catBot` khi vượt);
//     bỏ sự kiện "đọc lời giải" (`purpose = 'xem_loi_giai'`) và sự kiện còn giấu (`visibility = 'embargoed'`). D1 cũ thiếu cột chuẩn ⇒ lùi câu cột gốc.
//   · `lan`: `gioiHan` lượt mới nhất (mặc định 1000, trần 5000 = đúng cửa sổ đọc). `tong` + `cauSai` tính trên MỌI lượt đã đọc.
//   · SỐ GIÂY (không bịa): cột `giay` (> 0) ⇒ `raw_json.ms` (> 0, làm tròn, ≥ 1) ⇒ 'do'; ca thi còn thiếu ⇒ `chi_tiet_cau.giay` ⇒ 'do';
//     game còn thiếu ⇒ ƯỚC TÍNH từ mốc trả lời (`giayUocTinhGame`, ai-sai-cau.ts) ⇒ 'uoc'; còn lại null.
//   · ĐÁP ÁN CHỌN (như `gvHoSoLenBang`): `raw_json.chon`/`traLoi` ⇒ `game_v2_attempt` (`traLoiGoc`/`traLoi`) ⇒ `chi_tiet_cau.dap_an_chon` (ca thi).
//   · TIÊU ĐỀ câu: cách sẵn có của máy chủ (omni-gv "Câu N · <tên dạng>"): số câu theo quy ước mã câu `<mã tờ>-<phần>-<số>` + tên dạng
//     tra kho `game_v2_question` (`docCauKho`, đệm 10 phút) hoặc mã dạng của sổ (`tenCuaDang`). Không tra được tên dạng ⇒ chuỗi rỗng (app ghi theo mã câu).
//   · CÂU TỪNG SAI gom theo CÂU GỐC (song sinh / biến thể `~ss|~bt|~yd`, lượt lặp `#n`, câu thay thế `raw_json.tc` ⇒ câu gốc — như mọi nơi
//     đọc sổ quy về câu gốc): "đúng lại" ở bản khác cũng là em đã sửa được.
// 12/10F: lõi `lichSuLamCauCuaEm` dùng chung cho lệnh EM `/hs/lich-su-lam-cau` (ho-so-em-hs.ts: SBD từ token, thêm bỏ lượt ca chưa công bố, lọc bản
// học sinh ở ho-so-em-hs-loc.ts) — một phép tính, không bản thứ hai.
// Truy vấn: sổ (1) + em (2) + kho (1/800 câu, đệm) + tên dạng thiếu (≤ 1) + loại game (1) + lượt game (1) + ước tính (1 lô 2) + chi tiết ca (1). Khối phụ
// nào lỗi thì để trống phần ấy (chon/giây/tiêu đề = null/rỗng), không làm hỏng cả lệnh.
import type { Env } from './kieu'
import type { CauEmSai, LanLamCau, NguonGiay, TraLoiLichSuLamCau } from './lich-su-lam-cau-kieu'
import { chiTietCauCuaLuot, giayDoCuaLuot, giayUocTinhGame, noiCuaCa } from './ai-sai-cau'
import { loaiGameCua } from './dau-gio'
import { tachSongSinh } from './loi-hoc-luat'
import { docBetaCau, docCauKho, tenCuaDang } from './omni-d1'
import { docKichThuocCau } from './cau-doc-giay'
import { tongMucLam, type MucLamLuot } from './muc-lam'
import { chuanMucDo, docDoMuc, gocCanBeta, mucLamTuDong, type DoMucLuot, giayTuKhoangCach } from './muc-lam-so'
import { tenLopCuaEm } from './ten-lop'
import { SQL_DA_CONG_BO } from './cong-bo-diem'
import { tenNguonNgan } from '../../src/lib/dau-gio'

type Row = Record<string, unknown>
const str = (x: unknown): string => (x === null || x === undefined ? '' : String(x)).trim()

/** Số lượt gần nhất máy chủ đọc tối đa cho một em (vượt ⇒ `catBot`). */
export const TOI_DA_LUOT_DOC_LICH_SU = 5000
export const GIOI_HAN_LAN_MAC_DINH = 1000
// Trần = đúng cửa sổ đọc (21/10, số đo thật: 267 em, 108 em vượt 1000 dòng, 3 em vượt 2000, nhiều nhất 2544 ⇒ trần cũ 2000 giấu lượt cũ nhất của 3 em). Mặc định VẪN 1000: đường mở tấm không nặng thêm.
export const TRAN_GIOI_HAN_LAN = TOI_DA_LUOT_DOC_LICH_SU

async function hoi(env: Env, sql: string, ...bind: unknown[]): Promise<Row[] | null> {
  try {
    return (await env.DB.prepare(sql).bind(...bind).all<Row>()).results ?? []
  } catch {
    return null
  }
}

export { chuanMucDo } // nơi gốc: muc-lam-so.ts (cùng bộ chuẩn hoá cho Lịch sử làm câu, "Ai đã sai?", hồ sơ em lên bảng)

/** Tiêu đề câu: "Câu 25 · <tên dạng>" (số câu theo mã `<mã tờ>-<phần>-<số>` của câu gốc); mã khác quy ước ⇒ chỉ tên dạng; không tên dạng ⇒ ''. */
export function tieuDeCau(qid: string, tenDang: string): string {
  const ten = tenDang.trim()
  if (!ten) return ''
  const m = /-(III|II|I)-(\d+)$/.exec(tachSongSinh(qid).goc)
  return m ? `Câu ${Number(m[2])} · ${ten}` : ten
}

function docRaw(raw: unknown): Row | null {
  if (raw === null || raw === undefined || raw === '') return null
  try {
    const j = JSON.parse(String(raw)) as unknown
    return j && typeof j === 'object' && !Array.isArray(j) ? (j as Row) : null
  } catch {
    return null
  }
}

/** Đáp án em chọn trong `raw_json` (`chon`, rồi `traLoi`) — như `chonTuRaw` (ho-so-em-chieu.ts); mảng giá trị đơn ⇒ nối; đối tượng ⇒ null. */
export function chonTuGiaTri(v: unknown): string | null {
  if (v === null || v === undefined) return null
  const s = typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
    ? String(v)
    : Array.isArray(v) && v.every((x) => typeof x === 'string' || typeof x === 'number')
      ? v.join('')
      : ''
  const t = s.trim()
  return t ? t.slice(0, 40) : null
}

const ngayVnTuLuc = (luc: string): string => {
  const t = Date.parse(luc)
  return Number.isFinite(t) ? new Date(t + 7 * 3_600_000).toISOString().slice(0, 10) : ''
}

/** Dòng sổ đã đọc (nội bộ). */
interface Dong {
  qid: string
  goc: string
  nguon: string
  maNguon: string
  lanThu: number
  ketQua: number | null
  luc: string
  ngay: string
  maDang: string
  mucDo: string
  attemptId: string
  coGoiY: boolean
  /** Cột `giay` của sổ (thô). */
  giayCot: unknown
  raw: Row | null
  tenCa: string
  /** Kích thước đề + đồng hồ MỚI của lượt (`raw_json.doc` với `dh = 1`); null ⇒ lượt chưa có số đo để xếp Mức làm. */
  doMuc: DoMucLuot | null
}

/** AI ĐỌC SỔ (12/10F — học sinh xem hồ sơ của chính mình): 'thay' = lệnh thầy, như trước; 'hoc-sinh' = lệnh em (`/hs/lich-su-lam-cau`,
 *  `/hs/ho-so-thai-do`) — THÊM bỏ lượt của ca kiểm tra chưa công bố / đã xoá (`sqlLuotCaDaCongBo`) và KHÔNG lùi về câu lệnh không lọc khi D1 thiếu cột
 *  (lùi thì lộ lượt còn giấu) ⇒ báo lỗi. Ngoài hai điểm ấy là CÙNG một phép tính ⇒ em và thầy thấy cùng số (khi không có ca chưa công bố). */
export type NguoiDocSo = 'thay' | 'hoc-sinh'

/** Điều kiện SQL "lượt này em được xem kết quả": không phải lượt ca kiểm tra, hoặc ca còn (không `da_xoa`) và ĐÃ công bố — ĐÚNG luật `SQL_DA_CONG_BO`
 *  (như `SQL_LUOT_GOI7`, `/ph/con-tong-quan`). `bang` = tên / bí danh bảng `su_kien_hoc` trong câu lệnh. Ca không có dòng trong `ca` ⇒ KHÔNG công bố. */
export const sqlLuotCaDaCongBo = (bang: string): string =>
  `(${bang}.nguon <> 'thi' OR EXISTS (SELECT 1 FROM ca cb WHERE cb.ma_ca = ${bang}.ma_nguon AND COALESCE(cb.trang_thai, '') <> 'da_xoa' AND ${SQL_DA_CONG_BO('cb')}))`

export async function gvLichSuLamCau(env: Env, b: Row): Promise<TraLoiLichSuLamCau> {
  const sbd = str(b.sbd)
  if (!sbd) return { ok: false, error: 'Thiếu số báo danh' }
  if (sbd.length > 40) return { ok: false, error: 'Số báo danh quá dài' }
  return lichSuLamCauCuaEm(env, sbd, b.gioiHan, 'thay')
}

/** LÕI lịch sử làm câu của MỘT em (`sbd` đã kiểm ở nơi gọi: thầy ⇒ thân lệnh; em ⇒ token). Xem đầu tệp; `nguoiDoc` xem `NguoiDocSo`. */
export async function lichSuLamCauCuaEm(env: Env, sbd: string, gioiHanThan: unknown, nguoiDoc: NguoiDocSo): Promise<TraLoiLichSuLamCau> {
  const gx = Math.floor(Number(gioiHanThan))
  const gioiHan = Number.isFinite(gx) && gx > 0 ? Math.min(TRAN_GIOI_HAN_LAN, gx) : GIOI_HAN_LAN_MAC_DINH

  // 1 · em: họ tên từ `danh_sach` (lùi `hoc_sinh`), lớp = tên lớp hiệu lực (`hoc_sinh.ten_lop`, chưa gán ⇒ mặc định theo khối).
  const [rDs, rHs] = await Promise.all([
    hoi(env, 'SELECT ho_ten, lop FROM danh_sach WHERE sbd = ?', sbd),
    hoi(env, 'SELECT ho_ten, lop, ten_lop FROM hoc_sinh WHERE sbd = ?', sbd).then((r) => r ?? hoi(env, 'SELECT ho_ten, lop, NULL AS ten_lop FROM hoc_sinh WHERE sbd = ?', sbd)),
  ])
  if (!rDs && !rHs) return { ok: false, error: 'Không đọc được học sinh' }
  const ds0 = rDs?.[0], hs0 = rHs?.[0]
  if (!ds0 && !hs0) return { ok: false, error: 'Không tìm thấy học sinh' }
  const em = {
    sbd,
    hoTen: str(ds0?.ho_ten) || str(hs0?.ho_ten) || sbd,
    lop: hs0 || str(ds0?.lop) ? tenLopCuaEm(str(hs0?.lop) || str(ds0?.lop), hs0?.ten_lop) : '',
  }

  // 2 · sổ: tối đa 5000 lượt gần nhất (+1 để biết còn nữa). Thứ tự (ngay_vn, luc) giảm ⇒ đi theo chỉ mục (sbd, ngay_vn).
  const COT = 's.qid, s.nguon, s.ma_nguon, s.lan, s.ket_qua, s.giay, s.luc, s.ngay_vn, s.ma_dang, s.muc_do, c.ten_ca AS ten_ca'
  const TU = "FROM su_kien_hoc s LEFT JOIN ca c ON s.nguon = 'thi' AND c.ma_ca = s.ma_nguon WHERE s.sbd = ?"
  const SAU = `ORDER BY s.ngay_vn DESC, s.luc DESC LIMIT ${TOI_DA_LUOT_DOC_LICH_SU + 1}`
  const locEm = nguoiDoc === 'hoc-sinh' ? ` AND ${sqlLuotCaDaCongBo('s')}` : ''
  const rSo =
    (await hoi(env, `SELECT ${COT}, s.attempt_id, s.assistance, CASE WHEN json_valid(s.raw_json) THEN s.raw_json END AS raw_json ${TU}
        AND COALESCE(s.purpose, '') <> 'xem_loi_giai' AND COALESCE(s.visibility, '') <> 'embargoed'${locEm} ${SAU}`, sbd)) ??
    (nguoiDoc === 'thay' ? await hoi(env, `SELECT ${COT} ${TU} ${SAU}`, sbd) : null)
  if (!rSo) return { ok: false, error: 'Không đọc được sổ học của em' }
  const catBot = rSo.length > TOI_DA_LUOT_DOC_LICH_SU
  const dong: Dong[] = rSo.slice(0, TOI_DA_LUOT_DOC_LICH_SU).map((x) => {
    const qid = str(x.qid)
    const raw = docRaw(x.raw_json)
    const kq = x.ket_qua === null || x.ket_qua === undefined || x.ket_qua === '' ? null : Number(x.ket_qua)
    const luc = str(x.luc)
    return {
      qid,
      goc: str(raw?.tc) ? tachSongSinh(str(raw?.tc)).goc : tachSongSinh(qid).goc,
      nguon: str(x.nguon),
      maNguon: str(x.ma_nguon),
      lanThu: Number(x.lan) || 1,
      ketQua: kq === null || !Number.isFinite(kq) ? null : kq,
      luc,
      ngay: str(x.ngay_vn) || ngayVnTuLuc(luc),
      maDang: str(x.ma_dang),
      mucDo: chuanMucDo(x.muc_do),
      attemptId: str(x.attempt_id),
      coGoiY: str(x.assistance) === 'assisted',
      giayCot: x.giay,
      raw,
      tenCa: str(x.ten_ca),
      doMuc: docDoMuc(raw),
    }
  })
  // Mới trước theo `luc` (sắp ổn định — phòng dòng có ngày VN lệch giờ).
  dong.sort((a, c) => (a.luc < c.luc ? 1 : a.luc > c.luc ? -1 : 0))

  // 3 · tra phụ (song song): kho câu, loại game, đáp án lượt game, ước tính giây game (chỉ lượt chưa có số đo), chi tiết ca thi.
  const doThat = dong.map((d) => giayDoCuaLuot(d.giayCot, d.raw?.ms))
  const goc = [...new Set(dong.map((d) => d.goc).filter(Boolean))]
  const game = dong.filter((d) => d.nguon === 'game')
  const gameThieuGiay = dong.filter((d, i) => d.nguon === 'game' && doThat[i] === null).map((d) => ({ sbd, phien: d.maNguon }))
  const idGameCanChon = [...new Set(game.filter((d) => chonTuGiaTri(d.raw?.chon ?? d.raw?.traLoi) === null).map((d) => d.attemptId || `${d.maNguon}|${d.qid}`))]
  const caThi = [...new Set(dong.filter((d) => d.nguon === 'thi').map((d) => d.maNguon))]
  type KhoGon = { tenDang: string | null; mucDo: string | null }
  // Mức làm 1–4: CHỈ lượt có số đo mới (đồng hồ mới + kích thước đề) cần β của câu ⇒ tập này nhỏ (0 lượt trước khi máy em nạp bản mới); đọc CÙNG đợt với các khối dưới (0 vòng chờ nối tiếp thêm).
  const gocMuc = gocCanBeta(dong.map((d, i) => ({ doMuc: d.doMuc, giayDo: doThat[i] ?? null, goc: d.goc })))
  // ĐO LẠI LƯỢT CŨ (21/10): kích thước đề (bảng tính sẵn) của các câu mà lượt chưa có `doc` — MỘT lệnh đọc CÙNG đợt, lỗi / bảng chưa có ⇒ rỗng (lượt cũ vẫn "Chưa có số đo").
  const gocCanKichThuoc = [...new Set(dong.filter((d) => !d.doMuc && d.goc).map((d) => d.goc))]
  const [kho, loai, rAtt, uoc, ct, beta, kichThuoc] = await Promise.all([
    docCauKho(env, goc).catch(() => new Map<string, KhoGon>()) as Promise<Map<string, KhoGon>>,
    loaiGameCua(env, game.map((d) => d.maNguon)).catch(() => new Map<string, 'doan' | 'bia' | 'dao'>()),
    idGameCanChon.length
      ? hoi(env, "SELECT id, CASE WHEN json_valid(json) THEN COALESCE(json_extract(json, '$.traLoiGoc'), json_extract(json, '$.traLoi')) END AS tra_loi FROM game_v2_attempt WHERE sbd = ? AND id IN (SELECT value FROM json_each(?))", sbd, JSON.stringify(idGameCanChon))
      : Promise.resolve([] as Row[]),
    giayUocTinhGame(env, gameThieuGiay).catch(() => new Map<string, number>()),
    chiTietCauCuaLuot(env, caThi, [sbd]).catch(() => new Map<string, { chon: string | null; giay: number | null }>()),
    gocMuc.length ? docBetaCau(env, gocMuc).catch(() => new Map<string, number>()) : Promise.resolve(new Map<string, number>()),
    gocCanKichThuoc.length ? docKichThuocCau(env, gocCanKichThuoc).catch(() => new Map<string, import('./cau-doc-giay').KichThuocCau>()) : Promise.resolve(new Map<string, import('./cau-doc-giay').KichThuocCau>()),
  ])
  const traLoiGame = new Map((rAtt ?? []).map((x) => [str(x.id), chonTuGiaTri(x.tra_loi)]))
  // Tên dạng: kho trước; câu không có trong kho (vd câu ca kiểm tra) ⇒ mã dạng của sổ (một truy vấn, đệm) — không có tên thì để rỗng (không lộ mã).
  const tenTuKho = (q: string) => str(kho.get(q)?.tenDang)
  const maDangThieu = [...new Set(dong.filter((d) => !tenTuKho(d.goc) && d.maDang).map((d) => d.maDang))]
  const tenDang = maDangThieu.length ? await tenCuaDang(env, maDangThieu).catch(() => new Map<string, string>()) : new Map<string, string>()
  const tieuDeCua = (d: Dong) => tieuDeCau(d.goc, tenTuKho(d.goc) || str(tenDang.get(d.maDang)))

  // 4 · từng lượt
  const ctCua = (d: Dong) => {
    const k = `${d.maNguon}|${sbd}|${d.qid}`
    return ct.get(`${k}|${d.lanThu}`) ?? ct.get(`${k}|*`)
  }
  // Mức làm của từng lượt (thuần, muc-lam.ts). Thời gian thường CHỈ khi β thật (τ của OMNI chưa nối ⇒ τ = 0, hệ số đọc 1,0 — đặc tả mục 3). Bản học sinh/phụ huynh: lượt ĐÚNG ở Mức 1–2 không mang mức
  // (chỉ số giây) và KHÔNG tính vào tổng — tổng khớp đúng những gì em thấy.
  // GIÂY MỖI LƯỢT + LOẠI: 'do' = số đo (đồng hồ mới có `doc`) · 'cu' = đồng hồ cũ (cột `giay` / `raw_json.ms` / ca thi) · 'uoc' = ƯỚC TÍNH (mốc trả lời game, khoảng cách hai lần trả lời). 'cu' và 'uoc' chỉ có thể DƯ.
  const khoangCach = giayTuKhoangCach(dong)
  const giaySo = dong.map((d, i): { g: number | null; loai: 'do' | 'cu' | 'uoc' | null } => {
    if (doThat[i] != null) return { g: doThat[i]!, loai: d.doMuc ? 'do' : 'cu' }
    if (d.nguon === 'thi') { const g = ctCua(d)?.giay ?? null; if (g !== null) return { g, loai: 'cu' } }
    if (d.nguon === 'game') { const u = uoc.get(`${d.maNguon}|${Date.parse(d.luc)}`); if (u !== undefined) return { g: u, loai: 'uoc' } }
    if (khoangCach[i] != null) return { g: khoangCach[i]!, loai: 'uoc' }
    return { g: null, loai: null }
  })
  const mucTho: (MucLamLuot | null)[] = dong.map((d, i) =>
    mucLamTuDong({
      doMuc: d.doMuc, giayDo: doThat[i] ?? null, goc: d.goc, mucDo: d.mucDo, dung: d.ketQua === null ? null : d.ketQua === 1,
      ...(giaySo[i]!.loai === 'cu' || giaySo[i]!.loai === 'uoc' ? { giayCu: giaySo[i]!.g, loaiCu: giaySo[i]!.loai as 'cu' | 'uoc' } : {}),
    }, beta, kichThuoc))
  const anMuc = (i: number): boolean => nguoiDoc === 'hoc-sinh' && !!mucTho[i] && dong[i]!.ketQua === 1 && mucTho[i]!.ma <= 2
  const tatCa: LanLamCau[] = dong.map((d, i) => {
    const giay: number | null = giaySo[i]!.g
    const nguonGiay: NguonGiay = giay === null ? null : giaySo[i]!.loai === 'uoc' ? 'uoc' : 'do'
    let chon = chonTuGiaTri(d.raw?.chon ?? d.raw?.traLoi)
    if (chon === null && d.nguon === 'game') chon = traLoiGame.get(d.attemptId || `${d.maNguon}|${d.qid}`) ?? null
    if (chon === null && d.nguon === 'thi') chon = ctCua(d)?.chon ?? null
    return {
      luc: d.luc,
      ngay: d.ngay,
      qid: d.qid,
      tieuDe: tieuDeCua(d),
      mucDo: d.mucDo || chuanMucDo(kho.get(d.goc)?.mucDo),
      noi: d.nguon === 'thi' ? noiCuaCa(d.tenCa) : tenNguonNgan(d.nguon, d.nguon === 'game' ? (loai.get(d.maNguon) ?? 'dao') : null),
      dung: d.ketQua === null ? null : d.ketQua === 1,
      chon,
      giay,
      nguonGiay,
      coGoiY: d.coGoiY,
      ...(mucTho[i] && !anMuc(i) ? { mucLam: mucTho[i]! } : {}),
    }
  })

  // 5 · tổng + câu từng sai (gom theo câu gốc; `dong`/`tatCa` đang mới trước)
  const theoGoc = new Map<string, number[]>()
  dong.forEach((d, i) => { const k = d.goc || d.qid; (theoGoc.get(k) ?? theoGoc.set(k, []).get(k)!).push(i) })
  const cauSai: CauEmSai[] = []
  for (const [k, chiSo] of theoGoc) {
    const lan = chiSo.map((i) => tatCa[i]!)
    const soSai = lan.filter((x) => x.dung === false).length
    if (!soSai) continue
    cauSai.push({
      qid: k,
      tieuDe: tieuDeCua(dong[chiSo[0]!]!),
      mucDo: lan.find((x) => x.mucDo)?.mucDo ?? '',
      soLan: lan.length,
      soSai,
      soDung: lan.filter((x) => x.dung === true).length,
      lanCuoiDung: lan[0]!.dung === true,
      lanCuoi: lan[0]!.luc,
      giaySai: lan.filter((x) => x.dung === false).map((x) => x.giay).reverse(),
    })
  }
  cauSai.sort((a, c) => Number(a.lanCuoiDung) - Number(c.lanCuoiDung) || c.soSai - a.soSai || (a.lanCuoi < c.lanCuoi ? 1 : a.lanCuoi > c.lanCuoi ? -1 : 0))
  const coGiay = tatCa.filter((x) => x.giay !== null)
  const tongGiay = coGiay.reduce((t, x) => t + (x.giay ?? 0), 0)
  return {
    ok: true,
    em,
    tong: {
      soLuot: tatCa.length,
      soDung: tatCa.filter((x) => x.dung === true).length,
      soSai: tatCa.filter((x) => x.dung === false).length,
      soBoTrong: tatCa.filter((x) => x.dung === null).length,
      soCau: theoGoc.size,
      soCauSai: cauSai.length,
      giayTb: coGiay.length ? Math.round(tongGiay / coGiay.length) : null,
      tongGiay,
    },
    // Gộp Mức làm trên đúng tập lượt được xem — trường riêng ngang hàng `tong` (hình dạng `tong` được test ghim, không đụng).
    mucLam: tongMucLam(tatCa.filter((_, i) => !anMuc(i))),
    lan: tatCa.slice(0, gioiHan),
    cauSai,
    conNua: tatCa.length > gioiHan,
    catBot,
  }
}
