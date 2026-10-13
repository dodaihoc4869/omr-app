// DỮ LIỆU GIẢ ĐỢT 19 · LÀN R — app phụ huynh "Hôm nay của Khôi" đúng các số của bản vẽ thầy duyệt (docs/ban-ve-dot19/app-phu-huynh.html):
// 21:05 Thứ Tư 14/10/2026 · 18/30 câu · đúng 13 sai 5 · 41 giây/câu · có mặt 17:52 · nhóm Chưa đều 9/13 ngày · chuỗi 3 · hạng 17/42 · đối phó (32% quá nhanh,
// nhóm này đúng 29%) · 27/46 câu đã sửa · lịch ôn 4/3 câu · Kiểm tra 45 phút 7,5 · BTVN 3/5 chặng · 7/8 buổi có mặt. Tên, câu, số đều GIẢ.
// Dùng chung: trang chụp ảnh (trang.tsx) + test giao diện (tests/ph-trung-tu-1310r.test.tsx). Số nhịp học + bậc tính bằng ĐÚNG phép máy chủ.
import { bacChamChi } from '../../server/src/bac-cham-chi'
import { tomTatNhip, viecTiepNhip } from '../../server/src/nhip-hoc-luat'

/** 21:05 Thứ Tư 14/10/2026 giờ Việt Nam. */
export const NAY = Date.UTC(2026, 9, 14, 14, 5)
const vn = (ngay: string, gio: string): string => new Date(Date.parse(`${ngay}T${gio}:00+07:00`)).toISOString()
const HOM_NAY = '2026-10-14'
const NGAY = Array.from({ length: 14 }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`)
const LAM = [32, 30, 20, 31, 0, 30, 34, 9, 30, 22, 30, 33, 31, 18]

// ---------------------------------------------------------------- /ph/nhip-hoc ----------------------------------------------------------------
export function nhipGia() {
  const ngay = LAM.map((lam, i) => ({ ngay: NGAY[i]!, muc: 30, lam }))
  const t = tomTatNhip(ngay, HOM_NAY)
  const bac = bacChamChi(ngay, HOM_NAY, t)
  return {
    ok: true, tu: NGAY[0], homNay: HOM_NAY, nhom: t.nhom, soNgayQua: t.soNgayQua, soNgayDu: t.soNgayDu, phanTram: Math.round((100 * t.soNgayDu) / Math.max(1, t.soNgayQua)), ngay,
    chuoiDuGanNhat: t.chuoiDuGanNhat, tongDaLam: t.tongLam + (t.homNay?.lam ?? 0), tongCauThieu: t.tongCauThieu, ngayDuGanNhat: t.ngayDuGanNhat, homNayMuc: t.homNay,
    chuoiBo: t.chuoiKhongLam, tocDo: { soNhanh: 131, soCoGiay: 409, dungNhanh: 29, coTuTinh: false, muc: 'xau' }, viecTiep: viecTiepNhip(t),
    doTinCay: 84, canThem: 'cần thêm khoảng 2 ngày có số liệu để chắc chắn hơn.',
    ...(bac ? { bacCham: bac } : {}),
  }
}

// ---------------------------------------------------------------- /ph/con-tong-quan ----------------------------------------------------------------
const DUNG = [26, 25, 15, 24, 0, 24, 27, 4, 22, 15, 21, 23, 24, 13]
export function tongQuanGia() {
  const ngay = LAM.map((lam, i) => ({
    ngay: NGAY[i]!, dung: DUNG[i]!, sai: lam - DUNG[i]!, boTrong: 0, soCau: lam, muc: 30, mucUocTinh: false, daXep: 30, canLam: 30, daLam: lam,
    trangThai: i === 13 ? 'thieu' : lam >= 30 ? 'du' : lam === 0 ? 'khong' : 'thieu', homNay: i === 13,
  }))
  return {
    ok: true, serverNow: NAY, homNay: HOM_NAY, moc: '2026-10-01', tuNgay: '2026-10-01',
    dem: {
      homNay: { soLuot: 18, dung: 13, sai: 5, boTrong: 0, soCau: 18, giayTb: 41 },
      bayNgay: { soLuot: 190, dung: 125, sai: 65, boTrong: 0, soCau: 178, giayTb: 39 },
      tuMoc: { soLuot: 412, dung: 289, sai: 123, boTrong: 0, soCau: 350, giayTb: 41 },
    },
    ngay,
    thoiGian: {
      giayTb: 39, giayGiua: 31, soDo: 173, soUoc: 14, soChuaDo: 3,
      phanBo: [{ tu: 0, den: 8, so: 40, sai: 28 }, { tu: 8, den: 30, so: 58, sai: 12 }, { tu: 30, den: 60, so: 50, sai: 9 }, { tu: 60, den: 120, so: 29, sai: 6 }, { tu: 120, den: 300, so: 10, sai: 4 }, { tu: 300, den: null, so: 3, sai: 1 }],
      nhanh: { so: 40, sai: 28 },
    },
    ganDay: [
      { luc: vn(HOM_NAY, '20:05'), tieuDe: 'Câu 17 · Thuỷ phân ester đơn chức', noi: 'Bài luyện trên app', dung: true, giay: 42, nguonGiay: 'do', coGoiY: false },
      { luc: vn(HOM_NAY, '19:56'), tieuDe: 'Câu 23 · Chỉ số xà phòng hoá chất béo', noi: 'Bài luyện trên app', dung: false, giay: 6, nguonGiay: 'do', coGoiY: false },
      { luc: vn(HOM_NAY, '19:47'), tieuDe: 'Câu 5 · Gọi tên ester theo danh pháp', noi: 'Ôn lại', dung: true, giay: 75, nguonGiay: 'do', coGoiY: true },
      { luc: vn(HOM_NAY, '19:38'), tieuDe: 'Câu 31 · Bảo toàn khối lượng khi xà phòng hoá', noi: 'Tự sửa lỗi', dung: false, giay: 4, nguonGiay: 'uoc', coGoiY: false },
      { luc: vn(HOM_NAY, '19:29'), tieuDe: 'Câu 8 · Glucose và fructose', noi: 'Ca kiểm tra', dung: true, giay: 38, nguonGiay: 'do', coGoiY: false },
    ],
    cauSai: { tong: 46, daSua: 27, ds: [] },
    khuya: { soNgay: 2, soLuot: 5 },
    goiYDaDung: { so: 63, tong: 350 },
    goiY: [
      { ma: 'con-cau-hom-nay', chu: 'Hôm nay con còn 12 câu chưa làm (đã làm 18/30 câu).' },
      { ma: 'sai-chua-sua', chu: 'Có 19 câu con làm sai chưa sửa được. Nhắc con vào mục Tự sửa lỗi để làm lại.' },
      { ma: 'nhanh-sai', chu: '7 ngày qua có 40 câu con làm dưới 8 giây và sai 28 câu. Nhắc con đọc kỹ đề trước khi chọn.' },
      { ma: 'ti-le-giam', chu: 'Tỉ lệ đúng 7 ngày qua là 66%, thấp hơn 7 ngày trước đó (74%). Hỏi con phần nào đang khó để báo Thầy.' },
    ],
    catBot: false,
  }
}

// ---------------------------------------------------------------- /ph/tat-ca-ve-con ----------------------------------------------------------------
export function tatCaGia(o: { coBuoi?: boolean } = {}) {
  const coBuoi = o.coBuoi !== false
  return {
    ok: true, serverNow: NAY, hoTen: 'Nguyễn Minh Khôi',
    caGanNhat: {
      maCa: 'CA-45', tenCa: 'Kiểm tra 45 phút · Ester – Lipid', nopLuc: vn('2026-10-10', '19:40'), thoiGianLamGiay: 38 * 60,
      congBo: { congBo: 'ngay', daCongBo: true, soEmDaNop: 40, soEmDaVao: 42 }, ketQua: { tong: 7.5, soCau: 28, soCauDung: 21 }, truoc: { tong: 6.75, doi: 0.75 },
      phan: [{ ma: 'I', dung: 14, tong: 18, diem: 3.5, toiDa: 4.5 }, { ma: 'II', dung: 4, tong: 4, diem: 2.75, toiDa: 4 }, { ma: 'III', dung: 3, tong: 6, diem: 1.25, toiDa: 1.5 }],
    },
    tienBo: {
      diem: [{ ngay: '2026-09-19', diem: 6, maCa: 'CA-1', tenCa: 'Kiểm tra 15 phút' }, { ngay: '2026-09-26', diem: 6.5, maCa: 'CA-2', tenCa: 'Kiểm tra 15 phút' }, { ngay: '2026-10-03', diem: 6.75, maCa: 'CA-3', tenCa: 'Kiểm tra 30 phút' }, { ngay: '2026-10-10', diem: 7.5, maCa: 'CA-45', tenCa: 'Kiểm tra 45 phút · Ester – Lipid' }],
      dangTienBoNhat: [],
    },
    homNay: {
      tongQuan: { soCau: 18, soDung: 13, phutHoc: 12, datNhiemVu: false, chuoiNgayHoc: 4, soVoiHomQua: { soCau: 31, tiLeDung: 0.77, phutHoc: 22 }, soLanHoc: 2 },
      dongThoiGian: [
        { batDau: vn(HOM_NAY, '19:31'), nguon: 'luyen_dang_vap', soCau: 11, soDung: 8, phut: 8 },
        { batDau: vn(HOM_NAY, '20:38'), nguon: 'on_lai', soCau: 7, soDung: 5, phut: 4 },
      ],
    },
    nhipHoc: { ngay: NGAY.map((ngay, i) => ({ ngay, soCau: LAM[i]!, soCauDung: DUNG[i]! })).filter((x) => x.soCau > 0), gioThuongHoc: '19:30–21:00', trungBinhCauMoiNgay: 26, tongCau: 350 },
    bacTheoDang: [{ ma: 'ES', ten: 'Thuỷ phân ester', bac: 2 }, { ma: 'DP', ten: 'Gọi tên ester theo danh pháp', bac: 2 }, { ma: 'XP', ten: 'Xà phòng hoá chất béo', bac: 1 }],
    vuaLenBac: [{ ma: 'ES', ten: 'Thuỷ phân ester', tu: 1, den: 2, ngay: '2026-10-12' }],
    manhYeu: {
      lamTot: [{ tenDang: 'Gọi tên ester theo danh pháp', dung: 9, tong: 10, bac: 'van_dung' }],
      conVap: [{ tenDang: 'Xà phòng hoá chất béo', dung: 3, tong: 8, bac: 'hieu' }, { tenDang: 'Hiệu suất ester hoá', dung: 2, tong: 5, bac: 'hieu' }],
      lenBacHomNay: [],
    },
    baiTapVeNha: {
      dangChay: [{ maBtvn: 'B7', ten: 'Ester – Lipid · buổi 7', hanNop: vn('2026-10-15', '23:59'), changXong: 3, changTong: 5 }],
      gan: [
        { maBtvn: 'B6', ten: 'Ester · buổi 6', nopLuc: vn('2026-10-12', '21:40'), dungHan: true, diem: 8.2 },
        { maBtvn: 'B5', ten: 'Ester · buổi 5', nopLuc: vn('2026-10-09', '02:30'), dungHan: false, nopTreGio: 3.5, diem: 6 },
        { maBtvn: 'B4', ten: 'Chất béo · buổi 4', nopLuc: vn('2026-10-05', '20:15'), dungHan: true, diem: 7.4 },
      ],
    },
    lichOn: {
      homNay: 4, ngayMai: 3, daKhacPhuc14Ngay: 6, conSaiChuaKhacPhuc: 19, tongTungSai: 25, phutNgayMai: 6,
      bayNgayToi: [3, 2, 0, 4, 1, 2, 0].map((soCau, i) => ({ ngay: `2026-10-${String(15 + i).padStart(2, '0')}`, soCau })),
    },
    no: { theoNgay: [{ ngay: '2026-10-13', loai: 'btvn', ten: 'Ester · buổi 6', soCau: 12, phut: 10 }], tongCau: 12, tongPhut: 10 },
    doCham: { hang: 17, siSo: 42 },
    giaoThem: { conLaiHomNay: 2 },
    ...(coBuoi
      ? {
          buoiHoc: {
            ds: [
              { ten: 'Buổi 8 · Ester – Lipid', moLuc: vn(HOM_NAY, '17:30'), coMat: true, luc: vn(HOM_NAY, '17:52'), cach: 'ma' },
              { ten: 'Buổi 7 · Ester', moLuc: vn('2026-10-12', '17:30'), coMat: true, luc: vn('2026-10-12', '17:49'), cach: 'ma' },
              { ten: 'Buổi 6 · Ester', moLuc: vn('2026-10-08', '17:30'), coMat: false },
              { ten: 'Buổi 5 · Chất béo', moLuc: vn('2026-10-06', '17:30'), coMat: true, luc: vn('2026-10-06', '17:58'), cach: 'thay' },
              { ten: 'Buổi 4 · Chất béo', moLuc: vn('2026-10-03', '17:30'), coMat: true, luc: vn('2026-10-03', '17:47'), cach: 'ma' },
              { ten: 'Buổi 3 · Ester', moLuc: vn('2026-10-01', '17:30'), coMat: true, luc: vn('2026-10-01', '17:50'), cach: 'ma' },
              { ten: 'Buổi 2 · Ester', moLuc: vn('2026-09-29', '17:30'), coMat: true, luc: vn('2026-09-29', '17:53'), cach: 'ma' },
              { ten: 'Buổi 1 · Ôn tập', moLuc: vn('2026-09-26', '17:30'), coMat: true, luc: vn('2026-09-26', '17:45'), cach: 'ma' },
            ],
          },
        }
      : {}),
  }
}

// ---------------------------------------------------------------- /ph/ho-so-thai-do ----------------------------------------------------------------
export function thaiDoGia() {
  return {
    ok: true, em: { sbd: '', hoTen: 'Nguyễn Minh Khôi', lop: '12A1', khoi: '12' }, tu: '2026-10-01', den: HOM_NAY, homNay: HOM_NAY,
    ketLuan: { nhan: 'doi-pho', lyDo: ['Trả lời quá nhanh: Quá nhanh 131/409 lượt (32%) · nhóm quá nhanh đúng 29% · lượt thường đúng 77%.'], doTinCay: 88 },
    tinHieu: [
      { ma: 'ngay-du-muc', ten: 'Ngày đủ mức', muc: 'chu-y', giaTri: 69, tu: 9, mau: 13, chu: 'Đủ mức 9/13 ngày (69%)', nguong: 'x', doTinCay: 80 },
      { ma: 'qua-nhanh', ten: 'Trả lời quá nhanh', muc: 'xau', giaTri: 32, tu: 131, mau: 409, chu: 'Quá nhanh 131/409 lượt (32%) · nhóm quá nhanh đúng 29% · lượt thường đúng 77%', nguong: 'x', doTinCay: 93 },
      { ma: 'don-bai', ten: 'Dồn bài cuối ngày', muc: 'tot', giaTri: 9, tu: 37, mau: 412, chu: '37/412 lượt làm trong 23:00–04:59 (9%)', nguong: 'x', doTinCay: 97 },
      { ma: 'goi-y', ten: 'Dùng gợi ý, đọc lời giải', muc: 'tot', giaTri: 18, tu: 63, mau: 350, chu: '63/350 câu có dùng gợi ý hoặc đọc lời giải (18%)', nguong: 'x', doTinCay: 91 },
      { ma: 'chon-lap', ten: 'Chọn lặp một phương án', muc: 'tot', giaTri: 4, tu: 12, mau: 298, chu: '12/298 lượt trắc nghiệm nằm trong chuỗi chọn lặp (4%) · chuỗi dài nhất 6 lượt chọn B', nguong: 'x', doTinCay: 95 },
      { ma: 'xu-huong', ten: 'Độ đúng theo thời gian', muc: 'chu-y', giaTri: -8, tu: 190, mau: 222, chu: '7 ngày gần nhất đúng 66% (190 lượt) · trước đó 74% (222 lượt) · giảm 8 điểm %', nguong: 'x', doTinCay: 72 },
    ],
    dem: { soLuot: 412, soCau: 350, soDung: 289, soSai: 123, soBoTrong: 0, soCauOn: 40, soLuotOn: 61, giayTb: 41, giayTrungVi: 33, soLuotCoGiay: 409 },
    ngay: [], phanBoGiay: [], cauDung: [], cauDaOn: [], catBot: false, canhBao: [],
    nhomNhip: 'chua-deu', coDoiPho: true, chuoiDuGanNhat: 3,
    tuSuaSai: { soCauSai: 46, soCauDaSua: 27, phanTram: 59, chu: 'Đã làm đúng lại 27/46 câu từng sai (59%)' },
    tinCayNhom: { doTinCay: 84 },
  }
}

// ---------------------------------------------------------------- /ph/lich-su-lam-cau ----------------------------------------------------------------
export function lichSuGia() {
  const MUC: [string, number, number, number][] = [['biet', 118, 19, 90], ['hieu', 165, 37, 74], ['VD', 101, 71, 58], ['VDC', 25, 125, 32]]
  const lan: Record<string, unknown>[] = []
  let k = 0
  for (const [mucDo, n, giay, pt] of MUC) {
    for (let i = 0; i < n; i++) {
      k++
      const ms = NAY - k * 37 * 60_000
      lan.push({
        luc: new Date(ms).toISOString(), ngay: new Date(ms + 7 * 3_600_000).toISOString().slice(0, 10), qid: `q${k}`, tieuDe: `Câu ${(k % 40) + 1}`, mucDo, noi: 'Bài luyện trên app',
        dung: i < Math.round((n * pt) / 100), chon: null, giay: Math.max(2, giay + ((i % 7) - 3) * 3), nguonGiay: mucDo === 'VDC' && i % 10 === 0 ? 'uoc' : 'do', coGoiY: false,
      })
    }
  }
  const sai = (tieuDe: string, mucDo: string, soSai: number, lanCuoi: string, giaySai: (number | null)[], lanCuoiDung = false) => ({ qid: `s-${tieuDe}`, tieuDe, mucDo, soLan: soSai + (lanCuoiDung ? 1 : 0), soSai, soDung: lanCuoiDung ? 1 : 0, lanCuoiDung, lanCuoi, giaySai })
  const cauSai = [
    sai('Câu 31 · Bảo toàn khối lượng khi xà phòng hoá', 'VD', 3, vn('2026-10-13', '20:10'), [6, 5, 41]),
    sai('Câu 40 · Hiệu suất phản ứng ester hoá', 'VD', 2, vn('2026-10-13', '19:50'), [112, 130]),
    sai('Câu 23 · Chỉ số xà phòng hoá chất béo', 'hieu', 2, vn('2026-10-12', '20:30'), [4, 7]),
    sai('Câu 12 · Saccharose và tinh bột', 'biet', 1, vn('2026-10-11', '19:40'), [18]),
    ...Array.from({ length: 15 }, (_, i) => sai(`Câu ${50 + i}`, 'hieu', 1, vn('2026-10-09', '20:00'), [30 + i])),
    ...Array.from({ length: 27 }, (_, i) => sai(`Câu ${70 + i}`, 'hieu', 1, vn('2026-10-08', '20:00'), [25], true)),
  ]
  return { ok: true, em: { sbd: '', hoTen: 'Nguyễn Minh Khôi', lop: '12A1' }, tong: { soLuot: 412, soDung: 289, soSai: 123, soBoTrong: 0, soCau: 350, soCauSai: 46, giayTb: 41, tongGiay: 16769 }, lan, cauSai, conNua: false, catBot: false }
}

// ---------------------------------------------------------------- /ph/loi-thay · /ph/hoc-2 ----------------------------------------------------------------
export const loiThayGia = () => ({
  ok: true,
  nhanXet: [
    { maCa: 'CA-45', tenCa: 'Kiểm tra 45 phút', noiDung: 'Bài 10/10 con làm chắc Phần I. Phần III con còn sai 2 câu hiệu suất ester hoá vì bỏ qua bước đổi đơn vị. Tuần này con luyện thêm 10 câu dạng này; Thứ Bảy thầy kiểm tra lại.', capNhatLuc: vn('2026-10-10', '21:00'), nopLuc: vn('2026-10-10', '19:40'), tong: 7.5 },
    ...Array.from({ length: 5 }, (_, i) => ({ maCa: `CA-${i}`, tenCa: `Kiểm tra 15 phút ${i + 1}`, noiDung: 'Con làm tốt phần lý thuyết.', capNhatLuc: vn('2026-10-01', '21:00'), nopLuc: vn('2026-10-01', '19:40'), tong: 7 })),
  ],
})
export const hoc2Gia = () => ({
  ok: true, cheDo2: true, ngay: HOM_NAY, homNay: { tong: 30, daLam: 18 },
  omni: { khoangCach8: null, hieuChuan: { soCaChot: 1, du: false }, dangCanVung: ['Xà phòng hoá chất béo', 'Hiệu suất ester hoá', 'Bảo toàn khối lượng'], sEm: 0.06, chungChi: [], gioHoc: '19:30–21:00', canThayChua: 0 },
})
