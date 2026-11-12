// MÁY TÍNH FX4869 — vẽ biểu thức «kiểu sách» từ dãy mã phím (phân số xếp tầng, căn có gạch trên, số mũ nhỏ phía trên) + con trỏ nhấp nháy.
import type { ReactNode } from 'react'
import type { Hien } from '../../lib/may-tinh/so'
import { cayBt, type Nut } from './cay-bt'

const rong = (o: Nut[]): boolean => !o.some((n) => n.k !== 'tro')
function ve(ds: Nut[], khoa: string): ReactNode[] {
  return ds.map((n, k) => {
    const id = `${khoa}${k}`
    if (n.k === 'tro') return <i key={id} className="mtx-tro" />
    if (n.k === 'c') return n.lop ? <span key={id} className={n.lop}>{n.c}</span> : <span key={id}>{n.c}</span>
    const o = (j: number): ReactNode => { const x = n.o[j] ?? []; return <>{ve(x, `${id}.${j}.`)}{rong(x) ? <span className="mtx-o" /> : null}</> }
    if (n.loai === 'ps{') return <span key={id} className="mtx-ps"><span>{o(0)}</span><span>{o(1)}</span></span>
    if (n.loai === 'hs{') return <span key={id}>{o(0)}<span className="mtx-ps"><span>{o(1)}</span><span>{o(2)}</span></span></span>
    if (n.loai === 'can{') return <span key={id} className="mtx-can"><i>√</i><span>{o(0)}</span></span>
    if (n.loai === 'can3{') return <span key={id} className="mtx-can"><i><sup>3</sup>√</i><span>{o(0)}</span></span>
    if (n.loai === 'cany{') return <span key={id} className="mtx-can"><i><sup>{o(0)}</sup>√</i><span>{o(1)}</span></span>
    if (n.loai === 'e10') return <span key={id}>×10<sup>{ve(n.o[0], `${id}.`)}</sup></span>
    return <sup key={id}>{o(0)}</sup>
  })
}
export function VeBt({ bt, ct }: { bt: readonly string[]; ct: number }) { return <>{ve(cayBt(bt, ct), 'b')}</> }

/** Chuỗi số của máy («-6,02E23») ⇒ chữ hiện: dấu trừ thật, ×10ⁿ. */
function chuSo(chu: string): ReactNode[] {
  return chu.split(/(E-?\d+)/).map((p, k) => (k % 2 ? <span key={k}>×10<sup>{p.slice(1).replace('-', '−')}</sup></span> : <span key={k}>{p.replace(/-/g, '−')}</span>))
}
export function VeKq({ kq }: { kq: Hien }) {
  if (kq.kieu === 'so') return <>{chuSo(kq.chu)}</>
  return <>{kq.am ? '−' : ''}{kq.nguyen}<span className="mtx-ps"><span>{kq.tu}</span><span>{kq.mau}</span></span></>
}
