// CHIẾN DỊCH ĐÃ GIAO (thầy 28/09: "không có chỗ xem những chiến dịch đã giao ở app gv") — khung trên màn Ca kiểm tra.
// Mỗi chiến dịch: tên, lớp, số em, số câu, hạn nộp, trạng thái; "Xem bảng" mở đúng chiến dịch ở Lên bảng; "Kết thúc" / "Huỷ".
import { useCallback, useEffect, useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { danhSach, dongChienDich, huyChienDich, type ChienDichTom } from './api'
import { KHOA_CHON_CHIEN_DICH } from './LenBangChienDich'
import { hienHanNop } from './ngay'
import './chien-dich.css'

const CHU_TRANG_THAI: Record<string, string> = { dang_chay: 'Đang chạy', da_dong: 'Đã kết thúc', da_huy: 'Đã huỷ' }

export default function DsChienDichDaGiao({ lanTai = 0 }: { lanTai?: number }) {
  const setScreen = useAppStore((s) => s.setScreen)
  const showToast = useAppStore((s) => s.showToast)
  const [ds, setDs] = useState<ChienDichTom[] | null>(null)
  const [loi, setLoi] = useState('')
  const [dangLam, setDangLam] = useState('')

  const tai = useCallback(async () => {
    setLoi('')
    const r = await danhSach()
    if (!r.ok) {
      setLoi(r.chu)
      return
    }
    setDs(r.du.chienDich)
  }, [])
  useEffect(() => {
    void tai()
  }, [tai, lanTai])

  const xemBang = (id: string) => {
    try {
      sessionStorage.setItem(KHOA_CHON_CHIEN_DICH, id)
    } catch {
      /* không lưu được: Lên bảng mở chiến dịch mới nhất */
    }
    setScreen('goilenbang')
  }
  const doi = async (c: ChienDichTom, viec: 'dong' | 'huy') => {
    const chu = viec === 'huy' ? `Huỷ chiến dịch "${c.ten}"? Học sinh sẽ không nhận câu của chiến dịch này nữa.` : `Kết thúc chiến dịch "${c.ten}" ngay bây giờ?`
    if (!window.confirm(chu)) return
    setDangLam(c.id)
    const r = await (viec === 'huy' ? huyChienDich(c.id) : dongChienDich(c.id))
    setDangLam('')
    if (!r.ok) {
      showToast(r.chu, 'warn')
      return
    }
    showToast(viec === 'huy' ? 'Đã huỷ chiến dịch' : 'Đã kết thúc chiến dịch', 'success')
    void tai()
  }

  return (
    <section className="cd-the" data-khoi="ds-chien-dich-da-giao" aria-labelledby="cd-ds-da-giao">
      <h2 id="cd-ds-da-giao">Chiến dịch đã giao</h2>
      {loi && (
        <p className="cd-loi" role="alert">
          {loi}{' '}
          <button type="button" className="m3-nut-chu cd-nut-nho" onClick={() => void tai()}>
            Tải lại
          </button>
        </p>
      )}
      {!loi && ds === null && <p className="cd-phu">Đang tải danh sách chiến dịch…</p>}
      {ds && ds.length === 0 && <p className="cd-phu">Chưa giao chiến dịch nào. Bấm "Giao chiến dịch mới" để bắt đầu.</p>}
      {ds && ds.length > 0 && (
        <ul className="cd-ds-cd">
          {ds.map((c) => (
            <li key={c.id} className="cd-muc-cd" data-trang-thai={c.trangThai}>
              <div className="cd-muc-cd-chu">
                <strong>{c.ten}</strong>
                <span className="cd-phu cd-so">
                  {c.lop || 'Nhiều em'} · {c.soEm} em · {c.soCau} câu · hạn nộp {hienHanNop(c.hanNop)} · {c.hetHan && c.trangThai === 'dang_chay' ? 'Đã hết hạn — vào Buổi chữa' : CHU_TRANG_THAI[c.trangThai] ?? c.trangThai}
                </span>
              </div>
              <div className="cd-hang-nut">
                <button type="button" className="m3-nut-chinh cd-nut-nho" onClick={() => xemBang(c.id)}>
                  {c.hetHan ? 'Mở Buổi chữa' : 'Xem bảng'}
                </button>
                {c.trangThai === 'dang_chay' && (
                  <>
                    <button type="button" className="m3-nut-chu cd-nut-nho" disabled={dangLam === c.id} onClick={() => void doi(c, 'dong')}>
                      Kết thúc
                    </button>
                    <button type="button" className="m3-nut-chu cd-nut-nho" disabled={dangLam === c.id} onClick={() => void doi(c, 'huy')}>
                      Huỷ
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
