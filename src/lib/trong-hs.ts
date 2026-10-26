// GIAO DIỆN «TRONG» (thầy chốt bản vẽ 26/10) — CÔNG TẮC CHO JSX app học sinh. main.tsx gắn `<html data-trong>` TRƯỚC khi vẽ; lùi một máy bằng
// localStorage `ddh.trong` = 'tat' ⇒ không có thuộc tính ⇒ hàm trả false ⇒ màn vẽ y giao diện cũ. Chỉ dùng cho phần TRÌNH BÀY thêm (vòng tiến độ,
// thứ tự cột, logo ở thanh trên…): không đổi dữ liệu, lệnh máy chủ hay luồng. Gọi lúc vẽ (không chốt lúc nạp mô-đun — mô-đun có thể nạp trước khi gắn).
export function laTrong(): boolean {
  try { return typeof document !== 'undefined' && !!document.documentElement.dataset.trong } catch { return false }
}
