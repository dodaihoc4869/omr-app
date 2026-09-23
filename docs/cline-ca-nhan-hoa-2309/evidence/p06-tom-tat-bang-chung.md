# Bằng chứng P06 lát cắt 1–2 — hợp đồng chung cho mọi đường phát câu + cổng phạm vi cho đường đọc câu dùng chung

Ngày chạy: 2026-09-23 (21:30–21:42 +07:00). `sourceFingerprint`: `7fd852fcdaa8d2db61c1e79f6f951df988dda64d561b21c55193d44223567925`

| Lệnh | Exit | Kết quả | Artifact (sha256) |
|---|---|---|---|
| `vitest run tests/cnh-1-0-hop-dong-chung-p06.test.ts` | 0 | **5 PASS** | `p06-vitest-hop-dong-chung.log` — `76b7c18b29071eee6a82472eab8ea09cc159a6f8de6da14e547603e4635f4a50` |
| `vitest run tests/cnh-1-0-cong-pham-vi-doc-cau-p06.test.ts` | 0 | **4 PASS** | `p06-vitest-cong-pham-vi.log` — `4593484e5e718effcd5aa2de3af5d10b1b0fc9cd951cd93b6486790f00029881` |
| `vitest run tests/ha-tai-ke-hoach-ngay-2209.test.ts` (test ngân sách truy vấn đã bị đỏ do tôi, nay xanh lại) | 0 | 2 PASS | `p06-vitest-ha-tai.log` — `db9eb637384c4cc3ddee753d353b45dbe99a878a5683d2bb05beb9ece5c17f5a` |
| `tsc -b` (+ `tsc -p server`) | 0 | 0 lỗi | — |
| **toàn suite** `vitest run` | 1 (nợ cũ) | **742 tệp**: 707 xanh · **34 đỏ** · 1 skip | `p06-vitest-full.log` — `fdd4850594c1676d6104884ef4284994abc19b76fc312631119e73edeb1e3a89` |
| chạy LẠI T05/T06 + T32 theo fingerprint mới | 0 | 21 + 6 PASS | `p06-vitest-t05-t06.log` — `16ff8613138b0416c17a27e611feb32001fe081bc0d2eb4a688b8ed1b79dfc73` · `p06-vitest-t32.log` — `50ad3cb30f9b199a52235bf76b94cc14ec1d72aec3a4f940a21fef782f8a114e` |

## Đã chứng minh

- **Hợp đồng chung có danh sách**: `hop-dong-chung.ts` khai mọi **đường phát câu** với cách dùng hợp đồng
  (`engine` = 6/6 phần §7.1 · `ke_hoach` = bộ điều phối ngày · `ngoai_le` = **có TÊN** + nêu phạm vi).
  Test đối chiếu **hai chiều** với `server/src/index.ts`: đường khai phải có thật; đường nào khớp
  `MAU_PHAT_CAU` mà chưa khai ⇒ **test đỏ** (đây là cơ chế "không sót đường gọi").
- **Cổng phạm vi cá nhân cho đường đọc câu dùng chung** (`layCauChoEm` → `/hs/cau-theo-qid` + `/hs/on-lai/nop`):
  cờ `pham_vi_hoc` TẮT giữ nguyên hành vi; BẬT thì câu phải qua `eligibleScope` cho **chính em**
  (kỹ năng chưa `taught` ⇒ không phục vụ — chặn "đường lùi" nới phạm vi), quyền **TOÀN CHƯƠNG TRÌNH** do thầy cấp
  (kèm bằng chứng) mới mở, và nguồn lạ **không** cấp được quyền (chặn ở tầng sản phẩm).
  Lỗi đọc phạm vi ⇒ giữ nguyên (không làm trống việc ôn) và **không** ghi là đã kiểm.

## Hồi quy tôi gây ra và cách sửa (ghi lại để người nghiệm thu đối chiếu)

Lần đầu tôi thêm **một truy vấn riêng** trong `lapVaLuuKeHoach` để đọc lại mục tiêu đã đóng băng ⇒
`tests/ha-tai-ke-hoach-ngay-2209.test.ts` **đỏ** ("26 > 25 truy vấn"). Đã **gộp vào truy vấn `rk` có sẵn**
(không thêm truy vấn nào) và test xanh lại. Vì vậy toàn suite hiện đúng **34 tệp đỏ = bộ nợ cũ P00–P03**
(các tệp này đỏ cả khi chạy riêng, ví dụ `bo-nao-doc-2109`, `than-thu-*`, `btvn-ui-1609`).

## Còn lại của P06

- Mom/ôn/thử thách dùng **chung tổng tải** theo từng bước (thử thách/võ đài hiện là **ngoại lệ có tên**, chưa đi bộ chọn chung).
- Đoàn: đúng mức cá nhân, hạn mềm, continuing task, không chấm sai vì timeout (T29/T38/T39 + phần còn lại của T42).
