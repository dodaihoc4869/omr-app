// TẢI ĐỀ + LỜI GIẢI CỦA MỘT CA THÀNH PDF.
//
// Hai chỗ dùng:
//   · Chi tiết ca — tải trọn kho của ca, hoặc từng đề gốc nếu ca ghép nhiều đề.
//   · Màn "Đã nộp bài" của học sinh — tải ĐÚNG bộ câu em vừa làm.
//
// Cả hai đi qua đúng một bộ dựng (`tai-phieu-pdf.ts`) nên phiếu bài tập, đề ca
// và đề riêng từng em không bao giờ ra ba kiểu khác nhau.
//
// KHÔNG có chế độ "chỉ đề, giấu đáp án": mẫu thầy chốt là bản ôn — trang đề tô
// sẵn phương án đúng kèm câu chốt, rồi tới trang Lời giải chi tiết. Muốn phát
// cho em làm thì dùng nút Phiếu bài tập trong hồ sơ em.
import { useMemo, useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import type { TeacherExamSource } from '../data/examContent'
import { cauLuyenTuNguon } from '../lib/bai-tap-pdf'

const NHAN_NHO: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }

function tenTep(phan: string, ma: string): string {
  const sach = (phan || 'de')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `de-${sach}-${ma}.pdf`
}

export interface NutTaiDeCaProps {
  /** Ngân hàng CÓ đáp án của ca. */
  banks: TeacherExamSource[]
  /** Mã ca, dùng đặt tên tệp. */
  maCa: string
  tenCa?: string
  /** Dòng nhỏ in ở bìa (vd "Lớp 12A1 · 28 câu"). */
  ghiChu?: string
  showToast: (chu: string, kieu?: 'success' | 'error' | 'warn') => void
}

export default function NutTaiDeCa({ banks, maCa, tenCa, ghiChu, showToast }: NutTaiDeCaProps) {
  const [dang, setDang] = useState('')
  // Ca ghép từ nhiều đề gốc thì cho thầy chọn tải từng đề — kho 147 câu in ra
  // là tập giấy dày, mà thường thầy chỉ cần đúng một bài.
  const chon = useMemo(() => {
    const ra: { khoa: string; ten: string; nguon: TeacherExamSource[]; soCau: number }[] = []
    const tong = banks.reduce((n, s) => n + s.phanI.length + s.phanII.length + s.phanIII.length, 0)
    if (banks.length !== 1) ra.push({ khoa: '__ca', ten: 'Cả ca', nguon: banks, soCau: tong })
    for (const s of banks) ra.push({ khoa: s.maDe, ten: `Mã ${s.maDe}`, nguon: [s], soCau: s.phanI.length + s.phanII.length + s.phanIII.length })
    return ra
  }, [banks])

  const tai = async (o: (typeof chon)[number]) => {
    setDang(o.khoa)
    try {
      const cau = cauLuyenTuNguon(o.nguon)
      if (cau.length === 0) throw new Error('Đề này không có câu nào')
      const { dungPhieuHtml, phieuThanhPdf, taiTep } = await import('../lib/tai-phieu-pdf')
      const cd = [...new Set(cau.map((c) => c.chuyenDe).filter(Boolean))]
      const kq = await dungPhieuHtml(
        {
          hoTen: tenCa || `Ca ${maCa}`,
          sbd: maCa,
          ngay: new Date(),
          tenChuyenDe: cd.length === 1 ? cd[0] : o.ten,
          ketQua: ghiChu || `${cau.length} câu`,
          hienDapAn: true,
        },
        cau,
      )
      const ten = tenTep(o.ten, maCa)
      taiTep(await phieuThanhPdf(kq.html), ten)
      showToast(`Đã tải ${ten} (${kq.soTrang} trang)`, 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không tạo được đề PDF', 'error')
    } finally {
      setDang('')
    }
  }

  if (chon.length === 0) return null

  return (
    <div className="flex flex-col" style={{ gap: 'var(--k2)' }}>
      <div style={NHAN_NHO}>Đề bài kèm lời giải chi tiết, đúng mẫu phiếu của Thầy Đỗ Đại Học.</div>
      <div className="flex flex-wrap" style={{ gap: 'var(--k2)' }}>
        {chon.map((o) => (
          <button
            key={o.khoa}
            type="button"
            onClick={() => void tai(o)}
            disabled={!!dang}
            className="tap-target inline-flex items-center font-bold"
            style={{
              gap: 6,
              minHeight: 44,
              padding: '0 var(--k4)',
              borderRadius: 'var(--bo-1)',
              background: 'var(--the-2)',
              color: 'var(--muc)',
              fontFamily: 'var(--sans)',
              fontSize: 'var(--cx-1)',
              opacity: dang && dang !== o.khoa ? 0.5 : 1,
            }}
          >
            {dang === o.khoa ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
            {dang === o.khoa ? 'Đang dựng…' : `${o.ten} · ${o.soCau} câu`}
          </button>
        ))}
      </div>
    </div>
  )
}
