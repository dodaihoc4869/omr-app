// LỊCH SỬ LÀM CÂU GIẢ CÓ MỨC LÀM 1–4 (thầy 21/10) cho ảnh chụp THẬT của tấm Hồ sơ làm bài ở ba chế độ (thầy · học sinh · phụ huynh) và cho test giao diện.
// Số giả, tên giả; hình dạng đúng hợp đồng `server/src/lich-su-lam-cau-kieu.ts`. Mức của từng lượt do CHÍNH hàm máy chủ `mucLamCuaLuot` tính (không gõ tay),
// tổng do `tongMucLam`. Bản học sinh / phụ huynh phản chiếu luật lọc của `lichSuLamCauCuaEm(..., 'hoc-sinh')`: lượt ĐÚNG ở Mức làm 1–2 không mang mức, tổng chỉ tính phần em thấy,
// không ghi chú riêng của thầy (luật thật được test ở tests/lich-su-muc-lam-2110.test.ts).
import { mucLamCuaLuot, tongMucLam, type MucLamLuot } from '../../../server/src/muc-lam'
import type { CauEmSai, KetQuaLichSuLamCau, LanLamCau, NguonGiay } from '../../../server/src/lich-su-lam-cau-kieu'

interface DongGia {
  qid: string
  tieuDe: string
  mucDo: string
  noi: string
  luc: string
  dung: boolean | null
  chon: string | null
  /** Giây. */
  giay: number | null
  /** Có kích thước đề + đồng hồ mới ⇒ máy chủ xếp được mức. */
  doDuoc: boolean
  soTu: number
  coHinh?: boolean
  phan: 'I' | 'II' | 'III'
  /** Thời gian thường của lớp (giây) — chỉ khi có β thật. */
  thuong?: number
  nguonGiay: NguonGiay
}

const D = (luc: string, o: Omit<DongGia, 'luc'>): DongGia => ({ luc, ...o })

const DONG: DongGia[] = [
  D('2026-10-26T11:48:00Z', { qid: 'DH-12-C4-B1-12', tieuDe: 'Câu 12 · Pin điện hóa', mucDo: 'hieu', noi: 'BTVN tuần 43', dung: false, chon: 'C', giay: 14, doDuoc: true, soTu: 46, phan: 'I', thuong: 75, nguonGiay: 'do' }),
  D('2026-10-26T11:30:00Z', { qid: 'DH-12-C4-B2-7', tieuDe: 'Câu 7 · Điện phân', mucDo: 'VD', noi: 'BTVN tuần 43', dung: false, chon: 'B', giay: 47, doDuoc: true, soTu: 94, phan: 'II', thuong: 140, nguonGiay: 'do' }),
  D('2026-10-26T11:10:00Z', { qid: 'DH-12-C4-B1-9', tieuDe: 'Câu 9 · Pin điện hóa', mucDo: 'biet', noi: 'BTVN tuần 43', dung: true, chon: 'A', giay: 8, doDuoc: true, soTu: 48, phan: 'I', thuong: 70, nguonGiay: 'do' }),
  D('2026-10-25T13:44:00Z', { qid: 'DH-12-C4-B3-15', tieuDe: 'Câu 15 · Ăn mòn điện hóa', mucDo: 'VD', noi: 'Luyện theo dạng', dung: true, chon: 'D', giay: 96, doDuoc: true, soTu: 80, phan: 'I', thuong: 120, nguonGiay: 'do' }),
  D('2026-10-25T12:20:00Z', { qid: 'DH-12-C4-B1-30', tieuDe: 'Câu 30 · Sơ đồ pin Zn–Cu', mucDo: 'hieu', noi: 'BTVN tuần 43', dung: false, chon: 'A', giay: 12, doDuoc: true, soTu: 40, coHinh: true, phan: 'I', nguonGiay: 'do' }),
  D('2026-10-24T13:05:00Z', { qid: 'DH-12-C4-B2-21', tieuDe: 'Câu 21 · Điện phân', mucDo: 'VD', noi: 'Tự sửa lỗi', dung: false, chon: 'B', giay: 41, doDuoc: true, soTu: 57, phan: 'II', thuong: 130, nguonGiay: 'do' }),
  D('2026-10-24T12:15:00Z', { qid: 'DH-12-C4-B1-12', tieuDe: 'Câu 12 · Pin điện hóa', mucDo: 'hieu', noi: 'Luyện theo dạng', dung: false, chon: 'B', giay: 20, doDuoc: true, soTu: 46, phan: 'I', thuong: 75, nguonGiay: 'do' }),
  D('2026-10-22T13:00:00Z', { qid: 'DH-12-C4-B4-3', tieuDe: 'Câu 3 · Đại cương kim loại', mucDo: 'biet', noi: 'BTVN tuần 42', dung: false, chon: 'D', giay: 33, doDuoc: false, soTu: 0, phan: 'I', nguonGiay: 'do' }),
  D('2026-10-21T14:30:00Z', { qid: 'DH-12-C4-B4-18', tieuDe: 'Câu 18 · Ăn mòn kim loại', mucDo: 'hieu', noi: 'Đảo', dung: true, chon: 'C', giay: 25, doDuoc: false, soTu: 0, phan: 'I', nguonGiay: 'uoc' }),
  D('2026-10-20T13:10:00Z', { qid: 'DH-12-C4-B4-3', tieuDe: 'Câu 3 · Đại cương kim loại', mucDo: 'biet', noi: 'BTVN tuần 42', dung: false, chon: 'A', giay: null, doDuoc: false, soTu: 0, phan: 'I', nguonGiay: null }),
  D('2026-10-19T13:00:00Z', { qid: 'DH-12-C4-B5-26', tieuDe: 'Câu 26 · Điều chế kim loại', mucDo: 'VD', noi: 'Ca Kiểm tra 15 phút', dung: null, chon: null, giay: 64, doDuoc: false, soTu: 0, phan: 'II', nguonGiay: 'do' }),
]

export interface TuyChonGia {
  /** 'thay' = đủ (kể cả ghi chú đúng-trước-khi-đọc); 'em' = bản học sinh / phụ huynh. */
  cheDo: 'thay' | 'em'
  /** Mọi lượt chưa có số đo (những ngày đầu). */
  chuaDo?: boolean
  /** Lớp chưa đủ mẫu: không câu nào có β thật ⇒ không có Mức làm 4. */
  khongBeta?: boolean
}

export function lichSuMucGia(sbd: string, hoTen: string, tuy: TuyChonGia): KetQuaLichSuLamCau {
  const tho = DONG.map((d) => {
    const muc: MucLamLuot | null =
      tuy.chuaDo || !d.doDuoc || d.giay === null
        ? null
        : mucLamCuaLuot({ giay: d.giay, soTu: d.soTu, coHinh: !!d.coHinh, phan: d.phan, dung: d.dung, thuongGiay: tuy.khongBeta ? null : (d.thuong ?? null) })
    return { d, muc }
  })
  // Bản học sinh / phụ huynh: lượt ĐÚNG ở Mức làm 1–2 không mang mức (chỉ còn số giây); tổng chỉ tính phần em thấy.
  const hien = tho.map(({ d, muc }) => (muc && tuy.cheDo === 'em' && d.dung === true && muc.ma <= 2 ? { d, muc: null, an: true } : { d, muc, an: false }))
  const lan: LanLamCau[] = hien.map(({ d, muc }) => ({
    luc: d.luc,
    ngay: new Date(Date.parse(d.luc) + 7 * 3_600_000).toISOString().slice(0, 10),
    qid: d.qid,
    tieuDe: d.tieuDe,
    mucDo: d.mucDo,
    noi: d.noi,
    dung: d.dung,
    chon: d.chon,
    giay: d.giay,
    nguonGiay: d.giay === null ? null : d.nguonGiay,
    coGoiY: false,
    ...(muc ? { mucLam: muc } : {}), // ghi chú đúng-trước-khi-đọc chỉ nằm ở lượt ĐÚNG Mức làm 1 — bản em đã ẩn hẳn lượt ấy ở trên
  }))
  const tongTho = tongMucLam(hien.filter((h) => !h.an).map((h) => ({ mucLam: h.muc, dung: h.d.dung })))
  const tong = tuy.cheDo === 'em' ? { ...tongTho, dungTruocDoc: 0 } : tongTho
  const theoCau = new Map<string, DongGia[]>()
  for (const d of [...DONG].reverse()) theoCau.set(d.qid, [...(theoCau.get(d.qid) ?? []), d])
  const cauSai: CauEmSai[] = [...theoCau.values()]
    .filter((ds) => ds.some((l) => l.dung === false))
    .map((ds) => {
      const cuoi = ds[ds.length - 1]!
      return {
        qid: cuoi.qid,
        tieuDe: cuoi.tieuDe,
        mucDo: cuoi.mucDo,
        soLan: ds.length,
        soSai: ds.filter((l) => l.dung === false).length,
        soDung: ds.filter((l) => l.dung === true).length,
        lanCuoiDung: cuoi.dung === true,
        lanCuoi: cuoi.luc,
        giaySai: ds.filter((l) => l.dung === false).map((l) => l.giay),
      }
    })
  const dung = DONG.filter((d) => d.dung === true).length
  const sai = DONG.filter((d) => d.dung === false).length
  const co = DONG.filter((d) => d.giay !== null)
  return {
    ok: true,
    em: { sbd, hoTen, lop: '12A1' },
    tong: {
      soLuot: DONG.length,
      soDung: dung,
      soSai: sai,
      soBoTrong: DONG.length - dung - sai,
      soCau: new Set(DONG.map((d) => d.qid)).size,
      soCauSai: cauSai.length,
      giayTb: co.length ? Math.round(co.reduce((a, d) => a + d.giay!, 0) / co.length) : null,
      tongGiay: co.reduce((a, d) => a + d.giay!, 0),
    },
    lan,
    cauSai,
    mucLam: tong,
    conNua: false,
    catBot: false,
  }
}
