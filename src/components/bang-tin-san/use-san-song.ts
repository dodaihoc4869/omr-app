// BẢNG TIN KIỂU SÀN GIAO DỊCH · nhịp hỏi máy chủ: `POST /gv/bang-tin-song` mỗi 10 giây khi tab đang mở (dừng khi tab ẩn, hỏi khi hiện lại có chặn dội, KHÔNG gọi chồng, lỗi ⇒ lùi dần 30 → 60 → 120 s — `useTuLamMoi`
// = `useNhipThay`, bảng nhịp ở src/lib/nhip-may-thay.ts; kế hoạch giờ cao điểm 21/09).
// Ba trạng thái: `cho` (chưa có câu trả lời đầu) · `san` (có số sống — giữ bản gần nhất khi một lần hỏi sau đó lỗi mạng) · `v3` (dùng Bảng tin bản 3: máy chủ chưa có lệnh / cờ `bang_tin_san = tat` /
// thân sai dạng / lần đầu mất mạng). Máy chủ nói KHÔNG (404, từ chối, sai dạng) ⇒ 5 phút sau mới hỏi lại (không đập vào một lệnh đang tắt); lỗi mạng / chậm ⇒ hỏi lại ở nhịp kế.
import { useCallback, useEffect, useRef, useState } from 'react'
import { laySan } from '../../lib/bang-tin-san/doc-san'
import type { DuLieuSan } from '../../lib/bang-tin-san/kieu'
import { useTuLamMoi } from '../bang-tin/hooks'
import { BANG_NHIP_THAY, TUY_CHON_NHIP_THAY } from '../../lib/nhip-may-thay'

export type TrangThaiSan = { kieu: 'cho' } | { kieu: 'san'; du: DuLieuSan; matKetNoi: boolean } | { kieu: 'v3' }

export const NHIP_HOI_SAN_MS = BANG_NHIP_THAY.bangTinSan
export const THU_LAI_SAU_KHI_TU_CHOI_MS = 5 * 60_000
/** Số nhịp hỏi HỤT liên tiếp (mất mạng / chậm) thì màn ghi "Mất kết nối · số lúc HH:MM"; hỏi được lại ⇒ tự mất. Hụt thì vòng lùi 30 s ⇒ hụt thứ hai đến ≈ 40 s sau lần tốt cuối. */
export const NHIP_HUT_MAT_KET_NOI = 2

export function useSanSong(): TrangThaiSan {
  const [tt, setTt] = useState<TrangThaiSan>({ kieu: 'cho' })
  const dangHoi = useRef(false)
  const chiHoiTu = useRef(0)
  const conSong = useRef(true)
  const hut = useRef(0)
  /** Trả `true` = tốt (kể cả khi máy chủ nói KHÔNG — đã có luật 5 phút riêng), `false` = hụt mạng / chậm ⇒ vòng nhịp LÙI DẦN. */
  const lam = useCallback((): Promise<boolean> => {
    if (dangHoi.current || Date.now() < chiHoiTu.current) return Promise.resolve(true) // lần trước chưa xong / máy chủ vừa từ chối ⇒ không chồng lệnh
    dangHoi.current = true
    const hutMang = (): boolean => {
      hut.current++
      const matHan = hut.current >= NHIP_HUT_MAT_KET_NOI
      // mất mạng / chậm: đang có số sống thì GIỮ (hụt đủ nhịp ⇒ ghi "Mất kết nối"), chưa có thì bản 3 (không màn trắng)
      setTt((t) => (t.kieu === 'san' ? (matHan && !t.matKetNoi ? { ...t, matKetNoi: true } : t) : { kieu: 'v3' }))
      return false
    }
    return laySan()
      .then((r): boolean => {
        if (!conSong.current) return true
        if (r.ok) {
          hut.current = 0
          setTt({ kieu: 'san', du: r.du, matKetNoi: false })
          return true
        }
        if (r.loai === 'chua_co_lenh' || r.loai === 'tu_choi' || r.loai === 'khong_doc_duoc') {
          chiHoiTu.current = Date.now() + THU_LAI_SAU_KHI_TU_CHOI_MS
          setTt({ kieu: 'v3' })
          return true
        }
        return hutMang()
      })
      .catch((): boolean => (conSong.current ? hutMang() : false))
      .finally(() => {
        dangHoi.current = false
      })
  }, [])
  useEffect(() => {
    conSong.current = true
    void lam()
    return () => {
      conSong.current = false
    }
  }, [lam])
  useTuLamMoi(lam, NHIP_HOI_SAN_MS, TUY_CHON_NHIP_THAY.bangTinSan)
  return tt
}
