// BẢN KHÁC "ẢO" CHO CÂU SAI — HAI BẬC MỚI của thang làm lại (06/10, làn A đợt 2; thang 4 bậc: cau-anh-em.ts; đề xuất: DE-XUAT-LAM-LAI-CAU-SAI-0510.md).
// Thầy 05/10: "thay vì lặp lại câu sai bạn hãy tìm cách để học sinh vẫn hoàn thành được câu sai đó nhưng không học thuộc đáp án được" + "tôi ko duyệt gì cả".
//
//   · `<Q>~bt<k>` BIẾN THỂ BẰNG MÃ (Phần I / III có bộ sinh theo dạng — bien-the-sinh.ts `apBienThe`, đáp án TÍNH BẰNG MÃ, kiểm chéo ở test):
//     hạt giống = CHÍNH qid ảo ⇒ chấm / mở lại phiên dở (`resume`, Đoàn xem lại, `napLaiLuotCho`) sinh LẠI đúng câu cũ — không lưu nội dung biến thể ở đâu cả.
//   · `<Q>~yd<k>` BỘ Ý ĐÚNG–SAI MỚI (Phần II — kho `cau_y_ds` do máy soạn nộp, hai lượt kiểm độc lập): nhóm thứ k = 4 ý [4k, 4k+4) theo `stt` của ĐÚNG đề dẫn
//     (cùng băm) — ý ở các nhóm trước (em đã làm) là ý em ĐÃ GẶP, nhóm sau là ý CHƯA gặp; không đủ 4 ý chưa gặp / kho rỗng ⇒ null (bậc sau, không lỗi).
//     Kho chỉ-thêm (INSERT OR IGNORE, không sửa/xoá) ⇒ nhóm k không đổi khi kho dài thêm ⇒ phát lại ra đúng 4 ý cũ, đúng thứ tự.
//
// k = SỐ THỨ TỰ KẾ TIẾP (lớn nhất em đã làm + 1) đếm từ sổ (`HoSo2.banKhacTiep`, srs2-d1 `docHoSo2`): sổ ghi dưới CHÍNH qid ảo kèm `raw_json.tc = Q` ⇒ mọi nơi
// đọc lịch sử của Q (docLanLam, hàng chữa lỗi, bảng chiến dịch…) coi là một lượt SONG SINH của Q và `phatLaiLoi(Q)` tiến y như lượt song sinh (tiêu chí 3).
//
// LUẬT KHỐI (thầy 05/10): kênh MỚI đưa câu cho em ⇒ chỉ khi khối em RÕ và BẰNG khối câu gốc (`apBienThe` tự kiểm; ý Đ–S qua `cauHopKhoi` + cột `lop`).
// ĐÁP ÁN chỉ ở máy chủ: câu trả về là `PrivateQuestion`, nơi dùng gửi `publicQuestion` (bỏ correct / solution). Giữ `version` + `group` của câu gốc để
// chỗ giải ref (docCauTheoRef) tìm đúng câu gốc và cổng ca thi (`blocked.has(group)`) vẫn chặn khi câu gốc đang được bảo vệ — như câu song sinh.
// Không đổi giao diện học sinh: không chữ mới, không khoá mới xuống máy em.
import type { Env } from './kieu'
import type { PrivateQuestion } from '../../src/game/than-thu-v2/core'
import { laCauTuLuan } from '../../src/lib/cau-tu-luan'
import { khoiCuaCau, type Khoi } from '../../src/lib/khoi-cau'
import { apBienThe, coBoSinh } from './bien-the-sinh'
import { docYDsTheoQid, type YDs } from './cau-y-ds'
import { loaiQidAo, qidBienThe, qidYDsMoi } from './loi-hoc-luat'

/** Số hạt kế tiếp được thử khi hạt `k` không lắp được biến thể (qua cổng kiểm của máy) — qid ảo phát ra là hạt ĐÃ lắp được. */
export const SO_THU_BIEN_THE = 3
/** Một nhóm ý Đ–S mới gồm đúng chừng này ý (như câu Phần II gốc). */
export const SO_Y_MOT_NHOM = 4

// ---------------------------------------------------------------- bậc BIẾN THỂ BẰNG MÃ
/**
 * Biến thể bằng mã của câu gốc theo qid ảo `<gốc>~bt<k>` (tất định: hạt giống = qid ảo). Không có bộ sinh theo dạng / Phần II / tự luận / khối em và khối câu không rõ
 * hoặc khác nhau / không lắp được ⇒ null. `version` + `group` giữ của câu gốc (xem đầu tệp).
 */
export function bienTheTheoQid(goc: PrivateQuestion, qidAo: string, khoiEm: Khoi | null): PrivateQuestion | null {
  if (!goc || (goc.phan !== 'I' && goc.phan !== 'III') || typeof goc.dang !== 'string' || !coBoSinh(goc.dang)) return null
  const bt = apBienThe(goc, qidAo, khoiEm) // tự kiểm: không tự luận, khối em = khối câu gốc (cả hai rõ), qid ảo không lệch khối, cổng kiểm của máy
  return bt ? { ...bt, version: goc.version, group: goc.group } : null
}

// ---------------------------------------------------------------- bậc Ý ĐÚNG–SAI MỚI
/** Kiến thức cốt lõi (`chot`) của lời giải câu gốc — cùng đề dẫn nên dùng lại cho bộ ý mới; không có ⇒ ''. */
function chotCua(solution: unknown): string {
  let o: unknown = solution
  if (typeof o === 'string') { try { o = JSON.parse(o) } catch { return '' } }
  if (!o || typeof o !== 'object') return ''
  const c = (o as Record<string, unknown>).chot
  return typeof c === 'string' && c.trim() && !c.includes('[object Object]') ? c.trim() : ''
}
/**
 * Đề có HÌNH / ẢNH riêng (ảnh thân câu, hình trong đề)? Ý mới do máy soạn chỉ thấy CHỮ + bảng của đề dẫn — đề phụ thuộc hình thì không chắc ý mới đúng ⇒ không dùng (thà bỏ bậc).
 * Hình chỉ nằm sau lời giải (`sau_loi_giai`) không phải hình của đề.
 */
export function deCoHinh(q: Pick<PrivateQuestion, 'thanCauImg' | 'imageDataUrl' | 'hinhAnh' | 'ideaImgs'>): boolean {
  return !!q.thanCauImg || !!q.imageDataUrl || (q.hinhAnh ?? []).some((h) => h.viTri !== 'sau_loi_giai') || (q.ideaImgs ?? []).some(Boolean)
}
/** Nhóm ý thứ k (4 ý liền nhau theo `stt`) hoặc null khi kho không còn đủ 4 ý CHƯA gặp. */
export function nhomYDs(ys: readonly YDs[], k: number): YDs[] | null {
  if (!Number.isInteger(k) || k < 0) return null
  const g = ys.slice(k * SO_Y_MOT_NHOM, (k + 1) * SO_Y_MOT_NHOM)
  return g.length === SO_Y_MOT_NHOM ? g : null
}
/** Câu Phần II với đề dẫn của câu gốc + 4 ý mới (đáp án Đ/S theo từng ý, lời giải từng ý = lý do máy soạn). Không đủ điều kiện ⇒ null. */
export function apYDsMoi(goc: PrivateQuestion, qidAo: string, nhom: readonly YDs[]): PrivateQuestion | null {
  if (!goc || goc.phan !== 'II' || nhom.length !== SO_Y_MOT_NHOM || !qidAo || laCauTuLuan(goc) || deCoHinh(goc)) return null
  if (nhom.some((y) => !y.t.trim() || (y.d !== 'D' && y.d !== 'S'))) return null
  const correct = nhom.map((y) => y.d).join('')
  const tungY = Object.fromEntries(nhom.map((y, i) => [['a', 'b', 'c', 'd'][i]!, { dung: y.d === 'D', vi_sao: y.lyDo }]))
  return {
    ...goc, qid: qidAo, choices: [], ideas: nhom.map((y) => y.t.trim()), ideaImgs: undefined, choiceImgs: undefined, hinhAnh: [],
    correct, reviewed: true, version: goc.version, group: goc.group,
    solution: { chot: chotCua(goc.solution), tung_y: tungY, ket_qua: correct, yd_moi: true },
  }
}

// ---------------------------------------------------------------- giải qid ảo → câu (dùng khi chấm / resume / Đoàn xem lại / nạp lại lượt chờ)
/**
 * Câu của qid ảo `~bt<k>` / `~yd<k>` từ CÂU GỐC đã nạp (`goc`). Qid không phải hai loại này ⇒ null. Đọc D1 chỉ khi là `~yd` (một truy vấn nối qid → băm → ý).
 * Khối em lúc chấm = khối câu gốc (lúc phát đã đòi em cùng khối câu gốc); không rõ khối câu ⇒ null.
 */
export async function phuQidAoMoi(env: Env, goc: PrivateQuestion, qidAo: string): Promise<PrivateQuestion | null> {
  const t = loaiQidAo(qidAo)
  if (!t || (t.loai !== 'bt' && t.loai !== 'yd') || !goc || laCauTuLuan(goc)) return null
  const khoi = khoiCuaCau(goc)
  if (khoi === null) return null
  if (t.loai === 'bt') return bienTheTheoQid(goc, qidAo, khoi)
  if (goc.phan !== 'II') return null
  const ys = (await docYDsTheoQid(env, [t.goc], { lop: String(khoi), khoiEm: khoi })).get(t.goc) ?? []
  const nhom = nhomYDs(ys, t.k)
  return nhom ? apYDsMoi(goc, qidAo, nhom) : null
}

// ---------------------------------------------------------------- chọn bản khác cho MỘT LƯỢT (thang làm lại — cau-anh-em.ts `apLamLaiKhac`)
export interface TiepBanKhac { bt: number; yd: number }
/**
 * Với các câu gốc đang trong cửa sổ lỗi và CHƯA có song sinh: bản khác MỚI của từng câu (nếu có) — Map qid gốc → câu với qid ảo. MỘT truy vấn D1 cho mọi câu Phần II của lượt
 * (chỉ khi có câu Phần II); Phần I/III thuần mã. `khoiEm` null ⇒ rỗng. Lỗi đọc ⇒ bỏ riêng phần Phần II (rơi xuống bậc sau, không ném).
 */
export async function chonBanKhacMoi(env: Env, cho: readonly PrivateQuestion[], tiep: ReadonlyMap<string, TiepBanKhac> | undefined, khoiEm: Khoi | null): Promise<Map<string, PrivateQuestion>> {
  const ra = new Map<string, PrivateQuestion>()
  if (khoiEm === null) return ra
  const hop = cho.filter((q) => !laCauTuLuan(q) && khoiCuaCau(q) === khoiEm)
  const phanII: PrivateQuestion[] = []
  for (const q of hop) {
    if (q.phan === 'II') { phanII.push(q); continue }
    const t0 = tiep?.get(q.qid)?.bt ?? 0
    for (let j = 0; j < SO_THU_BIEN_THE; j++) {
      const bt = bienTheTheoQid(q, qidBienThe(q.qid, t0 + j), khoiEm)
      if (bt) { ra.set(q.qid, bt); break }
    }
  }
  if (phanII.length) {
    const ys = await docYDsTheoQid(env, phanII.map((q) => q.qid), { lop: String(khoiEm), khoiEm }).catch(() => new Map<string, YDs[]>())
    for (const q of phanII) {
      const k = tiep?.get(q.qid)?.yd ?? 0
      const nhom = nhomYDs(ys.get(q.qid) ?? [], k)
      const moi = nhom ? apYDsMoi(q, qidYDsMoi(q.qid, k), nhom) : null
      if (moi) ra.set(q.qid, moi)
    }
  }
  return ra
}
