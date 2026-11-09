// NÚT «ĐIỂM DANH» Ở ĐẦU MÀN HÔM NAY (thầy 09/11: «chuyển nút điểm danh ra màn hôm nay, bỏ hẳn thẻ hành trình, khi bấm nút điểm danh tự động hiện ra
// mọi thứ chọn như đang làm»). Bấm ⇒ (nạp lười src/lib/bpu/diem-danh-nhanh.ts) bảng Bình Phản Ứng chiếu điểm danh ⇒ «Xong điểm danh · Chọn câu».
// Đang có buổi mở / thầy dạy nhiều lớp ⇒ hộp nhỏ: «Tiếp buổi …» (Enter) · lớp khác (buổi mới) · Kết thúc buổi · Trang buổi dạy (đầu giờ, chữa câu,
// ôn tập — trang cũ của Hành trình, không còn ở thanh bên). Không thêm lệnh nào lúc mở màn.
import { useEffect, useRef, useState } from 'react'
import { Power, Users } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { hoiXacNhan } from '../hop-thoai'
import type { ChonDiemDanh } from '../../lib/bpu/diem-danh-nhanh'
import type { BuoiHoc } from '../../lib/buoi-hoc-api'

const gioMo = (iso: string) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? '' : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` }

export default function NutDiemDanh({ className }: { className: string }) {
  const showToast = useAppStore((s) => s.showToast)
  const [dang, setDang] = useState(false)
  const [hoi, setHoi] = useState<{ dangMo: BuoiHoc | null; ds: string[]; tra: (c: ChonDiemDanh) => void } | null>(null)
  const hop = useRef<HTMLDivElement>(null)
  useEffect(() => { if (hoi) hop.current?.querySelector('button')?.focus() }, [hoi])
  const bam = async () => {
    if (dang) return
    setDang(true)
    try {
      const m = await import('../../lib/bpu/diem-danh-nhanh')
      const kq = await m.batDauDiemDanh((o) => new Promise((tra) => setHoi({ ...o, tra })))
      if (kq.loai === 'loi') showToast(kq.chu, 'warn')
      else if (kq.loai === 'ket-thuc') showToast(`Đã kết thúc buổi ${kq.lop}`, 'success')
      else if (kq.loai === 'trang') void import('../bpu/gan-gv').then((g) => g.moHoatDong('dau-gio'))
    } catch {
      showToast('Chưa mở được điểm danh. Thầy thử lại.', 'warn')
    } finally {
      setDang(false)
      setHoi(null)
    }
  }
  const ketThuc = async () => {
    if (!hoi?.dangMo) return
    const ok = await hoiXacNhan({
      tieuDe: `Kết thúc buổi ${hoi.dangMo.lop || hoi.dangMo.ten}?`,
      noiDung: 'Mã điểm danh hết hiệu lực ngay; em chưa điểm danh sẽ không vào được nữa. Danh sách có mặt và kết quả lên bảng vẫn giữ.',
      nhanDongY: 'Kết thúc buổi',
      nhanKhong: 'Chưa',
    })
    if (ok) hoi.tra({ loai: 'ket-thuc' })
  }
  const lopMo = hoi?.dangMo ? (hoi.dangMo.lop || '').trim() : ''
  return (
    <>
      <button type="button" className={className} onClick={() => void bam()} disabled={dang && !hoi} aria-haspopup="dialog">
        <Users size={18} aria-hidden="true" />
        {dang && !hoi ? 'Đang mở điểm danh…' : 'Điểm danh'}
      </button>
      {hoi && (
        <div className="gvhn-chon-lop" role="dialog" aria-label="Điểm danh" ref={hop} onKeyDown={(e) => { if (e.key === 'Escape') hoi.tra(null) }}>
          {hoi.dangMo ? (
            <button type="button" className="gvv2-nut-chinh gvhn-chon-lop-tiep" onClick={() => hoi.tra({ loai: 'tiep' })}>
              Tiếp buổi {lopMo || hoi.dangMo.ten} · mở {gioMo(hoi.dangMo.moLuc)}
            </button>
          ) : null}
          {hoi.ds.some((l) => l !== lopMo) ? (
            <>
              <b>{hoi.dangMo ? 'Hoặc mở buổi mới cho lớp' : 'Điểm danh lớp nào?'}</b>
              <div className="gvhn-chon-lop-ds">
                {hoi.ds.filter((l) => l !== lopMo).map((l) => <button key={l} type="button" className="gvv2-nut-vien" onClick={() => hoi.tra({ loai: 'moi', lop: l })}>{l}</button>)}
              </div>
            </>
          ) : null}
          {/* 09/11 thầy «thiết kế nút đẹp mắt kết thúc buổi học»: dải riêng — buổi đang mở + nút đỏ nhạt có biểu tượng nguồn (hỏi lại trước khi đóng). */}
          {hoi.dangMo ? (
            <div className="gvhn-ket-thuc">
              <span><b>Buổi {lopMo || hoi.dangMo.ten}</b> đang mở từ {gioMo(hoi.dangMo.moLuc)}</span>
              <button type="button" className="gvhn-ket-thuc-nut" onClick={() => void ketThuc()}><Power size={18} aria-hidden="true" />Kết thúc buổi học</button>
            </div>
          ) : null}
          <div className="gvhn-chon-lop-cuoi">
            <button type="button" className="gvhn-chon-lop-huy" onClick={() => hoi.tra({ loai: 'trang' })}>Buổi dạy: đầu giờ · chữa câu · ôn tập</button>
            <button type="button" className="gvhn-chon-lop-huy" onClick={() => hoi.tra(null)}>Huỷ</button>
          </div>
        </div>
      )}
    </>
  )
}
