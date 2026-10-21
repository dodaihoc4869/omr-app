// THẺ «EM VÀ CÂU NÀY» (thầy 21/10, bản vẽ docs/ban-ve-hoi-thay-em-2110 — thầy "Tự tối ưu thông minh và hiệu quả nhất": chốt theo đề xuất):
// ngăn gập ngay dưới "Đề câu" trong hộp Hỏi Thầy. Cho em THẤY đúng những gì Thầy (AI) đang xem: các lần làm câu này, phần đã vững, phần đang
// luyện thêm, chỗ chưa đủ lượt để biết, và 1–2 nút hỏi nhanh. Mặc định GẬP; mở ngăn này thì ngăn Đề gập (HopHoiThay giữ trạng thái).
// `em`: undefined = đang tải (giữ chỗ 48 px) · null = lỗi / máy chủ cũ (ẨN hẳn) · có ⇒ vẽ. Chữ theo docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md.
import type { ReactNode } from 'react'
import { ChemText } from '../../lib/chem-format'
import { chuHoa } from './TraLoiThay'
import { cauHoiNhanh, chuMoc, chuPhuKienThuc, gioLan, laDangLam, laLanDau, ngayLan, nhanTomTat, type EmVaCau } from '../../lib/em-va-cau'

// Biểu tượng VIẾT TAY (không nhập lucide-react): biểu tượng mới nhập từ lucide bị Vite dồn vào mảnh biểu tượng dùng chung tải lúc MỞ APP
// (+0,1 KB mọi app). Nét vẽ theo bản vẽ docs/ban-ve-hoi-thay-em-2110 (cùng kiểu nét lucide).
function Hinh({ c, w = 2.2, children }: { c: number; w?: number; children: ReactNode }) {
  return <svg width={c} height={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
}
const HinhEm = () => <Hinh c={20} w={2.1}><circle cx="12" cy="8" r="4.5" /><path d="M4 21a8 8 0 0 1 16 0" /></Hinh>
const HinhDung = ({ c = 14 }: { c?: number }) => <Hinh c={c} w={3}><path d="M20 6 9 17l-5-5" /></Hinh>
const HinhSai = () => <Hinh c={14} w={3}><path d="M18 6 6 18M6 6l12 12" /></Hinh>
const HinhTro = () => <Hinh c={15} w={2.4}><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" /><path d="M9 18h6" /><path d="M10 22h4" /></Hinh>
const HinhLen = () => <Hinh c={16} w={2.6}><path d="m5 12 7-7 7 7" /><path d="M12 19V5" /></Hinh>
const HinhHoi = () => <Hinh c={18}><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /><path d="M8 12h8" /><path d="m13 9 3 3-3 3" /></Hinh>

type Props = { em: EmVaCau | null | undefined; dangLam: boolean; mo: boolean; onMo: (mo: boolean) => void; onHoi: (cau: string) => void; khoa: boolean }

export default function TheEmVaCau({ em, dangLam, mo, onMo, onHoi, khoa }: Props) {
  if (em === null) return null
  if (em === undefined) {
    return (
      <div className="lg-ev" role="status">
        <div className="lg-ev-dau"><span className="lg-ev-hinh" aria-hidden="true"><HinhEm /></span><span className="lg-ev-ten">Em và câu này</span><span className="lg-ev-vach" aria-hidden="true" /><span className="sr-only">Đang tải</span></div>
      </div>
    )
  }
  if (laLanDau(em)) {
    return (
      <div className="lg-ev lg-ev--moi">
        <div className="lg-ev-dau">
          <span className="lg-ev-hinh" aria-hidden="true"><HinhEm /></span><span className="lg-ev-ten">Em và câu này</span>
          <p className="lg-ev-phu">Đây là lần đầu em làm câu này. Em cứ hỏi, Thầy giảng từ đầu.</p>
        </div>
      </div>
    )
  }
  const c = em.cauNay
  const vung = em.kienThuc.filter((k) => k.muc === 'vung')
  const luyen = em.kienThuc.filter((k) => k.muc === 'luyen_them')
  const chuaDu = em.kienThuc.filter((k) => k.muc === 'chua_du' && k.trongCau)
  const nut = (em.hoiNhanh.length ? em.hoiNhanh : ['']).map((ten) => cauHoiNhanh(ten, dangLam))
  const nhomKt = (loai: 'vung' | 'luyen', ds: EmVaCau['kienThuc']) => !ds.length ? null : (
    <section className="lg-ev-nhom" data-loai={loai} aria-label={loai === 'vung' ? 'Phần em đã vững' : 'Phần em đang luyện thêm'}>
      <p className="lg-ev-nhom-dau">{loai === 'vung' ? <HinhDung c={16} /> : <HinhLen />}{loai === 'vung' ? 'Phần em đã vững' : 'Phần em đang luyện thêm'}</p>
      <ul className="lg-ev-ds">
        {ds.map((k) => <li key={k.ten}><span className="ten"><ChemText text={chuHoa(k.ten)} /></span><span className="phu">{chuPhuKienThuc(k)}{!k.trongCau && <span className="lg-ev-the">Cùng dạng</span>}</span></li>)}
      </ul>
    </section>
  )
  const moc = chuMoc(em.mocKienThuc)
  return (
    <details className="lg-ev" open={mo} onToggle={(e) => { if (e.currentTarget.open !== mo) onMo(e.currentTarget.open) }}>
      <summary>
        <span className="lg-ev-hinh" aria-hidden="true"><HinhEm /></span>
        <span className="lg-ev-ten">Em và câu này</span>
        <span className="lg-ev-tom">{nhanTomTat(em)}</span>
      </summary>
      <div className="lg-ev-than">
        <p className="lg-ev-mo-dau">{dangLam ? 'Thầy xem những điều này trước khi gợi hướng, để gợi đúng chỗ em cần.' : 'Thầy xem những điều này trước khi trả lời, để giảng đúng chỗ em cần.'}</p>
        {c && (laDangLam(c) ? (
          <section className="lg-ev-cau" aria-label="Các lần em làm câu này">
            <p className="lg-ev-so"><b>{c.soLan}</b><span>lần em đã làm câu này trước đây</span></p>
            <p className="lg-ev-gan">Kết quả từng lần hiện lại sau khi em trả lời câu này.</p>
          </section>
        ) : (
          <section className="lg-ev-cau" aria-label="Các lần em làm câu này">
            {c.tuLam > 0
              ? <p className="lg-ev-so"><b>{c.tuLamDung}/{c.tuLam}</b><span>lần em tự làm đúng câu này</span></p>
              : <p className="lg-ev-so"><b>{c.lan.length}</b><span>lần em làm câu này, đều có trợ giúp</span></p>}
            {/* Lấy phần tử cuối bằng chỉ số: hàm Array "at" không có trên iPhone cũ iOS 14–15 (tests/khong-cu-phap-may-cu-2109). */}
            <p className="lg-ev-gan">Lần gần nhất: <strong>{c.lan[c.lan.length - 1]!.ketQua ? 'Đúng' : 'Sai'}</strong>{gioLan(c.lan[c.lan.length - 1]!) ? ` · ${gioLan(c.lan[c.lan.length - 1]!)}` : ''}</p>
            <ol className="lg-ev-lan" aria-label="Từng lần làm, từ cũ tới mới">
              {c.lan.map((l, i) => (
                <li key={`${l.luc}-${i}`} data-kq={l.ketQua ? 'dung' : 'sai'} data-tro={l.troGiup || undefined}>
                  <span className="lg-ev-cham">{l.troGiup ? <HinhTro /> : l.ketQua ? <HinhDung /> : <HinhSai />}</span>
                  {ngayLan(l)}<span className="sr-only">: {l.ketQua ? 'Đúng' : 'Sai'}{l.troGiup ? ', có trợ giúp' : ''}</span>
                </li>
              ))}
            </ol>
            {c.coTroGiup > 0 && <p className="lg-ev-chu-giai">Vòng nét đứt: lần có trợ giúp (xem gợi ý hoặc lời giải), không tính vào số lần tự làm.</p>}
          </section>
        ))}
        {(vung.length > 0 || luyen.length > 0) && <div className="lg-ev-hai">{nhomKt('vung', vung)}{nhomKt('luyen', luyen)}</div>}
        {chuaDu.length > 0 && (
          <p className="lg-ev-chua">Chưa đủ lượt để biết: {chuaDu.map((k, i) => <span key={k.ten}>{i ? ', ' : ''}<b><ChemText text={chuHoa(k.ten)} /></b> (em mới tự làm {k.tuLam} lần)</span>)}.</p>
        )}
        <div>
          <p className="lg-ev-muc-tieu">{dangLam ? 'Chạm để Thầy gợi hướng (chưa nói đáp án)' : 'Chạm để hỏi Thầy ngay'}</p>
          <div className="lg-ev-hoi" role="group" aria-label="Hỏi nhanh">
            {nut.map((n) => (
              <button key={n.nhan} type="button" disabled={khoa} onClick={() => onHoi(n.cau)}>
                <HinhHoi /><span><ChemText text={chuHoa(n.nhan)} /></span>
              </button>
            ))}
          </div>
        </div>
        {moc && em.kienThuc.length > 0 && <p className="lg-ev-chan">Phần kiến thức tính tới {moc}. Không tính điểm.</p>}
      </div>
    </details>
  )
}
