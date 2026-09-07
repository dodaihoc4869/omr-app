// SOI TÌNH TRẠNG MÃ DẠNG CỦA KHO — đặc tả v3 mục 4.3.
//
// Thuần tính toán, không đụng IndexedDB, không đụng React. Màn Ngân hàng chỉ
// hiển thị cái này ra.
//
// Con số quan trọng nhất KHÔNG phải "đã gán bao nhiêu" mà là **bao nhiêu câu
// thật sự chữa được**: câu có mã nhưng có hình thì cổng loại khỏi phiếu in, nên
// nó không phải nguồn hàng. Vì vậy phần đếm nguồn hàng gọi thẳng `ungVienChua`
// của cổng, không tự đếm lại theo luật riêng — đếm riêng là báo số dối.
import type { TeacherExamSource } from '../data/examContent'
import { nhanhCoChe } from './cau-hinh-chua'
import { ungVienChua } from './rut-de-chua'
import { maTrongTuVung } from './tu-vung-dang'

/** Lý do `dang = null` mà pipeline ghi khi chương chưa có bảng cơ chế. Những
 * câu này KHÔNG phải việc của thầy — đúng thiết kế, chờ bổ sung bảng. */
export const LY_DO_CHUONG_PHU = 'chương chưa có bảng cơ chế'

export interface CauChuaGan {
  maDe: string
  qid: string
  phan: 'I' | 'II' | 'III'
  so: number
  viSaoNull: string
  de: string
}

export interface CauCoMa {
  maDe: string
  qid: string
  phan: 'I' | 'II' | 'III'
  so: number
  ma: string
  de: string
  dungDuoc: boolean
}

export interface ThongKeDang {
  tongCau: number
  daGan: number
  chuaGan: number
  /** Chưa gán vì chương chưa có bảng cơ chế — không phải việc của thầy. */
  chuaGanDoChuongPhu: number
  /** THIẾU HẲN trường `dang`: bản đề trên máy này cũ hơn kho, chưa tải lại.
   * KHÔNG phải việc của thầy — bấm Đồng bộ là xong. */
  chuaTaiLai: number
  /** Mã đề còn giữ bản cũ, để nói thẳng tên cho thầy. */
  deChuaTaiLai: string[]
  /** Chưa gán và CẦN THẦY CHỐT. */
  canThayChot: CauChuaGan[]
  /** Mã không nằm trong từ vựng đóng — phải bằng 0. */
  maLa: CauCoMa[]
  soMa: number
  soNhanh: number
  /** Câu có mã và không có hình — nguồn hàng thật để chữa. */
  dungLamCauChua: number
  /** Có mã nhưng bị loại vì có hình. */
  loaiViCoHinh: number
  /** % câu có mã sẽ tìm được đủ câu chữa BẬC 1 (đúng mã). */
  phuBac1: number
  /** % câu có mã sẽ tìm được đủ câu chữa BẬC 2 (cùng nhánh cơ chế). */
  phuBac2: number
  /** Nhánh cơ chế không đủ hàng, xếp mỏng trước. */
  nhanhMong: { nhanh: string; soCau: number }[]
}

type CoDangCau = { id?: string; dang?: { ma?: string } | null; viSaoNull?: string; text?: string }

/** Câu chưa từng được pipeline đụng tới: KHÔNG có trường `dang`. Khác hẳn
 * `dang === null` (cố ý để trống, có lý do). Gộp hai thứ này là đẩy thầy đi gán
 * tay hàng nghìn câu mà kho đã gán xong. */
function chuaCoTruong(q: CoDangCau): boolean {
  return q.dang === undefined
}

function duyetCau(khoDe: TeacherExamSource[]): { s: TeacherExamSource; phan: 'I' | 'II' | 'III'; so: number; q: CoDangCau }[] {
  const ra: { s: TeacherExamSource; phan: 'I' | 'II' | 'III'; so: number; q: CoDangCau }[] = []
  for (const s of khoDe) {
    s.phanI.forEach((q, i) => ra.push({ s, phan: 'I', so: i + 1, q: q as CoDangCau }))
    s.phanII.forEach((q, i) => ra.push({ s, phan: 'II', so: i + 1, q: q as CoDangCau }))
    s.phanIII.forEach((q, i) => ra.push({ s, phan: 'III', so: i + 1, q: q as CoDangCau }))
  }
  return ra
}

function gonDe(t: string | undefined): string {
  return String(t ?? '').replace(/\s+/g, ' ').trim()
}

export function thongKeDang(khoDe: TeacherExamSource[]): ThongKeDang {
  const cau = duyetCau(khoDe)
  const canThayChot: CauChuaGan[] = []
  const maLa: CauCoMa[] = []
  const dem = new Map<string, number>()
  let daGan = 0
  let chuaGanDoChuongPhu = 0

  const deCu = new Set<string>()
  let chuaTaiLai = 0
  for (const { s, phan, so, q } of cau) {
    if (chuaCoTruong(q)) {
      chuaTaiLai += 1
      deCu.add(s.maDe)
      continue
    }
    const ma = String(q.dang?.ma ?? '').trim()
    if (!ma) {
      const ly = String(q.viSaoNull ?? '').trim() || 'chưa ghi lý do'
      if (ly === LY_DO_CHUONG_PHU) chuaGanDoChuongPhu += 1
      else canThayChot.push({ maDe: s.maDe, qid: String(q.id ?? ''), phan, so, viSaoNull: ly, de: gonDe(q.text) })
      continue
    }
    daGan += 1
    dem.set(ma, (dem.get(ma) ?? 0) + 1)
    if (!maTrongTuVung(ma)) maLa.push({ maDe: s.maDe, qid: String(q.id ?? ''), phan, so, ma, de: gonDe(q.text), dungDuoc: false })
  }

  // Nguồn hàng thật: đi qua đúng cổng, không đếm lại theo luật riêng.
  const ungVien = ungVienChua(khoDe)
  const dungTheoMa = new Map<string, number>()
  const dungTheoNhanh = new Map<string, number>()
  for (const { ma } of ungVien) {
    dungTheoMa.set(ma, (dungTheoMa.get(ma) ?? 0) + 1)
    const n = nhanhCoChe(ma)
    if (n) dungTheoNhanh.set(n, (dungTheoNhanh.get(n) ?? 0) + 1)
  }

  // Một câu sai cần ít nhất HAI câu khác cùng mã thì phiếu chữa mới ra hồn.
  // Chính nó cũng nằm trong kho nên phải có từ BA câu.
  //
  // v4 bỏ `SO_CAU_MOI_CAU_SAI` (trần cứng mỗi câu sai) — số câu giờ do thầy kéo.
  // Nhưng thống kê vẫn cần MỘT ngưỡng để nói "mã này đủ hàng hay không", và ba
  // là ngưỡng thấp nhất còn có nghĩa.
  const NGUONG_DU_HANG = 3
  const can = NGUONG_DU_HANG
  let duBac1 = 0
  let duBac2 = 0
  for (const [ma, n] of dem) {
    if ((dungTheoMa.get(ma) ?? 0) >= can) duBac1 += n
    if ((dungTheoNhanh.get(nhanhCoChe(ma)) ?? 0) >= can) duBac2 += n
  }

  const nhanhMong = [...dungTheoNhanh.entries()]
    .filter(([, n]) => n < can)
    .map(([nhanh, soCau]) => ({ nhanh, soCau }))
    .sort((a, b) => a.soCau - b.soCau)

  const phanTram = (x: number) => (daGan === 0 ? 0 : Math.round((1000 * x) / daGan) / 10)

  return {
    tongCau: cau.length,
    daGan,
    chuaGan: cau.length - daGan,
    chuaGanDoChuongPhu,
    chuaTaiLai,
    deChuaTaiLai: [...deCu].sort(),
    canThayChot,
    maLa,
    soMa: dem.size,
    soNhanh: dungTheoNhanh.size,
    dungLamCauChua: ungVien.length,
    loaiViCoHinh: daGan - ungVien.length,
    phuBac1: phanTram(duBac1),
    phuBac2: phanTram(duBac2),
    nhanhMong,
  }
}

/** Mọi câu ĐÃ CÓ MÃ, để thầy lọc và soi mã gán sai. */
export function dsCauCoMa(khoDe: TeacherExamSource[]): CauCoMa[] {
  const dungDuoc = new Set(ungVienChua(khoDe).map((x) => x.cau.id))
  const ra: CauCoMa[] = []
  for (const { s, phan, so, q } of duyetCau(khoDe)) {
    const ma = String(q.dang?.ma ?? '').trim()
    if (!ma) continue
    const qid = String(q.id ?? '')
    ra.push({ maDe: s.maDe, qid, phan, so, ma, de: gonDe(q.text), dungDuoc: dungDuoc.has(qid) })
  }
  return ra
}
