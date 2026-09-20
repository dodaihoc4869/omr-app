import { useEffect, useState } from 'react'
import { conLaiCa, dinhDangDongHo } from '../lib/con-lai-ca'
import { gioMayChu } from '../lib/gio-may-chu'

/** THẺ THỜI GIAN của màn theo dõi ca (G4, bản vẽ docs/ban-ve-app-giao-vien-2109/2-ca-thi.jpg).
 *  CHỈ HIỂN THỊ: không gọi máy chủ, không ghi gì. Đồng hồ đếm ngược chỉ có khi ca có MỘT giờ hết chung (đã bấm Bắt đầu thi + đồng bộ
 *  giờ cả phòng); ca tính giờ riêng từng em thì nói thẳng như vậy chứ không bịa số. Chạy theo GIỜ MÁY CHỦ (`gioMayChu`). */
export interface CaGioHienThi {
  trangThai: 'mo' | 'dong' | 'da_xoa'
  phongCho?: boolean
  batDauThiLuc?: string
  dongBoGio?: boolean
  thoiGianPhut: number
  hetHanVao?: string
}

function gioPhut(iso: string): string {
  const d = new Date(iso)
  return Number.isFinite(d.getTime()) ? d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''
}

export default function KhoiThoiGianCa({ ca }: { ca: CaGioHienThi }) {
  const [now, setNow] = useState(() => gioMayChu())
  const coChung = conLaiCa(ca, gioMayChu()) !== null
  useEffect(() => {
    if (!coChung) return
    setNow(gioMayChu())
    const t = setInterval(() => setNow(gioMayChu()), 1000)
    return () => clearInterval(t)
  }, [coChung])
  const cl = conLaiCa(ca, now)
  const daHet = cl !== null && cl.conLaiMs === 0
  let so: string
  let phu: string
  if (cl) {
    so = dinhDangDongHo(cl.conLaiMs)
    phu = daHet ? `hết giờ chung lúc ${gioPhut(cl.hetLuc)} · ${ca.thoiGianPhut} phút` : `còn lại · ${ca.thoiGianPhut} phút`
  } else if (ca.trangThai === 'dong') {
    so = `${ca.thoiGianPhut} phút`
    phu = 'ca đã đóng'
  } else if (ca.phongCho && !ca.batDauThiLuc) {
    so = `${ca.thoiGianPhut} phút`
    phu = 'chưa bắt đầu · em đang ở phòng chờ'
  } else {
    so = `${ca.thoiGianPhut} phút`
    phu = `mỗi em tính giờ riêng · vào phòng đến ${ca.hetHanVao ? gioPhut(ca.hetHanVao) : 'không giới hạn'}`
  }
  return (
    <section className="ca-gio" aria-label="Thời gian ca thi" data-co-chung={cl ? 'co' : 'khong'}>
      <h2 className="ca-nhan-nho">THỜI GIAN</h2>
      <div className="ca-gio-hang">
        <span className="ca-gio-so" role="timer" aria-live="off">
          {so}
        </span>
        <span className="ca-gio-phu">{phu}</span>
      </div>
    </section>
  )
}
