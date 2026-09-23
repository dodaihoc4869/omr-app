# RV07 — ánh xạ điều khoản §7.2 → hàm/route thật → test/bằng chứng

Rà `6700bbe` theo `RA-SOAT-CA-NHAN-HOA-02.md` (RV07 OPEN). Bản sửa: commit trong lượt này (`NV07` = nối dữ liệu thật).
Cột “Nguồn thật” ghi ĐÚNG nơi đọc; ô nào còn thiếu thì ghi **THIẾU**, không tô xanh.

| # | Điều khoản §7.2 / RV07 | Hàm/route THẬT | Nguồn dữ liệu THẬT | Test / bằng chứng | Trạng thái |
|---|---|---|---|---|---|
| 1 | `reviewNeed` dùng **khoảng ôn thật** `intervalSeconds` | `docKhoangOnTheoNhom` → `xepLuotTheoChinhSach` (`intervalMs`) | `su_kien_hoc` (lần trả lời CUỐI của nhóm) + mốc đến hạn trong hồ sơ; sàn 1 ngày | `cnh-1-0-bo-chon-that-rv07` ca “1 ngày vs 30 ngày” + ca đọc D1 | **NỐI XONG** (khoảng chỉ có cho nhóm CÓ bằng chứng; nhóm thiếu ⇒ fallback sàn 1 ngày — ghi rõ) |
| 2 | `transferValue`: family đã biết/đã gặp + **cơ hội server cấp** + content_group mới | `docFamilyDaGap` + `transferChoPhep` → `chamTransferValue` | `su_kien_hoc ⋈ game_v2_question."$.family"` (nhãn kho, đọc bằng `SQL_NHAN_FAMILY`); cơ hội do nơi gọi cấp | ca “có cơ hội: đã gặp = 1 · mới = 0,5 · không cơ hội = 0”; ca “chưa gắn family ⇒ 0” | **NỐI XONG (một phần)** — *nhãn “family đã DUYỆT”* chưa có bảng/nguồn ⇒ hiện coi như nhãn kho là đã duyệt; **THIẾU**: hàng đợi duyệt nhãn của thầy |
| 3 | `plan_version` THẬT trong khoá hash `student\|day\|plan_version\|qid\|version` | `phienBanKeHoach` (từ `docNganSachConLai`) → `khoaHashSap` | `ke_hoach_ngay.phien_ban` | ca “khoá mang phiên bản thật”; ca replay cùng version ổn định | **NỐI XONG** (hai đường game truyền `ns?.phienBanKeHoach`; vắng ⇒ `PHIEN_BAN_KE_HOACH`, không còn 0) |
| 4a | `coverage` = số task cùng skill **cả plan** | `docCoverageTheoPlan` → `soTaskCungSkillTrongPlan` | `ke_hoach_ngay.viec_json` (qid từng việc) + `su_kien_hoc` hôm nay + `giu_cho` hiệu lực | ca “3 task trong plan ⇒ coverage 0,25” + ca đọc D1 | **NỐI XONG cho việc CÓ `chiTiet.qid`**; **THIẾU**: việc BTVN/Mom không mang qid trong kế hoạch nên chưa đếm được (ghi rõ) |
| 4b | `repairNeed` theo **kỹ năng** (không suy từ một câu) | `docRepairTheoKyNang` (P03 `skill_snapshot`) → `trangThaiDot` | `skill_snapshot.episode_state` (cần `nang_luc_v1` BẬT để dựng) | ca “đợt kỹ năng ⇒ repairNeed 1 dù hồ sơ câu trống” + ca đọc D1 | **NỐI XONG** (ưu tiên kỹ năng; thiếu ⇒ mới dùng `nam_kt_cau`) |
| 5 | `fatigue`/`coverage` tính lại sau mỗi lựa chọn, không chia score cho thời gian | `chonCauChoLuot` vòng lặp greedy → `xepLuotTheoChinhSach` | `daChon` thật của lượt + plan | `cnh-1-0-bo-chon-that` (RV05a/b/c) | **NỐI XONG** |
| 6 | Hard filter §7.1 đúng thứ tự (độ khó → lặp/family → điểm → ngân sách → reserve) | `chonCauChoLuot` | hồ sơ/kho/`giu_cho`/kế hoạch | `cnh-1-0-bo-chon-that`, `cnh-1-0-giu-cho`, `cnh-1-0-ngan-sach-luot-t09` | **NỐI XONG** |
| 7 | “Rà MỌI kênh và đường phát câu” | game (`/game-v2/start` 2 đường) ✓ · thử thách ✓ (ngân sách chung) · **kế hoạch ngày** (`ke-hoach-ngay-d1.ts`) **chưa** dùng bộ chọn này · `/hs/cau-theo-qid` (ôn) phục vụ theo qid kế hoạch | — | `hop-dong-chung` (T42 map) | **THIẾU**: bộ chọn kế hoạch ngày + đường ôn chưa đi qua `chonCauChoLuot` (P05 còn lại) |

## Ca nghiệm thu của giám sát → test tương ứng

| Ca | Test | Kết quả |
|---|---|---|
| Hai em cùng lớp khác hồ sơ ⇒ khác tập đủ điều kiện | `cnh-1-0-bo-chon-that-rv07` ca pipeline §7.1 (em mức 2 nhận câu Vận dụng; em mức 0 bị `DIFFICULTY_LIMIT`) | xanh |
| interval 1 ngày vs 30 ngày | cùng file, ca `reviewNeed` (1 vs 0,3778) | xanh |
| Đảo thứ tự pool | `cnh-1-0-bo-chon-that` RV05a + `cnh-1-0-bo-chon-that-rv07` ca replay | xanh |
| Replay cùng version | ca “cùng phiên bản ⇒ cùng thứ tự” | xanh |
| Sai cùng điểm kiến thức nhiều lần ⇒ nhánh dạy lại | `cnh-1-0-bo-chon-that` (ho so per-câu) + ca `docRepairTheoKyNang` | xanh |
| “Rà mọi kênh” | còn thiếu kế hoạch ngày/đường ôn (mục 7 ở trên) | **THIẾU (đã ghi)** |

## Giới hạn đang chờ dữ liệu/pha khác (KHÔNG tự nới luật)

- **Nhãn “family đã duyệt”**: chưa có nguồn ⇒ `transferValue` hiện dựa trên nhãn kho + lịch sử đã gặp; không bịa trạng thái duyệt.
- **Cơ hội transfer do server cấp**: hiện là tham số `transferChoPhep` của bộ chọn; nơi cấp (kế hoạch/P06) chưa nối ⇒ mặc định rỗng ⇒ `transferValue = 0` (đúng tinh thần “0 nếu không có cơ hội”).
- **Khoảng ôn**: chỉ có cho nhóm đã có bằng chứng trong sổ; còn lại fallback sàn 1 ngày — coi là FALLBACK, không phải cá nhân hóa đầy đủ.
- **Việc kế hoạch không mang qid** (BTVN/Mom) chưa vào `coverage` — cần P06/P07 cấp qid cho việc.
- **RV06 phần còn lại**: mới có bằng chứng runtime D1 cho nhóm giữ chỗ; chưa chạy bộ chọn/Đoàn trên workerd.
