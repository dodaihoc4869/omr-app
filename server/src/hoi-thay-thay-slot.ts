// Ưu tiên kiểm lại bằng cách thay slot ôn thật đã được lõi phân, không đoán ngân sách từ số ứng viên.
// Mọi câu mới và mọi slot được bảo vệ giữ nguyên, kể cả khi nhiều câu cũ trùng một nhóm nội dung.
export function thaySlotOnHoiThay(
  baseline: readonly string[], denHan: readonly string[],
  q: { laMoi: (id: string) => boolean; duoc: (id: string) => boolean; nhom: (id: string) => string;
    vaiTro: (id: string) => string; giu?: ReadonlySet<string> },
): string[] {
  const daChon = new Set(baseline), due = new Set(denHan)
  const soNhom = new Map<string, number>()
  for (const id of baseline) { const g = q.nhom(id); soNhom.set(g, (soNhom.get(g) ?? 0) + 1) }
  const ung = [...due].filter(id => !daChon.has(id) && q.duoc(id) && !q.laMoi(id))
  return baseline.map(id => {
    if (q.laMoi(id) || q.giu?.has(id) || due.has(id)) return id
    const cu = q.nhom(id), role = q.vaiTro(id)
    const thay = ung.find(x => !daChon.has(x) && q.vaiTro(x) === role &&
      (soNhom.get(q.nhom(x)) ?? 0) - Number(q.nhom(x) === cu) === 0)
    if (!thay) return id
    daChon.delete(id); daChon.add(thay)
    soNhom.set(cu, (soNhom.get(cu) ?? 1) - 1)
    const g = q.nhom(thay); soNhom.set(g, (soNhom.get(g) ?? 0) + 1)
    return thay
  })
}
