// Dữ liệu GIẢ theo hợp đồng /ph/tat-ca-ve-con (server/src/ph-tat-ca-ve-con.ts, Code 4): dùng cho test app phụ huynh mới. Ngày mẫu 21/09/2026 21:00 giờ VN.
export const H = (h, p = 0) => new Date(Date.UTC(2026, 8, 21, h - 7, p)).toISOString() // 21/09/2026 giờ VN
export const NAY = Date.UTC(2026, 8, 21, 21 - 7, 0)
const de = ['Đun nóng $CH_3COOH$ với $C_2H_5OH$ (xúc tác $H_2SO_4$ đặc) thu được ester có công thức là', 'Thuỷ phân hoàn toàn 8,8 gam $CH_3COOC_2H_5$ bằng 200 mL dung dịch NaOH 1 M, cô cạn thu m gam chất rắn khan. Giá trị của m là', 'Chất nào sau đây là chất béo?', 'Xà phòng hoá tristearin bằng NaOH thu được muối nào?']
const cau = []
const them = (luc, nguon, n, kieu = {}) => { for (let i = 0; i < n; i++) cau.push(Object.assign({ luc: H(luc[0], luc[1] + i), nguon, tenDang: ['Danh pháp ester', 'Phản ứng ester hoá', 'Xà phòng hoá chất béo', 'Tính chất vật lí của lipid'][i % 4], deRutGon: de[i % 4], conChon: ['B', 'A', 'C', 'D'][i % 4], dapAn: ['B', 'B', 'C', 'D'][i % 4], dung: (i % 4) !== 1 && !(i === 4), giay: 40 + i * 9 + (i === 2 ? 190 : 0), coLoiGiai: true, qid: `q-${nguon}-${i}` }, kieu)) }
them([6, 40], 'on_lai', 6)
them([17, 12], 'btvn', 12)
them([19, 35], 'thu_thach_rieng', 5)
them([20, 10], 'luyen_dang_vap', 9)
for (let i = 0; i < 6; i++) cau.push({ luc: H(20, 40 + i), nguon: 'gia_dinh_giao', che: 'chua_nop', giay: 55 + i * 4 })
export const PH_OK = {
  ok: true, serverNow: NAY, hoTen: 'Nguyễn Minh Khôi',
  caGanNhat: { maCa: 'CA-2', tenCa: 'Kiểm tra 45 phút · Ester – Lipid', nopLuc: '2026-09-19T02:12:00Z', thoiGianLamGiay: 1930, congBo: { congBo: 'ngay', daCongBo: true, soEmDaNop: 30, soEmDaVao: 32 }, ketQua: { tong: 7.5, soCau: 28, soCauDung: 21 }, truoc: { tong: 6.75, doi: 0.75 }, phan: [{ ma: 'I', dung: 15, tong: 18, diem: 3.75 }, { ma: 'II', dung: 2, tong: 4, diem: 2.75 }, { ma: 'III', dung: 4, tong: 6, diem: 1 }] },
  homNay: {
    tongQuan: { soCau: 38, soDung: 30, phutHoc: 52, datNhiemVu: true, chuoiNgayHoc: 6, soVoiHomQua: { soCau: 33, tiLeDung: 0.76 } },
    dongThoiGian: [
      { batDau: H(6, 40), nguon: 'on_lai', soCau: 6, soDung: 5, phut: 7 },
      { batDau: H(17, 12), nguon: 'btvn', ten: 'Ester – Lipid', soCau: 12, soDung: 9, phut: 21, ghiChu: 'Nộp đúng hạn' },
      { batDau: H(19, 35), nguon: 'thu_thach_rieng', soCau: 5, soDung: 4, phut: 6 },
      { batDau: H(20, 10), nguon: 'luyen_dang_vap', soCau: 9, soDung: 7, phut: 11 },
      { batDau: H(20, 40), nguon: 'gia_dinh_giao', ten: 'Gia đình giao thêm · 6 câu', che: 'chua_nop', phut: 7 },
    ],
    cau,
  },
  nhipHoc: { ngay: [['2026-09-08', 22], ['2026-09-10', 18], ['2026-09-11', 31], ['2026-09-12', 26], ['2026-09-14', 24], ['2026-09-16', 20], ['2026-09-17', 27], ['2026-09-18', 16], ['2026-09-19', 28], ['2026-09-20', 33], ['2026-09-21', 38]].map(([ngay, soCau]) => ({ ngay, soCau, soCauDung: Math.round(soCau * 0.78) })), gioThuongHoc: '19:30–21:00' },
  manhYeu: { lamTot: [{ tenDang: 'Danh pháp ester', dung: 11, tong: 12, bac: 'van_dung' }, { tenDang: 'Phản ứng ester hoá', dung: 9, tong: 10, bac: 'hieu' }, { tenDang: 'Tính chất vật lí của lipid', dung: 8, tong: 9, bac: 'hieu' }], conVap: [{ tenDang: 'Xà phòng hoá chất béo', dung: 3, tong: 9, bac: 'biet' }, { tenDang: 'Bài toán hỗn hợp ester', dung: 2, tong: 7, bac: 'biet' }], lenBacHomNay: [{ tenDang: 'Phản ứng ester hoá' }, { tenDang: 'Tính chất vật lí của lipid' }] },
  baiTapVeNha: { dangChay: [{ maBtvn: 'B1', ten: 'Ester – Lipid', hanNop: '2026-09-25T05:00:00Z', changXong: 2, changTong: 5 }], gan: [{ maBtvn: 'B2', ten: 'Ôn tập Alcohol – Phenol', nopLuc: '2026-09-17T14:40:00Z', dungHan: true, diem: 8.2 }, { maBtvn: 'B3', ten: 'Ôn tập Carboxylic acid', nopLuc: '2026-09-13T16:05:00Z', dungHan: false, diem: 7 }] },
  lichOn: { homNay: 0, ngayMai: 7, daKhacPhuc14Ngay: 12, conSaiChuaKhacPhuc: 19 },
  phuHuynhLamGi: ['Hỏi con kể lại cách giải câu thuỷ phân ethyl acetate lúc 17:15.', 'Nhắc con làm 7 câu ôn lại ngày mai, khoảng 10 phút.'],
  loiBoNao: { loi: 'Hôm nay Khôi làm 38 câu trong 52 phút, đúng 30 câu, nhiều hơn hôm qua 5 câu. Con lên bậc Hiểu ở hai dạng. Dạng Xà phòng hoá chất béo con mới đúng 3 trong 9 câu, nên ngày mai con sẽ ôn lại 4 câu dạng này.', ngay: '2026-09-21', thuTuan: '' },
  giaoThem: { conLaiHomNay: 2 }, doCham: { hang: 9, siSo: 42 },
}

export const PH_CHUA_CB = { ...PH_OK, caGanNhat: { maCa: 'CA-3', tenCa: 'Kiểm tra 60 phút', nopLuc: H(9, 12), congBo: { congBo: 'ca_lop_xong', daCongBo: false, soEmDaNop: 27, soEmDaVao: 32 } } }
export const PH_TRONG = { ok: true, serverNow: NAY, hoTen: 'Nguyễn Minh Khôi', giaoThem: { conLaiHomNay: 3 } }
export const CHI_TIET = { ok: true, serverNow: NAY, de: de[0], phuongAn: ['A. CH$_3$COOCH$_3$', 'B. CH$_3$COOC$_2$H$_5$', 'C. C$_2$H$_5$COOCH$_3$', 'D. HCOOC$_2$H$_5$'], dapAn: 'B', tenDang: 'Phản ứng ester hoá', loiGiai: 'Phản ứng ester hoá giữa acid acetic và ethanol tạo ethyl acetate CH3COOC2H5. Đáp án B.' }
