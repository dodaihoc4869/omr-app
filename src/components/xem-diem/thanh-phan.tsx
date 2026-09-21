// BỘ THÀNH PHẦN CHUNG của "Xem điểm + báo cáo chi tiết" bản 2 (thầy chốt 21/09; bản vẽ docs/ban-ve-xem-diem-2109/bo-thanh-phan.html). Dùng cho HS · PH · GV.
// Chỉ VẼ: nhận số/chữ đã tính sẵn (lib/ket-qua-sau-nop.ts …), không chấm, không gọi mạng. Màu chỉ đọc biến --m3-* (xem-diem.css, gốc `<div className="m3 xd">`).
// Không emoji; biểu tượng lucide luôn kèm chữ hoặc aria-hidden; số dùng tabular-nums; đích chạm ≥ 48 px; con số nào cũng có nhãn.
import type { ReactNode } from 'react'
import { ArrowLeft, Check, Info, Lock, Minus, TrendingDown, TrendingUp, Users } from 'lucide-react'
import '../m3'
import './xem-diem.css'
import { soVn, type PhanKetQua, type TrangThaiCongBo } from '../../lib/ket-qua-sau-nop'

/** Chip so sánh với LẦN TRƯỚC CỦA CHÍNH EM (mũi tên + dấu + số; không xếp hạng, không so với bạn). `hieu === null` ⇒ ca đầu tiên. */
export function SoSanh({ hieu, truoc, ai = 'em' }: { hieu: number | null; truoc?: number; ai?: 'em' | 'con' }) {
  if (hieu === null) {
    return (
      <span className="xd-ss xd-ss--bang">
        <Info className="xd-i" aria-hidden="true" />
        <span>Đây là ca đầu tiên của {ai} nên chưa có lần trước để so</span>
      </span>
    )
  }
  const [lop, Bieu, dau] = hieu > 0 ? (['len', TrendingUp, '+'] as const) : hieu < 0 ? (['xuong', TrendingDown, '−'] as const) : (['bang', Minus, ''] as const)
  return (
    <span className={`xd-ss xd-ss--${lop}`}>
      <Bieu className="xd-i" aria-hidden="true" />
      <span className="xd-so">
        {dau}
        {soVn(Math.abs(hieu))} điểm so với lần trước của {ai}
        {truoc !== undefined ? ` (${soVn(truoc)})` : ''}
      </span>
    </span>
  )
}

/** Số lớn + vòng: điểm/10, đúng x/y câu, thời gian làm, so với lần trước. Dòng nào không có số thật thì bỏ. */
export function KetQuaSoLon({
  diem,
  dung,
  tong,
  lam,
  de,
  ss,
  truoc,
  ai = 'em',
  nop,
}: {
  diem: number
  dung: number
  tong: number
  lam?: string | null
  de?: string | null
  /** `undefined` = không có dữ liệu lần trước (ẩn chip); `null` = ca đầu tiên; số = chênh điểm. */
  ss?: number | null
  truoc?: number
  ai?: 'em' | 'con'
  nop?: string
}) {
  const r = 52
  const cv = 2 * Math.PI * r
  const dat = (Math.max(0, Math.min(10, diem)) / 10) * cv
  return (
    <section className="xd-the xd-kq" aria-labelledby="xd-t-kq">
      <div className="xd-vong" role="img" aria-label={`Điểm ${soVn(diem)} trên 10`}>
        <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
          <circle className="nen" cx="60" cy="60" r={r} />
          <circle className="dat" cx="60" cy="60" r={r} strokeDasharray={`${dat.toFixed(1)} ${cv.toFixed(1)}`} />
        </svg>
        <div className="xd-vong__so">
          <b>{soVn(diem)}</b>
          <span>trên 10 điểm</span>
        </div>
      </div>
      <div className="xd-kq__chi-tiet">
        <h2 id="xd-t-kq" className="xd-sr">
          Kết quả
        </h2>
        <p className="xd-kq__dong xd-so">
          {ai === 'con' ? 'Con' : 'Em'} làm đúng {dung}/{tong} câu
        </p>
        {(lam || de) && (
          <p className="xd-kq__phu xd-so">
            {lam ? `Thời gian làm ${lam}` : ''}
            {lam && de ? ' ' : ''}
            {de ? `(đề cho ${de})` : ''}
          </p>
        )}
        {nop && <p className="xd-kq__phu xd-so">{nop}</p>}
        {ss !== undefined && <SoSanh hieu={ss} truoc={truoc} ai={ai} />}
      </div>
    </section>
  )
}

/** Chip trạng thái công bố. */
export function ChipCongBo({ tt }: { tt: TrangThaiCongBo }) {
  if (tt === 'da_cong_bo')
    return (
      <span className="xd-chip xd-chip--ok">
        <Check className="xd-i" aria-hidden="true" />
        Đã có điểm
      </span>
    )
  if (tt === 'ca_lop')
    return (
      <span className="xd-chip xd-chip--cho">
        <Users className="xd-i" aria-hidden="true" />
        Chờ cả lớp nộp
      </span>
    )
  return (
    <span className="xd-chip xd-chip--khoa">
      <Lock className="xd-i" aria-hidden="true" />
      Thầy chưa công bố điểm
    </span>
  )
}

/** Hai trạng thái CHƯA có điểm (luật công bố `CongBoDiem`): KHÔNG lộ điểm, đáp án, lời giải. */
export function TrangThaiChuaCoDiem({ kieu, nop, si, luc }: { kieu: 'ca_lop' | 'khong'; nop?: number; si?: number; luc?: string }) {
  const coTienDo = kieu === 'ca_lop' && typeof nop === 'number' && typeof si === 'number' && si >= nop && si > 0
  return (
    <section className="xd-the" aria-labelledby="xd-t-tt">
      <div className="xd-tt">
        <span className="xd-tt__o">{kieu === 'ca_lop' ? <Users className="xd-i xd-i--l" aria-hidden="true" /> : <Lock className="xd-i xd-i--l" aria-hidden="true" />}</span>
        <div>
          <h2 id="xd-t-tt">{kieu === 'ca_lop' ? 'Điểm hiện khi cả lớp nộp xong' : 'Thầy chưa công bố điểm'}</h2>
          <p>
            {kieu === 'ca_lop'
              ? `Bài của em đã được ghi nhận${luc ? ` lúc ${luc}` : ''}. Em không cần làm gì thêm — khi lớp nộp xong, điểm hiện ở đây.`
              : `Bài của em đã nộp${luc ? ` lúc ${luc}` : ''}. Khi thầy công bố, em thấy điểm ở đây và ở mục Xem điểm. Đáp án và lời giải cũng hiện lúc đó.`}
          </p>
        </div>
      </div>
      {coTienDo && (
        <div className="xd-tien-do">
          <div className="xd-tien-do__thanh" role="progressbar" aria-label="Số em đã nộp" aria-valuemin={0} aria-valuemax={si} aria-valuenow={nop}>
            <i style={{ width: `${(nop! / si!) * 100}%` }} />
          </div>
          <div className="xd-tien-do__nhan xd-so">
            <span>
              Đã nộp {nop}/{si} em
            </span>
            <span>Còn {si! - nop!} em</span>
          </div>
        </div>
      )}
    </section>
  )
}

/** Một phần (I/II/III): thanh + điểm/trần + số câu đúng (Phần II: đúng trọn + đúng một phần). Bản gọn (HS-1): không mở ra. */
export function PhanGon({ p }: { p: PhanKetQua }) {
  const dem = p.ma === 'II' ? `đúng trọn ${p.dung}/${p.tong} câu${p.motPhan > 0 ? `, ${p.motPhan} câu đúng một phần` : ''}` : `đúng ${p.dung}/${p.tong} câu`
  return (
    <div className="xd-phan">
      <div className="xd-phan__nut">
        <span className="xd-phan__ten">{p.ten}</span>
        <span className="xd-phan__diem xd-so">
          {soVn(p.diem)}
          <small>/{soVn(p.toiDa)} điểm</small>
        </span>
        <span className="xd-phan__thanh" role="img" aria-label={dem}>
          <i style={{ width: `${p.toiDa > 0 ? Math.min(100, (p.diem / p.toiDa) * 100) : 0}%` }} />
        </span>
        <span className="xd-phan__dem xd-so">{dem}</span>
      </div>
    </div>
  )
}

/** Nút của bộ: chính (đúng MỘT/màn) · tonal · chữ. `href` không dùng: mọi việc là nút. */
export function NutXd({ kieu = 'chinh', rong = false, bieuTuong, children, ...roi }: { kieu?: 'chinh' | 'tonal' | 'chu'; rong?: boolean; bieuTuong?: ReactNode; children: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...roi} className={`xd-nut xd-nut--${kieu}${rong ? ' xd-nut--rong' : ''}`}>
      {bieuTuong}
      {children}
    </button>
  )
}

/** Thanh trên của màn xem điểm (nút quay lại 48 px + tên + dòng phụ). */
export function ThanhTrenXd({ ten, phu, onQuayLai, quayLai = 'Quay lại' }: { ten: string; phu?: string; onQuayLai?: () => void; quayLai?: string }) {
  return (
    <header className="xd-tren">
      {onQuayLai && (
        <button type="button" className="xd-nut-tron" aria-label={quayLai} onClick={onQuayLai}>
          <ArrowLeft className="xd-i xd-i--l" aria-hidden="true" />
        </button>
      )}
      <div className="xd-tren-ten">
        <h1>{ten}</h1>
        {phu && <p>{phu}</p>}
      </div>
    </header>
  )
}

