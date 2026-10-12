// LÀN PHỤ HUYNH 12/10 — TỔNG QUAN VỀ CON GIẢ cho ảnh chụp app phụ huynh (`/ph/con-tong-quan`). Hình dạng đúng hợp đồng
// `server/src/ph-con-tong-quan-kieu.ts`; dữ liệu CỐ ĐỊNH (không ngẫu nhiên, mốc giờ cố định 20:30 Thứ Sáu 16/10/2026) để hai lần chụp ra cùng ảnh.
// Số đối chiếu được với nhau: ba ô tỉ lệ = cộng các ngày; gợi ý nhắc khớp luật `sinhGoiYNhac` với chính các số này. Tên câu là tên dạng thật của chương trình.
import type { CauSaiCon, DemCau, KetQuaConTongQuan, LuotGanDay, NgayHoc } from '../../../server/src/ph-con-tong-quan-kieu'

const SERVER_NOW = Date.parse('2026-10-16T13:30:00Z') // 20:30 Thứ Sáu 16/10 giờ VN
/** [ngày, đúng, sai, câu khác nhau, mức, mức ước tính?, đã làm (tính vào mức)] */
const NGAY: [string, number, number, number, number, boolean, number][] = [
  ['2026-10-03', 18, 6, 22, 24, true, 22], ['2026-10-04', 0, 0, 0, 24, true, 0], ['2026-10-05', 22, 8, 28, 24, true, 28],
  ['2026-10-06', 15, 5, 19, 24, true, 19], ['2026-10-07', 0, 0, 0, 24, true, 0], ['2026-10-08', 20, 4, 23, 24, true, 23],
  ['2026-10-09', 25, 7, 30, 30, false, 30], ['2026-10-10', 12, 3, 15, 30, false, 15], ['2026-10-11', 0, 0, 0, 30, false, 0],
  ['2026-10-12', 21, 9, 30, 30, false, 30], ['2026-10-13', 14, 6, 20, 30, false, 20], ['2026-10-14', 0, 0, 0, 30, true, 0],
  ['2026-10-15', 26, 10, 33, 30, false, 31], ['2026-10-16', 9, 3, 12, 30, false, 12],
]
const ngay: NgayHoc[] = NGAY.map(([n, dung, sai, soCau, muc, uoc, daLam]) => ({
  ngay: n, dung, sai, boTrong: 0, soCau, muc, mucUocTinh: uoc, daXep: uoc ? null : muc, canLam: muc, daLam,
  trangThai: soCau === 0 ? 'khong' : daLam >= muc ? 'du' : 'thieu', homNay: n === '2026-10-16',
}))
const dem = (tu: string, giayTb: number): DemCau => {
  const ds = ngay.filter((n) => n.ngay >= tu)
  const dung = ds.reduce((t, n) => t + n.dung, 0), sai = ds.reduce((t, n) => t + n.sai, 0)
  return { soLuot: dung + sai, dung, sai, boTrong: 0, soCau: ds.reduce((t, n) => t + n.soCau, 0), giayTb }
}

const TEN = [
  'Câu 17 · Thuỷ phân ester đơn chức', 'Câu 23 · Chỉ số xà phòng hoá chất béo', 'Câu 5 · Gọi tên ester theo danh pháp', 'Câu 31 · Bảo toàn khối lượng khi xà phòng hoá',
  'Câu 8 · Glucose và fructose', 'Câu 40 · Hiệu suất phản ứng ester hoá', 'Câu 12 · Saccharose và tinh bột', 'Câu 26 · Đốt cháy hỗn hợp ester',
]
const NOI = ['Bài luyện trên app', 'Bài luyện trên app', 'Ôn lại', 'Tự chữa lỗi', 'Ca kiểm tra', 'Bài luyện trên app']
/** 30 lượt mới trước: có lượt đo thật, lượt ước tính (≈), lượt chưa đo giờ, lượt nhanh mà sai, lượt dùng gợi ý. */
const ganDay: LuotGanDay[] = Array.from({ length: 30 }, (_, i) => {
  const giayGoc = [42, 6, 75, 4, 38, 120, 18, 5, 64, 33, 210, 27][i % 12]!
  const chuaDo = i % 11 === 7
  const uoc = !chuaDo && i % 7 === 3
  return {
    luc: new Date(SERVER_NOW - (i * 9 + 25) * 60_000 - (i > 11 ? 24 * 3_600_000 : 0)).toISOString(),
    tieuDe: TEN[i % TEN.length]!,
    noi: NOI[i % NOI.length]!,
    dung: giayGoc < 8 ? i % 3 === 0 : i % 4 !== 1,
    giay: chuaDo ? null : giayGoc,
    nguonGiay: chuaDo ? null : uoc ? 'uoc' : 'do',
    coGoiY: i % 5 === 2,
  }
})
const cauSai: CauSaiCon[] = [
  { tieuDe: 'Câu 31 · Bảo toàn khối lượng khi xà phòng hoá', soSai: 3, lanCuoi: '2026-10-16T12:10:00Z', daSua: false },
  { tieuDe: 'Câu 40 · Hiệu suất phản ứng ester hoá', soSai: 2, lanCuoi: '2026-10-15T14:20:00Z', daSua: false },
  { tieuDe: 'Câu 23 · Chỉ số xà phòng hoá chất béo', soSai: 2, lanCuoi: '2026-10-15T13:05:00Z', daSua: false },
  { tieuDe: 'Câu 26 · Đốt cháy hỗn hợp ester', soSai: 1, lanCuoi: '2026-10-13T12:40:00Z', daSua: false },
  { tieuDe: 'Câu 12 · Saccharose và tinh bột', soSai: 1, lanCuoi: '2026-10-12T13:00:00Z', daSua: false },
  { tieuDe: 'Câu 17 · Thuỷ phân ester đơn chức', soSai: 2, lanCuoi: '2026-10-16T11:30:00Z', daSua: true },
  { tieuDe: 'Câu 8 · Glucose và fructose', soSai: 1, lanCuoi: '2026-10-15T12:00:00Z', daSua: true },
  { tieuDe: 'Câu 5 · Gọi tên ester theo danh pháp', soSai: 1, lanCuoi: '2026-10-12T12:30:00Z', daSua: true },
  { tieuDe: 'Câu 14 · Tính chất hoá học của chất béo', soSai: 1, lanCuoi: '2026-10-10T12:00:00Z', daSua: true },
]

export function conTongQuanGia(): KetQuaConTongQuan {
  return {
    ok: true,
    serverNow: SERVER_NOW,
    homNay: '2026-10-16',
    moc: '2026-10-12',
    tuNgay: '2026-10-03',
    dem: { homNay: dem('2026-10-16', 41), bayNgay: dem('2026-10-10', 47), tuMoc: dem('2026-10-12', 45) },
    ngay,
    thoiGian: {
      giayTb: 47, giayGiua: 38, soDo: 96, soUoc: 14, soChuaDo: 3,
      phanBo: [{ tu: 0, den: 8, so: 14, sai: 9 }, { tu: 8, den: 30, so: 32, sai: 6 }, { tu: 30, den: 60, so: 38, sai: 8 }, { tu: 60, den: 120, so: 19, sai: 5 }, { tu: 120, den: 300, so: 6, sai: 3 }, { tu: 300, den: null, so: 1, sai: 0 }],
      nhanh: { so: 14, sai: 9 },
    },
    ganDay,
    cauSai: { tong: cauSai.length, daSua: 4, chuaSua: 5, ds: cauSai },
    khuya: { soNgay: 3, soLuot: 17 },
    goiYDaDung: { so: 22, tong: 113 },
    goiY: [
      { ma: 'con-cau-hom-nay', chu: 'Hôm nay con còn 18 câu chưa làm (đã làm 12/30 câu).' },
      { ma: 'sai-chua-sua', chu: 'Có 5 câu con làm sai chưa sửa được. Nhắc con vào mục Tự chữa lỗi để làm lại.' },
      { ma: 'nhanh-sai', chu: '7 ngày qua có 14 câu con làm dưới 8 giây và sai 9 câu. Nhắc con đọc kỹ đề trước khi chọn.' },
      { ma: 'thieu-ngay', chu: 'Từ 12/10 con có 1 ngày không làm bài và 1 ngày làm chưa đủ mức. Hỏi con lý do và chốt một giờ học cố định mỗi ngày.' },
      { ma: 'lam-khuya', chu: 'Con hay làm bài sau 23 giờ (3 trong 7 ngày qua). Nhắc con học sớm hơn để đủ giấc.' },
    ],
    catBot: false,
  }
}
