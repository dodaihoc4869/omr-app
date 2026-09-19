import { LogoNgang, type LogoNgangProps } from './LogoVai'

/**
 * LOGO APP PHỤ HUYNH — bộ logo thầy chốt 19/09/2026: ngôi nhà bo góc cam ấm + hai chấm lớn–nhỏ + chữ A của Avogadro.
 * Hình là SVG tĩnh (logo-ph-v3.svg / logo-ph-nho-v3.svg cho cỡ ≤ 40 px); chữ đi kèm và luật dùng: xem LogoVai.tsx.
 */
export default function LogoPhuHuynh(props: Omit<LogoNgangProps, 'vai'>) {
  return <LogoNgang vai="ph" {...props} />
}
