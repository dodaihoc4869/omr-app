// CHẶN LỘ ĐÁP ÁN CA KIỂM TRA QUA KÊNH LUYỆN CÔNG KHAI (Code 3, 29/09/2026). Test: tests/lo-dap-an-kho-ca-mo-2909.test.ts.
//
// Luật app: "Đáp án không xuống máy học sinh trước khi nộp". Ca kiểm tra do máy thầy dựng TỪ KHO và giữ NGUYÊN qid của kho
// (`buildTeacherSourceFromKhoDe` → `mergeAndStrip`), nên câu của ca đang mở cũng nằm trong `kho/<mã đề>.json` — gói CÓ `dap_an`
// + `loi_giai`. Hai lệnh `/goi` của máy em không cần mã thầy — `cauKhacPhuc` và `deTheoDangBai` — trả thẳng các gói ấy; trước
// 29/09 chúng KHÔNG gỡ câu của đề đang bảo vệ, nên em đang thi gọi lệnh (không kèm `sbd` cũng được) là có đáp án câu đang làm.
//
// Luật "câu nào đang bảo vệ" dùng CHUNG với 11 kênh khác (game, Bi-a, Đoàn, luyện đề, kế hoạch ngày…): `protectedQuestions`
// (game-v2-bank.ts) — ca chưa công bố theo `cong_bo`, hoặc ca còn trong giờ làm; trả cả qid lẫn NHÓM NỘI DUNG của từng câu.
// Ở đây chỉ thêm lớp mỏng để áp luật ấy lên GÓI KHO THÔ: gỡ câu khớp qid HOẶC khớp nhóm nội dung (câu chép sang tờ khác — tờ
// dạng bài `DB-…`, tờ trùng câu — mang qid mới nhưng cùng nội dung, cùng đáp án). Gỡ CẢ CÂU chứ không chỉ xoá đáp án: câu
// thiếu đáp án trên máy em sẽ bị chấm sai, và cũng không có lý do phục vụ lại đúng câu em đang làm.
import { normalizeBank, protectedQuestions } from './game-v2-bank'
import { qidCauTrongGoi, type PhanCau } from './cam-tu-luan'
import type { Env } from './kieu'

/** Không đọc được phạm vi bảo vệ ⇒ ĐÓNG CỬA (không trả gói có đáp án), như `cau-theo-qid.ts`. */
export const LOI_CHUA_KIEM_BAO_VE = 'Máy chủ chưa kiểm tra xong câu của ca kiểm tra đang mở. Em thử lại sau ít phút.'

/** Tập qid + nhóm nội dung của các ca đang bảo vệ; `null` khi không đọc được (nơi gọi phải đóng cửa). */
export async function docBaoVeKho(env: Env): Promise<Set<string> | null> {
  try {
    return await protectedQuestions(env)
  } catch (e) {
    console.error('[bao-ve-kho] không kiểm được đề đang bảo vệ:', e instanceof Error ? e.message : e)
    return null
  }
}

const KHOA_GOI: ReadonlyArray<readonly [string, PhanCau | undefined]> = [['cau', undefined], ['phanI', 'I'], ['phanII', 'II'], ['phanIII', 'III']]
const chuoi = (v: unknown): string => (typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '')

/** Nhóm nội dung của MỘT câu thô — đúng cách chỉ mục game và `protectedQuestions` tính (`normalizeBank` → `contentGroup`).
 *  Câu không chuẩn hoá được (thiếu đáp án, thiếu phương án…) ⇒ '' (chỉ còn khớp theo qid). */
async function nhomNoiDung(c: Record<string, unknown>, maDe: string, qid: string, phan?: PhanCau): Promise<string> {
  try {
    const mot = phan ? { [`phan${phan}`]: [{ ...c, id: chuoi(c.id) || chuoi(c.qid) || qid }] } : { ma_de: maDe || 'KHO', cau: [c] }
    const qs = await normalizeBank(mot, maDe)
    return qs[0]?.group ?? ''
  } catch {
    return ''
  }
}

/**
 * Gỡ khỏi MỘT gói đề (SỬA TẠI CHỖ) mọi câu thuộc ca đang bảo vệ — khớp qid (theo mã đề nơi gọi và theo `ma_de` ghi trong gói)
 * HOẶC khớp nhóm nội dung. Đọc cả khuôn kho thô (`cau[]`) lẫn nguồn thầy (`phanI/II/III`). Trả qid (theo mã đề nơi gọi) đã gỡ.
 * Không có ca nào đang bảo vệ ⇒ không tính gì (không tốn CPU băm câu ngoài giờ kiểm tra).
 */
export async function goCauBaoVeKhoiGoi(goi: unknown, maDe: string, baoVe: ReadonlySet<string>): Promise<Set<string>> {
  const qidBo = new Set<string>()
  if (baoVe.size === 0 || goi === null || typeof goi !== 'object' || Array.isArray(goi)) return qidBo
  const g = goi as Record<string, unknown>
  const maGoi = chuoi(g.ma_de)
  for (const [khoa, phan] of KHOA_GOI) {
    const ds = g[khoa]
    if (!Array.isArray(ds)) continue
    const giu: unknown[] = []
    for (const c of ds) {
      if (c === null || typeof c !== 'object' || Array.isArray(c)) {
        giu.push(c)
        continue
      }
      const cau = c as Record<string, unknown>
      const qid = qidCauTrongGoi(cau, maDe, phan)
      const qidTheoGoi = maGoi && maGoi !== maDe ? qidCauTrongGoi(cau, maGoi, phan) : qid
      let trung = baoVe.has(qid) || baoVe.has(qidTheoGoi)
      if (!trung) {
        const nhom = await nhomNoiDung(cau, maGoi || maDe, qid, phan)
        trung = nhom !== '' && baoVe.has(nhom)
      }
      if (trung) {
        qidBo.add(qid)
        continue
      }
      giu.push(c)
    }
    if (giu.length !== ds.length) g[khoa] = giu
  }
  return qidBo
}
