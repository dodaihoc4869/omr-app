import { LogoNgang, type LogoNgangProps } from './LogoVai'

/**
 * LOGO APP HỌC SINH — bộ logo thầy chốt 19/09/2026: bánh quy 12 múi xanh lá + sao tiến bộ + gạch rời vàng + chữ A của Avogadro.
 * Hình là SVG tĩnh (logo-hs-v3.svg / logo-hs-nho-v3.svg cho cỡ ≤ 40 px); chữ đi kèm và luật dùng: xem LogoVai.tsx.
 * Thẻ này nằm trong màn thi thật (ExamTakeScreen, PhongChoGame): chỉ đổi phần hình + chữ thương hiệu, không đụng luồng.
 */
export default function LogoHocSinh(props: Omit<LogoNgangProps, 'vai'>) {
  return <LogoNgang vai="hs" {...props} />
}
