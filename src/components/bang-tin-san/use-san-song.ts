// BẢNG TIN KIỂU SÀN GIAO DỊCH · nhịp hỏi máy chủ: `POST /gv/bang-tin-song` mỗi 10 giây khi tab đang mở (dừng khi tab ẩn, hỏi ngay khi hiện lại — `useTuLamMoi`).
// Ba trạng thái: `cho` (chưa có câu trả lời đầu) · `san` (có số sống — giữ bản gần nhất khi một lần hỏi sau đó lỗi mạng) · `v3` (dùng Bảng tin bản 3: máy chủ chưa có lệnh / cờ `bang_tin_san = tat` /
// thân sai dạng / lần đầu mất mạng). Máy chủ nói KHÔNG (404, từ chối, sai dạng) ⇒ 5 phút sau mới hỏi lại (không đập vào một lệnh đang tắt); lỗi mạng / chậm ⇒ hỏi lại ở nhịp kế.
import { useCallback, useEffect, useRef, useState } from 'react'
import { laySan } from '../../lib/bang-tin-san/doc-san'
import type { DuLieuSan } from '../../lib/bang-tin-san/kieu'
import { useTuLamMoi } from '../bang-tin/hooks'

export type TrangThaiSan = { kieu: 'cho' } | { kieu: 'san'; du: DuLieuSan; matKetNoi: boolean } | { kieu: 'v3' }

export const NHIP_HOI_SAN_MS = 10_000
export const THU_LAI_SAU_KHI_TU_CHOI_MS = 5 * 60_000
/** Số nhịp hỏi HỤT liên tiếp (mất mạng / chậm) thì màn ghi "Mất kết nối · số lúc HH:MM"; hỏi được lại ⇒ tự mất. */
export const NHIP_HUT_MAT_KET_NOI = 3

export function useSanSong(): TrangThaiSan {
  const [tt, setTt] = useState<TrangThaiSan>({ kieu: 'cho' })
  const dangHoi = useRef(false)
  const chiHoiTu = useRef(0)
  const conSong = useRef(true)
  const hut = useRef(0)
  const lam = useCallback(() => {
    if (dangHoi.current || Date.now() < chiHoiTu.current) return // lần trước chưa xong / máy chủ vừa từ chối ⇒ không chồng lệnh
    dangHoi.current = true
    void laySan()
      .then((r) => {
        if (!conSong.current) return
        if (r.ok) {
          hut.current = 0
          setTt({ kieu: 'san', du: r.du, matKetNoi: false })
          return
        }
        if (r.loai === 'chua_co_lenh' || r.loai === 'tu_choi' || r.loai === 'khong_doc_duoc') {
          chiHoiTu.current = Date.now() + THU_LAI_SAU_KHI_TU_CHOI_MS
          setTt({ kieu: 'v3' })
          return
        }
        hut.current++
        const matHan = hut.current >= NHIP_HUT_MAT_KET_NOI
        // mất mạng / chậm: đang có số sống thì GIỮ (hụt ≥ 3 nhịp ⇒ ghi "Mất kết nối"), chưa có thì bản 3 (không màn trắng)
        setTt((t) => (t.kieu === 'san' ? (matHan && !t.matKetNoi ? { ...t, matKetNoi: true } : t) : { kieu: 'v3' }))
      })
      .catch(() => {
        if (!conSong.current) return
        hut.current++
        const matHan = hut.current >= NHIP_HUT_MAT_KET_NOI
        setTt((t) => (t.kieu === 'san' ? (matHan && !t.matKetNoi ? { ...t, matKetNoi: true } : t) : { kieu: 'v3' }))
      })
      .finally(() => {
        dangHoi.current = false
      })
  }, [])
  useEffect(() => {
    conSong.current = true
    lam()
    return () => {
      conSong.current = false
    }
  }, [lam])
  useTuLamMoi(lam, NHIP_HOI_SAN_MS)
  return tt
}
