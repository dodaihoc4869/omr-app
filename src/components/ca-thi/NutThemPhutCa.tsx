// NÚT "THÊM 5 PHÚT" ở Việc nhanh của màn Theo dõi ca (thầy 29/09: "bỏ từ phần 12:17 chỉ để lại phần trên; còn thiếu nút nào thì chuyển lên phần trên").
// Cùng việc, cùng câu hỏi lại với thẻ Thời gian cũ (KhoiThoiGianCa) — chỉ đổi sang kiểu nút `ct-nut` của khu trên. Không gọi máy chủ ngoài `chay()` màn cha truyền.
import { useState } from 'react'
import { AlarmClockPlus } from 'lucide-react'
import { PHUT_MOI_LAN, cauKetQuaThemPhut, type KetQuaThemPhut } from '../../lib/them-phut-api'

export default function NutThemPhutCa({ tong, chay, onXong }: { tong?: number; chay: () => Promise<KetQuaThemPhut>; onXong?: (k: KetQuaThemPhut) => void }) {
  const [buoc, setBuoc] = useState<'nghi' | 'hoi' | 'dang'>('nghi')
  const [ketQua, setKetQua] = useState<{ ok: boolean; chu: string } | null>(null)
  const [tongMoi, setTongMoi] = useState<number | null>(null)
  const daThem = tongMoi ?? tong ?? 0
  const dongY = async () => {
    setBuoc('dang')
    try {
      const k = await chay()
      setTongMoi(k.themPhutTong)
      setKetQua({ ok: true, chu: cauKetQuaThemPhut(k) })
      onXong?.(k)
    } catch (e) {
      setKetQua({ ok: false, chu: e instanceof Error ? e.message : 'Không thêm được phút.' })
    }
    setBuoc('nghi')
  }
  return (
    <div className="ct-them-phut">
      {daThem > 0 && <p className="ct-ghi so ct-them-phut-da">Đã thêm {daThem} phút</p>}
      {buoc === 'nghi' ? (
        <button
          type="button"
          className="ct-nut ct-nut-tong"
          onClick={() => {
            setKetQua(null)
            setBuoc('hoi')
          }}
        >
          <AlarmClockPlus size={18} aria-hidden="true" />
          Thêm {PHUT_MOI_LAN} phút
        </button>
      ) : (
        <div className="ct-them-phut-hoi" role="group" aria-label={`Xác nhận thêm ${PHUT_MOI_LAN} phút`}>
          <p>Cả phòng thêm {PHUT_MOI_LAN} phút. Em đang làm nhận giờ mới trong khoảng 10 giây; em mất mạng sẽ không nhận được.</p>
          <div className="ct-hang-nut">
            <button type="button" className="ct-nut ct-nut-chinh" disabled={buoc === 'dang'} onClick={() => void dongY()}>
              {buoc === 'dang' ? 'Đang cộng…' : `Đồng ý thêm ${PHUT_MOI_LAN} phút`}
            </button>
            <button type="button" className="ct-nut ct-nut-vien" disabled={buoc === 'dang'} onClick={() => setBuoc('nghi')}>
              Huỷ
            </button>
          </div>
        </div>
      )}
      {ketQua && (
        <p className={`ct-ghi${ketQua.ok ? '' : ' ct-them-phut-loi'}`} role={ketQua.ok ? 'status' : 'alert'}>
          {ketQua.chu}
        </p>
      )}
    </div>
  )
}
