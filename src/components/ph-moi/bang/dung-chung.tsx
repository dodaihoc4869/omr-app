// Phần DÙNG CHUNG của bảng "Mọi thứ về con" kiểu Apple: thanh mảnh, chip, tên gọi của con, giờ từ mốc máy chủ, và câu hỏi "hôm nay con chưa học?". Thuần, không gọi mạng.
import type { ReactNode } from "react";
import { gioVn } from "../../../lib/ph-moi/dinh-dang";
import type { PhMoi } from "../../../lib/ph-moi/du-lieu";

/** "Nguyễn Minh Khôi" ⇒ "Khôi" (tên gọi = từ cuối). Rỗng ⇒ "con". */
export const tenGoi = (hoTen: string): string =>
  hoTen.trim().split(/\s+/).filter(Boolean).pop() || "con";

/** Mốc giờ của máy chủ: ISO ⇒ "20:47"; đã là "17:00" ⇒ giữ; còn lại ⇒ "". */
export const chuGioLuc = (luc: string): string =>
  /^\d{1,2}:\d{2}$/.test(luc) ? luc.padStart(5, "0") : luc ? gioVn(luc) : "";

/** Hôm nay con chưa học: không có câu nào (tổng quan không đếm được câu, không mốc, không câu). Khối tổng quan vắng hẳn cũng coi là chưa học (máy chủ luôn trả số 0 khi có học). */
export function conChuaHoc(pm: PhMoi): boolean {
  const t = pm.tongQuan;
  return (
    (t?.soCau ?? 0) === 0 &&
    t?.datNhiemVu !== true &&
    !(pm.dongThoiGian && pm.dongThoiGian.length > 0) &&
    !(pm.cau && pm.cau.length > 0)
  );
}

/** Thanh mảnh kiểu Health. `ti` ∈ [0, 1] (ngoài khoảng ⇒ kẹp). `nhan` là chữ đọc cho người dùng màn hình. */
export function Thanh({
  ti,
  nhan,
  mau,
  manh,
}: {
  ti: number;
  nhan: string;
  mau?: "dat" | "cam";
  manh?: boolean;
}) {
  const pct = Math.max(0, Math.min(1, Number.isFinite(ti) ? ti : 0)) * 100;
  return (
    <span
      className={`phm-thanh${manh ? " phm-thanh--manh" : ""}`}
      data-mau={mau}
      role="img"
      aria-label={nhan}
    >
      <i style={{ width: `${pct.toFixed(1)}%` }} />
    </span>
  );
}

/** Viên thuốc nhỏ (nhãn trạng thái). `mau`: dat | cam | do; không có ⇒ xám. */
export function Chip({
  mau,
  icon,
  children,
}: {
  mau?: "dat" | "cam" | "do";
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <span className="phm-chip" data-mau={mau}>
      {icon}
      {children}
    </span>
  );
}
