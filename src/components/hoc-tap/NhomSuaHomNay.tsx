// NHÓM LỖI HÔM NAY (ngày Sửa) — khối B đợt 2 lát 3 (thầy 09/11 duyệt bản vẽ docs/ban-ve-moi-on-sua-0911 ảnh dt-sang-3, «làm hết sạch đẩy luôn lên bản sống»).
// Câu sai chờ sửa trong 28 câu hôm nay gom theo dạng (máy chủ: goi-bai-7-nhom-sua.ts); mỗi nhóm: số thứ tự · tên dạng · loại lỗi em đã chạm ở «Vì sao em sai?» ·
// số câu. Mảnh nạp lười (chỉ ngày Sửa), có trong kho tải ngầm (vite.config KHO_HS_GOC), ngoài precache — 0 byte đường mở app.
import { ChemText } from '../../lib/chem-format'
import { docNhomSua, type NhomSuaGoi7 } from './nhom-sua-doc'
import './nhom-sua-hom-nay.css'

const NHAN: Record<NonNullable<NhomSuaGoi7['loai']>, string> = { tinh: 'Tính / đọc đề sai', cach: 'Chưa biết cách', nham: 'Hiểu nhầm' }

export default function NhomSuaHomNay({ tho }: { tho: unknown }) {
  const nhom = docNhomSua(tho)
  if (!nhom.length) return null
  const tong = nhom.reduce((s, n) => s + n.so, 0)
  return <section className="kb-nhom-sua" aria-label={`Nhóm lỗi hôm nay: ${nhom.length} nhóm, ${tong} câu`}>
    <h2>Nhóm lỗi hôm nay<span>{nhom.length} nhóm · {tong} câu</span></h2>
    <ol>{nhom.map((n, i) => <li key={i}>
      <span className="kb-ns-so" aria-hidden="true">{i + 1}</span>
      <span className="kb-ns-chu"><b><ChemText text={n.ten} /></b>{n.loai && <i className="kb-ns-loai" data-l={n.loai}>{NHAN[n.loai]}</i>}</span>
      <span className="kb-ns-dem">{n.so} câu</span>
    </li>)}</ol>
    <p className="kb-ns-ghi">Mỗi nhóm là các câu em sai cùng dạng. Câu sai làm trước, sau đó tới câu ôn và câu mới cho đủ mức hôm nay.</p>
  </section>
}
