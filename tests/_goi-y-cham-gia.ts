// TỪ ĐIỂN GIẢ + BẢN SƠ ĐỒ MẪU cho test «Chạm để hiểu đề» (làn B, 26/10). Hàm thật `phatHien`/`theCho` do làn A viết song song —
// ở đây chỉ là bản tạm đủ để kiểm giao diện (không phải luật tô màu thật).
import type { BanSoDo, TheGiaiNghia, VungCham } from '../src/lib/goi-y-cham/kieu'
import type { TuDien } from '../src/components/goi-y-cham/tu-dien'

const MAU: [RegExp, VungCham['loai']][] = [
  [/\d+(?:,\d+)?\s?(?:gam|mL|M|tấn|%)(?![\p{L}])/gu, 'cho'],
  [/Giá trị của m là/g, 'hoi'],
  [/ethyl acetate|NaOH|FeS2|SO2/g, 'chat'],
  [/hoàn toàn|đun nóng|Cô cạn|hiệu suất/g, 'khoa'],
]
export function phatHienGia(chu: string): VungCham[] {
  const ra: VungCham[] = []
  for (const [re, loai] of MAU) for (const m of chu.matchAll(re)) ra.push({ loai, tu: m.index!, den: m.index! + m[0].length, chu: m[0] })
  return ra
}
export function theChoGia(v: VungCham): TheGiaiNghia | null {
  if (v.loai === 'hoi') return null
  if (v.loai === 'cho' && /M$/.test(v.chu)) return { ten: 'M · nồng độ mol', nhan: 'Đơn vị', doan: ['1,5 M đọc là «1,5 mol trên lít».'], congThuc: 'n = C_M × V (V tính bằng lít)', nhoDoi: '1000 mL = 1 L' }
  if (v.loai === 'cho') return { ten: v.chu, nhan: 'Đơn vị', doan: ['Số liệu đề cho.'] }
  if (v.loai === 'chat') return { ten: v.chu === 'NaOH' ? 'sodium hydroxide' : v.chu, nhan: 'Chất', doan: ['Chất trong đề.'], tenCu: 'natri hiđroxit', M: 40 }
  return { ten: v.chu, nhan: 'Từ then chốt', doan: ['Từ quyết định cách làm.'] }
}
export const TU_DIEN_GIA: TuDien = { phatHien: phatHienGia, theCho: theChoGia }

/** Bản sơ đồ bài pyrite (tính xuôi): 1 tấn quặng 8% FeS₂, H = 90% ⇒ m SO₂ = 76,8 kg. */
export const BAN_PYRITE: BanSoDo = {
  qid: 'q-pyrite', phienBan: 1,
  deNoiGi: 'Số mol là tiền. Đổi quặng ra tiền nhà FeS2, chuyển sang nhà SO2 theo dấu nguyên tố S, rồi mua khối lượng SO2.',
  soDo: { nut: [{ tong: '1 tấn quặng', chat: 'FeS_2', soLieu: ['8%'] }, { chat: 'SO_2', soLieu: ['m kg = ?'] }], muiTen: [{ H: 90 }], chieu: 'xuoi' },
  buoc: [{
    ten: 'm',
    thuaSo: [
      { so: '10^6', nghia: '1 tấn quặng = 10^6 gam' },
      { so: '8/100', nghia: 'gam FeS2 (quặng chứa 8%)' },
      { so: '1/120', nghia: 'đổi ra tiền nhà FeS2 = số mol (chia M = 120)' },
      { so: '2', nghia: 'nhà SO2 giàu gấp 2 (bảo toàn S)', denDay: 'tới đây là: số mol SO2' },
      { so: '64', nghia: 'dùng tiền mua gam SO2 (nhân M = 64)' },
      { so: '90/100', nghia: 'bị đánh thuế: tính xuôi × H/100' },
      { so: '1/1000', nghia: 'kg SO2 (đề hỏi theo kg)' },
    ],
    ketQua: '76,8', donVi: 'kg',
  }],
  ketQua: '76,8',
}
export const DE_PYRITE = 'Đốt cháy 1 tấn quặng pyrite chứa 8% FeS2 để sản xuất SO2, hiệu suất quá trình đạt 90%. Khối lượng SO2 thu được là m kg. Giá trị của m là'
export const DE_ESTER = 'Thuỷ phân hoàn toàn 8,8 gam ethyl acetate bằng 100 mL dung dịch NaOH 1,5 M, đun nóng. Cô cạn dung dịch sau phản ứng, thu được m gam chất rắn khan. Giá trị của m là'
