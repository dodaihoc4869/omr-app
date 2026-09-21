// THANH ĐÁY KIỂU APPLE của MÀN CHÍNH app phụ huynh (mẫu docs/ban-ve-ph-apple-2109/ph-b-man-chinh.html): thanh nền mờ dính đáy, MỘT nút "Giao thêm bài cho con" (cao ≥ 52, bo 14), dòng lượt còn lại dưới nút.
// Kết quả (đã giao / từ chối / lỗi thật của máy chủ) hiện NGAY TRÊN nút; hết lượt ⇒ nút mờ + "Hôm nay đã giao đủ 3 lượt, mai giao tiếp được". Mọi chữ do giao-them-hien-thi (số thật, chủ ngữ "A.I Đỗ Đại Học"). Bảng "Mọi thứ về con" vẫn dùng ThanhDay cũ.
import { useLayoutEffect, useRef } from 'react'
import '../m3'
import './ph-apple.css'
import { chuGoiGanNhat, chuLuot } from '../../lib/giao-them-hien-thi'
import type { ViewGiaoThem } from '../../lib/use-giao-them'
import { BtChamThan, BtGui, BtTich } from './BieuTuongAp'

export default function ThanhDayAp({ giaoThem }: { giaoThem: ViewGiaoThem }) {
  const day = useRef<HTMLDivElement>(null)
  // Chiều cao thật của thanh (thẻ kết quả có thể cao) ⇒ chừa đúng chỗ cuối màn để không che thẻ cuối. Máy không có ResizeObserver ⇒ để mặc định trong CSS.
  useLayoutEffect(() => {
    const el = day.current
    const goc = el?.closest<HTMLElement>('.phm-ap')
    if (!el || !goc || typeof ResizeObserver === 'undefined') return
    const dat = () => goc.style.setProperty('--phm-ap-day-cao', `${el.offsetHeight}px`)
    const ro = new ResizeObserver(dat)
    ro.observe(el)
    dat()
    return () => {
      ro.disconnect()
      goc.style.removeProperty('--phm-ap-day-cao')
    }
  }, [])

  const hetLuot = giaoThem.conLai === 0
  const daGiao = giaoThem.the?.kieu === 'da_giao' && !giaoThem.dangGui
  const luot = daGiao ? '' : chuLuot(giaoThem.conLai)
  const the = giaoThem.the && !giaoThem.dangGui ? giaoThem.the : null
  return (
    <div ref={day} className="phm-ap-day" data-vung="thanh-day">
      <div className="phm-ap-day__trong">
        {the && (
          <div className="phm-ap-xong" role={the.kieu === 'loi' ? 'alert' : 'status'} data-kieu={the.kieu} data-vung="the-giao-them">
            {the.kieu === 'da_giao' ? <BtTich /> : <BtChamThan />}
            <div>
              <p>{the.tieuDe}</p>
              {the.dong.map((d, i) => (
                <small key={i}>{d}</small>
              ))}
              {the.cuoi && <small>{the.cuoi}</small>}
            </div>
          </div>
        )}
        {giaoThem.goiGanNhat && !the && !giaoThem.dangGui && (
          <p className="phm-ap-day__phu phm-ap-day__phu--goi" data-vung="goi-gan-nhat">
            {chuGoiGanNhat(giaoThem.goiGanNhat)}
          </p>
        )}
        <button type="button" className="phm-ap-nut" data-vung="giao-them" disabled={giaoThem.dangGui || hetLuot} aria-busy={giaoThem.dangGui || undefined} onClick={giaoThem.giao}>
          <BtGui />
          <span>{giaoThem.dangGui ? 'Đang chọn câu…' : 'Giao thêm bài cho con'}</span>
        </button>
        {luot && (
          <p className="phm-ap-day__phu" data-vung="luot-giao">
            <span>{luot}</span>
            {!hetLuot && (
              <>
                <i aria-hidden="true"> · </i>
                <span>A.I Đỗ Đại Học chọn câu hợp với con</span>
              </>
            )}
          </p>
        )}
      </div>
    </div>
  )
}
