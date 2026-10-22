// LỊCH SỬ LÀM CÂU GIẢ CÓ ĐỦ 6 MỨC (thầy duyệt bản vẽ docs/ban-ve-ho-so-em-2210, 22/10) — cho test giao diện và ảnh chụp THẬT của tấm Hồ sơ làm bài.
// Số giả, tên giả; hình dạng đúng hợp đồng `server/src/lich-su-lam-cau-kieu.ts`. Mức 1–4 do CHÍNH hàm máy chủ `mucLamCuaLuot` tính; treo máy gắn theo
// đúng hợp đồng lõi (`treo`, `giayTreo`, `daDoTreo`; Mức 6 từ ≥ 3 lượt treo cùng ngày — `nangCoTinhTheoNgay`); tổng 6 mức do CHÍNH hàm thuần `mucLam6`.
// Bản học sinh / phụ huynh phản chiếu luật lọc máy chủ: Mức 6 hạ về 5 (`mucCongKhai`), lượt ĐÚNG Mức 1–2 không treo thì không mang mức,
// phụ huynh bỏ `giayTreo` (`banPhuHuynhLichSu`). Luật thật được test ở tests/lich-su-treo-ban-ph-2210.test.ts.
import { mucCongKhai, mucLamCuaLuot, nangCoTinhTheoNgay, tongMucLam, type MucLamLuot } from '../../../server/src/muc-lam'
import { mucLam6 } from '../../../server/src/lich-su-6-muc'
import type { CauEmSai, KetQuaLichSuLamCau, LanLamCau } from '../../../server/src/lich-su-lam-cau-kieu'

/** "Bây giờ" của bộ giả: 20:00 Thứ Năm 22/10/2026 giờ Việt Nam ⇒ 7 ngày gần nhất 16/10 – 22/10. */
export const NOW_6_MUC = Date.parse('2026-10-22T13:00:00Z')

interface DongGia {
  ngay: number
  gio: string
  qid: string
  tieuDe: string
  mucDo: string
  noi: string
  dung: boolean | null
  giay: number | null
  soTu?: number
  phan?: 'I' | 'II' | 'III'
  thuong?: number
  /** Giây em không ở với câu (đồng hồ mới đo được treo). */
  treo?: number
  /** Lượt có số đo treo máy mà không treo (đồng hồ 22/10). */
  daDo?: boolean
}

const D = (x: DongGia) => x
// Mới → cũ. 21/10: 4 lượt treo cùng ngày ⇒ Mức 6 (bản thầy). 20/10 trở về trước: máy em chưa có đồng hồ treo ⇒ "Chưa đo treo máy".
const DONG: DongGia[] = [
  D({ ngay: 22, gio: '20:41', qid: 'DH-12-C5-B2-7', tieuDe: 'Câu 7 · Điện phân', mucDo: 'VD', noi: 'BTVN', dung: false, giay: 470, soTu: 40, phan: 'I', treo: 434 }),
  D({ ngay: 22, gio: '20:30', qid: 'DH-12-C5-B1-12', tieuDe: 'Câu 12 · Pin điện hoá', mucDo: 'hieu', noi: 'BTVN', dung: false, giay: 14, soTu: 45, phan: 'I', daDo: true }),
  D({ ngay: 22, gio: '19:58', qid: 'DH-12-C5-B3-15', tieuDe: 'Câu 15 · Ăn mòn điện hoá', mucDo: 'VD', noi: 'Đảo', dung: true, giay: 96, soTu: 60, phan: 'I', thuong: 70, daDo: true }),
  D({ ngay: 22, gio: '19:40', qid: 'DH-12-C5-B1-9', tieuDe: 'Câu 9 · Pin điện hoá', mucDo: 'biet', noi: 'Đảo', dung: true, giay: 8, soTu: 30, phan: 'I', daDo: true }),
  D({ ngay: 22, gio: '19:20', qid: 'DH-12-C5-B2-8', tieuDe: 'Câu 8 · Điện phân dung dịch', mucDo: 'VD', noi: 'Đảo', dung: true, giay: 300, soTu: 50, phan: 'II', treo: 345 }),
  D({ ngay: 21, gio: '15:02', qid: 'DH-12-C5-B2-21', tieuDe: 'Câu 21 · Điện phân dung dịch', mucDo: 'VD', noi: 'Ôn lại', dung: false, giay: 690, soTu: 55, phan: 'I', treo: 660 }),
  D({ ngay: 21, gio: '14:40', qid: 'DH-12-C5-B1-9', tieuDe: 'Câu 9 · Pin điện hoá', mucDo: 'biet', noi: 'Ôn lại', dung: true, giay: 440, soTu: 30, phan: 'I', treo: 420 }),
  D({ ngay: 21, gio: '14:21', qid: 'DH-12-C5-B1-30', tieuDe: 'Câu 30 · Sơ đồ pin Zn–Cu', mucDo: 'hieu', noi: 'Ôn lại', dung: false, giay: 500, soTu: 40, phan: 'I', treo: 480 }),
  D({ ngay: 21, gio: '14:05', qid: 'DH-12-C4-B4-3', tieuDe: 'Câu 3 · Đại cương kim loại', mucDo: 'biet', noi: 'Ôn lại', dung: false, giay: 390, soTu: 35, phan: 'I', treo: 372 }),
  D({ ngay: 21, gio: '13:40', qid: 'DH-12-C5-B3-16', tieuDe: 'Câu 16 · Ăn mòn kim loại', mucDo: 'hieu', noi: 'Ôn lại', dung: true, giay: 42, soTu: 40, phan: 'I', daDo: true }),
  D({ ngay: 20, gio: '21:14', qid: 'DH-12-C5-B3-18', tieuDe: 'Câu 18 · Ăn mòn kim loại', mucDo: 'hieu', noi: 'BTVN', dung: false, giay: 58, soTu: 50, phan: 'I' }),
  D({ ngay: 20, gio: '21:02', qid: 'DH-12-C5-B1-12', tieuDe: 'Câu 12 · Pin điện hoá', mucDo: 'hieu', noi: 'BTVN', dung: false, giay: 16, soTu: 45, phan: 'I' }),
  D({ ngay: 19, gio: '14:00', qid: 'DH-12-C5-B5-26', tieuDe: 'Câu 26 · Điều chế kim loại', mucDo: 'VD', noi: 'Ca Kiểm tra 15 phút', dung: null, giay: null }),
  D({ ngay: 18, gio: '20:10', qid: 'DH-12-C5-B2-7', tieuDe: 'Câu 7 · Điện phân', mucDo: 'VD', noi: 'BTVN', dung: false, giay: 25, soTu: 40, phan: 'I' }),
  D({ ngay: 17, gio: '19:30', qid: 'DH-12-C5-B3-15', tieuDe: 'Câu 15 · Ăn mòn điện hoá', mucDo: 'VD', noi: 'Đảo', dung: true, giay: 80, soTu: 60, phan: 'I', thuong: 70 }),
  D({ ngay: 10, gio: '09:00', qid: 'DH-12-C4-B1-2', tieuDe: 'Câu 2 · Tính chất kim loại', mucDo: 'biet', noi: 'BTVN', dung: false, giay: 12, soTu: 28, phan: 'I' }),
]

const lucCua = (d: DongGia) => {
  const [h, m] = d.gio.split(':').map(Number)
  return new Date(Date.UTC(2026, 9, d.ngay, h! - 7, m!)).toISOString()
}
const ngayCua = (d: DongGia) => `2026-10-${String(d.ngay).padStart(2, '0')}`

/** Mức làm của một lượt (bản thầy): Mức 1–4 từ `mucLamCuaLuot`, rồi treo / đã đo treo theo hợp đồng lõi; Mức 6 nâng theo ngày. */
function mucThay(): (MucLamLuot | null)[] {
  const tho = DONG.map((d) => {
    if (d.giay === null || d.soTu === undefined) return { ngay: ngayCua(d), mucLam: null }
    const m = mucLamCuaLuot({ giay: d.giay, soTu: d.soTu, coHinh: false, phan: d.phan ?? 'I', dung: d.dung, thuongGiay: d.thuong ?? null })
    if (!m) return { ngay: ngayCua(d), mucLam: null }
    const them: Partial<MucLamLuot> = d.treo !== undefined ? { treo: 'treo', giayTreo: d.treo } : d.daDo ? { daDoTreo: true } : {}
    return { ngay: ngayCua(d), mucLam: { ...m, ...them } as MucLamLuot }
  })
  return nangCoTinhTheoNgay(tho).map((x) => x.mucLam ?? null)
}

export type CheDoGia6 = 'thay' | 'hoc-sinh' | 'phu-huynh'

/** Kết quả `/…/lich-su-lam-cau` giả cho từng góc nhìn. `cu`: mọi lượt làm trước đồng hồ treo (không `treo`/`daDoTreo`). */
export function lichSu6MucGia(sbd: string, hoTen: string, cheDo: CheDoGia6, tuy: { cu?: boolean } = {}): KetQuaLichSuLamCau {
  const laThay = cheDo === 'thay'
  const mucGoc = mucThay().map((m) => {
    if (!m || !tuy.cu) return m
    const { treo: _t, giayTreo: _g, daDoTreo: _d, ...con } = m
    return con as MucLamLuot
  })
  const muc = mucGoc.map((m) => (laThay ? m : m ? mucCongKhai(m) ?? null : null))
  const anMuc = (i: number) => !laThay && !!muc[i] && !muc[i]!.treo && DONG[i]!.dung === true && muc[i]!.ma <= 2
  const lan: LanLamCau[] = DONG.map((d, i) => {
    let m = muc[i] && !anMuc(i) ? muc[i]! : undefined
    if (m && cheDo === 'phu-huynh' && m.giayTreo !== undefined) {
      const { giayTreo: _bo, ...con } = m
      m = con as MucLamLuot
    }
    return {
      luc: lucCua(d),
      ngay: ngayCua(d),
      qid: laThay ? d.qid : `c${i + 1}`,
      tieuDe: d.tieuDe,
      mucDo: d.mucDo,
      noi: d.noi,
      dung: d.dung,
      chon: laThay && d.dung !== null ? 'B' : null,
      giay: d.giay,
      nguonGiay: d.giay === null ? null : 'do',
      coGoiY: false,
      ...(m ? { mucLam: m } : {}),
    }
  })
  const thay = lan.filter((_, i) => !anMuc(i))
  const m6 = mucLam6(thay, NOW_6_MUC, laThay, lan)
  const bo = cheDo === 'phu-huynh' && m6.ngayCoTinh ? (({ ngayCoTinh: _n, ...c }) => c)(m6) : m6
  // Câu từng sai: gom theo câu (mới trước).
  const theoCau = new Map<string, number[]>()
  DONG.forEach((d, i) => theoCau.set(d.qid, [...(theoCau.get(d.qid) ?? []), i]))
  const cauSai: CauEmSai[] = []
  let soThu = 0
  for (const [qid, chiSo] of theoCau) {
    const ds = chiSo.map((i) => lan[i]!)
    const soSai = ds.filter((l) => l.dung === false).length
    if (!soSai) continue
    soThu++
    cauSai.push({
      qid: laThay ? qid : `c${chiSo[0]! + 1}`,
      ...(cheDo === 'hoc-sinh' ? { moChua: `g${soThu}` } : {}),
      tieuDe: ds[0]!.tieuDe,
      mucDo: ds[0]!.mucDo,
      soLan: ds.length,
      soSai,
      soDung: ds.filter((l) => l.dung === true).length,
      lanCuoiDung: ds[0]!.dung === true,
      lanCuoi: ds[0]!.luc,
      giaySai: ds.filter((l) => l.dung === false).map((l) => l.giay).reverse(),
    })
  }
  cauSai.sort((a, b) => Number(a.lanCuoiDung) - Number(b.lanCuoiDung) || b.soSai - a.soSai)
  const coGiay = lan.filter((l) => l.giay !== null)
  const tongGiay = coGiay.reduce((t, l) => t + (l.giay ?? 0), 0)
  return {
    ok: true,
    em: { sbd: laThay ? sbd : '', hoTen, lop: '12A1' },
    tong: {
      soLuot: lan.length,
      soDung: lan.filter((l) => l.dung === true).length,
      soSai: lan.filter((l) => l.dung === false).length,
      soBoTrong: lan.filter((l) => l.dung === null).length,
      soCau: theoCau.size,
      soCauSai: cauSai.length,
      giayTb: coGiay.length ? Math.round(tongGiay / coGiay.length) : null,
      tongGiay,
    },
    lan,
    mucLam: tongMucLam(thay),
    mucLam6: bo,
    cauSai,
    conNua: false,
    catBot: false,
  }
}
