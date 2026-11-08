// THÊM GIỜ CHO TỪNG EM (thầy 08/11) — phần TÍNH cho màn Theo dõi ca: hạn riêng của em + số phút thầy đã thêm riêng cho em.
// Cùng công thức máy chủ (server/src/them-phut.ts `themPhutEm`): phút thêm riêng = hạn hiện hành − hạn gốc; hạn gốc = (giờ bắt đầu chung nếu ca «cả phòng cùng
// hết giờ», ngược lại giờ em vào) + thời gian ca (đã gồm phần thầy thêm cho cả phòng). Không gọi máy chủ.
export interface CaGioEm { thoiGianPhut: number; dongBoGio?: boolean; batDauThiLuc?: string; batDau?: string }
export interface LuotGioEm { trangThai?: string; vaoLuc?: string | null; hetGioLuc?: string | null }

export function hanRiengEm(l: LuotGioEm, ca: CaGioEm): { hetLucMs: number | null; themPhutEm: number; vaoMuonPhut: number | null } {
  const het = Date.parse(String(l.hetGioLuc ?? ''))
  const vao = Date.parse(String(l.vaoLuc ?? ''))
  if (!Number.isFinite(het)) return { hetLucMs: null, themPhutEm: 0, vaoMuonPhut: null }
  const chung = ca.dongBoGio ? Date.parse(String(ca.batDauThiLuc ?? '')) : NaN
  const moc = Number.isFinite(chung) ? chung : vao
  const goc = Number.isFinite(moc) ? moc + (Number(ca.thoiGianPhut) || 45) * 60_000 : NaN
  const themPhutEm = Number.isFinite(goc) ? Math.max(0, Math.round((het - goc) / 60_000)) : 0
  const moCa = Date.parse(String(ca.batDauThiLuc || ca.batDau || '')) // «vào muộn» tính từ lúc ca bắt đầu thi
  const vaoMuonPhut = Number.isFinite(moCa) && Number.isFinite(vao) ? Math.max(0, Math.round((vao - moCa) / 60_000)) : null
  return { hetLucMs: het, themPhutEm, vaoMuonPhut }
}
