// DỮ LIỆU GIẢ đúng hợp đồng `/gv/bang-tin` (docs/hop-dong-bang-tin-v3-2109.md) — dùng cho BẢN MẪU + test. KHÔNG phải số thật.
// Ba bản: `MAU_DAY` (đủ mọi khối, có `homQua` để thấy mũi tên so hôm qua), `MAU_THAT_SANG_21` (đúng trạng thái sáng 21/09: chưa có homQua, tiến bộ trống,
// thiếu Bộ não) và `MAU_RONG` (mốc mới, chưa em nào làm bài).

const T = (iso: string) => iso

const BAI_TAP = [
  {
    maBtvn: 'BT-E4', ten: 'Bài tập về nhà tuần 4 · Este – lipid', tenLop: '12 - Lớp Thường', nhieuLop: false, giaoLuc: T('2026-09-21T05:20:00.000Z'), hanNop: T('2026-09-24T05:00:00.000Z'), quaHan: false,
    tong: 67, chuaMo: 41, dangLam: 19, daNop: 7,
    chang: { tbDaXong: 1.4, tong: 5, soEm: 65 },
    nhac: { soEm: 12, soPhuHuynh: 9, luotKe: T('2026-09-21T11:00:00.000Z') },
  },
  {
    maBtvn: 'BT-C4', ten: 'Bài tập về nhà · Carbohydrate', tenLop: '12 - Tinh Hoa', nhieuLop: false, giaoLuc: T('2026-09-21T05:30:00.000Z'), hanNop: T('2026-09-22T05:00:00.000Z'), quaHan: false,
    tong: 42, chuaMo: 3, dangLam: 11, daNop: 28,
    chang: { tbDaXong: 3.8, tong: 4, soEm: 42 },
    nhac: { soEm: 3, soPhuHuynh: 2, luotKe: T('2026-09-22T00:30:00.000Z') },
  },
  {
    maBtvn: 'BT-A4', ten: 'Bài tập về nhà · Amin – Aminoaxit', tenLop: '12 - Nhóm 10 điểm', nhieuLop: false, giaoLuc: T('2026-09-21T05:40:00.000Z'), hanNop: T('2026-09-23T05:00:00.000Z'), quaHan: false,
    tong: 15, chuaMo: 0, dangLam: 2, daNop: 13,
    chang: { tbDaXong: 4.6, tong: 5, soEm: 15 },
  },
  {
    maBtvn: 'BT-P4', ten: 'Ôn tập giữa kì · Polime và vật liệu', tenLop: '11', nhieuLop: false, giaoLuc: T('2026-09-21T06:00:00.000Z'), hanNop: T('2026-09-26T05:00:00.000Z'), quaHan: false,
    tong: 91, chuaMo: 60, dangLam: 20, daNop: 11,
  },
]

const CAN_DE_Y = {
  ds: [
    { sbd: '12007', hoTen: 'Nguyễn Hoàng Long', tenLop: '12 - Lớp Thường', lyDo: [{ loai: 'sai_nhieu', chu: 'Sai 6/8 câu dạng Este hôm nay', so: 6, tong: 8 }, { loai: 'chua_mo_bai', chu: 'Chưa mở bài «Bài tập về nhà tuần 4», hạn 12:00 trưa mai (Thứ Tư 23/09)' }] },
    { sbd: '12031', hoTen: 'Trần Thị Ngọc Diệp', tenLop: '12 - Lớp Thường', lyDo: [{ loai: 'qua_han', chu: 'Chưa nộp bài «Bài tập về nhà · Carbohydrate», đã quá hạn 1 ngày' }] },
    { sbd: '12044', hoTen: 'Lê Quang Huy', tenLop: '12 - Tinh Hoa', lyDo: [{ loai: 'sai_nhieu', chu: 'Sai 5/7 câu dạng Phản ứng xà phòng hoá hôm nay', so: 5, tong: 7 }] },
    { sbd: '12058', hoTen: 'Phạm Bảo Châu', tenLop: '12 - Nhóm 10 điểm', lyDo: [{ loai: 'chua_mo_bai', chu: 'Chưa mở bài «Amin – Aminoaxit», hạn 12:00 trưa mốt (Thứ Tư 23/09)' }] },
    { sbd: '12063', hoTen: 'Vũ Đức Anh', tenLop: '11', lyDo: [{ loai: 'sai_nhieu', chu: 'Sai 4/5 câu dạng Polime hôm nay', so: 4, tong: 5 }] },
  ],
  conLai: 7,
}

const DANG_VAP = [
  { ma: 'ESTE.THUY_PHAN', ten: 'Thuỷ phân ester', soEmVap: 9, soEmGap: 24 },
  { ma: 'ESTE.XA_PHONG', ten: 'Phản ứng xà phòng hoá', soEmVap: 8, soEmGap: 22 },
  { ma: 'ESTE.TINH_KHOI_LUONG', ten: 'Tính khối lượng muối, ancol', soEmVap: 7, soEmGap: 30 },
  { ma: 'ESTE.DANH_PHAP', ten: 'Danh pháp ester', soEmVap: 6, soEmGap: 19 },
  { ma: 'AMINO.LUONG_TINH', ten: 'Tính lưỡng tính của amino axit', soEmVap: 5, soEmGap: 12 },
]

const MAY_DA_LAM = [
  { loai: 'nhac_nop_bai', so: 12, soPhuHuynh: 9, chu: 'Nhắc nộp bài cho 12 em, báo 9 phụ huynh' },
  { loai: 'khac_phuc_luon', so: 5, chu: 'Cho 5 em khắc phục luôn các câu vừa sai' },
  { loai: 'on_lai', so: 38, chu: 'Đưa 38 câu sai về lịch ôn lại 1·3·7' },
  { loai: 'bo_cau_rieng', so: 40, chu: 'Rút bộ câu riêng cho 40 em' },
  { loai: 'vinh_danh', so: 3, chu: 'Vinh danh 3 em' },
  { loai: 'bo_nao_soi', so: 250, chu: 'Bộ não A.I soi 250 em' },
]

export const MAU_DAY = {
  ok: true, ngay: '2026-09-21', tu: '2026-09-21T05:00:00.000Z', tuHomNay: '2026-09-21T05:00:00.000Z', tuDangAp: true, capNhatLuc: '2026-09-21T06:12:00.000Z',
  nhip: { soEmHoc: 57, tongEm: 263, soCau: 1234, soCauDung: 900, tiLeDung: 0.729, homQua: { soEmHoc: 61, soCau: 1100, tiLeDung: 0.7 } },
  baiTap: BAI_TAP,
  tienBo: [
    { loai: 'cham_nhat', sbd: '12012', hoTen: 'Trần Minh Anh', tenLop: '12 - Tinh Hoa', so: 42, chu: '42 câu đã làm hôm nay' },
    { loai: 'tien_bo_nhat', sbd: '12026', hoTen: 'Lê Thu Hà', tenLop: '12 - Lớp Thường', so: 6, chu: '6 câu sai trước nay đã làm đúng lại' },
    { loai: 'ben_bi_nhat', sbd: '12019', hoTen: 'Phạm Gia Bảo', tenLop: '12 - Tinh Hoa', so: 3, chu: '3 ngày liên tiếp làm từ 5 câu trở lên' },
  ],
  canDeY: CAN_DE_Y,
  dangVap: DANG_VAP,
  boNao: {
    ngay: '2026-09-21', chayLuc: '2026-09-20T18:04:00.000Z', soEmSoi: 250, soEmDieuChinh: 12, soLoiNhan: 30,
    goiY: [
      { chu: 'Lớp 12 - Lớp Thường vấp nhiều ở Thuỷ phân ester — nên chữa lại 10 phút đầu buổi tối nay.', dang: 'ESTE.THUY_PHAN', tenDang: 'Thuỷ phân ester' },
      { chu: '9 em chưa mở bài Este – lipid, máy sẽ nhắc lần nữa lúc 18:00.', dang: '', tenDang: '' },
    ],
  },
  mayDaLam: MAY_DA_LAM,
  sucKhoe: { muc: 'xanh', chu: 'Bộ não A.I chạy lúc 01:04 · nhắc nộp bài chạy lúc 13:30', boNaoChayLuc: '2026-09-20T18:04:00.000Z', cronNhacLuc: '2026-09-21T06:30:00.000Z' },
  soTruyVan: 11,
}

/** Đúng những gì Code 3 báo cho sáng 21/09: chưa có `homQua`, chưa bục tiến bộ nào đủ ngưỡng, Bộ não chưa có bản tin. */
export const MAU_THAT_SANG_21 = {
  ...MAU_DAY,
  nhip: { soEmHoc: 57, tongEm: 263, soCau: 1234, soCauDung: 900, tiLeDung: 0.729 },
  tienBo: [],
  boNao: undefined,
  mayDaLam: MAY_DA_LAM.filter((v) => v.loai !== 'bo_nao_soi'),
  sucKhoe: { muc: 'vang', chu: 'Chưa có bản tin Bộ não A.I để kiểm · nhắc nộp bài chạy lúc 13:30' },
  lyDoThieu: { boNao: 'Chưa có bản tin' },
}

/** Mốc mới, chưa em nào làm bài (trạng thái rỗng thật). */
export const MAU_RONG = {
  ok: true, ngay: '2026-09-21', tu: '2026-09-21T05:00:00.000Z', tuHomNay: '2026-09-21T05:00:00.000Z', tuDangAp: true, capNhatLuc: '2026-09-21T05:01:00.000Z',
  nhip: { soEmHoc: 0, tongEm: 263, soCau: 0 },
  baiTap: [],
  tienBo: [],
  canDeY: { ds: [], conLai: 0 },
  dangVap: [],
  mayDaLam: [],
  sucKhoe: { muc: 'xanh', chu: 'Bộ não A.I chạy lúc 01:04 · nhắc nộp bài chạy lúc 13:30' },
  lyDoThieu: { boNao: 'Chưa có bản tin' },
  soTruyVan: 9,
}
