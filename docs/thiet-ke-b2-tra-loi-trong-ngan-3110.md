# B2 — «Trả lời» chạy trong ngăn của em (thiết kế 31/10)

Thuộc `docs/thiet-ke-100k-em-3110.md`. Mục tiêu: `POST /game-v2/answer` mỗi lần còn khoảng **15 câu D1 trong 1 lượt gửi**, thay vì 33–45 câu trong 4–8 lượt gửi hiện nay (số đo `scratchpad/bao-cao-lenh-nong.md` §B5–B7).

## Ý chính
- **D1 vẫn là nguồn chuẩn; ghi vẫn đồng bộ, MỘT lô.**
  - Ngăn em (`NganHocSinh`) giữ bản nhớ mọi thứ lệnh trả lời cần đọc.
  - Lớp gom `gom-d1.ts` (`voiDem`) trả các câu đọc trong danh sách cố định từ bản nhớ này.
  - Mã trả lời `game-v2.ts:gameV2Tho` **không viết lại**: cùng câu đọc thì cùng phản hồi, cùng dòng ghi.
- **Câu chặn đứng đầu lô ghi:** `INSERT … dau_em_kiem … CHECK(ok=1)`.
  - Câu chặn so `dau_em.v/vs` của em, dấu nguồn câu đang chấm (`de:`, `q:`, `d:`), `lop:` và `mua`.
  - Lệch ⇒ cả lô huỷ (chưa ghi gì) ⇒ nạp lại bản nhớ, chạy lại bằng đường cũ.
  - ⇒ Kết quả luôn y hệt.

## Bản nhớ của ngăn
- Lưu trong bộ nhớ và trong SQLite của ngăn, bảng `tt_em`, khoảng 50–300 KB mỗi em.
- Gồm các dòng D1 nguyên xi, nhớ theo câu SQL + tham số:
  - `hoc_sinh` (kể cả mật khẩu), `danh_sach`;
  - hồ sơ + revision, `game_v2_scope`;
  - phiên dưới 2 giờ, lượt làm của phiên mở;
  - khoá `exp_so`, tổng EXP, `omni_xac_nhan`, số lướt hôm nay;
  - `KHO_EM` (sổ làm bài trong ngăn, đã có).
- Nội dung theo phiên: câu, sơ đồ đạt, β, `omni_q`, `omni_vkn`, bổ trợ. Nạp ở câu đầu của chặng, kèm dấu `de:/q:/d:/lop:` từ bảng `dau_chung`.
- Nạp một lô (~14 câu) khi:
  - ngăn chưa có bản nhớ;
  - câu chặn lệch;
  - lệnh khác của em vừa ghi (`dem.khiGhi`);
  - phiên lạ.

## Lô ghi (một lượt gửi)
Thứ tự trong lô:
1. Câu chặn.
2. Các câu ghi hiện có, giữ nguyên: lượt làm (chặn revision), `loi_giai_hoi`, thưởng, hồ sơ `UPDATE … WHERE revision=?`, nhóm EXP, `$.nt` / trạm của phiên, dòng cuối chặng.
3. `su_kien_hoc`, chuyển từ việc nền vào cùng lô.
4. Câu đọc làm tươi cuối lô: `dau_em`, hồ sơ, phiên, lượt làm của phiên.

Ghi trễ (outbox, gom nhiều em vào một lô) là **B4**, chưa làm ở B2. Lý do:
- cron và thầy còn ghi thẳng hồ sơ, phiên, EXP;
- revision CAS phải giữ;
- đường lùi Worker và mốc chốt giải tuần vẫn đọc D1 trực tiếp.

## Bảo ngăn khi người khác ghi (trigger chỉ-thêm)
| bảng | người ghi ngoài ngăn | dấu |
|---|---|---|
| `game_v2_profile`, `game_v2_session`, `game_v2_scope` | `khien-mat.ts`, `on-lai-nop.ts`, `thu-hoi-chien-dich.ts`, `game-v2-reports.ts` | `dau_em.v` |
| `hoc_sinh` (mật khẩu, lớp, khoá, tên) | `goi-cu.ts`, `index.ts`, `ten-lop.ts` | `dau_em.v` + `lop:` |
| `exp_so`, `manh_khien_so`, `su_kien_hoc` INSERT | `chua-gon-lenh.ts`, `exp-d1.ts`, `dau-gio.ts`, `thang-tu-go.ts`, `su-kien-nap-lai.ts`, `luyen-de.ts` | `dau_em.v` |
| `su_kien_hoc` UPDATE/DELETE (mở giấu điểm) | như trên | `dau_em.vs` (nạp lại toàn bộ sổ) |
| `cau_hinh`, `game_v2_settings` | nhiều nơi | `dau_chung('ch')`, `dau_chung('mua')` |
| `ca` | các nơi gọi `xoaDemCaBaoVe` | `dau_chung('ca')` + đẩy tới ngăn chung |
| `de_kho`, `game_v2_index`, nội dung câu, `omni_vkn`, `bai_da_day`, `pham_vi_lop` | sửa đáp án, đồng bộ chỉ mục, tick bài | `de:`, `q:`, `d:`, `lop:` |

Ca thi:
- 16 ngăn chung `chung|i` đọc `dau_chung` mỗi giây: tổng 16 lượt/giây, không phụ thuộc số em.
- Ngăn chung tự tính `protectedQuestions`.
- Lệnh mở/đóng ca đẩy thẳng tới ngăn chung.
- ⇒ Chậm nhất khoảng 2 giây (nay đệm 5 giây).

## Chạy bóng và bật dần
Công tắc `BAT_TRA_LOI_NGAN`:
- vắng = đường cũ;
- `bong` = chạy bóng;
- `1` = bật;
- `ds:<sbd…>` / `pt:<n>` = bật theo danh sách / theo phần trăm.

Chạy bóng:
- Đường cũ vẫn đọc D1.
- Từng câu được so với bản nhớ: giá trị, kiểu, thứ tự.
- Lệch ⇒ ghi log `[tra-loi-bong]` gồm mẫu câu, bảng, kiểu lệch. Không ghi SBD hay nội dung.

Điều kiện bật: **0 lần «lệch khi dấu khớp» qua 3 tối cao điểm**. Sau khi bật, 1% lần trả lời chạy lại đường đọc cũ ở nền để so tiếp.

## Các PR nhỏ (câu / lượt gửi mỗi lần trả lời ổn định)
| bước | việc | sau bước |
|---|---|---|
| B2.0 | Đưa bài đo `do-lenh-nong` vào `tests/` làm cổng | 33 / 4 |
| B2.1 | Migration `dau_em`, `dau_chung`, `dau_em_kiem` + trigger; test mỗi nơi ghi tăng dấu | như cũ |
| B2.2 | Bản nhớ ngăn + trả câu đọc + chạy bóng; test thuộc tính (bản nhớ = D1 trên dữ liệu ngẫu nhiên) | như cũ |
| B2.3 | Bật cho dữ liệu riêng của em: câu chặn, làm tươi cuối lô, khoá trong ngăn | ~26 / 3 |
| B2.4 | `su_kien_hoc` vào lô; `phienDaXong`, `napPhienNhanh` từ bản nhớ | ~25 / 2 |
| B2.5 | Nội dung theo phiên + dấu | ~20 / 2 |
| B2.6 | Dùng tầng chung (B1) | **~15 / 1** |
| B2.7 | Bật dần tới 100% | — |

## Rủi ro chính
1. Thứ tự hay kiểu dòng khác khi suy ra thay vì nhớ nguyên: nhớ đúng kết quả câu SQL, có test thuộc tính và chạy bóng.
2. Trigger thêm việc ghi cho các việc hàng loạt (`khien-mat`, `su-kien-nap-lai`, reset): đo thời gian trước khi bật.
3. Sót trigger: chạy bóng phát hiện ở dạng «lệch khi dấu khớp».
4. Giá trị theo giờ (qua ngày, phiên hết hạn 2 giờ): khoá nhớ có ngày; ngăn chung tính lại mỗi giây.
5. Khoá trong ngăn đổi kết quả khi em bấm hai lần liền: lần sau thành «đã ghi», không còn báo «thiết bị khác».
6. Ngăn chung hỏng: lùi về đệm theo isolate như hôm nay.
