// Nạp lười các màn học tập còn dùng; không nạp các màn game đã ngừng.
import { boNap, taoGoiSom } from './nap-truoc-man'
import { taiCauDaLam, type KetQuaCauDaLam } from './api'

export const napManCauDaLam = boNap(() => import('./CauDaLam'))
export const napManTuLuyen = boNap(() => import('../tu-luyen/ManTuLuyen'))

const somCauDaLam = taoGoiSom<KetQuaCauDaLam>()
/** CauDaLam: lượt tải đầu nhận lệnh đã bắn sớm (cùng phiên, còn hạn, chưa hỏng) — null ⇒ tự tải như cũ. Màn đóng ⇒ `xoaCauDaLamSom`. */
export const nhanCauDaLamSom = (token: string): Promise<KetQuaCauDaLam> | null => somCauDaLam.nhan(token)
export const xoaCauDaLamSom = (): void => somCauDaLam.xoa()

/** Sảnh bọc hai cửa (mảnh của màn đã nạp trước ⇒ màn mở ngay trong lượt chạm): "Câu đã làm" ⇒ bắn ngay lệnh tải danh sách câu
 *  (`hoa2-cau-da-lam`, CauDaLam nhận lại ở lượt tải đầu); "Tu luyện" ⇒ bắn ngay hai lệnh mở màn (ManTuLuyen.tsx · goiSomTuLuyen). Rồi gọi
 *  đúng hàm cửa cũ. Mảnh chưa có ⇒ như cũ (màn tự tải lúc mở). */
export function boCuaNhanh<P extends { token: string; onCauDaLam: () => void; onTuLuyen?: () => void }>(p: P): P {
  const tuLuyen = p.onTuLuyen
  return {
    ...p,
    onCauDaLam: () => {
      if (p.token && napManCauDaLam.san()) somCauDaLam.ban(p.token, () => taiCauDaLam(p.token))
      p.onCauDaLam()
    },
    onTuLuyen:
      tuLuyen &&
      (() => {
          try {
          if (p.token) napManTuLuyen.san()?.goiSomTuLuyen(p.token)
        } catch {
          /* gọi sớm hỏng ⇒ màn tự tải như cũ */
        }
        tuLuyen()
      }),
  }
}
