// BI-A · CÔNG TẮC "LUÔN BẬT MẮT THẦN" (thầy lệnh 29/09: "một nút bật mắt thần … chơi cho dễ"). Cho MỌI em, chữ trung tính.
// Bật ⇒ mọi cú của CHÍNH em đều hiện đường Mắt thần dài (du-doan.ts: duongMatThan) như khi dùng Mắt thần; KHÔNG trừ lượt Mắt thần kiếm được,
// không đổi luật/điểm/EXP. Nhớ theo MÁY (localStorage, bọc try/catch: chế độ riêng tư / chặn dữ liệu ⇒ coi như tắt, vẫn bật được trong phiên).
import { useSyncExternalStore } from 'react'

export const KHOA_LUON_MAT_THAN = 'bia_luon_mat_than'
let bo: boolean | null = null
const nghe = new Set<() => void>()

export function docLuonMatThan(): boolean {
  if (bo !== null) return bo
  try { bo = globalThis.localStorage?.getItem(KHOA_LUON_MAT_THAN) === '1' } catch { bo = false }
  return bo
}
export function datLuonMatThan(bat: boolean): void {
  bo = bat
  try { if (bat) globalThis.localStorage?.setItem(KHOA_LUON_MAT_THAN, '1'); else globalThis.localStorage?.removeItem(KHOA_LUON_MAT_THAN) } catch { /* máy chặn lưu: chỉ nhớ trong phiên */ }
  for (const f of nghe) f()
}
/** Chỉ cho test: quên giá trị đã đọc để đọc lại từ localStorage. */
export function _quenLuonMatThan(): void { bo = null }
const dangKy = (f: () => void) => { nghe.add(f); return () => { nghe.delete(f) } }
export function useLuonMatThan(): [boolean, (b: boolean) => void] {
  return [useSyncExternalStore(dangKy, docLuonMatThan, () => false), datLuonMatThan]
}

/** Công tắc dùng ở Sảnh Bi-a (đủ chữ) và trên màn chơi (`gon`: một dòng). */
export function CongTacMatThan({ gon = false }: { gon?: boolean }) {
  const [bat, dat] = useLuonMatThan()
  return (
    <label className="bia-cong-tac" data-gon={gon ? '' : undefined} data-bat={bat ? '' : undefined} title="Luôn bật Mắt thần · nhắm dễ hơn">
      <input type="checkbox" role="switch" checked={bat} onChange={(e) => dat(e.target.checked)}
        aria-label="Luôn bật Mắt thần: mọi cú đánh của em đều hiện đường đi của bi, không trừ lượt Mắt thần" />
      <span className="bia-cong-tac-gat" aria-hidden="true" />
      {gon ? <span className="bia-cong-tac-chu"><b>Luôn bật</b></span>
        : <span className="bia-cong-tac-chu"><b>Luôn bật Mắt thần</b><small>Nhắm dễ hơn · thấy trước đường đi của bi · không đổi điểm, không trừ lượt Mắt thần</small></span>}
    </label>
  )
}
