# Báo cáo Code 2 — rút câu và Đoàn Hộ Tống, 23/09/2026

> Cập nhật tích hợp: đã chặn bằng chứng qid trùng giữa đề; làm sai câu khó không nâng bậc khởi đầu; câu trùm còn bị chặn theo mức vừa sức thấp nhất của đội. Xem [bản tổng hợp mới nhất](bao-cao-hoan-thien-3-app-2309.md). Các số đo và giới hạn bên dưới ghi tại lượt bàn giao ban đầu.

## Kết quả

Đảo và Đoàn nay lấy kho theo bằng chứng của **chính học sinh** từ ca đã công bố, hồ sơ câu hoặc sổ học cá nhân (`server/src/game-v2.ts:85,140`; `server/src/game-v2-bank.ts:185`; `src/game/than-thu-v2/core.ts:46`). Một câu khác chỉ được mở khi cùng mã dạng và **mọi** mã kiến thức nền đều có trong bằng chứng của em. Câu trùng qid nhưng khác `content_group` không được coi là câu em đã học. Kho lớp không còn mở phạm vi game.

Đoàn ưu tiên câu đã tới lịch ôn theo `nam_kt_cau.moc_on_ke`, kế tiếp là câu chưa gặp; câu đã làm hôm nay không quay lại và câu vừa đúng phải chờ tới hạn (`server/src/game-v2.ts:164`; `server/src/game-v2-ho-so.ts:42`; `src/game/than-thu-v2/core.ts:156`). Bộ lọc gom lần gặp từ sổ học và game theo `content_group`; câu sai ba lần được đổi sang câu khác cùng dạng. Mỗi lượt chống trùng qid và nhóm nội dung. Không nới sang câu chưa học để lấp đủ sáu: API trả `soCauThieu`, màn Đoàn báo số thiếu và hiệp không có câu cho em cổ vũ (`server/src/game-v2.ts:185`; `src/game/than-thu-v2/DoanTran.tsx:211`).

Câu trùm Phần II chỉ ra khi **mọi** thành viên đều có bằng chứng về cùng dạng và tất cả kiến thức nền; độ yếu để xếp hạng lấy riêng các thành viên, không lấy cả lớp (`server/src/game-v2-doan.ts:186`). Đoàn không tăng một bậc độ khó để lấp suất; độ khó của từng em vẫn lấy từ kết quả đã làm (`src/game/than-thu-v2/core.ts:64,156`). Không thay công thức chấm, sát thương, EXP, vé hay cấp thú.

## Công thức đang chạy theo chế độ

| Chế độ | Phạm vi và cách rút | Lặp / độ khó | Thời gian |
|---|---|---|---|
| Đảo lượt mới | `readScope(sbd)` → lọc đủ kiến thức nền cá nhân → `chooseLuotMoi` (`game-v2.ts:85–132`) | Suất yếu/tới hạn/mới/thử thách; câu đúng nghỉ đến lịch, sai hôm nay chặn; thử thách tối đa bậc hiện tại + 1 (`core.ts:156–239`) | Không có hạn từng câu ở đường này. |
| Đoàn câu cá nhân | Cùng phạm vi cá nhân, chỉ Phần I/III; ưu tiên qid tới hạn, câu mới, rồi câu cũ đã đủ khoảng cách (`game-v2.ts:140–185`) | Mức câu không vượt bậc của em; ít câu thì trả ít câu và báo thiếu. | Phần I: Biết 90, Hiểu 120, Vận dụng 150 giây. Phần III: 120/150/180 giây. Cả đội dùng mức cao nhất của các câu trong hiệp (`doan-core.ts:127`, `game-v2-doan.ts:100`). |
| Đoàn trùm | Câu Phần II chung có dạng và kiến thức nền của mọi thành viên (`game-v2-doan.ts:186–252`) | Chặn câu bảo vệ, BTVN chưa nộp, câu hôm nay, câu cá nhân; ưu tiên chưa ai thấy, không trùng giữa hai trùm. | 180 giây; hạn và số còn lại cùng dùng `giayHiepPhong` trên máy chủ (`game-v2-doan.ts:100,321`). |
| Tiếp sức Đoàn | Giữ câu của người nhận; chỉ gửi thẻ gợi ý qua đường máy chủ (`game-v2-doan.ts:386–403,491–520`) | Câu có trợ giúp không thành bằng chứng học độc lập; không thay rút câu/EXP. | Dùng đồng hồ chung của hiệp. |
| Võ đài/Linh Tâm cũ | `allowed` + `chooseSessionWithRoles` trên bằng chứng cá nhân (`game-v2.ts:249–276`; `core.ts:36,80`) | Đường cũ xếp câu chưa gặp, câu yếu/tới hạn, có thử thách +1; không thuộc thay đổi chính của Đoàn. | Luật phòng riêng, không dùng đồng hồ Đoàn. |

Các nhịp ôn cá nhân nay được dựng bằng adapter FSRS-6 của nhánh `ho-so-nam-kt` do agent FSRS phụ trách. Selector game đọc `moc_on_ke` của hồ sơ; câu từng đúng được chọn khi lịch báo tới hạn dù chưa đủ 30 ngày. Chi tiết thuật toán, cấu hình và giới hạn ở `docs/bao-cao-fsrs-2309.md`.

## Kiểm chứng

- `npx vitest run tests/game-pham-vi-rut-cau-2309.test.ts tests/doan-rut-cau-moi-2109.test.ts tests/game-v2-bank-pool-2109.test.ts tests/doan-core.test.ts tests/than-thu-kho-cau-hoi.test.ts`: **92/92 đạt**. Fixture 21/09 được thêm bằng chứng học của đúng em; kỳ vọng lấp sáu bằng câu vừa đúng được sửa theo chính sách giãn cách.
- `npx tsc -b --pretty false` và `git diff --check`: đạt.
- Thử bộ thuần 15.000 câu, chọn sáu câu và lọc phạm vi trong **161 ms** trên máy cục bộ; không truy vấn theo từng câu. Đệm kho nhẹ theo dạng và nạp đầy đủ theo lô vẫn ở `game-v2-bank.ts`; đây không phải số đo D1 production.

## Giới hạn cần theo dõi

- `content_group` hiện băm thân câu đã gộp khoảng trắng cùng các phương án; phương án biến thể trình bày có thể chưa cùng nhóm. FSRS lưu state theo qid, chưa gộp qid tương đương thành một thẻ ôn.
- Kho ca/sổ cũ có qid trùng giữa hai đề nhưng nội dung khác vẫn cần đối chiếu nguồn đề khi dựng evidence trong `readScope`; bộ lọc mới chặn sai lệch khi metadata `group` đã đúng, chưa thay cấu trúc chỉ mục lịch sử. Nên đo trường hợp này trên dữ liệu thật trước khi mở rộng kho.
- Hàm lõi `giayCuaHiep(hiep)` không truyền câu còn trả 40/60 giây để giữ tương thích phép gọi cũ; đường phòng đang chạy luôn truyền danh sách câu và dùng 90–180 giây. Không có thay đổi dữ liệu thật hay deploy trong nhánh Code 2.
