// OMNI 3 — HỒ SƠ MỆT THEO KHUNG GIỜ (của riêng em, co Bayes). LÕI THUẦN. Chỉ GỢI Ý đổi thứ tự — không khoá, không báo phụ huynh.
// Đặc tả mục 4.7: kích hoạt khi khung hiện tại có tỉ lệ sơ ý (lướt + chắc-mà-sai) ≥ boi × khung tốt nhất của em và ≥ toiThieu lượt thật.
import { CAC_KHUNG_GIO, THAM_SO_OMNI, type HoSoOmniEm, type KhungGio, type ThamSoOmni } from './omni-kieu'

/**
 * Tỉ lệ sơ ý theo khung, co về tỉ lệ CHUNG của em bằng luotAo lượt ảo: (soY + tỉLệChung × luotAo)/(n + luotAo), tỉLệChung = Σ soY / Σ n.
 * Khung tốt nhất = tỉ lệ nhỏ nhất trong các khung có ≥ toiThieu lượt thật (hoà ⇒ khung đứng trước trong CAC_KHUNG_GIO).
 * Kích hoạt ⇔ khung hiện tại có ≥ toiThieu lượt thật ∧ tỉ lệ > 0 ∧ tỉ lệ ≥ boi × tỉ lệ khung tốt nhất.
 * Không đủ dữ liệu (chưa có lượt nào, hoặc khung hiện tại < toiThieu lượt) ⇒ null.
 * Trả: `khung` = khung HIỆN TẠI và `tiLe` của nó; `khungTot` + `tiLeTot` = khung tốt nhất.
 */
export function xetMetGio(hs: Pick<HoSoOmniEm, 'khungGio'>, khung: KhungGio, ts: ThamSoOmni = THAM_SO_OMNI): { khung: KhungGio; tiLe: number; tiLeTot: number; kichHoat: boolean; khungTot: KhungGio } | null {
  const { boi, toiThieu, luotAo } = ts.MET_GIO
  const o = (k: KhungGio): { n: number; soY: number } => {
    const x = hs.khungGio?.[k]
    return { n: Math.max(0, Number(x?.n) || 0), soY: Math.max(0, Number(x?.soY) || 0) }
  }
  let tongN = 0
  let tongY = 0
  for (const k of CAC_KHUNG_GIO) { tongN += o(k).n; tongY += o(k).soY }
  if (!(tongN > 0) || o(khung).n < toiThieu) return null
  const chung = tongY / tongN
  const tiLeCua = (k: KhungGio): number => (o(k).soY + chung * luotAo) / (o(k).n + luotAo)
  let khungTot: KhungGio = khung
  let tiLeTot = tiLeCua(khung)
  for (const k of CAC_KHUNG_GIO) {
    if (o(k).n < toiThieu) continue
    const r = tiLeCua(k)
    if (r < tiLeTot || (r === tiLeTot && CAC_KHUNG_GIO.indexOf(k) < CAC_KHUNG_GIO.indexOf(khungTot))) { khungTot = k; tiLeTot = r }
  }
  const tiLe = tiLeCua(khung)
  return { khung, tiLe, tiLeTot, kichHoat: tiLe > 0 && tiLe >= boi * tiLeTot, khungTot }
}
