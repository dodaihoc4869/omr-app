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
    // GHI LẠI, vì thầy đứng trong phòng phải thấy. 17/36 em bị chặn hôm 11/09
    // chỉ truy ra được nhờ nhật ký này bên Apps Script; Worker chặn mà không
    // ghi thì màn Chi tiết ca đọc D1 mất hẳn danh sách ấy.
    // Ghi hỏng KHÔNG được đổi câu trả lời cho em.
    await ghiChanVao(env, maCa, sbd, String(b.hoTen ?? ''), String(b.namSinh ?? ''), 'khong_co_sbd').catch(() => {})
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

  // ĐẨY MỘT PHẦN — CHỈ MỐC BẮT ĐẦU VÀ BẢN ĐỒ ĐỀ RIÊNG.
  //
  // LỖI ĐÃ DÍNH, ca thật 704066 tối 11/09: thầy bấm Bắt đầu, `batDauThi` bên
  // máy thầy gọi `dayCaMoi` với ĐÚNG hai trường `maCa` + `batDauThiLuc`. Câu
  // upsert bên dưới lấy `excluded.*` cho mọi cột, nên mọi trường không gửi bị
  // ghi đè bằng rỗng. Tra D1 giữa ca:
  //
  //     ten_ca '' · lop '' · bat_dau '' · het_han_vao '' · phong_cho 0
  //
  // trong khi `bat_dau_thi_luc` có. Hậu quả: màn Ca thi (đọc D1 từ sáng nay)
  // hiện ca không tên, không lớp, không giờ; và tệ hơn, HẠN VÀO PHÒNG với cờ
  // PHÒNG CHỜ bị xoá ngay giữa ca.
  //
  // Nay lượt đẩy một phần đi đường riêng, đụng đúng hai cột.
  if (b.chiMoc === true) {
    const r = await env.DB.prepare(
      `UPDATE ca SET bat_dau_thi_luc = COALESCE(?, bat_dau_thi_luc),
                     bo_theo_em_json = COALESCE(?, bo_theo_em_json),
                     cap_nhat_luc = ?
       WHERE ma_ca = ?`,
    )
      .bind(
        String(ca.batDauThiLuc ?? '') || null,
        ca.boTheoEm ? JSON.stringify(ca.boTheoEm) : null,
        new Date().toISOString(),
        maCa,
      )
      .run()
    return ra({ ok: true, maCa, coDe: !!bankKey, chiMoc: true, coCa: r.meta.changes > 0 })
  }

  await env.DB.prepare(
    `INSERT INTO ca (ma_ca, ten_ca, trang_thai, bat_dau, het_han_vao, thoi_gian_phut, loai, han_nop,
                     cong_bo, nguong_lan, nguong_giay, bank_r2, so_cau_json, bo_theo_em_json, cap_nhat_luc,
                     lop, phong_cho, bat_dau_thi_luc, giu_de_doc, an_han_giay, sinh_tai_d1)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)
     ON CONFLICT(ma_ca) DO UPDATE SET
       -- CHỐT CHẶN THỨ HAI: chuỗi RỖNG không được ghi đè chữ đang có. Lượt đẩy
       -- thiếu trường là chuyện thường (xem khối chiMoc ở trên); mất tên ca
       -- và mất hạn vào phòng giữa ca thì không.
       ten_ca=COALESCE(NULLIF(excluded.ten_ca,''), ca.ten_ca),
       trang_thai=excluded.trang_thai,
       bat_dau=COALESCE(NULLIF(excluded.bat_dau,''), ca.bat_dau),
       het_han_vao=COALESCE(NULLIF(excluded.het_han_vao,''), ca.het_han_vao),
       thoi_gian_phut=excluded.thoi_gian_phut, loai=excluded.loai,
       han_nop=COALESCE(NULLIF(excluded.han_nop,''), ca.han_nop),
       cong_bo=excluded.cong_bo, nguong_lan=excluded.nguong_lan,
       nguong_giay=excluded.nguong_giay, so_cau_json=excluded.so_cau_json,
       bo_theo_em_json=excluded.bo_theo_em_json, cap_nhat_luc=excluded.cap_nhat_luc,
       lop=COALESCE(NULLIF(excluded.lop,''), ca.lop),
       phong_cho=excluded.phong_cho, giu_de_doc=excluded.giu_de_doc,
       an_han_giay=excluded.an_han_giay,
       -- Ca đã mở qua đường này thì MỌI lượt của nó sinh ra ở D1 ⇒ màn Chi
       -- tiết ca được phép đọc thẳng. Ca chép sang từ Sheet (dayNhieuCa) KHÔNG
       -- đặt cờ này, vì bên ấy thiếu điểm, thiếu họ tên, thiếu dòng bị chặn.
       sinh_tai_d1=1,
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

/** SỬA MỘT Ô CỦA DÒNG CA — dùng cho mọi thao tác THẦY làm trên một ca đã có:
 * xoá mềm, khôi phục, khoá, mở khoá, đổi tên.
 *
 * VÌ SAO PHẢI CÓ (lỗi thầy báo 11/09: "tôi không xoá được ca này"):
 * màn Ca thi đã đọc D1, nhưng `xoaCa` và mấy lệnh cùng loại vẫn CHỈ ghi sang
 * Apps Script. Sheet đánh dấu `da_xoa`, D1 không biết gì, và ca xoá rồi vẫn
 * nằm nguyên trên màn hình — bấm xoá bao nhiêu lần cũng vậy.
 *
 * CHỈ `UPDATE`, KHÔNG `INSERT`: ca chưa có trên D1 thì trả `coCa: false` để
 * app biết mà đẩy cả ca sang, chứ tuyệt đối không tự dựng một dòng ca thiếu
 * dữ liệu rồi để màn Ca thi hiện ca rỗng.
 *
 * CHỈ những cột trong bảng dưới mới sửa được. Khoá gói đề, mốc bắt đầu thi,
 * ba số đếm và danh sách lượt KHÔNG nằm trong đây. */
const O_SUA_DUOC: Record<string, string> = {
  trangThai: 'trang_thai',
  tenCa: 'ten_ca',
  xoaLuc: 'xoa_luc',
  hetHanVao: 'het_han_vao',
  congBo: 'cong_bo',
  hanNop: 'han_nop',
  phamVi: 'pham_vi',
}

async function suaCa(env: Env, b: Record<string, unknown>): Promise<Response> {
  const maCa = String(b.maCa ?? '').trim()
  if (!maCa) return ra({ ok: false, error: 'Thiếu mã ca' })
  const dat = (b.dat ?? {}) as Record<string, unknown>
  const cot: string[] = []
  const giaTri: unknown[] = []
  for (const [ten, o] of Object.entries(O_SUA_DUOC)) {
    if (!(ten in dat)) continue
    cot.push(`${o} = ?`)
    giaTri.push(String(dat[ten] ?? ''))
  }
  if (cot.length === 0) return ra({ ok: false, error: 'Không có ô nào để sửa' })

  const co = await env.DB.prepare('SELECT ma_ca FROM ca WHERE ma_ca = ?').bind(maCa).first<{ ma_ca: string }>()
  if (!co) return ra({ ok: true, coCa: false, soO: 0 })

  const nay = new Date().toISOString()
  await env.DB.prepare(`UPDATE ca SET ${cot.join(', ')}, cap_nhat_luc = ? WHERE ma_ca = ?`)
    .bind(...giaTri, nay, maCa)
    .run()

  // KHOÁ CA: NỘP HỘ EM ĐANG LÀM, y như Apps Script làm bên Sheet.
  //
  // LỖI ĐÃ DÍNH, ca thật 704066 tối 11/09: thầy bấm Khoá ca. Apps Script nộp hộ
  // 25 em và ghi `da_nop` lên Sheet; dòng ca bên D1 sang `dong` nhờ lượt soi,
  // nhưng 25 dòng LƯỢT bên D1 vẫn nằm `dang_lam`. Màn Ca thi đếm từ D1 ⇒ hiện
  // 4/29 nộp trong khi thật là 29/29. Sai số liệu còn tệ hơn chậm.
  //
  // KHÔNG đụng `dap_an_json`: đó chính là phần em đã làm, giữ nguyên bản lưu
  // tạm cuối cùng — đúng luật bên Apps Script.
  let soEmBiNop = 0
  if (b.khoaLuot === true) {
    const ghi = String(b.ghiChu ?? '') || `thầy khoá ca ${nay.slice(11, 16)}Z, nộp phần đã làm`
    const r = await env.DB.prepare(
      `UPDATE luot
          SET trang_thai = 'da_nop',
              nop_luc = ?,
              ghi_chu = CASE WHEN ghi_chu IS NULL OR ghi_chu = '' THEN ? ELSE ghi_chu || ' · ' || ? END,
              cap_nhat_luc = ?
        WHERE ma_ca = ? AND trang_thai = 'dang_lam'`,
    )
      .bind(nay, ghi, ghi, nay, maCa)
      .run()
    soEmBiNop = r.meta.changes ?? 0
  }

  return ra({ ok: true, coCa: true, soO: cot.length, soEmBiNop })
}

/** NHẬT KÝ LƯỢT BỊ CHẶN. Không bao giờ ném lỗi ra ngoài: chặn đúng vẫn phải
 * chặn kể cả khi ghi nhật ký hỏng. */
async function ghiChanVao(
  env: Env,
  maCa: string,
  sbd: string,
  hoTenGoi: string,
  namSinhGoi: string,
  lyDo: string,
): Promise<void> {
  const d = await docDanhSach(env, sbd).catch(() => null)
  await env.DB.prepare(
    `INSERT INTO chan_vao (ma_ca, sbd, ho_ten_goi, nam_sinh_goi, ho_ten_ds, nam_sinh_ds, ly_do, luc)
     VALUES (?,?,?,?,?,?,?,?)`,
  )
    .bind(maCa, sbd, hoTenGoi, namSinhGoi, String(d?.ho_ten ?? ''), String(d?.nam_sinh ?? ''), lyDo, new Date().toISOString())
    .run()
}

/** CHI TIẾT MỘT CA — thay `chiTietCa` bên Apps Script (p50 5,1 giây).
 *
 * CỔNG AN TOÀN: chỉ trả `dayDu: true` khi ca có cờ `sinh_tai_d1`. Ca chép sang
 * từ Sheet thiếu điểm và họ tên; máy thầy thấy `dayDu: false` thì đi đường cũ,
 * không hiện một màn Chi tiết ca thiếu điểm cả ca.
 *
 * HỌ TÊN lấy từ `danh_sach` bằng JOIN — không nhân bản một bản tên thứ hai để
 * rồi hai bảng lệch nhau. Lượt nào đã có `ho_ten` riêng (máy thầy ghi lúc chấm)
 * thì tên riêng thắng. */
async function chiTietCaMoi(env: Env, maCa: string): Promise<Response> {
  if (!maCa) return ra({ ok: false, error: 'Thiếu mã ca' })
  const ca = await env.DB.prepare('SELECT * FROM ca WHERE ma_ca = ?').bind(maCa).first<Record<string, unknown>>()
  if (!ca) return ra({ ok: true, coCa: false, dayDu: false })

  const dayDu = Number(ca.sinh_tai_d1 ?? 0) === 1
  const rLuot = await env.DB.prepare(
    `SELECT l.*, COALESCE(NULLIF(l.ho_ten,''), d.ho_ten, '') AS ten_hien
       FROM luot l LEFT JOIN danh_sach d ON d.sbd = l.sbd
      WHERE l.ma_ca = ? ORDER BY l.sbd, l.lan_thu`,
  )
    .bind(maCa)
    .all<Record<string, unknown>>()

  const luot = (rLuot.results ?? []).map((l) => ({
    sbd: String(l.sbd ?? ''),
    hoTen: String(l.ten_hien ?? ''),
    lanThu: Number(l.lan_thu) || 1,
    trangThai: String(l.trang_thai ?? ''),
    vaoLuc: String(l.vao_luc ?? ''),
    hetGioLuc: String(l.het_gio_luc ?? ''),
    nopLuc: String(l.nop_luc ?? ''),
    soLanRoiMan: Number(l.so_lan_roi_man) || 0,
    tongGiayRoiMan: Number(l.tong_giay_roi_man) || 0,
    diemI: l.diem_i === null || l.diem_i === undefined ? null : Number(l.diem_i),
    diemII: l.diem_ii === null || l.diem_ii === undefined ? null : Number(l.diem_ii),
    diemIII: l.diem_iii === null || l.diem_iii === undefined ? null : Number(l.diem_iii),
    tong: l.tong === null || l.tong === undefined ? null : Number(l.tong),
    duyetBoi: String(l.duyet_boi ?? ''),
    duyetLuc: String(l.duyet_luc ?? ''),
    ghiChu: String(l.ghi_chu ?? ''),
    dapAn: doJson(l.dap_an_json),
    integrity: doJson(l.integrity_json),
    giayCau: doJson(l.giay_cau_json),
  }))

  const rCho = await env.DB.prepare(
    `SELECT p.sbd, COALESCE(NULLIF(p.ho_ten,''), d.ho_ten, '') AS ho_ten, p.ghi_luc
       FROM phong_cho p LEFT JOIN danh_sach d ON d.sbd = p.sbd
      WHERE p.ma_ca = ? ORDER BY p.ghi_luc`,
  )
    .bind(maCa)
    .all<Record<string, unknown>>()

  const rChan = await env.DB.prepare('SELECT * FROM chan_vao WHERE ma_ca = ? ORDER BY luc DESC LIMIT 200')
    .bind(maCa)
    .all<Record<string, unknown>>()

  // NGÂN HÀNG CÓ ĐÁP ÁN của ca, nếu lượt chữa lành đã cất. Đường này ĐÒI mã bí
  // mật (xem bảng định tuyến), khác hẳn `GET /de/:maCa` công khai.
  let keyBank: unknown = null
  if (env.DE) {
    const o = await env.DE.get(`key/${maCa}.json`)
    if (o?.body) {
      try {
        keyBank = await new Response(o.body).json()
      } catch {
        keyBank = null
      }
    }
  }

  return ra({
    ok: true,
    coCa: true,
    dayDu,
    keyBank,
    ca: {
      maCa,
      tenCa: String(ca.ten_ca ?? ''),
      lop: String(ca.lop ?? ''),
      trangThai: String(ca.trang_thai ?? 'mo'),
      batDau: String(ca.bat_dau ?? ''),
      hetHanVao: String(ca.het_han_vao ?? ''),
      batDauThiLuc: String(ca.bat_dau_thi_luc ?? ''),
      thoiGianPhut: Number(ca.thoi_gian_phut) || 45,
      loai: String(ca.loai ?? '') === 'baitap' ? 'baitap' : 'thi',
      hanNop: String(ca.han_nop ?? ''),
      congBo: String(ca.cong_bo ?? 'khong'),
      nguongLan: Number(ca.nguong_lan) || 0,
      nguongGiay: Number(ca.nguong_giay) || 0,
      phamVi: String(ca.pham_vi ?? 'tu_do'),
      lenBang: Number(ca.len_bang ?? 1) !== 0,
      giuDeDoc: Number(ca.giu_de_doc ?? 0) === 1,
      anHanGiay: Number(ca.an_han_giay) || 0,
      phongCho: Number(ca.phong_cho ?? 0) === 1,
      xoaLuc: String(ca.xoa_luc ?? ''),
      moLuc: String(ca.mo_luc ?? ''),
    },
    luot,
    dsCho: (rCho.results ?? []).map((x) => ({ sbd: String(x.sbd ?? ''), hoTen: String(x.ho_ten ?? ''), vaoLuc: String(x.ghi_luc ?? '') })),
    biChan: (rChan.results ?? []).map((x) => ({
      luc: String(x.luc ?? ''),
      sbd: String(x.sbd ?? ''),
      hoTenGoi: String(x.ho_ten_goi ?? ''),
      namSinhGoi: String(x.nam_sinh_goi ?? ''),
      hoTenDs: String(x.ho_ten_ds ?? ''),
      namSinhDs: String(x.nam_sinh_ds ?? ''),
      lyDo: String(x.ly_do ?? ''),
    })),
    boTheoEmCa: doJson(ca.bo_theo_em_json),
  })
}

/** GHI ĐIỂM VỀ D1 — soi đúng lượt `ghiDiem` máy thầy vừa ghi lên Sheet.
 *
 * Không có bước này thì D1 mãi mãi thiếu điểm, và màn Chi tiết ca không bao giờ
 * đọc thẳng D1 được cho một ca đã chấm. CHỈ cập nhật, không tạo dòng lượt mới:
 * lượt phải do `/vao-thi` sinh ra. */
async function ghiDiemMoi(env: Env, b: Record<string, unknown>): Promise<Response> {
  const maCa = String(b.maCa ?? '').trim()
  const bai = Array.isArray(b.bai) ? (b.bai as Record<string, unknown>[]) : []
  if (!maCa || bai.length === 0) return ra({ ok: false, error: 'Thiếu mã ca hoặc bài' })
  const nay = new Date().toISOString()
  const cau: D1PreparedStatement[] = []
  for (const x of bai) {
    const sbd = String(x.sbd ?? '').trim()
    if (!sbd) continue
    const d = (x.diem ?? {}) as Record<string, unknown>
    cau.push(
      env.DB.prepare(
        `UPDATE luot SET diem_i = ?, diem_ii = ?, diem_iii = ?, tong = ?,
                         ho_ten = COALESCE(NULLIF(?,''), ho_ten),
                         cap_nhat_luc = ?
          WHERE ma_ca = ? AND sbd = ? AND lan_thu = ?`,
      ).bind(
        soHoacNull(d.I), soHoacNull(d.II), soHoacNull(d.III), soHoacNull(d.tong),
        String(x.hoTen ?? ''), nay, maCa, sbd, Number(x.lanThu) || 1,
      ),
    )
  }
  if (cau.length === 0) return ra({ ok: false, error: 'Không có dòng nào hợp lệ' })
  for (let i = 0; i < cau.length; i += 200) await env.DB.batch(cau.slice(i, i + 200))
  return ra({ ok: true, soDong: cau.length })
}

function soHoacNull(v: unknown): number | null {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function doJson(v: unknown): unknown {
  const t = String(v ?? '')
  if (!t) return null
  try {
    return JSON.parse(t)
  } catch {
    return null
  }
}

/** DANH SÁCH HỌC SINH + TÓM TẮT CA GẦN NHẤT — thay `danhSachEm` bên Apps Script.
 *
 * VÌ SAO: màn Học sinh bên máy thầy quá 25 giây rồi báo đỏ "Máy chủ không trả
 * lời", và ngay dưới là dòng "Chưa em nào có tên trong danh sách" — thầy nhìn
 * tưởng mất sạch dữ liệu. Thấy thật tối 11/09, giữa lúc ca 704066 đang chạy
 * bình thường.
 *
 * `diemGanNhat` và `caGanNhat` lấy từ LƯỢT MỚI NHẤT CÓ ĐIỂM của em. Em chưa ca
 * nào chấm xong thì để `null` — KHÔNG đoán, không lấy tạm điểm của ca khác. */
async function danhSachEmMoi(env: Env): Promise<Response> {
  const r = await env.DB.prepare(
    `SELECT d.sbd, d.ho_ten, d.nam_sinh, d.lop,
            (SELECT COUNT(*) FROM luot l WHERE l.sbd = d.sbd AND l.ma_ca <> 'DOTAI') AS so_ca,
            g.tong AS diem_gan_nhat, g.ma_ca AS ca_gan_nhat, g.nop_luc AS nop_gan_nhat
       FROM danh_sach d
       LEFT JOIN (
         SELECT l1.sbd, l1.tong, l1.ma_ca, l1.nop_luc
           FROM luot l1
           JOIN (SELECT sbd, MAX(nop_luc) AS m FROM luot
                  WHERE tong IS NOT NULL AND ma_ca <> 'DOTAI' GROUP BY sbd) x
             ON x.sbd = l1.sbd AND x.m = l1.nop_luc
       ) g ON g.sbd = d.sbd
      ORDER BY d.lop, d.ho_ten`,
  ).all<Record<string, unknown>>()

  const items = (r.results ?? []).map((v) => ({
    sbd: String(v.sbd ?? ''),
    hoTen: String(v.ho_ten ?? ''),
    namSinh: String(v.nam_sinh ?? ''),
    lop: String(v.lop ?? ''),
    trangThai: '',
    soCa: Number(v.so_ca) || 0,
    diemGanNhat: v.diem_gan_nhat === null || v.diem_gan_nhat === undefined ? null : Number(v.diem_gan_nhat),
    caGanNhat: String(v.ca_gan_nhat ?? ''),
    nopGanNhat: String(v.nop_gan_nhat ?? ''),
  }))
  return ra({ ok: true, items, dem: items.length })
}

/** NẠP ĐỦ MỘT CA TỪ APPS SCRIPT — TỰ CHỮA LÀNH.
 *
 * VÌ SAO CẦN, đo thật 19h05 ngày 11/09 ngay sau khi phát hành đợt 5D:
 *
 *     SELECT COUNT(*), SUM(sinh_tai_d1) FROM ca   →  88 ca, 0 ca có cờ
 *     SELECT COUNT(tong), COUNT(ho_ten) FROM luot →  311 lượt, 0 điểm, 0 tên
 *
 * Cờ `sinh_tai_d1` chỉ được đặt cho ca MỞ TỪ NAY. Mọi ca đã có đều không cờ,
 * nên `chiTietCaMoi` trả `dayDu: false` cho tất cả và máy thầy rơi về Apps
 * Script — **đường nhanh chưa từng chạy một lần nào**. Thầy bấm chi tiết ca
 * vẫn mất 7 giây, đúng như trước.
 *
 * Chữa mà KHÔNG cần một lượt chuyển dữ liệu 88 ca (lượt ấy đã chết ở ca thứ 6
 * hôm nay): máy thầy vừa đi đường cũ xong là đã CẦM trong tay gói đầy đủ của ca
 * ấy — điểm, họ tên, ghi chú. Gửi luôn sang đây rồi đặt cờ. Lần sau thầy mở
 * chính ca đó là tức thì. Ca nào thầy không bao giờ mở thì cũng không cần nhanh.
 *
 * CHỈ NHẬN CA ĐÃ ĐÓNG. Ca đang chạy là trường hợp DUY NHẤT D1 mới hơn Sheet —
 * lượt vào thi sinh ra ở đây, Sheet phải đợi lượt nộp. Chép đè lúc ấy là xoá
 * mất bài của em đang làm. */
async function napDayDuCa(env: Env, b: Record<string, unknown>): Promise<Response> {
  const maCa = String(b.maCa ?? '').trim()
  if (!maCa) return ra({ ok: false, error: 'Thiếu mã ca' })

  const ca = await env.DB.prepare('SELECT trang_thai, bat_dau_thi_luc, bat_dau, thoi_gian_phut FROM ca WHERE ma_ca = ?')
    .bind(maCa)
    .first<{ trang_thai: string; bat_dau_thi_luc: string | null; bat_dau: string | null; thoi_gian_phut: number | null }>()
  if (!ca) return ra({ ok: true, coCa: false, daDat: false })
  if (caDangChay(ca)) {
    return ra({ ok: true, coCa: true, daDat: false, lyDo: 'ca_dang_chay' })
  }

  const ds = Array.isArray(b.luot) ? (b.luot as Record<string, unknown>[]) : []
  const nay = new Date().toISOString()
  const cau: D1PreparedStatement[] = []
  for (const l of ds) {
    const sbd = String(l.sbd ?? '').trim()
    if (!sbd) continue
    const lanThu = Number(l.lanThu) || 1
    cau.push(
      env.DB.prepare(
        `INSERT INTO luot (khoa, ma_ca, sbd, lan_thu, vao_luc, het_gio_luc, nop_luc, trang_thai,
                           so_lan_roi_man, tong_giay_roi_man, ghi_chu, ho_ten,
                           diem_i, diem_ii, diem_iii, tong, duyet_boi, duyet_luc,
                           cap_nhat_luc, da_day_sheet)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0)
         ON CONFLICT(khoa) DO UPDATE SET
           het_gio_luc=COALESCE(NULLIF(excluded.het_gio_luc,''), luot.het_gio_luc),
           nop_luc=COALESCE(NULLIF(excluded.nop_luc,''), luot.nop_luc),
           trang_thai=excluded.trang_thai,
           so_lan_roi_man=MAX(excluded.so_lan_roi_man, luot.so_lan_roi_man),
           tong_giay_roi_man=MAX(excluded.tong_giay_roi_man, luot.tong_giay_roi_man),
           ghi_chu=COALESCE(NULLIF(excluded.ghi_chu,''), luot.ghi_chu),
           ho_ten=COALESCE(NULLIF(excluded.ho_ten,''), luot.ho_ten),
           diem_i=COALESCE(excluded.diem_i, luot.diem_i),
           diem_ii=COALESCE(excluded.diem_ii, luot.diem_ii),
           diem_iii=COALESCE(excluded.diem_iii, luot.diem_iii),
           tong=COALESCE(excluded.tong, luot.tong),
           duyet_boi=COALESCE(NULLIF(excluded.duyet_boi,''), luot.duyet_boi),
           duyet_luc=COALESCE(NULLIF(excluded.duyet_luc,''), luot.duyet_luc),
           cap_nhat_luc=excluded.cap_nhat_luc`,
      ).bind(
        `${maCa}|${sbd}|${lanThu}`, maCa, sbd, lanThu,
        String(l.vaoLuc ?? '') || nay, String(l.hetGioLuc ?? ''), String(l.nopLuc ?? ''),
        String(l.trangThai ?? 'da_nop'), Number(l.soLanRoiMan) || 0, Number(l.tongGiayRoiMan) || 0,
        String(l.ghiChu ?? ''), String(l.hoTen ?? ''),
        soHoacNull(l.diemI), soHoacNull(l.diemII), soHoacNull(l.diemIII), soHoacNull(l.tong),
        String(l.duyetBoi ?? ''), String(l.duyetLuc ?? ''), nay,
      ),
    )
  }
  // KHÔNG đụng `dap_an_json`, `giay_cau_json`, `integrity_json`: bản trên D1 là
  // bản máy em ghi thẳng, đầy đủ hơn bản chép vòng qua Sheet.
  //
  // VÀ TUYỆT ĐỐI KHÔNG ĐỤNG `da_day_sheet`.
  //
  // Bản đầu của hàm này đặt `da_day_sheet = 1`, với lý lẽ "dòng này đọc từ
  // Sheet ra thì hiển nhiên đã có trên Sheet". Lý lẽ ấy SAI ở đúng một chỗ, và
  // chỗ ấy là chỗ chết người: cờ này không nói dòng có trên Sheet hay không, nó
  // nói **lượt đồng bộ ngược đã đưa bài của em về Sheet chưa**. Đặt bừa thành 1
  // là `dong-bo-nguoc.ts` bỏ qua lượt ấy VĨNH VIỄN — em nộp bài, bài nằm yên
  // trong D1, Sheet không bao giờ nhận, và em bấm xem điểm thì nghe "chưa nộp
  // bài ca này". Điểm mất khỏi đường ra Excel và đường gửi Zalo.
  //
  // Cờ ấy chỉ có HAI nơi được phép đặt: `/nop` đặt về 0 khi em nộp, và `/da-day`
  // đặt lên 1 sau khi Apps Script XÁC NHẬN đã nhận. Lượt chữa lành không phải
  // một trong hai.
  for (let i = 0; i < cau.length; i += 200) await env.DB.batch(cau.slice(i, i + 200))

  // NGÂN HÀNG CÓ ĐÁP ÁN — cất sau khoá RIÊNG, chỉ mở bằng mã bí mật.
  //
  // VÌ SAO PHẢI CÓ, lỗi 19h45 ngày 11/09: màn Chi tiết ca gọi
  // `chiTietCa(..., xinKeyBank = !banksCu)`. Điện thoại thầy không có sẵn ngân
  // hàng của ca cũ nên `xinKeyBank` luôn `true`, mà đường nhanh lại đứng sau
  // `if (!xinKeyBank)` — tức đường nhanh bị bỏ qua VĨNH VIỄN trên điện thoại,
  // dù D1 có đủ dữ liệu hay không.
  //
  // Khoá `key/<maCa>.json` KHÔNG dùng chung với `de/<maCa>.json`. Cái sau phục
  // vụ công khai cho máy em ở `GET /de/:maCa` và TUYỆT ĐỐI không được có đáp án.
  if (b.keyBank && env.DE) {
    await env.DE.put(`key/${maCa}.json`, JSON.stringify(b.keyBank))
  }

  await env.DB.prepare('UPDATE ca SET sinh_tai_d1 = 1, cap_nhat_luc = ? WHERE ma_ca = ?').bind(nay, maCa).run()
  return ra({ ok: true, coCa: true, daDat: true, soLuot: cau.length, coKey: !!(b.keyBank && env.DE) })
}

/** Ca xong rồi bao lâu thì chắc chắn không ai còn làm bài. Rộng tay: thầy có
 * thể mở khoá cho một em làm nốt sau giờ. */
const DEM_SAU_CA_PHUT = 30

/** CA NÀY CÓ ĐANG CHẠY KHÔNG — tính bằng ĐỒNG HỒ, không tin cái nhãn.
 *
 * LỖI ĐÃ DÍNH, 19h45 ngày 11/09: cửa cũ chặn theo `trang_thai = 'mo'`. Nhưng
 * kho ca của thầy có **12 ca vẫn mang nhãn `mo`** từ mấy hôm trước, chưa bao
 * giờ được đóng. Chúng không hề đang chạy, mà nhãn thì vẫn `mo` — nên không ca
 * nào trong số ấy được chữa lành, và thầy bấm vào lần thứ hai vẫn 7 giây.
 *
 * Nhãn `mo` nói ca chưa bị đóng. Nó KHÔNG nói có ai đang làm bài. Thứ nói được
 * điều đó là đồng hồ: chưa bấm Bắt đầu thì chưa ai làm; bấm rồi thì hết giờ
 * cộng thêm ${DEM_SAU_CA_PHUT} phút là xong. */
function caDangChay(ca: { trang_thai: string; bat_dau_thi_luc: string | null; bat_dau: string | null; thoi_gian_phut: number | null }): boolean {
  if (String(ca.trang_thai) !== 'mo') return false
  const bd = mocMs(String(ca.bat_dau_thi_luc ?? ''))
  // Ca mở nhưng CHƯA bấm Bắt đầu: không ai làm bài, nhưng cũng đừng đụng vào —
  // thầy sắp bấm tới nơi.
  if (!bd) return true
  const phut = Number(ca.thoi_gian_phut) || 45
  return Date.now() < bd + (phut + DEM_SAU_CA_PHUT) * 60000
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
    if (p === '/ca/sua') return suaCa(env, b)
    if (p === '/ca/chi-tiet') return chiTietCaMoi(env, String(b.maCa ?? ''))
    if (p === '/diem') return ghiDiemMoi(env, b)
    if (p === '/em/danh-sach') return danhSachEmMoi(env)
    if (p === '/ca/nap-day-du') return napDayDuCa(env, b)
    if (p === '/dong-bo/dau') return ghiDauDongBo(env, b)
    if (p === '/cho') return xemPhongCho(env, String(b.maCa ?? ''))

    return ra({ ok: false, error: 'Không có đường này' }, 404)
  },
}
