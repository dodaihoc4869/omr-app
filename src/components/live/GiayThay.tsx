// LIVE BẢNG — GIẤY ĐỀ GIỐNG GIẤY CỦA THẦY (đợt 2, 11/11; đặc tả docs/dac-ta-live-bang-1011.md mục 2.2 + rủi ro R3). Nạp lười cùng LopLive.
// VÌ SAO: nét thầy gạch chân / khoanh trên GIẤY ĐỀ chỉ đúng chỗ khi chữ trên máy em xuống dòng y như trên màn chiếu. Trước đây máy em dựng đề bằng khối đề
// của chặng (bề rộng, cỡ chữ, cách xếp phương án khác tờ chiếu) ⇒ nét lệch chữ.
// CÁCH LÀM: tờ chiếu ĐO từng khối chữ của giấy (src/lib/live-to-chieu.ts `lvDoGiay`: vị trí, bề rộng, cỡ chữ, cao dòng, chỗ hết chữ — CHỈ SỐ ĐO, không chữ,
// không đáp án) ⇒ phòng (`live.giay`) ⇒ máy em đặt từng khối vào ĐÚNG ô ấy trên một tấm giấy cùng bề rộng lôgic (px của cửa sổ thầy) rồi co cả tấm cho vừa
// ô giấy trên máy. Chữ dựng bằng `ChemText` của màn làm bài (màn Bình Phản Ứng truyền vào — đã nằm sẵn trong máy em; cùng bộ tách công thức với `chuHtml`
// của tờ chiếu, xem ghi chú ở src/lib/html-phieu.ts; KHÔNG nhập html-phieu vào mảnh live: 200 KB), cùng phông Be Vietnam Pro của app, từ câu công khai của
// lượt (`viewEm.luot.cau` — không có đáp án). Chỗ nào hai bộ dựng ra khác nhau thì bước tự kiểm bên dưới bắt được.
// TỰ KIỂM (R3): dựng xong, máy em đo lại từng khối chữ (chiều cao + chỗ hết chữ) và so với số đo của thầy. KHỚP ⇒ hiện giấy soi, nét trên giấy giữ.
// LỆCH (phông chưa tải, câu trên tờ khác câu của lượt, khối máy em chưa soi được…) ⇒ trả về cách dựng thường (đủ nội dung, dễ đọc) và báo lớp trên ẨN NÉT
// TRÊN GIẤY (nét trên bảng đen không bị ảnh hưởng) + số đo `live-do` mang cờ `gl`.
import { Fragment, memo, useLayoutEffect, useMemo, useRef, useState, type ComponentType, type CSSProperties, type ReactNode } from 'react'
import type { GiayThay as BoCucGiay } from '../../lib/bpu/phong-live'
import { CO, DAM, DONG, H, LOAI, TT, W, X, Y, khoiKhop } from './giay-thay-do'
import { TEN_PHAN } from './ten-phan-giay'

/** Phần câu công khai giấy soi cần (không có đáp án). */
export interface CauGiay { phan: string; text?: string; choices?: readonly string[]; ideas?: readonly string[] }
/** Bộ dựng chữ có công thức Hoá của màn làm bài (`ChemText`). */
export type BoChu = ComponentType<{ text: string }>
/** Như `chuDeChieu` của tờ chiếu: giữ dấu xuống dòng của người soạn, mỗi dòng dựng riêng. */
const dongChu = (s: string | undefined): string[] => String(s ?? '').replace(/\r\n?/g, '\n').replace(/<br\s*\/?\s*>/gi, '\n').split('\n')

// So số đo (`khoiKhop`) + bố cục soi được không (`soiDuoc`) + chỉ số khối: giay-thay-do.ts (12/11 — tệp component chỉ xuất component).

/** Đặt dấu «hết chữ» (phần tử rỗng) ngay sau ký tự cuối của khối ⇒ `offsetLeft` / `offsetTop` của nó = chỗ hết chữ, không phụ thuộc phép co / xoay của lớp bảng. */
function datDauHet(el: HTMLElement): HTMLElement | null {
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  let cuoi: Text | null = null
  for (let n = w.nextNode(); n; n = w.nextNode()) if (/\S/.test((n as Text).data)) cuoi = n as Text
  if (!cuoi || !cuoi.parentNode) return null
  const dai = cuoi.data.replace(/\s+$/, '').length
  const sau = dai < cuoi.data.length ? cuoi.splitText(dai) : cuoi.nextSibling
  const dau = document.createElement('span')
  dau.className = 'lv-gt-het'
  cuoi.parentNode.insertBefore(dau, sau)
  return dau
}

interface Props {
  giay: BoCucGiay
  q: CauGiay
  Chu: BoChu
  tuLuan: boolean
  /** Ô giấy trên máy em (px lôgic của vùng chiếu). */
  rong: number
  /** Báo lớp trên: giấy soi KHỚP giấy thầy (true) hay lệch (false ⇒ ẩn nét trên giấy). */
  khiKhop: (khop: boolean) => void
  /** Cách dựng thường (khối đề của chặng) — hiện khi lệch. */
  duPhong: ReactNode
}

export default memo(function GiayThay({ giay, q, Chu, tuLuan, rong, khiKhop, duPhong }: Props) {
  const goc = useRef<HTMLDivElement>(null)
  const [khop, setKhop] = useState<boolean | null>(null)
  const khiKhopRef = useRef(khiKhop)
  khiKhopRef.current = khiKhop
  /** Chữ của từng khối: loại 2 = đề, 3 = phương án / ý thứ `tt`, 6 = dòng trả lời ngắn. */
  const chu = useMemo(() => {
    const pa = q.phan === 'II' ? (q.ideas ?? []) : (q.choices ?? [])
    return { de: q.text ?? '', pa: pa.map((x) => String(x ?? '')), ngan: tuLuan ? 'Tự luận — em trình bày lời giải đầy đủ lên bảng.' : 'Trả lời ngắn — em viết kết quả và trình bày các bước lên bảng.' }
  }, [q, tuLuan])
  const khoa = useMemo(() => JSON.stringify(giay.o), [giay])

  useLayoutEffect(() => {
    const el = goc.current
    if (!el) return
    let song = true
    const kiem = () => {
      if (!song) return
      let ok = true, co = false
      for (const k of Array.from(el.querySelectorAll<HTMLElement>('[data-kiem]'))) {
        const b = giay.o[Number(k.dataset.kiem)]
        if (!b) continue
        const dau = k.querySelector<HTMLElement>('.lv-gt-het') ?? datDauHet(k)
        if (!dau) { ok = false; continue }
        co = true
        if (!khoiKhop(b, { cao: k.offsetHeight, hetX: dau.offsetLeft, hetY: dau.offsetTop })) ok = false
      }
      // Giấy thầy có 4 phương án mà câu của lượt chỉ có 2 (tờ đang chiếu câu khác) ⇒ lệch.
      const soPa = giay.o.filter((b) => b[LOAI] === 3).length
      if (soPa !== chu.pa.length && !(soPa === 0 && q.phan === 'III')) ok = false
      const kq = ok && co
      setKhop(kq)
      khiKhopRef.current(kq)
    }
    kiem()
    // Phông app tải xong (lần đầu mở) ⇒ chữ đổi bề rộng ⇒ kiểm lại.
    const phong = (document as Document & { fonts?: { ready?: Promise<unknown>; status?: string } }).fonts
    if (phong?.ready && phong.status !== 'loaded') void phong.ready.then(kiem, () => undefined)
    return () => { song = false }
  }, [giay, khoa, chu, q.phan])

  const k = rong / giay.w
  const o = (b: readonly number[], them?: CSSProperties): CSSProperties => ({ left: b[X], top: b[Y], width: b[W], ...them })
  const kieuChu = (b: readonly number[]): CSSProperties => ({ fontSize: b[CO]! / 10, lineHeight: `${b[DONG]! / 10}px`, fontWeight: b[DAM]! * 100 })
  return (
    <>
      <div ref={goc} className="lv-gt" data-khop={khop === true || undefined} aria-hidden={khop === true ? undefined : true} style={{ width: giay.w, height: giay.h, transform: `scale(${k})` }}>
        {giay.o.map((b, i) => {
          const loai = b[LOAI], tt = b[TT]!
          if (loai === 5) return <i key={i} className="lv-gt-khung" style={{ ...o(b), height: b[H] }} />
          if (loai === 0) return <b key={i} className="lv-gt-o lv-gt-so" style={{ ...o(b), ...kieuChu(b) }}>Câu {tt || ''}</b>
          if (loai === 1) return <span key={i} className="lv-gt-o lv-gt-phan" style={{ ...o(b, { width: undefined }), ...kieuChu(b) }}>Phần {q.phan}{tuLuan ? ' · Tự luận' : TEN_PHAN[q.phan] ? ` · ${TEN_PHAN[q.phan]}` : ''}</span>
          if (loai === 4) return <b key={i} className="lv-gt-o lv-gt-ky" style={{ ...o(b), height: b[H], ...kieuChu(b) }}>{(q.phan === 'II' ? 'abcd' : 'ABCD')[tt] ?? tt + 1}.</b>
          if (loai !== 2 && loai !== 3 && loai !== 6) return null
          const van = loai === 2 ? chu.de : loai === 3 ? (chu.pa[tt] ?? '') : chu.ngan
          // `key` theo chữ: chữ đổi ⇒ dựng nút mới (dấu «hết chữ» chèn tay không kẹt lại trong nút cũ)
          return <div key={`${i}:${van}`} className={`lv-gt-o lv-gt-chu${loai === 6 ? ' ngan' : ''}`} data-kiem={i} style={{ ...o(b), ...kieuChu(b) }}>{loai === 6 ? van : dongChu(van).map((d, j) => <Fragment key={j}>{j ? <br /> : null}<Chu text={d} /></Fragment>)}</div>
        })}
      </div>
      {khop === true ? null : duPhong}
    </>
  )
})
