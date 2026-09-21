import { useEffect, useState } from 'react'
import { gioPhutVN } from '../lib/em-toan-canh'
import { PHUT_MOI_LAN, cauKetQuaThemPhut, type KetQuaThemPhut } from '../lib/them-phut-api'
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
  /** 'baitap' = bài tập về nhà (hạn theo han_nop) — không có "thêm phút". */
  loai?: string
}

/** "Thêm 5 phút" (thầy duyệt 21/09, hợp đồng docs/hop-dong-them-phut-2109.md): `chay` gọi lệnh máy chủ, `onXong` để màn tải lại ca + báo. */
export interface ThemPhutProps {
  tong?: number
  chay: () => Promise<KetQuaThemPhut>
  onXong?: (k: KetQuaThemPhut) => void
}

function gioPhut(iso: string): string {
  return gioPhutVN(iso) // HH:mm 24 giờ GIỜ VIỆT NAM — không lệ thuộc máy đặt 12 giờ
}

export default function KhoiThoiGianCa({ ca, themPhut }: { ca: CaGioHienThi; themPhut?: ThemPhutProps }) {
  const [now, setNow] = useState(() => gioMayChu())
  const [buoc, setBuoc] = useState<'nghi' | 'hoi' | 'dang'>('nghi')
  const [ketQua, setKetQua] = useState<{ ok: boolean; chu: string } | null>(null)
  const [tongMoi, setTongMoi] = useState<number | null>(null)
  const coChung = conLaiCa(ca, gioMayChu()) !== null
  useEffect(() => {
    if (!coChung) return
    setNow(gioMayChu())
    const t = setInterval(() => setNow(gioMayChu()), 1000)
    return () => clearInterval(t)
  }, [coChung])
  const cl = conLaiCa(ca, now)
  const coThemPhut = !!themPhut && ca.trangThai === 'mo' && ca.loai !== 'baitap'
  const tong = tongMoi ?? themPhut?.tong ?? 0
  const chayThemPhut = async () => {
    if (!themPhut) return
    setBuoc('dang')
    try {
      const k = await themPhut.chay()
      setTongMoi(k.themPhutTong)
      setKetQua({ ok: true, chu: cauKetQuaThemPhut(k) })
      setBuoc('nghi')
      themPhut.onXong?.(k)
    } catch (e) {
      setKetQua({ ok: false, chu: e instanceof Error ? e.message : 'Không thêm được phút.' })
      setBuoc('nghi')
    }
  }
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
      {coThemPhut && (
        <div className="ca-them">
          {tong > 0 && <p className="ca-them-tong">Đã thêm {tong} phút</p>}
          {buoc === 'nghi' && (
            <button
              type="button"
              className="ca-nut-them"
              onClick={() => {
                setKetQua(null)
                setBuoc('hoi')
              }}
            >
              Thêm {PHUT_MOI_LAN} phút
            </button>
          )}
          {buoc !== 'nghi' && (
            <div className="ca-xac-nhan" role="group" aria-label={`Xác nhận thêm ${PHUT_MOI_LAN} phút`}>
              <p>Cả phòng thêm {PHUT_MOI_LAN} phút. Em đang làm nhận giờ mới trong khoảng 10 giây; em mất mạng sẽ không nhận được.</p>
              <div className="ca-xac-nhan-nut">
                <button type="button" className="ca-nut-them ca-nut-them--chinh" disabled={buoc === 'dang'} onClick={() => void chayThemPhut()}>
                  {buoc === 'dang' ? 'Đang cộng…' : `Đồng ý thêm ${PHUT_MOI_LAN} phút`}
                </button>
                <button type="button" className="ca-nut-them" disabled={buoc === 'dang'} onClick={() => setBuoc('nghi')}>
                  Huỷ
                </button>
              </div>
            </div>
          )}
          {ketQua && (
            <p className={`ca-them-ket-qua${ketQua.ok ? '' : ' ca-them-ket-qua--loi'}`} role={ketQua.ok ? 'status' : 'alert'}>
              {ketQua.chu}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
