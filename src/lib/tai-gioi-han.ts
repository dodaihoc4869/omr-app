// Giữ thứ tự kết quả nhưng chỉ để tối đa N lượt đọc chạy đồng thời.
export async function taiGioiHan<T, R>(ds: readonly T[], viec: (x: T) => Promise<R>, gioiHan = 4): Promise<R[]> {
  const kq = new Array<R>(ds.length)
  let tiep = 0
  const so = Number.isFinite(gioiHan) ? Math.max(1, Math.floor(gioiHan)) : 4
  const luong = async () => { while (tiep < ds.length) { const i = tiep++; kq[i] = await viec(ds[i]!) } }
  await Promise.all(Array.from({ length: Math.min(so, ds.length) }, luong))
  return kq
}
