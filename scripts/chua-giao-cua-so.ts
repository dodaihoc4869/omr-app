export type KetQuaGiao = { ok: true; soCap: number; tiepOffset: number; con: boolean }
export async function raDanhSach<T>(ds: T[], goi: (cap: T) => Promise<{ ok: true; soCap: number }>) {
  const rs = await Promise.allSettled(ds.map(goi))
  if (rs.some(r => r.status !== 'fulfilled' || !r.value.ok || r.value.soCap !== 1))
    throw new Error('Danh sách chưa giao đủ; giữ checkpoint.')
  return ds.length
}
// Mỗi yêu cầu dùng đúng giaoPilot LIMIT 2. Chỉ chốt khi cả cửa sổ đã trả xong.
export async function raCuaSo(offset: number, goi: (offset: number) => Promise<KetQuaGiao>, soLuong = 6) {
  const rs = await Promise.allSettled(Array.from({ length: soLuong }, (_, i) => goi(offset + i * 2)))
  let next = offset, het = false
  for (let i = 0; i < rs.length; i++) {
    const r = rs[i]
    if (r.status !== 'fulfilled') throw new Error('Cửa sổ chưa hoàn tất; giữ checkpoint.')
    const v = r.value
    if (!v.ok || !Number.isSafeInteger(v.soCap) || v.soCap < 0 || v.soCap > 2 || v.tiepOffset !== offset + i * 2 + v.soCap || v.con !== (v.soCap === 2) || (het && v.soCap !== 0))
      throw new Error('Kết quả giao không liên tục; giữ checkpoint.')
    if (!het) next = v.tiepOffset
    if (!v.con) het = true
  }
  return { tiepOffset: next, con: !het, soCap: next - offset }
}
