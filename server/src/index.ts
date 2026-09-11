// MÁY CHỦ MỚI — bốn lệnh nóng lúc thi (MAY-CHU-MOI.md).
//
// BA LUẬT KHÔNG ĐƯỢC PHÁ:
//   1. Mỗi endpoint dùng 1–3 câu truy vấn. Trần D1 miễn phí là 50 câu một lượt
//      gọi Worker, và vòng lặp truy vấn theo số em là đường chắc chắn chạm trần.
//   2. Gói đề KHÔNG nằm trong D1 (trần 2 MB một dòng, kho thầy đã 2,1 MB) —
//      nằm ở R2, D1 chỉ giữ khoá đối tượng.
//   3. Lệnh của HỌC SINH không đòi mã bí mật (giống Apps Script hiện nay);
//      lệnh của THẦY thì đòi. Không nới luật này ở bất kỳ đâu.
import { CA_DO_TAI, TRANG_DO_TAI } from './do-tai'
import { chuanHoaDanhSach } from './danh-sach'
import type { D1PreparedStatement, DongCa, DongLuot, Env } from './kieu'
import { khoaLuot, mocHetGio, quyetDinhVaoThi } from './luat-vao-thi'

// CORS — app chạy ở `dodaihoc4869.github.io`, Worker ở `workers.dev`, nên MỌI
// lượt gọi đều là chéo nguồn. Thiếu mấy dòng này là trình duyệt chặn sạch và
// máy em chỉ thấy "lỗi mạng" — không có cách nào đoán ra từ phía em.
//
// Mở cho mọi nguồn, đúng như Apps Script đang làm: lệnh của học sinh vốn không
// đòi mã bí mật, khoá theo nguồn không thêm an toàn mà chỉ thêm chỗ hỏng.
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type, x-ma-bi-mat',
  'access-control-max-age': '86400',
}
const JSON_HEADERS = { 'content-type': 'application/json;charset=utf-8', ...CORS }

function ra(data: unknown, status = 200): Response {
  return new Response(JSON.stringify({ ...(data as object), serverNow: Date.now() }), { status, headers: JSON_HEADERS })
}

function laThay(req: Request, env: Env, body: Record<string, unknown>): boolean {
  const gui = String(body.secret ?? req.headers.get('x-ma-bi-mat') ?? '').trim()
  return gui.length > 0 && gui === String(env.MA_BI_MAT ?? '').trim()
}

async function docCa(env: Env, maCa: string): Promise<DongCa | null> {
  return await env.DB.prepare('SELECT * FROM ca WHERE ma_ca = ?').bind(maCa).first<DongCa>()
}

/** Lượt MỚI NHẤT của một em trong ca — một câu, có chỉ mục, không quét bảng. */
async function docLuotMoiNhat(env: Env, maCa: string, sbd: string): Promise<DongLuot | null> {
  return await env.DB.prepare('SELECT * FROM luot WHERE ma_ca = ? AND sbd = ? ORDER BY lan_thu DESC LIMIT 1')
    .bind(maCa, sbd)
    .first<DongLuot>()
}

/**
 * Điều kiện SQL tìm đúng một lượt, KHÔNG tốn thêm câu truy vấn.
 *
 * Máy em vẫn gọi bằng `maCa` + `sbd` như xưa (chữ ký hàm cũ giữ nguyên), nên
 * Worker phải tự suy ra lượt. Cách rẻ nhất là nhét câu con vào mệnh đề WHERE
 * của chính câu UPDATE — một lượt gọi Worker vẫn chỉ 1 câu, không chạm trần 50.
 *
 * Có `khoaLuot` thì dùng luôn: đó là khoá chính, nhanh nhất.
 */
export function dieuKienLuot(b: Record<string, unknown>): { sql: string; tham: unknown[] } | null {
  const khoa = String(b.khoaLuot ?? '').trim()
  if (khoa) return { sql: 'khoa = ?', tham: [khoa] }
  const maCa = String(b.maCa ?? '').trim()
  const sbd = String(b.sbd ?? '').trim()
  if (!maCa || !sbd) return null
  return {
    sql: 'ma_ca = ? AND sbd = ? AND lan_thu = (SELECT MAX(lan_thu) FROM luot WHERE ma_ca = ? AND sbd = ?)',
    tham: [maCa, sbd, maCa, sbd],
  }
}

// ---------------------------------------------------------------- HỌC SINH

async function vaoThi(env: Env, b: Record<string, unknown>): Promise<Response> {
  const maCa = String(b.maCa ?? '').trim()
  const sbd = String(b.sbd ?? '').trim()
  const idThietBi = String(b.idThietBi ?? '').trim()
  if (!maCa || !sbd) return ra({ ok: false, lyDo: 'thieu', error: 'Thiếu mã ca hoặc số báo danh' })

  const ca = await docCa(env, maCa)

  // CỔNG DANH SÁCH LỚP, trước mọi thứ khác. Thiếu cổng này thì ai có mã ca cũng
  // gõ một số báo danh bất kỳ rồi vào thi được.
  //
  // Bảng RỖNG thì KHÔNG chặn ai — thầy chưa kịp đẩy danh sách mà cả lớp đứng
  // ngoài cửa là hỏng nặng hơn hẳn việc thiếu cổng. Đúng luật bên Apps Script.
  // Ca ĐO TẢI được miễn: số báo danh của nó (`DOTAI0000`…) cố ý KHÔNG nằm trong
  // danh sách lớp, mà cho chúng vào danh sách thì thành cửa sau thật cho người
  // ngoài. `CA_DO_TAI` là hằng số chết trong mã, không nhận từ ngoài vào.
  if (maCa !== CA_DO_TAI && ca && (await coDanhSach(env)) && !(await docDanhSach(env, sbd))) {
    return ra({ ok: false, lyDo: 'khong_co_sbd', thoiGianPhut: ca.thoi_gian_phut ?? 45 })
  }

  const cu = await docLuotMoiNhat(env, maCa, sbd)
  const now = Date.now()
  const qd = quyetDinhVaoThi(ca, cu, idThietBi, now)
  if (!qd.ok || !ca) return ra({ ok: false, lyDo: qd.lyDo, lanThu: qd.lanThu, thoiGianPhut: ca?.thoi_gian_phut ?? 45 })

  // PHÒNG CHỜ. Em qua hết cổng nhưng thầy chưa bấm "Bắt đầu thi" thì DỪNG ở
  // đây: không tạo lượt (đồng hồ chưa chạy cho ai) và không trả đề (đề chưa nằm
  // trên máy em một giây nào). Em đã có lượt thì KHÔNG bị đẩy về chờ — bài của
  // em đang chạy dở.
  if (Number(ca.phong_cho ?? 0) === 1 && !ca.bat_dau_thi_luc && !cu) {
    await env.DB.prepare(
      `INSERT INTO phong_cho (khoa, ma_ca, sbd, ho_ten, ghi_luc) VALUES (?,?,?,?,?)
       ON CONFLICT(khoa) DO UPDATE SET ho_ten=excluded.ho_ten, ghi_luc=excluded.ghi_luc`,
    )
      .bind(`${maCa}|${sbd}`, maCa, sbd, String(b.hoTen ?? ''), new Date(now).toISOString())
      .run()
    return ra({
      ok: true,
      cach: 'cho',
      lop: ca.lop ?? '',
      thoiGianPhut: ca.thoi_gian_phut ?? 45,
      tenCa: ca.ten_ca ?? '',
      congBo: ca.cong_bo ?? 'khong',
    })
  }

  const lanThu = qd.lanThu ?? 1
  const khoa = khoaLuot(maCa, sbd, lanThu)
  const vaoLuc = qd.cach === 'khoi_phuc' && cu ? cu.vao_luc : new Date(now).toISOString()
  const hetGio = qd.cach === 'khoi_phuc' && cu ? cu.het_gio_luc || '' : mocHetGio(ca, now)

  // MỘT câu ghi, nguyên tử theo dòng. Không khoá toàn cục, nên 50 em vào cùng
  // lúc là 50 dòng khác nhau, không ai chờ ai.
  await env.DB.prepare(
    `INSERT INTO luot (khoa, ma_ca, sbd, lan_thu, id_thiet_bi, vao_luc, het_gio_luc, trang_thai, cap_nhat_luc)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'dang_lam', ?)
     ON CONFLICT(khoa) DO UPDATE SET id_thiet_bi = excluded.id_thiet_bi, cap_nhat_luc = excluded.cap_nhat_luc`,
  )
    .bind(khoa, maCa, sbd, lanThu, idThietBi, vaoLuc, hetGio, new Date(now).toISOString())
    .run()

  return ra({
    ok: true,
    cach: qd.cach,
    khoaLuot: khoa,
    lanThu,
    vaoLuc,
    hetGioLuc: hetGio,
    thoiGianPhut: ca.thoi_gian_phut ?? 45,
    congBo: ca.cong_bo ?? 'khong',
    loai: ca.loai === 'baitap' ? 'baitap' : 'thi',
    hanNop: ca.han_nop ?? '',
    tenCa: ca.ten_ca ?? '',
    nguongLan: ca.nguong_lan ?? 3,
    nguongGiay: ca.nguong_giay ?? 10,
    lop: ca.lop ?? '',
    giuDeDoc: Number(ca.giu_de_doc ?? 0) === 1,
    anHanGiay: Number(ca.an_han_giay ?? 0),
    soCau: ca.so_cau_json ? JSON.parse(ca.so_cau_json) : undefined,
    boTheoEm: ca.bo_theo_em_json ? JSON.parse(ca.bo_theo_em_json) : undefined,
    // KHÔNG trả gói đề trong thân: máy em tải riêng từ /de/:maCa, qua bộ đệm biên.
    deUrl: ca.bank_r2 ? `/de/${encodeURIComponent(maCa)}` : null,
  })
}

async function luuTam(env: Env, b: Record<string, unknown>): Promise<Response> {
  const dk = dieuKienLuot(b)
  if (!dk) return ra({ ok: false, lyDo: 'thieu' })
  const r = await env.DB.prepare(
    `UPDATE luot SET dap_an_json = ?, giay_cau_json = ?, cap_nhat_luc = ?
     WHERE ${dk.sql} AND trang_thai = 'dang_lam'`,
  )
    .bind(JSON.stringify(b.dapAn ?? {}), b.giayCau ? JSON.stringify(b.giayCau) : null, new Date().toISOString(), ...dk.tham)
    .run()
  if (r.meta.changes === 0) return ra({ ok: false, lyDo: 'khong_dang_lam' })
  return ra({ ok: true })
}

async function nop(env: Env, b: Record<string, unknown>): Promise<Response> {
  const dk = dieuKienLuot(b)
  if (!dk) return ra({ ok: false, lyDo: 'thieu' })
  const integrity = (b.integrity ?? {}) as { leaveCount?: number; totalHiddenMs?: number; blocked?: boolean }
  const nopLuc = new Date().toISOString()
  const trangThai = integrity.blocked ? 'khoa' : 'da_nop'

  // KHOÁ CHỐNG TRÙNG nằm ngay trong mệnh đề WHERE: lượt đã nộp thì câu này
  // không đổi dòng nào, nên máy em thử lại bao nhiêu lần cũng an toàn.
  const r = await env.DB.prepare(
    `UPDATE luot SET nop_luc = ?, trang_thai = ?, dap_an_json = ?, giay_cau_json = ?,
            integrity_json = ?, so_lan_roi_man = ?, tong_giay_roi_man = ?, cap_nhat_luc = ?, da_day_sheet = 0
     WHERE ${dk.sql} AND trang_thai = 'dang_lam'`,
  )
    .bind(
      nopLuc,
      trangThai,
      JSON.stringify(b.dapAn ?? {}),
      b.giayCau ? JSON.stringify(b.giayCau) : null,
      JSON.stringify(integrity),
      Number(integrity.leaveCount ?? 0),
      Math.round(Number(integrity.totalHiddenMs ?? 0) / 1000),
      nopLuc,
      ...dk.tham,
    )
    .run()

  if (r.meta.changes === 0) {
    // Đã nộp rồi thì TRẢ OK, không báo lỗi: máy em mất sóng rồi gửi lại là
    // chuyện thường, báo đỏ ở đây là em tưởng mất bài và nộp lại lần nữa.
    const da = await env.DB.prepare(`SELECT trang_thai, nop_luc FROM luot WHERE ${dk.sql}`)
      .bind(...dk.tham)
      .first<DongLuot>()
    if (da && (da.trang_thai === 'da_nop' || da.trang_thai === 'khoa')) {
      return ra({ ok: true, daNhan: true, nopLuc: da.nop_luc })
    }
    return ra({ ok: false, lyDo: 'khong_tim_thay' })
  }
  return ra({ ok: true, nopLuc })
}

/**
 * TRẠNG THÁI LÀM BÀI — lệnh EM BẮN NHIỀU NHẤT: 270 lượt một ca 45 phút, nhân
 * ba mươi em là hơn tám nghìn lượt. Chuyển đúng lệnh này đi là đã bỏ được hai
 * phần ba toàn bộ tải của cả ca.
 *
 * MỘT câu ghi, khoá theo SBD nên hai máy của cùng một em cũng không sinh hai
 * dòng. Không khoá toàn cục ⇒ ba mươi em đẩy cùng lúc là ba mươi dòng riêng.
 */
async function dayTrangThai(env: Env, b: Record<string, unknown>): Promise<Response> {
  const sbd = String(b.sbd ?? '').trim()
  if (!sbd) return ra({ ok: false, lyDo: 'thieu' })
  const nay = new Date().toISOString()
  await env.DB.prepare(
    `INSERT INTO trang_thai (sbd, ma_ca, lop, dang_lam, bat_dau_luc, da_lam_cau_hoi,
                             tong_cau_hoi, so_lan_roi_app, blocked, cap_nhat_luc, da_day_sheet)
     VALUES (?,?,?,?,?,?,?,?,?,?,0)
     ON CONFLICT(sbd) DO UPDATE SET
       ma_ca=excluded.ma_ca, lop=excluded.lop, dang_lam=excluded.dang_lam,
       bat_dau_luc=excluded.bat_dau_luc, da_lam_cau_hoi=excluded.da_lam_cau_hoi,
       tong_cau_hoi=excluded.tong_cau_hoi, so_lan_roi_app=excluded.so_lan_roi_app,
       blocked=excluded.blocked, cap_nhat_luc=excluded.cap_nhat_luc, da_day_sheet=0`,
  )
    .bind(
      sbd, String(b.maCa ?? ''), String(b.lop ?? ''), b.dangLam ? 1 : 0,
      String(b.batDauLuc ?? nay), Number(b.daLamCauHoi ?? 0), Number(b.tongCauHoi ?? 0),
      Number(b.soLanRoiApp ?? 0), b.blocked ? 1 : 0, nay,
    )
    .run()
  return ra({ ok: true })
}

/** Phụ huynh xem con đang làm tới đâu. Không đòi mã bí mật — giống Apps Script
 *  hiện nay, phụ huynh chỉ tra được đúng SBD của con mình. */
async function xemTrangThai(env: Env, sbd: string): Promise<Response> {
  if (!sbd) return ra({ ok: false, lyDo: 'thieu' })
  const r = await env.DB.prepare('SELECT * FROM trang_thai WHERE sbd = ?').bind(sbd).first<Record<string, unknown>>()
  return ra({ ok: true, found: !!r, trangThai: r ?? null })
}

/** PHÒNG CHỜ — em qua cổng nhưng thầy chưa bấm Bắt đầu.
 *
 * KHÔNG tạo lượt, KHÔNG trả đề: đồng hồ chưa chạy cho ai và đề chưa nằm trên
 * máy em một giây nào. Đây là lúc ĐÔNG NHẤT của cả ca — cả lớp hỏi lại mỗi ba
 * giây — nên nó phải là câu nhẹ nhất trong toàn bộ máy chủ. */
async function hoiPhongCho(env: Env, maCa: string): Promise<Response> {
  const ca = await docCa(env, maCa)
  if (!ca) return ra({ ok: false, error: 'Không tìm thấy ca kiểm tra' })
  return ra({
    ok: true,
    phongCho: Number(ca.phong_cho ?? 0) === 1,
    batDau: !!ca.bat_dau_thi_luc,
    batDauLuc: ca.bat_dau_thi_luc ?? '',
    trangThai: ca.trang_thai,
  })
}

async function ghiPhongCho(env: Env, b: Record<string, unknown>): Promise<Response> {
  const maCa = String(b.maCa ?? '').trim()
  const sbd = String(b.sbd ?? '').trim()
  if (!maCa || !sbd) return ra({ ok: false, lyDo: 'thieu' })
  await env.DB.prepare(
    `INSERT INTO phong_cho (khoa, ma_ca, sbd, ho_ten, ghi_luc) VALUES (?,?,?,?,?)
     ON CONFLICT(khoa) DO UPDATE SET ho_ten=excluded.ho_ten, ghi_luc=excluded.ghi_luc`,
  )
    .bind(`${maCa}|${sbd}`, maCa, sbd, String(b.hoTen ?? ''), new Date().toISOString())
    .run()
  return ra({ ok: true })
}

async function layDe(env: Env, maCa: string): Promise<Response> {
  const ca = await docCa(env, maCa)
  if (!ca?.bank_r2) return ra({ ok: false, lyDo: 'chua_co_de' }, 404)
  if (!env.DE) return ra({ ok: false, lyDo: 'chua_noi_r2' }, 500)
  const o = await env.DE.get(ca.bank_r2)
  if (!o) return ra({ ok: false, lyDo: 'mat_goi_de' }, 404)
  // Gói đề của một ca không đổi sau khi phát ⇒ cho bộ đệm biên giữ lâu.
  return new Response(o.body, {
    headers: { ...JSON_HEADERS, 'cache-control': 'public, max-age=86400', etag: o.httpEtag },
  })
}

// ------------------------------------------------------------------- THẦY

async function dayCa(env: Env, b: Record<string, unknown>): Promise<Response> {
  const ca = b.ca as Record<string, unknown>
  const maCa = String(ca?.maCa ?? '').trim()
  if (!maCa) return ra({ ok: false, error: 'Thiếu mã ca' })

  let bankKey: string | null = null
  if (b.bank) {
    if (!env.DE) return ra({ ok: false, error: 'Chưa nối R2 — chưa đẩy gói đề được' }, 500)
    bankKey = `de/${maCa}.json`
    await env.DE.put(bankKey, JSON.stringify(b.bank))
  }
  await env.DB.prepare(
    `INSERT INTO ca (ma_ca, ten_ca, trang_thai, bat_dau, het_han_vao, thoi_gian_phut, loai, han_nop,
                     cong_bo, nguong_lan, nguong_giay, bank_r2, so_cau_json, bo_theo_em_json, cap_nhat_luc,
                     lop, phong_cho, bat_dau_thi_luc, giu_de_doc, an_han_giay)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON CONFLICT(ma_ca) DO UPDATE SET
       ten_ca=excluded.ten_ca, trang_thai=excluded.trang_thai, bat_dau=excluded.bat_dau,
       het_han_vao=excluded.het_han_vao, thoi_gian_phut=excluded.thoi_gian_phut, loai=excluded.loai,
       han_nop=excluded.han_nop, cong_bo=excluded.cong_bo, nguong_lan=excluded.nguong_lan,
       nguong_giay=excluded.nguong_giay, so_cau_json=excluded.so_cau_json,
       bo_theo_em_json=excluded.bo_theo_em_json, cap_nhat_luc=excluded.cap_nhat_luc,
       lop=excluded.lop, phong_cho=excluded.phong_cho, giu_de_doc=excluded.giu_de_doc,
       an_han_giay=excluded.an_han_giay,
       -- KHÔNG ghi đè mốc bắt đầu bằng rỗng: thầy đẩy lại ca giữa giờ (sửa tên,
       -- đổi hạn) mà xoá mốc này là cả lớp bị đá về phòng chờ, đồng hồ đang chạy.
       bat_dau_thi_luc=COALESCE(excluded.bat_dau_thi_luc, ca.bat_dau_thi_luc),
       bank_r2=COALESCE(excluded.bank_r2, ca.bank_r2)`,
  )
    .bind(
      maCa, String(ca.tenCa ?? ''), String(ca.trangThai ?? 'mo'), String(ca.batDau ?? ''),
      String(ca.hetHanVao ?? ''), Number(ca.thoiGianPhut) || 45, String(ca.loai ?? 'thi'),
      String(ca.hanNop ?? ''), String(ca.congBo ?? 'khong'), Number(ca.nguongLan) || 3,
      Number(ca.nguongGiay) || 10, bankKey, ca.soCau ? JSON.stringify(ca.soCau) : null,
      ca.boTheoEm ? JSON.stringify(ca.boTheoEm) : null, new Date().toISOString(),
      String(ca.lop ?? ''), ca.phongCho ? 1 : 0, String(ca.batDauThiLuc ?? '') || null,
      ca.giuDeDoc ? 1 : 0, Number(ca.anHanGiay) || 0,
    )
    .run()
  return ra({ ok: true, maCa, coDe: !!bankKey })
}

/** Thầy bấm BẮT ĐẦU THI — cả lớp nhận đề đúng một thời điểm. */
async function batDauThi(env: Env, maCa: string): Promise<Response> {
  if (!maCa) return ra({ ok: false, error: 'Thiếu mã ca' })
  const luc = new Date().toISOString()
  const r = await env.DB.prepare('UPDATE ca SET bat_dau_thi_luc = ?, cap_nhat_luc = ? WHERE ma_ca = ?')
    .bind(luc, luc, maCa)
    .run()
  if (r.meta.changes === 0) return ra({ ok: false, error: 'Không tìm thấy ca kiểm tra' })
  return ra({ ok: true, batDauLuc: luc })
}

/** Màn theo dõi phòng thi của thầy. ĐÒI mã bí mật: đây là danh sách tên và
 *  tiến độ của cả lớp, không phải thứ để ngỏ. */
// ---------------------------------------------------------------------------
// PHIẾU BÁO CÁO GỬI PHỤ HUYNH — 11/09.
//
// VÌ SAO CHUYỂN: phiếu đang nằm trong sheet `PhieuKetQua`, mỗi gói tới 4 MB.
// Đo trên máy chủ cũ sau khi đã tối ưu: `layPhieu` 20 lượt đồng thời cho
// p50 5,13 s · p95 5,85 s. Phụ huynh bấm link rồi ngồi nhìn năm giây.
//
// R2 đọc thẳng ở biên, cùng gói dữ liệu ấy, tính bằng trăm mili giây.
//
// MÔ HÌNH TIN CẬY GIỮ NGUYÊN: đường `GET /phieu/:ma` là CÔNG KHAI, đúng như
// `layPhieu` bên Apps Script — ai có mã phiếu thì mở được, mã là chìa khoá.
// KHÔNG liệt kê được: không có đường nào trả danh sách mã.
//
// KHÔNG ĐẶT BỘ ĐỆM: thầy sửa rồi lưu lại phiếu là phụ huynh phải thấy bản mới
// ngay. Tốc độ ở đây tới từ R2 thay cho Sheets, không phải từ bộ đệm.
async function dayPhieu(env: Env, b: Record<string, unknown>): Promise<Response> {
  const ma = String(b.ma ?? '').trim()
  if (!ma) return ra({ ok: false, error: 'Thiếu mã phiếu' })
  if (!env.DE) return ra({ ok: false, error: 'Chưa nối R2 — chưa đẩy phiếu được' }, 500)
  const goi = {
    ma,
    maCa: String(b.maCa ?? ''),
    sbd: String(b.sbd ?? ''),
    hoTen: String(b.hoTen ?? ''),
    loai: String(b.loai ?? 'ketqua'),
    phieu: b.phieu ?? null,
    ghiLuc: new Date().toISOString(),
  }
  await env.DE.put(`phieu/${ma}.json`, JSON.stringify(goi))
  return ra({ ok: true })
}

async function layPhieuR2(env: Env, ma: string): Promise<Response> {
  const khoa = String(ma ?? '').trim()
  if (!khoa) return ra({ ok: false, lyDo: 'thieu' }, 400)
  if (!env.DE) return ra({ ok: false, lyDo: 'khong_co' }, 404)
  const o = await env.DE.get(`phieu/${khoa}.json`)
  // KHÔNG CÓ Ở ĐÂY KHÔNG CÓ NGHĨA LÀ KHÔNG CÓ. Phiếu cũ vẫn nằm bên Apps
  // Script, nên máy em phải hiểu 404 là "hỏi chỗ cũ", không phải "báo đỏ".
  if (!o) return ra({ ok: false, lyDo: 'khong_co' }, 404)
  return new Response(o.body, {
    status: 200,
    headers: { ...JSON_HEADERS, 'cache-control': 'no-store' },
  })
}

/** THU HỒI PHIẾU. Ghi đè bằng gói RỖNG thay vì xoá đối tượng R2.
 *
 * Vì sao không xoá: thu hồi là việc thầy làm khi gửi nhầm link, và thứ phải bảo
 * đảm là "mở ra không còn nội dung", không phải "đối tượng biến mất". Ghi đè
 * đạt đúng điều đó bằng một lệnh đã có, và để lại dấu vết thời điểm thu hồi. */
async function xoaPhieuR2(env: Env, ma: string): Promise<Response> {
  const khoa = String(ma ?? '').trim()
  if (!khoa) return ra({ ok: false, error: 'Thiếu mã phiếu' })
  if (!env.DE) return ra({ ok: true })
  await env.DE.put(`phieu/${khoa}.json`, JSON.stringify({ ma: khoa, thuHoi: true, phieu: null, ghiLuc: new Date().toISOString() }))
  return ra({ ok: true })
}

// ---------------------------------------------------------------------------
// DANH SÁCH LỚP — cổng chặn số báo danh lạ, 11/09.
//
// Bên Apps Script, `vaoThi` chặn em không có trong `DanhSachLop`. Worker chưa
// có cổng ấy, nên chuyển vào thi sang đây mà quên nó là ai có mã ca cũng gõ
// một số báo danh bất kỳ rồi vào thi được.
//
// LUẬT GIỮ NGUYÊN TỪ APPS SCRIPT: bảng RỖNG thì KHÔNG chặn ai. Thầy chưa kịp
// đẩy danh sách mà cả lớp đứng ngoài cửa là hỏng nặng hơn hẳn việc thiếu cổng.
/** ĐẨY NHIỀU CA VÀ NHIỀU LƯỢT MỘT LƯỢT — dùng cho lượt chuyển dữ liệu cũ từ
 * Sheet sang D1 (đợt 5B).
 *
 * VÌ SAO KHÔNG GỌI `/ca/day` NHIỀU LẦN: mỗi lượt gọi là một vòng mạng, mà kho
 * của thầy có hàng chục ca và vài trăm lượt. Gộp lại còn vài lượt gọi.
 *
 * `da_day_sheet = 1` cho MỌI dòng lượt đẩy ở đây: chúng vốn ĐANG nằm trên
 * Sheet, đó là nơi chúng được chép ra. Đánh dấu 0 là màn Theo dõi sẽ báo "còn
 * N bài chưa về Sheet" rồi đẩy ngược lại đúng những dòng đã có — vừa sai số
 * vừa có nguy cơ ghi đè bản trên Sheet bằng bản chép thiếu cột. */
async function dayNhieuCa(env: Env, b: Record<string, unknown>): Promise<Response> {
  const dsCa = Array.isArray(b.ca) ? (b.ca as Record<string, unknown>[]) : []
  const dsLuot = Array.isArray(b.luot) ? (b.luot as Record<string, unknown>[]) : []
  if (dsCa.length === 0 && dsLuot.length === 0) return ra({ ok: false, error: 'Không có gì để đẩy' })
  const nay = new Date().toISOString()
  const cau: D1PreparedStatement[] = []

  for (const c of dsCa) {
    const maCa = String(c.maCa ?? '').trim()
    if (!maCa) continue
    cau.push(
      env.DB.prepare(
        `INSERT INTO ca (ma_ca, ten_ca, trang_thai, bat_dau, het_han_vao, thoi_gian_phut, loai, han_nop,
                         cong_bo, cap_nhat_luc, lop, phong_cho, bat_dau_thi_luc, giu_de_doc, an_han_giay,
                         mo_luc, pham_vi, len_bang, xoa_luc, dem_da_vao, dem_da_nop, dem_canh_bao, dem_luc)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
         ON CONFLICT(ma_ca) DO UPDATE SET
           ten_ca=excluded.ten_ca, trang_thai=excluded.trang_thai, bat_dau=excluded.bat_dau,
           het_han_vao=excluded.het_han_vao, thoi_gian_phut=excluded.thoi_gian_phut,
           loai=excluded.loai, han_nop=excluded.han_nop, cong_bo=excluded.cong_bo,
           cap_nhat_luc=excluded.cap_nhat_luc, lop=excluded.lop, phong_cho=excluded.phong_cho,
           giu_de_doc=excluded.giu_de_doc, an_han_giay=excluded.an_han_giay,
           mo_luc=excluded.mo_luc, pham_vi=excluded.pham_vi, len_bang=excluded.len_bang,
           xoa_luc=excluded.xoa_luc, dem_da_vao=excluded.dem_da_vao, dem_da_nop=excluded.dem_da_nop,
           dem_canh_bao=excluded.dem_canh_bao, dem_luc=excluded.dem_luc,
           -- Giữ nguyên mốc bắt đầu và khoá gói đề: xem ghi chú ở \`dayCa\`.
           bat_dau_thi_luc=COALESCE(excluded.bat_dau_thi_luc, ca.bat_dau_thi_luc)`,
      ).bind(
        maCa, String(c.tenCa ?? ''), String(c.trangThai ?? 'mo'), String(c.batDau ?? ''),
        String(c.hetHanVao ?? ''), Number(c.thoiGianPhut) || 45, String(c.loai ?? 'thi'),
        String(c.hanNop ?? ''), String(c.congBo ?? 'khong'), nay, String(c.lop ?? ''),
        c.phongCho ? 1 : 0, String(c.batDauThiLuc ?? '') || null, c.giuDeDoc ? 1 : 0,
        Number(c.anHanGiay) || 0, String(c.moLuc ?? ''), String(c.phamVi ?? 'tu_do'),
        c.lenBang === false ? 0 : 1, String(c.xoaLuc ?? ''),
        Number(c.daVao) || 0, Number(c.daNop) || 0, Number(c.canhBao) || 0, nay,
      ),
    )
  }

  for (const l of dsLuot) {
    const maCa = String(l.maCa ?? '').trim()
    const sbd = String(l.sbd ?? '').trim()
    if (!maCa || !sbd) continue
    const lanThu = Number(l.lanThu) || 1
    cau.push(
      env.DB.prepare(
        `INSERT INTO luot (khoa, ma_ca, sbd, lan_thu, vao_luc, het_gio_luc, nop_luc, trang_thai,
                           so_lan_roi_man, tong_giay_roi_man, cap_nhat_luc, da_day_sheet)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,1)
         ON CONFLICT(khoa) DO UPDATE SET
           vao_luc=excluded.vao_luc, het_gio_luc=excluded.het_gio_luc, nop_luc=excluded.nop_luc,
           trang_thai=excluded.trang_thai, so_lan_roi_man=excluded.so_lan_roi_man,
           tong_giay_roi_man=excluded.tong_giay_roi_man, cap_nhat_luc=excluded.cap_nhat_luc,
           da_day_sheet=1`,
      ).bind(
        `${maCa}|${sbd}|${lanThu}`, maCa, sbd, lanThu, String(l.vaoLuc ?? '') || nay,
        String(l.hetGioLuc ?? '') || null, String(l.nopLuc ?? '') || null,
        String(l.trangThai ?? 'dang_lam'), Number(l.soLanRoiMan) || 0,
        Number(l.tongGiayRoiMan) || 0, nay,
      ),
    )
  }

  for (let i = 0; i < cau.length; i += 200) await env.DB.batch(cau.slice(i, i + 200))
  return ra({ ok: true, soCa: dsCa.length, soLuot: dsLuot.length, soCau: cau.length })
}

/** DANH SÁCH CA + ĐẾM ĐÃ VÀO / ĐÃ NỘP / CẢNH BÁO — thay `danhSachCa` bên Apps
 * Script, đúng một lượt gọi và đúng một câu truy vấn cho phần đếm.
 *
 * LUẬT ĐẾM PHẢI KHỚP `thongKeLuot_` BÊN APPS SCRIPT, không được xê một ly:
 *   · lấy LẦN THỬ CAO NHẤT của mỗi em trong ca;
 *   · lượt `duoc_duyet_lai` KHÔNG tính vào bất kỳ ô nào;
 *   · đã nộp = `da_nop` hoặc `khoa`;
 *   · cảnh báo = `khoa` hoặc có lần rời màn.
 * Lệch luật ở đây là thầy nhìn màn Ca thi thấy số em khác với sự thật trên
 * Sheet — sai số liệu còn tệ hơn chậm. */
async function danhSachCaMoi(env: Env, daXoa: boolean): Promise<Response> {
  const rCa = await env.DB.prepare(
    daXoa
      ? `SELECT * FROM ca WHERE trang_thai = 'da_xoa'`
      : `SELECT * FROM ca WHERE trang_thai <> 'da_xoa' AND ma_ca <> 'DOTAI'`,
  ).all<Record<string, unknown>>()

  const rDem = await env.DB.prepare(
    `WITH moi AS (
       SELECT l.ma_ca, l.trang_thai, l.so_lan_roi_man
       FROM luot l
       JOIN (SELECT ma_ca, sbd, MAX(lan_thu) AS m FROM luot GROUP BY ma_ca, sbd) x
         ON l.ma_ca = x.ma_ca AND l.sbd = x.sbd AND l.lan_thu = x.m
       WHERE l.trang_thai <> 'duoc_duyet_lai'
     )
     SELECT ma_ca,
            COUNT(*) AS da_vao,
            SUM(CASE WHEN trang_thai IN ('da_nop','khoa') THEN 1 ELSE 0 END) AS da_nop,
            SUM(CASE WHEN trang_thai = 'khoa' OR so_lan_roi_man > 0 THEN 1 ELSE 0 END) AS canh_bao
     FROM moi GROUP BY ma_ca`,
  ).all<{ ma_ca: string; da_vao: number; da_nop: number; canh_bao: number }>()

  const dem: Record<string, { da_vao: number; da_nop: number; canh_bao: number }> = {}
  for (const d of rDem.results ?? []) dem[String(d.ma_ca)] = d

  const items = (rCa.results ?? []).map((v) => {
    const maCa = String(v.ma_ca ?? '')
    const t = dem[maCa] ?? { da_vao: 0, da_nop: 0, canh_bao: 0 }
    // SỐ LỚN HƠN giữa ĐẾM SỐNG (từ bảng `luot` trên D1) và ĐẾM CHỤP (con số
    // Apps Script đã tính, chép sang lúc chuyển dữ liệu).
    //
    // VÌ SAO LẤY SỐ LỚN HƠN, không lấy một trong hai:
    //   · Ca CŨ chạy trên Apps Script: D1 không có dòng `luot` nào ⇒ đếm sống
    //     bằng 0 ⇒ phải dùng số chụp, nếu không màn Ca thi hiện 0/36 cho mọi ca cũ.
    //   · Ca MỚI chạy trên máy chủ mới: mỗi em vào thi tạo một dòng ở D1 ngay,
    //     còn Sheet phải đợi lượt nộp ⇒ đếm sống LUÔN mới hơn số chụp.
    //   · Ca chép DỞ (chuyển dữ liệu chết giữa chừng, 11/09): đếm sống là một
    //     phần ⇒ số chụp lớn hơn và thắng. Không bao giờ đếm THIẾU.
    const chup = { da_vao: Number(v.dem_da_vao) || 0, da_nop: Number(v.dem_da_nop) || 0, canh_bao: Number(v.dem_canh_bao) || 0 }
    return {
      maCa,
      lop: String(v.lop ?? ''),
      thoiGianPhut: Number(v.thoi_gian_phut) || 45,
      moLuc: String(v.mo_luc ?? ''),
      congBo: String(v.cong_bo ?? 'khong'),
      batDau: String(v.bat_dau ?? ''),
      hetHanVao: String(v.het_han_vao ?? ''),
      trangThai: String(v.trang_thai ?? 'mo'),
      tenCa: String(v.ten_ca ?? ''),
      phamVi: String(v.pham_vi ?? 'tu_do'),
      loai: String(v.loai ?? '') === 'baitap' ? 'baitap' : 'thi',
      hanNop: String(v.han_nop ?? ''),
      lenBang: Number(v.len_bang ?? 1) !== 0,
      giuDeDoc: Number(v.giu_de_doc ?? 0) === 1,
      anHanGiay: Number(v.an_han_giay) || 0,
      phongCho: Number(v.phong_cho ?? 0) === 1,
      batDauThiLuc: String(v.bat_dau_thi_luc ?? ''),
      xoaLuc: String(v.xoa_luc ?? ''),
      daVao: Math.max(Number(t.da_vao) || 0, chup.da_vao),
      daNop: Math.max(Number(t.da_nop) || 0, chup.da_nop),
      canhBao: Math.max(Number(t.canh_bao) || 0, chup.canh_bao),
    }
  })
  items.sort((a, b) => mocMs(b.moLuc || b.batDau) - mocMs(a.moLuc || a.batDau))

  const dau = await env.DB.prepare('SELECT * FROM dong_bo WHERE ma = ?').bind('ca_day_du').first<Record<string, unknown>>()
  // SỐ DÒNG LƯỢT THẬT — để app đối chiếu CHÍNH XÁC với số dòng đọc từ Sheet.
  // `daVao` không dùng được cho việc này: nó đếm lần thử cao nhất mỗi em, còn
  // em thi lại có nhiều dòng.
  const rDong = await env.DB.prepare(`SELECT COUNT(*) AS n FROM luot WHERE ma_ca <> 'DOTAI'`).first<{ n: number }>()
  return ra({ ok: true, items, dauDongBo: dau ?? null, soDongLuot: Number(rDong?.n) || 0, serverNow: Date.now() })
}

/** Mốc thời gian thành mili giây; chuỗi rỗng hay hỏng thì về 0. */
function mocMs(s: string): number {
  const t = Date.parse(String(s || ''))
  return Number.isFinite(t) ? t : 0
}

/** GHI DẤU ĐỒNG BỘ. App chỉ gọi sau khi đã tự đối chiếu số ca và số lượt hai
 * bên khớp nhau — Worker không tự phong cho mình là đủ dữ liệu. */
async function ghiDauDongBo(env: Env, b: Record<string, unknown>): Promise<Response> {
  const ma = String(b.ma ?? '').trim()
  if (!ma) return ra({ ok: false, error: 'Thiếu mã dấu' })
  if (b.xoa === true) {
    await env.DB.prepare('DELETE FROM dong_bo WHERE ma = ?').bind(ma).run()
    return ra({ ok: true, daXoa: true })
  }
  await env.DB.prepare(
    `INSERT INTO dong_bo (ma, luc, so_ca, so_luot, ghi_chu) VALUES (?,?,?,?,?)
     ON CONFLICT(ma) DO UPDATE SET luc=excluded.luc, so_ca=excluded.so_ca,
       so_luot=excluded.so_luot, ghi_chu=excluded.ghi_chu`,
  ).bind(ma, new Date().toISOString(), Number(b.soCa) || 0, Number(b.soLuot) || 0, String(b.ghiChu ?? '')).run()
  return ra({ ok: true })
}

async function dayDanhSach(env: Env, b: Record<string, unknown>): Promise<Response> {
  const ds = chuanHoaDanhSach(b.ds)
  // Danh sách rỗng thì KHÔNG ghi gì và KHÔNG xoá gì. Một lượt gọi hỏng nửa
  // chừng mà xoá sạch bảng là mở toang cổng vào thi ngay trước giờ thi.
  if (ds.length === 0) return ra({ ok: false, error: 'Danh sách rỗng' })
  const nay = new Date().toISOString()
  const cau = ds.map((e) =>
    env.DB.prepare(
      `INSERT INTO danh_sach (sbd, ho_ten, nam_sinh, lop, cap_nhat_luc) VALUES (?,?,?,?,?)
       ON CONFLICT(sbd) DO UPDATE SET ho_ten=excluded.ho_ten, nam_sinh=excluded.nam_sinh,
         lop=excluded.lop, cap_nhat_luc=excluded.cap_nhat_luc`,
    ).bind(e.sbd, e.hoTen, e.namSinh, e.lop, nay),
  )
  // Gói $5 cho 1.000 câu mỗi lượt gọi; chia lô 500 để còn chỗ thở.
  for (let i = 0; i < cau.length; i += 500) await env.DB.batch(cau.slice(i, i + 500))
  // GHI ĐÈ TOÀN BỘ, đúng như `napDanhSachLop` bên Apps Script xoá trắng sheet
  // rồi ghi lại. Chỉ upsert thôi là em thầy đã gạch tên vẫn vào thi được ở máy
  // chủ mới — hai cổng lệch nhau, và cái lệch ấy nghiêng về phía mở.
  //
  // Xoá SAU khi mọi lô đã ghi xong: lô hỏng thì hàm ném lỗi ở dòng trên và
  // không xuống tới đây, nên không bao giờ xoá trên một bảng ghi dở.
  const xoa = await env.DB.prepare('DELETE FROM danh_sach WHERE cap_nhat_luc <> ?').bind(nay).run()
  return ra({ ok: true, dem: ds.length, daBo: xoa.meta?.changes ?? 0 })
}

/** Một dòng danh sách, hoặc `null` khi không có. */
async function docDanhSach(env: Env, sbd: string): Promise<Record<string, unknown> | null> {
  return await env.DB.prepare('SELECT * FROM danh_sach WHERE sbd = ?').bind(sbd).first<Record<string, unknown>>()
}

/** Bảng danh sách có dữ liệu chưa. Rỗng ⇒ KHÔNG chặn ai. */
async function coDanhSach(env: Env): Promise<boolean> {
  const r = await env.DB.prepare('SELECT 1 AS co FROM danh_sach LIMIT 1').first<{ co: number }>()
  return !!r
}

/** TRA TÊN THEO SỐ BÁO DANH — để em nhìn đúng tên mình rồi mới bấm Bắt đầu.
 *
 * Cùng đánh đổi đã chốt 07/09 bên Apps Script: ai cầm mã ca cũng dò được "số
 * báo danh này là ai". Chấp nhận, vì phòng thi có thầy coi tại chỗ, và cái giá
 * của việc em không vào thi được lớn hơn. KHÔNG trả năm sinh, KHÔNG trả SĐT. */
async function tenTheoSbd(env: Env, maCa: string, sbd: string): Promise<Response> {
  if (!maCa || !sbd) return ra({ ok: false, lyDo: 'thieu' })
  const ca = await docCa(env, maCa)
  if (!ca) return ra({ ok: false, lyDo: 'khong_co_ca' })
  if (!(await coDanhSach(env))) return ra({ ok: true, hoTen: '' })
  const d = await docDanhSach(env, sbd)
  if (!d) return ra({ ok: false, lyDo: 'khong_co_sbd' })
  return ra({ ok: true, hoTen: String(d.ho_ten ?? '') })
}

/** MỌI LƯỢT CỦA MỘT CA — nguồn cho màn Chi tiết ca của thầy.
 *
 * VÌ SAO CẦN: màn ấy đọc bảng `LuotThi` bên Apps Script. Ca chạy trên máy chủ
 * mới thì lượt VÀO THI không tạo dòng bên ấy (chỉ lượt NỘP mới ghi cả hai nơi),
 * nên giữa ca thầy mở màn Chi tiết ca ra là thấy TRỐNG — không biết ai đã vào,
 * ai đang làm, ai bị chặn, và không có gì để bấm mở khoá hay cho thi lại.
 *
 * Trả về đúng tên trường mà `LuotThiRow` ở máy em đang đọc, để chỗ gọi chỉ việc
 * trộn vào danh sách cũ. */
async function luotCuaCa(env: Env, maCa: string): Promise<Response> {
  if (!maCa) return ra({ ok: false, error: 'Thiếu mã ca' })
  const r = await env.DB.prepare('SELECT * FROM luot WHERE ma_ca = ? ORDER BY sbd, lan_thu').bind(maCa).all<Record<string, unknown>>()
  const ds = (r.results ?? []).map((l) => ({
    sbd: String(l.sbd ?? ''),
    hoTen: '',
    lanThu: Number(l.lan_thu) || 1,
    trangThai: String(l.trang_thai ?? ''),
    vaoLuc: String(l.vao_luc ?? ''),
    hetGioLuc: String(l.het_gio_luc ?? ''),
    nopLuc: String(l.nop_luc ?? ''),
    soLanRoiMan: Number(l.so_lan_roi_man) || 0,
    tongGiayRoiMan: Number(l.tong_giay_roi_man) || 0,
    diemI: null,
    diemII: null,
    diemIII: null,
    tong: null,
    duyetBoi: '',
    duyetLuc: '',
    ghiChu: '',
    // KHÔNG trả ba gói JSON nặng: màn Chi tiết ca chỉ cần biết AI ĐANG Ở ĐÂU.
    // Bài làm lấy bằng đường khác, và kéo cả bài của 50 em về mỗi nhịp làm mới
    // là dựng lại đúng cái chậm vừa bỏ.
    dapAn: null,
    integrity: null,
    giayCau: null,
  }))
  return ra({ ok: true, ds, dem: ds.length })
}

async function xemTheoDoi(env: Env, maCa: string): Promise<Response> {
  const r = await env.DB.prepare('SELECT * FROM trang_thai WHERE ma_ca = ? ORDER BY sbd')
    .bind(maCa)
    .all<Record<string, unknown>>()
  return ra({ ok: true, ds: r.results, dem: r.results.length })
}

async function xemPhongCho(env: Env, maCa: string): Promise<Response> {
  const r = await env.DB.prepare('SELECT * FROM phong_cho WHERE ma_ca = ? ORDER BY ghi_luc')
    .bind(maCa)
    .all<Record<string, unknown>>()
  return ra({ ok: true, ds: r.results, dem: r.results.length })
}

/** Lượt CHƯA đẩy về Sheet. Máy thầy kéo về rồi tự phát lại lên Apps Script —
 *  Worker KHÔNG giữ mã bí mật Google, nên không tự gọi sang đó. */
async function chuaDay(env: Env, maCa: string): Promise<Response> {
  const r = await env.DB.prepare('SELECT * FROM luot WHERE ma_ca = ? AND da_day_sheet = 0 ORDER BY sbd')
    .bind(maCa)
    .all<DongLuot>()
  return ra({ ok: true, luot: r.results, con: r.results.length })
}

async function danhDauDaDay(env: Env, b: Record<string, unknown>): Promise<Response> {
  const ds = Array.isArray(b.khoa) ? (b.khoa as string[]) : []
  if (ds.length === 0) return ra({ ok: true, danhDau: 0 })
  if (ds.length > 500) return ra({ ok: false, error: 'Quá 500 khoá một lượt' })
  const cho = ds.map(() => '?').join(',')
  const r = await env.DB.prepare(`UPDATE luot SET da_day_sheet = 1 WHERE khoa IN (${cho})`).bind(...ds).run()
  return ra({ ok: true, danhDau: r.meta.changes })
}

// ------------------------------------------------------------------ ĐO TẢI

/** Mở sẵn ca đo. `CA_DO_TAI` là hằng số chết trong mã — không nhận từ ngoài,
 *  nên không có đường nào để trang đo chạm vào ca thật của thầy. */
async function moCaDoTai(env: Env): Promise<void> {
  const now = Date.now()
  await env.DB.prepare(
    `INSERT INTO ca (ma_ca, ten_ca, trang_thai, bat_dau, het_han_vao, thoi_gian_phut, loai,
                     han_nop, cong_bo, nguong_lan, nguong_giay, cap_nhat_luc)
     VALUES (?, 'Ca đo tải (không phải ca thật)', 'mo', ?, ?, 45, 'thi', '', 'khong', 3, 10, ?)
     ON CONFLICT(ma_ca) DO UPDATE SET trang_thai='mo', bat_dau=excluded.bat_dau,
       het_han_vao=excluded.het_han_vao, cap_nhat_luc=excluded.cap_nhat_luc`,
  )
    .bind(
      CA_DO_TAI,
      new Date(now - 3600_000).toISOString(),
      new Date(now + 86400_000).toISOString(),
      new Date(now).toISOString(),
    )
    .run()
}

/** Xoá SẠCH dòng của ca đo. Điều kiện là hằng số, không ghép chuỗi từ ngoài. */
async function donDoTai(env: Env): Promise<Response> {
  const r = await env.DB.prepare('DELETE FROM luot WHERE ma_ca = ?').bind(CA_DO_TAI).run()
  return ra({ ok: true, xoa: r.meta.changes })
}

// ------------------------------------------------------------------ ĐỊNH TUYẾN

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url)
    const p = url.pathname

    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS })
    // PHIẾU: đường đọc CÔNG KHAI, đặt trước mọi cổng mã bí mật.
    if (req.method === 'GET' && p.startsWith('/phieu/')) {
      return layPhieuR2(env, decodeURIComponent(p.slice('/phieu/'.length)))
    }
    if (req.method === 'GET' && p === '/khoe') {
      return ra({ ok: true, ten: 'may-chu-moi', coDB: !!env.DB, coR2: !!env.DE, coMat: !!env.MA_BI_MAT })
    }
    if (req.method === 'GET' && p.startsWith('/de/')) return layDe(env, decodeURIComponent(p.slice(4)))
    if (req.method === 'GET' && p === '/do-tai') {
      await moCaDoTai(env)
      return new Response(TRANG_DO_TAI, { headers: { 'content-type': 'text/html;charset=utf-8', ...CORS } })
    }
    if (req.method === 'POST' && p === '/do-tai/don') return donDoTai(env)
    if (req.method === 'GET' && p === '/trang-thai') return xemTrangThai(env, (url.searchParams.get('sbd') ?? '').trim())
    if (req.method === 'GET' && p === '/phong-cho') return hoiPhongCho(env, (url.searchParams.get('maCa') ?? '').trim())
    if (req.method === 'GET' && p === '/ten-theo-sbd') {
      return tenTheoSbd(env, (url.searchParams.get('maCa') ?? '').trim(), (url.searchParams.get('sbd') ?? '').trim())
    }
    if (req.method !== 'POST') return ra({ ok: false, error: 'Chỉ nhận POST' }, 405)

    let b: Record<string, unknown>
    try {
      b = (await req.json()) as Record<string, unknown>
    } catch {
      return ra({ ok: false, error: 'Thân gói không phải JSON' }, 400)
    }

    // Lệnh của HỌC SINH — không đòi mã bí mật, giống Apps Script hiện nay.
    if (p === '/vao-thi') return vaoThi(env, b)
    if (p === '/luu-tam') return luuTam(env, b)
    if (p === '/nop') return nop(env, b)
    if (p === '/trang-thai') return dayTrangThai(env, b)
    if (p === '/phong-cho') return ghiPhongCho(env, b)

    // Lệnh của THẦY — đòi mã bí mật.
    if (!laThay(req, env, b)) return ra({ ok: false, error: 'Sai mã bí mật' }, 403)
    if (p === '/ca/day') return dayCa(env, b)
    if (p === '/danh-sach/day') return dayDanhSach(env, b)
    if (p === '/phieu/day') return dayPhieu(env, b)
    if (p === '/phieu/xoa') return xoaPhieuR2(env, String(b.ma ?? ''))
    if (p === '/chua-day') return chuaDay(env, String(b.maCa ?? ''))
    if (p === '/da-day') return danhDauDaDay(env, b)
    if (p === '/ca/bat-dau') return batDauThi(env, String(b.maCa ?? ''))
    if (p === '/theo-doi') return xemTheoDoi(env, String(b.maCa ?? ''))
    if (p === '/ca/luot') return luotCuaCa(env, String(b.maCa ?? ''))
    if (p === '/ca/nhieu') return dayNhieuCa(env, b)
    if (p === '/ca/danh-sach') return danhSachCaMoi(env, b.daXoa === true)
    if (p === '/dong-bo/dau') return ghiDauDongBo(env, b)
    if (p === '/cho') return xemPhongCho(env, String(b.maCa ?? ''))

    return ra({ ok: false, error: 'Không có đường này' }, 404)
  },
}
