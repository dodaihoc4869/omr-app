// Hiển thị bảng số liệu / ảnh đính kèm câu hỏi — TÁI TẠO NGUYÊN VẸN, không
// suy diễn: bảng là dữ liệu thô (mảng 2 chiều), ảnh là ảnh CẮT TỪ ĐỀ GỐC.
// Chữ trong từng ô bảng qua ChemText để chỉ số dưới/số mũ hiển thị đúng.
//
// QUY TẮC (SỬA TRỌN VẸN — CÔNG THỨC VÀ BỐ CỤC): bảng đơn giản (≤5 cột, không
// ô gộp) dựng bảng HTML thật — đọc tốt hơn ảnh trên màn hẹp. Bốn loại sau
// KHÔNG render bằng KaTeX/HTML mà nhúng ẢNH: sơ đồ phản ứng nhiều mũi tên,
// công thức cấu tạo, bảng phức tạp, đồ thị/mô hình thí nghiệm (HinhAnh).
import { useState } from 'react'
import type { HinhAnh, QuestionMedia as QuestionMediaData } from '../data/examContent'
import { ChemText } from '../lib/chem-format'

/** Ảnh bấm phóng to toàn màn hình — dùng chung cho ảnh đồ thị/hình vẽ VÀ ảnh
 * đề bài cắt từ PDF gốc (than_cau.png), cùng một hành vi chạm. */
export function ZoomableImage({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  const [phongTo, setPhongTo] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setPhongTo(true)} className={`tap-target block w-full ${className}`} title="Bấm để phóng to toàn màn hình">
        <img src={src} alt={alt} className="w-full" style={{ borderRadius: 'var(--bo-1)', border: '1px solid var(--vien)' }} />
      </button>
      {phongTo && <ManHinhAnh src={src} alt={alt} onClose={() => setPhongTo(false)} />}
    </>
  )
}

/** Lớp phủ xem ảnh toàn màn hình — nền tối 90%, chạm ra ngoài để đóng. */
export function ManHinhAnh({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 overflow-auto" style={{ background: 'rgba(26,35,50,.9)' }} onClick={onClose}>
      <img src={src} alt={alt} className="max-w-full max-h-full" style={{ borderRadius: 'var(--bo-1)', background: '#fff' }} />
    </div>
  )
}

/** Đề bài: có ảnh cắt từ PDF gốc thì LUÔN ưu tiên hiện ảnh — đúng nguyên tắc
 * "lớp chữ chỉ để định vị, không dùng để hiển thị" (lớp chữ PDF vỡ công thức
 * ÂM THẦM, ảnh thì không). Không có ảnh (đề gõ tay, hoặc cắt ảnh thất bại) ->
 * hiện lại bằng chữ (ChemText) như trước. */
export function StemOrText({ img, text }: { img?: string; text: string }) {
  if (img) return <ZoomableImage src={img} alt="Đề bài (ảnh cắt từ file gốc)" />
  return (
    <div className="cau-de">
      <ChemText text={text} />
    </div>
  )
}

/** Phương án A/B/C/D hoặc ý a/b/c/d — có ảnh thì hiện ảnh, không có thì hiện chữ. */
export function ChoiceOrText({ img, text }: { img?: string; text: string }) {
  if (img) return <img src={img} alt="Phương án (ảnh cắt từ file gốc)" className="max-h-14 w-auto" />
  return (
    <span className="flex-1 pa-noi-dung">
      <ChemText text={text} />
    </span>
  )
}

/** Bảng số liệu đơn giản — bảng HTML thật, cuộn ngang trong khung riêng,
 * chữ sans 13px không co nhỏ hơn. */
export function BangSoLieu({ table }: { table?: string[][] }) {
  if (!table || table.length === 0) return null
  const o: React.CSSProperties = { padding: 'var(--k2) var(--k3)', whiteSpace: 'nowrap', fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--muc)' }
  return (
    <div className="overflow-x-auto" style={{ borderRadius: 'var(--bo-1)', border: '1px solid var(--vien)' }}>
      <table className="w-full border-collapse">
        <thead>
          <tr style={{ background: 'var(--the-2)' }}>
            {table[0].map((cell, i) => (
              <th key={i} className="text-left font-bold" style={{ ...o, borderBottom: '1px solid var(--vien)' }}>
                <ChemText text={cell} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.slice(1).map((row, r) => (
            <tr key={r} style={{ borderTop: '1px solid var(--vien)' }}>
              {row.map((cell, c) => (
                <td key={c} style={o}>
                  <ChemText text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Một ảnh cắt từ đề gốc trong khung .cau-hinh — bấm mở toàn màn hình. */
export function CauHinh({ src, alt, onZoom }: { src: string; alt: string; onZoom?: (src: string) => void }) {
  const [phongTo, setPhongTo] = useState(false)
  const mo = () => (onZoom ? onZoom(src) : setPhongTo(true))
  return (
    <div className="cau-hinh">
      <img src={src} alt={alt} loading="lazy" onClick={mo} />
      {phongTo && <ManHinhAnh src={src} alt={alt} onClose={() => setPhongTo(false)} />}
    </div>
  )
}

/** Các ảnh của câu tại 1 vị trí (sau_de / sau_pa_X / sau_y_x / cuoi_cau). */
export function HinhTaiViTri({ hinhAnh, viTri, onZoom, nhan }: { hinhAnh?: HinhAnh[]; viTri: HinhAnh['viTri']; onZoom?: (src: string) => void; nhan: string }) {
  const ds = (hinhAnh ?? []).filter((h) => h.viTri === viTri)
  if (ds.length === 0) return null
  return (
    <>
      {ds.map((h, i) => (
        <CauHinh key={i} src={h.src} alt={h.alt ?? `Hình ${nhan}${ds.length > 1 ? ` (${i + 1})` : ''}`} onZoom={onZoom} />
      ))}
    </>
  )
}

/** Bảng + ảnh sau đề bài (dùng ở màn Duyệt câu/nhập đề — thẻ câu thi/xem lại
 * dùng TheCau, đặt ảnh đúng vị trí từng phương án). */
export default function QuestionMedia({ table, imageDataUrl, hinhAnh }: QuestionMediaData) {
  if (!table && !imageDataUrl && !(hinhAnh && hinhAnh.length)) return null
  return (
    <div className="flex flex-col" style={{ gap: 'var(--k2)', marginTop: 'var(--k1)' }}>
      <BangSoLieu table={table} />
      {imageDataUrl && <CauHinh src={imageDataUrl} alt="Đồ thị / hình vẽ đính kèm" />}
      {(hinhAnh ?? []).map((h, i) => (
        <CauHinh key={i} src={h.src} alt={h.alt ?? `Hình ${i + 1}`} />
      ))}
    </div>
  )
}
