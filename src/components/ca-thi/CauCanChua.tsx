// MỘT CÂU CẦN CHỮA trong báo cáo chi tiết của em (BaoCaoChiTiet chế độ `hs`): đề + lời giải vẽ bằng ĐÚNG `TheCau` xem_lai qua
// `propsTheCau` — cùng hàm của "Câu đã làm" (soát 28/09, docs/hs-lich-su-ca-2809/SOAT-BAO-CAO.md: báo cáo cũ in chữ THÔ — chỉ số
// H₂SO₄ ra phông dự phòng, sơ đồ "→(+H₂, xt, t°)" không lên mũi tên, lời giải không qua ChemText). Chỉ đổi cách vẽ, không đổi dữ liệu kho.
import TheCau from '../TheCau'
import '../m3'
import { propsTheCau } from '../hoa2/cau-chuyen'
import type { ChiTietCau } from '../hoa2/api'
import type { CauSaiHienThi } from '../KhoiCauSai'

/** Một đường dẫn ảnh vẽ được, hay chuỗi rỗng (cùng luật `KhoiCauSai`). */
function duongAnh(v: unknown): string {
  const s = typeof v === 'string' ? v.trim() : ''
  return s.length > 10 && (s.startsWith('data:image/') || s.startsWith('http://') || s.startsWith('https://') || s.startsWith('/')) ? s : ''
}

/** Ảnh có vị trí (`sau_de`, `sau_pa_A`, `sau_y_a`…) — chuỗi trơn coi là ảnh sau đề. */
function anhCoViTri(h: unknown): { src: string; viTri: string; alt?: string }[] {
  const ds = Array.isArray(h) ? h : h ? [h] : []
  return ds.flatMap((x) => {
    if (typeof x === 'string') return duongAnh(x) ? [{ src: duongAnh(x), viTri: 'sau_de' }] : []
    const o = (x ?? {}) as { src?: unknown; viTri?: unknown; alt?: unknown }
    const src = duongAnh(o.src)
    return src ? [{ src, viTri: String(o.viTri ?? 'sau_de'), alt: typeof o.alt === 'string' ? o.alt : undefined }] : []
  })
}

/** Câu (khuôn `/hs/cau-da-thi`) → khuôn "Câu đã làm" (`ChiTietCau`). Bỏ trống (rỗng / toàn "-") ⇒ `emTraLoi = null`. */
export function chiTietTuCauSai(c: CauSaiHienThi): ChiTietCau {
  const phan = (['I', 'II', 'III'].includes(String(c.phan)) ? String(c.phan) : 'I') as 'I' | 'II' | 'III'
  const chon = String(c.dapAnChon ?? '').trim()
  return {
    de: {
      qid: c.qid ?? '',
      phan,
      text: c.text ?? '',
      choices: Array.isArray(c.choices) ? c.choices : [],
      ideas: Array.isArray(c.ideas) ? c.ideas : [],
      table: Array.isArray(c.table) && c.table.length > 0 ? c.table : undefined,
      thanCauImg: duongAnh(c.thanCauImg) || undefined,
      imageDataUrl: duongAnh(c.imageDataUrl) || undefined,
      choiceImgs: Array.isArray(c.choiceImgs) ? c.choiceImgs.map((x) => duongAnh(x)) : undefined,
      ideaImgs: Array.isArray(c.ideaImgs) ? c.ideaImgs.map((x) => duongAnh(x)) : undefined,
      hinhAnh: anhCoViTri(c.hinhAnh),
      tenDang: '',
      mucDo: c.mucDo ?? null,
      maDe: '',
      sao: null,
    },
    dapAn: String(c.dapAnDung ?? ''),
    loiGiai: c.loiGiai,
    emTraLoi: chon.replace(/-/g, '') ? chon : null,
  }
}

/** Đề + lời giải chuẩn của một câu — bọc `m3 h2-the-cau` đúng như thẻ Câu đã làm. */
export default function CauCanChua({ c, stt }: { c: CauSaiHienThi; stt: number }) {
  return (
    <div className="m3 h2-the-cau">
      <TheCau {...propsTheCau(chiTietTuCauSai(c), stt)} />
    </div>
  )
}
