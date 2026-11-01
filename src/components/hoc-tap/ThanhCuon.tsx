// THANH CUỘN RIÊNG của màn làm chặng khi XOAY NGANG / MÁY TÍNH (thầy 01/11: «Phần chặng của học sinh tối ưu thêm cho màn xoay ngang và máy tính cho
// đẹp mắt bố cục khoa học nhé, đề dài nhớ có thanh cuộn»). Bố cục hai cột (styles/trong-chang-ngang.css): cột ĐỀ và cột TRẢ LỜI mỗi cột cuộn riêng.
// Thanh cuộn của trình duyệt KHÔNG luôn thấy (máy cảm ứng, macOS: chỉ hiện lúc đang cuộn) ⇒ vẽ tay một rãnh mảnh + con trượt ở mép phải cột, LUÔN THẤY
// khi cột còn dài hơn khung, kèm bóng mờ mép dưới «còn nữa» tới khi cuộn hết. Lớp phủ là ô lưới CÙNG chỗ với cột (không nằm trong vùng cuộn) ⇒ đứng yên.
// MƯỢT: không vẽ lại React khi cuộn — cuộn / đổi cỡ chỉ xin một khung rAF, đặt `transform` + `height` của con trượt và hai thuộc tính trên CHÍNH lớp phủ
// (không lan xuống chữ đề). Dọc điện thoại: lớp phủ `display: none`, khung không khớp ⇒ không đo gì.
import { useEffect, useRef } from 'react'

/** Khổ dùng bố cục hai cột cuộn riêng — CÙNG điều kiện @media của styles/trong-chang-ngang.css (test khoá). */
export const MQ_CHANG_HAI_COT = '(orientation: landscape) and (max-height: 500px), (min-width: 1000px) and (min-height: 501px)'
/** Con trượt ngắn nhất (px) — vẫn thấy rõ khi đề rất dài. */
export const CON_TRUOT_MIN = 28
/** Lề rãnh trên / dưới trong ô cột (px). */
export const LE_RANH = 6

export type DoCuon = { co: boolean; con: boolean; dai: number; dau: number }
/** THUẦN: cột cuộn được không (dư > 2 px), còn nội dung phía dưới không, chiều dài + vị trí con trượt (px) trên rãnh cao `ranh`. */
export function tinhThanhCuon(cuon: number, tong: number, khung: number, ranh: number = khung): DoCuon {
  const du = tong - khung
  if (!(du > 2) || !(khung > 0) || !(ranh > 0)) return { co: false, con: false, dai: 0, dau: 0 }
  const dai = Math.min(ranh, Math.max(CON_TRUOT_MIN, Math.round((ranh * khung) / tong)))
  const tl = Math.min(1, Math.max(0, cuon / du))
  return { co: true, con: cuon < du - 2, dai, dau: Math.round((ranh - dai) * tl) }
}

/** Gắn lớp phủ `phu` (span.duo-cuon > i) vào cột cuộn `cot`. Trả hàm gỡ. */
export function ganThanhCuon(cot: HTMLElement, phu: HTMLElement): () => void {
  const truot = phu.firstElementChild as HTMLElement | null
  const mq = typeof window.matchMedia === 'function' ? window.matchMedia(MQ_CHANG_HAI_COT) : null
  let hen = 0, cu = ''
  const ve = () => {
    hen = 0
    if (mq && !mq.matches) return
    const d = tinhThanhCuon(cot.scrollTop, cot.scrollHeight, cot.clientHeight, phu.clientHeight - 2 * LE_RANH)
    const moi = `${d.co ? 1 : 0}${d.con ? 1 : 0}`
    if (moi !== cu) { cu = moi; phu.toggleAttribute('data-co', d.co); phu.toggleAttribute('data-con', d.con) }
    if (d.co && truot) { truot.style.height = `${d.dai}px`; truot.style.transform = `translateY(${d.dau}px)` }
  }
  const xin = () => { if (!hen) hen = requestAnimationFrame(ve) }
  cot.addEventListener('scroll', xin, { passive: true })
  // Đổi cỡ cột (xoay máy, dải kết quả hiện) hoặc nội dung (câu mới, ảnh / công thức tải xong) ⇒ đo lại. Con cột đổi theo câu ⇒ theo dõi lại.
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(xin) : null
  const theoDoi = () => { if (!ro) return; ro.disconnect(); ro.observe(cot); ro.observe(phu); for (const c of Array.from(cot.children)) ro.observe(c) }
  theoDoi()
  const mo = typeof MutationObserver === 'function' ? new MutationObserver(() => { theoDoi(); xin() }) : null
  mo?.observe(cot, { childList: true })
  mq?.addEventListener?.('change', xin)
  // Chuột kéo con trượt (máy tính): kéo dọc ⇒ cuộn cột theo tỉ lệ rãnh.
  let keo: { y: number; top: number; tl: number } | null = null
  const bat = (e: PointerEvent) => {
    if (e.pointerType === 'touch' || !truot) return
    const ranh = phu.clientHeight - 2 * LE_RANH, dai = truot.offsetHeight, du = cot.scrollHeight - cot.clientHeight
    if (ranh <= dai || du <= 0) return
    e.preventDefault(); truot.setPointerCapture?.(e.pointerId)
    keo = { y: e.clientY, top: cot.scrollTop, tl: du / (ranh - dai) }
  }
  const di = (e: PointerEvent) => { if (keo) cot.scrollTop = keo.top + (e.clientY - keo.y) * keo.tl }
  const tha = () => { keo = null }
  truot?.addEventListener('pointerdown', bat)
  truot?.addEventListener('pointermove', di)
  truot?.addEventListener('pointerup', tha)
  truot?.addEventListener('pointercancel', tha)
  xin()
  return () => {
    cancelAnimationFrame(hen)
    cot.removeEventListener('scroll', xin)
    ro?.disconnect(); mo?.disconnect()
    mq?.removeEventListener?.('change', xin)
    truot?.removeEventListener('pointerdown', bat); truot?.removeEventListener('pointermove', di)
    truot?.removeEventListener('pointerup', tha); truot?.removeEventListener('pointercancel', tha)
  }
}

/** Lớp phủ thanh cuộn của cột anh em `.duo-cot-<cot>` (đặt NGAY SAU cột trong cùng cha). Màn đổi câu mà cột giữ nguyên ⇒ lớp phủ cũng giữ nguyên. */
export function ThanhCuon({ cot }: { cot: 'de' | 'tra' }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const phu = ref.current, c = phu?.previousElementSibling
    return phu && c instanceof HTMLElement && c.classList.contains(`duo-cot-${cot}`) ? ganThanhCuon(c, phu) : undefined
  }, [cot])
  return <span ref={ref} className="duo-cuon" data-cot={cot} aria-hidden="true"><i /></span>
}
