# Quét GitHub: skill / công cụ để học video YouTube (20/10/2026)

Tiêu chí: chạy được bằng đăng nhập sẵn có, KHÔNG khoá API (luật của Thầy), chạy cục bộ trên Mac mini 24 GB.

| Nguồn | Làm gì | Dùng? |
|---|---|---|
| michalparkola/tapestry-skills-for-claude-code (youtube-transcript) | tải phụ đề bằng yt-dlp, thiếu thì Whisper | ĐÃ CÀI từ 19/10 (~/.claude/skills/youtube-transcript); quy trình phụ đề -> Whisper lấy làm khung |
| jalaalrd/video-to-skill | biến video thành skill | ĐÃ CÀI (~/.claude/skills/video-to-skill); khung SKILL.md lấy làm mẫu đóng gói |
| artemchuikin/youtube-skills, ZeroPointRepo/youtube-skills | transcript cho Claude Code / Codex, so sánh cách giảng | tham khảo; không thêm (trùng chức năng, thêm phụ thuộc) |
| zarazhangrui/youtube-to-ebook | cả kênh -> văn bản | tham khảo cách duyệt kênh; đã có yt-dlp --flat-playlist |
| yt-dlp (+ yt-dlp-ejs), Whisper qua mlx-whisper | liệt kê kênh, tải phụ đề / âm thanh, chép lời cục bộ | DÙNG (đã có từ 19/10: .venv-whisper, large-v3-turbo) |
| SQLite FTS5 (có sẵn trong Python) | kho chữ tìm kiếm không cần dịch vụ | DÙNG |

Không repo nào trích "phong cách giảng" thành kho tri thức: lớp này tự dựng (cong-cu/cau_cua_mieng.py + phong-cach-giai.md + bai_giang.py).
