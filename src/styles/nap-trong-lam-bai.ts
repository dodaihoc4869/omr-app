// «TRONG» 26/10 — nhóm 2 (học sinh làm bài): tờ trình bày styles/trong-lam-bai.css nạp RIÊNG và CHỈ khi giao diện «Trong» bật (<html data-trong>,
// main.tsx gắn trước khi vẽ). Không cộng byte vào lượt mở /t, /hs (luật tốc độ 13/10); máy đã tắt «Trong» (ddh.trong='tat') không tải gì.
// Gọi ở lần vẽ đầu của màn (idempotent): tờ về trong vài mili giây, trước khi em chạm câu đầu tiên. CHỈ trình bày — không đụng logic nào.
let daNap = false

/** Giao diện «Trong» đang bật trên máy này. */
export function coGiaoDienTrong(): boolean {
  return typeof document !== 'undefined' && !!document.documentElement.dataset.trong
}

export function napTrongLamBai(): void {
  if (daNap || !coGiaoDienTrong()) return
  daNap = true
  void import('./trong-lam-bai.css').catch(() => {
    daNap = false
  })
}
