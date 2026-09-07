// SỔ SỬA MÃ DẠNG — đặc tả v3 mục 4.3.
//
// Nguồn sự thật của mã dạng là KHO trên máy thầy, không phải app. Nên khi thầy
// sửa một mã trong app, cái sửa đó phải sống sót qua lần đồng bộ sau — nếu
// không, đề tải lại đè mã cũ về và thầy sửa lại từ đầu, không hiểu vì sao.
//
// Cách làm: ghi cái sửa vào SỔ (qid -> mã mới, hoặc null = bỏ mã), và ÁP SỔ LÊN
// đề ngay sau mỗi lần tải về. Sổ nhỏ, chỉ chứa những câu thầy đã đụng vào.
//
// Sổ là bản vá tạm trên máy này. Muốn sửa vĩnh viễn thì xuất sổ ra file, đưa về
// `kho-de/` cho pipeline gộp vào kho — nút xuất nằm ở màn Ngân hàng.
import type { TeacherExamSource } from '../data/examContent'
import { maTrongTuVung, tenCua } from './tu-vung-dang'

export interface GhiSua {
  /** Mã mới; `null` nghĩa là thầy bỏ mã của câu này. */
  ma: string | null
  /** Lý do, bắt buộc khi `ma === null` — cùng luật với `viSaoNull` của kho. */
  viSaoNull?: string
  /** Lúc sửa, để thầy đối chiếu khi xuất sổ. */
  luc: string
}

export type SoSuaDang = Record<string, GhiSua>

export const LY_DO_THAY_BO = 'thầy bỏ mã ở màn Ngân hàng'

/** Ghi một lần sửa vào sổ. Mã ngoài từ vựng đóng bị TỪ CHỐI: app không được
 * phép sinh mã mới, kể cả khi thầy gõ tay. */
export function ghiSua(so: SoSuaDang, qid: string, ma: string | null, luc = new Date().toISOString()): SoSuaDang {
  const id = String(qid ?? '').trim()
  if (!id) return so
  if (ma !== null && !maTrongTuVung(ma)) return so
  return { ...so, [id]: ma === null ? { ma: null, viSaoNull: LY_DO_THAY_BO, luc } : { ma, luc } }
}

/** Bỏ một câu khỏi sổ — trả câu đó về đúng mã kho đang có. */
export function boSua(so: SoSuaDang, qid: string): SoSuaDang {
  if (!(qid in so)) return so
  const ra = { ...so }
  delete ra[qid]
  return ra
}

type CoDangCau = { id?: string; dang?: { ma: string; ten: string } | null; viSaoNull?: string }

function vaMotCau<T>(q: T, so: SoSuaDang): T {
  const c = q as unknown as CoDangCau
  const g = so[String(c.id ?? '')]
  if (!g) return q
  if (g.ma === null) return { ...q, dang: null, viSaoNull: g.viSaoNull || LY_DO_THAY_BO }
  return { ...q, dang: { ma: g.ma, ten: tenCua(g.ma) }, viSaoNull: undefined }
}

/** Áp sổ lên một đề. Không sửa đề gốc, trả bản mới. */
export function apDungSoSua(s: TeacherExamSource, so: SoSuaDang): TeacherExamSource {
  if (!so || Object.keys(so).length === 0) return s
  return {
    ...s,
    phanI: s.phanI.map((q) => vaMotCau(q, so)),
    phanII: s.phanII.map((q) => vaMotCau(q, so)),
    phanIII: s.phanIII.map((q) => vaMotCau(q, so)),
  }
}

/** Sổ dạng file cho thầy đưa về `kho-de/`. Gộp luôn mã đề để pipeline biết
 * phải mở file nào. */
export function xuatSo(so: SoSuaDang, khoDe: TeacherExamSource[]): string {
  const deCua = new Map<string, string>()
  for (const s of khoDe) for (const q of [...s.phanI, ...s.phanII, ...s.phanIII]) deCua.set(String((q as CoDangCau).id ?? ''), s.maDe)
  const ds = Object.entries(so).map(([qid, g]) => ({
    qid,
    maDe: deCua.get(qid) ?? '',
    ma: g.ma,
    viSaoNull: g.ma === null ? g.viSaoNull || LY_DO_THAY_BO : undefined,
    luc: g.luc,
  }))
  ds.sort((a, b) => a.maDe.localeCompare(b.maDe) || a.qid.localeCompare(b.qid))
  return JSON.stringify({ loai: 'so-sua-dang', xuatLuc: new Date().toISOString(), soCau: ds.length, sua: ds }, null, 1)
}
