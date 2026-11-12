// BÌNH PHẢN ỨNG — THẺ KẾT QUẢ LÊN BẢNG TRÊN BẢNG CHIẾU (thầy 10/11: «bấm Đạt / Chưa đạt trên tờ chiếu cũ ⇒ hiện KẾT QUẢ khoảng 3 giây rồi mới chuyển mượt
// về màn đua top»). Thầy chấm trên tờ (`bpu-cham` ⇒ gan-gv `chamTuTo`) ⇒ `hienKetQua(dat)` ⇒ bảng phóng lại, thẻ nổi giữa bảng: tên em, «Đạt» / «Chưa đạt»,
// kJ em + kJ đội. Số kJ là SỐ THẬT của phòng: mục `bienDong` mới của em được gọi sau khi mở đáp án (`moDapAn` gộp mọi biến động của em vào MỘT mục; phần
// đội `kjDoi` chỉ đến từ lên bảng ⇒ +200 / −100 / 0; phần em của lên bảng suy từ đúng mục ấy: đội dương ⇒ +lenBangDatEm, đội âm ⇒ cùng số, 0 ⇒ 0).
// Chưa có số (phòng đang trả lời) ⇒ thẻ hiện tên + kết quả trước, số điền vào khi về. ≥ 3 giây và đã có số (hoặc chờ quá 5,5 giây) ⇒ thẻ mờ + thu ⇒ màn đua.
// Esc / phím bất kì / chạm ⇒ chuyển ngay (gan-gv gọi `tatTheKq` ở pha bắt, trước mọi phím của bảng). Chỉ transform + opacity; máy yếu ⇒ không hoạt cảnh.
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { DOI_BPU, KJ, type ViewBang } from '../../lib/bpu/phong'
import { layBienDong } from './dua-top'
import { mauDoi } from './ong-ket-qua'
import './bpu-ket-qua.css'

export const KQ_HIEN_MS = 3000
export const KQ_CHO_SO_MS = 5500
const KQ_MO_MS = 380
type The = { dat: boolean; luc: number }
let the: The | null = null
let tat: (() => void) | null = null
const nghe = new Set<() => void>()
const bao = () => { for (const f of nghe) f() }
/** Thầy vừa chấm em lên bảng (tờ / phím khi bảng ẩn) ⇒ thẻ kết quả hiện trên bảng. */
export function hienKetQua(dat: boolean): void {
  const t = { dat, luc: Date.now() }
  the = t; bao()
  // Phòng hờ: không có bảng nào vẽ thẻ (bảng đã đóng / đổi) ⇒ tự gỡ, không giữ phím mãi.
  setTimeout(() => { if (the === t) { the = null; tat = null; bao() } }, KQ_CHO_SO_MS + 1500)
}
/** Thẻ ĐANG HIỆN trên bảng ⇒ chuyển ngay về màn đua, trả true (gan-gv nuốt phím ấy). Không có bảng vẽ thẻ ⇒ gỡ, false (phím đi tiếp). */
export function tatTheKq(): boolean { if (!the) return false; if (tat) { tat(); return true } the = null; bao(); return false }
const docThe = () => the
const dangKy = (f: () => void) => { nghe.add(f); return () => { nghe.delete(f) } }

/** Phần lên bảng trong mục biến động của em: đội = `kjDoi` (chỉ lên bảng đổi kJ đội), em suy từ đúng mục ấy. */
function soLenBang(kjDoi: number): { em: number; doi: number } { return { em: kjDoi > 0 ? KJ.lenBangDatEm : kjDoi, doi: kjDoi } }
const dau = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0')

export default function TheKetQuaLenBang({ v, an }: { v: ViewBang | null; an: boolean }) {
  const t = useSyncExternalStore(dangKy, docThe, docThe)
  const goi = v?.luot?.goi ?? null
  // Em được gọi + mốc biến động lúc chấm (chỉ nhận mục MỚI sau mốc ấy).
  const [moc, setMoc] = useState<{ luc: number; sbd: string; bd: number } | null>(null)
  const [mo, setMo] = useState(false)
  const henTat = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => {
    if (!t) { setMoc(null); setMo(false); return }
    if (moc?.luc === t.luc || !goi) return
    setMoc({ luc: t.luc, sbd: goi.sbd, bd: layBienDong(v).reduce((m, b) => Math.max(m, b.id), 0) })
    setMo(false)
  }, [t, goi, v, moc])
  const bd = moc ? layBienDong(v).find((b) => b.id > moc.bd && b.sbd === moc.sbd) : undefined
  // Hết giờ / bấm ⇒ thẻ thu + mờ rồi gỡ (máy yếu ⇒ gỡ ngay).
  useEffect(() => {
    if (!t) return
    const yeu = (typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches) || document.documentElement.classList.contains('may-yeu')
    const go = () => { if (the !== t) return; the = null; tat = null; bao() }
    tat = () => { tat = null; setMo(true); clearTimeout(henTat.current); henTat.current = setTimeout(go, yeu ? 0 : KQ_MO_MS) }
    return () => { if (tat && the !== t) tat = null }
  }, [t])
  useEffect(() => {
    if (!t || mo) return
    const con = KQ_HIEN_MS - (Date.now() - t.luc), cho = KQ_CHO_SO_MS - (Date.now() - t.luc)
    const h = setTimeout(() => tat?.(), Math.max(0, bd ? con : cho))
    return () => clearTimeout(h)
  }, [t, bd, mo])
  useEffect(() => () => clearTimeout(henTat.current), [])
  if (!t || !moc) return null
  const em = v?.ds.find((e) => e.sbd === moc.sbd)
  if (!em) return null
  const so = bd ? soLenBang(bd.kjDoi) : null
  const ten = an ? `Em số ${v!.ds.indexOf(em) + 1}` : em.ten
  return (
    <div className={`bkq${mo ? ' tat' : ''}`} data-dat={t.dat ? '1' : '0'} role="status" aria-live="assertive" onPointerDown={() => tat?.()} style={{ ['--doi' as string]: mauDoi(em.doi) }}>
      <div className="bkq-the">
        <span className="bkq-mat">Lên bảng · {DOI_BPU[em.doi]?.ten}</span>
        <b className="bkq-ten">{ten}</b>
        <span className="bkq-kq">{t.dat ? 'Đạt' : 'Chưa đạt'}</span>
        <div className="bkq-so" aria-busy={!so}>
          <span><small>Em</small><b>{so ? `${dau(so.em)} kJ` : '…'}</b></span>
          <span><small>{DOI_BPU[em.doi]?.ten ?? 'Đội'}</small><b>{so ? `${dau(so.doi)} kJ` : '…'}</b></span>
        </div>
        {!t.dat && so && !so.doi ? <span className="bkq-phu">Cảm ơn em đã lên bảng chữa bài</span> : null}
      </div>
    </div>
  )
}
