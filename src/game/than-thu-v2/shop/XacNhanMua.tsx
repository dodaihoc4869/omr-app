// MÀN 3 · XÁC NHẬN — tấm phủ MỘT bước cho việc không hoàn tác được: mua phụ kiện [X2] hoặc đổi EXP lấy vàng [X1]. Hai nút: "Để sau" + việc chính.
// Chống bấm đúp: nút khoá ngay khi đang gửi (nơi gọi còn giữ cờ đồng bộ). Lỗi: lời máy chủ ngay trong tấm phủ, nút chính đổi thành "Thử lại"
// (nút, khối lỗi đều CÓ SẴN nên tấm phủ không nở ra). Esc = "Để sau"; Tab quay vòng trong tấm phủ.
import { useEffect, useId, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import { DongVang } from './bieu-tuong'
import { HuyHieuBac } from './chung'
import { TEN_O, chuDeSau, chuDoiVang, chuNutDoiXacNhan, chuNutMua, chuThuLai, chuXacNhanDoi, chuXacNhanMua } from './chu-shop'
import type { MonShop } from './kieu'
import { ngayAnCua } from './logic-shop'

export type ViecXacNhan = { loai: 'mua'; mon: MonShop; vang: number } | { loai: 'doi'; soExp: number; ongNghiem: number; giuLai: number }

export interface XacNhanMuaProps {
  viec: ViecXacNhan
  dangGui: boolean
  /** Lời máy chủ khi lần gửi trước hỏng; rỗng ⇒ chưa có lỗi. */
  loi: string
  onXacNhan: () => void
  onDeSau: () => void
}

export default function XacNhanMua({ viec, dangGui, loi, onXacNhan, onDeSau }: XacNhanMuaProps) {
  const idChu = useId()
  const goc = useRef<HTMLDivElement>(null)
  const chinh = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    chinh.current?.focus({ preventScroll: true }) // tiêu điểm vào nút chính; trả tiêu điểm về nút đã mở hộp do ManShop làm (phần phía sau đã bị `inert` nên không tự nhớ được)
  }, [])
  const phim = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape' && !dangGui) {
      e.stopPropagation()
      onDeSau()
      return
    }
    if (e.key !== 'Tab') return
    const nut = [...(goc.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])]
    if (nut.length === 0) {
      e.preventDefault()
      return
    }
    const dau = nut[0]!
    const cuoi = nut[nut.length - 1]!
    const dangO = document.activeElement
    if (e.shiftKey && dangO === dau) {
      e.preventDefault()
      cuoi.focus()
    } else if (!e.shiftKey && dangO === cuoi) {
      e.preventDefault()
      dau.focus()
    }
  }
  const laMua = viec.loai === 'mua'
  return (
    <div className="ps-phu" onClick={(e) => e.target === e.currentTarget && !dangGui && onDeSau()}>
      <div ref={goc} className="ps-to ps-kinh" role="dialog" aria-modal="true" aria-labelledby={idChu} data-viec={viec.loai} onKeyDown={phim}>
        {viec.loai === 'mua' ? (
          <div className={`ps-to-dau ps-bac-${viec.mon.bac}`}>
            <HuyHieuBac bac={viec.mon.bac} them={` · ${TEN_O[viec.mon.oGan]}`} />
            <h3>{viec.mon.ten}</h3>
          </div>
        ) : (
          <div className="ps-to-dau">
            <DongVang c={26} />
            <h3>{chuDoiVang}</h3>
          </div>
        )}
        <p id={idChu} className="ps-to-chu ps-so">
          {viec.loai === 'mua' ? chuXacNhanMua(viec.mon.gia, viec.vang - viec.mon.gia) : chuXacNhanDoi(viec.soExp, ngayAnCua(viec.ongNghiem - viec.soExp, viec.giuLai))}
        </p>
        <div className="ps-to-loi" role="alert">
          {loi}
        </div>
        <div className="ps-hai-nut">
          <button type="button" className="ps-nut-mo" data-viec="de-sau" disabled={dangGui} onClick={onDeSau}>
            {chuDeSau}
          </button>
          <button ref={chinh} type="button" className="ps-nut-vang" data-viec={laMua ? 'mua-that' : 'doi-that'} disabled={dangGui} aria-busy={dangGui} onClick={onXacNhan}>
            <span className="ps-so">{loi ? chuThuLai : laMua ? chuNutMua((viec as Extract<ViecXacNhan, { loai: 'mua' }>).mon.gia) : chuNutDoiXacNhan((viec as Extract<ViecXacNhan, { loai: 'doi' }>).soExp)}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
