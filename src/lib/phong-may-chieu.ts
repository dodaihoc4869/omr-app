// PHÔNG CỦA APP TRÊN MÀN CHIẾU (thầy 07/11 «ép font chữ của app lên màn chiếu»; 08/11 «Be Vietnam Pro đồng bộ tất cả»): tờ chiếu (HTML dựng chuỗi,
// chạy trong khung riêng) dùng ĐÚNG phông Be Vietnam Pro của ba app thay Times / phông hệ thống. Tệp phông là tệp sẵn có của app (@fontsource,
// main.tsx nạp — cùng mã băm ⇒ máy đã mở app thì có sẵn trong bộ nhớ đệm). Đường dẫn tuyệt đối vì tờ có thể mở ở cửa sổ khác.
import la4 from '@fontsource/be-vietnam-pro/files/be-vietnam-pro-latin-400-normal.woff2?url'
import la6 from '@fontsource/be-vietnam-pro/files/be-vietnam-pro-latin-600-normal.woff2?url'
import la7 from '@fontsource/be-vietnam-pro/files/be-vietnam-pro-latin-700-normal.woff2?url'
import vi4 from '@fontsource/be-vietnam-pro/files/be-vietnam-pro-vietnamese-400-normal.woff2?url'
import vi6 from '@fontsource/be-vietnam-pro/files/be-vietnam-pro-vietnamese-600-normal.woff2?url'
import vi7 from '@fontsource/be-vietnam-pro/files/be-vietnam-pro-vietnamese-700-normal.woff2?url'

const VI = 'U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB'
const LA = 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD'
/** Chuỗi phông dùng chung: phông app trước, phông hệ thống lùi sau (kí tự ngoài bộ phông vẫn hiện). */
export const PHONG_APP = "'Be Vietnam Pro', 'Noto Sans', -apple-system, 'Segoe UI', Roboto, Arial, sans-serif"

/** CSS đặt ĐẦU tờ: khai phông + ép mọi chữ của tờ dùng phông app (`!important` ⇒ thắng CSS đặt sau). */
export function cssPhongMayChieu(): string {
  const tuyet = (u: string) => { try { return new URL(u, globalThis.location?.href).href } catch { return u } }
  const mat = (u: string, w: string, r: string) => `@font-face{font-family:'Be Vietnam Pro';font-style:normal;font-weight:${w};font-display:swap;src:url('${tuyet(u)}') format('woff2');unicode-range:${r}}`
  return mat(la4, '100 500', LA) + mat(vi4, '100 500', VI) + mat(la6, '501 650', LA) + mat(vi6, '501 650', VI) + mat(la7, '651 1000', LA) + mat(vi7, '651 1000', VI)
    + `:root{--mc-serif:${PHONG_APP};--mc-sans:${PHONG_APP};--sans:${PHONG_APP};--serif:${PHONG_APP}}body,body *:not(svg):not(svg *){font-family:${PHONG_APP}!important}`
}
