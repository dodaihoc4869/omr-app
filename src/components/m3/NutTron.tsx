import type { ButtonHTMLAttributes, ReactNode } from 'react'

/** Nút tròn 48 px (đích chạm M3) chỉ có biểu tượng. `nhan` là aria-label — nếu
 *  nút có chữ nhìn thấy thì `nhan` phải là NGUYÊN chữ đó. */
export default function NutTron({
  nhan,
  children,
  className = '',
  ...rest
}: { nhan: string; children: ReactNode } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'children'>) {
  return (
    <button type="button" aria-label={nhan} className={`m3-nut-tron ${className}`.trim()} {...rest}>
      {children}
    </button>
  )
}
