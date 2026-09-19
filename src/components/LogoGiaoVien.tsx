import { LogoNgang, type LogoNgangProps } from './LogoVai'

/**
 * LOGO APP GIÁO VIÊN — bộ logo thầy chốt 19/09/2026: vuông bo xanh dương + quỹ đạo electron + chữ A của Avogadro.
 * Hình là SVG tĩnh (logo-gv-v3.svg / logo-gv-nho-v3.svg cho cỡ ≤ 40 px); chữ đi kèm và luật dùng: xem LogoVai.tsx.
 */
export default function LogoGiaoVien(props: Omit<LogoNgangProps, 'vai'>) {
  return <LogoNgang vai="gv" {...props} />
}
