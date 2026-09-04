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
import { useMemo, useState } from 'react'
import { mergeKeepAnswers, type PublicExamBank, type SoCauMoiPhan, type TeacherExamSource } from '../data/examContent'
import { assignStudentQuestions } from '../lib/exam-assign'
import { cauLuyenTuBoCau, cauLuyenTuNguon } from '../lib/bai-tap-pdf'
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
  /** Em trong ca — để tải ĐÚNG bộ câu máy đã gán cho từng em khi ca cắt bớt. */
  dsEm?: { sbd: string; hoTen: string }[] | null
  showToast: (chu: string, kieu?: 'success' | 'error' | 'warn') => void
}

export default function NutTaiDeCa({ banks, maCa, tenCa, ghiChu, soCauCa, dsEm, showToast }: NutTaiDeCaProps) {
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

  // ĐỀ CỦA MỘT EM — sửa lỗi thầy báo 04-09: thẻ ghi "ca 28 câu" mà bấm Xem đề
  // ra 147 câu. Cả hai con số đều thật, nhưng thứ thầy cần in ra là 28 câu em
  // làm, không phải cả kho.
  //
  // Ca không cắt bớt thì mọi em nhận trọn kho, một tệp là xong. Ca có cắt thì
  // MỖI EM MỘT BỘ KHÁC NHAU, không có "đề của ca" nào cả — nên phải chọn em.
  // Bộ câu dựng lại bằng đúng hàm máy đã gán lúc thi (`assignStudentQuestions`,
  // gieo theo mã ca + SBD) nên trùng khít bài em đã làm, kể cả thứ tự câu.
  const [sbdXem, setSbdXem] = useState('')
  const [tim, setTim] = useState('')
  const emCoThe = caCatBot ? (dsEm ?? []).filter((e) => e.sbd) : []
  // GÕ SBD HOẶC TÊN LÀ RA EM ĐÓ. Lớp 100–300 em thì danh sách xổ xuống không
  // dùng được: thầy phải cuộn cả trăm dòng để tìm một em.
  const emLoc = useMemo(() => {
    const q = tim.trim().toLowerCase()
    if (!q) return emCoThe
    return emCoThe.filter((e) => e.sbd.toLowerCase().includes(q) || (e.hoTen || '').toLowerCase().includes(q))
  }, [emCoThe, tim])
  const emDangChon = emCoThe.find((e) => e.sbd === sbdXem) ?? emLoc[0] ?? null

  const goiCuaEm = () => async () => {
    if (!emDangChon) return null
    const kho = mergeKeepAnswers(banks, soCauCa ?? undefined)
    const asg = assignStudentQuestions(kho as unknown as PublicExamBank, maCa, emDangChon.sbd)
    const bo = [
      ...asg.phanI.map((a) => ({ phan: 'I' as const, q: a.question })),
      ...asg.phanII.map((a) => ({ phan: 'II' as const, q: a.question })),
      ...asg.phanIII.map((a) => ({ phan: 'III' as const, q: a.question })),
    ]
    const cau = cauLuyenTuBoCau(bo as never)
    if (cau.length === 0) {
      showToast('Không dựng được đề của em này', 'error')
      return null
    }
    const cd = [...new Set(cau.map((c) => c.chuyenDe).filter(Boolean))]
    return {
      tt: {
        hoTen: emDangChon.hoTen || `SBD ${emDangChon.sbd}`,
        sbd: emDangChon.sbd,
        ngay: new Date(),
        tenChuyenDe: cd.length === 1 ? cd[0] : tenCa || 'Hoá học',
        ketQua: '',
        hienDapAn: true,
        nhanBia: 'Đề riêng của em, kèm lời giải',
        oBia: [
          { nhan: 'Học sinh', gia: emDangChon.hoTen || `SBD ${emDangChon.sbd}` },
          { nhan: 'SBD', gia: emDangChon.sbd },
          { nhan: 'Bài kiểm tra', gia: tenCa || `Ca ${maCa}` },
          { nhan: 'Mã ca', gia: maCa },
          { nhan: 'Số câu', gia: `${cau.length} câu` },
        ],
      },
      cau,
      maCa,
      sbd: emDangChon.sbd,
    }
  }

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
        <div className="flex flex-col" style={{ gap: 'var(--k2)' }}>
          <div style={NHAN_NHO}>
            Ca này cắt <b style={{ color: 'var(--muc)' }}>{moiEm} câu</b> cho mỗi em (I {soCauCa?.I} · II {soCauCa?.II} · III {soCauCa?.III}) từ kho{' '}
            <b style={{ color: 'var(--muc)' }}>{tongKho} câu</b>, <b style={{ color: 'var(--muc)' }}>mỗi em một bộ khác nhau</b> — nên không có một "đề của ca" chung. Chọn em để lấy đúng {moiEm} câu em đó làm.
          </div>
          {emCoThe.length > 0 ? (
            <>
              <div className="font-bold" style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', color: 'var(--muc)' }}>
                Đề riêng của một em · {moiEm} câu
              </div>
              <input
                value={tim}
                onChange={(e) => {
                  setTim(e.target.value)
                  setSbdXem('')
                }}
                placeholder="Gõ SBD hoặc tên em"
                aria-label="Tìm em theo số báo danh hoặc tên"
                style={{ height: 44, borderRadius: 'var(--bo-1)', padding: '0 var(--k3)', background: 'var(--the-2)', border: '1.5px solid transparent', fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', color: 'var(--muc)', width: '100%', outline: 'none' }}
              />
              {emLoc.length === 0 ? (
                <div style={NHAN_NHO}>Không có em nào khớp "{tim.trim()}".</div>
              ) : (
                <div className="flex flex-col" style={{ gap: 4, maxHeight: 208, overflowY: 'auto' }}>
                  {emLoc.slice(0, 40).map((e) => {
                    const chon = emDangChon?.sbd === e.sbd
                    return (
                      <button
                        key={e.sbd}
                        type="button"
                        onClick={() => setSbdXem(e.sbd)}
                        className="tap-target text-left"
                        style={{
                          minHeight: 40,
                          padding: '6px var(--k3)',
                          borderRadius: 'var(--bo-1)',
                          background: chon ? 'var(--phu)' : 'var(--the-2)',
                          border: chon ? '1.5px solid var(--muc)' : '1.5px solid transparent',
                          color: 'var(--muc)',
                          fontFamily: 'var(--sans)',
                          fontSize: 'var(--cx-2)',
                        }}
                      >
                        {e.hoTen || '(chưa có tên)'} <span style={{ ...NHAN_NHO, fontVariantNumeric: 'tabular-nums' }}>· SBD {e.sbd}</span>
                      </button>
                    )
                  })}
                  {emLoc.length > 40 && <div style={NHAN_NHO}>Còn {emLoc.length - 40} em nữa — gõ thêm để lọc hẹp lại.</div>}
                </div>
              )}
              {emDangChon && (
                <NutPhieuHtml
                  key={emDangChon.sbd}
                  dungGoi={goiCuaEm()}
                  nhanXem={`Tải đề của ${emDangChon.hoTen || `SBD ${emDangChon.sbd}`} (${moiEm} câu)`}
                  showToast={showToast}
                />
              )}
            </>
          ) : (
            <div style={NHAN_NHO}>Chưa em nào vào ca nên chưa dựng được đề riêng. Bên dưới là cả kho của ca.</div>
          )}
        </div>
      )}
      {chon.map((o) => (
        <div key={o.khoa} className="flex flex-col" style={{ gap: 'var(--k2)' }}>
          <div className="font-bold" style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', color: 'var(--muc)' }}>
            {caCatBot ? 'Cả kho của ca · ' : `${o.ten} · `}
            {o.soCau} câu
          </div>
          <NutPhieuHtml dungGoi={goiCua(o)} nhanXem="Xem đề" showToast={showToast} />
        </div>
      ))}
    </div>
  )
}
