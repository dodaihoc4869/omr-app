import { useId } from 'react'
import type { SanhHoa2 } from '../hoa2/api'
import './ban-do-hanh-trinh.css'

/** Tên hiển thị: không đưa mã chiến dịch nội bộ lên đảo khi máy chủ chưa đặt tên. */
export function tenDaoHanhTrinh(s: SanhHoa2 | null) {
  const ten = s?.chienDich?.ten.trim() ?? ''
  return !ten || /^#?cd[\w-]*$/i.test(ten) || ten === s?.chienDich?.id
    ? 'Quần đảo Bát Linh' : `Đảo ${ten}`
}

/** Cảnh sơn thủy dùng dữ liệu thật. Không vòng vẽ, thị sai hay ghi tiến độ. */
export default function BanDoHanhTrinh({ s }: { s: SanhHoa2 | null }) {
  const id = useId()
  const cd = s?.chienDich
  const p = cd && cd.tong > 0 ? Math.round(100 * Math.max(0, Math.min(cd.coXat, cd.tong)) / cd.tong) : 0
  const khoa = !!s?.khoaDao
  const tt = !s ? 'cho' : s.doan.con > 0 ? 'a' : s.theLuc.tong > 0 && s.theLuc.con === 0 ? 'c' : 'b'
  const soO = Math.max(0, Math.min(6, Math.floor(s?.doan.con ?? 0)))
  const diem = [[128, 361], [137, 312], [177, 271], [226, 285], [264, 244], [286, 199]]
  const ten = tenDaoHanhTrinh(s)
  return <section className="h2-ban-do bl-hanh-trinh" data-khoa-dao={String(khoa)} data-tt={tt} data-thi-sai="tat" aria-label="Bản đồ hành trình Bát Linh">
    <header className="bl-hanh-trinh__dau">
      <span className="bl-eyebrow">BẢN ĐỒ BÁT LINH</span>
      <h2>{ten}</h2>
      <p>Hộ tống Linh Tâm · Khám phá tri thức</p>
    </header>
    <div className="bl-hanh-trinh__tranh">
      <svg viewBox="-12 -14 424 522" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id={`${id}-tan`}><stop offset=".65" stopColor="black" /><stop offset="1" stopColor="white" /></radialGradient>
          <mask id={`${id}-suong`}><rect x="-12" y="-14" width="424" height="360" fill="white" /><circle data-ve="lo-khai-pha" cx="199" cy="306" r={Math.round(34 + p * 2.6)} fill={`url(#${id}-tan)`} /></mask>
        </defs>
        <image className="bl-hanh-trinh__nen" href="/bat-linh/ban-do-dao-nho.webp" x="-12" y="-14" width="424" height="522" preserveAspectRatio="none" />
        <path className="bl-hanh-trinh__duong" d="M118 408 Q109 352 130 298 Q156 265 179 251 Q204 264 226 283 Q274 281 276 221 Q264 188 289 154 L337 82" />
        <g data-ve="suong" data-phan-tram={p} opacity={p >= 100 ? 0 : 1}>
          <rect className="bl-hanh-trinh__suong" x="-12" y="-14" width="424" height="360" mask={`url(#${id}-suong)`} />
        </g>
        <g data-ve="o-phuc-kich" data-so={s?.doan.con ?? 0}>{diem.slice(0, soO).map(([x, y], i) => <g key={i} transform={`translate(${x} ${y})`}>
          <circle r="12" fill="rgb(112 44 72)" stroke="rgb(251 207 146)" strokeWidth="2" />
          <path d="M-4 -5 4 5M4 -5-4 5" stroke="rgb(255 239 212)" strokeWidth="2.5" strokeLinecap="round" />
        </g>)}</g>
        <g data-ve={khoa ? 'cau-keo-len' : 'cau-ha'} transform="translate(202 261)">
          <circle r="17" fill="rgb(21 71 59)" stroke="rgb(246 209 129)" strokeWidth="2" />
          {khoa ? <path d="M-5-1v-4a5 5 0 0 1 10 0v4M-7-1H7V9H-7Z" fill="none" stroke="rgb(255 224 156)" strokeWidth="2" /> : <path d="m-7 0 5 5 10-11" fill="none" stroke="rgb(255 224 156)" strokeWidth="3" strokeLinecap="round" />}
        </g>
        <ellipse cx="118" cy="416" rx="39" ry="6" fill="rgb(12 39 30 / .35)" />
        <image href="/bat-linh/xe-linh-tam.webp" x="75" y="352" width="96" height="64" />
        <circle cx="115" cy="357" r="10" fill="rgb(171 242 205)" stroke="rgb(248 220 149)" strokeWidth="2" />
      </svg>
      <span className="bl-hanh-trinh__ben">Bến Hộ Tống · Linh Tâm của lớp</span>
      <span className="bl-hanh-trinh__tien-do">{cd ? `${ten} · ${p}% đã khai phá` : 'Hành trình tri thức của em'}</span>
    </div>
    <div className="bl-hanh-trinh__thong-tin">
      <p className="bl-hanh-trinh__cau" data-khoa={String(khoa)}>{!s ? 'Đang mở bản đồ…' : khoa ? (s.loiKhoaDao || 'Hoàn thành câu ôn ở Đoàn để mở cầu') : 'Cầu sang đảo đã hạ'}</p>
      {s && <dl>
        <div><dt><i className="bl-hanh-trinh__cham" />Ổ phục kích</dt><dd>{s.doan.con} câu ôn còn lại</dd></div>
        <div><dt><i className="bl-hanh-trinh__cham bl-hanh-trinh__cham--suong" />Sương mù</dt><dd>{s.dao.con} câu mới còn lại</dd></div>
      </dl>}
    </div>
  </section>
}
