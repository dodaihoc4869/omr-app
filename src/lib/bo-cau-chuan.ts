// BỘ CÂU CHUẨN CỦA MỘT EM — MỘT hàm quyết định "em này đã nhận những câu nào", dùng chung cho
// chấm điểm, chi tiết từng câu, chấm lại ở máy chủ và công cụ kiểm chấm (thầy 06/10: "không được phép chấm sai cho bất kì bài kiểm tra nào").
//
// VÌ SAO CÓ (đo trong đợt quét chấm điểm 06/10). Trước đây MỖI NƠI tự quyết bộ câu theo một cách riêng:
//   · máy em: `assignment` (đúng thứ em vừa làm) hoặc dựng lại từ bài làm;
//   · máy thầy: `chiTiet.boTheoEmCa` (D1 sống) cho điểm, nhưng `taoChiTietCau` lại tự đổi sang "dựng từ bài làm" khi bài làm lệch luật hash
//     ⇒ điểm tính trên bộ câu này, bảng chi tiết dựng trên bộ câu khác;
//   · máy chủ chấm lại: chỉ đọc bản đồ trong tờ đáp án R2 (bản chụp lúc mở ca), KHÔNG đọc bản đồ D1 sống ⇒ em vào muộn / em thi lại
//     rơi về luật hash và bị chấm theo bộ câu của người khác — rồi GHI ĐÈ điểm đúng.
// Và ở cả ba nơi, `assignStudentQuestions` âm thầm BÙ câu từ kho khi bộ câu thiếu: câu bù em chưa từng thấy bị tính là bỏ trống
// (điểm thấp oan) và còn lọt vào bảng "câu sai".
//
// LUẬT Ở ĐÂY (an toàn trước, không đoán):
//   1. Có bộ câu đã ghi cho em (`boGhi`): dùng ĐÚNG nó. Nhưng
//        · câu nào của bộ KHÔNG còn trong kho đáp án ⇒ LỖI `thieu_trong_kho` (không bù câu khác vào chỗ ấy);
//        · em để lại dấu vết (đã trả lời / đã xem) ở câu NGOÀI bộ ⇒ LỖI `bai_lam_ngoai_bo` (bộ ghi cũ hoặc bài làm của bộ khác —
//          không đoán bộ nào đúng).
//   2. Không có bộ ghi: luật hash như cũ NẾU nó khớp dấu vết; lệch thì dựng từ bài làm (cảnh báo `hash_lech_bai_lam`).
//   3. Lỗi ⇒ chỗ gọi KHÔNG chấm và KHÔNG ghi đè điểm đã có, nói thẳng lý do cho thầy.
// Hàm THUẦN: không mạng, không IndexedDB, không DOM — máy chủ import thẳng được.
import { PHAN_I_NEED, PHAN_II_NEED, PHAN_III_NEED, type PublicExamBank } from '../data/examContent'
import { assignStudentQuestions } from './exam-assign'
import { boCauTuBaiLam, qidDaGap, type DauVetBaiLam, type SoCauMoiPhan } from './bo-cau-tu-bai-lam'

export type NguonBoCau = 'da_ghi' | 'bai_lam' | 'hash'
export type MaLoiBoCau = 'thieu_trong_kho' | 'bai_lam_ngoai_bo'

export interface LoiBoCau {
  ma: MaLoiBoCau
  /** Câu tiếng Việt cho thầy đọc — nêu đúng dữ kiện, không suy diễn. */
  chiTiet: string
  /** Các qid liên quan (đã cắt gọn) để thầy tra. */
  qid: string[]
}

export interface BoCauChuan {
  /** Danh sách qid CHỐT để đưa vào `gradeFromKeyBank` / `taoChiTietCau` (tham số `boCuaEm`). `null` ⇒ ca thường: để luật hash như cũ. */
  qids: string[] | null
  nguon: NguonBoCau
  /** Mã cảnh báo KHÔNG chặn chấm (vd `hash_lech_bai_lam`, `bo_duoc_bu_2`). */
  canhBao: string[]
  /** Có lỗi ⇒ KHÔNG được chấm / không được ghi đè điểm. */
  loi: LoiBoCau | null
}

/** Lỗi ném ra khi chỗ gọi cần ngoại lệ thay vì đọc `loi` (máy chủ chấm lại → `tuChoi`). */
export class LoiBoCauError extends Error {
  readonly ma: MaLoiBoCau
  readonly qid: string[]
  constructor(loi: LoiBoCau) {
    super(loi.chiTiet)
    this.name = 'LoiBoCauError'
    this.ma = loi.ma
    this.qid = loi.qid
  }
}

/** Ngân hàng chỉ cần đủ để rút bộ câu: kho ba phần + số câu mỗi phần (+ bản đồ đề riêng nếu có). */
export type KhoChoBoCau = PublicExamBank

const TOI_DA_QID_NEU = 6

function cat(ds: readonly string[]): string[] {
  return ds.slice(0, TOI_DA_QID_NEU)
}

/** Số câu mỗi phần mà ca THỰC SỰ chia cho em: `soCau` của ca, thiếu thì luật 18/4/6 cũ (không vượt quá kho). */
export function chiTieuHieuLuc(kho: { phanI: unknown[]; phanII: unknown[]; phanIII: unknown[]; soCau?: SoCauMoiPhan | null }): SoCauMoiPhan {
  const sc = kho.soCau
  const dung = (v: unknown, macDinh: number, n: number) => {
    const x = Number(v)
    return Math.min(Number.isFinite(x) && x > 0 ? Math.floor(x) : macDinh, n)
  }
  return {
    I: dung(sc?.I, PHAN_I_NEED, kho.phanI.length),
    II: dung(sc?.II, PHAN_II_NEED, kho.phanII.length),
    III: dung(sc?.III, PHAN_III_NEED, kho.phanIII.length),
  }
}

/** Bản đồ đề riêng có hai dạng: phẳng `{sbd: [qid…]}` hoặc gói `{bo: {sbd: [qid…]}, lap, dem, …}`. Trả về dạng phẳng, bỏ mọi giá trị không phải mảng chuỗi. */
export function lamPhangBo(raw: unknown): Record<string, string[]> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const r = raw as Record<string, unknown>
  const nguon = r.bo && typeof r.bo === 'object' && !Array.isArray(r.bo) ? (r.bo as Record<string, unknown>) : r
  const ra: Record<string, string[]> = {}
  for (const [sbd, v] of Object.entries(nguon)) {
    if (Array.isArray(v) && v.length > 0 && v.every((q) => typeof q === 'string' && q !== '')) ra[sbd] = v as string[]
  }
  return ra
}

/** Hợp hai bản đồ: `moi` THẮNG `cu` theo từng em (D1 sống ghi đè bản chụp trong tờ đáp án). */
export function hopNhatBo(cu: unknown, moi: unknown): Record<string, string[]> {
  return { ...lamPhangBo(cu), ...lamPhangBo(moi) }
}

/**
 * BỘ CÂU CHUẨN của một em.
 *
 * @param kho    kho CÓ ĐÁP ÁN của ca (hoặc kho công khai — chỉ cần `id`), kèm `soCau`.
 * @param boGhi  bộ câu đã GHI cho em (D1 sống ưu tiên, rồi bản đồ trong tờ đáp án, rồi `assignment` máy em đã làm); rỗng/thiếu ⇒ không có.
 * @param dauVet bài làm + giây từng câu của em (dấu vết em ĐÃ gặp câu nào).
 */
export function giaiBoCauEm(
  kho: KhoChoBoCau,
  maCa: string,
  sbd: string,
  dauVet: { dapAn?: DauVetBaiLam | null; giayCau?: Record<string, unknown> | null },
  boGhi?: readonly string[] | null,
): BoCauChuan {
  const idKho = new Set<string>([...kho.phanI, ...kho.phanII, ...kho.phanIII].map((q) => q.id))
  // Chỉ xét dấu vết ở câu CÓ trong kho: khoá lạ trong `giayCau` (không phải qid) không đủ để kết luận gì.
  const dau = [...qidDaGap(dauVet.dapAn, dauVet.giayCau)].filter((q) => idKho.has(q))

  if (boGhi && boGhi.length > 0) {
    const thieu = boGhi.filter((q) => !idKho.has(q))
    if (thieu.length > 0) {
      return {
        qids: null,
        nguon: 'da_ghi',
        canhBao: [],
        loi: {
          ma: 'thieu_trong_kho',
          chiTiet: `Bộ câu của em có ${thieu.length} câu không còn trong kho đáp án của ca (${cat(thieu).join(', ')}) — không chấm để khỏi bù câu khác vào chỗ ấy.`,
          qid: cat(thieu),
        },
      }
    }
    const trongBo = new Set(boGhi)
    const ngoai = dau.filter((q) => !trongBo.has(q))
    if (ngoai.length > 0) {
      return {
        qids: null,
        nguon: 'da_ghi',
        canhBao: [],
        loi: {
          ma: 'bai_lam_ngoai_bo',
          chiTiet: `Em có dấu vết làm ${ngoai.length} câu nằm ngoài bộ câu đã giao (${cat(ngoai).join(', ')}) — bộ câu đã ghi và bài làm không khớp nhau, không tự đoán bộ nào đúng.`,
          qid: cat(ngoai),
        },
      }
    }
    const canhBao: string[] = []
    // Bộ ghi thiếu so với chỉ tiêu thì `assignStudentQuestions` bù câu từ kho — nói ra, không giấu.
    const asg = assignStudentQuestions({ ...kho, boTheoEm: { [sbd]: [...boGhi] } }, maCa, sbd)
    const them = [...asg.phanI, ...asg.phanII, ...asg.phanIII].filter((a) => !trongBo.has(a.qid)).length
    if (them > 0) canhBao.push(`bo_duoc_bu_${them}`)
    return { qids: [...boGhi], nguon: 'da_ghi', canhBao, loi: null }
  }

  // Không có bộ ghi: luật hash NẾU nó khớp dấu vết.
  const asgHash = assignStudentQuestions({ ...kho, boTheoEm: undefined }, maCa, sbd)
  const trongHash = new Set([...asgHash.phanI, ...asgHash.phanII, ...asgHash.phanIII].map((a) => a.qid))
  if (dau.every((q) => trongHash.has(q))) return { qids: null, nguon: 'hash', canhBao: [], loi: null }

  // Hash lệch dấu vết (ca đề riêng mất bản đồ, hoặc kho đã đổi) ⇒ dựng từ bài làm, bù cho đủ chỉ tiêu.
  const qids = boCauTuBaiLam(kho, maCa, sbd, dauVet.dapAn, dauVet.giayCau, chiTieuHieuLuc(kho))
  const canhBao = ['hash_lech_bai_lam']
  const them = qids.filter((q) => !dau.includes(q)).length
  if (them > 0) canhBao.push(`bo_duoc_bu_${them}`)
  return { qids, nguon: 'bai_lam', canhBao, loi: null }
}
