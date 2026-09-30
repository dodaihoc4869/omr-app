import { useId } from 'react'

/** Painted cart with a live, bounded HP ring. Coordinates match the 390×340 escort arena. */
export default function XeLinhTam({ hp, toiDa }: { hp: number; toiDa: number }) {
  const id = useId(), tiLe = Math.max(0, Math.min(1, hp / Math.max(1, toiDa)))
  const chuVi = 2 * Math.PI * 24
  return <g className="bl-xe-linh-tam" data-mau={tiLe <= .25 ? 'thap' : 'binh-thuong'}>
    <defs>
      <radialGradient id={`${id}-ngoc`} cx="34%" cy="27%">
        <stop offset="0" stopColor="rgb(255,255,240)" />
        <stop offset=".3" stopColor="rgb(204,252,224)" />
        <stop offset=".7" stopColor="rgb(99,208,176)" />
        <stop offset="1" stopColor="rgb(28,117,101)" />
      </radialGradient>
      <radialGradient id={`${id}-hao`}>
        <stop stopColor="rgb(199,255,218)" stopOpacity=".65" />
        <stop offset="1" stopColor="rgb(199,255,218)" stopOpacity="0" />
      </radialGradient>
    </defs>
    <ellipse cx="188" cy="290" rx="53" ry="7" fill="rgb(26,64,47)" opacity=".2" />
    <image href="/bat-linh/xe-linh-tam.webp" x="130" y="212" width="130" height="87" />
    <circle cx="182" cy="218" r="42" fill={`url(#${id}-hao)`} />
    <circle cx="182" cy="218" r="17" fill={`url(#${id}-ngoc)`} stroke="rgb(234,209,147)" strokeWidth="1" />
    <path d="M177 208q-8 3-7 11" stroke="rgb(255,255,237)" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    <circle cx="182" cy="218" r="24" fill="none" stroke="rgb(40,87,64)" strokeOpacity=".3" strokeWidth="3" />
    <circle className="dh2-vong-mau" cx="182" cy="218" r="24" fill="none"
      stroke={tiLe <= .25 ? 'rgb(187,103,46)' : 'rgb(242,210,130)'} strokeWidth="3" strokeLinecap="round"
      strokeDasharray={`${(chuVi * tiLe).toFixed(1)} ${chuVi.toFixed(1)}`} transform="rotate(-90 182 218)" />
  </g>
}
