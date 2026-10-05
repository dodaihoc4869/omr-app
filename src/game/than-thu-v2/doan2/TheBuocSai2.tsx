// ĐOÀN HỘ TỐNG · THẺ "EM BIẾT CÂU NÀY. SAI VÌ BƯỚC NÀO?" (CHƯƠNG TRÌNH CẨN THẬN, đặc tả 4.6(c); thầy 06/10) — cùng việc và chữ với thẻ của Đảo 2.0
// (dao2/TheBuocSai.tsx), vẽ bằng lớp chip `dh-xin` SẴN CÓ của Đoàn (không màu mới). Chỉ hiện khi máy chủ báo canThan ∧ lượt chắc-mà-sai (`ketQua.buocSai`):
// em chạm MỘT bước (hoặc "Em chưa rõ") ⇒ `hoa2-omni-buoc-sai` ghi sổ riêng, KHÔNG chấm, không đổi hiệp / đòn / Máu. Đoàn có đồng hồ hiệp nên thẻ gọn một khối, không modal.
import { useState } from 'react'
import { CHU_DA_GHI_BUOC_SAI, CHU_LOI_GHI_BUOC_SAI, NUT_EM_CHUA_RO, TIEU_DE_BUOC_SAI } from '../../../lib/omni-chu'
import type { LuaChonBuocSai } from '../../../../server/src/omni-kieu'

const MA_CHUA_RO = 'chua_ro' // quy ước máy chủ (server/src/omni-can-than.ts MA_EM_CHUA_RO)
export default function TheBuocSai2({ lua, onChon }: { lua: readonly LuaChonBuocSai[]; onChon: (ma: string) => Promise<void> }) {
  const [chon, setChon] = useState<string | null>(null), [dang, setDang] = useState(false), [loi, setLoi] = useState(false)
  const bam = async (ma: string) => {
    if (dang || chon) return
    setDang(true); setLoi(false)
    try { await onChon(ma); setChon(ma) } catch { setLoi(true) } finally { setDang(false) }
  }
  const nut = [...lua.map(l => ({ ma: l.ma, ten: l.ten })), { ma: MA_CHUA_RO, ten: NUT_EM_CHUA_RO }]
  return (
    <div className="dh-buoc-sai" role="group" aria-label={TIEU_DE_BUOC_SAI} data-khoi="buoc-sai">
      <b>{TIEU_DE_BUOC_SAI}</b>
      <div className="dh-buoc-sai-nut">
        {nut.map(n => <button key={n.ma} type="button" className="dh-xin" data-ma={n.ma} aria-pressed={chon === n.ma} disabled={dang || !!chon} style={{ minHeight: 44 }} onClick={() => void bam(n.ma)}>{n.ten}</button>)}
      </div>
      {chon && <small role="status" data-khoi="buoc-sai-da-ghi">{CHU_DA_GHI_BUOC_SAI}</small>}
      {loi && <small role="alert">{CHU_LOI_GHI_BUOC_SAI}</small>}
    </div>
  )
}
