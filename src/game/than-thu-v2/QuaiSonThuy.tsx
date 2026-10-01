/** Original transparent creature atlas shared by every island/escort arena.
 * Each viewport clips to one creature; no CSS filter changes semantic type colors. */
const O_QUAI: Record<string, readonly [number, number, number, number]> = {
  bun_acid: [0, 0, 442, 386],
  khoi_oxi_hoa: [443, 0, 444, 382],
  tinh_the_ket_tua: [887, 0, 443, 390],
  suong_mu: [1330, 0, 444, 386],
  ba_chu_an_mon: [0, 405, 442, 482],
  lanh_chua_khoi_doc: [443, 382, 447, 505],
  chua_te_ket_tua: [890, 394, 439, 493],
  trum_suong_mu: [1330, 388, 444, 499],
}
export default function QuaiSonThuy({ loai, size, className = '', x, y }: { loai: string; size: number; className?: string; x?: number; y?: number }) {
  const crop = O_QUAI[loai] ?? O_QUAI.bun_acid!
  return <svg className={`bl-quai ${className}`} x={x} y={y} width={size} height={size} viewBox={crop.join(' ')} style={{ overflow: 'hidden' }} aria-hidden="true" focusable="false">
    <image href="/bat-linh/quai-son-thuy.webp" width="1774" height="887" />
  </svg>
}
