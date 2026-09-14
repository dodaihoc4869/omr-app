// KHO ĐỀ CHO MÁY HỌC SINH — MÁY CHỦ RÚT HỘ, KHÔNG ĐẨY CẢ KHO XUỐNG MÁY EM.
//
// Thầy chốt 14/09: "Bạn phải đồng bộ sang máy học sinh."
//
// VÌ SAO TRƯỚC ĐÓ KHÔNG CHẠY. Màn Khắc phục câu sai rút câu luyện thêm từ
// `loadExamSources()` — kho đề nằm trong IndexedDB của CHÍNH MÁY ĐANG MỞ. Kho
// ấy chỉ do `dongBoNganHang` nạp, mà hàm ấy đòi mã bí mật của thầy (xem
// `src/lib/exam-sync.ts`). Máy em không có mã ⇒ kho LUÔN rỗng ⇒ "Tỷ lệ tối đa:
// 0 câu".
//
// VÌ SAO KHÔNG ĐẨY CẢ KHO XUỐNG. Kho có 157 tờ, 4,3 GB, và có đáp án. Chép nó
// vào máy mọi em là vừa nặng vừa lộ đề.
//
// ĐƯỜNG ĐÚNG: máy chủ rút hộ. Em gửi lên chuyên đề của những câu mình vừa sai,
// máy chủ trả về gói câu ĐÚNG CHUYÊN ĐỀ ẤY (`cauKhacPhuc`, lệnh của học sinh,
// không cần mã bí mật), rồi máy em tự lọc theo MÃ DẠNG bằng chính thuật toán
// đang chạy trên máy thầy. Đo thật 14/09 với ca Test6: 1 gói · 395 KB · 0,44
// giây · 175 câu · 19 mã dạng.
//
// Gói máy chủ trả về đi qua ĐÚNG cửa nạp của kho đề (`parseKhoDeJson` →
// `buildTeacherSourceFromKhoDe`) — không nới một luật nào: câu thiếu phương án
// hay thiếu đáp án thì bỏ, không dựng phiếu với ô trống rồi để em ngồi đoán.
import type { TeacherExamSource } from '../data/examContent'
import { cauKhacPhuc } from './exam-api'
import { parseKhoDeJson, buildTeacherSourceFromKhoDe } from './exam-kho-de-import'
import { layIdThietBi } from './thiet-bi'

/** Một câu sai, đủ thứ cần để xin kho: chuyên đề để tìm, qid để khỏi phát lại. */
export interface CauSaiXinKho {
  qid?: string
  chuyenDe?: string
  maCa?: string
}

export interface KetQuaNapKho {
  nguon: TeacherExamSource[]
  /** Chuyên đề đã hỏi — rỗng nghĩa là câu sai không câu nào có chuyên đề. */
  chuyenDe: string[]
  /** Vì sao không có gì — để màn hình nói thẳng, không im lặng trả mảng rỗng. */
  loi: string
}

/** Số câu xin máy chủ. Máy chủ chặn trần 60 và gom tối đa 8 tờ đề; xin cao là
 * để VÙNG CHỌN rộng, còn rút bao nhiêu thì màn hình quyết sau. */
export const SO_CAU_XIN_KHO = 60

/**
 * Xin máy chủ gói câu cùng chuyên đề với các câu em vừa sai.
 *
 * KHÔNG NÉM LỖI. Máy em mất mạng giữa chừng là chuyện thường; chỗ gọi chỉ cần
 * biết "có kho hay không" và "vì sao không", chứ không nên vỡ cả màn hình.
 */
export async function napKhoChoMayEm(
  scriptUrl: string,
  sbd: string,
  dsCauSai: CauSaiXinKho[],
  soCau: number = SO_CAU_XIN_KHO,
): Promise<KetQuaNapKho> {
  const chuyenDe = [...new Set(dsCauSai.map((c) => String(c.chuyenDe ?? '').trim()).filter(Boolean))]
  if (chuyenDe.length === 0) {
    return { nguon: [], chuyenDe: [], loi: 'Các câu sai chưa gắn chuyên đề nên chưa tìm được câu cùng dạng.' }
  }
  if (!sbd.trim()) return { nguon: [], chuyenDe, loi: 'Thiếu số báo danh nên chưa xin được kho.' }

  const maCa = String(dsCauSai.find((c) => c.maCa)?.maCa ?? '')
  const loaiTru = dsCauSai.map((c) => String(c.qid ?? '')).filter(Boolean)

  try {
    const kq = await cauKhacPhuc(scriptUrl, maCa, sbd.trim(), layIdThietBi(), chuyenDe, loaiTru, soCau)
    const nguon: TeacherExamSource[] = []
    for (const m of kq.nguon) {
      const doc = parseKhoDeJson(m.json)
      if (!doc.ok || !doc.json) continue
      const dung = buildTeacherSourceFromKhoDe(doc.json)
      if (dung.errors.length === 0) nguon.push(dung.source)
    }
    if (nguon.length === 0) {
      return { nguon: [], chuyenDe, loi: 'Kho trên máy chủ chưa có tờ đề nào thuộc chuyên đề em vừa sai.' }
    }
    return { nguon, chuyenDe, loi: '' }
  } catch (e) {
    // Nói ĐÚNG câu lỗi của máy chủ, đừng nuốt rồi báo chung chung.
    return { nguon: [], chuyenDe, loi: e instanceof Error ? e.message : 'Không xin được kho từ máy chủ.' }
  }
}
