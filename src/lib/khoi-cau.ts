// CÂU ĐÚNG KHỐI CỦA EM — MỘT ĐỊNH NGHĨA DÙNG CHUNG (Code 1 lập 21/09/2026; LUẬT MỚI của thầy 05/10/2026 thay luật 21/09).
//
// LỆNH THẦY 05/10 (nguyên văn):
//   1) "rất nhiều cấu thuộc lớp 10 nhưng bị rút nhầm sang lớp 11, bạn phải chặn chuẩn 100% không được rút nhầm kho khác khối cho tôi nhé"
//   2) "mục câu cần chữa của khối 11 khi chiếu lên bảng thì rất nhiều câu của lớp 10 bị chèn vào, bạn xem mọi chỗ chặn triệt để rút nhầm câu của kho khối khác"
//
// NGUYÊN NHÂN GỐC (luật 21/09 ở chính tệp này): `cauHopKhoi` cho qua câu khối THẤP hơn khối em ("khối ≤ khối em") và "không biết ⇒ không kết tội"
// (câu không đọc ra khối / em chưa rõ khối ⇒ cho qua); `khoiCuaCau` lấy khối CAO NHẤT khi các nguồn khác nhau. ⇒ câu lớp 10 đi qua MỌI kênh tự động tới em
// lớp 11 (Đảo/Đoàn, Tu luyện, Bi-a, thử thách, phụ huynh giao thêm…), em làm sai ⇒ câu ấy vào sổ ⇒ chảy sang danh sách chữa bài / chiếu lên bảng của lớp 11.
//
// LUẬT 05/10 (điều phối chốt theo lệnh thầy):
//   A. Kênh rút câu TỰ ĐỘNG cho em chỉ đưa câu ĐÚNG KHỐI em (khác khối — thấp hay cao — CHẶN). Câu không đọc ra khối, hoặc các nguồn khối của câu
//      MÂU THUẪN nhau (mã tờ · mã câu · cột `lop` · nhóm · CHƯƠNG) ⇒ CHẶN. Em không rõ khối ⇒ không đưa câu nào (trừ nội dung thầy giao TRỰC TIẾP — nơi gọi tự xét).
//   B. Danh sách chữa bài / chiếu lên bảng do MÁY dựng cho một lớp/chiến dịch chỉ chứa câu ĐÚNG KHỐI của lớp đó (cùng hàm `cauHopKhoi`, khối = khối LỚP).
//   C. Nơi thầy TỰ CHỌN (tick bài, chọn tờ, Gọi lên bảng chọn tay) giữ đúng thầy chọn — KHÔNG gọi tệp này cho phần thầy chọn; phần máy tự bổ sung thì gọi.
//   D. Cổng cuối máy chủ: `server/src/chan-khac-khoi.ts` (đếm câu bị chặn theo lý do, ghi console).
//
// THUẦN: không IO, không import, không đồng hồ — máy chủ (server/src), máy thầy, máy học sinh/phụ huynh cùng import (như `cau-tu-luan.ts`). Không dùng localStorage/window.
//
// NGUỒN KHỐI CỦA MỘT CÂU (đọc hết, rồi so):
//   · mã tờ `maDe`/`ma_de`/`maTo` (`DH-12-C2-B6-TN`, `DB-12-B8-D1`, `DH-11-III-1` ⇒ đoạn 2; `12-C1-B2-D1`, `10-C1-B1` ⇒ đoạn đầu);
//   · mã câu `qid`/`id` (bắt đầu bằng mã tờ: `DH-12-C1-B2-I-49`; câu song sinh `…~ss0` theo câu gốc);
//   · cột `lop`/`khoi`/`lopTo`/`lop_to` (`de_kho.lop`, `cau_hoi.lop`) và `nhom` ("12 · DẠY HỌC/…");
//   · CHƯƠNG: mã dạng `dang`/`ma_dang`/`maDang` (đoạn đầu là mã chương của từ vựng đóng, "CAN_BANG.DIEN_LI.NHAN_DANG" ⇒ 11; "CD:<chuyên đề>"),
//     hoặc tên chương `chuong`/`tenChuong`/`chuyenDe`/`chuyen_de` (khớp ĐÚNG tên chương — không đoán chữ tự do như "Este", "Amin").
//   Không nguồn nào đọc ra ⇒ KHÔNG RÕ; hai nguồn ra hai khối khác nhau ⇒ MÂU THUẪN (khối = null). Cả hai đều bị chặn ở kênh tự động.
// KHỐI CỦA EM = `hoc_sinh.lop` ('12A1', '11', "12 - Tinh Hoa") và/hoặc tên lớp; hai nguồn KHÁC nhau ⇒ không rõ (null) — không đoán.

export type Khoi = 10 | 11 | 12
export const CAC_KHOI: readonly Khoi[] = [10, 11, 12]

type Doi = Record<string, unknown>
const laDoiTuong = (x: unknown): x is Doi => x !== null && typeof x === 'object' && !Array.isArray(x)
const chuoi = (x: unknown): string => (typeof x === 'string' ? x : typeof x === 'number' && Number.isFinite(x) ? String(x) : '').normalize('NFC').trim()
const laKhoi = (n: unknown): n is Khoi => n === 10 || n === 11 || n === 12

/** Khối ở ĐẦU một chuỗi ("12", " 12 ", "Lớp 12", "12 - Tinh Hoa", "12A1", "12 · DẠNG BÀI/…"); số khác 10–12 ("120", "9") hay chữ lạ ⇒ null. */
export function khoiCuaLop(v: unknown): Khoi | null {
  const m = /^(?:lớp\s*|khối\s*)?(10|11|12)(?![0-9])/i.exec(chuoi(v))
  return m ? (Number(m[1]) as Khoi) : null
}

/** Mọi khối đọc được từ một chuỗi mã tờ / mã câu (danh sách ngăn bằng phẩy/chấm phẩy/khoảng trắng/|). */
function cacKhoiCuaMa(ma: unknown): Set<Khoi> {
  const ra = new Set<Khoi>()
  for (const p of chuoi(ma).split(/[\s,;|]+/)) {
    // Hai dạng mã tờ THẬT trong kho (đo trên bản sao lưu 21/09: 9 564 câu dạng chữ-đầu, 5 795 câu dạng số-đầu = 38 % kho): `DH-12-C2-B6`, `DB-12-B8-D1` (khối ở đoạn 2)
    // và `12-C1-B2-D1`, `10-C1-B1`, `12-KT-C1-D1` (khối ở đoạn ĐẦU). Tờ `100` (28 câu, `de_kho.lop` = 12) không có khối trong mã.
    const m = /^[A-Za-zĐđ]{1,6}-(10|11|12)(?![0-9])(?:-|$)/.exec(p) ?? /^(10|11|12)-/.exec(p)
    if (m) ra.add(Number(m[1]) as Khoi)
  }
  return ra
}

/** Khối từ MÃ TỜ / MÃ CÂU: `DH-12-C2-B6-TN`, `DB-12-B8-D1`, `DH-11-III-1`, `DH-12-C1-B2-I-49` ⇒ đoạn thứ 2; dạng số-đầu `12-C1-B2-D1`, `10-C1-B1-I-1` ⇒ đoạn đầu.
 *  Danh sách mã nhiều khối KHÁC nhau ⇒ null (mâu thuẫn — luật 05/10, trước đây lấy khối cao nhất). Không nhận ra ⇒ null. */
export function khoiCuaMaDe(ma: unknown): Khoi | null {
  const s = cacKhoiCuaMa(ma)
  return s.size === 1 ? [...s][0]! : null
}

/** CHƯƠNG → KHỐI theo chương trình Hoá 2018 (mã chương của từ vựng đóng `src/lib/tu-vung-dang.ts` — 21 chương; bộ chìa khoá `loi-giai-bo.ts` ghi cùng khối). */
export const KHOI_THEO_MA_CHUONG: Readonly<Record<string, Khoi>> = {
  // Lớp 10
  NGUYEN_TU: 10, BANG_TUAN_HOAN: 10, LIEN_KET: 10, OXI_HOA_KHU: 10, NANG_LUONG_HH: 10, TOC_DO: 10, HALOGEN: 10,
  // Lớp 11
  CAN_BANG: 11, NITROGEN_SULFUR: 11, HUU_CO_DAI_CUONG: 11, HYDROCARBON: 11, ALCOHOL_PHENOL: 11, CARBONYL_ACID: 11,
  // Lớp 12
  ESTER: 12, CARBOHYDRATE: 12, HOP_CHAT_N: 12, POLYMER: 12, DIEN_PHAN: 12, KIM_LOAI: 12, KIM_LOAI_IA_IIA: 12, PHUC_CHAT: 12,
}
/** TÊN CHƯƠNG → khối (tên của thầy 05/10 + tên trong `tu-vung-dang.ts` TEN_CHUONG + tên bộ chìa khoá). Khớp sau khi bỏ dấu/khoảng/gạch — KHÔNG khớp một phần. */
const TEN_CHUONG: ReadonlyArray<[string, Khoi]> = [
  ['Cấu tạo nguyên tử', 10], ['Bảng tuần hoàn', 10], ['Bảng tuần hoàn các nguyên tố', 10], ['Bảng tuần hoàn các nguyên tố hoá học', 10],
  ['Liên kết hoá học', 10], ['Phản ứng oxi hoá – khử', 10], ['Năng lượng hoá học', 10], ['Tốc độ phản ứng', 10], ['Tốc độ phản ứng hoá học', 10],
  ['Halogen', 10], ['Nguyên tố nhóm halogen', 10], ['Nhóm halogen', 10], ['Nguyên tố nhóm VIIA', 10],
  ['Cân bằng hoá học', 11], ['Nitrogen – sulfur', 11], ['Nitrogen và sulfur', 11], ['Đại cương hoá học hữu cơ', 11], ['Đại cương hoá hữu cơ', 11],
  ['Hydrocarbon', 11], ['Dẫn xuất halogen – alcohol – phenol', 11], ['Hợp chất carbonyl – carboxylic acid', 11],
  ['Ester – lipid', 12], ['Ester và lipid', 12], ['Carbohydrate', 12], ['Hợp chất chứa nitrogen', 12], ['Polymer', 12], ['Pin điện và điện phân', 12],
  ['Đại cương kim loại', 12], ['Đại cương về kim loại', 12], ['Kim loại nhóm IA, IIA', 12], ['Nguyên tố nhóm IA và nhóm IIA', 12],
  ['Sơ lược dãy kim loại chuyển tiếp thứ nhất và phức chất', 12], ['Kim loại chuyển tiếp và phức chất', 12],
]
/** Bỏ dấu tiếng Việt, đ→d, chữ thường, mọi ký tự khác chữ/số ⇒ một khoảng ("Phản ứng oxi hoá – khử" ⇒ "phan ung oxi hoa khu"; "hóa"/"hoá" như nhau). */
const chuanTen = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const KHOI_THEO_TEN_CHUONG: ReadonlyMap<string, Khoi> = new Map(TEN_CHUONG.map(([t, k]) => [chuanTen(t), k]))

/**
 * Khối từ CHƯƠNG của câu: mã dạng ("ESTER.THUY_PHAN_BASE.TINH_KHOI_LUONG" ⇒ mã chương ở đoạn đầu), mã chương trần ("CAN_BANG"), "CD:<tên chuyên đề>",
 * hoặc tên chương ("Cân bằng hoá học", "12 · …" không phải tên chương). Không nhận ra ⇒ null (KHÔNG đoán chữ tự do).
 */
export function khoiCuaChuong(v: unknown): Khoi | null {
  const s = laDoiTuong(v) ? chuoi(v.ma ?? v.code ?? v.ten) : chuoi(v)
  if (!s) return null
  const ma = /^([A-Z][A-Z0-9_]*)(?:\.|$)/.exec(s)
  if (ma && ma[1]! in KHOI_THEO_MA_CHUONG) return KHOI_THEO_MA_CHUONG[ma[1]!]!
  const ten = /^CD:\s*(.+)$/i.exec(s)?.[1] ?? s
  return KHOI_THEO_TEN_CHUONG.get(chuanTen(ten)) ?? null
}

/** Tình trạng khối của một câu: `ro` (mọi nguồn đọc được cùng một khối), `khong_ro` (không nguồn nào đọc ra), `mau_thuan` (≥ 2 khối khác nhau). */
export type TinhTrangKhoi = 'ro' | 'khong_ro' | 'mau_thuan'
export interface PhanTichKhoi {
  /** Khối khi `tinhTrang = 'ro'`; còn lại null. */
  khoi: Khoi | null
  tinhTrang: TinhTrangKhoi
  /** Các khối đọc được (để báo/đo). */
  cacKhoi: Khoi[]
}
const ketLuan = (s: Set<Khoi>): PhanTichKhoi => {
  const cacKhoi = [...s].sort()
  return cacKhoi.length === 1 ? { khoi: cacKhoi[0]!, tinhTrang: 'ro', cacKhoi } : { khoi: null, tinhTrang: cacKhoi.length ? 'mau_thuan' : 'khong_ro', cacKhoi }
}
/** Bỏ đuôi câu song sinh "~ss0"/"~ss1" (song sinh đi theo câu gốc). */
const maGoc = (v: unknown): string => chuoi(v).split('~')[0]!

/**
 * PHÂN TÍCH KHỐI của MỘT CÂU. Đọc chịu mọi khuôn: câu game (`maDe`, `qid`, `dang`), dòng D1 (`ma_de`, `lop` của `de_kho`/`cau_hoi`, `ma_dang`, `chuyen_de`),
 * tờ kho R2 (`maDe`, `nhom`), câu BTVN/ôn lại (`qid`, `maDe`), hoặc chuỗi mã câu/mã tờ.
 */
export function phanTichKhoiCau(c: unknown): PhanTichKhoi {
  const s = new Set<Khoi>()
  const them = (k: Khoi | null) => { if (k !== null) s.add(k) }
  if (typeof c === 'string' || typeof c === 'number') { for (const k of cacKhoiCuaMa(maGoc(c))) s.add(k); return ketLuan(s) }
  if (!laDoiTuong(c)) return ketLuan(s)
  for (const x of ['maDe', 'ma_de', 'maTo', 'ma_to']) for (const k of cacKhoiCuaMa(c[x])) s.add(k)
  for (const k of cacKhoiCuaMa(maGoc(chuoi(c.qid) || c.id))) s.add(k) // `id` chỉ đọc khi không có `qid` (như luật cũ — `id` có thể là mã khác)
  for (const x of ['lop', 'khoi', 'lopTo', 'lop_to', 'nhom']) them(khoiCuaLop(c[x]))
  for (const x of ['dang', 'ma_dang', 'maDang', 'chuong', 'tenChuong', 'chuyenDe', 'chuyen_de']) them(khoiCuaChuong(c[x]))
  return ketLuan(s)
}

/** Khối của MỘT CÂU khi mọi nguồn đọc được KHỚP nhau; không đọc ra hoặc MÂU THUẪN ⇒ null (luật 05/10 — trước đây lấy khối cao nhất). */
export function khoiCuaCau(c: unknown): Khoi | null {
  return phanTichKhoiCau(c).khoi
}

/**
 * Khối của MỘT EM. Nhận `{ lop, tenLop|ten_lop, khoi }` (hoc_sinh.lop là lớp/khối "12A1", "11"; tên lớp "12 - Tinh Hoa" cũng bắt đầu bằng khối) hoặc một chuỗi lớp.
 * Hai nguồn KHÁC nhau ⇒ null (không rõ — luật 05/10, trước đây lấy khối thấp hơn). Không rõ (chưa xếp lớp, rỗng) ⇒ null.
 */
export function khoiCuaEm(e: unknown): Khoi | null {
  if (typeof e === 'string' || typeof e === 'number') return khoiCuaLop(e)
  if (!laDoiTuong(e)) return null
  const s = new Set<Khoi>()
  for (const v of [e.lop, e.tenLop ?? e.ten_lop, e.khoi]) { const k = khoiCuaLop(v); if (k !== null) s.add(k) }
  return s.size === 1 ? [...s][0]! : null
}

/** Lý do CHẶN một câu với khối đích (khối em — luật A; khối lớp — luật B). `null` = câu ĐÚNG KHỐI, cho qua. */
export type LyDoChanKhoi = 'khac_khoi' | 'khong_ro' | 'mau_thuan' | 'em_khong_ro'
export function lyDoChanKhoi(khoiDich: Khoi | null | undefined, cau: unknown): LyDoChanKhoi | null {
  if (!laKhoi(khoiDich)) return 'em_khong_ro'
  const p = phanTichKhoiCau(cau)
  if (p.tinhTrang === 'khong_ro') return 'khong_ro'
  if (p.tinhTrang === 'mau_thuan') return 'mau_thuan'
  return p.khoi === khoiDich ? null : 'khac_khoi'
}

/** CÂU ĐÚNG KHỐI? (luật 05/10) Câu khối == khối đích ⇒ true. Khác khối (thấp hay cao), câu không rõ/mâu thuẫn khối, hoặc không rõ khối đích ⇒ false. */
export function cauHopKhoi(khoiEm: Khoi | null | undefined, cau: unknown): boolean {
  return lyDoChanKhoi(khoiEm, cau) === null
}

/** Giữ các câu ĐÚNG KHỐI, GIỮ NGUYÊN thứ tự, không sửa đầu vào. Đầu vào không phải mảng ⇒ []. */
export function locCauHopKhoi<T>(khoiEm: Khoi | null | undefined, ds: readonly T[]): T[] {
  return Array.isArray(ds) ? ds.filter((c) => cauHopKhoi(khoiEm, c)) : []
}

/** Kết quả lọc kèm ĐẾM theo lý do (luật 05/10, mục D: đo số câu bị chặn theo khác khối · không rõ · mâu thuẫn). */
export interface KetQuaLocKhoi<T> {
  /** Câu đúng khối, GIỮ NGUYÊN thứ tự. */
  giu: T[]
  /** Số câu bị CHẶN vì khối khác khối đích (thấp hay cao). */
  khacKhoi: number
  /** Số câu bị CHẶN vì không đọc ra khối. */
  khongRo: number
  /** Số câu bị CHẶN vì các nguồn khối mâu thuẫn. */
  mauThuan: number
  /** Số câu bị CHẶN vì không rõ khối đích (em/lớp chưa rõ khối). */
  emKhongRo: number
  /** Tên cũ (21/09): tổng số câu bị loại. */
  boCao: number
}
export function locCauKemDem<T>(khoiEm: Khoi | null | undefined, ds: readonly T[], cauCua: (x: T) => unknown = (x) => x): KetQuaLocKhoi<T> {
  const ra: KetQuaLocKhoi<T> = { giu: [], khacKhoi: 0, khongRo: 0, mauThuan: 0, emKhongRo: 0, boCao: 0 }
  if (!Array.isArray(ds)) return ra
  for (const c of ds) {
    const ly = lyDoChanKhoi(khoiEm, cauCua(c))
    if (ly === null) { ra.giu.push(c); continue }
    ra.boCao++
    if (ly === 'khac_khoi') ra.khacKhoi++
    else if (ly === 'khong_ro') ra.khongRo++
    else if (ly === 'mau_thuan') ra.mauThuan++
    else ra.emKhongRo++
  }
  return ra
}

/** Số câu có khối KHÔNG đọc ra hoặc MÂU THUẪN (tờ lạc khối) — để máy chủ báo. */
export const demCauKhongRoKhoi = (ds: readonly unknown[]): number => (Array.isArray(ds) ? ds.filter((c) => khoiCuaCau(c) === null).length : 0)

/** Các khối KHÁC khối em (luật 05/10: chặn MỌI khối khác — để dựng điều kiện SQL/lọc theo mã tờ ở máy chủ). Không rõ khối em ⇒ mọi khối. */
export const khoiKhac = (khoiEm: Khoi | null | undefined): Khoi[] => CAC_KHOI.filter((k) => !laKhoi(khoiEm) || k !== khoiEm)
/** TÊN CŨ (21/09, khi chỉ chặn khối CAO hơn). Luật 05/10: các khối phải CHẶN = MỌI khối khác ⇒ cùng nghĩa `khoiKhac`. */
export const khoiCaoHon = khoiKhac
