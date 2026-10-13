// HỘP HỎI THẦY (thầy 13/10): thẻ bo tròn nảy lên giữa nền mờ (điện thoại: sát đáy), đầu thẻ "Hỏi Thầy · Câu n", đề câu trong ô gấp/mở được,
// hội thoại hỏi Thầy (HoiThemThay) ở dưới. Esc / nút đóng để thoát (bấm nền KHÔNG đóng: tránh mất câu đang gõ); tiêu điểm trả về chỗ đã mở.
// `onMoLoiGiai`: nơi chỉ có MỘT nút Hỏi thầy (phiếu bài làm) ⇒ thêm lối sang lời giải từng bước ngay trong hộp.
// `dangLam`: em đang làm câu, chưa nộp ⇒ một dòng báo Thầy chỉ gợi hướng; không có lối sang lời giải.
// Vẽ qua portal vào <body>: thẻ câu trong game/màn cuộn có transform ⇒ `position: fixed` lệch khỏi màn nếu nằm trong thẻ.
// `cau = null` (tốc độ, thầy 13/10): hộp mở NGAY lúc em bấm, đề câu đang tới ⇒ ba vạch chờ; ô nhắn dùng `qid` của nút (gõ trước được).
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { BookOpenText, MessageCircleQuestion, X } from 'lucide-react'
import type { CauChoKhung } from '../../lib/loi-giai-api'
import HoiThemThay from './HoiThemThay'
import { ChemText } from '../../lib/chem-format'
import { chuHoa } from './TraLoiThay'
import './loi-giai.css'
import './hop-hoi-thay.css'

/** ĐỀ CHUẨN (bản vẽ docs/ban-ve-hoi-thay-1310, thầy chốt 13/10: "giao diện đề chuẩn theo hiển thị của đề bài"): máy chủ gửi đề dạng HTML đã thoát
 *  (`deHtml`: đoạn chữ + bảng + hình) ⇒ tách ĐOẠN CHỮ để vẽ như màn làm bài ("Câu n." đậm, công thức hạ chỉ số qua ChemText), phần bảng/hình
 *  giữ nguyên HTML. Không tách được (máy chủ đổi khuôn) ⇒ giữ HTML như cũ. */
function chuCuaHtml(html: string): string {
  try {
    const d = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html').body.firstElementChild
    if (!d) return ''
    d.querySelectorAll('br').forEach((b) => b.replaceWith('\n'))
    return d.textContent ?? ''
  } catch { return '' }
}
function tachDe(html: string): { chu: string; con: string } | null {
  try {
    const goc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html').body.firstElementChild
    const p = goc?.firstElementChild
    if (!goc || !p || p.tagName !== 'P' || p.querySelector('img, table')) return null
    p.querySelectorAll('br').forEach((b) => b.replaceWith('\n'))
    const chu = (p.textContent ?? '').trim()
    p.remove()
    return chu ? { chu, con: goc.innerHTML.trim() } : null
  } catch { return null }
}
const LOAI_CAU = { tn: 'Trắc nghiệm', ds: 'Đúng / Sai', tln: 'Trả lời ngắn' } as const

export default function HopHoiThay({ cau, qid = '', nguon, onDong, onTraLoi, onMoLoiGiai, dangLam = false }: { cau: CauChoKhung | null; qid?: string; nguon: string; onDong: () => void; onTraLoi?: () => void; onMoLoiGiai?: () => void; dangLam?: boolean }) {
  const id = useId()
  const dongRef = useRef(onDong)
  dongRef.current = onDong
  useEffect(() => {
    const truoc = document.activeElement as HTMLElement | null
    const phim = (e: KeyboardEvent) => { if (e.key === 'Escape') dongRef.current() }
    window.addEventListener('keydown', phim)
    return () => { window.removeEventListener('keydown', phim); truoc?.focus?.() }
  }, [])
  const y = cau ? Object.entries(cau.y) : []
  const de = useMemo(() => (cau ? tachDe(cau.de) : null), [cau?.de]) // eslint-disable-line react-hooks/exhaustive-deps
  const loai = !y.length ? 'tln' : /^[A-D]$/.test(y[0]![0]) ? 'tn' : 'ds'
  const yChu = useMemo(() => y.map(([k, t]) => [k, chuCuaHtml(t)] as const), [cau?.y]) // eslint-disable-line react-hooks/exhaustive-deps
  const ngan = loai === 'tn' && yChu.every(([, t]) => t.length <= 24)
  // Đề mở sẵn lúc em chưa hỏi; Thầy trả lời câu đầu ⇒ gập thành một dòng nhường chỗ cho lời giải (chạm để mở lại).
  const [deMo, setDeMo] = useState(true)
  return createPortal(
    <div className="lg-hh-nen m3">
      <div className="lg-hh" role="dialog" aria-modal="true" aria-labelledby={`${id}-t`}>
        <header className="lg-hh-dau">
          <span className="lg-hh-hinh" aria-hidden="true"><MessageCircleQuestion size={22} strokeWidth={2.2} /></span>
          <div className="lg-hh-ten">
            <h2 id={`${id}-t`} className="lg-hh-tieu-de">Hỏi Thầy</h2>
            <p className="lg-hh-phu">{cau ? `${cau.so}${cau.chuong ? ` · ${cau.chuong}` : ''}` : 'Đang mở đề câu…'}</p>
          </div>
          <button type="button" className="lg-hh-dong" onClick={onDong} aria-label="Đóng"><X size={20} strokeWidth={2.2} aria-hidden="true" /></button>
        </header>
        <details className="lg-hh-de" open={deMo} onToggle={(e) => setDeMo(e.currentTarget.open)}>
          <summary>
            Đề câu
            {!deMo && de && <span className="lg-de-tom">{de.chu.replace(/\s+/g, ' ')}</span>}
            {cau && <span className="lg-de-loai">{LOAI_CAU[loai]}</span>}
          </summary>
          <div className="lg-hh-de-than lg-de-chuan">
            {/* `cau.de`, chữ từng ý: máy chủ dựng từ chữ kho đã thoát HTML (như khung lời giải) — KHÔNG có đáp án */}
            {!cau ? (
              <div className="lg-hh-cho-de" role="status"><span className="sr-only">Đang mở đề câu</span><i /><i /><i /></div>
            ) : de ? (
              <>
                <p className="lg-de-chu"><b>{cau.so}.</b> <ChemText text={chuHoa(de.chu)} /></p>
                {de.con && <div className="lg-chu-de" dangerouslySetInnerHTML={{ __html: de.con }} />}
              </>
            ) : (
              <div className="lg-chu-de" dangerouslySetInnerHTML={{ __html: cau.de }} />
            )}
            {yChu.length > 0 && (
              <ul className="lg-de-pa" data-ds={loai === 'ds' || undefined} data-ngan={ngan || undefined}>
                {yChu.map(([k, t]) => <li key={k}><span className="lg-de-chu-cai" aria-hidden="true">{k}</span><span className="sr-only">{loai === 'ds' ? `Ý ${k}: ` : `Phương án ${k}: `}</span><span><ChemText text={chuHoa(t)} /></span></li>)}
              </ul>
            )}
          </div>
        </details>
        {dangLam && <p className="lg-hh-goi">Em đang làm câu này nên Thầy gợi hướng, chưa nói đáp án.</p>}
        {onMoLoiGiai && !dangLam && (
          <button type="button" className="lg-nut-loi-giai lg-hh-sang-giai" onClick={onMoLoiGiai}>
            <BookOpenText aria-hidden="true" size={18} strokeWidth={2} />
            <span>Xem lời giải từng bước</span>
          </button>
        )}
        <HoiThemThay qid={cau?.qid ?? qid} nguon={nguon} hop dangLam={dangLam} choDe={!cau} onTraLoi={() => { setDeMo(false); onTraLoi?.() }} />
      </div>
    </div>,
    document.body,
  )
}
