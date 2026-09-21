// CÂU HỢP KHỐI VỚI EM — MỘT ĐỊNH NGHĨA DÙNG CHUNG (Code 1, 21/09/2026; Boss chốt luật sau P0 thầy báo 20:28: "học sinh lớp 11 nhưng rút câu của lớp 12").
//
// LUẬT (Boss): mọi kênh rút câu TỰ ĐỘNG chỉ được đưa cho em câu của KHỐI EM ĐANG HỌC hoặc khối THẤP HƠN — KHÔNG BAO GIỜ khối cao hơn, kể cả khi trùng mã dạng
// (tên dạng như "Ứng dụng — nhận dạng" dùng chung nhiều khối), kể cả câu "sửa lỗi" / "tới hạn ôn". KHÔNG áp ở nơi thầy TỰ CHỌN câu (Gọi lên bảng, ca thi thầy dựng, thầy giao tay).
//
// THUẦN: không IO, không import, không đồng hồ — máy chủ (server/src), máy thầy, máy học sinh/phụ huynh cùng import (như `cau-tu-luan.ts`). Không dùng localStorage/window.
//
// KHỐI CỦA MỘT CÂU = khối của TỜ ĐỀ chứa nó (mã tờ `DH-12-C2-B6-TN`, `DB-12-B8-D1`, `DH-11-III-1`: đoạn thứ 2). Mã câu (`qid`) bắt đầu bằng mã tờ (`DH-12-C1-B2-I-49`) nên cũng đọc được.
// Nhiều nguồn cùng nói khối của câu (mã tờ, qid, cột `lop` của `de_kho` / `cau_hoi`, nhóm "12 · …") mà KHÁC nhau ⇒ lấy khối CAO NHẤT (chặn thừa còn hơn lọt câu khối cao).
// KHỐI CỦA EM = `hoc_sinh.lop` ('10'|'11'|'12') và/hoặc tên lớp ("12 - Tinh Hoa"); hai nguồn KHÁC nhau ⇒ lấy khối THẤP hơn (cùng lý do).
//
// "KHÔNG BIẾT ⇒ KHÔNG KẾT TỘI" (cùng tinh thần `cau-tu-luan.ts`): khối của câu không đọc ra (mã tờ lạ, thầy tự đặt tên) hoặc khối của em không rõ (chưa xếp lớp) ⇒ `true` (không có căn cứ để chặn).
// Máy chủ nên ĐẾM những câu `khoiCuaCau = null` để thấy kho có tờ lạc khối — đó là lỗi nạp đề cần sửa, không phải lý do để im lặng chặn cả kho.

export type Khoi = 10 | 11 | 12
export const CAC_KHOI: readonly Khoi[] = [10, 11, 12]

type Doi = Record<string, unknown>
const laDoiTuong = (x: unknown): x is Doi => x !== null && typeof x === 'object' && !Array.isArray(x)
const chuoi = (x: unknown): string => (typeof x === 'string' ? x : typeof x === 'number' && Number.isFinite(x) ? String(x) : '').normalize('NFC').trim()
const laKhoi = (n: number): n is Khoi => n === 10 || n === 11 || n === 12

/** Khối ở ĐẦU một chuỗi ("12", " 12 ", "Lớp 12", "12 - Tinh Hoa", "12A1", "12 · DẠNG BÀI/…"); số khác 10–12 ("120", "9") hay chữ lạ ⇒ null. */
export function khoiCuaLop(v: unknown): Khoi | null {
  const m = /^(?:lớp\s*|khối\s*)?(10|11|12)(?![0-9])/i.exec(chuoi(v))
  return m ? (Number(m[1]) as Khoi) : null
}

/** Khối từ MÃ TỜ / MÃ CÂU: `DH-12-C2-B6-TN`, `DB-12-B8-D1`, `DH-11-III-1`, `DH-12-C1-B2-I-49` ⇒ đoạn thứ 2 (10/11/12). Danh sách mã ngăn bằng phẩy/chấm phẩy/khoảng trắng ⇒ khối CAO NHẤT. Không nhận ra ⇒ null. */
export function khoiCuaMaDe(ma: unknown): Khoi | null {
  let cao: Khoi | null = null
  for (const p of chuoi(ma).split(/[\s,;|]+/)) {
    const m = /^[A-Za-zĐđ]{1,6}-(10|11|12)(?![0-9])(?:-|$)/.exec(p)
    if (m) { const k = Number(m[1]) as Khoi; if (cao === null || k > cao) cao = k }
  }
  return cao
}

/** Khối CAO NHẤT trong các khối đọc được (bỏ null); không có khối nào ⇒ null. */
const caoNhat = (ds: Array<Khoi | null>): Khoi | null => ds.reduce<Khoi | null>((a, k) => (k !== null && (a === null || k > a) ? k : a), null)
const thapNhat = (ds: Array<Khoi | null>): Khoi | null => ds.reduce<Khoi | null>((a, k) => (k !== null && (a === null || k < a) ? k : a), null)

/**
 * Khối của MỘT CÂU. Đọc chịu mọi khuôn: câu game (`maDe`, `qid`), dòng D1 (`ma_de`, `lop` của `de_kho`/`cau_hoi`), tờ kho R2 (`maDe`, `nhom`), câu BTVN/ôn lại (`qid`, `maDe`), hoặc `khoi` đã tính.
 * Nhiều nguồn khác nhau ⇒ khối CAO NHẤT. Không nguồn nào đọc ra ⇒ null.
 */
export function khoiCuaCau(c: unknown): Khoi | null {
  if (typeof c === 'string') return khoiCuaMaDe(c)
  if (!laDoiTuong(c)) return null
  const lay = (...k: string[]): unknown => { for (const x of k) if (c[x] !== undefined && c[x] !== null && c[x] !== '') return c[x]; return undefined }
  return caoNhat([
    khoiCuaMaDe(lay('maDe', 'ma_de', 'maTo', 'ma_to')),
    khoiCuaMaDe(lay('qid', 'id')),
    khoiCuaLop(lay('lop', 'khoi')),
    khoiCuaLop(lay('nhom')),
  ])
}

/**
 * Khối của MỘT EM. Nhận `{ lop, tenLop|ten_lop, khoi }` (hoc_sinh.lop là KHỐI; tên lớp "12 - Tinh Hoa" cũng bắt đầu bằng khối) hoặc một chuỗi lớp.
 * Hai nguồn khác nhau ⇒ khối THẤP hơn. Không rõ (chưa xếp lớp, rỗng) ⇒ null.
 */
export function khoiCuaEm(e: unknown): Khoi | null {
  if (typeof e === 'string' || typeof e === 'number') return khoiCuaLop(e)
  if (!laDoiTuong(e)) return null
  return thapNhat([khoiCuaLop(e.lop), khoiCuaLop(e.tenLop ?? e.ten_lop), khoiCuaLop(e.khoi)])
}

/** CÂU HỢP KHỐI VỚI EM? `khoiEm` đã tính bằng `khoiCuaEm`. Câu khối ≤ khối em ⇒ true; khối CAO hơn ⇒ false; không rõ khối em hoặc khối câu ⇒ true (không biết ⇒ không kết tội). */
export function cauHopKhoi(khoiEm: Khoi | null | undefined, cau: unknown): boolean {
  if (khoiEm === null || khoiEm === undefined || !laKhoi(khoiEm)) return true
  const k = khoiCuaCau(cau)
  return k === null || k <= khoiEm
}

/** Giữ các câu hợp khối, GIỮ NGUYÊN thứ tự, không sửa đầu vào. Đầu vào không phải mảng ⇒ []. */
export function locCauHopKhoi<T>(khoiEm: Khoi | null | undefined, ds: readonly T[]): T[] {
  return Array.isArray(ds) ? ds.filter((c) => cauHopKhoi(khoiEm, c)) : []
}

/** Số câu có khối KHÔNG đọc ra (tờ lạc khối) — để máy chủ báo, không để chặn. */
export const demCauKhongRoKhoi = (ds: readonly unknown[]): number => (Array.isArray(ds) ? ds.filter((c) => khoiCuaCau(c) === null).length : 0)

/** Các khối CAO hơn khối em (để dựng điều kiện SQL/lọc theo mã tờ ở máy chủ). Không rõ khối em ⇒ []. */
export const khoiCaoHon = (khoiEm: Khoi | null | undefined): Khoi[] => (khoiEm && laKhoi(khoiEm) ? CAC_KHOI.filter((k) => k > khoiEm) : [])
