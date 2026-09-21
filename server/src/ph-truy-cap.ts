// CỔNG PHỤ HUYNH — TOKEN (giai đoạn MỀM, phương án A) + đếm truy cập + lệnh xem kế hoạch / đặt số phút học mỗi ngày.
//
// Từ trước tới nay phụ huynh gọi `/parent-news/*` và `/mom/create|parent-list` bằng SBD TRẦN: ai biết SBD của em nào cũng đọc tiến bộ và giao bài cho em ấy.
// Giai đoạn MỀM (tệp này): máy chủ nhận CẢ token (`pass`, cùng loại `parentPass` của game, gắn mật khẩu em để thu hồi) LẪN SBD trần, và ghi lại mỗi loại
// được dùng bao nhiêu (`ph_truy_cap`) để thầy biết còn bao nhiêu phụ huynh CHƯA có liên kết. KHÔNG có công tắc nào tự chuyển sang giai đoạn CỨNG.
// Lệnh MỚI (`/ph/ke-hoach`, `/ph/thoi-gian-hoc`) chỉ nhận token: không có đường cũ nào cần nuôi.
//
// Quy tắc: có `pass` thì DANH TÍNH lấy từ token, mọi `sbd` trong thân bị bỏ qua (không cho token của em A đọc em B). Token sai/hết hạn/bị thu hồi thì báo lỗi,
// KHÔNG rơi xuống SBD trần. Đếm lỗi (thiếu bảng, D1 lỗi tạm) không bao giờ làm hỏng lệnh chính.
import { docBoNaoAiChoPhuHuynh } from './bo-nao-doc'
import { canhBaoChoPh, phXemCanhBao } from './canh-bao-thay'
import type { Env } from './kieu'
import { parentIdentity, parentPass } from './game-v2-auth'
import { PHUT_NGAY_MAC_DINH, PHUT_NGAY_TOI_DA, PHUT_NGAY_TOI_THIEU } from './ho-so-cau-hinh'
import { datPhutMoiNgay, lapVaLuuKeHoach } from './ke-hoach-ngay-d1'

export type KieuTruyCap = 'token' | 'sbd_tran'
export type DuongPh = 'parent-news' | 'mom' | 'ph-ke-hoach' | 'ph-thoi-gian-hoc' | 'ph-xac-dinh' | 'ph-canh-bao-xem' | 'ph-giao-them' | 'ph-tat-ca-ve-con' | 'ph-chi-tiet-cau-ve-con'

/** Địa chỉ app (Pages). Liên kết phát cho phụ huynh: `<APP>/ph?ph=<pass>`; cổng phụ huynh lưu `pass` rồi gửi `{pass}` ở mọi lệnh. */
export const DIA_CHI_APP = 'https://omr-app-b3u.pages.dev'
/** Liên kết phụ huynh do thầy cấp sống 90 ngày (mã game chia sẻ vẫn 30 ngày). Đổi mật khẩu của em thì mọi liên kết đã phát hết hiệu lực ngay. */
export const NGAY_HAN_LIEN_KET = 90
export const TOI_DA_EM_MOI_LUOT_CAP_MA = 100
export const TOI_DA_NGAY_DEM = 60
const MOT_NGAY_MS = 86_400_000

const ngayVn = (nowMs: number): string => new Date(nowMs + 7 * 3_600_000).toISOString().slice(0, 10)

/** Cộng một lượt truy cập trong ngày (cộng dồn theo ngày, em, loại, đường). Không ném lỗi. */
export async function ghiTruyCap(env: Env, sbd: string, kieu: KieuTruyCap, duong: DuongPh, nowMs: number = Date.now()): Promise<void> {
  try {
    await env.DB.prepare(
      'INSERT INTO ph_truy_cap (ngay, sbd, kieu, duong, so, luc) VALUES (?,?,?,?,1,?) ON CONFLICT(ngay, sbd, kieu, duong) DO UPDATE SET so = so + 1, luc = excluded.luc',
    ).bind(ngayVn(nowMs), sbd, kieu, duong, new Date(nowMs).toISOString()).run()
  } catch {
    /* chưa chạy migration-1909-ph-truy-cap.sql hoặc D1 lỗi tạm: bỏ qua đếm, đường chính chạy như trước */
  }
}

/**
 * SBD của em mà phụ huynh đang xem. Có `pass` ⇒ token quyết định (thân `sbd` bị bỏ qua). Không có `pass` ⇒ SBD trần (giai đoạn mềm), trừ khi `chiToken`.
 * Ném lỗi có chữ nếu token hỏng hoặc em không có thật.
 */
export async function sbdCuaPhuHuynh(env: Env, b: Record<string, unknown>, duong: DuongPh, tuyChon: { chiToken?: boolean } = {}): Promise<{ sbd: string; kieu: KieuTruyCap }> {
  const coToken = b.pass !== undefined && b.pass !== null && String(b.pass).trim() !== ''
  let sbd: string
  let kieu: KieuTruyCap
  if (coToken) {
    sbd = await parentIdentity(env, String(b.pass).trim())
    kieu = 'token'
  } else {
    if (tuyChon.chiToken) throw new Error('Cần liên kết riêng của con. Anh/chị nhờ Thầy gửi liên kết.')
    sbd = String(b.sbd ?? '').trim()
    kieu = 'sbd_tran'
  }
  if (!sbd || sbd.length > 40 || !(await env.DB.prepare('SELECT sbd FROM hoc_sinh WHERE sbd = ?').bind(sbd).first())) {
    throw new Error('Không tìm thấy số báo danh của con.')
  }
  await ghiTruyCap(env, sbd, kieu, duong)
  return { sbd, kieu }
}

/** `POST /ph/xac-dinh {pass}` — cổng phụ huynh hỏi "liên kết này là của em nào" để hiện tên con. Chỉ nhận token. */
export async function phXacDinh(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { sbd } = await sbdCuaPhuHuynh(env, b, 'ph-xac-dinh', { chiToken: true })
  const em = await env.DB.prepare('SELECT ho_ten, lop FROM hoc_sinh WHERE sbd = ?').bind(sbd).first<{ ho_ten: string | null; lop: string | null }>()
  return { ok: true, sbd, hoTen: em?.ho_ten ?? '', lop: em?.lop ?? '' }
}

/**
 * `POST /ph/ke-hoach {pass}` — kế hoạch HÔM NAY của con, khung nhìn cho phụ huynh: số câu, loại việc, hạn, tiến bộ trong ngày, số phút mỗi ngày.
 * KHÔNG có mã câu, mã bài, mã ca, nội dung câu hỏi hay đáp án (`chiTiet`, `ma`, `nguon` bị bỏ). Nội dung chữ (ghiChu, cảnh báo) do cổng phụ huynh tự soạn từ `loai`.
 */
export async function phKeHoach(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { sbd } = await sbdCuaPhuHuynh(env, b, 'ph-ke-hoach', { chiToken: true })
  const em = await env.DB.prepare('SELECT ho_ten, lop FROM hoc_sinh WHERE sbd = ?').bind(sbd).first<{ ho_ten: string | null; lop: string | null }>()
  const kh = (await lapVaLuuKeHoach(env, [sbd], Date.now())).get(sbd)!
  const boNaoAi = await docBoNaoAiChoPhuHuynh(env, sbd, kh.ngay)
  const canhBao = await canhBaoChoPh(env, sbd)
  return {
    ok: true,
    hoTen: em?.ho_ten ?? '',
    lop: em?.lop ?? '',
    ngay: kh.ngay,
    lanNghi: kh.lanNghi,
    phutMoiNgay: kh.nganSach.phutNgay,
    phutLaMacDinh: kh.nganSach.phutNgayLaMacDinh,
    phutToiThieu: PHUT_NGAY_TOI_THIEU,
    phutToiDa: PHUT_NGAY_TOI_DA,
    mucTieuCau: kh.nganSach.mucTieuCau,
    toiThieuCau: kh.nganSach.toiThieuCau,
    viec: kh.viec.filter((v) => v.hien).map((v) => ({ loai: v.loai, soCau: v.soCau, batBuoc: v.batBuoc, khan: v.khan, hanCung: v.hanCung, hanMem: v.hanMem })),
    quaHan: kh.quaHan.map((q) => ({ loai: q.loai, hanNop: q.hanNop, conLai: q.conLai })),
    tienBo: kh.tienBo,
    chuoiDat: kh.chuoiDat,
    canhBao: kh.canhBao.map((c) => c.loai),
    tonCuTong: kh.tonCuTong,
    // BỘ NÃO A.I chế độ THẬT: lời nhắn + thư tuần cho phụ huynh, CHỈ của đúng con (SBD từ token). Chạy thử/tắt/không có ⇒ KHÔNG có khoá này.
    ...(boNaoAi ? { boNaoAi } : {}),
    // CẢNH BÁO CỦA THẦY (chỉ thầy bấm mới có): lời cho PHỤ HUYNH, ≤ 3, bài của con chưa nộp, gửi trong 72 giờ. Không có ⇒ KHÔNG có khoá.
    ...(canhBao.length > 0 ? { canhBaoThay: canhBao } : {}),
  }
}

/** `POST /ph/canh-bao/xem {pass, id}` — phụ huynh đã xem cảnh báo. Chỉ nhận token; chỉ cảnh báo của đúng con (SBD từ token). */
export async function phCanhBaoXem(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { sbd } = await sbdCuaPhuHuynh(env, b, 'ph-canh-bao-xem', { chiToken: true })
  return { ...(await phXemCanhBao(env, sbd, String(b.id ?? ''))) }
}

/** `POST /ph/thoi-gian-hoc {pass, phut?}` — phụ huynh xem hoặc đặt số phút học mỗi ngày của con (10–45). Không có `phut` thì chỉ đọc. Chỉ nhận token. */
export async function phThoiGianHoc(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { sbd } = await sbdCuaPhuHuynh(env, b, 'ph-thoi-gian-hoc', { chiToken: true })
  if (b.phut !== undefined && b.phut !== null) {
    const r = await datPhutMoiNgay(env, sbd, b.phut)
    if (r.ok !== true) return r
  }
  const row = await env.DB.prepare('SELECT minutes FROM study_preferences WHERE sbd = ?').bind(sbd).first<{ minutes: number | null }>()
  const dat = Number(row?.minutes)
  const coDat = Number.isFinite(dat) && dat >= PHUT_NGAY_TOI_THIEU && dat <= PHUT_NGAY_TOI_DA
  return { ok: true, phut: coDat ? dat : PHUT_NGAY_MAC_DINH, laMacDinh: !coDat, toiThieu: PHUT_NGAY_TOI_THIEU, toiDa: PHUT_NGAY_TOI_DA }
}

// --- Lệnh của THẦY (đòi mã bí mật) -------------------------------------------------------------------------------

/**
 * `POST /ph/cap-ma {dsSbd:[…]} | {lop:"12A"}` — cấp liên kết phụ huynh (token 90 ngày gắn mật khẩu em). Trả `[{sbd, hoTen, lop, pass, lienKet}]`.
 * Tối đa 100 em một lượt. Em chưa đặt mật khẩu vẫn được cấp (token không có `pk`, không thu hồi được bằng đổi mật khẩu): báo `chuaCoMatKhau:true` để thầy biết.
 */
export async function phCapMa(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const lop = typeof b.lop === 'string' ? b.lop.trim() : ''
  let ds: string[]
  if (lop) {
    const r = await env.DB.prepare('SELECT sbd FROM hoc_sinh WHERE lop = ? ORDER BY sbd').bind(lop).all<{ sbd: string }>()
    ds = (r.results ?? []).map((x) => String(x.sbd))
  } else {
    ds = [...new Set((Array.isArray(b.dsSbd) ? b.dsSbd : []).map((x) => String(x ?? '').trim()).filter(Boolean))]
  }
  if (ds.length === 0) return { ok: false, error: 'Gửi "dsSbd" (mảng SBD) hoặc "lop".' }
  if (ds.length > TOI_DA_EM_MOI_LUOT_CAP_MA) return { ok: false, error: `Tối đa ${TOI_DA_EM_MOI_LUOT_CAP_MA} em một lượt (nhận ${ds.length}). Chia nhỏ danh sách.` }
  const r = await env.DB.prepare('SELECT sbd, ho_ten, lop, mat_khau FROM hoc_sinh WHERE sbd IN (SELECT value FROM json_each(?))').bind(JSON.stringify(ds)).all<{ sbd: string; ho_ten: string | null; lop: string | null; mat_khau: string | null }>()
  const co = new Map((r.results ?? []).map((x) => [String(x.sbd), x]))
  const ma: Record<string, unknown>[] = []
  for (const sbd of ds) {
    const em = co.get(sbd)
    if (!em) continue
    const pass = await parentPass(env, sbd, NGAY_HAN_LIEN_KET)
    ma.push({ sbd, hoTen: em.ho_ten ?? '', lop: em.lop ?? '', pass, lienKet: `${DIA_CHI_APP}/ph?ph=${encodeURIComponent(pass)}`, chuaCoMatKhau: !em.mat_khau })
  }
  return { ok: true, hanNgay: NGAY_HAN_LIEN_KET, ma, khongTimThay: ds.filter((s) => !co.has(s)) }
}

/**
 * `POST /ph/dem-truy-cap {ngay?}` — số liệu để thầy quyết giai đoạn CỨNG: trong `ngay` ngày gần nhất (mặc định 14, tối đa 60), bao nhiêu lượt/em dùng token, bao nhiêu dùng
 * SBD trần, và những em mà phụ huynh CHỈ dùng SBD trần (chưa có liên kết). Chỉ đọc.
 */
export async function phDemTruyCap(env: Env, b: Record<string, unknown>, nowMs: number = Date.now()): Promise<Record<string, unknown>> {
  const n = Math.max(1, Math.min(TOI_DA_NGAY_DEM, Math.round(Number(b.ngay) || 14)))
  const tu = ngayVn(nowMs - (n - 1) * MOT_NGAY_MS)
  try {
    const theo = await env.DB.prepare('SELECT kieu, duong, SUM(so) AS luot, COUNT(DISTINCT sbd) AS em FROM ph_truy_cap WHERE ngay >= ? GROUP BY kieu, duong ORDER BY kieu, duong')
      .bind(tu).all<{ kieu: string; duong: string; luot: number; em: number }>()
    const tong = await env.DB.prepare('SELECT kieu, SUM(so) AS luot, COUNT(DISTINCT sbd) AS em FROM ph_truy_cap WHERE ngay >= ? GROUP BY kieu').bind(tu).all<{ kieu: string; luot: number; em: number }>()
    const chua = await env.DB.prepare(
      `SELECT sbd, SUM(so) AS luot FROM ph_truy_cap WHERE ngay >= ? AND kieu = 'sbd_tran' AND sbd NOT IN (SELECT sbd FROM ph_truy_cap WHERE ngay >= ? AND kieu = 'token')
        GROUP BY sbd ORDER BY luot DESC, sbd LIMIT 200`,
    ).bind(tu, tu).all<{ sbd: string; luot: number }>()
    const ket = (k: KieuTruyCap) => {
      const x = (tong.results ?? []).find((y) => y.kieu === k)
      return { luot: Number(x?.luot) || 0, em: Number(x?.em) || 0 }
    }
    return {
      ok: true, tuNgay: tu, denNgay: ngayVn(nowMs), soNgay: n,
      token: ket('token'), sbdTran: ket('sbd_tran'),
      theoDuong: (theo.results ?? []).map((x) => ({ kieu: x.kieu, duong: x.duong, luot: Number(x.luot) || 0, em: Number(x.em) || 0 })),
      emChiSbdTran: (chua.results ?? []).map((x) => ({ sbd: String(x.sbd), luot: Number(x.luot) || 0 })),
    }
  } catch {
    return { ok: false, error: 'Chưa chạy migration-1909-ph-truy-cap.sql (bảng ph_truy_cap).' }
  }
}
