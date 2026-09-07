// MỘT NGUỒN SỰ THẬT CHO THANH KÉO SỐ CÂU CHỮA — cả con số lẫn câu chữ.
//
// ============================================================================
// VÌ SAO TÁCH RA
// ============================================================================
// Thầy chốt 07/09: "tôi muốn bạn đồng bộ phần rút câu ở đây sang hai chỗ báo
// cáo phụ huynh và học sinh".
//
// Ba chỗ dựng thanh kéo, và chúng KHÔNG dùng chung được component:
//
//   · màn thầy (`ThanhSoCauChua`) chạy trong app, dùng token `--cx-*`, `--nhat`;
//   · báo cáo phụ huynh / học sinh (`PhieuScreen`) là trang đứng một mình,
//     có bảng màu `--p-*` riêng và lớp `bc-*` riêng.
//
// Nhét component của app vào trang phiếu là kéo theo cả bộ token không tồn tại
// ở đó. Nên tách phần KHÔNG PHẢI GIAO DIỆN — con số và câu chữ — ra đây, hai
// nơi cùng gọi. Skin khác nhau, nội dung không bao giờ lệch.
//
// Lệch nội dung là chuyện đã xảy ra thật: v3 để mỗi màn tự đặt trần nên cùng
// một em, cùng một ca, hai màn ra hai số câu khác nhau và không màn nào nói
// được vì sao.
import type { PoolCauSai, SuatThieu } from './rut-de-chua'
import { tenCauSai } from './rut-de-chua'

export interface SoLieuThanhChua {
  /** Sàn thanh kéo = số câu em sai, kẹp theo số câu thật sự có. */
  san: number
  /** Trần thanh kéo = số câu thật sự rút được. */
  tran: number
  /** Vị trí kim sau khi kẹp vào [san, tran]. */
  n: number
  /** Có nên hiện thanh không: kéo được thì mới hiện. */
  hienThanh: boolean
}

/** Tính sàn – trần – vị trí kim. KHÔNG có `Math.random`, không đọc gì bên ngoài. */
export function soLieuThanhChua(dau: { soCau: number; soCauSai: number; coSan: number }): SoLieuThanhChua {
  const coSan = Math.max(0, Math.floor(Number(dau.coSan) || 0))
  const sai = Math.max(0, Math.floor(Number(dau.soCauSai) || 0))
  const tran = Math.max(1, coSan)
  // Sàn = số câu em sai. Kho không đủ hàng thì tụt theo kho — không hứa cái
  // không có. Chưa biết em sai mấy câu thì sàn là 1, để thanh vẫn kéo được.
  const san = Math.max(1, Math.min(sai || 1, tran))
  const n = Math.min(Math.max(san, Math.floor(Number(dau.soCau) || 0)), tran)
  return { san, tran, n, hienThanh: coSan > san }
}

/** Câu nói TRẦN VÀ SÀN TỪ ĐÂU RA. Không có câu này thì hai con số là số trên
 * trời và thầy không kiểm được. */
export function cauGiaiThichThanh(dau: {
  tongUngVien: number
  soCauSai: number
  san: number
  /** Số câu phiếu này MANG SẴN. Nhỏ hơn `tongUngVien` ở báo cáo phụ huynh: gói
   * chỉ chở được một phần kho. */
  coSan?: number
  choBac2?: boolean
  /** Xưng hô: `em` cho báo cáo học sinh và màn thầy, `con` cho phụ huynh. */
  xung?: 'em' | 'con'
}): string {
  const xung = dau.xung ?? 'em'
  const co = dau.coSan
  const phanKho = `Kho có ${dau.tongUngVien} câu cùng dạng với ${dau.soCauSai} câu ${xung} sai${dau.choBac2 ? ' (đã tính thêm câu cùng cơ chế)' : ''}.`
  // Gói mang sẵn ít hơn kho thì phải nói ra, nếu không phụ huynh thấy trần 60
  // trong khi dòng trên ghi 103 và không hiểu vì sao.
  const phanGoi = co !== undefined && co < dau.tongUngVien ? ` Phiếu này mang sẵn ${co} câu.` : ''
  const phanSan = dau.soCauSai > 0 ? ` Ít nhất ${dau.san} câu — đúng bằng số câu ${xung} làm sai.` : ''
  return phanKho + phanGoi + phanSan
}

/** Câu cảnh báo những câu sai kho không có gì để chữa. Rỗng khi không có câu
 * nào như vậy. */
export function cauCanhBaoHetHang(pool: PoolCauSai[] | undefined, xung: 'em' | 'con' = 'em'): string {
  const het = (pool ?? []).filter((p) => p.pool === 0)
  if (het.length === 0) return ''
  const ds = het.map((p) => tenCauSai(p.phan, p.soCau)).join(' · ')
  return `Kho chưa có câu cùng dạng để chữa: ${ds}. Những câu này đưa lại chính đề ${xung} làm sai để ${xung} làm lại.`
}

/** Dòng lý do khi KHÔNG rút được câu nào. */
export function cauKhongRutDuoc(thieu: SuatThieu[] | undefined): string[] {
  const ds = (thieu ?? []).slice(0, 6).map((t) => t.vi)
  return ds.length > 0 ? ds : ['Ca này chưa có câu nào sai.']
}
