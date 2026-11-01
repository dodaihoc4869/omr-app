// DỮ LIỆU GIẢ cho bản vẽ — tên giả, số giả sát thực tế. Hình dạng bám kiểu thật:
//   homNay/chuoi  ← /ph/con-tong-quan (dem.homNay, ngay[] trangThai du|thieu|khong) + /ph/ke-hoach (phutMoiNgay, mucTieuCau, chuoiDat)
//   bon           ← bảng bon_chi_so_em (diem ht/dp/ch/lu, the_json = bằng chứng, ngay_json) — CẦN lệnh mới /ph/bon-so-do (xem DAC-TA.md)
//   diem/ca       ← /ph/bao-cao-ca + /ph/hoc-2 · yeu ← /ph/tat-ca-ve-con · sap ← /ph/ke-hoach + lịch ca · thay ← /ph/loi-thay
// Ngày: hôm nay Chủ Nhật 01/11/2026; cửa sổ 4 số đo = 14 ngày TRỌN 18/10–31/10 (tới hết hôm qua).
window.DU_LIEU = {
  tot: {
    ten: 'Nguyễn Minh An', goi: 'An', chuCai: 'MA', lop: '12A1',
    capNhat: '21:40',
    homNay: {
      dangHoc: 'Ester – Lipid',
      cau: 'Hôm nay con học <em>38 phút</em>, làm <em>26 câu</em>, đúng <em>21</em>.',
      phu: 'Con làm chậm rãi và tự sửa được 4 câu từng sai.',
      chip: [{ mau: 'xl', bt: 'check', chu: 'Đủ mức hôm nay' }, { mau: 'hp', bt: 'lua', chu: 'Chuỗi 6 ngày' }],
      // 19/10 → 01/11 (ô cuối = hôm nay). du = đủ mức · thieu = có học, chưa đủ · khong = không học
      ngay: ['du', 'du', 'thieu', 'du', 'du', 'du', 'du', 'khong', 'du', 'du', 'du', 'du', 'du', 'du'],
      ngayChu: '<b>12/14 ngày</b> đủ mức'
    },
    bon: {
      soLuot: 212,
      ht: {
        diem: 78, muc: 'tot', chu: 'Tốt', truoc: 72, ngan: 'Tự sửa đúng 9/11 câu sai',
        xu: [60, 64, 58, 66, 70, 68, 72, 71, 74, 73, 76, 75, 77, 78],
        noi: 'Con tự nghĩ, đọc kỹ đề và sửa lại câu từng sai, không chỉ làm cho xong.',
        bc: [
          { so: '9/11', chu: 'câu từng sai con đã <b>tự sửa đúng</b> khi làm lại, không lướt qua.', vd: '20:41 · Thứ Sáu 30/10 · Đốt cháy ester · sai hôm 27/10, làm lại đúng sau 2 phút' },
          { so: '84%', chu: 'câu con <b>đọc đủ thời gian</b> rồi mới chọn đáp án.' },
          { so: '72%', chu: 'câu mới con <b>tự làm đúng ngay lần đầu</b>, không xem gợi ý.' }
        ],
        nen: ['Khen cụ thể: «Con tự sửa được 9 câu sai, giỏi lắm».', 'Hỏi con kể lại một câu đã sửa: lần trước con sai ở bước nào?']
      },
      dp: {
        diem: 12, muc: 'tot', chu: 'Ít, tốt', truoc: 16, ngan: 'Chỉ 3 lần chọn vội',
        xu: [24, 22, 25, 20, 18, 19, 16, 17, 15, 14, 13, 14, 12, 12],
        noi: 'Con hầu như không đoán mò, không dò đáp án, không làm cho xong.',
        bc: [
          { so: '3/212', chu: 'lượt con <b>chọn khi chưa đọc hết đề</b> rồi sai. Rất ít.' },
          { so: '0', chu: 'lần <b>dò đáp án</b> (thử nhiều đáp án rồi mới bấm Kiểm tra).' },
          { so: 'Khớp', chu: 'điểm kiểm tra <b>khớp với lúc luyện</b>: con hiểu bài, không học thuộc đáp án.' }
        ],
        nen: ['Không cần lo phần này. Giữ thói quen đọc hết đề rồi mới chọn.']
      },
      ch: {
        diem: 86, muc: 'tot', chu: 'Rất đều', truoc: 78, ngan: '12/14 ngày đủ mức',
        xu: [70, 72, 72, 74, 76, 78, 78, 80, 81, 82, 84, 85, 85, 86],
        noi: 'Con học đều mỗi ngày và làm đủ phần thầy giao.',
        bc: [
          { so: '12/14', chu: 'ngày con <b>làm đủ mức</b> (20 phút, 12 câu mỗi ngày).' },
          { so: '94%', chu: 'câu thầy giao con <b>đã làm kỹ</b>.' },
          { so: '6 ngày', chu: '<b>chuỗi đủ mức</b> liền nhau gần nhất, tới hôm nay.' }
        ],
        nen: ['Khen con vì học đều.', 'Giữ một giờ học cố định mỗi tối, con đang làm rất tốt.']
      },
      lu: {
        diem: 14, muc: 'tot', chu: 'Ít, tốt', truoc: 22, ngan: 'Chỉ bỏ 1/14 ngày',
        xu: [30, 28, 28, 26, 24, 22, 22, 20, 19, 18, 16, 15, 15, 14],
        noi: 'Con gần như không bỏ ngày học và không dồn bài tới khuya.',
        bc: [
          { so: '1/14', chu: 'ngày con <b>không học</b> (Thứ Hai 26/10).' },
          { so: '0', chu: 'ngày <b>dồn bài sau 23:00</b>.' },
          { so: '1', chu: 'lần con <b>chưa làm sau lời nhắc 21:00</b>.' }
        ],
        nen: ['Không cần nhắc thêm giờ học: con đang tự giác.']
      }
    },
    ca: {
      ten: 'Ester – Lipid', luc: '19:30 · Thứ Năm 29/10', soCau: 28, phut: 40,
      diem: '7,75', doi: '+0,5', len: true,
      xu: [{ n: '08/10', d: 6.0 }, { n: '15/10', d: 6.5 }, { n: '19/10', d: 7.0 }, { n: '22/10', d: 7.25 }, { n: '29/10', d: 7.75 }],
      phan: [
        { ten: 'Phần I · Trắc nghiệm', dat: 17, tong: 18, don: 'câu' },
        { ten: 'Phần II · Đúng – sai', dat: 13, tong: 16, don: 'ý' },
        { ten: 'Phần III · Trả lời ngắn', dat: 3, tong: 6, don: 'câu' }
      ],
      sai: [
        { ten: 'Đốt cháy ester', so: 3, on: 'Đã ôn lại 2 câu' },
        { ten: 'Chỉ số acid của chất béo', so: 1, on: 'Đến lịch ôn lại thứ Hai' },
        { ten: 'Xà phòng hoá chất béo', so: 1, on: 'Đã ôn lại' }
      ],
      loi: 'Lý thuyết con chắc. Bài đốt cháy còn quên bảo toàn nguyên tố O, thầy đã giao 6 câu ôn.',
      tbLop: '7,1'
    },
    yeu: [
      { ten: 'Đốt cháy ester', dung: 4, lam: 10 },
      { ten: 'Thuỷ phân chất béo', dung: 5, lam: 9 },
      { ten: 'Peptide', dung: 3, lam: 7 }
    ],
    sap: [
      { loai: 'btvn', thu: 'Thứ Hai', ngay: '02/11', ten: 'Hạn nộp BTVN', phu: '23:59 · còn 12 câu' },
      { loai: 'ca', thu: 'Thứ Ba', ngay: '03/11', ten: 'Ca kiểm tra', phu: '19:30 · Amine – Amino acid' }
    ],
    thay: { luc: '20:15 hôm qua', loi: 'Tuần này An tiến bộ rõ ở phần ester. Anh chị nhắc con ôn peptide trước ca thứ Ba nhé.' },
    nen: [
      { dong: 'Khen con', chu: 'vì giữ chuỗi 6 ngày và tự sửa 4 câu sai hôm nay.' },
      { dong: 'Nhắc con', chu: 'ôn peptide 15 phút trước ca thứ Ba 03/11.' },
      { dong: 'Không cần', chu: 'nhắc thêm giờ học: con đang học đều.' }
    ]
  },

  'chua-tot': {
    ten: 'Trần Gia Huy', goi: 'Huy', chuCai: 'GH', lop: '11A2',
    capNhat: '21:40',
    homNay: {
      dangHoc: 'Ester – Lipid',
      cau: 'Hôm nay con <em>chưa làm câu nào</em>.',
      phu: 'Hôm qua con làm 14 câu trong 7 phút, nhiều câu chọn vội.',
      chip: [{ mau: 'hp', bt: 'canh', chu: 'Chưa đủ mức hôm nay' }, { mau: 'mo', bt: 'lua', chu: 'Chuỗi ngày: chưa có' }],
      ngay: ['du', 'thieu', 'khong', 'du', 'thieu', 'khong', 'khong', 'du', 'thieu', 'du', 'thieu', 'khong', 'thieu', 'chua'],
      ngayChu: '<b>4/14 ngày</b> đủ mức'
    },
    bon: {
      soLuot: 168,
      ht: {
        diem: 34, muc: 'vua', chu: 'Cần để ý', truoc: 41, ngan: 'Sửa đúng 3/12 câu sai',
        xu: [48, 46, 45, 44, 42, 40, 41, 38, 37, 36, 35, 36, 34, 34],
        noi: 'Con ít tự sửa câu sai, nhiều câu chọn khi chưa đọc kỹ đề.',
        bc: [
          { so: '3/12', chu: 'câu từng sai con <b>sửa đúng thật</b> khi làm lại.' },
          { so: '41%', chu: 'câu con <b>đọc đủ thời gian</b> rồi mới chọn.' },
          { so: 'Lệch', chu: 'lúc luyện đúng 76%, nhưng <b>kiểm tra cá nhân chỉ 4,5 điểm</b>.' }
        ],
        nen: ['Hỏi con giảng lại một câu vừa làm. Con giảng được là con hiểu thật.', 'Khen khi con chịu làm lại câu sai, dù chậm.']
      },
      dp: {
        diem: 64, muc: 'xau', chu: 'Cao', truoc: 54, ngan: '23 lần chọn vội, sai',
        xu: [44, 46, 48, 50, 52, 55, 54, 57, 58, 60, 61, 62, 63, 64],
        noi: 'Nhiều câu con làm cho xong: chọn vội, dò đáp án, có lúc tra ngoài.',
        bc: [
          { so: '23 lần', chu: 'con <b>chọn đáp án khi chưa đọc hết đề</b> (dưới 6 giây) và sai.', vd: '21:52 · Thứ Sáu 30/10 · Thuỷ phân ester · chọn sau 4 giây · sai' },
          { so: '9 câu', chu: 'con <b>thử 3 đáp án trở lên</b> rồi mới bấm Kiểm tra (dò đáp án).', vd: '22:10 · Thứ Sáu 30/10 · Chỉ số acid · thử 4 đáp án' },
          { so: '6 câu', chu: 'con <b>rời app khoảng 20 giây</b>, quay lại chọn đúng ngay (có thể đã tra ngoài).', vd: '23:05 · Thứ Năm 29/10 · Đốt cháy ester · rời app 24 giây' }
        ],
        nen: ['Tối nay ngồi cạnh con 15 phút đầu, nhắc: đọc hết đề rồi mới chọn.', 'Không mắng. Hỏi con: câu nào khó nhất, con nghĩ thế nào?', 'Để điện thoại khác ra xa khi con làm bài.']
      },
      ch: {
        diem: 38, muc: 'vua', chu: 'Chưa đều', truoc: 46, ngan: '4/14 ngày đủ mức',
        xu: [56, 54, 52, 50, 48, 47, 46, 44, 42, 41, 40, 39, 38, 38],
        noi: 'Con học chưa đều: có ngày làm đủ, nhiều ngày làm thiếu hoặc bỏ.',
        bc: [
          { so: '4/14', chu: 'ngày con <b>làm đủ mức</b> (20 phút, 12 câu).' },
          { so: '52%', chu: 'câu thầy giao con <b>đã làm kỹ</b>.' },
          { so: '0', chu: 'ngày trong <b>chuỗi đủ mức</b> hiện tại.' }
        ],
        nen: ['Thống nhất với con một giờ học cố định, ví dụ 20:00.']
      },
      lu: {
        diem: 62, muc: 'xau', chu: 'Cao', truoc: 54, ngan: 'Bỏ 5/14 ngày học',
        xu: [44, 46, 48, 50, 52, 53, 54, 56, 58, 59, 60, 61, 62, 62],
        noi: 'Con hay bỏ ngày học và dồn bài tới khuya.',
        bc: [
          { so: '5/14', chu: 'ngày con <b>không học</b>.' },
          { so: '4', chu: 'ngày con <b>dồn bài sau 23:00</b>.' },
          { so: '6', chu: 'lần con <b>chưa làm sau lời nhắc 21:00</b>.' }
        ],
        nen: ['Nhắc nhẹ lúc 20:00, đừng đợi tới khuya.', 'Cùng con xem lại lịch tuần: tối nào bận thì làm sớm hơn.']
      }
    },
    ca: {
      ten: 'Ester – Lipid', luc: '19:30 · Thứ Năm 29/10', soCau: 28, phut: 40,
      diem: '5,25', doi: '−0,5', len: false,
      xu: [{ n: '08/10', d: 6.0 }, { n: '15/10', d: 5.75 }, { n: '19/10', d: 5.5 }, { n: '22/10', d: 5.75 }, { n: '29/10', d: 5.25 }],
      phan: [
        { ten: 'Phần I · Trắc nghiệm', dat: 12, tong: 18, don: 'câu' },
        { ten: 'Phần II · Đúng – sai', dat: 9, tong: 16, don: 'ý' },
        { ten: 'Phần III · Trả lời ngắn', dat: 1, tong: 6, don: 'câu' }
      ],
      sai: [
        { ten: 'Đốt cháy ester', so: 4, on: 'Chưa ôn lại' },
        { ten: 'Chỉ số acid của chất béo', so: 3, on: 'Đã ôn lại 1 câu' },
        { ten: 'Đồng phân ester', so: 2, on: 'Đến lịch ôn lại thứ Hai' }
      ],
      loi: 'Con làm xong sau 18 phút, còn 22 phút không dùng. Cần đọc kỹ đề hơn.',
      tbLop: '6,4'
    },
    yeu: [
      { ten: 'Đốt cháy ester', dung: 3, lam: 10 },
      { ten: 'Chỉ số acid của chất béo', dung: 2, lam: 8 },
      { ten: 'Carbohydrate', dung: 4, lam: 11 }
    ],
    sap: [
      { loai: 'btvn', thu: 'Thứ Hai', ngay: '02/11', ten: 'Hạn nộp BTVN', phu: '23:59 · còn 30 câu' },
      { loai: 'ca', thu: 'Thứ Ba', ngay: '03/11', ten: 'Ca kiểm tra', phu: '19:30 · Amine – Amino acid' }
    ],
    thay: { luc: '20:15 hôm qua', loi: 'Huy làm nhanh quá, nhiều câu chọn khi chưa đọc hết đề. Anh chị nhắc con đọc hết đề rồi mới chọn nhé.' },
    nen: [
      { dong: 'Tối nay', chu: 'ngồi cạnh con 15 phút đầu, nhắc đọc hết đề rồi mới chọn.' },
      { dong: 'Không mắng', chu: 'hỏi con câu nào khó nhất, con nghĩ thế nào.' },
      { dong: 'Thống nhất', chu: 'một giờ học cố định mỗi tối, ví dụ 20:00.' }
    ]
  }
}
