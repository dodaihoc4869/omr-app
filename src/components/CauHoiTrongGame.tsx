/**
 * CÂU HỎI TRONG GAME — ẢNH VÀ BẢNG HIỆN ĐÚNG CHỖ CỦA NÓ.
 *
 * Thầy chốt 15-09: *"tất cả các câu có hình ảnh, bảng biểu đều mang vào game
 * được, hiển thị đúng chuẩn cấu trúc nhé"*.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * TẠI SAO PHẢI CÓ TỆP NÀY. `cau-hoi-cua-em.ts` đã mang được ảnh và bảng vào
 * game từ 15-09, nhưng màn chiến đấu chỉ in `cau` và bốn chuỗi `phuongAn` —
 * tức là em đọc "Dựa vào đồ thị bên dưới…" mà KHÔNG CÓ đồ thị nào bên dưới.
 * Câu ấy em bắt buộc đoán, và cái sai ấy lại được ghi vào sổ như em học kém.
 * Đó là "lặng lẽ sai", thứ luật kho cấm.
 *
 * BỐ CỤC bám đúng thẻ câu thi (`TheCau.tsx`), không nghĩ ra kiểu mới:
 *   ảnh thân câu (nếu có) THAY cho chữ đề — lớp chữ PDF vỡ công thức âm thầm,
 *   ảnh thì không · bảng số liệu · ảnh `sau_de` · bốn phương án, ảnh của
 *   phương án nào nằm ngay tại phương án ấy · ảnh `cuoi_cau`.
 */
import type { AnhXen } from '../game/than-thu-hoa-hoc/cau-hoi-cua-em'
import { BangSoLieu, CauHinh, ZoomableImage } from './QuestionMedia'
import { ChemText } from '../lib/chem-format'

/** Phần media của một câu — chỉ những trường màn game cần. */
export interface CauCoAnh {
  cau: string
  phuongAn: readonly string[]
  anhThanCau?: string
  anhPhuongAn?: readonly string[]
  anhXen?: readonly AnhXen[]
  bang?: readonly (readonly string[])[]
}

/** Câu này có gì ngoài chữ không — dùng để quyết định có cần khung rộng hơn. */
export function cauCoMedia(c: CauCoAnh): boolean {
  return Boolean(
    (c.anhThanCau ?? '') !== '' ||
    (c.anhPhuongAn ?? []).some((x) => x !== '') ||
    (c.anhXen ?? []).length > 0 ||
    (c.bang ?? []).length > 0,
  )
}

/** Ảnh chèn tại một vị trí. `sau_de` và `cuoi_cau` là hai chỗ game dùng. */
function AnhTai({ ds, viTri }: { ds: readonly AnhXen[]; viTri: string }) {
  const loc = ds.filter((h) => h.viTri === viTri)
  if (loc.length === 0) return null
  return (
    <>
      {loc.map((h, i) => (
        <CauHinh key={i} src={h.url} alt={`Hình ${viTri === 'sau_de' ? 'đề bài' : 'cuối câu'} ${i + 1}`} />
      ))}
    </>
  )
}

/** THÂN CÂU: ảnh đề (nếu có) hoặc chữ đề, rồi bảng, rồi ảnh sau đề. */
export function ThanCauGame({ c }: { c: CauCoAnh }) {
  const xen = c.anhXen ?? []
  // Ảnh nào KHÔNG phải `sau_de`/`cuoi_cau` vẫn phải hiện — xếp cuối, chứ
  // không im lặng bỏ đi. Thà thừa một hình còn hơn giấu mất một hình.
  const con = xen.filter((h) => h.viTri !== 'sau_de' && h.viTri !== 'cuoi_cau')
  return (
    <div className="space-y-2">
      {(c.anhThanCau ?? '') !== '' ? (
        <ZoomableImage src={c.anhThanCau!} alt="Đề bài (ảnh cắt từ đề gốc)" />
      ) : (
        <div className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
          <ChemText text={c.cau} />
        </div>
      )}
      {(c.bang ?? []).length > 0 && <BangSoLieu table={(c.bang as string[][])} />}
      <AnhTai ds={xen} viTri="sau_de" />
      <AnhTai ds={xen} viTri="cuoi_cau" />
      {con.map((h, i) => (
        <CauHinh key={`con${i}`} src={h.url} alt={`Hình đính kèm ${i + 1}`} />
      ))}
    </div>
  )
}

/** Nội dung MỘT phương án: ảnh của nó (nếu có) rồi tới chữ. */
export function NoiDungPhuongAn({ c, i }: { c: CauCoAnh; i: number }) {
  const anh = c.anhPhuongAn?.[i] ?? ''
  const chu = c.phuongAn[i] ?? ''
  return (
    <span className="flex-1 min-w-0">
      {anh !== '' && (
        <img
          src={anh}
          alt={`Phương án ${String.fromCharCode(65 + i)} (ảnh cắt từ đề gốc)`}
          className="max-h-24 w-auto mb-1 rounded-md bg-white"
        />
      )}
      {chu !== '' && <ChemText text={chu} />}
    </span>
  )
}
