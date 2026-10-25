import { useEffect, useMemo, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { BieuTuongTuSua } from './BieuTuongTuSua'
import { docNhoTuSua, ngheTuSua } from '../../lib/tu-sua-loi'
import { dungViecHomNay, docSbdHs, luuViecHomNay, themMotChang, type ViecHomNay } from '../../lib/tu-sua-viec-hom-nay'
import type { KetQuaDanhSachChua } from '../../lib/chua-cau-sai-api'
import './viec-hom-nay.css'

// THẺ MỜI "TỰ SỬA LỖI" Ở HÔM NAY (thầy 20/10: thẻ "155 câu đang chờ em sửa" làm em nản ⇒ "Hôm nay sửa 12 câu", chia chặng 4 câu).
// NẠP LƯỜI (luật tốc độ 13/10): cả thẻ cũ lẫn thẻ mới nằm ở đây; HocTapHomNay chỉ giữ lớp vỏ mỏng ⇒ byte tải mở app không tăng.
// Danh sách lấy từ bản nhớ `taiTuSuaLoi` (Hôm nay đã tải sẵn số câu — không thêm lượt gọi máy chủ). Không có phiên đăng nhập / không có việc nào làm được ⇒ thẻ CŨ y nguyên.

/** Tên mục (chữ của thầy 13/10) — trùng `TEN_TU_SUA` của HocTapHomNay; viết lại ở đây để khỏi nhập vòng. */
const TEN_TU_SUA = 'Tự sửa lỗi'
interface Props { so: number | null; token?: string; onChua: (qid?: string) => void }

/** Thẻ cũ: một con số + một nút (giữ làm lối lùi khi chưa dựng được việc hôm nay). */
function TheCu({ so, onChua }: { so: number; onChua: () => void }) {
  return <section className="ht2-moi-sua" aria-labelledby="ht2-moi-sua-tieu">
    <span className="ht2-moi-sua-bt" aria-hidden="true"><BieuTuongTuSua hien /></span>
    <div className="ht2-moi-sua-chu">
      <span className="ht2-moi-sua-nhan">{TEN_TU_SUA}</span>
      <h2 id="ht2-moi-sua-tieu"><b>{so}</b> câu đang chờ em sửa</h2>
    </div>
    <button type="button" className="ht2-moi-sua-nut" onClick={onChua}>Sửa lỗi ngay<ArrowRight size={20} aria-hidden="true" /></button>
  </section>
}

type KieuThe = 'moi' | 'gan' | 'dang' | 'xong'
/** Chữ và nút của thẻ theo trạng thái trong ngày (xem bản vẽ khung 02). */
export function noiDungThe(v: ViecHomNay): { kieu: KieuThe; tieuDe: string; so: number; phu: string; nut: string } {
  const nChang = v.chang.length
  const k = Math.min(v.changHienTai + 1, nChang)
  const ngaySau = v.conNgaySau > 0 ? `Còn ${v.conNgaySau} câu cho các ngày sau.` : ''
  // Chữa câu gọn (25/10): em thấy NGAY số câu đã tự sửa hôm nay (máy chủ đếm).
  const tuSua = (v.xongHomNay ?? 0) > 0 ? `Đã tự sửa hôm nay: ${v.xongHomNay} câu.` : ''
  if (!v.tiep) return { kieu: 'xong', tieuDe: 'Hôm nay em đã xong phần của ', so: v.tong, phu: [tuSua, ngaySau].filter(Boolean).join(' '), nut: 'Sửa thêm 1 chặng' }
  if (v.xong > 0) {
    return { kieu: 'dang', tieuDe: 'Hôm nay em đã xong phần của ', so: v.xong, phu: [tuSua, `Tự sửa lỗi · Chặng ${k}/${nChang} · còn ${v.chang[v.changHienTai]!.filter((x) => !x.xong).length} câu`].filter(Boolean).join(' '), nut: `Sửa tiếp · chặng ${k}/${nChang}` }
  }
  const gan = v.chang[0]!.filter((x) => x.loai === 'gan').length
  if (gan > 0) return { kieu: 'gan', tieuDe: ' câu chỉ còn làm bản mới là xong', so: gan, phu: 'Bản mới đã mở. Em tự làm, không xem gợi ý hay lời giải.', nut: 'Làm bản mới' }
  return { kieu: 'moi', tieuDe: 'Hôm nay sửa ', so: v.tong, phu: [tuSua, `${nChang} chặng${nChang > 1 ? ', mỗi chặng 4 câu' : ''}.`, ngaySau].filter(Boolean).join(' '), nut: 'Bắt đầu sửa' }
}

export default function TheMoiTuSua({ so, token, onChua }: Props) {
  const [kq, setKq] = useState<KetQuaDanhSachChua | null>(() => (token ? docNhoTuSua(token) : null))
  useEffect(() => {
    if (!token) return
    setKq(docNhoTuSua(token))
    return ngheTuSua((t, moi) => { if (t === token) setKq(moi) })
  }, [token])
  const sbd = useMemo(() => docSbdHs(), [])
  const { viec, luu } = useMemo(() => (sbd ? dungViecHomNay(kq, Date.now(), sbd) : { viec: null, luu: null }), [kq, sbd])
  useEffect(() => { luuViecHomNay(luu) }, [luu])
  if (!so || so <= 0) return null
  if (!viec || viec.tong === 0) return <TheCu so={so} onChua={() => onChua()} />

  const nd = noiDungThe(viec)
  const nChang = viec.chang.length
  const moTiep = () => onChua(viec.tiep?.m.qid)
  const them = () => {
    const v = themMotChang(kq)
    onChua(v?.tiep?.m.qid)
  }
  return <section className="ht2-moi-sua" data-viec="" data-tt={nd.kieu === 'xong' ? 'xong' : undefined} aria-labelledby="ht2-moi-sua-tieu">
    <span className="ht2-moi-sua-bt" aria-hidden="true"><BieuTuongTuSua hien /></span>
    <div className="ht2-moi-sua-chu">
      <span className="ht2-moi-sua-nhan">{TEN_TU_SUA}</span>
      <h2 id="ht2-moi-sua-tieu">{nd.kieu === 'gan' ? <><b>{nd.so}</b>{nd.tieuDe}</> : <>{nd.tieuDe}<b>{nd.so}</b> câu</>}</h2>
      {nd.phu && <p className="ht2-moi-sua-phu">{nd.phu}</p>}
    </div>
    <div className="vh-hang">
      <div className="vh-cac" role="img" aria-label={`Hôm nay đã xong phần của ${viec.xong} trong ${viec.tong} câu, chia ${nChang} chặng`}>
        {viec.chang.map((c, i) => (
          <span className="vh-nhom" key={i}>{c.map((x) => <i key={x.khoa} data-tt={x.xong ? 'xong' : x.khoa === viec.tiep?.khoa ? 'nay' : undefined} />)}</span>
        ))}
      </div>
      <b className="vh-so">{viec.xong}/{viec.tong} câu</b>
    </div>
    {nd.kieu === 'xong'
      ? <button type="button" className="ht2-moi-sua-chu-nut" onClick={them}>{nd.nut}</button>
      : <button type="button" className="ht2-moi-sua-nut" onClick={moTiep}>{nd.nut}<ArrowRight size={20} aria-hidden="true" /></button>}
  </section>
}
