# Soạn vòng chữa từ một câu gốc thật

Đọc `nguon.json`. `cau` là câu gốc đang dùng, `daCo` là học liệu bổ trợ để tham khảo. Đừng giả định học liệu cũ đủ cho vòng chữa mới. Giữ đúng qid/version; không soạn tự luận. Nếu nguồn có hình, đọc hình và giữ hình cần thiết kèm alt; không đoán hình không truy cập được. Thiếu dữ kiện thì báo lỗi, không điền đáp án bừa.

Xuất `hoc-lieu.json`: `{schemaVersion:1,qidGoc:cau.qid,contentVersion:cau.version,buoc:[],banGhepBai:[],banKiemChung:[]}`.

Tách 1–8 bước theo cách giải thật; mỗi bước vừa sức trong khoảng 1–2 phút. Mỗi bước có:

- `id`, `thuTu` bắt đầu 0, `tieuDe` gần gũi, `tienQuyet` là id bước trước, `viKyNang` là các kỹ năng cụ thể; phần II ghi `yApDung` (0–3) để đúng từng ý.
- `chanDoan`: tối thiểu 1 câu nhỏ định vị bước mắc; `phanBiet`: tối thiểu 1 câu kiểm lại giả thuyết sai; `kiemLai`: tối thiểu 2 câu mới độc lập. Các câu phải đủ dữ kiện và kiểm đúng kỹ năng bước này.
- `hoTro`: 3 mức `{muc:1|2|3,noiDung}`: gợi ý nhìn dữ kiện → giải thích vì sao → ví dụ có số/chất khác, dẫn tự làm. Không tiết lộ đáp án của câu kiểm sắp xuất hiện.
- `loiThuongGap`: `{ma,loai,tinHieu,probeXacNhan}`; `loai` là doc_de/kien_thuc/phuong_phap/tinh_toan. Một đáp án sai chỉ là giả thuyết; câu xác nhận phải phân biệt với đoán, thiếu đọc hoặc lỗi tính.
- `hieuBuoc`: `mucTieu`, `yNghiaDaiLuong` (đơn vị và ý nghĩa), `viSaoCanBuoc`, `dieuKienApDung`, `noiVoiBuocSau`. Viết như đang giúp một em cụ thể, không trách móc và không khen chung chung. `doiChieu` gồm `{maLoi,probeXacNhan,cachNghiCu,diemLech,heQua,cachDung}`; nêu rõ cách nghĩ dẫn đến sai và một hành động sửa được ngay. `kiemLyDo`: ít nhất 2 câu kiểu `chon_ly_do`, kiểm hiểu vì sao; `chuyenGiao`: ít nhất 2 câu mới áp dụng trong tình huống khác. Có thể thêm `bieuDien:{loai:cong_thuc|so_do|bang|don_vi,noiDung,moTaVanBan,hienSau:nop_chan_doan|xin_ho_tro}`.

**Bắt buộc với từng `doiChieu`:** `maLoi`, `cachNghiCu`, `diemLech`, `heQua`, `cachDung` đều là chuỗi không rỗng. `probeXacNhan` là một `ProbeRef` đầy đủ, có `dapAnSai` là mảng ít nhất một đáp án sai cụ thể để xác nhận chính giả thuyết này. Với câu chọn, các mã đó phải có trong `luaChon` và khác đáp án đúng. Với câu số/Đ–S, điền kết quả sai cụ thể, chấm được và phản ánh cách nghĩ đang kiểm. Không đặt `dapAnSai` bên ngoài `probeXacNhan`, không dùng đáp án đúng hoặc nhiễu vô nghĩa. Nếu chưa có câu phân biệt được nguyên nhân, sửa giả thuyết và câu xác nhận trước khi hoàn thành.

Mọi câu nhỏ/biến thể là `ProbeRef`:

```
{qid:"mã riêng tối đa 120 ký tự",phienBan:"v1",phan:"I|II|III",kyNang:["kỹ năng"],laTuongDuong:false,
 dapAnSai:["mã lựa chọn gây ra lỗi xác định"],
 noiDungTrucTiep:{hoi:"đề tự đủ dữ kiện",kieu:"so|chon|chon_ly_do|ds",dapAn:"đáp án",
 luaChon:[{ky:"A",noi:"..."},{ky:"B",noi:"..."}],donVi:"...",bang:[["..."]],y:["4 ý nếu cần"]}}
```

Chỉ điền các trường thích hợp. Trắc nghiệm đáp án A–D, tối đa 4 lựa chọn là tốt nhất; số dùng dấu phẩy và làm tròn rõ; Đ/S là D/S hoặc chuỗi 4 chữ kèm đúng 4 ý. Không dùng câu hỏi tự thuật “em sai ở đâu” làm bằng chứng đạt kỹ năng. `dapAnSai` chỉ cho câu xác nhận giả thuyết và phải trùng lựa chọn sai có ý nghĩa; không gắn cho mọi đáp án sai.

`banGhepBai` có ít nhất 2 bản, `loai:"ghep_bai"`; `banKiemChung` có ít nhất 2 bản, `loai:"kiem_chung"`. Tất cả `laTuongDuong:true`, `kyNang` bao phủ các bước, giữ đúng phần và độ khó của câu gốc: I là 4 phương án, II là 4 ý, III trả lời số. Câu kiểm chứng độc lập phải mới cả số/chất/tình huống so với câu gốc, câu ghép và mọi câu nhỏ. Đổi mã hoặc đảo phương án của đề cũ không thành đề mới. Không tráo bài phức tạp thành một câu nền dễ hơn để ghi đạt.

**Khớp mã kỹ năng:** `kyNang` của MỖI bản ghép và MỖI bản kiểm chứng phải chứa đầy đủ hợp các chuỗi `viKyNang` của TẤT CẢ các bước, giữ nguyên từng mã, loại trùng. Không dùng `id` bước, tên nhóm hoặc mã gần nghĩa để thay. Ví dụ các bước có `viKyNang:["doi_mol"]` và `["chat_gioi_han","hieu_suat"]` thì cả bốn bản toàn bài đều phải có `kyNang:["doi_mol","chat_gioi_han","hieu_suat"]`. Mỗi đề thực sự phải kiểm các kỹ năng đó, không chỉ gắn nhãn cho đủ. Trước khi ghi tệp cuối, soát lại hai quy tắc bắt buộc trên và toàn bộ trường được yêu cầu.

Không đưa đáp án vào đề hay gọi học liệu là “đã thầy duyệt”. Không tự tạo hồ sơ kiểm. Cổng ngoài sẽ giải mù từng câu và soát chuyên môn riêng; chỉ bộ đủ điều kiện mới được nạp.
