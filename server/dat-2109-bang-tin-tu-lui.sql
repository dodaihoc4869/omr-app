-- LÙI mốc bảng tin của thầy (server/dat-2109-bang-tin-tu.sql): xoá ĐÚNG khoá `bang_tin_tu` (khoá này chỉ do tệp kia tạo). Vắng khoá ⇒ `/gv/bang-tin` tính từ 00:00 hôm nay (tuDangAp = false).
DELETE FROM cau_hinh WHERE khoa = 'bang_tin_tu';
