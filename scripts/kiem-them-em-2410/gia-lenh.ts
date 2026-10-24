// Máy chủ GIẢ cho trang kiểm «Thêm em tay» (24/10) — đúng hình dạng trả lời của /gv/lop, /gv/nhip-hoc, /gv/buoi-hoc, /gv/muc-lam-lo.
const NGAY = Array.from({ length: 12 }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`)
const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đỗ', 'Bùi', 'Đặng', 'Chu']
const TEN = ['Minh Anh', 'Gia Bảo', 'Mai Phương', 'Đức Huy', 'Quang Minh', 'Bảo Ngọc', 'Khánh Vy', 'Gia Linh', 'Hải Chi', 'Thanh Bình']
const EM = Array.from({ length: 48 }, (_, i) => ({ sbd: `S${i + 1}`, hoTen: `${HO[i % 10]} ${TEN[(i * 3) % 10]}`, tenLop: '12A1' }))
const luc = (i: number) => new Date(Date.parse('2026-10-12T10:50:00Z') + i * 20_000).toISOString()
const BUOI = { id: 'BH-12', ten: 'Buổi học 12/10 · 12A1', lop: '12A1', moLuc: '2026-10-12T10:50:00Z', hetHan: '2026-10-13T10:50:00Z', dongLuc: null, dangMo: true }
let coMat = EM.slice(0, 40).map((e, i) => ({ sbd: e.sbd, hoTen: e.hoTen, luc: luc(i), cach: 'ma' }))
const NHIP = {
  ok: true, tu: '2026-10-01', den: '2026-10-12', homNay: '2026-10-12', ngay: NGAY, lop: [], doiPhoDaTinh: { quaNhanh: true, chonLap: true }, canhBao: [],
  em: EM.map((e, i) => ({ sbd: e.sbd, hoTen: e.hoTen, lop: '12A1', khoi: '12', ngayVao: '2026-10-01', muc: NGAY.map(() => 24), lam: NGAY.map((_, j) => ((i + j) % 4 === 0 ? 0 : 24)), doiPho: null })),
}
export async function goiLenh(duong: string, b: Record<string, unknown>) {
  await new Promise((r) => setTimeout(r, 30))
  if (duong === '/gv/lop') return { ok: true, du: { ok: true, lop: [{ tenLop: '12A1', khoi: '12', soEm: 48, sbd: [] }] } }
  if (duong === '/gv/nhip-hoc') return { ok: true, du: NHIP }
  if (duong === '/gv/muc-lam-lo') return { ok: true, du: { ok: true, tu: '2026-09-29', den: '2026-10-12', em: Object.fromEntries((b.sbds as string[]).map((s) => [s, { soDo: 10, chuaCoSoDo: 0, m: [2, 2, 3, 3], soUocTinh: 0, soTreo: 0, soCoTinh: 0, soChuaDoTreo: 0, saiLamVoi: 1, saiDuNghi: 1 }])) } }
  if (duong === '/gv/buoi-hoc') {
    if (b.action === 'dang-mo') return { ok: true, du: { ok: true, buoi: [BUOI] } }
    if (b.action === 'them-em') coMat = [...coMat, ...(b.sbd as string[]).map((s, i) => ({ sbd: s, hoTen: EM.find((e) => e.sbd === s)!.hoTen, luc: luc(60 + i), cach: 'thay' }))]
    return { ok: true, du: { ok: true, buoi: BUOI, ma: '482915', doiMaLuc: Date.now() + 40_000, coMat, siSo: 48, lopEm: b.kemLop ? EM : null } }
  }
  return { ok: false, loai: 'chua_co_lenh', chu: 'lệnh lạ' }
}
