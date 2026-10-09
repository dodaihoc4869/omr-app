// MÀN MỞ TỪ SẢNH 2.0 — NẠP TRƯỚC LÚC SẢNH RẢNH + GỌI SỚM LÚC CHẠM (chuyển màn nhanh 05/10, thầy: "nhanh gấp 2 lần", GIỮ NGUYÊN giao diện).
//
// ĐO TRƯỚC KHI SỬA (bản build thật, CPU chậm 6×, Slow 4G, máy chủ giả — docs/toi-uu-0510/NEN.md): chạm cửa Sảnh rồi mới tải mảnh JS của màn
// kế (Game → vỏ Đảo → Đảo 2.0 nối nhau; Đoàn Hộ Tống; Câu đã làm; Tu luyện — đều NGOÀI precache), mỗi lớp lazy còn treo màn chờ ≥ 300 ms,
// và lệnh máy chủ của màn chỉ đi SAU khi mảnh về (Game: `profile` rồi mới `hoa2-sanh`). Sảnh → Đảo 2,5 s; Sảnh → Đoàn 1,9 s; → Câu đã làm 1,6 s.
//
// NAY:
// · NẠP TRƯỚC: Sảnh có số + chờ CHO_SAU_SANH_MS (ảnh, phông, lệnh mở app của Sảnh đi trước) ⇒ nạp sẵn LẦN LƯỢT từng mảnh, đợi lúc rảnh;
//   tiết kiệm dữ liệu / 2G / mất mạng thì không nạp; một mảnh hỏng thì dừng (lúc em bấm tải như cũ); em chạm một cửa thì thôi nạp tiếp
//   (không giành máy với màn vừa mở). Mảnh về được service worker cất ở kho chạy-lúc y như lúc em bấm. Thứ tự: đường của NÚT CHÍNH trước
//   (còn ổ phục kích ⇒ Đoàn; không ⇒ Đảo), Câu đã làm, đường game còn lại, Tu luyện. Các màn dùng `veNgayKhiCo` / `lazyNapTruoc` ⇒ mảnh
//   đã có thì vẽ thẳng, không màn chờ.
// · GỌI SỚM (lúc chạm — cửa game: StudentPortalScreen · moGameTai gọi `moManGameNhanh`; cửa Câu đã làm / Tu luyện: SanhBanDo bọc bằng
//   `boCuaNhanh`): bắn các lệnh đọc mà màn CHẮC CHẮN gọi đầu tiên, song song với lúc tải mảnh + vẽ màn; màn nhận lại lời hứa — số lệnh tới
//   máy chủ không đổi; màn đóng thì bỏ lệnh sớm chưa ai nhận. CHỈ bắn khi mảnh của màn đã nạp (trước) — màn chắc chắn mở và nhận lệnh ngay
//   trong lượt chạm (lệnh sớm không bao giờ nằm chờ cho một lần mở khác). Mảnh của màn đích (cả lớp con: vỏ Đảo + Đảo 2.0 / Đoàn) tải ngay
//   lúc chạm, không đợi lớp trên vẽ xong mới tải lớp dưới.
import { useEffect } from 'react'
import { boNap, napTruocLanLuot, nenNapTruoc, taoGoiSom } from './nap-truoc-man'
import { taiCauDaLam, type KetQuaCauDaLam } from './api'

/** Game thần thú (Đảo · Đoàn · Cửa hàng · Túi đồ) — StudentPortalScreen nạp lười game bằng bộ nạp này. */
export const napManGame = boNap(() => import('../../game/than-thu-v2/Game'))
/** Màn "Câu đã làm". */
export const napManCauDaLam = boNap(() => import('./CauDaLam'))
/** Tu luyện. */
export const napManTuLuyen = boNap(() => import('../tu-luyen/ManTuLuyen'))

/** Chờ sau khi Sảnh có số rồi mới nạp trước — để các việc mở app của Sảnh (ảnh, phông, lệnh máy chủ) đi trước. */
export const CHO_SAU_SANH_MS = 1500

/** Hàng mảnh còn chờ nạp trước (dựng MỘT lần mỗi lượt mở trang); `null` = chưa dựng. */
let hang: (() => Promise<unknown>)[] | null = null
/** Đang có một lượt nạp chạy (không chạy hai lượt song song). */
let dangNap = false
/** Em đã chạm một cửa (rời Sảnh): thôi nạp trước trong lượt mở trang này — không giành máy / đường mạng với màn em vừa mở
 *  (mảnh đang tải dở vẫn về). Cửa nào chưa nạp thì lúc em bấm tải như cũ. */
let daRoiSanh = false
/** Chạm cửa nào cũng gọi (moManGameNhanh, boCuaNhanh). */
export const dungNapTruocManSanh = (): void => {
  daRoiSanh = true
}

/** Nạp trước LẦN LƯỢT các mảnh còn trong hàng. `uuTienDoan` = nút chính của Sảnh đang là "PHÁ N Ổ PHỤC KÍCH" (mở Đoàn). */
export function napTruocManSanh(uuTienDoan: boolean): Promise<void> {
  if (daRoiSanh || !nenNapTruoc()) return Promise.resolve()
  if (!hang) {
    const dao = () => napManGame().then((m) => m.napTruocDao())
    const doan = () => napManGame().then((m) => m.napTruocDoan())
    hang = uuTienDoan ? [doan, napManCauDaLam, dao, napManTuLuyen] : [dao, napManCauDaLam, doan, napManTuLuyen]
  }
  if (dangNap || !hang.length) return Promise.resolve()
  dangNap = true
  return napTruocLanLuot(hang, undefined, () => !daRoiSanh).finally(() => {
    dangNap = false
  })
}

/** Sảnh 2.0 gọi. `sanSang` = Sảnh đã có số của máy chủ (cảnh + nút đã vẽ). */
export function useNapTruocManSanh(sanSang: boolean, uuTienDoan: boolean): void {
  useEffect(() => {
    // Phép kiểm (jsdom) không nạp mảnh thật.
    if (!sanSang || import.meta.env.MODE === 'test') return
    const hen = setTimeout(() => void napTruocManSanh(uuTienDoan), CHO_SAU_SANH_MS)
    return () => clearTimeout(hen)
  }, [sanSang]) // eslint-disable-line react-hooks/exhaustive-deps
}

const boQua = () => {
  /* tải hỏng: lúc vẽ màn, nạp lười báo như cũ */
}

/** Chạm cửa game ở Sảnh (`manDau` như `moGameTai`): mảnh game đã có ⇒ bắn lệnh mở game (Game.tsx · goiSomGame); và tải ngay mảnh của màn
 *  đích (vỏ Đảo + Đảo 2.0, hoặc Đoàn) — mảnh game chưa về thì tải tiếp ngay khi nó về. */
export function moManGameNhanh(sbd: string, token: string | undefined, manDau: '' | 'doan' | 'shop' | 'tui-do' | 'than-thu'): void {
  dungNapTruocManSanh()
  // Chỉ là tăng tốc: có trục trặc gì (mô-đun lạ, máy chặn lưu…) thì nuốt lỗi — cửa game vẫn mở như cũ (moGame ngay sau lệnh này).
  try {
    const tai = (m: Awaited<ReturnType<typeof napManGame>>): Promise<unknown> => (manDau === 'doan' ? m.napTruocDoan() : m.napTruocDao())
    const m = napManGame.san()
    if (m) m.goiSomGame(sbd, token, manDau)
    void (m ? Promise.resolve(m) : napManGame()).then(tai).catch(boQua)
  } catch {
    /* như trên */
  }
}

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
      dungNapTruocManSanh()
      if (p.token && napManCauDaLam.san()) somCauDaLam.ban(p.token, () => taiCauDaLam(p.token))
      p.onCauDaLam()
    },
    onTuLuyen:
      tuLuyen &&
      (() => {
        dungNapTruocManSanh()
        try {
          if (p.token) napManTuLuyen.san()?.goiSomTuLuyen(p.token)
        } catch {
          /* gọi sớm hỏng ⇒ màn tự tải như cũ */
        }
        tuLuyen()
      }),
  }
}
