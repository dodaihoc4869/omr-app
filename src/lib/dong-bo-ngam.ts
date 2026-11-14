// ĐỒNG BỘ NGẦM KHO ĐỀ MÁY THẦY (thầy 14/11: «đề trên app gv thì là 3% còn app hs là 1%»).
// GỐC: máy em lấy câu từ kho MÁY CHỦ; bảng Live / Dạy học / Gọi lên bảng / tờ chữa của thầy dựng từ kho trên MÁY THẦY (IndexedDB). Kho máy thầy chỉ được
// làm mới khi mở màn Ngân hàng đề / Mở ca hoặc bấm Đồng bộ ⇒ câu đã sửa trên máy chủ (vd đợt tự sửa kho 29/09: DH-11-C2-B9-D1 câu 10 «3%» ⇒ «1%»
// cho khớp đáp án B 30,99 m³) vẫn chiếu bản cũ trên bảng của thầy.
// CÁCH LÀM: thầy mở khoá app ⇒ lúc rảnh đồng bộ ngầm một lượt, rồi cứ 15 phút (chỉ khi cửa sổ đang hiện); mở bảng Dạy học / Live / Gọi lên bảng cũng gọi
// (cách nhau ≥ 5 phút, một lượt một lúc). CHỈ TẢI đề đổi (`chonDeCanTai`), KHÔNG đụng ca đã mở (`ngam`). Có đề đổi ⇒ báo các màn đang giữ kho đọc lại.
// Lỗi / mất mạng / chưa có mã ⇒ im lặng, màn vẫn dùng kho trên máy như cũ.

let dangChay: Promise<number> | null = null
let lanCuoi = 0
let hen: ReturnType<typeof setTimeout> | null = null
const nghe = new Set<() => void>()
const CACH_TOI_THIEU = 5 * 60_000
const CHU_KY = 15 * 60_000

/** Đăng kí nghe «kho đề trên máy vừa đổi». Trả hàm gỡ. */
export function khiKhoDoi(f: () => void): () => void {
  nghe.add(f)
  return () => { nghe.delete(f) }
}

/** Một lượt đồng bộ ngầm. Trả số đề vừa thêm / cập nhật / xoá trên máy (0 khi bỏ qua hoặc lỗi). */
export function dongBoNgam(ep = false): Promise<number> {
  if (dangChay) return dangChay
  if (!ep && Date.now() - lanCuoi < CACH_TOI_THIEU) return Promise.resolve(0)
  lanCuoi = Date.now()
  dangChay = (async () => {
    try {
      // KHÔNG nạp động `dia-chi-may-chu` ở đây: nạp động giữ CẢ module trong khối dùng chung của 3 app (+byte máy em / phụ huynh — cổng tốc độ 14/11);
      // `loadScriptUrlHoacMacDinh` (exam-db) đã tự hỏi `layDiaChiMayChu` khi máy chưa lưu địa chỉ.
      const [{ loadScriptUrlHoacMacDinh, loadTeacherSecret }, { dongBoNganHang }] = await Promise.all([import('./exam-db'), import('./exam-sync')])
      const [url, mat] = await Promise.all([loadScriptUrlHoacMacDinh(), loadTeacherSecret()])
      if (!url.trim() || !mat.trim()) return 0
      const kq = await dongBoNganHang(url.trim(), mat.trim(), false, { ngam: true })
      const n = kq.moi.length + kq.capNhat.length + kq.daXoa.length
      if (n) for (const f of nghe) { try { f() } catch { /* một màn hỏng không chặn màn khác */ } }
      return n
    } catch {
      return 0
    } finally {
      dangChay = null
    }
  })()
  return dangChay
}

/** Bật đồng bộ ngầm định kì (gọi khi thầy mở khoá app). Hẹn giờ NỐI TIẾP (setTimeout, không setInterval — bảng nhịp tests/nhip-bang-2109): lượt sau chỉ hẹn
 *  khi lượt trước xong; chỉ chạy khi cửa sổ đang hiện VÀ app thầy còn mở khoá (App.tsx gỡ `window.__ddh` khi khoá / rời app quản lý ⇒ lượt tự bỏ qua). */
export function batDongBoNgam(): void {
  void dongBoNgam(true)
  if (hen) return
  const henLai = (): void => {
    hen = setTimeout(() => {
      const mo = typeof window !== 'undefined' && !!(window as unknown as Record<string, unknown>).__ddh
      if (mo && document.visibilityState === 'visible') void dongBoNgam().finally(henLai)
      else henLai()
    }, CHU_KY)
  }
  henLai()
}
