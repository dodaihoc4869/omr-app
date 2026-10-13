// Thông báo cùng phiên giao diện; không nhớ dữ liệu lớp hoặc tài khoản giữa các lần mở.
export type BaiDangGiaoThayDoi = { lop: string; khoaBai: string; loai: 'tick' | 'bo-tick' }
const nghe = new Set<(bai: readonly BaiDangGiaoThayDoi[]) => void>()
export function baoBaiDangGiaoThayDoi(bai: readonly BaiDangGiaoThayDoi[]) {
  if (bai.length) for (const nhan of nghe) nhan(bai)
}
export function theoDoiBaiDangGiao(nhan: (bai: readonly BaiDangGiaoThayDoi[]) => void) {
  nghe.add(nhan)
  return () => { nghe.delete(nhan) }
}
