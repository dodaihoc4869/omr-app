// Nhãn tiếng Việt của app phụ huynh mới (khoá bằng test): mã từ máy chủ → chữ cho người đọc. Không có chữ về game; nguồn game hiện là "Luyện dạng con còn vấp".
import type { CaGanNhat, LyDoChe, MocThoiGian, NguonHien, TenBac } from '../../lib/ph-moi/du-lieu'

export const NHAN_NGUON: Record<NguonHien, string> = {
  on_lai: 'Ôn lại câu đến lịch',
  btvn: 'Bài tập về nhà',
  thu_thach_rieng: 'Thử thách riêng hôm nay',
  luyen_dang_vap: 'Luyện dạng con còn vấp',
  gia_dinh_giao: 'Gói gia đình giao',
  ca_kiem_tra: 'Ca kiểm tra',
  len_bang: 'Lên bảng',
  khac_phuc: 'Khắc phục câu sai',
  luyen_de: 'Luyện đề',
}
export const NHAN_BAC: Record<TenBac, string> = { biet: 'Biết', hieu: 'Hiểu', van_dung: 'Vận dụng' }
export const TEN_BAC_SO = ['Biết', 'Hiểu', 'Vận dụng'] as const
export const CHU_CHE: Record<LyDoChe, string> = {
  chua_nop: 'Con đã làm · kết quả hiện sau khi con nộp bài',
  chua_cong_bo: 'Con đã làm · kết quả hiện sau khi Thầy công bố điểm',
}
/** "Chưa công bố" (lọc) gồm cả hai lý do che. */
export const chuMocChe = (che: LyDoChe): string => (che === 'chua_nop' ? 'chưa nộp bài' : 'chờ Thầy công bố')

/** Tên mốc trên dòng thời gian: tên máy chủ ghép sẵn (ca, tên bài) nếu có, không thì nhãn theo nguồn; ôn lại/gói thêm số câu. */
export function tenMoc(m: Pick<MocThoiGian, 'nguon' | 'ten' | 'soCau'>): string {
  if (m.nguon === 'btvn' && m.ten) return `Bài tập về nhà “${m.ten.replace(/^Bài tập về nhà\s*[-–:·]?\s*/i, '') || m.ten}”`
  if (m.nguon === 'on_lai' && m.soCau) return `Ôn lại ${m.soCau} câu đến lịch`
  if (m.ten && (m.nguon === 'ca_kiem_tra' || m.nguon === 'gia_dinh_giao')) return m.ten
  return NHAN_NGUON[m.nguon]
}
export function chuCongBoCa(c: Pick<CaGanNhat, 'congBo'>): string {
  const cb = c.congBo
  if (cb.congBo === 'ca_lop_xong') {
    const co = cb.soEmDaVao > 0 && cb.soEmDaNop <= cb.soEmDaVao
    return `Điểm hiện khi cả lớp nộp xong${co ? ` (${cb.soEmDaNop}/${cb.soEmDaVao} em đã nộp)` : ''}.`
  }
  return 'Điểm và từng câu sẽ hiện khi Thầy công bố.'
}
