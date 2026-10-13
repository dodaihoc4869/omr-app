import { Khung64 } from './BieuTuongTuSua'

// ĐỢT 20 · BIỂU TƯỢNG KIỂM TRA ÔN TẬP (bản vẽ docs/ban-ve-dot20 thầy duyệt 13/10). Cùng họ với huy hiệu 12 bậc / Tự sửa lỗi:
// khung 64 (Khung64), ô gradient theo màu nhấn, vệt bóng nửa trên, nét tròn đầu. Mỗi trạng thái một hình — đi kèm chữ ⇒ aria-hidden.

export type HinhKiemTra = 'lam' | 'cho' | 'xong' | 'het'

export default function BieuTuongKiemTra({ hinh }: { hinh: HinhKiemTra }) {
  if (hinh === 'cho') return <Khung64 sac="sua">
    <rect className="bt-v" x="13" y="14" width="28" height="36" rx="5" />
    <path className="bt-n bt-mo" d="M19 23h16M19 30h16M19 37h10" />
    <g transform="translate(36 30)">
      <rect className="ktcn-bt-cat" x="0" y="0" width="20" height="24" rx="5" />
      <path className="ktcn-bt-kim" d="M5 5h10M5 19h10M6 6c0 4 8 4 8 6s-8 2-8 6" />
    </g>
  </Khung64>
  if (hinh === 'xong') return <Khung64 sac="xanh">
    <path className="bt-v" d="M32 11l5 4 6-1 2 6 6 3-2 6 2 6-6 3-2 6-6-1-5 4-5-4-6 1-2-6-6-3 2-6-2-6 6-3 2-6 6 1z" />
    <path className="ktcn-bt-tick" d="M24 33l6 6 11-12" />
    <path className="bt-v bt-mo" d="M24 50l-3 9 6-3 4 5 1-9M40 50l3 9-6-3-4 5-1-9" />
  </Khung64>
  if (hinh === 'het') return <Khung64 sac="xam">
    <circle className="bt-v" cx="32" cy="34" r="17" />
    <path className="bt-n" d="M32 24v10l7 5" />
    <path className="bt-n bt-sang" d="M27 12h10" />
  </Khung64>
  return <Khung64 sac="cham">
    <rect className="bt-v" x="17" y="14" width="30" height="38" rx="6" />
    <rect className="ktcn-bt-kep" x="25" y="10" width="14" height="8" rx="3" />
    <path className="bt-n bt-dung" d="M22 28l3 3 5-6M22 40l3 3 5-6" />
    <path className="bt-n bt-mo" d="M34 29h8M34 41h8" />
    <circle className="ktcn-bt-dh" cx="48" cy="48" r="10" />
    <path className="ktcn-bt-kim" d="M48 43v5l3 2" />
  </Khung64>
}
