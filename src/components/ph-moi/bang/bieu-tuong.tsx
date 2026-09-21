// Biểu tượng nét mảnh (tinh thần SF Symbols) của bảng "Mọi thứ về con" kiểu Apple — vẽ tay theo mẫu docs/ban-ve-ph-apple-2109/ph-d-bang-day-du.html (21 biểu tượng, KHÔNG thêm tệp).
// Lớp `phm-i` (ph-apple-bang.css) đặt cỡ/nét; `phm-i--mui` cho mũi tên cuối hàng; `phm-i--s` cho cỡ nhỏ. Mọi biểu tượng chỉ để trang trí (aria-hidden): ý nghĩa luôn có chữ đi kèm.
import type { ReactNode } from "react";

function Bt({ lop, children }: { lop?: string; children: ReactNode }) {
  return (
    <svg
      className={`phm-i${lop ? ` ${lop}` : ""}`}
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
    >
      {children}
    </svg>
  );
}
type Lop = { lop?: string };

export const BtLui = ({ lop }: Lop) => (
  <Bt lop={lop}>
    <path d="m15 5-7 7 7 7" />
  </Bt>
);

export const BtTichVong = ({ lop }: Lop) => (
  <Bt lop={lop}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12.4 2.8 2.8 5.2-6" />
  </Bt>
);

export const BtMuiLen = ({ lop }: Lop) => (
  <Bt lop={lop}>
    <path d="M12 19V5" />
    <path d="m6 11 6-6 6 6" />
  </Bt>
);

export const BtXoay = ({ lop }: Lop) => (
  <Bt lop={lop}>
    <path d="M20 12a8 8 0 1 1-2.5-5.8" />
    <path d="M20 4v5h-5" />
  </Bt>
);

export const BtMui = ({ lop }: Lop) => (
  <Bt lop={lop}>
    <path d="m9 5 7 7-7 7" />
  </Bt>
);

export const BtSach = ({ lop }: Lop) => (
  <Bt lop={lop}>
    <path d="M12 6.5C10.3 5 7.8 4.5 4 4.5v13c3.8 0 6.3.5 8 2 1.7-1.5 4.2-2 8-2v-13c-3.8 0-6.3.5-8 2z" />
    <path d="M12 6.5v13" />
  </Bt>
);

export const BtMucTieu = ({ lop }: Lop) => (
  <Bt lop={lop}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="0.8" />
  </Bt>
);

export const BtBac = ({ lop }: Lop) => (
  <Bt lop={lop}>
    <path d="M3.5 19.5H8V15h4.5v-4.5H17V6h3.5" />
  </Bt>
);

export const BtNha = ({ lop }: Lop) => (
  <Bt lop={lop}>
    <path d="M4 10.5 12 4l8 6.5" />
    <path d="M6 9.5v10h12v-10" />
    <path d="M10 19.5v-5h4v5" />
  </Bt>
);

export const BtSao = ({ lop }: Lop) => (
  <Bt lop={lop}>
    <path d="M11 4.5 12.7 10l5.8 1.7-5.8 1.8L11 19l-1.7-5.5-5.8-1.8L9.3 10z" />
    <path d="M18.5 3.5v3.4M16.8 5.2h3.4" />
  </Bt>
);

export const BtTich = ({ lop }: Lop) => (
  <Bt lop={lop}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Bt>
);

export const BtLichTich = ({ lop }: Lop) => (
  <Bt lop={lop}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="3.5" />
    <path d="M8 3v4" />
    <path d="M16 3v4" />
    <path d="M3.5 10h17" />
    <path d="m9 15.2 2.2 2.2 3.8-4.2" />
  </Bt>
);

export const BtDanhSach = ({ lop }: Lop) => (
  <Bt lop={lop}>
    <path d="M10 6.5h10M10 12h10M10 17.5h10" />
    <path d="m3.5 6.3 1.4 1.4 2.3-2.6M3.5 11.8l1.4 1.4 2.3-2.6M3.5 17.3l1.4 1.4 2.3-2.6" />
  </Bt>
);

export const BtKhoa = ({ lop }: Lop) => (
  <Bt lop={lop}>
    <rect x="5" y="11" width="14" height="9.5" rx="2.5" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </Bt>
);

export const BtMuiXuong = ({ lop }: Lop) => (
  <Bt lop={lop}>
    <path d="m5 9 7 7 7-7" />
  </Bt>
);

export const BtCheo = ({ lop }: Lop) => (
  <Bt lop={lop}>
    <path d="m7 7 10 10M17 7 7 17" />
  </Bt>
);

export const BtDongHo = ({ lop }: Lop) => (
  <Bt lop={lop}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Bt>
);

export const BtNguoi = ({ lop }: Lop) => (
  <Bt lop={lop}>
    <circle cx="9" cy="9" r="3.2" />
    <path d="M3.5 19c.6-3.2 2.7-5 5.5-5s4.9 1.8 5.5 5" />
    <circle cx="17" cy="9.5" r="2.5" />
    <path d="M16.5 14c2.3.2 3.7 1.8 4.2 4.5" />
  </Bt>
);

export const BtGui = ({ lop }: Lop) => (
  <Bt lop={lop}>
    <path d="M21 3 10.2 13.8" />
    <path d="m21 3-6.6 18-4.2-7.2L3 9.6z" />
  </Bt>
);

export const BtBang = ({ lop }: Lop) => (
  <Bt lop={lop}>
    <path d="M5 12h14" />
  </Bt>
);

export const BtCot = ({ lop }: Lop) => (
  <Bt lop={lop}>
    <path d="M5 20V11M12 20V4M19 20v-6" />
  </Bt>
);
