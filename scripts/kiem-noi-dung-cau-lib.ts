// TỔNG HỢP SỐ ĐẾM cho rà soát CHỈ ĐỌC "tờ chữa của chiến dịch" (thầy 06/10: tờ chữa lớp 11 lẫn câu lớp 10). THUẦN — không IO; `kiem-noi-dung-cau-0610.mjs` đọc D1 rồi gọi hàm này.
// Chỉ ra SỐ ĐẾM: không mã chiến dịch, không mã câu, không đề / đáp án / tên em. (Repo công khai — nhật ký chạy ai cũng đọc được.)
//   (1) quy mô câu KHÁC KHỐI nằm trong danh sách câu của các chiến dịch (đọc từ MÃ CÂU — cùng luật B của cổng máy chủ: khác khối hoặc mã tự mâu thuẫn khối ⇒ khác; không đọc ra khối ⇒ giữ);
//   (2) tỉ lệ câu thật đổi được sang khuôn Ngân hàng đề của thầy bằng ĐÚNG hàm `cauChoThay` của lệnh `noi-dung-cau` (kèm có chuyên đề ⇒ tờ có nút Đạt / Chưa đạt).
import { khoiCuaLop, phanTichKhoiCau } from '../src/lib/khoi-cau'
import { cauChoThay } from '../server/src/noi-dung-cau-chien-dich'
import { docCauTuJson, laCauTuLuan } from '../server/src/cam-tu-luan'

export interface DongChienDich { lop?: unknown; trang_thai?: unknown; qid_json?: unknown }
export interface DongCau { qid: string; json?: unknown; chuyen_de?: unknown }

/** `dung`: mã đọc ra đúng khối lớp · `khac`: khác khối hoặc mã mâu thuẫn khối · `khong_ro`: mã không đọc ra khối (luật B: giữ). */
export function xepKhoiTheoMa(qid: string, khoiLop: number): 'dung' | 'khac' | 'khong_ro' {
  const p = phanTichKhoiCau(qid)
  if (p.tinhTrang === 'khong_ro') return 'khong_ro'
  if (p.tinhTrang === 'mau_thuan') return 'khac'
  return p.khoi === khoiLop ? 'dung' : 'khac'
}

const mangQid = (v: unknown): string[] => {
  try {
    const j = JSON.parse(typeof v === 'string' ? v : '[]') as unknown
    return Array.isArray(j) ? j.filter((x): x is string => typeof x === 'string' && x !== '') : []
  } catch {
    return []
  }
}

export interface NhomKhoi { chienDich: number; tongQid: number; khacKhoiTheoMa: number; khongRoKhoiTheoMa: number; chienDichCoCauKhacKhoi: number }
export interface TongHopNoiDungCau {
  soChienDich: number
  theoTrangThai: Record<string, number>
  theoKhoi: Record<'10' | '11' | '12' | 'khong_ro', NhomKhoi>
  noiDung: { qidKhacNhau: number; coHang: number; khongCoHang: number; tuLuan: number; hong: number; chuyenDuoc: number; chuyenDuocCoChuyenDe: number }
}

/** Mã câu xuất hiện trong MỌI danh sách (để nơi đọc D1 biết cần lấy hàng câu nào). */
export const moiQid = (chienDich: readonly DongChienDich[]): string[] => [...new Set(chienDich.flatMap((c) => mangQid(c.qid_json)))]

export function tongHop(chienDich: readonly DongChienDich[], hang: ReadonlyMap<string, DongCau>): TongHopNoiDungCau {
  const nhom = (): NhomKhoi => ({ chienDich: 0, tongQid: 0, khacKhoiTheoMa: 0, khongRoKhoiTheoMa: 0, chienDichCoCauKhacKhoi: 0 })
  const ra: TongHopNoiDungCau = {
    soChienDich: chienDich.length,
    theoTrangThai: {},
    theoKhoi: { '10': nhom(), '11': nhom(), '12': nhom(), khong_ro: nhom() },
    noiDung: { qidKhacNhau: 0, coHang: 0, khongCoHang: 0, tuLuan: 0, hong: 0, chuyenDuoc: 0, chuyenDuocCoChuyenDe: 0 },
  }
  for (const c of chienDich) {
    const tt = String(c.trang_thai ?? '')
    ra.theoTrangThai[tt] = (ra.theoTrangThai[tt] ?? 0) + 1
    const k = khoiCuaLop(c.lop)
    const g = ra.theoKhoi[k === null ? 'khong_ro' : (String(k) as '10' | '11' | '12')]
    const qids = mangQid(c.qid_json)
    g.chienDich++
    g.tongQid += qids.length
    if (k === null) continue
    let khac = 0
    for (const q of qids) {
      const x = xepKhoiTheoMa(q, k)
      if (x === 'khac') khac++
      else if (x === 'khong_ro') g.khongRoKhoiTheoMa++
    }
    g.khacKhoiTheoMa += khac
    if (khac > 0) g.chienDichCoCauKhacKhoi++
  }
  const dsQid = moiQid(chienDich)
  ra.noiDung.qidKhacNhau = dsQid.length
  for (const q of dsQid) {
    const h = hang.get(q)
    if (!h) { ra.noiDung.khongCoHang++; continue }
    ra.noiDung.coHang++
    const j = docCauTuJson(h.json)
    if (j === null) { ra.noiDung.hong++; continue }
    if (laCauTuLuan(j)) { ra.noiDung.tuLuan++; continue }
    const c = cauChoThay(j, String(h.chuyen_de ?? ''))
    if (!c) { ra.noiDung.hong++; continue }
    ra.noiDung.chuyenDuoc++
    if (typeof c.chuyenDe === 'string' && c.chuyenDe !== '') ra.noiDung.chuyenDuocCoChuyenDe++
  }
  return ra
}
