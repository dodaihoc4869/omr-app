// TU LUYỆN · SỬA CÂU SAI × THANG LÀM LẠI BẰNG BẢN KHÁC (làn A', 06/10).
// Thầy 05/10: "thay vì lặp lại câu sai bạn hãy tìm cách để học sinh vẫn hoàn thành được câu sai đó nhưng không học thuộc đáp án được." Lệnh thầy 30/09 (Sửa câu sai):
// "lấy lại trùng cũng được" ⇒ KHÔNG có bản khác thì NGUYÊN VĂN như cũ (không lỗi, không rỗng, không bớt câu).
// Chế độ 1 chọn NÀO câu nào (thứ tự, số câu, lặp, nhãn "Luyện lại lần K" / "Sai gốc") GIỮ NGUYÊN; tệp này chỉ đổi NỘI DUNG câu đã chọn khi câu ấy đang trong cửa sổ lỗi
// (hàm thang `apLamLaiKhac` của cau-anh-em.ts — song sinh bản kế → câu anh em ĐÚNG KHỐI → bản xáo → nguyên văn; luật thang KHÔNG viết lại ở đây).
// Tu luyện độc lập (không EXP, không sổ sự kiện): hồ sơ srs2 chỉ ĐỌC (`docHoSo2`) để biết câu nào đang trong cửa sổ lỗi; không ghi gì, không đụng kế hoạch ngày.
// Khoá `lam_lai_khac` tắt ⇒ không đọc gì thêm, trả y nguyên (đường hôm nay). Lỗi đọc thang ⇒ y nguyên.
import type { Env } from './kieu'
import type { PrivateQuestion } from '../../src/game/than-thu-v2/core'
import { apLamLaiKhac, lamLaiKhacBat } from './cau-anh-em'
import { docBaoVeKho } from './bao-ve-kho-cong-khai'
import { chanKhacKhoiEm } from './chan-khac-khoi'
import { docHoSo2, ngayVnCua, type MetaCau } from './srs2-d1'
import type { LamLaiRef } from './lam-lai-so'

/** Câu hiển thị cho một chỗ của lượt Sửa câu sai: chính câu gốc (nguyên văn) hoặc bản khác của nó. */
export interface CauThayTheoThang {
  /** Câu em THẬT SỰ nhìn thấy (đã áp bản xáo / song sinh / câu anh em). */
  q: PrivateQuestion
  /** Khoá làm lại của thang (`tc` = câu gốc, `xt` = hoán vị xáo, `nv` = nguyên văn); vắng ⇒ câu không phải lỗi, giữ như cũ. */
  lamLai?: LamLaiRef
}

/** MetaCau (siêu dữ liệu kế hoạch) dựng từ chính câu đầy đủ trong kho — thang đọc `maDe`, `group`, `phan`, `mucDo`, `dang`. */
function metaTuCau(q: PrivateQuestion): MetaCau {
  return { qid: q.qid, maDe: q.maDe, version: q.version, group: q.group, phan: q.phan, mucDo: q.mucDo ?? null, dang: q.dang ?? null, tenDang: q.tenDang ?? null, sao: Number(q.sao) || 0, tuLuan: false }
}

/**
 * Với danh sách câu gốc ĐÃ CHỌN (đúng thứ tự lượt, có thể lặp cùng một câu), trả lại cùng thứ tự, cùng độ dài: câu hiển thị của từng chỗ.
 * Câu không trong cửa sổ lỗi / khoá tắt / lỗi đọc ⇒ `{ q: câu gốc }`. Câu thay (đổi nội dung) QUA LẠI cổng khối chung `chanKhacKhoiEm` (kênh `tu_luyen_thang`);
 * bị chặn ⇒ giữ câu gốc (đã qua cổng `tu_luyen_kho_sai`). Câu anh em tránh câu đang bảo vệ cho ca thi (`docBaoVeKho`) và mọi câu của kế hoạch (`hs.cau`).
 */
export async function thayCauSaiTheoThang(env: Env, sbd: string, goc: readonly PrivateQuestion[], nowMs: number): Promise<CauThayTheoThang[]> {
  const nguyen = (): CauThayTheoThang[] => goc.map((q) => ({ q }))
  if (!goc.length) return []
  try {
    if (!(await lamLaiKhacBat(env))) return nguyen()
    const baoVe = await docBaoVeKho(env)
    if (!baoVe) return nguyen() // không kiểm được đề đang bảo vệ ⇒ không chọn câu mới (thà giữ câu cũ)
    const hs = await docHoSo2(env, sbd, ngayVnCua(nowMs), Promise.resolve(false)) // chỉ cần cửa sổ lỗi / song sinh / bổ trợ (nguồn câu sai mọi kênh) — KHÔNG hỏi cờ OMNI, không dựng phần OMNI
    if (!goc.some((q) => hs.loiV2?.has(q.qid))) return nguyen() // không câu nào trong cửa sổ lỗi ⇒ khỏi đọc thêm
    const ds = goc.map((q) => ({ q, m: metaTuCau(q) }))
    const ra = await apLamLaiKhac(env, hs, ds, { sbd, nowMs, keHoach: hs.cau.map((c) => c.qid) }, baoVe)
    if (ra.length !== goc.length) return nguyen()
    const doi = ra.filter((x, i) => x.q !== goc[i] || x.lamLai)
    if (!doi.length) return nguyen()
    const giu = new Set(await chanKhacKhoiEm(env, 'tu_luyen_thang', sbd, doi, { cauCua: (y) => y.q })) // LUẬT THẦY 05/10: cổng cuối cho câu thay của thang
    return ra.map((x, i) => (x.q === goc[i] && !x.lamLai ? { q: x.q } : giu.has(x) ? { q: x.q, ...(x.lamLai ? { lamLai: x.lamLai } : {}) } : { q: goc[i]! }))
  } catch (e) {
    console.error('[tu-luyen-thang] thang làm lại lỗi (giữ câu như cũ):', e instanceof Error ? e.message : e)
    return nguyen()
  }
}
