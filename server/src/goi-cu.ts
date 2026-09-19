import {gradeHomework,homeworkQuestions,homeworkKeys,isAnswerCorrect} from './btvn-grading'
import {ghiSuKien,ghiSuKienThi,suKienChamBai,suKienTuKetQuaCham,type CauChamBai} from './su-kien-hoc'
import { hopLe3DangChuan } from './loc-cau-chuan'
// CỔNG TƯƠNG THÍCH `/goi` — CẮT HẲN GOOGLE.
//
// Thầy chốt 12/09 rạng sáng: "gỡ sạch google, toàn bộ app phải được chạy trên
// máy chủ mới". App đang gọi Apps Script bằng 67 lệnh dạng `{action: '...'}`.
// Viết lại 67 chỗ gọi trong một đêm là cách chắc chắn nhất để làm hỏng một thứ
// đang chạy, nên đường đi là NGƯỢC LẠI: giữ nguyên dáng lệnh cũ, đổi nơi nhận.
//
// Một cổng, một bảng dịch, mỗi lệnh một hàm đọc thẳng D1. Màn hình không đổi
// một dòng nào, và `grep script.google.com src/` phải ra 0 — đó là thước đo.
//
// BA LUẬT GIỮ NGUYÊN TỪ `index.ts`:
//   1. Mỗi lệnh 1–3 câu truy vấn. Vòng lặp truy vấn theo số em là chạm trần 50.
//   2. Gói đề và gói phiếu nằm ở R2, D1 chỉ giữ khoá và phần tra cứu.
//   3. Lệnh của HỌC SINH không đòi mã bí mật; lệnh của THẦY thì đòi. Bảng
//      `LENH_CUA_THAY` dưới đây là nơi duy nhất quyết định điều đó.
import type { D1PreparedStatement, Env } from './kieu'

export const NAY = (): string => new Date().toISOString()

// ĐẾM BẢNG CHẤM — CÙNG MỘT LUẬT VỚI `src/lib/dem-ket-qua.ts`.
//
// Thầy bắt được 14/09, ca 814335 "Test4": em được 2,00 điểm phần II mà báo cáo
// in "Đúng 0/12 câu · Sai 12 câu". Hai lỗi đếm nằm ngay trong câu SQL cũ:
//
//   1. `COALESCE(dung_sai, 0) = 0` gộp CÂU BỎ TRỐNG vào câu sai. Em hết giờ bỏ
//      trống 5 câu bị báo là làm sai 5 câu.
//   2. Phần II chỉ tính "đúng" khi trúng CẢ BỐN Ý, nên câu đúng 3/4 ý — có
//      điểm hẳn hoi — bị đếm là sai trọn. Ca Test4 có đúng hai câu như thế: em
//      chọn SDDS/DDDS trong khi đáp án là DDDS/DDDD, tức sáu ý đúng trên tám.
//
// Nay tách bốn nhóm RỜI NHAU: đúng · đúng một phần (chỉ phần II) · sai · bỏ
// trống, cộng lại đúng bằng tổng. Trả thêm số Ý phần II, vì ý mới là đơn vị máy
// chấm điểm.
//
// Số ý mỗi câu phần II luôn là 4: phần II của hệ này dựng từ đúng 4 `ideas` và
// xáo bằng `seededPermutation(4, …)`. Đó là cấu trúc, không phải con số đoán.
const CHON_CHUAN = "replace(replace(upper(COALESCE(dap_an_chon,'')),'Đ','D'),'đ','D')"
const DUNG_CHUAN = "replace(replace(upper(COALESCE(dap_an_dung,'')),'Đ','D'),'đ','D')"
/** Số Ý ĐÚNG của một dòng phần II. Ô chưa tô (`-`) không bao giờ tính là đúng. */
const Y_DUNG = [1, 2, 3, 4]
  .map(
    (i) =>
      `(CASE WHEN substr(${CHON_CHUAN},${i},1) IN ('D','S')` +
      ` AND substr(${CHON_CHUAN},${i},1) = substr(${DUNG_CHUAN},${i},1) THEN 1 ELSE 0 END)`,
  )
  .join(' + ')
export const CHON_DEM_BANG_CHAM = `COUNT(*) AS n,
       SUM(CASE WHEN dung_sai = 1 THEN 1 ELSE 0 END) AS dung,
       SUM(CASE WHEN dung_sai IS NULL THEN 1 ELSE 0 END) AS trong,
       SUM(CASE WHEN dung_sai = 0 AND phan = 'II' AND (${Y_DUNG}) > 0 THEN 1 ELSE 0 END) AS mot_phan,
       SUM(CASE WHEN dung_sai = 0 AND NOT (phan = 'II' AND (${Y_DUNG}) > 0) THEN 1 ELSE 0 END) AS sai,
       SUM(CASE WHEN phan = 'II' THEN (${Y_DUNG}) ELSE 0 END) AS y_dung,
       SUM(CASE WHEN phan = 'II' THEN 4 ELSE 0 END) AS y_tong`

export interface DemBangCham {
  tong: number
  dung: number
  motPhan: number
  sai: number
  trong: number
  yDung: number
  yTong: number
}

export function docDemBangCham(x: Record<string, unknown>): DemBangCham {
  return {
    tong: Number(x.n) || 0,
    dung: Number(x.dung) || 0,
    motPhan: Number(x.mot_phan) || 0,
    sai: Number(x.sai) || 0,
    trong: Number(x.trong) || 0,
    yDung: Number(x.y_dung) || 0,
    yTong: Number(x.y_tong) || 0,
  }
}

/** Bốn con số đếm câu + hai con số đếm ý, gắn y hệt nhau vào mọi gói trả về cho
 * cả ba cổng. Ca chưa chấm ⇒ `null` hết, để màn hình giấu dòng đi chứ không in
 * "Đúng 0/0 câu". */
/** Cùng luật đếm, nhưng viết dưới dạng CÂU CON theo từng lượt thi — `hsLichSuCa`
 * cần đếm theo bộ ba (ma_ca, sbd, lan_thu) chứ không gộp theo ca. */
export function cauConDem(ten: string, dieuKien: string): string {
  return `(SELECT COUNT(*) FROM chi_tiet_cau t WHERE t.ma_ca = l.ma_ca AND t.sbd = l.sbd AND t.lan_thu = l.lan_thu AND ${dieuKien}) AS ${ten}`
}
export function cauConTong(ten: string, bieuThuc: string): string {
  return `(SELECT COALESCE(SUM(${bieuThuc}), 0) FROM chi_tiet_cau t WHERE t.ma_ca = l.ma_ca AND t.sbd = l.sbd AND t.lan_thu = l.lan_thu AND t.phan = 'II') AS ${ten}`
}
/** Cùng biểu thức `Y_DUNG` nhưng gọi cột qua bí danh `t` của câu con. */
export const Y_DUNG_T = Y_DUNG.replace(/dap_an_chon/g, 't.dap_an_chon').replace(/dap_an_dung/g, 't.dap_an_dung')

/** CÙNG LUẬT ĐẾM, CHẠY TRÊN MẢNG DÒNG BẢNG CHẤM trong bộ nhớ.
 *
 * Dùng khi ca chưa có `chi_tiet_cau` và máy chủ vừa tự chấm lại từ bài đã nộp:
 * lúc ấy chưa có gì trong bảng để SQL đếm, nhưng kết quả phải ra ĐÚNG con số mà
 * câu SQL kia sẽ cho ở lần đọc sau. */
export function demTuChiTiet(ds: Array<Record<string, unknown>>): DemBangCham {
  const ra: DemBangCham = { tong: 0, dung: 0, motPhan: 0, sai: 0, trong: 0, yDung: 0, yTong: 0 }
  const chuan = (v: unknown) => chuoi(v).trim().toUpperCase().replace(/Đ/g, 'D')
  for (const c of ds) {
    ra.tong++
    const ds1 = c.dung_sai === null || c.dung_sai === undefined ? null : Number(c.dung_sai) === 1
    if (chuoi(c.phan) === 'II') {
      const chon = chuan(c.dap_an_chon)
      const dung = chuan(c.dap_an_dung)
      let y = 0
      for (let i = 0; i < Math.min(chon.length, dung.length, 4); i++) {
        if ((chon[i] === 'D' || chon[i] === 'S') && chon[i] === dung[i]) y++
      }
      ra.yTong += 4
      ra.yDung += y
      if (ds1 === true) ra.dung++
      else if (ds1 === null) ra.trong++
      else if (y > 0) ra.motPhan++
      else ra.sai++
      continue
    }
    if (ds1 === true) ra.dung++
    else if (ds1 === null) ra.trong++
    else ra.sai++
  }
  return ra
}

export function goiDemCau(d: DemBangCham | undefined) {
  return {
    tongCau: d ? d.tong : null,
    soCauDung: d ? d.dung : null,
    soCauSai: d ? Math.max(0, d.tong - d.dung) : null,
    soCauDungMotPhan: d ? d.motPhan : null,
    soCauBoTrong: d ? d.trong : null,
    soYDungII: d ? d.yDung : null,
    soYTongII: d ? d.yTong : null,
    // SỐ CÂU CẦN KHẮC PHỤC = mọi câu KHÔNG đúng trọn vẹn (thầy chốt 14/09:
    // "Câu bỏ trống cũng được tính vào khắc phục câu sai, câu đúng sai mà
    // không đúng hết thì cũng tính vào khắc phục câu sai"). Đúng bằng số dòng
    // `hsCauSai` trả về, vì lệnh ấy lọc `COALESCE(dung_sai,0) = 0`.
    soCanKhacPhuc: d ? Math.max(0, d.tong - d.dung) : null,
  }
}



export function chuoi(v: unknown): string {
  return v === null || v === undefined ? '' : String(v)
}

export function soHoacNull(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export function doJson(v: unknown): unknown {
  if (typeof v !== 'string' || v === '') return null
  try {
    return JSON.parse(v)
  } catch {
    return null
  }
}

/** Đọc một khoá cấu hình (thay Script property). */
export async function layCauHinh(env: Env, khoa: string): Promise<unknown> {
  const r = await env.DB.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?').bind(khoa).first<{ gia_tri: string }>()
  return doJson(r?.gia_tri)
}

export async function ghiCauHinh(env: Env, khoa: string, gia: unknown): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES (?, ?, ?)
     ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri, cap_nhat_luc = excluded.cap_nhat_luc`,
  )
    .bind(khoa, JSON.stringify(gia ?? null), NAY())
    .run()
}

// ===========================================================================
// HỒ SƠ EM — chuyên đề mạnh/yếu + lịch sử ca, tổng hợp sẵn bằng 3 câu.
//
// Apps Script đọc hai sheet TienDoHS/TienDoCa. Ở đây `tien_do_hs` đã được
// `/cham-diem` dựng lại mỗi lần chấm, nên chỉ việc đọc.
// ===========================================================================

export async function hoSoEm(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sbd = chuoi(b.sbd).trim()
  if (!sbd) return { ok: false, error: 'Thiếu số báo danh' }

  const em = await env.DB.prepare(
    `SELECT d.sbd, d.ho_ten, d.nam_sinh, d.lop FROM danh_sach d WHERE d.sbd = ?`,
  )
    .bind(sbd)
    .first<Record<string, unknown>>()

  const rCd = await env.DB.prepare('SELECT chuyen_de, so_cau, so_sai FROM tien_do_hs WHERE sbd = ? ORDER BY chuyen_de')
    .bind(sbd)
    .all<Record<string, unknown>>()

  // Lịch sử ca: một câu, nối sang `ca` để lấy tên ca. Không đọc điểm cả lớp ở
  // đây — hạng và sĩ số do máy thầy tính, đúng như đường cũ.
  const rCa = await env.DB.prepare(
    `SELECT l.ma_ca, l.lan_thu, l.nop_luc, l.trang_thai, l.diem_i, l.diem_ii, l.diem_iii, l.tong,
            l.so_lan_roi_man, l.dap_an_json, c.ten_ca, c.lop, c.bo_theo_em_json, c.so_cau_json
       FROM luot l LEFT JOIN ca c ON c.ma_ca = l.ma_ca
      WHERE l.sbd = ? ORDER BY l.nop_luc DESC LIMIT 200`,
  )
    .bind(sbd)
    .all<Record<string, unknown>>()

  // SỐ CÂU THẬT CỦA TỪNG CA, đếm một lần từ bảng chấm — xem ghi chú ở
  // `lichSuEm`. Màn Hồ sơ của em và báo cáo phụ huynh đều đọc ba số này; thiếu
  // chúng thì màn tự suy ra từ điểm và in "Đúng 6/40 câu" cho một ca 12 câu.
  const demCa = new Map<string, DemBangCham>()
  const maDs = [...new Set((rCa.results ?? []).map((x) => chuoi(x.ma_ca)).filter(Boolean))]
  if (maDs.length > 0) {
    const o = maDs.map(() => '?').join(',')
    const rd = await env.DB.prepare(
      `SELECT ma_ca, ${CHON_DEM_BANG_CHAM}
         FROM chi_tiet_cau WHERE sbd = ? AND ma_ca IN (${o}) GROUP BY ma_ca`,
    )
      .bind(sbd, ...maDs)
      .all<Record<string, unknown>>()
    for (const x of rd.results ?? []) {
      demCa.set(chuoi(x.ma_ca), docDemBangCham(x))
    }
  }

  // Tự động chữa lành cho các ca đã nộp mà chưa có dòng trong chi_tiet_cau
  for (const x of rCa.results ?? []) {
    const maCa = chuoi(x.ma_ca)
    if (!demCa.has(maCa) && x.dap_an_json && env.DE) {
      const bData = await docBankDe(env, maCa)
      if (bData) {
        let dapAnObj: any = null
        try { dapAnObj = typeof x.dap_an_json === 'string' ? JSON.parse(x.dap_an_json) : x.dap_an_json } catch {}
        if (dapAnObj) {
          const dg = danhGiaLuot(bData, x, dapAnObj, sbd, maCa, Number(x.lan_thu) || 1, chuoi(x.ten_ca))
          const d = demTuChiTiet(dg.dsChiTiet)
          demCa.set(maCa, d)
          void luuChiTietCauNeuChuaCo(env, maCa, sbd, Number(x.lan_thu) || 1, dg.dsChiTiet, dg.dsCauSai)
        }
      }
    }
  }

  const ca = (rCa.results ?? []).map((x) => {
    const d = demCa.get(chuoi(x.ma_ca))
    return {
      maCa: chuoi(x.ma_ca),
      tenCa: chuoi(x.ten_ca),
      lop: chuoi(x.lop),
      lanThu: Number(x.lan_thu) || 1,
      nopLuc: chuoi(x.nop_luc),
      trangThai: chuoi(x.trang_thai),
      diemI: soHoacNull(x.diem_i),
      diemII: soHoacNull(x.diem_ii),
      diemIII: soHoacNull(x.diem_iii),
      tong: soHoacNull(x.tong),
      ...goiDemCau(d),
      hang: null,
      siSo: null,
      soLanRoiMan: Number(x.so_lan_roi_man) || 0,
    }
  })

  // CA GẦN NHẤT ĐÃ CHẤM — phiếu gửi phụ huynh dùng số của riêng ca này.
  const caGanNhat = ca.find((c) => c.tong !== null) ?? null

  let chuyenDeCaGanNhat: { ten: string; soCau: number; soSai: number }[] = []
  let soCauSaiCaGanNhat = 0
  if (caGanNhat) {
    const rG = await env.DB.prepare('SELECT chuyen_de, so_cau, so_sai FROM tien_do_ca WHERE ma_ca = ? AND sbd = ? ORDER BY chuyen_de')
      .bind(caGanNhat.maCa, sbd)
      .all<Record<string, unknown>>()
    chuyenDeCaGanNhat = (rG.results ?? []).map((x) => ({
      ten: chuoi(x.chuyen_de),
      soCau: Number(x.so_cau) || 0,
      soSai: Number(x.so_sai) || 0,
    }))
    soCauSaiCaGanNhat = chuyenDeCaGanNhat.reduce((t, x) => t + x.soSai, 0)
  }

  return {
    ok: true,
    em: {
      sbd,
      hoTen: chuoi(em?.ho_ten),
      namSinh: chuoi(em?.nam_sinh),
      lop: chuoi(em?.lop),
    },
    chuyenDe: (rCd.results ?? []).map((x) => {
      const soCau = Number(x.so_cau) || 0
      const soSai = Number(x.so_sai) || 0
      return {
        ten: chuoi(x.chuyen_de),
        soCau,
        soSai,
        tiLeSai: soCau > 0 ? soSai / soCau : 0,
        // Xu hướng đòi chuỗi thời gian từng ca; bảng cộng dồn không nói được
        // điều đó, nên khai đúng 'chua_du' thay vì bịa ra một chiều mũi tên.
        xuHuong: 'chua_du',
      }
    }),
    ca,
    caGanNhat,
    chuyenDeCaGanNhat,
    soCauSaiCaGanNhat,
  }
}

export async function hoSoNhieuEm(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const ds = Array.isArray(b.sbd) ? (b.sbd as unknown[]).map((x) => chuoi(x).trim()).filter(Boolean) : []
  const items: unknown[] = []
  // TRẦN 50 CÂU MỘT LƯỢT GỌI: mỗi em tốn 3–4 câu, nên cắt ở 12 em một lượt và
  // để máy thầy gọi nhiều lượt. Thà chậm hơn là lượt gọi chết giữa chừng.
  for (const sbd of ds.slice(0, 12)) {
    const r = await hoSoEm(env, { sbd })
    if (r.ok) items.push(r)
  }
  return { ok: true, items, conLai: Math.max(0, ds.length - 12) }
}

// ===========================================================================
// TIN NHẮN
// ===========================================================================

export async function guiTin(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const noiDung = chuoi(b.noiDung).trim()
  if (!noiDung) return { ok: false, error: 'Tin nhắn rỗng' }
  const tu = chuoi(b.sbd).trim() || chuoi(b.sdt).trim()
  const vai = chuoi(b.nguoiGui) === 'hocsinh' ? 'hs' : 'ph'
  await env.DB.prepare('INSERT INTO tin_nhan (tu, den, vai, noi_dung, da_doc, gui_luc) VALUES (?, ?, ?, ?, 0, ?)')
    .bind(tu, 'thay', vai, noiDung, NAY())
    .run()
  return { ok: true }
}

export async function guiTinCuaThay(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sbd = chuoi(b.sbd).trim()
  const noiDung = chuoi(b.noiDung).trim()
  if (!sbd || !noiDung) return { ok: false, error: 'Thiếu số báo danh hoặc nội dung' }
  await env.DB.prepare('INSERT INTO tin_nhan (tu, den, vai, noi_dung, da_doc, gui_luc) VALUES (?, ?, ?, ?, 0, ?)')
    .bind('thay', sbd, 'hs', noiDung, NAY())
    .run()
  return { ok: true }
}

export async function hopThu(env: Env): Promise<Record<string, unknown>> {
  const r = await env.DB.prepare(
    `SELECT t.id, t.tu, t.vai, t.noi_dung, t.da_doc, t.gui_luc,
            COALESCE(d.ho_ten,'') AS ho_ten, COALESCE(d.lop,'') AS lop
       FROM tin_nhan t LEFT JOIN danh_sach d ON d.sbd = t.tu
      WHERE t.den = 'thay' ORDER BY t.gui_luc DESC LIMIT 300`,
  ).all<Record<string, unknown>>()
  return {
    ok: true,
    items: (r.results ?? []).map((x) => ({
      id: chuoi(x.id),
      sdt: '',
      hoTenPhuHuynh: chuoi(x.vai) === 'ph' ? chuoi(x.ho_ten) : '',
      sbd: chuoi(x.tu),
      lop: chuoi(x.lop),
      hoTenHocSinh: chuoi(x.ho_ten),
      noiDung: chuoi(x.noi_dung),
      thoiGian: chuoi(x.gui_luc),
      daDoc: Number(x.da_doc) === 1,
      nguoiGui: chuoi(x.vai) === 'ph' ? 'phuhuynh' : 'hocsinh',
    })),
  }
}

export async function demTinMoi(env: Env): Promise<Record<string, unknown>> {
  const r = await env.DB.prepare(
    `SELECT COUNT(*) AS tong, SUM(CASE WHEN da_doc = 0 THEN 1 ELSE 0 END) AS chua FROM tin_nhan WHERE den = 'thay'`,
  ).first<{ tong: number; chua: number }>()
  return { ok: true, tong: Number(r?.tong) || 0, soChuaDoc: Number(r?.chua) || 0 }
}

export async function danhDauDaDoc(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const ids = Array.isArray(b.ids) ? (b.ids as unknown[]).map((x) => chuoi(x).trim()).filter(Boolean) : []
  if (ids.length === 0) return { ok: true, soDong: 0 }
  // MỘT CÂU cho cả danh sách — vòng lặp UPDATE theo từng id là đường chạm trần.
  const cho = ids.map(() => '?').join(',')
  const r = await env.DB.prepare(`UPDATE tin_nhan SET da_doc = 1 WHERE id IN (${cho})`).bind(...ids).run()
  return { ok: true, soDong: r.meta.changes ?? 0 }
}

// ===========================================================================
// HỎI BÀI THẦY
// ===========================================================================

export async function guiCauHoi(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sbd = chuoi(b.sbd).trim()
  const maCa = chuoi(b.maCa).trim()
  if (!sbd) return { ok: false, error: 'Thiếu số báo danh' }
  // Máy em gửi `qids` (mảng mã câu em tick) + `ghiChu`. Giữ NGUYÊN thứ tự em
  // tick — thứ tự ấy là thứ tự em muốn hỏi.
  const qids = Array.isArray(b.qids) ? (b.qids as unknown[]).map((x) => chuoi(x).trim()).filter(Boolean) : []
  const ghiChu = chuoi(b.ghiChu).trim()
  if (qids.length === 0 && !ghiChu) return { ok: false, error: 'Không có câu hỏi nào' }

  // MỘT LƯỢT GỬI = MỘT MỐC THỜI GIAN, dùng chung cho mọi dòng. Nhờ vậy chỗ đọc
  // gom lại được đúng một lượt bấm gửi của em.
  const nay = NAY()
  const lenh = qids.map((q) =>
    env.DB.prepare('INSERT INTO cau_hoi_em (sbd, ma_ca, qid, noi_dung, da_chua, da_xoa, luc) VALUES (?, ?, ?, ?, 0, 0, ?)').bind(sbd, maCa, q, '', nay),
  )
  if (ghiChu) {
    lenh.push(
      env.DB.prepare('INSERT INTO cau_hoi_em (sbd, ma_ca, qid, noi_dung, da_chua, da_xoa, luc) VALUES (?, ?, ?, ?, 0, 0, ?)').bind(sbd, maCa, '', ghiChu, nay),
    )
  }
  for (let i = 0; i < lenh.length; i += 40) await env.DB.batch(lenh.slice(i, i + 40))
  return { ok: true, soCau: qids.length, guiLuc: nay }
}

export async function danhSachCauHoi(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa).trim()
  const thungRac = b.thungRac === true
  const dk = maCa ? 'q.ma_ca = ? AND q.da_xoa = ?' : 'q.da_xoa = ?'
  const tham = maCa ? [maCa, thungRac ? 1 : 0] : [thungRac ? 1 : 0]
  const r = await env.DB.prepare(
    `SELECT q.*, COALESCE(d.ho_ten,'') AS ho_ten, COALESCE(c.ten_ca,'') AS ten_ca
       FROM cau_hoi_em q
       LEFT JOIN danh_sach d ON d.sbd = q.sbd
       LEFT JOIN ca c ON c.ma_ca = q.ma_ca
      WHERE ${dk} ORDER BY q.luc DESC LIMIT 500`,
  )
    .bind(...tham)
    .all<Record<string, unknown>>()

  // GOM THEO (ca, em, lúc gửi): màn "Học sinh hỏi" đọc MỘT dòng cho một lượt
  // em bấm gửi, kèm danh sách mã câu — không phải mỗi câu một dòng.
  const theo = new Map<string, Record<string, unknown>>()
  for (const x of r.results ?? []) {
    const khoa = `${chuoi(x.ma_ca)}|${chuoi(x.sbd)}|${chuoi(x.luc)}`
    let d = theo.get(khoa)
    if (!d) {
      d = {
        maCa: chuoi(x.ma_ca),
        tenCa: chuoi(x.ten_ca),
        sbd: chuoi(x.sbd),
        hoTen: chuoi(x.ho_ten),
        qids: [] as string[],
        ghiChu: '',
        guiLuc: chuoi(x.luc),
        daChua: Number(x.da_chua) === 1,
        chuaLuc: '',
        xoa: Number(x.da_xoa) === 1 ? chuoi(x.luc) : '',
      }
      theo.set(khoa, d)
    }
    const qid = chuoi(x.qid)
    if (qid) (d.qids as string[]).push(qid)
    // Ghi chú của em: nối các dòng có nội dung, KHÔNG cắt bớt.
    const noi = chuoi(x.noi_dung).trim()
    if (noi) d.ghiChu = d.ghiChu ? `${d.ghiChu}\n${noi}` : noi
  }
  return { ok: true, items: [...theo.values()] }
}

export async function xoaCauHoi(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa).trim()
  const khoiPhuc = b.khoiPhuc === true
  const tatCa = b.tatCa === true
  const dat = khoiPhuc ? 0 : 1
  const nguoc = khoiPhuc ? 1 : 0
  const r = tatCa
    ? await env.DB.prepare('UPDATE cau_hoi_em SET da_xoa = ? WHERE da_xoa = ?').bind(dat, nguoc).run()
    : await env.DB.prepare('UPDATE cau_hoi_em SET da_xoa = ? WHERE ma_ca = ? AND da_xoa = ?').bind(dat, maCa, nguoc).run()
  return { ok: true, soDong: r.meta.changes ?? 0, soCa: tatCa ? 0 : 1 }
}

export async function danhDauDaChua(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa).trim()
  const sbd = chuoi(b.sbd).trim()
  const chua = b.chua === false ? 0 : 1
  const r = sbd
    ? await env.DB.prepare('UPDATE cau_hoi_em SET da_chua = ? WHERE ma_ca = ? AND sbd = ?').bind(chua, maCa, sbd).run()
    : await env.DB.prepare('UPDATE cau_hoi_em SET da_chua = ? WHERE ma_ca = ?').bind(chua, maCa).run()
  return { ok: true, soDong: r.meta.changes ?? 0 }
}

// ===========================================================================
// SỔ PHIẾU — nội dung ở R2, tra cứu ở D1.
// ===========================================================================

export async function luuPhieu(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const ma = chuoi(b.ma).trim()
  if (!ma) return { ok: false, error: 'Thiếu mã phiếu' }
  if (!env.DE) return { ok: false, error: 'Chưa nối R2 — chưa lưu phiếu được' }
  const nay = NAY()
  const goi = {
    ma,
    maCa: chuoi(b.maCa),
    sbd: chuoi(b.sbd),
    hoTen: chuoi(b.hoTen),
    loai: chuoi(b.loai) || 'ketqua',
    phieu: b.phieu ?? null,
    ghiLuc: nay,
  }
  await env.DE.put(`phieu/${ma}.json`, JSON.stringify(goi))
  await env.DB.prepare(
    `INSERT INTO phieu (ma, ma_ca, sbd, ho_ten, loai, so_lan_xem, thu_hoi, luu_luc)
     VALUES (?, ?, ?, ?, ?, 0, 0, ?)
     ON CONFLICT(ma) DO UPDATE SET ma_ca = excluded.ma_ca, sbd = excluded.sbd,
       ho_ten = excluded.ho_ten, loai = excluded.loai, thu_hoi = 0, luu_luc = excluded.luu_luc`,
  )
    .bind(ma, goi.maCa, goi.sbd, goi.hoTen, goi.loai, nay)
    .run()
  return { ok: true }
}

export async function luuNhieuPhieu(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const items = Array.isArray(b.items) ? (b.items as Record<string, unknown>[]) : []
  const daLuu: { sbd: string; ma: string }[] = []
  const loi: { sbd: string; vi_sao: string }[] = []
  for (const it of items) {
    const r = await luuPhieu(env, it)
    if (r.ok) daLuu.push({ sbd: chuoi(it.sbd), ma: chuoi(it.ma) })
    else loi.push({ sbd: chuoi(it.sbd), vi_sao: chuoi(r.error) })
  }
  return { ok: true, daLuu, loi }
}

/** ĐỌC PHIẾU — lệnh CÔNG KHAI duy nhất trả nội dung. Đếm lượt mở để thầy biết
 * phụ huynh đã xem hay chưa; đếm hỏng thì vẫn trả phiếu. */
export async function layPhieu(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const ma = chuoi(b.ma).trim()
  if (!ma) return { ok: false, error: 'Thiếu mã phiếu' }
  if (!env.DE) return { ok: false, error: 'Không tìm thấy phiếu' }
  const o = await env.DE.get(`phieu/${ma}.json`)
  if (!o) return { ok: false, error: 'Không tìm thấy phiếu' }
  let goi: Record<string, unknown> | null = null
  try {
    goi = (await new Response(o.body).json()) as Record<string, unknown>
  } catch {
    goi = null
  }
  if (!goi || goi.thuHoi === true || goi.phieu === null) return { ok: false, error: 'Không tìm thấy phiếu' }
  await env.DB.prepare('UPDATE phieu SET so_lan_xem = so_lan_xem + 1 WHERE ma = ?').bind(ma).run().catch(() => {})
  return { ok: true, phieu: goi.phieu }
}

export async function xoaPhieu(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const ma = chuoi(b.ma).trim()
  if (!ma) return { ok: false, error: 'Thiếu mã phiếu' }
  if (env.DE) await env.DE.put(`phieu/${ma}.json`, JSON.stringify({ ma, thuHoi: true, phieu: null, ghiLuc: NAY() }))
  await env.DB.prepare('UPDATE phieu SET thu_hoi = 1 WHERE ma = ?').bind(ma).run()
  return { ok: true }
}

export async function phieuTheoCa(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa).trim()
  const r = await env.DB.prepare('SELECT * FROM phieu WHERE ma_ca = ? AND thu_hoi = 0 ORDER BY luu_luc DESC')
    .bind(maCa)
    .all<Record<string, unknown>>()
  return {
    ok: true,
    items: (r.results ?? []).map((x) => ({
      ma: chuoi(x.ma),
      maCa: chuoi(x.ma_ca),
      sbd: chuoi(x.sbd),
      hoTen: chuoi(x.ho_ten),
      loai: chuoi(x.loai) === 'baitap' ? 'baitap' : 'ketqua',
      soLanXem: Number(x.so_lan_xem) || 0,
      luuLuc: chuoi(x.luu_luc),
    })),
  }
}

/** MÃ PHIẾU CỦA CHÍNH EM trong một ca — cho link `/d/<mã ca>`. Không trả nội
 * dung phiếu, chỉ trả mã; máy em mở tiếp bằng `layPhieu` công khai. */
function locGoiDeRiengChoEm(goi: Record<string, unknown> | null, sbd: string): Record<string, unknown> | null {
  if (!goi) return null
  const doiTuong = (v: unknown): Record<string, unknown> =>
    v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}

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
    bb: null,
  }
}

function trichBoCauCuaEm(goi: Record<string, unknown> | null, sbd: string): string[] | null {
  if (!goi) return null
  if (Array.isArray(goi[sbd])) return goi[sbd] as string[]
  if (goi.bo && typeof goi.bo === 'object' && !Array.isArray(goi.bo)) {
    const bo = goi.bo as Record<string, unknown>
    if (Array.isArray(bo[sbd])) return bo[sbd] as string[]
  }
  return null
}

async function layChiTietCauD1(env: Env, maCa: string, sbd: string, lanThu: number) {
  const r = await env.DB.prepare(
    `SELECT phan, so_cau, qid, chuyen_de, muc_do, dap_an_chon, dap_an_dung, dung_sai, giay
       FROM chi_tiet_cau WHERE ma_ca = ? AND sbd = ? AND lan_thu = ?
      ORDER BY CASE phan WHEN 'I' THEN 1 WHEN 'II' THEN 2 WHEN 'III' THEN 3 ELSE 4 END, so_cau ASC`,
  ).bind(maCa, sbd, lanThu).all<Record<string, unknown>>()
  return (r.results ?? []).map((x) => ({
    phan: chuoi(x.phan),
    soCau: Number(x.so_cau) || 0,
    qid: chuoi(x.qid),
    chuyenDe: chuoi(x.chuyen_de),
    mucDo: chuoi(x.muc_do),
    dapAnChon: chuoi(x.dap_an_chon),
    dapAnDung: chuoi(x.dap_an_dung),
    dungSai: x.dung_sai === null ? null : Number(x.dung_sai) === 1,
    giay: x.giay === null ? null : Number(x.giay),
  }))
}

function kiemTraPhieuSan(phieu: unknown, dsCtc: { dungSai: boolean | null }[]): unknown {
  if (dsCtc.length > 0 && phieu && typeof phieu === 'object') {
    const p = phieu as Record<string, unknown>
    const soSai = dsCtc.filter((x) => x.dungSai === false).length
    if (Array.isArray(p.cauSai) && p.cauSai.length !== soSai) return null
  }
  return phieu
}

export async function phieuCuaEm(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa).trim()
  const sbd = chuoi(b.sbd).trim()
  if (!maCa || !sbd) return { ok: false, error: 'Thiếu mã ca hoặc số báo danh' }

  const l = await env.DB.prepare(
    `SELECT l.*, COALESCE(NULLIF(l.ho_ten,''), d.ho_ten, '') AS ten_hien, COALESCE(c.lop, d.lop, '') AS lop_hien,
            COALESCE(c.ten_ca,'') AS ten_ca, c.thoi_gian_phut, c.giu_de_doc,
            c.bo_theo_em_json, c.so_cau_json, c.de_rieng
       FROM luot l
       LEFT JOIN danh_sach d ON d.sbd = l.sbd
       LEFT JOIN ca c ON c.ma_ca = l.ma_ca
      WHERE l.ma_ca = ? AND l.sbd = ? ORDER BY l.lan_thu DESC LIMIT 1`,
  )
    .bind(maCa, sbd)
    .first<Record<string, unknown>>()
  if (!l) return { ok: false, error: 'Em chưa nộp bài ca này' }

  const lanThu = Number(l.lan_thu) || 1
  const dsCtc = await layChiTietCauD1(env, maCa, sbd, lanThu)

  const rPhieu = await env.DB.prepare('SELECT ma, loai FROM phieu WHERE ma_ca = ? AND sbd = ? AND thu_hoi = 0 ORDER BY luu_luc DESC')
    .bind(maCa, sbd)
    .all<Record<string, unknown>>()
  const ds = rPhieu.results ?? []
  const maKetQua = chuoi(ds.find((x) => chuoi(x.loai) !== 'baitap')?.ma)
  const maBaiTap = chuoi(ds.find((x) => chuoi(x.loai) === 'baitap')?.ma)

  let phieuSan: unknown = null
  if (maKetQua && env.DE) {
    try {
      const oP = await env.DE.get(`phieu/${maKetQua}.json`)
      if (oP?.body) {
        const doc = (await new Response(oP.body).json()) as Record<string, unknown>
        if (doc && !doc.thuHoi && doc.phieu) {
          phieuSan = kiemTraPhieuSan(doc.phieu, dsCtc)
        }
      }
    } catch {}
  }

  const rawBoGoc = l.bo_theo_em_json ? doJson(l.bo_theo_em_json) : null
  const goiGoc = rawBoGoc && typeof rawBoGoc === 'object' ? (rawBoGoc as Record<string, unknown>) : null
  const goiRieng = locGoiDeRiengChoEm(goiGoc, sbd)
  let boCuaEm = trichBoCauCuaEm(goiRieng ?? goiGoc, sbd)
  if ((!boCuaEm || boCuaEm.length === 0) && dsCtc.length > 0) {
    boCuaEm = dsCtc.map((x) => x.qid).filter(Boolean)
  }

  let soCauCa = l.so_cau_json ? (doJson(l.so_cau_json) as Record<string, number> | null) : null
  if (!soCauCa && dsCtc.length > 0) {
    soCauCa = {
      I: dsCtc.filter((x) => x.phan === 'I').length,
      II: dsCtc.filter((x) => x.phan === 'II').length,
      III: dsCtc.filter((x) => x.phan === 'III').length,
    }
  }

  // NGÂN HÀNG CÓ ĐÁP ÁN — chỉ trả khi em ĐÃ NỘP.
  let bank: unknown = null
  const daNop = chuoi(l.trang_thai) === 'da_nop' || chuoi(l.trang_thai) === 'khoa' || chuoi(l.nop_luc) !== ''
  if (daNop && env.DE) {
    const o = await env.DE.get(`key/${maCa}.json`)
    if (o?.body) {
      try {
        bank = await new Response(o.body).json()
      } catch {
        bank = null
      }
    }
    if (!bank) bank = await keyBankTuBangCham(env, maCa, sbd)
  }

  if (bank && typeof bank === 'object') {
    const bObj = bank as Record<string, unknown>
    if (soCauCa && !bObj.soCau) {
      bObj.soCau = soCauCa
    }
    if (goiRieng && !bObj.boTheoEm) {
      bObj.boTheoEm = goiRieng
    } else if (boCuaEm && boCuaEm.length > 0 && !bObj.boTheoEm) {
      bObj.boTheoEm = { [sbd]: boCuaEm }
    }
  }

  return {
    ok: true,
    ma: maKetQua,
    maBaiTap: maBaiTap,
    phieu: phieuSan,
    boTheoEm: goiRieng,
    boCuaEm,
    soCau: soCauCa,
    chiTietCau: dsCtc,
    diemI: soHoacNull(l.diem_i),
    diemII: soHoacNull(l.diem_ii),
    diemIII: soHoacNull(l.diem_iii),
    tong: soHoacNull(l.tong),
    hoTen: chuoi(l.ten_hien),
    lop: chuoi(l.lop_hien),
    tenCa: chuoi(l.ten_ca),
    thoiGianPhut: Number(l.thoi_gian_phut) || 0,
    giuDeDoc: Number(l.giu_de_doc ?? 0) === 1,
    luot: {
      lanThu: lanThu,
      vaoLuc: chuoi(l.vao_luc),
      nopLuc: chuoi(l.nop_luc),
      trangThai: chuoi(l.trang_thai),
      dapAn: doJson(l.dap_an_json),
      giayCau: doJson(l.giay_cau_json),
      integrity: doJson(l.integrity_json),
      soLanRoiMan: Number(l.so_lan_roi_man) || 0,
      tongGiayRoiMan: Number(l.tong_giay_roi_man) || 0,
    },
    bank,
  }
}

/** LỊCH SỬ CA CỦA EM — máy em xem lại điểm cũ. Không kèm mã bí mật, nên chỉ
 * trả đúng những gì em đã biết: ca của chính em. */
export async function lichSuEm(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sbd = chuoi(b.sbd).trim()
  if (!sbd) return { ok: false, error: 'Thiếu số báo danh' }
  // MỘT LỆNH, ĐỦ HỢP ĐỒNG. Bản trước chỉ trả bốn trường (maCa, tenCa, ngay,
  // tong), trong khi CẢ BA cổng đọc nhiều hơn thế: cổng học sinh đọc `tongCau`,
  // `soCauDung`, `soCauSai`; cổng phụ huynh đọc thêm `nopLuc`, `diemI/II/III`,
  // `thoiGianPhut`, `lanThu`. Thiếu trường thì `?? 0` biến chúng thành số 0, và
  // báo cáo ca Test2 (561169) hiện "Đúng 0/0 câu" cho một bài 1,56 điểm.
  //
  // ĐẾM BẰNG MỘT CÂU GỘP, không lặp theo ca: cả lớp bấm mở cổng cùng lúc.
  const r = await env.DB.prepare(
    `SELECT l.ma_ca, l.tong, l.nop_luc, l.lan_thu, l.diem_i, l.diem_ii, l.diem_iii,
            COALESCE(c.ten_ca,'') AS ten_ca, c.thoi_gian_phut
       FROM luot l LEFT JOIN ca c ON c.ma_ca = l.ma_ca
      WHERE l.sbd = ? AND l.tong IS NOT NULL ORDER BY l.nop_luc DESC LIMIT 50`,
  )
    .bind(sbd)
    .all<Record<string, unknown>>()
  const dong = r.results ?? []

  // SỐ CÂU LẤY TỪ BẢNG CHẤM của chính em — đúng tờ đề em nhận, kể cả ca đề
  // riêng (ca 561169 phát 12 câu cho mỗi em trong khi gói đề chứa 545 câu, nên
  // đếm theo gói đề là sai gấp bốn mươi lần).
  const dem = new Map<string, DemBangCham>()
  if (dong.length > 0) {
    const o = dong.map(() => '?').join(',')
    const rc = await env.DB.prepare(
      `SELECT ma_ca, ${CHON_DEM_BANG_CHAM}
         FROM chi_tiet_cau WHERE sbd = ? AND ma_ca IN (${o}) GROUP BY ma_ca`,
    )
      .bind(sbd, ...dong.map((x) => chuoi(x.ma_ca)))
      .all<Record<string, unknown>>()
    for (const x of rc.results ?? []) {
      dem.set(chuoi(x.ma_ca), docDemBangCham(x))
    }
  }

  return {
    ok: true,
    items: dong.map((x) => {
      const d = dem.get(chuoi(x.ma_ca))
      const nopLuc = chuoi(x.nop_luc)
      return {
        maCa: chuoi(x.ma_ca),
        tenCa: chuoi(x.ten_ca),
        ngay: nopLuc,
        nopLuc,
        tong: Number(x.tong) || 0,
        diemI: soHoacNull(x.diem_i),
        diemII: soHoacNull(x.diem_ii),
        diemIII: soHoacNull(x.diem_iii),
        lanThu: Number(x.lan_thu) || 1,
        thoiGianPhut: Number(x.thoi_gian_phut) || 0,
        ...goiDemCau(d),
      }
    }),
  }
}

/** BÀI TẬP CỦA EM — phiếu loại `baitap` đã phát cho em. */
export async function baiTapCuaEm(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sbd = chuoi(b.sbd).trim()
  if (!sbd) return { ok: false, error: 'Thiếu số báo danh' }
  const r = await env.DB.prepare(
    `SELECT p.ma, p.ma_ca, p.luu_luc, p.so_lan_xem, COALESCE(c.ten_ca,'') AS ten_ca
       FROM phieu p LEFT JOIN ca c ON c.ma_ca = p.ma_ca
      WHERE p.sbd = ? AND p.loai = 'baitap' AND p.thu_hoi = 0 ORDER BY p.luu_luc DESC LIMIT 50`,
  )
    .bind(sbd)
    .all<Record<string, unknown>>()
  return {
    ok: true,
    items: (r.results ?? []).map((x) => ({
      ma: chuoi(x.ma),
      maCa: chuoi(x.ma_ca),
      tenCa: chuoi(x.ten_ca),
      ngay: chuoi(x.luu_luc),
      soLanXem: Number(x.so_lan_xem) || 0,
    })),
  }
}

// ===========================================================================
// NỘP PHIẾU KHẮC PHỤC — máy chủ TỰ CHẤM, không tin con số máy em gửi lên.
// ===========================================================================

/** CHẤM VÀ GHI MỘT LƯỢT NỘP BÀI TẬP VỀ NHÀ.
 *
 * ĐÁP ÁN LẤY TỪ KHO, không lấy từ gói máy em gửi lên — máy em cầm bản đã xoá
 * đáp án. Đọc đúng những tờ đề của lượt giao ấy, lọc đúng phần thầy đã tick.
 *
 * QUÁ HẠN THÌ TỪ CHỐI Ở ĐÂY, không chỉ ẩn nút bên máy em: giờ máy em chỉnh được. */
export async function nopBtvnQuaPhieu(
  env: Env,
  bt: Record<string, unknown>,
  sbd: string,
  lam: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const maBtvn = chuoi(bt.ma_btvn)
  const han = chuoi(bt.han_nop)
  const hanMs = han ? Date.parse(han) : NaN
  if (Number.isFinite(hanMs) && Date.now() > hanMs) {
    return { ok: false, lyDo: 'qua_han', error: 'Bạn đã quá hạn nộp BTVN' }
  }

  let graded
  try { graded=gradeHomework(homeworkKeys(await homeworkQuestions(env,chuoi(bt.ma_de))),lam,chuoi(bt.ma_de)) }
  catch(e){return {ok:false,error:e instanceof Error?e.message:'Không chấm được bài.'}}
  const {soDung,soCau,qidSai}=graded
  lam=graded.answers

  const nay = NAY()
  const khoa = `${maBtvn}|${sbd}`
  const cu = await env.DB.prepare('SELECT dap_an_json, nop_luc, COALESCE(so_lan_lam, 1) AS so_lan_lam FROM btvn_em WHERE khoa = ? AND thu_hoi=0')
    .bind(khoa)
    .first<Record<string, unknown>>()
  if (!cu) {
    return { ok: false, lyDo: 'khong_duoc_giao', error: 'Em không có bài tập của lượt này' }
  }

  if(cu.nop_luc&&String(cu.dap_an_json)===JSON.stringify(lam))return {ok:true,lanThu:Number(cu.so_lan_lam),soCau,soDung,qidSai,nopLuc:cu.nop_luc,daNhan:true}
  let lanMoi = 1
  if (cu.nop_luc) {
    const daLam = Math.max(1, Number(cu.so_lan_lam) || 1)
    if (daLam >= 4) {
      return { ok: false, error: 'Em đã dùng hết 3 lượt làm lại bài tập này', daHetLuot: true }
    }
    lanMoi = daLam + 1
  }

  const saved=await env.DB.prepare(
    `UPDATE btvn_em SET nop_luc = ?, so_dung = ?, so_cau = ?, dap_an_json = ?, so_lan_lam = ? WHERE khoa = ? AND thu_hoi=0`,
  )
    .bind(nay, soDung, soCau, JSON.stringify(lam), lanMoi, khoa)
    .run()

  if(!saved.meta.changes)return {ok:false,error:'Bài vừa được cập nhật từ một lần nộp khác. Em tải lại để xem kết quả.'}
  // SỔ SỰ KIỆN HỌC (GĐ 0): mỗi câu của tờ là một sự kiện `btvn`, lan = lượt làm, dựng từ CHÍNH kết quả
  // `gradeHomework` vừa chấm (không đọc lại R2). Lượt 1 bỏ qua câu đã ghi qua lô (`btvn_lo`) để nộp cả
  // bài không đếm đôi. Lỗi sổ không làm hỏng lượt nộp.
  await ghiSuKien(env, suKienTuKetQuaCham('btvn', maBtvn, sbd, lanMoi, nay, graded), { tranhTrungLo: lanMoi === 1 })
  return { ok: true, lanThu: lanMoi, soCau, soDung, qidSai, nopLuc: nay, soLanLamLaiConLai: Math.max(0, 4 - lanMoi) }
}

/** Gỡ hậu tố phần khỏi mã đề — bản dùng trong tệp này (xem `goPhanKhoiMaDe`
 * bên `index.ts`; hai nơi phải cùng một bảng hậu tố). */
function goPhanMa(ma: string): { goc: string; phan: 'I' | 'II' | 'III' | null } {
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

/** ĐÁP ÁN ĐÚNG CỦA MỘT CHUỖI MÃ ĐỀ — dùng chung cho CHẤM bài tập về nhà và cho
 * HỒ SƠ lên bảng, để hai nơi không bao giờ lệch nhau một câu nào.
 *
 * `maDeCsv` là trường `btvn.ma_de`: nhiều tờ ngăn bởi dấu phẩy, mỗi tờ có thể
 * kèm hậu tố phần (`-TN`, `-DS`, `-TLN`) nghĩa là chỉ lấy phần ấy.
 *
 * `boNho` cho phép đọc nhiều lượt giao mà mỗi tờ đề chỉ chạm R2 một lần.
 *
 * Khoá của map là `<mã đề gốc>-<phần>-<số>` — ĐÚNG khoá máy em gửi lên trong
 * `dap_an_json`, và cũng đúng `id` câu bên kho đề của thầy. Đổi cách dựng khoá
 * ở đây là hỏng cả chấm lẫn đối chiếu, nên đừng đổi.
 *
 * Câu không có đáp án trong kho thì KHÔNG vào map — không đoán.
 */
export async function dapAnTheoMaDe(
  env: Env,
  maDeCsv: string,
  boNho?: Map<string, Record<string, unknown>[]>,
): Promise<Map<string, string>> {
  const ra = new Map<string, string>()
  if (!env.DE) return ra
  const daDoc = boNho ?? new Map<string, Record<string, unknown>[]>()
  for (const m of chuoi(maDeCsv).split(',').map((x) => x.trim()).filter(Boolean)) {
    const { goc, phan } = goPhanMa(m)
    if (!daDoc.has(goc)) {
      let cau: Record<string, unknown>[] = []
      try {
        const o = await env.DE.get(`kho/${goc}.json`)
        if (o?.body) {
          const g = (await new Response(o.body).json()) as Record<string, unknown>
          cau = Array.isArray(g.cau) ? (g.cau as Record<string, unknown>[]) : []
          // Tờ kho đời cũ tách sẵn ba phần thay vì một mảng `cau`.
          if (cau.length === 0) {
            for (const k of ['phanI', 'phanII', 'phanIII']) {
              if (Array.isArray(g[k])) cau.push(...(g[k] as Record<string, unknown>[]))
            }
          }
        }
      } catch (e) {
        console.warn('[kho] không đọc được tờ đề', goc, e)
      }
      daDoc.set(goc, cau)
    }
    const cau = daDoc.get(goc) ?? []
    for (const c of phan ? cau.filter((x) => chuoi(x.phan) === phan) : cau) {
      const qid = `${goc}-${chuoi(c.phan)}-${chuoi(c.so)}`
      const da = c.dap_an ?? c.dapAn
      // Phần II có đáp án dạng đối tượng {a,b,c,d}; ép về chuỗi "DSDS".
      const dung = (
        typeof da === 'object' && da !== null
          ? ['a', 'b', 'c', 'd'].map((k) => chuoi((da as Record<string, unknown>)[k])).join('')
          : chuoi(da)
      )
        .trim()
        .toUpperCase()
      if (dung) ra.set(qid, dung)
    }
  }
  return ra
}

export async function nopKhacPhuc(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const ma = chuoi(b.ma).trim()
  const sbd = chuoi(b.sbd).trim()
  if (!ma || !sbd) return { ok: false, error: 'Thiếu mã phiếu hoặc số báo danh' }
  const lam = (b.dapAn ?? {}) as Record<string, unknown>

  // BÀI TẬP VỀ NHÀ ĐI CHUNG CỬA NÀY.
  //
  // Phiếu bài tập về nhà dựng bằng CHÍNH bộ phiếu khắc phục (thầy chốt 12/09:
  // "nộp được chọn đáp án được theo chuẩn của html rút câu hỏi khắc phục"), nên
  // nút Nộp của nó bắn ra đúng lệnh này với `ma` là MÃ LƯỢT GIAO. Viết một cửa
  // nộp thứ hai chỉ để đổi tên trường là hai chỗ phải sửa mỗi lần đổi luật.
  const bt = await env.DB.prepare('SELECT ma_btvn, ma_ca, ma_de, han_nop FROM btvn WHERE ma_btvn = ? AND da_xoa = 0')
    .bind(ma)
    .first<Record<string, unknown>>()
  if (bt) return nopBtvnQuaPhieu(env, bt, sbd, lam)
  const recalled = await env.DB.prepare('SELECT ma_btvn FROM btvn WHERE ma_btvn = ? AND da_xoa <> 0').bind(ma).first()
  if (recalled) return {ok:false,error:'Bài tập đã được thầy thu hồi.'}

  // ĐÁP ÁN LẤY TỪ GÓI PHIẾU trên R2 — không lấy từ gói máy em gửi lên.
  let dapAnDung: Record<string, string> = {}
  const cauPhieu: CauChamBai[] = []
  let maCa = ''
  if (env.DE) {
    const o = await env.DE.get(`phieu/${ma}.json`)
    if (o) {
      try {
        const goi = (await new Response(o.body).json()) as Record<string, unknown>
        maCa = chuoi(goi.maCa)
        const ph = (goi.phieu ?? {}) as Record<string, unknown>
        const cau = Array.isArray(ph.cau) ? (ph.cau as Record<string, unknown>[]) : []
        for (const c of cau) {
          const qid = chuoi(c.id)
          if (qid) {
            dapAnDung[qid] = chuoi(c.dapAn).trim().toUpperCase()
            if (dapAnDung[qid]) cauPhieu.push({ qid, dapAnDung: dapAnDung[qid], chuyenDe: chuoi(c.chuyenDe), mucDo: chuoi(c.mucDo) })
          }
        }
      } catch {
        dapAnDung = {}
        cauPhieu.length = 0
      }
    }
  }

  const qidSai: string[] = []
  let soDung = 0
  let soCau = 0
  for (const [qid, dung] of Object.entries(dapAnDung)) {
    if (!dung) continue
    soCau++
    const chon = chuoi(lam[qid]).trim().toUpperCase()
    const phanMatch = qid.match(/-(III|II|I)-\d+$/)
    const phan = phanMatch ? phanMatch[1] : (qid.includes('-III-') ? 'III' : qid.includes('-II-') ? 'II' : 'I')
    if (chon && isAnswerCorrect(chon, dung, phan)) soDung++
    else qidSai.push(qid)
  }

  const nay = NAY()
  const khoa = `${ma}|${sbd}`
  const cu = await env.DB.prepare('SELECT so_cau, dap_an_json FROM nop_khac_phuc WHERE khoa = ?').bind(khoa).first<{ so_cau: number; dap_an_json?: string }>()
  await env.DB.prepare(
    `INSERT INTO nop_khac_phuc (khoa, ma_phieu, sbd, ma_ca, dap_an_json, so_dung, so_cau, nop_luc)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(khoa) DO UPDATE SET dap_an_json = excluded.dap_an_json, so_dung = excluded.so_dung,
       so_cau = excluded.so_cau, nop_luc = excluded.nop_luc`,
  )
    .bind(khoa, ma, sbd, maCa, JSON.stringify(lam), soDung, soCau, nay)
    .run()
  // SỔ SỰ KIỆN HỌC (GĐ 0): bảng `nop_khac_phuc` chỉ giữ lượt cuối, sổ giữ MỌI lượt (`lan`).
  // Gửi lại y hệt (mất mạng) thì không ghi thêm; nộp lại đáp án khác thì lan = lượt kế tiếp.
  if (!cu || String(cu.dap_an_json ?? '') !== JSON.stringify(lam)) {
    let lan = 1
    if (cu) {
      try {
        const r = await env.DB.prepare(
          "SELECT COALESCE(MAX(lan), 0) + 1 AS n FROM su_kien_hoc WHERE nguon = 'khac_phuc' AND ma_nguon = ? AND sbd = ?",
        ).bind(ma, sbd).first<{ n: number }>()
        lan = Math.max(2, Number(r?.n) || 2)
      } catch {
        lan = 2
      }
    }
    await ghiSuKien(env, suKienChamBai('khac_phuc', ma, sbd, lan, nay, cauPhieu, lam))
  }
  return { ok: true, lanThu: cu ? 2 : 1, soCau, soDung, qidSai, nopLuc: nay }
}

export async function nopKhacPhucTheoCa(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa).trim()
  const r = await env.DB.prepare('SELECT * FROM nop_khac_phuc WHERE ma_ca = ? ORDER BY nop_luc DESC LIMIT 300')
    .bind(maCa)
    .all<Record<string, unknown>>()
  return {
    ok: true,
    items: (r.results ?? []).map((x) => ({
      ma: chuoi(x.ma_phieu),
      sbd: chuoi(x.sbd),
      lanThu: 1,
      nopLuc: chuoi(x.nop_luc),
      soCau: Number(x.so_cau) || 0,
      soDung: Number(x.so_dung) || 0,
      qidSai: [],
    })),
  }
}

// ===========================================================================
// YÊU CẦU GIAO BÀI · ĐĂNG KÝ HỌC SINH · DANH SÁCH LỚP
// ===========================================================================

export async function danhSachYeuCau(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const tatCa = b.tatCa === true
  const r = tatCa
    ? await env.DB.prepare(
        `SELECT y.*, COALESCE(d.ho_ten,'') AS ho_ten FROM yeu_cau_giao_bai y LEFT JOIN danh_sach d ON d.sbd = y.sbd
          ORDER BY y.luc DESC LIMIT 300`,
      ).all<Record<string, unknown>>()
    : await env.DB.prepare(
        `SELECT y.*, COALESCE(d.ho_ten,'') AS ho_ten FROM yeu_cau_giao_bai y LEFT JOIN danh_sach d ON d.sbd = y.sbd
          WHERE y.trang_thai = 'cho' ORDER BY y.luc DESC LIMIT 300`,
      ).all<Record<string, unknown>>()
  return {
    ok: true,
    items: (r.results ?? []).map((x) => ({
      id: chuoi(x.id),
      sbd: chuoi(x.sbd),
      hoTen: chuoi(x.ho_ten),
      maCa: chuoi(x.ma_ca),
      trangThai: chuoi(x.trang_thai),
      luc: chuoi(x.luc),
    })),
  }
}

export async function danhDauYeuCau(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const id = chuoi(b.id).trim()
  if (!id) return { ok: false, error: 'Thiếu mã yêu cầu' }
  const tt = chuoi(b.trangThai) === 'huy' ? 'tu_choi' : 'dong_y'
  await env.DB.prepare('UPDATE yeu_cau_giao_bai SET trang_thai = ?, ma_ca = COALESCE(NULLIF(?,\'\'), ma_ca) WHERE id = ?')
    .bind(tt, chuoi(b.maCa), id)
    .run()
  return { ok: true }
}

export async function xinGiaoBai(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sbd = chuoi(b.sbd).trim()
  if (!sbd) return { ok: false, error: 'Thiếu số báo danh' }
  await env.DB.prepare('INSERT INTO yeu_cau_giao_bai (sbd, ma_ca, trang_thai, luc) VALUES (?, ?, \'cho\', ?)')
    .bind(sbd, chuoi(b.maCa), NAY())
    .run()
  return { ok: true }
}

export async function themEm(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sbd = chuoi(b.sbd).trim()
  if (!sbd) return { ok: false, error: 'Thiếu số báo danh' }
  const hoTen = chuoi(b.hoTen).trim()
  const namSinh = chuoi(b.namSinh).trim()
  const lop = chuoi(b.lop).trim()
  const nay = NAY()
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO danh_sach (sbd, ho_ten, nam_sinh, lop, cap_nhat_luc) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(sbd) DO UPDATE SET ho_ten = excluded.ho_ten, nam_sinh = excluded.nam_sinh,
         lop = COALESCE(NULLIF(excluded.lop,''), danh_sach.lop), cap_nhat_luc = excluded.cap_nhat_luc`,
    ).bind(sbd, hoTen, namSinh, lop, nay),
    env.DB.prepare(
      `INSERT INTO hoc_sinh (sbd, ho_ten, nam_sinh, lop, trang_thai, tao_luc, cap_nhat_luc)
       VALUES (?, ?, ?, ?, 'da_duyet', ?, ?)
       ON CONFLICT(sbd) DO UPDATE SET ho_ten = excluded.ho_ten, nam_sinh = excluded.nam_sinh,
         lop = COALESCE(NULLIF(excluded.lop,''), hoc_sinh.lop), cap_nhat_luc = excluded.cap_nhat_luc`,
    ).bind(sbd, hoTen, namSinh, lop, nay, nay),
  ])
  return { ok: true, sbd, hoTen, namSinh, lop, tenSheet: '' }
}

export async function xoaEm(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sbd = chuoi(b.sbd).trim()
  if (!sbd) return { ok: false, error: 'Thiếu số báo danh' }
  // XOÁ ĐĂNG KÝ, KHÔNG XOÁ BÀI. Bảng `luot` giữ nguyên: bài em đã làm là dữ
  // liệu của thầy, không phải của hồ sơ đăng ký.
  await env.DB.prepare('DELETE FROM hoc_sinh WHERE sbd = ?').bind(sbd).run()
  return { ok: true }
}

export async function dsEmDangKy(env: Env): Promise<Record<string, unknown>> {
  const r = await env.DB.prepare('SELECT * FROM hoc_sinh ORDER BY cap_nhat_luc DESC LIMIT 500').all<Record<string, unknown>>()
  return {
    ok: true,
    items: (r.results ?? []).map((x) => ({
      sbd: chuoi(x.sbd),
      hoTen: chuoi(x.ho_ten),
      namSinh: chuoi(x.nam_sinh),
      lop: chuoi(x.lop),
      dangKyLuc: chuoi(x.tao_luc),
      trangThai: chuoi(x.trang_thai),
    })),
  }
}

// ===========================================================================
// LỆNH CA CỦA THẦY — khoá · mở · xoá · khôi phục · đổi tên · đồng bộ tên.
//
// Bên Apps Script mấy lệnh này sửa ô trên Sheet. Ở đây chúng sửa đúng một dòng
// `ca`, và khoá ca thì NỘP HỘ mọi em còn đang làm — giữ đúng hành vi cũ, vì
// thầy đã quen: bấm Khoá là cả lớp dừng bút.
// ===========================================================================

export async function khoaCa(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa).trim()
  if (!maCa) return { ok: false, error: 'Thiếu mã ca' }
  const nay = NAY()
  const r = await env.DB.batch([
    env.DB.prepare("UPDATE luot SET trang_thai = 'da_nop', nop_luc = COALESCE(NULLIF(nop_luc,''), ?), cap_nhat_luc = ? WHERE ma_ca = ? AND trang_thai = 'dang_lam'").bind(nay, nay, maCa),
    env.DB.prepare("UPDATE ca SET trang_thai = 'dong', cap_nhat_luc = ? WHERE ma_ca = ?").bind(nay, maCa),
  ])
  return { ok: true, soEmBiNop: r[0]?.meta?.changes ?? 0, khoaLuc: nay, trangThai: 'dong' }
}

export async function moKhoaCa(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa).trim()
  if (!maCa) return { ok: false, error: 'Thiếu mã ca' }
  const ca = await env.DB.prepare('SELECT het_han_vao FROM ca WHERE ma_ca = ?').bind(maCa).first<{ het_han_vao: string }>()
  // GỠ HẠN VÀO PHÒNG khi hạn đã trôi qua: mở lại ca mà cửa vào vẫn đóng thì em
  // bấm vào vẫn bị chặn, và thầy tưởng lệnh mở không ăn.
  const hanCu = chuoi(ca?.het_han_vao)
  const daQua = hanCu !== '' && Date.parse(hanCu) > 0 && Date.now() > Date.parse(hanCu)
  const nay = NAY()
  await env.DB.prepare(
    daQua
      ? "UPDATE ca SET trang_thai = 'mo', het_han_vao = '', cap_nhat_luc = ? WHERE ma_ca = ?"
      : "UPDATE ca SET trang_thai = 'mo', cap_nhat_luc = ? WHERE ma_ca = ?",
  )
    .bind(nay, maCa)
    .run()
  return { ok: true, trangThai: 'mo', goHanVao: daQua }
}

export async function xoaCa(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa).trim()
  const xacNhan = chuoi(b.xacNhan).trim()
  if (!maCa) return { ok: false, error: 'Thiếu mã ca' }
  // CHỐT XÁC NHẬN giữ nguyên từ đường cũ: thầy phải gõ lại mã ca.
  if (xacNhan !== maCa) return { ok: false, error: 'Mã xác nhận không khớp' }
  const nay = NAY()
  await env.DB.prepare("UPDATE ca SET trang_thai = 'da_xoa', xoa_luc = ?, cap_nhat_luc = ? WHERE ma_ca = ?").bind(nay, nay, maCa).run()
  return { ok: true }
}

export async function khoiPhucCa(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa).trim()
  if (!maCa) return { ok: false, error: 'Thiếu mã ca' }
  const nay = NAY()
  await env.DB.prepare("UPDATE ca SET trang_thai = 'mo', xoa_luc = '', cap_nhat_luc = ? WHERE ma_ca = ?").bind(nay, maCa).run()
  return { ok: true }
}

export async function xoaVinhVienCa(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  try {
    const dsMaCa = Array.isArray(b.dsMaCa)
      ? (b.dsMaCa as string[]).map(chuoi).map((s) => s.trim()).filter(Boolean)
      : b.maCa
      ? [chuoi(b.maCa).trim()].filter(Boolean)
      : []
    if (dsMaCa.length === 0) return { ok: false, error: 'Thiếu mã ca cần xoá vĩnh viễn' }

    const daXoa: string[] = []
    const bangCoMaCa = [
      'ca',
      'luot',
      'trang_thai',
      'phong_cho',
      'chan_vao',
      'chi_tiet_cau',
      'ban_do_sai',
      'tien_do_ca',
      'cau_hoi_em',
      'nop_khac_phuc',
      'btvn',
      'phieu',
      'de_rieng',
      'kho_ca_them',
      'yeu_cau_giao_bai',
      'nhan_xet',
    ]

    for (const maCa of dsMaCa) {
      if (env.DE) {
        try {
          const rP = await env.DB.prepare('SELECT ma FROM phieu WHERE ma_ca = ?').bind(maCa).all<Record<string, unknown>>()
          for (const row of rP.results ?? []) {
            const ma = chuoi(row.ma)
            if (ma) await env.DE.delete(`phieu/${ma}.json`).catch(() => {})
          }
          await env.DE.delete(`key/${maCa}.json`).catch(() => {})
          await env.DE.delete(`de/${maCa}.json`).catch(() => {})
        } catch {}
      }

      const stmts: D1PreparedStatement[] = [
        env.DB.prepare('DELETE FROM btvn_em WHERE ma_btvn IN (SELECT ma_btvn FROM btvn WHERE ma_ca = ?)').bind(maCa),
      ]
      for (const t of bangCoMaCa) {
        stmts.push(env.DB.prepare(`DELETE FROM ${t} WHERE ma_ca = ?`).bind(maCa))
      }
      await env.DB.batch(stmts)
      daXoa.push(maCa)
    }

    return { ok: true, daXoa }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Lỗi khi xoá vĩnh viễn ca thi' }
  }
}

export async function doiTenCa(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa).trim()
  const tenCa = chuoi(b.tenCa).trim()
  if (!maCa) return { ok: false, error: 'Thiếu mã ca' }
  await env.DB.prepare('UPDATE ca SET ten_ca = ?, cap_nhat_luc = ? WHERE ma_ca = ?').bind(tenCa, NAY(), maCa).run()
  return { ok: true, tenCa }
}

/** ĐIỀN HỌ TÊN CÒN TRỐNG trong lượt của một ca, lấy từ danh sách lớp.
 * Một câu UPDATE, không vòng lặp theo em. */
export async function dongBoTenCa(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa).trim()
  if (!maCa) return { ok: false, error: 'Thiếu mã ca' }
  const truoc = await env.DB.prepare(
    `SELECT l.sbd, COALESCE(NULLIF(l.ho_ten,''),'') AS ten_luot, COALESCE(d.ho_ten,'') AS ten_ds
       FROM luot l LEFT JOIN danh_sach d ON d.sbd = l.sbd WHERE l.ma_ca = ?`,
  )
    .bind(maCa)
    .all<Record<string, unknown>>()
  const ds = truoc.results ?? []
  const daDien = ds.filter((x) => chuoi(x.ten_luot) === '' && chuoi(x.ten_ds) !== '').map((x) => ({ sbd: chuoi(x.sbd), hoTen: chuoi(x.ten_ds) }))
  const khongCo = ds.filter((x) => chuoi(x.ten_luot) === '' && chuoi(x.ten_ds) === '').map((x) => chuoi(x.sbd))
  const giuNguyen = ds.filter((x) => chuoi(x.ten_luot) !== '').length
  if (daDien.length > 0) {
    await env.DB.prepare(
      `UPDATE luot SET ho_ten = (SELECT d.ho_ten FROM danh_sach d WHERE d.sbd = luot.sbd), cap_nhat_luc = ?
        WHERE ma_ca = ? AND (ho_ten IS NULL OR ho_ten = '')
          AND EXISTS (SELECT 1 FROM danh_sach d2 WHERE d2.sbd = luot.sbd AND d2.ho_ten <> '')`,
    )
      .bind(NAY(), maCa)
      .run()
  }
  const ca = await env.DB.prepare('SELECT ten_ca FROM ca WHERE ma_ca = ?').bind(maCa).first<{ ten_ca: string }>()
  return { ok: true, maCa, tenCa: chuoi(ca?.ten_ca), daDien, daSua: [], khongCo, giuNguyen }
}

/** MỞ KHOÁ MỘT EM — em bị khoá vì rời màn quá ngưỡng, thầy cho làm tiếp. */
export async function moKhoaEm(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa).trim()
  const sbd = chuoi(b.sbd).trim()
  if (!maCa || !sbd) return { ok: false, error: 'Thiếu mã ca hoặc số báo danh' }
  const r = await env.DB.prepare(
    `UPDATE luot SET trang_thai = 'dang_lam', ghi_chu = ?, cap_nhat_luc = ?
      WHERE ma_ca = ? AND sbd = ? AND trang_thai = 'khoa'`,
  )
    .bind(`mở khoá bởi ${chuoi(b.nguoiMo) || 'thầy'}`, NAY(), maCa, sbd)
    .run()
  return { ok: true, soDong: r.meta.changes ?? 0 }
}

/** THẦY DUYỆT CHO THI LẠI — tạo lượt MỚI, không sửa lượt cũ. */
export async function duyetThiLai(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa).trim()
  const sbd = chuoi(b.sbd).trim()
  if (!maCa || !sbd) return { ok: false, error: 'Thiếu mã ca hoặc số báo danh' }
  const cu = await env.DB.prepare('SELECT MAX(lan_thu) AS n FROM luot WHERE ma_ca = ? AND sbd = ?').bind(maCa, sbd).first<{ n: number }>()
  const lanThu = (Number(cu?.n) || 0) + 1
  const nay = NAY()
  await env.DB.prepare(
    `INSERT INTO luot (khoa, ma_ca, sbd, lan_thu, vao_luc, trang_thai, duyet_boi, duyet_luc, cap_nhat_luc)
     VALUES (?, ?, ?, ?, ?, 'duoc_duyet_lai', ?, ?, ?)
     ON CONFLICT(khoa) DO NOTHING`,
  )
    .bind(`${maCa}|${sbd}|${lanThu}`, maCa, sbd, lanThu, nay, chuoi(b.nguoiDuyet) || 'thầy', nay, nay)
    .run()
  return { ok: true, lanThu }
}

/** CHO THI LẠI TỪ ĐẦU — xoá hẳn lượt của em trong ca để em vào lại như mới. */
export async function choThiLai(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa).trim()
  const sbd = chuoi(b.sbd).trim()
  if (!maCa || !sbd) return { ok: false, error: 'Thiếu mã ca hoặc số báo danh' }
  const r = await env.DB.batch([
    env.DB.prepare('DELETE FROM luot WHERE ma_ca = ? AND sbd = ?').bind(maCa, sbd),
    env.DB.prepare('DELETE FROM chi_tiet_cau WHERE ma_ca = ? AND sbd = ?').bind(maCa, sbd),
    env.DB.prepare('DELETE FROM phong_cho WHERE ma_ca = ? AND sbd = ?').bind(maCa, sbd),
  ])
  return {
    ok: true,
    soLuotXoa: r[0]?.meta?.changes ?? 0,
    soCauXoa: r[1]?.meta?.changes ?? 0,
    khoaMay: b.lapMoi === true,
    daDoiDe: b.boCauMoi === true,
  }
}

// ===========================================================================
// BẢN ĐỒ SAI · TIẾN ĐỘ · LÊN BẢNG
// ===========================================================================

export async function banDoSaiCa(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const ds = Array.isArray(b.dsMaCa) ? (b.dsMaCa as unknown[]).map((x) => chuoi(x).trim()).filter(Boolean).slice(0, 30) : []
  if (ds.length === 0) return { ok: true, ca: {} }
  const cho = ds.map(() => '?').join(',')
  const r = await env.DB.prepare(`SELECT ma_ca, sbd, qid FROM ban_do_sai WHERE ma_ca IN (${cho})`).bind(...ds).all<Record<string, unknown>>()
  const rLam = await env.DB.prepare(`SELECT ma_ca, sbd, qid FROM chi_tiet_cau WHERE ma_ca IN (${cho}) AND qid <> ''`).bind(...ds).all<Record<string, unknown>>()
  const ca: Record<string, { sai: Record<string, string[]>; lam: Record<string, string[]> }> = {}
  for (const m of ds) ca[m] = { sai: {}, lam: {} }
  for (const x of r.results ?? []) {
    const m = chuoi(x.ma_ca)
    const s = chuoi(x.sbd)
    if (!ca[m]) ca[m] = { sai: {}, lam: {} }
    ;(ca[m].sai[s] ??= []).push(chuoi(x.qid))
  }
  for (const x of rLam.results ?? []) {
    const m = chuoi(x.ma_ca)
    const s = chuoi(x.sbd)
    if (!ca[m]) ca[m] = { sai: {}, lam: {} }
    ;(ca[m].lam[s] ??= []).push(chuoi(x.qid))
  }
  return { ok: true, ca }
}

export async function qidDaLam(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sbd = chuoi(b.sbd).trim()
  if (!sbd) return { ok: false, error: 'Thiếu số báo danh' }
  const r = await env.DB.prepare('SELECT qid FROM qid_da_lam WHERE sbd = ?').bind(sbd).all<Record<string, unknown>>()
  return { ok: true, qids: (r.results ?? []).map((x) => chuoi(x.qid)) }
}

export async function lichSuLenBang(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const soNgay = Number(b.soNgay) > 0 ? Number(b.soNgay) : 30
  const tu = new Date(Date.now() - soNgay * 86400000).toISOString()
  const r = await env.DB.prepare('SELECT sbd, qid, luc FROM len_bang WHERE luc >= ? ORDER BY luc DESC LIMIT 2000')
    .bind(tu)
    .all<Record<string, unknown>>()
  const theoEm: Record<string, { soLan: number; lanCuoi: string; qids: string[] }> = {}
  for (const x of r.results ?? []) {
    const s = chuoi(x.sbd)
    if (!s) continue
    const e = (theoEm[s] ??= { soLan: 0, lanCuoi: '', qids: [] })
    e.soLan++
    const luc = chuoi(x.luc)
    if (luc > e.lanCuoi) e.lanCuoi = luc
    const qid = chuoi(x.qid)
    if (qid) e.qids.push(qid)
  }
  return { ok: true, soNgay, theoEm }
}

/** HỒ SƠ CẢ LỚP CHO BUỔI CHỮA — MỘT LƯỢT GỌI, KHÔNG PHẢI MỖI EM MỘT LƯỢT.
 *
 * Thầy chốt 14/09: "lấy tất cả mọi dữ liệu của học sinh, từ bài thi, bài tập
 * về nhà, khắc phục câu sai đóng gói lại để phân bổ câu gọi lên bảng cho hợp lý".
 *
 * Bốn nguồn, đủ cả ba đường em chạm vào câu hỏi:
 *   · `tien_do_hs`  — bảng mạnh–yếu cộng dồn theo chuyên đề (mọi ca đã chấm)
 *   · `ban_do_sai`  — TỪNG CÂU em sai, kèm số lần sai và đã chữa hay chưa
 *   · `qid_da_lam`  — câu em ĐÃ LÀM, gồm cả bài tập về nhà và phiếu khắc phục
 *   · `len_bang`    — em đã lên bảng mấy lần, câu nào
 *
 * VÌ SAO GỘP MỘT LỆNH: màn Gọi lên bảng cần cả bốn thứ cho CẢ LỚP. Gọi riêng
 * từng em là 30 em × 4 = 120 lượt truy vấn cho một lần bấm nút — đúng thứ luật
 * "mỗi lệnh 1–3 câu truy vấn" ở đầu tệp này cấm.
 *
 * KHÔNG ĐOÁN: em không có dòng nào thì trả mảng rỗng, không dựng số giả. */
/** Số lượt giao bài tập về nhà GẦN NHẤT được tính vào hồ sơ lên bảng. Lượt cũ
 * hơn không nói gì về buổi chữa hôm nay, mà mỗi lượt là thêm một lần đọc R2. */
const TRAN_LUOT_BTVN = 4

/** BÀI TẬP VỀ NHÀ CỦA MỘT EM, đã quy về từng câu. Ba mảng qid rời nhau: một
 * câu chỉ nằm ở đúng một mảng, nên `soCauGiao = soDung + soSai + soChuaLam`. */
export interface HoSoBtvnEm {
  soCauGiao: number
  soDaLam: number
  soDung: number
  soSai: number
  soChuaLam: number
  soLuot: number
  soLuotDaNop: number
  qidDung: string[]
  qidSai: string[]
  qidChuaLam: string[]
  luot: { maBtvn: string; giaoLuc: string; daNop: boolean; soCau: number; soDung: number; soSai: number; soChuaLam: number }[]
}

export async function hoSoLopLenBang(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const ds = [...new Set((Array.isArray(b.dsSbd) ? (b.dsSbd as unknown[]) : []).map((x) => chuoi(x).trim()).filter(Boolean))].slice(0, 60)
  if (ds.length === 0) return { ok: false, error: 'Thiếu danh sách số báo danh' }
  const soNgay = Number(b.soNgay) > 0 ? Number(b.soNgay) : 60
  const tu = new Date(Date.now() - soNgay * 86400000).toISOString()
  const cho = ds.map(() => '?').join(',')

  const [rTienDo, rSai, rDaLam, rBang, rBtvn] = await Promise.all([
    env.DB.prepare(`SELECT sbd, chuyen_de, so_cau, so_sai FROM tien_do_hs WHERE sbd IN (${cho}) AND so_cau > 0`).bind(...ds).all<Record<string, unknown>>(),
    env.DB.prepare(
      `SELECT sbd, qid, chuyen_de, muc_do, so_lan_sai, da_chua, ma_ca FROM ban_do_sai WHERE sbd IN (${cho}) LIMIT 6000`,
    ).bind(...ds).all<Record<string, unknown>>(),
    env.DB.prepare(`SELECT sbd, qid, so_lan FROM qid_da_lam WHERE sbd IN (${cho}) LIMIT 20000`).bind(...ds).all<Record<string, unknown>>(),
    env.DB.prepare(`SELECT sbd, qid, luc FROM len_bang WHERE sbd IN (${cho}) AND luc >= ? ORDER BY luc DESC LIMIT 4000`).bind(...ds, tu).all<Record<string, unknown>>(),
    env.DB.prepare(
      `SELECT be.sbd, be.ma_btvn, be.nop_luc, be.dap_an_json, b.ma_de, b.giao_luc, b.han_nop
         FROM btvn_em be JOIN btvn b ON b.ma_btvn = be.ma_btvn
        WHERE be.sbd IN (${cho}) AND b.da_xoa = 0
        ORDER BY b.giao_luc DESC LIMIT 600`,
    ).bind(...ds).all<Record<string, unknown>>(),
  ])

  const em: Record<string, {
    chuyenDe: { ten: string; soCau: number; soSai: number }[]
    qidSai: { qid: string; chuyenDe: string; mucDo: string; soLanSai: number; daChua: boolean; maCa: string }[]
    qidDaLam: { qid: string; soLan: number }[]
    lenBang: { soLan: number; lanCuoi: string; qids: string[] }
    btvn: HoSoBtvnEm
  }> = {}
  for (const s2 of ds) {
    em[s2] = {
      chuyenDe: [],
      qidSai: [],
      qidDaLam: [],
      lenBang: { soLan: 0, lanCuoi: '', qids: [] },
      btvn: { soCauGiao: 0, soDaLam: 0, soDung: 0, soSai: 0, soChuaLam: 0, soLuot: 0, soLuotDaNop: 0, qidDung: [], qidSai: [], qidChuaLam: [], luot: [] },
    }
  }

  for (const x of rTienDo.results ?? []) {
    const e = em[chuoi(x.sbd)]
    if (e) e.chuyenDe.push({ ten: chuoi(x.chuyen_de), soCau: Number(x.so_cau) || 0, soSai: Number(x.so_sai) || 0 })
  }
  for (const x of rSai.results ?? []) {
    const e = em[chuoi(x.sbd)]
    if (!e) continue
    e.qidSai.push({
      qid: chuoi(x.qid),
      chuyenDe: chuoi(x.chuyen_de),
      mucDo: chuoi(x.muc_do),
      soLanSai: Number(x.so_lan_sai) || 1,
      daChua: Number(x.da_chua) === 1,
      maCa: chuoi(x.ma_ca),
    })
  }
  for (const x of rDaLam.results ?? []) {
    const e = em[chuoi(x.sbd)]
    if (e) e.qidDaLam.push({ qid: chuoi(x.qid), soLan: Number(x.so_lan) || 1 })
  }
  for (const x of rBang.results ?? []) {
    const e = em[chuoi(x.sbd)]
    if (!e) continue
    e.lenBang.soLan += 1
    const luc = chuoi(x.luc)
    if (luc > e.lenBang.lanCuoi) e.lenBang.lanCuoi = luc
    const q = chuoi(x.qid)
    if (q) e.lenBang.qids.push(q)
  }

  // ── BÀI TẬP VỀ NHÀ: ĐÚNG / SAI / CHƯA LÀM cho TỪNG CÂU ────────────────────
  //
  // Thầy chốt 14/09: "tôi lấy đúng file giao về nhà cho học sinh để gọi lên
  // bảng ... phải hiển thị được học sinh đó làm bao nhiêu câu về nhà/tổng số
  // câu, bao nhiêu câu làm đúng, bao nhiêu câu làm sai, bao nhiêu câu chưa làm".
  //
  // Bảng `btvn_em` chỉ ghi TỔNG `so_dung`/`so_cau`, không ghi từng câu. Nhưng
  // nó giữ `dap_an_json` — nguyên bài làm của em. Đối chiếu với đáp án trong
  // kho (`dapAnTheoMaDe`, đúng cùng một hàm đã dùng lúc chấm) thì ra được từng
  // câu, KHÔNG phải suy ra từ con số tổng.
  //
  // Ba trạng thái, phân biệt rạch ròi — `qidSai` lúc chấm gộp cả bỏ trống vào
  // sai, ở đây thì không, vì thầy cần biết em KHÔNG LÀM khác em LÀM SAI:
  //   · dung     — em chọn, và trùng đáp án kho
  //   · sai      — em chọn, nhưng khác đáp án kho
  //   · chuaLam  — em bỏ trống, hoặc cả lượt ấy em chưa nộp
  const luotTheoMa = new Map<string, { giaoLuc: string; maDe: string }>()
  for (const x of rBtvn.results ?? []) {
    const m = chuoi(x.ma_btvn)
    if (!m || luotTheoMa.has(m)) continue
    luotTheoMa.set(m, { giaoLuc: chuoi(x.giao_luc), maDe: chuoi(x.ma_de) })
  }
  // Chỉ tính mấy lượt giao GẦN NHẤT. Bài tập tháng trước không nói gì về buổi
  // chữa hôm nay, mà đọc thêm tờ đề nào là thêm một lượt chạm R2.
  const maLuotGiu = [...luotTheoMa.entries()]
    .sort((a, c) => (c[1].giaoLuc > a[1].giaoLuc ? 1 : c[1].giaoLuc < a[1].giaoLuc ? -1 : 0))
    .slice(0, TRAN_LUOT_BTVN)
    .map(([m]) => m)
  const giu = new Set(maLuotGiu)

  const boNhoDe = new Map<string, Record<string, unknown>[]>()
  const dapAnLuot = new Map<string, Map<string, string>>()
  for (const m of maLuotGiu) {
    dapAnLuot.set(m, await dapAnTheoMaDe(env, luotTheoMa.get(m)?.maDe ?? '', boNhoDe))
  }

  // Đi từ lượt CŨ tới lượt MỚI để lượt mới nhất ghi đè: em làm lại câu ấy ở
  // lượt sau thì kết quả lượt sau mới là kết quả hiện tại của em.
  const thuTuCu = (rBtvn.results ?? []).filter((x) => giu.has(chuoi(x.ma_btvn))).reverse()
  const theoCau = new Map<string, Map<string, 'dung' | 'sai' | 'chuaLam'>>()
  for (const s2 of ds) theoCau.set(s2, new Map())

  for (const x of thuTuCu) {
    const sbd2 = chuoi(x.sbd)
    const e = em[sbd2]
    const bang = theoCau.get(sbd2)
    if (!e || !bang) continue
    const maB = chuoi(x.ma_btvn)
    const dapAn = dapAnLuot.get(maB)
    if (!dapAn || dapAn.size === 0) continue

    const daNop = Boolean(chuoi(x.nop_luc))
    let lam: Record<string, unknown> = {}
    if (daNop) {
      try {
        const o = JSON.parse(chuoi(x.dap_an_json) || '{}')
        if (o && typeof o === 'object') lam = o as Record<string, unknown>
      } catch {
        lam = {}
      }
    }

    let lDung = 0
    let lSai = 0
    let lChua = 0
    for (const [qid, dung] of dapAn) {
      const chon = daNop ? chuoi(lam[qid]).trim().toUpperCase() : ''
      const kq: 'dung' | 'sai' | 'chuaLam' = !chon ? 'chuaLam' : chon === dung ? 'dung' : 'sai'
      bang.set(qid, kq)
      if (kq === 'dung') lDung++
      else if (kq === 'sai') lSai++
      else lChua++
    }
    e.btvn.soLuot++
    if (daNop) e.btvn.soLuotDaNop++
    e.btvn.luot.push({
      maBtvn: maB,
      giaoLuc: luotTheoMa.get(maB)?.giaoLuc ?? '',
      daNop,
      soCau: dapAn.size,
      soDung: lDung,
      soSai: lSai,
      soChuaLam: lChua,
    })
  }

  for (const s2 of ds) {
    const e = em[s2]
    const bang = theoCau.get(s2)
    if (!e || !bang) continue
    e.btvn.luot.sort((a, c) => (c.giaoLuc > a.giaoLuc ? 1 : c.giaoLuc < a.giaoLuc ? -1 : 0))
    for (const [qid, kq] of bang) {
      if (kq === 'dung') e.btvn.qidDung.push(qid)
      else if (kq === 'sai') e.btvn.qidSai.push(qid)
      else e.btvn.qidChuaLam.push(qid)
    }
    e.btvn.soDung = e.btvn.qidDung.length
    e.btvn.soSai = e.btvn.qidSai.length
    e.btvn.soChuaLam = e.btvn.qidChuaLam.length
    e.btvn.soDaLam = e.btvn.soDung + e.btvn.soSai
    e.btvn.soCauGiao = e.btvn.soDaLam + e.btvn.soChuaLam
  }

  // Sắp chuyên đề theo tỉ lệ sai giảm dần ngay tại đây, để máy thầy khỏi sắp lại.
  for (const s2 of ds) {
    em[s2].chuyenDe.sort((a, c) => (c.soCau ? c.soSai / c.soCau : 0) - (a.soCau ? a.soSai / a.soCau : 0) || c.soSai - a.soSai)
  }

  return { ok: true, soNgay, em }
}

// ===========================================================================
// NGÂN HÀNG CÓ ĐÁP ÁN · ĐỀ RIÊNG · CHỈ MỤC KHO
// ===========================================================================

export async function capNhatKeyBank(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa).trim()
  if (!maCa) return { ok: false, error: 'Thiếu mã ca' }
  if (!env.DE) return { ok: false, error: 'Chưa nối R2' }
  await env.DE.put(`key/${maCa}.json`, JSON.stringify(b.keyBank ?? null))
  const ca = await env.DB.prepare('SELECT cong_bo FROM ca WHERE ma_ca = ?').bind(maCa).first<{ cong_bo: string }>()
  return { ok: true, congBo: chuoi(ca?.cong_bo) || 'khong' }
}

/** NỐI THÊM CÂU VÀO KHO CỦA MỘT CA — chỉ dùng cho đề riêng từng em. */
export async function noiKhoCa(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa).trim()
  if (!maCa) return { ok: false, error: 'Thiếu mã ca' }

  const bankObj = b.bank as Record<string, unknown> | undefined
  let pI: any[] = []
  let pII: any[] = []
  let pIII: any[] = []
  if (Array.isArray(b.bank)) {
    for (const c of b.bank) {
      const qid = chuoi(c?.id || c?.qid)
      if (qid.includes('-II-') || chuoi(c?.phan) === 'II') pII.push(c)
      else if (qid.includes('-III-') || chuoi(c?.phan) === 'III') pIII.push(c)
      else pI.push(c)
    }
  } else if (bankObj && typeof bankObj === 'object') {
    if (Array.isArray(bankObj.phanI)) pI = bankObj.phanI
    if (Array.isArray(bankObj.phanII)) pII = bankObj.phanII
    if (Array.isArray(bankObj.phanIII)) pIII = bankObj.phanIII
  }

  const dapAnMap = new Map<string, string>()
  const keyObj = b.keyBank as Record<string, unknown> | undefined
  if (keyObj && typeof keyObj === 'object') {
    if (Array.isArray(keyObj.phanI) || Array.isArray(keyObj.phanII) || Array.isArray(keyObj.phanIII)) {
      if (Array.isArray(keyObj.phanI)) {
        for (const q of keyObj.phanI) {
          const qid = chuoi(q?.id || q?.qid)
          if (qid) dapAnMap.set(qid, chuoi(q?.correct ?? q?.answer ?? ''))
        }
      }
      if (Array.isArray(keyObj.phanII)) {
        for (const q of keyObj.phanII) {
          const qid = chuoi(q?.id || q?.qid)
          if (qid) {
            let da = ''
            if (Array.isArray(q?.correct)) da = q.correct.map((x: any) => x === true || x === 'D' ? 'D' : 'S').join('')
            else if (Array.isArray(q?.ideas)) da = q.ideas.map((i: any) => i?.correct === true || i?.correct === 'D' ? 'D' : 'S').join('')
            else da = chuoi(q?.correct ?? q?.answer ?? '')
            dapAnMap.set(qid, da)
          }
        }
      }
      if (Array.isArray(keyObj.phanIII)) {
        for (const q of keyObj.phanIII) {
          const qid = chuoi(q?.id || q?.qid)
          if (qid) dapAnMap.set(qid, chuoi(q?.correct ?? q?.answer ?? ''))
        }
      }
    } else {
      for (const [k, v] of Object.entries(keyObj)) {
        dapAnMap.set(k, chuoi(v))
      }
    }
  }

  const nay = NAY()
  const tatCaCau = [...pI, ...pII, ...pIII]
  const lenh = tatCaCau.slice(0, 400).map((c) => {
    const qid = chuoi(c.id || c.qid)
    const da = dapAnMap.get(qid) || ''
    return env.DB.prepare(
      `INSERT INTO kho_ca_them (khoa, ma_ca, qid, cau_json, dap_an, luc) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(khoa) DO UPDATE SET cau_json = excluded.cau_json, dap_an = excluded.dap_an, luc = excluded.luc`,
    ).bind(`${maCa}|${qid}`, maCa, qid, JSON.stringify(c), da, nay)
  })
  for (let i = 0; i < lenh.length; i += 100) await env.DB.batch(lenh.slice(i, i + 100))

  if (env.DE && tatCaCau.length > 0) {
    // 1. Cập nhật de/${maCa}.json trong R2
    try {
      const oDe = await env.DE.get(`de/${maCa}.json`)
      let deHienTai: any = null
      if (oDe?.body) {
        try { deHienTai = await new Response(oDe.body).json() } catch {}
      }
      if (deHienTai && typeof deHienTai === 'object') {
        const daCoI = new Set((deHienTai.phanI || []).map((x: any) => chuoi(x?.id || x?.qid)))
        const daCoII = new Set((deHienTai.phanII || []).map((x: any) => chuoi(x?.id || x?.qid)))
        const daCoIII = new Set((deHienTai.phanIII || []).map((x: any) => chuoi(x?.id || x?.qid)))

        const themI = pI.filter((q) => { const id = chuoi(q?.id || q?.qid); return id && !daCoI.has(id) })
        const themII = pII.filter((q) => { const id = chuoi(q?.id || q?.qid); return id && !daCoII.has(id) })
        const themIII = pIII.filter((q) => { const id = chuoi(q?.id || q?.qid); return id && !daCoIII.has(id) })

        if (themI.length > 0 || themII.length > 0 || themIII.length > 0) {
          deHienTai.phanI = [...(deHienTai.phanI || []), ...themI]
          deHienTai.phanII = [...(deHienTai.phanII || []), ...themII]
          deHienTai.phanIII = [...(deHienTai.phanIII || []), ...themIII]
          await env.DE.put(`de/${maCa}.json`, JSON.stringify(deHienTai))
        }
      }
    } catch {}

    // 2. Cập nhật key/${maCa}.json trong R2
    try {
      const oKey = await env.DE.get(`key/${maCa}.json`)
      let keyHienTai: any = null
      if (oKey?.body) {
        try { keyHienTai = await new Response(oKey.body).json() } catch {}
      }
      if (keyHienTai && typeof keyHienTai === 'object') {
        if (Array.isArray(keyHienTai.phanI) || Array.isArray(keyHienTai.phanII) || Array.isArray(keyHienTai.phanIII)) {
          const kI = Array.isArray(keyObj?.phanI) ? keyObj.phanI : []
          const kII = Array.isArray(keyObj?.phanII) ? keyObj.phanII : []
          const kIII = Array.isArray(keyObj?.phanIII) ? keyObj.phanIII : []

          const daCoKI = new Set((keyHienTai.phanI || []).map((x: any) => chuoi(x?.id || x?.qid)))
          const daCoKII = new Set((keyHienTai.phanII || []).map((x: any) => chuoi(x?.id || x?.qid)))
          const daCoKIII = new Set((keyHienTai.phanIII || []).map((x: any) => chuoi(x?.id || x?.qid)))

          const themKI = kI.filter((q: any) => { const id = chuoi(q?.id || q?.qid); return id && !daCoKI.has(id) })
          const themKII = kII.filter((q: any) => { const id = chuoi(q?.id || q?.qid); return id && !daCoKII.has(id) })
          const themKIII = kIII.filter((q: any) => { const id = chuoi(q?.id || q?.qid); return id && !daCoKIII.has(id) })

          if (themKI.length > 0 || themKII.length > 0 || themKIII.length > 0) {
            keyHienTai.phanI = [...(keyHienTai.phanI || []), ...themKI]
            keyHienTai.phanII = [...(keyHienTai.phanII || []), ...themKII]
            keyHienTai.phanIII = [...(keyHienTai.phanIII || []), ...themKIII]
            await env.DE.put(`key/${maCa}.json`, JSON.stringify(keyHienTai))
          }
        }
      }
    } catch {}
  }

  await env.DB.prepare('UPDATE ca SET cap_nhat_luc = ? WHERE ma_ca = ?').bind(nay, maCa).run().catch(() => {})

  return { ok: true, themBank: lenh.length, themKey: dapAnMap.size }
}


// ===========================================================================
// LỆNH ĐỌC CỦA MÁY EM (trước là GET ?action=...)
// ===========================================================================

/** HỎI LẠI SAU KHI NỘP (chế độ `ca_lop_xong`, hoặc mở lại app sau khi đã nộp).
 *
 * Trả về ĐÚNG dáng `KetQuaCongBo` của đường cũ: `sanSang` là "đã được phép xem
 * đáp án chưa", và chỉ khi ấy mới kèm `keyBank`. Đếm bằng MỘT câu — không lặp
 * theo em, vì lệnh này cả lớp bắn cùng lúc lúc tan ca. */
export async function ketQuaCuaEm(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa).trim()
  if (!maCa) return { ok: false, error: 'Thiếu mã ca' }
  const ca = await env.DB.prepare('SELECT cong_bo, trang_thai FROM ca WHERE ma_ca = ?').bind(maCa).first<Record<string, unknown>>()
  if (!ca) return { ok: false, error: 'Không tìm thấy ca kiểm tra' }
  const congBo = chuoi(ca.cong_bo) || 'khong'
  const dem = await env.DB.prepare(
    `SELECT COUNT(*) AS da_vao, SUM(CASE WHEN trang_thai = 'da_nop' THEN 1 ELSE 0 END) AS da_nop
       FROM luot WHERE ma_ca = ?`,
  )
    .bind(maCa)
    .first<{ da_vao: number; da_nop: number }>()
  const daVao = Number(dem?.da_vao) || 0
  const daNop = Number(dem?.da_nop) || 0

  // CẢ LỚP XONG nghĩa là không còn ai đang làm, HOẶC thầy đã khoá ca. Ca chưa
  // ai vào thì KHÔNG tính là xong — nếu không, em mở link sớm là thấy đáp án.
  const caXong = chuoi(ca.trang_thai) === 'dong' || (daVao > 0 && daNop >= daVao)
  const sanSang = congBo === 'ngay' || (congBo === 'ca_lop_xong' && caXong)

  let keyBank: unknown = null
  if (sanSang && env.DE) {
    const o = await env.DE.get(`key/${maCa}.json`)
    if (o?.body) {
      try {
        keyBank = await new Response(o.body).json()
      } catch {
        keyBank = null
      }
    }
  }
  return { ok: true, congBo, sanSang, daNop, daVao, keyBank }
}

/** DỰNG NGÂN HÀNG CÓ ĐÁP ÁN TỪ BẢNG CHẤM, cho ca cũ thiếu khoá `key/<maCa>.json`.
 *
 * NGUỒN: `chi_tiet_cau` — mỗi dòng là một câu của CHÍNH EM ẤY, có `qid`, `phan`,
 * `so_cau` và `dap_an_dung` do máy thầy chấm ghi lên. Nội dung câu (đề bài, các
 * lựa chọn, ảnh) lấy từ gói đề công khai `de/<maCa>.json`.
 *
 * DỰNG THEO BẢNG CHẤM, KHÔNG THEO GÓI ĐỀ: ca đề riêng thì gói đề chứa cả kho
 * câu của lớp, còn bảng chấm chỉ có đúng phần của em — đi theo bảng chấm là ra
 * đúng tờ đề của em, cả ca chung lẫn ca đề riêng.
 *
 * CẤM BỊA: câu nào không tra được nội dung trong gói đề, hoặc không có đáp án
 * đúng, thì BỎ CẢ BẢN — trả `null` để màn của em hiện đúng câu "chưa có đáp án"
 * thay vì hiện một tờ đề chấm sai. */
async function keyBankTuBangCham(env: Env, maCa: string, sbd: string): Promise<unknown> {
  if (!env.DE) return null
  const o = await env.DE.get(`de/${maCa}.json`)
  if (!o?.body) return null
  let de: Record<string, unknown> | null = null
  try {
    de = (await new Response(o.body).json()) as Record<string, unknown>
  } catch {
    return null
  }
  if (!de) return null

  const noiDung = new Map<string, Record<string, unknown>>()
  for (const khoa of ['phanI', 'phanII', 'phanIII']) {
    const ds = de[khoa]
    if (!Array.isArray(ds)) continue
    for (const c of ds) {
      const id = chuoi((c as Record<string, unknown>)?.id)
      if (id) noiDung.set(id, c as Record<string, unknown>)
    }
  }
  if (noiDung.size === 0) return null

  const r = await env.DB.prepare(
    `SELECT qid, phan, so_cau, dap_an_dung FROM chi_tiet_cau
      WHERE ma_ca = ? AND sbd = ? ORDER BY so_cau`,
  )
    .bind(maCa, sbd)
    .all<Record<string, unknown>>()
  const dong = r.results ?? []
  if (dong.length === 0) return null

  // LỜI GIẢI không có trong gói công khai (`mergeAndStrip` lược sạch), nên lấy
  // từ kho. Thiếu chỗ này thì màn xem lại của em chỉ có đáp án trần.
  const khoMap = await napCauTuKho(env, dong.map((x) => chuoi(x.qid)))

  const phanI: unknown[] = []
  const phanII: unknown[] = []
  const phanIII: unknown[] = []
  for (const x of dong) {
    const cau = noiDung.get(chuoi(x.qid))
    const d = chuoi(x.dap_an_dung).trim()
    if (!cau || !d) return null
    const k = khoMap.get(chuoi(x.qid))
    if (k) Object.assign(cau, { loiGiai: k.loiGiai, dang: k.dang, chuyenDe: k.chuyenDe, mucDo: k.mucDo })
    const phan = chuoi(x.phan)
    if (phan === 'I') {
      const c = d.toUpperCase().slice(0, 1)
      if (c !== 'A' && c !== 'B' && c !== 'C' && c !== 'D') return null
      phanI.push({ ...cau, correct: c })
    } else if (phan === 'II') {
      const t = d.toUpperCase()
      if (t.length < 4) return null
      const y = [0, 1, 2, 3].map((i) => (t[i] === 'S' ? 'S' : t[i] === 'D' ? 'D' : ''))
      if (y.some((v) => v === '')) return null
      phanII.push({ ...cau, correct: y })
    } else if (phan === 'III') {
      phanIII.push({ ...cau, correct: d })
    } else {
      return null
    }
  }
  if (phanI.length + phanII.length + phanIII.length === 0) return null
  return { soCau: { I: phanI.length, II: phanII.length, III: phanIII.length }, phanI, phanII, phanIII }
}

/** CẤU HÌNH MỘT CA cho máy em (`SessionConfig`) — kèm luôn gói đề KHÔNG đáp án.
 *
 * Gói đề nằm ở R2, D1 chỉ giữ khoá đối tượng. Ca chưa phát đề thì trả `bank`
 * rỗng chứ không báo lỗi: màn của em tự hiểu là chưa tới giờ. */
export async function xemCa(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa).trim()
  const c = await env.DB.prepare('SELECT * FROM ca WHERE ma_ca = ?').bind(maCa).first<Record<string, unknown>>()
  if (!c) return { ok: true, found: false }
  let bank: unknown = undefined
  const khoa = chuoi(c.bank_r2)
  if (khoa && env.DE) {
    const o = await env.DE.get(khoa)
    if (o?.body) {
      try {
        bank = await new Response(o.body).json()
      } catch {
        bank = undefined
      }
    }
  }
  return {
    ok: true,
    found: true,
    maCa,
    tenCa: chuoi(c.ten_ca),
    lop: chuoi(c.lop),
    trangThai: chuoi(c.trang_thai),
    batDau: chuoi(c.bat_dau),
    hetHanVao: chuoi(c.het_han_vao),
    thoiGianPhut: Number(c.thoi_gian_phut) || 45,
    congBo: chuoi(c.cong_bo) || 'khong',
    bank,
  }
}

export async function dsNopCuaCa(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa).trim()
  const r = await env.DB.prepare(
    `SELECT l.sbd, l.lan_thu, l.trang_thai, l.nop_luc, l.tong, COALESCE(NULLIF(l.ho_ten,''), d.ho_ten, '') AS ho_ten
       FROM luot l LEFT JOIN danh_sach d ON d.sbd = l.sbd
      WHERE l.ma_ca = ? ORDER BY l.sbd, l.lan_thu`,
  )
    .bind(maCa)
    .all<Record<string, unknown>>()
  return {
    ok: true,
    items: (r.results ?? []).map((x) => ({
      sbd: chuoi(x.sbd),
      hoTen: chuoi(x.ho_ten),
      lanThu: Number(x.lan_thu) || 1,
      trangThai: chuoi(x.trang_thai),
      nopLuc: chuoi(x.nop_luc),
      tong: soHoacNull(x.tong),
    })),
  }
}

/** NHẬN XÉT GỬI PHỤ HUYNH — ghi điểm của lượt và lưu bản nhận xét.
 *
 * ĐẶT ĐIỂM PHẢI KHỚP LƯỢT: không có lượt thì không ghi gì, đúng luật cũ. */
export async function guiNhanXet(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa).trim()
  const sbd = chuoi(b.sbd).trim()
  if (!maCa || !sbd) return { ok: false, error: 'Thiếu mã ca hoặc số báo danh' }
  const d = (b.diemPhan ?? {}) as Record<string, unknown>
  const nay = NAY()
  const r = await env.DB.prepare(
    `UPDATE luot SET tong = ?, diem_i = COALESCE(?, diem_i), diem_ii = COALESCE(?, diem_ii),
                     diem_iii = COALESCE(?, diem_iii), cap_nhat_luc = ?
      WHERE ma_ca = ? AND sbd = ? AND lan_thu = (SELECT MAX(lan_thu) FROM luot WHERE ma_ca = ? AND sbd = ?)`,
  )
    .bind(soHoacNull(b.diem), soHoacNull(d.I), soHoacNull(d.II), soHoacNull(d.III), nay, maCa, sbd, maCa, sbd)
    .run()
  if ((r.meta.changes ?? 0) === 0) return { ok: false, error: 'Không tìm thấy lượt của em trong ca này' }
  await env.DB.prepare('INSERT INTO nhan_xet (sbd, ma_ca, noi_dung, luc) VALUES (?, ?, ?, ?)')
    .bind(sbd, maCa, JSON.stringify({ xepLoai: chuoi(b.xepLoai), cauSai: b.cauSai ?? null, diem: soHoacNull(b.diem) }), nay)
    .run()
  return { ok: true }
}

/** TRA SỐ BÁO DANH — một câu, nối sang `ca` để lấy luôn tên ca.
 *
 * Đường cũ hỏi Apps Script và mất 1,5–2,9 giây chỉ để đọc một ô. Ở đây là một
 * lượt đọc chỉ mục. Bảng danh sách RỖNG thì KHÔNG chặn — giữ đúng luật cũ. */
export async function traSbd(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa).trim()
  const sbd = chuoi(b.sbd).trim()
  if (!sbd) return { ok: false, lyDo: 'thieu', error: 'Thiếu số báo danh' }
  const r = await env.DB.prepare(
    `SELECT d.ho_ten, d.nam_sinh, d.lop, (SELECT ten_ca FROM ca WHERE ma_ca = ?) AS ten_ca
       FROM danh_sach d WHERE d.sbd = ?`,
  )
    .bind(maCa, sbd)
    .first<Record<string, unknown>>()
  if (!r) {
    const co = await env.DB.prepare('SELECT COUNT(*) AS n FROM danh_sach').first<{ n: number }>()
    if ((Number(co?.n) || 0) === 0) return { ok: true, sbd, hoTen: '', lop: '', tenCa: '' }
    return { ok: false, lyDo: 'khong_co_sbd', error: 'Không có số báo danh này trong danh sách lớp' }
  }
  return { ok: true, sbd, hoTen: chuoi(r.ho_ten), namSinh: chuoi(r.nam_sinh), lop: chuoi(r.lop), tenCa: chuoi(r.ten_ca) }
}

/** GỬI NHẬN XÉT kèm ĐẶT ĐIỂM. Không phải thầy thì phải đúng máy đã làm bài —
 * giữ nguyên cổng `idThietBi` của đường cũ, không nới. */
export async function guiNhanXetCoQuyen(env: Env, b: Record<string, unknown>, laThay: boolean): Promise<Record<string, unknown>> {
  if (!laThay) {
    const maCa = chuoi(b.maCa).trim()
    const sbd = chuoi(b.sbd).trim()
    const idTb = chuoi(b.idThietBi).trim()
    if (!idTb) return { ok: false, error: 'Thiếu mã thiết bị' }
    const l = await env.DB.prepare('SELECT id_thiet_bi FROM luot WHERE ma_ca = ? AND sbd = ? ORDER BY lan_thu DESC LIMIT 1')
      .bind(maCa, sbd)
      .first<{ id_thiet_bi: string }>()
    if (!l || chuoi(l.id_thiet_bi) !== idTb) return { ok: false, error: 'Máy này không phải máy đã làm bài' }
  }
  return guiNhanXet(env, b)
}

/** CÂU KHẮC PHỤC CHO MỘT EM — trả về GÓI ĐỀ chứa câu, đúng dáng đường cũ.
 *
 * Máy em cần nội dung câu (đề, phương án, lời giải), mà nội dung nằm trong gói
 * đề trên R2 chứ không nằm ở D1. Nên thứ tự là: chọn qid ở D1 (rẻ, có chỉ mục)
 * → gom theo mã đề → tải ĐÚNG những gói đề ấy.
 *
 * TRẦN 8 GÓI ĐỀ một lượt: mỗi gói vài trăm KB, tải cả kho về máy em là đúng cái
 * đã làm đường cũ mất hơn 20 giây. */
/** Số tờ đề mở ra để tìm câu cùng dạng. Mỗi tờ ~400 KB trên R2, đọc trong
 * cùng mạng Cloudflare nên rẻ; gói TRẢ VỀ thì đã cắt còn đúng câu cùng dạng. */
// Số TỜ ĐỀ máy chủ mở ra để tìm câu cùng dạng.
//
// 14/09 nâng 14 → 40. Lý do: từ nay MỌI máy của em đều lấy vùng chọn từ đây
// (trước đó máy nào tình cờ có kho của thầy trong IndexedDB thì đọc kho ấy,
// nên hai máy ra hai con số — thầy bắt được). Vùng chọn hẹp là em mất chỗ
// luyện, nên phải nới; nhưng vẫn phải chặn, vì mỗi tờ là một lượt đọc R2 và
// gói trả về càng to thì máy em tải càng lâu.
//
// Đo thật 14/09 với ca Test6: 14 tờ ⇒ 175 câu · 395 KB · 0,44 giây.
const TRAN_TO_DE_THEO_DANG = 40

/** Gom câu CÙNG MÃ DẠNG từ nhiều tờ đề, mỗi tờ cắt còn đúng phần cần.
 *
 * CHIA ĐỀU THEO DẠNG, không để một dạng nuốt hết chỗ: đi vòng tròn qua các mã
 * dạng, mỗi vòng lấy một câu. Em sai tám dạng thì phải có câu cho cả tám, chứ
 * không phải sáu mươi câu của một dạng.
 *
 * CẤM BỊA: tờ nào đọc không được thì bỏ tờ ấy, không dựng câu thay. */
async function goiTheoDang(
  env: Env,
  x: { dsDang: Set<string>; dong: Record<string, unknown>[]; loaiTru: Set<string>; sbd: string; soCau: number },
): Promise<Record<string, unknown>> {
  const daLam = new Set<string>()
  if (x.sbd) {
    const rL = await env.DB.prepare('SELECT qid FROM qid_da_lam WHERE sbd = ?').bind(x.sbd).all<Record<string, unknown>>()
    for (const r of rL.results ?? []) daLam.add(chuoi(r.qid))
  }

  // CHỌN TỜ ĐỀ CHIA ĐỀU THEO CHUYÊN ĐỀ, không xếp thuần theo số câu.
  //
  // Đo lần đầu 14/09: em sai 9 dạng, máy chủ mở 8 tờ mà vẫn thiếu 4 dạng. Bốn
  // dạng ấy đều thuộc "Liên kết hoá học" và nằm trong các tờ 10-C3-B12,
  // 10-C3-B13 — kho CÓ câu, chỉ là mấy tờ ấy ít câu hơn tờ Ester nên rơi khỏi
  // tốp đầu. Xếp thuần theo số câu là để một chuyên đề đông câu chiếm hết chỗ.
  //
  // Nay đi vòng tròn: mỗi vòng lấy tờ tốt nhất của TỪNG chuyên đề.
  const theoCd = new Map<string, Map<string, number>>()
  for (const r of x.dong) {
    const m = chuoi(r.ma_de)
    if (!m) continue
    const cd = chuoi(r.chuyen_de) || '(không rõ)'
    if (!theoCd.has(cd)) theoCd.set(cd, new Map())
    const b = theoCd.get(cd)!
    b.set(m, (b.get(m) ?? 0) + 1)
  }
  const xepTheoCd = [...theoCd.values()].map((b) => [...b.entries()].sort((a, c) => c[1] - a[1]).map(([m]) => m))
  const dsMaDe: string[] = []
  const daCo = new Set<string>()
  for (let vong = 0; dsMaDe.length < TRAN_TO_DE_THEO_DANG; vong++) {
    let themDuoc = false
    for (const ds of xepTheoCd) {
      if (vong >= ds.length) continue
      const m = ds[vong]
      themDuoc = true
      if (daCo.has(m)) continue
      daCo.add(m)
      dsMaDe.push(m)
      if (dsMaDe.length >= TRAN_TO_DE_THEO_DANG) break
    }
    if (!themDuoc) break
  }

  // qid → câu, và mã dạng → danh sách qid
  const cauTheoQid = new Map<string, { maDe: string; cau: Record<string, unknown> }>()
  const qidTheoDang = new Map<string, string[]>()
  for (const maDe of dsMaDe) {
    let goi: any = null
    try {
      const o = await env.DE!.get(`kho/${maDe}.json`)
      if (o?.body) goi = await new Response(o.body).json()
    } catch (e) {
      console.warn('[kho] không đọc được gói đề', maDe, e)
    }
    if (!goi) continue
    const gom: any[] = Array.isArray(goi.cau) ? goi.cau : []
    for (const k of ['phanI', 'phanII', 'phanIII']) if (Array.isArray(goi[k])) gom.push(...goi[k])
    for (const c of gom) {
      if (!c || typeof c !== 'object') continue
      const ma = maDang(c.dang)
      if (!ma || !x.dsDang.has(ma)) continue
      const qid = chuoi(c.qid ?? c.id) || `${maDe}-${chuoi(c.phan).toUpperCase()}-${chuoi(c.so)}`
      if (!qid || x.loaiTru.has(qid) || daLam.has(qid) || cauTheoQid.has(qid)) continue
      cauTheoQid.set(qid, { maDe, cau: c })
      if (!qidTheoDang.has(ma)) qidTheoDang.set(ma, [])
      qidTheoDang.get(ma)!.push(qid)
    }
  }

  // Vòng tròn qua từng dạng cho tới khi đủ số câu hoặc hết ứng viên.
  const thuTu: string[] = []
  const dsDangCo = [...qidTheoDang.keys()]
  for (let vong = 0; thuTu.length < x.soCau; vong++) {
    let themDuoc = false
    for (const ma of dsDangCo) {
      const ds = qidTheoDang.get(ma)!
      if (vong >= ds.length) continue
      thuTu.push(ds[vong])
      themDuoc = true
      if (thuTu.length >= x.soCau) break
    }
    if (!themDuoc) break
  }

  // Cắt gói: mỗi tờ chỉ còn đúng câu đã chọn.
  const chon = new Set(thuTu)
  const theoDeRa = new Map<string, unknown[]>()
  for (const qid of thuTu) {
    const v = cauTheoQid.get(qid)!
    if (!theoDeRa.has(v.maDe)) theoDeRa.set(v.maDe, [])
    theoDeRa.get(v.maDe)!.push(v.cau)
  }
  const items = [...theoDeRa.entries()].map(([ma_de, cau]) => ({ ma_de, cau }))

  return {
    ok: true,
    items,
    soCau: thuTu.length,
    soChon: cauTheoQid.size,
    thuTu,
    catBotViNang: cauTheoQid.size > chon.size,
    // Nói rõ dạng nào không tìm được câu nào — để màn hình khỏi im lặng.
    dangThieu: [...x.dsDang].filter((m) => !qidTheoDang.has(m)),
  }
}

/** Trần số câu một lượt xin kho khắc phục. Máy em và máy thầy CÙNG dùng số
 * này, nên đổi ở đây là đổi cho cả hai — không có chỗ thứ hai để lệch. */
export const TRAN_CAU_KHAC_PHUC = 200

export async function cauKhacPhucGoi(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sbd = chuoi(b.sbd).trim()
  // TRẦN SỐ CÂU TRẢ VỀ. Nâng 60 → 200 ngày 14/09 cùng lý do với
  // `TRAN_TO_DE_THEO_DANG`: đây nay là vùng chọn DUY NHẤT của mọi máy học
  // sinh, nên 60 là quá hẹp. Trần phải giữ — gói to là máy em tải lâu.
  const soCau = Math.max(1, Math.min(TRAN_CAU_KHAC_PHUC, Number(b.soCau) || 20))
  const loaiTru = new Set((Array.isArray(b.loaiTru) ? (b.loaiTru as unknown[]) : []).map((x) => chuoi(x)))
  let dsCd = (Array.isArray(b.chuyenDe) ? (b.chuyenDe as unknown[]) : []).map((x) => chuoi(x)).filter(Boolean)

  // Không nói chuyên đề thì lấy đúng chuyên đề em ĐANG SAI — đó là việc của
  // phiếu khắc phục. Không có bản đồ sai thì trả rỗng, KHÔNG rút bừa.
  if (dsCd.length === 0 && sbd) {
    const r = await env.DB.prepare('SELECT DISTINCT chuyen_de FROM ban_do_sai WHERE sbd = ? AND da_chua = 0 LIMIT 12')
      .bind(sbd)
      .all<Record<string, unknown>>()
    dsCd = (r.results ?? []).map((x) => chuoi(x.chuyen_de)).filter(Boolean)
  }
  if (dsCd.length === 0) return { ok: true, items: [], soCau: 0, soChon: 0, thuTu: [], catBotViNang: false }

  const oCd = dsCd.map(() => '?').join(',')
  const rCau = await env.DB.prepare(
    `SELECT c.qid, c.ma_de, c.chuyen_de FROM cau_hoi c JOIN de_kho d ON d.ma_de = c.ma_de
      WHERE d.da_xoa = 0 AND c.chuyen_de IN (${oCd}) LIMIT 3000`,
  )
    .bind(...dsCd)
    .all<Record<string, unknown>>()

  // ĐƯỜNG RIÊNG CHO MÀN KHẮC PHỤC: LỌC THEO MÃ DẠNG.
  //
  // Thầy bắt được 14/09: trên máy em, 9 dạng sai mà chỉ 1 dạng có câu luyện.
  // Đường cũ gom câu theo CHUYÊN ĐỀ rồi xếp tờ đề theo số câu dùng được và lấy
  // câu từ tờ đầu cho đủ `soCau` — tối ưu cho "ít byte nhất cho N câu", đúng
  // với việc nó sinh ra (dựng một phiếu bài tập). Nhưng màn khắc phục cần VÙNG
  // CHỌN rộng theo DẠNG, mà dạng thì rải khắp các tờ; lấy trọn tờ đầu là tám
  // dạng còn lại không có lấy một ứng viên.
  //
  // Nên khi có `dsDang`, đi đường khác hẳn: mở nhiều tờ hơn, và mỗi tờ chỉ giữ
  // lại đúng những câu CÙNG MÃ DẠNG. Gói trả về vì thế nhỏ hơn đường cũ dù đọc
  // nhiều tờ hơn.
  //
  // `cau_hoi` chưa có cột mã dạng nên không lọc được bằng SQL; mã dạng nằm
  // trong gói kho. Vẫn rẻ: chỉ đọc R2, không đọc thêm D1.
  const dsDang = new Set(
    (Array.isArray(b.dsDang) ? (b.dsDang as unknown[]) : []).map((x) => chuoi(x).trim()).filter(Boolean),
  )
  if (dsDang.size > 0 && env.DE) {
    return await goiTheoDang(env, {
      dsDang,
      dong: rCau.results ?? [],
      loaiTru,
      sbd,
      soCau,
    })
  }

  const daLam = new Set<string>()
  if (sbd) {
    const rL = await env.DB.prepare('SELECT qid FROM qid_da_lam WHERE sbd = ?').bind(sbd).all<Record<string, unknown>>()
    for (const x of rL.results ?? []) daLam.add(chuoi(x.qid))
  }

  const con = (rCau.results ?? []).filter((x) => {
    const q = chuoi(x.qid)
    return q !== '' && !loaiTru.has(q) && !daLam.has(q)
  })

  // GOM THEO ĐỀ rồi chọn đề nhiều câu dùng được nhất: cùng một số câu, ít gói
  // đề hơn nghĩa là ít byte phải tải hơn.
  const theoDe = new Map<string, string[]>()
  for (const x of con) {
    const m = chuoi(x.ma_de)
    if (!theoDe.has(m)) theoDe.set(m, [])
    theoDe.get(m)!.push(chuoi(x.qid))
  }
  const xepDe = [...theoDe.entries()].sort((a, c) => c[1].length - a[1].length).slice(0, 8)

  const thuTu: string[] = []
  for (const [, qids] of xepDe) {
    for (const q of qids) {
      if (thuTu.length >= soCau) break
      thuTu.push(q)
    }
    if (thuTu.length >= soCau) break
  }

  const items: unknown[] = []
  if (env.DE) {
    for (const [maDe] of xepDe) {
      if (!thuTu.some((q) => (theoDe.get(maDe) ?? []).includes(q))) continue
      const o = await env.DE.get(`kho/${maDe}.json`)
      if (!o?.body) continue
      try {
        items.push(await new Response(o.body).json())
      } catch {
        // Gói hỏng thì BỎ QUA gói ấy, không làm chết cả lượt rút.
      }
    }
  }

  return {
    ok: true,
    items,
    soCau: thuTu.length,
    soChon: con.length,
    thuTu,
    catBotViNang: con.length > thuTu.length,
  }
}

/** GHI PHIẾU BÀI TẬP CỦA EM — sinh mã, cất gói lên R2, ghi sổ phiếu. */
export async function ghiPhieuKhacPhuc(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sbd = chuoi(b.sbd).trim()
  if (!sbd) return { ok: false, error: 'Thiếu số báo danh' }
  const cau = Array.isArray(b.cau) ? (b.cau as unknown[]) : []
  if (cau.length === 0) return { ok: false, error: 'Phiếu không có câu nào' }
  const ma = maNgauNhien()
  const r = await luuPhieu(env, {
    ma,
    maCa: chuoi(b.maCa),
    sbd,
    hoTen: chuoi(b.hoTen),
    loai: 'baitap',
    phieu: { cau, tenChuyenDe: chuoi(b.tenChuyenDe), sbd, hoTen: chuoi(b.hoTen), maCa: chuoi(b.maCa) },
  })
  if (!r.ok) return r
  return { ok: true, ma }
}

/** MÃ PHIẾU — 10 ký tự từ nguồn ngẫu nhiên thật của trình chạy, không phải
 * `Math.random`: mã này là thứ duy nhất bảo vệ phiếu của một em. */
export function maNgauNhien(): string {
  const b = new Uint8Array(8)
  crypto.getRandomValues(b)
  let s = ''
  for (const x of b) s += 'abcdefghijkmnpqrstuvwxyz23456789'[x % 32]
  return s
}

// ===========================================================================
// CỔNG THÔNG TIN HỌC SINH — ĐĂNG NHẬP, ĐẶT MẬT KHẨU, LỊCH SỬ & KHẮC PHỤC
// ===========================================================================

export async function hsDangNhap(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sbd = chuoi(b.sbd).trim()
  const matKhau = chuoi(b.matKhau).trim()
  if (!sbd) return { ok: false, error: 'Thiếu số báo danh' }

  let em = await env.DB.prepare('SELECT sbd, ho_ten, nam_sinh, lop, mat_khau FROM hoc_sinh WHERE sbd = ?')
    .bind(sbd)
    .first<Record<string, unknown>>()

  if (!em) {
    const ds = await env.DB.prepare('SELECT sbd, ho_ten, nam_sinh, lop FROM danh_sach WHERE sbd = ?')
      .bind(sbd)
      .first<Record<string, unknown>>()
    if (ds) {
      await env.DB.prepare('INSERT OR IGNORE INTO hoc_sinh (sbd, ho_ten, nam_sinh, lop, cap_nhat_luc) VALUES (?, ?, ?, ?, ?)')
        .bind(sbd, chuoi(ds.ho_ten), chuoi(ds.nam_sinh), chuoi(ds.lop), NAY())
        .run()
      em = { ...ds, mat_khau: null }
    }
  }

  if (!em) {
    const lt = await env.DB.prepare('SELECT sbd, ho_ten FROM luot WHERE sbd = ? LIMIT 1')
      .bind(sbd)
      .first<Record<string, unknown>>()
    if (lt) {
      await env.DB.prepare('INSERT OR IGNORE INTO hoc_sinh (sbd, ho_ten, cap_nhat_luc) VALUES (?, ?, ?)')
        .bind(sbd, chuoi(lt.ho_ten), NAY())
        .run()
      em = { sbd, ho_ten: chuoi(lt.ho_ten), nam_sinh: '', lop: '', mat_khau: null }
    }
  }

  if (!em) return { ok: false, error: 'Số báo danh không tồn tại trong hệ thống' }

  const daCoMatKhau = em.mat_khau !== null && chuoi(em.mat_khau).trim().length > 0
  if (!daCoMatKhau) {
    return {
      ok: true,
      chuaCoMatKhau: true,
      sbd,
      hoTen: chuoi(em.ho_ten),
      lop: chuoi(em.lop),
      namSinh: chuoi(em.nam_sinh),
    }
  }

  if (!matKhau) {
    return { ok: false, error: 'Vui lòng nhập mật khẩu' }
  }

  if (matKhau !== chuoi(em.mat_khau).trim()) {
    return { ok: false, error: 'Mật khẩu không chính xác' }
  }

  return {
    ok: true,
    chuaCoMatKhau: false,
    sbd,
    hoTen: chuoi(em.ho_ten),
    lop: chuoi(em.lop),
    namSinh: chuoi(em.nam_sinh),
  }
}

export async function hsDatMatKhau(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sbd = chuoi(b.sbd).trim()
  const matKhauMoi = chuoi(b.matKhauMoi).trim()
  const matKhauCu = chuoi(b.matKhauCu).trim()
  if (!sbd) return { ok: false, error: 'Thiếu số báo danh' }
  if (!matKhauMoi || matKhauMoi.length < 4) return { ok: false, error: 'Mật khẩu mới phải từ 4 ký tự trở lên' }

  const em = await env.DB.prepare('SELECT sbd, mat_khau FROM hoc_sinh WHERE sbd = ?')
    .bind(sbd)
    .first<Record<string, unknown>>()
  if (!em) return { ok: false, error: 'Không tìm thấy học sinh' }

  const daCoMatKhau = em.mat_khau !== null && chuoi(em.mat_khau).trim().length > 0
  if (daCoMatKhau && chuoi(em.mat_khau).trim() !== matKhauCu) {
    return { ok: false, error: 'Mật khẩu cũ không chính xác' }
  }

  await env.DB.prepare('UPDATE hoc_sinh SET mat_khau = ?, cap_nhat_luc = ? WHERE sbd = ?')
    .bind(matKhauMoi, NAY(), sbd)
    .run()

  return { ok: true, message: 'Cập nhật mật khẩu thành công' }
}

export async function resetMatKhauHs(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sbd = chuoi(b.sbd).trim()
  if (!sbd) return { ok: false, error: 'Thiếu số báo danh' }

  await env.DB.prepare("UPDATE hoc_sinh SET mat_khau = '12121212', cap_nhat_luc = ? WHERE sbd = ?")
    .bind(NAY(), sbd)
    .run()

  return { ok: true, sbd, matKhauMoi: '12121212' }
}

/** LỜI GIẢI + NHÃN DẠNG THẬT, LẤY TỪ KHO ĐỀ `kho/<maDe>.json`.
 *
 * NGUYÊN NHÂN GỐC, thầy bắt được 14/09 qua hai màn khác nhau:
 *
 *   · Báo cáo câu sai in "Bản chất kiến thức cốt lõi chuyên đề …: Đáp án đúng
 *     của câu này là 3. Cần chú ý định luật bảo toàn…" thay cho ba bước tính.
 *   · Màn Khắc phục câu sai trên điện thoại: 10 câu sai mà "Tỷ lệ tối đa:
 *     0 câu", rút ra 0/0, kèm dòng "Kho đề hiện tại chưa có câu hỏi tương tự
 *     cùng nhãn dán".
 *
 * Hai triệu chứng, MỘT nguyên nhân: nội dung câu cho báo cáo được dựng lại từ
 * gói đề CÔNG KHAI `de/<maCa>.json`, mà gói ấy do `mergeAndStrip` tạo ra —
 * hàm liệt kê từng trường được giữ và KHÔNG giữ `loiGiai`, `dang`, `kienThuc`,
 * `loiThuongGap`. Đúng về bảo mật (gói ấy gửi cho em TRƯỚC khi làm bài), nhưng
 * báo cáo thì lại đọc đúng gói ấy, nên vừa mất lời giải vừa mất nhãn dạng.
 *
 * Kho đề KHÔNG hề thiếu: đếm 14/09 trên 157 tờ, cả 4.841 câu phần I, 1.293 câu
 * phần II và 1.800 câu phần III đều có lời giải đủ cấu trúc.
 *
 * Nên nay lấy thẳng từ kho — nguồn gốc, có đáp án, KHÔNG BAO GIỜ đi ra đường
 * công khai. Đường này chỉ chạy cho báo cáo SAU KHI NỘP, nơi đáp án vốn đã
 * hiện rồi, nên không mở thêm cửa lộ đề nào.
 *
 * Không đoán: câu nào kho không có thì để trống, để màn hình nói "chưa có lời
 * giải" thay vì dựng chữ. */
const TRAN_TO_DE_MOI_LUOT = 8

export interface CauKho {
  loiGiai?: unknown
  dang?: unknown
  chuyenDe?: string
  mucDo?: string
  kienThuc?: unknown
  loiThuongGap?: unknown
  /**
   * SỐ SAO của câu — 0, 1 hoặc 2. Thầy gắn trong kho đề ở `can_chua.sao`.
   *
   * Thầy chốt 15-09: *"khó là những câu 2 sao, bạn dựa vào đó để phân"*. Bản
   * trước hàm này ĐỌC câu từ kho rồi VỨT trường ấy đi, nên game không có cách
   * nào biết câu nào khó — phải đoán qua nhãn `mucDo`, mà nhãn ấy phần lớn
   * chưa gắn.
   */
  sao?: 0 | 1 | 2
}

/** Số sao của một câu thô trong kho, đọc mọi cách viết đã từng dùng. */
export function saoCuaCau(c: Record<string, unknown>): 0 | 1 | 2 {
  const cc = (c.can_chua ?? c.canChua) as Record<string, unknown> | undefined
  const v = cc !== undefined && cc !== null ? cc.sao : (c.sao ?? c.so_sao)
  const n = Math.round(Number(v))
  return n === 1 || n === 2 ? n : 0
}

/** `<mã đề>-<phần>-<số>` — cắt ngược ra mã đề khi `cau_hoi` chưa có dòng. */
function maDeTuQid(qid: string): string {
  return qid.replace(/-(?:I|II|III)-\d+$/, '')
}

export async function napCauTuKho(env: Env, qids: string[]): Promise<Map<string, CauKho>> {
  const ra = new Map<string, CauKho>()
  if (!env.DE) return ra
  const ds = [...new Set(qids.map((q) => chuoi(q).trim()).filter(Boolean))].slice(0, 500)
  if (ds.length === 0) return ra

  // Mã đề lấy từ chỉ mục D1 trước (chuẩn nhất), thiếu thì cắt từ chính qid.
  const theoQid = new Map<string, string>()
  for (let i = 0; i < ds.length; i += 100) {
    const lo = ds.slice(i, i + 100)
    const r = await env.DB.prepare(`SELECT qid, ma_de FROM cau_hoi WHERE qid IN (${lo.map(() => '?').join(',')})`)
      .bind(...lo)
      .all<Record<string, unknown>>()
    for (const x of r.results ?? []) theoQid.set(chuoi(x.qid), chuoi(x.ma_de))
  }
  for (const q of ds) if (!theoQid.get(q)) theoQid.set(q, maDeTuQid(q))

  const dsMaDe = [...new Set([...theoQid.values()].filter(Boolean))].slice(0, TRAN_TO_DE_MOI_LUOT)
  const can = new Set(ds)

  for (const maDe of dsMaDe) {
    let goi: any = null
    try {
      const o = await env.DE.get(`kho/${maDe}.json`)
      if (o?.body) goi = await new Response(o.body).json()
    } catch (e) {
      console.warn('[kho] không đọc được gói đề', maDe, e)
    }
    if (!goi) continue
    const gom: any[] = Array.isArray(goi.cau) ? goi.cau : []
    for (const k of ['phanI', 'phanII', 'phanIII']) if (Array.isArray(goi[k])) gom.push(...goi[k])
    for (const c of gom) {
      if (!c || typeof c !== 'object') continue
      const qid = chuoi(c.qid ?? c.id) || `${maDe}-${chuoi(c.phan).toUpperCase()}-${chuoi(c.so)}`
      if (!can.has(qid) || ra.has(qid)) continue
      ra.set(qid, {
        loiGiai: c.loiGiai ?? c.loi_giai ?? c.explanation ?? c.giaiThich ?? c.giai_thich,
        dang: c.dang,
        chuyenDe: chuoi(c.chuyenDe ?? c.chuyen_de),
        mucDo: chuoi(c.mucDo ?? c.muc_do),
        kienThuc: c.kienThuc ?? c.kien_thuc,
        loiThuongGap: c.loiThuongGap ?? c.loi_thuong_gap,
        sao: saoCuaCau(c as Record<string, unknown>),
      })
    }
  }
  return ra
}

/** Lời giải về một chuỗi cho máy em đọc — object thì gói JSON, chữ thì giữ. */
export function chuoiLoiGiai(raw: unknown): string {
  if (!raw) return ''
  if (typeof raw === 'object') return JSON.stringify(raw)
  const s = chuoi(raw)
  return s === '[object Object]' ? '' : s
}

/** MÃ dạng (chuỗi `ma` trong bảng đóng `kho-de/DANG-BAI.md`), rỗng khi chưa gắn. */
export function maDang(raw: unknown): string {
  if (!raw || typeof raw !== 'object') return ''
  return chuoi((raw as Record<string, unknown>).ma || '')
}

/** Nhãn dạng về một chuỗi tên dạng. */
export function chuoiDang(raw: unknown): string {
  if (!raw) return ''
  if (typeof raw === 'object') {
    const o = raw as Record<string, unknown>
    return chuoi(o.ten || o.ma || '')
  }
  const s = chuoi(raw)
  return s === '[object Object]' ? '' : s
}

async function docBankDe(env: Env, maCa: string): Promise<Record<string, unknown> | null> {
  if (!env.DE) return null
  try {
    const oKey = await env.DE.get(`key/${maCa}.json`)
    if (oKey?.body) return (await new Response(oKey.body).json()) as Record<string, unknown>
  } catch {}
  try {
    const oDe = await env.DE.get(`de/${maCa}.json`)
    if (oDe?.body) return (await new Response(oDe.body).json()) as Record<string, unknown>
  } catch {}
  return null
}

export interface DanhGiaLuotOutput {
  tongCau: number
  soCauDung: number
  soCauSai: number
  soBoTrong: number
  dsCauSai: Array<Record<string, unknown>>
  dsChiTiet: Array<Record<string, unknown>>
}

export function danhGiaLuot(
  bData: any,
  caRow: Record<string, unknown> | null,
  dapAnObj: any,
  sbd: string,
  maCa: string,
  lanThu: number = 1,
  tenCa: string = '',
): DanhGiaLuotOutput {
  const rawBoGoc = caRow?.bo_theo_em_json ? doJson(caRow.bo_theo_em_json) : (bData?.boTheoEm ? bData.boTheoEm : null)
  const goiGoc = rawBoGoc && typeof rawBoGoc === 'object' ? (rawBoGoc as Record<string, unknown>) : null
  const goiRieng = locGoiDeRiengChoEm(goiGoc, sbd)
  const boCuaEm = trichBoCauCuaEm(goiRieng ?? goiGoc, sbd)
  const boSet = boCuaEm && boCuaEm.length > 0 ? new Set(boCuaEm.map(chuoi)) : null

  const soCauCa = caRow?.so_cau_json ? (doJson(caRow.so_cau_json) as Record<string, number> | null) : (bData?.soCau as Record<string, number> | null)

  const daI = (dapAnObj?.phanI || dapAnObj || {}) as Record<string, unknown>
  const daII = (dapAnObj?.phanII || {}) as Record<string, unknown>
  const daIII = (dapAnObj?.phanIII || {}) as Record<string, unknown>

  const layCauPhan = (dsGoc: any[], daPhan: Record<string, unknown>, canSoCau: number | undefined) => {
    const daLamKeys = new Set(Object.keys(daPhan).map(chuoi).filter((k) => k && chuoi(daPhan[k]).trim() !== '' && chuoi(daPhan[k]).trim() !== '----'))
    const daNop = dsGoc.filter((q) => daLamKeys.has(chuoi(q.id || q.qid)))
    const daNopIds = new Set(daNop.map((q) => chuoi(q.id || q.qid)))

    const boRieng = boSet ? dsGoc.filter((q) => boSet.has(chuoi(q.id || q.qid)) && !daNopIds.has(chuoi(q.id || q.qid))) : []
    const daCoIds = new Set([...daNopIds, ...boRieng.map((q) => chuoi(q.id || q.qid))])

    let ketQua = [...daNop, ...boRieng]

    const can = typeof canSoCau === 'number' && canSoCau > 0 ? canSoCau : (boSet ? ketQua.length : dsGoc.length)
    if (ketQua.length < can) {
      const conLai = dsGoc.filter((q) => !daCoIds.has(chuoi(q.id || q.qid)))
      ketQua = [...ketQua, ...conLai.slice(0, can - ketQua.length)]
    } else if (can > 0 && !boSet && daNop.length === 0) {
      ketQua = dsGoc.slice(0, can)
    }
    return ketQua
  }

  // KHÔI PHỤC BA DÒNG KHAI BÁO (14/09, 13:00).
  //
  // Một phiên làm việc khác viết lại `danhGiaLuot` theo `layCauPhan` nhưng bỏ
  // mất ba dòng dựng `pI`/`pII`/`pIII` từ gói đề, để lại 18 lỗi biên dịch —
  // `wrangler` bó bằng esbuild nên KHÔNG chặn, đẩy lên là mỗi lượt chấm ném
  // ReferenceError và mọi báo cáo câu sai chết. Ba dòng dưới đây là đúng thứ
  // đoạn mã mới ấy đang cần; thiết kế của nó giữ nguyên, không sửa một chữ.
  let pI: any[] = Array.isArray(bData?.phanI) ? bData.phanI : []
  let pII: any[] = Array.isArray(bData?.phanII) ? bData.phanII : []
  let pIII: any[] = Array.isArray(bData?.phanIII) ? bData.phanIII : []

  pI = layCauPhan(pI, daI, soCauCa?.I)
  pII = layCauPhan(pII, daII, soCauCa?.II)
  pIII = layCauPhan(pIII, daIII, soCauCa?.III)

  let soCauDung = 0
  let soCauSai = 0
  const dsCauSai: Array<Record<string, unknown>> = []
  const dsChiTiet: Array<Record<string, unknown>> = []
  const qidDaXet = new Set<string>()

  pI.forEach((q, idx) => {
    const qid = chuoi(q.id || q.qid) || `I_${idx + 1}`
    qidDaXet.add(qid)
    const chon = chuoi(daI[qid] ?? '').trim().toUpperCase()
    const dung = chuoi(q.correct ?? '').trim().toUpperCase()
    if (!chon) {
      soCauSai++
      const item = { ma_ca: maCa, sbd, lan_thu: lanThu, phan: 'I', so_cau: idx + 1, qid, chuyen_de: chuoi(q.chuyenDe), muc_do: chuoi(q.mucDo), dap_an_chon: '', dap_an_dung: dung, dung_sai: 0, ten_ca: tenCa, chua_lam: 1 }
      dsChiTiet.push(item)
      dsCauSai.push(item)
    } else if (chon === dung) {
      soCauDung++
      dsChiTiet.push({ ma_ca: maCa, sbd, lan_thu: lanThu, phan: 'I', so_cau: idx + 1, qid, chuyen_de: chuoi(q.chuyenDe), muc_do: chuoi(q.mucDo), dap_an_chon: chon, dap_an_dung: dung, dung_sai: 1, ten_ca: tenCa })
    } else {
      soCauSai++
      const item = { ma_ca: maCa, sbd, lan_thu: lanThu, phan: 'I', so_cau: idx + 1, qid, chuyen_de: chuoi(q.chuyenDe), muc_do: chuoi(q.mucDo), dap_an_chon: chon, dap_an_dung: dung, dung_sai: 0, ten_ca: tenCa }
      dsChiTiet.push(item)
      dsCauSai.push(item)
    }
  })

  pII.forEach((q, idx) => {
    const qid = chuoi(q.id || q.qid) || `II_${idx + 1}`
    qidDaXet.add(qid)
    const row = daII[qid]
    const dung = Array.isArray(q.correct) ? q.correct.join('') : chuoi(q.correct ?? '')
    let chon = ''
    let coChon = false
    if (Array.isArray(row)) {
      coChon = row.some((v) => v !== null && v !== undefined && chuoi(v).trim() !== '' && chuoi(v).trim() !== '-')
      chon = row.map((v) => (v !== null && v !== undefined && chuoi(v).trim() !== '' ? chuoi(v).trim() : '-')).join('')
    } else if (typeof row === 'string') {
      chon = row.trim()
      coChon = chon !== '' && chon !== '----'
    }
    if (!coChon) {
      soCauSai++
      const item = { ma_ca: maCa, sbd, lan_thu: lanThu, phan: 'II', so_cau: idx + 1, qid, chuyen_de: chuoi(q.chuyenDe), muc_do: chuoi(q.mucDo), dap_an_chon: chon || '----', dap_an_dung: dung, dung_sai: 0, ten_ca: tenCa, chua_lam: 1 }
      dsChiTiet.push(item)
      dsCauSai.push(item)
    } else if (chon === dung) {
      soCauDung++
      dsChiTiet.push({ ma_ca: maCa, sbd, lan_thu: lanThu, phan: 'II', so_cau: idx + 1, qid, chuyen_de: chuoi(q.chuyenDe), muc_do: chuoi(q.mucDo), dap_an_chon: chon, dap_an_dung: dung, dung_sai: 1, ten_ca: tenCa })
    } else {
      soCauSai++
      const item = { ma_ca: maCa, sbd, lan_thu: lanThu, phan: 'II', so_cau: idx + 1, qid, chuyen_de: chuoi(q.chuyenDe), muc_do: chuoi(q.mucDo), dap_an_chon: chon, dap_an_dung: dung, dung_sai: 0, ten_ca: tenCa }
      dsChiTiet.push(item)
      dsCauSai.push(item)
    }
  })

  pIII.forEach((q, idx) => {
    const qid = chuoi(q.id || q.qid) || `III_${idx + 1}`
    qidDaXet.add(qid)
    const chon = chuoi(daIII[qid] ?? '').trim()
    const dung = chuoi(q.correct ?? '').trim()
    const normChon = chon.toLowerCase().replace(',', '.')
    const normDung = dung.toLowerCase().replace(',', '.')
    if (!chon) {
      soCauSai++
      const item = { ma_ca: maCa, sbd, lan_thu: lanThu, phan: 'III', so_cau: idx + 1, qid, chuyen_de: chuoi(q.chuyenDe), muc_do: chuoi(q.mucDo), dap_an_chon: '', dap_an_dung: dung, dung_sai: 0, ten_ca: tenCa, chua_lam: 1 }
      dsChiTiet.push(item)
      dsCauSai.push(item)
    } else if (normChon === normDung) {
      soCauDung++
      dsChiTiet.push({ ma_ca: maCa, sbd, lan_thu: lanThu, phan: 'III', so_cau: idx + 1, qid, chuyen_de: chuoi(q.chuyenDe), muc_do: chuoi(q.mucDo), dap_an_chon: chon, dap_an_dung: dung, dung_sai: 1, ten_ca: tenCa })
    } else {
      soCauSai++
      const item = { ma_ca: maCa, sbd, lan_thu: lanThu, phan: 'III', so_cau: idx + 1, qid, chuyen_de: chuoi(q.chuyenDe), muc_do: chuoi(q.mucDo), dap_an_chon: chon, dap_an_dung: dung, dung_sai: 0, ten_ca: tenCa }
      dsChiTiet.push(item)
      dsCauSai.push(item)
    }
  })

  if (boCuaEm && boCuaEm.length > 0) {
    let extraIdx = dsChiTiet.length + 1
    for (const qid of boCuaEm) {
      const sq = chuoi(qid)
      if (!sq || qidDaXet.has(sq)) continue
      qidDaXet.add(sq)
      const phan = sq.includes('-II-') ? 'II' : sq.includes('-III-') ? 'III' : 'I'
      soCauSai++
      const item = {
        ma_ca: maCa,
        sbd,
        lan_thu: lanThu,
        phan,
        so_cau: extraIdx++,
        qid: sq,
        chuyen_de: '',
        muc_do: '',
        dap_an_chon: '',
        dap_an_dung: '',
        dung_sai: 0,
        ten_ca: tenCa,
        chua_lam: 1,
      }
      dsChiTiet.push(item)
      dsCauSai.push(item)
    }
  }

  const tongCau = pI.length + pII.length + pIII.length
  soCauSai = Math.max(0, tongCau - soCauDung)
  const soBoTrong = 0

  return { tongCau, soCauDung, soCauSai, soBoTrong, dsCauSai, dsChiTiet }
}

async function luuChiTietCauNeuChuaCo(
  env: Env,
  maCa: string,
  sbd: string,
  lanThu: number,
  dsChiTiet: Array<Record<string, unknown>>,
  dsCauSai: Array<Record<string, unknown>>,
) {
  if (!env.DB || dsChiTiet.length === 0) return
  const nay = NAY()
  const stmts: D1PreparedStatement[] = []
  for (const c of dsChiTiet) {
    stmts.push(
      env.DB.prepare(
        `INSERT INTO chi_tiet_cau (khoa, ma_ca, sbd, lan_thu, phan, so_cau, qid, chuyen_de, muc_do, dap_an_chon, dap_an_dung, dung_sai, giay, cap_nhat_luc)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
         ON CONFLICT(khoa) DO UPDATE SET
           dap_an_chon=excluded.dap_an_chon, dap_an_dung=excluded.dap_an_dung,
           dung_sai=excluded.dung_sai, cap_nhat_luc=excluded.cap_nhat_luc`,
      ).bind(
        `${maCa}|${sbd}|${lanThu}|${chuoi(c.phan)}|${Number(c.so_cau) || 1}`,
        maCa, sbd, lanThu, chuoi(c.phan), Number(c.so_cau) || 1, chuoi(c.qid),
        chuoi(c.chuyen_de), chuoi(c.muc_do), chuoi(c.dap_an_chon), chuoi(c.dap_an_dung),
        c.dung_sai === null ? null : Number(c.dung_sai), null, nay,
      ),
    )
  }
  for (const c of dsCauSai) {
    const qid = chuoi(c.qid).trim()
    if (!qid) continue
    stmts.push(
      env.DB.prepare(
        `INSERT INTO ban_do_sai (khoa, ma_ca, sbd, qid, chuyen_de, muc_do, so_lan_sai, da_chua, cap_nhat_luc)
         VALUES (?,?,?,?,?,?,1,0,?)
         ON CONFLICT(khoa) DO UPDATE SET
           chuyen_de=excluded.chuyen_de, muc_do=excluded.muc_do, cap_nhat_luc=excluded.cap_nhat_luc`,
      ).bind(`${maCa}|${sbd}|${qid}`, maCa, sbd, qid, chuoi(c.chuyen_de), chuoi(c.muc_do), nay),
    )
  }
  try {
    for (let i = 0; i < stmts.length; i += 200) {
      await env.DB.batch(stmts.slice(i, i + 200))
    }
  } catch (e) {
    console.error('Lỗi tự động ghi chi_tiet_cau:', e)
    return
  }
  // SỔ SỰ KIỆN HỌC (GĐ 0): dòng chi tiết vừa được "chữa lành" cũng là bằng chứng của lượt thi này.
  await ghiSuKienThi(
    env,
    maCa,
    [{
      sbd,
      lanThu,
      cau: dsChiTiet.map((c) => ({
        qid: c.qid, chuyenDe: c.chuyen_de, mucDo: c.muc_do, dapAnChon: c.dap_an_chon,
        dungSai: c.dung_sai === null || c.dung_sai === undefined ? null : Number(c.dung_sai) === 1, giay: null,
      })),
    }],
    nay,
  )
}

export async function hsLichSuCa(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sbd = chuoi(b.sbd).trim()
  if (!sbd) return { ok: false, error: 'Thiếu số báo danh' }

  const r = await env.DB.prepare(
    `SELECT l.ma_ca, l.lan_thu, l.nop_luc, l.vao_luc, l.diem_i, l.diem_ii, l.diem_iii, l.tong, l.dap_an_json,
            COALESCE(c.ten_ca, '') AS ten_ca, COALESCE(c.lop, '') AS lop, c.thoi_gian_phut, c.cong_bo,
            c.bo_theo_em_json, c.so_cau_json,
            ${cauConDem('so_cau_sai', `t.dung_sai = 0 AND NOT (t.phan = 'II' AND (${Y_DUNG_T}) > 0)`)},
            ${cauConDem('so_cau_dung', 't.dung_sai = 1')},
            ${cauConDem('so_cau_mot_phan', `t.dung_sai = 0 AND t.phan = 'II' AND (${Y_DUNG_T}) > 0`)},
            ${cauConDem('so_cau_trong', 't.dung_sai IS NULL')},
            ${cauConTong('so_y_dung', `(${Y_DUNG_T})`)},
            ${cauConTong('so_y_tong', '4')},
            ${cauConDem('tong_cau', '1 = 1')}
       FROM luot l
       LEFT JOIN ca c ON c.ma_ca = l.ma_ca
      WHERE l.sbd = ? AND (l.trang_thai = 'da_nop' OR l.trang_thai = 'khoa' OR l.nop_luc IS NOT NULL)
      ORDER BY l.nop_luc DESC LIMIT 100`,
  )
    .bind(sbd)
    .all<Record<string, unknown>>()

  const bankCache = new Map<string, Record<string, unknown> | null>()

  const items: Array<Record<string, unknown>> = []
  for (const x of r.results ?? []) {
    let rawTongCau = Number(x.tong_cau) || 0
    let rawSoDung = Number(x.so_cau_dung) || 0
    let rawSoSai = Number(x.so_cau_sai) || 0
    let rawMotPhan = Number(x.so_cau_mot_phan) || 0
    let rawTrong = Number(x.so_cau_trong) || 0
    let rawYDung = Number(x.so_y_dung) || 0
    let rawYTong = Number(x.so_y_tong) || 0
    const tongDiem = soHoacNull(x.tong)
    const dI = soHoacNull(x.diem_i)
    const dII = soHoacNull(x.diem_ii)
    const dIII = soHoacNull(x.diem_iii)
    const maCa = chuoi(x.ma_ca)

    // Nếu chưa có chi_tiet_cau nhưng có đáp án đã nộp: tự động chấm từ ngân hàng đề
    if (rawTongCau === 0 && x.dap_an_json && env.DE) {
      if (!bankCache.has(maCa)) {
        bankCache.set(maCa, await docBankDe(env, maCa))
      }
      const bData = bankCache.get(maCa)
      if (bData) {
        let dapAnObj: any = null
        try {
          dapAnObj = typeof x.dap_an_json === 'string' ? JSON.parse(x.dap_an_json) : x.dap_an_json
        } catch {}
        if (dapAnObj) {
          const dg = danhGiaLuot(bData, x, dapAnObj, sbd, maCa, Number(x.lan_thu) || 1, chuoi(x.ten_ca))
          // ĐẾM LẠI TỪ CHÍNH BẢNG CHẤM VỪA DỰNG, cùng một luật với câu SQL ở
          // trên — không dùng `dg.soCauSai` vì con số đó gộp cả câu bỏ trống
          // lẫn câu phần II đúng một phần.
          const d = demTuChiTiet(dg.dsChiTiet)
          rawTongCau = dg.tongCau
          rawSoDung = d.dung
          rawSoSai = d.sai
          rawMotPhan = d.motPhan
          rawTrong = d.trong
          rawYDung = d.yDung
          rawYTong = d.yTong
          void luuChiTietCauNeuChuaCo(env, maCa, sbd, Number(x.lan_thu) || 1, dg.dsChiTiet, dg.dsCauSai)
        }
      }
    }

    const coCham = rawTongCau > 0
    const demCua: DemBangCham | undefined = coCham
      ? { tong: rawTongCau, dung: rawSoDung, sai: rawSoSai, motPhan: rawMotPhan, trong: rawTrong, yDung: rawYDung, yTong: rawYTong }
      : undefined

    items.push({
      maCa,
      tenCa: chuoi(x.ten_ca) || `Ca ${maCa}`,
      lanThu: Number(x.lan_thu) || 1,
      nopLuc: chuoi(x.nop_luc),
      tong: tongDiem,
      diemI: dI,
      diemII: dII,
      diemIII: dIII,
      thoiGianPhut: Number(x.thoi_gian_phut) || 0,
      ...goiDemCau(demCua),
    })
  }

  return {
    ok: true,
    items,
  }
}

export async function hsBtvn(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sbd = chuoi(b.sbd).trim()
  if (!sbd) return { ok: false, error: 'Thiếu số báo danh' }

  // Cột `lo_da_xong` mới (migration-1909-lo-btvn.sql, thay Vòng 1/2 bằng lịch
  // lô — xem src/lib/lich-lo-btvn.ts). Chưa chạy migration thì SELECT tường
  // minh cột này LỖI HẲN (khác `SELECT *`), nên có đường lùi: mất cột thì coi
  // mọi em lo_da_xong=0 — phiếu vẫn mở được, chỉ là chưa nhớ tiến độ lô.
  let r: { results?: Record<string, unknown>[] }
  try {
    r = await env.DB.prepare(
      `SELECT be.ma_btvn, be.sbd, be.nop_luc, be.so_dung, be.so_cau AS em_so_cau, COALESCE(be.so_lan_lam, 1) AS so_lan_lam,
              be.lo_da_xong,
              b.ma_ca, b.ma_de, b.han_nop, b.so_cau, b.giao_luc
         FROM btvn_em be
         JOIN btvn b ON b.ma_btvn = be.ma_btvn
        WHERE be.sbd = ? AND be.thu_hoi=0 AND b.da_xoa = 0
        ORDER BY b.giao_luc DESC LIMIT 100`,
    )
      .bind(sbd)
      .all<Record<string, unknown>>()
  } catch {
    r = await env.DB.prepare(
      `SELECT be.ma_btvn, be.sbd, be.nop_luc, be.so_dung, be.so_cau AS em_so_cau, COALESCE(be.so_lan_lam, 1) AS so_lan_lam,
              b.ma_ca, b.ma_de, b.han_nop, b.so_cau, b.giao_luc
         FROM btvn_em be
         JOIN btvn b ON b.ma_btvn = be.ma_btvn
        WHERE be.sbd = ? AND be.thu_hoi=0 AND b.da_xoa = 0
        ORDER BY b.giao_luc DESC LIMIT 100`,
    )
      .bind(sbd)
      .all<Record<string, unknown>>()
  }

  return {
    ok: true,
    items: (r.results ?? []).map((x) => {
      const soDung = soHoacNull(x.so_dung)
      const soCau = Number(x.so_cau) || Number(x.em_so_cau) || 0
      const soSai = soDung !== null && soCau >= soDung ? soCau - soDung : null
      const diem = soDung !== null && soCau > 0 ? Math.round((soDung / soCau) * 1000) / 100 : null
      const maDe = chuoi(x.ma_de)
      const maCa = chuoi(x.ma_ca)
      const tenBtvn = maDe ? `Bài tập: ${maDe}` : (maCa && maCa !== 'Riêng' ? `Bài tập ca ${maCa}` : 'Bài tập về nhà')
      const daNop = Boolean(x.nop_luc)
      const soLanLam = Math.max(1, Number(x.so_lan_lam) || 1)
      const soLanLamLaiConLai = daNop ? Math.max(0, 4 - soLanLam) : 3
      const hanNop = chuoi(x.han_nop)
      return {
        maBtvn: chuoi(x.ma_btvn),
        maCa,
        maDe,
        tenBtvn,
        hanNop,
        giaoLuc: chuoi(x.giao_luc),
        nopLuc: chuoi(x.nop_luc),
        daNop,
        loDaXong: Number(x.lo_da_xong) || 0,
        diem,
        soDung,
        soSai,
        soCau,
        soLanLam,
        soLanLamLaiConLai,
        duocLamLai: soLanLamLaiConLai > 0,
      }
    }),
  }
}

export async function hsCauSai(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sbd = chuoi(b.sbd).trim()
  const dsMaCa = Array.isArray(b.dsMaCa) ? (b.dsMaCa as string[]).map(chuoi).filter(Boolean) : []
  if (!sbd) return { ok: false, error: 'Thiếu số báo danh' }

  /**
   * `chiSai === false` ⇒ trả về MỌI CÂU EM ĐÃ THI, không chỉ câu sai.
   *
   * Thầy chốt 15-09: *"không cần phân câu sai, chỉ cần phân câu kiến thức em
   * đã thi của các ca thi trước đó"*. Tháp lấy từ đây. Mặc định vẫn là `true`
   * để mục Khắc Phục Câu Sai và mọi chỗ gọi cũ không đổi hành vi một li nào.
   */
  const chiSai = b.chiSai !== false

  let query = `SELECT c.ma_ca, c.sbd, c.phan, c.so_cau, c.qid, c.chuyen_de, c.muc_do,
            c.dap_an_chon, c.dap_an_dung, c.dung_sai, ca.ten_ca
       FROM chi_tiet_cau c
       LEFT JOIN ca ON ca.ma_ca = c.ma_ca
      WHERE c.sbd = ?${chiSai ? ' AND COALESCE(c.dung_sai, 0) = 0' : ''}`
  const params: unknown[] = [sbd]

  if (dsMaCa.length > 0) {
    const placeholders = dsMaCa.map(() => '?').join(',')
    query += ` AND c.ma_ca IN (${placeholders})`
    params.push(...dsMaCa)
  }

  query += ` ORDER BY c.ma_ca DESC, CASE c.phan WHEN 'I' THEN 1 WHEN 'II' THEN 2 WHEN 'III' THEN 3 ELSE 4 END, c.so_cau ASC`

  const r = await env.DB.prepare(query)
    .bind(...params)
    .all<Record<string, unknown>>()

  let rows = r.results ?? []

  // Nếu chi_tiet_cau chưa có dữ liệu cho em này (vd học sinh thi nộp trực tiếp chưa qua chấm lại),
  // tự động phân tích bài làm từ luot và keyBank để trích xuất đầy đủ câu sai chuẩn xác theo bộ câu của em.
  if (rows.length === 0) {
    let luotQuery = `SELECT l.ma_ca, l.sbd, l.lan_thu, l.dap_an_json, COALESCE(ca.ten_ca, '') AS ten_ca,
                            ca.bo_theo_em_json, ca.so_cau_json
       FROM luot l
       LEFT JOIN ca ON ca.ma_ca = l.ma_ca
      WHERE l.sbd = ? AND (l.trang_thai = 'da_nop' OR l.trang_thai = 'khoa' OR l.nop_luc IS NOT NULL) AND l.dap_an_json IS NOT NULL`
    const lParams: unknown[] = [sbd]
    if (dsMaCa.length > 0) {
      luotQuery += ` AND l.ma_ca IN (${dsMaCa.map(() => '?').join(',')})`
      lParams.push(...dsMaCa)
    }
    const rLuot = await env.DB.prepare(luotQuery).bind(...lParams).all<Record<string, unknown>>()
    const luotList = rLuot.results ?? []

    for (const lItem of luotList) {
      const maCa = chuoi(lItem.ma_ca)
      const tenCa = chuoi(lItem.ten_ca) || `Ca ${maCa}`
      let dapAnObj: any = null
      try {
        dapAnObj = typeof lItem.dap_an_json === 'string' ? JSON.parse(lItem.dap_an_json) : lItem.dap_an_json
      } catch {}
      if (!dapAnObj || !env.DE) continue

      const bData = await docBankDe(env, maCa)
      if (!bData) continue

      const dg = danhGiaLuot(bData, lItem, dapAnObj, sbd, maCa, Number(lItem.lan_thu) || 1, tenCa)
      rows.push(...dg.dsCauSai)
      void luuChiTietCauNeuChuaCo(env, maCa, sbd, Number(lItem.lan_thu) || 1, dg.dsChiTiet, dg.dsCauSai)
    }
  }
  const banksCache = new Map<string, Record<string, unknown>>()
  const qMap = new Map<string, Record<string, unknown>>()

  for (const row of rows) {
    const maCa = chuoi(row.ma_ca)
    if (!banksCache.has(maCa) && env.DE) {
      let bData: any = null
      try {
        const oKey = await env.DE.get(`key/${maCa}.json`)
        if (oKey?.body) bData = (await new Response(oKey.body).json()) as Record<string, unknown>
      } catch {}
      if (!bData) {
        try {
          const oDe = await env.DE.get(`de/${maCa}.json`)
          if (oDe?.body) bData = (await new Response(oDe.body).json()) as Record<string, unknown>
        } catch {}
      }
      if (bData) {
        banksCache.set(maCa, bData)
        const napBank = (bankObj: any) => {
          if (!bankObj) return
          if (Array.isArray(bankObj)) {
            for (const item of bankObj) napBank(item)
            return
          }
          for (const p of ['phanI', 'phanII', 'phanIII', 'cau', 'dsCau', 'questions']) {
            const arr = Array.isArray(bankObj[p]) ? bankObj[p] : []
            for (const q of arr) {
              if (q) {
                if (q.id) qMap.set(chuoi(q.id), q)
                if (q.qid) qMap.set(chuoi(q.qid), q)
                if (q.id) qMap.set(`${maCa}_${chuoi(q.id)}`, q)
                if (q.qid) qMap.set(`${maCa}_${chuoi(q.qid)}`, q)
                if (q.so) qMap.set(`${maCa}_${chuoi(q.phan || 'I')}_${q.so}`, q)
              }
            }
          }
          if (bankObj.keyBank) napBank(bankObj.keyBank)
        }
        napBank(bData)
      }
    }
  }

  // Một lượt đọc kho cho CẢ báo cáo, không phải mỗi câu một lượt.
  const khoMap = await napCauTuKho(env, rows.map((r) => chuoi(r.qid)))

  const items = rows.map((row) => {
    const qid = chuoi(row.qid)
    const maCa = chuoi(row.ma_ca)
    const phan = chuoi(row.phan)
    const soCau = Number(row.so_cau) || 0
    // Gói câu trong kho là JSON tự do (kho cũ dùng `pa`/`y`/`bang`, kho mới
    // dùng `choices`/`ideas`/`table`), nên đọc qua một bản ghi lỏng thay vì
    // `unknown` — nếu không TypeScript chặn ngay ở `fullQ.pa`.
    const fullQ = (qMap.get(qid) || qMap.get(`${maCa}_${qid}`) || qMap.get(`${maCa}_${phan}_${soCau}`)) as
      | Record<string, any>
      | undefined

    // Gói đề công khai đã bị lược sạch lời giải và nhãn dạng (xem `napCauTuKho`),
    // nên hai thứ ấy lấy từ KHO. Gói đề chỉ còn là nguồn dự phòng.
    const tuKho = khoMap.get(qid)
    const loiGiaiStr =
      chuoiLoiGiai(tuKho?.loiGiai) ||
      chuoiLoiGiai(fullQ ? (fullQ.loiGiai ?? fullQ.loi_giai ?? fullQ.explanation ?? fullQ.giaiThich ?? fullQ.giai_thich) : null)
    const dangStr =
      chuoiDang(tuKho?.dang) ||
      chuoiDang(fullQ ? (fullQ.dang ?? fullQ.tenDang ?? fullQ.chuyenDe ?? fullQ.chuyen_de) : null)
    // MÃ DẠNG đi RIÊNG với tên dạng. Máy em gửi mã này lên để xin câu cùng dạng;
    // gửi tên thì hai tờ đề viết tên khác nhau một dấu là trượt.
    const dangMa = maDang(tuKho?.dang) || maDang(fullQ?.dang)

    return {
      maCa,
      tenCa: chuoi(row.ten_ca) || `Ca ${maCa}`,
      phan,
      soCau,
      qid,
      chuyenDe: chuoi(row.chuyen_de) || chuoi(tuKho?.chuyenDe),
      mucDo: chuoi(row.muc_do) || chuoi(tuKho?.mucDo),
      sao: tuKho?.sao ?? 0,
      dungSai: Number(row.dung_sai ?? 0) === 1,
      dapAnChon: chuoi(row.dap_an_chon),
      dapAnDung: chuoi(row.dap_an_dung),
      text: fullQ ? chuoi(fullQ.text || fullQ.de) : '',
      choices: fullQ && Array.isArray(fullQ.choices)
        ? fullQ.choices
        : (fullQ && fullQ.pa ? ['A', 'B', 'C', 'D'].map((k) => fullQ.pa[k] || '') : undefined),
      ideas: fullQ && Array.isArray(fullQ.ideas)
        ? fullQ.ideas
        : (fullQ && fullQ.y ? ['a', 'b', 'c', 'd'].map((k) => fullQ.y[k] || '') : undefined),
      table: fullQ ? (fullQ.table || fullQ.bang) : undefined,
      imageDataUrl: fullQ ? fullQ.imageDataUrl : undefined,
      // ẢNH THÂN CÂU và ẢNH TỪNG PHƯƠNG ÁN là HAI THỨ KHÁC NHAU.
      //
      // Thầy bắt được 14/09: câu có bốn phương án bằng ảnh thì báo cáo dồn cả
      // bốn ảnh lên đầu câu, còn bốn dòng phương án chỉ còn chữ "(xem hình
      // phương án A)" — em không biết ảnh nào là của phương án nào.
      //
      // Bản trước gộp `thanCauImg` vào `imageDataUrl` và bỏ hẳn `choiceImgs` /
      // `ideaImgs`, nên màn hình không còn cách nào gắn ảnh về đúng phương án.
      // Nay trả riêng ba trường, đúng như kho đề và như màn làm bài đang dùng.
      thanCauImg: fullQ ? fullQ.thanCauImg : undefined,
      choiceImgs: fullQ && Array.isArray(fullQ.choiceImgs) ? fullQ.choiceImgs : undefined,
      ideaImgs: fullQ && Array.isArray(fullQ.ideaImgs) ? fullQ.ideaImgs : undefined,
      // Giữ NGUYÊN mảng có `viTri`: ảnh đặt sau phương án A phải nằm sau
      // phương án A, không phải trôi lên đầu câu.
      hinhAnh: fullQ ? (fullQ.hinhAnh || fullQ.hinh) : undefined,
      loiGiai: loiGiaiStr,
      dang: dangStr,
      dangMa,
    }
  })

  // KHÓA VĨNH VIỄN CÂU TỰ LUẬN — CHỈ RÚT 3 DẠNG CHUẨN (I, II, III)
  const itemsHopLe = items.filter((q) =>
    hopLe3DangChuan({
      phan: q.phan,
      text: q.text,
      dapAnDung: q.dapAnDung,
      choices: q.choices,
      ideas: q.ideas,
      maDe: q.maCa,
    })
  )

  return { ok: true, items: itemsHopLe }
}


/**
 * MỌI CÂU EM ĐÃ THI — nguồn câu của Tháp Tri Thức.
 *
 * Mỏng có chủ ý: dùng lại nguyên thân `hsCauSai` để không có hai đường đọc kho
 * đề song song rồi lệch nhau. Khác đúng một cờ.
 */
export async function hsCauDaThi(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  return hsCauSai(env, { ...b, chiSai: false })
}


// ===========================================================================
// THẦN THÚ HOÁ HỌC — ĐỒNG BỘ ĐA THIẾT BỊ (15-09-2026)
//
// Thầy bắt được: "trên điện thoại vẫn là trứng, trên web thì là có sừng". Hồ sơ
// game trước nay chỉ nằm trong localStorage từng máy.
//
// TẦNG ĐỎ — hai luật không được phá:
//  1. Bảng `than_thu` KHÔNG chứa tên, số điện thoại, điểm thi, ảnh bài. Chỉ
//     tiến trình game. Máy chủ LỌC TỪNG TRƯỜNG, không tin máy em gửi gì cũng lưu
//     — máy em là chỗ dễ sửa nhất trong cả hệ.
//  2. Hồ sơ game không bao giờ chảy ngược vào bảng điểm.
// ===========================================================================

/** Đúng những trường game được phép lưu. Trường lạ bị vứt, không hỏi. */
import {
  tronHoSoThu, tongExpCuaThu, NGUON_EXP_HOP_LE, type HoSoThanThuMayChu,
} from './tron-than-thu'

/**
 * Trần cứng để một máy em bị sửa không ghi được cấp vô hạn hay EXP tỉ tỉ.
 *
 * NÂNG 12 → 120 ngày 15-09 cùng đường 120 cấp. Số này phải LUÔN bằng
 * `CAP_TOI_DA` bên app — để lệch là em lên cấp 13 xong máy chủ cắt về 12, và
 * mỗi lần đồng bộ lại tụt cấp một lần mà không ai hiểu vì sao.
 */
const TRAN_CAP = 120
const TRAN_EXP = 100_000_000

function soNguyenTrongKhoang(v: unknown, thap: number, cao: number, mac = 0): number {
  const n = Number(v)
  if (!Number.isFinite(n)) return mac
  return Math.max(thap, Math.min(cao, Math.round(n)))
}

/** Lọc hồ sơ máy em gửi lên về đúng khuôn được phép lưu. */
function locHoSoThanThu(tho: unknown): { hoSo: HoSoThanThuMayChu; tongExp: number } {
  const o = (tho ?? {}) as Record<string, unknown>
  const soExp: Record<string, number> = {}
  const thoSo = (o.soExp ?? {}) as Record<string, unknown>
  let tongExp = 0
  for (const k of NGUON_EXP_HOP_LE) {
    const v = soNguyenTrongKhoang(thoSo[k], 0, TRAN_EXP, 0)
    soExp[k] = v
    tongExp += v
  }
  const capDo = soNguyenTrongKhoang(o.capDo, 1, TRAN_CAP, 1)
  return {
    tongExp,
    hoSo: {
      idThanhThuChon: chuoi(o.idThanhThuChon).slice(0, 40),
      capDo,
      exp: soNguyenTrongKhoang(o.exp, 0, TRAN_EXP, 0),
      expToiDa: soNguyenTrongKhoang(o.expToiDa, 0, TRAN_EXP, 0),
      capTienHoa: soNguyenTrongKhoang(o.capTienHoa, 1, TRAN_CAP, capDo),
      khoExp: soNguyenTrongKhoang(o.khoExp, 0, TRAN_EXP, 0),
      soExp,
      tangThapCaoNhat: soNguyenTrongKhoang(o.tangThapCaoNhat, 1, 100_000, 1),
      soCauDaThanhTay: soNguyenTrongKhoang(o.soCauDaThanhTay, 0, 100_000, 0),
      danhHieuHienTai: chuoi(o.danhHieuHienTai).slice(0, 80),
      ngayNhanTrung: chuoi(o.ngayNhanTrung).slice(0, 40),
      ngayChonThu: chuoi(o.ngayChonThu).slice(0, 40),
      // SỔ THÁP — lọc từng trường, không tin máy em gửi gì cũng lưu.
      // Chỉ `qid` và hai con số; cắt 300 dòng để một em không phình bảng.
      lichSuThap: (Array.isArray(o.lichSuThap) ? o.lichSuThap : [])
        .slice(0, 300)
        .map((x: unknown) => {
          const d = (x ?? {}) as Record<string, unknown>
          return {
            qid: chuoi(d.qid).slice(0, 80),
            lanCuoi: soNguyenTrongKhoang(d.lanCuoi, 0, 4_102_444_800_000, 0),
            soLanHoi: soNguyenTrongKhoang(d.soLanHoi, 1, 100_000, 1),
          }
        })
        .filter((d: { qid: string }) => d.qid !== ''),
    },
  }
}

/** ĐỌC hồ sơ thần thú của một em. Chưa có thì trả `hoSo: null`, không dựng sẵn. */
export async function thanThuDoc(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sbd = chuoi(b.sbd).trim()
  if (!sbd) return { ok: false, error: 'Thiếu số báo danh' }
  const r = await env.DB.prepare(
    'SELECT du_lieu_json, tong_exp, cap_nhat_luc FROM than_thu WHERE sbd = ?',
  ).bind(sbd).first<Record<string, unknown>>()
  if (!r) return { ok: true, hoSo: null, tongExp: 0, capNhatLuc: '' }
  let hoSo: unknown = null
  try { hoSo = JSON.parse(chuoi(r.du_lieu_json)) } catch { hoSo = null }
  return {
    ok: true,
    hoSo,
    tongExp: Number(r.tong_exp) || 0,
    capNhatLuc: chuoi(r.cap_nhat_luc),
  }
}

/**
 * GHI hồ sơ thần thú.
 *
 * HOÀ GIẢI THEO TỔNG EXP, KHÔNG THEO ĐỒNG HỒ. Tổng EXP em đã kiếm chỉ có tăng,
 * nên bản nào tổng lớn hơn là bản mới hơn — chắc chắn. So theo `cap_nhat_luc`
 * thì một máy đặt sai giờ sẽ đè chết tiến trình của máy kia.
 *
 * Bản gửi lên THẤP HƠN bản đang có thì KHÔNG ghi, và trả về bản trên máy chủ để
 * máy em nuốt vào — đó là lúc điện thoại vừa mở lại sau nhiều ngày.
 */
export async function thanThuGhi(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sbd = chuoi(b.sbd).trim()
  if (!sbd) return { ok: false, error: 'Thiếu số báo danh' }

  const upgraded = await env.DB.prepare('SELECT sbd FROM game_v2_profile WHERE sbd = ?').bind(sbd).first()
  if (upgraded) return { ok: false, error: 'Game đã nâng cấp. Em tải lại app để tiếp tục; hồ sơ cũ vẫn được giữ.' }

  const { hoSo: hoSoMoi } = locHoSoThanThu(b.hoSo)
  const cu = await env.DB.prepare('SELECT du_lieu_json, tong_exp FROM than_thu WHERE sbd = ?')
    .bind(sbd).first<Record<string, unknown>>()

  // TRỘN, không chọn một bên rồi vứt bên kia. Xem `tronHoSoThu`.
  let hoSo = hoSoMoi
  let daTron = false
  if (cu) {
    let thoCu: unknown = null
    try { thoCu = JSON.parse(chuoi(cu.du_lieu_json)) } catch { thoCu = null }
    if (thoCu !== null) {
      const { hoSo: hoSoCu } = locHoSoThanThu(thoCu)
      hoSo = tronHoSoThu(hoSoMoi, hoSoCu)
      daTron = true
    }
  }
  const tongExp = tongExpCuaThu(hoSo)

  const luc = NAY()
  await env.DB.prepare(
    `INSERT INTO than_thu (sbd, du_lieu_json, tong_exp, cap_nhat_luc) VALUES (?,?,?,?)
     ON CONFLICT(sbd) DO UPDATE SET
       du_lieu_json = excluded.du_lieu_json,
       tong_exp     = excluded.tong_exp,
       cap_nhat_luc = excluded.cap_nhat_luc`,
  ).bind(sbd, JSON.stringify(hoSo), tongExp, luc).run()

  // Trả BẢN ĐÃ TRỘN về cho máy em nuốt lại, để hai bên bằng nhau ngay trong
  // một vòng — không phải đợi lần mở game sau.
  return { ok: true, daGhi: true, hoSo, daTron, tongExp, capNhatLuc: luc }
}

// ============================================================================
// LUYỆN DẠNG BÀI (15/09) — mục 4 của khối rút đề.
//
// Thầy chốt: "tạo thêm một mục 4 chỗ này là Luyện dạng bài… bấm vào dạng bài
// cho hiện các thư mục con LỚP 10, 11, 12, trong đó có tên bài theo sách giáo
// khoa, bấm vào mỗi tên bài thì hiển thị từng dạng bài của bài đó (trong từng
// dạng bài sẽ gom TẤT CẢ các câu trong kho đề thuộc dạng bài đó)".
//
// VÌ SAO KHÔNG DÙNG `cauKhacPhuc`. Lệnh ấy lọc theo CHUYÊN ĐỀ rồi cắt theo mã
// dạng ba tầng, và có trần 200 câu — đúng cho "luyện thêm dạng câu sai", sai
// cho "gom tất cả". Một dạng bài như "Thiết lập công thức phân tử amine" có
// 426 câu nằm rải khắp kho; đi đường ấy là em chỉ thấy một phần.
//
// ĐƯỜNG ĐI: kho đã dựng sẵn cây `xong/Dạng bài/` — mỗi dạng MỘT TỜ gom trọn
// câu của dạng ấy, mã tờ là mã dạng (`DB-12-B8-D1`). Tờ nằm trong R2 như mọi
// tờ khác, nên ở đây chỉ cần hai việc: liệt kê menu, và trả đúng một tờ.
//
// KHÔNG có chỉ mục `cau_hoi` cho tờ `DB-%` (bộ nạp cố tình bỏ), nên chúng
// KHÔNG bao giờ lọt vào lượt rút ngẫu nhiên của `cauKhacPhuc` — câu không bị
// đếm hai lần.

/** Tiền tố mã tờ dạng bài. MỘT NGUỒN SỰ THẬT — `nap-de-may-chu-moi.py` bỏ chỉ
 * mục theo đúng tiền tố này, và hai lệnh dưới đây chỉ nhận mã bắt đầu bằng nó. */
export const TIEN_TO_DANG_BAI = 'DB-'

/** MENU LUYỆN DẠNG BÀI: lớp → bài → dạng, dựng từ chính bảng `de_kho`.
 *
 * Nhãn nằm ở cột `ten_de`, dáng "Dạng bài · <lớp> · <Bài N. Tên bài> · <tên dạng>"
 * — `nap-de-may-chu-moi.py` gửi thẳng trường `nhom` của gói vào đó cho tờ `DB-`.
 *
 * BẢN ĐẦU 15/09 ĐỌC `nhom` VÀ LÀM MÁY CHỦ TRẢ HTTP 500: `de_kho` chỉ có
 * ma_de · ten_de · lop · chuyen_de · so_cau · r2_khoa · da_xoa · cap_nhat_luc.
 * Nhãn nhóm sống trong GÓI trên R2, D1 không giữ. Đọc cột không có là D1 ném
 * lỗi, và màn hình chỉ thấy "Không lấy được danh mục dạng bài". */
export async function danhMucDangBai(env: Env): Promise<Record<string, unknown>> {
  const r = await env.DB.prepare(
    `SELECT ma_de, ten_de, so_cau FROM de_kho
      WHERE da_xoa = 0 AND ma_de LIKE '${TIEN_TO_DANG_BAI}%' ORDER BY ma_de`,
  ).all<Record<string, unknown>>()

  type Dang = { ma: string; ten: string; soCau: number }
  type Bai = { tenBai: string; dangs: Dang[] }
  const theoLop = new Map<string, Map<string, Bai>>()

  // Kho cũ lưu lớp/bài trong nhom, tên dạng trong nguon của gói R2.
  // Chỉ đọc bù nhãn thiếu; không sửa câu hỏi hay luật rút câu.
  const rows = r.results ?? []
  const nhan = new Map<string, string[]>()
  for (let i = 0; i < rows.length; i += 6) {
    await Promise.all(rows.slice(i, i + 6).map(async x => {
      const phan = chuoi(x.ten_de).split(' · ')
      if (phan.length === 4 && phan[0] === 'Dạng bài') return
      if (!env.DE) return
      const ma = chuoi(x.ma_de)
      const o = await env.DE.get(`kho/${ma}.json`)
      if (!o) return
      const de = await new Response(o.body).json() as Record<string, unknown>
      const nhom = chuoi(de.nhom)
      const cu = /^(10|11|12) · DẠNG BÀI\/(.+)$/.exec(nhom)
      const ten = chuoi(de.nguon).trim()
      if (cu && ten) nhan.set(ma, ['Dạng bài', cu[1], cu[2], ten])
    }))
  }
  for (const x of rows) {
    const ma = chuoi(x.ma_de)
    const phan = nhan.get(ma) ?? chuoi(x.ten_de).split(' · ')
    // Dáng sai thì BỎ tờ ấy và không đoán — menu thiếu một dạng còn hơn menu
    // có một mục trỏ vào hư không.
    if (phan.length !== 4 || phan[0] !== 'Dạng bài') continue
    const [, lop, tenBai, tenDang] = phan
    if (!theoLop.has(lop)) theoLop.set(lop, new Map())
    const bai = theoLop.get(lop)!
    if (!bai.has(tenBai)) bai.set(tenBai, { tenBai, dangs: [] })
    bai.get(tenBai)!.dangs.push({ ma, ten: tenDang, soCau: Number(x.so_cau) || 0 })
  }

  const lops = [...theoLop.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], 'vi'))
    .map(([lop, bai]) => ({
      lop,
      bais: [...bai.values()].sort((a, b) => soBaiCua(a.tenBai) - soBaiCua(b.tenBai)),
    }))

  const tongDang = lops.reduce((n, l) => n + l.bais.reduce((m, b) => m + b.dangs.length, 0), 0)

  // KHO CÓ TỜ MÀ MENU RỖNG NGHĨA LÀ NHÃN SAI DÁNG — nói thẳng, đừng trả menu
  // rỗng rồi để màn hình đoán là "kho chưa có dạng bài nào".
  const soTo = (r.results ?? []).length
  if (soTo > 0 && tongDang === 0) {
    return {
      ok: false,
      error: `Kho có ${soTo} tờ dạng bài nhưng nhãn không đúng dáng `
        + `"Dạng bài · <lớp> · <bài> · <tên dạng>". Thầy đẩy lại kho đề.`,
    }
  }
  return { ok: true, lops, tongDang, soTo }
}

/** "Bài 12. Tên bài" → 12. Không đọc được số thì đẩy xuống cuối, không vứt đi. */
function soBaiCua(ten: string): number {
  const m = /^Bài\s+(\d+)/.exec(ten)
  return m ? Number(m[1]) : 9999
}

/** TRẢ TRỌN MỘT TỜ DẠNG BÀI. Chỉ nhận mã `DB-…` — không mở đường cho máy em
 * tải tờ đề bất kỳ bằng lệnh không cần mã bí mật. */
export async function deTheoDangBai(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const ma = chuoi(b.ma).trim()
  if (!ma.startsWith(TIEN_TO_DANG_BAI)) return { ok: false, error: 'Mã dạng bài không hợp lệ' }
  if (!/^[A-Za-z0-9-]+$/.test(ma)) return { ok: false, error: 'Mã dạng bài không hợp lệ' }
  if (!env.DE) return { ok: false, error: 'Máy chủ chưa gắn kho đề' }

  const co = await env.DB.prepare('SELECT ma_de FROM de_kho WHERE ma_de = ? AND da_xoa = 0').bind(ma).first()
  if (!co) return { ok: false, error: 'Kho chưa có dạng bài này. Thầy cần đẩy lại kho đề.' }

  const o = await env.DE.get(`kho/${ma}.json`)
  if (!o?.body) return { ok: false, error: 'Gói đề của dạng bài này không còn trên máy chủ.' }
  try {
    return { ok: true, de: await new Response(o.body).json() }
  } catch {
    return { ok: false, error: 'Gói đề của dạng bài này hỏng, không đọc được.' }
  }
}
