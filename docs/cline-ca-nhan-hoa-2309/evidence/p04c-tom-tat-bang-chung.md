# Bằng chứng P04 lát cắt 3 — luật lặp nối vào đường thật (T09/P04)

Ngày chạy: 2026-09-23 (20:34 +07:00). `sourceFingerprint`: `0c3ad9d0ac426997fc247cc3237a2c24b54e48080a4a1f509f4af5acd8b90cdb`.

| Lệnh | Exit | Kết quả | Log |
|---|---|---|---|
| `vitest run tests/cnh-1-0-bo-chon-that.test.ts` | 0 | **9 PASS** (3 ca luật lặp trên D1 thật) | `p05d-vitest-bo-chon-that.log` — `0dd9cd6dfe6bac154d9a8c543f1d544b626f7c765d0d2701e80e39c7dd82570c` |
| nhóm liên quan (52 tệp) | 0 | **711 PASS / 0 đỏ** | `p05d-vitest-nhom.log` — `9d788527d90e6548b4a99437ecd6674b6405cafc8f6995082b7900e61b899e9d` |

## Đã chứng minh

- **Bản sao bị chặn theo `content_group`**: câu KHÁC qid nhưng cùng `content_group` với câu đã có kết quả hôm nay ⇒ loại `DA_LAM_HOM_NAY` (đúng 02 §4.2.3: "cùng content_group đã trả lời hôm nay bị chặn").
- **Trần câu/lượt** áp theo đúng thứ tự nơi gọi đưa vào (câu thứ 7, 8 bị loại `TRAN_LUOT`).
- **Luật family KHÔNG áp** (kho chưa có nhãn) và điều đó được **khoá bằng test** để không âm thầm bỏ luật: 6 câu "chưa gán family" vẫn qua lượt.
