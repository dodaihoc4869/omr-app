# Xoá báo cáo ca CŨ của học sinh — 28/09/2026

Thầy cho phép (nguyên văn 28/09): "cho xoá bản báo cáo cũ". Nhánh `xoa-bao-cao-cu` (từ `gop-lich-su-ca`).

## Tệp đã xoá / sửa trong `src/`

| Tệp | Việc | Lý do |
|---|---|---|
| `src/components/BaoCaoCaThiHocSinhModal.tsx` | XOÁ | Không còn nơi gọi: mọi lối mở báo cáo ca của em đi qua `ca-thi/BaoCaoCaCuaEm` → `BaoCaoChiTiet` chế độ em. |
| `src/lib/goi-bao-cao.ts` (`goiBaiThi`, cùng kiểu `ThongTinBaiThiHocSinh` nó import) | XOÁ | Chỉ modal cũ và một test dùng. Kiểu `ThongTinBaiThiHocSinh` không còn ai dùng nên không cần chuyển đi đâu. |
| `DongDemCau`, `KhoiCauSai`, `KhoiBaPhan`, `TheTienBo`, `ModalKhacPhucCauSai`, `danh-gia-bai` | GIỮ | Còn dùng ở báo cáo phụ huynh, game, khắc phục (đã grep từng tệp). |
| `scripts/sinh-m3-tuong-thich.mjs` | Bỏ modal cũ khỏi `TEP`, thêm `LOP_GIU_LAI` | Tệp sinh `m3-tuong-thich.css` mất 25 luật màu nếu chỉ bỏ modal; nhiều màn khác trong vỏ `.m3` (cổng HS, game thần thú, xác nhận nộp…) vẫn dùng các lớp ấy ⇒ giữ nguyên, CSS chỉ đổi dòng đầu (phạm vi quét) và thứ tự một luật ghép. |
| `src/components/ca-thi/BaoCaoCaCuaEm.tsx` + `BaoCaoChiTiet.tsx` | SỬA bản mới | Bản mới vi phạm luật "cấm nuốt lỗi im lặng": lịch sử hỏng ⇒ hiện "Ca này chưa có điểm đã công bố"; tải câu hỏng ⇒ hiện "Em đúng trọn mọi câu của ca này" (sai sự thật). Nay giữ lý do (`loiEm`, `loiCauEm`) và hiện ra; mã nội bộ máy chủ (VD `MAY_CHU_CHUA_CO_LENH`) và lỗi mạng tiếng Anh không lên màn; chưa có bảng chấm thì "Chưa có bảng chấm từng câu của em." thay vì "đúng trọn"; lỗi có nút "Thử lại" (chuẩn giao diện mục 2: lý do thật + thử lại). |
| `src/components/BaoCaoCaThiPhuHuynhModal.tsx` | Sửa một dòng chú thích | Trỏ về bản mới thay vì tệp đã xoá. |

## Bảng xử lý từng test

Dùng chung: `tests/_bao-cao-em-moi.tsx` (nguồn ba tệp bản mới + hàm vẽ `BaoCaoChiTiet` chế độ em). Luật cần dữ liệu máy chủ giả: tệp mới `tests/bao-cao-em-moi-luat-cu-2809.test.tsx`.

| Test | Luật | Chuyển / xoá | Lý do |
|---|---|---|---|
| `dem-cau-bao-cao-1409` | Số câu chỉ số thật, cấm suy từ điểm, chưa chấm ⇒ null | CHUYỂN | Soi nguồn bản mới + `baoCaoCuaEm` chưa chấm ⇒ `dung/tongCau` null; lịch sử thiếu số ⇒ đếm từ bảng chấm thật. |
| `dem-cau-bao-cao-1409` | Nút mở bài đã nộp không gọi là "Mở lại bài thi" | CHUYỂN | Bản mới: "Xem đề và lời giải cả ca". |
| `dong-nhat-bao-cao-1409` | Một ca một bộ số ở mọi app (Test4: 12 câu cần khắc phục, không phải 10) | CHUYỂN | `baoCaoCuaEm(gói máy chủ, bảng chấm)` so với `demKetQua` của máy thầy: tổng câu, đúng, đúng một phần, số câu cần chữa. `goiBaiThi` đã xoá. |
| `dong-nhat-bao-cao-1409` | Khắc phục gộp bỏ trống + phần II chưa trọn | CHUYỂN | Nút "Làm lại {n} câu cần chữa" đếm mọi câu `dungSai !== true`. |
| `dong-nhat-bao-cao-1409` | Không tự dựng lời giải; không khối chữ dài cạnh nút mở đề | CHUYỂN | Bản mới vẽ câu cần chữa bằng `CauCanChua` (khuôn Câu đã làm). |
| `dong-nhat-bao-cao-1409` | Thẻ "Mức tiến bộ", bốn thẻ, `DongCauSai`, `danhGiaBai` ở cổng HS | XOÁ phần HS (giữ phần PH) | Giao diện bản cũ; bản vẽ 28/09 thay bằng "± điểm so với ca trước". Thêm khoá: bản mới không tự vẽ biểu đồ/không tự viết xếp loại. Thêm khoá: tệp cũ + `goi-bao-cao.ts` không còn tồn tại. |
| `an-nhan-nang-luc-hs-ph-2109` | Không nhãn xếp loại / hạng ở màn HS | CHUYỂN | Vẽ bản mới ở 4 mức điểm: không `classify(điểm)`, không "Hạng". |
| `bao-cao-khong-ket-luan-nang-luc-1909` | Không kết luận năng lực từ điểm | CHUYỂN | Soi ba tệp bản mới + vẽ ở 3 mức điểm. |
| `khac-phuc-tren-dien-thoai-1409` | Trao tờ phiếu lên qua `onTaoPhieuXong` | XOÁ | Dây nối riêng của modal cũ; luật "không vòng kín" đã khoá ở bản mới ngay test kế bên. |
| `khac-phuc-khong-co-cau-sai-1509` | Ca không sai câu nào ⇒ không mời làm phiếu trắng; hỏng tải thì nói ra | CHUYỂN | Vẽ bản mới: đúng hết ⇒ không nút; có sai ⇒ "Làm lại 2 câu"; tải câu hỏng ⇒ hiện lý do, không "đúng trọn". |
| `khac-phuc-loc-khoi-2109` | Nơi gọi `ModalKhacPhucCauSai` truyền lớp của em | Bỏ modal cũ khỏi danh sách | Bản mới không mở modal này (nút trả về cổng HS, đã kiểm `lop={auth.lop}`). |
| `khac-phuc-mot-nguon-1409` | Modal khắc phục chỉ dùng ở màn em/PH | Bỏ modal cũ khỏi danh sách | Như trên. |
| `dia-chi-may-chu-mot-nguon-1509` | Báo cáo không canh cửa bằng `scriptUrl`, không tự dựng địa chỉ | CHUYỂN | Soi `BaoCaoCaCuaEm`: gọi thẳng `hsLichSuCaApi/hsCauDaThiApi(scriptUrl…)`, không `fetch`/`layDiaChiMayChu`. |
| `dia-chi-may-chu-mot-nguon-1509` | Cấm nuốt lỗi im lặng | CHUYỂN (sửa bản mới) | Xem mục sửa `BaoCaoCaCuaEm`/`BaoCaoChiTiet` ở trên; kiểm hành vi ở `bao-cao-em-moi-luat-cu-2809`. |
| `tu-ngu-cum4-2109` | Màn HS không "ca thi/bài thi"; mã ca không làm tên | CHUYỂN | Thay modal cũ bằng 4 tệp bản mới trong danh sách quét; bản mới không in mã ca (chặt hơn). |
| `m3-c-hs-modal-1909` (cả tệp) | Lớp M3/gradient/nút "KHẮC PHỤC NGAY" của modal cũ; không chữ "Vòng 1/2/3" | XOÁ tệp, luật chữ BTVN cũ CHUYỂN | Toàn bộ là giao diện modal cũ; luật "không chữ BTVN cũ" chuyển sang `bao-cao-em-moi-luat-cu-2809`. |
| `m3-c-1909` | Phạm vi bộ sinh lớp tương thích | Bỏ modal cũ khỏi danh sách | Kèm `LOP_GIU_LAI` để CSS không mất luật. |
| `chi-tiet-ca-cham-ten-em` | Báo cáo không có thẻ phụ (`extraTabs`) | CHUYỂN | Soi `BaoCaoChiTiet`. |
| `ba-viec-1409-dot2` | Không app nào tự trừ ngược `tongCau - soCauDung` | CHUYỂN | Phủ thêm ba tệp bản mới; ý "dùng chung DongDemCau" chỉ còn cho HS cổng + PH (giao diện bản cũ). |
| `ten-lop-2109`, `hoc-sinh-m3-2109` | `vi.mock` modal cũ | Bỏ dòng mock | Màn Học sinh của thầy không còn import modal cũ. |
| (mới) `bao-cao-em-moi-luat-cu-2809` | Cấm nuốt lỗi; không mã nội bộ; chỉ sau công bố; không lộ em khác; không chữ BTVN cũ | THÊM | Luật cần dữ liệu máy chủ giả, kiểm trên `BaoCaoCaCuaEm` thật. |
