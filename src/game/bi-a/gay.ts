// BI-A · CẦM GẬY ĐỂ XOAY (thầy lệnh 29/09: "điều chỉnh điều khiển gậy giống cách chơi thật là cầm vào gậy để xoay hướng").
// Hàm THUẦN (toạ độ bàn 500 × 900, không DOM) — màn chơi gọi, test gọi thẳng. Chỉ đổi HƯỚNG nhắm; lực/luật/vật lý giữ nguyên.
// Hình gậy khớp `ve-ban.ts`: gậy nằm phía NGƯỢC hướng bắn, đầu gậy cách tâm bi cái R + 6 + lực × 80, dài 400.
import { R } from './vat-ly'

export interface Diem { x: number; y: number }
export const DAI_GAY = 400
/** Khoảng đầu gậy tới tâm bi cái (đúng như lúc vẽ). */
export const dauGay = (luc: number): number => R + 6 + Math.max(0, Math.min(1, luc)) * 80
/** Nửa bề rộng vùng bắt gậy theo đơn vị bàn: ≥ 22 px CSS mỗi bên (vùng bắt ≥ 44 px cho ngón tay). `S` = px CSS / đơn vị bàn. */
export const nuaBeRongBat = (S: number): number => Math.max(10, 22 / Math.max(0.05, S))

/**
 * Điểm `p` có "cầm vào gậy" không: khoảng cách tới đoạn thân gậy (từ đầu gậy tới đuôi, phía ngược hướng bắn) ≤ `nua`.
 * Cho thêm một khúc trước đầu gậy (tới sát bi cái) để chạm vào đầu gậy cũng bắt được.
 */
export function trungGay(c: Diem, aim: Diem, luc: number, p: Diem, nua: number): boolean {
  const d = Math.hypot(aim.x, aim.y) || 1, ux = -aim.x / d, uy = -aim.y / d // hướng thân gậy (từ bi cái ra đuôi)
  const rx = p.x - c.x, ry = p.y - c.y
  const t = rx * ux + ry * uy // chiếu lên trục gậy
  const t0 = R, t1 = dauGay(luc) + DAI_GAY
  if (t < t0 - nua * 0.5 || t > t1 + nua) return false
  const tt = Math.max(t0, Math.min(t1, t))
  return Math.hypot(rx - ux * tt, ry - uy * tt) <= nua
}

/** Góc (radian) của hướng từ bi cái tới ngón tay. */
export const gocToi = (c: Diem, p: Diem): number => Math.atan2(p.y - c.y, p.x - c.x)
/** Hướng bắn khi thân gậy nằm theo góc `gocThan` (bi cái → đuôi gậy): hướng bắn ngược lại. */
export const huongBanTuThan = (gocThan: number): Diem => ({ x: -Math.cos(gocThan), y: -Math.sin(gocThan) })

export interface CamGay { /** Lệch giữa góc thân gậy lúc cầm và góc tới ngón tay lúc cầm — giữ nguyên để không giật. */ lech: number }
/** Bắt đầu cầm: ghi độ lệch giữa thân gậy hiện tại và ngón tay (cầm lệch mép gậy thì gậy KHÔNG nhảy về dưới ngón). */
export function batDauCam(c: Diem, aim: Diem, p: Diem): CamGay {
  const than = Math.atan2(-aim.y, -aim.x)
  return { lech: chuanGoc(than - gocToi(c, p)) }
}
/** Ngón tay ở `p` ⇒ hướng bắn mới. Ngón quá sát tâm bi cái (< R) thì giữ hướng cũ (góc không xác định, tránh quay loạn). */
export function huongKhiKeo(c: Diem, cam: CamGay, p: Diem, aimCu: Diem): Diem {
  if (Math.hypot(p.x - c.x, p.y - c.y) < R) return aimCu
  return huongBanTuThan(gocToi(c, p) + cam.lech)
}
/**
 * Kéo NGOÀI gậy: không nhảy hướng; chỉ chỉnh tinh theo góc ngón tay quét quanh bi cái (× `he`, mặc định 0,25).
 * `truoc`, `sau`: hai vị trí ngón liên tiếp. Ngón sát bi cái ⇒ bỏ.
 */
export function chinhTinh(c: Diem, aim: Diem, truoc: Diem, sau: Diem, he = 0.25): Diem {
  if (Math.hypot(truoc.x - c.x, truoc.y - c.y) < R * 2 || Math.hypot(sau.x - c.x, sau.y - c.y) < R * 2) return aim
  const da = chuanGoc(gocToi(c, sau) - gocToi(c, truoc)) * he
  const cs = Math.cos(da), sn = Math.sin(da)
  return { x: aim.x * cs - aim.y * sn, y: aim.x * sn + aim.y * cs }
}
/** Đưa góc về (−π, π]. */
export function chuanGoc(a: number): number {
  let x = a % (2 * Math.PI)
  if (x > Math.PI) x -= 2 * Math.PI
  if (x <= -Math.PI) x += 2 * Math.PI
  return x
}
