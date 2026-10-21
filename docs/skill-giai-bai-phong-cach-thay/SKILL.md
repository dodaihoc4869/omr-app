---
name: giai-bai-phong-cach-thay
description: "Giải bài Hoá theo cách nghĩ và dẫn dắt của Thầy Đỗ Đại Học (chắt từ 314 video bài giảng): phong cách, kĩ thuật giải, bài mẫu. Dùng khi giải bài, viết lời giải. Đáp án phải tự tính và kiểm."
---

# Giải bài theo phong cách tư duy của Thầy Đỗ Đại Học

Thầy 20/10/2026: "Tôi muốn bộ não học hỏi toàn bộ video bài giảng của tôi để giải bài cho học sinh theo phong cách tư duy của tôi giống nhất có thể."
Skill này đóng gói những gì chắt được từ **323 video / 158 giờ** của kênh YouTube "ĐỖ ĐẠI HỌC" (13 danh sách phát: Bài giảng, Tu luyện, Luyện đề, Ôn tập) để nạp cho bộ não khi giải bài Hoá.

## Khi nào dùng
- Giải bài Hoá (THPT, chương trình 2018) cho học sinh qua Zalo hoặc viết trang lời giải HTML: muốn đúng cách nghĩ và cách dẫn dắt của Thầy.
- Học sinh hỏi "dạng này Thầy làm sao", "mẹo nhanh", "chỗ hay sai".
- KHÔNG dùng cho tin nhắn thường (lịch, app, chuyện lớp), cho đáp án số: đáp án luôn do bộ não tự tính và kiểm.

## Quy trình
> Bản đóng gói cho tài khoản Claude: các lệnh có đường dẫn `/Volumes/SSD NGOÀI/...` chỉ chạy được trên Mac của Thầy (phiên Claude Code). Phiên khác chỉ dùng `references/phong-cach-giai.md` và `references/ky-thuat.md` (tìm theo từ khoá đề).

1. Đọc `references/phong-cach-giai.md` (bản cô đọng cách Thầy nghĩ, nói; văn phòng đã nạp sẵn vào lời dặn giải bài).
2. Tìm kĩ thuật / bài mẫu Thầy đã giảng gần đề:
   ```
   cd "/Volumes/SSD NGOÀI/Javis-DDH/app" && .venv/bin/python -m ddh_office.tro_giang.bai_giang "<chép đề bài>"
   ```
   Ra: kĩ thuật Thầy dùng (nhận ra, các bước nghĩ, mẹo, chỗ hay sai, câu dẫn), bài mẫu Thầy đã giải, và (khi khớp mạnh) đoạn bài giảng thô kèm mã video + phút. Không khớp thì in "(không có ... khớp)": giải theo phong cách chung, đừng ép.
3. Mục lục 3.377 kĩ thuật và 3.188 bài mẫu theo từng video: `references/ky-thuat.md` (grep được). Muốn xem nguyên văn một đoạn Thầy giảng: `/Volumes/SSD NGOÀI/hoc_tu_youtube/kenh-thay-do-dai-hoc/txt/<mã video>.txt` (có mốc mm:ss).
4. Giải theo thứ tự nghĩ của Thầy: nhận dạng → chọn công cụ (bảo toàn, tỉ lệ hệ số, nhẩm) → thay số → đáp án → kiểm bằng cách khác. Tin Zalo ngắn, giữ 1-2 câu dẫn đặc trưng ("Các em nhìn vào đây", "Vậy nghĩa là gì?"), giọng nhắn tin vẫn theo skill giong-thay.
5. Đáp án và phép tính: tự tính, tự kiểm. Số trong phần "Thầy đã giảng" chỉ để học cách làm (phụ đề tự động hay nghe sai).

## Giới hạn (khai thẳng)
- Nguồn là phụ đề tự động tiếng Việt của YouTube (318/325 video có phụ đề tự động; 5 bài Tu luyện chưa có phụ đề đã chép lời bằng Whisper chạy cục bộ; 2 bài nhạc không phải bài giảng nên bỏ). Có lỗi nghe tên chất, số; không có hình, bảng, nét viết trên bảng, nên câu "ở đây này" không đọc ra vị trí.
- Kĩ thuật và bài mẫu được chắt từ TOÀN BỘ phụ đề (20/10/2026: mỗi video / phần <= 32k chữ đưa nguyên văn cho bộ não ChatGPT; bản cũ chỉ nhặt ~11% chữ, 36 kĩ thuật). Phụ đề tự động nên chi tiết số liệu có thể sai: chỉ lấy cách nghĩ.
- Khớp đề với kĩ thuật là khớp từ khoá có trọng số hiếm (cụm chung như "khối lượng riêng" bị giảm điểm), ngưỡng 8,0 cho kĩ thuật và 10,0 cho bài mẫu: chỉ đưa khi khớp mạnh, khoảng 30% đề trong kho có kĩ thuật khớp; đề không khớp vẫn giải bình thường.

## Dữ liệu và việc lặp lại
- Kho chữ tìm kiếm: `/Volumes/SSD NGOÀI/Javis-DDH/state/bai-giang/corpus.sqlite3` (SQLite FTS5, 7.952 mảnh); chỉ mục kĩ thuật: `.../phuong-phap.json`.
- Gốc: `/Volumes/SSD NGOÀI/hoc_tu_youtube/kenh-thay-do-dai-hoc/` (SO-VIEC.md, GITHUB-QUET.md, cong-cu/*). Video mới: `cong-cu/tai-phu-de.sh` → `dung_corpus.py` → `chat_day_du.py` (python của app, nguyên văn từng video, chạy lại được) → `gom_phuong_phap.py` → `dung_phong_cach.py` → `xuat_skill.py`. Chạy nhẹ, chạy lại được.
- Văn phòng nạp trong `app/ddh_office/tro_giang/bai_giang.py` + `giai_bai.py` (lời dặn phong cách + khối "Thầy đã giảng dạng này" cho lượt giải chính, không cho lượt kiểm độc lập).
- Nguồn GitHub đã soát: `references/nguon-github.md`.
