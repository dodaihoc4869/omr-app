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

// ACK chỉnh danh sách/hạn có metadata thật: cập nhật cùng phiên, không khởi động vòng chờ Tick.
export type MetadataBaiDangGiao = { lop: string; khoaBai: string; goiId: string; soEm?: number; han?: string; serverNow?: number }
const ngheMetadata = new Set<(bai: readonly MetadataBaiDangGiao[]) => void>()
export function baoMetadataBaiDangGiao(bai: readonly MetadataBaiDangGiao[]) {
  if (bai.length) for (const nhan of ngheMetadata) nhan(bai)
}
export function theoDoiMetadataBaiDangGiao(nhan: (bai: readonly MetadataBaiDangGiao[]) => void) {
  ngheMetadata.add(nhan)
  return () => { ngheMetadata.delete(nhan) }
}
