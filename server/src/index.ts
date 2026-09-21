import {homeworkQuestions,homeworkKeys,gradeHomework} from './btvn-grading'
import {chuBaoBoTuLuan,laMaDeTuLuan,locCauRutDuoc} from '../../src/lib/cau-tu-luan'
import {qidTuLuanCuaTo} from './cam-tu-luan'
import {ghiSuKien,ghiSuKienThi,ghiSuKienLoBtvn,ngayVn,type LuotThi} from './su-kien-hoc'
import {napLaiSuKien,kiemCheoSuKien,type NguonNapLai} from './su-kien-nap-lai'
import {dungLaiHoSo,docHoSoEm,docDoPhuDang} from './ho-so-nam-kt'
import {hsThoiGianHoc,chayCaLop} from './ke-hoach-ngay-d1'
import {chayResetNeuDenGio,chayTiepTay,dangLamMoi,docMocReset,doGioiHanTruyVan,maDaDung,maDaDungTrong,resetDryRun,LOI_DANG_LAM_MOI} from './reset-toan-app'
import {hsKeHoachNgayCoExp,expNhanSauNop,chotExpNgayQua} from './exp-d1'
import {doanMoCho} from './game-v2-doan'
import {hsCauTheoQid,docDoPhuPhucVu} from './cau-theo-qid'
import {hsOnLaiNop} from './on-lai-nop'
import {hoSoOnCa} from './ho-so-on-ca'
import {notifications,deliverNotices} from './notifications'
import {canhBaoChoEm,emXemCanhBao,guiCanhBao} from './canh-bao-thay'
import {gvNhacTuDong,nhacTuDong} from './nhac-tu-dong'
import {gvCanGiup,gvChuaNop,gvEmToanCanh,gvTimEm,gvVinhDanhNgay} from './gv-hom-nay-v2'
import {docBangTenLop,gvDoiLopEm,gvLop,tenLopCuaEm} from './ten-lop'
import {dailyHonors} from './honors'
import {teacherNews,recordPresence} from './teacher-news'
import {parentNews,refreshDailyNews} from './parent-news'
import {phCanhBaoXem,phCapMa,phDemTruyCap,phKeHoach,phThoiGianHoc,phXacDinh} from './ph-truy-cap'
import {homNayThay} from './hom-nay-thay'
import {gvKeHoachEm} from './gv-ke-hoach-em'
import {docPhutCaDaThem,phutKhongHaSauKhiThem,themPhutCa} from './them-phut'
import {doiTenHocSinh} from './doi-ten-hoc-sinh'
import { mom } from './mom'
import { luyenDe } from './luyen-de'
import {adminGame,parentGame} from './game-v2-reports'
import { gameV2 } from './game-v2'
import { gameToken, gameIdentity } from './game-v2-auth'
import { phanTichGianLanBtvn, type ThiThatBaseline, type ThongTinHocSinhBtvn } from './gian-lan-btvn'
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
import * as G from './goi-cu'
import * as ND from './btvn-nang-do-d1'
import * as AI from './bo-nao'
import {themTenDangDemQua,themTenDangNhatKy} from './ten-dang-bo-nao'
import {docLoiNhanHlv} from './bo-nao-doc'
import * as VD from './vo-dai'
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

/** CỔNG PHẠM VI CỦA CA — ai được vào ca này.
 *
 * LỖ HỔNG ĐÃ CÓ THẬT cho tới 12/09: Worker chỉ kiểm danh sách lớp, không kiểm
 * phạm vi. Ca thầy mở ở chế độ "chọn từng em" hay "theo khối" thì BẤT KỲ em nào
 * có mã ca và có tên trong danh sách lớp đều vào thi được — cổng nằm bên Apps
 * Script, và Apps Script thì vừa bị cắt.
 *
 * Bốn phạm vi, đúng như màn Mở ca:
 *   · tu_do  — ai có mã ca đều vào (cổng duy nhất là danh sách lớp);
 *   · sbd    — cũng vậy: cổng của nó CHÍNH LÀ danh sách lớp;
 *   · khoi   — năm sinh của em phải khớp năm sinh thầy chọn;
 *   · chon   — số báo danh phải nằm trong danh sách thầy đã tích.
 *
 * THIẾU DỮ LIỆU THÌ KHÔNG CHẶN. Ca `chon` mà bảng chọn rỗng nghĩa là lượt đẩy
 * ca thiếu trường, không phải "thầy không cho em nào vào" — chặn cả lớp vì một
 * trường thiếu là hỏng nặng hơn hẳn việc thiếu cổng. */
export function hopPhamVi(
  ca: { pham_vi?: unknown; danh_sach_chon_json?: unknown },
  em: { nam_sinh?: unknown } | null,
  sbd: string,
): { ok: true } | { ok: false; lyDo: 'khong_thuoc_khoi' | 'khong_trong_danh_sach'; namSinh?: string } {
  const pv = String(ca.pham_vi ?? '').trim() || 'tu_do'
  if (pv !== 'khoi' && pv !== 'chon') return { ok: true }

  const goc = ca.danh_sach_chon_json
  let chon: unknown = null
  if (typeof goc === 'string' && goc.trim() !== '') {
    try {
      chon = JSON.parse(goc)
    } catch {
      chon = null
    }
  }

  if (pv === 'khoi') {
    const nam = String(chon ?? '').trim()
    if (!/^\d{4}$/.test(nam)) return { ok: true }
    const cuaEm = String(em?.nam_sinh ?? '').trim()
    // Em chưa có năm sinh trong danh sách lớp ⇒ KHÔNG chặn: thiếu dữ liệu là
    // lỗi của hồ sơ, và chặn ở đây thì em đứng ngoài cửa mà không ai sửa kịp.
    if (!cuaEm) return { ok: true }
    return cuaEm === nam ? { ok: true } : { ok: false, lyDo: 'khong_thuoc_khoi', namSinh: nam }
  }

  const ds = Array.isArray(chon) ? chon.map((x) => String(x).trim()).filter(Boolean) : []
  if (ds.length === 0) return { ok: true }
  return ds.includes(sbd) ? { ok: true } : { ok: false, lyDo: 'khong_trong_danh_sach' }
}

/** CẮT GÓI ĐỀ RIÊNG XUỐNG CÒN PHẦN CỦA MỘT EM.
 *
 * Gói thầy đẩy lên có dạng `{ bo, lap, dem, bb }`, mỗi bản đồ khoá theo số báo
 * danh của CẢ LỚP. Máy em chỉ cần phần của chính nó — gửi cả lớp là đưa đề của
 * bạn vào gói em nhận.
 *
 * Trả `null` khi ca có bản đồ mà KHÔNG có phần của em: chỗ gọi phải từ chối cho
 * vào, vì phát đề cắt theo luật khác với bảng chấm của thầy là điểm sai lặng lẽ.
 * Gói dạng cũ (bản đồ phẳng `sbd → qid[]`) cũng đọc được. */
export function locGoiDeRiengChoEm(goi: Record<string, unknown> | null, sbd: string): Record<string, unknown> | null {
  if (!goi) return null
  const doiTuong = (v: unknown): Record<string, unknown> =>
    v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}

  // Dạng mới nhận ra bằng khoá `bo` là đối tượng; số báo danh toàn chữ số nên
  // không bao giờ đụng tên khoá này.
  const moi = goi.bo && typeof goi.bo === 'object' && !Array.isArray(goi.bo)
  const bo = moi ? doiTuong(goi.bo) : goi
  const cua = bo[sbd]
  if (!Array.isArray(cua) || cua.length === 0) return null
  if (!moi) return { [sbd]: cua }

  const lap = doiTuong(goi.lap)[sbd]
  const dem = doiTuong(goi.dem)[sbd]
  return {
    bo: { [sbd]: cua },
    lap: Array.isArray(lap) ? { [sbd]: lap } : {},
    dem: dem && typeof dem === 'object' ? { [sbd]: dem } : {},
    // BIÊN BẢN là ghi chép của THẦY về cả lớp — không đi xuống máy em.
    bb: null,
  }
}

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

  // CỔNG PHẠM VI, ngay sau cổng danh sách lớp. Ca đo tải được miễn như trên.
  if (maCa !== CA_DO_TAI && ca) {
    const em = await docDanhSach(env, sbd)
    const pv = hopPhamVi(ca as unknown as { pham_vi?: unknown; danh_sach_chon_json?: unknown }, em, sbd)
    if (!pv.ok) {
      await ghiChanVao(env, maCa, sbd, String(b.hoTen ?? ''), String(b.namSinh ?? ''), pv.lyDo).catch(() => {})
      return ra({ ok: false, lyDo: pv.lyDo, namSinh: pv.namSinh ?? '', thoiGianPhut: ca.thoi_gian_phut ?? 45 })
    }
  }

  // CỔNG MẬT KHẨU CA THI (nếu ca đặt mật khẩu)
  const matKhauCa = String(ca?.mat_khau ?? '').trim()
  if (matKhauCa) {
    const nhapMatKhau = String(b.matKhauCa ?? b.matKhau ?? '').trim()
    if (nhapMatKhau !== matKhauCa && nhapMatKhau.toLowerCase() !== matKhauCa.toLowerCase()) {
      return ra({ ok: false, lyDo: 'sai_mat_khau_ca', error: 'Mật khẩu ca thi không chính xác' })
    }
  }

  const cu = await docLuotMoiNhat(env, maCa, sbd)
  const now = Date.now()
  const qd = quyetDinhVaoThi(ca, cu, idThietBi, now)
  if (!qd.ok || !ca) {
    // BA MỐC GIỜ ĐI KÈM LÝ DO. Màn của em nói "đã nộp lúc 9h12", "ca bắt đầu
    // lúc 9h00", "hết hạn vào lúc 9h15" — thiếu ba trường này thì em chỉ đọc
    // được một câu cụt và gọi Thầy giữa giờ thi.
    return ra({
      ok: false,
      lyDo: qd.lyDo,
      lanThu: qd.lanThu,
      thoiGianPhut: ca?.thoi_gian_phut ?? 45,
      nopLuc: qd.lyDo === 'da_nop' ? (cu?.nop_luc ?? '') : '',
      batDau: ca?.bat_dau ?? '',
      hetHanVao: ca?.het_han_vao ?? '',
    })
  }

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
      chiNop3PhutCuoi: Number((ca as any).chi_nop_3_phut_cuoi ?? 0) === 1,
    })
  }

  // ĐỀ RIÊNG: CHỈ ĐƯA PHẦN CỦA CHÍNH EM, và thiếu thì KHÔNG cho vào.
  //
  // Hai lỗi được chặn ở đây, cả hai đều từng có thật:
  //   · bản trước trả NGUYÊN bản đồ của cả lớp cho từng em — đề của bạn nằm
  //     trong gói máy em nhận;
  //   · ca đề riêng mà bản đồ thiếu phần của em thì máy em cắt đề theo luật
  //     hash, còn máy thầy chấm theo bản đồ ⇒ điểm sai LẶNG LẼ (em 12124 tụt
  //     5,69 xuống 2,56 hôm 10/09). Trước 12/09 chỗ này lùi về Apps Script;
  //     Apps Script đã cắt, nên nay phải TỪ CHỐI hẳn thay vì phát đề sai.
  const goiGoc = ca.bo_theo_em_json ? (JSON.parse(String(ca.bo_theo_em_json)) as Record<string, unknown>) : null
  const goiRieng = locGoiDeRiengChoEm(goiGoc, sbd)
  if (Number(ca.de_rieng ?? 0) === 1 && goiGoc && !goiRieng) {
    await ghiChanVao(env, maCa, sbd, String(b.hoTen ?? ''), String(b.namSinh ?? ''), 'thieu_bo_cau').catch(() => {})
    return ra({ ok: false, lyDo: 'thieu_bo_cau', thoiGianPhut: ca.thoi_gian_phut ?? 45 })
  }

  const lanThu = qd.lanThu ?? 1
  const khoa = khoaLuot(maCa, sbd, lanThu)
  const vaoLuc = qd.cach === 'khoi_phuc' && cu ? cu.vao_luc : new Date(now).toISOString()
  const hetGio = qd.cach === 'khoi_phuc' && cu ? cu.het_gio_luc || '' : mocHetGio(ca, now)

  // MỘT câu ghi, nguyên tử theo dòng. Không khoá toàn cục, nên 50 em vào cùng
  // lúc là 50 dòng khác nhau, không ai chờ ai.
  //
  // LƯỢT ĐƯỢC DUYỆT THI LẠI đã có sẵn dòng ở trạng thái chờ, nên nhánh xung đột
  // phải ĐỔI CẢ TRẠNG THÁI VÀ ĐỒNG HỒ. Chỉ cập nhật mã máy như bản trước thì
  // dòng ấy nằm mãi ở `duoc_duyet_lai`: em làm bài mà `/luu-tam` và `/nop` không
  // tìm ra lượt đang làm, bài rơi vào khoảng không.
  await env.DB.prepare(
    `INSERT INTO luot (khoa, ma_ca, sbd, lan_thu, id_thiet_bi, vao_luc, het_gio_luc, trang_thai, cap_nhat_luc)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'dang_lam', ?)
     ON CONFLICT(khoa) DO UPDATE SET
       id_thiet_bi = excluded.id_thiet_bi,
       trang_thai = CASE WHEN luot.trang_thai = 'duoc_duyet_lai' THEN 'dang_lam' ELSE luot.trang_thai END,
       vao_luc = CASE WHEN luot.trang_thai = 'duoc_duyet_lai' THEN excluded.vao_luc ELSE luot.vao_luc END,
       het_gio_luc = CASE WHEN luot.trang_thai = 'duoc_duyet_lai' THEN excluded.het_gio_luc ELSE luot.het_gio_luc END,
       cap_nhat_luc = excluded.cap_nhat_luc`,
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
    boTheoEm: goiRieng,
    // KHÔNG trả gói đề trong thân: máy em tải riêng từ /de/:maCa, qua bộ đệm biên.
    deUrl: ca.bank_r2 ? `/de/${encodeURIComponent(maCa)}` : null,
    chiNop3PhutCuoi: Number((ca as any).chi_nop_3_phut_cuoi ?? 0) === 1,
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

  const maCa = String(b.maCa ?? '').trim()
  if (maCa && !integrity.blocked) {
    const ca = await docCa(env, maCa)
    if (ca && Number((ca as any).chi_nop_3_phut_cuoi ?? 0) === 1) {
      const luot = await env.DB.prepare(`SELECT het_gio_luc FROM luot WHERE ${dk.sql}`).bind(...dk.tham).first<{ het_gio_luc?: string }>()
      if (luot?.het_gio_luc) {
        const hetGio = new Date(luot.het_gio_luc).getTime()
        const conLaiGiay = Math.round((hetGio - Date.now()) / 1000)
        // Chỉ nộp trong 1 phút cuối (60 giây), cộng 10 giây độ trễ mạng
        if (conLaiGiay > 70) {
          return ra({ ok: false, lyDo: 'chua_den_1_phut_cuoi', error: 'Chỉ được nộp bài trong 1 phút cuối của ca thi' }, 400)
        }
      }
    }
  }

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
      return ra({ ok: true, daNhan: true, nopLuc: da.nop_luc, ...(await congBoSauNop(env, b)) })
    }
    return ra({ ok: false, lyDo: 'khong_tim_thay' })
  }
  return ra({ ok: true, nopLuc, ...(await congBoSauNop(env, b)) })
}

/** ĐÁP ÁN TRẢ NGAY SAU KHI EM NỘP — chỗ CUỐI CÙNG buộc máy em phải gọi Apps
 * Script.
 *
 * Trước đợt này, `submitAnswers` cất bài vào D1 rồi VẪN gọi Apps Script, chỉ vì
 * `keyBank` và cờ `congBo` do bên ấy trả. Nghĩa là mỗi lượt nộp của mỗi em vẫn
 * là một lượt vào cái cửa xếp hàng theo khoá toàn cục — đúng chỗ treo mà cả đợt
 * chuyển máy chủ sinh ra để bỏ.
 *
 * Nay ngân hàng CÓ đáp án được cất lên R2 `key/<maCa>.json` ngay lúc mở ca, nên
 * Worker tự trả được.
 *
 * BA LUẬT:
 *   1. Ca `cong_bo = 'khong'` ⇒ KHÔNG trả gì. Em không được thấy đáp án.
 *   2. Ca `ca_lop_xong` ⇒ cũng không trả ngay; màn hỏi lại sau bằng đường khác.
 *   3. Chưa cất được ngân hàng ⇒ trả `congBo` nhưng `keyBank: null`. Chỗ gọi
 *      thấy thiếu thì tự đi đường cũ — thà chậm còn hơn em nộp xong nhìn màn
 *      trắng. */
async function congBoSauNop(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = String(b.maCa ?? '').trim()
  if (!maCa) return {}
  const ca = await docCa(env, maCa)
  const congBo = String(ca?.cong_bo ?? 'khong')
  if (congBo !== 'ngay') return { congBo }
  if (!env.DE) return { congBo, keyBank: null }
  const o = await env.DE.get(`key/${maCa}.json`)
  if (!o?.body) return { congBo, keyBank: null }
  try {
    return { congBo, keyBank: await new Response(o.body).json() }
  } catch {
    return { congBo, keyBank: null }
  }
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
  const ghi = env.DB.prepare(
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
  // HẠN HIỆN HÀNH của lượt đang làm (thầy có thể đã THÊM PHÚT, docs/hop-dong-them-phut-2109.md): máy em đọc `hetGioLuc` ở nhịp này và chỉ nhận khi MUỘN hơn hạn đang giữ.
  // Cùng một lượt gọi D1 (batch) với câu ghi, nên nhịp nóng nhất không thêm một vòng đi-về. Vắng khi không có `maCa`, không có lượt đang làm, hoặc lượt chưa có hạn.
  const maCa = String(b.maCa ?? '').trim()
  if (!maCa) {
    await ghi.run()
    return ra({ ok: true })
  }
  const kq = await env.DB.batch([
    ghi,
    env.DB.prepare(`SELECT het_gio_luc FROM luot WHERE ma_ca = ? AND sbd = ? AND trang_thai = 'dang_lam' ORDER BY lan_thu DESC LIMIT 1`).bind(maCa, sbd),
  ])
  const han = String((kq[1]?.results?.[0] as { het_gio_luc?: string } | undefined)?.het_gio_luc ?? '').trim()
  return ra(han ? { ok: true, hetGioLuc: han } : { ok: true })
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
  // Gói đề có thể được nối thêm câu khi mở ca đề riêng ⇒ revalidate với etag
  return new Response(o.body, {
    headers: { ...JSON_HEADERS, 'cache-control': 'no-cache, must-revalidate', etag: o.httpEtag },
  })
}

// ------------------------------------------------------------------- THẦY

async function dayCa(env: Env, b: Record<string, unknown>): Promise<Response> {
  const ca = b.ca as Record<string, unknown>
  const maCa = String(ca?.maCa ?? '').trim()
  if (!maCa) return ra({ ok: false, error: 'Thiếu mã ca' })
  // Mã ca ĐÃ TỪNG DÙNG (tập nạp lúc reset 21/09) mà không còn trong bảng `ca`: từ chối, để máy em không "khôi phục" bài của ca cũ vào ca mới trùng mã.
  if ((await maDaDung(env, 'ca', maCa)) && !(await docCa(env, maCa))) return ra({ ok: false, error: 'Mã ca đã từng dùng, tạo lại với mã khác', maCaDaDung: true })

  let bankKey: string | null = null
  if (b.bank) {
    if (!env.DE) return ra({ ok: false, error: 'Chưa nối R2 — chưa đẩy gói đề được' }, 500)
    bankKey = `de/${maCa}.json`
    await env.DE.put(bankKey, JSON.stringify(b.bank))
  }
  // NGÂN HÀNG CÓ ĐÁP ÁN — khoá RIÊNG, để `/nop` trả ngay cho em khi ca công bố
  // điểm. Đây là thứ gỡ nốt lượt gọi Apps Script cuối cùng khỏi đường của em.
  //
  // `key/` KHÔNG BAO GIỜ đi ra đường công khai `GET /de/:maCa`. Hai khoá khác
  // nhau, và chỉ `de/` được phục vụ công khai.
  if (b.keyBank && env.DE) await env.DE.put(`key/${maCa}.json`, JSON.stringify(b.keyBank))

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

  // Ca ĐÃ được thêm phút (`/ca/them-phut`): đẩy lại ca không được hạ `thoi_gian_phut` xuống dưới giá trị hiện có.
  const phutDaThem = await docPhutCaDaThem(env, [maCa])
  await env.DB.prepare(
    `INSERT INTO ca (ma_ca, ten_ca, trang_thai, bat_dau, het_han_vao, thoi_gian_phut, loai, han_nop,
                     cong_bo, nguong_lan, nguong_giay, bank_r2, so_cau_json, bo_theo_em_json, cap_nhat_luc,
                     lop, phong_cho, bat_dau_thi_luc, giu_de_doc, an_han_giay,
                     pham_vi, len_bang, de_rieng, pham_vi_hoi_lai, danh_sach_chon_json,
                     mat_khau, chi_nop_3_phut_cuoi, dong_bo_gio, sinh_tai_d1)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)
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
       bank_r2=COALESCE(excluded.bank_r2, ca.bank_r2),
       -- BỐN CỜ CHUYỂN TỪ SHEET SANG (12/09). Cùng luật với tên ca: rỗng không
       -- ghi đè, vì lượt đẩy lại giữa giờ vẫn có thể thiếu trường.
       pham_vi=COALESCE(NULLIF(excluded.pham_vi,''), ca.pham_vi),
       len_bang=excluded.len_bang,
       de_rieng=excluded.de_rieng,
       pham_vi_hoi_lai=COALESCE(NULLIF(excluded.pham_vi_hoi_lai,''), ca.pham_vi_hoi_lai),
       danh_sach_chon_json=COALESCE(excluded.danh_sach_chon_json, ca.danh_sach_chon_json),
       mat_khau=COALESCE(NULLIF(excluded.mat_khau,''), ca.mat_khau),
       chi_nop_3_phut_cuoi=excluded.chi_nop_3_phut_cuoi,
       dong_bo_gio=CASE WHEN ca.bat_dau_thi_luc IS NULL OR ca.bat_dau_thi_luc = '' THEN excluded.dong_bo_gio ELSE ca.dong_bo_gio END`,
  )
    .bind(
      maCa, String(ca.tenCa ?? ''), String(ca.trangThai ?? 'mo'), String(ca.batDau ?? ''),
      String(ca.hetHanVao ?? ''), phutKhongHaSauKhiThem(Number(ca.thoiGianPhut) || 45, phutDaThem.get(maCa)), String(ca.loai ?? 'thi'),
      String(ca.hanNop ?? ''), String(ca.congBo ?? 'khong'), Number(ca.nguongLan) || 3,
      Number(ca.nguongGiay) || 10, bankKey, ca.soCau ? JSON.stringify(ca.soCau) : null,
      ca.boTheoEm ? JSON.stringify(ca.boTheoEm) : null, new Date().toISOString(),
      String(ca.lop ?? ''), ca.phongCho || ca.dongBoGio === true ? 1 : 0, String(ca.batDauThiLuc ?? '') || null,
      ca.giuDeDoc ? 1 : 0, Number(ca.anHanGiay) || 0,
      String(ca.phamVi ?? ''), ca.lenBang === false ? 0 : 1, ca.deRieng === true ? 1 : 0,
      String(ca.phamViHoiLai ?? ''),
      ca.danhSachMoi === undefined || ca.danhSachMoi === '' ? null : JSON.stringify(ca.danhSachMoi),
      String(ca.matKhau ?? '') || null,
      ca.chiNop3PhutCuoi ? 1 : 0,
      ca.dongBoGio === true ? 1 : 0,
    )
    .run()
  return ra({ ok: true, maCa, coDe: !!bankKey })
}

/** Thầy bấm BẮT ĐẦU THI — cả lớp nhận đề đúng một thời điểm. */
async function batDauThi(env: Env, maCa: string, dongBoGio?: unknown): Promise<Response> {
  if (!maCa) return ra({ ok: false, error: 'Thiếu mã ca' })
  const ca = await docCa(env, maCa)
  if (!ca) return ra({ ok: false, error: 'Không tìm thấy ca kiểm tra' })
  if (dongBoGio !== undefined && typeof dongBoGio !== 'boolean') return ra({ ok: false, error: 'Lựa chọn đồng bộ giờ không hợp lệ' })
  if (ca.trang_thai === 'dong' || ca.trang_thai === 'da_xoa') return ra({ ok: false, error: 'Ca đã đóng hoặc đã xoá' })
  const cu = chuoiRong(ca.bat_dau_thi_luc)
  const canBoTheoEm = Number(ca.de_rieng ?? 0) === 1
  const coBoTheoEm = chuoiRong(ca.bo_theo_em_json) !== ''
  // Lặp yêu cầu hoặc hai máy cùng bấm đều giữ mốc và lựa chọn của lần đầu.
  if (cu) return ra({ ok: true, batDauLuc: cu, daBatTruoc: true, canBoTheoEm, coBoTheoEm, dongBoGio: Number(ca.dong_bo_gio) === 1 })
  if (dongBoGio === true && (Number(ca.phong_cho) !== 1 || ca.loai === 'baitap')) {
    return ra({ ok: false, error: 'Đồng bộ giờ chỉ áp dụng cho ca thi có phòng chờ' })
  }
  const luc = new Date().toISOString()
  const r = await env.DB.prepare(`UPDATE ca SET bat_dau_thi_luc = ?, dong_bo_gio = ?, cap_nhat_luc = ?
    WHERE ma_ca = ? AND (bat_dau_thi_luc IS NULL OR bat_dau_thi_luc = '') AND trang_thai NOT IN ('dong','da_xoa')`)
    .bind(luc, (dongBoGio ?? (Number(ca.dong_bo_gio) === 1)) ? 1 : 0, luc, maCa).run()
  const daLuu = await docCa(env, maCa)
  if (!daLuu?.bat_dau_thi_luc) return ra({ ok: false, error: 'Ca vừa thay đổi. Thầy tải lại ca rồi thử lại.' })
  return ra({ ok: true, batDauLuc: daLuu.bat_dau_thi_luc, daBatTruoc: r.meta.changes === 0,
    canBoTheoEm, coBoTheoEm, dongBoGio: Number(daLuu.dong_bo_gio) === 1 })
}

/** Đọc một ô có thể null thành chuỗi đã cắt khoảng trắng. */
function chuoiRong(v: unknown): string {
  return v === null || v === undefined ? '' : String(v).trim()
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

async function tuChuaLanhPhieu(env: Env, o: { body: ReadableStream }, khoa: string): Promise<string | ReadableStream> {
  try {
    const doc = (await new Response(o.body).json()) as Record<string, unknown>
    // TỰ ĐỘNG CHỮA LÀNH PHIẾU NẾU LỆCH VỚI BẢNG CHI_TIET_CAU CHÍNH THỨC
    if (doc && doc.phieu && typeof doc.phieu === 'object' && doc.maCa && doc.sbd && String(doc.loai) !== 'baitap') {
      const p = doc.phieu as Record<string, unknown>
      const ctcRows = await env.DB.prepare(
        `SELECT phan, so_cau, qid, chuyen_de, muc_do, dap_an_chon, dap_an_dung, dung_sai, giay
           FROM chi_tiet_cau WHERE ma_ca = ? AND sbd = ? ORDER BY CASE phan WHEN 'I' THEN 1 WHEN 'II' THEN 2 WHEN 'III' THEN 3 ELSE 4 END, so_cau ASC`,
      )
        .bind(String(doc.maCa), String(doc.sbd))
        .all<Record<string, unknown>>()
      const ctc = ctcRows.results ?? []
      const ctcSai = ctc.filter((x) => Number(x.dung_sai) === 0)
      if (ctc.length > 0 && Array.isArray(p.cauSai)) {
        const saiCountLech = p.cauSai.length !== ctcSai.length
        const qidSaiCtc = new Set(ctcSai.map((x) => String(x.qid)))
        const pQidSai = new Set((p.cauSai as Record<string, unknown>[]).map((x) => String(x?.qid ?? '')))
        let qidLech = false
        for (const q of qidSaiCtc) {
          if (!pQidSai.has(q)) {
            qidLech = true
            break
          }
        }
        if (saiCountLech || qidLech) {
          p.soCauSai = ctcSai.length
          p.tongSoCau = ctc.length
          const mapCauSai = new Map<string, Record<string, unknown>>()
          for (const cs of p.cauSai as Record<string, unknown>[]) {
            if (cs && cs.qid) mapCauSai.set(String(cs.qid), cs)
          }
          p.cauSai = ctcSai.map((r) => {
            const cu = mapCauSai.get(String(r.qid))
            return {
              ...(cu || {}),
              phan: String(r.phan),
              soCau: Number(r.so_cau),
              qid: String(r.qid),
              chuyenDe: String(r.chuyen_de || cu?.chuyenDe || ''),
              mucDo: String(r.muc_do || cu?.mucDo || ''),
              giay: r.giay === null || r.giay === undefined ? null : Number(r.giay),
              dapAnChon: String(r.dap_an_chon ?? cu?.dapAnChon ?? ''),
              dapAnDung: String(r.dap_an_dung ?? cu?.dapAnDung ?? ''),
            }
          })
          await env.DE.put(`phieu/${khoa}.json`, JSON.stringify(doc))
        }
      }
    }
    return JSON.stringify(doc)
  } catch {
    return o.body
  }
}

async function layPhieuR2(env: Env, ma: string): Promise<Response> {
  const khoa = String(ma ?? '').trim()
  if (!khoa) return ra({ ok: false, lyDo: 'thieu' }, 400)
  if (!env.DE) return ra({ ok: false, lyDo: 'khong_co' }, 404)
  const o = await env.DE.get(`phieu/${khoa}.json`)
  // KHÔNG CÓ Ở ĐÂY KHÔNG CÓ NGHĨA LÀ KHÔNG CÓ. Phiếu cũ vẫn nằm bên Apps
  // Script, nên máy em phải hiểu 404 là "hỏi chỗ cũ", không phải "báo đỏ".
  if (!o) return ra({ ok: false, lyDo: 'khong_co' }, 404)
  const body = await tuChuaLanhPhieu(env, o, khoa)
  return new Response(body, {
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
  let dsCa = Array.isArray(b.ca) ? (b.ca as Record<string, unknown>[]) : []
  let dsLuot = Array.isArray(b.luot) ? (b.luot as Record<string, unknown>[]) : []
  if (dsCa.length === 0 && dsLuot.length === 0) return ra({ ok: false, error: 'Không có gì để đẩy' })
  // Sau reset 21/09: ca và lượt mang MÃ CA ĐÃ TỪNG DÙNG (tập nạp lúc reset) bị BỎ QUA và báo lại, phần còn lại vẫn đẩy — app thầy không được đẩy ngược ca ma lên máy chủ.
  const maCu = await maDaDungTrong(env, 'ca', [...dsCa.map((c) => String(c.maCa ?? '').trim()), ...dsLuot.map((l) => String(l.maCa ?? '').trim())])
  if (maCu.size > 0) {
    // Mã còn trong bảng `ca` (ca được GIỮ khi reset) không phải "ca ma": chỉ chặn mã đã dùng mà KHÔNG còn trong `ca` (cùng điều kiện với publish, capNhatKeyBank, noiKhoCa).
    const con = await env.DB.prepare('SELECT ma_ca FROM ca WHERE ma_ca IN (SELECT value FROM json_each(?))').bind(JSON.stringify([...maCu])).all<{ ma_ca: string }>()
    for (const x of con.results ?? []) maCu.delete(String(x.ma_ca))
  }
  if (maCu.size > 0) {
    dsCa = dsCa.filter((c) => !maCu.has(String(c.maCa ?? '').trim()))
    dsLuot = dsLuot.filter((l) => !maCu.has(String(l.maCa ?? '').trim()))
    if (dsCa.length === 0 && dsLuot.length === 0) return ra({ ok: false, error: 'Mọi ca trong lượt đẩy đều là mã cũ đã bị xoá khi làm mới hệ thống', maCaDaDung: true, boQuaMaCu: [...maCu] })
  }
  const nay = new Date().toISOString()
  const cau: D1PreparedStatement[] = []

  const phutDaThem = await docPhutCaDaThem(env, dsCa.map((c) => String(c.maCa ?? '').trim())) // ca đã thêm phút: không hạ thoi_gian_phut
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
        String(c.hetHanVao ?? ''), phutKhongHaSauKhiThem(Number(c.thoiGianPhut) || 45, phutDaThem.get(maCa)), String(c.loai ?? 'thi'),
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
  return ra({ ok: true, soCa: dsCa.length, soLuot: dsLuot.length, soCau: cau.length, ...(maCu.size > 0 ? { boQuaMaCu: [...maCu] } : {}) })
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
      dongBoGio: Number(v.dong_bo_gio) === 1,
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
    // Lượt này đang KHOÁ MÁY (đã ghi id thiết bị)? CHỈ có/không, KHÔNG BAO GIỜ trả mã máy: nút "Cho vào bằng máy khác" của màn Theo dõi ca chỉ hiện ở lượt đang khoá.
    khoaMay: String(l.id_thiet_bi ?? '').trim() !== '',
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
      dongBoGio: Number(ca.dong_bo_gio) === 1,
      thoiGianPhut: Number(ca.thoi_gian_phut) || 45,
      themPhutTong: Number(ca.them_phut_tong) || 0, // tổng phút thầy đã THÊM cho ca đang chạy (`/ca/them-phut`)
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
      // BỐN CỜ CHUYỂN TỪ SHEET SANG (12/09). Màn Theo dõi đọc `deRieng` để biết
      // ca này phát đề riêng từng em; thiếu nó là thầy bấm Bắt đầu mà cả lớp
      // nhận chung một đề.
      deRieng: Number(ca.de_rieng ?? 0) === 1,
      phamViHoiLai: String(ca.pham_vi_hoi_lai ?? '') === 'ba_ca' ? 'ba_ca' : 'gan_nhat',
      danhSachChon: doJson(ca.danh_sach_chon_json),
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

  const tenLop = await docBangTenLop(env) // thêm `tenLop` (chưa có cột ⇒ không thêm trường)
  const items = (r.results ?? []).map((v) => ({
    sbd: String(v.sbd ?? ''),
    hoTen: String(v.ho_ten ?? ''),
    namSinh: String(v.nam_sinh ?? ''),
    lop: String(v.lop ?? ''),
    ...(tenLop ? { tenLop: tenLopCuaEm(v.lop, tenLop.get(String(v.sbd ?? ''))) } : {}),
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

// ===========================================================================
// BÀI TẬP VỀ NHÀ — dựng mới trọn trên máy chủ mới.
// Đặc tả: claude/PHAN-CONG-GIAO-BTVN.md
// ===========================================================================

/** Hạn nộp bài tập về nhà, tính từ lúc thầy bấm Giao. MỘT NGUỒN SỰ THẬT — cấm
 * rải số này ra chỗ khác. */
const HAN_BTVN_GIO = 48

/** GỠ HẬU TỐ PHẦN KHỎI MÃ ĐỀ.
 *
 * Màn chọn đề của thầy tách mỗi tờ thành ba mã con theo phần — `-TN` trắc
 * nghiệm, `-DS` đúng sai, `-TLN` trả lời ngắn (xem `src/lib/tach-phan-de.ts`).
 * Việc tách CHỈ ở tầng hiển thị: kho vẫn giữ nguyên một tờ. Nên máy chủ phải
 * gỡ hậu tố ra mới tra được kho, và nhớ lại phần nào để phát đúng phần ấy.
 *
 * Mã không mang hậu tố ⇒ `phan = null` ⇒ cả tờ. */
export function goPhanKhoiMaDe(ma: string): { goc: string; phan: 'I' | 'II' | 'III' | null } {
  const bang: [string, 'I' | 'II' | 'III'][] = [
    ['-TN', 'I'],
    ['-DS', 'II'],
    ['-TLN', 'III'],
  ]
  for (const [duoi, phan] of bang) {
    if (ma.endsWith(duoi)) return { goc: ma.slice(0, -duoi.length), phan }
  }
  return { goc: ma, phan: null }
}

/** THẦY GIAO BÀI cho một ca đã thi.
 *
 * BA LUẬT TỪ ĐẶC TẢ, và cả ba đều có phép kiểm canh:
 *   1. Chỉ giao cho em CÓ LƯỢT trong ca ấy — em vắng hôm đó không bị giao.
 *   2. Lấy TẤT CẢ câu của tờ đề, ĐÚNG THỨ TỰ KHO. Không xáo, không lọc, không
 *      cắt theo từng em (khác hẳn phiếu khắc phục).
 *   3. Hạn chốt NGAY LÚC BẤM, chung cho cả lớp — không đếm từ lúc em mở. Đếm
 *      từ lúc mở thì em mở muộn được nộp muộn, và thầy mất mốc chung để đếm
 *      "đã nộp / chưa nộp".
 */
async function giaoBtvn(env: Env, b: Record<string, unknown>): Promise<Response> {
  // NHIỀU CA MỘT LƯỢT GIAO (thầy chốt 12/09: "cho tick chọn nhiều ca"). Nhận cả
  // `maCa` một ca của bản trước — bản cũ trên máy thầy vẫn gửi dáng ấy.
  const dsSbdThem = [...new Set((Array.isArray(b.dsSbdThem) ? b.dsSbdThem : []).map(x=>String(x).trim()).filter(Boolean))]
  const dsSbd = Array.isArray(b.dsSbd)
    ? (b.dsSbd as unknown[]).map((x) => String(x).trim()).filter(Boolean)
    : []

  const dsMaCa = Array.isArray(b.dsMaCa)
    ? (b.dsMaCa as unknown[]).map((x) => String(x).trim()).filter(Boolean)
    : String(b.maCa ?? '').trim()
      ? [String(b.maCa).trim()]
      : []

  // Nếu giao cho từng học sinh mà không chọn ca thi, tự động gán ca là 'Riêng'
  if (dsMaCa.length === 0 && dsSbd.length > 0) {
    dsMaCa.push('Riêng')
  }

  if (dsSbdThem.length && !dsMaCa.includes('Riêng')) dsMaCa.push('Riêng')

  const dsMaDe = Array.isArray(b.dsMaDe)
    ? (b.dsMaDe as unknown[]).map((x) => String(x).trim()).filter(Boolean)
    : String(b.maDe ?? '').trim()
      ? [String(b.maDe).trim()]
      : []

  if (dsMaCa.length === 0 || dsMaDe.length === 0) return ra({ ok: false, error: 'Thiếu ca hoặc tờ đề' })
  if (dsMaCa.filter(c=>c!=='Riêng').length > 10) return ra({ ok: false, error: `Tối đa 10 ca một lượt giao, thầy đang tick ${dsMaCa.length} ca` })
  // TRẦN 12 TỜ một lượt giao: mỗi tờ tốn một lượt đọc R2 lúc đếm câu, và bài
  // của em cũng không nên là một trăm câu.
  if (dsMaDe.length > 12) return ra({ ok: false, error: `Tối đa 12 tờ một lượt giao, thầy đang tick ${dsMaDe.length} tờ` })

  const goc = [...new Set(dsMaDe.map((m) => goPhanKhoiMaDe(m).goc))]
  const cho = goc.map(() => '?').join(',')
  const rDe = await env.DB.prepare(`SELECT ma_de, so_cau FROM de_kho WHERE ma_de IN (${cho}) AND da_xoa = 0`)
    .bind(...goc)
    .all<{ ma_de: string; so_cau: number }>()
  const coDe = rDe.results ?? []
  // NÓI ĐÚNG TỜ NÀO THIẾU. "Không có đề trong kho" chung chung thì thầy tick
  // năm tờ không biết phải bỏ tờ nào.
  const thieu = goc.filter((m) => !coDe.some((x) => String(x.ma_de) === m))
  if (thieu.length > 0) return ra({ ok: false, error: `Không có trong kho: ${thieu.join(', ')}` })

  // ĐẾM CÂU THẬT, THEO PHẦN. Đọc gói trên R2 rồi đếm — không lấy `de_kho.so_cau`
  // (tổng cả tờ) làm số câu của một phần, vì đó là bịa số cho thầy nhìn.
  const demGoi = new Map<string, Record<string, unknown>[]>()
  let soCau = 0
  // CẤM RÚT TỰ LUẬN (21/09): đếm ĐÚNG số câu em sẽ được giao — cùng luật với `homeworkQuestions` (tờ -VD/-DT/-TL bỏ hẳn, câu tự luận bỏ), không đếm cả tờ.
  let soBoTuLuan = 0
  for (const m of dsMaDe) {
    const { goc: g, phan } = goPhanKhoiMaDe(m)
    if (!demGoi.has(g) && env.DE) {
      const o = await env.DE.get(`kho/${g}.json`)
      if (o?.body) {
        try {
          demGoi.set(g, docCauTuGoiDe((await new Response(o.body).json()) as Record<string, unknown>))
        } catch {
          demGoi.set(g, [])
        }
      } else {
        demGoi.set(g, [])
      }
    }
    const cau = demGoi.get(g) ?? []
    if (laMaDeTuLuan(g)) continue
    const giu = locCauRutDuoc(phan ? cau.filter((c) => String(c.phan ?? '') === phan) : cau)
    soCau += giu.giu.length
    soBoTuLuan += giu.bo.length
  }
  if (soCau === 0) return ra({ ok: false, error: 'Những tờ đã tick không có câu nào — kiểm tra lại kho đề' })

  // MỘT LƯỢT GIAO CHO MỖI CA, KHÔNG GỘP CHUNG MỘT DÒNG.
  //
  // Em mở bài bằng MÃ CA của chính mình (`btvnCuaEm` tra theo `ma_ca`), nên gộp
  // ba ca vào một dòng là hai lớp kia không tra ra bài. Ba dòng, cùng tờ đề,
  // cùng hạn nộp — hạn chốt MỘT lần ở đây để cả ba lớp cùng mốc.
  const nay = new Date()
  const giaoLuc = nay.toISOString()
  const hanMsMoi = b.hanNop ? Date.parse(String(b.hanNop)) : nay.getTime() + HAN_BTVN_GIO * 3600 * 1000
  if (!Number.isFinite(hanMsMoi) || hanMsMoi <= nay.getTime()) return ra({ok:false,error:'Hạn nộp phải là thời điểm trong tương lai.'})
  const hanNop = new Date(hanMsMoi).toISOString()

  // BÀI CÁ NHÂN HOÁ ("nâng đỡ", docs/hop-dong-btvn-nang-do-2109.md): chỉ khi thầy xin VÀ cờ toàn cục còn bật.
  // Vắng `caNhan`/false ⇒ đường cũ y nguyên từng byte; cờ tắt ⇒ bài thành `ca_nhan = 0` (báo `caNhanBiTat`).
  let baiCaNhan: Awaited<ReturnType<typeof ND.dungBaiGiao>> & { ok: true } | null = null
  let caNhanBiTat = false
  if (b.caNhan === true) {
    if (!(await ND.coBatCaNhan(env))) caNhanBiTat = true
    else {
      if (!(await ND.daCoBangCaNhan(env))) return ra({ ok: false, error: 'Máy chủ chưa cập nhật bảng bài cá nhân hoá (cần chạy migration-2109-btvn-nang-do.sql).' })
      const dung = await ND.dungBaiGiao(env, dsMaDe, b.cau, b.ghim)
      if (!dung.ok) return ra(dung)
      baiCaNhan = dung
    }
  }
  const hatGiong = String(b.hatGiong ?? '').trim().slice(0, 40) || null

  const lenh: D1PreparedStatement[] = []
  const emDaCo = new Set<string>()
  const caRong: string[] = []
  let soLuotGiao = 0

  for (const ca of dsMaCa) {
    const rEm = await env.DB.prepare(
      `SELECT l.sbd, COALESCE(NULLIF(l.ho_ten,''), d.ho_ten, '') AS ten
         FROM luot l LEFT JOIN danh_sach d ON d.sbd = l.sbd
        WHERE l.ma_ca = ? AND l.trang_thai <> 'duoc_duyet_lai'
        GROUP BY l.sbd`,
    )
      .bind(ca)
      .all<{ sbd: string; ten: string }>()
    let dsEm = rEm.results ?? []

    const recipients = ca === 'Riêng' && dsSbdThem.length ? dsSbdThem : dsSbd
    if (recipients.length > 0) {
      const setSbd = new Set(recipients)
      const dsEmCaNay = dsEm.filter((e) => setSbd.has(String(e.sbd)))
      if (ca === 'Riêng' && dsEmCaNay.length < recipients.length) {
        const daCo = new Set(dsEmCaNay.map((e) => String(e.sbd)))
        const thieu = recipients.filter((s) => !daCo.has(s))
        if (thieu.length > 0) {
          const ph = thieu.map(() => '?').join(',')
          const rThem = await env.DB.prepare(
            `SELECT d.sbd, COALESCE(d.ho_ten, h.ho_ten, '') AS ten
               FROM danh_sach d LEFT JOIN hoc_sinh h ON h.sbd = d.sbd
              WHERE d.sbd IN (${ph})`,
          ).bind(...thieu).all<{ sbd: string; ten: string }>()
          const mapTen = new Map((rThem.results ?? []).map((x) => [String(x.sbd), String(x.ten ?? '')]))
          for (const s of thieu) {
            dsEmCaNay.push({ sbd: s, ten: mapTen.get(s) || '' })
          }
        }
      }
      dsEm = dsEmCaNay
    }

    // Ca chưa em nào vào thi (hoặc không em nào được chọn) thì BỎ QUA ca ấy
    if (dsEm.length === 0) {
      caRong.push(ca)
      continue
    }
    dsEm = dsEm.filter(e=>!emDaCo.has(String(e.sbd)))
    if (!dsEm.length) continue
    const maBtvn = `${ca}-${nay.getTime().toString(36)}`
    if (baiCaNhan) {
      // `btvn_cau` TRƯỚC `btvn`: nếu lượt ghi đứt giữa chừng thì chỉ dư dòng mồ côi, không có bài `ca_nhan` thiếu câu.
      lenh.push(ND.lenhGhiCauBai(env, maBtvn, baiCaNhan.cau, baiCaNhan.loi, baiCaNhan.ghim))
      lenh.push(
        env.DB.prepare(
          `INSERT INTO btvn (ma_btvn, ma_ca, ma_de, so_cau, giao_luc, han_nop, da_xoa, cap_nhat_luc, ca_nhan, hat_giong, so_loi)
           VALUES (?,?,?,?,?,?,0,?,1,?,?)`,
        ).bind(maBtvn, ca, dsMaDe.join(','), soCau, giaoLuc, hanNop, giaoLuc, hatGiong, baiCaNhan.loi.length),
      )
    } else {
      lenh.push(
        env.DB.prepare(
          `INSERT INTO btvn (ma_btvn, ma_ca, ma_de, so_cau, giao_luc, han_nop, da_xoa, cap_nhat_luc)
           VALUES (?,?,?,?,?,?,0,?)`,
        ).bind(maBtvn, ca, dsMaDe.join(','), soCau, giaoLuc, hanNop, giaoLuc),
      )
    }
    for (const e of dsEm) {
      lenh.push(
        env.DB.prepare('INSERT INTO btvn_em (khoa, ma_btvn, sbd, ho_ten) VALUES (?,?,?,?)').bind(`${maBtvn}|${e.sbd}`, maBtvn, String(e.sbd), String(e.ten ?? '')),
      )
      // Em thi cả hai ca thì chỉ đếm MỘT lần — con số thầy đọc là số người,
      // không phải số lượt.
      emDaCo.add(String(e.sbd))
    }
    soLuotGiao++
  }

  if (soLuotGiao === 0) {
    return ra({
      ok: false,
      error: dsSbd.length > 0 ? 'Không có học sinh nào được chọn trong ca' : 'Những ca đã tick chưa có em nào vào thi',
    })
  }
  for (let i = 0; i < lenh.length; i += 150) await env.DB.batch(lenh.slice(i, i + 150))
  return ra({
    ok: true, soCa: soLuotGiao, caRong, soEm: emDaCo.size, soCau, soDe: dsMaDe.length, hanNop,
    ...(soBoTuLuan > 0 ? { soBoTuLuan, chuBoTuLuan: chuBaoBoTuLuan(soBoTuLuan) } : {}),
    ...(baiCaNhan
      ? { caNhan: true, soLoi: baiCaNhan.loi.length, hatGiong, boQuaQid: baiCaNhan.boQuaQid, thieuMeta: baiCaNhan.thieuMeta, ...(baiCaNhan.canhBao ? { canhBao: baiCaNhan.canhBao } : {}) }
      : caNhanBiTat ? { caNhan: false, caNhanBiTat: true } : {}),
  })
}

/** EM MỞ BÀI TẬP CỦA MÌNH. Đường CÔNG KHAI — em chỉ có mã ca và số báo danh.
 *
 * CHẶN QUÁ HẠN Ở ĐÂY, không chỉ ẩn nút bên máy em: giờ máy em chỉnh được. */
async function btvnCuaEm(env: Env, b: Record<string, unknown>): Promise<Response> {
  const maCa = String(b.maCa ?? '').trim()
  const sbd = String(b.sbd ?? '').trim()
  if (!maCa || !sbd) return ra({ ok: false, lyDo: 'thieu' })

  const maBtvn = String(b.maBtvn ?? '').trim()
  // Mở đúng lượt giao đã bấm; tuyệt đối không thay bằng bài mới nhất của em.
  const bt = await env.DB.prepare(maBtvn
    ? 'SELECT b.* FROM btvn b JOIN btvn_em e ON e.ma_btvn=b.ma_btvn WHERE b.ma_btvn=? AND e.sbd=? AND e.thu_hoi=0 AND b.da_xoa=0'
    : 'SELECT b.* FROM btvn b JOIN btvn_em e ON e.ma_btvn=b.ma_btvn WHERE b.ma_ca=? AND e.sbd=? AND e.thu_hoi=0 AND b.da_xoa=0 ORDER BY b.giao_luc DESC LIMIT 1')
    .bind(maBtvn || maCa,sbd).first<Record<string,unknown>>()
  if (!bt) return ra({ok:false,lyDo:'khong_duoc_giao',error:'Bài này đã được thu hồi hoặc chưa được giao cho em.'})
  const em = await env.DB.prepare('SELECT * FROM btvn_em WHERE khoa=?').bind(`${bt.ma_btvn}|${sbd}`).first<Record<string,unknown>>()
  if (!em || em.thu_hoi) return ra({ok:false,lyDo:'khong_duoc_giao',error:'Em không có bài tập này.'})

  const hanMs = mocMs(String(bt.han_nop ?? ''))
  const quaHan = hanMs > 0 && Date.now() > hanMs
  if (quaHan && !em.nop_luc) {
    return ra({ ok: false, lyDo: 'qua_han', error: 'Bạn đã quá hạn nộp BTVN', hanNop: String(bt.han_nop ?? '') })
  }

  // BÀI CÁ NHÂN HOÁ: bộ câu riêng của em (chốt lần mở đầu), CHỈ chặng đã mở, KHÔNG đáp án/lời giải. Bài cũ đi tiếp đường dưới, không đổi một byte.
  if (ND.laBaiCaNhan(bt)) {
    const p = await ND.phanHoiMoBaiCaNhan(env, bt, em, sbd, Date.now())
    if (p.ok === false) return ra(p)
    return ra({
      ok: true,
      maBtvn: String(bt.ma_btvn ?? ''),
      hanNop: String(bt.han_nop ?? ''),
      giaoLuc: String(bt.giao_luc ?? ''),
      daNop: !!em.nop_luc,
      nopLuc: String(em.nop_luc ?? ''),
      soDung: em.so_dung === null || em.so_dung === undefined ? null : Number(em.so_dung),
      soLanLam: Math.max(1, Number(em.so_lan_lam) || 1),
      // Bài cá nhân hoá KHÔNG làm lại: đáp án từng chặng đã khoá và đã hiện lời giải.
      soLanLamLaiConLai: 0,
      duocLamLai: false,
      ...p,
    })
  }

  let goi
  try {goi={ma_de:String(bt.ma_de),cau:await homeworkQuestions(env,String(bt.ma_de))}}
  catch {return ra({ok:false,error:'Chưa tải đủ đề bài tập. Em thử lại.'})}

  const soLanLam = Math.max(1, Number(em.so_lan_lam) || 1)
  const soLanLamLaiConLai = em.nop_luc ? Math.max(0, 4 - soLanLam) : 3

  return ra({
    ok: true,
    maBtvn: String(bt.ma_btvn ?? ''),
    hanNop: String(bt.han_nop ?? ''),
    giaoLuc: String(bt.giao_luc ?? ''),
    daNop: !!em.nop_luc,
    nopLuc: String(em.nop_luc ?? ''),
    soDung: em.so_dung === null || em.so_dung === undefined ? null : Number(em.so_dung),
    soCau: Number(bt.so_cau) || 0,
    soLanLam,
    soLanLamLaiConLai,
    duocLamLai: soLanLamLaiConLai > 0,
    // Cột mới (migration-1909-lo-btvn.sql) — `SELECT *` nên chưa chạy migration
    // thì trường này đơn giản là `undefined`, không làm lỗi cả truy vấn.
    loDaXong: Number(em.lo_da_xong) || 0,
    de: goi,
  })
}

/** EM NỘP BÀI TẬP. Đường công khai; chặn quá hạn lần nữa ở đây. */
async function nopBtvn(env: Env, b: Record<string, unknown>): Promise<Response> {
  const maBtvn = String(b.maBtvn ?? '').trim()
  const sbd = String(b.sbd ?? '').trim()
  if (!maBtvn || !sbd) return ra({ ok: false, lyDo: 'thieu' })

  const bt=await env.DB.prepare('SELECT * FROM btvn WHERE ma_btvn=? AND da_xoa=0').bind(maBtvn).first<Record<string,unknown>>()
  if(!bt)return ra({ok:false,error:'Không có bài tập.'})
  return ra(await G.nopBtvnQuaPhieu(env,bt,sbd,(b.dapAn||{}) as Record<string,unknown>))
}

/** EM BÁO XONG MỘT LÔ BTVN (thay Vòng 1/2 — mục 3 SO-VIEC.md 19/09, lịch lô
 * tính thuần ở `src/lib/lich-lo-btvn.ts`). Đường công khai, như `/btvn/nop`.
 *
 * CHỈ TĂNG, KHÔNG BAO GIỜ GIẢM — `MAX(lo_da_xong, ?)`. Gọi lại nhiều lần (mất
 * mạng, em mở lại phiếu, báo trùng giữa hai lô) vẫn ra đúng một tiến độ thật,
 * không bao giờ lùi lại lô đã qua. */
async function xongLoBtvn(env: Env, b: Record<string, unknown>): Promise<Response> {
  const maBtvn = String(b.maBtvn ?? '').trim()
  const sbd = String(b.sbd ?? '').trim()
  const chiSo = Number(b.chiSo)
  if (!maBtvn || !sbd || !Number.isFinite(chiSo) || chiSo < 0) return ra({ ok: false, error: 'Thiếu dữ liệu' })

  // BÀI CÁ NHÂN HOÁ: lệnh này là NỘP CHẶNG — máy chủ chấm, khoá đáp án đầu, ghi sổ rồi mới trả đáp án/lời giải. Tuyệt đối không cho
  // "báo xong" không kèm đáp án (đường cũ dưới đây tăng tiến độ mà không chấm gì). `SELECT *` để chưa chạy migration vẫn không lỗi.
  let btLo: Record<string, unknown> | null = null
  try {
    btLo = await env.DB.prepare('SELECT * FROM btvn WHERE ma_btvn = ? AND da_xoa = 0').bind(maBtvn).first<Record<string, unknown>>()
  } catch {
    /* không đọc được bài: đi tiếp đường cũ, nó tự báo lỗi đúng chỗ */
  }
  if (btLo && ND.laBaiCaNhan(btLo)) {
    const dapAnCn = b.dapAn && typeof b.dapAn === 'object' && !Array.isArray(b.dapAn) ? (b.dapAn as Record<string, unknown>) : null
    return ra(await ND.nopChangCaNhan(env, btLo, sbd, chiSo, dapAnCn, Date.now()))
  }

  const loDaXongMoi = Math.floor(chiSo) + 1
  let r: { meta: { changes: number } }
  try {
    r = await env.DB.prepare(
      `UPDATE btvn_em SET lo_da_xong = MAX(lo_da_xong, ?) WHERE khoa = ?`,
    ).bind(loDaXongMoi, `${maBtvn}|${sbd}`).run()
  } catch {
    // Cột `lo_da_xong` chưa có (chưa chạy migration-1909-lo-btvn.sql) — báo rõ
    // thay vì để lỗi SQL vô nghĩa lọt ra ngoài; máy em vẫn dùng phiếu bình
    // thường, chỉ là tiến độ lô chưa lưu được tới khi thầy chạy migration.
    return ra({ ok: false, error: 'Máy chủ chưa cập nhật cột tiến độ lô (thầy cần chạy migration-1909-lo-btvn.sql).' })
  }
  if (r.meta.changes === 0) return ra({ ok: false, error: 'Em không có bài tập này.' })

  const em = await env.DB.prepare('SELECT lo_da_xong FROM btvn_em WHERE khoa=?')
    .bind(`${maBtvn}|${sbd}`)
    .first<{ lo_da_xong: number }>()
  // SỔ SỰ KIỆN HỌC (GĐ 0): máy em gửi kèm đáp án của lô thì máy chủ CHẤM và ghi sổ —
  // "xong lô" không còn là điền đủ ô. Không gửi đáp án thì hành vi y như cũ.
  const dapAn = b.dapAn && typeof b.dapAn === 'object' && !Array.isArray(b.dapAn) ? (b.dapAn as Record<string, unknown>) : null
  const ghi = dapAn && Object.keys(dapAn).length ? await ghiSuKienLoBtvn(env, maBtvn, sbd, Math.floor(chiSo), dapAn) : null
  // EXP HỌC TẬP MỚI (exp-d1.ts): xong lô đúng nhịp/trễ nhịp + EXP từng câu; cờ tắt thì không đính gì.
  const expMoi = ghi?.ok ? await expNhanSauNop(env, sbd, Date.now()) : {}
  return ra({ ok: true, loDaXong: Number(em?.lo_da_xong ?? loDaXongMoi), ...(ghi ? { suKien: ghi.soGui } : {}), ...expMoi })
}

/** EM HỎI: LỚP CỦA EM CÓ CA THI ĐANG MỞ KHÔNG — để nút "Vào thi" đổi màu (Bảng nhiệm vụ).
 *
 * Đường công khai như `/hs/btvn` (SBD hoặc token). CHỈ trả `coCaMo` và `soCa`: TUYỆT ĐỐI không mã ca, tên ca,
 * mật khẩu hay gì giúp vào thi khi thầy chưa phát mã.
 *
 * "Đang mở" dùng ĐÚNG luật cổng vào thi đang chạy, không đặt luật thứ hai: `quyetDinhVaoThi` (đã mở giờ, chưa quá
 * hạn vào, chưa đóng/xoá, em chưa nộp — em đang làm dở thì vẫn mở) và `hopPhamVi` (khối/danh sách thầy chọn). Ca chỉ
 * mang cờ `mo` mà đã quá hạn vào KHÔNG tính (D1 thật đang có 7 ca như thế). Khớp lớp = `ca.lop` bằng `lop` của em
 * (hoc_sinh, không có thì danh_sach); ca không gắn lớp hay em không có lớp thì KHÔNG khớp — không đoán. */
async function hsCaDangMo(env: Env, b: Record<string, unknown>): Promise<Response> {
  const sbd = b.token ? await gameIdentity(env, b) : String(b.sbd ?? '').trim()
  if (!sbd) return ra({ ok: false, error: 'Thiếu số báo danh' })
  if (sbd.length > 40) return ra({ ok: false, error: 'Không tìm thấy học sinh' })
  // Một truy vấn: em có thật (hoc_sinh · danh_sach · từng có lượt thi) + lớp + năm sinh.
  const em = await env.DB.prepare(
    `SELECT COALESCE(NULLIF(h.lop, ''), d.lop, '') AS lop, d.nam_sinh AS nam_sinh,
            CASE WHEN h.sbd IS NOT NULL OR d.sbd IS NOT NULL OR EXISTS (SELECT 1 FROM luot WHERE sbd = x.sbd) THEN 1 ELSE 0 END AS co
       FROM (SELECT ? AS sbd) x LEFT JOIN hoc_sinh h ON h.sbd = x.sbd LEFT JOIN danh_sach d ON d.sbd = x.sbd`,
  ).bind(sbd).first<{ lop: string; nam_sinh: string | null; co: number }>()
  if (!em || Number(em.co) !== 1) return ra({ ok: false, error: 'Không tìm thấy học sinh' })
  const lop = String(em.lop ?? '').trim()
  if (!lop) return ra({ ok: true, coCaMo: false, soCa: 0 })

  // Một truy vấn: ca thi cờ `mo` của đúng lớp em, kèm trạng thái lượt gần nhất CỦA EM ở ca ấy.
  const r = await env.DB.prepare(
    `SELECT c.trang_thai, c.loai, c.bat_dau, c.het_han_vao, c.thoi_gian_phut, c.dong_bo_gio, c.bat_dau_thi_luc, c.han_nop,
            c.pham_vi, c.danh_sach_chon_json,
            (SELECT l.trang_thai FROM luot l WHERE l.ma_ca = c.ma_ca AND l.sbd = ? ORDER BY l.lan_thu DESC LIMIT 1) AS luot_tt
       FROM ca c
      WHERE c.trang_thai = 'mo' AND COALESCE(c.loai, 'thi') = 'thi' AND TRIM(COALESCE(c.lop, '')) = ?`,
  ).bind(sbd, lop).all<Record<string, unknown>>()
  const nay = Date.now()
  let soCa = 0
  for (const c of r.results ?? []) {
    // Em đã nộp/khoá thì quyetDinhVaoThi trả ok=false; đang làm dở thì ok (khôi phục) — id thiết bị bỏ trống để không kẹt "máy khác".
    const luot = c.luot_tt ? ({ trang_thai: String(c.luot_tt), lan_thu: 1, id_thiet_bi: '' } as unknown as DongLuot) : null
    if (!quyetDinhVaoThi(c as unknown as DongCa, luot, '', nay).ok) continue
    if (!hopPhamVi(c, { nam_sinh: em.nam_sinh }, sbd).ok) continue
    soCa++
  }
  return ra({ ok: true, coCaMo: soCa > 0, soCa })
}

async function xemBaiBtvn(env:Env,b:Record<string,unknown>):Promise<Response>{
 const em=await env.DB.prepare('SELECT e.*,b.ma_de FROM btvn_em e JOIN btvn b ON b.ma_btvn=e.ma_btvn WHERE e.ma_btvn=? AND e.sbd=?').bind(String(b.maBtvn||''),String(b.sbd||'')).first<Record<string,unknown>>()
 if(!em?.nop_luc)return ra({ok:false,error:'Học sinh chưa có bài nộp.'})
 // Bài cá nhân hoá: chỉ câu CỦA EM, chấm theo mẫu (cột `chot_luc` chỉ có sau migration nên `em.chot_luc` vắng ở bài cũ).
 if(em.chot_luc)return ra(await ND.baiLamCaNhan(env,em))
 try{
  const cau=await homeworkQuestions(env,String(em.ma_de))
  const graded=gradeHomework(homeworkKeys(cau),JSON.parse(String(em.dap_an_json||'{}')),String(em.ma_de))
  return ra({ok:true,hoTen:em.ho_ten,sbd:em.sbd,nopLuc:em.nop_luc,...graded,de:{ma_de:em.ma_de,cau}})
 }catch(e){return ra({ok:false,error:e instanceof Error?e.message:'Chưa mở được bài.'})}
}

async function suaBtvn(env:Env,b:Record<string,unknown>):Promise<Response> {
 const id=String(b.maBtvn??'').trim()
 if(!id)return ra({ok:false,error:'Thiếu mã bài.'})
 const bt=await env.DB.prepare('SELECT ma_btvn FROM btvn WHERE ma_btvn=? AND da_xoa=0').bind(id).first()
 if(!bt)return ra({ok:false,error:'Bài không còn được giao.'})
 if(b.sbd){
   const khoa=`${id}|${String(b.sbd).trim()}`
   const em=await env.DB.prepare('SELECT * FROM btvn_em WHERE khoa=?').bind(khoa).first<Record<string,unknown>>()
   if(!em)return ra({ok:false,error:'Học sinh không có trong lượt giao này.'})
   if(b.hanhDong!=='reset'&&b.hanhDong!=='thu-hoi')return ra({ok:false,error:'Thao tác không hợp lệ.'})
   if(b.hanhDong==='reset'){
     const han=await env.DB.prepare('SELECT han_nop FROM btvn WHERE ma_btvn=?').bind(id).first<{han_nop:string}>()
     if(!han||Date.parse(han.han_nop)<=Date.now())return ra({ok:false,error:'Thầy gia hạn nộp trước khi cho học sinh làm lại.'})
   }
   await env.DB.batch([
     env.DB.prepare('INSERT INTO btvn_em_lich_su(id,khoa,luu_luc,hanh_dong,du_lieu) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),khoa,new Date().toISOString(),String(b.hanhDong),JSON.stringify(em)),
     b.hanhDong==='thu-hoi'?env.DB.prepare('UPDATE btvn_em SET thu_hoi=1 WHERE khoa=?').bind(khoa):env.DB.prepare('UPDATE btvn_em SET thu_hoi=0,nop_luc=NULL,so_dung=NULL,so_cau=NULL,dap_an_json=NULL,so_lan_lam=1,xong_vong1_luc=NULL,lo_da_xong=0 WHERE khoa=?').bind(khoa)
   ])
   return ra({ok:true})
 }
 if(b.thuHoi===true){
   await env.DB.prepare('UPDATE btvn SET da_xoa=1,cap_nhat_luc=? WHERE ma_btvn=?').bind(new Date().toISOString(),id).run()
 }else{
   const ms=Date.parse(String(b.hanNop??''))
   if(!Number.isFinite(ms)||ms<=Date.now())return ra({ok:false,error:'Hạn nộp phải là thời điểm trong tương lai.'})
   await env.DB.prepare('UPDATE btvn SET han_nop=?,cap_nhat_luc=? WHERE ma_btvn=? AND da_xoa=0').bind(new Date(ms).toISOString(),new Date().toISOString(),id).run()
 }
 return ra({ok:true})
}

/** THẦY THEO DÕI — đã nộp / chưa nộp, kèm tên em chưa nộp để nhắc và thuật toán phát hiện gian lận đối chiếu ca thi. */
async function theoDoiBtvn(env: Env, b: Record<string, unknown>): Promise<Response> {
  const maCa = String(b.maCa ?? '').trim()
  const r = maCa
    ? await env.DB.prepare('SELECT * FROM btvn WHERE ma_ca = ? AND da_xoa = 0 ORDER BY giao_luc DESC').bind(maCa).all<Record<string, unknown>>()
    : await env.DB.prepare('SELECT * FROM btvn WHERE da_xoa = 0 ORDER BY giao_luc DESC LIMIT 50').all<Record<string, unknown>>()

  // 1. Đọc dữ liệu học sinh của từng bài BTVN
  const dsBtvnData: { bt: Record<string, unknown>; dsEm: Record<string, unknown>[]; cn?: Awaited<ReturnType<typeof ND.thongKeTheoDoiCaNhan>> }[] = []
  const allSubmittedSbd = new Set<string>()

  for (const bt of r.results ?? []) {
    const maBtvn = String(bt.ma_btvn ?? '')
    const em = await env.DB.prepare('SELECT sbd, ho_ten, nop_luc, so_dung, so_cau, thu_hoi, dap_an_json FROM btvn_em WHERE ma_btvn = ? ORDER BY sbd')
      .bind(maBtvn)
      .all<Record<string, unknown>>()
    const dsEm = em.results ?? []
    // Bài cá nhân hoá: thống kê theo câu CỦA EM + tập lõi (chống chép bài chỉ so trên lõi). Bài cũ: không thêm gì.
    const cn = ND.laBaiCaNhan(bt) ? await ND.thongKeTheoDoiCaNhan(env, bt, dsEm) : undefined
    dsBtvnData.push({ bt, dsEm, cn })
    for (const x of dsEm) {
      if (x.nop_luc && !x.thu_hoi) {
        allSubmittedSbd.add(String(x.sbd))
      }
    }
  }

  // 2. Tải dữ liệu ca thi có giám sát (Ground Truth Baseline) cho tất cả SBD đã nộp bài
  const mapThiThat = new Map<string, ThiThatBaseline>()
  const dsSbdArray = Array.from(allSubmittedSbd)
  if (dsSbdArray.length > 0) {
    for (let i = 0; i < dsSbdArray.length; i += 80) {
      const chunk = dsSbdArray.slice(i, i + 80)
      const ph = chunk.map(() => '?').join(',')
      try {
        const rs = await env.DB.prepare(
          `SELECT sbd, AVG(tong) as diem_tb, MAX(tong) as diem_max, COUNT(*) as so_ca, SUM(so_lan_roi_man) as tong_roi
           FROM luot
           WHERE nop_luc IS NOT NULL AND ma_ca NOT LIKE 'BTVN%' AND sbd IN (${ph})
           GROUP BY sbd`
        ).bind(...chunk).all<Record<string, unknown>>()
        for (const row of rs.results ?? []) {
          mapThiThat.set(String(row.sbd), {
            sbd: String(row.sbd),
            diemTB: Number(row.diem_tb) || 0,
            diemMax: Number(row.diem_max) || 0,
            soCa: Number(row.so_ca) || 0,
            tongRoiMan: Number(row.tong_roi) || 0,
          })
        }
      } catch (err) {
        console.error('Lỗi truy vấn baseline thi thật:', err)
      }
    }
  }

  // 3. Phân tích gian lận cho từng bài BTVN
  const ds = []
  for (const { bt, dsEm, cn } of dsBtvnData) {
    const maBtvn = String(bt.ma_btvn ?? '')
    const emInput: ThongTinHocSinhBtvn[] = dsEm.map((x) => ({
      sbd: String(x.sbd),
      hoTen: String(x.ho_ten || ''),
      nopLuc: x.nop_luc ? String(x.nop_luc) : null,
      soDung: x.so_dung !== null && x.so_dung !== undefined ? Number(x.so_dung) : null,
      soCau: x.so_cau !== null && x.so_cau !== undefined ? Number(x.so_cau) : null,
      thuHoi: !!x.thu_hoi,
      dap_an_json: cn ? ND.chiGiuCauLoi(x.dap_an_json, cn.loi) : typeof x.dap_an_json === 'string' ? x.dap_an_json : null,
    }))

    const kqMap = phanTichGianLanBtvn(emInput, mapThiThat)

    ds.push({
      maBtvn,
      maCa: String(bt.ma_ca ?? ''),
      maDe: String(bt.ma_de ?? ''),
      soCau: Number(bt.so_cau) || 0,
      giaoLuc: String(bt.giao_luc ?? ''),
      hanNop: String(bt.han_nop ?? ''),
      quaHan: mocMs(String(bt.han_nop ?? '')) > 0 && Date.now() > mocMs(String(bt.han_nop ?? '')),
      ...(cn ? { caNhan: true, soLoi: cn.soLoi } : {}),
      hocSinh: dsEm.map((x) => {
        const sbd = String(x.sbd)
        const gl = kqMap.get(sbd)
        return {
          sbd,
          hoTen: String(x.ho_ten || ''),
          nopLuc: x.nop_luc,
          soDung: x.so_dung,
          soCau: x.so_cau,
          thuHoi: !!x.thu_hoi,
          gianLan: gl ? gl.gianLan : false,
          xacSuatGianLan: gl ? gl.xacSuatGianLan : 0,
          lyDoGianLan: gl ? gl.lyDoGianLan : '',
          diemThiDoiChieu: gl ? gl.diemThiDoiChieu : null,
          chiTietDoiChieu: gl ? gl.chiTietDoiChieu : undefined,
          ...(cn ? cn.theoEm.get(sbd) : {}),
        }
      }),
      tong: dsEm.filter((x) => !x.thu_hoi).length,
      daNop: dsEm.filter((x) => x.nop_luc && !x.thu_hoi).length,
      chuaNop: dsEm.filter((x) => !x.nop_luc && !x.thu_hoi).map((x) => ({ sbd: String(x.sbd ?? ''), hoTen: String(x.ho_ten ?? '') })),
    })
  }

  return ra({ ok: true, ds })
}

// ===========================================================================
// KHỐI C — KHO ĐỀ
//
// Đây là thứ DUY NHẤT phải chuyển sang NGUYÊN VẸN (thầy chốt 11/09 tối: "đẩy
// kho đề sang nguyên vẹn cho tôi là được, còn lại dựng lại hết"). Mọi bảng khác
// bắt đầu từ rỗng.
//
// CHỖ ĐỂ: gói đề đầy đủ nằm ở R2 `kho/<ma_de>.json` — một đề có ảnh và lời giải
// tới vài trăm KB, nhét vào D1 là sai chỗ. D1 chỉ giữ CHỈ MỤC để tra nhanh:
// câu nào thuộc chuyên đề nào, mức độ nào, ở đề nào.
//
// LUẬT ĐỎ: gói trong `kho/` CÓ ĐÁP ÁN và CÓ LỜI GIẢI. Nó chỉ ra bằng đường đòi
// mã bí mật. Đường công khai `GET /de/:maCa` phục vụ máy em là gói ĐÃ CẮT ĐÁP
// ÁN, dựng riêng lúc mở ca — hai thứ khác nhau, đừng bao giờ trộn.
// ===========================================================================

/** MÃ CÂU — phải ra ĐÚNG mã máy thầy đang dùng, nếu không thì hai bên nói về
 * hai câu khác nhau và mọi thứ dựa trên mã (câu đã làm, bản đồ sai, rút câu
 * khắc phục) sai lặng lẽ.
 *
 * LỖI ĐÃ DÍNH, đo 12/09 lúc 23:30: `cau_hoi` có **0 dòng** trong khi kho có 118
 * đề / 6.843 câu. Vì gói kho của thầy ghi câu bằng `phan` + `so` (xem
 * `KhoDeCau`), không có `qid` lẫn `id` — mà chỗ dựng chỉ mục lại đòi đúng hai
 * khoá ấy rồi `continue`. Kết quả: mọi đường dựa chỉ mục đều rỗng, nên thầy đặt
 * rút 8/2/2 mà chỉ ra 3/1/1.
 *
 * Công thức dưới đây chép đúng `buildTeacherSourceFromKhoDe` ở máy thầy:
 * `<mã đề>-<phần>-<số>`. */
export function qidCuaCau(maDe: string, c: Record<string, unknown>): string {
  const san = String(c.qid ?? c.id ?? '').trim()
  if (san) return san
  const phan = String(c.phan ?? '').trim().toUpperCase()
  const so = String(c.so ?? '').trim()
  if (!phan || !so) return ''
  return `${maDe}-${phan}-${so}`
}

/** ĐẨY MỘT ĐỀ VÀO KHO. Gói đầy đủ lên R2, chỉ mục câu xuống D1. */

async function dayDeKho(env: Env, b: Record<string, unknown>): Promise<Response> {
  const maDe = String(b.maDe ?? '').trim()
  if (!maDe) return ra({ ok: false, error: 'Thiếu mã đề' })
  if (!env.DE) return ra({ ok: false, error: 'Chưa nối R2' }, 500)

  const de = b.de
  const khoa = `kho/${maDe}.json`
  if (de) await env.DE.put(khoa, JSON.stringify(de))

  const cauDs = Array.isArray(b.cau) ? (b.cau as Record<string, unknown>[]) : []

  // SỐ CÂU PHẢI ĐẾM TRÊN GÓI, KHÔNG PHẢI TRÊN CHỈ MỤC.
  //
  // Bản cũ ghi `so_cau = cauDs.length`. Đúng khi hai thứ ấy bằng nhau, nhưng tờ
  // DẠNG BÀI (`DB-…`) cố tình gửi chỉ mục RỖNG để câu khỏi bị đếm hai lần —
  // ghi theo chỉ mục là cả 55 tờ hiện "0 câu" trên menu và phép nghiệm thu
  // "số câu từng tờ" báo lệch 55 tờ, dù gói trên R2 không thiếu câu nào.
  const soCauThat = cauDs.length > 0 ? cauDs.length : de ? docCauTuGoiDe(de as Record<string, unknown>).length : 0

  // NGÀY NẠP nằm TRONG GÓI (`ngay_nap`), không nằm ở chỗ gọi: kho sửa lời giải
  // hay nạp thêm câu là đổi dấu này, app so dấu là biết phải tải lại tờ ấy.
  // Chép xuống D1 để `danhSachDe` trả được mà khỏi phải mở 225 gói trên R2.
  const goi = de && typeof de === 'object' ? (de as Record<string, unknown>) : null
  const ngayNap = String(goi?.ngay_nap ?? b.ngayNap ?? '')
  const nhomDang = /^((?:10|11|12)) · DẠNG BÀI\/(.+)$/.exec(String(goi?.nhom ?? ''))
  const tenDeLuu = maDe.startsWith('DB-') && nhomDang && String(goi?.nguon ?? '').trim()
    ? ['Dạng bài', nhomDang[1], nhomDang[2], String(goi?.nguon).trim()].join(' · ')
    : String(b.tenDe ?? '')
  const nay = new Date().toISOString()
  const lenh: D1PreparedStatement[] = [
    env.DB.prepare(
      `INSERT INTO de_kho (ma_de, ten_de, lop, chuyen_de, so_cau, r2_khoa, da_xoa, cap_nhat_luc, ngay_nap)
       VALUES (?,?,?,?,?,?,0,?,?)
       ON CONFLICT(ma_de) DO UPDATE SET
         ten_de=COALESCE(NULLIF(excluded.ten_de,''), de_kho.ten_de),
         lop=COALESCE(NULLIF(excluded.lop,''), de_kho.lop),
         chuyen_de=COALESCE(NULLIF(excluded.chuyen_de,''), de_kho.chuyen_de),
         so_cau=excluded.so_cau, r2_khoa=excluded.r2_khoa, da_xoa=0,
         cap_nhat_luc=excluded.cap_nhat_luc,
         ngay_nap=COALESCE(NULLIF(excluded.ngay_nap,''), de_kho.ngay_nap)`,
    ).bind(maDe, tenDeLuu, String(b.lop ?? ''), String(b.chuyenDe ?? ''), soCauThat, de ? khoa : null, nay, ngayNap),
  ]
  // Chỉ mục câu: đẩy lại một đề thì chỉ mục cũ của ĐÚNG đề ấy phải đi, kẻo câu
  // đã xoá khỏi đề vẫn còn được rút ra cho em.
  lenh.push(env.DB.prepare('DELETE FROM cau_hoi WHERE ma_de = ?').bind(maDe))
  for (const c of cauDs) {
    const qid = qidCuaCau(maDe, c)
    if (!qid) continue
    lenh.push(
      env.DB.prepare(
        `INSERT INTO cau_hoi (qid, ma_de, chuyen_de, muc_do, phan, lop, co_loi_giai, cap_nhat_luc)
         VALUES (?,?,?,?,?,?,?,?)
         ON CONFLICT(qid) DO UPDATE SET
           ma_de=excluded.ma_de, chuyen_de=excluded.chuyen_de, muc_do=excluded.muc_do,
           phan=excluded.phan, lop=excluded.lop, co_loi_giai=excluded.co_loi_giai,
           cap_nhat_luc=excluded.cap_nhat_luc`,
      ).bind(
        qid, maDe, String(c.chuyenDe ?? ''), String(c.mucDo ?? ''), String(c.phan ?? ''),
        String(c.lop ?? b.lop ?? ''), c.loiGiai || c.giai ? 1 : 0, nay,
      ),
    )
  }
  for (let i = 0; i < lenh.length; i += 150) await env.DB.batch(lenh.slice(i, i + 150))
  return ra({ ok: true, maDe, soCau: soCauThat, soDongChiMuc: cauDs.length, coGoi: !!de })
}

/** DANH SÁCH ĐỀ TRONG KHO — chỉ mục, không kéo gói. */
async function danhSachDeKho(env: Env, b: Record<string, unknown>): Promise<Response> {
  const r = await env.DB.prepare(
    b.keCaDaXoa === true ? 'SELECT * FROM de_kho ORDER BY cap_nhat_luc DESC' : 'SELECT * FROM de_kho WHERE da_xoa = 0 ORDER BY cap_nhat_luc DESC',
  ).all<Record<string, unknown>>()
  return ra({
    ok: true,
    items: (r.results ?? []).map((x) => ({
      maDe: String(x.ma_de ?? ''),
      tenDe: String(x.ten_de ?? ''),
      lop: String(x.lop ?? ''),
      chuyenDe: String(x.chuyen_de ?? ''),
      soCau: Number(x.so_cau) || 0,
      daXoa: Number(x.da_xoa) === 1,
      capNhatLuc: String(x.cap_nhat_luc ?? ''),
      // NGÀY NẠP — app so trường này để biết tờ nào phải tải lại
      // (`exam-sync.ts · chonDeCanTai`). Bản cũ KHÔNG trả nó: app nhận '' cho
      // cả 225 tờ, so với ngày thật trong gói đang giữ ⇒ tờ NÀO CŨNG "đã đổi"
      // ⇒ mỗi lượt Đồng bộ tải lại cả kho và đẩy lại ngân hàng của mọi ca đã
      // mở, chạy mãi không xong. Nhìn từ phía thầy y hệt "bấm đồng bộ mà không
      // vào". Đó là lỗi 16/09.
      ngayNap: String(x.ngay_nap ?? ''),
    })),
  })
}

/** MỘT ĐỀ ĐẦY ĐỦ — CÓ đáp án và lời giải. Đường này đòi mã bí mật. */
async function layDeKho(env: Env, maDe: string): Promise<Response> {
  if (!maDe) return ra({ ok: false, error: 'Thiếu mã đề' })
  if (!env.DE) return ra({ ok: false, error: 'Chưa nối R2' }, 500)
  const o = await env.DE.get(`kho/${maDe}.json`)
  if (!o?.body) return ra({ ok: false, lyDo: 'khong_co_de' }, 404)
  return new Response(o.body, { headers: JSON_HEADERS })
}

/** XOÁ MỀM một đề. Gói trên R2 GIỮ NGUYÊN — xoá nhầm còn lấy lại được. */
async function xoaDeKho(env: Env, b: Record<string, unknown>): Promise<Response> {
  const maDe = String(b.maDe ?? '').trim()
  if (!maDe) return ra({ ok: false, error: 'Thiếu mã đề' })
  const khoiPhuc = b.khoiPhuc === true
  const nay = new Date().toISOString()
  await env.DB.batch([
    env.DB.prepare('UPDATE de_kho SET da_xoa = ?, cap_nhat_luc = ? WHERE ma_de = ?').bind(khoiPhuc ? 0 : 1, nay, maDe),
  ])
  return ra({ ok: true, maDe, daXoa: !khoiPhuc })
}

/** DỰNG LẠI CHỈ MỤC CÂU TỪ GÓI ĐỀ ĐANG NẰM TRÊN R2.
 *
 * Vì sao cần một đường riêng: 118 tờ đề đã ở trên R2 từ lượt chuyển kho, nhưng
 * chỉ mục của chúng rỗng (xem ghi chú ở `qidCuaCau`). Đẩy lại cả kho từ máy
 * thầy là tải lại vài chục megabyte cho thứ máy chủ đã có sẵn.
 *
 * LÀM THEO LÔ, mặc định 6 tờ một lượt: mỗi tờ là một lượt đọc R2 cộng tới vài
 * trăm câu ghi xuống D1, và trần Worker là 50 câu truy vấn — nên lô lớn hơn là
 * chạm trần giữa chừng rồi bỏ dở một tờ. Chỗ gọi lặp tới khi `conLai` về 0. */
async function dungChiMucKho(env: Env, b: Record<string, unknown>): Promise<Response> {
  if (!env.DE) return ra({ ok: false, error: 'Chưa nối R2' }, 500)
  const gioiHan = Math.max(1, Math.min(10, Number(b.gioiHan) || 6))

  // Chọn ĐÚNG những tờ chưa có chỉ mục. Nhờ vậy chạy lại bao nhiêu lần cũng
  // không dựng lại thứ đã dựng, và đứt giữa chừng thì bấm lại là đi tiếp.
  const dsVao = Array.isArray(b.dsMaDe) ? (b.dsMaDe as unknown[]).map((x) => String(x).trim()).filter(Boolean) : []
  const rChon = dsVao.length
    ? { results: dsVao.map((m) => ({ ma_de: m })) }
    : await env.DB.prepare(
        // `DB-%` là tờ DẠNG BÀI — dẫn xuất từ tờ gốc, CỐ Ý không có chỉ mục
        // (xem `TIEN_TO_DANG_BAI`). Dựng chỉ mục cho chúng là đếm câu hai lần.
        `SELECT d.ma_de FROM de_kho d
          WHERE d.da_xoa = 0 AND d.r2_khoa IS NOT NULL
            AND d.ma_de NOT LIKE 'DB-%'
            AND NOT EXISTS (SELECT 1 FROM cau_hoi c WHERE c.ma_de = d.ma_de)
          ORDER BY d.ma_de LIMIT ?`,
      )
        .bind(gioiHan)
        .all<{ ma_de: string }>()

  const ds = (rChon.results ?? []).map((x) => String(x.ma_de))
  const nay = new Date().toISOString()
  const xong: { maDe: string; soCau: number }[] = []
  const hong: { maDe: string; viSao: string }[] = []

  for (const maDe of ds.slice(0, gioiHan)) {
    const o = await env.DE.get(`kho/${maDe}.json`)
    if (!o?.body) {
      hong.push({ maDe, viSao: 'không còn gói trên R2' })
      continue
    }
    let cau: Record<string, unknown>[] = []
    try {
      cau = docCauTuGoiDe((await new Response(o.body).json()) as Record<string, unknown>)
    } catch {
      hong.push({ maDe, viSao: 'gói hỏng, không đọc được' })
      continue
    }
    const lenh: D1PreparedStatement[] = [env.DB.prepare('DELETE FROM cau_hoi WHERE ma_de = ?').bind(maDe)]
    for (const c of cau) {
      const qid = qidCuaCau(maDe, c)
      if (!qid) continue
      lenh.push(
        env.DB.prepare(
          `INSERT INTO cau_hoi (qid, ma_de, chuyen_de, muc_do, phan, lop, co_loi_giai, cap_nhat_luc)
           VALUES (?,?,?,?,?,?,?,?)
           ON CONFLICT(qid) DO UPDATE SET ma_de=excluded.ma_de, chuyen_de=excluded.chuyen_de,
             muc_do=excluded.muc_do, phan=excluded.phan, lop=excluded.lop,
             co_loi_giai=excluded.co_loi_giai, cap_nhat_luc=excluded.cap_nhat_luc`,
        ).bind(
          qid, maDe,
          String(c.chuyen_de ?? c.chuyenDe ?? ''),
          String(c.muc_do ?? c.mucDo ?? ''),
          String(c.phan ?? ''),
          String(c.lop ?? ''),
          c.loi_giai || c.loiGiai ? 1 : 0,
          nay,
        ),
      )
    }
    for (let i = 0; i < lenh.length; i += 40) await env.DB.batch(lenh.slice(i, i + 40))
    // Số câu THẬT của tờ đề lấy luôn từ gói — cột `so_cau` trước đây đếm theo
    // mảng máy thầy gửi, hai con số phải khớp nhau.
    await env.DB.prepare('UPDATE de_kho SET so_cau = ?, cap_nhat_luc = ? WHERE ma_de = ?').bind(cau.length, nay, maDe).run()
    xong.push({ maDe, soCau: cau.length })
  }

  const rCon = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM de_kho d
      WHERE d.da_xoa = 0 AND d.r2_khoa IS NOT NULL
        AND d.ma_de NOT LIKE 'DB-%'
        AND NOT EXISTS (SELECT 1 FROM cau_hoi c WHERE c.ma_de = d.ma_de)`,
  ).first<{ n: number }>()
  const tong = await env.DB.prepare('SELECT COUNT(*) AS n FROM cau_hoi').first<{ n: number }>()

  return ra({ ok: true, xong, hong, conLai: Number(rCon?.n) || 0, tongCau: Number(tong?.n) || 0 })
}

/** RÚT CÂU THEO CHUYÊN ĐỀ — nguồn của bài luyện và câu khắc phục.
 *
 * `boQua` là danh sách qid KHÔNG phát lại (câu em đã làm). Trả về CHỈ MỤC; chỗ
 * gọi tự lấy nội dung từ gói đề. */
async function rutCau(env: Env, b: Record<string, unknown>): Promise<Response> {
  const ds = Array.isArray(b.chuyenDe) ? (b.chuyenDe as unknown[]).map((x) => String(x)).filter(Boolean) : []
  const soCau = Math.max(1, Math.min(200, Number(b.soCau) || 20))
  const boQua = new Set(Array.isArray(b.boQua) ? (b.boQua as unknown[]).map((x) => String(x)) : [])
  if (ds.length === 0) return ra({ ok: false, error: 'Thiếu chuyên đề' })

  const oCd = ds.map(() => '?').join(',')
  const r = await env.DB.prepare(
    `SELECT c.qid, c.ma_de, c.chuyen_de, c.muc_do, c.phan, d.cap_nhat_luc AS phien_ban
       FROM cau_hoi c JOIN de_kho d ON d.ma_de = c.ma_de
      WHERE d.da_xoa = 0 AND c.chuyen_de IN (${oCd})
      LIMIT 2000`,
  )
    .bind(...ds)
    .all<Record<string, unknown>>()

  const con0 = (r.results ?? []).filter((x) => !boQua.has(String(x.qid ?? '')))
  // CẤM RÚT TỰ LUẬN (21/09): chỉ mục `cau_hoi` không có đáp án nên phải nhìn gói của tờ (đệm theo phiên bản tờ). Duyệt theo thứ tự cũ, chỉ mở những tờ cần cho đủ `soCau`;
  // không đọc được gói ⇒ không biết ⇒ giữ câu (không kết tội). Các dòng chưa duyệt tính là còn dùng được (số `coSan` chỉ có thể lệch cao vài câu, không bao giờ trả tự luận).
  const chon: Record<string, unknown>[] = []
  const tuLuanTheoTo = new Map<string, Set<string> | null>()
  let soBoTuLuan = 0
  for (const x of con0) {
    if (chon.length >= soCau) break
    const maDe = String(x.ma_de ?? '')
    if (!tuLuanTheoTo.has(maDe)) tuLuanTheoTo.set(maDe, await qidTuLuanCuaTo(env, maDe, String(x.phien_ban ?? '')))
    if (tuLuanTheoTo.get(maDe)?.has(String(x.qid ?? ''))) { soBoTuLuan++; continue }
    chon.push(x)
  }
  return ra({
    ok: true,
    // Nói rõ kho còn bao nhiêu câu dùng được: hứa 40 câu mà kho chỉ có 12 thì
    // phải nói ra, không im lặng trả 12.
    coSan: con0.length - soBoTuLuan,
    ...(soBoTuLuan > 0 ? { soBoTuLuan } : {}),
    ds: chon.map((x) => ({
      qid: String(x.qid ?? ''),
      maDe: String(x.ma_de ?? ''),
      chuyenDe: String(x.chuyen_de ?? ''),
      mucDo: String(x.muc_do ?? ''),
      phan: String(x.phan ?? ''),
    })),
  })
}

// ===========================================================================
// KHỐI A — CHẤM ĐIỂM TRỌN VẸN TRÊN MÁY CHỦ MỚI
//
// Thay `ghiDiem` bên Apps Script, và thay luôn cả chuỗi việc nó kéo theo:
// chi tiết từng câu · tiến độ theo ca · tiến độ tổng (bảng mạnh–yếu) · danh
// sách câu đã làm · bản đồ câu sai.
//
// LUẬT PHẢI KHỚP APPS SCRIPT, KHÔNG ĐƯỢC XÊ MỘT LY — đây là chỗ sinh ra bảng
// mạnh–yếu, mà bảng ấy quyết định em được phát câu nào để luyện:
//
//   1. `tien_do_ca` khoá theo (ca, em, chuyên đề), lưu SỐ CÂU và SỐ SAI.
//   2. `tien_do_hs` KHÔNG cộng dồn từng lần. Nó được TÍNH LẠI TỪ ĐẦU bằng cách
//      cộng mọi dòng `tien_do_ca` của em ấy. Cộng dồn thì chấm lại một ca là
//      cộng hai lần — đúng lỗi đã làm điểm ca 447479 sai ba lần hôm 09/09.
//   3. Chuyên đề lần chấm trước có, lần này không còn ⇒ dòng ấy về 0, không xoá.
//   4. `qid_da_lam` là HỢP TẬP, không bao giờ bớt đi.
// ===========================================================================

/** Ghi điểm + chi tiết từng câu + mọi bảng tiến độ, cho một hoặc nhiều lượt
 * trong CÙNG MỘT ca. Một lượt gọi, một giao dịch. */
async function chamDiem(env: Env, b: Record<string, unknown>): Promise<Response> {
  const maCa = String(b.maCa ?? '').trim()
  const bai = Array.isArray(b.bai) ? (b.bai as Record<string, unknown>[]) : []
  if (!maCa || bai.length === 0) return ra({ ok: false, error: 'Thiếu mã ca hoặc bài' })

  const nay = new Date().toISOString()
  const cau: D1PreparedStatement[] = []
  const dsSbd: string[] = []

  for (const x of bai) {
    const sbd = String(x.sbd ?? '').trim()
    if (!sbd) continue
    const lanThu = Number(x.lanThu) || 1
    dsSbd.push(sbd)
    const d = (x.diem ?? {}) as Record<string, unknown>
    const dsCau = Array.isArray(x.cau) ? (x.cau as Record<string, unknown>[]) : []

    // ĐIỂM trên dòng lượt.
    cau.push(
      env.DB.prepare(
        `UPDATE luot SET diem_i = ?, diem_ii = ?, diem_iii = ?, tong = ?,
                         ho_ten = COALESCE(NULLIF(?,''), ho_ten), cap_nhat_luc = ?
          WHERE ma_ca = ? AND sbd = ? AND lan_thu = ?`,
      ).bind(
        soHoacNull(d.I), soHoacNull(d.II), soHoacNull(d.III), soHoacNull(d.tong),
        String(x.hoTen ?? ''), nay, maCa, sbd, lanThu,
      ),
    )

    // CHI TIẾT TỪNG CÂU — xoá hết chi tiết cũ của ĐÚNG lượt này rồi ghi lại.
    // Ghi đè theo khoá không đủ: lần chấm mới có thể ÍT câu hơn lần trước, và
    // dòng thừa còn lại sẽ cộng nhầm vào tiến độ.
    cau.push(env.DB.prepare('DELETE FROM chi_tiet_cau WHERE ma_ca = ? AND sbd = ? AND lan_thu = ?').bind(maCa, sbd, lanThu))
    for (const c of dsCau) {
      const phan = String(c.phan ?? '')
      const soCau = Number(c.soCau) || 0
      if (!phan || !soCau) continue
      cau.push(
        env.DB.prepare(
          `INSERT INTO chi_tiet_cau (khoa, ma_ca, sbd, lan_thu, phan, so_cau, qid, chuyen_de,
                                     muc_do, dap_an_chon, dap_an_dung, dung_sai, giay, cap_nhat_luc)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        ).bind(
          `${maCa}|${sbd}|${lanThu}|${phan}|${soCau}`, maCa, sbd, lanThu, phan, soCau,
          String(c.qid ?? ''), String(c.chuyenDe ?? ''), String(c.mucDo ?? ''),
          String(c.dapAnChon ?? ''), String(c.dapAnDung ?? ''),
          c.dungSai === true ? 1 : c.dungSai === false ? 0 : null,
          Number(c.giay) || null, nay,
        ),
      )
    }

    // BẢN ĐỒ CÂU SAI — chỉ câu SAI, và chỉ câu có `qid`.
    for (const c of dsCau) {
      const qid = String(c.qid ?? '').trim()
      if (!qid || c.dungSai !== false) continue
      cau.push(
        env.DB.prepare(
          `INSERT INTO ban_do_sai (khoa, ma_ca, sbd, qid, chuyen_de, muc_do, so_lan_sai, da_chua, cap_nhat_luc)
           VALUES (?,?,?,?,?,?,1,0,?)
           ON CONFLICT(khoa) DO UPDATE SET
             chuyen_de=excluded.chuyen_de, muc_do=excluded.muc_do, cap_nhat_luc=excluded.cap_nhat_luc`,
        ).bind(`${maCa}|${sbd}|${qid}`, maCa, sbd, qid, String(c.chuyenDe ?? ''), String(c.mucDo ?? ''), nay),
      )
    }

    // CÂU ĐÃ LÀM — hợp tập, không bao giờ bớt.
    for (const c of dsCau) {
      const qid = String(c.qid ?? '').trim()
      if (!qid) continue
      cau.push(
        env.DB.prepare(
          `INSERT INTO qid_da_lam (khoa, sbd, qid, lan_dau, so_lan) VALUES (?,?,?,?,1)
           ON CONFLICT(khoa) DO UPDATE SET so_lan = qid_da_lam.so_lan + 1`,
        ).bind(`${sbd}|${qid}`, sbd, qid, nay),
      )
    }

    // TIẾN ĐỘ THEO CA — về 0 trước, rồi tính lại từ `chi_tiet_cau`.
    // Về 0 chứ KHÔNG xoá: chuyên đề lần trước có mà lần này không còn thì dòng
    // ấy phải còn để bảng mạnh–yếu trừ đi, đúng luật Apps Script.
    cau.push(
      env.DB.prepare('UPDATE tien_do_ca SET so_cau = 0, so_sai = 0, cap_nhat_luc = ? WHERE ma_ca = ? AND sbd = ?').bind(nay, maCa, sbd),
    )
    cau.push(
      env.DB.prepare(
        `INSERT INTO tien_do_ca (khoa, ma_ca, sbd, chuyen_de, so_cau, so_sai, nop_luc, cap_nhat_luc)
         SELECT ? || '|' || chuyen_de, ?, ?, chuyen_de,
                COUNT(*), SUM(CASE WHEN COALESCE(dung_sai, 0) = 0 THEN 1 ELSE 0 END),
                (SELECT nop_luc FROM luot WHERE ma_ca = ? AND sbd = ? AND lan_thu = ?), ?
           FROM chi_tiet_cau
          WHERE ma_ca = ? AND sbd = ? AND lan_thu = ? AND chuyen_de <> ''
          GROUP BY chuyen_de
         ON CONFLICT(khoa) DO UPDATE SET
           so_cau=excluded.so_cau, so_sai=excluded.so_sai,
           nop_luc=COALESCE(excluded.nop_luc, tien_do_ca.nop_luc),
           cap_nhat_luc=excluded.cap_nhat_luc`,
      ).bind(`${maCa}|${sbd}`, maCa, sbd, maCa, sbd, lanThu, nay, maCa, sbd, lanThu),
    )
  }

  for (let i = 0; i < cau.length; i += 100) await env.DB.batch(cau.slice(i, i + 100))

  // SỔ SỰ KIỆN HỌC (GĐ 0): mỗi câu đã chấm là một sự kiện `thi`. Ghi SAU khi
  // chi tiết đã nằm trong D1; lỗi sổ không làm hỏng việc chấm điểm.
  const luotSk: LuotThi[] = []
  for (const x of bai) {
    const sbd = String(x.sbd ?? '').trim()
    if (!sbd) continue
    const dsCau = Array.isArray(x.cau) ? (x.cau as Record<string, unknown>[]) : []
    luotSk.push({
      sbd,
      lanThu: Number(x.lanThu) || 1,
      // Chỉ những câu đã vào `chi_tiet_cau` ở trên (có phần + số câu), để hai bên đếm khớp nhau.
      cau: dsCau
        .filter((c) => String(c.phan ?? '') && Number(c.soCau))
        .map((c) => ({ qid: c.qid, chuyenDe: c.chuyenDe, mucDo: c.mucDo, dapAnChon: c.dapAnChon, dungSai: c.dungSai, giay: c.giay })),
    })
  }
  await ghiSuKienThi(env, maCa, luotSk, nay)

  // TIẾN ĐỘ TỔNG — TÍNH LẠI TỪ ĐẦU cho từng em vừa chấm.
  //
  // Chạy SAU khi mọi câu trên đã ghi xong, vì nó đọc chính `tien_do_ca` vừa
  // dựng. Và nó KHÔNG cộng dồn: cộng dồn thì chấm lại một ca là cộng hai lần.
  const rieng = [...new Set(dsSbd)]
  for (const sbd of rieng) {
    await env.DB.batch([
      env.DB.prepare('UPDATE tien_do_hs SET so_cau = 0, so_sai = 0, cap_nhat_luc = ? WHERE sbd = ?').bind(nay, sbd),
      env.DB.prepare(
        `INSERT INTO tien_do_hs (khoa, sbd, chuyen_de, so_cau, so_sai, cap_nhat_luc)
         SELECT ? || '|' || chuyen_de, ?, chuyen_de, SUM(so_cau), SUM(so_sai), ?
           FROM tien_do_ca WHERE sbd = ? GROUP BY chuyen_de
         ON CONFLICT(khoa) DO UPDATE SET
           so_cau=excluded.so_cau, so_sai=excluded.so_sai, cap_nhat_luc=excluded.cap_nhat_luc`,
      ).bind(sbd, sbd, nay, sbd),
    ])
  }

  return ra({ ok: true, soBai: rieng.length, soCau: cau.length })
}

/** BẢNG MẠNH–YẾU CỦA MỘT EM — nguồn của rút câu sai và gọi lên bảng. */
async function tienDoEm(env: Env, sbd: string): Promise<Response> {
  if (!sbd) return ra({ ok: false, error: 'Thiếu số báo danh' })
  const r = await env.DB.prepare(
    'SELECT chuyen_de, so_cau, so_sai FROM tien_do_hs WHERE sbd = ? AND so_cau > 0 ORDER BY (CAST(so_sai AS REAL) / so_cau) DESC, so_cau DESC',
  )
    .bind(sbd)
    .all<{ chuyen_de: string; so_cau: number; so_sai: number }>()
  const rQ = await env.DB.prepare('SELECT qid FROM qid_da_lam WHERE sbd = ?').bind(sbd).all<{ qid: string }>()
  return ra({
    ok: true,
    chuyenDe: (r.results ?? []).map((x) => ({
      ten: String(x.chuyen_de ?? ''),
      soCau: Number(x.so_cau) || 0,
      soSai: Number(x.so_sai) || 0,
    })),
    qidDaLam: (rQ.results ?? []).map((x) => String(x.qid ?? '')),
  })
}

/** CÂU SAI CHƯA CHỮA của một em — để rút câu khắc phục. */
async function cauSaiCuaEm(env: Env, b: Record<string, unknown>): Promise<Response> {
  const sbd = String(b.sbd ?? '').trim()
  if (!sbd) return ra({ ok: false, error: 'Thiếu số báo danh' })
  const maCa = String(b.maCa ?? '').trim()
  const r = maCa
    ? await env.DB.prepare('SELECT * FROM ban_do_sai WHERE sbd = ? AND ma_ca = ? ORDER BY cap_nhat_luc DESC').bind(sbd, maCa).all<Record<string, unknown>>()
    : await env.DB.prepare('SELECT * FROM ban_do_sai WHERE sbd = ? AND da_chua = 0 ORDER BY cap_nhat_luc DESC LIMIT 300').bind(sbd).all<Record<string, unknown>>()
  return ra({
    ok: true,
    ds: (r.results ?? []).map((x) => ({
      maCa: String(x.ma_ca ?? ''),
      qid: String(x.qid ?? ''),
      chuyenDe: String(x.chuyen_de ?? ''),
      mucDo: String(x.muc_do ?? ''),
      soLanSai: Number(x.so_lan_sai) || 1,
      daChua: Number(x.da_chua) === 1,
    })),
  })
}

/** GỌI LÊN BẢNG — ghi một câu chữa tại lớp vào bảng mạnh–yếu, KHÔNG tạo lượt
 * thi giả và KHÔNG đụng điểm số. Đúng khuôn `ghiLenBang` bên Apps Script. */
async function ghiLenBangMoi(env: Env, b: Record<string, unknown>): Promise<Response> {
  const sbd = String(b.sbd ?? '').trim()
  const chuyenDe = String(b.chuyenDe ?? '').trim()
  if (!sbd || !chuyenDe) return ra({ ok: false, error: 'Thiếu số báo danh hoặc chuyên đề' })
  const nay = new Date().toISOString()
  const dat = b.dat === true
  const qid = String(b.qid ?? '').trim()

  // `giayThuc` (tuỳ chọn, hợp đồng docs/hop-dong-giay-thuc-len-bang-1909.md): số hữu hạn 20..1800 thì ghi, còn lại ghi NULL. KHÔNG BAO GIỜ từ chối lệnh ghi vì trường này.
  const giayTho = b.giayThuc
  const giayThuc = typeof giayTho === 'number' && Number.isFinite(giayTho) && giayTho >= 20 && giayTho <= 1800 ? giayTho : null
  const cau: D1PreparedStatement[] = [
    env.DB.prepare('INSERT INTO len_bang (sbd, chuyen_de, qid, dat, luc, giay_thuc) VALUES (?,?,?,?,?,?)').bind(sbd, chuyenDe, qid, dat ? 1 : 0, nay, giayThuc),
    // KHÔNG còn cộng thẳng vào `tien_do_hs` (thầy chốt 19/09, câu 11): `chamDiem` xoá rồi dựng lại bảng ấy từ `chi_tiet_cau` mỗi lần chấm lại một ca,
    // nên phần lên bảng đã cộng bị mất. Nguồn sự thật nay là sổ `su_kien_hoc` (ghi ngay dưới, nguon='len_bang'); hồ sơ nắm dựng từ sổ.
  ]
  if (qid) {
    cau.push(
      env.DB.prepare(
        `INSERT INTO qid_da_lam (khoa, sbd, qid, lan_dau, so_lan) VALUES (?,?,?,?,1)
         ON CONFLICT(khoa) DO UPDATE SET so_lan = qid_da_lam.so_lan + 1`,
      ).bind(`${sbd}|${qid}`, sbd, qid, nay),
    )
    // Chữa đúng câu đã sai ⇒ đánh dấu đã chữa.
    if (dat) cau.push(env.DB.prepare('UPDATE ban_do_sai SET da_chua = 1, chua_luc = ? WHERE sbd = ? AND qid = ?').bind(nay, sbd, qid))
  }
  let kq: Awaited<ReturnType<Env['DB']['batch']>>
  try {
    kq = await env.DB.batch(cau)
  } catch (e) {
    // Chưa chạy migration-1909-len-bang-giay-thuc.sql (cột `giay_thuc` chưa có): ghi như cũ, bỏ số đo. Batch là giao dịch nên thử lại không ghi đôi.
    if (!/no such column|has no column named/i.test(e instanceof Error ? e.message : String(e))) throw e
    cau[0] = env.DB.prepare('INSERT INTO len_bang (sbd, chuyen_de, qid, dat, luc) VALUES (?,?,?,?,?)').bind(sbd, chuyenDe, qid, dat ? 1 : 0, nay)
    kq = await env.DB.batch(cau)
  }
  // SỔ SỰ KIỆN HỌC (GĐ 0): mỗi lượt gọi bảng là một sự kiện, khoá theo id dòng `len_bang`
  // (giống hệt đường nạp lại). Không có qid thì không có bằng chứng về câu nào — không ghi.
  if (qid) {
    const id = Number(kq?.[0]?.meta?.last_row_id) || 0
    await ghiSuKien(env, [{
      nguon: 'len_bang', maNguon: 'lb', sbd, qid, lan: id > 0 ? id : Date.parse(nay),
      ketQua: dat ? 1 : 0, luc: nay, chuyenDe, mucDo: '',
    }])
  }
  return ra({ ok: true })
}

/** CÁI THƯỚC — ĐẾM MỌI BẢNG TRÊN D1 ĐỂ ĐẶT CẠNH SỐ CỦA GOOGLE SHEET.
 *
 * VÌ SAO ĐÂY LÀ VIỆC ĐẦU TIÊN CỦA CẢ ĐỢT BỎ APPS SCRIPT, trước khi chuyển một
 * lệnh nào: ngày 11/09 tôi đưa ra BỐN đường nhanh, cả bốn đều có mặt trong mã,
 * chạy đúng logic, và KHÔNG đường nào thật sự phục vụ được ai. Cả bốn lần chỉ
 * lộ ra khi đếm ở chỗ dữ liệu của người dùng đọng lại.
 *
 * Không có cái thước này thì mỗi lần cắt một khối là một lần tin lời nhau.
 *
 * CHỈ ĐẾM, không sửa gì. An toàn tuyệt đối, gọi bao nhiêu lần cũng được. */
async function doiChieuSo(env: Env): Promise<Response> {
  const dem = async (sql: string): Promise<number> => {
    try {
      const r = await env.DB.prepare(sql).first<{ n: number }>()
      return Number(r?.n) || 0
    } catch {
      // Bảng chưa dựng (khối chưa tới lượt) ⇒ 0, không nổ.
      return -1
    }
  }

  return ra({
    ok: true,
    luc: new Date().toISOString(),
    so: {
      ca: await dem("SELECT COUNT(*) n FROM ca WHERE ma_ca <> 'DOTAI'"),
      caChuaXoa: await dem("SELECT COUNT(*) n FROM ca WHERE trang_thai <> 'da_xoa' AND ma_ca <> 'DOTAI'"),
      luot: await dem("SELECT COUNT(*) n FROM luot WHERE ma_ca <> 'DOTAI'"),
      luotCoDiem: await dem("SELECT COUNT(*) n FROM luot WHERE tong IS NOT NULL AND ma_ca <> 'DOTAI'"),
      luotCoTen: await dem("SELECT COUNT(*) n FROM luot WHERE ho_ten IS NOT NULL AND ho_ten <> '' AND ma_ca <> 'DOTAI'"),
      luotChuaVeSheet: await dem("SELECT COUNT(*) n FROM luot WHERE da_day_sheet = 0 AND trang_thai IN ('da_nop','khoa') AND ma_ca <> 'DOTAI'"),
      danhSach: await dem('SELECT COUNT(*) n FROM danh_sach'),
      phongCho: await dem('SELECT COUNT(*) n FROM phong_cho'),
      trangThai: await dem('SELECT COUNT(*) n FROM trang_thai'),
      chanVao: await dem('SELECT COUNT(*) n FROM chan_vao'),
      caSinhTaiD1: await dem('SELECT COUNT(*) n FROM ca WHERE sinh_tai_d1 = 1'),
      // Bảng của các khối chưa tới lượt: trả -1 nghĩa là CHƯA DỰNG.
      chiTietCau: await dem('SELECT COUNT(*) n FROM chi_tiet_cau'),
      banDoSai: await dem('SELECT COUNT(*) n FROM ban_do_sai'),
      tienDoHs: await dem('SELECT COUNT(*) n FROM tien_do_hs'),
    },
  })
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
    khoaMay: String(l.id_thiet_bi ?? '').trim() !== '', // chỉ có/không, không trả mã máy (như chiTietCaMoi)
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


// ===========================================================================
// CỔNG `/goi` — BẢNG DỊCH LỆNH CŨ. CẮT HẲN GOOGLE (thầy chốt 12/09 rạng sáng).
//
// App đang gọi Apps Script bằng 67 lệnh `{action: '...'}`. Viết lại 67 chỗ gọi
// trong một đêm là cách chắc chắn nhất để làm hỏng một thứ đang chạy, nên đi
// đường ngược lại: GIỮ NGUYÊN DÁNG LỆNH, ĐỔI NƠI NHẬN. Đây là bảng dịch ấy.
//
// Mỗi lệnh trả về ĐÚNG DÁNG cũ — tên trường, kiểu, cả trường rỗng — vì màn hình
// không được sửa một dòng nào trong đợt này. Lệnh nào chưa dựng thì trả lỗi nói
// thẳng tên lệnh, KHÔNG trả `{ok:true}` rỗng: im lặng trả rỗng là thầy nhìn màn
// hình thấy "không có dữ liệu" và tưởng mất sạch.
const LENH_CUA_THAY = new Set([
  'publish', 'batDauThi', 'chiTietCa', 'danhSachCa', 'ghiDiem', 'khoaCa', 'moKhoaCa',
  'xoaCa', 'khoiPhucCa', 'xoaVinhVienCa', 'doiTenCa', 'dongBoTenCa', 'moKhoa', 'duyetThiLai', 'choThiLai',
  'capNhatKeyBank', 'noiKhoCa', 'banDoSaiCa', 'danhSachEm', 'hoSoEm', 'hoSoNhieuEm',
  'qidDaLam', 'danhSachYeuCau', 'danhDauYeuCau', 'napDanhSachLop', 'themEmVaoSheet',
  'linkDanhSachLop', 'luuLinkDanhSachLop', 'deleteStudent', 'danhSachDe', 'layDe', 'luuDe',
  'xoaDe', 'luuPhieu', 'luuNhieuPhieu', 'xoaPhieu', 'phieuTheoCa', 'nopKhacPhucTheoCa',
  'dungChiMuc', 'danhSachCauHoi', 'xoaCauHoi', 'danhDauDaChua', 'ghiLenBang', 'lichSuLenBang',
  // Hồ sơ CẢ LỚP là dữ liệu của nhiều em — lệnh của THẦY, không mở cho máy em.
  'hoSoLopLenBang', 'hoSoOnCa',
  'sendTeacherMessage', 'listMessages', 'demTinMoi', 'listStudents', 'markMessagesRead',
  'resetMatKhauHs',
])

/** RÚT DANH SÁCH CÂU TỪ MỘT GÓI ĐỀ. Kho đi qua nhiều đời nên gói có ba dáng:
 * `cau`, `items`, hoặc tách theo `phanI|phanII|phanIII`. Nhận cả ba, và KHÔNG
 * đoán khi gặp dáng lạ — trả mảng rỗng để chỉ mục trống chứ không nhét bừa. */
function docCauTuGoiDe(de: Record<string, unknown>): Record<string, unknown>[] {
  if (Array.isArray(de.cau)) return de.cau as Record<string, unknown>[]
  if (Array.isArray(de.items)) return de.items as Record<string, unknown>[]
  const gom: Record<string, unknown>[] = []
  for (const p of ['phanI', 'phanII', 'phanIII']) {
    const v = de[p]
    if (Array.isArray(v)) for (const c of v) gom.push(c as Record<string, unknown>)
  }
  return gom
}

async function goiCu(req: Request, env: Env, b: Record<string, unknown>): Promise<Response> {
  const act = String(b.action ?? '').trim()
  if (!act) return ra({ ok: false, error: 'Thiếu tên lệnh' }, 400)
  const thay = laThay(req, env, b)
  if (LENH_CUA_THAY.has(act) && !thay) return ra({ ok: false, error: 'Sai mã bí mật' }, 403)

  switch (act) {
    // ---- MÁY EM ----------------------------------------------------------
    case 'vaoThi': return vaoThi(env, b)
    case 'luuTam': return luuTam(env, b)
    case 'submit': return nop(env, b)
    case 'examStatus': return dayTrangThai(env, b)
    case 'trangThaiPhongCho': return hoiPhongCho(env, String(b.maCa ?? ''))
    case 'tenTheoSbd': return ra(await G.traSbd(env, b))
    case 'ketQua': return ra(await G.ketQuaCuaEm(env, b))
    case 'session': return ra(await G.xemCa(env, b))
    case 'layPhieu': return ra(await G.layPhieu(env, b))
    case 'phieuCuaEm': return ra(await G.phieuCuaEm(env, b))
    case 'lichSuEm': return ra(await G.lichSuEm(env, b))
    case 'baiTapCuaEm': return ra(await G.baiTapCuaEm(env, b))
    case 'guiCauHoi': return ra(await G.guiCauHoi(env, b))
    case 'nopKhacPhuc': return ra(await G.nopKhacPhuc(env, b))
    case 'cauKhacPhuc': return ra(await G.cauKhacPhucGoi(env, b))
    case 'ghiPhieuKhacPhuc': return ra(await G.ghiPhieuKhacPhuc(env, b))
    case 'sendMessage': return ra(await G.guiTin(env, b))
    case 'sendFeedback': return ra(await G.guiNhanXetCoQuyen(env, b, thay))
    case 'xinGiaoBai': return ra(await G.xinGiaoBai(env, b))
    case 'hsDangNhap': return ra(await G.hsDangNhap(env, b))
    case 'hsDatMatKhau': return ra(await G.hsDatMatKhau(env, b))
    case 'resetMatKhauHs': return ra(await G.resetMatKhauHs(env, b))
    case 'hsLichSuCa': return ra(await G.hsLichSuCa(env, b))
    case 'hsBtvn': return ra(await G.hsBtvn(env, b))
    case 'hsCauSai': return ra(await G.hsCauSai(env, b))
    case 'hsCauDaThi': return ra(await G.hsCauDaThi(env, b))

    // ---- LUYỆN DẠNG BÀI (15-09) ------------------------------------------
    // Menu và tờ đề theo dạng bài. Lệnh của MÁY EM: không có đáp án nào rò ra
    // ngoài phạm vi kho đề mà em vẫn luyện bằng `cauKhacPhuc`.
    case 'danhMucDangBai': return ra(await G.danhMucDangBai(env))
    case 'deTheoDangBai': return ra(await G.deTheoDangBai(env, b))

    // ---- THẦN THÚ HOÁ HỌC — đồng bộ đa thiết bị (15-09) ------------------
    // Chỉ tiến trình game. Không tên, không điểm, không ảnh bài.
    case 'thanThuDoc': return ra(await G.thanThuDoc(env, b))
    case 'thanThuGhi': return ra(await G.thanThuGhi(env, b))

    // ---- CA THI ----------------------------------------------------------
    case 'publish': return dayCa(env, b)
    case 'batDauThi': return batDauThi(env, String(b.maCa ?? ''), b.dongBoGio)
    case 'chiTietCa': {
      // Đường cũ trả `{ok:false}` khi không có ca, và màn Theo dõi dựa vào đó.
      // Đường mới trả `{ok:true, coCa:false}` (hình dáng riêng của nó), nên chỗ
      // gọi sẽ đọc `r.ca.maCa` trên một thứ không tồn tại và vỡ màn hình. Dịch
      // lại đúng dáng cũ ngay tại đây.
      const res = await chiTietCaMoi(env, String(b.maCa ?? ''))
      const j = (await res.clone().json()) as Record<string, unknown>
      if (j.coCa === false) return ra({ ok: false, error: 'Không tìm thấy ca kiểm tra' })
      return res
    }
    case 'danhSachCa': return themMocReset(env, await danhSachCaMoi(env, b.daXoa === true))
    case 'ghiDiem': return ghiDiemMoi(env, b)
    case 'khoaCa': return ra(await G.khoaCa(env, b))
    case 'moKhoaCa': return ra(await G.moKhoaCa(env, b))
    case 'xoaCa': return ra(await G.xoaCa(env, b))
    case 'khoiPhucCa': return ra(await G.khoiPhucCa(env, b))
    case 'xoaVinhVienCa': return ra(await G.xoaVinhVienCa(env, b))
    case 'doiTenCa': return ra(await G.doiTenCa(env, b))
    case 'dongBoTenCa': return ra(await G.dongBoTenCa(env, b))
    case 'moKhoa': return ra(await G.moKhoaEm(env, b))
    case 'duyetThiLai': return ra(await G.duyetThiLai(env, b))
    case 'choThiLai': return ra(await G.choThiLai(env, b))
    case 'capNhatKeyBank': return ra(await G.capNhatKeyBank(env, b))
    case 'noiKhoCa': return ra(await G.noiKhoCa(env, b))
    case 'banDoSaiCa': return ra(await G.banDoSaiCa(env, b))
    case 'listSubmissions': return ra(await G.dsNopCuaCa(env, b))

    // ---- HỒ SƠ · DANH SÁCH ----------------------------------------------
    case 'danhSachEm': return danhSachEmMoi(env)
    case 'hoSoEm': return ra(await G.hoSoEm(env, b))
    case 'hoSoNhieuEm': return ra(await G.hoSoNhieuEm(env, b))
    case 'qidDaLam': return ra(await G.qidDaLam(env, b))
    // `napDanhSachLop` bên đường cũ gửi mảng ở khoá `items`; `/danh-sach/day`
    // đọc khoá `ds`. Dịch tên khoá ở đây, không đổi hàm đang chạy.
    case 'napDanhSachLop': return dayDanhSach(env, { ds: b.items })
    case 'themEmVaoSheet': return ra(await G.themEm(env, b))
    case 'deleteStudent': return ra(await G.xoaEm(env, b))
    case 'listStudents': return ra(await G.dsEmDangKy(env))
    case 'linkDanhSachLop': return ra({ ok: true, links: (await G.layCauHinh(env, 'link_danh_sach_lop')) ?? [] })
    case 'luuLinkDanhSachLop': {
      const links = Array.isArray(b.links) ? (b.links as unknown[]).map((x) => String(x)).filter(Boolean) : []
      await G.ghiCauHinh(env, 'link_danh_sach_lop', links)
      return ra({ ok: true, links })
    }
    case 'danhSachYeuCau': return ra(await G.danhSachYeuCau(env, b))
    case 'danhDauYeuCau': return ra(await G.danhDauYeuCau(env, b))

    // ---- KHO ĐỀ ----------------------------------------------------------
    case 'danhSachDe': return danhSachDeKho(env, b)
    // `/kho/lay` trả THẲNG gói đề (dòng byte từ R2, không bọc). Đường cũ thì
    // trả `{ok:true, de:{...}}` và chỗ gọi đọc `r.de`. Bọc lại ở đây.
    case 'layDe': {
      const r = await layDeKho(env, String(b.maDe ?? ''))
      if (!r.ok) return r
      const de = await r.clone().json()
      return ra({ ok: true, de })
    }
    // `luuDe` bên đường cũ gửi NGUYÊN gói đề và để máy chủ tự rút mã đề, danh
    // sách câu, lớp, chuyên đề. `/kho/day` thì đòi sẵn từng phần. Rút ở đây —
    // và nếu gói không có mã đề thì NÓI THẲNG, không tự đặt một mã bừa rồi để
    // thầy đi tìm một tờ đề không ai biết tên.
    case 'luuDe': {
      const de = (b.de ?? {}) as Record<string, unknown>
      const maDe = String(de.maDe ?? de.ma_de ?? '').trim()
      if (!maDe) return ra({ ok: false, error: 'Gói đề không có mã đề' })
      const cau = docCauTuGoiDe(de)
      const r = await dayDeKho(env, {
        maDe,
        de,
        cau,
        tenDe: String(de.tenDe ?? de.ten_de ?? de.ten ?? ''),
        lop: String(de.lop ?? ''),
        chuyenDe: String(de.chuyenDe ?? de.chuyen_de ?? ''),
      })
      const j = (await r.clone().json()) as Record<string, unknown>
      // Đường cũ trả thêm `soNghi` (số câu máy chủ thấy đáng ngờ). Máy chủ mới
      // không đoán chất lượng câu, nên trả 0 chứ không bịa một con số.
      return ra({ ...j, soNghi: 0 })
    }
    case 'xoaDe': return xoaDeKho(env, b)
    // `dungChiMuc` bên đường cũ DỰNG THẬT chỉ mục cả kho. Ở đây nó chạy một lô
    // và trả `conLai` để chỗ gọi lặp — không đếm suông rồi báo xong.
    case 'dungChiMuc': return dungChiMucKho(env, b)

    // ---- PHIẾU -----------------------------------------------------------
    case 'luuPhieu': return ra(await G.luuPhieu(env, b))
    case 'luuNhieuPhieu': return ra(await G.luuNhieuPhieu(env, b))
    case 'xoaPhieu': return ra(await G.xoaPhieu(env, b))
    case 'phieuTheoCa': return ra(await G.phieuTheoCa(env, b))
    case 'nopKhacPhucTheoCa': return ra(await G.nopKhacPhucTheoCa(env, b))

    // ---- HỎI BÀI · TIN NHẮN · LÊN BẢNG ----------------------------------
    case 'danhSachCauHoi': return ra(await G.danhSachCauHoi(env, b))
    case 'xoaCauHoi': return ra(await G.xoaCauHoi(env, b))
    case 'danhDauDaChua': return ra(await G.danhDauDaChua(env, b))
    case 'sendTeacherMessage': return ra(await G.guiTinCuaThay(env, b))
    case 'listMessages': return ra(await G.hopThu(env))
    case 'demTinMoi': return ra(await G.demTinMoi(env))
    case 'markMessagesRead': return ra(await G.danhDauDaDoc(env, b))
    case 'ghiLenBang': return ghiLenBangMoi(env, b)
    case 'lichSuLenBang': return ra(await G.lichSuLenBang(env, b))
    case 'hoSoLopLenBang': return ra(await G.hoSoLopLenBang(env, b))
    case 'hoSoOnCa': return ra(await hoSoOnCa(env, b))

    default:
      return ra({ ok: false, error: `Máy chủ mới chưa dựng lệnh "${act}"` }, 400)
  }
}

const DUONG_QUA_BANG = new Set(['/khoe', '', '/', '/hs', '/hoc-sinh', '/hocsinh', '/ph', '/phu-huynh', '/phuhuynh', '/gv', '/giaovien'])

/** Thêm `mocReset` (CHỈ khi job reset đã xong) vào phản hồi JSON; chưa xong thì trả nguyên phản hồi, KHÔNG có trường. */
async function themMocReset(env: Env, res: Response): Promise<Response> {
  const m = await docMocReset(env)
  if (!m) return res
  try {
    const j = (await res.clone().json()) as Record<string, unknown>
    return ra({ ...j, mocReset: m }, res.status)
  } catch {
    return res
  }
}

export default {
  async scheduled(event:{cron:string}, env:Env) {
    // RESET TOÀN APP (chỉ chạy đúng một lần, sau mốc 00:01 thứ Hai 21/09; trước mốc và sau khi xong thì trả về ngay). PHẢI chạy trước mọi việc khác của cron.
    // Job chia bước (≤ 40 truy vấn D1 mỗi lượt): đang làm/nhường thì các việc cron khác nghỉ lượt này (kế hoạch, tin PH, vinh danh đều dựng lại theo yêu cầu khi có người mở).
    const dangReset=await chayResetNeuDenGio(env,Date.now()).then(r=>{if(r.chay||r.lyDo==='loi'||r.lyDo==='qua_gio')console.log('[reset] cron',JSON.stringify({chay:r.chay,lyDo:r.lyDo,trangThai:r.trangThai?.trangThai,buoc:r.trangThai?.buoc,soTruyVan:r.soTruyVan,loi:r.trangThai?.loi}));return r.chay||r.lyDo==='dang_chay'||r.lyDo==='cho_tiep'}).catch(e=>{console.error('[reset] cron lỗi:',e);return false})
    if(dangReset)return
    if(event.cron==='1 17 * * *'){
      // 00:01 giờ VN: tin phụ huynh + vinh danh như cũ, THÊM chốt ngày cũ và lập kế hoạch ngày mới (GĐ 2).
      // Kế hoạch có lỗi thì chỉ ghi log — không được kéo hai việc cũ đổ theo.
      // THỨ TỰ: kế hoạch ngày TRƯỚC, tin phụ huynh SAU — tin phụ huynh (GĐ 5) đọc số câu từ kế hoạch vừa lập; chạy song song
      // thì tin có thể đọc kế hoạch của ngày cũ hoặc thiếu.
      await chayCaLop(env,Date.now()).then(r=>console.log('[ke-hoach] cron',JSON.stringify(r))).catch(e=>console.error('[ke-hoach] cron lỗi:',e))
      // EXP học tập mới: chốt "đạt ngày/chuỗi" của ngày vừa qua cho em nào chưa được trao (chỉ em đang bật cờ). Lỗi chỉ ghi log.
      await chotExpNgayQua(env,Date.now()).then(r=>console.log('[exp] cron',JSON.stringify(r))).catch(e=>console.error('[exp] cron lỗi:',e))
      await Promise.all([refreshDailyNews(env),dailyHonors(env,false)])
    }else{
      // NHẮC TỰ ĐỘNG bài tập về nhà (luật Boss 21/09): mỗi phút gọi nhưng chỉ chạy MỘT lần/30 phút, trong khung 07:00–21:30 giờ VN, khoá idempotent. Lỗi chỉ ghi log — không kéo `deliverNotices` đổ theo.
      await nhacTuDong(env,Date.now()).then(r=>{if(r.chay)console.log('[nhac-tu-dong] cron',JSON.stringify(r))}).catch(e=>console.error('[nhac-tu-dong] cron lỗi:',e))
      await deliverNotices(env)
    }
  },
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url)
    const p = url.pathname

    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS })
    // RESET TOÀN APP 00:01 thứ Hai 21/09 (reset-toan-app.ts): trong cửa sổ đóng băng [00:00, 00:20] giờ VN mà job CHƯA xong thì mọi lệnh trả lời tử tế để máy khách
    // không coi là lỗi đăng nhập/mất mạng. Ngoài cửa sổ: không tốn truy vấn nào. Chỉ chuyển hướng và /khoe được qua.
    if (!DUONG_QUA_BANG.has(p) && !p.startsWith('/t/') && !p.startsWith('/d/') && (await dangLamMoi(env, Date.now()))) return ra(LOI_DANG_LAM_MOI)
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
    if (req.method === 'GET' && (p === '' || p === '/')) {
      return Response.redirect('https://omr-app-b3u.pages.dev', 302)
    }
    if (req.method === 'GET' && (p === '/hs' || p === '/hoc-sinh' || p === '/hocsinh')) {
      return Response.redirect('https://omr-app-b3u.pages.dev/?vai=hocsinh', 302)
    }
    if (req.method === 'GET' && (p === '/ph' || p === '/phu-huynh' || p === '/phuhuynh')) {
      return Response.redirect('https://omr-app-b3u.pages.dev/?vai=phuhuynh', 302)
    }
    if (req.method === 'GET' && (p === '/gv' || p === '/giaovien')) {
      return Response.redirect('https://omr-app-b3u.pages.dev/?vai=gv', 302)
    }
    if (req.method === 'GET' && (p.startsWith('/t/') || p.startsWith('/d/'))) {
      return Response.redirect(`https://omr-app-b3u.pages.dev${p}`, 302)
    }
    if (req.method !== 'POST') return ra({ ok: false, error: 'Chỉ nhận POST' }, 405)

    try {
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
      if (p === '/hs/dang-nhap') {
        const result = await G.hsDangNhap(env, b)
        if (result.ok && !result.chuaCoMatKhau) {
          try { result.token = await gameToken(env, String(result.sbd)) } catch { /* Game must not block academic login. */ }
        }
        return ra(result)
      }
      if(p.startsWith('/notifications/'))return ra(await notifications(env,p.slice('/notifications/'.length),b))
      if (p === '/daily-honors') return ra(await dailyHonors(env))
      if (p === '/presence') return ra(await recordPresence(env,b))
      if (p.startsWith('/student-news/')) {
        const sbd = await gameIdentity(env,b)
        return ra(await parentNews(env,p.slice('/student-news/'.length),{sbd},'hs'))
      }
      if (p.startsWith('/parent-news/')) return ra(await parentNews(env,p.slice('/parent-news/'.length),b))
      if (p.startsWith('/mom/')) return ra(await mom(env,p.slice('/mom/'.length),b))
      if (p === '/game-v2-parent') return ra(await parentGame(env,b))
      // CỔNG PHỤ HUYNH — token giai đoạn mềm (docs/token-phu-huynh-1909.md): chỉ nhận `pass` (token do thầy cấp).
      if (p === '/ph/xac-dinh') return ra(await phXacDinh(env, b))
      if (p === '/ph/ke-hoach') return ra(await phKeHoach(env, b))
      if (p === '/ph/canh-bao/xem') return ra(await phCanhBaoXem(env, b))
      if (p === '/ph/thoi-gian-hoc') return ra(await phThoiGianHoc(env, b))
      if (p.startsWith('/luyen-de/')) return ra(await luyenDe(env, p.slice('/luyen-de/'.length), b))
      if (p.startsWith('/game-v2/')) return ra(await gameV2(env, p.slice('/game-v2/'.length), b))
      if (p === '/hs/dat-mat-khau') return ra(await G.hsDatMatKhau(env, b))
      if (p === '/hs/lich-su') return ra(await G.hsLichSuCa(env, b))
      if (p === '/hs/cau-sai') return ra(await G.hsCauSai(env, b))
      if (p === '/hs/cau-da-thi') return ra(await G.hsCauDaThi(env, b))
      if (p === '/hs/than-thu') return ra(await G.thanThuDoc(env, b))
      if (p === '/hs/than-thu-ghi') return ra(await G.thanThuGhi(env, b))
      if (p === '/hs/btvn') return ra(await G.hsBtvn(env, b))
      // ĐẤU TRƯỜNG CHÂN LÝ — phòng sáu người. Máy chủ chỉ cất đội hình đã nộp;
      // trận đánh do máy em tính, và nó tất định. Xem `server/src/vo-dai.ts`.
      if (p === '/vo-dai/tao') return ra(await VD.voDaiTao(env, b))
      if (p === '/vo-dai/moi') return ra(await VD.voDaiMoi(env, b))
      if (p === '/vo-dai/loi-moi') return ra(await VD.voDaiLoiMoi(env, b))
      if (p === '/vo-dai/vao') return ra(await VD.voDaiVao(env, b))
      if (p === '/vo-dai/bat-dau') return ra(await VD.voDaiBatDau(env, b))
      if (p === '/vo-dai/xem') return ra(await VD.voDaiXem(env, b))
      if (p === '/vo-dai/nop') return ra(await VD.voDaiNop(env, b))
      if (p === '/vo-dai/dong') return ra(await VD.voDaiDong(env, b))
      // CỔNG TƯƠNG THÍCH — tự phân quyền bên trong, nên đứng TRƯỚC cổng mã bí mật.
      if (p === '/goi') return goiCu(req, env, b)
      if (p === '/btvn/cua-em') return btvnCuaEm(env, b)
      if (p === '/btvn/nop') return nopBtvn(env, b)
      if (p === '/btvn/xong-lo') return xongLoBtvn(env, b)
      // KẾ HOẠCH NGÀY (GĐ 2) — em đọc kế hoạch hôm nay; đặt số phút học mỗi ngày (cần token).
      if (p === '/hs/ke-hoach-ngay') {
        const kh = await hsKeHoachNgayCoExp(env, b)
        // `doanMo` (boolean, chỉ khi ok:true): em này được mở game Đoàn Hộ Tống chưa (cùng nguồn cau_hinh.doan_ho_tong với các lệnh doan-*) — Bảng nhiệm vụ chỉ hiện thẻ khi === true.
        if (kh.ok === true && typeof kh.sbd === 'string') kh.doanMo = await doanMoCho(env, kh.sbd)
        // BỘ NÃO A.I chế độ THẬT: lời nhắn cho ĐÚNG em này (chỉ lời cho em, không lời phụ huynh). Chạy thử/tắt/không có lời ⇒ KHÔNG có khoá `loiNhanHlv` (phản hồi y hệt cũ).
        if (kh.ok === true && typeof kh.sbd === 'string') {
          const loiHlv = await docLoiNhanHlv(env, kh.sbd, typeof kh.ngay === 'string' ? kh.ngay : ngayVn(Date.now()))
          if (loiHlv) kh.loiNhanHlv = loiHlv
        }
        // CẢNH BÁO CỦA THẦY (chỉ thầy bấm mới có): ≤ 3, bài chưa nộp, gửi trong 48 giờ. Không có ⇒ KHÔNG có khoá `canhBaoThay` (phản hồi y hệt cũ).
        if (kh.ok === true && typeof kh.sbd === 'string') {
          const canhBao = await canhBaoChoEm(env, kh.sbd)
          if (canhBao.length > 0) kh.canhBaoThay = canhBao
        }
        return themMocReset(env, ra(kh))
      }
      if (p === '/hs/cau-theo-qid') return ra(await hsCauTheoQid(env, b))
      if (p === '/hs/canh-bao/xem') return ra(await emXemCanhBao(env, await gameIdentity(env, b), String(b.id ?? '')))
      if (p === '/hs/on-lai/nop') return ra(await hsOnLaiNop(env, b))
      if (p === '/hs/thoi-gian-hoc') return ra(await hsThoiGianHoc(env, b))
      // `await` là bắt buộc: trả thẳng promise thì lỗi (vd. token sai) lọt khỏi `catch` bên dưới.
      if (p === '/hs/ca-dang-mo') return themMocReset(env, await hsCaDangMo(env, b))

      // Lệnh của THẦY — đòi mã bí mật.
      if (!laThay(req, env, b)) return ra({ ok: false, error: 'Sai mã bí mật' }, 403)
      if (p === '/teacher-news') return ra(await teacherNews(env,b))
      // Token phụ huynh: cấp liên kết theo danh sách/lớp, và đếm truy cập (token so với SBD trần) để quyết giai đoạn cứng.
      if (p === '/ph/cap-ma') return ra(await phCapMa(env, b))
      if (p === '/ph/dem-truy-cap') return ra(await phDemTruyCap(env, b))
      if (p === '/ho-so/nap-lai') return ra(await napLaiSuKien(env, b.sbd, b.nguon as NguonNapLai | undefined))
      if (p === '/ho-so/kiem-cheo') return ra(await kiemCheoSuKien(env, b.sbd))
      // HỒ SƠ NẮM KIẾN THỨC (GĐ 1) — dựng lại từ sổ (≤ 50 em/lượt), xem một em, đo độ phủ mã dạng.
      if (p === '/ho-so/dung-lai') {
        const ds = Array.isArray(b.sbd) ? (b.sbd as unknown[]).map((x) => String(x ?? '').trim()).filter(Boolean) : []
        if (ds.length === 0 || ds.length > 50) return ra({ ok: false, error: 'Gửi mảng "sbd" từ 1 đến 50 em.' })
        return ra({ ok: true, ...(await dungLaiHoSo(env, ds, new Date().toISOString())) })
      }
      if (p === '/ho-so/xem') return ra({ ok: true, ...(await docHoSoEm(env, String(b.sbd ?? '').trim())) })
      if (p === '/ho-so/do-phu-dang') return ra(await docDoPhuDang(env))
      // Chạy thử reset (chỉ ĐẾM, không ghi): job sẽ xoá bảng nào, bao nhiêu dòng, giữ bảng nào.
      if (p === '/reset/dry-run') return ra(await resetDryRun(env))
      // Chạy tiếp TAY (bỏ qua hạn 01:00; vẫn cần cờ cho phép, không cờ huỷ): MỘT lượt ≤ 40 truy vấn, gọi lặp tới khi trangThai 'xong'.
      if (p === '/reset/chay-tiep') return ra({ ok: true, ...(await chayTiepTay(env, Date.now())) })
      // Đo giới hạn truy vấn D1 mỗi lượt gọi của gói đang dùng (chỉ đọc).
      if (p === '/reset/do-gioi-han') return ra(await doGioiHanTruyVan(env))
      if (p === '/ke-hoach/do-phu-phuc-vu') return ra(await docDoPhuPhucVu(env, ngayVn(Date.now())))
      // Màn HÔM NAY của app giáo viên (docs/hop-dong-gv-hom-nay-2109.md): chỉ đọc, ≤ 8 truy vấn, khối nào không tính được thì null + lyDoThieu.
      if (p === '/ke-hoach/hom-nay-thay') return ra(await homNayThay(env, b))
      // Kế hoạch hôm nay của MỘT em cho màn Học sinh của thầy: CHỈ ĐỌC (không lập kế hoạch, không capNhatExp) để không nuốt `expNhan` của em.
      if (p === '/gv/ke-hoach-em') return ra(await gvKeHoachEm(env, b))
      // HÔM NAY v2 (docs/hop-dong-hom-nay-v2-2109.md): MỘT lệnh GHI (cảnh báo em chưa nộp — chỉ thầy bấm mới gửi).
      if (p === '/gv/canh-bao-nop-bai') return ra(await guiCanhBao(env, b))
      if (p === '/gv/nhac-tu-dong') return ra(await gvNhacTuDong(env, b))
      // NĂM lệnh ĐỌC-CHỈ (≤ 12 truy vấn, đo ở `soTruyVan`): ô Việc gấp, Em cần thầy giúp, Vinh danh, tra cứu, Toàn cảnh một em.
      if (p === '/gv/chua-nop') return ra(await gvChuaNop(env, b))
      if (p === '/gv/can-giup') return ra(await gvCanGiup(env, b))
      if (p === '/gv/vinh-danh-ngay') return ra(await gvVinhDanhNgay(env, b))
      if (p === '/gv/tim-em') return ra(await gvTimEm(env, b))
      if (p === '/gv/em-toan-canh') return ra(await gvEmToanCanh(env, b))
      // TÊN LỚP (docs/hop-dong-ten-lop-2109.md): `/gv/lop` ĐỌC-CHỈ; `/gv/doi-lop-em` GHI cột `hoc_sinh.ten_lop` của MỘT em (không đụng `lop` = khối).
      if (p === '/gv/lop') return ra(await gvLop(env))
      if (p === '/gv/doi-lop-em') return ra(await gvDoiLopEm(env, b))
      if (p === '/ke-hoach/chay-ca-lop') return ra({ ok: true, ...(await chayCaLop(env, Date.now())) })
      if (p === '/game-v2-admin') return ra(await adminGame(env,b))
      if (p === '/ca/day') return dayCa(env, b)
      if (p === '/ca/xac-nhan') {
        const maCa = String(b.maCa ?? '')
        const ca = await docCa(env, maCa)
        const khop = ca && ca.bat_dau === String(b.batDau ?? '') && (ca.ten_ca || '') === String(b.tenCa ?? '')
        const de = khop && b.canDe ? await env.DE.get(ca!.bank_r2 || `de/${maCa}.json`) : true
        const key = khop && b.canKey ? await env.DE.get(`key/${maCa}.json`) : true
        return ra({ ok: true, daLuu: !!(khop && de && key) })
      }
      if (p === '/danh-sach/day') return dayDanhSach(env, b)
      if (p === '/phieu/day') return dayPhieu(env, b)
      if (p === '/phieu/xoa') return xoaPhieuR2(env, String(b.ma ?? ''))
      if (p === '/chua-day') return chuaDay(env, String(b.maCa ?? ''))
      if (p === '/da-day') return danhDauDaDay(env, b)
      if (p === '/ca/bat-dau') return batDauThi(env, String(b.maCa ?? ''), b.dongBoGio)
      if (p === '/theo-doi') return xemTheoDoi(env, String(b.maCa ?? ''))
      if (p === '/ca/luot') return luotCuaCa(env, String(b.maCa ?? ''))
      if (p === '/ca/nhieu') return dayNhieuCa(env, b)
      if (p === '/ca/danh-sach') return themMocReset(env, await danhSachCaMoi(env, b.daXoa === true)) // đường CHÍNH app thầy (Code 1): phải mang `mocReset` như /goi danhSachCa
      if (p === '/ca/sua') return suaCa(env, b)
      if (p === '/ca/xoa-vinh-vien') return ra(await G.xoaVinhVienCa(env, b))
      if (p === '/ca/chi-tiet') return chiTietCaMoi(env, String(b.maCa ?? ''))
      // THÊM PHÚT cho ca đang chạy (docs/hop-dong-them-phut-2109.md): chỉ cộng, trần 30 phút mỗi ca.
      if (p === '/ca/them-phut') return ra(await themPhutCa(env, b))
      // ĐỔI TÊN một học sinh (docs/hop-dong-doi-ten-hoc-sinh-2109.md): chỉ cột tên, 5 bảng; giữ phieu/chan_vao.
      if (p === '/hoc-sinh/doi-ten') return ra(await doiTenHocSinh(env, b))
      if (p === '/diem') return ghiDiemMoi(env, b)
      if (p === '/em/danh-sach') return danhSachEmMoi(env)
      if (p === '/ca/nap-day-du') return napDayDuCa(env, b)
      if (p === '/doi-chieu') return doiChieuSo(env)
      if (p === '/cham-diem') return chamDiem(env, b)
      if (p === '/em/tien-do') return tienDoEm(env, String(b.sbd ?? ''))
      if (p === '/em/cau-sai') return cauSaiCuaEm(env, b)
      if (p === '/len-bang') return ghiLenBangMoi(env, b)
      if (p === '/kho/day') return dayDeKho(env, b)
      if (p === '/kho/danh-sach') return danhSachDeKho(env, b)
      if (p === '/kho/lay') return layDeKho(env, String(b.maDe ?? ''))
      if (p === '/kho/xoa') return xoaDeKho(env, b)
      if (p === '/kho/rut-cau') return rutCau(env, b)
      if (p === '/kho/chi-muc') return dungChiMucKho(env, b)
      if (p === '/btvn/sua') return suaBtvn(env,b)
      if (p === '/btvn/cho-lam-lai') return ra(await ND.choLamLaiCaNhan(env, b, Date.now()))
      // BỘ NÃO A.I (Code 1, `bo-nao.ts`; hợp đồng docs/hop-dong-bo-nao-2109.md): MỌI lệnh /ai/* là lệnh THẦY — nằm SAU cổng `laThay`; các hàm tự trả {ok,…}, không tự kiểm mã.
      if (p === '/ai/cau-hinh') return ra(await AI.boNaoCauHinh(env, b))
      if (p === '/ai/ho-so-ngay') return ra(await AI.boNaoHoSoNgay(env, b))
      if (p === '/ai/dieu-chinh/nop') return ra(await AI.boNaoNop(env, b))
      // TÊN DẠNG cạnh mã dạng (chuẩn từ ngữ luật 4: mã nội bộ không hiện cho thầy) — lớp mỏng `ten-dang-bo-nao.ts`, không sửa lõi Bộ não.
      if (p === '/ai/dem-qua') return ra(await themTenDangDemQua(env, await AI.boNaoDemQua(env, b)))
      if (p === '/ai/nhat-ky') return ra(await themTenDangNhatKy(env, await AI.boNaoNhatKy(env, b)))
      if (p === '/ai/dieu-chinh/bo') return ra(await AI.boNaoBoDieuChinh(env, b))
      if (p === '/btvn/giao') return giaoBtvn(env, b)
      if (p === '/btvn/xem-truoc') return ra(await ND.xemTruocBtvn(env, b, Date.now()))
      if (p === '/btvn/bai-lam') return xemBaiBtvn(env,b)
      if (p === '/btvn/theo-doi') return theoDoiBtvn(env, b)
      if (p === '/dong-bo/dau') return ghiDauDongBo(env, b)
      if (p === '/cho') return xemPhongCho(env, String(b.maCa ?? ''))

      return ra({ ok: false, error: 'Không có đường này' }, 404)
    } catch (e) {
      return ra({ ok: false, error: e instanceof Error ? e.message : 'Lỗi máy chủ' }, 500)
    }
  },
}
