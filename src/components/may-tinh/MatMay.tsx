// MÁY TÍNH FX4869 — MẶT MÁY: màn tinh thể + bàn phím đúng bản vẽ. Chỉ vẽ `ManHinh` và báo phím; không giữ trạng thái tính toán.
import type { CSSProperties, PointerEvent as SuKienTro, ReactNode } from 'react'
import { MAU_CHIEU } from '../../lib/bpu/mau-chieu'
import { PHIM_HAM, PHIM_SO, type ManHinh, type PhimMay } from '../../lib/may-tinh/may'
import { VeBt, VeKq } from './VeBt'
import './may-tinh.css'

/** Bề ngang / bề cao máy tính theo đơn vị --u. */
export const MT_RONG = 318, MT_CAO = 538
const LOI = { toan: 'Lỗi toán học', 'cu-phap': 'Lỗi cú pháp' } as const
export interface PropsMatMay {
  mh: ManHinh; /** px của một đơn vị */ u: number; trai: number; tren: number
  /** mã phím vừa bấm (viền sáng) */ sang?: string
  /** không truyền ⇒ máy chỉ xem */ onPhim?: (ma: string) => void
  keo?: { onPointerDown: (e: SuKienTro<HTMLDivElement>) => void; onPointerMove: (e: SuKienTro<HTMLDivElement>) => void; onPointerUp: (e: SuKienTro<HTMLDivElement>) => void; onPointerCancel: (e: SuKienTro<HTMLDivElement>) => void }
  goc?: (e: HTMLDivElement | null) => void
}
export function MatMay({ mh, u, trai, tren, sang, onPhim, keo, goc }: PropsMatMay) {
  const bam = (ma: string) => (onPhim ? { onPointerDown: (e: SuKienTro) => { e.preventDefault(); onPhim(ma) } } : {})
  const phim = (p: PhimMay, them = ''): ReactNode => (
    <button key={p.ma} type="button" tabIndex={-1} className={`mtx-p ${p.lop ?? ''}${them}`} data-sang={sang === p.ma ? '' : undefined} aria-label={p.chu} {...bam(p.ma)}>
      {p.s || p.a ? <small>{p.s ? <span className="s">{p.s}</span> : null}{p.a ? <span className="a">{p.a}</span> : null}</small> : null}{p.chu}
    </button>
  )
  const dai = mh.kq ? (mh.kq.kieu === 'so' ? mh.kq.chu.length : mh.kq.nguyen.length + Math.max(mh.kq.tu.length, mh.kq.mau.length) + 1) > 13 : false
  return (
    <div ref={goc} className="mtx" data-xem={onPhim ? undefined : ''} role={onPhim ? 'application' : 'img'} aria-label="Máy tính Đỗ Đại Học FX4869" style={{ ...(MAU_CHIEU as CSSProperties), ['--u' as string]: `${u}px`, left: trai, top: tren }}>
      <div className="mtx-keo" {...keo}><span><i /><b className="mtx-ten">Đỗ Đại Học <em>FX4869</em></b></span><span><b className="mtx-pin" /></span></div>
      <div className="mtx-lcd">
        <div className="mtx-den">{mh.den.map((d) => <span key={d}>{d}</span>)}<span className="phai">{mh.phai.replace('-', '−')}</span></div>
        {mh.kieu === 'ds' ? <div className="mtx-ds"><b>{mh.tieuDe}</b><ul>{mh.ds.map((d) => <li key={d}>{d}</li>)}</ul></div> : (
          <>
            <div className="mtx-bt">{mh.nhan ? <span className="nh">{mh.nhan}</span> : null}<VeBt bt={mh.bt} ct={mh.ct} /></div>
            <div className="mtx-kq" data-dai={dai ? '' : undefined} data-loi={mh.loi ? '' : undefined}>{mh.loi ? LOI[mh.loi] : mh.kq ? <VeKq kq={mh.kq} /> : ' '}</div>
          </>
        )}
      </div>
      <div className="mtx-dau">
        <button type="button" tabIndex={-1} className="mtx-p sh" data-bat={mh.den.includes('S') ? '' : undefined} data-sang={sang === 'SHIFT' ? '' : undefined} {...bam('SHIFT')}>SHIFT</button>
        <button type="button" tabIndex={-1} className="mtx-p al" data-bat={mh.den.includes('A') ? '' : undefined} data-sang={sang === 'ALPHA' ? '' : undefined} {...bam('ALPHA')}>ALPHA</button>
        <span className="mtx-dpad">
          <s className="mt-u" /><s className="mt-d" /><s className="mt-l" /><s className="mt-r" />
          {(['U', 'D', 'L', 'R'] as const).map((h) => <button key={h} type="button" tabIndex={-1} data-h={h} data-sang={sang === h ? '' : undefined} aria-label={{ U: 'Lên', D: 'Xuống', L: 'Sang trái', R: 'Sang phải' }[h]} {...bam(h)} />)}
        </span>
        {phim({ ma: 'MENU', chu: 'MENU' })}{phim({ ma: 'ON', chu: 'ON' })}
      </div>
      {PHIM_HAM.map((h, k) => <div key={k} className="mtx-hang h6">{h.map((p) => phim(p))}</div>)}
      {PHIM_SO.map((h, k) => <div key={k} className={`mtx-hang h5${k ? '' : ' dau'}`}>{h.map((p) => phim(p, p.ma === 'e10' || p.ma === 'ans' ? ' nho' : ''))}</div>)}
    </div>
  )
}
