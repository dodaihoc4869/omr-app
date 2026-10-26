// Biểu tượng nét mảnh (vẽ theo nét lucide) viết thẳng trong mảnh nạp lười — KHÔNG nhập thêm biểu tượng lucide mới (mảnh biểu tượng dùng chung
// nằm trong lượt mở app; thêm vào đó là cộng byte mở app).
const NET: Record<string, string> = {
  book: 'M12 7v14M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z',
  target: 'M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20M12 6a6 6 0 1 0 0 12 6 6 0 1 0 0-12M12 10a2 2 0 1 0 0 4 2 2 0 1 0 0-4',
  route: 'M6 19a3 3 0 1 0 0-.01M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15M18 5a3 3 0 1 0 0-.01',
  pen: 'M12 20h9M16.38 3.62a1 1 0 0 1 3 3L7.37 18.64a2 2 0 0 1-.86.5l-2.87.84a.5.5 0 0 1-.62-.62l.84-2.87a2 2 0 0 1 .5-.86z',
  lock: 'M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2zM7 11V7a5 5 0 0 1 10 0v4',
  eye: 'M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0M12 9a3 3 0 1 0 0 6 3 3 0 1 0 0-6',
  play: 'M6 3l14 9-14 9z',
  check: 'M5 12l5 5 9-10',
  x: 'M18 6 6 18M6 6l12 12',
  info: 'M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20M12 16v-4M12 8h.01',
  flag: 'M4 22V4M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1',
  alert: 'M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20M12 8v4M12 16h.01',
  ask: 'M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01',
}
export type TenBieuTuong = keyof typeof NET
export function BieuTuong({ ten }: { ten: TenBieuTuong }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={ten === 'check' ? 3 : 2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={NET[ten]} />
    </svg>
  )
}
