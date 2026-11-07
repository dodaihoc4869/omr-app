// PHÔNG CỦA APP TRÊN MÀN CHIẾU (thầy 07/11 «ép font chữ của app lên màn chiếu»): tờ chiếu (HTML dựng chuỗi, chạy trong khung riêng) dùng ĐÚNG phông
// «DDH Rounded» của app học sinh thay Times / phông hệ thống. Tệp phông là tệp sẵn có của app (src/styles/phong-ddh — cùng tệp trong-hs.css nạp,
// cùng mã băm ⇒ không thêm tệp tải mới, máy đã nạp app học sinh thì có sẵn trong bộ nhớ đệm). Đường dẫn tuyệt đối vì tờ có thể mở ở cửa sổ khác.
import deVi from '../styles/phong-ddh/ddh-rounded-de-vietnamese.woff2?url'
import deLa from '../styles/phong-ddh/ddh-rounded-de-latin.woff2?url'
import damVi from '../styles/phong-ddh/ddh-rounded-dam-vietnamese.woff2?url'
import damLa from '../styles/phong-ddh/ddh-rounded-dam-latin.woff2?url'

const VI = 'U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB'
const LA = 'U+0000-00FF, U+0394, U+03B1-03B2, U+2000-206F, U+2070-208F, U+20AC, U+2103, U+2190-2193, U+21C4, U+21CC, U+2212, U+2264-2265, U+FEFF, U+FFFD'
/** Chuỗi phông dùng chung: phông app trước, phông hệ thống lùi sau (kí tự ngoài bộ phông vẫn hiện). */
export const PHONG_APP = "'DDH Rounded', 'Noto Sans', -apple-system, 'Segoe UI', Roboto, Arial, sans-serif"

/** CSS đặt ĐẦU tờ: khai phông + ép mọi chữ của tờ dùng phông app (`!important` ⇒ thắng CSS đặt sau). */
export function cssPhongMayChieu(): string {
  const tuyet = (u: string) => { try { return new URL(u, globalThis.location?.href).href } catch { return u } }
  const mat = (u: string, w: string, r: string) => `@font-face{font-family:'DDH Rounded';font-style:normal;font-weight:${w};font-display:swap;src:url('${tuyet(u)}') format('woff2');unicode-range:${r}}`
  return mat(deVi, '100 549', VI) + mat(deLa, '100 549', LA) + mat(damVi, '550 1000', VI) + mat(damLa, '550 1000', LA)
    + `:root{--mc-serif:${PHONG_APP};--mc-sans:${PHONG_APP};--sans:${PHONG_APP};--serif:${PHONG_APP}}body,body *:not(svg):not(svg *){font-family:${PHONG_APP}!important}`
}
