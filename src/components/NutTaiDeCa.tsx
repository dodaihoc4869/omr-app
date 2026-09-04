// XEM / CHIA SẺ ĐỀ + LỜI GIẢI CỦA MỘT CA.
//
// Hai chỗ dùng:
// Chi tiết ca: xem trọn kho của ca, hoặc từng đề gốc nếu ca ghép nhiều đề.
//
// Cả hai đi qua đúng một bộ dựng (`html-phieu.ts`) nên phiếu bài tập, đề ca
// và đề riêng từng em không bao giờ ra ba kiểu khác nhau.
//
// KHÔNG cần chế độ "chỉ đề, giấu đáp án" nữa: phiếu mở ra là thấy đề trần,
// đáp án và lời giải nằm gập trong từng câu, bấm mới hiện. Một tệp dùng được
// cả lúc phát cho em làm lẫn lúc thầy dò bài.
import { useMemo } from 'react'
import type { SoCauMoiPhan, TeacherExamSource } from '../data/examContent'
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
  /** Số câu MỖI EM thật sự làm trong ca. Ca mở bằng màn Rút đề thì bằng đúng
   * số câu trong kho của ca; ca mở theo đường cũ thì máy cắt 18/4/6 câu ngẫu
   * nhiên riêng từng em từ kho lớn hơn. */
  soCauCa?: SoCauMoiPhan | null
  showToast: (chu: string, kieu?: 'success' | 'error' | 'warn') => void
}

export default function NutTaiDeCa({ banks, maCa, tenCa, ghiChu, soCauCa, showToast }: NutTaiDeCaProps) {
  // Ca ghép từ nhiều đề gốc thì cho thầy chọn tải từng đề — kho 147 câu in ra
  // là tập giấy dày, mà thường thầy chỉ cần đúng một bài.
  const chon = useMemo(() => {
    const ra: { khoa: string; ten: string; nguon: TeacherExamSource[]; soCau: number }[] = []
    const tong = banks.reduce((n, s) => n + s.phanI.length + s.phanII.length + s.phanIII.length, 0)
    if (banks.length !== 1) ra.push({ khoa: '__ca', ten: 'Cả ca', nguon: banks, soCau: tong })
    for (const s of banks) ra.push({ khoa: s.maDe, ten: `Mã ${s.maDe}`, nguon: [s], soCau: s.phanI.length + s.phanII.length + s.phanIII.length })
    return ra
  }, [banks])

  // SỐ CÂU MỖI EM LÀM, khác số câu trong kho của ca.
  //
  // LỖI ĐÃ DÍNH 04-09: thẻ ghi "Mã 12-C1-B1 · 85 câu" trong khi ca chỉ ra 28
  // câu, thầy đọc là app đếm sai. Thật ra 85 là kho của ca, còn 28 là số câu
  // máy cắt cho mỗi em. Hai con số đều đúng, chỉ là thẻ mới nói một con.
  //
  // Nay nói cả hai, và nói rõ tệp tải về là cái nào — thầy khỏi in nhầm 85 câu
  // khi chỉ cần 28.
  const tongKho = banks.reduce((n, s) => n + s.phanI.length + s.phanII.length + s.phanIII.length, 0)
  const moiEm = soCauCa ? Math.max(0, soCauCa.I) + Math.max(0, soCauCa.II) + Math.max(0, soCauCa.III) : 0
  const caCatBot = moiEm > 0 && moiEm < tongKho

  const goiCua = (o: (typeof chon)[number]) => async () => {
    const cau = cauLuyenTuNguon(o.nguon)
    if (cau.length === 0) {
      showToast('Đề này không có câu nào', 'error')
      return null
    }
    const cd = [...new Set(cau.map((c) => c.chuyenDe).filter(Boolean))]
    // BÌA GỌI ĐÚNG TÊN. Đây là đề của một CA, không phải phiếu của một em: ô
    // đầu là TÊN BÀI KIỂM TRA, không phải tên học sinh; số 6 chữ số là MÃ CA,
    // không phải SBD. Bìa không tự đoán được, chỗ gọi phải khai.
    return {
      tt: {
        hoTen: tenCa || `Ca ${maCa}`,
        sbd: maCa,
        ngay: new Date(),
        tenChuyenDe: cd.length === 1 ? cd[0] : o.ten,
        ketQua: '',
        hienDapAn: true,
        nhanBia: 'Đề kiểm tra kèm lời giải',
        oBia: [
          { nhan: 'Bài kiểm tra', gia: tenCa || `Ca ${maCa}` },
          { nhan: 'Mã ca', gia: maCa },
          ...(ghiChu ? [{ nhan: 'Lớp', gia: ghiChu.replace(/^Lớp\s*/i, '') }] : []),
          ...(chon.length > 1 ? [{ nhan: 'Mã đề', gia: o.ten.replace(/^Mã\s*/i, '') }] : []),
          { nhan: 'Số câu', gia: caCatBot ? `${cau.length} câu trong kho của ca, mỗi em làm ${moiEm} câu` : `${cau.length} câu` },
        ],
      },
      cau,
      maCa,
    }
  }

  if (chon.length === 0) return null

  return (
    <div className="flex flex-col" style={{ gap: 'var(--k4)' }}>
      <div style={NHAN_NHO}>Đề bài kèm lời giải chi tiết, đúng mẫu phiếu của Thầy Đỗ Đại Học.</div>
      {caCatBot && (
        <div style={NHAN_NHO}>
          Ca này cắt <b style={{ color: 'var(--muc)' }}>{moiEm} câu</b> cho mỗi em (I {soCauCa?.I} · II {soCauCa?.II} · III {soCauCa?.III}) từ kho{' '}
          <b style={{ color: 'var(--muc)' }}>{tongKho} câu</b> dưới đây, mỗi em một bộ khác nhau. Tệp tải về là cả kho. Muốn đúng bộ của một em thì mở hồ sơ em đó.
        </div>
      )}
      {chon.map((o) => (
        <div key={o.khoa} className="flex flex-col" style={{ gap: 'var(--k2)' }}>
          <div className="font-bold" style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', color: 'var(--muc)' }}>
            {o.ten} · {o.soCau} câu{caCatBot ? ' trong kho' : ''}
          </div>
          <NutPhieuHtml dungGoi={goiCua(o)} nhanXem="Xem đề" showToast={showToast} />
        </div>
      ))}
    </div>
  )
}
