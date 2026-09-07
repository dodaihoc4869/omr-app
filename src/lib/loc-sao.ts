// LỌC THEO SAO — thầy chốt 07/09: "tất cả chỗ rút đề thêm lựa chọn câu 2 sao
// (khó) 1 sao (bản chất) nữa nhé".
//
// ============================================================================
// SAO LÀ GÌ, VÀ VÌ SAO NÓ KHÁC HẲN LÝ THUYẾT / BÀI TẬP
// ============================================================================
// `can_chua.sao` do pipeline nạp đề gắn (xem `claude/GAN-SAO-CAN-CHUA.md`), nói
// câu này ĐÁNG CHỮA tới mức nào — không nói nó khó hay dễ về mặt tính toán:
//
//   2 sao — câu KHÓ, có bẫy cụ thể em hay mắc;
//   1 sao — câu BẢN CHẤT, thuần thông hiểu, sai câu này là hổng nền;
//   0 sao — câu thường, không nằm trong diện phải chữa.
//
// Nên nó ĐỘC LẬP với `kieu` (lý thuyết / bài tập): một câu vừa là bài tập vừa
// 2 sao là chuyện bình thường. Hai bộ lọc chồng nhau, không thay nhau.
//
// ============================================================================
// MỘT NGUỒN SỰ THẬT
// ============================================================================
// Mọi màn rút câu phải lọc bằng đúng file này. Màn nào tự viết
// `c.sao === 2` là chỗ đó sẽ lệch khi luật đổi — đúng cái bẫy `dangCua` đã
// dính khi kho đổi tên trường `dang` thành `kieu`.
//
// SỐ ĐO KHO THẬT 07/09 (2.520 câu):
//
//                     toàn kho    dùng làm câu chữa được
//   2 sao (khó)            525                       406
//   1 sao (bản chất)       755                       608
//   0 sao                1.240                     1.005
//
// Cả hai mức đều đủ hàng, nên hai nút lọc này không phải nút chết.

/** Lựa chọn của thầy / phụ huynh ở mọi màn rút câu. */
export type LocSao = 'moi' | 'sao_2' | 'sao_1'

export const TEN_LOC_SAO: Record<LocSao, string> = {
  moi: 'Mọi mức',
  sao_2: '2 sao · khó',
  sao_1: '1 sao · bản chất',
}

/** Nhãn ngắn cho màn hẹp (báo cáo phụ huynh trên điện thoại 360px).
 *
 * VẪN PHẢI NÓI NGHĨA. Bản đầu rút còn "2 sao" / "1 sao" cho gọn, thầy bắt được
 * ngay 07/09: phụ huynh không biết sao là gì, hai nút thành hai con số vô nghĩa. */
export const TEN_LOC_SAO_NGAN: Record<LocSao, string> = {
  moi: 'Mọi mức',
  sao_2: '2 sao khó',
  sao_1: '1 sao bản chất',
}

export const MOI_LOC_SAO: LocSao[] = ['moi', 'sao_2', 'sao_1']

/** Mặc định KHÔNG lọc. Lọc sẵn là âm thầm bỏ mất phần lớn kho mà không ai bấm
 * gì — thầy phải chủ động chọn thì mới hẹp lại. */
export const LOC_SAO_MAC_DINH: LocSao = 'moi'

/** Câu này có lọt bộ lọc sao đang chọn không. */
export function hopSao(sao: number | undefined, loc: LocSao): boolean {
  if (loc === 'moi') return true
  const s = Number(sao) || 0
  return loc === 'sao_2' ? s === 2 : s === 1
}

/** Đếm từng mức để màn hình hiện thẳng ba con số, thay vì để thầy bấm rồi mới
 * biết nút đó rỗng. */
export function demSao(ds: { sao?: number }[]): Record<'sao0' | 'sao1' | 'sao2', number> {
  const ra = { sao0: 0, sao1: 0, sao2: 0 }
  for (const c of ds) {
    const s = Number(c.sao) || 0
    if (s === 2) ra.sao2 += 1
    else if (s === 1) ra.sao1 += 1
    else ra.sao0 += 1
  }
  return ra
}

/** Còn bao nhiêu câu dùng được cho một lựa chọn — để màn hình báo TRƯỚC khi rút. */
export function soCauHopSao(dem: Record<'sao0' | 'sao1' | 'sao2', number>, loc: LocSao): number {
  if (loc === 'sao_2') return dem.sao2
  if (loc === 'sao_1') return dem.sao1
  return dem.sao0 + dem.sao1 + dem.sao2
}
