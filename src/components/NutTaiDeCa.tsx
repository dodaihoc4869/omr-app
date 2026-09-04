// XEM / CHIA SẺ ĐỀ + LỜI GIẢI CỦA MỘT CA.
//
// Hai chỗ dùng:
// Chi tiết ca: xem trọn kho của ca, hoặc từng đề gốc nếu ca ghép nhiều đề.
//
// Cả hai đi qua đúng một bộ dựng (`tai-phieu-pdf.ts`) nên phiếu bài tập, đề ca
// và đề riêng từng em không bao giờ ra ba kiểu khác nhau.
//
// KHÔNG cần chế độ "chỉ đề, giấu đáp án" nữa: phiếu mở ra là thấy đề trần,
// đáp án và lời giải nằm gập trong từng câu, bấm mới hiện. Một tệp dùng được
// cả lúc phát cho em làm lẫn lúc thầy dò bài.
import { useMemo } from 'react'
import type { TeacherExamSource } from '../data/examContent'
import { cauLuyenTuNguon } from '../lib/bai-tap-pdf'
import NutPhieuHtml from './NutPhieuHtml'

const NHAN_NHO: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }

export interface NutTaiDeCaProps {
  /** Ngân hàng CÓ đáp án của ca. */
  banks: TeacherExamSource[]
  /** Mã ca. */
  maCa: string
  tenCa?: string
  /** Dòng nhỏ in ở bìa (vd "Lớp 12A1 · 28 câu"). */
  ghiChu?: string
  showToast: (chu: string, kieu?: 'success' | 'error' | 'warn') => void
}

export default function NutTaiDeCa({ banks, maCa, tenCa, ghiChu, showToast }: NutTaiDeCaProps) {
  // Ca ghép từ nhiều đề gốc thì cho thầy chọn tải từng đề — kho 147 câu in ra
  // là tập giấy dày, mà thường thầy chỉ cần đúng một bài.
  const chon = useMemo(() => {
    const ra: { khoa: string; ten: string; nguon: TeacherExamSource[]; soCau: number }[] = []
    const tong = banks.reduce((n, s) => n + s.phanI.length + s.phanII.length + s.phanIII.length, 0)
    if (banks.length !== 1) ra.push({ khoa: '__ca', ten: 'Cả ca', nguon: banks, soCau: tong })
    for (const s of banks) ra.push({ khoa: s.maDe, ten: `Mã ${s.maDe}`, nguon: [s], soCau: s.phanI.length + s.phanII.length + s.phanIII.length })
    return ra
  }, [banks])

  const goiCua = (o: (typeof chon)[number]) => async () => {
    const cau = cauLuyenTuNguon(o.nguon)
    if (cau.length === 0) {
      showToast('Đề này không có câu nào', 'error')
      return null
    }
    const cd = [...new Set(cau.map((c) => c.chuyenDe).filter(Boolean))]
    return {
      tt: {
        hoTen: tenCa || `Ca ${maCa}`,
        sbd: maCa,
        ngay: new Date(),
        tenChuyenDe: cd.length === 1 ? cd[0] : o.ten,
        ketQua: ghiChu || `${cau.length} câu`,
        hienDapAn: true,
      },
      cau,
      maCa,
    }
  }

  if (chon.length === 0) return null

  return (
    <div className="flex flex-col" style={{ gap: 'var(--k4)' }}>
      <div style={NHAN_NHO}>Đề bài kèm lời giải chi tiết, đúng mẫu phiếu của Thầy Đỗ Đại Học.</div>
      {chon.map((o) => (
        <div key={o.khoa} className="flex flex-col" style={{ gap: 'var(--k2)' }}>
          <div className="font-bold" style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', color: 'var(--muc)' }}>
            {o.ten} · {o.soCau} câu
          </div>
          <NutPhieuHtml dungGoi={goiCua(o)} nhanXem="Xem đề" showToast={showToast} />
        </div>
      ))}
    </div>
  )
}
