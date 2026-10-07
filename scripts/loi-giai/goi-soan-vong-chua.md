# Soạn vòng chữa từ một câu gốc thật

Đọc `nguon.json`. `cau` là câu gốc đang dùng, `daCo` là học liệu bổ trợ để tham khảo. Đừng giả định học liệu cũ đủ cho vòng chữa mới. Giữ đúng qid/version; không soạn tự luận. Nếu nguồn có hình, đọc hình và giữ hình cần thiết kèm alt; không đoán hình không truy cập được. Thiếu dữ kiện thì báo lỗi, không điền đáp án bừa.

Xuất `hoc-lieu.json`: `{schemaVersion:1,qidGoc:cau.qid,contentVersion:cau.version,buoc:[],banGhepBai:[],banKiemChung:[]}`.

Tách 1–8 bước theo cách giải thật; mỗi bước vừa sức trong khoảng 1–2 phút. Mỗi bước có:

- `id`, `thuTu` bắt đầu 0, `tieuDe` gần gũi, `viKyNang` là các kỹ năng cụ thể; phần II ghi `yApDung` (0–3) để đúng từng ý. **`tienQuyet` — bắt buộc là MẢNG chuỗi** (không phải chuỗi đơn, không phải null): bước 0 dùng `[]`; bước 1 trở đi dùng `["id_buoc_truoc"]`. Ví dụ: bước 0 → `"tienQuyet":[]`; bước 1 → `"tienQuyet":["b0"]`; bước 2 → `"tienQuyet":["b1"]`.
- `chanDoan`: tối thiểu 1 câu nhỏ định vị bước mắc; `phanBiet`: tối thiểu 1 câu kiểm lại giả thuyết sai; `kiemLai`: tối thiểu 2 câu mới độc lập. Các câu phải đủ dữ kiện và kiểm đúng kỹ năng bước này.
- `hoTro`: 3 mức `{muc:1|2|3,noiDung}`: gợi ý nhìn dữ kiện → giải thích vì sao → ví dụ có số/chất khác, dẫn tự làm. Không tiết lộ đáp án của câu kiểm sắp xuất hiện.
- `loiThuongGap`: `{ma,loai,tinHieu,probeXacNhan}`; `loai` là doc_de/kien_thuc/phuong_phap/tinh_toan. Một đáp án sai chỉ là giả thuyết; câu xác nhận phải phân biệt với đoán, thiếu đọc hoặc lỗi tính.
- `hieuBuoc`: `mucTieu`, `yNghiaDaiLuong` (đơn vị và ý nghĩa), `viSaoCanBuoc`, `dieuKienApDung`, `noiVoiBuocSau`. Viết như đang giúp một em cụ thể, không trách móc và không khen chung chung. **`doiChieu` — quy tắc bắt buộc:** mỗi phần tử phải có đủ 6 trường với chuỗi không rỗng: `maLoi` (mã lỗi), `cachNghiCu` (cách nghĩ dẫn đến sai), `diemLech` (điểm khác với cách đúng), `heQua` (hậu quả nếu không sửa), `cachDung` (hành động sửa ngay được); và `probeXacNhan` là một ProbeRef có `dapAnSai` là mảng ít nhất 1 mã đáp án sai — không được để mảng rỗng. `kiemLyDo`: ít nhất 2 câu kiểu `chon_ly_do`, kiểm hiểu vì sao; `chuyenGiao`: ít nhất 2 câu mới áp dụng trong tình huống khác. Có thể thêm `bieuDien:{loai:cong_thuc|so_do|bang|don_vi,noiDung,moTaVanBan,hienSau:nop_chan_doan|xin_ho_tro}`.

Mọi câu nhỏ/biến thể là `ProbeRef`:

```
{qid:"mã riêng tối đa 120 ký tự",phienBan:"v1",phan:"I|II|III",kyNang:["kỹ năng"],laTuongDuong:false,
 dapAnSai:["mã lựa chọn gây ra lỗi xác định"],
 noiDungTrucTiep:{hoi:"đề tự đủ dữ kiện",kieu:"so|chon|chon_ly_do|ds",dapAn:"đáp án",
 luaChon:[{ky:"A",noi:"..."},{ky:"B",noi:"..."}],donVi:"...",bang:[["..."]],y:["4 ý nếu cần"]}}
```

Chỉ điền các trường thích hợp. Trắc nghiệm đáp án A–D, tối đa 4 lựa chọn là tốt nhất; số dùng dấu phẩy và làm tròn rõ; Đ/S là D/S hoặc chuỗi 4 chữ kèm đúng 4 ý. Không dùng câu hỏi tự thuật “em sai ở đâu” làm bằng chứng đạt kỹ năng. `dapAnSai` chỉ cho câu xác nhận giả thuyết và phải trùng lựa chọn sai có ý nghĩa; không gắn cho mọi đáp án sai.

`banGhepBai` có ít nhất 2 bản, `loai:"ghep_bai"`; `banKiemChung` có ít nhất 2 bản, `loai:"kiem_chung"`. Tất cả `laTuongDuong:true`, giữ đúng phần và độ khó của câu gốc: I là 4 phương án, II là 4 ý, III trả lời số. **Quy tắc `kyNang` bắt buộc:** trường `kyNang` của MỖI bản toàn bài phải là HỢP ĐẦY ĐỦ của mọi `viKyNang` từ TẤT CẢ các bước — không được bỏ sót một kỹ năng nào. Cách làm đúng: gộp tất cả `viKyNang` của bước 0, bước 1, bước 2,… thành một tập (loại trùng), rồi điền nguyên tập đó vào `kyNang` của từng bản toàn bài. Câu kiểm chứng độc lập phải mới cả số/chất/tình huống so với câu gốc, câu ghép và mọi câu nhỏ. Đổi mã hoặc đảo phương án của đề cũ không thành đề mới. Không tráo bài phức tạp thành một câu nền dễ hơn để ghi đạt.

**Kiểm tra bắt buộc trước khi viết mỗi bản ghép/kiểm chứng — thiếu một tiêu chí thì thay bản khác:**
1. **Hoá học hợp lệ**: mọi phản ứng, muối, chất trung gian trong bản này phải thực sự tồn tại (ví dụ: (NH₄)₃PO₄ không bền trong dd nước; không dùng).
2. **Cùng số bước tính**: cùng số bước tính toán với câu gốc — không đơn giản hóa hay thêm bước phụ.
3. **Giữ nguyên bẫy/trap**: nếu câu gốc có bẫy (ảnh IR, hệ số phản ứng ẩn, hiệu suất không rõ, đơn vị khác thường…), bản thay thế phải giữ đúng dạng bẫy tương tự — không bỏ bẫy để câu dễ hơn.
4. **Cùng kỹ năng từng bước**: mỗi bước trong bản này kiểm đúng kỹ năng `viKyNang` tương ứng như câu gốc — không chuyển sang cơ chế hoá học khác loại.

Không đưa đáp án vào đề hay gọi học liệu là “đã thầy duyệt”. Không tự tạo hồ sơ kiểm. Cổng ngoài sẽ giải mù từng câu và soát chuyên môn riêng; chỉ bộ đủ điều kiện mới được nạp.
