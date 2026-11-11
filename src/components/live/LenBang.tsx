// LIVE BẢNG — MÁY EM: THÔNG BÁO «LÊN BẢNG» + THẺ TÊN em đang lên bảng. Nạp lười cùng LopLive (không thêm tệp CSS: kiểu nằm ở live-em.css).
// Thầy 11/11: «khi bấm lên bảng hs đang ở màn live, tôi muốn bạn hiện một thông báo lên bảng ở giữa màn hình máy học sinh trong 3 giây cho tất cả máy học
// sinh trong live rồi tự thu nhỏ vào góc thẻ tên của học sinh đó, không chèn thẻ tên để học sinh biết.»
//   · THẺ TÊN (`TheLenBang`): tên gọi hai chữ + chấm màu đội, nằm trong DẢI NGOÀI mép trên khung bảng đen (KhungDocLap `dauBang`; bo-cuc-doc-lap `DAU_BANG`) —
//     đúng chỗ thẻ tên trên màn chiếu của thầy (hàng trên của cột bảng). Ô bảng thầy gửi sang không gồm thẻ ấy ⇒ dải KHÔNG đè lên khung bảng, không che nét.
//     Thẻ ở lại tới khi lượt gọi hết (lượt mới / thầy bỏ lượt / tắt live) — thầy chấm xong vẫn còn (thầy còn chữa tiếp trên bảng).
//   · DẤU «đang lên bảng» (`.lv-lb-dau`): viên rất nhỏ màu đội NẰM CẠNH thẻ tên (anh em trong dải, không lồng trong thẻ); chỉ hiện lúc em còn đang lên bảng
//     (thầy chưa chấm, chưa mở đáp án). Dải hẹp (bảng đang nhường giấy) ⇒ dấu chỉ còn hình, chữ nằm ở nhãn cho trình đọc màn.
//   · TẤM GIỮA MÀN (`TamLenBang`): màu ĐỘI của em được gọi, tên gọi + «lên bảng» + tên đội; hiện `GIUA_MS` rồi tự THU NHỎ (`THU_MS`, chỉ transform +
//     opacity) bay về đúng chỗ dấu. Không chặn chạm, không dịch bố cục, bề ngang ≤ 40 % hình. Máy của CHÍNH em được gọi: «Em lên bảng».
//     Máy yếu / giảm chuyển động ⇒ không bay: tấm tắt, dấu hiện.
// LUẬT PHÁT (mốc `lucBang` trong LopLive.tsx): chỉ phát khi lời gọi MỚI tới lúc lớp live đang chạy trên máy. Em vào muộn / nối lại lúc đã có bạn đang lên bảng ⇒ không
// phát lại (chỉ thẻ + dấu). Gọi em khác ⇒ tấm mới THAY tấm cũ (một tấm). Em đang rời màn quá 3 giây mới về ⇒ chỉ còn thẻ + dấu.
// AN TOÀN: chỉ dùng `viewEm.luot.goi` (tên, đội, đã chấm chưa) — thứ cả lớp vốn thấy trên màn chiếu. Không đáp án; kết quả chấm không hiện ở đây.
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { DOI_BPU, tenNgan, type ViewEm } from '../../lib/bpu/phong'

/** Tấm giữa màn đứng ngần này (ms) · thu nhỏ về dấu trong ngần này (ms). */
export const GIUA_MS = 3000, THU_MS = 400

export interface EmLenBang {
  /** Khoá của LỜI GỌI (lượt + em): đổi ⇒ lời gọi mới. */
  khoa: string
  /** Tên gọi hai chữ. */
  ten: string
  doi: number
  /** Máy này là của chính em được gọi. */
  laEm: boolean
  /** Em còn ĐANG lên bảng (thầy chưa chấm, chưa mở đáp án). */
  dang: boolean
}
/** Em được gọi lên bảng của lượt (từ `viewEm.luot`); không có lời gọi ⇒ null. `sbd` = số báo danh của em đang cầm máy. */
export function emLenBang(l: ViewEm['luot'] | undefined, sbd: string | null | undefined): EmLenBang | null {
  const g = l?.goi
  if (!l || !g) return null
  return { khoa: `${l.so}:${g.sbd}`, ten: tenNgan(g.ten), doi: g.doi, laEm: !!sbd && g.sbd === sbd, dang: l.pha !== 'mo' && g.dat == null }
}
/** Khoá «đang lên bảng» để so lời gọi mới (rỗng = không ai đang lên bảng). */
export const khoaDang = (em: EmLenBang | null | undefined): string => (em && em.dang ? em.khoa : '')

const mauDoi = (doi: number): CSSProperties => ({ ['--doi' as string]: `var(${DOI_BPU[doi]?.mau ?? '--tr-chieu-giay'})` })
const tenDoi = (doi: number): string => DOI_BPU[doi]?.ten ?? ''
/** Chữ trên dấu: mọi máy cùng «đang lên bảng» (dấu giữ nhỏ); máy của chính em được gọi khác ở tấm giữa màn («Em lên bảng») và ở nhãn đọc màn. */
const nhanDau = (em: EmLenBang): string => (em.laEm ? 'Em đang lên bảng' : 'đang lên bảng')
const BtBang = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M12 16v4M8 20h8" /></svg>

/** Pha của tấm giữa màn theo mốc phát `luc` (0 = không phát): 'giua' ⇒ 'thu' ⇒ ''. Mốc đổi (gọi em khác) ⇒ bắt đầu lại; mốc về 0 (hết lượt gọi) ⇒ tắt ngay. */
export function usePhaLenBang(luc: number): 'giua' | 'thu' | '' {
  const tinh = (): 'giua' | '' => (luc > 0 && Date.now() - luc < GIUA_MS ? 'giua' : '')
  const [pha, setPha] = useState<'giua' | 'thu' | ''>(tinh)
  const [truoc, setTruoc] = useState(luc)
  if (luc !== truoc) { setTruoc(luc); setPha(tinh()) }
  useEffect(() => {
    if (pha === 'giua') { const h = setTimeout(() => setPha('thu'), Math.max(0, luc + GIUA_MS - Date.now())); return () => clearTimeout(h) }
    if (pha === 'thu') { const h = setTimeout(() => setPha(''), THU_MS + 40); return () => clearTimeout(h) }
    return undefined
  }, [pha, luc])
  return pha
}

/** Nội dung DẢI trên khung bảng: thẻ tên + (lúc còn đang lên bảng) dấu nhỏ nằm cạnh. `cho` = tấm giữa màn còn đứng ⇒ dấu giữ chỗ nhưng chưa hiện. */
export function TheLenBang({ em, cho, dau }: { em: EmLenBang; cho: boolean; dau: RefObject<HTMLSpanElement | null> }) {
  const doi = tenDoi(em.doi)
  return (
    <>
      <span className="lv-lb-the" style={mauDoi(em.doi)} role="img" aria-label={`${em.laEm ? 'Em' : `Bạn ${em.ten}`} lên bảng${doi ? ` · ${doi}` : ''}`}><i aria-hidden="true" /><b aria-hidden="true">{em.ten}</b></span>
      {em.dang ? <span ref={dau} className="lv-lb-dau" style={mauDoi(em.doi)} data-cho={cho || undefined} role="img" aria-label={nhanDau(em)}><BtBang /><em aria-hidden="true">đang lên bảng</em></span> : null}
    </>
  )
}

/** TẤM GIỮA MÀN. `rong` = bề ngang hình (px) để cỡ chữ theo khổ máy (hình có thể đang xoay bằng CSS nên không dùng vw). `dau` = dấu nhỏ để bay về. */
export function TamLenBang({ em, pha, rong, dau, dong }: { em: EmLenBang; pha: 'giua' | 'thu'; rong: number; dau: RefObject<HTMLSpanElement | null>; /** false = máy yếu / giảm chuyển động */ dong: boolean }) {
  const tam = useRef<HTMLDivElement>(null)
  // Thu nhỏ: đo chỗ dấu theo toạ độ của HÌNH (cộng dồn offset tới gốc `.lv` — không dùng getBoundingClientRect vì hình có thể xoay 90° bằng CSS).
  // Lúc đo (offset buộc trình duyệt tính kiểu) tấm phải CÒN RÕ: độ mờ 0 chỉ đi cùng `data-thu` (bay, có chuyển tiếp) hoặc `data-tat` (máy yếu, tắt thẳng) —
  // gắn độ mờ 0 vào `data-pha="thu"` thì tấm tắt phụt trước khi kịp bay (chuyển tiếp không còn gì để chạy).
  useLayoutEffect(() => {
    const t = tam.current
    if (pha !== 'thu' || !t || !dong) return
    let dx = 0, dy = -24, k = 0.3
    const d = dau.current, goc = t.offsetParent
    if (d && goc) {
      let x = d.offsetWidth / 2, y = d.offsetHeight / 2
      for (let n: HTMLElement | null = d; n && n !== goc; n = n.offsetParent as HTMLElement | null) { x += n.offsetLeft; y += n.offsetTop }
      // tấm đặt ở left / top 50 % rồi dời −50 % ⇒ tâm tấm = (offsetLeft, offsetTop)
      dx = x - t.offsetLeft; dy = y - t.offsetTop
      k = Math.max(0.12, Math.min(0.6, d.offsetWidth / Math.max(1, t.offsetWidth)))
    }
    t.style.setProperty('--lb-dx', `${dx.toFixed(1)}px`); t.style.setProperty('--lb-dy', `${dy.toFixed(1)}px`); t.style.setProperty('--lb-k', k.toFixed(3))
    t.setAttribute('data-thu', '')
  }, [pha, dau, dong])
  const doi = tenDoi(em.doi)
  return (
    <div ref={tam} className="lv-lb-tam" data-pha={pha} data-tat={(pha === 'thu' && !dong) || undefined} data-em={em.laEm || undefined} role="status" style={{ ...mauDoi(em.doi), '--lb-w': rong } as CSSProperties}>
      {em.laEm ? <><b>Em lên bảng</b><span>{em.ten}{doi ? ` · ${doi}` : ''}</span></> : <><small>{doi}</small><b>{em.ten}</b><span>lên bảng</span></>}
    </div>
  )
}
