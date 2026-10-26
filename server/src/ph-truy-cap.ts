// CỔNG PHỤ HUYNH — TOKEN (giai đoạn MỀM, phương án A) + đếm truy cập + lệnh xem kế hoạch / đặt số phút học mỗi ngày.
//
// Từ trước tới nay phụ huynh gọi `/parent-news/*` và `/mom/create|parent-list` bằng SBD TRẦN: ai biết SBD của em nào cũng đọc tiến bộ và giao bài cho em ấy.
// Giai đoạn MỀM (tệp này): máy chủ nhận CẢ token (`pass`, cùng loại `parentPass` của game, gắn mật khẩu em để thu hồi) LẪN SBD trần, và ghi lại mỗi loại
// được dùng bao nhiêu (`ph_truy_cap`) để thầy biết còn bao nhiêu phụ huynh CHƯA có liên kết. KHÔNG có công tắc nào tự chuyển sang giai đoạn CỨNG.
// Lệnh MỚI (`/ph/ke-hoach`, `/ph/thoi-gian-hoc`) chỉ nhận token: không có đường cũ nào cần nuôi.
//
// Quy tắc: có `pass` thì DANH TÍNH lấy từ token, mọi `sbd` trong thân bị bỏ qua (không cho token của em A đọc em B). Token sai/hết hạn/bị thu hồi thì báo lỗi,
// KHÔNG rơi xuống SBD trần. Đếm lỗi (thiếu bảng, D1 lỗi tạm) không bao giờ làm hỏng lệnh chính.
import { canhBaoChoPh, phXemCanhBao } from './canh-bao-thay'
import type { Env, ExecutionContext } from './kieu'
import { docChuoiNgayHoc } from './chuoi-ngay-hoc'
import { chuoiBaiNeuBat } from './chuoi-ngay-bai-d1'
import { parentIdentityVoiHang, parentPass } from './game-v2-auth'
import { PHUT_NGAY_TOI_DA, PHUT_NGAY_TOI_THIEU } from './ho-so-cau-hinh'
import { lapVaLuuKeHoach } from './ke-hoach-ngay-d1'
import { viecPhu } from './viec-phu'

export type KieuTruyCap = 'token' | 'sbd_tran'
export type DuongPh = 'parent-news' | 'mom' | 'ph-ke-hoach' | 'ph-thoi-gian-hoc' | 'ph-xac-dinh' | 'ph-canh-bao-xem' | 'ph-giao-them' | 'ph-tat-ca-ve-con' | 'ph-chi-tiet-cau-ve-con' | 'ph-bao-cao-ca' | 'ph-loi-thay' | 'ph-hoc-2' | 'ph-con-tong-quan'
  | 'ph-nhip-hoc' | 'ph-ho-so-thai-do' | 'ph-lich-su-lam-cau' | 'ph-danh-gia' | 'ph-bao-cao-tuan'

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
 *
 * `env` ở đây dùng cho MỌI lượt ĐỌC (tham số này có thể là bản sao/replica — Boss 22/09 lượt 2, `envDoc` của `/ph/tat-ca-ve-con` v.v.). Việc GHI DUY NHẤT
 * của hàm (đếm truy cập `ghiTruyCap`) tách khỏi đường đọc: `tuyChon.envGhi` (mặc định lấy lại `env`) LUÔN là primary thật, và hoãn qua `viecPhu(tuyChon.ctx, …)`
 * — trễ vài giây không sao (đây chỉ là số liệu cho thầy quyết giai đoạn cứng), còn bản thân lệnh trả lời nhanh hơn nhờ đọc trên bản sao gần nhất.
 */
export async function sbdCuaPhuHuynh(
  env: Env,
  b: Record<string, unknown>,
  duong: DuongPh,
  tuyChon: { chiToken?: boolean; envGhi?: Env; ctx?: ExecutionContext } = {},
): Promise<{ sbd: string; kieu: KieuTruyCap }> {
  const { sbd, kieu } = await sbdVaHangCuaPhuHuynh(env, b, duong, tuyChon)
  return { sbd, kieu }
}

/** Lõi của `sbdCuaPhuHuynh`: trả thêm HÀNG `hoc_sinh` (tên + lớp) đã đọc khi xác thực để `xac-dinh` khỏi đọc lại. Hình dạng `{sbd, kieu}` của hàm trên được test ghim nên giữ nguyên. */
export async function sbdVaHangCuaPhuHuynh(
  env: Env,
  b: Record<string, unknown>,
  duong: DuongPh,
  tuyChon: { chiToken?: boolean; envGhi?: Env; ctx?: ExecutionContext; layTen?: boolean } = {},
): Promise<{ sbd: string; kieu: KieuTruyCap; hang: { ho_ten: string | null; lop: string | null } }> {
  const coToken = b.pass !== undefined && b.pass !== null && String(b.pass).trim() !== ''
  let sbd: string
  let kieu: KieuTruyCap
  let hang: { ho_ten: string | null; lop: string | null } | null = null
  if (coToken) {
    // Token có `pk` đã đọc hàng `hoc_sinh` khi kiểm mật khẩu ⇒ dùng luôn làm bằng chứng "em tồn tại" (bớt 1 đợt D1 nối tiếp ở mọi lệnh /ph).
    ;({ sbd, hang } = await parentIdentityVoiHang(env, String(b.pass).trim(), !!tuyChon.layTen))
    kieu = 'token'
  } else {
    if (tuyChon.chiToken) throw new Error('Cần liên kết riêng của con. Anh/chị nhờ Thầy gửi liên kết.')
    sbd = String(b.sbd ?? '').trim()
    kieu = 'sbd_tran'
  }
  if (!sbd || sbd.length > 40) throw new Error('Không tìm thấy số báo danh của con.')
  if (!hang) {
    const row = await env.DB.prepare(tuyChon.layTen ? 'SELECT ho_ten, lop FROM hoc_sinh WHERE sbd = ?' : 'SELECT sbd FROM hoc_sinh WHERE sbd = ?').bind(sbd).first<{ ho_ten?: string | null; lop?: string | null }>()
    if (!row) throw new Error('Không tìm thấy số báo danh của con.')
    hang = { ho_ten: row.ho_ten ?? null, lop: row.lop ?? null }
  }
  const envGhi = tuyChon.envGhi ?? env
  await viecPhu(tuyChon.ctx, () => ghiTruyCap(envGhi, sbd, kieu, duong))
  return { sbd, kieu, hang }
}

/**
 * `POST /ph/xac-dinh {pass}` — cổng phụ huynh hỏi "liên kết này là của em nào" để hiện tên con. Chỉ nhận token.
 * Là lệnh ĐẦU TIÊN trên đường mở app phụ huynh bằng liên kết riêng (6 lệnh còn lại chờ nó) ⇒ làm ít đợt nhất có thể: tên + lớp lấy luôn từ hàng đã đọc khi xác thực,
 * đếm truy cập hoãn qua `ctx` (trước 21/10: không có `ctx` nên đếm chạy NGAY và chặn phản hồi thêm 1 đợt).
 */
export async function phXacDinh(env: Env, b: Record<string, unknown>, ctx?: ExecutionContext): Promise<Record<string, unknown>> {
  const { sbd, hang } = await sbdVaHangCuaPhuHuynh(env, b, 'ph-xac-dinh', { chiToken: true, ctx, layTen: true })
  return { ok: true, sbd, hoTen: hang.ho_ten ?? '', lop: hang.lop ?? '' }
}

/**
 * `POST /ph/ke-hoach {pass}` — kế hoạch HÔM NAY của con, khung nhìn cho phụ huynh: số câu, loại việc, hạn, tiến bộ trong ngày, số phút mỗi ngày.
 * KHÔNG có mã câu, mã bài, mã ca, nội dung câu hỏi hay đáp án (`chiTiet`, `ma`, `nguon` bị bỏ). Nội dung chữ (ghiChu, cảnh báo) do cổng phụ huynh tự soạn từ `loai`.
 *
 * `envDoc` (Boss 22/09 lượt 2, mặc định = `env`): xác định danh tính + tra tên/lớp đọc trên bản sao khi có, đếm truy cập vẫn ghi `env` (primary) qua
 * `sbdCuaPhuHuynh`. `lapVaLuuKeHoach`/`canhBaoChoPh` GIỮ NGUYÊN `env` — có đọc-rồi-ghi (lập kế hoạch), không đổi để tránh đọc lệch bản.
 */
export async function phKeHoach(env: Env, b: Record<string, unknown>, envDoc: Env = env, ctx?: ExecutionContext): Promise<Record<string, unknown>> {
  const { sbd } = await sbdCuaPhuHuynh(envDoc, b, 'ph-ke-hoach', { chiToken: true, envGhi: env, ctx })
  const em = await envDoc.DB.prepare('SELECT ho_ten, lop FROM hoc_sinh WHERE sbd = ?').bind(sbd).first<{ ho_ten: string | null; lop: string | null }>()
  const kh = (await lapVaLuuKeHoach(env, [sbd], Date.now())).get(sbd)!
  // 01/10: chuỗi ngày học đọc từ sổ `su_kien_hoc` (song song cảnh báo) — `kh.chuoiDat` luôn 0 khi Hoá 2.0 bật (không còn chốt 'dat').
  // B3 (26/10): cờ duolingo_bai bật cho con ⇒ chuỗi theo bài (cùng số với app học sinh), kèm `chuoiNgay` đầy đủ; tắt ⇒ cách đếm cũ.
  const [canhBao, chuoiCu, chuoiBai] = await Promise.all([canhBaoChoPh(env, sbd), docChuoiNgayHoc(envDoc, sbd), chuoiBaiNeuBat(env, sbd, Date.now(), envDoc)])
  const chuoiDat = chuoiBai ? chuoiBai.so : chuoiCu
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
    chuoiDat,
    ...(chuoiBai ? { chuoiNgay: chuoiBai } : {}),
    canhBao: kh.canhBao.map((c) => c.loai),
    tonCuTong: kh.tonCuTong,
    // CẢNH BÁO CỦA THẦY (chỉ thầy bấm mới có): lời cho PHỤ HUYNH, ≤ 3, bài của con chưa nộp, gửi trong 72 giờ. Không có ⇒ KHÔNG có khoá.
    ...(canhBao.length > 0 ? { canhBaoThay: canhBao } : {}),
  }
}

/** `POST /ph/canh-bao/xem {pass, id}` — phụ huynh đã xem cảnh báo. Chỉ nhận token; chỉ cảnh báo của đúng con (SBD từ token). */
export async function phCanhBaoXem(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { sbd } = await sbdCuaPhuHuynh(env, b, 'ph-canh-bao-xem', { chiToken: true })
  return { ...(await phXemCanhBao(env, sbd, String(b.id ?? ''))) }
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
