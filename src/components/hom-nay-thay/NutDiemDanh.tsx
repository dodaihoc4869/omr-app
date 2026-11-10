// NÚT «ĐIỂM DANH» Ở ĐẦU MÀN HÔM NAY (thầy 09/11: «bấm điểm danh cái vào màn chiếu luôn … bỏ luôn chọn lớp đi … tối ưu tốc độ tức thì hơn nữa»).
// Bấm ⇒ (src/lib/bpu/diem-danh-nhanh.ts) buổi đang mở / buổi mới «mọi lớp» ⇒ bảng Bình Phản Ứng chiếu điểm danh NGAY, không hộp hỏi.
// TỨC THÌ: Hôm nay rảnh ⇒ tải sẵn mảnh nút + mảnh bảng; chạm / rê vào nút ⇒ hỏi sớm buổi đang mở. «Kết thúc buổi học» nằm trên bảng («Hôm nay làm gì?»).
import { useEffect, useState } from 'react'
import { Power, Users } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
// Giữ hộp xác nhận chung trong mảnh màn Hôm nay như trước 09/11 (bỏ nhập ⇒ bộ đóng gói dời nó sang mảnh dùng chung mà đường thi /t tải lúc mở ⇒ /t nặng thêm).
import '../hop-thoai'

const napNhanh = () => import('../../lib/bpu/diem-danh-nhanh')

export default function NutDiemDanh({ className }: { className: string }) {
  const showToast = useAppStore((s) => s.showToast)
  const [dang, setDang] = useState(false)
  // NÚT KẾT THÚC CẠNH ĐIỂM DANH (thầy 09/11 «khi out ra ngoài có nút kết thúc cạnh chữ điểm danh»): hiện khi có buổi đang mở (phiên trên máy này / buổi
  // mở ≤ 3 giờ — hỏi lúc Hôm nay rảnh). SỬA CÓ CHỦ ĐÍCH 10/11 (thầy «nút bấm kết thúc bấm 1 lần là kết thúc luôn nhé»): bấm MỘT lần ⇒ đóng buổi,
  // các em thoát Bình Phản Ứng, bảng đóng, báo «Đã kết thúc buổi học».
  const [buoiMo, setBuoiMo] = useState<string | null>(null)
  const [dangKt, setDangKt] = useState(false)
  useEffect(() => {
    const nghe = (e: Event) => { const d = (e as CustomEvent<{ buoiId: string } | null>).detail; setBuoiMo(d?.buoiId ?? null) }
    window.addEventListener('bpu-phien', nghe)
    return () => window.removeEventListener('bpu-phien', nghe)
  }, [])
  const ketThuc = async () => {
    if (!buoiMo || dangKt) return
    setDangKt(true)
    try {
      const g = await import('../bpu/gan-gv')
      const loi = await g.ketThucBuoiHoc(buoiMo)
      if (loi) showToast(loi, 'warn'); else setBuoiMo(null)
    } finally { setDangKt(false) }
  }
  useEffect(() => {
    const nap = () => { void napNhanh().then((m) => { m.napSan(); void m.buoiMoGanDay().then((id) => setBuoiMo((cu) => cu ?? id)).catch(() => {}) }).catch(() => {}) }
    const w = window as Window & { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (h: number) => void }
    if (w.requestIdleCallback) { const h = w.requestIdleCallback(nap, { timeout: 4000 }); return () => w.cancelIdleCallback?.(h) }
    const h = setTimeout(nap, 2500); return () => clearTimeout(h)
  }, [])
  const hoiSom = () => { void napNhanh().then((m) => { void m.hoiSom() }).catch(() => {}) }
  const bam = async () => {
    if (dang) return
    setDang(true)
    try {
      const kq = await (await napNhanh()).batDauDiemDanh()
      if (kq.loai === 'loi') showToast(kq.chu, 'warn')
    } catch {
      showToast('Chưa mở được điểm danh. Thầy thử lại.', 'warn')
    } finally {
      setDang(false)
    }
  }
  return (
    <>
    {buoiMo ? (
      <button type="button" className="gvhn-ket-thuc-nut" disabled={dangKt} onClick={() => void ketThuc()}>
        <Power size={18} aria-hidden="true" />{dangKt ? 'Đang kết thúc…' : 'Kết thúc buổi'}
      </button>
    ) : null}
    <button type="button" className={className} onPointerEnter={hoiSom} onPointerDown={hoiSom} onFocus={hoiSom} onClick={() => void bam()} disabled={dang}>
      <Users size={18} aria-hidden="true" />
      {dang ? 'Đang mở…' : 'Điểm danh'}
    </button>
    </>
  )
}
